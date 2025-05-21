using ALP.Model;
using ALP.Model.Model;
using ALP.WebAPI.Exceptions;
using ALP.WebAPI.Interfaces;
using ALP.WebAPI.Middleware;
using ALP.WebAPI.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;


namespace ALP.WebAPI.Services
{
    public class UserService : IUserService
    {
        private readonly AlpDbContext _dbContext;
        private readonly ILogger<UserService> _logger;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly ITokenService _tokenService; 
        public UserService(AlpDbContext dbContext,
                           ILogger<UserService> logger,
                           IPasswordHasher<User> passwordHasher,
                           ITokenService tokenService)
        {
            _dbContext = dbContext;
            _logger = logger;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }
        public Task<User> GetUserAsync(HttpContext httpContext, bool enableTracking = false, CancellationToken cancellationToken = default)
        {
            var userEmail = httpContext.User.FindFirstValue(ClaimTypes.Email);
            
            if (string.IsNullOrEmpty(userEmail))
            {
                _logger.LogWarning("User email claim (ClaimTypes.Email) not found in HttpContext for an authenticated user path.");
                throw new InternalException("Unable to identify user from token: Email claim missing.");
            }
            return GetUserByEmailAsync(userEmail, enableTracking, cancellationToken);
        }

        public async Task<User> GetUserByIdAsync(int id, bool enableTracking = false, CancellationToken cancellationToken = default)
        {
            var query = _dbContext.Users.Where(x => x.Id == id);
            return await GetUserInternalAsync(query, $"User not found with ID: {id}.", enableTracking, cancellationToken);
        }

        public async Task<User> GetUserByEmailAsync(string email, bool enableTracking = false, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email cannot be null or empty.", nameof(email));

            var query = _dbContext.Users.Where(x => x.Email.ToLower() == email.ToLower());
            return await GetUserInternalAsync(query, $"User not found with Email: {email}.", enableTracking, cancellationToken);
        }

        private async Task<User> GetUserInternalAsync(IQueryable<User> query, string errorMessage, bool enableTracking, CancellationToken cancellationToken)
        {
            if (!enableTracking)
                query = query.AsNoTracking();

            var user = await query.FirstOrDefaultAsync(cancellationToken);
            return user ?? throw new InvalidClientDataException(errorMessage);
        }

        public async Task<User?> TryGetUserByIdAsync(int id, bool enableTracking = false, CancellationToken cancellationToken = default)
        {
            var query = _dbContext.Users.Where(x => x.Id == id);
            return await TryGetUserInternalAsync(query, enableTracking, cancellationToken);
        }

        public async Task<User?> TryGetUserByEmailAsync(string email, bool enableTracking = false, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(email)) return null;
            var query = _dbContext.Users.Where(x => x.Email.ToLower() == email.ToLower());
            return await TryGetUserInternalAsync(query, enableTracking, cancellationToken);
        }

