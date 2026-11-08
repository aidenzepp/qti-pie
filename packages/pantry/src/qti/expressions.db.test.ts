/* oxlint-disable unicorn/text-encoding-identifier-case -- A document row spells its XML encoding labels (`UTF-8`) as crust's reader reports them and `Document` stores them. */
/**
 * The expression and processing laws on the lease, PostgreSQL itself the judge (testing doctrine,
 * rule 3): each refused row is one the law's model refuses, named by the law it breaks.
 *
 * Most cases write rows through the author role (`db.apply`) whose nodes no stored document holds,
 * so every containment into `Node`, `Declaration` and the other overlays fails at commit; each law
 * under test is a row CHECK, judged as its row is inserted, before any of them. So a row that
 * breaks the law comes back `invariant-rejected` with the law among its `refused.laws`, and a row
 * that keeps it comes back rejected by its containments alone, the law absent (membership, since a
 * merged native names several, C22). A family's member is written beside its owner, since an
 * immutable owner's family is fixed when the owner is inserted (README, "Families"): a
 * `VariableRef` beside its `Document`, the manifest's row, lawful on its own CHECKs.
 *
 * A `Reading`'s owner, its `AssembledReference`, is lawful only placed in an assembly
 * (`E1_derived`: at least one `PlacedReference`), so its cases are judged by a direct SQL writer
 * (`#pantry/test/direct-sql.ts`, README "Direct SQL access"): the reading with the rows its
 * non-deferrable foreign keys read (its `AssembledReference`, that one's `TestReference`, that
 * one's `ReferenceDocument`, and, for a reading through an item ref, its `MappingLookup`), each
 * lawful on its own CHECKs, the rest deferred and rolled back unchecked. A refused case's verdict
 * is the SQLSTATE and the constraint that states the law; a control's is no error. Each breach
 * breaks the one law under test, so the constraint PostgreSQL names is that law's whatever order it
 * checks them in.
 *
 * The whole-package cases, each fixture of `src/test/fixtures/processing/` imported and refused
 * under its rule or accepted, need the importer and arrive with it (Q5.15): every `broken`
 * fixture but the two accepted controls is refused with the law its frozen rule maps to
 * (`verdicts.tsv`), every `guards` fixture but `padded-processing.xml` with AL3, N7's `Last` or
 * N5's `Follow`, and every `valid` fixture is accepted.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { Addition, ApplyOutcome, Fact, Law } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Layer, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { int8Max } from "#pantry/grammar/closed.ts";
import { expressionTypings } from "#pantry/grammar/expression.ts";
import { readProgram } from "#pantry/import/program.ts";
import { ruleOfLaws } from "#pantry/import/refusal.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import { OperatorArity } from "#pantry/grammar/install.ts";
import { Document } from "#pantry/qti/chardata.ts";
import {
  AssembledReference,
  Expression,
  ExpressionAttribute,
  HeldType,
  LiteralTyped,
  MappingLookup,
  MappingSourceDeclaration,
  Operand,
  ProcessingTemplate,
  Reading,
  ReadingCardinality,
  ReferenceDocument,
  TemplateDefaultCardinality,
  TemplateDefaultTarget,
  TestReference,
  VariableRef,
  VariableRefDeclaration,
} from "#pantry/qti/expressions.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { Author } from "#pantry/qti/roles.ts";
import {
  assertVerdict,
  judged,
  loginSession,
  rowsOf,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { itemRefPackageEntries } from "#pantry/test/gen/item-ref-declarations.ts";
import type { ItemRefPackage, ItemTarget } from "#pantry/test/gen/item-ref-declarations.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

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
  document: strayNode,
  elementBase: "unknown",
  elementCardinality: "unknown",
  identifier: "X",
  kind: "qti-variable",
  language: "response",
  lexical: "X",
  node: nodeOf(1),
  parent: strayNode,
  resolution: "unresolved",
  rootKind: "qti-response-processing",
  table: "none",
  ...fields,
});

/**
 * A reference's document as its owner in `Document.variables`: the manifest's row, lawful on its
 * own CHECKs (`RootOfType` admits its `none` resource type at `imsmanifest.xml`, it writes no
 * declaration, and its context is its own node), at the reference's root kind, which the family's
 * owner axis copies.
 *
 * @param reference - The reference.
 * @returns The document's row.
 */
