using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public class AdditionalProductPurchase
    {
        public int Id { get; set; }
        public int BusinessUserId { get; set; }
        public int AdditionalProductId { get; set; } 
        public int? ListingId { get; set; }
        public DateTime PurchasedAt { get; set; }
        public decimal ActualPricePaid { get; set; } 
        public DateTime? EffectStartDate { get; set; }
        public DateTime? EffectEndDate { get; set; }  
        public AdditionalProductPurchaseStatus Status { get; set; } 
        #region Navigation Properties
        public virtual User BusinessUser { get; set; } = null!;
        public virtual AdditionalProduct AdditionalProduct { get; set; } = null!; 
        public virtual Listing? Listing { get; set; } 
        #endregion
    }

    public enum AdditionalProductPurchaseStatus
    {
        PendingPayment,
        Completed,
        Failed,
        Cancelled,
        EffectActive,   // For tracking temporary effects
        EffectExpired   // For tracking temporary effects
    }
}
