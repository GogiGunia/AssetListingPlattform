using ALP.Model.Model;
using System.Text.Json.Serialization;

namespace ALP.WebAPI.Models.ViewModels
{
    public class UserViewModel : ResponseBaseViewModel<User>
    {
        public UserViewModel(User dataObject) : base(dataObject) { }
        public int Id
        {
            get => DataObject.Id;
            set => DataObject.Id = value;
        }

        public string Email
        {
            get => DataObject.Email;
            set => DataObject.Email = value;
        }

        public string FirstName
        {
            get => DataObject.FirstName;
            set => DataObject.FirstName = value;
        }

        public string LastName
        {
            get => DataObject.LastName;
            set => DataObject.LastName = value;
        }

        public string PasswordHash
        {
            get => DataObject.PasswordHash;
            set => DataObject.PasswordHash = value;
        }

        public string? PasswordResetToken
        {
            get => DataObject.PasswordResetToken;
            set => DataObject.PasswordResetToken = value;
        }

        public DateTime? PasswordResetTokenExpiry
        {
            get => DataObject.PasswordResetTokenExpiry;
            set => DataObject.PasswordResetTokenExpiry = value;
        }

        [JsonConverter(typeof(JsonStringEnumConverter<UserRole>))]
        public UserRole Role
        {
            get => DataObject.Role;
            set => DataObject.Role = value;
        }

        public DateTime CreatedAt
        {
            get => DataObject.CreatedAt;
            set => DataObject.CreatedAt = value;
        }
    }
}
