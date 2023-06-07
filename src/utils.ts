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

/**
 * Replaces every {placeholder} in the given template with a value from the
 * dictionary.
 */
export const replaceTemplateVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  /**
   * Matches every {placeholder}. The variable inside the brackets is stored
   * in the "variableName" group.
   */
  const exp = /{(?<variableName>[a-zA-Z_\-]*)}/gm;

  return template.replace(exp, (a, b, c, d, groups: Record<string, string>) => {
    return variables[groups.variableName] ?? "";
  });
};

export const dateHuman = (date: Date): string => {
	return date.toLocaleDateString("pt-BR");
}

export const buildPageInfo = (author: string, created?: Date, updated?: Date): string => {
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
}