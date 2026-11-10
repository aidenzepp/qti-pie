/**
 * The import's rows as the database holds them, rebuilt on the host from a program's inputs by the
 * schema's own statements, and judged by every law of the schema the host can read: each
 * containment and each half of a `mirrors`, each key and each check (`#pantry/test/judged-laws.ts`
 * `judgedLaws`).
 *
 * A program writes each row without the values grizzle fills, and nests a sequence's members under
 * their owner (`#pantry/import/write.ts`). {@link hostRowsOf} restores what grizzle's README says
 * it fills ("Families"), from the statements alone:
 *
 * - **a sequence's members**, each an ordered family's or a tree's, as rows of their own relation,
 *   their group the owner's primary key and their index their place, a tree's member its parent's
 *   child under its root's root field, the tree's root its own parent;
 * - **every count**: an ordered family's or a tree's members, a counted family's by its group, and a
 *   tree's pre-order interval `[start, end)`;
 * - **each fold** of `Monoid.count`, `Monoid.or`, `Monoid.concat`, `Monoid.sum` or `Monoid.max`: its
 *   owner's end, and its members' running values in slot order, a member its step's selection does
 *   not hold stepping by the identity;
 * - **each copy along a family's axis**: an accumulated field of a member that a containment pairs,
 *   beside the member's group and the owner's primary key, with a field of the owner;
 * - **each copy along a predecessor or a last axis**: an accumulated field a containment pairs, by
 *   `pred` of an ordered family's or a tree's index or count, with a field of the member before a
 *   member or of an owner's last member, the field's start (`accumulated(type, start)`, kept in the
 *   relation's description) where there is none, at a first member or an owner of no members;
 * - **each field PostgreSQL generates** (`relation.generated`): its term, as grizzle keeps it in the
 *   relation's description, evaluated over the row's written fields as a predicate is
 *   (`#pantry/test/key-copies.ts` `generatedFields`).
 *
 * What it does not restore stays absent: a tree root's copies along the axis, whose start values
 * grizzle keeps in its own field builders; a generated field whose term holds one the evaluator
 * does not read, a cast or a conditional. A float is read as grizzle's `float8` stores it, -0 as 0.
 * A law that reads an absent value on a row it reads is not judged, and {@link judge} names it with
 * every absent value, so a skip is always named by its cause.
 *
 * A check is judged as PostgreSQL holds it: grizzle emits `CHECK ((…) IS TRUE)`, so a row whose
 * every read value the host holds breaks the check where its predicate is false or unknown, unknown
 * being SQL's NULL, such as a closed read at a key no row holds (decision 442).
 */
import type { Law } from "@bjornpagen/grizzle";
import { Option, Order, Predicate, Schema } from "effect";
import type { PackageInputs } from "#pantry/import/write.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { judgedLaws } from "#pantry/test/judged-laws.ts";
import {
  closedRows,
  datumText,
  floatDatum,
  generatedFields,
  judgedSideOf,
  SideSchema,
} from "#pantry/test/key-copies.ts";
import type { Datum, JudgedLaw, JudgedSide } from "#pantry/test/key-copies.ts";

/**
 * A row as the host holds it: each of its fields' values that is a datum.
 */
export type HostRow = Readonly<Record<string, Datum>>;

/**
 * A row as the host fills it.
 */
type FilledRow = Record<string, Datum>;

/**
 * Every relation's rows as the database holds them, by relation.
 */
export type HostRows = ReadonlyMap<string, readonly HostRow[]>;

/**
 * A stored relation as its descriptor holds it: its primary key, and each field's descriptor, whose
 * writing grizzle or PostgreSQL writes it by ({@link writingOf}). A field's descriptor is any
 * value: a `pg` scalar such as `pg.float8` is a function as well as a descriptor.
 */
const RelationSchema = Schema.Struct({
  heading: Schema.Record(Schema.String, Schema.Unknown),
  kind: Schema.Literal("relation"),
  name: Schema.String,
  primaryKey: Schema.Array(Schema.String),
});

/**
 * Read how a field is written, where grizzle or PostgreSQL writes it: its descriptor's `writing`.
 *
 * @param descriptor - The field's descriptor.
 * @returns The writing, none for a field its caller writes.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A heading's descriptor is any value; this reads the one property it may hold.
const writingOf = (descriptor: unknown): Option.Option<string> =>
  Predicate.hasProperty(descriptor, "writing") && Predicate.isString(descriptor.writing)
    ? Option.some(descriptor.writing)
    : Option.none();

/**
 * The kinds of schema member the host reads elsewhere than as a stored relation, each with why: a
 * roster and a closed relation are constants, read by `closedRows` of `#pantry/test/key-copies.ts`.
 */
