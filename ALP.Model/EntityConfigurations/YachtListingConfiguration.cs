using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class YachtListingConfiguration : IEntityTypeConfiguration<YachtListing>
    {
        public void Configure(EntityTypeBuilder<YachtListing> builder)
        {
            // No ToTable() call here as it inherits from the base ListingConfiguration (TPH)

            // Properties specific to YachtListing
            builder.Property(e => e.Builder).IsRequired().HasMaxLength(150);
            builder.Property(e => e.YachtModel).IsRequired().HasMaxLength(150); // Corrected from e.Model to e.YachtModel if that's the property name
            builder.Property(e => e.LengthOverallMeters).IsRequired().HasColumnType("decimal(10,2)");
            builder.Property(e => e.BuildYear).IsRequired();
            builder.Property(e => e.Cabins).IsRequired();
            builder.Property(e => e.Berths).IsRequired();
            builder.Property(e => e.YachtLocation).IsRequired().HasMaxLength(255);

            // Indexes for YachtListing specific properties
            builder.HasIndex(e => e.Builder).HasDatabaseName("IX_Listings_Builder");
            builder.HasIndex(e => e.BuildYear).HasDatabaseName("IX_Listings_BuildYear");
            builder.HasIndex(e => e.LengthOverallMeters).HasDatabaseName("IX_Listings_LengthOverallMeters");
        }
    }
}
