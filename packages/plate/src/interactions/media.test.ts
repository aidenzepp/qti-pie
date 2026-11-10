import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  acceptedItem,
  checkResponses,
  configure,
  decode,
  decodeRedacted,
  encodeRedacted,
  entryName,
  open,
  postings,
  redact,
  render,
  restore,
  score,
  solution,
} from "#plate/index.ts";
import type {
  Accepted,
  Element,
  Entry,
  Node,
  RenderMode,
  ResponseValue,
  Value,
  ValidationMessage,
} from "#plate/index.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import type { Malformed } from "#plate/form/encoding.ts";
import { mediaModule } from "#plate/interactions/media.ts";
import { mapRegions, regionsOf } from "#plate/model/interactions.ts";
import type { BodyNode } from "#plate/model/item.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { validateAgainst } from "#plate/test/xsd.ts";
import { unsupportedFeatures } from "#plate/validate/verdict.ts";

/**
 * The folder of the area's fixture items, relative to this file's package.
 */
const fixtureDirectory = path.resolve(import.meta.dirname, "..", "..", "fixtures", "ei", "items");

/**
 * The fixtures: the audio with two plays allowed and one required, and the looping video.
 */
const fixtures = ["media.xml", "media-video.xml"] as const;

/**
 * The cached QTI 3.0.1 ASI XSD, which governs every item.
 */
const asiXsd = "imsqti_asiv3p0p1_v1p0.xsd";

/**
 * The ASI XSD compiles from about 18 MB of schema text on every run, which takes xmllint a second
 * or two on an idle machine; the cap lets the machine run far busier than that.
 */
const asiTimeoutMs = 120_000;

/**
 * The item instance the renders here are made under unless a test names another.
 */
const instance = "me1";

/**
 * The identifier of the response the Media binds.
 */
const response = "RESPONSE";

/**
 * The form entry name the Media's hidden input posts under in {@link instance}.
 */
const name = entryName(instance, response);

/**
 * Read one fixture item as text.
 *
 * @param file The item's file name in the fixture folder.
 * @returns The item's XML.
 */
const fixtureText = (file: string) =>
  Effect.tryPromise(() => readFile(path.join(fixtureDirectory, file), "utf-8"));

/**
 * Open an item's XML as `open` does.
 *
 * @param file The item's file name, which the verdict names as the document.
 * @param xml The item's XML.
 * @returns The verdict.
 */
const opened = (file: string, xml: string) => open(`items/${file}`, new TextEncoder().encode(xml));

/**
 * Open an item's XML and give the item the verdict accepted, failing the test when it accepts
 * none.
 *
 * @param file The item's file name.
 * @param xml The item's XML.
 * @returns The accepted item.
 */
const accept = (file: string, xml: string) =>
  Effect.map(opened(file, xml), (verdict) =>
    Option.match(acceptedItem(verdict), {
      onNone: (): Accepted => assert.fail(`${file}: ${JSON.stringify(verdict)}`),
      onSome: (accepted) => accepted,
    }),
  );

/**
 * Read a fixture item and give it accepted.
 *
 * @param file The item's file name.
 * @returns The accepted item.
 */
const acceptedFixture = (file: string) =>
  Effect.flatMap(fixtureText(file), (xml) => accept(file, xml));

/**
 * Replace the one place a text occurs in an item's XML, failing the test when it is not there.
 *
 * @param xml The item's XML.
 * @param from The text to find.
 * @param to The text to put in its place.
 * @returns The edited XML.
 */
const edited = (xml: string, from: string, to: string): string => {
  assert.include(xml, from);

  return xml.replace(from, to);
};

/**
 * Construct the single integer value of a count of plays.
 *
 * @param plays The count.
 * @returns The value.
 */
const countValue = (plays: bigint): Value => ({
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value: plays }],
});

/**
 * Give the elements of nodes in document order, each followed by its descendants.
 *
 * @param nodes The nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the marker of a Media part.
 *
 * @param part The part's marker suffix, none for the Root.
 * @returns The `data-slot` value.
 */
const slotOf = (part = ""): string =>
  part === "" ? "media-interaction" : `media-interaction-${part}`;

/**
 * Read an attribute of an emitted element as a string.
 *
 * @param element The element.
 * @param attribute The attribute's name.
 * @returns The value, `undefined` when the element does not carry it.
 */
const attributeOf = (element: Element, attribute: string): string | undefined => {
  const value = element.attrs[attribute];

  return value === true ? "" : value;
};

