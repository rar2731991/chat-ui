# Agent Communication Protocol (ACP) Configuration Example

This document provides examples of how to configure Chat UI to work with ACP-compliant agents.

## Basic Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# Enable ACP support
ACP_ENABLED=true

# Base URL for your ACP agent server
ACP_BASE_URL=http://localhost:8000

# Optional: API key for authentication
ACP_API_KEY=your_api_key_here
```

## Model Configuration with ACP

### Option 1: Using MODELS Environment Variable

You can configure ACP agents using the `MODELS` environment variable:

```json
[
	{
		"id": "my-acp-agent",
		"name": "My ACP Agent",
		"displayName": "Custom Agent",
		"description": "An ACP-compliant agent for specialized tasks",
		"endpoints": [
			{
				"type": "acp",
				"baseURL": "http://localhost:8000",
				"agentId": "my-agent",
				"streamingSupported": true,
				"timeout": 30000
			}
		],
		"parameters": {
			"temperature": 0.7,
			"max_tokens": 2048
		}
	}
]
```

### Option 2: Mixed OpenAI and ACP Models

You can use both OpenAI-compatible and ACP agents together:

```json
[
	{
		"id": "gpt-4",
		"name": "GPT-4",
		"displayName": "GPT-4",
		"endpoints": [
			{
				"type": "openai",
				"baseURL": "https://api.openai.com/v1"
			}
		]
	},
	{
		"id": "custom-rag-agent",
		"name": "RAG Agent",
		"displayName": "Document Q&A Agent",
		"description": "Specialized agent for document question answering",
		"endpoints": [
			{
				"type": "acp",
				"baseURL": "http://localhost:8000",
				"agentId": "rag-agent",
				"streamingSupported": true
			}
		]
	}
]
```

## ACP Endpoint Parameters

| Parameter            | Type    | Required | Default  | Description                          |
| -------------------- | ------- | -------- | -------- | ------------------------------------ |
| `type`               | string  | Yes      | -        | Must be `"acp"`                      |
| `baseURL`            | string  | Yes      | -        | Base URL of the ACP agent server     |
| `agentId`            | string  | No       | model.id | Specific agent ID to call            |
| `apiKey`             | string  | No       | -        | API key for authentication           |
| `streamingSupported` | boolean | No       | `true`   | Whether the agent supports streaming |
| `timeout`            | number  | No       | `30000`  | Request timeout in milliseconds      |
| `defaultHeaders`     | object  | No       | `{}`     | Additional headers to send           |
| `metadata`           | object  | No       | `{}`     | Additional metadata to include       |

## Example ACP Agent Server

Here's a minimal example of an ACP-compliant agent using Python:

```python
from acp_sdk.server import Server
from acp_sdk.models import Message, MessagePart
from typing import AsyncGenerator

server = Server()

@server.agent()
async def my_agent(messages: list[Message]) -> AsyncGenerator:
    """A simple echo agent"""

    # Extract the last user message
    last_message = messages[-1]
    user_text = " ".join(part.content for part in last_message.parts)

    # Create response
    response = Message(
        parts=[MessagePart(content=f"Echo: {user_text}")]
    )

    # Yield response
    yield {"messages": [response]}

# Run the server
server.run(host="0.0.0.0", port=8000)
```

## Testing Your Configuration

1. Start your ACP agent server
2. Configure Chat UI with the ACP endpoint
3. Start Chat UI: `npm run dev`
4. Select your ACP agent from the model dropdown
5. Send a message to test the connection

## Troubleshooting

### Connection Errors

If you see connection errors:

- Verify the ACP agent server is running
- Check the `baseURL` is correct
- Ensure there are no firewall issues

### Authentication Errors

If you see 401/403 errors:

- Verify the `apiKey` is correct
- Check if the agent requires authentication
- Ensure the API key has proper permissions

### Timeout Errors

If requests timeout:

- Increase the `timeout` parameter
- Check if the agent is responding slowly
- Verify network connectivity

## Learn More

- [ACP Specification](https://github.com/NisalGunawardhana/Agent-Communication-Protocol)
- [ACP SDK Documentation](https://github.com/NisalGunawardhana/ACP-Starter)
- [DeepLearning.AI ACP Course](https://www.deeplearning.ai/short-courses/acp-agent-communication-protocol/)