const readElsewhere: ReadonlyMap<string, string> = new Map([
  ["closed", "a roster, whose handles a closed relation's rows hold"],
  ["closedRelation", "a closed relation, read by closedRows"],
]);

/**
 * A stored relation as the host models it: its primary key and its fields' writings.
 */
interface Modelled {
  readonly key: readonly string[];
  readonly writing: ReadonlyMap<string, string>;
}

/**
 * Read every member of a schema the host models: each stored relation's primary key and its
 * fields' writings, by name. A member the host can read neither as a stored relation nor as
 * a kind it reads elsewhere ({@link readElsewhere}) fails loudly, by name, since a relation that
 * vanished from the host's model would leave every law over it unjudged without a word.
 *
 * @param members - The schema's members, `Qti.relations`' values.
 * @returns The stored relations by name.
 * @throws {Error} Naming each member the host cannot read: a defect of the host judge, which must
 *   learn the member's shape before it judges a schema that holds it.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A schema's members are read here, by their shape.
export const modelledRelations = (members: readonly unknown[]): ReadonlyMap<string, Modelled> => {
  const modelled = new Map<string, Modelled>();
  const unread: string[] = [];
  for (const member of members) {
    const decoded = Schema.decodeUnknownOption(RelationSchema)(member);
    if (Option.isSome(decoded)) {
      const { heading, name, primaryKey } = decoded.value;
      modelled.set(name, {
        key: primaryKey,
        writing: new Map(
          Object.entries(heading).flatMap(([field, descriptor]) =>
            Option.match(writingOf(descriptor), {
              onNone: () => [],
              onSome: (writing) => [[field, writing] as const],
            }),
          ),
        ),
      });
      continue;
    }

    const kind =
      Predicate.hasProperty(member, "kind") && Predicate.isString(member.kind) ? member.kind : "";
    if (!readElsewhere.has(kind)) {
      unread.push(
        Predicate.hasProperty(member, "name") && Predicate.isString(member.name)
          ? `${member.name} (${kind === "" ? "no kind" : kind})`
          : `a member of no name (${kind === "" ? "no kind" : kind})`,
      );
    }
  }

  if (unread.length > 0) {
    throw new Error(
      `The host judge cannot read ${unread.join(", ")}: each is neither a stored relation it models nor a kind it reads elsewhere, so every law over it would go unjudged. Teach host-judge.ts the member's shape, or name its kind in readElsewhere with why.`,
    );
  }

  return modelled;
};

/**
 * Each stored relation's primary key and its fields' writings, by name.
 */
const relations = modelledRelations(Object.values(Qti.relations));

/**
 * Read a relation's primary key.
 *
 * @param relation - The relation's name.
 * @returns Its key's fields, none for a relation the schema does not store.
 */
const keyOf = (relation: string): readonly string[] => relations.get(relation)?.key ?? [];

/**
 * A family as grizzle keeps it: its kind, its member's side, its slots and a tree's root field.
 */
const FamilySchema = Schema.Struct({
  family: SideSchema,
  kind: Schema.Literals(["counted", "ordered", "tree"]),
  root: Schema.optionalKey(Schema.String),
  slots: Schema.Struct({ count: Schema.String, owner: Schema.Struct({ name: Schema.String }) }),
});

/**
 * A fold as grizzle keeps it: its family, its monoid, its step and its end.
 */
const FoldSchema = Schema.Struct({
  end: SideSchema,
  family: FamilySchema,
  kind: Schema.Literal("fold"),
  monoid: Schema.Struct({ name: Schema.String }),
  step: SideSchema,
});

/**
 * A family as the host fills it: its member, its owner and the owner's count, the member's group in
 * the order the owner's primary key pairs it, an ordered family's or a tree's index, and a tree's
 * root field.
 */
interface Family {
  readonly count: string;
  readonly group: readonly string[];
  readonly index: Option.Option<string>;
  readonly kind: "counted" | "ordered" | "tree";
  readonly member: string;
  readonly owner: string;
  readonly root: Option.Option<string>;
}

/**
 * Read a family statement.
 *
 * @param read - The statement.
 * @returns The family.
 */
const familyOf = (read: typeof FamilySchema.Type): Family => {
  const side = judgedSideOf(read.family);
  const terms = side.law.terms.map(({ field }) => field);
  const indexed = read.kind !== "counted";

  return {
    count: read.slots.count,
    group: indexed ? terms.slice(0, -1) : terms,
    index: indexed ? Option.fromUndefinedOr(terms.at(-1)) : Option.none(),
    kind: read.kind,
    member: side.relation,
    owner: read.slots.owner.name,
    root: Option.fromUndefinedOr(read.root),
  };
};

/**
 * Every family the schema states, in statement order.
 */
