export const appLocales = ["en", "pt-BR"] as const;

export type AppLocale = (typeof appLocales)[number];

let activeLocale: AppLocale = "en";

export function getActiveLocale() {
	return activeLocale;
}

export function setActiveLocale(locale: AppLocale) {
	activeLocale = locale;
}
