/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column the declaration and binding rows name; it is no structure. */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";
import {
  attributeReader,
  bindingRows,
  coordsRows,
  gapMatchBindingRow,
  markers,
  maxBoundOf,
  maxCountDefault,
  nearestInteraction,
  templateRef,
  typedCopy,
} from "#qti/import/interactions.ts";
import type { DeclaredVariable, InteractionContext } from "#qti/import/interactions.ts";
import { otherRows } from "#qti/import/interactions/other.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import { ItemRefusal, Rows } from "#qti/import/tree.ts";
import type { IndexedNode, NodeIndex } from "#qti/import/tree.ts";
import { InteractionBinding, TypedBinding } from "#qti/schema/interaction.ts";
import {
  DeclaredMediaLoop,
  DeclaredSliderStepLabel,
  DrawingInteraction,
  EndAttemptCountAttempt,
  EndAttemptInteraction,
  MediaCoords,
  MediaInteraction,
  MediaMaxPlays,
  MediaMinPlays,
  SliderInteraction,
  SliderOrientation,
  SliderReverse,
  SliderStep,
  UploadInteraction,
  UploadType,
} from "#qti/schema/interactions/other.ts";
import { AttributeLexical, AttributeSpelling } from "#qti/schema/node.ts";
import type { NodeKindHandle } from "#qti/schema/node.ts";
import type { Attribute, Element } from "#qti/xml/tree.ts";

const documentId = "11111111-1111-4111-8111-111111111111";

const attribute = (local: string, value: string): Attribute => ({
  local,
  namespace: "",
  prefix: "",
  qname: local,
  references: [],
  value,
});

const element = (
  local: string,
  attributes: readonly (readonly [string, string])[] = [],
  children: readonly Element[] = [],
): Element => ({
  attributes: attributes.map(([name, value]) => attribute(name, value)),
  children,
  kind: "element",
  local,
  namespace: "http://www.imsglobal.org/xsd/imsqtiasi_v3p0",
  prefix: "",
  qname: local,
});

/**
 * The node index of a tree, each element's id its kind and position:
 * `qti-text-entry-interaction-1`.
 */
const indexed = (entries: readonly (readonly [Element, NodeKindHandle])[]): NodeIndex =>
  new Map<Element, IndexedNode>(
    entries.map(([found, kind], position) => [
      found,
      { ancestry: "root", id: `${kind}-${position}`, kind },
    ]),
  );

const stringSingle: DeclaredVariable = {
  baseType: Option.some("string"),
  cardinality: Option.some("single"),
  id: "decl-response",
  shape: "typed",
};

const shared: InteractionContext["shared"] = {
  attributes: attributeReader,
  bindingRows,
  coordsRows,
  gapMatchBindingRow,
  markers,
  maxBoundOf,
  maxCountDefault,
  nearestInteraction,
  templateRef,
  typedCopy,
};

/**
 * The context of a tree whose root holds `elements`, with the kinds `entries` index.
 */
const contextOf = (
  elements: readonly Element[],
  entries: readonly (readonly [Element, NodeKindHandle])[],
  declarations: readonly (readonly [string, DeclaredVariable])[],
): InteractionContext => {
  const body = element("qti-item-body", [], elements);
  const root = element("qti-assessment-item", [], [body]);

  return {
    declarations: new Map(declarations),
    documentId,
    item: { adaptive: "false" },
    nodes: indexed([[root, "qti-assessment-item"], [body, "qti-item-body"], ...entries]),
    root,
    shared,
  };
};

const run = (ctx: InteractionContext) => otherRows(ctx, Rows.empty());

const booleanSingle: DeclaredVariable = {
  baseType: Option.some("boolean"),
  cardinality: Option.some("single"),
  id: "decl-bool",
  shape: "typed",
};

const one = (
  local: string,
  kind: NodeKindHandle,
  attributes: readonly (readonly [string, string])[],
  variable: DeclaredVariable,
) => {
  const found = element(local, attributes);

  return { ctx: contextOf([found], [[found, kind]], [["RESPONSE", variable]]), id: `${kind}-2` };
};

/**
 * The rule of the `ItemRefusal` a run fails with; the empty string when it fails otherwise or not
 * at all.
 */
