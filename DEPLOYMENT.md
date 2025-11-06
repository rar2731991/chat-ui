# Chat UI Deployment Guide

This guide covers various deployment scenarios for Chat UI, with special focus on Hugging Face Spaces deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Hugging Face Spaces Deployment](#hugging-face-spaces-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Migration from Legacy Version](#migration-from-legacy-version)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Chat UI requires two main components:

1. **OpenAI-Compatible API Endpoint**: Chat UI connects to any service that implements the OpenAI API protocol
2. **MongoDB Database**: For storing conversations, user settings, and application data

## Hugging Face Spaces Deployment

### Understanding the Architecture

> [!IMPORTANT]
> Chat UI **does not include Text Generation Inference (TGI)**. It's a frontend application that connects to external API endpoints.

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│  Chat UI    │─────▶│ OpenAI-Compatible│─────▶│   Model     │
│  (Frontend) │      │   API Endpoint   │      │  (Backend)  │
└─────────────┘      └──────────────────┘      └─────────────┘
       │
       │
       ▼
┌─────────────┐
│  MongoDB    │
│  (Database) │
└─────────────┘
```

### Option 1: Using Hugging Face Inference API (Recommended)

This is the simplest and most cost-effective approach for most users.

#### Step 1: Get Your Hugging Face Token

1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a new token with `read` permissions
3. Copy the token (starts with `hf_`)

#### Step 2: Set Up MongoDB

**Option A: MongoDB Atlas (Recommended)**

1. Create a free account at [mongodb.com](https://www.mongodb.com/pricing)
2. Create a new cluster (free tier available)
3. Add your IP to the network access list (or use `0.0.0.0/0` for development)
4. Create a database user
5. Get your connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net/`)

**Option B: Use Chat UI with Built-in MongoDB**

Use the `chat-ui-db` Docker image which includes MongoDB.

#### Step 3: Deploy to Hugging Face Spaces

