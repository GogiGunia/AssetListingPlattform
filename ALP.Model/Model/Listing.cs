using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public abstract class Listing
    {
        public int Id { get; set; }
        public int BusinessUserId { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        public int? CurrentSubscriptionId { get; set; }

        #region Navigation Properties
        public virtual Subscription? CurrentSubscription { get; set; }
        public virtual User BusinessUser { get; set; } = null!;
        public virtual ICollection<Subscription> SubscriptionHistory { get; set; } = new List<Subscription>();
        public virtual ICollection<AdditionalProductPurchase> AdditionalProductPurchases { get; set; } = new List<AdditionalProductPurchase>();
        #endregion
    }
    public enum AssetListingType
    {
        Sale,
        Rent
    }
}
