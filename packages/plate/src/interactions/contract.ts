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
 * holds no row, its `parse` gives the notice an unknown QTI interaction element gives, so the
 * verdicts and the HTML stay what they were, and its `payloadSchema` refuses its kind, as the
 * redacted codec refused it before. A stub's `regions`, `replaceRegions` and `content` give the
 * trivial value (no region, the node itself, no content), and its other members throw
 * {@link NotImplemented}. No hub reaches them: the model holds no node of a stub's kind, since its
 * `parse` gives the notice, and the redacted codec refuses one, so no step past `parse` ever runs
 * for it. The modules form no registry a host can reach: the body walk names each element in one
 * switch, and every hub delegates a module's kind through `#plate/model/interactions.ts`, its
 * `stubSteps` for a model node, its `regionsOf` and `mapRegions` for the content a node holds, and
 * its `renderModule` and `moduleContent` for a payload node. A module that lands fills only its own
 * file: its payload node reaches the payload as a `ModulePayload` (`#plate/payload.ts`), its JSON
 * form through its `payloadSchema`, each of its parts through {@link partRow}, and its parts reach
 * a host's overrides and the `data-slot` lookup through the names `#plate/model/interactions.ts`
 * hands the part table as it loads.
 *
 * @module
 */
import { Data } from "effect";
import type { Option, Result, Schema } from "effect";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Attributes, Element } from "#plate/emit/node.ts";
import { slotFor } from "#plate/emit/parts.ts";
import type { InteractionKey, PartKey, PartRow } from "#plate/emit/parts.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { Malformed } from "#plate/form/encoding.ts";
import type { Locale } from "#plate/messages.ts";
import type { Region } from "#plate/model/interactions.ts";
import type { BodyNode, Interaction, StubbedInteraction, Unsupported } from "#plate/model/item.ts";
import type { ResponseValue, Value } from "#plate/model/values.ts";
import type { EmitState, Payload, PayloadNode, ValidationMessage } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * An interaction kind, as the item model names it.
 */
export type InteractionKind = Interaction["kind"];

/**
 * A kind plate parses through an interaction module beside this file, one of the seventeen beside
 * the four the hubs hold inline.
 */
export type ModuleKind = StubbedInteraction["kind"];

/**
 * The module kinds, each once: a record over {@link ModuleKind}, so a kind added to it or taken
 * from it changes this table or fails to compile.
 */
const moduleKinds = {
  associate: true,
  drawing: true,
  "end-attempt": true,
  "gap-match": true,
  "graphic-associate": true,
  "graphic-gap-match": true,
  "graphic-order": true,
  hotspot: true,
  hottext: true,
  match: true,
  media: true,
  order: true,
  "portable-custom": true,
  "position-object": true,
  "select-point": true,
  slider: true,
  upload: true,
} as const satisfies { readonly [K in ModuleKind]: true };

/**
 * Tell whether a kind is a {@link ModuleKind}, whatever node names it.
 *
 * @param kind A node's kind.
 * @returns Whether a module parses the kind.
 */
export const isModuleKind = (kind: string): kind is ModuleKind => Object.hasOwn(moduleKinds, kind);

/**
 * A feature of the QTI 3.0 conformance list, Appendix A, by its identifier: `Q-1` to `Q-21` are
 * the interactions, Associate to Upload in alphabetical order.
 */
export type FeatureId = `Q-${number}`;

/**
 * The row a module gives one of its parts, before {@link partRow} adds the owner, the part key and
 * the derived `data-slot` marker. `legendOwner` is false unless the spec says otherwise.
 */
export type PartSpec = Omit<PartRow, "interaction" | "legendOwner" | "part" | "slot"> & {
  readonly legendOwner?: boolean;
};

/**
 * What a placement sets of a part's row over its {@link PartSpec}, as `rowFor` sets the Notice's
 * element by its position and the Choice Prompt's by its markup: each field given replaces the
 * spec's.
 */
export type PartPlacement = Partial<Omit<PartRow, "interaction" | "part" | "slot">>;

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
 * One region of an interaction's own content as its module gives it: a `Region` of
 * `#plate/model/interactions.ts` without its owner, which `regionsOf` adds.
 */
