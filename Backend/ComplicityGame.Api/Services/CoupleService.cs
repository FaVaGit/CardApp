using ComplicityGame.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ComplicityGame.Api.Services;

public interface ICoupleService
{
    Task<Couple> CreateCoupleByCodeAsync(string currentUserId, string targetUserCode);
    Task<Couple> CreateCoupleByCodeAsync(string currentUserId, string targetUserCode, string? coupleName);
    Task<Couple> SwitchCoupleAsync(string currentUserId, string targetUserCode, string? coupleName);
    Task<Couple> CreateCoupleAsync(string name, string createdBy, string gameType);
    Task<Couple?> AddUserToCoupleAsync(string coupleId, string userId, string role);
    Task<bool> LeaveCoupleAsync(string userId);
    Task<List<Couple>> GetUserCouplesAsync(string userId);
    Task<List<Couple>> GetAllCouplesAsync();
    Task<List<Couple>> GetAllActiveCouplesAsync();
    Task<Couple?> GetCoupleByIdAsync(string coupleId);
}

public class CoupleService : ICoupleService
{
    private readonly GameDbContext _context;
    private readonly IUserService _userService;

    public CoupleService(GameDbContext context, IUserService userService)
    {
        _context = context;
        _userService = userService;
    }

    public async Task<Couple> CreateCoupleByCodeAsync(string currentUserId, string targetUserCode)
    {
        return await CreateCoupleByCodeAsync(currentUserId, targetUserCode, null);
    }

    public async Task<Couple> SwitchCoupleAsync(string currentUserId, string targetUserCode, string? coupleName)
    {
        // Prima lascia la coppia attuale se presente
        await LeaveCoupleAsync(currentUserId);
        
        // Poi crea una nuova coppia
        return await CreateCoupleByCodeAsync(currentUserId, targetUserCode, coupleName);
    }

    public async Task<Couple> CreateCoupleByCodeAsync(string currentUserId, string targetUserCode, string? coupleName)
    {
        var currentUser = await _context.Users.FindAsync(currentUserId);
        if (currentUser == null)
            throw new ArgumentException("Current user not found");

        var targetUser = await _userService.GetUserByCodeAsync(targetUserCode);
        if (targetUser == null)
            throw new ArgumentException("Target user not found with provided code");

        if (targetUser.Id == currentUserId)
            throw new ArgumentException("Cannot create couple with yourself");

        if (!targetUser.AvailableForPairing)
            throw new ArgumentException("Target user is not available for pairing");

        // Check if couple already exists between these users
        var existingCouple = await _context.Couples
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => 
                c.Members.Any(m => m.UserId == currentUserId) &&
                c.Members.Any(m => m.UserId == targetUser.Id) &&
                c.IsActive);

        if (existingCouple != null)
            return existingCouple;

        // Create new couple with custom name if provided
        var couple = new Couple
        {
            Name = coupleName ?? $"{currentUser.Name} & {targetUser.Name}",
            CreatedBy = currentUserId,
            GameType = currentUser.GameType,
            IsActive = true
        };

        _context.Couples.Add(couple);
        await _context.SaveChangesAsync();

        // Add members to couple
        var members = new[]
        {
            new CoupleUser
            {
                CoupleId = couple.Id,
                UserId = currentUserId,
                Role = "creator"
            },
            new CoupleUser
            {
                CoupleId = couple.Id,
                UserId = targetUser.Id,
                Role = "member"
            }
        };

        _context.CoupleUsers.AddRange(members);

        // Update users' availability
        currentUser.AvailableForPairing = false;
        targetUser.AvailableForPairing = false;

        await _context.SaveChangesAsync();

