/**
 * An item whose body nests elements far past any bound a reader sets imports and exports whole,
 * in time linear in its depth: XML 1.0 bounds no element's depth (productions [39] and [43]),
 * QTI 3.0's XSD lets a `div` hold a `div` without end, and spec reading 1 refuses nothing valid,
 * so crust reads any depth (the operator's ruling of 2026-11-05) and every step after it walks its
 * own stack.
 *
 * The import is {@link readProgram}, everything it does before the database: the package read,
 * each document shredded, its ids minted and every row built. The export is everything it does
 * after: the rows the import writes for the item's tree (`flatten`, as `documentRowsOf` writes
 * them) assembled back into the tree, and `unshred`'s bytes. The database's own write and scan of
 * such an item are `export/package.db.test.ts`'s.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { assemble } from "#pantry/model/assemble.ts";
import { namesOf } from "#pantry/model/composed.ts";
import { unshred } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { deepItem, deepItemPath, deepManifest } from "#pantry/test/deep-item.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";

/**
 * The names the export writes every document under: the installed grammar's.
 */
const names = namesOf(grammar);

/**
 * The elements on the path from `root` through each last child that is an element.
 *
 * @param root - The element the path starts at.
 * @returns How many elements the path holds, `root` included.
 */
const lastChildDepth = (root: Element): number => {
  let depth = 1;
  for (let child = root.children.at(-1); child?.kind === "element"; child = child.children.at(-1)) {
    depth += 1;
  }

  return depth;
};

/**
 * Import a package of one item nested `divs` divs deep, export the item from the rows the import
 * writes for it, and read the export back.
 *
 * @param divs - The divs in the item's chain.
 * @returns The source's canonical form, the export's, and how many elements deep the export's
 *   text stands.
 */
const roundTrip = (divs: number) =>
  Effect.gen(function* importExport() {
    const source = deepItem(divs);
    const dir = yield* scopedPackage(
      new Map([
        [manifestPath, deepManifest],
        [deepItemPath, source],
      ]),
    );
    const program = yield* readProgram(dir);
    const placed = program.documents.find(({ listed }) => listed.path === deepItemPath);
    if (placed === undefined) {
      return assert.fail(`The import lists no ${deepItemPath}.`);
    }

    const assembled = yield* Effect.fromResult(
      assemble(flatten(placed.listed.tree, placed.ids.idOf)),
    );
    const exported = yield* readXml(yield* unshred(assembled, names));

    return {
      depth: lastChildDepth(exported.root),
      exported: canonicalize(exported),
      source: canonicalize(yield* readXml(source)),
    };
  }).pipe(Effect.scoped, Effect.provide(NodeServices.layer));

/**
 * The chain lengths the round trip is checked at: 1; 253 to 256, which open 255 to 258 elements,
 * either side of the 256 crust once refused past and of libxml2's 257; and 1,000 and 10,000.
 */
const DEPTHS = [1, 253, 254, 255, 256, 1000, 10_000] as const;

/**
 * Which side of the old bound of 256 open elements an item's text stands on.
 */
type DepthSide = "at most 256" | "past 256";

/**
 * The chain lengths the cost gate reads, each with how many times it is read.
 */
const SIZES = [
  { divs: 2000, runs: 3 },
  { divs: 16_000, runs: 2 },
] as const;

/**
 * The most the longer chain's time per element may be, as a multiple of the shorter's. Measured
 * 2026-11-08 in four runs at a load average of 33 to 49: 2,000 divs cost 211, 154, 129 and 70 µs
 * per element and 16,000 divs 213, 162, 108 and 49 µs, ratios of 0.70 to 1.05. A step that walks
 * the open elements at each element, at k ns per element walked, adds k · d / 2 ns per element at
 * depth d, so the ratio passes 2 once 3 · k · 2,000 ns passes the shorter chain's cost per element:
 * past about 20 ns per element walked.
 */
const FLAT = 2;

/**
 * Time the round trip of one chain length.
 *
 * @param size - The chain length and the runs.
 * @param size.divs - The divs in the chain.
 * @param size.runs - How many times it is read.
 * @returns The fewest microseconds per element any run took.
 */
const perElement = ({ divs, runs }: { readonly divs: number; readonly runs: number }) =>
  Effect.gen(function* timeChain() {
    let best = Number.POSITIVE_INFINITY;
    for (let run = 0; run < runs; run += 1) {
      const start = performance.now();
      const { depth } = yield* roundTrip(divs);
      const took = performance.now() - start;

      assert.strictEqual(depth, divs + 2);
      best = Math.min(best, (took * 1000) / divs);
    }

    return best;
  });

describe("an item nested past any reader's bound", () => {
  it.effect(
    `imports and exports to its own canonical form at every chain length of ${DEPTHS.join(", ")} divs, exhausted`,
    (ctx) =>
      // Oracle: a universal one, the round trip, import then export, gives back the source's
      // canonical form; and spec reading 1, as the item is valid at every depth, so the import
      // refuses none. Bound: the chain lengths of DEPTHS, one item each.
      searched(
        ctx,
        exhaust(
          {
            box: `one item nested ${DEPTHS.join(", ")} divs deep`,
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<DepthSide>(["at most 256", "past 256"]),
            generator: element(DEPTHS),
            limit: DEPTHS.length,
            literal: Formatter.format,
            oracle: {
              kind: "universal",
              name: "import then export gives back the source's canonical form",
            },
            suite: "import/depth/round-trip",
          },
          (divs, c) =>
            Effect.gen(function* holdsTheRoundTrip() {
              c.note(divs + 2 <= 256 ? "at most 256" : "past 256");

              const { depth, exported, source } = yield* roundTrip(divs);

              assert.strictEqual(depth, divs + 2);
              assert.deepStrictEqual(exported, source, `${String(divs)} divs`);
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, DEPTHS.length);
          }),
        ),
      ),
  );

  it.effect(
    `stays flat per element from ${String(SIZES[0].divs)} to ${String(SIZES[1].divs)} divs deep, import and export together`,
    () =>
      // Oracle: a linear cost model, the time per element the same at any depth, to within FLAT.
      // Bound: chains of 2,000 and 16,000 divs, the shorter read three times, the longer twice.
      Effect.gen(function* flatCost() {
        const shorter = yield* perElement(SIZES[0]);
        const longer = yield* perElement(SIZES[1]);
        const shown = `${String(SIZES[0].divs)}: ${shorter.toFixed(1)} µs, ${String(SIZES[1].divs)}: ${longer.toFixed(1)} µs per element`;

        assert.isAtMost(longer, FLAT * shorter, shown);
      }),
  );
});
