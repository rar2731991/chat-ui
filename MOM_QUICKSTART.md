# MoM Router Quick Start Guide 🚀

## What is MoM?

**MoM (Mixture-of-Models)** is an intelligent routing system powered by vLLM Semantic Router that automatically selects the best model for your query based on semantic understanding, with built-in caching, security, and transparency.

## Quick Setup (5 minutes)

### Step 1: Install vLLM Semantic Router

```bash
# Clone the repository
git clone https://github.com/vllm-project/semantic-router.git
cd semantic-router

# Follow the installation instructions in the README
# Start the vLLM-SR server (typically on port 8801)
```

### Step 2: Configure HuggingChat

Add to your `.env` file:

```bash
# Minimum required configuration
LLM_ROUTER_MOM_BASE_URL=http://localhost:8801/v1
```

That's it! The MoM router is now available.

### Step 3: Use MoM Router

1. Start HuggingChat:
   ```bash
   npm run dev
   ```

2. In the UI, select the "MoM" model from the model selector

3. Send a query and watch the intelligent routing in action!

## Configuration Options

### Basic Configuration

```bash
# Required: vLLM-SR endpoint
LLM_ROUTER_MOM_BASE_URL=http://localhost:8801/v1

# Optional: Model name (default: "MoM")
LLM_ROUTER_MOM_MODEL=MoM

# Optional: Timeout in milliseconds (default: 10000)
LLM_ROUTER_MOM_TIMEOUT_MS=10000
```

### UI Customization

```bash
# Optional: Customize the display name
PUBLIC_LLM_ROUTER_MOM_DISPLAY_NAME=Semantic Router

# Optional: Add a custom logo
PUBLIC_LLM_ROUTER_MOM_LOGO_URL=https://example.com/logo.png

# Optional: Change the model alias (default: "mom")
PUBLIC_LLM_ROUTER_MOM_ALIAS_ID=semantic-router
```

## How It Works

When you send a query to the MoM router:

1. **Stage 1 - Prompt Guard** 🛡️
   - Checks for jailbreak attempts
   - Detects PII (Personally Identifiable Information)
   - Blocks malicious queries

2. **Stage 2 - Router Memory** 🔥
   - Checks semantic cache for similar queries
   - Returns cached response if available (fast!)
   - Updates cache for future queries

3. **Stage 3 - Smart Routing** 🧠
   - Classifies query domain (math, coding, general, etc.)
   - Selects optimal model based on semantic understanding
   - Optimizes prompt for better performance

## Example Queries

### Math Query
```
Query: "What is the derivative of x^2?"

CoT Output:
→ Stage 1: ✅ No Jailbreak → ✅ No PII → Continue
→ Stage 2: 🌊 MISS → Update Memory → Continue
→ Stage 3: 📂 math → 🧠 Reasoning On → 🥷 deepseek-v3 → Continue
```

### Coding Query
```
Query: "Write a Python function to sort a list"

CoT Output:
→ Stage 1: ✅ No Jailbreak → ✅ No PII → Continue
→ Stage 2: 🔥 HIT → Retrieve Memory → Fast Response
```

### General Query
```
Query: "What's the weather like today?"

CoT Output:
→ Stage 1: ✅ No Jailbreak → ✅ No PII → Continue
→ Stage 2: 🌊 MISS → Update Memory → Continue
→ Stage 3: 📂 general → 🧠 Reasoning Off → 🥷 llama-3 → Continue
```

## Benefits

### 🚀 Performance
- **Semantic caching** reduces latency by up to 90% for similar queries
- **Smart routing** ensures optimal model selection
- **Prompt optimization** improves response quality

### 🔒 Security
- **Jailbreak detection** protects against malicious prompts
- **PII detection** safeguards user privacy
- **Transparent security decisions** in CoT metadata

### 🎯 Accuracy
- **Domain-aware routing** matches queries to specialized models
- **Reasoning control** enables/disables reasoning based on query type
- **Multi-strategy routing** combines semantic, similarity, and keyword matching

### 💡 Transparency
- **Full CoT visibility** shows routing decisions
- **Cache hit/miss information** for performance insights
- **Model selection reasoning** for debugging

## Fallback Behavior

The MoM router has intelligent fallback:

```
MoM Router (vLLM-SR)
    ↓ (if fails)
Omni Router (Arch)
    ↓ (if fails)
Fallback Model
```

This ensures your application keeps working even if vLLM-SR is temporarily unavailable.

## Monitoring

### Check Logs

```bash
# Look for MoM router logs
grep "vllm-sr" server.log

# Example log output:
[vllm-sr] route selected { model: 'deepseek-v3', cacheStatus: 'MISS', domain: 'math' }
```

### CoT Metadata

The CoT information is available in the message metadata:

```typescript
message.routerMetadata = {
  route: "math",
  model: "deepseek-v3",
  routerType: "mom",
  cot: {
    stage1: { jailbreak: false, pii: false, result: "Continue" },
    stage2: { cacheStatus: "MISS", action: "Update Memory", result: "Continue" },
    stage3: { domain: "math", reasoning: true, model: "deepseek-v3", optimized: true, result: "Continue" }
  }
}
```

## Troubleshooting

### MoM Router Not Available

**Problem**: MoM model doesn't appear in the UI

**Solution**: 
1. Check `LLM_ROUTER_MOM_BASE_URL` is set in `.env`
2. Verify vLLM-SR is running and accessible
3. Restart HuggingChat

### Connection Errors

**Problem**: "vllm-sr router returned error"

**Solution**:
1. Verify vLLM-SR endpoint URL is correct
2. Check vLLM-SR is running: `curl http://localhost:8801/v1/models`
3. Check firewall/network settings
4. Increase timeout: `LLM_ROUTER_MOM_TIMEOUT_MS=20000`

### Fallback to Omni

**Problem**: MoM falls back to Omni router

**Solution**:
1. Check vLLM-SR logs for errors
2. Verify vLLM-SR configuration
3. This is expected behavior if vLLM-SR is unavailable (graceful degradation)

## Advanced Usage

### Custom Model Name

```bash
# Use a different model name at vLLM-SR endpoint
LLM_ROUTER_MOM_MODEL=custom-mom-model
```

### Multiple Routers

You can run both Omni and MoM routers simultaneously:

```bash
# Omni Router (Arch)
LLM_ROUTER_ARCH_BASE_URL=https://api.openai.com/v1
LLM_ROUTER_ARCH_MODEL=router/omni

# MoM Router (vLLM-SR)
LLM_ROUTER_MOM_BASE_URL=http://localhost:8801/v1
LLM_ROUTER_MOM_MODEL=MoM
```

Users can choose which router to use by selecting the corresponding model in the UI.

### A/B Testing

Compare Omni vs MoM performance:

1. Send the same query to both routers
2. Compare response times and quality
3. Check CoT metadata for insights
4. Analyze cache hit rates

## Next Steps

1. **Frontend Integration**: Display CoT information in the UI
2. **Dashboard**: Integrate with vLLM-SR dashboard for analytics
3. **Custom Policies**: Define custom routing rules
4. **Performance Tuning**: Optimize cache settings

## Resources

- **Full Documentation**: See `MOM_INTEGRATION.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **vLLM-SR Repository**: https://github.com/vllm-project/semantic-router
- **CoT Format**: https://raw.githubusercontent.com/vllm-project/semantic-router/refs/heads/main/tools/openwebui-pipe/vllm-sr-cot.md

## Support

Need help? Check:
1. vLLM Semantic Router documentation
2. HuggingChat logs (`server.log`)
3. GitHub Issue #1947 for discussion

Happy routing! 🚀