const documentOf = (reference: Addition<typeof VariableRef>): Addition<typeof Document> => ({
  assembled: false,
  charset: "UTF-8",
  contextNearest: reference.document,
  contextNearestKind: "document",
  exportCharset: "UTF-8",
  node: reference.document,
  nodeChildren: 1n,
  package: strayNode,
  path: manifestPath,
  resourceType: "none",
  rootKind: reference.rootKind,
  version: "3.0.0",
});

/**
 * The change that writes a reference beside its document, the immutable owner of its family, with
 * its declaration and its held type where the case writes them, each copying the reference.
 *
 * @param reference - The reference.
 * @param declaration - The declaration's fields the case sets, or none for no declaration row.
 * @param held - The held type's fields the case sets, or none for no held type row.
 * @returns The change.
 */
const referenceChange = (
  reference: Addition<typeof VariableRef>,
  declaration: Partial<Addition<typeof VariableRefDeclaration>> | undefined,
  held?: Partial<Addition<typeof HeldType>>,
) =>
  ChangeSet.empty(Author)
    .insert(Document, [documentOf(reference)])
    .insert(VariableRef, [reference])
    .insert(
      VariableRefDeclaration,
      declaration === undefined
        ? []
        : [
            {
              attribute: reference.attribute,
              baseType: reference.baseType,
              cardinality: reference.cardinality,
              declBaseTypes: 1n,
              declCardinalities: 1n,
              declaration: strayNode,
              declarationKind: "qti-outcome-declaration",
              document: reference.document,
              identifier: reference.identifier,
              kind: reference.kind,
              language: reference.language,
              node: reference.node,
              table: reference.table,
              ...declaration,
            },
          ],
    )
    .insert(
      HeldType,
      held === undefined
        ? []
        : [
            {
              baseType: reference.baseType,
              cardinality: reference.cardinality,
              expression: nodeOf(2),
              expressionKind: "qti-base-value",
              heldBase: "unknown",
              heldCardinality: "unknown",
              kind: reference.kind,
              language: reference.language,
              node: reference.node,
              table: reference.table,
              ...held,
            },
          ],
    );

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
  outcome.refused.laws.some(
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
  declBaseTypes: 1n,
  declCardinalities: 1n,
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
 * The test document whose one reference every reading case reads.
 */
const referencingDocument = nodeOf(90);

/**
 * A segment of a name that is all digits, a reading 88 instance number where it follows a dot.
 */
const allDigits = /^[0-9]+$/u;

/**
 * The facts a case states for one reference's readings, each owner lawful on its own CHECKs; the
 * writer orders them and fills their families' slots (`#pantry/test/direct-sql.ts`
 * `statedInserts`):
 *
 * - The test document's `ReferenceDocument` row, owning the one reference;
 * - The reference's `TestReference` row in a test (`E1_derived`: a `section-identifier` reads a
 *   section, every other attribute a variable);
 * - Its `AssembledReference` row, placed once, with its name's counts (`E1_derived`: a variable's
 *   name is its segments joined and is read once unsplit and once at each dot, a numbered segment
 *   once less where it is the last; a section's has no segments and is read once), stated since the
 *   case states fewer readings than the name has;
 * - The readings;
 * - The `MappingLookup` row of each reading through an item ref (a split or numbered reading of a
 *   found item ref), at the item ref and the reading's variable, its verdict the reading's
 *   `mapped`: grizzle installs the reading's foreign key into it immediate, since its deferral rule
 *   defers only a foreign key on a cycle or into a replaceable target, so PostgreSQL judges it at
 *   the reading's statement.
 *
 * Every other row they name (the segments, the placements, the other lookups, the test's nodes) is
 * absent, its foreign keys deferred and never checked before the rollback.
 *
 * @param readings - The reference's readings, one at least, all of one reference.
 * @returns The facts.
 */
const readingFacts = (
  readings: readonly [Addition<typeof Reading>, ...Addition<typeof Reading>[]],
): readonly Stated[] => {
  const [{ assembly, attribute, identifier, kind, node, role }] = readings;
  const pieces = identifier.split(".");
  const variable = role === "variable";
  const digits = variable ? pieces.slice(1).filter((piece) => allDigits.test(piece)).length : 0;
  const lastDigit = variable && pieces.length > 1 && allDigits.test(pieces.at(-1) ?? "");
  const segments = variable ? pieces.length : 0;
  const count = variable ? segments + digits - (lastDigit ? 1 : 0) : 1;
  const reference: Fact<typeof TestReference> = {
    attribute,
    document: referencingDocument,
    identifier,
    kind,
    node,
    role,
    rootKind: "qti-assessment-test",
  };

  return [
    { fact: { document: referencingDocument }, relation: ReferenceDocument },
    { fact: reference, relation: TestReference },
    {
      fact: {
        ...reference,
        assembly,
        digits: BigInt(digits),
        joined: variable ? identifier : "",
        lastDigit,
        placements: 1n,
        readings: BigInt(count),
        segments: BigInt(segments),
      },
      relation: AssembledReference,
    },
    ...readings.map((reading) => ({ fact: reading, relation: Reading })),
    ...readings
      .filter(
        ({ form, found, namedKind }) =>
          (form === "split" || form === "numbered") &&
          found &&
          namedKind === "qti-assessment-item-ref",
      )
      .map((reading) => ({
        fact: { itemRef: reading.named, mapped: reading.mapped, name: reading.variable },
        relation: MappingLookup,
      })),
  ];
};

/**
 * Whether an outcome names a containment of a relation's rows into `ReferenceDeclaration`, the
 * law "Variable kind", a table CHECK on the relation's table.
 *
 * @param outcome - The apply's outcome.
 * @param relation - The relation the containment reads.
 * @returns Whether it does.
 */
const namesVariableKind = (outcome: ApplyOutcome<unknown>): boolean =>
  outcome.kind === "invariant-rejected" &&
  outcome.refused.laws.some(
    (law: Law) =>
      (law.kind === "contained" &&
        law.from.relation === "VariableRefDeclaration" &&
        law.to.relation === "ReferenceDeclaration") ||
      (law.kind === "check" && law.relation === "VariableRef" && law.name === "Variable_kind"),
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
        // Oracle: PostgreSQL, each CHECK of `VariableRef` and its rows, against the old checker's rules (P8,
        // P20, P22, P24, P26, P27).
        // Bound: one breach of each law, beside the same row with the breach repaired.
        Effect.gen(function* referenceLaws() {
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const declared = { resolution: "declared" } as const;
          const cases: readonly {
            readonly broken: Addition<typeof VariableRef>;
            readonly declaration?: Partial<Addition<typeof VariableRefDeclaration>>;
            readonly held?: Partial<Addition<typeof HeldType>>;
            readonly law: string;
            readonly on: "HeldType" | "VariableRef" | "VariableRefDeclaration";
            readonly repaired: Partial<Addition<typeof VariableRef>>;
            readonly repairedDeclaration?: Partial<Addition<typeof VariableRefDeclaration>>;
            readonly repairedHeld?: Partial<Addition<typeof HeldType>>;
          }[] = [
            {
              broken: referenceRow({ rootKind: "qti-assessment-item" }),
              law: "Variable_declared",
              on: "VariableRef",
              repaired: { rootKind: "qti-response-processing" },
            },
            {
              broken: referenceRow({
                ...declared,
                baseType: "integer",
                cardinality: "single",
                kind: "qti-set-outcome-value",
              }),
              declaration: {},
              held: { heldBase: "float", heldCardinality: "single" },
              law: "Set_type",
              on: "HeldType",
              repaired: {},
              repairedHeld: { heldBase: "integer" },
            },
            {
              broken: referenceRow({
                ...declared,
                baseType: "integer",
                cardinality: "single",
                kind: "qti-lookup-outcome-value",
                table: "qti-interpolation-table",
              }),
              declaration: {},
              held: { heldBase: "string", heldCardinality: "single" },
              law: "Lookup_type",
              on: "HeldType",
              repaired: {},
              repairedHeld: { heldBase: "float" },
            },
            {
              broken: referenceRow({
                ...declared,
                baseType: "integer",
                cardinality: "single",
                kind: "qti-lookup-outcome-value",
              }),
              declaration: {},
              law: "Lookup_type",
              on: "VariableRef",
              repaired: { table: "qti-interpolation-table" },
            },
            {
              broken: referenceRow({
                ...declared,
                attribute: "figures",
                baseType: "float",
                cardinality: "single",
                kind: "qti-equal-rounded",
              }),
              declaration: {},
              law: "Reference_type",
              on: "VariableRefDeclaration",
              repaired: { baseType: "integer" },
              repairedDeclaration: {},
            },
            {
              broken: referenceRow({
                ...declared,
                baseType: "integer",
                cardinality: "single",
                elementBase: "integer",
                elementCardinality: "single",
                language: "template",
              }),
              declaration: { declarationKind: "qti-response-declaration" },
              law: "Template_reads",
              on: "VariableRefDeclaration",
              repaired: {},
              repairedDeclaration: { declarationKind: "qti-template-declaration" },
            },
            {
              broken: referenceRow({
                ...declared,
                baseType: "integer",
                cardinality: "single",
                kind: "qti-map-response",
              }),
              declaration: { declarationKind: "qti-response-declaration" },
              law: "Mapped_response",
              on: "VariableRefDeclaration",
              repaired: { table: "qti-mapping" },
              repairedDeclaration: { table: "qti-mapping" },
            },
          ];
          for (const {
            broken,
            declaration,
            held,
            law,
            on,
            repaired,
            repairedDeclaration,
            repairedHeld,
          } of cases) {
            const refused = yield* db.apply(referenceChange(broken, declaration, held), {});
            const kept = yield* db.apply(
              referenceChange(
                { ...broken, ...repaired },
                declaration === undefined ? undefined : { ...declaration, ...repairedDeclaration },
                held === undefined ? undefined : { ...held, ...repairedHeld },
              ),
              {},
            );

            assert.isTrue(names(refused, on, law), law);
            assert.isFalse(names(kept, on, law), law);
          }
        }),
      );

      it.effect(
        "refuses a weighted integer, a base value no lexical form of its base type, and a template whose code its form does not spell",
        () =>
          // Oracle: PostgreSQL, `Weighted_base` (P29), `Literal_lexical` (`BaseTypePattern`) and
          // `E1_derived` over `ProcessingTemplate` (template-derivation).
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
            const literal: Addition<typeof LiteralTyped> = {
              baseType: "integer",
              node,
              text: "abc",
              typeCode: "integer",
            };
            const template: Addition<typeof ProcessingTemplate> = {
              node,
              template: "match_correct",
              uri: "urn:example:template",
            };
            const outcomes = {
              keptLiteral: yield* db.apply(
                ChangeSet.empty(Author).insert(LiteralTyped, [{ ...literal, text: " 42 " }]),
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
              keptWeighted: yield* db.apply(
                ChangeSet.empty(Author).insert(ExpressionAttribute, [
                  { ...weighted, baseType: "float" },
                ]),
                {},
              ),
              literal: yield* db.apply(ChangeSet.empty(Author).insert(LiteralTyped, [literal]), {}),
              template: yield* db.apply(
                ChangeSet.empty(Author).insert(ProcessingTemplate, [template]),
                {},
              ),
              weighted: yield* db.apply(
                ChangeSet.empty(Author).insert(ExpressionAttribute, [weighted]),
                {},
              ),
            };

            assert.isTrue(names(outcomes.weighted, "ExpressionAttribute", "Weighted_base"));
            assert.isFalse(names(outcomes.keptWeighted, "ExpressionAttribute", "Weighted_base"));
            assert.isTrue(names(outcomes.literal, "LiteralTyped", "Literal_lexical"));
            assert.isFalse(names(outcomes.keptLiteral, "LiteralTyped", "Literal_lexical"));
            assert.isTrue(names(outcomes.template, "ProcessingTemplate", "E1_derived"));
            assert.isFalse(names(outcomes.keptTemplate, "ProcessingTemplate", "E1_derived"));
          }),
      );

      it.effect(
        "refuses each reading law's breach by its law, and keeps its control",
        () =>
          // Oracle: PostgreSQL, each CHECK of `Reading`, against spec readings 48 and 88, P24
          // (A66) and §7.27.1's `section-identifier` (A61), here a `qti-number-correct`'s, which
          // reads a section.
          // Bound: one breach of each law, beside the same row with the breach repaired, each
          // with its reference's owners.
          Effect.gen(function* readingLaws() {
            const client = yield* loginSession;
            const undeclared = {
              declBaseTypes: 0n,
              declCardinalities: 0n,
              declaration: strayNode,
              declarationKind: "qti-outcome-declaration",
              declared: false,
              source: "none",
            } as const;
            const standIn = readingRow({ attribute: "max", kind: "qti-random-integer" });
            const cardinalityOf = (
              declCardinality: Addition<typeof ReadingCardinality>["declCardinality"],
            ): readonly Stated[] => [
              {
                fact: {
                  assembly: standIn.assembly,
                  attribute: standIn.attribute,
                  declCardinality,
                  declaration: standIn.declaration,
                  form: standIn.form,
                  node: standIn.node,
                  split: standIn.split,
                },
                relation: ReadingCardinality,
              },
            ];
            // The check judges a stand-in reading's declaration's cardinality, a row of its own
            // where the declaration has one (spec reading 159); its base type, where its
            // declaration has one, is the containment into `DeclarationBaseType`'s, a key the host
            // tier holds.
            assertVerdict(
              yield* judged(
                client,
                statedInserts([...readingFacts([standIn]), ...cardinalityOf("multiple")]),
              ),
              "reference_type",
              true,
              "reference_type, broken",
            );
            assertVerdict(
              yield* judged(
                client,
                statedInserts([...readingFacts([standIn]), ...cardinalityOf("single")]),
              ),
              "reference_type",
              false,
              "reference_type, repaired",
            );

            const cases = [
              {
                broken: readingRow({ ...throughItem, placements: 2n }),
                check: "prefixed_reference",
                repaired: { placements: 1n },
              },
              {
                broken: readingRow({ ...undeclared, identifier: "X", variable: "X" }),
                check: "variable_declared",
                repaired: { identifier: "a.X", variable: "a.X" },
              },
              {
                broken: readingRow({
                  ...undeclared,
                  attribute: "section-identifier",
                  form: "name",
                  found: false,
                  identifier: "S",
                  kind: "qti-number-correct",
                  namedKind: "document",
                  placements: 0n,
                  role: "section",
                  scope: "S",
                  variable: "",
                }),
                check: "section_identifier_target",
                repaired: {
                  found: true,
                  named: nodeOf(61),
                  namedKind: "qti-assessment-section",
                  placements: 1n,
                },
              },
            ] as const;
            for (const { broken, check, repaired } of cases) {
              assertVerdict(
                yield* judged(client, statedInserts(readingFacts([broken]))),
                check,
                true,
                `${check}, broken`,
              );
              assertVerdict(
                yield* judged(client, statedInserts(readingFacts([{ ...broken, ...repaired }]))),
                check,
                false,
                `${check}, repaired`,
              );
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "refuses a reference by identifier that names a variable of a kind its element does not read or set, and keeps one that does",
        () =>
          // Oracle: PostgreSQL, the containment into `ReferenceDeclaration` (spec reading 111),
          // against the information model's definitions of each element's `identifier`: a set
          // outcome value sets an outcome (§6.32.3), a correct names a response (§7.10.1), a
          // variable any item variable (§7.47.1), and `numAttempts` stands as a response.
          // Bound: three references, each beside its kept twin.
          Effect.gen(function* variableKind() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const declared = { resolution: "declared", rootKind: "qti-assessment-item" } as const;
            const cases: readonly {
              readonly broken: Addition<typeof VariableRef>;
              readonly declaration?: Partial<Addition<typeof VariableRefDeclaration>>;
              readonly kept: Partial<Addition<typeof VariableRef>>;
              readonly keptDeclaration?: Partial<Addition<typeof VariableRefDeclaration>>;
            }[] = [
              {
                broken: referenceRow({ ...declared, kind: "qti-set-outcome-value" }),
                declaration: { declarationKind: "qti-response-declaration" },
                kept: {},
                keptDeclaration: { declarationKind: "qti-outcome-declaration" },
              },
              {
                broken: referenceRow({ ...declared, kind: "qti-correct" }),
                declaration: { declarationKind: "qti-outcome-declaration" },
                kept: {},
                keptDeclaration: { declarationKind: "qti-response-declaration" },
              },
              {
                broken: referenceRow({
                  baseType: "integer",
                  cardinality: "single",
                  identifier: "numAttempts",
                  kind: "qti-set-outcome-value",
                  lexical: "numAttempts",
                  resolution: "builtIn",
                  rootKind: "qti-assessment-item",
                }),
                kept: { kind: "qti-variable" },
              },
            ];
            for (const { broken, declaration, kept, keptDeclaration } of cases) {
              const refused = yield* db.apply(referenceChange(broken, declaration), {});
              const held = yield* db.apply(
                referenceChange(
                  { ...broken, ...kept },
                  declaration === undefined ? undefined : { ...declaration, ...keptDeclaration },
                ),
                {},
              );

              assert.isTrue(namesVariableKind(refused), broken.kind);
              assert.isFalse(namesVariableKind(held), broken.kind);
            }
          }),
      );

      it.effect(
        "refuses a reference two readings resolve by the key over its resolving readings, and keeps one",
        () =>
          // Oracle: PostgreSQL, the key over `select(Reading, resolves)` by reference (M3's at
          // most one), against spec reading 48's own case: `a.b.SCORE` read as item ref `a.b`'s
          // `SCORE` and as item ref `a`'s `b.SCORE`, both declared. The key is the catalog's one
          // UNIQUE over `Reading`'s selected (assembly, node, attribute), found by grizzle's
          // comment on it. Bound: the two readings resolving, beside the same two with the
          // second's variable undeclared, at slots 0 and 1 of the name's three readings.
          Effect.gen(function* twoReadings() {
            const client = yield* loginSession;
            const keys = yield* rowsOf<{ readonly name: string }>(
              client,
              `SELECT c.conname AS name FROM pg_catalog.pg_constraint c
                WHERE c.conrelid = 'qti.reading'::regclass AND c.contype = 'u'
                  AND pg_catalog.cardinality(c.conkey) = 3
                  AND pg_catalog.obj_description(c.oid, 'pg_constraint') LIKE 'key Reading(assembly where %'`,
            );
            assert.lengthOf(keys, 1, "one key over Reading's selected (assembly, node, attribute)");

            const key = keys[0]?.name ?? "";
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

            assertVerdict(
              yield* judged(client, statedInserts(readingFacts([first, second]))),
              key,
              true,
              "two resolving readings",
              "23505",
            );
            assertVerdict(
              yield* judged(
                client,
                statedInserts(
                  readingFacts([
                    first,
                    {
                      ...second,
                      declBaseTypes: 0n,
                      declCardinalities: 0n,
                      declaration: nodeOf(70),
                      declared: false,
                      source: "none",
                    },
                  ]),
                ),
              ),
              key,
              false,
              "one resolving reading",
            );
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "refuses a template default or a mapping its item's declarations do not admit, and keeps its control",
        () =>
          // Oracle: PostgreSQL, `Template_default_target` and `Template_default_type` (A37, A38,
          // spec reading 108) and `Variable_mapping_source` and `Variable_mapping_target` (A34,
          // reading 97), each a CHECK on the declaration's own row (`TemplateDefaultTarget`,
          // `MappingSourceDeclaration`), `Template_default_type`'s on its cardinality's
          // (`TemplateDefaultCardinality`, a row of its own where the declaration has one, spec
          // reading 159), since the declaration's base type, where it has one, is
          // `DeclarationBaseType`'s, which a containment reads. Bound: one breach of each, breaking
          // that law alone, since PostgreSQL names the first CHECK a row breaks by name, beside its
          // repair, which keeps all four.
          Effect.gen(function* itemRefLaws() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const templateDefault: Addition<typeof TemplateDefaultTarget> = {
              declBaseTypes: 1n,
              declCardinalities: 1n,
              declaration: nodeOf(80),
              declarationKind: "qti-template-declaration",
              heldBase: "integer",
              heldCardinality: "single",
              itemDocument: nodeOf(70),
              itemRef: nodeOf(60),
              node: nodeOf(1),
              template: "T",
            };
            const mapping: Addition<typeof MappingSourceDeclaration> = {
              declBaseTypes: 1n,
              declCardinalities: 1n,
              declaration: nodeOf(81),
              declarationKind: "qti-outcome-declaration",
              itemDocument: nodeOf(70),
              itemRef: nodeOf(60),
              node: nodeOf(2),
              source: "SCORE",
              target: "X",
              targetDeclared: true,
            };
            const templateCases: readonly {
              readonly broken: Addition<typeof TemplateDefaultTarget>;
              readonly law: string;
              readonly repaired: Addition<typeof TemplateDefaultTarget>;
            }[] = [
              {
                broken: { ...templateDefault, declarationKind: "qti-outcome-declaration" },
                law: "Template_default_target",
                repaired: templateDefault,
              },
            ];
            for (const { broken, law, repaired } of templateCases) {
              const refused = yield* db.apply(
                ChangeSet.empty(Author).insert(TemplateDefaultTarget, [broken]),
                {},
              );
              const kept = yield* db.apply(
                ChangeSet.empty(Author).insert(TemplateDefaultTarget, [repaired]),
                {},
              );

              assert.isTrue(names(refused, "TemplateDefaultTarget", law), law);
              assert.isFalse(names(kept, "TemplateDefaultTarget", law), law);
            }

            const templateCardinality: Addition<typeof TemplateDefaultCardinality> = {
              declCardinality: "single",
              declaration: templateDefault.declaration,
              heldCardinality: "multiple",
              node: templateDefault.node,
            };
            const refusedType = yield* db.apply(
              ChangeSet.empty(Author).insert(TemplateDefaultCardinality, [templateCardinality]),
              {},
            );
            const keptType = yield* db.apply(
              ChangeSet.empty(Author).insert(TemplateDefaultCardinality, [
                { ...templateCardinality, heldCardinality: "single" },
              ]),
              {},
            );

            assert.isTrue(
              names(refusedType, "TemplateDefaultCardinality", "Template_default_type"),
              "Template_default_type",
            );
            assert.isFalse(
              names(keptType, "TemplateDefaultCardinality", "Template_default_type"),
              "Template_default_type",
            );

            const mappingCases: readonly {
              readonly broken: Addition<typeof MappingSourceDeclaration>;
              readonly law: string;
              readonly repaired: Addition<typeof MappingSourceDeclaration>;
            }[] = [
              {
                broken: {
                  ...mapping,
                  declarationKind: "qti-response-declaration",
                  targetDeclared: false,
                },
                law: "Variable_mapping_source",
                repaired: { ...mapping, targetDeclared: false },
              },
              {
                broken: mapping,
                law: "Variable_mapping_target",
                repaired: { ...mapping, targetDeclared: false },
              },
            ];
            for (const { broken, law, repaired } of mappingCases) {
              const refused = yield* db.apply(
                ChangeSet.empty(Author).insert(MappingSourceDeclaration, [broken]),
                {},
              );
              const kept = yield* db.apply(
                ChangeSet.empty(Author).insert(MappingSourceDeclaration, [repaired]),
                {},
              );

              assert.isTrue(names(refused, "MappingSourceDeclaration", law), law);
              assert.isFalse(names(kept, "MappingSourceDeclaration", law), law);
            }
          }),
      );
    },
  );
});

