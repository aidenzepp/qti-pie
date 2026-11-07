/**
 * Expression typing judged by the information model's own words, written without the grammar's
 * typing table (`#pantry/grammar/expression.ts`), which the law oracle and the import share: the
 * cardinalities an n-ary operator takes and whether they may mix, the variables a numeric
 * attribute may name in place of a literal, and the outcome-only expressions' context and
 * cardinality.
 *
 * Oracle: the specification turned into a checker, from the normative §6, §7 and §9 class tables
 * (QTI 3.0 information model; its §2 is not normative, and makes no law, as reading 26 learnt):
 *
 * - Table 6.9 `qti-multiple`: "all of which must have either single or multiple cardinality ... they
 *   must all be of the same base-type"; `qti-ordered`: "either single or ordered"; `qti-sum` and
 *   `qti-product`: "all have numerical base-types and may have single, multiple or ordered
 *   cardinality". None asks its operands to share a cardinality.
 * - Table 9.3.3 IntegerOrVariableRef: "may be replaced with the value of a template or outcome
 *   variable of base type integer and single cardinality", and FloatOrVariableRef the same of
 *   float; the name is written bare, the XSD's `VariableStringDType` (reading 119).
 * - Table 6.9.64 `qti-outcome-maximum` (and 6.9.65 `qti-outcome-minimum`): "can only be used in
 *   outcomes processing" (reading 23) and "the result has cardinality multiple".
 * - Table 6.9, each leaf's result: its row in {@link leafResults}, with the sentence that types it or
 *   leaves it open. Both versions' tables say the same of every leaf.
 *
 * Bound: every case {@link cases} lists, exhausted: each n-ary operator over every pair of
 * integer operands of the cardinalities it names and one it does not; each bounded random
 * operator's `min` as a literal and as each variable of the item; each outcome-only expression in
 * response and in outcome processing, and under an operator that takes a single and one that
 * takes a container; and each leaf the tables type, matched against a value of its base type and
 * of another, of its cardinality (`qti-match` takes "the same base-type and cardinality"). Each
 * sits under `qti-is-null`, which takes any type, in a condition, so no other rule reads it. Kept:
 * `qti-outcome-maximum` matched against a multiple string, which the grammar accepted while it
 * typed the leaf's base unknown (GEN-B, 2026-11-07).
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, lawsOf } from "#pantry/test/oracle.ts";
import { asiNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The composed grammar.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The law oracle's tables.
 */
const laws = lawsOf(grammar);

/**
 * A cardinality of QTI's, but record.
 */
type Cardinality = "multiple" | "ordered" | "single";

/**
 * The item's variables, each with what the spec reads of it: its role (a response, an outcome or
 * a template variable), base type and cardinality.
 */
const variables = {
  F1: { base: "float", cardinality: "single", role: "outcome" },
  I1: { base: "integer", cardinality: "single", role: "outcome" },
  IM: { base: "integer", cardinality: "multiple", role: "outcome" },
  IO: { base: "integer", cardinality: "ordered", role: "outcome" },
  RI: { base: "integer", cardinality: "single", role: "response" },
  RM: { base: "integer", cardinality: "single", role: "response" },
  RP: { base: "point", cardinality: "single", role: "response" },
  TI: { base: "integer", cardinality: "single", role: "template" },
} as const;

/**
 * One variable's name.
 */
type Variable = keyof typeof variables;

/**
 * The variables' names, each once.
 */
const variableNames = [
  "F1",
  "I1",
  "IM",
  "IO",
  "RI",
  "RM",
  "RP",
  "TI",
] as const satisfies readonly Variable[];

/**
 * An integer operand of each cardinality: a literal for single, a variable for the containers.
 */
const integerOf: Readonly<Record<Cardinality, string>> = {
  multiple: `<qti-variable identifier="IM"/>`,
  ordered: `<qti-variable identifier="IO"/>`,
  single: `<qti-base-value base-type="integer">1</qti-base-value>`,
};

/**
 * The cardinalities each n-ary operator's operands may have (Table 6.9); none asks them to agree.
 */
const operandCardinalities = {
  "qti-multiple": ["single", "multiple"],
  "qti-ordered": ["single", "ordered"],
  "qti-product": ["single", "multiple", "ordered"],
  "qti-sum": ["single", "multiple", "ordered"],
} satisfies Readonly<Record<string, readonly Cardinality[]>>;

/**
 * Whether a variable may stand in place of a numeric literal of a base type (Table 9.3.3): a
 * template or outcome variable of that base type and single cardinality.
 *
 * @param name - The variable's name.
 * @param base - The literal's base type.
 * @returns Whether it may.
 */
const standsFor = (name: Variable, base: "float" | "integer"): boolean => {
  const { base: held, cardinality, role } = variables[name];

  return role !== "response" && held === base && cardinality === "single";
};

