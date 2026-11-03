import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as rosters from "#qti/schema/content/rosters.ts";
import { admission, kinds as cpKinds } from "#qti/schema/kinds/cp.ts";
import * as node from "#qti/schema/node.ts";
import { RootKind } from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import { resourceTypes } from "#qti/schema/seed/resource-types.ts";
import { rootOfType } from "#qti/schema/seed/root-of-type.ts";
import * as contracts from "#qti/schema/contracts.ts";

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
  it("gives each QTI root kind a row and each row a QTI root kind, one row per type", () => {
    const roots = RootKind.handles.filter((root) => root !== "manifest");
    const rowRoots = rootOfType.map((row) => row.root);
    assert.includeMembers(roots, rowRoots);
    assert.includeMembers(rowRoots, roots);

    const types = rootOfType.map((row) => row.type);
    assert.strictEqual(new Set(types).size, types.length);
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

  it("admits declared kinds under each cp kind, the spec's children among them", () => {
    const declared: readonly string[] = node.NodeKind.handles;
    for (const row of admission) {
      assert.include(declared, row.child, `${row.parent} ${row.child}`);
    }
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
        assert.includeMembers(childrenOf(parent, version), children, `${parent} ${version}`);
      }
    }
  });
});

/**
 * The schema over node's relations and rules and this module's.
 */
const probe = () =>
  schema("QtiPackageProbe", { ...node.relations, ...pkg.relations }, [...node.rules, ...pkg.rules]);

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose.
 */
const boundsOf = (rule: (typeof pkg.rules)[number]): readonly [unknown, unknown] => {
  const within =
    Predicate.hasProperty(rule, "desc") &&
    Predicate.hasProperty(rule.desc, "within") &&
    Predicate.hasProperty(rule.desc.within, "low") &&
    Predicate.hasProperty(rule.desc.within, "high")
      ? rule.desc.within
      : undefined;

  assert.isDefined(within, "capacity description");

  return [within.low, within.high];
};

/**
 * The capacity statements of this module.
 */
const capacities = () => pkg.rules.filter((rule) => rule.kind === "capacity");

/**
 * One side of a containment statement: a relation and the fields it names.
 */
interface Side {
  readonly fields: readonly string[];
  readonly source: unknown;
}

const isSide = (value: unknown): value is Side =>
  Predicate.hasProperty(value, "fields") &&
  Array.isArray(value.fields) &&
  Predicate.hasProperty(value, "source");

/**
 * The containment statements of this module that start at `source`, each as
 * `left fields in Target(right fields)`; the public statement type exposes the sides only through
 * its union.
 */
const containmentsFrom = (source: (typeof pkg.relations)[keyof typeof pkg.relations]): string[] =>
  pkg.rules.flatMap((rule) => {
    if (
      !Predicate.hasProperty(rule, "left") ||
      !Predicate.hasProperty(rule, "right") ||
      !isSide(rule.left) ||
      !isSide(rule.right) ||
      rule.left.source !== source ||
      !Predicate.hasProperty(rule.right.source, "name") ||
      !Predicate.isString(rule.right.source.name)
    ) {
      return [];
    }

    return [
      `${rule.left.fields.join(",")} in ${rule.right.source.name}(${rule.right.fields.join(",")})`,
    ];
  });

