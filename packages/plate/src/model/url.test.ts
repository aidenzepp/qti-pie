import { assert, describe, it } from "@effect/vitest";
import { Option, Result } from "effect";
import {
  addressUrl,
  assetPaths,
  assetReferenceOf,
  classifyUrl,
  formatUrl,
  invalidUrlFeature,
  isPackagePath,
  outsidePackageFeature,
  schemeFeature,
  urlAttributes,
  urlContextOf,
} from "#plate/model/url.ts";
import { assetsOf } from "#plate/test/fixtures.ts";
import type {
  ClassifiedUrl,
  DroppedUrl,
  PackageUrl,
  RemoteUrl,
  SrcsetCandidate,
  UrlContext,
} from "#plate/model/url.ts";

/**
 * The contexts that hold one URL, as opposed to a `srcset` list.
 */
const singleContexts = ["link", "resource", "embed"] as const;

/**
 * Construct a kept package-relative URL for a test.
 *
 * @param path Its written form below the package directory.
 * @returns The classification.
 */
const inPackage = (path: string): PackageUrl => ({ kind: "package", path });

/**
 * Construct a kept remote URL for a test.
 *
 * @param href Its parsed href.
 * @returns The classification.
 */
const remote = (href: string): RemoteUrl => ({ href, kind: "remote" });

/**
 * Construct a dropped URL for a test.
 *
 * @param feature The feature key it is dropped with.
 * @returns The classification.
 */
const dropped = (feature: string): DroppedUrl => ({ feature, kind: "dropped" });

/**
 * Construct a kept `srcset` for a test.
 *
 * @param candidates Its image candidates, in order.
 * @returns The classification.
 */
const srcset = (...candidates: readonly SrcsetCandidate[]): ClassifiedUrl => ({
  candidates,
  kind: "srcset",
});

/**
 * Construct one `srcset` image candidate for a test.
 *
 * @param url The candidate's kept URL.
 * @param descriptors Its descriptors, in order.
 * @returns The candidate.
 */
const candidate = (url: PackageUrl | RemoteUrl, ...descriptors: readonly string[]) => ({
  descriptors,
  url,
});

describe("urlAttributes", () => {
  it("lists the XSD's body URL attributes, srcset and longdesc included", () => {
    const rows = urlAttributes
      .map((row) => `${row.element}@${row.attribute} ${row.context}`)
      .toSorted();
    assert.deepStrictEqual(rows, [
      "a@href link",
      "audio@src resource",
      "blockquote@cite link",
      "img@longdesc link",
      "img@src resource",
      "object@data embed",
      "q@cite link",
      "source@src resource",
      "source@srcset srcset",
      "track@src resource",
      "video@poster resource",
      "video@src resource",
    ]);
  });

  it("names each attribute's context, and none for param@value or an undeclared pair", () => {
    assert.deepStrictEqual(urlContextOf("source", "srcset"), Option.some<UrlContext>("srcset"));
    assert.deepStrictEqual(urlContextOf("img", "longdesc"), Option.some<UrlContext>("link"));
    assert.deepStrictEqual(urlContextOf("object", "data"), Option.some<UrlContext>("embed"));
    assert.deepStrictEqual(urlContextOf("param", "value"), Option.none());
    assert.deepStrictEqual(urlContextOf("a", "src"), Option.none());
  });
});

