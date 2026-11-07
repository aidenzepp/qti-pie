/* oxlint-disable unicorn/text-encoding-identifier-case -- The stray document spells its XML encoding labels (`UTF-8`) as crust's reader reports them and `Document` stores them. */
/**
 * The O3 overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): each
 * refused state is one the law's model refuses, named by the law it breaks, and each accepted edge
 * is one its own laws admit.
 *
 * A row whose law is a row CHECK, a containment into a closed relation (a CHECK on the row's table)
 * or a key is written through the author role (`db.apply`): PostgreSQL judges it as the row is
 * inserted, every foreign key into `Node`, `Declaration` and the other overlays being deferred, so
 * none speaks first, and the outcome is `invariant-rejected` with the expected law among its `laws`
 * (membership, since a merged native names several, C22). A row that is a member of an immutable
 * owner's family is inserted with its owner in the same change, a `Choice` or a `Hottext` with its
 * identifier's `ChoiceVariableName` and a `SectionFeedbackRef` with its placement's `SectionScope`
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
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { Addition, Fact, Law } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { Declaration } from "#pantry/qti/declarations.ts";
import { Document } from "#pantry/qti/chardata.ts";
import {
  AriaRange,
  BindingDeclaration,
  boundKinds,
  BoundVariable,
  Choice,
  ChoiceVariableName,
  CountBound,
  CountRange,
  FeedbackRef,
  FeedbackRefDeclaration,
  Hotspot,
  Hottext,
  InteractionAttribute,
  LeastCount,
  MostCount,
  ReferringDocument,
  SectionFeedbackName,
  SectionFeedbackRef,
  SectionFeedbackRefDeclaration,
  SectionScope,
  SectionTemplateName,
  SectionTemplateRef,
  SectionTemplateRefDeclaration,
  Slider,
  PrintedVariableRef,
  TemplateRef,
  TemplateRefDeclaration,
} from "#pantry/qti/interactions.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { Author } from "#pantry/qti/roles.ts";
import {
  assertVerdict,
  foreignKeysBetween,
  judged,
  loginSession,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

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
  outcome: { readonly kind: string; readonly refused?: { readonly laws: readonly Law[] } },
  picks: (law: Law) => boolean,
): boolean => outcome.kind === "invariant-rejected" && (outcome.refused?.laws ?? []).some(picks);

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
 * Pick a containment by the relations of its two sides.
 *
 * @param from - The source's relation.
 * @param to - The target's relation.
 * @returns The predicate.
 */
const containedIn =
  (from: string, to: string) =>
  (law: Law): boolean =>
    law.kind === "contained" && law.from.relation === from && law.to.relation === to;

/**
 * Pick a key law over one relation's fields, in order, its side selected or not.
 *
 * @param relation - The relation.
 * @param fields - The key's fields.
 * @returns The predicate.
 */
const keyOver =
  (relation: string, fields: readonly string[]) =>
  (law: Law): boolean =>
    law.kind === "key" &&
    law.side.relation === relation &&
    law.side.terms.length === fields.length &&
    law.side.terms.every((term, at) => term.kind === "field" && term.field === fields[at]);

