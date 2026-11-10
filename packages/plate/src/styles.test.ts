import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { assert, describe, it, layer } from "@effect/vitest";
import { Context, Effect, Layer, Option, Record as Rec } from "effect";
import { partForSlot, partTable, rowFor } from "#plate/emit/parts.ts";
import { browserSupport } from "#plate/ledger/browser-support.ts";
import { checkFloor, readWebFeatures } from "#plate/test/baseline.ts";
import type { FloorViolation, WebFeatures } from "#plate/test/baseline.ts";
import { compounds, compoundsDeep, scanSheet, uses, varReferences } from "#plate/test/css.ts";
import type { Compound, Sheet, StyleRule } from "#plate/test/css.ts";
import { contrastRatio, parseOklch, tokens } from "#plate/test/tokens.ts";
import { behaviourClasses, styledClasses } from "#plate/vocabulary.ts";
import type { ClassOwner } from "#plate/vocabulary.ts";

/**
 * The markers the stylesheet's rules are read against, from the part table: the item Root, the
 * Choice parts, the text Controls, the Inline Choice's Root and Control, the results box, the
 * Notice and the navigation's item button.
 */
const marker = {
  choice: rowFor("choice-interaction", "choice").slot,
  choiceRoot: rowFor("choice-interaction", "root").slot,
  control: rowFor("choice-interaction", "control").slot,
  extendedTextControl: rowFor("extended-text-interaction", "control").slot,
  indicator: rowFor("choice-interaction", "indicator").slot,
  inlineChoiceControl: rowFor("inline-choice-interaction", "control").slot,
  inlineChoiceRoot: rowFor("inline-choice-interaction", "root").slot,
  item: rowFor("item", "root").slot,
  itemButton: rowFor("test-navigation", "itemButton").slot,
  message: rowFor("item", "message").slot,
  notice: rowFor("item", "notice").slot,
  prompt: rowFor("choice-interaction", "prompt").slot,
  status: rowFor("item", "status").slot,
  textEntryControl: rowFor("text-entry-interaction", "control").slot,
};

/**
 * The text Controls: Text Entry's `input` and Extended Text's `textarea`.
 */
const textControls: readonly string[] = [marker.textEntryControl, marker.extendedTextControl];

/**
 * The navigation parts' markers, every row of the `test-navigation` component.
 */
const navigationMarkers: readonly string[] = partTable
  .filter((row) => row.interaction === "test-navigation")
  .map((row) => row.slot);

/**
 * The navigation buttons' markers: Previous, Next, an item's button, Submit and End.
 */
const navigationButtons: readonly string[] = (
  ["previous", "next", "itemButton", "submit", "end"] as const
).map((part) => rowFor("test-navigation", part).slot);

/**
 * The line that opens the base section, the QTI vocabulary classes.
 */
const baseLine = "/* == base: QTI vocabulary classes == */";

/**
 * The line that opens the theme section, the look on the part markers.
 */
const themeLine = "/* == theme: plate's default theme, on the part markers == */";

/**
 * The only attribute names a selector may test: `data-slot`, the part marker; `data-mode` and
 * `data-disabled`, the Root's state; `aria-invalid` and `type` on a Control; `data-orientation`,
 * the authored orientation on the Choice Root; `aria-current`, which the current item's button
 * carries; and `readonly`, which a text Control carries in review and solution.
 */
const attributeNames: ReadonlySet<string> = new Set([
  "aria-current",
  "aria-invalid",
  "data-disabled",
  "data-mode",
  "data-orientation",
  "data-slot",
  "readonly",
  "type",
]);

/**
 * The only type selectors, the elements the part table pins: the Controls, the Prompt's legend
 * shape and the Choice Root.
 */
const typeNames: ReadonlySet<string> = new Set(["fieldset", "input", "legend", "textarea"]);

/**
 * The only pseudo-classes: the four that hold selectors, and the four states the sheet reads
 * (never `:invalid`, `:valid`, `:user-invalid` or `:user-valid`).
 */
const pseudoClassNames: ReadonlySet<string> = new Set([
  "checked",
  "disabled",
  "focus-visible",
  "has",
  "hover",
  "is",
  "not",
  "where",
]);

/**
 * The surface a rule's text sits on when the rule sets no background: shadcn's default
 * `--background`, which the host owns.
 */
const hostSurface = "oklch(1 0 0)";

/**
 * The least contrast between text and its surface, WCAG 2.2 AA for normal text (1.4.3).
 */
const minimumContrast = 4.5;

/**
 * Shadcn's `.dark` values of the colour tokens the sheet reads, from the theming file the sheet's
 * header names (`theming.mdx:239-271` at `4aaea19`), in the order of `tokens`; `.dark` sets no
 * `--radius`.
 */
const darkTokens: ReadonlyMap<string, string> = new Map([
  ["--primary", "oklch(0.922 0 0)"],
  ["--primary-foreground", "oklch(0.205 0 0)"],
  ["--accent", "oklch(0.269 0 0)"],
  ["--accent-foreground", "oklch(0.985 0 0)"],
  ["--muted", "oklch(0.269 0 0)"],
  ["--muted-foreground", "oklch(0.708 0 0)"],
  ["--card", "oklch(0.205 0 0)"],
  ["--card-foreground", "oklch(0.985 0 0)"],
  ["--destructive", "oklch(0.704 0.191 22.216)"],
  ["--border", "oklch(1 0 0 / 10%)"],
  ["--input", "oklch(1 0 0 / 15%)"],
  ["--ring", "oklch(0.556 0 0)"],
]);

/**
 * Token values a contrast is measured under, with the host's surface beneath them.
 */
interface Palette {
  /**
   * The palette's name, as a report names it.
   */
  readonly name: string;
  /**
   * The host's surface, shadcn's `--background` in the same block, where no rule paints one.
   */
  readonly surface: string;
  /**
   * Each token's value.
   */
  readonly tokens: ReadonlyMap<string, string>;
}

/**
 * The palettes a nested pair is measured under: the fallbacks on shadcn's light `--background`, and
 * shadcn's `.dark` values on its dark `--background` (`theming.mdx:240`).
 */
const palettes: readonly Palette[] = [
  { name: "fallbacks", surface: hostSurface, tokens },
  { name: ".dark", surface: "oklch(0.145 0 0)", tokens: darkTokens },
];

/**
 * The condition of the rules that undo the drawn mark when forced colours drop its backgrounds.
 */
const forcedColors = "@media (forced-colors: active)";

/**
 * The predefined counter styles the label classes name: `qti-labels-decimal`, `-lower-alpha`,
 * `-upper-alpha` and `-cjk-ideographic`.
 */
const counterStyles: ReadonlySet<string> = new Set([
  "cjk-ideographic",
  "decimal",
  "lower-alpha",
  "upper-alpha",
]);

/**
 * The vocabulary class that hides the Choice's Controls from sight, never from assistive
 * technology (`vocab.txt:4739-4785`).
 */
const hiddenControlClass = "qti-input-control-hidden";

/**
 * The properties that mark a part by its shape, weight or line, which forced colours keep and a
 * reader who cannot tell colours apart still sees, unlike a colour, a background or an opacity.
 */
const markProperties: ReadonlySet<string> = new Set([
  "border-style",
  "border-width",
  "font-style",
  "font-weight",
  "text-decoration-line",
]);

/**
 * The modes in which the candidate changes no response, which a Root names in `data-mode`.
 */
const readingModes = ["review", "solution"] as const;

/**
 * A quoted string in CSS text, double or single, with its escapes.
 */
const quotedStrings = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/gu;

/**
 * Read a selector's subject compounds: its last compound and, when that compound holds `:where()`
 * or `:is()`, the subject compounds of each selector in the argument, recursively.
 *
 * @param selector One selector.
 * @returns The compounds the selector matches an element by.
 */
const subjectCompounds = (selector: string): readonly Compound[] => {
  const last = compounds(selector).at(-1);
  if (last === undefined) {
    return [];
  }

  return [
    last,
    ...last.pseudoClasses
      .filter((pseudoClass) => pseudoClass.name === "where" || pseudoClass.name === "is")
      .flatMap((pseudoClass) => pseudoClass.selectors.flatMap(subjectCompounds)),
  ];
};

/**
 * Tell whether a compound tests an attribute for one value.
 *
 * @param compound One compound.
 * @param name The attribute's name.
 * @param value The value.
 * @returns Whether the compound holds `[<name>="<value>"]`.
 */
