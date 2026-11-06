/**
 * The key-text bounds against grizzle's own representability rule, `keyTextBytes(fields)`, which
 * measures a key's B-tree entry as the schema's compilation does: each bound fits beside its key's
 * other fields and one code point more does not, and every key of the composed `Qti` that holds a
 * text holds it at its kind's one bound and is representable.
 */
import { keyTextBytes, natural, str, uuid } from "@bjornpagen/grizzle";
import type { FieldBase } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Option, Predicate, Result, Schema } from "effect";
import { OpenLocal } from "#pantry/qti/attributes.ts";
import {
  boundedTextPattern,
  keyText,
  keyTextCodePoints,
  keyTextPattern,
  localNameCodePoints,
  namespaceCodePoints,
  namespaceText,
  namespaceTextPattern,
  widestTextKey,
} from "#pantry/qti/limits.ts";
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
  Object.values(Qti.relations).flatMap((member) =>
    member.kind === "relation"
      ? [
          [
            member.name,
            new Map(
              Object.entries(member.fields).flatMap(
                ([name, field]): (readonly [string, FieldBase])[] => {
                  // An accumulated or generated field is stored as its own type, a drawn one as a natural.
                  if (Predicate.hasProperty(field, "writing") && field.writing === "drawn") {
                    return [[name, natural]];
                  }

                  const stored: unknown = Predicate.hasProperty(field, "field")
                    ? field.field
                    : field;

                  return isField(stored) ? [[name, stored]] : [];
                },
              ),
            ),
          ] as const,
        ]
      : [],
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
  it("writes each bounded pattern as the literal of its bound, whose language is every text of that many code points", () => {
    // Oracle: the pattern's language read by JavaScript's RegExp, whose grammar `str.regex` takes
    // (ECMAScript under `su`): the bounded text the bound names, a newline and the empty text in.
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

  it("bounds a key text and a namespace name by the most grizzle's keyTextBytes holds beside their widest keys, one code point more refused", () => {
    // Oracle: grizzle's own rule (`keyTextBytes`, public/text.ts of the vendored engine), the
    // measure the schema's compilation refuses an entry by: each bound's text fits beside its
    // widest key's other fields, and the text of one code point more does not. The key text's
    // widest key, the tree's predecessor axis, holds NULL-able hidden columns, whose 8-byte null
    // bitmap `keyTextBytes` does not count, so its text fits where a byte is left (limits.ts).
    // Bound: the key text beside `widestTextKey`, and the namespace name beside a uuid and a local
    // name, `OpenAttributeName(node, uri, local)`.
    assert.isAtLeast(
      Result.getOrElse(roomBeside([...widestTextKey, keyText]), () => -1),
      1,
    );
    assert.strictEqual(
      Result.getOrElse(
        roomBeside([...widestTextKey, str.regex("^.{0,255}.{0,255}.{0,137}$", "su")]),
        () => -1,
      ),
      0,
    );
    assert.strictEqual(keyTextCodePoints, 646);
    assert.strictEqual(boundedTextPattern(647), "^.{0,255}.{0,255}.{0,137}$");

    assert.isTrue(Result.isSuccess(roomBeside([uuid, OpenLocal, namespaceText])));
    assert.match(
      Result.getOrElse(
        Result.flip(roomBeside([uuid, OpenLocal, str.regex("^.{0,255}.{0,155}$", "su")])),
        () => "",
      ),
      /UnrepresentableKey/u,
    );
    assert.strictEqual(boundedTextPattern(namespaceCodePoints + 1), "^.{0,255}.{0,155}$");
    assert.strictEqual(localNameCodePoints, 255);
  });

  it("holds every text an index of the composed schema keys at its kind's one bound, in an entry grizzle represents", () => {
    // Oracle: grizzle's representability rule (`keyTextBytes`) over every index a statement of
    // `Qti` installs as `laws/model/plan.ts` lowers it: each key, each containment's two sides, and
    // each family's member and owner, a counted family's hidden index beside its terms. A slice
    // that puts a key text in a wider index fails here.
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

      if (texts.length === 0 || texts.map(textBound).includes(undefined)) {
        continue;
      }

      const where = `${label} ${relation}(${terms.map(termText).join(", ")})`;
      const held = terms.map((term) =>
        Predicate.isString(term) ? descriptors.get(relation)?.get(term) : natural,
      );
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

      assert.isFalse(held.includes(undefined), `${where}: every term a field of its relation`);
      assert.isTrue(
        Result.isSuccess(
          roomBeside([
            ...held.flatMap((field) => (field === undefined ? [] : [field])),
            ...Array.from({ length: hidden }, () => natural),
          ]),
        ),
        `${where}: grizzle represents its entry`,
      );
      measured.add(`${relation}(${terms.map(termText).join(", ")})`);
    }

    for (const key of [
      "Document(package, path)",
      "OpenElementName(node, namespace)",
      "OpenAttributeName(node, uri, local)",
      "Resource(package, identifier)",
    ]) {
      assert.isTrue(measured.has(key), `measured ${key}`);
    }
  });
});
