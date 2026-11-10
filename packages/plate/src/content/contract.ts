/**
 * The content-module contract: what one QTI content element gives the walks that read it, so an
 * element's facts live in its own module and each walk delegates to it, as an interaction's do
 * through `InteractionModule` in `#plate/interactions/contract.ts`.
 *
 * A content element is one plate reads beside the interactions: a rubric block, inline and block
 * feedback, modal feedback, companion materials, a stylesheet, a catalog, a stimulus reference, or
 * MathML. Each sits in the item body or directly under the item root ({@link Placement}).
 *
 * Each module beside this file is a stub: `implemented` is false and its `parse` gives what the
 * walk that reads it gives any element it does not read, so the verdicts and the HTML stay what
 * they were: a body-placed stub gives the notice, an item-placed one records the mark. Its other
 * members throw {@link ContentNotImplemented}, and no walk reaches them: the model holds no node of
 * a stub's element. Each walk dispatches its elements to their module's `parse`: the body walk
 * each body-placed element (`contentNode` in `#plate/model/item.ts`), the item root's walk each
 * item-placed one (`itemContent` there), and the item holds each node an item-placed module reads
 * by its element ({@link ItemContent}), so landing an element changes only its module.
 *
 * @module
 */
import { Data } from "effect";
import type { Option, Result } from "effect";
import type { SourceElement } from "#plate/document/source.ts";
import type { Element } from "#plate/emit/node.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { ParseContext } from "#plate/interactions/contract.ts";
import type { Unsupported } from "#plate/model/item.ts";
import type { EmitState } from "#plate/payload.ts";
import type { Supports } from "#plate/supports.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

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
 * What the item root's walk hands an item-placed module's `parse`: the way to record its element as
 * a mark on the verdict only, as that walk records every `qti-*` element it does not read, since an
 * element outside the body has no place a notice could take.
 */
export interface ItemParseContext {
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
}

/**
 * The members every content module has, whatever its {@link Placement}.
 *
 * @template E The element's local name.
 * @template N The element's model node, `never` for a stub, which has none yet.
 * @template P The element's payload node, `never` for a stub, which has none yet.
 */
interface ContentModuleBase<E extends string, N, P> {
  /**
   * The element's local name, which the walk dispatches on with the module's `namespace`.
   */
  readonly element: E;
  /**
   * The element's Appendix A identifiers; none for an element no row names, such as inline and
   * block feedback, which the reading "A feedback element names an outcome variable" governs.
   */
  readonly feature: readonly ContentFeatureId[];
  /**
   * Whether the module renders the element: false for a stub, whose `parse` gives the notice or
   * the mark.
   */
  readonly implemented: boolean;
  /**
   * The element's namespace: QTI's, or MathML's for `math`.
   */
  readonly namespace: string;
  /**
   * Rewrite the element into the form `parse` reads, before it is read, such as MathML's
   * deprecated `mfenced` into the elements it stands for; absent for an element read as written.
   */
  readonly normalise?: (element: SourceElement) => SourceElement;
  /**
   * Copy the model node into the payload node the page may know.
   */
  readonly redact: (node: N) => P;
  /**
   * Render the payload node, given the supports the host enabled, which decide what catalog
   * content and which preferences it shows.
   */
  readonly render: (
    node: P,
    state: EmitState,
    supports: Supports,
  ) => Result.Result<Element, PartSwapRefused>;
}

/**
 * The module of an element in the item body, which the body walk reads.
 *
 * @template E The element's local name.
 * @template N The element's model node, `never` for a stub, which has none yet.
 * @template P The element's payload node, `never` for a stub, which has none yet.
 */
export interface BodyContentModule<E extends string, N, P = never> extends ContentModuleBase<
  E,
  N,
  P
> {
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
 */
export interface ItemContentModule<E extends string, N, P = never> extends ContentModuleBase<
  E,
  N,
  P
> {
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
 * The model node an item-placed module's `parse` reads its element into: `never` for a stub, which
 * has none yet.
 *
 * @template M The module.
 */
export type ItemNodeOf<M> = M extends {
  readonly parse: (...args: never[]) => Result.Result<Option.Option<infer N>, Refusal>;
}
  ? N
  : never;

/**
 * Each item-placed module's model node, keyed by the module's element.
 *
 * @template M The item-placed modules.
 */
export type ItemNodes<M extends { readonly element: string }> = {
  readonly [Module in M as Module["element"]]: ItemNodeOf<Module>;
};

/**
 * The nodes the item model holds of the elements item-placed modules read: each element a module
 * read a node of keys those nodes, in document order; an element it read none of is absent. A
 * stub's element is always absent, as its `parse` reads no node. Derived from the modules, so a
 * module that lands a model node lands it here with no change to the item model.
 *
 * @template M The item-placed modules.
 */
export type ItemContent<M extends { readonly element: string }> = {
  readonly [Name in keyof ItemNodes<M>]?: readonly ItemNodes<M>[Name][];
};

/**
 * One content element's module, by where the element sits ({@link Placement}).
 *
 * @template E The element's local name.
 * @template N The element's model node, `never` for a stub, which has none yet.
 * @template P The element's payload node, `never` for a stub, which has none yet.
 */
export type ContentModule<E extends string, N, P = never> =
  | BodyContentModule<E, N, P>
  | ItemContentModule<E, N, P>;

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
