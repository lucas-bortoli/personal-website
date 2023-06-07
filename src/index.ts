import fs from "fs";
import { extname, join, relative, dirname, basename } from "path";
import {
  buildPageInfo,
  copyDirChildren,
  dateHuman,
  extractTitleFromMarkdown,
  replaceHrefsInHTML,
  replaceTemplateVariables,
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
  UpdatedAt?: Date;
}

interface Page {
  header: PageHeader;
  originalLink: string;
  transformedLink: string;
}

const parseMarkdownFile = async (file: string): Promise<Page> => {
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
    .map(line => {
      const frags = line.split(":");

      return [frags.shift().trim(), frags.join(":").trim()];
    })
    .map(([key, value]) => [toPascalCase(key) as keyof PageHeader, value]);

  for (let [key, value] of keyValuePairs) {
    if (key === "CreatedAt" || key === "UpdatedAt") {
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
  data = replaceTemplateVariables(PAGE_TEMPLATE, {
    page_title: title,
    page_description: header.Description,
    page_body: data,
    current_year: "" + new Date().getFullYear(),
    page_info: buildPageInfo(
      "Lucas Bortoli",
      header.CreatedAt,
      header.UpdatedAt
    ),
  });

  const relPath = relative(ARTICLES_DIRECTORY, file);

  // Convert title into PascalCase and add extension
  const newBasename = join(dirname(relPath), toPascalCase(title) + ".html");

  const outPath = join(OUTPUT_DIRECTORY, newBasename + ".unresolved");

  await fs.promises.mkdir(dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, data);

  return {
    header: header,
    originalLink: basename(relPath),
    transformedLink: newBasename,
  };
};

const resolveLinks = async (pages: Page[]) => {
  for await (const fileAbs of walk(OUTPUT_DIRECTORY)) {
    if (!fileAbs.endsWith(".html.unresolved")) {
      continue;
    }

    const text = await fs.promises.readFile(fileAbs, "utf-8");

    /**
     * Finds all anchor links in the HTML.
     * If the link's basename is equal to the basename of one of the generated pages, we
     * modify that link so it points to the generated page.
     *
     * This step is needed because we don't preserve the file names from pages/ to www/,
     * instead basing it on the title.
     */
    const modified = await replaceHrefsInHTML(text, unmodifiedHref => {
      const name = basename(unmodifiedHref);
      const targetPage = pages.find(
        page => page.originalLink === name
      )?.transformedLink;

      return targetPage ?? unmodifiedHref;
    });

    await fs.promises.writeFile(fileAbs.replace(".unresolved", ""), modified);
    await fs.promises.rm(fileAbs);
  }
};

const main = async () => {
  // Clean output directory
  await fs.promises.rm(OUTPUT_DIRECTORY, { recursive: true, force: true });

  const generatedArticles: Page[] = [];

  for await (const file of walk(ARTICLES_DIRECTORY)) {
    const relativeToArticles = relative(ARTICLES_DIRECTORY, file);

    switch (extname(file)) {
      case ".md":
        const articleResult = await parseMarkdownFile(file);

        generatedArticles.push(articleResult);
        break;
      default:
        const outputFile = join(OUTPUT_DIRECTORY, relativeToArticles);

        // copy this file as-is
        await fs.promises.mkdir(dirname(outputFile), { recursive: true });
        await fs.promises.copyFile(file, outputFile);
    }
  }

  // Second pass: resolve links
  await resolveLinks(generatedArticles);

  // Copy static files
  await copyDirChildren(STATIC_DIRECTORY, OUTPUT_DIRECTORY);
};

main();
