/**
 * The import's rows judged on the host: the laws `Qti` states that a package's rows can be held to
 * before any of them is written, evaluated over the rows `readProgram` builds, each named by its
 * law as a refusal names it (`#pantry/import/refusal.ts` `lawNameOf`), each statement's laws as
 * grizzle's `lawsOf` gives them.
 *
 * Four kinds of statement are evaluated, from the statements grizzle keeps for them, never from a
 * list written here:
 *
 * - A key over a relation or a selection of one: no two selected rows share the key's fields;
 * - A containment, either way of a mirrors, or one an alternatives states: every selected row's terms
 *   are a tuple of the target, a closed relation's facts or the import's own rows of a stored
 *   relation;
 * - A check: no row of its relation makes its predicate false, as PostgreSQL's CHECK reads it, a
 *   closed read and the `Compute` functions it calls included, NULL passing;
 * - A pattern: every value of a field whose type states it matches it;
 * - A key text's bound: no field of type `keyText` holds more than `keyTextBytes` bytes.
 *
 * A generated field's law holds where the program writes no row of its relation, and is unknown
 * otherwise, since the database computes the field.
 *
 * A statement is evaluated only where the import writes its relation as rows, every row the
 * selection or the check reads holds every field it reads, and the predicate is of the part of
 * grizzle's language this module reads (fields, literals, comparisons, `in`, `and`, `or`, `not`).
 * Anything else leaves the statement unknown, so a law is held on the host only where every
 * statement and every check of it was evaluated and held.
 *
 * The rows also must name no uuid the program did not mint: a row's uuid field that names no id of
 * the program names no row PostgreSQL can hold, as a sentinel standing for an absent target does.
 */
import { Array as Arr, Formatter, Option, pipe, Predicate, Schema } from "effect";
import { lawsOf, sameLaw } from "@bjornpagen/grizzle";
import type { Law, LawSide } from "@bjornpagen/grizzle";
import { lawNameOf, lawOfCheck, statedLaws } from "#pantry/import/refusal.ts";
import type { LawName } from "#pantry/import/refusal.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { keyTextBytes, utf8Length } from "#pantry/qti/limits.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { identityOf, keyTextFields } from "#pantry/test/key-copies.ts";

/**
 * One field's value as a row holds it: a text, a number, a natural, a flag or a set of handles.
 */
export type Value = bigint | boolean | number | ReadonlySet<string> | string;

/**
 * One row of a relation as the host reads it: its own fields, a nested family left out.
 */
export type Row = Readonly<Record<string, Value>>;

/**
 * The import's rows by relation: each relation the import writes, its families flattened into
 * rows of their own relations with the fields their nesting supplies.
 */
export type View = ReadonlyMap<string, readonly Row[]>;

/**
 * One field of a row as the program builds it: a value, or a nested family of rows.
 */
type Field = readonly Stored[] | Value;

/**
 * A row as the program builds it, its families nested.
 */
interface Stored {
  readonly [name: string]: Field;
}

/**
 * The schema of a {@link Value}.
 */
const ValueSchema = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.BigInt,
  Schema.Boolean,
  Schema.ReadonlySet(Schema.String),
]);

/**
 * The schema of a {@link Stored} row, which parses the program's rows at the host's boundary.
 */
const StoredSchema: Schema.Codec<Stored> = Schema.Record(
  Schema.String,
  Schema.Union([
    ValueSchema,
    Schema.Array(Schema.suspend((): Schema.Codec<Stored> => StoredSchema)),
  ]),
);

/**
 * The schema of a relation's keyed set as the program builds it.
 */
const RowsSchema = Schema.ReadonlyMap(Schema.String, StoredSchema);

/**
 * The schema of a program's inputs as the host first reads them: each relation by name, its keyed
 * set parsed by {@link RowsSchema} alone, so a relation whose rows it cannot read is left out
 * rather than every relation.
 */
const InputsSchema = Schema.Record(Schema.String, Schema.Unknown);

/**
 * A literal value a predicate compares with.
 */
type Literal = bigint | boolean | number | ReadonlySet<string> | string;

/**
 * The schema of a {@link Literal}.
 */
const LiteralSchema = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.BigInt,
  Schema.Boolean,
  Schema.ReadonlySet(Schema.String),
]);

/**
 * A term of a stored predicate as grizzle keeps it, read field by field, a literal's value unread:
 * {@link termOf} reads it, and a literal of no {@link Literal} is `unread` there, as the production
 * host judge reads one (`#pantry/host/predicates.ts` `termOf`), so the statement that holds it is
 * still evaluated, unknown where the literal decides.
 */
interface StoredTerm {
  readonly arg?: StoredTerm;
  readonly args?: readonly StoredTerm[];
  readonly field?: string;
  readonly fn?: string;
  readonly kind: string;
  readonly relation?: string;
  readonly left?: StoredTerm;
  readonly op?: string;
  readonly right?: StoredTerm;
  readonly value?: unknown;
  readonly values?: readonly unknown[];
}

/**
 * The schema of a {@link StoredTerm}.
 */
