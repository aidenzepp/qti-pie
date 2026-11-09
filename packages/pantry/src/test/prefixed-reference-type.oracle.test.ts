/**
 * Rule P24 types a prefixed reference as it types an unprefixed one: a variable an item ref's
 * prefix names in place of a literal (`qti-index@n`, `qti-round-to@figures`) is an outcome or a
 * template the item declares or maps, single or of unknown cardinality, of the attribute's
 * reference base or of none (readings 48 and 106). The import's `Reference type` holds every
 * reading so (`Reference_type` on `Reading` and `ReadingCardinality`,
 * `#pantry/qti/expressions.ts`); the law oracle typed only the readings its per-document typing
 * resolves, the test's own declarations, and read a prefixed name as unresolved, which P24 lets
 * pass, so it accepted an integer attribute that reads an item's float (genetic repair round 4,
 * gr4-0's `O4-item-idx-float`). A reading through an LTI link stays unchecked (reading 110).
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`).
 *
 * Bound: one test whose one item ref names an item (or an LTI link) and whose outcome processing
 * reads `ref1.N` (or `ref1.F`, `ref1.numAttempts`) in an integer attribute: gr4-0's
 * `O4-item-idx-float` and its control `O4-item-idx`, then a multiple cardinality, an item template,
 * a mapped float and a mapped integer, an item built-in, `qti-round-to@figures` over a float, and
 * gr4-0's `O4-lti-idx-301`: 9 cases, exhausted. Every case breaks `Reference type` on both sides
 * or on neither; the LTI link's breaks it on neither, since gr4-2b exempts it on the host as the
 * oracle does.
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
 * Measured 2026-11-09: 3.7 s at a load average of 72 to 83, its one test.
 */
const testTimeoutMs = 600_000;

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The text every XML file of a case's package opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

/**
 * The resource type of an item.
 */
const itemType = "imsqti_item_xmlv3p0";

/**
 * The resource type of an LTI link in QTI 3.0.1.
 */
const linkType = "imslti_xmlv1p1";

/**
 * One case's package, gr4-0's O4 shape: a manifest that lists a test and the document its one item
 * ref names, the test, whose outcome processing sets its float outcome to the expression given,
 * and that document.
 *
 * @param of - The package's parts.
 * @param of.version - The manifest's schema version.
 * @param of.type - The resource type of the document the item ref names.
 * @param of.named - The document the item ref names, whole.
 * @param of.mappings - The item ref's content: its variable mappings, if any.
 * @param of.expression - The expression the test sets its outcome to.
 * @returns The package's entries.
 */
const packageOf = (of: {
  readonly expression: string;
  readonly mappings: string;
  readonly named: string;
  readonly type: string;
  readonly version: string;
}): PackageEntries =>
  new Map([
    [
      "imsmanifest.xml",
      new TextEncoder().encode(
        `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${of.version}</schemaversion></metadata><organizations/><resources><resource identifier="test" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource><resource identifier="link" type="${of.type}" href="items/item.xml"><file href="items/item.xml"/></resource></resources></manifest>`,
      ),
    ],
    [
      "test.xml",
      new TextEncoder().encode(
        `${declaration}<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="T"><qti-outcome-declaration identifier="OUT" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="S" visible="true">${of.mappings === "" ? '<qti-assessment-item-ref identifier="ref1" href="items/item.xml"/>' : `<qti-assessment-item-ref identifier="ref1" href="items/item.xml">${of.mappings}</qti-assessment-item-ref>`}</qti-assessment-section></qti-test-part><qti-outcome-processing><qti-set-outcome-value identifier="OUT">${of.expression}</qti-set-outcome-value></qti-outcome-processing></qti-assessment-test>`,
      ),
    ],
    ["items/item.xml", new TextEncoder().encode(of.named)],
  ]);

/**
 * An item that declares the float outcome `SCORE`, then the declarations given.
 *
 * @param declarations - Its further declarations, as written.
 * @returns The item, whole.
 */
const itemOf = (declarations: string): string =>
  `${declaration}<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i1" title="t" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>${declarations}<qti-item-body><p>A.</p></qti-item-body></qti-assessment-item>`;

/**
 * An LTI link, the document gr4-0's LTI variants name.
 */
const link = `${declaration}<cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0" xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0"><blti:title>A link</blti:title><blti:launch_url>https://localhost/launch</blti:launch_url></cartridge_basiclti_link>`;

/**
 * A `qti-index` whose `n`, an integer attribute, reads the name given.
 *
 * @param name - The name `n` reads.
 * @returns The expression.
 */
const indexOf = (name: string): string =>
  `<qti-index n="${name}"><qti-ordered><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">2</qti-base-value></qti-ordered></qti-index>`;

/**
 * The sides whose summaries every case reads.
 */
const sides = ["import", "oracle"] as const;

