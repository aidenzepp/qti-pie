/**
 * The hubs of the content modules: the one place that holds the ten modules, dispatches a source
 * element to the module that reads it, and hands a module's node to its own steps, so no walk,
 * copy, codec or emitter names a module's fields, and a module that lands changes only its file.
 *
 * The body-placed modules form one table by element ({@link bodyModules}) and the item-placed
 * modules another ({@link itemModules}). The types the hubs read of a module, its model node and
 * its payload node, are read from the tables, so the item model's `BodyNode` member
 * ({@link ContentNode}), the payload's ({@link ContentPayload}) and the content the item, the
 * redacted item and the payload hold by element ({@link ItemNodesHeld}, {@link ItemPayloadsHeld})
 * follow a module's own declaration. The table-generic forms ({@link BodyContentNodeIn},
 * {@link ItemNodesIn}) let a test build a table with a module that has landed and read what the
 * hubs would read of it.
 *
 * This is a browser module: `payload.ts` and the emitter reach it, so it value-imports from
 * `effect` only `Option` and `Result` (ruling OD-6), and builds no Schema; the codec builds each
 * module's through its `payloadSchema`.
 *
 * @module
 */
import { Option, Result } from "effect";
import { catalogInfoModule } from "#plate/content/catalog-info.ts";
import { companionMaterialsModule } from "#plate/content/companion-materials.ts";
import { anyElement } from "#plate/content/contract.ts";
import type {
  BodyContentModule,
  BodyContentNode,
  BodyContentPayload,
  ContentCopyKit,
  ContentNodeOf,
  ContentPayloadOf,
  ContentRedactKit,
  ContentRenderKit,
  ItemContent,
  ItemContentModule,
  ItemContentPayload,
  NodeOf,
  PayloadOf,
} from "#plate/content/contract.ts";
import { feedbackBlockModule } from "#plate/content/feedback-block.ts";
import { feedbackInlineModule } from "#plate/content/feedback-inline.ts";
import { mathmlModule } from "#plate/content/mathml.ts";
import { modalFeedbackModule } from "#plate/content/modal-feedback.ts";
import { rubricModule } from "#plate/content/rubric.ts";
import { ssmlModule } from "#plate/content/ssml.ts";
import { stimulusRefModule } from "#plate/content/stimulus-ref.ts";
import { stylesheetModule } from "#plate/content/stylesheet.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Element } from "#plate/emit/node.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { ParseContext } from "#plate/interactions/contract.ts";
import type { Unsupported } from "#plate/model/item.ts";
import type { EmitState, PayloadNode } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import type { UncheckedReason } from "#plate/validate/verdict.ts";

/**
 * The shape of a table of body-placed modules, by element: what the hubs need of each, so a test
 * can hold a module that has landed in place of a stub.
 */
export type BodyTable = {
  readonly [E in string]: {
    readonly copy: (node: never, kit: ContentCopyKit) => object;
    readonly element: E;
    readonly placement: "body";
    readonly redact: (node: never, kit: ContentRedactKit) => Option.Option<unknown>;
  };
};

/**
 * The shape of a table of item-placed modules, by element.
 */
export type ItemTable = {
  readonly [E in string]: {
    readonly copy: (node: never, kit: ContentCopyKit) => object;
    readonly element: E;
    readonly placement: "item";
    readonly redact: (node: never, kit: ContentRedactKit) => Option.Option<unknown>;
  };
};

/**
 * The body-placed content modules, by element: those the body walk reads. `*` is SSML's, which
 * reads every element of its namespace.
 */
export const bodyModules = {
  [anyElement]: ssmlModule,
  math: mathmlModule,
  "qti-feedback-block": feedbackBlockModule,
  "qti-feedback-inline": feedbackInlineModule,
  "qti-rubric-block": rubricModule,
} as const satisfies BodyTable;

/**
 * The item-placed content modules, by element: those the item root's walk reads.
 */
export const itemModules = {
  "qti-assessment-stimulus-ref": stimulusRefModule,
  "qti-catalog-info": catalogInfoModule,
  "qti-companion-materials-info": companionMaterialsModule,
  "qti-modal-feedback": modalFeedbackModule,
  "qti-stylesheet": stylesheetModule,
} as const satisfies ItemTable;

/**
 * The body-placed modules as each declares itself.
 */
export type BodyModules = typeof bodyModules;

