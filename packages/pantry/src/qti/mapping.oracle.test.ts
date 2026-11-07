/**
 * The mapping overlays' free tests: their statements build beside the layers they read, each check
 * is named by an oracle law, and the typed map keys select exactly the lexical forms their base
 * types give a typed value, read against the deleted schema's lexical forms with JavaScript's
 * engine as the oracle.
 *
 * The database tests (`mapping.db.test.ts`) judge the same laws through PostgreSQL, and the
 * builder's rows are `#pantry/import/overlays/mapping.test.ts`'s.
 */
import { lexicalForm, pg } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { BaseTypePattern } from "#pantry/qti/expression-types.ts";
import {
  AreaMapping,
  exactValuePattern,
  floatKeyPattern,
  floatKeyPatternOf,
  floatKeyZeros,
  integerKeyPattern,
  LookupValue,
  MapKey,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
  Mapping,
  mappingLaws,
  LookupTable,
  pairKeyPattern,
  pointKeyPattern,
} from "#pantry/qti/mapping.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { searchTimeout } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, lawNames, lawsOf, ruleOf } from "#pantry/test/oracle.ts";

/**
 * The deleted schema's `xs:integer` lexical space (`src/schema/patterns.ts` `xsInteger` at the
 * W5 base), the integer base type's lexical form the typed integer key must equal.
 */
const oldInteger = /^[+-]?[0-9]+$/u;

/**
 * The deleted schema's `xs:double` lexical space (`src/schema/patterns.ts` `xsDouble`), the float
 * base type's lexical form the typed float key must lie inside.
 */
const oldDouble = /^(?:[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?|-?INF|NaN)$/u;

/**
 * Grizzle's own lexical form of `double precision`, unbounded: what a typed float key is cast
 * from, so a key outside it has no typed value.
 */
const grizzleDouble = new RegExp(lexicalForm(pg["double precision"]), "u");

/**
 * `integerKeyPattern` as JavaScript's engine reads it.
 */
const integerKey = new RegExp(integerKeyPattern, "u");

/**
 * `floatKeyPattern` as JavaScript's engine reads it.
 */
const floatKey = new RegExp(floatKeyPattern, "u");

/**
 * The relations this module declares.
 */
const mappingRelations = {
  AreaMapping,
  LookupTable,
  LookupValue,
  MapKey,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
  Mapping,
};

describe("qti/mapping.ts, declared", { timeout: searchTimeout }, () => {
  it("is composed into Qti, every relation under its own name and every statement once", () => {
    for (const relation of Object.values(mappingRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(Qti.relations, relation.name)?.value,
        relation,
      );
    }

    assert.strictEqual(new Set(mappingLaws).size, mappingLaws.length);
    for (const statement of mappingLaws) {
      assert.strictEqual(Qti.statements.filter((held) => held === statement).length, 1);
    }
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = mappingLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );

    for (const name of named) {
      const law = lawNames.find((known) => known === name);

      assert.isDefined(law, `${name} is no oracle law`);
      if (law !== undefined) {
        assert.isDefined(ruleOf(law), name);
      }
    }

    assert.deepStrictEqual([...new Set(named)].toSorted(), [
      "AreaMapping base type",
      "E1 derived",
      "Lookup table cardinality",
      "Typed attribute value",
    ]);
  });

  it("writes the float key pattern as grizzle's double form with each zero run bounded by one counted repetition", () => {
    // Oracle: grizzle's own `lexicalForm`, each `0*` bounded by `floatKeyZeros`.
    assert.strictEqual(
      floatKeyPattern,
      floatKeyPatternOf(lexicalForm(pg["double precision"]), floatKeyZeros),
    );
  });
});

/**
 * The characters the integer box draws keys from: a sign of each kind, the digits that tell a
 * leading zero from a magnitude, and characters no integer holds (a point, a letter, a space).
 */
const integerAlphabet = ["+", "-", "0", "1", "9", ".", "a", " "] as const;

/**
 * The characters the float box draws keys from: signs, digits, a point, both exponent letters, the
 * special values' letters, and a letter no double holds.
 */
const floatAlphabet = ["+", "-", "0", "1", ".", "e", "E", "I", "N", "F", "a"] as const;

/**
 * Every text of at most 4 characters over an alphabet.
 *
 * @param alphabet - The characters.
 * @returns The generator.
 */
