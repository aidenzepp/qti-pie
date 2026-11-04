import { schema } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as csm from "#qti/schema/csm.ts";
import * as csmd from "#qti/schema/kinds/csmd.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as contracts from "#qti/schema/contracts.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * The schema over the modules the CSM relations bind and the module itself.
 */
const probe = () =>
  schema("P4CsmProbe", { ...node.relations, ...pkg.relations, ...csm.relations }, [
    ...node.rules,
    ...pkg.rules,
    ...csm.rules,
  ]);

type Capacity = Extract<(typeof csm.rules)[number], { readonly kind: "capacity" }>;

const capacitiesFrom = (relation: AnyRelation): readonly Capacity[] =>
  csm.rules.flatMap((rule) =>
    rule.kind === "capacity" && rule.from.source === relation ? [rule] : [],
  );

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose.
 */
const boundsOf = (rule: Capacity): readonly [unknown, unknown] | undefined => {
  const within =
    Predicate.hasProperty(rule, "desc") &&
    Predicate.hasProperty(rule.desc, "within") &&
    Predicate.hasProperty(rule.desc.within, "low") &&
    Predicate.hasProperty(rule.desc.within, "high")
      ? rule.desc.within
      : undefined;

  return within === undefined ? undefined : [within.low, within.high];
};

/**
 * Whether a capacity's target is the relation, selected on `kind` when it is given.
 */
const targets = (rule: Capacity, relation: AnyRelation, kind?: string): boolean => {
  const { source } = rule.target;
  if (kind === undefined) {
    return source === relation;
  }

  return (
    Predicate.hasProperty(source, "relation") &&
    source.relation === relation &&
    Predicate.hasProperty(source, "bindings") &&
    Predicate.isObject(source.bindings) &&
    JSON.stringify(source.bindings) === JSON.stringify({ kind })
  );
};

const keyedOn = (relation: AnyRelation): boolean =>
  csm.rules.some(
    (rule) =>
      rule.kind === "key" && Predicate.hasProperty(rule, "relation") && rule.relation === relation,
  );

describe("csm", () => {
  it("builds a schema over the modules it binds without refusal", () => {
    const built = probe();
    assert.isAbove(Object.keys(csm.relations).length, 0);
    for (const name of Object.keys(csm.relations)) {
      assert.isTrue(name in built.relations, name);
    }
  });

  it("admits the set under the four hosts for both versions", () => {
    for (const version of ["3.0.0", "3.0.1"]) {
      for (const parent of [
        "cp:metadata.manifest",
        "cp:metadata.resource",
        "cp:metadata.file",
        "lom:lom",
      ]) {
        assert.isTrue(
          csmd.admission.some(
            (row) =>
              row.parent === parent &&
              row.child === "csmd:curriculumStandardsMetadataSet" &&
              row.version === version,
          ),
          `${parent} ${version}`,
        );
      }
    }
  });

  it("lists the five attribute names", () => {
    assert.deepStrictEqual(
      [...csmd.attributes].toSorted(),
      ["providerId", "region", "resourceLabel", "resourcePartId", "version"].toSorted(),
    );
  });

  it("gives CsmSet no candidate key over its host", () => {
    assert.isFalse(keyedOn(csm.relations.CsmSet));
    assert.deepStrictEqual([...csm.relations.CsmSet.primaryKey], ["id"]);
  });

  it("caps the sets under a manifest or resource metadata node at none or one", () => {
    const rows = capacitiesFrom(csm.relations.CsmSet);
    assert.strictEqual(rows.length, 2);
    for (const kind of ["cp:metadata.manifest", "cp:metadata.resource"]) {
      const selected = rows.filter((rule) => targets(rule, node.relations.Node, kind));
      assert.strictEqual(selected.length, 1, kind);
      for (const rule of selected) {
        assert.deepStrictEqual(boundsOf(rule), [0n, 1n], kind);
      }
    }
  });

  it("counts a metadata under its set, a set of GUIDs and a labelled GUID as one or more", () => {
    const pairs = [
      [csm.relations.CsmMetadata, csm.relations.CsmSet],
      [csm.relations.CsmSetOfGuids, csm.relations.CsmMetadata],
      [csm.relations.CsmLabelledGuid, csm.relations.CsmSetOfGuids],
    ] as const;
    for (const [from, target] of pairs) {
      const rows = capacitiesFrom(from);
      assert.strictEqual(rows.length, 1);
      for (const rule of rows) {
        assert.isTrue(targets(rule, target));
        assert.deepStrictEqual(boundsOf(rule), [1n, "*"]);
      }
    }
  });

  it("holds exactly one GUID in each labelled GUID", () => {
    const rows = capacitiesFrom(csm.relations.CsmGuid);
    assert.strictEqual(rows.length, 1);
    for (const rule of rows) {
      assert.isTrue(targets(rule, csm.relations.CsmLabelledGuid));
      assert.deepStrictEqual(boundsOf(rule), [1n, 1n]);
    }
  });

  it("types the case item URI as a URI", () => {
    assert.strictEqual(
      csm.relations.CsmCaseItemUri.fields.value.base.pattern.source,
      patterns.anyUri,
    );
  });

  it("keys each leaf by its labelled GUID and each attribute by its node", () => {
    for (const name of ["CsmLabel", "CsmCaseItemUri", "CsmGuid"] as const) {
      assert.isTrue(keyedOn(csm.relations[name]), name);
    }
    for (const name of [
      "CsmSetResourceLabel",
      "CsmSetResourcePartId",
      "CsmMetadataProviderId",
      "CsmSetOfGuidsRegion",
      "CsmSetOfGuidsVersion",
    ] as const) {
      assert.deepStrictEqual([...csm.relations[name].primaryKey], ["node"], name);
    }
  });

  it("names a node arm for each of the seven kinds, all of them csmd kinds", () => {
    assert.deepStrictEqual(Object.keys(csm.arms).toSorted(), [...csmd.kinds].toSorted());
  });
});

describe("contracts (csm)", () => {
  it("types CsmCaseItemUri.value CaseItemUri", () => {
    assert.strictEqual(csm.CsmCaseItemUri.fields.value.name, contracts.CaseItemUri.name);
  });
});
