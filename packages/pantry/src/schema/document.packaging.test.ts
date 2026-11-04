import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as document from "#pantry/schema/document.ts";
import * as metadata from "#pantry/schema/metadata.ts";
import * as node from "#pantry/schema/node.ts";
import { RootKind } from "#pantry/schema/node.ts";
import * as pkg from "#pantry/schema/package.ts";
import { Qti } from "#pantry/schema/qti.ts";
import { rootOfType } from "#pantry/schema/seed/root-of-type.ts";

/**
 * The root handles the first milestone wrote, in their order.
 */
const m0Roots = [
  "item",
  "test",
  "section",
  "stimulus",
  "rptemplate",
  "outcomes",
  "usagedata",
  "manifest",
] as const;

/**
 * The capacity statements of the document module.
 */
const capacities = () => document.rules.flatMap((rule) => (rule.kind === "capacity" ? [rule] : []));

type Capacity = ReturnType<typeof capacities>[number];

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose.
 */
const boundsOf = (rule: Capacity | undefined): readonly [unknown, unknown] | undefined => {
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
 * The root handle a capacity statement selects `Document` on, when it selects on `root`.
 */
const rootOf = (rule: Capacity): string | undefined => {
  const source: unknown = rule.target.source;

  return Predicate.hasProperty(source, "relation") &&
    source.relation === document.relations.Document &&
    Predicate.hasProperty(source, "bindings") &&
    Predicate.hasProperty(source.bindings, "root")
    ? String(source.bindings.root)
    : undefined;
};

/**
 * Whether the root-of-type table holds the pair.
 */
const hasRootType = (root: string, type: string) =>
  rootOfType.some((row) => row.root === root && row.type === type);

describe("document packaging", () => {
  it("lists externalLom in RootKind after every first-milestone handle", () => {
    const handles: readonly string[] = RootKind.handles;
    const at = handles.indexOf("externalLom");
    assert.isAbove(at, -1);
    for (const handle of m0Roots) {
      assert.isBelow(handles.indexOf(handle), at, handle);
    }
  });

  it("types the external metadata record and the response-processing template", () => {
    assert.isTrue(hasRootType("externalLom", "resourcemetadata/xml"));
    assert.isTrue(hasRootType("rptemplate", "imsqti_resprocessing_xmlv3p0"));
    assert.isTrue(hasRootType("item", "imsqti_item_xmlv3p0"));
    assert.isTrue(hasRootType("usagedata", "qtiusagedata/xml"));
  });

  it("counts an external record's identifier and title as none, per root handle", () => {
    for (const relation of [
      document.relations.DocumentIdentifier,
      document.relations.DocumentTitle,
    ]) {
      const rows = capacities().filter((rule) => rule.from.source === relation);
      for (const handle of RootKind.handles) {
        assert.isTrue(
          rows.some((rule) => rootOf(rule) === handle),
          `${relation.name} ${handle}`,
        );
      }
      const external = rows.find((rule) => rootOf(rule) === "externalLom");
      assert.deepStrictEqual(boundsOf(external), [0n, 0n], relation.name);
    }
  });

  it("names the four owner arms of Lom", () => {
    const [rule, ...rest] = metadata.rules.filter(
      (candidate) => candidate.kind === "alternatives" && candidate.parent === metadata.Lom,
    );
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.kind, "alternatives");
    if (rule?.kind !== "alternatives") {
      return;
    }

    assert.deepStrictEqual(
      Object.entries(rule.arms).toSorted(([a], [b]) => a.localeCompare(b)),
      [
        ["external", metadata.ExternalLom],
        ["file", metadata.FileLom],
        ["manifest", metadata.ManifestLom],
        ["resource", metadata.ResourceLom],
      ],
    );
  });

  it("mirrors ExternalLom's document on the Documents of root externalLom", () => {
    const rules = metadata.rules.filter(
      (rule) => rule.kind === "mirrors" && rule.right.source === metadata.ExternalLom,
    );
    assert.strictEqual(rules.length, 1);

    const left: unknown = rules[0]?.kind === "mirrors" ? rules[0].left.source : undefined;
    assert.isTrue(Predicate.hasProperty(left, "relation"));
    assert.isTrue(
      Predicate.hasProperty(left, "relation") &&
        left.relation === document.relations.Document &&
        Predicate.hasProperty(left, "bindings") &&
        Predicate.hasProperty(left.bindings, "root") &&
        left.bindings.root === "externalLom",
    );
  });

  it("keeps FileLom without a key over file", () => {
    const keys = metadata.rules.flatMap((rule) =>
      rule.kind === "key" && Object.is(rule.relation, metadata.FileLom) ? [[...rule.fields]] : [],
    );
    assert.deepStrictEqual([...metadata.FileLom.primaryKey], ["lom"]);
    assert.deepStrictEqual(keys, []);
  });

  it("composes OutcomeDocument and the file metadata into Qti", () => {
    assert.isTrue("OutcomeDocument" in Qti.relations);
    assert.isTrue("FileLom" in Qti.relations);
    assert.isTrue("ExternalLom" in Qti.relations);
    assert.isTrue("FileMetadata" in Qti.relations);
  });

  it("builds a probe over the composed modules", () => {
    const built = schema(
      "P4RecordRootProbe",
      {
        ...node.relations,
        ...pkg.relations,
        ...document.relations,
        ...metadata.relations,
      },
      [...node.rules, ...pkg.rules, ...document.rules, ...metadata.rules],
    );
    assert.isTrue("ExternalLom" in built.relations);
  });
});
