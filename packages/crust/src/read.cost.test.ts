/**
 * The reader's cost is linear in the document: reading a chain of elements, each in a namespace,
 * with an attribute that holds an undeclared reference and an ATTLIST default to apply, costs the
 * same time per element at 10,000, 50,000 and 100,000 levels deep.
 *
 * The gate compares times per element, not times, so a machine's steady load scales every size
 * alike and cancels out: each size's time is the best of its runs, the smaller sizes run more
 * often, and a larger size may cost at most {@link FLAT} times the smallest's per element. A cost
 * per element that grows with depth, such as a walk of the open elements at each tag, grows the
 * 100,000-deep chain's time per element by ten times what it adds to the 10,000-deep one's.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { readXml } from "#crust/read.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 24 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 180_000;

/**
 * The chain depths the gate reads, each with how many times it is read.
 */
const SIZES = [
  { depth: 10_000, runs: 3 },
  { depth: 50_000, runs: 2 },
  { depth: 100_000, runs: 2 },
] as const;

/**
 * The most a larger chain's time per element may be, as a multiple of the smallest's. Measured
 * under a load average of 60 to 80 on 10 cores, the ratios are 0.8 to 1.0, because the smallest
 * chain also pays for warming the code. A walk of the open elements at each tag that costs a few
 * nanoseconds per element walked makes the 100,000-deep chain's ratio about 2.8.
 */
const FLAT = 2;

/**
 * Write a chain of `depth` elements: the root declares a default namespace and a prefix, and every
 * element below it is in the prefix's namespace with an `xml:lang` and an attribute holding an
 * undeclared reference, under a DOCTYPE whose external subset lets the reference stand and whose
 * ATTLIST gives each one a default; the deepest holds the reference as content.
 *
 * @param depth - The elements in the chain.
 * @returns The document's bytes.
 */
const chainOf = (depth: number): Uint8Array =>
  new TextEncoder().encode(
    `<!DOCTYPE a SYSTEM "a.dtd" [<!ATTLIST p:a d CDATA "v">]><a xmlns="urn:x" xmlns:p="urn:p">${'<p:a xml:lang="en" r="&u;">'.repeat(depth - 1)}&u;${"</p:a>".repeat(depth - 1)}</a>`,
  );

/**
 * Read a chain and give the best time per element over the runs.
 *
 * @param size - The depth and the runs.
 * @param size.depth - The elements in the chain.
 * @param size.runs - How many times to read it.
 * @returns The fewest microseconds per element any run took.
 */
const perElement = ({ depth, runs }: { readonly depth: number; readonly runs: number }) =>
  Effect.gen(function* timeChain() {
    const bytes = chainOf(depth);
    let best = Number.POSITIVE_INFINITY;
    for (let run = 0; run < runs; run += 1) {
      const start = performance.now();
      const document = yield* readXml(bytes);
      const took = performance.now() - start;

      assert.strictEqual(document.root.children.length, 1);
      best = Math.min(best, (took * 1000) / depth);
    }

    return best;
  });

describe("the reader's cost", () => {
  it.effect(
    "stays flat per element over chains of 10,000, 50,000 and 100,000 namespaced elements with references and an ATTLIST default",
    () =>
      Effect.gen(function* flatCost() {
        const costs = yield* Effect.all(SIZES.map((size) => perElement(size)));
        const [smallest, ...larger] = costs;
        const shown = SIZES.map(
          ({ depth }, at) => `${depth}: ${(costs[at] ?? 0).toFixed(1)} µs per element`,
        ).join(", ");

        for (const cost of larger) {
          assert.isAtMost(cost, FLAT * (smallest ?? 0), shown);
        }
      }),
    testTimeoutMs,
  );
});