const StoredTermSchema: Schema.Codec<StoredTerm> = Schema.Struct({
  arg: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  args: Schema.optionalKey(
    Schema.Array(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  ),
  field: Schema.optionalKey(Schema.String),
  fn: Schema.optionalKey(Schema.String),
  kind: Schema.String,
  left: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  op: Schema.optionalKey(Schema.String),
  relation: Schema.optionalKey(Schema.String),
  right: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  value: Schema.optionalKey(Schema.Unknown),
  values: Schema.optionalKey(Schema.Array(Schema.Unknown)),
});

/**
 * A term of a predicate, the part of grizzle's language this module reads; any other term is
 * `unread`.
 */
type Term =
  | { readonly args: readonly Term[]; readonly kind: "and" | "or" }
  | { readonly arg: Term; readonly kind: "in"; readonly values: readonly string[] }
  | { readonly arg: Term; readonly kind: "not" }
  | { readonly field: string; readonly kind: "field" }
  | { readonly kind: "compare"; readonly left: Term; readonly op: string; readonly right: Term }
  | { readonly kind: "literal"; readonly value: Literal }
  | {
      readonly args: readonly Term[];
      readonly field: string;
      readonly kind: "closedAt";
      readonly relation: string;
    }
  | { readonly args: readonly Term[]; readonly kind: "closedRow"; readonly relation: string }
  | { readonly args: readonly Term[]; readonly kind: "closedHas"; readonly relation: string }
  | { readonly args: readonly Term[]; readonly fn: string; readonly kind: "compute" }
  | { readonly kind: "unread" };

/**
 * The term no part of this module reads.
 */
const unread: Term = { kind: "unread" };

/**
 * Reads a stored term, none for a missing operand, into a {@link Term}.
 */
type TermReader = (stored: StoredTerm | undefined) => Term;

/**
 * Read the operands of a stored term.
 *
 * @param stored - The term.
 * @param read - Reads one operand.
 * @returns Its operands, each read.
 */
const operandsOf = (stored: StoredTerm, read: TermReader): readonly Term[] =>
  (stored.args ?? []).map((arg) => read(arg));

/**
 * Read each kind of stored term this module reads into a {@link Term}, `unread` where its shape
 * lacks a part the kind needs.
 */
const termReaders: ReadonlyMap<string, (stored: StoredTerm, read: TermReader) => Term> = new Map<
  string,
  (stored: StoredTerm, read: TermReader) => Term
>([
  ["and", (stored, read) => ({ args: operandsOf(stored, read), kind: "and" })],
  ["or", (stored, read) => ({ args: operandsOf(stored, read), kind: "or" })],
  ["not", (stored, read) => ({ arg: read(stored.arg), kind: "not" })],
  [
    "in",
    (stored, read) => {
      const written = stored.values ?? [];
      const values = written.flatMap((value) =>
        Option.toArray(Schema.decodeUnknownOption(LiteralSchema)(value)),
      );

      return values.length === written.length
        ? { arg: read(stored.arg), kind: "in", values: values.map(String) }
        : unread;
    },
  ],
  [
    "field",
    (stored) => (stored.field === undefined ? unread : { field: stored.field, kind: "field" }),
  ],
  [
    "compare",
    (stored, read) =>
      stored.op === undefined
        ? unread
        : {
            kind: "compare",
            left: read(stored.left),
            op: stored.op,
            right: read(stored.right),
          },
  ],
  [
    "literal",
    (stored) =>
      Option.match(Schema.decodeUnknownOption(LiteralSchema)(stored.value), {
        onNone: () => unread,
        onSome: (value): Term => ({ kind: "literal", value }),
      }),
  ],
  [
    "closedAt",
    (stored, read) =>
      stored.relation === undefined || stored.field === undefined
        ? unread
        : {
            args: operandsOf(stored, read),
            field: stored.field,
            kind: "closedAt",
            relation: stored.relation,
          },
  ],
  [
    "closedRow",
    (stored, read) =>
      stored.relation === undefined
        ? unread
        : { args: operandsOf(stored, read), kind: "closedRow", relation: stored.relation },
  ],
  [
    "closedHas",
    (stored, read) =>
      stored.relation === undefined
        ? unread
        : { args: operandsOf(stored, read), kind: "closedHas", relation: stored.relation },
  ],
  [
    "compute",
    (stored, read) =>
      stored.fn === undefined
        ? unread
        : { args: operandsOf(stored, read), fn: stored.fn, kind: "compute" },
  ],
]);

/**
 * Read a stored term into a {@link Term}.
 *
 * @param stored - The term as grizzle keeps it, none for a missing operand.
 * @returns The term, `unread` for one of a kind or shape this module does not read.
 */
const termOf: TermReader = (stored) =>
  stored === undefined ? unread : (termReaders.get(stored.kind)?.(stored, termOf) ?? unread);

/**
 * The schema of a stored side: a selection with its predicate, or a whole relation, and its terms.
 */
const StoredSide = Schema.Struct({
  source: Schema.Union([
    Schema.Struct({
      desc: Schema.Struct({ predicate: StoredTermSchema }),
      relation: Schema.Struct({ name: Schema.String }),
    }),
    Schema.Struct({ name: Schema.String }),
  ]),
  terms: Schema.NonEmptyArray(
    Schema.Union([
      Schema.String,
      Schema.Struct({ field: Schema.String, kind: Schema.Literal("pred") }),
    ]),
  ),
});

/**
 * The schema of the stored statements this module evaluates: a key, a containment or a mirrors,
 * an alternatives, which holds no side and states its containments only as its laws, and a check
 * whose predicate it reads.
 */
const StoredStatement = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("key"), side: StoredSide }),
  Schema.Struct({ kind: Schema.Literal("alternatives") }),
  Schema.Struct({
    kind: Schema.Literals(["contained", "mirrors"]),
    left: StoredSide,
    right: StoredSide,
  }),
  Schema.Struct({
    desc: Schema.Struct({ name: Schema.String, predicate: StoredTermSchema }),
    kind: Schema.Literal("check"),
    relation: Schema.Struct({ name: Schema.String }),
  }),
]);

/**
 * The schema of any check by its name, whose predicate this module may not read: a law one of
 * whose checks it cannot evaluate is never held on the host.
 */
const StoredCheck = Schema.Struct({
  desc: Schema.Struct({ name: Schema.String }),
  kind: Schema.Literal("check"),
});

/**
 * A side of a statement: its relation, its selection's predicate where it has one, and its terms,
 * each a field's name, or none for a term no field is.
 */
interface Side {
  readonly predicate: Option.Option<Term>;
  readonly relation: string;
  /**
   * Each term: a field's name, and none for a `pred` term, which this module does not evaluate.
   */
  readonly terms: readonly ({ readonly field: string; readonly kind: "field" } | undefined)[];
}

/**
 * A side read two ways: as the host evaluates it, and as an outcome names its law.
 */
interface ReadSide {
  readonly law: LawSide;
  readonly side: Side;
}

/**
 * Read a stored side.
 *
 * @param side - The side as grizzle keeps it.
 * @returns The side and its law side.
 */
const sideOf = (side: typeof StoredSide.Type): ReadSide => {
  const relation = "relation" in side.source ? side.source.relation.name : side.source.name;

  return {
    law: {
      relation,
      selection: { conjuncts: [] },
      terms: pipe(
        side.terms,
        Arr.map((term) =>
          Predicate.isString(term) ? { field: term, kind: "field" as const } : term,
        ),
      ),
    },
    side: {
      predicate:
        "desc" in side.source ? Option.some(termOf(side.source.desc.predicate)) : Option.none(),
      relation,
      terms: side.terms.map((term) =>
        Predicate.isString(term) ? { field: term, kind: "field" as const } : undefined,
      ),
    },
  };
};

/**
 * Read a law side as grizzle's `lawsOf` names it as a stored side ({@link StoredSide}): a selection
 * whose predicate is the conjunction of its selection's conjuncts, or a whole relation where it has
 * none, and its terms as a stored side holds them.
 *
 * @param side - The side.
 * @returns The stored side, or none where a conjunct does not decode, which leaves its law
 *   unevaluated, as a statement that does not decode is.
 */
const storedSideOf = (side: LawSide): Option.Option<typeof StoredSide.Type> =>
  Schema.decodeUnknownOption(StoredSide)({
    source: Arr.isReadonlyArrayNonEmpty(side.selection.conjuncts)
      ? {
          desc: { predicate: { args: side.selection.conjuncts, kind: "and" } },
          relation: { name: side.relation },
        }
      : { name: side.relation },
    terms: side.terms.map((term) => (term.kind === "field" ? term.field : term)),
  });

/**
 * A statement this module evaluates, with its law as grizzle's `lawsOf` names it: a key's, a
 * check's, or one containment's, a mirrors' or an alternatives' each its own.
 */
