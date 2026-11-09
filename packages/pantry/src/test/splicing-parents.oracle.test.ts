/**
 * The two statements of which include parents splice their fragment in place (spec reading 117):
 * the schema's (`#pantry/qti/tests.ts` `splicingParents`), which the import's heads and the
 * schema's read, and the law oracle's own (`#pantry/test/oracle.ts` `splicingParentsOf`), from the
 * grammar's include parents (reading 114) less a section's, whose includes follow reading 86. They
 * must be one set, so a bug in either is named here, not shared by both sides.
 */
import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { splicingParentsOf } from "#pantry/test/oracle.ts";
import { splicingParents } from "#pantry/vocab/terms/tests.ts";

/**
 * The composed grammar the oracle reads its include parents from.
 */
const grammar = Result.getOrThrow(composed());

describe("the splicing parents, stated twice", () => {
  it("are one set in the schema and in the law oracle, every parent one side splices and the other does not named", () => {
    // Oracle: two implementations side by side, the schema's list and the oracle's own, from the
    // grammar. Bound: every include parent the composed grammar declares.
    const schema: ReadonlySet<string> = new Set(splicingParents);
    const oracle = splicingParentsOf(grammar);

    assert.deepStrictEqual(
      {
        oracleOnly: [...oracle].filter((parent) => !schema.has(parent)).toSorted(),
        schemaOnly: [...schema].filter((parent) => !oracle.has(parent)).toSorted(),
      },
      { oracleOnly: [], schemaOnly: [] },
      "an include parent one statement splices and the other does not",
    );
    assert.isFalse(oracle.has("qti-assessment-section"), "a section's include splices nothing");
    assert.isAbove(oracle.size, 0, "no include parent splices");
  });
});
