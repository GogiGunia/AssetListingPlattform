using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class AutoListingConfiguration : IEntityTypeConfiguration<AutoListing>
    {
        public void Configure(EntityTypeBuilder<AutoListing> builder)
        {
            // No ToTable() call here as it inherits from the base ListingConfiguration (TPH)

            // Properties specific to AutoListing
            builder.Property(e => e.Make).IsRequired().HasMaxLength(100);
            builder.Property(e => e.AutoModel).IsRequired().HasMaxLength(100); // Corrected from e.Model to e.AutoModel if that's the property name
            builder.Property(e => e.Year).IsRequired();
            builder.Property(e => e.Kilometers).IsRequired();

            // Indexes for AutoListing specific properties
            builder.HasIndex(e => e.Make).HasDatabaseName("IX_Listings_Make");
            builder.HasIndex(e => e.AutoModel).HasDatabaseName("IX_Listings_Model"); // Name kept as IX_Listings_Model from original
            builder.HasIndex(e => e.Year).HasDatabaseName("IX_Listings_Year");
        }
    }
}