const textsOver = (alphabet: readonly [string, ...string[]]): Gen<string> => {
  const letters = array(element(alphabet), { max: 4, min: 0 });

  return (source) => source.draw(letters).join("");
};

/**
 * Write a run of zeros.
 *
 * @param count - Its length.
 * @returns The run.
 */
const zeros = (count: number): string => "0".repeat(count);

/**
 * What a text in a key box is: a member of the typed key's selection, or not.
 */
type KeySituation = "selected" | "not selected";

describe("qti/mapping.ts, the typed keys' languages", { timeout: searchTimeout }, () => {
  it.effect(
    "selects exactly xs:integer's lexical forms as the integer keys that hold a typed value",
    (ctx) =>
      // Oracle: the specification as a checker, the deleted schema's `xsInteger`, read by
      // JavaScript's engine beside `integerKeyPattern`; reading 45 bounds no integer, so the two
      // languages are equal, and the key-text bound alone limits a key's length.
      // Bound: every text of at most 4 characters over 8 characters, 4,681.
      searched(
        ctx,
        exhaust(
          {
            box: "every text of at most 4 characters over + - 0 1 9 . a and a space",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<KeySituation>(["selected", "not selected"]),
            generator: textsOver(integerAlphabet),
            limit: 5000,
            literal: (text) => JSON.stringify(text),
            oracle: { kind: "specification", name: "xs:integer's lexical space (xsInteger)" },
            suite: "qti/mapping-integer-key",
          },
          (text: string, c) =>
            Effect.sync(() => {
              const selected = integerKey.test(text);
              c.note(selected ? "selected" : "not selected");

              assert.strictEqual(selected, oldInteger.test(text), JSON.stringify(text));
            }),
        ),
      ),
  );

  it.effect(
    "selects exactly the xs:double lexical forms of grizzle's double form as the float keys that hold a typed value",
    (ctx) =>
      // Oracle: the specification as a checker, the deleted schema's `xsDouble` and grizzle's own
      // `lexicalForm(pg["double precision"])`, read by JavaScript's engine: within the box every
      // run of zeros is below the key-text bound, so the bounded pattern is their intersection.
      // Bound: every text of at most 4 characters over 11 characters, 16,105.
      searched(
        ctx,
        exhaust(
          {
            box: "every text of at most 4 characters over + - 0 1 . e E I N F a",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<KeySituation>(["selected", "not selected"]),
            generator: textsOver(floatAlphabet),
            limit: 17_000,
            literal: (text) => JSON.stringify(text),
            oracle: {
              kind: "specification",
              name: "xs:double's lexical space (xsDouble) inside grizzle's double form",
            },
            suite: "qti/mapping-float-key",
          },
          (text: string, c) =>
            Effect.sync(() => {
              const selected = floatKey.test(text);
              c.note(selected ? "selected" : "not selected");

              assert.strictEqual(
                selected,
                oldDouble.test(text) && grizzleDouble.test(text),
                JSON.stringify(text),
              );
            }),
        ),
      ),
  );

  it("leaves out the float keys past grizzle's double form or past a zero run's bound, each a valid xs:double", () => {
    // Oracle: the specification as a checker, `xsDouble` and grizzle's `doubleForm` bounds
    // (`scalar/lexical.ts`: DBL_DIG significant digits each side of the point, an exponent of at
    // most 293), with the zero runs `floatKeyZeros` bounds.
    // Bound: each named variant at its edge, and its neighbour inside.
    const cases = [
      { inside: true, key: "123456789012345" },
      { inside: false, key: "1234567890123456" },
      { inside: true, key: "0.123456789012345" },
      { inside: false, key: "0.1234567890123456" },
      { inside: true, key: "1e293" },
      { inside: false, key: "1e294" },
      { inside: false, key: "1e400" },
      { inside: true, key: `${zeros(floatKeyZeros)}1` },
      { inside: false, key: `${zeros(floatKeyZeros + 1)}1` },
      { inside: true, key: `1.${zeros(15 + floatKeyZeros)}` },
      { inside: false, key: `1.${zeros(16 + floatKeyZeros)}` },
      { inside: true, key: `1e${zeros(floatKeyZeros)}1` },
      { inside: false, key: `1e${zeros(floatKeyZeros + 1)}1` },
      { inside: true, key: "-INF" },
      { inside: true, key: "NaN" },
    ] as const;

    for (const { inside, key } of cases) {
      assert.isTrue(oldDouble.test(key), `${key.slice(0, 24)} is an xs:double`);
      assert.strictEqual(floatKey.test(key), inside, key.slice(0, 24));
    }
  });
});

