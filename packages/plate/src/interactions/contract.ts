/**
 * The interaction-module contract: what one interaction kind gives every hub that dispatches on
 * `Interaction["kind"]`, so a kind's facts live in its own module and each hub delegates to it.
 *
 * The four shipped kinds, Choice, Extended Text, Inline Choice and Text Entry, keep their steps
 * inline in the hubs, and every signature here is the one those hubs already call: `parse` is what
 * the body walk does for one QTI interaction element, `redact` what the payload's copy does for one
 * model node, `connect` and `render` what `renderInlineChoice`'s connect and render functions do,
 * `validate` what `validateInlineChoice` does, `bindings` what `postings` reads of an interaction,
 * and the other members the per-kind facts the hubs inline today, each named where it is read.
 *
 * Each of the other kinds is a stub module beside this file: `implemented` is false, its `parts`
 * holds no row, and its `parse` gives the notice an unknown QTI interaction element gives, so the
 * verdicts and the HTML stay what they were. A stub's other members throw {@link NotImplemented}.
 * No hub reaches them: the model holds no node of a stub's kind, since its `parse` gives the
 * notice, and the redacted codec refuses one, so no step past `parse` ever runs for it. The
 * modules form no registry a host can reach: the body walk names each element in one switch, and
 * every hub delegates a stubbed kind through `stubSteps` in `#plate/model/interactions.ts`, one
 * exhaustive switch over the stub modules.
 *
 * @module
 */
import { Data } from "effect";
import type { Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Attributes, Element } from "#plate/emit/node.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { Malformed } from "#plate/form/encoding.ts";
import type { Locale } from "#plate/messages.ts";
import type { Interaction, Unsupported } from "#plate/model/item.ts";
import type { ResponseValue, Value } from "#plate/model/values.ts";
import type { EmitState, Payload, ValidationMessage } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * An interaction kind, as the item model names it.
 */
export type InteractionKind = Interaction["kind"];

/**
 * A feature of the QTI 3.0 conformance list, Appendix A, by its identifier: `Q-1` to `Q-21` are
 * the interactions, Associate to Upload in alphabetical order.
 */
export type FeatureId = `Q-${number}`;

/**
 * The row a module gives one of its parts, before the part table adds the owner, the part key,
 * the derived `data-slot` marker and the placement's `legendOwner`.
 */
export type PartSpec = Omit<PartRow, "interaction" | "legendOwner" | "part" | "slot">;

/**
 * What the body walk hands a module's `parse`: the element's path, and the one way to replace the
 * element by its notice, which also records the feature on the verdict.
 */
export interface ParseContext {
  /**
   * Replace the element by its notice, and record the feature as shown by one.
   *
   * @param feature The feature's key, as the verdict and the notice name it.
   * @returns The unsupported node.
   */
  readonly notice: (feature: string) => Result.Result<Unsupported>;
  /**
   * The element path of the element being parsed.
   */
  readonly path: string;
}

/**
 * One element a connect function computes the attributes of, with the one text it holds, such as
 * an Inline Choice's option.
 */
export interface TextProps {
  readonly props: Attributes;
  readonly text: string;
}

/**
 * What a connect function computes for each part, by part key: the part's attributes, or those of
 * each element of a part that repeats, each with its text when it holds one.
 */
export type Connected = Readonly<
  Record<string, Attributes | TextProps | readonly Attributes[] | readonly TextProps[]>
>;

/**
 * One response an interaction binds, and the number base its posted text is read in: none for an
 * interaction that posts identifiers.
 */
export interface BoundResponse {
  readonly base: Option.Option<number>;
  readonly response: string;
}

/**
 * One interaction kind's module.
 *
 * @template K The kind, as the item model names it.
 * @template I The kind's model node.
 * @template P The kind's payload node, `never` for a stub, which has none yet.
 * @template Part The kind's part keys, `never` for a stub, which has no row.
 */
export interface InteractionModule<K extends InteractionKind, I, P, Part extends string = never> {
  /**
   * The responses the interaction binds, each with its number base, as `postings` reads them.
   */
  readonly bindings: (interaction: I) => readonly BoundResponse[];
  /**
   * Compute every attribute of every part once, as `renderInlineChoice`'s connect function does.
   */
  readonly connect: (interaction: P, payload: Payload, locale: Locale) => Connected;
  /**
   * How many Controls the interaction renders, which numbers the Controls the renderer names.
   */
  readonly controls: (interaction: I) => number;
  /**
   * The interaction's QTI element name, which the body walk dispatches on.
   */
  readonly element: `qti-${string}-interaction`;
  /**
   * The kind's Appendix A identifier.
   */
  readonly feature: FeatureId;
  /**
   * Whether the module renders the kind: false for a stub, whose `parse` gives the notice.
   */
  readonly implemented: boolean;
  readonly kind: K;
  /**
   * The NULL of the interaction's own binding, which a response with no declaration is checked as.
   */
  readonly nullValue: (interaction: I) => Value;
  /**
   * The owner of the kind's parts in the part table, the first key of a part override.
   */
  readonly owner: `${K}-interaction`;
  /**
   * Read one QTI interaction element of the kind into its model node, or its notice.
   */
  readonly parse: (
    element: SourceElement,
    context: ParseContext,
  ) => Result.Result<I | Unsupported, Refusal>;
  /**
   * The rows of the kind's parts, by part key; none for a stub.
   */
  readonly parts: { readonly [Q in Part]: PartSpec };
  /**
   * Copy the model node into the payload node the page may know.
   */
  readonly redact: (interaction: I) => P;
  /**
   * Render the payload node: its Root, every part placed through the embedder's replacement.
   */
  readonly render: (
    interaction: P,
    payload: Payload,
    state: EmitState,
  ) => Result.Result<Element, PartSwapRefused>;
  /**
   * The value the interaction shows for a stored response.
   */
  readonly restore: (interaction: I, stored: ResponseValue) => ResponseValue;
  /**
   * The order a shuffled interaction presented its choices in, space-separated, none for one with
   * no shuffle.
   */
  readonly sequence: (
    interaction: I,
    seed: Option.Option<string>,
    instance: string,
  ) => Option.Option<string>;
  /**
   * The value the interaction shows for its response's correct value.
   */
  readonly solution: (interaction: I, correct: ResponseValue) => ResponseValue;
  /**
   * Whether the renderer names the interaction's Controls (Q10), given whether the author named it.
   */
  readonly unnamed: (interaction: I, unauthored: boolean) => boolean;
  /**
   * Check a response the caller decoded, as `validateInlineChoice` does.
   */
  readonly validate: (
    interaction: I,
    input: Value | Malformed,
    configuration: Configuration,
  ) => readonly ValidationMessage[];
}

/**
 * A step of a stub interaction module ran: a defect of plate, which no item or host can cause.
 *
 * A stub's `parse` gives the notice, so the model never holds a node of its kind, the redacted
 * codec refuses one, and no hub reaches the stub's other steps. It is thrown, never returned, and
 * only from a stub's body.
 */
export class NotImplemented extends Data.TaggedError("NotImplemented")<{
  readonly feature: FeatureId;
}> {
  /**
   * Which interaction's step ran, and what a stub supports.
   */
  override get message(): string {
    return `The interaction module for ${this.feature} is a stub: only its parse runs, and it gives the notice. Another of its steps ran, which no item can cause; land the module before its kind reaches the model.`;
  }
}
