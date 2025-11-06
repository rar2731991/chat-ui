import { ProxyAgent } from "undici";
import { config } from "./config";
import { logger } from "./logger";

/**
 * Proxy configuration for HTTP requests
 * Supports HTTP_PROXY, HTTPS_PROXY, and NO_PROXY environment variables
 */

let proxyAgent: ProxyAgent | undefined;
let noProxyHosts: string[] = [];

/**
 * Initialize proxy configuration from environment variables
 */
function initializeProxy() {
	const httpProxy = config.HTTP_PROXY || process.env.HTTP_PROXY || process.env.http_proxy;
	const httpsProxy = config.HTTPS_PROXY || process.env.HTTPS_PROXY || process.env.https_proxy;
	const noProxy = config.NO_PROXY || process.env.NO_PROXY || process.env.no_proxy;

	// Parse NO_PROXY list
	if (noProxy) {
		noProxyHosts = noProxy
			.split(",")
			.map((host) => host.trim().toLowerCase())
			.filter((host) => host.length > 0);
	}

	// Use HTTPS_PROXY if available, otherwise fall back to HTTP_PROXY
	const proxyUrl = httpsProxy || httpProxy;

	if (proxyUrl) {
		try {
			proxyAgent = new ProxyAgent(proxyUrl);
			logger.info({ proxyUrl, noProxyHosts }, "Proxy configuration initialized");
		} catch (error) {
			logger.error({ error, proxyUrl }, "Failed to initialize proxy agent");
		}
	}
}

/**
 * Check if a hostname should bypass the proxy based on NO_PROXY rules
 */
function shouldBypassProxy(hostname: string): boolean {
	if (!noProxyHosts.length) return false;

	const lowerHostname = hostname.toLowerCase();

	return noProxyHosts.some((pattern) => {
		// Exact match
		if (pattern === lowerHostname) return true;

		// Domain suffix match (e.g., .example.com matches api.example.com)
		if (pattern.startsWith(".") && lowerHostname.endsWith(pattern)) return true;

		// Domain suffix match without leading dot
		if (lowerHostname.endsWith(`.${pattern}`)) return true;

		// Wildcard match
		if (pattern === "*") return true;

		return false;
	});
}

/**
 * Get the appropriate dispatcher (proxy agent) for a given URL
 */
function getDispatcher(url: string | URL): ProxyAgent | undefined {
	if (!proxyAgent) return undefined;

	try {
		const urlObj = typeof url === "string" ? new URL(url) : url;
		if (shouldBypassProxy(urlObj.hostname)) {
			return undefined;
		}
		return proxyAgent;
	} catch (error) {
		logger.warn({ error, url }, "Failed to parse URL for proxy check");
		return undefined;
	}
}

/**
 * Proxy-aware fetch function that respects HTTP_PROXY, HTTPS_PROXY, and NO_PROXY
 */
export async function proxyFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	// Initialize proxy on first use
	if (proxyAgent === undefined && !initializeProxy.called) {
		initializeProxy();
		initializeProxy.called = true;
	}

	const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
	const dispatcher = getDispatcher(url);

	if (dispatcher) {
		// Use undici fetch with proxy agent
		const { fetch: undiciFetch } = await import("undici");
		return undiciFetch(input, {
			...init,
			dispatcher,
		});
	}

	// Use native fetch if no proxy or bypassed
	return fetch(input, init);
}

// Track if initialization has been called
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(initializeProxy as any).called = false;

/**
 * Get proxy configuration status for debugging
 */
export function getProxyStatus() {
	return {
		enabled: !!proxyAgent,
		noProxyHosts,
	};
}
