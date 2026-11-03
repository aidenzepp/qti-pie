import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import {
  admission as lomAdmission,
  kinds as lomKinds,
  registry as lomRegistry,
} from "#qti/schema/kinds/lom.ts";
import {
  admission as qmdAdmission,
  kinds as qmdKinds,
  registry as qmdRegistry,
} from "#qti/schema/kinds/qmd.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as document from "#qti/schema/document.ts";
import * as metadata from "#qti/schema/metadata.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import { admission as seedAdmission } from "#qti/schema/seed/admission.ts";

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
 * The handles this module declares arms for: every LOM kind and every QMD kind.
 */
const armHandles = [...lomKinds, ...qmdKinds];

/**
 * The fields of each candidate key declared on a relation, `id` aside.
 */
const keysOf = (target: (typeof metadata.relations)[keyof typeof metadata.relations]) =>
  metadata.rules.flatMap((rule) =>
    rule.kind === "key" && rule.relation === target ? [[...rule.fields]] : [],
  );

/**
 * The leaves of the QMD vocabulary: every kind but the two containers.
 */
const qmdLeaves = qmdKinds.filter(
  (kind) => kind !== "qmd:qtiMetadata" && kind !== "qmd:portableCustomInteractionContext",
);

/**
 * Whether the admission rows of both versions hold the pair.
 */
const admits = (
  rows: readonly { readonly child: string; readonly parent: string; readonly version: string }[],
  parent: string,
  child: string,
) =>
  ["3.0.0", "3.0.1"].every((version) =>
    rows.some((row) => row.parent === parent && row.child === child && row.version === version),
  );

