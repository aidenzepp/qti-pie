/**
 * A content model's positions and its Glushkov automaton (review U4): {@link automatonOf} numbers
 * a model's element and wildcard particles in tree order, links each to the positions that may come
 * after it, and finds the states where Unique Particle Attribution fails. `grammar/content.ts`
 * installs each model's automaton as the content grammar.
 */
import { Option } from "effect";
import type {
  Compositor,
  NamespaceConstraint,
  Occurs,
  Particle,
  Processing,
  Sources,
} from "#pantry/vocab/inventory/types.ts";
import { admitsNamespace, namespaceClassesUnder } from "#pantry/vocab/namespaces.ts";
import type { NamespaceOfKind } from "#pantry/vocab/namespaces.ts";

/**
 * Whether bounds allow more than one occurrence.
 *
 * @param occurs - The bounds.
 * @returns Whether the maximum is unbounded or above 1.
 */
const repeats = (occurs: Occurs): boolean =>
  Option.match(occurs.max, { onNone: () => true, onSome: (max) => max > 1 });

/**
 * Join sets.
 *
 * @param sets - The sets.
 * @returns Every member any of them holds, in first-seen order.
 */
const unionOf = <A>(sets: readonly ReadonlySet<A>[]): ReadonlySet<A> =>
  new Set(sets.flatMap((set) => [...set]));

/**
 * What a position of a model stands for: the kinds of an element particle, or a wildcard, which
 * stands for every element its namespace constraint admits that no element particle of the model
 * names.
 */
export type PositionSymbol =
  | { readonly _tag: "kinds"; readonly kinds: readonly [string, ...string[]] }
  | {
      readonly _tag: "wildcard";
      readonly namespace: NamespaceConstraint;
      readonly processing: Processing;
    };

/**
 * One position of a content model: an element particle or a wildcard that may occur, numbered from
 * 1 in the model's tree order (U4's particle numbering, and the Glushkov automaton's positions). A
 * particle that cannot occur, its own `maxOccurs` or an enclosing group's 0, has no position.
 *
 * `sources` are its particle's, where each version of its model states it.
 */
export interface Position {
  readonly number: number;
  readonly occurs: Occurs;
  readonly sources: Sources;
  readonly symbol: PositionSymbol;
}

/**
 * A content model as positions (review U4) and as its Glushkov automaton.
 *
 * The automaton reads a model's relaxed language: each particle's bounds relaxed to whether it may
 * be absent (`min` 0) and whether it may repeat (`max` above 1 or unbounded), every count above
 * one left to the child-set count laws. Unrolling a bounded repetition into positions would give
 * one particle several numbers, and U4's `ChildGrammar(version, parent, child) → particle` needs
 * one number per particle; a particle's counts are its own law already. Over the pinned models the
 * relaxation loses only the counts.
 *
 * The automaton's states are the installed `Follow` and `Last`'s own: state 0 is the start, before
 * any child, and state `n` is the state after a child at position `n`.
 *
 * - `next`: per state, `next[0]` the start's, the positions a child may take there; it holds one
 *   entry more than `positions`.
 * - `ends`: the states a family may end in, 0 among them exactly when the empty word is in the
 *   language.
 * - `ambiguous`: Unique Particle Attribution's breaches (XML Schema 1.0 Part 1, 3.8.6): a state from
 *   which one kind, or a wildcard and a kind it admits, leads to two positions. A breach is a
 *   finding about the XSD, never repaired here.
 */
export interface Automaton {
  readonly ambiguous: readonly Ambiguity[];
  readonly ends: ReadonlySet<number>;
  readonly next: readonly ReadonlySet<number>[];
  readonly positions: readonly Position[];
}

/**
 * One breach of Unique Particle Attribution: the state it is in (0 for the start, else the
 * position the word stands at) and the two positions one child could take.
 */
export interface Ambiguity {
  readonly positions: readonly [number, number];
  readonly state: number;
}

