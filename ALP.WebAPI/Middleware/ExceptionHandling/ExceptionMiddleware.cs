using ALP.WebAPI.Exceptions;
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
        private readonly ExceptionHandlingOptions _options;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, IOptions<ExceptionHandlingOptions> options, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _options = options.Value;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (ConfigurationException confEx)
            {
                _logger.LogError(confEx, "{LogInfo} | Configuration Error: {ErrorMessage}", httpContext.GetHttpContextLogInfo(), confEx.Message);
                await CreateProblemResponse(httpContext, "CONFIGURATION_ERROR", HttpStatusCode.InternalServerError, confEx);
            }
            catch (InternalException intEx)
            {
                _logger.LogError(intEx, "{LogInfo} | Internal Error: {ErrorMessage}", httpContext.GetHttpContextLogInfo(), intEx.Message);
                await CreateProblemResponse(httpContext, "INTERNAL_SERVER_ERROR", HttpStatusCode.InternalServerError, intEx);
            }
            catch (BusinessException busEx)
            {
                if (!busEx.suppressLogEntry)
                    _logger.LogError("{logInfo} | {ex}", httpContext.GetHttpContextLogInfo(), busEx);

                await CreateProblemResponse(httpContext, "BUSINESS_ERROR", HttpStatusCode.InternalServerError, busEx);
            }
            catch (InvalidClientDataException icdEx) 
            {
                _logger.LogWarning(icdEx, "{LogInfo} | Invalid Client Data: {ErrorMessage}", httpContext.GetHttpContextLogInfo(), icdEx.Message);
                // CHECK: Use BadRequest as a general one for now.
                await CreateProblemResponse(httpContext, "INVALID_REQUEST_DATA", HttpStatusCode.BadRequest, icdEx);
            }

            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "{LogInfo} | Database Update Error: {ErrorMessage}", httpContext.GetHttpContextLogInfo(), dbEx.Message);
                await CreateProblemResponse(httpContext, "DATABASE_ERROR", HttpStatusCode.InternalServerError, dbEx);
            }
            // Generic catch-all for any other unhandled exceptions
            catch (Exception ex)
            {
                _logger.LogError(ex, "{LogInfo} | An unhandled exception occurred: {ErrorMessage}", httpContext.GetHttpContextLogInfo(), ex.Message);
                await CreateProblemResponse(httpContext, "UNEXPECTED_ERROR", HttpStatusCode.InternalServerError, ex);
            }
        }

        private Task CreateProblemResponse(HttpContext httpContext, string? title, HttpStatusCode statusCode, Exception ex)
        {
            httpContext.Response.ContentType = "application/problem+json";
            httpContext.Response.StatusCode = (int)statusCode;

            ProblemDetails problemDetails = new()
            {
                Title = title,
                Status = (int)statusCode,
                Detail = ex.Message, 
                Instance = httpContext.Request.Path
            };

            if (_options.SendInnerExceptionToClient && ex.InnerException != null)
            {
                problemDetails.Extensions.Add("innerError", new { message = ex.InnerException.Message });
                if (_options.IncludeTrace && ex.InnerException.StackTrace != null)
                    problemDetails.Extensions["innerError"] = new { message = ex.InnerException.Message, trace = ex.InnerException.StackTrace };
            }

            if (_options.IncludeTrace && ex.StackTrace != null)
                problemDetails.Extensions.Add("stackTrace", ex.StackTrace.Split(new[] { Environment.NewLine }, StringSplitOptions.None));

            // Assuming AddRequestInfo is an extension method you have
            problemDetails.AddRequestInfo(httpContext);

            // Assuming ProblemResponseAsync is an extension method serializing ProblemDetails to JSON
            return httpContext.Response.ProblemResponseAsync(problemDetails);
        }
    }
}
