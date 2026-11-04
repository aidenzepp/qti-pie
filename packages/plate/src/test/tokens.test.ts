import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { contrastRatio, parseOklch, tokens } from "#plate/test/tokens.ts";

/**
 * Read a colour the table spells, failing the test when it is not an `oklch()` value.
 *
 * @param text The colour as the table writes it.
 * @returns The parsed colour.
 */
const colour = (text: string) => Option.getOrThrow(parseOklch(text));

describe("tokens", () => {
  it("holds the thirteen tokens in order, and every colour fallback parses", () => {
    assert.deepStrictEqual(
      [...tokens.keys()],
      [
        "--primary",
        "--primary-foreground",
        "--accent",
        "--accent-foreground",
        "--muted",
        "--muted-foreground",
        "--card",
        "--card-foreground",
        "--destructive",
        "--border",
        "--input",
        "--ring",
        "--radius",
      ],
    );

    for (const [name, fallback] of tokens) {
      if (name !== "--radius") {
        assert.isTrue(Option.isSome(parseOklch(fallback)), `${name}: ${fallback}`);
      }
    }

    assert.strictEqual(tokens.get("--radius"), "0.625rem");
  });
});

describe("contrastRatio", () => {
  it.each([
    ["primary, light", "oklch(0.985 0 0)", "oklch(0.205 0 0)", "17.16"],
    ["primary, dark", "oklch(0.205 0 0)", "oklch(0.922 0 0)", "14.22"],
    ["card, light", "oklch(0.145 0 0)", "oklch(1 0 0)", "19.79"],
    ["card, dark", "oklch(0.985 0 0)", "oklch(0.205 0 0)", "17.16"],
    ["placeholder, light", "oklch(0.556 0 0)", "oklch(1 0 0)", "4.73"],
    ["placeholder, dark", "oklch(0.708 0 0)", "oklch(0.205 0 0)", "6.91"],
    ["Notice, light", "oklch(0.556 0 0)", "oklch(1 0 0)", "4.73"],
    ["Notice, dark", "oklch(0.708 0 0)", "oklch(0.145 0 0)", "7.63"],
    ["qti-well text, light", "oklch(0.145 0 0)", "oklch(0.97 0 0)", "18.15"],
    ["qti-well text, dark", "oklch(0.985 0 0)", "oklch(0.269 0 0)", "14.48"],
    ["row hover, light", "oklch(0.205 0 0)", "oklch(0.97 0 0)", "16.42"],
    ["row hover, dark", "oklch(0.985 0 0)", "oklch(0.269 0 0)", "14.48"],
    ["refused Message, light", "oklch(0.577 0.245 27.325)", "oklch(1 0 0)", "4.76"],
    ["refused Message, dark", "oklch(0.704 0.191 22.216)", "oklch(0.205 0 0)", "6.19"],
    ["never set, light", "oklch(0.556 0 0)", "oklch(0.97 0 0)", "4.34"],
    ["never set, dark", "oklch(0.708 0 0)", "oklch(0.269 0 0)", "5.83"],
  ])("%s: %s on %s is %s:1", (_pair, text, surface, ratio) => {
    assert.strictEqual(contrastRatio(colour(text), colour(surface)).toFixed(2), ratio);
  });

  it("is the same with the text and the surface swapped", () => {
    assert.strictEqual(
      contrastRatio(colour("oklch(0.205 0 0)"), colour("oklch(0.985 0 0)")).toFixed(2),
      "17.16",
    );
  });
});

describe("parseOklch", () => {
  it("reads three plain numbers as lightness, chroma and hue", () => {
    assert.deepStrictEqual(
      parseOklch("oklch(0.577 0.245 27.325)"),
      Option.some({ chroma: 0.245, hue: 27.325, lightness: 0.577 }),
    );
  });

  it.each([
    ["an alpha", "oklch(1 0 0 / 10%)"],
    ["a named colour", "red"],
    ["a percentage", "oklch(50% 0 0)"],
    ["none", "oklch(none 0 0)"],
    ["two numbers", "oklch(1 0)"],
  ])("gives none for %s: %s", (_case, text) => {
    assert.isTrue(Option.isNone(parseOklch(text)));
  });
});
