/* oxlint-disable unicorn/text-encoding-identifier-case -- The stray document spells its XML encoding labels (`UTF-8`) as crust's reader reports them and `Document` stores them. */
/**
 * The O3 overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): each
 * refused state is one the law's model refuses, named by the law it breaks, and each accepted edge
 * is one its own laws admit.
 *
 * Only the laws the database alone evaluates stay here: the slider and ARIA ranges, each bound
 * read by grizzle's `Compute.parseDouble` or `Compute.parseDecimal`, and reading 104's rules over
 * queries. The row CHECKs, keys and containments the host judges are held on the free tier, by the
 * law oracle and `#pantry/qti/interactions.oracle.test.ts`.
 *
 * A row whose law is a row CHECK, a containment into a closed relation (a CHECK on the row's table)
 * or a key is written through the author role (`db.apply`): PostgreSQL judges it as the row is
 * inserted, every foreign key into `Node`, `Declaration` and the other overlays being deferred, so
 * none speaks first, and the outcome is `invariant-rejected` with the expected law among its `laws`
 * (membership, since a merged native names several, C22). A row that is a member of an immutable
 * owner's family is inserted with its owner in the same change, a `Choice` or a `Hottext` with its
 * identifier's rules over queries and a `SectionFeedbackRef` with its placement's `SectionScope`
 * (grizzle's README, "Families": "An immutable owner's family is fixed when the owner is
 * inserted"), so the write compiles and the law under test is the verdict. A row whose acceptance
 * by its own laws is the contract, and a law that is a foreign key between two stray rows, is
 * written by a direct SQL writer (grizzle's README, "Direct SQL access"): the author login, `SET
 * ROLE` to the author role, at SERIALIZABLE, each row inserted into its table with every column a
 * writer fills, every constraint deferred and then the ones under test set immediate, so
 * PostgreSQL's SQLSTATE and the constraint it names are the verdict, and the transaction rolls
 * back. A role writes a table, never its own view of it, which it holds SELECT on alone (README,
 * "Security model").
 *
 * The cases over a whole imported item need the importer's ChangeSet (Q5.15), and are listed in
 * Q5.09's report for the network seat's probe: a gap and a hottext owned through `nearest`, a
 * default hotspot followed by whitespace and one before another hotspot, AdaptiveFeedback, a
 * binding resolved against a real declaration, the read attributes' mirror of `Attribute`, and a
 * section document's references resolved under each test that places it.
 */
import { Db } from "@bjornpagen/grizzle";
import type { Addition, Fact, Law, RefusedLaw } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { Flag } from "#pantry/grammar/install.ts";
import { Declaration, DeclarationIdentifier } from "#pantry/qti/declarations.ts";
import { Document } from "#pantry/qti/chardata.ts";
import type { AriaRange } from "#pantry/qti/interactions.ts";
import { Choice, Hottext, Slider } from "#pantry/qti/interactions.ts";
import { Qti } from "#pantry/qti/schema.ts";

