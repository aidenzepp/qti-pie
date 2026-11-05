/**
 * The derived XSD inventory: for every ASI, HTML, processing and test kind handle, the element and
 * type the ASI 3.0.1 XSD declares, its content class, every attribute it declares and every element
 * it references.
 *
 * The inventory is data derived once from `imsqti_asiv3p0p1_v1p0.xsd` and read by the kinds files,
 * the attribute arms and the importer. Each vocabulary is a leaf file (`inventory/asi.ts`,
 * `inventory/html.ts`, `inventory/processing.ts`, `inventory/test.ts`) composed here, so a later
 * phase adds its own leaf and one spread line.
 *
 * An attribute's `family` is `base` for the ten names every element shares (`id`, `class`, `lang`,
 * `xml:lang`, `label`, `dir`, `xml:base`, `data-qti-suppress-tts`, `data-catalog-idref`,
 * `data-ssml`), `aria` for `role` and the `aria-*` names, and `own` otherwise. Its `whiteSpace` is
 * the class of the declared type: `collapse` for lists and every built-in but `xs:string` and
 * `xs:normalizedString`, `preserve` for `xs:string` and its enumerations, `replace` for
 * `xs:normalizedString`, `CoordsDType`, `MimeTypeDType` and `URLDType`, and `union` for a union of
 * classes. An attribute declared with an anonymous type keeps the type's definition (`inline`),
 * so an inline enumeration keeps its values. A child's `min` and `max` are its own bounds
 * multiplied by those of every enclosing group, `None` for unbounded; the choice groups are listed
 * in each leaf's module comment. The content class ({@link InventoryContent}) says what a kind
 * admits beside its children, and for a kind of simple content, the type of its text.
 *
 * The ASI, HTML and processing leaves are the output of the vocabulary deriver,
 * `src/vocab/derive/derive.ts`, whose module comment states the reading rules, and `derive.test.ts`
 * checks that a re-run reproduces each leaf byte for byte. A leaf is regenerated from
 * `packages/pantry`, `html` and `processing` likewise, with:
 *
 * ```sh
 * node src/vocab/derive/derive.ts asi > src/schema/content/inventory/asi.ts
 * pnpm exec vp fmt src/schema/content/inventory/asi.ts
 * ```
 *
 * The test leaf is the output of the Python script the deriver replaced, extended with the M4
 * element list and three `DOTTED` entries of its own, a `test` branch at the head of `entries` (the
 * 23 names are the spec's 3.3; each has one type):
 *
 * ```python
 * M4=["qti-adaptive-engine-ref","qti-adaptive-selection","qti-adaptive-settings-ref","qti-assessment-item-ref","qti-assessment-section","qti-assessment-section-ref","qti-assessment-stimulus","qti-assessment-stimulus-ref","qti-assessment-test","qti-branch-rule","qti-item-session-control","qti-metadata-ref","qti-ordering","qti-pre-condition","qti-selection","qti-stimulus-body","qti-template-default","qti-test-feedback","qti-test-part","qti-time-limits","qti-usagedata-ref","qti-variable-mapping","qti-weight"]
 * DOTTED_T={"qti-rubric-block.test":("qti-rubric-block","TestRubricBlockDType"),"qti-content-body.testRubric":("qti-content-body","TestRubricBlockContentBodyDType"),"qti-content-body.testFeedback":("qti-content-body","TestFeedbackFlowContentBodyDType")}
 * # in entries(which), first: if which=="test": entry(n,n,next(iter(DECL[n]))) for n in M4,
 * # entry(h,n,t) for h,(n,t) in DOTTED_T.items(); return them sorted by handle
 * # (VOCAB gains "test":"test")
 * ```
 *
 * Over the 145 entries of the ASI and HTML leaves the attribute declarations number 4217
 * `collapse`, 2053 `preserve`, 396 `replace` and 3 `union`. The phase-2 spec's counts (4254, 2071,
 * 399 and 4) add the 37, 18, 3 and 1 declarations of `TestRubricBlockDType`, the type of
 * `qti-rubric-block` that belongs to the test vocabulary and has no entry here. The processing
 * leaf's 89 entries add 52 `collapse`, 9 `preserve`, 1 `replace` and 10 `union`, which the spec's
 * totals do not describe.
 */
import { Option } from "effect";

import { asiInventory } from "#pantry/schema/content/inventory/asi.ts";
import { htmlInventory } from "#pantry/schema/content/inventory/html.ts";
import { processingInventory } from "#pantry/schema/content/inventory/processing.ts";
import { testInventory } from "#pantry/schema/content/inventory/test.ts";

/**
 * The facets an XSD restriction may state, by element name: the twelve of XML Schema 1.0 Part 2,
 * 4.3.
 */
export type InventoryFacetName =
  | "enumeration"
  | "fractionDigits"
  | "length"
  | "maxExclusive"
  | "maxInclusive"
  | "maxLength"
  | "minExclusive"
  | "minInclusive"
  | "minLength"
  | "pattern"
  | "totalDigits"
  | "whiteSpace";

/**
 * One facet an anonymous restriction states: its name and its `value` as written.
 */
export interface InventoryFacet {
  readonly facet: InventoryFacetName;
  readonly value: string;
}

