import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
	const salt = randomUUID().replace(/-/g, "");
	const digest = scryptSync(password, salt, 64).toString("hex");
	return `${salt}:${digest}`;
}

export function verifyPassword(password: string, hash: string) {
	const [salt, original] = hash.split(":");
	const digest = scryptSync(password, salt, 64);
	return timingSafeEqual(digest, Buffer.from(original, "hex"));
}

export function nowIso() {
	return new Date().toISOString();
}
