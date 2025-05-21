namespace ALP.WebAPI.Exceptions
{
    public class BusinessException : Exception
    {
        public string ErrorCode { get; }
        public bool suppressLogEntry { get; set; } = false;

        public BusinessException(string errorCode) : base("A business exception occurred.")
        {
            ErrorCode = errorCode;
        }

        public BusinessException(string errorCode, string message) : base(message)
        {
            ErrorCode = errorCode;
        }
        public BusinessException(string errorCode, string message, Exception innerException) : base(message, innerException)
        {
            ErrorCode = errorCode;
        }
        public BusinessException(string errorCode, Exception innerException) : base(innerException.Message, innerException)
        {
            ErrorCode = errorCode;
        }
    }
}
