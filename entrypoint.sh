#!/bin/bash
set -e

ENV_LOCAL_PATH=/app/.env.local

echo "=========================================="
echo "Chat UI Startup"
echo "=========================================="

# Handle .env.local configuration
if test -z "${DOTENV_LOCAL}" ; then
    if ! test -f "${ENV_LOCAL_PATH}" ; then
        echo "⚠️  WARNING: DOTENV_LOCAL was not found in the ENV variables and .env.local is not set using a bind volume."
        echo "   Make sure to set environment variables properly."
    fi;
else
    echo "✓ DOTENV_LOCAL found in ENV variables. Creating .env.local file."
    cat <<< "$DOTENV_LOCAL" > ${ENV_LOCAL_PATH}
fi;

# Start MongoDB if INCLUDE_DB is true
if [ "$INCLUDE_DB" = "true" ] ; then
    echo "✓ Starting local MongoDB instance"
    nohup mongod &
    sleep 2
fi;

# Validate critical environment variables
echo ""
echo "Validating configuration..."

# Check OPENAI_BASE_URL
if [ -z "$OPENAI_BASE_URL" ]; then
    echo ""
    echo "❌ ERROR: OPENAI_BASE_URL is not set!"
    echo ""
    echo "Chat UI requires an OpenAI-compatible API endpoint."
    echo ""
    echo "Solutions:"
    echo "  1. Use Hugging Face Inference API (recommended):"
    echo "     OPENAI_BASE_URL=https://router.huggingface.co/v1"
    echo "     OPENAI_API_KEY=hf_your_token_here"
    echo ""
    echo "  2. Use a separate TGI instance:"
    echo "     OPENAI_BASE_URL=https://your-tgi-endpoint.hf.space/v1"
    echo ""
    echo "  3. Use other OpenAI-compatible services:"
    echo "     - Ollama: http://your-host:11434/v1"
    echo "     - llama.cpp: http://your-host:8080/v1"
    echo "     - OpenRouter: https://openrouter.ai/api/v1"
    echo ""
    echo "See README.md for more details."
    echo ""
    exit 1
fi

# Check MongoDB configuration
if [ -z "$MONGODB_URL" ] && [ "$INCLUDE_DB" != "true" ]; then
    echo ""
    echo "❌ ERROR: MONGODB_URL is not set and INCLUDE_DB is not true!"
    echo ""
    echo "Chat UI requires MongoDB for storing conversations and settings."
    echo ""
    echo "Solutions:"
    echo "  1. Use MongoDB Atlas (free tier available):"
    echo "     MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chat-ui"
    echo ""
    echo "  2. Use the chat-ui-db Docker image which includes MongoDB:"
    echo "     docker run ghcr.io/huggingface/chat-ui-db:latest"
    echo ""
    echo "  3. Run MongoDB locally:"
    echo "     docker run -d -p 27017:27017 mongo:latest"
    echo "     MONGODB_URL=mongodb://localhost:27017"
    echo ""
    exit 1
fi

# Check API key
if [ -z "$OPENAI_API_KEY" ] && [ -z "$HF_TOKEN" ]; then
    echo ""
    echo "⚠️  WARNING: Neither OPENAI_API_KEY nor HF_TOKEN is set!"
    echo "   Most API endpoints require authentication."
    echo ""
fi

echo ""
echo "Configuration validated successfully!"
echo ""
echo "Starting Chat UI..."
echo "  - OpenAI Base URL: $OPENAI_BASE_URL"
echo "  - MongoDB: ${MONGODB_URL:-local (INCLUDE_DB=true)}"
echo "  - Port: 3000"
echo ""

export PUBLIC_VERSION=$(node -p "require('./package.json').version")

dotenv -e /app/.env -c -- node --dns-result-order=ipv4first /app/build/index.js -- --host 0.0.0.0 --port 3000