const families: readonly Family[] = Qti.statements.flatMap((statement) =>
  Option.match(Schema.decodeUnknownOption(FamilySchema)(statement), {
    onNone: () => [],
    onSome: (read) => [familyOf(read)],
  }),
);

/**
 * A fold as the host fills it: its family, its monoid, its step's side, the step's value field and
 * running pair where it names them, and the owner's end field.
 */
interface Fold {
  readonly end: string;
  readonly family: Family;
  readonly monoid: string;
  readonly running: Option.Option<readonly [string, string]>;
  readonly step: JudgedSide;
  readonly value: Option.Option<string>;
}

/**
 * Every fold the schema states, in statement order.
 */
const folds: readonly Fold[] = Qti.statements.flatMap((statement) =>
  Option.match(Schema.decodeUnknownOption(FoldSchema)(statement), {
    onNone: () => [],
    onSome: (read): readonly Fold[] => {
      const family = familyOf(read.family);
      const step = judgedSideOf(read.step);
      const end = judgedSideOf(read.end);

      const rest = step.law.terms.slice(family.group.length).map(({ field }) => field);
      const valued = read.monoid.name === "count" ? [] : rest.slice(0, 1);
      const [before, after] = rest.slice(valued.length);
      const endField = end.law.terms.at(-1)?.field;

      return endField === undefined
        ? []
        : [
            {
              end: endField,
              family,
              monoid: read.monoid.name,
              running:
                before === undefined || after === undefined
                  ? Option.none()
                  : Option.some([before, after] as const),
              step,
              value: Option.fromUndefinedOr(valued[0]),
            },
          ];
    },
  }),
);

/**
 * The fields the folds fill, as `Relation.field`: each end and each running pair.
 */
const foldFilled: ReadonlySet<string> = new Set(
  folds.flatMap((fold) => [
    `${fold.family.owner}.${fold.end}`,
    ...Option.match(fold.running, {
      onNone: () => [],
      onSome: ([before, after]) => [
        `${fold.family.member}.${before}`,
        `${fold.family.member}.${after}`,
      ],
    }),
  ]),
);

/**
 * Whether a value is a datum the host judges: a text, a natural, a float, a truth value or a set
 * of handles.
 *
 * @param value - The value.
 * @returns Whether it is a datum.
 */
const isDatum = (value: unknown): value is Datum =>
  Predicate.isString(value) ||
  Predicate.isBigInt(value) ||
  Predicate.isNumber(value) ||
  Predicate.isBoolean(value) ||
  (value instanceof Set && [...value].every(Predicate.isString));

/**
 * A stored relation's description as grizzle keeps it, for its accumulated fields: each field's
 * writing, an accumulated field's with the start it holds at its axis's base.
 */
const StartsSchema = Schema.Struct({
  desc: Schema.Struct({
    fields: Schema.Record(
      Schema.String,
      Schema.Struct({
        writing: Schema.Struct({ kind: Schema.String, start: Schema.optionalKey(Schema.Unknown) }),
      }),
    ),
  }),
  name: Schema.String,
});

/**
 * The start of each accumulated field of a stored relation of the schema, as `Relation.field`, read
 * from the relation's description (`accumulated(type, start)`). A description is read strictly, so
 * a shape grizzle changes fails here, by its decode.
 */
const starts: ReadonlyMap<string, Datum> = new Map(
  Object.values(Qti.relations).flatMap((member) => {
    if (!Predicate.hasProperty(member, "kind") || member.kind !== "relation") {
      return [];
    }

    const { desc, name } = Schema.decodeUnknownSync(StartsSchema)(member);

    return Object.entries(desc.fields).flatMap(([field, { writing }]) => {
      const { start } = writing;

      return writing.kind === "accumulated" && isDatum(start)
        ? [[`${name}.${field}`, Predicate.isNumber(start) ? floatDatum(start) : start] as const]
        : [];
    });
  }),
);

/**
 * A row as a program writes it, its fields unread.
 */
const WrittenRow = Schema.Record(Schema.String, Schema.Unknown);

/**
 * A program's written rows as the boundary reads them: each relation's keyed set.
 */
const WrittenInputs = Schema.Record(Schema.String, Schema.ReadonlyMap(Schema.String, WrittenRow));

/**
 * Write the text of a row's values at some fields, the key a family groups its members by.
 *
 * @param row - The row.
 * @param fields - The fields.
 * @returns The text.
 */
const keyText = (row: HostRow, fields: readonly string[]): string =>
  fields.map((field) => datumText(row[field])).join("\u001F");

/**
 * A sequence's members as a program nests them at their owner's count field.
 */
const WrittenMembers = Schema.Array(WrittenRow);

/**
 * Index a relation's rows by the text of their values at some fields.
 *
 * @param held - The rows.
 * @param fields - The fields.
 * @returns The rows at each key's text.
 */
