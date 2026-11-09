/**
 * The MathML apply laws' free tests (spec reading 2, MathML 3 validity): the module's relations are
 * composed into `Qti` under their own names, a schema of `Node` and the module's statements builds
 * with each statement once, each check is named by a law of the law catalog
 * (`#pantry/vocab/laws.ts`), and the one containment that reads as "MathML head qualifier" is
 * the only statement the module names otherwise than "E1 derived".
 *
 * The database tests judge the laws through PostgreSQL once the builder writes the rows.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Formatter, Option } from "effect";
import { lawNameOf, lawNames, lawOfCheck } from "#pantry/import/refusal.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import { applyLaws, applyRelations } from "#pantry/qti/mathml-apply.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { Qti, QtiBase } from "#pantry/qti/own.ts";
import { identityOf } from "#pantry/test/key-copies.ts";
import { statedLaws } from "#pantry/test/law-namer.ts";

/**
 * How long building a schema over every relation of `Qti` may take: its statements are planned
 * whole, which takes some seconds beside the composed grammar.
 * Measured 2026-11-07: 0.03 s at a load average of 69 to 104, its slowest test.
 */
const buildTimeout = 60_000;

/**
 * The relations the module declares, by name.
 */
const declared = ["MathApply", "MathArgument", "MathQualifier"] as const;

describe("qti/mathml-apply.ts, declared", { timeout: buildTimeout }, () => {
  it("declares the apply, its argument rows and its head qualifiers, composed into Qti under their own names", () => {
    assert.deepStrictEqual(Object.keys(applyRelations).toSorted(), [...declared]);
    for (const relation of Object.values(applyRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(Qti.relations, relation.name)?.value,
        relation,
      );
    }
  });

  it("builds a schema of Node and the module's statements, each statement once", () => {
    assert.isAbove(applyLaws.length, 0);
    assert.strictEqual(new Set(applyLaws).size, applyLaws.length);

    const built = schema("ApplyLayer", { ...QtiBase.relations }, [...nodeLaws, ...applyLaws]);

    assert.strictEqual(built.statements.length, nodeLaws.length + applyLaws.length);
    for (const statement of applyLaws) {
      assert.strictEqual(Qti.statements.filter((held) => held === statement).length, 1);
    }
  });

  it("names each check by a law of the refusal table, spaces written as underscores, so lawOfCheck maps it", () => {
    // Oracle: the refusal table's own law list (`#pantry/import/refusal.ts` lawNames), which
    // `refusal.test.ts` holds equal to the oracle's.
    const named = applyLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name] : [],
    );

    assert.deepStrictEqual(named, ["MathML_arity"]);
    for (const name of named) {
      const law = lawOfCheck(name);

      assert.isTrue(Option.isSome(law), `${name} is no law of the refusal table`);
      assert.isTrue(
        lawNames.some((known) => known === name.replaceAll("_", " ")),
        name,
      );
    }

    assert.strictEqual(lawTable["MathML arity"].rule, "math-arity");
    assert.strictEqual(lawTable["MathML head qualifier"].rule, "admission");
  });

  it("names the qualifier's containment into HeadQualifier 'MathML head qualifier' and every other statement 'E1 derived'", () => {
    const own = statedLaws().filter(([law]) =>
      /"(?:MathApply|MathArgument|MathQualifier)"/u.test(Formatter.format(law)),
    );
    const qualifier = own.filter(([, name]) => name === "MathML head qualifier");

    assert.deepStrictEqual([...new Set(own.map(([, name]) => name))].toSorted(), [
      "E1 derived",
      "MathML head qualifier",
    ]);
    assert.lengthOf(qualifier, 1);
    for (const [law] of qualifier) {
      assert.strictEqual(
        identityOf(law),
        "contained MathQualifier(head, kind) in HeadQualifier(head, qualifier)",
      );
    }

    for (const [law, name] of own) {
      assert.deepStrictEqual(lawNameOf(law), Option.some(name));
    }
  });
});
