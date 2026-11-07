/**
 * The import's rows judged on the host: the laws `Qti` states that a package's rows can be held to
 * before any of them is written, evaluated over the rows `readProgram` builds, each named by its
 * law as a refusal names it (`#pantry/import/refusal.ts` `statedLaws`).
 *
 * Four kinds of statement are evaluated, from the statements grizzle keeps for them, never from a
 * list written here:
 *
 * - A key over a relation or a selection of one: no two selected rows share the key's fields;
 * - A containment, either way of a mirrors: every selected row's terms are a tuple of the target, a
 *   closed relation's facts or the import's own rows of a stored relation;
 * - A check: no row of its relation makes its predicate false, as PostgreSQL's CHECK reads it;
 * - A key text's bound: no field of type `keyText` holds more than `keyTextBytes` bytes.
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
import { Array as Arr, Option, pipe, Predicate, Schema } from "effect";
import type { LawSide } from "@bjornpagen/grizzle";
import { lawIdentity, lawOfCheck, statedLaws } from "#pantry/import/refusal.ts";
import type { LawName } from "#pantry/import/refusal.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { keyTextBytes, utf8Length } from "#pantry/qti/limits.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { keyTextFields } from "#pantry/test/key-copies.ts";

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
type Literal = bigint | boolean | number | string;

/**
 * The schema of a {@link Literal}.
 */
const LiteralSchema = Schema.Union([Schema.String, Schema.Number, Schema.BigInt, Schema.Boolean]);

/**
 * A term of a stored predicate as grizzle keeps it, read field by field.
 */
interface StoredTerm {
  readonly arg?: StoredTerm;
  readonly args?: readonly StoredTerm[];
  readonly field?: string;
  readonly kind: string;
  readonly left?: StoredTerm;
  readonly op?: string;
  readonly right?: StoredTerm;
  readonly value?: Literal;
  readonly values?: readonly Literal[];
}

/**
 * The schema of a {@link StoredTerm}: a predicate whose literal is no text, number or flag does not
 * decode, and its statement is not evaluated.
 */
const StoredTermSchema: Schema.Codec<StoredTerm> = Schema.Struct({
  arg: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  args: Schema.optionalKey(
    Schema.Array(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  ),
  field: Schema.optionalKey(Schema.String),
  kind: Schema.String,
  left: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  op: Schema.optionalKey(Schema.String),
  right: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  value: Schema.optionalKey(LiteralSchema),
  values: Schema.optionalKey(Schema.Array(LiteralSchema)),
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
  | { readonly kind: "unread" };

/**
 * The term no part of this module reads.
 */
const unread: Term = { kind: "unread" };

/**
 * Read a stored term into a {@link Term}.
 *
 * @param stored - The term as grizzle keeps it, none for a missing operand.
 * @returns The term, `unread` for one of a kind or shape this module does not read.
 */
const termOf = (stored: StoredTerm | undefined): Term => {
  if (stored === undefined) {
    return unread;
  }

  switch (stored.kind) {
    case "and":
    case "or": {
      return { args: (stored.args ?? []).map(termOf), kind: stored.kind };
    }
    case "not": {
      return { arg: termOf(stored.arg), kind: "not" };
    }
    case "in": {
      return { arg: termOf(stored.arg), kind: "in", values: (stored.values ?? []).map(String) };
    }
    case "field": {
      return stored.field === undefined ? unread : { field: stored.field, kind: "field" };
    }
    case "compare": {
      return stored.op === undefined
        ? unread
        : {
            kind: "compare",
            left: termOf(stored.left),
            op: stored.op,
            right: termOf(stored.right),
          };
    }
    case "literal": {
      return stored.value === undefined ? unread : { kind: "literal", value: stored.value };
    }
    default: {
      return unread;
    }
  }
};

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
 * and a check whose predicate it reads.
 */
const StoredStatement = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("key"), side: StoredSide }),
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
  readonly terms: readonly (string | undefined)[];
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
      terms: side.terms.map((term) => (Predicate.isString(term) ? term : undefined)),
    },
  };
};

