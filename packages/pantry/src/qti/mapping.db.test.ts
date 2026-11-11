/**
 * The mapping overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3):
 * each refused state is one the law's model refuses, named by the law it breaks.
 *
 * Only the laws the database alone evaluates stay here: each typed map key's key over its query
 * (`MapKeyInteger`, `MapKeyFloat`, `MapKeyPoint`, `MapKeyPair` and `MapKeyDirectedPair`), its value
 * read by grizzle's `Compute.parseDecimal` or `Compute.parseDouble`. The row CHECKs, keys and
 * containments the host judges are held on the free tier, by the law oracle and
 * `#pantry/qti/mapping.oracle.test.ts`.
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
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/cli/layer.ts";

import { MapKeyItems, MapKeyType } from "#pantry/qti/mapping.ts";
import { Qti } from "#pantry/qti/schema.ts";
import {
  assertVerdict,
  judged,
  loginSession,
  qtiSchema,
  rowsOf,
  statedInserts,
  tableOf,
} from "#pantry/test/direct-sql.ts";
import { checkConstraintOf } from "#pantry/test/judged-laws.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

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
 * What a typed key case's database refuses, by Map key and Typed attribute value (readings 7, 45
 * and 154): two keys of one value repeat, by the key over their query (23505); two of two values
 * are kept; and a key that is no lexical form of its base type is refused on its own `MapKeyType`
 * row by `Typed_attribute_value` (23514), before any key is read.
 */
type TypedKeyVerdict = "repeat" | "distinct" | "untyped";

/**
 * Assert a typed key case's verdict ({@link TypedKeyVerdict}).
 *
 * @param verdict - The server's error, none for accepted rows.
 * @param rule - The key's trigger's name.
 * @param expected - The case's verdict.
 * @param label - The case, for a failure's message.
 */
const assertTypedKey = (
  verdict: Parameters<typeof assertVerdict>[0],
  rule: string,
  expected: TypedKeyVerdict,
  label: string,
): void => {
  if (expected === "untyped") {
    assertVerdict(
      verdict,
      checkConstraintOf(Qti, MapKeyType.name, "Typed_attribute_value"),
      true,
      label,
    );
  } else {
    assertVerdict(verdict, rule, expected === "repeat", label, "23505");
  }
};

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

