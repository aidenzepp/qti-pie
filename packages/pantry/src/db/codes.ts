import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import { Array, Effect, FileSystem, Schema } from "effect";
import { SnapshotLoadError, snapshotPath } from "#pantry/db/snapshot.ts";

/**
 * A roster's handles in the one order grizzle accepts: the handles the committed snapshot holds
 * live that `handles` still declares, in their code order, then the handles new since the
 * snapshot, in the order `handles` gives them.
 *
 * Grizzle numbers a roster's handles by history: a kept handle keeps its code, a new one takes the
 * next, and the declared order must be the code order. A handle the snapshot holds that `handles`
 * dropped is left out, which grizzle records as a hole. A renamed handle counts as new here; the
 * rename is declared to grizzle, never inferred.
 *
 * @param committed - The roster's live handles in code order from the snapshot; empty when the
 *   snapshot holds no such roster
 * @param handles - The roster's handles as the grammar computes them
 * @returns The same handles, ordered
 */
export const inCommittedOrder = <H extends string>(
  committed: readonly string[],
  handles: readonly [H, ...H[]],
): readonly [H, ...H[]] => {
  const declared: ReadonlySet<string> = new Set(handles);
  const kept = committed.filter((handle): handle is H => declared.has(handle));
  const keptSet: ReadonlySet<string> = new Set(kept);
  const ordered = [...kept, ...handles.filter((handle) => !keptSet.has(handle))];

  // `handles` is nonempty and every handle of it lands in `ordered`, so the fallback never runs;
  // the guard gives `ordered` its nonempty type without an assertion.
  return Array.isReadonlyArrayNonEmpty(ordered) ? ordered : handles;
};

/**
 * One slot of a roster's codes in the snapshot: the handle that holds the code, or the hole a
 * removed handle left (`grizzle-engine/src/ir/cells.ts:33-35`).
 */
const Slot = Schema.Union([
  Schema.Struct({ handle: Schema.String, kind: Schema.Literal("live") }),
  Schema.Struct({ kind: Schema.Literal("hole") }),
]);

/**
 * The part of grizzle's snapshot this module reads: each relation's `codes`, when it has them.
 * grizzle's public index exports no reader for it, so a layout this does not know fails the
 * decode.
 */
const CommittedSnapshot = Schema.fromJsonString(
  Schema.Struct({
    theory: Schema.Struct({
      relations: Schema.Record(
        Schema.String,
        Schema.Struct({ codes: Schema.optionalKey(Schema.Array(Slot)) }),
      ),
    }),
  }),
);

/**
 * Each roster's live handles in code order, read from the text of a snapshot; holes are skipped,
 * and a relation without codes is not a roster.
 *
 * Fails with {@link SnapshotLoadError} when the text is not JSON of the layout grizzle writes, as
 * a git-lfs pointer file is not.
 *
 * @param path - The file the text came from, named by the error
 * @param text - The snapshot file's text
 */
export const decodeCommittedRosters = (
  path: string,
  text: string,
): Effect.Effect<ReadonlyMap<string, readonly string[]>, SnapshotLoadError> =>
  Schema.decodeUnknownEffect(CommittedSnapshot)(text).pipe(
    Effect.map(
      ({ theory }) =>
        new Map(
          Object.entries(theory.relations).flatMap(([name, { codes }]) =>
            codes === undefined
              ? []
              : [
                  [
                    name,
                    codes.flatMap((slot) => (slot.kind === "live" ? [slot.handle] : [])),
                  ] as const,
                ],
          ),
        ),
    ),
    Effect.mapError((reason) => new SnapshotLoadError({ path, reason })),
  );

/**
 * Each roster's live handles in code order, from the snapshot committed in this checkout, read
 * once when this module is evaluated. Empty when the checkout has no snapshot, which is a schema
 * with no migration and so no history.
 *
 * Evaluating this module fails with {@link SnapshotLoadError} when the file exists and cannot be
 * decoded, as a checkout made without git-lfs leaves it.
 */
export const committedRosters: ReadonlyMap<string, readonly string[]> = await Effect.runPromise(
  Effect.gen(function* readCommittedRosters() {
    const fs = yield* FileSystem.FileSystem;

    if (!(yield* fs.exists(snapshotPath).pipe(Effect.orDie))) {
      return new Map<string, readonly string[]>();
    }

    const text = yield* fs
      .readFileString(snapshotPath)
      .pipe(Effect.mapError((reason) => new SnapshotLoadError({ path: snapshotPath, reason })));

    return yield* decodeCommittedRosters(snapshotPath, text);
  }).pipe(Effect.provide(NodeFileSystem.layer)),
);
