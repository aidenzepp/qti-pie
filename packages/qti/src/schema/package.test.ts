import { assert, describe, it } from "@effect/vitest";
import { admission } from "#qti/schema/kinds/cp.ts";
import { RootKind } from "#qti/schema/node.ts";
import { resourceTypes } from "#qti/schema/seed/resource-types.ts";
import { rootOfType } from "#qti/schema/seed/root-of-type.ts";

const versions = ["3.0.0", "3.0.1"] as const;

const childrenOf = (parent: string, version: (typeof versions)[number]) =>
  admission
    .filter((row) => row.parent === parent && row.version === version)
    .map((row) => row.child)
    .toSorted();

const under = (type: string) =>
  resourceTypes.filter((row) => row.type === type).map((row) => row.version);

describe("resource types", () => {
  it("has 19 rows for 3.0.0 and 20 for 3.0.1", () => {
    assert.strictEqual(resourceTypes.filter((row) => row.version === "3.0.0").length, 19);
    assert.strictEqual(resourceTypes.filter((row) => row.version === "3.0.1").length, 20);
    assert.strictEqual(resourceTypes.length, 39);
  });

  it("has no duplicate (version, type) row", () => {
    const keys = new Set(resourceTypes.map((row) => `${row.version} ${row.type}`));
    assert.strictEqual(keys.size, resourceTypes.length);
  });

  it("keeps each LTI type under its own version", () => {
    assert.deepStrictEqual(under("imslti_xmlv1p1"), ["3.0.1"]);
    assert.deepStrictEqual(under("imsltia_xmlv1p0"), ["3.0.1"]);
    assert.deepStrictEqual(under("imsbasiclti_xmlv1p3"), ["3.0.0"]);
  });
});

describe("rootOfType", () => {
  it("has one row per QTI root kind, as many as the roster minus the manifest", () => {
    const roots = RootKind.handles.filter((root) => root !== "manifest");
    assert.strictEqual(rootOfType.length, roots.length);
    assert.deepStrictEqual(rootOfType.map((row) => row.root).toSorted(), [...roots].toSorted());
  });

  it("names a type that is a resource type under both versions", () => {
    for (const row of rootOfType) {
      for (const version of versions) {
        assert.isTrue(
          resourceTypes.some((entry) => entry.type === row.type && entry.version === version),
          `${row.type} under ${version}`,
        );
      }
    }
  });
});

describe("cp admission", () => {
  it("admits only comment and pi under cp:organizations", () => {
    for (const version of versions) {
      assert.deepStrictEqual(childrenOf("cp:organizations", version), ["comment", "pi"]);
    }
  });

  it("admits the five simpleContent kinds under cp:schemaversion", () => {
    for (const version of versions) {
      assert.deepStrictEqual(childrenOf("cp:schemaversion", version), [
        "comment",
        "entityRef",
        "pi",
        "text",
        "ws",
      ]);
    }
  });

  it("holds every row for both versions", () => {
    for (const row of admission) {
      const other = row.version === "3.0.0" ? "3.0.1" : "3.0.0";
      assert.isTrue(
        admission.some(
          (entry) =>
            entry.parent === row.parent && entry.child === row.child && entry.version === other,
        ),
        `${row.parent} ${row.child} under ${other}`,
      );
    }
    assert.isAbove(admission.length, 0);
  });

  it("admits the spec's children under each cp kind", () => {
    const expected = {
      "cp:dependency": ["comment", "pi"],
      "cp:file": ["comment", "pi", "ws"],
      "cp:manifest": [
        "comment",
        "cp:metadata.manifest",
        "cp:organizations",
        "cp:resources",
        "pi",
        "ws",
      ],
      "cp:metadata.manifest": ["comment", "cp:schema", "cp:schemaversion", "lom:lom", "pi", "ws"],
      "cp:metadata.resource": ["comment", "lom:lom", "pi", "qmd:qtiMetadata", "ws"],
      "cp:resource": ["comment", "cp:dependency", "cp:file", "cp:metadata.resource", "pi", "ws"],
      "cp:resources": ["comment", "cp:resource", "pi", "ws"],
      "cp:schema": ["comment", "entityRef", "pi", "text", "ws"],
    };
    for (const [parent, children] of Object.entries(expected)) {
      for (const version of versions) {
        assert.deepStrictEqual(childrenOf(parent, version), children, `${parent} ${version}`);
      }
    }
  });
});