/**
 * One case: what it is, its package, and whether each side names "Reference type".
 */
interface Case {
  readonly entries: PackageEntries;
  readonly name: string;
  readonly raised: boolean;
}

/**
 * Every case of the bound, in the order of the file's opening comment.
 */
const cases: readonly Case[] = [
  {
    entries: packageOf({
      expression: indexOf("ref1.N"),
      mappings: "",
      named: itemOf(
        '<qti-outcome-declaration identifier="N" cardinality="single" base-type="float"/>',
      ),
      type: itemType,
      version: "3.0.0",
    }),
    name: "qti-index n=ref1.N, the item's float outcome (O4-item-idx-float)",
    raised: true,
  },
  {
    entries: packageOf({
      expression: indexOf("ref1.N"),
      mappings: "",
      named: itemOf(
        '<qti-outcome-declaration identifier="N" cardinality="single" base-type="integer"/>',
      ),
      type: itemType,
      version: "3.0.0",
    }),
    name: "qti-index n=ref1.N, the item's integer outcome (O4-item-idx)",
    raised: false,
  },
  {
    entries: packageOf({
      expression: indexOf("ref1.N"),
      mappings: "",
      named: itemOf(
        '<qti-outcome-declaration identifier="N" cardinality="multiple" base-type="integer"/>',
      ),
      type: itemType,
      version: "3.0.0",
    }),
    name: "qti-index n=ref1.N, the item's multiple integer outcome",
    raised: true,
  },
  {
    entries: packageOf({
      expression: indexOf("ref1.N"),
      mappings: "",
      named: itemOf(
        '<qti-template-declaration identifier="N" cardinality="single" base-type="integer"/>',
      ),
      type: itemType,
      version: "3.0.0",
    }),
    name: "qti-index n=ref1.N, the item's integer template",
    raised: false,
  },
  {
    entries: packageOf({
      expression: indexOf("ref1.N"),
      mappings: '<qti-variable-mapping source-identifier="F" target-identifier="N"/>',
      named: itemOf(
        '<qti-outcome-declaration identifier="F" cardinality="single" base-type="float"/>',
      ),
      type: itemType,
      version: "3.0.0",
    }),
    name: "qti-index n=ref1.N, N mapped from the item's float outcome",
    raised: true,
  },
  {
    entries: packageOf({
      expression: indexOf("ref1.N"),
      mappings: '<qti-variable-mapping source-identifier="I" target-identifier="N"/>',
      named: itemOf(
        '<qti-outcome-declaration identifier="I" cardinality="single" base-type="integer"/>',
      ),
      type: itemType,
      version: "3.0.0",
    }),
    name: "qti-index n=ref1.N, N mapped from the item's integer outcome",
    raised: false,
  },
  {
    entries: packageOf({
      expression: indexOf("ref1.numAttempts"),
      mappings: "",
      named: itemOf(""),
      type: itemType,
      version: "3.0.0",
    }),
    name: "qti-index n=ref1.numAttempts, an item built-in",
    raised: true,
  },
  {
    entries: packageOf({
      expression:
        '<qti-round-to rounding-mode="significantFigures" figures="ref1.F"><qti-base-value base-type="float">1.5</qti-base-value></qti-round-to>',
      mappings: "",
      named: itemOf(
        '<qti-outcome-declaration identifier="F" cardinality="single" base-type="float"/>',
      ),
      type: itemType,
      version: "3.0.0",
    }),
    name: "qti-round-to figures=ref1.F, the item's float outcome",
    raised: true,
  },
  {
    entries: packageOf({
      expression: indexOf("ref1.N"),
      mappings: "",
      named: link,
      type: linkType,
      version: "3.0.1",
    }),
    name: "qti-index n=ref1.N through an LTI link, 3.0.1 (O4-lti-idx-301)",
    raised: false,
  },
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "a prefixed reference in place of a literal",
  (it) => {
    it.effect(
      "is typed by rule P24 in the law oracle as on the import's rows",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* prefixedReferenceTypeRuns() {
            const directory = yield* scratchDirectory("prefixed-reference-type-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(cases.length, 9);

            return yield* exhaust(
              {
                box: "the 9 prefixed-reference cases: an item's float, integer and multiple integer outcomes, its integer template, a mapped float and a mapped integer, an item built-in, qti-round-to over a float, and an LTI link",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => cases[at]?.name ?? String(at),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/prefixed-reference-type",
              },
              (at) =>
                Effect.gen(function* prefixedReferenceTypeCase() {
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
                      disagreement.law === "Reference type",
                  );
                  assert.deepStrictEqual(apart.map(shownDisagreement), [], said);

                  for (const side of sides) {
                    if (of.raised) {
                      assert.match(judged.summary[side], /\bReference type\b/u, said);
                    } else {
                      assert.notMatch(judged.summary[side], /\bReference type\b/u, said);
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
