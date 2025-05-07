using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class JobListingConfiguration : IEntityTypeConfiguration<JobListing>
    {
        public void Configure(EntityTypeBuilder<JobListing> builder)
        {
            // No ToTable() call here as it inherits from the base ListingConfiguration (TPH)

            // Properties specific to JobListing
            builder.Property(e => e.EmploymentType).IsRequired().HasMaxLength(50);
            builder.Property(e => e.JobLocation).IsRequired().HasMaxLength(255);
            builder.Property(e => e.Salary).IsRequired().HasColumnType("decimal(18,2)");

            // Indexes for JobListing specific properties
            builder.HasIndex(e => e.EmploymentType).HasDatabaseName("IX_Listings_EmploymentType");
            builder.HasIndex(e => e.JobLocation).HasDatabaseName("IX_Listings_Location"); // Name kept as IX_Listings_Location from original
            builder.HasIndex(e => e.Salary).HasDatabaseName("IX_Listings_Salary");
        }
    }
}
