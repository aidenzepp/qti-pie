import { assert, describe, it } from "@effect/vitest";
import type { Fact } from "@bjornpagen/grizzle";

import { cnFinding } from "#pantry/import/guards/mathml-cn.ts";
import { Rows } from "#pantry/import/tree.ts";
import { MathmlBaseValue } from "#pantry/schema/contracts.ts";
import { MathmlBase, MathmlString } from "#pantry/schema/mathml/attributes.ts";
import { Edge, Node, TextNode } from "#pantry/schema/node.ts";

const version = "3.0.1" as const;

const tree = "00000000-0000-4000-8000-0000000000aa" as const;

/**
 * A uuid for hand-built rows, numbered.
 */
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as const;

/**
 * The content of a `cn`: text, a separator or another element.
 */
type Child =
  | { readonly kind: "m:mglyph" | "m:sep" }
  | { readonly kind: "text"; readonly value: string };

/**
 * A `cn` as the rows an import builds: its node, its attributes, its children and their text.
 *
 * @param n - Which `cn`, so its ids are its own.
 * @param attributes - The `type` and `base` it carries.
 * @param attributes.type - The `type`, none when absent.
 * @param attributes.base - The `base`, none when absent.
 * @param children - The children in document order.
 * @returns The rows.
 */
const cnRows = (
  n: number,
  attributes: { readonly base?: `${number}`; readonly type?: string },
  children: readonly Child[],
): Rows => {
  const self = id(n * 100);
  const node = (nodeId: ReturnType<typeof id>, kind: Fact<typeof Node>["kind"]) => ({
    ancestry: "root" as const,
    id: nodeId,
    kind,
    prefix: "",
    rootKind: "item" as const,
    tree,
    version,
  });
  const ids = children.map((_, index) => id(n * 100 + index + 1));
  let rows = Rows.add(Rows.empty(), Node, [
    node(self, "m:cn"),
    ...children.map((child, index) => node(ids[index] ?? self, child.kind)),
  ]);
  rows = Rows.add(
    rows,
    Edge,
    children.map((child, index) => ({
      child: ids[index] ?? self,
      childAncestry: "root" as const,
      childKind: child.kind,
      parent: self,
      parentAncestry: "root" as const,
      parentKind: "m:cn" as const,
      position: BigInt(index),
      tree,
      version,
    })),
  );
  rows = Rows.add(
    rows,
    TextNode,
    children.flatMap((child, index) =>
      child.kind === "text" ? [{ id: ids[index] ?? self, value: child.value }] : [],
    ),
  );
  if (attributes.type !== undefined) {
    rows = Rows.add(rows, MathmlString, [
      {
        attribute: "type",
        kind: "m:cn",
        node: self,
        value: attributes.type,
      },
    ]);
  }

  if (attributes.base !== undefined) {
    rows = Rows.add(rows, MathmlBase, [
      { attribute: "base", kind: "m:cn", node: self, value: MathmlBaseValue(attributes.base) },
    ]);
  }

  return rows;
};

/**
 * The rows of several `cn` elements read as one import's rows, in order.
 *
 * @param parts - The rows of each.
 * @returns Every relation's rows concatenated.
 */
const merge = (...parts: readonly Rows[]): Rows => {
  const all = new Map<Parameters<typeof Rows.of>[1], readonly object[]>();
  for (const rows of parts) {
    for (const [relation, own] of rows) {
      all.set(relation, [...(all.get(relation) ?? []), ...own]);
    }
  }

  return all;
};

const text = (value: string): Child => ({ kind: "text", value });

const sep: Child = { kind: "m:sep" };

/**
 * The rule of the refusal a `cn` draws, or `"passes"`.
 *
 * @param attributes - The `type` and `base`.
 * @param attributes.type - The `type`.
 * @param attributes.base - The `base`.
 * @param children - The content.
 * @returns The refusing rule, or `"passes"`.
 */
const verdict = (
  attributes: { readonly base?: `${number}`; readonly type?: string },
  ...children: readonly Child[]
): string => cnFinding(cnRows(1, attributes, children))?.rule ?? "passes";