/**
 * Tell whether an emitted element carries an attribute.
 *
 * @param element The element.
 * @param attribute The attribute's name.
 * @returns Whether the attribute is written, whatever its value.
 */
const carries = (element: Element, attribute: string): boolean =>
  Object.hasOwn(element.attrs, attribute);

/**
 * Give the elements of a rendered page that carry a Media part's marker, in document order.
 *
 * @param html The page's HTML.
 * @param part The part's marker suffix, none for the Root.
 * @returns The elements.
 */
const partsOf = (html: string, part = ""): readonly Element[] =>
  elementsOf(parseHtml(html)).filter(
    (element) => attributeOf(element, "data-slot") === slotOf(part),
  );

/**
 * Give the one element of a tag a rendered page holds, failing the test when it holds none or
 * several.
 *
 * @param html The page's HTML.
 * @param tag The tag.
 * @returns The element.
 */
const elementOf = (html: string, tag: string): Element => {
  const found = elementsOf(parseHtml(html)).filter((element) => element.tag === tag);
  const [only] = found;

  return found.length === 1 && only !== undefined
    ? only
    : assert.fail(`the page holds ${found.length} ${tag} elements`);
};

/**
 * What a test passes `render` beyond the item: the values, the mode and the refused post the author
 * chooses, and the instance the entry names are keyed by.
 */
interface Showing {
  readonly disabled?: boolean;
  readonly instance?: string;
  readonly messages?: readonly ValidationMessage[];
  readonly mode?: RenderMode;
  readonly posted?: Readonly<Record<string, readonly string[]>>;
  readonly values?: Readonly<Record<string, ResponseValue>>;
}

/**
 * Render an accepted item's redaction.
 *
 * @param accepted The accepted item.
 * @param showing What the author passes to `render`.
 * @returns The page's HTML.
 */
const htmlOf = (accepted: Accepted, showing: Showing = {}) =>
  Effect.gen(function* renderPage() {
    const configuration = yield* configure({});
    const rendered = yield* Effect.fromResult(
      render(redact(accepted, undefined, configuration), configuration, {
        instance,
        ...showing,
      }),
    );

    return rendered.html;
  });

/**
 * Check a response as the item's interactions do.
 *
 * @param accepted The accepted item.
 * @param value The response's value, none to leave it out.
 * @param validateResponses Whether tier (b) limits apply too.
 * @returns The messages `checkResponses` gives.
 */
const checked = (accepted: Accepted, value?: Value, validateResponses = false) =>
  Effect.map(configure({ validateResponses }), (configuration) =>
    checkResponses(accepted, value === undefined ? {} : { [response]: value }, configuration),
  );

/**
 * The texts of the messages a check gave.
 *
 * @param messages The messages.
 * @returns Their texts, in order.
 */
const textsOf = (messages: readonly { readonly text: string }[]): readonly string[] =>
  messages.map(({ text }) => text);

/**
 * The first element of a rendered page, the item's Root.
 *
 * @param html The page's HTML.
 * @returns The Root element, failing the test when the page holds none.
 */
const rootOf = (html: string): Element => {
  const [root] = parseHtml(html);

  return root?.kind === "element" ? root : assert.fail("the page holds no element");
};

/**
 * Give the values of the hidden inputs a rendered page writes, in order.
 *
 * @param html The page's HTML.
 * @returns Each input's `value`.
 */
const hiddenValuesOf = (html: string): readonly string[] =>
  partsOf(html, "hidden").map((input) => attributeOf(input, "value") ?? "");