/**
 * The item-placed modules as each declares itself.
 */
export type ItemModules = typeof itemModules;

/**
 * The element of a body-placed module, `*` for SSML's.
 */
export type BodyContentElement = keyof BodyModules;

/**
 * The element of an item-placed module.
 */
export type ItemContentElement = keyof ItemModules;

/**
 * One of the body-placed modules.
 */
export type BodyPlacedModule = BodyModules[BodyContentElement];

/**
 * One of the item-placed modules.
 */
export type ItemPlacedModule = ItemModules[ItemContentElement];

/**
 * One of the ten content modules.
 */
export type AnyContentModule = BodyPlacedModule | ItemPlacedModule;

/**
 * The ten content modules, the body-placed first, each in its table's order.
 */
export const contentModules: readonly AnyContentModule[] = [
  ...Object.values(bodyModules),
  ...Object.values(itemModules),
];

/**
 * The node of each body-placed module's element in a table, one member per module: the item
 * model's `BodyNode` member over {@link bodyModules}.
 *
 * @template T The table.
 */
export type BodyContentNodeIn<T extends BodyTable> = BodyContentNode<T[keyof T]>;

/**
 * The payload node of each body-placed module's element in a table, one member per module.
 *
 * @template T The table.
 */
export type BodyContentPayloadIn<T extends BodyTable> = BodyContentPayload<T[keyof T]>;

/**
 * The nodes an item holds of the item-placed modules in a table, by element.
 *
 * @template T The table.
 */
export type ItemNodesIn<T extends ItemTable> = ItemContent<T[keyof T]>;

/**
 * The payload nodes a payload holds of the item-placed modules in a table, by element.
 *
 * @template T The table.
 */
export type ItemPayloadsIn<T extends ItemTable> = ItemContentPayload<T[keyof T]>;

/**
 * The node of a body-placed content element in the item body, one member per module, each as its
 * module declares its node: the `BodyNode` member for content. While every module is a stub, each
 * member's node is `never`, which the model never holds.
 */
export type ContentNode = BodyContentNodeIn<BodyModules>;

/**
 * The payload node of a body-placed content element, one member per module: the `PayloadNode`
 * member for content, which the emitter hands to its module's render.
 */
export type ContentPayload = BodyContentPayloadIn<BodyModules>;

/**
 * The nodes the item model and the redacted item hold of the item-placed modules' elements, by
 * element.
 */
export type ItemNodesHeld = ItemNodesIn<ItemModules>;

/**
 * The payload nodes the payload holds of the item-placed modules' elements, by element.
 */
export type ItemPayloadsHeld = ItemPayloadsIn<ItemModules>;

/**
 * The steps of a body-placed module the hubs call, typed by its element's model and payload nodes
 * in {@link bodyModules}.
 *
 * @template E The element.
 */
type SteppedBody<E extends BodyContentElement> = Pick<
  BodyContentModule<E, NodeOf<BodyModules[E]>, PayloadOf<BodyModules[E]>, unknown>,
  "content" | "copy" | "normalise" | "parse" | "redact" | "render"
>;

/**
 * The steps of an item-placed module the hubs call, typed by its element's nodes in
 * {@link itemModules}.
 *
 * @template E The element.
 */
type SteppedItem<E extends ItemContentElement> = Pick<
  ItemContentModule<E, NodeOf<ItemModules[E]>, PayloadOf<ItemModules[E]>, unknown>,
  "content" | "copy" | "normalise" | "parse" | "redact" | "render"
>;

/**
 * The steps of every body-placed module, by element.
 */
type SteppedBodyTable = { readonly [E in BodyContentElement]: SteppedBody<E> };

/**
 * The steps of every item-placed module, by element.
 */
type SteppedItemTable = { readonly [E in ItemContentElement]: SteppedItem<E> };

/**
 * The body-placed modules as the hubs call them: {@link bodyModules} checked against the steps
 * each element's module must give, so a module's own node types are what the hubs hand it.
 */
const steppedBody: SteppedBodyTable = bodyModules;

/**
 * The item-placed modules as the hubs call them.
 */
const steppedItem: SteppedItemTable = itemModules;

/**
 * Tell whether a module reads a source element: the element is in the module's namespace, and the
 * module reads its local name or every element of the namespace ({@link anyElement}).
 *
 * @param module The module.
 * @param element The element.
 * @returns Whether the module reads it.
 */
