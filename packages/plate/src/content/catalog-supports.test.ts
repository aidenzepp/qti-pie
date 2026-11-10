import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import {
  acceptedItem,
  configure,
  encodeRedacted,
  noSupports,
  open,
  readPnp,
  redact,
  render,
} from "#plate/index.ts";
import type { CatalogSupport, Element, Node, PnpSupports, Supports } from "#plate/index.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * Where the catalog-supports fixture sits under the package, which `open` takes as the document's
 * location.
 */
const itemLocation = "fixtures/m5/items/catalog-supports.xml";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "q1";

/**
 * An asset base on another origin, with its closing slash, which a package-relative `src` resolves
 * against.
 */
const assetBase = "https://cdn.example/pkg/";

/**
 * The text of the fixture's first paragraph, the element that names the `support-cards` catalog
 * by `data-catalog-idref`.
 */
const naming = "A kelp forest grows in cold, clear water";

/**
 * The text each text-only card of the fixture holds and nothing else in the item does, by its
 * support: the four rows A-5, A-22, A-28 and A-38 name.
 */
const textCards: readonly (readonly [support: CatalogSupport, text: string])[] = [
  [
    "additional-directions",
    "Study the passage once, then say its main idea in your own words before you answer.",
  ],
  [
    "keyboard-directions",
    "Press the arrow keys to move between the choices, then press Space to pick one.",
  ],
  [
    "linguistic-guidance",
    "Here a forest means many tall sea plants growing close together under water.",
  ],
  ["simplified-language-portions", "Kelp is a big sea plant. Small fish hide in it."],
];

/**
 * The path of the image the fixture's `simplified-graphics` card holds, which no other element of
 * the item names.
 */
const simplifiedImage = "images/kelp-forest-simple.png";

/**
 * Every card the profile can activate for the rows A-5, A-22, A-28, A-37 and A-38, by its support,
 * with what is searched for in the page to tell whether the card shows: the text of a text card,
 * the image path of the graphics card.
 */
const needles: readonly (readonly [support: CatalogSupport, needle: string])[] = [
  ...textCards,
  ["simplified-graphics", simplifiedImage],
];

/**
 * The Spanish entry of the fixture's `keyword-translation` card, `xml:lang="es"`.
 */
const spanish = "bosque de algas";

/**
 * The French entry of the fixture's `keyword-translation` card, `xml:lang="fr"`, the default.
 */
const french = "forêt de varech";

/**
 * Read a file of `fixtures/m5` as bytes, as a host reads a document from storage.
 *
 * @param name The file's name under `fixtures/m5`.
 * @returns The file's bytes.
 */
const fixtureBytes = (name: string): Effect.Effect<Uint8Array> =>
  Effect.promise(() =>
    readFile(path.resolve(import.meta.dirname, "..", "..", "fixtures", "m5", name)),
  );

/**
 * Read a PNP fixture of `fixtures/m5` through `readPnp`, as a host builds one candidate's supports.
 *
 * @param name The fixture's name under `fixtures/m5`.
 * @returns The supports the profile asks for.
 */
const pnpOf = (name: string): Effect.Effect<PnpSupports> =>
  Effect.flatMap(fixtureBytes(name), (bytes) => readPnp(bytes).pipe(Effect.orDie));

/**
 * Read a PNP fixture's text, which a test rewrites into a variant profile.
 *
 * @param name The fixture's name under `fixtures/m5`.
 * @returns The fixture's text.
 */
const pnpText = (name: string): Effect.Effect<string> =>
  Effect.map(fixtureBytes(name), (bytes) => new TextDecoder().decode(bytes));

/**
 * Read a profile's text through `readPnp`.
 *
 * @param xml The profile's text.
 * @returns The supports the profile asks for.
 */
const pnpFromText = (xml: string): Effect.Effect<PnpSupports> =>
  readPnp(new TextEncoder().encode(xml)).pipe(Effect.orDie);

