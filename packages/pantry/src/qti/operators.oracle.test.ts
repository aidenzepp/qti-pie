/**
 * The operator overlays' free tests: their statements build beside the layers they read, each check
 * is named by an oracle law, the patterns the database's checks read are the specification's
 * languages, and the law oracle refuses exactly where the information model says, over the small
 * box of each reading exhausted and over packages a swarm draws past it.
 *
 * The specification is `#pantry/test/operator-spec.ts`, readings 119 and 121 restated from their
 * sources with a hand-written parser of `xs:double`'s lexical space. The database tests
 * (`operators.db.test.ts`) judge the laws through PostgreSQL, and the builder's tests
 * (`#pantry/import/overlays/operators.test.ts`) its rows.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { element, int, string } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { attributeLaws } from "#pantry/qti/attributes.ts";
import { chardataLaws } from "#pantry/qti/chardata.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import {
  doublePattern,
  integerForm,
  operatorLaws,
  operatorRelations,
  positivePattern,
} from "#pantry/qti/operators.ts";
import { qtiRelations } from "#pantry/qti/base.ts";
import {
  collapsedText,
  doubleReadingOf,
  figuresIntegerOf,
  roundingRefused,
  toleranceRefused,
} from "#pantry/test/operator-spec.ts";
import type { RoundingKind } from "#pantry/test/operator-spec.ts";
import { judge, lawNames, lawsOf, ruleOf, shownBreach } from "#pantry/test/oracle.ts";
import type { Breach, Judgment, LawName } from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 5 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * How long building a schema over every relation of the schema may take: its statements are planned
 * whole, which takes some seconds beside the composed grammar.
 * Measured 2026-11-07: 2.8 s at a load average of 63 to 73.
 */
const buildTimeout = 60_000;

describe("qti/operators.ts, declared", { timeout: buildTimeout }, () => {
  it("builds a schema of Node, the character data, the attribute layer and the operator overlays with every law, each statement once", () => {
    const built = schema("OperatorLayer", { ...qtiRelations, ...operatorRelations }, [
      ...nodeLaws,
      ...chardataLaws,
      ...attributeLaws,
      ...operatorLaws,
    ]);

    for (const relation of Object.values(operatorRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(built.relations, relation.name)?.value,
        relation,
      );
    }

    assert.strictEqual(new Set(operatorLaws).size, operatorLaws.length);
    assert.strictEqual(
      built.statements.length,
      nodeLaws.length + chardataLaws.length + attributeLaws.length + operatorLaws.length,
    );
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = operatorLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );
    const rules = new Map(
      named.map((name) => {
        const law = lawNames.find((known) => known === name);
        assert.isDefined(law, `${name} is no oracle law`);

        return [name, law === undefined ? "" : ruleOf(law)] as const;
      }),
    );

    assert.deepStrictEqual(
      new Map([...rules].toSorted(([a], [b]) => (a < b ? -1 : 1))),
      new Map([
        ["E1 derived", "derived"],
        ["Equal tolerance", "P36"],
        ["Rounding figures", "P10"],
      ]),
    );
  });
});

/**
 * How long a search over the patterns may take: the value box is 16,105 cases, about 1.5 ms each
 * under the swarm's load, and the figures box 4,681.
 * Measured 2026-11-07: 3.6 s at a load average of 63 to 73, the slower box.
 */
const searchTimeout = 180_000;

/**
 * Test a text against a pattern as PostgreSQL's `~` reads one of grizzle's admitted grammar: the
 * patterns here are anchored, with classes, groups and alternation alone, which ECMAScript's `u`
 * mode reads the same.
 *
 * @param pattern - The pattern.
 * @returns The test.
 */
const matcher = (pattern: string): ((text: string) => boolean) => {
  const compiled = new RegExp(pattern, "u");

  return (text) => compiled.test(text);
};

/**
 * `doublePattern`, `positivePattern` and `integerForm` as the database reads them.
 */
