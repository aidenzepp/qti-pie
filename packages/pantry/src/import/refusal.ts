/**
 * How a refusal by the database names its laws (plan W5, Q5.17; the W5 amendment's C22).
 *
 * A package is refused before any row exists, by the reader, the ZIP container or the codec, which
 * `#pantry/import/rules.ts` names with no schema, or by grizzle's `invariant-rejected` outcome,
 * which names every law merged into the PostgreSQL object that refused the write
 * ({@link refusalOf}). Each law keeps the rule of the guard or schema rule it replaces, so a
 * verdict reads as it did.
 *
 * - **Laws by name.** Every law the schema states has a name, the law oracle's (`src/test/oracle.ts`
 *   `LawName`) where the oracle states the law, with its rule and its spec source
 *   ({@link lawTable}). An outcome's law is named by its own fields ({@link lawNameOf}): a check by
 *   its name ({@link checkNameOf}), a primary key by its relation, a generated field by its
 *   relation and field, a contract by its name, a pattern by its field's type, and a statement's
 *   law by the group its module files the statement under, matched by grizzle's `sameLaw`. The
 *   tables are dictionaries keyed by the database's law, never a judge.
 * - **A refusal is what the database said.** A family's axis foreign key discharges the family and
 *   every containment and fold merged into it, and its violation names them all. The refusal
 *   carries how grizzle decided them, every law it named and the set of their rules
 *   ({@link rulesOf}), listed by one fixed order (`ruleOrder` of `#pantry/import/rules.ts`) for
 *   display. It singles out no law where grizzle's outcome does not, and reads no row of the
 *   import's.
 * - **Explanations are computed.** {@link explain} reads the laws, the witness and the installed
 *   grammar's rows; for a content-order law it names the positions `Follow` allows next, each with
 *   its XSD particle. There is no catalog of messages.
 */
import { sameLaw } from "@bjornpagen/grizzle";
import type { Law, Refused, Witness } from "@bjornpagen/grizzle";
import { Array as Arr, Formatter, Match, Option, Order, pipe, Predicate, Schema } from "effect";
import type { Types } from "effect";

import { rowsAt } from "#pantry/grammar/closed.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { followPairsOf } from "#pantry/grammar/content.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";

import type { RefusedLaw } from "#pantry/package/refusal-origin.ts";

import type { Source } from "#pantry/vocab/inventory/types.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import { ruleOrder, ImportRefused } from "#pantry/import/rules.ts";
import type { Rule } from "#pantry/import/rules.ts";
import snapshotFile from "#migrations/qti/snapshot.json" with { type: "json" };
import lawNamesFile from "#pantry/vocab/law-names.json" with { type: "json" };

/**
 * The rules no law of the schema keeps yet, each with the W5 slice that states its law, so the
 * census shows them. Each slice names its law, and its row joins {@link lawTable} or
 * {@link statedLaws} when it lands.
 *
 * - `typed-copy`: a typed value proved against its lexical form through G-parse (the tier 1
 *   addendum), as a relation of its own per typed form.
 * - The O2 to O4 and O6 laws the oracle states no host predicate for.
 */
export const owedRules = {} as const satisfies Partial<Readonly<Record<Rule, string>>>;

/**
 * The name of a law of {@link lawTable}.
 */
export type LawName = keyof typeof lawTable;

/**
 * Every law name, in the table's order.
 */
export const lawNames: readonly LawName[] = Object.keys(lawTable).filter((name): name is LawName =>
  Object.hasOwn(lawTable, name),
);

/**
 * Name the check that states a law: its name with each space an underscore, since grizzle's check
 * names are `[A-Za-z0-9_]` and no law name holds an underscore, so {@link lawOfCheck} inverts it.
 *
 * @param law - The law.
 * @returns The check's name.
 */
export const checkNameOf = (law: LawName): string => law.replaceAll(" ", "_");

/**
 * Read the law a check states from the check's name, as an `invariant-rejected` outcome reports it.
 *
 * @param name - The check's name.
 * @returns The law, or none for a name no law's check bears.
 */
export const lawOfCheck = (name: string): Option.Option<LawName> => {
  const law = name.replaceAll("_", " ");

  return Option.fromUndefinedOr(lawNames.find((known) => known === law));
};

/**
 * The relation each side of a law reads, in the order the law names its sides: the part of a law
 * {@link bucketOf} files it under beside its kind. A contract reads no relation, and a law of a
 * level above the schema reads its own law's relations: `Qti` is one level, which no level extends,
 * so no outcome names one (grizzle `999facc6`'s `above`), and none is in the table.
 *
 * @param law - A law as grizzle names it.
 * @returns Its sides' relations.
 */
