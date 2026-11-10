/**
 * The reader's cost is linear in the document: reading chains at the reader's depth bound, each
 * element in a namespace, with an attribute that holds an undeclared reference and an ATTLIST
 * default to apply, costs the same time per element at about 10,000, 50,000 and 100,000 elements.
 *
 * The gate compares times per element, not times, so a machine's steady load scales every size
 * alike and cancels out: each size's time is the best of its runs, the smaller sizes run more
 * often, and a larger size may cost at most {@link FLAT} times the smallest's per element. A cost
 * per element that grows with the document, such as a line and column found from the text's start
 * at each tag, grows the 100,000-element document's time per element by ten times what it adds to
 * the 10,000-element one's.
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
 * The levels of each chain below the root: with the root, the 256 open elements the reader reads.
 */
const CHAIN = 255;

/**
 * The documents the gate reads, by how many chains the root holds, each with how many times it is
 * read: about 10,000, 50,000 and 100,000 elements.
 */
const SIZES = [
  { chains: 40, runs: 3 },
  { chains: 196, runs: 2 },
  { chains: 392, runs: 2 },
] as const;

/**
 * The most a larger document's time per element may be, as a multiple of the smallest's. Measured
 * on 2026-11-10 under a load average near 24 on 10 cores, the ratios are 0.6 to 0.9, because the
 * smallest document also pays for warming the code. Finding each start tag's line from the text's
 * start, a backward scan to the last line break before it, ran the gate past ten minutes there.
 */
const FLAT = 2;

/**
 * Write a document of `chains` chains of {@link CHAIN} elements under one root: the root declares a
 * default namespace and a prefix, and every element below it is in the prefix's namespace with an
 * `xml:lang` and an attribute holding an undeclared reference, under a DOCTYPE whose external
 * subset lets the reference stand and whose ATTLIST gives each one a default; the deepest of each
 * chain holds the reference as content.
 *
 * @param chains - The chains under the root.
 * @returns The document's bytes.
 */
const documentOf = (chains: number): Uint8Array =>
  new TextEncoder().encode(
    `<!DOCTYPE a SYSTEM "a.dtd" [<!ATTLIST p:a d CDATA "v">]><a xmlns="urn:x" xmlns:p="urn:p">${`${'<p:a xml:lang="en" r="&u;">'.repeat(CHAIN)}&u;${"</p:a>".repeat(CHAIN)}`.repeat(chains)}</a>`,
  );

/**
 * Read a document and give the best time per element over the runs.
 *
 * @param size - The chains and the runs.
 * @param size.chains - The chains under the root.
 * @param size.runs - How many times to read it.
 * @returns The fewest microseconds per element any run took.
 */
const perElement = ({ chains, runs }: { readonly chains: number; readonly runs: number }) =>
  Effect.gen(function* timeDocument() {
    const bytes = documentOf(chains);
    const elements = 1 + CHAIN * chains;
    let best = Number.POSITIVE_INFINITY;
    for (let run = 0; run < runs; run += 1) {
      const start = performance.now();
      const document = yield* readXml(bytes);
      const took = performance.now() - start;

      assert.strictEqual(document.root.children.length, chains);
      best = Math.min(best, (took * 1000) / elements);
    }

    return best;
  });

describe("the reader's cost", () => {
  it.effect(
    "stays flat per element over 10,000, 50,000 and 100,000 namespaced elements, in chains at the depth bound, with references and an ATTLIST default",
    () =>
      Effect.gen(function* flatCost() {
        const costs = yield* Effect.all(SIZES.map((size) => perElement(size)));
        const [smallest, ...larger] = costs;
        const shown = SIZES.map(
          ({ chains }, at) =>
            `${1 + CHAIN * chains}: ${(costs[at] ?? 0).toFixed(1)} µs per element`,
        ).join(", ");

        for (const cost of larger) {
          assert.isAtMost(cost, FLAT * (smallest ?? 0), shown);
        }
      }),
    testTimeoutMs,
  );
});