const database = {
  integer: matcher(integerForm.source),
  numeric: matcher(doublePattern.source),
  positive: matcher(positivePattern.source),
};

/**
 * Judge one tolerance value both ways and assert they agree: the database's two patterns, as
 * `tolerancePositive` reads them, against the specification's parser.
 *
 * @param value - The value.
 * @returns Nothing; it fails on a disagreement.
 */
const assertValueRead = (value: string): void => {
  const spec = doubleReadingOf(value);
  const numeric = database.numeric(value);
  const positive = database.positive(value);

  assert.strictEqual(numeric, spec.numeric, `numeric ${JSON.stringify(value)}`);
  assert.isTrue(!positive || numeric, `positive but no number ${JSON.stringify(value)}`);
  assert.strictEqual(
    !numeric || positive,
    !spec.numeric || spec.positive,
    `admitted ${JSON.stringify(value)}`,
  );
};

/**
 * The characters of the value box: the digits 0 and 1, both signs, the point, both exponent
 * letters, and the letters of `INF` and `NaN`.
 */
const valueCharacters = ["0", "1", "+", "-", ".", "e", "E", "I", "N", "F", "a"] as const;

/**
 * A situation the value box and the value search must reach: a positive number, a number not
 * above 0, a special value and a string.
 */
type ValueSituation = "positive" | "not positive" | "special" | "string";

/**
 * Name the situation of a value, by the specification.
 *
 * @param value - The value.
 * @returns Its situation.
 */
const valueSituationOf = (value: string): ValueSituation => {
  if (value === "INF" || value === "-INF" || value === "NaN") {
    return "special";
  }

  const spec = doubleReadingOf(value);
  if (!spec.numeric) {
    return "string";
  }

  return spec.positive ? "positive" : "not positive";
};

/**
 * The named forms a tolerance value is drawn from, each a corner of `xs:double`'s lexical space
 * or just outside it: the floor `integer` first.
 */
const VALUE_FORMS = [
  "integer",
  "decimal",
  "leading-point",
  "trailing-point",
  "exponent",
  "signed",
  "zero",
  "negative-zero",
  "negative",
  "long-mantissa",
  "underflow",
  "overflow",
  "special",
  "near-special",
  "variable",
  "near-number",
] as const;

/**
 * A tolerance value's named form.
 */
type ValueForm = (typeof VALUE_FORMS)[number];

/**
 * Between one and three digits, any of 0 to 9.
 */
const digits: Gen<string> = string(element(["0", "1", "2", "5", "9"] as const), {
  max: 3,
  min: 1,
});

/**
 * Between one and three digits, the first of them not 0.
 */
const nonzeroDigits: Gen<string> = (source) =>
  `${source.draw(element(["1", "2", "5", "9"] as const))}${source.draw(string(element(["0", "5"] as const), { max: 2, min: 0 }))}`;

/**
 * Each named form's generator.
 */
const VALUE_GENERATORS: Readonly<Record<ValueForm, Gen<string>>> = {
  decimal: (source) => `${source.draw(digits)}.${source.draw(digits)}`,
  exponent: (source) =>
    `${source.draw(nonzeroDigits)}${source.draw(element(["e", "E"] as const))}${source.draw(element(["", "+", "-"] as const))}${source.draw(digits)}`,
  integer: nonzeroDigits,
  "leading-point": (source) => `.${source.draw(digits)}`,
  "long-mantissa": (source) =>
    `${source.draw(element(["", "-", "+"] as const))}0.${"1234567890".repeat(source.draw(int(2, 4)))}`,
  "near-number": element([
    "1.2.3",
    "1e",
    "e5",
    ".",
    "+",
    "-",
    "1e+",
    "--1",
    "+-1",
    "1_0",
    "1 ",
  ] as const),
  "near-special": element(["+INF", "-NaN", "+NaN", "inf", "nan", "Infinity", "INFINITY"] as const),
  negative: (source) =>
    `-${source.draw(nonzeroDigits)}${source.draw(element(["", ".5", "e1"] as const))}`,
  "negative-zero": (source) =>
    `-${source.draw(element(["0", "00", "0.0", ".0", "0.", "0e5"] as const))}`,
  overflow: element(["1e400", "-1e400", "9e99999", "1E309"] as const),
  signed: (source) => `${source.draw(element(["+", "-"] as const))}${source.draw(digits)}`,
  special: element(["INF", "-INF", "NaN"] as const),
  "trailing-point": (source) => `${source.draw(digits)}.`,
  underflow: element(["1e-400", "5E-324", "1e-99999", "-1e-400"] as const),
  variable: element(["T", "TOL", "t0", "e1", "E", "Nan"] as const),
  zero: element(["0", "00", "0.0", ".0", "0.", "0e5", "0E-3", "+0"] as const),
};

