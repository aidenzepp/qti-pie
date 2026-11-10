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
 *   ({@link lawTable}). An outcome's law is named one way ({@link lawNameOf}): a check by its own
 *   name ({@link lawOfCheck}), and every other law by its id, the one the outcome carries
 *   (grizzle's `RefusedLaw.id`), in the committed dictionary (`#pantry/vocab/law-names.json`),
 *   which `src/test/law-names.ts` generates from the schema's own naming. The dictionary is keyed
 *   by the database's law, never a judge.
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

import type { Law, Refused, Witness } from "@bjornpagen/grizzle";
import { Array as Arr, Formatter, Option, Order, pipe, Predicate, Schema } from "effect";
import type { Types } from "effect";

import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";

import type { RefusedLaw } from "#pantry/package/refusal-origin.ts";

import type { Source } from "#pantry/vocab/inventory/types.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import { ruleOrder, ImportRefused } from "#pantry/import/rules.ts";
import type { Rule } from "#pantry/import/rules.ts";
import lawNamesFile from "#pantry/vocab/law-names.json" with { type: "json" };

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
 * The object that refused a law, as the importer reads it: an installed constraint or domain, by
 * the name PostgreSQL holds it under, or a write statement or a generated column's NOT NULL, which
 * install no constraint of the law's. grizzle's `RefusingObject` is one, its name a branded text.
 */
export type RefusingBy =
  | { readonly kind: "constraint" | "domain"; readonly name: string }
  | { readonly kind: "notNull" | "statement" };

/**
 * One law of a refusal, as the importer names it: the law as the schema states it, its id, and the
 * object that refused it. The id is a LawId for a law of the theory or a text pattern, and a
 * GeneratedLawId for a generated field's law. grizzle's `RefusedLaw` is one, its id and installed
 * name branded texts; a test plants one with texts of its own.
 */
export interface RefusalLaw {
  readonly by: RefusingBy;
  readonly id: string;
  readonly law: Law;
}

/**
 * A refusal of laws, as the importer reads one: how grizzle decided them, and the laws, at least
 * one (grizzle's `Refused`).
 */
export interface RefusalOf {
  readonly kind: Refused["kind"];
  readonly laws: Arr.NonEmptyReadonlyArray<RefusalLaw>;
}

/**
 * What the dictionary tells of one installed law: its name in {@link lawTable}.
 */
const LawEntry = Schema.Struct({ name: Schema.String });

/**
 * The law-name dictionary's form, `#pantry/vocab/law-names.json`: each installed law the importer
 * names but a check, keyed by its id, the key a refused law carries (grizzle's `RefusedLaw.id`): a
 * law of the theory's and a text pattern's LawId, and a generated field's law's GeneratedLawId.
 *
 * `src/test/law-names.ts` generates it from the schema's own naming (`src/test/law-namer.ts`) and
 * the ids the committed migrations give each law, and `law-names.committed.test.ts` holds the
 * committed file to it and names every law of `lawsOf(Qti)` through both, so the dictionary is the
 * schema's naming, read without building the schema.
 */
export const LawNamesFileSchema = Schema.Struct({ laws: Schema.Record(Schema.String, LawEntry) });

/**
 * The law-name dictionary, decoded.
 */
export type LawNamesFile = typeof LawNamesFileSchema.Type;

/**
 * Read a name of {@link lawTable}.
 *
 * @param name - A name as the dictionary writes it.
 * @returns The law name, or none for a name the table lacks.
 */
const lawNamed = (name: string): Option.Option<LawName> =>
  Option.fromUndefinedOr(lawNames.find((known) => known === name));

/**
 * The namer of a law-name dictionary.
 */
export interface LawNamer {
  /**
   * Name a law an outcome refused.
   *
   * @param refused - The refused law: the law, its LawId and the object that refused it.
   * @returns Its name, or none for a law no row of the dictionary or of the tables states.
   */
  readonly nameOf: (refused: RefusalLaw) => Option.Option<LawName>;
}

/**
 * Build the namer of a law-name dictionary. A check is named by its own name ({@link lawOfCheck}),
 * since grizzle names a check by the name its statement declares; every other law by the
 * dictionary's entry of its id, which the outcome carries. Nothing reads the schema.
 *
 * @param file - The dictionary.
 * @returns Its namer.
 */
export const namerFrom = (file: LawNamesFile): LawNamer => ({
  nameOf: ({ id, law }) =>
    law.kind === "check"
      ? lawOfCheck(law.name)
      : Option.flatMap(Option.fromUndefinedOr(file.laws[id]), ({ name }) => lawNamed(name)),
});

/**
 * The namer of the committed dictionary, `#pantry/vocab/law-names.json`, built once, when this
 * module loads. The file is trusted as its import types it: the typecheck holds its shape to
 * {@link LawNamesFile}, and `law-names.committed.test.ts` holds it to the one the schema and the
 * committed snapshot generate, so loading it decodes nothing, and a dictionary of a stale shape
 * still loads for its generator to replace.
 */
const committedNamer = namerFrom(lawNamesFile);

/**
 * Name a law an outcome over `Qti` refused, by the committed dictionary ({@link namerFrom}).
 *
 * @param refused - A law of an `invariant-rejected` outcome.
 * @returns Its name, or none for a law no row of the dictionary or of the tables states.
 */
export const lawNameOf = (refused: RefusalLaw): Option.Option<LawName> =>
  committedNamer.nameOf(refused);

/**
 * Read the name PostgreSQL holds the object that refused a law under, as the outcome names it
 * (grizzle's `RefusedLaw.by`), whatever the law's kind: a table's constraint, a CHECK, a key, a
 * foreign key or an exclusion constraint, or a domain's CHECK. A write statement and a rule over a
 * query's trigger raise the law under its identity and install no constraint for it, and grizzle
 * names a generated column's NOT NULL by its table and column alone, so a law they refused has
 * none.
 *
 * @param refused - A law of an `invariant-rejected` outcome.
 * @returns The refusing object's installed name, or none.
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/packages/engine/src/types/changeset/changeset.ts#L1196-L1211
 */
export const installedNameOf = ({ by }: RefusalLaw): Option.Option<string> =>
  by.kind === "constraint" || by.kind === "domain" ? Option.some(by.name) : Option.none();

/**
 * The rule the law table gives a law: its name's row's ({@link lawNameOf}).
 *
 * @param law - A law as an `invariant-rejected` outcome names it.
 * @returns Its rule, or none for a law no row of the table states.
 */
export const ruleOfLaw = (refused: RefusalLaw): Option.Option<Rule> =>
  Option.map(lawNameOf(refused), (name) => lawTable[name].rule);

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
export const rulesOf = (laws: readonly RefusalLaw[]): readonly Rule[] =>
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
 * The installed grammar's rows an explanation reads: the content grammar, the generators' rows
 * `src/grammar/install.ts` installs (its `grammar`).
 */
export type RefusalConstants = Pick<ComposedGrammar, "content">;

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
 * Read the positions a content model's follow set holds after a state: `FollowMember` at
 * `FollowSetOf(model, state)`, none for a state the model has not.
 *
 * @param content - The content grammar.
 * @param model - The model.
 * @param state - The state.
 * @returns The positions, in `FollowMember`'s order.
 */
const followedAfter = (
  content: RefusalConstants["content"],
  model: string,
  state: string,
): readonly string[] =>
  Option.match(content.followSetOf.lookup({ from: state, model }), {
    onNone: () => [],
    onSome: ({ set }) =>
      content.followMember.rows.flatMap((row) => (row.set === set ? [row.to] : [])),
  });

/**
 * Read the kinds a family's model places at each position: those its admission map gives the
 * position, by kind, then those its shared model's symbol sets do, each once. The family's map's
 * children, its shared model's pairs and the positions of each of their symbol sets are read once,
 * for every position asked, so a position costs a pass over the family's own rows and none over
 * `SymbolMember`: a scan of `SymbolMember` per pair and position took a model of many states and
 * positions (`m:mmultiscripts`) past the explanation test's hang limit.
 *
 * @param content - The content grammar.
 * @param family - The family's version and parent.
 * @param family.version - The version.
 * @param family.parent - The parent's kind.
 * @returns The kinds at a position.
 */
const kindsAt = (
  content: RefusalConstants["content"],
  family: { readonly parent: string; readonly version: string },
): ((position: string) => readonly string[]) => {
  const children = Option.toArray(content.contentModelOf.lookup(family)).flatMap(({ admission }) =>
    content.admissionIn.rows.filter((row) => row.map === admission),
  );
  const pairs = Option.toArray(content.sharedModelOf.lookup(family)).flatMap(({ model }) =>
    content.symbolSetOf.rows.filter((pair) => pair.model === model),
  );
  const positionsOf = new Map(pairs.map(({ set }) => [set, new Set<string>()]));
  for (const { position, set } of content.symbolMember.rows) {
    positionsOf.get(set)?.add(position);
  }

  return (position) =>
    Arr.dedupe([
      ...children.flatMap((row) => (row.position === position ? [row.child] : [])),
      ...pairs.flatMap((pair) =>
        positionsOf.get(pair.set)?.has(position) === true ? [pair.kind] : [],
      ),
    ]);
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
  const { content } = constants;
  const { parent, state, version } = broken;

  return Option.map(content.contentModelOf.lookup({ parent, version }), ({ model }) => {
    const placed = kindsAt(content, { parent, version });

    return {
      allowed: Arr.sort(followedAfter(content, model, state), byPosition).map((position) => ({
        kinds: placed(position),
        position,
        source: Option.map(content.sourceOf({ parent, position, version }), sourceText),
      })),
      model,
    };
  });
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
    const ends = Arr.sort(
      Arr.dedupe(
        constants.content.last.rows.flatMap((row) => (row.model === model ? [row.position] : [])),
      ),
      byPosition,
    );

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
  laws: Arr.NonEmptyReadonlyArray<RefusalLaw>,
  witness: RefusalWitness,
  constants: RefusalConstants,
): Explanation => {
  const named = laws.map((refused) => ({ law: refused.law, name: lawNameOf(refused) }));
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
 * One law of a refusal as the refusal carries it: its display text, the installed name of the
 * object that refused it ({@link installedNameOf}), and the name and rule the law table gives it.
 *
 * @param law - A law of an `invariant-rejected` outcome.
 * @returns Its facts.
 */
const lawFactOf = (refused: RefusalLaw): typeof RefusedLaw.Type => {
  const fact: Types.Mutable<typeof RefusedLaw.Type> = { text: Formatter.format(refused.law) };
  const installed = installedNameOf(refused);
  if (Option.isSome(installed)) {
    fact.installed = installed.value;
  }

  const name = lawNameOf(refused);
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
  refused: RefusalOf,
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
