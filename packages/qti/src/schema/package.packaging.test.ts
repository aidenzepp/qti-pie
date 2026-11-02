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

  it("stages the trio: the package module's own relations do not hold it", () => {
    assert.isFalse("Variant" in pkg.relations);
    for (const name of Object.keys(variantDrdRelations)) {
      assert.isFalse(name in pkg.relations, name);
    }
    for (const rule of variantDrdRules) {
      assert.isFalse(pkg.rules.some((held) => Object.is(held, rule)));
    }
    assert.isFalse("cpx:variant" in pkg.arms);
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
