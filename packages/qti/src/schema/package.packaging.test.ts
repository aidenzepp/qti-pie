import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { kinds as cpxKinds } from "#qti/schema/kinds/cpx.ts";
import { kinds as drdKinds } from "#qti/schema/kinds/drd.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import {
  AccessForAllResource,
  DrdAccessMode,
  DrdAtInteroperable,
  DrdEducationalComplexityOfAdaptation,
  DrdHasAdaptation,
  FileMetadata,
  fileMetadataArms,
  fileMetadataRelations,
  fileMetadataRules,
  Variant,
  variantDrdArms,
  variantDrdRelations,
  variantDrdRules,
  VariantMetadata,
} from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * The schema over the node and package modules and the staged trio, which the package module's own
 * exports do not yet hold.
 */
const probe = () =>
  schema("P4VariantProbe", { ...node.relations, ...pkg.relations, ...variantDrdRelations }, [
    ...node.rules,
    ...pkg.rules,
    ...variantDrdRules,
  ]);

type Rule = (typeof variantDrdRules)[number];

type Staged = (typeof variantDrdRelations)[keyof typeof variantDrdRelations];

/**
 * The inclusive bounds of a capacity statement, as read from its description.
 */
const boundsOf = (rule: Rule) => {
  const desc: unknown = Predicate.hasProperty(rule, "desc") ? rule.desc : undefined;

  if (
    Predicate.hasProperty(desc, "within") &&
    Predicate.hasProperty(desc.within, "low") &&
    Predicate.hasProperty(desc.within, "high")
  ) {
    return [desc.within.low, desc.within.high];
  }

  return [];
};

/**
 * The capacity statements of the staged rules that count `from` under a target relation.
 */
const capacitiesOn = (target: Staged, from: Staged) =>
  variantDrdRules.filter(
    (rule) =>
      rule.kind === "capacity" && rule.target.source === target && rule.from.source === from,
  );

/**
 * Whether a candidate key over exactly `fields` is declared for `relation`.
 */
const hasKey = (relation: Staged, fields: readonly string[]) =>
  variantDrdRules.some(
    (rule) =>
      rule.kind === "key" &&
      rule.relation === relation &&
      JSON.stringify(rule.fields) === JSON.stringify(fields),
  );

/**
 * The regular expression source of a leaf's `value` column.
 */
const leafPatternSource = (leaf: { readonly fields: { readonly value: object } }) => {
  const { value } = leaf.fields;

  return Predicate.hasProperty(value, "pattern") && Predicate.hasProperty(value.pattern, "source")
    ? value.pattern.source
    : undefined;
};

