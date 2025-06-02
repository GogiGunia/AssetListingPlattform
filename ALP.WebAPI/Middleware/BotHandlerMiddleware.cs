namespace ALP.WebAPI.Middleware
{
    public class BotHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<BotHandlerMiddleware> _logger;

        public BotHandlerMiddleware(RequestDelegate next, ILogger<BotHandlerMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var userAgent = context.Request.Headers.UserAgent.ToString();
            var requestPath = context.Request.Path.ToString();
            var isBot = IsBot(userAgent);

            if (isBot)
            {
                _logger.LogInformation("Bot/Crawler detected: {UserAgent} requesting {Path}", userAgent, requestPath);

                // For bots requesting root or non-API paths, ensure they get index.html
                if (!requestPath.StartsWith("/api", StringComparison.OrdinalIgnoreCase) &&
                    !HasFileExtension(requestPath) &&
                    !context.Response.HasStarted)
                {
                    // Set headers that bots expect
                    context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
                    context.Response.Headers.Append("Pragma", "no-cache");
                    context.Response.Headers.Append("Expires", "0");
                }
            }

            await _next(context);

            // After the pipeline, check if we got a 404 for a bot and serve index.html
            if (isBot &&
                context.Response.StatusCode == 404 &&
                !requestPath.StartsWith("/api", StringComparison.OrdinalIgnoreCase) &&
                !HasFileExtension(requestPath))
            {
                _logger.LogInformation("Serving index.html fallback for bot request: {Path}", requestPath);
                await ServeIndexForBot(context);
            }
        }

        private static bool IsBot(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return false;

            var botPatterns = new[]
            {
                "WhatsApp", "facebookexternalhit", "Twitterbot", "LinkedInBot",
                "Slackbot", "TelegramBot", "bot", "crawler", "spider", "Googlebot",
                "Bingbot", "DuckDuckBot", "YandexBot", "Applebot", "PinterestBot"
            };

            return botPatterns.Any(pattern =>
                userAgent.Contains(pattern, StringComparison.OrdinalIgnoreCase));
        }

        private static bool HasFileExtension(string path)
        {
            return Path.HasExtension(path) &&
                   !string.IsNullOrEmpty(Path.GetExtension(path));
        }

        private static async Task ServeIndexForBot(HttpContext context)
        {
            try
            {
                // Reset response
                context.Response.StatusCode = 200;
                context.Response.ContentType = "text/html; charset=utf-8";

                // Simple index.html content for bots
                var htmlContent = """
                    <!doctype html>
                    <html lang="en">
                    <head>
                      <meta charset="utf-8">
                      <title>Asset Listing Plattform</title>
                      <base href="/">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <link rel="icon" type="image/x-icon" href="favicon.ico">
                      
                      <!-- Open Graph tags for WhatsApp -->
                      <meta property="og:title" content="Asset Listing Plattform" />
                      <meta property="og:description" content="Professional asset listing and management platform" />
                      <meta property="og:image" content="https://jafinda.metisystems.com/assets/preview-image.jpg" />
                      <meta property="og:url" content="https://jafinda.metisystems.com" />
                      <meta property="og:type" content="website" />
                      <meta property="og:site_name" content="Asset Listing Plattform" />
                      
                      <!-- WhatsApp specific -->
                      <meta name="twitter:card" content="summary_large_image" />
                      <meta name="twitter:title" content="Asset Listing Plattform" />
                      <meta name="twitter:description" content="Professional asset listing and management platform" />
                      <meta name="twitter:image" content="https://jafinda.metisystems.com/assets/preview-image.jpg" />
                      
                      <meta name="description" content="Professional asset listing and management platform" />
                      <meta name="robots" content="index, follow" />
                    </head>
                    <body>
                      <h1>Asset Listing Plattform</h1>
                      <p>Professional asset listing and management platform</p>
                    </body>
                    </html>
                    """;

                await context.Response.WriteAsync(htmlContent);
            }
            catch (Exception ex)
            {
                // Log error but don't throw to avoid breaking the pipeline
                var logger = context.RequestServices.GetService<ILogger<BotHandlerMiddleware>>();
                logger?.LogError(ex, "Error serving index.html for bot");
            }
        }
    }
}
