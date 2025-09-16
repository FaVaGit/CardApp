using ComplicityGame.Api.Events;
using ComplicityGame.Api.Models;
using ComplicityGame.Core.Models;
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
    private readonly ComplicityGame.Core.Models.GameDbContext _context;
        private readonly IEventPublisher _eventPublisher;
        private readonly IUserPresenceService _presenceService;
        private readonly ILogger<CoupleMatchingService> _logger;

        public CoupleMatchingService(
            ComplicityGame.Core.Models.GameDbContext context,
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

                // Find the target user by their personal code
                var targetUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.PersonalCode == userCode);

                if (targetUser == null)
                {
                    _logger.LogWarning($"❌ No user found with personal code {userCode}");
                    return null;
                }

                if (targetUser.Id == userId)
                {
                    _logger.LogWarning($"❌ User {userId} cannot join couple with their own code");
                    return null;
                }

                // Check if target user is already in a couple
                var targetCoupleUser = await _context.CoupleUsers
                    .Include(cu => cu.Couple)
                    .ThenInclude(c => c.Members)
                    .FirstOrDefaultAsync(cu => cu.UserId == targetUser.Id);

                if (targetCoupleUser != null && targetCoupleUser.Couple.Members.Count >= 2)
                {
                    _logger.LogWarning($"❌ Target user {targetUser.Id} is already in a complete couple");
                    return null;
                }

                Couple couple;

                if (targetCoupleUser != null && targetCoupleUser.Couple.Members.Count == 1)
                {
                    // Target user has a couple waiting for a partner - join it
                    couple = targetCoupleUser.Couple;
                    
                    var newCoupleUser = new CoupleUser
                    {
                        CoupleId = couple.Id,
                        UserId = userId,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow
                    };
                    _context.CoupleUsers.Add(newCoupleUser);
                    await _context.SaveChangesAsync();

                    // Reload couple with all members
                    couple = await _context.Couples
                        .Include(c => c.Members)
                        .FirstOrDefaultAsync(c => c.Id == couple.Id) ?? couple;

                    _logger.LogInformation($"👥 User {userId} joined existing couple {couple.Id} with target user {targetUser.Id}");
                }
                else
                {
                    // Create new couple between current user and target user
                    couple = new Couple
                    {
                        Name = $"{user.Name} & {targetUser.Name}", // Use meaningful couple name
                        CreatedBy = userId,
                        GameType = user.GameType,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.Couples.Add(couple);
                    
                    // Add both users to the couple
                    var coupleUser1 = new CoupleUser
                    {
                        CoupleId = couple.Id,
                        UserId = userId,
                        Role = "creator",
                        JoinedAt = DateTime.UtcNow
                    };
                    
                    var coupleUser2 = new CoupleUser
                    {
                        CoupleId = couple.Id,
                        UserId = targetUser.Id,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow
                    };
                    
                    _context.CoupleUsers.Add(coupleUser1);
                    _context.CoupleUsers.Add(coupleUser2);
                    
                    await _context.SaveChangesAsync();

                    // Reload couple with all members
                    couple = await _context.Couples
                        .Include(c => c.Members)
                        .FirstOrDefaultAsync(c => c.Id == couple.Id) ?? couple;

                    _logger.LogInformation($"👥 Created new couple {couple.Id} between user {userId} and target user {targetUser.Id}");
                }

                await transaction.CommitAsync();

                // Publish events for both users
                if (couple.Members.Count == 2)
                {
                    var coupleCompletedEvent = new CoupleCompletedEvent
                    {
                        UserId = userId,
                        CoupleId = couple.Id,
                        CoupleCode = couple.Name,
                        Member1Id = couple.Members.First().UserId,
                        Member2Id = couple.Members.Last().UserId,
                        CompletedAt = DateTime.UtcNow
                    };

                    // Publish to both users
                    await _eventPublisher.PublishToUserAsync(coupleCompletedEvent, couple.Members.First().UserId);
                    await _eventPublisher.PublishToUserAsync(coupleCompletedEvent, couple.Members.Last().UserId);
                }
                else
                {
                    var coupleCreatedEvent = new CoupleCreatedEvent
                    {
                        UserId = userId,
                        CoupleId = couple.Id,
                        CoupleCode = couple.Name,
                        CreatedAt = couple.CreatedAt
                    };

                    await _eventPublisher.PublishToUserAsync(coupleCreatedEvent, userId);
                }

                return couple;
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
