using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;
using Microsoft.EntityFrameworkCore;

public partial class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.WebHost.UseUrls("http://localhost:5000");

        builder.Services.AddControllers().AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        });
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var useInMemory = Environment.GetEnvironmentVariable("USE_INMEMORY_DB") == "1";
        if (useInMemory)
            builder.Services.AddDbContext<GameDbContext>(opt => opt.UseInMemoryDatabase("GameDb"));
        else
            builder.Services.AddDbContext<GameDbContext>(opt => opt.UseSqlite("Data Source=game.db"));

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("DevAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
        });

        builder.Services.AddSingleton<IEventPublisher, MockEventPublisher>();
        builder.Services.AddSingleton<IUserPresenceService, UserPresenceService>();
        builder.Services.AddScoped<ICoupleMatchingService, CoupleMatchingService>();
        builder.Services.AddScoped<IGameSessionService, GameSessionService>();

        var app = builder.Build();
        Console.WriteLine("[BOOT] ComplicityGame.Api avviato. URL: http://localhost:5000");

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.Use(async (ctx, next) =>
        {
            var start = DateTime.UtcNow;
            await next();
            var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;
            Console.WriteLine($"[REQ] {ctx.Request.Method} {ctx.Request.Path} => {ctx.Response.StatusCode} {elapsed:F0}ms");
        });

        app.UseCors("DevAll");
        app.UseAuthorization();
        app.MapControllers();

        using (var scope = app.Services.CreateScope())
        {
            var ctx = scope.ServiceProvider.GetRequiredService<GameDbContext>();
            ctx.Database.EnsureCreated();
            try
            {
                using var conn = ctx.Database.GetDbConnection();
                await conn.OpenAsync();
                var existingCols = new List<string>();
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "PRAGMA table_info('Users')";
                    using var r = await cmd.ExecuteReaderAsync();
                    while (await r.ReadAsync()) existingCols.Add(r.GetString(1));
                }
                if (!existingCols.Contains("AuthToken"))
                {
                    using var alter = conn.CreateCommand();
                    alter.CommandText = "ALTER TABLE Users ADD COLUMN AuthToken TEXT";
                    await alter.ExecuteNonQueryAsync();
                    foreach (var u in ctx.Users) u.AuthToken = Guid.NewGuid().ToString();
                    await ctx.SaveChangesAsync();
                }
                using (var chk = conn.CreateCommand())
                {
                    chk.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='CoupleJoinRequests'";
                    var exists = await chk.ExecuteScalarAsync();
                    if (exists == null)
                    {
                        using (var create = conn.CreateCommand())
                        {
                            create.CommandText = @"CREATE TABLE CoupleJoinRequests (
Id TEXT PRIMARY KEY,
RequestingUserId TEXT NOT NULL,
TargetUserId TEXT NOT NULL,
Status TEXT NOT NULL,
CreatedAt TEXT NOT NULL,
RespondedAt TEXT NULL
);";
                            await create.ExecuteNonQueryAsync();
                        }
                        using (var idx = conn.CreateCommand())
                        {
                            idx.CommandText = "CREATE INDEX IDX_CoupleJoin_Target_Status ON CoupleJoinRequests (TargetUserId, Status);";
                            await idx.ExecuteNonQueryAsync();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SchemaPatch] Warning: {ex.Message}");
            }
        }

        await app.RunAsync();
    }
}
