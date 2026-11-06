/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The test's structure guards: the facts about a test's or a section document's structure rows
 * that no statement can state over stored rows, judged over the rows an import built before any of
 * them is written (spec 4.4, 4.8 and 4.9, rows 18, 45 and 47).
 *
 * The importer writes each of these from one source, so a breach reaches these guards only through
 * rows built by hand, except `branch-forward`, which judges the document the author wrote.
 */
import { Effect, Schema } from "effect";
import { Rows } from "#pantry/import/tree.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#pantry/schema/document.ts";
import { Edge, Node, TreeRoot } from "#pantry/schema/node.ts";
import { ItemInstanceSpelling, ItemInstanceVariableRef } from "#pantry/schema/processing.ts";
import { Selection } from "#pantry/schema/test/control.ts";
import { BranchRule, BranchRuleTarget } from "#pantry/schema/test/rules.ts";
import { AssessmentSection, TestIdentifier } from "#pantry/schema/test/structure.ts";

/**
 * A test structure guard refused the rows.
 *
 * `rule` names the guard and `detail` the first row that broke it.
 */
export class TestGuardRefusal extends Schema.TaggedError<TestGuardRefusal>()("TestGuardRefusal", {
  detail: Schema.String,
  rule: Schema.Literals(["branch-forward", "section-root-copy", "typed-copy"]),
}) {
  /**
   * What was refused, in one sentence.
   */
  override get message(): string {
    return `The test rows break ${this.rule}: ${this.detail}`;
  }
}

/**
 * The first refusal a check finds, or nothing when its rows are sound.
 */
type Finding = TestGuardRefusal | undefined;

const refuse = (rule: TestGuardRefusal["rule"], detail: string): TestGuardRefusal =>
  new TestGuardRefusal({ detail, rule });

const quoted = (text: string): string => JSON.stringify(text);

/**
 * The plain text of a branded column.
 */
const text = (value: string): string => value;

/**
 * Where each node stands in stored document order, and each node's parent.
 */
interface Structure {
  readonly order: ReadonlyMap<string, number>;
  readonly parents: ReadonlyMap<string, string>;
  readonly trees: ReadonlyMap<string, string>;
  readonly kinds: ReadonlyMap<string, string>;
}

/**
 * Number every node in document order: a node before its children, children by their edge's
 * position, each tree from its root.
 */
const structureOf = (rows: Rows): Structure => {
  const edges = Rows.of(rows, Edge).toSorted((a, b) => Number(a.position - b.position));
  const parents = new Map<string, string>(edges.map((edge) => [edge.child, edge.parent]));
  const children = new Map<string, string[]>();
  for (const edge of edges) {
    children.set(edge.parent, [...(children.get(edge.parent) ?? []), edge.child]);
  }

  const nodes = Rows.of(rows, Node);
  const known = new Set<string>([
    ...nodes.map((row) => row.id),
    ...parents.keys(),
    ...parents.values(),
  ]);
  const order = new Map<string, number>();
  const stack = [...known].filter((node) => !parents.has(node)).toReversed();
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    if (!order.has(next)) {
      order.set(next, order.size);
      stack.push(...(children.get(next) ?? []).toReversed());
    }
  }

  return {
    kinds: new Map(nodes.map((row) => [row.id, row.kind])),
    order,
    parents,
    trees: new Map(nodes.map((row) => [row.id, row.tree])),
  };
};

/**
 * The ancestors of `node`, nearest first.
 */
const ancestors = (structure: Structure, node: string): readonly string[] => {
  const found: string[] = [];
  for (
    let at = structure.parents.get(node);
    at !== undefined && !found.includes(at);
    at = structure.parents.get(at)
  ) {
    found.push(at);
  }

  return found;
};

/**
 * The test part `node` is, or sits in, none when no part encloses it (a section document holds
 * no part: it sits wholly under the part that references it).
 */
const partOf = (structure: Structure, node: string): string | undefined =>
  [node, ...ancestors(structure, node)].find((at) => structure.kinds.get(at) === "qti-test-part");

/**
 * `branch-forward` (spec 4.8; row 18): a branch rule's target is after the rule's owner in stored
 * document order; for a rule of a section or an item reference it is also in the owner's part (a
 * test part rule targets a later part); and it is not an item reference under a selection with
 * replacement.
 */