/**
 * One value, its form drawn by a swarm over the named forms.
 */
const valueCase: Gen<{ readonly form: ValueForm; readonly value: string }> = (source) => {
  const form = source.draw(swarmChoice(source.draw(swarm(VALUE_FORMS)), VALUE_FORMS));

  return { form, value: source.draw(VALUE_GENERATORS[form]) };
};

describe("qti/operators.ts, the database's patterns", { timeout: searchTimeout }, () => {
  it.effect(
    "reads every value of at most 4 characters over the box as the specification does: xs:double's space, and its positive part",
    (ctx) =>
      // Oracle: the specification as a checker, XML Schema 1.0 Part 2 §3.2.5.1's lexical space of
      // xs:double parsed by hand, and "positive" read of the number written (reading 121).
      // Bound: every value of at most 4 characters over 0, 1, +, -, ., e, E, I, N, F and a, 16,105.
      searched(
        ctx,
        exhaust(
          {
            box: "every value of at most 4 characters over 0 1 + - . e E I N F a",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<ValueSituation>([
              "positive",
              "not positive",
              "special",
              "string",
            ]),
            generator: string(element(valueCharacters), { max: 4, min: 0 }),
            limit: 17_000,
            literal: (value) => JSON.stringify(value),
            oracle: {
              kind: "specification",
              name: "XML Schema 1.0's xs:double lexical space, parsed by hand, and its positive numbers",
            },
            suite: "qti/operators-value-box",
          },
          (value: string, c) =>
            Effect.sync(() => {
              c.note(valueSituationOf(value));
              assertValueRead(value);
            }),
        ),
      ),
  );

  it.effect(
    "reads every value a swarm draws over the named forms as the specification does",
    (ctx) =>
      // Oracle: the specification as a checker, as above, over values past the box: long
      // mantissas, under- and overflowing exponents and the specials' near misses.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required<ValueForm>(VALUE_FORMS, { cases: 600, sense: notesOnly }),
            draw: drawn(valueCase),
            kept: [],
            literal: (drawnValue) => JSON.stringify(drawnValue),
            oracle: {
              kind: "specification",
              name: "XML Schema 1.0's xs:double lexical space, parsed by hand, and its positive numbers",
            },
            runs: 400,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "qti/operators-value-swarm",
          },
          ({ form, value }, c) =>
            Effect.sync(() => {
              c.note(form);
              assertValueRead(value);
            }),
        ),
      ),
  );

  it.effect(
    "reads every figures of at most 4 characters over the box as an integer exactly where the specification does, at its value",
    (ctx) =>
      // Oracle: the specification as a checker, the union's xs:integer member read collapsed
      // (XML Schema Part 2 §3.3.13, whiteSpace collapse) within reading 46's signed 64-bit range.
      // Bound: every figures of at most 4 characters over 0, 1, 9, +, -, space, tab and F, 4,681.
      searched(
        ctx,
        exhaust(
          {
            box: "every figures of at most 4 characters over 0 1 9 + - space tab F",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<"integer" | "no integer">(["integer", "no integer"]),
            generator: string(element(["0", "1", "9", "+", "-", " ", "\t", "F"] as const), {
              max: 4,
              min: 0,
            }),
            limit: 5000,
            literal: (value) => JSON.stringify(value),
            oracle: {
              kind: "specification",
              name: "xs:integer's lexical space, collapsed, within the signed 64-bit range",
            },
            suite: "qti/operators-figures-box",
          },
          (lexical: string, c) =>
            Effect.sync(() => {
              const spec = figuresIntegerOf(lexical);
              const collapsed = collapsedText(lexical);
              c.note(spec === undefined ? "no integer" : "integer");

              assert.strictEqual(
                database.integer(collapsed),
                spec !== undefined,
                JSON.stringify(lexical),
              );
              if (spec !== undefined) {
                assert.strictEqual(BigInt(collapsed), spec, JSON.stringify(lexical));
              }
            }),
        ),
      ),
  );

  it("reads the signed 64-bit range's edges as the specification does", () => {
    // Oracle: the specification as a checker, reading 46's range, at its four edges.
    for (const [lexical, integer] of [
      ["9223372036854775807", 9_223_372_036_854_775_807n],
      ["-9223372036854775808", -9_223_372_036_854_775_808n],
      ["+09223372036854775807", 9_223_372_036_854_775_807n],
      ["9223372036854775808", undefined],
      ["-9223372036854775809", undefined],
      ["00000000000000000000000000001", 1n],
    ] as const) {
      assert.strictEqual(figuresIntegerOf(lexical), integer, lexical);
      assert.strictEqual(database.integer(lexical), integer !== undefined, lexical);
    }
  });
});

