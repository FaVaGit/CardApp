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

        [HttpPost("connect")]
        public async Task<IActionResult> ConnectUser([FromBody] ConnectUserRequest request)
        {
            try
            {
                // If UserId is empty but Name is provided, create a new user ID
                string userId = request.UserId;
                if (string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(request.Name))
                {
                    userId = Guid.NewGuid().ToString();
                }
                
                // Use a default connection ID if not provided
                string connectionId = string.IsNullOrEmpty(request.ConnectionId) 
                    ? Guid.NewGuid().ToString() 
                    : request.ConnectionId;

                var status = await _presenceService.ConnectUserAsync(userId, connectionId);
                
                // Ensure the returned status has the correct userId
                if (status != null && string.IsNullOrEmpty(status.UserId))
                {
                    status.UserId = userId;
                }
                
                // Update user name if provided
                if (!string.IsNullOrEmpty(request.Name))
                {
                    await UpdateUserNameAsync(userId, request.Name, request.GameType);
                }
                
                // Get user's personal code for frontend display
                string? personalCode = null;
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                    var user = await context.Users.FindAsync(userId);
                    personalCode = user?.PersonalCode;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Failed to get personal code for user {userId}");
                }
                
                return Ok(new { success = true, status, personalCode });
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
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();

                var requester = await context.Users.FindAsync(dto.RequestingUserId);
                var target = await context.Users.FindAsync(dto.TargetUserId);
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
                    // After approval, create couple logically: requester uses target's code
                    var target = await context.Users.FindAsync(req.TargetUserId);
                    if (target != null)
                    {
                        var couple = await _coupleService.CreateOrJoinCoupleAsync(target.PersonalCode, req.RequestingUserId);
                        return Ok(new { success = true, approved = true, coupleId = couple?.Id });
                    }
                }

                return Ok(new { success = true, approved = dto.Approve });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to respond to join request");
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

    public class EndGameRequest
    {
        public string SessionId { get; set; } = string.Empty;
    }

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
}
