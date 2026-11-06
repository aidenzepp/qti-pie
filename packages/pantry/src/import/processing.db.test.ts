import { inspect } from "node:util";
import { Db } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Option, Predicate, Result, Schema } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { changeSetOf, importPackage, readRows, retrySchedule } from "#pantry/import/package.ts";
import { ImportRefused, isMappedLaw, refusalOfLaw, ruleOfLaw } from "#pantry/import/refusal.ts";
import type { ImportLaw, ImportWitness, Rule } from "#pantry/import/refusal.ts";
import type { Rows } from "#pantry/import/tree.ts";
import { materializeProcessing } from "#pantry/processing/fixtures.ts";
import type { ProcessingFixtureName } from "#pantry/processing/fixtures.ts";
import { Correct, Null } from "#pantry/schema/expression.ts";
import {
  Equal,
  EqualTolerance,
  Index,
  Inside,
  OutcomeMinMax,
  Repeat,
  RoundTo,
  Variable,
  VariableWeightIdentifier,
} from "#pantry/schema/expression-attributes.ts";
import { AssessmentItem } from "#pantry/schema/item.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import { Edge, Node } from "#pantry/schema/node.ts";
import {
  BuiltInRef,
  DeclaredRef,
  Expression,
  ExpressionMax,
  Operand,
  ResponseProcessing,
  ResponseProcessingItem,
  TemplateParameterRef,
  VariableRef,
} from "#pantry/schema/processing.ts";
import {
  ResponseConditionArm,
  ResponseIfArm,
  RuleOperand,
  SetCorrectResponse,
  TemplateConditionArm,
  TemplateConstraint,
  TemplateIfArm,
  TemplateProcessing,
} from "#pantry/schema/rule.ts";
import { ancestryStepRows, KindEnters } from "#pantry/schema/seed/ancestry.ts";
import { operatorArity, operatorArityMax } from "#pantry/schema/seed/operator-arity.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The directory every export is written under: the package's gitignored `work/`.
 */
const exportRoot = `${import.meta.dirname}/../../work/export`;

/**
 * The packages whose import is accepted and whose export compares all equal: the two round-trip
 * packages of M3, the guard package whose four padded attributes are decision 19's witnesses, and
 * the padded identifier literal decision 157 reads trimmed.
 */
const roundTripped = [
  "processing-item",
  "rptemplates",
  "padded-processing",
  "padded-literal",
] as const satisfies readonly ProcessingFixtureName[];

/**
 * Each package the XML path refuses, with the rule its refusal names.
 *
 * The checker's P8, P20, P21, P22 (the lookup without a table), P23, P24, P25 (the response case),
 * P27 come from `broken/`, the builder's P5 and the guard's P30 from `guards/`, and the padded
 * reference package is refused by the database (`attribute-lexical`: the pattern law on `figures`,
 * whose source is the one string that `main`'s `integerOrVariableRef` (P6) and content's
 * `integerOrVariableString` both are, so the refusal names content's rule, the side the
 * forward-merge plan's F2 took for identical pairs). `padded-literal` is not refused: decision 157
 * reads its identifier literal with outer whitespace removed, so it is in `roundTripped`.
 * `p29-test-variables-weight-integer` is a bare `qti-outcome-processing` listed as an item, a root
 * the reader dispatches to no builder, so `documentRows` refuses it as `unmodeled-vocabulary`
 * before the package stage's test pass could check it; its P29 is `check.test.ts`'s, over a
 * hand-written test environment. Five packages hold content's vocabulary
 * (`qti-template-declaration`, `qti-context-declaration`, `qti-match-table`) that the reader
 * refuses on this branch, so their XML path is the join's (`join-m1-m3.db.test.ts`):
 * `p22-string-into-lookup`, `p25-number-correct-in-template`, `p26-template-reads-response` and
 * `empty-template-processing` are refused there, and `p26-template-reads-context` accepted, as it
 * is the positive control. P31 and P32 have no XML-path package: their negatives are the in-memory
 * sets of `guards/processing.test.ts`.
 */
const refused: readonly (readonly [ProcessingFixtureName, Rule])[] = [
  ["undeclared-reference", "P8"],
  ["p20-float-into-integer-outcome", "P20"],
  ["p21-sum-as-condition", "P21"],
  ["p22-lookup-without-table", "P22"],
  ["p23-and-string-operand", "P23"],
  ["p23-contains-singles", "P23"],
  ["p23-divide-multiple", "P23"],
  ["p23-duration-lt-integers", "P23"],
  ["p23-field-value-single", "P23"],
  ["p23-gcd-floats", "P23"],
  ["p23-gt-strings", "P23"],
  ["p23-index-single", "P23"],
  ["p23-inside-integer", "P23"],
  ["p23-integer-divide-floats", "P23"],
  ["p23-match-duration-pair", "P23"],
  ["p23-member-multiple-first", "P23"],
  ["p23-multiple-two-base-types", "P23"],
  ["p23-stats-operator-single", "P23"],
  ["p23-substring-integers", "P23"],
  ["p23-sum-record", "P23"],
  ["p24-figures-float-variable", "P24"],
  ["p25-number-correct-in-response", "P25"],
  ["p27-map-response-unmapped", "P27"],
  ["p29-test-variables-weight-integer", "unmodeled-vocabulary"],
  ["missing-identifier", "P5"],
  ["else-before-if", "P30"],
  ["padded-reference", "attribute-lexical"],
];

/**
 * A contract law as grizzle reports it: the contract's name, and no relation.
 */
