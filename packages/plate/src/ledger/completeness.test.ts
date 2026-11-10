import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { claims } from "#plate/ledger/claims.ts";
import type { Claim } from "#plate/ledger/claims.ts";
import { gaps, knownGaps } from "#plate/ledger/completeness.ts";
import type { GapsInput } from "#plate/ledger/completeness.ts";
import { exclusions, features } from "#plate/ledger/features.ts";
import type { Exclusion, Feature } from "#plate/ledger/features.ts";

/**
 * The owner table of issue m5-15: each owner and the Appendix A rows it proves, in the order the
 * fan-out lists them. An owner is a fan-out issue ID, `shipped` for the rows proved before the
 * fan-out, or `unassigned` for the rows no issue owns. The two rows the operator excluded, Q-31
 * and Q-32, have no owner and are not listed.
 */
const ownerRows: readonly (readonly [owner: string, rows: string])[] = [
  [
    "shipped",
    "A-1 I-0 I-1 I-2 I-3 I-5 I-7 I-8 I-9a I-9b P-1 P-4 Q-2 Q-5 Q-12 Q-20 S-0 S-7 T-1 T-4 T-7 T-9 T-14",
  ],
  ["m3d-03", "Q-6"],
  ["m3d-05", "Q-8"],
  ["m3d-07", "Q-10"],
  ["m3d-09", "Q-11"],
  ["m3d-11", "Q-13"],
  ["ei-01", "Q-21"],
  ["ei-02", "Q-4"],
  ["ei-03", "Q-14"],
  ["ei-04", "Q-1"],
  ["ei-06", "Q-15"],
  ["ei-08", "Q-7"],
  ["ei-10", "Q-9"],
  ["ei-12", "Q-17"],
  ["ei-14", "Q-18"],
  ["ei-16", "Q-19"],
  ["ei-17", "Q-3"],
  ["pci-03", "Q-16"],
  ["m3e-01", "I-11"],
  ["m3e-01b", "S-5 T-13"],
  ["m3e-02", "I-4 P-11"],
  ["m3e-03", "I-17"],
  ["m3e-04", "I-14"],
  ["m3e-05", "I-18"],
  ["m3e-06", "I-19 I-20"],
  ["m3e-07", "A-13b"],
  ["m3e-08", "A-15"],
  ["m3e-09", "A-30a A-42a"],
  ["m3f-01", "I-16 S-2 T-2 T-6"],
  ["m3f-02", "S-3 S-4"],
  ["m3f-03", "P-2 S-9"],
  ["m3f-04", "M-1 M-2 M-3 M-4 M-5 M-6 M-7 M-8 M-9 M-10 P-6 P-7"],
  ["m3f-05", "S-1 S-8 T-5 T-11 T-12"],
  ["m3f-06", "I-12 S-6"],
  ["m3f-07", "P-3 P-8 P-9 P-12 P-13"],
  ["m3f-08", "I-15"],
  ["m4-02", "A-3a A-3b A-35"],
  ["m4-03", "A-6"],
  ["m4-04", "A-40a A-40b A-40f"],
  ["m4-05", "A-8"],
  ["m4-06", "A-9"],
  ["m4-07", "A-10a"],
  ["m4-08", "A-11"],
  ["m4-09", "A-29"],
  ["m4-10", "A-36"],
  ["m4-11", "A-41"],
  ["m4-12", "A-2a A-44"],
  ["m5-01", "I-10"],
  ["m5-04", "T-8 T-10"],
  ["m5-06", "I-6 T-3"],
  ["m5-07", "I-13"],
  ["m5-10", "A-12 A-16 A-18 A-19 A-21 A-25 A-27 A-31 A-32 A-33 A-34 A-39 A-43 A-45 A-46 A-47"],
  ["m5-11", "A-5 A-7 A-13a A-22 A-23 A-24 A-28 A-37 A-38"],
  ["m5-12", "A-4a A-4b A-17 A-20 A-26 A-30b A-42b"],
  ["m5-13", "A-10b A-40c A-40d A-40e"],
  ["m5-14", "A-2b"],
  ["unassigned", "P-5 P-10"],
];

/**
 * Every owner the owner table names.
 */
const owners: ReadonlySet<string> = new Set(ownerRows.map(([owner]) => owner));

/**
 * The owner of each row the owner table assigns, by the row's ID.
 */
const ownerOf: ReadonlyMap<string, string> = new Map(
  ownerRows.flatMap(([owner, rows]) => rows.split(" ").map((id) => [id, owner] as const)),
);

/**
 * Build a Question row for a hand-built input. Every row of these inputs is a Question row, so a
 * tag such as `[Q-1]` is one the ledger reads.
 *
 * @param id The row's ID.
 * @returns The row.
 */
const row = (id: string): Feature => ({
  elevated: false,
  family: "Q",
  id,
  level: "elective",
  name: `Question ${id}`,
});

/**
 * A claim on Q-1.
 */
const claimOnQ1: Claim = { id: "Q-1", source: "a member-only source, for the test" };

/**
 * An exclusion of Q-1.
 */
const exclusionOfQ1: Exclusion = {
  id: "Q-1",
  reason: "excluded, for the test",
  source: "a scope decision, for the test",
};

