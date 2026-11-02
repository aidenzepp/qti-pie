/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The processing guards: the facts about the rows of a processing tree that no single relation can
 * state, judged over the rows an import built before any of them is written (spec 4.10, bin 2).
 */
import type { AnyRelation } from "@bjornpagen/grizzle";
import { Effect, Predicate, Schema } from "effect";
import { Rows } from "#qti/import/tree.ts";
import { literalOrRef } from "#qti/processing/parse.ts";
import * as attributed from "#qti/schema/expression-attributes.ts";
import { expressionKinds } from "#qti/schema/kinds/asi.ts";
import { Edge, EntityReference, Node, TextNode, vocabularies, Ws } from "#qti/schema/node.ts";
import * as processing from "#qti/schema/processing.ts";
import * as ruleSchema from "#qti/schema/rule.ts";
import { operatorArity, operatorArityMax } from "#qti/schema/seed/operator-arity.ts";

/**
 * A processing guard refused the rows.
 *
 * `rule` is the id of the guard in 4.10 and `detail` names the first row that broke it.
 */
export class ProcessingGuardRefusal extends Schema.TaggedError<ProcessingGuardRefusal>()(
  "ProcessingGuardRefusal",
  { detail: Schema.String, rule: Schema.Literals(["P28", "P30", "P31", "P32"]) },
) {
  /**
   * What was refused, in one sentence.
   */
  override get message(): string {
    return `The processing rows break ${this.rule}: ${this.detail}`;
  }
}

/**
 * The first refusal a check finds, or nothing when its rows are sound.
 */
type Finding = ProcessingGuardRefusal | undefined;

const refuse = (rule: ProcessingGuardRefusal["rule"], detail: string): ProcessingGuardRefusal =>
  new ProcessingGuardRefusal({ detail, rule });

const quoted = (text: string): string => JSON.stringify(text);

const byPosition = (a: { readonly position: bigint }, b: { readonly position: bigint }): number =>
  Number(a.position - b.position);

/**
 * The kinds of the 64 expressions.
 */
const expressions: ReadonlySet<string> = new Set(expressionKinds);

/**
 * The kinds that are elements: the registries' generic kinds (text, comments and the like) have no
 * local name.
 */
const elements: ReadonlySet<string> = new Set(
  vocabularies.flatMap((vocabulary) =>
    Object.entries<{ readonly local: string }>(vocabulary.registry)
      .filter(([, row]) => row.local !== "")
      .map(([kind]) => kind),
  ),
);

/**
 * The six rules a `qti-template-processing` holds.
 */
const templateRuleKinds: ReadonlySet<string> = new Set([
  "qti-exit-template",
  "qti-set-correct-response",
  "qti-set-default-value",
  "qti-set-template-value",
  "qti-template-condition",
  "qti-template-constraint",
]);

/**
 * The twelve rules that hold exactly one expression, each as a `RuleOperand` row: the
 * value-setting rules, the template constraint and the `if` and `else-if` branches.
 */
const holderKinds: ReadonlySet<string> = new Set([
  "qti-lookup-outcome-value",
  "qti-outcome-else-if",
  "qti-outcome-if",
  "qti-response-else-if",
  "qti-response-if",
  "qti-set-correct-response",
  "qti-set-default-value",
  "qti-set-outcome-value",
  "qti-set-template-value",
  "qti-template-constraint",
  "qti-template-else-if",
  "qti-template-if",
]);

/**
 * The branches that hold an expression before their rules.
 */
const branchKinds: ReadonlySet<string> = new Set([
  "qti-outcome-else-if",
  "qti-outcome-if",
  "qti-response-else-if",
  "qti-response-if",
  "qti-template-else-if",
  "qti-template-if",
]);

/**
 * The lookups the checks share: each parent's edges in position order and the character content of
 * the character nodes.
 */
interface Index {
  readonly children: ReadonlyMap<
    string,
    readonly { readonly child: string; readonly childKind: string }[]
  >;
  readonly pieces: ReadonlyMap<string, string>;
}

const indexOf = (rows: Rows): Index => ({
  children: Map.groupBy(Rows.of(rows, Edge).toSorted(byPosition), (edge) => edge.parent),
  pieces: new Map([
    ...Rows.of(rows, TextNode).map((row): [string, string] => [row.id, row.value]),
    ...Rows.of(rows, Ws).map((row): [string, string] => [row.id, row.value]),
    ...Rows.of(rows, EntityReference).map((row): [string, string] => [row.id, `&${row.name};`]),
  ]),
});

/**
 * The character content of a node as its `text`, `ws` and `entityRef` children give it, in order.
 */
const contentOf = (index: Index, id: string): string =>
  (index.children.get(id) ?? []).map((edge) => index.pieces.get(edge.child) ?? "").join("");

/**
 * `P28`: every `qti-template-processing` has a rule child among the six template rules, a count
 * over six kinds that no single-selector capacity states.
 */
