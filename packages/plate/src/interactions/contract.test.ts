import { readdirSync } from "node:fs";
import { assert, describe, it, vi } from "@effect/vitest";
import { Effect, Option, Predicate, Result, pipe } from "effect";
import { configure } from "#plate/configuration.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { h } from "#plate/emit/node.ts";
import type { Attributes, PartFunction } from "#plate/emit/node.ts";
import { resolveOverrides } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import { NotImplemented, isModuleKind, partRow } from "#plate/interactions/contract.ts";
import type {
  FeatureId,
  InteractionModule,
  ModuleKind,
  ParseContext,
  PartSpec,
} from "#plate/interactions/contract.ts";
import type {
  BodyNode,
  GapMatchInteraction,
  StubInteraction,
  Unsupported,
} from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload, PayloadNode } from "#plate/payload.ts";

/**
 * A parse context and the features its notices named, in order.
 */
interface Recording {
  readonly context: ParseContext;
  readonly noticed: string[];
}

/**
 * An interaction module as this test reads it, its kind's types erased: its model node `unknown`,
 * its payload node any node that names its response, so a step of one that is not implemented can
 * be handed a placeholder node it never reads.
 */
type AnyModule = InteractionModule<
  ModuleKind,
  unknown,
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
 * Construct a placeholder node of a module's kind, which no hub ever hands a stub: a stub's steps
 * throw before they read it.
 *
 * @param module The module.
 * @returns The node.
 */
const placeholderOf = (module: AnyModule): StubInteraction<ModuleKind> => ({
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  class: "",
  kind: module.kind,
  path: `qti-assessment-item/qti-item-body/${module.element}`,
  prompt: Option.none(),
  response: "RESPONSE",
});

/**
 * Construct a parse context that records every notice it is asked for.
 *
 * @param path The element's path.
 * @returns The context and the features its notices named.
 */
