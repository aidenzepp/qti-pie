import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Result, Schema } from "effect";
import { storedVersion } from "#plate/codec/record.ts";
import { expressionKinds } from "#plate/model/expression.ts";
import {
  acceptedItem,
  configure,
  current,
  decodeSession,
  encodeIntent,
  encodeSession,
  entryName,
  intentName,
  open,
  results,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  Configuration,
  Entry,
  StoredTestSession,
  Value,
} from "#plate/index.ts";
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
 * The README's sections: the eleven it had before M2, the four M2 adds, the one M3.b-2 adds, the
 * one M3.b-3 adds and the two align-54 adds.
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
  "## Template processing",
  "## Outcome processing",
  "## Documents and packages",
  "## Limits",
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
 * The eight expressions only a test's outcome processing may hold, each as the README names it.
 */
const outcomeOnly = [
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-outcome-minimum",
  "qti-outcome-maximum",
  "qti-test-variables",
] as const;

/**
 * The package's name, which a host imports plate's surface through.
 */
const packageName = "@qti-pie/plate";

/**
 * The part of plate's `package.json` the licence case reads.
 */
const Manifest = Schema.Struct({ license: Schema.String });

/**
 * The scratch folder this run owns, under the package's git-ignored `work/`, where the server
 * action's recipe is written to be imported. Its name is new for each run, so two runs at once
 * never share or remove each other's files.
 */
const scratch = path.resolve(import.meta.dirname, "..", "work", `readme-test-${randomUUID()}`);

/**
 * The item the server action's recipe runs on, written fresh: a Text Entry that reads `RESPONSE`,
 * a single integer, in base 16, and processing that sets `TOTAL`, an integer, to `RESPONSE`.
 */
const byteItemXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="byte" title="The largest byte" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="integer"/>',
  '<qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="integer"/>',
  "<qti-item-body><p>The largest byte, in hexadecimal, is ",
  '<qti-text-entry-interaction response-identifier="RESPONSE" base="16"/>.</p></qti-item-body>',
  '<qti-response-processing><qti-set-outcome-value identifier="TOTAL"><qti-variable identifier="RESPONSE"/></qti-set-outcome-value></qti-response-processing>',
  "</qti-assessment-item>",
].join("");

/**
 * The test the server action's recipe runs on: one nonlinear part with individual submission that
 * holds the byte item twice, as `byte` and then `again`, each ref naming the document `byte.xml`
 * beside the test.
 */
const byteTestXml = [
  '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="readme" title="README">',
  '<qti-test-part identifier="part" navigation-mode="nonlinear" submission-mode="individual">',
  '<qti-assessment-section identifier="section" title="Section" visible="true">',
  '<qti-assessment-item-ref identifier="byte" href="byte.xml"/>',
  '<qti-assessment-item-ref identifier="again" href="byte.xml"/>',
  "</qti-assessment-section></qti-test-part></qti-assessment-test>",
].join("");

/**
 * The server action's recipe as the README writes it: the posted entries and the stored session
 * in, the session to store out.
 */
type ServerAction = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The recipe takes the session as the host stored it, JSON it has not read, and decodes it with decodeSession itself; this type mirrors that boundary.
  stored: unknown,
  entries: readonly Entry[],
  configuration: Configuration,
) => Result.Result<StoredTestSession, unknown>;

/**
 * Say whether a module exports the server action's `step`.
 *
 * @param module The module.
 * @returns Whether it exports a function named `step`.
 */
const exportsStep = (module: unknown): module is { readonly step: ServerAction } =>
  Predicate.hasProperty(module, "step") && Predicate.isFunction(module.step);

/**
 * Construct a single integer value.
 *
 * @param value The integer.
 * @returns The value.
 */
const integer = (value: bigint): Value => ({
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value }],
});

/**
 * Require a result to succeed.
 *
 * @param result The result.
 * @param what What gave it, for a failure's message.
 * @returns Its success.
 */
const ok = <A, E>(result: Result.Result<A, E>, what: string): A =>
  Result.getOrElse(result, (failure) => assert.fail(`${what} failed: ${String(failure)}`));

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
 * Give the lines of `src/engine/math.ts`'s opening legal comment, the `/*! … *\/` that carries
 * FDLIBM 5.3's notices, which `NOTICE` reproduces as plain text. The comment's own first and last
 * lines are left out, and each line between them loses its leading ` *` and the space after it.
 *
 * @returns The comment's lines, in order.
 */
