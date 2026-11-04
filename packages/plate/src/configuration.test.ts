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
] as const;

describe("configure", () => {
  it.effect("gives every default for an empty configuration", () =>
    Effect.gen(function* everyDefault() {
      assert.deepStrictEqual(yield* configure({}), {
        allowComment: false,
        allowReview: true,
        allowSkipping: true,
        assetBase: "",
        headingLevel: 2,
        locale: "en",
        maxAttempts: 1,
        showFeedback: false,
        showSolution: false,
        trust: "secure",
        validateResponses: false,
      });
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

  it.effect("decodes the same settings written as environment strings", () =>
    Effect.gen(function* environmentStrings() {
      const configuration = yield* configure({ headingLevel: "3", showFeedback: "true" });

      assert.strictEqual(configuration.headingLevel, 3);
      assert.strictEqual(configuration.showFeedback, true);
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
