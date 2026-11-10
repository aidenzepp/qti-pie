import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { readImports } from "#plate/test/imports.ts";

/**
 * The package's name, which a host imports plate's surface through.
 */
const packageName = "@qti-pie/plate";

/**
 * The files the ledger command writes, which the ledger section names: the verdict report, the
 * ledger and the runtime's size.
 */
const ledgerOutputs = [
  "verdicts.json",
  "verdicts.txt",
  "ledger.json",
  "ledger.txt",
  "runtime-size.json",
  "runtime-size.txt",
] as const;

/**
 * The README section the area's text goes in.
 */
const ledgerHeading = "## Conformance ledger";

/**
 * The CHANGELOG section that lists the area's lines, matched without the `_(pending)_` its heading
 * carries while a line of the section is still pending.
 */
const fanOutHeading = "### The fan-out (M3.d to M5)";

/**
 * The paragraph that opens the fan-out section once an area has landed, as the rule every docs
 * issue shares sets it.
 */
const fanOutIntro =
  "Each line names the issue that lands it. A line marked pending has not landed, and each area replaces its lines when the area merges.";

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
 * Read the CHANGELOG.
 *
 * @returns Its text.
 */
const changelog = (): string => packageFile("CHANGELOG.md");

/**
 * Read a text with every run of whitespace as one space, so a phrase the formatter wraps still
 * matches.
 *
 * @param text The text.
 * @returns The text on one line, trimmed.
 */
const flat = (text: string): string => text.replaceAll(/\s+/gu, " ").trim();

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
 * @param text The Markdown.
 * @param heading The heading's line, such as `## Navigation`; a heading line that goes on after it
 *   with a space, such as a pending mark, matches too.
 * @returns The section's text, without its heading; empty when the text has no such heading.
 */
const sectionOf = (text: string, heading: string): string => {
  const level = heading.indexOf(" ");
  const lines = markdownLines(text);
  const start = lines.findIndex(
    ({ code, line }) => !code && (line === heading || line.startsWith(`${heading} `)),
  );

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
 * Give one section as a single line.
 *
 * @param text The Markdown.
 * @param heading The section's heading line.
 * @returns The section's text on one line.
 */
const flatSectionOf = (text: string, heading: string): string => flat(sectionOf(text, heading));

/**
 * Give the blocks of a section between blank lines, each on one line.
 *
 * @param text The Markdown.
 * @param heading The section's heading line.
 * @returns The section's paragraphs, list items and fences among them as their blocks are.
 */
const paragraphsOf = (text: string, heading: string): readonly string[] =>
  sectionOf(text, heading)
    .split(/\n\s*\n/u)
    .map(flat)
    .filter((paragraph) => paragraph !== "");

/**
 * Give the top-level list items of a section, each on one line with its continuation lines.
 *
 * @param text The Markdown.
 * @param heading The section's heading line.
 * @returns Each item's text, without its bullet.
 */
const entriesOf = (text: string, heading: string): readonly string[] => {
  const entries: string[][] = [];

  for (const line of sectionOf(text, heading).split("\n")) {
    if (line.startsWith("- ")) {
      entries.push([line.slice("- ".length)]);
    } else if (line.trim() !== "") {
      entries.at(-1)?.push(line.trim());
    }
  }

  return entries.map((entry) => flat(entry.join(" ")));
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

/**
 * Count how often a phrase occurs in a text.
 *
 * @param text The text.
 * @param phrase The phrase.
 * @returns The number of non-overlapping occurrences.
 */
const occurrences = (text: string, phrase: string): number => text.split(phrase).length - 1;

describe("README.md and CHANGELOG.md for area m3h", () => {
  it("[docs-m3h] README.md holds no pending marker of the area", () => {
    for (const id of ["m3h-01", "m3h-02"]) {
      assert.notInclude(readme(), `(pending ${id})`, id);
    }
  });

  it("[docs-m3h] CHANGELOG.md holds no pending marker of the area", () => {
    for (const id of ["m3h-01", "m3h-02"]) {
      assert.notInclude(changelog(), `(pending ${id})`, id);
    }
  });

  it("[docs-m3h] the fan-out section has one landed entry per area issue", () => {
    const section = flatSectionOf(changelog(), fanOutHeading);
    const entries = entriesOf(changelog(), fanOutHeading);

    assert.notStrictEqual(section, "", "the fan-out section exists");
    for (const id of ["m3h-01", "m3h-02"]) {
      const landed = `(issue ${id})`;

      assert.strictEqual(occurrences(section, landed), 1, `${landed} appears once`);
      assert.isTrue(
        entries.some((entry) => entry.endsWith(landed)),
        `${landed} ends an entry`,
      );
    }

    const size = entries.find((entry) => entry.endsWith("(issue m3h-02)"));

    assert.include(size ?? "", "(information, criterion 11)");
  });

  it("[docs-m3h] the fan-out section's intro reads as rule S1 sets it", () => {
    assert.strictEqual(paragraphsOf(changelog(), fanOutHeading)[0], fanOutIntro);
  });

  it("[docs-m3h] the ledger paragraph lists every file the command writes", () => {
    const section = flatSectionOf(readme(), ledgerHeading);

    for (const name of ledgerOutputs) {
      assert.include(section, `\`${name}\``, name);
    }
    assert.include(section, "exits with 1 when a test fails");
  });

  it("[docs-m3h] the Conformance ledger section states the size baseline and the jump rule", () => {
    const section = flatSectionOf(readme(), ledgerHeading);
    const sentences = section.split(/(?<=\.) (?=[A-Z`])/u);
    const exitOfJump = sentences.filter(
      (sentence) => sentence.includes("jump") && sentence.includes("exit code"),
    );

    assert.include(section, "`PLATE_RUNTIME_SIZE_BASELINE`");
    assert.include(section, "5,000");
    assert.include(section, "15 percent");
    assert.isAbove(exitOfJump.length, 0, "a sentence says what a jump does to the exit code");
    for (const sentence of exitOfJump) {
      assert.include(sentence, "never");
    }
  });

  it("[docs-m3h] the Conformance ledger section gives the sweep command and what it checks", () => {
    const section = sectionOf(readme(), ledgerHeading);
    const flatSection = flat(section);
    const sweepCommand = "node packages/plate/scripts/sweep.ts";
    const blocks = codeBlocks(section).filter(({ code }) => code.includes(sweepCommand));

    assert.isTrue(
      section.split("\n").some((line) => line.includes(sweepCommand)),
      "a line of the section holds the sweep command",
    );
    assert.lengthOf(blocks, 1, "the sweep command is in one code block");
    assert.strictEqual(blocks[0]?.lang, "bash");
    assert.notInclude(blocks[0]?.code ?? "", "ledger", "the sweep command's block is its own");
    for (const fragment of [
      "Chromium",
      "WebKit",
      "work/sweep",
      "A and AA",
      "experimental or deprecated",
      ".dark",
      "upgrade()",
      "settle part of a criterion only",
    ]) {
      assert.include(flatSection, fragment, fragment);
    }
  });

  it("[docs-m3h] every code block imports only exported names", () => {
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
});
