import { assert, describe, it, vi } from "@effect/vitest";
import { Effect, Option, Result, pipe } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { h } from "#plate/emit/node.ts";
import type { Attributes, PartFunction } from "#plate/emit/node.ts";
import { resolveOverrides } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import { associateModule } from "#plate/interactions/associate.ts";
import { NotImplemented, partRow } from "#plate/interactions/contract.ts";
import type { InteractionModule, ParseContext, PartSpec } from "#plate/interactions/contract.ts";
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
  BodyNode,
  GapMatchInteraction,
  StubInteraction,
  StubbedInteraction,
  Unsupported,
} from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload, PayloadNode } from "#plate/payload.ts";

/**
 * What every stub step is handed beside its kind's placeholder node.
 */
interface StepInputs {
  readonly configuration: Configuration;
  readonly payload: Payload;
  readonly state: EmitState;
  readonly value: Value;
}

/**
 * A parse context and the features its notices named, in order.
 */
interface Recording {
  readonly context: ParseContext;
  readonly noticed: string[];
}

/**
 * One stub module as this test reads it, its kind's types erased: what it declares, its parse on
 * its own element, and every step past parse, each run on its kind's placeholder node.
 */
interface Stub {
  readonly declared: {
    readonly element: string;
    readonly feature: string;
    readonly implemented: boolean;
    readonly kind: string;
    readonly owner: string;
    readonly parts: readonly string[];
  };
  readonly expected: { readonly feature: string; readonly kind: string };
  readonly parse: (context: ParseContext) => Result.Result<unknown, unknown>;
  readonly steps: (inputs: StepInputs) => readonly (readonly [string, () => void])[];
}

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
 * Read a stub module for this test: its declarations, its parse, and its steps on a placeholder
 * node of its kind, which no hub ever hands it.
 *
 * @param module The stub module.
 * @param kind The kind it must declare.
 * @param feature The Appendix A feature it must declare.
 * @returns The stub as this test reads it.
 */
const stubOf = <K extends StubbedInteraction["kind"]>(
  module: InteractionModule<K, StubInteraction<K>, never>,
  kind: string,
  feature: string,
): Stub => {
  const node: StubInteraction<K> = {
    ariaLabel: Option.none(),
    ariaLabelledby: Option.none(),
    class: "",
    kind: module.kind,
    path: `qti-assessment-item/qti-item-body/${module.element}`,
    prompt: Option.none(),
    response: "RESPONSE",
  };

  return {
    declared: {
      element: module.element,
      feature: module.feature,
      implemented: module.implemented,
      kind: module.kind,
      owner: module.owner,
      parts: Object.keys(module.parts),
    },
    expected: { feature, kind },
    parse: (context) => module.parse(elementNamed(module.element), context),
    steps: ({ configuration, payload, state, value }) => [
      [
        "bindings",
        () => {
          module.bindings(node);
        },
      ],
      [
        "connect",
        () => {
          // oxlint-disable-next-line anti-slop/no-reflect-apply -- a stub's payload node type is never, as it has none, so no typed call can hand it one; the step throws before it reads the placeholder handed here.
          Reflect.apply(module.connect, undefined, [node, payload, configuration.locale]);
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
          // oxlint-disable-next-line anti-slop/no-reflect-apply -- a stub's payload node type is never, as it has none, so no typed call can hand it one; the step throws before it reads the placeholder handed here.
          Reflect.apply(module.render, undefined, [node, payload, state]);
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
    ],
  };
};

/**
 * Each stub module beside the kind and the Appendix A feature it must declare, in the brief's
 * order.
 */
const stubs: readonly Stub[] = [
  stubOf(gapMatchModule, "gap-match", "Q-6"),
  stubOf(graphicGapMatchModule, "graphic-gap-match", "Q-8"),
  stubOf(hotspotModule, "hotspot", "Q-10"),
  stubOf(hottextModule, "hottext", "Q-11"),
  stubOf(matchModule, "match", "Q-13"),
  stubOf(associateModule, "associate", "Q-1"),
  stubOf(orderModule, "order", "Q-15"),
  stubOf(graphicAssociateModule, "graphic-associate", "Q-7"),
  stubOf(graphicOrderModule, "graphic-order", "Q-9"),
  stubOf(positionObjectModule, "position-object", "Q-17"),
  stubOf(selectPointModule, "select-point", "Q-18"),
  stubOf(drawingModule, "drawing", "Q-3"),
  stubOf(sliderModule, "slider", "Q-19"),
  stubOf(mediaModule, "media", "Q-14"),
  stubOf(uploadModule, "upload", "Q-21"),
  stubOf(endAttemptModule, "end-attempt", "Q-4"),
  stubOf(portableCustomModule, "portable-custom", "Q-16"),
];

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

describe("the stub interaction modules", () => {
  it("are seventeen, one per kind", () => {
    assert.strictEqual(stubs.length, 17);
    assert.strictEqual(new Set(stubs.map((stub) => stub.declared.kind)).size, 17);
  });

  it("declare each kind's Appendix A feature, owner and QTI element name", () => {
    for (const { declared, expected } of stubs) {
      assert.strictEqual(declared.kind, expected.kind);
      assert.strictEqual(declared.feature, expected.feature, expected.kind);
      assert.strictEqual(declared.owner, `${expected.kind}-interaction`, expected.kind);
      assert.strictEqual(declared.element, `qti-${expected.kind}-interaction`, expected.kind);
    }
  });

  it("are not implemented, and hold no part row", () => {
    for (const { declared, expected } of stubs) {
      assert.isFalse(declared.implemented, expected.kind);
      assert.deepStrictEqual(declared.parts, [], expected.kind);
    }
  });

  it("parse their element as the unsupported node naming it, recorded once, as any unknown QTI element is", () => {
    for (const { declared, expected, parse } of stubs) {
      const path = `qti-assessment-item/qti-item-body/${declared.element}`;
      const { context, noticed } = recording(path);
      const unsupported: Unsupported = { feature: declared.element, kind: "unsupported", path };

      assert.deepStrictEqual(parse(context), Result.succeed(unsupported), expected.kind);
      assert.deepStrictEqual(noticed, [declared.element], expected.kind);
    }
  });

  it.effect("throw NotImplemented, naming the feature, from every step past parse", () =>
    Effect.gen(function* everyStep() {
      const configuration = yield* configure({});
      const inputs: StepInputs = {
        configuration,
        payload: {
          body: [],
          finished: false,
          instance: "q1",
          lang: "en",
          messages: [],
          mode: "answering",
          notices: [],
          title: "",
        },
        state: {
          assetBase: "",
          headingLevel: 1,
          locale: configuration.locale,
          parts: yield* Effect.fromResult(resolveOverrides()),
        },
        value: { baseType: "identifier", cardinality: "single", values: [] },
      };

      for (const { declared, expected, steps } of stubs) {
        for (const [name, step] of steps(inputs)) {
          assert.deepStrictEqual(
            notImplementedBy(step),
            Option.some(declared.feature),
            `${expected.kind} ${name}`,
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
