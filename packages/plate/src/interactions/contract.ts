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
 * A module owns its kind's model node: it declares the node's type, over the fields every module's
 * node shares ({@link ModuleInteraction}), and the item model's `Interaction` union and the hubs'
 * `ModelOf<K>` (`#plate/model/interactions.ts`) read that type from the table of modules, so no hub
 * and no shared file names a kind's fields. Its `parse` reads the element through the kit the body
 * walk hands it ({@link ReaderKit}): the attribute readers, the body walk for the element's content
 * (its Prompt, its choices' content) with the module's own elements, such as a `qti-gap`, let
 * through as elements where the walk writes a notice for any other `qti-*` element, the marks it
 * records, and the declaration its `response-identifier` names. Its `redact` copies its node's
 * content through the kit the payload hands it ({@link RedactKit}).
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
 * form through its `payloadSchema`, each of its parts through {@link partRow}, its own elements
 * through the render function it hands `emitNodes` (`nestedInteraction` in `#plate/emit/body.ts`),
 * and its parts reach a host's overrides and the `data-slot` lookup through the names
 * `#plate/model/interactions.ts` hands the part table as it loads.
 *
 * @module
 */
import { Data } from "effect";
import type { Option, Result, Schema } from "effect";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { SourceChild, SourceElement } from "#plate/document/source.ts";
import type { Attributes, Element } from "#plate/emit/node.ts";
import { slotFor } from "#plate/emit/parts.ts";
import type { InteractionKey, PartKey, PartRow } from "#plate/emit/parts.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { Malformed } from "#plate/form/encoding.ts";
import type { Locale } from "#plate/messages.ts";
import type { Region } from "#plate/model/interactions.ts";
import type { BodyNode, Interaction, Unsupported } from "#plate/model/item.ts";
import type { AttributeReaders } from "#plate/model/reader.ts";
import type { ResponseValue, Single, Value } from "#plate/model/values.ts";
import type {
  EmitState,
  Payload,
  PayloadNode,
  UnnamedPosition,
  ValidationMessage,
} from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import type { BaseType, Cardinality } from "#plate/vocabulary.ts";

/**
 * An interaction kind, as the item model names it.
 */
export type InteractionKind = Interaction["kind"];

/**
 * The module kinds, each once: the one place that names them. The table of modules in
 * `#plate/model/interactions.ts` is a record over {@link ModuleKind}, so a kind added here or taken
 * from here changes that table or fails to compile.
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
} as const;

/**
 * A kind plate parses through an interaction module beside this file, one of the seventeen beside
 * the four the hubs hold inline.
 */
export type ModuleKind = keyof typeof moduleKinds;

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
 * The fields every module kind's model node shares, which the hubs read of any interaction: the
 * kind, the element path, the response it binds (`response-identifier`, which every QTI interaction
 * carries) and the author's names for it. A module declares its node over these; a stub's node is
 * these alone, which the model never holds, since a stub's `parse` gives the notice.
 *
 * @template K The kind.
 */
export interface ModuleInteraction<K extends ModuleKind> {
  /**
   * The author's `aria-label`, which names the interaction when it has no Prompt.
   */
  readonly ariaLabel: Option.Option<string>;
  /**
   * The author's `aria-labelledby`, an IDREFS value as written, which names the interaction when it
   * has no Prompt.
   */
  readonly ariaLabelledby: Option.Option<string>;
  readonly kind: K;
  readonly path: string;
  /**
   * The identifier of the response it binds, `response-identifier`, read as `identifierOf` reads
   * it.
   */
  readonly response: string;
}

/**
 * The response declaration an interaction's `response-identifier` names, as the kit gives it: its
 * identifier, and its base type and cardinality as written, each none when absent or outside the
 * vocabulary, which the validator refuses first. A module binds its kind by them, as the body walk
 * binds the four shipped kinds, and gives the notice for a binding it does not render.
 */
export interface BoundDeclaration {
  readonly baseType: Option.Option<BaseType>;
  readonly cardinality: Option.Option<Cardinality>;
  /**
   * The declaration element itself, for what a module reads of it beyond the type, such as its
   * `qti-correct-response`.
   */
  readonly element: SourceElement;
  readonly identifier: string;
}

/**
 * What a module's `parse` reads the body walk's content with: the kit the walk hands it beside the
 * attribute readers ({@link AttributeReaders}), so a module reads its element the way the body walk
 * reads the four shipped kinds, and never re-implements the walk or imports its readers.
 */
export interface ReaderKit extends AttributeReaders {
  /**
   * The declaration the element's `response-identifier` names, none when it names none the item
   * declares, which the shipped kinds refuse as `undeclared-response`.
   */
  readonly bound: Option.Option<BoundDeclaration>;
  /**
   * Read the content of the element's first child of one name, such as its `qti-prompt`, as the
   * body walk reads a Prompt: the child's marks recorded, its children walked.
   *
   * @param element The element.
   * @param local The child's local name in the QTI namespace.
   * @returns The child's content, none when the element has no such child, or a refusal.
   */
  readonly content: (
    element: SourceElement,
    local: string,
  ) => Result.Result<Option.Option<readonly BodyNode[]>, Refusal>;
  /**
   * Record a feature the module reads but does not render as a mark on the verdict, at an element.
   *
   * @param element The element that carries the feature.
   * @param feature The feature's key, as the verdict names it.
   */
  readonly mark: (element: SourceElement, feature: string) => void;
  /**
   * Record the marks the vocabulary's `renders.marks` place on a body element, as the body walk
   * records them on each element it reads; a module calls it once for the element it reads, after
   * it has decided not to give the notice.
   *
   * @param element The element.
   */
  readonly markElement: (element: SourceElement) => void;
  /**
   * Read children of an element as body nodes, the way the body walk reads the item body: text as
   * itself, HTML elements with their subtrees, MathML, printed variables and template content
   * intact, and any other `qti-*` element as a notice, except those the module owns, which are read
   * as elements, their attributes as written and their children walked the same way, so a
   * `qti-gap` inside a paragraph reaches the module's content and the payload, the codec and the
   * emitter carry it as an element.
   *
   * @param parent The element whose children are read.
   * @param options Which children (all of them by default), and the local names of the `qti-*`
   *   elements the module owns, none by default.
   * @returns The body nodes, in document order, or a refusal.
   */
  readonly nodes: (
    parent: SourceElement,
    options?: {
      readonly children?: readonly SourceChild[];
      readonly own?: readonly string[];
    },
  ) => Result.Result<readonly BodyNode[], Refusal>;
}

/**
 * What the body walk hands a module's `parse`: the element's path, the one way to replace the
 * element by its notice, which also records the feature on the verdict, and the kit it reads the
 * element with.
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
  /**
   * The kit the element and its content are read with.
   */
  readonly read: ReaderKit;
}

