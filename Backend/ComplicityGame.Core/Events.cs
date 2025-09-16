namespace ComplicityGame.Core.Events;

public abstract class BaseEvent
{
    public string EventId { get; set; } = Guid.NewGuid().ToString();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string UserId { get; set; } = string.Empty;
    public abstract string EventType { get; }
}

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
