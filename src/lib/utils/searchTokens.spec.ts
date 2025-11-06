import { describe, it, expect } from "vitest";
import { generateSearchTokens, generateQueryTokens } from "./searchTokens";

describe("searchTokens", () => {
	describe("generateSearchTokens", () => {
		it("should generate search tokens from a string", () => {
			const tokens = generateSearchTokens("Test Assistant");
			expect(tokens).toContain("test");
			expect(tokens).toContain("assistant");
			expect(tokens).toContain("testassistant");
		});

		it("should handle diacritics", () => {
			const tokens = generateSearchTokens("Café");
			expect(tokens).toContain("cafe");
		});

		it("should handle punctuation", () => {
			const tokens = generateSearchTokens("Test Assistant!");
			expect(tokens).toContain("test");
			expect(tokens).toContain("assistant");
			expect(tokens).toContain("testassistant");
		});
	});

	describe("generateQueryTokens", () => {
		it("should generate query tokens from a string", () => {
			const tokens = generateQueryTokens("test");
			expect(tokens).toHaveLength(1);
			expect(tokens[0]).toBeInstanceOf(RegExp);
		});

		it("should match partial strings (bug fix)", () => {
			const queryTokens = generateQueryTokens("est");
			const searchTokens = generateSearchTokens("Test Assistant");

			// The query token should match "test" even though it starts with "t"
			const matches = searchTokens.some((token) => queryTokens.some((regex) => regex.test(token)));

			expect(matches).toBe(true);
		});

		it("should match at the beginning of tokens", () => {
			const queryTokens = generateQueryTokens("tes");
			const searchTokens = generateSearchTokens("Test Assistant");

			const matches = searchTokens.some((token) => queryTokens.some((regex) => regex.test(token)));

			expect(matches).toBe(true);
		});

		it("should match in the middle of tokens", () => {
			const queryTokens = generateQueryTokens("sist");
			const searchTokens = generateSearchTokens("Test Assistant");

			const matches = searchTokens.some((token) => queryTokens.some((regex) => regex.test(token)));

			expect(matches).toBe(true);
		});

		it("should match at the end of tokens", () => {
			const queryTokens = generateQueryTokens("tant");
			const searchTokens = generateSearchTokens("Test Assistant");

			const matches = searchTokens.some((token) => queryTokens.some((regex) => regex.test(token)));

			expect(matches).toBe(true);
		});

		it("should handle multiple query words", () => {
			const queryTokens = generateQueryTokens("est ass");
			const searchTokens = generateSearchTokens("Test Assistant");

			// Both query tokens should match
			const allMatch = queryTokens.every((regex) =>
				searchTokens.some((token) => regex.test(token))
			);

			expect(allMatch).toBe(true);
		});

		it("should handle diacritics in queries", () => {
			const queryTokens = generateQueryTokens("café");
			const searchTokens = generateSearchTokens("Café Assistant");

			const matches = searchTokens.some((token) => queryTokens.some((regex) => regex.test(token)));

			expect(matches).toBe(true);
		});

		it("should escape special regex characters", () => {
			const queryTokens = generateQueryTokens("test.*");
			// Should not throw an error and should create a valid regex
			expect(queryTokens).toHaveLength(1);
			expect(() => queryTokens[0].test("test")).not.toThrow();
		});
	});
});