const legalNotice = (): readonly string[] => {
  const [first, ...rest] = packageFile("src/engine/math.ts").split("\n");
  const end = rest.indexOf(" */");
  assert.strictEqual(first, "/*!", "math.ts opens with a legal comment");
  assert.isAbove(end, 0, "math.ts's legal comment closes on a line of its own");

  const body = rest.slice(0, end);
  for (const line of body) {
    assert.match(line, /^ \*(?: |$)/u, "each line of the legal comment starts with ` *`");
  }

  return body.map((line) => line.replace(/^ \*(?: |$)/u, ""));
};

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
 * Give the paragraphs of one section, each on one line: its blocks between blank lines, with each
 * line break read as a space, so a phrase the README wraps still matches.
 *
 * @param heading The section's heading line, such as `## Records`.
 * @returns The section's paragraphs, list items and table rows among them as their blocks are.
 */
const paragraphsOf = (heading: string): readonly string[] =>
  sectionOf(heading)
    .split(/\n{2,}/u)
    .map((paragraph) => paragraph.replaceAll("\n", " "));

/**
 * Give one section as a single line: every run of whitespace read as one space, so a phrase the
 * README wraps, inside a list item's indented lines or across table rows, still matches.
 *
 * @param heading The section's heading line, such as `## Outcome processing`.
 * @returns The section's text on one line.
 */
const flatSectionOf = (heading: string): string => sectionOf(heading).replaceAll(/\s+/gu, " ");

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
 * Import the README's server action: its one TypeScript block, written into {@link scratch} with
 * its imports from `@qti-pie/plate` read through the package's own alias, so it runs on this
 * checkout's source.
 *
 * @returns The recipe's `step`.
 */
const serverAction = Effect.fnUntraced(function* serverAction() {
  const [block, ...others] = codeBlocks(sectionOf("### A plain server action")).filter(
    ({ lang }) => lang === "ts",
  );
  assert.lengthOf(others, 0, "the server action is one TypeScript block");

  const file = path.join(scratch, "server-action.ts");
  mkdirSync(scratch, { recursive: true });
  writeFileSync(
    file,
    (block ?? assert.fail("the server action has no TypeScript block")).code.replaceAll(
      `"${packageName}"`,
      '"#plate/index.ts"',
    ),
  );

  const module: unknown = yield* Effect.promise(() => import(file));

  return exportsStep(module) ? module.step : assert.fail("the server action exports no step");
});

/**
 * Open the byte item and its test, each by `open`, the test at `tests/readme.xml` and the item
 * beside it.
 *
 * @returns The test and its items, keyed by item ref: the byte item under both refs.
 */
const byteDelivery = Effect.fnUntraced(function* byteDelivery() {
  const encoder = new TextEncoder();
  const tested = yield* open("tests/readme.xml", encoder.encode(byteTestXml));
  const opened = yield* open("tests/byte.xml", encoder.encode(byteItemXml));
  const test =
    (tested.verdict === "accepted" || tested.verdict === "accepted-with-unsupported") &&
    tested.kind === "test"
      ? tested.accepted
      : assert.fail(`the test is ${tested.verdict} on a ${tested.kind}, not an accepted test`);
  const item = Option.getOrElse(acceptedItem(opened), () =>
    assert.fail(`the item is ${opened.verdict}, not an accepted item`),
  );

  return {
    items: new Map([
      ["byte", item],
      ["again", item],
    ]),
    test,
  };
});

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

