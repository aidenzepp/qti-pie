import { readdirSync } from "node:fs";
import { assert, describe, it, vi } from "@effect/vitest";
import { Array as Arr, Effect, Option, Predicate, Result, pipe } from "effect";
import { configure } from "#plate/configuration.ts";
import { attr, doc, el, qtiNamespace, text } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import type { OwnedElements } from "#plate/emit/body.ts";
import { h } from "#plate/emit/node.ts";
import type { Attributes, PartFunction } from "#plate/emit/node.ts";
import { resolveOverrides } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import { NotImplemented, isModuleKind, partRow } from "#plate/interactions/contract.ts";
import type {
  FeatureId,
  InteractionModule,
  ModuleInteraction,
  ModuleKind,
  ParseContext,
  PartSpec,
  RedactKit,
} from "#plate/interactions/contract.ts";
import { modules as moduleTable } from "#plate/model/interactions.ts";
import type {
  ModelOf,
  ModelOfIn,
  ModuleTable,
  PayloadOfIn,
  SteppedIn,
} from "#plate/model/interactions.ts";
import { parseContextOf } from "#plate/model/item.ts";
import type { BodyNode, Interaction, Unsupported } from "#plate/model/item.ts";
import { format, isRecordValue } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type {
  ElementPayload,
  EmitState,
  Payload,
  PayloadNode,
  UnnamedPosition,
  View,
} from "#plate/payload.ts";
import { baseTypes } from "#plate/vocabulary.ts";
import type { BaseType } from "#plate/vocabulary.ts";

/**
 * A parse context and the features its notices named, in order.
 */
interface Recording {
  readonly context: ParseContext;
  readonly noticed: string[];
}

/**
 * An interaction module as this test reads it, its kind's types erased: its model node the fields
 * every module's node shares, its payload node any node that names its response, so a step of one
 * that is not implemented can be handed a placeholder node it never reads.
 */
type AnyModule = InteractionModule<
  ModuleKind,
  ModuleInteraction<ModuleKind>,
  { readonly response: string },
  string,
  unknown
>;

/**
 * The Appendix A feature each module kind declares, whether or not its module is implemented: it
 * does not change when the module lands.
 */
const features = {
  associate: "Q-1",
  drawing: "Q-3",
  "end-attempt": "Q-4",
  "gap-match": "Q-6",
  "graphic-associate": "Q-7",
  "graphic-gap-match": "Q-8",
  "graphic-order": "Q-9",
  hotspot: "Q-10",
  hottext: "Q-11",
  match: "Q-13",
  media: "Q-14",
  order: "Q-15",
  "portable-custom": "Q-16",
  "position-object": "Q-17",
  "select-point": "Q-18",
  slider: "Q-19",
  upload: "Q-21",
} as const satisfies { readonly [K in ModuleKind]: FeatureId };

/**
 * Tell whether an export is an interaction module: an object naming its kind and element and
 * saying whether it is implemented.
 *
 * @param value The export.
 * @returns Whether it is an interaction module.
 */
const isInteractionModule = (value: unknown): value is AnyModule =>
  Predicate.isObject(value) &&
  Predicate.isString(value["kind"]) &&
  Predicate.isString(value["element"]) &&
  Predicate.isBoolean(value["implemented"]);

/**
 * Read the interaction modules one file exports.
 *
 * @param file The file's name in `src/interactions/`.
 * @returns Each interaction module it exports.
 */
const modulesIn = async (file: string): Promise<readonly AnyModule[]> => {
  const specifier = `#plate/interactions/${file}`;
  const loaded: unknown = await import(specifier);

  return Predicate.isObject(loaded) ? Object.values(loaded).filter(isInteractionModule) : [];
};

/**
 * The interaction modules each file of `src/interactions/` beside this test exports, in file
 * order.
 */
const foundPerFile = await Promise.all(
  readdirSync(new URL("./", import.meta.url))
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts") && file !== "contract.ts")
    .toSorted()
    .map(modulesIn),
);

/**
 * Every interaction module, read from the files of `src/interactions/` beside this test, in file
 * order: each module that lands is found here as it is, so no case names one.
 */
const modules: readonly AnyModule[] = foundPerFile.flat();

/**
 * The interaction modules that are not implemented, each a stub whose `parse` gives the notice.
 */
const stubs = modules.filter((module) => !module.implemented);

/**
 * Construct a QTI interaction element with no attributes and no children.
 *
 * @param local The element's local name.
 * @returns The element.
 */
const elementNamed = (local: string): SourceElement => ({
  attributes: [],
  children: [],
  kind: "element",
  local,
  namespace: qtiNamespace,
});

/**
 * Construct a node of a module's kind with the fields every module's node shares, which no hub
 * ever hands a stub: a stub's steps throw before they read it.
 *
 * @param module The module.
 * @returns The node.
 */
const placeholderOf = (module: AnyModule): ModuleInteraction<ModuleKind> => ({
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  kind: module.kind,
  path: `qti-assessment-item/qti-item-body/${module.element}`,
  response: "RESPONSE",
});

/**
 * The redact kit a stub's `redact` is handed, which it never reads: it throws first.
 */
const noCopy: RedactKit = {
  autofocus: false,
  formName: (response) => response,
  instance: "",
  nodes: () => [],
  posted: () => Option.none(),
  seed: Option.none(),
  shown: () => [],
  unnamed: Option.none(),
};

