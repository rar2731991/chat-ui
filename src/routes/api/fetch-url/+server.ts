import { error } from "@sveltejs/kit";
import { logger } from "$lib/server/logger.js";
import { fetch } from "undici";
import { getMaxFileSize } from "$lib/server/config";

const FETCH_TIMEOUT = 30000; // 30 seconds

// Validate URL safety - HTTPS only
function isValidUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString);
		// Only allow HTTPS protocol
		if (url.protocol !== "https:") {
			return false;
		}
		// Prevent localhost/private IPs (basic check)
		const hostname = url.hostname.toLowerCase();
		if (
			hostname === "localhost" ||
			hostname.startsWith("127.") ||
			hostname.startsWith("192.168.") ||
			hostname.startsWith("172.16.") ||
			hostname === "[::1]" ||
			hostname === "0.0.0.0"
		) {
			return false;
		}
		return true;
	} catch {
		return false;
	}
}

export async function GET({ url }) {
	const targetUrl = url.searchParams.get("url");

	if (!targetUrl) {
		logger.warn("Missing 'url' parameter");
		throw error(400, "Missing 'url' parameter");
	}

	if (!isValidUrl(targetUrl)) {
		logger.warn({ targetUrl }, "Invalid or unsafe URL (only HTTPS is supported)");
		throw error(400, "Invalid or unsafe URL (only HTTPS is supported)");
	}

	try {
		// Fetch with timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

		const response = await fetch(targetUrl, {
			signal: controller.signal,
			headers: {
				"User-Agent": "HuggingChat-Attachment-Fetcher/1.0",
			},
		}).finally(() => clearTimeout(timeoutId));

		if (!response.ok) {
			logger.error({ targetUrl, response }, `Error fetching URL. Response not ok.`);
			throw error(response.status, `Failed to fetch: ${response.statusText}`);
		}

		// Check content length if available
		const maxFileSize = getMaxFileSize();
		const maxFileSizeMB = Math.floor(maxFileSize / (1024 * 1024));
		const contentLength = response.headers.get("content-length");
		if (contentLength && parseInt(contentLength) > maxFileSize) {
			throw error(413, `File too large (max ${maxFileSizeMB}MB)`);
		}

		// Stream the response back
		const contentType = response.headers.get("content-type") || "application/octet-stream";
		const contentDisposition = response.headers.get("content-disposition");

		const headers: HeadersInit = {
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=3600",
		};

		if (contentDisposition) {
			headers["Content-Disposition"] = contentDisposition;
		}

		// Get the body as array buffer to check size
		const arrayBuffer = await response.arrayBuffer();

		if (arrayBuffer.byteLength > maxFileSize) {
			throw error(413, `File too large (max ${maxFileSizeMB}MB)`);
		}

		return new Response(arrayBuffer, { headers });
	} catch (err) {
		if (err instanceof Error) {
			if (err.name === "AbortError") {
				logger.error(err, `Request timeout`);
				throw error(504, "Request timeout");
			}

			logger.error(err, `Error fetching URL`);
			throw error(500, `Failed to fetch URL: ${err.message}`);
		}
		logger.error(err, `Error fetching URL`);
		throw error(500, "Failed to fetch URL.");
	}
}