/**
 * A state of the automaton as the construction builds it: the positions a child may take next.
 */
interface State {
  readonly follows: Set<PositionState>;
}

/**
 * The state after a child at a position: the position, and the positions a child may take next.
 */
interface PositionState extends State {
  readonly position: Position;
}

/**
 * What the construction reads of a particle: whether it matches the empty word, and its first and
 * last positions.
 */
interface Reading {
  readonly first: ReadonlySet<PositionState>;
  readonly last: ReadonlySet<PositionState>;
  readonly nullable: boolean;
}

/**
 * Whether bounds allow no occurrence at all.
 *
 * @param occurs - The bounds.
 * @returns Whether the maximum is 0.
 */
const never = (occurs: Occurs): boolean => Option.contains(occurs.max, 0);

/**
 * The pairs of a state's positions that can take one child: two element particles that share a
 * kind, a wildcard and an element particle whose kind's namespace it admits, or two wildcards whose
 * constraints share a namespace. Each pair once, the lower position first.
 *
 * @param held - The state's positions.
 * @param namespaceOf - Each kind's namespace: a kind that names no element is none a wildcard
 *   admits by its namespace (`admitsNamespace`).
 * @param own - The model's kind's namespace, the wildcards' own.
 * @returns The clashing pairs.
 */
const clashesIn = (
  held: readonly Position[],
  namespaceOf: (kind: string) => NamespaceOfKind,
  own: NamespaceOfKind,
): readonly (readonly [number, number])[] => {
  const clashes = new Map<string, readonly [number, number]>();
  const note = (left: number, right: number): void => {
    const pair = left < right ? ([left, right] as const) : ([right, left] as const);

    clashes.set(pair.join(" "), pair);
  };
  const byKind = new Map<string, number>();
  const wildcards = held.flatMap((position) =>
    position.symbol._tag === "wildcard"
      ? [{ number: position.number, symbol: position.symbol }]
      : [],
  );

  for (const { number, symbol } of held) {
    if (symbol._tag === "kinds") {
      for (const kind of new Set(symbol.kinds)) {
        const earlier = byKind.get(kind);

        if (earlier === undefined) {
          byKind.set(kind, number);
        } else {
          note(earlier, number);
        }

        for (const wildcard of wildcards) {
          if (admitsNamespace(wildcard.symbol.namespace, own, namespaceOf(kind))) {
            note(wildcard.number, number);
          }
        }
      }
    }
  }

  for (const [index, left] of wildcards.entries()) {
    for (const right of wildcards.slice(index + 1)) {
      if (
        namespaceClassesUnder[left.symbol.namespace].some((admitted) =>
          namespaceClassesUnder[right.symbol.namespace].includes(admitted),
        )
      ) {
        note(left.number, right.number);
      }
    }
  }

  return [...clashes.values()];
};

/**
 * Join a group's members' readings, linking each member's last positions to the next members'
 * first, as its compositor orders them.
 *
 * - A sequence's first is its leading members' firsts up to the first that cannot be empty, and its
 *   last the trailing ones' lasts; each member's last links to every later member's first up to one
 *   that cannot be empty.
 * - A choice joins its alternatives' firsts and lasts, and links nothing.
 * - An `all` group's members come once each in any order: every member's last links to every other
 *   member's first, each member's count left to the count laws.
 *
 * @param compositor - The group's compositor.
 * @param inner - Its members' readings, in order.
 * @param link - Add follow edges.
 * @returns The group's body, read once.
 */
