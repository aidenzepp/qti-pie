/**
 * The LOM records of `simple`'s resource and of its image file, judged by the law oracle: the
 * resource's own record names the item's identifier and title or breaks `LomObjectIdentifier` and
 * `LomObjectTitle` (spec reading 62), and the file's record, which describes the file, breaks
 * nothing whatever it names (`lom-records.ts`). The database's side is
 * `import/lom-records.db.test.ts`.
 *
 * Oracle: the case as written, which says which record names what, so no expected verdict is
 * computed by the oracle's own selection of records.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { fileRecords, namings, recordPackageOf } from "#pantry/test/lom-records.ts";
import type { RecordCase } from "#pantry/test/lom-records.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * Every case of the box: what the resource's record names for each, by the file's record.
 */
const recordCases: Gen<RecordCase> = (source) => ({
  file: source.draw(element(fileRecords)),
  identifier: source.draw(element(namings)),
  title: source.draw(element(namings)),
});

/**
 * A situation the box must reach.
 */
type RecordSituation =
  | "a file's title not the item's, the resource's the item's"
  | "a file's identifier not the item's, the resource's the item's"
  | "the resource's title not the item's"
  | "the resource's identifier not the item's";

/**
 * The situations a case reaches.
 *
 * @param drawn - The case.
 * @returns Its situations.
 */
const situationsOf = (drawn: RecordCase): readonly RecordSituation[] => [
  ...(drawn.title === "the item's" && (drawn.file === "title" || drawn.file === "both")
    ? (["a file's title not the item's, the resource's the item's"] as const)
    : []),
  ...(drawn.identifier === "the item's" && (drawn.file === "identifier" || drawn.file === "both")
    ? (["a file's identifier not the item's, the resource's the item's"] as const)
    : []),
  ...(drawn.title === "another" ? (["the resource's title not the item's"] as const) : []),
  ...(drawn.identifier === "another"
    ? (["the resource's identifier not the item's"] as const)
    : []),
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/oracle.ts, the LOM records that name an item",
  (it) => {
    it.effect(
      "breaks LomObjectIdentifier and LomObjectTitle exactly where the resource's own record names another, never for a file's",
      (ctx) =>
        // Oracle: the case as written. Bound: the resource's identifier and title each the item's
        // or another, by the file's record none, a title, an identifier or both, 16 packages.
        Effect.gen(function* recordBox() {
          const base = yield* readPackage(yield* materialize("simple"));

          return yield* searched(
            ctx,
            exhaust(
              {
                box: "simple's resource record naming the item's identifier and title or another, by its image file's record",
                caseHang: Duration.seconds(30),
                coverage: requiredInSpace<RecordSituation>([
                  "a file's title not the item's, the resource's the item's",
                  "a file's identifier not the item's, the resource's the item's",
                  "the resource's title not the item's",
                  "the resource's identifier not the item's",
                ]),
                generator: recordCases,
                limit: 20,
                literal: (drawn) => JSON.stringify(drawn),
                oracle: {
                  kind: "specification",
                  name: "spec reading 62 (QTI 3.0 Metadata §2.7.1.1 and §2.7.1.2) over the resource's own record, and IMS Content Packaging 1.2 §6.7 (Metadata) and §6.6.3 (File)",
                },
                suite: "test/lom-records",
              },
              (drawn: RecordCase, c) =>
                Effect.gen(function* recordCase() {
                  for (const situation of situationsOf(drawn)) {
                    c.note(situation);
                  }

                  const judgment = yield* judge(recordPackageOf(base, drawn), grammar, laws);
                  const expected: LawName[] = [
                    ...(drawn.identifier === "another" ? (["LomObjectIdentifier"] as const) : []),
                    ...(drawn.title === "another" ? (["LomObjectTitle"] as const) : []),
                  ];

                  assert.deepStrictEqual(
                    judgment._tag === "Judged"
                      ? [...new Set(judgment.breaches.map(({ law }) => law))].toSorted()
                      : judgment,
                    expected,
                    JSON.stringify(drawn),
                  );
                }),
            ),
          );
        }),
      240_000,
    );
  },
);