/**
 * The composed grammar every package case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the oracle's laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Escape a text for an attribute value written between double quotes.
 *
 * @param text - The text.
 * @returns It with `&`, `<`, `"` and the three whitespace controls as references, so the reader
 *   gives the text back as written.
 */
const attributeText = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\t", "&#9;")
    .replaceAll("\n", "&#10;")
    .replaceAll("\r", "&#13;");

/**
 * Write an attribute list from names and values, each value escaped; a name with no value is left
 * out.
 *
 * @param attributes - The attributes, in order.
 * @returns The list as written in a start tag, each attribute after a space.
 */
const attributesOf = (attributes: readonly (readonly [string, string | undefined])[]): string =>
  attributes
    .flatMap(([name, value]) => (value === undefined ? [] : [` ${name}="${attributeText(value)}"`]))
    .join("");

/**
 * Write the one-item package whose response processing holds the rules, with a float `SCORE`, an
 * integer `COUNT` and a boolean `FLAG` declared.
 *
 * @param rules - The response processing's content.
 * @returns The package's entries, as `readPackage` reads them.
 */
const packageOf = (rules: string): readonly PackageFile[] =>
  Object.entries({
    "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
    "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="COUNT" cardinality="single" base-type="integer"/><qti-outcome-declaration identifier="FLAG" cardinality="single" base-type="boolean"/><qti-item-body><p>x</p></qti-item-body><qti-response-processing>${rules}</qti-response-processing></qti-assessment-item>`,
  }).map(([path, text]): PackageFile => ({
    bytes: new TextEncoder().encode(text),
    kind: path === "imsmanifest.xml" ? "manifest" : "file",
    path,
  }));

/**
 * Write the rule that holds one operator: a `qti-equal-rounded` or a `qti-equal` comparing `SCORE`
 * with a float into `FLAG`, or a `qti-round-to` rounding `SCORE` into itself.
 *
 * @param kind - The operator.
 * @param attributes - Its attributes, as written.
 * @returns The rule.
 */
