// The Brittle Templating Engine
//
// Copyright (c) 2023 Lucas Bortoli. All Rights Reserved.

interface Token {
	type: "text" | "write" | "code";
	value: string;
}

export const tokenize = (source: string) => {
	/**
	 * Match the following expressions:
	 *
	 * [`js code`]
	 * [=`js code inline`]
	 */
	const EXPR_MATCH = /(?<!\\)\[(?<mode>=)?`(?<expression>.*?)`\]/gm;

	var matches = source.matchAll(EXPR_MATCH);

	let text_node_start = 0;

	const nodes: Token[] = [];

	const push_text_node = (start, end) => {
		nodes.push({
			type: "text",
			value: source.substring(start, end),
		});
	};

	for (const match of matches) {
		const expressionLength = match[0].length;

		let text_node_end = match.index;

		push_text_node(text_node_start, text_node_end);

		if (match.groups.mode === "=") {
			nodes.push({
				type: "write",
				value: match.groups.expression,
			});
		} else {
			nodes.push({
				type: "code",
				value: match.groups.expression,
			});
		}

		text_node_start = text_node_end + expressionLength;

		match;
	}

	// Push remaining text node (text until EOF)
	push_text_node(text_node_start, source.length);

	return nodes;
};

/**
 * Compiles the given token list into a stringified function.
 */
export const compile = (nodes: Token[]): string => {
	const funcText = [];

	funcText.push("(function () {", "let data = '';", "", "try {");

	for (const node of nodes) {
		if (node.type === "text") {
			const escaped = node.value.replace(/`/g, "\\`");

			funcText.push("  data += `" + escaped + "`;");
		} else if (node.type === "write") {
			funcText.push("  data += '' + (" + node.value + ");");
		} else if (node.type === "code") {
			funcText.push("  " + node.value);
		}
	}

	funcText.push(
		"} catch (embeddedError) {",
		"  console.error(embeddedError);",
		"  throw embeddedError;",
		"}"
	);

	funcText.push("return data;");
	funcText.push("})");

	return funcText.join("\n");
};

/**
 * Runs the compiled function text. Uses eval. Unsafe.
 * No attempt of filtering the given code is made.
 * Only run templates you trust.
 *
 * Throws if the given template has a JS syntax error.
 */
export const run = (function_text: string): string => {
	let results = eval(function_text)();

	return results;
};

/**
 * A shorthand function that tokenizes the given template, compiles and runs it.
 */
export default function runTemplate(source: string) {
	return run(compile(tokenize(source)));
}
