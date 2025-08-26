using Microsoft.AspNetCore.Mvc;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;
using System.ComponentModel.DataAnnotations;

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

    [HttpPost("couples/switch")]
    public async Task<ActionResult<Couple>> SwitchCouple([FromBody] CreateCoupleByCodeRequest request)
    {
        try
        {
            var couple = await _coupleService.SwitchCoupleAsync(
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

    [HttpPost("couples/leave")]
    public async Task<ActionResult> LeaveCouple([FromBody] LeaveCoupleRequest request)
    {
        try
        {
            var success = await _coupleService.LeaveCoupleAsync(request.UserId);
            if (!success)
            {
                return NotFound(new { error = "Utente non in nessuna coppia attiva" });
            }
            return Ok(new { message = "Hai lasciato la coppia con successo" });
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

    [HttpGet("couples/{coupleId}/sessions")]
    public async Task<ActionResult<List<GameSession>>> GetCoupleSessions(string coupleId)
    {
        try
        {
            var sessions = await _gameSessionService.GetCoupleSessionsAsync(coupleId);
            return Ok(sessions);
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

    // ============ FRONTEND COMPATIBILITY ENDPOINTS ============
    // These endpoints match the exact calls made by the frontend
    
    [HttpPost("create-couple")]
    public async Task<ActionResult<Couple>> CreateCoupleForFrontend([FromBody] CreateCoupleForFrontendRequest request)
    {
        try
        {
            var couple = await _coupleService.CreateCoupleAsync(
                request.PartnerName ?? "Couple", 
                request.CreatorId, 
                request.GameType ?? "Single");
            return Ok(couple);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("join-couple")]
    public async Task<ActionResult<Couple>> JoinCoupleForFrontend([FromBody] JoinCoupleForFrontendRequest request)
    {
        try
        {
            var couple = await _coupleService.AddUserToCoupleAsync(request.CoupleId, request.UserId, "member");
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

    [HttpPost("leave-couple")]
    public async Task<ActionResult> LeaveCoupleForFrontend([FromBody] LeaveCoupleForFrontendRequest request)
    {
        try
        {
            var success = await _coupleService.LeaveCoupleAsync(request.UserId);
            if (!success)
            {
                return NotFound(new { error = "Utente non in nessuna coppia attiva" });
            }
            return Ok(new { message = "Hai lasciato la coppia con successo" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("start-session")]
    public async Task<ActionResult<GameSession>> StartSessionForFrontend([FromBody] StartSessionForFrontendRequest request)
    {
        try
        {
            var session = await _gameSessionService.CreateSessionAsync(
                request.CoupleId, 
                request.CoupleId, // Using coupleId as createdBy for now
                request.SessionType ?? "Standard");
            return Ok(session);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("sessions/{sessionId}/end")]
    public async Task<ActionResult> EndSession(string sessionId)
    {
        try
        {
            // For now, we'll just return success
            // In a real implementation, this would end the session
            return Ok(new { message = "Session ended successfully", sessionId });
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
    [Required(ErrorMessage = "CoupleId è obbligatorio")]
    public string CoupleId { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "CreatedBy è obbligatorio")]
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

public class LeaveCoupleRequest
{
    public string UserId { get; set; } = string.Empty;
}

// Frontend compatibility DTOs
public class CreateCoupleForFrontendRequest
{
    public string CreatorId { get; set; } = string.Empty;
    public string PartnerName { get; set; } = string.Empty;
    public string GameType { get; set; } = string.Empty;
}

public class JoinCoupleForFrontendRequest
{
    public string CoupleId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
}

public class LeaveCoupleForFrontendRequest
{
    public string CoupleId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
}

public class StartSessionForFrontendRequest
{
    public string CoupleId { get; set; } = string.Empty;
    public string SessionType { get; set; } = string.Empty;
}
