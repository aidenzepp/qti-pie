/**
 * The addresses a QTI player fetches, declared once: the attributes and the texts whose value a
 * player loads as an image, a sound, a video, a stylesheet, a glyph, a module or its configuration
 * when it renders an item, and the address lists a player resolves. A package-media install holds
 * each to a file of the package whose extension its policy lists (`#pantry/qti/media.ts`), and the
 * laws it states derive from these rows alone.
 *
 * Each row names an element kind, whose declared type a governing `xsi:type` names too: the law
 * reads an attribute under every governor of that type (`#pantry/qti/media.ts` `governorsOf`), so
 * an element that takes the type through `xsi:type` fetches what the kind's element does.
 *
 * A link (`a`'s `href`, MathML's `href`), a reference inside the package (an item, stimulus or
 * section ref's `href`, `xi:include`'s, the manifest's), response processing's `template` and
 * `template-location`, and every identifier written as a URI (`definitionURL`, `cite`, `longdesc`,
 * `custom-interaction-type-identifier`) are no fetch the player makes to render, so none is a row.
 *
 * @see {@link https://html.spec.whatwg.org/multipage/embedded-content.html | HTML Standard, embedded content}
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_InteractionModule | QTI 3.0 information model, InteractionModule}
 */
import type { Kind, Name } from "#pantry/grammar/compose.ts";

/**
 * One attribute a player fetches: its element's kind and its name. A `srcset` holds image
 * candidates, each a URL a player fetches; the schema reads one candidate alone ("Href form"), so
 * its value is one address, as every other row's is.
 */
export interface FetchedAttribute {
  readonly kind: Kind;
  readonly name: Name;
}

/**
 * The attributes a player fetches.
 *
 * - `img`'s `src`, and a `source`'s `src` and `srcset`, in a `picture`, an `audio` or a `video`;
 * - `audio`'s, `video`'s and `track`'s `src`, and `video`'s `poster`;
 * - `object`'s `data`;
 * - MathML's `mglyph` `src`, `math` `altimg`, and `annotation`, `annotation-xml` and `share` `src`,
 *   an annotation's or a shared subtree's address a renderer may load;
 * - SSML's `audio` `src`, and `lexicon` `uri`, the pronunciation lexicon a synthesizer loads;
 * - `qti-stylesheet`'s `href`;
 * - A portable custom interaction's modules: each `qti-interaction-module`'s `primary-path` and
 *   `fallback-path`, and `qti-interaction-modules`'s `primary-configuration` and
 *   `secondary-configuration`, every code and configuration path the grammar admits.
 */
export const fetchedAttributes = [
  { kind: "img", name: "src" },
  { kind: "source", name: "src" },
  { kind: "source", name: "srcset" },
  { kind: "audio", name: "src" },
  { kind: "video", name: "src" },
  { kind: "video", name: "poster" },
  { kind: "track", name: "src" },
  { kind: "object", name: "data" },
  { kind: "m:mglyph", name: "src" },
  { kind: "m:math", name: "altimg" },
  { kind: "m:annotation", name: "src" },
  { kind: "m:annotation-xml", name: "src" },
  { kind: "m:share", name: "src" },
  { kind: "ssml:audio", name: "src" },
  { kind: "ssml:lexicon", name: "uri" },
  { kind: "qti-stylesheet", name: "href" },
  { kind: "qti-interaction-module", name: "primary-path" },
  { kind: "qti-interaction-module", name: "fallback-path" },
  { kind: "qti-interaction-modules", name: "primary-configuration" },
  { kind: "qti-interaction-modules", name: "secondary-configuration" },
] as const satisfies readonly FetchedAttribute[];

/**
 * The element kinds whose text a player fetches, each one address: `qti-file-href`, in both the
 * kinds the grammar reads it as, a calculator's or a digital material's (`qti-file-href`) and a
 * catalog card's (`qti-file-href.card`).
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_FileHref | QTI 3.0 information model, FileHref}
 */
export const fetchedTexts = [
  "qti-file-href",
  "qti-file-href.card",
] as const satisfies readonly Kind[];

/**
 * The attributes whose value is a list of addresses, one per whitespace-separated token: XML Schema
 * instance's `xsi:schemaLocation`, pairs of a namespace name and a schema document's location, each
 * an `xs:anyURI` (XML Schema 1.0 Part 1, §2.6.3). A list domain does not name its item type, so no
 * other reading derives it.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-1/#xsi_schemaLocation | XML Schema 1.0 Part 1, §2.6.3}
 */
export const addressLists = ["xsi:schemaLocation"] as const satisfies readonly Name[];
