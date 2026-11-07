/**
 * The key texts the composed `Qti` holds from a document's own text, read from the schema's
 * statements rather than listed by hand, for the law oracle's "Key text bound"
 * (`#pantry/test/oracle.ts` `keyTexts`).
 *
 * A text the database holds in a field of type `keyText` (`#pantry/qti/limits.ts`) is refused past
 * its bound by that type, so the oracle must count exactly the document texts some statement writes
 * into such a field. Three statement shapes do, each over a document relation the oracle has rows
 * for, `Attribute` or `Node`:
 *
 * - **A containment** (`contained`, either way of a `mirrors`) whose source side pairs a field of no
 *   `keyText` type with a `keyText` field of its target: every source row its selection holds is
 *   copied, as an ID attribute's lexical form is into `DocumentId.lexical`.
 * - **A check** that equates a field of no `keyText` type with a `keyText` field of the same row
 *   where the rest of the check leaves no other way to hold, as `E1_derived` equates an IDREF
 *   attribute's lexical form with its `idrefText`.
 * - **A fold** of `Monoid.concat` into a `keyText` accumulator over the document tree: an owner's end
 *   is held where any member its step selects steps, as a checked or copied element's string value
 *   is.
 *
 * A copy out of a `keyText` field is bounded where that field is written, so only these first hops
 * are listed. Each selection and check is read from the predicate grizzle keeps for it and
 * evaluated on the host in SQL's three-valued logic, over the fields the oracle knows of a row
 * ({@link attributeFields}, {@link nodeFields}).
 */
import { lawsOf } from "@bjornpagen/grizzle";
import type { Law, LawSide, LawSourceSide } from "@bjornpagen/grizzle";
import {
  Array as Arr,
  Formatter,
  Function as Fn,
  Option,
  pipe,
  Predicate,
  Result,
  Schema,
} from "effect";
import { keyText } from "#pantry/qti/limits.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The fields of an `Attribute` row the oracle knows before the database writes it: its owner's
 * kind, version, governing type and document's type, its name and its lexical form.
 */
export const attributeFields = [
  "documentType",
  "governs",
  "kind",
  "lexical",
  "name",
  "version",
] as const;

/**
 * The fields of a `Node` row the oracle knows before the database writes it: its own kind, version,
 * governing type, start and characters, its document's type, its parent's kind and governing type,
 * its grandparent's kind, and its string value.
 */
export const nodeFields = [
  "chars",
  "documentType",
  "governs",
  "kind",
  "parentGoverns",
  "parentKind",
  "parentParentKind",
  "start",
  "stringValue",
  "version",
] as const;

/**
 * A field of an `Attribute` row the oracle knows.
 */
type AttributeField = (typeof attributeFields)[number];

/**
 * A field of a `Node` row the oracle knows.
 */
type NodeField = (typeof nodeFields)[number];

/**
 * The known field names of each document relation.
 */
const knownNames = {
  Attribute: new Set<string>(attributeFields),
  Node: new Set<string>(nodeFields),
} as const;

/**
 * Whether a field name is one the oracle knows of an `Attribute` row.
 *
 * @param name - The field's name.
 * @returns Whether it is in {@link attributeFields}.
 */
const isAttributeField = (name: string): name is AttributeField => knownNames.Attribute.has(name);

/**
 * Whether a field name is one the oracle knows of a `Node` row.
 *
 * @param name - The field's name.
 * @returns Whether it is in {@link nodeFields}.
 */
const isNodeField = (name: string): name is NodeField => knownNames.Node.has(name);

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
 * The known fields of a row of each document relation, by relation.
 */
export interface DocumentRows {
  readonly Attribute: Readonly<Record<AttributeField, Datum>>;
  readonly Node: Readonly<Record<NodeField, Datum>>;
}

/**
 * A document relation the oracle has rows for.
 */
export type DocumentRelation = keyof DocumentRows;

/**
 * Whether a relation name is a document relation's.
 *
 * @param name - The relation's name.
 * @returns Whether the oracle has rows of it.
 */
const isDocumentRelation = (name: string): name is DocumentRelation =>
  Object.hasOwn(knownNames, name);

/**
 * How a statement writes a document's text into a key text: a containment's copy, a check's
 * equation, or a fold's end.
 */
export type CopiedBy = "check" | "contained" | "fold";

/**
 * A row's known fields as a predicate reads them, by name.
 */
type Row = Readonly<Record<string, Datum>>;

/**
 * The parts of a copy every document relation shares.
 */
interface Copy {
  readonly by: CopiedBy;
  /**
   * The `keyText` field that holds the text, `Relation.field`.
   */
  readonly field: string;
  /**
   * Decide whether a row's text is held: for a containment its source row, for a check its row,
   * and for a fold a member, whose owner's end is then held.
   *
   * @param row - The row's known fields.
   * @returns Whether its text is held.
   */
  readonly holds: (row: Row) => boolean;
  /**
   * The statement's law as {@link identityOf} writes it: the containment or the fold, and for a
   * check its name, its relation and the two fields it equates.
   */
  readonly law: string;
  /**
   * The statement's place among the schema's statements, which keys the copies with the field: two
   * statements may share an identity and differ by their selections alone.
   */
  readonly statement: number;
}

