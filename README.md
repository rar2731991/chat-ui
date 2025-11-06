# Chat UI

![Chat UI repository thumbnail](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/chat-ui/chat-ui-2026.png)

A chat interface for LLMs. It is a SvelteKit app and it powers the [HuggingChat app on hf.co/chat](https://huggingface.co/chat).

0. [Quickstart](#quickstart)
1. [Database Options](#database-options)
2. [Launch](#launch)
3. [Optional Docker Image](#optional-docker-image)
4. [Deploying on Hugging Face Spaces](#deploying-on-hugging-face-spaces)
5. [Extra parameters](#extra-parameters)
6. [Building](#building)
7. [Troubleshooting](./TROUBLESHOOTING.md)

> [!IMPORTANT]
> **Breaking Change**: Chat UI only supports OpenAI-compatible APIs via `OPENAI_BASE_URL` and the `/models` endpoint. Provider-specific integrations (legacy `MODELS` env var, GGUF discovery, embeddings, web-search helpers, etc.) are removed, but any service that speaks the OpenAI protocol (llama.cpp server, Ollama, OpenRouter, etc.) will work by default.

> [!WARNING]
> **Text Generation Inference (TGI) is NOT built-in**: If you're getting "Failed to connect to 127.0.0.1 port 8080" errors, this means you're trying to use TGI which is no longer automatically started by Chat UI. See [Deploying on Hugging Face Spaces](#deploying-on-hugging-face-spaces) for solutions.

> [!NOTE]
> The old version is still available on the [legacy branch](https://github.com/huggingface/chat-ui/tree/legacy)

## Quickstart

Chat UI speaks to OpenAI-compatible APIs only. The fastest way to get running is with the Hugging Face Inference Providers router plus your personal Hugging Face access token.

**Step 1 – Create `.env.local`:**

```env
OPENAI_BASE_URL=https://router.huggingface.co/v1
OPENAI_API_KEY=hf_************************
# Fill in once you pick a database option below
MONGODB_URL=
```

`OPENAI_API_KEY` can come from any OpenAI-compatible endpoint you plan to call. Pick the combo that matches your setup and drop the values into `.env.local`:

| Provider                                      | Example `OPENAI_BASE_URL`          | Example key env                                                         |
| --------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| Hugging Face Inference Providers router       | `https://router.huggingface.co/v1` | `OPENAI_API_KEY=hf_xxx` (or `HF_TOKEN` legacy alias)                    |
| llama.cpp server (`llama.cpp --server --api`) | `http://127.0.0.1:8080/v1`         | `OPENAI_API_KEY=sk-local-demo` (any string works; llama.cpp ignores it) |
| Ollama (with OpenAI-compatible bridge)        | `http://127.0.0.1:11434/v1`        | `OPENAI_API_KEY=ollama`                                                 |
| OpenRouter                                    | `https://openrouter.ai/api/v1`     | `OPENAI_API_KEY=sk-or-v1-...`                                           |
| Poe                                           | `https://api.poe.com/v1`           | `OPENAI_API_KEY=pk_...`                                                 |

Check the root [`.env` template](./.env) for the full list of optional variables you can override.

**Step 2 – Choose where MongoDB lives:** Either provision a managed cluster (for example MongoDB Atlas) or run a local container. Both approaches are described in [Database Options](#database-options). After you have the URI, drop it into `MONGODB_URL` (and, if desired, set `MONGODB_DB_NAME`).

**Step 3 – Install and launch the dev server:**

```bash
git clone https://github.com/huggingface/chat-ui
cd chat-ui
npm install
npm run dev -- --open
```

You now have Chat UI running against the Hugging Face router without needing to host MongoDB yourself.

## Database Options

Chat history, users, settings, files, and stats all live in MongoDB. You can point Chat UI at any MongoDB 6/7 deployment.

### MongoDB Atlas (managed)

1. Create a free cluster at [mongodb.com](https://www.mongodb.com/pricing).
2. Add your IP (or `0.0.0.0/0` for development) to the network access list.
3. Create a database user and copy the connection string.
4. Paste that string into `MONGODB_URL` in `.env.local`. Keep the default `MONGODB_DB_NAME=chat-ui` or change it per environment.

Atlas keeps MongoDB off your laptop, which is ideal for teams or cloud deployments.

### Local MongoDB (container)

If you prefer to run MongoDB locally:

```bash
docker run -d -p 27017:27017 --name mongo-chatui mongo:latest
```

Then set `MONGODB_URL=mongodb://localhost:27017` in `.env.local`. You can also supply `MONGO_STORAGE_PATH` if you want Chat UI’s fallback in-memory server to persist under a specific folder.

## Launch

After configuring your environment variables, start Chat UI with:

```bash
npm install
npm run dev
```

The dev server listens on `http://localhost:5173` by default. Use `npm run build` / `npm run preview` for production builds.

## Optional Docker Image

Prefer containerized setup? You can run everything in one container as long as you supply a MongoDB URI (local or hosted):

```bash
docker run \
  -p 3000:3000 \
  -e MONGODB_URL=mongodb://host.docker.internal:27017 \
  -e OPENAI_BASE_URL=https://router.huggingface.co/v1 \
  -e OPENAI_API_KEY=hf_*** \
  -v db:/data \
  ghcr.io/huggingface/chat-ui-db:latest
```

`host.docker.internal` lets the container reach a MongoDB instance on your host machine; swap it for your Atlas URI if you use the hosted option. All environment variables accepted in `.env.local` can be provided as `-e` flags.

## Deploying on Hugging Face Spaces

> [!IMPORTANT]
> Chat UI **does not automatically start Text Generation Inference (TGI)**. You must configure an OpenAI-compatible endpoint.

### Option 1: Use Hugging Face Inference API (Recommended)

This is the simplest approach and doesn't require running TGI yourself:

1. **Create a Space** with the Chat UI Docker image
2. **Set these environment variables** in your Space settings:
   ```env
   OPENAI_BASE_URL=https://router.huggingface.co/v1
   OPENAI_API_KEY=hf_your_token_here
   MONGODB_URL=mongodb://your-mongodb-uri
   ```
3. **Get your HF token** from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

The Hugging Face Inference API provides access to many models without needing to host them yourself.

### Option 2: Run TGI Separately

If you want to use a specific model with TGI:

1. **Create a TGI Space** (separate from Chat UI):
   - Use the `text-generation-inference` Docker image
   - Configure it with your desired model
   - Note the Space URL (e.g., `https://your-username-tgi.hf.space`)

2. **Create a Chat UI Space** and configure:
   ```env
   OPENAI_BASE_URL=https://your-username-tgi.hf.space/v1
   OPENAI_API_KEY=any-string-here
   MONGODB_URL=mongodb://your-mongodb-uri
   ```

### Option 3: Use Other OpenAI-Compatible Services

You can point Chat UI to any OpenAI-compatible endpoint:

- **Ollama**: `OPENAI_BASE_URL=http://your-ollama-host:11434/v1`
- **llama.cpp**: `OPENAI_BASE_URL=http://your-llama-cpp-host:8080/v1`
- **OpenRouter**: `OPENAI_BASE_URL=https://openrouter.ai/api/v1`
- **vLLM**: `OPENAI_BASE_URL=http://your-vllm-host:8000/v1`

### Troubleshooting

**Error: "Failed to connect to 127.0.0.1 port 8080"**

This error means something is trying to connect to TGI on port 8080, but TGI is not running. Solutions:

1. **Use Hugging Face Inference API** (Option 1 above) - easiest solution
2. **Run TGI separately** (Option 2 above) and point `OPENAI_BASE_URL` to it
3. **Check your Space configuration** - ensure you're not using old TGI-specific settings

**MongoDB Connection Issues**

If you see MongoDB connection errors:

1. Use a hosted MongoDB (MongoDB Atlas free tier works great)
2. Or use the `chat-ui-db` image which includes MongoDB: `ghcr.io/huggingface/chat-ui-db:latest`
3. Set `MONGODB_URL` to your MongoDB connection string

**Models Not Showing Up**

Chat UI fetches models from `${OPENAI_BASE_URL}/models`. Ensure:

1. Your endpoint supports the `/v1/models` endpoint
2. Your `OPENAI_API_KEY` is valid
3. The endpoint is accessible from your deployment

---

**For more deployment scenarios and detailed guides**, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Comprehensive deployment guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Quick solutions to common issues

## Extra parameters

### Theming

You can use a few environment variables to customize the look and feel of chat-ui. These are by default:

```env
PUBLIC_APP_NAME=ChatUI
PUBLIC_APP_ASSETS=chatui
PUBLIC_APP_DESCRIPTION="Making the community's best AI chat models available to everyone."
PUBLIC_APP_DATA_SHARING=
```

- `PUBLIC_APP_NAME` The name used as a title throughout the app.
- `PUBLIC_APP_ASSETS` Is used to find logos & favicons in `static/$PUBLIC_APP_ASSETS`, current options are `chatui` and `huggingchat`.
- `PUBLIC_APP_DATA_SHARING` Can be set to 1 to add a toggle in the user settings that lets your users opt-in to data sharing with models creator.

### Models

This build does not use the `MODELS` env var or GGUF discovery. Configure models via `OPENAI_BASE_URL` only; Chat UI will fetch `${OPENAI_BASE_URL}/models` and populate the list automatically. Authorization uses `OPENAI_API_KEY` (preferred). `HF_TOKEN` remains a legacy alias.

### LLM Router (Optional)

Chat UI can perform client-side routing [katanemo/Arch-Router-1.5B](https://huggingface.co/katanemo/Arch-Router-1.5B) as the routing model without running a separate router service. The UI exposes a virtual model alias called "Omni" (configurable) that, when selected, chooses the best route/model for each message.

- Provide a routes policy JSON via `LLM_ROUTER_ROUTES_PATH`. No sample file ships with this branch, so you must point the variable to a JSON array you create yourself (for example, commit one in your project like `config/routes.chat.json`). Each route entry needs `name`, `description`, `primary_model`, and optional `fallback_models`.
- Configure the Arch router selection endpoint with `LLM_ROUTER_ARCH_BASE_URL` (OpenAI-compatible `/chat/completions`) and `LLM_ROUTER_ARCH_MODEL` (e.g. `router/omni`). The Arch call reuses `OPENAI_API_KEY` for auth.
- Map `other` to a concrete route via `LLM_ROUTER_OTHER_ROUTE` (default: `casual_conversation`). If Arch selection fails, calls fall back to `LLM_ROUTER_FALLBACK_MODEL`.
- Selection timeout can be tuned via `LLM_ROUTER_ARCH_TIMEOUT_MS` (default 10000).
- Omni alias configuration: `PUBLIC_LLM_ROUTER_ALIAS_ID` (default `omni`), `PUBLIC_LLM_ROUTER_DISPLAY_NAME` (default `Omni`), and optional `PUBLIC_LLM_ROUTER_LOGO_URL`.

When you select Omni in the UI, Chat UI will:

- Call the Arch endpoint once (non-streaming) to pick the best route for the last turns.
- Emit RouterMetadata immediately (route and actual model used) so the UI can display it.
- Stream from the selected model via your configured `OPENAI_BASE_URL`. On errors, it tries route fallbacks.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