const holdsEquals = (compound: Compound, name: string, value: string): boolean =>
  compound.attributes.some(
    (test) =>
      test.name === name &&
      Option.contains(test.operator, "=") &&
      Option.contains(test.value, value),
  );

/**
 * Tell whether a compound tests an attribute's presence.
 *
 * @param compound One compound.
 * @param name The attribute's name.
 * @returns Whether the compound holds `[<name>]`.
 */
const holdsPresence = (compound: Compound, name: string): boolean =>
  compound.attributes.some((test) => test.name === name && Option.isNone(test.operator));

/**
 * Tell whether a compound tests for a part's marker.
 *
 * @param compound One compound.
 * @param slot The part's `data-slot` marker.
 * @returns Whether the compound holds `[data-slot="<slot>"]`.
 */
const holdsSlot = (compound: Compound, slot: string): boolean =>
  holdsEquals(compound, "data-slot", slot);

/**
 * Tell whether a compound holds a pseudo-class.
 *
 * @param compound One compound.
 * @param name The pseudo-class's name, without its colon.
 * @returns Whether the compound holds `:<name>`.
 */
const holdsPseudoClass = (compound: Compound, name: string): boolean =>
  compound.pseudoClasses.some((pseudoClass) => pseudoClass.name === name);

/**
 * Tell whether a compound tests for a validation verdict.
 *
 * @param compound One compound.
 * @returns Whether the compound holds `[aria-invalid="true"]`.
 */
const holdsInvalid = (compound: Compound): boolean => holdsEquals(compound, "aria-invalid", "true");

/**
 * Read the selectors of every `:has()` a selector holds, at any depth.
 *
 * @param selector One selector.
 * @returns Each selector of each `:has()` argument.
 */
const hasArguments = (selector: string): readonly string[] =>
  compoundsDeep(selector).flatMap((compound) =>
    compound.pseudoClasses
      .filter((pseudoClass) => pseudoClass.name === "has")
      .flatMap((pseudoClass) => pseudoClass.selectors),
  );

/**
 * Tell whether a rule holds a compound that passes a test, at any depth of any of its selectors.
 *
 * @param rule One rule.
 * @param passes What the compound must hold.
 * @returns Whether some compound of the rule passes.
 */
const holdsAnywhere = (rule: StyleRule, passes: (compound: Compound) => boolean): boolean =>
  rule.selectors.some((selector) => compoundsDeep(selector).some(passes));

/**
 * Tell whether a rule reaches a part: a subject compound of one of its selectors holds the part's
 * marker.
 *
 * @param rule One rule.
 * @param slot The part's marker.
 * @returns Whether the rule styles the part.
 */
const reaches = (rule: StyleRule, slot: string): boolean =>
  rule.selectors.some((selector) =>
    subjectCompounds(selector).some((compound) => holdsSlot(compound, slot)),
  );

/**
 * Tell whether a selector reaches the Choice Control through its row in a state: a subject compound
 * holds the row's marker and a `:has()` whose argument's last compound holds the Control's marker
 * and passes `state`.
 *
 * @param selector One selector.
 * @param state What the Control's compound must also hold.
 * @returns Whether the selector styles the row by its Control's state.
 */
const reachesControlThroughRow = (selector: string, state: (compound: Compound) => boolean) =>
  subjectCompounds(selector).some(
    (compound) =>
      holdsSlot(compound, marker.choice) &&
      compound.pseudoClasses
        .filter((pseudoClass) => pseudoClass.name === "has")
        .flatMap((pseudoClass) => pseudoClass.selectors)
        .some((argument) => {
          const last = compounds(argument).at(-1);

          return last !== undefined && holdsSlot(last, marker.control) && state(last);
        }),
  );

/**
 * Read the declared value of a property in a rule.
 *
 * @param rule One rule.
 * @param property The property's name.
 * @returns The last value the rule declares for it, or none.
 */
const declared = (rule: StyleRule, property: string): Option.Option<string> =>
  Option.fromUndefinedOr(
    rule.declarations.findLast((declaration) => declaration.property === property)?.value,
  );

/**
 * Read the token a property's value takes, when it is a `var()` of a token.
 *
 * @param rule One rule.
 * @param property The property's name.
 * @returns The fallback of the value's first `var()` when that `var()` names a token; none when the
 *   rule does not declare the property, or declares it without a token, or the `var()` has no
 *   fallback.
 */
const tokenFallback = (rule: StyleRule, property: string): Option.Option<string> =>
  declared(rule, property).pipe(
    Option.flatMap((value) => Option.fromUndefinedOr(varReferences(value)[0])),
    Option.filter((reference) => tokens.has(reference.name)),
    Option.flatMap((reference) => reference.fallback),
  );

/**
 * Read the token a property's value takes, by name.
 *
 * @param rule One rule.
 * @param property The property's name.
 * @returns The name of the value's first `var()`; none when the rule does not declare the
 *   property, or declares it without a `var()`.
 */
const tokenName = (rule: StyleRule, property: string): Option.Option<string> =>
  declared(rule, property).pipe(
    Option.flatMap((value) => Option.fromUndefinedOr(varReferences(value)[0])),
    Option.map((reference) => reference.name),
  );

/**
 * Tell whether a rule declares a property, with any value or with one value.
 *
 * @param rule One rule.
 * @param property The property's name.
 * @param value The value it must have; any value when absent.
 * @returns Whether one of the rule's declarations matches.
 */
const declares = (rule: StyleRule, property: string, value?: string): boolean =>
  rule.declarations.some(
    (declaration) =>
      declaration.property === property && (value === undefined || declaration.value === value),
  );

/**
 * Read a length in px.
 *
 * @param value A declared value.
 * @returns The length in px when the value is `<number>px` or `0`; none otherwise.
 */
const pxLength = (value: string): Option.Option<number> =>
  value === "0"
    ? Option.some(0)
    : Option.fromUndefinedOr(/^(?<length>\d+(?:\.\d+)?)px$/u.exec(value)?.groups?.["length"]).pipe(
        Option.map(Number),
      );

/**
 * Check the sheet's uses against the browser floor, with the browser-support note's rows.
 *
 * @param sheet The scanned sheet.
 * @param data The pinned web-features data.
 * @returns The floor violations; none when the sheet holds the floor.
 */
const floorViolations = (sheet: Sheet, data: WebFeatures): readonly FloorViolation[] =>
  checkFloor(uses(sheet), data, browserSupport);

/**
 * Find the declarations the sheet must not make: a custom property, an `!important`, and motion.
 *
 * @param sheet The scanned sheet.
 * @returns Each offending declaration, as `property: value`.
 */
const forbiddenDeclarations = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .flatMap((rule) => rule.declarations)
    .filter(
      (declaration) =>
        declaration.property.startsWith("--") ||
        declaration.important ||
        declaration.property.startsWith("transition") ||
        declaration.property.startsWith("animation"),
    )
    .map((declaration) => `${declaration.property}: ${declaration.value}`);

/**
 * Find the `var()` references that name no token or carry a fallback other than the token's.
 *
 * @param sheet The scanned sheet.
 * @returns Each offending reference, as `name, fallback`.
 */
const strayReferences = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .flatMap((rule) => rule.declarations)
    .flatMap((declaration) => varReferences(declaration.value))
    .filter((reference) => !Option.contains(reference.fallback, tokens.get(reference.name)))
    .map((reference) => `${reference.name}, ${Option.getOrElse(reference.fallback, () => "")}`);

/**
 * Find the names a selector may not use, at any depth: a marker no part carries, an attribute
 * outside {@link attributeNames}, a type outside the four, a class that is not a `qti-*` vocabulary
 * class (so never `dark`), and `:root`.
 *
 * @param sheet The scanned sheet.
 * @returns Each offending name, as `<kind> <name>`.
 */
const strayNames = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .flatMap((rule) => rule.selectors)
    .flatMap(compoundsDeep)
    .flatMap((compound) => [
      ...compound.attributes.flatMap((test) => [
        ...(attributeNames.has(test.name) ? [] : [`attribute ${test.name}`]),
        ...(test.name === "data-slot" &&
        !Option.exists(test.value, (slot) => Option.isSome(partForSlot(slot)))
          ? [`marker ${Option.getOrElse(test.value, () => "")}`]
          : []),
      ]),
      ...Option.match(compound.type, {
        onNone: () => [],
        onSome: (type) => (typeNames.has(type) ? [] : [`type ${type}`]),
      }),
      ...compound.classes.filter((name) => !name.startsWith("qti-")).map((name) => `class ${name}`),
      ...compound.pseudoClasses
        .filter((pseudoClass) => pseudoClass.name === "root")
        .map(() => "pseudo-class root"),
    ]);

