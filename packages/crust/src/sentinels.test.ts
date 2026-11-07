/**
 * The sentinel scan, held to the walk it replaced: the per-code-point walk `read.ts`'s
 * `scanReferences` ran at 1ee51d8d, which built a string for every code point of a document, over
 * the private use area as The Unicode Standard bounds it. Both must find the same sentinel-range
 * code points in every string: every short string over the code units around the range and the
 * surrogates, and generated strings dense with sentinels, lone surrogates and astral characters
 * under swarm weights.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { SENTINEL_FIRST, SENTINEL_LAST, sentinelsWritten } from "#crust/sentinels.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 0.6 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * The first code point of the Basic Multilingual Plane's private use area, as the Unicode Character
 * Database's `Blocks.txt` bounds it (`E000..F8FF; Private Use Area`). The oracle reads the area
 * from Unicode, not from `sentinels.ts`, so a moved bound of the module's range fails the box at
 * the bound it moved.
 */
const PRIVATE_USE_FIRST = 0xe0_00;

/**
 * The last code point of the Basic Multilingual Plane's private use area, as `Blocks.txt` bounds
 * it.
 */
const PRIVATE_USE_LAST = 0xf8_ff;

/**
 * The oracle: the walk `scanReferences` ran before, over every code point of the text.
 *
 * @param text - The text.
 * @returns The private use area's code points it holds.
 */
const walked = (text: string): ReadonlySet<number> => {
  const used = new Set<number>();
  for (const character of text) {
    const point = character.codePointAt(0) ?? 0;
    if (point >= PRIVATE_USE_FIRST && point <= PRIVATE_USE_LAST) {
      used.add(point);
    }
  }

  return used;
};

/**
 * Hold the scan to the walk on one text.
 *
 * @param text - The text.
 * @param what - The text's name, for the failure.
 */
const agrees = (text: string, what: string): void => {
  assert.deepStrictEqual(
    [...sentinelsWritten(text)].toSorted((left, right) => left - right),
    [...walked(text)].toSorted((left, right) => left - right),
    what,
  );
};

/**
 * What a text holds that the scan could misread.
 */
const situations = [
  "a sentinel",
  "the range's first",
  "the range's last",
  "a unit just outside the range",
  "a lone high surrogate",
  "a lone low surrogate",
  "an astral character",
  "no sentinel",
] as const;

/**
 * A {@link situations} member.
 */
type Situation = (typeof situations)[number];

/**
 * The situations a text reaches.
 *
 * @param text - The text.
 * @returns Each situation it reaches.
 */
