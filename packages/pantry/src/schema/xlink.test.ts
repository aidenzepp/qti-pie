import { assert, describe, it } from "@effect/vitest";
import { typedValues } from "#pantry/schema/attribute-homes.ts";
import * as attributes from "#pantry/schema/attributes.ts";
import {
  XlinkActuateValue,
  XlinkShowValue,
  XlinkTypeValue,
} from "#pantry/schema/content/rosters.ts";
import {
  XlinkArcroleUri,
  XlinkHrefUri,
  XlinkLabelName,
  XlinkRoleUri,
} from "#pantry/schema/contracts.ts";
import * as node from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import { Rows } from "#pantry/import/tree.ts";
import { Qti } from "#pantry/schema/qti.ts";
import { Author } from "#pantry/schema/roles.ts";
import { wildcardAttributeAdmission } from "#pantry/schema/seed/wildcard.ts";
import * as xlink from "#pantry/schema/xlink.ts";

const names = [
  "actuate",
  "arcrole",
  "from",
  "href",
  "label",
  "role",
  "show",
  "title",
  "to",
  "type",
] as const;

type Name = (typeof names)[number];

const relationOf = {
  actuate: xlink.XlinkActuate,
  arcrole: xlink.XlinkArcrole,
  from: xlink.XlinkFrom,
  href: xlink.XlinkHref,
  label: xlink.XlinkLabel,
  role: xlink.XlinkRole,
  show: xlink.XlinkShow,
  title: xlink.XlinkTitle,
  to: xlink.XlinkTo,
  type: xlink.XlinkType,
} as const;

type Rule = (typeof xlink.rules)[number];

const ofKind = <K extends Rule["kind"]>(kind: K) =>
  xlink.rules.filter((rule): rule is Extract<Rule, { readonly kind: K }> => rule.kind === kind);

const nodeId = "00000000-0000-4000-8000-000000000001";

