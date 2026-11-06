import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";
import { storedVersion } from "#plate/codec/record.ts";
import { readImports } from "#plate/test/imports.ts";

/**
 * The README's opening, rule `17b156bd`: the title, the quoted tagline and the one-line summary,
 * blank lines and the bare `>` quote line included, each ended by a line feed.
 */
const opening = [
  "# plate",
  "",
  "> *You eat with your eyes first.*",
  ">",
  "> plate serves it up: it renders QTI items to HTML, takes the answers, and scores what comes back.",
  "",
  "Render QTI 3.0 items and tests for candidates, on the server and in the browser.",
  "",
].join("\n");

/**
 * The command that writes the conformance ledger, which the README gives on a line of its own.
 */
const ledgerCommand = "pnpm --filter @qti-pie/plate ledger";

/**
 * The README's sections: the eleven it had before M2 and the four M2 adds.
 */
const headings = [
  "## Install",
  "## Start",
  "## Functions",
  "## Navigation",
  "## Records",
  "## Results",
  "## Interactions",
  "## Scoring",
  "## Server and browser",
  "## Hosts",
  "## Styling",
  "## Playground",
  "## Conformance ledger",
  "## Development",
  "## License",
] as const;

/**
 * The navigation API, rule `9af3809b`: the data, the transition and the intent entry's helpers.
 */
const navigationNames = [
  "navigationState",
  "allowedIntents",
  "advance",
  "intentName",
  "encodeIntent",
  "decodeIntent",
] as const;

/**
 * The navigation recipes, one heading each: the script-free post, two form libraries and the
 * server half they share.
 */
const recipes = [
  "### A script-free native form post",
  "### React Hook Form",
  "### TanStack Form",
  "### A plain server action",
] as const;

/**
 * The records a host stores, each documented as versioned JSON.
 */
const records = ["StoredRecord", "StoredTestSession"] as const;

/**
 * The package's name, which a host imports plate's surface through.
 */
const packageName = "@qti-pie/plate";

/**
 * The part of plate's `package.json` the licence case reads.
 */
const Manifest = Schema.Struct({ license: Schema.String });

/**
 * Read a file of the package.
 *
 * @param file The file's path from the package's root.
 * @returns Its text.
 */
const packageFile = (file: string): string =>
  readFileSync(new URL(`../${file}`, import.meta.url), "utf-8");

/**
 * Read the README.
 *
 * @returns Its text.
 */
const readme = (): string => packageFile("README.md");

/**
 * Give the lines of a Markdown text with the lines inside fenced code blocks marked, so a `#` in
 * a code block never reads as a heading.
 *
 * @param text The Markdown.
 * @returns Each line, with whether it is inside a fence, the fence lines themselves included.
 */
const markdownLines = (
  text: string,
): readonly { readonly code: boolean; readonly line: string }[] => {
  let fenced = false;

  return text.split("\n").map((line) => {
    const fence = line.startsWith("```");
    const code = fenced || fence;
    if (fence) {
      fenced = !fenced;
    }

    return { code, line };
  });
};

/**
 * Give the text of one section: the lines after its heading, up to the next heading of the same
 * level or a higher one.
 *
 * @param heading The heading's line, such as `## Navigation`.
 * @returns The section's text, without its heading; empty when the README has no such heading.
 */
