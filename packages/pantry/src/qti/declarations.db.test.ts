/**
 * The O2 overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3),
 * written to run at N1 and never by a hand: each refused state is one the law's model refuses,
 * named by the law it breaks, and each control is the same row with the one fact the law reads
 * made lawful.
 *
 * - A key the host finds is written through the author role (`db.apply`): two declarations of one
 *   identifier in one document, inserted with their owner, are refused before any SQL,
 *   `invariant-rejected` with the key law among its `refused.laws` (membership, C22). A
 *   `Declaration` is a member of its identifier's family, `ChoiceVariableName.declarations`, whose
 *   owner is immutable, so the change inserts that owner beside its members (README, "Families":
 *   "An immutable owner's family is fixed when the owner is inserted").
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
import type { Addition, Law } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { BaseType, Cardinality } from "#pantry/grammar/install.ts";
import {
  contextVariable,
  Declaration,
  DeclarationBaseType,
  declarationKinds,
  DeclarationName,
  DeclaredValue,
  MasteryCeiling,
  MasteryFloor,
  reservedBaseTypes,
  sessionVariables,
  ValueBaseType,
  ValueSet,
} from "#pantry/qti/declarations.ts";
import { ChoiceVariableName } from "#pantry/qti/interactions.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Author } from "#pantry/qti/roles.ts";
import { assertVerdict, judged, loginSession, statedInserts } from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
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
 * A declaration's facts: its `Declaration` row's, and its `DeclarationName`'s but the count of
 * base types, which {@link declared} copies from the base type it writes.
 */
interface DeclarationFacts {
  readonly name: Stated["fact"];
  readonly row: Stated["fact"];
}

/**
 * A declaration's facts, lawful on their own beside its base type's row ({@link declared}): an
 * outcome `A` of single cardinality, its lexical forms the handles' own, and its name, which
 * copies its row's document, kind and cardinality (spec reading 157).
 *
 * @param fields - The fields the case sets.
 * @param fields.cardinality - Its cardinality.
 * @param fields.cardinalityLexical - Its `cardinality` as written.
 * @param fields.identifier - Its collapsed identifier, written bare.
 * @param fields.kind - Its kind.
 * @returns The facts.
 */
const declarationRow = (fields: {
  readonly cardinality?: string;
  readonly cardinalityLexical?: string;
  readonly identifier?: string;
  readonly kind?: string;
}): DeclarationFacts => {
  const kind = fields.kind ?? "qti-outcome-declaration";
  const cardinality = fields.cardinality ?? "single";
  const identifier = fields.identifier ?? "A";

  return {
    name: {
      cardinality,
      declarationKind: kind,
      document: strayDocument,
      identifier,
      identifierLead: "",
      identifierLexical: identifier,
      identifierTrail: "",
      node: strayNode(1),
    },
    row: {
      cardinality,
      cardinalityLexical: fields.cardinalityLexical ?? cardinality,
      declarationKind: kind,
      document: strayDocument,
      kind,
      nearest: strayDocument,
      node: strayNode(1),
      parent: strayDocument,
      start: 1n,
      version: "3.0.1",
    },
  };
};

/**
 * A declaration's rows with its name's owner: its `Declaration`, its `DeclarationName`, which
 * copies the row's document, kind, cardinality and count of base types (spec reading 157), and the
 * `ChoiceVariableName` row of its document and identifier, which states no choice, hottext or
 * placement and so counts it as its one declaration, and "Choice not variable" holds whatever the
 * identifier. The writer orders them and fills the name's slot in its family
 * (`#pantry/test/direct-sql.ts` `statedInserts`): a counted family's owner axis is not deferrable,
 * so the name is judged against its owner at its INSERT, and the owner's own foreign keys are
 * deferred.
 *
 * @param facts - The declaration's facts, {@link declarationRow}'s, whose node is `strayNode(1)`.
 * @param baseType - Its base type, a member of its family, `float` unless the case sets one, and
 *   none for a declaration that writes none, a record's.
 * @returns The rows, in writing order.
 */
const declared = (
  { name, row }: DeclarationFacts,
  baseType: Option.Option<string> = Option.some("float"),
) =>
  statedInserts([
    {
      fact: {
        document: name["document"] ?? strayDocument,
        identifier: name["identifier"] ?? "",
        rootKind: "qti-assessment-item",
      },
      relation: ChoiceVariableName,
    },
    { fact: row, relation: Declaration },
    ...Option.toArray(baseType).map((code): Stated => ({
      fact: { baseType: code, baseTypeLexical: code, node: strayNode(1), valueBase: code },
      relation: DeclarationBaseType,
    })),
    {
      fact: { ...name, baseTypes: BigInt(Option.toArray(baseType).length) },
      relation: DeclarationName,
    },
  ]);

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
 * @returns The fact.
 */
