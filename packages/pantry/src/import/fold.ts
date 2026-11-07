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
 * - `copiesText`, whether its characters are its `stringPiece`: its parent's text is checked or
 *   copied (`inStringValue` of `#pantry/qti/node.ts`);
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
  TextDomain,
} from "#pantry/grammar/install.ts";
import type { Flag } from "#pantry/grammar/install.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeId, NodeRow } from "#pantry/model/xdm.ts";
import { copiedTextKinds, copiedUnder, universalDomains } from "#pantry/qti/node.ts";

/**
 * An ancestry flag's handle.
 */
type FlagHandle = (typeof Flag.handles)[number];

/**
 * What one node folds to.
 */
export interface Folded {
  readonly ancestry: ReadonlySet<FlagHandle>;
  /**
   * Whether the node's characters are its `stringPiece`: its parent's text is checked
   * (`checkedText`), or copied (`copiedTextKinds`, `copiedUnder`).
   */
  readonly copiesText: boolean;
  readonly elementChildren: bigint;
  readonly elements: bigint;
  readonly nearest: NodeId;
  readonly nearestKind: Kind;
  readonly state: number;
}

/**
 * What the fold keeps of a node for its children: its fold, and its governing type, its kind and
 * its parent's kind, `document` for the document node, which its children read as their
 * grandparent's (`copiedUnder`).
 */
interface Held extends Omit<Folded, "elementChildren"> {
  readonly governs: string;
  readonly kind: Kind;
  readonly parentKind: Kind;
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
 * Read the governor `GoverningOf` gives an element: the type whose attribute grammar and text
 * domain it is judged under.
 *
 * @param version - The element's version.
 * @param kind - Its kind.
 * @param governs - Its governing type.
 * @returns The governor, none where `GoverningOf` holds no row.
 */
export const governorOf = (version: string, kind: string, governs: string): Option.Option<string> =>
  Option.fromNullishOr(governorAt.get(keyOf(version, kind, governs)));

/**
 * The installed `TextDomain`, by `version governor`.
 */
const textDomainAt: ReadonlyMap<string, string> = new Map(
  TextDomain.rows.map(({ domain, governor, version }) => [keyOf(version, governor), domain]),
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
 * The domains whose text TextDomain never judges (`universalDomains` of `#pantry/qti/node.ts`).
 */
const universal: ReadonlySet<string> = new Set(universalDomains);

/**
 * The kinds whose text an overlay copies though no domain judges it (`copiedTextKinds`).
 */
const copied: ReadonlySet<string> = new Set(copiedTextKinds);

/**
 * Read the domain an element reads its text in: `TextDomain` under the governor `GoverningOf`
 * gives it.
 *
 * @param version - The element's version.
 * @param kind - Its kind.
 * @param governs - Its governing type.
 * @returns The domain, none where `GoverningOf` or `TextDomain` holds no row.
 */
export const textDomainOf = (
  version: string,
  kind: string,
  governs: string,
): Option.Option<string> =>
  Option.flatMap(governorOf(version, kind, governs), (governor) =>
    Option.fromNullishOr(textDomainAt.get(keyOf(version, governor))),
  );

/**
 * Decide whether an element's text is one TextDomain judges: its domain under its governor is
 * none of the universal domains (`checkedText` of `#pantry/qti/node.ts`, on the host).
 *
 * @param version - The element's version.
 * @param kind - Its kind.
 * @param governs - Its governing type.
 * @returns Whether its text is checked; false where `GoverningOf` or `TextDomain` holds no row,
 *   which PostgreSQL reads as NULL and so passes.
 */
const checksText = (version: string, kind: string, governs: string): boolean =>
  Option.exists(textDomainOf(version, kind, governs), (domain) => !universal.has(domain));

/**
 * The state a family's automaton starts in, before its first member: position 0, the family's
 * model as a whole (`#pantry/grammar/content.ts`, `ContentGrammar`'s positions), which
 * `placedStep` steps a first member from, and the document node's own state.
 */
const startState = 0;

/**
 * The state a member claims by its placement: an `at` member's one position, a `shared` member's
 * first, a `carries` member's predecessor's. It is the state written where no position follows, so
 * that `N5_Follow` refuses the member by name; a `carries` member always steps to it.
 *
 * @param placement - The member's placement.
 * @param was - Its predecessor's state, {@link startState} for the first member.
 * @returns The state.
 */
const claimedState = (placement: Placement, was: number): number =>
  Match.valueTags(placement, {
    at: ({ position }) => position,
    carries: () => was,
    shared: ({ positions }) => positions[0],
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
 * Read one node's fold: total, since {@link foldOf} folds every node it is given or throws.
 *
 * @param folds - A document's folds, as {@link foldOf} gives them.
 * @param node - The id of a node of that document.
 * @returns The node's fold.
 * @throws {Error} When the node is no node of the folded document: a defect of the caller, which
 *   read a node of one document in another's folds.
 */
export const foldAt = (folds: ReadonlyMap<NodeId, Folded>, node: NodeId): Folded => {
  const folded = folds.get(node);
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
 * @returns Each node's fold, by its id, which {@link foldAt} reads.
 * @throws {Error} When a node comes before its parent, which `flatten`'s document order rules out:
 *   a defect of the caller, never of the document.
 */
export const foldOf = (
  nodes: readonly NodeRow<Composed>[],
  context: DocumentContext,
): ReadonlyMap<NodeId, Folded> => {
  const folded = new Map<NodeId, { readonly held: Held; readonly under: Under }>();

  for (const node of nodes) {
    const { governs, id, kind, version } = node;
    if (node.parent === id) {
      folded.set(id, {
        held: {
          ancestry: context.ancestry,
          copiesText: false,
          elements: 0n,
          governs,
          kind,
          nearest: context.nearest,
          nearestKind: context.nearestKind,
          parentKind: kind,
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
        copiesText:
          checksText(version, parent.kind, parent.governs) ||
          copied.has(parent.kind) ||
          copiedUnder(parent.kind, parent.parentKind),
        elements: under.elements,
        governs,
        kind,
        nearest: fromInteraction ? node.parent : parent.nearest,
        nearestKind: fromInteraction ? parent.kind : parent.nearestKind,
        parentKind: parent.kind,
        state: under.state,
      },
      under: { elements: 0n, state: startState },
    });
  }

  return new Map(
    [...folded].map(([id, { held, under }]) => [id, { ...held, elementChildren: under.elements }]),
  );
};
