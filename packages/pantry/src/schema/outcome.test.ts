import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as declaration from "#pantry/schema/declaration.ts";
import * as document from "#pantry/schema/document.ts";
import * as node from "#pantry/schema/node.ts";
import * as outcome from "#pantry/schema/outcome.ts";
import * as pkg from "#pantry/schema/package.ts";
import * as value from "#pantry/schema/value.ts";

/**
 * The schema over the modules `OutcomeDocument` binds and the module itself.
 */
const probe = () =>
  schema(
    "P4OutcomeProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...value.relations,
      ...outcome.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...value.rules,
      ...outcome.rules,
    ],
  );

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

const containedOf = () => outcome.rules.filter((rule) => rule.kind === "contained");

const mirrorsOf = () => outcome.rules.filter((rule) => rule.kind === "mirrors");

describe("outcome", () => {
  it("builds a schema over the modules it binds without refusal", () => {
    const built = probe();
    assert.isTrue("OutcomeDocument" in built.relations);
  });

  it("exports exactly OutcomeDocument, keyed by document, and no node arm", () => {
    assert.deepStrictEqual(Object.keys(outcome.relations), ["OutcomeDocument"]);
    assert.deepStrictEqual([...outcome.relations.OutcomeDocument.primaryKey], ["document"]);
    assert.deepStrictEqual(Object.keys(outcome.relations.OutcomeDocument.fields).toSorted(), [
      "declaration",
      "document",
      "identifier",
    ]);
    assert.deepStrictEqual(outcome.arms, {});
  });

  it("holds the four containments, each from OutcomeDocument", () => {
    const targets = containedOf().map((rule) => [
      rule.left.source,
      [...rule.left.fields],
      rule.right.source,
      [...rule.right.fields],
    ]);
    assert.deepStrictEqual(targets, [
      [
        outcome.relations.OutcomeDocument,
        ["document", "declaration"],
        node.TreeRoot,
        ["tree", "node"],
      ],
      [
        outcome.relations.OutcomeDocument,
        ["declaration", "document", "identifier"],
        declaration.Declaration,
        ["id", "document", "identifier"],
      ],
      [
        outcome.relations.OutcomeDocument,
        ["declaration"],
        declaration.OutcomeDeclarationArm,
        ["id"],
      ],
      [
        outcome.relations.OutcomeDocument,
        ["document", "identifier"],
        document.DocumentIdentifier,
        ["document", "value"],
      ],
    ]);
  });

  it("mirrors the outcome documents onto OutcomeDocument by document", () => {
    const [rule, ...rest] = mirrorsOf();
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.right.source, outcome.relations.OutcomeDocument);
    assert.deepStrictEqual([...(rule?.right.fields ?? [])], ["document"]);

    const selection = selectionOf(rule?.left ?? { source: {} });
    assert.strictEqual(selection?.relation, document.Document);
    assert.deepStrictEqual(selection?.bindings, { root: "outcomes" });
    assert.deepStrictEqual([...(rule?.left.fields ?? [])], ["id"]);
  });

  it("is not yet in the qti module's relations", () => {
    for (const held of Object.values(declaration.relations)) {
      assert.isFalse(Object.is(held, outcome.relations.OutcomeDocument));
    }
  });
});
