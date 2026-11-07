/**
 * The database tests' one spelling of a set, `#pantry/test/bits.ts`, held to the domain grizzle
 * installs for a set: a `bit(n)` over its roster's codes rounded up to whole hex digits, whose
 * CHECK keeps every bit past the last code at 0 (grizzle's skill, "setup"), read by PostgreSQL's
 * bit input function (`varbit.c` `bit_in`: a text beginning with `X` is hex, four bits a digit, the
 * most significant first, and any other a 0 or a 1 per bit; a `bit(n)` takes exactly n bits, else
 * 22026). The spelling is grizzle's own, the text it writes for a set's parameter: `X`, then one
 * digit of `0`-`9` or `A`-`F` per four codes, so a lowercase digit or a binary text, which
 * PostgreSQL would also read, is a second spelling the tests refuse.
 */
import { assert, describe, it } from "@effect/vitest";
import { AttributeSlot, Flag } from "#pantry/grammar/install.ts";
import { bitsText, bitsWidth } from "#pantry/test/bits.ts";

/**
 * Read a text as a set column of a roster of `codes` codes reads it: bit's input function, then
 * the domain's width and its CHECK against the live codes.
 *
 * @param codes - The roster's codes.
 * @param text - The text.
 * @returns The set's codes in order, or the SQLSTATE PostgreSQL refuses the text with.
 */
const domainReads = (
  codes: number,
  text: string,
): { readonly codes: readonly number[] } | { readonly refused: string } => {
  const width = Math.ceil(codes / 4) * 4;
  const hex = text.startsWith("X") || text.startsWith("x");
  const body = hex || text.startsWith("B") || text.startsWith("b") ? text.slice(1) : text;
  const bits = hex
    ? body
        .split("")
        .flatMap((digit) =>
          Number.parseInt(digit, 16).toString(2).padStart(4, "0").split("").map(Number),
        )
    : body.split("").map(Number);
  if (bits.some((bit) => Number.isNaN(bit) || (bit !== 0 && bit !== 1))) {
    return { refused: "22P02" };
  }

  if (bits.length !== width) {
    return { refused: "22026" };
  }

  if (bits.slice(codes).includes(1)) {
    return { refused: "23514" };
  }

  return { codes: bits.flatMap((bit, code) => (bit === 1 ? [code] : [])) };
};

/**
 * Whether a text is grizzle's one spelling of a set over a roster of `codes` codes: `X` and one
 * uppercase hex digit per four codes.
 *
 * @param codes - The roster's codes.
 * @param text - The text.
 * @returns Whether it is.
 */
const spelledAsGrizzle = (codes: number, text: string): boolean =>
  new RegExp(`^X[0-9A-F]{${String(Math.ceil(codes / 4))}}$`, "u").test(text);

/**
 * A roster of `codes` handles, `h0` to `h<codes - 1>`.
 *
 * @param codes - Its size.
 * @returns The roster.
 */
const rosterOf = (codes: number) => ({
  handles: Array.from({ length: codes }, (_, code) => `h${String(code)}`),
});

describe("a set's text in the database tests", () => {
  it("spells every set of every roster of one to nine codes as the domain reads it back", () => {
    // Oracle: bit's input function and the domain grizzle installs, restated above.
    // Bound: the small scope exhausted, every subset of rosters of 1 to 9 codes (1,022 sets),
    // the sizes that are no multiple of 4 among them, so the padding is held in each.
    for (let codes = 1; codes <= 9; codes += 1) {
      const roster = rosterOf(codes);
      assert.strictEqual(bitsWidth(roster), Math.ceil(codes / 4) * 4);
      for (let mask = 0; mask < 2 ** codes; mask += 1) {
        const members = roster.handles.filter((_, code) => Math.floor(mask / 2 ** code) % 2 === 1);
        const text = bitsText(roster, members);

        assert.isTrue(spelledAsGrizzle(codes, text), `${String(codes)} codes: ${text}`);
        assert.deepStrictEqual(
          domainReads(codes, text),
          { codes: members.map((member) => roster.handles.indexOf(member)) },
          `${String(codes)} codes, ${members.join(" ")}: ${text}`,
        );
      }
    }
  });

  it("spells the installed rosters' sets at their domains' widths, AttributeSlot's bit(112) and Flag's bit(12)", () => {
    // Oracle: the domains the regenerated _init installs for the two sets the database tests
    // write, `__attribute_slot_bits_112_…` (N2's tier on grizzle 4b155e8) and Flag's, rounded up
    // from 110 and 10 codes.
    // Bound: each roster's empty set, its full set, and each one-handle set.
    for (const [roster, width] of [
      [AttributeSlot, 112],
      [Flag, 12],
    ] as const) {
      const handles: readonly string[] = roster.handles;
      assert.strictEqual(bitsWidth(roster), width);
      for (const members of [[], handles, ...handles.map((handle) => [handle])]) {
        const text = bitsText(roster, members);

        assert.isTrue(spelledAsGrizzle(handles.length, text), text);
        assert.deepStrictEqual(domainReads(handles.length, text), {
          codes: members.map((member) => handles.indexOf(member)),
        });
      }
    }
  });

  it("refuses a handle the roster does not hold", () => {
    assert.throws(() => {
      bitsText(rosterOf(3), ["h3"]);
    }, /h3 is no handle of the roster/u);
  });
});
