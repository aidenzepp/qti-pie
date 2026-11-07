/**
 * The operator builder's free tests: `tolerancePiecesOf` splits every `tolerance` into exactly its
 * whitespace-separated values, the database's `integerForm` reads every collapsed `figures` as
 * reading 119 does, and over documents `rowsOf` gives each rounding operator its rows and each
 * written `tolerance` its values,
 * so that the database's checks, restated over those rows with the patterns they read, refuse
 * exactly where the specification does.
 *
 * The expected rows of the hand-written document are written from its construction, element by
 * element, and the specification is `#pantry/test/operator-spec.ts`, so no expectation is computed
 * by the builder's own code. The database tests (`#pantry/qti/operators.db.test.ts`) judge the
 * rows through PostgreSQL.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element, int, string } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { rowsOf, tolerancePiecesOf } from "#pantry/import/overlays/operators.ts";
import type { OperatorRows, ToleranceRow } from "#pantry/import/overlays/operators.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import {
  doublePattern,
  equalRoundedMode,
  integerForm,
  positivePattern,
} from "#pantry/qti/operators.ts";
import {
  collapsedText,
  figuresIntegerOf,
  roundingRefused,
  toleranceRefused,
  toleranceValuesOf,
} from "#pantry/test/operator-spec.ts";
import type { RoundingKind } from "#pantry/test/operator-spec.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The grammar shred reads each document by.
 */
const shredGrammar = shredGrammarOf(Result.getOrThrow(composed()));

/**
 * How long a search over documents may take: each case reads and shreds an item. Measured
 * 2026-11-07: 2.8 s at a load average of 75, under V8 coverage, and 1.7 s at 63 to 73 without it.
 */
const searchTimeout = 180_000;

/**
 * Shred an item whose response processing holds the rules, under 3.0.1.
 *
 * @param rules - The response processing's content.
 * @returns The item's tree.
 */
const itemOf = (rules: string) =>
  Effect.gen(function* shredsItem() {
    const xml = yield* readXml(
      new TextEncoder().encode(
        `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="FLAG" cardinality="single" base-type="boolean"/><qti-item-body><p>x</p></qti-item-body><qti-response-processing>${rules}</qti-response-processing></qti-assessment-item>`,
      ),
    );

    return yield* shred(xml, "3.0.1", shredGrammar);
  });

/**
 * The characters of the split box: two value characters, a space and a tab.
 */
const characters = ["a", "1", " ", "\t"] as const;

/**
 * Every `tolerance` of at most 5 characters over {@link characters}: the split box.
 */
const splitValues: Gen<readonly string[]> = array(element<string>(characters), { max: 5, min: 0 });

/**
 * A situation the split box must reach: a value with no value in it, one bare value, one padded,
 * and several.
 */
type SplitSituation = "none" | "bare" | "padded" | "several";

describe("import/overlays/operators.ts, tolerancePiecesOf", () => {
  it.effect(
    "splits every tolerance into exactly its whitespace-separated values, the pieces concatenating to it, and one of whitespace alone into none",
    (ctx) =>
      // Oracle: the specification as a checker, the ToleranceList read as XML Schema's list type
      // reads its items (§9.1.5; Part 2 §4.3.6), `#pantry/test/operator-spec.ts` toleranceValuesOf.
      // Bound: every value of at most 5 characters over a, 1, space and tab, 1,365.
      searched(
        ctx,
        exhaust(
          {
            box: "every tolerance of at most 5 characters over a, 1, space and tab",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<SplitSituation>(["none", "bare", "padded", "several"]),
            generator: splitValues,
            limit: 1500,
            literal: (chars) => JSON.stringify(chars.join("")),
            oracle: {
              kind: "specification",
              name: "the information model's ToleranceList, §9.1.5, split as an XML Schema list",
            },
            suite: "import/overlays/operators-tolerance-split",
          },
          (chars: readonly string[], c) =>
            Effect.sync(() => {
              const lexical = chars.join("");
              const expected = toleranceValuesOf(lexical);
              const situation = (): SplitSituation => {
                if (expected.length === 0) {
                  return "none";
                }

                if (expected.length > 1) {
                  return "several";
                }

                return expected[0] === lexical ? "bare" : "padded";
              };
              c.note(situation());

              const pieces = tolerancePiecesOf(lexical);
              assert.deepStrictEqual(
                pieces.map(({ token }) => token),
                expected,
                JSON.stringify(lexical),
              );
              if (pieces.length > 0) {
                assert.strictEqual(pieces.map(({ piece }) => piece).join(""), lexical);
              }

              for (const [at, { after, before, piece, token }] of pieces.entries()) {
                assert.strictEqual(piece, `${before}${token}${after}`);
                assert.isTrue(at === 0 || before !== "", JSON.stringify(lexical));
                assert.isTrue(at === pieces.length - 1 || after === "", JSON.stringify(lexical));
              }
            }),
        ),
      ),
  );
});

