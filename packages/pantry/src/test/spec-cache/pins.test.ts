import { assert, describe, it } from "@effect/vitest";
import { pins } from "#pantry/test/spec-cache/pins.ts";

/**
 * Every path the table pins, sources first.
 */
const paths = [...pins.sources, ...pins.renderings].map(({ path }) => path);

/**
 * One segment of a portable path: letters, digits, `.`, `_` and `-`.
 */
const portableSegment = /^[A-Za-z0-9._-]+$/u;

/**
 * Every file the tests read from the spec cache: the five IMS specifications' HTML and text
 * renderings (the law sources' guard), XML Schema Part 2's text (the facets suite), XML 1.0's
 * Second Edition (the name tables) and the MathML 3 RelaxNG (the MathML suite).
 */
const readByTests = [
  "anyuri-specs/qti/info.html",
  "anyuri-specs/qti/info.txt",
  "qti301/info301.html",
  "qti301/info301.txt",
  "anyuri-specs/qti/bind.html",
  "anyuri-specs/qti/bind.txt",
  "qti-md-bind/index.html",
  "qti-md-bind/index.txt",
  "pm-ud/ud-bind.html",
  "pm-ud/ud-bind.txt",
  "anyuri-specs/xsd10-2.txt",
  "xml-2e/REC-xml-20001006.html",
  "mathml3-rng/mathml3.rng",
];

describe("The spec cache's pins", () => {
  it("are relative paths of portable segments", () => {
    for (const path of paths) {
      const segments = path.split("/");

      assert.isTrue(
        segments.every(
          (segment) => portableSegment.test(segment) && segment !== "." && segment !== "..",
        ),
        path,
      );
    }
  });

  it("are lower-case hex SHA-256 digests", () => {
    for (const { sha256 } of [...pins.sources, ...pins.renderings]) {
      assert.match(sha256, /^[0-9a-f]{64}$/u);
    }
  });

  it("fetch each source from an https URL as the URL standard serializes it", () => {
    for (const { url } of pins.sources) {
      const parsed = new URL(url);

      assert.strictEqual(parsed.protocol, "https:", url);
      assert.strictEqual(parsed.href, url);
    }
  });

  it("give no two files the same path, and no two sources the same URL", () => {
    assert.strictEqual(new Set(paths).size, paths.length);
    assert.strictEqual(new Set(pins.sources.map(({ url }) => url)).size, pins.sources.length);
  });

  it("render each rendering from a fetched source", () => {
    const sources = new Set(pins.sources.map(({ path }) => path));

    for (const { from, path } of pins.renderings) {
      assert.isTrue(sources.has(from), path);
    }
  });

  it("hold every file the tests read from the cache", () => {
    assert.deepStrictEqual(
      readByTests.filter((path) => !paths.includes(path)),
      [],
    );
  });
});
