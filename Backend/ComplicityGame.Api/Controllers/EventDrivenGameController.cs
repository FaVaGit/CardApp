using Microsoft.AspNetCore.Mvc;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Events;
using ComplicityGame.Api.Models;
using Microsoft.Extensions.DependencyInjection;

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
                return Ok(new { success = true, status });
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
}
