using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public class User
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; } 
        public required string PasswordHash { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
        public UserRole Role { get; set; }
        public DateTime CreatedAt { get; set; }

        #region Navigation Properties
        public virtual ICollection<Listing> Listings { get; set; } = new List<Listing>();
        public virtual ICollection<Subscription> PurchasedSubscriptions { get; set; } = new List<Subscription>();
        public virtual ICollection<AdditionalProductPurchase> PurchasedAdditionalProducts { get; set; } = new List<AdditionalProductPurchase>();
        #endregion
    }
    public enum UserRole
    {
        Admin,
        BusinessUser,
        ClientUser
    }
}