describe("classifyUrl", () => {
  for (const value of [
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    // oxlint-disable-next-line eslint/no-script-url -- the value is test input the classifier must drop, never a URL this code navigates to.
    "JAVASCRIPT:alert(1)",
    "\u0001javascript:alert(1)",
  ]) {
    it(`drops ${JSON.stringify(value)} as url-scheme:javascript in every context`, () => {
      for (const context of singleContexts) {
        assert.deepStrictEqual(
          classifyUrl(context, value),
          dropped("url-scheme:javascript"),
          context,
        );
      }
    });
  }

  for (const value of ["//host/x", "\\\\host\\x", "/x", "../x", "images/../../x"]) {
    it(`drops ${JSON.stringify(value)} as url-outside-package in every context`, () => {
      for (const context of singleContexts) {
        assert.deepStrictEqual(
          classifyUrl(context, value),
          dropped(outsidePackageFeature),
          context,
        );
      }
    });
  }

  it("reads https:evil.com/x as the package path evil.com/x, never the remote https://evil.com/x", () => {
    for (const context of singleContexts) {
      assert.deepStrictEqual(
        classifyUrl(context, "https:evil.com/x"),
        inPackage("evil.com/x"),
        context,
      );
    }
  });

  it("keeps a package path in its parsed form, with its query and fragment", () => {
    assert.deepStrictEqual(
      classifyUrl("resource", "images/a b.png"),
      inPackage("images/a%20b.png"),
    );
    assert.deepStrictEqual(
      classifyUrl("link", "  shared/page.html?x=1#part "),
      inPackage("shared/page.html?x=1#part"),
    );
    assert.deepStrictEqual(
      classifyUrl("resource", "images/./a/../b.png"),
      inPackage("images/b.png"),
    );
  });

  it("keeps http and https as their parsed href in the link and resource contexts", () => {
    for (const context of ["link", "resource"] as const) {
      assert.deepStrictEqual(
        classifyUrl(context, "http://example.com/a b.png"),
        remote("http://example.com/a%20b.png"),
        context,
      );
      assert.deepStrictEqual(
        classifyUrl(context, "HTTPS://Example.COM/x"),
        remote("https://example.com/x"),
        context,
      );
      assert.deepStrictEqual(
        classifyUrl(context, "http:evil.com/x"),
        remote("http://evil.com/x"),
        context,
      );
    }
  });

  it("drops mailto:, tel:, data: and every other scheme, by its scheme", () => {
    const cases = [
      ["mailto:a@example.com", "mailto"],
      ["tel:+15550100", "tel"],
      ["data:image/png;base64,AA==", "data"],
      ["vbscript:x", "vbscript"],
      ["blob:https://example.com/x", "blob"],
      ["file:///etc/passwd", "file"],
    ] as const;
    for (const [value, scheme] of cases) {
      for (const context of singleContexts) {
        assert.deepStrictEqual(
          classifyUrl(context, value),
          dropped(schemeFeature(scheme)),
          `${value} in ${context}`,
        );
      }
    }
    assert.strictEqual(schemeFeature("mailto"), "url-scheme:mailto");
  });

  it("keeps #q1 as a same-document fragment in the link context", () => {
    assert.deepStrictEqual(classifyUrl("link", "#q1"), { fragment: "q1", kind: "fragment" });
    assert.deepStrictEqual(classifyUrl("link", " #q1"), { fragment: "q1", kind: "fragment" });
    assert.deepStrictEqual(classifyUrl("link", "#"), { fragment: "", kind: "fragment" });
  });

  it("reads a fragment outside the link context, and ./#q1 in it, as a package path", () => {
    assert.deepStrictEqual(classifyUrl("resource", "#q1"), inPackage("./#q1"));
    assert.deepStrictEqual(classifyUrl("link", "./#q1"), inPackage("./#q1"));
  });

  it("writes a package path that would read as a scheme or a host with a leading ./", () => {
    assert.deepStrictEqual(classifyUrl("link", "./javascript:x"), inPackage("./javascript:x"));
    assert.deepStrictEqual(
      classifyUrl("link", "./https:evil.com/x"),
      inPackage("./https:evil.com/x"),
    );
    assert.deepStrictEqual(classifyUrl("resource", ".///evil.com/x"), inPackage(".///evil.com/x"));
  });

  it("keeps a package object@data and drops a remote one as url-outside-package", () => {
    assert.deepStrictEqual(
      classifyUrl("embed", "shared/orkney.html"),
      inPackage("shared/orkney.html"),
    );
    assert.deepStrictEqual(
      classifyUrl("embed", "images/rectangle.svg"),
      inPackage("images/rectangle.svg"),
    );
    assert.deepStrictEqual(
      classifyUrl("embed", "https://example.com/page.html"),
      dropped(outsidePackageFeature),
    );
    assert.deepStrictEqual(
      classifyUrl("embed", "http://example.com/page.html"),
      dropped(outsidePackageFeature),
    );
  });

  it("drops an empty or whitespace-only value as url-invalid in every context", () => {
    for (const value of ["", " ", " \t\n\r "]) {
      for (const context of ["link", "resource", "embed", "srcset"] as const) {
        assert.deepStrictEqual(
          classifyUrl(context, value),
          dropped(invalidUrlFeature),
          `${JSON.stringify(value)} in ${context}`,
        );
      }
    }
  });

  it("drops a value of control characters, which the parser strips to nothing, as url-invalid", () => {
    for (const context of singleContexts) {
      assert.deepStrictEqual(
        classifyUrl(context, "\u0001 \u001F"),
        dropped(invalidUrlFeature),
        context,
      );
    }
  });

  it("keeps a reference to the item's directory itself as the package path ./", () => {
    for (const value of [".", "./", "?", "images/..", "https:"]) {
      for (const context of singleContexts) {
        assert.deepStrictEqual(
          classifyUrl(context, value),
          inPackage("./"),
          `${JSON.stringify(value)} in ${context}`,
        );
      }
    }
  });

  it("drops a value the URL parser refuses as url-invalid", () => {
    for (const context of singleContexts) {
      assert.deepStrictEqual(classifyUrl(context, "http://["), dropped(invalidUrlFeature), context);
      assert.deepStrictEqual(classifyUrl(context, "https://"), dropped(invalidUrlFeature), context);
    }
  });

  it("reads its own written form back as the same classification", () => {
    const values = [
      "images/a b.png",
      "https:evil.com/x",
      "./javascript:x",
      ".///evil.com/x",
      "./#q1",
      "#q1",
      "x?",
      "",
      ".",
      "./",
      "?",
      "HTTPS://Example.COM/x",
      "a.png 1x, https://example.com/b.png 2x",
    ];
    for (const context of ["link", "resource", "embed", "srcset"] as const) {
      for (const value of values) {
        const first = classifyUrl(context, value);
        if (first.kind !== "dropped") {
          assert.deepStrictEqual(
            classifyUrl(context, formatUrl(first)),
            first,
            `${JSON.stringify(value)} in ${context}`,
          );
        }
      }
    }
  });
});

