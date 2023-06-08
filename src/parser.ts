import { toPascalCase } from "js-convert-case";
import path from "path";
import brittle from "brittle-templates";
import { marked } from "marked";
import calculateReadingTimeEstimate, { ReadTimeResults } from "reading-time";
import { buildPageInfo, getTemplate } from "./utils.js";
import * as brittleLib from "./brittleLib.js";

export interface ArticleHeader {
  Title: string;
  CreatedAt: Date;
  Description?: string;
  UpdatedAt?: Date;
}

export interface Article {
  header: ArticleHeader;
  sourceFilename: string;
  linkTarget: string;
  estimatedTimeToRead: ReadTimeResults;
  body: string;
}

export const parseArticle = async (
  filename: string,
  source: string
): Promise<Article> => {
  const sections = source.matchAll(/(?<header>.*?)---(?<body>.*)/gms)!.next()!
    .value!.groups as { header: string; body: string } | null;

  if (sections === null) {
    throw new Error("Invalid article. Doesn't have a header!");
  }

  const header: ArticleHeader = Object.fromEntries(
    sections.header.split("\n").map(line => {
      const [humanKey, ...valueSegments] = line.split(":");
      const key = toPascalCase(humanKey.trim()) as keyof ArticleHeader;
      const value = valueSegments.join(":").trim();

      if (key === "CreatedAt" || key === "UpdatedAt") {
        return [key, new Date(value)];
      }

      return [key, value];
    })
  );

  if (!header.CreatedAt) {
    throw new Error("Invalid article. Doesn't have a creation date!");
  }

  let articlePage: string;

  articlePage = await brittle(sections.body);
  let timeEstimate = calculateReadingTimeEstimate(articlePage);
  articlePage = marked(articlePage, { gfm: true, mangle: false });
  articlePage = await brittle(await getTemplate("page"), {
    ...brittleLib,
    page_title: header.Title,
    page_description: header.Description,
    page_body: articlePage,
    page_info: buildPageInfo(
      "Lucas Bortoli",
      header.CreatedAt,
      header.UpdatedAt
    ),
  });

  return {
    header: header,
    sourceFilename: path.basename(filename),
    linkTarget: toPascalCase(header.Title),
    estimatedTimeToRead: timeEstimate,
    body: articlePage,
  };
};
