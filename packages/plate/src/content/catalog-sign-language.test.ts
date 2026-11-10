/**
 * Sign language (A-36), PNP-driven, as a check-first witness of the catalog resolution (issue
 * m4-10): a candidate whose PNP activates `sign-language` at start is given the item's
 * `sign-language` card, its video shown with the default content and under the candidate's control
 * (native `controls`, no `autoplay`), and every other candidate has the card dormant.
 *
 * The tests prove, through `readPnp`, `open`, `redact` and `render` alone, that the PNP's sets
 * decide the card: `activate-at-initialization-set` shows it, `prohibit-set` wins over an
 * assignment, and `activate-as-option-set` alone leaves it dormant and listed as optional. They
 * prove the card follows the requested support and nothing else (a host's `Supports` without a PNP
 * shows it the same way, an `ext:` support never enables the predefined card, the `transcript`
 * card stays dormant), that the default entry is the one presented, and that the default content
 * stays on the page beside the video. None reaches the catalog module's exports, and a failure
 * here is a finding about that module, never a change to it.
 *
 * `Supports` carries the PNP's sign language as `signLanguage`, which `PnpSupports.languages`
 * leaves to it (`languageFeatures` holds `item-translation` alone), so the language test reads that
 * field.
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
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * Where the item fixture sits under the package, which `open` takes as the document's location.
 */
const itemLocation = "fixtures/m4/items/catalog-sign-language.xml";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "q1";

/**
 * The package path of the video the fixture's default `sign-language` entry (`xml:lang="ase"`,
 * `default="true"`) holds.
 */
const defaultVideo = "sign/ase.mp4";

/**
 * The package path of the video the fixture's other `sign-language` entry (`xml:lang="bfi"`) holds.
 */
const otherVideo = "sign/bfi.mp4";

/**
 * The sentence of the paragraph that names the catalog by `data-catalog-idref`: the default
 * content the sign-language video accompanies.
 */
const defaultContent = "The ferry leaves the harbour at nine and is back before the evening tide.";

/**
 * The sentence of the fixture's `transcript` card, which nothing else in the item holds.
 */
const transcript = "Written out in full: the harbour ferry departs at nine and returns by dusk.";

/**
 * Read a fixture of `fixtures/m4` as bytes.
 *
 * @param name The file's path under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/${name}`, import.meta.url)));

/**
 * Read a PNP fixture of `fixtures/m4` into the supports it asks for.
 *
 * @param name The file's path under the directory.
 * @returns The PNP's supports.
 */
const pnp = (name: string): Effect.Effect<PnpSupports> => readPnp(fixture(name)).pipe(Effect.orDie);

/**
 * Open the item fixture and take its accepted item, failing the test when the verdict accepts none.
 */
const acceptedFixture: Effect.Effect<Accepted> = open(
  itemLocation,
  fixture("items/catalog-sign-language.xml"),
).pipe(
  Effect.map((verdict) =>
    Option.getOrElse(acceptedItem(verdict), () =>
      assert.fail(`the item is ${verdict.verdict}, not accepted`),
    ),
  ),
);

/**
 * What one candidate is sent: the HTML the render wrote, and the JSON text of the redacted copy the
 * host stores and sends to a page.
 */
interface Page {
  readonly html: string;
  readonly json: string;
}

/**
 * Redact the item fixture and render it with the same supports, with the default configuration and
 * the fixed instance token, as a host does for one candidate.
 *
 * @param supports The supports the host enabled for the candidate.
 * @returns The page the candidate is sent.
 */
const pageWith = Effect.fnUntraced(function* pageWith(supports: Supports) {
  const accepted = yield* acceptedFixture;
  const configuration = yield* configure({});
  const redacted = redact(accepted, undefined, undefined, { supports });
  const rendered = yield* Effect.fromResult(
    render(redacted, configuration, { instance, supports }),
  );
  const json = JSON.stringify(yield* Effect.fromResult(encodeRedacted(redacted)));

  return { html: rendered.html, json } satisfies Page;
});

/**
 * The supports of a host that enables the given catalog supports and nothing else, with no PNP.
 *
 * @param names The catalog supports to enable.
 * @returns The supports.
 */
const enabling = (
  ...names: readonly (Supports["catalog"] extends ReadonlySet<infer S> ? S : never)[]
): Supports => ({
  ...noSupports,
  catalog: new Set(names),
});

/**
 * List the elements below nodes, in document order, the nodes' own elements first.
 *
 * @param nodes The nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Collect the text below a node, as written.
 *
 * @param node The node.
 * @returns Its text.
 */
const textOf = (node: Node): string =>
  node.kind === "text" ? node.text : node.children.map(textOf).join("");

/**
 * Read an attribute an element holds as a string.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns Its value, or `undefined` when the element has none; a bare attribute reads as `""`.
 */
const attributeOf = (element: Element, name: string): string | undefined => {
  const value = element.attrs[name];

  return value === true ? "" : value;
};

/**
 * Find every `video` of a page that plays a package file: the `video`'s own `src` or the `src` of
 * one of its `source` children ends with the path.
 *
 * @param html The page's HTML.
 * @param file The package path the video plays, or none for every `video`.
 * @returns The videos, in document order.
 */