/**
 * A test file that tags Q-1 in a test that runs.
 */
const runningSource = 'it("[Q-1] proves the row", () => {});';

/**
 * A test file that tags Q-1 only in a test that is skipped.
 */
const skippedSource = 'it.skip("[Q-1] proves the row", () => {});';

/**
 * An input with Q-1 as its only row and nothing that names it, which each test adds to.
 */
const bare: GapsInput = {
  claims: [],
  exclusions: [],
  features: [row("Q-1")],
  sources: new Map(),
};

/**
 * The package's source directory, `src/`.
 */
const sourceDirectory = fileURLToPath(new URL(".", import.meta.resolve("#plate/index.ts")));

/**
 * Every `*.test.ts` file under `src/`, the in-page `*.dom.test.ts` files included, keyed by its
 * path relative to the package directory, as `honesty.test.ts` reads them.
 */
const packageSources: ReadonlyMap<string, string> = new Map(
  readdirSync(sourceDirectory, { recursive: true })
    .map((entry) => String(entry).split("\\").join("/"))
    .filter((entry) => entry.endsWith(".test.ts"))
    .toSorted()
    .map((entry) => [`src/${entry}`, readFileSync(`${sourceDirectory}${entry}`, "utf-8")]),
);

/**
 * The IDs of the rows `gaps` finds.
 *
 * @param input What `gaps` reads.
 * @returns Their IDs, in the order `gaps` gives them.
 */
const gapIds = (input: GapsInput): readonly string[] => gaps(input).map((gap) => gap.id);

describe("ledger/completeness.ts", () => {
  it("[ledger] a row tagged by a running test is no gap", () => {
    assert.deepStrictEqual(
      gapIds({ ...bare, sources: new Map([["src/choice.test.ts", runningSource]]) }),
      [],
    );
  });

  it("[ledger] a row tagged only by a skipped test is a gap", () => {
    assert.deepStrictEqual(
      gapIds({ ...bare, sources: new Map([["src/choice.test.ts", skippedSource]]) }),
      ["Q-1"],
    );
  });

  it("[ledger] a claimed row is no gap", () => {
    assert.deepStrictEqual(gapIds({ ...bare, claims: [claimOnQ1] }), []);
  });

  it("[ledger] an excluded row is no gap", () => {
    assert.deepStrictEqual(gapIds({ ...bare, exclusions: [exclusionOfQ1] }), []);
  });

  it("[ledger] a tag in an in-page test counts as a tag in a unit test", () => {
    const inPage = gapIds({
      ...bare,
      sources: new Map([["src/interactions/choice.dom.test.ts", runningSource]]),
    });
    const inUnit = gapIds({
      ...bare,
      sources: new Map([["src/interactions/choice.test.ts", runningSource]]),
    });

    assert.deepStrictEqual(inPage, []);
    assert.deepStrictEqual(inPage, inUnit);
  });

  it("[ledger] gaps keep the features file's order", () => {
    assert.deepStrictEqual(gapIds({ ...bare, features: [row("Q-3"), row("Q-1"), row("Q-2")] }), [
      "Q-3",
      "Q-1",
      "Q-2",
    ]);
  });

  it("[ledger] the tree's gaps are exactly the known gaps", () => {
    const found = gapIds({ claims, exclusions, features, sources: packageSources });
    const known = knownGaps.map((gap) => gap.id);
    const unlisted = found.filter((id) => !known.includes(id));
    const closed = known.filter((id) => !found.includes(id));

    assert.deepStrictEqual(
      unlisted,
      [],
      `These rows have no exclusion, no claim and no running tagged test, and knownGaps does not list them: ${unlisted.join(", ")}. Restore the test that tagged each, or list it in knownGaps with its owner and why it is open.`,
    );
    assert.deepStrictEqual(
      closed,
      [],
      `knownGaps lists rows that a test, a claim or an exclusion now names: ${closed.join(", ")}. Remove each from knownGaps.`,
    );
    assert.deepStrictEqual(
      known,
      found,
      "knownGaps holds the tree's gaps but not in the features file's order. List them in that order.",
    );
  });

  it("[ledger] every known gap names an owner from the owner table and a reason", () => {
    for (const gap of knownGaps) {
      assert.isTrue(
        owners.has(gap.owner),
        `${gap.id} names the owner "${gap.owner}", which the owner table does not have. Name a fan-out issue ID, "shipped" or "unassigned".`,
      );
      assert.strictEqual(
        gap.owner,
        ownerOf.get(gap.id),
        `${gap.id} names the owner "${gap.owner}", and the owner table gives it to "${ownerOf.get(gap.id) ?? "no one"}".`,
      );
      assert.isAbove(
        gap.reason.trim().length,
        0,
        `${gap.id} has an empty reason. Say why the row is open.`,
      );
    }
  });

  it("[ledger] no known gap names an excluded or claimed row", () => {
    const named = new Set([...exclusions, ...claims].map((entry) => entry.id));

    assert.deepStrictEqual(
      knownGaps.filter((gap) => named.has(gap.id)).map((gap) => gap.id),
      [],
      "knownGaps lists a row that an exclusion or a claim already names. A named row is no gap: remove it from knownGaps.",
    );
  });
});
