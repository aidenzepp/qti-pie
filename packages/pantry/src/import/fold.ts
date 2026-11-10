/**
 * The host's one fold of a document's tree fields: the values the laws derive along the tree, which
 * the importer writes on every `Node` row (the W5 amendment's §C) and the overlay builders read.
 *
 * Each node folds from its parent's fold and its predecessor sibling's state:
 *
 * - `ancestry`, its parent's with the flags its kind enters (`E1_derived`), the document node's its
 *   context's;
 * - `nearest` and `nearestKind`, its parent where the parent is an interaction, else its parent's
 *   (N8), the document node's its context's (spec reading 117);
 * - `state`, its content-automaton state (C5, N5), the document node's 0;
 * - `elements`, the elements among its parent's children up to it, itself included where it is one,
 *   the document node's 0, and `elementChildren`, the elements among its own children, which an
 *   overlay copies where `nodeCounts` holds it to `Node`'s fold of them.
 *
 * The law oracle folds the same fields with its own fold (`#pantry/model/folds.ts`), so the two
 * implementations stay apart and a host-against-oracle differential compares them.
 */
import { Match, Option } from "effect";
import type { Kind } from "#pantry/grammar/compose.ts";
import { placedStep, placementOf } from "#pantry/grammar/content.ts";
import type { Placement } from "#pantry/grammar/content.ts";
import {
  Enters,
  GoverningOf,
  grammar,
  interactionKinds,
  NodeKind,
  nonElementKinds,
} from "#pantry/grammar/install.ts";
import type { Flag } from "#pantry/grammar/install.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeId, NodeRow } from "#pantry/model/xdm.ts";

/**
 * An ancestry flag's handle.
 */
type FlagHandle = (typeof Flag.handles)[number];

/**
 * What one node folds to.
 */
export interface Folded {
  readonly ancestry: ReadonlySet<FlagHandle>;
  readonly elementChildren: bigint;
  readonly elements: bigint;
  readonly nearest: NodeId;
  readonly nearestKind: Kind;
  readonly state: number;
}

/**
 * What the fold keeps of a node for its children: its fold, and its kind, which steps their
 * automaton and names their nearest interaction.
 */
interface Held extends Omit<Folded, "elementChildren"> {
  readonly kind: Kind;
}

/**
 * What the fold keeps of a node's children so far, its cursor as each child is folded: the state
 * of the child folded last, {@link startState} before the first, and the elements among them.
 */
interface Under {
  elements: bigint;
  state: number;
}

/**
 * A key of the installed closed relations' row maps: its fields' values, space separated.
 *
 * @param values - The key's values, in the relation's key order.
 * @returns The text.
 */
const keyOf = (...values: readonly string[]): string => values.join(" ");

/**
 * The installed `GoverningOf`, by `version kind governs`.
 */
const governorAt: ReadonlyMap<string, string> = new Map(
  GoverningOf.rows.map(({ governor, governs, kind, version }) => [
    keyOf(version, kind, governs),
    governor,
  ]),
);

/**
 * Read a node's governor, `Node.governor`: what its attributes and text are judged under, as the
 * law states it (`typeGovernorOf` of `#pantry/qti/node.ts`, and `E1_derived` on `Node`). Under a
 * named type it is `GoverningOf`'s of (version, kind, type); with no type, and under a type
 * `GoverningOf` holds no row of (an `xsi:type` its kind's declared type does not derive, which
 * `XsiType derived` refuses), its kind's own, `KindGovernor`'s, which spells the kind's handle
 * (`#pantry/grammar/install.ts` `Governor`: each `NodeKind` handle first).
 *
 * @param version - The node's version.
 * @param kind - Its kind.
 * @param governs - Its governing type, none where no named type governs it.
 * @returns The governor's `Governor` handle.
 */
export const governorOf = (version: string, kind: string, governs: Option.Option<string>): string =>
  Option.match(
    governs.pipe(
      Option.flatMap((type) => Option.fromNullishOr(governorAt.get(keyOf(version, kind, type)))),
    ),
    { onNone: () => kind, onSome: (governor) => governor },
  );

