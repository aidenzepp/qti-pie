/**
 * The expression and processing laws on the lease, PostgreSQL itself the judge (testing doctrine,
 * rule 3): each refused row is one the law's model refuses, named by the law it breaks.
 *
 * Every case writes rows through the author role (`db.apply`) whose nodes no stored document
 * holds, so every containment into `Node`, `Declaration` and the other overlays fails at commit;
 * each law under test is a row CHECK, judged as its row is inserted, before any of them. So a row
 * that breaks the law comes back `invariant-rejected` with the law among its `laws`, and a row that
 * keeps it comes back rejected by its containments alone, the law absent (membership, since a
 * merged native names several, C22).
 *
 * The whole-package cases, each fixture of `src/test/fixtures/processing/` imported and refused
 * under its rule or accepted, need the importer and arrive with it (Q5.15): every `broken`
 * fixture but the two accepted controls is refused with the law its frozen rule maps to
 * (`verdicts.tsv`), every `guards` fixture but `padded-processing.xml` with AL3, N7's `Last` or
 * N5's `Follow`, and every `valid` fixture is accepted.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { Addition, ApplyOutcome, Law } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { int8Max } from "#pantry/grammar/closed.ts";
import { expressionTypings } from "#pantry/grammar/expression.ts";
import { OperatorArity } from "#pantry/grammar/install.ts";
import {
  Expression,
  ExpressionAttribute,
  ItemTiming,
  Literal,
  MappingSource,
  Operand,
  ProcessingTemplate,
  Reading,
  TemplateDefault,
  VariableRef,
} from "#pantry/qti/expressions.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Author } from "#pantry/qti/roles.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * A node no stored row holds, the parent and document every case's rows name.
 */
const strayNode = "00000000-0000-4000-8000-0000000000f0";

/**
 * A fresh node of a case, numbered.
 *
 * @param index - The node's number.
 * @returns Its uuid.
 */
const nodeOf = (index: number) =>
  `00000000-0000-4000-8000-${(0x1_00_00 + index).toString(16).padStart(12, "0")}` as const;

/**
 * An expression's row, an operand of an outcome rule's: every field but those the case sets.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const expressionRow = (
  fields: Pick<Addition<typeof Expression>, "kind" | "node"> & Partial<Addition<typeof Expression>>,
): Addition<typeof Expression> => ({
  baseType: "unknown",
  cardinality: "unknown",
  document: strayNode,
  language: "outcome",
  nearest: strayNode,
  parent: strayNode,
  parentKind: "qti-set-outcome-value",
  start: 1n,
  version: "3.0.0",
  ...fields,
});

/**
 * An operand's row under an operator, of no known type unless the case says.
 *
 * @param operator - The operator's node.
 * @param rank - Its rank among the operator's operands, from 1.
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const operandRow = (
  operator: Addition<typeof Operand>["operator"],
  rank: number,
  fields: Partial<Addition<typeof Operand>> = {},
): Addition<typeof Operand> => ({
  baseType: "unknown",
  cardinality: "unknown",
  children: 0n,
  kind: "qti-null",
  language: "outcome",
  node: nodeOf(1000 + rank),
  operator,
  rank: BigInt(rank),
  ...fields,
});

/**
 * A processing reference's row: an unresolved `qti-variable`'s `identifier` in a response
 * processing template, every field but those the case sets.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const referenceRow = (
  fields: Partial<Addition<typeof VariableRef>>,
): Addition<typeof VariableRef> => ({
  after: "",
  attribute: "identifier",
  baseType: "unknown",
  before: "",
  cardinality: "unknown",
  declBaseType: "none",
  declCardinality: "single",
  declaration: strayNode,
  declarationKind: "qti-outcome-declaration",
  document: strayNode,
  elementBase: "unknown",
  elementCardinality: "unknown",
  heldBase: "unknown",
  heldCardinality: "unknown",
  identifier: "X",
  kind: "qti-variable",
  language: "response",
  lexical: "X",
  node: nodeOf(1),
  parent: strayNode,
  resolution: "unresolved",
  rootKind: "qti-response-processing",
  table: "none",
  timeDependent: false,
  ...fields,
});

/**
 * The type a kind's expression has over `count` operands of no known type, which every rule of
 * `E1_derived` and `ResultBase` keeps.
 *
 * @param kind - The kind.
 * @param count - Its operand count.
 * @returns Its base type and cardinality.
 */
