/**
 * The pinned files of the spec cache, `~/.cache/gr8des/`: every specification file a test reads
 * from it, each fetched source at the URL it is published at and each text rendering derived from
 * one of them, with the SHA-256 each must hash to. It is the one place a pin is written: the tests
 * that read a cached file take its path and pin from here, and so does anything that fills the
 * cache.
 *
 * The five IMS specifications come from {@link specDocuments}, whose entries already pin both
 * renderings; nothing about them is restated here.
 *
 * @see {@link https://github.com/aidenzepp/qti-pie/issues/98 | qti-pie#98, a script that fills the spec caches}
 */
import { Config } from "effect";
import { specDocuments } from "#pantry/test/spec-sections.ts";

/**
 * The spec cache, `${HOME}/.cache/gr8des`, which every path in {@link pins} is relative to.
 */
export const cacheDirectory = Config.NonEmptyString("HOME").pipe(
  Config.map((home) => `${home}/.cache/gr8des`),
);

/**
 * A file the cache holds as it is published.
 */
export interface FetchedSource {
  /**
   * Where the file sits, relative to {@link cacheDirectory}.
   */
  readonly path: string;
  /**
   * The SHA-256 of the file's bytes, lower-case hex.
   */
  readonly sha256: string;
  /**
   * The URL the file is published at.
   */
  readonly url: string;
}

/**
 * A file the cache holds as a text rendering of a fetched source.
 */
export interface Rendering {
  /**
   * The {@link FetchedSource.path} of the source it is rendered from.
   */
  readonly from: string;
  /**
   * Where the file sits, relative to {@link cacheDirectory}.
   */
  readonly path: string;
  /**
   * The SHA-256 of the file's bytes, lower-case hex.
   */
  readonly sha256: string;
}

/**
 * XML 1.0 (Second Edition), whose Appendix B the name tables are read from. Pinned as fetched on
 * 2026-11-05 and again on 2026-11-10.
 */
export const xmlSecondEdition: FetchedSource = {
  path: "xml-2e/REC-xml-20001006.html",
  sha256: "e5350fb462ada6babfc43d72263a955bddf78605180457c6e006886f60a89b67",
  url: "https://www.w3.org/TR/2000/REC-xml-20001006",
};

/**
 * XML Schema 1.0 Part 2, Second Edition, as published. Pinned as fetched on 2026-11-10.
 */
export const xsdPart2Html: FetchedSource = {
  path: "anyuri-specs/xsd10-2.html",
  sha256: "980de872aa2c50013d5202176eb85eef3f183a7df635fdcb6b4aa34c1c12eb72",
  url: "https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/",
};

/**
 * The text rendering of {@link xsdPart2Html}, whose Appendix A the built-in datatypes' facets are
 * read from, pinned as it was read when that suite was written.
 */
export const xsdPart2Text: Rendering = {
  from: xsdPart2Html.path,
  path: "anyuri-specs/xsd10-2.txt",
  sha256: "6f6119251e62bb162e228e5f8c57c0ca3d7dc0449b9f58d66c451d3b1dbfd66b",
};

/**
 * The directory of the MathML 3 RelaxNG in XML syntax, relative to {@link cacheDirectory}.
 */
export const relaxNgPath = "mathml3-rng";

/**
 * Where the MathML 3 RelaxNG is published, beside its compact syntax.
 */
const relaxNgUrl = "https://www.w3.org/Math/RelaxNG/mathml3";

/**
 * The MathML 3 RelaxNG: `mathml3.rng` and the four files it includes, directly or through the
 * content file. Pinned as fetched on 2026-11-10.
 */
const relaxNg: readonly FetchedSource[] = Object.entries({
  "mathml3-common.rng": "f50511995a6035177a6a1d368fffaf621f4124e31b78871d96464bc6c1a6ff5a",
  "mathml3-content.rng": "e8e57dd905da190967fafcef83bdcd57da0f3abefe9b55db8bb117c3c7c77b3b",
  "mathml3-presentation.rng": "fa6f07d60eca2ca82f3b1beba4ccdc13875766d963383ec6b070e113459bf626",
  "mathml3-strict-content.rng": "15685143a185d8ad1ca0025b2b1b5ea4df76afd5260becaa6f84a9398e0cef95",
  "mathml3.rng": "333ebedf134a0f4579632b52d0555cbb66e62f0e23b7b5a6874ac42f2daa3ee4",
}).map(([file, sha256]) => ({
  path: `${relaxNgPath}/${file}`,
  sha256,
  url: `${relaxNgUrl}/${file}`,
}));

/**
 * Every pinned file of the spec cache, each kind in its own list.
 */
export interface SpecPins {
  /**
   * The renderings derived from {@link SpecPins.sources}.
   */
  readonly renderings: readonly Rendering[];
  /**
   * The sources fetched as published.
   */
  readonly sources: readonly FetchedSource[];
}

/**
 * Every pinned file of the spec cache: the sources fetched as published, and the renderings derived
 * from them.
 */
export const pins: SpecPins = {
  renderings: [
    ...specDocuments.map(({ html, text, textSha256 }) => ({
      from: html,
      path: text,
      sha256: textSha256,
    })),
    xsdPart2Text,
  ],
  sources: [
    ...specDocuments.map(({ html, htmlSha256, url }) => ({ path: html, sha256: htmlSha256, url })),
    xsdPart2Html,
    xmlSecondEdition,
    ...relaxNg,
  ],
};
