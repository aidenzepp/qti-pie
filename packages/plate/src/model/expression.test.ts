import { assert, describe, it } from "@effect/vitest";
import {
  expressionKinds,
  floatOrRefOf,
  intOrIdentifierOf,
  integerOrRefOf,
  stringOrRefOf,
} from "#plate/model/expression.ts";
import { tables } from "#plate/validate/tables.ts";

describe("expressionKinds", () => {
  it("holds 64 kinds, none repeated", () => {
    assert.strictEqual(expressionKinds.length, 64);
    assert.strictEqual(new Set(expressionKinds).size, 64);
  });

  it("names, with the qti- prefix, exactly the XSD's children of qti-set-outcome-value", () => {
    const children = tables.elements["qti-set-outcome-value"]?.children ?? [];
    const fromXsd = new Set(children.map((child) => child.local));

    assert.isAbove(fromXsd.size, 0);
    assert.deepStrictEqual(new Set(expressionKinds.map((kind) => `qti-${kind}`)), fromXsd);
  });
});

describe("integerOrRefOf", () => {
  it("reads an xs:integer with its whitespace collapsed as an exact literal", () => {
    assert.deepStrictEqual(integerOrRefOf(" 42 "), { _tag: "literal", value: 42n });
  });

  it("reads INF, NaN and a name as references, by the union's order (ruling R4)", () => {
    assert.deepStrictEqual(integerOrRefOf("INF"), { _tag: "ref", identifier: "INF" });
    assert.deepStrictEqual(integerOrRefOf("NaN"), { _tag: "ref", identifier: "NaN" });
    assert.deepStrictEqual(integerOrRefOf("x"), { _tag: "ref", identifier: "x" });
  });
});

describe("floatOrRefOf", () => {
  it("reads INF, -INF, NaN and a decimal as xs:double literals", () => {
    assert.deepStrictEqual(floatOrRefOf("INF"), {
      _tag: "literal",
      value: Number.POSITIVE_INFINITY,
    });
    assert.deepStrictEqual(floatOrRefOf("-INF"), {
      _tag: "literal",
      value: Number.NEGATIVE_INFINITY,
    });
    assert.deepStrictEqual(floatOrRefOf("NaN"), { _tag: "literal", value: Number.NaN });
    assert.deepStrictEqual(floatOrRefOf("1.5"), { _tag: "literal", value: 1.5 });
  });

  it("reads a name as a reference", () => {
    assert.deepStrictEqual(floatOrRefOf("x"), { _tag: "ref", identifier: "x" });
  });
});

describe("intOrIdentifierOf", () => {
  it("reads an xs:int as an exact literal", () => {
    assert.deepStrictEqual(intOrIdentifierOf("5"), { _tag: "literal", value: 5n });
  });

  it("reads a name as a reference", () => {
    assert.deepStrictEqual(intOrIdentifierOf("n"), { _tag: "ref", identifier: "n" });
  });
});

describe("stringOrRefOf", () => {
  it("reads {X} as a reference when X names a declared variable (ruling R1)", () => {
    assert.deepStrictEqual(stringOrRefOf("{X}", new Set(["X"])), {
      _tag: "ref",
      identifier: "X",
    });
  });

  it("reads {X} as literal text, braces kept, when X names nothing (ruling R1)", () => {
    assert.deepStrictEqual(stringOrRefOf("{X}", new Set(["Y"])), {
      _tag: "literal",
      value: "{X}",
    });
  });

  it("reads other text as the literal as written, untrimmed", () => {
    assert.deepStrictEqual(stringOrRefOf(" [0-9]+ ", new Set(["X"])), {
      _tag: "literal",
      value: " [0-9]+ ",
    });
  });
});
