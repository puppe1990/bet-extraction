import { ClientOnly } from "@tanstack/react-router";
import { getActiveLocale } from "./locale";

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
	return new Intl.DateTimeFormat(getActiveLocale(), {
		dateStyle: "short",
		timeStyle: "short",
		...options,
	}).format(new Date(value));
}

export function DateTimeText({
	value,
	options,
}: {
	value: string;
	options?: Intl.DateTimeFormatOptions;
}) {
	return (
		<ClientOnly
			fallback={<span suppressHydrationWarning>{formatDate(value)}</span>}
		>
			<span>{formatDate(value, options)}</span>
		</ClientOnly>
	);
}
