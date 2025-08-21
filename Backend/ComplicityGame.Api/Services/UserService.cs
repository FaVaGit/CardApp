using ComplicityGame.Api.Models;
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
