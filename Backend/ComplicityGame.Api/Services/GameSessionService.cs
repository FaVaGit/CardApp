using ComplicityGame.Api.Events;
using ComplicityGame.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

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

                // In-memory cards (same as CardService)
                var allCards = new List<GameCard>
                {
                    // Couple cards
                    new GameCard { Id = 1, GameType = "couple", Category = "Intimità", Content = "Racconta un momento in cui ti sei sentito/a particolarmente vicino/a a me", Level = 1 },
                    new GameCard { Id = 2, GameType = "couple", Category = "Sogni", Content = "Qual è un sogno che vorresti realizzare insieme a me?", Level = 1 },
                    new GameCard { Id = 3, GameType = "couple", Category = "Ricordi", Content = "Qual è il primo ricordo che hai di noi insieme?", Level = 1 },
                    new GameCard { Id = 4, GameType = "couple", Category = "Futuro", Content = "Come immagini la nostra vita tra 5 anni?", Level = 2 },
                    new GameCard { Id = 5, GameType = "couple", Category = "Intimità", Content = "Cosa apprezzi di più del nostro rapporto?", Level = 1 },
                    new GameCard { Id = 6, GameType = "couple", Category = "Crescita", Content = "In che modo sono cresciuto/a grazie a te?", Level = 2 },
                    new GameCard { Id = 7, GameType = "couple", Category = "Comunicazione", Content = "C'è qualcosa che vorresti dirmi ma non hai mai avuto il coraggio?", Level = 3 },
                    new GameCard { Id = 8, GameType = "couple", Category = "Avventure", Content = "Qual è un'avventura che vorresti vivere insieme?", Level = 1 },
                    new GameCard { Id = 9, GameType = "couple", Category = "Sfide", Content = "Qual è stata la sfida più grande che abbiamo superato insieme?", Level = 2 },
                    new GameCard { Id = 10, GameType = "couple", Category = "Gratitudine", Content = "Per cosa sei più grato/a nella nostra relazione?", Level = 1 },
                    new GameCard { Id = 11, GameType = "couple", Category = "Intimità", Content = "Descrivi un momento perfetto che vorresti condividere con me", Level = 2 },
                    new GameCard { Id = 12, GameType = "couple", Category = "Scoperta", Content = "Cosa vorresti scoprire di nuovo l'uno dell'altro?", Level = 2 },
                    new GameCard { Id = 13, GameType = "couple", Category = "Supporto", Content = "Come posso sostenerti meglio nei tuoi obiettivi?", Level = 2 },
                    new GameCard { Id = 14, GameType = "couple", Category = "Gioco", Content = "Inventa una danza o un gesto speciale che rappresenti il nostro amore", Level = 1 },
                    new GameCard { Id = 15, GameType = "couple", Category = "Ricordi", Content = "Qual è il momento più divertente che abbiamo vissuto insieme?", Level = 1 },
                    new GameCard { Id = 16, GameType = "couple", Category = "Futuro", Content = "Qual è una tradizione che vorresti creare per noi?", Level = 2 },
                    new GameCard { Id = 17, GameType = "couple", Category = "Vulnerabilità", Content = "Condividi una paura che hai per la nostra relazione", Level = 3 },
                    new GameCard { Id = 18, GameType = "couple", Category = "Apprezzamento", Content = "Cosa ammiri di più del mio carattere?", Level = 1 },
                    new GameCard { Id = 19, GameType = "couple", Category = "Creatività", Content = "Se potessi scrivere una canzone sulla nostra storia, quale sarebbe il ritornello?", Level = 2 },
                    new GameCard { Id = 20, GameType = "couple", Category = "Intimità", Content = "In che modo ti fa sentire speciale il nostro amore?", Level = 2 }
                };
                
                // Extract card IDs from SharedCards JSON data
                var sharedCardIds = new List<int>();
                foreach (var existingCard in session.SharedCards)
                {
                    try
                    {
                        var cardData = JsonSerializer.Deserialize<JsonElement>(existingCard.CardData);
                        if (cardData.TryGetProperty("id", out var idProperty))
                        {
                            sharedCardIds.Add(idProperty.GetInt32());
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Failed to parse shared card data: {existingCard.CardData}");
                    }
                }
                
                // Normalize game type comparison (Coppia -> couple)
                var normalizedGameType = session.Couple.GameType.ToLower() == "coppia" ? "couple" : session.Couple.GameType.ToLower();
                var availableCards = allCards.Where(gc => gc.GameType.ToLower() == normalizedGameType && 
                                                          !sharedCardIds.Contains(gc.Id)).ToList();

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
                    CardData = JsonSerializer.Serialize(new { 
                        id = randomCard.Id,
                        gameType = randomCard.GameType,
                        category = randomCard.Category,
                        content = randomCard.Content,
                        level = randomCard.Level
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