export const relationsOf = (law: Law): readonly string[] =>
  Match.value(law).pipe(
    Match.discriminatorsExhaustive("kind")({
      above: ({ law: stated }) => relationsOf(stated),
      check: ({ relation }) => [relation],
      contained: ({ from, to }) => [from.relation, to.relation],
      contract: () => [],
      coverage: ({ from, to }) => [from.relation, to.relation],
      family: ({ member, slots }) => [member.relation, slots.owner],
      fold: ({ end, family, step }) => [family.owner, step.relation, end.relation],
      generated: ({ relation }) => [relation],
      key: ({ side }) => [side.relation],
      pattern: ({ relation }) => [relation],
      primaryKey: ({ relation }) => [relation],
      tree: ({ member, slots }) => [member.relation, slots.owner],
    }),
  );

/**
 * File a law by its kind and its sides' relations, so {@link lawNameOf} holds an outcome's law to
 * the few stated laws of that kind over those relations, never every law of Qti.
 *
 * This is no identity of the law: grizzle's `sameLaw` decides whether two laws are one, comparing
 * them whole, and two laws one bucket holds may still differ in their terms or selections. The
 * bucket only needs one law's two descriptions to fall in it together, which they do, since
 * `sameLaw` holds only of laws of one kind whose sides read the same relations.
 *
 * @param law - A law as grizzle names it.
 * @returns Its bucket.
 */
export const bucketOf = (law: Law): string => [law.kind, ...relationsOf(law)].join(" ");

/**
 * The law of a given kind.
 */
export type LawOf<Kind extends Law["kind"]> = Extract<Law, { readonly kind: Kind }>;

/**
 * Name each key by one law: one row per key, so a table lists its laws as their names group them.
 *
 * @param name - The law.
 * @param keys - The keys it names.
 * @returns The rows.
 */
export const namedBy = (
  name: LawName,
  ...keys: readonly string[]
): readonly (readonly [string, LawName])[] => keys.map((key) => [key, name] as const);

/**
 * The law each generated field of Qti's stored relations is named by, by `Relation.field`: grizzle
 * names one when PostgreSQL refuses a row because the field's column is NULL there (23502). grizzle
 * writes no NULL, so only the field's term can have no value: a closed read `C.at` at a key its
 * closed relation holds no row at. No term of Qti's reads `C.at`, so no row breaks one. Each is
 * named by the law that states its value exists, its relation's rows', and the census
 * (`refusal.oracle.test.ts`) holds the table to `lawsOf(Qti)` both ways:
 *
 * - An IDREF token's piece, a header's and a tolerance value's, and a reference segment's token, is
 *   its own whitespace or separator and its token concatenated, its concat fold's step: written
 *   texts, none NULL, so the term is never NULL. A piece or a token past its keyText bound is
 *   refused by its own pattern law, named by keyText's row of {@link textLaws}, "Key text bound".
 * - An operand's type bits read `ValueBaseBit.row` and `ValueCardinalityBit.row`, closed reads of a
 *   set keyed by the row's own NOT NULL `baseType` and `cardinality`: ∅ where the diagonal holds no
 *   row (`any`, `unknown`), never NULL, which only a NULL key, an absent `C.at`, reads
 *   (docs/grizzle-findings.md, lane DBT's). A field a closed relation determines is E1 derived.
 * - A selection's `select` casts `selectForm`, which its pattern law, named by SelectForm's row of
 *   {@link textLaws}, holds to the language the cast reads total: a form outside it is refused by
 *   that law as the statement casts it into its column, before PostgreSQL computes `select`.
 * - A statistic's `date` casts `day`, which its pattern law, named by DayForm's row of
 *   {@link textLaws}, holds to the days 0001-01-01 to 9999-12-31 the cast reads total, refused the
 *   same way. Its value is the calendar day `lastUpdated` names, which the value domain states
 *   exists, so it is the value domain's.
 * - A document's and an item's assembly's `xml:lang` form's compared `value` is the form collapsed
 *   and case-folded, cast into the form's own key text, a cast the schema proves total: a written
 *   text, never NULL.
 */
