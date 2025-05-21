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

namespace ALP.WebAPI
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            ILogger logger = GetStartupLogger(builder.Configuration);

            //var sources = builder.Configuration.Sources
            //                .Where(x => x is JsonConfigurationSource jsonConfigSource
            //                && jsonConfigSource.FileProvider?.GetFileInfo(jsonConfigSource?.Path!).Exists == true)
            //                .Cast<JsonConfigurationSource>()
            //                .Select(x => x.Path);

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
            // The method used for passing the configuration in DesignTime is NONE of the ways described by Microsoft...
            // https://learn.microsoft.com/en-au/ef/core/cli/dbcontext-creation?tabs=vs
            // At design time, the web application is also started almost normally. As soon as the web application executes builder.Build(),
            // the services are initialized.
            // EntityFrameworkCore then subsequently fetches an instance of the DbContext via DI and performs "EntityFramework operations" with it.
            // The problem: If "multiple startup projects" are used in the solution,
            // then the EF-Tools no longer find the correct project that should be started ("OmniSys.OTPillar2.WebAPI")
            // Workarounds:
            // - Set Startup Projects to "Single startup project" with "ALP.WebAPI" and "Default project" in "Package Manager Console" to: "ALP.Model"
            // - Include Project (-p) and Startup Project (-s) in the command: "Add-Migration -p ALP.Model -s ALP.WebAPI Name_der_Migration"

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
                    sqlServerOptions.UseCompatibilityLevel(160); // TODO should be possible to configure in appsettings!
                    sqlServerOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);

                    // Ensures that migrations are only located in the DbContext's assembly
                    sqlServerOptions.MigrationsAssembly(Assembly.GetAssembly(typeof(AlpDbContext))?.FullName);
                });
            });

            services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

            services.AddScoped<IUserService, UserService>();
            services.AddScoped<ITokenService, TokenService>();

            services.AddDataProtection()
                    .PersistKeysToDbContext<AlpDbContext>();

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
            services.AddSingleton<IAuthorizationMiddlewareResultHandler, Middleware.Handlers.AuthorizationMiddlewareResultHandler>();


            services.AddControllers();
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen();
        }

        private static void ConfigureRequestPipeline(WebApplication app)
        {
            app.UseMiddleware<ExceptionMiddleware>();

            app.UseHttpsRedirection();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            //if (app.Environment.IsDevelopment())
            //{
            //    app.UseSpa(opt =>
            //    {
            //        ushort port = 4200; // Your Angular app's port
            //        opt.UseProxyToSpaDevelopmentServer($"http://localhost:{port}");
            //    });
            //}
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
                      // Dies folgende Einstellung wird im Normalfall über die Logging-Konfiguration in den appsettings überschrieben.
                      // Falls dies nicht geschieht, wird sicherheitshalber alles geloggt.
                      .SetMinimumLevel(LogLevel.Trace));

            return loggerFactory.CreateLogger<Program>();
        }

        private static void ConfigureOpenTelemetryLogging(ILoggingBuilder loggingBuilder, IHostEnvironment environment, IConfiguration configuration)
        {
            // Optional: Set a lower minimum level for more verbose logging in development
            // This needs to be called on the ILoggingBuilder, not the OpenTelemetryLoggerOptions
            if (environment.IsDevelopment())
            {
                loggingBuilder.SetMinimumLevel(LogLevel.Debug);
            }
            // For production, you might set a different minimum level here
            // else if (environment.IsProduction())
            // {
            //     loggingBuilder.SetMinimumLevel(LogLevel.Information);
            // }

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
                // TODO - For production, you would add a different exporter here (e.g., OTLP)
                // else if (environment.IsProduction())
                // {
                //     options.AddOtlpExporter(exporterOptions =>
                //     {
                //         exporterOptions.Endpoint = new Uri(configuration["OpenTelemetry:OtlpExporterEndpoint"]); // Get endpoint from config
                //     });
                // }
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