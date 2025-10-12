using ComplicityGame.Core.Models;
using ComplicityGame.Core.Services;
using ComplicityGame.Core.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ComplicityGame.Tests;

public class CoupleMatchingServiceNegativeTests
{
    private static GameDbContext NewContext() => new(new DbContextOptionsBuilder<GameDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private ICoupleMatchingService Build(GameDbContext ctx)
    {
        var logger = LoggerFactory.Create(b => {}).CreateLogger<CoupleMatchingService>();
        return new CoupleMatchingService(ctx, new StubPublisher(), logger);
    }

    [Fact]
    public async Task CreateOrJoinCoupleAsync_ReturnsNull_When_Code_Not_Found()
    {
        using var ctx = NewContext();
        ctx.Users.Add(new User { Id = "u1", Name = "Alice", PersonalCode = "111111", GameType = "couple" });
        await ctx.SaveChangesAsync();
        var svc = Build(ctx);
        var couple = await svc.CreateOrJoinCoupleAsync("999999", "u1");
        Assert.Null(couple);
    }

    [Fact]
    public async Task CreateOrJoinCoupleAsync_ReturnsNull_When_Self_Code()
    {
        using var ctx = NewContext();
        ctx.Users.Add(new User { Id = "u1", Name = "Alice", PersonalCode = "111111", GameType = "couple" });
        await ctx.SaveChangesAsync();
        var svc = Build(ctx);
        var couple = await svc.CreateOrJoinCoupleAsync("111111", "u1");
        Assert.Null(couple);
    }

    [Fact]
    public async Task CreateOrJoinCoupleAsync_ReturnsNull_When_Target_Couple_Already_Full()
    {
        using var ctx = NewContext();
        ctx.Users.AddRange(
            new User { Id = "u1", Name = "Alice", PersonalCode = "111111", GameType = "couple" },
            new User { Id = "u2", Name = "Bob", PersonalCode = "222222", GameType = "couple" },
            new User { Id = "u3", Name = "Cara", PersonalCode = "333333", GameType = "couple" }
        );
        await ctx.SaveChangesAsync();
        var svc = Build(ctx);
        var c1 = await svc.CreateOrJoinCoupleAsync("222222", "u1");
        Assert.NotNull(c1);
        var c2 = await svc.CreateOrJoinCoupleAsync("222222", "u3");
        Assert.Null(c2);
    }

    private class StubPublisher : IEventPublisher
    {
        public List<BaseEvent> Published { get; } = new();
        public Task PublishToUserAsync<T>(T ev, string userId) where T : BaseEvent { Published.Add(ev); return Task.CompletedTask; }
        public Task PublishToCoupleAsync<T>(T ev, string coupleId) where T : BaseEvent { Published.Add(ev); return Task.CompletedTask; }
    }
}