type Evaluated =
  | { readonly kind: "key"; readonly law: Law; readonly side: Side }
  | {
      readonly kind: "check";
      readonly law: Law;
      readonly predicate: Term;
      readonly relation: string;
    }
  | {
      readonly from: Side;
      readonly kind: "contained";
      readonly law: Law;
      readonly to: Side;
    };

/**
 * Whether a law side reads a side as this module read it from its statement: the same relation and
 * the same terms, each a field or `pred` of one, in order.
 *
 * @param law - The side as the law names it.
 * @param read - The side as this module read it.
 * @returns Whether they are one side.
 */
const sameSide = (law: LawSide, read: LawSide): boolean =>
  law.relation === read.relation &&
  law.terms.length === read.terms.length &&
  law.terms.every((term, at) => {
    const held = read.terms[at];

    return held !== undefined && term.kind === held.kind && term.field === held.field;
  });

/**
 * Read the statements of one stored statement this module evaluates, each with its law: a key's, a
 * check's, a containment's, and both containments of a mirrors, each the law of `laws` whose sides
 * are its own; and each containment of an alternatives, read from its law, since the statement
 * holds no side.
 *
 * @param read - The stored statement.
 * @param laws - Its laws, as grizzle's `lawsOf` names them.
 * @returns The statements.
 */
const evaluatedOf = (
  read: typeof StoredStatement.Type,
  laws: readonly Law[],
): readonly Evaluated[] => {
  if (read.kind === "check") {
    return laws.flatMap((law) =>
      law.kind === "check"
        ? [
            {
              kind: "check" as const,
              law,
              predicate: termOf(read.desc.predicate),
              relation: read.relation.name,
            },
          ]
        : [],
    );
  }

  if (read.kind === "key") {
    const { side } = sideOf(read.side);

    return laws.flatMap((law) => (law.kind === "key" ? [{ kind: "key" as const, law, side }] : []));
  }

  if (read.kind === "alternatives") {
    return laws.flatMap((law) =>
      law.kind === "contained"
        ? Option.toArray(
            Option.zipWith(storedSideOf(law.from), storedSideOf(law.to), (from, to) => ({
              from: sideOf(from).side,
              kind: "contained" as const,
              law,
              to: sideOf(to).side,
            })),
          )
        : [],
    );
  }

  const left = sideOf(read.left);
  const right = sideOf(read.right);
  const pairs: readonly (readonly [ReadSide, ReadSide])[] =
    read.kind === "contained"
      ? [[left, right]]
      : [
          [left, right],
          [right, left],
        ];

  return pairs.flatMap(([from, to]) =>
    laws.flatMap((law) =>
      law.kind === "contained" && sameSide(law.from, from.law) && sameSide(law.to, to.law)
        ? [{ from: from.side, kind: "contained" as const, law, to: to.side }]
        : [],
    ),
  );
};

/**
 * Each statement of `Qti` with its laws, as grizzle's `lawsOf` names them: the one compile of
 * Qti's law model this module runs.
 */
const statementLaws = lawsOf(Qti);

/**
 * The stored statements of `Qti`, each as this module reads it with its laws, none for one it does
 * not read.
 */
const stored = statementLaws.flatMap(({ laws, statement }) =>
  Option.toArray(
    Option.map(Schema.decodeUnknownOption(StoredStatement)(statement), (read) => ({ laws, read })),
  ),
);

/**
 * Every statement of `Qti` this module evaluates.
 */
const evaluated: readonly Evaluated[] = stored.flatMap(({ laws, read }) => evaluatedOf(read, laws));

/**
 * The law of every statement of `Qti` this module evaluates, as grizzle's `lawsOf` names it, so a
 * test can hold it to the laws `Qti` states (`src/test/host-judge.relations.test.ts`).
 */
export const evaluatedLaws: readonly Law[] = evaluated.map(({ law }) => law);

/**
 * Each check's law name, by the check's law.
 */
const checkLaws: ReadonlyMap<Law, LawName> = new Map(
  evaluated.flatMap((statement) =>
    statement.law.kind === "check"
      ? Option.toArray(
          Option.map(lawOfCheck(statement.law.name), (name) => [statement.law, name] as const),
        )
      : [],
  ),
);

/**
 * Every law a check of `Qti` states whose predicate this module cannot read, so its database
 * verdict the host never knows: the checks `Qti` states, less those {@link evaluated} holds.
 */
const unreadChecks: ReadonlySet<LawName> = new Set(
  Qti.statements.flatMap((statement) =>
    Option.match(Schema.decodeUnknownOption(StoredCheck)(statement), {
      onNone: () => [],
      onSome: ({ desc }) =>
        stored.some(({ read }) => read.kind === "check" && read.desc.name === desc.name)
          ? []
          : Option.toArray(lawOfCheck(desc.name)),
    }),
  ),
);

/**
 * The laws no statement states, as `refusal.ts` writes them out: the primary keys, the patterns and
 * the generated fields, each with its name.
 */
const writtenLaws = statedLaws().filter(
  ([law]) => law.kind === "generated" || law.kind === "pattern" || law.kind === "primaryKey",
);

/**
 * Each law the schema states that is no check, with its name: every law of a statement of `Qti`,
 * as {@link statementLaws} names it, and every law of {@link writtenLaws}.
 */
const namedLaws: readonly (readonly [Law, LawName])[] = [
  ...statementLaws.flatMap(({ laws }) =>
    laws.flatMap((law) =>
      law.kind === "check"
        ? []
        : Option.toArray(Option.map(lawNameOf(law), (name) => [law, name] as const)),
    ),
  ),
  ...writtenLaws,
];

/**
 * Write a law as a broken law's witness shows it: a check by its name and its relation, a
 * containment or a fold as `key-copies.ts`'s `identityOf` writes it, its selections left out, any
 * other law as grizzle reports it. The witness only shows the law: the genetic search keys a class
 * by the law itself (`judge.ts` `signatureOf`).
 *
 * @param law - The law.
 * @returns Its text.
 */
const shownOf = (law: Law): string => {
  if (law.kind === "check") {
    return `check ${law.name} on ${law.relation}`;
  }

  return law.kind === "contained" || law.kind === "fold" ? identityOf(law) : Formatter.format(law);
};

/**
 * Each law's name, by the law: every law of {@link namedLaws}.
 */
const namesOf: ReadonlyMap<Law, LawName> = new Map(namedLaws);

/**
 * Each law the schema states that is no check, by name, with the laws of its statements.
 */
const lawsNamed: ReadonlyMap<LawName, readonly Law[]> = new Map(
  [...new Set(namedLaws.map(([, name]) => name))].map((name) => [
    name,
    namedLaws.flatMap(([law, held]) => (held === name ? [law] : [])),
  ]),
);

/**
 * The schema of a relation of `Qti` as the host reads it: its fields' SQL types and a text field's
 * patterns, a conjunction in declared order (grizzle's `RegexText`, `text/field.ts` at `3cc8fbd`),
 * and for a closed relation its facts.
 */
