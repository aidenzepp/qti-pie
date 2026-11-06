/**
 * A content model's positions and its Glushkov automaton (review U4): {@link automatonOf} numbers
 * a model's element and wildcard particles in tree order, links each to the positions that may come
 * after it, and finds the states where Unique Particle Attribution fails. `grammar/content.ts`
 * installs each model's automaton as the content grammar.
 */
import { Array as Arr, Option } from "effect";
import type {
  Compositor,
  NamespaceConstraint,
  Occurs,
  Particle,
  Processing,
  Sources,
} from "#pantry/vocab/inventory/types.ts";
import { admitsNamespace, namespaceClassesUnder } from "#pantry/vocab/namespaces.ts";

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
 * particle that cannot occur, its own `maxOccurs` or an enclosing group's 0, has no position, and
 * neither has a choice group that cannot.
 *
 * `choice` is the innermost choice group that encloses it, numbered from 1 per model, 0 for none,
 * and `sources` its particle's, where each version of its model states it.
 */
export interface Position {
  readonly choice: number;
  readonly number: number;
  readonly occurs: Occurs;
  readonly sources: Sources;
  readonly symbol: PositionSymbol;
}

/**
 * One choice group of a content model, numbered from 1 in tree order, with its own bounds and the
 * choice group that encloses it (0 for none).
 */
export interface ChoiceGroup {
  readonly number: number;
  readonly occurs: Occurs;
  readonly parent: number;
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
 * - `first`: the positions a child word may start at; `last`: those it may end at; `nullable`:
 *   whether the empty word is in the language.
 * - `follow`: per position (index `n - 1` for position `n`), the positions that may come next.
 * - `shared`: the kinds two or more positions name, where a child's kind does not decide its
 *   particle, and the automaton's state does.
 * - `ambiguous`: Unique Particle Attribution's breaches (XML Schema 1.0 Part 1, 3.8.6): a state from
 *   which one kind, or a wildcard and a kind it admits, leads to two positions. A breach is a
 *   finding about the XSD, never repaired here.
 */
export interface Automaton {
  readonly ambiguous: readonly Ambiguity[];
  readonly choices: readonly ChoiceGroup[];
  readonly first: ReadonlySet<number>;
  readonly follow: readonly ReadonlySet<number>[];
  readonly last: ReadonlySet<number>;
  readonly nullable: boolean;
  readonly positions: readonly Position[];
  readonly shared: readonly string[];
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
 * What the construction reads of a particle: whether it matches the empty word, and its first and
 * last positions.
 */
interface Reading {
  readonly first: ReadonlySet<number>;
  readonly last: ReadonlySet<number>;
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
 * @param namespaceOf - Each kind's namespace.
 * @param own - The model's kind's namespace, the wildcards' own.
 * @returns The clashing pairs.
 */
const clashesIn = (
  held: readonly Position[],
  namespaceOf: (kind: string) => string,
  own: string,
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
  link: (from: ReadonlySet<number>, to: ReadonlySet<number>) => void,
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

      const leading: ReadonlySet<number>[] = [];

      for (const member of inner) {
        leading.push(member.first);

        if (!member.nullable) {
          break;
        }
      }

      const trailing: ReadonlySet<number>[] = [];

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
  namespaceOf: (kind: string) => string,
  own: string,
): Automaton => {
  const positions: Position[] = [];
  const choices: ChoiceGroup[] = [];
  const follow: Set<number>[] = [];
  const link = (from: ReadonlySet<number>, to: ReadonlySet<number>): void => {
    for (const at of from) {
      for (const next of to) {
        follow[at - 1]?.add(next);
      }
    }
  };
  const visit = (node: Particle, choice: number): Reading => {
    if (never(node.occurs)) {
      return { first: new Set(), last: new Set(), nullable: true };
    }

    if (node._tag !== "group") {
      const number = positions.length + 1;

      positions.push({
        choice,
        number,
        occurs: node.occurs,
        sources: node.sources,
        symbol:
          node._tag === "element"
            ? { _tag: "kinds", kinds: node.kinds }
            : { _tag: "wildcard", namespace: node.namespace, processing: node.processing },
      });
      follow.push(new Set());

      const here = new Set([number]);

      if (repeats(node.occurs)) {
        link(here, here);
      }

      return { first: here, last: here, nullable: node.occurs.min === 0 };
    }

    const inner =
      node.compositor === "choice"
        ? (() => {
            const number = choices.length + 1;

            choices.push({ number, occurs: node.occurs, parent: choice });

            return node.particles.map((member) => visit(member, number));
          })()
        : node.particles.map((member) => visit(member, choice));
    const body = bodyOf(node.compositor, inner, link);

    if (repeats(node.occurs)) {
      link(body.last, body.first);
    }

    return { ...body, nullable: body.nullable || node.occurs.min === 0 };
  };
  const whole = visit(particle, 0);
  const counts = new Map<string, number>();

  for (const { symbol } of positions) {
    if (symbol._tag === "kinds") {
      for (const kind of new Set(symbol.kinds)) {
        counts.set(kind, (counts.get(kind) ?? 0) + 1);
      }
    }
  }

  const shared = [...counts]
    .flatMap(([kind, count]) => (count > 1 ? [kind] : []))
    .toSorted((left, right) => (left < right ? -1 : 1));
  const ambiguous = [whole.first, ...follow].flatMap((state, at) =>
    clashesIn(
      [...state].flatMap((number) => Option.toArray(Arr.get(positions, number - 1))),
      namespaceOf,
      own,
    ).map((pair): Ambiguity => ({ positions: pair, state: at })),
  );

  return {
    ambiguous,
    choices,
    first: whole.first,
    follow,
    last: whole.last,
    nullable: whole.nullable,
    positions,
    shared,
  };
};
