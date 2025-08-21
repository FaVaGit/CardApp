using ComplicityGame.Api.Models;
using ComplicityGame.Api.Controllers;
using Microsoft.EntityFrameworkCore;

namespace ComplicityGame.Api.Services;

public interface IUserService
{
    Task<User> RegisterUserAsync(string name, string gameType, string? nickname = null);
    Task<User?> UpdateUserPresenceAsync(string userId);
    Task<List<User>> GetOnlineUsersAsync(string? gameType = null);
    Task SetUserOfflineAsync(string userId);
    Task<User?> GetUserByCodeAsync(string personalCode);
    Task<User?> GetUserByIdAsync(string userId);
    Task<UserStateDto?> GetUserStateAsync(string userId);
}

public class UserService : IUserService
{
    private readonly GameDbContext _context;

    public UserService(GameDbContext context)
    {
        _context = context;
    }

    public async Task<User> RegisterUserAsync(string name, string gameType, string? nickname = null)
    {
        // Check if user already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Name.ToLower() == name.ToLower() && u.GameType == gameType);

        if (existingUser != null)
        {
            // Update existing user presence
            existingUser.IsOnline = true;
            existingUser.LastSeen = DateTime.UtcNow;
            existingUser.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return existingUser;
        }

        // Create new user
        var user = new User
        {
            Name = name.Trim(),
            Nickname = nickname?.Trim(),
            GameType = gameType,
            PersonalCode = GeneratePersonalCode(),
            IsOnline = true,
            AvailableForPairing = true,
            LastSeen = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }

    public async Task<User?> UpdateUserPresenceAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.IsOnline = true;
            user.LastSeen = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
        return user;
    }

    public async Task<List<User>> GetOnlineUsersAsync(string? gameType = null)
    {
        var query = _context.Users
            .Where(u => u.IsOnline);

        if (!string.IsNullOrEmpty(gameType))
        {
            query = query.Where(u => u.GameType == gameType);
        }

        return await query.OrderBy(u => u.Name).ToListAsync();
    }

    public async Task SetUserOfflineAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.IsOnline = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<User?> GetUserByCodeAsync(string personalCode)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.PersonalCode.ToLower() == personalCode.ToLower());
    }

    public async Task<User?> GetUserByIdAsync(string userId)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<UserStateDto?> GetUserStateAsync(string userId)
    {
        var user = await GetUserByIdAsync(userId);
        if (user == null) return null;

        // Get user's current couple
        var coupleUser = await _context.CoupleUsers
            .Include(cu => cu.Couple)
            .ThenInclude(c => c.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(cu => cu.UserId == userId);

        var currentCouple = coupleUser?.Couple;

        // Get active session for the couple
        GameSession? activeSession = null;
        if (currentCouple != null)
        {
            activeSession = await _context.GameSessions
                .FirstOrDefaultAsync(gs => gs.CoupleId == currentCouple.Id && gs.IsActive);
        }

        // Get online users for the same game type
        var onlineUsers = await GetOnlineUsersAsync(user.GameType);

        // Calculate permissions based on user state
        var permissions = CalculateUserPermissions(user, currentCouple, activeSession);

        return new UserStateDto
        {
            User = user,
            CurrentCouple = currentCouple,
            ActiveSession = activeSession,
            OnlineUsers = onlineUsers,
            Permissions = permissions
        };
    }

    private UserPermissions CalculateUserPermissions(User user, Couple? currentCouple, GameSession? activeSession)
    {
        var permissions = new UserPermissions();

        if (currentCouple == null)
        {
            // User is not in a couple
            permissions.CanJoinByCode = true;
            permissions.CanViewUsers = true;
            permissions.CanStartGameSession = false;
            permissions.CanViewCouple = false;
            permissions.CanLeaveCouple = false;
            permissions.DefaultTab = "join";
        }
        else
        {
            // User is in a couple
            permissions.CanJoinByCode = false; // Disable joining when already in couple
            permissions.CanViewUsers = true;   // Always allow viewing users, but with different content
            permissions.CanViewCouple = true;
            permissions.CanLeaveCouple = true;
            permissions.DefaultTab = "couple";

            // Check if both users in couple are online
            var coupleMembers = currentCouple.Members.Where(m => m.User.IsOnline).Count();
            var hasActiveSession = activeSession != null;

            permissions.CanStartGameSession = coupleMembers >= 2 && !hasActiveSession;
        }

        return permissions;
    }

    private string GeneratePersonalCode()
    {
        const string letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string numbers = "0123456789";
        var random = new Random();

        string code;
        do
        {
            code = "";
            for (int i = 0; i < 3; i++)
                code += letters[random.Next(letters.Length)];
            for (int i = 0; i < 3; i++)
                code += numbers[random.Next(numbers.Length)];
        }
        while (_context.Users.Any(u => u.PersonalCode == code));

        return code;
    }
}
