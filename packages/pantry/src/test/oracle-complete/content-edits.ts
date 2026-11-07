/**
 * The mutations of the law oracle's laws over embedded languages, content models and references
 * (§1.5, §1.6): SSML's attribute counts, lexicons and marks, a foreign element's simple content, a
 * fragment's context, the default hotspots, an href's form, a family's last slot and a namespace
 * name, each drawn to break exactly its law in the every-relation package
 * (`src/test/oracle.complete.test.ts`).
 *
 * Each edits the package text the codec reads without refusing it, at a site drawn where the base
 * holds several and with a value drawn among several the law refuses. No edit renames an id,
 * declaration or file another reference names, so no law ahead of its own breaks first.
 */
import { element, int } from "@grizzle/testing/gen";
import {
  editText,
  passageAt,
  replaceDrawn,
  replaceOnce,
  textOf,
  withText,
} from "#pantry/test/oracle-complete/mutation.ts";
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * The every-relation item.
 */
const item = "items/item.xml";

/**
 * The every-relation item that places the fragment.
 */
const templated = "items/item2.xml";

/**
 * The every-relation item's SSML document, a speak whose one mark is `start`.
 */
const speak =
  '<ssml:speak version="1.1" xml:lang="en"><ssml:mark name="start"/>Read this aloud.</ssml:speak>';

/**
 * The item's foreign element, which no type governs.
 */
const widget = '<w:widget xmlns:w="urn:example:widget">A widget.</w:widget>';

/**
 * The item's custom interaction's response, beside which a new interaction's response is declared.
 */
const widgetResponse =
  '<qti-response-declaration identifier="WIDGET" cardinality="single" base-type="string"/>';

/**
 * The item's paragraph before which a new interaction is placed.
 */
const quoted = "    <p>It says <q>read this</q> and stops.</p>";

/**
 * The item's mappings of one entry, the declarations of LEVER, REAL, PAIRS, LINKS and SPOT.
 */
const oneEntryMapping = /<qti-mapping default-value="0"><qti-map-entry [^>]*\/><\/qti-mapping>/u;

/**
 * An href's values the resolver reads no entry name from, each inside `xs:anyURI`: a backslash, a
 * percent-encoded octet that spells no UTF-8, one that decodes to `/`, and one that decodes to
 * U+0000 (reading 102).
 */
const unreadHrefs = [
  "media\\pic.png",
  "media/pic%C3.png",
  "media%2Fpic.png",
  "media/pic%00.png",
] as const;

/**
 * The item's images, in its lead division and its hotspot interaction.
 */
const image = /<img src="media\/pic\.png"/u;

/**
 * Namespace names no URI reference spells (RFC 3986 appendix A): a space, a `%` that starts no
 * percent-encoding, a space in an authority, and a second `#`.
 */
const unnamedNamespaces = ["a b", "%zz", "http://exa mple.org/", "urn:x#a#b"] as const;

/**
 * Each law's mutation, by law.
 */
