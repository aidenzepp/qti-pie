import { NodeFileSystem } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import committed from "#pantry/db/rosters.json" with { type: "json" };
import { decodeCommittedRosters, readCommittedRosters } from "#pantry/db/rosters.ts";

type Codes = readonly { readonly handle?: string; readonly kind: string }[];

const slots = (...entries: readonly (string | null)[]) =>
  entries.map((entry) => (entry === null ? { kind: "hole" } : { handle: entry, kind: "live" }));

const snapshotText = (rosters: Readonly<Record<string, Codes>>) => JSON.stringify({ rosters });

describe("rosters.json", () => {
  it.effect("equals the roster orders the committed snapshot gives", () =>
    // Oracle: the snapshot on disk, decoded as the generator decodes it. A `grizzle generate` that
    // changes a roster and no regeneration after it is the wild case this catches.
    Effect.gen(function* equalsSnapshot() {
      const fromSnapshot = Object.fromEntries(yield* readCommittedRosters);

      assert.deepStrictEqual(
        committed,
        fromSnapshot,
        "src/db/rosters.json differs from the roster orders in migrations/qti/snapshot.json. Run `pnpm --filter @qti-pie/pantry run rosters` and commit the result.",
      );
    }).pipe(Effect.provide(NodeFileSystem.layer)),
  );
});

describe("decodeCommittedRosters", () => {
  it.effect("reads each roster's live handles in code order and skips holes", () =>
    Effect.gen(function* readsLive() {
      const rosters = yield* decodeCommittedRosters(
        "/snapshot.json",
        snapshotText({ Closed: slots("a", null, "b"), Empty: slots(null) }),
      );

      assert.deepStrictEqual(
        [...rosters],
        [
          ["Closed", ["a", "b"]],
          ["Empty", []],
        ],
      );
    }),
  );

  it.effect("fails with SnapshotLoadError for a git-lfs pointer", () =>
    Effect.gen(function* failsOnPointer() {
      const failure = yield* decodeCommittedRosters(
        "/snapshot.json",
        "version https://git-lfs.github.com/spec/v1\noid sha256:0\nsize 16200679\n",
      ).pipe(Effect.flip);

      assert.strictEqual(failure._tag, "SnapshotLoadError");
    }),
  );

  it.effect("fails with SnapshotLoadError for a codes layout it does not know", () =>
    Effect.gen(function* failsOnLayout() {
      const failure = yield* decodeCommittedRosters(
        "/snapshot.json",
        snapshotText({ Closed: [{ kind: "other" }] }),
      ).pipe(Effect.flip);

      assert.strictEqual(failure._tag, "SnapshotLoadError");
    }),
  );
});