/**
 * One key text of the schema a document's text is written into, by the document relation it reads
 * and the known field of that relation whose value is held: the source's for a containment or a
 * check, the owner's end for a fold.
 */
export type KeyCopy =
  | (Copy & { readonly reads: AttributeField; readonly source: "Attribute" })
  | (Copy & { readonly reads: NodeField; readonly source: "Node" });

/**
 * A term of a predicate, the part of grizzle's predicate language a copy's selection or check
 * reads. Any other term is `unread`: a selection that holds one cannot be evaluated, and a check
 * reads it as unknown.
 */
type Term =
  | { readonly args: readonly Term[]; readonly fn: string; readonly kind: "compute" }
  | { readonly args: readonly Term[]; readonly kind: "and" | "or" }
  | {
      readonly args: readonly Term[];
      readonly field: Option.Option<string>;
      readonly kind: "closed";
      readonly relation: string;
    }
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
 * A containment source's constant term as grizzle keeps it, `constant(v)`: the value every fact of
 * the side holds there, which meets its target field's (`on` of grizzle's schema API).
 */
const ConstantTermSchema = Schema.Struct({
  kind: Schema.Literal("constant"),
  value: Schema.Union([Schema.String, Schema.BigInt, Schema.Number, Schema.Boolean]),
});

/**
 * A side of a statement as grizzle keeps it: a selection with the predicate its desc holds, or a
 * whole relation, stored or closed, and its terms, a `pred` one as an object over its field and a
 * containment source's constant as {@link ConstantTermSchema}.
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
    Schema.Union([Schema.String, Schema.Struct({ field: Schema.String }), ConstantTermSchema]),
  ),
});

/**
 * A side as {@link SideSchema} reads it.
 */
export type StoredSide = typeof SideSchema.Type;

/**
 * The statements a copy comes from as grizzle keeps them: a containment or a mirrors, a fold, and a
 * check with its predicate.
 */
