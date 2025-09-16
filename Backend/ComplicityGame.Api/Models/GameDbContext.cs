using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using ComplicityGame.Core.Models; // Use shared domain models

namespace ComplicityGame.Api.Models;

public class GameDbContext : DbContext
{
    public GameDbContext(DbContextOptions<GameDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Couple> Couples { get; set; }
    public DbSet<CoupleUser> CoupleUsers { get; set; }
    public DbSet<GameSession> GameSessions { get; set; }
    public DbSet<GameMessage> GameMessages { get; set; }
    public DbSet<SharedCard> SharedCards { get; set; }
    public DbSet<GameCard> GameCards { get; set; }
    public DbSet<Card> Cards { get; set; }
    public DbSet<CoupleJoinRequest> CoupleJoinRequests { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Additional API-only entities configuration
        modelBuilder.Entity<GameSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Couple)
                  .WithMany()
                  .HasForeignKey(e => e.CoupleId);
        });

        modelBuilder.Entity<GameMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.GameSession)
                  .WithMany(e => e.Messages)
                  .HasForeignKey(e => e.SessionId);
            entity.HasOne(e => e.Sender)
                  .WithMany();
        });

        modelBuilder.Entity<SharedCard>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.GameSession)
                  .WithMany(e => e.SharedCards)
                  .HasForeignKey(e => e.SessionId);
            entity.HasOne(e => e.SharedBy)
                  .WithMany();
        });

        modelBuilder.Entity<CoupleJoinRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TargetUserId, e.Status });
            entity.Property(e => e.Status).HasMaxLength(20);
        });
    }
}

public class GameSession
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string CoupleId { get; set; } = string.Empty;
    public string SessionType { get; set; } = "couple";
    public string CreatedBy { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public Couple Couple { get; set; } = null!;
    public List<GameMessage> Messages { get; set; } = new();
    public List<SharedCard> SharedCards { get; set; } = new();
}

public class GameMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SessionId { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string MessageType { get; set; } = "text"; // "text", "card_share", etc.
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public GameSession GameSession { get; set; } = null!;
    public User Sender { get; set; } = null!;
}

public class SharedCard
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SessionId { get; set; } = string.Empty;
    public string SharedById { get; set; } = string.Empty;
    public string CardData { get; set; } = string.Empty; // JSON serialized card data
    public DateTime SharedAt { get; set; } = DateTime.UtcNow;
    
    public GameSession GameSession { get; set; } = null!;
    public User SharedBy { get; set; } = null!;
}

public class GameCard
{
    public int Id { get; set; }
    public string GameType { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int Level { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CoupleJoinRequest
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RequestingUserId { get; set; } = string.Empty; // chi chiede
    public string TargetUserId { get; set; } = string.Empty; // utente che deve approvare
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
}

public class Card
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SessionId { get; set; } = string.Empty;
    public string CardType { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty; // JSON serialized content
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public GameSession GameSession { get; set; } = null!;
}
