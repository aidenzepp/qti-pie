/**
 * The MathML cn laws' free tests (spec reading 2, MathML 3 validity): the module's relations are
 * composed into `Qti` under their own names, a schema of `Node` and the module's statements builds
 * with each statement once, the check is named by its law of the law catalog
 * (`#pantry/vocab/laws.ts`), every other statement reads as "E1 derived", and the spellings
 * that tie a handle to its attribute's lexical form are the handles' own.
 *
 * The database tests judge the law through PostgreSQL once the builder writes the rows.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Formatter, Option } from "effect";
import { CnBase, CnForm, CnPart, CnParts, CnType } from "#pantry/grammar/install.ts";
import { lawNameOf, lawNames, lawOfCheck, statedLaws } from "#pantry/import/refusal.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import {
  baseSpellings,
  cnLaws,
  cnRelations,
  partFamily,
  slotFamily,
  typeSpellings,
} from "#pantry/qti/mathml-cn.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { identityOf } from "#pantry/test/key-copies.ts";
import { Qti, QtiBase } from "#pantry/qti/own.ts";

/**
 * How long building a schema over every relation of `Qti` may take: its statements are planned
 * whole, which takes some seconds beside the composed grammar.
 * Measured 2026-11-07: 0.04 s at a load average of 69 to 104, its slowest test.
 */
const buildTimeout = 60_000;

/**
 * The relations the module declares, by name.
 */
const declared = ["CnAttribute", "CnCount", "CnPartText", "CnSlot", "MathCn"] as const;

/**
 * The laws that are no check, among those the module's relations carry, as the census of the
 * refusal table reads them: those whose law names one of the relations. A function, since the
 * first read of `statedLaws` compiles Qti's law model.
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
      /"(?:CnAttribute|CnPartText|CnCount|CnSlot|MathCn)"/u.test(Formatter.format(law)),
  );

describe("qti/mathml-cn.ts, declared", { timeout: buildTimeout }, () => {
  it("declares the judged cn and its parts, composed into Qti under their own names", () => {
    assert.deepStrictEqual(Object.keys(cnRelations).toSorted(), [...declared]);
    for (const relation of Object.values(cnRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(Qti.relations, relation.name)?.value,
        relation,
      );
    }
  });

  it("builds a schema of Node and the module's statements, each statement once", () => {
    assert.isAbove(cnLaws.length, 0);
    assert.strictEqual(new Set(cnLaws).size, cnLaws.length);

    const built = schema("CnLayer", { ...QtiBase.relations }, [...nodeLaws, ...cnLaws]);

    assert.strictEqual(built.statements.length, nodeLaws.length + cnLaws.length);
    for (const statement of cnLaws) {
      assert.strictEqual(Qti.statements.filter((held) => held === statement).length, 1);
    }
  });

  it("counts a cn's parts with a family of its own, one count for one family, and every typed cn's slots with another", () => {
    assert.strictEqual(cnLaws.filter((statement) => statement === partFamily).length, 1);
    assert.strictEqual(partFamily.kind, "counted");
    assert.strictEqual(cnLaws.filter((statement) => statement === slotFamily).length, 1);
    assert.strictEqual(slotFamily.kind, "counted");
  });

  it("names the form check by its law of the refusal table, spaces written as underscores, so lawOfCheck maps it", () => {
    // Oracle: the refusal table's own law list (`#pantry/import/refusal.ts` lawNames), which
    // `refusal.test.ts` holds equal to the oracle's.
    const named = cnLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name] : [],
    );

    assert.deepStrictEqual(named.toSorted(), ["E1_derived", "E1_derived", "MathML_cn_form"]);
    assert.isTrue(
      Option.isSome(lawOfCheck("MathML_cn_form")),
      "MathML_cn_form is no law of the refusal table",
    );
    assert.isTrue(lawNames.some((known) => known === "MathML cn form"));
    assert.strictEqual(lawTable["MathML cn form"].rule, "attribute-lexical");
  });

  it("reads the count containments as 'MathML cn form' and every other containment and the family as 'E1 derived', the form check being named by its own name", () => {
    // Oracle: the statements are named by `lawNameOf`'s own table, as `refusal.test.ts` holds. A
    // part count and a part's place are judged by the oracle's cn form law, as an attribute's form.
    const own = ownLaws();
    assert.isAbove(own.length, 0);
    assert.deepStrictEqual([...new Set(own.map(([, name]) => name))].toSorted(), [
      "E1 derived",
      "MathML cn form",
    ]);
    assert.deepStrictEqual(
      own.filter(([, name]) => name === "MathML cn form").map(([law]) => identityOf(law)),
      [
        "contained MathCn(type, parts) in CnParts(type, parts)",
        "contained CnPartText(type, part, form) in CnForm(type, part, form)",
        "contained CnCount(type, parts) in CnParts(type, parts)",
        "contained CnSlot(type, part, form) in CnForm(type, part, form)",
      ],
    );
    assert.strictEqual(
      own.filter(([law]) => law.kind === "family" && law.order === "counted").length,
      2,
    );

    for (const [law, name] of own) {
      assert.deepStrictEqual(lawNameOf(law), Option.some(name));
    }
  });
});

describe("qti/mathml-cn.ts, spellings", () => {
  it("spells each type handle by its own name, in the roster's order", () => {
    assert.deepStrictEqual(
      typeSpellings.map(([type]) => type),
      [...CnType.handles],
    );
    for (const [type, spelling] of typeSpellings) {
      assert.strictEqual(spelling.source, `^[ \\t\\n\\r]*${type}[ \\t\\n\\r]*$`);
    }
  });

  it("spells each base handle by its numeral, leading zeros and XML whitespace allowed, in the roster's order", () => {
    assert.deepStrictEqual(
      baseSpellings.map(([base]) => base),
      [...CnBase.handles],
    );
    for (const [base, spelling] of baseSpellings) {
      assert.strictEqual(spelling.source, `^[ \\t\\n\\r]*0*${base}[ \\t\\n\\r]*$`);
    }

    const sixteen = baseSpellings.find(([base]) => base === "16");
    const pattern = new RegExp(sixteen?.[1].source ?? "(?!)", "u");

    assert.isTrue(pattern.test(" 016\n"));
    assert.isFalse(pattern.test("160"));
    assert.isFalse(pattern.test("+16"));
  });

  it("lists a form for every part of every type, as many as CnParts counts, so the rows of a cn are its type's slots", () => {
    // Oracle: the `cnForms` table the rosters and relations are generated from.
    assert.strictEqual(CnParts.rows.length, CnType.handles.length);
    for (const { parts, type } of CnParts.rows) {
      assert.strictEqual(CnForm.rows.filter((row) => row.type === type).length, Number(parts));
    }
  });

  it("names one place beyond the most parts any type holds, which no CnForm row lists", () => {
    // Oracle: the counts of `CnParts`, the most parts any type holds.
    const most = Math.max(...CnParts.rows.map((row) => Number(row.parts)));
    const beyond = CnPart.handles.at(-1);

    assert.strictEqual(CnPart.handles.length, most + 1);
    assert.deepStrictEqual(
      [...CnPart.handles],
      Array.from({ length: most + 1 }, (_, place) => String(place)),
    );
    assert.isFalse(CnForm.rows.some((row) => row.part === beyond));
  });
});