const typeOver = (
  kind: string,
  count: number,
): Pick<Addition<typeof Expression>, "baseType" | "cardinality"> => {
  const typing = expressionTypings.find((row) => row.kind === kind);
  if (typing === undefined) {
    return { baseType: "unknown", cardinality: "unknown" };
  }

  const cardinality = typing.resultCardinalities[0] ?? "unknown";
  switch (typing.typing) {
    case "numeric": {
      return { baseType: count === 0 ? "float" : "unknown", cardinality };
    }
    case "container":
    case "first": {
      return { baseType: count === 0 ? "any" : "unknown", cardinality };
    }
    case "second": {
      return count < 2
        ? { baseType: "any", cardinality: "unknown" }
        : { baseType: "unknown", cardinality: "unknown" };
    }
    case "attribute": {
      return { baseType: typing.resultBases[0] ?? "unknown", cardinality };
    }
    case "declared": {
      return { baseType: "unknown", cardinality: "unknown" };
    }
    case "fixed": {
      return { baseType: typing.resultBases[0] ?? "unknown", cardinality };
    }
    default: {
      return typing.typing satisfies never;
    }
  }
};

/**
 * Whether an outcome names a check of a relation among its laws.
 *
 * @param outcome - The apply's outcome.
 * @param relation - The relation.
 * @param name - The check's name.
 * @returns Whether it does.
 */
const names = (outcome: ApplyOutcome<unknown>, relation: string, name: string): boolean =>
  outcome.kind === "invariant-rejected" &&
  outcome.laws.some(
    (law) => law.kind === "check" && law.relation === relation && law.name === name,
  );

/**
 * A reading of a test's reference: the unsplit reading of `OUT`, a declared outcome of the test,
 * every field but those the case sets.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const readingRow = (fields: Partial<Addition<typeof Reading>>): Addition<typeof Reading> => ({
  assembly: strayNode,
  attribute: "identifier",
  declBaseType: "float",
  declCardinality: "single",
  declaration: nodeOf(50),
  declarationKind: "qti-outcome-declaration",
  declared: true,
  form: "unsplit",
  found: true,
  identifier: "OUT",
  kind: "qti-variable",
  lookupDocument: strayNode,
  mapped: false,
  named: strayNode,
  namedKind: "qti-assessment-test",
  node: nodeOf(1),
  number: "",
  placements: 1n,
  replaced: false,
  resourceType: "none",
  role: "variable",
  scope: "",
  source: "declared",
  split: 0n,
  timeDependent: false,
  variable: "OUT",
  ...fields,
});

/**
 * A split reading through item ref `a`, which names an item whose `SCORE` is declared.
 */
const throughItem = {
  form: "split",
  identifier: "a.SCORE",
  lookupDocument: nodeOf(70),
  named: nodeOf(60),
  namedKind: "qti-assessment-item-ref",
  resourceType: "imsqti_item_xmlv3p0",
  scope: "a",
  split: 1n,
  variable: "SCORE",
} as const satisfies Partial<Addition<typeof Reading>>;

/**
 * Whether an outcome names the key over a selection of a relation, by its terms in order.
 *
 * @param outcome - The apply's outcome.
 * @param relation - The relation.
 * @param fields - The key's terms.
 * @returns Whether it does.
 */
const namesSelectedKey = (
  outcome: ApplyOutcome<unknown>,
  relation: string,
  fields: readonly string[],
): boolean =>
  outcome.kind === "invariant-rejected" &&
  outcome.laws.some(
    (law: Law) =>
      law.kind === "key" &&
      law.side.relation === relation &&
      law.side.selection.conjuncts.length > 0 &&
      law.side.terms.length === fields.length &&
      law.side.terms.every((term, at) => term.kind === "field" && term.field === fields[at]),
  );

