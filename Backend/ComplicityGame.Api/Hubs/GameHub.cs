using Microsoft.AspNetCore.SignalR;
using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;

namespace ComplicityGame.Api.Hubs;

public class GameHub : Hub
{
    private readonly IUserService _userService;
    private readonly ICoupleService _coupleService;
    private readonly IGameSessionService _gameSessionService;
    
    // Static dictionary per mappare userId -> connectionIds
    private static readonly Dictionary<string, HashSet<string>> _userConnections = new();
    private static readonly Dictionary<string, string> _connectionUsers = new();

    public GameHub(
        IUserService userService, 
        ICoupleService coupleService,
        IGameSessionService gameSessionService)
    {
        _userService = userService;
        _coupleService = coupleService;
        _gameSessionService = gameSessionService;
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
        Console.WriteLine($"🔗 Client connected: {Context.ConnectionId}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Rimuovi la connessione dalle mappature
        var connectionId = Context.ConnectionId;
        
        if (_connectionUsers.TryGetValue(connectionId, out var userId))
        {
            // Rimuovi la connessione dal set dell'utente
            if (_userConnections.TryGetValue(userId, out var connections))
            {
                connections.Remove(connectionId);
                
                // Se l'utente non ha più connessioni, impostalo offline
                if (connections.Count == 0)
                {
                    _userConnections.Remove(userId);
                    await _userService.SetUserOfflineAsync(userId);
                    await Clients.All.SendAsync("UserLeft", userId);
                    Console.WriteLine($"🔌 User {userId} went offline (no more connections)");
                }
            }
            
            _connectionUsers.Remove(connectionId);
        }

        await base.OnDisconnectedAsync(exception);
        Console.WriteLine($"🔌 Client disconnected: {Context.ConnectionId}");
    }

    // User Management
    public async Task RegisterUser(string name, string gameType, string? nickname = null)
    {
        try
        {
            var user = await _userService.RegisterUserAsync(name, gameType, nickname);
            
            // Associate connection with user
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{user.Id}");
            
            // Notify all clients about new user
            await Clients.All.SendAsync("UserRegistered", user);
            
            await Clients.Caller.SendAsync("RegistrationSuccess", user);
            
            Console.WriteLine($"👤 User registered: {name} ({user.PersonalCode})");
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("RegistrationError", ex.Message);
        }
    }

    public async Task UpdateUserPresence(string userId)
    {
        try
        {
            var user = await _userService.UpdateUserPresenceAsync(userId);
            if (user != null)
            {
                await Clients.All.SendAsync("UserPresenceUpdated", user);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error updating presence for {userId}: {ex.Message}");
        }
    }

    public async Task GetOnlineUsers(string gameType)
    {
        try
        {
            var users = await _userService.GetOnlineUsersAsync(gameType);
            await Clients.Caller.SendAsync("OnlineUsersUpdate", users);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    // Couple Management
    public async Task JoinUserByCode(string currentUserId, string targetUserCode)
    {
        try
        {
            var couple = await _coupleService.CreateCoupleByCodeAsync(currentUserId, targetUserCode);
            
            // Get both user IDs
            var partnerId = couple.Members.First(m => m.UserId != couple.CreatedBy).UserId;
            
            // Add both users to couple group
            var user1ConnectionId = await GetUserConnectionId(couple.CreatedBy);
            var user2ConnectionId = await GetUserConnectionId(partnerId);
            
            if (!string.IsNullOrEmpty(user1ConnectionId))
                await Groups.AddToGroupAsync(user1ConnectionId, $"Couple_{couple.Id}");
            if (!string.IsNullOrEmpty(user2ConnectionId))
                await Groups.AddToGroupAsync(user2ConnectionId, $"Couple_{couple.Id}");

            // Notify both users about couple creation
            await Clients.Group($"Couple_{couple.Id}").SendAsync("CoupleCreated", couple);
            
            // Also notify all clients to update online users list
            var allOnlineUsers = await _userService.GetOnlineUsersAsync();
            await Clients.All.SendAsync("UserPresenceUpdated", allOnlineUsers);
            
            Console.WriteLine($"💑 Couple created: {couple.Name} between {couple.CreatedBy} and {partnerId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error creating couple: {ex.Message}");
            await Clients.Caller.SendAsync("JoinError", ex.Message);
        }
    }

    public async Task NotifyCoupleCreated(object couple)
    {
        try
        {
            // Broadcast couple creation to all clients
            await Clients.All.SendAsync("CoupleCreated", couple);
            Console.WriteLine($"💑 Couple creation notified to all clients");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error notifying couple creation: {ex.Message}");
        }
    }

    // Game Session Management
    public async Task CreateGameSession(string coupleId, string createdBy)
    {
        try
        {
            var session = await _gameSessionService.CreateSessionAsync(coupleId, createdBy);
            
            // Notify couple members
            await Clients.Group($"Couple_{coupleId}").SendAsync("GameSessionCreated", session);
            
            Console.WriteLine($"🎮 Game session created: {session.Id}");
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("SessionError", ex.Message);
        }
    }

    public async Task SendMessage(string sessionId, string senderId, string message)
    {
        try
        {
            var messageData = await _gameSessionService.AddMessageAsync(sessionId, senderId, message);
            
            // Broadcast to all session participants
            await Clients.Group($"Session_{sessionId}").SendAsync("MessageReceived", messageData);
            
            Console.WriteLine($"💬 Message sent in session {sessionId}");
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("MessageError", ex.Message);
        }
    }

    public async Task ShareCard(string sessionId, string userId, object cardData)
    {
        try
        {
            var sharedCard = await _gameSessionService.ShareCardAsync(sessionId, userId, cardData);
            
            // Broadcast to all session participants
            await Clients.Group($"Session_{sessionId}").SendAsync("CardShared", sharedCard);
            
            Console.WriteLine($"🃏 Card shared in session {sessionId}");
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("CardShareError", ex.Message);
        }
    }

    // User joins hub and updates online status
    public async Task JoinHub(string userId)
    {
        try
        {
            var connectionId = Context.ConnectionId;
            
            // Aggiungi questa connessione alle mappature
            if (!_userConnections.ContainsKey(userId))
            {
                _userConnections[userId] = new HashSet<string>();
            }
            
            var wasAlreadyOnline = _userConnections[userId].Count > 0;
            _userConnections[userId].Add(connectionId);
            _connectionUsers[connectionId] = userId;
            
            // Associate connection with user group
            await Groups.AddToGroupAsync(connectionId, $"User_{userId}");
            
            // Update user online status
            var user = await _userService.UpdateUserPresenceAsync(userId);
            if (user != null)
            {
                if (!wasAlreadyOnline)
                {
                    Console.WriteLine($"👤 New user joined hub: {user.Name} ({user.PersonalCode})");
                }
                else
                {
                    Console.WriteLine($"� User reconnected: {user.Name} ({user.PersonalCode})");
                }
                
                // Sempre invia la lista completa degli utenti online a tutti i client
                var allOnlineUsers = await _userService.GetOnlineUsersAsync();
                await Clients.All.SendAsync("UserPresenceUpdated", allOnlineUsers);
                Console.WriteLine($"� Sent updated online users list: {allOnlineUsers.Count} users");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error joining hub for {userId}: {ex.Message}");
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    // Refresh online users for all clients
    public async Task RefreshOnlineUsers()
    {
        try
        {
            var onlineUsers = await _userService.GetOnlineUsersAsync();
            await Clients.All.SendAsync("UserPresenceUpdated", onlineUsers);
            Console.WriteLine($"📋 Refreshed online users list: {onlineUsers.Count} users");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error refreshing online users: {ex.Message}");
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    // ===== SESSIONI CONDIVISE =====
    // Crea una nuova sessione condivisa per una carta
    public async Task CreateSharedSession(object sessionData)
    {
        try
        {
            // Per ora implementiamo un sistema semplice con gruppi SignalR
            // In futuro si può espandere con database persistence
            
            var sessionJson = sessionData.ToString();
            if (string.IsNullOrEmpty(sessionJson))
            {
                throw new ArgumentException("Session data is empty");
            }
            
            var sessionObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(sessionJson);
            if (sessionObj == null)
            {
                throw new ArgumentException("Invalid session data");
            }
            
            var sessionId = sessionObj["id"]?.ToString();
            var sessionCode = sessionObj["code"]?.ToString();
            
            if (string.IsNullOrEmpty(sessionId) || string.IsNullOrEmpty(sessionCode))
            {
                throw new ArgumentException("Missing session ID or code");
            }
            
            // Unisce il creatore al gruppo della sessione
            await Groups.AddToGroupAsync(Context.ConnectionId, $"SharedSession_{sessionCode}");
            
            // Invia conferma di creazione al creatore
            await Clients.Caller.SendAsync("SharedSessionCreated", sessionData);
            
            Console.WriteLine($"🎮 Shared session created: {sessionCode} by {Context.ConnectionId}");
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("SharedSessionError", ex.Message);
            Console.WriteLine($"❌ Error creating shared session: {ex.Message}");
        }
    }

    // Unisce un utente a una sessione condivisa esistente
    public async Task JoinSharedSession(string sessionCode, object userData)
    {
        try
        {
            if (string.IsNullOrEmpty(sessionCode))
            {
                throw new ArgumentException("Session code is required");
            }
            
            // Unisce l'utente al gruppo della sessione
            await Groups.AddToGroupAsync(Context.ConnectionId, $"SharedSession_{sessionCode}");
            
            // Notifica tutti i partecipanti che qualcuno si è unito
            await Clients.Group($"SharedSession_{sessionCode}").SendAsync("SharedSessionJoined", userData, sessionCode);
            
            Console.WriteLine($"👤 User joined shared session: {sessionCode}");
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("SharedSessionError", ex.Message);
            Console.WriteLine($"❌ Error joining shared session: {ex.Message}");
        }
    }

    // Invia un messaggio nella chat della sessione condivisa
    public async Task SendSharedSessionMessage(object messageData)
    {
        try
        {
            var messageJson = messageData.ToString();
            if (string.IsNullOrEmpty(messageJson))
            {
                throw new ArgumentException("Message data is empty");
            }
            
            var messageObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(messageJson);
            if (messageObj == null)
            {
                throw new ArgumentException("Invalid message data");
            }
            
            var sessionId = messageObj["sessionId"]?.ToString();
            if (string.IsNullOrEmpty(sessionId))
            {
                throw new ArgumentException("Missing session ID");
            }
            
            // Per ora usiamo il sessionId come codice sessione
            // In futuro mapperemo sessionId -> sessionCode via database
            var sessionCode = sessionId.Replace("shared_", "");
            
            // Broadcast del messaggio a tutti i partecipanti della sessione
            await Clients.Group($"SharedSession_{sessionCode}").SendAsync("SharedSessionMessage", messageData);
            
            Console.WriteLine($"💬 Message sent in shared session: {sessionCode}");
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("SharedSessionError", ex.Message);
            Console.WriteLine($"❌ Error sending shared session message: {ex.Message}");
        }
    }

    // Aggiorna il canvas condiviso
    public async Task UpdateSharedCanvas(object canvasData)
    {
        try
        {
            var canvasJson = canvasData.ToString();
            if (string.IsNullOrEmpty(canvasJson))
            {
                throw new ArgumentException("Canvas data is empty");
            }
            
            var canvasObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(canvasJson);
            if (canvasObj == null)
            {
                throw new ArgumentException("Invalid canvas data");
            }
            
            var sessionId = canvasObj["sessionId"]?.ToString();
            if (string.IsNullOrEmpty(sessionId))
            {
                throw new ArgumentException("Missing session ID");
            }
            
            var sessionCode = sessionId.Replace("shared_", "");
            
            // Broadcast dell'aggiornamento del canvas a tutti i partecipanti
            await Clients.Group($"SharedSession_{sessionCode}").SendAsync("SharedCanvasUpdated", canvasData);
            
            Console.WriteLine($"🎨 Canvas updated in shared session: {sessionCode}");
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("SharedSessionError", ex.Message);
            Console.WriteLine($"❌ Error updating shared canvas: {ex.Message}");
        }
    }

    // Termina una sessione condivisa
    public async Task EndSharedSession(string sessionId)
    {
        try
        {
            if (string.IsNullOrEmpty(sessionId))
            {
                throw new ArgumentException("Session ID is required");
            }
            
            var sessionCode = sessionId.Replace("shared_", "");
            
            // Notifica tutti i partecipanti che la sessione è terminata
            await Clients.Group($"SharedSession_{sessionCode}").SendAsync("SharedSessionEnded", sessionId);
            
            // Rimuove tutti i partecipanti dal gruppo
            // Note: Non c'è un modo diretto per rimuovere tutti dal gruppo in SignalR
            // I client si disconnetteranno automaticamente quando ricevono l'evento
            
            Console.WriteLine($"🔚 Shared session ended: {sessionCode}");
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("SharedSessionError", ex.Message);
            Console.WriteLine($"❌ Error ending shared session: {ex.Message}");
        }
    }

    // Helper methods
    private Task<string?> GetUserConnectionId(string userId)
    {
        if (_userConnections.TryGetValue(userId, out var connections) && connections.Count > 0)
        {
            // Restituisci la prima connessione disponibile
            return Task.FromResult<string?>(connections.First());
        }
        return Task.FromResult<string?>(null);
    }
}
