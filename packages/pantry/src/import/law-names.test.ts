/**
 * The laws each module names where it states them (`namedLaws` of `#pantry/import/refusal.ts`),
 * held to the law table: every group's name is a law of the table, a check sits in its own law's
 * group, and every other law a group states is named by the group, so the law table reads each name
 * from the statement's site and restates none.
 */
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import {
  checkNameOf,
  lawIdentity,
  lawNameOf,
  lawNames,
  lawsOfStatement,
  namedLaws,
} from "#pantry/import/refusal.ts";

describe("the laws each module names where it states them", () => {
  it("names each group by a law of the table, holds each check in its own law's group, and names each other law by its group", () => {
    // Oracle: the law table's own names, and grizzle's statement values as an outcome reads them.
    const known: ReadonlySet<string> = new Set(lawNames);
    for (const byName of namedLaws) {
      for (const name of Object.keys(byName)) {
        assert.isTrue(known.has(name), `${name}: no law of the table`);
      }

      for (const name of lawNames) {
        for (const statement of byName[name] ?? []) {
          if (statement.kind === "check") {
            assert.strictEqual(statement.name, checkNameOf(name), `${name}: its check`);
          }

          for (const law of lawsOfStatement(statement)) {
            assert.deepStrictEqual(lawNameOf(law), Option.some(name), lawIdentity(law));
          }
        }
      }
    }
  });
});