describe("package", () => {
  it("builds a schema over node and package relations and rules without refusal", () => {
    const built = probe();
    for (const name of Object.keys(pkg.relations)) {
      assert.isTrue(name in built.relations, name);
    }
    assert.strictEqual(built.statements.length, node.rules.length + pkg.rules.length);
  });

  it("declares each relation and roster under its exported name, phase 1's among them", () => {
    const exported = new Map<string, unknown>(Object.entries(pkg));
    for (const [name, member] of Object.entries(pkg.relations)) {
      assert.strictEqual(exported.get(name), member, name);
    }
    assert.includeMembers(Object.keys(pkg.relations), [
      "Dependency",
      "EntryKind",
      "File",
      "FileContent",
      "Manifest",
      "ManifestMetadata",
      "ManifestSchema",
      "ManifestSchemaVersion",
      "Organizations",
      "Package",
      "PackageEntry",
      "Resource",
      "ResourceHref",
      "ResourceMetadata",
      "ResourceTypeOf",
      "Resources",
      "RootOfType",
    ]);
  });

  it("holds three capacity statements targeting Package, each exactly one", () => {
    const onPackage = capacities().filter((rule) => rule.target.source === pkg.relations.Package);
    assert.strictEqual(onPackage.length, 3);
    for (const rule of onPackage) {
      assert.deepStrictEqual([...rule.target.fields], ["id"]);
      assert.deepStrictEqual(boundsOf(rule), [1n, 1n]);
    }
    assert.deepStrictEqual(onPackage.map((rule) => rule.from.source.name).toSorted(), [
      "ManifestMetadata",
      "Organizations",
      "Resources",
    ]);
  });

  it("states ManifestSchemaVersion as a closed copy of its package's version, by two containments", () => {
    const row = pkg.relations.ManifestSchemaVersion;
    assert.deepStrictEqual(Object.keys(row.fields).toSorted(), [
      "id",
      "metadata",
      "package",
      "version",
    ]);

    const forms = containmentsFrom(row);
    assert.includeMembers(forms, [
      "metadata in ManifestMetadata(id)",
      "metadata,package in ManifestMetadata(id,manifest)",
      "package,version in Package(id,schemaversion)",
    ]);
  });

  it("holds two capacity statements targeting ManifestMetadata, each exactly one", () => {
    const onMetadata = capacities().filter(
      (rule) => rule.target.source === pkg.relations.ManifestMetadata,
    );
    assert.strictEqual(onMetadata.length, 2);
    for (const rule of onMetadata) {
      assert.deepStrictEqual(boundsOf(rule), [1n, 1n]);
    }
    assert.deepStrictEqual(onMetadata.map((rule) => rule.from.source.name).toSorted(), [
      "ManifestSchema",
      "ManifestSchemaVersion",
    ]);
  });

  it("keys the arms by NodeKind handles, each over a relation of this module, every CP kind among them", () => {
    const members: readonly unknown[] = Object.values(pkg.relations);
    assert.includeMembers([...node.NodeKind.handles], Object.keys(pkg.arms));
    for (const [handle, arm] of Object.entries(pkg.arms)) {
      assert.include(members, arm, handle);
    }
    assert.includeMembers(Object.keys(pkg.arms), [...cpKinds]);
  });

  it("holds the File into Resource capacity, one or more", () => {
    const onResource = capacities().filter((rule) => rule.target.source === pkg.relations.Resource);
    assert.strictEqual(onResource.length, 1);
    for (const rule of onResource) {
      assert.strictEqual(rule.from.source, pkg.relations.File);
      assert.deepStrictEqual([...rule.target.fields], ["id"]);
      assert.deepStrictEqual([...rule.from.fields], ["resource"]);
      assert.deepStrictEqual(boundsOf(rule), [1n, "*"]);
    }
  });

  it("holds the DependencyNotSelf check over Dependency", () => {
    const names = pkg.rules.flatMap((rule) =>
      rule.kind === "check" && rule.relation === pkg.relations.Dependency ? [rule.name] : [],
    );
    assert.deepStrictEqual(names, ["DependencyNotSelf"]);
  });

  it("holds cp:schema to the seven names of CpSchema", () => {
    assert.strictEqual(pkg.relations.ManifestSchema.fields.value.roster, rosters.CpSchema);
  });
});

describe("manifest contracts (package)", () => {
  const idColumns = [
    pkg.Package.fields.identifier,
    pkg.Resource.fields.identifier,
    pkg.Dependency.fields.resource,
    pkg.Dependency.fields.target,
    pkg.Variant.fields.identifier,
    pkg.Variant.fields.identifierref,
    pkg.Variant.fields.resourceIdentifier,
    pkg.ManifestId.fields.id,
    pkg.ManifestIdOfManifest.fields.id,
    pkg.ManifestIdOfResource.fields.id,
    pkg.ManifestIdOfVariant.fields.id,
  ];

  it("types the eleven xs:ID columns ManifestIdentifier", () => {
    for (const column of idColumns) {
      assert.strictEqual(column.name, contracts.ManifestIdentifier.name);
    }
  });

  it("types the path columns PackagePath, one contract on both sides", () => {
    for (const column of [
      pkg.File.fields.href,
      pkg.FileContent.fields.path,
      pkg.PackageEntry.fields.path,
    ]) {
      assert.strictEqual(column.name, contracts.PackagePath.name);
    }
  });

  it("types the resource entry href and the file media type", () => {
    assert.strictEqual(pkg.ResourceHref.fields.href.name, contracts.ResourceEntryHref.name);
    assert.strictEqual(pkg.FileContent.fields.mimeType.name, contracts.FileMediaType.name);
  });
});
