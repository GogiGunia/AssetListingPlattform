﻿using Microsoft.AspNetCore.Mvc;

namespace ALP.WebAPI.Extensions
{
    public static class HttpContextExtensions
    {
        internal static string GetIpAdress(this HttpContext httpContext)
        {
            // If present, the content from the "Forwarded" header is preferred.
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded
            if (httpContext.Request.Headers.TryGetValue("Forwarded", out var value))
                return value.ToString();

            return httpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A";
        }

        internal static string GetUserName(this HttpContext httpContext)
        {
            return httpContext.User.Identity?.Name ?? string.Empty;
        }

        internal static string GetHttpContextLogInfo(this HttpContext httpContext)
        {
            return $"{httpContext.GetIpAdress()} | {httpContext.GetUserName()} | {httpContext.Request.Method} | {httpContext.Request.Path}";
        }

        internal static async Task ProblemResponseAsync(this HttpResponse response, ProblemDetails problemDetails)
        {
            response.ContentType = "application/json";
            response.StatusCode = problemDetails.Status.GetValueOrDefault(500);

            await response.WriteAsJsonAsync(problemDetails);
        }

        internal static ProblemDetails AddRequestInfo(this ProblemDetails problemDetails, HttpContext httpContext)
        {
            problemDetails.Extensions.Add("requestId", httpContext.Connection.Id);
            problemDetails.Extensions.Add("traceId", httpContext.TraceIdentifier);
            return problemDetails;
        }
    }
}
