import { NodeServices } from "@effect/platform-node";
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import path from "node:path";
import { inject } from "vitest";
import { itemRows } from "#qti/import/item.ts";
import { manifestRows } from "#qti/import/manifest.ts";
import { Rows } from "#qti/import/tree.ts";
import { listPackage } from "#qti/package/read.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import * as document from "#qti/schema/document.ts";
import * as metadata from "#qti/schema/metadata.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as html from "#qti/schema/html.ts";
import * as asiKinds from "#qti/schema/kinds/asi.ts";
import * as htmlKinds from "#qti/schema/kinds/html.ts";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as contracts from "#qti/schema/contracts.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * A statement of the probe schema.
 */
type Statement = (
  | typeof node.rules
  | typeof item.rules
  | typeof html.rules
  | typeof metadata.rules
)[number];

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

/**
 * The source of a column's base pattern, whether the column is a bare pattern or a contract over
 * one.
 */
const sourceOf = (
  field:
    | { readonly pattern: { readonly source: string } }
    | { readonly base: { readonly pattern: { readonly source: string } } },
): string => ("base" in field ? field.base.pattern.source : field.pattern.source);

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

  it("gives AssessmentItem its two boolean attributes and its tree, and no identifier or title", () => {
    const { fields } = item.relations.AssessmentItem;
    assert.deepStrictEqual(Object.keys(fields), ["adaptive", "id", "timeDependent", "tree"]);
    assert.strictEqual(fields.adaptive.roster, rosters.XsBoolean);
    assert.strictEqual(fields.timeDependent.roster, rosters.XsBoolean);
  });

  it("gives Img a preserved alt, an anyUri src and three optional-value rows", () => {
    const { fields } = html.relations.Img;
    assert.deepStrictEqual(Object.keys(fields), ["alt", "id", "src"]);
    assert.strictEqual(fields.alt.pattern.source, patterns.xsString);
    assert.strictEqual(fields.alt.pattern.flags, patterns.xsStringFlags);
    assert.strictEqual(fields.src.base.pattern.source, patterns.anyUri);

    const optional = [
      [html.relations.ImgLongdesc, patterns.anyUri],
      [html.relations.ImgHeight, patterns.lengthDType],
      [html.relations.ImgWidth, patterns.lengthDType],
    ] as const;

    for (const [relation, pattern] of optional) {
      assert.deepStrictEqual([...relation.primaryKey], ["node"]);
      assert.strictEqual(sourceOf(relation.fields.value), pattern);
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

  describe("the item root of phase 2", () => {
    it("keys AssessmentItem by tree beside its primary key and contains the tree in Node", () => {
      assert.property(item.relations.AssessmentItem.fields, "tree");
      assert.deepStrictEqual(keysOf(item.rules, item.relations.AssessmentItem), [["tree"]]);
      assert.deepStrictEqual(
        containments(item.rules, item.relations.AssessmentItem).filter(
          ([fields]) => fields.join(",") === "id,tree",
        ),
        [[["id", "tree"], node.relations.Node, ["id", "tree"]]],
      );
    });

    it("gives the root label its replace-class value, its version and the Node containment", () => {
      const label = item.relations.AssessmentItemLabel;
      assert.deepStrictEqual(Object.keys(label.fields), ["node", "tree", "value", "version"]);
      assert.deepStrictEqual([...label.primaryKey], ["node"]);
      assert.deepStrictEqual(containments(item.rules, label), [
        [["node", "tree", "version"], node.relations.Node, ["id", "tree", "version"]],
      ]);
    });

    it("keys ItemTool by tree, contains it in AssessmentItem and gives it three arms", () => {
      const tool = item.relations.ItemTool;
      assert.deepStrictEqual(Object.keys(tool.fields), ["shape", "tree"]);
      assert.deepStrictEqual([...tool.primaryKey], ["tree"]);
      assert.deepStrictEqual(containments(item.rules, tool), [
        [["tree"], item.relations.AssessmentItem, ["tree"]],
      ]);

      const alternatives = item.rules.filter((rule) => rule.kind === "alternatives");
      assert.strictEqual(alternatives.length, 1);
      assert.deepStrictEqual(Object.keys(alternatives[0]?.arms ?? {}), [
        "both",
        "nameOnly",
        "versionOnly",
      ]);
      for (const arm of [
        item.relations.ItemToolBoth,
        item.relations.ItemToolName,
        item.relations.ItemToolVersion,
      ]) {
        assert.deepStrictEqual([...arm.primaryKey], ["tree"]);
      }
    });

    it("contains only the 3.0.1 labels in ItemToolBoth, and no unselected label", () => {
      const both = item.relations.ItemToolBoth;
      const label = item.relations.AssessmentItemLabel;
      const rules = item.rules.flatMap((rule) =>
        rule.kind === "contained" && rule.right.source === both ? [rule] : [],
      );
      assert.strictEqual(rules.length, 1);
      assert.deepStrictEqual(rules[0]?.left.fields, ["tree"]);
      assert.deepStrictEqual(rules[0]?.right.fields, ["tree"]);
      assert.notStrictEqual(rules[0]?.left.source, label);
      assert.isTrue(
        containments(item.rules, label).every(([, target]) => target !== both),
        "the unselected label is not contained in ItemToolBoth",
      );
    });

    it("declares ToolShape among the relations, and the probe over the five modules and the package they read builds", () => {
      assert.strictEqual(item.relations.ToolShape, rosters.ToolShape);

      const probe = schema(
        "QtiItemRootProbe",
        {
          ...node.relations,
          ...document.relations,
          ...metadata.relations,
          ...pkg.relations,
          ...item.relations,
          ...html.relations,
        },
        [
          ...node.rules,
          ...document.rules,
          ...pkg.rules,
          ...metadata.rules,
          ...item.rules,
          ...html.rules,
        ],
      );
      for (const name of ["AssessmentItemLabel", "ItemTool", "ItemToolBoth", "ToolShape"]) {
        assert.property(probe.relations, name);
      }
    });

    it("gives LomLanguage its owner and contains it in Lom", () => {
      assert.property(metadata.LomLanguage.fields, "owner");
      assert.deepStrictEqual(
        containments(metadata.rules, metadata.LomLanguage)
          .filter(([fields]) => fields.join(",") === "lom,owner")
          .map(([, target, to]) => [target, to]),
        [[metadata.Lom, ["id", "owner"]]],
      );
    });
  });
});

const packageId = "22222222-2222-4222-8222-222222222222";

layer(NodeServices.layer, { excludeTestServices: true })("the importers' copies", (suite) => {
  suite.effect("an item's AssessmentItem row carries its tree id", () =>
    Effect.gen(function* itemTree() {
      const fs = yield* FileSystem.FileSystem;
      const bytes = yield* fs.readFile(path.join(inject("fixtures").simple, "choice.xml"));
      const doc = yield* readXml(bytes);
      const { documentId, rows } = yield* itemRows(
        {
          doc,
          packageId,
          path: "choice.xml",
          resource: "choice",
          resourceLomHasGeneral: true,
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.0",
        },
        Rows.empty(),
      );
      const [row, ...rest] = Rows.of(rows, item.AssessmentItem);
      assert.strictEqual(rest.length, 0);
      assert.strictEqual(row?.tree, documentId);
    }),
  );

  suite.effect("each manifest LomLanguage row carries the owner its Lom row says", () =>
    Effect.gen(function* manifestOwner() {
      const dir = inject("fixtures").simple;
      const fs = yield* FileSystem.FileSystem;
      const entries = yield* listPackage(dir);
      const bytes = yield* fs.readFile(path.join(dir, "imsmanifest.xml"));
      const doc = yield* readXml(bytes);
      const { rows } = yield* manifestRows(dir, entries, doc, Rows.empty());
      const owners = new Map(Rows.of(rows, metadata.Lom).map((lom) => [lom.id, lom.owner]));
      const languages = Rows.of(rows, metadata.LomLanguage);
      assert.isAbove(languages.length, 0);
      for (const language of languages) {
        assert.strictEqual(language.owner, owners.get(language.lom));
      }
      assert.isTrue(languages.some((language) => owners.get(language.lom) === "manifest"));
    }),
  );
});

describe("contracts (item)", () => {
  it("types the item tool name ToolName and the tool version ToolVersion", () => {
    assert.strictEqual(item.ItemToolBoth.fields.toolName.name, contracts.ToolName.name);
    assert.strictEqual(item.ItemToolBoth.fields.toolVersion.name, contracts.ToolVersion.name);
    assert.strictEqual(item.ItemToolName.fields.toolName.name, contracts.ToolName.name);
    assert.strictEqual(item.ItemToolVersion.fields.toolVersion.name, contracts.ToolVersion.name);
  });
});