/**
 * Construct an item document whose body holds one element.
 *
 * @param element The element.
 * @returns The document at `items/test.xml`.
 */
const itemAround = (element: SourceElement): SourceDocument =>
  doc(
    "items/test.xml",
    el(
      "qti-assessment-item",
      [attr("identifier", "item"), attr("title", "Item")],
      [el("qti-item-body", [], [element])],
    ),
  );

/**
 * Construct the parse context the body walk hands a module for one element of an item body, its
 * notice recording every feature it is asked for.
 *
 * @param element The element, placed alone in an item body.
 * @returns The context and the features its notices named.
 */
const recording = (element: SourceElement): Recording => {
  const noticed: string[] = [];
  const { context } = parseContextOf(itemAround(element), element);

  return {
    context: {
      ...context,
      notice: (feature) => {
        noticed.push(feature);

        return Result.succeed({ feature, kind: "unsupported", path: context.path });
      },
    },
    noticed,
  };
};

/**
 * Run one step of a stub and give the feature of the {@link NotImplemented} it threw.
 *
 * @param step The step.
 * @returns The feature, or none when the step returned or threw anything else.
 */
const notImplementedBy = (step: () => void): Option.Option<string> => {
  const ran = Result.try({ catch: (thrown) => thrown, try: step });

  return Result.isFailure(ran) && ran.failure instanceof NotImplemented
    ? Option.some(ran.failure.feature)
    : Option.none();
};

describe("the interaction modules", () => {
  it("are seventeen, one per module kind", () => {
    const kinds = modules.map((module) => module.kind);

    assert.strictEqual(modules.length, 17);
    assert.strictEqual(new Set(kinds).size, 17);
    assert.isTrue(kinds.every(isModuleKind));
  });

  it("declare each kind's Appendix A feature, owner and QTI element name", () => {
    for (const module of modules) {
      assert.strictEqual(module.feature, features[module.kind], module.kind);
      assert.strictEqual(module.owner, `${module.kind}-interaction`, module.kind);
      assert.strictEqual(module.element, `qti-${module.kind}-interaction`, module.kind);
    }
  });
});

describe("an interaction module not implemented", () => {
  it("holds no part row", () => {
    for (const module of stubs) {
      assert.deepStrictEqual(Object.keys(module.parts), [], module.kind);
    }
  });

  it("parses its element as the unsupported node naming it, recorded once, as any unknown QTI element is", () => {
    for (const module of stubs) {
      const path = `qti-assessment-item/qti-item-body/${module.element}`;
      const element = elementNamed(module.element);
      const { context, noticed } = recording(element);
      const unsupported: Unsupported = { feature: module.element, kind: "unsupported", path };

      assert.strictEqual(context.path, path, module.kind);
      assert.deepStrictEqual(
        module.parse(element, context),
        Result.succeed(unsupported),
        module.kind,
      );
      assert.deepStrictEqual(noticed, [module.element], module.kind);
    }
  });

  it.effect("throws NotImplemented, naming the feature, from every step past parse", () =>
    Effect.gen(function* everyStep() {
      const configuration = yield* configure({});
      const payload: Payload = {
        body: [],
        finished: false,
        instance: "q1",
        lang: "en",
        messages: [],
        mode: "answering",
        notices: [],
        title: "",
      };
      const state: EmitState = {
        assetBase: "",
        headingLevel: 1,
        locale: configuration.locale,
        parts: yield* Effect.fromResult(resolveOverrides()),
      };
      const value: Value = { baseType: "identifier", cardinality: "single", values: [] };

      for (const module of stubs) {
        const node = placeholderOf(module);
        const steps: readonly (readonly [string, () => void])[] = [
          [
            "bindings",
            () => {
              module.bindings(node);
            },
          ],
          [
            "connect",
            () => {
              module.connect(node, payload, configuration.locale);
            },
          ],
          [
            "controls",
            () => {
              module.controls(node);
            },
          ],
          [
            "nullValue",
            () => {
              module.nullValue(node);
            },
          ],
          [
            "redact",
            () => {
              module.redact(node, noCopy);
            },
          ],
          [
            "render",
            () => {
              module.render(node, payload, state);
            },
          ],
          [
            "restore",
            () => {
              module.restore(node, value);
            },
          ],
          [
            "sequence",
            () => {
              module.sequence(node, Option.none(), "q1");
            },
          ],
          [
            "solution",
            () => {
              module.solution(node, value);
            },
          ],
          [
            "unnamed",
            () => {
              module.unnamed(node, true);
            },
          ],
          [
            "validate",
            () => {
              module.validate(node, value, configuration);
            },
          ],
        ];

        for (const [name, step] of steps) {
          assert.deepStrictEqual(
            notImplementedBy(step),
            Option.some(module.feature),
            `${module.kind} ${name}`,
          );
        }
      }
    }),
  );
});

/**
 * The kind the landed fake stands in for: one whose module is still a stub, the last to land, so a
 * real module that lands never meets it. The fake keeps the shape of a Gap Match (gap texts, gaps)
 * whatever the kind, and everything that names the kind reads it from here, so a real module of
 * this kind lands by changing this one line.
 */
const landedKind = "select-point" as const;

/**
 * The module file the fake takes the place of, and the name that file exports its module by.
 */
const landedFile = `#plate/interactions/${landedKind}.ts`;

