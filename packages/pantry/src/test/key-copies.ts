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
 * are listed. Each selection and check is evaluated by {@link holdsWhere}, a host reading of the
 * predicate grizzle keeps for it, over the fields the oracle knows of a row
 * ({@link attributeFields}, {@link nodeFields}).
 */
import type { Law, LawSide } from "@bjornpagen/grizzle";
import { Array as Arr, Option, Predicate, Result } from "effect";
import { keyText } from "#pantry/qti/limits.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The fields of an `Attribute` row the oracle knows before the database writes it: its owner's
 * kind, version and governing type, its name and its lexical form.
 */
export const attributeFields = ["governs", "kind", "lexical", "name", "version"] as const;

/**
 * The fields of a `Node` row the oracle knows before the database writes it: its own kind, version,
 * governing type, start and characters, its parent's kind and governing type and its
 * grandparent's kind, and its string value.
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
 * One value a predicate reads: a text, a natural, a boolean, or a set of a roster's handles.
 */
export type Datum = bigint | boolean | ReadonlySet<string> | string;

/**
 * The known fields of a row of each document relation, by relation.
 */
export interface DocumentRows {
  readonly Attribute: Readonly<Record<(typeof attributeFields)[number], Datum>>;
  readonly Node: Readonly<Record<(typeof nodeFields)[number], Datum>>;
}

/**
 * A document relation the oracle has rows for.
 */
export type DocumentRelation = keyof DocumentRows;

/**
 * The known fields of each document relation, by relation.
 */
const documentFields: { readonly [R in DocumentRelation]: ReadonlySet<string> } = {
  Attribute: new Set(attributeFields),
  Node: new Set(nodeFields),
};

/**
 * Whether a relation name is a document relation's.
 *
 * @param name - The relation's name.
 * @returns Whether the oracle has rows of it.
 */
const isDocumentRelation = (name: string): name is DocumentRelation =>
  Object.hasOwn(documentFields, name);

/**
 * How a statement writes a document's text into a key text: a containment's copy, a check's
 * equation, or a fold's end.
 */
export type CopiedBy = "check" | "contained" | "fold";

/**
 * One key text of the schema a document's text is written into, of one document relation.
 */
interface CopyOf<R extends DocumentRelation> {
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
  readonly holds: (row: DocumentRows[R]) => boolean;
  /**
   * The statement as grizzle's outcome names it: the containment or the fold, and for a check its
   * name, the relation and the two fields it equates.
   */
  readonly law: string;
  /**
   * The known field whose value is held: the source's for a containment or a check, the owner's
   * end for a fold.
   */
  readonly reads: keyof DocumentRows[R] & string;
  readonly source: R;
  /**
   * The statement's place among the schema's statements, which keys the copies with the field:
   * two statements may share an identity and differ by their selections alone.
   */
  readonly statement: number;
}

/**
 * One key text a document's text is written into: {@link CopyOf} over one of the document
 * relations.
 */
export type KeyCopy = { readonly [R in DocumentRelation]: CopyOf<R> }[DocumentRelation];

/**
 * A copy before its statement's place is known: {@link KeyCopy} without `statement`.
 */
type Unplaced = KeyCopy extends infer C
  ? C extends KeyCopy
    ? Omit<C, "statement">
    : never
  : never;

/**
 * A term of a predicate as grizzle keeps it, the part of its language a copy's selection or check
 * reads. Any other term is `opaque`: a selection that holds one cannot be read, and a check reads
 * it as unknown.
 */
type Term =
  | { readonly args: readonly Term[]; readonly kind: "and" | "or" }
  | { readonly args: readonly Term[]; readonly fn: string; readonly kind: "compute" }
  | {
      readonly args: readonly Term[];
      readonly field: string;
      readonly kind: "closedAt";
      readonly relation: string;
    }
  | { readonly args: readonly Term[]; readonly kind: "closedRow"; readonly relation: string }
  | { readonly arg: Term; readonly kind: "in"; readonly values: readonly Term[] }
  | { readonly arg: Term; readonly kind: "not" }
  | { readonly field: string; readonly kind: "field" }
  | { readonly kind: "compare"; readonly left: Term; readonly op: string; readonly right: Term }
  | { readonly kind: "literal"; readonly value: Datum }
  | { readonly kind: "opaque"; readonly shape: string };

