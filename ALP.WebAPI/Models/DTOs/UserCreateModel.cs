using ALP.Model.Model;
using System.ComponentModel.DataAnnotations;

namespace ALP.WebAPI.Models.DTOs
{
    public class UserCreateModel
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        [Required]
        public required string FirstName { get; set; }
        [Required]
        public required string LastName { get; set; }
        [Required]
        public UserRole Role { get; set; }
    }
}
