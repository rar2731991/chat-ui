import { config } from "$lib/server/config";
import { logger } from "$lib/server/logger";
import type { EndpointMessage } from "../endpoints/endpoints";
import type { RouteSelection, CotMetadata } from "./types";
import { getApiToken } from "$lib/server/apiToken";

/**
 * Parse CoT (Chain-of-Thought) information from vLLM Semantic Router response header
 *
 * Expected format:
 * x-vllm-semantic-router-cot: 🔀 vLLM Semantic Router - Chain-Of-Thought 🔀
 *   → 🛡️ ***Stage 1 - Prompt Guard***: ✅ *No Jailbreak* → ✅ *No PII* → 💯 ***Continue***
 *   → 🔥 ***Stage 2 - Router Memory***: 🌊 *MISS* → 🧠 *Update Memory* → 💯 ***Continue***
 *   → 🧠 ***Stage 3 - Smart Routing***: 📂 *math* → 🧠 *Reasoning On* → 🥷 *deepseek-v3* → 🎯 *Prompt Optimized* → 💯 ***Continue***
 */
function parseCotHeader(cotHeader: string): CotMetadata {
	const metadata: CotMetadata = {
		rawCot: cotHeader,
	};

	try {
		// Parse Stage 1 - Prompt Guard
		const stage1Match = cotHeader.match(
			/Stage 1 - Prompt Guard.*?(?:✅|❌)\s*\*([^*]+)\*.*?(?:✅|❌)\s*\*([^*]+)\*.*?💯\s*\*\*\*([^*]+)\*\*\*/i
		);
		if (stage1Match) {
			const jailbreakText = stage1Match[1]?.trim() || "";
			const piiText = stage1Match[2]?.trim() || "";
			const resultText = stage1Match[3]?.trim() || "";

			metadata.stage1 = {
				jailbreak: !jailbreakText.toLowerCase().includes("no jailbreak"),
				pii: !piiText.toLowerCase().includes("no pii"),
				result: resultText.toLowerCase().includes("blocked") ? "BLOCKED" : "Continue",
			};
		}

		// Parse Stage 2 - Router Memory
		const stage2Match = cotHeader.match(
			/Stage 2 - Router Memory.*?🌊\s*\*([^*]+)\*.*?🧠\s*\*([^*]+)\*.*?💯\s*\*\*\*([^*]+)\*\*\*/i
		);
		if (stage2Match) {
			const cacheText = stage2Match[1]?.trim() || "";
			const actionText = stage2Match[2]?.trim() || "";
			const resultText = stage2Match[3]?.trim() || "";

			metadata.stage2 = {
				cacheStatus: cacheText.toUpperCase().includes("HIT") ? "HIT" : "MISS",
				action: actionText.includes("Retrieve") ? "Retrieve Memory" : "Update Memory",
				result: resultText.includes("Fast Response") ? "Fast Response" : "Continue",
			};
		}

		// Parse Stage 3 - Smart Routing
		const stage3Match = cotHeader.match(
			/Stage 3 - Smart Routing.*?📂\s*\*([^*]+)\*.*?🧠\s*\*([^*]+)\*.*?🥷\s*\*([^*]+)\*.*?🎯\s*\*([^*]+)\*.*?💯\s*\*\*\*([^*]+)\*\*\*/i
		);
		if (stage3Match) {
			const domainText = stage3Match[1]?.trim() || "";
			const reasoningText = stage3Match[2]?.trim() || "";
			const modelText = stage3Match[3]?.trim() || "";
			const optimizedText = stage3Match[4]?.trim() || "";

			metadata.stage3 = {
				domain: domainText,
				reasoning: reasoningText.toLowerCase().includes("on"),
				model: modelText,
				optimized: optimizedText.toLowerCase().includes("optimized"),
				result: "Continue",
			};
		}
	} catch (e) {
		logger.warn({ err: String(e) }, "[vllm-sr] failed to parse CoT header");
	}

	return metadata;
}

/**
 * Select route using vLLM Semantic Router (MoM)
 *
 * This function sends the conversation to vLLM-SR endpoint and extracts:
 * 1. The selected route/model from the response
 * 2. Chain-of-Thought (CoT) metadata from response headers
 */
export async function vllmSelectRoute(
	messages: EndpointMessage[],
	traceId: string | undefined,
	locals: App.Locals | undefined
): Promise<RouteSelection> {
	const baseURL = (config.LLM_ROUTER_MOM_BASE_URL || "").replace(/\/$/, "");
	const momModel = config.LLM_ROUTER_MOM_MODEL || "MoM";

	if (!baseURL) {
		logger.warn("[vllm-sr] LLM_ROUTER_MOM_BASE_URL not set; routing will fail over to fallback.");
		return { routeName: "mom_router_failure" };
	}

	// Convert messages to OpenAI format
	const openaiMessages = messages.map((m) => ({
		role: m.from,
		content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
	}));

	const headers: HeadersInit = {
		Authorization: `Bearer ${getApiToken(locals)}`,
		"Content-Type": "application/json",
	};

	const body = {
		model: momModel,
		messages: openaiMessages,
		temperature: 0.7,
		max_tokens: 1, // We only need the routing decision, not a full response
		stream: false,
	};

	const ctrl = new AbortController();
	const timeoutMs = Number(config.LLM_ROUTER_MOM_TIMEOUT_MS || 10000);
	const to = setTimeout(() => ctrl.abort(), timeoutMs);

	try {
		const resp = await fetch(`${baseURL}/chat/completions`, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
			signal: ctrl.signal,
		});

		clearTimeout(to);

		if (!resp.ok) {
			// Extract error message from response
			let errorMessage = `vllm-sr ${resp.status}`;
			try {
				const errorData = await resp.json();
				// Try to extract message from OpenAI-style error format
				if (errorData.error?.message) {
					errorMessage = errorData.error.message;
				} else if (errorData.message) {
					errorMessage = errorData.message;
				}
			} catch {
				// If JSON parsing fails, use status text
				errorMessage = resp.statusText || errorMessage;
			}

			logger.warn(
				{ status: resp.status, error: errorMessage, traceId },
				"[vllm-sr] router returned error"
			);

			return {
				routeName: "mom_router_failure",
				error: {
					message: errorMessage,
					statusCode: resp.status,
				},
			};
		}

		// Extract CoT from response headers
		const cotHeader = resp.headers.get("x-vllm-semantic-router-cot");
		const cotMetadata = cotHeader ? parseCotHeader(cotHeader) : undefined;

		// Parse response to get the selected model/route
		const data: { choices: { message: { content: string } }[]; model?: string } = await resp.json();

		// vLLM-SR returns the actual model used in the response
		// We can extract it from the response model field or from CoT stage3
		let selectedModel = data.model || cotMetadata?.stage3?.model || "casual_conversation";

		// If the model field contains a full path (e.g., "deepseek-v3"), extract just the model name
		if (selectedModel.includes("/")) {
			selectedModel = selectedModel.split("/").pop() || selectedModel;
		}

		logger.info(
			{
				model: selectedModel,
				cacheStatus: cotMetadata?.stage2?.cacheStatus,
				domain: cotMetadata?.stage3?.domain,
				traceId,
			},
			"[vllm-sr] route selected"
		);

		return {
			routeName: selectedModel,
			cotMetadata,
		};
	} catch (e) {
		clearTimeout(to);
		const err = e as Error;
		logger.warn({ err: String(e), traceId }, "[vllm-sr] router selection failed");

		// Return error with context but no status code (network/timeout errors)
		return {
			routeName: "mom_router_failure",
			error: {
				message: err.message || String(e),
			},
		};
	}
}
