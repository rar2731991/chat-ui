# Troubleshooting Guide

Quick solutions to common Chat UI deployment issues.

## "Failed to connect to 127.0.0.1 port 8080" Error

### What This Means

This error indicates that something is trying to connect to Text Generation Inference (TGI) on port 8080, but TGI is not running.

### Why This Happens

Chat UI **no longer includes TGI**. As of version 0.20.0, Chat UI only supports OpenAI-compatible APIs and does not automatically start TGI.

### Quick Fix

Choose one of these solutions:

#### Solution 1: Use Hugging Face Inference API (Easiest)

Set these environment variables:

```env
OPENAI_BASE_URL=https://router.huggingface.co/v1
OPENAI_API_KEY=hf_your_token_here
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chat-ui
```

Get your HF token from: https://huggingface.co/settings/tokens

#### Solution 2: Run TGI Separately

1. Create a separate TGI instance (e.g., another Hugging Face Space)
2. Point Chat UI to it:

```env
OPENAI_BASE_URL=https://your-tgi-endpoint.hf.space/v1
OPENAI_API_KEY=any-string-here
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chat-ui
```

#### Solution 3: Use Another OpenAI-Compatible Service

```env
# Ollama
OPENAI_BASE_URL=http://your-ollama-host:11434/v1
OPENAI_API_KEY=ollama

# llama.cpp
OPENAI_BASE_URL=http://your-llama-cpp-host:8080/v1
OPENAI_API_KEY=sk-local-demo

# OpenRouter
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-key-here
```

### For Hugging Face Spaces Users

If you're deploying on Hugging Face Spaces:

1. **Don't use the old TGI template** - it's no longer compatible
2. **Use the Docker SDK** with Chat UI image
3. **Set environment variables** in Space settings (not in Dockerfile)
4. **Use Hugging Face Inference API** for the easiest setup

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## "OPENAI_BASE_URL is not set" Error

### Quick Fix

Set the `OPENAI_BASE_URL` environment variable:

```env
OPENAI_BASE_URL=https://router.huggingface.co/v1
```

This is **required** for Chat UI to work.

---

## "MongoDB connection failed" Error

### Quick Fix

Choose one:

#### Option 1: Use MongoDB Atlas (Free)

1. Create account at https://www.mongodb.com/pricing
2. Create a free cluster
3. Get connection string
4. Set: `MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chat-ui`

#### Option 2: Use Chat UI with Built-in MongoDB

Use the Docker image with MongoDB included:

```bash
docker run -p 3000:3000 \
  -e OPENAI_BASE_URL=https://router.huggingface.co/v1 \
  -e OPENAI_API_KEY=hf_xxx \
  -e INCLUDE_DB=true \
  ghcr.io/huggingface/chat-ui-db:latest
```

#### Option 3: Run MongoDB Locally

```bash
docker run -d -p 27017:27017 --name mongo mongo:latest
```

Then set: `MONGODB_URL=mongodb://localhost:27017`

---

## Models Not Showing Up

### Possible Causes

1. `OPENAI_BASE_URL` is incorrect
2. API endpoint doesn't support `/v1/models`
3. `OPENAI_API_KEY` is invalid
4. Network connectivity issues

### Quick Fix

1. **Verify your endpoint**:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://router.huggingface.co/v1/models
   ```

2. **Check logs** for API errors:
   ```bash
   docker logs <container-name>
   ```

3. **Ensure API key is valid**:
   - For HF: Check https://huggingface.co/settings/tokens
   - Verify token has correct permissions

---

## Container Exits Immediately

### Quick Fix

1. **Check logs**:
   ```bash
   docker logs <container-name>
   ```

2. **Verify required environment variables**:
   - `OPENAI_BASE_URL` must be set
   - `MONGODB_URL` must be set (or `INCLUDE_DB=true`)

3. **Test configuration**:
   ```bash
   docker run --rm \
     -e OPENAI_BASE_URL=https://router.huggingface.co/v1 \
     -e OPENAI_API_KEY=hf_xxx \
     -e MONGODB_URL=mongodb://localhost:27017 \
     ghcr.io/huggingface/chat-ui:latest
   ```

---

## Authentication Errors

### Quick Fix

1. **Verify API key format**:
   - Hugging Face: `hf_xxxxxxxxxxxxx`
   - OpenAI: `sk-xxxxxxxxxxxxx`
   - OpenRouter: `sk-or-v1-xxxxxxxxxxxxx`

2. **Check token permissions**:
   - For HF tokens, ensure "read" permission is enabled

3. **Test API key**:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        YOUR_OPENAI_BASE_URL/models
   ```

---

## Migration from Legacy Version

If you're upgrading from pre-v0.20.0:

### What Changed

- ❌ No built-in TGI
- ❌ No `MODELS` environment variable
- ❌ No GGUF discovery
- ✅ OpenAI-compatible APIs only
- ✅ Simpler configuration

### Migration Steps

1. **Remove old configuration**:
   - Remove `MODELS` env var
   - Remove TGI-specific settings

2. **Add new configuration**:
   ```env
   OPENAI_BASE_URL=https://router.huggingface.co/v1
   OPENAI_API_KEY=hf_your_token_here
   ```

3. **Update Docker image**:
   ```bash
   docker pull ghcr.io/huggingface/chat-ui:latest
   ```

4. **Test deployment**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed migration guide.

---

## Still Having Issues?

1. **Check the logs**: Most errors are explained in the container logs
2. **Read the docs**: [README.md](./README.md) and [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Search existing issues**: [GitHub Issues](https://github.com/huggingface/chat-ui/issues)
4. **Ask for help**: 
   - Create a new issue with logs and configuration
   - Join Hugging Face Discord
   - Post on Hugging Face forums

### When Asking for Help, Include:

- Chat UI version
- Deployment method (Docker, Kubernetes, Spaces, etc.)
- Environment variables (redact sensitive values)
- Full error logs
- Steps to reproduce

---

## Quick Reference

### Minimum Required Configuration

```env
# Required
OPENAI_BASE_URL=https://router.huggingface.co/v1
OPENAI_API_KEY=hf_your_token_here
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chat-ui

# Optional but recommended
PUBLIC_APP_NAME=My Chat UI
MONGODB_DB_NAME=chat-ui
```

### Docker Quick Start

```bash
docker run -d \
  --name chat-ui \
  -p 3000:3000 \
  -e OPENAI_BASE_URL=https://router.huggingface.co/v1 \
  -e OPENAI_API_KEY=hf_xxx \
  -e MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chat-ui \
  ghcr.io/huggingface/chat-ui:latest
```

### Hugging Face Spaces Quick Start

1. Create Space with Docker SDK
2. Add Dockerfile:
   ```dockerfile
   FROM ghcr.io/huggingface/chat-ui:latest
   ```
3. Set environment variables in Space settings
4. Deploy

---

**Need more help?** See the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide.
