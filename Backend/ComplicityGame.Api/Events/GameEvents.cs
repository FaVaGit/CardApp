using System.Text.Json;

namespace ComplicityGame.Api.Events
{
    // Base event class
    public abstract class BaseEvent
    {
        public string EventId { get; set; } = Guid.NewGuid().ToString();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string UserId { get; set; } = string.Empty;
        public abstract string EventType { get; }
    }

    // User Events
    public class UserConnectedEvent : BaseEvent
    {
        public override string EventType => "UserConnected";
        public string ConnectionId { get; set; } = string.Empty;
        public DateTime ConnectedAt { get; set; }
        public string? CoupleId { get; set; }
    }

    public class UserDisconnectedEvent : BaseEvent
    {
        public override string EventType => "UserDisconnected";
        public string ConnectionId { get; set; } = string.Empty;
        public DateTime DisconnectedAt { get; set; }
        public string? CoupleId { get; set; }
    }

    // Couple Events
    public class CoupleCreatedEvent : BaseEvent
    {
        public override string EventType => "CoupleCreated";
        public string CoupleId { get; set; } = string.Empty;
        public string CoupleCode { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CoupleCompletedEvent : BaseEvent
    {
        public override string EventType => "CoupleCompleted";
        public string CoupleId { get; set; } = string.Empty;
        public string CoupleCode { get; set; } = string.Empty;
        public string Member1Id { get; set; } = string.Empty;
        public string Member2Id { get; set; } = string.Empty;
        public DateTime CompletedAt { get; set; }
    }

    public class CoupleDisconnectionEvent : BaseEvent
    {
        public override string EventType => "CoupleDisconnection";
        public string CoupleId { get; set; } = string.Empty;
        public DateTime DisconnectedAt { get; set; }
    }

    // Game Session Events
    public class GameSessionCreatedEvent : BaseEvent
    {
        public override string EventType => "GameSessionCreated";
        public string SessionId { get; set; } = string.Empty;
        public string CoupleId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CardDrawnEvent : BaseEvent
    {
        public override string EventType => "CardDrawn";
        public string SessionId { get; set; } = string.Empty;
        public string CoupleId { get; set; } = string.Empty;
        public string CardId { get; set; } = string.Empty;
        public string CardContent { get; set; } = string.Empty;
        public DateTime DrawnAt { get; set; }
    }

    public class GameSessionEndedEvent : BaseEvent
    {
        public override string EventType => "GameSessionEnded";
        public string SessionId { get; set; } = string.Empty;
        public string CoupleId { get; set; } = string.Empty;
        public DateTime EndedAt { get; set; }
    }

    // Admin events
    public class SystemResetEvent : BaseEvent
    {
        public override string EventType => "SystemReset";
        public string Message { get; set; } = string.Empty;
        public new DateTime Timestamp { get; set; }
        public int UsersCleared { get; set; }
        public int CouplesCleared { get; set; }
        public int SessionsCleared { get; set; }
    }
}
