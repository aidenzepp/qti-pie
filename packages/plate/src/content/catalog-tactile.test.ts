/**
 * Tactile graphics through the catalog, driven by the candidate's PNP (feature A-41).
 *
 * An item's `tactile` catalog card holds the tactile tour text and the tactile graphic file, which
 * the testing program prints or embosses outside the candidate's computer. These tests prove, at
 * the public boundary alone (`readPnp`, `open`, `redact` and `render`), that the card is presented
 * to a candidate whose PNP activates `tactile` at start, and to no other:
 *
 * - The PNP reader and a host's own supports give the same presentation, because both are one
 *   `Supports` value (D5);
 * - A PNP that names `tactile` only in `activate-as-option-set`, or also in `prohibit-set`, leaves
 *   the card dormant (D17);
 * - An `ext:` support never enables the predefined card, and only the requested support's card shows;
 * - The file is offered at the URL `render` resolves against `assetBase`, and the item's default
 *   image stays where it is, beside the tour.
 *
 * Every row pins the catalog resolution of issue m3e-04, the PNP reader of issues m4-01 and
 * m4-01b, and the body walk; none of them edits it. A card is dormant when neither its text nor its
 * file appears anywhere in the rendered HTML, the form m3e-04's tests pin for dormant content.
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
import type {
  Accepted,
  CatalogSupport,
  Element,
  ExtensionSupport,
  Node,
  PnpSupports,
  Supports,
} from "#plate/index.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "m411";

/**
 * Where the fixture item sits under the package, which `open` takes as the document's location.
 */
const fixtureLocation = "fixtures/m4/items/catalog-tactile.xml";

/**
 * The paragraph of the fixture's `tactile` card, which nothing else in the item says.
 */
const tour =
  "Tactile tour: start at the raised triangle in the upper margin, follow the thick coastline down, and count the three raised blobs.";

/**
 * The path of the fixture's `tactile` card's file, as the card writes it.
 */
const tactileFile = "tactile/map.svg";

/**
 * The paragraph of the fixture's `braille` card, which nothing else in the item says.
 */
const brailleLabel =
  "Braille label: the northern island is marked with the dots-one-three-five cell.";

/**
 * The alternative text of the fixture's default image, the one the tactile card complements.
 */
const imageAlt =
  "A map of a bay with one large island in the north and two small islands in the south.";

/**
 * An asset base on another origin, with its closing slash.
 */
const remoteBase = "https://cdn.example/pkg/";

/**
 * An asset base that is a path on the host, without its closing slash.
 */
const pathBase = "/assets/item-1";

/**
 * Read a fixture of `fixtures/m4` as bytes.
 *
 * @param name The file's path under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/${name}`, import.meta.url)));

/**
 * The fixture item, opened and accepted as a host does before it redacts and renders.
 */
const tactileItem: Effect.Effect<Accepted> = open(
  fixtureLocation,
  fixture("items/catalog-tactile.xml"),
).pipe(
  Effect.map((verdict) =>
    Option.getOrElse(acceptedItem(verdict), () =>
      assert.fail(`the fixture is ${verdict.verdict}, not accepted`),
    ),
  ),
);

/**
 * Read a PNP fixture into the supports it asks for.
 *
 * @param name The PNP file's name under `fixtures/m4`.
 * @returns The supports, failing the test when the reader refuses the profile.
 */
const pnpSupports = (name: string): Effect.Effect<PnpSupports> =>
  readPnp(fixture(name)).pipe(Effect.orDie);

/**
 * Build the supports of a host that enables some catalog supports and nothing else.
 *
 * @param names The catalog supports to enable, predefined or `ext:`.
 * @returns The supports.
 */
const enabling = (...names: readonly (CatalogSupport | ExtensionSupport)[]): Supports => ({
  ...noSupports,
  catalog: new Set(names),
});

/**
 * Redact the fixture and render it under the same supports, as a host does for one candidate.
 *
 * @param accepted The accepted fixture item.
 * @param supports The supports the host enabled for the candidate.
 * @param assetBase The asset base the render resolves package paths against, the empty string the
 *   configuration defaults to when absent.
 * @returns The HTML the render wrote.
 */
