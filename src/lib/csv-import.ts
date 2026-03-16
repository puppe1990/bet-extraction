import type { BetStatus } from "#/lib/domain";
import { parseTagInput } from "#/lib/bets";
import { parseCsv } from "#/lib/csv";

type BetCsvImportItem = {
	sport: string;
	market: string;
	eventName: string;
	selection: string;
	bookmaker: string;
	oddsDecimal: number;
	stakeAmount: number;
	placedAt: string;
	note?: string;
	tags?: string[];
	status: BetStatus;
	settledAt?: string;
	grossReturnAmount?: number;
};

type BankrollCsvImportItem = {
	type: "deposit" | "withdraw" | "adjustment";
	amount: number;
	note?: string;
	occurredAt: string;
};

export function parseBetsCsvImport(text: string) {
	const records = parseRecords(text);

	return records.map((record, index) => {
		const lineNumber = index + 2;
		const status = normalizeBetStatus(
			getRequiredValue(record, ["status"], lineNumber),
			lineNumber,
		);
		const stakeAmount = parseNumber(
			getRequiredValue(
				record,
				["stake_brl", "stake", "stake_amount", "stake_amount_brl"],
				lineNumber,
			),
			"stake",
			lineNumber,
		);
		const grossReturnAmountValue = getOptionalValue(record, [
			"gross_return_brl",
			"gross_return",
			"return_brl",
			"return",
		]);
		const profitAmountValue = getOptionalValue(record, ["profit_brl", "profit"]);

		return {
			eventName: getRequiredValue(
				record,
				["event_name", "event", "event_name"],
				lineNumber,
			),
			status,
			sport: getRequiredValue(record, ["sport"], lineNumber),
			market: getRequiredValue(record, ["market"], lineNumber),
			selection: getRequiredValue(record, ["selection"], lineNumber),
			bookmaker: getRequiredValue(record, ["bookmaker", "book"], lineNumber),
			oddsDecimal: parseNumber(
				getRequiredValue(record, ["odds_decimal", "odds"], lineNumber),
				"odds_decimal",
				lineNumber,
			),
			stakeAmount,
			placedAt: parseIsoDate(
				getRequiredValue(record, ["placed_at", "placedat", "date"], lineNumber),
				"placed_at",
				lineNumber,
			),
			settledAt: getOptionalValue(record, ["settled_at", "settledat"])
				? parseIsoDate(
						getOptionalValue(record, ["settled_at", "settledat"]) ?? "",
						"settled_at",
						lineNumber,
					)
				: undefined,
			grossReturnAmount:
				status === "cashout"
					? resolveCashoutReturn(
							grossReturnAmountValue,
							profitAmountValue,
							stakeAmount,
							lineNumber,
						)
					: grossReturnAmountValue
						? parseNumber(
								grossReturnAmountValue,
								"gross_return_brl",
								lineNumber,
							)
						: undefined,
			tags: parseTagInput(getOptionalValue(record, ["tags"]) ?? ""),
			note: getOptionalValue(record, ["note"]) || undefined,
		} satisfies BetCsvImportItem;
	});
}

export function parseBankrollCsvImport(text: string) {
	const records = parseRecords(text);

	return records.map((record, index) => {
		const lineNumber = index + 2;

		return {
			type: normalizeTransactionType(
				getRequiredValue(record, ["type", "tipo"], lineNumber),
				lineNumber,
			),
			amount: Math.abs(
				parseNumber(
					getRequiredValue(
						record,
						["amount_brl", "amount", "valor_brl", "valor"],
						lineNumber,
					),
					"amount_brl",
					lineNumber,
				),
			),
			occurredAt: parseIsoDate(
				getRequiredValue(record, ["occurred_at", "date", "data"], lineNumber),
				"occurred_at",
				lineNumber,
			),
			note:
				getOptionalValue(record, ["note", "observacao", "obs", "description"]) ||
				undefined,
		} satisfies BankrollCsvImportItem;
	});
}

function parseRecords(text: string) {
	const rows = parseCsv(text);

	if (rows.length < 2) {
		throw new Error("CSV vazio ou sem linhas suficientes.");
	}

	const [headerRow, ...bodyRows] = rows;
	const headers = headerRow.map(normalizeHeader);

	return bodyRows.map((row) => {
		const record = new Map<string, string>();

		for (const [index, header] of headers.entries()) {
			record.set(header, (row[index] ?? "").trim());
		}

		return record;
	});
}

function normalizeHeader(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replaceAll(" ", "_");
}

function getRequiredValue(
	record: Map<string, string>,
	aliases: string[],
	lineNumber: number,
) {
	const value = getOptionalValue(record, aliases);
	if (!value) {
		throw new Error(`Linha ${lineNumber}: coluna ${aliases[0]} obrigatoria.`);
	}

	return value;
}

function getOptionalValue(record: Map<string, string>, aliases: string[]) {
	for (const alias of aliases) {
		const value = record.get(alias);
		if (value != null && value !== "") {
			return value;
		}
	}

	return undefined;
}

function parseNumber(value: string, field: string, lineNumber: number) {
	const trimmed = value.trim();
	const normalized = /^-?\d{1,3}(\.\d{3})+,\d+$/.test(trimmed)
		? trimmed.replace(/\./g, "").replace(",", ".")
		: /^-?\d+,\d+$/.test(trimmed)
			? trimmed.replace(",", ".")
			: /^-?\d{1,3}(,\d{3})+\.\d+$/.test(trimmed)
				? trimmed.replace(/,/g, "")
				: trimmed;
	const parsed = Number(normalized);

	if (!Number.isFinite(parsed)) {
		throw new Error(`Linha ${lineNumber}: ${field} invalido.`);
	}

	return parsed;
}

function parseIsoDate(value: string, field: string, lineNumber: number) {
	const parsed = new Date(value);

	if (Number.isNaN(parsed.getTime())) {
		throw new Error(`Linha ${lineNumber}: ${field} invalido.`);
	}

	return parsed.toISOString();
}

function normalizeBetStatus(value: string, lineNumber: number): BetStatus {
	const normalized = value.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");

	switch (normalized) {
		case "open":
		case "win":
		case "loss":
		case "void":
		case "cashout":
		case "half_win":
		case "half_loss":
			return normalized;
		default:
			throw new Error(`Linha ${lineNumber}: status invalido.`);
	}
}

function normalizeTransactionType(value: string, lineNumber: number) {
	const normalized = normalizeLooseToken(value);

	switch (normalized) {
		case "deposit":
		case "deposito":
			return "deposit";
		case "withdraw":
		case "saque":
			return "withdraw";
		case "adjustment":
		case "ajuste":
		case "ajustemanual":
			return "adjustment";
		default:
			throw new Error(`Linha ${lineNumber}: tipo invalido.`);
	}
}

function normalizeLooseToken(value: string) {
	return value
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.replaceAll(" ", "")
		.replaceAll("_", "")
		.replaceAll("-", "");
}

function resolveCashoutReturn(
	grossReturnAmountValue: string | undefined,
	profitAmountValue: string | undefined,
	stakeAmount: number,
	lineNumber: number,
) {
	if (grossReturnAmountValue) {
		return parseNumber(grossReturnAmountValue, "gross_return_brl", lineNumber);
	}

	if (profitAmountValue) {
		return stakeAmount + parseNumber(profitAmountValue, "profit_brl", lineNumber);
	}

	throw new Error(
		`Linha ${lineNumber}: cashout exige gross_return_brl ou profit_brl.`,
	);
}
