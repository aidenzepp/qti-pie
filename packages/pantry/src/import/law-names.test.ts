/**
 * The laws each module names where it states them (`namedLaws` of `#pantry/import/refusal.ts`),
 * held to the law table and to the schema: every group's name is a law of the table, a check sits
 * in its own law's group, every statement of `Qti` sits in exactly one group, and every law grizzle
 * names for a statement is named by its group, so the law table reads each name from the
 * statement's site and restates none.
 */
import { lawsOf } from "@bjornpagen/grizzle";
import type { Statement } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Formatter, Option } from "effect";
import { checkNameOf, lawNameOf, lawNames, namedLaws } from "#pantry/import/refusal.ts";
import type { LawName } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/schema.ts";

describe("the laws each module names where it states them", () => {
  it("names each group by a law of the table, holds each check in its own law's group, groups every statement of Qti once, and names each law by its statement's group", () => {
    // Oracle: the law table's own names, Qti's statements, and grizzle's laws of each statement
    // as an `invariant-rejected` outcome names them (`lawsOf`). Bound: every statement of Qti.
    const known: ReadonlySet<string> = new Set(lawNames);
    const groups = new Map<Statement, readonly LawName[]>();
    for (const byName of namedLaws) {
      for (const name of Object.keys(byName)) {
        assert.isTrue(known.has(name), `${name}: no law of the table`);
      }

      for (const name of lawNames) {
        for (const statement of byName[name] ?? []) {
          if (statement.kind === "check") {
            assert.strictEqual(statement.name, checkNameOf(name), `${name}: its check`);
          }

          groups.set(statement, [...(groups.get(statement) ?? []), name]);
        }
      }
    }

    const statements = lawsOf(Qti);
    assert.strictEqual(groups.size, statements.length, "a group holds a statement Qti does not");
    for (const { laws, statement } of statements) {
      const names = groups.get(statement) ?? [];

      assert.lengthOf(names, 1, `the statement of ${Formatter.format(laws)}: its groups`);
      for (const law of laws) {
        assert.deepStrictEqual(
          lawNameOf(law),
          Option.fromUndefinedOr(names[0]),
          Formatter.format(law),
        );
      }
    }
  }, 300_000);
});
