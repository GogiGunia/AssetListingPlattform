using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public class AutoListing : AssetListing
    {
        public required string Make { get; set; }
        public required string AutoModel { get; set; }
        public int Year { get; set; }
        public int Kilometers { get; set; }
    }
}