const recording = (path: string): Recording => {
  const noticed: string[] = [];

  return {
    context: {
      notice: (feature) => {
        noticed.push(feature);

        return Result.succeed({ feature, kind: "unsupported", path });
      },
      path,
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
      const { context, noticed } = recording(path);
      const unsupported: Unsupported = { feature: module.element, kind: "unsupported", path };

      assert.deepStrictEqual(
        module.parse(elementNamed(module.element), context),
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
              module.redact(node);
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
 * One gap text of {@link landedGapMatch}'s model node: content it holds beyond its Prompt.
 */
interface LandedGapText {
  readonly content: readonly BodyNode[];
  readonly identifier: string;
}

/**
 * The model node of {@link landedGapMatch}: Gap Match's, with its gap texts, content beyond the
 * Prompt that only the module knows.
 */
interface LandedModel extends GapMatchInteraction {
  readonly gapTexts: readonly LandedGapText[];
}

/**
 * The payload node of {@link landedGapMatch}: what its `redact` copies of the model node, and the
 * content its render writes through `emitNodes`.
 */
interface LandedPayload {
  readonly class: string;
  readonly content: readonly PayloadNode[];
  readonly response: string;
}

/**
 * The content {@link landedGapMatch}'s payload node holds: a heading, as a Prompt holds one.
 */
const landedContent: readonly PayloadNode[] = [
  { attributes: [], children: [{ kind: "text", text: "Gaps" }], kind: "element", tag: "h2" },
];

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
 * which a host overrides by `parts["gap-match-interaction"].gap`.
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
 * A Gap Match module as one that has landed would be: implemented, with its own model node, payload
 * node, JSON form and parts, in this file only. The test registers it in place of the stub through
 * `vi.doMock`, so no hub is edited for it.
 */
const landedGapMatch: InteractionModule<
  "gap-match",
  LandedModel,
  LandedPayload,
  "gap" | "itemButton" | "root",
  unknown
> = {
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  connect: () => ({}),
  content: (interaction) => interaction.content,
  controls: () => 1,
  element: "qti-gap-match-interaction",
  feature: "Q-6",
  implemented: true,
  kind: "gap-match",
  nullValue: () => ({ baseType: "identifier", cardinality: "single", values: [] }),
  owner: "gap-match-interaction",
  parse: (_source, context) => context.notice("qti-gap-match-interaction"),
  parts: landedAllParts,
  payloadSchema: ({ BodyNodes, NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      class: Schema.String,
      gapTexts: Schema.Array(Schema.Struct({ content: BodyNodes, identifier: Schema.String })),
      kind: Schema.Literal("gap-match"),
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
    }),
  redact: (interaction) => ({
    class: interaction.class,
    content: landedContent,
    response: interaction.response,
  }),
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
  ],
  render: (interaction) => {
    const row = partRow({ owner: "gap-match-interaction", parts: landedParts }, "root");

    return applyPart(
      row,
      { class: interaction.class, "data-response": interaction.response, "data-slot": row.slot },
      [],
    );
  },
  replaceRegions: (interaction, contents) => {
    const [first, ...rest] = contents;
    const prompt = pipe(
      interaction.prompt,
      Option.map((nodes) => first ?? nodes),
    );
    const gaps = Option.isSome(interaction.prompt) ? rest : contents;

    return {
      ...interaction,
      gapTexts: interaction.gapTexts.map((gapText, index) => ({
        ...gapText,
        content: gaps[index] ?? gapText.content,
      })),
      prompt,
    };
  },
  restore: (_interaction, stored) => stored,
  sequence: () => Option.none(),
  solution: (_interaction, correct) => correct,
  unnamed: () => false,
  validate: () => [],
};

/**
 * Run an effect with {@link landedGapMatch} registered in place of the Gap Match stub, every module
 * it imports loaded afresh, and the stub restored after.
 *
 * @param effect The effect, which imports what it reads of plate dynamically, after the mock.
 * @returns The effect, wrapped.
 */
const withLanded = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
  Effect.sync(() => {
    vi.resetModules();
    vi.doMock("#plate/interactions/gap-match.ts", () => ({ gapMatchModule: landedGapMatch }));
  }).pipe(
    Effect.andThen(effect),
    Effect.ensuring(
      Effect.sync(() => {
        vi.doUnmock("#plate/interactions/gap-match.ts");
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
      kind: "gap-match",
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

describe("a module that lands", () => {
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
          assert.match(html, /<div [^>]*data-slot="gap-match-interaction"[^>]*>/u);
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
            parts.resolveOverrides({ "gap-match-interaction": { gap: replacement } }),
          );
          const named = parts.partForSlot("gap-match-interaction-gap");

          assert.deepStrictEqual<unknown>(
            named,
            Option.some({ interaction: "gap-match-interaction", part: "gap" }),
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
              parts.resolveOverrides({ "gap-match-interaction": { gaps: replacement } }),
              () => "resolved",
            ),
            Result.fail(
              new parts.UnknownPart({
                interaction: "gap-match-interaction",
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
          class: "",
          gapTexts: [
            { content: [textNode("cat")], identifier: "G1" },
            { content: [textNode("dog")], identifier: "G2" },
          ],
          kind: "gap-match",
          path: "qti-assessment-item/qti-item-body/qti-gap-match-interaction",
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

        assert.deepStrictEqual(seen, ["prompt", "G1", "G2"]);
        assert.deepStrictEqual(
          interactions.regionsOf(mapped).map((region) => region.nodes),
          [[textNode("FILL")], [textNode("CAT")], [textNode("DOG")]],
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
        const decoded = yield* Effect.fromResult(
          codec.decodeRedacted({
            ...landedJson,
            body: [
              ...landedJson.body,
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
    const module = { owner: "gap-match-interaction" as const, parts: landedParts };

    assert.deepStrictEqual(partRow(module, "root"), {
      defaults: {},
      element: "div",
      interaction: "gap-match-interaction",
      legendOwner: true,
      listOwner: false,
      merged: ["class"],
      part: "root",
      slot: "gap-match-interaction",
      tagClass: "flow-container",
    });
    assert.deepStrictEqual(partRow(module, "itemButton"), {
      defaults: { type: "button" },
      element: "button",
      interaction: "gap-match-interaction",
      legendOwner: false,
      listOwner: false,
      merged: [],
      part: "itemButton",
      slot: "gap-match-interaction-item-button",
      tagClass: "button",
    });
    assert.deepStrictEqual(
      partRow(module, "itemButton", { element: "span", tagClass: "phrasing-container" }),
      {
        defaults: { type: "button" },
        element: "span",
        interaction: "gap-match-interaction",
        legendOwner: false,
        listOwner: false,
        merged: [],
        part: "itemButton",
        slot: "gap-match-interaction-item-button",
        tagClass: "phrasing-container",
      },
    );
  });
});
