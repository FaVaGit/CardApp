using System.Text.Json;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ComplicityGame.Core.Models;

namespace ComplicityGame.Tests;

public class JoinRejectionCancellationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public JoinRejectionCancellationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<GameDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                services.AddDbContext<GameDbContext>(o => o.UseInMemoryDatabase("itest-db-joinreject" + Guid.NewGuid()));
            });
        });
    }

    [Fact]
    public async Task RequestRejected_DoesNotCreateCoupleOrSession()
    {
        var client = _factory.CreateClient();
        // Connect users A and B
        var a = await client.PostAsJsonAsync("/api/EventDrivenGame/connect", new { name = "Carla", gameType = "couple" });
        var b = await client.PostAsJsonAsync("/api/EventDrivenGame/connect", new { name = "Diego", gameType = "couple" });
        a.EnsureSuccessStatusCode();
        b.EnsureSuccessStatusCode();
        var aJson = await a.Content.ReadFromJsonAsync<JsonElement>();
        var bJson = await b.Content.ReadFromJsonAsync<JsonElement>();
        string aId = aJson.GetProperty("userId").GetString()!;
        string bId = bJson.GetProperty("userId").GetString()!;

        // A requests join to B
        var rq = await client.PostAsJsonAsync("/api/EventDrivenGame/request-join", new { requestingUserId = aId, targetUserId = bId });
        rq.EnsureSuccessStatusCode();
        var rqJson = await rq.Content.ReadFromJsonAsync<JsonElement>();
        string requestId = rqJson.GetProperty("requestId").GetString()!;

        // B rejects
        var resp = await client.PostAsJsonAsync("/api/EventDrivenGame/respond-join", new { requestId, targetUserId = bId, approve = false });
        resp.EnsureSuccessStatusCode();
        var respJson = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(respJson.GetProperty("success").GetBoolean());
        Assert.False(respJson.GetProperty("approved").GetBoolean());

        // Snapshot for both should show no couple / no gameSession
        var snapA = await client.GetAsync($"/api/EventDrivenGame/snapshot/{aId}");
        var snapB = await client.GetAsync($"/api/EventDrivenGame/snapshot/{bId}");
        snapA.EnsureSuccessStatusCode();
        snapB.EnsureSuccessStatusCode();
        var sA = await snapA.Content.ReadFromJsonAsync<JsonElement>();
        var sB = await snapB.Content.ReadFromJsonAsync<JsonElement>();
        bool hasSessionA = sA.TryGetProperty("gameSession", out var gsA) && gsA.ValueKind == JsonValueKind.Object;
        bool hasSessionB = sB.TryGetProperty("gameSession", out var gsB) && gsB.ValueKind == JsonValueKind.Object;
        Assert.False(hasSessionA);
        Assert.False(hasSessionB);
    }

    [Fact]
    public async Task RequestCancelled_ByRequester_RemovesPendingRequest()
    {
        var client = _factory.CreateClient();
        // Connect users E and F
        var e = await client.PostAsJsonAsync("/api/EventDrivenGame/connect", new { name = "Elena", gameType = "couple" });
        var f = await client.PostAsJsonAsync("/api/EventDrivenGame/connect", new { name = "Fabio", gameType = "couple" });
        e.EnsureSuccessStatusCode();
        f.EnsureSuccessStatusCode();
        var eJson = await e.Content.ReadFromJsonAsync<JsonElement>();
        var fJson = await f.Content.ReadFromJsonAsync<JsonElement>();
        string eId = eJson.GetProperty("userId").GetString()!;
        string fId = fJson.GetProperty("userId").GetString()!;

        // E requests join to F
        var rq = await client.PostAsJsonAsync("/api/EventDrivenGame/request-join", new { requestingUserId = eId, targetUserId = fId });
        rq.EnsureSuccessStatusCode();
        var rqJson = await rq.Content.ReadFromJsonAsync<JsonElement>();
        string requestId = rqJson.GetProperty("requestId").GetString()!;

        // E cancels
        var cancel = await client.PostAsJsonAsync("/api/EventDrivenGame/cancel-join", new { requestingUserId = eId, targetUserId = fId });
        cancel.EnsureSuccessStatusCode();
        var cancelJson = await cancel.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(cancelJson.GetProperty("success").GetBoolean());
        Assert.True(cancelJson.GetProperty("cancelled").GetBoolean());

        // Snapshot F should have no incoming requests; snapshot E no outgoing
        var snapE = await client.GetAsync($"/api/EventDrivenGame/snapshot/{eId}");
        var snapF = await client.GetAsync($"/api/EventDrivenGame/snapshot/{fId}");
        snapE.EnsureSuccessStatusCode();
        snapF.EnsureSuccessStatusCode();
        var sE = await snapE.Content.ReadFromJsonAsync<JsonElement>();
        var sF = await snapF.Content.ReadFromJsonAsync<JsonElement>();
        bool anyOutgoing = sE.TryGetProperty("outgoingRequests", out var outE) && outE.ValueKind == JsonValueKind.Array && outE.GetArrayLength() > 0;
        bool anyIncoming = sF.TryGetProperty("incomingRequests", out var inF) && inF.ValueKind == JsonValueKind.Array && inF.GetArrayLength() > 0;
        Assert.False(anyOutgoing);
        Assert.False(anyIncoming);
    }
}