const operatorRule = (
  kind: RoundingKind | "qti-equal",
  attributes: readonly (readonly [string, string | undefined])[],
): string =>
  kind === "qti-round-to"
    ? `<qti-set-outcome-value identifier="SCORE"><qti-round-to${attributesOf(attributes)}><qti-variable identifier="SCORE"/></qti-round-to></qti-set-outcome-value>`
    : `<qti-set-outcome-value identifier="FLAG"><${kind}${attributesOf(attributes)}><qti-variable identifier="SCORE"/><qti-base-value base-type="float">1.5</qti-base-value></${kind}></qti-set-outcome-value>`;

/**
 * Judge one operator's package and read the breaches of the laws a box reads, each as `law at
 * kind`; a codec refusal fails the case.
 *
 * @param rules - The response processing's content.
 * @param read - The laws the box reads.
 * @returns The breaches of those laws, in the oracle's order, and every breach, for a message.
 */
const breachesOf = (rules: string, read: readonly LawName[]) =>
  Effect.map(judge(packageOf(rules), grammar, laws), (judgment: Judgment) => {
    const breaches: readonly Breach[] =
      judgment._tag === "Judged"
        ? judgment.breaches
        : assert.fail(`the codec refused the package: ${judgment.rule}, ${judgment.detail}`);

    return {
      all: breaches.map((breach) => shownBreach(breach, grammar)).join("\n"),
      read: breaches
        .filter(({ law }) => read.includes(law))
        .map(({ keys, law }) => `${law} at ${keys["kind"] ?? ""}`),
    };
  });

/**
 * One choice of the rounding box: the operator, its `rounding-mode` (none for one it does not
 * write) and its `figures`.
 */
interface RoundingCase {
  readonly figures: "-1" | "0" | "1" | " 0 " | "F";
  readonly kind: RoundingKind;
  readonly mode: "decimalPlaces" | "none" | "significantFigures";
}

/**
 * Every choice of the rounding box.
 */
const roundingCases: Gen<RoundingCase> = (source) => ({
  figures: source.draw(element(["-1", "0", "1", " 0 ", "F"] as const)),
  kind: source.draw(element(["qti-equal-rounded", "qti-round-to"] as const)),
  mode: source.draw(element(["none", "decimalPlaces", "significantFigures"] as const)),
});

/**
 * A situation the rounding box must reach: each mode's refusal, the default mode's, a value at
 * each least, a variable, and the `qti-round-to` that writes no mode.
 */
type RoundingSituation =
  | "default refused"
  | "significant refused"
  | "decimal refused"
  | "at the least"
  | "variable"
  | "no mode";

describe("test/oracle.ts, Rounding figures", { timeout: buildTimeout }, () => {
  it.effect(
    "breaks once, at the operator, exactly where its integer figures is below its mode's least; a qti-round-to with no mode is AL3's",
    (ctx) =>
      // Oracle: the specification as a checker, info §5.47.2 and §5.119.2 under §5.47.1's default
      // and §5.119.1's required mode (reading 119), `#pantry/test/operator-spec.ts`.
      // Bound: either operator, under no mode, decimalPlaces or significantFigures, with figures
      // -1, 0, 1, padded 0 or a variable's name, 30.
      searched(
        ctx,
        exhaust(
          {
            box: "either rounding operator, under each mode or none, with figures -1, 0, 1, padded 0 or a name",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<RoundingSituation>([
              "default refused",
              "significant refused",
              "decimal refused",
              "at the least",
              "variable",
              "no mode",
            ]),
            generator: roundingCases,
            limit: 40,
            literal: (drawnCase) => JSON.stringify(drawnCase),
            oracle: {
              kind: "specification",
              name: "the information model's EqualRounded and RoundTo figures, §5.47.2 and §5.119.2",
            },
            suite: "qti/operators-rounding-box",
          },
          (drawnCase: RoundingCase, c) =>
            Effect.gen(function* rounding() {
              const mode = drawnCase.mode === "none" ? undefined : drawnCase.mode;
              const refused = roundingRefused(drawnCase.kind, mode, drawnCase.figures);
              const noMode = drawnCase.kind === "qti-round-to" && mode === undefined;
              const situation = (): RoundingSituation | undefined => {
                if (noMode) {
                  return "no mode";
                }

                if (drawnCase.figures === "F") {
                  return "variable";
                }

                if (refused) {
                  if (mode === undefined) {
                    return "default refused";
                  }

                  return mode === "decimalPlaces" ? "decimal refused" : "significant refused";
                }

                const least = mode === "decimalPlaces" ? 0n : 1n;

                return figuresIntegerOf(drawnCase.figures) === least ? "at the least" : undefined;
              };
              const noted = situation();
              if (noted !== undefined) {
                c.note(noted);
              }

              const { all, read } = yield* breachesOf(
                operatorRule(drawnCase.kind, [
                  ["rounding-mode", mode],
                  ["figures", drawnCase.figures],
                ]),
                ["Rounding figures", "AL3 required"],
              );

              assert.deepStrictEqual(
                read,
                [
                  ...(noMode ? [`AL3 required at ${drawnCase.kind}`] : []),
                  ...(refused ? [`Rounding figures at ${drawnCase.kind}`] : []),
                ],
                `${JSON.stringify(drawnCase)}\n${all}`,
              );
            }),
        ),
      ),
  );
});