const StatementSchema = Schema.Union([
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
 * A statement's kind, read before its shape.
 */
const KindSchema = Schema.Struct({ kind: Schema.String });

/**
 * The kinds of statement a copy comes from, each of which {@link StatementSchema} must read.
 */
const copyKinds: ReadonlySet<string> = new Set(["check", "contained", "fold", "mirrors"]);

/**
 * A statement as {@link StatementSchema} reads it.
 */
type StoredStatement = typeof StatementSchema.Type;

/**
 * Read a term of a stored predicate into {@link Term}.
 *
 * @param stored - The term as grizzle keeps it.
 * @returns The term; `unread` for a term of any other kind or of a shape its kind does not have.
 */
const termOf = (stored: StoredTerm): Term => {
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
const subtermsOf = (term: Term): readonly Term[] => [term, ...operandsOf(term).flatMap(subtermsOf)];

/**
 * A closed relation of the schema as its rows are installed: its key fields in order and its facts,
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
 * Each closed relation's facts, read on first use.
 */
const closedFacts = new Map<string, Option.Option<ClosedFacts>>();

/**
 * Read a closed relation's facts.
 *
 * @param relation - The relation's name.
 * @returns Its facts, none for a name that is no closed relation of the schema.
 */
const factsOf = (relation: string): Option.Option<ClosedFacts> => {
  const known = closedFacts.get(relation);
  if (known !== undefined) {
    return known;
  }

  const member = Object.entries(Qti.relations).find(([name]) => name === relation)?.[1];
  const read = Schema.decodeUnknownOption(ClosedSchema)(member);
  closedFacts.set(relation, read);

  return read;
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
 * Each closed relation's index by a key prefix of one length: the rows each prefix starts, built on
 * first read.
 */
const prefixIndex = new Map<string, ReadonlyMap<string, readonly Row[]>>();

/**
 * Read the rows of a closed relation whose key starts with a prefix.
 *
 * @param facts - The relation's facts.
 * @param prefix - The prefix's values, in key order.
 * @returns The rows, none where no tuple starts with it.
 */
const rowsStarting = (facts: ClosedFacts, prefix: readonly Datum[]): readonly Row[] => {
  const label = `${facts.name}/${String(prefix.length)}`;
  let index = prefixIndex.get(label);
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
    prefixIndex.set(label, index);
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
 * @param relation - The relation's name.
 * @param field - The payload field for `C.at`, none for `C.row`.
 * @param args - The key's or the prefix's values, in key order.
 * @returns The read, unknown for a name that is no closed relation.
 */
const closedRead = (
  relation: string,
  field: Option.Option<string>,
  args: readonly Datum[],
): Datum | undefined => {
  const facts = Option.getOrUndefined(factsOf(relation));
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
 * @returns Its value, unknown where an argument is or the function is none of {@link computers}.
 */
const applied = (
  term: Extract<Term, { readonly kind: "closed" | "compute" }>,
  args: readonly Datum[] | undefined,
): Datum | undefined => {
  if (args === undefined) {
    return args;
  }

  if (term.kind === "closed") {
    return closedRead(term.relation, term.field, args);
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
 * @returns Its value, unknown as `undefined`.
 */
const evaluate = (term: Term, row: Row, forced: (term: Term) => boolean): Datum | undefined => {
  const value = (at: Term): Datum | undefined => evaluate(at, row, forced);
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
      return applied(term, allKnown(term.args, value));
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
 * @returns Whether a row is selected.
 */
const selectedBy =
  (term: Option.Option<Term>) =>
  (row: Row): boolean =>
    Option.match(term, {
      onNone: () => true,
      onSome: (held) => evaluate(held, row, () => false) === true,
    });

/**
 * Read a check's equation as a test of a row: the row must hold the equation where the check is
 * false with the equation read as false and every field the host writes unknown, since no value of
 * those fields then satisfies it.
 *
 * @param term - The check's predicate.
 * @param equation - Whether a term is the equation.
 * @returns Whether a row must hold the equation.
 */
const forcedBy =
  (term: Term, equation: (term: Term) => boolean) =>
  (row: Row): boolean =>
    evaluate(term, row, equation) === false;

/**
 * Read a stored side's relation and its selection's predicate.
 *
 * @param side - The side.
 * @returns The relation's name and the predicate, none for a whole relation.
 */
const sourceOf = (
  side: StoredSide,
): { readonly name: string; readonly predicate: Option.Option<Term> } =>
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
 * @returns The field, none for a constant, which reads none.
 */
const fieldOf = (term: StoredSide["terms"][number]): Option.Option<string> => {
  if (Predicate.isString(term)) {
    return Option.some(term);
  }

  return "field" in term ? Option.some(term.field) : Option.none();
};

/**
 * The defect of a reader of fields met with a constant term, which only a containment's source
 * holds.
 *
 * @param side - The side that holds it.
 * @returns The error, naming the side and the repair.
 */
const constantHeld = (side: StoredSide): Error =>
  new Error(
    `The side over ${sourceOf(side).name} holds a constant term, which this reader pairs as no field. Read a containment's source by its terms, each a field or a constant.`,
  );

/**
 * Read a stored side's terms, each a field's name, a `pred` term's field among them, of a side that
 * holds no constant: a target's, a fold's or a family's, or a containment source of none.
 *
 * @param side - The side.
 * @returns The fields, in pairing order.
 * @throws {Error} When the side holds a constant, which only a containment's source may hold and
 *   whose reader pairs its terms by {@link fieldOf}.
 */
const fieldsOf = (side: StoredSide): readonly string[] =>
  side.terms.map((term) => Option.getOrThrowWith(fieldOf(term), () => constantHeld(side)));

/**
 * Write a containment's stored source side as a law's source side: each term a field, `pred` of
 * one, or a constant.
 *
 * @param side - The side.
 * @returns The law side, its selection's conjuncts left out, as an outcome names it.
 */
const lawSourceSideOf = (side: StoredSide): LawSourceSide => ({
  relation: sourceOf(side).name,
  selection: { conjuncts: [] },
  terms: pipe(
    side.terms,
    Arr.map((term): LawSourceSide["terms"][number] => {
      if (Predicate.isString(term)) {
        return { field: term, kind: "field" };
      }

      return "field" in term
        ? { field: term.field, kind: "pred" }
        : { kind: "constant", value: term.value };
    }),
  ),
});

/**
 * Write a stored side that holds no constant as a law's side: a target's, a key's, a fold's, or a
 * containment source of none.
 *
 * @param side - The side.
 * @returns The law side, its selection's conjuncts left out, as an outcome names it.
 * @throws {Error} When the side holds a constant, as {@link fieldsOf} does.
 */
const lawSideOf = (side: StoredSide): LawSide => ({
  relation: sourceOf(side).name,
  selection: { conjuncts: [] },
  terms: pipe(
    side.terms,
    Arr.map((term): LawSide["terms"][number] => {
      const field = Option.getOrThrowWith(fieldOf(term), () => constantHeld(side));

      return Predicate.isString(term) ? { field, kind: "field" } : { field, kind: "pred" };
    }),
  ),
});

/**
 * Write one term of a law side: a field as its name, `pred` of a field as `pred(field)`, and a
 * containment source's constant as `constant(value)`.
 *
 * @param term - The term.
 * @returns Its text.
 */
const termText = (term: LawSourceSide["terms"][number]): string => {
  if (term.kind === "constant") {
    return `constant(${Formatter.format(term.value)})`;
  }

  return term.kind === "pred" ? `pred(${term.field})` : term.field;
};

/**
 * Write a law side as {@link identityOf} spells it: its relation and its terms, `pred` of a field as
 * `pred(field)`, its selection left out.
 *
 * @param side - The side.
 * @returns Its text.
 */
const sideText = (side: LawSourceSide): string =>
  `${side.relation}(${side.terms.map(termText).join(", ")})`;

/**
 * Write a containment's or a fold's identity as this list keys its copies, and as
 * `keys.oracle.test.ts` reads the law table's: its kind, its sides and a fold's slots and monoid,
 * its selections left out, so two statements that differ by their selections alone share it and
 * {@link Copy}'s `statement` tells them apart.
 *
 * @param law - The law.
 * @returns Its identity.
 */
export const identityOf = (law: Law): string => {
  if (law.kind === "contained") {
    return `contained ${sideText(law.from)} in ${sideText(law.to)}`;
  }

  return law.kind === "fold"
    ? `${law.monoid} fold over ${law.family.owner}.${law.family.count} into ${sideText(law.end)}`
    : law.kind;
};

/**
 * A stored relation of the schema as grizzle keeps it, its fields' types unread.
 */
const StoredRelationSchema = Schema.Struct({
  fields: Schema.Record(Schema.String, Schema.Unknown),
  kind: Schema.Literal("relation"),
  name: Schema.String,
});

/**
 * Every field of the composed schema whose type is `keyText`, an accumulator or a generated field
 * of it included, as `Relation.field`: grizzle keeps an accumulator's type at its `field` and a
 * generated field's at its `type`.
 */
export const keyTextFields: ReadonlySet<string> = new Set(
  Object.values(Qti.relations).flatMap((member) =>
    Option.match(Schema.decodeUnknownOption(StoredRelationSchema)(member), {
      onNone: () => [],
      onSome: ({ fields, name }) =>
        Object.entries(fields).flatMap(([field, type]) =>
          type === keyText ||
          (Predicate.hasProperty(type, "field") && type.field === keyText) ||
          (Predicate.hasProperty(type, "type") && type.type === keyText)
            ? [`${name}.${field}`]
            : [],
        ),
    }),
  ),
);

/**
 * Whether a relation's field is of type `keyText`.
 *
 * @param relation - The relation's name.
 * @param field - The field's name.
 * @returns Whether it is in {@link keyTextFields}.
 */
const holdsKeyText = (relation: string, field: string): boolean =>
  keyTextFields.has(`${relation}.${field}`);

/**
 * A copy the derivation could not read: one that holds a field the oracle does not know of its row,
 * or whose selection reads one, or reads a term no part of {@link Term}.
 */
export interface UnreadCopy {
  readonly field: string;
  readonly law: string;
  readonly reason: string;
}

/**
 * A copy before it is checked against the fields the oracle knows.
 */
interface Drafted {
  readonly by: CopiedBy;
  readonly field: string;
  readonly law: string;
  readonly reads: string;
  readonly source: DocumentRelation;
  readonly statement: number;
  readonly term: Option.Option<Term>;
  readonly test: (row: Row) => boolean;
}

/**
 * Check a drafted copy against the fields the oracle knows of its relation's rows, since a field it
 * does not know would leave rows the database copies uncounted.
 *
 * @param draft - The copy.
 * @returns The copy, or why it cannot be counted.
 */
const checked = (draft: Drafted): Result.Result<KeyCopy, UnreadCopy> => {
  const unread = (reason: string): Result.Result<KeyCopy, UnreadCopy> =>
    Result.fail({ field: draft.field, law: draft.law, reason });
  const below = Option.match(draft.term, { onNone: () => [], onSome: subtermsOf });
  const unknown = below.flatMap((term) => {
    if (term.kind === "unread") {
      return [`a ${term.term} term`];
    }

    return term.kind === "field" && !knownNames[draft.source].has(term.field)
      ? [`${draft.source}.${term.field}`]
      : [];
  });
  if (draft.by !== "check" && unknown.length > 0) {
    return unread(`its selection reads ${unknown.join(", ")}, which the oracle cannot evaluate`);
  }

  const copy = {
    by: draft.by,
    field: draft.field,
    holds: draft.test,
    law: draft.law,
    statement: draft.statement,
  };
  const { reads } = draft;
  if (draft.source === "Attribute" && isAttributeField(reads)) {
    return Result.succeed({ ...copy, reads, source: "Attribute" });
  }

  return draft.source === "Node" && isNodeField(reads)
    ? Result.succeed({ ...copy, reads, source: "Node" })
    : unread(`it holds ${draft.source}.${reads}, which the oracle does not know`);
};

/**
 * Draft the copies one containment's direction makes of a document's text into a key text: each
 * pair of terms whose source field is no key text and whose target field is.
 *
 * @param from - The side whose tuples are contained.
 * @param to - The side they are among.
 * @param statement - The statement's place among the schema's.
 * @returns The copies.
 */
const containedCopies = (
  from: StoredSide,
  to: StoredSide,
  statement: number,
): readonly Drafted[] => {
  const source = sourceOf(from);
  const target = sourceOf(to).name;
  const { name } = source;
  if (!isDocumentRelation(name)) {
    return [];
  }

  const law = identityOf({ from: lawSourceSideOf(from), kind: "contained", to: lawSideOf(to) });
  const targets = fieldsOf(to);

  // A constant reads no field of the source, so it copies no text into its target's.
  return from.terms.flatMap((term, at): readonly Drafted[] => {
    const held = targets[at] ?? "";

    return fieldOf(term).pipe(
      Option.filter((reads) => holdsKeyText(target, held) && !holdsKeyText(name, reads)),
      Option.map((reads): Drafted => ({
        by: "contained",
        field: `${target}.${held}`,
        law,
        reads,
        source: name,
        statement,
        term: source.predicate,
        test: selectedBy(source.predicate),
      })),
      Option.toArray,
    );
  });
};

/**
 * Draft the copy a fold makes: a `Monoid.concat` fold into a `keyText` accumulator of a document
 * relation whose members are its own rows holds its owner's end where a member it steps steps.
 *
 * @param fold - The fold.
 * @param statement - The statement's place among the schema's.
 * @returns The copy, none for a fold of any other kind.
 */
const foldCopies = (
  fold: Extract<StoredStatement, { readonly kind: "fold" }>,
  statement: number,
): readonly Drafted[] => {
  const step = sourceOf(fold.step);
  const owner = sourceOf(fold.end).name;
  const held = fieldsOf(fold.end).at(-1) ?? "";
  const { name } = step;
  if (
    fold.monoid.name !== "concat" ||
    !holdsKeyText(owner, held) ||
    !isDocumentRelation(name) ||
    owner !== name
  ) {
    return [];
  }

  return [
    {
      by: "fold",
      field: `${owner}.${held}`,
      law: identityOf({
        end: lawSideOf(fold.end),
        family: { count: fold.family.slots.count, owner: fold.family.slots.owner.name },
        kind: "fold",
        monoid: fold.monoid.name,
        step: lawSideOf(fold.step),
      }),
      reads: held,
      source: name,
      statement,
      term: step.predicate,
      test: selectedBy(step.predicate),
    },
  ];
};

/**
 * Read the equation a term states between a field of no `keyText` type and a `keyText` field of
 * one relation's row.
 *
 * @param relation - The row's relation.
 * @param term - The term.
 * @returns The `keyText` field and the field it equals, none for any other term.
 */
const equationOf = (
  relation: string,
  term: Term,
): Option.Option<{ readonly held: string; readonly reads: string }> => {
  if (
    term.kind !== "compare" ||
    term.op !== "eq" ||
    term.left.kind !== "field" ||
    term.right.kind !== "field"
  ) {
    return Option.none();
  }

  const [left, right] = [term.left.field, term.right.field];
  if (holdsKeyText(relation, left) === holdsKeyText(relation, right)) {
    return Option.none();
  }

  return Option.some(
    holdsKeyText(relation, left) ? { held: left, reads: right } : { held: right, reads: left },
  );
};

/**
 * Draft the copies a check makes on a document relation: each equation of a field of no `keyText`
 * type with a `keyText` field of the same row, which the row must hold where the rest of the check
 * leaves it no other way to.
 *
 * @param check - The check.
 * @param statement - The statement's place among the schema's.
 * @returns The copies.
 */
const checkCopies = (
  check: Extract<StoredStatement, { readonly kind: "check" }>,
  statement: number,
): readonly Drafted[] => {
  const { name } = check.relation;
  if (!isDocumentRelation(name)) {
    return [];
  }

  const predicate = termOf(check.desc.predicate);
  const equations = Arr.dedupeWith(
    subtermsOf(predicate).flatMap((term) => Option.toArray(equationOf(name, term))),
    (a, b) => a.held === b.held && a.reads === b.reads,
  );

  return equations.map(({ held, reads }) => ({
    by: "check",
    field: `${name}.${held}`,
    law: `check ${check.desc.name} on ${name}: ${reads} = ${held}`,
    reads,
    source: name,
    statement,
    term: Option.some(predicate),
    test: forcedBy(predicate, (term) =>
      Option.exists(
        equationOf(name, term),
        (equation) => equation.held === held && equation.reads === reads,
      ),
    ),
  }));
};

/**
 * Draft the copies one statement makes of a document's text into a key text.
 *
 * @param statement - The statement.
 * @param at - Its place among the schema's.
 * @returns Its copies.
 */
const statementCopies = (statement: StoredStatement, at: number): readonly Drafted[] => {
  switch (statement.kind) {
    case "contained": {
      return containedCopies(statement.left, statement.right, at);
    }
    case "mirrors": {
      return [
        ...containedCopies(statement.left, statement.right, at),
        ...containedCopies(statement.right, statement.left, at),
      ];
    }
    case "fold": {
      return foldCopies(statement, at);
    }
    case "check": {
      return checkCopies(statement, at);
    }
    default: {
      return statement satisfies never;
    }
  }
};

/**
 * Read every copy a schema's statements make of a document's text into a key text, in their order.
 *
 * @param statements - The schema's statements.
 * @returns Each copy, or why it cannot be counted.
 */
export const copiesOf = (
  statements: typeof Qti.statements,
): readonly Result.Result<KeyCopy, UnreadCopy>[] =>
  statements.flatMap((statement, at) => {
    const kind = Option.getOrElse(
      Option.map(Schema.decodeUnknownOption(KindSchema)(statement), (read) => read.kind),
      () => "",
    );
    if (!copyKinds.has(kind)) {
      return [];
    }

    return Option.match(Schema.decodeUnknownOption(StatementSchema)(statement), {
      onNone: () => [
        Result.fail({
          field: "",
          law: `statement ${String(at)}`,
          reason: `it is a ${kind} of a shape the derivation does not read`,
        }),
      ],
      onSome: (read) => statementCopies(read, at).map(checked),
    });
  });

/**
 * Every copy the composed `Qti` makes of a document's text into a key text, the list the oracle's
 * "Key text bound" counts (`#pantry/test/oracle.ts` `keyTexts`). A copy the derivation cannot read
 * fails the module's load, naming the copy and what the oracle would need, so no copy is left
 * uncounted.
 */
export const keyCopies: readonly KeyCopy[] = Result.getOrThrowWith(
  Result.all(copiesOf(Qti.statements)),
  ({ field, law, reason }) =>
    new Error(
      `The oracle cannot count the key text ${field} of ${law}: ${reason}. Teach src/test/key-copies.ts to read it.`,
    ),
);

/**
 * Judge rows by a check the schema states, read from the predicate grizzle keeps for it, as
 * PostgreSQL's CHECK reads it: a row is refused where the predicate is false and kept where it is
 * true or unknown, a field the row does not hold being unknown.
 *
 * @param statements - The schema's statements.
 * @param relation - The check's relation.
 * @param name - The check's name.
 * @returns Whether a row passes the check; none where the schema states no such check, or states
 *   it in a shape this module does not read.
 */
export const checkOf = (
  statements: typeof Qti.statements,
  relation: string,
  name: string,
): Option.Option<(row: Readonly<Record<string, Datum>>) => boolean> =>
  Arr.findFirst(statements, (statement) =>
    Option.match(Schema.decodeUnknownOption(StatementSchema)(statement), {
      onNone: () => Option.none(),
      onSome: (read) =>
        read.kind === "check" && read.relation.name === relation && read.desc.name === name
          ? Option.some(
              (row: Readonly<Record<string, Datum>>) =>
                evaluate(termOf(read.desc.predicate), row, () => false) !== false,
            )
          : Option.none(),
    }),
  );

/**
 * Read a generated field's term as the host evaluates it: the term grizzle keeps at the field's
 * writing in its relation's description (`relation.generated`), read as a predicate's terms are
 * and evaluated over the row, as PostgreSQL computes the column from the row's written fields.
 *
 * @param expr - The term, as grizzle keeps it.
 * @returns The field's value over a row: unknown where the term reads a field the row lacks, or
 *   holds a term the host does not read, such as a cast or a conditional.
 * @throws {Error} When grizzle keeps no term there: a defect of the host judge, which must learn
 *   the description's shape before it restores the field.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A description's term is read here, by its shape.
const generatedValueOf = (expr: unknown): ((row: Row) => Datum | undefined) => {
  const term = termOf(Schema.decodeUnknownSync(StoredTermSchema)(expr));

  return (row) => evaluate(term, row, () => false);
};

/**
 * A stored relation's description as grizzle keeps it, for its generated fields: each field's
 * writing, a generated field's with the term PostgreSQL computes it by.
 */
const DescribedSchema = Schema.Struct({
  desc: Schema.Struct({
    fields: Schema.Record(
      Schema.String,
      Schema.Struct({
        writing: Schema.Struct({ expr: Schema.optionalKey(Schema.Unknown), kind: Schema.String }),
      }),
    ),
  }),
  name: Schema.String,
});

/**
 * Every field PostgreSQL generates of each stored relation of the composed schema, by relation and
 * then field: its value over a row ({@link generatedValueOf}), from the term grizzle keeps in the
 * relation's description. A relation that generates no field has no entry. A stored relation's
 * description is read strictly, so a shape grizzle changes fails here, by its decode, rather than
 * leaving a generated field unrestored without a word.
 */
export const generatedFields: ReadonlyMap<
  string,
  ReadonlyMap<string, (row: Row) => Datum | undefined>
> = new Map(
  Object.values(Qti.relations).flatMap((member) => {
    if (!Predicate.hasProperty(member, "kind") || member.kind !== "relation") {
      return [];
    }

    const { desc, name } = Schema.decodeUnknownSync(DescribedSchema)(member);
    const generated = Object.entries(desc.fields).flatMap(([field, { writing }]) =>
      writing.kind === "generated" ? [[field, generatedValueOf(writing.expr)] as const] : [],
    );

    return generated.length === 0 ? [] : [[name, new Map(generated)] as const];
  }),
);

/**
 * One side of a statement as the host judges it: its relation and its terms as an outcome names
 * them, the fields its selection reads and the terms of it the host cannot read, and its selection
 * in SQL's three-valued logic: true, false, or unknown where a field it reads is absent and no
 * operand decides it without that field.
 */
export interface JudgedSide {
  readonly law: LawSide;
  readonly reads: readonly string[];
  readonly relation: string;
  readonly selection: (row: Readonly<Record<string, Datum>>) => boolean | undefined;
  readonly unread: readonly string[];
}

/**
 * Evaluate a predicate as a truth value in SQL's three-valued logic.
 *
 * @param term - The predicate, none for a whole relation, which holds every row.
 * @returns Its value over a row: true, false, or unknown.
 */
const truthOf =
  (term: Option.Option<Term>) =>
  (row: Row): boolean | undefined =>
    Option.match(term, {
      onNone: () => true,
      onSome: (held) => {
        const value = evaluate(held, row, () => false);

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
const unreadIn = (below: readonly Term[]): readonly string[] => [
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
 * Read a stored side's relation and selection as the host judges them.
 *
 * @param side - The side.
 * @returns Its relation, its selection, and the fields and unread terms the selection holds.
 */
const selectionOf = (side: StoredSide): Omit<JudgedSide, "law"> => {
  const source = sourceOf(side);
  const below = Option.match(source.predicate, { onNone: () => [], onSome: subtermsOf });

  return {
    reads: [...new Set(below.flatMap((term) => (term.kind === "field" ? [term.field] : [])))],
    relation: source.name,
    selection: truthOf(source.predicate),
    unread: unreadIn(below),
  };
};

/**
 * Read a stored side, of any statement grizzle keeps, a family's or a fold's among them, as the
 * host judges it.
 *
 * @param side - The side.
 * @returns Its relation, terms, selection, and the fields and unread terms the selection holds.
 */
export const judgedSideOf = (side: StoredSide): JudgedSide => ({
  ...selectionOf(side),
  law: lawSideOf(side),
});

/**
 * A containment's source side as the host judges it: a {@link JudgedSide} whose terms may also be
 * constants, each its value on every row.
 */
export interface JudgedSourceSide extends Omit<JudgedSide, "law"> {
  readonly law: LawSourceSide;
}

/**
 * Read a containment's stored source side as the host judges it.
 *
 * @param side - The side.
 * @returns Its relation, terms, constants among them, selection, and the fields and unread terms
 *   the selection holds.
 */
const judgedSourceSideOf = (side: StoredSide): JudgedSourceSide => ({
  ...selectionOf(side),
  law: lawSourceSideOf(side),
});

/**
 * A law the schema states that the host judges over rows: a containment, each half of a `mirrors`
 * one, its source rows' projection among its target rows'; a key, its rows' projection one tuple
 * each; and a check, every row's predicate not false, in SQL's three-valued logic as a CHECK reads
 * it. Each is named as an outcome names it, and a check's predicate is read with the fields and
 * unread terms it holds.
 */
export type JudgedLaw =
  | {
      readonly from: JudgedSourceSide;
      readonly kind: "contained";
      readonly law: Law;
      readonly to: JudgedSide;
    }
  | {
      readonly kind: "check";
      readonly law: Law;
      readonly reads: readonly string[];
      readonly relation: string;
      readonly unread: readonly string[];
      readonly value: (row: Readonly<Record<string, Datum>>) => boolean | undefined;
    }
  | { readonly kind: "key"; readonly law: Law; readonly side: JudgedSide };

/**
 * A key as grizzle keeps it: its side.
 */
const KeyStatementSchema = Schema.Struct({ kind: Schema.Literal("key"), side: SideSchema });

/**
 * Read a containment as the law the host judges it by.
 *
 * @param left - Its source side.
 * @param right - Its target side.
 * @returns The law.
 */
const containedOf = (left: StoredSide, right: StoredSide): JudgedLaw => ({
  from: judgedSourceSideOf(left),
  kind: "contained",
  law: { from: lawSourceSideOf(left), kind: "contained", to: lawSideOf(right) },
  to: judgedSideOf(right),
});

/**
 * Read one statement as the laws the host judges it by.
 *
 * @param statement - The statement as the schema states it.
 * @returns Its laws: two for a `mirrors`, one for a containment, a check or a key, none for any
 *   other statement.
 */
const judgedOf = (statement: (typeof Qti.statements)[number]): readonly JudgedLaw[] => {
  const keyed = Option.map(
    Schema.decodeUnknownOption(KeyStatementSchema)(statement),
    ({ side }): readonly JudgedLaw[] => [
      { kind: "key", law: { kind: "key", side: lawSideOf(side) }, side: judgedSideOf(side) },
    ],
  );
  if (Option.isSome(keyed)) {
    return keyed.value;
  }

  return Option.match(Schema.decodeUnknownOption(StatementSchema)(statement), {
    onNone: () => [],
    onSome: (read): readonly JudgedLaw[] => {
      if (read.kind === "check") {
        const term = termOf(read.desc.predicate);
        const below = subtermsOf(term);

        return [
          {
            kind: "check",
            law: { kind: "check", name: read.desc.name, relation: read.relation.name },
            reads: [...new Set(below.flatMap((at) => (at.kind === "field" ? [at.field] : [])))],
            relation: read.relation.name,
            unread: unreadIn(below),
            value: truthOf(Option.some(term)),
          },
        ];
      }

      if (read.kind === "fold") {
        return [];
      }

      return read.kind === "mirrors"
        ? [containedOf(read.left, read.right), containedOf(read.right, read.left)]
        : [containedOf(read.left, read.right)];
    },
  });
};

/**
 * Whether two law sides read one side, whatever their selections: one relation, and the same terms
 * in pairing order, each a field, `pred` of one, or a constant of one value.
 *
 * @param stated - A side as grizzle's `lawsOf` names it.
 * @param read - The side as this module read it from its statement.
 * @returns Whether they are one side.
 */
const readsSide = (stated: LawSourceSide, read: LawSourceSide): boolean =>
  stated.relation === read.relation &&
  stated.terms.length === read.terms.length &&
  Arr.zip(stated.terms, read.terms).every(([held, term]) => {
    if (held.kind === "constant" || term.kind === "constant") {
      return held.kind === "constant" && term.kind === "constant" && held.value === term.value;
    }

    return held.kind === term.kind && held.field === term.field;
  });

/**
 * Whether a law grizzle's `lawsOf` names for a statement is the law this module read from it: a
 * check of one name over one relation, a key over one side, or a containment between one pair of
 * sides, whatever the sides' selections, since this module reads a selection as the predicate the
 * statement holds, not as grizzle's canonical conjuncts.
 *
 * @param stated - The law as `lawsOf` names it.
 * @param read - The law as this module read it.
 * @returns Whether they are one law.
 */
const readsLaw = (stated: Law, read: Law): boolean => {
  if (stated.kind === "check" && read.kind === "check") {
    return stated.name === read.name && stated.relation === read.relation;
  }

  if (stated.kind === "key" && read.kind === "key") {
    return readsSide(stated.side, read.side);
  }

  return (
    stated.kind === "contained" &&
    read.kind === "contained" &&
    readsSide(stated.from, read.from) &&
    readsSide(stated.to, read.to)
  );
};

/**
 * Name a law the host judges as grizzle's `lawsOf` names it, its sides' selections included, so
 * `src/import/refusal.ts`'s `lawNameOf`, which matches by grizzle's `sameLaw`, names a broken one
 * as it names an outcome's: the one law of its statement's that it reads ({@link readsLaw}).
 *
 * @param judged - The law, as this module read it from its statement.
 * @param laws - The statement's laws, as `lawsOf` names them.
 * @returns The law, holding the statement's own law.
 * @throws {Error} When none or several of the statement's laws are the law read, which `lawsOf`
 *   rules out: a defect of this reader, never of a document.
 */
const statedAs = (judged: JudgedLaw, laws: readonly Law[]): JudgedLaw => {
  const held = laws.filter((stated) => readsLaw(stated, judged.law));
  if (!Arr.isReadonlyArrayNonEmpty(held) || held.length > 1) {
    throw new Error(
      `The statement read as ${Formatter.format(judged.law)} has ${String(held.length)} laws of grizzle's lawsOf that read its sides, among ${Formatter.format(laws)}. Read each statement's sides as lawsOf pairs them.`,
    );
  }

  return { ...judged, law: Arr.headNonEmpty(held) };
};

/**
 * Each statement of a schema beside its laws, as grizzle's `lawsOf` names them.
 *
 * `lawsOf` compiles the schema's law model, which takes seconds, so this is memoized by the
 * schema: {@link judgedLaws}, {@link containmentsOf}, `#pantry/test/host-judge.ts` and a test file
 * share one compile.
 */
const statementLawsOf = Fn.memoize((schema: typeof Qti) => lawsOf(schema));

/**
 * Every law a schema states that the host judges over rows ({@link JudgedLaw}), in statement
 * order, each named as grizzle's `lawsOf` names its statement's law ({@link statedAs}).
 *
 * @param schema - The schema, `Qti`.
 * @returns The laws.
 */
export const judgedLaws: (schema: typeof Qti) => readonly JudgedLaw[] = Fn.memoize(
  (schema: typeof Qti): readonly JudgedLaw[] =>
    statementLawsOf(schema).flatMap(({ laws, statement }) =>
      judgedOf(statement).map((judged) => statedAs(judged, laws)),
    ),
);

/**
 * Read a closed relation's facts as rows, for a law over it.
 *
 * @param relation - The relation's name.
 * @returns Its rows; none for a name that is no closed relation of the schema.
 */
export const closedRows = (relation: string): Option.Option<readonly Row[]> =>
  Option.map(factsOf(relation), ({ rows }) => rows);

/**
 * One term of a containment's source side as a row meets its target's field: the field the row
 * holds there, a `pred` term's field among them, or the constant every row holds there.
 */
export type SourceTerm =
  | { readonly field: string; readonly kind: "field" }
  | { readonly kind: "constant"; readonly value: bigint | boolean | number | string };

/**
 * Read one term of a containment's stored source side ({@link SourceTerm}).
 *
 * @param term - The term.
 * @returns The field it reads, or its constant.
 */
const sourceTermOf = (term: StoredSide["terms"][number]): SourceTerm => {
  if (Predicate.isString(term)) {
    return { field: term, kind: "field" };
  }

  return "field" in term
    ? { field: term.field, kind: "field" }
    : { kind: "constant", value: term.value };
};

/**
 * A containment the schema states, read from the statement grizzle keeps for it: its law as
 * grizzle's `lawsOf` names it, its sides' selections included, each side's relation, its source's
 * terms and its target's fields, and each side's selection as SQL's `WHERE` reads it.
 */
export interface Containment {
  readonly from: string;
  readonly fromTerms: readonly SourceTerm[];
  readonly law: Law;
  readonly selected: (row: Readonly<Record<string, Datum>>) => boolean;
  readonly targeted: (row: Readonly<Record<string, Datum>>) => boolean;
  readonly to: string;
  readonly toFields: readonly string[];
}

/**
 * Read every containment the schema states from one relation, so a test can judge rows by the
 * schema's own statements, their selections included: a source row its selection holds must meet
 * a target row its selection holds on the paired fields. Each law is its statement's own, read as
 * {@link judgedLaws} reads it ({@link statedAs}), so `src/import/refusal.ts`'s `lawNameOf` names
 * it.
 *
 * @param schema - The schema, `Qti`.
 * @param from - The source relation.
 * @returns The containments, in statement order.
 */
export const containmentsOf = (schema: typeof Qti, from: string): readonly Containment[] =>
  statementLawsOf(schema).flatMap(({ laws, statement }) =>
    Option.match(Schema.decodeUnknownOption(StatementSchema)(statement), {
      onNone: () => [],
      onSome: (read): readonly Containment[] => {
        if (read.kind !== "contained" || sourceOf(read.left).name !== from) {
          return [];
        }

        const left = sourceOf(read.left);
        const right = sourceOf(read.right);

        return [
          {
            from: left.name,
            fromTerms: read.left.terms.map(sourceTermOf),
            law: statedAs(containedOf(read.left, read.right), laws).law,
            selected: selectedBy(left.predicate),
            targeted: selectedBy(right.predicate),
            to: right.name,
            toFields: fieldsOf(read.right),
          },
        ];
      },
    }),
  );