const situationsOf = (text: string): readonly Situation[] => {
  const points = Array.from(text, (character) => character.codePointAt(0) ?? 0);
  const reached: readonly (readonly [Situation, boolean])[] = [
    ["a sentinel", walked(text).size > 0],
    ["the range's first", points.includes(SENTINEL_FIRST)],
    ["the range's last", points.includes(SENTINEL_LAST)],
    [
      "a unit just outside the range",
      points.includes(SENTINEL_FIRST - 1) || points.includes(SENTINEL_LAST + 1),
    ],
    // A lone surrogate is a code point of its own to the walk; a pair is one astral code point.
    ["a lone high surrogate", points.some((point) => point >= 0xd8_00 && point <= 0xdb_ff)],
    ["a lone low surrogate", points.some((point) => point >= 0xdc_00 && point <= 0xdf_ff)],
    ["an astral character", points.some((point) => point > 0xff_ff)],
    ["no sentinel", walked(text).size === 0],
  ];

  return reached.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

/**
 * The code units the small box is spelled from: a letter, the units on each side of the range's
 * bounds, a high and a low surrogate (which make U+1F600 together), and the low surrogates' last.
 */
const boxUnits = [
  0x41,
  SENTINEL_FIRST - 1,
  SENTINEL_FIRST,
  SENTINEL_FIRST + 1,
  SENTINEL_LAST - 1,
  SENTINEL_LAST,
  SENTINEL_LAST + 1,
  0xd8_3d,
  0xde_00,
  0xdb_ff,
] as const;

/**
 * Every string of up to three of the box's code units.
 */
const BOX_STRINGS = 1 + 10 + 100 + 1000;

/**
 * The classes of code point a generated text is drawn from, each a swarm feature.
 */
const classes = {
  ascii: (source: Parameters<Gen<string>>[0]) => String.fromCodePoint(source.draw(int(0x20, 0x7e))),
  astral: (source: Parameters<Gen<string>>[0]) =>
    String.fromCodePoint(source.draw(int(0x1_00_00, 0x10_ff_ff))),
  bmp: (source: Parameters<Gen<string>>[0]) =>
    String.fromCodePoint(source.draw(int(0xa0, 0xd7_ff))),
  bound: (source: Parameters<Gen<string>>[0]) =>
    String.fromCodePoint(
      source.draw(
        element([SENTINEL_FIRST - 1, SENTINEL_FIRST, SENTINEL_LAST, SENTINEL_LAST + 1] as const),
      ),
    ),
  loneHigh: (source: Parameters<Gen<string>>[0]) =>
    String.fromCodePoint(source.draw(int(0xd8_00, 0xdb_ff))),
  loneLow: (source: Parameters<Gen<string>>[0]) =>
    String.fromCodePoint(source.draw(int(0xdc_00, 0xdf_ff))),
  sentinel: (source: Parameters<Gen<string>>[0]) =>
    String.fromCodePoint(source.draw(int(SENTINEL_FIRST, SENTINEL_LAST))),
} as const;

/**
 * The classes in the order a swarm draws them.
 */
const classNames = [
  "ascii",
  "sentinel",
  "bound",
  "loneHigh",
  "loneLow",
  "astral",
  "bmp",
] as const satisfies readonly (keyof typeof classes)[];

/**
 * Draw a text under a swarm: up to 64 code points, each of a class the swarm turns on.
 *
 * @param mix - The case's swarm.
 * @returns The generator.
 */
const textOf =
  (mix: Swarm<(typeof classNames)[number]>): Gen<string> =>
  (source) => {
    const length = source.draw(int(0, 64));
    let text = "";
    for (let at = 0; at < length; at += 1) {
      text += classes[source.draw(swarmChoice(mix, classNames))](source);
    }

    return text;
  };

/**
 * Draw a text under a fresh swarm.
 */
const drawnText: Gen<string> = (source) => textOf(source.draw(swarm(classNames)))(source);

describe("the sentinel scan, against the walk it replaced", () => {
  it.effect(
    "finds the same code points in every string of up to three units around the range and the surrogates",
    (ctx) =>
      // Oracle: the walk the scan replaced (`walked`). Bound: every string of 0 to 3 of the 10
      // box units; residual: longer strings, which the search below draws.
      searched(
        ctx,
        exhaust(
          {
            box: "every string of up to 3 code units over the range's bounds, their neighbours, a letter and the surrogates",
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<Situation>([
              "a sentinel",
              "the range's first",
              "the range's last",
              "a unit just outside the range",
              "a lone high surrogate",
              "a lone low surrogate",
              "an astral character",
              "no sentinel",
            ]),
            generator: array(element(boxUnits), { max: 3, min: 0 }),
            limit: BOX_STRINGS,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "the per-code-point walk it replaced" },
            suite: "crust/sentinels/box",
          },
          (units, c) =>
            Effect.sync(() => {
              const text = String.fromCodePoint(...units);
              c.noteAll(situationsOf(text));
              agrees(text, JSON.stringify(units));
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, BOX_STRINGS);
          }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "finds the same code points in generated texts dense with sentinels, lone surrogates and astral characters, searched under swarm weights",
    (ctx) =>
      // Oracle: the walk the scan replaced (`walked`). The search must reach each situation.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(1),
            concurrency: 1,
            coverage: required<Situation>(situations, { cases: 300, sense: notesOnly }),
            draw: drawn(drawnText),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "the per-code-point walk it replaced" },
            runs: 600,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "crust/sentinels/texts",
          },
          (text, c) =>
            Effect.sync(() => {
              c.noteAll(situationsOf(text));
              agrees(text, JSON.stringify(text));
            }),
        ),
      ),
    testTimeoutMs,
  );
});
