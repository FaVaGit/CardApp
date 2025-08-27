using ComplicityGame.Api.Services;
using ComplicityGame.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Entity Framework
builder.Services.AddDbContext<GameDbContext>(options =>
    options.UseSqlite("Data Source=game.db"));

// CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175", 
                          "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", 
                          "http://localhost:5179", "http://localhost:5180",
                          "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175", 
                          "http://127.0.0.1:5176", "http://127.0.0.1:5177", "http://127.0.0.1:5178", 
                          "http://127.0.0.1:5179", "http://127.0.0.1:5180")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// RabbitMQ Event System Services
builder.Services.AddSingleton<IEventPublisher, RabbitMQEventPublisher>();
builder.Services.AddSingleton<IUserPresenceService, UserPresenceService>();
builder.Services.AddScoped<ICoupleMatchingService, CoupleMatchingService>();
builder.Services.AddScoped<IGameSessionService, GameSessionService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("ReactPolicy");
app.UseAuthorization();

app.MapControllers();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
    context.Database.EnsureCreated();
}

app.Run();
