/**
 * The census of the committed migration (plan-qti-pie Q6.02): the one `_init` folder the Qti
 * schema's migrations hold, taken by `#pantry/test/census.ts`, meets fin.md §13's zero targets and
 * holds the measured counts. It lands with the migration it reads, so it is a file of its own: the
 * census's parser and its targets are `census.test.ts`'s, which need no migration.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { Qti } from "#pantry/qti/schema.ts";
import { censusOf, qtiMigrations } from "#pantry/test/census.ts";

/**
 * The committed migration's measured counts (the `_init` regenerated on grizzle `4b155e8`), as a
 * ratchet: a change that moves one fails here until the count is measured again. A regeneration
 * updates them here, and only here.
 *
 * - `tables`: one per stored relation;
 * - `names`: one names constant per roster;
 * - `live`: one live set per roster whose sets a field holds, each beside its bits domain;
 * - `constants`: the closed constants the laws, generated fields and queries read, of the 63 closed
 *   relations;
 * - `nodeAxes`: `Node`'s own foreign keys, its families' axes (the owner copy, the predecessor, the
 *   deferred last, and the attribute and namespace stand-ins);
 * - `nodeKeys`: every foreign key on `Node`, its axes and the reverse sides of the mirrors into its
 *   selections.
 */
const measured = {
  constants: 99,
  live: 7,
  names: 35,
  nodeAxes: 5,
  nodeKeys: 43,
  tables: 168,
} as const;

/**
 * Count the schema's members of one kind.
 *
 * @param kind - `relation` for a stored relation, `closed` for a roster.
 * @returns How many members `Qti` holds of that kind.
 */
const membersOf = (kind: "closed" | "relation"): number =>
  Object.values(Qti.relations).filter((member) => member.kind === kind).length;

describe("the committed migration", () => {
  it.effect(
    "is one _init folder and its snapshot, meets every zero target, and holds the measured counts",
    () =>
      // Oracle: the specification as a checker, fin.md §13's zero targets (the ones
      // `census.test.ts` states as predicates) and plan-qti-pie Q6.02's counts, over the committed
      // migration's census; the schema's own members for the counts that follow from them (a table
      // per stored relation, a names constant per roster).
      // Bound: the one committed migration.
      Effect.gen(function* committedCensus() {
        const fs = yield* FileSystem.FileSystem;
        const entries = (yield* fs.readDirectory(qtiMigrations)).toSorted();
        const held = yield* censusOf(qtiMigrations);

        assert.lengthOf(entries, 2, entries.join(", "));
        assert.match(entries[0] ?? "", /^\d{14}_init$/u);
        assert.strictEqual(entries[1], "snapshot.json");
        assert.deepStrictEqual(
          {
            constraintTriggers: held.laws.constraintTriggers,
            enums: held.enums,
            inserts: held.seed.inserts,
            lawFunctions: held.functions.law,
            policies: held.policies.total,
            repeatedDomains: held.domains.total - held.domains.distinct,
            seedFolders: held.seed.folders,
            seededRelations: Object.keys(held.seed.rows).length,
            validateFiles: held.laws.validateFiles,
          },
          {
            constraintTriggers: 0,
            enums: 0,
            inserts: 0,
            lawFunctions: 0,
            policies: 0,
            repeatedDomains: 0,
            seedFolders: 0,
            seededRelations: 0,
            validateFiles: 0,
          },
        );
        assert.deepStrictEqual(
          {
            constants: held.functions.constant,
            live: held.functions.live,
            names: held.functions.names,
            nodeAxes: held.foreignKeys.axes["node"] ?? 0,
            nodeKeys: held.foreignKeys.byTable["node"] ?? 0,
            tables: held.tables.total,
          },
          measured,
        );
        assert.strictEqual(held.tables.total, membersOf("relation"), "a table per stored relation");
        assert.strictEqual(
          held.functions.names,
          membersOf("closed"),
          "a names constant per roster",
        );
        assert.strictEqual(held.functions.live, held.domains.bits, "a live set per bits domain");
      }).pipe(Effect.provide(NodeServices.layer)),
    { timeout: 300_000 },
  );
});
