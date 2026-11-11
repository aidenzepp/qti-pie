/**
 * The MathML cn module's spellings and forms (spec reading 2, MathML 3 validity): each type and
 * base handle is spelled as its attribute's lexical form, and every part of every type has its
 * form. PostgreSQL judges the module's law on every import, and on the free tier the law oracle
 * raises it (`#pantry/test/complete.oracle.test.ts`).
 */
import { assert, describe, it } from "@effect/vitest";
import { CnBase, CnForm, CnPart, CnParts, CnType } from "#pantry/grammar/install.ts";
import { baseSpellings, typeSpellings } from "#pantry/qti/mathml-cn.ts";

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