/**
 * Find the selectors that hold a child or sibling combinator, inside `:has()` or out.
 *
 * @param sheet The scanned sheet.
 * @returns Each selector that holds `>`, `+` or `~` once its quoted strings are removed.
 */
const combinatorSelectors = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .flatMap((rule) => rule.selectors)
    .filter((selector) => /[>+~]/u.test(selector.replaceAll(quotedStrings, "")));

/**
 * Find the rules whose text colour, a token, falls below 4.5:1 against the rule's own background
 * token, or against the host's surface when the rule sets none. Rules reaching the Indicator are
 * left out: its colour draws a mark, not text.
 *
 * @param sheet The scanned sheet.
 * @returns Each offending rule's selectors, joined by commas.
 */
const lowContrastRules = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .filter((rule) => !reaches(rule, marker.indicator))
    .filter((rule) =>
      Option.match(tokenFallback(rule, "color"), {
        onNone: () => false,
        onSome: (text) => {
          const surface = Option.getOrElse(
            tokenFallback(rule, "background-color"),
            () => hostSurface,
          );
          const ratio = Option.zipWith(parseOklch(text), parseOklch(surface), contrastRatio);

          return !Option.exists(ratio, (value) => value >= minimumContrast);
        },
      }),
    )
    .map((rule) => rule.selectors.join(", "));

/**
 * Read the token a part's rules set a property to: the `var()` of the last top-level rule that
 * reaches the part and declares the property.
 *
 * @param sheet The scanned sheet.
 * @param slot The part's marker.
 * @param property The property's name.
 * @returns The token's name; none when no such rule declares the property, or declares it without
 *   a `var()`.
 */
const partToken = (sheet: Sheet, slot: string, property: string): Option.Option<string> =>
  Option.fromUndefinedOr(
    sheet.rules.findLast(
      (rule) => rule.conditions.length === 0 && reaches(rule, slot) && declares(rule, property),
    ),
  ).pipe(Option.flatMap((rule) => tokenName(rule, property)));

/**
 * Read the surfaces the sheet paints that a Notice can sit in. The emitter puts a Notice where an
 * unsupported element stood, at any depth of the item body, so it can sit in anything that holds
 * content: a `qti-well`, a Choice row under the pointer, and every other painted part. Rules
 * reaching the Notice, the Indicator or a Control are left out: the Notice's own surface is not one
 * it sits in, and those parts hold no element.
 *
 * @param sheet The scanned sheet.
 * @returns Each surface's token once, in the sheet's order; the host's surface is not among them.
 */
const noticeSurfaces = (sheet: Sheet): readonly string[] => {
  const empty = [
    marker.notice,
    marker.indicator,
    marker.control,
    marker.textEntryControl,
    marker.extendedTextControl,
  ];

  return [
    ...new Set(
      sheet.rules
        .filter((rule) => !empty.some((slot) => reaches(rule, slot)))
        .flatMap((rule) => Option.toArray(tokenName(rule, "background-color"))),
    ),
  ];
};

/**
 * Find the pairs the Notice's text makes below 4.5:1, under each palette, on the host's surface and
 * in each surface it can sit in. Its text sits on its own background when it declares one, and on
 * the surface around it when it does not, so an ancestor's surface then decides its pair.
 *
 * @param sheet The scanned sheet.
 * @returns Each low pair, as `<palette>, in <surface>: <ratio>:1`, with `none` for a pair whose
 *   colours do not resolve.
 */
const lowNoticePairs = (sheet: Sheet): readonly string[] => {
  const text = partToken(sheet, marker.notice, "color");
  const own = partToken(sheet, marker.notice, "background-color");
  const surfaces = [Option.none<string>(), ...noticeSurfaces(sheet).map(Option.some)];

  return palettes.flatMap((palette) => {
    const colour = (token: string) =>
      Option.fromUndefinedOr(palette.tokens.get(token)).pipe(Option.flatMap(parseOklch));

    return surfaces.flatMap((surface) => {
      const under = Option.orElse(own, () => surface);
      const ratio = Option.zipWith(
        text.pipe(Option.flatMap(colour)),
        Option.match(under, { onNone: () => parseOklch(palette.surface), onSome: colour }),
        contrastRatio,
      );

      return Option.exists(ratio, (value) => value >= minimumContrast)
        ? []
        : [
            `${palette.name}, in ${Option.getOrElse(surface, () => "the host's surface")}: ${Option.match(
              ratio,
              { onNone: () => "none", onSome: (value) => `${value.toFixed(2)}:1` },
            )}`,
          ];
    });
  });
};

/**
 * Find the pseudo-classes outside the eight, at any depth.
 *
 * @param sheet The scanned sheet.
 * @returns Each offending pseudo-class's name.
 */
const strayPseudoClasses = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .flatMap((rule) => rule.selectors)
    .flatMap(compoundsDeep)
    .flatMap((compound) => compound.pseudoClasses)
    .map((pseudoClass) => pseudoClass.name)
    .filter((name) => !pseudoClassNames.has(name));

/**
 * Find the selectors whose top-level compounds hold more than `:where()`, `qti-*` classes and
 * pseudo-elements, so a theme rule weighs nothing against a host rule.
 *
 * @param sheet The scanned sheet.
 * @returns Each offending selector.
 */
const weightedSelectors = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .flatMap((rule) => rule.selectors)
    .filter((selector) =>
      compounds(selector).some(
        (compound) =>
          Option.isSome(compound.type) ||
          compound.ids.length > 0 ||
          compound.attributes.length > 0 ||
          compound.classes.some((name) => !name.startsWith("qti-")) ||
          compound.pseudoClasses.some((pseudoClass) => pseudoClass.name !== "where"),
      ),
    );

/**
 * The markers of parts the part table carries ahead of the issue that renders and styles them: no
 * rule of the sheet names one until its issue fills its delimited block.
 */
const prewiredSlots: ReadonlySet<string> = new Set([
  "choice-interaction-mask",
  "choice-interaction-mask-toggle",
  "test-navigation-time",
]);

/**
 * Find the part markers no selector names, at any depth.
 *
 * @param sheet The scanned sheet.
 * @returns Each marker of the part table that no compound of any selector holds.
 */
const unstyledMarkers = (sheet: Sheet): readonly string[] =>
  partTable
    .map((row) => row.slot)
    .filter((slot) => !prewiredSlots.has(slot))
    .filter(
      (slot) =>
        !sheet.rules.some((rule) => holdsAnywhere(rule, (compound) => holdsSlot(compound, slot))),
    );

/**
 * Find the Controls no rule gives a surface and a text colour: of the rules reaching each, none
 * declares both `background-color` and `color` as a `var()` of a token.
 *
 * @param sheet The scanned sheet.
 * @param slots The Controls' markers.
 * @returns Each marker left without its own colours.
 */
const uncolouredControls = (sheet: Sheet, slots: readonly string[]): readonly string[] =>
  slots.filter(
    (slot) =>
      !sheet.rules.some(
        (rule) =>
          reaches(rule, slot) &&
          Option.isSome(tokenFallback(rule, "background-color")) &&
          Option.isSome(tokenFallback(rule, "color")),
      ),
  );

/**
 * Find the Controls no `:focus-visible` rule reaches: no subject compound holds both the Control's
 * marker and `:focus-visible`.
 *
 * @param sheet The scanned sheet.
 * @param slots The Controls' markers.
 * @returns Each marker left without a focus rule.
 */
const unfocusedControls = (sheet: Sheet, slots: readonly string[]): readonly string[] =>
  slots.filter(
    (slot) =>
      !sheet.rules.some((rule) =>
        rule.selectors.some((selector) =>
          subjectCompounds(selector).some(
            (compound) => holdsSlot(compound, slot) && holdsPseudoClass(compound, "focus-visible"),
          ),
        ),
      ),
  );

/**
 * Find the parts no rule dims when disabled: no rule whose subject compound holds both the part's
 * marker and `:disabled` declares an `opacity`.
 *
 * @param sheet The scanned sheet.
 * @param slots The parts' markers.
 * @returns Each marker left without a disabled look.
 */
const undimmedParts = (sheet: Sheet, slots: readonly string[]): readonly string[] =>
  slots.filter(
    (slot) =>
      !sheet.rules.some(
        (rule) =>
          Option.isSome(declared(rule, "opacity")) &&
          rule.selectors.some((selector) =>
            subjectCompounds(selector).some(
              (compound) => holdsSlot(compound, slot) && holdsPseudoClass(compound, "disabled"),
            ),
          ),
      ),
  );

