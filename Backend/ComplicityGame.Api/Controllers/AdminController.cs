using Microsoft.AspNetCore.Mvc;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ComplicityGame.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IGameSessionService _gameSessionService;
    private readonly IUserPresenceService _userPresenceService;
    private readonly GameDbContext _context;

    public AdminController(
        IGameSessionService gameSessionService,
        IUserPresenceService userPresenceService,
        GameDbContext context)
    {
        _gameSessionService = gameSessionService;
        _userPresenceService = userPresenceService;
        _context = context;
    }

    [HttpPost("clear-users")]
    public async Task<ActionResult> ClearAllUsers()
    {
        try
        {
            await _userPresenceService.ClearAllUsersAsync();
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
            await _userPresenceService.ClearAllUsersAsync();
            return Ok(new { message = "System reset successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("force-refresh")]
    public ActionResult ForceRefresh()
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

    [HttpPost("seed-test-cards")]
    public async Task<ActionResult> SeedTestCards()
    {
        try
        {
            // Check if cards already exist
            var existingCards = await _gameSessionService.GetAvailableCardsCountAsync();
            if (existingCards > 0)
            {
                return Ok(new { message = $"Cards already exist: {existingCards} cards", cardsCount = existingCards });
            }

            // Create test cards
            var testCards = new[]
            {
                new GameCard { Content = "Cosa ti rende più felice in assoluto?", GameType = "couple", Category = "Emotions" },
                new GameCard { Content = "Qual è il tuo ricordo d'infanzia più bello?", GameType = "couple", Category = "Memories" },
                new GameCard { Content = "Se potessi cambiare una cosa di te, cosa sarebbe?", GameType = "couple", Category = "Personal" },
                new GameCard { Content = "Cosa apprezzi di più del nostro rapporto?", GameType = "couple", Category = "Relationship" },
                new GameCard { Content = "Qual è il tuo sogno nel cassetto?", GameType = "couple", Category = "Dreams" },
                new GameCard { Content = "Cosa ti spaventa di più nella vita?", GameType = "couple", Category = "Fears" },
                new GameCard { Content = "Se potessimo viaggiare ovunque, dove andresti?", GameType = "couple", Category = "Travel" },
                new GameCard { Content = "Qual è la cosa più spontanea che hai mai fatto?", GameType = "couple", Category = "Adventures" },
                new GameCard { Content = "Come immagini la nostra vita tra 10 anni?", GameType = "couple", Category = "Future" },
                new GameCard { Content = "Cosa ti fa sentire più amato/a?", GameType = "couple", Category = "Love" }
            };

            _context.GameCards.AddRange(testCards);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Test cards seeded successfully", cardsCount = testCards.Length });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Purge totale: elimina utenti, coppie, sessioni, richieste di join e (opzionale) carte.
    /// Richiede conferma esplicita via query ?confirm=SI per evitare chiamate accidentali.
    /// </summary>
    [HttpDelete("purge-all")]
    public async Task<ActionResult> PurgeAll([FromQuery] string? confirm = null, [FromQuery] bool includeCards = false)
    {
        if (confirm != "SI")
        {
            return BadRequest(new { error = "Conferma mancante. Usa ?confirm=SI per procedere." });
        }
        try
        {
            // Presence/connection memory
            await _userPresenceService.ClearAllUsersAsync();

            // Extra domain cleanup (join requests, cards if requested)
            var joinRequests = await _context.Set<CoupleJoinRequest>().ToListAsync();
            _context.RemoveRange(joinRequests);
            if (includeCards)
            {
                var cards = await _context.GameCards.ToListAsync();
                _context.GameCards.RemoveRange(cards);
            }
            await _context.SaveChangesAsync();

            return Ok(new { message = "Purge completato", includeCards, joinRequestsRemoved = joinRequests.Count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("cards-status")]
    public async Task<ActionResult> GetCardsStatus()
    {
        try
        {
            var cardsCount = await _gameSessionService.GetAvailableCardsCountAsync();
            return Ok(new { 
                availableCards = cardsCount,
                status = cardsCount > 0 ? "ready" : "no cards available"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