export const generatedNames: readonly (readonly [string, LawName])[] = [
  ...namedBy(
    "E1 derived",
    "Idref.piece",
    "TextIdref.piece",
    "HeaderToken.piece",
    "ToleranceToken.piece",
    "ReferenceSegment.token",
    "Operand.baseTypeBit",
    "Operand.cardinalityBit",
    "SectionSelection.select",
  ),
  ...namedBy("value domain", "StatisticDate.date"),
  ...namedBy(
    "E1 derived",
    "DocumentLang.value",
    "AssembledLang.value",
    "MapKeyItems.ordered",
    "MapKeyItems.unordered",
  ),
];

/**
 * The law each contract Qti's fields are of is named by, by the contract's name: grizzle's builtin
 * `natural`, a bigint never below zero (README, "Tables and types": "A negative value is an outcome
 * on the law `{ kind: "contract", contract: "natural" }`"), the type of every count, position and
 * bit set of the model. Each natural the import writes is a count or a position of its own rows, or
 * a set of a closed relation's bits, and grizzle draws or accumulates the rest, so no row breaks
 * it, and it is named by the law of the values the import derives, "E1 derived". The census
 * (`refusal.oracle.test.ts`) holds the table to `lawsOf(Qti)` both ways.
 */
export const contractNames: readonly (readonly [string, LawName])[] = namedBy(
  "E1 derived",
  "natural",
);

/**
 * What the dictionary tells of one installed law: its name in {@link lawTable} where the table
 * names it, and, for a check, the name PostgreSQL holds it under (grizzle's `constraintNamesOf`).
 */
const LawEntry = Schema.Struct({
  installed: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
});

/**
 * The law-name dictionary's form, `#pantry/vocab/law-names.json`: each installed law the importer
 * names, keyed by its LawId, the name the migrations snapshot records the law under and a served
 * outcome carries it by; and each pattern law's name, keyed by `Relation.field`, the law's own
 * fields, since the snapshot records a field's pattern under its text domain and not as a law.
 *
 * `src/test/law-names.ts` generates it from the schema's own naming (`src/test/law-namer.ts`) and
 * the committed snapshot, and `law-names.committed.test.ts` holds the committed file to it and
 * names every law of `lawsOf(Qti)` through both, so the dictionary is the schema's naming, read
 * without building the schema.
 */
export const LawNamesFileSchema = Schema.Struct({
  laws: Schema.Record(Schema.String, LawEntry),
  patterns: Schema.Record(Schema.String, Schema.String),
});

/**
 * The law-name dictionary, decoded.
 */
export type LawNamesFile = typeof LawNamesFileSchema.Type;

/**
 * The part of a migrations snapshot that gives each installed law its LawId: each level's laws,
 * each described in grizzle's canonical JSON form beside its LawId.
 */
export const SnapshotLaws = Schema.Struct({
  levels: Schema.Array(
    Schema.Struct({
      laws: Schema.Array(Schema.Struct({ described: Schema.Json, law: Schema.String })),
    }),
  ),
});

/**
 * A value of grizzle's canonical JSON form read back: JSON, but for a bigint where the form holds
 * `~n:<integer>`.
 */
type Revived =
  | null
  | bigint
  | boolean
  | number
  | string
  | readonly Revived[]
  | { readonly [key: string]: Revived };

/**
 * Read a value of grizzle's canonical JSON form back as the value it stands for: a string
 * `~n:<integer>` is that bigint, a string that starts `~~` is the string with one `~` fewer, and
 * every array and record is read member by member. The snapshot describes each law in this form
 * (grizzle's `core/canonical.ts`: "bigint, carried as the tagged string "~n:<integer>""; "A plain
 * string beginning with "~" is escaped by doubling the "~"").
 *
 * @param value - A value of the JSON form.
 * @returns The value it stands for.
 * @see https://github.com/bjornpagen/grizzle/blob/450d0984/packages/engine/src/core/canonical.ts
 */
const fromCanonicalJson = (value: Schema.Json): Revived => {
  if (Predicate.isString(value)) {
    if (/^~n:-?(?:0|[1-9][0-9]*)$/u.test(value)) {
      return BigInt(value.slice(3));
    }

    return value.startsWith("~~") ? value.slice(1) : value;
  }

  if (Array.isArray(value)) {
    return value.map(fromCanonicalJson);
  }

  return value === null || Predicate.isNumber(value) || Predicate.isBoolean(value)
    ? value
    : Object.fromEntries(
        Object.entries(value).map(([key, member]) => [key, fromCanonicalJson(member)]),
      );
};

