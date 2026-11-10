/**
 * The completeness check (issue m5-15): which Appendix A rows nothing names, and the committed
 * list of them, each with the issue that owns it.
 *
 * A row is a gap when no exclusion names it, no claim names it and no running test tags it, which
 * is what the ledger reports as `unsupported-with-notice`. {@link gaps} finds them and
 * {@link knownGaps} lists them, and `completeness.test.ts` holds the two equal, so a row cannot
 * become a gap, by deleting or skipping its test, without a diff that names it. At goal close the
 * list is empty.
 *
 * The check is static. The ledger command runs every test with every cache required, and the
 * conformance text cache cannot be fetched in the cloud, so the command cannot run there. This
 * check reads the tags from the test sources instead, as the honesty check does, so it runs with
 * the unit suite and needs no test run; the ledger command still decides `covered` on the laptop,
 * from the tests that passed.
 *
 * @module
 */
import type { Claim } from "#plate/ledger/claims.ts";
import type { Exclusion, Feature } from "#plate/ledger/features.ts";
import { scanTitles } from "#plate/ledger/honesty.ts";
import { tagsOf } from "#plate/ledger/report.ts";

/**
 * What the static completeness check of issue m5-15 reads: the ledger's inputs that decide whether
 * a row is open, with the tests as text because the check runs none.
 */
export interface GapsInput {
  /**
   * The claims, `claims` from `#plate/ledger/claims.ts`. A claim names its row, and the honesty
   * check already refuses a claim no running test backs, so a claimed row needs no second look
   * here.
   */
  readonly claims: readonly Claim[];

  /**
   * The exclusions, `exclusions` from `#plate/ledger/features.ts`.
   */
  readonly exclusions: readonly Exclusion[];

  /**
   * The features file's rows, `features` from `#plate/ledger/features.ts`, in the order
   * {@link gaps} keeps.
   */
  readonly features: readonly Feature[];

  /**
   * Each test file's text, keyed by its path relative to the package directory, such as
   * `src/render.test.ts`. The in-page `*.dom.test.ts` files and the Node-driven
   * `*.browser.test.ts` files count as test files like any other.
   */
  readonly sources: ReadonlyMap<string, string>;
}

/**
 * Find the rows that no exclusion, no claim and no running test names.
 *
 * A test runs when {@link scanTitles} does not read it as skipped, and it tags the rows its title
 * names with `[<ID>]` tokens. A test the scan reads as skipped tags nothing, so skipping the only
 * test of a row makes the row a gap. The check is static, which issue m5-15 requires because the
 * ledger command cannot run in the cloud: it reads the tags the ledger reads from passing tests
 * out of the sources, without running them.
 *
 * @param input The claims, the exclusions, the features and the test sources.
 * @returns The rows nothing names, in the features file's order.
 */
export const gaps = (input: GapsInput): readonly Feature[] => {
  const tagged = new Set(
    [...input.sources.values()]
      .flatMap((source) => scanTitles(source))
      .filter((title) => !title.skipped)
      .flatMap((title) => tagsOf(title.title)),
  );
  const named = new Set([...input.exclusions, ...input.claims].map((entry) => entry.id));

  return input.features.filter((feature) => !named.has(feature.id) && !tagged.has(feature.id));
};

/**
 * A row that the static completeness check of issue m5-15 finds open, and who owns it.
 */
export interface KnownGap {
  /**
   * The open row's Appendix A feature ID.
   */
  readonly id: string;

  /**
   * The issue that proves the row, as the fan-out assigned it: a fan-out issue ID such as
   * `m4-12`, `shipped` for a row proved before the fan-out, or `unassigned` for a row no issue
   * owns.
   */
  readonly owner: string;

  /**
   * Why the row is open, in a sentence.
   */
  readonly reason: string;
}

/**
 * Name a row that its owning issue has not yet closed.
 *
 * @param issue The fan-out issue ID that owns the row.
 * @param id The row's feature ID.
 * @returns The known gap, owned by the issue.
 */
const awaiting = (issue: string, id: string): KnownGap => ({
  id,
  owner: issue,
  reason: `issue ${issue} has not yet landed a running test tagged [${id}]`,
});

/**
 * Name a row that no fan-out issue owns.
 *
 * @param id The row's feature ID.
 * @param name The row's Appendix A name.
 * @returns The known gap, owned by no issue.
 */
const unowned = (id: string, name: string): KnownGap => ({
  id,
  owner: "unassigned",
  reason: `no fan-out issue was assigned [${id}], ${name}, so no running test tags it`,
});

/**
 * The committed list of open rows, in the features file's order, which the test of issue m5-15
 * holds equal to what {@link gaps} finds in the tree, statically and so without a test run.
 *
 * An entry leaves the list when a running test tags its row, or when a claim or an exclusion names
 * it, and the list is empty at goal close. An entry added is a gap a reviewer sees, with its owner
 * and its reason. A claim, an exclusion or a tag added only to empty the list defeats the check.
 */
