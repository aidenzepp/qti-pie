/**
 * The braille catalog card, driven by a Personal Needs and Preferences profile (A-10a): a candidate
 * whose PNP activates `braille` at start gets the item's `braille` card, its braille directions
 * and its braille file at the URL `render` resolves, while the default content a refreshable
 * display reads stays intact; every other candidate gets the card dormant.
 *
 * Each test reads a PNP fixture with `readPnp` or builds the supports by hand, opens the item
 * fixture, redacts it and renders it with the same supports, and asserts on the HTML and on the
 * redacted copy's JSON, never on the catalog module's exports. Dormant means absent from both: the
 * form the catalog module's own tests pin. Most rows pin the catalog resolution (issue m3e-04) and
 * the PNP reader (issues m4-01 and m4-01b); none selects a card entry by braille type, which this
 * issue leaves to the entry-selection tests of the catalog module.
 *
 * @module
 */
import { readFileSync } from "node:fs";
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
import type { Accepted, Element, Node, PnpSupports, Supports } from "#plate/index.ts";
import { textOf } from "#plate/test/accessibility.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "m407";

/**
 * An asset base on another origin, with its closing slash.
 */
const assetBase = "https://cdn.example/pkg/";

/**
 * Where the item fixture sits under the package, which `open` takes as the document's location.
 */
const itemLocation = "fixtures/m4/items/catalog-braille.xml";

/**
 * The id of the fixture's one catalog, which its paragraph names.
 */
const catalogId = "lamp-passage";

/**
 * The fixture's referencing paragraph: the default content a refreshable display reads.
 */
const passage = "The lighthouse keeper climbed ninety steps to light the lamp before dusk.";

/**
 * The braille directions of the fixture's `braille` card, which nothing else in the item says.
 */
const brailleDirections =
  "Braille directions: feel along the dotted margin to find where the passage begins.";

/**
 * The directions of the fixture's `tactile` card, which nothing else in the item says.
 */
const tactileAid = "Tactile aid: run a finger along the raised ridge to count the stairs.";

/**
 * The path of the `braille` card's file in the package, as the fixture writes it.
 */
const brailleFile = "braille/passage.brf";

/**
 * Every distinctive string the fixture's two cards hold: what a page shows only for a card it
 * presents.
 */
const cardStrings = [brailleDirections, tactileAid, brailleFile] as const;

/**
 * Read a fixture of `fixtures/m4` as bytes.
 *
 * @param name The file's path under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/${name}`, import.meta.url)));

/**
 * The accepted item fixture, as a host gets it from `open`.
 */
const acceptedFixture: Effect.Effect<Accepted> = open(
  itemLocation,
  fixture("items/catalog-braille.xml"),
).pipe(
  Effect.map((verdict) =>
    Option.getOrElse(acceptedItem(verdict), () =>
      assert.fail(`the item fixture is ${verdict.verdict}, not accepted`),
    ),
  ),
);

/**
 * Read a PNP fixture of `fixtures/m4` with `readPnp`, failing the test when the reader refuses it.
 *
 * @param name The file's name under the directory.
 * @returns The supports the PNP asks for.
 */
const pnpFixture = (name: string): Effect.Effect<PnpSupports> =>
  readPnp(fixture(name)).pipe(Effect.orDie);

/**
 * What a host sends and shows for one candidate: the item's HTML, and the redacted copy as the JSON
 * text a host sends to a page.
 */
interface Page {
  /**
   * The HTML `render` wrote.
   */
  readonly html: string;
  /**
   * The redacted copy encoded as JSON text.
   */
  readonly json: string;
}

/**
 * Redact the fixture under the supports and render it with the default configuration and
 * {@link assetBase}, as a host does for one candidate, passing the same supports to both.
 *
 * @param supports The supports the host enabled.
 * @returns The page's HTML and its redacted copy's JSON.
 */
const pageFor = (supports: Supports): Effect.Effect<Page> =>
  Effect.gen(function* page() {
    const accepted = yield* acceptedFixture;
    const configuration = yield* configure({}).pipe(Effect.orDie);
    const redacted = redact(accepted, undefined, undefined, { supports });
    const rendered = yield* Effect.fromResult(
      render(redacted, configuration, { assetBase, instance, supports }),
    ).pipe(Effect.orDie);
    const json = JSON.stringify(
      yield* Effect.fromResult(encodeRedacted(redacted)).pipe(Effect.orDie),
    );

    return { html: rendered.html, json };
  });

