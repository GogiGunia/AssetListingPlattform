using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public abstract class AssetListing : Listing
    {
        public AssetListingType ListingType { get; set; }
        public decimal Price { get; set; }
    }
}
