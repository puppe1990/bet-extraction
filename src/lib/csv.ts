export function parseCsv(text: string) {
	const rows: string[][] = [];
	let currentRow: string[] = [];
	let currentValue = "";
	let inQuotes = false;

	const normalized = text.replace(/^\uFEFF/, "");

	for (let index = 0; index < normalized.length; index += 1) {
		const char = normalized[index];
		const nextChar = normalized[index + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				currentValue += '"';
				index += 1;
				continue;
			}

			inQuotes = !inQuotes;
			continue;
		}

		if (char === "," && !inQuotes) {
			currentRow.push(currentValue);
			currentValue = "";
			continue;
		}

		if ((char === "\n" || char === "\r") && !inQuotes) {
			if (char === "\r" && nextChar === "\n") {
				index += 1;
			}

			currentRow.push(currentValue);
			if (currentRow.some((value) => value.length > 0)) {
				rows.push(currentRow);
			}
			currentRow = [];
			currentValue = "";
			continue;
		}

		currentValue += char;
	}

	currentRow.push(currentValue);
	if (currentRow.some((value) => value.length > 0)) {
		rows.push(currentRow);
	}

	return rows;
}
