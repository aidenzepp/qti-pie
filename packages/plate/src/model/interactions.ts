/**
 * The regions of an interaction, the content it holds of its own, the walk that finds an item
 * body's interactions, and the steps of the interactions plate parses through a stub module, which
 * response validation, the payload, the results, the verdict and the redacted codec share.
 *
 * {@link regionsOf} is the one place that knows which content each interaction kind holds: every
 * walk of the body that enters an interaction enters it through the regions this gives, each with
 * its owner, so no walk keeps its own table of the kinds; a module kind's regions are its module's.
 * {@link stubSteps} is the one place that hands a module kind's model node to its module, and
 * {@link renderModule} and {@link moduleContent} the ones that hand its payload node to its
 * module's render and content, so each hub delegates a module's kind in one line, and a module that
 * lands changes neither. The types the hubs read of a module kind, its model node
 * ({@link ModelOf}) and its payload node ({@link PayloadOf}), are read from the table of modules
 * ({@link modules}), and the item model reads its union of module nodes ({@link ModuleModel}) from
 * the same table, so a module declares both in its own file and no shared file names a kind's
 * fields. The table-generic forms ({@link ModelOfIn}, {@link PayloadOfIn}, {@link SteppedIn}) let a
 * test type a module against the hubs through a table that holds it. As it loads, it hands the part
 * table every module's part names (`adoptModuleParts` in `#plate/emit/parts.ts`), which cannot
 * import the modules itself.
 *
 * It lives apart from the item model because the model builder value-imports the Effect runtime,
 * and its callers are browser modules: this module value-imports only `Option`, the part table and
 * the interaction modules, which value-import only `Data` and the part table.
 *
 * @module
 */
