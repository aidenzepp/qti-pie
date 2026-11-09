/**
 * The ancestry grammar as three closed sets over kind × flag: `Enters`, `Banned` and `Needs`
 * (fin.md §13 P3, §16).
 *
 * An ancestry is the set of flags a node's ancestors enter, one `bit(10)` on `Node`. A node hands
 * its children `ancestry = parentAncestry | Enters[kind]`, and a node of kind k may sit in its
 * parent's ancestry when that ancestry holds no flag of `Banned[k]` and every flag of `Needs[k]`.
 * The flags are independent, so the three sets are the whole grammar: each flag is judged on its
 * own, and no state stands for a combination of flags.
 *
 * Each set is keyed by (kind, flag), kind first, so kind k's row is the 10 cells from k·10,
 * `substring(S FROM k·10 + 1 FOR 10)`: a `bit(10)` laid out as an ancestry is, `fb` leftmost.
 */
import { Option } from "effect";
import { closed, idField, indexed, roster } from "#pantry/grammar/closed.ts";
import type { Closed, IdField, Indexed, Roster } from "#pantry/grammar/closed.ts";

/**
 * The ancestry flags in code order. A flag's code is its bit's position in the `bit(10)`, the first
 * flag leftmost, so a kind's row of each set reads as an ancestry does. Codes are append-only:
 * `test`, the content of a test's rubric block or feedback, comes after the eight an item's kinds
 * enter, and `math`, the content of a MathML `m:math`, after it (spec reading 2: one `m:math` may
 * not contain another, MathML 3 §2.2).
 */
export const flags = [
  "fb",
  "modal",
  "rubric",
  "tmpl",
  "int",
  "gap",
  "choice",
  "htx",
  "test",
  "math",
] as const;

/**
 * One ancestry flag.
 */
export type Flag = (typeof flags)[number];

/**
 * An ancestry as the host shows a `bit(10)`: the flags it holds.
 */
export type Ancestry = ReadonlySet<Flag>;

/**
 * The key of the three sets: a `NodeKind` handle, then a flag.
 */
export type KindFlag = readonly [IdField<"kind", string>, IdField<"flag", Flag>];

/**
 * A closed set over kind × flag, one bit a cell.
 */
export type KindFlagSet = Closed<KindFlag, readonly []>;

/**
 * A kind × flag set read by kind: `Enters`, which a node's ancestry steps by on every serving path
 * (`#pantry/model/folds.ts`), and any set a test reads by kind.
 */
export type IndexedFlagSet = Indexed<KindFlag, readonly []>;

/**
 * The ancestry grammar over one `NodeKind` roster.
 */
export interface AncestrySets {
  /**
   * The flags under which a kind may not sit, read in its parent's ancestry.
   */
  readonly banned: KindFlagSet;
  /**
   * The flags a kind adds to its children's ancestry.
   */
  readonly enters: IndexedFlagSet;
  /**
   * The flags without which a kind may not sit, read in its parent's ancestry. A flag to be absent
   * is `Banned`; a flag to be present is here, since no set of flags to avoid can state it.
   */
  readonly needs: KindFlagSet;
}

/**
 * A rectangle of a kind × flag set: every kind it lists holds every flag it lists.
 */
export interface Block {
  readonly flags: readonly Flag[];
  readonly kinds: readonly string[];
}

/**
 * A vocabulary's share of the ancestry grammar: the kinds that enter flags, the kinds banned under
 * flags, and the kinds that need flags, each as rectangles. A vocabulary that states none has three
 * empty lists.
 */
export interface AncestryFacet {
  readonly banning: readonly Block[];
  readonly entering: readonly Block[];
  readonly needing: readonly Block[];
}

/**
 * The flags under which an interaction may not sit: no interaction inside another, nor inside a
 * choice, a hottext, a rubric block, a template block, a modal feedback, or a test's rubric block
 * or feedback.
 */
export const interactionBans = [
  "int",
  "choice",
  "htx",
  "rubric",
  "tmpl",
  "modal",
  "test",
] as const satisfies readonly Flag[];