/**
 * The whole-package cases of an item ref's declarations (lane NIL, the audit's A17 to A22), each a
 * package of the item-ref-declarations generator with one cause, and the rule its import must be
 * refused under alone, or none for the lawful control. A template default or a mapping whose item
 * declares nothing under its name, or whose item ref names no item, has no declaration row, so the
 * existence law refuses it; one whose item declares the name under the wrong kind has its row,
 * and the row's own CHECK refuses it.
 */
const itemRefCases: readonly (readonly [string, ItemRefPackage, string | undefined])[] = [
  [
    "a lawful template default and a lawful read mapping",
    {
      defaults: [{ held: "integer", template: "T" }],
      mappings: [{ read: true, source: "SCORE", target: "M1" }],
      target: "item",
    },
    undefined,
  ],
  [
    "a template default naming no variable of its item",
    { defaults: [{ held: "integer", template: "U" }], mappings: [], target: "item" },
    "template-default-target",
  ],
  [
    "a template default naming an outcome of its item",
    { defaults: [{ held: "float", template: "SCORE" }], mappings: [], target: "item" },
    "template-default-target",
  ],
  [
    "a template default under an item ref naming an LTI link",
    { defaults: [{ held: "integer", template: "T" }], mappings: [], target: "lti" },
    "template-default-target",
  ],
  [
    "a template default whose expression does not fit its template",
    { defaults: [{ held: "float", template: "T" }], mappings: [], target: "item" },
    "P20",
  ],
  [
    "a mapping whose source its item declares nothing under",
    { defaults: [], mappings: [{ read: false, source: "U", target: "M1" }], target: "item" },
    "variable-mapping-source",
  ],
  [
    "a mapping whose undeclared source the test reads through the item ref",
    { defaults: [], mappings: [{ read: true, source: "U", target: "M1" }], target: "item" },
    "variable-mapping-source",
  ],
  [
    "a mapping whose source is a template of its item",
    { defaults: [], mappings: [{ read: false, source: "T", target: "M1" }], target: "item" },
    "variable-mapping-source",
  ],
  [
    "a mapping whose source is a response of its item",
    { defaults: [], mappings: [{ read: false, source: "R", target: "M1" }], target: "item" },
    "variable-mapping-source",
  ],
  [
    "a mapping under an item ref naming an LTI link",
    { defaults: [], mappings: [{ read: false, source: "SCORE", target: "M1" }], target: "lti" },
    "variable-mapping-source",
  ],
  [
    "a mapping whose target is another variable of its item",
    { defaults: [], mappings: [{ read: false, source: "SCORE", target: "X" }], target: "item" },
    "variable-mapping-target",
  ],
];

