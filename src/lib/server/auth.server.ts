import { randomUUID } from "node:crypto";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "#/db/index";
import { bankrollAccounts, sessions, users } from "#/db/schema";
import { hashPassword, nowIso, verifyPassword } from "#/lib/auth";

const SESSION_COOKIE = "bankrollkit_session";
const SESSION_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const ADMIN_EMAILS = new Set(["matheus.puppe@gmail.com"]);

export async function getUserByEmail(email: string) {
	return db.query.users.findFirst({
		where: eq(users.email, email.toLowerCase().trim()),
	});
}

export async function ensureBootstrapUser(email: string, password: string) {
	const existing = await getUserByEmail(email);
	if (existing) return existing;

	const userId = randomUUID();
	await db.transaction(async (tx) => {
		await tx.insert(users).values({
			id: userId,
			email: email.toLowerCase().trim(),
			passwordHash: hashPassword(password),
			createdAt: nowIso(),
		});
		await tx.insert(bankrollAccounts).values({
			id: randomUUID(),
			userId,
			name: "Banca Principal",
			currency: "BRL",
			initialBalance: 0,
			createdAt: nowIso(),
		});
	});

	const created = await getUserByEmail(email);
	if (!created) {
		throw new Error("Failed to create bootstrap user.");
	}

	return created;
}

async function createSessionForUser(user: { id: string; email: string }) {
	const token = randomUUID();
	const expiresAt = new Date(Date.now() + SESSION_AGE_MS).toISOString();

	await db.insert(sessions).values({
		id: randomUUID(),
		token,
		userId: user.id,
		expiresAt,
		createdAt: nowIso(),
	});

	setCookie(SESSION_COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: SESSION_AGE_MS / 1000,
	});

	return { id: user.id, email: user.email, expiresAt };
}

export async function loginWithPassword(email: string, password: string) {
	const user = await getUserByEmail(email);
	if (!user || !verifyPassword(password, user.passwordHash)) {
		return null;
	}

	return createSessionForUser(user);
}

export async function signupWithPassword(email: string, password: string) {
	const normalizedEmail = email.toLowerCase().trim();
	const existing = await getUserByEmail(normalizedEmail);

	if (existing) {
		throw new Error("Ja existe uma conta com esse email.");
	}

	const user = {
		id: randomUUID(),
		email: normalizedEmail,
		passwordHash: hashPassword(password),
		createdAt: nowIso(),
	};

	await db.transaction(async (tx) => {
		await tx.insert(users).values(user);
		await tx.insert(bankrollAccounts).values({
			id: randomUUID(),
			userId: user.id,
			name: "Banca Principal",
			currency: "BRL",
			initialBalance: 0,
			createdAt: nowIso(),
		});
	});

	return createSessionForUser(user);
}

export async function logoutCurrentSession() {
	const token = getCookie(SESSION_COOKIE);
	if (token) {
		await db.delete(sessions).where(eq(sessions.token, token));
	}
	deleteCookie(SESSION_COOKIE, { path: "/" });
}

export async function getCurrentSession() {
	const token = getCookie(SESSION_COOKIE);
	if (!token) return null;

	const session = await db.query.sessions.findFirst({
		where: eq(sessions.token, token),
		with: {
			user: true,
		},
	});

	if (!session) {
		deleteCookie(SESSION_COOKIE, { path: "/" });
		return null;
	}

	if (new Date(session.expiresAt).getTime() <= Date.now()) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		deleteCookie(SESSION_COOKIE, { path: "/" });
		return null;
	}

	return {
		sessionId: session.id,
		expiresAt: session.expiresAt,
		user: {
			id: session.user.id,
			email: session.user.email,
		},
	};
}

export async function requireCurrentSession() {
	const session = await getCurrentSession();
	if (!session) {
		throw new Error("UNAUTHORIZED");
	}
	return session;
}

export async function requireAdminSession() {
	const session = await requireCurrentSession();
	if (!ADMIN_EMAILS.has(session.user.email.toLowerCase().trim())) {
		throw new Error("FORBIDDEN");
	}
	return session;
}

export async function changePasswordForCurrentUser(
	userId: string,
	currentPassword: string,
	nextPassword: string,
) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
		throw new Error("Senha atual invalida.");
	}

	await db
		.update(users)
		.set({ passwordHash: hashPassword(nextPassword) })
		.where(eq(users.id, userId));
}
