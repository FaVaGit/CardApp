using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComplicityGame.Core.Models;

public class GameDbContext : DbContext
{
    public GameDbContext(DbContextOptions<GameDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Couple> Couples => Set<Couple>();
    public DbSet<CoupleUser> CoupleUsers => Set<CoupleUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.PersonalCode).IsUnique();
            e.Property(u => u.PersonalCode).HasMaxLength(10);
        });

        modelBuilder.Entity<Couple>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).HasMaxLength(200);
            e.HasMany(c => c.Members)
             .WithOne(m => m.Couple)
             .HasForeignKey(m => m.CoupleId);
        });

        modelBuilder.Entity<CoupleUser>(e =>
        {
            e.HasKey(cu => new { cu.CoupleId, cu.UserId });
            e.HasOne(cu => cu.User)
             .WithMany();
        });
    }
}

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string PersonalCode { get; set; } = string.Empty;
    public string GameType { get; set; } = string.Empty;
    public bool AvailableForPairing { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? Nickname { get; set; }
    public bool IsOnline { get; set; } = false;
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;
    public string AuthToken { get; set; } = Guid.NewGuid().ToString();
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
    [NotMapped] public List<User> Users { get; set; } = new();
}

public class CoupleUser
{
    public string CoupleId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public Couple Couple { get; set; } = null!;
    public User User { get; set; } = null!;
}