/**
 * What one candidate is shown: the item's HTML and the redacted item's JSON text.
 */
interface Shown {
  readonly html: string;
  readonly json: string;
}

/**
 * Open the catalog-supports fixture, redact it under the supports and render it, as a host does
 * for one candidate: the supports go to both `redact` and `render`.
 *
 * @param supports The supports the host enabled for the candidate.
 * @returns The page's HTML and the redacted item's JSON text.
 */
const shownTo = Effect.fnUntraced(function* shownTo(supports: Supports) {
  const verdict = yield* open(itemLocation, yield* fixtureBytes("items/catalog-supports.xml"));
  const accepted = Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the fixture is ${verdict.verdict}, not accepted`),
  );
  const configuration = yield* configure({});
  const redacted = redact(accepted, undefined, undefined, { supports });
  const rendered = yield* Effect.fromResult(
    render(redacted, configuration, { assetBase, instance, supports }),
  );
  const json = JSON.stringify(yield* Effect.fromResult(encodeRedacted(redacted)));

  return { html: rendered.html, json } satisfies Shown;
});

/**
 * Tell whether a text sits in the page after the anchor, the way a card's content follows the
 * element that names its catalog.
 *
 * @param html The page's HTML.
 * @param anchor A text of the element that names the catalog.
 * @param text The text searched for.
 * @returns Whether the anchor is in the page and the text comes after it.
 */
const follows = (html: string, anchor: string, text: string): boolean => {
  const at = html.indexOf(anchor);

  return at !== -1 && html.indexOf(text, at) > at;
};

/**
 * List the elements below nodes, in document order, the nodes' own elements first.
 *
 * @param nodes The nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Find the list item a catalog listing writes for a card, failing the test when the page holds
 * none or several.
 *
 * @param html The page's HTML.
 * @param support The card's `support`.
 * @returns The card's list item.
 */
const cardItemOf = (html: string, support: string): Element => {
  const found = elementsOf(parseHtml(html)).filter(
    (element) => element.tag === "li" && element.attrs["data-support"] === support,
  );
  const [only, ...rest] = found;

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one ${support} card, found ${found.length}`);
};

/**
 * Collect the text below a node, as written.
 *
 * @param node The node.
 * @returns Its text.
 */
const textOf = (node: Node): string =>
  node.kind === "text" ? node.text : node.children.map(textOf).join("");

/**
 * Rewrite a profile so that its `prohibit-set` names features: the set is added before the
 * profile's closing tag.
 *
 * @param xml The profile's text.
 * @param features The features to prohibit, by their element names.
 * @returns The profile with the set.
 */
const prohibiting = (xml: string, features: readonly string[]): string =>
  xml.replace(
    "</access-for-all-pnp>",
    `<prohibit-set>${features.map((feature) => `<${feature}/>`).join("")}</prohibit-set></access-for-all-pnp>`,
  );

