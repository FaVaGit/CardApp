using Microsoft.AspNetCore.SignalR;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;
using ComplicityGame.Core.Models;
using System.Text.Json;

namespace ComplicityGame.Api.Hubs;

public class GameHub : Hub
{
    private readonly IGameSessionService _gameSessionService;
    private readonly ILogger<GameHub> _logger;

    public GameHub(
        IGameSessionService gameSessionService,
        ILogger<GameHub> logger)
    {
        _gameSessionService = gameSessionService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"Client connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }

    // User management methods
    public async Task JoinHub(int userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        _logger.LogInformation($"User {userId} joined hub with connection {Context.ConnectionId}");
    }

    public async Task UpdateUserPresence(int userId)
    {
        await Clients.All.SendAsync("UserPresenceUpdated", userId);
    }

    public async Task RefreshOnlineUsers()
    {
        // For now, just acknowledge the request
        // This would need a user service to implement properly
        await Clients.All.SendAsync("OnlineUsersUpdate", new object[0]);
    }

    // Couple management methods
    public async Task NotifyCoupleCreated(object coupleData)
    {
        await Clients.All.SendAsync("CoupleCreated", coupleData);
    }

    // Game session methods
    public async Task CreateGameSession(string coupleId, string createdBy)
    {
        try
        {
            var session = new ComplicityGame.Api.Models.GameSession
            {
                CoupleId = coupleId,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var createdSession = await _gameSessionService.CreateSessionAsync(session);
            await Clients.All.SendAsync("GameSessionCreated", createdSession);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating game session");
            await Clients.Caller.SendAsync("Error", "Failed to create game session");
        }
    }

    public async Task SendMessage(object messageData)
    {
        await Clients.All.SendAsync("MessageReceived", messageData);
    }

    public async Task ShareCard(object cardData)
    {
        await Clients.All.SendAsync("CardShared", cardData);
    }

    // Drawing/Whiteboard methods
    public async Task AddDrawingStroke(string sessionId, object strokeData)
    {
        try
        {
            _logger.LogInformation($"Adding drawing stroke to session {sessionId}");
            
            // Broadcast to all clients in the session
            await Clients.Group($"Session_{sessionId}").SendAsync("DrawingStrokeAdded", strokeData);
            
            // Optionally persist to database
            // var session = await _gameSessionService.GetSessionAsync(int.Parse(sessionId));
            // if (session != null)
            // {
            //     // Update session with new stroke data
            //     // This could be stored as JSON in SessionData field
            // }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error adding drawing stroke to session {sessionId}");
            await Clients.Caller.SendAsync("Error", "Failed to add drawing stroke");
        }
    }

    public async Task AddDrawingNote(string sessionId, object noteData)
    {
        try
        {
            _logger.LogInformation($"Adding drawing note to session {sessionId}");
            
            // Broadcast to all clients in the session
            await Clients.Group($"Session_{sessionId}").SendAsync("DrawingNoteAdded", noteData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error adding drawing note to session {sessionId}");
            await Clients.Caller.SendAsync("Error", "Failed to add drawing note");
        }
    }

    public async Task ClearDrawing(string sessionId)
    {
        try
        {
            _logger.LogInformation($"Clearing drawing for session {sessionId}");
            
            // Broadcast to all clients in the session
            await Clients.Group($"Session_{sessionId}").SendAsync("DrawingCleared", sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error clearing drawing for session {sessionId}");
            await Clients.Caller.SendAsync("Error", "Failed to clear drawing");
        }
    }

    public async Task UndoDrawing(string sessionId)
    {
        try
        {
            _logger.LogInformation($"Undo drawing for session {sessionId}");
            
            // Broadcast to all clients in the session
            await Clients.Group($"Session_{sessionId}").SendAsync("DrawingUndoRedo", new { sessionId, action = "undo" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error undoing drawing for session {sessionId}");
            await Clients.Caller.SendAsync("Error", "Failed to undo drawing");
        }
    }

    public async Task RedoDrawing(string sessionId)
    {
        try
        {
            _logger.LogInformation($"Redo drawing for session {sessionId}");
            
            // Broadcast to all clients in the session
            await Clients.Group($"Session_{sessionId}").SendAsync("DrawingUndoRedo", new { sessionId, action = "redo" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error redoing drawing for session {sessionId}");
            await Clients.Caller.SendAsync("Error", "Failed to redo drawing");
        }
    }

    // Session management
    public async Task JoinGameSession(string sessionId, int userId)
    {
        try
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Session_{sessionId}");
            _logger.LogInformation($"User {userId} joined game session {sessionId}");
            
            // Notify other users in the session
            await Clients.GroupExcept($"Session_{sessionId}", Context.ConnectionId)
                .SendAsync("UserJoinedSession", new { sessionId, userId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error joining game session {sessionId}");
            await Clients.Caller.SendAsync("Error", "Failed to join game session");
        }
    }

    public async Task LeaveGameSession(string sessionId, int userId)
    {
        try
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Session_{sessionId}");
            _logger.LogInformation($"User {userId} left game session {sessionId}");
            
            // Notify other users in the session
            await Clients.Group($"Session_{sessionId}")
                .SendAsync("UserLeftSession", new { sessionId, userId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error leaving game session {sessionId}");
        }
    }
}