/**
 * One choice of the tolerance box: the `qti-equal`'s `tolerance-mode` and `tolerance`, each none
 * for one it does not write.
 */
interface ToleranceCase {
  readonly mode: "absolute" | "exact" | "none" | "relative";
  readonly tolerance: "" | "-1" | "0" | "0.5" | "0.5 1" | "0.5 1 2" | "none" | "T";
}

/**
 * Every choice of the tolerance box.
 */
const toleranceCases: Gen<ToleranceCase> = (source) => ({
  mode: source.draw(element(["none", "exact", "absolute", "relative"] as const)),
  tolerance: source.draw(element(["none", "", "0.5", "0.5 1", "0.5 1 2", "0", "-1", "T"] as const)),
});

/**
 * A situation the tolerance box must reach: a range with no tolerance, a count refused, a value
 * refused, a variable, and an accepted range.
 */
type ToleranceSituation = "missing" | "count" | "value" | "variable" | "accepted range";

describe("test/oracle.ts, Equal tolerance", { timeout: buildTimeout }, () => {
  it.effect(
    "breaks once, at the qti-equal, exactly where a range has no tolerance or a tolerance is not one or two values each above 0",
    (ctx) =>
      // Oracle: the specification as a checker, info §5.46.2 with §9.1.5's values (reading 121),
      // `#pantry/test/operator-spec.ts`.
      // Bound: each tolerance mode or none, with no tolerance, an empty one, 0.5, 0.5 1, 0.5 1 2,
      // 0, -1 or a variable's name, 32.
      searched(
        ctx,
        exhaust(
          {
            box: "each tolerance mode or none, with no tolerance, an empty one, 0.5, 0.5 1, 0.5 1 2, 0, -1 or a name",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<ToleranceSituation>([
              "missing",
              "count",
              "value",
              "variable",
              "accepted range",
            ]),
            generator: toleranceCases,
            limit: 40,
            literal: (drawnCase) => JSON.stringify(drawnCase),
            oracle: {
              kind: "specification",
              name: "the information model's Equal tolerance, §5.46.2, with ToleranceList, §9.1.5",
            },
            suite: "qti/operators-tolerance-box",
          },
          (drawnCase: ToleranceCase, c) =>
            Effect.gen(function* tolerance() {
              const mode = drawnCase.mode === "none" ? undefined : drawnCase.mode;
              const written = drawnCase.tolerance === "none" ? undefined : drawnCase.tolerance;
              const refused = toleranceRefused(mode, written);
              const range = mode === "absolute" || mode === "relative";
              if (written === undefined) {
                if (range) {
                  c.note("missing");
                }
              } else if (written === "" || written === "0.5 1 2") {
                c.note("count");
              } else if (written === "0" || written === "-1") {
                c.note("value");
              } else if (written === "T") {
                c.note("variable");
              } else if (range) {
                c.note("accepted range");
              }

              const { all, read } = yield* breachesOf(
                operatorRule("qti-equal", [
                  ["tolerance-mode", mode],
                  ["tolerance", written],
                ]),
                ["Equal tolerance"],
              );

              assert.deepStrictEqual(
                read,
                refused ? ["Equal tolerance at qti-equal"] : [],
                `${JSON.stringify(drawnCase)}\n${all}`,
              );
            }),
        ),
      ),
  );
});