const videosOf = (html: string, file?: string): readonly Element[] =>
  elementsOf(parseHtml(html)).filter(
    (element) =>
      element.tag === "video" &&
      (file === undefined ||
        [element, ...elementsOf(element.children).filter(({ tag }) => tag === "source")].some(
          (playing) => attributeOf(playing, "src")?.endsWith(file) === true,
        )),
  );

/**
 * Assert that a page holds none of the card content the fixture's catalog keeps dormant: neither
 * entry's video, nor the transcript, in the HTML or in the redacted copy.
 *
 * @param page What the candidate is sent.
 */
const assertDormant = (page: Page): void => {
  for (const content of [defaultVideo, otherVideo, transcript]) {
    assert.notInclude(page.html, content);
    assert.notInclude(page.json, content);
  }
  assert.lengthOf(videosOf(page.html), 0);
};

describe("A-36: sign language, driven by the PNP", () => {
  it.effect("[A-36] a PNP that activates sign-language at start shows its card", () =>
    Effect.gen(function* shown() {
      const supports = yield* pnp("pnp-sign-language.xml");
      const { html } = yield* pageWith(supports);

      assert.isTrue(supports.atStart.has("sign-language"));
      assert.lengthOf(videosOf(html, defaultVideo), 1);
    }),
  );

  it.effect("[A-36] with no supports the sign-language card stays dormant", () =>
    Effect.gen(function* dormant() {
      assertDormant(yield* pageWith(noSupports));
    }),
  );

  it.effect("[A-36] a prohibited sign-language stays dormant although assigned", () =>
    Effect.gen(function* prohibited() {
      const supports = yield* pnp("pnp-sign-language-prohibited.xml");

      assert.isTrue(supports.prohibited.has("sign-language"));
      assert.isFalse(supports.catalog.has("sign-language"));
      assertDormant(yield* pageWith(supports));
    }),
  );

  it.effect(
    "[A-36] sign-language only in the option set is dormant at start and listed as optional",
    () =>
      Effect.gen(function* optional() {
        const supports = yield* pnp("pnp-sign-language-optional.xml");

        assert.isTrue(supports.optional.has("sign-language"));
        assert.isFalse(supports.atStart.has("sign-language"));
        assert.isFalse(supports.catalog.has("sign-language"));
        assertDormant(yield* pageWith(supports));
      }),
  );

  it.effect("[A-36] a host's supports without a PNP shows the card the same way", () =>
    Effect.gen(function* hosted() {
      const fromPnp = yield* pageWith(yield* pnp("pnp-sign-language.xml"));
      const fromHost = yield* pageWith(enabling("sign-language"));

      assert.lengthOf(videosOf(fromHost.html, defaultVideo), 1);
      assert.strictEqual(fromHost.html, fromPnp.html);
    }),
  );

  it.effect("[A-36] only the requested support's card shows", () =>
    Effect.gen(function* only() {
      const signed = yield* pageWith(yield* pnp("pnp-sign-language.xml"));
      const written = yield* pageWith(enabling("transcript"));

      assert.lengthOf(videosOf(signed.html, defaultVideo), 1);
      assert.notInclude(signed.html, transcript);
      assert.notInclude(signed.json, transcript);
      assert.include(written.html, transcript, "the transcript card shows when it is requested");
      assert.lengthOf(videosOf(written.html), 0);
    }),
  );

  it.effect("[A-36] an ext: support never enables the predefined card", () =>
    Effect.gen(function* extension() {
      assertDormant(yield* pageWith(enabling("ext:sign-language-x")));
    }),
  );

  it.effect("[A-36] the default entry's video shows under the candidate's control", () =>
    Effect.gen(function* controlled() {
      const { html } = yield* pageWith(yield* pnp("pnp-sign-language.xml"));
      const [video, ...rest] = videosOf(html, defaultVideo);

      assert.lengthOf(rest, 0);
      assert.isDefined(video);
      assert.isTrue(Object.hasOwn(video?.attrs ?? {}, "controls"));
      for (const each of videosOf(html)) {
        assert.isFalse(Object.hasOwn(each.attrs, "autoplay"));
      }
      assert.lengthOf(videosOf(html, otherVideo), 0);
      assert.notInclude(html, otherVideo);
    }),
  );

  it.effect("[A-36] the default content stays beside the video", () =>
    Effect.gen(function* beside() {
      const without = yield* pageWith(noSupports);
      const signed = yield* pageWith(yield* pnp("pnp-sign-language.xml"));
      const page = parseHtml(signed.html);

      assert.include(without.html, defaultContent);
      assert.include(signed.html, defaultContent);
      assert.isTrue(
        elementsOf(page).some(
          (element) => element.tag === "p" && textOf(element).includes(defaultContent),
        ),
      );
      assert.lengthOf(videosOf(signed.html, defaultVideo), 1);
    }),
  );

  it.effect("[A-36] the PNP's sign language is read", () =>
    Effect.gen(function* language() {
      const supports = yield* pnp("pnp-sign-language.xml");

      assert.strictEqual(Option.getOrUndefined(supports.signLanguage), "ase");
      assert.isTrue(supports.catalog.has("sign-language"));
    }),
  );
});