const StoredRelation = Schema.Struct({
  fields: Schema.Record(
    Schema.String,
    Schema.Struct({
      patterns: Schema.optionalKey(
        Schema.NonEmptyArray(
          Schema.Struct({ flags: Schema.Literals(["su", "u"]), source: Schema.String }),
        ),
      ),
      sql: Schema.optionalKey(Schema.String),
    }),
  ),
  key: Schema.optionalKey(Schema.Array(Schema.String)),
  kind: Schema.String,
  name: Schema.String,
  rows: Schema.optionalKey(Schema.Array(StoredSchema)),
});

/**
 * Each relation of `Qti`, by name.
 */
const relations: ReadonlyMap<string, typeof StoredRelation.Type> = new Map(
  Object.values(Qti.relations).flatMap((member) =>
    Option.toArray(
      Option.map(
        Schema.decodeUnknownOption(StoredRelation)(member),
        (read) => [read.name, read] as const,
      ),
    ),
  ),
);

/**
 * The relations the program nests below a row of another that {@link viewOf} does not flatten:
 * their rows exist, so a law over one is unknown, never vacuous.
 */
const unflattened: ReadonlySet<string> = new Set([
  "AttributeEntity",
  "Entry",
  "HeaderToken",
  "Idref",
  "OpenAttributeName",
  "ReferenceSegment",
  "TextIdref",
  "ToleranceToken",
]);

/**
 * A pattern law: its field's relation and name, and its source and flags.
 */
type PatternLaw = Extract<Law, { readonly kind: "pattern" }>;

/**
 * The pattern laws of {@link writtenLaws}.
 */
const patternLaws: readonly PatternLaw[] = writtenLaws.flatMap(([law]) =>
  law.kind === "pattern" ? [law] : [],
);

/**
 * Each pattern law's field, as `[relation, field]`: the field of a stored relation whose own
 * pattern law, grizzle's one per field, `sameLaw` holds to be the law. A law of a field the host
 * reads no pattern of here (a generated or accumulated one, whose descriptor carries its type's) is
 * left out, so its verdict is unknown.
 */
const patternFields: ReadonlyMap<PatternLaw, readonly (readonly [string, string])[]> = (() => {
  const byLaw = new Map<PatternLaw, (readonly [string, string])[]>();
  for (const [name, { fields, kind }] of relations) {
    for (const [field, { patterns }] of Object.entries(fields)) {
      const law =
        kind === "relation" && patterns !== undefined
          ? patternLaws.find((stated) =>
              sameLaw(stated, { field, kind: "pattern", patterns, relation: name }),
            )
          : undefined;
      if (law !== undefined) {
        byLaw.set(law, [...(byLaw.get(law) ?? []), [name, field] as const]);
      }
    }
  }

  return byLaw;
})();

/**
 * Each `keyText` field the import writes, by `Relation.field`, with its pattern law: the law the
 * database refuses a text past the bound by. An accumulated or generated `keyText` field, which
 * the database computes and the import never writes, has no pattern law here.
 */
const boundFields: ReadonlyMap<string, PatternLaw> = new Map(
  [...patternFields].flatMap(([law, fields]) =>
    fields.flatMap(([relation, field]) =>
      keyTextFields.has(`${relation}.${field}`) ? [[`${relation}.${field}`, law] as const] : [],
    ),
  ),
);

/**
 * Each generated field's law, with its relation.
 */
const generatedRelations: ReadonlyMap<Law, string> = new Map(
  writtenLaws.flatMap(([law]) => (law.kind === "generated" ? [[law, law.relation] as const] : [])),
);

/**
 * Judge a pattern law over a program's rows: every row of its field's relation holds a value each
 * of its patterns matches, a conjunction's every member (grizzle's `str.and`, whose domain tests
 * each). A relation the program writes no row of holds it.
 *
 * @param view - The rows.
 * @param law - The pattern law.
 * @param fields - Its field, as `[relation, field]`.
 * @returns Its verdict.
 */
const patternVerdictOf = (
  view: View,
  law: PatternLaw,
  fields: readonly (readonly [string, string])[],
): Verdict => {
  const patterns = law.patterns.map(({ flags, source }) => new RegExp(source, flags));
  let unknown = false;
  for (const [relation, field] of fields) {
    const rows = view.get(relation);
    if (rows === undefined) {
      unknown ||= unflattened.has(relation);
      continue;
    }

    for (const row of rows) {
      const value = row[field];
      if (!Predicate.isString(value)) {
        unknown = true;
      } else if (!patterns.every((pattern) => pattern.test(value))) {
        return {
          kind: "broken",
          witness: `${relation}.${field} = ${JSON.stringify(value.slice(0, 80))}`,
        };
      }
    }
  }

  return unknown ? { kind: "unknown" } : { kind: "held" };
};

/**
 * Judge a generated field's law over a program's rows. The database computes the field from its
 * row's texts, a cast or a closed read, and refuses the row where the result is NULL. Held where
 * the program writes no row of its relation; held where every pattern of the same law over the
 * relation's fields holds, since a text its pattern admits is one the cast reads
 * (`StatisticDate.date` from the calendar-aware xs:date pattern of the value domain, 2ad9a385's
 * `lexical(date)`); unknown otherwise.
 *
 * @param view - The rows.
 * @param law - The generated field's law.
 * @param relation - The field's relation.
 * @param patterns - Each pattern law's verdict over the rows.
 * @returns Its verdict.
 */
const generatedVerdictOf = (
  view: View,
  law: Law,
  relation: string,
  patterns: ReadonlyMap<Law, Verdict>,
): Verdict => {
  const rows = view.get(relation);
  if (rows === undefined ? !unflattened.has(relation) : rows.length === 0) {
    return { kind: "held" };
  }

  const name = namesOf.get(law);
  const own = [...patternFields].filter(
    ([pattern, fields]) =>
      namesOf.get(pattern) === name && fields.some(([held]) => held === relation),
  );

  return own.length > 0 && own.every(([pattern]) => patterns.get(pattern)?.kind === "held")
    ? { kind: "held" }
    : { kind: "unknown" };
};

/**
 * Each stored relation's uuid fields, by relation: the fields the rows are held to the program's
 * mint by.
 */
export const uuidFields: ReadonlyMap<string, readonly string[]> = new Map(
  [...relations].map(([name, { fields }]) => [
    name,
    Object.entries(fields).flatMap(([field, { sql }]) => (sql === "uuid" ? [field] : [])),
  ]),
);

/**
 * Whether a field is a nested family of rows.
 *
 * @param field - The field.
 * @returns Whether it is an array of rows.
 */
const isFamily = (field: Field | undefined): field is readonly Stored[] => Array.isArray(field);

/**
 * Read a row's own fields, its nested families left out.
 *
 * @param row - The row as the program builds it.
 * @returns Its own fields.
 */
const ownFields = (row: Stored): Row =>
  Object.fromEntries(
    Object.entries(row).flatMap(([name, field]) =>
      isFamily(field) ? [] : [[name, field] as const],
    ),
  );

/**
 * Order two texts by their UTF-16 code units, as a set's members are written.
 *
 * @param left - One text.
 * @param right - The other.
 * @returns Negative, zero or positive as `left` sorts before, with or after `right`.
 */
