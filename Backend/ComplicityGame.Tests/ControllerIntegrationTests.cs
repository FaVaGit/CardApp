using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using System.Threading.Tasks;
using ComplicityGame.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

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
        var u1 = await client.PostAsJsonAsync("/api/game/connect", new { name = "Anna", gameType = "couple" });
        u1.EnsureSuccessStatusCode();
        dynamic u1Payload = await u1.Content.ReadFromJsonAsync<dynamic>();
        string user1Id = (string)u1Payload.user.id;
        string code1 = (string)u1Payload.user.personalCode;

        // 2. Connect second user
        var u2 = await client.PostAsJsonAsync("/api/game/connect", new { name = "Bruno", gameType = "couple" });
        u2.EnsureSuccessStatusCode();
        dynamic u2Payload = await u2.Content.ReadFromJsonAsync<dynamic>();
        string user2Id = (string)u2Payload.user.id;
        string code2 = (string)u2Payload.user.personalCode;

        // 3. user1 richiede join verso user2 (usiamo codice di user2)
        var rq = await client.PostAsJsonAsync("/api/game/request-join", new { requestingUserId = user1Id, targetUserCode = code2 });
        rq.EnsureSuccessStatusCode();
        dynamic rqPayload = await rq.Content.ReadFromJsonAsync<dynamic>();
        string requestId = (string)rqPayload.request.id;

        // 4. user2 approva
        var resp = await client.PostAsJsonAsync($"/api/game/respond-join/{requestId}", new { targetUserId = user2Id, approve = true });
        resp.EnsureSuccessStatusCode();

        // 5. snapshot di entrambi e controlla sessionId
        var snap1 = await client.GetAsync($"/api/game/snapshot/{user1Id}");
        var snap2 = await client.GetAsync($"/api/game/snapshot/{user2Id}");
        snap1.EnsureSuccessStatusCode();
        snap2.EnsureSuccessStatusCode();
        dynamic s1 = await snap1.Content.ReadFromJsonAsync<dynamic>();
        dynamic s2 = await snap2.Content.ReadFromJsonAsync<dynamic>();
        string session1 = (string?)s1?.activeGameSession?.id;
        string session2 = (string?)s2?.activeGameSession?.id;
        Assert.False(string.IsNullOrWhiteSpace(session1));
        Assert.Equal(session1, session2);
    }
}