/**
 * List the elements at or below some nodes, in document order.
 *
 * @param nodes The nodes.
 * @returns Each element among them and below them.
 */
const elementsBelow = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsBelow(node.children)] : []));

/**
 * List an element's child elements, leaving out the text between them.
 *
 * @param element The parent.
 * @returns Its element children, in document order.
 */
const childElements = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Find every catalog listing of a page: each `ul` carrying `data-catalog`.
 *
 * @param html The page's HTML.
 * @returns The listings, in document order.
 */
const listingsOf = (html: string): readonly Element[] =>
  elementsBelow(parseHtml(html)).filter(
    (element) => element.tag === "ul" && Object.hasOwn(element.attrs, "data-catalog"),
  );

/**
 * Find the one listing of the fixture's catalog, failing the test when the page has none or more
 * than one.
 *
 * @param html The page's HTML.
 * @returns The listing.
 */
const listingOf = (html: string): Element => {
  const found = listingsOf(html).filter((listing) => listing.attrs["data-catalog"] === catalogId);
  const [only, ...rest] = found;

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one listing of ${catalogId}, found ${found.length}`);
};

/**
 * Give the `data-support` of each card a listing holds, in order.
 *
 * @param listing The listing.
 * @returns The supports.
 */
const supportsListed = (listing: Element): readonly (string | true | undefined)[] =>
  childElements(listing).map((card) => card.attrs["data-support"]);

/**
 * Assert that a page shows none of the fixture's card content: no card string in the HTML or in
 * the redacted copy, and no catalog listing.
 *
 * @param page The page.
 */
const assertDormant = (page: Page): void => {
  for (const content of cardStrings) {
    assert.notInclude(page.html, content);
    assert.notInclude(page.json, content);
  }

  assert.lengthOf(listingsOf(page.html), 0, "no catalog is listed");
};

/**
 * Find the fixture's referencing paragraph in a page, failing the test unless exactly one `p`
 * holds its text.
 *
 * @param html The page's HTML.
 * @returns The paragraph.
 */
const passageParagraph = (html: string): Element => {
  const found = elementsBelow(parseHtml(html)).filter(
    (element) => element.tag === "p" && textOf(element) === passage,
  );
  const [only, ...rest] = found;

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one paragraph of the passage, found ${found.length}`);
};

/**
 * Count the times a page's HTML writes a string.
 *
 * @param html The page's HTML.
 * @param content The string.
 * @returns The number of non-overlapping occurrences.
 */
const occurrences = (html: string, content: string): number => html.split(content).length - 1;

/**
 * A catalog support a host can enable: a predefined name or an `ext:` extension.
 */
type CatalogName = Supports["catalog"] extends ReadonlySet<infer Name> ? Name : never;

/**
 * Build the supports of a program that asks for these catalog supports for every candidate: no
 * PNP, and nothing else enabled.
 *
 * @param names The catalog supports to enable.
 * @returns The supports.
 */
const enabling = (...names: readonly CatalogName[]): Supports => ({
  ...noSupports,
  catalog: new Set(names),
});

