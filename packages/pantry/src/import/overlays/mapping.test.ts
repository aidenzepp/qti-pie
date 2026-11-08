/* oxlint-disable unicorn/text-encoding-identifier-case -- The generated documents carry the charset label crust's reader reports, `UTF-8`. */
/**
 * The mapping overlays' rows against a second reading of the same tree: a direct walk of the XDM
 * document that numbers its nodes in document order as the tree's rows are numbered, collects one
 * map key per `qti-map-entry` from its attributes, and splits each typed key as its base type
 * reads it, an integer's magnitude by JavaScript's `BigInt`. The walk shares no code with the
 * builder, which reads the tree's flat rows (`flatten`). Each typed key's value is PostgreSQL's,
 * generated from the split, so `#pantry/qti/mapping.db.test.ts` judges it.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { ownContext } from "#pantry/import/fold.ts";
import {
  integerPartsOf,
  pairPartsOf,
  pointPartsOf,
  rowsOf,
} from "#pantry/import/overlays/mapping.ts";
import type { MappingIds } from "#pantry/import/overlays/mapping.ts";
import { integerKeyPattern, pairKeyPattern, pointKeyPattern } from "#pantry/qti/mapping.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName } from "#pantry/model/xdm.ts";
import type {
  ClosedName,
  NodeId,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import { idOf, searchTimeout } from "#pantry/test/gen/xdm.ts";

/**
 * The deleted schema's `xs:integer` lexical space (`src/schema/patterns.ts` `xsInteger`): the
 * integer keys that hold a typed value.
 */
const xsInteger = /^[+-]?[0-9]+$/u;

/**
 * The deleted schema's `xs:double` lexical space (`src/schema/patterns.ts` `xsDouble`): the float
 * keys that hold a typed value, every one of them (spec reading 154).
 */
const xsDouble = /^(?:[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?|-?INF|NaN)$/u;

/**
 * Read a key as the value its mapping's base type gives it, as the walk compares keys: an integer
 * by `BigInt`, a float by `Number`, and every other key as written.
 *
 * @param baseType - The mapping's base type.
 * @param key - The key.
 * @returns The value's text.
 */
const typedOf = (baseType: string, key: string): string => {
  if (baseType === "integer" && xsInteger.test(key)) {
    return String(BigInt(key));
  }

  return baseType === "float" && xsDouble.test(key) ? String(Number(key)) : key;
};

/**
 * The ids every case writes its rows under, each node's by its number, in the context of a
 * document no site names.
 */
const ids: MappingIds = { context: ownContext(idOf(0)), idOf };

/**
 * One map entry of a generated mapping: its key and its mapped value, as written.
 */
interface Entry {
  readonly caseSensitive?: string;
  readonly key: string;
  readonly value: string;
}

/**
 * One generated mapping: its declaration's base type and its entries in order.
 */
interface MappingCase {
  readonly baseType: "directedPair" | "float" | "integer" | "pair" | "point" | "string";
  readonly entries: readonly Entry[];
}

/**
 * The entries a mapping draws from: three keys, two of one integer and float spelled apart (`1`,
 * `01`) and one of a float alone (`1.0`), each with one of two mapped values, so a box of four
 * entries holds identical entries, entries with one key and two values, and keys equal as typed
 * values only.
 */
const entryAlphabet = [
  { key: "1", value: "0.5" },
  { key: "1", value: "1" },
  { key: "01", value: "0.5" },
  { key: "01", value: "1" },
  { key: "1.0", value: "0.5" },
  { key: "1.0", value: "1" },
] as const satisfies readonly Entry[];

/**
 * Every mapping of one of three base types holding at most 4 entries over {@link entryAlphabet}.
 */
const mappingCases: Gen<MappingCase> = (source) => ({
  baseType: source.draw(element(["float", "integer", "string"] as const)),
  entries: source.draw(array(element(entryAlphabet), { max: 4, min: 0 })),
});

/**
 * An element's attributes, as (name, lexical) pairs in order.
 */
type Attributes = readonly (readonly [ClosedName<Composed>, string])[];

/**
 * An element with closed attributes.
 *
 * @param kind - Its kind.
 * @param attributes - Its attributes' names and lexical forms, in order.
 * @param children - Its children.
 * @returns The element.
 */
const elementOf = (
  kind: XdmClosedElement<Composed>["kind"],
  attributes: Attributes,
  children: readonly XdmChild<Composed>[],
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes: attributes.map(([handle, lexical]) => ({
    lexical,
    name: closedName(handle),
    references: [],
  })),
  children,
  governs: "none",
  kind,
  namespaces: [],
  prefix: "",
});

