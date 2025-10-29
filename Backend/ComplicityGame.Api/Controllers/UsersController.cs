using Microsoft.AspNetCore.Mvc;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ComplicityGame.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserPresenceService _presenceService;
    private readonly GameDbContext _dbContext;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserPresenceService presenceService,
        GameDbContext dbContext,
        ILogger<UsersController> logger)
    {
        _presenceService = presenceService;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/users - Returns list of all registered users with online status
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        try
        {
            // Get all users from database
            var allUsers = await _dbContext.Users
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Nickname,
                    u.CreatedAt
                })
                .ToListAsync();

            // Get online users from presence service
            var connectedUsers = await _presenceService.GetConnectedUsersAsync();
            var onlineUserIds = connectedUsers.Select(u => u.UserId).ToHashSet();

            // Combine data
            var result = allUsers.Select(u => new
            {
                id = u.Id.ToString(),
                name = u.Name,
                nickname = u.Nickname,
                isOnline = onlineUserIds.Contains(u.Id.ToString()),
                createdAt = u.CreatedAt
            }).ToList();

            _logger.LogInformation($"Returning {result.Count} users ({onlineUserIds.Count} online)");
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get users");
            return StatusCode(500, new { error = "Failed to retrieve users" });
        }
    }

    /// <summary>
    /// GET /api/users/online - Returns only currently connected users
    /// </summary>
    [HttpGet("online")]
    public async Task<IActionResult> GetOnlineUsers()
    {
        try
        {
            var connectedUsers = await _presenceService.GetConnectedUsersAsync();
            
            var result = connectedUsers.Select(u => new
            {
                userId = u.UserId,
                connectionId = u.ConnectionId,
                connectedAt = u.ConnectedAt,
                status = u.Status.ToString(),
                coupleId = u.CoupleId,
                sessionId = u.SessionId
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get online users");
            return StatusCode(500, new { error = "Failed to retrieve online users" });
        }
    }

    /// <summary>
    /// GET /api/users/{id} - Get specific user by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            var status = await _presenceService.GetUserStatusAsync(id.ToString());

            return Ok(new
            {
                id = user.Id,
                name = user.Name,
                nickname = user.Nickname,
                createdAt = user.CreatedAt,
                isOnline = status?.IsConnected ?? false,
                status = status?.Status.ToString() ?? "Offline"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to get user {id}");
            return StatusCode(500, new { error = "Failed to retrieve user" });
        }
    }
}