/**
 * Expand rectangles into the rows of a kind × flag set.
 *
 * @param blocks - The rectangles.
 * @returns One row for each kind and flag of each rectangle.
 */
const rowsOf = (
  blocks: readonly Block[],
): readonly { readonly flag: Flag; readonly kind: string }[] =>
  blocks.flatMap((block) =>
    block.kinds.flatMap((kind) => block.flags.map((flag) => ({ flag, kind }))),
  );

/**
 * Construct the ancestry grammar over a composed vocabulary.
 *
 * Every interaction enters `int` and carries the {@link interactionBans}; every other row is a
 * vocabulary's own block. The interactions are an input, because the `Interaction` set that
 * `Node.parentIsInteraction` reads owns them, and a vocabulary that adds an interaction adds it
 * there.
 *
 * @param vocabulary - The composed vocabulary.
 * @param vocabulary.kinds - The `NodeKind` roster, the sets' first key field.
 * @param vocabulary.interactions - The interaction kinds.
 * @param vocabulary.facets - Each vocabulary's blocks.
 * @returns The three sets. A kind a block names that the roster lacks is a fault of the rows
 *   (`faultOf`), which the tests find and grizzle refuses.
 */
export const generate = (vocabulary: {
  readonly facets: readonly AncestryFacet[];
  readonly interactions: readonly string[];
  readonly kinds: Roster<string>;
}): AncestrySets => {
  const { facets, interactions } = vocabulary;
  const key: KindFlag = [idField("kind", vocabulary.kinds), idField("flag", roster("Flag", flags))];
  const set = (name: string, blocks: readonly Block[]) =>
    closed({ key, name, payload: [], rows: rowsOf(blocks) });

  const enters = indexed(
    set("Enters", [
      { flags: ["int"], kinds: interactions },
      ...facets.flatMap((facet) => facet.entering),
    ]),
  );
  const banned = set("Banned", [
    { flags: interactionBans, kinds: interactions },
    ...facets.flatMap((facet) => facet.banning),
  ]);
  const needs = set(
    "Needs",
    facets.flatMap((facet) => facet.needing),
  );

  return { banned, enters, needs };
};

/**
 * Read a kind's row of a kind × flag set, the `bit(10)` as the host shows it.
 *
 * @param set - The set.
 * @param kind - The `NodeKind` handle.
 * @returns The flags the set holds for the kind, none for a kind outside its roster.
 */
export const rowOf = (set: IndexedFlagSet, kind: string): Ancestry =>
  new Set(flags.filter((flag) => Option.isSome(set.lookup({ flag, kind }))));

/**
 * Compute the ancestry a node hands its children: `parentAncestry | Enters[kind]`, the node's own
 * `ancestry`.
 *
 * @param sets - The ancestry grammar.
 * @param parent - The ancestry the node sits in, its parent's own.
 * @param kind - The node's kind.
 * @returns The node's ancestry.
 */
export const step = (sets: AncestrySets, parent: Ancestry, kind: string): Ancestry =>
  parent.union(rowOf(sets.enters, kind));

/**
 * Decide whether a node of a kind may sit in an ancestry: it holds no flag of `Banned[kind]` and
 * every flag of `Needs[kind]`.
 *
 * Both read the ancestry the node sits in, never its own, because a kind may enter a flag it is
 * banned under: an interaction enters `int` and may not sit inside one, so a ban over the node's
 * own ancestry would refuse every interaction.
 *
 * @param sets - `Banned` and `Needs`, each indexed by its reader: no serving path reads either by
 *   kind, so the grammar holds them unindexed and a test indexes them itself.
 * @param sets.banned - `Banned`, indexed.
 * @param sets.needs - `Needs`, indexed.
 * @param parent - The ancestry the node sits in, its parent's own.
 * @param kind - The node's kind.
 * @returns Whether the node may sit there.
 */
export const admits = (
  sets: { readonly banned: IndexedFlagSet; readonly needs: IndexedFlagSet },
  parent: Ancestry,
  kind: string,
): boolean =>
  rowOf(sets.banned, kind).isDisjointFrom(parent) && rowOf(sets.needs, kind).isSubsetOf(parent);
