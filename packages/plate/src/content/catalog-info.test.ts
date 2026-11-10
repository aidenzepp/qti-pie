import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import {
  acceptedItem,
  configure,
  decodeRedacted,
  encodeRedacted,
  noSupports,
  open,
  redact,
  render,
} from "#plate/index.ts";
import type { Accepted, Element, Node, Redacted, Supports, Verdict } from "#plate/index.ts";
import { checkTree } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";

/**
 * Where the catalog fixture sits under the package, which `open` takes as the document's location.
 */
const fixtureLocation = "fixtures/m3e/items/catalog.xml";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "q1";

/**
 * An asset base on another origin, with its closing slash.
 */
const assetBase = "https://cdn.example/pkg/";

/**
 * The sentence the fixture's `additional-directions` card holds and nothing else in the item does.
 */
const directions = "Read the passage twice before you choose a pool.";

/**
 * The sentence the fixture's `ext:pacing` card holds.
 */
const pacing = "Take a short pause after the passage before the question.";

/**
 * The Spanish entry of the fixture's `keyword-translation` card, `xml:lang="es"`.
 */
const spanish = "poza de marea";

/**
 * The German entry of the fixture's `keyword-translation` card, `xml:lang="de"`, the default.
 */
const german = "Gezeitentümpel";

/**
 * The fixture's `spoken` entry for `data-reading-type="screen-reader"`, by its closing words.
 */
const screenReader = "read by the screen reader";

/**
 * The fixture's `spoken` entry for `data-reading-type="computer-read-aloud"`, by its closing words.
 */
const readAloud = "read aloud by the delivery system";

/**
 * Read the catalog fixture as a host reads a document from storage.
 */
const fixtureBytes: Effect.Effect<Uint8Array> = Effect.promise(() =>
  readFile(path.resolve(import.meta.dirname, "..", "..", fixtureLocation)),
);

/**
 * Take the accepted item out of a verdict, failing the test when the verdict accepts none.
 *
 * @param verdict The verdict.
 * @returns The accepted item.
 */
const acceptedOf = (verdict: Verdict): Accepted =>
  Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the document is ${verdict.verdict}, not accepted`),
  );

/**
 * Open the catalog fixture and take its accepted item.
 *
 * @returns The accepted item and the verdict that gave it.
 */
const acceptFixture = Effect.fnUntraced(function* acceptFixture() {
  const verdict = yield* open(fixtureLocation, yield* fixtureBytes);

  return { accepted: acceptedOf(verdict), verdict };
});

/**
 * Build the supports with the given fields changed from `noSupports`.
 *
 * @param changes The fields to set.
 * @returns The supports.
 */
const supportsWith = (changes: Partial<Supports>): Supports => ({ ...noSupports, ...changes });

/**
 * The supports with the given catalog supports enabled and nothing else.
 *
 * @param names The supports to enable.
 * @returns The supports.
 */
const enabling = (
  ...names: readonly (Supports["catalog"] extends ReadonlySet<infer S> ? S : never)[]
) => supportsWith({ catalog: new Set(names) });

/**
 * Redact the accepted item under the supports and render it with the default configuration, the
 * fixed instance token and the asset base, as a host does for one candidate.
 *
 * @param accepted The accepted item.
 * @param supports The supports the host enabled.
 * @returns The HTML the render wrote.
 */
const renderedHtml = Effect.fnUntraced(function* renderedHtml(
  accepted: Accepted,
  supports: Supports,
) {
  const configuration = yield* configure({});
  const rendered = yield* Effect.fromResult(
    render(redact(accepted, undefined, undefined, { supports }), configuration, {
      assetBase,
      instance,
      supports,
    }),
  );

  return rendered.html;
});

/**
 * Write a redacted item as the JSON text a host sends to a page.
 *
 * @param redacted The redacted item.
 * @returns The JSON text.
 */
const jsonOf = Effect.fnUntraced(function* jsonOf(redacted: Redacted) {
  return JSON.stringify(yield* Effect.fromResult(encodeRedacted(redacted)));
});

/**
 * Parse one emitted HTML fragment into its single root element.
 *
 * @param html The fragment.
 * @returns Its root element.
 */
const rootOf = (html: string): Element => {
  const [root, ...rest] = parseHtml(html);
  assert.lengthOf(rest, 0, "the fragment has one root");

  return root?.kind === "element" ? root : assert.fail("the fragment's root is not an element");
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
 * List an element's child elements, leaving out the text between them.
 *
 * @param element The parent.
 * @returns Its element children, in document order.
 */
const childrenOf = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Collect the text below a node, as written.
 *
 * @param node The node.
 * @returns Its text.
 */
const textOf = (node: Node): string =>
  node.kind === "text" ? node.text : node.children.map(textOf).join("");

/**
 * Find every catalog listing of a page: each `ul` carrying `data-catalog`.
 *
 * @param root The page's Root element.
 * @returns The listings, in document order.
 */
const listingsOf = (root: Element): readonly Element[] =>
  elementsOf(root.children).filter(
    (element) => element.tag === "ul" && Object.hasOwn(element.attrs, "data-catalog"),
  );

/**
 * Find the one listing of a catalog, failing the test when there is not exactly one.
 *
 * @param root The page's Root element.
 * @param id The catalog's id.
 * @returns The listing.
 */
const listingOf = (root: Element, id: string): Element => {
  const found = listingsOf(root).filter((listing) => listing.attrs["data-catalog"] === id);
  const [only, ...rest] = found;

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one listing of ${id}, found ${found.length}`);
};