/**
 * `BaseTypePattern`'s row of a base type, as JavaScript's engine reads it: its lexical form with
 * collapse's whitespace absorbed.
 *
 * @param baseType - The base type.
 * @returns The pattern.
 */
const baseTypeForm = (baseType: string): RegExp =>
  new RegExp(BaseTypePattern.rows.find((row) => row.baseType === baseType)?.pattern ?? "^$", "u");

/**
 * `exactValuePattern` as JavaScript's engine reads it.
 */
const exactValue = new RegExp(exactValuePattern, "u");

/**
 * `pointKeyPattern` as JavaScript's engine reads it.
 */
const pointKey = new RegExp(pointKeyPattern, "u");

/**
 * `pairKeyPattern` as JavaScript's engine reads it.
 */
const pairKey = new RegExp(pairKeyPattern, "u");

/**
 * The characters the two-item box draws texts from: digits and signs a point's integers hold,
 * letters an identifier holds, one outside ASCII, a character no identifier holds, and both
 * whitespace a value may carry between its items.
 */
const itemAlphabet = ["0", "1", "-", "A", "é", "!", " ", "\t"] as const;

/**
 * What a text in the two-item box is to the patterns: a value written exactly, or with whitespace
 * around it, or no value of the base type.
 */
type ItemSituation = "exact value" | "padded value" | "no value";

/**
 * Name the situation a text of the two-item box reaches.
 *
 * @param value - Whether it is a point or a pair, whitespace absorbed.
 * @param exact - Whether it has no whitespace at either end.
 * @returns The situation.
 */
const itemSituationOf = (value: boolean, exact: boolean): ItemSituation => {
  if (!value) {
    return "no value";
  }

  return exact ? "exact value" : "padded value";
};

describe("qti/mapping.ts, the two-item keys and exact values", { timeout: searchTimeout }, () => {
  it.effect(
    "selects exactly the exactly written points, every exactly written pair, and judges exactness as XML whitespace at neither end",
    (ctx) =>
      // Oracle: the specification as a checker, `BaseTypePattern`'s point and pair rows (two
      // xs:integer or IdentifierDType items, one whitespace character between) intersected with
      // reading 7's exactness,
      // here a JavaScript trim of XML whitespace; `pairKeyPattern` may select more, the texts that
      // are no pair, which `Typed_attribute_value` refuses.
      // Bound: every text of at most 4 characters over 8 characters, 4,681.
      searched(
        ctx,
        exhaust(
          {
            box: "every text of at most 4 characters over 0 1 - A é ! space and tab",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<ItemSituation>(["exact value", "padded value", "no value"]),
            generator: textsOver(itemAlphabet),
            limit: 5000,
            literal: (text) => JSON.stringify(text),
            oracle: {
              kind: "specification",
              name: "BaseTypePattern's point and pair rows, exactly written (reading 7)",
            },
            suite: "qti/mapping-two-item-key",
          },
          (text: string, c) =>
            Effect.sync(() => {
              const exact = text.replaceAll(/^[\t\n\r ]+|[\t\n\r ]+$/gu, "") === text;
              const point = baseTypeForm("point").test(text);
              const pair = baseTypeForm("pair").test(text);
              c.note(itemSituationOf(point || pair, exact));

              assert.strictEqual(exactValue.test(text), exact, JSON.stringify(text));
              assert.strictEqual(pointKey.test(text), point && exact, JSON.stringify(text));
              assert.isTrue(!(pair && exact) || pairKey.test(text), JSON.stringify(text));
            }),
        ),
      ),
  );
});

/**
 * The oracle's tables, read from the composed grammar once.
 */
const oracleLaws = lawsOf(grammar);

/**
 * Write an item whose one response declaration of a base type maps the given keys, and whose one
 * single integer outcome looks up the given target.
 *
 * @param baseType - The response's base type.
 * @param keys - The map keys, in order, each written as an attribute's value.
 * @param target - The match table entry's target value.
 * @returns The item's text.
 */