const ContractLaw = Schema.Struct({ contract: Schema.String, kind: Schema.Literal("contract") });

/**
 * Whether a refusal's law is a contract law.
 */
const isContractLaw = Schema.is(ContractLaw);

/**
 * The rows an apply added to one relation.
 */
interface Count {
  readonly added: number;
  readonly relation: string;
}

/**
 * Whether an apply's answer is `accepted`, which carries the rows added per relation.
 *
 * @param outcome - What `db.apply` answered.
 * @returns True for `accepted`.
 */
const isAccepted = (
  outcome: unknown,
): outcome is { readonly counts: readonly Count[]; readonly kind: "accepted" } =>
  typeof outcome === "object" &&
  outcome !== null &&
  "kind" in outcome &&
  outcome.kind === "accepted" &&
  "counts" in outcome;

/**
 * Import a package, export it to `work/export/<name>/`, compare the export with the package, and
 * leave the rendered report beside it in `work/export/<name>.report.txt`.
 *
 * @param name - The derived package to round-trip.
 * @returns The package id, the rendered report, and the rows the apply added per relation.
 */
const roundTrip = (name: ProcessingFixtureName) =>
  Effect.gen(function* roundTripPackage() {
    const fs = yield* FileSystem.FileSystem;
    const source = yield* materializeProcessing(name);
    const exported = `${exportRoot}/${name}`;
    const counts: Count[] = [];
    const id = yield* importPackage(source, {
      wrapApply: (apply) =>
        apply.pipe(
          Effect.tap((outcome) =>
            Effect.sync(() => {
              if (isAccepted(outcome)) {
                counts.push(...outcome.counts);
              }
            }),
          ),
        ),
    });

    yield* fs.remove(exported, { force: true, recursive: true });
    yield* fs.makeDirectory(exported, { recursive: true });
    yield* exportPackage(id, exported);

    const report = yield* comparePackage(source, exported);
    const rendered = renderReport(report);

    yield* fs.writeFileString(`${exported}.report.txt`, `${rendered}\n`);

    return { counts, rendered, report };
  });

/**
 * A row as a test edits it: every field of the schema is text or a bigint.
 */
type Row = Record<string, string | bigint>;

/**
 * The importer's rows of a package, a mutable copy per relation, which an alteration edits in place
 * before the rows are applied.
 */
type Draft = Map<AnyRelation, Row[]>;

/**
 * The rows a derived package reads into, as `importPackage` builds them before the apply, built
 * anew for each test so that no two applies share an identity.
 */
const packageRows = (name: ProcessingFixtureName) =>
  Effect.gen(function* rowsOfPackage() {
    const { rows } = yield* readRows(yield* materializeProcessing(name));

    return rows;
  });

/**
 * A row from the entries of an importer fact, whose fields are all text or bigints.
 */
const rowOf = (entries: readonly (readonly [string, unknown])[]): Row =>
  Object.fromEntries(
    entries.map(([field, value]): [string, string | bigint] => [
      field,
      Predicate.isString(value) || Predicate.isBigInt(value)
        ? value
        : assert.fail(`${field} is neither text nor a bigint`),
    ]),
  );

const draftOf = (rows: Rows): Draft =>
  new Map(
    [...rows].map(([relation, facts]) => [
      relation,
      facts.map((fact) => rowOf(Object.entries(fact))),
    ]),
  );

/**
 * The editable rows of `relation`, an empty list when the draft has none.
 */
const of = (draft: Draft, relation: AnyRelation): Row[] => {
  const found = draft.get(relation);
  if (found !== undefined) {
    return found;
  }

  const created: Row[] = [];
  draft.set(relation, created);

  return created;
};

const text = (row: Row, field: string): string => {
  const value = row[field];

  return Predicate.isString(value) ? value : assert.fail(`${field} is not text`);
};

const position = (row: Row): bigint => {
  const value = row["position"];

  return Predicate.isBigInt(value) ? value : assert.fail("position is not a bigint");
};

/**
 * The first row of `relation` that `where` accepts, which the test expects to exist.
 */
const find = (draft: Draft, relation: AnyRelation, where: (row: Row) => boolean): Row => {
  const found = of(draft, relation).find(where);
  assert.isDefined(found, relation.name);

  return found ?? {};
};

/**
 * The first node of `kind`.
 */
const nodeOf = (draft: Draft, kind: string): Row =>
  find(draft, Node, (row) => text(row, "kind") === kind);

/**
 * The id of the first node of `kind`.
 */
const idOf = (draft: Draft, kind: string): string => text(nodeOf(draft, kind), "id");

/**
 * The `Edge` row whose child is `child`.
 */
const edgeInto = (draft: Draft, child: string): Row =>
  find(draft, Edge, (row) => text(row, "child") === child);

/**
 * The position after the last child of `parent`, which `Edge`'s key `(parent, position)` leaves
 * free.
 */
const nextPosition = (draft: Draft, parent: string): bigint => {
  let last = -1n;
  for (const edge of of(draft, Edge)) {
    if (text(edge, "parent") === parent && position(edge) > last) {
      last = position(edge);
    }
  }

  return last + 2n;
};

/**
 * Add a node of `kind` as the last child of `parent`, with the edge into it. The caller adds the
 * arm row.
 *
 * @returns The new node's id.
 */
