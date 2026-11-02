/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The item guards: the facts about an item's rows that no single relation can state, judged over
 * the rows an import built before any of them is written.
 */
import type { AnyRelation } from "@bjornpagen/grizzle";
import { Effect, Option, Predicate, Schema } from "effect";
import { standardTemplate } from "#qti/import/item.ts";
import { collapse, replace, Rows } from "#qti/import/tree.ts";
import type { WhiteSpace } from "#qti/import/tree.ts";
import {
  Declaration,
  DeclarationLongInterpretation,
  DeclarationMasteryValue,
  DeclarationNormalMaximum,
  DeclarationNormalMinimum,
  DeclarationVariableIdentifierRef,
  DeclarationView,
} from "#qti/schema/declaration.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import { Img, ImgLongdesc } from "#qti/schema/html.ts";
import {
  ChoiceInteraction,
  ChoiceInteractionMaxSelectionsMessage,
  ChoiceInteractionMinSelectionsMessage,
  SimpleChoice,
  SimpleChoiceTemplateIdentifier,
  TypedBinding,
} from "#qti/schema/interaction.ts";
import { AssessmentItem } from "#qti/schema/item.ts";
import {
  AttributeLexical,
  Edge,
  EntityReference,
  Node,
  TextNode,
  vocabularies,
  Ws,
} from "#qti/schema/node.ts";
import {
  ResponseProcessingTemplate,
  ResponseProcessingTemplateLocation,
  StandardTemplateReference,
} from "#qti/schema/processing.ts";
import * as values from "#qti/schema/value.ts";

/**
 * An item guard refused the rows.
 *
 * `rule` names the guard and `detail` the first row that broke it.
 */
export class ItemGuardRefusal extends Schema.TaggedError<ItemGuardRefusal>()("ItemGuardRefusal", {
  detail: Schema.String,
  rule: Schema.Literals([
    "text-copy",
    "typed-copy",
    "template-derivation",
    "ordering",
    "body-empty",
  ]),
}) {
  /**
   * What was refused, in one sentence.
   */
  override get message(): string {
    return `The item rows break the ${this.rule} guard: ${this.detail}`;
  }
}

/**
 * The first refusal a check finds, or nothing when its rows are sound.
 */
type Finding = ItemGuardRefusal | undefined;

const refuse = (rule: ItemGuardRefusal["rule"], detail: string): ItemGuardRefusal =>
  new ItemGuardRefusal({ detail, rule });

const byPosition = (a: { readonly position: bigint }, b: { readonly position: bigint }): number =>
  Number(a.position - b.position);

const quoted = (text: string): string => JSON.stringify(text);

/**
 * The `qti-value` arms: each holds the id of its node and the text it copies.
 */
const valueArms: readonly AnyRelation[] = Object.values<unknown>(values.relations).filter(
  (member): member is AnyRelation =>
    Predicate.hasProperty(member, "fields") &&
    Predicate.hasProperty(member, "name") &&
    typeof member.name === "string" &&
    member.name.startsWith("DeclaredValue") &&
    member.name !== "DeclaredValue",
);

/**
 * What an arm row holds: the node's id and the value copied from its text.
 */
const ArmRow = Schema.Struct({ id: Schema.String, value: Schema.String });

const isArmRow = Schema.is(ArmRow);

/**
 * The attribute names each element kind's registry carries.
 */
const registryAttributes: ReadonlyMap<string, readonly string[]> = new Map(
  vocabularies.flatMap((vocabulary) =>
    Object.entries<{ readonly attributes: readonly string[] }>(vocabulary.registry).map(
      ([kind, row]): [string, readonly string[]] => [kind, row.attributes],
    ),
  ),
);

/**
 * The kinds that are elements: the registries' generic kinds (text, comments and the like) have no
 * local name.
 */
const elementKinds: ReadonlySet<string> = new Set(
  vocabularies.flatMap((vocabulary) =>
    Object.entries<{ readonly local: string }>(vocabulary.registry)
      .filter(([, row]) => row.local !== "")
      .map(([kind]) => kind),
  ),
);

/**
 * The lookups the checks share: each parent's edges in position order, the node of each id and the
 * character content of the character children.
 */
interface Index {
  readonly children: ReadonlyMap<
    string,
    readonly { readonly child: string; readonly childKind: string }[]
  >;
  readonly itemTrees: ReadonlySet<string>;
  readonly nodes: ReadonlyMap<string, { readonly kind: string; readonly tree: string }>;
  readonly pieces: ReadonlyMap<string, string>;
}

