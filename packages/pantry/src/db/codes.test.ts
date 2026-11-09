import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { committedRosters, decodeCommittedRosters, inCommittedOrder } from "#pantry/db/codes.ts";

interface RelationText {
  readonly codes?: readonly { readonly handle?: string; readonly kind: string }[];
  readonly kind?: string;
}

const slots = (...entries: readonly (string | null)[]) =>
  entries.map((entry) => (entry === null ? { kind: "hole" } : { handle: entry, kind: "live" }));

const snapshotText = (relations: Readonly<Record<string, RelationText>>) =>
  JSON.stringify({ theory: { relations } });

describe("inCommittedOrder", () => {
  it("keeps the committed order and appends new handles in the grammar's order", () => {
    assert.deepStrictEqual(inCommittedOrder(["a", "b", "c"], ["a", "x", "c", "b", "y"]), [
      "a",
      "b",
      "c",
      "x",
      "y",
    ]);
  });

  it("leaves out a committed handle the grammar dropped", () => {
    assert.deepStrictEqual(inCommittedOrder(["a", "b", "c"], ["a", "c", "x"]), ["a", "c", "x"]);
    assert.deepStrictEqual(inCommittedOrder(["a", "b", "c"], ["c", "a"]), ["a", "c"]);
  });

  it("returns the grammar's order when nothing is committed", () => {
    assert.deepStrictEqual(inCommittedOrder([], ["b", "a", "c"]), ["b", "a", "c"]);
  });
});

describe("decodeCommittedRosters", () => {
  it.effect("reads each roster's live handles in code order and skips holes", () =>
    Effect.gen(function* readsLive() {
      const rosters = yield* decodeCommittedRosters(
        "/snapshot.json",
        snapshotText({
          Closed: { codes: slots("a", null, "b"), kind: "closed" },
          Plain: { kind: "open" },
        }),
      );

      assert.deepStrictEqual([...rosters], [["Closed", ["a", "b"]]]);
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
        snapshotText({ Closed: { codes: [{ kind: "other" }] } }),
      ).pipe(Effect.flip);

      assert.strictEqual(failure._tag, "SnapshotLoadError");
    }),
  );
});

describe("committedRosters", () => {
  it("holds the committed snapshot's rosters", () => {
    assert.isAbove(committedRosters.get("ContentModel")?.length ?? 0, 0);
  });
});
