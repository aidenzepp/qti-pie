/**
 * The content-module contract: what one QTI content element gives the walks that read it, so an
 * element's facts live in its own module and each walk delegates to it, as an interaction's do
 * through `InteractionModule` in `#plate/interactions/contract.ts`.
 *
 * A content element is one plate reads beside the interactions: a rubric block, inline and block
 * feedback, modal feedback, companion materials, a stylesheet, a catalog, a stimulus reference,
 * MathML, or SSML. Each sits in the item body or directly under the item root ({@link Placement}).
 *
 * Each module beside this file is a stub: `implemented` is false and its `parse` gives what the
 * walk that reads it gives any element it does not read, so the verdicts and the HTML stay what
 * they were: a body-placed stub gives the notice, an item-placed one records the mark. Its other
 * steps throw {@link ContentNotImplemented}, and no walk reaches them: the model holds no node of a
 * stub's element. Each walk dispatches its elements to their module's `parse`: the body walk each
 * body-placed element (`contentNode` in `#plate/model/item.ts`), the item root's walk each
 * item-placed one (`itemPart` there), and the item holds each node an item-placed module reads by
 * its element ({@link ItemContent}), so landing an element changes only its module.
 *
 * A module that lands owns its element from the source to the HTML, and the hubs carry its nodes
 * through `#plate/content/modules.ts` without naming its fields. Its `parse` reads the element into
 * its model node `N`; a body-placed one's sits in the body as a {@link ContentNodeOf}, an
 * item-placed one's in the item's `content` by its element. `redact` decides what the redacted item
 * keeps of the node under the supports the host enabled, the view the item is shown to and the
 * attempt's record ({@link ContentRedactKit}); `payloadSchema` gives the node's codec, so a host
 * sends it to a page; `copy` makes the payload node `P` the page sees ({@link ContentCopyKit});
 * and `render` writes `P` as HTML ({@link ContentRenderKit}). A module whose namespace the verdict
 * cannot judge, MathML's and SSML's, judges each island of it through `check`.
 *
 * @module
 */
import { Data } from "effect";
import type { Option, Result, Schema } from "effect";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { ParseContext, ReaderKit } from "#plate/interactions/contract.ts";
import type { BodyNode, Unsupported } from "#plate/model/item.ts";
import type { RedactRecord } from "#plate/model/record.ts";
import type { EmitState, PayloadNode } from "#plate/payload.ts";
import type { CatalogSupport, Supports } from "#plate/supports.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import type { UncheckedReason } from "#plate/validate/verdict.ts";
import type { OutcomeView } from "#plate/vocabulary.ts";

/**
 * A feature of the QTI 3.0 conformance list, Appendix A, by its identifier: `I-0` to `I-20` are the
 * item's features.
 */
export type ContentFeatureId = `I-${number}`;

/**
 * Where a content element sits: in the item body, which the body walk reads, or directly under the
 * item root.
 */
export type Placement = "body" | "item";

/**
 * The element name of a module that reads every element of its namespace, SSML's: the walks
 * dispatch any element of the namespace to it, and its nodes carry this as their element.
 */
export const anyElement = "*";

/**
 * The view an item is shown to when the host names none: the candidate's, which sees no rubric
 * another view alone names.
 */
export const defaultView: OutcomeView = "candidate";

/**
 * One reference an element of the item body makes to a catalog: its `data-catalog-idref` as
 * written, and the element's path. The catalog module reads them ({@link ItemParseContext}), so
 * the item model gains no field for them.
 */
export interface CatalogReference {
  readonly idref: string;
  readonly path: string;
}

/**
 * What the item root's walk hands an item-placed module's `parse`: the way to record its element as
 * a mark on the verdict only, as that walk records every `qti-*` element it does not read, since an
 * element outside the body has no place a notice could take, the kit it reads the element with,
 * and the catalog references the body made.
 */
export interface ItemParseContext {
  /**
   * Every `data-catalog-idref` an element of the item body carries, in document order. The XSD
   * places `qti-catalog-info` after `qti-item-body`, so the root's walk has read the body by the
   * time it reaches the catalog, and the catalog module resolves each reference against its
   * catalogs here.
   */
  readonly catalogReferences: readonly CatalogReference[];
  /**
   * Record the feature as a mark at the element's path.
   *
   * @param feature The feature's key, as the verdict names it.
   * @returns None, as the model then holds no node of the element.
   */
  readonly mark: (feature: string) => Result.Result<Option.Option<never>>;
  /**
   * The element path of the element being parsed.
   */
  readonly path: string;
  /**
   * The kit the element and its content are read with: the attribute readers, and the body walk
   * for the element's content, as a body-placed module's `parse` reads them through
   * `ParseContext.read`.
   */
  readonly read: ReaderKit;
}