const refusedRule = (ctx: InteractionContext) =>
  Effect.exit(run(ctx)).pipe(
    Effect.map((exit) =>
      Exit.isFailure(exit)
        ? Exit.findErrorOption(exit).pipe(
            Option.filter((e) => e instanceof ItemRefusal),
            Option.match({ onNone: () => "", onSome: (e) => e.rule }),
          )
        : "",
    ),
  );

describe("otherRows: media", () => {
  it.effect(
    "copies the plays and writes the plays markers and the loop marker only as written",
    () =>
      Effect.gen(function* check() {
        const { ctx, id } = one(
          "qti-media-interaction",
          "qti-media-interaction",
          [
            ["response-identifier", "RESPONSE"],
            ["autostart", "true"],
            ["max-plays", "2"],
          ],
          stringSingle,
        );
        const rows = yield* run(ctx);

        assert.deepStrictEqual(Rows.of(rows, MediaInteraction), [
          {
            autostart: "true",
            id,
            loop: "false",
            maxPlaysN: 2n,
            minPlaysN: 0n,
            responseIdentifier: "RESPONSE",
            rootKind: "item",
          },
        ]);
        assert.deepStrictEqual(Rows.of(rows, MediaMaxPlays), [{ node: id }]);
        assert.strictEqual(Rows.of(rows, MediaMinPlays).length, 0);
        assert.strictEqual(Rows.of(rows, DeclaredMediaLoop).length, 0);
        assert.strictEqual(Rows.of(rows, MediaCoords).length, 0);
        assert.strictEqual(Rows.of(rows, TypedBinding).length, 1);
      }),
  );

  it.effect("writes loop with its marker, min-plays and replaced coords", () =>
    Effect.gen(function* check() {
      const { ctx, id } = one(
        "qti-media-interaction",
        "qti-media-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["autostart", "false"],
          ["loop", "true"],
          ["min-plays", "1"],
          ["coords", "0,\t0,10,10"],
        ],
        stringSingle,
      );
      const rows = yield* run(ctx);

      assert.deepStrictEqual(
        Rows.of(rows, MediaInteraction).map((row) => [row.loop, row.minPlaysN, row.maxPlaysN]),
        [["true", 1n, 0n]],
      );
      assert.deepStrictEqual(Rows.of(rows, DeclaredMediaLoop), [{ node: id }]);
      assert.deepStrictEqual(Rows.of(rows, MediaMinPlays), [{ node: id }]);
      assert.deepStrictEqual(Rows.of(rows, MediaCoords), [{ node: id, value: "0, 0,10,10" }]);
      assert.deepStrictEqual(
        Rows.of(rows, AttributeLexical).map((row) => row.attribute),
        ["coords"],
      );
    }),
  );

  for (const [name, value] of [
    ["max-plays", "-1"],
    ["min-plays", "x"],
    ["max-plays", "1.5"],
  ] as const) {
    it.effect(`refuses ${name}="${value}" under attribute-lexical before any row is written`, () =>
      Effect.gen(function* outside() {
        const { ctx } = one(
          "qti-media-interaction",
          "qti-media-interaction",
          [
            ["response-identifier", "RESPONSE"],
            ["autostart", "false"],
            [name, value],
          ],
          stringSingle,
        );
        const exit = yield* Effect.exit(run(ctx));
        const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();

        assert.isTrue(Option.isSome(failure) && failure.value instanceof ImportRefused);
        assert.strictEqual(
          Option.isSome(failure) && failure.value instanceof ImportRefused
            ? failure.value.rule
            : "",
          "attribute-lexical",
        );
      }),
    );
  }

  it.effect("keeps a signed min-plays as the value 1, a marker and one spelling row", () =>
    Effect.gen(function* signed() {
      const { ctx, id } = one(
        "qti-media-interaction",
        "qti-media-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["autostart", "false"],
          ["min-plays", "+1"],
        ],
        stringSingle,
      );
      const rows = yield* run(ctx);

      assert.strictEqual(Rows.of(rows, MediaInteraction)[0]?.minPlaysN, 1n);
      assert.deepStrictEqual(Rows.of(rows, MediaMinPlays), [{ node: id }]);
      assert.deepStrictEqual(
        Rows.of(rows, AttributeSpelling).map((row) => [row.attribute, row.value]),
        [["min-plays", "+1"]],
      );
    }),
  );

  it.effect("writes no spelling row for a canonical value", () =>
    Effect.gen(function* canonical() {
      const { ctx } = one(
        "qti-media-interaction",
        "qti-media-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["autostart", "false"],
          ["max-plays", "3"],
        ],
        stringSingle,
      );
      const rows = yield* run(ctx);

      assert.strictEqual(Rows.of(rows, MediaInteraction)[0]?.maxPlaysN, 3n);
      assert.strictEqual(Rows.of(rows, AttributeSpelling).length, 0);
    }),
  );

  it.effect("refuses a media interaction with no autostart", () =>
    Effect.gen(function* check() {
      const { ctx } = one(
        "qti-media-interaction",
        "qti-media-interaction",
        [["response-identifier", "RESPONSE"]],
        stringSingle,
      );

      assert.strictEqual(yield* refusedRule(ctx), "required-attribute");
    }),
  );
});