/**
 * Test whether a value read from the snapshot is a law: a record with a `kind`. The test is no
 * proof of the law's whole shape; `law-names.committed.test.ts` proves it of every law the
 * dictionary names, each `sameLaw` to a law grizzle's `lawsOf(Qti)` states.
 *
 * @param value - A revived law of the snapshot.
 * @returns Whether it is a law.
 */
const isLaw = (value: Revived): value is Revived & Law =>
  Predicate.hasProperty(value, "kind") && Predicate.isString(value.kind);

/**
 * One installed law as the snapshot describes it: the law, and its LawId.
 */
export interface DescribedLaw {
  readonly id: string;
  readonly law: Law;
}

/**
 * Read the installed laws a migrations snapshot describes, each with its LawId.
 *
 * @param snapshot - The snapshot's laws ({@link SnapshotLaws}).
 * @returns Its laws, level by level, in the snapshot's order.
 */
export const describedLawsOf = (snapshot: typeof SnapshotLaws.Type): readonly DescribedLaw[] =>
  snapshot.levels.flatMap(({ laws }) =>
    laws.flatMap(({ described, law: id }) => {
      const law = fromCanonicalJson(described);

      return isLaw(law) ? [{ id, law }] : [];
    }),
  );

/**
 * Read a name of {@link lawTable}.
 *
 * @param name - A name as the dictionary writes it.
 * @returns The law name, or none for a name the table lacks.
 */
const lawNamed = (name: string): Option.Option<LawName> =>
  Option.fromUndefinedOr(lawNames.find((known) => known === name));

/**
 * What a law-name dictionary tells of a law: its name, and a check's installed name.
 */
export interface LawNamer {
  /**
   * Read the name PostgreSQL holds a check under.
   *
   * @param law - A check law of an outcome.
   * @returns Its installed name, or none for a check the dictionary does not hold.
   */
  readonly installedOf: (law: LawOf<"check">) => Option.Option<string>;
  /**
   * Name a law an outcome names.
   *
   * @param law - The law.
   * @returns Its name, or none for a law no row of the dictionary or of the tables states.
   */
  readonly nameOf: (law: Law) => Option.Option<LawName>;
}

/**
 * Build the namer of a law-name dictionary over the laws a snapshot describes. A law is named by
 * its own fields where they name it: a check by its name ({@link lawOfCheck}), a contract and a
 * generated field by their tables ({@link contractNames}, {@link generatedNames}), and a pattern
 * by its relation and field, the dictionary's `patterns`. Every other law is named by the entry of
 * its LawId, the id of the described law grizzle's `sameLaw` holds it to be, found among the
 * described laws of its bucket ({@link bucketOf}); a check's installed name is its entry's too.
 * Nothing reads the schema. A served outcome carries each law's LawId itself, which ends the
 * search.
 *
 * @param file - The dictionary.
 * @param described - The installed laws, each with its LawId ({@link describedLawsOf}).
 * @returns Its namer.
 */
export const namerFrom = (file: LawNamesFile, described: readonly DescribedLaw[]): LawNamer => {
  const buckets: Readonly<Record<string, readonly DescribedLaw[]>> = Arr.groupBy(
    described,
    ({ law }) => bucketOf(law),
  );
  const byContract = new Map(contractNames);
  const byGenerated = new Map(generatedNames);
  const entryOf = (law: Law) =>
    Option.flatMap(
      Arr.findFirst(buckets[bucketOf(law)] ?? [], (held) => sameLaw(held.law, law)),
      ({ id }) => Option.fromUndefinedOr(file.laws[id]),
    );
  const stated = (law: Law): Option.Option<LawName> =>
    Option.flatMap(entryOf(law), ({ name }) =>
      Option.flatMap(Option.fromUndefinedOr(name), lawNamed),
    );

  return {
    installedOf: (law) =>
      Option.flatMap(entryOf(law), ({ installed }) => Option.fromUndefinedOr(installed)),
    nameOf: (law) =>
      Match.value(law).pipe(
        Match.discriminatorsExhaustive("kind")({
          above: stated,
          check: ({ name }) => lawOfCheck(name),
          contained: stated,
          contract: ({ contract }) => Option.fromUndefinedOr(byContract.get(contract)),
          coverage: stated,
          family: stated,
          fold: stated,
          generated: ({ field, relation }) =>
            Option.fromUndefinedOr(byGenerated.get(`${relation}.${field}`)),
          key: stated,
          pattern: ({ field, relation }) =>
            Option.flatMap(Option.fromUndefinedOr(file.patterns[`${relation}.${field}`]), lawNamed),
          primaryKey: stated,
          tree: stated,
        }),
      ),
  };
};