/**
 * Whether an outcome names a containment of a relation's rows into `ReferenceDeclaration`, the
 * law "Variable kind", a table CHECK on the relation's table.
 *
 * @param outcome - The apply's outcome.
 * @param relation - The relation the containment reads.
 * @returns Whether it does.
 */
const namesVariableKind = (outcome: ApplyOutcome<unknown>, relation: string): boolean =>
  outcome.kind === "invariant-rejected" &&
  outcome.laws.some(
    (law: Law) =>
      law.kind === "contained" &&
      law.from.relation === relation &&
      law.to.relation === "ReferenceDeclaration",
  );

describe.skipIf(!hasLease)("qti/expressions.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer, { timeout: authorLayerHookTimeoutMs })(
    "the expression and processing laws, judged by PostgreSQL",
    (it) => {
      it.effect(
        "refuses an expression of each kind at min − 1 and max + 1 operands by Arity, and keeps it at min and max",
        () =>
          // Oracle: PostgreSQL, the `Arity` CHECK, against `OperatorArity` (the ASI XSD's counts).
          // Bound: every kind, at min − 1 where min > 0, min, max (min + 3 for an unbounded kind)
          // and max + 1 where bounded; each operand of no known type, which every other row law
          // keeps.
          Effect.gen(function* arity() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const [index, { kind, max, min }] of OperatorArity.rows.entries()) {
              const top = max === int8Max ? min + 3n : max;
              const counts = [
                ...(min > 0n ? [min - 1n] : []),
                min,
                top,
                ...(max === int8Max ? [] : [max + 1n]),
              ];
              for (const count of counts) {
                const node = nodeOf(index);
                const operands = Array.from({ length: Number(count) }, (_, at) =>
                  operandRow(node, at + 1, { node: nodeOf(2000 + at) }),
                );
                const outcome = yield* db.apply(
                  ChangeSet.empty(Author)
                    .insert(Expression, [
                      expressionRow({ kind, node, ...typeOver(kind, Number(count)) }),
                    ])
                    .insert(Operand, operands),
                  {},
                );

                assert.strictEqual(
                  names(outcome, "Expression", "Arity"),
                  count < min || count > max,
                  `${kind} with ${String(count)} operands`,
                );
              }
            }
          }),
      );

      it.effect("refuses each expression row law's breach by its law, and keeps its control", () =>
        // Oracle: PostgreSQL, each CHECK of `Expression`, against the old checker's rules (P23,
        // P21, P25) and the result typing `E1_derived` derives.
        // Bound: one breach of each law, beside the same rows with the breach repaired.
        Effect.gen(function* expressionLaws() {
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const operator = nodeOf(1);
          const cases = [
            {
              broken: [
                expressionRow({
                  baseType: "boolean",
                  cardinality: "single",
                  kind: "qti-and",
                  node: operator,
                }),
              ],
              law: "Operand_fit",
              operands: [operandRow(operator, 1, { baseType: "string", cardinality: "single" })],
              repaired: [operandRow(operator, 1, { baseType: "boolean", cardinality: "single" })],
            },
            {
              broken: [
                expressionRow({ cardinality: "multiple", kind: "qti-multiple", node: operator }),
              ],
              law: "One_base",
              operands: [
                operandRow(operator, 1, { baseType: "integer", cardinality: "single" }),
                operandRow(operator, 2, { baseType: "string", cardinality: "single" }),
              ],
              repaired: [
                operandRow(operator, 1, { baseType: "integer", cardinality: "single" }),
                operandRow(operator, 2, { baseType: "unknown", cardinality: "single" }),
              ],
            },
            {
              broken: [
                expressionRow({
                  baseType: "float",
                  cardinality: "single",
                  kind: "qti-sum",
                  node: operator,
                }),
              ],
              law: "E1_derived",
              operands: [operandRow(operator, 1, { baseType: "integer", cardinality: "single" })],
              repaired: [operandRow(operator, 1, { baseType: "float", cardinality: "single" })],
            },
          ] as const;
          for (const { broken, law, operands, repaired } of cases) {
            const refused = yield* db.apply(
              ChangeSet.empty(Author).insert(Expression, broken).insert(Operand, operands),
              {},
            );
            const kept = yield* db.apply(
              ChangeSet.empty(Author).insert(Expression, broken).insert(Operand, repaired),
              {},
            );

            assert.isTrue(names(refused, "Expression", law), law);
            assert.isFalse(names(kept, "Expression", law), law);
          }

          const leaves = [
            {
              broken: expressionRow({
                baseType: "integer",
                cardinality: "single",
                kind: "qti-number-correct",
                language: "response",
                node: operator,
              }),
              law: "Outcome_only",
              repaired: { language: "outcome" },
            },
            {
              broken: expressionRow({
                baseType: "integer",
                cardinality: "single",
                kind: "qti-random-integer",
                language: "response",
                node: operator,
                parentKind: "qti-response-if",
              }),
              law: "Condition_type",
              repaired: { parentKind: "qti-set-outcome-value" },
            },
          ] as const;
          for (const { broken, law, repaired } of leaves) {
            const refused = yield* db.apply(
              ChangeSet.empty(Author).insert(Expression, [broken]),
              {},
            );
            const kept = yield* db.apply(
              ChangeSet.empty(Author).insert(Expression, [{ ...broken, ...repaired }]),
              {},
            );

            assert.isTrue(names(refused, "Expression", law), law);
            assert.isFalse(names(kept, "Expression", law), law);
          }
        }),
      );

      it.effect("refuses each reference row law's breach by its law, and keeps its control", () =>
        // Oracle: PostgreSQL, each CHECK of `VariableRef`, against the old checker's rules (P8,
        // P20, P22, P24, P26, P27) and the UP audit's A62.
        // Bound: one breach of each law, beside the same row with the breach repaired.
        Effect.gen(function* referenceLaws() {
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const declared = {
            declBaseType: "integer",
            declCardinality: "single",
            resolution: "declared",
          } as const;
          const cases = [
            {
              broken: referenceRow({ rootKind: "qti-assessment-item" }),
              law: "Variable_declared",
              repaired: { rootKind: "qti-response-processing" },
            },
            {
              broken: referenceRow({
                ...declared,
                baseType: "integer",
                cardinality: "single",
                heldBase: "float",
                heldCardinality: "single",
                kind: "qti-set-outcome-value",
              }),
              law: "Set_type",
              repaired: { heldBase: "integer" },
            },
            {
              broken: referenceRow({
                ...declared,
                baseType: "integer",
                cardinality: "single",
                heldBase: "string",
                heldCardinality: "single",
                kind: "qti-lookup-outcome-value",
                table: "qti-interpolation-table",
              }),
              law: "Lookup_type",
              repaired: { heldBase: "float" },
            },
            {
              broken: referenceRow({
                ...declared,
                attribute: "figures",
                baseType: "float",
                cardinality: "single",
                declBaseType: "float",
                kind: "qti-equal-rounded",
              }),
              law: "Reference_type",
              repaired: { baseType: "integer", declBaseType: "integer" },
            },
            {
              broken: referenceRow({
                ...declared,
                baseType: "integer",
                cardinality: "single",
                declarationKind: "qti-response-declaration",
                elementBase: "integer",
                elementCardinality: "single",
                language: "template",
              }),
              law: "Template_reads",
              repaired: { declarationKind: "qti-template-declaration" },
            },
            {
              broken: referenceRow({
                ...declared,
                baseType: "integer",
                cardinality: "single",
                declarationKind: "qti-response-declaration",
                kind: "qti-map-response",
              }),
              law: "Mapped_response",
              repaired: { table: "qti-mapping" },
            },
            {
              broken: referenceRow({
                baseType: "float",
                cardinality: "single",
                elementBase: "float",
                elementCardinality: "single",
                identifier: "duration",
                lexical: "duration",
                resolution: "builtIn",
                rootKind: "qti-assessment-item",
              }),
              law: "Item_duration",
              repaired: { timeDependent: true },
            },
          ] as const;
          for (const { broken, law, repaired } of cases) {
            const refused = yield* db.apply(
              ChangeSet.empty(Author).insert(VariableRef, [broken]),
              {},
            );
            const kept = yield* db.apply(
              ChangeSet.empty(Author).insert(VariableRef, [{ ...broken, ...repaired }]),
              {},
            );

            assert.isTrue(names(refused, "VariableRef", law), law);
            assert.isFalse(names(kept, "VariableRef", law), law);
          }
        }),
      );

      it.effect(
        "refuses a weighted integer, a base value no lexical form of its base type, and a template or timing whose code its form does not spell",
        () =>
          // Oracle: PostgreSQL, `Weighted_base` (P29), `Literal_lexical` (`BaseTypePattern`) and
          // `E1_derived` over `ProcessingTemplate` (template-derivation) and `ItemTiming` (C17).
          // Bound: one breach of each, beside its repair.
          Effect.gen(function* attributeLaws() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const node = nodeOf(1);
            const weighted: Addition<typeof ExpressionAttribute> = {
              attribute: "weight-identifier",
              baseType: "integer",
              cardinality: "multiple",
              kind: "qti-test-variables",
              language: "outcome",
              lexical: "W",
              node,
              parent: strayNode,
              written: true,
            };
            const literal: Addition<typeof Literal> = {
              baseType: "integer",
              cardinality: "single",
              kind: "qti-base-value",
              language: "response",
              node,
              parent: strayNode,
              text: "abc",
              typeCode: "integer",
            };
            const template: Addition<typeof ProcessingTemplate> = {
              node,
              template: "match_correct",
              uri: "urn:example:template",
            };
            const timing: Addition<typeof ItemTiming> = {
              document: strayNode,
              lexical: "true",
              node,
              timeDependent: false,
            };
            const outcomes = {
              keptLiteral: yield* db.apply(
                ChangeSet.empty(Author).insert(Literal, [{ ...literal, text: " 42 " }]),
                {},
              ),
              keptTemplate: yield* db.apply(
                ChangeSet.empty(Author).insert(ProcessingTemplate, [
                  {
                    ...template,
                    uri: "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml",
                  },
                ]),
                {},
              ),
              keptTiming: yield* db.apply(
                ChangeSet.empty(Author).insert(ItemTiming, [{ ...timing, timeDependent: true }]),
                {},
              ),
              keptWeighted: yield* db.apply(
                ChangeSet.empty(Author).insert(ExpressionAttribute, [
                  { ...weighted, baseType: "float" },
                ]),
                {},
              ),
              literal: yield* db.apply(ChangeSet.empty(Author).insert(Literal, [literal]), {}),
              template: yield* db.apply(
                ChangeSet.empty(Author).insert(ProcessingTemplate, [template]),
                {},
              ),
              timing: yield* db.apply(ChangeSet.empty(Author).insert(ItemTiming, [timing]), {}),
              weighted: yield* db.apply(
                ChangeSet.empty(Author).insert(ExpressionAttribute, [weighted]),
                {},
              ),
            };

            assert.isTrue(names(outcomes.weighted, "ExpressionAttribute", "Weighted_base"));
            assert.isFalse(names(outcomes.keptWeighted, "ExpressionAttribute", "Weighted_base"));
            assert.isTrue(names(outcomes.literal, "Literal", "Literal_lexical"));
            assert.isFalse(names(outcomes.keptLiteral, "Literal", "Literal_lexical"));
            assert.isTrue(names(outcomes.template, "ProcessingTemplate", "E1_derived"));
            assert.isFalse(names(outcomes.keptTemplate, "ProcessingTemplate", "E1_derived"));
            assert.isTrue(names(outcomes.timing, "ItemTiming", "E1_derived"));
            assert.isFalse(names(outcomes.keptTiming, "ItemTiming", "E1_derived"));
          }),
      );

      it.effect("refuses each reading law's breach by its law, and keeps its control", () =>
        // Oracle: PostgreSQL, each CHECK of `Reading`, against spec readings 48 and 79, the
        // information model's §2.2.2.2 time-dependence sentence (A62), P24 (A66) and §7.27.1's
        // `section-identifier` (A61).
        // Bound: one breach of each law, beside the same row with the breach repaired.
        Effect.gen(function* readingLaws() {
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const undeclared = {
            declBaseType: "none",
            declCardinality: "single",
            declaration: strayNode,
            declarationKind: "qti-outcome-declaration",
            declared: false,
            source: "none",
          } as const;
          const cases = [
            {
              broken: readingRow({ ...throughItem, placements: 2n }),
              law: "Prefixed_reference",
              repaired: { placements: 1n },
            },
            {
              broken: readingRow({ ...undeclared, identifier: "X", variable: "X" }),
              law: "Variable_declared",
              repaired: { identifier: "a.X", variable: "a.X" },
            },
            {
              broken: readingRow({
                ...throughItem,
                ...undeclared,
                declaration: nodeOf(70),
                identifier: "a.duration",
                source: "builtIn",
                variable: "duration",
              }),
              law: "Item_duration",
              repaired: { timeDependent: true },
            },
            {
              broken: readingRow({ attribute: "max", kind: "qti-random-integer" }),
              law: "Reference_type",
              repaired: { declBaseType: "integer" },
            },
            {
              broken: readingRow({
                ...undeclared,
                form: "name",
                found: false,
                identifier: "S",
                namedKind: "document",
                placements: 0n,
                role: "section",
                scope: "S",
                variable: "",
              }),
              law: "Section_identifier_target",
              repaired: {
                found: true,
                named: nodeOf(61),
                namedKind: "qti-assessment-section",
                placements: 1n,
              },
            },
          ] as const;
          for (const { broken, law, repaired } of cases) {
            const refused = yield* db.apply(ChangeSet.empty(Author).insert(Reading, [broken]), {});
            const kept = yield* db.apply(
              ChangeSet.empty(Author).insert(Reading, [{ ...broken, ...repaired }]),
              {},
            );

            assert.isTrue(names(refused, "Reading", law), law);
            assert.isFalse(names(kept, "Reading", law), law);
          }
        }),
      );

      it.effect(
        "refuses a reference by identifier that names a variable of a kind its element does not read or set, and keeps one that does",
        () =>
          // Oracle: PostgreSQL, the containment into `ReferenceDeclaration` (spec reading 104),
          // against the information model's definitions of each element's `identifier`: a set
          // outcome value sets an outcome (§6.32.3), a correct names a response (§7.10.1), a
          // variable any item variable (§7.47.1), and `numAttempts` stands as a response.
          // Bound: three references, each beside its kept twin.
          Effect.gen(function* variableKind() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const declared = { resolution: "declared", rootKind: "qti-assessment-item" } as const;
            const cases = [
              {
                broken: referenceRow({
                  ...declared,
                  declarationKind: "qti-response-declaration",
                  kind: "qti-set-outcome-value",
                }),
                kept: { declarationKind: "qti-outcome-declaration" },
              },
              {
                broken: referenceRow({
                  ...declared,
                  declarationKind: "qti-outcome-declaration",
                  kind: "qti-correct",
                }),
                kept: { declarationKind: "qti-response-declaration" },
              },
              {
                broken: referenceRow({
                  baseType: "integer",
                  cardinality: "single",
                  declarationKind: "qti-response-declaration",
                  identifier: "numAttempts",
                  kind: "qti-set-outcome-value",
                  lexical: "numAttempts",
                  resolution: "builtIn",
                  rootKind: "qti-assessment-item",
                }),
                kept: { kind: "qti-variable" },
              },
            ] as const;
            for (const { broken, kept } of cases) {
              const refused = yield* db.apply(
                ChangeSet.empty(Author).insert(VariableRef, [broken]),
                {},
              );
              const held = yield* db.apply(
                ChangeSet.empty(Author).insert(VariableRef, [{ ...broken, ...kept }]),
                {},
              );

              assert.isTrue(namesVariableKind(refused, "VariableRef"), broken.kind);
              assert.isFalse(namesVariableKind(held, "VariableRef"), broken.kind);
            }
          }),
      );

      it.effect(
        "refuses a reference two readings resolve by the key over its resolving readings, and keeps one",
        () =>
          // Oracle: PostgreSQL, the key over `select(Reading, resolves)` by reference (M3's at
          // most one), against spec reading 48's own case: `a.b.SCORE` read as item ref `a.b`'s
          // `SCORE` and as item ref `a`'s `b.SCORE`, both declared. Bound: the two readings
          // resolving, beside the same two with the second's variable undeclared.
          Effect.gen(function* twoReadings() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const first = readingRow({
              ...throughItem,
              identifier: "a.b.SCORE",
              scope: "a.b",
              split: 2n,
            });
            const second = readingRow({
              ...throughItem,
              identifier: "a.b.SCORE",
              named: nodeOf(62),
              split: 1n,
              variable: "b.SCORE",
            });
            const refused = yield* db.apply(
              ChangeSet.empty(Author).insert(Reading, [first, second]),
              {},
            );
            const kept = yield* db.apply(
              ChangeSet.empty(Author).insert(Reading, [
                first,
                {
                  ...second,
                  declBaseType: "none",
                  declaration: nodeOf(70),
                  declared: false,
                  source: "none",
                },
              ]),
              {},
            );

            assert.isTrue(namesSelectedKey(refused, "Reading", ["assembly", "node", "attribute"]));
            assert.isFalse(namesSelectedKey(kept, "Reading", ["assembly", "node", "attribute"]));
          }),
      );

      it.effect(
        "refuses a template default or a mapping its item's declarations do not admit, and keeps its control",
        () =>
          // Oracle: PostgreSQL, `Template_default_target` and `Template_default_type` (A37, A38,
          // spec reading 100) and `Variable_mapping_source` and `Variable_mapping_target` (A34,
          // reading 89). Bound: one breach of each, beside its repair.
          Effect.gen(function* itemRefLaws() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const templateDefault: Addition<typeof TemplateDefault> = {
              declBaseType: "integer",
              declCardinality: "single",
              declaration: nodeOf(80),
              declarationKind: "qti-template-declaration",
              heldBase: "float",
              heldCardinality: "single",
              itemDocument: nodeOf(70),
              itemRef: nodeOf(60),
              lead: "",
              lexical: "T",
              node: nodeOf(1),
              template: "T",
              trail: "",
            };
            const mapping: Addition<typeof MappingSource> = {
              declBaseType: "float",
              declCardinality: "single",
              declaration: nodeOf(81),
              declarationKind: "qti-response-declaration",
              itemDocument: nodeOf(70),
              itemRef: nodeOf(60),
              node: nodeOf(2),
              source: "SCORE",
              target: "X",
              targetDeclared: true,
            };
            const templateCases: readonly {
              readonly broken: Addition<typeof TemplateDefault>;
              readonly law: string;
              readonly repaired: Addition<typeof TemplateDefault>;
            }[] = [
              {
                broken: templateDefault,
                law: "Template_default_type",
                repaired: { ...templateDefault, heldBase: "integer" },
              },
              {
                broken: { ...templateDefault, declarationKind: "qti-outcome-declaration" },
                law: "Template_default_target",
                repaired: templateDefault,
              },
            ];
            for (const { broken, law, repaired } of templateCases) {
              const refused = yield* db.apply(
                ChangeSet.empty(Author).insert(TemplateDefault, [broken]),
                {},
              );
              const kept = yield* db.apply(
                ChangeSet.empty(Author).insert(TemplateDefault, [repaired]),
                {},
              );

              assert.isTrue(names(refused, "TemplateDefault", law), law);
              assert.isFalse(names(kept, "TemplateDefault", law), law);
            }

            const mappingCases: readonly {
              readonly law: string;
              readonly repaired: Addition<typeof MappingSource>;
            }[] = [
              {
                law: "Variable_mapping_source",
                repaired: { ...mapping, declarationKind: "qti-outcome-declaration" },
              },
              { law: "Variable_mapping_target", repaired: { ...mapping, targetDeclared: false } },
            ];
            for (const { law, repaired } of mappingCases) {
              const refused = yield* db.apply(
                ChangeSet.empty(Author).insert(MappingSource, [mapping]),
                {},
              );
              const kept = yield* db.apply(
                ChangeSet.empty(Author).insert(MappingSource, [repaired]),
                {},
              );

              assert.isTrue(names(refused, "MappingSource", law), law);
              assert.isFalse(names(kept, "MappingSource", law), law);
            }
          }),
      );
    },
  );
});