describe("classifyUrl, srcset", () => {
  it("keeps the corpus item nested_object's srcset values as package paths", () => {
    assert.deepStrictEqual(
      classifyUrl("srcset", "images/postcard.webp"),
      srcset(candidate(inPackage("images/postcard.webp"))),
    );
    assert.deepStrictEqual(
      classifyUrl("srcset", "images/postcard.svg"),
      srcset(candidate(inPackage("images/postcard.svg"))),
    );
  });

  it("keeps each candidate's URL in its parsed form with its descriptors", () => {
    assert.deepStrictEqual(
      classifyUrl("srcset", "small.png 1x,\n large.png 2x, https://Example.com/w.png 480w"),
      srcset(
        candidate(inPackage("small.png"), "1x"),
        candidate(inPackage("large.png"), "2x"),
        candidate(remote("https://example.com/w.png"), "480w"),
      ),
    );
  });

  it("drops the whole attribute when one candidate is refused", () => {
    assert.deepStrictEqual(
      classifyUrl("srcset", "https://example.com/a.png 1x, javascript:alert(1) 2x"),
      dropped("url-scheme:javascript"),
    );
    assert.deepStrictEqual(
      classifyUrl("srcset", "a.png 1x, //host/b.png 2x"),
      dropped(outsidePackageFeature),
    );
  });

  it("classifies a candidate the browser skips for its descriptors, and leaves it out of the parsed form", () => {
    assert.deepStrictEqual(
      classifyUrl("srcset", "a.png 1x, b.png 0w"),
      srcset(candidate(inPackage("a.png"), "1x")),
    );
    assert.deepStrictEqual(
      classifyUrl("srcset", "a.png 1x, javascript:x 0w"),
      dropped("url-scheme:javascript"),
    );
  });

  it("splits candidates as the HTML srcset parser does", () => {
    assert.deepStrictEqual(
      classifyUrl("srcset", "a.png,, b.png 2x"),
      srcset(candidate(inPackage("a.png")), candidate(inPackage("b.png"), "2x")),
    );
    assert.deepStrictEqual(
      classifyUrl("srcset", "a.png 1x, b.png (1x, javascript:alert(1) 2x)"),
      srcset(candidate(inPackage("a.png"), "1x")),
      "a parenthesised descriptor holds its comma, so the browser reads no third URL",
    );
  });

  it("drops a srcset a browser reads no candidate from as url-invalid, since it is written empty", () => {
    for (const value of [
      ",",
      "a.png 100h",
      "images/a b.png",
      "a.png (1x, javascript:alert(1) 2x)",
    ]) {
      assert.deepStrictEqual(classifyUrl("srcset", value), dropped(invalidUrlFeature), value);
    }
  });

  it("drops a srcset whose candidate URL would not split back as the same URL as url-invalid", () => {
    assert.deepStrictEqual(classifyUrl("srcset", "a.png,\u0001 2x"), dropped(invalidUrlFeature));
    assert.deepStrictEqual(classifyUrl("srcset", "\u0001 1x"), dropped(invalidUrlFeature));
  });
});