/**
 * The installed laws this package's committed snapshot describes, each with its LawId.
 */
export const committedLaws = describedLawsOf(Schema.decodeUnknownSync(SnapshotLaws)(snapshotFile));

/**
 * The namer of the committed dictionary, `#pantry/vocab/law-names.json`, over the committed
 * snapshot's laws, built once, when this module loads.
 */
const committedNamer = namerFrom(
  Schema.decodeUnknownSync(LawNamesFileSchema)(lawNamesFile),
  committedLaws,
);

/**
 * Name the law an outcome over `Qti` names, by the committed dictionary ({@link namerFrom}).
 *
 * @param law - A law as an `invariant-rejected` outcome names it.
 * @returns Its name, or none for a law no row of the dictionary or of the tables states.
 */
export const lawNameOf = (law: Law): Option.Option<LawName> => committedNamer.nameOf(law);

/**
 * The rule the law table gives a law: its name's row's ({@link lawNameOf}).
 *
 * @param law - A law as an `invariant-rejected` outcome names it.
 * @returns Its rule, or none for a law no row of the table states.
 */
export const ruleOfLaw = (law: Law): Option.Option<Rule> =>
  Option.map(lawNameOf(law), (name) => lawTable[name].rule);

/**
 * The rules a refusal that names `laws` is refused under: the rule of each law the table states,
 * each once, listed in {@link ruleOrder}.
 *
 * The laws are a set, and so are the rules: the laws' order and any repeat change nothing. No law
 * is singled out: grizzle's `some` and `first` say only that one or more of the laws broke, so the
 * refusal is under all of their rules, and a reader of the verdict reads them all. A law no row of
 * the table states carries no rule, and still prints its text in the refusal; the census in
 * `refusal.oracle.test.ts` keeps every law the schema states in the table.
 *
 * @param laws - The `laws` of an `invariant-rejected` outcome.
 * @returns The rules, none when no law of the set is in the table.
 */
export const rulesOf = (laws: readonly Law[]): readonly Rule[] =>
  Arr.sort(Arr.dedupe(laws.flatMap((law) => Option.toArray(ruleOfLaw(law)))), ruleOrder);

/**
 * What a refusal knows of the row that broke its laws: grizzle's witness, or the row's fields as
 * the caller read them.
 *
 * Grizzle names a violating row by its key fields alone, never another column: a key's, and a row
 * check's, a closed relation's check's, a contract's or a pattern's where the host judges a row the
 * ChangeSet states to break it. A foreign key, and a check no stated row breaks as the host judges
 * it, it names by none: its witness is `unreported` (README, "Errors and outcomes"). The fields a
 * content-order law reads (a node's `version`, its parent's kind and its predecessor's state) are
 * in no witness grizzle gives, so a caller that holds the row passes it as `row`.
 */
export type RefusalWitness =
  | Witness
  | {
      readonly kind: "row";
      readonly relation: string;
      readonly values: Readonly<Record<string, string>>;
    };

/**
 * The installed grammar's rows an explanation reads: the content grammar and `Admission`, the
 * generators' rows `src/grammar/install.ts` installs (its `grammar`).
 */
export type RefusalConstants = Pick<ComposedGrammar, "admission" | "content">;

/**
 * A position a content model allows next: its code, the kinds that stand at it, and the particle
 * of the XSD or the reading that states it.
 */
export interface Allowed {
  readonly kinds: readonly string[];
  readonly position: string;
  readonly source: Option.Option<string>;
}

/**
 * The explanation of a refusal: what broke, where each of its laws is stated, and for a
 * content-order law the positions its parent's content model allows next.
 */
export interface Explanation {
  /**
   * Each law, its rule and the law as grizzle reports it; the witness's row; and for a
   * content-order law the state it broke at and what its model allows there.
   */
  readonly detail: string;
  /**
   * The positions `Follow` allows after the state a content-order law broke at, ascending; none
   * when no content-order law is named, or the witness gives no row it reads.
   */
  readonly next: Option.Option<readonly Allowed[]>;
  /**
   * Each law's spec source, then for a content-order law its model's and each allowed position's,
   * each once; none where the law table holds none of the laws.
   */
  readonly sources: readonly string[];
}

/**
 * The content-order laws, by name, with the fields of a node row each reads its model's state by:
 * the parent's kind and the predecessor's state for a child's step (N5), the node's own kind and
 * its last child's state for its family's end (N7).
 */