describe("metadata", () => {
  it("builds a schema over node, package, document and metadata relations and rules without refusal", () => {
    const built = probe();
    for (const name of Object.keys(metadata.relations)) {
      assert.isTrue(name in built.relations, name);
    }
    assert.isAbove(metadata.rules.length, 0);
  });

  it("bounds the collapsed form of the key-shaped fields by boundedToken and leaves LomString", () => {
    const bounded = { flags: patterns.boundedTokenFlags, source: patterns.boundedToken };
    for (const fields of [
      metadata.relations.LomTitle.fields,
      metadata.relations.LomObjectTitle.fields,
      metadata.relations.LomIdentifierEntry.fields,
    ]) {
      assert.deepStrictEqual(fields.collapsed.pattern, bounded);
    }
    assert.strictEqual(
      metadata.relations.LomString.fields.collapsed.pattern.source,
      patterns.xsToken,
    );
  });

  it("keys the arms by the LOM category handles and the QMD handles", () => {
    assert.deepStrictEqual(Object.keys(metadata.arms).toSorted(), [...armHandles].toSorted());
    for (const handle of Object.keys(metadata.arms)) {
      assert.isTrue(
        [...lomKinds, ...qmdKinds].some((kind) => kind === handle),
        handle,
      );
    }
  });

  it("holds one alternatives statement on Lom by owner, whose arms are owner relations, the manifest's and the resource's among them", () => {
    const rule = alternativesOf().find(
      (candidate) => candidate.roster === metadata.relations.LomOwner,
    );
    assert.isDefined(rule, "alternatives statement");
    assert.strictEqual(rule.discriminator, "owner");
    assert.strictEqual(rule.roster, metadata.relations.LomOwner);
    assert.includeMembers(Object.keys(rule.arms), ["manifest", "resource"]);
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

  it("gives every element of the spec's 3.5 metadata inventory a handle, a registry row and an arm", () => {
    const inventory = [
      ...[
        "catalog",
        "description",
        "entry",
        "format",
        "general",
        "identifier",
        "language",
        "lifeCycle",
        "location",
        "lom",
        "metaMetadata",
        "metadataschema",
        "rights",
        "source",
        "status",
        "string",
        "technical",
        "title",
        "value",
        "version",
      ].map((local) => ({ handle: `lom:${local}`, local })),
      ...[
        "composite",
        "feedbackType",
        "interactionType",
        "qtiMetadata",
        "solutionAvailable",
        "timeDependent",
        "toolName",
        "toolVendor",
        "toolVersion",
      ].map((local) => ({ handle: `qmd:${local}`, local })),
    ];
    const registry = new Map<string, string>(
      [...Object.entries(lomRegistry), ...Object.entries(qmdRegistry)].map(([handle, row]) => [
        handle,
        row.local,
      ]),
    );
    for (const { handle, local } of inventory) {
      assert.isTrue(
        [...lomKinds, ...qmdKinds].some((kind) => kind === handle),
        `${handle} handle`,
      );
      assert.strictEqual(registry.get(handle), local, `${handle} registry`);
      assert.isTrue(handle in metadata.arms, `${handle} arm`);
    }
  });

  it("keys QtiMetadata by resource and each 0..1 qmd leaf by its qtiMetadata, the repeated two by none", () => {
    const qtiMetadataKeys = keysOf(metadata.relations.QtiMetadata);
    assert.isAbove(qtiMetadataKeys.length, 0);
    for (const fields of qtiMetadataKeys) {
      assert.include(fields, "resource");
    }

    const single = {
      QmdComposite: metadata.relations.QmdComposite,
      QmdFeedbackType: metadata.relations.QmdFeedbackType,
      QmdItemTemplate: metadata.relations.QmdItemTemplate,
      QmdPortableCustomInteractionContext: metadata.relations.QmdPortableCustomInteractionContext,
      QmdSolutionAvailable: metadata.relations.QmdSolutionAvailable,
      QmdTimeDependent: metadata.relations.QmdTimeDependent,
      QmdToolName: metadata.relations.QmdToolName,
      QmdToolVendor: metadata.relations.QmdToolVendor,
      QmdToolVersion: metadata.relations.QmdToolVersion,
    };
    for (const [name, target] of Object.entries(single)) {
      assert.deepStrictEqual(keysOf(target), [["qtiMetadata"]], name);
    }
    assert.deepStrictEqual(keysOf(metadata.relations.QmdInteractionType), []);
    assert.deepStrictEqual(keysOf(metadata.relations.QmdScoringMode), []);
    assert.deepStrictEqual(keysOf(metadata.relations.QmdCustomTypeIdentifier), [["context"]]);
    assert.deepStrictEqual(keysOf(metadata.relations.QmdInteractionKind), [["context"]]);
  });

  it("binds each LomTitle's position to the position of its Edge", () => {
    const bound = metadata.rules.flatMap((rule) =>
      rule.kind === "contained" &&
      rule.left.source === metadata.relations.LomTitle &&
      rule.right.source === node.relations.Edge &&
      rule.left.fields.join(",") === "id,position" &&
      rule.right.fields.join(",") === "child,position"
        ? [rule]
        : [],
    );
    assert.strictEqual(bound.length, 1);
  });

  it("binds each LomLanguage's parentKind to the parentKind of its Edge", () => {
    assert.deepStrictEqual(Object.keys(metadata.relations.LomLanguage.fields), [
      "id",
      "lom",
      "owner",
      "parentKind",
      "position",
      "value",
    ]);

    const bound = metadata.rules.flatMap((rule) =>
      rule.kind === "contained" &&
      rule.left.source === metadata.relations.LomLanguage &&
      rule.right.source === node.relations.Edge &&
      rule.left.fields.join(",") === "id,parentKind" &&
      rule.right.fields.join(",") === "child,parentKind"
        ? [rule]
        : [],
    );
    assert.strictEqual(bound.length, 1);
  });

  it("admits lom:contribute under lom:lifeCycle and lom:metaMetadata only", () => {
    const parents = new Set(
      seedAdmission.filter((row) => row.child === "lom:contribute").map((row) => row.parent),
    );
    assert.deepStrictEqual([...parents].toSorted(), ["lom:lifeCycle", "lom:metaMetadata"]);
    for (const parent of parents) {
      assert.isTrue(admits(seedAdmission, parent, "lom:contribute"), parent);
    }
  });

  it("admits character data, whitespace, entity references, comments and processing instructions under every qmd leaf", () => {
    assert.strictEqual(qmdLeaves.length, 12);
    for (const leaf of qmdLeaves) {
      for (const child of ["text", "ws", "entityRef", "comment", "pi"]) {
        assert.isTrue(admits(qmdAdmission, leaf, child), `(${leaf}, ${child})`);
      }
    }
  });

  it("admits the qtiMetadata children in the order the schema lists them and no text under it", () => {
    for (const child of [
      "qmd:itemTemplate",
      "qmd:timeDependent",
      "qmd:composite",
      "qmd:interactionType",
      "qmd:portableCustomInteractionContext",
      "qmd:feedbackType",
      "qmd:solutionAvailable",
      "qmd:scoringMode",
      "qmd:toolName",
      "qmd:toolVersion",
      "qmd:toolVendor",
      "ws",
      "comment",
      "pi",
    ]) {
      assert.isTrue(admits(qmdAdmission, "qmd:qtiMetadata", child), child);
    }
    assert.isFalse(
      qmdAdmission.some((row) => row.parent === "qmd:qtiMetadata" && row.child === "text"),
    );
    for (const child of [
      "qmd:customTypeIdentifier",
      "qmd:interactionKind",
      "ws",
      "comment",
      "pi",
    ]) {
      assert.isTrue(admits(qmdAdmission, "qmd:portableCustomInteractionContext", child), child);
    }
  });

  it("admits comments and processing instructions under every LOM host and text under lom:string", () => {
    const hosts = new Set(lomAdmission.map((row) => row.parent));
    assert.isAbove(hosts.size, 0);
    for (const host of hosts) {
      assert.isTrue(admits(lomAdmission, host, "comment"), `(${host}, comment)`);
      assert.isTrue(admits(lomAdmission, host, "pi"), `(${host}, pi)`);
    }
    assert.isTrue(admits(lomAdmission, "lom:string", "text"));
  });

  it("holds the four qmd booleans and three vocabularies to their rosters", () => {
    const { relations } = metadata;
    const closed: readonly (readonly [{ readonly roster: unknown }, unknown])[] = [
      [relations.QmdItemTemplate.fields.value, rosters.XsBoolean],
      [relations.QmdTimeDependent.fields.value, rosters.XsBoolean],
      [relations.QmdComposite.fields.value, rosters.XsBoolean],
      [relations.QmdSolutionAvailable.fields.value, rosters.XsBoolean],
      [relations.QmdInteractionType.fields.value, rosters.QmdInteractionTypeValue],
      [relations.QmdFeedbackType.fields.value, rosters.QmdFeedbackTypeValue],
      [relations.QmdScoringMode.fields.value, rosters.QmdScoringModeValue],
    ];

    assert.strictEqual(closed.length, 7);
    for (const [field, roster] of closed) {
      assert.strictEqual(field.roster, roster);
    }
  });
});
