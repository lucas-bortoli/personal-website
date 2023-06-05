import fs from "fs";
import path from "path";

export async function* walk(dir: string): AsyncGenerator<string> {
	for await (const d of await fs.promises.opendir(dir)) {
		const entry = path.join(dir, d.name);
		if (d.isDirectory()) yield* await walk(entry);
		else if (d.isFile()) yield entry;
	}
}

export const extractTitleFromMarkdown = (source: string): string | null => {
	const titleRegex = /^\s*#{1,6}\s?(.*)/m;

	return source.match(titleRegex)[1] ?? null;
};

export async function copyDir(src, dest) {
	await fs.promises.mkdir(dest, { recursive: true });
	let entries = await fs.promises.readdir(src, { withFileTypes: true });

	for (let entry of entries) {
		let srcPath = path.join(src, entry.name);
		let destPath = path.join(dest, entry.name);

		entry.isDirectory()
			? await copyDir(srcPath, destPath)
			: await fs.promises.copyFile(srcPath, destPath);
	}
}

export async function findLinksInHTML(
	sourceText: string,
	replacer: (originalLink: string) => string
) {
	const hrefMatch = /href="(.*?.md)"/gm;

	return sourceText.replace(hrefMatch, (_, link) => `href="${replacer(link)}"`);
}