export const knownGaps: readonly KnownGap[] = [
  awaiting("m4-12", "A-2a"),
  awaiting("m4-02", "A-3a"),
  awaiting("m4-02", "A-3b"),
  awaiting("m5-12", "A-4a"),
  awaiting("m5-12", "A-4b"),
  awaiting("m5-11", "A-5"),
  awaiting("m4-03", "A-6"),
  awaiting("m5-11", "A-7"),
  awaiting("m4-05", "A-8"),
  awaiting("m4-06", "A-9"),
  awaiting("m4-07", "A-10a"),
  awaiting("m5-13", "A-10b"),
  awaiting("m4-08", "A-11"),
  awaiting("m5-11", "A-13a"),
  awaiting("m3e-07", "A-13b"),
  awaiting("m3e-08", "A-15"),
  awaiting("m5-12", "A-17"),
  awaiting("m5-12", "A-20"),
  awaiting("m5-11", "A-22"),
  awaiting("m5-11", "A-23"),
  awaiting("m5-11", "A-24"),
  awaiting("m5-12", "A-26"),
  awaiting("m5-11", "A-28"),
  awaiting("m4-09", "A-29"),
  awaiting("m3e-09", "A-30a"),
  awaiting("m5-12", "A-30b"),
  awaiting("m4-02", "A-35"),
  awaiting("m4-10", "A-36"),
  awaiting("m5-11", "A-37"),
  awaiting("m5-11", "A-38"),
  awaiting("m4-04", "A-40a"),
  awaiting("m4-04", "A-40b"),
  awaiting("m5-13", "A-40c"),
  awaiting("m5-13", "A-40d"),
  awaiting("m5-13", "A-40e"),
  awaiting("m4-04", "A-40f"),
  awaiting("m4-11", "A-41"),
  awaiting("m3e-09", "A-42a"),
  awaiting("m5-12", "A-42b"),
  awaiting("m4-12", "A-44"),
  awaiting("m3e-02", "I-4"),
  awaiting("m5-06", "I-6"),
  awaiting("m5-01", "I-10"),
  awaiting("m3e-01", "I-11"),
  awaiting("m3f-06", "I-12"),
  awaiting("m5-07", "I-13"),
  awaiting("m3e-04", "I-14"),
  awaiting("m3f-08", "I-15"),
  awaiting("m3f-01", "I-16"),
  awaiting("m3e-03", "I-17"),
  awaiting("m3e-05", "I-18"),
  awaiting("m3e-06", "I-20"),
  awaiting("m3f-04", "M-1"),
  awaiting("m3f-04", "M-2"),
  awaiting("m3f-04", "M-3"),
  awaiting("m3f-04", "M-4"),
  awaiting("m3f-04", "M-5"),
  awaiting("m3f-04", "M-6"),
  awaiting("m3f-04", "M-7"),
  awaiting("m3f-04", "M-8"),
  awaiting("m3f-04", "M-9"),
  awaiting("m3f-04", "M-10"),
  awaiting("m3f-03", "P-2"),
  awaiting("m3f-07", "P-3"),
  unowned("P-5", "Manifest Metadata (LOM)"),
  awaiting("m3f-04", "P-6"),
  awaiting("m3f-04", "P-7"),
  awaiting("m3f-07", "P-8"),
  awaiting("m3f-07", "P-9"),
  unowned("P-10", "Learning Tools Interoperability v1.1"),
  awaiting("m3e-02", "P-11"),
  awaiting("m3f-07", "P-12"),
  awaiting("m3f-07", "P-13"),
  awaiting("ei-04", "Q-1"),
  awaiting("ei-17", "Q-3"),
  awaiting("ei-02", "Q-4"),
  awaiting("ei-08", "Q-7"),
  awaiting("m3d-05", "Q-8"),
  awaiting("ei-10", "Q-9"),
  awaiting("m3d-07", "Q-10"),
  awaiting("m3d-09", "Q-11"),
  awaiting("m3d-11", "Q-13"),
  awaiting("ei-03", "Q-14"),
  awaiting("ei-06", "Q-15"),
  awaiting("pci-03", "Q-16"),
  awaiting("ei-12", "Q-17"),
  awaiting("ei-14", "Q-18"),
  awaiting("ei-16", "Q-19"),
  awaiting("ei-01", "Q-21"),
  awaiting("m3f-01", "S-2"),
  awaiting("m3f-02", "S-3"),
  awaiting("m3f-02", "S-4"),
  awaiting("m3e-01b", "S-5"),
  awaiting("m3f-06", "S-6"),
  awaiting("m3f-05", "S-8"),
  awaiting("m3f-03", "S-9"),
  awaiting("m3f-01", "T-2"),
  awaiting("m5-06", "T-3"),
  awaiting("m3f-01", "T-6"),
  awaiting("m5-04", "T-8"),
  awaiting("m5-04", "T-10"),
  awaiting("m3e-01b", "T-13"),
];
