using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class AdditionalProductConfiguration : IEntityTypeConfiguration<AdditionalProduct>
    {
        public void Configure(EntityTypeBuilder<AdditionalProduct> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("AdditionalProducts");

            builder.Property(e => e.Name).IsRequired().HasMaxLength(150);
            builder.Property(e => e.Description).IsRequired().HasMaxLength(500);
            builder.Property(e => e.Price).IsRequired().HasColumnType("decimal(18,2)");
            builder.Property(e => e.Type).IsRequired().HasMaxLength(50).HasConversion<string>(); // Store enum as string
            builder.Property(e => e.DurationInDays).IsRequired(false); // Nullable
            builder.Property(e => e.IsAvailable).IsRequired();

            builder.HasIndex(e => e.Type).HasDatabaseName("IX_AdditionalProducts_Type");
            builder.HasIndex(e => e.IsAvailable).HasDatabaseName("IX_AdditionalProducts_IsAvailable");
        }
    }
}
