/**
 * Grizzle's predicate language and statement sides as the host reads them, from the values grizzle
 * keeps on a schema's statements, and a predicate evaluated over a row in SQL's three-valued logic.
 *
 * It states no law and reads no schema: a caller hands it the statements it reads and the schema's
 * members whose closed relations a predicate's closed reads look up ({@link closedOf}). Three
 * callers share it: the law oracle's key copies (`#pantry/test/key-copies.ts`), which read the
 * composed schema's copies into a key text; the tests' host judge (`#pantry/test/host-judge.ts`),
 * which judges the import's own rows by the schema's laws; and the order tests
 * (`qti/double-order.oracle.test.ts`, `qti/decimal-order.oracle.test.ts`), which judge the checks
 * that order two lexical forms whole ({@link breaks}). No production module reads it. The law
 * oracle may read this module because it reads no statement of its own;
 * `src/grammar/purity.test.ts` holds it to that, so it imports nothing of grizzle's but types.
 *
 * - **Values.** A row is its fields' values, each a {@link Datum}: a text, a natural, a float, an
 *   exact numeric, a truth value or a set of a roster's handles.
 * - **Terms.** A stored predicate reads into a {@link Term} ({@link termOf}): fields, literals,
 *   comparisons, `in`, `and`, `or`, `not`, a closed relation's three reads, a `Compute.when` over a
 *   `Compute.matches` guard, a cast of a text into a double or a numeric, and the `Compute`
 *   functions of {@link computers}; any other term is `unread`.
 * - **Evaluation.** {@link evaluate} is SQL's three-valued logic: an absent field, a closed read at a
 *   key its relation holds no tuple at and an unread term are unknown; `and`, `or` and `not` are
 *   Kleene's.
 * - **Sides.** A stored side ({@link SideSchema}) gives its relation and selection ({@link sourceOf})
 *   and its terms, each a field or `pred` of one, written as an outcome names a law's side
 *   ({@link lawSideOf}).
 */
import type { AnySchema, LawSide, Statement } from "@bjornpagen/grizzle";
import { Array as Arr, Option, pipe, Predicate, Schema } from "effect";

/**
 * An exact numeric as PostgreSQL's `numeric` orders it: a finite decimal, its digits signed over
 * ten to its scale, an infinity of a sign, or NaN, which `numeric` holds equal to itself and above
 * every other value.
 */
export type Numeric =
  | { readonly digits: bigint; readonly kind: "finite"; readonly scale: number }
  | { readonly kind: "infinite"; readonly negative: boolean }
  | { readonly kind: "nan" };

/**
 * One value a predicate reads: a text, a natural, a float, an exact numeric, a boolean, or a set
 * of a roster's handles. A float has grizzle's one zero: `float8` stores -0 as 0 (`codec/scalar.ts`
 * and `scalar/values/convert.ts` of grizzle-engine at the vendored commit), so {@link floatDatum}
 * normalizes it.
 */
export type Datum = bigint | boolean | number | Numeric | ReadonlySet<string> | string;

/**
 * Read a float as the datum a `float8` column holds: -0 as 0, grizzle's one zero, every other
 * number as it is.
 *
 * @param value - The float.
 * @returns The datum.
 */
export const floatDatum = (value: number): number => (Object.is(value, -0) ? 0 : value);

/**
 * The schema of a {@link Datum}, which reads a closed relation's facts and a literal's value.
 */
const DatumSchema = Schema.Union([
  Schema.String,
  Schema.BigInt,
  Schema.Number,
  Schema.Boolean,
  Schema.ReadonlySet(Schema.String),
]);

/**
 * A row's fields as a predicate reads them, by name.
 */
export type Row = Readonly<Record<string, Datum>>;

/**
 * A term of a predicate, the part of grizzle's predicate language a selection, a check or a
 * generated field reads. Any other term is `unread`: a selection that holds one cannot be
 * evaluated, and a check reads it as unknown.
 */
export type Term =
  | { readonly args: readonly Term[]; readonly fn: string; readonly kind: "compute" }
  | { readonly args: readonly Term[]; readonly kind: "and" | "or" }
  | {
      readonly args: readonly Term[];
      readonly field: Option.Option<string>;
      readonly kind: "closed";
      readonly relation: string;
    }
  | { readonly args: readonly Term[]; readonly kind: "closedHas"; readonly relation: string }
  | { readonly arg: Term; readonly kind: "in"; readonly values: readonly Term[] }
  | { readonly arg: Term; readonly kind: "not" }
  | { readonly arg: Term; readonly kind: "cast"; readonly to: "double" | "numeric" }
  | { readonly field: string; readonly kind: "field" }
  | { readonly kind: "compare"; readonly left: Term; readonly op: string; readonly right: Term }
  | { readonly kind: "literal"; readonly value: Datum }
  | { readonly kind: "unread"; readonly term: string }
  | {
      readonly kind: "when";
      readonly otherwise: Term;
      readonly pattern: string;
      readonly proved: Term;
      readonly subject: Term;
    };

/**
 * A predicate's term as grizzle keeps it, read field by field: every field a term of
 * {@link Term} has, each optional, and a literal's value unread.
 */
interface StoredTerm {
  readonly arg?: StoredTerm;
  readonly args?: readonly StoredTerm[];
  readonly field?: string;
  readonly fn?: string;
  readonly guard?: { readonly kind: string; readonly pattern?: string };
  readonly kind: string;
  readonly left?: StoredTerm;
  readonly op?: string;
  readonly otherwise?: StoredTerm;
  readonly proved?: StoredTerm;
  readonly relation?: string;
  readonly right?: StoredTerm;
  readonly subject?: StoredTerm;
  readonly to?: { readonly kind: string; readonly type?: string };
  readonly value?: unknown;
  readonly values?: readonly unknown[];
}

/**
 * The schema of a {@link StoredTerm}.
 */
