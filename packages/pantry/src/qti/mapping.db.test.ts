/**
 * The mapping overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3):
 * each refused state is one the law's model refuses, named by the law it breaks.
 *
 * Every case writes rows no stored node or declaration names, through the author role (`db.apply`),
 * and breaks a law PostgreSQL judges as the row is inserted: a field type's text domain, a row
 * CHECK, a containment into a closed relation (a CHECK on the row's table), or a key, whose UNIQUE
 * is never deferred. Every foreign key into `Node`, `Declaration` and the overlays is deferred, so
 * it never speaks first. The outcome is `invariant-rejected` with the expected law among its `laws`
 * (membership, since a merged native names several, C22); whether the host or PostgreSQL's UNIQUE
 * finds a key's repeat is outside the contract.
 *
 * The keys over the typed keys' queries (`#pantry/qti/queries.ts`) are deferred constraint
 * triggers, which `db.apply` would judge at COMMIT behind the stray rows' foreign keys, so their
 * cases are judged by a direct SQL writer (`#pantry/test/direct-sql.ts`, README "Direct SQL
 * access"): the `MapKeyType` rows and splits each query reads, every deferrable constraint
 * deferred and rolled back unchecked but the rule's trigger, set immediate alone.
 *
 * The cases over a whole imported item need the importer's ChangeSet (Q5.15), and are stated in
 * Q5.11's report for the network seat's probe: accepted, a string mapping keyed `York` and `york`
 * and a directed pair mapping keyed `A B` and `B A`; refused, a record's mapping, an integer
 * mapping keyed `1` and `01`, a float mapping keyed `1` and `1.0`, or `1e400` and `2e400` (reading
 * 154), a pair mapping keyed `A B` and `B A`, a point mapping keyed `1 2` and `01 +2`, an integer
 * mapping keyed `abc`, and an integer outcome's match table entry targeting `x`.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { Fact, Law } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { lawNameOf } from "#pantry/import/refusal.ts";
import { Author, AuthorApp } from "#pantry/qti/own-login.ts";
import {
  AreaMappingCardinality,
  LookupTableCardinality,
  LookupValueType,
  MapKey,
  MapKeyItems,
  MapKeyType,
  MappingBaseType,
  MappingCardinality,
} from "#pantry/qti/mapping.ts";
import { Qti } from "#pantry/qti/own.ts";
import {
  assertVerdict,
  judged,
  loginSession,
  qtiSchema,
  rowsOf,
  statedInserts,
  tableOf,
} from "#pantry/test/direct-sql.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

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
 * Pick the pattern law of one relation's field: its type's text domain, which PostgreSQL judges as
 * the statement casts the field's value.
 *
 * @param relation - The relation.
 * @param field - The field.
 * @returns The predicate.
 */
const patternOf =
  (relation: string, field: string) =>
  (law: Law): boolean =>
    law.kind === "pattern" && law.relation === relation && law.field === field;

/**
 * The name of the law an outcome refuses under that the predicate picks: none where the outcome is
 * not `invariant-rejected` or names no such law.
 *
 * @param outcome - The apply's outcome.
 * @param picks - Picks the expected law.
 * @returns The law's name in the refusal table.
 */
