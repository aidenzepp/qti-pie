/**
 * Grizzle's predicate language and statement sides as the host reads them, from the values grizzle
 * keeps on a schema's statements, and a predicate evaluated over a row in SQL's three-valued logic.
 *
 * It states no law and reads no schema: a caller hands it the statements it reads and the schema's
 * members whose closed relations a predicate's closed reads look up ({@link closedOf}). Two callers
 * share it: the law oracle's key copies (`#pantry/test/key-copies.ts`), which read the composed
 * schema's copies into a key text, and the import's host judge (`#pantry/import/host-judge.ts`),
 * which judges the import's own rows by the schema's laws. The law oracle may read this module
 * because it reads no statement of its own; `src/grammar/purity.test.ts` holds it to that.
 *
 * - **Values.** A row is its fields' values, each a {@link Datum}: a text, a natural, a float, a
 *   truth value or a set of a roster's handles.
 * - **Terms.** A stored predicate reads into a {@link Term} ({@link termOf}): fields, literals,
 *   comparisons, `in`, `and`, `or`, `not`, a closed relation's three reads, and the `Compute`
 *   functions of {@link computers}; any other term is `unread`.
 * - **Evaluation.** {@link evaluate} is SQL's three-valued logic: an absent field, a closed read at a
 *   key its relation holds no tuple at and an unread term are unknown; `and`, `or` and `not` are
 *   Kleene's.
 * - **Sides.** A stored side ({@link SideSchema}) gives its relation and selection ({@link sourceOf})
 *   and its terms, each a field or `pred` of one, written as an outcome names a law's side
 *   ({@link lawSideOf}).
 */
import type { AnySchema, LawSide } from "@bjornpagen/grizzle";
import { Array as Arr, Option, pipe, Predicate, Schema } from "effect";

/**
 * One value a predicate reads: a text, a natural, a float, a boolean, or a set of a roster's
 * handles. A float has grizzle's one zero: `float8` stores -0 as 0 (`codec/scalar.ts` and
 * `scalar/values/convert.ts` of grizzle-engine at the vendored commit), so {@link floatDatum}
 * normalizes it.
 */
export type Datum = bigint | boolean | number | ReadonlySet<string> | string;

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
  | { readonly field: string; readonly kind: "field" }
  | { readonly kind: "compare"; readonly left: Term; readonly op: string; readonly right: Term }
  | { readonly kind: "literal"; readonly value: Datum }
  | { readonly kind: "unread"; readonly term: string };

/**
 * A predicate's term as grizzle keeps it, read field by field: every field a term of
 * {@link Term} has, each optional, and a literal's value unread.
 */
interface StoredTerm {
  readonly arg?: StoredTerm;
  readonly args?: readonly StoredTerm[];
  readonly field?: string;
  readonly fn?: string;
  readonly kind: string;
  readonly left?: StoredTerm;
  readonly op?: string;
  readonly relation?: string;
  readonly right?: StoredTerm;
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
  kind: Schema.String,
  left: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  op: Schema.optionalKey(Schema.String),
  relation: Schema.optionalKey(Schema.String),
  right: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  value: Schema.optionalKey(Schema.Unknown),
  values: Schema.optionalKey(Schema.Array(Schema.Unknown)),
});

/**
 * A side of a statement as grizzle keeps it: a selection with the predicate its desc holds, or a
 * whole relation, stored or closed, and its terms, each a field's name or a `pred` one as an object
 * over its field. Every side reads a field at each term: grizzle `3cc8fbd` removed `constant(v)`,
 * and a target fixes a field beyond its terms by its selection instead (README, "Rules").
 */
export const SideSchema = Schema.Struct({
  source: Schema.Union([
    Schema.Struct({
      desc: Schema.Struct({ predicate: StoredTermSchema }),
      relation: Schema.Struct({ name: Schema.String }),
    }),
    Schema.Struct({ kind: Schema.String, name: Schema.String }),
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
 * a mirrors, a fold, and a check with its predicate.
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
    relation: Schema.Struct({ name: Schema.String }),
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
  const { arg, field, fn, left, op, relation, right, values } = stored;
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
        Option.match(Schema.decodeUnknownOption(DatumSchema)(stored.value), {
          onNone: () => unread,
          onSome: (value): Term => ({ kind: "literal", value }),
        }),
    ],
    ["not", () => (arg === undefined ? unread : { arg: termOf(arg), kind: "not" })],
    ["or", () => ({ args: (stored.args ?? []).map(termOf), kind: "or" })],
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
    case "not": {
      return [term.arg];
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
 * Write a datum as a key's text: a text as itself, a natural, a float or a boolean as it prints, a
 * set as its members, and an absent value as nothing.
 *
 * @param datum - The datum.
 * @returns Its text.
 */
export const datumText = (datum: Datum | undefined): string => {
  if (datum === undefined || Predicate.isString(datum)) {
    return datum ?? "";
  }

  return Predicate.isBigInt(datum) || Predicate.isNumber(datum) || Predicate.isBoolean(datum)
    ? String(datum)
    : [...datum].join(" ");
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
 * `translate`, `collapse`) and `add` of two naturals, each as grizzle states it in SQL. Any other
 * function is unread: a selection or a check that holds one is not judged.
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
]);

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
 * Evaluate a term over a row in SQL's three-valued logic: a field the row does not know, a closed
 * read at a key its relation holds no tuple at, and an unread term are unknown, `and`, `or` and
 * `not` are Kleene's, and every other operation of an unknown operand is unknown. A comparison
 * `forced` holds is read as false wherever it occurs.
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
      const held = value(term.arg);

      return Predicate.isBoolean(held) ? !held : undefined;
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
