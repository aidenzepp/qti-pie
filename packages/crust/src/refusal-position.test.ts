/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`, `UTF-16`) the declarations under test carry. */
import { describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { decode } from "#crust/decode.ts";
import { lexProlog, substitute } from "#crust/dtd.ts";
import { ascii, bytesOf, declared } from "#crust/test/bytes.ts";
import { assertRefusal } from "#crust/test/refusal.ts";

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

describe("a refusal of the document as a whole carries no position", () => {
  it.effect("unsupported-encoding, for the opening bytes of UCS-4", () =>
    Effect.gen(function* ucs4Opening() {
      const error = yield* decodeRefusal(bytesOf([0x00, 0x00, 0xfe, 0xff], ascii("<a/>")));

      assertRefusal(error, "unsupported-encoding", Option.none());
    }),
  );

  it.effect("unsupported-encoding, for a label no decoder serves", () =>
    Effect.gen(function* unknownLabel() {
      const error = yield* decodeRefusal(declared("no-such-charset", ascii("x")));

      assertRefusal(error, "unsupported-encoding", Option.none());
    }),
  );

  it.effect("unsupported-encoding, for a label WHATWG remaps", () =>
    Effect.gen(function* remappedLabel() {
      const error = yield* decodeRefusal(declared("ISO-8859-9", ascii("x")));

      assertRefusal(error, "unsupported-encoding", Option.none());
    }),
  );

  it.effect("encoding-mismatch, for a declared label the opening bytes rule out", () =>
    Effect.gen(function* mismatchedLabel() {
      const error = yield* decodeRefusal(declared("UTF-16", ascii("x")));

      assertRefusal(error, "encoding-mismatch", Option.none());
    }),
  );

  it.effect("decode, for bytes a fatal TextDecoder refuses", () =>
    Effect.gen(function* malformedUtf8() {
      const error = yield* decodeRefusal(declared("UTF-8", [0xff]));

      assertRefusal(error, "decode", Option.none());
    }),
  );

  it.effect("entity-cycle, for a general entity that refers to itself", () =>
    Effect.gen(function* selfReference() {
      const error = yield* Effect.flip(lexProlog('<!DOCTYPE a [<!ENTITY e "&e;">]><a/>'));

      assertRefusal(error, "entity-cycle", Option.none());
    }),
  );

  it.effect("entity-expansion, for a body reference whose expansion passes the budget", () =>
    Effect.gen(function* bodyAmplification() {
      let subset = `<!ENTITY e0 "${"x".repeat(1000)}">`;
      for (let n = 1; n <= 4; n += 1) {
        subset += `<!ENTITY e${n} "${`&e${n - 1};`.repeat(10)}">`;
      }
      const error = yield* readRefusal(`<!DOCTYPE a [${subset}]><a>&e4;</a>`);

      assertRefusal(error, "entity-expansion", Option.none());
    }),
  );
});