/**
 * Write a generated mapping as the tree shred would give: an item holding one response declaration
 * `RESPONSE` of the case's base type, its `qti-mapping` holding the entries, whitespace between
 * them so character data shares the numbering.
 *
 * @param input - The mapping.
 * @returns The tree.
 */
const treeOf = (input: MappingCase): XdmDocument<Composed> => {
  const ws: XdmChild<Composed> = { _tag: "ws", value: "\n" };
  const entries = input.entries.flatMap(({ caseSensitive, key, value }) => [
    ws,
    elementOf(
      "qti-map-entry",
      [
        ["map-key", key],
        ["mapped-value", value],
        ...(caseSensitive === undefined
          ? []
          : ([["case-sensitive", caseSensitive]] as const satisfies Attributes)),
      ],
      [],
    ),
  ]);

  return {
    _tag: "document",
    charset: "UTF-8",
    declaration: Option.none(),
    doctype: Option.none(),
    epilog: [],
    exportCharset: "UTF-8",
    prolog: [],
    root: elementOf(
      "qti-assessment-item",
      [["identifier", "item"]],
      [
        elementOf(
          "qti-response-declaration",
          [
            ["identifier", "RESPONSE"],
            ["cardinality", "multiple"],
            ["base-type", input.baseType],
          ],
          [elementOf("qti-mapping", [["default-value", "0"]], entries)],
        ),
      ],
    ),
    version: "3.0.1",
  };
};

/**
 * The map keys a mapping's tree implies, by a direct walk: the item is node 1, its declaration 2
 * and its mapping 3, and each entry follows the whitespace before it, so entry `i` is node
 * `5 + 2i`; one key per entry, its key as written.
 *
 * @param input - The mapping.
 * @returns Each entry's node, mapping and key, by its node.
 */
const walkedKeys = (
  input: MappingCase,
): ReadonlyMap<NodeId, { readonly key: string; readonly mapping: NodeId }> =>
  new Map(
    input.entries.map(({ key }, at) => [ids.idOf(5 + 2 * at), { key, mapping: ids.idOf(3) }]),
  );

/**
 * A situation the box must reach: two identical entries, two entries of one key and two values,
 * two integer keys equal as integers only, and two float keys equal as doubles only.
 */
type KeySituation = "identical entries" | "one key, two values" | "typed repeat" | "distinct";

/**
 * Name the situations one mapping reaches.
 *
 * @param input - The mapping.
 * @returns Its situations.
 */
const situationsOf = (input: MappingCase): readonly KeySituation[] => {
  const texts = input.entries.map(({ key, value }) => `${key} ${value}`);
  const keys = input.entries.map(({ key }) => key);
  const typed = keys.map((key) => typedOf(input.baseType, key));
  const situations: [KeySituation, boolean][] = [
    ["identical entries", new Set(texts).size < texts.length],
    ["one key, two values", new Set(keys).size < new Set(texts).size],
    ["typed repeat", new Set(typed).size < new Set(keys).size],
  ];
  const reached = situations.flatMap(([situation, holds]) => (holds ? [situation] : []));

  return reached.length === 0 ? ["distinct"] : reached;
};

