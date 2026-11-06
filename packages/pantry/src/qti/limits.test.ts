/**
 * The key-text bound against grizzle's own representability rule: the derivation's constants
 * against PostgreSQL's, and every key of the composed `Qti` that holds a key text against the
 * bound.
 */
import { assert, describe, it } from "@effect/vitest";
import { Option, Predicate, Schema } from "effect";
import {
  boundedTextPattern,
  btreeEntryBytes,
  btreeMaxItemSize,
  keyDatums,
  keyText,
  keyTextBound,
  keyTextCodePoints,
  keyTextPattern,
  localNameCodePoints,
  namespaceCodePoints,
  namespaceTextPattern,
  textDatum,
  widestTextKey,
} from "#pantry/qti/limits.ts";
import type { KeyDatum } from "#pantry/qti/limits.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * A term of a side as grizzle keeps it: a field's name, or a `pred` term over a natural field, a
 * bigint either way.
 */
const TermSchema = Schema.Union([Schema.String, Schema.Struct({ field: Schema.String })]);

/**
 * The relation a side reads: a relation's own description, or a selection's, which holds it.
 */
const SourceSchema = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("relation"), name: Schema.String }),
  Schema.Struct({
    relation: Schema.Struct({ kind: Schema.Literal("relation"), name: Schema.String }),
  }),
]);

/**
 * One side of a statement: the relation it reads and its terms, in pairing order.
 */
const SideSchema = Schema.Struct({ source: SourceSchema, terms: Schema.Array(TermSchema) });

/**
 * A side as this test reads it.
 */
type Side = typeof SideSchema.Type;

/**
 * The parts of a statement an index comes from: a key's side, a containment's two, and a
 * family's member side and the owner its count is drawn on.
 */
const StatementSchema = Schema.Struct({
  family: Schema.optional(SideSchema),
  kind: Schema.String,
  left: Schema.optional(SideSchema),
  right: Schema.optional(SideSchema),
  side: Schema.optional(SideSchema),
  slots: Schema.optional(
    Schema.Struct({
      owner: Schema.Struct({ name: Schema.String, primaryKey: Schema.Array(Schema.String) }),
    }),
  ),
});

/**
 * A field as grizzle keeps it, the parts this test reads: its SQL type, and a text's pattern.
 */
const FieldSchema = Schema.Struct({
  pattern: Schema.optional(Schema.Struct({ source: Schema.String })),
  sql: Schema.String,
});

/**
 * A field as this test reads it.
 */
type Field = typeof FieldSchema.Type;

/**
 * A stored relation of the schema: its name, primary key and fields.
 */
const RelationSchema = Schema.Struct({
  fields: Schema.Record(Schema.String, FieldSchema),
  kind: Schema.Literal("relation"),
  name: Schema.String,
  primaryKey: Schema.Array(Schema.String),
});

/**
 * One B-tree index a statement installs: the relation, the terms of the statement's side over it,
 * and how many hidden bigint columns a family adds beside them.
 */
interface IndexedKey {
  readonly hidden: number;
  readonly label: string;
  readonly relation: string;
  readonly terms: Side["terms"];
}

/**
 * The stored relations of the composed schema, by name, each parsed at the boundary.
 */
const relations: ReadonlyMap<string, typeof RelationSchema.Type> = new Map(
  Object.values(Qti.relations).flatMap((member) =>
    Option.match(Schema.decodeUnknownOption(RelationSchema)(member), {
      onNone: () => [],
      onSome: (relation) => [[relation.name, relation] as const],
    }),
  ),
);

/**
 * List the index one side of a statement installs: its terms, beside `hidden` family columns.
 *
 * @param side - The side.
 * @param hidden - How many hidden bigint columns the family adds beside the side's terms.
 * @param label - The statement, for a failure's message.
 * @returns The index.
 */
const sideKey = (side: Side, hidden: number, label: string): IndexedKey => ({
  hidden,
  label,
  relation: "name" in side.source ? side.source.name : side.source.relation.name,
  terms: side.terms,
});

/**
 * List every index a statement installs over a side, as `laws/model/plan.ts` lowers it: a key's
 * UNIQUE; a containment's target UNIQUE and its source's reverse index; a family's axis UNIQUE on
 * its member, its terms with a counted family's hidden index, and the owner's UNIQUE over its key
 * and count, which the count copy references.
 *
 * @param statement - The statement, parsed.
 * @returns Its indexes.
 */
const statementKeys = (statement: typeof StatementSchema.Type): readonly IndexedKey[] => {
  const { family, kind, left, right, side, slots } = statement;
  const sides = [
    ...(side === undefined ? [] : [sideKey(side, 0, kind)]),
    ...(left === undefined ? [] : [sideKey(left, 0, kind)]),
    ...(right === undefined ? [] : [sideKey(right, 0, kind)]),
    ...(family === undefined ? [] : [sideKey(family, kind === "counted" ? 1 : 0, kind)]),
  ];
  const owner =
    slots === undefined
      ? []
      : [{ hidden: 1, label: kind, relation: slots.owner.name, terms: slots.owner.primaryKey }];

  return [...sides, ...owner];
};

