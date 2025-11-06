/**
 * Type definitions for Agent Communication Protocol (ACP)
 * Based on ACP specification: https://github.com/NisalGunawardhana/Agent-Communication-Protocol
 */

/**
 * A single part of an ACP message containing content
 */
export interface ACPMessagePart {
	content: string;
	type?: string; // Optional type field for future extensibility
}

/**
 * An ACP message containing one or more parts
 */
export interface ACPMessage {
	parts: ACPMessagePart[];
	role?: "user" | "assistant" | "system"; // Optional role for compatibility
}

/**
 * Request body for ACP agent invocation
 */
export interface ACPRequest {
	messages: ACPMessage[];
	stream?: boolean; // Whether to stream the response
	metadata?: Record<string, unknown>; // Optional metadata
}

/**
 * Response from ACP agent (non-streaming)
 */
export interface ACPResponse {
	messages: ACPMessage[];
	metadata?: Record<string, unknown>;
}

/**
 * Streaming response chunk from ACP agent
 */
export interface ACPStreamChunk {
	type: "message" | "metadata" | "error" | "done";
	data?: {
		message?: ACPMessage;
		metadata?: Record<string, unknown>;
		error?: string;
	};
}

/**
 * ACP agent metadata for discovery
 */
export interface ACPAgentMetadata {
	id: string;
	name: string;
	description?: string;
	version?: string;
	capabilities?: string[];
	multimodal?: boolean;
}

/**
 * ACP agent list response
 */
export interface ACPAgentListResponse {
	agents: ACPAgentMetadata[];
}
