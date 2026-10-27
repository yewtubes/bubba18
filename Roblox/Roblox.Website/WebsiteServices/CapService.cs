using System.Net.Http.Json;
using System.Text.Json;

namespace Roblox.Website.WebsiteServices;

// A private, independently hosted Cap verifier. Never accept a browser success flag.
public sealed class CapService : IDisposable
{
    private readonly HttpClient client = new(new HttpClientHandler { AllowAutoRedirect = false });
    private readonly string? secret;
    private readonly Uri? endpoint;
    public CapService(IConfiguration configuration)
    {
        secret = configuration["Cap:Secret"];
        if (Uri.TryCreate(configuration["Cap:Endpoint"], UriKind.Absolute, out var uri) &&
            (uri.Scheme == "http" || uri.Scheme == "https") && string.IsNullOrEmpty(uri.UserInfo))
            endpoint = new Uri(uri.AbsoluteUri.TrimEnd('/') + "/");
        client.Timeout = TimeSpan.FromSeconds(15);
    }
    public bool IsConfigured => endpoint != null && !string.IsNullOrEmpty(secret) && secret.Length >= 32;
    public async Task<HttpResponseMessage> Request(string operation, string? json, string clientId, CancellationToken cancellation)
    {
        if (!IsConfigured) throw new InvalidOperationException("Cap is not configured");
        var request = new HttpRequestMessage(json == null ? HttpMethod.Get : HttpMethod.Post, new Uri(endpoint!, operation));
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", secret);
        request.Headers.Add("X-Cap-Client", clientId);
        if (json != null) request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        using (request) return await client.SendAsync(request, cancellation);
    }
    public async Task<bool> Verify(string token, CancellationToken cancellation)
    {
        if (string.IsNullOrEmpty(token) || token.Length > 512) return false;
        using var response = await Request("siteverify", JsonSerializer.Serialize(new { secret, response = token }), "server", cancellation);
        if (!response.IsSuccessStatusCode) return false;
        using var result = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellation), cancellationToken: cancellation);
        return result.RootElement.TryGetProperty("success", out var success) && success.ValueKind == JsonValueKind.True;
    }
    public void Dispose() => client.Dispose();
}
