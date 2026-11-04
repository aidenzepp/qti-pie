import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as node from "#qti/schema/node.ts";
import * as contracts from "#qti/schema/contracts.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as rubric from "#qti/schema/rubric.ts";

/**
 * The probe schema: the spine relations rubric reads, with this module's own.
 */
const probe = () =>
  schema("QtiRubricProbe", { ...node.relations, ...rubric.relations }, [
    ...node.rules,
    ...rubric.rules,
  ]);

/**
 * Whether the pattern admits the value, read through a regular expression of the same flags.
 */
const admits = (source: string, flags: string, value: string): boolean =>
  new RegExp(source, flags).test(value);

describe("rubric", () => {
  it("builds the probe over node and rubric without refusal", () => {
    const built = probe();
    for (const name of ["RubricBlock", "Stylesheet", "CatalogInfo", "CompanionMaterialsInfo"]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("holds the four hooks' arms, keyed by their handles", () => {
    assert.deepStrictEqual(rubric.arms, {
      "qti-catalog-info": rubric.relations.CatalogInfo,
      "qti-companion-materials-info": rubric.relations.CompanionMaterialsInfo,
      "qti-rubric-block": rubric.relations.RubricBlock,
      "qti-stylesheet": rubric.relations.Stylesheet,
    });
  });

  it("holds only the rubric block, the stylesheet, its two optionals and the two thin hooks", () => {
    assert.deepStrictEqual(Object.keys(rubric.relations).toSorted(), [
      "CatalogInfo",
      "CompanionMaterialsInfo",
      "RubricBlock",
      "Stylesheet",
      "StylesheetMedia",
      "StylesheetTitle",
    ]);
    assert.deepStrictEqual(Object.keys(rubric.relations.CatalogInfo.fields), ["id"]);
    assert.deepStrictEqual(Object.keys(rubric.relations.CompanionMaterialsInfo.fields), ["id"]);
  });

  it("types RubricBlock's use and view by their patterns, keyed by id", () => {
    const { RubricBlock } = rubric.relations;
    assert.deepStrictEqual([...RubricBlock.primaryKey], ["id"]);
    assert.deepStrictEqual(Object.keys(RubricBlock.fields), ["id", "use", "view"]);
    assert.strictEqual(RubricBlock.fields.use.pattern.source, patterns.useEnumExt);
    assert.strictEqual(RubricBlock.fields.view.pattern.source, patterns.viewList);
  });

  it("admits scoring and ext:foo.bar as a use, and refuses Scoring and ext:", () => {
    const use = rubric.relations.RubricBlock.fields.use.pattern;
    for (const value of ["scoring", "ext:foo.bar"]) {
      assert.isTrue(admits(use.source, use.flags, value), value);
    }
    for (const value of ["Scoring", "ext:"]) {
      assert.isFalse(admits(use.source, use.flags, value), value);
    }
  });

  it("refuses an empty view and admits a list of two views", () => {
    const view = rubric.relations.RubricBlock.fields.view.pattern;
    assert.isFalse(admits(view.source, view.flags, ""));
    assert.isTrue(admits(view.source, view.flags, "candidate scorer"));
  });

  it("gives Stylesheet its href and type, and its two optional values their own rows", () => {
    const { Stylesheet, StylesheetMedia, StylesheetTitle } = rubric.relations;
    assert.deepStrictEqual(Object.keys(Stylesheet.fields), ["href", "id", "type"]);
    assert.strictEqual(Stylesheet.fields.href.base.pattern.source, patterns.anyUri);
    assert.strictEqual(Stylesheet.fields.type.base.pattern.source, patterns.mimeType);
    for (const [relation, source, flags] of [
      [StylesheetMedia, patterns.xsString, patterns.xsStringFlags],
      [StylesheetTitle, patterns.xsNormalizedString, patterns.xsNormalizedStringFlags],
    ] as const) {
      assert.deepStrictEqual([...relation.primaryKey], ["node"]);
      assert.deepStrictEqual(Object.keys(relation.fields), ["node", "value"]);
      assert.strictEqual(relation.fields.value.pattern.source, source);
      assert.strictEqual(relation.fields.value.pattern.flags, flags);
    }
  });

  it("contains each optional value in its stylesheet", () => {
    const owned = rubric.rules
      .filter((rule) => rule.kind === "contained")
      .map((rule) => [rule.left.source, rule.right.source, [...rule.right.fields]]);
    assert.deepStrictEqual(owned, [
      [rubric.relations.StylesheetMedia, rubric.relations.Stylesheet, ["id"]],
      [rubric.relations.StylesheetTitle, rubric.relations.Stylesheet, ["id"]],
    ]);
  });
});

describe("contracts (rubric)", () => {
  it("types Stylesheet.href StylesheetUri", () => {
    assert.strictEqual(rubric.Stylesheet.fields.href.name, contracts.StylesheetUri.name);
  });
  it("types Stylesheet.type ContentMediaType", () => {
    assert.strictEqual(rubric.Stylesheet.fields.type.name, contracts.ContentMediaType.name);
  });
});
