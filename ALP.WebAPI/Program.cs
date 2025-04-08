namespace ALP.WebAPI
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Logging.ClearProviders();

            ILogger logger = GetStartupLogger(builder.Configuration);

            ConfigureServices(builder.Services);
            var app = builder.Build();


            logger.LogInformation("Configuring request pipeline...");
            ConfigureRequestPipeline(app);

            logger.LogInformation("Starting Webserver...");

            await app.RunAsync();
        }

        private static void ConfigureLogging(IWebHostEnvironment environment, ILoggingBuilder logging, ConfigurationManager configuration)
        {
            // More Information for Logging https://learn.microsoft.com/en-us/aspnet/core/fundamentals/logging/
            logging.ClearProviders();

            if (environment.IsDevelopment())
                logging.AddConsole().AddConfiguration(configuration);

            logging.AddLog4Net(GetLog4NetOptions());
        }

        private static Log4NetProviderOptions GetLog4NetOptions()
        {
            return new("log4net.config");
        }

        private static ILogger GetStartupLogger(ConfigurationManager configuration)
        {
            using var loggerFactory = LoggerFactory.Create(builder =>
                builder.AddConsole()
                       .AddConfiguration(configuration.GetSection("Logging"))
                       .SetMinimumLevel(LogLevel.Trace));

            return loggerFactory.CreateLogger<Program>();
        }

        private static void ConfigureServices(IServiceCollection services)
        {
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
                    // Hier könnte Code hin, um die Angular-Cli zu Starten falls auf dem Port keine Anwendung erkannt wird...
                });
            }

            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapControllers();
        }
    }
}