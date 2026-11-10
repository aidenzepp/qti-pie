/**
 * The stated limit a package falls under (`#pantry/test/gen/genetic/judge.ts` `limitOf`), here for
 * its first, the record file whose root is a `cp:manifest`: the oracle raises "RootOfType" at a
 * document whose root is a `cp:manifest` and which the package manifest lists as
 * `resourcemetadata/xml`. The manifest names that document by its `href`, and an href is read in
 * normal form (RFC 3986 §6.2.2, `normalHref` in `judge.ts`), as the limit's other tests read one:
 * `%63hoice.xml` names `choice.xml` (issue #68).
 *
 * The cases pass a breach to `limitOf` as the oracle keys it, so they need neither side's reader.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf, manifestPath } from "#pantry/test/gen/genetic/genome.ts";
import type { Limit } from "#pantry/test/gen/genetic/judge.ts";
import { limitOf } from "#pantry/test/gen/genetic/judge.ts";
import type { Breach } from "#pantry/test/oracle.ts";

/**
 * The text every XML file of the cases opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n';

/**
 * The record file's path, which the package manifest lists.
 */
const recordPath = "choice.xml";

/**
 * The limit of a record file whose root is a `cp:manifest`.
 */
const recordFileLimit: Limit = "a record file whose root is a cp:manifest";

/**
 * The limit of an `xml:base` on a `cp:resource`, which the genomes with one fall to where the
 * record file's limit does not hold.
 */
const xmlBaseLimit: Limit = "xml:base on a cp:resource";

/**
 * The resource that carries the `xml:base` of the issue's package.
 */
const xmlBaseResource = '<resource xml:base="sub/"/>';

/**
 * Write a package manifest that lists a record file.
 *
 * @param href - The `href` of the resource that lists it, as written.
 * @param type - The resource's type.
 * @param before - The resources written before it.
 * @returns The manifest's text.
 */
const manifestOf = (href: string, type: string, before: string): string =>
  `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources>${before}<resource type="${type}" href="${href}"/></resources></manifest>`;

/**
 * The record file: a document rooted at a `cp:manifest`, holding one item resource whose metadata
 * has a LOM `general` element.
 */
const recordFile = `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="M"><resources><resource type="imsqti_item_xmlv3p0" href="${recordPath}"><metadata><imsmd:lom><imsmd:general><imsmd:identifier><imsmd:entry/></imsmd:identifier></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>`;

/**
 * Read a package of the manifest and the record file as a genome.
 *
 * @param manifest - The manifest's text.
 * @returns The genome.
 */
const genomeOfManifest = (manifest: string) => {
  const encoder = new TextEncoder();
  const entries: PackageEntries = new Map([
    [manifestPath, encoder.encode(manifest)],
    [recordPath, encoder.encode(recordFile)],
  ]);

  return genomeOf(entries);
};

/**
 * The breach the oracle raises at the record file: "RootOfType", at the document the manifest lists
 * under a type that pairs with no `cp:manifest` root.
 *
 * @param type - The type the manifest lists the record file under.
 * @returns The breach.
 */
const rootOfType = (type: string): Breach => ({
  document: manifestPath,
  keys: { path: recordPath, rootKind: "cp:manifest", type },
  law: "RootOfType",
});

describe("limitOf, a record file whose root is a cp:manifest", () => {
  it.effect("[68-1] names the record file a percent-encoded href lists", () =>
    Effect.gen(function* percentEncoded() {
      const genome = yield* genomeOfManifest(
        manifestOf("%63hoice.xml", "resourcemetadata/xml", xmlBaseResource),
      );

      assert.deepStrictEqual(
        limitOf([rootOfType("resourcemetadata/xml")], genome),
        Option.some(recordFileLimit),
      );
    }),
  );

  it.effect("[68-2] names the record file a plain href lists", () =>
    Effect.gen(function* plain() {
      const genome = yield* genomeOfManifest(
        manifestOf("choice.xml", "resourcemetadata/xml", xmlBaseResource),
      );

      assert.deepStrictEqual(
        limitOf([rootOfType("resourcemetadata/xml")], genome),
        Option.some(recordFileLimit),
      );
    }),
  );

  it.effect("[68-3] does not name a record file listed under another type", () =>
    Effect.gen(function* listedAsItem() {
      for (const href of ["%63hoice.xml", "choice.xml"]) {
        const genome = yield* genomeOfManifest(
          manifestOf(href, "imsqti_item_xmlv3p0", xmlBaseResource),
        );
        const limit = limitOf([rootOfType("imsqti_item_xmlv3p0")], genome);

        assert.notDeepEqual(limit, Option.some(recordFileLimit), href);
        assert.deepStrictEqual(limit, Option.some(xmlBaseLimit), href);
      }
    }),
  );

  it.effect("[68-4] names the record file a percent-encoded href lists, with no xml:base", () =>
    Effect.gen(function* percentEncodedAlone() {
      const genome = yield* genomeOfManifest(
        manifestOf("%63hoice.xml", "resourcemetadata/xml", ""),
      );

      assert.deepStrictEqual(
        limitOf([rootOfType("resourcemetadata/xml")], genome),
        Option.some(recordFileLimit),
      );
    }),
  );
});