import { bitsText } from "#pantry/test/bits.ts";
import {
  assertVerdict,
  judged,
  loginSession,
  rowsOf,
  statedInserts,
  tableOf,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { hasLease } from "#pantry/test/settings.ts";
import { manifestPath } from "#pantry/vocab/terms/package.ts";
import { AuthorLogin } from "#pantry/db/served.ts";
import { importFacts } from "#pantry/test/import-facts.ts";

/**
 * A uuid no stored row holds: the document and the declaration every stray row names.
 */
const stray = "00000000-0000-4000-8000-0000000019f0";

/**
 * The node of one stray row, distinct for each row of a case.
 *
 * @param at - The row's number, 0 to 99.
 * @returns Its uuid.
 */
const strayNode = (at: number): `${string}-${string}-${string}-${string}-${string}` =>
  `00000000-0000-4000-8000-0000000019${String(at).padStart(2, "0")}`;

/**
 * Whether an outcome is `invariant-rejected` with a law among its `laws` that the predicate picks.
 *
 * @param outcome - The apply's outcome.
 * @param picks - Picks the expected law.
 * @returns Whether it holds one.
 */
const rejectedBy = (
  outcome: {
    readonly kind: string;
    readonly refused?: { readonly laws: readonly RefusedLaw<Law>[] };
  },
  picks: (law: Law) => boolean,
): boolean =>
  outcome.kind === "invariant-rejected" &&
  (outcome.refused?.laws ?? []).some(({ law }) => picks(law));

/**
 * Pick the check of one relation by its name.
 *
 * @param relation - The relation.
 * @param name - The check's name.
 * @returns The predicate.
 */
const checkNamed =
  (relation: string, name: string) =>
  (law: Law): boolean =>
    law.kind === "check" && law.relation === relation && law.name === name;

/**
 * A stray choice of one interaction.
 *
 * @param at - The choice's number.
 * @param identifier - Its identifier.
 * @param kind - Its kind.
 * @returns The row.
 */
const choiceOf = (
  at: number,
  identifier: string,
  kind: Fact<typeof Choice>["kind"] = "qti-simple-choice",
): Fact<typeof Choice> => ({
  document: stray,
  identifier,
  kind,
  nearest: stray,
  node: strayNode(at),
  parent: stray,
  start: BigInt(5 + at),
  version: "3.0.1",
});

/**
 * The stray document as the owner of its choices' and hottexts' families (`Document.choices`,
 * `Document.hottexts`), which a change inserts beside its members, since an immutable owner's
 * family takes an append only beside an insert of its owner: the manifest's row, lawful on its own
 * CHECKs (`RootOfType` admits its `none` resource type at `imsmanifest.xml`, it writes no
 * declaration, and its context is its own node). Its counts are the families' to draw.
 */
const strayDocument = {
  assembled: false,
  charset: "UTF-8",
  contextNearest: stray,
  contextNearestKind: "document",
  documentType: "manifest",
  exportCharset: "UTF-8",
  node: stray,
  nodeChildren: 1n,
  package: stray,
  path: manifestPath,
  rootKind: "qti-assessment-item",
  version: "3.0.1",
} as const satisfies Addition<typeof Document>;

/**
 * A stray hottext of a hottext interaction.
 *
 * @param at - The hottext's number.
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const hottextOf = (at: number, fields: Partial<Fact<typeof Hottext>> = {}) =>
  ({
    document: stray,
    identifier: "H",
    kind: "qti-hottext",
    nearest: strayNode(99),
    nearestKind: "qti-hottext-interaction",
    node: strayNode(at),
    parent: stray,
    start: BigInt(5 + at),
    version: "3.0.1",
    ...fields,
  }) satisfies Fact<typeof Hottext>;

/**
 * The one constraint trigger of one of `Qti`'s tables whose comment matches a `LIKE` pattern: a
 * rule over a query is a deferred constraint trigger on each table its query reads, all under one
 * name, which grizzle mints from a digest and describes by its comment (`trigger of rule ...`).
 *
 * @param client - The session.
 * @param table - A table the rule's query reads, by its relation's name.
 * @param pattern - The comment's pattern.
 * @returns The trigger's name, the constraint `SET CONSTRAINTS` sets immediate; none or several
 *   fail the case.
 */
const ruleDescribed = (client: Parameters<typeof rowsOf>[0], table: string, pattern: string) =>
  rowsOf<{ readonly tgname: string }>(
    client,
    `SELECT t.tgname FROM pg_catalog.pg_trigger t
      WHERE t.tgrelid = pg_catalog.to_regclass($1)
        AND pg_catalog.obj_description(t.oid, 'pg_trigger') LIKE $2`,
    [`qti.${tableOf(table)}`, pattern],
  ).pipe(
    Effect.map((rows) => {
      assert.lengthOf(rows, 1, pattern);

      return rows[0]?.tgname ?? "";
    }),
  );

/**
 * The stray document's row as a direct writer states it, every column, the accumulated `context`
 * among them, under a root kind the case sets.
 *
 * @param rootKind - The document's root kind.
 * @returns The fact.
 */
const documentStated = (rootKind: Addition<typeof Document>["rootKind"]): Stated => ({
  fact: { ...strayDocument, context: bitsText(Flag, []), rootKind },
  relation: Document,
});

/**
 * A stray choice as a direct writer states it ({@link choiceOf}).
 *
 * @param at - The choice's number.
 * @param identifier - Its identifier.
 * @param kind - Its kind, a simple choice by default.
 * @returns The statement.
 */
const choiceStated = (
  at: number,
  identifier: string,
  kind?: Fact<typeof Choice>["kind"],
): Stated => ({ fact: choiceOf(at, identifier, kind), relation: Choice });

/**
 * A stray hottext of a hottext interaction as a direct writer states it ({@link hottextOf}).
 *
 * @param at - The hottext's number.
 * @param identifier - Its identifier.
 * @returns The statement.
 */
const hottextStated = (at: number, identifier: string): Stated => ({
  fact: hottextOf(at, { identifier }),
  relation: Hottext,
});

/**
 * An outcome declaration of the stray document named `A`, its `Declaration` and its
 * `DeclarationIdentifier`, with no cardinality (spec reading 159).
 */
const declaredA: readonly Stated[] = [
  {
    fact: {
      declarationKind: "qti-outcome-declaration",
      document: stray,
      kind: "qti-outcome-declaration",
      nearest: stray,
      node: strayNode(50),
      parent: stray,
      parentKind: "qti-assessment-item",
      start: 2n,
      version: "3.0.1",
    },
    relation: Declaration,
  },
  {
    fact: {
      baseTypes: 0n,
      cardinalities: 0n,
      declarationKind: "qti-outcome-declaration",
      document: stray,
      identifier: "A",
      identifierLead: "",
      identifierLexical: "A",
      identifierTrail: "",
      node: strayNode(50),
      parentKind: "qti-assessment-item",
    },
    relation: DeclarationIdentifier,
  },
];

describe.skipIf(!hasLease)("qti/interactions.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer)("the interaction overlays' laws, judged by PostgreSQL", (it) => {
    it.effect(
      "refuses an upper bound below the lower and an aria-valuemax below aria-valuemin, by Slider bounds and Aria value range",
      () =>
        // Oracle: PostgreSQL, the `Slider_bounds` check (reading 9, the Schematron's 14Ba), each
        // bound read by grizzle's `Compute.parseDouble` (XML Schema 1.1's doubleLexicalMap,
        // reading 144) of any digits and any exponent, and the `Aria_value_range` check
        // (§5.2.31), each value read by grizzle's `Compute.parseDecimal` (XML Schema 1.1's
        // decimalLexicalMap) of any digits.
        // Bound: 5 above 3, 1e1 above 9.5, and past grizzle's former bounded form of double
        // precision (15 significant digits, an exponent of at most 293): a 17-digit lower bound
        // above 1, 1e294 above 1e293, 1e400 (+INF) above the greatest finite double, and 1e-300
        // above -1e-400 (-0); and aria 2 above 1.5, and past the former bounded form of numeric
        // (256 integer and 255 fraction digits): 2 above 1 at 257 integer digits, and two values
        // one unit apart in their 300th fraction digit.
        Effect.gen(function* ranges() {
          const db = yield* Db.open((yield* AuthorLogin).roles.author, {});
          for (const row of [
            { lower: "5", node: strayNode(0), upper: "3" },
            { lower: "1e1", node: strayNode(0), upper: "9.5" },
            { lower: "10000000000000001", node: strayNode(0), upper: "1" },
            { lower: "1e294", node: strayNode(0), upper: "1e293" },
            { lower: "1e400", node: strayNode(0), upper: "1.7976931348623157e308" },
            { lower: "1e-300", node: strayNode(0), upper: "-1e-400" },
          ] satisfies Fact<typeof Slider>[]) {
            const outcome = yield* db.workload.importWrite.apply(
              importFacts({ Slider: [row] }),
              {},
            );

            assert.isTrue(rejectedBy(outcome, checkNamed("Slider", "Slider_bounds")), row.lower);
          }

          for (const row of [
            { max: "1.5", min: "2", node: strayNode(0) },
            { max: `1${"0".repeat(256)}`, min: `2${"0".repeat(256)}`, node: strayNode(0) },
            { max: `0.${"3".repeat(299)}3`, min: `0.${"3".repeat(299)}4`, node: strayNode(0) },
          ] satisfies Fact<typeof AriaRange>[]) {
            const outcome = yield* db.workload.importWrite.apply(
              importFacts({ AriaRange: [row] }),
              {},
            );

            assert.isTrue(
              rejectedBy(outcome, checkNamed("AriaRange", "Aria_value_range")),
              `${row.min} ${row.max}`,
            );
          }
        }),
    );

    it.effect(
      "accepts slider bounds whose doubles are in order past grizzle's former bounded form, and a bound that is no xs:double, by every law of the row itself",
      () =>
        // Oracle: PostgreSQL, the row's domains and CHECKs with every foreign key deferred:
        // `Slider_bounds` reads each bound as the double XML Schema 1.1's doubleLexicalMap maps
        // it to (reading 144), so two spellings of one double are in order, and a bound that is
        // no xs:double, which its value domain alone refuses, is not judged.
        // Bound: 1e400 against INF (both +INF), a 17-digit 1.0000000000000001 against 1 (one
        // double), 1e-400 against -0 (two zeros), 1e293 below 1e294, and +INF and abc against
        // -1, outside XML Schema 1.0's lexical space (reading 71's edition).
        Effect.gen(function* orderedBounds() {
          const client = yield* loginSession;
          for (const row of [
            { lower: "1e400", node: strayNode(0), upper: "INF" },
            { lower: "1.0000000000000001", node: strayNode(0), upper: "1" },
            { lower: "1e-400", node: strayNode(0), upper: "-0" },
            { lower: "1e293", node: strayNode(0), upper: "1e294" },
            { lower: "+INF", node: strayNode(0), upper: "-1" },
            { lower: "abc", node: strayNode(0), upper: "-1" },
          ] satisfies Fact<typeof Slider>[]) {
            const refused = Option.getOrUndefined(
              yield* judged(client, statedInserts([{ fact: row, relation: Slider }]), []),
            );

            assert.isUndefined(refused, `${row.lower} ${row.upper}: ${refused?.message ?? ""}`);
          }
        }).pipe(Effect.scoped),
    );

    it.effect(
      "accepts one choice or hottext of a name, a declaration alone and a stimulus's choice named as a built-in, and refuses two choices or hottexts of one name and of two classes by Choice identifier key, and a choice or a hottext named as a declaration of its document or, in an item, as a built-in variable, by Choice not variable",
      () =>
        // Oracle: PostgreSQL, reading 104's two rules over queries (`src/qti/queries.ts`; README,
        // "Rules over queries"), each a deferred constraint trigger on `Choice` and `Hottext`,
        // both set immediate, every other deferrable constraint deferred and rolled back
        // unchecked: the key over `ChoiceOrHottext` (reading 104 as amended: the nine classes and
        // the hottexts share one space of identifiers), 23505; and `ChoiceOrHottext` in
        // `UnclaimedName` ("This identifier must not be used by any other choice or item
        // variable"), 23503, a declaration read by its `DeclarationIdentifier` whatever its
        // cardinality spells (spec reading 159), and in an item the built-ins (§2.2.2).
        // Bound: one choice; one hottext; a declaration named A alone; a stimulus's choice named
        // numAttempts, accepted; a gap and a gap text, and a choice and a hottext, of one name, by
        // the key; two of one class meet their class's own key first, a UNIQUE that PostgreSQL
        // checks as the row is inserted, before any trigger, so the per-class keys' test above
        // holds them; a choice and a hottext named as an outcome
        // declaration with no cardinality, and an item's choice named numAttempts, by the
        // containment.
        Effect.gen(function* nameRules() {
          const client = yield* loginSession;
          const key = yield* ruleDescribed(
            client,
            Choice.name,
            `trigger of rule key ${Qti.relations.ChoiceOrHottext.name}(document, identifier)`,
          );
          const unclaimed = yield* ruleDescribed(
            client,
            Choice.name,
            `trigger of rule ${Qti.relations.ChoiceOrHottext.name}(document, identifier) in ${Qti.relations.UnclaimedName.name}(document, identifier)`,
          );
          const item = "qti-assessment-item";

          for (const [label, rootKind, rows, refusedBy] of [
            ["one choice", item, [choiceStated(0, "A")], undefined],
            ["one hottext", item, [hottextStated(0, "H")], undefined],
            ["a declaration alone", item, declaredA, undefined],
            [
              "a stimulus's choice named numAttempts",
              "qti-assessment-stimulus",
              [choiceStated(0, "numAttempts")],
              undefined,
            ],
            [
              "a gap and a gap text",
              item,
              [choiceStated(0, "A", "qti-gap"), choiceStated(1, "A", "qti-gap-text")],
              key,
            ],
            ["a choice and a hottext", item, [choiceStated(0, "A"), hottextStated(1, "A")], key],
            [
              "a choice named as a declaration",
              item,
              [...declaredA, choiceStated(0, "A")],
              unclaimed,
            ],
            [
              "a hottext named as a declaration",
              item,
              [...declaredA, hottextStated(0, "A")],
              unclaimed,
            ],
            [
              "an item's choice named numAttempts",
              item,
              [choiceStated(0, "numAttempts")],
              unclaimed,
            ],
          ] as const) {
            assertVerdict(
              yield* judged(client, statedInserts([documentStated(rootKind), ...rows]), [
                key,
                unclaimed,
              ]),
              refusedBy ?? "",
              refusedBy !== undefined,
              label,
              refusedBy === key ? "23505" : "23503",
            );
          }
        }).pipe(Effect.scoped),
    );
  });
});
