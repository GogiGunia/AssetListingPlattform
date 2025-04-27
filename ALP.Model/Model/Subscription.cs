using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public class Subscription
    {
        public int Id { get; set; }
        public int ListingId { get; set; }
        public int BusinessUserId { get; set; }
        public int SubscriptionPlanId { get; set; }
        public DateTime PurchasedAt { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal ActualPricePaid { get; set; }

        #region Navigation Properties
        public virtual Listing Listing { get; set; } = null!;
        public virtual User BusinessUser { get; set; } = null!;
        public virtual SubscriptionPlan SubscriptionPlan { get; set; } = null!;
        #endregion
    }
}
