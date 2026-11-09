/**
 * The MathML align laws' free tests (spec reading 2, MathML 3 validity): the module's relations and
 * rosters are composed into `Qti` under their own names, a schema of `Node` and the module's
 * statements builds with each statement once, each check is named by its law of the law catalog
 * (`#pantry/vocab/laws.ts`), every other statement reads as "E1 derived", and the spellings
 * that tie a direction handle to its attribute's lexical form are the handles' own.
 *
 * The database tests judge the laws through PostgreSQL once the builder writes the rows.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Formatter, Option } from "effect";
import { lawNameOf, lawNames, lawOfCheck, statedLaws } from "#pantry/import/refusal.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import {
  alignLaws,
  alignRelations,
  directionSpellings,
  groupFamily,
  leafFamily,
  leafStartFold,
} from "#pantry/qti/mathml-align.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { Qti, QtiBase } from "#pantry/qti/own.ts";

/**
 * How long building a schema over every relation of `Qti` may take: its statements are planned
 * whole, which takes some seconds beside the composed grammar.
 * Measured 2026-11-07: 0.05 s at a load average of 69 to 104, its slowest test.
 */
const buildTimeout = 60_000;

/**
 * The relations and rosters the module declares, by name.
 */
const declared = [
  "AlignDirection",
  "AlignState",
  "CellLeaf",
  "MathAction",
  "MathAlignGroup",
  "MathAlignScope",
  "MathCell",
  "MathDir",
] as const;

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
      /"(?:CellLeaf|MathAction|MathAlignGroup|MathAlignScope|MathCell|MathDir)"/u.test(
        Formatter.format(law),
      ),
  );

describe("qti/mathml-align.ts, declared", { timeout: buildTimeout }, () => {
  it("declares the action, the alignment scope, the group, the cell and its leaves, composed into Qti under their own names", () => {
    assert.deepStrictEqual(Object.keys(alignRelations).toSorted(), [...declared]);
    for (const relation of Object.values(alignRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(Qti.relations, relation.name)?.value,
        relation,
      );
    }
  });

  it("builds a schema of Node and the module's statements, each statement once", () => {
    assert.isAbove(alignLaws.length, 0);
    assert.strictEqual(new Set(alignLaws).size, alignLaws.length);

    const built = schema("AlignLayer", { ...QtiBase.relations }, [...nodeLaws, ...alignLaws]);

    assert.strictEqual(built.statements.length, nodeLaws.length + alignLaws.length);
    for (const statement of alignLaws) {
      assert.strictEqual(Qti.statements.filter((held) => held === statement).length, 1);
    }
  });

  it("counts a cell's leaves in an ordered family and its open groups in a counted one, each family once, and folds the leaves' starts so document order is proved", () => {
    assert.strictEqual(leafFamily.kind, "ordered");
    assert.strictEqual(groupFamily.kind, "counted");
    for (const statement of [leafFamily, groupFamily, leafStartFold]) {
      assert.strictEqual(alignLaws.filter((held) => held === statement).length, 1);
    }
    assert.strictEqual(leafStartFold.kind, "fold");
  });

  it("names the three checks by their laws of the refusal table, spaces written as underscores, so lawOfCheck maps each", () => {
    // Oracle: the refusal table's own law list (`#pantry/import/refusal.ts` lawNames), which
    // `refusal.test.ts` holds equal to the oracle's.
    const named = alignLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name] : [],
    );

    assert.deepStrictEqual(
      [...new Set(named)].toSorted(),
      [
        "E1_derived",
        "MathML_align_first",
        "MathML_align_placement",
        "MathML_maction_selection",
      ].toSorted(),
    );
    for (const law of [
      "MathML_align_first",
      "MathML_align_placement",
      "MathML_maction_selection",
    ]) {
      assert.isTrue(Option.isSome(lawOfCheck(law)), `${law} is no law of the refusal table`);
    }
    for (const law of [
      "MathML align first",
      "MathML align placement",
      "MathML maction selection",
    ]) {
      assert.isTrue(lawNames.some((known) => known === law));
    }
    assert.strictEqual(lawTable["MathML maction selection"].rule, "union-count");
    assert.strictEqual(lawTable["MathML align placement"].rule, "admission");
    assert.strictEqual(lawTable["MathML align first"].rule, "ordering");
  });

  it("states each of the three laws once", () => {
    for (const law of [
      "MathML_align_first",
      "MathML_align_placement",
      "MathML_maction_selection",
    ]) {
      assert.strictEqual(
        alignLaws.filter((statement) => statement.kind === "check" && statement.name === law)
          .length,
        1,
        law,
      );
    }
  });

  it("reads every containment, key and family of the module as 'E1 derived'", () => {
    // Oracle: the statements are named by `lawNameOf`'s own table, as `refusal.test.ts` holds.
    const own = ownLaws();
    assert.isAbove(own.length, 0);
    assert.deepStrictEqual([...new Set(own.map(([, name]) => name))], ["E1 derived"]);
    assert.isTrue(own.some(([law]) => law.kind === "family" && law.order === "ordered"));
    assert.isTrue(own.some(([law]) => law.kind === "family" && law.order === "counted"));

    for (const [law, name] of own) {
      assert.deepStrictEqual(lawNameOf(law), Option.some(name));
    }
  });
});

describe("qti/mathml-align.ts, spellings", () => {
  it("spells each direction handle by its own name, in XML whitespace", () => {
    assert.deepStrictEqual(
      directionSpellings.map(([direction]) => direction),
      ["ltr", "rtl"],
    );
    for (const [direction, spelling] of directionSpellings) {
      assert.strictEqual(spelling.source, `^[ \\t\\n\\r]*${direction}[ \\t\\n\\r]*$`);
    }

    const pattern = new RegExp(directionSpellings[0][1].source, "u");

    assert.isTrue(pattern.test(" ltr\n"));
    assert.isFalse(pattern.test("ltrx"));
    assert.isFalse(pattern.test("rtl"));
  });
});