/**
 * What the payload hands a module's `redact`, for the one interaction being redacted: the copy of
 * body nodes into payload nodes the payload makes of every content it copies, so a module's
 * content, its Prompt or a choice's, reaches the payload as a Choice's does, and the view's facts
 * about the interaction's responses, each as the payload reads it for the four shipped kinds, so a
 * module restores a stored response into its parts, writes its hidden inputs under the name the
 * host chose, and shuffles by the configuration's seed, with no hub naming its kind. The view's
 * values are the host's: a value a module's interaction binds has passed the module's `restore`
 * (through `restore` in `#plate/restore.ts`) or `solution` (`#plate/solution.ts`) when the host
 * read them from there, so what a module shows is what its own step gave.
 */
export interface RedactKit {
  /**
   * Whether the interaction's first Control takes `autofocus`: it is the first interaction, in
   * document order, that one of the view's validation messages names.
   */
  readonly autofocus: boolean;
  /**
   * Give the name a response's controls post under: the view's name for it, else
   * `entryName(instance, response)`.
   *
   * @param response The response identifier, one of the module's `bindings`.
   * @returns The entry name.
   */
  readonly formName: (response: string) => string;
  /**
   * The item instance key, which scopes every id and entry name, and keys a shuffle with the seed
   * and the response.
   */
  readonly instance: string;
  /**
   * Copy body nodes into payload nodes, in order, as the payload copies a Prompt's.
   *
   * @param nodes The body nodes.
   * @returns The payload nodes.
   */
  readonly nodes: (nodes: readonly BodyNode[]) => readonly PayloadNode[];
  /**
   * Give the strings a refused post sent for a response, which the controls show in place of the
   * value: none when the view has no messages, and the strings posted, none of them when the post
   * carried none for the response, when it has.
   *
   * @param response The response identifier, one of the module's `bindings`.
   * @returns The posted strings, when the view restores a post.
   */
  readonly posted: (response: string) => Option.Option<readonly string[]>;
  /**
   * The configuration's `seed`, written as given, none when it has none: with the instance and
   * the response, the key of a shuffle (`choiceOrder` in `#plate/payload.ts`).
   */
  readonly seed: Option.Option<string>;
  /**
   * Give the values the view shows for a response: the value's members, a record's `stringValue`
   * alone, none when it is NULL, a record without one, or the view gives none.
   *
   * @param response The response identifier, one of the module's `bindings`.
   * @returns The values shown.
   */
  readonly shown: (response: string) => readonly Single[];
  /**
   * Where the interaction's first Control stands among the Controls the renderer names, set
   * exactly when the module's `unnamed` said the renderer names them.
   */
  readonly unnamed: Option.Option<UnnamedPosition>;
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
 * @template I The kind's model node, over the fields every module's node shares
 *   ({@link ModuleInteraction}); the item model's union of module nodes is read from it.
 * @template P The kind's payload node, `never` for a stub, which has none yet. It names the response
 *   it binds, as every QTI interaction's `response-identifier` names one.
 * @template Part The kind's part keys, `never` for a stub, which has no row.
 * @template J The JSON form of the model node in a redacted body, `never` for a stub, whose
 *   `payloadSchema` refuses every value.
 */
export interface InteractionModule<
  K extends ModuleKind,
  I extends ModuleInteraction<K>,
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
   * Copy the model node into the payload node the page may know: its content through the kit, and
   * what it shows of the view, the stored values, the posted strings, the host's entry name, the
   * seed and the rest, read from the kit ({@link RedactKit}) and baked into the payload node, since
   * the render sees the `Payload` and none of the view beyond it.
   */
  readonly redact: (interaction: I, kit: RedactKit) => P;
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
   * The value the interaction shows for a stored response: `restore` in `#plate/restore.ts` hands
   * each response the interaction binds through it, so the values the host passes to `render` are
   * what the module gave, and its `redact` reads them back through the kit's `shown`.
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
   * The value the interaction shows for its response's correct value: `solution` in
   * `#plate/solution.ts` hands each response the interaction binds through it, as `restore` does a
   * stored one.
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