/**
 * Find the selectors that name a navigation marker and test `type` anywhere, so a button a host
 * swaps to `type="submit"` would lose the default look (rule `9af3809b`).
 *
 * @param sheet The scanned sheet.
 * @returns Each offending selector.
 */
const typedNavigationSelectors = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .flatMap((rule) => rule.selectors)
    .filter((selector) => {
      const all = compoundsDeep(selector);

      return (
        all.some((compound) => navigationMarkers.some((slot) => holdsSlot(compound, slot))) &&
        all.some((compound) => compound.attributes.some((test) => test.name === "type"))
      );
    });

/**
 * Read how the sheet marks the current item's button other than by colour: the properties of
 * {@link markProperties} declared by a rule whose subject compound holds the item button's marker
 * and `[aria-current="step"]`.
 *
 * @param sheet The scanned sheet.
 * @returns Each such property, once per declaration, in sheet order; empty when only colour marks
 *   the current item.
 */
const currentMarks = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .filter((rule) =>
      rule.selectors.some((selector) =>
        subjectCompounds(selector).some(
          (compound) =>
            holdsSlot(compound, marker.itemButton) && holdsEquals(compound, "aria-current", "step"),
        ),
      ),
    )
    .flatMap((rule) => rule.declarations)
    .map((declaration) => declaration.property)
    .filter((property) => markProperties.has(property));

/**
 * Find the selectors that set an outline on a part outside its focus: a subject compound holds the
 * part's marker but not `:focus-visible`, in a rule that declares an `outline` property. Such a
 * rule weighs what the focus rule weighs, so placed after it, it would take the focus ring away.
 *
 * @param sheet The scanned sheet.
 * @param slots The parts' markers.
 * @returns Each offending selector.
 */
const strayOutlines = (sheet: Sheet, slots: readonly string[]): readonly string[] =>
  sheet.rules
    .filter((rule) =>
      rule.declarations.some((declaration) => declaration.property.startsWith("outline")),
    )
    .flatMap((rule) => rule.selectors)
    .filter((selector) =>
      subjectCompounds(selector).some(
        (compound) =>
          slots.some((slot) => holdsSlot(compound, slot)) &&
          !holdsPseudoClass(compound, "focus-visible"),
      ),
    );

/**
 * Tell whether a compound tests a Root for a mode the author did not disable: it holds
 * `[data-mode="<mode>"]` and a `:not()` of `[data-disabled]`.
 *
 * @param compound One compound.
 * @param mode The mode.
 * @returns Whether the compound holds both.
 */
const holdsUndisabledMode = (compound: Compound, mode: string): boolean =>
  holdsEquals(compound, "data-mode", mode) &&
  compound.pseudoClasses.some(
    (pseudoClass) =>
      pseudoClass.name === "not" &&
      pseudoClass.selectors.some((selector) =>
        compoundsDeep(selector).some((inner) => holdsPresence(inner, "data-disabled")),
      ),
  );

/**
 * Find the modes in which a part a disabled Control dims stays dimmed: no rule after the last that
 * dims the part (one reaching it that declares an `opacity` other than `1`) reaches the part under
 * its Root in that mode, the author not having disabled it, and declares `opacity: 1`.
 *
 * @param sheet The scanned sheet.
 * @param parts The Root's marker, and the marker of the part it holds: a Choice row, or the Inline
 *   Choice Control.
 * @returns Each such mode of {@link readingModes}.
 */
const dimmedModes = (
  sheet: Sheet,
  parts: { readonly part: string; readonly root: string },
): readonly string[] => {
  const lastDim = sheet.rules.findLastIndex(
    (rule) =>
      reaches(rule, parts.part) &&
      Option.exists(declared(rule, "opacity"), (value) => value !== "1"),
  );

  return readingModes.filter(
    (mode) =>
      !sheet.rules.some(
        (rule, index) =>
          index > lastDim &&
          reaches(rule, parts.part) &&
          declares(rule, "opacity", "1") &&
          holdsAnywhere(
            rule,
            (compound) => holdsSlot(compound, parts.root) && holdsUndisabledMode(compound, mode),
          ),
      ),
  );
};

/**
 * Find the Controls no rule gives the refused look: no rule whose subject compound holds the
 * Control's marker and `[aria-invalid="true"]` takes its `border-color` from `--destructive`.
 *
 * @param sheet The scanned sheet.
 * @param slots The Controls' markers.
 * @returns Each marker left without a refused look.
 */
const unrefusedControls = (sheet: Sheet, slots: readonly string[]): readonly string[] =>
  slots.filter(
    (slot) =>
      !sheet.rules.some(
        (rule) =>
          Option.contains(tokenName(rule, "border-color"), "--destructive") &&
          rule.selectors.some((selector) =>
            subjectCompounds(selector).some(
              (compound) => holdsSlot(compound, slot) && holdsInvalid(compound),
            ),
          ),
      ),
  );

/**
 * Find the rules that take a part out of sight or out of the accessibility tree: `display: none`,
 * `visibility: hidden`, a `clip-path` or `position: absolute`, the ways the Choice Control is
 * hidden. A native Control no rule hides is drawn by the system under forced colours.
 *
 * @param sheet The scanned sheet.
 * @param slot The part's marker.
 * @returns Each offending rule's selectors, joined by commas.
 */
const hidingRules = (sheet: Sheet, slot: string): readonly string[] =>
  sheet.rules
    .filter(
      (rule) =>
        reaches(rule, slot) &&
        (declares(rule, "display", "none") ||
          declares(rule, "visibility", "hidden") ||
          declares(rule, "clip-path") ||
          declares(rule, "position", "absolute")),
    )
    .map((rule) => rule.selectors.join(", "));

/**
 * Find the Controls no rule gives a readonly look: no rule whose subject compound holds the
 * Control's marker and `[readonly]` sets its surface to a token without dimming it.
 *
 * @param sheet The scanned sheet.
 * @param slots The Controls' markers.
 * @returns Each marker left without a readonly look.
 */
const unreadonlyControls = (sheet: Sheet, slots: readonly string[]): readonly string[] =>
  slots.filter(
    (slot) =>
      !sheet.rules.some(
        (rule) =>
          Option.isSome(tokenFallback(rule, "background-color")) &&
          Option.isNone(declared(rule, "opacity")) &&
          rule.selectors.some((selector) =>
            subjectCompounds(selector).some(
              (compound) => holdsSlot(compound, slot) && holdsPresence(compound, "readonly"),
            ),
          ),
      ),
  );

/**
 * Find the rules that give the Status region the refused look, `--destructive`, without keying it
 * on the region holding Messages: a subject compound holds the Status marker but no `:has()` whose
 * argument holds the Message marker.
 *
 * @param sheet The scanned sheet.
 * @returns Each offending rule's selectors, joined by commas.
 */
const strayRefusedLooks = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .filter((rule) =>
      rule.declarations.some((declaration) =>
        varReferences(declaration.value).some((reference) => reference.name === "--destructive"),
      ),
    )
    .filter((rule) =>
      rule.selectors.some((selector) =>
        subjectCompounds(selector).some(
          (compound) =>
            holdsSlot(compound, marker.status) &&
            !compound.pseudoClasses
              .filter((pseudoClass) => pseudoClass.name === "has")
              .flatMap((pseudoClass) => pseudoClass.selectors)
              .some((argument) =>
                compoundsDeep(argument).some((inner) => holdsSlot(inner, marker.message)),
              ),
        ),
      ),
    )
    .map((rule) => rule.selectors.join(", "));

/**
 * Read every class the sheet's selectors name, at any depth.
 *
 * @param sheet The scanned sheet.
 * @returns The class names.
 */
const sheetClasses = (sheet: Sheet): ReadonlySet<string> =>
  new Set(
    sheet.rules
      .flatMap((rule) => rule.selectors)
      .flatMap(compoundsDeep)
      .flatMap((compound) => compound.classes),
  );

/**
 * Find an owner's styled vocabulary classes that no selector names, at any depth.
 *
 * @param sheet The scanned sheet.
 * @param owner The classes' owner in the inventory.
 * @returns Each styled class of the owner the sheet leaves without a rule.
 */
const unstyledClasses = (sheet: Sheet, owner: ClassOwner): readonly string[] => {
  const named = sheetClasses(sheet);

  return styledClasses[owner].filter((name) => !named.has(name));
};