const indexOf = (rows: Rows): Index => ({
  children: Map.groupBy(Rows.of(rows, Edge).toSorted(byPosition), (edge) => edge.parent),
  itemTrees: new Set(
    Rows.of(rows, Document)
      .filter((document) => document.root === "item")
      .map((document) => document.id),
  ),
  nodes: new Map(Rows.of(rows, Node).map((node) => [node.id, node])),
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
 * `text-copy`: every `qti-value` arm row holds the `replace`d text of its node, which is the class
 * of `qti-value` for every base type (spec 3.11).
 */
const textCopy = (rows: Rows, index: Index): Finding => {
  for (const relation of valueArms) {
    for (const row of rows.get(relation) ?? []) {
      if (!isArmRow(row)) {
        continue;
      }

      if (!index.nodes.has(row.id)) {
        return refuse("text-copy", `${relation.name} row ${row.id} names no node.`);
      }

      const expected = replace(contentOf(index, row.id));
      if (row.value !== expected) {
        return refuse(
          "text-copy",
          `${relation.name} row ${row.id} holds ${quoted(row.value)}; its qti-value children give ${quoted(expected)}.`,
        );
      }
    }
  }

  return undefined;
};

/**
 * An item attribute that may carry an `AttributeLexical` row: its whitespace class (spec 3.10) and
 * the typed column its processed value is copied to.
 */
interface Shadow {
  readonly column: (rows: Rows, node: string) => string | undefined;
  readonly whiteSpace: WhiteSpace;
}

const processed = (value: string, whiteSpace: WhiteSpace): string => {
  if (whiteSpace === "collapse") {
    return collapse(value);
  }

  return whiteSpace === "replace" ? replace(value) : value;
};

/**
 * The tree id of the document a node belongs to.
 */
const treeOf = (rows: Rows, node: string): string | undefined =>
  Rows.of(rows, Node).find((row) => row.id === node)?.tree;

const interaction = (rows: Rows, node: string) =>
  Rows.of(rows, ChoiceInteraction).find((row) => row.id === node);

const choice = (rows: Rows, node: string) =>
  Rows.of(rows, SimpleChoice).find((row) => row.id === node);

const item = (rows: Rows, node: string) =>
  Rows.of(rows, AssessmentItem).find((row) => row.id === node);

const interpretation = (rows: Rows, node: string): string | undefined =>
  Rows.of(rows, values.ValueSetInterpretation).find((row) => row.valueSet === node)?.value;

/**
 * Every item attribute with a typed column, by element kind and attribute. An attribute the table
 * lacks has no typed column to shadow.
 */
const shadows: ReadonlyMap<string, Shadow> = new Map<string, Shadow>([
  [
    "qti-assessment-item/identifier",
    {
      column: (rows, node) =>
        Rows.of(rows, DocumentIdentifier).find((row) => row.document === treeOf(rows, node))?.value,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-assessment-item/title",
    {
      column: (rows, node) =>
        Rows.of(rows, DocumentTitle).find((row) => row.document === treeOf(rows, node))?.value,
      whiteSpace: "replace",
    },
  ],
  [
    "qti-assessment-item/adaptive",
    { column: (rows, node) => item(rows, node)?.adaptive, whiteSpace: "collapse" },
  ],
  [
    "qti-assessment-item/time-dependent",
    { column: (rows, node) => item(rows, node)?.timeDependent, whiteSpace: "collapse" },
  ],
  [
    "img/src",
    {
      column: (rows, node) => Rows.of(rows, Img).find((row) => row.id === node)?.src,
      whiteSpace: "collapse",
    },
  ],
  [
    "img/longdesc",
    {
      column: (rows, node) => Rows.of(rows, ImgLongdesc).find((row) => row.node === node)?.value,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-response-declaration/identifier",
    {
      column: (rows, node) => Rows.of(rows, Declaration).find((row) => row.id === node)?.identifier,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-outcome-declaration/identifier",
    {
      column: (rows, node) => Rows.of(rows, Declaration).find((row) => row.id === node)?.identifier,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-outcome-declaration/view",
    {
      column: (rows, node) =>
        Rows.of(rows, DeclarationView).find((row) => row.declaration === node)?.value,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-outcome-declaration/long-interpretation",
    {
      column: (rows, node) =>
        Rows.of(rows, DeclarationLongInterpretation).find((row) => row.declaration === node)?.value,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-outcome-declaration/normal-maximum",
    {
      column: (rows, node) =>
        Rows.of(rows, DeclarationNormalMaximum).find((row) => row.declaration === node)?.value,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-outcome-declaration/normal-minimum",
    {
      column: (rows, node) =>
        Rows.of(rows, DeclarationNormalMinimum).find((row) => row.declaration === node)?.value,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-outcome-declaration/mastery-value",
    {
      column: (rows, node) =>
        Rows.of(rows, DeclarationMasteryValue).find((row) => row.declaration === node)?.value,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-outcome-declaration/variable-identifier-ref",
    {
      column: (rows, node) =>
        Rows.of(rows, DeclarationVariableIdentifierRef).find((row) => row.declaration === node)
          ?.value,
      whiteSpace: "collapse",
    },
  ],
  ["qti-correct-response/interpretation", { column: interpretation, whiteSpace: "preserve" }],
  ["qti-default-value/interpretation", { column: interpretation, whiteSpace: "replace" }],
  [
    "qti-value/field-identifier",
    {
      column: (rows, node) =>
        Rows.of(rows, values.RecordField).find((row) => row.id === node)?.fieldIdentifier,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-choice-interaction/response-identifier",
    { column: (rows, node) => interaction(rows, node)?.responseIdentifier, whiteSpace: "collapse" },
  ],
  [
    "qti-choice-interaction/shuffle",
    { column: (rows, node) => interaction(rows, node)?.shuffle, whiteSpace: "collapse" },
  ],
  [
    "qti-choice-interaction/max-choices",
    { column: (rows, node) => interaction(rows, node)?.maxChoices, whiteSpace: "collapse" },
  ],
  [
    "qti-choice-interaction/min-choices",
    { column: (rows, node) => interaction(rows, node)?.minChoices, whiteSpace: "collapse" },
  ],
  [
    "qti-choice-interaction/orientation",
    { column: (rows, node) => interaction(rows, node)?.orientation, whiteSpace: "preserve" },
  ],
  [
    "qti-choice-interaction/data-min-selections-message",
    {
      column: (rows, node) =>
        Rows.of(rows, ChoiceInteractionMinSelectionsMessage).find((row) => row.node === node)
          ?.value,
      whiteSpace: "replace",
    },
  ],
  [
    "qti-choice-interaction/data-max-selections-message",
    {
      column: (rows, node) =>
        Rows.of(rows, ChoiceInteractionMaxSelectionsMessage).find((row) => row.node === node)
          ?.value,
      whiteSpace: "replace",
    },
  ],
  [
    "qti-simple-choice/identifier",
    { column: (rows, node) => choice(rows, node)?.identifier, whiteSpace: "collapse" },
  ],
  [
    "qti-simple-choice/fixed",
    { column: (rows, node) => choice(rows, node)?.fixed, whiteSpace: "collapse" },
  ],
  [
    "qti-simple-choice/show-hide",
    { column: (rows, node) => choice(rows, node)?.showHide, whiteSpace: "preserve" },
  ],
  [
    "qti-simple-choice/template-identifier",
    {
      column: (rows, node) =>
        Rows.of(rows, SimpleChoiceTemplateIdentifier).find((row) => row.node === node)?.value,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-response-processing/template",
    {
      column: (rows, node) =>
        Rows.of(rows, ResponseProcessingTemplate).find((row) => row.node === node)?.uri,
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-response-processing/template-location",
    {
      column: (rows, node) =>
        Rows.of(rows, ResponseProcessingTemplateLocation).find((row) => row.node === node)?.uri,
      whiteSpace: "collapse",
    },
  ],
]);

/**
 * The lexical form of a non-negative integer as the importer reads it: an unparseable form reads
 * 0, and the lexical column beside it refuses the form at commit.
 */
const naturalOf = (lexical: string): bigint =>
  /^\+?[0-9]+$/u.test(lexical) ? BigInt(lexical) : 0n;

/**
 * A column that holds no tab, line feed or carriage return, as the `replace` class guarantees.
 */
const hasReplaceable = (text: string): boolean => replace(text) !== text;

/**
 * `typed-copy` of the interaction: each count equals the parse of its lexical column, and each
 * choice binding's `maxCount` equals its choice interaction's `maxChoicesN`. The other kinds'
 * binding counts are the content guards' (`bindingCopy`).
 */
const interactionCopy = (rows: Rows): Finding => {
  const interactions = Rows.of(rows, ChoiceInteraction);
  for (const row of interactions) {
    if (row.maxChoicesN !== naturalOf(row.maxChoices)) {
      return refuse(
        "typed-copy",
        `ChoiceInteraction ${row.id} holds maxChoicesN ${row.maxChoicesN} beside maxChoices ${quoted(row.maxChoices)}.`,
      );
    }

    if (row.minChoicesN !== naturalOf(row.minChoices)) {
      return refuse(
        "typed-copy",
        `ChoiceInteraction ${row.id} holds minChoicesN ${row.minChoicesN} beside minChoices ${quoted(row.minChoices)}.`,
      );
    }
  }

  for (const binding of Rows.of(rows, TypedBinding)) {
    if (binding.interactionKind !== "qti-choice-interaction") {
      continue;
    }

    const owner = interactions.find((row) => row.id === binding.node);
    if (owner?.maxChoicesN !== binding.maxCount) {
      return refuse(
        "typed-copy",
        `TypedBinding ${binding.node} holds maxCount ${binding.maxCount}; its interaction holds maxChoicesN ${owner?.maxChoicesN ?? "none"}.`,
      );
    }
  }

  return undefined;
};

/**
 * `typed-copy` of the lexical rows: each row of an item node names an attribute its kind's
 * registry carries, shadows a typed column, differs from it as read, and processes to it.
 */
const lexicalCopy = (rows: Rows, index: Index): Finding => {
  for (const row of Rows.of(rows, AttributeLexical)) {
    const node = index.nodes.get(row.node);
    if (node === undefined || !index.itemTrees.has(node.tree)) {
      continue;
    }

    if (registryAttributes.get(row.kind)?.includes(row.attribute) !== true) {
      return refuse(
        "typed-copy",
        `The ${row.kind} registry carries no attribute ${row.attribute}.`,
      );
    }

    const shadow = shadows.get(`${row.kind}/${row.attribute}`);
    const typed = shadow?.column(rows, row.node);
    if (shadow === undefined || typed === undefined) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} of ${row.kind} ${row.node} shadows no typed column.`,
      );
    }

    const expected = processed(row.value, shadow.whiteSpace);
    if (expected !== typed) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} ${quoted(row.value)} of ${row.kind} ${row.node} processes to ${quoted(expected)}, and its column holds ${quoted(typed)}.`,
      );
    }

    if (row.value === typed) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} of ${row.kind} ${row.node} equals its column ${quoted(typed)}; a lexical row exists only where processing changed the value.`,
      );
    }
  }

  return undefined;
};

/**
 * `typed-copy` of the replace-class columns (spec 4.5 and 4.10): the document title, a default
 * value set's interpretation and the two selection messages hold no tab, line feed or carriage
 * return, whether or not a lexical row shadows them. A correct response's interpretation is
 * `preserve` and may hold a tab.
 */
const replaceClass = (rows: Rows): Finding => {
  const defaults = new Set(
    Rows.of(rows, values.ValueSet)
      .filter((set) => set.role === "default")
      .map((set) => set.id),
  );
  const columns: readonly {
    readonly name: string;
    readonly owner: string;
    readonly value: string;
  }[] = [
    ...Rows.of(rows, DocumentTitle).map((row) => ({
      name: "DocumentTitle",
      owner: row.document,
      value: row.value,
    })),
    ...Rows.of(rows, values.ValueSetInterpretation)
      .filter((row) => defaults.has(row.valueSet))
      .map((row) => ({ name: "ValueSetInterpretation", owner: row.valueSet, value: row.value })),
    ...Rows.of(rows, ChoiceInteractionMinSelectionsMessage).map((row) => ({
      name: "ChoiceInteractionMinSelectionsMessage",
      owner: row.node,
      value: row.value,
    })),
    ...Rows.of(rows, ChoiceInteractionMaxSelectionsMessage).map((row) => ({
      name: "ChoiceInteractionMaxSelectionsMessage",
      owner: row.node,
      value: row.value,
    })),
  ];
  const found = columns.find((column) => hasReplaceable(column.value));

  return found === undefined
    ? undefined
    : refuse(
        "typed-copy",
        `${found.name} ${found.owner} holds ${quoted(found.value)}; a replace-class value holds no tab, line feed or carriage return.`,
      );
};

/**
 * `typed-copy` of the required attributes: an item document has an identifier and a title, and the
 * importer writes neither row for an attribute the root omits, so an absent row is an absent
 * attribute and never a default.
 */
const required = (rows: Rows, index: Index): Finding => {
  const identified = new Set(Rows.of(rows, DocumentIdentifier).map((row) => row.document));
  const titled = new Set(Rows.of(rows, DocumentTitle).map((row) => row.document));
  for (const id of index.itemTrees) {
    if (!identified.has(id)) {
      return refuse("typed-copy", `The item document ${id} has no identifier, which is required.`);
    }

    if (!titled.has(id)) {
      return refuse("typed-copy", `The item document ${id} has no title, which is required.`);
    }
  }

  return undefined;
};

/**
 * `template-derivation`: a reference names the template its processing's stored `template` URI
 * stands for, and exists only where the URI stands for one.
 */
const templateDerivation = (rows: Rows): Finding => {
  const stored = new Map(
    Rows.of(rows, ResponseProcessingTemplate).map((row) => [row.node, row.uri]),
  );
  const references = new Map(
    Rows.of(rows, StandardTemplateReference).map((row) => [row.node, row.template]),
  );
  for (const [node, template] of references) {
    const uri = stored.get(node);
    const derived = uri === undefined ? Option.none() : standardTemplate(uri);
    if (!Option.contains(derived, template)) {
      return refuse(
        "template-derivation",
        `The processing ${node} references the template ${template}; its template URI ${quoted(uri ?? "")} stands for ${Option.getOrElse(derived, () => "none")}.`,
      );
    }
  }

  for (const [node, uri] of stored) {
    if (Option.isSome(standardTemplate(uri)) && !references.has(node)) {
      return refuse(
        "template-derivation",
        `The processing ${node} has the published template URI ${quoted(uri)} and no StandardTemplateReference.`,
      );
    }
  }

  return undefined;
};

/**
 * The kinds under a `qti-assessment-item`, in the order its XSD sequence lists them (the kinds
 * between them are not judged).
 */
const itemOrder: readonly string[] = [
  "qti-response-declaration",
  "qti-outcome-declaration",
  "qti-item-body",
  "qti-response-processing",
];

/**
 * `ordering`: under each item root the response declarations precede the outcome declarations,
 * which precede the body, which precedes the response processing; other kinds are skipped.
 */
const ordering = (index: Index): Finding => {
  for (const [parent, edges] of index.children) {
    const node = index.nodes.get(parent);
    if (node?.kind !== "qti-assessment-item" || !index.itemTrees.has(node.tree)) {
      continue;
    }

    let last = -1;
    for (const edge of edges) {
      const rank = itemOrder.indexOf(edge.childKind);
      if (rank === -1) {
        continue;
      }

      if (rank < last) {
        return refuse(
          "ordering",
          `Under qti-assessment-item ${parent}, a ${edge.childKind} follows a ${itemOrder[last]}; the sequence is ${itemOrder.join(", ")}.`,
        );
      }

      last = rank;
    }
  }

  return undefined;
};

/**
 * `body-empty`: every `qti-item-body` has at least one element child (spec 3.6).
 */
const bodyEmpty = (index: Index): Finding => {
  for (const [id, node] of index.nodes) {
    if (
      node.kind === "qti-item-body" &&
      !(index.children.get(id) ?? []).some((edge) => elementKinds.has(edge.childKind))
    ) {
      return refuse("body-empty", `The qti-item-body ${id} has no element child.`);
    }
  }

  return undefined;
};

/**
 * Refuse item rows that break one of the five cross-relation facts: the text copies, the typed
 * copies, the template derivation, the order of the item's children and the body's content.
 *
 * The first refusal found, in that order, is the failure. Reads rows only; writes nothing.
 *
 * @param rows - The rows the import built.
 * @returns Nothing when every guard passes; fails with the first {@link ItemGuardRefusal}
 *   otherwise.
 */
export const itemGuards = Effect.fn("itemGuards")(function* itemGuards(
  rows: Rows,
): Effect.fn.Return<void, ItemGuardRefusal> {
  const index = indexOf(rows);
  const found =
    textCopy(rows, index) ??
    interactionCopy(rows) ??
    lexicalCopy(rows, index) ??
    replaceClass(rows) ??
    required(rows, index) ??
    templateDerivation(rows) ??
    ordering(index) ??
    bodyEmpty(index);
  if (found !== undefined) {
    yield* found;
  }
});
