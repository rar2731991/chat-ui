/**
 * Utilities for converting between Chat UI message format and ACP message format
 */

import type { EndpointMessage } from "../endpoints";
import type { ACPMessage, ACPMessagePart } from "./types";

/**
 * Convert Chat UI messages to ACP format
 * @param messages - Array of Chat UI messages
 * @returns Array of ACP messages
 */
export function convertToACPMessages(messages: EndpointMessage[]): ACPMessage[] {
	return messages.map((message) => {
		const parts: ACPMessagePart[] = [];

		// Handle text content
		if (message.content) {
			parts.push({
				content: message.content,
				type: "text",
			});
		}

		// Handle file attachments (images, documents, etc.)
		if (message.files && message.files.length > 0) {
			for (const file of message.files) {
				// For images, include as base64 data URL
				if (file.mime.startsWith("image/")) {
					const base64Data = `data:${file.mime};base64,${file.value}`;
					parts.push({
						content: base64Data,
						type: "image",
					});
				} else {
					// For other files, include as text content
					const textContent = Buffer.from(file.value, "base64").toString("utf-8");
					parts.push({
						content: `[File: ${file.name}]\n${textContent}`,
						type: "file",
					});
				}
			}
		}

		// If no parts were added, add an empty text part
		if (parts.length === 0) {
			parts.push({
				content: "",
				type: "text",
			});
		}

		return {
			parts,
			role:
				message.from === "assistant" ? "assistant" : message.from === "user" ? "user" : "system",
		};
	});
}

/**
 * Convert ACP messages to Chat UI format
 * @param acpMessages - Array of ACP messages
 * @returns Array of Chat UI messages
 */
export function convertFromACPMessages(acpMessages: ACPMessage[]): EndpointMessage[] {
	return acpMessages.map((acpMessage) => {
		// Combine all text parts into a single content string
		const textParts = acpMessage.parts
			.filter((part) => !part.type || part.type === "text" || part.type === "file")
			.map((part) => part.content);

		const content = textParts.join("\n\n");

		// Determine the role
		const from =
			acpMessage.role === "assistant"
				? "assistant"
				: acpMessage.role === "user"
					? "user"
					: "system";

		return {
			from: from as "assistant" | "user",
			content,
		};
	});
}

/**
 * Extract text content from ACP message parts
 * @param message - ACP message
 * @returns Combined text content
 */
export function extractTextContent(message: ACPMessage): string {
	return message.parts
		.filter((part) => !part.type || part.type === "text")
		.map((part) => part.content)
		.join("\n\n");
}

/**
 * Create a simple ACP message from text content
 * @param content - Text content
 * @param role - Message role
 * @returns ACP message
 */
export function createACPMessage(
	content: string,
	role: "user" | "assistant" | "system" = "assistant"
): ACPMessage {
	return {
		parts: [
			{
				content,
				type: "text",
			},
		],
		role,
	};
}
