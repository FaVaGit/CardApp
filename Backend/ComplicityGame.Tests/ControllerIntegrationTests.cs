using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using System.Threading.Tasks;
using ComplicityGame.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;

namespace ComplicityGame.Tests;

// Typed DTOs for test clarity (scoped within namespace)
public record ConnectResponse(bool success, StatusDto? status, string personalCode, string authToken, string userId);
public record StatusDto(string? userId, string? coupleId);
public record RequestJoinResponse(bool success, string requestId, string status);
public record SnapshotResponse(bool success, StatusDto? status, GameSessionDto? gameSession, PartnerInfoDto? partnerInfo, JsonElement? users, JsonElement? outgoingRequests, JsonElement? incomingRequests);
public record GameSessionDto(string id, bool isActive, DateTime createdAt);
public record PartnerInfoDto(string userId, string name, string? personalCode);

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
    var u1Payload = await u1.Content.ReadFromJsonAsync<ConnectResponse>();
    Assert.NotNull(u1Payload);
    string user1Id = u1Payload!.userId;
    string code1 = u1Payload.personalCode;

        // 2. Connect second user
        var u2 = await client.PostAsJsonAsync("/api/EventDrivenGame/connect", new { name = "Bruno", gameType = "couple" });
        u2.EnsureSuccessStatusCode();
    var u2Payload = await u2.Content.ReadFromJsonAsync<ConnectResponse>();
    Assert.NotNull(u2Payload);
    string user2Id = u2Payload!.userId;
    string code2 = u2Payload.personalCode;

        // 3. user1 richiede join verso user2 (usiamo userId del target)
        var rq = await client.PostAsJsonAsync("/api/EventDrivenGame/request-join", new { requestingUserId = user1Id, targetUserId = user2Id });
        rq.EnsureSuccessStatusCode();
    var rqPayload = await rq.Content.ReadFromJsonAsync<RequestJoinResponse>();
    Assert.NotNull(rqPayload);
    string requestId = rqPayload!.requestId;

        // 4. user2 approva
        var resp = await client.PostAsJsonAsync($"/api/EventDrivenGame/respond-join", new { requestId, targetUserId = user2Id, approve = true });
        resp.EnsureSuccessStatusCode();

        // 5. snapshot di entrambi e controlla sessionId
        var snap1 = await client.GetAsync($"/api/EventDrivenGame/snapshot/{user1Id}");
        var snap2 = await client.GetAsync($"/api/EventDrivenGame/snapshot/{user2Id}");
        snap1.EnsureSuccessStatusCode();
        snap2.EnsureSuccessStatusCode();
        var s1Payload = await snap1.Content.ReadFromJsonAsync<SnapshotResponse>();
        var s2Payload = await snap2.Content.ReadFromJsonAsync<SnapshotResponse>();
        string? session1 = s1Payload?.gameSession?.id;
        string? session2 = s2Payload?.gameSession?.id;
        Assert.False(string.IsNullOrWhiteSpace(session1));
        Assert.Equal(session1, session2);
    }
}