const byCodeUnit = (left: string, right: string): number => {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
};

/**
 * Write a value as the text a key or a tuple compares: a text as itself, a number, a natural or a
 * flag as it prints, a set as its members sorted.
 *
 * @param value - The value.
 * @returns Its text, undefined for no value.
 */
const textOf = (value: Field | undefined): string | undefined => {
  if (value === undefined || isFamily(value)) {
    return undefined;
  }

  if (Predicate.isString(value)) {
    return value;
  }

  return Predicate.isNumber(value) || Predicate.isBigInt(value) || Predicate.isBoolean(value)
    ? String(value)
    : [...value].toSorted(byCodeUnit).join(" ");
};

/**
 * A value a predicate computes: a text (a number or a natural as it prints), a flag, a set of
 * handles, or SQL's NULL, which a closed read at a key its relation holds no tuple at gives. A term
 * this module cannot evaluate gives no value at all (`undefined`), never NULL: a CHECK that reads
 * NULL passes, and one this module cannot read is unknown.
 */
type Datum = boolean | ReadonlySet<string> | string | null;

/**
 * Read a row's field, or a literal, as a {@link Datum}.
 *
 * @param value - The value.
 * @returns The datum, undefined for no value.
 */
const datumOf = (value: Field | undefined): Datum | undefined => {
  if (value === undefined || isFamily(value)) {
    return undefined;
  }

  if (Predicate.isString(value) || Predicate.isBoolean(value)) {
    return value;
  }

  return Predicate.isNumber(value) || Predicate.isBigInt(value)
    ? String(value)
    : new Set([...value].map(String));
};

/**
 * Write a datum as the text a key or a tuple compares.
 *
 * @param datum - The datum.
 * @returns Its text.
 */
const datumText = (datum: Datum): string => {
  if (datum === null) {
    return "";
  }

  if (Predicate.isString(datum)) {
    return datum;
  }

  return Predicate.isBoolean(datum) ? String(datum) : [...datum].toSorted(byCodeUnit).join(" ");
};

/**
 * The order comparisons a `compare` term makes, by operator, over the sign of the comparison.
 */
const orderTests: ReadonlyMap<string, (order: number) => boolean> = new Map([
  ["ge", (order: number) => order >= 0],
  ["gt", (order: number) => order > 0],
  ["le", (order: number) => order <= 0],
  ["lt", (order: number) => order < 0],
]);

/**
 * Compare two values as a `compare` term's operator does: equality by text, order as naturals
 * where both spell one, else as texts.
 *
 * @param op - The operator.
 * @param left - The left value's text.
 * @param right - The right value's text.
 * @returns The comparison, undefined for an operator this module does not read.
 */
const compared = (op: string, left: string, right: string): boolean | undefined => {
  if (op === "eq" || op === "ne") {
    return (left === right) === (op === "eq");
  }

  const naturals = /^-?\d+$/u.test(left) && /^-?\d+$/u.test(right);
  const order = naturals
    ? Math.sign(Number(BigInt(left) - BigInt(right)))
    : Math.sign(left.localeCompare(right));

  return orderTests.get(op)?.(order);
};

/**
 * Each closed relation's facts as the predicates read them: its key fields in order and its
 * rows.
 */
const closedFacts: ReadonlyMap<
  string,
  { readonly key: readonly string[]; readonly rows: readonly Row[] }
> = new Map(
  [...relations].flatMap(([name, relation]) =>
    relation.kind === "closedRelation" && relation.key !== undefined && relation.rows !== undefined
      ? [[name, { key: relation.key, rows: relation.rows.map(ownFields) }] as const]
      : [],
  ),
);

/**
 * Each closed relation's rows by a key prefix of one length, built on first read.
 */
const prefixIndex = new Map<string, ReadonlyMap<string, readonly Row[]>>();

/**
 * Read the rows of a closed relation whose key starts with a prefix.
 *
 * @param relation - The relation's name.
 * @param facts - Its facts.
 * @param facts.key - Its key fields, in order.
 * @param facts.rows - Its rows.
 * @param prefix - The prefix's texts, in key order.
 * @returns The rows, none where no tuple starts with it.
 */
const rowsStarting = (
  relation: string,
  facts: { readonly key: readonly string[]; readonly rows: readonly Row[] },
  prefix: readonly string[],
): readonly Row[] => {
  const label = `${relation}/${String(prefix.length)}`;
  const known = prefixIndex.get(label);
  if (known !== undefined) {
    return known.get(prefix.join("\u001F")) ?? [];
  }

  const built = new Map<string, Row[]>();
  for (const row of facts.rows) {
    const at = facts.key
      .slice(0, prefix.length)
      .map((field) => textOf(row[field]) ?? "")
      .join("\u001F");
    built.set(at, [...(built.get(at) ?? []), row]);
  }

  prefixIndex.set(label, built);

  return built.get(prefix.join("\u001F")) ?? [];
};

/**
 * Read a closed relation as grizzle's closed reads do: `C.at` reads a payload field at a whole
 * key, NULL where the relation holds no tuple there; `C.row` reads the set of the values the key
 * field a prefix leaves open takes among the tuples that start with it, empty where none does.
 *
 * @param relation - The relation's name.
 * @param field - The payload field for `C.at`, undefined for `C.row`.
 * @param args - The key's or the prefix's values, in key order.
 * @returns The read, undefined for a name that is no closed relation.
 */
const closedRead = (
  relation: string,
  field: string | undefined,
  args: readonly string[],
): Datum | undefined => {
  const facts = closedFacts.get(relation);
  if (facts === undefined) {
    return undefined;
  }

  const rows = rowsStarting(relation, facts, args);

  if (field === undefined) {
    return new Set(
      rows.flatMap((row) =>
        Option.toArray(Option.fromUndefinedOr(textOf(row[facts.key[args.length] ?? ""]))),
      ),
    );
  }

  const [first] = rows;

  return first === undefined ? null : (datumOf(first[field]) ?? null);
};

/**
 * Read whether a closed relation holds a tuple at a whole key, as grizzle's `C.has(…)` does.
 *
 * @param relation - The relation's name.
 * @param args - The key's values, in key order.
 * @returns Whether a tuple is there, undefined for a name that is no closed relation.
 */
const closedHeld = (relation: string, args: readonly string[]): Datum | undefined => {
  const facts = closedFacts.get(relation);

  return facts === undefined ? undefined : rowsStarting(relation, facts, args).length > 0;
};

/**
 * Each pattern a `matches` reads, compiled once: grizzle's `str.regex` grammar under `u`.
 */
const compiledPatterns = new Map<string, RegExp>();

/**
 * Test a text against a pattern a `matches` reads.
 *
 * @param text - The text.
 * @param pattern - The pattern.
 * @returns Whether it matches.
 */
const matchesPattern = (text: string, pattern: string): boolean => {
  const compiled = compiledPatterns.get(pattern) ?? new RegExp(pattern, "u");
  compiledPatterns.set(pattern, compiled);

  return compiled.test(text);
};