const bodyOf = (
  compositor: Compositor,
  inner: readonly Reading[],
  link: (from: ReadonlySet<State>, to: ReadonlySet<PositionState>) => void,
): Reading => {
  switch (compositor) {
    case "choice": {
      return {
        first: unionOf(inner.map(({ first }) => first)),
        last: unionOf(inner.map(({ last }) => last)),
        nullable: inner.length === 0 || inner.some(({ nullable }) => nullable),
      };
    }
    case "all": {
      for (const [at, member] of inner.entries()) {
        for (const [other, next] of inner.entries()) {
          if (other !== at) {
            link(member.last, next.first);
          }
        }
      }

      return {
        first: unionOf(inner.map(({ first }) => first)),
        last: unionOf(inner.map(({ last }) => last)),
        nullable: inner.every(({ nullable }) => nullable),
      };
    }
    case "sequence": {
      for (const [at, member] of inner.entries()) {
        for (const next of inner.slice(at + 1)) {
          link(member.last, next.first);

          if (!next.nullable) {
            break;
          }
        }
      }

      const leading: ReadonlySet<PositionState>[] = [];

      for (const member of inner) {
        leading.push(member.first);

        if (!member.nullable) {
          break;
        }
      }

      const trailing: ReadonlySet<PositionState>[] = [];

      for (const member of inner.toReversed()) {
        trailing.push(member.last);

        if (!member.nullable) {
          break;
        }
      }

      return {
        first: unionOf(leading),
        last: unionOf(trailing),
        nullable: inner.every(({ nullable }) => nullable),
      };
    }
    default: {
      return compositor satisfies never;
    }
  }
};

/**
 * Build a content model's positions and Glushkov automaton.
 *
 * @param particle - The model's particle.
 * @param namespaceOf - The namespace each kind's element is in, which decides what a wildcard
 *   admits.
 * @param own - The namespace of the model's own kind, a wildcard's own.
 * @returns The automaton.
 */
export const automatonOf = (
  particle: Particle,
  namespaceOf: (kind: string) => NamespaceOfKind,
  own: NamespaceOfKind,
): Automaton => {
  // The start, before any child; then one state per position, the state after a child there.
  const start: State = { follows: new Set() };
  const states: PositionState[] = [];
  const link = (from: ReadonlySet<State>, to: ReadonlySet<PositionState>): void => {
    for (const state of from) {
      for (const taken of to) {
        state.follows.add(taken);
      }
    }
  };
  const visit = (node: Particle): Reading => {
    if (never(node.occurs)) {
      return { first: new Set(), last: new Set(), nullable: true };
    }

    if (node._tag !== "group") {
      const state: PositionState = {
        follows: new Set(),
        position: {
          number: states.length + 1,
          occurs: node.occurs,
          sources: node.sources,
          symbol:
            node._tag === "element"
              ? { _tag: "kinds", kinds: node.kinds }
              : { _tag: "wildcard", namespace: node.namespace, processing: node.processing },
        },
      };

      states.push(state);

      const here = new Set([state]);

      if (repeats(node.occurs)) {
        link(here, here);
      }

      return { first: here, last: here, nullable: node.occurs.min === 0 };
    }

    const body = bodyOf(
      node.compositor,
      node.particles.map((member) => visit(member)),
      link,
    );

    if (repeats(node.occurs)) {
      link(body.last, body.first);
    }

    return { ...body, nullable: body.nullable || node.occurs.min === 0 };
  };
  const whole = visit(particle);
  link(new Set([start]), whole.first);

  // State 0 is the start; state `n` is the one after a child at position `n`.
  const ordered: readonly State[] = [start, ...states];
  const numberOf = ({ position }: PositionState): number => position.number;
  const ambiguous = ordered.flatMap((state, at) =>
    clashesIn(
      [...state.follows].map(({ position }) => position),
      namespaceOf,
      own,
    ).map((pair): Ambiguity => ({ positions: pair, state: at })),
  );

  return {
    ambiguous,
    ends: new Set([...(whole.nullable ? [0] : []), ...[...whole.last].map(numberOf)]),
    next: ordered.map(({ follows }) => new Set([...follows].map(numberOf))),
    positions: states.map(({ position }) => position),
  };
};
