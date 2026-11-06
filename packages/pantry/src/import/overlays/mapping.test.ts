/* oxlint-disable unicorn/text-encoding-identifier-case -- The generated documents carry the charset label crust's reader reports, `UTF-8`. */
/**
 * The mapping overlays' rows against a second reading of the same tree: a direct walk of the XDM
 * document that numbers its nodes in document order as the tree's rows are numbered, collects one
 * map key per `qti-map-entry` from its attributes, and reads each integer key's value with
 * JavaScript's `BigInt`. The walk shares no code with the builder, which reads the tree's flat rows
 * (`flatten`).
 */
import { lexicalForm, pg } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { integerValueOf, rowsOf } from "#pantry/import/overlays/mapping.ts";
import type { MappingIds } from "#pantry/import/overlays/mapping.ts";
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
 * The deleted schema's `xs:double` lexical space (`src/schema/patterns.ts` `xsDouble`).
 */
const xsDouble = /^(?:[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?|-?INF|NaN)$/u;

/**
 * Grizzle's lexical form of `double precision`: with {@link xsDouble}, the float keys that hold a
 * typed value, since every run of zeros a short key holds is within the key-text bound.
 */
const grizzleDouble = new RegExp(lexicalForm(pg["double precision"]), "u");

/**
 * Read a key as the value its mapping's base type gives it, as the walk compares keys: an integer
 * by `BigInt`, a float in grizzle's form by `Number`, and every other key as written.
 *
 * @param baseType - The mapping's base type.
 * @param key - The key.
 * @returns The value's text.
 */
const typedOf = (baseType: string, key: string): string => {
  if (baseType === "integer" && xsInteger.test(key)) {
    return String(BigInt(key));
  }

  return baseType === "float" && xsDouble.test(key) && grizzleDouble.test(key)
    ? String(Number(key))
    : key;
};

/**
 * The ids every case writes its rows under, each node's by its number.
 */
const ids: MappingIds = { idOf };

/**
 * One map entry of a generated mapping: its key and its mapped value, as written.
 */
interface Entry {
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
 * An element with closed attributes.
 *
 * @param kind - Its kind.
 * @param attributes - Its attributes' names and lexical forms, in order.
 * @param children - Its children.
 * @returns The element.
 */
const elementOf = (
  kind: XdmClosedElement<Composed>["kind"],
  attributes: readonly (readonly [ClosedName<Composed>, string])[],
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
  const entries = input.entries.flatMap(({ key, value }) => [
    ws,
    elementOf(
      "qti-map-entry",
      [
        ["map-key", key],
        ["mapped-value", value],
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
      // document order, against the builder's read of the flat rows; each integer key's value by
      // JavaScript's `BigInt`, which reads xs:integer's lexical space to the same integer, and each
      // float key's selection by the deleted `xsDouble` and grizzle's double form.
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
                assert.strictEqual(row.baseType, input.baseType);
              }

              assert.deepStrictEqual(
                [...rows.MapKeyInteger].map(([node, row]) => [node, row.key, row.value]),
                input.baseType === "integer"
                  ? [...walked].flatMap(([node, { key }]) =>
                      xsInteger.test(key) ? [[node, key, typedOf("integer", key)]] : [],
                    )
                  : [],
              );
              assert.deepStrictEqual(
                [...rows.MapKeyFloat.keys()],
                input.baseType === "float"
                  ? [...walked].flatMap(([node, { key }]) =>
                      xsDouble.test(key) && grizzleDouble.test(key) ? [node] : [],
                    )
                  : [],
              );
              assert.deepStrictEqual([...rows.Mapping.keys()], [ids.idOf(3)]);
              assert.strictEqual(rows.Mapping.get(ids.idOf(3))?.baseType, input.baseType);
              assert.strictEqual(rows.Mapping.get(ids.idOf(3))?.declaration, ids.idOf(2));
            }),
        ),
      ),
  );
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

describe(
  "import/overlays/mapping.ts, an integer key's canonical form",
  { timeout: searchTimeout },
  () => {
    it.effect(
      "splits every xs:integer key into the parts E1_derived proves, its value the canonical form of the integer it names",
      (ctx) =>
        // Oracle: a second implementation, JavaScript's `BigInt` of the key and its decimal string,
        // XML Schema's canonical form of xs:integer (no `+`, no leading zero, `0` unsigned); the
        // parts against E1_derived's equalities, restated.
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

                const parts = integerValueOf(key);
                assert.isDefined(parts, key);
                if (parts !== undefined) {
                  assert.strictEqual(parts.value, String(BigInt(key)), key);
                  assert.strictEqual(`${parts.sign}${parts.zeros}${parts.digits}`, key);
                  assert.strictEqual(`${parts.negative}${parts.digits}`, parts.value);
                }
              }),
          ),
        ),
    );
  },
);

/**
 * The keys a two-item mapping draws from: a pair and its reverse, the pair with a tab between, a
 * point and its spelling with a zero and a sign, and two items one of which is past U+FFFF, the
 * case where code-point order and JavaScript's UTF-16 order part (U+10000 sorts after U+E000 by
 * code point, before it by code unit).
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
 * Compare two texts by code point, as PostgreSQL's `pg_c_utf8` collation does.
 *
 * @param left - The first text.
 * @param right - The second.
 * @returns A negative number, zero or a positive number as the first sorts before, with or after
 *   the second.
 */