/**
 * Each leaf's result as Table 6.9 states it, in both versions: its base type and cardinality, or
 * `open` with the sentence that leaves it open, and the context and attributes it is written
 * with. A leaf typed by its own attribute or by its variable's declaration (`qti-base-value`,
 * `qti-correct`, `qti-default`, `qti-variable`) is no leaf of a fixed type, and is not listed.
 */
const leafResults: readonly {
  readonly context: "outcome" | "response";
  readonly element: string;
  readonly result:
    | { readonly _tag: "open"; readonly says: string }
    | {
        readonly _tag: "typed";
        readonly base: "float" | "integer";
        readonly cardinality: Cardinality;
        readonly says: string;
      };
}[] = [
  {
    context: "response",
    element: `<qti-map-response identifier="RM"/>`,
    result: {
      _tag: "typed",
      base: "float",
      cardinality: "single",
      says: "The result is a single float.",
    },
  },
  {
    context: "response",
    element: `<qti-map-response-point identifier="RP"/>`,
    result: {
      _tag: "typed",
      base: "float",
      cardinality: "single",
      says: "The transformation is similar to mapResponse (whose result is a single float)",
    },
  },
  {
    context: "response",
    element: `<qti-math-constant name="pi"/>`,
    result: {
      _tag: "typed",
      base: "float",
      cardinality: "single",
      says: "returned as a single float",
    },
  },
  {
    context: "response",
    element: `<qti-null/>`,
    result: {
      _tag: "open",
      says: "the null value is treated as if it is of any desired base-type",
    },
  },
  ...["correct", "incorrect", "presented", "responded", "selected"].map((which) => ({
    context: "outcome" as const,
    element: `<qti-number-${which}/>`,
    result: {
      _tag: "typed" as const,
      base: "integer" as const,
      cardinality: "single" as const,
      says: "The result is an integer with single cardinality.",
    },
  })),
  {
    context: "outcome",
    element: `<qti-outcome-maximum outcome-identifier="SCORE"/>`,
    result: {
      _tag: "typed",
      base: "float",
      cardinality: "multiple",
      says: "otherwise the result has cardinality multiple and base-type float",
    },
  },
  {
    context: "outcome",
    element: `<qti-outcome-minimum outcome-identifier="SCORE"/>`,
    result: {
      _tag: "typed",
      base: "float",
      cardinality: "multiple",
      says: "The result has cardinality multiple and base-type float.",
    },
  },
  {
    context: "response",
    element: `<qti-random-float min="0" max="1"/>`,
    result: { _tag: "typed", base: "float", cardinality: "single", says: "Selects a random float" },
  },
  {
    context: "response",
    element: `<qti-random-integer min="0" max="1"/>`,
    result: {
      _tag: "typed",
      base: "integer",
      cardinality: "single",
      says: "Selects a random integer",
    },
  },
  {
    context: "outcome",
    element: `<qti-test-variables variable-identifier="SCORE"/>`,
    result: {
      _tag: "open",
      says: "If omitted, variables declared with base-type integer or float are matched. The base-type of the result is integer if all matching values have base-type integer, otherwise it is float (Table 7.39.6)",
    },
  },
];

/**
 * A value of a base type and a cardinality, written as an operand.
 *
 * @param base - The base type.
 * @param cardinality - The cardinality, single or multiple.
 * @returns The operand.
 */
const valueOf = (base: "float" | "integer" | "string", cardinality: Cardinality): string => {
  const single = `<qti-base-value base-type="${base}">${{ float: "1.5", integer: "1", string: "a" }[base]}</qti-base-value>`;

  return cardinality === "single" ? single : `<qti-multiple>${single}</qti-multiple>`;
};

/**
 * One case: where it stands, the expression, and the spec's verdict.
 */
interface Case {
  readonly context: "outcome" | "response";
  readonly expression: string;
  readonly name: string;
  readonly valid: boolean;
}

/**
 * Every case of the box.
 */
