/* oxlint-disable unicorn/text-encoding-identifier-case -- The generated documents carry the charset label crust's reader reports, `UTF-8`. */
/**
 * The mapping overlays' rows against a second reading of the same tree: a direct walk of the XDM
 * document that numbers its nodes in document order as the tree's rows are numbered, collects one
 * map key per `qti-map-entry` from its attributes, and splits each two-item key at its one
 * whitespace character. The walk shares no code with the builder, which reads the tree's flat
 * rows (`flatten`). Each typed key's value is a query's (`#pantry/qti/queries.ts`), read from the
 * `MapKeyType` rows and the splits, so `#pantry/qti/mapping.db.test.ts` judges it.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { ownContext } from "#pantry/import/fold.ts";
import { itemsOf, rowsOf } from "#pantry/import/overlays/mapping.ts";
import type { MappingIds } from "#pantry/import/overlays/mapping.ts";
import { twoItemPattern } from "#pantry/qti/mapping.ts";
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
  governs: Option.none(),
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
    "writes one MapKey row per qti-map-entry, distinct by node, even where two entries are identical, and each typed key's row by its base type, an integer key and a float key none",
    (ctx) =>
      // Oracle: a second implementation, a direct walk of the XDM tree that numbers its entries in
      // document order, against the builder's read of the flat rows; and no integer key and no
      // float key, whose typed values are the queries `MapKeyInteger`'s and `MapKeyFloat`'s, read
      // from their `MapKeyType` rows.
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

              assert.notProperty(rows, "MapKeyInteger");
              assert.notProperty(rows, "MapKeyFloat");
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
  it("writes the key as written as a key's identity, so York and york are two keys and york written twice is one whatever its matching (readings 160 and 165)", () => {
    // Oracle: readings 160 and 165 (decisions 425 and 433): keys written apart are two keys
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
 * The keys a two-item mapping draws from: a pair and its reverse, the pair with a tab between, a
 * point and its spelling with a zero and a sign, two items one of which is past U+FFFF, two items
 * the first of which holds U+0001, which an XML 1.1 document writes as `&#x1;` and no item of a
 * pair holds, and a key of one item and one of three, which no two-item key is.
 */
const twoItemKeys = [
  "A B",
  "B A",
  "A\tB",
  "1 2",
  "01 +2",
  "\u{10000} \u{E000}",
  "A\u{1} B",
  "A",
  "A B C",
] as const;

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
 * Split a two-item key by a second reading: at its one XML whitespace character, into two
 * nonempty runs.
 *
 * @param key - The key.
 * @returns The first run, the whitespace and the second run, or none for a key that is not two
 *   runs around one whitespace character.
 */
const splitOf = (key: string): readonly string[] | undefined => {
  const gaps = [...key.matchAll(/[\t\n\r ]/gu)];
  const [gap] = gaps;
  if (gaps.length !== 1 || gap === undefined) {
    return undefined;
  }

  const first = key.slice(0, gap.index);
  const second = key.slice(gap.index + 1);

  return first !== "" && second !== "" ? [first, gap[0], second] : undefined;
};

/**
 * A two-item key's split as the test compares it: its entry's node, and its first run, the
 * whitespace and its second run.
 */
type SplitRow = readonly [string, readonly string[]];

/**
 * A situation the two-item box must reach: a key the split holds, one it does not (one item, or
 * three), and a mapping with no entry.
 */
type TwoItemSituation = "split" | "unsplit" | "no entry";

/**
 * `twoItemPattern` as JavaScript's engine reads it, the keys the split's mirror selects.
 */
const twoItemKey = new RegExp(twoItemPattern, "u");

/**
 * The characters a split is drawn over: the signs, two digits, a letter, the space and the tab,
 * and U+0001, a C0 control character an XML 1.1 document writes as the character reference
 * `&#x1;`.
 */
const keyCharacters = ["+", "-", "0", "1", "a", " ", "\t", "\u{1}"] as const;

/**
 * A situation the split box must reach: a key of two runs, and one of any other shape.
 */
type SplitSituation = "two runs" | "other";

