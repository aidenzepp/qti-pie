import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import type { AnyClosed } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * The most codes one law's cell packs: each code takes 16 bits of an `int8` (fin.md §12, entry
 * 12), so a cell holds four. A law packs the key digits it indexes by; it reads a payload by
 * function application at that index (fin.md §17, "One representation"), never in the cell.
 */
const cellCodes = 4;

/**
 * The most values one code space may hold: a code is 16 bits of the cell.
 */
const codeSpace = 2 ** 16;

/**
 * The most bits one PostgreSQL bit string holds, `VARBITMAXLEN` (19rc1,
 * `src/include/utils/varbit.h:83`).
 */
const varbitMaxBits = 2_147_483_647 - 7;

/**
 * A closed relation as the size laws read it: its constant's shape, whatever its fields.
 */
type Constant = Pick<AnyClosed, "bytes" | "cells" | "key" | "name" | "payload" | "width">;

/**
 * Every closed relation of the composition a law or a reader reads.
 *
 * @param composedGrammar - The composed grammar.
 * @returns The relations.
 */
const constantsOf = (composedGrammar: ComposedGrammar): readonly Constant[] => [
  composedGrammar.admission,
  composedGrammar.content.follow,
  composedGrammar.content.last,
  composedGrammar.content.symbol,
  composedGrammar.content.counted,
  composedGrammar.content.strictlyHeld,
  composedGrammar.barredBy,
  composedGrammar.ancestry.enters,
  composedGrammar.ancestry.banned,
  composedGrammar.ancestry.needs,
  composedGrammar.kinds.interaction,
  composedGrammar.kinds.isElement,
  composedGrammar.attributes.admission,
  composedGrammar.attributes.text,
  composedGrammar.attributes.governor,
  composedGrammar.attributes.governed,
  composedGrammar.attributes.typeText,
  composedGrammar.operatorArity,
  composedGrammar.bindingFit,
  composedGrammar.recordBindingFit,
  composedGrammar.mappableBaseType,
  composedGrammar.package.resourceTypeOf,
  composedGrammar.package.rootOfType,
];

/**
 * The size of a field's code space at its widest: a roster's handles, or an open field's values.
 *
 * @param field - The field.
 * @returns The size.
 */
const widthOf = (field: Constant["key"][number] | Constant["payload"][number]): number =>
  field._tag === "value" ? field.values.length : field.roster.handles.length;

describe("the constants", () => {
  it.effect(
    "size each string by §17's formulas: cells the product of the key's spaces (summed over prefixes for a dependent field), width the bits of 1 + the payload space, bytes ⌈cells · width / 8⌉ + 8",
    (ctx) =>
      Effect.gen(function* sizes() {
        const constants = constantsOf(yield* grammar);
        for (const { bytes, cells, key, name, payload, width } of constants) {
          const payloadPoints = payload.reduce((product, field) => product * widthOf(field), 1);
          if (key.every((field) => field._tag !== "dependent")) {
            assert.strictEqual(
              cells,
              key.reduce((product, field) => product * widthOf(field), 1),
              name,
            );
          } else {
            assert.isAtMost(
              cells,
              key.reduce((product, field) => product * widthOf(field), 1),
              name,
            );
          }

          assert.strictEqual(
            2 ** width >= 1 + payloadPoints && 2 ** (width - 1) < 1 + payloadPoints,
            true,
            name,
          );
          assert.strictEqual(bytes, Math.ceil((cells * width) / 8) + 8, name);
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            constants
              .map(({ bytes, cells, name, width }) => `${name} ${cells}×${width} ${bytes} B`)
              .join("; "),
            "sizes",
          ),
        );
      }),
  );

  it.effect(
    "index by at most four key codes, each code space within 16 bits, each string within one bit string",
    () =>
      Effect.gen(function* caps() {
        const constants = constantsOf(yield* grammar);

        assert.deepStrictEqual(
          constants.filter(({ key }) => key.length > cellCodes).map(({ name }) => name),
          [],
        );
        assert.deepStrictEqual(
          constants.flatMap(({ key, name, payload }) =>
            [...key, ...payload]
              .filter((field) => widthOf(field) > codeSpace)
              .map((field) => `${name}.${field.name}`),
          ),
          [],
        );
        assert.deepStrictEqual(
          constants
            .filter(({ cells, width }) => cells * width > varbitMaxBits)
            .map(({ name }) => name),
          [],
        );
      }),
  );
});
