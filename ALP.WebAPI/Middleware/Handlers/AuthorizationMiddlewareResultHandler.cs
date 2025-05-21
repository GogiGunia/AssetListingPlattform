using ALP.WebAPI.Constants;
using ALP.WebAPI.Exceptions;
using ALP.WebAPI.Extensions;
using ALP.WebAPI.Middleware.Requirements;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace ALP.WebAPI.Middleware.Handlers
{
    public class AuthorizationMiddlewareResultHandler : IAuthorizationMiddlewareResultHandler
    {
        private readonly ILogger<AuthorizationMiddlewareResultHandler> _logger;

        public AuthorizationMiddlewareResultHandler(ILogger<AuthorizationMiddlewareResultHandler> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public Task HandleAsync(RequestDelegate next, HttpContext httpContext, AuthorizationPolicy policy, PolicyAuthorizationResult authorizeResult)
        {
            if (authorizeResult.Succeeded)
            {
                return next(httpContext);
            }

            if (authorizeResult.AuthorizationFailure != null &&
                authorizeResult.AuthorizationFailure.FailureReasons.Any(reason => reason.Message == ExceptionType.ERROR_INVALID_ROLE))
            {
                var adEx = new AccessDeniedException(
                    ExceptionType.ERROR_INVALID_ROLE,
                    "Your role does not have the necessary permissions to perform this action."
                );

                _logger.LogWarning(adEx, "{LogInfo} | Access Denied due to invalid role. Policy: {PolicyName}",
                    httpContext.GetHttpContextLogInfo(),
                    policy.Requirements.OfType<Requirements.RolesRequirement>().FirstOrDefault()?.ToString() ?? policy.ToString() ?? "N/A");


                ProblemDetails problemDetails = new()
                {
                    Title = "ACCESS_DENIED",
                    Status = (int)HttpStatusCode.Forbidden,
                    Detail = adEx.Message,
                    Instance = httpContext.Request.Path
                };

                problemDetails.AddRequestInfo(httpContext);
                httpContext.Response.ContentType = "application/problem+json";
                return httpContext.Response.ProblemResponseAsync(problemDetails);
            }

            return HandleDefaultAsync();

            async Task HandleDefaultAsync() 
            {
                if (authorizeResult.Challenged)
                {
                    _logger.LogInformation("{LogInfo} | Authorization challenged. Policy: {PolicyName}, Schemes: {Schemes}",
                        httpContext.GetHttpContextLogInfo(),
                        policy.Requirements.FirstOrDefault()?.GetType().Name ?? "N/A",
                        string.Join(", ", policy.AuthenticationSchemes));

                    if (policy.AuthenticationSchemes.Any())
                    {
                        foreach (var scheme in policy.AuthenticationSchemes)
                        {
                            await httpContext.ChallengeAsync(scheme);
                        }
                    }
                    else
                    {
                        await httpContext.ChallengeAsync();
                    }
                }
                else if (authorizeResult.Forbidden)
                {
                    _logger.LogWarning("{LogInfo} | Authorization forbidden. Policy: {PolicyName}, Schemes: {Schemes}",
                       httpContext.GetHttpContextLogInfo(),
                       policy.Requirements.FirstOrDefault()?.GetType().Name ?? "N/A",
                       string.Join(", ", policy.AuthenticationSchemes));

                    if (policy.AuthenticationSchemes.Any())
                    {
                        foreach (var scheme in policy.AuthenticationSchemes)
                        {
                            await httpContext.ForbidAsync(scheme); 
                        }
                    }
                    else
                    {
                        await httpContext.ForbidAsync(); 
                    }
                }
                else
                {
                    // Fallback for unexpected states, though Challenge or Forbid should usually be true if not Succeeded or handled above.
                    _logger.LogError("{LogInfo} | Unexpected authorization failure state (not Succeeded, Challenged, or Forbidden after custom checks). Policy: {PolicyName}",
                        httpContext.GetHttpContextLogInfo(),
                        policy.Requirements.FirstOrDefault()?.GetType().Name ?? "N/A");
                }
            }
        }
    }
}
