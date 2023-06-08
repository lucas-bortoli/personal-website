import fs from "fs";
import { extname, join, relative, dirname, basename } from "path";
import {
  buildPageInfo,
  copyDirChildren,
  getTemplate,
  replaceHrefsInHTML,
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
import * as brittleLib from "./brittleLib.js";
import { Article, parseArticle } from "./parser.js";

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

const parseMarkdownFile = async (file: string): Promise<Article> => {
  const fileContents = await fs.promises.readFile(file, "utf-8");
  const article = await parseArticle(file, fileContents);

  const outPath = join(
    OUTPUT_DIRECTORY,
    article.linkTarget + ".html.unresolved"
  );

  await fs.promises.mkdir(dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, article.body);

  return article;
};

const resolveLinks = async (pages: Article[]) => {
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
      const targetPage = pages.find(page => page.sourceFilename === name);

      return targetPage?.linkTarget ?? unmodifiedHref;
    });

    await fs.promises.writeFile(fileAbs.replace(".unresolved", ""), modified);
    await fs.promises.rm(fileAbs);
  }
};

const generateIndexPage = async (articles: Article[]) => {
  const INDEX_TEMPLATE = await getTemplate("index");

  const sorted = articles
    .filter(article => !article.sourceFilename.startsWith("@"))
    .sort(
      (a, b) => b.header.CreatedAt.getTime() - a.header.CreatedAt.getTime()
    );

  const indexContents = await brittle(INDEX_TEMPLATE, {
    ...brittleLib,
    articles: sorted,
  });

  await fs.promises.writeFile(
    join(OUTPUT_DIRECTORY, "index.html"),
    indexContents
  );
};

const main = async () => {
  // Clean output directory
  await fs.promises.rm(OUTPUT_DIRECTORY, { recursive: true, force: true });

  const generatedArticles: Article[] = [];

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

  // Generate index
  await generateIndexPage(generatedArticles);

  // Copy static files
  await copyDirChildren(STATIC_DIRECTORY, OUTPUT_DIRECTORY);
};

main();