        private async Task<User?> TryGetUserInternalAsync(IQueryable<User> query, bool enableTracking, CancellationToken cancellationToken)
        {
            if (!enableTracking)
                query = query.AsNoTracking();
            return await query.FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<User> CreateUserAsync(UserCreateModel userModel, string password, CancellationToken cancellationToken = default)
        {
            if (userModel == null) throw new ArgumentNullException(nameof(userModel));
            if (string.IsNullOrWhiteSpace(password)) throw new ArgumentException("Password cannot be null or empty.", nameof(password));
            if (string.IsNullOrWhiteSpace(userModel.FirstName)) throw new ArgumentException("FirstName cannot be null or empty.", nameof(userModel.FirstName));
            if (string.IsNullOrWhiteSpace(userModel.LastName)) throw new ArgumentException("LastName cannot be null or empty.", nameof(userModel.LastName));


            if (await _dbContext.Users.AnyAsync(u => u.Email.ToLower() == userModel.Email.Trim().ToLower(), cancellationToken))
                throw new InvalidClientDataException($"User with email '{userModel.Email}' already exists.");

            var newDbUser = new User
            {
                Email = userModel.Email.Trim(),
                FirstName = userModel.FirstName.Trim(),
                LastName = userModel.LastName.Trim(),
                PasswordHash = HashPassword(password),
                Role = userModel.Role,
                CreatedAt = DateTime.UtcNow
            };

            await _dbContext.Users.AddAsync(newDbUser, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Created new user with email {Email} and ID {UserId}", newDbUser.Email, newDbUser.Id);
            return newDbUser;
        }

        public async Task CreateInitialUserAsync(CancellationToken cancellationToken = default)
        {
            if (!await _dbContext.Users.AnyAsync(cancellationToken))
            {
                var initialUserModel = new UserCreateModel
                {
                    Email = "admin@jafinda.com",
                    FirstName = "Global",
                    LastName = "Admin",
                    Role = UserRole.Admin
                };
                string initialPassword = "SuperSecureP@ssw0rd1!"; // TODO: Move to configuration
                await CreateUserAsync(initialUserModel, initialPassword, cancellationToken);
                _logger.LogInformation("Created initial admin user with email {Email}", initialUserModel.Email);
            }
        }

        public string HashPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentNullException(nameof(password), "Password cannot be null or whitespace.");
            return _passwordHasher.HashPassword(null!, password);
        }

        public async Task<bool> VerifyPasswordAsync(string providedPassword, User user, CancellationToken cancellationToken = default)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));
            if (string.IsNullOrWhiteSpace(providedPassword) || string.IsNullOrWhiteSpace(user.PasswordHash))
                return false;

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, providedPassword);
            if (result == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = HashPassword(providedPassword);
                _dbContext.Users.Update(user);
                await _dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Password rehashed for user {UserId}", user.Id);
            }
            return result != PasswordVerificationResult.Failed;
        }

        public async Task<string> GenerateAndSavePasswordResetIdentifiersAsync(User user, CancellationToken cancellationToken = default)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));

            user.PasswordResetToken = Guid.NewGuid().ToString("N");
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

            _dbContext.Users.Update(user); // Mark as modified
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Generated and saved password reset identifiers for user {UserId}", user.Id);

            string jwtToken = _tokenService.CreateToken(TokenType.PasswordResetToken, user);

            return jwtToken;
        }

        #region Password Generation (Copied from original, review for suitability)
        private static readonly char[] Punctuations = "!@#$%^&*()_-+=[{]};:>|./?".ToCharArray();
        private static readonly char[] StartingChars = { '<', '&' };
        private static bool IsAtoZ(char c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
        public string GenerateRandomPassword(
          int passwordLength,
          int numberOfNonAlphanumericCharacters,
          bool lowercaseRequired = false,
          bool uppercaseRequired = false,
          bool digitRequired = false)
        {
            if (passwordLength < 8 || passwordLength > 128)
                throw new ArgumentOutOfRangeException(nameof(passwordLength), "Password length must be between 8 and 128.");
            if (numberOfNonAlphanumericCharacters > passwordLength || numberOfNonAlphanumericCharacters < 0)
                throw new ArgumentOutOfRangeException(nameof(numberOfNonAlphanumericCharacters), "Number of non-alphanumeric characters is invalid.");
            int minRequiredChars = 0;
            if (lowercaseRequired) minRequiredChars++;
            if (uppercaseRequired) minRequiredChars++;
            if (digitRequired) minRequiredChars++;
            if (numberOfNonAlphanumericCharacters > 0) minRequiredChars++;
            if (passwordLength < numberOfNonAlphanumericCharacters + (lowercaseRequired ? 1 : 0) + (uppercaseRequired ? 1 : 0) + (digitRequired ? 1 : 0))
                throw new ArgumentException("Password length is too short to meet all character requirements.");
            var characterSet = new List<char>();
            if (lowercaseRequired) characterSet.AddRange("abcdefghijklmnopqrstuvwxyz");
            if (uppercaseRequired) characterSet.AddRange("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
            if (digitRequired) characterSet.AddRange("0123456789");
            characterSet.AddRange(Punctuations.Take(Math.Max(0, numberOfNonAlphanumericCharacters * 2)));
            if (characterSet.Count == 0)
            {
                characterSet.AddRange("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()");
            }
            StringBuilder password = new StringBuilder();
            RandomNumberGenerator rng = RandomNumberGenerator.Create();
            byte[] uintBuffer = new byte[sizeof(uint)];
            List<char> requiredChars = new List<char>();
            if (lowercaseRequired) requiredChars.Add(GetRandomChar("abcdefghijklmnopqrstuvwxyz".ToCharArray(), rng, uintBuffer));
            if (uppercaseRequired) requiredChars.Add(GetRandomChar("ABCDEFGHIJKLMNOPQRSTUVWXYZ".ToCharArray(), rng, uintBuffer));
            if (digitRequired) requiredChars.Add(GetRandomChar("0123456789".ToCharArray(), rng, uintBuffer));
            for (int i = 0; i < numberOfNonAlphanumericCharacters; i++)
            {
                requiredChars.Add(GetRandomChar(Punctuations, rng, uintBuffer));
            }
            for (int i = requiredChars.Count; i < passwordLength; i++)
            {
                requiredChars.Add(GetRandomChar(characterSet.ToArray(), rng, uintBuffer));
            }
            password.Append(new string(requiredChars.OrderBy(c => { rng.GetBytes(uintBuffer); return BitConverter.ToUInt32(uintBuffer, 0); }).ToArray()));
            string generatedPassword = password.ToString();
            if (IsDangerousString(generatedPassword, out _))
            {
                _logger.LogWarning("Generated password was dangerous, be cautious or improve generation strategy.");
            }
            return generatedPassword;
        }
        private char GetRandomChar(char[] charArray, RandomNumberGenerator rng, byte[] buffer)
        {
            rng.GetBytes(buffer);
            uint randomNumber = BitConverter.ToUInt32(buffer, 0);
            return charArray[randomNumber % charArray.Length];
        }
        public static bool IsDangerousString(string s, out int matchIndex)
        {
            matchIndex = 0;
            for (int i = 0; ;)
            {
                int n = s.IndexOfAny(StartingChars, i);
                if (n < 0) return false;
                if (n == s.Length - 1) return false;
                matchIndex = n;
                switch (s[n])
                {
                    case '<':
                        if (IsAtoZ(s[n + 1]) || s[n + 1] == '!' || s[n + 1] == '/' || s[n + 1] == '?') return true;
                        break;
                    case '&':
                        if (s[n + 1] == '#') return true;
                        break;
                }
                i = n + 1;
            }
        }
        #endregion
    }
}
