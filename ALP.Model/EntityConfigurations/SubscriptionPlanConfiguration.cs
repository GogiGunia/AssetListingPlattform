using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
    {
        public void Configure(EntityTypeBuilder<SubscriptionPlan> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("SubscriptionPlans");

            builder.Property(e => e.Name).IsRequired().HasMaxLength(100);
            builder.Property(e => e.DurationInMonths).IsRequired();
            builder.Property(e => e.PricePerMonth).IsRequired().HasColumnType("decimal(18,2)");
            builder.Property(e => e.Description).IsRequired().HasMaxLength(500);
            builder.Property(e => e.IsAvailable).IsRequired();
            builder.HasIndex(e => e.IsAvailable).HasDatabaseName("IX_SubscriptionPlans_IsAvailable");
        }
    }
}