/**
 * Read the closed relation a closed read names.
 *
 * @param raw - The term as grizzle keeps it.
 * @returns The relation's name, empty when the term names none.
 */
const relationNameOf = (raw: object): string =>
  Predicate.hasProperty(raw, "relation") && Predicate.isString(raw.relation) ? raw.relation : "";

/**
 * Read the arguments of a term that has them.
 *
 * @param raw - The term as grizzle keeps it.
 * @returns Its arguments, read as terms; none when it has no list of them.
 */
const argsOf = (raw: object): readonly Term[] =>
  Predicate.hasProperty(raw, "args") && Array.isArray(raw.args) ? raw.args.map(termOf) : [];

/**
 * Read a literal's value as a datum: a text, a natural, a boolean or a set of handles.
 *
 * @param value - The value grizzle keeps.
 * @returns The datum, or none for a value of any other type.
 */
const datumOf = (value: unknown): Option.Option<Datum> => {
  if (
    Predicate.isString(value) ||
    Predicate.isBigInt(value) ||
    Predicate.isBoolean(value) ||
    (value instanceof Set && [...value].every(Predicate.isString))
  ) {
    return Option.some(value);
  }

  return Option.none();
};

/**
 * Read one term of a predicate grizzle keeps into the part of its language {@link Term} names.
 *
 * @param raw - The term as grizzle keeps it.
 * @returns The term; `opaque` for any other.
 */
const termOf = (raw: unknown): Term => {
  if (Predicate.isString(raw)) {
    return { kind: "literal", value: raw };
  }

  if (!Predicate.isObject(raw) || !Predicate.hasProperty(raw, "kind")) {
    return { kind: "opaque", shape: typeof raw };
  }

  const { kind } = raw;
  const opaque: Term = { kind: "opaque", shape: String(kind) };
  switch (kind) {
    case "and":
    case "or": {
      return { args: argsOf(raw), kind };
    }
    case "not": {
      return Predicate.hasProperty(raw, "arg") ? { arg: termOf(raw.arg), kind } : opaque;
    }
    case "compare": {
      return Predicate.hasProperty(raw, "op") &&
        Predicate.isString(raw.op) &&
        Predicate.hasProperty(raw, "left") &&
        Predicate.hasProperty(raw, "right")
        ? { kind, left: termOf(raw.left), op: raw.op, right: termOf(raw.right) }
        : opaque;
    }
    case "field": {
      return Predicate.hasProperty(raw, "field") && Predicate.isString(raw.field)
        ? { field: raw.field, kind }
        : opaque;
    }
    case "literal": {
      return Predicate.hasProperty(raw, "value")
        ? Option.match(datumOf(raw.value), {
            onNone: () => opaque,
            onSome: (value): Term => ({ kind, value }),
          })
        : opaque;
    }
    case "in": {
      return Predicate.hasProperty(raw, "arg") &&
        Predicate.hasProperty(raw, "values") &&
        Array.isArray(raw.values)
        ? { arg: termOf(raw.arg), kind, values: raw.values.map(termOf) }
        : opaque;
    }
    case "closedAt": {
      return Predicate.hasProperty(raw, "field") && Predicate.isString(raw.field)
        ? { args: argsOf(raw), field: raw.field, kind, relation: relationNameOf(raw) }
        : opaque;
    }
    case "closedRow": {
      return { args: argsOf(raw), kind, relation: relationNameOf(raw) };
    }
    case "compute": {
      return Predicate.hasProperty(raw, "fn") && Predicate.isString(raw.fn)
        ? { args: argsOf(raw), fn: raw.fn, kind }
        : opaque;
    }
    default: {
      return opaque;
    }
  }
};

