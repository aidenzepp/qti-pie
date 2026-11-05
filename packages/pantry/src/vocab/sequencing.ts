/**
 * The rank projection of the content-model IR: what a kind's content model says about the order of
 * its children, as `Order`'s monotone intervals state it (fin.md P5 and §17, review R12).
 *
 * A model is read to ranks by these rules, which relax every particle's bounds, since how many
 * children of a kind a parent holds is the child-set laws' to state, not `Order`'s:
 *
 * - **A particle is a rank.** An element particle is one rank of the kinds it stands for, and a
 *   wildcard one rank of {@link others}, every element no other rank names; the particles of a
 *   sequence are its ranks in order, and a sequence inside a sequence adds its ranks in its place.
 *   A particle that cannot occur adds none.
 * - **A choice is one rank**, the union of its alternatives', and so is an `all`. A choice of
 *   alternatives that hold ranks of their own, occurring at most once, stands its alternatives side
 *   by side instead: its rank i is every alternative's rank i, since one alternative's children are
 *   never beside another's.
 * - **Neighbouring ranks merge when they are one rank.** Two ranks of the same kinds are one. A rank
 *   whose kinds a later, repeatable rank all holds merges into it when the rank may be absent, or
 *   when the later rank's other kinds are all held by the repeatable rank before it, which then
 *   takes any of them that comes before the required one (`ssml:speak`'s wildcard). The same holds
 *   in mirror image, for a rank that holds every kind of the rank after it.
 * - **A kind's interval is the ranks that hold it:** a kind is in one run of ranks or in none. A kind
 *   every rank holds is free, as is a kind the model names nowhere: it neither raises the state nor
 *   is held by it.
 *
 * A model no intervals express is non-monotone, with one or more of the {@link Defect}s: a kind
 * that recurs in a later rank after another (`recurs`); a rank its particle must fill that shares a
 * kind with another rank (`position`); a group that may repeat and holds ranks of its own
 * (`repeated`); a choice whose ordered alternatives share a kind (`alternatives`).
 */
import { Array as Arr, Option } from "effect";
import type {
  Compositor,
  ContentType,
  NamespaceConstraint,
  Occurs,
  Particle,
  Processing,
  Sources,
} from "#pantry/vocab/inventory/types.ts";
import { admitsNamespace, namespaceClassesUnder } from "#pantry/vocab/namespaces.ts";

/**
 * The member of a rank that stands for every element child its model's ranks do not name: a
 * wildcard's rank.
 */
export const others = { _tag: "others" } as const;

/**
 * The marker {@link others}.
 */
export type Others = typeof others;

/**
 * One rank of a model: the kinds that share it, and {@link others} for a wildcard's.
 */
export type OrderRank = readonly (Others | string)[];

/**
 * Why no monotone intervals express a model:
 *
 * - `recurs`: a kind recurs in a later rank after another;
 * - `position`: a rank its particle must fill shares a kind with another rank, so where the kind may
 *   stand depends on its position, not its kind (a required first child that may also recur);
 * - `repeated`: a group that may repeat holds an order of its own, a sequence or a choice of an
 *   ordered alternative, which comes round again with each repetition;
 * - `alternatives`: a choice whose alternatives are ordered and share a kind, so the kind's place
 *   depends on which alternative holds it.
 */
export type Defect = "alternatives" | "position" | "recurs" | "repeated";

/**
 * The name a wildcard's rank holds while ranks are read. No kind handle holds a space, so it never
 * meets a kind.
 */
const wildcardName = "the wildcard";

/**
 * One rank of a model being read: the names it holds, whether its particle must occur wherever its
 * group does, and whether it may hold more than one child.
 */
interface Rank {
  readonly names: ReadonlySet<string>;
  readonly repeated: boolean;
  readonly required: boolean;
}

/**
 * A particle read to its ranks, with the defects found inside it.
 */
interface RankReading {
  readonly defects: ReadonlySet<Defect>;
  readonly ranks: readonly Rank[];
}

/**
 * Whether bounds allow more than one occurrence.
 *
 * @param occurs - The bounds.
 * @returns Whether the maximum is unbounded or above 1.
 */
const repeats = (occurs: Occurs): boolean =>
  Option.match(occurs.max, { onNone: () => true, onSome: (max) => max > 1 });

