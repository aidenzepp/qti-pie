/**
 * A variable mapping's source is judged by the item's first declaration of its name, in document
 * order, on the import's rows as in the law oracle (issue #69). The import's
 * `MappingSourceDeclaration` holds the first declaration of a repeated name, as the document
 * builder keeps it (`declarationsOf` in `#pantry/import/overlays/expressions.ts`), and "Variable
 * mapping source" refuses it where it is no outcome. The law oracle passed the mapping where any
 * declaration of the name was an outcome, so the differential reported `import-only-law: ...
 * Variable mapping source` for an item that declares the name first as a response and then as an
 * outcome. "Declaration key" refuses the repeated name on both sides, so no verdict moved; only the
 * law set differed.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`).
 *
 * Bound: one test whose one item ref maps the source `SCORE` of the one item it names, over the
 * item's declarations of `SCORE`, each with a cardinality and a base type: [69-1] a response and
 * then an outcome, [69-2] an outcome and then a response, [69-3] an outcome alone and [69-4] a
 * response alone. 4 cases, exhausted. No case shows a disagreement. Both sides name "Variable
 * mapping source" for [69-1] and [69-4], whose first declaration is a response, and "Declaration
 * key" for [69-1] and [69-2], which declare `SCORE` twice. [69-2] also breaks the item's content
 * order in the oracle, a response declaration after an outcome declaration, which no disagreement
 * reports and this file does not judge.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { lawTable } from "#pantry/vocab/laws.ts";

/**
 * The timeout, in milliseconds, that this file's test states: a hang guard, never a budget.
 * Measured 2026-11-10: 1.1 s at a load average of 72 to 317, its one test, the slowest of three
 * runs. The value is over 500 times that, so it stays 600_000.
 */
const testTimeoutMs = 600_000;

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The text every XML file of the cases opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n';

/**
 * The manifest that lists the item and the test whose item ref names it.
 */
const manifest = `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="item" type="imsqti_item_xmlv3p0" href="items/item.xml"><file href="items/item.xml"/></resource><resource identifier="test" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource></resources></manifest>`;

/**
 * The test whose one item ref, ref1, maps the item's `SCORE` to `ITEMSCORE`, a name its item
 * declares nothing under.
 */
const test = `${declaration}<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="T"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="S" visible="true"><qti-assessment-item-ref identifier="ref1" href="items/item.xml"><qti-variable-mapping source-identifier="SCORE" target-identifier="ITEMSCORE"/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * A declaration of `SCORE` as a response: a single float, the type "Reserved type" holds an outcome
 * of that name to.
 */
const response =
  '<qti-response-declaration identifier="SCORE" cardinality="single" base-type="float"/>';

/**
 * A declaration of `SCORE` as an outcome: a single float.
 */
const outcome =
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>';

/**
 * The package whose item holds the declarations given, in document order.
 *
 * @param declarations - The item's declarations of `SCORE`, as written.
 * @returns The package's entries.
 */
const packageOf = (declarations: readonly string[]): PackageEntries =>
  new Map(
    Object.entries({
      "imsmanifest.xml": manifest,
      "items/item.xml": `${declaration}<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="I" title="I" adaptive="false" time-dependent="false">${declarations.join("")}</qti-assessment-item>`,
      "test.xml": test,
    }).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  );

/**
 * The laws this file judges each side's verdict for, whatever else a side names: "Declaration key",
 * which refuses a name the item declares twice, and "Variable mapping source", which refuses a
 * source that is no outcome.
 */
const lawsInPlay = ["Declaration key", "Variable mapping source"] as const;

/**
 * One case: what it is, its package, and which of the {@link lawsInPlay} both sides name.
 */
interface Case {
  readonly entries: PackageEntries;
  readonly name: string;
  readonly raised: readonly (typeof lawsInPlay)[number][];
}

/**
 * Every case of the bound, issue #69's four shapes of one source name's declarations.
 */
const cases: readonly Case[] = [
  {
    entries: packageOf([response, outcome]),
    name: "[69-1] a response and then an outcome",
    raised: ["Declaration key", "Variable mapping source"],
  },
  {
    entries: packageOf([outcome, response]),
    name: "[69-2] an outcome and then a response",
    raised: ["Declaration key"],
  },
  {
    entries: packageOf([outcome]),
    name: "[69-3] an outcome alone",
    raised: [],
  },
  {
    entries: packageOf([response]),
    name: "[69-4] a response alone",
    raised: ["Variable mapping source"],
  },
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "a variable mapping whose item declares its source's name more than once",
  (it) => {
    it.effect(
      "is judged by the first declaration, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* variableMappingSourceFirstRuns() {
            const directory = yield* scratchDirectory("variable-mapping-source-first-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(cases.length, 4);
            assert.strictEqual(lawTable["Declaration key"].rule, "declaration-key");
            assert.strictEqual(lawTable["Variable mapping source"].rule, "variable-mapping-source");

            return yield* exhaust(
              {
                box: "the 4 declarations of one mapped source name: a response and then an outcome, an outcome and then a response, an outcome alone and a response alone",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => cases[at]?.name ?? String(at),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/variable-mapping-source-first-declaration",
              },
              (at) =>
                Effect.gen(function* variableMappingSourceFirstCase() {
                  const of = cases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const judged = yield* judgeOne(yield* genomeOf(of.entries), bench, at);
                  const shown = judged.disagreements.map(shownDisagreement);
                  const said = `${of.name}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}; disagreements: ${shown.join(" | ") || "none"}`;

                  assert.deepStrictEqual(shown, [], said);
                  for (const side of ["import", "oracle"] as const) {
                    for (const law of lawsInPlay) {
                      const named = new RegExp(`\\b${law}\\b`, "u");
                      if (of.raised.includes(law)) {
                        assert.match(judged.summary[side], named, said);
                      } else {
                        assert.notMatch(judged.summary[side], named, said);
                      }
                    }
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );
  },
);