/**
 * A simple type as a definition refers to it: a named type, by its QName with a built-in spelled
 * `xs:` whatever prefix its XSD binds, or an anonymous type's definition.
 */
export type InventoryType = { readonly _tag: "named"; readonly name: string } | InventoryInlineType;

/**
 * An anonymous simple type, as its XSD writes it in place of a type name: a restriction of a base
 * by its facets in document order, a list of an item type, or a union of member types, the named
 * members first as `memberTypes` lists them.
 *
 * It is the whole lexical definition, so with the named types' definitions it is a complete value
 * domain: an enumeration's values are its `enumeration` facets.
 */
export type InventoryInlineType =
  | { readonly _tag: "list"; readonly item: InventoryType }
  | {
      readonly _tag: "restriction";
      readonly base: InventoryType;
      readonly facets: readonly InventoryFacet[];
    }
  | { readonly _tag: "union"; readonly members: readonly InventoryType[] };

/**
 * The simple type a value is read under: an attribute's, or an element's text.
 *
 * `type` is the type's QName, a built-in spelled `xs:`, or for an anonymous type `list`, `union`
 * or the base of its restriction, read through nested anonymous restrictions. `inline` is the
 * anonymous type's definition, `None` for a named type. `whiteSpace` is the class of the type, as
 * the module comment states.
 */
export interface InventoryValueType {
  readonly inline: Option.Option<InventoryInlineType>;
  readonly type: string;
  readonly whiteSpace: "preserve" | "replace" | "collapse" | "union";
}

/**
 * One attribute an XSD type declares, through its attribute groups and its extension bases.
 *
 * `xml:lang` is `xs:language`, `xml:base` is `xs:anyURI` and `xml:id` is `xs:ID`. `default` is the
 * XSD default, absent when none is declared.
 */
export interface InventoryAttribute extends InventoryValueType {
  readonly name: string;
  readonly use: "required" | "optional";
  readonly default: Option.Option<string>;
  readonly family: "own" | "base" | "aria";
}

/**
 * One element a content model references, with the occurrence the model allows.
 *
 * `max` is `None` when the model leaves the count unbounded.
 */
export interface InventoryChild {
  readonly name: string;
  readonly min: number;
  readonly max: Option.Option<number>;
}

/**
 * What a kind's content admits beside the element children its entry lists: its content class.
 *
 * - `text`: character data of a simple type alone, for an element declared with a simple type or a
 *   complex type with `simpleContent`; the arm carries the type.
 * - `mixed`: character data between the element children (`mixed="true"`).
 * - `element`: element children only, at least one of them named.
 * - `wildcard`: element children only, all of them an element wildcard's (`xs:any`).
 * - `empty`: nothing.
 *
 * A content model that names an element and also holds a wildcard is `element`, or `mixed` when it
 * is mixed: the class says what character data the kind admits and whether its children are
 * modeled, not every particle it holds.
 */
export type InventoryContent =
  | { readonly _tag: "element" }
  | { readonly _tag: "empty" }
  | { readonly _tag: "mixed" }
  | ({ readonly _tag: "text" } & InventoryValueType)
  | { readonly _tag: "wildcard" };

/**
 * The content class of an {@link InventoryContent}.
 */
export type InventoryContentClass = InventoryContent["_tag"];

/**
 * The character kinds each content class admits beside its element children, as phase-1's 4.3
 * states them: whitespace, comments and processing instructions between element children, and
 * character data and entity references where text is admitted. A kind's admission rows are its
 * element children's handles, then these, in this order.
 */
export const characterKinds = {
  element: ["ws", "comment", "pi"],
  empty: ["comment", "pi"],
  mixed: ["text", "ws", "entityRef", "comment", "pi"],
  text: ["text", "ws", "entityRef", "comment", "pi"],
  wildcard: ["ws", "comment", "pi"],
} as const satisfies Readonly<Record<InventoryContentClass, readonly string[]>>;

/**
 * What the XSD declares for one kind handle: the element, its type, its content class, its
 * attributes and its children in XSD order.
 */
export interface InventoryEntry {
  readonly handle: string;
  readonly element: string;
  readonly type: string;
  readonly content: InventoryContent;
  readonly attributes: readonly InventoryAttribute[];
  readonly children: readonly InventoryChild[];
}

/**
 * A vocabulary's inventory leaf: its entries keyed by kind handle.
 */
export interface InventoryLeaf {
  readonly [handle: string]: InventoryEntry;
}

/**
 * The inventory of every ASI, HTML, processing and test kind, keyed by handle.
 */
export const inventory: InventoryLeaf = {
  ...asiInventory,
  ...htmlInventory,
  ...processingInventory,
  ...testInventory,
};

/**
 * Look up the inventory entry of a kind handle.
 *
 * @param handle - A kind handle such as `qti-simple-match-set` or `qti-content-body.modal`.
 * @returns The entry, or `None` when the handle is not an ASI, HTML or processing kind.
 */
export const entryOf = (handle: string): Option.Option<InventoryEntry> =>
  Option.fromNullishOr(Object.hasOwn(inventory, handle) ? inventory[handle] : undefined);
