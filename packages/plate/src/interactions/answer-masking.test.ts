import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { h } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { decode } from "#plate/form/encoding.ts";
import type { Entry, Malformed } from "#plate/form/encoding.ts";
import type { Value } from "#plate/model/values.ts";
import { readPnp } from "#plate/pnp/read.ts";
import type { Redacted } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { noSupports } from "#plate/supports.ts";
import type { Supports } from "#plate/supports.ts";
import { checkTree, textOf } from "#plate/test/accessibility.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The instance token every render here is made for, which scopes the Controls' entry names.
 */
const instance = "m405";

/**
 * The markers of the Choice parts these tests read, from the part table.
 */
const slot = {
  choice: rowFor("choice-interaction", "choice").slot,
  control: rowFor("choice-interaction", "control").slot,
  label: rowFor("choice-interaction", "label").slot,
  mask: rowFor("choice-interaction", "mask").slot,
  maskToggle: rowFor("choice-interaction", "maskToggle").slot,
  prompt: rowFor("choice-interaction", "prompt").slot,
  root: rowFor("choice-interaction", "root").slot,
};

/**
 * The supports of a candidate with answer masking on and nothing else.
 */
const masking: Supports = { ...noSupports, answerMasking: true };

/**
 * Read a fixture of `fixtures/m4` as bytes.
 *
 * @param name The file's path under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/${name}`, import.meta.url)));

/**
 * Open a document, accept it as an item and redact it, as a host does before it renders.
 *
 * @param location The document's location as the host names it.
 * @param bytes The document's bytes.
 * @returns The redacted item.
 */
const redacted = (location: string, bytes: Uint8Array): Effect.Effect<Redacted> =>
  open(location, bytes).pipe(
    Effect.map((verdict) => redact(Option.getOrThrow(acceptedItem(verdict)))),
  );

/**
 * The fixture item, redacted: a single Choice (`ANIMAL`) and a multiple Choice (`PRIMES`), each of
 * three choices.
 */
const answerMaskingItem = redacted(
  "fixtures/m4/items/answer-masking.xml",
  fixture("items/answer-masking.xml"),
);

/**
 * An item of a Text Entry and an Inline Choice and no Choice, written for this test.
 */
