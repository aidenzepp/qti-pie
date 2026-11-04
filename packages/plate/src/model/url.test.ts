import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import {
  classifyUrl,
  formatUrl,
  invalidUrlFeature,
  outsidePackageFeature,
  schemeFeature,
  urlAttributes,
  urlContextOf,
} from "#plate/model/url.ts";
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
  it("rebases a package path onto the asset base and leaves the rest as parsed", () => {
    assert.strictEqual(formatUrl(inPackage("images/a%20b.png")), "images/a%20b.png");
    assert.strictEqual(
      formatUrl(inPackage("images/a%20b.png"), "/assets/items/"),
      "/assets/items/images/a%20b.png",
    );
    assert.strictEqual(
      formatUrl(remote("https://example.com/x"), "/assets/items/"),
      "https://example.com/x",
    );
    assert.strictEqual(formatUrl({ fragment: "q1", kind: "fragment" }, "/assets/items/"), "#q1");
  });

  it("adds the / an asset base lacks, so a package path stays on the base's host and port", () => {
    const cases = [
      ["https://cdn.example", "@evil.com/x", "https://cdn.example/@evil.com/x"],
      ["https://cdn.example", ":8080/x", "https://cdn.example/:8080/x"],
      ["//cdn.example", "@evil.com/x", "//cdn.example/@evil.com/x"],
      ["//cdn.example", ":8080/x", "//cdn.example/:8080/x"],
    ] as const;
    for (const [assetBase, value, expected] of cases) {
      const kept = classifyUrl("resource", value);
      assert.strictEqual(kept.kind, "package", value);
      if (kept.kind === "package") {
        const written = formatUrl(kept, assetBase);
        assert.strictEqual(written, expected, `${value} under ${assetBase}`);
        assert.strictEqual(
          new URL(written, "https://page.example/item").host,
          "cdn.example",
          `${value} under ${assetBase}`,
        );
      }
    }
    assert.strictEqual(
      formatUrl(inPackage("images/a.png"), "https://cdn.example"),
      "https://cdn.example/images/a.png",
    );
  });

  it("leaves an empty asset base, and one that ends in /, as it is", () => {
    assert.strictEqual(formatUrl(inPackage("images/a.png"), ""), "images/a.png");
    assert.strictEqual(
      formatUrl(inPackage("images/a.png"), "https://cdn.example/"),
      "https://cdn.example/images/a.png",
    );
    assert.strictEqual(
      formatUrl(inPackage("images/a.png"), "/assets/items/"),
      "/assets/items/images/a.png",
    );
  });

  it("writes a srcset candidate by candidate, rebasing each package path", () => {
    const kept = classifyUrl("srcset", "small.png 1x, https://example.com/large.png 2x");
    assert.strictEqual(kept.kind, "srcset");
    if (kept.kind === "srcset") {
      assert.strictEqual(
        formatUrl(kept, "/assets/items/"),
        "/assets/items/small.png 1x, https://example.com/large.png 2x",
      );
    }
  });
});
