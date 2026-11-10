import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Array as Arr, Console, Effect, FileSystem, Order, Schema } from "effect";
import { Command } from "effect/cli";
import { fileURLToPath } from "node:url";
import { SnapshotLoadError, snapshotPath } from "#pantry/db/snapshot.ts";

/**
 * One slot of a roster's codes in the snapshot: the handle that holds the code, or the hole a
 * removed handle left (`grizzle-engine/src/ir/cells.ts:33-35`).
 */
const Slot = Schema.Union([
  Schema.Struct({ handle: Schema.String, kind: Schema.Literal("live") }),
  Schema.Struct({ kind: Schema.Literal("hole") }),
]);

/**
 * The part of grizzle's snapshot this module reads: each roster's codes, by the roster's name,
 * which `snapshot.json` records under `rosters` (`manifest.json` holds the rest of the snapshot).
 * grizzle's public index exports no reader for it, so a layout this does not know fails the
 * decode.
 */
const CommittedSnapshot = Schema.fromJsonString(
  Schema.Struct({ rosters: Schema.Record(Schema.String, Schema.Array(Slot)) }),
);

/**
 * The generated module of roster orders, `src/db/rosters.json`, which `#pantry/db/codes.ts`
 * imports: each roster's live handles in code order, by the roster's name.
 */
export const rostersPath: string = fileURLToPath(import.meta.resolve("#pantry/db/rosters.json"));

/**
 * Each roster's live handles in code order, read from the text of a snapshot; holes are skipped.
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
      ({ rosters }) =>
        new Map(
          Object.entries(rosters).map(
            ([name, codes]) =>
              [name, codes.flatMap((slot) => (slot.kind === "live" ? [slot.handle] : []))] as const,
          ),
        ),
    ),
    Effect.mapError((reason) => new SnapshotLoadError({ path, reason })),
  );

/**
 * Each roster's live handles in code order, from the snapshot committed in this checkout. Empty
 * when the checkout has no snapshot, which is a schema with no migration and so no history.
 *
 * Fails with {@link SnapshotLoadError} when the file exists and cannot be read or decoded, as a
 * checkout made without git-lfs leaves it.
 */
export const readCommittedRosters: Effect.Effect<
  ReadonlyMap<string, readonly string[]>,
  SnapshotLoadError,
  FileSystem.FileSystem
> = Effect.gen(function* readCommittedRosters() {
  const fs = yield* FileSystem.FileSystem;

  if (!(yield* fs.exists(snapshotPath).pipe(Effect.orDie))) {
    return new Map<string, readonly string[]>();
  }

  const text = yield* fs
    .readFileString(snapshotPath)
    .pipe(Effect.mapError((reason) => new SnapshotLoadError({ path: snapshotPath, reason })));

  return yield* decodeCommittedRosters(snapshotPath, text);
}).pipe(Effect.withSpan("db.readCommittedRosters"));

/**
 * The text of `rosters.json` for a set of roster orders: an object keyed by roster name in sorted
 * order, each value the handles in code order, with a trailing newline, so the same snapshot
 * always gives the same bytes.
 *
 * @param rosters - Each roster's live handles in code order
 * @returns The file's text
 */
export const rostersJson = (rosters: ReadonlyMap<string, readonly string[]>): string =>
  `${JSON.stringify(
    Object.fromEntries(
      Arr.sort(
        [...rosters],
        Order.mapInput(Order.String, ([name]: readonly [string, readonly string[]]) => name),
      ),
    ),
    null,
    2,
  )}\n`;

/**
 * The command line: `rosters` writes `src/db/rosters.json` from the committed snapshot. Run it
 * after a `grizzle generate` that changes a roster.
 */
const command = Command.make(
  "rosters",
  {},
  Effect.fn("db.rostersCommand")(function* rostersCommand() {
    const fs = yield* FileSystem.FileSystem;
    const rosters = yield* readCommittedRosters;

    yield* fs.writeFileString(rostersPath, rostersJson(rosters));
    yield* Console.log(`wrote ${rosters.size} roster orders to ${rostersPath}`);
  }),
).pipe(
  Command.withDescription(
    "Write src/db/rosters.json, each roster's live handles in code order, from migrations/qti/snapshot.json. Run it after a grizzle generate that changes a roster.",
  ),
);

if (import.meta.main) {
  NodeRuntime.runMain(
    Command.run(command, { version: "0.0.0" }).pipe(Effect.provide(NodeServices.layer)),
  );
}