/**
 * The named shapes an operator a swarm draws takes: the floor `figures` first, then the
 * adversarial `tolerance` lists and modes.
 */
const OPERATOR_FORMS = [
  "figures",
  "figures-padded",
  "figures-edge",
  "mode-near-miss",
  "tolerance-values",
  "tolerance-spacing",
  "tolerance-count",
] as const;

/**
 * An operator's named shape.
 */
type OperatorForm = (typeof OPERATOR_FORMS)[number];

/**
 * One operator a swarm draws: its kind and its attributes as written, each none where it writes
 * none.
 */
interface OperatorCase {
  readonly figures: string | undefined;
  readonly form: OperatorForm;
  readonly kind: RoundingKind | "qti-equal";
  readonly mode: string | undefined;
  readonly tolerance: string | undefined;
}

/**
 * The whitespace a tolerance's values are separated and padded by.
 */
const spacing: Gen<string> = string(element([" ", "\t", "\n", "\r"] as const), { max: 2, min: 1 });

/**
 * A tolerance of between `min` and `max` values, each drawn by the value swarm, joined and padded
 * by whitespace runs where `spaced`, else by one space.
 *
 * @param size - The bounds on its count.
 * @param size.max - The most values.
 * @param size.min - The fewest values.
 * @param spaced - Whether its whitespace is drawn.
 * @returns The tolerance's generator.
 */
const toleranceOf =
  ({ max, min }: { readonly max: number; readonly min: number }, spaced: boolean): Gen<string> =>
  (source) => {
    const values = Array.from(
      { length: source.draw(int(min, max)) },
      () => source.draw(valueCase).value,
    );
    const gap = (): string => (spaced ? source.draw(spacing) : " ");
    const lead = spaced && source.draw(int(0, 1)) === 1 ? gap() : "";
    const tail = spaced && source.draw(int(0, 1)) === 1 ? gap() : "";

    return `${lead}${values.map((value, at) => (at === 0 ? value : `${gap()}${value}`)).join("")}${tail}`;
  };

/**
 * A mode of a `qti-equal`, or none: every value of the enumeration, and near misses AL1 refuses.
 */
const toleranceMode: Gen<string | undefined> = element([
  undefined,
  "exact",
  "absolute",
  "relative",
  " absolute",
  "Absolute",
  "relative ",
] as const);

/**
 * Each named shape's generator.
 */