describe("otherRows: upload and drawing", () => {
  it.effect("stores the type list collapsed, and the empty list as written", () =>
    Effect.gen(function* check() {
      const spaced = one(
        "qti-upload-interaction",
        "qti-upload-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["type", "  image/png   image/jpeg "],
        ],
        stringSingle,
      );
      const rows = yield* run(spaced.ctx);
      assert.deepStrictEqual(Rows.of(rows, UploadType), [
        { node: spaced.id, value: "image/png image/jpeg" },
      ]);
      assert.strictEqual(Rows.of(rows, UploadInteraction).length, 1);

      const empty = one(
        "qti-upload-interaction",
        "qti-upload-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["type", ""],
        ],
        stringSingle,
      );
      assert.deepStrictEqual(Rows.of(yield* run(empty.ctx), UploadType), [
        { node: empty.id, value: "" },
      ]);
    }),
  );

  it.effect("writes no UploadType when type is omitted", () =>
    Effect.gen(function* check() {
      const { ctx } = one(
        "qti-upload-interaction",
        "qti-upload-interaction",
        [["response-identifier", "RESPONSE"]],
        stringSingle,
      );
      assert.strictEqual(Rows.of(yield* run(ctx), UploadType).length, 0);
    }),
  );

  it.effect("writes the drawing arm and its binding", () =>
    Effect.gen(function* check() {
      const { ctx, id } = one(
        "qti-drawing-interaction",
        "qti-drawing-interaction",
        [["response-identifier", "RESPONSE"]],
        stringSingle,
      );
      const rows = yield* run(ctx);
      assert.deepStrictEqual(Rows.of(rows, DrawingInteraction), [
        { id, responseIdentifier: "RESPONSE", rootKind: "item" },
      ]);
      assert.strictEqual(Rows.of(rows, InteractionBinding).length, 1);
    }),
  );
});

describe("otherRows: slider", () => {
  it.effect("writes no SliderStep, no marker and stepLabel false without a step", () =>
    Effect.gen(function* check() {
      const { ctx, id } = one(
        "qti-slider-interaction",
        "qti-slider-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["lower-bound", "0"],
          ["upper-bound", " 10 "],
        ],
        stringSingle,
      );
      const rows = yield* run(ctx);

      assert.deepStrictEqual(Rows.of(rows, SliderInteraction), [
        {
          id,
          lowerBound: "0",
          responseIdentifier: "RESPONSE",
          rootKind: "item",
          stepLabel: "false",
          upperBound: "10",
        },
      ]);
      assert.strictEqual(Rows.of(rows, SliderStep).length, 0);
      assert.strictEqual(Rows.of(rows, DeclaredSliderStepLabel).length, 0);
      assert.strictEqual(Rows.of(rows, SliderOrientation).length, 0);
      assert.strictEqual(Rows.of(rows, SliderReverse).length, 0);
    }),
  );

  it.effect("writes the step, its optionals and the step-label marker as written", () =>
    Effect.gen(function* check() {
      const { ctx, id } = one(
        "qti-slider-interaction",
        "qti-slider-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["lower-bound", "0"],
          ["upper-bound", "10"],
          ["step", "2.5"],
          ["step-label", "true"],
          ["orientation", "vertical"],
          ["reverse", "true"],
        ],
        stringSingle,
      );
      const rows = yield* run(ctx);

      assert.deepStrictEqual(Rows.of(rows, SliderStep), [{ node: id, value: "2.5" }]);
      assert.deepStrictEqual(Rows.of(rows, DeclaredSliderStepLabel), [{ node: id }]);
      assert.deepStrictEqual(Rows.of(rows, SliderOrientation), [{ node: id, value: "vertical" }]);
      assert.deepStrictEqual(Rows.of(rows, SliderReverse), [{ node: id, value: "true" }]);
      assert.strictEqual(Rows.of(rows, SliderInteraction)[0]?.stepLabel, "true");
    }),
  );

  it.effect("refuses a slider with no lower-bound", () =>
    Effect.gen(function* check() {
      const { ctx } = one(
        "qti-slider-interaction",
        "qti-slider-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["upper-bound", "10"],
        ],
        stringSingle,
      );

      assert.strictEqual(yield* refusedRule(ctx), "required-attribute");
    }),
  );

  it.effect("refuses a slider with no upper-bound", () =>
    Effect.gen(function* check() {
      const { ctx } = one(
        "qti-slider-interaction",
        "qti-slider-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["lower-bound", "0"],
        ],
        stringSingle,
      );

      assert.strictEqual(yield* refusedRule(ctx), "required-attribute");
    }),
  );
});

