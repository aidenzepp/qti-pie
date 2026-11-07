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
 *
 * Bound: every case {@link cases} lists, exhausted: each n-ary operator over every pair of
 * integer operands of the cardinalities it names and one it does not; each bounded random
 * operator's `min` as a literal and as each variable of the item; each outcome-only expression in
 * response and in outcome processing, and under an operator that takes a single and one that
 * takes a container. Each sits under `qti-is-null`, which takes any type, in a condition, so no
 * other rule reads it. The outcome-only expressions' base type, float by Table 6.9.64, is not
 * held here: the grammar types it unknown, a disagreement routed to the coordinator on 2026-11-07,
 * and its case joins this box with the fix.
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
  TI: { base: "integer", cardinality: "single", role: "template" },
} as const;

/**
 * One variable's name.
 */
type Variable = keyof typeof variables;

/**
 * The variables' names, each once.
 */
const variableNames = ["F1", "I1", "IM", "IO", "RI", "TI"] as const satisfies readonly Variable[];

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
  .map(([name, { base, cardinality, role }]) =>
    role === "template"
      ? `<qti-template-declaration identifier="${name}" cardinality="${cardinality}" base-type="${base}"/>`
      : `<qti-${role}-declaration identifier="${name}" cardinality="${cardinality}" base-type="${base}"/>`,
  )
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