/**
 * Give the `data-support` of each card a listing holds, in order.
 *
 * @param listing The listing.
 * @returns The supports.
 */
const supportsListed = (listing: Element): readonly (string | true | undefined)[] =>
  childrenOf(listing).map((card) => card.attrs["data-support"]);

/**
 * Give the position of a Root child among the Root's children: the index of the child that is or
 * holds the element.
 *
 * @param root The Root.
 * @param element The element.
 * @returns The index, or -1 when no child holds it.
 */
const positionIn = (root: Element, element: Element): number =>
  root.children.findIndex(
    (child) =>
      child.kind === "element" && (child === element || elementsOf([child]).includes(element)),
  );

/**
 * Find the Root child that carries a `data-slot`, failing when there is not exactly one.
 *
 * @param root The Root.
 * @param slot The marker.
 * @returns The child.
 */
const childSlotted = (root: Element, slot: string): Element => {
  const found = childrenOf(root).filter((child) => child.attrs["data-slot"] === slot);
  const [only, ...rest] = found;

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one Root child marked ${slot}, found ${found.length}`);
};

describe("I-14: catalogs, listed and resolved by the enabled supports", () => {
  it.effect("[I-14] open accepts the catalog fixture and marks no catalog unsupported", () =>
    Effect.gen(function* accepts() {
      const { accepted } = yield* acceptFixture();

      assert.deepStrictEqual(
        accepted.unsupported.filter(({ feature }) => feature === "qti-catalog-info"),
        [],
      );
    }),
  );

  it.effect(
    "[I-14] with noSupports every card is dormant: absent from the HTML and the redacted copy",
    () =>
      Effect.gen(function* dormant() {
        const { accepted } = yield* acceptFixture();
        const html = yield* renderedHtml(accepted, noSupports);
        const json = yield* jsonOf(redact(accepted));

        for (const text of [directions, pacing, spanish, german, screenReader, readAloud]) {
          assert.notInclude(html, text);
          assert.notInclude(json, text);
        }

        assert.notInclude(html, "data-catalog");
        assert.notInclude(json, "descriptions/chart.html");
      }),
  );

  it.effect(
    "[I-14] an enabled support's card is listed after the body, naming its catalog and support",
    () =>
      Effect.gen(function* listed() {
        const { accepted } = yield* acceptFixture();
        const root = rootOf(yield* renderedHtml(accepted, enabling("additional-directions")));
        const listings = listingsOf(root);
        const listing = listingOf(root, "c1");
        const choice = childSlotted(root, "choice-interaction");
        const live = childSlotted(root, "item-live");

        assert.lengthOf(listings, 1);
        assert.strictEqual(listing.attrs["data-references"], "2");
        assert.deepStrictEqual(supportsListed(listing), ["additional-directions"]);
        assert.include(textOf(listing), directions);
        assert.isAbove(positionIn(root, listing), positionIn(root, choice));
        assert.isBelow(positionIn(root, listing), positionIn(root, live));
      }),
  );

  it.effect("[I-14] an enabled ext: support shows its card", () =>
    Effect.gen(function* extension() {
      const { accepted } = yield* acceptFixture();
      const withPacing = yield* renderedHtml(accepted, enabling("ext:pacing"));
      const withoutPacing = yield* renderedHtml(accepted, enabling("additional-directions"));

      assert.include(withPacing, pacing);
      assert.deepStrictEqual(supportsListed(listingOf(rootOf(withPacing), "c1")), ["ext:pacing"]);
      assert.notInclude(withoutPacing, pacing);
    }),
  );

  it.effect("[I-14] a card with entries and no matching parameter gives its default entry", () =>
    Effect.gen(function* defaulted() {
      const { accepted } = yield* acceptFixture();
      const html = yield* renderedHtml(accepted, enabling("keyword-translation"));
      const listing = listingOf(rootOf(html), "c1");

      assert.deepStrictEqual(supportsListed(listing), ["keyword-translation"]);
      assert.include(html, german);
      assert.notInclude(html, spanish);
    }),
  );

  it.effect(
    "[I-14] a card with entries gives the entry that matches the candidate's parameter: keyword-translation by xml:lang",
    () =>
      Effect.gen(function* matchedLanguage() {
        const { accepted } = yield* acceptFixture();
        const html = yield* renderedHtml(
          accepted,
          supportsWith({
            catalog: new Set(["keyword-translation"]),
            keywordTranslationLanguage: Option.some("es"),
          }),
        );

        assert.deepStrictEqual(supportsListed(listingOf(rootOf(html), "c1")), [
          "keyword-translation",
        ]);
        assert.include(html, spanish);
        assert.notInclude(html, german);
      }),
  );

  it.effect(
    "[I-14] a card with entries gives the entry that matches the candidate's parameter: spoken by data-reading-type",
    () =>
      Effect.gen(function* matchedReadingType() {
        const { accepted } = yield* acceptFixture();
        const html = yield* renderedHtml(
          accepted,
          supportsWith({ catalog: new Set(["spoken"]), readAloud: Option.some("screen-reader") }),
        );

        assert.deepStrictEqual(supportsListed(listingOf(rootOf(html), "c1")), ["spoken"]);
        assert.include(html, screenReader);
        assert.notInclude(html, readAloud);
      }),
  );

  it.effect("[I-14] a card with entries, no match and no default gives nothing", () =>
    Effect.gen(function* unmatched() {
      const { accepted } = yield* acceptFixture();
      const supports = enabling("spoken");
      const html = yield* renderedHtml(accepted, supports);
      const json = yield* jsonOf(redact(accepted, undefined, undefined, { supports }));

      assert.notInclude(html, 'data-support="spoken"');
      for (const text of [screenReader, readAloud]) {
        assert.notInclude(html, text);
        assert.notInclude(json, text);
      }
    }),
  );

  it.effect("[I-14] an enabled support with no card in the catalog shows nothing", () =>
    Effect.gen(function* noCard() {
      const { accepted } = yield* acceptFixture();

      assert.strictEqual(
        yield* renderedHtml(accepted, enabling("sign-language")),
        yield* renderedHtml(accepted, noSupports),
      );
    }),
  );

  it.effect("[I-14] an empty card shows nothing and is not listed", () =>
    Effect.gen(function* emptyCard() {
      const { accepted } = yield* acceptFixture();

      assert.strictEqual(
        yield* renderedHtml(accepted, enabling("transcript")),
        yield* renderedHtml(accepted, noSupports),
      );
    }),
  );

  it.effect("[I-14] a card of file hrefs lists each as a link with its type", () =>
    Effect.gen(function* files() {
      const { accepted } = yield* acceptFixture();
      const root = rootOf(yield* renderedHtml(accepted, enabling("long-description")));
      const listing = listingOf(root, "c2");
      const links = elementsOf(listing.children).filter((element) => element.tag === "a");

      assert.deepStrictEqual(supportsListed(listing), ["long-description"]);
      assert.strictEqual(listing.attrs["data-references"], "1");
      assert.lengthOf(links, 1);
      assert.strictEqual(links[0]?.attrs["href"], `${assetBase}descriptions/chart.html`);
      assert.strictEqual(links[0]?.attrs["type"], "text/html");
      assert.strictEqual(textOf(links[0] ?? listing), "descriptions/chart.html");
      assert.lengthOf(listingsOf(root), 1, "c1 keeps no card for long-description");
    }),
  );

  it.effect("[I-14] two enabled supports list two cards in the catalog's order", () =>
    Effect.gen(function* twoCards() {
      const { accepted } = yield* acceptFixture();
      const root = rootOf(
        yield* renderedHtml(accepted, enabling("ext:pacing", "additional-directions")),
      );
      const listing = listingOf(root, "c1");

      assert.lengthOf(listingsOf(root), 1);
      assert.deepStrictEqual(supportsListed(listing), ["additional-directions", "ext:pacing"]);
      assert.deepStrictEqual(
        childrenOf(listing).map((card) => textOf(card).trim()),
        [directions, pacing],
      );
    }),
  );

  it.effect("[I-14] the resolution is a function of the item and the supports alone", () =>
    Effect.gen(function* deterministic() {
      const { accepted } = yield* acceptFixture();
      const supports = supportsWith({
        catalog: new Set(["additional-directions", "keyword-translation", "long-description"]),
        keywordTranslationLanguage: Option.some("es"),
      });

      assert.deepStrictEqual(
        redact(accepted, undefined, undefined, { supports }),
        redact(accepted, undefined, undefined, { supports }),
      );
      assert.deepStrictEqual(
        redact(accepted, undefined, undefined, { supports: noSupports }),
        redact(accepted),
      );
      assert.isTrue("content" in redact(accepted, undefined, undefined, { supports }));
      assert.isFalse("content" in redact(accepted));
    }),
  );

  it.effect(
    "[I-14] only enabled cards reach the redacted copy, and the copy survives the codec",
    () =>
      Effect.gen(function* codec() {
        const { accepted } = yield* acceptFixture();
        const supports = enabling("additional-directions", "long-description");
        const configuration = yield* configure({});
        const redacted = redact(accepted, undefined, undefined, { supports });
        const json = yield* jsonOf(redacted);
        const restored = yield* Effect.fromResult(decodeRedacted(JSON.parse(json)));
        const options = { assetBase, instance, supports };
        const direct = yield* Effect.fromResult(render(redacted, configuration, options));
        const stored = yield* Effect.fromResult(render(restored, configuration, options));

        assert.include(json, directions);
        assert.include(json, "descriptions/chart.html");
        for (const text of [pacing, spanish, german, screenReader, readAloud]) {
          assert.notInclude(json, text);
        }

        assert.strictEqual(stored.html, direct.html);
        assert.include(direct.html, directions);
        assert.lengthOf(listingsOf(rootOf(direct.html)), 2);
      }),
  );

  it.effect("[I-14] the item with its listing passes checkTree and round-trips", () =>
    Effect.gen(function* accessible() {
      const { accepted } = yield* acceptFixture();
      const root = rootOf(
        yield* renderedHtml(
          accepted,
          enabling(
            "additional-directions",
            "ext:pacing",
            "keyword-translation",
            "long-description",
          ),
        ),
      );
      const ids = elementsOf([root]).flatMap(({ attrs: { id } }) =>
        id === undefined || id === true ? [] : [id],
      );

      assert.lengthOf(listingsOf(root), 2);
      assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
      assert.strictEqual(new Set(ids).size, ids.length, "ids are unique");
      assert.isTrue(roundTrips(root), "the HTML round-trips");
    }),
  );
});