const indexed = (
  held: readonly FilledRow[],
  fields: readonly string[],
): ReadonlyMap<string, readonly FilledRow[]> => {
  const index = new Map<string, FilledRow[]>();
  for (const row of held) {
    const at = keyText(row, fields);
    const rows = index.get(at);
    if (rows === undefined) {
      index.set(at, [row]);
    } else {
      rows.push(row);
    }
  }

  return index;
};

/**
 * Whether a row is a tree's root, its own parent, which no family of its owner holds.
 *
 * @param family - The family.
 * @param row - The member's row.
 * @returns Whether the row is a root of the family's tree.
 */
const isRoot = (family: Family, row: HostRow): boolean =>
  family.kind === "tree" &&
  row[family.group[0] ?? ""] !== undefined &&
  row[family.group[0] ?? ""] === row[keyOf(family.owner)[0] ?? ""];

/**
 * Fill each counted family's count on its owners: its members by their group.
 *
 * @param rows - Every relation's rows.
 */
const countFamilies = (rows: ReadonlyMap<string, FilledRow[]>): void => {
  for (const family of families.filter(({ kind }) => kind === "counted")) {
    const members = indexed(rows.get(family.member) ?? [], family.group);
    for (const owner of rows.get(family.owner) ?? []) {
      owner[family.count] = BigInt(members.get(keyText(owner, keyOf(family.owner)))?.length ?? 0);
    }
  }
};

/**
 * A copy along a family's axis: the family, and each accumulated field of its member a containment
 * pairs with a field of its owner, beside the member's group paired with the owner's primary key.
 */
interface AxisCopy {
  readonly family: Family;
  readonly pairs: readonly (readonly [string, string])[];
}

/**
 * A law side's term that reads a field as it is: no `pred` term.
 */
type FieldTerm = Extract<JudgedSide["law"]["terms"][number], { readonly kind: "field" }>;

/**
 * Test whether a law side's term reads a field as it is.
 *
 * @param term - The term.
 * @returns Whether it is a field term.
 */
const isFieldTerm = (term: JudgedSide["law"]["terms"][number]): term is FieldTerm =>
  term.kind === "field";

/**
 * Read a containment as copies along a family's axis, where it is one.
 *
 * @param law - The containment.
 * @returns The copies; none for a containment that rides no family's axis or copies nothing.
 */
const axisCopiesOf = (
  law: Extract<JudgedLaw, { readonly kind: "contained" }>,
): readonly AxisCopy[] =>
  families.flatMap((family) => {
    const from = law.from.law.terms.filter(isFieldTerm);
    const to = law.to.law.terms.filter(isFieldTerm);
    const ownerKey = keyOf(family.owner);
    if (
      family.member !== law.from.relation ||
      family.owner !== law.to.relation ||
      law.to.reads.length > 0 ||
      from.length !== law.from.law.terms.length ||
      to.length !== law.to.law.terms.length
    ) {
      return [];
    }

    const positions = family.group.map((field, index) =>
      from.findIndex((term, at) => term.field === field && to[at]?.field === ownerKey[index]),
    );
    const grouped = new Set(positions);
    if (grouped.has(-1)) {
      return [];
    }

    const writing = relations.get(family.member)?.writing;
    const pairs = from.flatMap((term, at) => {
      const target = to[at]?.field;

      return target === undefined ||
        grouped.has(at) ||
        writing?.get(term.field) !== "accumulated" ||
        foldFilled.has(`${family.member}.${term.field}`)
        ? []
        : [[term.field, target] as const];
    });

    return pairs.length === 0 ? [] : [{ family, pairs }];
  });

/**
 * Every copy along a family's axis the schema's containments state.
 *
 * @param laws - The laws the host judges.
 * @returns The copies.
 */
const axisCopies = (laws: readonly JudgedLaw[]): readonly AxisCopy[] =>
  laws.flatMap((law) => (law.kind === "contained" ? axisCopiesOf(law) : []));

/**
 * Fill each copy along a family's axis the host does not hold yet, from its owner's row.
 *
 * @param rows - Every relation's rows.
 * @param copies - The copies.
 * @returns How many values it filled.
 */
const copyAlong = (rows: ReadonlyMap<string, FilledRow[]>, copies: readonly AxisCopy[]): number => {
  let filled = 0;
  for (const { family, pairs } of copies) {
    const owners = indexed(rows.get(family.owner) ?? [], keyOf(family.owner));
    for (const member of rows.get(family.member) ?? []) {
      const owner = owners.get(keyText(member, family.group))?.[0];
      if (owner === undefined || isRoot(family, member)) {
        continue;
      }

      for (const [field, source] of pairs) {
        const value = owner[source];
        if (member[field] === undefined && value !== undefined) {
          member[field] = value;
          filled += 1;
        }
      }
    }
  }

  return filled;
};

