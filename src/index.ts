import fs from "fs";
import path, { join, relative, dirname, basename } from "path";
import {
	copyDir,
	extractTitleFromMarkdown,
	findLinksInHTML,
	walk,
} from "./utils.js";
import {
	ARTICLES_DIRECTORY,
	OUTPUT_DIRECTORY,
	STATIC_DIRECTORY,
	TEMPLATE_DIRECTORY,
} from "./constants.js";
import brittle from "brittle-templates";
import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";
import { toPascalCase } from "js-convert-case";
import hljs from "highlight.js";

marked.use(
	gfmHeadingId({
		prefix: "article:",
	})
);

marked.use(
	markedHighlight({
		langPrefix: "hljs language-",
		highlight: (code, lang) => {
			const language = hljs.getLanguage(lang) ? lang : "plaintext";
			return hljs.highlight(code, { language }).value;
		},
	})
);

const PAGE_TEMPLATE = await fs.promises.readFile(
	join(TEMPLATE_DIRECTORY, "page.html"),
	"utf-8"
);

interface PageHeader {
	Title: string;
	Description?: string;
	CreatedAt?: Date;
	LastUpdated?: Date;
}

const main = async () => {
	// Clean output directory
	await fs.promises.rm(OUTPUT_DIRECTORY, { recursive: true, force: true });

	const linkMapper: Map<string, string> = new Map();

	for await (const file of walk(ARTICLES_DIRECTORY)) {
		let data: string;
		let title: string;

		//@ts-expect-error
		let header: PageHeader = {};

		data = await fs.promises.readFile(file, "utf-8");

		// parse header values
		let keyValuePairs: [keyof PageHeader, string][] = data
			.split("---")[0]
			.trim()
			.split("\n")
			.map(line =>
				line
					.trim()
					.split(":")
					.map(kv => kv.trim())
			)
			.map(([key, value]) => [toPascalCase(key) as keyof PageHeader, value]);

		for (let [key, value] of keyValuePairs) {
			if (key === "CreatedAt" || key === "LastUpdated") {
				header[key] = new Date(value);
			} else {
				header[key] = value;
			}
		}

		// skip header
		data = data.split("---").slice(1).join("---");
		data = brittle(data);
		title = header.Title ?? "Página sem título";
		data = marked(data, {
			gfm: true,
			mangle: false,
		});
		data = PAGE_TEMPLATE.replaceAll("{page_body}", data);
		data = data.replaceAll("{page_title}", title);
		data = data.replaceAll("{page_description}", header.Description ?? "");
		data = data.replaceAll("{current_year}", "" + new Date().getFullYear());
		data = data.replaceAll(
			"{footer_info}",
			[
				header.LastUpdated
					? `Last updated at ${header.LastUpdated.toISOString().slice(0, 10)}`
					: null,
				header.CreatedAt
					? `Created at ${header.CreatedAt.toISOString().slice(0, 10)}`
					: null,
			]
				.filter(s => s !== null)
				.join("<br />")
		);

		const relPath = relative(ARTICLES_DIRECTORY, file);

		// Convert title into PascalCase and add extension
		const newBasename = path.join(
			path.dirname(relPath),
			toPascalCase(title) + ".html"
		);

		const outPath = join(OUTPUT_DIRECTORY, newBasename + ".unresolved");

		await fs.promises.mkdir(dirname(outPath), { recursive: true });
		await fs.promises.writeFile(outPath, data);

		linkMapper.set(basename(relPath), newBasename);
	}

	// Second pass: resolve links
	for await (const fileAbs of walk(OUTPUT_DIRECTORY)) {
		if (!fileAbs.endsWith(".html.unresolved")) {
			continue;
		}

		console.log(fileAbs);
		const text = await fs.promises.readFile(fileAbs, "utf-8");
		const modified = await findLinksInHTML(text, originalLink => {
			return linkMapper.get(basename(originalLink)) ?? originalLink;
		});

		await fs.promises.writeFile(fileAbs.replace(".unresolved", ""), modified);
		await fs.promises.rm(fileAbs);
	}

	// Copy static files
	await copyDir(STATIC_DIRECTORY, OUTPUT_DIRECTORY);
};

main();