/**
 * What the redaction hands a module's `redact`: the walk over body nodes the redaction makes of
 * every content it keeps, which prints the printed variables, settles the template content and
 * reaches the notices of the nodes it is handed, and the facts of this render the module decides
 * by: the supports the host enabled, the view the item is shown to and the attempt's record. A
 * module keeps, prunes or drops its node by them, so a scorer's rubric, a dormant catalog card or
 * a feedback whose outcome does not show never reaches the page.
 */
export interface ContentRedactKit {
  /**
   * Walk body nodes the page sees, as the redaction walks the body: their printed variables
   * printed, their template content settled, their notices reached as shown.
   *
   * @param nodes The body nodes the node holds.
   * @returns The nodes the page is given in their place.
   */
  readonly nodes: (nodes: readonly BodyNode[]) => readonly BodyNode[];
  /**
   * The attempt's template values and outcome values, as the redaction prints by them; none when
   * the item is shown with no record, or its template processing does not run.
   */
  readonly record: Option.Option<RedactRecord>;
  /**
   * The supports the host enabled, `noSupports` when it named none.
   */
  readonly supports: Supports;
  /**
   * The view the item is shown to, {@link defaultView} when the host named none.
   */
  readonly view: OutcomeView;
  /**
   * Walk body nodes the page does not see, so the redaction still reaches their notices and binds
   * their responses as content the page is not given, and gives nothing. A module that drops or
   * prunes its node hands the content it withholds here.
   *
   * @param nodes The body nodes withheld.
   */
  readonly withhold: (nodes: readonly BodyNode[]) => void;
}

/**
 * What the payload hands a module's `copy`: the copy of body nodes into payload nodes the payload
 * makes of every content it copies, so a module's content reaches the page as a Choice's Prompt
 * does.
 */
export interface ContentCopyKit {
  /**
   * Copy body nodes into payload nodes, in order.
   *
   * @param nodes The body nodes.
   * @returns The payload nodes.
   */
  readonly nodes: (nodes: readonly BodyNode[]) => readonly PayloadNode[];
}

/**
 * What the emitter hands a module's `render`, beside the emit state: the emission of payload nodes
 * with the body's id scoping, heading shift, URLs and Notice part, and the supports and the view
 * the redaction decided by, which decide what the render shows of what the redaction kept.
 */
export interface ContentRenderKit {
  /**
   * Emit payload nodes as the body is emitted, at a phrasing position, each interaction among
   * them through the render's render function.
   *
   * @param nodes The payload nodes.
   * @returns The emitted nodes, or the first refusal of a part swap.
   */
  readonly nodes: (
    nodes: readonly PayloadNode[],
  ) => Result.Result<readonly Node[], PartSwapRefused>;
  /**
   * The supports the host enabled, `noSupports` when it named none.
   */
  readonly supports: Supports;
  /**
   * The view the item is shown to, {@link defaultView} when the host named none.
   */
  readonly view: OutcomeView;
}

/**
 * The members every content module has, whatever its {@link Placement}.
 *
 * @template E The element's local name, or {@link anyElement} for every element of the namespace.
 * @template N The element's model node, `never` for a stub, which has none yet.
 * @template P The element's payload node, `never` for a stub, which has none yet.
 * @template J The JSON form of the model node in a redacted item, `never` for a stub, whose
 *   `payloadSchema` refuses every value.
 */