/**
 * A statement this module evaluates, by the identity its law has: a check's is `check <name> on
 * <relation>`, since one check may be stated on several relations.
 */
type Evaluated =
  | { readonly identity: string; readonly kind: "key"; readonly side: Side }
  | {
      readonly identity: string;
      readonly kind: "check";
      readonly predicate: Term;
      readonly relation: string;
    }
  | {
      readonly from: Side;
      readonly identity: string;
      readonly kind: "contained";
      readonly to: Side;
    };

/**
 * Read the statements of one stored statement this module evaluates: a key's, a containment's,
 * and both containments of a mirrors.
 *
 * @param read - The stored statement.
 * @returns The statements.
 */
const evaluatedOf = (read: typeof StoredStatement.Type): readonly Evaluated[] => {
  if (read.kind === "check") {
    return [
      {
        identity: `check ${read.desc.name} on ${read.relation.name}`,
        kind: "check",
        predicate: termOf(read.desc.predicate),
        relation: read.relation.name,
      },
    ];
  }

  if (read.kind === "key") {
    const { law, side } = sideOf(read.side);

    return [{ identity: lawIdentity({ kind: "key", side: law }), kind: "key", side }];
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

  return pairs.map(([from, to]) => ({
    from: from.side,
    identity: lawIdentity({ from: from.law, kind: "contained", to: to.law }),
    kind: "contained",
    to: to.side,
  }));
};

/**
 * The stored statements of `Qti`, each as this module reads it, none for one it does not.
 */
const stored = Qti.statements.flatMap((statement) =>
  Option.toArray(Schema.decodeUnknownOption(StoredStatement)(statement)),
);

/**
 * Every statement of `Qti` this module evaluates.
 */
const evaluated: readonly Evaluated[] = stored.flatMap(evaluatedOf);

/**
 * Each check's law, by the check's identity.
 */
const checkLaws: ReadonlyMap<string, LawName> = new Map(
  evaluated.flatMap((statement) =>
    statement.kind === "check"
      ? Option.toArray(
          Option.map(
            lawOfCheck(statement.identity.split(" ")[1] ?? ""),
            (law) => [statement.identity, law] as const,
          ),
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
        stored.some((read) => read.kind === "check" && read.desc.name === desc.name)
          ? []
          : Option.toArray(lawOfCheck(desc.name)),
    }),
  ),
);

/**
 * Each law's name by the identity of a statement of it.
 */
const namesByIdentity: ReadonlyMap<string, LawName> = new Map(
  statedLaws.map(([law, name]) => [lawIdentity(law), name] as const),
);

/**
 * Each law the schema states that is no check, by name, with the identities of its statements.
 */
const identitiesOf: ReadonlyMap<LawName, readonly string[]> = new Map(
  [...new Set(statedLaws.map(([, name]) => name))].map((name) => [
    name,
    statedLaws.flatMap(([law, held]) => (held === name ? [lawIdentity(law)] : [])),
  ]),
);

/**
 * The schema of a relation of `Qti` as the host reads it: its fields' SQL types, and for a closed
 * relation its facts.
 */
