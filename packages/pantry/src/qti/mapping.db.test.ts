/**
 * The mapping overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3):
 * each refused state is one the law's model refuses, named by the law it breaks.
 *
 * Every case writes rows no stored node or declaration names, through the author role
 * (`db.apply`), and breaks a law PostgreSQL judges as the row is inserted: a row CHECK, a
 * containment into a closed relation (a CHECK on the row's table), or a key, whose UNIQUE is never
 * deferred. Every foreign key into `Node`, `Declaration` and the overlays is deferred, so it never
 * speaks first. The outcome is `invariant-rejected` with the expected law among its `laws`
 * (membership, since a merged native names several, C22); whether the host or PostgreSQL's
 * UNIQUE finds a key's repeat is outside the contract.
 *
 * The cases over a whole imported item need the importer's ChangeSet (Q5.15), and are stated in
 * Q5.11's report for the network seat's probe: accepted, a string mapping keyed `York` and `york`,
 * a directed pair mapping keyed `A B` and `B A`, and a float mapping keyed `100000000000000e293`
 * and `1e+307` (reading 56's limit); refused, a record's mapping, an integer mapping keyed `1` and
 * `01`, a float mapping keyed `1` and `1.0`, a pair mapping keyed `A B` and `B A`, a point mapping
 * keyed `1 2` and `01 +2`, an integer mapping keyed `abc`, and an integer outcome's match table
 * entry targeting `x`.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { Fact, Law } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { floatValueOf } from "#pantry/import/overlays/mapping.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import {
  AreaMapping,
  InterpolationTable,
  LookupValue,
  MapKey,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
  Mapping,
  MatchTable,
} from "#pantry/qti/mapping.ts";
import { Author } from "#pantry/qti/roles.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * A uuid no stored row holds: the declaration, mapping and document every stray row names.
 */
const stray = "00000000-0000-4000-8000-0000000011f0";

/**
 * The node of one stray row, distinct for each entry of a case.
 *
 * @param at - The entry's number, 0 to 9.
 * @returns Its uuid.
 */
const strayNode = (at: number): `${string}-${string}-${string}-${string}-${string}` =>
  `00000000-0000-4000-8000-0000000011${String(at).padStart(2, "0")}`;

/**
 * Whether an outcome is `invariant-rejected` with a law among its `laws` that the predicate picks.
 *
 * @param outcome - The apply's outcome.
 * @param picks - Picks the expected law.
 * @returns Whether it holds one.
 */
const rejectedBy = (
  outcome: { readonly kind: string; readonly laws?: readonly Law[] },
  picks: (law: Law) => boolean,
): boolean => outcome.kind === "invariant-rejected" && (outcome.laws ?? []).some(picks);

/**
 * Pick the key law over one relation's own fields, in order.
 *
 * @param relation - The relation.
 * @param fields - The key's fields.
 * @returns The predicate.
 */
const keyOver =
  (relation: string, fields: readonly string[]) =>
  (law: Law): boolean =>
    law.kind === "key" &&
    law.side.relation === relation &&
    law.side.selection.conjuncts.length === 0 &&
    law.side.terms.length === fields.length &&
    law.side.terms.every((term, at) => term.kind === "field" && term.field === fields[at]);

/**
 * Pick the check of one relation by its name.
 *
 * @param relation - The relation.
 * @param name - The check's name.
 * @returns The predicate.
 */
const checkNamed =
  (relation: string, name: string) =>
  (law: Law): boolean =>
    law.kind === "check" && law.relation === relation && law.name === name;

/**
 * Pick a containment by the relations of its two sides.
 *
 * @param from - The source's relation.
 * @param to - The target's relation.
 * @returns The predicate.
 */
const containedIn =
  (from: string, to: string) =>
  (law: Law): boolean =>
    law.kind === "contained" && law.from.relation === from && law.to.relation === to;

/**
 * A stray overlay of a declared element: its node tuple and its declaration's tuple, every value
 * lawful on its own row.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const declaredRow = <const F extends Partial<Fact<typeof AreaMapping>>>(fields: F) => ({
  baseType: "point" as const,
  cardinality: "single" as const,
  declaration: stray,
  declarationKind: "qti-response-declaration" as const,
  document: stray,
  identifier: "RESPONSE",
  kind: "qti-area-mapping" as const,
  nearest: stray,
  node: strayNode(0),
  start: 3n,
  version: "3.0.1" as const,
  ...fields,
});

/**
 * A stray map key of one mapping, entry `at`.
 *
 * @param at - The entry's number.
 * @param key - Its key.
 * @param baseType - Its mapping's base type, `string` unless the case says.
 * @returns The row.
 */