/**
 * Whether every name of one set is in another.
 *
 * @param inner - The names that must be held.
 * @param outer - The names that may hold them.
 * @returns Whether `outer` holds every name of `inner`.
 */
const within = (inner: ReadonlySet<string>, outer: ReadonlySet<string>): boolean =>
  [...inner].every((name) => outer.has(name));

/**
 * Join sets.
 *
 * @param sets - The sets.
 * @returns Every member any of them holds, in first-seen order.
 */
const unionOf = <A>(sets: readonly ReadonlySet<A>[]): ReadonlySet<A> =>
  new Set(sets.flatMap((set) => [...set]));

/**
 * Fold ranks into one, for a group whose order is lost: every name, held any number of times.
 *
 * @param ranks - The ranks.
 * @param required - Whether the group must occur.
 * @returns The rank.
 */
const collapse = (ranks: readonly Rank[], required: boolean): Rank => ({
  names: unionOf(ranks.map((rank) => rank.names)),
  repeated: true,
  required: required && ranks.some((rank) => rank.required),
});

/**
 * Whether a neighbouring rank absorbs the elements of some names that stand beside a required rank
 * it neighbours: it holds every one of them and may repeat.
 *
 * @param rank - The neighbouring rank, none at either end of the ranks.
 * @param names - The names to absorb.
 * @returns Whether it does.
 */
const absorbs = (rank: Option.Option<Rank>, names: ReadonlySet<string>): boolean =>
  Option.exists(rank, (held) => held.repeated && within(names, held.names));

/**
 * The names one rank holds that another does not.
 *
 * @param wide - The rank whose names are kept.
 * @param narrow - The rank whose names are left out.
 * @returns The difference.
 */
const beyond = (wide: Rank, narrow: Rank): ReadonlySet<string> =>
  new Set([...wide.names].filter((name) => !narrow.names.has(name)));

/**
 * Merge two neighbouring ranks when they are one rank (the reading rules' third).
 *
 * @param earlier - The first rank.
 * @param later - The rank after it.
 * @param before - The rank before `earlier`, none when it is the first.
 * @param after - The rank after `later`, none when it is the last.
 * @returns The merged rank, or none when the two are distinct ranks.
 */
const merged = (
  earlier: Rank,
  later: Rank,
  before: Option.Option<Rank>,
  after: Option.Option<Rank>,
): Option.Option<Rank> => {
  if (within(earlier.names, later.names) && within(later.names, earlier.names)) {
    return Option.some({
      names: earlier.names,
      repeated: true,
      required: earlier.required || later.required,
    });
  }

  if (
    within(earlier.names, later.names) &&
    later.repeated &&
    (!earlier.required || absorbs(before, beyond(later, earlier)))
  ) {
    return Option.some({ names: later.names, repeated: true, required: later.required });
  }

  if (
    within(later.names, earlier.names) &&
    earlier.repeated &&
    (!later.required || absorbs(after, beyond(earlier, later)))
  ) {
    return Option.some({ names: earlier.names, repeated: true, required: earlier.required });
  }

  return Option.none();
};

/**
 * Merge the ranks at `at` and `at + 1` when they are one rank.
 *
 * @param ranks - The ranks.
 * @param at - The first rank's index.
 * @returns The merged rank, or none when the two are distinct ranks or `at + 1` is past the end.
 */
const mergeAt = (ranks: readonly Rank[], at: number): Option.Option<Rank> =>
  Option.flatMap(Option.all([Arr.get(ranks, at), Arr.get(ranks, at + 1)]), ([earlier, later]) =>
    merged(earlier, later, Arr.get(ranks, at - 1), Arr.get(ranks, at + 2)),
  );

/**
 * Merge every pair of neighbouring ranks that are one rank, until none is left.
 *
 * @param ranks - The ranks of a sequence, in order.
 * @returns The ranks, merged.
 */
const normalize = (ranks: readonly Rank[]): readonly Rank[] => {
  for (let at = 0; at + 1 < ranks.length; at += 1) {
    const joined = mergeAt(ranks, at);

    if (Option.isSome(joined)) {
      return normalize([...ranks.slice(0, at), joined.value, ...ranks.slice(at + 2)]);
    }
  }

  return ranks;
};

/**
 * Find the defects of a run of ranks no intervals express: a name in two ranks with another between
 * them, and a required rank whose names another rank also holds.
 *
 * @param ranks - The ranks, merged.
 * @returns The defects, `recurs` and `position`, that the ranks show.
 */
