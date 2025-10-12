using Microsoft.AspNetCore.Mvc;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Events;
using ComplicityGame.Api.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace ComplicityGame.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventDrivenGameController : ControllerBase
    {
        private readonly IUserPresenceService _presenceService;
        private readonly ICoupleMatchingService _coupleService;
        private readonly IGameSessionService _gameService;
        private readonly IEventPublisher _eventPublisher;
        private readonly ILogger<EventDrivenGameController> _logger;
        private readonly IServiceProvider _serviceProvider;
    private static readonly SemaphoreSlim _nameLock = new(1,1);

        public EventDrivenGameController(
            IUserPresenceService presenceService,
            ICoupleMatchingService coupleService,
            IGameSessionService gameService,
            IEventPublisher eventPublisher,
            ILogger<EventDrivenGameController> logger,
            IServiceProvider serviceProvider)
        {
            _presenceService = presenceService;
            _coupleService = coupleService;
            _gameService = gameService;
            _eventPublisher = eventPublisher;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        private static string? NormalizeName(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            // Collapse internal multiple spaces, trim, keep casing for display but compare case-insensitive
            var trimmed = string.Join(" ", raw.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));
            return trimmed.Length == 0 ? null : trimmed;
        }

        [HttpPost("connect")]
        public async Task<IActionResult> ConnectUser([FromBody] ConnectUserRequest request)
        {
            try
            {
                var incomingNameRaw = request.Name?.Trim();
                var incomingName = NormalizeName(incomingNameRaw);
                var incomingGameType = string.IsNullOrWhiteSpace(request.GameType) ? "couple" : request.GameType.Trim();

                // Determine / generate / reuse userId
                string userId;
                bool explicitUserId = !string.IsNullOrWhiteSpace(request.UserId);
                await _nameLock.WaitAsync();
                try
                {
                    if (explicitUserId)
                    {
                        userId = request.UserId!.Trim();
                    }
                    else
                    {
                        if (!string.IsNullOrWhiteSpace(incomingName))
                        {
                            using (var preScope = _serviceProvider.CreateScope())
                            {
                                var preContext = preScope.ServiceProvider.GetRequiredService<GameDbContext>();
                                var existingSameName = await preContext.Users
                                    .Where(u => u.Name.ToLower() == incomingName.ToLower())
                                    .OrderBy(u => u.CreatedAt)
                                    .FirstOrDefaultAsync();
                                if (existingSameName != null)
                                {
                                    userId = existingSameName.Id; // reuse
                                    _logger.LogInformation("[Connect] Reusing existing userId {UserId} for name {Name}", userId, incomingName);
                                }
                                else
                                {
                                    userId = Guid.NewGuid().ToString();
                                }
                            }
                        }
                        else
                        {
                            userId = Guid.NewGuid().ToString();
                        }
                    }
                }
                finally { _nameLock.Release(); }
                string connectionId = string.IsNullOrWhiteSpace(request.ConnectionId) ? Guid.NewGuid().ToString() : request.ConnectionId.Trim();

                _logger.LogInformation("[Connect] userId={UserId} name={Name} gameType={GameType}", userId, incomingName, incomingGameType);

                ComplicityGame.Core.Models.User? userEntity;
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                    userEntity = await context.Users.FindAsync(userId);
                    if (userEntity == null)
                    {
                        userEntity = new ComplicityGame.Core.Models.User
                        {
                            Id = userId,
                            Name = string.IsNullOrWhiteSpace(incomingName) ? $"User_{userId[..6]}" : incomingName!,
                            GameType = incomingGameType,
                            PersonalCode = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpperInvariant(),
                            AuthToken = Guid.NewGuid().ToString(),
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                            IsOnline = true
                        };
                        context.Users.Add(userEntity);
                        await context.SaveChangesAsync();
                        _logger.LogInformation("[Connect] Created new user {UserId} code={Code}", userEntity.Id, userEntity.PersonalCode);
                    }
                    else
                    {
                        // Update name or game type if changed
                        bool changed = false;
                        if (!string.IsNullOrWhiteSpace(incomingName) && userEntity.Name != incomingName)
                        { userEntity.Name = incomingName; changed = true; }
                        if (userEntity.GameType != incomingGameType)
                        { userEntity.GameType = incomingGameType; changed = true; }
                        userEntity.IsOnline = true;
                        userEntity.LastSeen = DateTime.UtcNow;
                        userEntity.UpdatedAt = DateTime.UtcNow;
                        if (changed) await context.SaveChangesAsync();
                    }
                }

                // Presence layer (idempotent)
                var status = await _presenceService.ConnectUserAsync(userId, connectionId);
                if (status != null && string.IsNullOrEmpty(status.UserId)) status.UserId = userId;

                return Ok(new
                {
                    success = true,
                    status,
                    personalCode = userEntity!.PersonalCode,
                    authToken = userEntity.AuthToken,
                    userId = userEntity.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to connect user {request.UserId}");
                return BadRequest(new { error = ex.Message });
            }
        }

        private async Task UpdateUserNameAsync(string userId, string name, string gameType)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                
                var user = await context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.Name = name;
                    if (!string.IsNullOrEmpty(gameType))
                    {
                        user.GameType = gameType;
                    }
                    user.UpdatedAt = DateTime.UtcNow;
                    await context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Failed to update user name for {userId}");
            }
        }

        [HttpPost("disconnect")]
        public async Task<IActionResult> DisconnectUser([FromBody] DisconnectUserRequest request)
        {
            try
            {
                await _presenceService.DisconnectUserAsync(request.ConnectionId);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to disconnect user {request.ConnectionId}");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("join-couple")]
        public async Task<IActionResult> JoinCouple([FromBody] JoinCoupleEventRequest request)
        {
            try
            {
                var couple = await _coupleService.CreateOrJoinCoupleAsync(request.UserCode, request.UserId);
                
                if (couple == null)
                {
                    return BadRequest(new { error = "Failed to create or join couple" });
                }

                // Auto-start game if couple is complete
                if (couple.Members.Count == 2)
                {
                    var gameSession = await _gameService.StartGameAsync(couple.Id.ToString());
                    
                    return Ok(new { 
                        success = true, 
                        couple = new { 
                            id = couple.Id, 
                            code = couple.Name, 
                            memberCount = couple.Members.Count 
                        },
                        gameSession = gameSession != null ? new {
                            id = gameSession.Id,
                            isActive = gameSession.IsActive,
                            createdAt = gameSession.CreatedAt
                        } : null
                    });
                }

                return Ok(new { 
                    success = true, 
                    couple = new { 
                        id = couple.Id, 
                        code = couple.Name, 
                        memberCount = couple.Members.Count 
                    },
                    waitingForPartner = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to join couple for user {request.UserId} with code {request.UserCode}");
                return BadRequest(new { error = ex.Message });
            }
        }

        // NEW: Request to pair with a user (approval workflow)
        [HttpPost("request-join")]
        public async Task<IActionResult> RequestJoin([FromBody] JoinRequestDto dto)
        {
            try
            {
                // Simple in-memory rate limiting (per process). For multi-instance deployment replace with distributed cache.
                // Key: requester|target  Value: list of timestamps within window
                const int RATE_LIMIT = 5; // max attempts
                var window = TimeSpan.FromSeconds(30);
                var key = $"{dto.RequestingUserId}|{dto.TargetUserId}";
                var now = DateTime.UtcNow;
                // Use static dictionary to persist across requests in same process
                var store = RateLimitStore.JoinRequestAttempts;
                lock (store)
                {
                    if (!store.TryGetValue(key, out var list))
                    {
                        list = new List<DateTime>();
                        store[key] = list;
                    }
                    // Remove expired entries
                    list.RemoveAll(t => now - t > window);
                    if (list.Count >= RATE_LIMIT)
                    {
                        var retryAfter = (int)Math.Ceiling((window - (now - list.First())).TotalSeconds);
                        Response.Headers["Retry-After"] = retryAfter.ToString();
                        return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "Limite richieste pairing superato", limit = RATE_LIMIT, windowSeconds = (int)window.TotalSeconds, retryAfterSeconds = retryAfter });
                    }
                    list.Add(now);
                }
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();

                var requester = await context.Users.FindAsync(dto.RequestingUserId);
                var target = await context.Users.FindAsync(dto.TargetUserId);
                _logger.LogInformation($"RequestJoin: requester={requester?.Id} ({requester?.Name}), target={target?.Id} ({target?.Name})");
                if (requester == null || target == null)
                    return BadRequest(new { error = "Utente non trovato" });

                // Check existing active request
                var existing = await context.CoupleJoinRequests
                    .FirstOrDefaultAsync(r => r.RequestingUserId == dto.RequestingUserId && r.TargetUserId == dto.TargetUserId && r.Status == "Pending");
                if (existing != null)
                    return Ok(new { success = true, requestId = existing.Id, status = existing.Status });

                var joinReq = new CoupleJoinRequest
                {
                    RequestingUserId = dto.RequestingUserId,
                    TargetUserId = dto.TargetUserId,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };
                context.CoupleJoinRequests.Add(joinReq);
                await context.SaveChangesAsync();

                // Emit event (reuse publisher) - simplified
                await _eventPublisher.PublishToUserAsync(new CoupleCreatedEvent
                {
                    UserId = dto.TargetUserId,
                    CoupleId = joinReq.Id,
                    CoupleCode = "JOIN_REQUEST",
                    CreatedAt = DateTime.UtcNow
                }, dto.TargetUserId);

                return Ok(new { success = true, requestId = joinReq.Id, status = joinReq.Status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create join request");
                return BadRequest(new { error = ex.Message });
            }
        }
        private static class RateLimitStore
        {
            public static readonly Dictionary<string, List<DateTime>> JoinRequestAttempts = new();
        }

        [HttpPost("respond-join")]
        public async Task<IActionResult> RespondJoin([FromBody] RespondJoinDto dto)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                var req = await context.CoupleJoinRequests.FindAsync(dto.RequestId);
                if (req == null || req.Status != "Pending")
                    return BadRequest(new { error = "Richiesta non trovata o già gestita" });
                if (req.TargetUserId != dto.TargetUserId)
                    return BadRequest(new { error = "Non autorizzato" });

                req.Status = dto.Approve ? "Approved" : "Rejected";
                req.RespondedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();

                if (dto.Approve)
                {
                    // Dopo approvazione: crea/aggancia la coppia
                    var target = await context.Users.FindAsync(req.TargetUserId);
                    if (target != null)
                    {
                        var couple = await _coupleService.CreateOrJoinCoupleAsync(target.PersonalCode, req.RequestingUserId);
                        string? coupleId = couple?.Id.ToString();

                        // Se coppia completata (2 membri) avvia automaticamente la sessione di gioco
                        object? gameSession = null;
                        if (couple != null && couple.Members.Count == 2)
                        {
                            // Prima di avviare la sessione forziamo l'aggiornamento della presence per entrambi i membri
                            // in modo che la successiva chiamata snapshot/status del richiedente trovi subito CoupleId valorizzato.
                            try
                            {
                                foreach (var m in couple.Members)
                                {
                                    var refreshed = await _presenceService.GetUserStatusAsync(m.UserId);
                                    // (presence refresh eseguito - log rimosso in produzione)
                                }
                            }
                            catch (Exception presEx)
                            {
                                _logger.LogDebug(presEx, "Refresh presence post-couple failed (non blocking)");
                            }

                            var started = await _gameService.StartGameAsync(couple.Id.ToString());
                            if (started != null)
                            {
                                gameSession = new { id = started.Id, isActive = started.IsActive, createdAt = started.CreatedAt };
                                try
                                {
                                    // Notifica entrambi i membri con evento dedicato di avvio sessione
                                    foreach (var m in couple.Members)
                                    {
                                        await _eventPublisher.PublishToUserAsync(new GameSessionStartedEvent
                                        {
                                            SessionId = started.Id.ToString(),
                                            CoupleId = couple.Id.ToString(),
                                            StartedAt = DateTime.UtcNow
                                        }, m.UserId);
                                    }
                                }
                                catch (Exception pubEx)
                                {
                                    _logger.LogWarning(pubEx, "Publish GameSessionStarted events failed (non blocking)");
                                }
                            }
                        }

                        // Pulisci eventuali richieste pendenti incrociate rimaste tra i due utenti per evitare stato sporco
                        try
                        {
                            var leftovers = await context.CoupleJoinRequests
                                .Where(r => (r.RequestingUserId == req.RequestingUserId && r.TargetUserId == req.TargetUserId) ||
                                            (r.RequestingUserId == req.TargetUserId && r.TargetUserId == req.RequestingUserId))
                                .Where(r => r.Status == "Pending")
                                .ToListAsync();
                            if (leftovers.Any())
                            {
                                foreach (var l in leftovers)
                                {
                                    l.Status = "Cancelled"; l.RespondedAt = DateTime.UtcNow;
                                }
                                await context.SaveChangesAsync();
                            }
                        }
                        catch (Exception cleanEx)
                        {
                            _logger.LogWarning(cleanEx, "Cleanup richieste join pendenti fallito (non bloccante)");
                        }

                        // Costruisci partnerInfo da restituire subito al target (approvatore) e al requester (front-end lo userà)
                        object? partnerInfo = null;
                        try {
                            if (couple != null && couple.Members.Count == 2)
                            {
                                var partner = couple.Members.FirstOrDefault(m => m.UserId == req.RequestingUserId) ?? couple.Members.FirstOrDefault(m => m.UserId != dto.TargetUserId);
                                if (partner?.User != null)
                                {
                                    partnerInfo = new { userId = partner.User.Id, name = partner.User.Name, personalCode = partner.User.PersonalCode };
                                }
                            }
                        } catch (Exception buildPartnerEx) {
                            _logger.LogDebug(buildPartnerEx, "RespondJoin partnerInfo build failed (non blocking)");
                        }
                        return Ok(new { success = true, approved = true, coupleId, gameSession, partnerInfo });
                    }
                }

                return Ok(new { success = true, approved = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to respond to join request");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("cancel-join")]
        public async Task<IActionResult> CancelJoin([FromBody] CancelJoinDto dto)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                var req = await context.CoupleJoinRequests
                    .FirstOrDefaultAsync(r => r.RequestingUserId == dto.RequestingUserId && r.TargetUserId == dto.TargetUserId && r.Status == "Pending");
                if (req == null) return Ok(new { success = true, cancelled = false });
                req.Status = "Cancelled";
                req.RespondedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
                return Ok(new { success = true, cancelled = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel join request");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("start-game")]
        public async Task<IActionResult> StartGame([FromBody] StartGameRequest request)
        {
            try
            {
                var gameSession = await _gameService.StartGameAsync(request.CoupleId);
                
                if (gameSession == null)
                {
                    return BadRequest(new { error = "Failed to start game - couple not found or incomplete" });
                }

                return Ok(new { 
                    success = true, 
                    gameSession = new {
                        id = gameSession.Id,
                        isActive = gameSession.IsActive,
                        createdAt = gameSession.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to start game for couple {request.CoupleId}");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("draw-card")]
        public async Task<IActionResult> DrawCard([FromBody] DrawCardRequest request)
        {
            try
            {
                var card = await _gameService.DrawCardAsync(request.SessionId, request.UserId);
                
                if (card == null)
                {
                    return BadRequest(new { error = "No cards available or unauthorized" });
                }

                return Ok(new { 
                    success = true, 
                    card = new {
                        id = card.Id,
                        gameType = card.GameType,
                        category = card.Category,
                        content = card.Content,
                        level = card.Level
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to draw card for user {request.UserId} in session {request.SessionId}");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("end-game")]
        public async Task<IActionResult> EndGame([FromBody] EndGameRequest request)
        {
            try
            {
                var success = await _gameService.EndGameAsync(request.SessionId);
                return Ok(new { success });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to end game session {request.SessionId}");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("user-status/{userId}")]
        public async Task<IActionResult> GetUserStatus(string userId)
        {
            try
            {
                var status = await _presenceService.GetUserStatusAsync(userId);
                
                // Enhanced status with game session info and partner info
                object? gameSession = null;
                object? partnerInfo = null;
                
                if (status != null && !string.IsNullOrEmpty(status.CoupleId))
                {
                    using var scope = _serviceProvider.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                    
                    // Get partner information
                    var couple = await context.Couples
                        .Include(c => c.Members)
                        .ThenInclude(cu => cu.User)
                        .FirstOrDefaultAsync(c => c.Id.ToString() == status.CoupleId);
                        
                    if (couple != null)
                    {
                        var partner = couple.Members.FirstOrDefault(m => m.UserId != userId);
                        if (partner != null && partner.User != null)
                        {
                            partnerInfo = new {
                                userId = partner.User.Id,
                                name = partner.User.Name,
                                personalCode = partner.User.PersonalCode
                            };
                        }
                        // Fallback: se non ancora valorizzato ma i membri sono 2 e le navigation potrebbero non essere materializzate
                        if (partnerInfo == null && couple.Members.Count == 2)
                        {
                            try {
                                var other = couple.Members.FirstOrDefault(m => m.UserId != userId);
                                if (other != null)
                                {
                                    // Se navigation non caricata, recupera utente direttamente
                                    if (other.User == null)
                                    {
                                        // For EF Core nullable navigation: assegniamo eventuale risultato; se rimane null gestito sotto
                                        var fetchedUser = await context.Users.FirstOrDefaultAsync(u => u.Id == other.UserId);
                                        if (fetchedUser != null)
                                        {
                                            other.User = fetchedUser; // safe assignment
                                        }
                                    }
                                    var ou = other.User; // local var per evitare race cond su navigation
                                    if (ou != null)
                                    {
                                        partnerInfo = new { userId = ou.Id, name = ou.Name, personalCode = ou.PersonalCode };
                                        _logger.LogDebug("[FallbackPartner] Ricostruito partnerInfo via query diretta per userId={UserId}", userId);
                                    }
                                }
                            } catch (Exception fallbackEx) {
                                _logger.LogDebug(fallbackEx, "[FallbackPartner] Fallito (non blocking)");
                            }
                        }
                    }
                    
                    var activeSession = await _gameService.GetActiveSessionAsync(status.CoupleId);
                    if (activeSession != null)
                    {
                        // Include shared cards for synchronization
                        var sharedCards = await context.SharedCards
                            .Where(sc => sc.SessionId == activeSession.Id)
                            .OrderBy(sc => sc.SharedAt)
                            .Select(sc => new {
                                id = sc.Id,
                                cardData = sc.CardData,
                                sharedAt = sc.SharedAt,
                                sharedById = sc.SharedById
                            })
                            .ToListAsync();

                        gameSession = new {
                            id = activeSession.Id,
                            isActive = activeSession.IsActive,
                            sharedCards = sharedCards
                        };
                    }
                }
                
                return Ok(new { 
                    success = true, 
                    status,
                    gameSession,
                    partnerInfo
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get status for user {userId}");
                return BadRequest(new { error = ex.Message });
            }
        }

        // ==== New authentication & pairing support endpoints ==== 
        [HttpPost("reconnect")]
        public async Task<IActionResult> Reconnect([FromBody] ReconnectRequest req)
        {
            try
            {
                string? personalCode = null; string? authToken = null; string? userId = null;
                // First scope only for DB lookup
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                    var user = await context.Users.FirstOrDefaultAsync(u => u.Id == req.UserId && u.AuthToken == req.AuthToken);
                    if (user == null)
                    {
                        return Ok(new { success = false, error = "Token o utente non valido" });
                    }
                    personalCode = user.PersonalCode; authToken = user.AuthToken; userId = user.Id;
                } // dispose context before presence connect to avoid concurrency

                var status = await _presenceService.ConnectUserAsync(userId!, Guid.NewGuid().ToString());
                return Ok(new { success = true, status, personalCode, authToken });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Reconnect failed");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("available-users/{userId}")]
        public async Task<IActionResult> GetAvailableUsers(string userId)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                await EnsureCoupleJoinRequestsTableAsync();

                // Aggiorna LastSeen del richiedente e ripulisce utenti stantii (es. tab chiusa senza disconnect)
                var nowUtc = DateTime.UtcNow;
                var requester = await context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (requester != null)
                {
                    requester.LastSeen = nowUtc;
                    requester.IsOnline = true; // heartbeat implicito
                }

                // Criterio utente stantio: LastSeen assente o più vecchio di 5 minuti
                var staleThreshold = nowUtc.AddMinutes(-5);
                var staleUsers = await context.Users
                    .Where(u => u.IsOnline && (u.LastSeen == default || u.LastSeen < staleThreshold))
                    .ToListAsync();
                if (staleUsers.Count > 0)
                {
                    foreach (var su in staleUsers)
                    {
                        su.IsOnline = false; // marca offline
                    }
                }
                if (requester != null || staleUsers.Count > 0)
                {
                    try { await context.SaveChangesAsync(); } catch { /* best effort */ }
                }

                // Include also the requesting user (so frontend can show "Tu")
                var users = await context.Users
                    // Solo altri utenti (escludi se stesso)
                    .Where(u => u.IsOnline && u.Id != userId)
                    .OrderBy(u => u.Name)
                    .Select(u => new {
                        // Use a single consistent casing to avoid System.Text.Json collisions
                        id = u.Id,
                        name = u.Name,
                        personalCode = u.PersonalCode,
                        isOnline = u.IsOnline,
                        availableForPairing = u.AvailableForPairing,
                        isSelf = false
                    }).ToListAsync();

                var outbound = await context.CoupleJoinRequests
                    .Where(r => r.RequestingUserId == userId && r.Status == "Pending")
                    .Select(r => r.TargetUserId).ToListAsync();

                var inbound = await context.CoupleJoinRequests
                    .Where(r => r.TargetUserId == userId && r.Status == "Pending")
                    .Select(r => r.RequestingUserId).ToListAsync();

                return Ok(new { success = true, users, outbound, inbound });
            }
            catch (Exception ex)
            {
                // Auto-create table if missing (dev convenience when model evolves)
                if (ex.Message.Contains("no such table: CoupleJoinRequests", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        await EnsureCoupleJoinRequestsTableAsync();
                        // Retry once
                        using var scope2 = _serviceProvider.CreateScope();
                        var context2 = scope2.ServiceProvider.GetRequiredService<GameDbContext>();
                        var users = await context2.Users
                            .Where(u => u.IsOnline && u.Id != userId)
                            .OrderBy(u => u.Name)
                            .Select(u => new {
                                id = u.Id,
                                name = u.Name,
                                personalCode = u.PersonalCode,
                                isOnline = u.IsOnline,
                                availableForPairing = u.AvailableForPairing,
                                isSelf = false
                            }).ToListAsync();

                        var outbound = await context2.CoupleJoinRequests
                            .Where(r => r.RequestingUserId == userId && r.Status == "Pending")
                            .Select(r => r.TargetUserId).ToListAsync();

                        var inbound = await context2.CoupleJoinRequests
                            .Where(r => r.TargetUserId == userId && r.Status == "Pending")
                            .Select(r => r.RequestingUserId).ToListAsync();
                        return Ok(new { success = true, users, outbound, inbound, createdTable = true });
                    }
                    catch (Exception ex2)
                    {
                        _logger.LogError(ex2, "Failed after creating CoupleJoinRequests table");
                        return BadRequest(new { error = ex2.Message });
                    }
                }
                _logger.LogError(ex, "Failed to list available users");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("join-requests/{userId}")]
        public async Task<IActionResult> GetJoinRequests(string userId)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                await EnsureCoupleJoinRequestsTableAsync();
                var expiryMinutes = 10; // configurable
                var expiryThreshold = DateTime.UtcNow.AddMinutes(-expiryMinutes);

                // Expire old pending requests
                var expired = await context.CoupleJoinRequests
                    .Where(r => r.Status == "Pending" && r.CreatedAt < expiryThreshold)
                    .ToListAsync();
                if (expired.Any())
                {
                    foreach (var e in expired) e.Status = "Expired";
                    await context.SaveChangesAsync();
                }

                var incoming = await context.CoupleJoinRequests
                    .Where(r => r.TargetUserId == userId && r.Status == "Pending")
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new { r.Id, r.RequestingUserId, r.CreatedAt })
                    .ToListAsync();
                var outgoing = await context.CoupleJoinRequests
                    .Where(r => r.RequestingUserId == userId && r.Status == "Pending")
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new { r.Id, r.TargetUserId, r.CreatedAt })
                    .ToListAsync();
                return Ok(new { success = true, incoming, outgoing, expiresAfterMinutes = expiryMinutes });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("no such table: CoupleJoinRequests", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        await EnsureCoupleJoinRequestsTableAsync();
                        // Retry once
                        using var scope2 = _serviceProvider.CreateScope();
                        var context2 = scope2.ServiceProvider.GetRequiredService<GameDbContext>();
                        var incoming = await context2.CoupleJoinRequests
                            .Where(r => r.TargetUserId == userId && r.Status == "Pending")
                            .OrderByDescending(r => r.CreatedAt)
                            .Select(r => new { r.Id, r.RequestingUserId, r.CreatedAt })
                            .ToListAsync();
                        var outgoing = await context2.CoupleJoinRequests
                            .Where(r => r.RequestingUserId == userId && r.Status == "Pending")
                            .OrderByDescending(r => r.CreatedAt)
                            .Select(r => new { r.Id, r.TargetUserId, r.CreatedAt })
                            .ToListAsync();
                        return Ok(new { success = true, incoming, outgoing, expiresAfterMinutes = 10, createdTable = true });
                    }
                    catch (Exception ex2)
                    {
                        _logger.LogError(ex2, "Failed after creating CoupleJoinRequests table (join-requests)");
                        return BadRequest(new { error = ex2.Message });
                    }
                }
                _logger.LogError(ex, "Failed to get join requests");
                return BadRequest(new { error = ex.Message });
            }
        }

        private async Task EnsureCoupleJoinRequestsTableAsync()
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                using var conn = context.Database.GetDbConnection();
                await conn.OpenAsync();
                using var check = conn.CreateCommand();
                check.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='CoupleJoinRequests'";
                var exists = await check.ExecuteScalarAsync();
                if (exists == null)
                {
                    // Split creation to avoid multi-statement issues
                    using (var createTbl = conn.CreateCommand())
                    {
                        createTbl.CommandText = @"CREATE TABLE CoupleJoinRequests (
 Id TEXT PRIMARY KEY,
 RequestingUserId TEXT NOT NULL,
 TargetUserId TEXT NOT NULL,
 Status TEXT NOT NULL,
 CreatedAt TEXT NOT NULL,
 RespondedAt TEXT NULL
);";
                        await createTbl.ExecuteNonQueryAsync();
                    }
                    using (var createIdx = conn.CreateCommand())
                    {
                        createIdx.CommandText = "CREATE INDEX IDX_CoupleJoin_Target_Status ON CoupleJoinRequests (TargetUserId, Status);";
                        await createIdx.ExecuteNonQueryAsync();
                    }
                    _logger.LogInformation("[SchemaPatch] Created CoupleJoinRequests table on demand");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "EnsureCoupleJoinRequestsTableAsync failed");
                throw;
            }
        }

        // Aggregated snapshot to reduce polling calls
        [HttpGet("snapshot/{userId}")]
        public async Task<IActionResult> GetSnapshot(string userId)
        {
            try
            {
                // Anti caching headers (client must always fetch fresh snapshot)
                Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
                Response.Headers["Pragma"] = "no-cache";
                Response.Headers["Expires"] = "0";
                // Reuse status logic
                var statusResult = await GetUserStatus(userId) as OkObjectResult;
                if (statusResult == null) return BadRequest(new { error = "Status non disponibile" });
                dynamic statusPayload = statusResult.Value!;

                // Available users (including self)
                var usersResult = await GetAvailableUsers(userId) as OkObjectResult;
                dynamic? usersPayload = usersResult?.Value;

                // Join requests
                var jrResult = await GetJoinRequests(userId) as OkObjectResult;
                dynamic? jrPayload = jrResult?.Value;

                // Make sure we add lowercase duplicates for compatibility
                var users = usersPayload?.users;
                if (users != null)
                {
                    try
                    {
                        _logger.LogInformation($"Snapshot returning {users.Count} users for userId={userId}");
                        foreach (var u in users)
                        {
                            // Proprietà in minuscolo dopo la semplificazione
                            _logger.LogDebug($"User in snapshot: {u.name}({u.personalCode}) id={u.id}");
                        }
                    }
                    catch (Exception logEx)
                    {
                        _logger.LogDebug(logEx, "Snapshot logging failed (non blocking)");
                    }
                }
                
                return Ok(new {
                    success = true,
                    status = statusPayload.status,
                    gameSession = statusPayload.gameSession,
                    partnerInfo = statusPayload.partnerInfo,
                    users = usersPayload?.users,
                    outbound = usersPayload?.outbound,
                    inbound = usersPayload?.inbound,
                    incomingRequests = jrPayload?.incoming,
                    outgoingRequests = jrPayload?.outgoing,
                    expiresAfterMinutes = jrPayload?.expiresAfterMinutes
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to build snapshot");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest req)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                var user = await context.Users.FirstOrDefaultAsync(u => u.Id == req.UserId && u.AuthToken == req.AuthToken);
                if (user == null) return BadRequest(new { error = "Token non valido" });
                // Rotate token to invalidate old sessions
                user.AuthToken = Guid.NewGuid().ToString();
                user.IsOnline = false;
                await context.SaveChangesAsync();
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Logout failed");
                return BadRequest(new { error = ex.Message });
            }
        }

    [HttpGet("health")]
    public IActionResult Health() => Ok(new { ok = true, time = DateTime.UtcNow });

    }

    // Request DTOs
    public class ConnectUserRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string ConnectionId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string GameType { get; set; } = string.Empty;
    }

    public class DisconnectUserRequest
    {
        public string ConnectionId { get; set; } = string.Empty;
    }

    public class JoinCoupleEventRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string UserCode { get; set; } = string.Empty;
    }

    public class StartGameRequest
    {
        public string CoupleId { get; set; } = string.Empty;
    }

    public class DrawCardRequest
    {
        public string SessionId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }

    public class EndGameRequest { public string SessionId { get; set; } = string.Empty; }

    public class ReconnectRequest { public string UserId { get; set; } = string.Empty; public string AuthToken { get; set; } = string.Empty; }
    public class LogoutRequest { public string UserId { get; set; } = string.Empty; public string AuthToken { get; set; } = string.Empty; }
    // Join approval workflow DTOs
    public class JoinRequestDto
    {
        public string RequestingUserId { get; set; } = string.Empty;
        public string TargetUserId { get; set; } = string.Empty;
    }

    public class RespondJoinDto
    {
        public string RequestId { get; set; } = string.Empty;
        public string TargetUserId { get; set; } = string.Empty; // who approves
        public bool Approve { get; set; }
    }
    public class CancelJoinDto
    {
        public string RequestingUserId { get; set; } = string.Empty;
        public string TargetUserId { get; set; } = string.Empty;
    }
}
