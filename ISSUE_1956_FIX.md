# Fix for GitHub Issue #1956: Failed to load models from OpenAI base URL

## Problem
The application was failing to start when the OpenAI-compatible API endpoint returned a `429 Too Many Requests` status code. The error occurred because the code immediately threw an error without implementing any retry logic.

## Root Cause
The `buildModels()` function in `src/lib/server/models.ts` was making a direct `fetch()` call to the `/models` endpoint without any retry mechanism. When the API rate-limited the request (429 status), the application would crash during startup.

The Python OpenAI client works because it has built-in retry logic with exponential backoff, which the chat-ui application was missing.

## Solution
Added a `fetchWithRetry()` utility function that implements:

1. **Exponential Backoff**: Delays between retries increase exponentially (1s, 2s, 4s, 8s, 16s, 30s max)
2. **Retry on Transient Errors**: Automatically retries on:
   - 429 (Too Many Requests)
   - 500 (Internal Server Error)
   - 502 (Bad Gateway)
   - 503 (Service Unavailable)
   - 504 (Gateway Timeout)
3. **Network Error Handling**: Also retries on network failures
4. **Configurable Parameters**: 
   - Max retries: 5 (default)
   - Initial delay: 1000ms (default)
   - Max delay: 30000ms (default)
5. **Detailed Logging**: Logs each retry attempt with status, delay, and attempt number

## Changes Made
- **File**: `src/lib/server/models.ts`
- **Added**: `fetchWithRetry()` function with exponential backoff logic
- **Modified**: `buildModels()` function to use `fetchWithRetry()` instead of direct `fetch()`

## Testing
- ✅ TypeScript compilation successful
- ✅ Build completed without errors
- ✅ Type checking passed (0 errors, 0 warnings)
- ✅ Application successfully fetches models during build

## Benefits
1. **Resilience**: Application can now handle temporary rate limits and server errors
2. **Better UX**: Users won't see immediate failures due to transient issues
3. **Debugging**: Detailed logs help diagnose API issues
4. **Compatibility**: Matches behavior of official OpenAI client libraries

## Example Log Output
When a retry occurs, you'll see logs like:
```json
{
  "level": "warn",
  "attempt": 1,
  "maxRetries": 6,
  "status": 429,
  "statusText": "Too Many Requests",
  "delayMs": 1000,
  "url": "https://v98store.com/v1/models",
  "msg": "[models] Retrying fetch due to transient error"
}
```

## Configuration
The retry behavior uses sensible defaults but can be adjusted by modifying the `fetchWithRetry()` call in `buildModels()`:

```typescript
const response = await fetchWithRetry(
  `${baseURL}/models`,
  {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  },
  5,      // maxRetries (default: 5)
  1000,   // initialDelayMs (default: 1000)
  30000   // maxDelayMs (default: 30000)
);
```
