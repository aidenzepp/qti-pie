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
 * The general category's handles, the first fifteen of the LOM kinds.
 */
const generalHandles = lomKinds.slice(0, 15);

describe("metadata", () => {
  it("builds a schema over node, package, document and metadata relations and rules without refusal", () => {
    const built = probe();
    for (const name of Object.keys(metadata.relations)) {
      assert.isTrue(name in built.relations, name);
    }
    assert.isAbove(metadata.rules.length, 0);
  });

  it("keys the arms by the general category's LOM handles", () => {
    assert.deepStrictEqual(Object.keys(metadata.arms).toSorted(), [...generalHandles].toSorted());
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
});