const mapKeyRow = (
  at: number,
  key: string,
  baseType: Fact<typeof MapKey>["baseType"] = "string",
): Fact<typeof MapKey> => ({
  baseType,
  caseText: "",
  document: stray,
  folded: baseType === "string",
  key,
  kind: "qti-map-entry",
  mapping: stray,
  matched: baseType === "string" ? key.replaceAll(/[A-Z]/gu, (c) => c.toLowerCase()) : key,
  nearest: stray,
  node: strayNode(at),
  start: BigInt(5 + 2 * at),
  version: "3.0.1",
});

/**
 * A stray integer key of one mapping, entry `at`, with its parts.
 *
 * @param at - The entry's number.
 * @param parts - Its key and the parts E1_derived reads.
 * @returns The row.
 */
const integer = (
  at: number,
  parts: Omit<Fact<typeof MapKeyInteger>, "mapping" | "node">,
): Fact<typeof MapKeyInteger> => ({ ...parts, mapping: stray, node: strayNode(at) });

/**
 * The mapping and node of a stray typed key, entry `n`.
 *
 * @param n - The entry's number.
 * @returns Its mapping and node.
 */
const at = (n: number) => ({ mapping: strayNode(90), node: strayNode(n) });

describe.skipIf(!hasLease)("qti/mapping.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer, { timeout: authorLayerHookTimeoutMs })(
    "the mapping overlays' laws, judged by PostgreSQL",
    (it) => {
      it.effect(
        "refuses a mapping of a base type MappableBaseType does not hold, by its containment into MappableBaseType",
        () =>
          // Oracle: PostgreSQL, the containment of Mapping.baseType into MappableBaseType, a CHECK
          // on Mapping's table (reading 78).
          // Bound: every BaseType handle MappableBaseType leaves out: file, duration, and a
          // record's none.
          Effect.gen(function* unmappable() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const baseType of ["file", "duration", "none"] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(Mapping, [
                  declaredRow({ baseType, kind: "qti-mapping" }),
                ]),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, containedIn("Mapping", "MappableBaseType")),
                baseType,
              );
            }
          }),
      );

      it.effect(
        "refuses two map entries of one mapping with one key, identical entries included, by the key on (mapping, folded, matched)",
        () =>
          // Oracle: PostgreSQL, the UNIQUE of key(on(MapKey, "mapping", "folded", "matched")), or the host's
          // key check before it; the two rows differ only by their node, as two identical
          // qti-map-entry elements do.
          // Bound: two entries, each spelling once identical and once a lone repeat among three.
          Effect.gen(function* lexicalRepeat() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const rows of [
              [mapKeyRow(0, "York"), mapKeyRow(1, "York")],
              [mapKeyRow(0, "A"), mapKeyRow(1, "B"), mapKeyRow(2, "A")],
            ]) {
              const outcome = yield* db.apply(ChangeSet.empty(Author).insert(MapKey, rows), {});

              assert.isTrue(
                rejectedBy(outcome, keyOver("MapKey", ["mapping", "folded", "matched"])),
              );
            }
          }),
      );

      it.effect(
        "refuses two integer keys of one mapping that name one integer, by the key on (mapping, value)",
        () =>
          // Oracle: PostgreSQL, the UNIQUE of key(on(MapKeyInteger, "mapping", "value")), each
          // row's parts true to E1_derived; the canonical forms are XML Schema's.
          // Bound: 1 and 01, -0 and +0, and +7 and 007.
          Effect.gen(function* integerRepeat() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const rows of [
              [
                integer(0, {
                  digits: "1",
                  key: "1",
                  negative: "",
                  sign: "",
                  value: "1",
                  zeros: "",
                }),
                integer(1, {
                  digits: "1",
                  key: "01",
                  negative: "",
                  sign: "",
                  value: "1",
                  zeros: "0",
                }),
              ],
              [
                integer(0, {
                  digits: "0",
                  key: "-0",
                  negative: "",
                  sign: "-",
                  value: "0",
                  zeros: "",
                }),
                integer(1, {
                  digits: "0",
                  key: "+0",
                  negative: "",
                  sign: "+",
                  value: "0",
                  zeros: "",
                }),
              ],
              [
                integer(0, {
                  digits: "7",
                  key: "+7",
                  negative: "",
                  sign: "+",
                  value: "7",
                  zeros: "",
                }),
                integer(1, {
                  digits: "7",
                  key: "007",
                  negative: "",
                  sign: "",
                  value: "7",
                  zeros: "00",
                }),
              ],
            ]) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(MapKeyInteger, rows),
                {},
              );

              assert.isTrue(rejectedBy(outcome, keyOver("MapKeyInteger", ["mapping", "value"])));
            }
          }),
      );

      it.effect("refuses an integer key whose canonical form is not its value, by E1_derived", () =>
        // Oracle: PostgreSQL, the E1_derived CHECK on MapKeyInteger, judged as the row is
        // inserted.
        // Bound: a negative zero kept signed, a padded key's zeros dropped from its split, and a
        // negative value written unsigned.
        Effect.gen(function* integerDerived() {
          const db = yield* Db.open(AuthorApp.roles.author, {});
          for (const row of [
            { digits: "0", key: "-0", negative: "-", sign: "-", value: "-0", zeros: "" },
            { digits: "1", key: "01", negative: "", sign: "", value: "1", zeros: "" },
            { digits: "5", key: "-5", negative: "", sign: "-", value: "5", zeros: "" },
          ] as const) {
            const outcome = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyInteger, [
                { ...row, mapping: stray, node: strayNode(0) },
              ]),
              {},
            );

            assert.isTrue(rejectedBy(outcome, checkNamed("MapKeyInteger", "E1_derived")), row.key);
          }
        }),
      );

      it.effect(
        "refuses two float keys of one mapping that name one double, by the key on (mapping, value)",
        () =>
          // Oracle: PostgreSQL, the UNIQUE of key(on(MapKeyFloat, "mapping", "value")) over the
          // host's value, which E1_derived holds to the cast that rounds each decimal once to its
          // nearest double (reading 56).
          // Bound: 1 and 1.0, 1 and 10e-1, 0 and -0, and 0.1 and .10.
          Effect.gen(function* floatRepeat() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const [first, second] of [
              ["1", "1.0"],
              ["1", "10e-1"],
              ["0", "-0"],
              ["0.1", ".10"],
            ] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(MapKeyFloat, [
                  { key: first, value: floatValueOf(first), ...at(0) },
                  { key: second, value: floatValueOf(second), ...at(1) },
                ]),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, keyOver("MapKeyFloat", ["mapping", "value"])),
                `${first} ${second}`,
              );
            }
          }),
      );

      it.effect(
        "refuses a float key whose value is not the double its key names, by MapKeyFloat's E1_derived",
        () =>
          // Oracle: PostgreSQL, the E1_derived CHECK on MapKeyFloat, `value = key::double
          // precision`, judged as the row is inserted.
          // Bound: a value off by one, the double next above 0.1 (one unit in its last place,
          // 2^-56), and a zero for -INF.
          Effect.gen(function* floatDerived() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const row of [
              { key: "1", value: 2 },
              { key: "0.1", value: 0.1 + 2 ** -56 },
              { key: "-INF", value: 0 },
            ] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(MapKeyFloat, [{ ...row, ...at(0) }]),
                {},
              );

              assert.isTrue(rejectedBy(outcome, checkNamed("MapKeyFloat", "E1_derived")), row.key);
            }
          }),
      );

      it.effect(
        "refuses an area mapping of a declaration whose base type is not point, by AreaMapping_base_type",
        () =>
          // Oracle: PostgreSQL, the AreaMapping_base_type CHECK, judged as the row is inserted
          // (information model §5.5).
          // Bound: a base type of each other shape of value: a pair, an identifier and a float.
          Effect.gen(function* areaBaseType() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const baseType of ["pair", "identifier", "float"] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(AreaMapping, [declaredRow({ baseType })]),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, checkNamed("AreaMapping", "AreaMapping_base_type")),
                baseType,
              );
            }
          }),
      );

      it.effect(
        "refuses a match or interpolation table of an outcome that is not single, by Lookup_table_cardinality",
        () =>
          // Oracle: PostgreSQL, the Lookup_table_cardinality CHECK on each table, judged as the
          // row is inserted (information model §4.5.13).
          // Bound: each table under a multiple, an ordered and a record outcome.
          Effect.gen(function* lookupCardinality() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const cardinality of ["multiple", "ordered", "record"] as const) {
              const baseType = cardinality === "record" ? "none" : "integer";
              const match = yield* db.apply(
                ChangeSet.empty(Author).insert(MatchTable, [
                  declaredRow({
                    baseType,
                    cardinality,
                    declarationKind: "qti-outcome-declaration",
                    kind: "qti-match-table",
                  }),
                ]),
                {},
              );
              const interpolation = yield* db.apply(
                ChangeSet.empty(Author).insert(InterpolationTable, [
                  declaredRow({
                    baseType,
                    cardinality,
                    declarationKind: "qti-outcome-declaration",
                    kind: "qti-interpolation-table",
                  }),
                ]),
                {},
              );

              assert.isTrue(
                rejectedBy(match, checkNamed("MatchTable", "Lookup_table_cardinality")),
                cardinality,
              );
              assert.isTrue(
                rejectedBy(
                  interpolation,
                  checkNamed("InterpolationTable", "Lookup_table_cardinality"),
                ),
                cardinality,
              );
            }
          }),
      );

      it.effect(
        "refuses a map key or a lookup value that is no lexical form of its base type, written exactly, by Typed_attribute_value",
        () =>
          // Oracle: PostgreSQL, the Typed_attribute_value CHECK on MapKey and on LookupValue,
          // judged as the row is inserted: BaseTypePattern's row of the base type, and no
          // whitespace around a value of any base type but string (readings 7, 8 and 34).
          // Bound: a text of no integer, a padded integer, a boolean written 1, a point of one
          // integer and a float with a comma, as map keys; a target of no integer, a padded one and
          // an identifier that starts with a digit, as lookup values.
          Effect.gen(function* typedAttributes() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const [baseType, key] of [
              ["integer", "abc"],
              ["integer", " 1"],
              ["boolean", "1"],
              ["point", "1"],
              ["float", "1,5"],
            ] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(MapKey, [mapKeyRow(0, key, baseType)]),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, checkNamed("MapKey", "Typed_attribute_value")),
                `${baseType} ${key}`,
              );
            }

            for (const [baseType, value] of [
              ["integer", "x"],
              ["integer", " 7"],
              ["identifier", "1a"],
            ] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(LookupValue, [
                  {
                    baseType,
                    document: stray,
                    kind: "qti-match-table-entry",
                    nearest: stray,
                    node: strayNode(0),
                    parent: stray,
                    start: 5n,
                    value,
                    version: "3.0.1",
                  },
                ]),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, checkNamed("LookupValue", "Typed_attribute_value")),
                `${baseType} ${value}`,
              );
            }
          }),
      );

      it.effect(
        "refuses two point, pair or directed pair keys of one mapping that name one value, by each key on (mapping, value)",
        () =>
          // Oracle: PostgreSQL, the UNIQUE of key(on(R, "mapping", "value")) for each two-item
          // relation, each row's parts true to its E1_derived (information model §8.13: a pair
          // undirected, a point and a directed pair ordered).
          // Bound: points 1 2 and 01 +2; pairs A B and B A; directed pairs A B and A, a tab, B.
          Effect.gen(function* twoItemRepeat() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const point = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyPoint, [
                {
                  ...at(0),
                  gap: " ",
                  key: "1 2",
                  value: "1 2",
                  xDigits: "1",
                  xNegative: "",
                  xSign: "",
                  xZeros: "",
                  yDigits: "2",
                  yNegative: "",
                  ySign: "",
                  yZeros: "",
                },
                {
                  ...at(1),
                  gap: " ",
                  key: "01 +2",
                  value: "1 2",
                  xDigits: "1",
                  xNegative: "",
                  xSign: "",
                  xZeros: "0",
                  yDigits: "2",
                  yNegative: "",
                  ySign: "+",
                  yZeros: "",
                },
              ]),
              {},
            );
            const pair = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyPair, [
                { ...at(0), first: "A", gap: " ", key: "A B", second: "B", value: "A B" },
                { ...at(1), first: "B", gap: " ", key: "B A", second: "A", value: "A B" },
              ]),
              {},
            );
            const directed = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyDirectedPair, [
                { ...at(0), gap: " ", key: "A B", source: "A", target: "B", value: "A B" },
                { ...at(1), gap: "\t", key: "A\tB", source: "A", target: "B", value: "A B" },
              ]),
              {},
            );

            assert.isTrue(rejectedBy(point, keyOver("MapKeyPoint", ["mapping", "value"])));
            assert.isTrue(rejectedBy(pair, keyOver("MapKeyPair", ["mapping", "value"])));
            assert.isTrue(
              rejectedBy(directed, keyOver("MapKeyDirectedPair", ["mapping", "value"])),
            );
          }),
      );

      it.effect(
        "refuses a pair key whose value keeps its items out of code-point order, by E1_derived",
        () =>
          // Oracle: PostgreSQL, the E1_derived CHECK on MapKeyPair under the pg_c_utf8 collation,
          // which orders text by code point.
          // Bound: B A kept as B A; and U+E000 and U+10000 written in JavaScript's UTF-16 order,
          // where U+10000 sorts first, not in code-point order.
          Effect.gen(function* pairOrder() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const [first, second, value] of [
              ["B", "A", "B A"],
              ["\u{E000}", "\u{10000}", "\u{10000} \u{E000}"],
            ] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(MapKeyPair, [
                  {
                    first,
                    gap: " ",
                    key: `${first} ${second}`,
                    mapping: stray,
                    node: strayNode(0),
                    second,
                    value,
                  },
                ]),
                {},
              );

              assert.isTrue(rejectedBy(outcome, checkNamed("MapKeyPair", "E1_derived")), value);
            }
          }),
      );
    },
  );
});