const defectsOf = (ranks: readonly Rank[]): ReadonlySet<Defect> => {
  const places = [
    ...Map.groupBy(
      ranks.flatMap((rank, at) => [...rank.names].map((name) => ({ at, name }))),
      ({ name }) => name,
    ),
  ].map(([name, held]) => ({ name, ranks: held.map(({ at }) => at) }));
  const shared = new Set(
    places.filter(({ ranks: held }) => held.length > 1).map(({ name }) => name),
  );
  const recurs = places.some(
    ({ ranks: held }) => Math.max(...held) - Math.min(...held) + 1 !== held.length,
  );
  const position = ranks.some(
    (rank) => rank.required && [...rank.names].some((name) => shared.has(name)),
  );

  return new Set<Defect>([
    ...(recurs ? (["recurs"] as const) : []),
    ...(position ? (["position"] as const) : []),
  ]);
};

/**
 * Whether two alternatives of a choice share a name.
 *
 * @param alternatives - The alternatives, read.
 * @returns Whether any name is held by two of them.
 */
const overlap = (alternatives: readonly RankReading[]): boolean => {
  const names = alternatives.map(({ ranks }) => unionOf(ranks.map((rank) => rank.names)));

  return names.some((held, at) =>
    names.slice(at + 1).some((other) => [...held].some((name) => other.has(name))),
  );
};

/**
 * Find why a choice of ordered alternatives cannot stand them side by side.
 *
 * @param alternatives - Its alternatives that hold ranks, read.
 * @param occurs - The choice's bounds.
 * @returns `repeated` for a choice that may repeat, `alternatives` for alternatives that share a
 *   name, or none for a choice whose alternatives stand side by side.
 */
const lossOf = (alternatives: readonly RankReading[], occurs: Occurs): Option.Option<Defect> => {
  if (repeats(occurs)) {
    return Option.some("repeated");
  }

  return overlap(alternatives) ? Option.some("alternatives") : Option.none();
};

/**
 * Read a choice's alternatives to its ranks (the reading rules' second).
 *
 * @param alternatives - Its alternatives, read.
 * @param occurs - The choice's bounds.
 * @returns One rank, or its ordered alternatives side by side; a repeated choice of ordered
 *   alternatives, or one whose ordered alternatives share a name, is one rank with its defect.
 */
const choiceOf = (alternatives: readonly RankReading[], occurs: Occurs): RankReading => {
  const inner = unionOf(alternatives.map(({ defects }) => defects));
  const present = alternatives.filter(({ ranks }) => ranks.length > 0);
  const ranks = present.flatMap((alternative) => alternative.ranks);
  const required =
    occurs.min >= 1 && alternatives.every(({ ranks: held }) => held.some((rank) => rank.required));

  if (present.length === 0) {
    return { defects: inner, ranks: [] };
  }

  if (present.every((alternative) => alternative.ranks.length === 1)) {
    return {
      defects: inner,
      ranks: [
        {
          names: unionOf(ranks.map((rank) => rank.names)),
          repeated: repeats(occurs) || ranks.some((rank) => rank.repeated),
          required,
        },
      ],
    };
  }

  const lost = lossOf(present, occurs);

  if (Option.isSome(lost)) {
    return { defects: new Set([...inner, lost.value]), ranks: [collapse(ranks, required)] };
  }

  const width = Math.max(...present.map((alternative) => alternative.ranks.length));

  return {
    defects: new Set([
      ...inner,
      ...present.flatMap((alternative) => [...defectsOf(alternative.ranks)]),
    ]),
    ranks: Array.from({ length: width }, (_, at) => {
      const held = present.flatMap((alternative) => Option.toArray(Arr.get(alternative.ranks, at)));

      return {
        names: unionOf(held.map((rank) => rank.names)),
        repeated: held.some((rank) => rank.repeated),
        required: false,
      };
    }),
  };
};

/**
 * Read a sequence's particles to its ranks (the reading rules' first and third).
 *
 * @param parts - Its particles, read.
 * @param occurs - The sequence's bounds.
 * @returns Its particles' ranks in order, merged; a repeated sequence of more than one rank is one
 *   rank with the `repeated` defect.
 */