/**
 * Collapse a text as XML Schema's `collapse` whitespace class does.
 *
 * @param text - The text.
 * @returns It, each run of tabs, line feeds, carriage returns and spaces one space, none at either
 *   end.
 */
const collapse = (text: string): string => text.replaceAll(/[\t\n\r ]+/gu, " ").trim();

/**
 * Translate a text's characters as SQL's `translate` does: each character of `from` becomes the
 * character of `to` at its place, or nothing where `to` is shorter.
 *
 * @param text - The text.
 * @param from - The characters replaced.
 * @param to - Their replacements.
 * @returns The text translated.
 */
const translated = (text: string, from: string, to: string): string =>
  text
    .split("")
    .map((character) => {
      const at = from.indexOf(character);

      return at === -1 ? character : to.charAt(at);
    })
    .join("");

/**
 * The `Compute` functions over texts this module reads, each from its arguments' texts, and
 * `singleton`, the set holding a closed id's one handle, from the handle's text a row holds for the
 * id (grizzle's README, "Tables and types"): AL1's admission, E1 derived's slot and N5's and N7's
 * memberships read `{h} ⊆ S` through it.
 */
const textFunctions: ReadonlyMap<string, (texts: readonly string[]) => Datum | undefined> = new Map<
  string,
  (texts: readonly string[]) => Datum | undefined
>([
  ["collapse", ([text]) => (text === undefined ? undefined : collapse(text))],
  ["concat", (texts) => texts.join("")],
  [
    "endsWith",
    ([text, suffix]) =>
      text === undefined || suffix === undefined ? undefined : text.endsWith(suffix),
  ],
  [
    "matches",
    ([text, pattern]) =>
      text === undefined || pattern === undefined ? undefined : matchesPattern(text, pattern),
  ],
  ["singleton", ([id]) => (id === undefined ? undefined : new Set([id]))],
  [
    "startsWith",
    ([text, prefix]) =>
      text === undefined || prefix === undefined ? undefined : text.startsWith(prefix),
  ],
  [
    "translate",
    ([text, from, to]) =>
      text === undefined || from === undefined || to === undefined
        ? undefined
        : translated(text, from, to),
  ],
]);

/**
 * The `Compute` functions over sets this module reads, each from its arguments' sets.
 */
const setFunctions: ReadonlyMap<
  string,
  (left: ReadonlySet<string>, right: ReadonlySet<string> | undefined) => Datum | undefined
> = new Map<
  string,
  (left: ReadonlySet<string>, right: ReadonlySet<string> | undefined) => Datum | undefined
>([
  ["cardinality", (left) => String(left.size)],
  [
    "difference",
    (left, right) =>
      right === undefined ? undefined : new Set([...left].filter((member) => !right.has(member))),
  ],
  [
    "disjoint",
    (left, right) =>
      right === undefined ? undefined : [...left].every((member) => !right.has(member)),
  ],
  [
    "subset",
    (left, right) =>
      right === undefined ? undefined : [...left].every((member) => right.has(member)),
  ],
  ["union", (left, right) => (right === undefined ? undefined : new Set([...left, ...right]))],
]);

/**
 * Apply a `Compute` function to its arguments' values.
 *
 * @param fn - The function.
 * @param args - Its arguments' values, none of them unknown.
 * @returns Its value; NULL where an argument is NULL; undefined for a function, or arguments, this
 *   module does not read.
 */
const computed = (fn: string, args: readonly Datum[]): Datum | undefined => {
  if (args.includes(null)) {
    return null;
  }

  const texts = args.filter(Predicate.isString);
  if (texts.length === args.length) {
    return textFunctions.get(fn)?.(texts);
  }

  const sets = args.filter((arg): arg is ReadonlySet<string> => arg instanceof Set);
  const [left, right] = sets;

  return sets.length === args.length && left !== undefined
    ? setFunctions.get(fn)?.(left, right)
    : undefined;
};

/**
 * Combine the values of an `and` or an `or` in Kleene's logic, NULL and an unknown value both
 * unknown to it: a decisive operand decides; else any value this module cannot give leaves it
 * unknown; else a NULL leaves it NULL.
 *
 * @param values - The operands' values.
 * @param decisive - `false` for an `and`, `true` for an `or`.
 * @returns The value.
 */
const kleene = (values: readonly (Datum | undefined)[], decisive: boolean): Datum | undefined => {
  if (values.includes(decisive)) {
    return decisive;
  }

  if (values.includes(undefined)) {
    return undefined;
  }

  return values.includes(null) ? null : !decisive;
};

/**
 * The value of a term this module cannot evaluate.
 */
const unknownValue: Datum | undefined = undefined;

/**
 * Evaluates a term over a row: its value, NULL as SQL gives it, undefined where the term reads what
 * the row or this module cannot give.
 */
type Evaluate = (term: Term, row: Row) => Datum | undefined;

/**
 * Evaluate the operands of a term, the first unknown one or NULL deciding for them all.
 *
 * @param terms - The operands.
 * @param row - The row.
 * @param ev - Evaluates one operand.
 * @returns Their values; NULL where one is NULL; undefined where one cannot be evaluated.
 */
const operandValues = (
  terms: readonly Term[],
  row: Row,
  ev: Evaluate,
): readonly Datum[] | null | undefined => {
  const values = terms.map((term) => ev(term, row));
  if (values.includes(undefined)) {
    return undefined;
  }

  return values.includes(null)
    ? null
    : values.flatMap((value) => (value === undefined ? [] : [value]));
};

/**
 * Evaluate a negation.
 *
 * @param value - Its operand's value.
 * @returns The negation, NULL for NULL, undefined for no value.
 */
const negated = (value: Datum | undefined): Datum | undefined => {
  if (Predicate.isBoolean(value)) {
    return !value;
  }

  return value === null ? null : undefined;
};

/**
 * Evaluate a comparison.
 *
 * @param term - The comparison.
 * @param row - The row.
 * @param ev - Evaluates an operand.
 * @returns Its value, NULL where an operand is NULL.
 */
const comparison = (
  term: Extract<Term, { readonly kind: "compare" }>,
  row: Row,
  ev: Evaluate,
): Datum | undefined => {
  const values = operandValues([term.left, term.right], row, ev);
  if (values === undefined || values === null) {
    return values;
  }

  const [left, right] = values;

  return left === undefined || right === undefined
    ? undefined
    : compared(term.op, datumText(left), datumText(right));
};

/**
 * Evaluate a closed read.
 *
 * @param term - The read.
 * @param row - The row.
 * @param ev - Evaluates a key value.
 * @returns Its value, NULL where a key value is NULL or the relation holds no tuple there.
 */
const closedValue = (
  term: Extract<Term, { readonly kind: "closedAt" | "closedRow" }>,
  row: Row,
  ev: Evaluate,
): Datum | undefined => {
  const values = operandValues(term.args, row, ev);
  if (values === undefined || values === null) {
    return values;
  }

  return closedRead(
    term.relation,
    term.kind === "closedAt" ? term.field : undefined,
    values.map(datumText),
  );
};