const templateProcessingHasRule = (rows: Rows, index: Index): Finding => {
  for (const row of Rows.of(rows, ruleSchema.TemplateProcessing)) {
    const held = index.children.get(row.id) ?? [];
    if (!held.some((edge) => templateRuleKinds.has(edge.childKind))) {
      return refuse("P28", `The qti-template-processing ${row.id} holds no template rule.`);
    }
  }

  return undefined;
};

/**
 * The first child that breaks a sequence of kinds: a kind of the sequence that follows one of a
 * later rank. A kind outside the sequence is skipped.
 */
const outOfOrder = (
  edges: readonly { readonly childKind: string }[],
  sequence: readonly string[],
): { readonly kind: string; readonly after: string } | undefined => {
  let last = -1;
  for (const edge of edges) {
    const rank = sequence.indexOf(edge.childKind);
    if (rank === -1) {
      continue;
    }

    if (rank < last) {
      return { after: sequence[last] ?? "", kind: edge.childKind };
    }

    last = rank;
  }

  return undefined;
};

/**
 * The sequences of kinds a parent kind's content model fixes (phase-1's ordering class stated for
 * the processing hosts): the `if`, `else-if` and `else` of each condition, and, under the item
 * root, the template declarations before the template processing and the response processing
 * before the modal feedback.
 */
const sequences: ReadonlyMap<string, readonly (readonly string[])[]> = new Map([
  ...["outcome", "response", "template"].map(
    (language): [string, readonly (readonly string[])[]] => [
      `qti-${language}-condition`,
      [[`qti-${language}-if`, `qti-${language}-else-if`, `qti-${language}-else`]],
    ],
  ),
  [
    "qti-assessment-item",
    [
      ["qti-template-declaration", "qti-template-processing"],
      ["qti-response-processing", "qti-modal-feedback"],
    ],
  ],
]);

/**
 * The first child of an expression-carrying host that breaks its order: under a branch the
 * expression precedes the rules, and under `qti-custom-operator` the QTI operands precede any
 * foreign child.
 */
const expressionFirst = (id: string, parentKind: string, index: Index): Finding => {
  if (!branchKinds.has(parentKind) && parentKind !== "qti-custom-operator") {
    return undefined;
  }

  let other: string | undefined;
  for (const edge of index.children.get(id) ?? []) {
    if (expressions.has(edge.childKind)) {
      if (other !== undefined) {
        return refuse(
          "P30",
          `Under ${parentKind} ${id}, the expression ${edge.childKind} follows ${other}; the expressions come first.`,
        );
      }
    } else if (elements.has(edge.childKind)) {
      other = edge.childKind;
    }
  }

  return undefined;
};

/**
 * `P30`: the children of each processing host come in the order of its content model.
 */
const ordering = (rows: Rows, index: Index): Finding => {
  for (const node of Rows.of(rows, Node)) {
    const edges = index.children.get(node.id) ?? [];
    for (const sequence of sequences.get(node.kind) ?? []) {
      const found = outOfOrder(edges, sequence);
      if (found !== undefined) {
        return refuse(
          "P30",
          `Under ${node.kind} ${node.id}, a ${found.kind} follows a ${found.after}; the sequence is ${sequence.join(", ")}.`,
        );
      }
    }

    const first = expressionFirst(node.id, node.kind, index);
    if (first !== undefined) {
      return first;
    }
  }

  return undefined;
};

/**
 * `P31`: every expression child of an expression has an `Operand` row, and every expression child
 * of a single-expression holder has a `RuleOperand` row.
 */
const operandRows = (rows: Rows): Finding => {
  const operands = new Set(
    Rows.of(rows, processing.Operand).map((row) => `${row.expression}/${row.child}`),
  );
  const held = new Set(
    Rows.of(rows, ruleSchema.RuleOperand).map((row) => `${row.rule}/${row.child}`),
  );
  for (const edge of Rows.of(rows, Edge)) {
    if (!expressions.has(edge.childKind)) {
      continue;
    }

    const at = `${edge.parent}/${edge.child}`;
    if (expressions.has(edge.parentKind) && !operands.has(at)) {
      return refuse(
        "P31",
        `The ${edge.childKind} ${edge.child} under the ${edge.parentKind} ${edge.parent} has no Operand row.`,
      );
    }

    if (holderKinds.has(edge.parentKind) && !held.has(at)) {
      return refuse(
        "P31",
        `The ${edge.childKind} ${edge.child} under the ${edge.parentKind} ${edge.parent} has no RuleOperand row.`,
      );
    }
  }

  return undefined;
};

/**
 * What an arm row holds: the node's id and the value copied from its text.
 */
const ArmRow = Schema.Struct({ id: Schema.String, value: Schema.String });

const isArmRow = Schema.is(ArmRow);

/**
 * The `qti-base-value` arms: each holds the id of its node and the text it copies.
 */
const literalArms: readonly AnyRelation[] = Object.values<unknown>(processing.relations).filter(
  (member): member is AnyRelation =>
    Predicate.hasProperty(member, "fields") &&
    Predicate.hasProperty(member, "name") &&
    typeof member.name === "string" &&
    member.name.startsWith("Literal") &&
    member.name !== "Literal",
);

/**
 * The typed copy of a mixed-union column as the importer writes it: the kind and, for a literal
 * integer, the number.
 */
