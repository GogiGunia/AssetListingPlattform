namespace ALP.WebAPI.Models.ViewModels
{
    public class TokenBundle
    {
        public TokenBundle(string accessToken, string refreshToken)
        {
            this.AccessToken = accessToken;
            this.RefreshToken = refreshToken;
        }

        public string AccessToken { get; init; }
        public string RefreshToken { get; init; }
    }
}