1. **Create a new Space**:
   - Go to [huggingface.co/new-space](https://huggingface.co/new-space)
   - Choose "Docker" as the SDK
   - Select "Blank" template

2. **Configure your Space**:
   
   Create a `Dockerfile` in your Space:
   ```dockerfile
   FROM ghcr.io/huggingface/chat-ui:latest
   ```

   Or use the version with MongoDB included:
   ```dockerfile
   FROM ghcr.io/huggingface/chat-ui-db:latest
   ```

3. **Set Environment Variables** in Space settings:

   ```env
   # Required: API Configuration
   OPENAI_BASE_URL=https://router.huggingface.co/v1
   OPENAI_API_KEY=hf_your_token_here
   
   # Required: Database (if not using chat-ui-db image)
   MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chat-ui
   
   # Optional: Customization
   PUBLIC_APP_NAME=My Chat UI
   PUBLIC_APP_DESCRIPTION=My custom chat interface
   ```

4. **Deploy**: Push your changes and your Space will automatically deploy

### Option 2: Using a Separate TGI Instance

If you want to use a specific model with Text Generation Inference:

#### Step 1: Create a TGI Space

1. **Create a new Space** for TGI:
   - Go to [huggingface.co/new-space](https://huggingface.co/new-space)
   - Choose "Docker" as the SDK
   - Name it something like `my-tgi-server`

2. **Configure TGI** with a Dockerfile:
   ```dockerfile
   FROM ghcr.io/huggingface/text-generation-inference:latest
   
   ENV MODEL_ID=meta-llama/Llama-2-7b-chat-hf
   ENV NUM_SHARD=1
   ENV MAX_INPUT_LENGTH=2048
   ENV MAX_TOTAL_TOKENS=4096
   ```

3. **Set Environment Variables**:
   ```env
   HF_TOKEN=hf_your_token_here
   ```

4. **Note your TGI Space URL**: e.g., `https://your-username-my-tgi-server.hf.space`

#### Step 2: Create Chat UI Space

Follow the same steps as Option 1, but use your TGI endpoint:

```env
OPENAI_BASE_URL=https://your-username-my-tgi-server.hf.space/v1
OPENAI_API_KEY=any-string-here
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chat-ui
```

### Option 3: Using Other OpenAI-Compatible Services

Chat UI works with any OpenAI-compatible API:

#### Ollama
```env
OPENAI_BASE_URL=http://your-ollama-host:11434/v1
OPENAI_API_KEY=ollama
```

#### llama.cpp Server
```env
OPENAI_BASE_URL=http://your-llama-cpp-host:8080/v1
OPENAI_API_KEY=sk-local-demo
```

#### OpenRouter
```env
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-key-here
```

#### vLLM
```env
OPENAI_BASE_URL=http://your-vllm-host:8000/v1
OPENAI_API_KEY=your-api-key
```

## Docker Deployment

### Using Docker Compose (Development)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/huggingface/chat-ui
   cd chat-ui
   ```

2. **Create `.env.local`**:
   ```env
   OPENAI_BASE_URL=https://router.huggingface.co/v1
   OPENAI_API_KEY=hf_your_token_here
   MONGODB_URL=mongodb://localhost:27017
   ```

3. **Start MongoDB**:
   ```bash
   docker-compose up -d mongo
   ```

4. **Install dependencies and run**:
   ```bash
   npm install
   npm run dev
   ```

### Using Docker (Production)

#### Option A: External MongoDB

```bash
docker run -d \
  --name chat-ui \
  -p 3000:3000 \
  -e OPENAI_BASE_URL=https://router.huggingface.co/v1 \
  -e OPENAI_API_KEY=hf_your_token_here \
  -e MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chat-ui \
  ghcr.io/huggingface/chat-ui:latest
```

#### Option B: With Built-in MongoDB

```bash
docker run -d \
  --name chat-ui \
  -p 3000:3000 \
  -e OPENAI_BASE_URL=https://router.huggingface.co/v1 \
  -e OPENAI_API_KEY=hf_your_token_here \
  -e INCLUDE_DB=true \
  -v chat-ui-data:/data/db \
  ghcr.io/huggingface/chat-ui-db:latest
```

### Building Your Own Docker Image

```bash
# Build the image
docker build -t my-chat-ui .

# Run with external MongoDB
docker run -d \
  --name chat-ui \
  -p 3000:3000 \
  -e OPENAI_BASE_URL=https://router.huggingface.co/v1 \
  -e OPENAI_API_KEY=hf_your_token_here \
  -e MONGODB_URL=mongodb://host.docker.internal:27017 \
  my-chat-ui
```

## Kubernetes Deployment

Chat UI includes Helm charts for Kubernetes deployment.

### Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.x
- MongoDB instance (can be external or in-cluster)

### Basic Deployment

1. **Clone the repository**:
   ```bash
   git clone https://github.com/huggingface/chat-ui
   cd chat-ui/chart
   ```

2. **Create a values file** (`my-values.yaml`):
   ```yaml
   image:
     repository: ghcr.io/huggingface/chat-ui
     tag: latest
   
   envVars:
     OPENAI_BASE_URL: "https://router.huggingface.co/v1"
     OPENAI_API_KEY: "hf_your_token_here"
     MONGODB_URL: "mongodb+srv://user:pass@cluster.mongodb.net/chat-ui"
     PUBLIC_APP_NAME: "My Chat UI"
   
   resources:
     requests:
       memory: "512Mi"
       cpu: "250m"
     limits:
       memory: "1Gi"
       cpu: "500m"
   
   ingress:
     enabled: true
     hosts:
       - host: chat.example.com
         paths:
           - path: /
             pathType: Prefix
   ```

3. **Deploy with Helm**:
   ```bash
   helm install chat-ui . -f my-values.yaml
   ```

### Using Secrets for Sensitive Data

For production, use Kubernetes secrets:

```bash
# Create secret for API key
kubectl create secret generic chat-ui-secrets \
  --from-literal=OPENAI_API_KEY=hf_your_token_here \
  --from-literal=MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chat-ui

# Update values.yaml
extraEnvFrom:
  - secretRef:
      name: chat-ui-secrets
```

## Migration from Legacy Version

If you're migrating from the legacy version (pre-v0.20.0) that had built-in TGI support:

### What Changed

1. **No Built-in TGI**: Chat UI no longer starts TGI automatically
2. **OpenAI API Only**: All model interactions go through OpenAI-compatible APIs
3. **No MODELS env var**: Models are fetched from `${OPENAI_BASE_URL}/models`
4. **Simplified Configuration**: Fewer environment variables needed

### Migration Steps

1. **Identify your current setup**:
   - Were you using TGI? → Set up separate TGI instance or use HF Inference API
   - Were you using custom models? → Ensure they're available via OpenAI-compatible endpoint
   - Were you using embeddings? → These are no longer built-in

2. **Update environment variables**:
   
   **Before (Legacy)**:
   ```env
   MODELS=[{"name":"my-model","endpoints":[{"url":"http://localhost:8080"}]}]
   HF_TOKEN=hf_xxx
   ```
   
   **After (Current)**:
   ```env
   OPENAI_BASE_URL=https://router.huggingface.co/v1
   OPENAI_API_KEY=hf_xxx
   ```

3. **Update Docker configuration**:
   - Remove any TGI-specific Docker configurations
   - Use the new `ghcr.io/huggingface/chat-ui:latest` image
   - Ensure `OPENAI_BASE_URL` points to your model endpoint

4. **Test the migration**:
   - Verify models appear in the UI
   - Test chat functionality
   - Check that conversations are saved to MongoDB

## Troubleshooting

### Error: "Failed to connect to 127.0.0.1 port 8080"

**Cause**: Something is trying to connect to TGI on port 8080, but TGI is not running.

**Solutions**:
1. Use Hugging Face Inference API instead of TGI
2. Set up a separate TGI instance and point `OPENAI_BASE_URL` to it
3. Remove any legacy TGI configuration from your deployment

### Error: "OPENAI_BASE_URL is not set"

**Cause**: The required `OPENAI_BASE_URL` environment variable is missing.

**Solution**: Set the environment variable:
```env
OPENAI_BASE_URL=https://router.huggingface.co/v1
```

### Error: "MongoDB connection failed"

**Cause**: Chat UI cannot connect to MongoDB.

**Solutions**:
1. Verify `MONGODB_URL` is correct
2. Check network connectivity to MongoDB
3. Ensure MongoDB is running and accessible
4. For MongoDB Atlas, verify IP whitelist settings
5. Use the `chat-ui-db` image which includes MongoDB

### Models Not Showing Up

**Cause**: Chat UI cannot fetch models from the API endpoint.

**Solutions**:
1. Verify `OPENAI_BASE_URL` is correct and accessible
2. Check that the endpoint supports `/v1/models`
3. Verify `OPENAI_API_KEY` is valid
4. Check logs for API errors

### Container Exits Immediately

**Cause**: Missing required environment variables or configuration errors.

**Solutions**:
1. Check container logs: `docker logs <container-id>`
2. Verify all required environment variables are set
3. Ensure MongoDB is accessible
4. Check the entrypoint script output for specific errors

### Authentication Issues

**Cause**: API key is invalid or missing.

**Solutions**:
1. Verify `OPENAI_API_KEY` is set correctly
2. For HF Inference API, ensure token has correct permissions
3. Check that the token hasn't expired
4. For custom endpoints, verify authentication requirements

### Performance Issues

**Cause**: Insufficient resources or slow API endpoint.

**Solutions**:
1. Increase container resources (CPU/memory)
2. Use a faster API endpoint or model
3. Enable caching if supported by your endpoint
4. Consider using a CDN for static assets

## Getting Help

- **Documentation**: [README.md](./README.md)
- **GitHub Issues**: [github.com/huggingface/chat-ui/issues](https://github.com/huggingface/chat-ui/issues)
- **Hugging Face Forums**: [discuss.huggingface.co](https://discuss.huggingface.co)
- **Discord**: Join the Hugging Face Discord server

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Text Generation Inference](https://github.com/huggingface/text-generation-inference)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference)
