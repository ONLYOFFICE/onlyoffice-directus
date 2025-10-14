export function encodeFilename(filename: string): string {
	const encoded = encodeURIComponent(filename)
		.replace(/['()]/g, escape)
		.replace(/\*/g, '%2A')
		.replace(/%(?:7C|60|5E)/g, unescape);
	return `utf-8''${encoded}`;
}
