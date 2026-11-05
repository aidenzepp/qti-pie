/**
 * The derived XSD inventory: for every ASI, HTML, processing and test kind handle, the element and
 * type the ASI 3.0.1 XSD declares, whether the type is mixed, every attribute it declares and every
 * element it references.
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
 * classes. A child's `min` and `max` are its own bounds multiplied by those of every enclosing
 * group, `None` for unbounded; the choice groups are listed in each leaf's module comment.
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
 * One attribute an XSD type declares, through its attribute groups and its extension bases.
 *
 * `type` is the declared type name (`xml:lang` is `xs:language`, `xml:base` is `xs:anyURI`) or, for
 * an inline type, the name of its base. `default` is the XSD default, absent when none is
 * declared.
 */
export interface InventoryAttribute {
  readonly name: string;
  readonly type: string;
  readonly use: "required" | "optional";
  readonly default: Option.Option<string>;
  readonly family: "own" | "base" | "aria";
  readonly whiteSpace: "preserve" | "replace" | "collapse" | "union";
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
 * What the XSD declares for one kind handle: the element, its type, whether the type is mixed, its
 * attributes and its children in XSD order.
 */
export interface InventoryEntry {
  readonly handle: string;
  readonly element: string;
  readonly type: string;
  readonly mixed: boolean;
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
