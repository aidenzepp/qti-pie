/**
 * A test's reference through an item ref that names an LTI link is accepted unchecked (spec reading
 * 110): the link has no declarations to resolve the name against, so "Reference type" (P24) has no
 * declaration to type it by, on the import's rows as in the law oracle. Genetic repair round 4's
 * trace (gr4-0, class O4) found the import refusing such a reference in an integer attribute under
 * "Reference type" where the oracle accepts it, in 3.0.1 with its LTI type `imslti_xmlv1p1` and in
 * 3.0.0 with `imsbasiclti_xmlv1p3`.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`).
 *
 * Bound: one test whose one item ref names an LTI link, its outcome processing setting OUT from a
 * reference through that item ref: an index's `n` in 3.0.1 and in 3.0.0, a significant-figures
 * rounding's `figures` in 3.0.1, and the control, a plain variable read in 3.0.1. 4 cases,
 * exhausted. Each is accepted on both sides.
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

/**
 * The timeout, in milliseconds, that this file's test states: a hang guard, never a budget.
 * Measured 2026-11-09: 0.5 s at a load average of 172 to 358, its one test alone.
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
 * The manifest that lists the test and the LTI link its item ref names.
 *
 * @param version - The package's schema version.
 * @param linkType - The link resource's type: `imslti_xmlv1p1` in 3.0.1, `imsbasiclti_xmlv1p3` in
 *   3.0.0.
 * @returns The manifest's text.
 */
const manifestOf = (version: string, linkType: string): string =>
  `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${version}</schemaversion></metadata><organizations/><resources><resource identifier="test" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource><resource identifier="link" type="${linkType}" href="items/item.xml"><file href="items/item.xml"/></resource></resources></manifest>`;

/**
 * The test whose one item ref, ref1, names the link, its outcome processing setting OUT, a float,
 * to `expression`.
 *
 * @param expression - The set outcome value's expression.
 * @returns The test's text.
 */
const testOf = (expression: string): string =>
  `${declaration}<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="T"><qti-outcome-declaration identifier="OUT" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="S" visible="true"><qti-assessment-item-ref identifier="ref1" href="items/item.xml"/></qti-assessment-section></qti-test-part><qti-outcome-processing><qti-set-outcome-value identifier="OUT">${expression}</qti-set-outcome-value></qti-outcome-processing></qti-assessment-test>`;

/**
 * The LTI link the item ref names.
 */
const link = `${declaration}<cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0" xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0"><blti:title>A link</blti:title><blti:launch_url>https://localhost/launch</blti:launch_url></cartridge_basiclti_link>`;

/**
 * An index into an ordered pair of floats at the number the link reports as N, an integer
 * attribute's reference.
 */
const indexed =
  '<qti-index n="ref1.N"><qti-ordered><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">2</qti-base-value></qti-ordered></qti-index>';

/**
 * A float rounded to the significant figures the link reports as F, an integer attribute's
 * reference.
 */
const rounded =
  '<qti-round-to rounding-mode="significantFigures" figures="ref1.F"><qti-base-value base-type="float">1.5</qti-base-value></qti-round-to>';

/**
 * The link's SCORE, read as a variable.
 */
const read = '<qti-variable identifier="ref1.SCORE"/>';

/**
 * The package of the test that sets OUT to `expression`, with the link of `linkType`.
 *
 * @param version - The package's schema version.
 * @param linkType - The link resource's type.
 * @param expression - The set outcome value's expression.
 * @returns The package.
 */
const packageOf = (version: string, linkType: string, expression: string): PackageEntries =>
  new Map(
    Object.entries({
      "imsmanifest.xml": manifestOf(version, linkType),
      "items/item.xml": link,
      "test.xml": testOf(expression),
    }).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  );

/**
 * One case: what it is and the package.
 */
interface Case {
  readonly entries: PackageEntries;
  readonly name: string;
}

/**
 * Every case of the bound: gr4-0's `O4-lti-idx-301`, `O4-lti-round-301` and `O4-blti-idx-300`,
 * then the control, `O4-lti-var-301`.
 */
const cases: readonly Case[] = [
  {
    entries: packageOf("3.0.1", "imslti_xmlv1p1", indexed),
    name: "a 3.0.1 index at a number an LTI link reports",
  },
  {
    entries: packageOf("3.0.1", "imslti_xmlv1p1", rounded),
    name: "a 3.0.1 rounding to figures an LTI link reports",
  },
  {
    entries: packageOf("3.0.0", "imsbasiclti_xmlv1p3", indexed),
    name: "a 3.0.0 index at a number a basic LTI link reports",
  },
  {
    entries: packageOf("3.0.1", "imslti_xmlv1p1", read),
    name: "a 3.0.1 read of a variable an LTI link reports",
  },
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "a reference through an LTI link",
  (it) => {
    it.effect(
      "is accepted unchecked, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* ltiReferenceRuns() {
            const directory = yield* scratchDirectory("lti-reference-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(cases.length, 4);

            return yield* exhaust(
              {
                box: "the 4 LTI reference cases: an index at a number an LTI link reports, in 3.0.1 and in 3.0.0, a 3.0.1 rounding to figures it reports, and a 3.0.1 read of a variable it reports",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => cases[at]?.name ?? String(at),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/lti-reference",
              },
              (at) =>
                Effect.gen(function* ltiReferenceCase() {
                  const of = cases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const judged = yield* judgeOne(yield* genomeOf(of.entries), bench, at);
                  const said = `${of.name}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;
                  // Neither side breaks a law: the oracle judges no breach, the import builds with
                  // none.
                  assert.deepStrictEqual(judged.disagreements.map(shownDisagreement), [], said);
                  assert.strictEqual(judged.summary.oracle, "laws ", said);
                  assert.strictEqual(judged.summary.import, "built ", said);
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );
  },
);
