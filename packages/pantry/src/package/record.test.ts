/**
 * The package record, checked as a property: `recordOf` against RFC 4648's base64.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, bytes, map } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import type { PackageFile } from "#pantry/package/read.ts";
import { recordOf } from "#pantry/package/record.ts";

/**
 * The canonical form RFC 4648 section 4 gives base64: the 64-letter alphabet in groups of four,
 * the last group padded with `=` to four, and nothing else, so one byte string has one spelling.
 */
const canonicalBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;

/**
 * A listing as `readPackage` gives one: up to five files at distinct paths, in both letter cases,
 * each byte length drawn across the three remainders modulo 3 that decide base64's padding.
 */
const listingOf: Gen<readonly PackageFile[]> = map(
  array(bytes({ max: 40, min: 0 }), { max: 5, min: 0 }),
  (contents) =>
    contents.map((content, index) => ({
      bytes: content,
      kind: index === 0 ? "manifest" : "file",
      path: index === 0 ? "imsmanifest.xml" : `F/${index}.Bin`,
    })),
);

/**
 * Which padding each row's content ends with, the situation base64 encoders get wrong.
 */
const paddingOf = (length: number): "none" | "one" | "two" => {
  const remainder = length % 3;

  if (remainder === 0) {
    return "none";
  }

  return remainder === 2 ? "one" : "two";
};

describe("package/record.ts", () => {
  it.effect(
    "recordOf keeps the listing's order and paths, each content the canonical base64 of its bytes",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required<"none" | "one" | "two" | "empty">(["none", "one", "two", "empty"], {
              cases: 200,
              sense: notesOnly,
            }),
            draw: drawn(listingOf),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "Node's Buffer, a second base64 encoder (RFC 4648 §4), and Uint8Array.fromBase64's round trip",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/package/record",
          },
          (files, c) =>
            Effect.sync(() => {
              const rows = recordOf(files);

              c.noteAll(files.map((file) => paddingOf(file.bytes.length)));
              if (files.length === 0) {
                c.note("empty");
              }

              assert.deepStrictEqual(
                rows.map((row) => row.path),
                files.map((file) => file.path),
              );

              for (const [at, row] of rows.entries()) {
                const original = files[at]?.bytes ?? new Uint8Array();

                // Two oracles: Node's Buffer, a second base64 encoder, and the decode round trip.
                assert.match(row.content, canonicalBase64);
                assert.strictEqual(row.content, Buffer.from(original).toString("base64"));
                assert.deepStrictEqual(
                  Uint8Array.fromBase64(row.content),
                  Uint8Array.from(original),
                );
              }
            }),
        ),
      ),
  );
});