const StoredRelation = Schema.Struct({
  fields: Schema.Record(Schema.String, Schema.Struct({ sql: Schema.optionalKey(Schema.String) })),
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
 * Each stored relation's uuid fields, by relation.
 */
const uuidFields: ReadonlyMap<string, readonly string[]> = new Map(
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
 * Evaluate a term over a row.
 *
 * @param term - The term.
 * @param row - The row.
 * @returns Its value: a text, a flag, or undefined where the term reads what the row or this module
 *   cannot give.
 */
const evaluate = (term: Term, row: Row): boolean | string | undefined => {
  switch (term.kind) {
    case "field": {
      const value = row[term.field];

      return Predicate.isBoolean(value) ? value : textOf(value);
    }
    case "literal": {
      return Predicate.isBoolean(term.value) ? term.value : String(term.value);
    }
    case "not": {
      const value = evaluate(term.arg, row);

      return Predicate.isBoolean(value) ? !value : undefined;
    }
    case "and":
    case "or": {
      const decisive = term.kind === "or";
      const values = term.args.map((arg) => evaluate(arg, row));
      if (values.includes(decisive)) {
        return decisive;
      }

      return values.every((value) => value === !decisive) ? !decisive : undefined;
    }
    case "in": {
      const value = evaluate(term.arg, row);

      return value === undefined ? undefined : term.values.includes(String(value));
    }
    case "compare": {
      const left = evaluate(term.left, row);
      const right = evaluate(term.right, row);

      return left === undefined || right === undefined
        ? undefined
        : compared(term.op, String(left), String(right));
    }
    case "unread": {
      return undefined;
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
  if (rows === undefined || side.terms.includes(undefined)) {
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
      const values = side.terms.map((field) =>
        field === undefined ? undefined : textOf(row[field]),
      );
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
 * Flatten a document's tree into the rows of `Node`, `Attribute` and `Namespace`, each node with
 * the `document` of its tree and the `parent` and `node` its nesting supplies.
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
      add("Attribute", { ...ownFields(attribute), node: id });
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

  return view;
};

/**
 * What the host judges of a program's rows:
 *
 * - `broken`, each law some statement of which the rows break, with the tuple that breaks it;
 * - `held`, each law every statement and check of which was evaluated and held, so its database
 *   verdict is known;
 * - `overLong`, each `keyText` field, as `Relation.field`, that holds a text past the bound;
 * - `dangling`, each uuid field, as `Relation.field = value`, that names an id the program did not
 *   mint;
 * - `written`, each field, as `Relation.field`, some row of the program holds.
 */
export interface HostVerdict {
  readonly broken: ReadonlyMap<LawName, string>;
  readonly dangling: readonly string[];
  readonly held: ReadonlySet<LawName>;
  readonly overLong: ReadonlySet<string>;
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
  const verdicts = new Map(
    evaluated.map((statement) => [statement.identity, verdictOf(view, statement)]),
  );
  const broken = new Map<LawName, string>();
  for (const statement of evaluated) {
    const verdict = verdicts.get(statement.identity);
    const name = namesByIdentity.get(statement.identity) ?? checkLaws.get(statement.identity);
    if (verdict?.kind === "broken" && name !== undefined && !broken.has(name)) {
      broken.set(name, `${statement.identity}: ${verdict.witness}`);
    }
  }

  const checksOf = new Map<LawName, string[]>();
  for (const [identity, law] of checkLaws) {
    checksOf.set(law, [...(checksOf.get(law) ?? []), identity]);
  }

  const held = new Set(
    [...new Set([...identitiesOf.keys(), ...checksOf.keys()])].filter(
      (name) =>
        !unreadChecks.has(name) &&
        !broken.has(name) &&
        [...(identitiesOf.get(name) ?? []), ...(checksOf.get(name) ?? [])].every(
          (identity) => verdicts.get(identity)?.kind === "held",
        ),
    ),
  );
  const overLong = new Set<string>();
  const written = new Set<string>();
  const dangling = new Set<string>();
  for (const [relation, rows] of view) {
    const uuids = uuidFields.get(relation) ?? [];
    for (const row of rows) {
      for (const [field, value] of Object.entries(row)) {
        written.add(`${relation}.${field}`);
        if (
          Predicate.isString(value) &&
          keyTextFields.has(`${relation}.${field}`) &&
          utf8Length(value) > keyTextBytes
        ) {
          overLong.add(`${relation}.${field}`);
        }
      }

      for (const field of uuids) {
        const value = row[field];
        if (Predicate.isString(value) && !minted.has(value)) {
          dangling.add(`${relation}.${field} = ${value}`);
        }
      }
    }
  }

  return { broken, dangling: [...dangling], held, overLong, written };
};
