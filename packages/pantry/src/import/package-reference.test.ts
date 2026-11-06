import { assert, describe, it } from "@effect/vitest";
import { resolvePackageReference } from "#pantry/import/package-reference.ts";
import * as patterns from "#pantry/schema/patterns.ts";

describe("resolvePackageReference", () => {
  it("resolves a relative path against the document's path", () => {
    assert.deepStrictEqual(
      resolvePackageReference(
        "asl/item123.mp4#t=00:00:01,00:00:10.0",
        "items/MultipleCatalogs.xml",
      ),
      { _tag: "InPackage", path: "items/asl/item123.mp4" },
    );
    assert.deepStrictEqual(resolvePackageReference("images/a.png", "passages/x.xml"), {
      _tag: "InPackage",
      path: "passages/images/a.png",
    });
  });

  it("drops the query and the fragment and removes dot segments", () => {
    assert.deepStrictEqual(resolvePackageReference("./b/../a.png?v=1#x", "items/x.xml"), {
      _tag: "InPackage",
      path: "items/a.png",
    });
    assert.deepStrictEqual(resolvePackageReference("../a.png", "items/x.xml"), {
      _tag: "InPackage",
      path: "a.png",
    });
  });

  it("does not percent-decode", () => {
    assert.deepStrictEqual(resolvePackageReference("a%20b.png", "items/x.xml"), {
      _tag: "InPackage",
      path: "items/a%20b.png",
    });
  });

  it("resolves against an xml:base chain, outermost first", () => {
    assert.deepStrictEqual(resolvePackageReference("a.png", "items/x.xml", ["media/"]), {
      _tag: "InPackage",
      path: "items/media/a.png",
    });
    assert.deepStrictEqual(resolvePackageReference("a.png", "items/x.xml", ["media/", "../img/"]), {
      _tag: "InPackage",
      path: "items/img/a.png",
    });
    assert.deepStrictEqual(resolvePackageReference("a.png", "items/x.xml", ["https://h/p/"]), {
      _tag: "Scheme",
    });
  });

  it("tags a value that does not name a package file", () => {
    assert.strictEqual(
      resolvePackageReference("https://example.org/a", "items/x.xml")._tag,
      "Scheme",
    );
    assert.strictEqual(resolvePackageReference("#frag", "items/x.xml")._tag, "FragmentOnly");
    assert.strictEqual(resolvePackageReference("//host/a", "items/x.xml")._tag, "NetworkPath");
    assert.strictEqual(resolvePackageReference("../../a", "items/x.xml")._tag, "OutsidePackage");
    assert.strictEqual(resolvePackageReference("/a", "items/x.xml")._tag, "OutsidePackage");
  });

  it("gives a path the manifest's href pattern admits", () => {
    const result = resolvePackageReference("../a/b.png", "items/x.xml");

    assert.isTrue(result._tag === "InPackage");
    assert.isTrue(
      result._tag === "InPackage" && new RegExp(patterns.hrefInPackage, "u").test(result.path),
    );
  });
});
