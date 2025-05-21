using ALP.Model.Model;
using ALP.WebAPI.Exceptions;
using ALP.WebAPI.Interfaces;
using ALP.WebAPI.Middleware;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ALP.WebAPI.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<TokenService> _logger;
        public TokenService(IConfiguration configuration,
                           ILogger<TokenService> logger)
        {
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }
        public string CreateToken(TokenType tokenType, User user)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));

            var notBefore = DateTime.UtcNow;
            TimeSpan timeSpan;
            string? expirationConfigValue = null;

            expirationConfigValue = tokenType switch
            {
                TokenType.AccessToken => _configuration["Authentication:expirationAccessToken"],
                TokenType.RefreshToken => _configuration["Authentication:expirationRefreshToken"],
                TokenType.PasswordResetToken => _configuration["Authentication:expirationPasswordResetToken"],
                _ => throw new InternalException($"Unsupported token type provided: {tokenType}"),
            };

            if (string.IsNullOrWhiteSpace(expirationConfigValue))
                throw new ConfigurationException($"Token expiration configuration for '{tokenType}' (e.g., Authentication:expiration{tokenType}) is missing or empty in configuration.");

            try
            {
                timeSpan = TimeSpan.Parse(expirationConfigValue);
            }
            catch (FormatException ex)
            {
                // The format of the configured value is wrong. This is a configuration issue.
                _logger.LogError(ex, "Token expiration configuration for {TokenType} has an invalid TimeSpan format: '{ConfigValue}'", tokenType, expirationConfigValue);
                throw new ConfigurationException($"Token expiration configuration for {tokenType} has an invalid TimeSpan format: '{expirationConfigValue}'. Ensure it's a valid TimeSpan string.", ex);
            }

            return CreateInternalToken(tokenType, notBefore, timeSpan, user);
        }

        private string CreateInternalToken(TokenType tokenType, DateTime notBefore, TimeSpan timeSpan, User user)
        {
            var userNameClaimValue = $"{user.FirstName} {user.LastName}".Trim();

            var userClaims = new List<Claim>
            {
                new(ClaimTypes.Name, userNameClaimValue),
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Role, user.Role.ToString())
            };

            if (tokenType == TokenType.PasswordResetToken)
            {
                if (string.IsNullOrWhiteSpace(user.PasswordResetToken))
                {
                    // This indicates an issue with the calling code/logic not setting this prerequisite.
                    throw new InternalException($"{nameof(user.PasswordResetToken)} must be set on the User object to generate a {nameof(TokenType.PasswordResetToken)}.");
                }
                userClaims.Add(new Claim("passwordResetGuid", user.PasswordResetToken));
            }

            return GenerateJwt(tokenType, notBefore, timeSpan, userClaims.ToArray());
        }

        private string GenerateJwt(TokenType tokenType, DateTime notBefore, TimeSpan timeSpan, params Claim[]? additionalClaims)
        {
            var audience = _configuration["Authentication:Audience"];
            var issuer = _configuration["Authentication:Issuer"];
            var signingKey = _configuration["Authentication:IssuerSigningKey"];

            if (string.IsNullOrEmpty(audience))
                throw new ConfigurationException("Authentication:Audience is not configured or is empty.");
            if (string.IsNullOrEmpty(issuer))
                throw new ConfigurationException("Authentication:Issuer is not configured or is empty.");
            if (string.IsNullOrEmpty(signingKey))
                throw new ConfigurationException("Authentication:IssuerSigningKey is not configured or is empty.");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Typ, tokenType.ToString()),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(JwtRegisteredClaimNames.Nbf, new DateTimeOffset(notBefore).ToUnixTimeSeconds().ToString()),
                new(JwtRegisteredClaimNames.Iat, new DateTimeOffset(notBefore).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            if (additionalClaims != null && additionalClaims.Length > 0)
                claims.AddRange(additionalClaims);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: notBefore,
                expires: notBefore + timeSpan,
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

