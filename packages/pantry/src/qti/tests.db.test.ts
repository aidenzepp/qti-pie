/**
 * The test layer's laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): each
 * refused state is one the law's model refuses, named by the constraint the law installs.
 *
 * Every case states one row no stored node names, through the one direct writer
 * (`#pantry/test/direct-sql.ts`; grizzle's README, "Direct SQL access"): the author login, `SET
 * ROLE` to the author role, at SERIALIZABLE, every foreign key deferred. A role writes a table,
 * never its own view of it, which it holds SELECT on alone (README, "Security model"). A row CHECK
 * is judged as the row is inserted, before any deferred key, so its SQLSTATE (23514) and its
 * constraint, the check's name, are the verdict. The transaction rolls back. The rows below are
 * none of a family's members, so no hidden column of grizzle's needs filling: `SectionSelection`,
 * `TestToken`, `TestFlag` and `Section`, an owner whose drawn count and fold end are its own
 * columns, which the case states; each row fills its table's written columns, or the case fails
 * before any statement runs. An href's own laws are `#pantry/qti/package.ts`'s, judged in
 * `package.db.test.ts`.
 *
 * The cases over whole packages need the importer's ChangeSet (Q5.15), and are listed for it and
 * for the network seat's probe:
 *
 * - A test whose section ref names a section document that refs it back is refused by
 *   `Instance(document, rootKind, children) → TestDocument(node, rootKind, sites)` (Inclusion
 *   cycle); the same test with the cycle cut is accepted;
 * - A section document placed twice in one test is accepted, and an item ref of the test that shares
 *   an identifier with a section of the placed document is refused by `key(AssembledName, assembly,
 *   identifier)` (Test name key);
 * - A branch rule on an item ref naming the item ref after it is accepted; one naming the item ref
 *   before it is refused by `Branch_forward` unless their section's `qti-ordering` shuffles, and
 *   one naming its own owner or its section is refused by `Branch_forward` either way; one naming
 *   an item ref under a selection with replacement is refused by `Branch_target`;
 * - An item ref whose href names no entry is refused by `ReferencePath(package, path) →
 *   Entry(package, path)`, and a section ref whose href names an item document by the site's
 *   containment into the section documents;
 * - A section holding three parts, two of them required, under a selection of `select="1"` is refused
 *   by `Selection_required`, and under `select="2"` accepted.
 */
import { layer } from "@effect/vitest";
import { Effect } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { Section, SectionSelection, TestFlag, TestToken } from "#pantry/qti/tests.ts";
import { assertVerdict, judged, loginSession, statedInserts } from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * Uuids no stored row holds: the node, its document and its parent.
 */
const stray = {
  document: "00000000-0000-4000-8000-0000000013d0",
  node: "00000000-0000-4000-8000-0000000013f0",
  parent: "00000000-0000-4000-8000-0000000013e0",
} as const;

/**
 * A node's tuple as an overlay copies it (C18), for a node of one kind.
 *
 * @param kind - The node's kind.
 * @returns The tuple's fields.
 */
const tupleOf = (kind: string) =>
  ({
    document: stray.document,
    kind,
    nearest: stray.document,
    node: stray.node,
    parent: stray.parent,
    start: 3n,
    version: "3.0.1",
  }) satisfies Stated["fact"];

/**
 * A selection of `select` over a section of `members` parts, `required` of them required.
 *
 * @param fields - The case's counts and flag.
 * @param fields.members - The section's parts.
 * @param fields.required - Its required parts.
 * @param fields.select - The selection's `select`, written plainly.
 * @param fields.withReplacement - Its `with-replacement`.
 * @param fields.split - The selection's `select` as written, by default its integer alone.
 * @returns The fact.
 */
const selection = ({
  members,
  required,
  select,
  split = { lead: "", lexical: String(select), trail: "" },
  withReplacement,
}: {
  readonly members: bigint;
  readonly required: bigint;
  readonly select: number;
  readonly split?: { readonly lead: string; readonly lexical: string; readonly trail: string };
  readonly withReplacement: boolean;
}): Stated => ({
  fact: {
    ...tupleOf("qti-selection"),
    members,
    required,
    selectForm: String(select),
    selectLead: split.lead,
    selectLexical: split.lexical,
    selectTrail: split.trail,
    withReplacement,
  },
  relation: SectionSelection,
});

/**
 * A section under a test part whose scope its own laws accept, its parts counted `members`, none of
 * which the case writes.
 *
 * @param members - The parts' count.
 * @returns The fact.
 */
const sectionOf = (members: bigint): Stated => ({
  fact: {
    ...tupleOf("qti-assessment-section"),
    keepTogether: true,
    looseChain: false,
    members,
    mixes: false,
    parentKind: "qti-test-part",
    parentLooseChain: false,
    parentMixes: false,
    part: stray.parent,
    replaced: false,
    replacing: false,
    required: 0n,
    shuffle: false,
    visible: true,
    withReplacement: false,
  },
  relation: Section,
});

