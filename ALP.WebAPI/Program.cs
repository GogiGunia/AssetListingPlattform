using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using ALP.Model;
using System.Reflection;
using ALP.WebAPI.Middleware.ExceptionHandling;
using OpenTelemetry.Logs;
using OpenTelemetry.Resources;
using Microsoft.Extensions.Configuration.Json;
using ALP.WebAPI.Interfaces;
using ALP.WebAPI.Services;
using ALP.Model.Model;
using Microsoft.AspNetCore.Identity;
using ALP.WebAPI.Exceptions;
using ALP.WebAPI.Security;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using ALP.WebAPI.Middleware;
using System.IdentityModel.Tokens.Jwt;
using ALP.WebAPI.Middleware.Handlers;
using ALP.WebAPI.Middleware.Requirements;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Builder;
using System.Text.Json.Serialization;

namespace ALP.WebAPI
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            ILogger logger = GetStartupLogger(builder.Configuration);

            ConfigureServices(builder.Services, builder.Configuration, builder.Environment);
            AddConfigurationInstances(builder.Services, builder.Configuration);
            ConfigureOpenTelemetryLogging(builder.Logging, builder.Environment, builder.Configuration);
            var app = builder.Build();

            await ExecuteStartupTasksAsync(app.Services, logger);

            ConfigureRequestPipeline(app);

            await app.RunAsync();
        }

        private static void ConfigureServices(IServiceCollection services, ConfigurationManager configuration, IHostEnvironment environment)
        {
            services.AddDbContext<AlpDbContext>(opt =>
            {
                if (environment.IsDevelopment())
                {
                    opt.ConfigureWarnings(b =>
                    {
                        b.Ignore(CoreEventId.SensitiveDataLoggingEnabledWarning);
                    });
                    opt.EnableSensitiveDataLogging();
                }

                opt.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);

                opt.UseSqlServer(configuration.GetConnectionString("DefaultConnection"),
                sqlServerOptions =>
                {
                    sqlServerOptions.UseCompatibilityLevel(160);
                    sqlServerOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                    sqlServerOptions.MigrationsAssembly(Assembly.GetAssembly(typeof(AlpDbContext))?.FullName);
                });
            });

            services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

            services.AddScoped<IUserService, UserService>();
            services.AddScoped<ITokenService, TokenService>();

            services.AddDataProtection()
                    .PersistKeysToDbContext<AlpDbContext>();

            // Configure HTTPS Redirection
            services.AddHttpsRedirection(options =>
            {
                options.RedirectStatusCode = StatusCodes.Status301MovedPermanently;
                options.HttpsPort = 443; // Standard HTTPS port
            });

            // Configure HSTS (HTTP Strict Transport Security)
            if (!environment.IsDevelopment())
            {
                services.AddHsts(options =>
                {
                    options.Preload = true;
                    options.IncludeSubDomains = true;
                    options.MaxAge = TimeSpan.FromDays(365); // 1 year
                });
            }

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                var clockSkewSecondsString = configuration["Authentication:ClockSkewSeconds"]
                    ?? throw new ConfigurationException("Authentication:ClockSkewSeconds is not configured.");
                if (!double.TryParse(clockSkewSecondsString, out var clockSkewSeconds))
                {
                    throw new ConfigurationException("Authentication:ClockSkewSeconds is not a valid double.");
                }

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Authentication:Issuer"]
                        ?? throw new ConfigurationException("Authentication:Issuer is not configured."),
                    ValidAudience = configuration["Authentication:Audience"]
                        ?? throw new ConfigurationException("Authentication:Audience is not configured."),
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                        configuration["Authentication:IssuerSigningKey"]
                        ?? throw new ConfigurationException("Authentication:IssuerSigningKey is not configured."))),
                    NameClaimType = ClaimTypes.Name,
                    RoleClaimType = ClaimTypes.Role,
                    ClockSkew = TimeSpan.FromSeconds(clockSkewSeconds)
                };
            });

            services.AddAuthorizationBuilder()
                    .AddPolicy(Policy.GENERAL_ACCESS, policy => policy
                        .RequireAuthenticatedUser()
                        .AddRequirements(new RolesRequirement(
                                            UserRole.ClientUser.ToString(),
                                            UserRole.BusinessUser.ToString(),
                                            UserRole.Admin.ToString()
                        )))
                    .AddPolicy(Policy.ELEVATED_ACCESS, policy => policy
                        .RequireAuthenticatedUser()
                        .AddRequirements(new RolesRequirement(UserRole.Admin.ToString())))
                    .AddPolicy(Policy.CHANGE_PASSWORD, policy => policy
                        .RequireAuthenticatedUser()
                        .RequireClaim(JwtRegisteredClaimNames.Typ, TokenType.PasswordResetToken.ToString()))
                    .AddPolicy(Policy.REFRESH_TOKEN, policy => policy
                        .RequireAuthenticatedUser()
                        .RequireClaim(JwtRegisteredClaimNames.Typ, TokenType.RefreshToken.ToString()));

            services.AddSingleton<IAuthorizationHandler, RolesAccessHandler>();

            // CORS Configuration for Production
            services.AddCors(options =>
            {
                options.AddPolicy("ProductionCORS", policy =>
                {
                    if (environment.IsDevelopment())
                    {
                        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials();
                    }
                    else
                    {
                        // More permissive for production to allow crawlers
                        policy.SetIsOriginAllowed(origin => true) // Allow any origin for crawlers
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials();
                    }
                });
            });

            services.ConfigureHttpJsonOptions(options =>
            {
                options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
            services.AddControllers();
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen();
        }

        private static void ConfigureRequestPipeline(WebApplication app)
        {
            app.UseMiddleware<ExceptionMiddleware>();

            // Add HSTS in production (before HTTPS redirection)
            if (!app.Environment.IsDevelopment())
            {
                app.UseHsts();
            }

            // Force HTTPS redirection (this will redirect HTTP to HTTPS)
            app.UseHttpsRedirection();

            // Enable CORS
            app.UseCors("ProductionCORS");

            // Bot handler middleware - BEFORE static files
            app.UseMiddleware<BotHandlerMiddleware>();

            // Serve static files (Angular build)
            if (!app.Environment.IsDevelopment())
            {
                app.UseDefaultFiles(); // Serves index.html by default
                app.UseStaticFiles(new StaticFileOptions
                {
                    OnPrepareResponse = ctx =>
                    {
                        // Don't cache HTML files for bots, cache other static files
                        var isBot = IsRequestFromBot(ctx.Context.Request.Headers.UserAgent);
                        if (ctx.File.Name.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
                        {
                            if (isBot)
                            {
                                ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
                                ctx.Context.Response.Headers.Append("Pragma", "no-cache");
                                ctx.Context.Response.Headers.Append("Expires", "0");
                            }
                            else
                            {
                                ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
                            }
                        }
                        else
                        {
                            // Cache static assets for 1 year
                            ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=31536000");
                        }
                    }
                });
            }

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();

            if (app.Environment.IsDevelopment())
            {
                // Development: Use Angular dev server proxy
                app.UseWhen(ctx => !ctx.Request.Path.StartsWithSegments("/api"), appBuilder =>
                {
                    appBuilder.UseSpa(opt =>
                    {
                        ushort port = 4200;
                        opt.UseProxyToSpaDevelopmentServer($"http://localhost:{port}");
                    });
                });
            }
            else
            {
                // Production: Fallback to index.html for Angular routing
                app.MapFallbackToFile("index.html");
            }
        }

        // Add this helper method to your Program class:
        private static bool IsRequestFromBot(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return false;

            var botPatterns = new[]
            {
        "WhatsApp", "facebookexternalhit", "Twitterbot", "LinkedInBot",
        "Slackbot", "TelegramBot", "bot", "crawler", "spider", "Googlebot"
    };

            return botPatterns.Any(pattern =>
                userAgent.Contains(pattern, StringComparison.OrdinalIgnoreCase));
        }

        private static void AddConfigurationInstances(IServiceCollection services, ConfigurationManager configuration)
        {
            services.Configure<ExceptionHandlingOptions>(configuration.GetSection("ErrorHandling"));
        }

        private static ILogger GetStartupLogger(ConfigurationManager configuration)
        {
            using var loggerFactory = LoggerFactory.Create(builder =>
               builder.AddConsole()
                      .AddConfiguration(configuration.GetSection("Logging"))
                      .SetMinimumLevel(LogLevel.Trace));

            return loggerFactory.CreateLogger<Program>();
        }

        private static void ConfigureOpenTelemetryLogging(ILoggingBuilder loggingBuilder, IHostEnvironment environment, IConfiguration configuration)
        {
            if (environment.IsDevelopment())
            {
                loggingBuilder.SetMinimumLevel(LogLevel.Debug);
            }

            loggingBuilder.AddOpenTelemetry(options =>
            {
                options.SetResourceBuilder(ResourceBuilder.CreateDefault()
                    .AddService(
                        serviceName: "ALP.WebAPI",
                        serviceVersion: Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "unknown"));

                if (environment.IsDevelopment())
                {
                    options.AddConsoleExporter();
                }
            });
        }

        private static async Task ExecuteStartupTasksAsync(IServiceProvider services, ILogger logger)
        {
            try
            {
                using var scope = services.CreateScope();

                var dbContext = scope.ServiceProvider.GetRequiredService<AlpDbContext>();
                var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
                if (pendingMigrations.Any())
                    throw new Exception($"Missing DB-Migrations:\n{string.Join(Environment.NewLine, pendingMigrations)}");

                var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
                await userService.CreateInitialUserAsync();
            }
            catch (Exception ex)
            {
                logger.LogCritical("{ex}", ex.Message);
                throw;
            }
        }
    }
}