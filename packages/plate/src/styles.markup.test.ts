import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { compounds, scanSheet } from "#plate/test/css.ts";
import type { AttributeTest, Compound, Sheet } from "#plate/test/css.ts";

/**
 * A compound of a sheet that no element of the trees has, with the selector it was read from.
 */
interface Unmatched {
  readonly compound: Compound;
  /**
   * The rule's selector, as the sheet holds it, that the compound sits in at some depth.
   */
  readonly selector: string;
}

/**
 * The pseudo-classes whose selectors the witness descends into. `:not`'s are skipped: a rule may
 * name there what no element has.
 */
const descended: ReadonlySet<string> = new Set(["has", "is", "where"]);

/**
 * Read every element of the trees, at any depth.
 *
 * @param trees The trees.
 * @returns Each element, in document order; text nodes dropped.
 */
const elementsOf = (trees: readonly Node[]): readonly Element[] =>
  trees.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Read a selector's compounds at any depth.
 *
 * @param selector One selector.
 * @returns Its top-level compounds, each followed by the compounds of the selectors of its
 *   `:where`, `:is` and `:has`, recursively; never those of `:not`.
 */
const compoundsDeep = (selector: string): readonly Compound[] =>
  compounds(selector).flatMap((compound) => [
    compound,
    ...compound.pseudoClasses
      .filter((pseudoClass) => descended.has(pseudoClass.name))
      .flatMap((pseudoClass) => pseudoClass.selectors.flatMap(compoundsDeep)),
  ]);

/**
 * Read an attribute of an element as text.
 *
 * @param element The element.
 * @param name The attribute's name, in any case.
 * @returns The value, the empty string for a boolean attribute present, or none when absent.
 */
const attribute = (element: Element, name: string): Option.Option<string> => {
  const key = name.toLowerCase();
  if (!Object.hasOwn(element.attrs, key)) {
    return Option.none();
  }

  return Option.fromNullishOr(element.attrs[key]).pipe(
    Option.map((value) => (value === true ? "" : value)),
  );
};

/**
 * Test one attribute test against an element.
 *
 * Only presence and `=` without a case flag are matched; any other operator, or a flag, never
 * passes, so its compound is reported.
 *
 * @param element The element.
 * @param test The attribute test.
 * @returns Whether the element passes the test.
 */
const passes = (element: Element, test: AttributeTest): boolean =>
  Option.match(attribute(element, test.name), {
    onNone: () => false,
    onSome: (value) =>
      Option.isNone(test.operator) ||
      (Option.contains(test.operator, "=") &&
        Option.isNone(test.flag) &&
        Option.contains(test.value, value)),
  });

/**
 * Test whether a compound holds anything the witness matches: a type, a class, an ID or an
 * attribute test.
 *
 * @param compound The compound.
 * @returns Whether some element must have what the compound names.
 */
const namesSomething = (compound: Compound): boolean =>
  Option.isSome(compound.type) ||
  compound.classes.length > 0 ||
  compound.ids.length > 0 ||
  compound.attributes.length > 0;

/**
 * Test whether an element has what a compound names; pseudo-classes and pseudo-elements are not
 * matched.
 *
 * @param element The element.
 * @param compound The compound.
 * @returns Whether the element has the compound's type (any, for `*`), every class, every ID and
 *   passes every attribute test.
 */
const has = (element: Element, compound: Compound): boolean => {
  const classes = new Set(
    Option.getOrElse(attribute(element, "class"), () => "")
      .split(/\s+/u)
      .filter((name) => name !== ""),
  );
  const id = attribute(element, "id");

  return (
    Option.match(compound.type, {
      onNone: () => true,
      onSome: (type) => type === "*" || type.toLowerCase() === element.tag,
    }) &&
    compound.classes.every((name) => classes.has(name)) &&
    compound.ids.every((name) => Option.contains(id, name)) &&
    compound.attributes.every((test) => passes(element, test))
  );
};