export const StoredTermSchema: Schema.Codec<StoredTerm> = Schema.Struct({
  arg: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  args: Schema.optionalKey(
    Schema.Array(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  ),
  field: Schema.optionalKey(Schema.String),
  fn: Schema.optionalKey(Schema.String),
  guard: Schema.optionalKey(
    Schema.Struct({ kind: Schema.String, pattern: Schema.optionalKey(Schema.String) }),
  ),
  kind: Schema.String,
  left: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  op: Schema.optionalKey(Schema.String),
  otherwise: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  proved: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  relation: Schema.optionalKey(Schema.String),
  right: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  subject: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  to: Schema.optionalKey(
    Schema.Struct({ kind: Schema.String, type: Schema.optionalKey(Schema.String) }),
  ),
  value: Schema.optionalKey(Schema.Unknown),
  values: Schema.optionalKey(Schema.Array(Schema.Unknown)),
});

/**
 * A float literal JSON cannot write as a number, as a description holds it: its name.
 */
const FloatNameSchema = Schema.Struct({
  float: Schema.Literals(["Infinity", "-Infinity", "NaN"]),
});

/**
 * A numeric literal as a description holds it: grizzle's `Decimal`, read by the text it writes,
 * PostgreSQL's `numeric_out` (`scalar/values/decimal.ts` of grizzle-engine at the vendored commit).
 * Its parts' kind marks it, so no other literal reads as one. This module imports none of
 * grizzle's values (`src/grammar/purity.test.ts`), so it reads the Decimal by its shape.
 */
const DecimalLiteralSchema = Schema.Struct({
  parts: Schema.Struct({
    kind: Schema.Literals(["-infinity", "finite", "infinity", "nan"]),
  }),
  text: Schema.String,
});

/**
 * A decimal text's parts: its sign, its integer digits and its fraction digits.
 */
const decimalParts = /^(?<sign>[+-]?)(?<whole>[0-9]*)(?:\.(?<fraction>[0-9]*))?$/u;

/**
 * The exact numeric a text names, as `numeric_in` reads every text of grizzle's `decimalText`, and
 * `Infinity`, `-Infinity` and `NaN` by name, as a `Decimal` writes them.
 *
 * @param text - The text.
 * @returns The numeric, none for a text that names none, which a predicate reads as unknown.
 */
export const numericNamed = (text: string): Numeric | undefined => {
  if (text === "NaN") {
    return { kind: "nan" };
  }

  if (text === "Infinity" || text === "-Infinity") {
    return { kind: "infinite", negative: text.startsWith("-") };
  }

  const parts = decimalParts.exec(text)?.groups;
  const [sign, whole, fraction] = [parts?.["sign"], parts?.["whole"], parts?.["fraction"] ?? ""];
  if (sign === undefined || whole === undefined || (whole === "" && fraction === "")) {
    return undefined;
  }

  const magnitude = BigInt(`0${whole}${fraction}`);

  return { digits: sign === "-" ? -magnitude : magnitude, kind: "finite", scale: fraction.length };
};

/**
 * The double a decimal text names, `INF`, `+INF`, `-INF` and `NaN` by name: grizzle's
 * `Compute.parseDouble` over its operand, and PostgreSQL's `float8in` over a text a guard has held
 * to a double's form, each XML Schema 1.1's doubleLexicalMap, which `Number` computes exactly for a
 * decimal of at most 20 significant digits.
 *
 * @param text - The text.
 * @returns The double.
 */
export const doubleNamed = (text: string): number => {
  if (text === "INF" || text === "+INF") {
    return Number.POSITIVE_INFINITY;
  }

  return text === "-INF" ? Number.NEGATIVE_INFINITY : Number(text);
};

/**
 * Whether a datum is an exact numeric.
 *
 * @param datum - The datum.
 * @returns Whether it is one.
 */
const isNumeric = (datum: Datum | undefined): datum is Numeric =>
  Predicate.isObject(datum) && !(datum instanceof Set) && "kind" in datum;

/**
 * Rank an exact numeric's kind in `numeric`'s order: -Infinity, every finite value, +Infinity,
 * NaN.
 *
 * @param value - The numeric.
 * @returns Its rank.
 */
const numericRank = (value: Numeric): number => {
  if (value.kind === "infinite") {
    return value.negative ? -1 : 1;
  }

  return value.kind === "nan" ? 2 : 0;
};

/**
 * Order two exact numerics as PostgreSQL's `numeric` does: two finite ones at their common scale,
 * every other pair by {@link numericRank}.
 *
 * @param left - One numeric.
 * @param right - The other.
 * @returns Negative, zero or positive as `left` sorts before, with or after `right`.
 */
const numericOrder = (left: Numeric, right: Numeric): number => {
  if (left.kind === "finite" && right.kind === "finite") {
    const scale = Math.max(left.scale, right.scale);
    const a = left.digits * 10n ** BigInt(scale - left.scale);
    const b = right.digits * 10n ** BigInt(scale - right.scale);

    return Number(a > b) - Number(a < b);
  }

  return Math.sign(numericRank(left) - numericRank(right));
};

/**
 * The kinds of relation whose rows the host holds, so a side over one is judged here: a stored
 * relation, whose rows the import writes, and a closed relation, whose rows the schema fixes. A
 * derived relation is a query, grizzle's `derived(name, query)`, which stores nothing: a rule over
 * one is a deferred constraint trigger that runs its definition at COMMIT (README, "Rules over
 * queries"), so the database alone judges it. The host reads no definition, since evaluating the
 * queries here would restate what the database states (gap G5), so a statement with a side over a
 * derived relation decodes as none and goes unjudged, its law's verdict unknown on the host.
 */
export const judgedKinds = ["relation", "closedRelation"] as const;

/**
 * Whether the host holds a relation's rows, so a law side over it is judged: a stored or a closed
 * relation of the schema's members ({@link judgedKinds}), never a derived one, and never a name no
 * member bears.
 *
 * @param relations - The schema's `relations`.
 * @param name - The relation's name.
 * @returns Whether the host judges a side over it.
 */
export const isJudged = (relations: AnySchema["relations"], name: string): boolean =>
  Object.hasOwn(relations, name) &&
  Schema.is(Schema.Struct({ kind: Schema.Literals(judgedKinds) }))(relations[name]);

/**
 * A derived relation as a statement's side or check holds it: grizzle's `derived(name, query)`,
 * by its kind.
 */
const DerivedSchema = Schema.Struct({ kind: Schema.Literal("derived") });

/**
 * A side whose source is a derived relation, whole or selected.
 */
const DerivedSideSchema = Schema.Struct({
  source: Schema.Union([DerivedSchema, Schema.Struct({ relation: DerivedSchema })]),
});

/**
 * Whether a statement reads a derived relation, a rule over a query, which the database alone
 * judges ({@link judgedKinds}): a side of a containment or a mirrors, a key's side, or a check's
 * relation. A family, a tree and a fold read tables only (grizzle README, "Rules over queries").
 * A reader of the schema's statements skips such a statement by this, rather than failing on the
 * side {@link SideSchema} does not decode.
 */
export const readsDerived = Schema.is(
  Schema.Union([
    Schema.Struct({ left: DerivedSideSchema }),
    Schema.Struct({ right: DerivedSideSchema }),
    Schema.Struct({ side: DerivedSideSchema }),
    Schema.Struct({ relation: DerivedSchema }),
  ]),
);

/**
 * A side of a statement as grizzle keeps it: a selection with the predicate its desc holds, or a
 * whole relation, stored or closed ({@link judgedKinds}), and its terms, each a field's name or a
 * `pred` one as an object over its field. A side over a derived relation does not decode. Every
 * side reads a field at each term: grizzle `3cc8fbd` removed `constant(v)`, and a target fixes a
 * field beyond its terms by its selection instead (README, "Rules").
 */
export const SideSchema = Schema.Struct({
  source: Schema.Union([
    Schema.Struct({
      desc: Schema.Struct({ predicate: StoredTermSchema }),
      relation: Schema.Struct({ kind: Schema.Literals(judgedKinds), name: Schema.String }),
    }),
    Schema.Struct({ kind: Schema.Literals(judgedKinds), name: Schema.String }),
  ]),
  terms: Schema.NonEmptyArray(
    Schema.Union([Schema.String, Schema.Struct({ field: Schema.String })]),
  ),
});

/**
 * A side as {@link SideSchema} reads it.
 */
export type StoredSide = typeof SideSchema.Type;

/**
 * The statements whose sides and predicates the host reads, as grizzle keeps them: a containment or
 * a mirrors, a fold, and a check with its predicate, each over relations whose rows the host holds
 * ({@link judgedKinds}), so a statement over a derived relation decodes as none.
 */
export const StatementSchema = Schema.Union([
  Schema.Struct({
    kind: Schema.Literals(["contained", "mirrors"]),
    left: SideSchema,
    right: SideSchema,
  }),
  Schema.Struct({
    end: SideSchema,
    family: Schema.Struct({
      slots: Schema.Struct({ count: Schema.String, owner: Schema.Struct({ name: Schema.String }) }),
    }),
    kind: Schema.Literal("fold"),
    monoid: Schema.Struct({ name: Schema.String }),
    step: SideSchema,
  }),
  Schema.Struct({
    desc: Schema.Struct({ name: Schema.String, predicate: StoredTermSchema }),
    kind: Schema.Literal("check"),
    relation: Schema.Struct({ kind: Schema.Literals(judgedKinds), name: Schema.String }),
  }),
]);

/**
 * A statement as {@link StatementSchema} reads it.
 */
export type StoredStatement = typeof StatementSchema.Type;

/**
 * Read a term of a stored predicate into {@link Term}.
 *
 * @param stored - The term as grizzle keeps it.
 * @returns The term; `unread` for a term of any other kind or of a shape its kind does not have.
 */
export const termOf = (stored: StoredTerm): Term => {
  const unread: Term = { kind: "unread", term: stored.kind };
  const {
    arg,
    field,
    fn,
    guard,
    left,
    op,
    otherwise,
    proved,
    relation,
    right,
    subject,
    to,
    values,
  } = stored;
  const readers = new Map<string, () => Term>([
    ["and", () => ({ args: (stored.args ?? []).map(termOf), kind: "and" })],
    [
      "closedAt",
      () =>
        relation === undefined
          ? unread
          : {
              args: (stored.args ?? []).map(termOf),
              field: Option.fromUndefinedOr(field),
              kind: "closed",
              relation,
            },
    ],
    [
      "closedRow",
      () =>
        relation === undefined
          ? unread
          : {
              args: (stored.args ?? []).map(termOf),
              field: Option.none(),
              kind: "closed",
              relation,
            },
    ],
    [
      "closedHas",
      () =>
        relation === undefined
          ? unread
          : { args: (stored.args ?? []).map(termOf), kind: "closedHas", relation },
    ],
    [
      "compare",
      () =>
        op === undefined || left === undefined || right === undefined
          ? unread
          : { kind: "compare", left: termOf(left), op, right: termOf(right) },
    ],
    [
      "compute",
      () =>
        fn === undefined ? unread : { args: (stored.args ?? []).map(termOf), fn, kind: "compute" },
    ],
    [
      "cast",
      () => {
        if (arg === undefined) {
          return unread;
        }

        if (to?.type === "double precision") {
          return { arg: termOf(arg), kind: "cast", to: "double" };
        }

        return to?.kind === "numeric" ? { arg: termOf(arg), kind: "cast", to: "numeric" } : unread;
      },
    ],
    ["field", () => (field === undefined ? unread : { field, kind: "field" })],
    [
      "in",
      () =>
        arg === undefined || values === undefined
          ? unread
          : {
              arg: termOf(arg),
              kind: "in",
              values: values.map((value) =>
                Option.match(Schema.decodeUnknownOption(StoredTermSchema)(value), {
                  onNone: () =>
                    Option.match(Schema.decodeUnknownOption(DatumSchema)(value), {
                      onNone: () => unread,
                      onSome: (datum): Term => ({ kind: "literal", value: datum }),
                    }),
                  onSome: termOf,
                }),
              ),
            },
    ],
    [
      "literal",
      () =>
        pipe(
          Schema.decodeUnknownOption(DatumSchema)(stored.value),
          Option.orElse(() =>
            Option.map(Schema.decodeUnknownOption(FloatNameSchema)(stored.value), ({ float }) =>
              Number(float),
            ),
          ),
          Option.orElse(() =>
            Option.flatMap(
              Schema.decodeUnknownOption(DecimalLiteralSchema)(stored.value),
              ({ text }) => Option.fromUndefinedOr(numericNamed(text)),
            ),
          ),
          Option.match({
            onNone: () => unread,
            onSome: (value): Term => ({ kind: "literal", value }),
          }),
        ),
    ],
    ["not", () => (arg === undefined ? unread : { arg: termOf(arg), kind: "not" })],
    ["or", () => ({ args: (stored.args ?? []).map(termOf), kind: "or" })],
    [
      "when",
      () =>
        guard?.kind !== "matches" ||
        guard.pattern === undefined ||
        subject === undefined ||
        proved === undefined ||
        otherwise === undefined
          ? unread
          : {
              kind: "when",
              otherwise: termOf(otherwise),
              pattern: guard.pattern,
              proved: termOf(proved),
              subject: termOf(subject),
            },
    ],
  ]);

  return readers.get(stored.kind)?.() ?? unread;
};

/**
 * List the terms directly below a term.
 *
 * @param term - The term.
 * @returns Its operands, in order.
 */
const operandsOf = (term: Term): readonly Term[] => {
  switch (term.kind) {
    case "and":
    case "or":
    case "closed":
    case "closedHas":
    case "compute": {
      return term.args;
    }
    case "compare": {
      return [term.left, term.right];
    }
    case "in": {
      return [term.arg, ...term.values];
    }
    case "cast":
    case "not": {
      return [term.arg];
    }
    case "when": {
      return [term.subject, term.proved, term.otherwise];
    }
    case "field":
    case "literal":
    case "unread": {
      return [];
    }
    default: {
      return term satisfies never;
    }
  }
};

/**
 * List a term and every term below it.
 *
 * @param term - The term.
 * @returns It and its subterms, depth first.
 */
export const subtermsOf = (term: Term): readonly Term[] => [
  term,
  ...operandsOf(term).flatMap(subtermsOf),
];

/**
 * A closed relation of a schema as its rows are installed: its key fields in order and its facts,
 * each field a datum.
 */
const ClosedSchema = Schema.Struct({
  key: Schema.Array(Schema.String),
  kind: Schema.Literal("closedRelation"),
  name: Schema.String,
  rows: Schema.Array(Schema.Record(Schema.String, DatumSchema)),
});

/**
 * A closed relation's facts as {@link ClosedSchema} reads them.
 */
type ClosedFacts = typeof ClosedSchema.Type;

/**
 * A schema's closed relations as a predicate's closed reads look them up: each one's facts, by its
 * name.
 */
export interface Closed {
  /**
   * Read a closed relation's facts, each read once.
   *
   * @param relation - The relation's name.
   * @returns Its facts, none for a name that is no closed relation of the schema.
   */
  readonly factsOf: (relation: string) => Option.Option<ClosedFacts>;
}

/**
 * Read a schema's closed relations from its members, each relation's facts decoded on its first
 * read.
 *
 * @param members - The schema's members by name, its `relations`.
 * @returns The closed relations.
 */
export const closedOf = (members: AnySchema["relations"]): Closed => {
  const read = new Map<string, Option.Option<ClosedFacts>>();

  return {
    factsOf: (relation) => {
      const known = read.get(relation);
      if (known !== undefined) {
        return known;
      }

      const facts = Schema.decodeUnknownOption(ClosedSchema)(members[relation]);
      read.set(relation, facts);

      return facts;
    },
  };
};

/**
 * Write an exact numeric as `numeric_out` does: a finite one's digits with its scale's fraction,
 * and each other by name.
 *
 * @param value - The numeric.
 * @returns Its text.
 */
const numericText = (value: Numeric): string => {
  if (value.kind === "nan") {
    return "NaN";
  }

  if (value.kind === "infinite") {
    return value.negative ? "-Infinity" : "Infinity";
  }

  const magnitude = (value.digits < 0n ? -value.digits : value.digits)
    .toString()
    .padStart(value.scale + 1, "0");
  const whole = magnitude.slice(0, magnitude.length - value.scale);
  const fraction = magnitude.slice(magnitude.length - value.scale);

  return `${value.digits < 0n ? "-" : ""}${whole}${fraction === "" ? "" : `.${fraction}`}`;
};

/**
 * Order two texts by their UTF-16 code units.
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
 * Write a datum as a key's text: a text as itself, a natural, a float or a boolean as it prints, an
 * exact numeric as `numeric_out` writes it, a set as its members in code-unit order, since a set
 * has none of its own and two equal sets write one text, and an absent value as nothing.
 *
 * @param datum - The datum.
 * @returns Its text.
 */
export const datumText = (datum: Datum | undefined): string => {
  if (datum === undefined || Predicate.isString(datum)) {
    return datum ?? "";
  }

  if (isNumeric(datum)) {
    return numericText(datum);
  }

  return Predicate.isBigInt(datum) || Predicate.isNumber(datum) || Predicate.isBoolean(datum)
    ? String(datum)
    : [...datum].toSorted(byCodeUnit).join(" ");
};

/**
 * Write the text a closed read's key is indexed by.
 *
 * @param values - The key's values, in key order.
 * @returns The text.
 */
const keyLabelOf = (values: readonly (Datum | undefined)[]): string =>
  values.map(datumText).join("\u001F");

/**
 * Each closed relation's index by a key prefix of each length: the rows each prefix starts, built
 * on first read.
 */
const prefixIndex = new WeakMap<ClosedFacts, Map<number, ReadonlyMap<string, readonly Row[]>>>();

/**
 * Read the rows of a closed relation whose key starts with a prefix.
 *
 * @param facts - The relation's facts.
 * @param prefix - The prefix's values, in key order.
 * @returns The rows, none where no tuple starts with it.
 */
const rowsStarting = (facts: ClosedFacts, prefix: readonly Datum[]): readonly Row[] => {
  const byLength = prefixIndex.get(facts) ?? new Map<number, ReadonlyMap<string, readonly Row[]>>();
  prefixIndex.set(facts, byLength);
  let index = byLength.get(prefix.length);
  if (index === undefined) {
    const built = new Map<string, Row[]>();
    for (const row of facts.rows) {
      const at = keyLabelOf(facts.key.slice(0, prefix.length).map((name) => row[name]));
      const held = built.get(at);
      if (held === undefined) {
        built.set(at, [row]);
      } else {
        held.push(row);
      }
    }

    index = built;
    byLength.set(prefix.length, index);
  }

  return index.get(keyLabelOf(prefix)) ?? [];
};

/**
 * Read a closed relation at a key, as grizzle's two closed reads do: `C.at(field, …)` reads a
 * payload field at a whole key, and no value where the relation holds no tuple there, which a
 * predicate reads as unknown as SQL reads grizzle's NULL; `C.row(…)` reads the set of the values
 * the one key field a prefix leaves open takes among the tuples that start with it, empty where
 * none does.
 *
 * @param closed - The schema's closed relations.
 * @param relation - The relation's name.
 * @param field - The payload field for `C.at`, none for `C.row`.
 * @param args - The key's or the prefix's values, in key order.
 * @returns The read, unknown for a name that is no closed relation.
 */
const closedRead = (
  closed: Closed,
  relation: string,
  field: Option.Option<string>,
  args: readonly Datum[],
): Datum | undefined => {
  const facts = Option.getOrUndefined(closed.factsOf(relation));
  if (facts === undefined) {
    return facts;
  }

  const rows = rowsStarting(facts, args);

  return Option.match(field, {
    onNone: () => new Set(rows.map((row) => datumText(row[facts.key[args.length] ?? ""]))),
    onSome: (payload) => rows[0]?.[payload],
  });
};

/**
 * Read whether a closed relation holds a tuple at a whole key, as grizzle's `C.has(…)` does: true
 * where one does, false where none does.
 *
 * @param closed - The schema's closed relations.
 * @param relation - The relation's name.
 * @param args - The key's values, in key order.
 * @returns Whether it holds one, unknown for a name that is no closed relation.
 */
const closedHeld = (closed: Closed, relation: string, args: readonly Datum[]): Datum | undefined =>
  Option.getOrUndefined(
    Option.map(closed.factsOf(relation), (facts) => rowsStarting(facts, args).length > 0),
  );

/**
 * The patterns `Compute.matches` reads, compiled once each: `str.regex`'s grammar under `u`,
 * anchored by `^` and `$`, as grizzle's agent guide states it.
 */
const compiledPatterns = new Map<string, RegExp>();

/**
 * Test a text against a pattern `Compute.matches` reads.
 *
 * @param text - The text.
 * @param pattern - The pattern.
 * @returns Whether the text matches it.
 */
const matches = (text: string, pattern: string): boolean => {
  let regex = compiledPatterns.get(pattern);
  if (regex === undefined) {
    regex = new RegExp(pattern, "u");
    compiledPatterns.set(pattern, regex);
  }

  return regex.test(text);
};

/**
 * Order two floats as PostgreSQL's `float8` operators do: a total order in which NaN equals NaN and
 * follows every other value, +Infinity included ("PostgreSQL treats NaN values as equal, and
 * greater than all non-NaN values", PostgreSQL's manual, Floating-Point Types), -0 equal to 0.
 *
 * @param left - One float.
 * @param right - The other.
 * @returns Negative, zero or positive as `left` sorts before, with or after `right`.
 */
const floatOrder = (left: number, right: number): number => {
  if (Number.isNaN(left) || Number.isNaN(right)) {
    return Number(Number.isNaN(left)) - Number(Number.isNaN(right));
  }

  if (left < right) {
    return -1;
  }

  return left > right ? 1 : 0;
};

/**
 * Whether two data are equal: texts, naturals and booleans by value, sets by their members.
 *
 * @param left - One datum.
 * @param right - The other.
 * @returns Whether they are equal.
 */
const equal = (left: Datum, right: Datum): boolean => {
  if (Predicate.isNumber(left) && Predicate.isNumber(right)) {
    return floatOrder(left, right) === 0;
  }

  if (isNumeric(left) || isNumeric(right)) {
    return isNumeric(left) && isNumeric(right) && numericOrder(left, right) === 0;
  }

  return left instanceof Set && right instanceof Set
    ? left.size === right.size && [...left].every((member) => right.has(member))
    : left === right;
};

/**
 * Order two data that are both texts or both naturals.
 *
 * @param left - One datum.
 * @param right - The other.
 * @returns Negative, zero or positive as `left` sorts before, with or after `right`; none for two
 *   data of no one ordered type.
 */
const ordered = (left: Datum, right: Datum): number | undefined => {
  const both =
    (Predicate.isBigInt(left) && Predicate.isBigInt(right)) ||
    (Predicate.isString(left) && Predicate.isString(right));
  if (!both) {
    return undefined;
  }

  if (left < right) {
    return -1;
  }

  return left > right ? 1 : 0;
};

/**
 * The order comparisons a `compare` term makes, by operator, over {@link ordered}'s sign.
 */
const orderTests = new Map<string, (order: number) => boolean>([
  ["ge", (order) => order >= 0],
  ["gt", (order) => order > 0],
  ["le", (order) => order <= 0],
  ["lt", (order) => order < 0],
]);

/**
 * The order comparisons a `compare` term makes of two floats, by operator, over
 * {@link floatOrder}'s sign.
 */
const floatTests = new Map<string, (left: number, right: number) => boolean>([
  ["ge", (left, right) => floatOrder(left, right) >= 0],
  ["gt", (left, right) => floatOrder(left, right) > 0],
  ["le", (left, right) => floatOrder(left, right) <= 0],
  ["lt", (left, right) => floatOrder(left, right) < 0],
]);

/**
 * Compare two data as a `compare` term's operator does.
 *
 * @param op - The operator: `eq`, `ne`, `lt`, `le`, `gt` or `ge`.
 * @param left - The left datum.
 * @param right - The right datum.
 * @returns The comparison, unknown for another operator or a pair of types it does not order.
 */
const compared = (op: string, left: Datum, right: Datum): boolean | undefined => {
  if (op === "eq" || op === "ne") {
    return equal(left, right) === (op === "eq");
  }

  if (Predicate.isNumber(left) && Predicate.isNumber(right)) {
    return floatTests.get(op)?.(left, right);
  }

  if (isNumeric(left) && isNumeric(right)) {
    return orderTests.get(op)?.(numericOrder(left, right));
  }

  const order = ordered(left, right);
  const test = orderTests.get(op);

  return order === undefined || test === undefined ? undefined : test(order);
};

/**
 * A set as a predicate reads it, or none for any other datum.
 *
 * @param datum - The datum.
 * @returns The set.
 */
const setOf = (datum: Datum | undefined): ReadonlySet<string> | undefined =>
  datum instanceof Set ? datum : undefined;

/**
 * A text as a predicate reads it, or none for any other datum.
 *
 * @param datum - The datum.
 * @returns The text.
 */
const textOf = (datum: Datum | undefined): string | undefined =>
  Predicate.isString(datum) ? datum : undefined;

/**
 * Apply a set function to two sets.
 *
 * @param args - The arguments' values.
 * @param apply - The function.
 * @returns Its value, unknown unless both arguments are sets.
 */
const ofSets = (
  args: readonly Datum[],
  apply: (left: ReadonlySet<string>, right: ReadonlySet<string>) => Datum,
): Datum | undefined => {
  const [left, right] = [setOf(args[0]), setOf(args[1])];

  return left === undefined || right === undefined ? undefined : apply(left, right);
};

/**
 * Apply a text function to texts.
 *
 * @param args - The arguments' values.
 * @param count - How many texts the function takes.
 * @param apply - The function.
 * @returns Its value, unknown unless each argument is a text.
 */
const ofTexts = (
  args: readonly Datum[],
  count: number,
  apply: (texts: readonly string[]) => Datum,
): Datum | undefined => {
  const texts = args.flatMap((arg) => Option.toArray(Option.fromUndefinedOr(textOf(arg))));

  return args.length === count && texts.length === count ? apply(texts) : undefined;
};

/**
 * Split a text into its code points, as PostgreSQL reads a text's characters.
 *
 * @param text - The text.
 * @returns Its code points, in order.
 */
const codePointsOf = (text: string): readonly string[] => text.match(/./gsu) ?? [];

/**
 * PostgreSQL's `translate` by code points: each character of a text that `from` holds becomes the
 * character of `to` at its position, or is removed where `to` is shorter.
 *
 * @param texts - The text, `from` and `to`.
 * @returns The translated text.
 */
const translated = ([text = "", from = "", to = ""]: readonly string[]): string => {
  const sources = codePointsOf(from);
  const targets = codePointsOf(to);

  return codePointsOf(text)
    .map((char) => {
      const at = sources.indexOf(char);

      return at === -1 ? char : (targets[at] ?? "");
    })
    .join("");
};

/**
 * The `Compute` functions a predicate reads, by name: grizzle's set algebra over sets of handles
 * (`subset`, `disjoint`, `union`, `difference`, `cardinality`, and `singleton`, the set holding a
 * closed id's one handle), its text terms (`matches`, `startsWith`, `endsWith`, `concat`,
 * `translate`, `collapse`), `add` of two naturals, and the parses of a text a guard has held to
 * their language, `parseDouble` into a float ({@link doubleNamed}) and `parseDecimal` into an exact
 * numeric ({@link numericNamed}), each as grizzle states it in SQL. Any other function is unread:
 * a selection or a check that holds one is not judged.
 */
const computers: ReadonlyMap<string, (args: readonly Datum[]) => Datum | undefined> = new Map<
  string,
  (args: readonly Datum[]) => Datum | undefined
>([
  ["subset", (args) => ofSets(args, (left, right) => [...left].every((at) => right.has(at)))],
  ["disjoint", (args) => ofSets(args, (left, right) => [...left].every((at) => !right.has(at)))],
  ["union", (args) => ofSets(args, (left, right) => new Set([...left, ...right]))],
  [
    "difference",
    (args) => ofSets(args, (left, right) => new Set([...left].filter((at) => !right.has(at)))),
  ],
  ["singleton", ([id]) => (Predicate.isString(id) ? new Set([id]) : undefined)],
  [
    "cardinality",
    ([set]) =>
      Option.getOrUndefined(
        Option.map(Option.fromUndefinedOr(setOf(set)), (held) => BigInt(held.size)),
      ),
  ],
  ["matches", (args) => ofTexts(args, 2, ([text = "", pattern = ""]) => matches(text, pattern))],
  ["startsWith", (args) => ofTexts(args, 2, ([text = "", head = ""]) => text.startsWith(head))],
  ["endsWith", (args) => ofTexts(args, 2, ([text = "", tail = ""]) => text.endsWith(tail))],
  ["concat", (args) => ofTexts(args, 2, ([left = "", right = ""]) => left + right)],
  ["translate", (args) => ofTexts(args, 3, translated)],
  [
    "collapse",
    (args) =>
      ofTexts(args, 1, ([text = ""]) =>
        text.replaceAll(/[ \t\n\r]+/gu, " ").replaceAll(/^ | $/gu, ""),
      ),
  ],
  [
    "add",
    ([left, right]) =>
      Predicate.isBigInt(left) && Predicate.isBigInt(right) ? left + right : undefined,
  ],
  ["parseDouble", (args) => ofTexts(args, 1, ([text = ""]) => doubleNamed(text))],
  ["parseDecimal", ([text]) => (Predicate.isString(text) ? numericNamed(text) : undefined)],
]);

/**
 * Cast a text into a float or an exact numeric, as PostgreSQL's `float8in` and `numeric_in` read a
 * text a guard has held to the type's form: {@link doubleNamed}, {@link numericNamed}.
 *
 * @param to - The type.
 * @param held - The text.
 * @returns The value, unknown for no text or one no numeric names.
 */
const castOf = (to: "double" | "numeric", held: Datum | undefined): Datum | undefined => {
  if (!Predicate.isString(held)) {
    return undefined;
  }

  return to === "double" ? doubleNamed(held) : numericNamed(held);
};

/**
 * Evaluate the operands of a term, the whole unknown where any is.
 *
 * @param terms - The operands.
 * @param value - Evaluates one operand.
 * @returns Their values, none when any is unknown.
 */
const allKnown = (
  terms: readonly Term[],
  value: (term: Term) => Datum | undefined,
): readonly Datum[] | undefined => {
  const values = terms.map(value);
  const known = values.filter((held) => held !== undefined);

  return known.length === values.length ? known : undefined;
};

/**
 * Combine the values of an `and` or an `or` in Kleene's logic: a decisive operand decides it, every
 * operand known and none decisive gives the other value, and else it is unknown.
 *
 * @param values - The operands' values.
 * @param decisive - `false` for an `and`, `true` for an `or`.
 * @returns The value.
 */
const kleene = (values: readonly (Datum | undefined)[], decisive: boolean): boolean | undefined => {
  if (values.includes(decisive)) {
    return decisive;
  }

  return values.every((held) => held === !decisive) ? !decisive : undefined;
};

/**
 * Decide an `in` term: true where its operand equals a member, else unknown where its operand or a
 * member is unknown, else false.
 *
 * @param held - The operand's value.
 * @param members - The members' values.
 * @returns The value.
 */
const among = (
  held: Datum | undefined,
  members: readonly (Datum | undefined)[],
): boolean | undefined => {
  if (held === undefined) {
    return undefined;
  }

  if (members.some((member) => member !== undefined && equal(held, member))) {
    return true;
  }

  return members.includes(undefined) ? undefined : false;
};

/**
 * Apply a closed read or a `Compute` function to its arguments' values.
 *
 * @param term - The read or the call.
 * @param args - Its arguments' values, none when any is unknown.
 * @param closed - The schema's closed relations.
 * @returns Its value, unknown where an argument is or the function is none of {@link computers}.
 */
const applied = (
  term: Extract<Term, { readonly kind: "closed" | "compute" }>,
  args: readonly Datum[] | undefined,
  closed: Closed,
): Datum | undefined => {
  if (args === undefined) {
    return args;
  }

  if (term.kind === "closed") {
    return closedRead(closed, term.relation, term.field, args);
  }

  return computers.get(term.fn)?.(args);
};

/**
 * Negate a truth value in Kleene's logic: unknown stays unknown.
 *
 * @param held - The value.
 * @returns Its negation, unknown for any value no truth value is.
 */
const negated = (held: Datum | undefined): boolean | undefined =>
  Predicate.isBoolean(held) ? !held : undefined;

/**
 * Take the branch of a `Compute.when` a subject reaches, as grizzle's `CASE` does: its proved
 * branch where the subject matches the guard's pattern, its otherwise elsewhere.
 *
 * @param term - The when.
 * @param subject - The subject's value.
 * @returns The branch, none where the subject is unknown or no text.
 */
const branchOf = (
  term: Extract<Term, { readonly kind: "when" }>,
  subject: Datum | undefined,
): Option.Option<Term> =>
  Predicate.isString(subject)
    ? Option.some(matches(subject, term.pattern) ? term.proved : term.otherwise)
    : Option.none();

/**
 * Evaluate a term over a row in SQL's three-valued logic: a field the row does not know, a closed
 * read at a key its relation holds no tuple at, and an unread term are unknown, `and`, `or` and
 * `not` are Kleene's, and every other operation of an unknown operand is unknown. A
 * `Compute.when` takes its branch where its subject matches its guard's pattern and its otherwise
 * elsewhere, as grizzle's `CASE` does. A comparison `forced` holds is read as false wherever it
 * occurs.
 *
 * @param term - The term.
 * @param row - The row's known fields.
 * @param forced - Whether a comparison is to be read as false.
 * @param closed - The schema's closed relations, which its closed reads look up.
 * @returns Its value, unknown as `undefined`.
 */
export const evaluate = (
  term: Term,
  row: Row,
  forced: (term: Term) => boolean,
  closed: Closed,
): Datum | undefined => {
  const value = (at: Term): Datum | undefined => evaluate(at, row, forced, closed);
  switch (term.kind) {
    case "literal": {
      return term.value;
    }
    case "field": {
      return row[term.field];
    }
    case "unread": {
      return undefined;
    }
    case "and":
    case "or": {
      return kleene(term.args.map(value), term.kind === "or");
    }
    case "not": {
      return negated(value(term.arg));
    }
    case "compare": {
      const sides = allKnown([term.left, term.right], value);
      if (forced(term)) {
        return false;
      }

      return sides === undefined ? undefined : compared(term.op, sides[0] ?? "", sides[1] ?? "");
    }
    case "in": {
      return among(value(term.arg), term.values.map(value));
    }
    case "closed":
    case "compute": {
      return applied(term, allKnown(term.args, value), closed);
    }
    case "closedHas": {
      const args = allKnown(term.args, value);

      return args === undefined ? args : closedHeld(closed, term.relation, args);
    }
    case "cast": {
      return castOf(term.to, value(term.arg));
    }
    case "when": {
      return Option.getOrUndefined(
        Option.flatMap(branchOf(term, value(term.subject)), (branch) =>
          Option.fromUndefinedOr(value(branch)),
        ),
      );
    }
    default: {
      return term satisfies never;
    }
  }
};

/**
 * Read a selection's predicate as a test of a row, as SQL's `WHERE` reads it: a row is selected
 * where the predicate is true, never where it is false or unknown.
 *
 * @param term - The selection's predicate, none for a whole relation.
 * @param closed - The schema's closed relations.
 * @returns Whether a row is selected.
 */
export const selectedBy =
  (term: Option.Option<Term>, closed: Closed) =>
  (row: Row): boolean =>
    Option.match(term, {
      onNone: () => true,
      onSome: (held) => evaluate(held, row, () => false, closed) === true,
    });

/**
 * Read a check's equation as a test of a row: the row must hold the equation where the check is
 * false with the equation read as false and every field the host writes unknown, since no value of
 * those fields then satisfies it.
 *
 * @param term - The check's predicate.
 * @param equation - Whether a term is the equation.
 * @param closed - The schema's closed relations.
 * @returns Whether a row must hold the equation.
 */
export const forcedBy =
  (term: Term, equation: (term: Term) => boolean, closed: Closed) =>
  (row: Row): boolean =>
    evaluate(term, row, equation, closed) === false;

/**
 * Evaluate a predicate as a truth value in SQL's three-valued logic.
 *
 * @param term - The predicate, none for a whole relation, which holds every row.
 * @param closed - The schema's closed relations.
 * @returns Its value over a row: true, false, or unknown.
 */
export const truthOf =
  (term: Option.Option<Term>, closed: Closed) =>
  (row: Row): boolean | undefined =>
    Option.match(term, {
      onNone: () => true,
      onSome: (held) => {
        const value = evaluate(held, row, () => false, closed);

        return Predicate.isBoolean(value) ? value : undefined;
      },
    });

/**
 * The terms below a predicate the host cannot evaluate, each by its kind: an unread term, and a
 * call of a function none of {@link computers} is.
 *
 * @param below - The predicate's terms.
 * @returns Each such term's kind, once.
 */
export const unreadIn = (below: readonly Term[]): readonly string[] => [
  ...new Set(
    below.flatMap((term) => {
      if (term.kind === "unread") {
        return [term.term];
      }

      return term.kind === "compute" && !computers.has(term.fn) ? [`${term.fn} function`] : [];
    }),
  ),
];

/**
 * A side's relation, by name, and its selection's predicate, none for a whole relation.
 */
export interface Source {
  readonly name: string;
  readonly predicate: Option.Option<Term>;
}

/**
 * Read a stored side's relation and its selection's predicate.
 *
 * @param side - The side.
 * @returns The relation's name and the predicate, none for a whole relation.
 */
export const sourceOf = (side: StoredSide): Source =>
  "desc" in side.source
    ? {
        name: side.source.relation.name,
        predicate: Option.some(termOf(side.source.desc.predicate)),
      }
    : { name: side.source.name, predicate: Option.none() };

/**
 * Read the field a stored term reads: a field's name, or a `pred` term's field.
 *
 * @param term - The term.
 * @returns The field.
 */
const fieldOf = (term: StoredSide["terms"][number]): string =>
  Predicate.isString(term) ? term : term.field;

/**
 * Read a stored side's terms, each a field's name, a `pred` term's field among them.
 *
 * @param side - The side.
 * @returns The fields, in pairing order.
 */
export const fieldsOf = (side: StoredSide): readonly string[] => side.terms.map(fieldOf);

/**
 * Write a stored side as a law's side: each term a field or `pred` of one.
 *
 * @param side - The side.
 * @returns The law side, its selection's conjuncts left out, as an outcome names it.
 */
export const lawSideOf = (side: StoredSide): LawSide => ({
  relation: sourceOf(side).name,
  selection: { conjuncts: [] },
  terms: pipe(
    side.terms,
    Arr.map((term): LawSide["terms"][number] =>
      Predicate.isString(term)
        ? { field: term, kind: "field" }
        : { field: term.field, kind: "pred" },
    ),
  ),
});

/**
 * A check read whole: its declared name, the relation it is stated on, and its predicate.
 */
export interface ReadCheck {
  readonly name: string;
  readonly predicate: Term;
  readonly relation: string;
}

/**
 * Read the checks among some statements, a schema's or ones built apart, each over a relation
 * whose rows the host holds ({@link StatementSchema}).
 *
 * @param statements - The statements.
 * @returns Each check, in statement order.
 */
export const checksOf = (statements: readonly Statement[]): readonly ReadCheck[] =>
  statements.flatMap((statement) =>
    Option.toArray(Schema.decodeUnknownOption(StatementSchema)(statement)).flatMap((read) =>
      read.kind === "check"
        ? [
            {
              name: read.desc.name,
              predicate: termOf(read.desc.predicate),
              relation: read.relation.name,
            },
          ]
        : [],
    ),
  );

/**
 * Whether some row breaks one of some checks, each judged whole, as PostgreSQL evaluates the CHECK
 * grizzle installs for it: a row breaks a check where its predicate is false.
 *
 * @param checks - The checks.
 * @param rows - The rows, by relation; a relation with none holds every check over it.
 * @param closed - The schema's closed relations, which the checks' closed reads look up.
 * @returns Whether one is broken.
 * @throws {Error} When a check holds a term the host does not read, or a row leaves its predicate
 *   unknown: the caller judges a predicate whole, never in part.
 */
export const breaks = (
  checks: readonly ReadCheck[],
  rows: ReadonlyMap<string, readonly Row[]>,
  closed: Closed,
): boolean =>
  checks.some(({ name, predicate, relation }) => {
    const unread = unreadIn(subtermsOf(predicate));
    if (unread.length > 0) {
      throw new Error(
        `The check ${name} on ${relation} holds ${unread.join(", ")}, which the host does not read, so it cannot be judged whole. Teach src/test/predicates.ts's termOf and evaluate the term.`,
      );
    }

    return (rows.get(relation) ?? []).some((row) => {
      const truth = truthOf(Option.some(predicate), closed)(row);
      if (truth === undefined) {
        throw new Error(
          `The check ${name} on ${relation} is unknown over a row of fields ${Object.keys(row).join(", ")}: give the row every field the check reads.`,
        );
      }

      return !truth;
    });
  });