const branchForward = (rows: Rows): Finding => {
  const structure = structureOf(rows);
  const holders = new Map(
    Rows.of(rows, TestIdentifier).map((row) => [`${row.scope}\n${text(row.identifier)}`, row]),
  );
  const targets = new Map(Rows.of(rows, BranchRuleTarget).map((row) => [row.rule, row]));
  const replaced = new Set<string>(
    Rows.of(rows, Selection)
      .filter((row) => row.withReplacement === "true" || row.withReplacement === "1")
      .map((row) => row.section),
  );
  for (const rule of Rows.of(rows, BranchRule)) {
    const target = targets.get(rule.id);
    const held =
      target === undefined ? undefined : holders.get(`${target.scope}\n${text(target.identifier)}`);
    const ownerAt = structure.order.get(rule.owner);
    const targetAt = held === undefined ? undefined : structure.order.get(held.holder);
    if (
      target === undefined ||
      held === undefined ||
      ownerAt === undefined ||
      targetAt === undefined
    ) {
      continue;
    }

    const name = `BranchRule ${rule.id} targeting ${quoted(text(target.identifier))}`;
    if (targetAt <= ownerAt) {
      return refuse(
        "branch-forward",
        `${name} targets a node that is not after its owner in document order; a branch rule only jumps forward.`,
      );
    }

    if (
      rule.ownerKind !== "part" &&
      (structure.trees.get(rule.owner) !== structure.trees.get(held.holder) ||
        partOf(structure, rule.owner) !== partOf(structure, held.holder))
    ) {
      return refuse(
        "branch-forward",
        `${name} targets a node outside its owner's test part; a branch rule only jumps within its part.`,
      );
    }

    if (
      held.holderKind === "itemRef" &&
      ancestors(structure, held.holder).some((section) => replaced.has(section))
    ) {
      return refuse(
        "branch-forward",
        `${name} targets an item reference under a selection with replacement; such a reference may be presented again, so it cannot be jumped to.`,
      );
    }
  }

  return undefined;
};

/**
 * `section-root-copy` (spec 4.4; row 45): a section document's root section holds the document's
 * identifier and title.
 */
const sectionRootCopy = (rows: Rows): Finding => {
  const roots = new Map(Rows.of(rows, TreeRoot).map((row) => [row.tree, row.node]));
  const arms = new Map(Rows.of(rows, AssessmentSection).map((row) => [row.id, row]));
  const identifiers = new Map(Rows.of(rows, DocumentIdentifier).map((row) => [row.document, row]));
  const titles = new Map(Rows.of(rows, DocumentTitle).map((row) => [row.document, row]));
  for (const document of Rows.of(rows, Document).filter((row) => row.root === "section")) {
    const root = roots.get(document.id);
    const arm = root === undefined ? undefined : arms.get(root);
    const identifier = identifiers.get(document.id);
    const title = titles.get(document.id);
    if (arm === undefined) {
      return refuse(
        "section-root-copy",
        `Section document ${document.id} has no root section; its root node needs an AssessmentSection row.`,
      );
    }

    if (identifier === undefined || text(identifier.value) !== text(arm.identifier)) {
      return refuse(
        "section-root-copy",
        `Section document ${document.id} holds the identifier ${quoted(identifier === undefined ? "(none)" : text(identifier.value))}, but its root section holds ${quoted(text(arm.identifier))}; copy the root section's identifier.`,
      );
    }

    if (title === undefined || text(title.value) !== text(arm.title)) {
      return refuse(
        "section-root-copy",
        `Section document ${document.id} holds the title ${quoted(title === undefined ? "(none)" : text(title.value))}, but its root section holds ${quoted(text(arm.title))}; copy the root section's title.`,
      );
    }
  }

  return undefined;
};

/**
 * `typed-copy` of `ItemInstanceSpelling` (spec 4.9; row 47): a stored spelling parses to the
 * `instance` of the reference it belongs to.
 */
const instanceSpelling = (rows: Rows): Finding => {
  const instances = new Map(Rows.of(rows, ItemInstanceVariableRef).map((row) => [row.id, row]));
  for (const spelling of Rows.of(rows, ItemInstanceSpelling)) {
    const instance = instances.get(spelling.ref);
    const value = text(spelling.value);
    if (instance === undefined) {
      return refuse(
        "typed-copy",
        `ItemInstanceSpelling ${spelling.ref} belongs to no ItemInstanceVariableRef; a spelling copies the instance of its reference.`,
      );
    }

    if (!/^[+-]?[0-9]+$/u.test(value) || BigInt(value) !== instance.instance) {
      return refuse(
        "typed-copy",
        `ItemInstanceSpelling ${spelling.ref} is ${quoted(value)}, which is not a spelling of the instance ${instance.instance} of its reference; copy the instance as written.`,
      );
    }
  }

  return undefined;
};

/**
 * Refuse test rows that break one of the three facts no statement can state: that a branch rule
 * only jumps forward within its part and never to a reference that selection with replacement may
 * repeat, that a section document's root section holds the document's identifier and title, and
 * that a stored instance spelling parses to its instance.
 *
 * The first refusal found, in that order, is the failure. Reads rows only; writes nothing.
 *
 * @param rows - The rows the import built.
 * @returns Nothing when every guard passes; fails with the first {@link TestGuardRefusal}
 *   otherwise.
 */
export const testGuards = Effect.fn("testGuards")(function* testGuards(
  rows: Rows,
): Effect.fn.Return<void, TestGuardRefusal> {
  const found = branchForward(rows) ?? sectionRootCopy(rows) ?? instanceSpelling(rows);
  if (found !== undefined) {
    yield* found;
  }
});