const sectionOf = (heading: string): string => {
  const level = heading.indexOf(" ");
  const lines = markdownLines(readme());
  const start = lines.findIndex(({ code, line }) => !code && line === heading);
  if (start === -1) {
    return "";
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex(({ code, line }) => {
    const marks = /^(?<marks>#+) /u.exec(line)?.groups?.["marks"];

    return !code && marks !== undefined && marks.length <= level;
  });

  return (end === -1 ? rest : rest.slice(0, end)).map(({ line }) => line).join("\n");
};

/**
 * Give the fenced code blocks of a Markdown text.
 *
 * @param text The Markdown.
 * @returns Each block's language, as its opening fence names it, and its code.
 */
const codeBlocks = (text: string): readonly { readonly code: string; readonly lang: string }[] =>
  Array.from(text.matchAll(/^```(?<lang>\w*)\n(?<code>[\s\S]*?)^```$/gmu), ({ groups }) => ({
    code: groups?.["code"] ?? "",
    lang: groups?.["lang"] ?? "",
  }));

/**
 * Give the TypeScript a code block holds: a TypeScript block whole, and an Astro component's
 * frontmatter, between its `---` fences.
 *
 * @param block The code block.
 * @returns The TypeScript, or none for a block of another language.
 */
const scriptOf = (block: { readonly code: string; readonly lang: string }): string => {
  switch (block.lang) {
    case "ts":
    case "tsx": {
      return block.code;
    }
    case "astro": {
      return block.code.split(/^---$/mu)[1] ?? "";
    }
    default: {
      return "";
    }
  }
};

describe("README.md", () => {
  it("opens with the rule's block, verbatim", () => {
    assert.strictEqual(readme().slice(0, opening.length), opening);
  });

  it("gives the ledger command on a line of its own and holds each section's heading", () => {
    const lines = readme().split("\n");

    assert.include(lines, ledgerCommand);
    for (const heading of headings) {
      assert.include(lines, heading);
    }
  });

  it("imports from @qti-pie/plate only names src/index.ts exports", () => {
    const exported = new Set(
      readImports(packageFile("src/index.ts")).imports.flatMap(({ names }) =>
        names.map(({ name }) => name),
      ),
    );
    const imported = codeBlocks(readme()).flatMap((block) =>
      readImports(scriptOf(block)).imports.flatMap(({ names, specifier }) =>
        specifier === packageName ? names.map(({ name }) => name) : [],
      ),
    );

    assert.isAbove(imported.length, 0);
    for (const name of imported) {
      assert.isTrue(exported.has(name), `${name} is imported from ${packageName}`);
    }
  });

  it("names the stylesheet's entry point, which resolves to src/styles.css", () => {
    const entry = `${packageName}/styles.css`;

    assert.include(readme(), `\`${entry}\``);
    assert.strictEqual(
      createRequire(import.meta.url).resolve(entry),
      fileURLToPath(new URL("styles.css", import.meta.url)),
    );
  });

  it("documents both stored records as JSON with the version plate writes", () => {
    const lines = sectionOf("## Records").split("\n");
    const version = `\`version: ${String(storedVersion)}\``;

    for (const record of records) {
      assert.isTrue(
        lines.some((line) => line.includes(`\`${record}\``) && line.includes(version)),
        `${record} is named with ${version}`,
      );
    }
  });

  it("names the navigation API and says its parts are plain buttons with no submit semantics", () => {
    const navigation = sectionOf("## Navigation");

    for (const name of navigationNames) {
      assert.include(navigation, `\`${name}\``);
    }

    assert.include(navigation, '`type="button"`');
    assert.include(navigation, "submit semantics");
  });

  it("holds the four navigation recipes, each under its own heading", () => {
    const lines = readme().split("\n");

    for (const recipe of recipes) {
      assert.include(lines, recipe);
    }
  });

  it("swaps the navigation parts for submit buttons in the native recipe's code", () => {
    const swaps = codeBlocks(sectionOf("### A script-free native form post")).filter(
      ({ code }) =>
        /parts:\s*\{\s*"test-navigation":/u.test(code) && /type:\s*"submit"/u.test(code),
    );

    assert.lengthOf(swaps, 1);
  });

  it("states the Choice form duty and that a page holding a session holds its scores", () => {
    const duties = sectionOf("## Server and browser").split("\n");

    assert.isTrue(
      duties.some(
        (line) =>
          line.includes("Choice") &&
          line.includes('`autocomplete="off"`') &&
          line.includes("no-store"),
      ),
      'a Choice form carries autocomplete="off" and its pages no-store',
    );
    assert.isTrue(
      duties.some((line) => line.includes("`TestSession`") && line.includes("scores")),
      "a page holding a TestSession holds every item's scores",
    );
  });

  it("says in Hosts that a host decodes a post through postings, which src/index.ts exports", () => {
    const exported = readImports(packageFile("src/index.ts")).imports.flatMap(({ names }) =>
      names.map(({ name }) => name),
    );
    const paragraphs = sectionOf("## Hosts")
      .split(/\n{2,}/u)
      .map((paragraph) => paragraph.replaceAll("\n", " "));

    assert.include(exported, "postings");
    assert.isTrue(
      paragraphs.some(
        (paragraph) =>
          paragraph.includes("`postings(redacted, instance)`") && paragraph.includes("Text Entry"),
      ),
      "a paragraph of Hosts names postings(redacted, instance) for a posted Text Entry",
    );
  });

  it("names the licence package.json declares, MIT", () => {
    const { license } = Schema.decodeUnknownSync(Manifest)(JSON.parse(packageFile("package.json")));

    assert.strictEqual(license, "MIT");
    assert.strictEqual(sectionOf("## License").trim(), license);
  });
});