/**
 * List the fields a term reads of its row, and the shapes it holds that {@link Term} does not read.
 *
 * @param term - The term.
 * @returns Its fields and its opaque shapes.
 */
const readsOf = (
  term: Term,
): { readonly fields: readonly string[]; readonly opaque: readonly string[] } => {
  const fields: string[] = [];
  const opaque: string[] = [];
  const walk = (at: Term): void => {
    switch (at.kind) {
      case "field": {
        fields.push(at.field);
        break;
      }
      case "opaque": {
        opaque.push(at.shape);
        break;
      }
      case "literal": {
        break;
      }
      case "not": {
        walk(at.arg);
        break;
      }
      case "in": {
        walk(at.arg);
        at.values.forEach(walk);
        break;
      }
      case "compare": {
        walk(at.left);
        walk(at.right);
        break;
      }
      default: {
        at.args.forEach(walk);
      }
    }
  };
  walk(term);

  return { fields, opaque };
};

/**
 * One closed relation of the schema as its rows are installed: its key fields in order and its
 * facts.
 */
interface ClosedFacts {
  readonly key: readonly string[];
  readonly rows: readonly Readonly<Record<string, unknown>>[];
}

/**
 * The closed relations of the composed schema, by name, as their rows are installed.
 */
const closedFacts: ReadonlyMap<string, ClosedFacts> = new Map(
  Object.values(Qti.relations).flatMap((member: unknown) =>
    Predicate.isObject(member) &&
    Predicate.hasProperty(member, "kind") &&
    member.kind === "closedRelation" &&
    Predicate.hasProperty(member, "name") &&
    Predicate.isString(member.name) &&
    Predicate.hasProperty(member, "key") &&
    Array.isArray(member.key) &&
    Predicate.hasProperty(member, "rows") &&
    Array.isArray(member.rows)
      ? [[member.name, { key: member.key.map(String), rows: member.rows }] as const]
      : [],
  ),
);

/**
 * Write the text a closed read's key is indexed by.
 *
 * @param values - The key's leading values, in key order.
 * @returns The text.
 */
const keyTextOf = (values: readonly unknown[]): string => values.map(String).join("\u001f");

/**
 * The rows of each closed relation by its whole key, built on first read.
 */
const rowsByKey = new Map<string, ReadonlyMap<string, Readonly<Record<string, unknown>>>>();

/**
 * The completions of each key prefix of each closed relation, by the relation and the prefix's
 * length, built on first read.
 */
const completions = new Map<string, ReadonlyMap<string, ReadonlySet<string>>>();

/**
 * Read a closed relation's payload field at a whole key, as `C.at(field, …)` does: no value where
 * it holds no tuple, which a predicate reads as unknown, as SQL reads grizzle's NULL.
 *
 * @param relation - The relation's name.
 * @param field - The payload field.
 * @param args - The key's values, in key order.
 * @returns The field's value, none where the relation holds no tuple at the key.
 */
const closedAt = (relation: string, field: string, args: readonly Datum[]): Datum | undefined => {
  const facts = closedFacts.get(relation);
  if (facts === undefined) {
    return undefined;
  }

  let index = rowsByKey.get(relation);
  if (index === undefined) {
    index = new Map(facts.rows.map((row) => [keyTextOf(facts.key.map((k) => row[k])), row]));
    rowsByKey.set(relation, index);
  }

  const value = index.get(keyTextOf(args))?.[field];

  return Option.getOrUndefined(datumOf(value));
};

/**
 * Read the completions of a key prefix in a closed relation, as `C.row(…)` does: the set of the
 * values the one key field the prefix leaves open takes among the tuples that start with it, empty
 * where none does.
 *
 * @param relation - The relation's name.
 * @param args - The prefix's values, in key order.
 * @returns The set.
 */