/**
 * One gap text of {@link landedGapMatch}'s model node: a `qti-gap-text`, content it holds beyond
 * its Prompt, read through the kit's body walk.
 */
interface LandedGapText {
  readonly content: readonly BodyNode[];
  readonly identifier: string;
}

/**
 * The model node of {@link landedGapMatch}: the fields every module's node shares, and Gap Match's
 * own, which no placeholder holds: its Prompt, its gap texts, its gapped content with the
 * identifier of each `qti-gap` in it, `max-associations`, and the base type of the declaration it
 * binds.
 */
interface LandedModel extends ModuleInteraction<typeof landedKind> {
  readonly baseType: Option.Option<BaseType>;
  readonly class: string;
  readonly gapTexts: readonly LandedGapText[];
  readonly gapped: readonly BodyNode[];
  readonly gaps: readonly string[];
  readonly maxAssociations: bigint;
  readonly prompt: Option.Option<readonly BodyNode[]>;
}

/**
 * The payload node of {@link landedGapMatch}: what its `redact` copies of the model node, its
 * gapped content among it, which its render writes through `emitNodes`, and what it reads of the
 * view through the kit: the name its hidden inputs post under, the texts they restore (the posted
 * strings when the view has messages, else the shown pairs), and the other facts the kit carries,
 * each copied so a test reads what the kit handed the module.
 */
interface LandedPayload {
  readonly autofocus: boolean;
  readonly class: string;
  readonly content: readonly PayloadNode[];
  readonly formName: string;
  readonly gaps: readonly string[];
  readonly instance: string;
  readonly posted: Option.Option<readonly string[]>;
  readonly response: string;
  readonly restore: readonly string[];
  readonly seed: Option.Option<string>;
  readonly shown: readonly string[];
  readonly unnamed: Option.Option<UnnamedPosition>;
}

/**
 * The owner of every part of {@link landedGapMatch}.
 */
const landedOwner = `${landedKind}-interaction` as const;

/**
 * The parts of {@link landedGapMatch} that `partRow` places: a Root, and a part whose key is in
 * camel case, so its marker shows the kebab case `partRow` derives.
 */
const landedParts = {
  itemButton: {
    defaults: { type: "button" },
    element: "button",
    listOwner: false,
    merged: [],
    tagClass: "button",
  },
  root: {
    defaults: {},
    element: "div",
    legendOwner: true,
    listOwner: false,
    merged: ["class"],
    tagClass: "flow-container",
  },
} as const satisfies { readonly [Q in "itemButton" | "root"]: PartSpec };

/**
 * Every part of {@link landedGapMatch}: {@link landedParts} and a Gap, a part no shipped kind has,
 * which a host overrides by `parts[landedOwner].gap`, and which the module's render
 * places for each `qti-gap` of its gapped content.
 */
const landedAllParts = {
  ...landedParts,
  gap: {
    defaults: {},
    element: "span",
    listOwner: false,
    merged: [],
    tagClass: "phrasing-container",
  },
} as const satisfies { readonly [Q in "gap" | "itemButton" | "root"]: PartSpec };

/**
 * Collect the identifier of every `qti-gap` among body nodes, in document order, below elements:
 * the module-owned elements the kit's body walk let through as elements.
 *
 * @param nodes The gapped content.
 * @returns The gaps' identifiers.
 */
const gapsIn = (nodes: readonly BodyNode[]): readonly string[] =>
  nodes.flatMap((node) => {
    if (node.kind !== "element") {
      return [];
    }

    return node.tag === "qti-gap"
      ? node.attributes.flatMap(({ name, value }) => (name === "identifier" ? [value] : []))
      : gapsIn(node.children);
  });

/**
 * Read the identifier a `qti-gap` carries, as its payload element holds it.
 *
 * @param element The gap's payload element.
 * @returns Its `identifier`, empty when it carries none.
 */
const gapIdentifier = (element: ElementPayload): string =>
  element.attributes.find(({ name }) => name === "identifier")?.value ?? "";

/**
 * Render a `qti-gap` of {@link landedGapMatch}'s gapped content as a Gap, a `span` marked as the
 * module's Gap part and named by the gap's identifier; any other element is not the module's. The
 * Gap is written without `applyPart`: the part table types a part key from the parts the modules
 * declare, and this module's parts live in this test alone.
 *
 * @param element An element of the module's content outside the HTML subset.
 * @returns The Gap, or none for an element the module does not own.
 */
const landedGap: OwnedElements = (element) =>
  element.tag === "qti-gap"
    ? Option.some(
        Result.succeed([
          h("span", { "data-gap": gapIdentifier(element), "data-slot": `${landedOwner}-gap` }, []),
        ]),
      )
    : Option.none();

/**
 * A Gap Match module as one that has landed would be: implemented, with its own model node, payload
 * node, JSON form and parts, in this file only. Its `parse` reads the element through the kit the
 * body walk hands it: the bound declaration's base type, the Prompt and each gap text's content
 * through the body walk, the gapped content with `qti-gap` let through as the module's own
 * element, and `shuffle` recorded as a mark. The tests type it against the hubs through the table
 * ({@link landedTable}) and run it in place of the stub through `vi.doMock`.
 */
const landedGapMatch: InteractionModule<
  typeof landedKind,
  LandedModel,
  LandedPayload,
  "gap" | "itemButton" | "root",
  unknown
