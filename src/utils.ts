import fs from "fs";
import path from "path";
import { TEMPLATE_DIRECTORY } from "./constants.js";

export async function* walk(dir: string): AsyncGenerator<string> {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) yield* await walk(entry);
    else if (d.isFile()) yield entry;
  }
}

export async function copyDirChildren(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  let entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    entry.isDirectory()
      ? await copyDirChildren(srcPath, destPath)
      : await fs.promises.copyFile(srcPath, destPath);
  }
}

/**
 * Calls the supplied replacer function for each link found in a href attribute.
 * The href value is replaced by the return value of the function.
 */
export async function replaceHrefsInHTML(
  sourceText: string,
  replacer: (originalLink: string) => string
) {
  const hrefMatch = /href="(.*?.md)"/gm;

  return sourceText.replace(hrefMatch, (_, link) => `href="${replacer(link)}"`);
}

export const dateHuman = (date: Date): string => {
  return date.toLocaleDateString("pt-BR");
};

export const buildPageInfo = (
  author: string,
  created?: Date,
  updated?: Date
): string => {
  const fragments: string[] = [];

  if (created) {
    if (updated && dateHuman(created) !== dateHuman(updated)) {
      fragments.push(`Modified ${dateHuman(updated)}`);
    }

    fragments.push(`Published ${dateHuman(created)}`);
  } else if (updated) {
    fragments.push(dateHuman(updated));
  }

  fragments.push(author);

  return fragments.join(" · ");
};

export const getTemplate = (name: string): Promise<string> => {
  return fs.promises.readFile(
    path.join(TEMPLATE_DIRECTORY, name.replace(".html", "") + ".html"),
    "utf-8"
  );
};

export const plural = (count: number, singular: string, plural: string) => {
  return count === 1 ? singular : plural;
};
