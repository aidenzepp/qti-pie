/**
 * Long descriptions (A-29), PNP-driven, proved through the public boundary alone: `readPnp`,
 * `open`, `redact` and `render` over the item `fixtures/m4/items/catalog-long-description.xml`,
 * an image whose default long description is a visually hidden `div` named by `aria-describedby`
 * and whose catalog holds a `long-description` card and an `audio-description` card.
 *
 * The tests prove two halves of the row. The default long description is available to assistive
 * technology for every candidate: the `img`'s `aria-describedby` is the rendered `id` of the
 * `qti-visually-hidden` element holding it, with or without the support, so the catalog card
 * supplements it and never replaces it. The card is the PNP's to turn on: a profile that names
 * `long-description` in `activate-at-initialization-set` shows it, and the same render under
 * `noSupports`, a prohibited feature, an optional-only feature or an `ext:` look-alike keeps it
 * dormant, with the card of another support dormant beside it. A host that builds the support by
 * hand gets the same HTML as the PNP does.
 *
 * "Shows" is the card's distinctive sentence in the HTML. "Dormant" is that sentence absent from
 * the HTML, the dormant form `catalog-info.test.ts` pins for the catalog module. Each dormant
 * check also finds the default long description, so a render that dropped the whole body cannot
 * pass for one that kept a card dormant.
 *
 * @module
 */
import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import {
  acceptedItem,
  configure,
  noSupports,
  open,
  readPnp,
  redact,
  render,
} from "#plate/index.ts";
import type { CatalogSupport, Element, ExtensionSupport, Node, Supports } from "#plate/index.ts";
import { attribute, textOf } from "#plate/test/accessibility.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The instance token every render here passes, which scopes the ids the body writes.
 */
const instance = "m409";

/**
 * Where the item sits under the package, which `open` takes as the document's location.
 */
const itemLocation = "fixtures/m4/items/catalog-long-description.xml";

/**
 * The sentence of the default long description, the visually hidden `div` the image names, and
 * nothing else in the fixture.
 */
const defaultText = "The default long description reads the bars from left to right";

/**
 * The sentence of the fixture's `long-description` card, and nothing else in the fixture.
 */
const cardText = "The long description card adds a table";

/**
 * The sentence of the fixture's `audio-description` card, and nothing else in the fixture.
 */
const audioText = "The audio description card tells the listener";

/**
 * Read a fixture of `fixtures/m4` as bytes.
 *
 * @param name The file's path under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/${name}`, import.meta.url)));

/**
 * The supports a host builds by hand to enable the given catalog supports and nothing else.
 *
 * @param names The supports to enable, predefined or `ext:`.
 * @returns The supports.
 */
const enabling = (...names: readonly (CatalogSupport | ExtensionSupport)[]): Supports => ({
  ...noSupports,
  catalog: new Set(names),
});

/**
 * Redact the fixture item under the supports and render it, as a host does for one candidate:
 * the same supports reach `redact` and `render`.
 *
 * @param supports The supports the candidate has, from a PNP or from the host.
 * @returns The HTML the render wrote.
 */
