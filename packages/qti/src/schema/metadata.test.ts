import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { kinds as lomKinds } from "#qti/schema/kinds/lom.ts";
import * as document from "#qti/schema/document.ts";
import * as metadata from "#qti/schema/metadata.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";

/**
 * The schema over node's, package's, document's and this module's relations and rules.
 */
const probe = () =>
  schema(
    "QtiMetadataProbe",
    { ...node.relations, ...pkg.relations, ...document.relations, ...metadata.relations },
    [...node.rules, ...pkg.rules, ...document.rules, ...metadata.rules],
  );

/**
 * The alternatives statements of this module.
 */
const alternativesOf = () =>
  metadata.rules.flatMap((rule) => (rule.kind === "alternatives" ? [rule] : []));

/**
 * The handles this module declares arms for, the first forty-two of the LOM kinds: the general,
 * lifeCycle, metaMetadata, technical and rights categories.
 */
const armHandles = lomKinds.slice(0, 42);

describe("metadata", () => {
  it("builds a schema over node, package, document and metadata relations and rules without refusal", () => {
    const built = probe();
    for (const name of Object.keys(metadata.relations)) {
      assert.isTrue(name in built.relations, name);
    }
    assert.isAbove(metadata.rules.length, 0);
  });

  it("keys the arms by the general, lifeCycle, metaMetadata, technical and rights LOM handles", () => {
    assert.deepStrictEqual(Object.keys(metadata.arms).toSorted(), [...armHandles].toSorted());
    for (const handle of Object.keys(metadata.arms)) {
      assert.isTrue(
        lomKinds.some((kind) => kind === handle),
        handle,
      );
    }
  });

  it("holds one alternatives statement on Lom by owner, whose arms are the owner relations", () => {
    const found = alternativesOf();
    assert.strictEqual(found.length, 1);

    const [rule] = found;
    assert.isDefined(rule, "alternatives statement");
    assert.strictEqual(rule.discriminator, "owner");
    assert.strictEqual(rule.roster, metadata.relations.LomOwner);
    assert.deepStrictEqual(Object.keys(rule.arms).toSorted(), ["manifest", "resource"]);
    assert.isTrue(
      Predicate.hasProperty(rule.arms, "manifest") &&
        rule.arms.manifest === metadata.relations.ManifestLom,
    );
    assert.isTrue(
      Predicate.hasProperty(rule.arms, "resource") &&
        rule.arms.resource === metadata.relations.ResourceLom,
    );
    for (const handle of Object.keys(rule.arms)) {
      assert.isTrue(
        metadata.relations.LomOwner.handles.some((owner) => owner === handle),
        handle,
      );
    }
  });

  it("holds the item capacities: one object identifier and one object title per item resource", () => {
    const capacities = metadata.rules.flatMap((rule) => (rule.kind === "capacity" ? [rule] : []));
    const selectedOn = (
      target:
        | typeof metadata.relations.ResourceLomIdentified
        | typeof metadata.relations.ResourceLomTitled,
      from:
        | typeof metadata.relations.LomObjectIdentifier
        | typeof metadata.relations.LomObjectTitle,
    ) =>
      capacities.filter((rule) => {
        const source: unknown = rule.target.source;

        const within: unknown = Predicate.hasProperty(rule, "desc") ? rule.desc : undefined;

        return (
          Predicate.hasProperty(source, "relation") &&
          source.relation === target &&
          Predicate.hasProperty(source, "bindings") &&
          Predicate.hasProperty(source.bindings, "type") &&
          source.bindings.type === "imsqti_item_xmlv3p0" &&
          Object.keys(source.bindings).length === 1 &&
          rule.from.source === from &&
          Predicate.hasProperty(within, "within") &&
          Predicate.hasProperty(within.within, "low") &&
          within.within.low === 1n &&
          Predicate.hasProperty(within.within, "high") &&
          within.within.high === 1n
        );
      });
    assert.strictEqual(
      selectedOn(metadata.relations.ResourceLomIdentified, metadata.relations.LomObjectIdentifier)
        .length,
      1,
    );
    assert.strictEqual(
      selectedOn(metadata.relations.ResourceLomTitled, metadata.relations.LomObjectTitle).length,
      1,
    );
  });
});
