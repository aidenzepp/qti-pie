/**
 * The transcript catalog support is PNP-driven (A-44): a candidate whose PNP activates
 * `transcript` at start gets the item's `transcript` card for its time-based media, and every other
 * candidate gets that card dormant.
 *
 * Each test reaches the catalog resolution only through `readPnp`, `open`, `redact` and `render`,
 * the way a host does: one item is opened from its fixture, then redacted and rendered with the
 * same `supports` value. "Shows" means the card's dialogue is text of the rendered page; "dormant"
 * means none of it is anywhere in the rendered HTML, which is the dormant form the catalog module's
 * own tests pin (a card nobody enabled is in neither the HTML nor the redacted copy).
 *
 * @module
 */
import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { readPnp } from "#plate/pnp/read.ts";
import { redact, render } from "#plate/render.ts";
import { noSupports } from "#plate/supports.ts";
import type { Supports } from "#plate/supports.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * Where the fixture item sits under the package, which `open` takes as the document's location.
 */
const location = "fixtures/m4/items/catalog-transcript.xml";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "m412";

/**
 * An asset base on another origin, with its closing slash, so a package path resolves to a URL the
 * tests can compare.
 */
const assetBase = "https://cdn.example/pkg/";

/**
 * The URL the fixture's `audio` resolves to under {@link assetBase}.
 */
const resolvedSource = `${assetBase}media/interview.mp3`;

/**
 * The dialogue of the fixture's `transcript` card, one run per speaker line and one for the sound
 * description, each written in no other place of the item.
 */
const transcriptText: readonly string[] = [
  "Interviewer:",
  "Welcome aboard the harbour light. How long have you kept the lamp?",
  "Keeper:",
  "Thirty years now, and the beam has not failed in a single storm.",
  "[A foghorn sounds twice in the distance.]",
];

/**
 * The sentence of the fixture's `audio-description` card, written in no other place of the item.
 */
const descriptionText = "A weathered keeper in a yellow coat stands beside the great lamp";

/**
 * Read a fixture of `fixtures/m4` as bytes.
 *
 * @param name The file's path under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/${name}`, import.meta.url)));

/**
 * Open the fixture item, redact it and render it under some supports, as a host does for one
 * candidate: the same `supports` value goes to `redact` and to `render`.
 *
 * @param supports The supports the host enabled for the candidate.
 * @returns The item's HTML.
 */
const htmlUnder = (supports: Supports): Effect.Effect<string> =>
  Effect.gen(function* rendered() {
    const verdict = yield* open(location, fixture("items/catalog-transcript.xml"));
    const accepted = Option.getOrThrow(acceptedItem(verdict));
    const configuration = yield* configure({}).pipe(Effect.orDie);
    const redacted = redact(accepted, undefined, undefined, { supports });

    return Result.getOrThrow(render(redacted, configuration, { assetBase, instance, supports }))
      .html;
  });

/**
 * Read a PNP fixture into the supports a host passes `render` and `redact`.
 *
 * @param name The profile's file name under `fixtures/m4`.
 * @returns The supports the profile asks for.
 */
const pnpSupports = (name: string) => readPnp(fixture(name));

/**
 * The supports of a host that enables some catalog supports for every candidate, with no PNP.
 *
 * @param names The catalog supports to enable.
 * @returns The supports.
 */
const hostSupports = (
  ...names: readonly (Supports["catalog"] extends ReadonlySet<infer S> ? S : never)[]
): Supports => ({
  ...noSupports,
  catalog: new Set(names),
});

/**
 * Collect the text below some nodes, as written and in document order.
 *
 * @param nodes The nodes.
 * @returns Their text.
 */
const textBelow = (nodes: readonly Node[]): string =>
  nodes.map((node) => (node.kind === "text" ? node.text : textBelow(node.children))).join("");

/**
 * Tell whether a page shows every run of a card's text, as text of the rendered page.
 *
 * @param html The item's HTML.
 * @param runs The runs of text the card holds.
 * @returns Whether each run is among the page's text.
 */
const shows = (html: string, runs: readonly string[]): boolean => {
  const page = textBelow(parseHtml(html));

  return runs.every((run) => page.includes(run));
};

