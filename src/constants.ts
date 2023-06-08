import { join } from "path";

export const WORKING_DIRECTORY = process.cwd();
export const TEMPLATE_DIRECTORY = join(WORKING_DIRECTORY, "src/templates/");
export const PARTIALS_DIRECTORY = join(WORKING_DIRECTORY, "src/templates/partials/");
export const ARTICLES_DIRECTORY = join(WORKING_DIRECTORY, "pages/");
export const STATIC_DIRECTORY = join(WORKING_DIRECTORY, "src/static/");
export const OUTPUT_DIRECTORY = join(WORKING_DIRECTORY, "www/");