/**
 * The patterns the database's checks read, as PostgreSQL's `~` reads them: each anchored, of
 * classes, groups and alternation alone, which ECMAScript's `u` mode reads the same.
 */
const database = {
  integer: new RegExp(integerForm, "u"),
  numeric: new RegExp(doublePattern, "u"),
  positive: new RegExp(positivePattern, "u"),
};

/**
 * The first 18 digits of both ends of the signed 64-bit range, `9223372036854775807` and
 * `-9223372036854775808`: a piece of the figures box, so that a stem followed by 7, 8 or 9 writes
 * the greatest integer, one past it, and with a sign the least and one past it.
 */
const int64Stem = "922337203685477580";

/**
 * A situation the figures box must reach: an integer, a form that is none, and each end of the
 * range, which the box reaches with the forms one past it beside.
 */
type FiguresSituation = "integer" | "no integer" | "the greatest integer" | "the least integer";

/**
 * The ends of the signed 64-bit range.
 */
const int64Range = { max: 2n ** 63n - 1n, min: -(2n ** 63n) } as const;

describe(
  "qti/operators.ts, integerForm over a collapsed figures",
  { timeout: searchTimeout },
  () => {
    it.effect(
      "reads every figures of at most 4 pieces over the box as reading 119 does, collapsed: an integer exactly where the specification reads one, at its value",
      (ctx) =>
        // Oracle: the specification as a checker, the union's xs:integer member read collapsed
        // within reading 46's signed 64-bit range, `#pantry/test/operator-spec.ts` figuresIntegerOf.
        // Bound: every figures of at most 4 pieces over 0, 1, 7, 8, 9, +, -, space, tab, F and
        // {@link int64Stem}, 16,105, which reach both ends of the range and one past each.
        searched(
          ctx,
          exhaust(
            {
              box: "every figures of at most 4 pieces over 0 1 7 8 9 + - space tab F and the 64-bit bounds' first 18 digits",
              caseHang: Duration.seconds(10),
              coverage: requiredInSpace<FiguresSituation>([
                "integer",
                "no integer",
                "the greatest integer",
                "the least integer",
              ]),
              generator: string(
                element(["0", "1", "7", "8", "9", "+", "-", " ", "\t", "F", int64Stem] as const),
                { max: 4, min: 0 },
              ),
              limit: 16_105,
              literal: (value) => JSON.stringify(value),
              oracle: {
                kind: "specification",
                name: "xs:integer's lexical space, collapsed, within the signed 64-bit range",
              },
              suite: "import/overlays/operators-figures",
            },
            (lexical: string, c) =>
              Effect.sync(() => {
                const spec = figuresIntegerOf(lexical);
                c.note(spec === undefined ? "no integer" : "integer");
                if (spec === int64Range.max) {
                  c.note("the greatest integer");
                }

                if (spec === int64Range.min) {
                  c.note("the least integer");
                }

                const figures = collapsedText(lexical);
                assert.deepStrictEqual(
                  database.integer.test(figures) ? BigInt(figures) : undefined,
                  spec,
                  JSON.stringify(lexical),
                );
              }),
          ),
        ),
    );
  },
);

/**
 * Response processing of four rounding operators and three equalities: a `qti-equal-rounded` with
 * no mode and padded figures, one under decimalPlaces naming a variable, a `qti-round-to` with
 * no mode and one with no figures, and equalities with no tolerance, a padded one and an empty
 * one.
 */