describe("the xlink model", () => {
  it("declares the ten relations in the family shape, keyed by the node", () => {
    assert.deepStrictEqual(Object.keys(xlink.relations).toSorted(), [
      "XlinkActuate",
      "XlinkArcrole",
      "XlinkFrom",
      "XlinkHref",
      "XlinkLabel",
      "XlinkRole",
      "XlinkShow",
      "XlinkTitle",
      "XlinkTo",
      "XlinkType",
    ]);
    for (const name of names) {
      const relation = relationOf[name];
      assert.deepStrictEqual(Object.keys(relation.fields), ["attribute", "kind", "node", "value"]);
      assert.deepStrictEqual([...relation.primaryKey], ["node"]);
    }
  });

  it("types each value by its declared type", () => {
    assert.strictEqual(xlink.XlinkType.fields.value.roster, XlinkTypeValue);
    assert.strictEqual(xlink.XlinkShow.fields.value.roster, XlinkShowValue);
    assert.strictEqual(xlink.XlinkActuate.fields.value.roster, XlinkActuateValue);
    assert.strictEqual(xlink.XlinkHref.fields.value.name, XlinkHrefUri.name);
    assert.strictEqual(xlink.XlinkRole.fields.value.name, XlinkRoleUri.name);
    assert.strictEqual(xlink.XlinkArcrole.fields.value.name, XlinkArcroleUri.name);
    for (const name of ["label", "from", "to"] as const) {
      assert.strictEqual(relationOf[name].fields.value.name, XlinkLabelName.name, name);
    }
  });

  it("types xlink:title as the bare string base, with no domain", () => {
    const { value } = xlink.XlinkTitle.fields;
    assert.strictEqual(value.pattern.source, patterns.wildcard);
    assert.strictEqual(value.pattern.flags, patterns.wildcardFlags);
    assert.isFalse("name" in value);
  });

  it("contains each relation in Node and in the admission rows, and checks its attribute name", () => {
    const sources = [node.Node, attributes.AttributeAdmission];
    for (const name of names) {
      const mine = ofKind("contained").filter((rule) => rule.left.source === relationOf[name]);
      assert.deepStrictEqual(
        mine.map((rule) => [
          rule.left.fields.join(","),
          sources.indexOf(rule.right.source),
          rule.right.fields.join(","),
        ]),
        [
          ["node,kind", 0, "id,kind"],
          ["kind,attribute", 1, "kind,attribute"],
        ],
        name,
      );
    }
    assert.strictEqual(ofKind("contained").length, names.length * 2);
    assert.deepStrictEqual(
      ofKind("check").map((rule) => [rule.relation]),
      names.map((name) => [relationOf[name]]),
    );
    assert.deepStrictEqual(
      ofKind("check").map((rule) => rule.name),
      Object.keys(xlink.relations).map((key) => `${key}Attribute`),
    );
  });

  it("declares no arm", () => {
    assert.deepStrictEqual(xlink.arms, {});
  });

  it("composes every relation and statement into the schema and lets Author write them", () => {
    for (const [key, relation] of Object.entries(xlink.relations)) {
      assert.strictEqual(Object.entries(Qti.relations).find(([k]) => k === key)?.[1], relation);
      assert.strictEqual(Object.entries(Author.relations).find(([k]) => k === key)?.[1], relation);
    }
    for (const rule of xlink.rules) {
      assert.include(Qti.statements, rule);
    }
  });

  it("admits the ten names on every LOM attribute host and on foreign, and nowhere else", () => {
    const hosts = new Set(wildcardAttributeAdmission.map((row) => row.kind));
    const lomAndForeign = [...hosts].filter(
      (kind) => kind.startsWith("lom:") || kind === "foreign",
    );
    assert.isAbove(lomAndForeign.length, 1);
    for (const host of lomAndForeign) {
      for (const name of names) {
        assert.isTrue(
          wildcardAttributeAdmission.some(
            (row) => row.kind === host && row.attribute === `xlink:${name}`,
          ),
          `${host} xlink:${name}`,
        );
      }
    }
    const xlinkRows = wildcardAttributeAdmission.filter((row) =>
      row.attribute.startsWith("xlink:"),
    );
    assert.strictEqual(xlinkRows.length, lomAndForeign.length * names.length);
    for (const row of xlinkRows) {
      assert.isTrue(row.kind.startsWith("lom:") || row.kind === "foreign", row.kind);
    }
  });

  it("reads each name back from hand-built rows", () => {
    const adds: readonly ((acc: Rows) => Rows)[] = [
      (acc: Rows) =>
        Rows.add(acc, xlink.XlinkActuate, [
          { attribute: "xlink:actuate", kind: "foreign", node: nodeId, value: "onLoad" },
        ]),
      (acc: Rows) =>
        Rows.add(acc, xlink.XlinkArcrole, [
          {
            attribute: "xlink:arcrole",
            kind: "foreign",
            node: nodeId,
            value: XlinkArcroleUri("urn:arc"),
          },
        ]),
      (acc: Rows) =>
        Rows.add(acc, xlink.XlinkFrom, [
          { attribute: "xlink:from", kind: "foreign", node: nodeId, value: XlinkLabelName("a") },
        ]),
      (acc: Rows) =>
        Rows.add(acc, xlink.XlinkHref, [
          {
            attribute: "xlink:href",
            kind: "foreign",
            node: nodeId,
            value: XlinkHrefUri("http://example.com/x"),
          },
        ]),
      (acc: Rows) =>
        Rows.add(acc, xlink.XlinkLabel, [
          { attribute: "xlink:label", kind: "foreign", node: nodeId, value: XlinkLabelName("b") },
        ]),
      (acc: Rows) =>
        Rows.add(acc, xlink.XlinkRole, [
          {
            attribute: "xlink:role",
            kind: "foreign",
            node: nodeId,
            value: XlinkRoleUri("urn:role"),
          },
        ]),
      (acc: Rows) =>
        Rows.add(acc, xlink.XlinkShow, [
          { attribute: "xlink:show", kind: "foreign", node: nodeId, value: "embed" },
        ]),
      (acc: Rows) =>
        Rows.add(acc, xlink.XlinkTitle, [
          { attribute: "xlink:title", kind: "foreign", node: nodeId, value: " A  title " },
        ]),
      (acc: Rows) =>
        Rows.add(acc, xlink.XlinkTo, [
          { attribute: "xlink:to", kind: "foreign", node: nodeId, value: XlinkLabelName("c") },
        ]),
      (acc: Rows) =>
        Rows.add(acc, xlink.XlinkType, [
          { attribute: "xlink:type", kind: "foreign", node: nodeId, value: "locator" },
        ]),
    ];
    let rows: Rows = new Map();
    for (const add of adds) {
      rows = add(rows);
    }
    const read = typedValues(rows);
    const expected: Record<Name, string> = {
      actuate: "onLoad",
      arcrole: "urn:arc",
      from: "a",
      href: "http://example.com/x",
      label: "b",
      role: "urn:role",
      show: "embed",
      title: " A  title ",
      to: "c",
      type: "locator",
    };
    for (const name of names) {
      assert.strictEqual(read(nodeId, "foreign", `xlink:${name}`), expected[name], name);
    }
  });
});