        // Return couple with members populated
        return await GetCoupleByIdAsync(couple.Id) ?? couple;
    }

    public async Task<Couple> CreateCoupleAsync(string name, string createdBy, string gameType)
    {
        var creator = await _context.Users.FindAsync(createdBy);
        if (creator == null)
            throw new ArgumentException("Creator user not found");

        var couple = new Couple
        {
            Name = name,
            CreatedBy = createdBy,
            GameType = gameType,
            IsActive = true
        };

        _context.Couples.Add(couple);
        await _context.SaveChangesAsync();

        // Add creator as member
        var creatorMember = new CoupleUser
        {
            CoupleId = couple.Id,
            UserId = createdBy,
            Role = "creator"
        };

        _context.CoupleUsers.Add(creatorMember);
        await _context.SaveChangesAsync();

        return await GetCoupleByIdAsync(couple.Id) ?? couple;
    }

    public async Task<Couple?> AddUserToCoupleAsync(string coupleId, string userId, string role)
    {
        var couple = await _context.Couples
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == coupleId && c.IsActive);

        if (couple == null)
            return null;

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new ArgumentException("User not found");

        // Check if user is already a member
        if (couple.Members.Any(m => m.UserId == userId))
            return couple;

        var member = new CoupleUser
        {
            CoupleId = coupleId,
            UserId = userId,
            Role = role
        };

        _context.CoupleUsers.Add(member);
        await _context.SaveChangesAsync();

        return await GetCoupleByIdAsync(coupleId);
    }

    public async Task<bool> LeaveCoupleAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new ArgumentException("User not found");

        // Find all active couples where the user is a member
        var userCouples = await _context.CoupleUsers
            .Include(cu => cu.Couple)
            .Where(cu => cu.UserId == userId && cu.Couple.IsActive)
            .ToListAsync();

        if (!userCouples.Any())
            return false; // User not in any active couple

        foreach (var coupleUser in userCouples)
        {
            var couple = coupleUser.Couple;
            
            // Remove the user from the couple
            _context.CoupleUsers.Remove(coupleUser);
            
            // Check remaining members
            var remainingMembers = await _context.CoupleUsers
                .Where(cu => cu.CoupleId == couple.Id)
                .CountAsync();

            // If this was the last member or only one member remains, deactivate the couple
            if (remainingMembers <= 1)
            {
                couple.IsActive = false;
                
                // If there's one remaining member, make them available for pairing again
                var lastMember = await _context.CoupleUsers
                    .Include(cu => cu.User)
                    .Where(cu => cu.CoupleId == couple.Id)
                    .FirstOrDefaultAsync();
                
                if (lastMember != null)
                {
                    lastMember.User.AvailableForPairing = true;
                }
            }
        }

        // Make the leaving user available for pairing again
        user.AvailableForPairing = true;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Couple>> GetUserCouplesAsync(string userId)
    {
        var couples = await _context.Couples
            .Where(c => c.Members.Any(m => m.UserId == userId) && c.IsActive)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        // Load users for each couple separately to avoid circular includes
        foreach (var couple in couples)
        {
            var coupleMembers = await _context.CoupleUsers
                .Include(cu => cu.User)
                .Where(cu => cu.CoupleId == couple.Id)
                .ToListAsync();
            
            couple.Users = coupleMembers.Select(cm => cm.User).ToList();
        }

        return couples;
    }

    public async Task<List<Couple>> GetAllCouplesAsync()
    {
        var couples = await _context.Couples
            .Where(c => c.IsActive)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        // Load users for each couple separately to avoid circular includes
        foreach (var couple in couples)
        {
            var coupleMembers = await _context.CoupleUsers
                .Include(cu => cu.User)
                .Where(cu => cu.CoupleId == couple.Id)
                .ToListAsync();
            
            couple.Users = coupleMembers.Select(cm => cm.User).ToList();
        }

        return couples;
    }

    public async Task<List<Couple>> GetAllActiveCouplesAsync()
    {
        var couples = await _context.Couples
            .Where(c => c.IsActive && c.Members.Count >= 2)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        // Load users for each couple separately to avoid circular includes
        foreach (var couple in couples)
        {
            var coupleMembers = await _context.CoupleUsers
                .Include(cu => cu.User)
                .Where(cu => cu.CoupleId == couple.Id)
                .ToListAsync();
            
            couple.Users = coupleMembers.Select(cm => cm.User).ToList();
        }

        return couples;
    }

    public async Task<Couple?> GetCoupleByIdAsync(string coupleId)
    {
        var couple = await _context.Couples
            .FirstOrDefaultAsync(c => c.Id == coupleId);
            
        if (couple != null)
        {
            var coupleMembers = await _context.CoupleUsers
                .Include(cu => cu.User)
                .Where(cu => cu.CoupleId == couple.Id)
                .ToListAsync();
            
            couple.Users = coupleMembers.Select(cm => cm.User).ToList();
        }

        return couple;
    }
}