describe("package staged variant and DRD trio", () => {
  it("builds a schema over the node and package modules and the staged trio without refusal", () => {
    const built = probe();
    for (const name of Object.keys(variantDrdRelations)) {
      assert.isTrue(name in built.relations, name);
    }
  });

  it("holds exactly the 20 cpx and drd handles of the kinds in the arms", () => {
    assert.deepStrictEqual(
      Object.keys(variantDrdArms).toSorted(),
      [...cpxKinds, ...drdKinds].toSorted(),
    );
    assert.strictEqual(Object.keys(variantDrdArms).length, 20);
  });

  it("gives every leaf arm the (id, owner, value) shape", () => {
    const leaves = Object.entries(variantDrdArms).filter(([handle]) =>
      drdKinds.some((kind) => kind === handle && kind !== "drd:accessForAllResource"),
    );
    assert.strictEqual(leaves.length, 17);
    for (const [handle, relation] of leaves) {
      assert.deepStrictEqual(Object.keys(relation.fields), ["id", "owner", "value"], handle);
      assert.deepStrictEqual(relation.primaryKey, ["id"], handle);
    }
  });

  it("composes the trio: the package module's own relations, rules and arms hold it", () => {
    for (const [name, relation] of Object.entries(variantDrdRelations)) {
      assert.isTrue(Object.entries(pkg.relations).some(([n, r]) => n === name && r === relation));
    }
    for (const rule of variantDrdRules) {
      assert.isTrue(pkg.rules.some((held) => Object.is(held, rule)));
    }
    for (const [handle, relation] of Object.entries(variantDrdArms)) {
      assert.isTrue(Object.entries(pkg.arms).some(([h, r]) => h === handle && r === relation));
    }
  });

  it("builds a schema over the package module's relations alone, Variant included", () => {
    const built = schema("P4PackageProbe", { ...node.relations, ...pkg.relations }, [
      ...node.rules,
      ...pkg.rules,
    ]);
    assert.isTrue("Variant" in built.relations);
    assert.isTrue("ManifestId" in built.relations);
  });

  it("counts each variant's metadata and each metadata's access-for-all resource exactly once", () => {
    const variant = capacitiesOn(Variant, VariantMetadata);
    const metadata = capacitiesOn(VariantMetadata, AccessForAllResource);
    assert.strictEqual(variant.length, 1);
    assert.strictEqual(metadata.length, 1);
    assert.deepStrictEqual(variant.flatMap(boundsOf), [1n, 1n]);
    assert.deepStrictEqual(metadata.flatMap(boundsOf), [1n, 1n]);
  });

  it("holds the VariantNotSelf row check over Variant", () => {
    const checks = variantDrdRules.flatMap((rule) =>
      rule.kind === "check" && rule.name === "VariantNotSelf" ? [rule.relation] : [],
    );
    assert.deepStrictEqual(checks, [Variant]);
  });

  it("keys a variant by (package, identifier) and each container by its parent", () => {
    assert.isTrue(hasKey(Variant, ["package", "identifier"]));
    assert.isTrue(hasKey(VariantMetadata, ["variant"]));
    assert.isTrue(hasKey(AccessForAllResource, ["metadata"]));
  });

  it("types each union leaf by its pattern and the URI leaves by anyUri", () => {
    assert.strictEqual(leafPatternSource(DrdAccessMode), patterns.drdAccessMode);
    assert.strictEqual(leafPatternSource(DrdHasAdaptation), patterns.anyUri);
    assert.strictEqual(
      leafPatternSource(DrdEducationalComplexityOfAdaptation),
      patterns.drdEducationalComplexityOfAdaptation,
    );
    assert.strictEqual(leafPatternSource(DrdAtInteroperable), patterns.xsBoolean);
  });

  it("keys the 0..1 leaves by owner and leaves the repeatable ones unkeyed", () => {
    assert.isTrue(hasKey(DrdAtInteroperable, ["owner"]));
    assert.isTrue(hasKey(DrdEducationalComplexityOfAdaptation, ["owner"]));
    assert.isFalse(hasKey(DrdAccessMode, ["owner"]));
  });
});

/**
 * The statements of the package module's own rules, by kind.
 */
const mirrorsOf = () => pkg.rules.filter((rule) => rule.kind === "mirrors");

const containedOf = () => pkg.rules.filter((rule) => rule.kind === "contained");

const alternativesOf = () => pkg.rules.filter((rule) => rule.kind === "alternatives");

const manifestIdArms = [
  ["manifest", pkg.ManifestIdOfManifest, pkg.Package, ["package", "id"], ["id", "identifier"]],
  [
    "resource",
    pkg.ManifestIdOfResource,
    pkg.Resource,
    ["package", "id"],
    ["package", "identifier"],
  ],
  ["variant", pkg.ManifestIdOfVariant, pkg.Variant, ["package", "id"], ["package", "identifier"]],
] as const;

