import { readFile } from "node:fs/promises";
import { assert, describe, it, layer } from "@effect/vitest";
import { Context, Effect, Layer, Option } from "effect";
import { partForSlot, partTable, rowFor } from "#plate/emit/parts.ts";
import { browserSupport } from "#plate/ledger/browser-support.ts";
import { checkFloor, readWebFeatures } from "#plate/test/baseline.ts";
import type { FloorViolation, WebFeatures } from "#plate/test/baseline.ts";
import { compounds, scanSheet, uses, varReferences } from "#plate/test/css.ts";
import type { Compound, Sheet, StyleRule } from "#plate/test/css.ts";
import { contrastRatio, parseOklch, tokens } from "#plate/test/tokens.ts";
import { styledClasses } from "#plate/vocabulary.ts";
import type { ClassOwner } from "#plate/vocabulary.ts";

/**
 * The markers the stylesheet's rules are read against, from the part table: the Choice parts, the
 * text Controls and the results box.
 */
const marker = {
  choice: rowFor("choice-interaction", "choice").slot,
  control: rowFor("choice-interaction", "control").slot,
  extendedTextControl: rowFor("extended-text-interaction", "control").slot,
  indicator: rowFor("choice-interaction", "indicator").slot,
  message: rowFor("item", "message").slot,
  prompt: rowFor("choice-interaction", "prompt").slot,
  status: rowFor("item", "status").slot,
  textEntryControl: rowFor("text-entry-interaction", "control").slot,
};

/**
 * The text Controls: Text Entry's `input` and Extended Text's `textarea`.
 */
const textControls: readonly string[] = [marker.textEntryControl, marker.extendedTextControl];

/**
 * The line that opens the base section, the QTI vocabulary classes.
 */
const baseLine = "/* == base: QTI vocabulary classes == */";

/**
 * The line that opens the theme section, the look on the part markers.
 */
const themeLine = "/* == theme: shadcn manner, on the part markers == */";

/**
 * The only attribute names a selector may test (spec §4.2; `data-disabled` by the Mind's ruling
 * on handle `66ece1f9`, for the disabled state; `data-orientation`, the authored orientation on the
 * Choice Root, from P2-04).
 */
const attributeNames: ReadonlySet<string> = new Set([
  "aria-invalid",
  "data-disabled",
  "data-mode",
  "data-orientation",
  "data-slot",
  "type",
]);

/**
 * The only type selectors, the elements the part table pins: the Controls, the Prompt's legend
 * shape and the Choice Root.
 */
const typeNames: ReadonlySet<string> = new Set(["fieldset", "input", "legend", "textarea"]);

/**
 * The only pseudo-classes: the four that hold selectors, and the four states the sheet reads
 * (never `:invalid`, `:valid`, `:user-invalid` or `:user-valid`, spec §4.2).
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
 * The pseudo-classes whose argument is a selector list.
 */
const selectorPseudoClasses: ReadonlySet<string> = new Set(["has", "is", "not", "where"]);

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
 * The condition of the rules that undo the drawn mark when forced colours drop its backgrounds.
 */
const forcedColors = "@media (forced-colors: active)";

/**
 * The predefined counter styles the label classes name: `qti-labels-decimal`, `-lower-alpha`,
 * `-upper-alpha` and `-cjk-ideographic` (spec §4.3).
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
 * A quoted string in CSS text, double or single, with its escapes.
 */
const quotedStrings = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/gu;

/**
 * Read a selector's compounds at any depth.
 *
 * @param selector One selector.
 * @returns Its top-level compounds, each followed by the compounds of the selectors of its
 *   `:where`, `:is`, `:not` and `:has`, recursively.
 */
const compoundsDeep = (selector: string): readonly Compound[] =>
  compounds(selector).flatMap((compound) => [
    compound,
    ...compound.pseudoClasses
      .filter((pseudoClass) => selectorPseudoClasses.has(pseudoClass.name))
      .flatMap((pseudoClass) => pseudoClass.selectors.flatMap(compoundsDeep)),
  ]);

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
 * Tell whether a compound tests for a part's marker.
 *
 * @param compound One compound.
 * @param slot The part's `data-slot` marker.
 * @returns Whether the compound holds `[data-slot="<slot>"]`.
 */
const holdsSlot = (compound: Compound, slot: string): boolean =>
  compound.attributes.some(
    (test) =>
      test.name === "data-slot" &&
      Option.contains(test.operator, "=") &&
      Option.contains(test.value, slot),
  );

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
const holdsInvalid = (compound: Compound): boolean =>
  compound.attributes.some(
    (test) =>
      test.name === "aria-invalid" &&
      Option.contains(test.operator, "=") &&
      Option.contains(test.value, "true"),
  );

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
 * outside the five, a type outside the four, a class that is not a `qti-*` vocabulary class (so
 * never `dark`), and `:root`.
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
 * Find the part markers no selector names, at any depth.
 *
 * @param sheet The scanned sheet.
 * @returns Each marker of the part table that no compound of any selector holds.
 */
const unstyledMarkers = (sheet: Sheet): readonly string[] =>
  partTable
    .map((row) => row.slot)
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
 * The stylesheet as the tests read it: its text, its scan and the floor's data, each read once.
 */
class Stylesheet extends Context.Service<
  Stylesheet,
  { readonly data: WebFeatures; readonly sheet: Sheet; readonly text: string }
>()("@qti-pie/plate/styles.test/Stylesheet") {
  /**
   * Read `src/styles.css` through the package's own import alias, scan it and read the data.
   */
  static readonly layer = Layer.effect(
    Stylesheet,
    Effect.gen(function* readStylesheet() {
      const text = yield* Effect.tryPromise(() =>
        readFile(new URL(import.meta.resolve("#plate/styles.css")), "utf-8"),
      );
      const sheet = yield* scanSheet(text);
      const data = yield* readWebFeatures;

      return Stylesheet.of({ data, sheet, text });
    }),
  );
}

layer(Stylesheet.layer)("styles.css", (test) => {
  test.effect("scans, and holds the browser floor with the browser-support note", () =>
    Effect.gen(function* floor() {
      const { data, sheet } = yield* Stylesheet;

      assert.deepStrictEqual(floorViolations(sheet, data), []);
    }),
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
    "keys only on part markers, the five attributes, the four types and qti-* classes; never html, body, .dark or :root",
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

  it.effect("a refused look on the Status region alone is reported, and on its :has() is not", () =>
    Effect.gen(function* refusedLook() {
      const bare = `:where([data-slot="${marker.status}"])`;
      const keyed = `:where([data-slot="${marker.status}"]:has([data-slot="${marker.message}"]))`;
      const border = "border-color: var(--destructive, oklch(0.577 0.245 27.325));";
      const sheet = yield* scanSheet(`${bare} {\n  ${border}\n}\n\n${keyed} {\n  ${border}\n}\n`);

      assert.deepStrictEqual(strayRefusedLooks(sheet), [bare]);
    }),
  );
});