const addNode = (draft: Draft, kind: string, parent: string): string => {
  const above = find(draft, Node, (row) => text(row, "id") === parent);
  const id = crypto.randomUUID();
  const parentAncestry = text(above, "ancestry");
  const parentKind = text(above, "kind");
  // The ancestry the importer computes for the child: the step of the parent's kind at its ancestry.
  const childAncestry =
    ancestryStepRows([parentKind], KindEnters).find((step) => step.ancestry === parentAncestry)
      ?.next ?? parentAncestry;
  const tree = text(above, "tree");
  const version = text(above, "version");

  of(draft, Node).push({
    ancestry: childAncestry,
    id,
    kind,
    prefix: "",
    rootKind: text(above, "rootKind"),
    tree,
    version,
  });
  of(draft, Edge).push({
    child: id,
    childAncestry,
    childKind: kind,
    parent,
    parentAncestry,
    parentKind,
    position: nextPosition(draft, parent),
    tree,
    version,
  });

  return id;
};

/**
 * The seeded arity of an expression kind: its fewest operands, and its most when it has an upper
 * bound.
 */
const arityOf = (kind: string) => {
  const min = operatorArity.find((row) => row.kind === kind)?.min;
  assert.isDefined(min, `no arity row for ${kind}`);

  return { max: operatorArityMax.find((row) => row.kind === kind)?.max, min: min ?? 0n };
};

/**
 * Add an expression node of `kind` under `parent`: its node, edge, `Expression` row,
 * `ExpressionMax` row when its kind is bounded, and its arm row.
 *
 * @returns The new expression's id.
 */
const addExpression = (draft: Draft, kind: string, parent: string, arm: AnyRelation): string => {
  const id = addNode(draft, kind, parent);
  const { max, min } = arityOf(kind);

  of(draft, Expression).push({
    bounded: max === undefined ? "unbounded" : "bounded",
    document: text(
      find(draft, Node, (row) => text(row, "id") === id),
      "tree",
    ),
    id,
    kind,
    min,
  });
  if (max !== undefined) {
    of(draft, ExpressionMax).push({ id, kind, max });
  }

  of(draft, arm).push({ id });

  return id;
};

/**
 * Add the `Operand` row that binds `child` to `expression` at the position of the child's edge.
 */
const linkOperand = (draft: Draft, expression: string, child: string): void => {
  of(draft, Operand).push({
    child,
    expression,
    position: position(edgeInto(draft, child)),
  });
};

/**
 * Add the `RuleOperand` row that binds `child` to the rule `rule` of kind `ruleKind` at the
 * position of the child's edge.
 */
const linkRuleOperand = (draft: Draft, rule: string, ruleKind: string, child: string): void => {
  of(draft, RuleOperand).push({
    child,
    position: position(edgeInto(draft, child)),
    rule,
    ruleKind,
  });
};

/**
 * Add a `qti-null` expression under the rule `rule` of kind `ruleKind`, as its one operand.
 */
const addRuleOperand = (draft: Draft, rule: string, ruleKind: string): string => {
  const child = addExpression(draft, "qti-null", rule, Null);
  linkRuleOperand(draft, rule, ruleKind, child);

  return child;
};

/**
 * Add a variable reference of the way `kind` for the node `id`, which is of kind `referrerKind`:
 * its `VariableRef` row and the declared or built-in row of the way it names.
 */
const addReference = (
  draft: Draft,
  id: string,
  referrerKind: string,
  way: { readonly builtIn: string } | { readonly declared: "outcome" | "response" },
): void => {
  const document = text(
    find(draft, Node, (row) => text(row, "id") === id),
    "tree",
  );

  if ("builtIn" in way) {
    of(draft, VariableRef).push({ document, id, kind: "builtIn" });
    of(draft, BuiltInRef).push({ id, name: way.builtIn, referrerKind });

    return;
  }

  of(draft, VariableRef).push({ document, id, kind: "declared" });
  of(draft, DeclaredRef).push({
    declarationKind: way.declared,
    document,
    id,
    identifier: way.declared === "response" ? "RESPONSE" : "SCORE",
    referrerKind,
  });
};

/**
 * Add a `qti-variable` node under `parent`. It is complete with `expression`: an `Expression`
 * row, its `ExpressionMax` row, its operand binding and its declared reference; without it only
 * the arm and the reference exist, so the arm containment into `Expression` is the one thing
 * missing.
 *
 * @returns The new node's id.
 */
const addVariable = (draft: Draft, parent: string, expression: boolean): string => {
  const id = expression
    ? addExpression(draft, "qti-variable", parent, Variable)
    : addNode(draft, "qti-variable", parent);

  if (expression) {
    linkOperand(draft, parent, id);
  } else {
    of(draft, Variable).push({ id });
  }

  addReference(draft, id, "qti-variable", { declared: "response" });

  return id;
};

/**
 * Add a `qti-correct` expression under `parent`. It is complete with `reference`: its
 * `VariableRef` row; without it the existence containment into `VariableRef` is the one thing
 * missing.
 *
 * @returns The new node's id.
 */
const addCorrect = (draft: Draft, parent: string, reference: boolean): string => {
  const id = addExpression(draft, "qti-correct", parent, Correct);
  linkOperand(draft, parent, id);

  if (reference) {
    addReference(draft, id, "qti-correct", { declared: "response" });
  }

  return id;
};

/**
 * Add a `qti-template-processing` node under the item, with its `TemplateProcessing` row.
 *
 * @returns The new node's id.
 */
const addTemplateProcessing = (draft: Draft): string => {
  const item = text(
    find(draft, AssessmentItem, () => true),
    "id",
  );
  const id = addNode(draft, "qti-template-processing", item);

  of(draft, TemplateProcessing).push({ id, item });

  return id;
};

