import { getActiveLocale } from "./locale";

export function toCents(value: number) {
	return Math.round(value * 100);
}

export function fromCents(value: number | null | undefined) {
	if (value == null) return null;
	return value / 100;
}

export function formatCurrency(
	value: number | null | undefined,
	currency = "BRL",
) {
	if (value == null) return "--";

	return new Intl.NumberFormat(getActiveLocale(), {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
	}).format(value);
}

export function formatNumber(value: number, digits = 2) {
	return new Intl.NumberFormat(getActiveLocale(), {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	}).format(value);
}
