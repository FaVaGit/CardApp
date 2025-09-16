using ComplicityGame.Core.Events;
using ComplicityGame.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ComplicityGame.Core.Services;

public interface ICoupleMatchingService
{
    Task<Couple?> CreateOrJoinCoupleAsync(string userCode, string userId);
}

public interface IEventPublisher
{
    Task PublishToUserAsync<T>(T ev, string userId) where T : BaseEvent;
    Task PublishToCoupleAsync<T>(T ev, string coupleId) where T : BaseEvent;
}

public interface IUserPresenceService { }

public class CoupleMatchingService : ICoupleMatchingService
{
    private readonly GameDbContext _context;
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<CoupleMatchingService> _logger;

    public CoupleMatchingService(GameDbContext context, IEventPublisher publisher, ILogger<CoupleMatchingService> logger)
    {
        _context = context;
        _eventPublisher = publisher;
        _logger = logger;
    }

    public async Task<Couple?> CreateOrJoinCoupleAsync(string userCode, string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        var existingCoupleUser = await _context.CoupleUsers
            .Include(cu => cu.Couple)
            .ThenInclude(c => c.Members)
            .FirstOrDefaultAsync(cu => cu.UserId == userId);
        if (existingCoupleUser != null) return existingCoupleUser.Couple;

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.PersonalCode == userCode);
        if (targetUser == null || targetUser.Id == userId) return null;

        var targetCoupleUser = await _context.CoupleUsers
            .Include(cu => cu.Couple)
            .ThenInclude(c => c.Members)
            .FirstOrDefaultAsync(cu => cu.UserId == targetUser.Id);
        if (targetCoupleUser != null && targetCoupleUser.Couple.Members.Count >= 2) return null;

        Couple couple;
        if (targetCoupleUser != null && targetCoupleUser.Couple.Members.Count == 1)
        {
            couple = targetCoupleUser.Couple;
            _context.CoupleUsers.Add(new CoupleUser { CoupleId = couple.Id, UserId = userId, Role = "member", JoinedAt = DateTime.UtcNow });
            await _context.SaveChangesAsync();
            couple = await _context.Couples.Include(c => c.Members).FirstOrDefaultAsync(c => c.Id == couple.Id) ?? couple;
        }
        else
        {
            couple = new Couple
            {
                Name = $"{user.Name} & {targetUser.Name}",
                CreatedBy = userId,
                GameType = user.GameType,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
            _context.Couples.Add(couple);
            _context.CoupleUsers.Add(new CoupleUser { CoupleId = couple.Id, UserId = userId, Role = "creator", JoinedAt = DateTime.UtcNow });
            _context.CoupleUsers.Add(new CoupleUser { CoupleId = couple.Id, UserId = targetUser.Id, Role = "member", JoinedAt = DateTime.UtcNow });
            await _context.SaveChangesAsync();
            couple = await _context.Couples.Include(c => c.Members).FirstOrDefaultAsync(c => c.Id == couple.Id) ?? couple;
        }

        if (couple.Members.Count == 2)
        {
            var completed = new CoupleCompletedEvent
            {
                UserId = userId,
                CoupleId = couple.Id,
                CoupleCode = couple.Name,
                Member1Id = couple.Members.First().UserId,
                Member2Id = couple.Members.Last().UserId,
                CompletedAt = DateTime.UtcNow
            };
            await _eventPublisher.PublishToUserAsync(completed, couple.Members.First().UserId);
            await _eventPublisher.PublishToUserAsync(completed, couple.Members.Last().UserId);
        }
        else
        {
            var created = new CoupleCreatedEvent
            {
                UserId = userId,
                CoupleId = couple.Id,
                CoupleCode = couple.Name,
                CreatedAt = couple.CreatedAt
            };
            await _eventPublisher.PublishToUserAsync(created, userId);
        }

        return couple;
    }
}
