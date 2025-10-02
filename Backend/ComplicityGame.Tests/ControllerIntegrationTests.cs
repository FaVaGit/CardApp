using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using System.Threading.Tasks;
using ComplicityGame.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;

namespace ComplicityGame.Tests;

public class ControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace DB with in-memory for tests if not already
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<GameDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                services.AddDbContext<GameDbContext>(o => o.UseInMemoryDatabase("itest-db" + Guid.NewGuid()));
            });
        });
    }

    [Fact]
    public async Task JoinFlow_RespondApprove_StartsSession_ForBoth()
    {
        var client = _factory.CreateClient();

        // 1. Connect first user
        var u1 = await client.PostAsJsonAsync("/api/EventDrivenGame/connect", new { name = "Anna", gameType = "couple" });
        u1.EnsureSuccessStatusCode();
        var u1Json = await u1.Content.ReadFromJsonAsync<JsonElement>();
        string user1Id = u1Json.GetProperty("userId").GetString()!;
        string code1 = u1Json.GetProperty("personalCode").GetString()!;

        // 2. Connect second user
        var u2 = await client.PostAsJsonAsync("/api/EventDrivenGame/connect", new { name = "Bruno", gameType = "couple" });
        u2.EnsureSuccessStatusCode();
        var u2Json = await u2.Content.ReadFromJsonAsync<JsonElement>();
        string user2Id = u2Json.GetProperty("userId").GetString()!;
        string code2 = u2Json.GetProperty("personalCode").GetString()!;

        // 3. user1 richiede join verso user2 (usiamo userId del target)
        var rq = await client.PostAsJsonAsync("/api/EventDrivenGame/request-join", new { requestingUserId = user1Id, targetUserId = user2Id });
        rq.EnsureSuccessStatusCode();
        var rqJson = await rq.Content.ReadFromJsonAsync<JsonElement>();
        string requestId = rqJson.GetProperty("requestId").GetString()!;

        // 4. user2 approva
        var resp = await client.PostAsJsonAsync($"/api/EventDrivenGame/respond-join", new { requestId, targetUserId = user2Id, approve = true });
        resp.EnsureSuccessStatusCode();

        // 5. snapshot di entrambi e controlla sessionId
        var snap1 = await client.GetAsync($"/api/EventDrivenGame/snapshot/{user1Id}");
        var snap2 = await client.GetAsync($"/api/EventDrivenGame/snapshot/{user2Id}");
        snap1.EnsureSuccessStatusCode();
        snap2.EnsureSuccessStatusCode();
        var s1Json = await snap1.Content.ReadFromJsonAsync<JsonElement>();
        var s2Json = await snap2.Content.ReadFromJsonAsync<JsonElement>();
        string? session1 = s1Json.TryGetProperty("gameSession", out var gs1) && gs1.ValueKind == JsonValueKind.Object && gs1.TryGetProperty("id", out var id1) ? id1.GetString() : null;
        string? session2 = s2Json.TryGetProperty("gameSession", out var gs2) && gs2.ValueKind == JsonValueKind.Object && gs2.TryGetProperty("id", out var id2) ? id2.GetString() : null;
        Assert.False(string.IsNullOrWhiteSpace(session1));
        Assert.Equal(session1, session2);
    }
}