const fourRounders = [
  `<qti-set-outcome-value identifier="FLAG"><qti-equal-rounded figures=" 0 "><qti-variable identifier="SCORE"/><qti-variable identifier="SCORE"/></qti-equal-rounded></qti-set-outcome-value>`,
  `<qti-set-outcome-value identifier="FLAG"><qti-equal-rounded rounding-mode="decimalPlaces" figures="F"><qti-variable identifier="SCORE"/><qti-variable identifier="SCORE"/></qti-equal-rounded></qti-set-outcome-value>`,
  `<qti-set-outcome-value identifier="SCORE"><qti-round-to figures="-07"><qti-variable identifier="SCORE"/></qti-round-to></qti-set-outcome-value>`,
  `<qti-set-outcome-value identifier="SCORE"><qti-round-to rounding-mode="significantFigures"><qti-variable identifier="SCORE"/></qti-round-to></qti-set-outcome-value>`,
  `<qti-set-outcome-value identifier="FLAG"><qti-equal tolerance-mode="absolute"><qti-variable identifier="SCORE"/><qti-variable identifier="SCORE"/></qti-equal></qti-set-outcome-value>`,
  `<qti-set-outcome-value identifier="FLAG"><qti-equal tolerance=" 0.5&#9;T "><qti-variable identifier="SCORE"/><qti-variable identifier="SCORE"/></qti-equal></qti-set-outcome-value>`,
  `<qti-set-outcome-value identifier="FLAG"><qti-equal tolerance=""><qti-variable identifier="SCORE"/><qti-variable identifier="SCORE"/></qti-equal></qti-set-outcome-value>`,
].join("");

describe("import/overlays/operators.ts, rowsOf", () => {
  it.effect(
    "gives every rounding row its node's tuple, and its context's nearest, the document's own under its own context",
    () =>
      // Oracle: the tree's own rows, `flatten`'s node of each operator, and N8: response processing
      // stands in no interaction, so each node's nearest is the document node's, its context's
      // where one is given.
      Effect.gen(function* tuples() {
        const tree = yield* itemOf(fourRounders);
        const nodes = flatten(tree, idOf);
        const context: DocumentContext = {
          ancestry: new Set(),
          nearest: idOf(9999),
          nearestKind: "document",
        };

        for (const [given, nearest] of [
          [ownContext(nodes.document.node), nodes.document.node],
          [context, idOf(9999)],
        ] as const) {
          const rows = rowsOf(tree, { context: given, idOf });
          const rounders = nodes.nodes.filter(
            ({ kind }) => kind === "qti-equal-rounded" || kind === "qti-round-to",
          );

          assert.strictEqual(rows.Rounding.size, rounders.length);
          for (const node of rounders) {
            const row = rows.Rounding.get(node.id);
            assert.deepStrictEqual(
              row === undefined
                ? undefined
                : [row.document, row.kind, row.nearest, row.parent, row.start, row.version],
              [nodes.document.node, node.kind, nearest, node.parent, node.start, node.version],
            );
          }
        }
      }),
  );

  it.effect("gives a document with no operator no row", () =>
    // Oracle: the specification as a checker: readings 119 and 121 read the three operators alone.
    Effect.gen(function* none() {
      const rows = rowsOf(
        yield* itemOf(
          `<qti-set-outcome-value identifier="SCORE"><qti-variable identifier="SCORE"/></qti-set-outcome-value>`,
        ),
        { context: ownContext(idOf(0)), idOf },
      );

      assert.strictEqual(rows.Rounding.size + rows.Tolerance.size, 0);
    }),
  );
});

/**
 * The least `figures` reading 119 admits under each mode.
 */
const leastFigures: ReadonlyMap<string, bigint> = new Map([
  ["decimalPlaces", 0n],
  ["significantFigures", 1n],
]);

/**
 * Restate `E1_derived` over a rounding operator's `Rounding` row and the detail rows it holds, and
 * the mirrors between them, as PostgreSQL evaluates them: what it holds, by its mode in force and
 * its `figures`; the collapsed `figures`; the written or default mode; and its `both` arm, copying
 * both.
 *
 * @param rows - The operator's document's rows, which hold one rounding operator.
 * @returns Whether every one holds.
 */
