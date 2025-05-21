using ALP.WebAPI.Constants;
using ALP.WebAPI.Middleware.Requirements;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ALP.WebAPI.Middleware.Handlers
{
    public class RolesAccessHandler : AuthorizationHandler<RolesRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RolesRequirement requirement)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                context.Fail(new AuthorizationFailureReason(this, "User is not authenticated."));
                return Task.CompletedTask;
            }

            bool hasRequiredRole = requirement.AllowedRoles.Any(allowedRole =>
                context.User.HasClaim(ClaimTypes.Role, allowedRole)
            );

            if (hasRequiredRole)
                context.Succeed(requirement);
            else
                context.Fail(new AuthorizationFailureReason(this, ExceptionType.ERROR_INVALID_ROLE));

            return Task.CompletedTask;
        }
    }
}
