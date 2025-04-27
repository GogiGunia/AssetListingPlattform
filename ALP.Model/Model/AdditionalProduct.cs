using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public class AdditionalProduct
    {
        public int Id { get; set; }
        public required string Name { get; set; } 
        public required string Description { get; set; }
        public decimal Price { get; set; }
        public AdditionalProductType Type { get; set; } 
        public int? DurationInDays { get; set; } 
        public bool IsAvailable { get; set; }

        // Navigation property
        public virtual ICollection<AdditionalProductPurchase> Purchases { get; set; } = new List<AdditionalProductPurchase>();
    }
    public enum AdditionalProductType
    {
        ListingBoost,
        ListingHighlight,
        ExtraImages,
        // ... other types of extras
    }
}