/**
 * Add a `qti-template-condition` under `processing` with its `qti-template-if`, whose one operand
 * is a `qti-null`.
 *
 * @returns The ids of the condition and its `if`.
 */
const addTemplateCondition = (draft: Draft, processing: string) => {
  const condition = addNode(draft, "qti-template-condition", processing);
  of(draft, TemplateConditionArm).push({ id: condition });

  const branch = addNode(draft, "qti-template-if", condition);
  of(draft, TemplateIfArm).push({ condition, id: branch });
  addRuleOperand(draft, branch, "qti-template-if");

  return { branch, condition };
};

/**
 * Add a `qti-template-constraint` under `parent`, whose one operand is a `qti-null`.
 *
 * @returns The new node's id.
 */
const addTemplateConstraint = (draft: Draft, parent: string): string => {
  const id = addNode(draft, "qti-template-constraint", parent);

  of(draft, TemplateConstraint).push({ id });
  addRuleOperand(draft, id, "qti-template-constraint");

  return id;
};

/**
 * Add a `qti-set-correct-response` under `processing`, naming `RESPONSE` or a built-in variable.
 *
 * @returns The new node's id.
 */
const addSetCorrectResponse = (
  draft: Draft,
  processing: string,
  way: { readonly builtIn: string } | { readonly declared: "response" },
): string => {
  const id = addNode(draft, "qti-set-correct-response", processing);

  of(draft, SetCorrectResponse).push({ id });
  addReference(draft, id, "qti-set-correct-response", way);
  addRuleOperand(draft, id, "qti-set-correct-response");

  return id;
};

/**
 * Remove the node `root`, every node under it, and every row of any relation that names one of
 * them: its edges, its arm and its side rows.
 */
const removeSubtree = (draft: Draft, root: string): void => {
  const doomed = new Set([root]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const edge of of(draft, Edge)) {
      if (doomed.has(text(edge, "parent")) && !doomed.has(text(edge, "child"))) {
        doomed.add(text(edge, "child"));
        grew = true;
      }
    }
  }

  for (const [relation, facts] of draft) {
    draft.set(
      relation,
      facts.filter(
        (fact) => !Object.values(fact).some((v) => Predicate.isString(v) && doomed.has(v)),
      ),
    );
  }
};

/**
 * Remove every row of `relation` that `where` accepts, of which there may be none.
 */
const dropRows = (draft: Draft, relation: AnyRelation, where: (row: Row) => boolean): void => {
  draft.set(
    relation,
    of(draft, relation).filter((row) => !where(row)),
  );
};

/**
 * Remove every row of `relation` that `where` accepts, of which there must be one.
 */
const removeRows = (draft: Draft, relation: AnyRelation, where: (row: Row) => boolean): void => {
  const before = of(draft, relation).length;
  dropRows(draft, relation, where);
  assert.isBelow(of(draft, relation).length, before, `${relation.name} lost no row`);
};

/**
 * Move the edge into `child` under `parent`, and drop the operand rows that bound `child` to its
 * old parent, so that only the edge's own containments see the move.
 */
const reparent = (draft: Draft, child: string, parent: string): void => {
  const above = find(draft, Node, (row) => text(row, "id") === parent);
  const edge = edgeInto(draft, child);

  dropRows(draft, Operand, (row) => text(row, "child") === child);
  Object.assign(edge, {
    parent,
    parentKind: text(above, "kind"),
    position: nextPosition(draft, parent),
  });
};

/**
 * The first `Variable` node that is the operand of an expression.
 */
const operandVariable = (draft: Draft): string => {
  const operands = new Set(of(draft, Operand).map((row) => text(row, "child")));
  const found = of(draft, Variable).find((row) => operands.has(text(row, "id")));
  assert.isDefined(found, "no variable is an operand");

  return text(found ?? {}, "id");
};

/**
 * Apply the draft through the author role.
 */
const applyDraft = (draft: Draft) =>
  Effect.gen(function* applyChanges() {
    const db = yield* Db.open(AuthorApp.roles.author, {});

    return yield* db
      .apply(changeSetOf(draft), {})
      .pipe(Effect.retry({ schedule: retrySchedule, while: (e) => e._tag === "TransientFailure" }));
  });

/**
 * The selection of a side of a law, as grizzle reports it for a selected relation.
 */
const Selection = Schema.Array(Schema.Struct({ field: Schema.String, value: Schema.String }));

const SelectedSide = Schema.Struct({ selection: Selection });

/**
 * A side of a law as {@link ImportLaw} types it.
 */
interface LawSideOf {
  readonly fields: readonly string[];
  readonly relation: string;
}

const selectionText = (side: LawSideOf): string => {
  const selected = Schema.decodeUnknownOption(SelectedSide)(side);
  const selection = Option.isSome(selected) ? selected.value.selection : [];

  return selection.length > 0 ? `[${selection.map((s) => `${s.field}=${s.value}`).join(",")}]` : "";
};

const sideText = (side: LawSideOf): string =>
  `${side.relation}(${side.fields.join(",")})${selectionText(side)}`;

/**
 * A law as a structural string: its kind, the relations and fields it names, and the pattern's
 * source. Never the refusal's message.
 */