/**
 * Assert that none of a card's text is anywhere in the page's HTML, in a text node, an attribute or
 * a comment.
 *
 * @param html The item's HTML.
 * @param runs The runs of text the card holds.
 */
const assertDormant = (html: string, runs: readonly string[]): void => {
  for (const run of runs) {
    assert.notInclude(html, run);
  }
};

/**
 * List every element at or below some nodes, in document order.
 *
 * @param nodes The nodes.
 * @returns Each element among them and below them.
 */
const elementsBelow = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsBelow(node.children)] : []));

/**
 * Find the item's `audio` element in a page.
 *
 * @param html The item's HTML.
 * @returns The `audio` element, failing the test when the page holds none.
 */
const audioOf = (html: string): Element =>
  elementsBelow(parseHtml(html)).find((element) => element.tag === "audio") ??
  assert.fail("the page holds no audio element");

describe("the transcript catalog support", () => {
  it.effect("[A-44] a PNP that activates transcript at start shows its card", () =>
    Effect.gen(function* pnpShows() {
      const supports = yield* pnpSupports("pnp-transcript.xml");

      assert.isTrue(supports.atStart.has("transcript"));
      assert.isTrue(supports.catalog.has("transcript"));

      const html = yield* htmlUnder(supports);

      assert.isTrue(shows(html, transcriptText), "the transcript's dialogue is on the page");
    }),
  );

  it.effect("[A-44] with no supports the transcript card stays dormant", () =>
    Effect.gen(function* noneDormant() {
      assertDormant(yield* htmlUnder(noSupports), transcriptText);
    }),
  );

  it.effect("[A-44] a prohibited transcript stays dormant although assigned", () =>
    Effect.gen(function* prohibitedDormant() {
      const supports = yield* pnpSupports("pnp-transcript-prohibited.xml");

      assert.isTrue(supports.prohibited.has("transcript"));
      assert.isFalse(supports.catalog.has("transcript"));

      assertDormant(yield* htmlUnder(supports), transcriptText);
    }),
  );

  it.effect(
    "[A-44] transcript only in the option set is dormant at start and listed as optional",
    () =>
      Effect.gen(function* optionalDormant() {
        const supports = yield* pnpSupports("pnp-transcript-optional.xml");

        assert.isTrue(supports.optional.has("transcript"));
        assert.isFalse(supports.atStart.has("transcript"));
        assert.isFalse(supports.catalog.has("transcript"));

        assertDormant(yield* htmlUnder(supports), transcriptText);
      }),
  );

  it.effect("[A-44] a host's supports without a PNP shows the card the same way", () =>
    Effect.gen(function* hostShows() {
      const viaPnp = yield* htmlUnder(yield* pnpSupports("pnp-transcript.xml"));
      const viaHost = yield* htmlUnder(hostSupports("transcript"));

      assert.isTrue(shows(viaHost, transcriptText), "the transcript's dialogue is on the page");
      assert.strictEqual(viaHost, viaPnp);
    }),
  );

  it.effect("[A-44] only the requested support's card shows", () =>
    Effect.gen(function* onlyRequested() {
      const html = yield* htmlUnder(yield* pnpSupports("pnp-transcript.xml"));

      assert.isTrue(shows(html, transcriptText), "the transcript's dialogue is on the page");
      assertDormant(html, [descriptionText]);
    }),
  );

  it.effect("[A-44] an ext: support never enables the predefined card", () =>
    Effect.gen(function* extensionDormant() {
      const html = yield* htmlUnder(hostSupports("ext:transcript-x"));

      assertDormant(html, [...transcriptText, descriptionText]);
    }),
  );

  it.effect("[A-44] the media element stays in the page beside the transcript", () =>
    Effect.gen(function* mediaStays() {
      const supports = yield* pnpSupports("pnp-transcript.xml");
      const without = yield* htmlUnder(noSupports);
      const withTranscript = yield* htmlUnder(supports);

      for (const html of [without, withTranscript]) {
        const audio = audioOf(html);

        assert.strictEqual(audio.attrs["src"], resolvedSource);
        assert.isDefined(audio.attrs["controls"], "the audio keeps its controls");
      }

      assertDormant(without, transcriptText);
      assert.isTrue(shows(withTranscript, transcriptText), "the dialogue shows with the support");
    }),
  );
});