describe("cnFinding", () => {
  it("accepts rows that hold no cn", () => {
    assert.strictEqual(cnFinding(Rows.empty()), undefined);
  });

  it("refuses a rational that holds no sep and passes one that holds one (probe 22)", () => {
    assert.strictEqual(verdict({ type: "rational" }, text("12")), "attribute-lexical");
    assert.strictEqual(verdict({ type: "rational" }, text("1"), sep, text("2")), "passes");
    assert.strictEqual(verdict({ type: "rational" }, text("22"), sep, text("7")), "passes");
    assert.strictEqual(
      verdict({ type: "rational" }, text("1"), sep, text("2"), sep, text("3")),
      "attribute-lexical",
    );
  });

  it("refuses a single-part type that holds a sep", () => {
    for (const type of ["integer", "real", "double", "hexdouble"]) {
      assert.strictEqual(verdict({ type }, text("1"), sep, text("2")), "attribute-lexical", type);
    }

    assert.strictEqual(verdict({}, text("1"), sep, text("2")), "attribute-lexical");
    assert.strictEqual(verdict({ type: "integer" }, text("12")), "passes");
  });

  it("requires exactly one sep of every two-part type", () => {
    for (const type of ["e-notation", "rational", "complex-cartesian", "complex-polar"]) {
      assert.strictEqual(verdict({ type }, text("1")), "attribute-lexical", type);
      assert.strictEqual(verdict({ type }, text("1"), sep, text("2")), "passes", type);
    }
  });

  it("reads a base's digits case-insensitively and by value (c4#contm.cn.extended)", () => {
    assert.strictEqual(verdict({ base: "16" }, text("FF")), "passes");
    assert.strictEqual(verdict({ base: "16", type: "integer" }, text("7FE0")), "passes");
    assert.strictEqual(verdict({ base: "16", type: "integer" }, text("ff60")), "passes");
    assert.strictEqual(verdict({ base: "16" }, text("FG")), "attribute-lexical");
    assert.strictEqual(verdict({ base: "2" }, text("12")), "attribute-lexical");
    assert.strictEqual(verdict({ base: "2" }, text("101")), "passes");
    assert.strictEqual(verdict({ base: "36" }, text("Zz")), "passes");
    assert.strictEqual(verdict({ base: "35" }, text("Z")), "attribute-lexical");
  });

  it("defaults the base to 10", () => {
    assert.strictEqual(verdict({}, text("FF")), "attribute-lexical");
    assert.strictEqual(verdict({ type: "integer" }, text("1a")), "attribute-lexical");
    assert.strictEqual(verdict({ base: "10" }, text("19")), "passes");
  });

  it("leaves the digits above base 36 to the application", () => {
    assert.strictEqual(verdict({ base: "1000" }, text("10F")), "passes");
    assert.strictEqual(verdict({ base: "99999999999999999999999999" }, text("zz")), "passes");
    assert.strictEqual(verdict({ base: "1000" }, text("1_0")), "attribute-lexical");
  });

  it("applies the base to the integer and real parts of a two-part type", () => {
    assert.strictEqual(
      verdict({ base: "16", type: "rational" }, text("A"), sep, text("F")),
      "passes",
    );
    assert.strictEqual(
      verdict({ base: "2", type: "rational" }, text("1"), sep, text("2")),
      "attribute-lexical",
    );
    assert.strictEqual(
      verdict({ base: "8", type: "complex-cartesian" }, text("7.7"), sep, text("8")),
      "attribute-lexical",
    );
  });

  it("holds a hexdouble to sixteen digits of 0-9 and A-F (c4#contm.cn.strict)", () => {
    assert.strictEqual(verdict({ type: "hexdouble" }, text("7F80000000000000")), "passes");
    assert.strictEqual(verdict({ type: "hexdouble" }, text("0123456789ABCDEF")), "passes");
    assert.strictEqual(verdict({ type: "hexdouble" }, text("7F800000")), "attribute-lexical");
    assert.strictEqual(
      verdict({ type: "hexdouble" }, text("7f80000000000000")),
      "attribute-lexical",
    );
    assert.strictEqual(
      verdict({ type: "hexdouble" }, text("7G80000000000000")),
      "attribute-lexical",
    );
    assert.strictEqual(
      verdict({ base: "2", type: "hexdouble" }, text("7F80000000000000")),
      "passes",
    );
  });

  it("holds a double to the lexical space of xs:double", () => {
    for (const value of [
      "-1E4",
      "1267.43233E12",
      "12.78e-2",
      " 12 ",
      "-0",
      "0",
      "INF",
      "-INF",
      "NaN",
      ".5",
      "5.",
    ]) {
      assert.strictEqual(verdict({ type: "double" }, text(value)), "passes", value);
    }

    for (const value of ["1e", "0x1", "inf", "nan", "1.2.3", "--1", "1 2", "", "e5"]) {
      assert.strictEqual(verdict({ type: "double" }, text(value)), "attribute-lexical", value);
    }
  });

  it("holds an integer to a sign and digits and a real to one point", () => {
    for (const value of ["0", "-31", "+7", " 42 "]) {
      assert.strictEqual(verdict({ type: "integer" }, text(value)), "passes", value);
    }

    for (const value of ["1.5", "--1", "1 2", "", "-", "1e5"]) {
      assert.strictEqual(verdict({ type: "integer" }, text(value)), "attribute-lexical", value);
    }

    for (const value of ["0.3", "1", "-31.56", ".5", "5.", "+0.0"]) {
      assert.strictEqual(verdict({}, text(value)), "passes", value);
    }

    for (const value of [".", "1.2.3", "1,5", "1e5", "", "NaN", "- 1"]) {
      assert.strictEqual(verdict({ type: "real" }, text(value)), "attribute-lexical", value);
    }
  });

  it("holds an e-notation to a real and an integer exponent", () => {
    assert.strictEqual(verdict({ type: "e-notation" }, text("12.3"), sep, text("5")), "passes");
    assert.strictEqual(verdict({ type: "e-notation" }, text("12.3"), sep, text("-5")), "passes");
    assert.strictEqual(
      verdict({ type: "e-notation" }, text("12.3"), sep, text("5.5")),
      "attribute-lexical",
    );
    assert.strictEqual(
      verdict({ type: "e-notation" }, text("1x"), sep, text("5")),
      "attribute-lexical",
    );
  });

  it("holds each part of a complex number to a real, whitespace trimmed (REC example)", () => {
    for (const type of ["complex-cartesian", "complex-polar"]) {
      assert.strictEqual(verdict({ type }, text(" 12.3 "), sep, text(" 5 ")), "passes", type);
      assert.strictEqual(verdict({ type }, text("2"), sep, text("3.1415")), "passes", type);
      assert.strictEqual(verdict({ type }, text("2"), sep, text("i")), "attribute-lexical", type);
    }
  });

  it("refuses a part that is empty", () => {
    assert.strictEqual(verdict({ type: "rational" }, sep, text("2")), "attribute-lexical");
    assert.strictEqual(verdict({ type: "rational" }, text("2"), sep), "attribute-lexical");
    assert.strictEqual(verdict({ type: "integer" }), "attribute-lexical");
  });

  it("does not judge a constant, an unknown type or a part that holds more than text", () => {
    assert.strictEqual(verdict({ type: "constant" }, text("π")), "passes");
    assert.strictEqual(verdict({ type: "constant" }, text("1"), sep, text("2")), "passes");
    assert.strictEqual(verdict({ type: "vector" }, text("not a number")), "passes");
    assert.strictEqual(verdict({}, text("x"), { kind: "m:mglyph" }), "passes");
    assert.strictEqual(
      verdict({ type: "rational" }, text("x"), { kind: "m:mglyph" }, sep, text("2")),
      "passes",
    );
    assert.strictEqual(
      verdict({ type: "rational" }, text("1"), sep, text("x"), { kind: "m:mglyph" }),
      "passes",
    );
  });

  it("refuses under attribute-lexical and names the node", () => {
    const rows = cnRows(1, { type: "rational" }, [text("12")]);
    const refused = cnFinding(rows);
    assert.strictEqual(refused?._tag, "ImportRefused");
    assert.strictEqual(refused?.rule, "attribute-lexical");
    assert.isTrue(refused?.detail.includes(id(100)));
  });

  it("returns the first offending cn in the order the rows were built", () => {
    const first = cnRows(1, {}, [text("1")]);
    const second = cnRows(2, { type: "integer" }, [text("x")]);
    const third = cnRows(3, { type: "integer" }, [text("y")]);
    const merged = merge(first, second, third);
    const refused = cnFinding(merged);
    assert.strictEqual(refused?.rule, "attribute-lexical");
    assert.isTrue(refused?.detail.includes(id(200)));
    assert.isFalse(refused?.detail.includes(id(300)));
  });
});
