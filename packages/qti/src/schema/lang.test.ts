import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as attributes from "#qti/schema/attributes.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as document from "#qti/schema/document.ts";
import * as item from "#qti/schema/item.ts";
import * as lang from "#qti/schema/lang.ts";
import * as metadata from "#qti/schema/metadata.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * A containment of `lang.rules`, as the engine records it.
 */
type Containment = Extract<(typeof lang.rules)[number], { readonly kind: "contained" }>;

/**
 * A relation a statement of `lang.rules` names.
 */
type Relation =
  | typeof attributes.NodeLabel
  | typeof attributes.NodeXmlLang
  | typeof document.Document
  | typeof item.ItemToolBoth
  | typeof metadata.LomGeneral
  | typeof metadata.LomLanguage
  | typeof metadata.ResourceLom
  | (typeof lang.relations)[keyof typeof lang.relations];

/**
 * The containments of `lang.rules` whose source side is `relation` selected on exactly `bindings`
 * (an empty record for an unselected source) and whose target side is `target`.
 */
const containments = (
  relation: Relation,
  bindings: Readonly<Record<string, string>>,
  target: Relation,
): readonly Containment[] =>
  lang.rules.flatMap((rule) => {
    if (rule.kind !== "contained") {
      return [];
    }

    const side: unknown = rule.left.source;

    const plain = side === relation && Object.keys(bindings).length === 0;

    const selected =
      Predicate.hasProperty(side, "relation") &&
      side.relation === relation &&
      Predicate.hasProperty(side, "bindings") &&
      JSON.stringify(side.bindings) === JSON.stringify(bindings);

    return (plain || selected) && rule.right.source === target ? [rule] : [];
  });

/**
 * The fields of the one containment `containments` finds, as the source and target field lists.
 */
const fieldsOf = (
  relation: Relation,
  bindings: Readonly<Record<string, string>>,
  target: Relation,
): readonly (readonly [readonly string[], readonly string[]])[] =>
  containments(relation, bindings, target).map(
    (rule) => [[...rule.left.fields], [...rule.right.fields]] as const,
  );

const keysOf = (relation: Relation): readonly (readonly string[])[] =>
  lang.rules.flatMap((rule) =>
    rule.kind === "key" && rule.relation === relation ? [[...rule.fields]] : [],
  );

