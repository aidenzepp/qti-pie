import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { configure } from "#plate/configuration.ts";
import { patternMessage } from "#plate/interactions/pattern.ts";
import { message } from "#plate/messages.ts";
import type { TextEntryInteraction } from "#plate/model/item.ts";
import type { Single, Value } from "#plate/model/values.ts";
import { checkAllowlist, sourceModules } from "#plate/test/imports.ts";

/**
 * The fields of a text interaction the check reads.
 */
type Masked = Pick<TextEntryInteraction, "patternMask" | "patternMaskMessage">;

/**
 * Construct the fields the check reads.
 *
 * @param pattern The `pattern-mask`, as written.
 * @param authored The author's `data-patternmask-message`, none by default.
 * @returns The fields.
 */
const masked = (pattern: string, authored: Option.Option<string> = Option.none()): Masked => ({
  patternMask: Option.some(pattern),
  patternMaskMessage: authored,
});

/**
 * Construct a single value.
 *
 * @param single The one value it holds.
 * @returns The value of `single`'s base type, of cardinality `single`.
 */
const one = (single: Single & { readonly baseType: "float" | "integer" | "string" }): Value => ({
  baseType: single.baseType,
  cardinality: "single",
  values: [single],
});

/**
 * Construct an ordered string value.
 *
 * @param members Its strings, in order.
 * @returns The value of cardinality `ordered`.
 */
const ordered = (...members: readonly string[]): Value => ({
  baseType: "string",
  cardinality: "ordered",
  values: members.map((value) => ({ baseType: "string", value })),
});

/**
 * The author's message on the interactions below that carry one.
 */
const authored = "Enter up to six digits and points.";

/**
 * A mask of up to six digits and points, with the author's message.
 */
const sixDigits = masked("([0-9.]{0,6})", Option.some(authored));

/**
 * A mask that takes a digit, a point and one digit: `1.5`, never `1.50`.
 */
const oneDecimal = masked(String.raw`[0-9]\.[0-9]`);

describe("patternMessage", () => {
  it.effect(
    "[Q-20] gives the author's message for 12a against ([0-9.]{0,6}) and none for 12.5",
    () =>
      Effect.gen(function* authorsMessage() {
        const configuration = yield* configure({ validateResponses: true });

        assert.deepStrictEqual(
          patternMessage(sixDigits, one({ baseType: "string", value: "12a" }), configuration),
          Option.some(authored),
        );
        assert.deepStrictEqual(
          patternMessage(sixDigits, one({ baseType: "string", value: "12.5" }), configuration),
          Option.none(),
        );
      }),
  );

  it.effect(
    "[Q-20] matches a float in its canonical form, so a posted 1.50 is matched as 1.5",
    () =>
      Effect.gen(function* canonicalFloat() {
        const configuration = yield* configure({ validateResponses: true });

        // The control: the mask refuses the text 1.50 itself.
        assert.isTrue(
          Option.isSome(
            patternMessage(oneDecimal, one({ baseType: "string", value: "1.50" }), configuration),
          ),
        );
        assert.deepStrictEqual(
          patternMessage(oneDecimal, one({ baseType: "float", value: 1.5 }), configuration),
          Option.none(),
        );
      }),
  );

  it.effect(
    "[Q-20] matches an integer in its canonical form, so a posted 007 is matched as 7",
    () =>
      Effect.gen(function* canonicalInteger() {
        const configuration = yield* configure({ validateResponses: true });
        const noLeadingZero = masked("[1-9][0-9]*");

        assert.isTrue(
          Option.isSome(
            patternMessage(noLeadingZero, one({ baseType: "string", value: "007" }), configuration),
          ),
        );
        assert.deepStrictEqual(
          patternMessage(noLeadingZero, one({ baseType: "integer", value: 7n }), configuration),
          Option.none(),
        );
      }),
  );

  it.effect(
    "[Q-5] gives the message for an ordered value with one mismatching member, and none when every member matches",
    () =>
      Effect.gen(function* containerMembers() {
        const configuration = yield* configure({ validateResponses: true });

        assert.deepStrictEqual(
          patternMessage(sixDigits, ordered("12.5", "12a", "3"), configuration),
          Option.some(authored),
        );
        assert.deepStrictEqual(
          patternMessage(sixDigits, ordered("12.5", "3"), configuration),
          Option.none(),
        );
      }),
  );

  it.effect("[Q-20] checks no NULL value", () =>
    Effect.gen(function* nullValue() {
      const configuration = yield* configure({ validateResponses: true });

      assert.deepStrictEqual(
        patternMessage(
          sixDigits,
          { baseType: "string", cardinality: "single", values: [] },
          configuration,
        ),
        Option.none(),
      );
    }),
  );

  it.effect("[Q-20] gives patternMismatch's text when the author wrote no message", () =>
    Effect.gen(function* localeMessage() {
      const configuration = yield* configure({ validateResponses: true });

      assert.deepStrictEqual(
        patternMessage(
          masked("([0-9.]{0,6})"),
          one({ baseType: "string", value: "12a" }),
          configuration,
        ),
        Option.some(message("en", "patternMismatch")),
      );
    }),
  );

  it.effect("[Q-20] checks nothing without validateResponses, or without a pattern-mask", () =>
    Effect.gen(function* untiered() {
      const lenient = yield* configure({ validateResponses: false });
      const strict = yield* configure({ validateResponses: true });
      const mismatch = one({ baseType: "string", value: "12a" });

      assert.deepStrictEqual(patternMessage(sixDigits, mismatch, lenient), Option.none());
      assert.deepStrictEqual(
        patternMessage(
          { patternMask: Option.none(), patternMaskMessage: Option.some(authored) },
          mismatch,
          strict,
        ),
        Option.none(),
      );
    }),
  );

  it("value-imports from effect only what the browser allowlist admits, its JSON block table included", () => {
    const modules = sourceModules();

    assert.isTrue(modules.has("src/model/blocks.generated.json"));
    assert.deepStrictEqual(checkAllowlist(modules, ["src/interactions/pattern.ts"]), []);
  });
});