/**
 * Tell whether a compound is keyed on a part: it holds the part's marker, or a `:where()` or
 * `:is()` whose argument's compounds hold it.
 *
 * @param compound One compound.
 * @param slot The part's marker.
 * @returns Whether the compound matches only that part.
 */
const keyedOn = (compound: Compound, slot: string): boolean =>
  holdsSlot(compound, slot) ||
  compound.pseudoClasses
    .filter((pseudoClass) => pseudoClass.name === "where" || pseudoClass.name === "is")
    .flatMap((pseudoClass) => pseudoClass.selectors)
    .some((argument) => compounds(argument).some((inner) => holdsSlot(inner, slot)));

/**
 * Read the rules that style a class on a Root: a compound of one of their selectors holds the
 * class and is keyed on the Root's marker.
 *
 * @param sheet The scanned sheet.
 * @param name The class's name.
 * @param root The Root's marker.
 * @returns Each such rule.
 */
const rootClassRules = (sheet: Sheet, name: string, root: string): readonly StyleRule[] =>
  sheet.rules.filter((rule) =>
    holdsAnywhere(rule, (compound) => compound.classes.includes(name) && keyedOn(compound, root)),
  );

/**
 * Find an owner's styled vocabulary classes that no rule styles on the owner's Root: unlike
 * {@link unstyledClasses}, a class another owner shares, such as `qti-input-width-10`, counts only
 * where it sits on this Root.
 *
 * @param sheet The scanned sheet.
 * @param owner The classes' owner in the inventory.
 * @param root The owner's Root marker.
 * @returns Each styled class of the owner left without a rule on its Root.
 */
const unkeyedClasses = (sheet: Sheet, owner: ClassOwner, root: string): readonly string[] =>
  styledClasses[owner].filter((name) => rootClassRules(sheet, name, root).length === 0);

/**
 * Find the vertical-writing classes an owner's Root is not set in: for each
 * `qti-writing-orientation-<mode>` the owner holds, no rule styling it on the Root declares
 * `writing-mode: <mode>`.
 *
 * @param sheet The scanned sheet.
 * @param owner The classes' owner in the inventory.
 * @param root The owner's Root marker.
 * @returns Each such class.
 */
const unwrittenClasses = (sheet: Sheet, owner: ClassOwner, root: string): readonly string[] =>
  styledClasses[owner]
    .filter((name) => name.startsWith("qti-writing-orientation-"))
    .filter(
      (name) =>
        !rootClassRules(sheet, name, root).some((rule) =>
          declares(rule, "writing-mode", name.slice("qti-writing-orientation-".length)),
        ),
    );

/**
 * Find the behaviour classes the sheet names, at any depth: their meaning needs script, which M1
 * does not run, so the sheet gives them no rule.
 *
 * @param sheet The scanned sheet.
 * @returns Each behaviour class of any owner that some selector names.
 */
const namedBehaviourClasses = (sheet: Sheet): readonly string[] => {
  const named = sheetClasses(sheet);

  return Object.values(behaviourClasses)
    .flat()
    .filter((name) => named.has(name));
};

/**
 * Read the rules that style a class on its own: a selector whose top-level compounds are one
 * compound holding the class.
 *
 * @param sheet The scanned sheet.
 * @param name The class's name.
 * @returns Each such rule.
 */
const classRules = (sheet: Sheet, name: string): readonly StyleRule[] =>
  sheet.rules.filter((rule) =>
    rule.selectors.some((selector) => {
      const top = compounds(selector);

      return top.length === 1 && top.some((compound) => compound.classes.includes(name));
    }),
  );

/**
 * Find the sized classes of an owner whose rules do not size a Control as the class says: each
 * class `<prefix>N` that no rule reaching the Control names, or whose rules reaching it do not all
 * declare `<property>: N<unit>`.
 *
 * @param sheet The scanned sheet.
 * @param size What the classes size: the owner, the classes' prefix, the Control's marker, and the
 *   property and unit each rule declares.
 * @returns Each class left without its size.
 */
const unsizedClasses = (
  sheet: Sheet,
  size: {
    readonly owner: ClassOwner;
    readonly prefix: string;
    readonly property: string;
    readonly slot: string;
    readonly unit: string;
  },
): readonly string[] =>
  styledClasses[size.owner]
    .filter((name) => name.startsWith(size.prefix))
    .filter((name) => {
      const rules = sheet.rules.filter(
        (rule) =>
          holdsAnywhere(rule, (compound) => compound.classes.includes(name)) &&
          reaches(rule, size.slot),
      );
      const length = `${name.slice(size.prefix.length)}${size.unit}`;

      return (
        rules.length === 0 ||
        !rules.every((rule) => Option.contains(declared(rule, size.property), length))
      );
    });

/**
 * Read the base section's text: the lines between the line that opens it and the line that opens
 * the theme section.
 *
 * @param text The stylesheet's text.
 * @returns The base section, without its opening line.
 */
const baseSection = (text: string): string => {
  const lines = text.split("\n");

  return lines.slice(lines.indexOf(baseLine) + 1, lines.indexOf(themeLine)).join("\n");
};

/**
 * The item Root's selector as the containment rule writes it: the marker alone, inside `:where()`.
 */
const itemRoot = compounds(`:where([data-slot="${marker.item}"])`);

/**
 * Read how far a focus ring reaches past its part: the largest `outline-width` plus
 * `outline-offset` that any `:focus-visible` rule declares.
 *
 * @param sheet The scanned sheet.
 * @returns The reach in px; none when some `:focus-visible` rule declares either length other than
 *   in px, or no rule shows focus.
 */
const focusRingReach = (sheet: Sheet): Option.Option<number> =>
  Option.all(
    sheet.rules
      .filter((rule) =>
        holdsAnywhere(rule, (compound) => holdsPseudoClass(compound, "focus-visible")),
      )
      .map((rule) =>
        Option.zipWith(
          Option.flatMap(declared(rule, "outline-width"), pxLength),
          Option.flatMap(declared(rule, "outline-offset"), pxLength),
          (width, offset) => width + offset,
        ),
      ),
  ).pipe(
    Option.filter((rings) => rings.length > 0),
    Option.map((rings) => Math.max(...rings)),
  );

/**
 * Read a rule's padding, side by side.
 *
 * @param rule One rule.
 * @returns Each length of its `padding`, in px; none when it declares no padding, or a side other
 *   than in px.
 */
const paddingSides = (rule: StyleRule): Option.Option<readonly number[]> =>
  declared(rule, "padding").pipe(
    Option.flatMap((value) => Option.all(value.split(/\s+/u).map(pxLength))),
  );

/**
 * Find the `qti-*` classes the sheet names that no owner's styled list holds.
 *
 * @param sheet The scanned sheet.
 * @returns Each such class.
 */
const unownedClasses = (sheet: Sheet): readonly string[] => {
  const styled = new Set(Object.values(styledClasses).flat());

  return [...sheetClasses(sheet)].filter((name) => name.startsWith("qti-") && !styled.has(name));
};

/**
 * Tell whether some rule tests the authored orientation for a value, at any depth.
 *
 * @param sheet The scanned sheet.
 * @param orientation The value, `horizontal` or `vertical`.
 * @returns Whether a compound holds `[data-orientation="<orientation>"]`.
 */
const testsOrientation = (sheet: Sheet, orientation: string): boolean =>
  sheet.rules.some((rule) =>
    holdsAnywhere(rule, (compound) =>
      compound.attributes.some(
        (test) =>
          test.name === "data-orientation" &&
          Option.contains(test.operator, "=") &&
          Option.contains(test.value, orientation),
      ),
    ),
  );

/**
 * Read the `counter()` calls in a value, outside its strings.
 *
 * @param value A declaration's value.
 * @returns Each call's argument text, as written between its parentheses.
 */
const counterCalls = (value: string): readonly string[] =>
  [...value.replaceAll(quotedStrings, "").matchAll(/\bcounter\((?<arguments>[^()]*)\)/gu)].map(
    (match) => match.groups?.["arguments"] ?? "",
  );

/**
 * Read the rules whose `content` generates a label with `counter()`.
 *
 * @param sheet The scanned sheet.
 * @returns Each such rule.
 */
const counterLabelRules = (sheet: Sheet): readonly StyleRule[] =>
  sheet.rules.filter((rule) =>
    rule.declarations.some(
      (declaration) =>
        declaration.property === "content" && counterCalls(declaration.value).length > 0,
    ),
  );

