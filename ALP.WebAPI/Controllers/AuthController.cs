using ALP.Model.Model;
using ALP.WebAPI.Constants;
using ALP.WebAPI.Exceptions;
using ALP.WebAPI.Extensions;
using ALP.WebAPI.Interfaces;
using ALP.WebAPI.Middleware;
using ALP.WebAPI.Models.ViewModels;
using ALP.WebAPI.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ALP.WebAPI.Controllers
{
    [ApiController]
    [Route("/api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService userService;
        private readonly ITokenService tokenService;
        //private readonly LogUserActionService logUserActionService;
        private readonly ILogger<AuthController> logger;

        public AuthController(IUserService userService, ITokenService tokenService, /*LogUserActionService logUserActionService,*/ ILogger<AuthController> logger)
        {
            this.userService = userService;
            this.tokenService = tokenService;
            //this.logUserActionService = logUserActionService;
            this.logger = logger;
        }

        [HttpGet("{email}")]
        public async Task<ActionResult<LoginUserViewModel>> LoginUserAsync([FromRoute] string email, [FromHeader] string password)
        {
            CancellationToken cancellationToken = HttpContext.RequestAborted;
            User? user = await userService.TryGetUserByEmailAsync(email, true, cancellationToken);

            if (user == null)
                throw new BusinessException(ExceptionType.ERROR_LOGIN_FAILED, "User not found");

            if (!await userService.VerifyPasswordAsync(password, user, cancellationToken))
                throw new BusinessException(ExceptionType.ERROR_LOGIN_FAILED);

            var tokenbundle = await CreateTokenbundleAsync(email, cancellationToken);

            var userToClient = new LoginUserViewModel
            {
                Email = user!.Email,
                AccessToken = tokenbundle.AccessToken,
                RefreshToken = tokenbundle.RefreshToken,
            };

            // TODO Logging
            //try
            //{
            //    await logUserActionService.SetLogEntryAsync(ActionLogTypeEnum.UserLoginSuccess, user);
            //}
            //catch (Exception ex)
            //{
            //    logger.LogWarning("Fehler beim Schreiben des Action-Logeintrags: {ex}", ex.ToString());
            //}

            return userToClient;
        }

        [HttpGet]
        [Authorize(Policy = Policy.REFRESH_TOKEN)]
        public async Task<ActionResult<TokenBundle>> RefreshTokenAsync()
        {
            return await CreateTokenbundleAsync(HttpContext.GetEmail(), HttpContext.RequestAborted);
        }

        private async Task<TokenBundle> CreateTokenbundleAsync(string email, CancellationToken cancellationToken)
        {
            var user = await userService.GetUserByEmailAsync(email, cancellationToken: cancellationToken);
            string accessToken = tokenService.CreateToken(TokenType.AccessToken, user);
            string refreshToken = tokenService.CreateToken(TokenType.RefreshToken, user);
            return new TokenBundle(accessToken, refreshToken);
        }
    }
}
