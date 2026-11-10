import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { configure } from "#plate/configuration.ts";

/**
 * The inputs `configure` refuses, each with the field its refusal names.
 */
const refused = [
  { field: "headingLevel", input: { headingLevel: 1 } },
  { field: "locale", input: { locale: "fr" } },
  { field: "maxAttempts", input: { maxAttempts: -1 } },
  { field: "outputBudget", input: { outputBudget: 0 } },
  { field: "outputBudget", input: { outputBudget: 536_870_889 } },
  { field: "assets", input: { assets: [["/items/a.png", "https://cdn.example/a"]] } },
  { field: "assets", input: { assets: [["", "https://cdn.example/a"]] } },
  { field: "assets", input: { assets: [["items/../a.png", "https://cdn.example/a"]] } },
  { field: "assets", input: { assets: [["./items/a.png", "https://cdn.example/a"]] } },
  { field: "assets", input: { assets: [["items/a.png", "https://cdn.example/a b"]] } },
  { field: "assets", input: { assets: [["items/a.png", ",https://cdn.example/a"]] } },
  { field: "assets", input: { assets: [["items/a.png", "https://cdn.example/a,"]] } },
  { field: "assets", input: { assets: [["items/a.png", "https://cdn.example/a\n"]] } },
  {
    field: "assets",
    input: {
      assets: [
        ["items/a.png", "https://cdn.example/a"],
        ["items/a.png", "https://cdn.example/b"],
      ],
    },
  },
  {
    field: "assets",
    input: {
      assets: [
        ["items/a.png", "https://cdn.example/a"],
        ["items/a.png", "https://cdn.example/a"],
      ],
    },
  },
  { field: "assets", input: { assets: [["items/a.png"]] } },
  { field: "assets", input: { assets: new Map([["items/a.png", "https://cdn.example/a"]]) } },
] as const;

describe("configure", () => {
  it.effect("gives every default for an empty configuration", () =>
    Effect.gen(function* everyDefault() {
      assert.deepStrictEqual(yield* configure({}), {
        allowComment: false,
        allowReview: true,
        allowSkipping: true,
        assets: new Map(),
        headingLevel: 2,
        locale: "en",
        maxAttempts: 1,
        outputBudget: 16_777_216,
        showFeedback: false,
        showSolution: false,
        validateResponses: false,
      });
    }),
  );

  it.effect('holds no seed unless one is given, and decodes seed "7" as "7"', () =>
    Effect.gen(function* seedKey() {
      assert.isFalse(Object.hasOwn(yield* configure({}), "seed"));
      assert.strictEqual((yield* configure({ seed: "7" })).seed, "7");
    }),
  );

  it.effect("reads an empty seed as no seed", () =>
    Effect.gen(function* emptySeed() {
      assert.isFalse(Object.hasOwn(yield* configure({ seed: "" }), "seed"));
    }),
  );

  it.effect("decodes an empty configuration with no trust key", () =>
    Effect.gen(function* noTrust() {
      assert.isFalse(Object.hasOwn(yield* configure({}), "trust"));
    }),
  );

  for (const { field, input } of refused) {
    it.effect(`refuses ${JSON.stringify(input)}, naming ${field}`, () =>
      Effect.gen(function* refusal() {
        const error = yield* Effect.flip(configure(input));

        assert.strictEqual(error._tag, "InvalidConfiguration");
        assert.deepStrictEqual(error.field, Option.some(field));
      }),
    );
  }

  it.effect("decodes maxAttempts 0, which means unlimited", () =>
    Effect.gen(function* unlimited() {
      assert.strictEqual((yield* configure({ maxAttempts: 0 })).maxAttempts, 0);
    }),
  );

  it.effect("decodes headingLevel 6", () =>
    Effect.gen(function* deepestHeading() {
      assert.strictEqual((yield* configure({ headingLevel: 6 })).headingLevel, 6);
    }),
  );

  it.effect("decodes outputBudget 536,870,888, the longest string V8 builds", () =>
    Effect.gen(function* longestBudget() {
      assert.strictEqual(
        (yield* configure({ outputBudget: 536_870_888 })).outputBudget,
        536_870_888,
      );
    }),
  );

  it.effect("decodes the same settings written as environment strings", () =>
    Effect.gen(function* environmentStrings() {
      const configuration = yield* configure({
        headingLevel: "3",
        outputBudget: "1000",
        showFeedback: "true",
      });

      assert.strictEqual(configuration.headingLevel, 3);
      assert.strictEqual(configuration.outputBudget, 1000);
      assert.strictEqual(configuration.showFeedback, true);
    }),
  );

  it.effect(
    "decodes assets written as [path, address] entries into the map from each path to its address, keeping a space in a name and an address's query and fragment",
    () =>
      Effect.gen(function* assetEntries() {
        const { assets } = yield* configure({
          assets: [
            ["items/media/a b.png", "https://cdn.example/sha256/9f86"],
            ["items/q1.xml", "/packages/p/files/items/q1.xml?x=1#y"],
          ],
        });

        assert.deepStrictEqual(
          [...assets],
          [
            ["items/media/a b.png", "https://cdn.example/sha256/9f86"],
            ["items/q1.xml", "/packages/p/files/items/q1.xml?x=1#y"],
          ],
        );
      }),
  );

  it.effect("refuses an input that is not an object, naming no field", () =>
    Effect.gen(function* notAnObject() {
      const error = yield* Effect.flip(configure("secure"));

      assert.strictEqual(error._tag, "InvalidConfiguration");
      assert.deepStrictEqual(error.field, Option.none());
    }),
  );
});
