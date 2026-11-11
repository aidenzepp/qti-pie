/**
 * The MathML share module's rank chain (spec reading 2, MathML 3 validity), read over the
 * descriptions of its statements' predicates: a chain ends at the document node, its own parent,
 * and the share cycle's check refuses a share whose rank is not above its target's. PostgreSQL
 * judges the law on every import, and on the free tier the law oracle raises it
 * (`#pantry/test/complete.oracle.test.ts`).
 */
import { assert, describe, it } from "@effect/vitest";
import { Option, Schema } from "effect";
import { shareLaws } from "#pantry/qti/mathml-share.ts";

/**
 * A row's fields, as a statement's predicate reads them.
 */
type Fields = Readonly<Record<string, string | number>>;

/**
 * One side of a compare in a statement's description: a field of the row, or a literal.
 */
const Operand = Schema.Union([
  Schema.Struct({ field: Schema.String, kind: Schema.Literal("field") }),
  Schema.Struct({ kind: Schema.Literal("literal"), value: Schema.String }),
]);

/**
 * A compare of two operands, in the description grizzle keeps of a predicate.
 */
const Compare = Schema.Struct({
  kind: Schema.Literal("compare"),
  left: Operand,
  op: Schema.Literals(["eq", "ne", "lt", "gt"]),
  right: Operand,
});

/**
 * A predicate of the law module: a compare, or an `and` or `or` of compares.
 */
const Predicate = Schema.Union([
  Compare,
  Schema.Struct({ args: Schema.Array(Compare), kind: Schema.Literals(["and", "or"]) }),
]);

/**
 * The description of a check, or of a selection a containment reads.
 */
const Described = Schema.Struct({ predicate: Predicate });

/**
 * The operator of each compare, over the two operands' values.
 */
const compares = {
  eq: (a: string | number, b: string | number) => a === b,
  gt: (a: string | number, b: string | number) => a > b,
  lt: (a: string | number, b: string | number) => a < b,
  ne: (a: string | number, b: string | number) => a !== b,
} satisfies Record<typeof Compare.Type.op, (a: string | number, b: string | number) => boolean>;

/**
 * Read an operand's value over a row.
 *
 * @param operand - A field or a literal.
 * @param row - The row's fields.
 * @returns The value.
 */
const valueOf = (operand: typeof Operand.Type, row: Fields): string | number =>
  operand.kind === "literal" ? operand.value : (row[operand.field] ?? assert.fail(operand.field));

/**
 * Evaluate a predicate over one row.
 *
 * @param predicate - The predicate's parsed description.
 * @param row - The row's fields.
 * @returns Whether the row satisfies it.
 */
const holdsOver = (predicate: typeof Predicate.Type, row: Fields): boolean => {
  if (predicate.kind === "compare") {
    return compares[predicate.op](valueOf(predicate.left, row), valueOf(predicate.right, row));
  }

  const holds = (compare: typeof Compare.Type) => holdsOver(compare, row);

  return predicate.kind === "and" ? predicate.args.every(holds) : predicate.args.some(holds);
};

/**
 * A check as grizzle holds it, with the description of its predicate.
 */
const CheckValue = Schema.Struct({
  desc: Described,
  kind: Schema.Literal("check"),
  name: Schema.String,
});

/**
 * A containment whose source is a selection, with the description of that selection's predicate.
 */
const SelectedValue = Schema.Struct({
  kind: Schema.Literal("contained"),
  left: Schema.Struct({ source: Schema.Struct({ desc: Described }) }),
});

/**
 * Find a check's predicate by the check's name.
 *
 * @param name - The check's name.
 * @returns Its predicate.
 */
const checkOf = (name: string): typeof Predicate.Type => {
  const found = shareLaws
    .flatMap((statement) => Option.toArray(Schema.decodeUnknownOption(CheckValue)(statement)))
    .find((read) => read.name === name);

  return (found ?? assert.fail(name)).desc.predicate;
};

/**
 * Whether a {@link MathRank} row falls under the containment of `(parent, parentRank)` into its
 * parent's `(node, rank)`: the one containment whose source is a selection.
 *
 * @param row - The row.
 * @returns Whether its parent's row must carry its `parentRank`.
 */
const tiedToParent = (row: Fields): boolean => {
  const [tie] = shareLaws.flatMap((statement) =>
    Option.toArray(Schema.decodeUnknownOption(SelectedValue)(statement)),
  );

  return holdsOver((tie ?? assert.fail("no selected containment")).left.source.desc.predicate, row);
};

/**
 * Write a {@link MathRank} row's fields.
 *
 * @param node - Its node.
 * @param kind - Its kind.
 * @param parent - Its parent's node.
 * @param own - Its rank.
 * @param above - Its parent's rank, as it copies it.
 * @returns The row's fields.
 */
const rankOf = (node: string, kind: string, parent: string, own: number, above: number) => ({
  kind,
  node,
  parent,
  parentRank: above,
  rank: own,
});

/**
 * Whether a check of the module holds over a row.
 *
 * @param name - The check's name.
 * @param row - The row's fields.
 * @returns Whether it holds.
 */
const holds = (name: string, row: Fields): boolean => holdsOver(checkOf(name), row);

describe("qti/mathml-share.ts, the rank chain's top", () => {
  it("lets the chain of a target outside every m:math end at the document node, which is its own parent", () => {
    // An HTML div under the item body, the builder's rows: the div below the item, the item below
    // the document node, whose parent is itself and whose copy of its parent's rank is its own.
    const chain = [
      rankOf("div", "div", "item", 0, 1),
      rankOf("item", "qti-assessment-item", "document", 1, 2),
      rankOf("document", "document", "document", 2, 2),
    ];

    for (const row of chain) {
      assert.isTrue(holds("E1_derived", row), row.node);
    }

    assert.deepStrictEqual(
      chain.map(tiedToParent),
      [true, true, false],
      "the document node's row is tied to no parent's row",
    );
  });

  it("still holds an m:math's rank free, and any other row below its parent's", () => {
    assert.isTrue(holds("E1_derived", rankOf("math", "m:math", "item", 3, 3)));
    assert.isFalse(tiedToParent(rankOf("math", "m:math", "item", 3, 3)));
    assert.isTrue(holds("E1_derived", rankOf("ci", "m:ci", "apply", 0, 1)));
    assert.isTrue(tiedToParent(rankOf("ci", "m:ci", "apply", 0, 1)));
  });

  it("still refuses a row not below its parent's, when it is not its own parent", () => {
    // A cycle through child edges: some row's rank reaches its parent's, whatever its kind.
    assert.isFalse(holds("E1_derived", rankOf("apply", "m:apply", "other", 1, 1)));
    assert.isFalse(holds("E1_derived", rankOf("div", "div", "item", 2, 1)));
    assert.isFalse(holds("E1_derived", rankOf("item", "qti-assessment-item", "document", 2, 2)));
  });

  it("still refuses a share whose rank is not above its target's", () => {
    // Left unchanged: a share that dominates itself through a share edge breaks this check.
    assert.isFalse(holds("MathML_share_cycle", { shareRank: 1, targetRank: 1 }));
    assert.isFalse(holds("MathML_share_cycle", { shareRank: 0, targetRank: 1 }));
    assert.isTrue(holds("MathML_share_cycle", { shareRank: 2, targetRank: 1 }));
  });
});