describe("import/overlays/mapping.ts, map keys", { timeout: searchTimeout }, () => {
  it.effect(
    "writes one MapKey row per qti-map-entry, distinct by node, even where two entries are identical, and each typed key's row by its base type",
    (ctx) =>
      // Oracle: a second implementation, a direct walk of the XDM tree that numbers its entries in
      // document order, against the builder's read of the flat rows; each integer key's selection
      // by the deleted `xsInteger`, and each float key's by the deleted `xsDouble`.
      // Bound: every mapping of 3 base types with at most 4 entries over 3 keys and 2 values,
      // 4,665.
      searched(
        ctx,
        exhaust(
          {
            box: "every mapping of float, integer or string with at most 4 entries over 3 keys and 2 values",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<KeySituation>([
              "identical entries",
              "one key, two values",
              "typed repeat",
              "distinct",
            ]),
            generator: mappingCases,
            limit: 5000,
            literal: (input) =>
              `${input.baseType}: ${input.entries.map(({ key, value }) => `${key}=${value}`).join(" ")}`,
            oracle: { kind: "second-implementation", name: "a direct walk of the XDM tree" },
            suite: "pantry/import/overlays-mapping-keys",
          },
          (input: MappingCase, c) =>
            Effect.sync(() => {
              c.noteAll(situationsOf(input));

              const rows = rowsOf(treeOf(input), ids);
              const walked = walkedKeys(input);

              assert.strictEqual(rows.MapKey.size, input.entries.length);
              assert.deepStrictEqual(
                [...rows.MapKey].map(([node, row]) => [node, row.node, row.mapping, row.key]),
                [...walked].map(([node, { key, mapping }]) => [node, node, mapping, key]),
              );
              for (const row of rows.MapKey.values()) {
                assert.strictEqual(row.baseTypes, 1n);
              }

              assert.deepStrictEqual(
                [...rows.MapKeyType].map(([node, row]) => [
                  node,
                  row.mapping,
                  row.key,
                  row.baseType,
                ]),
                [...walked].map(([node, { key, mapping }]) => [node, mapping, key, input.baseType]),
              );

              assert.deepStrictEqual(
                [...rows.MapKeyInteger].map(([node, row]) => [node, row.key]),
                input.baseType === "integer"
                  ? [...walked].flatMap(([node, { key }]) =>
                      xsInteger.test(key) ? [[node, key]] : [],
                    )
                  : [],
              );
              assert.deepStrictEqual(
                [...rows.MapKeyFloat].map(([node, row]) => [node, row.key]),
                input.baseType === "float"
                  ? [...walked].flatMap(([node, { key }]) =>
                      xsDouble.test(key) ? [[node, key]] : [],
                    )
                  : [],
              );
              assert.deepStrictEqual([...rows.Mapping.keys()], [ids.idOf(3)]);
              assert.strictEqual(rows.Mapping.get(ids.idOf(3))?.baseTypes, 1n);
              assert.strictEqual(rows.Mapping.get(ids.idOf(3))?.declaration, ids.idOf(2));
              assert.deepStrictEqual(rows.MappingBaseType.get(ids.idOf(3)), {
                baseType: input.baseType,
                declaration: ids.idOf(2),
                node: ids.idOf(3),
              });
            }),
        ),
      ),
  );
});

describe("import/overlays/mapping.ts, how a map key is matched", () => {
  it("writes a string key folded unless its entry's case-sensitive is true, so `matched` is the key a response meets", () => {
    // Oracle: reading 98 (decision 321 (6)): a string key is case-folded where its entry's
    // `case-sensitive` is false, the default, and compared by code points where it is true;
    // `xs:boolean`'s whiteSpace is collapse, so a padded true is true. An entry matched
    // case-sensitively beside one matched case-insensitively is two keys.
    // Bound: the one mapping each declared base type is written with, its entries named.
    const rows = rowsOf(
      treeOf({
        baseType: "string",
        entries: [
          { caseSensitive: "true", key: "York", value: "1" },
          { key: "york", value: "0.5" },
          { key: "YORK", value: "0.5" },
          { caseSensitive: " 1 ", key: "York", value: "1" },
          { caseSensitive: "false", key: "Leeds", value: "1" },
        ],
      }),
      ids,
    );
    const matches = [...rows.MapKey.values()].map((row) => [
      row.key,
      row.caseText,
      row.folded,
      row.matched,
    ]);

    assert.deepStrictEqual(matches, [
      ["York", "true", false, "York"],
      ["york", "", true, "york"],
      ["YORK", "", true, "york"],
      ["York", " 1 ", false, "York"],
      ["Leeds", "false", true, "leeds"],
    ]);

    const identifiers = rowsOf(
      treeOf({ baseType: "directedPair", entries: [{ key: "A B", value: "1" }] }),
      ids,
    );
    assert.deepStrictEqual(
      [...identifiers.MapKey.values()].map((row) => [row.folded, row.matched]),
      [[false, "A B"]],
    );
  });
});