> = {
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  connect: () => ({}),
  content: (interaction) => interaction.content,
  controls: () => 1,
  element: `qti-${landedKind}-interaction`,
  feature: features[landedKind],
  implemented: true,
  kind: landedKind,
  nullValue: () => ({ baseType: "identifier", cardinality: "single", values: [] }),
  owner: landedOwner,
  parse: (element, { read }) =>
    Result.gen(function* readGapMatch() {
      read.markElement(element);
      if (Option.isSome(read.valueOf(element, "shuffle"))) {
        read.mark(element, "shuffle");
      }

      const response = yield* read.identifierAttribute(element, "response-identifier");
      const maxAssociations = yield* read.countAttribute(element, "max-associations");
      const prompt = yield* read.content(element, "qti-prompt");
      const gapTexts: LandedGapText[] = [];
      for (const gapText of read.childrenNamed(element, "qti-gap-text")) {
        gapTexts.push({
          content: yield* read.nodes(gapText),
          identifier: yield* read.identifierAttribute(gapText, "identifier"),
        });
      }

      const gapped = yield* read.nodes(element, {
        children: element.children.filter(
          (child) =>
            !(
              child.kind === "element" &&
              (read.isQti(child, "qti-prompt") || read.isQti(child, "qti-gap-text"))
            ),
        ),
        own: ["qti-gap"],
      });

      return {
        ariaLabel: read.valueOf(element, "aria-label"),
        ariaLabelledby: read.valueOf(element, "aria-labelledby"),
        baseType: read.bound.pipe(Option.flatMap((bound) => bound.baseType)),
        class: Option.getOrElse(read.valueOf(element, "class"), () => ""),
        gapTexts,
        gapped,
        gaps: gapsIn(gapped),
        kind: landedKind,
        maxAssociations: Option.getOrElse(maxAssociations, () => 1n),
        path: read.pathOf(element),
        prompt,
        response,
      };
    }),
  parts: landedAllParts,
  payloadSchema: ({ BodyNodes, Count, NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      baseType: Schema.OptionFromOptionalKey(Schema.Literals(baseTypes)),
      class: Schema.String,
      gapTexts: Schema.Array(Schema.Struct({ content: BodyNodes, identifier: Schema.String })),
      gapped: BodyNodes,
      gaps: Schema.Array(Schema.String),
      kind: Schema.Literal(landedKind),
      maxAssociations: Count,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
    }),
  redact: (interaction, kit) => {
    const posted = kit.posted(interaction.response);
    const shown = kit.shown(interaction.response).map(format);

    return {
      autofocus: kit.autofocus,
      class: interaction.class,
      content: kit.nodes(interaction.gapped),
      formName: kit.formName(interaction.response),
      gaps: interaction.gaps,
      instance: kit.instance,
      posted,
      response: interaction.response,
      restore: Option.getOrElse(posted, () => shown),
      seed: kit.seed,
      shown,
      unnamed: kit.unnamed,
    };
  },
  regions: (interaction) => [
    ...Option.match(interaction.prompt, {
      onNone: () => [],
      onSome: (nodes) => [
        { choice: Option.none(), nodes, part: "prompt" as const, written: "nodes" as const },
      ],
    }),
    ...interaction.gapTexts.map((gapText) => ({
      choice: Option.some(gapText.identifier),
      nodes: gapText.content,
      part: "choice" as const,
      written: "nodes" as const,
    })),
    {
      choice: Option.none(),
      nodes: interaction.gapped,
      part: "content" as const,
      written: "nodes" as const,
    },
  ],
  render: (interaction, payload, state) => {
    const row = partRow({ owner: landedOwner, parts: landedParts }, "root");

    return Result.gen(function* landedRoot() {
      const content = yield* emitNodes(
        interaction.content,
        payload,
        state,
        nestedInteraction(landedOwner, landedGap),
      );

      return yield* applyPart(
        row,
        { class: interaction.class, "data-response": interaction.response, "data-slot": row.slot },
        [
          ...content,
          ...interaction.restore.map((value) =>
            h("input", { name: interaction.formName, type: "hidden", value }),
          ),
        ],
      );
    });
  },
  replaceRegions: (interaction, contents) => {
    const [first, ...rest] = contents;
    const prompt = pipe(
      interaction.prompt,
      Option.map((nodes) => first ?? nodes),
    );
    const after = Option.isSome(interaction.prompt) ? rest : contents;
    const gapped = after[interaction.gapTexts.length] ?? interaction.gapped;

    return {
      ...interaction,
      gapTexts: interaction.gapTexts.map((gapText, index) => ({
        ...gapText,
        content: after[index] ?? gapText.content,
      })),
      gapped,
      gaps: gapsIn(gapped),
      prompt,
    };
  },
  /**
   * The pairs in the order the gaps show them, the reverse of the stored order: a transform a test
   * sees in the kit, so a hub that skipped this step is told apart from one that reached it.
   */
  restore: (_interaction, stored) =>
    isRecordValue(stored) ? stored : { ...stored, values: stored.values.toReversed() },
  sequence: () => Option.none(),
  /**
   * The first association alone, as a test sees that a hub reached this step.
   */
  solution: (_interaction, correct) =>
    isRecordValue(correct) ? correct : { ...correct, values: correct.values.slice(0, 1) },
  unnamed: () => false,
  validate: () => [],
};

