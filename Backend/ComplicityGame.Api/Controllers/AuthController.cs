using Microsoft.AspNetCore.Mvc;
using ComplicityGame.Api.Models;

namespace ComplicityGame.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly GameDbContext _ctx;
    public AuthController(GameDbContext ctx) { _ctx = ctx; }

    [HttpGet("ping")] // quick health/auth base check
    public IActionResult Ping() => Ok(new { ok = true, time = DateTime.UtcNow });

    [HttpPost("register")] // basic user creation (placeholder)
    public IActionResult Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { error = "Name richiesto" });
        var user = new ComplicityGame.Core.Models.User { Name = req.Name, GameType = req.GameType ?? "couple", PersonalCode = Guid.NewGuid().ToString("N").Substring(0,6) };
        _ctx.Users.Add(user);
        _ctx.SaveChanges();
        return Ok(new { success = true, user.Id, user.PersonalCode });
    }

    public record RegisterRequest(string Name, string? GameType);
}
