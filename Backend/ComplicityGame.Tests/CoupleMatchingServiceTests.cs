using System.Threading.Tasks;
using ComplicityGame.Core.Models;
using ComplicityGame.Core.Services;
using Microsoft.EntityFrameworkCore;
using ComplicityGame.Core.Events;
using Microsoft.Extensions.Logging;

namespace ComplicityGame.Tests;

public class CoupleMatchingServiceTests
{
    private static GameDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<GameDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new GameDbContext(options);
    }

    private ICoupleMatchingService BuildService(GameDbContext ctx)
    {
        var publisher = new StubEventPublisher();
        var presence = new StubPresenceService();
        var loggerFactory = LoggerFactory.Create(b => {});
        var logger = loggerFactory.CreateLogger<CoupleMatchingService>();
        return new CoupleMatchingService(ctx, publisher, logger);
    }

    [Fact]
    public async Task CreateOrJoinCoupleAsync_Creates_New_Couple_When_None_Exists()
    {
        using var ctx = NewContext();
        ctx.Users.Add(new User { Id = "u1", Name = "Alice", PersonalCode = "111111", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        ctx.Users.Add(new User { Id = "u2", Name = "Bob", PersonalCode = "222222", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await ctx.SaveChangesAsync();

        var svc = BuildService(ctx);
        var couple = await svc.CreateOrJoinCoupleAsync("222222", "u1");

        Assert.NotNull(couple);
        Assert.Equal(2, couple!.Members.Count);
        Assert.Contains(couple.Members, m => m.UserId == "u1");
        Assert.Contains(couple.Members, m => m.UserId == "u2");
    }

    [Fact]
    public async Task CreateOrJoinCoupleAsync_Joins_Existing_Couple_With_One_Member()
    {
        using var ctx = NewContext();
        ctx.Users.Add(new User { Id = "u1", Name = "Alice", PersonalCode = "111111", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        ctx.Users.Add(new User { Id = "u2", Name = "Bob", PersonalCode = "222222", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        ctx.Users.Add(new User { Id = "u3", Name = "Cara", PersonalCode = "333333", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await ctx.SaveChangesAsync();

        var svc = BuildService(ctx);
        var couple1 = await svc.CreateOrJoinCoupleAsync("222222", "u1");
        Assert.NotNull(couple1);
        Assert.Equal(2, couple1!.Members.Count);

        var result = await svc.CreateOrJoinCoupleAsync("111111", "u3");
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateOrJoinCoupleAsync_ReturnsExisting_WhenUserAlreadyInCouple()
    {
        using var ctx = NewContext();
        ctx.Users.Add(new User { Id = "u1", Name = "Alice", PersonalCode = "111111", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        ctx.Users.Add(new User { Id = "u2", Name = "Bob", PersonalCode = "222222", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await ctx.SaveChangesAsync();

        var svc = BuildService(ctx);
        var couple = await svc.CreateOrJoinCoupleAsync("222222", "u1");
        Assert.NotNull(couple);

        var coupleAgain = await svc.CreateOrJoinCoupleAsync("222222", "u1");
        Assert.Equal(couple!.Id, coupleAgain!.Id);
    }

    private class StubEventPublisher : IEventPublisher
    {
        public List<BaseEvent> Published { get; } = new();
        public Task PublishToUserAsync<T>(T ev, string userId) where T : BaseEvent { Published.Add(ev); return Task.CompletedTask; }
        public Task PublishToCoupleAsync<T>(T ev, string coupleId) where T : BaseEvent { Published.Add(ev); return Task.CompletedTask; }
    }

    private class StubPresenceService : IUserPresenceService { }
}