/**
 * Read the installed `Enters` as the flags each node kind enters for its descendants: every kind
 * of the `NodeKind` roster a key, so a kind that enters none holds no flag rather than no entry.
 *
 * @returns The flags, by kind.
 * @throws {Error} When `Enters` names a kind outside the roster, a defect of the grammar.
 */
const enteredFlags = (): ReadonlyMap<string, readonly FlagHandle[]> => {
  const flags = new Map<string, FlagHandle[]>(NodeKind.handles.map((kind) => [kind, []]));
  for (const { flag, kind } of Enters.rows) {
    const entered = flags.get(kind);
    if (entered === undefined) {
      throw new Error(
        `Enters names the kind ${kind}, which the NodeKind roster does not hold. Regenerate the grammar's Enters.`,
      );
    }

    entered.push(flag);
  }

  return flags;
};

/**
 * The flags each node kind enters for its descendants ({@link enteredFlags}).
 */
const entersAt = enteredFlags();

/**
 * Read the flags a node's kind enters for its descendants.
 *
 * @param kind - The node's kind.
 * @returns Its flags, none for a kind that enters none.
 * @throws {Error} When the kind is outside the `NodeKind` roster, which holds every kind shred
 *   writes: a defect of the caller's rows, never of the document.
 */
const flagsEnteredBy = (kind: string): readonly FlagHandle[] => {
  const flags = entersAt.get(kind);
  if (flags === undefined) {
    throw new Error(
      `A node of kind ${kind} was folded, and the NodeKind roster holds no such kind. Fold the rows flatten writes of a shredded document.`,
    );
  }

  return flags;
};

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * The kinds that are no element, which the element counts step over.
 */
const nonElements: ReadonlySet<string> = new Set(nonElementKinds);

/**
 * The state a family's automaton starts in, before its first member: position 0, the family's
 * model as a whole (`#pantry/grammar/content.ts`, `ContentGrammar`'s positions), which
 * `placedStep` steps a first member from, and the document node's own state.
 */
const startState = 0;

/**
 * The state a member claims by its placement: an `at` member's one position, a `carries` member's
 * predecessor's, and a `shared` member's predecessor's where that is one of its positions, else its
 * first. It is the state written where no position follows, so that `N5_Follow` refuses the member
 * by name; a `carries` member always steps to it.
 *
 * A `shared` member reaches its claim only when none of its positions follows, since no state lets
 * two of them follow (`content.test.ts`, "decide every child's position"), so `N5_Follow` refuses
 * it whichever it claims. Claiming its predecessor's state leaves the family's automaton where it
 * was, as the law oracle folds the family with the member set aside (`src/test/oracle.ts`
 * `foldedOf`), so no later sibling and no owner's `lastState` reads a state the member alone
 * reached. Its first position does not: the third `m:mi` of an `m:mfrac` would claim the
 * numerator's position, where the model does not end, so the owner's row would break `N7_Last`
 * beside the member's `N5_Follow`, and the refusal would name whichever row PostgreSQL meets first.
 *
 * @param placement - The member's placement.
 * @param was - Its predecessor's state, {@link startState} for the first member.
 * @returns The state.
 */
const claimedState = (placement: Placement, was: number): number =>
  Match.valueTags(placement, {
    at: ({ position }) => position,
    carries: () => was,
    shared: ({ positions }) => (positions.includes(was) ? was : positions[0]),
  });

/**
 * Compute a member's content-automaton state (C5), the value N5 holds it to.
 *
 * `placedStep` gives the lawful state where there is one. Where there is none, the state is still
 * written, and a law refuses the node by name: an unadmitted kind keeps its predecessor's state,
 * which `N5_admitted` refuses; a kind whose position does not follow keeps the state its placement
 * claims ({@link claimedState}), which `N5_Follow` refuses.
 *
 * @param key - The version, the parent's kind and the member's.
 * @param key.child - The member's kind.
 * @param key.parent - The parent's kind.
 * @param key.version - The version.
 * @param was - Its predecessor's state, {@link startState} for the first member.
 * @returns The state.
 */
