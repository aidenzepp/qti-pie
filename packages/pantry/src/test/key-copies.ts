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
import type { Law, LawSide } from "@bjornpagen/grizzle";
import { Array as Arr, Option, Predicate, Result, Schema } from "effect";
import { keyText } from "#pantry/qti/limits.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The fields of an `Attribute` row the oracle knows before the database writes it: its owner's
 * kind, version and governing type, its name and its lexical form.
 */
export const attributeFields = ["governs", "kind", "lexical", "name", "version"] as const;

/**
 * The fields of a `Node` row the oracle knows before the database writes it: its own kind, version,
 * governing type, start and characters, its parent's kind and governing type, its grandparent's
 * kind, and its string value.
 */
export const nodeFields = [
  "chars",
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
 * One value a predicate reads: a text, a natural, a boolean, or a set of a roster's handles.
 */
export type Datum = bigint | boolean | ReadonlySet<string> | string;

/**
 * The schema of a {@link Datum}, which reads a closed relation's facts and a literal's value.
 */
const DatumSchema = Schema.Union([
  Schema.String,
  Schema.BigInt,
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
   * The statement as grizzle's outcome names it (`src/import/refusal.ts` `lawIdentity`): the
   * containment or the fold, and for a check its name, its relation and the two fields it equates.
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
 * A side of a statement as grizzle keeps it: a selection with the predicate its desc holds, or a
 * whole relation, stored or closed, and its terms, a `pred` one as an object over its field.
 */
const SideSchema = Schema.Struct({
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
type StoredSide = typeof SideSchema.Type;

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
 * Write a datum as a key's text: a text as itself, a natural or a boolean as it prints, a set as
 * its members, and an absent value as nothing.
 *
 * @param datum - The datum.
 * @returns Its text.
 */
export const datumText = (datum: Datum | undefined): string => {
  if (datum === undefined || Predicate.isString(datum)) {
    return datum ?? "";
  }

  return Predicate.isBigInt(datum) || Predicate.isBoolean(datum)
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
 * Whether two data are equal: texts, naturals and booleans by value, sets by their members.
 *
 * @param left - One datum.
 * @param right - The other.
 * @returns Whether they are equal.
 */
const equal = (left: Datum, right: Datum): boolean =>
  left instanceof Set && right instanceof Set
    ? left.size === right.size && [...left].every((member) => right.has(member))
    : left === right;

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

  const order = ordered(left, right);
  const test = orderTests.get(op);

  return order === undefined || test === undefined ? undefined : test(order);
};

/**
 * Apply a `Compute` function a copy's predicate reads to two arguments' values: `subset` and
 * `union` of two sets, `matches`, `startsWith` and `endsWith` of two texts.
 *
 * @param fn - The function.
 * @param left - Its first argument's value.
 * @param right - Its second argument's value.
 * @returns Its value, unknown for any other function or arguments of other types.
 */
const computed = (fn: string, left: Datum, right: Datum): Datum | undefined => {
  if (left instanceof Set && right instanceof Set) {
    if (fn === "subset") {
      return [...left].every((member) => right.has(member));
    }

    return fn === "union" ? new Set([...left, ...right]) : undefined;
  }

  if (!Predicate.isString(left) || !Predicate.isString(right)) {
    return undefined;
  }

  if (fn === "matches") {
    return matches(left, right);
  }

  if (fn === "startsWith") {
    return left.startsWith(right);
  }

  return fn === "endsWith" ? left.endsWith(right) : undefined;
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
 * @returns Its value, unknown where an argument is or the call has not two of them.
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

  const [left, right] = args;

  return args.length === 2 && left !== undefined && right !== undefined
    ? computed(term.fn, left, right)
    : undefined;
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
 * Read a stored side's terms, each a field's name, a `pred` term's field among them.
 *
 * @param side - The side.
 * @returns The fields, in pairing order.
 */
const fieldsOf = (side: StoredSide): readonly string[] =>
  side.terms.map((term) => (Predicate.isString(term) ? term : term.field));

/**
 * Write a stored side as a law's side.
 *
 * @param side - The side.
 * @returns The law side, its selection's conjuncts left out, as an outcome names it.
 */
const lawSideOf = (side: StoredSide): LawSide => ({
  relation: sourceOf(side).name,
  selection: { conjuncts: [] },
  terms: Arr.map(side.terms, (term): LawSide["terms"][number] =>
    Predicate.isString(term) ? { field: term, kind: "field" } : { field: term.field, kind: "pred" },
  ),
});

/**
 * Write a law side as `src/import/refusal.ts` `lawIdentity` spells it.
 *
 * @param side - The side.
 * @returns Its text.
 */
const sideText = (side: LawSide): string =>
  `${side.relation}(${side.terms.map((term) => (term.kind === "field" ? term.field : `pred(${term.field})`)).join(", ")})`;

/**
 * Write a containment's or a fold's identity as `src/import/refusal.ts` `lawIdentity` does.
 *
 * @param law - The law.
 * @returns Its identity.
 */
const identityOf = (law: Law): string => {
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
 * of it included, as `Relation.field`.
 */
export const keyTextFields: ReadonlySet<string> = new Set(
  Object.values(Qti.relations).flatMap((member) =>
    Option.match(Schema.decodeUnknownOption(StoredRelationSchema)(member), {
      onNone: () => [],
      onSome: ({ fields, name }) =>
        Object.entries(fields).flatMap(([field, type]) =>
          type === keyText || (Predicate.hasProperty(type, "field") && type.field === keyText)
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

  const law = identityOf({ from: lawSideOf(from), kind: "contained", to: lawSideOf(to) });
  const targets = fieldsOf(to);

  return fieldsOf(from).flatMap((reads, at): readonly Drafted[] => {
    const held = targets[at] ?? "";

    return holdsKeyText(target, held) && !holdsKeyText(name, reads)
      ? [
          {
            by: "contained",
            field: `${target}.${held}`,
            law,
            reads,
            source: name,
            statement,
            term: source.predicate,
            test: selectedBy(source.predicate),
          },
        ]
      : [];
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