/**
 * Evaluate a term over a row.
 *
 * @param term - The term.
 * @param row - The row.
 * @returns Its value; NULL as SQL gives it; undefined where the term reads what the row or this
 *   module cannot give.
 */
const evaluate: Evaluate = (term, row) => {
  switch (term.kind) {
    case "field": {
      return datumOf(row[term.field]);
    }
    case "literal": {
      return datumOf(term.value);
    }
    case "not": {
      return negated(evaluate(term.arg, row));
    }
    case "and":
    case "or": {
      return kleene(
        term.args.map((arg) => evaluate(arg, row)),
        term.kind === "or",
      );
    }
    case "in": {
      const value = evaluate(term.arg, row);

      return value === undefined || value === null ? value : term.values.includes(datumText(value));
    }
    case "compare": {
      return comparison(term, row, evaluate);
    }
    case "closedAt":
    case "closedRow": {
      return closedValue(term, row, evaluate);
    }
    case "closedHas": {
      const values = operandValues(term.args, row, evaluate);

      return values === undefined || values === null
        ? values
        : closedHeld(term.relation, values.map(datumText));
    }
    case "compute": {
      const values = operandValues(term.args, row, evaluate);

      return values === undefined || values === null ? values : computed(term.fn, values);
    }
    case "unread": {
      return unknownValue;
    }
    default: {
      return term satisfies never;
    }
  }
};

/**
 * The verdict of one statement over a program's rows.
 */
type Verdict =
  | { readonly kind: "broken"; readonly witness: string }
  | { readonly kind: "held" }
  | { readonly kind: "unknown" };

/**
 * Read a side's selected rows and their tuples.
 *
 * @param view - The rows.
 * @param side - The side.
 * @returns Each selected row's tuple text, or none where the side cannot be evaluated: its relation
 *   is no relation the program writes, a row lacks a field it reads, or its predicate reads what
 *   this module does not.
 */
const tuplesOf = (view: View, side: Side): Option.Option<readonly string[]> => {
  const closed = relations.get(side.relation);
  const rows: readonly Row[] | undefined =
    closed?.kind === "closedRelation" ? closed.rows?.map(ownFields) : view.get(side.relation);
  const terms = side.terms.flatMap((term) => (term === undefined ? [] : [term]));
  if (rows === undefined || terms.length !== side.terms.length) {
    return Option.none();
  }

  const tuples: string[] = [];
  for (const row of rows) {
    const selected = Option.match(side.predicate, {
      onNone: () => true,
      onSome: (term) => evaluate(term, row),
    });
    if (selected === undefined) {
      return Option.none();
    }

    if (selected === true) {
      const values = terms.map((term) => textOf(row[term.field]));
      if (values.includes(undefined)) {
        return Option.none();
      }

      tuples.push(values.join("\u001F"));
    }
  }

  return Option.some(tuples);
};

/**
 * Judge one key over a program's rows.
 *
 * @param tuples - The selected rows' key tuples.
 * @returns Its verdict, with the tuple two rows share.
 */
const keyVerdictOf = (tuples: readonly string[]): Verdict => {
  const seen = new Set<string>();
  const repeated = tuples.find((tuple) => {
    const again = seen.has(tuple);
    seen.add(tuple);

    return again;
  });

  return repeated === undefined
    ? { kind: "held" }
    : { kind: "broken", witness: repeated.replaceAll("\u001F", ", ") };
};

/**
 * Judge one statement over a program's rows.
 *
 * @param view - The rows.
 * @param statement - The statement.
 * @returns Its verdict, with the tuple that breaks it.
 */
const verdictOf = (view: View, statement: Evaluated): Verdict => {
  if (statement.kind === "check") {
    const rows = view.get(statement.relation);
    if (rows === undefined) {
      return { kind: "unknown" };
    }

    const values = rows.map((row) => evaluate(statement.predicate, row));
    const at = values.indexOf(false);
    if (at !== -1) {
      return { kind: "broken", witness: `row ${String(at)} of ${statement.relation}` };
    }

    return values.includes(undefined) ? { kind: "unknown" } : { kind: "held" };
  }

  if (statement.kind === "key") {
    return Option.match(tuplesOf(view, statement.side), {
      onNone: (): Verdict => ({ kind: "unknown" }),
      onSome: keyVerdictOf,
    });
  }

  const from = tuplesOf(view, statement.from);
  const to = tuplesOf(view, statement.to);
  if (Option.isNone(from) || Option.isNone(to)) {
    return { kind: "unknown" };
  }

  const held = new Set(to.value);
  const missing = from.value.find((tuple) => !held.has(tuple));

  return missing === undefined
    ? { kind: "held" }
    : { kind: "broken", witness: missing.replaceAll("\u001F", ", ") };
};

/**
 * Read one of a row's nested families.
 *
 * @param row - The row as the program builds it.
 * @param name - The family's field.
 * @returns Its rows, none where the row holds no such family.
 */
const familyOf = (row: Stored, name: string): readonly Stored[] => {
  const field = row[name];

  return isFamily(field) ? field : [];
};

/**
 * The fields an attribute's row copies from its owner element (fin.md §16, "AL1 owner": the
 * attribute family's owner copy), which the database fills from the owner's row and the program
 * leaves to it.
 */
const ownerFields = ["document", "documentType", "governor", "kind", "version"] as const;

/**
 * Read the fields an attribute copies from its owner's row.
 *
 * @param owner - The owner node's row.
 * @returns The copied fields it holds.
 */
const ownerCopies = (owner: Row): Row =>
  Object.fromEntries(
    ownerFields.flatMap((field) => {
      const value = owner[field];

      return value === undefined ? [] : [[field, value] as const];
    }),
  );

/**
 * Flatten a document's tree into the rows of `Node`, `Attribute` and `Namespace`, each node with
 * the `document` of its tree and the `parent` and `node` its nesting supplies, and each attribute
 * with its owner's copied fields where the program leaves them to the database.
 *
 * @param root - The document node's row.
 * @param add - Adds a row to a relation.
 */
const flattenTree = (root: Stored, add: (relation: string, row: Row) => void): void => {
  const document = textOf(root["document"]) ?? "";
  const stack: { readonly node: Stored; readonly parent: string | undefined }[] = [
    { node: root, parent: undefined },
  ];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const { node, parent } = next;
    const id = textOf(node["id"]) ?? "";
    const own = { ...ownFields(node), document };
    add("Node", parent === undefined ? own : { ...own, parent });
    for (const attribute of familyOf(node, "attributes")) {
      add("Attribute", { ...ownerCopies(own), ...ownFields(attribute), node: id });
    }

    for (const namespace of familyOf(node, "namespaces")) {
      add("Namespace", { ...ownFields(namespace), node: id });
    }

    for (const child of familyOf(node, "children")) {
      stack.push({ node: child, parent: id });
    }
  }
};