const reads = (
  module: { readonly element: string; readonly namespace: string },
  element: SourceElement,
): boolean =>
  module.namespace === element.namespace &&
  (module.element === anyElement || module.element === element.local);

/**
 * Find the body-placed module that reads a body element.
 *
 * @param element The element.
 * @returns The module, none when no body-placed module reads the element.
 */
export const bodyModuleFor = (element: SourceElement): Option.Option<BodyPlacedModule> =>
  Option.fromUndefinedOr(Object.values(bodyModules).find((module) => reads(module, element)));

/**
 * Find the item-placed module that reads an item root child.
 *
 * @param element The element.
 * @returns The module, none when no item-placed module reads the element.
 */
export const itemModuleFor = (element: SourceElement): Option.Option<ItemPlacedModule> =>
  Option.fromUndefinedOr(Object.values(itemModules).find((module) => reads(module, element)));

/**
 * Tell whether what a module's `parse` gave is the element's notice rather than its node.
 *
 * @param node What the parse gave.
 * @returns Whether it is the unsupported node.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A module's node is its own type, which the hubs never name, so the guard reads only the discriminant every unsupported node carries.
const isUnsupported = (node: unknown): node is Unsupported =>
  typeof node === "object" && node !== null && "kind" in node && node.kind === "unsupported";

/**
 * Read a body element through the module of one element: the element normalised, when the module
 * normalises, then parsed into the module's node, placed in the body as a content node at the
 * element's path, or into its notice.
 *
 * @template E The element.
 * @param element The module's element.
 * @param source The source element.
 * @param context The parse context the body walk built for the source element.
 * @returns The content node or the notice, or a refusal.
 */
const parseWith = <E extends BodyContentElement>(
  element: E,
  source: SourceElement,
  context: ParseContext,
): Result.Result<ContentNodeOf<E, NodeOf<BodyModules[E]>> | Unsupported, Refusal> => {
  const module = steppedBody[element];
  const read = module.normalise === undefined ? source : module.normalise(source);

  return Result.map(module.parse(read, context), (node) =>
    isUnsupported(node) ? node : { element, kind: "content", node, path: context.path },
  );
};

/**
 * Read a body element a body-placed module reads, by that module's `parse`, after its `normalise`:
 * one case per element, each parsing at its own element, so the node is the member of its element;
 * no case names a module's fields, so a module that lands changes none.
 *
 * @param module The module that reads the element ({@link bodyModuleFor}).
 * @param source The source element.
 * @param context The parse context the body walk built for it.
 * @returns The content node or the notice, or a refusal.
 */
export const parseBodyContent = (
  module: BodyPlacedModule,
  source: SourceElement,
  context: ParseContext,
): Result.Result<ContentNode | Unsupported, Refusal> => {
  switch (module.element) {
    case anyElement: {
      return parseWith(anyElement, source, context);
    }
    case "math": {
      return parseWith("math", source, context);
    }
    case "qti-feedback-block": {
      return parseWith("qti-feedback-block", source, context);
    }
    case "qti-feedback-inline": {
      return parseWith("qti-feedback-inline", source, context);
    }
    case "qti-rubric-block": {
      return parseWith("qti-rubric-block", source, context);
    }
    default: {
      return module satisfies never;
    }
  }
};

/**
 * The steps of one content node of the body, each bound to it: what the redaction and the payload
 * call of its module.
 *
 * @template E The node's element.
 */
export interface ContentSteps<E extends BodyContentElement> {
  /**
   * Copy the node the redaction kept into its payload node, the module's `copy`, at its element.
   *
   * @param kit The payload's copy of body nodes.
   * @returns The payload node.
   */
  readonly copy: (kit: ContentCopyKit) => ContentPayloadOf<E, PayloadOf<BodyModules[E]>>;
  /**
   * Decide what the redacted item keeps of the node, the module's `redact`: the node with what it
   * kept, at the same element and path, or none to drop it.
   *
   * @param kit The redaction's walk and this render's facts.
   * @returns The node kept, or none.
   */
  readonly redact: (
    kit: ContentRedactKit,
  ) => Option.Option<ContentNodeOf<E, NodeOf<BodyModules[E]>>>;
}

/**
 * The steps of a content node of any element: what {@link contentSteps} gives, each step's result
 * the member of the node's element among the union, so a hub reads the body's union back.
 */
