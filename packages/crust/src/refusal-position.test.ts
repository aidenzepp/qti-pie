/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`, `UTF-16`) the declarations under test carry. */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { decode } from "#crust/decode.ts";
import { lexProlog, substitute } from "#crust/dtd.ts";
import type { WellFormednessError } from "#crust/errors.ts";
import { ReaderRefusal } from "#crust/errors.ts";
import { ascii, bytesOf, declared } from "#crust/test/bytes.ts";

/**
 * Decodes `input`, which must be refused, and returns the refusal.
 */
const decodeRefusal = (input: Uint8Array) => Effect.flip(decode(input));

/**
 * Lexes the prolog of `text` and substitutes its body, which must be refused, and returns the
 * refusal.
 */
const readRefusal = (text: string) =>
  Effect.flip(lexProlog(text).pipe(Effect.flatMap((prolog) => substitute(text, prolog))));

/**
 * Asserts that `error` is a `ReaderRefusal` under `rule` that carries no position.
 */
const assertUnpositioned = (
  error: ReaderRefusal | WellFormednessError,
  rule: ReaderRefusal["rule"],
) => {
  assert.instanceOf(error, ReaderRefusal);
  assert.strictEqual(error.rule, rule);
  assert.deepStrictEqual(error.position, Option.none());
};

describe("a refusal of the document as a whole carries no position", () => {
  it.effect("unsupported-encoding, for the opening bytes of UCS-4", () =>
    Effect.gen(function* ucs4Opening() {
      const error = yield* decodeRefusal(bytesOf([0x00, 0x00, 0xfe, 0xff], ascii("<a/>")));

      assertUnpositioned(error, "unsupported-encoding");
    }),
  );

  it.effect("unsupported-encoding, for a label no decoder serves", () =>
    Effect.gen(function* unknownLabel() {
      const error = yield* decodeRefusal(declared("no-such-charset", ascii("x")));

      assertUnpositioned(error, "unsupported-encoding");
    }),
  );

  it.effect("unsupported-encoding, for a label WHATWG remaps", () =>
    Effect.gen(function* remappedLabel() {
      const error = yield* decodeRefusal(declared("ISO-8859-9", ascii("x")));

      assertUnpositioned(error, "unsupported-encoding");
    }),
  );

  it.effect("encoding-mismatch, for a declared label the opening bytes rule out", () =>
    Effect.gen(function* mismatchedLabel() {
      const error = yield* decodeRefusal(declared("UTF-16", ascii("x")));

      assertUnpositioned(error, "encoding-mismatch");
    }),
  );

  it.effect("decode, for bytes a fatal TextDecoder refuses", () =>
    Effect.gen(function* malformedUtf8() {
      const error = yield* decodeRefusal(declared("UTF-8", [0xff]));

      assertUnpositioned(error, "decode");
    }),
  );

  it.effect("entity-cycle, for a general entity that refers to itself", () =>
    Effect.gen(function* selfReference() {
      const error = yield* Effect.flip(lexProlog('<!DOCTYPE a [<!ENTITY e "&e;">]><a/>'));

      assertUnpositioned(error, "entity-cycle");
    }),
  );

  it.effect("entity-expansion, for a body reference whose expansion passes the budget", () =>
    Effect.gen(function* bodyAmplification() {
      let subset = `<!ENTITY e0 "${"x".repeat(1000)}">`;
      for (let n = 1; n <= 4; n += 1) {
        subset += `<!ENTITY e${n} "${`&e${n - 1};`.repeat(10)}">`;
      }
      const error = yield* readRefusal(`<!DOCTYPE a [${subset}]><a>&e4;</a>`);

      assertUnpositioned(error, "entity-expansion");
    }),
  );
});