const stateOf = (
  key: {
    readonly child: string;
    readonly parent: string;
    readonly version: Composed["version"];
  },
  was: number,
): number =>
  Option.match(placementOf(grammar, key), {
    onNone: () => was,
    onSome: (placement) =>
      Option.getOrElse(placedStep(grammar.content, key, placement, was), () =>
        claimedState(placement, was),
      ),
  });

/**
 * The context of a document no site names, its fold's seed: no ancestry, and its own document node
 * as its nearest, of kind `document`.
 *
 * @param self - The document node's id.
 * @returns The context.
 */
export const ownContext = (self: NodeId): DocumentContext => ({
  ancestry: new Set(),
  nearest: self,
  nearestKind: "document",
});

/**
 * The key a document's folds are held under in {@link Folds}: this module's alone, so no reader but
 * {@link foldAt} reaches them.
 */
const byNode: unique symbol = Symbol("folds");

/**
 * A document's folds, as {@link foldOf} gives them: opaque, each node's read by {@link foldAt}, the
 * one reader, which is total.
 */
export interface Folds {
  readonly [byNode]: ReadonlyMap<NodeId, Folded>;
}

/**
 * Read one node's fold: total, since {@link foldOf} folds every node it is given or throws.
 *
 * @param folds - A document's folds, as {@link foldOf} gives them.
 * @param node - The id of a node of that document.
 * @returns The node's fold.
 * @throws {Error} When the node is no node of the folded document: a defect of the caller, which
 *   read a node of one document in another's folds.
 */
export const foldAt = (folds: Folds, node: NodeId): Folded => {
  const folded = folds[byNode].get(node);
  if (folded === undefined) {
    throw new Error(
      `Node ${node} is no node of the folded document, and foldOf folds every node it is given. Read each node in the folds of its own document.`,
    );
  }

  return folded;
};

/**
 * Fold a document's nodes under its context.
 *
 * The nodes come in document order, so each node's parent is folded before it, and its siblings
 * before it in slot order. The document node, its own parent, folds from the context alone; every
 * other node from its parent's fold and the state of the parent's child folded last,
 * {@link startState} for its first child.
 *
 * @param nodes - The document's node rows as `flatten` writes them, in document order.
 * @param context - The document's context.
 * @returns Each node's fold, which {@link foldAt} reads.
 * @throws {Error} When a node comes before its parent, which `flatten`'s document order rules out:
 *   a defect of the caller, never of the document.
 */
export const foldOf = (nodes: readonly NodeRow<Composed>[], context: DocumentContext): Folds => {
  const folded = new Map<NodeId, { readonly held: Held; readonly under: Under }>();

  for (const node of nodes) {
    const { id, kind, version } = node;
    if (node.parent === id) {
      folded.set(id, {
        held: {
          ancestry: context.ancestry,
          elements: 0n,
          kind,
          nearest: context.nearest,
          nearestKind: context.nearestKind,
          state: startState,
        },
        under: { elements: 0n, state: startState },
      });
      continue;
    }

    const parentFold = folded.get(node.parent);
    if (parentFold === undefined) {
      throw new Error(
        `Node ${id} comes before its parent ${node.parent}, but a document's nodes are folded in document order. Fold flatten's rows as it writes them.`,
      );
    }

    const { held: parent, under } = parentFold;
    const fromInteraction = interactions.has(parent.kind);
    under.state = stateOf({ child: kind, parent: parent.kind, version }, under.state);
    under.elements += nonElements.has(kind) ? 0n : 1n;
    folded.set(id, {
      held: {
        ancestry: new Set([...parent.ancestry, ...flagsEnteredBy(kind)]),
        elements: under.elements,
        kind,
        nearest: fromInteraction ? node.parent : parent.nearest,
        nearestKind: fromInteraction ? parent.kind : parent.nearestKind,
        state: under.state,
      },
      under: { elements: 0n, state: startState },
    });
  }

  return {
    [byNode]: new Map(
      [...folded].map(([id, { held, under }]) => [
        id,
        { ...held, elementChildren: under.elements },
      ]),
    ),
  };
};
