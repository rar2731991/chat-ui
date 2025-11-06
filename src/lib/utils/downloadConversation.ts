import type { Message } from "$lib/types/Message";

export type DownloadFormat = "markdown" | "json";

interface ConversationData {
	title: string;
	messages: Message[];
	model?: string;
}

/**
 * Formats a conversation as Markdown
 */
function formatAsMarkdown(data: ConversationData): string {
	const { title, messages, model } = data;
	let markdown = `# ${title}\n\n`;

	if (model) {
		markdown += `**Model:** ${model}\n\n`;
	}

	markdown += `**Date:** ${new Date().toLocaleString()}\n\n`;
	markdown += `---\n\n`;

	// Filter out system messages and format user/assistant messages
	const visibleMessages = messages.filter((msg) => msg.from !== "system");

	for (const message of visibleMessages) {
		const role = message.from === "user" ? "**You**" : "**Assistant**";
		markdown += `${role}:\n\n`;

		// Remove <think> blocks from content for cleaner export
		const content = message.content.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();
		markdown += `${content}\n\n`;

		// Add file references if present
		if (message.files && message.files.length > 0) {
			markdown += `*Attachments:*\n`;
			for (const file of message.files) {
				markdown += `- ${file.name} (${file.mime})\n`;
			}
			markdown += `\n`;
		}

		// Add router metadata if present
		if (message.routerMetadata) {
			markdown += `*Route: ${message.routerMetadata.route}, Model: ${message.routerMetadata.model}*\n\n`;
		}

		markdown += `---\n\n`;
	}

	return markdown;
}

/**
 * Formats a conversation as JSON
 */
function formatAsJSON(data: ConversationData): string {
	return JSON.stringify(
		{
			title: data.title,
			model: data.model,
			exportDate: new Date().toISOString(),
			messages: data.messages.map((msg) => ({
				id: msg.id,
				from: msg.from,
				content: msg.content,
				files: msg.files,
				routerMetadata: msg.routerMetadata,
				createdAt: msg.createdAt,
				updatedAt: msg.updatedAt,
			})),
		},
		null,
		2
	);
}

/**
 * Triggers a download of the conversation in the specified format
 */
export function downloadConversation(
	data: ConversationData,
	format: DownloadFormat = "markdown"
): void {
	const { title } = data;

	// Format the content based on the selected format
	const content = format === "markdown" ? formatAsMarkdown(data) : formatAsJSON(data);

	// Create a blob with the content
	const blob = new Blob([content], {
		type: format === "markdown" ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8",
	});

	// Create a download link and trigger it
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;

	// Generate filename with sanitized title and timestamp
	const sanitizedTitle = title
		.replace(/[^a-z0-9]/gi, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase()
		.substring(0, 50);
	const timestamp = new Date().toISOString().split("T")[0];
	const extension = format === "markdown" ? "md" : "json";
	link.download = `conversation-${sanitizedTitle}-${timestamp}.${extension}`;

	// Trigger download
	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
