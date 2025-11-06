# HuggingChat MoM (Mixture-of-Models) Integration 🤗

## Overview

This document describes the integration of **vLLM Semantic Router** into HuggingChat as a new **MoM (Mixture-of-Models)** routing option. The integration enables advanced intelligent routing capabilities including semantic caching, PII detection, and chain-of-thought (CoT) transparency, while maintaining full backward compatibility with the existing Omni (Arch router) implementation.

## What is MoM?

**MoM (Mixture-of-Models)** is an intelligent routing philosophy that recognizes no single model is optimal for all tasks. By intelligently routing different types of queries to different specialized models, it achieves:

- **Better accuracy** through task-specific model selection
- **Cost optimization** by using smaller models for simple tasks
- **Performance improvement** through semantic understanding and caching
- **Transparency** via chain-of-thought visibility

## Architecture

### Components

1. **vllm-semantic-router.ts** - New MoM router implementation
2. **types.ts** - Extended with CoT metadata structures
3. **endpoint.ts** - Updated with router selection logic
4. **Message.ts** - Extended with CoT information in routerMetadata

### Router Selection Flow

```
User Request
    ↓
Router Detection (based on model id/name)
    ↓
    ├─→ MoM Router (vllmSelectRoute)
    │   ├─→ vLLM-SR Endpoint
    │   ├─→ Extract CoT from headers
    │   └─→ Return RouteSelection with CoT
    │
    └─→ Omni Router (archSelectRoute)
        ├─→ Arch Endpoint
        └─→ Return RouteSelection
    ↓
Fallback Logic (MoM → Omni → Fallback Model)
    ↓
Model Selection & Execution
    ↓
Stream Response with CoT Metadata
```

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
## MoM Router Configuration (vLLM Semantic Router)
# vLLM Semantic Router endpoint base URL for MoM routing
# Example: http://localhost:8801/v1 or your hosted vLLM-SR endpoint
LLM_ROUTER_MOM_BASE_URL=http://localhost:8801/v1

# Model name to use at the vLLM-SR endpoint (default: "MoM")
LLM_ROUTER_MOM_MODEL=MoM

# MoM selection timeout in milliseconds (default 10000)
LLM_ROUTER_MOM_TIMEOUT_MS=10000

# MoM Router UI overrides (client-visible)
# Public display name for the MoM router entry in the model list. Defaults to "MoM".
PUBLIC_LLM_ROUTER_MOM_DISPLAY_NAME=MoM
# Optional: public logo URL for the MoM router entry. If unset, the UI shows a Carbon icon.
PUBLIC_LLM_ROUTER_MOM_LOGO_URL=
# Public alias id used for the virtual MoM router model. Defaults to "mom".
PUBLIC_LLM_ROUTER_MOM_ALIAS_ID=mom
```

### Setting up vLLM Semantic Router

1. Install and run vLLM Semantic Router:
   ```bash
   # Follow instructions at: https://github.com/vllm-project/semantic-router
   ```

2. Configure the endpoint URL in your `.env` file

3. Ensure the vLLM-SR endpoint is accessible from your HuggingChat instance

## Chain-of-Thought (CoT) Metadata

The MoM router extracts and parses CoT information from the `x-vllm-semantic-router-cot` response header. This provides transparency into the routing decision process.

### CoT Structure

```typescript
interface CotMetadata {
  // Stage 1: Prompt Guard
  stage1?: {
    jailbreak: boolean;
    jailbreakConfidence?: number;
    pii: boolean;
    result: "Continue" | "BLOCKED";
  };
  
  // Stage 2: Router Memory (Semantic Caching)
  stage2?: {
    cacheStatus: "HIT" | "MISS";
    action: "Retrieve Memory" | "Update Memory";
    result: "Fast Response" | "Continue";
  };
  
  // Stage 3: Smart Routing
  stage3?: {
    domain: string;           // e.g., "math", "coding", "general"
    reasoning: boolean;       // Whether reasoning is enabled
    model: string;            // Selected model
    optimized: boolean;       // Whether prompt was optimized
    result: "Continue";
  };
  
  // Raw CoT string for debugging
  rawCot?: string;
}
```

### Example CoT Header

```
x-vllm-semantic-router-cot: 🔀 vLLM Semantic Router - Chain-Of-Thought 🔀
  → 🛡️ ***Stage 1 - Prompt Guard***: ✅ *No Jailbreak* → ✅ *No PII* → 💯 ***Continue***
  → 🔥 ***Stage 2 - Router Memory***: 🌊 *MISS* → 🧠 *Update Memory* → 💯 ***Continue***
  → 🧠 ***Stage 3 - Smart Routing***: 📂 *math* → 🧠 *Reasoning On* → 🥷 *deepseek-v3* → 🎯 *Prompt Optimized* → 💯 ***Continue***
