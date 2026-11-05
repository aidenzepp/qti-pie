import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";

import { mathExpression, mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import {
  admission,
  annotationXmlAdmits,
  attributes,
  isMathmlKind,
  kinds,
  registry,
} from "#pantry/schema/kinds/mathml.ts";
import { attributeTuples } from "#pantry/schema/node.ts";

const entries = Object.values(mathmlInventory);

describe("the MathML kinds file", () => {
  it("lists the leaf's handles in order", () => {
    assert.deepStrictEqual([...kinds], Object.keys(mathmlInventory));
    assert.strictEqual(kinds.length, 194);
  });

  it("gives each kind a registry row whose attributes are its leaf entry's", () => {
    assert.deepStrictEqual(Object.keys(registry).toSorted(), [...kinds].toSorted());

    for (const kind of kinds) {
      const entry = mathmlInventory[kind];
      const row = registry[kind];

      assert.isDefined(entry);
      assert.strictEqual(row.namespace, "http://www.w3.org/1998/Math/MathML");
      assert.strictEqual(row.local, entry?.element);
      assert.deepStrictEqual(
        row.attributes,
        entry?.attributes.map((a) => a.name),
      );
    }
  });

  it("declares exactly the leaf names no earlier vocabulary has, once each", () => {
    const have = new Set<string>(attributeTuples.flat());
    const wanted = [
      ...new Set(entries.flatMap((entry) => entry.attributes.map((attribute) => attribute.name))),
    ].filter((name) => !have.has(name));

    assert.deepStrictEqual([...attributes], wanted);
    assert.strictEqual(new Set(attributes).size, attributes.length);
    assert.include(attributes, "xref");
  });

  it("parents m:semantics.ci under m:bvar and no other kind", () => {
    assert.deepStrictEqual(registry["m:semantics.ci"].parent, Option.some("m:bvar"));
    assert.strictEqual(registry["m:semantics.ci"].local, "semantics");
    assert.strictEqual(registry["m:semantics"].local, "semantics");

    for (const kind of kinds) {
      if (kind !== "m:semantics.ci") {
        assert.isTrue(Option.isNone(registry[kind].parent));
      }
    }
  });

  it("recognises MathML handles only", () => {
    assert.isTrue(isMathmlKind("m:mi"));
    assert.isFalse(isMathmlKind("p"));
  });
});

const versions = ["3.0.0", "3.0.1"] as const;

const has = (version: string, parent: string, child: string): boolean =>
  admission.some((row) => row.version === version && row.parent === parent && row.child === child);

const hosts = Object.values(inventory).filter((entry) =>
  entry.children.some((child) => child.name === "m3:math"),
);

const rowsOf = (version: string) =>
  admission
    .filter((row) => row.version === version)
    .map((row) => `${row.parent}|${row.child}`)
    .toSorted();

describe("the MathML admission rows", () => {
  it("holds each (version, parent, child) once", () => {
    const triples = admission.map((row) => `${row.version}|${row.parent}|${row.child}`);

    assert.strictEqual(new Set(triples).size, triples.length);
  });

  it("holds two host rows per inventory entry naming m3:math", () => {
    const rows = admission.filter((row) => row.child === "m:math" && !isMathmlKind(row.parent));

    assert.strictEqual(hosts.length, 63);
    assert.strictEqual(rows.length, 2 * hosts.length);
    for (const host of hosts) {
      for (const version of versions) {
        assert.isTrue(has(version, host.handle, "m:math"));
      }
    }
  });

  it("holds 16,458 rows under MathML parents", () => {
    assert.strictEqual(admission.filter((row) => isMathmlKind(row.parent)).length, 16_458);
    assert.strictEqual(admission.length, 16_584);
  });

  it("is the same for both versions", () => {
    assert.deepStrictEqual(rowsOf("3.0.0"), rowsOf("3.0.1"));
  });

  it("admits the spot rows in both versions", () => {
    const present: readonly (readonly [string, string])[] = [
      ["p", "m:math"],
      ["qti-prompt", "m:math"],
      ["qti-content-body.modal", "m:math"],
      ["m:math", "m:mrow"],
      ["m:mfrac", "m:mi"],
      ["m:mi", "text"],
      ["m:mi", "m:mglyph"],
      ["m:mtable", "m:mtr"],
      ["m:mtr", "m:mtd"],
      ["m:bvar", "m:semantics.ci"],
      ["m:semantics.ci", "m:ci"],
      ["m:semantics", "m:annotation-xml"],
      ["m:annotation-xml", "ws"],
      ["m:apply", "m:plus"],
      ["m:mrow", "ws"],
      ["m:mspace", "comment"],
      ["m:cbytes", "text"],
    ];

    for (const [parent, child] of present) {
      for (const version of versions) {
        assert.isTrue(has(version, parent, child), `${version} ${parent} ${child}`);
      }
    }
  });

  it("refuses the absent rows in both versions", () => {
    const absent: readonly (readonly [string, string])[] = [
      ["blockquote", "m:math"],
      ["bdo", "m:math"],
      ["p", "m:mi"],
      ["m:mfrac", "text"],
      ["m:mspace", "ws"],
      ["m:mrow", "m:math"],
      ["m:bvar", "m:semantics"],
      ["m:annotation-xml", "m:math"],
      ["m:annotation-xml", "m:mi"],
      ["m:annotation-xml", "m:semantics"],
      ["m:mrow", "qti-printed-variable"],
      ["m:mrow", "p"],
    ];

    for (const [parent, child] of absent) {
      for (const version of versions) {
        assert.isFalse(has(version, parent, child), `${version} ${parent} ${child}`);
      }
    }
  });

  it("gives m:annotation-xml its content-type rows and no element child", () => {
    const kids = admission
      .filter((row) => row.version === "3.0.1" && row.parent === "m:annotation-xml")
      .map((row) => row.child);

    assert.deepStrictEqual(kids, ["ws", "comment", "pi"]);
  });

  it("exports the leaf's expression group as annotationXmlAdmits", () => {
    assert.deepStrictEqual([...annotationXmlAdmits], [...mathExpression]);
    assert.strictEqual(annotationXmlAdmits.length, 168);
  });
});
