/**
 * Agent Communication Protocol (ACP) endpoint implementation
 * Enables Chat UI to communicate with ACP-compliant agents
 */

import { z } from "zod";
import type { Endpoint } from "../endpoints";
import { convertToACPMessages } from "./acpMessageConverter";
import { processACPStream, processACPNonStream } from "./acpStreamHandler";
import type { ACPRequest } from "./types";

/**
 * Schema for ACP endpoint parameters
 */
export const endpointACPParametersSchema = z.object({
	weight: z.number().int().positive().default(1),
	model: z.any(),
	type: z.literal("acp"),
	baseURL: z.string().url(),
	apiKey: z.string().optional(),
	agentId: z.string().optional(), // Specific agent ID to call
	streamingSupported: z.boolean().default(true),
	timeout: z.number().int().positive().default(30000), // 30 second default timeout
	defaultHeaders: z.record(z.string()).optional(),
	metadata: z.record(z.any()).optional(), // Additional metadata to send with requests
});

/**
 * Create an ACP endpoint
 * @param input - ACP endpoint configuration
 * @returns Endpoint function
 */
export async function endpointAcp(
	input: z.input<typeof endpointACPParametersSchema>
): Promise<Endpoint> {
	const { baseURL, apiKey, agentId, model, streamingSupported, timeout, defaultHeaders, metadata } =
		endpointACPParametersSchema.parse(input);

	return async ({ messages, preprompt, generateSettings, conversationId, locals, abortSignal }) => {
		// Convert Chat UI messages to ACP format
		let acpMessages = convertToACPMessages(messages);

		// Handle preprompt by adding it as a system message at the beginning
		if (preprompt) {
			acpMessages = [
				{
					parts: [{ content: preprompt, type: "text" }],
					role: "system" as const,
				},
				...acpMessages,
			];
		}

		// Construct the request body
		const requestBody: ACPRequest = {
			messages: acpMessages,
			stream: streamingSupported,
			metadata: {
				...metadata,
				conversationId: conversationId?.toString(),
				// Include generation settings if provided
				...(generateSettings && {
					temperature: generateSettings.temperature,
					max_tokens: generateSettings.max_tokens,
					top_p: generateSettings.top_p,
					stop: generateSettings.stop,
				}),
			},
		};

		// Determine the endpoint URL
		// If agentId is specified, use it; otherwise use the model name/id
		const agentEndpoint = agentId || model.id || model.name;
		const url = `${baseURL.replace(/\/$/, "")}/${agentEndpoint}`;

		// Prepare headers
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...defaultHeaders,
		};

		// Add authentication if API key is provided
		if (apiKey) {
			headers["Authorization"] = `Bearer ${apiKey}`;
		}

		// Use user token if available and configured
		if (locals?.token) {
			headers["Authorization"] = `Bearer ${locals.token}`;
		}

		// Add conversation ID header
		if (conversationId) {
			headers["X-Conversation-ID"] = conversationId.toString();
		}

		// Create abort controller with timeout
		const timeoutController = new AbortController();
		const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

		// Combine abort signals
		const combinedSignal = abortSignal
			? AbortSignal.any([abortSignal, timeoutController.signal])
			: timeoutController.signal;

		try {
			// Make the request to the ACP agent
			const response = await fetch(url, {
				method: "POST",
				headers,
				body: JSON.stringify(requestBody),
				signal: combinedSignal,
			});

			// Clear timeout if request completes
			clearTimeout(timeoutId);

			// Check for errors
			if (!response.ok) {
				const errorText = await response.text().catch(() => "Unknown error");
				throw new Error(
					`ACP agent request failed: ${response.status} ${response.statusText} - ${errorText}`
				);
			}

			// Process the response based on streaming support
			if (streamingSupported && response.headers.get("content-type")?.includes("stream")) {
				return processACPStream(response);
			} else {
				return processACPNonStream(response);
			}
		} catch (error) {
			clearTimeout(timeoutId);

			// Handle abort errors
			if (error instanceof Error && error.name === "AbortError") {
				throw new Error("ACP agent request timed out or was aborted");
			}

			// Re-throw other errors
			throw error;
		}
	};
}
