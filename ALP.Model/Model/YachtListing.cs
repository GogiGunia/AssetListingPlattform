using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public class YachtListing : AssetListing
    {
        public required string Builder { get; set; }
        public required string YachtModel { get; set; }
        public decimal LengthOverallMeters { get; set; }
        public int BuildYear { get; set; }
        public int Cabins { get; set; }
        public int Berths { get; set; }
        public required string YachtLocation { get; set; }
    }
}