const pageFor = Effect.fnUntraced(function* pageFor(supports: Supports) {
  const verdict = yield* open(itemLocation, fixture("items/catalog-long-description.xml"));
  const accepted = Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the fixture is ${verdict.verdict}, not accepted`),
  );
  const redacted = redact(accepted, undefined, undefined, { supports });
  const configuration = yield* configure({});
  const rendered = yield* Effect.fromResult(
    render(redacted, configuration, { instance, supports }),
  );

  return rendered.html;
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
 * Take the one item of a list, failing the test when the list holds none or several.
 *
 * @param items The list.
 * @param what What the list holds, for the failure.
 * @returns The list's only item.
 */
const only = <T>(items: readonly T[], what: string): T => {
  const [first, ...rest] = items;

  return first !== undefined && rest.length === 0
    ? first
    : assert.fail(`expected exactly one ${what}, found ${items.length}`);
};

/**
 * Find the image and the element its `aria-describedby` names in rendered HTML.
 *
 * @param html The item's HTML.
 * @returns The `img`, the id it names, and the elements of the page that carry that id.
 */
const describedImage = (html: string) => {
  const elements = elementsBelow(parseHtml(html));
  const image = only(
    elements.filter((element) => element.tag === "img"),
    "img",
  );
  const describedby =
    attribute(image, "aria-describedby") ?? assert.fail("the img names no element");

  return {
    describedby,
    image,
    targets: elements.filter((element) => attribute(element, "id") === describedby),
  };
};

/**
 * Assert that the default long description is programmatic: the `img`'s `aria-describedby` equals
 * the rendered `id` of exactly one element, which keeps the class `qti-visually-hidden` and the
 * default long description's text, and the `id` is scoped by the instance token.
 *
 * @param html The item's HTML.
 */
const assertDefaultDescription = (html: string): void => {
  const { describedby, image, targets } = describedImage(html);
  const target = only(targets, "element carrying the id the img names");
  const classes = (attribute(target, "class") ?? "").split(/\s+/u);

  assert.include(describedby, instance);
  assert.strictEqual(target.tag, "div");
  assert.include(classes, "qti-visually-hidden");
  assert.include(textOf(target), defaultText);
  assert.strictEqual(attribute(image, "alt"), "A bar chart of three tide pool depths");
};

/**
 * Assert that the page keeps both cards dormant: neither card's sentence is in the HTML, and the
 * body is there, as the default long description proves.
 *
 * @param html The item's HTML.
 */
const assertDormant = (html: string): void => {
  assert.include(html, defaultText);
  assert.notInclude(html, cardText);
  assert.notInclude(html, audioText);
};

describe("long description (A-29)", () => {
  it.effect("[A-29] a PNP that activates long-description at start shows its card", () =>
    Effect.gen(function* showsCard() {
      const pnp = yield* readPnp(fixture("pnp-long-description.xml"));
      const html = yield* pageFor(pnp);

      assert.isTrue(pnp.atStart.has("long-description"));
      assert.isTrue(pnp.catalog.has("long-description"));
      assert.include(html, defaultText);
      assert.include(html, cardText);
    }),
  );

  it.effect("[A-29] with no supports the long-description card stays dormant", () =>
    Effect.gen(function* staysDormant() {
      assertDormant(yield* pageFor(noSupports));
    }),
  );

  it.effect("[A-29] a prohibited long-description stays dormant although assigned", () =>
    Effect.gen(function* prohibitedStaysDormant() {
      const pnp = yield* readPnp(fixture("pnp-long-description-prohibited.xml"));

      assert.isTrue(pnp.prohibited.has("long-description"));
      assert.isFalse(pnp.catalog.has("long-description"));
      assertDormant(yield* pageFor(pnp));
    }),
  );

  it.effect(
    "[A-29] long-description only in the option set is dormant at start and listed as optional",
    () =>
      Effect.gen(function* optionalStaysDormant() {
        const pnp = yield* readPnp(fixture("pnp-long-description-optional.xml"));

        assert.isTrue(pnp.optional.has("long-description"));
        assert.isFalse(pnp.atStart.has("long-description"));
        assert.isFalse(pnp.catalog.has("long-description"));
        assertDormant(yield* pageFor(pnp));
      }),
  );

  it.effect("[A-29] a host's supports without a PNP shows the card the same way", () =>
    Effect.gen(function* hostMatchesPnp() {
      const pnp = yield* readPnp(fixture("pnp-long-description.xml"));
      const fromPnp = yield* pageFor(pnp);
      const fromHost = yield* pageFor(enabling("long-description"));

      assert.include(fromHost, cardText);
      assert.strictEqual(fromHost, fromPnp);
    }),
  );

  it.effect("[A-29] only the requested support's card shows", () =>
    Effect.gen(function* onlyTheRequestedCard() {
      const longDescription = yield* pageFor(enabling("long-description"));
      const audioDescription = yield* pageFor(enabling("audio-description"));

      assert.include(longDescription, cardText);
      assert.notInclude(longDescription, audioText);
      assert.include(audioDescription, audioText);
      assert.notInclude(audioDescription, cardText);
    }),
  );

  it.effect("[A-29] an ext: support never enables the predefined card", () =>
    Effect.gen(function* extensionStaysDormant() {
      assertDormant(yield* pageFor(enabling("ext:long-description-x")));
    }),
  );

  it.effect("[A-29] the default long description stays programmatic", () =>
    Effect.gen(function* defaultIsProgrammatic() {
      const html = yield* pageFor(noSupports);

      assertDefaultDescription(html);
    }),
  );

  it.effect("[A-29] the default long description stays when the card shows", () =>
    Effect.gen(function* defaultStaysBesideCard() {
      const pnp = yield* readPnp(fixture("pnp-long-description.xml"));
      const html = yield* pageFor(pnp);

      assertDefaultDescription(html);
      assert.include(html, cardText);
    }),
  );
});