/**
 * A stray item binding of a choice interaction, by its response identifier `RESPONSE`.
 *
 * @param at - The interaction's number.
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const boundRow = (at: number, fields: Partial<Fact<typeof BoundVariable>> = {}) =>
  ({
    adaptive: false,
    attribute: "response-identifier",
    document: stray,
    identifier: "RESPONSE",
    kind: "qti-choice-interaction",
    node: strayNode(at),
    ...fields,
  }) satisfies Fact<typeof BoundVariable>;

/**
 * The declaration row of {@link boundRow}'s binding: a stray single identifier response, its
 * interaction's most a value wherever its kind has counts.
 *
 * @param at - The interaction's number.
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const declarationRow = (at: number, fields: Partial<Fact<typeof BindingDeclaration>> = {}) => {
  const kind = fields.kind ?? "qti-choice-interaction";

  return {
    attribute: "response-identifier",
    baseType: "identifier",
    cardinality: "single",
    declaration: stray,
    declarationKind: "qti-response-declaration",
    document: stray,
    identifier: "RESPONSE",
    kind,
    mosts: boundKinds.includes(kind) ? 1n : 0n,
    node: strayNode(at),
    ...fields,
  } satisfies Fact<typeof BindingDeclaration>;
};

/**
 * A stray count bound of an order interaction that writes both counts, of 3 choices, each count a
 * value.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const boundOf = (fields: Partial<Fact<typeof CountBound>> = {}) =>
  ({
    choices: 3n,
    document: stray,
    kind: "qti-order-interaction",
    leasts: 1n,
    maxName: "max-choices",
    maxWritten: true,
    minName: "min-choices",
    minWritten: true,
    mosts: 1n,
    nearest: stray,
    node: strayNode(0),
    parent: stray,
    start: 4n,
    version: "3.0.1",
    ...fields,
  }) satisfies Fact<typeof CountBound>;

/**
 * {@link boundOf}'s least, 2, every field true to `E1_derived`.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const leastOf = (fields: Partial<Fact<typeof LeastCount>> = {}) =>
  ({
    choices: 3n,
    kind: "qti-order-interaction",
    least: "2",
    leastValue: 2n,
    minName: "min-choices",
    minWritten: true,
    node: strayNode(0),
    version: "3.0.1",
    ...fields,
  }) satisfies Fact<typeof LeastCount>;

/**
 * {@link boundOf}'s most, 3, every field true to `E1_derived`.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const mostOf = (fields: Partial<Fact<typeof MostCount>> = {}) =>
  ({
    choices: 3n,
    kind: "qti-order-interaction",
    maxName: "max-choices",
    maxWritten: true,
    minWritten: true,
    most: "3",
    mostValue: 3n,
    node: strayNode(0),
    version: "3.0.1",
    ...fields,
  }) satisfies Fact<typeof MostCount>;

/**
 * {@link boundOf}'s range, its least 2 and its most 3.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const rangeOf = (fields: Partial<Fact<typeof CountRange>> = {}) =>
  ({
    kind: "qti-order-interaction",
    leastValue: 2n,
    minWritten: true,
    mostValue: 3n,
    node: strayNode(0),
    ...fields,
  }) satisfies Fact<typeof CountRange>;

/**
 * A stray hotspot choice of a hotspot interaction, the last of its parent's 2 element children.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const hotspotOf = (fields: Partial<Fact<typeof Hotspot>> = {}) =>
  ({
    area: "default",
    document: stray,
    elementChildren: 0n,
    elements: 2n,
    kind: "qti-hotspot-choice",
    nearest: stray,
    node: strayNode(0),
    parent: stray,
    parentElementChildren: 2n,
    parentElements: 1n,
    parentKind: "qti-hotspot-interaction",
    start: 6n,
    version: "3.0.1",
    ...fields,
  }) satisfies Fact<typeof Hotspot>;

/**
 * The nil uuid, which names no declaration: a case writes it where the import once wrote it, to
 * show the database refuses it as a declaration.
 */
const nilUuid = "00000000-0000-0000-0000-000000000000";

/**
 * A stray feedback block's outcome reference.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const feedbackOf = (fields: Partial<Fact<typeof FeedbackRef>> = {}) =>
  ({
    attribute: "outcome-identifier",
    document: stray,
    identifier: "FEEDBACK",
    kind: "qti-feedback-block",
    node: strayNode(0),
    ...fields,
  }) satisfies Fact<typeof FeedbackRef>;

/**
 * The declaration a stray feedback block's outcome reference names: a declared single identifier
 * outcome.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const feedbackDeclarationOf = (fields: Partial<Fact<typeof FeedbackRefDeclaration>> = {}) =>
  ({
    ...feedbackOf(),
    baseType: "identifier",
    cardinality: "single",
    declaration: stray,
    declarationKind: "qti-outcome-declaration",
    ...fields,
  }) satisfies Fact<typeof FeedbackRefDeclaration>;

/**
 * A stray choice's template reference.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const templateOf = (fields: Partial<Fact<typeof TemplateRef>> = {}) =>
  ({
    attribute: "template-identifier",
    document: stray,
    identifier: "T",
    kind: "qti-simple-choice",
    node: strayNode(0),
    ...fields,
  }) satisfies Fact<typeof TemplateRef>;

/**
 * The declaration a stray choice's template reference names: a declared single identifier
 * template.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const templateDeclarationOf = (fields: Partial<Fact<typeof TemplateRefDeclaration>> = {}) =>
  ({
    ...templateOf(),
    baseType: "identifier",
    cardinality: "single",
    declaration: stray,
    declarationKind: "qti-template-declaration",
    ...fields,
  }) satisfies Fact<typeof TemplateRefDeclaration>;

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
 * The projection row of an identifier the stray rows use, the owner of its choices', hottexts' and
 * declarations' families, which a change inserts beside its members; its counts are the families'
 * to draw.
 *
 * @param identifier - The identifier.
 * @returns The row.
 */
const nameOf = (identifier: string) =>
  ({
    document: stray,
    identifier,
    rootKind: "qti-assessment-item",
  }) satisfies Addition<typeof ChoiceVariableName>;

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
  encoding: "",
  exportCharset: "UTF-8",
  node: stray,
  nodeChildren: 1n,
  nodeDocument: stray,
  nodeGoverns: "none",
  nodeKind: "document",
  nodeParentKind: "document",
  nodeStart: 0n,
  package: stray,
  path: manifestPath,
  resourceType: "none",
  rootKind: "qti-assessment-item",
  standalone: "none",
  version: "3.0.1",
  xmlVersion: "none",
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
 * A printed variable's `index` reference: a `PrintedVariableRef` fact of the given name, with no
 * declaration row.
 *
 * @param identifier - The name it makes.
 * @returns The fact.
 */