describe("README.md", () => {
  it("opens with the rule's block, verbatim", () => {
    assert.strictEqual(readme().slice(0, opening.length), opening);
  });

  it("[Q-12] names inline choice among the interactions the paragraph after the opening says plate renders", () => {
    const [paragraph = ""] = readme()
      .slice(opening.length)
      .trimStart()
      .split(/\n{2,}/u);
    const sentence =
      paragraph
        .replaceAll("\n", " ")
        .split(/(?<=\.) /u)
        .find((candidate) => candidate.startsWith("plate renders ")) ??
      assert.fail('the paragraph after the opening has no sentence that starts "plate renders"');

    for (const interaction of ["choice", "inline choice", "text entry", "extended text"]) {
      assert.include(sentence, interaction, `the sentence names ${interaction}`);
    }
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

  it("names begin and score as the writers of StoredRecord in the records table", () => {
    const row =
      sectionOf("## Records")
        .split("\n")
        .find((line) => line.startsWith("| `StoredRecord`")) ??
      assert.fail("the records table has no StoredRecord row");
    const writtenBy = row.split(" | ")[2] ?? "";

    assert.include(writtenBy, "`begin`");
    assert.include(writtenBy, "`score`");
  });

  it("says in Records that the record, ItemView and Restored are server data", () => {
    const paragraphs = sectionOf("## Records")
      .split(/\n{2,}/u)
      .map((paragraph) => paragraph.replaceAll("\n", " "));

    assert.isTrue(
      paragraphs.some(
        (paragraph) =>
          paragraph.includes("server data") &&
          paragraph.includes("`ItemView`") &&
          paragraph.includes("`Restored`"),
      ),
      "a paragraph of Records names ItemView and Restored as server data",
    );
  });

  it("names the record's type in Records as Restored[\"record\"], and redact's narrower one through Parameters", () => {
    const paragraphs = sectionOf("## Records")
      .split(/\n{2,}/u)
      .map((paragraph) => paragraph.replaceAll("\n", " "));

    assert.isTrue(
      paragraphs.some(
        (paragraph) =>
          paragraph.includes("`ItemRecord`") &&
          paragraph.includes('`Restored["record"]`') &&
          paragraph.includes("`Parameters<typeof redact>[1]`"),
      ),
      "a paragraph of Records names the record's type Restored[\"record\"] and redact's through Parameters",
    );
  });

  it('says configure reads a seed of "" as no seed, so a startTest session\'s shuffles follow the instance alone', () => {
    const paragraphs = markdownLines(readme())
      .filter(({ code }) => !code)
      .map(({ line }) => line)
      .join("\n")
      .split(/\n{2,}/u)
      .map((paragraph) => paragraph.replaceAll("\n", " "));

    assert.isTrue(
      paragraphs.some(
        (paragraph) =>
          /`configure` reads a `seed` of `""` as no seed/u.test(paragraph) &&
          paragraph.includes("`startTest`") &&
          paragraph.includes("follow the instance alone"),
      ),
      'a paragraph says configure reads a seed of "" as no seed, so a startTest session\'s shuffles follow the instance alone',
    );
  });

  it("passes the session item's record and configuration to redact in Start's test and the server action", () => {
    for (const heading of ["## Start", "### A plain server action"]) {
      const scripts = codeBlocks(sectionOf(heading)).map(scriptOf);

      assert.isTrue(
        scripts.some((script) =>
          /redact\(items\.get\(shown\.ref\)!, shown\.record, shown\.configuration\)/u.test(script),
        ),
        `${heading} passes shown.record and shown.configuration to redact`,
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

  it("names postings where Start and the Functions table say how a post is decoded", () => {
    const rows = sectionOf("## Functions")
      .split("\n")
      .filter((line) => line.startsWith("| `"));

    assert.include(sectionOf("## Start"), "`postings`");
    assert.isTrue(
      rows.some((row) => row.includes("`postings`") && row.includes("`decode`")),
      "a row of the Functions table names postings beside decode",
    );
  });

  it("imports plate's stylesheet in the Astro snippet, so Astro links it", () => {
    const [snippet, ...others] = codeBlocks(sectionOf("## Hosts")).filter(
      ({ lang }) => lang === "astro",
    );
    assert.lengthOf(others, 0, "Hosts holds one Astro snippet");

    const specifiers = readImports(
      scriptOf(snippet ?? assert.fail("Hosts holds no Astro snippet")),
    ).imports.map(({ specifier }) => specifier);

    assert.include(specifiers, `${packageName}/styles.css`);
  });

  it("says in Navigation that advance ignores the responses a step carries for a closed item", () => {
    const paragraphs = sectionOf("## Navigation")
      .split(/\n{2,}/u)
      .map((paragraph) => paragraph.replaceAll("\n", " "));

    assert.isTrue(
      paragraphs.some(
        (paragraph) =>
          paragraph.includes("`advance`") &&
          paragraph.includes("closed") &&
          paragraph.includes("ignores"),
      ),
      "a paragraph of Navigation says advance ignores a closed item's responses",
    );
  });

  it("says in Navigation that advance refuses a step whose responses do not fit with StepResponseMisfit", () => {
    const paragraphs = sectionOf("## Navigation")
      .split(/\n{2,}/u)
      .map((paragraph) => paragraph.replaceAll("\n", " "));

    assert.isTrue(
      paragraphs.some(
        (paragraph) =>
          paragraph.includes("`advance`") &&
          paragraph.includes("`StepResponseMisfit`") &&
          paragraph.includes("refuses"),
      ),
      "a paragraph of Navigation says advance refuses a misfit step with StepResponseMisfit",
    );
  });

  it("names outputBudget and OutputTooLarge in the paragraph of Scoring that advises a time limit", () => {
    const paragraphs = sectionOf("## Scoring")
      .split(/\n{2,}/u)
      .map((paragraph) => paragraph.replaceAll("\n", " "));

    assert.isTrue(
      paragraphs.some(
        (paragraph) =>
          paragraph.includes("time limit") &&
          paragraph.includes("`outputBudget`") &&
          paragraph.includes("`OutputTooLarge`"),
      ),
      "the paragraph of Scoring that advises a time limit names outputBudget and OutputTooLarge",
    );
  });

  it("names redact beside outputBudget in the paragraph of Scoring that advises a time limit", () => {
    const paragraphs = sectionOf("## Scoring")
      .split(/\n{2,}/u)
      .map((paragraph) => paragraph.replaceAll("\n", " "));

    assert.isTrue(
      paragraphs.some(
        (paragraph) =>
          paragraph.includes("time limit") &&
          paragraph.includes("`outputBudget`") &&
          paragraph.includes("`redact`"),
      ),
      "the paragraph of Scoring that advises a time limit names redact beside outputBudget",
    );
  });

  it("says in Scoring that a test's SCORE and MAXSCORE may have any base type", () => {
    const paragraphs = sectionOf("## Scoring")
      .split(/\n{2,}/u)
      .map((paragraph) => paragraph.replaceAll("\n", " "));

    assert.isTrue(
      paragraphs.some(
        (paragraph) =>
          paragraph.includes("`SCORE`") &&
          paragraph.includes("`MAXSCORE`") &&
          paragraph.includes("any base type"),
      ),
      "a paragraph of Scoring says a test's SCORE and MAXSCORE may have any base type",
    );
  });

  it("[T-9] says, of outcome processing in the README, that each run starts from the declared defaults after an individual part's item, after a simultaneous part and at the test's close", () => {
    const section = sectionOf("## Outcome processing");
    const runs = section
      .split("\n")
      .filter((line) => line.startsWith("- after") || line.startsWith("- once"));

    assert.include(section.replaceAll("\n", " "), "each time from the declared defaults");
    assert.lengthOf(runs, 3, "Outcome processing lists the three times a run happens");
    assert.isTrue(
      runs.some((line) => line.includes("individual part")),
      "a run follows the submission of an individual part's item",
    );
    assert.isTrue(
      runs.some((line) => line.includes("simultaneous part")),
      "a run follows a simultaneous part's submission",
    );
    assert.isTrue(
      runs.some((line) => line.includes("test closes")),
      "a run happens when the test closes",
    );
  });

  it("[T-9] says what results write of a test's own outcomes with no outcome processing and with a marked one", () => {
    assert.isTrue(
      paragraphsOf("## Outcome processing").some(
        (paragraph) =>
          paragraph.includes("`results` writes the test's outcomes as the session holds them") &&
          paragraph.includes("no outcome processing writes its outcomes' defaults") &&
          paragraph.includes("the verdict marks writes none of its own"),
      ),
      "a paragraph of Outcome processing says what results write for each state",
    );
  });

  it("[T-9] names in Outcome processing each of the eight expressions only a test may hold", () => {
    const section = sectionOf("## Outcome processing");

    for (const kind of outcomeOnly) {
      assert.include(section, `\`${kind}\``);
    }
  });

  it("[T-9] gives in Scoring the number of expressions plate runs, all of them, none left unlanded, and names qti-field-value", () => {
    assert.isTrue(
      paragraphsOf("## Scoring").some(
        (paragraph) =>
          paragraph.includes(
            `Of the ${String(expressionKinds.length)} expressions QTI 3.0 defines, plate runs ${String(expressionKinds.length)}.`,
          ) && paragraph.includes("`qti-field-value`"),
      ),
      "a paragraph of Scoring gives the count of expressions plate runs and names qti-field-value",
    );
    assert.notInclude(
      sectionOf("## Scoring"),
      "- `qti-field-value`",
      "Scoring no longer lists qti-field-value among the marks",
    );
  });

  it("[T-9] says in Scoring that a duration is held in seconds and that open refuses an ISO 8601 one with value-type", () => {
    assert.isTrue(
      paragraphsOf("## Scoring").some(
        (paragraph) =>
          paragraph.includes("A duration is a number of seconds") &&
          paragraph.includes("`PT1M30.5S`") &&
          paragraph.includes("`value-type`") &&
          paragraph.includes("`qti-duration-lt`") &&
          paragraph.includes("`qti-duration-gte`"),
      ),
      "a paragraph of Scoring says how a duration is held, written and compared",
    );
  });

  it("[T-9] says in Template processing when a test session evaluates an item ref's template defaults, and that one that does not fit is EngineFailure", () => {
    const section = sectionOf("## Template processing").replaceAll("\n", " ");

    for (const sentence of [
      "an item ref's `qti-template-default` gives a template variable the value its template processing starts from",
      "A linear part evaluates an item's defaults when it first shows the item",
      "A nonlinear part evaluates the defaults of all its items when it starts",
      "`startTest` fails with `EngineFailure` when a default of its first part",
      "`advance` fails with it",
    ]) {
      assert.include(section, sentence);
    }
  });

  it("[T-9] names EngineFailure in the Functions table's startTest row", () => {
    const row =
      sectionOf("## Functions")
        .split("\n")
        .find((line) => line.startsWith("| `startTest` |")) ??
      assert.fail("the Functions table has no startTest row");

    assert.include(row, "`EngineFailure`");
  });

  it("[T-9] lists in Records what decodeSession refuses of a session that does not fit the test it is given", () => {
    const section = sectionOf("## Records");
    const listed = section.split("\n").filter((line) => line.startsWith("- "));

    assert.include(
      section.replaceAll("\n", " "),
      "It refuses with `InvalidSession` a session that does not fit",
    );
    for (const field of ["items", "parts", "record", "dates", "position", "outcomes"]) {
      assert.isTrue(
        listed.some((line) => line.includes(field)),
        `Records lists what decodeSession checks of a session's ${field}`,
      );
    }
    assert.notInclude(section, "does not check the session's items");
  });

  it("[T-9] names OutputTooLarge's limit field and redact's range for a budget in Scoring's time-limit paragraph", () => {
    assert.isTrue(
      paragraphsOf("## Scoring").some(
        (paragraph) =>
          paragraph.includes("time limit") &&
          paragraph.includes("`limit`") &&
          paragraph.includes('`"text"`') &&
          paragraph.includes('`"budget"`') &&
          paragraph.includes("outside 1 to 536,870,888"),
      ),
      "the paragraph of Scoring that advises a time limit names limit and redact's range",
    );
  });

  it("[T-9] states the gate repair in the README: the marks, the NULL reads, the attempts a test reads, the new refusals and the seed itemView carries", () => {
    const outcomes = flatSectionOf("## Outcome processing");

    for (const fragment of [
      "the `duration` of a part, a section or an item ref, such as `ITEM1.duration` or the occurrence form `ITEM1.1.duration`",
      "In a test that holds a `qti-assessment-section-ref`, it also marks a dotted name that does not start with a part, section or item ref of the test document itself",
      "So do a `qti-variable`, `qti-correct` or `qti-default` of a `file` variable, of a `record` outcome or template variable, or of a `record` response with a `file` field",
      "A test's `qti-default` of its own `duration` gives NULL of a single duration",
      "A test reads an item's `numAttempts` as the number of attempts started, the count `results` writes",
      "`qti-number-correct` and `qti-number-incorrect` consider an item's `file` and `record` responses",
      "| A `qti-lookup-outcome-value` of a dotted name whose value is not a single `integer`, `float` or `duration` | `expression-type` | P22 |",
      "A dotted name the test declares whole, such as an outcome named `S.TOTAL`, is that declaration",
      "| A dotted name, read, that two readings resolve, such as `a.b` that the test declares whole beside an item ref `a` whose item declares `b` | `ambiguous-reference` | `prefixed-ref` |",
      '`pattern="{ITEM1.N}"`',
      "| A dotted `qti-correct` that reads anything but a response | `undeclared-variable` | `variable-kind` |",
      "pantry refuses the last three rows too",
      "judges its expressions under each test that reaches it",
    ]) {
      assert.include(outcomes, fragment);
    }
    assert.notInclude(outcomes, "the last two rows");
    assert.notInclude(outcomes, "pantry accepts all three");
    assert.include(
      flatSectionOf("## Server and browser"),
      "`itemView`'s configuration never carries the processing seed",
    );
  });

  it("states round 9h in the README: a value two map entries match maps by the first listed, the XSD cache's folders and the tag of the tests that read the Results Reporting XSD, and a section ref's outcome-only mark", () => {
    assert.include(
      flatSectionOf("## Scoring"),
      "A value that two or more entries of a `qti-mapping` match maps by the first entry listed, as a point that two areas of a `qti-area-mapping` hold maps by the first area listed.",
    );

    const development = flatSectionOf("## Development");

    for (const fragment of [
      "every other XSD in its publisher's folder: `cpext/`, `csm/`, `drd/`, `lom/`, `mathml/`, `ssml/`, `w3/` and `xlink/`",
      "keeps the ASI, metadata, content-packaging and Results Reporting XSDs at its top",
      "[`src/test/xsd-layout.ts`](src/test/xsd-layout.ts) lists each file",
      "The tests that validate against the Results Reporting XSD carry the tag `results-xsd`",
    ]) {
      assert.include(development, fragment);
    }

    const outcomes = flatSectionOf("## Outcome processing");

    assert.include(outcomes, "when the processing holds one of the eight expressions above");
    assert.include(
      outcomes,
      "In a test that holds a `qti-assessment-section-ref`, it also marks a dotted name that does not start with a part, section or item ref of the test document itself",
    );
  });

  it("states repair round 9 in the README: the misplaced mapping, the template default keys decodeSession checks, an identifier given twice, the weighted and collected types, and an item's context variable a test reads", () => {
    const scoring = flatSectionOf("## Scoring");

    assert.include(
      scoring,
      "| A `qti-mapping` in a response declaration of base type `file` or `duration`, or of cardinality `record`, or a `qti-area-mapping` in one whose base type is not `point` | `misplaced-element` | `mapping-base-type` |",
    );
    assert.notInclude(scoring, "first entry listed *(pending)*");

    const recordsSection = flatSectionOf("## Records");

    for (const fragment of [
      "- in a nonlinear part that has started, an item's template defaults are not keyed by exactly the template variables its item ref's `qti-template-default`s set",
      "`decodeSession` does not check the values of an item's template defaults",
    ]) {
      assert.include(recordsSection, fragment);
    }
    assert.notInclude(recordsSection, "`decodeSession` does not check an item's template defaults");

    const outcomes = flatSectionOf("## Outcome processing");

    for (const fragment of [
      "reads an item's context variable through its item ref",
      "there its processing runs and fails at that read with `UnknownIdentifierError`. `open` accepts these",
      "- A weighted `qti-variable` that reads an item's `integer` or `float` variable through its item ref is a `float` of that variable's cardinality",
      "- `qti-outcome-minimum` and `qti-outcome-maximum` give a multiple `float`.",
      "a multiple `integer` when every single `integer` or `float` declaration is `integer`, and a multiple `float` otherwise",
      "`open` checks a test without its items, so it types this collection unknown.",
      "so plate may refuse a package that pantry accepts, but only one that would fail at run time.",
      "| A part, section or item ref identifier given twice across a test and the section documents it reaches, refused at the second | `duplicate-identifier` | `structure-identifier` |",
    ]) {
      assert.include(outcomes, fragment);
    }
    assert.notInclude(outcomes, "plate holds no value of it *(pending)*");
  });

  it("says in Interactions how record answers post and decode, naming stringValue, floatValue and the six integer fields", () => {
    const fields = [
      "stringValue",
      "floatValue",
      "integerValue",
      "leftDigits",
      "rightDigits",
      "ndp",
      "nsf",
      "exponent",
    ];
    const interactions = flatSectionOf("## Interactions");

    assert.isTrue(
      paragraphsOf("## Interactions").some((paragraph) =>
        fields.every((field) => paragraph.includes(`\`${field}\``)),
      ),
      "a paragraph of Interactions names each field a record answer decodes to",
    );
    for (const fragment of [
      "`postings` gives the response a `RecordBinding`",
      "`decode` does not apply a Text Entry's `base` to a record",
      "against its `stringValue` as typed",
      "`expected-length` sets a text control's size only",
    ]) {
      assert.include(interactions, fragment);
    }
    assert.notInclude(interactions, "does not take `record` answers yet");
  });

  it("names in the Records rows where record answers are stored: records in StoredRecord and saved in StoredTestSession", () => {
    const rows = sectionOf("## Records").split("\n");
    const row = (record: string): string =>
      rows.find((line) => line.startsWith(`| \`${record}\``)) ??
      assert.fail(`the records table has no ${record} row`);

    assert.include(row("StoredRecord"), "`record` answers in `records`");
    assert.include(row("StoredTestSession"), "`record` answers in `saved`");
  });

  it("names RecordOperandError beside EngineFailure in the Functions table, and ResponseValue where a map holds record answers", () => {
    const exported = readImports(packageFile("src/index.ts")).imports.flatMap(({ names }) =>
      names.map(({ name }) => name),
    );
    const rows = sectionOf("## Functions")
      .split("\n")
      .filter((line) => line.startsWith("| `"));
    const action = codeBlocks(sectionOf("### A plain server action")).map(scriptOf).join("\n");

    for (const name of ["RecordOperandError", "ResponseValue", "RecordValue"]) {
      assert.include(exported, name);
    }
    assert.isTrue(
      rows.some((row) => row.includes("`EngineFailure`") && row.includes("`RecordOperandError`")),
      "a row of the Functions table names RecordOperandError beside EngineFailure",
    );
    assert.isTrue(
      rows.some(
        (row) =>
          row.includes("`decode`") &&
          row.includes("`ResponseValue`") &&
          row.includes("`RecordValue`"),
      ),
      "the Functions table's decode row names ResponseValue and RecordValue",
    );
    assert.include(action, "Record<string, ResponseValue>");
  });

  it("says in Scoring what score, advance and open refuse of record answers: not-a-value, cardinality and missing-attribute", () => {
    const scoring = flatSectionOf("## Scoring");

    for (const fragment of [
      "`score` takes a `record` response's answer as a `RecordValue`",
      "with the problem `not-a-value`",
      "with the problem `cardinality`",
      "with `StepResponseMisfit`",
      "| A `qti-value` without `field-identifier` or `base-type` in the `qti-correct-response` or `qti-default-value` of a `record` declaration | `missing-attribute` |",
    ]) {
      assert.include(scoring, fragment);
    }
  });

  it("states in Scoring the bound on decoding record answers and lists the record variables plate holds no value for among its marks", () => {
    const scoring = flatSectionOf("## Scoring");

    for (const fragment of [
      "`decode` takes no step for a `record` answer that it does not take for an `integer` one",
      "cap the request body",
      "a `record` response with a `file` field, a `record` outcome or template variable, `QTI_CONTEXT` or another context variable",
    ]) {
      assert.include(scoring, fragment);
    }
  });

  it("says how processing reads record answers: a template rule that sets one is marked, and a test reads one through an item ref", () => {
    const template = flatSectionOf("## Template processing");
    const outcomes = flatSectionOf("## Outcome processing");

    assert.include(template, "`record-set`");
    assert.include(
      template,
      "a `record` response always keeps the correct response and default its declaration writes",
    );
    for (const fragment of [
      "such as `ITEM1.RESPONSE`, gives the `record` answer that the item's record holds",
      "A `record` response matches its correct response when the two hold the same fields",
      "`qti-number-responded` counts an item whose `record` response differs from its declared default",
    ]) {
      assert.include(outcomes, fragment);
    }
  });

  it("states gate round 10g in the README: OutcomeMismatchError for a field whose base type is not its variable's, NULL containers over qti-field-value, and a test's record outcome refused as an item's", () => {
    const scoring = flatSectionOf("## Scoring");

    for (const fragment of [
      "`open` accepts a rule that sets a variable from `qti-field-value`, whatever the field, as pantry does.",
      "When the field's base type, or the type of such an expression, is not the variable's, `score` returns `OutcomeMismatchError` and does not throw.",
      "Read the field whose base type is the variable's, such as `floatValue` for a `float`.",
      "A `qti-multiple`, `qti-ordered` or `qti-repeat` built over a `qti-field-value` is NULL too, even when the field holds a value",
    ]) {
      assert.include(scoring, fragment);
    }
    assert.include(
      flatSectionOf("## Template processing"),
      "that `qti-field-value` reads. `openPackage` accepts it, and `startTest` or `advance` returns `OutcomeMismatchError` when its type is not the template variable's",
    );

    const outcomes = flatSectionOf("## Outcome processing");

    for (const fragment of [
      "in its outcome processing or in an item ref's template default",
      "is not the variable's, `startTest` or `advance` returns `OutcomeMismatchError` and does not throw.",
      "`open` refuses a test's `record` outcome declaration as it refuses an item's.",
      "and with `value-type` one whose text is not of its own `base-type`",
    ]) {
      assert.include(outcomes, fragment);
    }
  });

  it("states repair round 10r in the README: a record outcome or template variable read through an item ref is NULL and a context variable is never read, an aggregate over a field fails as the field does, startTest returns it, and two records match as wholes", () => {
    const outcomes = flatSectionOf("## Outcome processing");

    for (const fragment of [
      "plate never reads a context variable through an item ref. `openPackage` marks the processing that reads one, or leaves out the template default. When you `open` a test and its items one at a time, that read fails with `UnknownIdentifierError`.",
      "When the field's base type, or the type of an expression over it such as a `qti-sum`, is not the variable's, `startTest` or `advance` returns `OutcomeMismatchError` and does not throw.",
      "`startTest` returns it for a default that it applies as the first part starts, since a default can read a field of the record an item's declaration writes, through `qti-default` or `qti-correct`, before anyone answers.",
      "read the field whose base type is the variable's, and keep the type of an expression over a field fixed.",
    ]) {
      assert.include(outcomes, fragment);
    }
    assert.notInclude(outcomes, "of a `record` variable other than a response");

    const scoring = flatSectionOf("## Scoring");

    for (const fragment of [
      "such as a `qti-sum` or `qti-max` over the field.",
      "A rule that sets the `integer` `COUNT` from the `qti-sum` of `integerValue` and `2.0` also fails for `12`, because that sum is a `float`.",
      "Keep the type of an expression over a field fixed: for example, set a `float` from a sum that includes a `float`.",
      "`qti-match` compares two records as wholes, so they match only when they hold the same fields with the same values *(pending)*.",
      "A correct response that writes only `stringValue` therefore never matches a typed `12`.",
      "compare one field instead: the `qti-field-value` of `stringValue` with `qti-match`, or that of `floatValue` with `qti-equal`.",
    ]) {
      assert.include(scoring, fragment);
    }
  });

  it.effect("runs the plain server action on a base-16 Text Entry, which scores ff as 255", () =>
    Effect.gen(function* runsServerAction() {
      const step = yield* serverAction();
      const configuration = yield* configure({});
      const { items, test } = yield* byteDelivery();
      const session = ok(
        startTest(test, items, configuration, {
          instance: "readme",
          now: new Date("2026-11-01T09:00:00.000Z"),
        }),
        "startTest",
      );
      const shown = ok(current(test, session, configuration), "current");
      const entries: readonly Entry[] = [
        [
          entryName(shown.kind === "item" ? shown.instance : assert.fail("no item"), "RESPONSE"),
          "ff",
        ],
        [intentName(session.instance), encodeIntent({ kind: "submit-item" })],
      ];
      const stored = ok(
        step(test, items, ok(encodeSession(session), "encodeSession"), entries, configuration),
        "the server action",
      );
      const [byte] = ok(decodeSession(stored, test), "decodeSession").items;

      assert.deepStrictEqual(byte?.record.responses["RESPONSE"], integer(255n));
      assert.deepStrictEqual(byte?.record.outcomes["TOTAL"], integer(255n));
    }),
  );

  it.effect(
    "runs the plain server action through submit-item and a next that posts only the intent, and results report the submitted ff",
    () =>
      Effect.gen(function* keepsSubmitted() {
        const step = yield* serverAction();
        const configuration = yield* configure({});
        const { items, test } = yield* byteDelivery();
        const session = ok(
          startTest(test, items, configuration, {
            instance: "readme",
            now: new Date("2026-11-01T09:00:00.000Z"),
          }),
          "startTest",
        );
        const shown = ok(current(test, session, configuration), "current");
        const submitted = ok(
          step(
            test,
            items,
            ok(encodeSession(session), "encodeSession"),
            [
              [
                entryName(
                  shown.kind === "item" ? shown.instance : assert.fail("no item"),
                  "RESPONSE",
                ),
                "ff",
              ],
              [intentName(session.instance), encodeIntent({ kind: "submit-item" })],
            ],
            configuration,
          ),
          "the server action's submit-item",
        );
        // The submitted item renders disabled, and a browser posts no entry for a disabled control.
        const moved = ok(
          step(
            test,
            items,
            submitted,
            [[intentName(session.instance), encodeIntent({ kind: "next" })]],
            configuration,
          ),
          "the server action's next",
        );
        const xml = ok(
          results({ context: {}, items, kind: "test", session: moved, test }),
          "results",
        );
        const reported =
          /<itemResult identifier="byte"[^>]*>[\s\S]*?<responseVariable identifier="RESPONSE"(?<tag>[^>]*)>(?<body>[\s\S]*?)<\/responseVariable>/u.exec(
            xml,
          )?.groups ?? assert.fail("the results hold no RESPONSE for byte");

        assert.strictEqual(ok(decodeSession(moved, test), "decodeSession").position, 1);
        assert.include(reported["tag"], 'answeredStatus="answered"');
        assert.include(reported["body"], "<value>255</value>");
      }),
  );

  it("names the licence package.json declares, MIT, on License's first line, and links NOTICE", () => {
    const { license } = Schema.decodeUnknownSync(Manifest)(JSON.parse(packageFile("package.json")));
    const [first, ...rest] = sectionOf("## License").trim().split("\n");

    assert.strictEqual(license, "MIT");
    assert.strictEqual(first, license);
    assert.include(rest.join("\n"), "[NOTICE](NOTICE)");
  });

  it("holds in NOTICE every line of math.ts's opening legal comment, in order", () => {
    assert.include(packageFile("NOTICE"), legalNotice().join("\n"));
  });
});
