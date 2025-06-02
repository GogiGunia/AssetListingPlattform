using ALP.Model.Model;

namespace ALP.WebAPI.Models.DTOs
{
    /// <summary>
    /// Response model for user registration
    /// Contains safe user data to return to frontend (no sensitive info)
    /// </summary>
    public class UserRegistrationResponseModel
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public UserRole Role { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