/**
 * A copy along a predecessor or a last axis of a family: the axis, the family, the containment's
 * sides' selections, and each accumulated field of the copying row with the member's field it
 * copies and its start. On the predecessor axis a member copies the member before it, the start at
 * its first; on the last axis an owner copies its last member, the start where it has none.
 */
interface StepCopy {
  readonly axis: "last" | "predecessor";
  readonly family: Family;
  readonly from: JudgedSide;
  readonly pairs: readonly (readonly [string, string, Datum])[];
  readonly to: JudgedSide;
}

/**
 * Read a containment as copies along a predecessor or a last axis, where it is one: its target
 * reads a member of an ordered family or a tree by its group and index, and its source pairs the
 * group with the member's own group (predecessor) or the owner's primary key (last), and `pred` of
 * the index or of the owner's count with the index.
 *
 * @param law - The containment.
 * @returns The copies; none for a containment that rides no such axis or copies nothing.
 */
const stepCopiesOf = (
  law: Extract<JudgedLaw, { readonly kind: "contained" }>,
): readonly StepCopy[] =>
  families.flatMap((family) => {
    const from = law.from.law.terms;
    const to = law.to.law.terms.filter(isFieldTerm);
    if (
      Option.isNone(family.index) ||
      family.member !== law.to.relation ||
      to.length !== law.to.law.terms.length ||
      from.length !== to.length
    ) {
      return [];
    }

    const stepped = from.flatMap((term, at) => (term.kind === "pred" ? [{ at, term }] : []));
    const [step] = stepped;
    if (step === undefined || stepped.length > 1 || to[step.at]?.field !== family.index.value) {
      return [];
    }

    const ownerKey = keyOf(family.owner);
    const predecessor =
      law.from.relation === family.member && step.term.field === family.index.value;
    const last = law.from.relation === family.owner && step.term.field === family.count;
    if (!predecessor && !last) {
      return [];
    }

    const positions = family.group.map((field, index) =>
      from.findIndex(
        (term, at) =>
          isFieldTerm(term) &&
          term.field === (predecessor ? field : ownerKey[index]) &&
          to[at]?.field === field,
      ),
    );
    const grouped = new Set([...positions, step.at]);
    if (grouped.has(-1)) {
      return [];
    }

    const writing = relations.get(law.from.relation)?.writing;
    const pairs = from.flatMap((term, at) => {
      const target = to[at]?.field;
      if (!isFieldTerm(term) || target === undefined || grouped.has(at)) {
        return [];
      }

      const start = starts.get(`${law.from.relation}.${term.field}`);

      return start === undefined ||
        writing?.get(term.field) !== "accumulated" ||
        foldFilled.has(`${law.from.relation}.${term.field}`)
        ? []
        : [[term.field, target, start] as const];
    });

    return pairs.length === 0
      ? []
      : [
          {
            axis: predecessor ? ("predecessor" as const) : ("last" as const),
            family,
            from: law.from,
            pairs,
            to: law.to,
          },
        ];
  });

/**
 * Every copy along a predecessor or a last axis the schema's containments state.
 *
 * @param laws - The laws the host judges.
 * @returns The copies.
 */
const stepCopies = (laws: readonly JudgedLaw[]): readonly StepCopy[] =>
  laws.flatMap((law) => (law.kind === "contained" ? stepCopiesOf(law) : []));

/**
 * Write the text of a member's slot: its group's values and its index, the key
 * {@link stepAlong} finds a member by.
 *
 * @param values - The group's values, then the index.
 * @returns The text.
 */
const slotText = (values: readonly (Datum | undefined)[]): string =>
  values.map(datumText).join("\u001F");

/**
 * Index a family's members by their slot ({@link slotText}), a tree's root, which is no member,
 * left out.
 *
 * @param members - The member relation's rows.
 * @param family - The family.
 * @param index - Its index field.
 * @returns Each member at its slot's text.
 */
const slotsOf = (
  members: readonly FilledRow[],
  family: Family,
  index: string,
): ReadonlyMap<string, FilledRow> =>
  new Map(
    members.flatMap((member) =>
      isRoot(family, member)
        ? []
        : [[slotText([...family.group.map((field) => member[field]), member[index]]), member]],
    ),
  );

/**
 * Fill one copy along a predecessor or a last axis where the host does not hold it yet, on each row
 * its containment's source selects: from the member it names, which the target selects, or the
 * start where it names none. A tree's root is no member and copies nothing along these axes.
 *
 * @param rows - Every relation's rows.
 * @param copy - The copy.
 * @returns How many values it filled.
 */