const contentOrderLaws: Readonly<
  Partial<Record<LawName, { readonly parent: string; readonly state: string }>>
> = {
  "N5 Follow": { parent: "parentKind", state: "was" },
  "N7 Last": { parent: "kind", state: "lastState" },
};

/**
 * The content grammar as an explanation reads it, every lookup a map's: each family's content
 * model by `version parent` (`ContentModelOf`), `Follow`'s successors by `model position`, `Last`'s
 * ends by model, and the kinds at each position of each family by `version parent position`, those
 * its admission map gives the position, by kind, and then those its shared model's symbol sets do.
 */
interface ContentIndex {
  readonly ends: ReadonlyMap<string, readonly string[]>;
  readonly kinds: ReadonlyMap<string, readonly string[]>;
  readonly models: ReadonlyMap<string, string>;
  readonly next: ReadonlyMap<string, readonly string[]>;
}

/**
 * Each content grammar's index, built on its first explanation, which no later explanation scans
 * the rows for again.
 */
const contentIndexes = new WeakMap<RefusalConstants, ContentIndex>();

/**
 * Key a row of a relation over (version, parent, position).
 *
 * @param version - The schema version.
 * @param parent - The model's kind.
 * @param position - The position.
 * @returns The key.
 */
const positionKey = (version: string, parent: string, position: string): string =>
  `${version} ${parent} ${position}`;

/**
 * Group values under keys, each key's values in first-seen order and each once.
 *
 * @param pairs - The (key, value) pairs.
 * @returns The groups.
 */
const grouped = (pairs: Iterable<readonly [string, string]>): ReadonlyMap<string, string[]> => {
  const groups = new Map<string, string[]>();
  for (const [key, value] of pairs) {
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, [value]);
    } else if (!group.includes(value)) {
      group.push(value);
    }
  }

  return groups;
};

/**
 * Read the content grammar's index, building it once per grammar.
 *
 * @param constants - The installed grammar's rows.
 * @returns The index.
 */
const contentIndexOf = (constants: RefusalConstants): ContentIndex => {
  const known = contentIndexes.get(constants);
  if (known !== undefined) {
    return known;
  }

  const { content } = constants;
  const childrenOf = Map.groupBy(content.admissionIn.rows, ({ map }) => map);
  const symbolsOf = Map.groupBy(content.symbolSetOf.rows, ({ model }) => model);
  const membersOf = Map.groupBy(content.symbolMember.rows, ({ set }) => set);
  const index: ContentIndex = {
    ends: grouped(content.last.rows.map(({ model, position }) => [model, position] as const)),
    kinds: grouped([
      // Each family's admission map's children, each at its position.
      ...content.contentModelOf.rows.flatMap(({ admission, parent, version }) =>
        rowsAt(childrenOf, admission).map(
          ({ child, position }) => [positionKey(version, parent, position), child] as const,
        ),
      ),
      // Each shared family's model's kinds, each at every position of its symbol set.
      ...content.sharedModelOf.rows.flatMap(({ model, parent, version }) =>
        rowsAt(symbolsOf, model).flatMap(({ kind, set }) =>
          rowsAt(membersOf, set).map(
            ({ position }) => [positionKey(version, parent, position), kind] as const,
          ),
        ),
      ),
    ]),
    models: new Map(
      content.contentModelOf.rows.map(
        ({ model, parent, version }) => [`${version} ${parent}`, model] as const,
      ),
    ),
    next: grouped(
      followPairsOf(content).map(({ from, model, to }) => [`${model} ${from}`, to] as const),
    ),
  };
  contentIndexes.set(constants, index);

  return index;
};

/**
 * Write a source as an explanation names it: an XSD's file and line, or a specification's cite.
 *
 * @param source - The source.
 * @returns Its text.
 */
const sourceText = (source: Source): string =>
  source._tag === "xsd" ? `${source.file}:${String(source.line)}` : source.cite;

/**
 * Order positions by their code.
 */
const byPosition = Order.mapInput(Order.Number, Number);

/**
 * The state a content-order law broke at, read from a row: the version, the model's kind and the
 * state, and the node's own kind where the row holds it.
 */
interface BrokenState {
  readonly kind: Option.Option<string>;
  readonly law: LawName;
  readonly parent: string;
  readonly state: string;
  readonly version: SchemaVersion;
}

/**
 * Read the state a content-order law broke at from a row witness.
 *
 * @param law - The law's name.
 * @param witness - The refusal's witness.
 * @returns The state, or none when the law reads no content model or the witness gives no row
 *   holding its fields.
 */
