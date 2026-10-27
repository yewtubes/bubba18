using Microsoft.AspNetCore.Mvc;
using Roblox.Website.WebsiteServices;

namespace Roblox.Website.Controllers;

[ApiController]
[Route("/")]
public sealed class CapController : ControllerBase
{
    [HttpPostBypass("captcha/{operation}")]
    [RequestSizeLimit(65536)]
    public async Task<IActionResult> Challenge(string operation, [FromServices] CapService cap)
    {
        if (operation != "challenge" && operation != "redeem") return NotFound();
        if (!cap.IsConfigured) return StatusCode(503, new { error = "verification_unavailable" });
        try
        {
            using var reader = new StreamReader(Request.Body);
            var json = await reader.ReadToEndAsync();
            if (json.Length > 65536) return StatusCode(413);
            using var response = await cap.Request(operation, string.IsNullOrWhiteSpace(json) ? "{}" : json, GetIP(GetRequesterIpRaw(HttpContext)), HttpContext.RequestAborted);
            Response.Headers["Cache-Control"] = "no-store";
            return new ContentResult { StatusCode = (int)response.StatusCode, ContentType = "application/json", Content = await response.Content.ReadAsStringAsync() };
        }
        catch (Exception error) when (error is HttpRequestException or TaskCanceledException or InvalidOperationException)
        { return StatusCode(503, new { error = "verification_unavailable" }); }
    }

    [HttpGetBypass("captcha/assets/{filename}")]
    public async Task<IActionResult> Asset(string filename, [FromServices] CapService cap)
    {
        if (!new[] { "widget.js", "cap_wasm_bg.wasm", "hashwx.wasm", "pako_inflate.min.js" }.Contains(filename)) return NotFound();
        if (!cap.IsConfigured) return StatusCode(503);
        try
        {
            using var response = await cap.Request("assets/" + filename, null, "asset", HttpContext.RequestAborted);
            if (!response.IsSuccessStatusCode) return StatusCode(503);
            Response.Headers["Cache-Control"] = "public,max-age=3600";
            return File(await response.Content.ReadAsByteArrayAsync(), filename.EndsWith(".wasm") ? "application/wasm" : "text/javascript");
        }
        catch (Exception error) when (error is HttpRequestException or TaskCanceledException or InvalidOperationException)
        { return StatusCode(503); }
    }
}
