/**
 * The relations an import writes, as `#pantry/import/roster.ts` commits them, held to the schema
 * and to what the builders and the writer do with a real package: the list is exactly grizzle's
 * `insertableNamesOf(Qti)`, every relation a builder writes is one the roster names, every relation
 * the roster names is one a builder writes, and the ChangeSet inserts each once.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { insertableNamesOf } from "@bjornpagen/grizzle";
import { Effect, Schema } from "effect";
import { overlayPartsOf } from "#pantry/import/overlays/index.ts";
import { readProgram } from "#pantry/import/program.ts";
import { documentLayerNames, overlayNames, writtenNames } from "#pantry/import/roster.ts";
import { changeSetOf, documentRowsOf } from "#pantry/import/write.ts";
import { Author } from "#pantry/qti/own-login.ts";
import { Qti } from "#pantry/qti/own.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 1 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * The relations each member of a ChangeSet's Description inserts, as its `desc` holds them.
 */
const InsertedRelations = Schema.Struct({
  desc: Schema.Struct({
    strata: Schema.Array(
      Schema.Struct({
        members: Schema.Array(
          Schema.Struct({ op: Schema.Literal("insert"), relation: Schema.String }),
        ),
      }),
    ),
  }),
});

/**
 * Sort names by their code points.
 *
 * @param names - The names.
 * @returns The names, sorted.
 */
const sortedNames = (names: Iterable<string>): readonly string[] =>
  [...names].toSorted((x, y) => (x < y ? -1 : Number(x > y)));

/**
 * The every-relation package, read: its program, every overlay builder's parts and each document's
 * document-layer rows.
 */
const everyRelation = Effect.gen(function* everyRelation() {
  const dir = yield* scopedPackage(everyRelationPackage({ choices: 3, hotspots: 2, hottexts: 2 }));
  const program = yield* readProgram(dir);
  const parts = overlayPartsOf(program.documents, () => crypto.randomUUID());
  const layers = program.documents.map(({ ids, listed }) => documentRowsOf(listed, ids));

  return { layers, parts, program };
});

layer(NodeServices.layer)("the roster", (it) => {
  it.effect(
    "lists exactly the relations insertAll takes over Qti, so none is missing and none is stale",
    () =>
      // Oracle: grizzle's `insertableNamesOf` over the composed schema, the list the roster read off
      // `Qti` before it was committed. Bound: every stored relation of `Qti`; the document layer's
      // names are held to be among them, so a renamed layer relation fails here too.
      Effect.sync(() => {
        const insertable = sortedNames(insertableNamesOf(Qti));

        assert.deepStrictEqual(
          [...writtenNames],
          insertable,
          "The import's committed roster (src/import/roster.ts writtenRelations) differs from the relations insertAll takes over Qti: list each name the schema adds and delete each it no longer has.",
        );
        assert.includeMembers([...insertable], [...documentLayerNames]);
      }),
  );

  it.effect(
    "names exactly the relations the overlay builders write, so none is dropped or left unwritten",
    () =>
      // Oracle: the builders themselves. Each returns its every relation, empty or not, so the keys
      // of their parts over the every-relation package are the relations they write. A builder
      // relation the roster lacks would be dropped by the merge, and a roster name no builder writes
      // would have no rows to insert.
      Effect.gen(function* builders() {
        const { parts } = yield* everyRelation;
        const written = new Set(parts.flatMap((part) => Object.keys(part)));

        assert.deepStrictEqual(sortedNames(written), [...overlayNames]);
      }).pipe(Effect.scoped),
    testTimeoutMs,
  );

  it.effect("names exactly the relations the document layer writes", () =>
    Effect.gen(function* layers() {
      const { layers: written } = yield* everyRelation;

      for (const rows of written) {
        assert.deepStrictEqual(sortedNames(Object.keys(rows)), [...documentLayerNames]);
      }
    }).pipe(Effect.scoped),
  );

  it.effect(
    "inserts each written relation once, and its inputs are exactly the written relations",
    () =>
      Effect.gen(function* inserts() {
        const { program } = yield* everyRelation;
        const { desc } = Schema.decodeUnknownSync(InsertedRelations)(
          changeSetOf(Author, program.inputs),
        );
        const inserted = desc.strata.flatMap(({ members }) =>
          members.map(({ relation }) => relation),
        );

        assert.deepStrictEqual(sortedNames(Object.keys(program.inputs)), [...writtenNames]);
        assert.deepStrictEqual(sortedNames(inserted), [...writtenNames]);
        assert.strictEqual(new Set(inserted).size, inserted.length);
      }).pipe(Effect.scoped),
    testTimeoutMs,
  );
});
