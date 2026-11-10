/**
 * A-9, audio description: tests that a candidate whose PNP activates `audio-description` at start
 * gets the item's `audio-description` catalog card, the audio-described version of its video, and
 * that every other candidate gets the card dormant.
 *
 * The tests are black box and PNP driven: `readPnp` reads a PNP fixture into the supports, then
 * `open`, `redact` and `render` take the item and those supports, and each assertion reads the
 * HTML (and, for what stays dormant, the redacted copy as the JSON a host sends a page). They
 * prove that the PNP's sets decide the support (activated at start, prohibited, only an option),
 * that a host's own supports give the same page as the PNP's, that a card shows only for its own
 * support and never for an `ext:` one, that the card's file is offered at the URL `render`
 * resolves against `assetBase`, that a card holding both content and a file offers both, and that
 * the item's own video stays in the page either way.
 *
 * Where the card sits beside the video is the catalog module's; the tests read only that the
 * card's sentence and file are in the page, or in neither the page nor the redacted copy.
 *
 * @module
 */
import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { encodeRedacted } from "#plate/codec/redacted.ts";
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
 * Where the item fixture sits under the package, which `open` takes as the document's location.
 */
const itemLocation = "fixtures/m4/items/catalog-audio-description.xml";

/**
 * The instance token every render here is made for, so two renders of equal items give equal HTML.
 */
const instance = "m406";

/**
 * An asset base on another origin, with its closing slash.
 */
const assetBase = "https://cdn.example/pkg/";

/**
 * The sentence of the fixture's `audio-description` card, which nothing else in the item holds.
 */
const describedSentence =
  "A narrator names each shape the teacher draws on the board and says where it sits.";

/**
 * The path of the fixture's audio-described version of the video, as the card's `qti-file-href`
 * writes it. No other path in the item contains it, so it names the card's file in the page and in
 * the redacted copy alike.
 */
const describedFile = "media/lesson-described.mp4";

/**
 * The URL `render` resolves the audio-described version to against {@link assetBase}.
 */
const describedUrl = `${assetBase}${describedFile}`;

/**
 * The sentence of the fixture's `transcript` card, the second card of the same catalog.
 */
const transcriptSentence = "Teacher: Today we label the parts of a plant, starting with the leaf.";

/**
 * The URL `render` resolves the item's own video to against {@link assetBase}.
 */
const lessonUrl = `${assetBase}media/lesson.mp4`;

/**
 * The supports of a host that asks for audio description for every candidate and nothing else.
 */
const hostAudioDescription: Supports = {
  ...noSupports,
  catalog: new Set(["audio-description"]),
};

/**
 * Read a fixture of `fixtures/m4` as bytes.
 *
 * @param name The file's path under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/${name}`, import.meta.url)));

/**
 * Open the item fixture and take its accepted item, failing the test naming the verdict when it
 * accepts none.
 */
const acceptedFixture = open(itemLocation, fixture("items/catalog-audio-description.xml")).pipe(
  Effect.map((verdict) =>
    Option.getOrElse(acceptedItem(verdict), () =>
      assert.fail(`the item fixture is ${verdict.verdict}, not accepted`),
    ),
  ),
);

/**
 * What a candidate's page is made of: the HTML `render` wrote and the redacted copy as the JSON
 * text a host sends to the page.
 */
interface Page {
  readonly html: string;
  readonly json: string;
}

/**
 * Redact the item fixture and render it under the supports, with this file's asset base and
 * instance, as a host does for one candidate.
 *
 * @param supports The supports the host passes to both `redact` and `render`.
 * @returns The page's HTML and redacted copy.
 */
const pageFor = Effect.fnUntraced(function* pageFor(supports: Supports) {
  const accepted = yield* acceptedFixture;
  const configuration = yield* configure({});
  const redacted = redact(accepted, undefined, undefined, { supports });
  const rendered = yield* Effect.fromResult(
    render(redacted, configuration, { assetBase, instance, supports }),
  );
  const json = JSON.stringify(yield* Effect.fromResult(encodeRedacted(redacted)));

  return { html: rendered.html, json } satisfies Page;
});

/**
 * Read a PNP fixture into supports and give the page of the item under them, so the PNP alone
 * decides what the page holds.
 *
 * @param name The PNP fixture's file name under `fixtures/m4`.
 * @returns The supports `readPnp` gave and the page they produce.
 */
const pagePnpDrives = Effect.fnUntraced(function* pagePnpDrives(name: string) {
  const supports = yield* readPnp(fixture(name));

  return { page: yield* pageFor(supports), supports };
});

/**
 * Fail the test unless the audio-description card shows: its sentence is in the page's HTML.
 *
 * @param page The page.
 */
const assertShown = (page: Page): void => {
  assert.include(page.html, describedSentence, "the audio-description card's sentence shows");
};

/**
 * Fail the test unless the audio-description card is dormant, in the form m3e-04's catalog tests
 * pin: neither its sentence nor its file is in the HTML or in the redacted copy.
 *
 * @param page The page.
 */