/**
 * Find the selectors that generate a counter label anywhere but on the Choice row's `::before` or
 * `::after`, outside the Label part, so the Control's accessible name stays the authored text.
 *
 * @param sheet The scanned sheet.
 * @returns Each offending selector.
 */
const strayCounterLabels = (sheet: Sheet): readonly string[] =>
  counterLabelRules(sheet)
    .flatMap((rule) => rule.selectors)
    .filter((selector) => {
      const last = compounds(selector).at(-1);
      const generated =
        last !== undefined &&
        last.pseudoElements.some((name) => name === "before" || name === "after");

      return !(
        generated &&
        subjectCompounds(selector).some((compound) => holdsSlot(compound, marker.choice))
      );
    });

/**
 * Find the `counter()` calls whose second argument is not one of the four predefined counter
 * styles the label classes name.
 *
 * @param sheet The scanned sheet.
 * @returns Each offending call, as `counter(<arguments>)`.
 */
const strayCounterStyles = (sheet: Sheet): readonly string[] =>
  sheet.rules
    .flatMap((rule) => rule.declarations)
    .flatMap((declaration) => counterCalls(declaration.value))
    .filter((call) => !counterStyles.has(call.split(",")[1]?.trim() ?? ""))
    .map((call) => `counter(${call})`);

/**
 * Read the rules that name `qti-input-control-hidden` and reach the Choice Control.
 *
 * @param sheet The scanned sheet.
 * @returns Each such rule.
 */
const hiddenControlRules = (sheet: Sheet): readonly StyleRule[] =>
  sheet.rules.filter(
    (rule) =>
      holdsAnywhere(rule, (compound) => compound.classes.includes(hiddenControlClass)) &&
      reaches(rule, marker.control),
  );

/**
 * Find the rules that, under `qti-input-control-hidden`, take the Choice Control out of the
 * accessibility tree and the form: `display: none` or `visibility: hidden`.
 *
 * @param sheet The scanned sheet.
 * @returns Each offending rule's selectors, joined by commas.
 */
const removedHiddenControls = (sheet: Sheet): readonly string[] =>
  hiddenControlRules(sheet)
    .filter((rule) =>
      rule.declarations.some(
        (declaration) =>
          (declaration.property === "display" && declaration.value === "none") ||
          (declaration.property === "visibility" && declaration.value === "hidden"),
      ),
    )
    .map((rule) => rule.selectors.join(", "));

/**
 * The stylesheet as the tests read it: its text and its scan, each read once.
 */
class Stylesheet extends Context.Service<
  Stylesheet,
  { readonly sheet: Sheet; readonly text: string }
>()("@qti-pie/plate/styles.test/Stylesheet") {
  /**
   * Read `src/styles.css` through the package's own import alias and scan it.
   */
  static readonly layer = Layer.effect(
    Stylesheet,
    Effect.gen(function* readStylesheet() {
      const text = yield* Effect.tryPromise(() =>
        readFile(new URL(import.meta.resolve("#plate/styles.css")), "utf-8"),
      );
      const sheet = yield* scanSheet(text);

      return Stylesheet.of({ sheet, text });
    }),
  );
}