const roundingDerived = (rows: OperatorRows): boolean => {
  const [rounding] = [...rows.Rounding.values()];
  const [figures] = [...rows.RoundingFigures.values()];
  const [mode] = [...rows.RoundingMode.values()];
  const [both] = [...rows.RoundingModeFigures.values()];
  if (rounding === undefined) {
    return false;
  }

  const moded = rounding.modeWritten || rounding.kind === "qti-equal-rounded";
  const holdsMode = rounding.holds === "mode" || rounding.holds === "both";
  const holdsFigures = rounding.holds === "figures" || rounding.holds === "both";
  const modeHeld =
    mode === undefined ||
    (mode.modeWritten === rounding.modeWritten &&
      (mode.modeWritten || (mode.kind === "qti-equal-rounded" && mode.mode === equalRoundedMode)));

  return (
    holdsMode === moded &&
    holdsFigures === (figures !== undefined) &&
    holdsMode === (mode !== undefined) &&
    (rounding.holds === "both") === (both !== undefined) &&
    (figures === undefined || figures.figures === collapsedText(figures.figuresLexical)) &&
    modeHeld &&
    (both === undefined || (both.figures === figures?.figures && both.mode === mode?.mode))
  );
};

/**
 * Restate `Rounding_figures` over a rounding operator's `both` arm, as PostgreSQL evaluates it:
 * an integer `figures` at least its mode's least.
 *
 * @param rows - The operator's document's rows, which hold one rounding operator.
 * @returns Whether it holds, as it does where the operator has no such arm.
 */
const roundingFiguresHolds = (rows: OperatorRows): boolean =>
  [...rows.RoundingModeFigures.values()].every(
    ({ figures, mode }) =>
      !database.integer.test(figures) ||
      Option.match(Option.fromNullishOr(leastFigures.get(mode)), {
        onNone: () => true,
        onSome: (least) => BigInt(figures) >= least,
      }),
  );

/**
 * Restate reading 121's laws over a `qti-equal`'s rows, as PostgreSQL evaluates them: the
 * presence containment from a written `absolute` or `relative` mode into `Tolerance`, the count
 * check and each value's sign check.
 *
 * @param mode - The `tolerance-mode` as written, none where it writes none.
 * @param row - Its `Tolerance` row, none where it has none.
 * @returns Whether all three hold.
 */
const toleranceChecks = (mode: string | undefined, row: ToleranceRow | undefined): boolean =>
  (row !== undefined || (mode !== "absolute" && mode !== "relative")) &&
  (row === undefined ||
    ((row.tokens.length === 1 || row.tokens.length === 2) &&
      row.tokens.every(
        ({ token }) => !database.numeric.test(token) || database.positive.test(token),
      )));

/**
 * The named forms an operator a swarm draws takes: the floor `figures` first.
 */
const OPERATOR_FORMS = [
  "figures",
  "figures-padded",
  "mode",
  "tolerance",
  "tolerance-spacing",
] as const;

/**
 * An operator's named form.
 */
type OperatorForm = (typeof OPERATOR_FORMS)[number];

/**
 * One drawn operator: its kind and its attributes as written, each none where it writes none.
 */
interface DrawnOperator {
  readonly figures: string | undefined;
  readonly kind: RoundingKind | "qti-equal";
  readonly mode: string | undefined;
  readonly form: OperatorForm;
  readonly tolerance: string | undefined;
}

/**
 * A tolerance value, from each corner of `xs:double`'s lexical space and past it.
 */
const toleranceValue: Gen<string> = element([
  "1",
  "0.5",
  ".5",
  "5.",
  "1e3",
  "1E-2",
  "+2",
  "0",
  "-0",
  "0.0",
  "0e5",
  "-1",
  "-0.5",
  "-0.12345678901234567",
  "NaN",
  "INF",
  "-INF",
  "+INF",
  "1e-400",
  "T",
  "1.2.3",
] as const);

/**
 * Whitespace runs a tolerance's values are separated and padded by.
 */