const lawOf = (law: ImportLaw): string => {
  if (law.kind === "key" || law.kind === "primaryKey") {
    return `${law.kind} ${law.relation}(${law.fields.join(",")})`;
  }

  if (law.kind === "check") {
    return `check ${law.relation}.${law.name}`;
  }

  if (law.kind === "capacity") {
    return `capacity ${sideText(law.target)} by ${sideText(law.from)}`;
  }

  if (law.kind === "contained" || law.kind === "mirrors" || law.kind === "coverage") {
    return `${law.kind} ${sideText(law.from)} into ${sideText(law.to)}`;
  }

  if (law.kind === "alternatives") {
    return `alternatives ${law.relation}.${law.field}`;
  }

  if (law.kind === "alternativesArm") {
    return `alternativesArm ${law.arm} of ${law.relation}.${law.field}`;
  }

  if (law.kind === "contract") {
    return `contract ${law.contract}`;
  }

  return law.kind === "pattern"
    ? `pattern ${law.source}`
    : `numericBound ${law.relation}.${law.field}`;
};

/**
 * One alteration of `processing-item`'s rows, the law it breaks and the rule the map names for it.
 *
 * `laws` lists the laws the alteration may be refused by when the schema cannot isolate one: any
 * of them is accepted, and the one grizzle reports is recorded. `spec` names the rule the spec's
 * 4.10 gives the fixture when the map names another.
 */
interface Negative {
  readonly alter: (draft: Draft) => void;
  readonly base?: ProcessingFixtureName;
  readonly laws: readonly string[];
  readonly mapped?: boolean;
  readonly name: string;
  readonly rule: Rule;
  readonly spec?: string;
}

const contains = (from: string, to: string): string => `contained ${from} into ${to}`;

const capacityOf = (target: string, from: string): string => `capacity ${target} by ${from}`;

/**
 * Each alteration changes the rows of `processing-item` so that exactly one statement of the
 * schema is broken, and every copy of an altered field is altered with it, so a refusal by another
 * statement is a finding.
 */
