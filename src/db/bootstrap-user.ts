import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "#/db/index";
import { bankrollAccounts, users } from "#/db/schema";
import { serverEnv } from "#/env.server";
import { hashPassword, verifyPassword } from "#/lib/auth";

async function main() {
	const bootstrapEmail = serverEnv.BOOTSTRAP_EMAIL;
	const bootstrapPassword = serverEnv.BOOTSTRAP_PASSWORD;

	if (!bootstrapEmail || !bootstrapPassword) {
		throw new Error(
			"Define BOOTSTRAP_EMAIL and BOOTSTRAP_PASSWORD before running pnpm bootstrap:user",
		);
	}

	const existing = await db.query.users.findFirst({
		where: eq(users.email, bootstrapEmail),
	});

	if (existing) {
		const isValid = verifyPassword(bootstrapPassword, existing.passwordHash);

		console.log(
			isValid
				? `User ${existing.email} already exists and the configured password matches.`
				: `User ${existing.email} already exists but the configured password does not match.`,
		);
		return;
	}

	const userId = randomUUID();
	await db.transaction(async (tx) => {
		await tx.insert(users).values({
			id: userId,
			email: bootstrapEmail,
			passwordHash: hashPassword(bootstrapPassword),
		});

		await tx.insert(bankrollAccounts).values({
			id: randomUUID(),
			userId,
			name: "Banca Principal",
			currency: "BRL",
			initialBalance: 0,
		});
	});

	console.log(`Created ${bootstrapEmail} with account Banca Principal.`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