/**
 * The identity of each entry of a string mapping's keys: its mapping and the key as written.
 *
 * @param entries - The mapping's entries.
 * @returns One identity text per entry.
 */
const identityOf = (entries: readonly { caseSensitive?: string; key: string }[]) =>
  [
    ...rowsOf(
      treeOf({
        baseType: "string",
        entries: entries.map((entry) => ({ ...entry, value: "1" })),
      }),
      ids,
    ).MapKey.values(),
  ].map((row) => JSON.stringify([row.mapping, row.key]));

describe("import/overlays/mapping.ts, which map keys are one key", () => {
  it("writes the key as written as a key's identity, so York and york are two keys and york written twice is one whatever its matching (readings 160 and 164)", () => {
    // Oracle: readings 160 and 164 (decisions 425 and 433): keys written apart are two keys
    // whatever their matching, and a key written twice is one whatever each entry's
    // case-sensitive says; the schema's uniqueness is `key(MapKey(mapping, key))`, so the
    // identity read here is that pair.
    // Bound: the one string mapping, its entries named.
    assert.strictEqual(new Set(identityOf([{ key: "York" }, { key: "york" }])).size, 2);
    assert.strictEqual(new Set(identityOf([{ key: "york" }, { key: "york" }])).size, 1);
    assert.strictEqual(
      new Set(identityOf([{ key: "york" }, { caseSensitive: "false", key: "york" }])).size,
      1,
    );
    assert.strictEqual(
      new Set(identityOf([{ caseSensitive: "true", key: "york" }, { key: "york" }])).size,
      1,
    );
  });
});

/**
 * A situation the integer box must reach: a key with a sign, with leading zeros, and the zero
 * spelled with a sign.
 */
type IntegerSituation = "signed" | "padded" | "signed zero" | "plain";

/**
 * Name the situation an integer key reaches.
 *
 * @param signed - Whether it starts with a sign.
 * @param magnitude - Its digits.
 * @returns The situation, a signed zero before a padded key before a signed one.
 */
const situationOfInteger = (signed: boolean, magnitude: string): IntegerSituation => {
  if (signed && /^0+$/u.test(magnitude)) {
    return "signed zero";
  }

  if (magnitude.length > 1 && magnitude.startsWith("0")) {
    return "padded";
  }

  return signed ? "signed" : "plain";
};

describe("import/overlays/mapping.ts, an integer key's split", { timeout: searchTimeout }, () => {
  it.effect(
    "splits every xs:integer key into the parts E1_derived proves, its digits the magnitude of the integer it names",
    (ctx) =>
      // Oracle: a second implementation, JavaScript's `BigInt` of the key, whose magnitude's
      // decimal string is the digits of XML Schema's canonical form of xs:integer (no leading
      // zero); the parts against E1_derived's equality, restated.
      // Bound: every sign or none before every run of 1 to 3 digits over 0, 1 and 9, 117.
      searched(
        ctx,
        exhaust(
          {
            box: "every optional sign before 1 to 3 digits over 0, 1 and 9",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<IntegerSituation>([
              "signed",
              "padded",
              "signed zero",
              "plain",
            ]),
            generator: (source) =>
              `${source.draw(element(["", "+", "-"] as const))}${source
                .draw(array(element(["0", "1", "9"] as const), { max: 3, min: 1 }))
                .join("")}`,
            limit: 200,
            literal: (key) => JSON.stringify(key),
            oracle: { kind: "second-implementation", name: "JavaScript's BigInt of the key" },
            suite: "pantry/import/overlays-mapping-integer",
          },
          (key: string, c) =>
            Effect.sync(() => {
              const signed = key.startsWith("+") || key.startsWith("-");
              const magnitude = signed ? key.slice(1) : key;
              c.note(situationOfInteger(signed, magnitude));

              const parts = integerPartsOf(key);
              const integer = BigInt(key);
              assert.isDefined(parts, key);
              if (parts !== undefined) {
                assert.strictEqual(parts.digits, String(integer < 0n ? -integer : integer), key);
                assert.strictEqual(`${parts.sign}${parts.zeros}${parts.digits}`, key);
              }
            }),
        ),
      ),
  );
});

