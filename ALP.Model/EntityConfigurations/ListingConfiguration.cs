using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class ListingConfiguration : IEntityTypeConfiguration<Listing>
    {
        public void Configure(EntityTypeBuilder<Listing> builder)
        {
            builder.ToTable("Listings"); // This sets the table for the TPH hierarchy
            builder.HasKey(e => e.Id);

            // Common properties for all listings
            builder.Property(e => e.BusinessUserId).IsRequired();
            builder.Property(e => e.Title).IsRequired().HasMaxLength(255);
            builder.Property(e => e.Description).IsRequired().HasMaxLength(4000);
            builder.Property(e => e.CreatedAt).IsRequired().HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
            builder.Property(e => e.IsActive).IsRequired();
            builder.Property(e => e.CurrentSubscriptionId).IsRequired(false);

            // Relationships
            builder.HasOne(l => l.BusinessUser)
                   .WithMany(u => u.Listings) // Assumes User has ICollection<Listing> Listings
                   .HasForeignKey(l => l.BusinessUserId)
                   .OnDelete(DeleteBehavior.Restrict)
                   .HasConstraintName("FK_Listings_Users_BusinessUserId");

            builder.HasOne(l => l.CurrentSubscription)
                   .WithOne() // Assuming Subscription doesn't have a direct nav prop back or it's configured elsewhere
                   .HasForeignKey<Listing>(l => l.CurrentSubscriptionId)
                   .IsRequired(false)
                   .OnDelete(DeleteBehavior.Restrict)
                   .HasConstraintName("FK_Listings_Subscriptions_CurrentSubscriptionId");

            // Indexes for common properties
            builder.HasIndex(e => e.BusinessUserId).HasDatabaseName("IX_Listings_BusinessUserId");
            builder.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_Listings_CreatedAt");
            builder.HasIndex(e => e.CurrentSubscriptionId).IsUnique().HasDatabaseName("UQ_Listings_CurrentSubscriptionId");
        }
    }
}
