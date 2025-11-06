<script lang="ts">
	import MarkdownRenderer from "./MarkdownRenderer.svelte";
	import CarbonCaretDown from "~icons/carbon/caret-down";

	interface ReasoningStep {
		summary: string;
		timestamp: number;
	}

	interface Props {
		steps: ReasoningStep[];
		currentStatus?: string;
		isThinking?: boolean;
		fullContent?: string;
		loading?: boolean;
	}

	let {
		steps = [],
		currentStatus = "",
		isThinking = false,
		fullContent = "",
		loading = false,
	}: Props = $props();
	let isOpen = $state(false);

	// Auto-open when thinking
	$effect(() => {
		if (isThinking || loading) {
			isOpen = true;
		}
	});
</script>

<details
	bind:open={isOpen}
	class="group flex w-fit max-w-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 [&:has(+_.prose)]:mb-4"
>
	<summary
		class="grid min-w-72 cursor-pointer select-none grid-cols-[40px,1fr,24px] items-center gap-2.5 rounded-xl p-2 group-open:rounded-b-none hover:bg-gray-50 dark:hover:bg-gray-800/20"
	>
		<div
			class="relative grid aspect-square place-content-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
		>
			<div class="grid h-dvh place-items-center">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
					<path
						class="stroke-gray-600 dark:stroke-gray-400"
						style="stroke-width: 1.9; fill: none; stroke-linecap: round; stroke-linejoin: round;"
						d="M16 6v3.33M16 6c0-2.65 3.25-4.3 5.4-2.62 1.2.95 1.6 2.65.95 4.04a3.63 3.63 0 0 1 4.61.16 3.45 3.45 0 0 1 .46 4.37 5.32 5.32 0 0 1 1.87 4.75c-.22 1.66-1.39 3.6-3.07 4.14M16 6c0-2.65-3.25-4.3-5.4-2.62a3.37 3.37 0 0 0-.95 4.04 3.65 3.65 0 0 0-4.6.16 3.37 3.37 0 0 0-.49 4.27 5.57 5.57 0 0 0-1.85 4.85 5.3 5.3 0 0 0 3.07 4.15M16 9.33v17.34m0-17.34c0 2.18 1.82 4 4 4m6.22 7.5c.67 1.3.56 2.91-.27 4.11a4.05 4.05 0 0 1-4.62 1.5c0 1.53-1.05 2.9-2.66 2.9A2.7 2.7 0 0 1 16 26.66m10.22-5.83a4.05 4.05 0 0 0-3.55-2.17m-16.9 2.18a4.05 4.05 0 0 0 .28 4.1c1 1.44 2.92 2.09 4.59 1.5 0 1.52 1.12 2.88 2.7 2.88A2.7 2.7 0 0 0 16 26.67M5.78 20.85a4.04 4.04 0 0 1 3.55-2.18"
					/>

					{#if isThinking || loading}
						<path
							class="animate-pulse stroke-white"
							style="stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 50;"
							d="M16 6v3.33M16 6c0-2.65 3.25-4.3 5.4-2.62 1.2.95 1.6 2.65.95 4.04a3.63 3.63 0 0 1 4.61.16 3.45 3.45 0 0 1 .46 4.37 5.32 5.32 0 0 1 1.87 4.75c-.22 1.66-1.39 3.6-3.07 4.14M16 6c0-2.65-3.25-4.3-5.4-2.62a3.37 3.37 0 0 0-.95 4.04 3.65 3.65 0 0 0-4.6.16 3.37 3.37 0 0 0-.49 4.27 5.57 5.57 0 0 0-1.85 4.85 5.3 5.3 0 0 0 3.07 4.15M16 9.33v17.34m0-17.34c0 2.18 1.82 4 4 4m6.22 7.5c.67 1.3.56 2.91-.27 4.11a4.05 4.05 0 0 1-4.62 1.5c0 1.53-1.05 2.9-2.66 2.9A2.7 2.7 0 0 1 16 26.66m10.22-5.83a4.05 4.05 0 0 0-3.55-2.17m-16.9 2.18a4.05 4.05 0 0 0 .28 4.1c1 1.44 2.92 2.09 4.59 1.5 0 1.52 1.12 2.88 2.7 2.88A2.7 2.7 0 0 0 16 26.67M5.78 20.85a4.04 4.04 0 0 1 3.55-2.18"
						>
							<animate
								attributeName="stroke-dashoffset"
								values="0;500"
								dur="12s"
								repeatCount="indefinite"
							/>
						</path>
					{/if}
				</svg>
			</div>
		</div>
		<dl class="leading-4">
			<dd class="text-sm font-medium">Reasoning</dd>
			<dt
				class="flex items-center gap-1 truncate whitespace-nowrap text-[.82rem] text-gray-400"
				class:animate-pulse={isThinking || loading}
			>
				{#if isThinking || loading}
					{currentStatus || "Thinking..."}
				{:else if steps.length > 0}
					{steps.length} step{steps.length !== 1 ? "s" : ""} completed
				{:else}
					View reasoning
				{/if}
			</dt>
		</dl>
		<CarbonCaretDown
			class="transition-rotate size-5 -rotate-90 text-gray-400 group-open:rotate-0"
		/>
	</summary>

	<div class="flex flex-col gap-3 border-t border-gray-200 p-3 dark:border-gray-800">
		{#if steps.length > 0}
			<div class="space-y-3">
				{#each steps as step, index (step.timestamp)}
					<div
						class="animate-fadeIn flex gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30"
						style="animation-delay: {index * 0.1}s"
					>
						<div
							class="flex size-6 flex-none items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
						>
							{index + 1}
						</div>
						<div class="flex-1">
							<p class="text-sm text-gray-700 dark:text-gray-300">
								{step.summary}
							</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		{#if isThinking || loading}
			<div
				class="flex gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800/50 dark:bg-blue-900/20"
			>
				<div
					class="flex size-6 flex-none items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
				>
					<div class="size-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400"></div>
				</div>
				<div class="flex-1">
					<p class="animate-pulse text-sm text-gray-600 dark:text-gray-400">
						{currentStatus || "Processing..."}
					</p>
				</div>
			</div>
		{/if}

		{#if fullContent && fullContent.trim().length > 0}
			<details class="group/full mt-2">
				<summary
					class="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
				>
					<span class="inline-flex items-center gap-1">
						<CarbonCaretDown
							class="inline-block size-3 -rotate-90 transition-transform group-open/full:rotate-0"
						/>
						View full reasoning content
					</span>
				</summary>
				<div
					class="prose prose-sm mt-3 !max-w-none space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600 dark:prose-invert dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
				>
					<MarkdownRenderer content={fullContent} {loading} />
				</div>
			</details>
		{/if}
	</div>
</details>

<style>
	details summary::-webkit-details-marker {
		display: none;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out forwards;
		opacity: 0;
	}
</style>