```

## Message Metadata

Router metadata is stored in the `Message` type and includes:

```typescript
routerMetadata?: {
  route: string;              // Selected route name
  model: string;              // Actual model used
  provider?: InferenceProvider;
  cot?: CotMetadata;          // Chain-of-Thought metadata (MoM only)
  routerType?: "omni" | "mom"; // Which router was used
}
```

## Fallback Strategy

The implementation uses a three-tier fallback strategy:

1. **MoM Router** - Try vLLM Semantic Router first
2. **Omni Router** - If MoM fails and Arch is configured, fall back to Arch
3. **Fallback Model** - If both routers fail, use the configured fallback model

### Error Handling

- **Policy Errors (400, 401, 402, 403)**: Immediately propagated to the user
- **Transient Errors (5xx, timeouts, network)**: Trigger fallback to next tier

## Usage

### Selecting MoM Router

Users can select the MoM router by:

1. Choosing the "MoM" model from the model selector in the UI
2. Using the configured `PUBLIC_LLM_ROUTER_MOM_ALIAS_ID` (default: "mom")

### Programmatic Usage

```typescript
// The router is automatically selected based on the model configuration
// No code changes needed in the application logic
```

## Benefits

### 1. Semantic Caching
- Dramatically reduces latency for similar queries (not just exact matches)
- Cache hit/miss information available in CoT metadata

### 2. Security
- Built-in jailbreak detection
- PII (Personally Identifiable Information) protection
- Security decisions visible in CoT metadata

### 3. Intelligent Routing
- Domain-based routing (math, coding, general, etc.)
- Similarity-based routing for optimal model selection
- Keyword-based routing for explicit intent detection

### 4. Transparency
- Full chain-of-thought visibility
- Users can see why a particular model was selected
- Debugging information available in raw CoT string

### 5. Performance
- Optimized prompts for better model performance
- Semantic understanding reduces unnecessary model calls
- Efficient caching reduces response times

## Monitoring

### Logging

The implementation includes comprehensive logging:

```typescript
// MoM router selection
logger.info({
  model: selectedModel,
  cacheStatus: cotMetadata?.stage2?.cacheStatus,
  domain: cotMetadata?.stage3?.domain,
  traceId
}, "[vllm-sr] route selected");

// Fallback events
logger.warn({
  err: routeSelection.error.message
}, "[router] MoM router failed, falling back to Arch router");
```

### Dashboard Integration

vLLM Semantic Router provides a dashboard for monitoring:
- Cache hit rates
- Model selection patterns
- Performance metrics
- Security events

See: https://github.com/vllm-project/semantic-router/issues/473

## Testing

### Type Checking
```bash
npm run check
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

### Manual Testing

1. Start vLLM Semantic Router:
   ```bash
   # Follow vLLM-SR setup instructions
   ```

2. Configure HuggingChat:
   ```bash
   # Set LLM_ROUTER_MOM_BASE_URL in .env
   ```

3. Start HuggingChat:
   ```bash
   npm run dev
   ```

4. Select "MoM" model and send a query

5. Check logs for CoT information

## Backward Compatibility

The integration maintains full backward compatibility:

- ✅ Existing Omni router functionality unchanged
- ✅ No breaking changes to APIs or configurations
- ✅ Both routers can coexist
- ✅ Graceful degradation if vLLM-SR is unavailable

## Future Enhancements

1. **Frontend CoT Visualization**: Display CoT information in the UI
2. **A/B Testing Framework**: Compare Omni vs MoM performance
3. **Custom Routing Policies**: Allow users to define custom routing rules
4. **Advanced Caching Controls**: Fine-tune semantic caching behavior
5. **Multi-Router Support**: Support additional routing strategies

## References

- **vLLM Semantic Router**: https://github.com/vllm-project/semantic-router
- **CoT Format**: https://raw.githubusercontent.com/vllm-project/semantic-router/refs/heads/main/tools/openwebui-pipe/vllm-sr-cot.md
- **Dashboard Integration**: https://github.com/vllm-project/semantic-router/issues/473
- **GitHub Issue #1947**: Original proposal

## Support

For issues or questions:
1. Check the vLLM Semantic Router documentation
2. Review the logs for error messages
3. Verify environment configuration
4. Open an issue on the HuggingChat repository

## License

This integration follows the same license as HuggingChat and vLLM Semantic Router.
