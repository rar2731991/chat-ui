# Proxy Configuration Guide

Chat UI now supports HTTP/HTTPS proxy configuration for all outbound requests to LLM providers and external services.

## Environment Variables

Add the following environment variables to your `.env.local` file:

### HTTP_PROXY
URL of the HTTP proxy server (e.g., `http://proxy.example.com:8080`)

```env
HTTP_PROXY=http://proxy.example.com:8080
```

### HTTPS_PROXY
URL of the HTTPS proxy server (e.g., `http://proxy.example.com:8080`)

```env
HTTPS_PROXY=http://proxy.example.com:8080
```

**Note:** If both `HTTP_PROXY` and `HTTPS_PROXY` are set, `HTTPS_PROXY` takes precedence for HTTPS requests.

### NO_PROXY
Comma-separated list of hosts that should bypass the proxy

```env
NO_PROXY=localhost,127.0.0.1,.internal.example.com
```

**Supported patterns:**
- Exact hostname: `localhost`
- IP addresses: `127.0.0.1`, `192.168.1.1`
- Domain suffix with leading dot: `.example.com` (matches `api.example.com`, `www.example.com`)
- Domain suffix without leading dot: `example.com` (matches `*.example.com`)
- Wildcard: `*` (bypasses proxy for all hosts)

## Example Configuration

### Basic Proxy Setup
```env
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
```

### Proxy with Exclusions
```env
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
NO_PROXY=localhost,127.0.0.1,.internal.company.com
```

### Authenticated Proxy
```env
HTTP_PROXY=http://username:password@proxy.company.com:8080
HTTPS_PROXY=http://username:password@proxy.company.com:8080
```

## What Gets Proxied?

When proxy configuration is enabled, the following requests will go through the proxy:

1. **OpenAI-compatible API calls** - All requests to `OPENAI_BASE_URL` (e.g., Hugging Face router, OpenAI, Ollama, etc.)
2. **LLM Router calls** - Arch router selection requests
3. **External URL fetching** - File attachments and URL content fetching
4. **Model list fetching** - Requests to `/models` endpoint

## Testing Your Configuration

1. Set your proxy environment variables in `.env.local`
2. Start the application: `npm run dev`
3. Check the logs for proxy initialization message:
   ```
   {"level":"info","msg":"Proxy configuration initialized","proxyUrl":"http://proxy.example.com:8080","noProxyHosts":["localhost","127.0.0.1"]}
   ```
4. Make a chat request and verify it goes through your proxy

## Troubleshooting

### Proxy not being used
- Verify environment variables are set correctly in `.env.local`
- Check that the proxy URL format is correct (must include protocol: `http://` or `https://`)
- Restart the application after changing environment variables

### Connection errors
- Verify the proxy server is accessible from your application
- Check if authentication is required and credentials are correct
- Ensure the proxy supports HTTPS CONNECT method for HTTPS requests

### Some requests bypass proxy
- Check your `NO_PROXY` configuration
- Verify the hostname matches your NO_PROXY patterns
- Remember that `NO_PROXY` patterns are case-insensitive

## Security Considerations

- **Credentials in URLs**: Avoid committing proxy credentials to version control. Use environment variables or secrets management.
- **HTTPS**: Always use HTTPS for sensitive data, even when going through a proxy
- **Certificate validation**: The proxy must properly handle SSL/TLS certificates

## Docker Configuration

When running in Docker, pass proxy environment variables:

```bash
docker run \
  -e HTTP_PROXY=http://proxy.example.com:8080 \
  -e HTTPS_PROXY=http://proxy.example.com:8080 \
  -e NO_PROXY=localhost,127.0.0.1 \
  -e MONGODB_URL=mongodb://... \
  -e OPENAI_BASE_URL=https://... \
  -e OPENAI_API_KEY=... \
  ghcr.io/huggingface/chat-ui:latest
```

## Additional Notes

- Proxy configuration is initialized on first use (lazy initialization)
- The same proxy settings apply to all outbound HTTP/HTTPS requests
- Standard environment variable names (`HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`) are supported in both uppercase and lowercase
