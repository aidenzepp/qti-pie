/**
 * The O2 overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3),
 * written to run at N1 and never by a hand: each refused state is one the law's model refuses,
 * named by the law it breaks, and each control is the same row with the one fact the law reads
 * made lawful.
 *
 * - A key the host finds is written through the author role (`db.apply`): two declarations of one
 *   identifier in one document, inserted with their owner, are refused before any SQL,
 *   `invariant-rejected` with the key law among its `laws` (membership, C22). A `Declaration` is a
 *   member of its identifier's family, `ChoiceVariableName.declarations`, whose owner is immutable,
 *   so the change inserts that owner beside its members (README, "Families": "An immutable owner's
 *   family is fixed when the owner is inserted").
 * - A row's own CHECKs are judged by a direct SQL writer, as the rules file's rule 8 and grizzle's
 *   README ("Direct SQL access") state it: the author login, `SET ROLE` to the author role,
 *   SERIALIZABLE, every deferrable foreign key deferred, the row inserted into its table with every
 *   column a writer fills (a declaration's hidden index and copy of its owner's count by the
 *   comment grizzle installs on each, its owner inserted first, since a counted family's owner axis
 *   is judged at the INSERT), and a rollback. A role writes a table, never its own view of it,
 *   which it holds SELECT on alone (README, "Security model"). A refused case's verdict is SQLSTATE
 *   23514 and the constraint that states the law; a control's is no error. Each row breaks at most
 *   the one check under test, so the constraint PostgreSQL names is that check's.
 *
 * The cases over a stored document (a value set or value with no row, a copy that disagrees with
 * its attribute, a value whose text is not its node's string value, and a reference to
 * `completion_status`, which P8 refuses as Q5.10's `VariableRef` states it) need a whole valid
 * package written first, and arrive with the importer (Q5.15); probe P2 restates them.
 */
