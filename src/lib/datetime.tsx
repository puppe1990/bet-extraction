import { ClientOnly } from "@tanstack/react-router";

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
	return new Intl.DateTimeFormat("pt-BR", {
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
