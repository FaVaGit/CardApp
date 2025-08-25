using Microsoft.AspNetCore.Mvc;
using ComplicityGame.Api.Services;

namespace ComplicityGame.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICoupleService _coupleService;
    private readonly IGameSessionService _gameSessionService;

    public AdminController(
        IUserService userService,
        ICoupleService coupleService,
        IGameSessionService gameSessionService)
    {
        _userService = userService;
        _coupleService = coupleService;
        _gameSessionService = gameSessionService;
    }

    [HttpPost("clear-users")]
    public async Task<ActionResult> ClearAllUsers()
    {
        try
        {
            await _userService.ClearAllUsersAsync();
            return Ok(new { message = "All users cleared successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("reset-system")]
    public async Task<ActionResult> ResetSystem()
    {
        try
        {
            await _userService.ClearAllUsersAsync();
            return Ok(new { message = "System reset successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("force-refresh")]
    public async Task<ActionResult> ForceRefresh()
    {
        try
        {
            // This endpoint is used by frontend to trigger data refresh
            // It doesn't need to do anything specific, just signal that refresh is requested
            return Ok(new { message = "Data refresh triggered" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
