/**
 * A Delete's type, as the import writes it beside the law oracle's: the type of its second operand,
 * NULL's where it has none, and its later operands' one type where it writes more.
 *
 * QTI types a Delete by its second operand alone: "The result is a new container derived from the
 * second sub-expression ... If either sub-expression is NULL the result of the operator is NULL"
 * (information model, Table 6.9.20, normative), and NULL "is treated as if it is of any desired
 * base-type" (Table 6.9.19), the `any` of `ValueBase`, with no cardinality, as `qti-null` is typed.
 * A Delete that writes one operand, which `Arity` refuses, has no second sub-expression to derive a
 * container from, so its result is NULL, as a Multiple's is where "no sub-expressions are given"
 * (Table 6.9.13): `any` and `unknown`, as the schema's `resultDerived` states it over an empty
 * `tailBaseTypes` and the law oracle's `second` typing reads an empty tail. The import typed it
 * `unknown`, the type of a value no declaration types (reading 4), which no Delete's is, so its
 * rows broke the schema's `E1_derived` beside the oracle's `Arity`.
 *
 * A Delete that writes three operands or more, which `Arity` refuses too, is typed by one rule on
 * each side: its later operands' one base type, NULL's `any` set aside, and their one cardinality,
 * NULL's none set aside; NULL's type where they hold none, and `unknown` where they hold several,
 * as a container is typed by its operands (the schema's `baseOfTail` and `cardinalityOfTail`, the
 * oracle's `second` typing). The import read its second operand alone, so a NULL second operand
 * before a multiple typed the Delete `any` where the oracle reads the multiple's type.
 *
 * The genetic differential's judge (`judgeOne`) cannot see this: its host leaves every check that
 * reads a fold's end unknown, since the database draws the folds, and `E1_derived` reads
 * `tailBaseTypes`. So the import's `Expression` rows are held to the law oracle's typing itself.
 *
 * Oracle: a second implementation, the law oracle's typing (`typedOf` of
 * `#pantry/test/oracle-laws/expressions.ts`) over the document as the oracle folds it, against the
 * `Expression` rows the import's overlay writes (`rowsOf`) over the same tree: each expression's
 * base type and cardinality agree; and Table 6.9.20 and the later operands' rule as stated above
 * for the Delete itself.
 *
 * Bound: a Delete in a response condition, under `qti-is-null`, which takes any type, so no other
 * rule reads it, with one operand (a single base value of each of QTI's eleven base types, a
 * multiple of each, or a NULL) or two (a single of each base type with a multiple of it, an ordered
 * of it, or a NULL, and a NULL with a multiple) or three (an integer single with a NULL and an
 * integer multiple, two integer multiples, an integer multiple and ordered, an integer and a string
 * multiple, or two NULLs): 62 documents, exhausted.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Effect, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { rowsOf } from "#pantry/import/overlays/expressions.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { caseHang, idOf, searchTimeout } from "#pantry/test/gen/xdm.ts";
import { typedOf } from "#pantry/test/oracle-laws/expressions.ts";
import type { Type } from "#pantry/test/oracle-laws/expressions.ts";
import { lawsOf, typedReadingOf } from "#pantry/test/oracle.ts";
import { viewOf } from "#pantry/test/oracle-view.ts";
import { asiNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The oracle's law tables over the installed grammar.
 */
const laws = lawsOf(grammar);

/**
 * A literal of each of QTI's eleven base types, in its lexical space.
 */
const literals = {
  boolean: "true",
  directedPair: "a b",
  duration: "PT1S",
  file: "f",
  float: "1.5",
  identifier: "a",
  integer: "1",
  pair: "a b",
  point: "1 1",
  string: "s",
  uri: "http://example.org/",
} as const;

/**
 * One of QTI's eleven base types.
 */
type Base = keyof typeof literals;

/**
 * The eleven base types.
 */
const bases: readonly Base[] = Object.keys(literals).filter(
  (base): base is Base => base in literals,
);

/**
 * One operand a Delete writes: its element, and the type QTI gives it.
 */
interface Operand {
  readonly type: Type;
  readonly xml: string;
}

/**
 * NULL's type: `any`, of no cardinality.
 */
const nullType: Type = { base: "any", cardinality: "unknown" };

/**
 * A NULL.
 */
const nullOperand: Operand = { type: nullType, xml: "<qti-null/>" };

/**
 * A single base value of a base type.
 *
 * @param base - The base type.
 * @returns The operand.
 */
const singleOf = (base: Base): Operand => ({
  type: { base, cardinality: "single" },
  xml: `<qti-base-value base-type="${base}">${literals[base]}</qti-base-value>`,
});

/**
 * A container of one base value of a base type.
 *
 * @param base - The base type.
 * @param cardinality - The container: a Multiple or an Ordered.
 * @returns The operand.
 */
const containerOf = (base: Base, cardinality: "multiple" | "ordered"): Operand => ({
  type: { base, cardinality },
  xml: `<qti-${cardinality}>${singleOf(base).xml}</qti-${cardinality}>`,
});

/**
 * Every case: a Delete's operands, one or two.
 */
