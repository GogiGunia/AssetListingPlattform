namespace ALP.WebAPI.Middleware.ExceptionHandling
{
    public class ExceptionHandlingOptions
    {
        public bool IncludeTrace { get; set; } = false;
        public bool SendInnerExceptionToClient { get; set; } = false;
    }
}
