/**
 * Reasoning Summarization Service
 *
 * This service analyzes streaming reasoning content and generates
 * concise, step-by-step summaries for display to users.
 */

export interface ReasoningStep {
	summary: string;
	content: string;
	timestamp: number;
}

export class ReasoningSummarizer {
	private buffer: string = "";
	private steps: ReasoningStep[] = [];
	private lastStepTime: number = Date.now();
	private isInThinkBlock: boolean = false;
	private thinkBlockContent: string = "";

	// Configuration
	private readonly MIN_STEP_LENGTH = 100; // Minimum characters before considering a new step
	private readonly MIN_TIME_BETWEEN_STEPS = 2000; // Minimum ms between step updates
	private readonly STEP_INDICATORS = [
		"\n\n", // Paragraph breaks
		"First,",
		"Second,",
		"Third,",
		"Next,",
		"Then,",
		"Finally,",
		"Therefore,",
		"However,",
		"Let me",
		"I need to",
		"I should",
		"I will",
		"Step ",
	];

	/**
	 * Process a token from the stream
	 */
	processToken(token: string): { shouldEmitStep: boolean; step?: ReasoningStep } {
		// Check if we're entering a think block
		if (token.includes("<think>")) {
			this.isInThinkBlock = true;
			this.thinkBlockContent = "";
			this.buffer = "";
			return { shouldEmitStep: false };
		}

		// Check if we're exiting a think block
		if (token.includes("</think>")) {
			this.isInThinkBlock = false;
			const finalStep = this.createFinalStep();
			this.reset();
			return { shouldEmitStep: true, step: finalStep };
		}

		// Only process tokens inside think blocks
		if (!this.isInThinkBlock) {
			return { shouldEmitStep: false };
		}

		// Add token to buffer
		this.buffer += token;
		this.thinkBlockContent += token;

		// Check if we should emit a step
		const now = Date.now();
		const timeSinceLastStep = now - this.lastStepTime;

		if (
			this.buffer.length >= this.MIN_STEP_LENGTH &&
			timeSinceLastStep >= this.MIN_TIME_BETWEEN_STEPS &&
			this.shouldCreateStep()
		) {
			const step = this.createStep();
			this.lastStepTime = now;
			this.buffer = "";
			return { shouldEmitStep: true, step };
		}

		return { shouldEmitStep: false };
	}

	/**
	 * Check if current buffer indicates a new step should be created
	 */
	private shouldCreateStep(): boolean {
		const bufferLower = this.buffer.toLowerCase();

		// Check for step indicators
		for (const indicator of this.STEP_INDICATORS) {
			if (bufferLower.includes(indicator.toLowerCase())) {
				return true;
			}
		}

		// Check for question marks (often indicate reasoning transitions)
		if (this.buffer.includes("?") && this.buffer.length > this.MIN_STEP_LENGTH) {
			return true;
		}

		return false;
	}

	/**
	 * Create a step from the current buffer
	 */
	private createStep(): ReasoningStep {
		const summary = this.generateSummary(this.buffer);
		const step: ReasoningStep = {
			summary,
			content: this.buffer.trim(),
			timestamp: Date.now(),
		};
		this.steps.push(step);
		return step;
	}

	/**
	 * Create the final step when think block closes
	 */
	private createFinalStep(): ReasoningStep {
		const summary =
			this.buffer.length > 0 ? this.generateSummary(this.buffer) : "Reasoning complete";

		return {
			summary,
			content: this.buffer.trim(),
			timestamp: Date.now(),
		};
	}

	/**
	 * Generate a concise summary from content
	 */
	private generateSummary(content: string): string {
		const trimmed = content.trim();

		if (trimmed.length === 0) {
			return "Thinking...";
		}

		// Extract first sentence or first line
		const sentences = trimmed.split(/[.!?]\s+/);
		let summary = sentences[0];

		// If first sentence is too short, try to get more context
		if (summary.length < 30 && sentences.length > 1) {
			summary = sentences.slice(0, 2).join(". ");
		}

		// Truncate if too long
		const MAX_SUMMARY_LENGTH = 80;
		if (summary.length > MAX_SUMMARY_LENGTH) {
			summary = summary.substring(0, MAX_SUMMARY_LENGTH - 3) + "...";
		} else if (!summary.endsWith("...") && !summary.match(/[.!?]$/)) {
			summary += "...";
		}

		return summary;
	}

	/**
	 * Get current status summary
	 */
	getCurrentStatus(): string {
		if (!this.isInThinkBlock) {
			return "Ready";
		}

		if (this.buffer.length === 0 && this.steps.length === 0) {
			return "Starting to think...";
		}

		if (this.buffer.length > 0) {
			return this.generateSummary(this.buffer);
		}

		return "Thinking...";
	}

	/**
	 * Check if currently in a think block
	 */
	isThinking(): boolean {
		return this.isInThinkBlock;
	}

	/**
	 * Get all steps so far
	 */
	getSteps(): ReasoningStep[] {
		return this.steps;
	}

	/**
	 * Get the full think block content
	 */
	getThinkBlockContent(): string {
		return this.thinkBlockContent;
	}

	/**
	 * Reset the summarizer state
	 */
	reset(): void {
		this.buffer = "";
		this.steps = [];
		this.lastStepTime = Date.now();
		this.isInThinkBlock = false;
		this.thinkBlockContent = "";
	}
}
