/**
 * The regions of an interaction, the content it holds of its own, the walk that finds an item
 * body's interactions, and the steps of the interactions plate parses through a stub module, which
 * response validation, the payload, the results, the verdict and the redacted codec share.
 *
 * {@link regionsOf} is the one place that knows which content each interaction kind holds: every
 * walk of the body that enters an interaction enters it through the regions this gives, each with
 * its owner, so no walk keeps its own table of the kinds. {@link stubSteps} is the one place that
 * hands a stubbed kind's node to its module, so each hub delegates a stubbed kind in one line.
 *
 * It lives apart from the item model because the model builder value-imports the Effect runtime,
 * and its callers are browser modules: this module value-imports only `Option` and the stub
 * modules, which value-import only `Data`.
 *
 * @module
 */
import { Option } from "effect";
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
import type {
  BoundResponse,
  InteractionKind,
  InteractionModule,
} from "#plate/interactions/contract.ts";
import type { BodyNode, Interaction, SimpleChoice, StubbedInteraction } from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import type { ValidationMessage } from "#plate/payload.ts";

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
   * Which of the owner's content it is: a `prompt`, an Inline Choice's `label`, or a `choice`'s
   * content.
   */
  readonly part: "choice" | "label" | "prompt";
  /**
   * How the emitter writes it: as `nodes`, the body's elements and text, or as `text` only, as an
   * Inline Choice's choice is written as the one text of an `option`, so no element of it, and no
   * id it carries, reaches the page.
   */
  readonly written: "nodes" | "text";
}

/**
 * The kinds plate parses through a stub module, each once: a record over
 * {@link StubbedInteraction}'s kinds, so a kind added to it or taken from it changes this table
 * or fails to compile.
 */
const stubbedKinds = {
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
} as const satisfies { readonly [K in StubbedInteraction["kind"]]: true };

/**
 * Tell whether a node is the placeholder of an interaction plate parses through a stub module.
 *
 * @param node A body or payload node.
 * @returns Whether its kind is a stubbed kind.
 */
export const isStubbed = (node: { readonly kind: string }): node is StubbedInteraction =>
  Object.hasOwn(stubbedKinds, node.kind);

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
 * which is written as text; nothing of a Text Entry's; and the Prompt of a stubbed kind's
 * placeholder ({@link isStubbed}).
 *
 * @param interaction The interaction.
 * @returns Its regions, each with the interaction as its owner.
 */
export const regionsOf = (interaction: Interaction): readonly Region[] => {
  if (isStubbed(interaction)) {
    return leading(interaction, "prompt", interaction.prompt);
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
 * in that order. A region's choice keeps every field but its content.
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
    return { ...interaction, prompt: lead("prompt") };
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
 * The steps of one stubbed interaction, each bound to its node: the members of its module the hubs
 * call ({@link InteractionModule}), so a hub delegates a stubbed kind in one line. Each throws
 * `NotImplemented` until its kind's module lands, and no hub reaches one: the model holds no
 * stubbed node.
 */
export interface StubSteps {
  readonly bindings: () => readonly BoundResponse[];
  readonly controls: () => number;
  readonly nullValue: () => Value;
  readonly redact: () => never;
  readonly sequence: (seed: Option.Option<string>, instance: string) => Option.Option<string>;
  readonly unnamed: (unauthored: boolean) => boolean;
  readonly validate: (
    input: Value | Malformed,
    configuration: Configuration,
  ) => readonly ValidationMessage[];
}

/**
 * Bind a stub module's steps to one of its nodes.
 *
 * @param module The kind's module.
 * @param interaction The node.
 * @returns The module's steps, each on the node.
 */
const stepsOf = <K extends InteractionKind, I>(
  module: InteractionModule<K, I, never>,
  interaction: I,
): StubSteps => ({
  bindings: () => module.bindings(interaction),
  controls: () => module.controls(interaction),
  nullValue: () => module.nullValue(interaction),
  redact: () => module.redact(interaction),
  sequence: (seed, instance) => module.sequence(interaction, seed, instance),
  unnamed: (unauthored) => module.unnamed(interaction, unauthored),
  validate: (input, configuration) => module.validate(interaction, input, configuration),
});

/**
 * Give a stubbed interaction's steps, by its kind's module: the one switch that names every
 * stubbed kind's module, so each hub delegates through it.
 *
 * @param interaction The stubbed node.
 * @returns Its module's steps, bound to it.
 */
export const stubSteps = (interaction: StubbedInteraction): StubSteps => {
  switch (interaction.kind) {
    case "associate": {
      return stepsOf(associateModule, interaction);
    }
    case "drawing": {
      return stepsOf(drawingModule, interaction);
    }
    case "end-attempt": {
      return stepsOf(endAttemptModule, interaction);
    }
    case "gap-match": {
      return stepsOf(gapMatchModule, interaction);
    }
    case "graphic-associate": {
      return stepsOf(graphicAssociateModule, interaction);
    }
    case "graphic-gap-match": {
      return stepsOf(graphicGapMatchModule, interaction);
    }
    case "graphic-order": {
      return stepsOf(graphicOrderModule, interaction);
    }
    case "hotspot": {
      return stepsOf(hotspotModule, interaction);
    }
    case "hottext": {
      return stepsOf(hottextModule, interaction);
    }
    case "match": {
      return stepsOf(matchModule, interaction);
    }
    case "media": {
      return stepsOf(mediaModule, interaction);
    }
    case "order": {
      return stepsOf(orderModule, interaction);
    }
    case "portable-custom": {
      return stepsOf(portableCustomModule, interaction);
    }
    case "position-object": {
      return stepsOf(positionObjectModule, interaction);
    }
    case "select-point": {
      return stepsOf(selectPointModule, interaction);
    }
    case "slider": {
      return stepsOf(sliderModule, interaction);
    }
    case "upload": {
      return stepsOf(uploadModule, interaction);
    }
    default: {
      return interaction satisfies never;
    }
  }
};
