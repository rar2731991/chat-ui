# Fix for Issue #1771: Client Disconnects Before Response is Received

## Problem
When LLM responses take several minutes to complete, the client disconnects at approximately 1 minute. This happens because reverse proxies (like nginx) buffer responses by default and may timeout connections that don't send data frequently enough.

## Solution
Added HTTP headers to the streaming response in `/src/routes/conversation/[id]/+server.ts` to prevent buffering and ensure the connection stays open for long-running requests.

### Headers Added:
1. **`Cache-Control: no-cache, no-transform`** - Prevents caching and transformation by proxies
2. **`X-Accel-Buffering: no`** - Disables buffering in nginx (most common reverse proxy)
3. **`Connection: keep-alive`** - Explicitly keeps the connection open

## Changes Made
File: `src/routes/conversation/[id]/+server.ts`

```typescript
return new Response(stream, {
  headers: {
    "Content-Type": "application/jsonl",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
    "Connection": "keep-alive",
  },
});
```

## How to Test

### 1. Manual Testing with curl
```bash
# Start the server
npm run dev

# In another terminal, send a request that will take a long time
curl -X POST 'http://localhost:5173/conversation/YOUR_CONVERSATION_ID' \
  -H 'Content-Type: multipart/form-data' \
  --data-binary $'------WebKitFormBoundary\r\nContent-Disposition: form-data; name="data"\r\n\r\n{"inputs":"Ask a complex question that requires long reasoning","is_retry":false}\r\n------WebKitFormBoundary--\r\n' \
  -v

# Check the response headers - you should see:
# < Cache-Control: no-cache, no-transform
# < X-Accel-Buffering: no
# < Connection: keep-alive
```

### 2. Browser Testing
1. Start the application: `npm run dev`
2. Open the browser and navigate to the chat interface
3. Ask a question that requires long reasoning (e.g., "Solve this complex riddle: A man and a goat are on one side of a river with a boat. How do they get across? Think step by step.")
4. Open Browser DevTools → Network tab
5. Find the POST request to `/conversation/[id]`
6. Check the Response Headers - you should see the new headers
7. Verify the connection stays open for the entire duration of the response (>1 minute)

### 3. Production Testing
If you're using nginx as a reverse proxy, ensure your nginx configuration doesn't override these headers:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    
    # Important: Don't override the X-Accel-Buffering header
    # proxy_buffering off;  # Alternative if X-Accel-Buffering doesn't work
}
```

## Expected Behavior After Fix
- Long-running LLM responses (>1 minute) should complete without client disconnection
- Keep-alive messages continue to be sent every 100ms
- The connection remains open until the LLM completes its response
- No premature termination of responses during the thinking/reasoning phase

## Additional Notes
- The existing `keepAlive` generator in `/src/lib/server/textGeneration/index.ts` already sends keep-alive messages every 100ms
- These headers ensure those keep-alive messages reach the client without being buffered
- If you're still experiencing timeouts, check your reverse proxy configuration (nginx, Apache, load balancer, etc.)
