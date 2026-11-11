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
 * @param rewrite A rewrite of the item's text, for a row that needs a variant of the item; the
 *   item as written when absent.
 * @returns The page's HTML and the redacted item's JSON text.
 */
const shownTo = Effect.fnUntraced(function* shownTo(
  supports: Supports,
  rewrite: (xml: string) => string = (xml) => xml,
) {
  const source = new TextDecoder().decode(yield* fixtureBytes("items/catalog-supports.xml"));
  const verdict = yield* open(itemLocation, new TextEncoder().encode(rewrite(source)));
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

/**
 * Make a rewrite of the item's text that replaces one text, failing the test when the item holds
 * none, so a variant row cannot pass on an item it did not change.
 *
 * @param from The text the item holds.
 * @param to The text it is replaced with.
 * @returns The rewrite, for {@link shownTo}.
 */
const replacing =
  (from: string, to: string) =>
  (xml: string): string =>
    xml.includes(from) ? xml.replace(from, to) : assert.fail(`the item holds no ${from}`);

/**
 * Find the item Root of a page, failing the test when the page holds none or several.
 *
 * @param html The page's HTML.
 * @returns The element marked `data-slot="item"`.
 */
const rootOf = (html: string): Element => {
  const found = elementsOf(parseHtml(html)).filter(
    (element) => element.attrs["data-slot"] === "item",
  );
  const [only, ...rest] = found;

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one item Root, found ${found.length}`);
};

/**
 * Read the `srclang` of each `track` of a page that carries `default`, in document order.
 *
 * @param html The page's HTML.
 * @returns The `srclang` of every defaulted track, as written.
 */
const defaultedTracks = (html: string): readonly (string | true | undefined)[] =>
  elementsOf(parseHtml(html))
    .filter((element) => element.tag === "track" && Object.hasOwn(element.attrs, "default"))
    .map((track) => track.attrs["srclang"]);

/**
 * Pair each element below nodes, in document order, with the node that follows it among its
 * siblings, if any.
 *
 * @param nodes The nodes.
 * @returns Every element they hold and its next sibling.
 */
const withNext = (nodes: readonly Node[]): readonly (readonly [Element, Option.Option<Node>])[] =>
  nodes.flatMap((node, index): readonly (readonly [Element, Option.Option<Node>])[] =>
    node.kind === "element"
      ? [[node, Option.fromUndefinedOr(nodes[index + 1])], ...withNext(node.children)]
      : [],
  );

/**
 * Find the image of a page by its `src`, with the node that follows it, failing the test when the
 * page holds none or several.
 *
 * @param html The page's HTML.
 * @param src The image's package-relative `src` as the fixture writes it.
 * @returns The image and its next sibling.
 */
const imageOf = (html: string, src: string): readonly [Element, Option.Option<Node>] => {
  const found = withNext(parseHtml(html)).filter(
    ([element]) => element.tag === "img" && element.attrs["src"] === `${assetBase}${src}`,
  );
  const [only, ...rest] = found;

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one image ${src}, found ${found.length}`);
};

/**
 * Tell whether a node is an element that stands as alternative text: a `span` marked
 * `data-slot="alt-text"` and hidden from assistive technology.
 *
 * @param node The node, if any.
 * @returns The element's text when it is one; none otherwise.
 */
const altTextOf = (node: Option.Option<Node>): Option.Option<string> =>
  node.pipe(
    Option.filter(
      (next): next is Element =>
        next.kind === "element" &&
        next.tag === "span" &&
        next.attrs["data-slot"] === "alt-text" &&
        next.attrs["aria-hidden"] === "true",
    ),
    Option.map(textOf),
  );

/**
 * The two images of the fixture's body that carry an `alt`, by their package-relative `src`, with
 * the `alt` each carries.
 */
const bodyImages: readonly (readonly [src: string, alt: string])[] = [
  [
    "images/kelp-forest.png",
    "Sunlight falls through a dense kelp forest onto a school of small fish",
  ],
  ["images/kelp-canopy.png", "The kelp canopy seen from a boat, a dark green mat on the surface"],
];

/**
 * The text of the fixture's keyword-emphasis element, which nothing else in the item says.
 */
const emphasised = "cold and rich in nutrients";

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

describe("PNP-driven keyword emphasis, captions and alternative text", () => {
  const emphasis = "data-keyword-emphasis";

  it.effect("[A-23] keyword emphasis marks the item for candidates who ask", () =>
    Effect.gen(function* marked() {
      const source = yield* pnpText("pnp-catalog.xml");
      const asking = yield* pnpFromText(source);
      const { html } = yield* shownTo(asking);

      assert.isTrue(asking.display.keywordEmphasis, "the PNP asks for keyword emphasis");
      assert.isTrue(
        Object.hasOwn(rootOf(html).attrs, emphasis),
        "the item Root carries the marker",
      );
      assert.strictEqual(
        elementsOf(parseHtml(html)).filter((element) => Object.hasOwn(element.attrs, emphasis))
          .length,
        1,
        "only the Root carries it",
      );

      const optional = yield* pnpOf("pnp-catalog-optional.xml");
      const declined = yield* pnpFromText(prohibiting(source, ["keyword-emphasis"]));

      assert.isFalse(optional.display.keywordEmphasis, "an option-only preference is off");
      assert.isFalse(declined.display.keywordEmphasis, "a prohibited preference reaches no field");

      for (const candidate of [optional, declined, noSupports]) {
        const plain = yield* shownTo(candidate);

        assert.isFalse(
          Object.hasOwn(rootOf(plain.html).attrs, emphasis),
          "a candidate who does not ask has no marker",
        );
      }
    }),
  );

  it.effect("[A-23] without the preference qti-keyword-emphasis renders plain", () =>
    Effect.gen(function* plain() {
      const source = yield* pnpText("pnp-catalog.xml");
      const asking = yield* shownTo(yield* pnpFromText(source));
      const declined = yield* shownTo(
        yield* pnpFromText(prohibiting(source, ["keyword-emphasis"])),
      );

      for (const { html } of [asking, declined, yield* shownTo(noSupports)]) {
        const spans = elementsOf(parseHtml(html)).filter(
          (element) => element.tag === "span" && element.attrs["class"] === "qti-keyword-emphasis",
        );

        assert.deepStrictEqual(spans.map(textOf), [emphasised], "the span keeps its class");
      }

      assert.strictEqual(
        asking.html.replace(` ${emphasis}`, ""),
        declined.html,
        "the marker on the Root is the only difference the preference makes",
      );
    }),
  );

  it.effect("[A-13a] a candidate with captions gets the matching captions track as default", () =>
    Effect.gen(function* captioned() {
      const source = yield* pnpText("pnp-catalog.xml");
      const asking = yield* pnpFromText(source);
      const { html } = yield* shownTo(asking);

      assert.isTrue(asking.captions, "the PNP asks for captions");
      assert.deepStrictEqual(
        defaultedTracks(html),
        ["en"],
        "the item is en: its en track is the default, though the fr track comes first",
      );

      const optional = yield* pnpOf("pnp-catalog-optional.xml");
      const declined = yield* pnpFromText(prohibiting(source, ["captions"]));

      assert.isFalse(optional.captions, "an option-only preference is off");
      assert.isFalse(declined.captions, "a prohibited preference reaches no field");

      for (const candidate of [optional, declined, noSupports]) {
        assert.deepStrictEqual(
          defaultedTracks((yield* shownTo(candidate)).html),
          [],
          "a candidate who does not ask has no default track",
        );
      }
    }),
  );

  it.effect(
    "[A-13a] with no track in the item's language the first captions track is the default",
    () =>
      Effect.gen(function* firstTrack() {
        const asking = yield* pnpOf("pnp-catalog.xml");
        const { html } = yield* shownTo(asking, replacing('xml:lang="en">', 'xml:lang="de">'));

        assert.deepStrictEqual(defaultedTracks(html), ["fr"]);
      }),
  );

  it.effect(
    "[A-13a] the language of a track is compared as a language tag, without regard to case",
    () =>
      Effect.gen(function* cased() {
        const asking = yield* pnpOf("pnp-catalog.xml");
        const { html } = yield* shownTo(asking, replacing('srclang="en"', 'srclang="EN"'));

        assert.deepStrictEqual(defaultedTracks(html), ["EN"]);
      }),
  );

  it.effect(
    "[A-13a] a track of another kind is never the default, and an author's default stands",
    () =>
      Effect.gen(function* kinds() {
        const asking = yield* pnpOf("pnp-catalog.xml");
        const subtitled = yield* shownTo(
          asking,
          replacing(
            '<track kind="captions" src="media/kelp-forest.en.vtt"',
            '<track kind="subtitles" src="media/kelp-forest.en.vtt"',
          ),
        );
        const authored = yield* shownTo(
          asking,
          replacing('srclang="fr"/>', 'srclang="fr" default="default"/>'),
        );

        assert.deepStrictEqual(
          defaultedTracks(subtitled.html),
          ["fr"],
          "the en track is subtitles, so the fr captions track is the only one to default",
        );
        assert.deepStrictEqual(
          defaultedTracks(authored.html),
          ["fr"],
          "the author's default on fr stays alone, as two defaults are not valid",
        );
      }),
  );

  it.effect(
    "[A-7] a candidate with alternative text sees it next to the image, still programmatic",
    () =>
      Effect.gen(function* shown() {
        const source = yield* pnpText("pnp-catalog.xml");
        const asking = yield* pnpFromText(source);
        const { html } = yield* shownTo(asking);

        assert.isTrue(asking.alternativeText, "the PNP asks for alternative text");

        for (const [src, alt] of bodyImages) {
          const [image, next] = imageOf(html, src);

          assert.strictEqual(image.attrs["alt"], alt, `${src} keeps its alt as its name`);
          assert.deepStrictEqual(
            altTextOf(next),
            Option.some(alt),
            `${src} is followed by its text`,
          );
        }

        const optional = yield* pnpOf("pnp-catalog-optional.xml");
        const declined = yield* pnpFromText(prohibiting(source, ["alternative-text"]));

        assert.isFalse(optional.alternativeText, "an option-only preference is off");
        assert.isFalse(declined.alternativeText, "a prohibited preference reaches no field");

        for (const candidate of [optional, declined, noSupports]) {
          const plain = yield* shownTo(candidate);

          for (const [src, alt] of bodyImages) {
            const [image, next] = imageOf(plain.html, src);

            assert.strictEqual(image.attrs["alt"], alt, `${src} keeps its alt`);
            assert.isTrue(Option.isNone(altTextOf(next)), `${src}: no visible text for others`);
          }
          assert.notInclude(plain.html, 'data-slot="alt-text"');
        }
      }),
  );

  it.effect("[A-7] an image with an empty or blank alt gets no alternative text", () =>
    Effect.gen(function* blank() {
      const asking = yield* pnpOf("pnp-catalog.xml");
      const [canopy, canopyAlt] = bodyImages[1] ?? assert.fail("the fixture has two images");

      for (const written of ["", " "]) {
        const { html } = yield* shownTo(
          asking,
          replacing(`alt="${canopyAlt}"`, `alt="${written}"`),
        );
        const [image, next] = imageOf(html, canopy);

        assert.strictEqual(image.attrs["alt"], written, "the alt is as written");
        assert.isTrue(Option.isNone(altTextOf(next)), `alt="${written}" shows no text`);
        assert.isTrue(
          Option.isSome(altTextOf(imageOf(html, "images/kelp-forest.png")[1])),
          "the other image still does",
        );
      }
    }),
  );

  it.effect("[A-7] [A-13a] the two supports add only the text after an image and one default", () =>
    Effect.gen(function* additions() {
      const source = yield* pnpText("pnp-catalog.xml");
      const both = yield* shownTo(yield* pnpFromText(source));
      const neither = yield* shownTo(
        yield* pnpFromText(prohibiting(source, ["captions", "alternative-text"])),
      );

      assert.notStrictEqual(both.html, neither.html, "the supports change the page");
      assert.strictEqual(
        both.html
          .replaceAll(/<span [^>]*data-slot="alt-text"[^>]*>[^<]*<\/span>/gu, "")
          .replace(" default>", ">"),
        neither.html,
        "everything else is as it is for a candidate who asks for neither",
      );
      assert.strictEqual(both.json, neither.json, "the redacted value does not change");
    }),
  );
});