export const contentEdits = {
  // AL5 attribute count (readings 41 and 43): an SSML voice or prosody with no attribute, or a
  // meta with both name and http-equiv or with neither.
  "AL5 attribute count": passageAt(item, speak, [
    speak.replace("Read this aloud.", "Read <ssml:voice>this</ssml:voice> aloud."),
    speak.replace("Read this aloud.", "Read <ssml:prosody>this</ssml:prosody> aloud."),
    speak.replace(
      '<ssml:mark name="start"/>',
      '<ssml:meta name="a" http-equiv="b" content="c"/><ssml:mark name="start"/>',
    ),
    speak.replace('<ssml:mark name="start"/>', '<ssml:meta content="c"/><ssml:mark name="start"/>'),
  ]),
  // Foreign simple content (reading 60): the foreign element given a simple type of XML Schema's
  // own and an element child.
  "Foreign simple content": {
    mutate:
      ({ entries }) =>
      (source) => {
        const type = source.draw(element(["xs:string", "xs:token", "xs:normalizedString"]));
        const child = source.draw(element(["w:b", "w:i"]));

        return editText(entries, item, (text) =>
          replaceOnce(
            text,
            widget,
            `<w:widget xmlns:w="urn:example:widget" xsi:type="${type}">A <${child}>widget</${child}>.</w:widget>`,
          ),
        );
      },
    over: "package",
  },
  // Fragment context (reading 117): a fragment placed inside a choice of an interaction and
  // outside every interaction.
  "Fragment context": {
    mutate:
      ({ entries }) =>
      (source) => {
        const [choice, words] = source.draw(
          element([
            ["ChoiceA", "Yes."],
            ["ChoiceB", "No."],
          ] as const),
        );
        const root = source.draw(element(["p", "div"]));
        const listed = editText(entries, "imsmanifest.xml", (text) =>
          replaceOnce(
            text,
            "  </resources>",
            '    <resource identifier="note-res" type="imsqti_fragment_xmlv3p0" href="items/note.xml"><file href="items/note.xml"/></resource>\n  </resources>',
          ),
        );
        const placed = editText(listed, templated, (text) =>
          replaceOnce(
            replaceOnce(
              text,
              `<qti-simple-choice identifier="${choice}">${words}</qti-simple-choice>`,
              `<qti-simple-choice identifier="${choice}">${words}<xi:include href="note.xml"/></qti-simple-choice>`,
            ),
            '<xi:include href="fragment.xml"/>',
            '<xi:include href="fragment.xml"/><xi:include href="note.xml"/>',
          ),
        );

        return withText(
          placed,
          "items/note.xml",
          `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">A note.</${root}>\n`,
        );
      },
    over: "package",
  },
  // Graphic gap match default hotspot (reading 80): a graphic gap match interaction one of whose
  // one or two associable hotspots is the default one.
  "Graphic gap match default hotspot": {
    mutate:
      ({ entries }) =>
      (source) => {
        const hotspots = source.draw(int(1, 2));
        const fallback = source.draw(int(0, hotspots - 1));
        const spots = Array.from(
          { length: hotspots },
          (_, at) =>
            `<qti-associable-hotspot identifier="A${String(at + 1)}" shape="${at === fallback ? "default" : "rect"}" coords="0,0,1,1" match-max="1"/>`,
        ).join("");

        return editText(entries, item, (text) =>
          replaceOnce(
            replaceOnce(
              text,
              widgetResponse,
              `${widgetResponse}<qti-response-declaration identifier="GAPS" cardinality="multiple" base-type="directedPair"/>`,
            ),
            quoted,
            `    <qti-graphic-gap-match-interaction response-identifier="GAPS"><img src="media/pic.png" alt="a" width="20" height="20"/><qti-gap-img identifier="G1" match-max="1"><img src="media/pic.png" alt="g"/></qti-gap-img>${spots}</qti-graphic-gap-match-interaction>\n${quoted}`,
          ),
        );
      },
    over: "package",
  },
  // Href form (reading 102): one of the item's image sources an href the resolver reads no entry
  // name from.
  "Href form": {
    mutate:
      ({ entries }) =>
      (source) => {
        const value = source.draw(element(unreadHrefs));

        return withText(
          entries,
          item,
          source.draw(replaceDrawn(textOf(entries, item), image, () => `<img src="${value}"`)),
        );
      },
    over: "package",
  },
  // N7 Last (XML Schema Part 1 §3.8): one of the item's one-entry mappings left with no entry,
  // or an empty table body before its one row's, each a family its content model does not end.
  "N7 Last": {
    mutate:
      ({ entries }) =>
      (source) => {
        if (source.draw(element(["mapping", "tbody"] as const)) === "tbody") {
          return editText(entries, item, (text) =>
            replaceOnce(text, "<table><tbody><tr>", "<table><tbody></tbody><tbody><tr>"),
          );
        }

        return withText(
          entries,
          item,
          source.draw(
            replaceDrawn(
              textOf(entries, item),
              oneEntryMapping,
              () => '<qti-mapping default-value="0"></qti-mapping>',
            ),
          ),
        );
      },
    over: "package",
  },
  // Namespace name (reading 131): an element of the item body declaring a prefix bound to a
  // namespace name no URI reference spells.
  "Namespace name": {
    mutate:
      ({ entries }) =>
      (source) => {
        const value = source.draw(element(unnamedNamespaces));

        return withText(
          entries,
          item,
          source.draw(
            replaceDrawn(
              textOf(entries, item),
              /<(?<tag>div|span|p|table) /u,
              (match) => `<${match.groups?.["tag"] ?? "p"} xmlns:bad="${value}" `,
            ),
          ),
        );
      },
    over: "package",
  },
  // SSML lexicon reference (reading 3): a lookup naming an id of the item that no lexicon has.
  "SSML lexicon reference": passageAt(item, "Read this aloud.</ssml:speak>", [
    'Read <ssml:lookup ref="caption">this</ssml:lookup> aloud.</ssml:speak>',
    'Read <ssml:lookup ref="lead">this</ssml:lookup> aloud.</ssml:speak>',
    'Read <ssml:lookup ref="row-head">this</ssml:lookup> aloud.</ssml:speak>',
  ]),
  // SSML trim mark (reading 3): the speak's startmark or endmark naming no mark of it.
  "SSML trim mark": {
    mutate:
      ({ entries }) =>
      (source) => {
        const attribute = source.draw(element(["startmark", "endmark"]));
        const value = source.draw(element(["nowhere", "Start", "start2"]));

        return editText(entries, item, (text) =>
          replaceOnce(
            text,
            speak,
            speak.replace("<ssml:speak ", `<ssml:speak ${attribute}="${value}" `),
          ),
        );
      },
    over: "package",
  },
  // default hotspot last slot (reading 80): a default hotspot choice before one of the hotspot
  // interaction's choices.
  "default hotspot last slot": {
    mutate:
      ({ entries }) =>
      (source) =>
        withText(
          entries,
          item,
          source.draw(
            replaceDrawn(
              textOf(entries, item),
              /<qti-hotspot-choice identifier="S\d"[^>]*\/>/u,
              (match) =>
                `<qti-hotspot-choice identifier="S0" shape="default" coords="0,0,1,1"/>${match[0]}`,
            ),
          ),
        ),
    over: "package",
  },
} as const satisfies Readonly<Record<string, Mutation>>;
