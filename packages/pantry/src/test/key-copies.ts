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
 * evaluated on the host in SQL's three-valued logic (`#pantry/host/predicates.ts`, which reads no
 * schema of its own), over the fields the oracle knows of a row ({@link attributeFields},
 * {@link nodeFields}).
 */
import type { Law, LawSide } from "@bjornpagen/grizzle";
import { Array as Arr, Option, Predicate, Result, Schema } from "effect";
import {
  closedOf,
  evaluate,
  fieldsOf,
  forcedBy,
  lawSideOf,
  selectedBy,
  sourceOf,
  StatementSchema,
  subtermsOf,
  termOf,
} from "#pantry/host/predicates.ts";
import type { Datum, Row, StoredSide, StoredStatement, Term } from "#pantry/host/predicates.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The fields of an `Attribute` row the oracle knows before the database writes it: its owner's
 * kind, version, governor and document's type, its name and its lexical form.
 */
export const attributeFields = [
  "documentType",
  "governor",
  "kind",
  "lexical",
  "name",
  "version",
] as const;

/**
 * The fields of a `Node` row the oracle knows before the database writes it: its own kind, version,
 * governor, start and characters, its document's type, its parent's kind and governor, its
 * grandparent's kind, and its string value.
 */
export const nodeFields = [
  "chars",
  "documentType",
  "governor",
  "kind",
  "parentGovernor",
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
 * A statement's kind, read before its shape.
 */
const KindSchema = Schema.Struct({ kind: Schema.String });

/**
 * The kinds of statement a copy comes from, each of which {@link StatementSchema} must read.
 */
const copyKinds: ReadonlySet<string> = new Set(["check", "contained", "fold", "mirrors"]);

/**
 * The composed `Qti`'s closed relations, which a copy's selection and a check's closed reads look
 * up.
 */
const closed = closedOf(Qti.relations);

/**
 * Write one term of a law side: a field as its name, `pred` of a field as `pred(field)`.
 *
 * @param term - The term.
 * @returns Its text.
 */
const termText = (term: LawSide["terms"][number]): string =>
  term.kind === "pred" ? `pred(${term.field})` : term.field;

/**
 * Write a law side as {@link identityOf} spells it: its relation and its terms, `pred` of a field as
 * `pred(field)`, its selection left out.
 *
 * @param side - The side.
 * @returns Its text.
 */
const sideText = (side: LawSide): string =>
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
            test: selectedBy(source.predicate, closed),
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
      test: selectedBy(step.predicate, closed),
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
    test: forcedBy(
      predicate,
      (term) =>
        Option.exists(
          equationOf(name, term),
          (equation) => equation.held === held && equation.reads === reads,
        ),
      closed,
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
 * Read a check the schema states as the value its predicate takes over a row, from the predicate
 * grizzle keeps for it, in SQL's three-valued logic: true, false, or unknown (`undefined`) where it
 * reads a field the row does not hold, a closed read at a key no row holds, or a term the host does
 * not read (`#pantry/host/predicates.ts`).
 *
 * @param statements - The schema's statements.
 * @param relation - The check's relation.
 * @param name - The check's name.
 * @returns The predicate's value over a row; none where the schema states no such check, or states
 *   it in a shape this module does not read.
 */
export const checkValueOf = (
  statements: typeof Qti.statements,
  relation: string,
  name: string,
): Option.Option<(row: Readonly<Record<string, Datum>>) => Datum | undefined> =>
  Arr.findFirst(statements, (statement) =>
    Option.match(Schema.decodeUnknownOption(StatementSchema)(statement), {
      onNone: () => Option.none(),
      onSome: (read) =>
        read.kind === "check" && read.relation.name === relation && read.desc.name === name
          ? Option.some((row: Readonly<Record<string, Datum>>) =>
              evaluate(termOf(read.desc.predicate), row, () => false, closed),
            )
          : Option.none(),
    }),
  );

/**
 * Judge rows by a check the schema states ({@link checkValueOf}): a row is refused where the
 * predicate is false and kept where it is true or unknown, a field the row does not hold being
 * unknown.
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
  Option.map(
    checkValueOf(statements, relation, name),
    (value) => (row: Readonly<Record<string, Datum>>) => value(row) !== false,
  );
