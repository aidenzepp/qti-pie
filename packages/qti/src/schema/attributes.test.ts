import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";

import { inventory } from "#qti/schema/content/xsd-inventory.ts";
import * as attributes from "#qti/schema/attributes.ts";
import * as document from "#qti/schema/document.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as asi from "#qti/schema/kinds/asi.ts";
import * as cp from "#qti/schema/kinds/cp.ts";
import * as generic from "#qti/schema/kinds/generic.ts";
import * as html from "#qti/schema/kinds/html.ts";
import * as lom from "#qti/schema/kinds/lom.ts";
import * as qmd from "#qti/schema/kinds/qmd.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import { attributeAdmissionRows } from "#qti/schema/seed/attribute-admission.ts";

const registries = [
  asi.registry,
  html.registry,
  lom.registry,
  cp.registry,
  qmd.registry,
  generic.registry,
];

const rows = attributeAdmissionRows(registries);

const has = (kind: string, attribute: string): boolean =>
  rows.some((row) => row.kind === kind && row.attribute === attribute);

describe("attribute-admission seed", () => {
  it("holds the family and element-specific pairs", () => {
    for (const [kind, attribute] of [
      ["p", "lang"],
      ["p", "aria-label"],
      ["a", "xml:base"],
      ["br", "aria-keyshorts"],
      ["qti-assessment-item", "label"],
      ["qti-choice-interaction", "shuffle"],
      ["lom:string", "xml:lang"],
    ] as const) {
      assert.isTrue(has(kind, attribute), `${kind} ${attribute}`);
    }
  });

  it("holds none of the refused pairs", () => {
    for (const [kind, attribute] of [
      ["qti-item-body", "lang"],
      ["param", "id"],
      ["br", "data-ssml"],
      ["br", "aria-keyshortcuts"],
      ["p", "shuffle"],
    ] as const) {
      assert.isFalse(has(kind, attribute), `${kind} ${attribute}`);
    }
  });

  it("is deduplicated and sorted by kind then attribute", () => {
    const keys = rows.map((row) => `${row.kind}\u0000${row.attribute}`);
    assert.strictEqual(new Set(keys).size, keys.length);
    assert.deepStrictEqual(keys, keys.toSorted());
  });

  it("admits a synthetic registry's attributes (N2)", () => {
    const extended = attributeAdmissionRows([
      ...registries,
      { "qti-synthetic": { attributes: ["id"] } },
    ]);
    assert.isTrue(extended.some((row) => row.kind === "qti-synthetic" && row.attribute === "id"));
  });

  it("gives every ASI and HTML kind the attribute set of its inventory entry", () => {
    for (const entry of Object.values(inventory)) {
      const forKind = new Set(
        rows.filter((row) => row.kind === entry.handle).map((row) => row.attribute),
      );
      assert.deepStrictEqual(forKind, new Set(entry.attributes.map((a) => a.name)), entry.handle);
    }
  });
});

