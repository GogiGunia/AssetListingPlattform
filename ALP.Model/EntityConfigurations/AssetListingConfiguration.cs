using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class AssetListingConfiguration : IEntityTypeConfiguration<AssetListing>
    {
        public void Configure(EntityTypeBuilder<AssetListing> builder)
        {
            // No ToTable() call here - it inherits the table from the base ListingConfiguration.
            // Properties specific to AssetListing
            builder.Property(e => e.ListingType).IsRequired().HasMaxLength(20).HasConversion<string>();
            builder.Property(e => e.Price).IsRequired().HasColumnType("decimal(18,2)");

            // Indexes for AssetListing specific properties (will be created on the "Listings" table)
            builder.HasIndex(e => e.ListingType).HasDatabaseName("IX_Listings_ListingType");
            builder.HasIndex(e => e.Price).HasDatabaseName("IX_Listings_Price");
        }
    }
}