/**
 * One atom of a bounded pattern and its repetition: a class, `.`, an escape or one literal
 * character, then an optional `{0,n}` or `{n}`.
 */
const boundedAtom =
  /(?:\[(?:\\.|[^\]\\])*\]|\.|\\.|[^\\[\](){}|?*+^$])(?:\{(?:0,)?(?<count>\d+)\})?/uy;

/**
 * Read the most code points a text field's pattern admits, where the pattern is an anchored run of
 * atoms each repeated a bounded number of times, the form every key text takes
 * (`boundedTextPattern`, `EntryPath`, a foreign namespace).
 *
 * @param field - The field.
 * @returns The bound, or none for any other pattern, which this test does not measure.
 */
const textBound = (field: Field): number | undefined => {
  const source = field.pattern?.source ?? "";
  if (!source.startsWith("^") || !source.endsWith("$")) {
    return undefined;
  }

  const body = source.slice(1, -1);
  let bound = 0;
  boundedAtom.lastIndex = 0;
  while (boundedAtom.lastIndex < body.length) {
    const match = boundedAtom.exec(body);
    if (match === null) {
      return undefined;
    }

    bound += Number(match.groups?.["count"] ?? "1");
  }

  return bound;
};

/**
 * The datum of each SQL type a key's other fields take, at grizzle's width and alignment
 * (`schema/representability.ts` `datumBound`).
 */
const datumsBySql: ReadonlyMap<string, KeyDatum> = new Map<string, KeyDatum>([
  ["bigint", keyDatums.bigint],
  ["boolean", keyDatums.boolean],
  ["code", keyDatums.code],
  ["smallint", keyDatums.code],
  ["uuid", keyDatums.uuid],
]);

/**
 * Write a term as a failure's message names it.
 *
 * @param term - A field's name or a `pred` term.
 * @returns Its text.
 */
const termText = (term: Side["terms"][number]): string =>
  Predicate.isString(term) ? term : `pred(${term.field})`;

/**
 * The kinds of text that ride keys, each with its one bound: every key a kind rides leaves it the
 * same number of code points, so a value one relation holds is never refused by another.
 */
const textKinds = {
  "key text": keyTextCodePoints,
  "local name": localNameCodePoints,
  namespace: namespaceCodePoints,
} as const;

/**
 * The kind of a text field a key holds: a field of type `keyText` or `namespaceText` by its
 * pattern, and every other keyed text field by its relation and name.
 */
const kindOfField: ReadonlyMap<string, keyof typeof textKinds> = new Map<
  string,
  keyof typeof textKinds
>([
  ["Document.path", "key text"],
  ["DocumentDirectory.path", "key text"],
  ["Entry.path", "key text"],
  ["OpenAttributeName.local", "local name"],
  ["OpenElementName.namespace", "namespace"],
  ["OpenElementName.parentNamespace", "namespace"],
  ["TestDocument.path", "key text"],
]);

/**
 * Read the kind of a keyed text field.
 *
 * @param relation - The field's relation.
 * @param term - The field's name.
 * @param field - The field.
 * @returns Its kind, or none for a text field no kind names.
 */
const kindOf = (
  relation: string,
  term: string,
  field: Field,
): keyof typeof textKinds | undefined => {
  if (field.pattern?.source === keyTextPattern) {
    return "key text";
  }

  return field.pattern?.source === namespaceTextPattern
    ? "namespace"
    : kindOfField.get(`${relation}.${term}`);
};