const mappedItem = (baseType: string, keys: readonly string[], target: string): string =>
  [
    '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false">',
    `<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="${baseType}">`,
    '<qti-mapping default-value="0">',
    ...keys.map((key) => `<qti-map-entry map-key="${key}" mapped-value="1"/>`),
    "</qti-mapping>",
    "</qti-response-declaration>",
    '<qti-outcome-declaration identifier="GRADE" cardinality="single" base-type="integer">',
    `<qti-match-table><qti-match-table-entry source-value="1" target-value="${target}"/></qti-match-table>`,
    "</qti-outcome-declaration>",
    "</qti-assessment-item>",
  ].join("");

/**
 * Judge an item by the oracle and name the mapping laws it breaks.
 *
 * @param text - The item.
 * @returns The breaches of Map key and Typed attribute value, each with its keys.
 */
const mappingBreachesOf = (text: string) =>
  Effect.gen(function* judgedMappings() {
    const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
    const tree = yield* Effect.orDie(shred(xml, "3.0.1", shredGrammarOf(grammar)));
    const rows = yield* Effect.orDie(
      Effect.fromResult(
        fold(
          tree,
          (index): NodeId => `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`,
          foldGrammarOf(grammar),
        ),
      ),
    );

    return documentBreaches("item.xml", rows, oracleLaws)
      .filter(({ law }) => law === "Map key" || law === "Typed attribute value")
      .map(({ keys, law }) => `${law} ${JSON.stringify(keys)}`);
  });

describe("qti/mapping.ts, the oracle's mapping laws", { timeout: searchTimeout }, () => {
  it.effect(
    "refuses a repeated key by its base type's value, keeps a float outside grizzle's form apart from a typed value its text spells, and refuses a typed value no lexical form of its base type spells",
    () =>
      // Oracle: the specification as a checker: §5.88.4 and §7.21 (a mapping is a function of its
      // source value), §8.13 (a pair undirected, a directed pair and a point ordered tuples),
      // readings 7, 8, 34 and 45, and reading 56's stated limit, under which `1e+307` names the
      // double `100000000000000e293` does and is still compared by its text alone.
      // Bound: each named variant, once.
      Effect.gen(function* oracleVariants() {
        const cases = [
          { breaks: ["Map key"], keys: ["1", "01"], name: "integer repeat", type: "integer" },
          { breaks: ["Map key"], keys: ["1", "1.0"], name: "float repeat", type: "float" },
          {
            breaks: [],
            keys: ["100000000000000e293", "1e+307"],
            name: "float outside the form spelling a typed value",
            type: "float",
          },
          { breaks: [], keys: ["York", "york"], name: "string by code point", type: "string" },
          { breaks: ["Map key"], keys: ["A B", "B A"], name: "pair undirected", type: "pair" },
          { breaks: [], keys: ["A B", "B A"], name: "directed pair", type: "directedPair" },
          { breaks: ["Map key"], keys: ["A B", "A\tB"], name: "tab", type: "directedPair" },
          {
            breaks: ["Typed attribute value"],
            keys: ["A  B"],
            name: "two spaces",
            type: "directedPair",
          },
          { breaks: ["Map key"], keys: ["1 2", "01 +2"], name: "point", type: "point" },
          { breaks: ["Typed attribute value"], keys: ["abc"], name: "no integer", type: "integer" },
          { breaks: ["Typed attribute value"], keys: [" 1"], name: "padded", type: "integer" },
          { breaks: ["Typed attribute value"], keys: ["1"], name: "boolean 1", type: "boolean" },
          { breaks: [], keys: [" x "], name: "padded string", type: "string" },
        ] as const;

        for (const { breaks, keys, name, type } of cases) {
          const found = yield* mappingBreachesOf(mappedItem(type, keys, "7"));

          assert.deepStrictEqual(
            found.map((breach) => breach.split(" {")[0]),
            [...breaks],
            `${name}: ${found.join("; ")}`,
          );
        }

        const target = yield* mappingBreachesOf(mappedItem("string", ["a"], "x"));
        assert.deepStrictEqual(
          target.map((breach) => breach.split(" {")[0]),
          ["Typed attribute value"],
          `an integer outcome's target x: ${target.join("; ")}`,
        );
      }),
  );
});