describe("otherRows: end-attempt", () => {
  it.effect("writes the title and a boolean single binding of maxCount 1", () =>
    Effect.gen(function* check() {
      const { ctx, id } = one(
        "qti-end-attempt-interaction",
        "qti-end-attempt-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["title", "Hint"],
        ],
        booleanSingle,
      );
      const rows = yield* run(ctx);

      assert.deepStrictEqual(Rows.of(rows, EndAttemptInteraction), [
        { id, responseIdentifier: "RESPONSE", rootKind: "item", title: "Hint" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TypedBinding), [
        {
          baseType: "boolean",
          cardinality: "single",
          document: documentId,
          interactionKind: "qti-end-attempt-interaction",
          maxCount: 1n,
          node: id,
          responseIdentifier: "RESPONSE",
        },
      ]);
      assert.strictEqual(Rows.of(rows, EndAttemptCountAttempt).length, 0);
    }),
  );

  it.effect("stores the title after replace and keeps the written form", () =>
    Effect.gen(function* check() {
      const { ctx, id } = one(
        "qti-end-attempt-interaction",
        "qti-end-attempt-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["title", "Show\thint"],
          ["count-attempt", "false"],
        ],
        booleanSingle,
      );
      const rows = yield* run(ctx);

      assert.deepStrictEqual(
        Rows.of(rows, EndAttemptInteraction).map((row) => row.title),
        ["Show hint"],
      );
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        { attribute: "title", kind: "qti-end-attempt-interaction", node: id, value: "Show\thint" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, EndAttemptCountAttempt), [{ node: id, value: "false" }]);
    }),
  );

  it.effect("refuses an end-attempt interaction with no title", () =>
    Effect.gen(function* check() {
      const { ctx } = one(
        "qti-end-attempt-interaction",
        "qti-end-attempt-interaction",
        [["response-identifier", "RESPONSE"]],
        booleanSingle,
      );

      assert.strictEqual(yield* refusedRule(ctx), "required-attribute");
    }),
  );

  it.effect("admits an empty title as a value", () =>
    Effect.gen(function* check() {
      const { ctx } = one(
        "qti-end-attempt-interaction",
        "qti-end-attempt-interaction",
        [
          ["response-identifier", "RESPONSE"],
          ["title", ""],
        ],
        booleanSingle,
      );
      const rows = yield* run(ctx);

      assert.deepStrictEqual(
        Rows.of(rows, EndAttemptInteraction).map((row) => row.title),
        [""],
      );
    }),
  );
});

describe("otherRows: refusal", () => {
  it.effect("refuses a response-identifier no declaration names", () =>
    Effect.gen(function* check() {
      const found = element("qti-drawing-interaction", [["response-identifier", "NOPE"]]);
      const exit = yield* Effect.exit(
        run(contextOf([found], [[found, "qti-drawing-interaction"]], [])),
      );

      assert.isTrue(Exit.isFailure(exit));
      if (Exit.isFailure(exit)) {
        assert.isTrue(
          Exit.findErrorOption(exit).pipe(Option.exists((e) => e instanceof ItemRefusal)),
        );
      }
    }),
  );
});