const copyOf = (column: string): { readonly kind: "literal" | "ref"; readonly value: bigint } => {
  const parsed = literalOrRef(column);

  return parsed._tag === "ref"
    ? { kind: "ref", value: 0n }
    : { kind: "literal", value: /^[+-]?[0-9]+$/u.test(parsed.value) ? BigInt(parsed.value) : 0n };
};

/**
 * `P32` of the literals: each arm row holds the concatenation of its node's text children.
 */
const literalCopy = (rows: Rows, index: Index): Finding => {
  for (const relation of literalArms) {
    for (const row of rows.get(relation) ?? []) {
      if (!isArmRow(row)) {
        continue;
      }

      const expected = contentOf(index, row.id);
      if (row.value !== expected) {
        return refuse(
          "P32",
          `${relation.name} ${row.id} holds ${quoted(row.value)}; its text children give ${quoted(expected)}.`,
        );
      }
    }
  }

  return undefined;
};

/**
 * `P32` of the integer copies: `figuresValue`, `nValue` and `numberRepeatsValue` and their kinds
 * agree with the lexical column beside them.
 */
const integerCopy = (rows: Rows): Finding => {
  const copies: readonly {
    readonly column: string;
    readonly id: string;
    readonly kind: string;
    readonly name: string;
    readonly value: bigint;
  }[] = [
    ...Rows.of(rows, attributed.EqualRounded).map((row) => ({
      column: row.figures,
      id: row.id,
      kind: row.figuresKind,
      name: "EqualRounded.figures",
      value: row.figuresValue,
    })),
    ...Rows.of(rows, attributed.RoundTo).map((row) => ({
      column: row.figures,
      id: row.id,
      kind: row.figuresKind,
      name: "RoundTo.figures",
      value: row.figuresValue,
    })),
    ...Rows.of(rows, attributed.Index).map((row) => ({
      column: row.n,
      id: row.id,
      kind: row.nKind,
      name: "Index.n",
      value: row.nValue,
    })),
    ...Rows.of(rows, attributed.Repeat).map((row) => ({
      column: row.numberRepeats,
      id: row.id,
      kind: row.numberRepeatsKind,
      name: "Repeat.numberRepeats",
      value: row.numberRepeatsValue,
    })),
  ];
  for (const copy of copies) {
    const expected = copyOf(copy.column);
    if (copy.kind !== expected.kind || copy.value !== expected.value) {
      return refuse(
        "P32",
        `${copy.name} ${copy.id} holds ${quoted(copy.column)}, a ${expected.kind} of ${expected.value}; its copy is a ${copy.kind} of ${copy.value}.`,
      );
    }
  }

  return undefined;
};

/**
 * `P32` of the arity: `Expression.min` and `bounded` and `ExpressionMax.max` agree with the seeds
 * of the expression's kind, and a bounded expression has its `ExpressionMax` row.
 */
const arityCopy = (rows: Rows): Finding => {
  const minimums = new Map(operatorArity.map((seed) => [seed.kind, seed.min]));
  const maximums = new Map(operatorArityMax.map((seed) => [seed.kind, seed.max]));
  const held = new Map(Rows.of(rows, processing.ExpressionMax).map((row) => [row.id, row]));
  for (const row of Rows.of(rows, processing.Expression)) {
    const max = maximums.get(row.kind);
    if (row.min !== minimums.get(row.kind)) {
      return refuse(
        "P32",
        `Expression ${row.id} holds min ${row.min}; the seed of ${row.kind} is ${minimums.get(row.kind) ?? "none"}.`,
      );
    }

    if (row.bounded !== (max === undefined ? "unbounded" : "bounded")) {
      return refuse(
        "P32",
        `Expression ${row.id} is ${row.bounded}; the seed of ${row.kind} is ${max === undefined ? "unbounded" : "bounded"}.`,
      );
    }

    const bound = held.get(row.id);
    if (bound?.max !== max) {
      return refuse(
        "P32",
        `ExpressionMax of ${row.id} holds ${bound?.max ?? "none"}; the seed of ${row.kind} is ${max ?? "none"}.`,
      );
    }
  }

  return undefined;
};

/**
 * Refuse processing rows that break one of the four cross-relation facts: a template processing
 * with no rule (P28), the order of a host's children (P30), an expression edge with no operand row
 * (P31) and a copy that disagrees with its source (P32).
 *
 * The first refusal found, in that order, is the failure. Reads rows only; writes nothing.
 *
 * @param rows - The rows the import built.
 * @returns Nothing when every guard passes; fails with the first {@link ProcessingGuardRefusal}
 *   otherwise.
 */
export const processingGuards = Effect.fn("processingGuards")(function* processingGuards(
  rows: Rows,
): Effect.fn.Return<void, ProcessingGuardRefusal> {
  const index = indexOf(rows);
  const found =
    templateProcessingHasRule(rows, index) ??
    ordering(rows, index) ??
    operandRows(rows) ??
    literalCopy(rows, index) ??
    integerCopy(rows) ??
    arityCopy(rows);
  if (found !== undefined) {
    yield* found;
  }
});