layer(Stylesheet.layer)("styles.css", (test) => {
  test.effect(
    "scans, and holds the browser floor with the browser-support note",
    () =>
      Effect.gen(function* floor() {
        const { sheet } = yield* Stylesheet;
        const data = yield* readWebFeatures;

        assert.deepStrictEqual(floorViolations(sheet, data), []);
      }),
    { tags: ["web-features"] },
  );

  test.effect("opens the base section, then the theme section, each once", () =>
    Effect.gen(function* sections() {
      const { text } = yield* Stylesheet;
      const lines = text.split("\n");

      assert.strictEqual(lines.filter((line) => line === baseLine).length, 1);
      assert.strictEqual(lines.filter((line) => line === themeLine).length, 1);
      assert.isBelow(lines.indexOf(baseLine), lines.indexOf(themeLine));
    }),
  );

  test.effect("declares no custom property, no !important and no motion", () =>
    Effect.gen(function* declarations() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(forbiddenDeclarations(sheet), []);
    }),
  );

  test.effect("reads only the tokens, each with its own fallback", () =>
    Effect.gen(function* references() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(strayReferences(sheet), []);
    }),
  );

  test.effect(
    "keys only on part markers, the listed attributes, the four types and qti-* classes; never html, body, .dark or :root",
    () =>
      Effect.gen(function* names() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(strayNames(sheet), []);
      }),
  );

  test.effect("uses only the descendant combinator, inside :has() or out", () =>
    Effect.gen(function* combinators() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(combinatorSelectors(sheet), []);
    }),
  );

  test.effect("sets no text colour below 4.5:1 on its surface", () =>
    Effect.gen(function* contrast() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(lowContrastRules(sheet), []);
    }),
  );

  test.effect(
    "paints the Notice's own surface, so its text holds 4.5:1 in a qti-well, a hovered Choice row and every other surface, at the fallbacks and under .dark",
    () =>
      Effect.gen(function* notice() {
        const { sheet } = yield* Stylesheet;

        assert.includeMembers([...noticeSurfaces(sheet)], ["--muted", "--accent"]);
        assert.deepStrictEqual(lowNoticePairs(sheet), []);
        assert.isTrue(
          Option.exists(partToken(sheet, marker.notice, "background-color"), (name) =>
            tokens.has(name),
          ),
          "the Notice's own background, a token",
        );
      }),
  );

  test.effect("uses only the eight pseudo-classes", () =>
    Effect.gen(function* pseudoClasses() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(strayPseudoClasses(sheet), []);
    }),
  );

  test.effect(
    "reads the S3 states: :checked, :disabled and aria-invalid, on a part and in :has()",
    () =>
      Effect.gen(function* states() {
        const { sheet } = yield* Stylesheet;
        const selectors = sheet.rules.flatMap((rule) => rule.selectors);
        const anywhere = (passes: (compound: Compound) => boolean) =>
          selectors.some((selector) => compoundsDeep(selector).some(passes));
        const inHas = (passes: (compound: Compound) => boolean) =>
          selectors.flatMap(hasArguments).some((argument) => compoundsDeep(argument).some(passes));

        assert.isTrue(
          anywhere((compound) => holdsPseudoClass(compound, "checked")),
          ":checked",
        );
        assert.isTrue(
          anywhere((compound) => holdsPseudoClass(compound, "disabled")),
          ":disabled",
        );
        assert.isTrue(
          inHas((compound) => holdsPseudoClass(compound, "checked")),
          ":has(:checked)",
        );
        assert.isTrue(anywhere(holdsInvalid), '[aria-invalid="true"]');
        assert.isTrue(inHas(holdsInvalid), ':has([aria-invalid="true"])');
      }),
  );

  test.effect(
    "[Q-2] shows focus on the Choice row by its Control, with a 3px outline at offset 0",
    () =>
      Effect.gen(function* focus() {
        const { sheet } = yield* Stylesheet;
        const focused = sheet.rules.filter((rule) =>
          holdsAnywhere(rule, (compound) => holdsPseudoClass(compound, "focus-visible")),
        );

        assert.isTrue(
          focused.some((rule) =>
            rule.selectors.some((selector) =>
              reachesControlThroughRow(selector, (compound) =>
                holdsPseudoClass(compound, "focus-visible"),
              ),
            ),
          ),
        );

        for (const rule of focused) {
          assert.isTrue(Option.contains(declared(rule, "outline-width"), "3px"), rule.selectors[0]);
          assert.isTrue(Option.contains(declared(rule, "outline-offset"), "0"), rule.selectors[0]);
        }
      }),
  );

  test.effect("[Q-2] styles the Prompt's legend shape and its own element alike", () =>
    Effect.gen(function* prompt() {
      const { sheet } = yield* Stylesheet;
      const legend = sheet.rules.findIndex((rule) =>
        holdsAnywhere(
          rule,
          (compound) =>
            Option.contains(compound.type, "legend") && holdsSlot(compound, marker.prompt),
        ),
      );
      const shared = sheet.rules.findIndex(
        (rule, index) =>
          index !== legend &&
          holdsAnywhere(
            rule,
            (compound) => Option.isNone(compound.type) && holdsSlot(compound, marker.prompt),
          ),
      );

      assert.isAtLeast(legend, 0, "a rule on the legend Prompt");
      assert.isAtLeast(shared, 0, "a rule on the Prompt marker alone");
    }),
  );

  test.effect("wraps every top-level compound in :where(), so any host rule wins", () =>
    Effect.gen(function* weight() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(weightedSelectors(sheet), []);
    }),
  );

  test.effect("[Q-2] shows the native Choice Control under forced colours", () =>
    Effect.gen(function* forced() {
      const { sheet } = yield* Stylesheet;

      assert.isTrue(
        sheet.rules.some(
          (rule) =>
            rule.conditions.length === 1 &&
            rule.conditions[0] === forcedColors &&
            reaches(rule, marker.control),
        ),
      );
    }),
  );

  test.effect(
    "[Q-20] [Q-5] gives each text Control a surface and text colour from the tokens",
    () =>
      Effect.gen(function* controlColours() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(uncolouredControls(sheet, textControls), []);
      }),
  );

  test.effect("[Q-20] [Q-5] shows focus on each text Control", () =>
    Effect.gen(function* controlFocus() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(unfocusedControls(sheet, textControls), []);
    }),
  );

  test.effect("lays out the navigation Root, and its item list without list markers", () =>
    Effect.gen(function* navigationLayout() {
      const { sheet } = yield* Stylesheet;
      const [root, items] = [
        rowFor("test-navigation", "root").slot,
        rowFor("test-navigation", "items").slot,
      ];

      assert.isTrue(
        sheet.rules.some((rule) => reaches(rule, root) && declares(rule, "display", "flex")),
        "the Root, a flex row",
      );
      assert.isTrue(
        sheet.rules.some((rule) => reaches(rule, items) && declares(rule, "list-style", "none")),
        "the item list, no markers",
      );
    }),
  );

  test.effect("gives each navigation button a surface and a text colour", () =>
    Effect.gen(function* navigationColours() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(uncolouredControls(sheet, navigationButtons), []);
    }),
  );

  test.effect("shows focus on each navigation button", () =>
    Effect.gen(function* navigationFocus() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(unfocusedControls(sheet, navigationButtons), []);
    }),
  );

  test.effect("dims each navigation button when it is disabled", () =>
    Effect.gen(function* navigationDisabled() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(undimmedParts(sheet, navigationButtons), []);
    }),
  );

  test.effect(
    "marks the current item's button by its border or weight, never by colour alone",
    () =>
      Effect.gen(function* currentItem() {
        const { sheet } = yield* Stylesheet;

        assert.isNotEmpty(currentMarks(sheet));
      }),
  );

  test.effect(
    "keeps the focus ring on every navigation button and text Control: only a :focus-visible rule sets an outline",
    () =>
      Effect.gen(function* focusHeld() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(strayOutlines(sheet, [...navigationButtons, ...textControls]), []);
      }),
  );

  test.effect(
    "[Q-2] shows a Choice row at full strength in review and solution, unless the author disabled the Root",
    () =>
      Effect.gen(function* readingChoice() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(
          dimmedModes(sheet, { part: marker.choice, root: marker.choiceRoot }),
          [],
        );
      }),
  );

  test.effect("[Q-20] [Q-5] gives a readonly text Control a surface of its own, undimmed", () =>
    Effect.gen(function* readonlyControls() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(unreadonlyControls(sheet, textControls), []);
    }),
  );

  test.effect("keys no selector over a navigation marker on type", () =>
    Effect.gen(function* navigationUntyped() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(typedNavigationSelectors(sheet), []);
    }),
  );

  test.effect("names every part marker of the part table in some selector", () =>
    Effect.gen(function* markers() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(unstyledMarkers(sheet), []);
    }),
  );

  test.effect("gives the Status region the refused look only when it holds Messages", () =>
    Effect.gen(function* refused() {
      const { sheet } = yield* Stylesheet;

      assert.deepStrictEqual(strayRefusedLooks(sheet), []);
    }),
  );

  test.effect(
    "[I-19] [Q-2] names every Choice styled class, and no qti-* class outside the inventory",
    () =>
      Effect.gen(function* choiceVocabulary() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(unstyledClasses(sheet, "choice-interaction"), []);
        assert.deepStrictEqual(unownedClasses(sheet), []);
      }),
  );

  test.effect("[I-19] [Q-2] reads the authored data-orientation, horizontal and vertical", () =>
    Effect.gen(function* orientation() {
      const { sheet } = yield* Stylesheet;

      assert.isTrue(testsOrientation(sheet, "horizontal"), 'data-orientation="horizontal"');
      assert.isTrue(testsOrientation(sheet, "vertical"), 'data-orientation="vertical"');
    }),
  );

  test.effect(
    "[I-19] [Q-2] generates counter labels on the Choice row's ::before or ::after only",
    () =>
      Effect.gen(function* labelPlace() {
        const { sheet } = yield* Stylesheet;

        assert.isNotEmpty(counterLabelRules(sheet));
        assert.deepStrictEqual(strayCounterLabels(sheet), []);
      }),
  );

  test.effect(
    "[I-19] [Q-2] numbers labels only in the decimal, lower-alpha, upper-alpha and cjk-ideographic styles",
    () =>
      Effect.gen(function* labelStyles() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(strayCounterStyles(sheet), []);
      }),
  );

  test.effect(
    "[I-19] [Q-2] keeps the Choice Control hidden from sight only under qti-input-control-hidden",
    () =>
      Effect.gen(function* hiddenControl() {
        const { sheet } = yield* Stylesheet;

        assert.isNotEmpty(hiddenControlRules(sheet));
        assert.deepStrictEqual(removedHiddenControls(sheet), []);
      }),
  );

  test.effect("[I-19] names every styled class of every owner, and no behaviour class", () =>
    Effect.gen(function* vocabulary() {
      const { sheet } = yield* Stylesheet;

      for (const owner of Rec.keys(styledClasses)) {
        assert.deepStrictEqual(unstyledClasses(sheet, owner), [], owner);
      }

      assert.deepStrictEqual(namedBehaviourClasses(sheet), []);
    }),
  );

  test.effect(
    "[I-19] hides qti-hidden by display: none, and qti-visually-hidden from sight only, without clip",
    () =>
      Effect.gen(function* hiddenClasses() {
        const { sheet } = yield* Stylesheet;
        const hidden = classRules(sheet, "qti-hidden");
        const visuallyHidden = classRules(sheet, "qti-visually-hidden");

        assert.isNotEmpty(hidden);
        assert.isTrue(hidden.every((rule) => declares(rule, "display", "none")));
        assert.isNotEmpty(visuallyHidden);
        assert.isFalse(
          visuallyHidden.some(
            (rule) => declares(rule, "display", "none") || declares(rule, "clip"),
          ),
        );
      }),
  );

  test.effect("[I-19] sets qti-well on the --muted surface, with no text colour of its own", () =>
    Effect.gen(function* well() {
      const { sheet } = yield* Stylesheet;
      const wells = classRules(sheet, "qti-well");

      assert.isNotEmpty(wells);
      assert.isTrue(
        wells.every((rule) => Option.contains(tokenName(rule, "background-color"), "--muted")),
      );
      assert.isFalse(wells.some((rule) => declares(rule, "color")));
    }),
  );

  test.effect(
    "contains the item Root in the base section, padded past every focus ring, in px",
    () =>
      Effect.gen(function* containment() {
        const { sheet, text } = yield* Stylesheet;
        const base = yield* scanSheet(baseSection(text));
        const reach = focusRingReach(sheet);
        const contained = base.rules.filter(
          (rule) =>
            rule.selectors.every((selector) => isDeepStrictEqual(compounds(selector), itemRoot)) &&
            declares(rule, "contain", "layout paint"),
        );

        assert.isTrue(Option.isSome(reach), "every focus ring's width and offset in px");
        assert.isNotEmpty(contained);
        for (const rule of contained) {
          assert.isTrue(declares(rule, "overflow", "auto"), "overflow: auto");

          const padded = Option.zipWith(paddingSides(rule), reach, (sides, ring) =>
            sides.every((side) => side >= ring),
          );

          assert.isTrue(Option.contains(padded, true), "padding");
        }
      }),
  );

  test.effect(
    "[Q-20] [Q-5] sizes the text Controls: Text Entry's width in ch, Extended Text's height in lh",
    () =>
      Effect.gen(function* controlSizes() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(
          unsizedClasses(sheet, {
            owner: "text-entry-interaction",
            prefix: "qti-input-width-",
            property: "min-inline-size",
            slot: marker.textEntryControl,
            unit: "ch",
          }),
          [],
        );
        assert.deepStrictEqual(
          unsizedClasses(sheet, {
            owner: "extended-text-interaction",
            prefix: "qti-height-lines-",
            property: "block-size",
            slot: marker.extendedTextControl,
            unit: "lh",
          }),
          [],
        );
      }),
  );

  test.effect(
    "[I-19] [Q-12] names every Inline Choice styled class on the Inline Choice Root, and holds no Inline Choice behaviour class",
    () =>
      Effect.gen(function* inlineChoiceVocabulary() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(
          unkeyedClasses(sheet, "inline-choice-interaction", marker.inlineChoiceRoot),
          [],
        );
        assert.deepStrictEqual([...behaviourClasses["inline-choice-interaction"]], []);
      }),
  );

  test.effect(
    "[I-19] [Q-12] sizes the Inline Choice Control's width in ch, the number from the class name",
    () =>
      Effect.gen(function* inlineChoiceWidths() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(
          unsizedClasses(sheet, {
            owner: "inline-choice-interaction",
            prefix: "qti-input-width-",
            property: "min-inline-size",
            slot: marker.inlineChoiceControl,
            unit: "ch",
          }),
          [],
        );
      }),
  );

  test.effect(
    "[I-19] [Q-12] sets the Inline Choice Root in vertical lines under each writing class",
    () =>
      Effect.gen(function* inlineChoiceWriting() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(
          unwrittenClasses(sheet, "inline-choice-interaction", marker.inlineChoiceRoot),
          [],
        );
      }),
  );

  test.effect(
    "[Q-12] gives the Inline Choice Control a surface and text colour from the tokens",
    () =>
      Effect.gen(function* inlineChoiceColours() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(uncolouredControls(sheet, [marker.inlineChoiceControl]), []);
      }),
  );

  test.effect(
    "[Q-12] shows focus on the Inline Choice Control by the sheet's ring, and sets its outline nowhere else",
    () =>
      Effect.gen(function* inlineChoiceFocus() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(unfocusedControls(sheet, [marker.inlineChoiceControl]), []);
        assert.deepStrictEqual(strayOutlines(sheet, [marker.inlineChoiceControl]), []);
      }),
  );

  test.effect(
    "[Q-12] dims a disabled Inline Choice Control, and shows it at full strength in review and solution unless the author disabled the Root",
    () =>
      Effect.gen(function* inlineChoiceStrength() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(undimmedParts(sheet, [marker.inlineChoiceControl]), []);
        assert.deepStrictEqual(
          dimmedModes(sheet, { part: marker.inlineChoiceControl, root: marker.inlineChoiceRoot }),
          [],
        );
      }),
  );

  test.effect(
    "[Q-12] borders an Inline Choice Control holding a refused answer in --destructive",
    () =>
      Effect.gen(function* inlineChoiceRefused() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(unrefusedControls(sheet, [marker.inlineChoiceControl]), []);
      }),
  );

  test.effect(
    "[Q-12] never hides the native Inline Choice Control, so forced colours draw it as the system's own",
    () =>
      Effect.gen(function* inlineChoiceForced() {
        const { sheet } = yield* Stylesheet;

        assert.deepStrictEqual(hidingRules(sheet, marker.inlineChoiceControl), []);
      }),
  );
});