const cases: readonly (readonly Operand[])[] = [
  ...bases.map((base) => [singleOf(base)]),
  ...bases.map((base) => [containerOf(base, "multiple")]),
  [nullOperand],
  ...bases.flatMap((base) => [
    [singleOf(base), containerOf(base, "multiple")],
    [singleOf(base), containerOf(base, "ordered")],
    [singleOf(base), nullOperand],
  ]),
  [nullOperand, containerOf("integer", "multiple")],
  [singleOf("integer"), nullOperand, containerOf("integer", "multiple")],
  [singleOf("integer"), containerOf("integer", "multiple"), containerOf("integer", "multiple")],
  [singleOf("integer"), containerOf("integer", "multiple"), containerOf("integer", "ordered")],
  [singleOf("integer"), containerOf("integer", "multiple"), containerOf("string", "multiple")],
  [singleOf("integer"), nullOperand, nullOperand],
];

/**
 * The note of a case by its operand count, one to three.
 */
const countNotes = ["one operand", "two operands", "three operands"] as const;

/**
 * Write a case's item: a Delete under `qti-is-null` in a response condition.
 *
 * @param operands - The Delete's operands.
 * @returns The item's text.
 */
const itemOf = (operands: readonly Operand[]): string =>
  `<qti-assessment-item xmlns="${asiNamespace}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/><qti-item-body><p>x</p></qti-item-body><qti-response-processing><qti-response-condition><qti-response-if><qti-is-null><qti-delete>${operands.map(({ xml }) => xml).join("")}</qti-delete></qti-is-null></qti-response-if></qti-response-condition></qti-response-processing></qti-assessment-item>`;

/**
 * Read the one value of some operands' values, NULL's set aside: NULL's where they hold none, and
 * `unknown` where they hold several.
 *
 * @param values - The values.
 * @param none - NULL's value.
 * @returns The one value.
 */
const oneValueOf = (values: readonly string[], none: string): string =>
  Arr.match([...new Set(values.filter((value) => value !== none))], {
    onEmpty: () => none,
    onNonEmpty: ([only, ...rest]) => (rest.length === 0 ? only : "unknown"),
  });

/**
 * The type a Delete takes from its later operands: Table 6.9.20's, its second operand's, where it
 * writes two, NULL's where it writes one, and their one base type and one cardinality where it
 * writes more.
 *
 * @param operands - Its operands.
 * @returns The type.
 */
const deleteTypeOf = (operands: readonly Operand[]): Type => {
  const later = operands.slice(1).map(({ type }) => type);

  return {
    base: oneValueOf(
      later.map(({ base }) => base),
      nullType.base,
    ),
    cardinality: oneValueOf(
      later.map(({ cardinality }) => cardinality),
      nullType.cardinality,
    ),
  };
};

describe("import/overlays/expressions.ts, a Delete's type", () => {
  it.effect(
    "types a Delete as its second operand, as NULL where it has one operand, and as its later operands' one type where it has more, as the law oracle does",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "a Delete of one operand of each base type, a container of it or a NULL, of two, a single of each base type with a container of it or a NULL, or of three over integer and string containers and NULLs",
            caseHang,
            coverage: requiredInSpace<(typeof countNotes)[number]>(countNotes),
            generator: int(0, cases.length - 1),
            limit: cases.length,
            literal: (at) => itemOf(Arr.getUnsafe(cases, at)),
            oracle: {
              kind: "second-implementation",
              name: "the law oracle's typing and Table 6.9.20, against the import's Expression rows",
            },
            suite: "import/overlays/expressions/delete",
          },
          (at, c) =>
            Effect.gen(function* deleteCase() {
              const operands = Arr.getUnsafe(cases, at);
              c.note(Arr.getUnsafe(countNotes, operands.length - 1));
              assert.strictEqual(cases.length, 62);

              const item = itemOf(operands);
              const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(item)));
              const tree = yield* Effect.orDie(shred(xml, "3.0.0", shredGrammarOf(grammar)));
              const folded = Result.getOrThrow(fold(tree, idOf, foldGrammarOf(grammar)));
              const typed = typedOf(viewOf("i.xml", folded, typedReadingOf(laws)), grammar);
              const rows = rowsOf(tree, { context: ownContext(idOf(0)), idOf });

              const expressions = [...rows.Expression.values()];
              assert.isNotEmpty(expressions, item);
              for (const expression of expressions) {
                const node = typed.rows.byId.get(expression.node);
                assert.isDefined(node, `${item}: no oracle node ${expression.node}`);
                if (node === undefined) {
                  return;
                }

                assert.deepStrictEqual(
                  { base: expression.baseType, cardinality: expression.cardinality },
                  typed.typeOf(node),
                  `${item}: ${expression.kind}`,
                );
              }

              const deleted = expressions.filter(({ kind }) => kind === "qti-delete");
              assert.deepStrictEqual(
                deleted.map(({ baseType, cardinality }) => ({ base: baseType, cardinality })),
                [deleteTypeOf(operands)],
                item,
              );
            }),
        ),
      ),
    searchTimeout,
  );
});
