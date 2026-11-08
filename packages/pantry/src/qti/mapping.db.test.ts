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
 * Q5.11's report for the network seat's probe: accepted, a string mapping keyed `York` and `york`
 * and a directed pair mapping keyed `A B` and `B A`; refused, a record's mapping, an integer
 * mapping keyed `1` and `01`, a float mapping keyed `1` and `1.0`, or `1e400` and `2e400` (reading
 * 154), a pair mapping keyed `A B` and `B A`, a point mapping keyed `1 2` and `01 +2`, an integer
 * mapping keyed `abc`, and an integer outcome's match table entry targeting `x`.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { Addition, Fact, Law } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import {
  AreaMappingCardinality,
  LookupTableCardinality,
  LookupValueType,
  MapKey,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
  MapKeyType,
  MappingBaseType,
  MappingCardinality,
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
  outcome: { readonly kind: string; readonly refused?: { readonly laws: readonly Law[] } },
  picks: (law: Law) => boolean,
): boolean => outcome.kind === "invariant-rejected" && (outcome.refused?.laws ?? []).some(picks);

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
 * A stray table beside its declaration's cardinality, a `MappingCardinality`,
 * `AreaMappingCardinality` or `LookupTableCardinality` fact: its node and its declaration's, and
 * the cardinality the case sets (spec reading 158).
 *
 * @param cardinality - The declaration's cardinality.
 * @returns The fact.
 */
const besideCardinality = (
  cardinality: "multiple" | "ordered" | "record",
): Fact<typeof MappingCardinality> => ({ cardinality, declaration: stray, node: strayNode(0) });

/**
 * A stray map key of one mapping, entry `at`, of a mapping whose declaration has a base type.
 *
 * @param at - The entry's number.
 * @param key - Its key.
 * @returns The row.
 */
const mapKeyRow = (at: number, key: string): Fact<typeof MapKey> => ({
  baseTypes: 1n,
  document: stray,
  key,
  kind: "qti-map-entry",
  mapping: stray,
  nearest: stray,
  node: strayNode(at),
  start: BigInt(5 + 2 * at),
  version: "3.0.1",
});

/**
 * A stray integer key of one mapping, entry `at`, with its split, from which PostgreSQL generates
 * its value.
 *
 * @param at - The entry's number.
 * @param parts - Its key and the split E1_derived reads.
 * @returns The row.
 */