/**
 * The keys a two-item mapping draws from: a pair and its reverse, the pair with a tab between, a
 * point and its spelling with a zero and a sign, and two items one of which is past U+FFFF.
 */
const twoItemKeys = ["A B", "B A", "A\tB", "1 2", "01 +2", "\u{10000} \u{E000}"] as const;

/**
 * Every mapping of one of the three two-item base types holding at most 3 entries over
 * {@link twoItemKeys}, each mapped to 1.
 */
const twoItemCases: Gen<MappingCase> = (source) => ({
  baseType: source.draw(element(["point", "pair", "directedPair"] as const)),
  entries: source
    .draw(array(element(twoItemKeys), { max: 3, min: 0 }))
    .map((key) => ({ key, value: "1" })),
});

/**
 * Split a two-item key as its base type reads it, by a second reading: its two items and the one
 * whitespace character between them, a point's items each an `xs:integer`.
 *
 * @param baseType - The mapping's base type.
 * @param key - The key.
 * @returns The first item, the whitespace and the second item, or none for a key that is not two
 *   items of the base type.
 */
const twoItemsOf = (baseType: string, key: string): readonly string[] | undefined => {
  const gaps = [...key.matchAll(/[\t\n\r ]/gu)];
  const [gap] = gaps;
  if (gaps.length !== 1 || gap === undefined) {
    return undefined;
  }

  const first = key.slice(0, gap.index);
  const second = key.slice(gap.index + 1);
  const integers = baseType !== "point" || (xsInteger.test(first) && xsInteger.test(second));

  return first !== "" && second !== "" && integers ? [first, gap[0], second] : undefined;
};

/**
 * A two-item key's typed row as the test compares it: its entry's node, and its first item, the
 * whitespace and its second item.
 */
type SplitRow = readonly [string, readonly string[]];

/**
 * A situation the two-item box must reach: a key its base type splits, a key it does not (a pair
 * of letters in a point mapping), and a mapping with no entry.
 */
type TwoItemSituation = "split" | "unsplit" | "no entry";

/**
 * The characters a typed key's parse and its pattern are drawn over: the signs, two digits, a
 * letter, the space and the tab, and U+0001, a C0 control character an XML 1.1 document writes as
 * the character reference `&#x1;`, which no item of a pair key's pattern holds.
 */
const keyCharacters = ["+", "-", "0", "1", "a", " ", "\t", "\u{1}"] as const;

/**
 * A situation the parse box must reach: a key its integer or point parse holds, a pair key its
 * pattern holds, one its split holds past its pattern, and one no typed form holds.
 */
type ParseSituation = "integer" | "point" | "pair" | "pair past its pattern" | "untyped";