const negatives: readonly Negative[] = [
  {
    alter: (draft) => {
      const not = idOf(draft, "qti-not");
      linkOperand(draft, not, addExpression(draft, "qti-null", not, Null));
    },
    laws: [capacityOf("ExpressionMax(id)", "Operand(expression)")],
    name: "P2: a qti-not with two operands is refused by the ExpressionMax capacity",
    rule: "P2",
  },
  {
    alter: (draft) => {
      const match = idOf(draft, "qti-match");
      removeRows(
        draft,
        Operand,
        (row) => text(row, "expression") === match && position(row) === 1n,
      );
    },
    laws: [capacityOf("Expression(id)", "Operand(expression)")],
    name: "P2: a qti-match with one operand is refused by the min capacity",
    rule: "P2",
  },
  {
    alter: (draft) => {
      const not = idOf(draft, "qti-not");
      Object.assign(
        find(draft, Expression, (row) => text(row, "id") === not),
        { bounded: "unbounded" },
      );
    },
    laws: [contains("Expression(kind)[bounded=unbounded]", "OperatorArityUnbounded(kind)")],
    name: "P2: a qti-not marked unbounded is refused by the selected containment",
    rule: "P2",
  },
  {
    alter: (draft) => {
      const node = idOf(draft, "qti-response-if");
      of(draft, Expression).push({
        bounded: "unbounded",
        document: text(nodeOf(draft, "qti-response-if"), "tree"),
        id: node,
        kind: "qti-response-if",
        min: 0n,
      });
    },
    laws: [
      contains("Expression(kind,min)", "OperatorArity(kind,min)"),
      contains("Expression(kind)[bounded=unbounded]", "OperatorArityUnbounded(kind)"),
    ],
    name: "P2: an Expression of kind qti-response-if is refused by the arity containments",
    rule: "P2",
  },
  {
    alter: (draft) => {
      const nul = idOf(draft, "qti-null");
      removeRows(draft, ExpressionMax, (row) => text(row, "id") === nul);
    },
    laws: [contains("Expression(id,kind)[bounded=bounded]", "ExpressionMax(id,kind)")],
    name: "P2: a bounded Expression with no ExpressionMax row is refused by the selected containment",
    rule: "P2",
  },
  {
    alter: (draft) => {
      const [operand] = of(draft, Operand);
      assert.isDefined(operand);
      Object.assign(operand ?? {}, { position: position(operand ?? {}) + 1n });
    },
    laws: [contains("Operand(child,expression,position)", "Edge(child,parent,position)")],
    name: "P1: an Operand with no matching Edge is refused by the binding containment",
    rule: "condition-edge",
  },
  {
    alter: (draft) => {
      Object.assign(
        find(draft, DeclaredRef, (row) => text(row, "referrerKind") === "qti-correct"),
        { declarationKind: "outcome", identifier: "SCORE" },
      );
    },
    laws: ["check DeclaredRef.DeclaredRefKind"],
    name: "P8: a DeclaredRef (qti-correct, outcome) is refused by the referring-kind check",
    rule: "P8",
  },
  {
    alter: (draft) => {
      addSetCorrectResponse(draft, addTemplateProcessing(draft), { builtIn: "numAttempts" });
    },
    laws: ["check BuiltInRef.BuiltInRefKind"],
    name: "P9: a BuiltInRef (qti-set-correct-response, numAttempts) is refused by the check",
    rule: "P9",
  },
  {
    alter: (draft) => {
      Object.assign(
        find(draft, Inside, () => true),
        { coords: "0,0" },
      );
    },
    laws: ["contract ExpressionCoords"],
    name: "P6: an Inside with coords 0,0 is refused by the ExpressionCoords contract",
    rule: "P6",
  },
  {
    alter: (draft) => {
      Object.assign(
        find(draft, Repeat, () => true),
        {
          numberRepeatsKind: "literal",
          numberRepeatsValue: 2_147_483_648n,
        },
      );
    },
    laws: ["check Repeat.RepeatInt"],
    name: "P6: a Repeat (literal, 2147483648) is refused by the xs:int range check",
    rule: "P6",
  },
  {
    alter: (draft) => {
      Object.assign(
        find(draft, Inside, () => true),
        { coords: "0,0,10,10 " },
      );
    },
    laws: ["contract ExpressionCoords"],
    name: "P6: an Inside with coords 0,0,10,10 and a trailing space is refused (the replace witness)",
    rule: "P6",
  },
  {
    alter: (draft) => {
      Object.assign(
        find(draft, RoundTo, () => true),
        {
          figuresKind: "literal",
          figuresValue: 0n,
          roundingMode: "significantFigures",
        },
      );
    },
    laws: ["check RoundTo.RoundToFigures"],
    name: "P10: a RoundTo (significantFigures, literal, 0) is refused by the figures check",
    rule: "P10",
  },
  {
    alter: (draft) => {
      Object.assign(
        find(draft, Index, () => true),
        { nKind: "literal", nValue: 0n },
      );
    },
    laws: ["check Index.IndexPositive"],
    name: "P11: an Index (literal, 0) is refused by the positive check",
    rule: "P11",
  },
  {
    alter: (draft) => {
      const absolute = text(
        find(draft, Equal, (row) => text(row, "toleranceMode") === "absolute"),
        "id",
      );
      removeRows(draft, EqualTolerance, (row) => text(row, "node") === absolute);
    },
    laws: [contains("Equal(id)[toleranceMode=absolute]", "EqualTolerance(node)")],
    name: "P36: an Equal absolute with no EqualTolerance is refused by the selected containment",
    rule: "P36",
  },
  {
    alter: (draft) => {
      const rule = idOf(draft, "qti-set-outcome-value");
      const extra = addExpression(draft, "qti-null", rule, Null);
      linkRuleOperand(draft, rule, "qti-set-outcome-value", extra);
    },
    laws: ["primaryKey RuleOperand(rule)"],
    mapped: false,
    name: "P3: two RuleOperand rows for one qti-set-outcome-value are refused by the rule's primary key",
    rule: "document-key",
    spec: "P3",
  },
  {
    alter: (draft) => {
      const and = idOf(draft, "qti-and");
      const operand = find(draft, Operand, (row) => text(row, "expression") === and);
      of(draft, RuleOperand).push({
        child: text(operand, "child"),
        position: position(operand),
        rule: and,
        ruleKind: "qti-and",
      });
    },
    laws: ["check RuleOperand.RuleOperandKind"],
    name: "P3: a RuleOperand whose rule is a qti-and node is refused by the ruleKind check",
    rule: "P3",
  },
  {
    alter: (draft) => {
      const sum = idOf(draft, "qti-sum");
      of(draft, OutcomeMinMax).push({ id: sum, kind: "qti-sum", outcomeIdentifier: "SCORE" });
    },
    laws: ["check OutcomeMinMax.OutcomeMinMaxKind"],
    name: "an OutcomeMinMax row on a qti-sum node is refused by the kind check",
    rule: "outcome-minmax-kind",
  },
  {
    alter: (draft) => {
      const condition = text(
        find(draft, ResponseConditionArm, () => true),
        "id",
      );
      const branch = addNode(draft, "qti-response-if", condition);

      of(draft, ResponseIfArm).push({ condition, id: branch });
      addRuleOperand(draft, branch, "qti-response-if");
    },
    laws: ["key ResponseIfArm(condition)"],
    name: "P4: two ResponseIfArm rows with one condition are refused by the condition's key",
    rule: "P4",
  },
  {
    alter: (draft) => {
      addTemplateProcessing(draft);
      addTemplateProcessing(draft);
    },
    laws: ["key TemplateProcessing(item)"],
    name: "P17: two TemplateProcessing rows for one item are refused by the item's key",
    rule: "P17",
  },
  {
    alter: (draft) => {
      removeRows(draft, ResponseProcessingItem, () => true);
    },
    laws: [
      "mirrors ResponseProcessing(id)[rootKind=item] into ResponseProcessingItem(id)",
      "mirrors ResponseProcessingItem(id) into ResponseProcessing(id)[rootKind=item]",
    ],
    name: "an item-rooted ResponseProcessing with no ResponseProcessingItem row is refused by the mirrors",
    rule: "processing-item",
  },
  {
    alter: (draft) => {
      const held = find(draft, ResponseProcessingItem, () => true);
      const template = find(
        draft,
        ResponseProcessing,
        (row) => text(row, "rootKind") === "rptemplate",
      );

      removeSubtree(draft, text(held, "id"));
      of(draft, ResponseProcessingItem).push({
        id: text(template, "id"),
        item: text(held, "item"),
      });
    },
    base: "rptemplates",
    laws: [
      "mirrors ResponseProcessingItem(id) into ResponseProcessing(id)[rootKind=item]",
      contains("ResponseProcessingItem(id,item)", "Edge(child,parent)"),
    ],
    name: "a ResponseProcessingItem row on a template-rooted ResponseProcessing is refused by the mirrors",
    rule: "processing-item",
  },
  {
    alter: (draft) => {
      const root = find(draft, ResponseProcessing, (row) => text(row, "rootKind") === "rptemplate");
      const placed = find(draft, Node, (row) => text(row, "id") === text(root, "id"));
      const id = crypto.randomUUID();

      of(draft, Node).push({ ...placed, id });
      of(draft, ResponseProcessing).push({ id, rootKind: "rptemplate" });
    },
    base: "rptemplates",
    laws: [contains("ResponseProcessing(id)[rootKind=rptemplate]", "TreeRoot(node)")],
    name: "a template-rooted ResponseProcessing that is not its tree's root is refused by the TreeRoot containment",
    rule: "processing-root",
  },
  {
    alter: (draft) => {
      const processing = addTemplateProcessing(draft);
      const { branch } = addTemplateCondition(draft, processing);
      addTemplateConstraint(draft, branch);
    },
    laws: [contains("Edge(version,parentKind,childKind)", "Admission(version,parent,child)")],
    name: "P1: an Edge (qti-template-if, qti-template-constraint) is refused by the admission (element-only)",
    rule: "admission",
  },
  {
    alter: (draft) => {
      reparent(draft, operandVariable(draft), idOf(draft, "qti-correct"));
    },
    laws: [contains("Edge(version,parentKind,childKind)", "Admission(version,parent,child)")],
    name: "P1: an Edge (qti-correct, qti-variable) is refused by the admission (empty)",
    rule: "admission",
  },
  {
    alter: (draft) => {
      reparent(draft, operandVariable(draft), idOf(draft, "qti-base-value"));
    },
    laws: [contains("Edge(version,parentKind,childKind)", "Admission(version,parent,child)")],
    name: "P1: an Edge (qti-base-value, qti-variable) is refused by the admission (string)",
    rule: "admission",
  },
  {
    alter: (draft) => {
      of(draft, VariableWeightIdentifier).push({
        node: operandVariable(draft),
        rootKind: "item",
        value: "WEIGHT",
      });
    },
    laws: ["check VariableWeightIdentifier.VariableWeightInTest"],
    name: "P12: a VariableWeightIdentifier with rootKind item is refused by the check",
    rule: "P12",
  },
  {
    alter: (draft) => {
      const id = addExpression(draft, "qti-variable", idOf(draft, "qti-and"), Variable);
      const document = text(
        find(draft, Node, (row) => text(row, "id") === id),
        "tree",
      );

      linkOperand(draft, idOf(draft, "qti-and"), id);
      of(draft, VariableRef).push({ document, id, kind: "templateParameter" });
      of(draft, TemplateParameterRef).push({
        document,
        id,
        identifier: "TEMPLATE",
        referrerKind: "qti-variable",
        rootKind: "item",
      });
    },
    laws: ["check TemplateParameterRef.TemplateParameterRoot"],
    name: "P13: a TemplateParameterRef with rootKind item is refused by the check",
    rule: "P13",
  },
  {
    alter: (draft) => {
      addReference(draft, idOf(draft, "qti-sum"), "qti-sum", { declared: "response" });
    },
    laws: ["check DeclaredRef.DeclaredRefKind"],
    name: "a DeclaredRef whose referrerKind is qti-sum is refused by the referring-kind check",
    rule: "P8",
  },
  {
    alter: (draft) => {
      addVariable(draft, idOf(draft, "qti-and"), false);
    },
    laws: [contains("Variable(id)", "Expression(id)")],
    name: "a Variable(id) row with no Expression row is refused by the arm containment",
    rule: "arm-expression",
  },
  {
    alter: (draft) => {
      addCorrect(draft, idOf(draft, "qti-and"), false);
    },
    laws: [contains("Correct(id)", "VariableRef(id)")],
    name: "a Correct(id) row with no VariableRef row is refused by the existence containment",
    rule: "ref-exists",
  },
  {
    alter: (draft) => {
      const arms = of(draft, ResponseIfArm);
      const [first, second] = arms;
      assert.isDefined(first);
      assert.isDefined(second);

      reparent(draft, text(second ?? {}, "id"), text(first ?? {}, "condition"));
    },
    laws: [contains("ResponseIfArm(id,condition)", "Edge(child,parent)")],
    name: "S2: a ResponseIfArm whose condition is not its Edge parent is refused by the binding containment",
    rule: "condition-edge",
  },
];

