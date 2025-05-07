using Microsoft.AspNetCore.Mvc;

namespace ALP.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult> GetTestData()
        {
            await Task.CompletedTask;
            throw new Exception("This is a test exception for debugging purposes.");
        }
    }
}