interface ContentModuleBase<E extends string, N, P, J> {
  /**
   * Judge one island of the module's namespace, the outermost element of a run of it, for the
   * verdict: the reasons plate cannot judge the document for it, none when the module judges the
   * island itself. Only a module whose namespace the verdict otherwise leaves unchecked has it,
   * MathML's and SSML's.
   *
   * @param island The island's outermost element.
   * @param path The element's path.
   * @returns The reasons the document stays unchecked, each at the island's path.
   */
  readonly check?: (island: SourceElement, path: string) => readonly UncheckedReason[];
  /**
   * The payload nodes the render writes as content through the kit's `nodes`, in document order,
   * which the heading shift reads as it reads a Prompt's. None for a stub, which has no payload
   * node.
   */
  readonly content: (node: P) => readonly PayloadNode[];
  /**
   * Copy the model node the redaction kept into the payload node the page may know, its content
   * through the kit.
   */
  readonly copy: (node: N, kit: ContentCopyKit) => P;
  /**
   * The element's local name, which the walk dispatches on with the module's `namespace`;
   * {@link anyElement} for every element of the namespace.
   */
  readonly element: E;
  /**
   * The element's Appendix A identifiers; none for an element no row names, such as inline and
   * block feedback, which the reading "A feedback element names an outcome variable" governs, and
   * SSML, whose rows are the accessibility list's.
   */
  readonly feature: readonly ContentFeatureId[];
  /**
   * Whether the module renders the element: false for a stub, whose `parse` gives the notice or
   * the mark.
   */
  readonly implemented: boolean;
  /**
   * The element's namespace: QTI's, MathML's for `math`, or SSML's.
   */
  readonly namespace: string;
  /**
   * Rewrite the element into the form `parse` reads, before it is read, such as MathML's
   * deprecated `mfenced` into the elements it stands for; absent for an element read as written.
   * The walks call it on each element they dispatch to the module, and hand `parse` what it gives.
   */
  readonly normalise?: (element: SourceElement) => SourceElement;
  /**
   * The Schema the redacted codec checks the model node's JSON form with, built from what the codec
   * hands it, so that no browser module value-imports Schema; for a stub, the kit's
   * `unimplementedContent` schema, which refuses the element.
   *
   * @param kit The codec's Schema and its shared field schemas, the body's recursive one among
   *   them.
   * @returns The model node's codec: its type `N`, its encoded side `J`.
   */
  readonly payloadSchema: (kit: SchemaKit) => Schema.Codec<N, J>;
  /**
   * Decide what the redacted item keeps of the model node, by the kit's supports, view and record:
   * the node, pruned of what the page may not see, its content walked through the kit; or none to
   * drop it, the content it held withheld through the kit.
   */
  readonly redact: (node: N, kit: ContentRedactKit) => Option.Option<N>;
  /**
   * Render the payload node, given the emit state and the kit, whose supports and view decide what
   * it shows.
   */
  readonly render: (
    node: P,
    state: EmitState,
    kit: ContentRenderKit,
  ) => Result.Result<Element, PartSwapRefused>;
}

/**
 * The module of an element in the item body, which the body walk reads.
 *
 * @template E The element's local name.
 * @template N The element's model node, `never` for a stub, which has none yet.
 * @template P The element's payload node, `never` for a stub, which has none yet.
 * @template J The JSON form of the model node, `never` for a stub.
 */
export interface BodyContentModule<
  E extends string,
  N,
  P = never,
  J = never,
> extends ContentModuleBase<E, N, P, J> {
  /**
   * Read the element into its model node, or its notice.
   */
  readonly parse: (
    element: SourceElement,
    context: ParseContext,
  ) => Result.Result<N | Unsupported, Refusal>;
  readonly placement: "body";
}

/**
 * The module of an element directly under the item root, which the item root's walk reads.
 *
 * @template E The element's local name.
 * @template N The element's model node, `never` for a stub, which has none yet.
 * @template P The element's payload node, `never` for a stub, which has none yet.
 * @template J The JSON form of the model node, `never` for a stub.
 */
export interface ItemContentModule<
  E extends string,
  N,
  P = never,
  J = never,
> extends ContentModuleBase<E, N, P, J> {
  /**
   * Read the element into its model node, or none once it has recorded the element's mark.
   */
  readonly parse: (
    element: SourceElement,
    context: ItemParseContext,
  ) => Result.Result<Option.Option<N>, Refusal>;
  readonly placement: "item";
}

/**
 * One content element's module, by where the element sits ({@link Placement}).
 *
 * @template E The element's local name.
 * @template N The element's model node, `never` for a stub, which has none yet.
 * @template P The element's payload node, `never` for a stub, which has none yet.
 * @template J The JSON form of the model node, `never` for a stub.
 */
export type ContentModule<E extends string, N, P = never, J = never> =
  | BodyContentModule<E, N, P, J>
  | ItemContentModule<E, N, P, J>;

/**
 * The model node a module's `redact` reads: `never` for a stub, which has none yet.
 *
 * @template M The module.
 */
export type NodeOf<M> = M extends {
  readonly redact: (node: infer N, kit: ContentRedactKit) => Option.Option<unknown>;
}
  ? N
  : never;

/**
 * The payload node a module's `copy` gives: `never` for a stub, which has none yet.
 *
 * @template M The module.
 */
export type PayloadOf<M> = M extends {
  readonly copy: (node: never, kit: ContentCopyKit) => infer P;
}
  ? P
  : never;

/**
 * The node of a body-placed content element in the item body: the module's element, which the
 * hubs dispatch on, the node its `parse` read, and the element's path.
 *
 * @template E The module's element.
 * @template N The module's model node.
 */
export interface ContentNodeOf<E extends string, N> {
  readonly element: E;
  readonly kind: "content";
  readonly node: N;
  readonly path: string;
}

/**
 * The payload node of a body-placed content element: the module's element and the node its `copy`
 * gave, which only its `render` reads.
 *
 * @template E The module's element.
 * @template P The module's payload node.
 */
