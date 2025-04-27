using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ALP.Model.Model
{
    public class JobListing : Listing
    {
        public required string EmploymentType { get; set; }
        public required string Location { get; set; }
        public decimal Salary { get; set; }
    }
}
