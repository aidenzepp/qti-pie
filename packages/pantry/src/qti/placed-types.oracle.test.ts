/**
 * A response rules fragment an item includes is typed in that item (spec reading 117: "the content
 * of the fragment must satisfy the requirements of the specification in the context of the item in
 * which it is being included"), on the import's rows as in the law oracle. A reference in an
 * included fragment names its variable in the fragment's own document, where nothing is declared,
 * so its resolution in the item is a `PlacedVariableRefDeclaration`. "Mapped response" holds a map
 * response's row to its declaration's mapping, as it holds an item's own reference (information
 * model §7.22, spec reading 166), and "Condition type" holds a variable reference that is a whole
 * condition to its declaration's type, boolean single, through its `PlacedReferenceType` (P21).
 * Genetic repair round 4's inventory (research aeced65a, classes O18 and O38) found the import
 * accepting both where the oracle, which types the fragment in its assembly, raises the law.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`).
 *
 * Bound: one item whose response, an identifier, declares no mapping. Its response processing tests
 * a map response of it, written in an included fragment, then the controls: the same rule written
 * inline, and the included one over a response that declares a mapping. Then it tests the response
 * itself as a condition, included and inline, and the control, an included match of the response
 * with its correct value. 6 cases, exhausted. Each of the first two breaks "Mapped response" on
 * both sides, and the third on neither; each of the next two breaks "Condition type" on both sides,
 * and the last is accepted on both.
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
 * Measured 2026-11-09: 0.2 s at a load average of 68 to 127, its one test alone.
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
 * The assessment items namespace declaration, which an item and a fragment root each write.
 */
const asi = 'xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"';

/**
 * The manifest that lists the item, and with `fragment` the rules fragment it includes.
 *
 * @param fragment - Whether the manifest lists rules.xml.
 * @returns The manifest's text.
 */
const manifestOf = (fragment: boolean): string =>
  `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="R1" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource>${fragment ? '<resource identifier="R2" type="imsqti_fragment_xmlv3p0" href="rules.xml"><file href="rules.xml"/></resource>' : ""}</resources></manifest>`;

/**
 * The item whose one response, RESPONSE, a choice interaction sets, its response processing's
 * content `rules`.
 *
 * @param mapping - The response declaration's mapping as written, empty for none.
 * @param rules - The response processing's content.
 * @returns The item's text.
 */
const itemOf = (mapping: string, rules: string): string =>
  `${declaration}<qti-assessment-item ${asi} xmlns:xi="http://www.w3.org/2001/XInclude" identifier="i1" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>A</qti-value></qti-correct-response>${mapping}</qti-response-declaration><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="A">a</qti-simple-choice><qti-simple-choice identifier="B">b</qti-simple-choice></qti-choice-interaction></qti-item-body><qti-response-processing>${rules}</qti-response-processing></qti-assessment-item>`;

/**
 * The response condition that sets SCORE to 1 where `condition` holds, its root declaring the
 * namespace as `attributes` give it.
 *
 * @param condition - The response if's condition.
 * @param attributes - The condition's attributes as written, empty for none.
 * @returns The condition's text.
 */
const conditionOf = (condition: string, attributes: string): string =>
  `<qti-response-condition${attributes}><qti-response-if>${condition}<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition>`;

/**
 * A condition that RESPONSE's mapped value exceeds 0.
 */
const mapped =
  '<qti-gt><qti-map-response identifier="RESPONSE"/><qti-base-value base-type="float">0</qti-base-value></qti-gt>';

/**
 * A condition that is RESPONSE itself, an identifier single, which is no boolean.
 */
const bare = '<qti-variable identifier="RESPONSE"/>';

/**
 * A condition that RESPONSE matches its correct value, a boolean single.
 */
const matched =
  '<qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>';

/**
 * A mapping of RESPONSE: A maps to 1.
 */
const mapping =
  '<qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>';

/**
 * The package of the files given, each path's text encoded as UTF-8.
 *
 * @param files - Each file's text, by its path.
 * @returns The package.
 */
const packageOf = (files: Readonly<Record<string, string>>): PackageEntries =>
  new Map(
    Object.entries(files).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  );

/**
 * The package whose item includes the rules fragment that tests `condition`, its response declaring
 * `withMapping`.
 *
 * @param withMapping - The response declaration's mapping as written, empty for none.
 * @param condition - The fragment's condition.
 * @returns The package.
 */