const refusedNameOf = (
  outcome: { readonly kind: string; readonly refused?: { readonly laws: readonly Law[] } },
  picks: (law: Law) => boolean,
) =>
  outcome.kind === "invariant-rejected"
    ? Option.flatMap(Option.fromUndefinedOr(outcome.refused?.laws.find(picks)), lawNameOf)
    : Option.none();

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
const mapKeyRow = (at: number, key: string, baseType = "string"): Fact<typeof MapKey> => ({
  baseTypes: 1n,
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
 * The name of the trigger a key over a typed key's query (`#pantry/qti/queries.ts`) is on one of
 * the tables the query reads: a rule over a query is a deferred constraint trigger on each table
 * its query reads, all under one name, which grizzle mints from a digest and describes by its
 * comment, `trigger of rule` and the rule as its law spells it (grizzle's `lawsOf`), and grizzle's
 * `constraintNamesOf` names a check alone.
 *
 * @param client - The session.
 * @param table - A table the query reads, by its relation's name.
 * @param side - The key's side as its law spells it, its query and its fields.
 * @returns The trigger's name, the constraint `SET CONSTRAINTS` sets immediate; none or several
 *   fail the case.
 */
const typedKeyRule = (client: Parameters<typeof rowsOf>[0], table: string, side: string) =>
  rowsOf<{ readonly tgname: string }>(
    client,
    `SELECT t.tgname FROM pg_catalog.pg_trigger t
      WHERE t.tgrelid = pg_catalog.to_regclass($1)
        AND pg_catalog.obj_description(t.oid, 'pg_trigger') LIKE $2`,
    [`${qtiSchema}.${tableOf(table)}`, `trigger of rule key ${side}%`],
  ).pipe(
    Effect.map((rows) => {
      assert.lengthOf(rows, 1, `the key over ${side}`);

      return rows[0]?.tgname ?? "";
    }),
  );

/**
 * A stray map key of a mapping of a base type, entry `at`, beside its base type: the row a typed
 * key's query reads.
 *
 * @param baseType - The mapping's base type.
 * @param at - The entry's number.
 * @param key - Its key.
 * @returns The fact, of `MapKeyType`.
 */
const typedKeyFact = (baseType: string, at: number, key: string) => ({
  fact: { baseType, key, mapping: stray, node: strayNode(at) },
  relation: MapKeyType,
});

/**
 * A stray two-item map key of a mapping of a base type, entry `at`: its `MapKeyType` row and its
 * split, the rows a two-item key's query reads.
 *
 * @param baseType - The mapping's base type.
 * @param at - The entry's number.
 * @param key - Its key, two runs around one whitespace character.
 * @returns The facts.
 * @throws {Error} When the key is not two runs: a defect of the test.
 */
const twoItemFacts = (baseType: string, at: number, key: string) => {
  const groups = /^(?<first>[^\t\n\r ]+)(?<gap>[\t\n\r ])(?<second>[^\t\n\r ]+)$/u.exec(
    key,
  )?.groups;
  const [first, gap, second] = [groups?.["first"], groups?.["gap"], groups?.["second"]];
  if (first === undefined || gap === undefined || second === undefined) {
    throw new Error(`The case's key ${JSON.stringify(key)} is not two runs; write one that is.`);
  }

  return [
    typedKeyFact(baseType, at, key),
    {
      fact: { first, gap, key, mapping: stray, node: strayNode(at), second },
      relation: MapKeyItems,
    },
  ];
};

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
        "refuses two integer keys of one mapping that name one integer, by the key over the query MapKeyInteger, and keeps two that name two integers",
        () =>
          // Oracle: PostgreSQL, the key over the query `MapKeyInteger` (`src/qti/queries.ts`;
          // README, "Rules over queries"): a deferred constraint trigger on `MapKeyType`, the table
          // the query reads, set immediate alone, which raises 23505 under the rule's name where
          // two entries of one mapping hold one value, the integer PostgreSQL parses each key's
          // text to (`Compute.parseDecimal`, XML Schema's lexical mapping, Part 2 §3.3.13); the
          // controls name two integers, or hold a key the query's `integerKeyPattern` does not
          // select, which no row of the query holds.
          // Bound: 1 and 01, -0 and +0, and +7 and 007; -1 and 1, 10 and 1, -0 and -10, and 1 and
          // 1.0.
          Effect.gen(function* integerKeys() {
            const client = yield* loginSession;
            const rule = yield* typedKeyRule(
              client,
              MapKeyType.name,
              `${Qti.relations.MapKeyInteger.name}(mapping, value)`,
            );
            for (const { keys, refused } of [
              { keys: ["1", "01"], refused: true },
              { keys: ["-0", "+0"], refused: true },
              { keys: ["+7", "007"], refused: true },
              { keys: ["-1", "1"], refused: false },
              { keys: ["10", "1"], refused: false },
              { keys: ["-0", "-10"], refused: false },
              { keys: ["1", "1.0"], refused: false },
            ] as const) {
              assertVerdict(
                yield* judged(
                  client,
                  statedInserts(keys.map((key, n) => typedKeyFact("integer", n, key))),
                  [rule],
                ),
                rule,
                refused,
                keys.join(" "),
                "23505",
              );
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );

      it.effect(
        "refuses two float keys of one mapping that name one double, by the key over the query MapKeyFloat, and keeps two that name two doubles",
        () =>
          // Oracle: PostgreSQL, the key over the query `MapKeyFloat` (`src/qti/queries.ts`; README,
          // "Rules over queries"): a deferred constraint trigger on `MapKeyType`, set immediate
          // alone, which raises 23505 under the rule's name where two entries of one mapping hold
          // one value, the double grizzle's `Compute.parseDouble` reads each key's text as, XML
          // Schema 1.1's doubleLexicalMap (readings 144 and 154), and `float8` equality, -0 equal to
          // 0 and NaN to NaN; the controls name two doubles, or hold a key the query's
          // `doublePattern` does not select (`+INF`, XML Schema 1.1's), which no row holds.
          // Bound: 1 and 1.0, 1 and 10e-1, 0 and -0, 0.1 and .10, and past grizzle's former
          // bounded form: two overflows, an overflow and INF, an underflow and 0, a 17-digit key
          // and the 18-digit one that rounds with it, a tie to even, a 15-digit mantissa at 293
          // and the 1e+307 it spells, and two NaNs; against 1 and 2, 0.1 and 0.100000000000001
          // (apart in the fifteenth digit), 1 and the double one ulp above it, the greatest finite
          // double and INF, the least subnormal and 0, INF and -INF, and INF and +INF.
          Effect.gen(function* floatKeys() {
            const client = yield* loginSession;
            const rule = yield* typedKeyRule(
              client,
              MapKeyType.name,
              `${Qti.relations.MapKeyFloat.name}(mapping, value)`,
            );
            for (const { keys, refused } of [
              { keys: ["1", "1.0"], refused: true },
              { keys: ["1", "10e-1"], refused: true },
              { keys: ["0", "-0"], refused: true },
              { keys: ["0.1", ".10"], refused: true },
              { keys: ["1e400", "2e400"], refused: true },
              { keys: ["INF", "1e400"], refused: true },
              { keys: ["0", "1e-400"], refused: true },
              { keys: ["1.2345678901234567", "1.23456789012345671"], refused: true },
              { keys: ["9007199254740993", "9007199254740992"], refused: true },
              { keys: ["100000000000000e293", "1e+307"], refused: true },
              { keys: ["NaN", "NaN"], refused: true },
              { keys: ["1", "2"], refused: false },
              { keys: ["0.1", "0.100000000000001"], refused: false },
              { keys: ["1", "1.0000000000000002"], refused: false },
              { keys: ["1.7976931348623157e308", "1e309"], refused: false },
              { keys: ["4.9e-324", "0"], refused: false },
              { keys: ["INF", "-INF"], refused: false },
              { keys: ["INF", "+INF"], refused: false },
            ] as const) {
              assertVerdict(
                yield* judged(
                  client,
                  statedInserts(keys.map((key, n) => typedKeyFact("float", n, key))),
                  [rule],
                ),
                rule,
                refused,
                keys.join(" "),
                "23505",
              );
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
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
        "refuses a two-item key's split that does not spell its key by E1_derived, and a run holding whitespace by Run's pattern law",
        () =>
          // Oracle: PostgreSQL, the E1_derived CHECK on MapKeyItems (the split spells the key),
          // judged as the row is inserted, and the text domain of `Run` as the statement casts
          // each run, named by its row of `textLaws`; the control is the split that spells its key.
          // Bound: a second run that is not the key's, a run holding the space between, and the
          // lawful split of `A B`.
          Effect.gen(function* splits() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const unspelled = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyItems, [
                { ...at(0), first: "A", gap: " ", key: "A B", second: "C" },
              ]),
              {},
            );
            const spaced = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyItems, [
                { ...at(0), first: "A B", gap: " ", key: "A B C", second: "C" },
              ]),
              {},
            );
            const lawful = yield* db.apply(
              ChangeSet.empty(Author).insert(MapKeyItems, [
                { ...at(0), first: "A", gap: " ", key: "A B", second: "B" },
              ]),
              {},
            );

            assert.isTrue(rejectedBy(unspelled, checkNamed("MapKeyItems", "E1_derived")));
            assert.deepStrictEqual(
              refusedNameOf(spaced, patternOf("MapKeyItems", "first")),
              Option.some("E1 derived"),
            );
            assert.isFalse(rejectedBy(lawful, checkNamed("MapKeyItems", "E1_derived")));
            assert.isFalse(rejectedBy(lawful, patternOf("MapKeyItems", "first")));
          }),
      );

      it.effect(
        "refuses two point, pair or directed pair keys of one mapping that name one value, by the key over each one's query, and keeps two that name two values",
        () =>
          // Oracle: PostgreSQL, the key over each two-item query (`src/qti/queries.ts`
          // `MapKeyPoint`, `MapKeyPair` and `MapKeyDirectedPair`): a deferred constraint trigger
          // on `MapKeyItems` and `MapKeyType`, the tables the query reads, set immediate alone,
          // which raises 23505 under the rule's name where two entries of one mapping hold one
          // value (information model §8.13: a pair undirected, a point and a directed pair
          // ordered, a point's integers each `Compute.parseDecimal`'s).
          // Bound: points 1 2 and 01 +2, and 1 2 and 1, a tab, 2; pairs A B and B A, and U+E000
          // U+10000 and its reverse; directed pairs A B and A, a tab, B; against points -1 2 and
          // 1 2, and 1 2 and 2 1, pairs A B and A C, and directed pairs A B and B A.
          Effect.gen(function* twoItemKeys() {
            const client = yield* loginSession;
            const rules = {
              directedPair: yield* typedKeyRule(
                client,
                MapKeyItems.name,
                `${Qti.relations.MapKeyDirectedPair.name}(mapping, value)`,
              ),
              pair: yield* typedKeyRule(
                client,
                MapKeyItems.name,
                `${Qti.relations.MapKeyPair.name}(mapping, value)`,
              ),
              point: yield* typedKeyRule(
                client,
                MapKeyItems.name,
                `${Qti.relations.MapKeyPoint.name}(mapping, x, y)`,
              ),
            };
            for (const { baseType, keys, refused } of [
              { baseType: "point", keys: ["1 2", "01 +2"], refused: true },
              { baseType: "point", keys: ["1 2", "1\t2"], refused: true },
              { baseType: "pair", keys: ["A B", "B A"], refused: true },
              {
                baseType: "pair",
                keys: ["\u{E000} \u{10000}", "\u{10000} \u{E000}"],
                refused: true,
              },
              { baseType: "directedPair", keys: ["A B", "A\tB"], refused: true },
              { baseType: "point", keys: ["-1 2", "1 2"], refused: false },
              { baseType: "point", keys: ["1 2", "2 1"], refused: false },
              { baseType: "pair", keys: ["A B", "A C"], refused: false },
              { baseType: "directedPair", keys: ["A B", "B A"], refused: false },
            ] as const) {
              const rule = rules[baseType];
              assertVerdict(
                yield* judged(
                  client,
                  statedInserts(keys.flatMap((key, n) => twoItemFacts(baseType, n, key))),
                  [rule],
                ),
                rule,
                refused,
                `${baseType}: ${keys.join(" | ")}`,
                "23505",
              );
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );
    },
  );
});
