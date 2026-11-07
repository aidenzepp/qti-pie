/**
 * A zip's central directory ends where its end record begins (reading 140): `readZip` reads an
 * archive whose end record follows its directory exactly, and refuses one with any other bytes
 * between them, as APPNOTE 6.3.10's overall layout (section 4.3.6) leaves room there for the ZIP64
 * end record and locator alone, which are not read.
 *
 * Oracle: that layout as a table (`expected`). Bound: gaps of 0, 1, 4 and 22 bytes (an end record's
 * length) between `writeZip`'s directory and end record, each with no ZIP64 records and with a
 * ZIP64 end record and its locator standing before the end record, after the gap. GEN-B's zip
 * search (`src/test/genetic-zip.test.ts`) breeds the rest.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter } from "effect";
import { packageBudget, readZip, writeZip } from "#pantry/package/zip.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The gap lengths the box draws.
 */
const GAPS = [0, 1, 4, 22] as const;

/**
 * Whether the ZIP64 end record and its locator stand before the end record.
 */
const ZIP64 = [false, true] as const;

/**
 * One case: the gap's length, and whether the ZIP64 records follow it.
 */
interface GapCase {
  readonly gap: (typeof GAPS)[number];
  readonly zip64: (typeof ZIP64)[number];
}

/**
 * Draw a case.
 */
const gapCase: Gen<GapCase> = (source) => ({
  gap: source.draw(element(GAPS)),
  zip64: source.draw(element(ZIP64)),
});

/**
 * What a case comes to.
 */
type Verdict = "read" | "gap refused" | "ZIP64 refused";

/**
 * The verdicts, as the box's coverage names them.
 */
const VERDICTS = ["read", "gap refused", "ZIP64 refused"] as const satisfies readonly Verdict[];

/**
 * Name a refusal by its feature: the ZIP64 refusal, the gap's, or the feature itself for any other,
 * which no case expects.
 *
 * @param feature - The refusal's feature.
 * @returns The verdict.
 */
const verdictOfRefusal = (feature: string): string => {
  if (feature.includes("ZIP64")) {
    return "ZIP64 refused";
  }

  return feature.includes("bytes stand between it and the end record") ? "gap refused" : feature;
};

/**
 * The layout as a table: an archive with ZIP64 records is refused as ZIP64, which is not read;
 * one without is read only where nothing stands between its directory and its end record.
 *
 * @param drawnCase - The case.
 * @returns The verdict.
 */
const expected = ({ gap, zip64 }: GapCase): Verdict => {
  if (zip64) {
    return "ZIP64 refused";
  }

  return gap === 0 ? "read" : "gap refused";
};

/**
 * The end record's length with no comment (APPNOTE section 4.3.16).
 */
const END_LENGTH = 22;

/**
 * Write a little-endian unsigned integer of `bytes` bytes.
 *
 * @param value - The value.
 * @param bytes - Its width.
 * @returns The bytes.
 */
const little = (value: number, bytes: number): readonly number[] =>
  Array.from({ length: bytes }, (_, at) => Math.floor(value / 256 ** at) % 256);

/**
 * Write a ZIP64 end record (section 4.3.14) and its locator (section 4.3.15), the record at
 * `at`.
 *
 * @param at - The record's offset.
 * @returns The record and the locator, 76 bytes.
 */
const zip64Records = (at: number): readonly number[] => [
  ...little(0x06_06_4b_50, 4),
  ...little(44, 8),
  ...little(45, 2),
  ...little(45, 2),
  ...little(0, 4),
  ...little(0, 4),
  ...little(1, 8),
  ...little(1, 8),
  ...little(0, 8),
  ...little(0, 8),
  ...little(0x07_06_4b_50, 4),
  ...little(0, 4),
  ...little(at, 8),
  ...little(1, 4),
];

/**
 * Write a case's archive: a one-entry archive from `writeZip`, with the case's gap of `J` bytes
 * and its ZIP64 records spliced in before the end record, whose offsets still name the directory.
 *
 * @param drawnCase - The case.
 * @returns The archive's bytes.
 */
const archiveOf = ({ gap, zip64 }: GapCase): Uint8Array => {
  const base = writeZip([
    { bytes: new TextEncoder().encode("<manifest/>"), path: "imsmanifest.xml" },
  ]);
  const endAt = base.length - END_LENGTH;
  const filler = Array.from({ length: gap }, () => 0x4a);

  return Uint8Array.from([
    ...base.subarray(0, endAt),
    ...filler,
    ...(zip64 ? zip64Records(endAt + gap) : []),
    ...base.subarray(endAt),
  ]);
};

describe("a zip's central directory and end record", () => {
  it.effect(
    "stand back to back: a gap between them is refused, ZIP64 records there are refused as ZIP64, and nothing between them reads",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "gaps of 0, 1, 4 and 22 bytes between the directory and the end record, without and with the ZIP64 end record and locator: 8 cases",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<Verdict>(VERDICTS),
            generator: gapCase,
            limit: GAPS.length * ZIP64.length,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "APPNOTE 6.3.10 section 4.3.6's overall layout",
            },
            suite: "pantry/package/zip-gap",
          },
          (drawnCase, c) =>
            Effect.gen(function* judgeGap() {
              const fs = yield* FileSystem.FileSystem;
              const folder = yield* scratchDirectory("zip-gap-");
              const file = `${folder}/case.zip`;
              yield* fs.writeFile(file, archiveOf(drawnCase));

              const got = yield* readZip(file, packageBudget).pipe(
                Effect.map((): string => "read"),
                Effect.catchTag("ZipRefusal", (refusal) =>
                  Effect.succeed(verdictOfRefusal(refusal.feature)),
                ),
              );
              const verdict = VERDICTS.find((held) => held === got);
              if (verdict !== undefined) {
                c.note(verdict);
              }

              assert.strictEqual(got, expected(drawnCase), Formatter.format(drawnCase));
            }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, GAPS.length * ZIP64.length);
          }),
        ),
      ),
  );
});