const declarationFact = (node: number): Addition<typeof Declaration> => ({
  cardinality: "single",
  cardinalityLexical: "single",
  declarationKind: "qti-outcome-declaration",
  document: strayDocument,
  kind: "qti-outcome-declaration",
  nearest: strayDocument,
  node: strayNode(node),
  parent: strayDocument,
  parentKind: "qti-assessment-item",
  start: BigInt(node),
  version: "3.0.1",
});

/**
 * A declaration's name fact as the author role writes it, lawful beside {@link declarationFact}'s
 * row of its node, which writes no base type.
 *
 * @param node - Its node.
 * @param identifierLexical - Its identifier as written; its name is that collapsed.
 * @returns The fact.
 */
const nameFact = (node: number, identifierLexical: string): Addition<typeof DeclarationName> => ({
  baseTypes: 0n,
  cardinality: "single",
  declarationKind: "qti-outcome-declaration",
  document: strayDocument,
  identifier: identifierLexical.trim(),
  identifierLead: identifierLexical.startsWith(" ") ? " " : "",
  identifierLexical,
  identifierTrail: "",
  node: strayNode(node),
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
 * is outside the form `Mastery_range` judges (a recorded limit).
 *
 * @param lexical - The lexical form, as written.
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
 * Whether one scale value is above another, both written and read as `xs:double`: false where
 * either is unjudged, and where either is `NaN`, which orders against nothing.
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
 * The scale texts of the mastery box, each written: ordinary values, both infinities, `NaN`, and a
 * value with outer whitespace, outside the form the law judges. An unwritten attribute has no row,
 * and no pair holds it.
 */
const scaleTexts = ["0", "0.5", "1", "-INF", "INF", "NaN", " 0.5"] as const;

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
                  .insert(Declaration, [declarationFact(1), declarationFact(2)])
                  .insert(DeclarationName, [nameFact(1, "A"), nameFact(2, second)]),
                {},
              );

              assert.strictEqual(outcome.kind, "invariant-rejected", second);
              assert.isTrue(
                outcome.kind === "invariant-rejected" &&
                  outcome.refused.laws.some(keyOver("DeclarationName", ["document", "identifier"])),
                Formatter.format(second),
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
                      declarationRow({ identifier, kind }),
                      Option.some(identifier === "SCORE" ? "float" : "identifier"),
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
          // (3 × 4 × 11), so the same name of another kind is the control, then QTI_CONTEXT
          // against every declaration kind and cardinality (4 × 4), 148 cases.
          Effect.gen(function* reservedType() {
            const client = yield* loginSession;
            for (const { baseType: kept, identifier, kind: typedKind } of reservedBaseTypes) {
              for (const kind of declarationKinds) {
                for (const baseType of BaseType.handles) {
                  assertVerdict(
                    yield* judged(
                      client,
                      declared(declarationRow({ identifier, kind }), Option.some(baseType)),
                    ),
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
                  cardinality,
                  identifier: contextVariable.identifier,
                  kind,
                });
                assertVerdict(
                  yield* judged(
                    client,
                    declared(row, cardinality === "record" ? Option.none() : Option.some("string")),
                  ),
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
          // is the handle its lexical form spells, and `base-type` and `cardinality` restrict
          // xs:string, so a padded form spells no handle; and a base type's `ValueBaseOf` image is
          // its expression type.
          // Bound: each kind of disagreement, named, and its control, on a declaration's row and on
          // a declaration's and a value's base type row.
          Effect.gen(function* codes() {
            const client = yield* loginSession;
            const baseTypes = [
              {
                baseType: "float",
                baseTypeLexical: "float",
                label: "control",
                refused: false,
                valueBase: "float",
              },
              {
                baseType: "integer",
                baseTypeLexical: "float",
                label: "integer written float",
                refused: true,
                valueBase: "integer",
              },
              {
                baseType: "float",
                baseTypeLexical: " float",
                label: "padded",
                refused: true,
                valueBase: "float",
              },
              {
                baseType: "float",
                baseTypeLexical: "",
                label: "empty",
                refused: true,
                valueBase: "float",
              },
              {
                baseType: "float",
                baseTypeLexical: "float",
                label: "expression type integer",
                refused: true,
                valueBase: "integer",
              },
            ];
            // A value's own base type has no expression type, so its row is lawful where only a
            // declaration's expression type disagrees.
            for (const { baseType, baseTypeLexical, label, refused, valueBase } of baseTypes) {
              const valueRefused = refused && baseType === valueBase;
              assertVerdict(
                yield* judged(
                  client,
                  statedInserts([
                    {
                      fact: { baseType, baseTypeLexical, node: strayNode(1), valueBase },
                      relation: DeclarationBaseType,
                    },
                  ]),
                ),
                "e_1_derived",
                refused,
                `declaration base type ${label}`,
              );
              assertVerdict(
                yield* judged(
                  client,
                  statedInserts([
                    {
                      fact: {
                        baseType,
                        baseTypeLexical,
                        cardinality: "record",
                        node: strayNode(3),
                        text: "1",
                      },
                      relation: ValueBaseType,
                    },
                  ]),
                ),
                "e_1_derived",
                valueRefused,
                `value base type ${label}`,
              );
            }

            const control = declarationRow({});
            const padded = declarationRow({ identifier: " A" });
            const cases = [
              { facts: control, label: "control", refused: false },
              {
                facts: declarationRow({ cardinalityLexical: "multiple" }),
                label: "cardinality single written multiple",
                refused: true,
              },
              {
                facts: { ...control, name: { ...control.name, identifierLexical: " A" } },
                label: "identifier padded but written bare",
                refused: true,
              },
              {
                facts: {
                  ...control,
                  name: { ...control.name, identifierLead: " ", identifierLexical: " A" },
                },
                label: "identifier padded, its lead written",
                refused: false,
              },
              {
                facts: { ...padded, name: { ...padded.name, identifierLexical: " A" } },
                label: "identifier holding its own whitespace",
                refused: true,
              },
            ];
            for (const { facts, label, refused } of cases) {
              assertVerdict(yield* judged(client, declared(facts)), "e_1_derived", refused, label);
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
          // Bound: every cardinality (4) without a base type's row and with `float`'s, 8 cases.
          Effect.gen(function* baseTypeLaw() {
            const client = yield* loginSession;
            for (const cardinality of Cardinality.handles) {
              for (const baseType of [Option.none(), Option.some("float")]) {
                assertVerdict(
                  yield* judged(client, declared(declarationRow({ cardinality }), baseType)),
                  "declaration_base_type",
                  (cardinality === "record") === Option.isSome(baseType),
                  `${cardinality} ${Option.getOrElse(baseType, () => "no base type")}`,
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
                    yield* judged(
                      client,
                      statedInserts([
                        {
                          fact: {
                            baseTypes: record ? 0n : 1n,
                            cardinality,
                            declarationKind: "qti-outcome-declaration",
                            document: strayDocument,
                            elementChildren: BigInt(values),
                            elements: 1n,
                            fields: BigInt(fields),
                            kind: "qti-default-value",
                            nearest: strayDocument,
                            node: strayNode(2),
                            parent: strayNode(1),
                            start: 2n,
                            version: "3.0.1",
                          },
                          relation: ValueSet,
                        },
                      ]),
                    ),
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
          // which admits every text, 13 more; each as a single set's value in its declaration's
          // base type (`DeclaredValue`), and as a value's own base type in a record's set, where it
          // is judged, and in a single set, where it is not (§7.46.2: a value's base-type "is only
          // used for" a record's field).
          Effect.gen(function* typedValue() {
            const client = yield* loginSession;
            for (const baseType of [...judgedBaseTypes, "string"]) {
              for (const { text, values } of typedTexts) {
                const refused = baseType !== "string" && !values.includes(baseType);
                assertVerdict(
                  yield* judged(
                    client,
                    statedInserts([
                      {
                        fact: { baseType, declaration: strayNode(1), node: strayNode(3), text },
                        relation: DeclaredValue,
                      },
                    ]),
                  ),
                  "typed_value",
                  refused,
                  `${baseType} ${JSON.stringify(text)}`,
                );
                for (const cardinality of ["record", "single"]) {
                  assertVerdict(
                    yield* judged(
                      client,
                      statedInserts([
                        {
                          fact: {
                            baseType,
                            baseTypeLexical: baseType,
                            cardinality,
                            node: strayNode(3),
                            text,
                          },
                          relation: ValueBaseType,
                        },
                      ]),
                    ),
                    "typed_value",
                    cardinality === "record" && refused,
                    `own ${baseType} in a ${cardinality} set ${JSON.stringify(text)}`,
                  );
                }
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
          // Bound: every pair (minimum, mastery) and (mastery, maximum) over 7 written texts, 98
          // cases, each a row of the pair it is.
          Effect.gen(function* masteryRange() {
            const client = yield* loginSession;
            for (const low of scaleTexts) {
              for (const high of scaleTexts) {
                assertVerdict(
                  yield* judged(
                    client,
                    statedInserts([
                      {
                        fact: { masteryValue: high, node: strayNode(1), normalMinimum: low },
                        relation: MasteryFloor,
                      },
                    ]),
                  ),
                  "mastery_range",
                  above(low, high),
                  `floor ${JSON.stringify([low, high])}`,
                );
                assertVerdict(
                  yield* judged(
                    client,
                    statedInserts([
                      {
                        fact: { masteryValue: low, node: strayNode(1), normalMaximum: high },
                        relation: MasteryCeiling,
                      },
                    ]),
                  ),
                  "mastery_range",
                  above(low, high),
                  `ceiling ${JSON.stringify([low, high])}`,
                );
              }
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );
    },
  );
});