describe("attributes", () => {
  it("states the O3 containment and NodeLabelNotRoot", () => {
    const o3 = attributes.rules.flatMap((rule) =>
      rule.kind === "contained" &&
      rule.left.source === node.AttributeLexical &&
      rule.right.source === attributes.relations.AttributeAdmission
        ? [rule]
        : [],
    );
    assert.strictEqual(o3.length, 1);
    assert.deepStrictEqual([...(o3[0]?.left.fields ?? [])], ["kind", "attribute"]);
    assert.deepStrictEqual([...(o3[0]?.right.fields ?? [])], ["kind", "attribute"]);

    const checks = attributes.rules
      .filter((rule) => rule.kind === "check")
      .map((rule) => rule.name);
    assert.include(checks, "NodeLabelNotRoot");
    assert.include(checks, "BdoDirNotAuto");
  });

  it("declares the 48 ARIA relations and both R42 checks", () => {
    const aria = Object.keys(attributes.relations).filter((name) => name.startsWith("Aria"));
    assert.strictEqual(aria.length, 48);
    assert.include(aria, "AriaKeyshorts");
    assert.include(aria, "AriaKeyshortcuts");
    assert.include(aria, "AriaRole");

    const checks = attributes.rules
      .filter((rule) => rule.kind === "check")
      .map((rule) => rule.name);
    assert.include(checks, "AriaRoleH1");
    assert.include(checks, "AriaRoleNotSource");
  });

  it("holds each closed family and ARIA value to its roster", () => {
    const { relations } = attributes;
    const closed: readonly (readonly [{ readonly roster: unknown }, unknown])[] = [
      [relations.AriaAtomic.fields.value, rosters.XsBoolean],
      [relations.AriaAutocomplete.fields.value, rosters.AriaAutocompleteValue],
      [relations.AriaBusy.fields.value, rosters.XsBoolean],
      [relations.AriaChecked.fields.value, rosters.AriaTristate],
      [relations.AriaCurrent.fields.value, rosters.AriaCurrentValue],
      [relations.AriaDisabled.fields.value, rosters.XsBoolean],
      [relations.AriaExpanded.fields.value, rosters.AriaTrueFalseUndefined],
      [relations.AriaHaspopup.fields.value, rosters.XsBoolean],
      [relations.AriaHidden.fields.value, rosters.XsBoolean],
      [relations.AriaInvalid.fields.value, rosters.AriaInvalidValue],
      [relations.AriaLive.fields.value, rosters.AriaLiveValue],
      [relations.AriaModal.fields.value, rosters.XsBoolean],
      [relations.AriaMultiline.fields.value, rosters.XsBoolean],
      [relations.AriaMultiselectable.fields.value, rosters.XsBoolean],
      [relations.AriaOrientation.fields.value, rosters.AriaOrientationValue],
      [relations.AriaPressed.fields.value, rosters.AriaTristate],
      [relations.AriaReadonly.fields.value, rosters.XsBoolean],
      [relations.AriaRequired.fields.value, rosters.XsBoolean],
      [relations.AriaRole.fields.value, rosters.AriaRoleValue],
      [relations.AriaSelected.fields.value, rosters.AriaTrueFalseUndefined],
      [relations.AriaSort.fields.value, rosters.AriaSortValue],
      [relations.NodeDir.fields.value, rosters.TextDirection],
      [relations.NodeSuppressTts.fields.value, rosters.SuppressTtsMode],
    ];

    assert.strictEqual(closed.length, 23);
    for (const [field, roster] of closed) {
      assert.strictEqual(field.roster, roster);
    }
  });

  it("states BdoDirNotAuto and AriaRoleH1 by form over handles", () => {
    const predicates = new Map(
      attributes.rules.flatMap((rule) =>
        rule.kind === "check" &&
        (rule.name === "BdoDirNotAuto" || rule.name === "AriaRoleH1") &&
        Predicate.hasProperty(rule, "desc") &&
        Predicate.hasProperty(rule.desc, "predicate")
          ? [[rule.name, structuredClone(rule.desc.predicate)] as const]
          : [],
      ),
    );

    assert.deepStrictEqual(predicates.get("BdoDirNotAuto"), {
      args: [
        {
          kind: "compare",
          left: { field: "kind", kind: "field" },
          op: "ne",
          right: { kind: "literal", type: undefined, value: "bdo" },
        },
        {
          kind: "compare",
          left: { field: "value", kind: "field" },
          op: "ne",
          right: { kind: "literal", type: undefined, value: "auto" },
        },
      ],
      kind: "or",
    });
    assert.deepStrictEqual(predicates.get("AriaRoleH1"), {
      args: [
        {
          kind: "compare",
          left: { field: "kind", kind: "field" },
          op: "ne",
          right: { kind: "literal", type: undefined, value: "h1" },
        },
        {
          arg: { field: "value", kind: "field" },
          kind: "in",
          values: ["heading", "tab", "presentation"],
        },
      ],
      kind: "or",
    });
    assert.include(rosters.TextDirection.handles, "auto");
    for (const handle of ["heading", "tab", "presentation"]) {
      assert.include(rosters.AriaRoleValue.handles, handle);
    }
  });

  it("admits each family and ARIA relation by its kind and attribute together", () => {
    const family = Object.entries(attributes.relations).filter(
      ([name]) => name.startsWith("Aria") || /^Node./u.test(name),
    );
    const admission: unknown = attributes.relations.AttributeAdmission;
    const checks = attributes.rules.flatMap((rule) => (rule.kind === "check" ? [rule.name] : []));
    const containments = attributes.rules.flatMap((rule) =>
      rule.kind === "contained" ? [rule] : [],
    );

    assert.strictEqual(family.length, 56);
    for (const [name, relation] of family) {
      assert.include(Object.keys(relation.fields), "attribute", name);
      assert.include(checks, `${name}Attribute`, name);

      const admitted = containments.filter(
        (rule) => rule.left.source === relation && rule.right.source === admission,
      );

      assert.strictEqual(admitted.length, 1, name);
      for (const rule of admitted) {
        assert.deepStrictEqual([...rule.left.fields], ["kind", "attribute"], name);
        assert.deepStrictEqual([...rule.right.fields], ["kind", "attribute"], name);
      }
    }

    const selected = containments.filter((rule) => {
      const source: object = rule.right.source;

      return "relation" in source && source.relation === admission;
    });

    assert.strictEqual(selected.length, 0);
  });

  it("holds HtmlId to the id attribute inside AttributeAdmission", () => {
    const { AttributeAdmission } = attributes.relations;
    const { HtmlId } = document.relations;
    const into = attributes.rules.flatMap((rule) =>
      rule.kind === "contained" &&
      rule.left.source === HtmlId &&
      rule.right.source === AttributeAdmission
        ? [rule]
        : [],
    );
    const checks = attributes.rules.flatMap((rule) => (rule.kind === "check" ? [rule.name] : []));

    assert.include(Object.keys(HtmlId.fields), "attribute");
    assert.strictEqual(Object.keys(HtmlId.fields)[0], "attribute");
    assert.strictEqual(into.length, 1);
    for (const rule of into) {
      assert.deepStrictEqual([...rule.left.fields], ["kind", "attribute"]);
      assert.deepStrictEqual([...rule.right.fields], ["kind", "attribute"]);
    }
    assert.include(checks, "HtmlIdAttribute");
  });

  it("holds HeadersTarget to the headers attribute inside AttributeIdref", () => {
    const { AttributeIdref, HeadersTarget } = attributes.relations;
    const fields = ["node", "attribute", "position", "target"];
    const into = attributes.rules.flatMap((rule) =>
      rule.kind === "contained" &&
      rule.left.source === HeadersTarget &&
      rule.right.source === AttributeIdref
        ? [rule]
        : [],
    );
    const checks = attributes.rules.flatMap((rule) => (rule.kind === "check" ? [rule.name] : []));

    assert.include(Object.keys(HeadersTarget.fields), "attribute");
    assert.strictEqual(into.length, 1);
    for (const rule of into) {
      assert.deepStrictEqual([...rule.left.fields], fields);
      assert.deepStrictEqual([...rule.right.fields], fields);
    }
    assert.include(checks, "HeadersTargetAttribute");
  });

  it("builds a probe schema over the spine relations and its own", () => {
    const probe = schema(
      "QtiAttributesProbe",
      {
        ...node.relations,
        ...pkg.relations,
        ...document.relations,
        ...rosters.relations,
        ...attributes.relations,
      },
      [...node.rules, ...pkg.rules, ...document.rules, ...attributes.rules],
    );
    assert.strictEqual(
      probe.statements.length,
      node.rules.length + pkg.rules.length + document.rules.length + attributes.rules.length,
    );
    assert.include(Object.keys(probe.relations), "AttributeAdmission");
    assert.include(Object.keys(probe.relations), "AttributeIdref");
  });
});