describe("import/overlays/mapping.ts, a typed key's parse", { timeout: searchTimeout }, () => {
  it.effect(
    "parses an integer or a point key exactly where its pattern holds it, and splits a pair key past its pattern only on a character no item of it holds",
    (ctx) =>
      // Oracle: the schema's selection patterns, `integerKeyPattern`, `pointKeyPattern` and
      // `pairKeyPattern`, which select the keys whose typed row the database mirrors, read by
      // JavaScript's engine. The integer and point parses are the one test the builder makes, so
      // each holds a key exactly where its pattern does; the pair split is wider, so the builder
      // tests the pattern first, and the two part exactly on a key that holds U+0001.
      // Bound: every key of 1 to 4 characters over `keyCharacters`, 4,680; residual: longer keys,
      // which repeat these shapes.
      searched(
        ctx,
        exhaust(
          {
            box: "every key of 1 to 4 characters over signs, two digits, a letter, space, tab and U+0001",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<ParseSituation>([
              "integer",
              "point",
              "pair",
              "pair past its pattern",
              "untyped",
            ]),
            generator: (source) =>
              source.draw(array(element(keyCharacters), { max: 4, min: 1 })).join(""),
            limit: 5000,
            literal: (key) => JSON.stringify(key),
            oracle: { kind: "specification", name: "the schema's typed-key selection patterns" },
            suite: "pantry/import/overlays-mapping-parse",
          },
          (key: string, c) =>
            Effect.sync(() => {
              const integer = new RegExp(integerKeyPattern, "u").test(key);
              const point = new RegExp(pointKeyPattern, "u").test(key);
              const pair = new RegExp(pairKeyPattern, "u").test(key);
              const split = pairPartsOf(key) !== undefined;
              const situations: readonly [ParseSituation, boolean][] = [
                ["integer", integer],
                ["point", point],
                ["pair", pair],
                ["pair past its pattern", split],
              ];
              c.note(situations.find(([, holds]) => holds)?.[0] ?? "untyped");

              assert.strictEqual(integerPartsOf(key) !== undefined, integer, key);
              assert.strictEqual(pointPartsOf(key) !== undefined, point, key);
              assert.isTrue(!pair || split, key);
              assert.strictEqual(split && !pair, split && key.includes("\u{1}"), key);
            }),
        ),
      ),
  );
});

describe("import/overlays/mapping.ts, two-item keys", { timeout: searchTimeout }, () => {
  it.effect(
    "writes each point, pair and directed pair key's typed row, its split the second reading's items",
    (ctx) =>
      // Oracle: a second implementation, a split at the one XML whitespace character, a point's
      // items each an xs:integer, against the builder's split, which E1_derived holds to the key
      // and PostgreSQL generates each value from (§8.13).
      // Bound: every mapping of point, pair or directedPair with at most 3 entries over 6 keys,
      // 777.
      searched(
        ctx,
        exhaust(
          {
            box: "every mapping of point, pair or directedPair with at most 3 entries over 6 keys",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<TwoItemSituation>(["split", "unsplit", "no entry"]),
            generator: twoItemCases,
            limit: 1000,
            literal: (input) =>
              `${input.baseType}: ${input.entries.map(({ key }) => JSON.stringify(key)).join(" ")}`,
            oracle: { kind: "second-implementation", name: "a whitespace split" },
            suite: "pantry/import/overlays-mapping-two-items",
          },
          (input: MappingCase, c) =>
            Effect.sync(() => {
              const split = input.entries.map(({ key }) => twoItemsOf(input.baseType, key));
              c.noteAll([
                ...(split.length === 0 ? (["no entry"] as const) : []),
                ...(split.some((items) => items !== undefined) ? (["split"] as const) : []),
                ...(split.some((items) => items === undefined) ? (["unsplit"] as const) : []),
              ]);

              const rows = rowsOf(treeOf(input), ids);
              const typed = {
                directedPair: [...rows.MapKeyDirectedPair].map(([node, row]): SplitRow => [
                  node,
                  [row.source, row.gap, row.target],
                ]),
                pair: [...rows.MapKeyPair].map(([node, row]): SplitRow => [
                  node,
                  [row.first, row.gap, row.second],
                ]),
                point: [...rows.MapKeyPoint].map(([node, row]): SplitRow => [
                  node,
                  [
                    `${row.xSign}${row.xZeros}${row.xDigits}`,
                    row.gap,
                    `${row.ySign}${row.yZeros}${row.yDigits}`,
                  ],
                ]),
              };
              const expected = [...walkedKeys(input)].flatMap(([node, { key }]) =>
                Option.toArray(
                  Option.map(
                    Option.fromNullishOr(twoItemsOf(input.baseType, key)),
                    (items): SplitRow => [node, items],
                  ),
                ),
              );

              for (const [baseType, held] of Object.entries(typed)) {
                assert.deepStrictEqual(held, baseType === input.baseType ? expected : [], baseType);
              }
            }),
        ),
      ),
  );
});