const spacing: Gen<string> = string(element([" ", "\t", "\n", "\r"] as const), { max: 2, min: 1 });

/**
 * The rounding operators and their modes, each mode none, a value or a near miss.
 */
const rounder: Gen<Pick<DrawnOperator, "kind" | "mode">> = (source) => ({
  kind: source.draw(element(["qti-equal-rounded", "qti-round-to"] as const)),
  mode: source.draw(element([undefined, "decimalPlaces", "significantFigures"] as const)),
});

/**
 * Each named form's generator.
 */
const FORM_GENERATORS: Readonly<Record<OperatorForm, Gen<DrawnOperator>>> = {
  figures: (source) => ({
    ...source.draw(rounder),
    figures: source.draw(element([undefined, "-1", "0", "1", "2", "F", "1.5"] as const)),
    form: "figures",
    tolerance: undefined,
  }),
  "figures-padded": (source) => ({
    ...source.draw(rounder),
    figures: `${source.draw(spacing)}${String(source.draw(int(-1, 1)))}${source.draw(spacing)}`,
    form: "figures-padded",
    tolerance: undefined,
  }),
  mode: (source) => ({
    figures: String(source.draw(int(-1, 1))),
    form: "mode",
    kind: source.draw(element(["qti-equal-rounded", "qti-round-to"] as const)),
    mode: source.draw(element(["", " decimalPlaces", "DecimalPlaces"] as const)),
    tolerance: undefined,
  }),
  tolerance: (source) => ({
    figures: undefined,
    form: "tolerance",
    kind: "qti-equal",
    mode: source.draw(element([undefined, "exact", "absolute", "relative", "Absolute"] as const)),
    tolerance: source.draw(
      element([
        undefined,
        "",
        ...(["1", "1 2", "1 2 3"] as const),
        `${source.draw(toleranceValue)} ${source.draw(toleranceValue)}`,
      ]),
    ),
  }),
  "tolerance-spacing": (source) => {
    const values = Array.from({ length: source.draw(int(0, 3)) }, () =>
      source.draw(toleranceValue),
    );

    return {
      figures: undefined,
      form: "tolerance-spacing",
      kind: "qti-equal",
      mode: source.draw(element([undefined, "absolute", "relative"] as const)),
      tolerance: `${source.draw(spacing)}${values.map((value) => `${value}${source.draw(spacing)}`).join("")}`,
    };
  },
};

/**
 * One operator, its form drawn by a swarm over the named forms.
 */
const drawnOperator: Gen<DrawnOperator> = (source) =>
  source.draw(
    FORM_GENERATORS[source.draw(swarmChoice(source.draw(swarm(OPERATOR_FORMS)), OPERATOR_FORMS))],
  );

/**
 * Escape a text for an attribute value written between double quotes, so the reader gives it back
 * as written: `&`, `<`, `"` and the three whitespace controls as references.
 *
 * @param text - The text.
 * @returns The escaped text.
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
 * Write the rule that holds one drawn operator.
 *
 * @param drawnCase - The operator.
 * @returns The rule.
 */
const ruleOfOperator = ({ figures, kind, mode, tolerance }: DrawnOperator): string => {
  const attributes = (
    kind === "qti-equal"
      ? [
          ["tolerance-mode", mode],
          ["tolerance", tolerance],
        ]
      : [
          ["rounding-mode", mode],
          ["figures", figures],
        ]
  )
    .flatMap(([name, value]) => (value === undefined ? [] : [` ${name}="${attributeText(value)}"`]))
    .join("");

  return kind === "qti-round-to"
    ? `<qti-set-outcome-value identifier="SCORE"><qti-round-to${attributes}><qti-variable identifier="SCORE"/></qti-round-to></qti-set-outcome-value>`
    : `<qti-set-outcome-value identifier="FLAG"><${kind}${attributes}><qti-variable identifier="SCORE"/><qti-variable identifier="SCORE"/></${kind}></qti-set-outcome-value>`;
};

/**
 * Assert a drawn `qti-equal`'s rows: one `Tolerance` row exactly where it writes `tolerance`,
 * copying it, and reading 121's laws over it breaking exactly where the specification refuses.
 *
 * @param drawnCase - The operator.
 * @param rows - Its document's rows.
 * @returns Nothing; it fails on a disagreement.
 */