const integer = (
  at: number,
  parts: Omit<Addition<typeof MapKeyInteger>, "mapping" | "node">,
): Addition<typeof MapKeyInteger> => ({ ...parts, mapping: stray, node: strayNode(at) });

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
        "refuses a mapping of a base type MappableBaseType does not hold, by its containment into MappableBaseType, and a record's mapping by its cardinality",
        () =>
          // Oracle: PostgreSQL, the containment of MappingBaseType.baseType into MappableBaseType,
          // a CHECK on MappingBaseType's table, and the MappableBaseType CHECK on
          // MappingCardinality's, the mapping beside its declaration's cardinality (reading 78: a
          // mapping is of no record, §2.11.1.5; spec reading 158).
          // Bound: every BaseType handle MappableBaseType leaves out, file and duration, and a
          // record's mapping, which has no base type.
          Effect.gen(function* unmappable() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const baseType of ["file", "duration"] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(MappingBaseType, [
                  { baseType, declaration: stray, node: strayNode(0) },
                ]),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, containedIn("MappingBaseType", "MappableBaseType")),
                baseType,
              );
            }

            const record = yield* db.apply(
              ChangeSet.empty(Author).insert(MappingCardinality, [besideCardinality("record")]),
              {},
            );
            assert.isTrue(
              rejectedBy(record, checkNamed("MappingCardinality", "MappableBaseType")),
              "record",
            );
          }),
      );

      it.effect(
        "refuses two map entries of one mapping with one key, identical entries included, by the key on (mapping, key)",
        () =>
          // Oracle: PostgreSQL, the UNIQUE of key(on(MapKey, "mapping", "key")), or the host's
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

              assert.isTrue(rejectedBy(outcome, keyOver("MapKey", ["mapping", "key"])));
            }
          }),
      );

      it.effect(
        "refuses two integer keys of one mapping that name one integer, by the key on (mapping, value)",
        () =>
          // Oracle: PostgreSQL, the UNIQUE of key(on(MapKeyInteger, "mapping", "value")) over the
          // value it generates from each row's split, true to E1_derived; the canonical forms are
          // XML Schema's.
          // Bound: 1 and 01, -0 and +0, and +7 and 007.
          Effect.gen(function* integerRepeat() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const rows of [
              [
                integer(0, { digits: "1", key: "1", sign: "", zeros: "" }),
                integer(1, { digits: "1", key: "01", sign: "", zeros: "0" }),
              ],
              [
                integer(0, { digits: "0", key: "-0", sign: "-", zeros: "" }),
                integer(1, { digits: "0", key: "+0", sign: "+", zeros: "" }),
              ],
              [
                integer(0, { digits: "7", key: "+7", sign: "+", zeros: "" }),
                integer(1, { digits: "7", key: "007", sign: "", zeros: "00" }),
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

      it.effect(
        "keeps two integer keys of one mapping that name two integers, the key on (mapping, value) unbroken",
        () =>
          // Oracle: PostgreSQL, the UNIQUE of key(on(MapKeyInteger, "mapping", "value")) over the
          // value it generates, against XML Schema's canonical forms, which differ: the control of
          // the repeat above. A stray row's deferred containments may still refuse the write at
          // commit, so the key alone is read.
          // Bound: -1 and 1, 10 and 1, and -0 and -10.
          Effect.gen(function* integerDistinct() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const rows of [
              [
                integer(0, { digits: "1", key: "-1", sign: "-", zeros: "" }),
                integer(1, { digits: "1", key: "1", sign: "", zeros: "" }),
              ],
              [
                integer(0, { digits: "10", key: "10", sign: "", zeros: "" }),
                integer(1, { digits: "1", key: "1", sign: "", zeros: "" }),
              ],
              [
                integer(0, { digits: "0", key: "-0", sign: "-", zeros: "" }),
                integer(1, { digits: "10", key: "-10", sign: "-", zeros: "" }),
              ],
            ]) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(MapKeyInteger, rows),
                {},
              );

              assert.isFalse(
                rejectedBy(outcome, keyOver("MapKeyInteger", ["mapping", "value"])),
                rows.map(({ key }) => key).join(" "),
              );
            }
          }),
      );

      it.effect("refuses an integer key whose split does not spell it, by E1_derived", () =>
        // Oracle: PostgreSQL, the E1_derived CHECK on MapKeyInteger, judged as the row is
        // inserted.
        // Bound: a padded key's zeros dropped from its split, a negative key's sign dropped, and a
        // magnitude that is not the key's.
        Effect.gen(function* integerDerived() {
          const db = yield* Db.open(AuthorApp.roles.author, {});
          for (const row of [
            { digits: "1", key: "01", sign: "", zeros: "" },
            { digits: "5", key: "-5", sign: "", zeros: "" },
            { digits: "6", key: "5", sign: "", zeros: "" },
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
          // value it generates, grizzle's `Compute.parseDouble`, XML Schema 1.1's doubleLexicalMap
          // (readings 144 and 154), and `float8` equality, -0 equal to 0 and NaN to NaN.
          // Bound: 1 and 1.0, 1 and 10e-1, 0 and -0, 0.1 and .10, and past grizzle's former
          // bounded form: two overflows, an overflow and INF, an underflow and 0, a 17-digit key
          // and the 18-digit one that rounds with it, a tie to even, a 15-digit mantissa at 293
          // and the 1e+307 it spells, and two NaNs.
          Effect.gen(function* floatRepeat() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const [first, second] of [
              ["1", "1.0"],
              ["1", "10e-1"],
              ["0", "-0"],
              ["0.1", ".10"],
              ["1e400", "2e400"],
              ["INF", "1e400"],
              ["0", "1e-400"],
              ["1.2345678901234567", "1.23456789012345671"],
              ["9007199254740993", "9007199254740992"],
              ["100000000000000e293", "1e+307"],
              ["NaN", "NaN"],
            ] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(MapKeyFloat, [
                  { key: first, ...at(0) },
                  { key: second, ...at(1) },
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
        "keeps two float keys of one mapping that name two doubles, the key on (mapping, value) unbroken",
        () =>
          // Oracle: PostgreSQL, the UNIQUE of key(on(MapKeyFloat, "mapping", "value")) over the
          // cast it generates, against the doubles each decimal rounds to, which differ: the
          // control of the repeat above. A stray row's deferred containments may still refuse the
          // write at commit, so the key alone is read.
          // Bound: 1 and 2, 0.1 and 0.100000000000001 (apart in the fifteenth digit), 1 and the
          // double one ulp above it, the greatest finite double and INF, the least subnormal and
          // 0, and INF and -INF.
          Effect.gen(function* floatDistinct() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const [first, second] of [
              ["1", "2"],
              ["0.1", "0.100000000000001"],
              ["1", "1.0000000000000002"],
              ["1.7976931348623157e308", "1e309"],
              ["4.9e-324", "0"],
              ["INF", "-INF"],
            ] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(MapKeyFloat, [
                  { key: first, ...at(0) },
                  { key: second, ...at(1) },
                ]),
                {},
              );

              assert.isFalse(
                rejectedBy(outcome, keyOver("MapKeyFloat", ["mapping", "value"])),
                `${first} ${second}`,
              );
            }
          }),
      );

      it.effect(
        "refuses an area mapping of a record, which has no base type, by AreaMapping_base_type",
        () =>
          // Oracle: PostgreSQL, the AreaMapping_base_type CHECK on AreaMappingCardinality, the
          // area mapping beside its declaration's cardinality, judged as the row is inserted
          // (information model §5.5: "a mapping from a source set of point values"; a record has
          // no base type, so it is judged by its cardinality alone; spec reading 158). A typed
          // declaration's base type is judged by the containment into `DeclarationBaseType`'s
          // point rows, which the host tier holds (`test/record-declarations.oracle.test.ts`).
          // Bound: a record's area mapping.
          Effect.gen(function* areaBaseType() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const record = yield* db.apply(
              ChangeSet.empty(Author).insert(AreaMappingCardinality, [besideCardinality("record")]),
              {},
            );

            assert.isTrue(
              rejectedBy(record, checkNamed("AreaMappingCardinality", "AreaMapping_base_type")),
              "record",
            );
          }),
      );

      it.effect(
        "refuses a match or interpolation table of an outcome that is not single, by Lookup_table_cardinality",
        () =>
          // Oracle: PostgreSQL, the Lookup_table_cardinality CHECK on LookupTableCardinality, a
          // table beside its outcome's cardinality, judged as the row is inserted (information
          // model §4.5.13; spec reading 158). A match and an interpolation table are one shape, so
          // one row stands for both.
          // Bound: a table under a multiple, an ordered and a record outcome.
          Effect.gen(function* lookupCardinality() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const cardinality of ["multiple", "ordered", "record"] as const) {
              const table = yield* db.apply(
                ChangeSet.empty(Author).insert(LookupTableCardinality, [
                  besideCardinality(cardinality),
                ]),
                {},
              );

              assert.isTrue(
                rejectedBy(table, checkNamed("LookupTableCardinality", "Lookup_table_cardinality")),
                cardinality,
              );
            }
          }),
      );

      it.effect(
        "refuses a map key or a lookup value that is no lexical form of its base type, written exactly, by Typed_attribute_value",
        () =>
          // Oracle: PostgreSQL, the Typed_attribute_value CHECK on MapKeyType and LookupValueType,
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
                ChangeSet.empty(Author).insert(MapKeyType, [
                  { baseType, key, mapping: stray, node: strayNode(0) },
                ]),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, checkNamed("MapKeyType", "Typed_attribute_value")),
                `${baseType} ${key}`,
              );
            }

            for (const [baseType, value] of [
              ["integer", "x"],
              ["integer", " 7"],
              ["identifier", "1a"],
            ] as const) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(LookupValueType, [
                  { baseType, declaration: stray, node: strayNode(0), value },
                ]),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, checkNamed("LookupValueType", "Typed_attribute_value")),
                `${baseType} ${value}`,
              );
            }
          }),
      );

      it.effect(
        "refuses two point, pair or directed pair keys of one mapping that name one value, by each key on (mapping, value)",
        () =>
          // Oracle: PostgreSQL, the UNIQUE of key(on(R, "mapping", "value")) for each two-item
          // relation over the value it generates, each row's parts true to its E1_derived
          // (information model §8.13: a pair undirected, a point and a directed pair ordered).
          // Bound: points 1 2 and 01 +2; pairs A B and B A, and U+E000 U+10000 and its reverse;
          // directed pairs A B and A, a tab, B.
          Effect.gen(function* twoItemRepeat() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const point = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyPoint, [
                {
                  ...at(0),
                  gap: " ",
                  key: "1 2",
                  xDigits: "1",
                  xSign: "",
                  xZeros: "",
                  yDigits: "2",
                  ySign: "",
                  yZeros: "",
                },
                {
                  ...at(1),
                  gap: " ",
                  key: "01 +2",
                  xDigits: "1",
                  xSign: "",
                  xZeros: "0",
                  yDigits: "2",
                  ySign: "+",
                  yZeros: "",
                },
              ]),
              {},
            );
            const pairs = [];
            for (const [first, second] of [
              ["A", "B"],
              ["\u{E000}", "\u{10000}"],
            ] as const) {
              pairs.push(
                yield* db.apply(
                  ChangeSet.empty(Author).insert(MapKeyPair, [
                    { ...at(0), first, gap: " ", key: `${first} ${second}`, second },
                    { ...at(1), first: second, gap: " ", key: `${second} ${first}`, second: first },
                  ]),
                  {},
                ),
              );
            }
            const directed = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyDirectedPair, [
                { ...at(0), gap: " ", key: "A B", source: "A", target: "B" },
                { ...at(1), gap: "\t", key: "A\tB", source: "A", target: "B" },
              ]),
              {},
            );

            assert.isTrue(rejectedBy(point, keyOver("MapKeyPoint", ["mapping", "value"])));
            for (const pair of pairs) {
              assert.isTrue(rejectedBy(pair, keyOver("MapKeyPair", ["mapping", "value"])));
            }
            assert.isTrue(
              rejectedBy(directed, keyOver("MapKeyDirectedPair", ["mapping", "value"])),
            );
          }),
      );

      it.effect(
        "keeps two point, pair or directed pair keys of one mapping that name two values, each key on (mapping, value) unbroken",
        () =>
          // Oracle: PostgreSQL, the UNIQUE of key(on(R, "mapping", "value")) for each two-item
          // relation over the value it generates, against §8.13's tuples, which differ: the
          // control of the repeats above. A stray row's deferred containments may still refuse the
          // write at commit, so the key alone is read.
          // Bound: points -1 2 and 1 2; pairs A B and A C; directed pairs A B and B A.
          Effect.gen(function* twoItemDistinct() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const point = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyPoint, [
                {
                  ...at(0),
                  gap: " ",
                  key: "-1 2",
                  xDigits: "1",
                  xSign: "-",
                  xZeros: "",
                  yDigits: "2",
                  ySign: "",
                  yZeros: "",
                },
                {
                  ...at(1),
                  gap: " ",
                  key: "1 2",
                  xDigits: "1",
                  xSign: "",
                  xZeros: "",
                  yDigits: "2",
                  ySign: "",
                  yZeros: "",
                },
              ]),
              {},
            );
            const pair = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyPair, [
                { ...at(0), first: "A", gap: " ", key: "A B", second: "B" },
                { ...at(1), first: "A", gap: " ", key: "A C", second: "C" },
              ]),
              {},
            );
            const directed = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyDirectedPair, [
                { ...at(0), gap: " ", key: "A B", source: "A", target: "B" },
                { ...at(1), gap: " ", key: "B A", source: "B", target: "A" },
              ]),
              {},
            );

            assert.isFalse(rejectedBy(point, keyOver("MapKeyPoint", ["mapping", "value"])));
            assert.isFalse(rejectedBy(pair, keyOver("MapKeyPair", ["mapping", "value"])));
            assert.isFalse(
              rejectedBy(directed, keyOver("MapKeyDirectedPair", ["mapping", "value"])),
            );
          }),
      );
    },
  );
});