const cases: readonly Case[] = [
  ...Object.entries(operandCardinalities).flatMap(
    ([kind, admitted]: readonly [string, readonly Cardinality[]]) =>
      (["single", "multiple", "ordered"] as const).flatMap((first) =>
        (["single", "multiple", "ordered"] as const).map((second): Case => ({
          context: "response",
          expression: `<${kind}>${integerOf[first]}${integerOf[second]}</${kind}>`,
          name: `${kind} of ${first} and ${second}`,
          valid: admitted.includes(first) && admitted.includes(second),
        })),
      ),
  ),
  ...(
    [
      ["qti-random-integer", "integer", "0"],
      ["qti-random-float", "float", "0.5"],
    ] as const
  ).flatMap(([kind, base, literal]) => [
    {
      context: "response" as const,
      expression: `<${kind} min="${literal}" max="5"/>`,
      name: `${kind} min a literal`,
      valid: true,
    },
    ...variableNames.map((name): Case => ({
      context: "response",
      expression: `<${kind} min="${name}" max="5"/>`,
      name: `${kind} min ${name}`,
      valid: standsFor(name, base),
    })),
  ]),
  ...leafResults.flatMap(({ context, element, result }): readonly Case[] =>
    result._tag === "open"
      ? []
      : [
          {
            context,
            expression: `<qti-match>${element}${valueOf(result.base, result.cardinality)}</qti-match>`,
            name: `${element} matched against its own base`,
            valid: true,
          },
          {
            context,
            expression: `<qti-match>${element}${valueOf("string", result.cardinality)}</qti-match>`,
            name: `${element} matched against a string`,
            valid: false,
          },
        ],
  ),
  ...["qti-outcome-maximum", "qti-outcome-minimum"].flatMap((kind): readonly Case[] => {
    const leaf = `<${kind} outcome-identifier="SCORE"/>`;

    return [
      {
        context: "response",
        expression: leaf,
        name: `${kind} in response processing`,
        valid: false,
      },
      { context: "outcome", expression: leaf, name: `${kind} in outcome processing`, valid: true },
      {
        context: "outcome",
        expression: `<qti-container-size>${leaf}</qti-container-size>`,
        name: `${kind}, multiple, under a container's operator`,
        valid: true,
      },
      {
        context: "outcome",
        expression: `<qti-round>${leaf}</qti-round>`,
        name: `${kind}, multiple, under a single's operator`,
        valid: false,
      },
    ];
  }),
];

/**
 * The item's declarations, each variable of {@link variables} as its role declares it.
 */
const declarations = Object.entries(variables)
  .map(([name, { base, cardinality, role }]) => {
    const element = role === "template" ? "qti-template-declaration" : `qti-${role}-declaration`;
    const mapping =
      {
        RM: `<qti-mapping default-value="0"><qti-map-entry map-key="1" mapped-value="1"/></qti-mapping>`,
        RP: `<qti-area-mapping default-value="0"><qti-area-map-entry shape="circle" coords="0,0,1" mapped-value="1"/></qti-area-mapping>`,
      }[name] ?? "";

    return `<${element} identifier="${name}" cardinality="${cardinality}" base-type="${base}">${mapping}</${element}>`;
  })
  .toSorted(
    (left, right) =>
      ["response", "outcome", "template"].findIndex((role) => left.includes(`qti-${role}-`)) -
      ["response", "outcome", "template"].findIndex((role) => right.includes(`qti-${role}-`)),
  );

/**
 * Write the document a case stands in: an item's response processing, or a test's outcome
 * processing, the expression under `qti-is-null` in a condition.
 *
 * @param drawn - The case.
 * @returns The document's text.
 */
const documentOf = ({ context, expression }: Case): string =>
  context === "response"
    ? `<qti-assessment-item xmlns="${asiNamespace}" identifier="i" title="t" time-dependent="false" adaptive="false">${declarations.join("")}<qti-item-body><p>x</p></qti-item-body><qti-response-processing><qti-response-condition><qti-response-if><qti-is-null>${expression}</qti-is-null></qti-response-if></qti-response-condition></qti-response-processing></qti-assessment-item>`
    : `<qti-assessment-test xmlns="${asiNamespace}" identifier="T" title="t"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="s" visible="true"><qti-assessment-item-ref identifier="I" href="i.xml"/></qti-assessment-section></qti-test-part><qti-outcome-processing><qti-outcome-condition><qti-outcome-if><qti-is-null>${expression}</qti-is-null></qti-outcome-if></qti-outcome-condition></qti-outcome-processing></qti-assessment-test>`;

describe("expression typing by the information model's tables", () => {
  it.effect(
    "the law oracle refuses exactly the cases Tables 6.9, 6.9.64 and 9.3.3 make invalid, in both versions",
    () =>
      Effect.gen(function* everyCase() {
        const wrong: string[] = [];
        for (const version of ["3.0.0", "3.0.1"] as const) {
          for (const drawn of cases) {
            const read = yield* Effect.orDie(readXml(new TextEncoder().encode(documentOf(drawn))));
            const tree = yield* Effect.result(shred(read, version, shredGrammarOf(grammar)));
            const broken = Result.isFailure(tree)
              ? [tree.failure.message]
              : Result.match(fold(tree.success, idOf, foldGrammarOf(grammar)), {
                  onFailure: (failure) => [String(failure)],
                  onSuccess: (rows) =>
                    documentBreaches("doc.xml", rows, laws).map(({ law }) => law),
                });
            if ((broken.length === 0) !== drawn.valid) {
              wrong.push(
                `${version} ${drawn.name}: spec ${drawn.valid ? "valid" : "invalid"}, oracle ${broken.length === 0 ? "accepts" : `refuses (${broken.join(", ")})`}`,
              );
            }
          }
        }

        assert.isAbove(cases.length, 0, "the box holds cases");
        assert.deepStrictEqual(wrong, [], "the oracle and the tables agree on every case");
      }),
    { timeout: 120_000 },
  );
});
