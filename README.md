# Personal Website

This is a simple static site generator built with Node.js that converts Markdown files into HTML files for creating a blog. It reads Markdown files located in the `pages/` folder, applies a template from `src/templates/page.html`, and generates corresponding HTML files in the `www/` directory. Additionally, static files such as fonts and images are copied from `src/static/` to `www/`.

## Installation

1. Clone the repository:

   ```shell
   git clone https://github.com/lucas-bortoli/personal-website.git
   ```

2. Navigate to the project directory:

   ```shell
   cd personal-website
   ```

3. Install the dependencies:

   ```shell
   npm install
   ```

## Usage

To start the blog generator, use the following command:

```shell
npm run build
```

This command internally uses `ts-node` to execute the TypeScript code. The generated static website will be available in the `www/` directory.

## Configuration

The blog generator assumes the following directory structure:

- The `pages/` directory contains the Markdown files that will be converted into HTML files.
- The `src/templates/page.html` file represents the template used for generating the HTML files.
- The `src/static/` directory contains static files such as fonts, images, or any other required assets.

Please ensure that your Markdown files are correctly formatted and contain the necessary metadata, such as title, date, etc., to generate the corresponding HTML files.
