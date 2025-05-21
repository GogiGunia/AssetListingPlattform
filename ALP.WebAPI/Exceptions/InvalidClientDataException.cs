namespace ALP.WebAPI.Exceptions
{
    public class InvalidClientDataException : Exception
    {
        public InvalidClientDataException() : base("Invalid client data provided.") { }
        public InvalidClientDataException(string message) : base(message) { }
        public InvalidClientDataException(string message, Exception innerException) : base(message, innerException) { }
    }
}
