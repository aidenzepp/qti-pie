/**
 * The law oracle's operator laws (slice RV-O; spec readings 119 and 121): over whole packages, a
 * rounding operator whose integer `figures` is below its mode's least is refused under `P10`, and
 * a `qti-equal` that compares in a range with no `tolerance`, or whose `tolerance` is not one or
 * two values each above 0, under `P36`; each with the nearest valid package beside it, accepted.
 *
 * Each case is one item whose response processing holds one operator, an edit of a base that every
 * other law holds of, so the case's verdict is its edit's. Main's database case of an absolute
 * `Equal` with no tolerance (`src/import/processing.db.test.ts:892-903` at `2b276d76`) is among
 * them; the rounding operators' figures, main's `RoundTo` case among them, are searched in
 * `#pantry/qti/operators.oracle.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf, shownBreach, verdictOf } from "#pantry/test/oracle.ts";
import type { Judgment, LawName, OracleRule } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The manifest of the one-item package, under 3.0.1.
 */
const manifest = `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">
  <metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>
  <organizations/>
  <resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources>
</manifest>`;

/**
 * Write the one-item package whose response processing holds the rules: a valid item but for what
 * the rules break, with a float `SCORE`, an integer `COUNT` and a boolean `FLAG` declared.
 *
 * @param rules - The response processing's content.
 * @returns The package's entries, as `readPackage` reads them.
 */
const packageOf = (rules: string): readonly PackageFile[] =>
  Object.entries({
    "imsmanifest.xml": manifest,
    "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="COUNT" cardinality="single" base-type="integer"/><qti-outcome-declaration identifier="FLAG" cardinality="single" base-type="boolean"/><qti-item-body><p>x</p></qti-item-body><qti-response-processing>${rules}</qti-response-processing></qti-assessment-item>`,
  }).map(([path, text]): PackageFile => ({
    bytes: new TextEncoder().encode(text),
    kind: path === "imsmanifest.xml" ? "manifest" : "file",
    path,
  }));

/**
 * Set `FLAG` by a two-operand comparison: a `qti-equal-rounded` or a `qti-equal` with the
 * attributes, over `SCORE` and a float.
 *
 * @param kind - The operator.
 * @param attributes - Its attributes, as written.
 * @returns The rule.
 */
const comparing = (kind: "qti-equal" | "qti-equal-rounded", attributes: string): string =>
  `<qti-set-outcome-value identifier="FLAG"><${kind}${attributes}><qti-variable identifier="SCORE"/><qti-base-value base-type="float">1.5</qti-base-value></${kind}></qti-set-outcome-value>`;

/**
 * Set `SCORE` to itself rounded by a `qti-round-to` with the attributes.
 *
 * @param attributes - Its attributes, as written.
 * @returns The rule.
 */
const roundingTo = (attributes: string): string =>
  `<qti-set-outcome-value identifier="SCORE"><qti-round-to${attributes}><qti-variable identifier="SCORE"/></qti-round-to></qti-set-outcome-value>`;

/**
 * Write a judgment for an assertion's message: its verdict, or its breaches line by line.
 *
 * @param judgment - The judgment.
 * @returns The text.
 */
const shown = (judgment: Judgment): string =>
  judgment._tag === "Judged"
    ? judgment.breaches.map((breach) => shownBreach(breach, grammar)).join("\n")
    : `the codec refused the package: ${judgment.rule}, ${judgment.detail}`;

/**
 * One package of the operator laws: its rules, and the law and rule it is refused under, or none
 * for a package every law holds of.
 */
interface OperatorCase {
  readonly name: string;
  readonly refused?: { readonly law: LawName; readonly rule: OracleRule };
  readonly rules: string;
}

/**
 * The refusal of reading 119.
 */
const figuresRefused = { law: "Rounding figures", rule: "P10" } as const;

/**
 * The refusal of reading 121.
 */
const toleranceRefused = { law: "Equal tolerance", rule: "P36" } as const;

/**
 * The cases, each refused one beside the nearest valid package.
 */
