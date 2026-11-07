/**
 * The key-text bounds against grizzle's own representability rule, `keyTextBytes(fields)`, which
 * measures a key's B-tree entry as the schema's compilation does: each bound is the UTF-8 bytes it
 * leaves beside its key's other fields, and every index of the composed `Qti` that holds a text of
 * one of the bounded kinds holds it at its kind's one bound and is representable.
 */
import { keyTextBytes, natural, str, uuid, writableNamesOf } from "@bjornpagen/grizzle";
import type { FieldBase } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Option, Predicate, Result, Schema } from "effect";
import { OpenLocal } from "#pantry/qti/attributes.ts";
import { EntryPath, ForeignNamespace, NamespacePrefix } from "#pantry/qti/chardata.ts";
import {
  keyText,
  keyTextBytes as keyTextBound,
  localNameBytes,
  namespaceBytes,
  namespaceText,
  prefixBytes,
  utf8Length,
  widestTextKey,
} from "#pantry/qti/limits.ts";
import { Node } from "#pantry/qti/node.ts";
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
 * Whether a value is a grizzle field descriptor, which carries its SQL type.
 *
 * @param value - A relation's field as grizzle keeps it.
 * @returns Whether it is a field.
 */
const isField = (value: unknown): value is FieldBase =>
  Predicate.hasProperty(value, "sql") && Predicate.isString(value.sql);

/**
 * The field descriptors of each stored relation of the composed schema, by relation and name.
 */
const descriptors: ReadonlyMap<string, ReadonlyMap<string, FieldBase>> = new Map(
  writableNamesOf(Qti).map(
    (relation) =>
      [
        relation,
        new Map(
          Object.entries(Qti.relations[relation].fields).flatMap(
            ([name, field]): (readonly [string, FieldBase])[] => {
              // An accumulated or generated field is stored as its own type, a drawn one as a natural.
              if (Predicate.hasProperty(field, "writing") && field.writing === "drawn") {
                return [[name, natural]];
              }

              const stored: unknown = Predicate.hasProperty(field, "field") ? field.field : field;

              return isField(stored) ? [[name, stored]] : [];
            },
          ),
        ),
      ] as const,
  ),
);

/**
 * Measure a key by grizzle's rule: the bytes a text could still hold beside all of its fields.
 *
 * @param fields - The key's fields.
 * @returns The bytes left, or the refusal's message where the entry can pass PostgreSQL's limit.
 */
const roomBeside = (fields: readonly FieldBase[]): Result.Result<number, string> =>
  Result.try({
    catch: String,
    try: () => keyTextBytes(fields),
  });

/**
 * Write a term as a failure's message names it.
 *
 * @param term - A field's name or a `pred` term.
 * @returns Its text.
 */
const termText = (term: Side["terms"][number]): string =>
  Predicate.isString(term) ? term : `pred(${term.field})`;

/**
 * The text types that ride keys, each with its one byte bound: every key a kind rides leaves it the
 * same bytes, so a value one relation holds is never refused by another.
 */
const textKinds: ReadonlyMap<FieldBase, { readonly bytes: number; readonly kind: string }> =
  new Map<FieldBase, { readonly bytes: number; readonly kind: string }>([
    [keyText, { bytes: keyTextBound, kind: "key text" }],
    [EntryPath, { bytes: keyTextBound, kind: "key text (a path)" }],
    [namespaceText, { bytes: namespaceBytes, kind: "namespace name" }],
    [ForeignNamespace, { bytes: namespaceBytes, kind: "namespace name (a foreign element's)" }],
    [OpenLocal, { bytes: localNameBytes, kind: "local name" }],
    [NamespacePrefix, { bytes: prefixBytes, kind: "prefix" }],
    [Node.fields.prefix, { bytes: prefixBytes, kind: "prefix (an element's)" }],
  ]);

/**
 * Any text, line ends included: the language a probe of a byte bound cuts.
 */
const anyText = str.regex("^.*$", "su");

