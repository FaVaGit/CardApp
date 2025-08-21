using Microsoft.AspNetCore.Mvc;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;

namespace ComplicityGame.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
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
