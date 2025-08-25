using ComplicityGame.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ComplicityGame.Api.Services;

public interface IGameSessionService
{
    Task<GameSession> CreateSessionAsync(string coupleId, string createdBy);
    Task<GameSession> CreateSessionAsync(string coupleId, string createdBy, string sessionType);
    Task<GameSession?> GetSessionAsync(string sessionId);
    Task<GameSession?> GetActiveSessionByCoupleAsync(string coupleId);
    Task<GameSession?> GetActiveSessionForCoupleAsync(string coupleId);
    Task<List<GameSession>> GetCoupleSessionsAsync(string coupleId);
    Task<GameMessage> AddMessageAsync(string sessionId, string senderId, string message);
    Task<SharedCard> ShareCardAsync(string sessionId, string userId, object cardData);
}

public class GameSessionService : IGameSessionService
{
    private readonly GameDbContext _context;

    public GameSessionService(GameDbContext context)
    {
        _context = context;
    }

    public async Task<GameSession> CreateSessionAsync(string coupleId, string createdBy)
    {
        return await CreateSessionAsync(coupleId, createdBy, "couple");
    }

    public async Task<GameSession> CreateSessionAsync(string coupleId, string createdBy, string sessionType)
    {
        var couple = await _context.Couples
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == coupleId);

        if (couple == null)
            throw new ArgumentException("Couple not found");

        if (!couple.Members.Any(m => m.UserId == createdBy))
            throw new ArgumentException("User is not a member of this couple");

        // Check if there's already an active session
        var existingSession = await GetActiveSessionForCoupleAsync(coupleId);
        if (existingSession != null)
            return existingSession;

        var session = new GameSession
        {
            CoupleId = coupleId,
            CreatedBy = createdBy,
            SessionType = sessionType,
            IsActive = true
        };

        _context.GameSessions.Add(session);
        await _context.SaveChangesAsync();

        return session;
    }

    public async Task<GameSession?> GetSessionAsync(string sessionId)
    {
        return await _context.GameSessions
            .Include(s => s.Messages)
            .ThenInclude(m => m.Sender)
            .Include(s => s.SharedCards)
            .ThenInclude(c => c.SharedBy)
            .Include(s => s.Couple)
            .ThenInclude(c => c.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(s => s.Id == sessionId);
    }

    public async Task<GameSession?> GetActiveSessionByCoupleAsync(string coupleId)
    {
        return await GetActiveSessionForCoupleAsync(coupleId);
    }

    public async Task<GameMessage> AddMessageAsync(string sessionId, string senderId, string message)
    {
        var session = await _context.GameSessions.FindAsync(sessionId);
        if (session == null || !session.IsActive)
            throw new ArgumentException("Session not found or inactive");

        var gameMessage = new GameMessage
        {
            SessionId = sessionId,
            SenderId = senderId,
            Message = message,
            MessageType = "text"
        };

        _context.GameMessages.Add(gameMessage);
        await _context.SaveChangesAsync();

        // Load with sender info
        return await _context.GameMessages
            .Include(m => m.Sender)
            .FirstAsync(m => m.Id == gameMessage.Id);
    }

    public async Task<SharedCard> ShareCardAsync(string sessionId, string userId, object cardData)
    {
        var session = await _context.GameSessions.FindAsync(sessionId);
        if (session == null || !session.IsActive)
            throw new ArgumentException("Session not found or inactive");

        var sharedCard = new SharedCard
        {
            SessionId = sessionId,
            SharedById = userId,
            CardData = JsonSerializer.Serialize(cardData)
        };

        _context.SharedCards.Add(sharedCard);

        // Also add a message about the card share
        var message = new GameMessage
        {
            SessionId = sessionId,
            SenderId = userId,
            Message = "Shared a card",
            MessageType = "card_share"
        };

        _context.GameMessages.Add(message);
        await _context.SaveChangesAsync();

        // Load with sharer info
        return await _context.SharedCards
            .Include(c => c.SharedBy)
            .FirstAsync(c => c.Id == sharedCard.Id);
    }

    public async Task<GameSession?> GetActiveSessionForCoupleAsync(string coupleId)
    {
        return await _context.GameSessions
            .Include(s => s.Messages)
            .ThenInclude(m => m.Sender)
            .Include(s => s.SharedCards)
            .ThenInclude(c => c.SharedBy)
            .Include(s => s.Couple)
            .ThenInclude(c => c.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(s => s.CoupleId == coupleId && s.IsActive);
    }

    public async Task<List<GameSession>> GetCoupleSessionsAsync(string coupleId)
    {
        return await _context.GameSessions
            .Include(s => s.Messages)
            .ThenInclude(m => m.Sender)
            .Include(s => s.SharedCards)
            .ThenInclude(c => c.SharedBy)
            .Include(s => s.Couple)
            .ThenInclude(c => c.Members)
            .ThenInclude(m => m.User)
            .Where(s => s.CoupleId == coupleId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }
}