describe("package ManifestId", () => {
  it("holds the roster, the relation and the three arms in the module's relations", () => {
    assert.strictEqual(pkg.relations.ManifestIdHolder, pkg.ManifestIdHolder);
    assert.strictEqual(pkg.relations.ManifestId, pkg.ManifestId);
    assert.deepStrictEqual([...pkg.ManifestIdHolder.handles], ["manifest", "resource", "variant"]);
    for (const [, arm] of manifestIdArms) {
      assert.isTrue(Object.values(pkg.relations).includes(arm));
      assert.deepStrictEqual([...arm.primaryKey], ["package", "id"]);
    }
  });

  it("keys ManifestId by (package, id) and binds it to its package", () => {
    assert.deepStrictEqual([...pkg.ManifestId.primaryKey], ["package", "id"]);
    assert.isTrue(
      containedOf().some(
        (rule) =>
          rule.left.source === pkg.ManifestId &&
          rule.right.source === pkg.Package &&
          rule.left.fields.join(",") === "package" &&
          rule.right.fields.join(",") === "id",
      ),
    );
  });

  it("names its three arms by holder in one alternatives statement", () => {
    const [rule, ...rest] = alternativesOf().filter(
      (candidate) => candidate.parent === pkg.ManifestId,
    );
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.discriminator, "holder");
    assert.strictEqual(rule?.roster, pkg.ManifestIdHolder);
    assert.deepStrictEqual(
      Object.entries(rule?.arms ?? {}).toSorted(([a], [b]) => a.localeCompare(b)),
      [
        ["manifest", pkg.ManifestIdOfManifest],
        ["resource", pkg.ManifestIdOfResource],
        ["variant", pkg.ManifestIdOfVariant],
      ],
    );
  });

  it("mirrors each arm onto its holder's (identifier) as p4-01's verdict admitted", () => {
    for (const [, arm, owner, left, right] of manifestIdArms) {
      const rules = mirrorsOf().filter((rule) => rule.left.source === arm);
      assert.strictEqual(rules.length, 1, arm.name);
      assert.strictEqual(rules[0]?.right.source, owner, arm.name);
      assert.strictEqual(rules[0]?.left.fields.join(","), left.join(","), arm.name);
      assert.strictEqual(rules[0]?.right.fields.join(","), right.join(","), arm.name);
    }
  });

  it("keeps the ManifestId statements out of arms", () => {
    for (const [, arm] of manifestIdArms) {
      assert.isFalse(Object.values(pkg.arms).some((held) => Object.is(held, arm)));
    }
  });
});

const fileMetadataProbe = () =>
  schema("P4FileMetadataProbe", { ...node.relations, ...pkg.relations, ...fileMetadataRelations }, [
    ...node.rules,
    ...pkg.rules,
    ...fileMetadataRules,
  ]);

describe("package staged FileMetadata", () => {
  it("builds a schema over the package module and the staged relation without refusal", () => {
    const built = fileMetadataProbe();
    assert.isTrue("FileMetadata" in built.relations);
  });

  it("holds exactly FileMetadata, keyed by id, and the cp:metadata.file arm", () => {
    assert.deepStrictEqual(Object.keys(fileMetadataRelations), ["FileMetadata"]);
    assert.deepStrictEqual(Object.keys(fileMetadataArms), ["cp:metadata.file"]);
    assert.strictEqual(fileMetadataArms["cp:metadata.file"], FileMetadata);
    assert.deepStrictEqual([...FileMetadata.primaryKey], ["id"]);
    assert.deepStrictEqual(Object.keys(FileMetadata.fields), ["file", "id"]);
  });

  it("carries a candidate key over file and containments into Edge and File", () => {
    const keys = fileMetadataRules.flatMap((rule) =>
      rule.kind === "key" && rule.relation === FileMetadata ? [[...rule.fields]] : [],
    );
    assert.deepStrictEqual(keys, [["file"]]);

    const into = fileMetadataRules.flatMap((rule) =>
      rule.kind === "contained" && rule.left.source === FileMetadata
        ? [[rule.right.source, [...rule.left.fields], [...rule.right.fields]]]
        : [],
    );
    assert.deepStrictEqual(into, [
      [node.Edge, ["id", "file"], ["child", "parent"]],
      [pkg.File, ["file"], ["id"]],
    ]);
  });

  it("is not yet in the package module's relations, rules or arms", () => {
    assert.isFalse(Object.values(pkg.relations).some((held) => Object.is(held, FileMetadata)));
    for (const rule of fileMetadataRules) {
      assert.isFalse(pkg.rules.some((held) => Object.is(held, rule)));
    }
    assert.isFalse(Object.values(pkg.arms).some((held) => Object.is(held, FileMetadata)));
  });
});
