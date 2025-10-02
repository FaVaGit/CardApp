using System.Text.Json;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ComplicityGame.Core.Models;

namespace ComplicityGame.Tests;

public class DrawCardFlowTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public DrawCardFlowTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<GameDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                services.AddDbContext<GameDbContext>(o => o.UseInMemoryDatabase("itest-db-drawcard" + Guid.NewGuid()));
            });
        });
    }

    [Fact]
    public async Task CoupleAutoSession_DrawCard_Succeeds()
    {
        var client = _factory.CreateClient();
        // Connect both users
        var u1 = await client.PostAsJsonAsync("/api/EventDrivenGame/connect", new { name = "Gina", gameType = "couple" });
        var u2 = await client.PostAsJsonAsync("/api/EventDrivenGame/connect", new { name = "Hugo", gameType = "couple" });
        u1.EnsureSuccessStatusCode();
        u2.EnsureSuccessStatusCode();
        var u1Json = await u1.Content.ReadFromJsonAsync<JsonElement>();
        var u2Json = await u2.Content.ReadFromJsonAsync<JsonElement>();
        string id1 = u1Json.GetProperty("userId").GetString()!;
        string id2 = u2Json.GetProperty("userId").GetString()!;

        // Request join id1 -> id2
        var rq = await client.PostAsJsonAsync("/api/EventDrivenGame/request-join", new { requestingUserId = id1, targetUserId = id2 });
        rq.EnsureSuccessStatusCode();
        var rqJson = await rq.Content.ReadFromJsonAsync<JsonElement>();
        string requestId = rqJson.GetProperty("requestId").GetString()!;

        // Approve join (auto session expected)
        var resp = await client.PostAsJsonAsync("/api/EventDrivenGame/respond-join", new { requestId, targetUserId = id2, approve = true });
        resp.EnsureSuccessStatusCode();
        var respJson = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(respJson.GetProperty("approved").GetBoolean());
        var gameSessionObj = respJson.GetProperty("gameSession");
        string sessionId = gameSessionObj.GetProperty("id").GetString()!;

        // Draw card user1
        var draw = await client.PostAsJsonAsync("/api/EventDrivenGame/draw-card", new { sessionId, userId = id1 });
        draw.EnsureSuccessStatusCode();
        var drawJson = await draw.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(drawJson.GetProperty("success").GetBoolean());
        var card = drawJson.GetProperty("card");
        Assert.Equal("couple", card.GetProperty("gameType").GetString());
        Assert.False(string.IsNullOrWhiteSpace(card.GetProperty("content").GetString()));
        Assert.True(card.GetProperty("id").GetInt32() >= 0);
    }
}