const textItem = redacted(
  "items/text-and-inline.xml",
  new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="text-and-inline" title="Text and inline" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="CITY" cardinality="single" base-type="string"/>
  <qti-response-declaration identifier="BANK" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <p>The capital of Italy is <qti-text-entry-interaction response-identifier="CITY" expected-length="8"/>, which lies on the
      <qti-inline-choice-interaction response-identifier="BANK" shuffle="false">
        <qti-inline-choice identifier="LEFT">left</qti-inline-choice>
        <qti-inline-choice identifier="RIGHT">right</qti-inline-choice>
      </qti-inline-choice-interaction> bank of the Tiber.</p>
  </qti-item-body>
</qti-assessment-item>`),
);

/**
 * Render a redacted item as a host does, with the default configuration and this file's instance.
 *
 * @param item The redacted item.
 * @param options The render's further options, none by default.
 * @returns The item's HTML.
 */
const htmlOf = (item: Redacted, options: Options = {}): Effect.Effect<string> =>
  configure({}).pipe(
    Effect.orDie,
    Effect.map(
      (configuration) =>
        Result.getOrThrow(render(item, configuration, { instance, ...options })).html,
    ),
  );

/**
 * List the elements at or below some nodes, in document order.
 *
 * @param nodes The nodes.
 * @returns Each element among them and below them.
 */
const elementsBelow = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsBelow(node.children)] : []));

/**
 * Find the elements of some nodes that carry a part marker.
 *
 * @param nodes The nodes to search.
 * @param marker The part's `data-slot` value.
 * @returns The elements at or below `nodes` carrying it, in document order.
 */
const withSlot = (nodes: readonly Node[], marker: string): readonly Element[] =>
  elementsBelow(nodes).filter((element) => element.attrs["data-slot"] === marker);

/**
 * Give an element's element children.
 *
 * @param element The element.
 * @returns Its children that are elements, in order.
 */
const elementChildren = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Parse an item's HTML and give its Choice Roots, in document order.
 *
 * @param html The item's HTML.
 * @returns The Choice Roots: the single Choice, then the multiple Choice.
 */
const choiceRoots = (html: string): readonly Element[] => withSlot(parseHtml(html), slot.root);

/**
 * Give the rows of a Choice Root, its `li` elements in order.
 *
 * @param root The Choice Root.
 * @returns The Root's choice rows.
 */
const rowsOf = (root: Element): readonly Element[] => withSlot([root], slot.choice);

/**
 * Give an element, failing the test when there is none.
 *
 * @param element The element, if any.
 * @param what What the test looked for.
 * @returns The element.
 */
const found = (element: Element | undefined, what: string): Element =>
  element ?? assert.fail(`There is no ${what}.`);

/**
 * Whether an element carries the `open` attribute, which a parsed boolean attribute holds as an
 * empty string.
 *
 * @param element The element.
 * @returns Whether it has `open`.
 */
const isOpen = (element: Element): boolean => element.attrs["open"] !== undefined;

/**
 * Read an attribute of an element as text.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns The value, the empty string when the attribute is absent or a boolean one.
 */
const textAttribute = (element: Element, name: string): string => {
  const value = element.attrs[name];

  return value === undefined || value === true ? "" : value;
};

/**
 * Give the `[name, value]` of every Control in an item's HTML, in document order.
 *
 * @param html The item's HTML.
 * @returns One entry per Control, the entry a form would post if that Control were chosen.
 */
const controlEntries = (html: string): readonly Entry[] =>
  withSlot(parseHtml(html), slot.control).map((control): Entry => [
    textAttribute(control, "name"),
    textAttribute(control, "value"),
  ]);

/**
 * Keep the entries a form would post when the candidate chooses some choices of one response.
 *
 * @param entries Every Control's entry.
 * @param response The response's identifier.
 * @param values The identifiers of the chosen choices.
 * @returns The entries of that response whose value is chosen, in document order.
 */
const postedBy = (
  entries: readonly Entry[],
  response: string,
  values: readonly string[],
): readonly Entry[] =>
  entries.filter(
    ([name, value]) =>
      name === `${instance}.${response}` && values.some((chosen) => chosen === value),
  );

/**
 * Decode what a form posts when the candidate chooses some choices of one response, as a host does,
 * under the entry name the Controls post under.
 *
 * @param entries Every Control's entry.
 * @param response The response's identifier.
 * @param cardinality The response's cardinality.
 * @param values The identifiers of the chosen choices.
 * @returns The decoded value, or the {@link Malformed} `decode` gave.
 */
const decoded = (
  entries: readonly Entry[],
  response: "ANIMAL" | "PRIMES",
  cardinality: "multiple" | "single",
  ...values: readonly string[]
): Value | Malformed =>
  Result.merge(
    decode(postedBy(entries, response, values), {
      baseType: "identifier",
      cardinality,
      name: `${instance}.${response}`,
    }),
  );

/**
 * Construct the value of an identifier response, as the author's `values` option gives it.
 *
 * @param cardinality The response's cardinality.
 * @param identifiers The identifiers it holds.
 * @returns The value.
 */
const identifiers = (cardinality: "multiple" | "single", ...chosen: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality,
  values: chosen.map((value) => ({ baseType: "identifier", value })),
});

describe("answer masking on Choice", () => {
  it.effect("[A-8] without answer masking the Choice HTML is unchanged", () =>
    Effect.gen(function* unmasked() {
      const item = yield* answerMaskingItem;
      const plain = yield* htmlOf(item);

      assert.strictEqual(yield* htmlOf(item, { supports: noSupports }), plain);
      assert.strictEqual(
        yield* htmlOf(item, { supports: { ...noSupports, answerMasking: false } }),
        plain,
      );
      assert.notInclude(plain, 'data-slot="choice-interaction-mask"');
      assert.notInclude(plain, 'data-slot="choice-interaction-mask-toggle"');
      assert.notInclude(plain, "<details");
      assert.notInclude(plain, "<summary");

      const roots = choiceRoots(plain);

      assert.lengthOf(roots, 2);
      for (const root of roots) {
        const rows = rowsOf(root);

        assert.lengthOf(rows, 3);
        for (const row of rows) {
          assert.deepStrictEqual(
            elementChildren(row).map((child) => [child.tag, child.attrs["data-slot"]]),
            [
              ["input", slot.control],
              ["label", slot.label],
            ],
          );
        }
      }
    }),
  );

  it.effect(
    "[A-8] with answer masking every choice's Control and Label sit inside a closed details",
    () =>
      Effect.gen(function* covered() {
        const html = yield* htmlOf(yield* answerMaskingItem, { supports: masking });
        const roots = choiceRoots(html);

        assert.lengthOf(roots, 2);
        for (const root of roots) {
          const rows = rowsOf(root);
          const masks = withSlot([root], slot.mask);

          assert.lengthOf(rows, 3);
          assert.lengthOf(masks, rows.length);
          for (const row of rows) {
            const [first, ...others] = elementChildren(row);
            const mask = found(first, "mask");

            assert.lengthOf(others, 0, "the row holds nothing beside its mask");
            assert.strictEqual(mask.tag, "details");
            assert.strictEqual(mask.attrs["data-slot"], slot.mask);
            assert.isFalse(isOpen(mask), "the mask is closed");
            assert.deepStrictEqual(
              elementChildren(mask).map((child) => [child.tag, child.attrs["data-slot"]]),
              [
                ["summary", slot.maskToggle],
                ["input", slot.control],
                ["label", slot.label],
              ],
            );
          }
        }
      }),
  );

  it.effect("[A-8] each mask's toggle names its choice by position", () =>
    Effect.gen(function* named() {
      const html = yield* htmlOf(yield* answerMaskingItem, { supports: masking });

      for (const root of choiceRoots(html)) {
        assert.deepStrictEqual(
          withSlot([root], slot.maskToggle).map((toggle) => textOf(toggle)),
          ["Show choice 1 of 3", "Show choice 2 of 3", "Show choice 3 of 3"],
        );
      }
    }),
  );

  it.effect("[A-8] masks apply to both a radio and a checkbox Choice", () =>
    Effect.gen(function* radioAndCheckbox() {
      const html = yield* htmlOf(yield* answerMaskingItem, { supports: masking });
      const [single, multiple] = choiceRoots(html);

      for (const [root, type] of [
        [found(single, "single Choice"), "radio"],
        [found(multiple, "multiple Choice"), "checkbox"],
      ] as const) {
        const masks = withSlot([root], slot.mask);

        assert.deepStrictEqual(
          withSlot([root], slot.control).map((control) => control.attrs["type"]),
          [type, type, type],
        );
        assert.lengthOf(masks, 3);
        for (const mask of masks) {
          assert.lengthOf(withSlot([mask], slot.control), 1);
        }
      }
    }),
  );

  it.effect("[A-8] a restored choice renders its mask open and the others closed", () =>
    Effect.gen(function* restored() {
      const html = yield* htmlOf(yield* answerMaskingItem, {
        supports: masking,
        values: {
          ANIMAL: identifiers("single", "TROUT"),
          PRIMES: identifiers("multiple", "NINE"),
        },
      });

      for (const root of choiceRoots(html)) {
        const masks = withSlot([root], slot.mask);

        assert.deepStrictEqual(masks.map(isOpen), [false, true, false]);
        assert.deepStrictEqual(
          masks.map((mask) =>
            withSlot([mask], slot.control).some((c) => c.attrs["checked"] !== undefined),
          ),
          [false, true, false],
          "a mask is open exactly when its Control is checked",
        );
      }
    }),
  );

  it.effect("[A-8] review and solution modes and a finished item render no mask", () =>
    // A pin, until the mask exists: before it, no render of any mode holds a `details`, so these
    // cases cannot differ from the answering one yet. After it, they hold the line: the mask is a
    // first-presentation cover, so it is rendered in `answering` and nowhere else.
    Effect.gen(function* unmaskedElsewhere() {
      const item = yield* answerMaskingItem;
      const values = {
        ANIMAL: identifiers("single", "TROUT"),
        PRIMES: identifiers("multiple", "SEVEN", "ELEVEN"),
      };
      const cases: readonly (readonly [string, Options])[] = [
        ["review", { mode: "review", supports: masking, values }],
        ["solution", { mode: "solution", supports: masking, values }],
        ["finished", { disabled: true, supports: masking }],
      ];

      for (const [label, options] of cases) {
        const html = yield* htmlOf(item, options);

        assert.notInclude(html, "<details", label);
        assert.notInclude(html, "<summary", label);
        assert.notInclude(html, 'data-slot="choice-interaction-mask', label);
        for (const root of choiceRoots(html)) {
          for (const row of rowsOf(root)) {
            assert.deepStrictEqual(
              elementChildren(row).map((child) => child.tag),
              ["input", "label"],
              label,
            );
          }
        }
      }
    }),
  );

  it.effect("[A-8] a post from a masked Choice decodes as from an unmasked one", () =>
    // A pin: masking changes no name, value or type a Control posts under, so it holds before and
    // after the mask.
    Effect.gen(function* postsAlike() {
      const item = yield* answerMaskingItem;
      const unmasked = controlEntries(yield* htmlOf(item));
      const masked = controlEntries(yield* htmlOf(item, { supports: masking }));

      assert.lengthOf(unmasked, 6);
      assert.deepStrictEqual(masked, unmasked);

      assert.deepStrictEqual(
        decoded(masked, "ANIMAL", "single", "TROUT"),
        decoded(unmasked, "ANIMAL", "single", "TROUT"),
      );
      assert.deepStrictEqual(
        decoded(masked, "PRIMES", "multiple", "SEVEN", "ELEVEN"),
        decoded(unmasked, "PRIMES", "multiple", "SEVEN", "ELEVEN"),
      );
      assert.deepStrictEqual(decoded(masked, "ANIMAL", "single", "TROUT"), {
        baseType: "identifier",
        cardinality: "single",
        values: [{ baseType: "identifier", value: "TROUT" }],
      });
    }),
  );

  it.effect("[A-8] other interactions are never masked", () =>
    // A pin: a Text Entry and an Inline Choice have no mask, with the support on or off.
    Effect.gen(function* onlyChoice() {
      const item = yield* textItem;
      const plain = yield* htmlOf(item);
      const covered = yield* htmlOf(item, { supports: masking });

      assert.include(plain, "text-entry-interaction");
      assert.include(plain, "inline-choice-interaction");
      assert.strictEqual(covered, plain);
      assert.notInclude(covered, "<details");
    }),
  );

  it.effect("[A-8] a PNP that activates answer masking at start masks the Choice", () =>
    Effect.gen(function* pnpMasks() {
      const supports = yield* readPnp(fixture("pnp-answer-masking.xml"));

      assert.isTrue(supports.answerMasking);
      assert.isTrue(supports.atStart.has("answer-masking"));

      const html = yield* htmlOf(yield* answerMaskingItem, { supports });
      const roots = choiceRoots(html);

      assert.lengthOf(roots, 2);
      for (const root of roots) {
        const rows = rowsOf(root);

        assert.lengthOf(rows, 3);
        for (const row of rows) {
          assert.deepStrictEqual(
            elementChildren(row).map((child) => [child.tag, child.attrs["open"]]),
            [["details", undefined]],
          );
        }
      }
    }),
  );

  it.effect(
    "[A-8] a PNP that offers answer masking only as an option, or prohibits it, leaves the Choice unmasked",
    () =>
      // A pin on D17: a feature in `activate-as-option-set` alone is off at start, and
      // `prohibit-set` wins over an at-start named one.
      Effect.gen(function* pnpLeavesUnmasked() {
        const item = yield* answerMaskingItem;
        const plain = yield* htmlOf(item);
        const namespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0pnp_v1p0";
        const profiles = [
          "<answer-masking/><activate-as-option-set><answer-masking/></activate-as-option-set>",
          "<activate-at-initialization-set><answer-masking/></activate-at-initialization-set><prohibit-set><answer-masking/></prohibit-set>",
        ];

        for (const children of profiles) {
          const supports = yield* readPnp(
            new TextEncoder().encode(
              `<access-for-all-pnp xmlns="${namespace}">${children}</access-for-all-pnp>`,
            ),
          );

          assert.isFalse(supports.answerMasking, children);
          assert.strictEqual(yield* htmlOf(item, { supports }), plain, children);
        }
      }),
  );

  it.effect("[A-8] a masked Choice passes the accessibility checks of an unmasked one", () =>
    Effect.gen(function* checked() {
      const item = yield* answerMaskingItem;

      for (const supports of [noSupports, masking]) {
        const page = found(
          elementsBelow(parseHtml(yield* htmlOf(item, { supports }))).find(
            (element) => element.attrs["data-slot"] === rowFor("item", "root").slot,
          ),
          "item root",
        );

        assert.deepStrictEqual(checkTree(page, { baseLevel: 2 }), []);
      }
    }),
  );

  it.effect(
    "[A-8] the mask and its toggle are parts a host may swap, each keeping its children",
    () =>
      Effect.gen(function* swapped() {
        const html = yield* htmlOf(yield* answerMaskingItem, {
          parts: {
            "choice-interaction": {
              mask: (props, children) =>
                h("details", { ...props, "data-swapped": "mask" }, children),
              maskToggle: (props, children) =>
                h("summary", { ...props, "data-swapped": "toggle" }, children),
            },
          },
          supports: masking,
        });

        for (const root of choiceRoots(html)) {
          const masks = withSlot([root], slot.mask);

          assert.lengthOf(masks, 3);
          for (const mask of masks) {
            assert.strictEqual(mask.attrs["data-swapped"], "mask");
            assert.deepStrictEqual(
              elementChildren(mask).map((child) => child.tag),
              ["summary", "input", "label"],
            );
            assert.strictEqual(
              found(elementChildren(mask)[0], "toggle").attrs["data-swapped"],
              "toggle",
            );
          }
        }
      }),
  );
});
