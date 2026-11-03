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
import { spelledText } from "#qti/schema/attribute-homes.ts";
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
import * as expression from "#qti/schema/expression.ts";
import * as attributed from "#qti/schema/expression-attributes.ts";
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
  AttributeSpelling,
  Edge,
  EntityReference,
  Node,
  TextNode,
  vocabularies,
  Ws,
} from "#qti/schema/node.ts";
import {
  BuiltInRef,
  DeclaredRef,
  ResponseProcessingTemplate,
  ResponseProcessingTemplateLocation,
  StandardTemplateReference,
  TemplateParameterRef,
} from "#qti/schema/processing.ts";
import { XIncludeHref, XIncludeParse } from "#qti/schema/rule.ts";
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
 * A typed column read for the node a lexical row names: the value the importer wrote for it, none
 * when the node has no such row.
 */
type Column = (rows: Rows, node: string) => string | undefined;

/**
 * The `identifier` a referring node names, read from the arm of the way it names it: a declared
 * reference, a built-in or a template parameter.
 */
const referenceOf: Column = (rows, node) =>
  Rows.of(rows, DeclaredRef).find((row) => row.id === node)?.identifier ??
  Rows.of(rows, BuiltInRef).find((row) => row.id === node)?.name ??
  Rows.of(rows, TemplateParameterRef).find((row) => row.id === node)?.identifier;

/**
 * One `shadows` entry of a collapse-class attribute for each kind that carries it, all reading the
 * same column.
 */
const collapsedBy = (
  kinds: readonly string[],
  attribute: string,
  column: Column,
): readonly (readonly [string, Shadow])[] =>
  kinds.map((kind): [string, Shadow] => [
    `${kind}/${attribute}`,
    { column, whiteSpace: "collapse" },
  ]);

/**
 * The kinds that name a variable by their `identifier`: the referring expressions and the rules
 * that read or set one.
 */
const referringKinds: readonly string[] = [
  "qti-correct",
  "qti-default",
  "qti-lookup-outcome-value",
  "qti-map-response",
  "qti-map-response-point",
  "qti-set-correct-response",
  "qti-set-default-value",
  "qti-set-outcome-value",
  "qti-set-template-value",
  "qti-variable",
];

/**
 * The outcome-only expressions that take the section and category filters.
 */
const filteredKinds: readonly string[] = [
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-outcome-maximum",
  "qti-outcome-minimum",
  "qti-test-variables",
];

/**
 * The shadows of the collapse-class attributes of processing expressions and rules (spec 4.3
 * "Attribute storage"): the importer writes a lexical row for one whose value as read differs from
 * its collapse, and each entry names the typed column it shadows. For a mixed union (`figures`,
 * `min`, `max`, `step`) the importer writes a lexical row only for a collapsed literal. A
 * number-or-variable attribute that has a typed copy (`figures`, `n`, `number-repeats`) is read as
 * the copy's number for a literal and as the `*Ref` row's identifier for a reference.
 */