const OPERATOR_GENERATORS: Readonly<Record<OperatorForm, Gen<OperatorCase>>> = {
  figures: (source) => ({
    figures: String(source.draw(int(-3, 3))),
    form: "figures",
    kind: source.draw(element(["qti-equal-rounded", "qti-round-to"] as const)),
    mode: source.draw(element([undefined, "decimalPlaces", "significantFigures"] as const)),
    tolerance: undefined,
  }),
  "figures-edge": (source) => ({
    figures: source.draw(
      element([
        "9223372036854775807",
        "-9223372036854775808",
        "-9223372036854775809",
        "000",
        "-0",
        "+0",
        "+1",
        "COUNT",
      ] as const),
    ),
    form: "figures-edge",
    kind: source.draw(element(["qti-equal-rounded", "qti-round-to"] as const)),
    mode: source.draw(element([undefined, "decimalPlaces", "significantFigures"] as const)),
    tolerance: undefined,
  }),
  "figures-padded": (source) => ({
    figures: `${source.draw(spacing)}${String(source.draw(int(-1, 1)))}${source.draw(spacing)}`,
    form: "figures-padded",
    kind: source.draw(element(["qti-equal-rounded", "qti-round-to"] as const)),
    mode: source.draw(element([undefined, "decimalPlaces", "significantFigures"] as const)),
    tolerance: undefined,
  }),
  "mode-near-miss": (source) => ({
    figures: String(source.draw(int(-1, 1))),
    form: "mode-near-miss",
    kind: source.draw(element(["qti-equal-rounded", "qti-round-to"] as const)),
    mode: source.draw(
      element([" decimalPlaces", "DecimalPlaces", "significantfigures", ""] as const),
    ),
    tolerance: undefined,
  }),
  "tolerance-count": (source) => ({
    figures: undefined,
    form: "tolerance-count",
    kind: "qti-equal",
    mode: source.draw(toleranceMode),
    tolerance: source.draw(element([undefined, "", " ", "1", "1 2", "1 2 3", "1 2 3 4"] as const)),
  }),
  "tolerance-spacing": (source) => ({
    figures: undefined,
    form: "tolerance-spacing",
    kind: "qti-equal",
    mode: source.draw(toleranceMode),
    tolerance: source.draw(toleranceOf({ max: 3, min: 0 }, true)),
  }),
  "tolerance-values": (source) => ({
    figures: undefined,
    form: "tolerance-values",
    kind: "qti-equal",
    mode: source.draw(toleranceMode),
    tolerance: source.draw(toleranceOf({ max: 2, min: 1 }, false)),
  }),
};

/**
 * One operator, its shape drawn by a swarm over the named shapes.
 */
const operatorCase: Gen<OperatorCase> = (source) =>
  source.draw(
    OPERATOR_GENERATORS[
      source.draw(swarmChoice(source.draw(swarm(OPERATOR_FORMS)), OPERATOR_FORMS))
    ],
  );

describe("test/oracle.ts, the operator laws past the box", { timeout: testTimeoutMs }, () => {
  it.effect(
    "refuses each operator a swarm draws under its law exactly where the specification does",
    (ctx) =>
      // Oracle: the specification as a checker, readings 119 and 121,
      // `#pantry/test/operator-spec.ts`, over operators the boxes do not hold: padded and edge
      // figures, near-miss modes, and tolerances of drawn values and whitespace.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(30),
            concurrency: 1,
            coverage: required<OperatorForm>(OPERATOR_FORMS, { cases: 200, sense: notesOnly }),
            draw: drawn(operatorCase),
            kept: [],
            literal: (drawnCase) => JSON.stringify(drawnCase),
            oracle: {
              kind: "specification",
              name: "the information model's EqualRounded, RoundTo and Equal, readings 119 and 121",
            },
            runs: 120,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "qti/operators-swarm",
          },
          (drawnCase, c) =>
            Effect.gen(function* operators() {
              c.note(drawnCase.form);

              const rounding = drawnCase.kind !== "qti-equal";
              const law: LawName = rounding ? "Rounding figures" : "Equal tolerance";
              const refused =
                drawnCase.kind === "qti-equal"
                  ? toleranceRefused(drawnCase.mode, drawnCase.tolerance)
                  : roundingRefused(drawnCase.kind, drawnCase.mode, drawnCase.figures);
              const { all, read } = yield* breachesOf(
                operatorRule(
                  drawnCase.kind,
                  rounding
                    ? [
                        ["rounding-mode", drawnCase.mode],
                        ["figures", drawnCase.figures],
                      ]
                    : [
                        ["tolerance-mode", drawnCase.mode],
                        ["tolerance", drawnCase.tolerance],
                      ],
                ),
                [law],
              );

              assert.deepStrictEqual(
                read,
                refused ? [`${law} at ${drawnCase.kind}`] : [],
                `${JSON.stringify(drawnCase)}\n${all}`,
              );
            }),
        ),
      ),
  );
});