const closedRow = (relation: string, args: readonly Datum[]): ReadonlySet<string> => {
  const facts = closedFacts.get(relation);
  if (facts === undefined) {
    return new Set();
  }

  const label = `${relation}/${String(args.length)}`;
  let index = completions.get(label);
  if (index === undefined) {
    const built = new Map<string, Set<string>>();
    const open = facts.key[args.length] ?? "";
    for (const row of facts.rows) {
      const prefix = keyTextOf(facts.key.slice(0, args.length).map((k) => row[k]));
      const held = built.get(prefix) ?? new Set<string>();
      held.add(String(row[open]));
      built.set(prefix, held);
    }

    index = built;
    completions.set(label, index);
  }

  return index.get(keyTextOf(args)) ?? new Set();
};

/**
 * The patterns `Compute.matches` reads, compiled once each: `str.regex`'s grammar under `u`,
 * anchored by `^` and `$`, as grizzle's agent guide states it.
 */
const compiled = new Map<string, RegExp>();

/**
 * Test a text against a pattern `Compute.matches` reads.
 *
 * @param text - The text.
 * @param pattern - The pattern.
 * @returns Whether the text matches it.
 */
const matches = (text: string, pattern: string): boolean => {
  let regex = compiled.get(pattern);
  if (regex === undefined) {
    regex = new RegExp(pattern, "u");
    compiled.set(pattern, regex);
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
 * Order two data of one ordered type, a text or a natural.
 *
 * @param left - One datum.
 * @param right - The other.
 * @returns Negative, zero or positive as `left` sorts before, with or after `right`; none for two
 *   data that are not both texts or both naturals.
 */
const ordered = (left: Datum, right: Datum): number | undefined => {
  if (Predicate.isBigInt(left) && Predicate.isBigInt(right)) {
    return left < right ? -1 : Number(left > right);
  }

  if (Predicate.isString(left) && Predicate.isString(right)) {
    return left < right ? -1 : Number(left > right);
  }

  return undefined;
};

/**
 * Compare two data as a `compare` term's operator does.
 *
 * @param op - The operator: `eq`, `ne`, `lt`, `le`, `gt` or `ge`.
 * @param left - The left datum.
 * @param right - The right datum.
 * @returns The comparison, unknown for an operator or a pair of types it does not order.
 */
const compared = (op: string, left: Datum, right: Datum): boolean | undefined => {
  if (op === "eq" || op === "ne") {
    return equal(left, right) === (op === "eq");
  }

  const order = ordered(left, right);
  if (order === undefined) {
    return undefined;
  }

  const byOp: Readonly<Record<string, boolean>> = {
    ge: order >= 0,
    gt: order > 0,
    le: order <= 0,
    lt: order < 0,
  };

  return byOp[op];
};

/**
 * Apply one `Compute` function a copy's predicate reads to its arguments' values.
 *
 * @param fn - The function: `subset`, `union`, `matches`, `startsWith` or `endsWith`.
 * @param args - Its arguments' values.
 * @returns Its value, unknown for any other function or arguments of other types.
 */
const computed = (fn: string, args: readonly Datum[]): Datum | undefined => {
  const [left, right] = args;
  if (left === undefined || right === undefined) {
    return undefined;
  }

  if (left instanceof Set && right instanceof Set) {
    if (fn === "subset") {
      return [...left].every((member) => right.has(member));
    }

    return fn === "union" ? new Set([...left, ...right]) : undefined;
  }

  if (Predicate.isString(left) && Predicate.isString(right)) {
    const byFn: Readonly<Record<string, () => boolean>> = {
      endsWith: () => left.endsWith(right),
      matches: () => matches(left, right),
      startsWith: () => left.startsWith(right),
    };

    return byFn[fn]?.();
  }

  return undefined;
};

/**
 * Evaluate the operands of a term, each known or the whole unknown.
 *
 * @param terms - The operands.
 * @param value - Evaluates one operand.
 * @returns Their values, none when any is unknown.
 */
const allKnown = (
  terms: readonly Term[],
  value: (term: Term) => Datum | undefined,
): readonly Datum[] | undefined => {
  const values: Datum[] = [];
  for (const term of terms) {
    const known = value(term);
    if (known === undefined) {
      return undefined;
    }

    values.push(known);
  }

  return values;
};

/**
 * Evaluate a term over a row in SQL's three-valued logic: a field the row does not know, a closed
 * read at a key its relation holds no tuple at, and any opaque term are unknown, `and`, `or` and
 * `not` are Kleene's, and every other operation of an unknown operand is unknown. `forced` is a
 * comparison read as false wherever it occurs.
 *
 * @param term - The term.
 * @param row - The row's known fields.
 * @param forced - The comparison to read as false, none for none.
 * @returns Its value, unknown as `undefined`.
 */
const evaluate = (
  term: Term,
  row: Readonly<Record<string, Datum>>,
  forced?: (term: Term) => boolean,
): Datum | undefined => {
  const value = (at: Term): Datum | undefined => evaluate(at, row, forced);
  switch (term.kind) {
    case "literal": {
      return term.value;
    }
    case "field": {
      return Object.hasOwn(row, term.field) ? row[term.field] : undefined;
    }
    case "opaque": {
      return undefined;
    }
    case "and":
    case "or": {
      const decisive = term.kind === "or";
      const values = term.args.map(value);

      if (values.includes(decisive)) {
        return decisive;
      }

      return values.every((held) => held === !decisive) ? !decisive : undefined;
    }
    case "not": {
      const held = value(term.arg);

      return Predicate.isBoolean(held) ? !held : undefined;
    }
    case "compare": {
      if (forced?.(term) === true) {
        return false;
      }

      const sides = allKnown([term.left, term.right], value);

      return sides === undefined ? undefined : compared(term.op, sides[0] ?? "", sides[1] ?? "");
    }
    case "in": {
      const held = value(term.arg);
      if (held === undefined) {
        return undefined;
      }

      const values = term.values.map(value);
      if (values.some((member) => member !== undefined && equal(held, member))) {
        return true;
      }

      return values.includes(undefined) ? undefined : false;
    }
    case "closedAt": {
      const key = allKnown(term.args, value);

      return key === undefined ? undefined : closedAt(term.relation, term.field, key);
    }
    case "closedRow": {
      const key = allKnown(term.args, value);

      return key === undefined ? undefined : closedRow(term.relation, key);
    }
    case "compute": {
      const args = allKnown(term.args, value);

      return args === undefined ? undefined : computed(term.fn, args);
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
  (row: Readonly<Record<string, Datum>>): boolean =>
    Option.match(term, { onNone: () => true, onSome: (held) => evaluate(held, row) === true });

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
  (row: Readonly<Record<string, Datum>>): boolean =>
    evaluate(term, row, equation) === false;

/**
 * Read a statement value grizzle keeps for one side of a law: the relation it reads, its
 * selection's predicate if it is a selection, and its terms.
 *
 * @param side - The side as grizzle keeps it.
 * @returns The side, or none for a value of any other shape.
 */
const sideOf = (
  side: unknown,
): Option.Option<{
  readonly predicate: Option.Option<Term>;
  readonly relation: Readonly<{ fields: Readonly<Record<string, unknown>>; name: string }>;
  readonly terms: readonly string[];
}> => {
  if (
    !Predicate.isObject(side) ||
    !Predicate.hasProperty(side, "source") ||
    !Predicate.isObject(side.source) ||
    !Predicate.hasProperty(side, "terms") ||
    !Array.isArray(side.terms)
  ) {
    return Option.none();
  }

  const { source } = side;
  const relation = Predicate.hasProperty(source, "relation") ? source.relation : source;
  const desc = Predicate.hasProperty(source, "desc") ? source.desc : undefined;
  if (
    !Predicate.isObject(relation) ||
    !Predicate.hasProperty(relation, "name") ||
    !Predicate.isString(relation.name) ||
    !Predicate.hasProperty(relation, "fields") ||
    !Predicate.isObject(relation.fields)
  ) {
    return Option.none();
  }

  return Option.some({
    predicate:
      Predicate.isObject(desc) && Predicate.hasProperty(desc, "predicate")
        ? Option.some(termOf(desc.predicate))
        : Option.none(),
    relation: { fields: relation.fields, name: relation.name },
    terms: side.terms.map((term: unknown) =>
      Predicate.isObject(term) && Predicate.hasProperty(term, "field")
        ? `pred:${String(term.field)}`
        : String(term),
    ),
  });
};

/**
 * Whether a field's type is `keyText`: the type itself, or an accumulator or a generated field of
 * it.
 *
 * @param field - The field as grizzle keeps it.
 * @returns Whether it holds a key text.
 */
export const isKeyText = (field: unknown): boolean =>
  field === keyText ||
  (Predicate.isObject(field) && Predicate.hasProperty(field, "field") && field.field === keyText);

/**
 * Write a side of a law as grizzle's outcome names it.
 *
 * @param side - The side.
 * @param side.relation - The relation it reads.
 * @param side.relation.name - The relation's name.
 * @param side.terms - Its terms, a `pred` one as `pred:field`.
 * @returns The side.
 */
const lawSideOf = (side: {
  readonly relation: { readonly name: string };
  readonly terms: readonly string[];
}): LawSide => ({
  relation: side.relation.name,
  selection: { conjuncts: [] },
  terms: side.terms.map((term) =>
    term.startsWith("pred:")
      ? { field: term.slice("pred:".length), kind: "pred" }
      : { field: term, kind: "field" },
  ),
});

/**
 * Write a law's sides as `src/import/refusal.ts` `lawIdentity` spells them, so a copy is named by
 * the identity its law's outcome has.
 *
 * @param side - The side.
 * @returns Its text.
 */
const sideText = (side: LawSide): string =>
  `${side.relation}(${side.terms.map((term) => (term.kind === "field" ? term.field : `pred(${term.field})`)).join(", ")})`;

/**
 * Write a law's identity as `src/import/refusal.ts` `lawIdentity` does, for the two kinds a copy
 * comes from.
 *
 * @param law - A containment or a fold.
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
 * A copy the derivation could not read: a selection that reads a field the oracle does not know of
 * its row, or a term no part of {@link Term}.
 */
export interface UnreadCopy {
  readonly field: string;
  readonly law: string;
  readonly reason: string;
}

/**
 * Build a document relation's copy, checking that its selection reads only fields the oracle knows
 * of the row, since an unknown one would leave rows the database copies uncounted.
 *
 * @param copy - The copy.
 * @param copy.by - How its statement writes the text.
 * @param copy.field - The `keyText` field that holds it.
 * @param copy.law - Its statement's identity.
 * @param copy.reads - The known field whose value is held.
 * @param copy.source - The document relation it reads.
 * @param copy.term - The selection's or check's predicate.
 * @param copy.test - Decides from the row's known fields whether its text is held.
 * @returns The copy, or why it cannot be read.
 */
const copyOf = (copy: {
  readonly by: CopiedBy;
  readonly field: string;
  readonly law: string;
  readonly reads: string;
  readonly source: DocumentRelation;
  readonly term: Option.Option<Term>;
  readonly test: (row: Readonly<Record<string, Datum>>) => boolean;
}): Result.Result<Unplaced, UnreadCopy> => {
  const known = documentFields[copy.source];
  const unread = (reason: string): Result.Result<Unplaced, UnreadCopy> =>
    Result.fail({ field: copy.field, law: copy.law, reason });
  if (!known.has(copy.reads)) {
    return unread(`it holds ${copy.source}.${copy.reads}, which the oracle does not know`);
  }

  const reads = Option.match(copy.term, {
    onNone: () => ({ fields: [], opaque: [] }),
    onSome: readsOf,
  });
  const unknown = reads.fields.filter((field) => !known.has(field));
  if (copy.by !== "check" && (unknown.length > 0 || reads.opaque.length > 0)) {
    return unread(
      `its selection reads ${[...unknown.map((field) => `${copy.source}.${field}`), ...reads.opaque.map((shape) => `a ${shape} term`)].join(", ")}, which the oracle cannot evaluate`,
    );
  }

  return Result.succeed({
    by: copy.by,
    field: copy.field,
    holds: copy.test,
    law: copy.law,
    reads: copy.reads,
    source: copy.source,
  } as Unplaced);
};

/**
 * List the copies one containment's direction makes of a document's text into a key text: each
 * pair of terms whose source field is no key text and whose target field is.
 *
 * @param from - The side whose tuples are contained.
 * @param to - The side they are among.
 * @returns The copies, each read or why it cannot be.
 */
const containedCopies = (
  from: unknown,
  to: unknown,
): readonly Result.Result<Unplaced, UnreadCopy>[] =>
  Option.match(Option.all([sideOf(from), sideOf(to)]), {
    onNone: () => [],
    onSome: ([source, target]) => {
      const { name } = source.relation;
      if (!isDocumentRelation(name)) {
        return [];
      }

      const law = identityOf({ from: lawSideOf(source), kind: "contained", to: lawSideOf(target) });

      return source.terms.flatMap((term, at) => {
        const held = target.terms[at] ?? "";

        return isKeyText(target.relation.fields[held]) && !isKeyText(source.relation.fields[term])
          ? [
              copyOf({
                by: "contained",
                field: `${target.relation.name}.${held}`,
                law,
                reads: term,
                source: name,
                term: source.predicate,
                test: selectedBy(source.predicate),
              }),
            ]
          : [];
      });
    },
  });

/**
 * List the copy a fold makes: a `Monoid.concat` fold into a `keyText` accumulator whose members are
 * rows of a document relation holds its owner's end where a member it steps steps.
 *
 * @param statement - The fold as grizzle keeps it.
 * @returns The copy, read or why it cannot be; none for a fold of any other shape.
 */
const foldCopies = (statement: object): readonly Result.Result<Unplaced, UnreadCopy>[] => {
  if (
    !Predicate.hasProperty(statement, "step") ||
    !Predicate.hasProperty(statement, "end") ||
    !Predicate.hasProperty(statement, "monoid") ||
    !Predicate.hasProperty(statement, "family") ||
    !Predicate.isObject(statement.family) ||
    !Predicate.hasProperty(statement.family, "slots") ||
    !Predicate.isObject(statement.family.slots)
  ) {
    return [];
  }

  const { slots } = statement.family;
  const monoid =
    Predicate.isObject(statement.monoid) && Predicate.hasProperty(statement.monoid, "name")
      ? String(statement.monoid.name)
      : "";
  const owner =
    Predicate.hasProperty(slots, "owner") &&
    Predicate.isObject(slots.owner) &&
    Predicate.hasProperty(slots.owner, "name")
      ? String(slots.owner.name)
      : "";
  const count = Predicate.hasProperty(slots, "count") ? String(slots.count) : "";

  return Option.match(Option.all([sideOf(statement.step), sideOf(statement.end)]), {
    onNone: () => [],
    onSome: ([step, end]) => {
      const held = end.terms.at(-1) ?? "";
      const { name } = step.relation;
      if (
        monoid !== "concat" ||
        !isKeyText(end.relation.fields[held]) ||
        !isDocumentRelation(name) ||
        end.relation.name !== name
      ) {
        return [];
      }

      return [
        copyOf({
          by: "fold",
          field: `${end.relation.name}.${held}`,
          law: identityOf({
            end: lawSideOf(end),
            family: { count, owner },
            kind: "fold",
            monoid,
            step: lawSideOf(step),
          }),
          reads: held,
          source: name,
          term: step.predicate,
          test: selectedBy(step.predicate),
        }),
      ];
    },
  });
};

/**
 * List the copies a check makes on a document relation: each equation of a field of no `keyText`
 * type with a `keyText` field of the same row, which the row must hold where the rest of the check
 * leaves it no other way to.
 *
 * @param statement - The check as grizzle keeps it.
 * @returns The copies, each read or why it cannot be.
 */
const checkCopies = (statement: object): readonly Result.Result<Unplaced, UnreadCopy>[] => {
  const relation =
    Predicate.hasProperty(statement, "relation") && Predicate.isObject(statement.relation)
      ? statement.relation
      : {};
  const desc = Predicate.hasProperty(statement, "desc") ? statement.desc : undefined;
  const name =
    Predicate.hasProperty(relation, "name") && Predicate.isString(relation.name)
      ? relation.name
      : "";
  const fields =
    Predicate.hasProperty(relation, "fields") && Predicate.isObject(relation.fields)
      ? (relation.fields as Readonly<Record<string, unknown>>)
      : {};
  if (
    !isDocumentRelation(name) ||
    !Predicate.isObject(desc) ||
    !Predicate.hasProperty(desc, "predicate")
  ) {
    return [];
  }

  const check =
    Predicate.hasProperty(desc, "name") && Predicate.isString(desc.name) ? desc.name : "";
  const predicate = termOf(desc.predicate);
  const equations: { readonly held: string; readonly read: string }[] = [];
  const walk = (term: Term): void => {
    if (
      term.kind === "compare" &&
      term.op === "eq" &&
      term.left.kind === "field" &&
      term.right.kind === "field"
    ) {
      const [left, right] = [term.left.field, term.right.field];
      if (isKeyText(fields[left]) !== isKeyText(fields[right])) {
        equations.push(
          isKeyText(fields[left]) ? { held: left, read: right } : { held: right, read: left },
        );
      }
    }

    switch (term.kind) {
      case "and":
      case "or":
      case "closedRow":
      case "compute":
      case "closedAt": {
        term.args.forEach(walk);
        break;
      }
      case "not": {
        walk(term.arg);
        break;
      }
      case "in": {
        walk(term.arg);
        term.values.forEach(walk);
        break;
      }
      case "compare": {
        walk(term.left);
        walk(term.right);
        break;
      }
      default: {
        break;
      }
    }
  };
  walk(predicate);

  return Arr.dedupeWith(equations, (a, b) => a.held === b.held && a.read === b.read).map(
    ({ held, read }) =>
      copyOf({
        by: "check",
        field: `${name}.${held}`,
        law: `check ${check} on ${name}: ${read} = ${held}`,
        reads: read,
        source: name,
        term: Option.some(predicate),
        test: forcedBy(
          predicate,
          (term) =>
            term.kind === "compare" &&
            term.op === "eq" &&
            term.left.kind === "field" &&
            term.right.kind === "field" &&
            new Set([term.left.field, term.right.field]).size === 2 &&
            [term.left.field, term.right.field].includes(held) &&
            [term.left.field, term.right.field].includes(read),
        ),
      }),
  );
};

/**
 * List the copies one statement makes of a document's text into a key text.
 *
 * @param statement - The statement as grizzle keeps it.
 * @returns Its copies, each read or why it cannot be.
 */
const statementCopies = (statement: unknown): readonly Result.Result<Unplaced, UnreadCopy>[] => {
  if (!Predicate.isObject(statement) || !Predicate.hasProperty(statement, "kind")) {
    return [];
  }

  switch (statement.kind) {
    case "contained": {
      return Predicate.hasProperty(statement, "left") && Predicate.hasProperty(statement, "right")
        ? containedCopies(statement.left, statement.right)
        : [];
    }
    case "mirrors": {
      return Predicate.hasProperty(statement, "left") && Predicate.hasProperty(statement, "right")
        ? [
            ...containedCopies(statement.left, statement.right),
            ...containedCopies(statement.right, statement.left),
          ]
        : [];
    }
    case "fold": {
      return foldCopies(statement);
    }
    case "check": {
      return checkCopies(statement);
    }
    default: {
      return [];
    }
  }
};

/**
 * Read every copy the schema makes of a document's text into a key text, from its statements, in
 * their order.
 *
 * @param statements - The schema's statements as grizzle keeps them.
 * @returns Each copy, read or why it cannot be.
 */
export const copiesOf = (
  statements: readonly unknown[],
): readonly Result.Result<KeyCopy, UnreadCopy>[] =>
  statements.flatMap((statement, at) =>
    statementCopies(statement).map(
      Result.map((copy): KeyCopy => ({ ...copy, statement: at }) as KeyCopy),
    ),
  );

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
