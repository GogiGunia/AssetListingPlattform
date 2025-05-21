using ALP.Model.Model;
using ALP.WebAPI.Models.DTOs;

namespace ALP.WebAPI.Interfaces
{
    public interface IUserService
    {
        Task<User> GetUserAsync(HttpContext httpContext, bool enableTracking = false, CancellationToken cancellationToken = default);
        Task<User> GetUserByIdAsync(int id, bool enableTracking = false, CancellationToken cancellationToken = default);
        Task<User?> TryGetUserByIdAsync(int id, bool enableTracking = false, CancellationToken cancellationToken = default);
        Task<User> GetUserByEmailAsync(string email, bool enableTracking = false, CancellationToken cancellationToken = default);
        Task<User?> TryGetUserByEmailAsync(string email, bool enableTracking = false, CancellationToken cancellationToken = default);
        Task<User> CreateUserAsync(UserCreateModel userModel, string password, CancellationToken cancellationToken = default);
        Task CreateInitialUserAsync(CancellationToken cancellationToken = default);

        string HashPassword(string password); // Renamed from ProtectPassword for clarity
        Task<bool> VerifyPasswordAsync(string providedPassword, User user, CancellationToken cancellationToken = default);

        string GenerateRandomPassword(
            int passwordLength,
            int numberOfNonAlphanumericCharacters,
            bool lowercaseRequired = false,
            bool uppercaseRequired = false,
            bool digitRequired = false);

        Task<string> GenerateAndSavePasswordResetIdentifiersAsync(User user, CancellationToken cancellationToken = default); // Adjusted return
    }
}

