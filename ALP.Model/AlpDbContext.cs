using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
            base.OnModelCreating(modelBuilder);

            // --- User Configuration ---
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Users");

                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(512);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(20).HasConversion<string>();
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => e.Email).IsUnique().HasDatabaseName("UQ_Users_Email");
            });

            // --- SubscriptionPlan Configuration ---
            modelBuilder.Entity<SubscriptionPlan>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("SubscriptionPlans");

                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.DurationInMonths).IsRequired();
                entity.Property(e => e.PricePerMonth).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
                entity.Property(e => e.IsAvailable).IsRequired();
                entity.HasIndex(e => e.IsAvailable).HasDatabaseName("IX_SubscriptionPlans_IsAvailable");
            });

            // --- Listing Hierarchy Configuration (TPH) ---
            modelBuilder.Entity<Listing>(entity =>
            {
                entity.ToTable("Listings");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.BusinessUserId).IsRequired();
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(4000);
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.IsActive).IsRequired();
                entity.Property(e => e.CurrentSubscriptionId).IsRequired(false);

                entity.HasOne(l => l.BusinessUser)
                      .WithMany(u => u.Listings)
                      .HasForeignKey(l => l.BusinessUserId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .HasConstraintName("FK_Listings_Users_BusinessUserId");

                entity.HasOne(l => l.CurrentSubscription)
                      .WithOne()
                      .HasForeignKey<Listing>(l => l.CurrentSubscriptionId)
                      .IsRequired(false)
                      .OnDelete(DeleteBehavior.Restrict)
                      .HasConstraintName("FK_Listings_Subscriptions_CurrentSubscriptionId");

                entity.HasIndex(e => e.BusinessUserId).HasDatabaseName("IX_Listings_BusinessUserId");
                entity.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_Listings_CreatedAt");
                entity.HasIndex(e => e.CurrentSubscriptionId).IsUnique().HasDatabaseName("UQ_Listings_CurrentSubscriptionId");
            });

            modelBuilder.Entity<AssetListing>(entity =>
            {
                entity.Property(e => e.ListingType).IsRequired().HasMaxLength(20).HasConversion<string>();
                entity.Property(e => e.Price).IsRequired().HasColumnType("decimal(18,2)");
                entity.HasIndex(e => e.ListingType).HasDatabaseName("IX_Listings_ListingType");
                entity.HasIndex(e => e.Price).HasDatabaseName("IX_Listings_Price");
            });

            modelBuilder.Entity<RealEstateListing>(entity =>
            {
                entity.Property(e => e.SizeSquareMeters).IsRequired();
                entity.Property(e => e.NumberOfRooms).IsRequired();
                entity.Property(e => e.Address).IsRequired().HasMaxLength(500);
                entity.Property(e => e.City).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PostalCode).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Region).IsRequired().HasMaxLength(100);
                // ... configure other RealEstate specific fields ...
                entity.HasIndex(e => e.City).HasDatabaseName("IX_Listings_City");
                entity.HasIndex(e => e.Region).HasDatabaseName("IX_Listings_Region");
                entity.HasIndex(e => e.PostalCode).HasDatabaseName("IX_Listings_PostalCode");
                entity.HasIndex(e => e.SizeSquareMeters).HasDatabaseName("IX_Listings_SizeSquareMeters");
                // ... other indices ...
            });

            modelBuilder.Entity<AutoListing>(entity =>
            {
                entity.Property(e => e.Make).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Model).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Year).IsRequired();
                entity.Property(e => e.Kilometers).IsRequired();
                entity.HasIndex(e => e.Make).HasDatabaseName("IX_Listings_Make");
                entity.HasIndex(e => e.Model).HasDatabaseName("IX_Listings_Model");
                entity.HasIndex(e => e.Year).HasDatabaseName("IX_Listings_Year");
            });

            modelBuilder.Entity<YachtListing>(entity =>
            {
                entity.Property(e => e.Builder).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Model).IsRequired().HasMaxLength(150);
                entity.Property(e => e.LengthOverallMeters).IsRequired().HasColumnType("decimal(10,2)");
                entity.Property(e => e.BuildYear).IsRequired();
                entity.Property(e => e.Cabins).IsRequired();
                entity.Property(e => e.Berths).IsRequired();
                entity.Property(e => e.Location).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Builder).HasDatabaseName("IX_Listings_Builder");
                entity.HasIndex(e => e.BuildYear).HasDatabaseName("IX_Listings_BuildYear");
                entity.HasIndex(e => e.LengthOverallMeters).HasDatabaseName("IX_Listings_LengthOverallMeters");
            });

            modelBuilder.Entity<JobListing>(entity =>
            {
                entity.Property(e => e.EmploymentType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Location).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Salary).IsRequired().HasColumnType("decimal(18,2)");
                entity.HasIndex(e => e.EmploymentType).HasDatabaseName("IX_Listings_EmploymentType");
                entity.HasIndex(e => e.Location).HasDatabaseName("IX_Listings_Location");
                entity.HasIndex(e => e.Salary).HasDatabaseName("IX_Listings_Salary");
            });

            // --- Subscription Configuration ---
            modelBuilder.Entity<Subscription>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Subscriptions");

                entity.Property(e => e.ListingId).IsRequired();
                entity.Property(e => e.BusinessUserId).IsRequired();
                entity.Property(e => e.SubscriptionPlanId).IsRequired();
                entity.Property(e => e.PurchasedAt).IsRequired().HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.StartDate).IsRequired().HasColumnType("datetime2");
                entity.Property(e => e.EndDate).IsRequired().HasColumnType("datetime2");
                entity.Property(e => e.ActualPricePaid).IsRequired().HasColumnType("decimal(18,2)");

                entity.HasOne(s => s.BusinessUser)
                      .WithMany(u => u.PurchasedSubscriptions)
                      .HasForeignKey(s => s.BusinessUserId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .HasConstraintName("FK_Subscriptions_Users_BusinessUserId");

                entity.HasOne(s => s.SubscriptionPlan)
                      .WithMany(p => p.Subscriptions)
                      .HasForeignKey(s => s.SubscriptionPlanId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .HasConstraintName("FK_Subscriptions_SubscriptionPlans");

                entity.HasOne(s => s.Listing)
                      .WithMany(l => l.SubscriptionHistory)
                      .HasForeignKey(s => s.ListingId)
                      .OnDelete(DeleteBehavior.Cascade)
                      .HasConstraintName("FK_Subscriptions_Listings_History");

                entity.HasIndex(s => s.BusinessUserId).HasDatabaseName("IX_Subscriptions_BusinessUserId");
                entity.HasIndex(s => s.ListingId).HasDatabaseName("IX_Subscriptions_ListingId");
                entity.HasIndex(s => s.SubscriptionPlanId).HasDatabaseName("IX_Subscriptions_SubscriptionPlanId");
                entity.HasIndex(s => new { s.ListingId, s.EndDate }).HasDatabaseName("IX_Subscriptions_Listing_EndDate");
                entity.HasIndex(e => e.EndDate).HasDatabaseName("IX_Subscriptions_EndDate");
            });

            // --- AdditionalProduct Configuration ---
            modelBuilder.Entity<AdditionalProduct>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("AdditionalProducts");

                entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Price).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.Type).IsRequired().HasMaxLength(50).HasConversion<string>(); // Store enum as string
                entity.Property(e => e.DurationInDays).IsRequired(false); // Nullable
                entity.Property(e => e.IsAvailable).IsRequired();

                entity.HasIndex(e => e.Type).HasDatabaseName("IX_AdditionalProducts_Type");
                entity.HasIndex(e => e.IsAvailable).HasDatabaseName("IX_AdditionalProducts_IsAvailable");
            });

            // --- AdditionalProductPurchase Configuration ---
            modelBuilder.Entity<AdditionalProductPurchase>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("AdditionalProductPurchases");

                entity.Property(e => e.BusinessUserId).IsRequired();
                entity.Property(e => e.AdditionalProductId).IsRequired();
                entity.Property(e => e.ListingId).IsRequired(false); // Nullable FK

                entity.Property(e => e.PurchasedAt).IsRequired().HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.ActualPricePaid).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.EffectStartDate).IsRequired(false).HasColumnType("datetime2"); // Nullable
                entity.Property(e => e.EffectEndDate).IsRequired(false).HasColumnType("datetime2");   // Nullable
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasConversion<string>(); // Store enum as string

                // Relationships
                entity.HasOne(app => app.BusinessUser) // Using app for AdditionalProductPurchase
                      .WithMany(u => u.PurchasedAdditionalProducts) // Link to the new collection on User
                      .HasForeignKey(app => app.BusinessUserId)
                      .OnDelete(DeleteBehavior.Restrict) // Prevent deleting user if they have purchases
                      .HasConstraintName("FK_AdditionalProductPurchases_Users");

                entity.HasOne(app => app.AdditionalProduct) // Using app for AdditionalProductPurchase
                      .WithMany(ap => ap.Purchases) // Link to the collection on AdditionalProduct
                      .HasForeignKey(app => app.AdditionalProductId)
                      .OnDelete(DeleteBehavior.Restrict) // Prevent deleting product if it's been purchased
                      .HasConstraintName("FK_AdditionalProductPurchases_AdditionalProducts");

                entity.HasOne(app => app.Listing) // Using app for AdditionalProductPurchase
                      .WithMany(l => l.AdditionalProductPurchases) // Link to the new collection on Listing
                      .HasForeignKey(app => app.ListingId)
                      .IsRequired(false) 
                                         // Let's choose Cascade for now, as a boost purchase is tightly coupled to the listing it affects.
                      .OnDelete(DeleteBehavior.Cascade)
                      .HasConstraintName("FK_AdditionalProductPurchases_Listings");

                // Indexes
                entity.HasIndex(e => e.BusinessUserId).HasDatabaseName("IX_AdditionalProductPurchases_BusinessUserId");
                entity.HasIndex(e => e.AdditionalProductId).HasDatabaseName("IX_AdditionalProductPurchases_AdditionalProductId");
                entity.HasIndex(e => e.ListingId).HasDatabaseName("IX_AdditionalProductPurchases_ListingId");
                entity.HasIndex(e => e.PurchasedAt).HasDatabaseName("IX_AdditionalProductPurchases_PurchasedAt");
                entity.HasIndex(e => new { e.ListingId, e.EffectEndDate }).HasDatabaseName("IX_AdditionalProductPurchases_Listing_EffectEndDate"); // Useful for finding active boosts
                entity.HasIndex(e => e.Status).HasDatabaseName("IX_AdditionalProductPurchases_Status"); // Useful for finding pending, completed, active etc.
            });
        }
    }
}