export type OwnRegion = Omit<Region, "owner">;

/**
 * One interaction kind's module.
 *
 * @template K The kind, as the item model names it.
 * @template I The kind's model node.
 * @template P The kind's payload node, `never` for a stub, which has none yet. It names the response
 *   it binds, as every QTI interaction's `response-identifier` names one.
 * @template Part The kind's part keys, `never` for a stub, which has no row.
 * @template J The JSON form of the model node in a redacted body, `never` for a stub, whose
 *   `payloadSchema` refuses every value.
 */
export interface InteractionModule<
  K extends InteractionKind,
  I,
  P extends { readonly response: string },
  Part extends string = never,
  J = never,
> {
  /**
   * The responses the interaction binds, each with its number base, as `postings` reads them.
   */
  readonly bindings: (interaction: I) => readonly BoundResponse[];
  /**
   * Compute every attribute of every part once, as `renderInlineChoice`'s connect function does.
   */
  readonly connect: (interaction: P, payload: Payload, locale: Locale) => Connected;
  /**
   * The payload nodes the render writes as content through `emitNodes`, in document order, as a
   * Prompt's nodes are written: the hubs that read what the emitter writes (the heading levels
   * the heading shift is read from) read them through this. None for a stub, which has no payload
   * node.
   */
  readonly content: (interaction: P) => readonly PayloadNode[];
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
   * The rows of the kind's parts, by part key; none for a stub. {@link partRow} gives a part's row.
   */
  readonly parts: { readonly [Q in Part]: PartSpec };
  /**
   * The Schema the redacted codec checks the model node's JSON form with, built from what the codec
   * hands it, so that no browser module value-imports Schema; for a stub, the kit's `unimplemented`
   * schema, which refuses the kind naming its feature.
   *
   * @param kit The codec's Schema and its shared field schemas, the body's recursive one among
   *   them.
   * @returns The model node's codec: its type `I`, its encoded side `J`.
   */
  readonly payloadSchema: (kit: SchemaKit) => Schema.Codec<I, J>;
  /**
   * Copy the model node into the payload node the page may know.
   */
  readonly redact: (interaction: I) => P;
  /**
   * The regions of the model node's own content, in document order, as `regionsOf` gives them:
   * its Prompt and every other content it holds, each with the choice whose content it is. None
   * for a stub, whose model node no hub ever holds.
   */
  readonly regions: (interaction: I) => readonly OwnRegion[];
  /**
   * Render the payload node: its Root, every part placed through the embedder's replacement.
   */
  readonly render: (
    interaction: P,
    payload: Payload,
    state: EmitState,
  ) => Result.Result<Element, PartSwapRefused>;
  /**
   * Rebuild the model node with the content of each of its {@link InteractionModule.regions}
   * replaced, as `mapRegions` does: `contents` holds one entry per region, in the order `regions`
   * gives them. The node itself for a stub.
   */
  readonly replaceRegions: (interaction: I, contents: readonly (readonly BodyNode[])[]) => I;
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
 * Give the row of one of a module's parts, as a module's render places it with `applyPart`: its
 * {@link PartSpec}, with what the placement sets over it, owned by the module's `owner`, keyed by
 * the part, and marked by the `data-slot` value the part table derives for every part (`<owner>`
 * for the Root, `<owner>-<part>` in kebab case otherwise). `legendOwner` is false unless the spec
 * or the placement says otherwise.
 *
 * A module's rows live in the module, not in the part table: `rowFor` serves the four shipped
 * kinds and the chrome only, so a module calls this and never `rowFor`.
 *
 * @param module The module, by its owner and its parts.
 * @param part The part.
 * @param placement What the placement sets over the spec, nothing by default.
 * @returns The part's row.
 */
export const partRow = <Part extends PartKey>(
  module: { readonly owner: InteractionKey; readonly parts: { readonly [Q in Part]: PartSpec } },
  part: Part,
  placement: PartPlacement = {},
): PartRow => {
  const { legendOwner = false, ...spec } = module.parts[part];

  return {
    ...spec,
    legendOwner,
    ...placement,
    interaction: module.owner,
    part,
    slot: slotFor(module.owner, part),
  };
};

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