import { ChangeSet, Db, lexicalForm, pg } from "@bjornpagen/grizzle";
import type { Addition, Fact, Law } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import {
  BaseType,
  Cardinality,
  DeclarationKind,
  NodeKind,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import {
  contextVariable,
  Declaration,
  declarationKinds,
  reservedBaseTypes,
  sessionVariables,
} from "#pantry/qti/declarations.ts";
import { ChoiceVariableName } from "#pantry/qti/interactions.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Author } from "#pantry/qti/roles.ts";
import { assertVerdict, codeOf, judged, loginSession } from "#pantry/test/direct-sql.ts";
import type { Insert, SqlRow } from "#pantry/test/direct-sql.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * A uuid no stored row holds, numbered: the stray rows below name it as their node.
 *
 * @param at - The number.
 * @returns The uuid.
 */
const strayNode = (at: number): `${string}-${string}-${string}-${string}-${string}` =>
  `00000000-0000-4000-8000-${at.toString(16).padStart(12, "0")}`;

/**
 * The stray document every row names.
 */
const strayDocument = strayNode(255);

/**
 * A declaration row as a direct writer writes it, lawful on its own: an outcome `A` of base type
 * float and single cardinality, its lexical forms the codes' own.
 *
 * @param fields - The columns the case sets, codes by handle.
 * @param fields.baseType - Its base type.
 * @param fields.baseTypeLexical - Its `base-type` as written.
 * @param fields.cardinality - Its cardinality.
 * @param fields.cardinalityLexical - Its `cardinality` as written.
 * @param fields.identifier - Its collapsed identifier, written bare.
 * @param fields.kind - Its kind.
 * @returns The row.
 */
const declarationRow = (fields: {
  readonly baseType?: string;
  readonly baseTypeLexical?: string;
  readonly cardinality?: string;
  readonly cardinalityLexical?: string;
  readonly identifier?: string;
  readonly kind?: string;
}) => {
  const kind = fields.kind ?? "qti-outcome-declaration";
  const baseType = fields.baseType ?? "float";
  const cardinality = fields.cardinality ?? "single";
  const identifier = fields.identifier ?? "A";

  return {
    base_type: codeOf(BaseType.handles, baseType),
    base_type_lexical: fields.baseTypeLexical ?? (baseType === "none" ? "" : baseType),
    cardinality: codeOf(Cardinality.handles, cardinality),
    cardinality_lexical: fields.cardinalityLexical ?? cardinality,
    declaration_kind: codeOf(DeclarationKind.handles, kind),
    document: strayDocument,
    identifier,
    identifier_lead: "",
    identifier_lexical: identifier,
    identifier_trail: "",
    kind: codeOf(NodeKind.handles, kind),
    nearest: strayDocument,
    node: strayNode(1),
    parent: strayDocument,
    start: 1,
    version: codeOf(SchemaVersion.handles, "3.0.1"),
  } satisfies SqlRow;
};

/**
 * The family whose owner is each identifier a document's declarations use,
 * `ChoiceVariableName.declarations` over `Declaration`.
 */
const declarationFamily = "ChoiceVariableName.declarations";

/**
 * A declaration row's statements, its owner first: the `ChoiceVariableName` row of its document and
 * identifier, counting it as its one declaration and bearing no choice or hottext, so "Choice not
 * variable" holds whatever the identifier, then the declaration at slot 0 of 1 of its family. A
 * counted family's owner axis is not deferrable, so the declaration is judged against its owner at
 * its INSERT; the owner's own foreign keys are deferred.
 *
 * @param row - The declaration's row.
 * @returns The two statements' rows.
 */
const declared = (row: SqlRow): readonly Insert[] => [
  {
    row: {
      choices: 0,
      declarations: 1,
      document: row["document"] ?? strayDocument,
      hottexts: 0,
      identifier: row["identifier"] ?? "",
      placed_choices: 0,
      placed_hottexts: 0,
      root_kind: codeOf(NodeKind.handles, "qti-assessment-item"),
    },
    table: "choice_variable_name",
  },
  {
    hidden: {
      [`the index of the family ${declarationFamily}`]: 0,
      [`the owner's count of the family ${declarationFamily}`]: 1,
    },
    row,
    table: "declaration",
  },
];

/**
 * The `ChoiceVariableName` fact of the one identifier a key case's declarations use, the owner the
 * change inserts beside its members: its counts are the family's to draw.
 */
const declaredName: Addition<typeof ChoiceVariableName> = {
  document: strayDocument,
  identifier: "A",
  rootKind: "qti-assessment-item",
};

/**
 * A declaration fact as the author role writes it, lawful on its own.
 *
 * @param node - Its node.
 * @param identifierLexical - Its identifier as written; its name is that collapsed.
 * @returns The fact.
 */
const declarationFact = (node: number, identifierLexical: string): Fact<typeof Declaration> => ({
  baseType: "float",
  baseTypeLexical: "float",
  cardinality: "single",
  cardinalityLexical: "single",
  declarationKind: "qti-outcome-declaration",
  document: strayDocument,
  identifier: identifierLexical.trim(),
  identifierLead: identifierLexical.startsWith(" ") ? " " : "",
  identifierLexical,
  identifierTrail: "",
  kind: "qti-outcome-declaration",
  nearest: strayDocument,
  node: strayNode(node),
  parent: strayDocument,
  start: BigInt(node),
  version: "3.0.1",
});

/**
 * Pick the key law over one relation's own fields, in order.
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
    law.side.selection.conjuncts.length === 0 &&
    law.side.terms.length === fields.length &&
    law.side.terms.every((term, at) => term.kind === "field" && term.field === fields[at]);

/**
 * The lexical form `Mastery_range` parses: grizzle's double precision form, read by a JavaScript
 * host.
 */
const doubleForm = new RegExp(lexicalForm(pg["double precision"]), "u");

/**
 * Read a scale attribute as the specification's model reads it: an `xs:double`, or none where it
 * is unwritten or outside the form `Mastery_range` judges (a recorded limit).
 *
 * @param lexical - The lexical form, empty where unwritten.
 * @returns The value.
 */
const scaleValue = (lexical: string): Option.Option<number> => {
  if (!doubleForm.test(lexical)) {
    return Option.none();
  }

  if (lexical === "INF") {
    return Option.some(Number.POSITIVE_INFINITY);
  }

  return Option.some(lexical === "-INF" ? Number.NEGATIVE_INFINITY : Number(lexical));
};

/**
 * Whether one scale value is above another, both read as `xs:double`: false where either is
 * unwritten or unjudged, and where either is `NaN`, which orders against nothing.
 *
 * @param low - The lexical form that must not be above.
 * @param high - The lexical form that must not be below.
 * @returns Whether it is above.
 */
const above = (low: string, high: string): boolean =>
  Option.match(Option.all([scaleValue(low), scaleValue(high)]), {
    onNone: () => false,
    onSome: ([l, h]) => l > h,
  });

/**
 * Whether the Schematron's OUTCOMEDEC 1, read by its intent (spec reading 9), refuses a scale: a
 * written mastery value below a written minimum or above a written maximum, as `xs:double` values
 * order, `NaN` against nothing.
 *
 * @param minimum - `normal-minimum`'s lexical form.
 * @param mastery - `mastery-value`'s.
 * @param maximum - `normal-maximum`'s.
 * @returns Whether the range law refuses it.
 */
const outOfRange = (minimum: string, mastery: string, maximum: string): boolean =>
  above(minimum, mastery) || above(mastery, maximum);

/**
 * The scale texts of the mastery box: unwritten, ordinary values, both infinities, `NaN`, and a
 * value with outer whitespace, outside the form the law judges.
 */
const scaleTexts = ["", "0", "0.5", "1", "-INF", "INF", "NaN", " 0.5"] as const;

/**
 * The texts of the typed-value box, each with the base types it is a value of, constructed from
 * the specification (readings 7, 34 and 45; `xs:double`; §8.13), as the free test's box is.
 */
const typedTexts: readonly { readonly text: string; readonly values: readonly string[] }[] = [
  { text: "true", values: ["boolean", "identifier"] },
  { text: " false\n", values: ["boolean", "identifier"] },
  { text: "1", values: ["integer", "float", "duration"] },
  { text: "\t-12 ", values: ["integer", "float", "duration"] },
  { text: "123456789012345678901234567890", values: ["integer", "float", "duration"] },
  { text: "1.5", values: ["float", "duration"] },
  { text: "INF", values: ["float", "duration", "identifier"] },
  { text: "A", values: ["identifier"] },
  { text: "x y", values: ["pair", "directedPair"] },
  { text: "10 20", values: ["point"] },
  { text: "", values: [] },
  { text: "1a", values: [] },
  { text: "+INF", values: [] },
];

/**
 * The base types the typed-value box judges: every one with a pattern but `uri`, whose pattern is
 * AL1's lexical half's (Q5.05).
 */
const judgedBaseTypes = [
  "boolean",
  "integer",
  "float",
  "duration",
  "identifier",
  "point",
  "pair",
  "directedPair",
] as const;

describe.skipIf(!hasLease)("qti/declarations.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer, { timeout: authorLayerHookTimeoutMs })(
    "the O2 overlays' laws, judged by PostgreSQL",
    (it) => {
      it.effect(
        "refuses a second declaration of one identifier in one document, padded or not, by Declaration key",
        () =>
          // Oracle: the specification as a checker, reading 74: no two declarations of a document
          // share an identifier, compared collapsed (XML Schema Part 2, §4.3.6).
          // Bound: two declarations, the second's lexical form `A` and ` A`, with the owner of their
          // identifier's family, which an insert of a member of an immutable owner's family needs
          // in its own change; the host finds the key, so `laws` holds it whether or not any SQL
          // ran.
          Effect.gen(function* declarationKey() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const second of ["A", " A"]) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author)
                  .insert(ChoiceVariableName, [declaredName])
                  .insert(Declaration, [declarationFact(1, "A"), declarationFact(2, second)]),
                {},
              );

              assert.strictEqual(outcome.kind, "invariant-rejected", second);
              assert.isTrue(
                outcome.kind === "invariant-rejected" &&
                  outcome.laws.some(keyOver("Declaration", ["document", "identifier"])),
                JSON.stringify(second),
              );
            }
          }),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "refuses a declaration of a built-in session variable of any kind, and admits completion_status and QTI_CONTEXT's record context, by Declaration not reserved",
        () =>
          // Oracle: the specification as a checker, §2.2.2 and tables 4.5.1, 5.115.1, 5.151.1 with
          // reading 72: the session variables are reserved in every declaration of every document,
          // spelled exactly; every other name is no built-in's.
          // Bound: every declaration kind (4) against the session variables (3) and three controls,
          // `completion_status`, `completion-status` and `SCORE`, 24 cases.
          Effect.gen(function* notReserved() {
            const client = yield* loginSession;
            for (const kind of declarationKinds) {
              for (const identifier of [
                ...sessionVariables,
                "completion_status",
                "completion-status",
                "SCORE",
              ]) {
                const refused = sessionVariables.includes(identifier);
                assertVerdict(
                  yield* judged(
                    client,
                    declared(
                      declarationRow({
                        baseType: identifier === "SCORE" ? "float" : "identifier",
                        identifier,
                        kind,
                      }),
                    ),
                  ),
                  "declaration_not_reserved",
                  refused,
                  `${kind} ${identifier}`,
                );
              }
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "refuses SCORE, MAXSCORE or PASSED of another base type, and QTI_CONTEXT of another kind or cardinality, by Reserved type",
        () =>
          // Oracle: the specification as a checker, §2.2.2.3 ("SCORE MUST be a float", "MAXSCORE
          // MUST be a float", "PASSED MUST be a boolean") of an outcome, and §2.2.2.1's record
          // context variable QTI_CONTEXT, with reading 74.
          // Bound: each typed outcome name under every declaration kind against every base type
          // but `none` (3 × 4 × 11), so the same name of another kind is the control, then
          // QTI_CONTEXT against every declaration kind and cardinality (4 × 4), 148 cases.
          Effect.gen(function* reservedType() {
            const client = yield* loginSession;
            for (const { baseType: kept, identifier, kind: typedKind } of reservedBaseTypes) {
              for (const kind of declarationKinds) {
                for (const baseType of BaseType.handles.filter((handle) => handle !== "none")) {
                  assertVerdict(
                    yield* judged(client, declared(declarationRow({ baseType, identifier, kind }))),
                    "reserved_type",
                    kind === typedKind && baseType !== kept,
                    `${kind} ${identifier} ${baseType}`,
                  );
                }
              }
            }

            for (const kind of declarationKinds) {
              for (const cardinality of Cardinality.handles) {
                const row = declarationRow({
                  baseType: cardinality === "record" ? "none" : "string",
                  cardinality,
                  identifier: contextVariable.identifier,
                  kind,
                });
                assertVerdict(
                  yield* judged(client, declared(row)),
                  "reserved_type",
                  kind !== contextVariable.kind || cardinality !== contextVariable.cardinality,
                  `QTI_CONTEXT ${kind} ${cardinality}`,
                );
              }
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "refuses a code that disagrees with its lexical form, through direct SQL, by E1 derived",
        () =>
          // Oracle: the closed relations, `BaseTypeLexical` and `CardinalityLexical` (C17): a code
          // is the handle its lexical form spells, `none` exactly where none is written, and
          // `base-type` and `cardinality` restrict xs:string, so a padded form spells no handle.
          // Bound: each kind of disagreement, named, and its control.
          Effect.gen(function* codes() {
            const client = yield* loginSession;
            const cases = [
              { label: "control", refused: false, row: declarationRow({}) },
              {
                label: "base type integer written float",
                refused: true,
                row: declarationRow({ baseType: "integer", baseTypeLexical: "float" }),
              },
              {
                label: "base type float written padded",
                refused: true,
                row: declarationRow({ baseTypeLexical: " float" }),
              },
              {
                label: "base type none written float",
                refused: true,
                row: declarationRow({
                  baseType: "none",
                  baseTypeLexical: "float",
                  cardinality: "record",
                }),
              },
              {
                label: "base type float written empty",
                refused: true,
                row: declarationRow({ baseTypeLexical: "" }),
              },
              {
                label: "cardinality single written multiple",
                refused: true,
                row: declarationRow({ cardinalityLexical: "multiple" }),
              },
              {
                label: "identifier padded but written bare",
                refused: true,
                row: { ...declarationRow({}), identifier_lexical: " A" },
              },
              {
                label: "identifier padded, its lead written",
                refused: false,
                row: { ...declarationRow({}), identifier_lead: " ", identifier_lexical: " A" },
              },
              {
                label: "identifier holding its own whitespace",
                refused: true,
                row: { ...declarationRow({ identifier: " A" }), identifier_lexical: " A" },
              },
            ];
            for (const { label, refused, row } of cases) {
              assertVerdict(yield* judged(client, declared(row)), "e_1_derived", refused, label);
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "refuses a record with a base type and any other variable without one, by Declaration base type",
        () =>
          // Oracle: the specification as a checker, the information model's tables 4.5.3,
          // 5.34.3, 5.115.3 and 5.151.3: "Variables with record cardinality have no base-type",
          // and every other variable's value space "is identified with a base-type".
          // Bound: every cardinality (4) against `none` and `float`, 8 cases.
          Effect.gen(function* baseTypeLaw() {
            const client = yield* loginSession;
            for (const cardinality of Cardinality.handles) {
              for (const baseType of ["none", "float"]) {
                assertVerdict(
                  yield* judged(client, declared(declarationRow({ baseType, cardinality }))),
                  "declaration_base_type",
                  (cardinality === "record") !== (baseType === "none"),
                  `${cardinality} ${baseType}`,
                );
              }
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "refuses a single value set of other than one value and a record set whose values are not all its fields, by Value cardinality",
        () =>
          // Oracle: the specification as a checker, §8.16: single is "a single value", a record "a
          // set of independent values each identified by its own identifier"; §7.46.1-2: a value
          // is a field exactly in a record.
          // Bound: every cardinality (4) against 1 or 2 values and 0 to 2 fields, 24 cases.
          Effect.gen(function* valueCardinality() {
            const client = yield* loginSession;
            for (const cardinality of Cardinality.handles) {
              for (const values of [1, 2]) {
                for (const fields of [0, 1, 2]) {
                  const record = cardinality === "record";
                  const lawful =
                    (cardinality !== "single" || values === 1) &&
                    (record ? fields === values : fields === 0);
                  assertVerdict(
                    yield* judged(client, [
                      {
                        row: {
                          base_type: codeOf(BaseType.handles, record ? "none" : "float"),
                          cardinality: codeOf(Cardinality.handles, cardinality),
                          declaration_kind: codeOf(
                            DeclarationKind.handles,
                            "qti-outcome-declaration",
                          ),
                          document: strayDocument,
                          element_children: values,
                          elements: 1,
                          fields,
                          identifier: "A",
                          kind: codeOf(NodeKind.handles, "qti-default-value"),
                          nearest: strayDocument,
                          node: strayNode(2),
                          parent: strayNode(1),
                          start: 2,
                          version: codeOf(SchemaVersion.handles, "3.0.1"),
                        },
                        table: "value_set",
                      },
                    ]),
                    "value_cardinality",
                    !lawful,
                    `${cardinality} ${String(values)} values ${String(fields)} fields`,
                  );
                }
              }
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "admits a value's text exactly when it is a lexical form of its base type, by Typed value",
        () =>
          // Oracle: the specification as a checker, each text's base types constructed from
          // readings 7, 34 and 45, xs:double and §8.13, as the free test's box: PostgreSQL's regex
          // engine judging the same patterns a JavaScript host checks there.
          // Bound: 8 judged base types against 13 texts, 104 cases, and each text under `string`,
          // which admits every text, 13 more.
          Effect.gen(function* typedValue() {
            const client = yield* loginSession;
            for (const baseType of [...judgedBaseTypes, "string"]) {
              for (const { text, values } of typedTexts) {
                assertVerdict(
                  yield* judged(client, [
                    {
                      row: {
                        base_type: codeOf(BaseType.handles, baseType),
                        document: strayDocument,
                        kind: codeOf(NodeKind.handles, "qti-value"),
                        nearest: strayDocument,
                        node: strayNode(3),
                        parent: strayNode(2),
                        set_base_type: codeOf(BaseType.handles, baseType),
                        start: 3,
                        text,
                        version: codeOf(SchemaVersion.handles, "3.0.1"),
                      },
                      table: "value",
                    },
                  ]),
                  "typed_value",
                  baseType !== "string" && !values.includes(baseType),
                  `${baseType} ${JSON.stringify(text)}`,
                );
              }
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "refuses a mastery value below its normal minimum or above its normal maximum, as xs:double values order, by Mastery range",
        () =>
          // Oracle: the specification as a checker, the Schematron's OUTCOMEDEC 1 read by its intent
          // (reading 9): `not(@mastery-value < @normal-minimum)` and `not(@mastery-value >
          // @normal-maximum)` over written values as xs:double, NaN ordered against nothing, a form
          // outside grizzle's double form unjudged (the recorded limit).
          // Bound: every (minimum, mastery, maximum) over 8 texts, 512 cases.
          Effect.gen(function* masteryRange() {
            const client = yield* loginSession;
            for (const minimum of scaleTexts) {
              for (const mastery of scaleTexts) {
                for (const maximum of scaleTexts) {
                  assertVerdict(
                    yield* judged(client, [
                      {
                        row: {
                          mastery_value: mastery,
                          node: strayNode(1),
                          normal_maximum: maximum,
                          normal_minimum: minimum,
                        },
                        table: "outcome_range",
                      },
                    ]),
                    "mastery_range",
                    outOfRange(minimum, mastery, maximum),
                    JSON.stringify([minimum, mastery, maximum]),
                  );
                }
              }
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );
    },
  );
});