describe.skipIf(!hasLease)("qti/mapping.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer)("the mapping overlays' laws, judged by PostgreSQL", (it) => {
    it.effect(
      "refuses two integer keys of one mapping that name one integer, by the key over the query MapKeyInteger, and keeps two that name two integers",
      () =>
        // Oracle: PostgreSQL, the key over the query `MapKeyInteger` (`src/qti/queries.ts`;
        // README, "Rules over queries"): a deferred constraint trigger on `MapKeyType`, the table
        // the query reads, set immediate alone, which raises 23505 under the rule's name where
        // two entries of one mapping hold one value, the integer PostgreSQL parses each key's
        // text to (`Compute.parseDecimal`, XML Schema's lexical mapping, Part 2 §3.3.13); the
        // controls name two integers; and a key the query's `integerKeyPattern` does not select
        // is no integer, so `Typed_attribute_value` refuses its `MapKeyType` row (readings 7 and
        // 45: a map key of an integer mapping is an integer's lexical form), 23514.
        // Bound: 1 and 01, -0 and +0, and +7 and 007; -1 and 1, 10 and 1, and -0 and -10; and 1
        // and 1.0.
        Effect.gen(function* integerKeys() {
          const client = yield* loginSession;
          const rule = yield* typedKeyRule(
            client,
            MapKeyType.name,
            `${Qti.relations.MapKeyInteger.name}(mapping, value)`,
          );
          for (const { keys, verdict } of [
            { keys: ["1", "01"], verdict: "repeat" },
            { keys: ["-0", "+0"], verdict: "repeat" },
            { keys: ["+7", "007"], verdict: "repeat" },
            { keys: ["-1", "1"], verdict: "distinct" },
            { keys: ["10", "1"], verdict: "distinct" },
            { keys: ["-0", "-10"], verdict: "distinct" },
            { keys: ["1", "1.0"], verdict: "untyped" },
          ] as const) {
            assertTypedKey(
              yield* judged(
                client,
                statedInserts(keys.map((key, n) => typedKeyFact("integer", n, key))),
                [rule],
              ),
              rule,
              verdict,
              keys.join(" "),
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
        // 0 and NaN to NaN; the controls name two doubles; and `+INF`, XML Schema 1.1's, which
        // the query's `doublePattern` does not select, is no float key of XML Schema 1.0's
        // lexical space (readings 71 and 154), so `Typed_attribute_value` refuses its
        // `MapKeyType` row, 23514.
        // Bound: 1 and 1.0, 1 and 10e-1, 0 and -0, 0.1 and .10, and past grizzle's former
        // bounded form: two overflows, an overflow and INF, an underflow and 0, a 17-digit key
        // and the 18-digit one that rounds with it, a tie to even, a 15-digit mantissa at 293
        // and the 1e+307 it spells, and two NaNs; against 1 and 2, 0.1 and 0.100000000000001
        // (apart in the fifteenth digit), 1 and the double one ulp above it, the greatest finite
        // double and INF, the least subnormal and 0, and INF and -INF; and INF and +INF.
        Effect.gen(function* floatKeys() {
          const client = yield* loginSession;
          const rule = yield* typedKeyRule(
            client,
            MapKeyType.name,
            `${Qti.relations.MapKeyFloat.name}(mapping, value)`,
          );
          for (const { keys, verdict } of [
            { keys: ["1", "1.0"], verdict: "repeat" },
            { keys: ["1", "10e-1"], verdict: "repeat" },
            { keys: ["0", "-0"], verdict: "repeat" },
            { keys: ["0.1", ".10"], verdict: "repeat" },
            { keys: ["1e400", "2e400"], verdict: "repeat" },
            { keys: ["INF", "1e400"], verdict: "repeat" },
            { keys: ["0", "1e-400"], verdict: "repeat" },
            { keys: ["1.2345678901234567", "1.23456789012345671"], verdict: "repeat" },
            { keys: ["9007199254740993", "9007199254740992"], verdict: "repeat" },
            { keys: ["100000000000000e293", "1e+307"], verdict: "repeat" },
            { keys: ["NaN", "NaN"], verdict: "repeat" },
            { keys: ["1", "2"], verdict: "distinct" },
            { keys: ["0.1", "0.100000000000001"], verdict: "distinct" },
            { keys: ["1", "1.0000000000000002"], verdict: "distinct" },
            { keys: ["1.7976931348623157e308", "1e309"], verdict: "distinct" },
            { keys: ["4.9e-324", "0"], verdict: "distinct" },
            { keys: ["INF", "-INF"], verdict: "distinct" },
            { keys: ["INF", "+INF"], verdict: "untyped" },
          ] as const) {
            assertTypedKey(
              yield* judged(
                client,
                statedInserts(keys.map((key, n) => typedKeyFact("float", n, key))),
                [rule],
              ),
              rule,
              verdict,
              keys.join(" "),
            );
          }
        }).pipe(Effect.scoped),
      { timeout: leaseTestTimeoutMs },
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
        // Each item is an identifier, so `Typed_attribute_value` keeps every `MapKeyType` row
        // and the key alone decides (reading 7: a pair's items are identifiers, whose names are
        // XML 1.0 Second Edition's, as XSD's `\i` and `\c` read them, so no character past
        // U+FFFF and no private-use U+E000 is one; é and U+4E00 are, a BaseChar and an
        // Ideographic).
        // Bound: points 1 2 and 01 +2, and 1 2 and 1, a tab, 2; pairs A B and B A, and é U+4E00
        // and its reverse; directed pairs A B and A, a tab, B; against points -1 2 and
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
              keys: ["\u{E9} \u{4E00}", "\u{4E00} \u{E9}"],
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
  });
});
