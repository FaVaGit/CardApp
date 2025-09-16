using ComplicityGame.Api.Events;
using ComplicityGame.Api.Models;
using CoreModels = ComplicityGame.Core.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace ComplicityGame.Api.Services
{
    public interface IUserPresenceService
    {
        Task<UserPresenceStatus> ConnectUserAsync(string userId, string connectionId);
        Task DisconnectUserAsync(string connectionId);
        Task<UserPresenceStatus?> GetUserStatusAsync(string userId);
        Task<List<UserPresenceStatus>> GetConnectedUsersAsync();
        Task ClearAllUsersAsync();
    }

    public class UserPresenceStatus
    {
        public string UserId { get; set; } = string.Empty;
        public string ConnectionId { get; set; } = string.Empty;
        public DateTime ConnectedAt { get; set; }
        public bool IsConnected { get; set; }
        public string? CoupleId { get; set; }
        public string? SessionId { get; set; }
        public UserStatus Status { get; set; }
    }

    public enum UserStatus
    {
        WaitingForPartner,
        InCouple,
        PlayingGame,
        Disconnected
    }

    public class UserPresenceService : IUserPresenceService
    {
        private readonly ConcurrentDictionary<string, UserPresenceStatus> _usersByConnection = new();
        private readonly ConcurrentDictionary<string, UserPresenceStatus> _usersByUserId = new();
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<UserPresenceService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

        public UserPresenceService(
            IEventPublisher eventPublisher,
            ILogger<UserPresenceService> logger,
            IServiceScopeFactory scopeFactory)
        {
            _eventPublisher = eventPublisher;
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        public async Task<UserPresenceStatus> ConnectUserAsync(string userId, string connectionId)
        {
            // Remove any existing connection for this user
            var existingStatus = _usersByUserId.Values.FirstOrDefault(u => u.UserId == userId);
            if (existingStatus != null)
            {
                _usersByConnection.TryRemove(existingStatus.ConnectionId, out _);
            }

            // Get user from database or create if not exists
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
            var user = await context.Users.FindAsync(userId);
            if (user == null)
            {
                // Create new user with unique PersonalCode
                var personalCode = GenerateUniquePersonalCode(userId);
                user = new CoreModels.User
                {
                    Id = userId,
                    Name = $"User_{userId}",
                    PersonalCode = personalCode,
                    GameType = "couple",
                    AvailableForPairing = true,
                    IsOnline = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                context.Users.Add(user);
                await context.SaveChangesAsync();
                _logger.LogInformation($"👤 Created new user {userId} with code {personalCode}");
            }
            else
            {
                // Update existing user status
                user.IsOnline = true;
                user.LastSeen = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
            }

            // Check for couple membership
            var coupleUser = await context.CoupleUsers
                .FirstOrDefaultAsync(cu => cu.UserId == userId);

            // Get active session information if in a couple
            string? sessionId = null;
            if (coupleUser != null)
            {
                var activeSession = await context.GameSessions
                    .FirstOrDefaultAsync(gs => gs.CoupleId == coupleUser.CoupleId && gs.IsActive);
                sessionId = activeSession?.Id;
            }

            var status = new UserPresenceStatus
            {
                UserId = userId,
                ConnectionId = connectionId,
                ConnectedAt = DateTime.UtcNow,
                IsConnected = true,
                CoupleId = coupleUser?.CoupleId,
                SessionId = sessionId,
                Status = coupleUser != null ? UserStatus.InCouple : UserStatus.WaitingForPartner
            };

            _usersByConnection[connectionId] = status;
            _usersByUserId[userId] = status;

            // Publish user connected event
            var userConnectedEvent = new UserConnectedEvent
            {
                UserId = userId,
                ConnectionId = connectionId,
                ConnectedAt = status.ConnectedAt,
                CoupleId = status.CoupleId
            };

            await _eventPublisher.PublishAsync(userConnectedEvent, "user.connected");

            _logger.LogInformation($"👤 User {userId} connected with status {status.Status}");

            return status;
        }

        public async Task DisconnectUserAsync(string connectionId)
        {
            if (_usersByConnection.TryRemove(connectionId, out var status))
            {
                _usersByUserId.TryRemove(status.UserId, out _);

                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                    var user = await context.Users.FindAsync(status.UserId);
                    if (user != null)
                    {
                        user.IsOnline = false;
                        user.LastSeen = DateTime.UtcNow;
                        await context.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to mark user offline in DB {UserId}", status.UserId);
                }

                // Publish user disconnected event
                var userDisconnectedEvent = new UserDisconnectedEvent
                {
                    UserId = status.UserId,
                    ConnectionId = connectionId,
                    DisconnectedAt = DateTime.UtcNow,
                    CoupleId = status.CoupleId
                };

                await _eventPublisher.PublishAsync(userDisconnectedEvent, "user.disconnected");

                _logger.LogInformation($"👤 User {status.UserId} disconnected");
            }
        }

        public async Task<UserPresenceStatus?> GetUserStatusAsync(string userId)
        {
            // Check if user is in memory cache
            if (!_usersByUserId.TryGetValue(userId, out var cachedStatus))
            {
                return null; // User not connected
            }

            // Re-query database for updated couple/session information
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
            var coupleUser = await context.CoupleUsers
                .FirstOrDefaultAsync(cu => cu.UserId == userId);
            
            // Get active session information if in a couple
            string? sessionId = null;
            if (coupleUser != null)
            {
                var activeSession = await context.GameSessions
                    .FirstOrDefaultAsync(gs => gs.CoupleId == coupleUser.CoupleId && gs.IsActive);
                sessionId = activeSession?.Id;
            }

            // Update and return fresh status
            var freshStatus = new UserPresenceStatus
            {
                UserId = cachedStatus.UserId,
                ConnectionId = cachedStatus.ConnectionId,
                ConnectedAt = cachedStatus.ConnectedAt,
                IsConnected = cachedStatus.IsConnected,
                CoupleId = coupleUser?.CoupleId,
                SessionId = sessionId,
                Status = coupleUser != null ? UserStatus.InCouple : UserStatus.WaitingForPartner
            };

            // Update cache
            _usersByUserId[userId] = freshStatus;
            _usersByConnection[cachedStatus.ConnectionId] = freshStatus;

            return freshStatus;
        }

        public Task<List<UserPresenceStatus>> GetConnectedUsersAsync()
        {
            return Task.FromResult(_usersByUserId.Values.Where(u => u.IsConnected).ToList());
        }

        public async Task ClearAllUsersAsync()
        {
            _logger.LogInformation("🧹 Clearing all users from presence service and database...");
            
            try
            {
                // Clear in-memory collections
                _usersByConnection.Clear();
                _usersByUserId.Clear();
                
                // Clear database
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
                var users = await context.Users.ToListAsync();
                var couples = await context.Couples.ToListAsync();
                var sessions = await context.GameSessions.ToListAsync();

                context.GameSessions.RemoveRange(sessions);
                context.Couples.RemoveRange(couples);
                context.Users.RemoveRange(users);

                await context.SaveChangesAsync();
                
                _logger.LogInformation("✅ All users cleared successfully. Removed {UserCount} users, {CoupleCount} couples, {SessionCount} sessions", 
                    users.Count, couples.Count, sessions.Count);
                
                // Publish system reset event
                var resetEvent = new SystemResetEvent
                {
                    Timestamp = DateTime.UtcNow,
                    Message = "System reset completed",
                    UsersCleared = users.Count,
                    CouplesCleared = couples.Count,
                    SessionsCleared = sessions.Count
                };
                
                await _eventPublisher.PublishAsync(resetEvent, "system.reset");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error clearing all users");
                throw;
            }
        }

        private string GenerateUniquePersonalCode(string userId)
        {
            // Generate a unique 6-character code based on userId
            var hash = userId.GetHashCode();
            var absoluteHash = Math.Abs(hash);
            var code = (absoluteHash % 999999).ToString("D6");
            
            _logger.LogDebug($"Generated PersonalCode {code} for user {userId}");
            return code;
        }
    }
}