describe("formatUrl", () => {
  it("writes a kept value in its parsed form, a package path as its path below the item's directory", () => {
    assert.strictEqual(formatUrl(inPackage("images/a%20b.png")), "images/a%20b.png");
    assert.strictEqual(formatUrl(inPackage("./@evil.com/x")), "./@evil.com/x");
    assert.strictEqual(formatUrl(remote("https://example.com/x")), "https://example.com/x");
    assert.strictEqual(formatUrl({ fragment: "q1", kind: "fragment" }), "#q1");
  });

  it("writes a srcset candidate by candidate, each followed by its descriptors", () => {
    const kept = classifyUrl("srcset", "small.png 1x, https://example.com/large.png 2x");
    assert.strictEqual(kept.kind, "srcset");
    if (kept.kind === "srcset") {
      assert.strictEqual(formatUrl(kept), "small.png 1x, https://example.com/large.png 2x");
    }
  });
});

describe("isPackagePath", () => {
  it("holds for a path from the package root, a space or a % in a name included", () => {
    for (const path of ["a.png", "items/media/a b.png", "items/%41.png", "items/a..b/c.png"]) {
      assert.isTrue(isPackagePath(path), path);
    }
  });

  it("fails for an empty path, a rooted one, and one with a . or .. segment", () => {
    for (const path of ["", "/a.png", "./a.png", "items/./a.png", "items/../a.png", "..", "a/.."]) {
      assert.isFalse(isPackagePath(path), path);
    }
  });
});

describe("assetReferenceOf", () => {
  it("resolves a package path against the item's directory, each segment percent-decoded, its query and fragment apart", () => {
    const cases = [
      ["items/q1.xml", "media/a%20b.png", "items/media/a b.png", ""],
      ["items/q1.xml", "media/%C3%A9.png", "items/media/é.png", ""],
      ["items/q1.xml", "asl/item123.mp4#t=00:00:16.0", "items/asl/item123.mp4", "#t=00:00:16.0"],
      ["items/q1.xml", "a.png?v=1#x", "items/a.png", "?v=1#x"],
      ["items/q1.xml", "./@evil.com/x", "items/@evil.com/x", ""],
      ["items/q1.xml", "./javascript:x", "items/javascript:x", ""],
      ["items/q1.xml", "./", "items/", ""],
      ["items/deep/q1.xml", "../x.png", "items/x.png", ""],
      ["q1.xml", "media/a.png", "media/a.png", ""],
      ["items/q1.xml", "a%ZZ.png", "items/a%ZZ.png", ""],
    ] as const;
    for (const [location, path, file, params] of cases) {
      assert.deepStrictEqual(
        assetReferenceOf(location, inPackage(path)),
        { params, path: file },
        `${path} in ${location}`,
      );
    }
  });

  it("resolves the value check writes for a reference to the file the reference names", () => {
    const cases = [
      ["media/a b.png", "items/media/a b.png"],
      ["./media/./a.png", "items/media/a.png"],
      ["media/sub/../a.png", "items/media/a.png"],
      ["media/%2e%2e/a.png", "items/a.png"],
      ["@evil.com/x", "items/@evil.com/x"],
      [":8080/x", "items/:8080/x"],
      ["https:evil.com/x", "items/evil.com/x"],
    ] as const;
    for (const [value, file] of cases) {
      const kept = classifyUrl("resource", value);
      assert.strictEqual(kept.kind, "package", value);
      if (kept.kind === "package") {
        assert.strictEqual(assetReferenceOf("items/q1.xml", kept).path, file, value);
      }
    }
  });
});

