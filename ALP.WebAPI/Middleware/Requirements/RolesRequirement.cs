using Microsoft.AspNetCore.Authorization;

namespace ALP.WebAPI.Middleware.Requirements
{
    public class RolesRequirement : IAuthorizationRequirement
    {
        public IReadOnlyList<string> AllowedRoles { get; }
        public RolesRequirement(params string[] allowedRoles)
        {
            AllowedRoles = allowedRoles?.ToList().AsReadOnly() ?? new List<string>().AsReadOnly();
        }
        public RolesRequirement(IEnumerable<string> allowedRoles)
        {
            AllowedRoles = allowedRoles?.ToList().AsReadOnly() ?? new List<string>().AsReadOnly();
        }
        public override string ToString()
        {
            return $"{nameof(RolesRequirement)}: Roles='{string.Join(", ", AllowedRoles)}'";
        }
    }
}
