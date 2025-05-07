using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
    {
        public void Configure(EntityTypeBuilder<Subscription> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("Subscriptions");

            builder.Property(e => e.ListingId).IsRequired();
            builder.Property(e => e.BusinessUserId).IsRequired();
            builder.Property(e => e.SubscriptionPlanId).IsRequired();
            builder.Property(e => e.PurchasedAt).IsRequired().HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
            builder.Property(e => e.StartDate).IsRequired().HasColumnType("datetime2");
            builder.Property(e => e.EndDate).IsRequired().HasColumnType("datetime2");
            builder.Property(e => e.ActualPricePaid).IsRequired().HasColumnType("decimal(18,2)");

            builder.HasOne(s => s.BusinessUser)
                   .WithMany(u => u.PurchasedSubscriptions) // Assumes User.PurchasedSubscriptions
                   .HasForeignKey(s => s.BusinessUserId)
                   .OnDelete(DeleteBehavior.Restrict)
                   .HasConstraintName("FK_Subscriptions_Users_BusinessUserId");

            builder.HasOne(s => s.SubscriptionPlan)
                   .WithMany(p => p.Subscriptions) // Assumes SubscriptionPlan.Subscriptions
                   .HasForeignKey(s => s.SubscriptionPlanId)
                   .OnDelete(DeleteBehavior.Restrict)
                   .HasConstraintName("FK_Subscriptions_SubscriptionPlans");

            builder.HasOne(s => s.Listing)
                   .WithMany(l => l.SubscriptionHistory) // Assumes Listing.SubscriptionHistory
                   .HasForeignKey(s => s.ListingId)
                   .OnDelete(DeleteBehavior.Cascade)
                   .HasConstraintName("FK_Subscriptions_Listings_History");

            builder.HasIndex(s => s.BusinessUserId).HasDatabaseName("IX_Subscriptions_BusinessUserId");
            builder.HasIndex(s => s.ListingId).HasDatabaseName("IX_Subscriptions_ListingId");
            builder.HasIndex(s => s.SubscriptionPlanId).HasDatabaseName("IX_Subscriptions_SubscriptionPlanId");
            builder.HasIndex(s => new { s.ListingId, s.EndDate }).HasDatabaseName("IX_Subscriptions_Listing_EndDate");
            builder.HasIndex(e => e.EndDate).HasDatabaseName("IX_Subscriptions_EndDate");
        }
    }
}
