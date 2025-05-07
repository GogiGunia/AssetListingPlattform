using ALP.WebAPI.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net;

namespace ALP.WebAPI.Middleware.ExceptionHandling
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ExceptionHandlingOptions options;
        private readonly ILogger<ExceptionMiddleware> logger;

        public ExceptionMiddleware(RequestDelegate next, IOptions<ExceptionHandlingOptions> options, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            this.options = options.Value;
            this.logger = logger;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                this.logger.LogError("{logInfo} | {ex}", httpContext.GetHttpContextLogInfo(), ex);
                if (ex is not DbUpdateException)
                    this.logger.LogError("{logInfo} | An unhandled exception occurred: {ex}", httpContext.GetHttpContextLogInfo(), ex);
                await CreateProblemResponse(httpContext, "UNKNOWN_ERROR", HttpStatusCode.InternalServerError, ex);
            }
        }

        private Task CreateProblemResponse(HttpContext httpContext, string? title, HttpStatusCode statusCode, Exception ex)
        {
            ProblemDetails problemDetails = new()
            {
                Title = title,
                Status = (int?)statusCode,
                Detail = ex.Message,
            };

            if (options.SendInnerExceptionToClient && ex.InnerException != null)
            {
                problemDetails.Extensions.Add("innerError", ex.InnerException.Message);

                if (options.IncludeTrace && ex.StackTrace != null)
                    problemDetails.Extensions.Add("innerTrace", ex.InnerException.StackTrace);
            }

            if (options.IncludeTrace && ex.StackTrace != null)
                problemDetails.Extensions.Add("stackTrace", ex.StackTrace);

            problemDetails.AddRequestInfo(httpContext);

            return httpContext.Response.ProblemResponseAsync(problemDetails);
        }
    }
}