const assertEquality = (drawnCase: DrawnOperator, rows: OperatorRows): void => {
  const message = JSON.stringify(drawnCase);
  const [row, ...rest] = [...rows.Tolerance.values()];

  assert.strictEqual(rows.Rounding.size, 0, message);
  assert.strictEqual(rest.length, 0, message);
  assert.strictEqual(row?.lexical, drawnCase.tolerance, message);
  assert.strictEqual(
    !toleranceChecks(drawnCase.mode, row),
    toleranceRefused(drawnCase.mode, drawnCase.tolerance),
    message,
  );
};

/**
 * Assert a drawn rounding operator's rows: one `Rounding` row; a `RoundingFigures` row exactly
 * where it writes `figures`, copying it; a `RoundingMode` row exactly where a mode is in force,
 * copying its `rounding-mode` or holding the default; all meeting `E1_derived`; and breaking
 * `Rounding_figures` exactly where the specification refuses.
 *
 * @param kind - The operator's kind.
 * @param drawnCase - The operator.
 * @param rows - Its document's rows.
 * @returns Nothing; it fails on a disagreement.
 */
const assertRounding = (kind: RoundingKind, drawnCase: DrawnOperator, rows: OperatorRows): void => {
  const message = JSON.stringify(drawnCase);
  const [row, ...rest] = [...rows.Rounding.values()];
  const figures = [...rows.RoundingFigures.values()].map(({ figuresLexical }) => figuresLexical);
  const modes = [...rows.RoundingMode.values()].map(({ mode }) => mode);

  assert.strictEqual(rows.Tolerance.size, 0, message);
  assert.strictEqual(rest.length, 0, message);
  assert.isDefined(row, `no Rounding row: ${message}`);
  assert.strictEqual(row?.modeWritten, drawnCase.mode !== undefined, message);
  assert.deepStrictEqual(
    figures,
    drawnCase.figures === undefined ? [] : [drawnCase.figures],
    message,
  );

  const defaulted = kind === "qti-equal-rounded" ? [equalRoundedMode] : [];
  assert.deepStrictEqual(
    modes,
    drawnCase.mode === undefined ? defaulted : [drawnCase.mode],
    message,
  );
  assert.isTrue(roundingDerived(rows), `E1_derived breaks: ${message}`);
  assert.strictEqual(
    !roundingFiguresHolds(rows),
    roundingRefused(kind, drawnCase.mode, drawnCase.figures),
    message,
  );
};

describe(
  "import/overlays/operators.ts, rowsOf under the database's checks",
  { timeout: searchTimeout },
  () => {
    it.effect(
      "gives each operator a swarm draws rows that copy its attributes, meet E1, and break a law exactly where the specification refuses it",
      (ctx) =>
        // Oracle: the specification as a checker, readings 119 and 121,
        // `#pantry/test/operator-spec.ts`, against `operatorLaws`' checks restated over the
        // builder's rows with the very patterns the database reads.
        searched(
          ctx,
          explore(
            {
              caseHang: Duration.seconds(30),
              concurrency: 1,
              coverage: required<OperatorForm>(OPERATOR_FORMS, { cases: 200, sense: notesOnly }),
              draw: drawn(drawnOperator),
              kept: [],
              literal: (drawnCase) => JSON.stringify(drawnCase),
              oracle: {
                kind: "specification",
                name: "the information model's EqualRounded, RoundTo and Equal, readings 119 and 121",
              },
              runs: 200,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "import/overlays/operators-checks",
            },
            (drawnCase, c) =>
              Effect.gen(function* checks() {
                c.note(drawnCase.form);

                const rows = rowsOf(yield* itemOf(ruleOfOperator(drawnCase)), {
                  context: ownContext(idOf(0)),
                  idOf,
                });

                if (drawnCase.kind === "qti-equal") {
                  assertEquality(drawnCase, rows);
                } else {
                  assertRounding(drawnCase.kind, drawnCase, rows);
                }
              }),
          ),
        ),
    );
  },
);