describe("styles.css predicates, on negative controls", () => {
  it.effect("a child combinator inside :has() is reported", () =>
    Effect.gen(function* childCombinator() {
      const selector = `:where([data-slot="${marker.choice}"]:has(> [data-slot="${marker.control}"]:checked))`;
      const sheet = yield* scanSheet(`${selector} {\n  opacity: 0.5;\n}\n`);

      assert.deepStrictEqual(combinatorSelectors(sheet), [selector]);
    }),
  );

  it.effect("muted text on the muted surface, 4.34:1, is reported", () =>
    Effect.gen(function* mutedOnMuted() {
      const selector = `:where([data-slot="${marker.choice}"])`;
      const sheet = yield* scanSheet(
        `${selector} {\n  color: var(--muted-foreground, oklch(0.556 0 0));\n  background-color: var(--muted, oklch(0.97 0 0));\n}\n`,
      );

      assert.deepStrictEqual(lowContrastRules(sheet), [selector]);
    }),
  );

  it.effect(
    "a Notice with no surface of its own is reported in a qti-well, and with one is not",
    () =>
      Effect.gen(function* noticeInWell() {
        const notice = `:where([data-slot="${marker.notice}"])`;
        const text = "color: var(--muted-foreground, oklch(0.556 0 0));";
        const well = ".qti-well {\n  background-color: var(--muted, oklch(0.97 0 0));\n}\n";
        const bare = yield* scanSheet(`${well}\n${notice} {\n  ${text}\n}\n`);
        const painted = yield* scanSheet(
          `${well}\n${notice} {\n  background-color: var(--card, oklch(1 0 0));\n  ${text}\n}\n`,
        );

        assert.deepStrictEqual(lowNoticePairs(bare), ["fallbacks, in --muted: 4.34:1"]);
        assert.deepStrictEqual(lowNoticePairs(painted), []);
      }),
  );

  it.effect(
    "a navigation button keyed on its type is reported, and one keyed on its marker is not",
    () =>
      Effect.gen(function* typedButton() {
        const [next] = navigationButtons;
        const typed = `:where([data-slot="${next ?? ""}"][type="submit"])`;
        const bare = `:where([data-slot="${next ?? ""}"])`;
        const sheet = yield* scanSheet(
          `${typed} {\n  opacity: 0.5;\n}\n\n${bare} {\n  opacity: 0.5;\n}\n`,
        );

        assert.deepStrictEqual(typedNavigationSelectors(sheet), [typed]);
      }),
  );

  it.effect(
    "a current item marked by its border colour alone gives no mark, and by width one",
    () =>
      Effect.gen(function* currentColour() {
        const current = `:where([data-slot="${marker.itemButton}"][aria-current="step"])`;
        const colour = "border-color: var(--primary, oklch(0.205 0 0));";
        const coloured = yield* scanSheet(`${current} {\n  ${colour}\n}\n`);
        const widened = yield* scanSheet(`${current} {\n  border-width: 2px;\n  ${colour}\n}\n`);

        assert.deepStrictEqual(currentMarks(coloured), []);
        assert.deepStrictEqual(currentMarks(widened), ["border-width"]);
      }),
  );

  it.effect("an outline set outside :focus-visible is reported, and inside it is not", () =>
    Effect.gen(function* outlineOutsideFocus() {
      const stray = `:where([data-slot="${marker.itemButton}"][aria-current="step"])`;
      const focused = `:where([data-slot="${marker.itemButton}"]:focus-visible)`;
      const sheet = yield* scanSheet(
        `${focused} {\n  outline-width: 3px;\n}\n\n${stray} {\n  outline-width: 0;\n}\n`,
      );

      assert.deepStrictEqual(strayOutlines(sheet, navigationButtons), [stray]);
    }),
  );

  it.effect("a refused look on the Status region alone is reported, and on its :has() is not", () =>
    Effect.gen(function* refusedLook() {
      const bare = `:where([data-slot="${marker.status}"])`;
      const keyed = `:where([data-slot="${marker.status}"]:has([data-slot="${marker.message}"]))`;
      const border = "border-color: var(--destructive, oklch(0.577 0.245 27.325));";
      const sheet = yield* scanSheet(`${bare} {\n  ${border}\n}\n\n${keyed} {\n  ${border}\n}\n`);

      assert.deepStrictEqual(strayRefusedLooks(sheet), [bare]);
    }),
  );

  it.effect(
    "a width class on Text Entry's Root alone leaves it unkeyed on the Inline Choice Root, and on that Root it is keyed",
    () =>
      Effect.gen(function* sharedClass() {
        const width = "qti-input-width-10";
        const textEntry = `.${width}:where([data-slot="${rowFor("text-entry-interaction", "root").slot}"])`;
        const inlineChoice = `.${width}:where([data-slot="${marker.inlineChoiceRoot}"])`;
        const elsewhere = yield* scanSheet(`${textEntry} {\n  min-inline-size: 10ch;\n}\n`);
        const keyed = yield* scanSheet(`${inlineChoice} {\n  min-inline-size: 10ch;\n}\n`);

        assert.include(
          unkeyedClasses(elsewhere, "inline-choice-interaction", marker.inlineChoiceRoot),
          width,
        );
        assert.notInclude(
          unkeyedClasses(keyed, "inline-choice-interaction", marker.inlineChoiceRoot),
          width,
        );
      }),
  );
});
