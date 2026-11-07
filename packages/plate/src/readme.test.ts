import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Result, Schema } from "effect";
import { storedVersion } from "#plate/codec/record.ts";
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