/**
 * The rules each item ref target's bare package is refused under, as the law oracle predicts them,
 * none for the LTI link (lane NIL's NS3): another type is the item ref's law alone; an unlisted
 * path, a stray file and a missing item file break their packaging law beside it.
 */
const itemRefTargetCases: readonly (readonly [ItemTarget, readonly string[]])[] = [
  ["lti", []],
  ["other", ["item-ref-target"]],
  ["unlisted", ["file-exists", "item-ref-target"]],
  ["stray", ["file-listed", "item-ref-target"]],
  ["missing", ["entry-kind", "file-exists", "item-ref-target"]],
];

describe.skipIf(!hasLease)(
  "qti/expressions.db.test.ts, an item ref's declarations on the lease",
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("each package imported in one apply, judged by PostgreSQL", (it) => {
      it.effect(
        "refuses each package with one cause under that cause's rule alone, and accepts the control",
        () =>
          // Oracle: PostgreSQL, every law of the schema over the import's one ChangeSet, against
          // the rule each case's one cause keeps, which `item-ref-declarations.oracle.test.ts` holds
          // the law oracle to over the same packages. Bound: the lawful control and one package for
          // each way a template default or a mapping fails to name its item's variable: undeclared,
          // the wrong kind, under an LTI link, its type, and its target.
          Effect.gen(function* itemRefPackages() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const [name, input, rule] of itemRefCases) {
              const dir = yield* scopedPackage(itemRefPackageEntries(input));
              const program = yield* readProgram(dir);
              const outcome = yield* db.apply(changeSetOf(Author, program.inputs), {});

              if (rule === undefined) {
                assert.strictEqual(
                  outcome.kind,
                  "accepted",
                  `${name}: ${Formatter.format(outcome)}`,
                );
              } else {
                assert.deepStrictEqual(
                  outcome.kind === "invariant-rejected"
                    ? [
                        ...new Set(
                          outcome.refused.laws.map((law): string | undefined =>
                            Option.getOrUndefined(ruleOfLaws([law])),
                          ),
                        ),
                      ]
                    : [outcome.kind],
                  [rule],
                  `${name}: every law the refusal names keeps ${rule}: ${Formatter.format(outcome)}`,
                );
              }
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "refuses an item ref that names no item of the package under Item ref target and the package laws its cause breaks, and accepts an LTI link",
        () =>
          // Oracle: PostgreSQL, every law of the schema over the import's one ChangeSet, against
          // the rules the law oracle predicts for the same packages
          // (`item-ref-declarations.oracle.test.ts`): an item ref's target and item are rows only
          // where the package holds them (lane NIL's NS3), so the item ref, and the assembly's name
          // that reads them, are refused under "Item ref target" beside the packaging law a missing
          // or unlisted file breaks, and under no law of a sentinel's. Bound: one bare item ref for
          // each target, the LTI link the control.
          Effect.gen(function* itemRefTargets() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const [target, rules] of itemRefTargetCases) {
              const input: ItemRefPackage = { defaults: [], mappings: [], target };
              const dir = yield* scopedPackage(itemRefPackageEntries(input));
              const program = yield* readProgram(dir);
              const outcome = yield* db.apply(changeSetOf(Author, program.inputs), {});
              const refused =
                outcome.kind === "invariant-rejected"
                  ? outcome.refused.laws.map((law): string | undefined =>
                      Option.getOrUndefined(ruleOfLaws([law])),
                    )
                  : [outcome.kind];

              if (rules.length === 0) {
                assert.strictEqual(
                  outcome.kind,
                  "accepted",
                  `${target}: ${Formatter.format(outcome)}`,
                );
              } else {
                assert.strictEqual(outcome.kind, "invariant-rejected", target);
                assert.isTrue(
                  refused.every((rule) => rule !== undefined && rules.includes(rule)),
                  `${target}: every law the refusal names keeps one of ${rules.join(", ")}: ${Formatter.format(outcome)}`,
                );
              }
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );
    });
  },
);
