import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";

import {
  mathExpression,
  mathmlInventory,
  mathmlWildcards,
} from "#pantry/schema/content/inventory/mathml.ts";
import type { InventoryAttribute } from "#pantry/schema/content/xsd-inventory.ts";

const entries = Object.values(mathmlInventory);

/**
 * The handles of the children an entry's model references.
 *
 * @param handle - The kind handle.
 * @returns The distinct child handles, in model order.
 */
const childrenOf = (handle: string): readonly string[] => {
  const entry = mathmlInventory[handle];

  if (entry === undefined) {
    return assert.fail(`${handle} has an entry`);
  }

  return [...new Set(entry.children.map((child) => child.name))];
};

/**
 * Find a declared attribute of a kind, failing the test when the kind or attribute is absent.
 *
 * @param handle - The kind handle.
 * @param name - The attribute name.
 * @returns The attribute row.
 */
const attributeOf = (handle: string, name: string): InventoryAttribute => {
  const found = mathmlInventory[handle]?.attributes.find((attribute) => attribute.name === name);

  if (found === undefined) {
    return assert.fail(`${handle} declares ${name}`);
  }

  return found;
};

describe("the MathML inventory leaf", () => {
  it("holds 194 entries, m:math first and m:semantics.ci right after m:semantics", () => {
    const handles = Object.keys(mathmlInventory);

    assert.strictEqual(handles.length, 194);
    assert.strictEqual(handles[0], "m:math");
    assert.strictEqual(handles.indexOf("m:semantics.ci"), handles.indexOf("m:semantics") + 1);
    assert.deepStrictEqual(
      handles.slice(1),
      handles.slice(1).toSorted((left, right) => (left < right ? -1 : 1)),
    );

    for (const [handle, entry] of Object.entries(mathmlInventory)) {
      assert.strictEqual(entry.handle, handle);
    }
  });

  it("names m:maction/@actiontype as the only required attribute and no default", () => {
    const required = entries.flatMap((entry) =>
      entry.attributes
        .filter((attribute) => attribute.use === "required")
        .map((attribute) => `${entry.handle}/@${attribute.name}`),
    );

    assert.deepStrictEqual(required, ["m:maction/@actiontype"]);
    assert.isTrue(
      entries.every((entry) =>
        entry.attributes.every(
          (attribute) => Option.isNone(attribute.default) && attribute.family === "own",
        ),
      ),
    );
  });

  it("counts 1,851 kind-attribute pairs, none declared twice on a kind", () => {
    assert.strictEqual(
      entries.reduce((sum, entry) => sum + entry.attributes.length, 0),
      1851,
    );

    for (const entry of entries) {
      const names = entry.attributes.map((attribute) => attribute.name);

      assert.strictEqual(new Set(names).size, names.length);
    }
  });

  it("marks exactly ten kinds mixed", () => {
    assert.deepStrictEqual(
      entries.filter((entry) => entry.mixed).map((entry) => entry.handle),
      [
        "m:annotation",
        "m:ci",
        "m:cn",
        "m:cs",
        "m:csymbol",
        "m:mi",
        "m:mn",
        "m:mo",
        "m:ms",
        "m:mtext",
      ],
    );
  });

  it("gives m:bvar the second semantics type and not the first", () => {
    const children = childrenOf("m:bvar");

    assert.includeMembers([...children], ["m:ci", "m:degree", "m:semantics.ci"]);
    assert.notInclude(children, "m:semantics");
  });

  it("derives m:semantics.ci from the group semantics-ci", () => {
    assert.deepStrictEqual(childrenOf("m:semantics.ci").toSorted(), [
      "m:annotation",
      "m:annotation-xml",
      "m:ci",
      "m:semantics.ci",
    ]);
    assert.strictEqual(mathmlInventory["m:semantics.ci"]?.element, "semantics");
    assert.strictEqual(mathmlInventory["m:semantics"]?.element, "semantics");
    assert.include(childrenOf("m:semantics"), "m:annotation-xml");
    assert.notInclude(childrenOf("m:semantics"), "m:semantics.ci");
  });

  it("expands substitution groups to concrete members with the reference's bounds", () => {
    const children = mathmlInventory["m:apply"]?.children ?? [];
    const plus = children.filter((child) => child.name === "m:plus");

    assert.isAbove(plus.length, 0);
    assert.isTrue(children.every((child) => !child.name.endsWith(".class")));
    assert.isTrue(children.every((child) => child.name !== "m:PresentationExpression"));
    assert.deepStrictEqual(
      mathmlInventory["m:mfrac"]?.children.filter((child) => child.name === "m:mi"),
      [
        { max: Option.some(1), min: 1, name: "m:mi" },
        { max: Option.some(1), min: 1, name: "m:mi" },
      ],
    );
    assert.deepStrictEqual(
      mathmlInventory["m:mrow"]?.children.find((child) => child.name === "m:mi"),
      { max: Option.none(), min: 0, name: "m:mi" },
    );
  });

  it("gives m:annotation-xml no element child and the wildcards export gives it ##any lax 1..1", () => {
    assert.deepStrictEqual(mathmlInventory["m:annotation-xml"]?.children, []);
    assert.deepStrictEqual(mathmlWildcards.element, {
      "m:annotation-xml": { max: 1, min: 1, namespace: "##any", process: "lax" },
    });
  });

  it("lists the 183 kinds that carry the ##other skip attribute wildcard", () => {
    const { kinds, namespace, process } = mathmlWildcards.attribute;
    const without = Object.keys(mathmlInventory).filter((handle) => !kinds.includes(handle));

    assert.strictEqual(namespace, "##other");
    assert.strictEqual(process, "skip");
    assert.strictEqual(kinds.length, 183);
    assert.strictEqual(new Set(kinds).size, 183);
    assert.include(kinds, "m:semantics.ci");
    assert.deepStrictEqual(without, [
      "m:condition",
      "m:declare",
      "m:degree",
      "m:domainofapplication",
      "m:fn",
      "m:logbase",
      "m:lowlimit",
      "m:momentabout",
      "m:reln",
      "m:sep",
      "m:uplimit",
    ]);
  });

  it("exports the 168 handles of the group m:MathExpression", () => {
    assert.strictEqual(mathExpression.length, 168);
    assert.strictEqual(new Set(mathExpression).size, 168);
    assert.include(mathExpression, "m:semantics");

    for (const excluded of [
      "m:semantics.ci",
      "m:math",
      "m:annotation",
      "m:annotation-xml",
      "m:mtr",
      "m:sep",
    ]) {
      assert.notInclude(mathExpression, excluded);
    }

    for (const handle of mathExpression) {
      assert.isDefined(mathmlInventory[handle]);
    }
  });

  it("agrees with the ten kinds whose model is (MathExpression)*", () => {
    for (const handle of [
      "m:math",
      "m:menclose",
      "m:merror",
      "m:mfenced",
      "m:mpadded",
      "m:mphantom",
      "m:mrow",
      "m:msqrt",
      "m:mstyle",
      "m:mtd",
    ]) {
      assert.deepStrictEqual(childrenOf(handle).toSorted(), mathExpression.toSorted());
    }
  });

  it("reads the whiteSpace class of each attribute's type", () => {
    assert.strictEqual(attributeOf("m:math", "display").whiteSpace, "collapse");
    assert.strictEqual(attributeOf("m:math", "alttext").whiteSpace, "preserve");
    assert.strictEqual(attributeOf("m:mspace", "width").whiteSpace, "preserve");
    assert.strictEqual(attributeOf("m:mo", "class").whiteSpace, "collapse");
    assert.strictEqual(attributeOf("m:mstyle", "mathsize").whiteSpace, "union");
    assert.deepStrictEqual(
      [attributeOf("m:mi", "xref").type, attributeOf("m:mi", "xref").whiteSpace],
      ["xs:anySimpleType", "preserve"],
    );
  });
});