describe("import/overlays/mapping.ts, a two-item key's split", { timeout: searchTimeout }, () => {
  it.effect(
    "splits a key exactly where twoItemPattern selects it, into runs that spell it",
    (ctx) =>
      // Oracle: the schema's selection pattern, `twoItemPattern`, which "Mapping overlay" mirrors
      // the split's rows with, read by JavaScript's engine; and E1_derived, the split spelling the
      // key, restated. The split is the one host computation left of a two-item key, since no
      // grizzle term splits a text: every value read from its runs is a query's.
      // Bound: every key of 1 to 4 characters over `keyCharacters`, 4,680; residual: longer keys,
      // which repeat these shapes.
      searched(
        ctx,
        exhaust(
          {
            box: "every key of 1 to 4 characters over signs, two digits, a letter, space, tab and U+0001",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<SplitSituation>(["two runs", "other"]),
            generator: (source) =>
              source.draw(array(element(keyCharacters), { max: 4, min: 1 })).join(""),
            limit: 5000,
            literal: (key) => JSON.stringify(key),
            oracle: { kind: "specification", name: "the schema's twoItemPattern" },
            suite: "pantry/import/overlays-mapping-split",
          },
          (key: string, c) =>
            Effect.sync(() => {
              const selected = twoItemKey.test(key);
              const items = itemsOf(key);
              c.note(selected ? "two runs" : "other");

              assert.strictEqual(items !== undefined, selected, key);
              if (items !== undefined) {
                assert.strictEqual(`${items.first}${items.gap}${items.second}`, key);
              }
            }),
        ),
      ),
  );
});

describe("import/overlays/mapping.ts, two-item keys", { timeout: searchTimeout }, () => {
  it.effect(
    "writes each point, pair and directed pair key's split exactly where the key is two runs, the second reading's runs, and no typed row",
    (ctx) =>
      // Oracle: a second implementation, a split at the one XML whitespace character, against
      // the builder's split, which E1_derived holds to the key; and the split's mirror selection,
      // `twoItemPattern`, which "Mapping overlay" holds `MapKeyItems` to both ways. Whether the
      // runs are a point's integers or a pair's items is each query's to judge
      // (`#pantry/qti/queries.ts`), so a key whose run is no item, `A`, U+0001, ` B`, has its split
      // all the same, and `Typed_attribute_value` refuses it on its `MapKeyType` row.
      // Bound: every mapping of point, pair or directedPair with at most 3 entries over 9 keys,
      // 2,730.
      searched(
        ctx,
        exhaust(
          {
            box: "every mapping of point, pair or directedPair with at most 3 entries over 9 keys",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<TwoItemSituation>(["split", "unsplit", "no entry"]),
            generator: twoItemCases,
            limit: 3000,
            literal: (input) =>
              `${input.baseType}: ${input.entries.map(({ key }) => JSON.stringify(key)).join(" ")}`,
            oracle: { kind: "second-implementation", name: "a whitespace split" },
            suite: "pantry/import/overlays-mapping-two-items",
          },
          (input: MappingCase, c) =>
            Effect.sync(() => {
              const split = input.entries.map(({ key }) => splitOf(key));
              c.noteAll([
                ...(split.length === 0 ? (["no entry"] as const) : []),
                ...(split.some((items) => items !== undefined) ? (["split"] as const) : []),
                ...(split.some((items) => items === undefined) ? (["unsplit"] as const) : []),
              ]);

              const rows = rowsOf(treeOf(input), ids);
              const held = [...rows.MapKeyItems].map(([node, row]): SplitRow => [
                node,
                [row.first, row.gap, row.second],
              ]);
              const walked = [...walkedKeys(input)];

              assert.deepStrictEqual(
                held,
                walked.flatMap(([node, { key }]) =>
                  Option.toArray(
                    Option.map(Option.fromNullishOr(splitOf(key)), (items): SplitRow => [
                      node,
                      items,
                    ]),
                  ),
                ),
              );
              assert.deepStrictEqual(
                held.map(([node]) => node),
                walked.flatMap(([node, { key }]) => (twoItemKey.test(key) ? [node] : [])),
                "the split's mirror selection",
              );
              for (const name of ["MapKeyPoint", "MapKeyPair", "MapKeyDirectedPair"]) {
                assert.notProperty(rows, name);
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