const assertDormant = (page: Page): void => {
  for (const [kind, text] of [
    ["page", page.html],
    ["redacted copy", page.json],
  ] as const) {
    assert.notInclude(text, describedSentence, `the card's sentence is not in the ${kind}`);
    assert.notInclude(text, describedFile, `the card's file is not in the ${kind}`);
  }
};

/**
 * List the elements at or below some nodes, in document order.
 *
 * @param nodes The nodes.
 * @returns Each element among them and below them.
 */
const elementsBelow = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsBelow(node.children)] : []));

/**
 * Give the `src` of every `video` element in a page's HTML, in document order.
 *
 * @param html The page's HTML.
 * @returns The `src` of each `video` that has one as text.
 */
const videoSources = (html: string): readonly string[] =>
  elementsBelow(parseHtml(html)).flatMap(({ attrs, tag }) => {
    const { src } = attrs;

    return tag === "video" && src !== undefined && src !== true ? [src] : [];
  });

describe("A-9: audio description, PNP-driven", () => {
  it.effect("[A-9] a PNP that activates audio-description at start shows its card", () =>
    Effect.gen(function* showsAtStart() {
      const { page, supports } = yield* pagePnpDrives("pnp-audio-description.xml");

      assert.isTrue(supports.atStart.has("audio-description"), "the PNP activates it at start");
      assert.isTrue(supports.catalog.has("audio-description"), "so the catalog support is on");
      assertShown(page);
    }),
  );

  it.effect("[A-9] with no supports the audio-description card stays dormant", () =>
    Effect.gen(function* dormantWithNone() {
      assertDormant(yield* pageFor(noSupports));
    }),
  );

  it.effect("[A-9] a prohibited audio-description stays dormant although assigned", () =>
    Effect.gen(function* dormantWhenProhibited() {
      const { page, supports } = yield* pagePnpDrives("pnp-audio-description-prohibited.xml");

      assert.isTrue(supports.prohibited.has("audio-description"), "the PNP prohibits it");
      assert.isFalse(supports.catalog.has("audio-description"), "so the catalog support is off");
      assert.isFalse(supports.atStart.has("audio-description"), "and it is not on at start");
      assertDormant(page);
    }),
  );

  it.effect(
    "[A-9] audio-description only in the option set is dormant at start and listed as optional",
    () =>
      Effect.gen(function* dormantAsOption() {
        const { page, supports } = yield* pagePnpDrives("pnp-audio-description-optional.xml");

        assert.isTrue(supports.optional.has("audio-description"), "the PNP lists it as optional");
        assert.isFalse(supports.atStart.has("audio-description"), "it is not on at start");
        assert.isFalse(supports.catalog.has("audio-description"), "so the catalog support is off");
        assertDormant(page);
      }),
  );

  it.effect("[A-9] a host's supports without a PNP shows the card the same way", () =>
    Effect.gen(function* hostSupports() {
      const { page: fromPnp } = yield* pagePnpDrives("pnp-audio-description.xml");
      const fromHost = yield* pageFor(hostAudioDescription);

      assertShown(fromHost);
      assert.strictEqual(fromHost.html, fromPnp.html);
    }),
  );

  it.effect("[A-9] only the requested support's card shows", () =>
    Effect.gen(function* onlyRequested() {
      const audioDescription = yield* pageFor(hostAudioDescription);
      const transcript = yield* pageFor({ ...noSupports, catalog: new Set(["transcript"]) });

      assertShown(audioDescription);
      assert.notInclude(audioDescription.html, transcriptSentence);
      assert.notInclude(audioDescription.json, transcriptSentence);

      assert.include(transcript.html, transcriptSentence);
      assertDormant(transcript);
    }),
  );

  it.effect("[A-9] an ext: support never enables the predefined card", () =>
    Effect.gen(function* extensionSupport() {
      assertDormant(
        yield* pageFor({ ...noSupports, catalog: new Set(["ext:audio-description-x"]) }),
      );
    }),
  );

  it.effect("[A-9] the audio-described version's URL is resolved against assetBase", () =>
    Effect.gen(function* resolvedUrl() {
      const { html: shown } = yield* pageFor(hostAudioDescription);
      const { html: dormant } = yield* pageFor(noSupports);

      assert.include(shown, describedUrl);
      assert.notInclude(dormant, describedUrl);
    }),
  );

  it.effect("[A-9] a card holding both html content and a file offers both", () =>
    Effect.gen(function* offersBoth() {
      const { page } = yield* pagePnpDrives("pnp-audio-description.xml");

      assert.include(page.html, describedSentence);
      assert.include(page.html, describedUrl);
    }),
  );

  it.effect("[A-9] the item's own video stays in the page", () =>
    Effect.gen(function* keepsVideo() {
      const { page: withSupport } = yield* pagePnpDrives("pnp-audio-description.xml");
      const withoutSupport = yield* pageFor(noSupports);

      assert.include(videoSources(withSupport.html), lessonUrl, "with the support");
      assert.include(videoSources(withoutSupport.html), lessonUrl, "without it");
    }),
  );
});
