/**
 * The ancestry grammar as three closed sets over kind × flag: `Enters`, `Banned` and `Needs`
 * (fin.md §13 P3, §16).
 *
 * An ancestry is the set of flags a node's ancestors enter, one `bit(8)` on `Node`. A node hands
 * its children `ancestry = parentAncestry | Enters[kind]`, and a node of kind k may sit in its
 * parent's ancestry when that ancestry holds no flag of `Banned[k]` and every flag of `Needs[k]`.
 * The flags are independent, so these three constants replace the product automaton `AncestryStep`,
 * 56 states × 363 kinds written out as 18,924 rows.
 *
 * Each set is keyed by (kind, flag), kind first, so kind k's row is the 8 cells from k·8,
 * `substring(S FROM k·8 + 1 FOR 8)`: a `bit(8)` laid out as an ancestry is, `fb` leftmost.
 */
import { Option, Result } from "effect";
import { closed } from "#pantry/grammar/closed.ts";
import type { Closed, ClosedRelationError, Field } from "#pantry/grammar/closed.ts";
import type { kinds as asiKinds } from "#pantry/schema/kinds/asi.ts";

/**
 * The ancestry flags in code order. A flag's code is its bit's position in the `bit(8)`, the first
 * flag leftmost, so a kind's row of each set reads as an ancestry does.
 */
export const flags = ["fb", "modal", "rubric", "tmpl", "int", "gap", "choice", "htx"] as const;

/**
 * One ancestry flag.
 */
export type Flag = (typeof flags)[number];

/**
 * An ancestry as the host shows a `bit(8)`: the flags it holds.
 */
export type Ancestry = ReadonlySet<Flag>;

/**
 * The key of the three sets: a `NodeKind` handle, then a flag.
 */
export type KindFlag = readonly [Field<"kind", string>, Field<"flag", Flag>];

/**
 * A closed set over kind × flag, one bit a cell.
 */
export type KindFlagSet = Closed<KindFlag, readonly []>;

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
  readonly enters: KindFlagSet;
  /**
   * The flags without which a kind may not sit, read in its parent's ancestry. A flag to be absent
   * is `Banned`; a flag to be present is here, since no set of flags to avoid can state it.
   */
  readonly needs: KindFlagSet;
}

/**
 * An ASI kind, the vocabulary every kind the grammar names comes from.
 */
type AsiKind = (typeof asiKinds)[number];

/**
 * A rectangle of a kind × flag set: every kind it lists holds every flag it lists.
 */
interface Block<Kind extends string> {
  readonly flags: readonly Flag[];
  readonly kinds: readonly Kind[];
}

/**
 * The flags under which an interaction may not sit: no interaction inside another, nor inside a
 * choice, a hottext, a rubric block, a template block or a modal feedback.
 */
const interactionBans = [
  "int",
  "choice",
  "htx",
  "rubric",
  "tmpl",
  "modal",
] as const satisfies readonly Flag[];

/**
 * The kinds that enter a flag, beside the interactions, which each enter `int`.
 */
const entering = [
  { flags: ["gap"], kinds: ["qti-gap-match-interaction"] },
  {
    flags: ["choice"],
    kinds: [
      "qti-prompt",
      "qti-simple-choice",
      "qti-simple-associable-choice",
      "qti-inline-choice",
      "qti-label",
      "qti-gap-text",
      "qti-gap-img",
    ],
  },
  { flags: ["htx"], kinds: ["qti-hottext"] },
  { flags: ["rubric"], kinds: ["qti-rubric-block"] },
  {
    flags: ["tmpl"],
    kinds: [
      "qti-template-block",
      "qti-template-block.rubric",
      "qti-template-inline",
      "qti-template-inline.rubric",
    ],
  },
  { flags: ["modal"], kinds: ["qti-modal-feedback"] },
  {
    flags: ["fb"],
    kinds: ["qti-feedback-block", "qti-feedback-block.template", "qti-feedback-inline"],
  },
] as const satisfies readonly Block<AsiKind>[];

/**
 * The bans beside the interactions': a rubric block holds no rubric block, and a hottext no
 * hottext. A hottext under a prompt or a choice is admitted.
 */
const banning = [
  { flags: ["rubric"], kinds: ["qti-rubric-block"] },
  { flags: ["htx"], kinds: ["qti-hottext"] },
] as const satisfies readonly Block<AsiKind>[];

/**
 * The needs: a gap sits only inside a gap match interaction.
 */
const needing = [
  { flags: ["gap"], kinds: ["qti-gap"] },
] as const satisfies readonly Block<AsiKind>[];

/**
 * Expand rectangles into the rows of a kind × flag set.
 *
 * @param blocks - The rectangles.
 * @returns One row for each kind and flag of each rectangle.
 */
const rowsOf = (
  blocks: readonly Block<string>[],
): readonly { readonly flag: Flag; readonly kind: string }[] =>
  blocks.flatMap((block) =>
    block.kinds.flatMap((kind) => block.flags.map((flag) => ({ flag, kind }))),
  );

/**
 * Construct the ancestry grammar over a composed vocabulary.
 *
 * The interactions are an input, not a list held here, because the `Interaction` set that
 * `Node.parentIsInteraction` reads owns them, and a vocabulary that adds an interaction adds it
 * there.
 *
 * @param vocabulary - The composed vocabulary.
 * @param vocabulary.kinds - The `NodeKind` handles in code order, the sets' first key field.
 * @param vocabulary.interactions - The interaction kinds: each enters `int` and carries the
 *   interaction bans.
 * @returns The three sets, or the first reason one has no constant, as for a kind the grammar names
 *   that the roster lacks.
 */
export const generate = (vocabulary: {
  readonly interactions: readonly string[];
  readonly kinds: readonly string[];
}): Result.Result<AncestrySets, ClosedRelationError> =>
  Result.gen(function* generateAncestry() {
    const key: KindFlag = [
      { name: "kind", values: vocabulary.kinds },
      { name: "flag", values: flags },
    ];
    const set = (name: string, blocks: readonly Block<string>[]) =>
      closed({ key, name, payload: [], rows: rowsOf(blocks) });

    const enters = yield* set("Enters", [
      { flags: ["int"], kinds: vocabulary.interactions },
      ...entering,
    ]);
    const banned = yield* set("Banned", [
      { flags: interactionBans, kinds: vocabulary.interactions },
      ...banning,
    ]);
    const needs = yield* set("Needs", needing);

    return { banned, enters, needs };
  });

/**
 * Read a kind's row of a kind × flag set, the `bit(8)` as the host shows it.
 *
 * @param set - The set.
 * @param kind - The `NodeKind` handle.
 * @returns The flags the set holds for the kind, none for a kind outside its roster.
 */
export const rowOf = (set: KindFlagSet, kind: string): Ancestry =>
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
 * @param sets - The ancestry grammar.
 * @param parent - The ancestry the node sits in, its parent's own.
 * @param kind - The node's kind.
 * @returns Whether the node may sit there.
 */
export const admits = (sets: AncestrySets, parent: Ancestry, kind: string): boolean =>
  rowOf(sets.banned, kind).isDisjointFrom(parent) && rowOf(sets.needs, kind).isSubsetOf(parent);
