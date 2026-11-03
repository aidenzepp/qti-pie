import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as document from "#qti/schema/document.ts";
import * as node from "#qti/schema/node.ts";
import { RootKind } from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";

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
 * The bounds `document.ts` gives any root handle's count: none, or exactly one.
 */
const countBounds: readonly (readonly [unknown, unknown])[] = [
  [0n, 0n],
  [1n, 1n],
];

/**
 * The identifier bounds of phase 1's root handles.
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
 * The title bounds of phase 1's root handles.
 */
const titleBounds = {
  ...identifierBounds,
  outcomes: [0n, 0n],
} as const;

/**
 * The relations of the holder arms `IdHolder` gains beyond `responseDeclaration`.
 */
const holderArms = ["HtmlId", "ItemBodyId", "PrintedVariableId", "ContextDeclarationId"] as const;

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

  it("bounds the collapsed title of a document by boundedToken", () => {
    assert.deepStrictEqual(document.relations.DocumentTitle.fields.collapsed.pattern, {
      flags: patterns.boundedTokenFlags,
      source: patterns.boundedToken,
    });
  });

  it("declares the document relations and the IdHolder roster", () => {
    assert.deepStrictEqual(
      Object.keys(document.relations).toSorted(),
      [
        "Document",
        "DocumentId",
        "DocumentIdentifier",
        "ContextDeclarationId",
        "DocumentTitle",
        "HtmlId",
        "IdHolder",
        "ItemBodyId",
        "PrintedVariableId",
      ].toSorted(),
    );
    assert.deepStrictEqual(document.relations.IdHolder.handles, [
      "responseDeclaration",
      "htmlId",
      "itemBody",
      "printedVariable",
      "contextDeclaration",
    ]);
  });

  it("keys each holder arm on its node, beside its primary key", () => {
    for (const name of holderArms) {
      const arm = document.relations[name];
      const keys = document.rules.flatMap((rule) =>
        rule.kind === "key" && rule.relation === arm ? [[...rule.fields]] : [],
      );
      assert.deepStrictEqual(keys, [["node"]], name);
    }
  });

  it("keeps the item root's arm out of this module", () => {
    assert.deepStrictEqual(document.arms, {});
  });

  it("holds one identifier capacity per root handle, of none or one, phase 1's at the bounds above", () => {
    const rows = countsOf(document.relations.DocumentIdentifier);
    const roots: string[] = [...RootKind.handles];
    assert.strictEqual(rows.length, roots.length);
    for (const handle of roots) {
      const row = rows.find((entry) => entry.root === handle);
      assert.isDefined(row, `identifier ${handle}`);
      assert.deepInclude(countBounds, row.bounds, `identifier ${handle}`);
    }
    assert.includeMembers(roots, Object.keys(identifierBounds));
    for (const [handle, bounds] of Object.entries(identifierBounds)) {
      const row = rows.find((entry) => entry.root === handle);
      assert.isDefined(row, `identifier ${handle}`);
      assert.deepStrictEqual(row.bounds, bounds, `identifier ${handle}`);
    }
  });

  it("holds one title capacity per root handle, of none or one, phase 1's at the bounds above", () => {
    const rows = countsOf(document.relations.DocumentTitle);
    const roots: string[] = [...RootKind.handles];
    assert.strictEqual(rows.length, roots.length);
    for (const handle of roots) {
      const row = rows.find((entry) => entry.root === handle);
      assert.isDefined(row, `title ${handle}`);
      assert.deepInclude(countBounds, row.bounds, `title ${handle}`);
    }
    assert.includeMembers(roots, Object.keys(titleBounds));
    for (const [handle, bounds] of Object.entries(titleBounds)) {
      const row = rows.find((entry) => entry.root === handle);
      assert.isDefined(row, `title ${handle}`);
      assert.deepStrictEqual(row.bounds, bounds, `title ${handle}`);
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