const processingShadows: readonly (readonly [string, Shadow])[] = [
  ...collapsedBy(referringKinds, "identifier", referenceOf),
  ...collapsedBy(
    filteredKinds,
    "section-identifier",
    (rows, node) =>
      Rows.of(rows, expression.ExpressionSectionIdentifier).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    filteredKinds,
    "include-category",
    (rows, node) =>
      Rows.of(rows, expression.ExpressionIncludeCategory).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    filteredKinds,
    "exclude-category",
    (rows, node) =>
      Rows.of(rows, expression.ExpressionExcludeCategory).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    ["qti-outcome-maximum", "qti-outcome-minimum", "qti-test-variables"],
    "weight-identifier",
    (rows, node) =>
      Rows.of(rows, attributed.ExpressionWeightIdentifier).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    ["qti-variable"],
    "weight-identifier",
    (rows, node) =>
      Rows.of(rows, attributed.VariableWeightIdentifier).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    ["qti-outcome-maximum", "qti-outcome-minimum"],
    "outcome-identifier",
    (rows, node) =>
      Rows.of(rows, attributed.OutcomeMinMax).find((row) => row.id === node)?.outcomeIdentifier,
  ),
  ...collapsedBy(
    ["qti-test-variables"],
    "variable-identifier",
    (rows, node) =>
      Rows.of(rows, attributed.TestVariables).find((row) => row.id === node)?.variableIdentifier,
  ),
  ...collapsedBy(
    ["qti-custom-operator"],
    "class",
    (rows, node) =>
      Rows.of(rows, attributed.CustomOperatorClass).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    ["qti-custom-operator"],
    "definition",
    (rows, node) =>
      Rows.of(rows, attributed.CustomOperatorDefinition).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    ["qti-equal"],
    "tolerance",
    (rows, node) =>
      Rows.of(rows, attributed.EqualTolerance).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    ["qti-equal"],
    "include-lower-bound",
    (rows, node) =>
      Rows.of(rows, attributed.Equal).find((row) => row.id === node)?.includeLowerBound,
  ),
  ...collapsedBy(
    ["qti-equal"],
    "include-upper-bound",
    (rows, node) =>
      Rows.of(rows, attributed.Equal).find((row) => row.id === node)?.includeUpperBound,
  ),
  ...collapsedBy(
    ["qti-string-match"],
    "case-sensitive",
    (rows, node) =>
      Rows.of(rows, attributed.StringMatch).find((row) => row.id === node)?.caseSensitive,
  ),
  ...collapsedBy(
    ["qti-string-match"],
    "substring",
    (rows, node) => Rows.of(rows, attributed.StringMatch).find((row) => row.id === node)?.substring,
  ),
  ...collapsedBy(
    ["qti-substring"],
    "case-sensitive",
    (rows, node) =>
      Rows.of(rows, attributed.Substring).find((row) => row.id === node)?.caseSensitive,
  ),
  ...collapsedBy(["qti-equal-rounded"], "figures", (rows, node) => {
    const held = Rows.of(rows, attributed.EqualRounded).find((row) => row.id === node);

    return held?.figuresKind === "ref"
      ? Rows.of(rows, attributed.EqualRoundedFiguresRef).find((row) => row.node === node)
          ?.identifier
      : held?.figuresValue.toString();
  }),
  ...collapsedBy(["qti-round-to"], "figures", (rows, node) => {
    const held = Rows.of(rows, attributed.RoundTo).find((row) => row.id === node);

    return held?.figuresKind === "ref"
      ? Rows.of(rows, attributed.RoundToFiguresRef).find((row) => row.node === node)?.identifier
      : held?.figuresValue.toString();
  }),
  ...collapsedBy(
    ["qti-field-value"],
    "field-identifier",
    (rows, node) =>
      Rows.of(rows, attributed.FieldValue).find((row) => row.id === node)?.fieldIdentifier,
  ),
  ...collapsedBy(["qti-index"], "n", (rows, node) => {
    const held = Rows.of(rows, attributed.Index).find((row) => row.id === node);

    return held?.nKind === "ref"
      ? Rows.of(rows, attributed.IndexNRef).find((row) => row.node === node)?.identifier
      : held?.nValue.toString();
  }),
  ...collapsedBy(["qti-repeat"], "number-repeats", (rows, node) => {
    const held = Rows.of(rows, attributed.Repeat).find((row) => row.id === node);

    return held?.numberRepeatsKind === "ref"
      ? Rows.of(rows, attributed.RepeatNumberRepeatsRef).find((row) => row.node === node)
          ?.identifier
      : held?.numberRepeatsValue.toString();
  }),
  ...collapsedBy(
    ["qti-any-n"],
    "min",
    (rows, node) => Rows.of(rows, attributed.AnyN).find((row) => row.id === node)?.min,
  ),
  ...collapsedBy(
    ["qti-any-n"],
    "max",
    (rows, node) => Rows.of(rows, attributed.AnyN).find((row) => row.id === node)?.max,
  ),
  ...collapsedBy(
    ["qti-random-integer"],
    "max",
    (rows, node) => Rows.of(rows, attributed.RandomInteger).find((row) => row.id === node)?.max,
  ),
  ...collapsedBy(
    ["qti-random-integer"],
    "min",
    (rows, node) =>
      Rows.of(rows, attributed.RandomIntegerMin).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    ["qti-random-integer"],
    "step",
    (rows, node) =>
      Rows.of(rows, attributed.RandomIntegerStep).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    ["qti-random-float"],
    "max",
    (rows, node) => Rows.of(rows, attributed.RandomFloat).find((row) => row.id === node)?.max,
  ),
  ...collapsedBy(
    ["qti-random-float"],
    "min",
    (rows, node) =>
      Rows.of(rows, attributed.RandomFloatMin).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    ["xi:include"],
    "href",
    (rows, node) => Rows.of(rows, XIncludeHref).find((row) => row.node === node)?.value,
  ),
  ...collapsedBy(
    ["xi:include"],
    "parse",
    (rows, node) => Rows.of(rows, XIncludeParse).find((row) => row.node === node)?.value,
  ),
];

