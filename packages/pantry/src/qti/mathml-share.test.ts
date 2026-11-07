/**
 * The MathML share law's free tests (spec reading 2, MathML 3 validity): the module's relations are
 * composed into `Qti` under their own names, a schema of `Node` and the module's statements builds
 * with each statement once, the check is named by its law of the refusal table
 * (`#pantry/import/refusal.ts`), and every other statement reads as "E1 derived".
 *
 * The database tests judge the law through PostgreSQL once the builder writes the rows.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { lawNameOf, lawNames, lawOfCheck, lawTable, statedLaws } from "#pantry/import/refusal.ts";
import { shareLaws, shareRelations } from "#pantry/qti/mathml-share.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * How long building a schema over every relation of `Qti` may take: its statements are planned
 * whole, which takes some seconds beside the composed grammar.
 */
const buildTimeout = 60_000;

/**
 * The laws that are no check, among those the module's relations carry, as the census of the
 * refusal table reads them: those whose law names one of the module's stored relations.
 */
const ownLaws = statedLaws.filter(([law]) =>
  /"(?:MathRank|ShareTarget)"/u.test(JSON.stringify(law)),
);

describe("qti/mathml-share.ts, declared", { timeout: buildTimeout }, () => {
  it("declares the rank and the share target, composed into Qti under their own names", () => {
    assert.deepStrictEqual(Object.keys(shareRelations).toSorted(), ["MathRank", "ShareTarget"]);
    for (const relation of Object.values(shareRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(Qti.relations, relation.name)?.value,
        relation,
      );
    }
  });

  it("keys each relation by its node, the rank's fields in key order", () => {
    assert.deepStrictEqual(shareRelations.MathRank.primaryKey, ["node"]);
    assert.deepStrictEqual(shareRelations.ShareTarget.primaryKey, ["node"]);
    for (const relation of Object.values(shareRelations)) {
      const fields = Object.keys(relation.fields);

      assert.deepStrictEqual(fields, fields.toSorted(), relation.name);
    }
  });

  it("builds a schema of Node and the module's statements, each statement once", () => {
    assert.isAbove(shareLaws.length, 0);
    assert.strictEqual(new Set(shareLaws).size, shareLaws.length);

    const built = schema("ShareLayer", { ...Qti.relations }, [...nodeLaws, ...shareLaws]);

    assert.strictEqual(built.statements.length, nodeLaws.length + shareLaws.length);
    for (const statement of shareLaws) {
      assert.strictEqual(Qti.statements.filter((held) => held === statement).length, 1);
    }
  });

  it("names its one check by its law of the refusal table, spaces written as underscores, so lawOfCheck maps it", () => {
    // Oracle: the refusal table's own law list (`#pantry/import/refusal.ts` lawNames), which
    // `refusal.test.ts` holds equal to the oracle's.
    const named = shareLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name] : [],
    );

    assert.deepStrictEqual(named.toSorted(), ["E1_derived", "MathML_share_cycle"]);
    assert.isTrue(Option.isSome(lawOfCheck("MathML_share_cycle")));
    assert.isTrue(lawNames.some((known) => known === "MathML share cycle"));
    assert.strictEqual(lawTable["MathML share cycle"].rule, "document-key");
    assert.strictEqual(
      shareLaws.filter(
        (statement) => statement.kind === "check" && statement.name === "MathML_share_cycle",
      ).length,
      1,
    );
  });

  it("reads every containment and key of the module as 'E1 derived'", () => {
    // Oracle: the statements are named by `lawNameOf`'s own table, as `refusal.test.ts` holds.
    assert.isAbove(ownLaws.length, 0);
    assert.deepStrictEqual([...new Set(ownLaws.map(([, name]) => name))], ["E1 derived"]);

    for (const [law, name] of ownLaws) {
      assert.deepStrictEqual(lawNameOf(law), Option.some(name));
    }
  });
});