const byCodePoint = (left: string, right: string): number => {
  const a = Array.from(left, (char) => char.codePointAt(0) ?? 0);
  const b = Array.from(right, (char) => char.codePointAt(0) ?? 0);
  const at = a.findIndex((code, index) => code !== b[index]);

  return at === -1 ? a.length - b.length : (a[at] ?? 0) - (b[at] ?? Number.NEGATIVE_INFINITY);
};

/**
 * Read a two-item key as the value its base type gives it, by a second reading: a point's two
 * integers by `BigInt`, a pair's two items sorted by code point, a directed pair's in order.
 *
 * @param baseType - The mapping's base type.
 * @param key - The key.
 * @returns The canonical value, or none for a key that is not two items of the base type.
 */
const twoItemValueOf = (baseType: string, key: string): string | undefined => {
  const items = key.split(/[\t\n\r ]/u);
  if (items.length !== 2 || items.some((item) => item === "")) {
    return undefined;
  }

  const [first = "", second = ""] = items;
  if (baseType === "point") {
    return xsInteger.test(first) && xsInteger.test(second)
      ? `${String(BigInt(first))} ${String(BigInt(second))}`
      : undefined;
  }

  return baseType === "pair" ? items.toSorted(byCodePoint).join(" ") : `${first} ${second}`;
};

/**
 * A situation the two-item box must reach: two keys of one value spelled apart, a pair whose items
 * code-point order and UTF-16 order sort apart, and a mapping with none of these.
 */
type TwoItemSituation = "typed repeat" | "astral order" | "distinct";

/**
 * Name the situations a two-item mapping reaches.
 *
 * @param repeat - Whether two of its keys spelled apart name one value.
 * @param astral - Whether it is a pair mapping holding an item past U+FFFF.
 * @returns Its situations.
 */
const twoItemSituationsOf = (repeat: boolean, astral: boolean): readonly TwoItemSituation[] => {
  const situations: readonly (readonly [TwoItemSituation, boolean])[] = [
    ["typed repeat", repeat],
    ["astral order", astral],
  ];
  const reached = situations.flatMap(([situation, holds]) => (holds ? [situation] : []));

  return reached.length === 0 ? ["distinct"] : reached;
};

describe("import/overlays/mapping.ts, two-item keys", { timeout: searchTimeout }, () => {
  it.effect(
    "writes each point, pair and directed pair key's typed row, its value the second reading's canonical form",
    (ctx) =>
      // Oracle: a second implementation, a split at each XML whitespace character, `BigInt` of a
      // point's integers and a code-point sort of a pair's items (§8.13: a pair is undirected, a
      // directed pair and a point ordered), against the builder's split and `atOrBefore`.
      // Bound: every mapping of point, pair or directedPair with at most 3 entries over 6 keys,
      // 777.
      searched(
        ctx,
        exhaust(
          {
            box: "every mapping of point, pair or directedPair with at most 3 entries over 6 keys",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<TwoItemSituation>([
              "typed repeat",
              "astral order",
              "distinct",
            ]),
            generator: twoItemCases,
            limit: 1000,
            literal: (input) =>
              `${input.baseType}: ${input.entries.map(({ key }) => JSON.stringify(key)).join(" ")}`,
            oracle: {
              kind: "second-implementation",
              name: "a whitespace split, BigInt and a code-point sort",
            },
            suite: "pantry/import/overlays-mapping-two-items",
          },
          (input: MappingCase, c) =>
            Effect.sync(() => {
              const keys = input.entries.map(({ key }) => key);
              const values = keys.flatMap((key) =>
                Option.toArray(Option.fromNullishOr(twoItemValueOf(input.baseType, key))),
              );
              const astral =
                input.baseType === "pair" && keys.some((key) => key.includes("\u{10000}"));
              const repeat = new Set(values).size < new Set(keys).size;
              c.noteAll(twoItemSituationsOf(repeat, astral));

              const rows = rowsOf(treeOf(input), ids);
              const typed = {
                directedPair: rows.MapKeyDirectedPair,
                pair: rows.MapKeyPair,
                point: rows.MapKeyPoint,
              } as const;
              const expected = [...walkedKeys(input)].flatMap(([node, { key }]) =>
                Option.toArray(
                  Option.map(Option.fromNullishOr(twoItemValueOf(input.baseType, key)), (value) => [
                    node,
                    value,
                  ]),
                ),
              );

              for (const [baseType, relation] of Object.entries(typed)) {
                assert.deepStrictEqual(
                  [...relation].map(([node, row]) => [node, row.value]),
                  baseType === input.baseType ? expected : [],
                  baseType,
                );
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
                assert.strictEqual(row.baseType, "integer");
              }

              assert.deepStrictEqual(
                [
                  ...(input.kind === "qti-match-table"
                    ? rows.MatchTable
                    : rows.InterpolationTable
                  ).keys(),
                ],
                [ids.idOf(3)],
              );
            }),
        ),
      ),
  );
});