export interface AnyContentSteps {
  readonly copy: (kit: ContentCopyKit) => ContentPayload;
  readonly redact: (kit: ContentRedactKit) => Option.Option<ContentNode>;
}

/**
 * Bind a module's steps to one of its element's nodes.
 *
 * @template E The element.
 * @param node The node.
 * @returns The module's steps, each on the node.
 */
const stepsOf = <E extends BodyContentElement>(
  node: ContentNodeOf<E, NodeOf<BodyModules[E]>>,
): ContentSteps<E> => {
  const module = steppedBody[node.element];

  return {
    copy: (kit) => ({
      element: node.element,
      kind: "content",
      payload: module.copy(node.node, kit),
    }),
    redact: (kit) => Option.map(module.redact(node.node, kit), (kept) => ({ ...node, node: kept })),
  };
};

/**
 * Give a content node's steps, by its element's module: one case per element, each binding the
 * node at its own element, so the node {@link ContentSteps.redact} keeps and the payload node
 * {@link ContentSteps.copy} gives are the members of its element; no case names a module's fields.
 *
 * @param node The content node.
 * @returns Its module's steps, bound to it.
 */
export const contentSteps = (node: ContentNode): AnyContentSteps => {
  switch (node.element) {
    case anyElement: {
      return stepsOf(node);
    }
    case "math": {
      return stepsOf(node);
    }
    case "qti-feedback-block": {
      return stepsOf(node);
    }
    case "qti-feedback-inline": {
      return stepsOf(node);
    }
    case "qti-rubric-block": {
      return stepsOf(node);
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * Render a content payload node through its module's render.
 *
 * @template E The node's element.
 * @param node The payload node, as the payload holds it.
 * @param state The render's emit state.
 * @param kit The render kit: the emission of its content, the supports and the view.
 * @returns The element the module writes, or the refusal of a part swap.
 */
export const renderContent = <E extends BodyContentElement>(
  node: ContentPayloadOf<E, PayloadOf<BodyModules[E]>>,
  state: EmitState,
  kit: ContentRenderKit,
): Result.Result<Element, PartSwapRefused> =>
  steppedBody[node.element].render(node.payload, state, kit);

/**
 * Give the payload nodes a content payload node writes as content, through its module's
 * `content`, so the heading shift reads them.
 *
 * @template E The node's element.
 * @param node The payload node.
 * @returns The nodes its module's render writes as content, in document order.
 */
export const contentNodes = <E extends BodyContentElement>(
  node: ContentPayloadOf<E, PayloadOf<BodyModules[E]>>,
): readonly PayloadNode[] => steppedBody[node.element].content(node.payload);

/**
 * The nodes of one element an item-placed module reads, as a hub writes them.
 *
 * @template E The element.
 * @template V The node written.
 */
type Held<E extends ItemContentElement, V> = { [X in E]?: V[] };

/**
 * The model nodes the redaction accumulates, by element, each element's as its own module declares
 * them: typed per element key, so a module's node type reaches no other element's member, and the
 * accumulator is an `ItemNodesHeld` once written.
 */
type HeldNodes = { -readonly [E in ItemContentElement]?: NodeOf<ItemModules[E]>[] };

/**
 * The payload nodes the payload accumulates, by element, each element's as its own module's `copy`
 * gives them.
 */
type HeldPayloads = { -readonly [E in ItemContentElement]?: PayloadOf<ItemModules[E]>[] };

/**
 * Decide what the redacted item keeps of the nodes an item-placed module read from one element,
 * through its `redact`, writing the kept nodes under the element when any is kept.
 *
 * @template E The element.
 * @param element The element.
 * @param content The item's content.
 * @param kept The redacted content being written.
 * @param kit The redaction's walk and this render's facts.
 */
const redactElement = <E extends ItemContentElement>(
  element: E,
  content: { readonly [X in E]?: readonly NodeOf<ItemModules[X]>[] },
  kept: Held<E, NodeOf<ItemModules[E]>>,
  kit: ContentRedactKit,
): void => {
  const module = steppedItem[element];
  const nodes: NodeOf<ItemModules[E]>[] = [];
  for (const node of content[element] ?? []) {
    const decided = module.redact(node, kit);
    if (Option.isSome(decided)) {
      nodes.push(decided.value);
    }
  }

  if (nodes.length > 0) {
    kept[element] = nodes;
  }
};

/**
 * Decide what the redacted item keeps of the nodes the item-placed modules read, each node
 * through its module's `redact`, in the modules' order and each element's in document order.
 *
 * @param content The item's content, absent when the modules read no node.
 * @param kit The redaction's walk and this render's facts.
 * @returns The content kept, by element; none when nothing is kept.
 */
export const redactItemContent = (
  content: ItemNodesHeld | undefined,
  kit: ContentRedactKit,
): Option.Option<ItemNodesHeld> => {
  if (content === undefined) {
    return Option.none();
  }

  const kept: HeldNodes = {};
  for (const module of Object.values(itemModules)) {
    redactElement(module.element, content, kept, kit);
  }

  return Object.keys(kept).length === 0 ? Option.none() : Option.some(kept);
};

/**
 * Copy the nodes an item-placed module read from one element into their payload nodes, through
 * its `copy`.
 *
 * @template E The element.
 * @param element The element.
 * @param content The redacted item's content.
 * @param copied The payload content being written.
 * @param kit The payload's copy of body nodes.
 */
const copyElement = <E extends ItemContentElement>(
  element: E,
  content: { readonly [X in E]?: readonly NodeOf<ItemModules[X]>[] },
  copied: Held<E, PayloadOf<ItemModules[E]>>,
  kit: ContentCopyKit,
): void => {
  const module = steppedItem[element];
  const nodes = content[element];
  if (nodes !== undefined && nodes.length > 0) {
    copied[element] = nodes.map((node) => module.copy(node, kit));
  }
};

/**
 * Copy the content a redacted item holds into the payload's, each node through its module's
 * `copy`, in the modules' order and each element's in document order.
 *
 * @param content The redacted item's content, absent when it holds none.
 * @param kit The payload's copy of body nodes.
 * @returns The payload content, by element; none when the redacted item holds none.
 */
export const copyItemContent = (
  content: ItemNodesHeld | undefined,
  kit: ContentCopyKit,
): Option.Option<ItemPayloadsHeld> => {
  if (content === undefined) {
    return Option.none();
  }

  const copied: HeldPayloads = {};
  for (const module of Object.values(itemModules)) {
    copyElement(module.element, content, copied, kit);
  }

  return Object.keys(copied).length === 0 ? Option.none() : Option.some(copied);
};

/**
 * Render the payload nodes of one element an item-placed module read, through its `render`.
 *
 * @template E The element.
 * @param element The element.
 * @param content The payload's content.
 * @param state The render's emit state.
 * @param kit The render kit.
 * @returns The elements the module writes, in order, or the first refusal of a part swap.
 */
const renderElement = <E extends ItemContentElement>(
  element: E,
  content: { readonly [X in E]?: readonly PayloadOf<ItemModules[X]>[] },
  state: EmitState,
  kit: ContentRenderKit,
): Result.Result<readonly Element[], PartSwapRefused> =>
  Result.all((content[element] ?? []).map((node) => steppedItem[element].render(node, state, kit)));

/**
 * Render the content a payload holds of the item-placed modules' elements, each node through its
 * module's render, in the modules' order and each element's in document order: what the item Root
 * holds after the body.
 *
 * @param content The payload's content, absent when it holds none.
 * @param state The render's emit state.
 * @param kit The render kit.
 * @returns The elements the modules write, in order, or the first refusal of a part swap.
 */
export const renderItemContent = (
  content: ItemPayloadsHeld | undefined,
  state: EmitState,
  kit: ContentRenderKit,
): Result.Result<readonly Element[], PartSwapRefused> =>
  content === undefined
    ? Result.succeed([])
    : Result.map(
        Result.all(
          Object.values(itemModules).map((module) =>
            renderElement(module.element, content, state, kit),
          ),
        ),
        (rendered) => rendered.flat(),
      );

/**
 * Judge an island of a namespace outside QTI's for the verdict, through the `check` of the module
 * that owns the namespace: the reasons plate cannot judge the document for it, none when no module
 * owns the namespace or the owner judges the island itself.
 *
 * @param island The island's outermost element.
 * @param path The element's path.
 * @returns The reasons the document stays unchecked, each at the island's path.
 */
export const checkIsland = (island: SourceElement, path: string): readonly UncheckedReason[] =>
  contentModules.flatMap((module) =>
    module.namespace === island.namespace && module.check !== undefined
      ? module.check(island, path)
      : [],
  );
