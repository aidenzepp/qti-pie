/**
 * A variable mapping under an item ref names its source only where it writes both halves of the
 * pair: the importer writes a `VariableMapping` row only where `source-identifier` and
 * `target-identifier` are both written (`mappingsOf` in `#pantry/import/overlays/tests.ts`), so a
 * mapping that leaves either unwritten has no row, and AL3 alone refuses it (spec reading 155, the
 * absence defaults). The law oracle raised "Variable mapping source" for a written source whose
 * target was unwritten, a law the import's rows cannot break there (genetic repair round 4, O3).
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`).
 *
 * Bound: a test whose one item ref writes no href and holds one mapping that writes its source
 * alone (O3's reduced package), then the controls: gr-6's fixed package, whose one mapping writes
 * its target alone under an item ref that names an item; O3's mapping with its target written; and
 * gr-6's mapping with a source written that names the item's template, no outcome: 4 cases,
 * exhausted. The first two break AL3 in the oracle and "Variable mapping source" on neither side.
 * The third, a written pair under an item ref that names no item, breaks "Variable mapping source"
 * in the oracle, which the host holds no statement of there; the fourth breaks it on both sides.
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
import { fixed, knownEntries } from "#pantry/test/gen/genetic/known.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The timeout, in milliseconds, that this file's test states: a hang guard, never a budget.
 * Measured 2026-11-09: 2.0 s at a load average of 68 to 160, its one test.
 */
const testTimeoutMs = 600_000;

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The text every XML file of O3's package opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

/**
 * O3's package: a manifest that lists one test, whose one item ref writes no href and holds one
 * variable mapping with the attributes given.
 *
 * @param attributes - The variable mapping's attributes as written.
 * @returns The package's entries.
 */
const o3Of = (attributes: string): PackageEntries =>
  new Map([
    [
      "imsmanifest.xml",
      new TextEncoder().encode(
        `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ),
    ],
    [
      "test.xml",
      new TextEncoder().encode(
        `${declaration}<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref><qti-variable-mapping${attributes}/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ),
    ],
  ]);

/**
 * Gr-6's fixed package: an item ref that names an item, whose one declaration is the template `T`,
 * holding one mapping that writes its target alone.
 */
const gr6 = knownEntries(fixed["oracle-only-law: Variable mapping source"]);

/**
 * Gr-6's fixed package with its mapping's attributes replaced by those given.
 *
 * @param attributes - The variable mapping's attributes as written.
 * @returns The package's entries.
 */
const gr6Of = (attributes: string): PackageEntries => {
  const test = new TextDecoder().decode(gr6.get("test.xml"));
  const written = '<qti-variable-mapping target-identifier="X"/>';
  assert.include(test, written, "gr-6's fixed package holds its mapping");

  return new Map(gr6).set(
    "test.xml",
    new TextEncoder().encode(test.replace(written, `<qti-variable-mapping${attributes}/>`)),
  );
};

/**
 * Which side's summary names "Variable mapping source".
 */
type Side = "import" | "oracle";

/**
 * One case: what it is, its package, and each side whose summary names "Variable mapping source".
 * A mapping that writes one half of its pair names it on neither side, and AL3 refuses it.
 */
interface Case {
  readonly entries: PackageEntries;
  readonly name: string;
  readonly raised: readonly Side[];
}

/**
 * Every case of the bound: O3's package, then the controls. The host judges a written pair's
 * source only where its item ref names an item: under O3's item ref, which writes no href, the
 * oracle alone names it, and the host holds no statement of it, so no disagreement shows.
 */
const cases: readonly Case[] = [
  {
    entries: o3Of(' source-identifier="SCORE"'),
    name: "a mapping that writes its source alone (O3)",
    raised: [],
  },
  {
    entries: gr6,
    name: "a mapping that writes its target alone (gr-6's fixed package)",
    raised: [],
  },
  {
    entries: o3Of(' source-identifier="SCORE" target-identifier="SCORE"'),
    name: "a mapping that writes its source and its target, under an item ref that writes no href",
    raised: ["oracle"],
  },
  {
    entries: gr6Of(' source-identifier="T" target-identifier="X"'),
    name: "a mapping that writes its source and its target, under an item ref that names an item",
    raised: ["import", "oracle"],
  },
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "a variable mapping that leaves half of its pair unwritten",
  (it) => {
    it.effect(
      "names nothing, so AL3 alone refuses it on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* variableMappingSourceRuns() {
            const directory = yield* scratchDirectory("variable-mapping-source-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(cases.length, 4);

            return yield* exhaust(
              {
                box: "the 4 mapping cases: one that writes its source alone, one that writes its target alone, and two that write both, under an item ref with no href and under one that names an item",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => cases[at]?.name ?? String(at),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/variable-mapping-source",
              },
              (at) =>
                Effect.gen(function* variableMappingSourceCase() {
                  const of = cases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const judged = yield* judgeOne(yield* genomeOf(of.entries), bench, at);
                  const said = `${of.name}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;
                  const apart = judged.disagreements.filter(
                    (disagreement) =>
                      (disagreement.kind === "oracle-only-law" ||
                        disagreement.kind === "import-only-law") &&
                      disagreement.law === "Variable mapping source",
                  );

                  assert.deepStrictEqual(apart.map(shownDisagreement), [], said);
                  for (const side of ["import", "oracle"] as const) {
                    if (of.raised.includes(side)) {
                      assert.match(judged.summary[side], /\bVariable mapping source\b/u, said);
                    } else {
                      assert.notMatch(judged.summary[side], /\bVariable mapping source\b/u, said);
                    }
                  }
                  if (of.raised.length === 0) {
                    assert.match(judged.summary.oracle, /\bAL3 required\b/u, said);
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );
  },
);
