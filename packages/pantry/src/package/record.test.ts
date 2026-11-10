/**
 * The package record, checked as a property: `recordOf` against the listing it is given, the bytes
 * of each entry read wherever they lie.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, bytes, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import type { PackageFile } from "#pantry/package/read.ts";
import { recordOf } from "#pantry/package/record.ts";

/**
 * Where an entry's bytes lie: in an `ArrayBuffer` of their own, as a view at an offset into a
 * longer one, as a pooled `Buffer`'s are, or in a `SharedArrayBuffer`.
 */
const placements = ["own", "offset", "shared"] as const;

/**
 * Where an entry's bytes lie.
 */
type Placement = (typeof placements)[number];

/**
 * Lay `content` out as `placement` says, its bytes the same.
 *
 * @param content - The bytes.
 * @param placement - Where they lie.
 * @param lead - The bytes before them in the longer buffer an `offset` placement views.
 * @returns A `Uint8Array` of `content`'s bytes, over the buffer `placement` names.
 */
const placed = (content: Uint8Array, placement: Placement, lead: number): Uint8Array => {
  if (placement === "own") {
    return Uint8Array.from(content);
  }

  const buffer =
    placement === "shared"
      ? new SharedArrayBuffer(lead + content.length + 1)
      : new ArrayBuffer(lead + content.length + 1);
  const view = new Uint8Array(buffer, lead, content.length);
  view.set(content);

  return view;
};

/**
 * One drawn file: its bytes, where they lie, and how far into their buffer.
 */
const fileOf: Gen<{
  readonly content: Uint8Array;
  readonly lead: number;
  readonly placement: Placement;
}> = (source) => ({
  content: source.draw(bytes({ max: 40, min: 0 })),
  lead: source.draw(int(0, 7)),
  placement: source.draw(element(placements)),
});

/**
 * A listing as `readEntries` gives one: up to five files at distinct paths, each one's bytes in
 * each placement.
 */
const listingOf: Gen<readonly (PackageFile & { readonly placement: Placement })[]> = (source) =>
  source.draw(array(fileOf, { max: 5, min: 0 })).map(({ content, lead, placement }, index) => ({
    bytes: placed(content, placement, lead),
    kind: index === 0 ? "manifest" : "file",
    path: index === 0 ? "imsmanifest.xml" : `F/${index}.Bin`,
    placement,
  }));

describe("package/record.ts", () => {
  it.effect(
    "recordOf keeps the listing's order and paths, each content the entry's bytes over an ArrayBuffer, wherever they lay",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required<Placement | "empty">([...placements, "empty"], {
              cases: 200,
              sense: notesOnly,
            }),
            draw: drawn(listingOf),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the listing itself, its bytes copied out element by element",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/package/record",
          },
          (files, c) =>
            Effect.sync(() => {
              const rows = recordOf(files);

              c.noteAll(files.map((file) => file.placement));
              if (files.length === 0) {
                c.note("empty");
              }

              assert.deepStrictEqual(
                rows.map((row) => row.path),
                files.map((file) => file.path),
              );
              assert.deepStrictEqual(
                rows.map((row) => [...row.content]),
                files.map((file) => [...file.bytes]),
              );
              assert.isTrue(rows.every((row) => row.content.buffer instanceof ArrayBuffer));
            }),
        ),
      ),
  );
});