const indexReference = (identifier: string): Stated => ({
  fact: feedbackOf({ attribute: "index", identifier, kind: "qti-printed-variable" }),
  relation: PrintedVariableRef,
});

/**
 * A used identifier's projection fact, its counts as the case states them, none of whose members
 * it writes: no assembly places it, so its placed counts are 0.
 *
 * @param identifier - The identifier.
 * @param rootKind - Its document's root kind.
 * @param counts - Its counts of choices, declarations and hottexts.
 * @returns The fact.
 */
const choiceName = (
  identifier: string,
  rootKind: Fact<typeof ChoiceVariableName>["rootKind"],
  counts: {
    readonly choices: bigint;
    readonly declarations: bigint;
    readonly hottexts: bigint;
  },
): Stated => ({
  fact: {
    ...counts,
    document: stray,
    identifier,
    placedChoices: 0n,
    placedHottexts: 0n,
    rootKind,
  },
  relation: ChoiceVariableName,
});

describe.skipIf(!hasLease)("qti/interactions.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer, { timeout: authorLayerHookTimeoutMs })(
    "the interaction overlays' laws, judged by PostgreSQL",
    (it) => {
      it.effect(
        "refuses a binding of a type its interaction does not fit, by BindingFit, RecordBindingFit and a string binding's base type",
        () =>
          // Oracle: PostgreSQL, the containments of a typed and a record binding into the closed
          // `BindingFit` and `RecordBindingFit` (CHECKs on BindingDeclaration's table), and the
          // `BindingFit` check on a string binding (§5.48.2, §5.162.3).
          // Bound: a choice interaction bound to a single string, and to a record; a text entry's
          // string binding to an integer.
          Effect.gen(function* bindingFit() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const cases = [
              {
                picks: containedIn("BindingDeclaration", "BindingFit"),
                row: declarationRow(0, { baseType: "string" }),
              },
              {
                picks: containedIn("BindingDeclaration", "RecordBindingFit"),
                row: declarationRow(0, { baseType: "none", cardinality: "record" }),
              },
              {
                picks: checkNamed("BindingDeclaration", "BindingFit"),
                row: declarationRow(0, {
                  attribute: "string-identifier",
                  baseType: "integer",
                  kind: "qti-text-entry-interaction",
                }),
              },
            ];
            for (const { picks, row } of cases) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(BindingDeclaration, [row]),
                {},
              );

              assert.isTrue(rejectedBy(outcome, picks), `${row.attribute} ${row.baseType}`);
            }
          }),
      );

      it.effect(
        "refuses a binding with no declaration row, and a declaration row that names no declaration, by Binding declared",
        () =>
          // Oracle: PostgreSQL, the foreign keys of "Binding declared" (reading 75; lane NIL's
          // audit, B1: a missing value is a row of its own relation, never a sentinel): every
          // binding has its BindingDeclaration, and each BindingDeclaration names a Declaration.
          // 23503 on those keys alone.
          // Bound: a binding alone, refused; a binding with its declaration row, accepted by the
          // first key; and the old host's nil sentinel, the lawful declaration row with its
          // declaration the nil uuid alone, refused by the second (a row of another base type would
          // break BindingFit's row CHECK at the insert, ahead of the deferred key).
          Effect.gen(function* bindingDeclaredRows() {
            const client = yield* loginSession;
            const existence = yield* foreignKeysBetween(
              client,
              "bound_variable",
              "binding_declaration",
            );
            const named = yield* foreignKeysBetween(client, "binding_declaration", "declaration");
            assert.isNotEmpty(existence);
            assert.isNotEmpty(named);

            const bound = { fact: boundRow(0), relation: BoundVariable };
            const alone = Option.getOrUndefined(
              yield* judged(client, statedInserts([bound]), existence),
            );
            assert.strictEqual(alone?.code, "23503", "a binding with no declaration row");
            assert.include(existence, alone?.constraint);

            const declared = Option.getOrUndefined(
              yield* judged(
                client,
                statedInserts([bound, { fact: declarationRow(0), relation: BindingDeclaration }]),
                existence,
              ),
            );
            assert.isUndefined(declared, "a binding beside its declaration row");

            const sentinel = Option.getOrUndefined(
              yield* judged(
                client,
                statedInserts([
                  bound,
                  {
                    fact: declarationRow(0, { declaration: nilUuid }),
                    relation: BindingDeclaration,
                  },
                ]),
                named,
              ),
            );
            assert.strictEqual(sentinel?.code, "23503", "a declaration row of the nil uuid");
            assert.include(named, sentinel?.constraint);
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a binding to a variable that is no response declaration, by Binding declared",
        () =>
          // Oracle: PostgreSQL, the `Binding_declared` check (reading 75): an interaction binds a
          // response variable.
          // Bound: a declaration row of an outcome declaration.
          Effect.gen(function* bindingDeclared() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const outcome = yield* db.apply(
              ChangeSet.empty(Author).insert(BindingDeclaration, [
                declarationRow(0, { declarationKind: "qti-outcome-declaration" }),
              ]),
              {},
            );

            assert.isTrue(
              rejectedBy(outcome, checkNamed("BindingDeclaration", "Binding_declared")),
            );
          }),
      );

      it.effect(
        "refuses two bindings of one response variable, two interactions' or one interaction's response and string identifiers, by the key on (document, identifier)",
        () =>
          // Oracle: PostgreSQL's UNIQUE, or the host's key check before it, of
          // key(on(BoundVariable, "document", "identifier")): reading 92, "Each response variable
          // declared may be bound to one and only one interaction", and the string identifier's
          // "second response variable" (§5.162.3), the old `string-identifier-distinct`.
          // Bound: two interactions naming one variable; one text entry naming it twice.
          Effect.gen(function* bindingUnique() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const rows of [
              [boundRow(0), boundRow(1)],
              [
                boundRow(0, { kind: "qti-text-entry-interaction" }),
                boundRow(0, {
                  attribute: "string-identifier",
                  kind: "qti-text-entry-interaction",
                }),
              ],
            ]) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(BoundVariable, rows),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, keyOver("BoundVariable", ["document", "identifier"])),
              );
            }
          }),
      );

      it.effect(
        "refuses counts past their bounds and a count row its lexical form does not give, by Choice bounds and E1 derived, each on the row of the count it reads",
        () =>
          // Oracle: PostgreSQL, the `Choice_bounds` checks (readings 18 and 76) on LeastCount,
          // MostCount and CountRange, and `E1_derived`'s G-parse agreement of a count's integer
          // with its form, which must be a count's (lane NIL's audit, B8).
          // Bound: an order interaction's most one past its choices, its least past its choices, its
          // least past a most of 0 (no exemption, reading 18); a choice interaction's least past its
          // most; a least whose integer disagrees with its form, a form no integer reads, a most
          // written as no count (GEN-A's "1abc"), and an unwritten least with no default.
          Effect.gen(function* choiceBounds() {
            const client = yield* loginSession;
            const cases: readonly [string, Stated, string][] = [
              [
                "a most past the choices",
                { fact: mostOf({ most: "4", mostValue: 4n }), relation: MostCount },
                "choice_bounds",
              ],
              [
                "a least past the choices",
                { fact: leastOf({ choices: 1n }), relation: LeastCount },
                "choice_bounds",
              ],
              [
                "a counted least past a most of 0",
                { fact: rangeOf({ mostValue: 0n }), relation: CountRange },
                "choice_bounds",
              ],
              [
                "an unbounded least past its most",
                {
                  fact: rangeOf({ kind: "qti-choice-interaction", mostValue: 1n }),
                  relation: CountRange,
                },
                "choice_bounds",
              ],
              [
                "a least whose integer is not its form's",
                { fact: leastOf({ least: "02", leastValue: 3n }), relation: LeastCount },
                "e1_derived",
              ],
              [
                "a least no integer reads",
                { fact: leastOf({ least: "two", leastValue: 2n }), relation: LeastCount },
                "e1_derived",
              ],
              [
                "a most written as no count",
                { fact: mostOf({ most: "1abc", mostValue: 1n }), relation: MostCount },
                "e1_derived",
              ],
              [
                "an unwritten least whose kind has no default",
                {
                  fact: leastOf({ least: "0", leastValue: 0n, minWritten: false }),
                  relation: LeastCount,
                },
                "e1_derived",
              ],
            ];
            for (const [label, stated, constraint] of cases) {
              assertVerdict(
                yield* judged(
                  client,
                  statedInserts([{ fact: boundOf(), relation: CountBound }, stated]),
                ),
                constraint,
                true,
                label,
              );
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "accepts an order interaction's most equal to its choices, and a choice interaction's most of 0 below its least, by every law of the rows themselves",
        () =>
          // Oracle: PostgreSQL, the rows' domains and CHECKs with every foreign key deferred and
          // none set immediate: the edge maxChoices = choices (reading 18), and reading 76's 0.
          // Bound: the two edges.
          Effect.gen(function* choiceEdges() {
            const client = yield* loginSession;
            const choice = { kind: "qti-choice-interaction" as const };
            for (const rows of [
              [
                { fact: leastOf(), relation: LeastCount },
                { fact: mostOf(), relation: MostCount },
                { fact: rangeOf(), relation: CountRange },
              ],
              [
                { fact: leastOf({ ...choice, choices: 0n }), relation: LeastCount },
                {
                  fact: mostOf({ ...choice, choices: 0n, most: "0", mostValue: 0n }),
                  relation: MostCount,
                },
                { fact: rangeOf({ ...choice, mostValue: 0n }), relation: CountRange },
              ],
            ] satisfies readonly (readonly Stated[])[]) {
              const refused = Option.getOrUndefined(
                yield* judged(
                  client,
                  statedInserts([{ fact: boundOf(), relation: CountBound }, ...rows]),
                  [],
                ),
              );

              assert.isUndefined(refused, refused?.message);
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a single response bound to an interaction whose most is not 1, and accepts a most of 1 and an interaction whose most has no value, by the containment into MostCount",
        () =>
          // Oracle: PostgreSQL, the foreign key of "Binding cardinality" (reading 92): a single
          // response's interaction whose most has a value (`mosts` = 1) is in select(MostCount,
          // mostValue = 1). 23503 on that key. An interaction whose most has none, written as no
          // count, has `mosts` = 0, and its value domain is its law (the law oracle's
          // `countAttribute`).
          // Bound: a choice interaction's most of 2 and of 0, refused, of 1, accepted, and none,
          // accepted.
          Effect.gen(function* bindingCardinality() {
            const client = yield* loginSession;
            const keys = yield* foreignKeysBetween(client, "binding_declaration", "most_count");
            assert.isNotEmpty(keys);

            for (const [most, refusedExpected] of [
              [2n, true],
              [0n, true],
              [1n, false],
              [undefined, false],
            ] as const) {
              const counted =
                most === undefined
                  ? []
                  : [
                      {
                        fact: mostOf({
                          choices: 0n,
                          kind: "qti-choice-interaction",
                          minWritten: false,
                          most: String(most),
                          mostValue: most,
                        }),
                        relation: MostCount,
                      },
                    ];
              const refused = Option.getOrUndefined(
                yield* judged(
                  client,
                  statedInserts([
                    {
                      fact: declarationRow(0, { mosts: most === undefined ? 0n : 1n }),
                      relation: BindingDeclaration,
                    },
                    ...counted,
                  ]),
                  keys,
                ),
              );

              assert.strictEqual(
                refused?.code,
                refusedExpected ? "23503" : undefined,
                String(most),
              );
              if (refusedExpected) {
                assert.include(keys, refused?.constraint);
              }
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses an extended text interaction bound to a container without max-strings, by the containment into CountBound",
        () =>
          // Oracle: PostgreSQL, the foreign key of `max-strings-required` (reading 19): a multiple
          // or ordered binding's extended text is in select(CountBound, maxWritten = true).
          // Bound: a multiple binding with max-strings unwritten, refused, and written, accepted.
          Effect.gen(function* maxStrings() {
            const client = yield* loginSession;
            const keys = yield* foreignKeysBetween(client, "binding_declaration", "count_bound");
            for (const written of [false, true]) {
              const mosts = written ? 1n : 0n;
              const refused = Option.getOrUndefined(
                yield* judged(
                  client,
                  statedInserts([
                    {
                      fact: declarationRow(0, {
                        baseType: "string",
                        cardinality: "multiple",
                        kind: "qti-extended-text-interaction",
                        mosts,
                      }),
                      relation: BindingDeclaration,
                    },
                    {
                      fact: boundOf({
                        choices: 0n,
                        kind: "qti-extended-text-interaction",
                        leasts: 1n,
                        maxName: "max-strings",
                        maxWritten: written,
                        minName: "min-strings",
                        minWritten: false,
                        mosts,
                      }),
                      relation: CountBound,
                    },
                  ]),
                  keys,
                ),
              );

              assert.strictEqual(refused?.code, written ? undefined : "23503", String(written));
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a default hotspot before its parent's last element and a graphic gap match's default hotspot, by the default hotspot checks",
        () =>
          // Oracle: PostgreSQL, the `default_hotspot_last_slot` and
          // `Graphic_gap_match_default_hotspot` checks (reading 80).
          // Bound: a hotspot interaction's default hotspot at element 1 of 2; a graphic gap match's
          // associable hotspot of shape default.
          Effect.gen(function* defaultHotspot() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const cases = [
              { name: "default_hotspot_last_slot", row: hotspotOf({ elements: 1n }) },
              {
                name: "Graphic_gap_match_default_hotspot",
                row: hotspotOf({
                  kind: "qti-associable-hotspot",
                  parentKind: "qti-graphic-gap-match-interaction",
                }),
              },
            ];
            for (const { name, row } of cases) {
              const outcome = yield* db.apply(ChangeSet.empty(Author).insert(Hotspot, [row]), {});

              assert.isTrue(rejectedBy(outcome, checkNamed("Hotspot", name)), name);
            }
          }),
      );

      it.effect(
        "accepts a default hotspot as its parent's last element, and another shape anywhere, by every law of the row itself",
        () =>
          // Oracle: PostgreSQL, the row's domains and CHECKs with every foreign key deferred.
          // Bound: the last default hotspot of 2, and a rect hotspot at element 1 of 2.
          Effect.gen(function* lastHotspot() {
            const client = yield* loginSession;
            for (const row of [hotspotOf(), hotspotOf({ area: "rect", elements: 1n })]) {
              const refused = Option.getOrUndefined(
                yield* judged(client, statedInserts([{ fact: row, relation: Hotspot }]), []),
              );

              assert.isUndefined(refused, refused?.message);
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses an upper bound below the lower and an aria-valuemax below aria-valuemin, by Slider bounds and Aria value range",
        () =>
          // Oracle: PostgreSQL, the `Slider_bounds` check (reading 9, the Schematron's 14Ba) and
          // the `Aria_value_range` check (§5.2.31), each value cast by G-parse.
          // Bound: 5 above 3, 1e1 above 9.5, and aria 2 above 1.5.
          Effect.gen(function* ranges() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const row of [
              { lower: "5", node: strayNode(0), upper: "3" },
              { lower: "1e1", node: strayNode(0), upper: "9.5" },
            ] satisfies Fact<typeof Slider>[]) {
              const outcome = yield* db.apply(ChangeSet.empty(Author).insert(Slider, [row]), {});

              assert.isTrue(rejectedBy(outcome, checkNamed("Slider", "Slider_bounds")), row.lower);
            }

            const outcome = yield* db.apply(
              ChangeSet.empty(Author).insert(AriaRange, [
                { max: "1.5", min: "2", node: strayNode(0) },
              ]),
              {},
            );
            assert.isTrue(rejectedBy(outcome, checkNamed("AriaRange", "Aria_value_range")));
          }),
      );

      it.effect(
        "refuses a feedback outcome of another type, in an item's or a section's placement, and a reference to a built-in its law does not allow, by Feedback outcome type and Feedback reference",
        () =>
          // Oracle: PostgreSQL, the `Feedback_outcome_type` check over the declaration rows (reading
          // 77) and the `Feedback_reference` check that a built-in's name is one `ContentReference`
          // lets the reference name.
          // Bound: a float outcome, of an item's feedback and of a section's feedback placed under
          // a test (port audit A45); a feedback naming the response built-in numAttempts. The placed
          // feedback stands on the section document's `ReferringDocument` and its
          // `SectionFeedbackName`, since its placement's counts are its document's and its
          // reference is its document's, both keys PostgreSQL judges at the INSERT.
          Effect.gen(function* references() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const typed = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(FeedbackRef, [feedbackOf()])
                .insert(FeedbackRefDeclaration, [feedbackDeclarationOf({ baseType: "float" })]),
              {},
            );
            assert.isTrue(
              rejectedBy(typed, checkNamed("FeedbackRefDeclaration", "Feedback_outcome_type")),
            );

            const builtIn = yield* db.apply(
              ChangeSet.empty(Author).insert(FeedbackRef, [
                feedbackOf({ identifier: "numAttempts" }),
              ]),
              {},
            );
            assert.isTrue(rejectedBy(builtIn, checkNamed("FeedbackRef", "Feedback_reference")));

            const { attribute, document, identifier, kind, node } = feedbackOf();
            const placement = { assembly: stray, instance: strayNode(1) } as const;
            const placed = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(ReferringDocument, [{ document }])
                .insert(SectionFeedbackName, [{ attribute, document, identifier, kind, node }])
                .insert(SectionScope, [{ assembly: stray, document, instance: strayNode(1) }])
                .insert(SectionFeedbackRef, [{ ...feedbackOf(), ...placement }])
                .insert(SectionFeedbackRefDeclaration, [
                  { ...feedbackDeclarationOf({ baseType: "float" }), ...placement },
                ]),
              {},
            );
            assert.isTrue(
              rejectedBy(
                placed,
                checkNamed("SectionFeedbackRefDeclaration", "Feedback_outcome_type"),
              ),
            );
          }),
      );

      it.effect(
        "refuses a choice's or template element's template variable of another type, in an item's or a section's placement, and accepts a portable custom interaction's, by Template variable type",
        () =>
          // Oracle: PostgreSQL, the `Template_variable_type` check over the declaration rows
          // (reading R15-l), on each of the two relations that hold a template reference's
          // declaration.
          // Bound: an integer template named by a choice, refused; an identifier template of
          // multiple cardinality named by a choice, and an integer template named by a PCI's
          // qti-template-variable, accepted by this check; the placed section reference of an
          // integer template, refused.
          Effect.gen(function* templateType() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const wrong = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(TemplateRef, [templateOf()])
                .insert(TemplateRefDeclaration, [templateDeclarationOf({ baseType: "integer" })]),
              {},
            );
            assert.isTrue(
              rejectedBy(wrong, checkNamed("TemplateRefDeclaration", "Template_variable_type")),
            );

            for (const row of [
              templateDeclarationOf({ cardinality: "multiple" }),
              templateDeclarationOf({ baseType: "integer", kind: "qti-template-variable" }),
            ]) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author)
                  .insert(TemplateRef, [templateOf({ kind: row.kind })])
                  .insert(TemplateRefDeclaration, [row]),
                {},
              );
              assert.isFalse(
                rejectedBy(outcome, checkNamed("TemplateRefDeclaration", "Template_variable_type")),
                `${row.kind} ${row.baseType} ${row.cardinality}`,
              );
            }

            const { attribute, document, identifier, kind, node } = templateOf();
            const placement = { assembly: stray, instance: strayNode(1) } as const;
            const placed = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(ReferringDocument, [{ document }])
                .insert(SectionTemplateName, [{ attribute, document, identifier, kind, node }])
                .insert(SectionScope, [{ assembly: stray, document, instance: strayNode(1) }])
                .insert(SectionTemplateRef, [{ ...templateOf(), ...placement }])
                .insert(SectionTemplateRefDeclaration, [
                  { ...templateDeclarationOf({ baseType: "integer" }), ...placement },
                ]),
              {},
            );
            assert.isTrue(
              rejectedBy(
                placed,
                checkNamed("SectionTemplateRefDeclaration", "Template_variable_type"),
              ),
            );
          }),
      );

      it.effect(
        "refuses a reference to an undeclared name, and accepts one to the built-in completionStatus, by the containment into its declaration row",
        () =>
          // Oracle: PostgreSQL, the foreign key of a printed variable's `index` reference into its
          // declaration row, selected out for a built-in's name (lane NIL's NS2: a reference that
          // names no declaration has no declaration row, never the nil uuid). 23503 on that key.
          // Bound: an undeclared name, refused; completionStatus with no declaration row,
          // accepted.
          Effect.gen(function* varRef() {
            const client = yield* loginSession;
            const keys = yield* foreignKeysBetween(
              client,
              "printed_variable_ref",
              "printed_variable_ref_declaration",
            );
            assert.isNotEmpty(keys);

            const undeclared = Option.getOrUndefined(
              yield* judged(client, statedInserts([indexReference("UNDECLARED")]), keys),
            );
            assert.strictEqual(undeclared?.code, "23503");
            assert.include(keys, undeclared?.constraint);

            const builtIn = Option.getOrUndefined(
              yield* judged(client, statedInserts([indexReference("completionStatus")]), keys),
            );
            assert.isUndefined(builtIn, builtIn?.message);
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses two choices of one kind in one document with one identifier, of one interaction or of two, and two hottexts of one document, and lets a gap and a gap text share one, by their keys",
        () =>
          // Oracle: PostgreSQL's UNIQUE, or the host's key check before it, of
          // key(on(Choice, "document", "kind", "identifier")) and key(on(Hottext, "document",
          // "identifier")): the choice classes' "This identifier must not be used by any other
          // choice or item variable" (§5.132.1, §5.65.1), each class of its own kind, the document
          // its scope (reading 104).
          // Bound: two simple choices named A of one interaction, and of two; two hottexts named H,
          // one in a hottext interaction and one outside any; a gap and a gap text named A of one
          // interaction, which the key lets be (the rows are stray, so the deferred foreign keys
          // refuse them at commit, and the key is not among the laws).
          Effect.gen(function* choiceKeys() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const second of [
              choiceOf(1, "A"),
              { ...choiceOf(1, "A"), nearest: strayNode(98) },
            ]) {
              const pair = [choiceOf(0, "A"), second];
              const choices = yield* db.apply(
                ChangeSet.empty(Author)
                  .insert(Document, [strayDocument])
                  .insert(ChoiceVariableName, [nameOf("A")])
                  .insert(Choice, pair),
                {},
              );
              assert.isTrue(
                rejectedBy(choices, keyOver("Choice", ["document", "kind", "identifier"])),
                second.nearest,
              );
            }

            const hottexts = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(Document, [strayDocument])
                .insert(ChoiceVariableName, [nameOf("H")])
                .insert(Hottext, [
                  hottextOf(0),
                  hottextOf(1, { nearest: stray, nearestKind: "document" }),
                ]),
              {},
            );
            assert.isTrue(rejectedBy(hottexts, keyOver("Hottext", ["document", "identifier"])));

            const gaps = [choiceOf(0, "A", "qti-gap"), choiceOf(1, "A", "qti-gap-text")];
            const classes = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(Document, [strayDocument])
                .insert(ChoiceVariableName, [nameOf("A")])
                .insert(Choice, gaps),
              {},
            );
            assert.isFalse(
              rejectedBy(classes, keyOver("Choice", ["document", "kind", "identifier"])),
            );
          }),
      );

      it.effect(
        "refuses a choice or a hottext named as a declaration of its document, or in an item as a built-in variable, by Choice not variable",
        () =>
          // Oracle: PostgreSQL, the `Choice_not_variable` check on `ChoiceVariableName` (reading 104:
          // "This identifier must not be used by any other choice or item variable"), over the
          // counts its three families draw from the rows the ChangeSet writes.
          // Bound: a simple choice and an outcome declaration named A; a hottext and that
          // declaration; a simple choice named numAttempts in an item.
          Effect.gen(function* choiceNotVariable() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const declared = {
              baseType: "identifier",
              cardinality: "single",
              cardinalityLexical: "single",
              declarationKind: "qti-outcome-declaration",
              document: stray,
              identifier: "A",
              identifierLead: "",
              identifierLexical: "A",
              identifierTrail: "",
              kind: "qti-outcome-declaration",
              nearest: stray,
              node: strayNode(50),
              parent: stray,
              start: 2n,
              version: "3.0.1",
            } satisfies Addition<typeof Declaration>;

            const choice = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(Document, [strayDocument])
                .insert(ChoiceVariableName, [nameOf("A")])
                .insert(Choice, [choiceOf(0, "A")])
                .insert(Declaration, [declared]),
              {},
            );
            assert.isTrue(
              rejectedBy(choice, checkNamed("ChoiceVariableName", "Choice_not_variable")),
              "choice",
            );

            const hottext = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(Document, [strayDocument])
                .insert(ChoiceVariableName, [nameOf("A")])
                .insert(Hottext, [hottextOf(0, { identifier: "A" })])
                .insert(Declaration, [declared]),
              {},
            );
            assert.isTrue(
              rejectedBy(hottext, checkNamed("ChoiceVariableName", "Choice_not_variable")),
              "hottext",
            );

            const builtIn = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(Document, [strayDocument])
                .insert(ChoiceVariableName, [nameOf("numAttempts")])
                .insert(Choice, [choiceOf(0, "numAttempts")]),
              {},
            );
            assert.isTrue(
              rejectedBy(builtIn, checkNamed("ChoiceVariableName", "Choice_not_variable")),
              "numAttempts",
            );
          }),
      );

      it.effect(
        "accepts a name of choices alone, of a declaration alone and a stimulus choice named as a built-in, and refuses a name counted by both and one counted by none, by the row's own checks",
        () =>
          // Oracle: PostgreSQL, `ChoiceVariableName`'s CHECKs with every foreign key and family
          // proof deferred and none set immediate: `Choice_not_variable` (reading 104) and
          // `E1_derived` (some count above 0), 23514 on the check refused.
          // Bound: two choices of one name; one declaration; a stimulus's choice named
          // numAttempts, accepted; a hottext and a declaration of one name, and a name of no
          // choice, hottext or declaration, refused.
          Effect.gen(function* nameRows() {
            const client = yield* loginSession;

            for (const [label, row, refusedBy] of [
              [
                "choices alone",
                choiceName("A", "qti-assessment-item", {
                  choices: 2n,
                  declarations: 0n,
                  hottexts: 0n,
                }),
                undefined,
              ],
              [
                "a declaration alone",
                choiceName("A", "qti-assessment-item", {
                  choices: 0n,
                  declarations: 1n,
                  hottexts: 0n,
                }),
                undefined,
              ],
              [
                "a stimulus choice named numAttempts",
                choiceName("numAttempts", "qti-assessment-stimulus", {
                  choices: 1n,
                  declarations: 0n,
                  hottexts: 0n,
                }),
                undefined,
              ],
              [
                "a hottext and a declaration",
                choiceName("A", "qti-assessment-item", {
                  choices: 0n,
                  declarations: 1n,
                  hottexts: 1n,
                }),
                "choice_not_variable",
              ],
              [
                "no use",
                choiceName("A", "qti-assessment-item", {
                  choices: 0n,
                  declarations: 0n,
                  hottexts: 0n,
                }),
                "e_1_derived",
              ],
            ] as const) {
              const refused = Option.getOrUndefined(
                yield* judged(client, statedInserts([row]), []),
              );

              if (refusedBy === undefined) {
                assert.isUndefined(refused, `${label}: ${refused?.message ?? ""}`);
              } else {
                assert.strictEqual(
                  refused?.code,
                  "23514",
                  `${label}: ${refused?.message ?? "accepted"}`,
                );
                assert.strictEqual(refused?.constraint, refusedBy, label);
              }
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a hottext whose nearest kind is not its nearest node's, and a read attribute whose value keeps outer whitespace, by E1 derived",
        () =>
          // Oracle: PostgreSQL, the `E1_derived` checks: a hottext's nearest is the document node
          // exactly when its nearest kind is `document`; a value is its lexical form collapsed.
          // Bound: a hottext of a hottext interaction whose nearest is its document; a value " R".
          Effect.gen(function* derived() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const hottext = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(Document, [strayDocument])
                .insert(ChoiceVariableName, [nameOf("H")])
                .insert(Hottext, [hottextOf(0, { nearest: stray })]),
              {},
            );
            assert.isTrue(rejectedBy(hottext, checkNamed("Hottext", "E1_derived")));

            const read = yield* db.apply(
              ChangeSet.empty(Author).insert(InteractionAttribute, [
                {
                  document: stray,
                  kind: "qti-choice-interaction",
                  lead: "",
                  lexical: " R",
                  name: "response-identifier",
                  node: strayNode(0),
                  rootKind: "qti-assessment-item",
                  trail: "",
                  value: " R",
                },
              ]),
              {},
            );
            assert.isTrue(rejectedBy(read, checkNamed("InteractionAttribute", "E1_derived")));
          }),
      );
    },
  );
});