describe("Media", () => {
  it.effect(
    "[Q-14] the fixtures validate against the QTI 3.0.1 ASI XSD",
    () =>
      Effect.gen(function* fixturesValid() {
        for (const file of fixtures) {
          const result = yield* validateAgainst(asiXsd, yield* fixtureText(file));

          assert.isTrue(result.valid, `${file}: ${result.messages.join("\n")}`);
        }
      }),
    { tags: ["qti-xsd"], timeout: asiTimeoutMs },
  );

  it.effect("[Q-14] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* acceptsFixture() {
      for (const file of fixtures) {
        const verdict = yield* opened(file, yield* fixtureText(file));

        assert.strictEqual(verdict.verdict, "accepted", file);
        assert.isTrue(Option.isSome(acceptedItem(verdict)), file);
        assert.deepStrictEqual(unsupportedFeatures(verdict), [], file);
      }
    }),
  );

  it.effect(
    "[Q-14] an unrendered binding, a response that is not a single integer, stays the notice",
    () =>
      Effect.gen(function* noticesBindings() {
        const base = yield* fixtureText("media.xml");
        const multiple = edited(base, 'cardinality="single"', 'cardinality="multiple"');
        const float = edited(base, 'base-type="integer"', 'base-type="float"');

        for (const [xml, feature] of [
          [multiple, 'cardinality="multiple"'],
          [float, 'base-type="float"'],
        ] as const) {
          const verdict = yield* opened("media-binding.xml", xml);

          assert.strictEqual(verdict.verdict, "accepted-with-unsupported", feature);
          assert.deepStrictEqual(
            unsupportedFeatures(verdict).map((entry) => entry.feature),
            [feature],
          );
        }
      }),
  );

  it.effect(
    "[Q-14] coords is read and ignored with a mark, and an object, which cannot count plays, is marked",
    () =>
      Effect.gen(function* marksUnrendered() {
        const base = yield* fixtureText("media.xml");
        const placed = edited(base, 'autostart="false"', 'autostart="false" coords="10,10,100,60"');
        const verdict = yield* opened("media-coords.xml", placed);
        const accepted = Option.getOrThrow(acceptedItem(verdict));

        assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
        assert.deepStrictEqual(
          unsupportedFeatures(verdict).map((entry) => entry.feature),
          ["coords"],
        );
        assert.lengthOf(partsOf(yield* htmlOf(accepted)), 1);

        const object = base.replace(
          /<audio[\S\s]*<\/audio>/u,
          '<object data="media/dawn-chorus.mp3" type="audio/mpeg"/>',
        );
        const objectVerdict = yield* opened("media-object.xml", object);
        const objectItem = Option.getOrThrow(acceptedItem(objectVerdict));
        const html = yield* htmlOf(objectItem);

        assert.deepStrictEqual(
          unsupportedFeatures(objectVerdict).map((entry) => entry.feature),
          ["object"],
        );
        assert.strictEqual(elementOf(html, "object").tag, "object");
        assert.lengthOf(partsOf(html, "media"), 1);
      }),
  );

  it.effect(
    "[Q-14] render emits the root, prompt and the author's media element with its sources and tracks",
    () =>
      Effect.gen(function* emitsParts() {
        const html = yield* htmlOf(yield* acceptedFixture("media.xml"));
        const slots = elementsOf(parseHtml(html)).flatMap((element) => {
          const slot = attributeOf(element, "data-slot");

          return slot?.startsWith(slotOf()) === true ? [slot] : [];
        });

        assert.deepStrictEqual(slots, [slotOf(), slotOf("prompt"), slotOf("media")]);

        const [root] = partsOf(html);
        const [prompt] = partsOf(html, "prompt");
        const [media] = partsOf(html, "media");

        assert.isDefined(root);
        assert.isDefined(prompt);
        assert.isDefined(media);
        assert.strictEqual(attributeOf(root ?? rootOf(html), "data-entry-name"), name);
        assert.strictEqual(attributeOf(root ?? rootOf(html), "data-min-plays"), "1");
        assert.strictEqual(attributeOf(root ?? rootOf(html), "data-max-plays"), "2");
        assert.strictEqual(
          textOf(prompt ?? rootOf(html)),
          "Listen to the recording of a dawn chorus. You may play it twice.",
        );

        const audio = elementOf(html, "audio");

        assert.deepStrictEqual(
          media?.children.flatMap((child) => (child.kind === "element" ? [child] : [])),
          [audio],
        );
        assert.strictEqual(attributeOf(audio, "preload"), "none");
        assert.deepStrictEqual(
          audio.children.flatMap((child) =>
            child.kind === "element"
              ? [[child.tag, attributeOf(child, "src"), attributeOf(child, "type")]]
              : [],
          ),
          [
            ["source", "media/dawn-chorus.mp3", "audio/mpeg"],
            ["track", "media/dawn-chorus.en.vtt", undefined],
          ],
        );

        const track = elementOf(html, "track");

        assert.strictEqual(attributeOf(track, "kind"), "captions");
        assert.strictEqual(attributeOf(track, "srclang"), "en");

        const [unset] = partsOf(yield* htmlOf(yield* acceptedFixture("media-video.xml")));

        assert.strictEqual(unset === undefined ? "" : attributeOf(unset, "data-min-plays"), "0");
        assert.strictEqual(unset === undefined ? "" : attributeOf(unset, "data-max-plays"), "0");
      }),
  );

  it.effect(
    '[Q-14] autostart and loop render as the native attributes, and controls="false" renders no controls',
    () =>
      Effect.gen(function* rendersNatively() {
        const video = elementOf(yield* htmlOf(yield* acceptedFixture("media-video.xml")), "video");

        assert.isTrue(carries(video, "autoplay"));
        assert.isTrue(carries(video, "loop"));
        assert.isFalse(carries(video, "controls"));
        assert.strictEqual(attributeOf(video, "width"), "320");
        assert.strictEqual(attributeOf(video, "poster"), "media/lighthouse.png");

        const audio = elementOf(yield* htmlOf(yield* acceptedFixture("media.xml")), "audio");

        assert.isTrue(carries(audio, "controls"));
        assert.isFalse(carries(audio, "autoplay"));
        assert.isFalse(carries(audio, "loop"));
      }),
  );

  it.effect(
    "[Q-14] the interaction's autostart and loop decide, and an element's own booleans written false are no attribute",
    () =>
      Effect.gen(function* decidesBooleans() {
        const base = yield* fixtureText("media-video.xml");
        const stopped = edited(
          edited(base, 'autostart="true" loop="true"', 'autostart="false" loop="false"'),
          '<video controls="false"',
          '<video controls="controls" autoplay="autoplay" loop="loop" muted="false"',
        );
        const quiet = elementOf(yield* htmlOf(yield* accept("media-quiet.xml", stopped)), "video");

        assert.isFalse(carries(quiet, "autoplay"));
        assert.isFalse(carries(quiet, "loop"));
        assert.isFalse(carries(quiet, "muted"));
        assert.isTrue(carries(quiet, "controls"));

        const started = edited(
          edited(base, 'autostart="true" loop="true"', 'autostart="true"'),
          '<video controls="false"',
          '<video controls="true" muted="true"',
        );
        const playing = elementOf(
          yield* htmlOf(yield* accept("media-playing.xml", started)),
          "video",
        );

        assert.isTrue(carries(playing, "autoplay"));
        assert.isFalse(carries(playing, "loop"));
        assert.isTrue(carries(playing, "muted"));
        assert.isTrue(carries(playing, "controls"));
      }),
  );

  it.effect(
    "[Q-14] postings binds the response as a single integer and decode reads a posted count",
    () =>
      Effect.gen(function* posts() {
        const accepted = yield* acceptedFixture("media.xml");
        const [posting, ...rest] = postings(redact(accepted), instance);

        assert.strictEqual(rest.length, 0);
        assert.isDefined(posting);

        const posted = posting ?? assert.fail("the item has no posting for its response");

        assert.strictEqual(posted.identifier, response);
        assert.deepStrictEqual(posted.binding, {
          baseType: "integer",
          cardinality: "single",
          name,
        });

        const entries: readonly Entry[] = [[name, "2"]];

        assert.deepStrictEqual(
          decode(entries, posted.binding, posted.options),
          Result.succeed(countValue(2n)),
        );
        assert.deepStrictEqual(
          Result.match(decode([[name, "twice"]], posted.binding, posted.options), {
            onFailure: (malformed) => malformed.reason,
            onSuccess: () => "decoded",
          }),
          "number",
        );
        assert.deepStrictEqual(
          decode([], posted.binding, posted.options),
          Result.succeed({ baseType: "integer", cardinality: "single", values: [] }),
        );
      }),
  );

  it.effect(
    "[Q-14] checkResponses: fewer plays than min-plays is refused only under validateResponses",
    () =>
      Effect.gen(function* refusesFewPlays() {
        const accepted = yield* acceptedFixture("media.xml");

        assert.deepStrictEqual(yield* checked(accepted, countValue(0n)), []);
        assert.deepStrictEqual(yield* checked(accepted), []);

        const refused = yield* checked(accepted, countValue(0n), true);

        assert.lengthOf(refused, 1);
        assert.strictEqual(refused[0]?.response, response);
        assert.match(textsOf(refused).join("\n"), /at least once/u);
        assert.lengthOf(yield* checked(accepted, undefined, true), 1);
        assert.deepStrictEqual(yield* checked(accepted, countValue(1n), true), []);
        assert.deepStrictEqual(yield* checked(accepted, countValue(2n), true), []);

        const thrice = yield* accept(
          "media-thrice.xml",
          edited(yield* fixtureText("media.xml"), 'min-plays="1" max-plays="2"', 'min-plays="3"'),
        );
        const short = yield* checked(thrice, countValue(2n), true);

        assert.lengthOf(short, 1);
        assert.match(textsOf(short).join("\n"), /at least 3 times/u);
        assert.deepStrictEqual(yield* checked(thrice, countValue(2n)), []);
        assert.deepStrictEqual(yield* checked(thrice, countValue(3n), true), []);

        const video = yield* acceptedFixture("media-video.xml");

        assert.deepStrictEqual(yield* checked(video, countValue(0n), true), []);
        assert.deepStrictEqual(yield* checked(video, undefined, true), []);
      }),
  );

  it.effect(
    "[Q-14] checkResponses: more plays than max-plays is refused in tier (a), and 0 is no limit",
    () =>
      Effect.gen(function* refusesManyPlays() {
        const accepted = yield* acceptedFixture("media.xml");

        for (const validateResponses of [false, true]) {
          const refused = yield* checked(accepted, countValue(3n), validateResponses);

          assert.lengthOf(refused, 1, String(validateResponses));
          assert.match(textsOf(refused).join("\n"), /at most 2 times/u);
        }

        const once = yield* accept(
          "media-once.xml",
          edited(yield* fixtureText("media.xml"), 'max-plays="2"', 'max-plays="1"'),
        );
        const twice = yield* checked(once, countValue(2n));

        assert.lengthOf(twice, 1);
        assert.match(textsOf(twice).join("\n"), /only once/u);
        assert.deepStrictEqual(yield* checked(once, countValue(1n)), []);

        const video = yield* acceptedFixture("media-video.xml");

        assert.deepStrictEqual(yield* checked(video, countValue(500n)), []);
      }),
  );

  it.effect("[Q-14] checkResponses: a post that is no count, or is posted twice, is refused", () =>
    Effect.gen(function* refusesMalformed() {
      const accepted = yield* acceptedFixture("media.xml");
      const configuration = yield* configure({});
      const binding = { baseType: "integer", cardinality: "single", name } as const;

      for (const [entries, reason] of [
        [[[name, "twice"]], "number"],
        [
          [
            [name, "1"],
            [name, "2"],
          ],
          "single-many",
        ],
      ] as const) {
        const given = decode(entries, binding);

        assert.deepStrictEqual(
          Result.match(given, { onFailure: (error) => error.reason, onSuccess: () => "decoded" }),
          reason,
        );

        const messages = checkResponses(
          accepted,
          {
            [response]: Result.match(given, {
              onFailure: (error): Malformed => error,
              onSuccess: () => assert.fail("the post decoded"),
            }),
          },
          configuration,
        );

        assert.lengthOf(messages, 1, reason);
      }
    }),
  );

  it.effect("[Q-14] a restored count is written by the SSR as the hidden input", () =>
    Effect.gen(function* restoresCount() {
      const accepted = yield* acceptedFixture("media.xml");
      const html = yield* htmlOf(accepted, { values: { [response]: countValue(1n) } });

      assert.deepStrictEqual(
        partsOf(html, "hidden").map((input) => [
          input.tag,
          attributeOf(input, "name"),
          attributeOf(input, "type"),
          attributeOf(input, "value"),
        ]),
        [["input", name, "hidden", "1"]],
      );

      const [root] = partsOf(html);

      assert.deepStrictEqual(
        root?.children
          .flatMap((child) => (child.kind === "element" ? [attributeOf(child, "data-slot")] : []))
          .slice(-1),
        [slotOf("hidden")],
      );
      assert.deepStrictEqual(partsOf(yield* htmlOf(accepted), "hidden"), []);
      assert.deepStrictEqual(
        partsOf(yield* htmlOf(accepted, { values: { [response]: countValue(0n) } }), "hidden").map(
          (input) => attributeOf(input, "value"),
        ),
        ["0"],
      );
    }),
  );

  it.effect(
    "[Q-14] a refused post shows the count it posted, a post that is no count shows none, and finished modes write no hidden input",
    () =>
      Effect.gen(function* showsPost() {
        const accepted = yield* acceptedFixture("media.xml");
        const messages = [{ response, text: "Play the media at least once." }];

        assert.deepStrictEqual(
          hiddenValuesOf(
            yield* htmlOf(accepted, {
              messages,
              posted: { [response]: ["007"] },
              values: { [response]: countValue(1n) },
            }),
          ),
          ["7"],
        );
        assert.deepStrictEqual(
          hiddenValuesOf(
            yield* htmlOf(accepted, {
              messages,
              posted: { [response]: ["many"] },
              values: { [response]: countValue(1n) },
            }),
          ),
          [],
        );

        const refused = yield* htmlOf(accepted, {
          messages,
          values: { [response]: countValue(1n) },
        });
        const [root] = partsOf(refused);

        assert.isDefined(root?.attrs["aria-describedby"]);

        for (const mode of ["review", "solution"] as const) {
          const html = yield* htmlOf(accepted, { mode, values: { [response]: countValue(1n) } });

          assert.deepStrictEqual(partsOf(html, "hidden"), [], mode);
          assert.strictEqual(attributeOf(partsOf(html)[0] ?? rootOf(html), "data-mode"), mode);
        }

        const finished = yield* htmlOf(accepted, {
          disabled: true,
          values: { [response]: countValue(1n) },
        });

        assert.deepStrictEqual(partsOf(finished, "hidden"), []);
        assert.isTrue(carries(partsOf(finished)[0] ?? rootOf(finished), "data-disabled"));
      }),
  );

  it.effect(
    "[Q-14] a Root is the group its Prompt names, else the author's aria-label, else unnamed",
    () =>
      Effect.gen(function* namesRoot() {
        const accepted = yield* acceptedFixture("media.xml");
        const html = yield* htmlOf(accepted);
        const [root] = partsOf(html);
        const [prompt] = partsOf(html, "prompt");
        const tree = rootOf(html);

        assert.isDefined(root);
        assert.isDefined(prompt);
        assert.strictEqual(attributeOf(root ?? tree, "role"), "group");
        assert.strictEqual(
          attributeOf(root ?? tree, "aria-labelledby"),
          attributeOf(prompt ?? tree, "id"),
        );
        assert.strictEqual(
          nameOf(root ?? tree, tree),
          "Listen to the recording of a dawn chorus. You may play it twice.",
        );

        const base = yield* fixtureText("media.xml");
        const unprompted = base.replace(/<qti-prompt>[\S\s]*?<\/qti-prompt>\s*/u, "");
        const [unnamed] = partsOf(yield* htmlOf(yield* accept("media-plain.xml", unprompted)));

        assert.isDefined(unnamed);
        for (const attribute of ["aria-label", "aria-labelledby", "role"]) {
          assert.isUndefined(
            unnamed === undefined ? "" : attributeOf(unnamed, attribute),
            attribute,
          );
        }

        const named = yield* accept(
          "media-named.xml",
          edited(
            unprompted,
            'max-plays="2"',
            'max-plays="2" aria-label="Dawn chorus recording." class="wide"',
          ),
        );
        const namedTree = rootOf(yield* htmlOf(named));
        const [group] = partsOf(yield* htmlOf(named));

        assert.isDefined(group);
        assert.strictEqual(attributeOf(group ?? namedTree, "role"), "group");
        assert.strictEqual(attributeOf(group ?? namedTree, "aria-label"), "Dawn chorus recording.");
        assert.strictEqual(attributeOf(group ?? namedTree, "class"), "wide");
        assert.deepStrictEqual(checkTree(namedTree, { baseLevel: 2 }), []);
      }),
  );

  it.effect("[Q-14] the part rows hold every attribute the render writes beyond the state", () =>
    Effect.gen(function* holdsMerged() {
      const accepted = yield* acceptedFixture("media.xml");
      const html = yield* htmlOf(accepted, {
        messages: [{ response, text: "Play the media at least once." }],
        values: { [response]: countValue(1n) },
      });
      const state = new Set(["data-disabled", "data-mode", "data-slot"]);

      for (const [part, spec] of Object.entries(mediaModule.parts)) {
        const written = new Set(
          partsOf(html, part === "root" ? "" : part).flatMap((element) =>
            Object.keys(element.attrs).filter((attribute) => !state.has(attribute)),
          ),
        );

        for (const attribute of written) {
          assert.include(spec.merged, attribute, part);
        }
      }

      assert.sameMembers(Object.keys(mediaModule.parts), ["hidden", "media", "prompt", "root"]);
    }),
  );

  it.effect(
    "[Q-14] regions list the Prompt then the media element, and mapRegions replaces each content in place",
    () =>
      Effect.gen(function* mapsRegions() {
        const accepted = yield* acceptedFixture("media.xml");
        const node =
          accepted.item.body.find((found) => found.kind === "media") ??
          assert.fail("media.xml holds no Media");
        const regions = regionsOf(node);

        assert.deepStrictEqual(
          regions.map((region) => region.part),
          ["prompt", "content"],
        );
        assert.deepStrictEqual(
          regions.map((region) => region.nodes.some((content) => content.kind === "element")),
          [false, true],
        );

        const replaced = mapRegions(node, (region): readonly BodyNode[] => [
          { kind: "text", text: region.part },
        ]);

        assert.deepStrictEqual(
          regionsOf(replaced).map((region) =>
            region.nodes.map((content) => (content.kind === "text" ? content.text : "")),
          ),
          [["prompt"], ["content"]],
        );

        const bare = yield* accept(
          "media-bare.xml",
          (yield* fixtureText("media.xml")).replace(/<qti-prompt>[\S\s]*?<\/qti-prompt>\s*/u, ""),
        );
        const bareNode =
          bare.item.body.find((found) => found.kind === "media") ??
          assert.fail("media-bare.xml holds no Media");

        assert.deepStrictEqual(
          regionsOf(bareNode).map((region) => region.part),
          ["content"],
        );
      }),
  );

  it.effect("[Q-14] sequence is none, and restore and solution show the value itself", () =>
    Effect.gen(function* passesThrough() {
      const accepted = yield* acceptedFixture("media.xml");
      const node =
        accepted.item.body.find((found) => found.kind === "media") ??
        assert.fail("media.xml holds no Media");
      const value = countValue(1n);

      assert.deepStrictEqual(mediaModule.sequence(node, Option.some("s"), "i1"), Option.none());
      assert.strictEqual(mediaModule.restore(node, value), value);
      assert.strictEqual(mediaModule.solution(node, value), value);
      assert.strictEqual(mediaModule.controls(node), 0);
      assert.deepStrictEqual(mediaModule.nullValue(node), {
        baseType: "integer",
        cardinality: "single",
        values: [],
      });
      assert.deepStrictEqual(solution(accepted), {
        [response]: { baseType: "integer", cardinality: "single", values: [] },
      });

      const recorded = yield* Effect.fromResult(score(accepted, { [response]: value }));
      const restored = yield* Effect.fromResult(restore(accepted, recorded));

      assert.deepStrictEqual(restored.values, { [response]: value });
      assert.isTrue(
        Option.isSome(
          Result.getSuccess(Result.flatMap(score(accepted, { [response]: value }), decodeRecord)),
        ),
      );
    }),
  );

  it.effect(
    "[Q-14] redact's copy holds no correct response, and a redacted body renders the same HTML",
    () =>
      Effect.gen(function* holdsNoAnswer() {
        for (const file of fixtures) {
          const accepted = yield* acceptedFixture(file);
          const configuration = yield* configure({});
          const direct = redact(accepted, undefined, configuration);
          const encoded = yield* Effect.fromResult(encodeRedacted(direct));
          const json = JSON.stringify(encoded);

          assert.include(json, '"kind":"media"', file);
          assert.notInclude(json, "qti-correct-response", file);
          assert.notInclude(json, "qti-value", file);
          assert.notInclude(json, "SCORE", file);

          const decoded = yield* Effect.fromResult(decodeRedacted(encoded));
          const showing = { instance, values: { [response]: countValue(1n) } };
          const html = (redacted: typeof direct) =>
            Effect.map(
              Effect.fromResult(render(redacted, configuration, showing)),
              ({ html: page }) => page,
            );

          assert.strictEqual(yield* html(decoded), yield* html(direct), file);
        }
      }),
  );

  it.effect("[Q-14] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* passesCheckTree() {
      for (const file of fixtures) {
        const accepted = yield* acceptedFixture(file);

        for (const showing of [
          {},
          { values: { [response]: countValue(1n) } },
          { mode: "review" as const, values: { [response]: countValue(2n) } },
          {
            messages: [{ response, text: "Play the media at least once." }],
            posted: { [response]: ["0"] },
          },
        ]) {
          const html = yield* htmlOf(accepted, showing);
          const tree = rootOf(html);

          assert.lengthOf(partsOf(html), 1, file);
          assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), [], file);
          assert.isTrue(roundTrips(tree), file);
        }
      }
    }),
  );
});
