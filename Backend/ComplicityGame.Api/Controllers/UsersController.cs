using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;
using ComplicityGame.Api.Hubs;

namespace ComplicityGame.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IHubContext<GameHub> _hubContext;

    public UsersController(IUserService userService, IHubContext<GameHub> hubContext)
    {
        _userService = userService;
        _hubContext = hubContext;
    }

    [HttpPost("register")]
    public async Task<ActionResult<User>> RegisterUser([FromBody] RegisterUserRequest request)
    {
        try
        {
            var user = await _userService.RegisterUserAsync(request.Name, request.GameType, request.Nickname);
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<User>> LoginUser([FromBody] LoginUserRequest request)
    {
        try
        {
            var user = await _userService.GetUserByCodeAsync(request.PersonalCode);
            if (user == null)
            {
                return NotFound(new { error = "Utente non trovato" });
            }

            // Update user presence
            await _userService.UpdateUserPresenceAsync(user.Id);
            
            // Notify all clients about user presence update via SignalR
            await _hubContext.Clients.All.SendAsync("userPresenceUpdated", user);
            
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<User>>> GetUsers([FromQuery] string? gameType = null)
    {
        try
        {
            var users = await _userService.GetOnlineUsersAsync(gameType);
            return Ok(users);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("join/{code}")]
    public async Task<ActionResult<User>> JoinByCode(string code)
    {
        try
        {
            var user = await _userService.GetUserByCodeAsync(code);
            if (user == null)
            {
                return NotFound(new { error = "Codice non valido" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{userId}/state")]
    public async Task<ActionResult<UserStateDto>> GetUserState(string userId)
    {
        try
        {
            var userState = await _userService.GetUserStateAsync(userId);
            if (userState == null)
            {
                return NotFound(new { error = "Utente non trovato" });
            }
            return Ok(userState);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{userId}/presence")]
    public async Task<ActionResult<User>> UpdatePresence(string userId)
    {
        try
        {
            var user = await _userService.UpdateUserPresenceAsync(userId);
            if (user == null)
            {
                return NotFound(new { error = "Utente non trovato" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{userId}/offline")]
    public async Task<IActionResult> SetOffline(string userId)
    {
        try
        {
            await _userService.SetUserOfflineAsync(userId);
            return Ok(new { message = "Utente impostato offline" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

// DTOs
public class RegisterUserRequest
{
    public string Name { get; set; } = string.Empty;
    public string GameType { get; set; } = string.Empty;
    public string? Nickname { get; set; }
}

public class LoginUserRequest
{
    public string PersonalCode { get; set; } = string.Empty;
}

// User State DTO with UI permissions
public class UserStateDto
{
    public User User { get; set; } = new();
    public Couple? CurrentCouple { get; set; }
    public GameSession? ActiveSession { get; set; }
    public List<User> OnlineUsers { get; set; } = new();
    public UserPermissions Permissions { get; set; } = new();
}

public class UserPermissions
{
    public bool CanJoinByCode { get; set; } = true;
    public bool CanViewUsers { get; set; } = true;
    public bool CanStartGameSession { get; set; } = false;
    public bool CanViewCouple { get; set; } = false;
    public bool CanLeaveCouple { get; set; } = false;
    public string DefaultTab { get; set; } = "join"; // "join", "users", "couple"
}