const htmlOf = (accepted: Accepted, supports: Supports, assetBase = ""): Effect.Effect<string> =>
  Effect.gen(function* rendered() {
    const configuration = yield* configure({}).pipe(Effect.orDie);
    const redacted = redact(accepted, undefined, undefined, { supports });
    const written = yield* Effect.fromResult(
      render(redacted, configuration, { assetBase, instance, supports }),
    ).pipe(Effect.orDie);

    return written.html;
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
 * Give the `href` of every link in a page, in document order.
 *
 * @param html The item's HTML.
 * @returns The links' `href` values, the empty string for a link that has none.
 */
const hrefsIn = (html: string): readonly string[] =>
  elementsBelow(parseHtml(html))
    .filter((element) => element.tag === "a")
    .map((link) => textAttribute(link, "href"));

/**
 * Find the images of a page, in document order.
 *
 * @param html The item's HTML.
 * @returns Every `img` element.
 */
const imagesIn = (html: string): readonly Element[] =>
  elementsBelow(parseHtml(html)).filter((element) => element.tag === "img");

/**
 * Assert that the tactile card shows: its tour text is in the HTML and its file is offered as a
 * link to the URL the render resolved.
 *
 * @param html The item's HTML.
 * @param fileUrl The URL the file is offered at, the card's path under the render's asset base.
 * @param message What the HTML is for, named in a failure.
 */
const assertTactileShows = (html: string, fileUrl: string, message: string): void => {
  assert.include(html, tour, `${message}: the tour text`);
  assert.include(hrefsIn(html), fileUrl, `${message}: the file's link`);
};

/**
 * Assert that the tactile card is dormant: neither its tour text nor its file is anywhere in the
 * HTML.
 *
 * @param html The item's HTML.
 * @param message What the HTML is for, named in a failure.
 */
const assertTactileDormant = (html: string, message: string): void => {
  assert.notInclude(html, tour, `${message}: the tour text`);
  assert.notInclude(html, tactileFile, `${message}: the file's path`);
};

describe("tactile catalog card driven by the PNP", () => {
  it.effect("[A-41] a PNP that activates tactile at start shows its card", () =>
    Effect.gen(function* pnpShows() {
      const supports = yield* pnpSupports("pnp-tactile.xml");

      assert.isTrue(supports.atStart.has("tactile"));
      assert.isTrue(supports.catalog.has("tactile"));

      const html = yield* htmlOf(yield* tactileItem, supports);

      assertTactileShows(html, tactileFile, "the PNP's render");
    }),
  );

  it.effect("[A-41] with no supports the tactile card stays dormant", () =>
    Effect.gen(function* noneDormant() {
      const html = yield* htmlOf(yield* tactileItem, noSupports);

      assertTactileDormant(html, "noSupports");
      assert.notInclude(html, brailleLabel, "the braille card is dormant as well");
    }),
  );

  it.effect("[A-41] a prohibited tactile stays dormant although assigned", () =>
    Effect.gen(function* prohibitedDormant() {
      const supports = yield* pnpSupports("pnp-tactile-prohibited.xml");

      assert.isTrue(supports.prohibited.has("tactile"));
      assert.isFalse(supports.atStart.has("tactile"));
      assert.isFalse(supports.catalog.has("tactile"));

      const html = yield* htmlOf(yield* tactileItem, supports);

      assertTactileDormant(html, "the prohibited PNP's render");
    }),
  );

  it.effect(
    "[A-41] tactile only in the option set is dormant at start and listed as optional",
    () =>
      Effect.gen(function* optionalDormant() {
        const supports = yield* pnpSupports("pnp-tactile-optional.xml");

        assert.isTrue(supports.optional.has("tactile"));
        assert.isFalse(supports.atStart.has("tactile"));
        assert.isFalse(supports.catalog.has("tactile"));

        const html = yield* htmlOf(yield* tactileItem, supports);

        assertTactileDormant(html, "the optional PNP's render");
      }),
  );

  it.effect("[A-41] a host's supports without a PNP shows the card the same way", () =>
    Effect.gen(function* hostShows() {
      const item = yield* tactileItem;
      const fromPnp = yield* htmlOf(item, yield* pnpSupports("pnp-tactile.xml"));
      const fromHost = yield* htmlOf(item, enabling("tactile"));

      assertTactileShows(fromHost, tactileFile, "the host's render");
      assert.strictEqual(fromHost, fromPnp);
    }),
  );

  it.effect("[A-41] only the requested support's card shows", () =>
    Effect.gen(function* onlyRequested() {
      const item = yield* tactileItem;
      const tactileOnly = yield* htmlOf(item, enabling("tactile"));
      const brailleOnly = yield* htmlOf(item, enabling("braille"));

      assertTactileShows(tactileOnly, tactileFile, "tactile requested");
      assert.notInclude(tactileOnly, brailleLabel, "tactile requested: the braille card");
      assertTactileDormant(brailleOnly, "braille requested");
    }),
  );

  it.effect("[A-41] an ext: support never enables the predefined card", () =>
    Effect.gen(function* extensionDormant() {
      const html = yield* htmlOf(yield* tactileItem, enabling("ext:tactile-x"));

      assertTactileDormant(html, "ext:tactile-x");
      assert.notInclude(html, brailleLabel, "ext:tactile-x: the braille card");
    }),
  );

  it.effect("[A-41] the tactile file's URL is resolved against assetBase", () =>
    Effect.gen(function* fileResolved() {
      const item = yield* tactileItem;
      const tactile = enabling("tactile");

      assertTactileShows(
        yield* htmlOf(item, tactile, remoteBase),
        `${remoteBase}${tactileFile}`,
        "a remote asset base",
      );
      assertTactileShows(
        yield* htmlOf(item, tactile, pathBase),
        `${pathBase}/${tactileFile}`,
        "a path asset base with no closing slash",
      );
      assertTactileDormant(yield* htmlOf(item, noSupports, remoteBase), "noSupports with a base");
    }),
  );

  it.effect("[A-41] the default image stays beside the tour", () =>
    Effect.gen(function* imageStays() {
      const item = yield* tactileItem;
      const without = yield* htmlOf(item, noSupports, remoteBase);
      const withTactile = yield* htmlOf(item, enabling("tactile"), remoteBase);
      const [before, ...extraBefore] = imagesIn(without);
      const [after, ...extraAfter] = imagesIn(withTactile);

      assert.lengthOf(extraBefore, 0, "one image without the support");
      assert.lengthOf(extraAfter, 0, "one image with the support");
      assert.strictEqual(before?.attrs["alt"], imageAlt);
      assert.strictEqual(after?.attrs["alt"], imageAlt);
      assert.deepStrictEqual(after?.attrs, before?.attrs);
      assert.include(withTactile, tour);
    }),
  );
});