describe("lang", () => {
  it("builds the probe over node, document, metadata, item, attributes, rosters and lang", () => {
    const probe = schema(
      "QtiLangProbe",
      {
        ...node.relations,
        ...pkg.relations,
        ...document.relations,
        ...metadata.relations,
        ...item.relations,
        ...attributes.relations,
        ...rosters.relations,
        ...lang.relations,
      },
      [
        ...node.rules,
        ...pkg.rules,
        ...document.rules,
        ...metadata.rules,
        ...item.rules,
        ...attributes.rules,
        ...rosters.rules,
        ...lang.rules,
      ],
    );
    for (const name of ["DocumentLang", "ResourceLomLanguageSet", "ResourceLomGeneral"]) {
      assert.property(probe.relations, name);
    }
  });

  it("declares three relations and no arm", () => {
    assert.deepStrictEqual(Object.keys(lang.relations), [
      "DocumentLang",
      "ResourceLomGeneral",
      "ResourceLomLanguageSet",
    ]);
    assert.deepStrictEqual(Object.keys(lang.arms), []);
  });

  it("gives DocumentLang its fields, its key and its copy of the document", () => {
    const { DocumentLang } = lang.relations;
    assert.deepStrictEqual(Object.keys(DocumentLang.fields), [
      "document",
      "lomGeneral",
      "package",
      "resource",
      "value",
    ]);
    assert.deepStrictEqual([...DocumentLang.primaryKey], ["document", "value"]);
    assert.strictEqual(DocumentLang.fields.value.pattern.source, patterns.bcp47);
    assert.deepStrictEqual(fieldsOf(DocumentLang, {}, document.Document), [
      [
        ["document", "package", "resource"],
        ["id", "package", "resource"],
      ],
    ]);
  });

  it("gives ResourceLomLanguageSet an xs:language-or-empty value, two keys and its record", () => {
    const { ResourceLomLanguageSet } = lang.relations;
    assert.deepStrictEqual(Object.keys(ResourceLomLanguageSet.fields), [
      "lom",
      "package",
      "resource",
      "value",
    ]);
    assert.strictEqual(
      ResourceLomLanguageSet.fields.value.pattern.source,
      patterns.xsLanguageOrEmpty,
    );
    assert.deepStrictEqual([...ResourceLomLanguageSet.primaryKey], ["lom", "value"]);
    assert.deepStrictEqual(keysOf(ResourceLomLanguageSet), [["package", "resource", "value"]]);
    assert.deepStrictEqual(fieldsOf(ResourceLomLanguageSet, {}, metadata.ResourceLom), [
      [
        ["lom", "package", "resource"],
        ["lom", "package", "resource"],
      ],
    ]);
  });

  it("gives ResourceLomGeneral its record and its general category", () => {
    const { ResourceLomGeneral } = lang.relations;
    assert.deepStrictEqual(Object.keys(ResourceLomGeneral.fields), ["lom", "package", "resource"]);
    assert.deepStrictEqual([...ResourceLomGeneral.primaryKey], ["lom"]);
    assert.deepStrictEqual(keysOf(ResourceLomGeneral), [["package", "resource"]]);
    assert.deepStrictEqual(fieldsOf(ResourceLomGeneral, {}, metadata.LomGeneral), [
      [["lom"], ["lom"]],
    ]);
    assert.deepStrictEqual(fieldsOf(ResourceLomGeneral, {}, metadata.ResourceLom), [
      [
        ["lom", "package", "resource"],
        ["lom", "package", "resource"],
      ],
    ]);
  });

  describe("the containments of spec 4.9 and goal 3.12", () => {
    it("holds the complete half of a document's set, over item documents only", () => {
      assert.deepStrictEqual(
        fieldsOf(attributes.NodeXmlLang, { rootKind: "item" }, lang.relations.DocumentLang),
        [
          [
            ["tree", "value"],
            ["document", "value"],
          ],
        ],
      );
    });

    it("holds the R26 rule: a LOM-flagged language is in the resource's LOM set", () => {
      assert.deepStrictEqual(
        fieldsOf(
          lang.relations.DocumentLang,
          { lomGeneral: "yes" },
          lang.relations.ResourceLomLanguageSet,
        ),
        [
          [
            ["package", "resource", "value"],
            ["package", "resource", "value"],
          ],
        ],
      );
    });

    it("holds the flag's yes side: a LOM-flagged document has a general category", () => {
      assert.deepStrictEqual(
        fieldsOf(
          lang.relations.DocumentLang,
          { lomGeneral: "yes" },
          lang.relations.ResourceLomGeneral,
        ),
        [
          [
            ["package", "resource"],
            ["package", "resource"],
          ],
        ],
      );
    });

    it("holds the resource LOM set's complete half over the resource-owned languages", () => {
      assert.deepStrictEqual(
        fieldsOf(
          metadata.LomLanguage,
          { owner: "resource" },
          lang.relations.ResourceLomLanguageSet,
        ),
        [
          [
            ["lom", "value"],
            ["lom", "value"],
          ],
        ],
      );
    });

    it("holds goal 3.12: an item tree's label is in ItemToolBoth", () => {
      assert.deepStrictEqual(
        fieldsOf(attributes.NodeLabel, { rootKind: "item" }, item.ItemToolBoth),
        [[["tree"], ["tree"]]],
      );
    });

    it("declares the five rules, the copies and the two candidate keys, and nothing else", () => {
      const containedCount = lang.rules.filter((rule) => rule.kind === "contained").length;
      // The five rules above, plus the copies of the three relations: one, one and two.
      assert.strictEqual(containedCount, 5 + 1 + 1 + 2);
      assert.strictEqual(lang.rules.filter((rule) => rule.kind !== "contained").length, 2);
    });
  });
});
