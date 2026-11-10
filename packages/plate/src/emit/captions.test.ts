import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import {
  acceptedItem,
  configure,
  decodeRedacted,
  encodeRedacted,
  open,
  redact,
  render,
} from "#plate/index.ts";
import type { Accepted, Element, Node, Options, Verdict } from "#plate/index.ts";
import { checkTree } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";

/**
 * Where the captions fixture sits under the package, which `open` takes as the document's
 * location.
 */
const fixtureLocation = "fixtures/m3e/items/captions.xml";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "q1";

/**
 * An asset base on another origin, with its closing slash.
 */
const assetBase = "https://cdn.example/pkg/";

/**
 * Read the captions fixture as a host reads a document from storage.
 */
const fixtureBytes: Effect.Effect<Uint8Array> = Effect.promise(() =>
  readFile(path.resolve(import.meta.dirname, "..", "..", fixtureLocation)),
);

/**
 * Wrap an item body in a complete QTI 3 item that binds one response and scores it with
 * `match_correct`, so a test's body is the only part that varies.
 *
 * @param body The markup of the `qti-item-body`'s content, which must hold the Choice that binds
 *   `RESPONSE`.
 * @returns The item's XML text.
 */
const itemWith = (body: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="captions-probe" title="Captions probe" adaptive="false" time-dependent="false"
  xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>B</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>${body}</qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

/**
 * The Choice every built item ends with, so each binds `RESPONSE` and scores.
 */
const twoChoices = `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
  <qti-simple-choice identifier="A">First</qti-simple-choice>
  <qti-simple-choice identifier="B">Second</qti-simple-choice>
</qti-choice-interaction>`;

/**
 * Open a document from its text, as a host opens one it read from storage.
 *
 * @param xml The document's text.
 * @returns The verdict on it.
 */
const openText = (xml: string): Effect.Effect<Verdict> =>
  open("captions-probe.xml", new TextEncoder().encode(xml));

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
 * Open the captions fixture and take its accepted item.
 *
 * @returns The accepted item and the verdict that gave it.
 */
const acceptFixture = Effect.fnUntraced(function* acceptFixture() {
  const verdict = yield* open(fixtureLocation, yield* fixtureBytes);

  return { accepted: acceptedOf(verdict), verdict };
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
 * Redact an accepted item and render it with the default configuration and the fixed instance
 * token, as a host does for one candidate.
 *
 * @param accepted The accepted item.
 * @param options The render options beyond the instance token, none by default.
 * @returns The Root element of the page the render wrote.
 */
const renderedRoot = Effect.fnUntraced(function* renderedRoot(
  accepted: Accepted,
  options: Options = {},
) {
  const configuration = yield* configure({});
  const rendered = yield* Effect.fromResult(
    render(redact(accepted), configuration, { instance, ...options }),
  );

  return rootOf(rendered.html);
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
 * List an element's child elements, leaving out the whitespace between them.
 *
 * @param element The parent.
 * @returns Its element children, in document order.
 */
const childrenOf = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Find every element of one tag below a root.
 *
 * @param root The root.
 * @param tag The tag.
 * @returns The elements with that tag, in document order.
 */
const byTag = (root: Element, tag: string): readonly Element[] =>
  elementsOf(root.children).filter((element) => element.tag === tag);

/**
 * Find the one element of a tag below a root, failing the test when there is not exactly one.
 *
 * @param root The root.
 * @param tag The tag.
 * @returns The element.
 */
const soleOf = (root: Element, tag: string): Element => {
  const [only, ...rest] = byTag(root, tag);

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one ${tag}, found ${byTag(root, tag).length}`);
};

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
 * List an element's `track` children, which a media element holds directly.
 *
 * @param media The `video` or `audio`.
 * @returns Its tracks, in document order.
 */
const tracksOf = (media: Element): readonly Element[] =>
  childrenOf(media).filter((child) => child.tag === "track");

/**
 * Give the `src` of every captions track of the fixture's page: the video's, then the audio's.
 *
 * @param root The page's Root element.
 * @returns Each track's `src` as rendered, `undefined` for a track that renders none.
 */
const trackSources = (root: Element): readonly (string | undefined)[] => [
  ...tracksOf(soleOf(root, "video")).map((track) => attributeOf(track, "src")),
  ...tracksOf(soleOf(root, "audio")).map((track) => attributeOf(track, "src")),
];

/**
 * Pick the elements whose `data-slot` marker ends with a part's suffix.
 *
 * @param root The root.
 * @param suffix The marker's end, such as `-label`.
 * @returns The elements marked with it, in document order.
 */
const slotted = (root: Element, suffix: string): readonly Element[] =>
  elementsOf([root]).filter((element) => {
    const slot = element.attrs["data-slot"];

    return slot !== undefined && slot !== true && slot.endsWith(suffix);
  });

describe("A-13b: a captions track on video and audio", () => {
  it.effect("[A-13b] open accepts the captions fixture with no unsupported feature", () =>
    Effect.gen(function* accepts() {
      const { accepted, verdict } = yield* acceptFixture();

      assert.strictEqual(verdict.verdict, "accepted");
      assert.deepStrictEqual(accepted.unsupported, []);
    }),
  );

  it.effect(
    "[A-13b] a video's captions track renders inside the video with its kind and srclang",
    () =>
      Effect.gen(function* videoTrack() {
        const { accepted } = yield* acceptFixture();
        const video = soleOf(yield* renderedRoot(accepted), "video");
        const [first] = tracksOf(video);

        assert.deepStrictEqual(
          childrenOf(video).map((child) => child.tag),
          ["source", "track", "track"],
          "the tracks follow the source, as authored",
        );
        assert.isDefined(first);
        assert.strictEqual(first.attrs["kind"], "captions");
        assert.strictEqual(first.attrs["srclang"], "en");
      }),
  );

  it.effect("[A-13b] both captions tracks of the video render, in document order", () =>
    Effect.gen(function* bothTracks() {
      const { accepted } = yield* acceptFixture();
      const tracks = tracksOf(soleOf(yield* renderedRoot(accepted), "video"));

      assert.deepStrictEqual(
        tracks.map((track) => [track.attrs["kind"], track.attrs["srclang"]]),
        [
          ["captions", "en"],
          ["captions", "fr"],
        ],
      );
    }),
  );

  it.effect("[A-13b] an audio's captions track renders inside the audio", () =>
    Effect.gen(function* audioTrack() {
      const { accepted } = yield* acceptFixture();
      const audio = soleOf(yield* renderedRoot(accepted), "audio");
      const [track] = tracksOf(audio);

      assert.deepStrictEqual(
        childrenOf(audio).map((child) => child.tag),
        ["source", "track"],
      );
      assert.isDefined(track);
      assert.strictEqual(track.attrs["kind"], "captions");
      assert.strictEqual(track.attrs["srclang"], "en");
    }),
  );

  it.effect("[A-13b] a captions track's package-relative src resolves against the asset base", () =>
    Effect.gen(function* rebased() {
      const { accepted } = yield* acceptFixture();

      for (const base of [assetBase, "https://cdn.example/pkg"]) {
        assert.deepStrictEqual(
          trackSources(yield* renderedRoot(accepted, { assetBase: base })),
          [
            "https://cdn.example/pkg/media/clip.en.vtt",
            "https://cdn.example/pkg/media/clip.fr.vtt",
            "https://cdn.example/pkg/media/note.en.vtt",
          ],
          `the asset base ${base}`,
        );
      }

      assert.deepStrictEqual(
        trackSources(yield* renderedRoot(accepted)),
        ["media/clip.en.vtt", "media/clip.fr.vtt", "media/note.en.vtt"],
        "with no asset base the paths stay relative to the page",
      );
    }),
  );

  it.effect("[A-13b] a captions track's default renders as written", () =>
    Effect.gen(function* defaults() {
      const { accepted } = yield* acceptFixture();
      const [english, french] = tracksOf(soleOf(yield* renderedRoot(accepted), "video"));

      assert.isDefined(english);
      assert.isDefined(french);
      assert.strictEqual(attributeOf(english, "default"), "true");
      assert.isFalse(
        Object.hasOwn(french.attrs, "default"),
        "the track that wrote no default renders none",
      );
    }),
  );

  it.effect(
    "[A-13b] a captions track whose src leaves the package renders with no src, as a media source's does",
    () =>
      Effect.gen(function* leaving() {
        // A track's `src` is a `resource` URL (`urlAttributes` in `model/url.ts`), which keeps an
        // absolute http or https URL, so only these forms leave the package and are dropped.
        const outside = ["/captions/clip.vtt", "../clip.vtt", "//elsewhere.example/clip.vtt"];

        for (const src of outside) {
          const verdict = yield* openText(
            itemWith(
              `<video controls="controls">
                <source src="media/clip.mp4" type="video/mp4"/>
                <track kind="captions" srclang="en" src="${src}"/>
              </video>${twoChoices}`,
            ),
          );
          const root = yield* renderedRoot(acceptedOf(verdict), { assetBase });
          const video = soleOf(root, "video");
          const [track] = tracksOf(video);
          const siblings = childrenOf(root);
          const after = siblings[siblings.indexOf(video) + 1];

          assert.isDefined(track, src);
          assert.strictEqual(track.attrs["kind"], "captions", src);
          assert.strictEqual(track.attrs["srclang"], "en", src);
          assert.isFalse(Object.hasOwn(track.attrs, "src"), `${src} renders no src`);
          assert.strictEqual(
            soleOf(video, "source").attrs["src"],
            "https://cdn.example/pkg/media/clip.mp4",
            `${src}: the media's own source stays`,
          );
          assert.strictEqual(
            after?.attrs["data-slot"],
            "item-notice",
            `${src}: the candidate is told the track is not shown, after the video`,
          );
        }
      }),
  );

  it.effect("[A-13b] the captions tracks survive redact and the redacted codec", () =>
    Effect.gen(function* codec() {
      const { accepted } = yield* acceptFixture();
      const configuration = yield* configure({});
      const redacted = redact(accepted);
      const direct = yield* Effect.fromResult(
        render(redacted, configuration, { assetBase, instance }),
      );
      const written = JSON.stringify(yield* Effect.fromResult(encodeRedacted(redacted)));
      const restored = yield* Effect.fromResult(decodeRedacted(JSON.parse(written)));
      const stored = yield* Effect.fromResult(
        render(restored, configuration, { assetBase, instance }),
      );
      const tracks = byTag(rootOf(stored.html), "track");

      assert.strictEqual(stored.html, direct.html);
      assert.deepStrictEqual(
        tracks.map((track) => [track.attrs["kind"], track.attrs["srclang"], track.attrs["src"]]),
        [
          ["captions", "en", "https://cdn.example/pkg/media/clip.en.vtt"],
          ["captions", "fr", "https://cdn.example/pkg/media/clip.fr.vtt"],
          ["captions", "en", "https://cdn.example/pkg/media/note.en.vtt"],
        ],
        "the equal HTML holds the tracks, so the comparison is not of two empty media",
      );
    }),
  );

  it.effect("[A-13b] the rendered media passes checkTree and round-trips", () =>
    Effect.gen(function* accessible() {
      const { accepted } = yield* acceptFixture();
      const root = yield* renderedRoot(accepted, { assetBase });

      assert.lengthOf(byTag(root, "track"), 3);
      assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
      assert.isTrue(roundTrips(root), "the HTML round-trips");
    }),
  );

  it.effect("[A-13b] a captions track inside a choice's content renders there", () =>
    Effect.gen(function* inChoice() {
      const verdict = yield* openText(
        itemWith(
          `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
            <qti-simple-choice identifier="A">
              <video controls="controls">
                <source src="media/a.mp4" type="video/mp4"/>
                <track kind="captions" srclang="en" src="media/a.en.vtt"/>
              </video>
            </qti-simple-choice>
            <qti-simple-choice identifier="B">Neither</qti-simple-choice>
          </qti-choice-interaction>`,
        ),
      );
      const root = yield* renderedRoot(acceptedOf(verdict));
      const [label] = slotted(root, "choice-interaction-label");

      assert.strictEqual(verdict.verdict, "accepted");
      assert.isDefined(label, "the Choice renders a Label");

      const [track] = tracksOf(soleOf(label, "video"));

      assert.isDefined(track, "the first choice's Label holds the video and its track");
      assert.strictEqual(track.attrs["kind"], "captions");
      assert.strictEqual(track.attrs["srclang"], "en");
      assert.strictEqual(track.attrs["src"], "media/a.en.vtt");
      assert.lengthOf(byTag(root, "track"), 1, "the track is nowhere else in the item");
    }),
  );
});
