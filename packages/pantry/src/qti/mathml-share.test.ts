/**
 * The MathML share law's free tests (spec reading 2, MathML 3 validity): the module's relations are
 * composed into `Qti` under their own names, a schema of `Node` and the module's statements builds
 * with each statement once, the check is named by its law of the law catalog
 * (`#pantry/vocab/laws.ts`), and every other statement reads as "E1 derived".
 *
 * The database tests judge the law through PostgreSQL once the builder writes the rows.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Formatter, Option, Schema } from "effect";
import { lawNameOf, lawNames, lawOfCheck, statedLaws } from "#pantry/import/refusal.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import { shareLaws, shareRelations } from "#pantry/qti/mathml-share.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { QtiBase } from "#pantry/qti/base.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * How long building a schema over every relation of `Qti` may take: its statements are planned
 * whole, which takes some seconds beside the composed grammar.
 * Measured 2026-11-07: 0.04 s at a load average of 69 to 103, its slowest test.
 */
const buildTimeout = 60_000;

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

/**
 * The laws that are no check, among those the module's relations carry, as the census of the
 * refusal table reads them: those whose law names one of the module's stored relations. A function,
 * since the first read of `statedLaws` compiles Qti's law model.
 *
 * Each stored text field's own pattern law, which grizzle states per field and refusal.ts names by
 * the field's type, is no statement of the module and is left out.
 *
 * @returns The laws, with their names.
 */
const ownLaws = () =>
  statedLaws().filter(
    ([law]) =>
      law.kind !== "pattern" &&
      /"(?:MathRank|PlacedMathRank|PlacedShareTarget|ShareTarget)"/u.test(Formatter.format(law)),
  );

describe("qti/mathml-share.ts, declared", { timeout: buildTimeout }, () => {
  it("declares the rank and the share target, composed into Qti under their own names", () => {
    assert.deepStrictEqual(Object.keys(shareRelations).toSorted(), [
      "MathRank",
      "PlacedMathRank",
      "PlacedShareTarget",
      "ShareTarget",
    ]);
    for (const relation of Object.values(shareRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(Qti.relations, relation.name)?.value,
        relation,
      );
    }
  });

  it("keys each relation by its node, a placed one by its instance and node, fields in key order", () => {
    assert.deepStrictEqual(shareRelations.MathRank.primaryKey, ["node"]);
    assert.deepStrictEqual(shareRelations.ShareTarget.primaryKey, ["node"]);
    assert.deepStrictEqual(shareRelations.PlacedMathRank.primaryKey, ["instance", "node"]);
    assert.deepStrictEqual(shareRelations.PlacedShareTarget.primaryKey, ["instance", "node"]);
    for (const relation of Object.values(shareRelations)) {
      const fields = Object.keys(relation.fields);

      assert.deepStrictEqual(fields, fields.toSorted(), relation.name);
    }
  });

  it("builds a schema of Node and the module's statements, each statement once", () => {
    assert.isAbove(shareLaws.length, 0);
    assert.strictEqual(new Set(shareLaws).size, shareLaws.length);

    const built = schema("ShareLayer", { ...QtiBase.relations }, [...nodeLaws, ...shareLaws]);

    assert.strictEqual(built.statements.length, nodeLaws.length + shareLaws.length);
    for (const statement of shareLaws) {
      assert.strictEqual(Qti.statements.filter((held) => held === statement).length, 1);
    }
  });

  it("names its checks by their laws of the refusal table, spaces written as underscores, so lawOfCheck maps them", () => {
    // Oracle: the refusal table's own law list (`#pantry/import/refusal.ts` lawNames), which
    // `refusal.test.ts` holds equal to the oracle's.
    const named = shareLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name] : [],
    );

    assert.deepStrictEqual(named.toSorted(), [
      "E1_derived",
      "E1_derived",
      "E1_derived",
      "MathML_share_cycle",
      "MathML_share_cycle",
    ]);
    assert.isTrue(Option.isSome(lawOfCheck("MathML_share_cycle")));
    assert.isTrue(lawNames.some((known) => known === "MathML share cycle"));
    assert.strictEqual(lawTable["MathML share cycle"].rule, "document-key");
    assert.strictEqual(
      shareLaws.filter(
        (statement) => statement.kind === "check" && statement.name === "MathML_share_cycle",
      ).length,
      2,
      "one over ShareTarget, one over PlacedShareTarget",
    );
  });

  it("reads every containment and key of the module as 'E1 derived', but the share's resolution as 'Idref target'", () => {
    // Oracle: the statements are named by `lawNameOf`'s own table, as `refusal.test.ts` holds; a
    // share whose id names nothing breaks its resolution beside "Idref target"'s own statement,
    // so the resolution is stated under that law and the share is refused by it alone.
    const own = ownLaws();
    assert.isAbove(own.length, 0);
    assert.deepStrictEqual([...new Set(own.map(([, name]) => name))].toSorted(), [
      "E1 derived",
      "Idref target",
    ]);

    const resolutions = own.filter(([, name]) => name === "Idref target");
    assert.lengthOf(resolutions, 1);
    for (const [law] of resolutions) {
      assert.match(Formatter.format(law), /"relation":"ShareFragment".*"relation":"ShareTarget"/su);
    }

    for (const [law, name] of own) {
      assert.deepStrictEqual(lawNameOf(law), Option.some(name));
    }
  });
});

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
