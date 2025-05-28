using Microsoft.AspNetCore.Mvc;

namespace ALP.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<string>> GetTestData()
        {
            await Task.CompletedTask;
            return Ok("hello");
        }
    }
}