/**
 * The table of modules with {@link landedGapMatch} in place of the stub of its kind: what the hubs
 * read, so `tsc` types the landed module against them here, with no hub edited and no `vi.doMock`
 * hiding it.
 */
const landedTable = { ...moduleTable, [landedKind]: landedGapMatch } satisfies ModuleTable;

/**
 * The module table as {@link landedGapMatch} changes it.
 */
type LandedTable = typeof landedTable;

/**
 * Whether two types are identical, by the one check `tsc` makes on a generic signature: `true` only
 * when `A` and `B` are the same type, so an `Equals` of two types that differ in one field refuses
 * the line that reads `true`.
 *
 * @template A One type.
 * @template B The other.
 */
type Equals<A, B> =
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- each `T` must stay an unresolved type parameter inside its function type, so the conditional compares `A` and `B` by identity rather than by assignability.
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * The hubs read a module's model node from the table: with the landed module in it, Gap Match's
 * model is the module's own, every field included. `tsc` refuses this line when a hub type stops
 * deriving from the table.
 */
const modelDerived: Equals<ModelOfIn<LandedTable, typeof landedKind>, LandedModel> = true;

/**
 * The hubs read a module's payload node from the table the same way.
 */
const payloadDerived: Equals<PayloadOfIn<LandedTable, typeof landedKind>, LandedPayload> = true;

/**
 * The item model's union of module nodes derives from the table too: the model node of a kind is
 * the one its module declares, so `item.ts` holds no placeholder a module's own fields could
 * disagree with. `tsc` refuses this line when the item model names a kind's node on its own.
 */
const itemDerived: Equals<
  Extract<Interaction, { readonly kind: typeof landedKind }>,
  ModelOf<typeof landedKind>
> = true;

/**
 * The steps the hubs call, typed by the table that holds the landed module: the check
 * `#plate/model/interactions.ts` makes of its own table, made here of {@link landedTable}, so a
 * landed module's own model and payload types are what every hub hands its steps.
 */
const landedSteps: SteppedIn<LandedTable> = landedTable;

/**
 * Run an effect with {@link landedGapMatch} registered in place of the stub of its kind, every
 * module it imports loaded afresh, and the stub restored after.
 *
 * @param effect The effect, which imports what it reads of plate dynamically, after the mock.
 * @returns The effect, wrapped.
 */
const withLanded = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
  Effect.sync(() => {
    vi.resetModules();
    vi.doMock(landedFile, () => ({ selectPointModule: landedGapMatch }));
  }).pipe(
    Effect.andThen(effect),
    Effect.ensuring(
      Effect.sync(() => {
        vi.doUnmock(landedFile);
        vi.resetModules();
      }),
    ),
  );

/**
 * The JSON form of a redacted item whose body holds one Gap Match, as a host hands it over.
 */
const landedJson = {
  body: [
    { kind: "text", text: "Fill the gaps: " },
    {
      class: "gaps",
      gapTexts: [{ content: [{ kind: "text", text: "cat" }], identifier: "G1" }],
      gapped: [],
      gaps: [],
      kind: landedKind,
      maxAssociations: "1",
      response: "RESPONSE",
    },
  ],
  document: "item.xml",
  identifier: "landed",
  notices: [],
  responses: [{ baseType: "identifier", cardinality: "single", identifier: "RESPONSE" }],
  title: "Landed",
};

/**
 * An item whose body holds one Gap Match the landed module reads: bound to a multiple directed-pair
 * response whose correct response fills both gaps with `W`, shuffled, with a Prompt, one gap text,
 * and a paragraph with two gaps.
 */
