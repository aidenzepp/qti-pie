import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { resolveOverrides } from "#plate/emit/parts.ts";
import { associateModule } from "#plate/interactions/associate.ts";
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule, ParseContext } from "#plate/interactions/contract.ts";
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
import type { StubInteraction, StubbedInteraction, Unsupported } from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload } from "#plate/payload.ts";

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