/**
 * Find the compounds of a sheet that no element of the trees has.
 *
 * Every compound of every selector counts, descending into the selectors of `:where`, `:is` and
 * `:has` and skipping `:not`'s. Combinators, pseudo-classes and pseudo-elements are not matched,
 * and a compound that names nothing else (`:where(…)` itself, a bare `::before`) matches.
 *
 * @param sheet The scanned sheet.
 * @param trees The markup the sheet styles.
 * @returns Each compound no element has, with its rule's selector, in sheet order.
 */
const unmatched = (sheet: Sheet, trees: readonly Node[]): readonly Unmatched[] => {
  const elements = elementsOf(trees);

  return sheet.rules.flatMap((rule) =>
    rule.selectors.flatMap((selector) =>
      compoundsDeep(selector)
        .filter(
          (compound) =>
            namesSomething(compound) && !elements.some((element) => has(element, compound)),
        )
        .map((compound) => ({ compound, selector })),
    ),
  );
};

/**
 * An attribute selector on a marker no part carries, the negative control's.
 */
const nonexistent = '[data-slot="choice-interaction-nonexistent"]';

/**
 * A Choice list holding one choice, built only through the part table's markers.
 *
 * @returns The list's `ul`, holding one `li`.
 */
const choiceList = (): Element =>
  h("ul", { "data-slot": rowFor("choice-interaction", "choices").slot }, [
    h("li", { "data-slot": rowFor("choice-interaction", "choice").slot }, [text("A")]),
  ]);

describe("unmatched", () => {
  it.effect("reports a compound no element has, with its selector (the negative control)", () =>
    Effect.gen(function* negativeControl() {
      const sheet = yield* scanSheet(`${nonexistent} { color: red }`);
      const found = unmatched(sheet, [choiceList()]);

      assert.deepStrictEqual(
        found.map((entry) => entry.selector),
        [nonexistent],
      );
      assert.deepStrictEqual(found[0]?.compound.attributes, [
        {
          flag: Option.none(),
          name: "data-slot",
          operator: Option.some("="),
          value: Option.some("choice-interaction-nonexistent"),
        },
      ]);
    }),
  );

  it.effect("finds an element for each compound inside :where() (the positive control)", () =>
    Effect.gen(function* positiveControl() {
      const choice = rowFor("choice-interaction", "choice").slot;
      const selector = `:where(li[data-slot="${choice}"]:hover)`;
      const sheet = yield* scanSheet(`${selector} { color: red }`);

      assert.deepStrictEqual(unmatched(sheet, [choiceList()]), []);

      const bare = unmatched(sheet, [h("ul", {})]);
      assert.deepStrictEqual(
        bare.map((entry) => entry.selector),
        [selector],
      );
      assert.deepStrictEqual(bare[0]?.compound.type, Option.some("li"));
    }),
  );

  it.effect("does not report a compound inside :not() that no element has", () =>
    Effect.gen(function* insideNot() {
      const sheet = yield* scanSheet(`li:not(${nonexistent}, .qti-absent) { color: red }`);

      assert.deepStrictEqual(unmatched(sheet, [choiceList()]), []);
    }),
  );

  it.effect("matches classes split on white space and reports a class no element has", () =>
    Effect.gen(function* classes() {
      const tree = h("p", { class: " qti-underline\n\tqti-align-center " });
      const held = yield* scanSheet("p.qti-align-center.qti-underline { color: red }");
      const missing = yield* scanSheet(".qti-underline.qti-italic { color: red }");

      assert.deepStrictEqual(unmatched(held, [tree]), []);
      assert.deepStrictEqual(
        unmatched(missing, [tree]).map((entry) => entry.compound.classes),
        [["qti-underline", "qti-italic"]],
      );
    }),
  );

  it.effect("reports an attribute test whose operator is not =", () =>
    Effect.gen(function* otherOperator() {
      const sheet = yield* scanSheet('[data-slot^="choice-interaction"] { color: red }');

      assert.deepStrictEqual(
        unmatched(sheet, [choiceList()]).map((entry) => entry.compound.attributes[0]?.operator),
        [Option.some("^=")],
      );
    }),
  );
});