describe("qti/limits.ts", () => {
  it("states each bound as the UTF-8 bytes grizzle's keyTextBytes leaves beside its widest key's other fields", () => {
    // Oracle: grizzle's own rule (`keyTextBytes`, public/text.ts of the vendored engine), the
    // measure the schema's compilation refuses an entry by, read over each kind's widest key: the
    // key text beside `widestTextKey`, the namespace name beside a uuid and the local name's own
    // type, `OpenAttributeName(node, uri, local)`, and the prefix beside a uuid, `Namespace(node,
    // prefix)`; the local name and the namespace name share their entry evenly.
    assert.strictEqual(keyTextBound, keyTextBytes(widestTextKey));
    assert.strictEqual(namespaceBytes, keyTextBytes([uuid, OpenLocal]));
    assert.strictEqual(prefixBytes, keyTextBytes([uuid]));
    assert.isAtLeast(namespaceBytes, localNameBytes);
    assert.isBelow(
      keyTextBytes([uuid, str.bytes(localNameBytes + 1, anyText)]),
      localNameBytes + 1,
    );
    assert.deepStrictEqual(
      { keyTextBound, localNameBytes, namespaceBytes, prefixBytes },
      { keyTextBound: 2587, localNameBytes: 1329, namespaceBytes: 1329, prefixBytes: 2665 },
    );
  });

  it("counts a text's bytes as UTF-8 does: one to four bytes a code point", () => {
    // Oracle: the specification as a checker, RFC 3629 §3's table of byte sequences.
    // Bound: the first and last code point of each of the four lengths.
    for (const [text, bytes] of [
      ["\u{0}", 1],
      ["\u{7F}", 1],
      ["\u{80}", 2],
      ["\u{7FF}", 2],
      ["\u{800}", 3],
      ["\u{FFFF}", 3],
      ["\u{10000}", 4],
      ["\u{10FFFF}", 4],
    ] as const) {
      assert.strictEqual(utf8Length(text), bytes, text);
    }
  });

  it("holds every text of a bounded kind an index of the composed schema keys in an entry grizzle represents", () => {
    // Oracle: grizzle's representability rule (`keyTextBytes`) over every index a statement of
    // `Qti` installs as `laws/model/plan.ts` lowers it: each key, each containment's two sides, and
    // each family's member and owner, a counted family's hidden index beside its terms. A slice
    // that puts a key text in a wider index fails here.
    // Bound: every relation's primary key and every statement of `Qti`.
    const keys: readonly IndexedKey[] = [
      ...writableNamesOf(Qti).map((relation): IndexedKey => ({
        hidden: 0,
        label: "primary key",
        relation,
        terms: Qti.relations[relation].primaryKey,
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
      const held = terms.map((term) =>
        Predicate.isString(term) ? descriptors.get(relation)?.get(term) : natural,
      );
      const kinds = held.map((field) => (field === undefined ? undefined : textKinds.get(field)));
      const last = kinds.findLastIndex((kind) => kind !== undefined);
      const where = `${label} ${relation}(${terms.map(termText).join(", ")})`;
      if (last === -1) {
        continue;
      }

      assert.isFalse(held.includes(undefined), `${where}: every term a field of its relation`);

      // One text is measured against the bytes left beside the key's other fields, the rest of
      // its texts included as fields, as keyTextBytes reads "the other fields of a key".
      const others = held.flatMap((field, at) =>
        field === undefined || at === last ? [] : [field],
      );
      assert.isAtMost(
        kinds[last]?.bytes ?? Number.POSITIVE_INFINITY,
        Result.getOrElse(
          roomBeside([...others, ...Array.from({ length: hidden }, () => natural)]),
          () => -1,
        ),
        `${where}: grizzle represents its ${kinds[last]?.kind ?? "text"}`,
      );
      measured.add(`${relation}(${terms.map(termText).join(", ")})`);
    }

    for (const key of [
      "Document(package, path)",
      "OpenElementName(node, namespace)",
      "OpenAttributeName(node, uri, local)",
      "Namespace(node, prefix)",
      "Resource(package, identifier)",
    ]) {
      assert.isTrue(measured.has(key), `measured ${key}`);
    }
  });
});
