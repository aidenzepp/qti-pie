/**
 * The MathML align module's direction spellings (spec reading 2, MathML 3 validity): each
 * direction handle is spelled by its own name in XML whitespace, the lexical form its attribute
 * takes. The database tests (`mathml-align.oracle.db.test.ts`) judge the laws through PostgreSQL.
 */
import { assert, describe, it } from "@effect/vitest";
import { directionSpellings } from "#pantry/qti/mathml-align.ts";

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
