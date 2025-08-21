using Microsoft.AspNetCore.Mvc;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;

namespace ComplicityGame.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly IGameSessionService _gameSessionService;
    private readonly ICoupleService _coupleService;
    private readonly ICardService _cardService;

    public GameController(
        IGameSessionService gameSessionService,
        ICoupleService coupleService,
        ICardService cardService)
    {
        _gameSessionService = gameSessionService;
        _coupleService = coupleService;
        _cardService = cardService;
    }

    [HttpPost("sessions")]
    public async Task<ActionResult<GameSession>> CreateSession([FromBody] CreateSessionRequest request)
    {
        try
        {
            var session = await _gameSessionService.CreateSessionAsync(
                request.CoupleId, 
                request.CreatedBy, 
                request.SessionType);
            return Ok(session);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("sessions/{sessionId}")]
    public async Task<ActionResult<GameSession>> GetSession(string sessionId)
    {
        try
        {
            var session = await _gameSessionService.GetSessionAsync(sessionId);
            if (session == null)
            {
                return NotFound(new { error = "Sessione non trovata" });
            }
            return Ok(session);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("sessions/couple/{coupleId}")]
    public async Task<ActionResult<GameSession>> GetActiveSessionByCouple(string coupleId)
    {
        try
        {
            var session = await _gameSessionService.GetActiveSessionByCoupleAsync(coupleId);
            if (session == null)
            {
                return NotFound(new { error = "Nessuna sessione attiva trovata" });
            }
            return Ok(session);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("couples")]
    public async Task<ActionResult<Couple>> CreateCouple([FromBody] CreateCoupleRequest request)
    {
        try
        {
            var couple = await _coupleService.CreateCoupleAsync(
                request.Name, 
                request.CreatedBy, 
                request.GameType);
            return Ok(couple);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

        [HttpPost("couples/by-code")]
    public async Task<ActionResult<Couple>> CreateCoupleByCode([FromBody] CreateCoupleByCodeRequest request)
    {
        try
        {
            var couple = await _coupleService.CreateCoupleByCodeAsync(
                request.CurrentUserId, 
                request.TargetUserCode,
                request.Name);
            return Ok(couple);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("couples/{coupleId}/join")]
    public async Task<ActionResult<Couple>> JoinCouple(string coupleId, [FromBody] JoinCoupleRequest request)
    {
        try
        {
            var couple = await _coupleService.AddUserToCoupleAsync(coupleId, request.UserId, "member");
            if (couple == null)
            {
                return NotFound(new { error = "Coppia non trovata" });
            }
            return Ok(couple);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("couples")]
    public async Task<ActionResult<List<Couple>>> GetAllCouples()
    {
        try
        {
            var couples = await _coupleService.GetAllCouplesAsync();
            return Ok(couples);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("couples/user/{userId}")]
    public async Task<ActionResult<List<Couple>>> GetUserCouples(string userId)
    {
        try
        {
            var couples = await _coupleService.GetUserCouplesAsync(userId);
            return Ok(couples);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("couples/{coupleId}")]
    public async Task<ActionResult<Couple>> GetCouple(string coupleId)
    {
        try
        {
            var couple = await _coupleService.GetCoupleByIdAsync(coupleId);
            if (couple == null)
            {
                return NotFound(new { error = "Coppia non trovata" });
            }
            return Ok(couple);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("cards/{gameType}")]
    public async Task<ActionResult<IEnumerable<GameCard>>> GetCards(string gameType)
    {
        try
        {
            var cards = await _cardService.GetCardsAsync(gameType);
            return Ok(cards);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("cards/{gameType}/random")]
    public async Task<ActionResult<GameCard>> GetRandomCard(string gameType)
    {
        try
        {
            var card = await _cardService.GetRandomCardAsync(gameType);
            if (card == null)
            {
                return NotFound(new { error = "Nessuna carta trovata per questo tipo di gioco" });
            }
            return Ok(card);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

// DTOs
public class CreateSessionRequest
{
    public string CoupleId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string SessionType { get; set; } = "couple";
}

public class CreateCoupleRequest
{
    public string Name { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string GameType { get; set; } = string.Empty;
}

public class CreateCoupleByCodeRequest
{
    public string CurrentUserId { get; set; } = string.Empty;
    public string TargetUserCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class JoinCoupleRequest
{
    public string UserId { get; set; } = string.Empty;
}
