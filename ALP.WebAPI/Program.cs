using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using ALP.Model;
using System.Reflection;

namespace ALP.WebAPI
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            ConfigureServices(builder.Services, builder.Configuration, builder.Environment);
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
    }
}