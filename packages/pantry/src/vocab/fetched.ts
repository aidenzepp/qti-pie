/**
 * The addresses a QTI player fetches, declared once: the attributes and the texts whose value a
 * player loads as an image, a sound, a video, a stylesheet, a glyph, a module or its configuration
 * when it renders an item, and the address lists a player resolves. The single-CDN level holds each
 * to its origin (`#pantry/levels/cdn-origin.ts`), and the rules it states derive from these rows
 * alone.
 *
 * Each row names an element kind, whose declared type a governing `xsi:type` names too: a rule
 * reads an attribute under every governor of that type, so an element that takes the type through
 * `xsi:type` fetches what the kind's element does.
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
 * How a player reads the address a value holds: `address`, the value one URL, which the player
 * resolves after the URL Standard strips its leading whitespace; `candidates`, an HTML `srcset`,
 * each image candidate string's URL one address.
 *
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser}
 * @see {@link https://html.spec.whatwg.org/multipage/images.html#parsing-a-srcset-attribute | HTML Standard, parsing a srcset attribute}
 */
export type AddressForm = "address" | "candidates";

/**
 * One attribute a player fetches: its element's kind, its name, and how its value holds addresses.
 */
export interface FetchedAttribute {
  readonly form: AddressForm;
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
  { form: "address", kind: "img", name: "src" },
  { form: "address", kind: "source", name: "src" },
  { form: "candidates", kind: "source", name: "srcset" },
  { form: "address", kind: "audio", name: "src" },
  { form: "address", kind: "video", name: "src" },
  { form: "address", kind: "video", name: "poster" },
  { form: "address", kind: "track", name: "src" },
  { form: "address", kind: "object", name: "data" },
  { form: "address", kind: "m:mglyph", name: "src" },
  { form: "address", kind: "m:math", name: "altimg" },
  { form: "address", kind: "m:annotation", name: "src" },
  { form: "address", kind: "m:annotation-xml", name: "src" },
  { form: "address", kind: "m:share", name: "src" },
  { form: "address", kind: "ssml:audio", name: "src" },
  { form: "address", kind: "ssml:lexicon", name: "uri" },
  { form: "address", kind: "qti-stylesheet", name: "href" },
  { form: "address", kind: "qti-interaction-module", name: "primary-path" },
  { form: "address", kind: "qti-interaction-module", name: "fallback-path" },
  { form: "address", kind: "qti-interaction-modules", name: "primary-configuration" },
  { form: "address", kind: "qti-interaction-modules", name: "secondary-configuration" },
] as const satisfies readonly FetchedAttribute[];

/**
 * The element kinds whose text a player fetches, each one address: `qti-file-href`, a catalog
 * card's file, in both the forms the grammar reads it in.
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