const brokenStateOf = (law: LawName, witness: RefusalWitness): Option.Option<BrokenState> => {
  const reads = contentOrderLaws[law];
  if (reads === undefined || witness.kind !== "row") {
    return Option.none();
  }

  const { values } = witness;
  const version = schemaVersions.find((known) => known === values["version"]);
  const parent = values[reads.parent];
  const state = values[reads.state];

  return version === undefined || parent === undefined || state === undefined
    ? Option.none()
    : Option.some({
        kind: Option.fromUndefinedOr(values["kind"]),
        law,
        parent,
        state,
        version,
      });
};

/**
 * Read the values a grouping of the index holds under a key: none where the grouping holds no
 * group of it, as a relation's image of a key no row has is empty.
 *
 * @param groups - The grouping.
 * @param key - The key.
 * @returns Its values, in the grouping's order.
 */
const groupAt = (groups: ReadonlyMap<string, readonly string[]>, key: string): readonly string[] =>
  Option.toArray(Option.fromUndefinedOr(groups.get(key))).flat();

/**
 * Name the positions a model allows after a state, with their kinds and sources.
 *
 * @param broken - The state.
 * @param constants - The installed grammar's rows.
 * @returns The positions, ascending by code, and the parent's content model; none where the
 *   grammar holds no content model of the parent in its version.
 */
const allowedAfter = (
  broken: BrokenState,
  constants: RefusalConstants,
): Option.Option<{ readonly allowed: readonly Allowed[]; readonly model: string }> => {
  const index = contentIndexOf(constants);
  const { parent, state, version } = broken;

  return Option.map(Option.fromUndefinedOr(index.models.get(`${version} ${parent}`)), (model) => ({
    allowed: Arr.sort(groupAt(index.next, `${model} ${state}`), byPosition).map((position) => ({
      kinds: groupAt(index.kinds, positionKey(version, parent, position)),
      position,
      source: Option.map(constants.content.sourceOf({ parent, position, version }), sourceText),
    })),
    model,
  }));
};

/**
 * Write the positions a model allows, as an explanation lists them.
 *
 * @param allowed - The positions.
 * @returns Their text: each position with its kinds and source, or that the model allows none.
 */
const allowedText = (allowed: readonly Allowed[]): string =>
  allowed.length === 0
    ? "no further child"
    : allowed
        .map(
          ({ kinds, position, source }) =>
            `${position} (${kinds.length === 0 ? "no kind" : kinds.join(" ")}${Option.match(
              source,
              {
                onNone: () => "",
                onSome: (text) => `, ${text}`,
              },
            )})`,
        )
        .join("; ");

/**
 * Write what a content-order law's broken state means: where the node stands in its parent's model,
 * or where its family ends in its own, and what the model allows next.
 *
 * @param broken - The state.
 * @param after - What the model allows after it, and the model.
 * @param after.allowed - The positions it allows.
 * @param after.model - The parent's content model.
 * @param constants - The installed grammar's rows.
 * @returns The sentence.
 */
const brokenStateText = (
  broken: BrokenState,
  after: { readonly allowed: readonly Allowed[]; readonly model: string },
  constants: RefusalConstants,
): string => {
  const { kind, parent, state, version } = broken;
  const { allowed, model } = after;
  if (broken.law === "N7 Last") {
    const ends = Arr.sort(groupAt(contentIndexOf(constants).ends, model), byPosition);

    return `${parent}'s children end in state ${state} of its content model in ${version}, which ends only in ${ends.length === 0 ? "no state" : ends.join(", ")}; after state ${state} it needs one of ${allowedText(allowed)}`;
  }

  return `${Option.match(kind, { onNone: () => "A child", onSome: (own) => own })} follows state ${state} of ${parent}'s content model in ${version}, which allows next ${allowedText(allowed)}`;
};

/**
 * Write a witness as an explanation names it.
 *
 * @param witness - The refusal's witness.
 * @returns Where the row is, or that the database names none.
 */
const witnessText = (witness: RefusalWitness): string => {
  if (witness.kind === "unreported") {
    return "the database names no row: PostgreSQL reports a constraint it checks itself by the constraint alone";
  }

  const values = Object.entries(witness.values)
    .map(
      ([field, value]) => `${field}=${Predicate.isString(value) ? value : Formatter.format(value)}`,
    )
    .join(" ");

  return `at ${witness.relation} ${values}`;
};