import { Option } from "effect";
import type { Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import type { Malformed } from "#plate/form/encoding.ts";
import { associateModule } from "#plate/interactions/associate.ts";
import { drawingModule } from "#plate/interactions/drawing.ts";
import { endAttemptModule } from "#plate/interactions/end-attempt.ts";
import { gapMatchModule } from "#plate/interactions/gap-match.ts";
import { graphicAssociateModule } from "#plate/interactions/graphic-associate.ts";
import { graphicGapMatchModule } from "#plate/interactions/graphic-gap-match.ts";
import { graphicOrderModule } from "#plate/interactions/graphic-order.ts";
import { hotspotModule } from "#plate/interactions/hotspot.ts";
import { hottextModule } from "#plate/interactions/hottext.ts";
import { matchModule } from "#plate/interactions/match.ts";
import { mediaModule } from "#plate/interactions/media.ts";
import { orderModule } from "#plate/interactions/order.ts";
import { portableCustomModule } from "#plate/interactions/portable-custom.ts";
import { positionObjectModule } from "#plate/interactions/position-object.ts";
import { selectPointModule } from "#plate/interactions/select-point.ts";
import { sliderModule } from "#plate/interactions/slider.ts";
import { uploadModule } from "#plate/interactions/upload.ts";
import type { Element } from "#plate/emit/node.ts";
import { adoptModuleParts } from "#plate/emit/parts.ts";
import type { InteractionKey, PartKey, PartName } from "#plate/emit/parts.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { isModuleKind } from "#plate/interactions/contract.ts";
import type {
  BoundResponse,
  InteractionModule,
  ModuleKind,
  OwnRegion,
  PartSpec,
  RedactKit,
} from "#plate/interactions/contract.ts";
import type { BodyNode, Interaction, Item, SimpleChoice } from "#plate/model/item.ts";
import type { ResponseValue, Value } from "#plate/model/values.ts";
import type {
  EmitState,
  ModulePayloadOf,
  Payload,
  PayloadNode,
  ValidationMessage,
} from "#plate/payload.ts";

/**
 * One region of an interaction: content it holds of its own, with the owner it sits in.
 */
export interface Region {
  /**
   * The identifier of the choice whose content this is, none for a Prompt or a Label.
   */
  readonly choice: Option.Option<string>;
  readonly nodes: readonly BodyNode[];
  /**
   * The interaction that holds the region.
   */
  readonly owner: Interaction;
  /**
   * Which of the owner's content it is: a `prompt`, an Inline Choice's `label`, a `choice`'s
   * content, or a module's other `content`, such as a Gap Match's gapped text.
   */
  readonly part: "choice" | "content" | "label" | "prompt";
  /**
   * How the emitter writes it: as `nodes`, the body's elements and text, or as `text` only, as an
   * Inline Choice's choice is written as the one text of an `option`, so no element of it, and no
   * id it carries, reaches the page.
   */
  readonly written: "nodes" | "text";
}

/**
 * What the hubs read of a table of modules: each kind's module, naming its kind, with the `redact`
 * its model and payload node types are read from. The table of modules is one; a test's table that
 * holds a module in place of a stub is another.
 */
export type ModuleTable = {
  readonly [K in ModuleKind]: {
    readonly kind: K;
    readonly redact: (interaction: never, kit: RedactKit) => { readonly response: string };
  };
};

/**
 * The module of each kind plate parses through one, by kind: a record over {@link ModuleKind}, so
 * a kind added to it or taken from it changes this table or fails to compile. The types a hub reads
 * of a module ({@link ModelOf}, {@link PayloadOf}) are read from it, so a module that lands
 * declares them in its own file.
 */
export const modules = {
  associate: associateModule,
  drawing: drawingModule,
  "end-attempt": endAttemptModule,
  "gap-match": gapMatchModule,
  "graphic-associate": graphicAssociateModule,
  "graphic-gap-match": graphicGapMatchModule,
  "graphic-order": graphicOrderModule,
  hotspot: hotspotModule,
  hottext: hottextModule,
  match: matchModule,
  media: mediaModule,
  order: orderModule,
  "portable-custom": portableCustomModule,
  "position-object": positionObjectModule,
  "select-point": selectPointModule,
  slider: sliderModule,
  upload: uploadModule,
} as const satisfies { readonly [K in ModuleKind]: { readonly kind: K } };

/**
 * The module of each {@link ModuleKind}, by kind, as each module declares itself.
 */
export type Modules = typeof modules;

/**
 * The model node of a module's kind in a table, as its module's `redact` reads it.
 *
 * @template T The table.
 * @template K The kind.
 */
export type ModelOfIn<T extends ModuleTable, K extends ModuleKind> = Parameters<T[K]["redact"]>[0];

/**
 * The payload node of a module's kind in a table, as its module's `redact` gives it: `never` for a
 * stub. It names the response it binds, as the contract requires of every module's payload node.
 *
 * @template T The table.
 * @template K The kind.
 */
export type PayloadOfIn<T extends ModuleTable, K extends ModuleKind> = Extract<
  ReturnType<T[K]["redact"]>,
  { readonly response: string }
>;

/**
 * The model node of every module kind in a table, one member per kind.
 *
 * @template T The table.
 */
export type ModuleModelIn<T extends ModuleTable> = {
  readonly [K in ModuleKind]: ModelOfIn<T, K>;
}[ModuleKind];

/**
 * The model node of a module's kind, as its module's `redact` reads it.
 *
 * @template K The kind.
 */
export type ModelOf<K extends ModuleKind> = ModelOfIn<Modules, K>;

/**
 * The payload node of a module's kind, as its module's `redact` gives it: `never` for a stub.
 *
 * @template K The kind.
 */
export type PayloadOf<K extends ModuleKind> = PayloadOfIn<Modules, K>;

/**
 * The model node of any interaction plate parses through a module, one member per kind, each as
 * its module declares it: the item model's `Interaction` union holds this, so a module that lands
 * changes the model through its own file. While every module is a stub, each member is the shared
 * fields alone (`ModuleInteraction` in `#plate/interactions/contract.ts`), which the model never
 * holds.
 */
export type ModuleModel = ModuleModelIn<Modules>;

/**
 * The members of a module the hubs call through {@link stubSteps} and {@link renderModule}, typed
 * by its kind's model and payload nodes in a table.
 *
 * @template T The table.
 * @template K The kind.
 */
type SteppedOf<T extends ModuleTable, K extends ModuleKind> = Pick<
  InteractionModule<K, ModelOfIn<T, K>, PayloadOfIn<T, K>>,
  | "absentValue"
  | "bindings"
  | "content"
  | "controls"
  | "countsAttempt"
  | "nullValue"
  | "redact"
  | "regions"
  | "render"
  | "replaceRegions"
  | "restore"
  | "sequence"
  | "solution"
  | "unnamed"
  | "validate"
>;

/**
 * Each kind's {@link SteppedOf} members in a table, by kind: a mapped type, so that indexing it by
 * a kind gives that kind's members, which correlates a node's kind with its module's types. A table
 * assigned to its own `SteppedIn` is the check that every module's steps take and give its own
 * model and payload nodes, which {@link stepped} makes of {@link modules} and a test makes of a
 * table that holds a module in place of a stub.
 *
 * @template T The table.
 */
export type SteppedIn<T extends ModuleTable> = { readonly [K in ModuleKind]: SteppedOf<T, K> };

/**
 * {@link modules} as {@link SteppedIn} of itself.
 */
const stepped: SteppedIn<Modules> = modules;

/**
 * Name each of a module's parts by its owner and its key. It reads any module alike, so the table
 * of modules is read in one pass whatever parts each module that lands declares.
 *
 * @param module The module, by its owner and its parts, each keyed by a part key.
 * @returns One name per key of its `parts`, in their order; none for a stub.
 */
const partNamesOf = (module: {
  readonly owner: InteractionKey;
  readonly parts: Readonly<Partial<Record<PartKey, PartSpec>>>;
}): readonly PartName[] =>
  Object.keys(module.parts)
    .filter((part): part is PartKey => Object.hasOwn(module.parts, part))
    .map((part) => ({ interaction: module.owner, part }));

adoptModuleParts(Object.values(modules).flatMap(partNamesOf));

/**
 * Give the regions of a module kind's model node, by its kind's module.
 *
 * @param kind The kind.
 * @param interaction The node.
 * @returns Its module's regions of it, without the owner.
 */
const moduleRegions = <K extends ModuleKind>(
  kind: K,
  interaction: ModelOf<K>,
): readonly OwnRegion[] => stepped[kind].regions(interaction);

/**
 * Rebuild a module kind's model node with its regions' content replaced, by its kind's module.
 *
 * @param kind The kind.
 * @param interaction The node.
 * @param contents The content of each region, in the order {@link moduleRegions} gives them.
 * @returns The node rebuilt.
 */
const replaceModuleRegions = <K extends ModuleKind>(
  kind: K,
  interaction: ModelOf<K>,
  contents: readonly (readonly BodyNode[])[],
): ModelOf<K> => stepped[kind].replaceRegions(interaction, contents);

/**
 * Tell whether a module kind's model node counts a submission as an attempt, by its kind's
 * module: true when the module does not say.
 *
 * @param kind The kind.
 * @param interaction The node.
 * @param posted The submission's responses, by identifier.
 * @returns The module's `countsAttempt` answer, true when it has none.
 */
const moduleCountsAttempt = <K extends ModuleKind>(
  kind: K,
  interaction: ModelOf<K>,
  posted: Readonly<Record<string, Value>>,
): boolean => stepped[kind].countsAttempt?.(interaction, posted) ?? true;

/**
 * Give the value a module kind's model node takes for its response when the form posted no entry,
 * by its kind's module: none when the module does not say.
 *
 * @param kind The kind.
 * @param interaction The node.
 * @returns The module's `absentValue`, `undefined` when it has none.
 */
const moduleAbsentValue = <K extends ModuleKind>(
  kind: K,
  interaction: ModelOf<K>,
): Value | undefined => stepped[kind].absentValue?.(interaction);

/**
 * Tell whether a node is one of an interaction plate parses through a module: a model node
 * ({@link ModuleModel}) or a payload node (`ModulePayload`), whichever the node's own type holds.
 *
 * @param node A body or payload node.
 * @returns Whether its kind is a {@link ModuleKind}.
 */
export const isStubbed = <N extends { readonly kind: string }>(
  node: N,
): node is Extract<N, { readonly kind: ModuleKind }> => isModuleKind(node.kind);

/**
 * Give a region the owner holds, none when the owner has no such content.
 *
 * @param owner The interaction.
 * @param part Which content it is.
 * @param nodes The content, none when the owner has none.
 * @returns The region, or none.
 */
const leading = (
  owner: Interaction,
  part: "label" | "prompt",
  nodes: Option.Option<readonly BodyNode[]>,
): readonly Region[] =>
  Option.match(nodes, {
    onNone: () => [],
    onSome: (content) => [
      { choice: Option.none(), nodes: content, owner, part, written: "nodes" as const },
    ],
  });

/**
 * Give the region of each choice the owner holds, in document order.
 *
 * @param owner The interaction.
 * @param choices Its choices.
 * @param written How the emitter writes a choice's content.
 * @returns One region per choice.
 */
const choiceRegions = (
  owner: Interaction,
  choices: readonly SimpleChoice[],
  written: Region["written"],
): readonly Region[] =>
  choices.map((simple) => ({
    choice: Option.some(simple.identifier),
    nodes: simple.content,
    owner,
    part: "choice" as const,
    written,
  }));

/**
 * Give the regions of an interaction, first in the document first: a Choice's Prompt then its
 * choices' content; an Extended Text's Prompt; an Inline Choice's Label then its choices' content,
 * which is written as text; nothing of a Text Entry's; and a module kind's ({@link isStubbed}) as
 * its module's `regions` gives them, its other `content` among them, none for a stub.
 *
 * @param interaction The interaction.
 * @returns Its regions, each with the interaction as its owner.
 */
export const regionsOf = (interaction: Interaction): readonly Region[] => {
  if (isStubbed(interaction)) {
    return moduleRegions(interaction.kind, interaction).map((region) => ({
      ...region,
      owner: interaction,
    }));
  }

  switch (interaction.kind) {
    case "choice": {
      return [
        ...leading(interaction, "prompt", interaction.prompt),
        ...choiceRegions(interaction, interaction.choices, "nodes"),
      ];
    }
    case "extended-text": {
      return leading(interaction, "prompt", interaction.prompt);
    }
    case "inline-choice": {
      return [
        ...leading(interaction, "label", interaction.label),
        ...choiceRegions(interaction, interaction.choices, "text"),
      ];
    }
    case "text-entry": {
      return [];
    }
    default: {
      return interaction satisfies never;
    }
  }
};

/**
 * Rebuild an interaction with the content of each of its regions ({@link regionsOf}) replaced,
 * calling `map` on the regions in document order, so a `map` that gathers what it finds gathers it
 * in that order. A region's choice keeps every field but its content. A module kind's node is
 * rebuilt by its module's `replaceRegions`.
 *
 * @param interaction The interaction.
 * @param map The content each region is replaced by.
 * @returns The interaction with each region's content replaced; a kind with no region is returned
 *   as it is.
 */
export const mapRegions = (
  interaction: Interaction,
  map: (region: Region) => readonly BodyNode[],
): Interaction => {
  const mapped = regionsOf(interaction).map((region) => ({ nodes: map(region), region }));
  const lead = (part: "label" | "prompt"): Option.Option<readonly BodyNode[]> =>
    Option.fromUndefinedOr(mapped.find((entry) => entry.region.part === part)?.nodes);
  const contents = mapped.flatMap((entry) => (entry.region.part === "choice" ? [entry.nodes] : []));
  const choices = (original: readonly SimpleChoice[]): readonly SimpleChoice[] =>
    original.map((choice, index) => ({ ...choice, content: contents[index] ?? choice.content }));

  if (isStubbed(interaction)) {
    return replaceModuleRegions(
      interaction.kind,
      interaction,
      mapped.map((entry) => entry.nodes),
    );
  }

  switch (interaction.kind) {
    case "choice": {
      return { ...interaction, choices: choices(interaction.choices), prompt: lead("prompt") };
    }
    case "extended-text": {
      return { ...interaction, prompt: lead("prompt") };
    }
    case "inline-choice": {
      return { ...interaction, choices: choices(interaction.choices), label: lead("label") };
    }
    case "text-entry": {
      return interaction;
    }
    default: {
      return interaction satisfies never;
    }
  }
};

/**
 * The kinds of body node that are no interaction, each once: a record over every such kind, so a
 * kind added to the body or taken from it changes this table or fails to compile.
 */
const contentKinds = {
  content: true,
  element: true,
  "printed-variable": true,
  "template-block": true,
  "template-inline": true,
  text: true,
  unsupported: true,
} as const satisfies { readonly [K in Exclude<BodyNode, Interaction>["kind"]]: true };

/**
 * Tell whether a body node is an interaction.
 *
 * @param node The body node.
 * @returns Whether it is one of the model's interactions: any node whose kind is no content kind.
 */
export const isInteraction = (node: BodyNode): node is Interaction =>
  !Object.hasOwn(contentKinds, node.kind);

/**
 * Collect the interactions of body nodes in document order, inside elements, template blocks and
 * inlines, and every interaction's regions ({@link regionsOf}). A template block's or inline's
 * content is walked whatever its visibility, so over the model its interactions are found; a
 * redacted body holds no template block or inline, its hidden content already gone.
 *
 * @param nodes The body nodes.
 * @returns The interactions.
 */
export const interactionsIn = (nodes: readonly BodyNode[]): readonly Interaction[] =>
  nodes.flatMap((node): readonly Interaction[] => {
    if (isInteraction(node)) {
      return [node, ...regionsOf(node).flatMap((region) => interactionsIn(region.nodes))];
    }

    switch (node.kind) {
      case "element": {
        return interactionsIn(node.children);
      }
      case "template-block":
      case "template-inline": {
        return interactionsIn(node.content);
      }
      case "content":
      case "printed-variable":
      case "text":
      case "unsupported": {
        return [];
      }
      default: {
        return node satisfies never;
      }
    }
  });

/**
 * Tell whether a submission of an item counts an attempt: the one place the engine asks the item's
 * interactions, so `runAttempt` (`#plate/engine/attempt.ts`) raises `numAttempts` without naming a
 * kind. Every interaction the body holds ({@link interactionsIn}) answers through its module's
 * `countsAttempt` (`InteractionModule` in `#plate/interactions/contract.ts`), and the attempt
 * counts when every answer is true: a shipped kind, a stub and a module that leaves the member
 * unset answer true, so an item of those alone counts every submission, and one module that
 * answers false, as an End Attempt with `count-attempt` false does for the attempt ended through
 * its button, is enough to leave the count where it was.
 *
 * @param item The item, by its body.
 * @param posted The submission's responses, by identifier, as `runAttempt` is given them.
 * @returns Whether the attempt is counted.
 */
export const countsAttempt = (
  item: Pick<Item, "body">,
  posted: Readonly<Record<string, Value>>,
): boolean =>
  interactionsIn(item.body).every(
    (interaction) =>
      !isStubbed(interaction) || moduleCountsAttempt(interaction.kind, interaction, posted),
  );

/**
 * Give the value an interaction's response takes when the form posted no entry for it, in place
 * of NULL: a module kind's node answers through its module's `absentValue` (`InteractionModule` in
 * `#plate/interactions/contract.ts`), and every other interaction, a shipped kind, a stub or a
 * module that leaves the member unset, answers none, so no entry stays NULL for it. `postings`
 * (`#plate/payload.ts`) reads it into the response's posting, so a host that decodes through the
 * postings gets the module's value without naming the kind.
 *
 * @param interaction The interaction.
 * @returns The value no entry decodes to, or `undefined` for NULL.
 */
export const absentValueOf = (interaction: Interaction): Value | undefined =>
  isStubbed(interaction) ? moduleAbsentValue(interaction.kind, interaction) : undefined;

/**
 * The steps of one module kind's model node, each bound to it: the members of its module the hubs
 * call ({@link InteractionModule}), so a hub delegates a module's kind in one line. A stub's throw
 * `NotImplemented`, and no hub reaches one: the model holds no stubbed node.
 *
 * @template K The kind.
 */
export interface StubSteps<K extends ModuleKind> {
  readonly bindings: () => readonly BoundResponse[];
  readonly controls: () => number;
  readonly nullValue: () => Value;
  /**
   * Copy the node into its payload node, the module's `redact`, as the payload's
   * {@link ModulePayloadOf} member, its content copied through the kit.
   *
   * @param kit The payload's copy of body nodes.
   * @returns The payload node, at its kind.
   */
  readonly redact: (kit: RedactKit) => ModulePayloadOf<K>;
  readonly restore: (stored: ResponseValue) => ResponseValue;
  readonly sequence: (seed: Option.Option<string>, instance: string) => Option.Option<string>;
  readonly solution: (correct: ResponseValue) => ResponseValue;
  readonly unnamed: (unauthored: boolean) => boolean;
  readonly validate: (
    input: Value | Malformed,
    configuration: Configuration,
  ) => readonly ValidationMessage[];
}

/**
 * Bind a module's steps to one of its kind's model nodes.
 *
 * @param kind The kind.
 * @param interaction The node.
 * @returns The module's steps, each on the node.
 */
const stepsOf = <K extends ModuleKind>(kind: K, interaction: ModelOf<K>): StubSteps<K> => {
  const module = stepped[kind];

  return {
    bindings: () => module.bindings(interaction),
    controls: () => module.controls(interaction),
    nullValue: () => module.nullValue(interaction),
    redact: (kit) => ({ kind, payload: module.redact(interaction, kit) }),
    restore: (stored) => module.restore(interaction, stored),
    sequence: (seed, instance) => module.sequence(interaction, seed, instance),
    solution: (correct) => module.solution(interaction, correct),
    unnamed: (unauthored) => module.unnamed(interaction, unauthored),
    validate: (input, configuration) => module.validate(interaction, input, configuration),
  };
};

/**
 * Give a module kind's model node's steps, by its kind's module: one case per kind, each binding
 * the node at its own kind, so the payload node {@link StubSteps.redact} gives is the member of its
 * kind; no case names a module, so a module that lands changes none.
 *
 * @param interaction The model node.
 * @returns Its module's steps, bound to it.
 */
export const stubSteps = (
  interaction: ModuleModel,
): { readonly [K in ModuleKind]: StubSteps<K> }[ModuleKind] => {
  switch (interaction.kind) {
    case "associate": {
      return stepsOf("associate", interaction);
    }
    case "drawing": {
      return stepsOf("drawing", interaction);
    }
    case "end-attempt": {
      return stepsOf("end-attempt", interaction);
    }
    case "gap-match": {
      return stepsOf("gap-match", interaction);
    }
    case "graphic-associate": {
      return stepsOf("graphic-associate", interaction);
    }
    case "graphic-gap-match": {
      return stepsOf("graphic-gap-match", interaction);
    }
    case "graphic-order": {
      return stepsOf("graphic-order", interaction);
    }
    case "hotspot": {
      return stepsOf("hotspot", interaction);
    }
    case "hottext": {
      return stepsOf("hottext", interaction);
    }
    case "match": {
      return stepsOf("match", interaction);
    }
    case "media": {
      return stepsOf("media", interaction);
    }
    case "order": {
      return stepsOf("order", interaction);
    }
    case "portable-custom": {
      return stepsOf("portable-custom", interaction);
    }
    case "position-object": {
      return stepsOf("position-object", interaction);
    }
    case "select-point": {
      return stepsOf("select-point", interaction);
    }
    case "slider": {
      return stepsOf("slider", interaction);
    }
    case "upload": {
      return stepsOf("upload", interaction);
    }
    default: {
      return interaction satisfies never;
    }
  }
};

/**
 * Render a module kind's payload node through its module's render: its Root, every part placed
 * through the embedder's replacement.
 *
 * @param interaction The payload node, as the payload holds it.
 * @param payload The render's payload.
 * @param state The render's emit state.
 * @returns The interaction's Root, or the refusal of a part swap.
 */
export const renderModule = <K extends ModuleKind>(
  interaction: ModulePayloadOf<K>,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> =>
  stepped[interaction.kind].render(interaction.payload, payload, state);

/**
 * Give the payload nodes a module kind's payload node writes as content, through its module's
 * `content`, so a hub that reads what the emitter writes reads them.
 *
 * @param interaction The payload node, as the payload holds it.
 * @returns The nodes its module's render writes as content, in document order.
 */
export const moduleContent = <K extends ModuleKind>(
  interaction: ModulePayloadOf<K>,
): readonly PayloadNode[] => stepped[interaction.kind].content(interaction.payload);