describe("addressUrl", () => {
  /**
   * The addresses the cases write, by file.
   */
  const assets = assetsOf([
    ["items/media/a b.png", "https://cdn.example/sha256/1"],
    ["items/@evil.com/x", "https://cdn.example/sha256/2"],
    ["items/small.png", "https://cdn.example/sha256/3"],
    ["items/asl/item123.mp4", "https://cdn.example/sha256/4"],
  ]);

  it("writes a package path as its file's address, then its query and fragment, never on the page's base", () => {
    assert.deepStrictEqual(
      addressUrl(inPackage("media/a%20b.png"), "items/q1.xml", assets),
      Result.succeed("https://cdn.example/sha256/1"),
    );
    assert.deepStrictEqual(
      addressUrl(inPackage("asl/item123.mp4#t=00:00:01,00:00:10.0"), "items/q1.xml", assets),
      Result.succeed("https://cdn.example/sha256/4#t=00:00:01,00:00:10.0"),
    );
    assert.deepStrictEqual(
      addressUrl(inPackage("./@evil.com/x"), "items/q1.xml", assets),
      Result.succeed("https://cdn.example/sha256/2"),
    );
  });

  it("fails with the file's path when assets give the file no address, whatever the page could resolve", () => {
    assert.deepStrictEqual(
      addressUrl(inPackage("media/c.png"), "items/q1.xml", assets),
      Result.fail("items/media/c.png"),
    );
    assert.deepStrictEqual(
      addressUrl(inPackage("a%20b.png"), "items/media/q1.xml", new Map()),
      Result.fail("items/media/a b.png"),
    );
  });

  it("fails for a location whose path is no PackagePath, since no key of assets can be one", () => {
    const beside = assetsOf([["items/a.png", "https://cdn.example/sha256/5"]]);
    assert.deepStrictEqual(
      addressUrl(inPackage("a.png"), "items/q1.xml", beside),
      Result.succeed("https://cdn.example/sha256/5"),
    );
    assert.deepStrictEqual(
      addressUrl(inPackage("a.png"), "/items/q1.xml", beside),
      Result.fail("/items/a.png"),
    );
    assert.deepStrictEqual(
      addressUrl(inPackage("a.png"), "../items/q1.xml", beside),
      Result.fail("../items/a.png"),
    );
  });

  it("writes a remote URL and a fragment as parsed, and needs no address for either", () => {
    assert.deepStrictEqual(
      addressUrl(remote("https://example.com/x"), "items/q1.xml", new Map()),
      Result.succeed("https://example.com/x"),
    );
    assert.deepStrictEqual(
      addressUrl({ fragment: "q1", kind: "fragment" }, "items/q1.xml", new Map()),
      Result.succeed("#q1"),
    );
  });

  it("writes a srcset candidate by candidate, each package path as its address, and fails at its first file with no address", () => {
    const kept = classifyUrl("srcset", "small.png 1x, https://example.com/large.png 2x");
    const missing = classifyUrl("srcset", "small.png 1x, medium.png 2x, large.png 3x");
    assert.strictEqual(kept.kind, "srcset");
    assert.strictEqual(missing.kind, "srcset");
    if (kept.kind === "srcset" && missing.kind === "srcset") {
      assert.deepStrictEqual(
        addressUrl(kept, "items/q1.xml", assets),
        Result.succeed("https://cdn.example/sha256/3 1x, https://example.com/large.png 2x"),
      );
      assert.deepStrictEqual(
        addressUrl(missing, "items/q1.xml", assets),
        Result.fail("items/medium.png"),
      );
    }
  });
});

describe("assetPaths", () => {
  it("names each file a URL attribute's package paths name, a srcset's in order, and none for any other value", () => {
    const cases = [
      ["img", "src", "media/a%20b.png", ["items/media/a b.png"]],
      ["object", "data", "media/graph.svg#v", ["items/media/graph.svg"]],
      ["video", "poster", "./poster.png", ["items/poster.png"]],
      ["a", "href", "passage.html", ["items/passage.html"]],
      [
        "source",
        "srcset",
        "a.png 1x, https://r.example/b.png 2x, c.png 3x",
        ["items/a.png", "items/c.png"],
      ],
      ["img", "src", "../shared/a.png", []],
      ["img", "src", "/a.png", []],
      ["img", "src", "https://r.example/a.png", []],
      ["object", "data", "https://r.example/a.svg", []],
      ["a", "href", "#q1", []],
      // oxlint-disable-next-line eslint/no-script-url -- the value is test input plate must drop, never a URL this code navigates to.
      ["img", "src", "javascript:alert(1)", []],
      ["img", "src", " ", []],
      ["img", "alt", "a.png", []],
      ["p", "src", "a.png", []],
    ] as const;
    for (const [element, attribute, value, files] of cases) {
      assert.deepStrictEqual(
        assetPaths("items/q1.xml", element, attribute, value),
        files,
        `${element}@${attribute}="${value}"`,
      );
    }
  });
});
