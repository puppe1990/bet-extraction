import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./auth";

describe("auth helpers", () => {
	it("hashes and verifies passwords", () => {
		const password = "secret-123";
		const hash = hashPassword(password);

		expect(hash).toContain(":");
		expect(verifyPassword(password, hash)).toBe(true);
		expect(verifyPassword("wrong-pass", hash)).toBe(false);
	});
});