describe.skipIf(!hasLease)(
  "import/processing.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the round trip of the processing packages and the XML-path refusals", (it) => {
      for (const name of roundTripped) {
        it.effect(`${name} is accepted and its export compares all equal`, () =>
          Effect.gen(function* roundTripEqual() {
            const started = Date.now();
            const { counts, rendered, report } = yield* roundTrip(name);

            assert.isAbove(report.length, 0);
            assert.strictEqual(
              report.filter((item) => item.outcome.kind === "differs").length,
              0,
              rendered,
            );
            assert.strictEqual(
              report.find((item) => item.path === "imsmanifest.xml")?.outcome.kind,
              "canonical-equal",
            );

            yield* Effect.log(`${name}: round trip ${Date.now() - started} ms`);

            if (name === "processing-item") {
              const fs = yield* FileSystem.FileSystem;
              const lines = counts
                .filter((count) => count.added > 0)
                .map((count) => `${count.relation}: ${count.added}`)
                .toSorted();

              yield* fs.writeFileString(
                `${exportRoot}/${name}.counts.txt`,
                `${lines.join("\n")}\n`,
              );
            }
          }),
        );
      }

      it.effect("rptemplates round-trips each of the five template documents canonical-equal", () =>
        Effect.gen(function* templatesEqual() {
          const { report } = yield* roundTrip("rptemplates");
          const documents = report.filter((item) => item.path.startsWith("rptemplates/"));

          assert.deepStrictEqual(documents.map((item) => item.path).toSorted(), [
            "rptemplates/CC2_map_response.xml",
            "rptemplates/CC2_match.xml",
            "rptemplates/CC2_match_basic.xml",
            "rptemplates/map_response.xml",
            "rptemplates/match_correct.xml",
          ]);
          assert.deepStrictEqual(
            documents.map((item) => item.outcome.kind),
            documents.map(() => "canonical-equal"),
          );
        }),
      );

      for (const [name, rule] of refused) {
        it.effect(`${name} is refused naming ${rule}`, () =>
          Effect.gen(function* refusedNamingRule() {
            const result = yield* importPackage(yield* materializeProcessing(name)).pipe(
              Effect.result,
            );

            assert.isTrue(Result.isFailure(result), `${name} was accepted`);

            if (Result.isFailure(result)) {
              assert.isTrue(
                result.failure instanceof ImportRefused,
                `${name} failed with ${String(result.failure)}`,
              );
              assert.strictEqual(
                result.failure instanceof ImportRefused ? result.failure.rule : undefined,
                rule,
                String(result.failure),
              );
            }
          }),
        );
      }
    });

    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the bin 1 rules of the processing model, by direct ChangeSet", (it) => {
      const lawsFile = `${exportRoot}/processing.laws.txt`;

      /**
       * Append what one refusal said to `work/export/processing.laws.txt`, verbatim.
       */
      const record = (negative: Negative, law: ImportLaw, witness: ImportWitness) =>
        Effect.gen(function* recordLaw() {
          const fs = yield* FileSystem.FileSystem;
          const refusal = refusalOfLaw(law, witness);

          yield* fs.makeDirectory(exportRoot, { recursive: true });
          yield* fs.writeFileString(
            lawsFile,
            [
              negative.name,
              `  law: ${lawOf(law)}`,
              `  rule: ${ruleOfLaw(law)}; spec: ${negative.spec ?? negative.rule}; mapped: ${isMappedLaw(law)}`,
              `  detail: ${refusal.detail}`,
              `  law json: ${inspect(law, { breakLength: Infinity, depth: null })}`,
              `  witness json: ${inspect(witness, { breakLength: Infinity, depth: null })}`,
              "",
              "",
            ].join("\n"),
            { flag: "a" },
          );
        });

      it.effect("starts the laws record", () =>
        Effect.gen(function* startRecord() {
          const fs = yield* FileSystem.FileSystem;

          yield* fs.makeDirectory(exportRoot, { recursive: true });
          yield* fs.writeFileString(lawsFile, "");
        }),
      );

      for (const negative of negatives) {
        it.effect(negative.name, () =>
          Effect.gen(function* refusedByLaw() {
            const draft = draftOf(yield* packageRows(negative.base ?? "processing-item"));
            negative.alter(draft);

            const started = Date.now();
            const outcome = yield* applyDraft(draft);

            yield* Effect.log(`${negative.name}: apply ${Date.now() - started} ms`);

            assert.strictEqual(
              outcome.kind,
              "invariant-rejected",
              `${negative.name}: ${outcome.kind}`,
            );

            if (outcome.kind === "invariant-rejected") {
              const law: ImportLaw = outcome.law;
              const witness: ImportWitness = outcome.witness;
              const refusal = refusalOfLaw(law, witness);

              yield* record(negative, law, witness);
              assert.include(
                negative.laws,
                lawOf(law),
                `${negative.name}: ${inspect(law, { depth: null })}`,
              );
              assert.strictEqual(ruleOfLaw(law), negative.rule, lawOf(law));
              assert.strictEqual(refusal.rule, negative.rule);
              assert.strictEqual(isMappedLaw(law), negative.mapped ?? true, lawOf(law));

              if (law.kind === "contract") {
                assert.isTrue(
                  isContractLaw(refusal.law),
                  "the refusal's law is not a contract law",
                );
              }
            }
          }),
        );
      }

      it.effect("the unaltered rows are accepted, so each refusal above is its alteration's", () =>
        Effect.gen(function* unalteredAccepted() {
          const outcome = yield* applyDraft(draftOf(yield* packageRows("processing-item")));

          assert.strictEqual(outcome.kind, "accepted");
        }),
      );

      it.effect(
        "the unaltered rows of rptemplates are accepted, for the fixtures cut from them",
        () =>
          Effect.gen(function* templatesAccepted() {
            const outcome = yield* applyDraft(draftOf(yield* packageRows("rptemplates")));

            assert.strictEqual(outcome.kind, "accepted");
          }),
      );

      it.effect("the complete forms the fixtures are cut from are accepted", () =>
        Effect.gen(function* completeFormsAccepted() {
          const draft = draftOf(yield* packageRows("processing-item"));
          const and = idOf(draft, "qti-and");
          const processing = addTemplateProcessing(draft);

          addTemplateConstraint(draft, processing);
          addTemplateCondition(draft, processing);
          addSetCorrectResponse(draft, processing, { declared: "response" });
          addVariable(draft, and, true);
          addCorrect(draft, and, true);

          const outcome = yield* applyDraft(draft);

          assert.strictEqual(outcome.kind, "accepted", inspect(outcome, { depth: 3 }));
        }),
      );
    });
  },
);
