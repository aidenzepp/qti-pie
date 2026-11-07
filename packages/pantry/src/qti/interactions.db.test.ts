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
  BoundVariable,
  Choice,
  ChoiceVariableName,
  CountBound,
  FeedbackRef,
  Hotspot,
  Hottext,
  InteractionAttribute,
  nilUuid,
  ReferringDocument,
  SectionFeedbackName,
  SectionFeedbackRef,
  SectionScope,
  SectionTemplateName,
  SectionTemplateRef,
  Slider,
  TemplateRef,
  VarRef,
} from "#pantry/qti/interactions.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { Author } from "#pantry/qti/roles.ts";
import {
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
 * The declaration row of {@link boundRow}'s binding: a stray single identifier response.
 *
 * @param at - The interaction's number.
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const declarationRow = (at: number, fields: Partial<Fact<typeof BindingDeclaration>> = {}) =>
  ({
    attribute: "response-identifier",
    baseType: "identifier",
    cardinality: "single",
    declaration: stray,
    declarationKind: "qti-response-declaration",
    document: stray,
    identifier: "RESPONSE",
    kind: "qti-choice-interaction",
    node: strayNode(at),
    ...fields,
  }) satisfies Fact<typeof BindingDeclaration>;

/**
 * A stray count bound of an order interaction whose least is written, every field true to
 * `E1_derived`: least 2 and most 3 of 3 choices.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const boundOf = (fields: Partial<Fact<typeof CountBound>> = {}) =>
  ({
    choices: 3n,
    document: stray,
    kind: "qti-order-interaction",
    least: "2",
    leastValue: 2n,
    maxName: "max-choices",
    maxWritten: true,
    minName: "min-choices",
    minWritten: true,
    most: "3",
    mostValue: 3n,
    nearest: stray,
    node: strayNode(0),
    parent: stray,
    start: 4n,
    version: "3.0.1",
    ...fields,
  }) satisfies Fact<typeof CountBound>;

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
 * A stray feedback block's outcome reference, resolved to a declared single identifier outcome.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const feedbackOf = (fields: Partial<Fact<typeof FeedbackRef>> = {}) =>
  ({
    attribute: "outcome-identifier",
    baseType: "identifier",
    cardinality: "single",
    declaration: stray,
    declarationKind: "qti-outcome-declaration",
    document: stray,
    identifier: "FEEDBACK",
    kind: "qti-feedback-block",
    node: strayNode(0),
    ...fields,
  }) satisfies Fact<typeof FeedbackRef>;

/**
 * A stray choice's template reference, resolved to a declared single identifier template.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const templateOf = (fields: Partial<Fact<typeof TemplateRef>> = {}) =>
  ({
    attribute: "template-identifier",
    baseType: "identifier",
    cardinality: "single",
    declaration: stray,
    declarationKind: "qti-template-declaration",
    document: stray,
    identifier: "T",
    kind: "qti-simple-choice",
    node: strayNode(0),
    ...fields,
  }) satisfies Fact<typeof TemplateRef>;

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
 * A printed variable's `index` reference: a `VarRef` fact of the given name and declaration.
 *
 * @param identifier - The name it makes.
 * @param declaration - The declaration it resolves to.
 * @returns The fact.
 */
const indexReference = (
  identifier: string,
  declaration: Fact<typeof FeedbackRef>["declaration"],
): Stated => ({
  fact: feedbackOf({ attribute: "index", declaration, identifier, kind: "qti-printed-variable" }),
  relation: VarRef,
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
        "refuses counts past their bounds and a typed count its lexical form does not spell, by Choice bounds and E1 derived",
        () =>
          // Oracle: PostgreSQL, the `Choice_bounds` check (readings 18 and 76) and `E1_derived`'s
          // G-parse agreement of each count's integer with its lexical form.
          // Bound: an order interaction's most one past its choices, its least past its choices,
          // its least past a most of 0 (no exemption, reading 18); a choice interaction's least
          // past its most; a least whose integer disagrees with its form, and a form no integer
          // reads.
          Effect.gen(function* choiceBounds() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const cases = [
              { name: "Choice_bounds", row: boundOf({ most: "4", mostValue: 4n }) },
              { name: "Choice_bounds", row: boundOf({ choices: 1n }) },
              { name: "Choice_bounds", row: boundOf({ most: "0", mostValue: 0n }) },
              {
                name: "Choice_bounds",
                row: boundOf({
                  choices: 0n,
                  kind: "qti-choice-interaction",
                  least: "2",
                  leastValue: 2n,
                  most: "1",
                  mostValue: 1n,
                }),
              },
              { name: "E1_derived", row: boundOf({ least: "02", leastValue: 3n }) },
              { name: "E1_derived", row: boundOf({ least: "two", leastValue: 2n }) },
            ];
            for (const { name, row } of cases) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(CountBound, [row]),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, checkNamed("CountBound", name)),
                `${row.kind} ${row.least} ${row.most} ${String(row.choices)}`,
              );
            }
          }),
      );

      it.effect(
        "accepts an order interaction's most equal to its choices, and a choice interaction's most of 0 below its least, by every law of the row itself",
        () =>
          // Oracle: PostgreSQL, the row's domains and CHECKs with every foreign key deferred and
          // none set immediate: the edge maxChoices = choices (reading 18), and reading 76's 0.
          // Bound: the two edges.
          Effect.gen(function* choiceEdges() {
            const client = yield* loginSession;
            for (const row of [
              boundOf(),
              boundOf({
                choices: 0n,
                kind: "qti-choice-interaction",
                least: "2",
                leastValue: 2n,
                most: "0",
                mostValue: 0n,
              }),
            ]) {
              const refused = Option.getOrUndefined(
                yield* judged(client, statedInserts([{ fact: row, relation: CountBound }]), []),
              );

              assert.isUndefined(refused, refused?.message);
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a single response bound to an interaction whose most is not 1, and accepts a most of 1, by the containment into CountBound",
        () =>
          // Oracle: PostgreSQL, the foreign key of "Binding cardinality" (reading 92): a single
          // response's interaction is in select(CountBound, mostValue = 1). 23503 on that key.
          // Bound: a choice interaction's most of 2 and of 0, refused, and of 1, accepted.
          Effect.gen(function* bindingCardinality() {
            const client = yield* loginSession;
            const keys = yield* foreignKeysBetween(client, "binding_declaration", "count_bound");
            assert.isNotEmpty(keys);

            for (const [most, refusedExpected] of [
              [2n, true],
              [0n, true],
              [1n, false],
            ] as const) {
              const refused = Option.getOrUndefined(
                yield* judged(
                  client,
                  statedInserts([
                    { fact: declarationRow(0), relation: BindingDeclaration },
                    {
                      fact: boundOf({
                        choices: 0n,
                        kind: "qti-choice-interaction",
                        least: "0",
                        leastValue: 0n,
                        most: String(most),
                        mostValue: most,
                      }),
                      relation: CountBound,
                    },
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
              const refused = Option.getOrUndefined(
                yield* judged(
                  client,
                  statedInserts([
                    {
                      fact: declarationRow(0, {
                        baseType: "string",
                        cardinality: "multiple",
                        kind: "qti-extended-text-interaction",
                      }),
                      relation: BindingDeclaration,
                    },
                    {
                      fact: boundOf({
                        choices: 0n,
                        kind: "qti-extended-text-interaction",
                        least: "0",
                        leastValue: 0n,
                        maxName: "max-strings",
                        maxWritten: written,
                        minName: "min-strings",
                        minWritten: false,
                        most: written ? "2" : "0",
                        mostValue: written ? 2n : 0n,
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
        "refuses a feedback outcome of another type, in an item's or a section's placement, and a reference to a built-in its law does not allow, by Feedback outcome type and the containment into ContentReference",
        () =>
          // Oracle: PostgreSQL, the `Feedback_outcome_type` check (reading 77) and the containment
          // of (kind, attribute, declarationKind) into the closed `ContentReference`.
          // Bound: a float outcome, of an item's feedback and of a section's feedback placed under
          // a test (port audit A45); a feedback naming the response built-in numAttempts. The placed
          // feedback stands on the section document's `ReferringDocument` and its
          // `SectionFeedbackName`, since its placement's counts are its document's and its
          // reference is its document's, both keys PostgreSQL judges at the INSERT.
          Effect.gen(function* references() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const typed = yield* db.apply(
              ChangeSet.empty(Author).insert(FeedbackRef, [feedbackOf({ baseType: "float" })]),
              {},
            );
            assert.isTrue(rejectedBy(typed, checkNamed("FeedbackRef", "Feedback_outcome_type")));

            const builtIn = yield* db.apply(
              ChangeSet.empty(Author).insert(FeedbackRef, [
                feedbackOf({
                  baseType: "integer",
                  declaration: nilUuid,
                  declarationKind: "qti-response-declaration",
                  identifier: "numAttempts",
                }),
              ]),
              {},
            );
            assert.isTrue(rejectedBy(builtIn, containedIn("FeedbackRef", "ContentReference")));

            const { attribute, document, identifier, kind, node } = feedbackOf();
            const placed = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(ReferringDocument, [{ document }])
                .insert(SectionFeedbackName, [{ attribute, document, identifier, kind, node }])
                .insert(SectionScope, [{ assembly: stray, document, instance: strayNode(1) }])
                .insert(SectionFeedbackRef, [
                  {
                    ...feedbackOf({ baseType: "float" }),
                    assembly: stray,
                    instance: strayNode(1),
                  },
                ]),
              {},
            );
            assert.isTrue(
              rejectedBy(placed, checkNamed("SectionFeedbackRef", "Feedback_outcome_type")),
            );
          }),
      );

      it.effect(
        "refuses a choice's or template element's template variable of another type, in an item's or a section's placement, and accepts a portable custom interaction's, by Template variable type",
        () =>
          // Oracle: PostgreSQL, the `Template_variable_type` check (reading R15-l), on each of the
          // two relations that hold a template reference.
          // Bound: an integer template named by a choice, refused; an identifier template of
          // multiple cardinality named by a choice, and an integer template named by a PCI's
          // qti-template-variable, accepted by this check; the placed section reference of an
          // integer template, refused.
          Effect.gen(function* templateType() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const wrong = yield* db.apply(
              ChangeSet.empty(Author).insert(TemplateRef, [templateOf({ baseType: "integer" })]),
              {},
            );
            assert.isTrue(rejectedBy(wrong, checkNamed("TemplateRef", "Template_variable_type")));

            for (const row of [
              templateOf({ cardinality: "multiple" }),
              templateOf({ baseType: "integer", kind: "qti-template-variable" }),
            ]) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(TemplateRef, [row]),
                {},
              );
              assert.isFalse(
                rejectedBy(outcome, checkNamed("TemplateRef", "Template_variable_type")),
                `${row.kind} ${row.baseType} ${row.cardinality}`,
              );
            }

            const { attribute, document, identifier, kind, node } = templateOf();
            const placed = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(ReferringDocument, [{ document }])
                .insert(SectionTemplateName, [{ attribute, document, identifier, kind, node }])
                .insert(SectionScope, [{ assembly: stray, document, instance: strayNode(1) }])
                .insert(SectionTemplateRef, [
                  {
                    ...templateOf({ baseType: "integer" }),
                    assembly: stray,
                    instance: strayNode(1),
                  },
                ]),
              {},
            );
            assert.isTrue(
              rejectedBy(placed, checkNamed("SectionTemplateRef", "Template_variable_type")),
            );
          }),
      );

      it.effect(
        "refuses a reference to an undeclared name, and accepts one to the built-in completionStatus, by the containment into Declaration",
        () =>
          // Oracle: PostgreSQL, the foreign key of a printed variable's `index` reference into
          // `declarationRef` (the old `varref-copy`), selected out for a built-in's name, and the
          // `Printed_variable_reference` check that resolves the built-in. 23503 on that key.
          // Bound: an undeclared name, refused; completionStatus under the nil declaration,
          // accepted.
          Effect.gen(function* varRef() {
            const client = yield* loginSession;
            const keys = yield* foreignKeysBetween(client, "var_ref", "declaration");
            assert.isNotEmpty(keys);

            const undeclared = Option.getOrUndefined(
              yield* judged(client, statedInserts([indexReference("UNDECLARED", stray)]), keys),
            );
            assert.strictEqual(undeclared?.code, "23503");
            assert.include(keys, undeclared?.constraint);

            const builtIn = Option.getOrUndefined(
              yield* judged(
                client,
                statedInserts([indexReference("completionStatus", nilUuid)]),
                keys,
              ),
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
              baseTypeLexical: "identifier",
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
            } satisfies Fact<typeof Declaration>;

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
