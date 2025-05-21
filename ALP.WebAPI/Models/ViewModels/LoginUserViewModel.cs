namespace ALP.WebAPI.Models.ViewModels
{
    public class LoginUserViewModel
    {
        public string Email { get; set; } = null!;
        public string AccessToken { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
    }
}
