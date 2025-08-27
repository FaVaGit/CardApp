using ComplicityGame.Api.Events;
using ComplicityGame.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ComplicityGame.Api.Services
{
    public interface ICoupleMatchingService
    {
        Task<Couple?> CreateOrJoinCoupleAsync(string userCode, string userId);
        Task<Couple?> GetCoupleByCodeAsync(string code);
        Task<bool> DisconnectFromCoupleAsync(string userId);
    }

    public class CoupleMatchingService : ICoupleMatchingService
    {
        private readonly GameDbContext _context;
        private readonly IEventPublisher _eventPublisher;
        private readonly IUserPresenceService _presenceService;
        private readonly ILogger<CoupleMatchingService> _logger;

        public CoupleMatchingService(
            GameDbContext context,
            IEventPublisher eventPublisher,
            IUserPresenceService presenceService,
            ILogger<CoupleMatchingService> logger)
        {
            _context = context;
            _eventPublisher = eventPublisher;
            _presenceService = presenceService;
            _logger = logger;
        }

        public async Task<Couple?> CreateOrJoinCoupleAsync(string userCode, string userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"❌ User {userId} not found");
                    return null;
                }

                // Check if user is already in a couple
                var existingCoupleUser = await _context.CoupleUsers
                    .Include(cu => cu.Couple)
                    .ThenInclude(c => c.Members)
                    .FirstOrDefaultAsync(cu => cu.UserId == userId);

                if (existingCoupleUser != null)
                {
                    _logger.LogInformation($"👥 User {userId} already in couple {existingCoupleUser.CoupleId}");
                    return existingCoupleUser.Couple;
                }

                // Try to find an existing couple with this code (by name) that has only 1 member
                var waitingCouple = await _context.Couples
                    .Include(c => c.Members)
                    .FirstOrDefaultAsync(c => c.Name == userCode && c.Members.Count == 1);

                if (waitingCouple != null)
                {
                    // Join existing couple
                    var newCoupleUser = new CoupleUser
                    {
                        CoupleId = waitingCouple.Id,
                        UserId = userId,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow
                    };
                    _context.CoupleUsers.Add(newCoupleUser);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Reload couple with all members
                    waitingCouple = await _context.Couples
                        .Include(c => c.Members)
                        .FirstOrDefaultAsync(c => c.Id == waitingCouple.Id);

                    // Publish couple completed event
                    var coupleCompletedEvent = new CoupleCompletedEvent
                    {
                        UserId = userId,
                        CoupleId = waitingCouple!.Id,
                        CoupleCode = waitingCouple.Name,
                        Member1Id = waitingCouple.Members.First().UserId,
                        Member2Id = userId,
                        CompletedAt = DateTime.UtcNow
                    };

                    await _eventPublisher.PublishToCoupleAsync(coupleCompletedEvent, waitingCouple.Id);

                    _logger.LogInformation($"👥 User {userId} joined couple {waitingCouple.Id} with code {userCode}");
                    return waitingCouple;
                }
                else
                {
                    // Create new couple
                    var newCouple = new Couple
                    {
                        Name = userCode, // Use userCode as couple name
                        CreatedBy = userId,
                        GameType = user.GameType,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.Couples.Add(newCouple);
                    
                    var coupleUser = new CoupleUser
                    {
                        CoupleId = newCouple.Id,
                        UserId = userId,
                        Role = "creator",
                        JoinedAt = DateTime.UtcNow
                    };
                    _context.CoupleUsers.Add(coupleUser);
                    
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Publish couple created event
                    var coupleCreatedEvent = new CoupleCreatedEvent
                    {
                        UserId = userId,
                        CoupleId = newCouple.Id,
                        CoupleCode = userCode,
                        CreatedAt = newCouple.CreatedAt
                    };

                    await _eventPublisher.PublishToUserAsync(coupleCreatedEvent, userId);

                    _logger.LogInformation($"👥 Created new couple {newCouple.Id} with code {userCode} for user {userId}");
                    return newCouple;
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"❌ Failed to create/join couple for user {userId} with code {userCode}");
                throw;
            }
        }

        public async Task<Couple?> GetCoupleByCodeAsync(string code)
        {
            return await _context.Couples
                .Include(c => c.Members)
                .FirstOrDefaultAsync(c => c.Name == code);
        }

        public async Task<bool> DisconnectFromCoupleAsync(string userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                var coupleUser = await _context.CoupleUsers
                    .Include(cu => cu.Couple)
                    .ThenInclude(c => c.Members)
                    .FirstOrDefaultAsync(cu => cu.UserId == userId);

                if (coupleUser != null)
                {
                    var coupleId = coupleUser.CoupleId;
                    
                    // Remove user from couple
                    _context.CoupleUsers.Remove(coupleUser);
                    
                    // Check if couple is now empty
                    var remainingMembers = await _context.CoupleUsers
                        .CountAsync(cu => cu.CoupleId == coupleId);

                    if (remainingMembers <= 1)
                    {
                        // Delete empty couple
                        var couple = await _context.Couples.FindAsync(coupleId);
                        if (couple != null)
                        {
                            _context.Couples.Remove(couple);
                        }
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Publish couple disconnection event
                    var coupleDisconnectionEvent = new CoupleDisconnectionEvent
                    {
                        UserId = userId,
                        CoupleId = coupleId,
                        DisconnectedAt = DateTime.UtcNow
                    };

                    await _eventPublisher.PublishToCoupleAsync(coupleDisconnectionEvent, coupleId);

                    _logger.LogInformation($"👥 User {userId} disconnected from couple {coupleId}");
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"❌ Failed to disconnect user {userId} from couple");
                throw;
            }
        }
    }
}