describe.skipIf(!hasLease)("qti/tests.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer, { timeout: authorLayerHookTimeoutMs })(
    "the test layer's laws, judged by PostgreSQL",
    (it) => {
      it.effect(
        "accepts a selection of exactly its section's parts, and refuses one over unless it is with replacement, by Selection_bound",
        () =>
          // Oracle: PostgreSQL, the `selection_bound` CHECK; reading 79 says which states it holds.
          // Bound: select at members and at members + 1, with and without replacement, members 3.
          Effect.gen(function* selectionBound() {
            const client = yield* loginSession;
            const at = { members: 3n, required: 0n, select: 3, withReplacement: false } as const;
            for (const [label, stated, refused] of [
              ["select = members", selection(at), false],
              ["select = members + 1", selection({ ...at, select: 4 }), true],
              [
                "select = members + 1 with replacement",
                selection({ ...at, select: 4, withReplacement: true }),
                false,
              ],
            ] as const) {
              assertVerdict(
                yield* judged(client, statedInserts([stated])),
                "selection_bound",
                refused,
                label,
              );
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a selection that selects fewer parts than its section's required parts, by Selection_required",
        () =>
          // Oracle: PostgreSQL, the `selection_required` CHECK; info §4.2.2 says which states it
          // holds. Bound: two required parts of three, under select 2 and select 1.
          Effect.gen(function* selectionRequired() {
            const client = yield* loginSession;
            const base = { members: 3n, required: 2n, withReplacement: false } as const;
            for (const [label, select, refused] of [
              ["select = required", 2, false],
              ["select = required − 1", 1, true],
            ] as const) {
              assertVerdict(
                yield* judged(client, statedInserts([selection({ ...base, select })])),
                "selection_required",
                refused,
                label,
              );
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a selection whose select is not its lexical form's integer, by E1_derived",
        () =>
          // Oracle: PostgreSQL, the `e_1_derived` CHECK (`selectLexical = lead ‖ form ‖ trail`).
          // Bound: a padded form split right, and the same form with its lead dropped.
          Effect.gen(function* selectSplit() {
            const client = yield* loginSession;
            const padded = {
              members: 3n,
              required: 0n,
              select: 2,
              withReplacement: false,
            } as const;
            for (const [label, lead, refused] of [
              ["a padded select split around its integer", " ", false],
              ["a split that drops the lead", "", true],
            ] as const) {
              assertVerdict(
                yield* judged(
                  client,
                  statedInserts([
                    selection({ ...padded, split: { lead, lexical: " 2\t", trail: "\t" } }),
                  ]),
                ),
                "e_1_derived",
                refused,
                label,
              );
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "accepts a token split around its collapsed value and a flag read from its form, and refuses either written otherwise, by E1_derived",
        () =>
          // Oracle: PostgreSQL, each relation's `e_1_derived` CHECK; XML Schema Part 2 §4.3.6
          // (collapse) and §3.2.2.1 (boolean) say which states it holds. Bound: one right and one
          // wrong row each.
          Effect.gen(function* tokensAndFlags() {
            const client = yield* loginSession;
            const token = {
              lead: " ",
              lexical: " Q01 ",
              name: "identifier",
              node: stray.node,
              trail: " ",
              value: "Q01",
            };
            const flag = {
              kind: "qti-assessment-section",
              lexical: " 1 ",
              name: "visible",
              node: stray.node,
              parentKind: "qti-test-part",
              value: true,
            };
            for (const [label, stated, refused] of [
              ["a token split around its value", { fact: token, relation: TestToken }, false],
              [
                "a value with whitespace at its start",
                { fact: { ...token, lead: "", value: " Q01" }, relation: TestToken },
                true,
              ],
              ["1 read as true", { fact: flag, relation: TestFlag }, false],
              ["1 read as false", { fact: { ...flag, value: false }, relation: TestFlag }, true],
            ] as const) {
              assertVerdict(
                yield* judged(client, statedInserts([stated])),
                "e_1_derived",
                refused,
                label,
              );
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "accepts a section that holds no part, and one that holds one (spec reading 26)",
        () =>
          // Oracle: the information model's §4.2.15, a section's `sectionPart` of multiplicity
          // [0..unbounded], and both XSDs' minOccurs="0" (spec reading 26): no CHECK of `section`
          // reads its count of parts.
          // Bound: members 0 and 1, each accepted.
          Effect.gen(function* sectionParts() {
            const client = yield* loginSession;

            for (const members of [0n, 1n]) {
              assertVerdict(
                yield* judged(client, statedInserts([sectionOf(members)])),
                "",
                false,
                `a section of ${String(members)} parts`,
              );
            }
          }).pipe(Effect.scoped),
      );
    },
  );
});
