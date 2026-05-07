export function slugify(str: string) {
	return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