describe("PNP-driven catalog content supports", () => {
  it.effect("[A-5] [A-22] [A-28] [A-38] an at-start catalog support shows its card content", () =>
    Effect.gen(function* atStart() {
      const supports = yield* pnpOf("pnp-catalog.xml");
      const { html } = yield* shownTo(supports);

      for (const [support, text] of textCards) {
        assert.isTrue(supports.catalog.has(support), `${support} is active in the PNP's supports`);
        assert.isTrue(
          follows(html, naming, text),
          `${support}: its card's text follows the element that names the catalog`,
        );
      }
    }),
  );

  it.effect("[A-5] [A-22] [A-28] [A-38] an option-only support leaves its card dormant", () =>
    Effect.gen(function* optionOnly() {
      const supports = yield* pnpOf("pnp-catalog-optional.xml");

      assert.isEmpty([...supports.catalog], "no catalog support is active at the start");
      for (const [support] of textCards) {
        assert.isTrue(supports.optional.has(support), `${support} is optional`);
      }

      for (const candidate of [supports, noSupports]) {
        const { html, json } = yield* shownTo(candidate);

        for (const [support, text] of textCards) {
          assert.notInclude(html, text, `${support}: its card's text is not in the HTML`);
          assert.notInclude(json, text, `${support}: its card's text is not in the redacted value`);
        }
      }
    }),
  );

  it.effect(
    "[A-37] simplified graphics replaces or follows the image with its card's alternative",
    () =>
      Effect.gen(function* simplifiedGraphics() {
        const supports = yield* pnpOf("pnp-catalog.xml");
        const { html } = yield* shownTo(supports);
        const card = cardItemOf(html, "simplified-graphics");
        const images = elementsOf(card.children).filter((element) => element.tag === "img");

        assert.deepStrictEqual(
          images.map((image) => image.attrs["src"]),
          [`${assetBase}${simplifiedImage}`],
          "the card's image is in its list item",
        );
        assert.deepStrictEqual(
          images.map((image) => image.attrs["alt"]),
          ["Three tall green stripes standing in blue water"],
          "the card's image keeps its alt",
        );
        assert.isTrue(
          follows(html, "images/kelp-forest.png", simplifiedImage),
          "the card's image follows the image that names the catalog",
        );

        const plain = yield* shownTo(noSupports);

        assert.notInclude(plain.html, simplifiedImage, "no candidate without the support sees it");
        assert.include(plain.html, "images/kelp-forest.png", "the image the card replaces stays");
      }),
  );

  it.effect("[A-24] keyword translation shows the entry in the candidate's language", () =>
    Effect.gen(function* translated() {
      const supports = yield* pnpOf("pnp-catalog.xml");
      const { html } = yield* shownTo(supports);
      const entry = cardItemOf(html, "keyword-translation");

      assert.deepStrictEqual(supports.keywordTranslationLanguage, Option.some("es"));
      assert.include(html, spanish, "the es entry's text is in the HTML");
      assert.notInclude(html, french, "the fr entry's text is not");
      assert.strictEqual(textOf(entry).trim(), spanish);
      assert.strictEqual(entry.attrs["lang"], "es");
    }),
  );

  it.effect("[A-24] keyword translation in a language no entry has shows the default entry", () =>
    Effect.gen(function* defaulted() {
      const source = yield* pnpText("pnp-catalog.xml");
      const asking = source.replace(
        '<keyword-translation xml:lang="es"/>',
        '<keyword-translation xml:lang="de"/>',
      );

      assert.notStrictEqual(asking, source, "the variant asks for German");

      const supports = yield* pnpFromText(asking);
      const { html } = yield* shownTo(supports);
      const entry = cardItemOf(html, "keyword-translation");

      assert.deepStrictEqual(supports.keywordTranslationLanguage, Option.some("de"));
      assert.include(html, french, "the default entry's text is in the HTML");
      assert.notInclude(html, spanish, "the es entry's text is not");
      assert.strictEqual(textOf(entry).trim(), french);
      assert.strictEqual(entry.attrs["lang"], "fr");
    }),
  );

  it.effect(
    "[A-5] [A-22] [A-28] [A-37] [A-38] a prohibited support stays dormant though the profile assigns it",
    () =>
      Effect.gen(function* prohibited() {
        const source = yield* pnpText("pnp-catalog.xml");

        for (const [support, needle] of needles) {
          const variant = prohibiting(source, [support]);
          const supports = yield* pnpFromText(variant);
          const { html, json } = yield* shownTo(supports);

          assert.isTrue(supports.prohibited.has(support), `${support} is prohibited`);
          assert.isFalse(supports.catalog.has(support), `${support} reaches no catalog field`);
          assert.notInclude(html, needle, `${support}: its card is not in the HTML`);
          assert.notInclude(json, needle, `${support}: its card is not in the redacted value`);

          for (const [other, otherNeedle] of needles.filter(([name]) => name !== support)) {
            assert.include(
              html,
              otherNeedle,
              `${other} still shows when only ${support} is prohibited`,
            );
          }
        }
      }),
  );
});
