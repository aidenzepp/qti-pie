/**
 * Inclusion cycles through `rtest01`'s fragment, judged by the law oracle, by the keys the
 * import's rows break (`key-breaches.ts`), and by every law the host judges over those rows
 * (`host-judge.ts`): a cycle is refused by "Inclusion cycle" alone, since the import cuts it where
 * it closes and no instance repeats a document, whose placements would break the assembly's keys
 * (a binding per response, a hottext per identifier) before the cycle's law. A cycle no item
 * places, and a fragment only that cycle places, are in no assembly at all, which
 * `TestDocument.instances` refuses under the same law (spec readings 85 and 117). The database's
 * side is `import/inclusion-cycles.db.test.ts`.
 *
 * Oracle: the inclusion graph as each case writes it, a cycle or none, so no expected verdict is
 * computed by the import's walk or the oracle's.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter, Option, Predicate, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { lawNameOf } from "#pantry/import/refusal.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { cyclePackageOf, cycles, includerCounts, tails } from "#pantry/test/inclusion-cycles.ts";
import type { CycleCase } from "#pantry/test/inclusion-cycles.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { datumText } from "#pantry/test/predicates.ts";
import { hostRowsOf, judge as judgeRows, judgedLaws } from "#pantry/test/host-judge.ts";
import { keyBreachesOf } from "#pantry/test/key-breaches.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 42 s at a load average of 68 to 108,
 * its slowest test.
 */
const testTimeoutMs = 240_000;

/**
 * The composed grammar every case is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * Every law the host judges, read once.
 */
const hostLaws = judgedLaws(Qti);

/**
 * Every case of the box: each cycle by each count of set items that include the fragment, with
 * and without the tail.
 */
const cycleCases: Gen<CycleCase> = (source) => ({
  cycle: source.draw(element(cycles)),
  includers: source.draw(element(includerCounts)),
  tail: source.draw(element(tails)),
});

/**
 * A situation the box must reach.
 */
type CycleSituation =
  | "no cycle"
  | "the fragment includes itself"
  | "the fragment and a text fragment include each other"
  | "three items place the cycle"
  | "no item places the cycle"
  | "a fragment hangs off the cycle";

/**
 * The situation each cycle reaches.
 */
const situationOf: Readonly<Record<CycleCase["cycle"], CycleSituation>> = {
  none: "no cycle",
  pair: "the fragment and a text fragment include each other",
  self: "the fragment includes itself",
};

/**
 * Read a case's package through the import's reader, its files written to a scratch folder: the
 * keys its rows break, each as its law and relation name it; the laws the host judges its rows to
 * break, by name, beside each one's identity; and the documents no assembly places.
 *
 * @param files - The case's entries.
 * @returns The keys, the laws and the documents.
 */
const rowsOfCase = (files: readonly PackageFile[]) =>
  Effect.scoped(
    Effect.gen(function* readCase() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* scratchDirectory("inclusion-cycles-");
      for (const file of files) {
        yield* fs.makeDirectory(path.dirname(`${dir}/${file.path}`), { recursive: true });
        yield* fs.writeFile(`${dir}/${file.path}`, file.bytes);
      }

      const program = yield* readProgram(dir);
      const rows = hostRowsOf(program.inputs);
      const { broken } = judgeRows(rows, hostLaws);
      const paths = new Map(
        (rows.get("Document") ?? []).map(({ node, path: entry }) => [node, entry] as const),
      );
      const placed = new Set((rows.get("Instance") ?? []).map(({ document }) => document));

      return {
        keys: keyBreachesOf(program.inputs).map(
          ({ fields, law, relation }) => `${law}: ${relation}(${fields.join(", ")})`,
        ),
        laws: broken.map(({ law }) => Formatter.format(law)),
        rules: [...new Set(broken.flatMap(({ law }) => Option.toArray(lawNameOf(law))))],
        unplaced: (rows.get("TestDocument") ?? []).flatMap(({ node }) => {
          const entry = paths.get(node);

          return placed.has(node) ? [] : [Predicate.isString(entry) ? entry : datumText(node)];
        }),
      };
    }),
  );

layer(NodeServices.layer, { excludeTestServices: true })(
  "an inclusion cycle, refused by its own law alone",
  (it) => {
    it.effect(
      "breaks Inclusion cycle alone, and no key, exactly where the fragments include a document on their chain, whether or not an item places it",
      (ctx) =>
        // Oracle: the case's inclusion graph. Bound: no cycle, a self-inclusion and a two-fragment
        // cycle, each placed by none to three set items, each with and without a tail fragment the
        // fragment alone includes: 24 packages of `rtest01`.
        Effect.gen(function* cycleBox() {
          const base = yield* readPackage(yield* materialize("rtest01"));

          return yield* searched(
            ctx,
            exhaust(
              {
                box: "rtest01 with no cycle, its fragment including itself, or it and a text fragment including each other, placed by 0 to 3 set items, with and without a tail fragment",
                caseHang: Duration.seconds(30),
                coverage: requiredInSpace<CycleSituation>([
                  "no cycle",
                  "the fragment includes itself",
                  "the fragment and a text fragment include each other",
                  "three items place the cycle",
                  "no item places the cycle",
                  "a fragment hangs off the cycle",
                ]),
                generator: cycleCases,
                limit: 30,
                literal: (drawn) => JSON.stringify(drawn),
                oracle: {
                  kind: "specification",
                  name: "XInclude 1.0 §4.5 (an inclusion loop is a fatal error) and spec reading 85, over the case's inclusion graph",
                },
                suite: "test/inclusion-cycles",
              },
              (drawn: CycleCase, c) =>
                Effect.gen(function* cycleCase() {
                  const cyclic = drawn.cycle !== "none";
                  c.note(situationOf[drawn.cycle]);
                  if (cyclic && drawn.includers === 3) {
                    c.note("three items place the cycle");
                  }

                  if (cyclic && drawn.includers === 0) {
                    c.note("no item places the cycle");
                  }

                  if (cyclic && drawn.tail) {
                    c.note("a fragment hangs off the cycle");
                  }

                  const files = cyclePackageOf(base, drawn);
                  const judgment = yield* judge(files, grammar, laws);

                  assert.deepStrictEqual(
                    judgment._tag === "Judged"
                      ? [...new Set(judgment.breaches.map(({ law }) => law))]
                      : judgment,
                    cyclic ? ["Inclusion cycle"] : [],
                    `${JSON.stringify(drawn)}: the oracle's breaches`,
                  );

                  const read = yield* rowsOfCase(files);
                  assert.deepStrictEqual(
                    read.keys,
                    [],
                    `${JSON.stringify(drawn)}: the keys the import's rows break`,
                  );
                  assert.deepStrictEqual(
                    read.rules,
                    cyclic ? ["Inclusion cycle"] : [],
                    `${JSON.stringify(drawn)}: the laws the import's rows break, ${read.laws.join("; ") || "none"}; documents no assembly places: ${read.unplaced.join(", ") || "none"}`,
                  );
                }).pipe(Effect.provide(NodeServices.layer)),
            ),
          );
        }),
      testTimeoutMs,
    );
  },
);
