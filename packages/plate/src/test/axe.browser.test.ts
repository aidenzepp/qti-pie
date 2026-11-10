import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
import { darkPalette, fallbackPalette, palettes } from "#plate/test/axe-page.ts";
import { checkPage, sweepMembers, sweepText } from "#plate/test/axe.ts";
import type { SweepReport } from "#plate/test/axe.ts";
import { eachEngine, withPage } from "#plate/test/browsers.ts";
import { openCorpus } from "#plate/test/sweep.ts";

/**
 * The scratch corpus this file owns, under the package's git-ignored `work/`. Its name is new for
 * each run, so two runs at once never share or remove each other's files.
 */
const scratch = path.resolve(import.meta.dirname, "..", "..", "work", `axe-test-${randomUUID()}`);

/**
 * The XML head every scratch item shares, as `fixtures/m2/items` write theirs: the QTI 3.0
 * namespace and an item the validator accepts.
 */
const itemOpen = (identifier: string, title: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${title}" adaptive="false" time-dependent="false">\n`;

/**
 * The scratch corpus's documents, written fresh for this file: a Choice and a Text Entry the
 * validator accepts, and a document that is not well-formed, which it refuses.
 */
const documents: ReadonlyMap<string, string> = new Map([
  [
    "a/choice.xml",
    `${itemOpen("sweep-choice", "Largest river")}  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>B</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-prompt>Which of these rivers is the longest?</qti-prompt>
      <qti-simple-choice identifier="A">The Rhine</qti-simple-choice>
      <qti-simple-choice identifier="B">The Nile</qti-simple-choice>
      <qti-simple-choice identifier="C">The Thames</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>
`,
  ],
  [
    "b/text-entry.xml",
    `${itemOpen("sweep-text", "Capital city")}  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>Paris</qti-value>
    </qti-correct-response>
    <qti-mapping default-value="0">
      <qti-map-entry map-key="Paris" mapped-value="1" case-sensitive="false"/>
    </qti-mapping>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <p>The capital of France is <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="8"/>, a city on the Seine.</p>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>
`,
  ],
  ["c/refused.xml", "<qti-assessment-item>"],
]);

/**
 * Two adjacent buttons, each 10 by 10 CSS px with no padding, margin or minimum size, so neither
 * reaches the 24 px target and the spacing between them gives neither the room WCAG 2.5.8 allows.
 */
const smallButtons = ["a", "b"]
  .map(
    (label) =>
      `<button style="width:10px;height:10px;padding:0;margin:0;min-width:0;min-height:0">${label}</button>`,
  )
  .join("");

beforeAll(() => {
  for (const [member, text] of documents) {
    const file = path.join(scratch, member);

    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
});

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

eachEngine((it, name) => {
  it.effect(
    "[sweep] the shell alone is clean: an empty main under each palette reports no violation",
    () =>
      withPage({ javaScriptEnabled: true }, (page) =>
        Effect.gen(function* emptyShell() {
          for (const palette of palettes) {
            const check = yield* checkPage(page, "", palette);

            assert.deepStrictEqual(check.violations, [], palette.name);
          }
        }),
      ),
  );

  it.effect("[sweep] an img with no alt inside a part reports image-alt on that part", () =>
    withPage({ javaScriptEnabled: true }, (page) =>
      Effect.gen(function* imageWithoutAlt() {
        const check = yield* checkPage(
          page,
          '<div data-slot="choice-interaction"><img src="a.png"></div>',
          fallbackPalette,
        );

        assert.deepStrictEqual(
          check.violations.map(({ part, rule }) => ({ part, rule })),
          [{ part: "choice-interaction", rule: "image-alt" }],
        );
      }),
    ),
  );

  it.effect(
    "[sweep] text below 4.5:1 on the fallback surface reports color-contrast, and text at 4.5:1 or more does not",
    () =>
      withPage({ javaScriptEnabled: true }, (page) =>
        Effect.gen(function* contrastOnFallbacks() {
          const low = yield* checkPage(
            page,
            '<p style="color:oklch(0.8 0 0)">text</p>',
            fallbackPalette,
          );
          const high = yield* checkPage(
            page,
            '<p style="color:oklch(0.3 0 0)">text</p>',
            fallbackPalette,
          );

          assert.deepStrictEqual(
            low.violations.map(({ part, rule }) => ({ part, rule })),
            [{ part: "page", rule: "color-contrast" }],
          );
          assert.deepStrictEqual(high.violations, []);
        }),
      ),
  );

  it.effect(
    "[sweep] the .dark palette measures against the dark surface: dark text that passes on white fails there",
    () =>
      withPage({ javaScriptEnabled: true }, (page) =>
        Effect.gen(function* contrastOnDark() {
          const body = '<p style="color:oklch(0.205 0 0)">text</p>';
          const onLight = yield* checkPage(page, body, fallbackPalette);
          const onDark = yield* checkPage(page, body, darkPalette);

          assert.deepStrictEqual(onLight.violations, []);
          assert.deepStrictEqual(
            onDark.violations.map(({ rule }) => rule),
            ["color-contrast"],
          );
        }),
      ),
  );

  it.effect(
    "[sweep] a best-practice rule does not run: a heading that skips a level reports nothing",
    () =>
      withPage({ javaScriptEnabled: true }, (page) =>
        Effect.gen(function* headingSkipsALevel() {
          const check = yield* checkPage(page, "<h1>a</h1><h3>b</h3>", fallbackPalette);

          assert.deepStrictEqual(check.violations, []);
        }),
      ),
  );

  it.effect(
    "[sweep] a WCAG 2.2 rule runs: a 10 by 10 px button beside another reports target-size",
    () =>
      withPage({ javaScriptEnabled: true }, (page) =>
        Effect.gen(function* smallTargets() {
          const check = yield* checkPage(page, smallButtons, fallbackPalette);

          assert.deepStrictEqual(
            [...new Set(check.violations.map(({ rule }) => rule))],
            ["target-size"],
          );
        }),
      ),
  );

  it.effect("[sweep] contrast-only checks run only color-contrast", () =>
    withPage({ javaScriptEnabled: true }, (page) =>
      Effect.gen(function* contrastOnly() {
        const image = '<img src="a.png">';
        const every = yield* checkPage(page, image, fallbackPalette);
        const contrast = yield* checkPage(page, image, fallbackPalette, "contrast");

        assert.deepStrictEqual(
          every.violations.map(({ rule }) => rule),
          ["image-alt"],
        );
        assert.deepStrictEqual(contrast, { incomplete: [], violations: [] });
      }),
    ),
  );

  it.effect(
    "[sweep] sweepMembers over a scratch corpus of two fresh items and one refused document sweeps each item four times and skips the refused one",
    () =>
      Effect.gen(function* overScratchCorpus() {
        const members = yield* openCorpus.pipe(
          Effect.provide(
            ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: scratch })),
          ),
        );

        assert.deepStrictEqual(members.map((member) => member.location).toSorted(), [
          "a/choice.xml",
          "b/text-entry.xml",
          "c/refused.xml",
        ]);

        const rows = yield* sweepMembers(members);
        const locations = [...new Set(rows.map((row) => row.location))].toSorted();
        const sweptFor = (location: string) =>
          rows
            .filter((row) => row.location === location)
            .map((row) => `${row.state} / ${row.palette}`)
            .toSorted();

        assert.strictEqual(rows.length, 8);
        assert.deepStrictEqual(locations, ["a/choice.xml", "b/text-entry.xml"]);
        for (const location of locations) {
          assert.deepStrictEqual(
            sweptFor(location),
            [
              "disabled / fallbacks",
              "messages and posted text / .dark",
              "messages and posted text / fallbacks",
              "no inputs / fallbacks",
            ],
            location,
          );
        }
        assert.isTrue(
          rows.every((row) => row.engine === name),
          "each row names the engine it ran in",
        );
        assert.deepStrictEqual(
          rows.flatMap((row) =>
            row.check.violations.map(
              ({ part, rule }) => `${row.location} ${row.state} ${rule} ${part}`,
            ),
          ),
          [],
        );
      }),
  );

  it("[sweep] sweepText names each violation by location, state, palette, engine, rule and part, and ends with the totals line", () => {
    const clean = { incomplete: [], violations: [] };
    const report: SweepReport = {
      engines: [{ name, version: "1.0" }],
      items: 2,
      renders: 8,
      rows: [
        {
          check: {
            incomplete: [
              { impact: "serious", part: "page", rule: "color-contrast" },
              { impact: "serious", part: "choice-interaction", rule: "color-contrast" },
              { impact: "minor", part: "page", rule: "aria-allowed-role" },
            ],
            violations: [{ impact: "critical", part: "choice-interaction-control", rule: "label" }],
          },
          engine: name,
          location: "a/choice.xml",
          palette: ".dark",
          state: "disabled",
        },
        {
          check: clean,
          engine: name,
          location: "b/text-entry.xml",
          palette: "fallbacks",
          state: "no inputs",
        },
      ],
    };
    const lines = sweepText(report).trimEnd().split("\n");
    const violationLines = lines.filter((line) => line.includes("choice-interaction-control"));
    const [violationLine = ""] = violationLines;

    assert.lengthOf(violationLines, 1);
    for (const field of ["a/choice.xml", "disabled", ".dark", name, "label"]) {
      assert.include(violationLine, field);
    }
    assert.isTrue(
      lines.includes("incomplete color-contrast: 2"),
      "an incomplete count per rule, named",
    );
    assert.isTrue(
      lines.includes("incomplete aria-allowed-role: 1"),
      "an incomplete count per rule, named",
    );
    assert.strictEqual(lines.at(-1), "items 2, renders 8, violations 1, incomplete 3");
  });
});
