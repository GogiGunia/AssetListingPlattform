using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;

namespace ALP.Model
{
    public class AlpDbContext : DbContext
    {
        public AlpDbContext(DbContextOptions<AlpDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Listing> Listings { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AlpDbContext).Assembly);
        }
    }
}
