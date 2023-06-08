import fs from "fs";
import path from "path";
import { PARTIALS_DIRECTORY } from "./constants.js";
import brittle from "brittle-templates";
import { plural } from "./utils.js";

/**
 * Loads a HTML fragment from the PARTIALS_DIRECTORY directory. Evaluates it
 * using the given Brittle context, and returns the result.
 * @param name The name of the fragment, without extension
 * @param context The Brittle context the fragment will use for evaluation.
 * @returns The result of the evaluated fragment.
 */
const importPartial = async (
  name: string,
  context: object
): Promise<string> => {
  name = name.replace(".html", "");

  const partialPath = path.join(PARTIALS_DIRECTORY, `${name}.html`);
  const partialContent = await fs.promises.readFile(partialPath, "utf-8");

  return await brittle(partialContent, context);
};

export { importPartial, plural };
