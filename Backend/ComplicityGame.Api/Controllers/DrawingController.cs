using Microsoft.AspNetCore.Mvc;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;
using System.Text.Json;

namespace ComplicityGame.Api.Controllers;

[ApiController]
[Route("api/drawing")]
public class DrawingController : ControllerBase
{
    private readonly IGameSessionService _gameSessionService;
    private readonly ILogger<DrawingController> _logger;

    public DrawingController(
        IGameSessionService gameSessionService,
        ILogger<DrawingController> logger)
    {
        _gameSessionService = gameSessionService;
        _logger = logger;
    }

    [HttpGet("{sessionId}")]
    public async Task<IActionResult> GetDrawingData(string sessionId)
    {
        try
        {
            var drawingData = await _gameSessionService.GetSessionDrawingDataAsync(sessionId);
            
            if (drawingData == null)
            {
                return Ok(new
                {
                    sessionId,
                    strokes = new object[0],
                    notes = new object[0]
                });
            }

            return Ok(JsonSerializer.Deserialize<object>(drawingData));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting drawing data for session {sessionId}");
            return StatusCode(500, new { error = "Failed to get drawing data" });
        }
    }

    [HttpPost("{sessionId}/stroke")]
    public async Task<IActionResult> AddStroke(string sessionId, [FromBody] object strokeData)
    {
        try
        {
            var session = await _gameSessionService.GetSessionAsync(sessionId);
            if (session == null)
            {
                return NotFound(new { error = "Session not found" });
            }

            // Get current drawing data
            var currentData = await _gameSessionService.GetSessionDrawingDataAsync(sessionId);
            var drawingData = currentData != null 
                ? JsonSerializer.Deserialize<DrawingData>(currentData)
                : new DrawingData();

            // Add new stroke
            drawingData.Strokes.Add(strokeData);

            // Save updated data
            var updatedJson = JsonSerializer.Serialize(drawingData);
            await _gameSessionService.UpdateSessionDrawingDataAsync(sessionId, updatedJson);

            return Ok(new { success = true, stroke = strokeData });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error adding stroke to session {sessionId}");
            return StatusCode(500, new { error = "Failed to add stroke" });
        }
    }

    [HttpPost("{sessionId}/note")]
    public async Task<IActionResult> AddNote(string sessionId, [FromBody] object noteData)
    {
        try
        {
            var session = await _gameSessionService.GetSessionAsync(sessionId);
            if (session == null)
            {
                return NotFound(new { error = "Session not found" });
            }

            // Get current drawing data
            var currentData = await _gameSessionService.GetSessionDrawingDataAsync(sessionId);
            var drawingData = currentData != null 
                ? JsonSerializer.Deserialize<DrawingData>(currentData)
                : new DrawingData();

            // Add new note
            drawingData.Notes.Add(noteData);

            // Save updated data
            var updatedJson = JsonSerializer.Serialize(drawingData);
            await _gameSessionService.UpdateSessionDrawingDataAsync(sessionId, updatedJson);

            return Ok(new { success = true, note = noteData });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error adding note to session {sessionId}");
            return StatusCode(500, new { error = "Failed to add note" });
        }
    }

    [HttpDelete("{sessionId}")]
    public async Task<IActionResult> ClearDrawing(string sessionId)
    {
        try
        {
            var session = await _gameSessionService.GetSessionAsync(sessionId);
            if (session == null)
            {
                return NotFound(new { error = "Session not found" });
            }

            // Clear drawing data
            var emptyData = new DrawingData();
            var emptyJson = JsonSerializer.Serialize(emptyData);
            await _gameSessionService.UpdateSessionDrawingDataAsync(sessionId, emptyJson);

            return Ok(new { success = true, message = "Drawing cleared" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error clearing drawing for session {sessionId}");
            return StatusCode(500, new { error = "Failed to clear drawing" });
        }
    }
}

public class DrawingData
{
    public List<object> Strokes { get; set; } = new();
    public List<object> Notes { get; set; } = new();
}