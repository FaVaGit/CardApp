using Microsoft.EntityFrameworkCore;

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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PersonalCode).IsRequired().HasMaxLength(10);
            entity.HasIndex(e => e.PersonalCode).IsUnique();
            entity.Property(e => e.GameType).IsRequired().HasMaxLength(50);
        });

        // Couple configuration
        modelBuilder.Entity<Couple>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
        });

        // CoupleUser many-to-many relationship
        modelBuilder.Entity<CoupleUser>(entity =>
        {
            entity.HasKey(e => new { e.CoupleId, e.UserId });
            entity.HasOne(e => e.Couple)
                  .WithMany(e => e.Members)
                  .HasForeignKey(e => e.CoupleId);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId);
        });

        // GameSession configuration
        modelBuilder.Entity<GameSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Couple)
                  .WithMany()
                  .HasForeignKey(e => e.CoupleId);
        });

        // GameMessage configuration
        modelBuilder.Entity<GameMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.GameSession)
                  .WithMany(e => e.Messages)
                  .HasForeignKey(e => e.SessionId);
            entity.HasOne(e => e.Sender)
                  .WithMany()
                  .HasForeignKey(e => e.SenderId);
        });

        // SharedCard configuration
        modelBuilder.Entity<SharedCard>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.GameSession)
                  .WithMany(e => e.SharedCards)
                  .HasForeignKey(e => e.SessionId);
            entity.HasOne(e => e.SharedBy)
                  .WithMany()
                  .HasForeignKey(e => e.SharedById);
        });
    }
}

// Entity Models
public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string? Nickname { get; set; }
    public string PersonalCode { get; set; } = string.Empty;
    public string GameType { get; set; } = string.Empty;
    public bool AvailableForPairing { get; set; } = true;
    public bool IsOnline { get; set; } = false;
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Couple
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string GameType { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public List<CoupleUser> Members { get; set; } = new();
}

public class CoupleUser
{
    public string CoupleId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "creator" or "member"
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    public Couple Couple { get; set; } = null!;
    public User User { get; set; } = null!;
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

public class Card
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SessionId { get; set; } = string.Empty;
    public string CardType { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty; // JSON serialized content
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public GameSession GameSession { get; set; } = null!;
}
