/**
 * The types the import writes for the expressions typed by their operands' one type, beside the law
 * oracle's: a Delete by its later operands', an Index and a Random by all of theirs, each one rule
 * on the import, in the schema and in the oracle.
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
 * An Index and a Random are typed by their one operand ("The result has the same base-type as the
 * sub-expression but single cardinality", information model, Tables 6.9.22 and 6.9.16), and by all
 * of them alike where they write more or none, which `Arity` refuses: the operands' one base type,
 * NULL's `any` set aside, `any` for none and `unknown` for several, as a container is typed (the
 * schema's `baseOfOperands`, the oracle's `oneBaseTyped`). The import read the first operand
 * alone, so a NULL before an integer container typed it `any` where the oracle reads `integer`.
 *
 * The genetic differential's judge (`judgeOne`) cannot see this: its host leaves every check that
 * reads a fold's end unknown, since the database draws the folds, and `E1_derived` reads
 * `tailBaseTypes`. So the import's `Expression` rows are held to the law oracle's typing itself.
 *
 * Oracle: a second implementation, the law oracle's typing (`typedOf` of
 * `#pantry/test/oracle-laws/expressions.ts`) over the document as the oracle folds it, against the
 * `Expression` rows the import's overlay writes (`rowsOf`) over the same tree: each expression's
 * base type and cardinality agree; and the rules stated above for the Delete, the Index and the
 * Random themselves.
 *
 * Bound: an expression in a response condition, under `qti-is-null`, which takes any type, so no
 * other rule reads it: a Delete with one operand (a single base value of each of QTI's eleven base
 * types, a multiple of each, or a NULL) or two (a single of each base type with a multiple of it,
 * an ordered of it, or a NULL, and a NULL with a multiple) or three (an integer single with a NULL
 * and an integer multiple, two integer multiples, an integer multiple and ordered, an integer and a
 * string multiple, or two NULLs); and an Index and a Random each with none, an integer container, a
 * NULL, a NULL then an integer container, two integer containers, or an integer and a string
 * container: 74 documents, exhausted.
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
 * The kinds the box types: Delete, and Index and Random.
 */
type Kind = "qti-delete" | "qti-index" | "qti-random";

/**
 * One case: an expression's kind and its operands.
 */
interface Case {
  readonly kind: Kind;
  readonly operands: readonly Operand[];
}

/**
 * A Delete's operands: one, two or three.
 */
const deleteOperands: readonly (readonly Operand[])[] = [
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
 * An Index's or a Random's operands: none, its one container, a NULL, or two.
 */
const firstOperands: readonly (readonly Operand[])[] = [
  [],
  [containerOf("integer", "ordered")],
  [nullOperand],
  [nullOperand, containerOf("integer", "ordered")],
  [containerOf("integer", "ordered"), containerOf("integer", "multiple")],
  [containerOf("integer", "ordered"), containerOf("string", "ordered")],
];

/**
 * Every case of the box.
 */
const cases: readonly Case[] = [
  ...deleteOperands.map((operands): Case => ({ kind: "qti-delete", operands })),
  ...(["qti-index", "qti-random"] as const).flatMap((kind) =>
    firstOperands.map((operands): Case => ({ kind, operands })),
  ),
];

/**
 * The note of a case by its operand count, none to three.
 */
const countNotes = ["no operand", "one operand", "two operands", "three operands"] as const;

/**
 * The start tag each kind is written with: an Index's `n`, which it requires, a literal.
 */
const startTags: Readonly<Record<Kind, string>> = {
  "qti-delete": "<qti-delete>",
  "qti-index": '<qti-index n="1">',
  "qti-random": "<qti-random>",
};

/**
 * Write a case's item: its expression under `qti-is-null` in a response condition.
 *
 * @param of - The case.
 * @returns The item's text.
 */
const itemOf = (of: Case): string =>
  `<qti-assessment-item xmlns="${asiNamespace}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/><qti-item-body><p>x</p></qti-item-body><qti-response-processing><qti-response-condition><qti-response-if><qti-is-null>${startTags[of.kind]}${of.operands.map(({ xml }) => xml).join("")}</${of.kind}></qti-is-null></qti-response-if></qti-response-condition></qti-response-processing></qti-assessment-item>`;

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

/**
 * The type an Index or a Random takes from its operands: its one operand's base type, as Tables
 * 6.9.22 and 6.9.16 type it, their one base type where it writes more, NULL's `any` for none, and
 * a single cardinality.
 *
 * @param operands - Its operands.
 * @returns The type.
 */
const firstTypeOf = (operands: readonly Operand[]): Type => ({
  base: oneValueOf(
    operands.map(({ type }) => type.base),
    nullType.base,
  ),
  cardinality: "single",
});

/**
 * The type a case's expression takes, by its kind's rule.
 *
 * @param of - The case.
 * @returns The type.
 */
const expectedTypeOf = (of: Case): Type =>
  of.kind === "qti-delete" ? deleteTypeOf(of.operands) : firstTypeOf(of.operands);

describe("import/overlays/expressions.ts, the types a Delete, an Index and a Random take from their operands", () => {
  it.effect(
    "types a Delete by its later operands' one type and an Index or a Random by all of its operands', NULL's for none, as the law oracle does",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "a Delete of one operand of each base type, a container of it or a NULL, of two, a single of each base type with a container of it or a NULL, or of three over integer and string containers and NULLs; an Index and a Random of none, one or two operands over integer and string containers and NULLs",
            caseHang,
            coverage: requiredInSpace<(typeof countNotes)[number]>(countNotes),
            generator: int(0, cases.length - 1),
            limit: cases.length,
            literal: (at) => itemOf(Arr.getUnsafe(cases, at)),
            oracle: {
              kind: "second-implementation",
              name: "the law oracle's typing and Tables 6.9.20, 6.9.22 and 6.9.16, against the import's Expression rows",
            },
            suite: "import/overlays/expressions/operand-typing",
          },
          (at, c) =>
            Effect.gen(function* operandTypingCase() {
              const of = Arr.getUnsafe(cases, at);
              c.note(Arr.getUnsafe(countNotes, of.operands.length));
              assert.strictEqual(cases.length, 74);

              const item = itemOf(of);
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

              assert.deepStrictEqual(
                expressions
                  .filter(({ kind }) => kind === of.kind)
                  .map(({ baseType, cardinality }) => ({ base: baseType, cardinality })),
                [expectedTypeOf(of)],
                item,
              );
            }),
        ),
      ),
    searchTimeout,
  );
});