/**
 * One generated lookup table: its kind, its default value or none, and its entries' targets.
 */
interface TableCase {
  readonly defaultValue: string | undefined;
  readonly kind: "qti-interpolation-table" | "qti-match-table";
  readonly targets: readonly string[];
}

/**
 * Every table of either kind, with or without a default, holding at most 2 entries over 2
 * targets.
 */
const tableCases: Gen<TableCase> = (source) => ({
  defaultValue: source.draw(element(["x", undefined] as const)),
  kind: source.draw(element(["qti-match-table", "qti-interpolation-table"] as const)),
  targets: source.draw(array(element(["1", "two"] as const), { max: 2, min: 0 })),
});

/**
 * Write a generated table as the tree shred would give: an item holding one single outcome
 * declaration of base type integer holding the table, whitespace before each entry.
 *
 * @param input - The table.
 * @returns The tree.
 */
const tableTreeOf = (input: TableCase): XdmDocument<Composed> => {
  const ws: XdmChild<Composed> = { _tag: "ws", value: "\n" };
  const entryKind =
    input.kind === "qti-match-table" ? "qti-match-table-entry" : "qti-interpolation-table-entry";
  const entries = input.targets.flatMap((target) => [
    ws,
    elementOf(
      entryKind,
      [
        ["source-value", "1"],
        ["target-value", target],
      ],
      [],
    ),
  ]);

  return {
    ...treeOf({ baseType: "integer", entries: [] }),
    root: elementOf(
      "qti-assessment-item",
      [["identifier", "item"]],
      [
        elementOf(
          "qti-outcome-declaration",
          [
            ["identifier", "GRADE"],
            ["cardinality", "single"],
            ["base-type", "integer"],
          ],
          [
            elementOf(
              input.kind,
              input.defaultValue === undefined ? [] : [["default-value", input.defaultValue]],
              entries,
            ),
          ],
        ),
      ],
    ),
  };
};

describe("import/overlays/mapping.ts, lookup values", { timeout: searchTimeout }, () => {
  it.effect(
    "writes one LookupValue row per table default and entry target, as written, beside its table's base type",
    (ctx) =>
      // Oracle: a second implementation, a direct walk numbering the declaration 2, the table 3
      // and entry `i` `5 + 2i`, and reading each attribute as written.
      // Bound: every table of 2 kinds, with or without a default, with at most 2 entries over 2
      // targets, 28.
      searched(
        ctx,
        exhaust(
          {
            box: "every table of 2 kinds, with or without a default, with at most 2 entries over 2 targets",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<"default" | "no default">(["default", "no default"]),
            generator: tableCases,
            limit: 100,
            literal: (input) => JSON.stringify(input),
            oracle: { kind: "second-implementation", name: "a direct walk of the XDM tree" },
            suite: "pantry/import/overlays-mapping-lookup",
          },
          (input: TableCase, c) =>
            Effect.sync(() => {
              c.note(input.defaultValue === undefined ? "no default" : "default");

              const rows = rowsOf(tableTreeOf(input), ids);
              const expected = [
                ...(input.defaultValue === undefined
                  ? []
                  : [[ids.idOf(3), ids.idOf(2), input.defaultValue]]),
                ...input.targets.map((target, at) => [ids.idOf(5 + 2 * at), ids.idOf(3), target]),
              ];

              assert.sameDeepMembers(
                [...rows.LookupValue].map(([node, row]) => [node, row.parent, row.value]),
                expected,
              );
              for (const row of rows.LookupValue.values()) {
                assert.strictEqual(row.baseTypes, 1n);
              }

              assert.sameDeepMembers(
                [...rows.LookupValueType].map(([node, row]) => [node, row.value, row.baseType]),
                expected.map(([node, , value]) => [node, value, "integer"]),
              );

              assert.deepStrictEqual(
                [...rows.LookupTable].map(([node, { kind }]) => [node, kind]),
                [[ids.idOf(3), input.kind]],
              );
            }),
        ),
      ),
  );
});