export interface ContentPayloadOf<E extends string, P> {
  readonly element: E;
  readonly kind: "content";
  readonly payload: P;
}

/**
 * The node of each body-placed module's element in the item body, one member per module, each as
 * its module declares its node: the item model's `BodyNode` union holds this, so a module that
 * lands changes the model through its own file.
 *
 * @template M The body-placed modules.
 */
export type BodyContentNode<M extends { readonly element: string }> = M extends unknown
  ? ContentNodeOf<M["element"], NodeOf<M>>
  : never;

/**
 * The payload node of each body-placed module's element, one member per module, each as its
 * module's `copy` gives it: the payload's `PayloadNode` union holds this.
 *
 * @template M The body-placed modules.
 */
export type BodyContentPayload<M extends { readonly element: string }> = M extends unknown
  ? ContentPayloadOf<M["element"], PayloadOf<M>>
  : never;

/**
 * Each item-placed module's model node, keyed by the module's element.
 *
 * @template M The item-placed modules.
 */
export type ItemNodes<M extends { readonly element: string }> = {
  readonly [Module in M as Module["element"]]: NodeOf<Module>;
};

/**
 * Each item-placed module's payload node, keyed by the module's element.
 *
 * @template M The item-placed modules.
 */
export type ItemPayloads<M extends { readonly element: string }> = {
  readonly [Module in M as Module["element"]]: PayloadOf<Module>;
};

/**
 * The nodes the item model, and the redacted item, hold of the elements item-placed modules read:
 * each element a module read a node of keys those nodes, in document order; an element it read
 * none of is absent. A stub's element is always absent, as its `parse` reads no node. Derived from
 * the modules, so a module that lands a model node lands it here with no change to the item model.
 *
 * @template M The item-placed modules.
 */
export type ItemContent<M extends { readonly element: string }> = {
  readonly [Name in keyof ItemNodes<M>]?: readonly ItemNodes<M>[Name][];
};

/**
 * The payload nodes the payload holds of the elements item-placed modules read, by element, in
 * the order of {@link ItemContent}: each the module's `copy` of a node the redaction kept.
 *
 * @template M The item-placed modules.
 */
export type ItemContentPayload<M extends { readonly element: string }> = {
  readonly [Name in keyof ItemPayloads<M>]?: readonly ItemPayloads<M>[Name][];
};

/**
 * The presenter of one catalog support: how a catalog card for the support attaches to the element
 * that references the catalog, when the host enabled the support. The catalog module resolves each
 * reference to its card and hands the card here; each support's presentation is its own module in
 * `#plate/content/presenters/`, so a support that lands changes only its file.
 *
 * @template S The support.
 * @template C The card as the catalog module gives it, `never` for a stub, which presents none
 *   yet.
 */
export interface CatalogPresenter<S extends CatalogSupport, C = never> {
  /**
   * Whether the presenter renders the support: false for a stub.
   */
  readonly implemented: boolean;
  /**
   * Render the card's content for the referencing element, given the emit state and the kit.
   *
   * @param card The card the catalog module resolved for the support.
   * @param state The emit state.
   * @param kit The render kit, whose `nodes` emits the card's content.
   * @returns The nodes to attach beside the referencing element, or the refusal of a part swap.
   */
  readonly present: (
    card: C,
    state: EmitState,
    kit: ContentRenderKit,
  ) => Result.Result<readonly Node[], PartSwapRefused>;
  readonly support: S;
}

/**
 * The hook on the item Root's attributes: what the supports and the view add to the Root, such as
 * a magnification factor and the text colours as CSS custom properties, beside the attributes the
 * item chrome writes, which it never replaces. One module fills it, `#plate/content/root.ts`.
 */
export interface RootHook {
  /**
   * Give the attributes the Root carries for this render, none while the hook is a stub.
   *
   * @param state The emit state, whose supports and view the attributes follow.
   * @returns The attributes, which the chrome's own override.
   */
  readonly attributes: (state: EmitState) => Attributes;
  /**
   * Whether the hook sets any attribute: false for a stub.
   */
  readonly implemented: boolean;
}

/**
 * A step of a stub content module ran: a defect of plate, which no item or host can cause.
 *
 * A stub's `parse` gives the notice or the mark, so the model never holds a node of its element,
 * and no walk reaches the stub's other steps. It is thrown, never returned, and only from a stub's
 * body.
 */
export class ContentNotImplemented extends Data.TaggedError("ContentNotImplemented")<{
  readonly element: string;
}> {
  /**
   * Which content module's step ran, and what a stub supports.
   */
  override get message(): string {
    return `The content module for ${this.element} is a stub: only its parse runs, and it gives the notice or the mark. Another of its steps ran, which no item can cause; land the module before its element reaches the model.`;
  }
}