const stepOne = (rows: ReadonlyMap<string, FilledRow[]>, copy: StepCopy): number => {
  const { axis, family, from, pairs, to } = copy;
  const index = Option.getOrElse(family.index, () => "");
  const slots = slotsOf(rows.get(family.member) ?? [], family, index);
  const predecessor = axis === "predecessor";
  const groupFields = predecessor ? family.group : keyOf(family.owner);
  let filled = 0;
  for (const row of rows.get(predecessor ? family.member : family.owner) ?? []) {
    const place = row[predecessor ? index : family.count];
    if (
      !Predicate.isBigInt(place) ||
      from.selection(row) !== true ||
      (predecessor && isRoot(family, row))
    ) {
      continue;
    }

    const source =
      place === 0n
        ? undefined
        : slots.get(slotText([...groupFields.map((field) => row[field]), place - 1n]));
    if (place !== 0n && (source === undefined || to.selection(source) !== true)) {
      continue;
    }

    for (const [field, target, start] of pairs) {
      const value = source === undefined ? start : source[target];
      if (row[field] === undefined && value !== undefined) {
        row[field] = value;
        filled += 1;
      }
    }
  }

  return filled;
};

/**
 * Fill each copy along a predecessor or a last axis the host does not hold yet ({@link stepOne}).
 *
 * @param rows - Every relation's rows.
 * @param copies - The copies.
 * @returns How many values it filled.
 */
const stepAlong = (rows: ReadonlyMap<string, FilledRow[]>, copies: readonly StepCopy[]): number =>
  copies.reduce((filled, copy) => filled + stepOne(rows, copy), 0);

/**
 * A monoid the host folds: its identity, and its step's combination with the running value, none
 * where the step's value is of another type.
 */
const monoids: ReadonlyMap<
  string,
  {
    readonly combine: (running: Datum, step: Datum | undefined) => Datum | undefined;
    readonly identity: () => Datum;
  }
> = new Map([
  [
    "count",
    {
      combine: (running: Datum) => (Predicate.isBigInt(running) ? running + 1n : undefined),
      identity: () => 0n,
    },
  ],
  [
    "sum",
    {
      combine: (running: Datum, step: Datum | undefined) =>
        Predicate.isBigInt(running) && Predicate.isBigInt(step) ? running + step : undefined,
      identity: () => 0n,
    },
  ],
  [
    "or",
    {
      combine: (running: Datum, step: Datum | undefined) =>
        running instanceof Set && step instanceof Set ? new Set([...running, ...step]) : undefined,
      identity: () => new Set<string>(),
    },
  ],
  [
    "concat",
    {
      combine: (running: Datum, step: Datum | undefined) =>
        Predicate.isString(running) && Predicate.isString(step) ? running + step : undefined,
      identity: () => "",
    },
  ],
  [
    // The greater of the two, from natural's least value: grizzle's max starts from its carrier's
    // least value, and the schema's one max fold, MathML's leaf starts, is over naturals.
    "max",
    {
      combine: (running: Datum, step: Datum | undefined) =>
        Predicate.isBigInt(running) && Predicate.isBigInt(step)
          ? Order.max(Order.BigInt)(running, step)
          : undefined,
      identity: () => 0n,
    },
  ],
]);

/**
 * Fill each fold's end on every owner whose members' steps the host holds, and each member's
 * running pair, in slot order: a member the step's selection does not hold steps by the identity.
 *
 * @param rows - Every relation's rows.
 * @returns How many ends it filled.
 */
const foldAll = (rows: ReadonlyMap<string, FilledRow[]>): number => {
  let filled = 0;
  for (const fold of folds) {
    const monoid = monoids.get(fold.monoid);
    if (monoid === undefined) {
      continue;
    }

    const { family } = fold;
    const members = indexed(
      (rows.get(family.member) ?? []).filter((row) => !isRoot(family, row)),
      family.group,
    );
    const index = Option.getOrUndefined(family.index);
    for (const owner of rows.get(family.owner) ?? []) {
      if (owner[fold.end] !== undefined) {
        continue;
      }

      const slotOf = (row: HostRow): bigint => {
        const at = index === undefined ? undefined : row[index];

        return Predicate.isBigInt(at) ? at : 0n;
      };
      const slots = [...(members.get(keyText(owner, keyOf(family.owner))) ?? [])].toSorted((a, b) =>
        Number(slotOf(a) - slotOf(b)),
      );
      let running: Datum | undefined = monoid.identity();
      for (const member of slots) {
        const stepped = fold.step.unread.length > 0 ? undefined : fold.step.selection(member);
        if (running === undefined || stepped === undefined) {
          running = undefined;
          break;
        }

        const before: Datum = running;
        if (stepped) {
          running = monoid.combine(
            running,
            Option.isSome(fold.value) ? member[fold.value.value] : undefined,
          );
        }

        for (const [was, after] of Option.toArray(fold.running)) {
          member[was] ??= before;
          if (running !== undefined) {
            member[after] ??= running;
          }
        }
      }

      if (running !== undefined) {
        owner[fold.end] = running;
        filled += 1;
      }
    }
  }

  return filled;
};

