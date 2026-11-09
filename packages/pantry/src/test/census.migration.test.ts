/**
 * The census of the committed migration chain (plan-qti-pie Q6.02): the migration folders the Qti
 * schema holds, the `_init` first and a later migration on top for each phase that has landed,
 * taken together by `#pantry/test/census.ts`, meet fin.md §13's zero targets and hold the measured
 * counts. It lands with the migrations it reads, so it is a file of its own: the census's parser
 * and its targets are `census.test.ts`'s, which need no migration.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import path from "node:path";
import { Qti } from "#pantry/qti/schema.ts";
import { censusOf, qtiMigrations } from "#pantry/test/census.ts";

/**
 * The committed chain's measured counts (the chain regenerated over the align laws' migration by
 * the N5 Follow and AL5 repairs' migration, GEN-S3, then extended by the test-root braced
 * reference's migration, GEN-S4, which changes one check and moves no count, and by the order
 * interaction's binding migration, GEN-S5, which replaces one closed constant with another and
 * moves no count, and by the genetic repair's migration, GEN-S6, which adds three tables
 * (`ItemRefHref`, `UnreadTypeHref` and `UnreadTypePath`) and a data step, and by genetic repair
 * round 2's migration, GEN-S7, which adds a `lexical` column to three tables, narrows two copies
 * and moves no count (its data step's UPDATEs insert nothing), and by genetic repair round 3's
 * migration, GEN-S8, which moves "Document entry"'s first containment from a `Site` selection to a
 * `Reference` selection (one generated column, foreign key and index off `Site`, one onto
 * `Reference`), adds no data step and moves no count, on grizzle `1.0.0-beta.1`), as a ratchet: a
 * change that moves one fails here
 * until the count is measured again. A regeneration updates them here, and only here.
 *
 * - `tables`: one per stored relation;
 * - `names`: one names constant per roster;
 * - `live`: one live set per roster whose sets a field holds, each beside its bits domain;
 * - `constants`: the closed constants the laws, generated fields and queries read, of the closed
 *   relations;
 * - `nodeAxes`: `Node`'s own foreign keys, its families' axes (the owner copy, the predecessor, the
 *   deferred last, and the attribute and namespace stand-ins);
 * - `nodeKeys`: every foreign key on `Node`, its axes and the reverse sides of the mirrors into its
 *   selections.
 */
const measured = {
  constants: 117,
  live: 7,
  names: 43,
  nodeAxes: 6,
  nodeKeys: 47,
  tables: 268,
} as const;

/**
 * Count the schema's members of one kind.
 *
 * @param kind - `relation` for a stored relation, `closed` for a roster.
 * @returns How many members `Qti` holds of that kind.
 */
const membersOf = (kind: "closed" | "relation"): number =>
  Object.values(Qti.relations).filter((member) => member.kind === kind).length;

describe("the committed migration chain", () => {
  it.effect(
    "is the _init, its later migrations and the snapshot, meets every zero target, and holds the measured counts",
    () =>
      // Oracle: the specification as a checker, fin.md §13's zero targets (the ones
      // `census.test.ts` states as predicates) and plan-qti-pie Q6.02's counts, over the committed
      // chain's census; the schema's own members for the counts that follow from them (a table per
      // stored relation, a names constant per roster). A validate file is a law's, so the zero
      // target holds for every migration; a later migration's own `-validate.sql` validates
      // constraints it added to tables that already exist, holds no law, and is the only one
      // allowed. Likewise the two `INSERT INTO`s are data steps that seed no table: Stage N's
      // (decision 437), moving the old `UsageValue` rows' `baseType` into `UsageValueBaseType`, and
      // the genetic repair's (GEN-S6), giving each stored item ref's `ItemRefTarget` its new
      // `ItemRefHref`.
      // Bound: the committed chain, the `_init` first.
      Effect.gen(function* committedCensus() {
        const fs = yield* FileSystem.FileSystem;
        const entries = (yield* fs.readDirectory(qtiMigrations)).toSorted();
        const held = yield* censusOf(qtiMigrations);
        const [init, ...later] = entries.slice(0, -1);
        const validateFilesOf = (folder: string) =>
          fs
            .readDirectory(path.join(qtiMigrations, folder))
            .pipe(Effect.map((files) => files.filter((file) => file.endsWith("-validate.sql"))));
        const laterValidateFiles = (yield* Effect.all(later.map(validateFilesOf))).flat();

        assert.isAtLeast(entries.length, 3, entries.join(", "));
        assert.strictEqual(entries.at(-1), "snapshot.json");
        assert.match(init ?? "", /^\d{14}_init$/u);
        for (const migration of later) {
          assert.match(migration, /^\d{14}_[a-z0-9-]+$/u);
        }
        assert.deepStrictEqual(yield* validateFilesOf(init ?? ""), [], "the _init holds no law");
        assert.strictEqual(held.laws.validateFiles, laterValidateFiles.length);
        assert.strictEqual(
          held.seed.inserts,
          2,
          "the two data steps, copying UsageValue.baseType and each ItemRefTarget's ItemRefHref",
        );
        assert.deepStrictEqual(
          {
            constraintTriggers: held.laws.constraintTriggers,
            enums: held.enums,
            lawFunctions: held.functions.law,
            laws: held.laws.total,
            policies: held.policies.total,
            repeatedDomains: held.domains.total - held.domains.distinct,
            seedFolders: held.seed.folders,
            seededRelations: Object.keys(held.seed.rows).length,
          },
          {
            constraintTriggers: 0,
            enums: 0,
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
