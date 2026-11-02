import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as html from "#qti/schema/html.ts";
import * as asiKinds from "#qti/schema/kinds/asi.ts";
import * as htmlKinds from "#qti/schema/kinds/html.ts";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * A statement of the probe schema.
 */
type Statement = (typeof node.rules | typeof item.rules | typeof html.rules)[number];

/**
 * A relation a statement of the probe schema names.
 */
type Relation =
  | Extract<Statement, { readonly kind: "key" }>["relation"]
  | Extract<Statement, { readonly kind: "contained" }>["left"]["source"];

/**
 * The field lists of the key statements `rules` declares over `source`.
 */
const keysOf = (rules: readonly Statement[], source: Relation): readonly (readonly string[])[] =>
  rules.flatMap((rule) =>
    rule.kind === "key" && rule.relation === source ? [[...rule.fields]] : [],
  );

/**
 * The containments `rules` declares from `source`, each as the source fields, the target relation
 * and the target fields.
 */
const containments = (
  rules: readonly Statement[],
  source: Relation,
): readonly (readonly [readonly string[], unknown, readonly string[]])[] =>
  rules.flatMap((rule) =>
    rule.kind === "contained" && rule.left.source === source
      ? [[[...rule.left.fields], rule.right.source, [...rule.right.fields]] as const]
      : [],
  );

