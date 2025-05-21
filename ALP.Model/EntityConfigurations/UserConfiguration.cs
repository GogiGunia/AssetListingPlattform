using ALP.Model.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ALP.Model.EntityConfigurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("Users");

            builder.Property(e => e.Email).IsRequired().HasMaxLength(255);
            builder.Property(e => e.FirstName).HasMaxLength(100).IsRequired(true);
            builder.Property(e => e.LastName).HasMaxLength(100).IsRequired(true);
            builder.Property(e => e.PasswordHash).IsRequired().HasMaxLength(512);
            builder.Property(e => e.PasswordResetToken).HasMaxLength(255).IsRequired(false);
            builder.Property(e => e.PasswordResetTokenExpiry).IsRequired(false);
            builder.Property(e => e.Role).IsRequired().HasMaxLength(20).HasConversion<string>();
            builder.Property(e => e.CreatedAt).IsRequired().HasColumnType("datetime2").HasDefaultValueSql("GETUTCDATE()");
            builder.HasIndex(e => e.Email).IsUnique().HasDatabaseName("UQ_Users_Email");
        }
    }
}
