/**
 * The every-relation generator (`#pantry/test/gen/every-relation.ts`) against what it claims of
 * every package it draws: its entries are a keyed set by path that a reader reads back whole, its
 * import program writes a row of every stored relation of `Qti` but those only a refused package
 * writes ({@link refusedOnly}), and the law oracle accepts it. The list of relations is read from
 * the schema, so a relation that joins `Qti` joins this test.
 */
import { writableNamesOf } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { readProgram, rowCountsOf } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import {
  everyRelationPackage,
  scopedPackage,
  memberCounts,
} from "#pantry/test/gen/every-relation.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 25.6 s at a load average of 75,
 * under V8 coverage, its slowest test.
 */
const testTimeoutMs = 300_000;

/**
 * The stored relations of `Qti` whose rows only a refused package writes, each with the reading
 * that refuses the package (decision 453 of the genetic repair): no package the law oracle accepts
 * writes one, so the coverage requirement leaves them out. Every other stored relation stays
 * required.
 *
 * - `UnreadTypeHref` and `UnreadTypePath`: a resource's `type` that is written and spells no
 *   `ResourceType` handle, which AL1's value domain refuses (spec reading 67).
 */
const refusedOnly: ReadonlyMap<string, string> = new Map([
  ["UnreadTypeHref", "reading 67, AL1"],
  ["UnreadTypePath", "reading 67, AL1"],
]);

/**
 * The situations the box reaches: a count past its least.
 */
type CountSituation = "a choice past the mapped two" | "a second hotspot" | "a second hottext";

layer(NodeServices.layer, { excludeTestServices: true })("test/gen/every-relation.ts", (it) => {
  it.effect(
    "draws packages whose entries are a keyed set, whose import writes every stored relation of Qti, and which the law oracle accepts",
    (ctx) =>
      // Oracle: the specification as a checker. A package's entries are a set by path, read back
      // by `readPackage` as written, each once; the import's program (`readProgram`, the rows its
      // one ChangeSet writes, counted by `rowCountsOf`) holds a row of each stored relation of
      // `Qti`, grizzle's `writableNamesOf(Qti)`; and the law oracle (`#pantry/test/oracle.ts`, plan
      // §1.3 to §1.7 on the host) finds no breach.
      // Bound: every count of 2 or 3 choices, 1 or 2 hottexts and 1 or 2 hotspots, 8 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "every count of 2 or 3 choices, 1 or 2 hottexts and 1 or 2 hotspots",
            caseHang: Duration.seconds(60),
            coverage: requiredInSpace<CountSituation>([
              "a choice past the mapped two",
              "a second hotspot",
              "a second hottext",
            ]),
            generator: memberCounts,
            limit: 8,
            literal: JSON.stringify,
            oracle: {
              kind: "specification",
              name: "the package's set of entries, Qti's stored relations, and the law oracle",
            },
            suite: "pantry/test/gen-every-relation",
          },
          (members, c) =>
            Effect.gen(function* everyRelationHolds() {
              if (members.choices > 2) {
                c.note("a choice past the mapped two");
              }

              if (members.hotspots > 1) {
                c.note("a second hotspot");
              }

              if (members.hottexts > 1) {
                c.note("a second hottext");
              }

              const entries = everyRelationPackage(members);
              const dir = yield* scopedPackage(entries);
              const files = yield* readPackage(dir);
              const read = files.map(({ path }) => path);

              assert.strictEqual(new Set(read).size, read.length, "a path read twice");
              assert.sameMembers(read, [...entries.keys()]);
              for (const { bytes, path } of files) {
                assert.deepStrictEqual(bytes, entries.get(path), path);
              }

              assert.deepStrictEqual(yield* oracleVerdict(files), { kind: "accepted" });

              const counts = rowCountsOf(yield* readProgram(dir));
              const stored = writableNamesOf(Qti);
              assert.includeMembers<string>(
                [...stored],
                [...refusedOnly.keys()],
                "refused-only relations that are no stored relation of Qti",
              );

              const unwritten = stored.filter(
                (name) => !refusedOnly.has(name) && (counts.get(name) ?? 0) === 0,
              );

              assert.deepStrictEqual(
                unwritten,
                [],
                "stored relations the package writes no row of",
              );
            }).pipe(Effect.scoped),
        ),
      ),
    { timeout: testTimeoutMs },
  );
});
