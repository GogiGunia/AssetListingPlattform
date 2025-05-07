using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class AdditionalProductPurchaseConfiguration : IEntityTypeConfiguration<AdditionalProductPurchase>
    {
        public void Configure(EntityTypeBuilder<AdditionalProductPurchase> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("AdditionalProductPurchases");

            builder.Property(e => e.BusinessUserId).IsRequired();
            builder.Property(e => e.AdditionalProductId).IsRequired();
            builder.Property(e => e.ListingId).IsRequired(false); // Nullable FK

            builder.Property(e => e.PurchasedAt).IsRequired().HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
            builder.Property(e => e.ActualPricePaid).IsRequired().HasColumnType("decimal(18,2)");
            builder.Property(e => e.EffectStartDate).IsRequired(false).HasColumnType("datetime2"); // Nullable
            builder.Property(e => e.EffectEndDate).IsRequired(false).HasColumnType("datetime2");   // Nullable
            builder.Property(e => e.Status).IsRequired().HasMaxLength(50).HasConversion<string>(); // Store enum as string

            // Relationships
            builder.HasOne(app => app.BusinessUser)
                   .WithMany(u => u.PurchasedAdditionalProducts) // Assumes User.PurchasedAdditionalProducts
                   .HasForeignKey(app => app.BusinessUserId)
                   .OnDelete(DeleteBehavior.Restrict)
                   .HasConstraintName("FK_AdditionalProductPurchases_Users");

            builder.HasOne(app => app.AdditionalProduct)
                   .WithMany(ap => ap.Purchases) // Assumes AdditionalProduct.Purchases
                   .HasForeignKey(app => app.AdditionalProductId)
                   .OnDelete(DeleteBehavior.Restrict)
                   .HasConstraintName("FK_AdditionalProductPurchases_AdditionalProducts");

            builder.HasOne(app => app.Listing)
                   .WithMany(l => l.AdditionalProductPurchases) // Assumes Listing.AdditionalProductPurchases
                   .HasForeignKey(app => app.ListingId)
                   .IsRequired(false)
                   .OnDelete(DeleteBehavior.Cascade) // As per original, cascade delete if listing is removed
                   .HasConstraintName("FK_AdditionalProductPurchases_Listings");

            // Indexes
            builder.HasIndex(e => e.BusinessUserId).HasDatabaseName("IX_AdditionalProductPurchases_BusinessUserId");
            builder.HasIndex(e => e.AdditionalProductId).HasDatabaseName("IX_AdditionalProductPurchases_AdditionalProductId");
            builder.HasIndex(e => e.ListingId).HasDatabaseName("IX_AdditionalProductPurchases_ListingId");
            builder.HasIndex(e => e.PurchasedAt).HasDatabaseName("IX_AdditionalProductPurchases_PurchasedAt");
            builder.HasIndex(e => new { e.ListingId, e.EffectEndDate }).HasDatabaseName("IX_AdditionalProductPurchases_Listing_EffectEndDate");
            builder.HasIndex(e => e.Status).HasDatabaseName("IX_AdditionalProductPurchases_Status");
        }
    }
}
