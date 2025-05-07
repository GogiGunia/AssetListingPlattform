using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class RealEstateListingConfiguration : IEntityTypeConfiguration<RealEstateListing>
    {
        public void Configure(EntityTypeBuilder<RealEstateListing> builder)
        {
            // No ToTable() call here as it inherits from the base ListingConfiguration (TPH)

            // Properties specific to RealEstateListing
            builder.Property(e => e.SizeSquareMeters).IsRequired();
            builder.Property(e => e.NumberOfRooms).IsRequired();
            builder.Property(e => e.Address).IsRequired().HasMaxLength(500);
            builder.Property(e => e.City).IsRequired().HasMaxLength(100);
            builder.Property(e => e.PostalCode).IsRequired().HasMaxLength(20);
            builder.Property(e => e.Region).IsRequired().HasMaxLength(100);
            // ... configure other RealEstate specific fields ...

            // Indexes for RealEstateListing specific properties
            // These will be created on the "Listings" table due to TPH
            builder.HasIndex(e => e.City).HasDatabaseName("IX_Listings_City");
            builder.HasIndex(e => e.Region).HasDatabaseName("IX_Listings_Region");
            builder.HasIndex(e => e.PostalCode).HasDatabaseName("IX_Listings_PostalCode");
            builder.HasIndex(e => e.SizeSquareMeters).HasDatabaseName("IX_Listings_SizeSquareMeters");
            // ... other indices for RealEstateListing specific fields ...
        }
    }
}
