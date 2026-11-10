/**
 * The census of the committed migration (plan-qti-pie Q6.02): the one `_init` folder the Qti
 * schema's migrations hold, beside the snapshot's two files and `served/`, which holds the one file
 * `grizzle generate` writes for the author login (`#pantry/db/served.ts`), taken by
 * `#pantry/test/census.ts`, meets fin.md §13's zero targets and holds the measured counts. It lands
 * with the migration it reads, so it is a file of its own: the census's parser and its targets are
 * `census.test.ts`'s, which need no migration.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { Qti } from "#pantry/qti/own.ts";
import { censusOf, qtiMigrations } from "#pantry/test/census.ts";

/**
 * The committed migration's measured counts (the `_init` drafted from zero on grizzle `450d098`,
 * after the composition's restated include, symbol and admission sets and the author login's
 * package read, which move none of them, and after the merge of upstream's genetic repair round 4,
 * whose placed reference type is a query, `PlacedReferenceType`: its rule, "Condition type", reads
 * four tables, so four constraint triggers more, and its placed map responses' two containments
 * move no count; measured again after `Entry`'s generated `digest`, whose column and text domain
 * move none), as a ratchet: a change that moves one fails here until the count is measured
 * again. A regeneration updates them here, and only here.
 *
 * - `tables`: one per stored relation;
 * - `names`: one names constant per roster;
 * - `live`: one live set per roster whose sets a field holds, each beside its bits domain;
 * - `constants`: the closed constants the laws, generated fields and queries read, of the closed
 *   relations;
 * - `nodeAxes`: `Node`'s own foreign keys, its families' axes (the owner copy, the predecessor, the
 *   deferred last, and the attribute and namespace stand-ins);
 * - `nodeKeys`: every foreign key on `Node`, its axes and the reverse sides of the mirrors into its
 *   selections;
 * - `constraintTriggers`: one deferred constraint trigger per table a rule over a query reads
 *   (`#pantry/qti/queries.ts`), which is how grizzle judges such a rule at COMMIT (README, "Rules
 *   over queries"), so fin.md §13's zero target for them no longer holds since the cutover;
 * - `validateFiles`: the one `-validate.sql` file those rules are validated in.
 */
const measured = {
  constants: 119,
  constraintTriggers: 96,
  live: 7,
  names: 48,
  nodeAxes: 5,
  nodeKeys: 48,
  tables: 251,
  validateFiles: 1,
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
    "is one _init folder, its snapshot's two files and the author login's served file, meets every zero target, and holds the measured counts",
    () =>
      // Oracle: the specification as a checker, fin.md §13's zero targets (the ones
      // `census.test.ts` states as predicates) and plan-qti-pie Q6.02's counts, over the committed
      // migration's census; the schema's own members for the counts that follow from them (a table
      // per stored relation, a names constant per roster). The chain's later migrations (GEN-S3 to
      // GEN-S8) fold into the one `_init` drafted from zero, so their data steps, which moved rows
      // already stored, have none to move, and the zero target for inserts holds.
      // Bound: the one committed migration.
      Effect.gen(function* committedCensus() {
        const fs = yield* FileSystem.FileSystem;
        const entries = (yield* fs.readDirectory(qtiMigrations)).toSorted();
        const served = (yield* fs.readDirectory(`${qtiMigrations}/served`)).toSorted();
        const held = yield* censusOf(qtiMigrations);

        assert.lengthOf(entries, 4, entries.join(", "));
        assert.match(entries[0] ?? "", /^\d{14}_init$/u);
        assert.strictEqual(entries[1], "manifest.json");
        assert.strictEqual(entries[2], "served");
        assert.strictEqual(entries[3], "snapshot.json");
        assert.deepStrictEqual(served, ["author_app.json"], "the author login's one served file");
        assert.deepStrictEqual(
          {
            enums: held.enums,
            inserts: held.seed.inserts,
            lawFunctions: held.functions.law,
            laws: held.laws.total,
            policies: held.policies.total,
            repeatedDomains: held.domains.total - held.domains.distinct,
            seedFolders: held.seed.folders,
            seededRelations: Object.keys(held.seed.rows).length,
          },
          {
            enums: 0,
            inserts: 0,
            lawFunctions: 0,
            laws: 0,
            policies: 0,
            repeatedDomains: 0,
            seedFolders: 0,
            seededRelations: 0,
          },
        );
        assert.deepStrictEqual(
          {
            constants: held.functions.constant,
            constraintTriggers: held.laws.constraintTriggers,
            live: held.functions.live,
            names: held.functions.names,
            nodeAxes: held.foreignKeys.axes["node"] ?? 0,
            nodeKeys: held.foreignKeys.byTable["node"] ?? 0,
            tables: held.tables.total,
            validateFiles: held.laws.validateFiles,
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