/**
 * Read a program's inputs as rows by relation: each flat keyed set as its rows, and each tree as
 * the rows of its nodes, attributes and namespace declarations, with the `document`, `parent` and
 * `node` its nesting supplies. A relation the program nests deeper than that, or whose rows hold a
 * value of no {@link Value} type, is left out, so a statement over it is unknown.
 *
 * @param inputs - The program's inputs.
 * @returns The rows.
 */
export const viewOf = (inputs: PackageInputs): View => {
  const view = new Map<string, Row[]>();
  const add = (relation: string, row: Row): void => {
    view.set(relation, [...(view.get(relation) ?? []), row]);
  };
  const written = Option.getOrElse(Schema.decodeUnknownOption(InputsSchema)(inputs), () => ({}));
  for (const [relation, held] of Object.entries(written)) {
    const rows = Schema.decodeUnknownOption(RowsSchema)(held);
    if (Option.isSome(rows)) {
      const read = [...rows.value.values()];
      view.set(relation, view.get(relation) ?? []);
      if (relation === "Node") {
        view.set("Attribute", view.get("Attribute") ?? []);
        view.set("Namespace", view.get("Namespace") ?? []);
        for (const root of read) {
          flattenTree(root, add);
        }
      } else if (relation === "Instance") {
        const stack = [...read];
        for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
          add("Instance", ownFields(next));
          stack.push(...familyOf(next, "children"));
        }
      } else {
        for (const row of read) {
          add(relation, ownFields(row));
        }
      }
    }
  }

  // A declaration's counts of base types and cardinalities are drawn, so the program writes no
  // field of them: each is the number of its `DeclarationBaseType` or `DeclarationCardinality`
  // rows, as the database draws it, so a containment over `declarationRef` reads the tuple
  // PostgreSQL holds (lane NIL's audit, B12; spec reading 158).
  const typedNodes = (relation: string) =>
    new Set<Value | undefined>((view.get(relation) ?? []).map(({ node }) => node));
  const baseTyped = typedNodes("DeclarationBaseType");
  const cardinal = typedNodes("DeclarationCardinality");
  view.set(
    "Declaration",
    (view.get("Declaration") ?? []).map((row) => ({
      ...row,
      baseTypes: baseTyped.has(row["node"]) ? 1n : 0n,
      cardinalities: cardinal.has(row["node"]) ? 1n : 0n,
    })),
  );

  return view;
};

/**
 * The first law of a name the rows break: the law, as an `invariant-rejected` outcome names it,
 * and the witness, the law as {@link shownOf} writes it and the tuple that breaks it.
 */
export interface Broken {
  readonly law: Law;
  readonly witness: string;
}

/**
 * A uuid the rows name that the program did not mint: the field that holds it, and the uuid.
 */
export interface Dangling {
  readonly field: string;
  readonly relation: string;
  readonly value: string;
}

/**
 * Every law {@link hostVerdictOf} can find broken: each law of {@link evaluatedLaws}, each field's
 * pattern law and each generated field's law, that has a name. A law outside it the host never
 * finds broken.
 */
export const judgedLaws: readonly Law[] = [
  ...new Set([...evaluatedLaws, ...patternFields.keys(), ...generatedRelations.keys()]),
].filter((law) => namesOf.has(law) || checkLaws.has(law));

/**
 * What the host judges of a program's rows:
 *
 * - `broken`, each law name some statement of which the rows break, with the first law of it they
 *   break and its witness, and `brokenLaws`, every statement they break as its law;
 * - `held`, each law every statement and check of which was evaluated and held, so its database
 *   verdict is known;
 * - `overLong`, each `keyText` field the import writes, as `Relation.field`, that holds a text past
 *   the bound, with its pattern law;
 * - `dangling`, each uuid a row names that the program did not mint;
 * - `written`, each relation the program writes as rows, none of them perhaps.
 */
export interface HostVerdict {
  readonly broken: ReadonlyMap<LawName, Broken>;
  /**
   * Each statement the rows break, as an `invariant-rejected` outcome would name its law, a key
   * text past its bound as its field type's pattern law: what `ruleOfLaws` names the refusal by.
   */
  readonly brokenLaws: readonly Law[];
  readonly dangling: readonly Dangling[];
  readonly held: ReadonlySet<LawName>;
  readonly overLong: ReadonlyMap<string, PatternLaw>;
  readonly written: ReadonlySet<string>;
}

/**
 * Judge a program's rows on the host.
 *
 * @param inputs - The program's inputs.
 * @param minted - Every id the program drew.
 * @returns The verdict.
 */
export const hostVerdictOf = (inputs: PackageInputs, minted: ReadonlySet<string>): HostVerdict => {
  const view = viewOf(inputs);
  const patterns = new Map<Law, Verdict>(
    [...patternFields].map(([law, fields]) => [law, patternVerdictOf(view, law, fields)] as const),
  );
  const verdicts = new Map<Law, Verdict>([
    ...evaluated.map((statement) => [statement.law, verdictOf(view, statement)] as const),
    ...patterns,
    ...[...generatedRelations].map(
      ([law, relation]) => [law, generatedVerdictOf(view, law, relation, patterns)] as const,
    ),
  ]);
  const broken = new Map<LawName, Broken>();
  for (const [law, verdict] of verdicts) {
    const name = namesOf.get(law) ?? checkLaws.get(law);
    if (verdict.kind === "broken" && name !== undefined && !broken.has(name)) {
      broken.set(name, { law, witness: `${shownOf(law)}: ${verdict.witness}` });
    }
  }

  const checksOf = new Map<LawName, Law[]>();
  for (const [law, name] of checkLaws) {
    checksOf.set(name, [...(checksOf.get(name) ?? []), law]);
  }

  const held = new Set(
    [...new Set([...lawsNamed.keys(), ...checksOf.keys()])].filter(
      (name) =>
        !unreadChecks.has(name) &&
        !broken.has(name) &&
        [...(lawsNamed.get(name) ?? []), ...(checksOf.get(name) ?? [])].every(
          (law) => verdicts.get(law)?.kind === "held",
        ),
    ),
  );
  const overLong = new Map<string, PatternLaw>();
  const dangling = new Map<string, Dangling>();
  for (const [relation, rows] of view) {
    const uuids = uuidFields.get(relation) ?? [];
    for (const row of rows) {
      for (const [field, value] of Object.entries(row)) {
        const bound = boundFields.get(`${relation}.${field}`);
        if (bound !== undefined && Predicate.isString(value) && utf8Length(value) > keyTextBytes) {
          overLong.set(`${relation}.${field}`, bound);
        }
      }

      for (const field of uuids) {
        const value = row[field];
        if (Predicate.isString(value) && !minted.has(value)) {
          dangling.set(`${relation}.${field} = ${value}`, { field, relation, value });
        }
      }
    }
  }

  const brokenLaws = [
    ...new Set([
      ...[...verdicts].flatMap(([law, verdict]) => (verdict.kind === "broken" ? [law] : [])),
      ...overLong.values(),
    ]),
  ];

  return {
    broken,
    brokenLaws,
    dangling: [...dangling.values()],
    held,
    overLong,
    written: new Set(view.keys()),
  };
};