const cases: readonly OperatorCase[] = [
  {
    name: "a qti-equal-rounded with figures 1 under its default significantFigures",
    rules: comparing("qti-equal-rounded", ' figures="1"'),
  },
  {
    name: "a qti-equal-rounded with figures 3 under significantFigures, written",
    rules: comparing("qti-equal-rounded", ' rounding-mode="significantFigures" figures="3"'),
  },
  {
    name: "a qti-equal-rounded with figures 0 under decimalPlaces",
    rules: comparing("qti-equal-rounded", ' rounding-mode="decimalPlaces" figures="0"'),
  },
  {
    name: "a qti-round-to with figures -1 under decimalPlaces",
    refused: figuresRefused,
    rules: roundingTo(' rounding-mode="decimalPlaces" figures="-1"'),
  },
  {
    name: "a qti-round-to with figures 0 under decimalPlaces",
    rules: roundingTo(' rounding-mode="decimalPlaces" figures="0"'),
  },
  {
    name: "a qti-round-to whose figures names a variable, read at run time",
    rules: roundingTo(' rounding-mode="significantFigures" figures="COUNT"'),
  },
  {
    name: "a qti-round-to with no rounding-mode, AL3's",
    refused: { law: "AL3 required", rule: "required-attribute" },
    rules: roundingTo(' figures="0"'),
  },
  {
    name: "a qti-equal in absolute mode with no tolerance (main's P36 database case)",
    refused: toleranceRefused,
    rules: comparing("qti-equal", ' tolerance-mode="absolute"'),
  },
  {
    name: "a qti-equal in absolute mode with two tolerance values",
    rules: comparing("qti-equal", ' tolerance-mode="absolute" tolerance="0.1 0.2"'),
  },
  {
    name: "a qti-equal in relative mode with one tolerance value, padded",
    rules: comparing("qti-equal", ' tolerance-mode="relative" tolerance=" 5 "'),
  },
  {
    name: "a qti-equal in absolute mode with three tolerance values",
    refused: toleranceRefused,
    rules: comparing("qti-equal", ' tolerance-mode="absolute" tolerance="0.1 0.2 0.3"'),
  },
  {
    name: "a qti-equal in absolute mode whose tolerance is NaN",
    refused: toleranceRefused,
    rules: comparing("qti-equal", ' tolerance-mode="absolute" tolerance="0.5 NaN"'),
  },
  {
    name: "a qti-equal in absolute mode whose tolerance is a negative number of 16 significant digits",
    refused: toleranceRefused,
    rules: comparing("qti-equal", ' tolerance-mode="absolute" tolerance="-0.1234567890123456"'),
  },
  {
    name: "a qti-equal in absolute mode whose tolerance names a variable",
    rules: comparing("qti-equal", ' tolerance-mode="absolute" tolerance="T"'),
  },
  {
    name: "a qti-equal in exact mode, written, with no tolerance",
    rules: comparing("qti-equal", ' tolerance-mode="exact"'),
  },
  {
    name: "a qti-equal in its default exact mode with an empty tolerance",
    refused: toleranceRefused,
    rules: comparing("qti-equal", ' tolerance=""'),
  },
];

describe("test/oracle.ts, the operator laws (RV-O)", () => {
  for (const { name, refused, rules } of cases) {
    it.effect(`${refused === undefined ? "accepts" : "refuses"} ${name}`, () =>
      // Oracle: the specification as a checker: info §5.47.2 and §5.119.2 under §5.47.1's
      // default (reading 119), and §5.46.2 with §9.1.5's values (reading 121).
      Effect.gen(function* judged() {
        const judgment = yield* judge(packageOf(rules), grammar, laws);

        assert.deepStrictEqual(
          verdictOf(judgment),
          refused === undefined
            ? { verdict: "accepted" }
            : { rule: refused.rule, verdict: "refused" },
          shown(judgment),
        );
        if (refused !== undefined && judgment._tag === "Judged") {
          assert.include(
            judgment.breaches.map(({ law }) => law),
            refused.law,
            shown(judgment),
          );
        }
      }),
    );
  }
});
