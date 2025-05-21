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
            services.AddControllers();
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen();
        }

        private static void ConfigureRequestPipeline(WebApplication app)
        {
            app.UseMiddleware<ExceptionMiddleware>();
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
                app.UseSpa(opt =>
                {
                    ushort port = 4200;
                    opt.UseProxyToSpaDevelopmentServer($"http://localhost:{port}");
                    // Here, code could be added to start the Angular CLI if no application is running on the port.
                });
            }

            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapControllers();
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
    }
}