const landedDocument = doc(
  "items/landed.xml",
  el(
    "qti-assessment-item",
    [attr("identifier", "landed"), attr("title", "Landed")],
    [
      el(
        "qti-response-declaration",
        [
          attr("base-type", "directedPair"),
          attr("cardinality", "multiple"),
          attr("identifier", "RESPONSE"),
        ],
        [
          el(
            "qti-correct-response",
            [],
            [el("qti-value", [], [text("W G1")]), el("qti-value", [], [text("W G2")])],
          ),
        ],
      ),
      el(
        "qti-item-body",
        [],
        [
          el(
            `qti-${landedKind}-interaction`,
            [
              attr("max-associations", "2"),
              attr("response-identifier", "RESPONSE"),
              attr("shuffle", "true"),
            ],
            [
              el("qti-prompt", [], [text("Fill "), el("em", [], [text("the")]), text(" gaps")]),
              el("qti-gap-text", [attr("identifier", "W")], [text("winter")]),
              el(
                "p",
                [],
                [
                  text("It was "),
                  el("qti-gap", [attr("identifier", "G1")]),
                  text(" and "),
                  el("qti-gap", [attr("identifier", "G2")]),
                  text("."),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  ),
);

/**
 * A host's replacement for a part: the part as a `span`.
 *
 * @param props The part's attributes.
 * @param children The part's children.
 * @returns The `span`.
 */
const replacement: PartFunction<Attributes> = (props, children) => h("span", props, children);

/**
 * Give a text node of the model.
 *
 * @param value The text.
 * @returns The node.
 */
const textNode = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * Tell whether a body node is the landed Gap Match's model node: the one the mocked module's
 * `parse` gives, which the module table's types, read from the stub, cannot name.
 *
 * @param node A body node.
 * @returns Whether it is a Gap Match with the landed module's gap texts.
 */
const isLandedModel = (node: BodyNode): node is LandedModel =>
  node.kind === landedKind && "gapTexts" in node;

/**
 * Tell whether a value is the landed Gap Match's payload node at its kind, by the field no stub's
 * node and no shipped kind's payload holds under that kind.
 *
 * @param value A payload node, its type erased.
 * @returns Whether it holds the landed payload node.
 */
const isLandedPayloadNode = (
  value: unknown,
): value is { readonly kind: typeof landedKind; readonly payload: LandedPayload } =>
  Predicate.isObject(value) &&
  value["kind"] === landedKind &&
  Predicate.isObject(value["payload"]) &&
  Predicate.isString(value["payload"]["formName"]);

/**
 * Give the landed Gap Match's payload node a payload node holds: the one the mocked module's
 * `redact` gives, at its kind, which the module table's types, read from the stub, cannot name.
 *
 * @param node A payload node.
 * @returns The landed payload node, none for any other node.
 */
const landedPayloadOf = (node: PayloadNode): Option.Option<LandedPayload> => {
  const candidate: unknown = node;

  return isLandedPayloadNode(candidate) ? Option.some(candidate.payload) : Option.none();
};

/**
 * Give a multiple directed-pair value of pairs, each written as `source target`.
 *
 * @param pairs The pairs, in stored order.
 * @returns The value.
 */
const pairsValue = (...pairs: readonly (readonly [string, string])[]): Value => ({
  baseType: "directedPair",
  cardinality: "multiple",
  values: pairs.map((value) => ({ baseType: "directedPair", value })),
});

/**
 * The name the host chose for the landed Gap Match's response to post under.
 */
const hostName = "answer-1";

describe("a module that lands", () => {
  it("types its own model and payload nodes into every hub through the module table", () => {
    assert.isTrue(modelDerived);
    assert.isTrue(payloadDerived);
    assert.isTrue(itemDerived);
    assert.strictEqual(landedSteps[landedKind], landedGapMatch);
  });

  it.effect(
    "parses its element through the kit: the bound declaration, the Prompt and content through the body walk, its own qti-gap let through, and a mark recorded",
    () =>
      withLanded(
        Effect.gen(function* parsed() {
          const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
          const built = yield* Effect.fromResult(model.buildItem(landedDocument));
          const [node] = built.body;
          const path = `qti-assessment-item/qti-item-body/qti-${landedKind}-interaction`;

          assert.isDefined(node);
          if (node === undefined || !isLandedModel(node)) {
            assert.fail(`the body holds a ${node?.kind ?? "nothing"}, not the landed Gap Match`);
          }

          const landed: LandedModel = node;

          assert.deepStrictEqual(landed.baseType, Option.some("directedPair"));
          assert.strictEqual(landed.maxAssociations, 2n);
          assert.strictEqual(landed.path, path);
          assert.strictEqual(landed.response, "RESPONSE");
          assert.deepStrictEqual(
            landed.prompt,
            Option.some([
              textNode("Fill "),
              {
                attributes: [],
                children: [textNode("the")],
                kind: "element",
                path: `${path}/qti-prompt/em`,
                tag: "em",
              },
              textNode(" gaps"),
            ]),
          );
          assert.deepStrictEqual(landed.gapTexts, [
            { content: [textNode("winter")], identifier: "W" },
          ]);
          assert.deepStrictEqual(landed.gaps, ["G1", "G2"]);
          assert.deepStrictEqual(landed.gapped, [
            {
              attributes: [],
              children: [
                textNode("It was "),
                {
                  attributes: [{ name: "identifier", value: "G1" }],
                  children: [],
                  kind: "element",
                  path: `${path}/p/qti-gap[1]`,
                  tag: "qti-gap",
                },
                textNode(" and "),
                {
                  attributes: [{ name: "identifier", value: "G2" }],
                  children: [],
                  kind: "element",
                  path: `${path}/p/qti-gap[2]`,
                  tag: "qti-gap",
                },
                textNode("."),
              ],
              kind: "element",
              path: `${path}/p`,
              tag: "p",
            },
          ]);
          assert.deepStrictEqual(built.unsupported, [{ feature: "shuffle", path, shown: "mark" }]);
        }),
      ),
  );

  it.effect(
    "redacts its node through its own redact, its gapped content copied through the kit, and renders each qti-gap as its Gap part",
    () =>
      withLanded(
        Effect.gen(function* redacted() {
          const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
          const payload = yield* Effect.promise(() => import("#plate/payload.ts"));
          const plate = yield* Effect.promise(() => import("#plate/render.ts"));
          const configuration = yield* configure({});
          const built = yield* Effect.fromResult(model.buildItem(landedDocument));
          const redactedItem = payload.redactItem(built);
          const [node] = redactedItem.body;

          assert.isDefined(node);
          if (node?.kind !== landedKind) {
            assert.fail(`the body holds a ${node?.kind ?? "nothing"}, not the landed Gap Match`);
          }

          const { html } = yield* Effect.fromResult(
            plate.render(redactedItem, configuration, { instance: "q1" }),
          );

          assert.include(html, "It was ");
          assert.match(
            html,
            new RegExp(
              `<span [^>]*data-gap="G1"[^>]*data-slot="${landedOwner}-gap"[^>]*></span>`,
              "u",
            ),
          );
          assert.include(html, 'data-gap="G2"');
          assert.notInclude(html, "<qti-gap");
        }),
      ),
  );

  it.effect(
    "sees the view's response facts through the kit, its restore and solution reached by the hubs, and writes its hidden input under the host's name",
    () =>
      withLanded(
        Effect.gen(function* facts() {
          const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
          const records = yield* Effect.promise(() => import("#plate/model/record.ts"));
          const codec = yield* Effect.promise(() => import("#plate/codec/record.ts"));
          const verdict = yield* Effect.promise(() => import("#plate/validate/verdict.ts"));
          const restoring = yield* Effect.promise(() => import("#plate/restore.ts"));
          const solving = yield* Effect.promise(() => import("#plate/solution.ts"));
          const payload = yield* Effect.promise(() => import("#plate/payload.ts"));
          const plate = yield* Effect.promise(() => import("#plate/render.ts"));
          const configuration = yield* configure({ seed: "7" });
          const built = yield* Effect.fromResult(model.buildItem(landedDocument));
          const accepted = verdict.acceptForTest(built);
          const stored = yield* Effect.fromResult(
            codec.encodeRecord({
              ...records.fresh(built, "q1"),
              responses: { RESPONSE: pairsValue(["W", "G1"], ["W", "G2"]) },
            }),
          );
          const restored = yield* Effect.fromResult(restoring.restore(accepted, stored));

          // The hub handed the stored value to the module's `restore`, which reverses the pairs.
          assert.deepStrictEqual(restored.values, {
            RESPONSE: pairsValue(["W", "G2"], ["W", "G1"]),
          });
          // The hub handed the correct response to the module's `solution`, which keeps the first.
          assert.deepStrictEqual(solving.solution(accepted), {
            RESPONSE: pairsValue(["W", "G1"]),
          });

          const redactedItem = payload.redactItem(built);
          const view: View = {
            finished: false,
            instance: "q1",
            locale: configuration.locale,
            messages: [{ response: "RESPONSE", text: "Fill both gaps." }],
            mode: "answering",
            names: new Map([["RESPONSE", hostName]]),
            posted: Option.some(new Map([["RESPONSE", ["W G2"]]])),
            seed: "7",
            values: new Map(Object.entries(restored.values)),
          };
          const node = Arr.findFirst(payload.payload(redactedItem, view).body, landedPayloadOf);

          assert.deepStrictEqual(
            node.pipe(
              Option.map((landed) => ({
                autofocus: landed.autofocus,
                formName: landed.formName,
                instance: landed.instance,
                posted: landed.posted,
                restore: landed.restore,
                seed: landed.seed,
                shown: landed.shown,
                unnamed: landed.unnamed,
              })),
            ),
            Option.some({
              autofocus: true,
              formName: hostName,
              instance: "q1",
              posted: Option.some(["W G2"]),
              restore: ["W G2"],
              seed: Option.some("7"),
              shown: ["W G2", "W G1"],
              unnamed: Option.none(),
            }),
          );

          const { html } = yield* Effect.fromResult(
            plate.render(redactedItem, configuration, {
              instance: "q1",
              names: { RESPONSE: hostName },
              values: restored.values,
            }),
          );

          assert.match(
            html,
            /<input [^>]*name="answer-1"[^>]*type="hidden"[^>]*value="W G2"[^>]*><input [^>]*name="answer-1"[^>]*type="hidden"[^>]*value="W G1"[^>]*>/u,
          );
        }),
      ),
  );

  it.effect(
    "renders through render(), its node surviving encodeRedacted and decodeRedacted, with no hub edit",
    () =>
      withLanded(
        Effect.gen(function* landed() {
          const codec = yield* Effect.promise(() => import("#plate/codec/redacted.ts"));
          const plate = yield* Effect.promise(() => import("#plate/render.ts"));
          const configuration = yield* configure({});
          const decoded = yield* Effect.fromResult(codec.decodeRedacted(landedJson));
          const encoded = yield* Effect.fromResult(codec.encodeRedacted(decoded));

          assert.deepStrictEqual<unknown>(encoded, landedJson);

          const again = yield* Effect.fromResult(
            // oxlint-disable-next-line unicorn/prefer-structured-clone -- the round trip is the JSON a host sends to a page, which a structured clone does not take.
            codec.decodeRedacted(JSON.parse(JSON.stringify(encoded))),
          );
          const { html } = yield* Effect.fromResult(
            plate.render(again, configuration, { instance: "q1" }),
          );

          assert.include(html, "Fill the gaps: ");
          assert.match(html, new RegExp(`<div [^>]*data-slot="${landedOwner}"[^>]*>`, "u"));
          assert.include(html, 'data-response="RESPONSE"');
          assert.include(html, 'class="gaps"');
        }),
      ),
  );

  it.effect(
    "takes a host's override of its own part and names the part by its marker, with no part-table edit",
    () =>
      withLanded(
        Effect.gen(function* overridden() {
          yield* Effect.promise(() => import("#plate/model/interactions.ts"));

          const parts = yield* Effect.promise(() => import("#plate/emit/parts.ts"));
          const resolved = yield* Effect.fromResult(
            parts.resolveOverrides({ [landedOwner]: { gap: replacement } }),
          );
          const named = parts.partForSlot(`${landedOwner}-gap`);

          assert.deepStrictEqual<unknown>(
            named,
            Option.some({ interaction: landedOwner, part: "gap" }),
          );
          assert.strictEqual(
            Option.getOrUndefined(
              pipe(
                named,
                Option.flatMap(({ interaction, part }) =>
                  resolved.replacementFor(interaction, part),
                ),
              ),
            ),
            replacement,
          );
          assert.deepStrictEqual(
            Result.map(
              parts.resolveOverrides({ [landedOwner]: { gaps: replacement } }),
              () => "resolved",
            ),
            Result.fail(
              new parts.UnknownPart({
                interaction: landedOwner,
                part: Option.some("gaps"),
              }),
            ),
          );
        }),
      ),
  );

  it.effect("gives and maps the regions of its own content beyond the Prompt", () =>
    withLanded(
      Effect.gen(function* regions() {
        const interactions = yield* Effect.promise(() => import("#plate/model/interactions.ts"));
        const node: LandedModel = {
          ariaLabel: Option.none(),
          ariaLabelledby: Option.none(),
          baseType: Option.none(),
          class: "",
          gapTexts: [
            { content: [textNode("cat")], identifier: "G1" },
            { content: [textNode("dog")], identifier: "G2" },
          ],
          gapped: [textNode("gapped")],
          gaps: [],
          kind: landedKind,
          maxAssociations: 1n,
          path: `qti-assessment-item/qti-item-body/qti-${landedKind}-interaction`,
          prompt: Option.some([textNode("Fill")]),
          response: "RESPONSE",
        };
        const found = interactions.regionsOf(node);

        assert.deepStrictEqual(
          found.map(({ choice, nodes, part, written }) => ({ choice, nodes, part, written })),
          [
            { choice: Option.none(), nodes: [textNode("Fill")], part: "prompt", written: "nodes" },
            {
              choice: Option.some("G1"),
              nodes: [textNode("cat")],
              part: "choice",
              written: "nodes",
            },
            {
              choice: Option.some("G2"),
              nodes: [textNode("dog")],
              part: "choice",
              written: "nodes",
            },
            {
              choice: Option.none(),
              nodes: [textNode("gapped")],
              part: "content",
              written: "nodes",
            },
          ],
        );
        assert.isTrue(found.every((region) => region.owner === node));

        const seen: string[] = [];
        const mapped = interactions.mapRegions(node, (region) => {
          seen.push(Option.getOrElse(region.choice, () => region.part));

          return region.nodes.map((inner) =>
            inner.kind === "text" ? textNode(inner.text.toUpperCase()) : inner,
          );
        });

        assert.deepStrictEqual(seen, ["prompt", "G1", "G2", "content"]);
        assert.deepStrictEqual(
          interactions.regionsOf(mapped).map((region) => region.nodes),
          [[textNode("FILL")], [textNode("CAT")], [textNode("DOG")], [textNode("GAPPED")]],
        );
      }),
    ),
  );

  it.effect("counts the headings of its payload's content in the item's heading shift", () =>
    withLanded(
      Effect.gen(function* headings() {
        const codec = yield* Effect.promise(() => import("#plate/codec/redacted.ts"));
        const plate = yield* Effect.promise(() => import("#plate/render.ts"));
        const configuration = yield* configure({});
        const [first, interaction] = landedJson.body;
        const decoded = yield* Effect.fromResult(
          codec.decodeRedacted({
            ...landedJson,
            body: [
              first,
              {
                ...interaction,
                gapped: [
                  {
                    attributes: [],
                    children: [{ kind: "text", text: "Gaps" }],
                    kind: "element",
                    tag: "h2",
                  },
                ],
              },
              {
                attributes: [],
                children: [{ kind: "text", text: "Below" }],
                kind: "element",
                tag: "h3",
              },
            ],
          }),
        );
        const { html } = yield* Effect.fromResult(
          plate.render(decoded, configuration, { instance: "q1" }),
        );

        // The module's content holds an h2, the item's shallowest heading, which lands at the
        // configured level 2, so the h3 keeps its level; read without it, the h3 would land at 2.
        assert.strictEqual(configuration.headingLevel, 2);
        assert.match(html, /<h3[^>]*>Below<\/h3>/u);
      }),
    ),
  );

  it("gives each part's row from its spec, with the owner, the part and the marker derived", () => {
    const module = { owner: landedOwner, parts: landedParts };

    assert.deepStrictEqual(partRow(module, "root"), {
      defaults: {},
      element: "div",
      interaction: landedOwner,
      legendOwner: true,
      listOwner: false,
      merged: ["class"],
      part: "root",
      slot: landedOwner,
      tagClass: "flow-container",
    });
    assert.deepStrictEqual(partRow(module, "itemButton"), {
      defaults: { type: "button" },
      element: "button",
      interaction: landedOwner,
      legendOwner: false,
      listOwner: false,
      merged: [],
      part: "itemButton",
      slot: `${landedOwner}-item-button`,
      tagClass: "button",
    });
    assert.deepStrictEqual(
      partRow(module, "itemButton", { element: "span", tagClass: "phrasing-container" }),
      {
        defaults: { type: "button" },
        element: "span",
        interaction: landedOwner,
        legendOwner: false,
        listOwner: false,
        merged: [],
        part: "itemButton",
        slot: `${landedOwner}-item-button`,
        tagClass: "phrasing-container",
      },
    );
  });
});
