using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public class RealEstateListing : AssetListing
    {
        public int SizeSquareMeters { get; set; }
        public int NumberOfRooms { get; set; }
        public required string Address { get; set; }
        public required string City { get; set; }
        public required string PostalCode { get; set; }
        public required string Region { get; set; }
        //TODO later --- Add other RealEstate fields ---
    }
}
