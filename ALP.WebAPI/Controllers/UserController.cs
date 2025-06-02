using ALP.WebAPI.Exceptions;
using ALP.WebAPI.Interfaces;
using ALP.WebAPI.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace ALP.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(
            IUserService userService,
            ILogger<UserController> logger)
        {
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Create a new user account
        /// </summary>
        /// <param name="registerRequest">User registration data</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created user information</returns>
        /// <response code="201">User successfully created</response>
        /// <response code="400">Invalid request data</response>
        /// <response code="409">User with email already exists</response>
        /// <response code="500">Internal server error</response>
        [HttpPost("Create")]
        //[ProducesResponseType(typeof(UserRegistrationResponseModel), StatusCodes.Status201Created)]
        //[ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        //[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        //[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<UserRegistrationResponseModel>> CreateUser(
            [FromBody] RegisterRequestModel registerRequest,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Received user creation request for email: {Email}",
                    registerRequest?.UserModel?.Email);

                // Model validation is automatically handled by [ApiController] attribute
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for user creation request");
                    return BadRequest(ModelState);
                }

                // Additional custom validation
                if (registerRequest.UserModel.Email != null && !IsValidEmail(registerRequest.UserModel.Email))
                {
                    ModelState.AddModelError(nameof(registerRequest.UserModel.Email), "Invalid email format");
                    return BadRequest(ModelState);
                }

                // Create the user
                var result = await _userService.RegisterUserAsync(registerRequest, cancellationToken);

                _logger.LogInformation("Successfully created user with ID: {UserId}", result.Id);

                // Return 201 Created with the created user data
                return CreatedAtAction(
                    nameof(GetUserById),
                    new { id = result.Id },
                    result);
            }
            catch (InvalidClientDataException ex)
            {
                _logger.LogWarning("User creation failed due to client data issue: {Message}", ex.Message);

                // Return 409 Conflict for duplicate email or other client data issues
                return Conflict(new ProblemDetails
                {
                    Title = "Registration Failed",
                    Detail = ex.Message,
                    Status = StatusCodes.Status409Conflict,
                    Instance = HttpContext.Request.Path
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("User creation failed due to invalid arguments: {Message}", ex.Message);

                return BadRequest(new ProblemDetails
                {
                    Title = "Invalid Request",
                    Detail = ex.Message,
                    Status = StatusCodes.Status400BadRequest,
                    Instance = HttpContext.Request.Path
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during user creation for email: {Email}",
                    registerRequest?.UserModel?.Email);

                // Return 500 Internal Server Error for unexpected exceptions
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred while creating the user account.",
                    Status = StatusCodes.Status500InternalServerError,
                    Instance = HttpContext.Request.Path
                });
            }
        }

        /// <summary>
        /// Check if email is available for registration
        /// </summary>
        /// <param name="email">Email to check</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Availability status</returns>
        [HttpGet("email-available")]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<bool>> IsEmailAvailable(
            [FromQuery, Required, EmailAddress] string email,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest("Email parameter is required");
                }

                var exists = await _userService.EmailExistsAsync(email, cancellationToken);
                return Ok(!exists); // Return true if email is available (doesn't exist)
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking email availability for: {Email}", email);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "An error occurred while checking email availability");
            }
        }

        /// <summary>
        /// Get user by ID (placeholder for CreatedAtAction)
        /// </summary>
        /// <param name="id">User ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>User information</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(UserRegistrationResponseModel), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<UserRegistrationResponseModel>> GetUserById(
            int id,
            CancellationToken cancellationToken = default)
        {
            // TODO: Implement GetUserById if needed
            // This is mainly here to support the CreatedAtAction response
            return NotFound("User lookup not implemented");
        }

        /// <summary>
        /// Validate email format using built-in validation
        /// </summary>
        private static bool IsValidEmail(string email)
        {
            var emailValidator = new EmailAddressAttribute();
            return emailValidator.IsValid(email);
        }
    }
}