/**
 * The item attributes with a typed column, by element kind and attribute: the phase-1 attributes
 * and the processing expressions' and rules' collapse-class attributes (`processingShadows`). A
 * lexical row of any other attribute is the content guards' (`lexicalCopy` in `guards/content.ts`).
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
    {
      column: (rows, node) => interaction(rows, node)?.maxChoicesN?.toString(),
      whiteSpace: "collapse",
    },
  ],
  [
    "qti-choice-interaction/min-choices",
    {
      column: (rows, node) => interaction(rows, node)?.minChoicesN?.toString(),
      whiteSpace: "collapse",
    },
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
  ...processingShadows,
]);

/**
 * The `kind/attribute` pairs an item tree's lexical row may name: the attributes that have a typed
 * column to shadow.
 */
export const shadowedAttributes: ReadonlySet<string> = new Set(shadows.keys());

/**
 * A column that holds no tab, line feed or carriage return, as the `replace` class guarantees.
 */
const hasReplaceable = (text: string): boolean => replace(text) !== text;

/**
 * `typed-copy` of the interaction: each choice binding's `maxCount` equals its choice
 * interaction's `maxChoicesN`. The other kinds' binding counts are the content guards'
 * (`bindingCopy`).
 */
const interactionCopy = (rows: Rows): Finding => {
  const interactions = Rows.of(rows, ChoiceInteraction);
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
 * `typed-copy` of the lexical and spelling rows: each row of an item node names an attribute its
 * kind's registry carries. Where `shadows` holds the attribute, a spelling row parses to the typed
 * value it sits beside, and a lexical row shadows that value, differs from it as read, and
 * processes to it. Where the node also has a spelling row, the lexical row's processed value is
 * the spelling and not the typed column's text (`" 05 "` processes to `"05"`, the column holds
 * `"5"`). Any other attribute's row is left to the content guards.
 */
const lexicalCopy = (rows: Rows, index: Index): Finding => {
  const spellings = new Map<string, string>();
  for (const row of Rows.of(rows, AttributeSpelling)) {
    const node = index.nodes.get(row.node);
    if (node === undefined || !index.itemTrees.has(node.tree)) {
      continue;
    }

    spellings.set(`${row.node}\n${row.attribute}`, row.value);

    const typed = shadows.get(`${row.kind}/${row.attribute}`)?.column(rows, row.node);
    if (typed !== undefined && spelledText(row.value) !== typed) {
      return refuse(
        "typed-copy",
        `The spelling ${quoted(row.value)} of ${row.attribute} of ${row.kind} ${row.node} does not parse to the typed value ${quoted(typed)} it sits beside.`,
      );
    }
  }

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
    if (shadow === undefined) {
      continue;
    }

    const typed = shadow.column(rows, row.node);
    if (typed === undefined) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} of ${row.kind} ${row.node} shadows no typed column.`,
      );
    }

    const held = spellings.get(`${row.node}\n${row.attribute}`) ?? typed;
    const expected = processed(row.value, shadow.whiteSpace);
    if (expected !== held) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} ${quoted(row.value)} of ${row.kind} ${row.node} processes to ${quoted(expected)}, and its column holds ${quoted(held)}.`,
      );
    }

    if (row.value === held) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} of ${row.kind} ${row.node} equals its column ${quoted(held)}; a lexical row exists only where processing changed the value.`,
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
