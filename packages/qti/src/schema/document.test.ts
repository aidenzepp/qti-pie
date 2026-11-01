import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as document from "#qti/schema/document.ts";
import * as node from "#qti/schema/node.ts";
import { RootKind } from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";

/**
 * The schema over node's, package's and this module's relations and rules.
 */
const probe = () =>
  schema("QtiDocumentProbe", { ...node.relations, ...pkg.relations, ...document.relations }, [
    ...node.rules,
    ...pkg.rules,
    ...document.rules,
  ]);

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose.
 */
const boundsOf = (rule: Capacity): readonly [unknown, unknown] => {
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
const capacities = () => document.rules.flatMap((rule) => (rule.kind === "capacity" ? [rule] : []));

type Capacity = ReturnType<typeof capacities>[number];

/**
 * The root handle a capacity statement selects `Document` on, when it selects on `root` alone.
 */
const rootOf = (rule: Capacity): string | undefined => {
  const source: unknown = rule.target.source;
  if (
    Predicate.hasProperty(source, "relation") &&
    source.relation === document.relations.Document &&
    Predicate.hasProperty(source, "bindings") &&
    Predicate.hasProperty(source.bindings, "root") &&
    Object.keys(source.bindings).length === 1
  ) {
    return Predicate.isString(source.bindings.root) ? source.bindings.root : undefined;
  }

  return undefined;
};

/**
 * The capacity statements of this module that count rows of `from` per selected document, by root.
 */
const countsOf = (
  from: typeof document.relations.DocumentIdentifier | typeof document.relations.DocumentTitle,
) =>
  capacities()
    .filter((rule) => rule.from.source === from)
    .map((rule) => ({ bounds: boundsOf(rule), root: rootOf(rule) }));

/**
 * The bounds each root handle carries for identifiers.
 */
const identifierBounds = {
  item: [1n, 1n],
  manifest: [0n, 0n],
  outcomes: [1n, 1n],
  rptemplate: [0n, 0n],
  section: [1n, 1n],
  stimulus: [1n, 1n],
  test: [1n, 1n],
  usagedata: [0n, 0n],
} as const;

/**
 * The bounds each root handle carries for titles.
 */
const titleBounds = {
  ...identifierBounds,
  outcomes: [0n, 0n],
} as const;

describe("document", () => {
  it("builds a schema over node, package and document relations and rules without refusal", () => {
    const built = probe();
    for (const name of Object.keys(document.relations)) {
      assert.isTrue(name in built.relations, name);
    }
    assert.strictEqual(
      built.statements.length,
      node.rules.length + pkg.rules.length + document.rules.length,
    );
  });

  it("declares the document relations and the IdHolder roster", () => {
    assert.deepStrictEqual(Object.keys(document.relations).toSorted(), [
      "Document",
      "DocumentId",
      "DocumentIdentifier",
      "DocumentTitle",
      "IdHolder",
    ]);
    assert.deepStrictEqual(document.relations.IdHolder.handles, ["responseDeclaration"]);
  });

  it("keeps the item root's arm out of this module", () => {
    assert.deepStrictEqual(document.arms, {});
  });

  it("holds one identifier capacity per root handle, with the bounds above", () => {
    const rows = countsOf(document.relations.DocumentIdentifier);
    assert.strictEqual(rows.length, RootKind.handles.length);
    for (const handle of RootKind.handles) {
      const row = rows.find((entry) => entry.root === handle);
      assert.isDefined(row, `identifier ${handle}`);
      assert.deepStrictEqual(row.bounds, identifierBounds[handle], `identifier ${handle}`);
    }
  });

  it("holds one title capacity per root handle, with the bounds above", () => {
    const rows = countsOf(document.relations.DocumentTitle);
    assert.strictEqual(rows.length, RootKind.handles.length);
    for (const handle of RootKind.handles) {
      const row = rows.find((entry) => entry.root === handle);
      assert.isDefined(row, `title ${handle}`);
      assert.deepStrictEqual(row.bounds, titleBounds[handle], `title ${handle}`);
    }
  });

  it("holds the capacity statements it declares, one per root handle for each counted relation", () => {
    assert.strictEqual(capacities().length, 2 * RootKind.handles.length);
    for (const rule of capacities()) {
      assert.deepStrictEqual([...rule.target.fields], ["id"]);
      assert.isDefined(rootOf(rule));
    }
  });
});
