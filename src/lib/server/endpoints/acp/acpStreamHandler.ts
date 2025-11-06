/**
 * Handler for ACP streaming responses
 */

import type { TextGenerationStreamOutputSimplified } from "../endpoints";
import type { ACPStreamChunk, ACPResponse } from "./types";
import { extractTextContent } from "./acpMessageConverter";

/**
 * Process ACP streaming response and convert to Chat UI format
 * @param response - Fetch response from ACP agent
 * @returns Async generator of text generation stream outputs
 */
export async function* processACPStream(
	response: Response
): AsyncGenerator<TextGenerationStreamOutputSimplified, void, void> {
	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error("Response body is not readable");
	}

	const decoder = new TextDecoder();
	let buffer = "";
	let generatedText = "";

	try {
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			// Decode the chunk and add to buffer
			buffer += decoder.decode(value, { stream: true });

			// Process complete lines (ACP typically uses newline-delimited JSON)
			const lines = buffer.split("\n");
			buffer = lines.pop() || ""; // Keep incomplete line in buffer

			for (const line of lines) {
				const trimmedLine = line.trim();
				if (!trimmedLine) continue;

				try {
					// Try to parse as JSON
					let chunk: ACPStreamChunk;

					// Handle different streaming formats
					if (trimmedLine.startsWith("data: ")) {
						// Server-Sent Events format
						const jsonStr = trimmedLine.substring(6);
						if (jsonStr === "[DONE]") {
							break;
						}
						chunk = JSON.parse(jsonStr);
					} else {
						// Plain JSON format
						chunk = JSON.parse(trimmedLine);
					}

					// Process the chunk based on type
					if (chunk.type === "message" && chunk.data?.message) {
						const message = chunk.data.message;
						const text = extractTextContent(message);

						// Calculate the new token (delta)
						const newText = text.substring(generatedText.length);
						generatedText = text;

						if (newText) {
							yield {
								token: {
									id: 0,
									text: newText,
									logprob: 0,
									special: false,
								},
								generated_text: null,
								details: null,
							};
						}
					} else if (chunk.type === "done") {
						// Final chunk
						yield {
							token: {
								id: 0,
								text: "",
								logprob: 0,
								special: true,
							},
							generated_text: generatedText,
							details: null,
						};
						break;
					} else if (chunk.type === "error") {
						throw new Error(chunk.data?.error || "Unknown ACP error");
					}
				} catch (parseError) {
					// If JSON parsing fails, treat the line as plain text
					if (trimmedLine) {
						const newText = trimmedLine;
						generatedText += newText + "\n";

						yield {
							token: {
								id: 0,
								text: newText + "\n",
								logprob: 0,
								special: false,
							},
							generated_text: null,
							details: null,
						};
					}
				}
			}
		}

		// If we have generated text but no final "done" signal, yield it
		if (generatedText && !generatedText.endsWith("\n")) {
			yield {
				token: {
					id: 0,
					text: "",
					logprob: 0,
					special: true,
				},
				generated_text: generatedText,
				details: null,
			};
		}
	} finally {
		reader.releaseLock();
	}
}

/**
 * Process non-streaming ACP response
 * @param response - Fetch response from ACP agent
 * @returns Async generator of text generation stream outputs
 */
export async function* processACPNonStream(
	response: Response
): AsyncGenerator<TextGenerationStreamOutputSimplified, void, void> {
	const data: ACPResponse = await response.json();

	if (!data.messages || data.messages.length === 0) {
		throw new Error("No messages in ACP response");
	}

	// Get the last message (typically the assistant's response)
	const lastMessage = data.messages[data.messages.length - 1];
	const text = extractTextContent(lastMessage);

	// Yield the complete text as a single token
	yield {
		token: {
			id: 0,
			text,
			logprob: 0,
			special: false,
		},
		generated_text: null,
		details: null,
	};

	// Yield final token
	yield {
		token: {
			id: 0,
			text: "",
			logprob: 0,
			special: true,
		},
		generated_text: text,
		details: null,
	};
}