/**
 * Every copy along a family's axis the schema states.
 */
const copies = axisCopies(judgedLaws(Qti));

/**
 * Every copy along a predecessor or a last axis the schema states, read once.
 */
const steps = stepCopies(judgedLaws(Qti));

/**
 * Rebuild a program's rows as the database holds them, every value grizzle fills that the
 * statements give restored (the module's comment).
 *
 * @param inputs - The program's inputs.
 * @returns Every relation's rows.
 */
export const hostRowsOf = (inputs: PackageInputs): HostRows => {
  const rows = new Map<string, FilledRow[]>();
  const add = (relation: string, row: FilledRow): void => {
    const held = rows.get(relation);
    if (held === undefined) {
      rows.set(relation, [row]);
    } else {
      held.push(row);
    }
  };
  const sequences = families.filter(({ kind }) => kind !== "counted");
  const trees = new Set(families.flatMap(({ kind, owner }) => (kind === "tree" ? [owner] : [])));
  const visit = (
    relation: string,
    written: typeof WrittenRow.Type,
    row: FilledRow,
    order: { next: bigint },
  ): void => {
    for (const [field, value] of Object.entries(written)) {
      if (isDatum(value) && row[field] === undefined) {
        row[field] = Predicate.isNumber(value) ? floatDatum(value) : value;
      }
    }

    for (const generated of Option.toArray(Option.fromUndefinedOr(generatedFields.get(relation)))) {
      for (const [field, valueOf] of generated) {
        const value = valueOf(row);
        if (value !== undefined) {
          row[field] = value;
        }
      }
    }

    const tree = trees.has(relation);
    if (tree) {
      row["start"] = order.next;
      order.next += 1n;
    }

    add(relation, row);
    for (const family of sequences.filter(({ owner }) => owner === relation)) {
      const members = Option.getOrElse(
        Schema.decodeUnknownOption(WrittenMembers)(written[family.count]),
        () => [],
      );
      const ownerKey = keyOf(relation);
      row[family.count] = BigInt(members.length);
      for (const [at, member] of members.entries()) {
        const filled: FilledRow = {};
        for (const [index, field] of family.group.entries()) {
          const value = row[ownerKey[index] ?? ""];
          if (value !== undefined) {
            filled[field] = value;
          }
        }

        for (const index of Option.toArray(family.index)) {
          filled[index] = BigInt(at);
        }

        for (const root of Option.toArray(family.root)) {
          const value = row[root];
          if (value !== undefined) {
            filled[root] = value;
          }
        }

        visit(family.member, member, filled, family.kind === "tree" ? order : { next: 0n });
      }
    }

    if (tree) {
      row["end"] = order.next;
    }
  };

  for (const [relation, keyed] of Object.entries(Schema.decodeUnknownSync(WrittenInputs)(inputs))) {
    const tree = families.find(({ kind, owner }) => kind === "tree" && owner === relation);
    for (const written of keyed.values()) {
      const root: FilledRow = {};
      for (const family of Option.toArray(Option.fromUndefinedOr(tree))) {
        const id = written[keyOf(relation)[0] ?? ""];
        if (Predicate.isString(id)) {
          root[family.group[0] ?? ""] = id;
        }

        for (const index of Option.toArray(family.index)) {
          root[index] = 0n;
        }
      }

      visit(relation, written, root, { next: 0n });
    }
  }

  countFamilies(rows);
  // Each round fills what the last one's copies and folds made readable, until one fills nothing.
  while (copyAlong(rows, copies) + stepAlong(rows, steps) + foldAll(rows) > 0) {
    countFamilies(rows);
  }

  return rows;
};

/**
 * A law the host judged and found broken: the law, and the rows that break it, at most a few.
 */
export interface Broken {
  readonly law: Law;
  readonly rows: readonly HostRow[];
}

/**
 * A law the host could not judge: the law, and each value it reads that the host does not hold,
 * as `Relation.field`, or as `Relation: a <kind> term` for a term of a selection or a check it
 * cannot read.
 */
export interface Skipped {
  readonly absent: readonly string[];
  readonly law: Law;
}

/**
 * The host's judgment of rows by laws: the laws it judged, the ones of them the rows break, and the
 * ones it could not judge.
 */
export interface Judgment {
  readonly broken: readonly Broken[];
  readonly judged: readonly Law[];
  readonly skipped: readonly Skipped[];
}

/**
 * The most rows a breach reports.
 */
const reported = 3;