describe("item", () => {
  it("builds the probe schema over node, item and html without refusal", () => {
    const probe = schema(
      "QtiItemProbe",
      { ...node.relations, ...item.relations, ...html.relations },
      [...node.rules, ...item.rules, ...html.rules],
    );
    for (const name of [
      "AssessmentItem",
      "DeclaredAdaptive",
      "ItemBody",
      "Prompt",
      "P",
      "Img",
      "ImgLongdesc",
      "ImgHeight",
      "ImgWidth",
    ]) {
      assert.property(probe.relations, name);
    }
  });

  it("keys ItemBody by item and Prompt by parent beside their primary keys", () => {
    assert.deepStrictEqual([...item.relations.ItemBody.primaryKey], ["id"]);
    assert.deepStrictEqual(keysOf(item.rules, item.relations.ItemBody), [["item"]]);
    assert.deepStrictEqual([...item.relations.Prompt.primaryKey], ["id"]);
    assert.deepStrictEqual(keysOf(item.rules, item.relations.Prompt), [["parent"]]);
  });

  it("contains ItemBody and Prompt in Edge, and a declared adaptive in AssessmentItem", () => {
    assert.deepStrictEqual(containments(item.rules, item.relations.ItemBody), [
      [["id", "item"], node.relations.Edge, ["child", "parent"]],
    ]);
    assert.deepStrictEqual(containments(item.rules, item.relations.Prompt), [
      [["id", "parent"], node.relations.Edge, ["child", "parent"]],
    ]);
    assert.deepStrictEqual(containments(item.rules, item.relations.DeclaredAdaptive), [
      [["node"], item.relations.AssessmentItem, ["id"]],
    ]);
  });

  it("gives AssessmentItem its two boolean attributes and no identifier or title", () => {
    const { fields } = item.relations.AssessmentItem;
    assert.deepStrictEqual(Object.keys(fields), ["adaptive", "id", "timeDependent"]);
    assert.strictEqual(fields.adaptive.pattern.source, patterns.xsBoolean);
    assert.strictEqual(fields.timeDependent.pattern.source, patterns.xsBoolean);
  });

  it("gives Img a preserved alt, an anyUri src and three optional-value rows", () => {
    const { fields } = html.relations.Img;
    assert.deepStrictEqual(Object.keys(fields), ["alt", "id", "src"]);
    assert.strictEqual(fields.alt.pattern.source, patterns.xsString);
    assert.strictEqual(fields.alt.pattern.flags, patterns.xsStringFlags);
    assert.strictEqual(fields.src.pattern.source, patterns.anyUri);

    const optional = [
      [html.relations.ImgLongdesc, patterns.anyUri],
      [html.relations.ImgHeight, patterns.lengthDType],
      [html.relations.ImgWidth, patterns.lengthDType],
    ] as const;

    for (const [relation, pattern] of optional) {
      assert.deepStrictEqual([...relation.primaryKey], ["node"]);
      assert.strictEqual(relation.fields.value.pattern.source, pattern);
      assert.deepStrictEqual(containments(html.rules, relation), [
        [["node"], html.relations.Img, ["id"]],
      ]);
    }
  });

  it("keys the arms by their NodeKind handles: three for item, two for html", () => {
    assert.deepStrictEqual(Object.keys(item.arms), [
      "qti-assessment-item",
      "qti-item-body",
      "qti-prompt",
    ]);
    assert.deepStrictEqual(Object.keys(html.arms), ["img", "p"]);
    for (const arm of [...Object.values(item.arms), ...Object.values(html.arms)]) {
      assert.deepStrictEqual([...arm.primaryKey], ["id"]);
    }
    for (const handle of [...Object.keys(item.arms), ...Object.keys(html.arms)]) {
      assert.include(node.relations.NodeKind.handles, handle);
    }
  });

  describe("admission rows of the ASI and HTML kinds", () => {
    const rows = [...asiKinds.admission, ...htmlKinds.admission];

    /**
     * The kinds that admit any child: the derived host set. A declared kind with no content model,
     * such as HTML's `template`, is not a host.
     */
    const hosts = [...new Set(rows.map((row) => row.parent))].toSorted();
    const versions = ["3.0.0", "3.0.1"] as const;
    const has = (parent: string, child: string, version: string): boolean =>
      rows.some((r) => r.parent === parent && r.child === child && r.version === version);

    const key = (version: string): readonly string[] =>
      rows
        .filter((r) => r.version === version)
        .map((r) => `${r.parent}>${r.child}`)
        .toSorted();

    const present = [
      ["qti-item-body", "p"],
      ["qti-item-body", "qti-choice-interaction"],
      ["qti-item-body", "ws"],
      ["qti-choice-interaction", "qti-prompt"],
      ["qti-choice-interaction", "qti-simple-choice"],
      ["p", "img"],
      ["p", "text"],
      ["p", "ws"],
      ["qti-prompt", "text"],
      ["qti-simple-choice", "text"],
      ["qti-value", "text"],
      ["qti-value", "ws"],
      ["qti-value", "entityRef"],
      ["qti-value", "comment"],
      ["img", "comment"],
      ["img", "pi"],
    ] as const;

    const absent = [
      ["qti-prompt", "qti-simple-choice"],
      ["qti-value", "p"],
      ["img", "text"],
      ["img", "ws"],
      ["qti-item-body", "text"],
    ] as const;

    it("admits each present pair under both versions", () => {
      for (const [parent, child] of present) {
        for (const version of versions) {
          assert.isTrue(has(parent, child, version), `${parent} > ${child} @ ${version}`);
        }
      }
    });

    it("refuses each absent pair under both versions", () => {
      for (const [parent, child] of absent) {
        for (const version of versions) {
          assert.isFalse(has(parent, child, version), `${parent} > ${child} @ ${version}`);
        }
      }
    });

    it("gives every host (a kind that admits any child) a comment row and a pi row, and both versions the same rows", () => {
      assert.includeMembers([...asiKinds.kinds, ...htmlKinds.kinds], hosts);
      assert.includeMembers(hosts, [...Object.keys(item.arms), ...Object.keys(html.arms)]);
      for (const host of hosts) {
        for (const version of versions) {
          assert.isTrue(has(host, "comment", version), `${host} comment @ ${version}`);
          assert.isTrue(has(host, "pi", version), `${host} pi @ ${version}`);
        }
      }
      assert.deepStrictEqual(key("3.0.0"), key("3.0.1"));
    });
  });
});
