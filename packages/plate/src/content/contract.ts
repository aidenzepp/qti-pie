/**
 * The content-module contract: what one QTI content element gives the walks that read it, so an
 * element's facts live in its own module and each walk delegates to it, as an interaction's do
 * through `InteractionModule` in `#plate/interactions/contract.ts`.
 *
 * A content element is one plate reads beside the interactions: a rubric block, inline and block
 * feedback, modal feedback, companion materials, a stylesheet, a catalog, a stimulus reference, or
 * MathML. Each sits in the item body or directly under the item root ({@link Placement}).
 *
 * Each module beside this file is a stub: `implemented` is false and its `parse` gives the notice
 * the body walk gives any element it does not read, so the verdicts and the HTML stay what they
 * were. Its other members throw {@link ContentNotImplemented}, and no walk reaches them: the model
 * holds no node of a stub's element, since its `parse` gives the notice. The body walk dispatches
 * each body-placed element to its module's `parse` (`contentNode` in `#plate/model/item.ts`); the
 * item root's walk does not call an item-placed module yet, and records its element as a mark, as
 * it does every `qti-*` element it does not read.
 *
 * @module
 */
import { Data } from "effect";
import type { Result } from "effect";
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
 * One content element's module.
 *
 * @template E The element's local name.
 * @template N The element's model node, `never` for a stub, which has none yet.
 * @template P The element's payload node, `never` for a stub, which has none yet.
 */
export interface ContentModule<E extends string, N, P = never> {
  /**
   * The element's local name, which the walk dispatches on with {@link ContentModule.namespace}.
   */
  readonly element: E;
  /**
   * The element's Appendix A identifiers; none for an element no row names, such as inline and
   * block feedback, which the reading "A feedback element names an outcome variable" governs.
   */
  readonly feature: readonly ContentFeatureId[];
  /**
   * Whether the module renders the element: false for a stub, whose `parse` gives the notice.
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
   * Read the element into its model node, or its notice.
   */
  readonly parse: (
    element: SourceElement,
    context: ParseContext,
  ) => Result.Result<N | Unsupported, Refusal>;
  readonly placement: Placement;
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
 * A step of a stub content module ran: a defect of plate, which no item or host can cause.
 *
 * A stub's `parse` gives the notice, so the model never holds a node of its element, and no walk
 * reaches the stub's other steps. It is thrown, never returned, and only from a stub's body.
 */
export class ContentNotImplemented extends Data.TaggedError("ContentNotImplemented")<{
  readonly element: string;
}> {
  /**
   * Which content module's step ran, and what a stub supports.
   */
  override get message(): string {
    return `The content module for ${this.element} is a stub: only its parse runs, and it gives the notice. Another of its steps ran, which no item can cause; land the module before its element reaches the model.`;
  }
}