/**
 * Read a relation's rows for a law: the host's, a closed relation's facts, or none, a relation the
 * program writes no row of.
 *
 * @param rows - Every relation's rows.
 * @param relation - The relation.
 * @returns Its rows.
 */
const rowsFor = (rows: HostRows, relation: string): readonly HostRow[] =>
  rows.get(relation) ?? Option.getOrElse(closedRows(relation), () => []);

/**
 * One side's projection over a relation's rows: each selected row's tuple's text, with the row,
 * and every value the side reads that some row it reads lacks.
 */
interface Projection {
  readonly absent: ReadonlySet<string>;
  readonly tuples: ReadonlyMap<string, HostRow>;
}

/**
 * One law read over rows: the rows that break it, or the values it reads that the rows lack.
 */
interface LawRead {
  readonly absent: readonly string[];
  readonly breaking: readonly HostRow[];
}

/**
 * Project one side over a relation's rows ({@link Projection}).
 *
 * @param side - The side.
 * @param held - The rows.
 * @returns The tuples and the absent values.
 */
const projectionOf = (side: JudgedSide, held: readonly HostRow[]): Projection => {
  const absent = new Set(side.unread.map((kind) => `${side.relation}: a ${kind} term`));
  const tuples = new Map<string, HostRow>();
  for (const row of held) {
    const selected = side.selection(row);
    if (selected === undefined) {
      for (const field of side.reads.filter((at) => row[at] === undefined)) {
        absent.add(`${side.relation}.${field}`);
      }
    }

    if (selected !== true) {
      continue;
    }

    const values: Datum[] = [];
    let outside = false;
    for (const term of side.law.terms) {
      const value = row[term.field];
      if (value === undefined) {
        absent.add(`${side.relation}.${term.field}`);
      } else if (term.kind === "pred") {
        outside ||= value === 0n;
        values.push(Predicate.isBigInt(value) ? value - 1n : value);
      } else {
        values.push(value);
      }
    }

    if (!outside && values.length === side.law.terms.length) {
      tuples.set(values.map(datumText).join("\u001F"), row);
    }
  }

  return { absent, tuples };
};

/**
 * Judge one law over rows.
 *
 * @param rows - Every relation's rows.
 * @param law - The law.
 * @returns The rows that break it, or the values it reads that the rows lack.
 */
const judgedBy = (rows: HostRows, law: JudgedLaw): LawRead => {
  if (law.kind === "check") {
    const absent = new Set(law.unread.map((kind) => `${law.relation}: a ${kind} term`));
    const breaking: HostRow[] = [];
    for (const row of rowsFor(rows, law.relation)) {
      const value = law.value(row);
      const lacking = law.reads.filter((at) => row[at] === undefined);
      if (value === false || (value === undefined && lacking.length === 0)) {
        // CHECK ((…) IS TRUE): unknown over values the row holds is SQL's NULL, and refused.
        breaking.push(row);
      } else if (value === undefined) {
        for (const field of lacking) {
          absent.add(`${law.relation}.${field}`);
        }
      }
    }

    return { absent: [...absent], breaking };
  }

  if (law.kind === "key") {
    const held = rowsFor(rows, law.side.relation);
    const { absent, tuples } = projectionOf(law.side, held);
    const selected = held.filter((row) => law.side.selection(row) === true);

    return {
      absent: [...absent],
      breaking: selected.length === tuples.size ? [] : selected,
    };
  }

  const from = projectionOf(law.from, rowsFor(rows, law.from.relation));
  const to = projectionOf(law.to, rowsFor(rows, law.to.relation));

  return {
    absent: [...new Set([...from.absent, ...to.absent])],
    breaking: [...from.tuples].flatMap(([tuple, row]) => (to.tuples.has(tuple) ? [] : [row])),
  };
};

/**
 * Judge rows by laws: each law whose every value the rows hold, on every row it reads, is judged,
 * and broken where a row breaks it, a check where its predicate is false or unknown (`IS TRUE`);
 * each other law is skipped, named with the values it lacks.
 *
 * @param rows - Every relation's rows ({@link hostRowsOf}).
 * @param laws - The laws (`#pantry/test/judged-laws.ts` `judgedLaws`).
 * @returns The judgment.
 */
export const judge = (rows: HostRows, laws: readonly JudgedLaw[]): Judgment => {
  const broken: Broken[] = [];
  const judged: Law[] = [];
  const skipped: Skipped[] = [];
  for (const law of laws) {
    const { absent, breaking } = judgedBy(rows, law);
    if (absent.length > 0) {
      skipped.push({ absent: absent.toSorted(), law: law.law });
    } else {
      judged.push(law.law);
      if (breaking.length > 0) {
        broken.push({ law: law.law, rows: breaking.slice(0, reported) });
      }
    }
  }

  return { broken, judged, skipped };
};