describe("A-10a: braille, PNP-driven", () => {
  it.effect("[A-10a] a PNP that activates braille at start shows its card", () =>
    Effect.gen(function* shown() {
      const supports = yield* pnpFixture("pnp-braille.xml");
      const { html } = yield* pageFor(supports);
      const listing = listingOf(html);
      const [card] = childElements(listing);

      assert.isTrue(supports.atStart.has("braille"), "the PNP names braille at start");
      assert.isTrue(supports.catalog.has("braille"), "the supports enable the braille card");
      assert.deepStrictEqual(supportsListed(listing), ["braille"]);
      assert.include(textOf(card ?? listing), brailleDirections);
      assert.include(html, brailleDirections);
      assert.include(html, brailleFile);
    }),
  );

  it.effect("[A-10a] with no supports the braille card stays dormant", () =>
    Effect.gen(function* dormant() {
      assertDormant(yield* pageFor(noSupports));
    }),
  );

  it.effect("[A-10a] a prohibited braille stays dormant although assigned", () =>
    Effect.gen(function* prohibited() {
      const supports = yield* pnpFixture("pnp-braille-prohibited.xml");
      const page = yield* pageFor(supports);

      assert.isTrue(supports.prohibited.has("braille"), "the PNP prohibits braille");
      assert.isFalse(supports.features.has("braille"), "a prohibited feature is not active");
      assert.isFalse(supports.catalog.has("braille"), "a prohibited feature enables no card");
      assertDormant(page);
      assert.strictEqual(page.html, (yield* pageFor(noSupports)).html);
    }),
  );

  it.effect(
    "[A-10a] braille only in the option set is dormant at start and listed as optional",
    () =>
      Effect.gen(function* optional() {
        const supports = yield* pnpFixture("pnp-braille-optional.xml");
        const page = yield* pageFor(supports);

        assert.isTrue(supports.optional.has("braille"), "the PNP offers braille as an option");
        assert.isFalse(supports.atStart.has("braille"), "braille is not on at start");
        assert.isFalse(supports.catalog.has("braille"), "an option not taken enables no card");
        assertDormant(page);
        assert.strictEqual(page.html, (yield* pageFor(noSupports)).html);
      }),
  );

  it.effect("[A-10a] a host's supports without a PNP shows the card the same way", () =>
    Effect.gen(function* sameWay() {
      const pnp = yield* pageFor(yield* pnpFixture("pnp-braille.xml"));
      const host = yield* pageFor(enabling("braille"));

      assert.include(host.html, brailleDirections, "the host's page shows the card");
      assert.strictEqual(host.html, pnp.html);
      assert.strictEqual(host.json, pnp.json);
    }),
  );

  it.effect("[A-10a] only the requested support's card shows", () =>
    Effect.gen(function* onlyRequested() {
      const braille = yield* pageFor(enabling("braille"));
      const tactile = yield* pageFor(enabling("tactile"));

      assert.deepStrictEqual(supportsListed(listingOf(braille.html)), ["braille"]);
      assert.include(braille.html, brailleDirections);
      assert.notInclude(braille.html, tactileAid);
      assert.notInclude(braille.json, tactileAid);

      assert.deepStrictEqual(supportsListed(listingOf(tactile.html)), ["tactile"]);
      assert.include(tactile.html, tactileAid);
      assert.notInclude(tactile.html, brailleDirections);
      assert.notInclude(tactile.html, brailleFile);
      assert.notInclude(tactile.json, brailleDirections);
      assert.notInclude(tactile.json, brailleFile);
    }),
  );

  it.effect("[A-10a] an ext: support never enables the predefined card", () =>
    Effect.gen(function* extension() {
      const page = yield* pageFor(enabling("ext:braille-x"));

      assertDormant(page);
      assert.strictEqual(page.html, (yield* pageFor(noSupports)).html);
    }),
  );

  it.effect("[A-10a] the braille file's URL is resolved against assetBase", () =>
    Effect.gen(function* resolved() {
      const shown = yield* pageFor(enabling("braille"));
      const dormant = yield* pageFor(noSupports);
      const links = elementsBelow(listingOf(shown.html).children).filter(
        (element) => element.tag === "a",
      );

      assert.lengthOf(links, 1);
      assert.strictEqual(links[0]?.attrs["href"], `${assetBase}${brailleFile}`);
      assert.strictEqual(links[0]?.attrs["type"], "text/plain");
      assert.include(shown.html, `${assetBase}${brailleFile}`);
      assert.notInclude(dormant.html, brailleFile);
    }),
  );

  it.effect("[A-10a] the default content a refreshable display reads stays unchanged", () =>
    Effect.gen(function* intact() {
      const withBraille = yield* pageFor(enabling("braille"));
      const without = yield* pageFor(noSupports);
      const paragraph = passageParagraph(withBraille.html);

      assert.deepStrictEqual(paragraph, passageParagraph(without.html));
      assert.strictEqual(textOf(paragraph), passage);
      assert.isUndefined(paragraph.attrs["hidden"], "the default content is not hidden");
      assert.isUndefined(paragraph.attrs["aria-hidden"], "the default content is not aria-hidden");
      assert.strictEqual(occurrences(withBraille.html, passage), 1);
      assert.strictEqual(occurrences(without.html, passage), 1);
    }),
  );

  it.effect("[A-10a] the PNP's braille preferences read with the schema defaults", () =>
    Effect.gen(function* defaults() {
      const supports = yield* pnpFixture("pnp-braille.xml");

      assert.isTrue(Option.isSome(supports.braille), "the profile assigns braille");
      if (Option.isSome(supports.braille)) {
        assert.strictEqual(supports.braille.value.deliveryMode, "refreshable");
        assert.strictEqual(supports.braille.value.grade, 2);
        assert.isTrue(Option.isNone(supports.braille.value.brailleType));
        assert.isTrue(Option.isNone(supports.braille.value.mathType));
        assert.isTrue(Option.isNone(supports.braille.value.language));
      }
    }),
  );
});