describe("qti/limits.ts", () => {
  it("derives BTMaxItemSize as PostgreSQL states it, and writes the key text's pattern from its bound", () => {
    // Oracle: the specification. PostgreSQL 19 refuses an over-long B-tree entry with "index row
    // size … exceeds btree version 4 maximum 2704" at BLCKSZ 8192 (nbtutils.c, _bt_check_third_page,
    // BTMaxItemSize); and the pattern's language is the bounded text the bound names, read by
    // JavaScript's RegExp, whose grammar `str.regex` takes (ECMAScript under `su`).
    assert.strictEqual(btreeMaxItemSize, 2704);
    assert.strictEqual(keyTextPattern, boundedTextPattern(keyTextCodePoints));
    assert.strictEqual(namespaceTextPattern, boundedTextPattern(namespaceCodePoints));
    assert.isTrue(
      Predicate.hasProperty(keyText, "pattern") &&
        Predicate.hasProperty(keyText.pattern, "source") &&
        keyText.pattern.source === keyTextPattern,
    );

    const language = new RegExp(keyTextPattern, "su");
    assert.isTrue(language.test("🀀".repeat(keyTextCodePoints)));
    assert.isTrue(language.test("\n"));
    assert.isTrue(language.test(""));
    assert.isFalse(language.test("a".repeat(keyTextCodePoints + 1)));
  });

  it("bounds a key text by the most code points one B-tree entry holds beside each shape of other datums", () => {
    // Oracle: the rule restated as arithmetic, exhausted over a small scope: the bound fits and
    // one code point more does not, and the covering shape's bound is the exported one.
    // Bound: every multiset of 0 to 3 datums over uuid, smallint code and bigint (20 combinations).
    const kinds: readonly KeyDatum[] = [keyDatums.uuid, keyDatums.code, keyDatums.bigint];
    const combinations: KeyDatum[][] = [[]];
    for (let size = 1; size <= 3; size += 1) {
      for (const prefix of combinations.filter((combination) => combination.length === size - 1)) {
        const last = kinds.indexOf(prefix.at(-1) ?? keyDatums.uuid);
        for (const datum of kinds.slice(last)) {
          combinations.push([...prefix, datum]);
        }
      }
    }

    assert.strictEqual(combinations.length, 20);
    for (const others of combinations) {
      const bound = keyTextBound(others);

      assert.isAtMost(btreeEntryBytes([...others, textDatum(bound)]), btreeMaxItemSize);
      assert.isAbove(btreeEntryBytes([...others, textDatum(bound + 1)]), btreeMaxItemSize);
    }

    assert.strictEqual(keyTextCodePoints, keyTextBound(widestTextKey));
    assert.strictEqual(keyTextCodePoints, 648);
  });

  it("fits every index of the composed schema that holds a text within one B-tree entry, each text at its kind's one bound", () => {
    // Oracle: grizzle's representability rule (schema/representability.ts keyLayout), restated
    // in limits.ts, over every index a statement of `Qti` installs as `laws/model/plan.ts` lowers
    // it: each key, each containment's two sides, and each family's member and owner, a counted
    // family's hidden index beside its terms. A slice that puts a key text in a wider index fails
    // here, and the shape and its bound in limits.ts widen in one place.
    // Bound: every relation's primary key and every statement of `Qti`.
    const keys: readonly IndexedKey[] = [
      ...[...relations.values()].map(({ name, primaryKey }): IndexedKey => ({
        hidden: 0,
        label: "primary key",
        relation: name,
        terms: primaryKey,
      })),
      ...Qti.statements.flatMap((statement) =>
        Option.match(Schema.decodeUnknownOption(StatementSchema)(statement), {
          onNone: () => [],
          onSome: statementKeys,
        }),
      ),
    ];
    const measured = new Set<string>();
    for (const { hidden, label, relation, terms } of keys) {
      const fields = relations.get(relation)?.fields;
      const named = terms.map((term) =>
        Predicate.isString(term) && fields !== undefined ? fields[term] : undefined,
      );
      const texts = named.flatMap((field) => (field?.sql === "text" ? [field] : []));
      const bounds = texts.map(textBound);

      if (texts.length === 0 || bounds.includes(undefined)) {
        continue;
      }

      const where = `${label} ${relation}(${terms.map(termText).join(", ")})`;
      const others = named.flatMap((field, at): readonly KeyDatum[] => {
        if (field?.sql === "text") {
          return [];
        }

        const term = terms[at];
        const datum =
          term === undefined || Predicate.isString(term)
            ? datumsBySql.get(field?.sql ?? "")
            : keyDatums.bigint;
        assert.isDefined(datum, `${where}: a field of a measured type`);

        return datum === undefined ? [] : [datum];
      });
      const datums = [
        ...others,
        ...Array.from({ length: hidden }, () => keyDatums.bigint),
        ...bounds.map((bound) => textDatum(bound ?? 0)),
      ];

      for (const [at, field] of named.entries()) {
        const term = terms[at];
        if (field?.sql === "text" && Predicate.isString(term)) {
          const kind = kindOf(relation, term, field);

          assert.isDefined(kind, `${where}: ${term} is a text of a kind with one bound`);
          assert.strictEqual(
            textBound(field),
            kind === undefined ? undefined : textKinds[kind],
            `${where}: ${term} takes its kind's bound`,
          );
        }
      }

      assert.isAtMost(btreeEntryBytes(datums), btreeMaxItemSize, where);
      measured.add(`${relation}(${terms.map(termText).join(", ")})`);
    }

    for (const key of [
      "Document(package, path)",
      "OpenElementName(node, namespace)",
      "OpenAttributeName(node, uri, local)",
      "FileHref(package, href)",
      "Resource(package, identifier)",
    ]) {
      assert.isTrue(measured.has(key), `measured ${key}`);
    }
  });
});
