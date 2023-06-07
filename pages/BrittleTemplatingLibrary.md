Title: The Brittle Templating Library
Description: A quirky, kind of brittle markdown preprocessor for generating dynamic content using inline JS templates. It works (maybe).
Created at: 2023-06-04 17:12
Updated at: 2023-06-07 10:36

---

When building this blog, I chose the markdown format for the articles.

So I built a static, static site generator. As in, a tool that reads the source markdown files and spits out the equivalent HTML content.

And it worked.

But then I felt I needed some "dynamic" content too. I wanted some kind of preprocessor for my static site, that would generate the markdown prose that my static site generator would then consume.

So I made Brittle.

Brittle is a markdown preprocessor that supports inline JS templates, like in [ejs](https://ejs.co/).

Brittle was created in 90 minutes. So, I wouldn't be surprised if Brittle is kind of brittle. But it works.

_Also, it uses eval. So only use it with markdown text you trust. I am not responsible for hacked servers, lost data, dead SD cards, thermonuclear war, or you getting fired because the alarm app failed._

## Basic overview of the syntax

Any JavaScript fragment goes between backticks `` sorrounded by brackets [].

```md
\[`if (new Date().getFullYear() === 2023) {`]
The current year is 2023.
\[`} else {`]
The current year is not 2023.
\[`}`]
```

Output (evaluated server-side):

> [`if (new Date().getFullYear() === 2023) {`]
> The current year is 2023.
> [`} else {`]
> The current year is not 2023.
> [`}`]

### Writing dynamic content in the document

If you want to output the _result_ of the given code, an equals sign must be placed before the first backtick.

```md
Random number: \[=`Math.floor(Math.random() * 100000)`]
```

Output (evaluated server-side):

> Random number: [=`Math.floor(Math.random() * 100000)`]

### Having fun

The following list was generated with Brittle:

[`for (let x = 1; x <= 5; x++) {`]
[=`x`]. This is 'a' repeated [=`x`] times: [=`'a'.repeat(x)`] [=`'\n'`]
[`}`]

```md
\[`for (let x = 1; x <= 5; x++) {`]
\[=`x`]. This is 'a' repeated \[=`x`] times: \[=`'a'.repeat(x)`] \[=`'\\n'`]
\[`}`]
```

## Then I went and made it a public library

So you can use Brittle right now.

Here's the [npm link](https://www.npmjs.com/package/brittle-templates). And here's the [GitHub repository](https://github.com/lucas-bortoli/brittle-templating).

You can install Brittle using npm:

```shell
npm install brittle-templates
```

To use the library, you need to import `brittle-templates` and utilize the `runTemplate` function. Here's an example of generating a document using a template:

```js
import fs from "fs";
import runTemplate from "brittle-templates";

const source = fs.readFileSync("input.md", "utf-8");
const output = runTemplate(source);
fs.writeFileSync("output.md", output, "utf-8");
```
