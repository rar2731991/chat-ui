export interface Route {
	name: string;
	description: string;
	primary_model: string;
	fallback_models?: string[];
}

export interface RouteConfig {
	name: string;
	description: string;
}

export interface CotMetadata {
	// Stage 1: Prompt Guard
	stage1?: {
		jailbreak: boolean;
		jailbreakConfidence?: number;
		pii: boolean;
		result: "Continue" | "BLOCKED";
	};
	// Stage 2: Router Memory
	stage2?: {
		cacheStatus: "HIT" | "MISS";
		action: "Retrieve Memory" | "Update Memory";
		result: "Fast Response" | "Continue";
	};
	// Stage 3: Smart Routing
	stage3?: {
		domain: string;
		reasoning: boolean;
		model: string;
		optimized: boolean;
		result: "Continue";
	};
	// Raw CoT string for debugging
	rawCot?: string;
}

export interface RouteSelection {
	routeName: string;
	error?: {
		message: string;
		statusCode?: number;
	};
	cotMetadata?: CotMetadata;
}

export const ROUTER_FAILURE = "arch_router_failure";
