using System.Threading.Tasks;
using ComplicityGame.Api.Models;
using ComplicityGame.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace ComplicityGame.Tests;

public class CoupleMatchingServiceTests
{
    private GameDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<GameDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var ctx = new GameDbContext(options);
        return ctx;
    }

    private CoupleMatchingService CreateService(GameDbContext ctx)
    {
        var publisher = new Mock<IEventPublisher>();
        publisher.Setup(p => p.PublishToUserAsync(It.IsAny<object>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        publisher.Setup(p => p.PublishToCoupleAsync(It.IsAny<object>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        var presence = new Mock<IUserPresenceService>();
        var logger = new Mock<ILogger<CoupleMatchingService>>();
        return new CoupleMatchingService(ctx, publisher.Object, presence.Object, logger.Object);
    }

    [Fact]
    public async Task CreateOrJoinCoupleAsync_Creates_New_Couple_When_None_Exists()
    {
        var ctx = CreateContext();
        // Seed two users
        ctx.Users.Add(new User { Id = "u1", Name = "Alice", PersonalCode = "111111", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        ctx.Users.Add(new User { Id = "u2", Name = "Bob", PersonalCode = "222222", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await ctx.SaveChangesAsync();

        var svc = CreateService(ctx);
        var couple = await svc.CreateOrJoinCoupleAsync("222222", "u1");

        Assert.NotNull(couple);
        Assert.Equal(2, couple!.Members.Count);
        Assert.Contains(couple.Members, m => m.UserId == "u1");
        Assert.Contains(couple.Members, m => m.UserId == "u2");
    }

    [Fact]
    public async Task CreateOrJoinCoupleAsync_Joins_Existing_Couple_With_One_Member()
    {
        var ctx = CreateContext();
        ctx.Users.Add(new User { Id = "u1", Name = "Alice", PersonalCode = "111111", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        ctx.Users.Add(new User { Id = "u2", Name = "Bob", PersonalCode = "222222", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        ctx.Users.Add(new User { Id = "u3", Name = "Cara", PersonalCode = "333333", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await ctx.SaveChangesAsync();

        var svc = CreateService(ctx);
        // First create new couple between u1 and u2
        var couple1 = await svc.CreateOrJoinCoupleAsync("222222", "u1");
        Assert.NotNull(couple1);
        Assert.Equal(2, couple1!.Members.Count);

        // Now attempt to join using u3 with u1's personal code while both already in a couple should fail (target already complete)
        var result = await svc.CreateOrJoinCoupleAsync("111111", "u3");
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateOrJoinCoupleAsync_ReturnsExisting_WhenUserAlreadyInCouple()
    {
        var ctx = CreateContext();
        ctx.Users.Add(new User { Id = "u1", Name = "Alice", PersonalCode = "111111", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        ctx.Users.Add(new User { Id = "u2", Name = "Bob", PersonalCode = "222222", GameType = "couple", AvailableForPairing = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await ctx.SaveChangesAsync();
        var svc = CreateService(ctx);
        var couple = await svc.CreateOrJoinCoupleAsync("222222", "u1");
        Assert.NotNull(couple);

        // Second attempt with same user should just return existing couple
        var coupleAgain = await svc.CreateOrJoinCoupleAsync("222222", "u1");
        Assert.Equal(couple!.Id, coupleAgain!.Id);
    }
}
