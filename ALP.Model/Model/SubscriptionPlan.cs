using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public class SubscriptionPlan
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public int DurationInMonths { get; set; }
        public decimal PricePerMonth { get; set; }
        public required string Description { get; set; }
        public bool IsAvailable { get; set; }

        #region Navigation Properties
        public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
        #endregion
    }
}
