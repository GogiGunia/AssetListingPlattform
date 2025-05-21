namespace ALP.WebAPI.Exceptions
{
    public class AccessDeniedException : Exception
    {
        public string ErrorCode { get; }

        public AccessDeniedException(string errorCode, string message) : base(message)
        {
            ErrorCode = errorCode;
        }

        public AccessDeniedException(string errorCode, string message, Exception innerException) : base(message, innerException)
        {
            ErrorCode = errorCode;
        }

        public AccessDeniedException(string errorCode, Exception innerException) : base(innerException.Message, innerException)
        {
            ErrorCode = errorCode;
        }
    }
}