const includingOf = (withMapping: string, condition: string): PackageEntries =>
  packageOf({
    "imsmanifest.xml": manifestOf(true),
    "item.xml": itemOf(withMapping, '<xi:include href="rules.xml"/>'),
    "rules.xml": `${declaration}${conditionOf(condition, ` ${asi}`)}`,
  });

/**
 * The package whose item tests `condition` in its own response processing, its response declaring
 * no mapping.
 *
 * @param condition - The condition.
 * @returns The package.
 */
const inlineOf = (condition: string): PackageEntries =>
  packageOf({
    "imsmanifest.xml": manifestOf(false),
    "item.xml": itemOf("", conditionOf(condition, "")),
  });

/**
 * One case: what it is, the package, the law it is about, and what both sides say of it: each
 * breaks the law, neither does, or both accept the package.
 */
interface Case {
  readonly entries: PackageEntries;
  readonly expected: "accepted" | "breaks" | "holds";
  readonly law: "Condition type" | "Mapped response";
  readonly name: string;
}

/**
 * Every case of the bound: the included map response with no mapping (research aeced65a's
 * `V-O18-include-map-response-no-mapping`), then its controls, the inline one
 * (`V-O18-inline-map-response-no-mapping`) and the included one with a mapping; the included
 * identifier condition (`V-O38-include-nonboolean-condition`), then its controls, the inline one
 * (`V-O38-inline-nonboolean-condition`) and the included match (`V-control-include-good`).
 */
const cases: readonly Case[] = [
  {
    entries: includingOf("", mapped),
    expected: "breaks",
    law: "Mapped response",
    name: "an included map response of a response with no mapping",
  },
  {
    entries: inlineOf(mapped),
    expected: "breaks",
    law: "Mapped response",
    name: "an inline map response of a response with no mapping",
  },
  {
    entries: includingOf(mapping, mapped),
    expected: "holds",
    law: "Mapped response",
    name: "an included map response of a response with a mapping",
  },
  {
    entries: includingOf("", bare),
    expected: "breaks",
    law: "Condition type",
    name: "an included condition that is an identifier response",
  },
  {
    entries: inlineOf(bare),
    expected: "breaks",
    law: "Condition type",
    name: "an inline condition that is an identifier response",
  },
  {
    entries: includingOf("", matched),
    expected: "accepted",
    law: "Condition type",
    name: "an included condition that matches a response with its correct value",
  },
];

/**
 * A law's name as a whole word of a summary.
 *
 * @param law - The law.
 * @returns The pattern.
 */
const lawPattern = (law: Case["law"]): RegExp => new RegExp(`\\b${law}\\b`, "u");

layer(NodeServices.layer, { excludeTestServices: true })(
  "a reference in an included rules fragment",
  (it) => {
    it.effect(
      "is typed by its item's declaration, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* placedTypesRuns() {
            const directory = yield* scratchDirectory("placed-types-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(cases.length, 6);

            return yield* exhaust(
              {
                box: "the 6 placed type cases: a map response of a response with no mapping, included and inline, and an included one of a response with a mapping; an identifier response as a condition, included and inline, and an included match of it with its correct value",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => cases[at]?.name ?? String(at),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/placed-types",
              },
              (at) =>
                Effect.gen(function* placedTypesCase() {
                  const of = cases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const judged = yield* judgeOne(yield* genomeOf(of.entries), bench, at);
                  const said = `${of.name}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;
                  if (of.expected === "accepted") {
                    // Neither side breaks a law: the oracle judges no breach, the import builds
                    // with none.
                    assert.deepStrictEqual(judged.disagreements.map(shownDisagreement), [], said);
                    assert.strictEqual(judged.summary.oracle, "laws ", said);
                    assert.strictEqual(judged.summary.import, "built ", said);

                    return;
                  }

                  const apart = judged.disagreements.filter(
                    (disagreement) =>
                      (disagreement.kind === "oracle-only-law" ||
                        disagreement.kind === "import-only-law") &&
                      disagreement.law === of.law,
                  );
                  const pattern = lawPattern(of.law);

                  assert.deepStrictEqual(apart.map(shownDisagreement), [], said);
                  if (of.expected === "holds") {
                    assert.notMatch(judged.summary.oracle, pattern, said);
                    assert.notMatch(judged.summary.import, pattern, said);
                  } else {
                    assert.match(judged.summary.oracle, pattern, said);
                    assert.match(judged.summary.import, pattern, said);
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );
  },
);
