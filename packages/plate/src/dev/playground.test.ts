import { readFile } from "node:fs/promises";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { browserSupport } from "#plate/ledger/browser-support.ts";
import { checkFloor, readWebFeatures } from "#plate/test/baseline.ts";
import { compounds, scanSheet, uses, varReferences } from "#plate/test/css.ts";
import type { Compound, StyleRule } from "#plate/test/css.ts";
import { tokens } from "#plate/test/tokens.ts";

/**
 * The playground's sheet, read through the package's own import alias and scanned.
 */
const sheet = Effect.gen(function* sheet() {
  const text = yield* Effect.promise(() =>
    readFile(new URL(import.meta.resolve("#plate/dev/playground.css")), "utf-8"),
  );

  return yield* scanSheet(text);
});

/**
 * Read a selector's compounds at any depth: its own, and those of every selector a `:where`,
 * `:is`, `:not` or `:has` holds, recursively.
 *
 * @param selector One selector.
 * @returns Every compound, the selector's own first in order, each followed by those its
 *   pseudo-classes hold.
 */
const deepCompounds = (selector: string): readonly Compound[] =>
  compounds(selector).flatMap((compound) => [
    compound,
    ...compound.pseudoClasses.flatMap((pseudoClass) =>
      pseudoClass.selectors.flatMap(deepCompounds),
    ),
  ]);

/**
 * Decide whether a rule draws a `button`: one of its selectors ends in a compound whose type is
 * `button`.
 *
 * @param rule A style rule.
 * @returns Whether a selector's last compound is the type `button`.
 */
const drawsButton = (rule: StyleRule): boolean =>
  rule.selectors.some((selector) =>
    Option.contains(compounds(selector).at(-1)?.type ?? Option.none(), "button"),
  );

/**
 * Decide whether a rule declares a property as a `var()` of one token alone.
 *
 * @param rule A style rule.
 * @param property The property declared.
 * @param token The token the value reads.
 * @returns Whether a declaration of the property reads that token and no other.
 */
const readsToken = (rule: StyleRule, property: string, token: string): boolean =>
  rule.declarations.some(
    (declaration) =>
      declaration.property === property &&
      varReferences(declaration.value)
        .map((reference) => reference.name)
        .join(" ") === token,
  );

describe("dev/playground.css", () => {
  it.effect("scans, and every use holds the floor", () =>
    Effect.gen(function* holdsTheFloor() {
      const scanned = yield* sheet;
      const data = yield* readWebFeatures;

      assert.isNotEmpty(scanned.rules);
      assert.deepStrictEqual(checkFloor(uses(scanned), data, browserSupport), []);
    }),
  );

  it.effect("reads only the token subset, each var() with its token's fallback", () =>
    Effect.gen(function* readsTheSubset() {
      const scanned = yield* sheet;

      for (const rule of scanned.rules) {
        for (const declaration of rule.declarations) {
          assert.isFalse(
            declaration.property.startsWith("--"),
            `declares the custom property ${declaration.property}`,
          );

          for (const reference of varReferences(declaration.value)) {
            assert.isTrue(tokens.has(reference.name), `reads ${reference.name}`);
            assert.strictEqual(
              Option.getOrUndefined(reference.fallback),
              tokens.get(reference.name),
              `${reference.name} in ${declaration.property}`,
            );
          }
        }
      }
    }),
  );

  it.effect("keys on the playground's own elements, never a data-slot, at any depth", () =>
    Effect.gen(function* namesNoMarker() {
      const scanned = yield* sheet;

      for (const selector of scanned.rules.flatMap((rule) => rule.selectors)) {
        for (const compound of deepCompounds(selector)) {
          assert.notInclude(
            compound.attributes.map((attribute) => attribute.name),
            "data-slot",
            selector,
          );
        }
      }
    }),
  );

  it.effect("draws the button in the primary pair", () =>
    Effect.gen(function* drawsThePrimaryPair() {
      const scanned = yield* sheet;
      const drawn = scanned.rules.filter(
        (rule) =>
          drawsButton(rule) &&
          readsToken(rule, "background-color", "--primary") &&
          readsToken(rule, "color", "--primary-foreground"),
      );

      assert.isNotEmpty(drawn, "no button rule reads --primary and --primary-foreground");
    }),
  );

  it.effect("gives every :focus-visible rule the 3px outline at no offset", () =>
    Effect.gen(function* drawsTheFocusOutline() {
      const scanned = yield* sheet;
      const focused = scanned.rules.filter((rule) =>
        rule.selectors.some((selector) =>
          deepCompounds(selector).some((compound) =>
            compound.pseudoClasses.some((pseudoClass) => pseudoClass.name === "focus-visible"),
          ),
        ),
      );

      assert.isNotEmpty(focused, "no rule holds :focus-visible");
      for (const rule of focused) {
        const declared = rule.declarations.map(({ property, value }) => `${property}: ${value}`);

        assert.include(declared, "outline-width: 3px", rule.selectors.join(", "));
        assert.include(declared, "outline-offset: 0", rule.selectors.join(", "));
      }
    }),
  );
});
