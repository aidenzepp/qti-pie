import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { readPnp } from "#plate/index.ts";
import type { PnpSupports } from "#plate/index.ts";

/**
 * The AfA PNP 3.0 schema's namespace, which every profile built here is in.
 */
const pnpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0pnp_v1p0";

/**
 * Read a fixture of `fixtures/m5` as bytes.
 *
 * @param name The file's name under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m5/${name}`, import.meta.url)));

/**
 * Encode a document's text as bytes.
 *
 * @param xml The document.
 * @returns Its UTF-8 bytes.
 */
const bytes = (xml: string): Uint8Array => new TextEncoder().encode(xml);

/**
 * Wrap profile children in an `access-for-all-pnp` root in the schema's namespace.
 *
 * @param children The profile's children, as XML text.
 * @returns The document's bytes.
 */
const profile = (children: string): Uint8Array =>
  bytes(`<access-for-all-pnp xmlns="${pnpNamespace}">${children}</access-for-all-pnp>`);

/**
 * Read a document, failing the test when the reader refuses it.
 *
 * @param document The document's bytes.
 * @returns The supports read.
 */
const read = (document: Uint8Array): Effect.Effect<PnpSupports> =>
  readPnp(document).pipe(Effect.orDie);

describe("readPnp's sets", () => {
  it.effect("[A-34] a prohibited tool is in prohibited and in no other field", () =>
    Effect.gen(function* prohibitedTool() {
      const pnp = yield* read(fixture("pnp-sets.xml"));
      const tool = "spell-checker-on-screen";

      assert.isTrue(pnp.prohibited.has(tool));
      assert.isFalse(pnp.tools.has(tool));
      assert.isFalse(pnp.features.has(tool));
      assert.isFalse(pnp.atStart.has(tool));
      assert.isFalse(pnp.optional.has(tool));
      assert.deepStrictEqual(pnp.tools, new Set(), "no tool reaches the supports");
    }),
  );

  it.effect("[A-34] a prohibited catalog support is held back from catalog", () =>
    Effect.gen(function* prohibitedSupport() {
      const allowed = yield* read(profile("<glossary-on-screen/><captions/>"));
      const prohibited = yield* read(
        profile(
          "<glossary-on-screen/><captions/><prohibit-set><glossary-on-screen/></prohibit-set>",
        ),
      );

      assert.deepStrictEqual(
        allowed.catalog,
        new Set(["glossary-on-screen"]),
        "without the prohibit-set the glossary is a catalog support",
      );
      assert.deepStrictEqual(prohibited.prohibited, new Set(["glossary-on-screen"]));
      assert.deepStrictEqual(prohibited.catalog, new Set());
      assert.deepStrictEqual(prohibited.features, new Set(["captions"]));
    }),
  );

  it.effect("[A-47] an at-start catalog support is active and reaches catalog", () =>
    Effect.gen(function* atStartSupport() {
      const pnp = yield* read(fixture("pnp-sets.xml"));

      assert.deepStrictEqual(pnp.atStart, new Set(["captions", "glossary-on-screen"]));
      assert.isTrue(pnp.features.has("glossary-on-screen"));
      assert.isTrue(pnp.features.has("captions"));
      assert.deepStrictEqual(
        pnp.catalog,
        new Set(["glossary-on-screen"]),
        "the glossary is a catalog support, and captions are not",
      );
    }),
  );

  it.effect("[A-46] an as-option feature is listed in optional and turned on nowhere", () =>
    Effect.gen(function* asOptionFeature() {
      const pnp = yield* read(fixture("pnp-sets.xml"));

      assert.deepStrictEqual(pnp.optional, new Set(["transcript"]));
      assert.isFalse(pnp.catalog.has("transcript"));
      assert.isFalse(pnp.features.has("transcript"));
      assert.isFalse(pnp.atStart.has("transcript"));
      assert.isFalse(pnp.prohibited.has("transcript"));
    }),
  );
});