/**
 * Explain a refusal from its laws, its witness and the installed grammar, as a pure function.
 *
 * Each law is named with its rule and shown as grizzle reports it (Effect's `Formatter.format`),
 * and its spec source joins `sources`. For a
 * content-order law (N5's `Follow` step, N7's `Last` end) whose row the witness gives, the
 * explanation names the positions `Follow` allows after the state it broke at, each with its kinds
 * and the XSD particle or reading that states it, and `sources` adds the model's and each
 * position's.
 *
 * @param laws - The `laws` of an `invariant-rejected` outcome.
 * @param witness - Its `witness`, or the row the caller read.
 * @param constants - The installed grammar's rows.
 * @returns The explanation.
 */
export const explain = (
  laws: Arr.NonEmptyReadonlyArray<Law>,
  witness: RefusalWitness,
  constants: RefusalConstants,
): Explanation => {
  const named = laws.map((law) => ({ law, name: lawNameOf(law) }));
  const broken = Arr.head(
    named.flatMap(({ name }) =>
      Option.toArray(name.pipe(Option.flatMap((law) => brokenStateOf(law, witness)))),
    ),
  );
  const after = broken.pipe(Option.flatMap((state) => allowedAfter(state, constants)));
  const next = after.pipe(Option.map(({ allowed }) => allowed));
  const lawText = named
    .map(({ law, name }) =>
      Option.match(name, {
        onNone: () => `${Formatter.format(law)}, which no rule of the law table owns`,
        onSome: (held) => `${held} (rule ${lawTable[held].rule}): ${Formatter.format(law)}`,
      }),
    )
    .join("; ");
  const stateText = Option.match(Option.all({ after, broken }), {
    onNone: () => "",
    onSome: ({ after: allowed, broken: state }) =>
      `. ${brokenStateText(state, allowed, constants)}`,
  });
  const modelSources = Option.match(broken, {
    onNone: () => [],
    onSome: ({ parent, version }) => [
      ...Option.toArray(
        Option.map(constants.content.sourceOf({ parent, position: "0", version }), sourceText),
      ),
      ...Option.toArray(next)
        .flat()
        .flatMap(({ source }) => Option.toArray(source)),
    ],
  });
  const sources = Arr.dedupe([
    ...named.flatMap(({ name }) =>
      Option.toArray(name.pipe(Option.map((law) => lawTable[law].source))),
    ),
    ...modelSources,
  ]);

  return { detail: `${lawText}, ${witnessText(witness)}${stateText}`, next, sources };
};

/**
 * One law of a refusal as the refusal carries it: its display text, the installed name of a check
 * the committed dictionary holds ({@link namerFrom}), and the name and rule the law table gives
 * it.
 *
 * @param law - A law of an `invariant-rejected` outcome.
 * @returns Its facts.
 */
const lawFactOf = (law: Law): typeof RefusedLaw.Type => {
  const fact: Types.Mutable<typeof RefusedLaw.Type> = { text: Formatter.format(law) };
  const installed = law.kind === "check" ? committedNamer.installedOf(law) : Option.none();
  if (Option.isSome(installed)) {
    fact.installed = installed.value;
  }

  const name = lawNameOf(law);
  if (Option.isSome(name)) {
    fact.name = name.value;
    fact.rule = lawTable[name.value].rule;
  }

  return fact;
};

/**
 * Build the refusal of an `invariant-rejected` outcome from the outcome alone: how grizzle decided
 * its laws, each law's facts ({@link lawFactOf}) in the outcome's order, the set of their rules
 * ({@link rulesOf}), and its explanation ({@link explain}). It reads no row and judges no law, so
 * a `some` or `first` refusal stays as undecided as grizzle left it.
 *
 * A host-side key conflict, two facts of one key that grizzle refuses before any SQL, names its
 * key law and the submitted key as its witness, and is refused the same way, with no SQLSTATE.
 *
 * @param refused - The outcome's `refused`.
 * @param witness - Its `witness`, or the row the caller read.
 * @param constants - The installed grammar's rows.
 * @returns The refusal.
 */
export const refusalOf = (
  refused: Refused,
  witness: RefusalWitness,
  constants: RefusalConstants,
): ImportRefused => {
  const { detail, sources } = explain(refused.laws, witness, constants);

  return new ImportRefused({
    detail,
    origin: {
      _tag: "Database",
      kind: refused.kind,
      laws: pipe(refused.laws, Arr.map(lawFactOf)),
      sources,
      witness: witness.kind,
    },
    rules: rulesOf(refused.laws),
  });
};