const sequenceOf = (parts: readonly RankReading[], occurs: Occurs): RankReading => {
  const inner = unionOf(parts.map(({ defects }) => defects));
  const ranks = normalize(parts.flatMap((part) => part.ranks));

  if (ranks.length > 1) {
    return repeats(occurs)
      ? { defects: new Set([...inner, "repeated"]), ranks: [collapse(ranks, occurs.min >= 1)] }
      : { defects: inner, ranks };
  }

  return {
    defects: inner,
    ranks: ranks.map((rank) => ({
      names: rank.names,
      repeated: rank.repeated || repeats(occurs),
      required: rank.required && occurs.min >= 1,
    })),
  };
};

/**
 * Read a particle to its ranks.
 *
 * @param particle - The particle.
 * @returns Its ranks and the defects inside it.
 */
const ranksOf = (particle: Particle): RankReading => {
  const { occurs } = particle;

  if (Option.contains(occurs.max, 0)) {
    return { defects: new Set(), ranks: [] };
  }

  const own = { repeated: repeats(occurs), required: occurs.min >= 1 };

  switch (particle._tag) {
    case "element": {
      return { defects: new Set(), ranks: [{ names: new Set(particle.kinds), ...own }] };
    }
    case "any": {
      return { defects: new Set(), ranks: [{ names: new Set([wildcardName]), ...own }] };
    }
    case "group": {
      const parts = particle.particles.map(ranksOf);

      if (particle.compositor === "sequence") {
        return sequenceOf(parts, occurs);
      }

      if (particle.compositor === "choice") {
        return choiceOf(parts, occurs);
      }

      return {
        defects: unionOf(parts.map(({ defects }) => defects)),
        ranks: [
          {
            names: unionOf(parts.flatMap(({ ranks }) => ranks.map((rank) => rank.names))),
            repeated: false,
            required:
              own.required && parts.some(({ ranks }) => ranks.some((rank) => rank.required)),
          },
        ],
      };
    }
    default: {
      return particle satisfies never;
    }
  }
};

/**
 * What a content model says about the order of its parent's children.
 *
 * - `Ranked`: the ranks, each the kinds it holds and {@link others} for a wildcard's, free kinds left
 *   out. A kind in several ranks is in a run of them, its interval; a kind in none is free.
 * - `Unordered`: one rank or none, so every order of the children is the model's.
 * - `NonMonotone`: no intervals express it, for its defects, in code-point order.
 */
export type Sequencing =
  | { readonly _tag: "NonMonotone"; readonly defects: readonly Defect[] }
  | { readonly _tag: "Ranked"; readonly ranks: readonly OrderRank[] }
  | { readonly _tag: "Unordered" };

/**
 * Write a rank's names as `Order` names them: a wildcard's as {@link others}.
 *
 * @param names - The names, in first-seen order.
 * @returns The rank.
 */
const rankOf = (names: readonly string[]): OrderRank =>
  names.map((name): Others | string => (name === wildcardName ? others : name));

/**
 * Read a particle's order (the module comment's rules).
 *
 * @param particle - The particle: a content model's, one `sequence` occurring once.
 * @returns What it says about its children's order.
 */
export const sequencingOf = (particle: Particle): Sequencing => {
  const { defects, ranks } = ranksOf(particle);
  const found = [...new Set([...defects, ...defectsOf(ranks)])].toSorted((left, right) =>
    left < right ? -1 : 1,
  );

  if (found.length > 0) {
    return { _tag: "NonMonotone", defects: found };
  }

  const free = new Set(
    [...unionOf(ranks.map((rank) => rank.names))].filter((name) =>
      ranks.every((rank) => rank.names.has(name)),
    ),
  );
  const held = ranks
    .map((rank) => [...rank.names].filter((name) => !free.has(name)))
    .filter((names) => names.length > 0);

  return held.length > 1 ? { _tag: "Ranked", ranks: held.map(rankOf) } : { _tag: "Unordered" };
};

/**
 * Read a content type's order: element and mixed content by their particle, empty and simple
 * content as unordered, having no element children.
 *
 * @param content - The content type.
 * @returns What it says about its children's order.
 */
export const contentSequencingOf = (content: ContentType): Sequencing =>
  content._tag === "element-only" || content._tag === "mixed"
    ? sequencingOf(content.particle)
    : { _tag: "Unordered" };

/**
 * What a position of a model stands for: the kinds of an element particle, or a wildcard, which
 * stands for every element its namespace constraint admits that no element particle of the model
 * names ({@link others} in `Order`'s ranks).
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
