using ComplicityGame.Api.Events;
using ComplicityGame.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ComplicityGame.Api.Services
{
    public interface IGameSessionService
    {
        // Event-Driven Methods
        Task<GameSession?> StartGameAsync(string coupleId);
        Task<GameCard?> DrawCardAsync(string sessionId, string userId);
        Task<GameSession?> GetActiveSessionAsync(string coupleId);
        Task<bool> EndGameAsync(string sessionId);
        
        // Helper methods
        Task<int> GetAvailableCardsCountAsync();
    }

    public class GameSessionService : IGameSessionService
    {
        private readonly GameDbContext _context;
        private readonly IEventPublisher _eventPublisher;
        private readonly ILogger<GameSessionService> _logger;

        public GameSessionService(
            GameDbContext context,
            IEventPublisher eventPublisher,
            ILogger<GameSessionService> logger)
        {
            _context = context;
            _eventPublisher = eventPublisher;
            _logger = logger;
        }

        public async Task<GameSession?> StartGameAsync(string coupleId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                var couple = await _context.Couples
                    .Include(c => c.Members)
                    .FirstOrDefaultAsync(c => c.Id == coupleId);

                if (couple == null || couple.Members.Count != 2)
                {
                    _logger.LogWarning($"❌ Cannot start game - couple {coupleId} not found or incomplete");
                    return null;
                }

                // Check if there's already an active session
                var existingSession = await _context.GameSessions
                    .FirstOrDefaultAsync(gs => gs.CoupleId == coupleId && gs.IsActive);

                if (existingSession != null)
                {
                    _logger.LogInformation($"🎮 Game session {existingSession.Id} already active for couple {coupleId}");
                    return existingSession;
                }

                // Create new game session
                var gameSession = new GameSession
                {
                    CoupleId = coupleId,
                    CreatedBy = couple.CreatedBy,
                    SessionType = "couple",
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.GameSessions.Add(gameSession);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Publish game session created event
                var gameCreatedEvent = new GameSessionCreatedEvent
                {
                    UserId = couple.CreatedBy, // Initiating user
                    SessionId = gameSession.Id,
                    CoupleId = coupleId,
                    CreatedAt = gameSession.CreatedAt
                };

                await _eventPublisher.PublishToCoupleAsync(gameCreatedEvent, coupleId);

                _logger.LogInformation($"🎮 Started game session {gameSession.Id} for couple {coupleId}");
                return gameSession;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"❌ Failed to start game for couple {coupleId}");
                throw;
            }
        }

        public async Task<GameCard?> DrawCardAsync(string sessionId, string userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                var session = await _context.GameSessions
                    .Include(gs => gs.Couple)
                    .ThenInclude(c => c.Members)
                    .Include(gs => gs.SharedCards)
                    .FirstOrDefaultAsync(gs => gs.Id == sessionId && gs.IsActive);

                if (session == null)
                {
                    _logger.LogWarning($"❌ Game session {sessionId} not found or not active");
                    return null;
                }

                // Check if user belongs to this couple
                if (!session.Couple.Members.Any(m => m.UserId == userId))
                {
                    _logger.LogWarning($"❌ User {userId} not authorized for session {sessionId}");
                    return null;
                }

                // Get all available cards (not yet shared in this session)
                var sharedCardIds = session.SharedCards.Select(sc => sc.Id).ToList();
                var availableCards = await _context.GameCards
                    .Where(gc => gc.GameType == session.Couple.GameType && 
                                !sharedCardIds.Contains(gc.Id.ToString()))
                    .ToListAsync();

                if (!availableCards.Any())
                {
                    _logger.LogInformation($"🎴 No more cards available for session {sessionId}");
                    return null;
                }

                // Draw random card
                var random = new Random();
                var randomCard = availableCards[random.Next(availableCards.Count)];

                // Create shared card record
                var sharedCard = new SharedCard
                {
                    SessionId = sessionId,
                    SharedById = userId,
                    CardData = System.Text.Json.JsonSerializer.Serialize(new { 
                        id = randomCard.Id, 
                        content = randomCard.Content 
                    }),
                    SharedAt = DateTime.UtcNow
                };

                _context.SharedCards.Add(sharedCard);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Publish card drawn event
                var cardDrawnEvent = new CardDrawnEvent
                {
                    UserId = userId,
                    SessionId = sessionId,
                    CoupleId = session.CoupleId,
                    CardId = randomCard.Id.ToString(),
                    CardContent = randomCard.Content,
                    DrawnAt = DateTime.UtcNow
                };

                await _eventPublisher.PublishToCoupleAsync(cardDrawnEvent, session.CoupleId);

                _logger.LogInformation($"🎴 User {userId} drew card {randomCard.Id} in session {sessionId}");
                return randomCard;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"❌ Failed to draw card for user {userId} in session {sessionId}");
                throw;
            }
        }

        public async Task<GameSession?> GetActiveSessionAsync(string coupleId)
        {
            return await _context.GameSessions
                .Include(gs => gs.SharedCards)
                .FirstOrDefaultAsync(gs => gs.CoupleId == coupleId && gs.IsActive);
        }

        public async Task<bool> EndGameAsync(string sessionId)
        {
            try
            {
                var session = await _context.GameSessions
                    .FirstOrDefaultAsync(gs => gs.Id == sessionId);

                if (session != null && session.IsActive)
                {
                    session.IsActive = false;
                    session.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    // Publish game ended event
                    var gameEndedEvent = new GameSessionEndedEvent
                    {
                        UserId = "", // Will be set by caller
                        SessionId = sessionId,
                        CoupleId = session.CoupleId,
                        EndedAt = session.UpdatedAt
                    };

                    await _eventPublisher.PublishToCoupleAsync(gameEndedEvent, session.CoupleId);

                    _logger.LogInformation($"🎮 Ended game session {sessionId}");
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to end game session {sessionId}");
                throw;
            }
        }

        // Helper methods for admin operations
        public async Task<int> GetAvailableCardsCountAsync()
        {
            return await _context.GameCards.CountAsync();
        }
    }
}
