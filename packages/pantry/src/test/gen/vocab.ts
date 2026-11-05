/**
 * Generators and checkers over the derived vocabulary, for the tests that hold it against the XSDs
 * (`src/vocab/**`): a second reading of the content-model IR as a language, the words that cover
 * its particles and their one-step mutants, the probes that put a kind's element before the XSD
 * oracle, and the attribute and element names of every namespace class.
 *
 * Everything here builds valid inputs by construction and names each invalid one: a word is
 * generated from the model it must satisfy, and every mutant is one named edit of a valid word,
 * whose verdict the matcher decides independently of the deriver.
 */
import { Array as Arr, Match, Option } from "effect";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { dataName } from "#pantry/vocab/open.ts";
import type { ProbeWorld } from "#pantry/test/gen/xmllint.ts";
import type {
  ContentType,
  NamespaceConstraint,
  Occurs,
  Particle,
} from "#pantry/vocab/inventory/types.ts";

/**
 * One child in a word: an element of a kind, or a foreign element in a namespace (`""` for none)
 * that only a wildcard admits.
 */
export type Letter =
  | { readonly _tag: "foreign"; readonly namespace: string }
  | { readonly _tag: "kind"; readonly kind: string };

/**
 * A sequence of children, in document order.
 */
export type Word = readonly Letter[];

/**
 * The namespace a word's foreign elements are in when a wildcard admits other namespaces: one no
 * schema declares, so no wildcard reads one as a kind.
 */
export const foreignNamespace = "urn:x";

/**
 * Whether a wildcard's namespace constraint admits a foreign element's namespace.
 *
 * @param constraint - The constraint as the XSD writes it.
 * @param own - The namespace of the schema the wildcard is written in.
 * @param namespace - The element's namespace, `""` for none.
 * @returns Whether it does, as XML Schema 1.0 Part 1, 3.10.4, reads it.
 */
export const constraintAdmits = (
  constraint: NamespaceConstraint,
  own: string,
  namespace: string,
): boolean => {
  switch (constraint) {
    case "##any": {
      return true;
    }
    case "##local": {
      return namespace === "";
    }
    case "##other": {
      return namespace !== "" && namespace !== own;
    }
    default: {
      return constraint satisfies never;
    }
  }
};

/**
 * Where a model's letters are matched: the namespace of the model's own kind, a wildcard's own,
 * and the namespace of each kind's element, by which a wildcard takes a kind's element as XML
 * Schema's does (3.10.4). A scope that knows no kind's namespace lets a wildcard take only foreign
 * elements, as the automaton's wildcard positions do.
 */
export interface MatchScope {
  readonly kindNamespace: (kind: string) => Option.Option<string>;
  readonly own: string;
}

/**
 * Whether a particle matches one letter, standing alone.
 *
 * @param particle - An element particle or a wildcard.
 * @param scope - Where the model's letters are matched.
 * @param letter - The letter.
 * @returns Whether it does: an element particle a letter of one of its kinds, a wildcard a foreign
 *   element or a kind's element in a namespace it admits.
 */
const matchesLetter = (
  particle: Extract<Particle, { readonly _tag: "any" | "element" }>,
  scope: MatchScope,
  letter: Letter,
): boolean => {
  if (particle._tag === "element") {
    return letter._tag === "kind" && particle.kinds.includes(letter.kind);
  }

  const namespace =
    letter._tag === "foreign" ? Option.some(letter.namespace) : scope.kindNamespace(letter.kind);

  return namespace.pipe(
    Option.exists((held) => constraintAdmits(particle.namespace, scope.own, held)),
  );
};

/**
 * The positions a particle can end at, having started at one, as the XSD's particle matches a
 * word: a naive set-of-positions reading, sharing nothing with the rank projection.
 *
 * A group repeats while a repetition reaches a new position, so an unbounded group that can match
 * nothing still ends.
 *
 * @param particle - The particle.
 * @param scope - Where the model\'s letters are matched.
 * @param word - The word.
 * @param start - Where it starts.
 * @returns Every position it can end at.
 */
const endsOf = (
  particle: Particle,
  scope: MatchScope,
  word: Word,
  start: number,
): ReadonlySet<number> => {
  const sequenceEnds = (particles: readonly Particle[], from: number): ReadonlySet<number> => {
    let positions: ReadonlySet<number> = new Set([from]);

    for (const inner of particles) {
      positions = new Set([...positions].flatMap((at) => [...endsOf(inner, scope, word, at)]));
    }

    return positions;
  };
  const allEnds = (particles: readonly Particle[], from: number): ReadonlySet<number> => {
    const ends = new Set<number>();
    const visit = (left: readonly Particle[], at: number): void => {
      if (left.every((member) => member.occurs.min === 0)) {
        ends.add(at);
      }

      for (const [index, member] of left.entries()) {
        const rest = [...left.slice(0, index), ...left.slice(index + 1)];
        const one = { ...member, occurs: { max: Option.some(1), min: 1 } };

        for (const end of endsOf(one, scope, word, at)) {
          if (end > at) {
            visit(rest, end);
          }
        }
      }
    };

    visit(particles, from);

    return ends;
  };
  const once = (from: number): ReadonlySet<number> => {
    switch (particle._tag) {
      case "any":
      case "element": {
        const letter = word[from];

        return letter !== undefined && matchesLetter(particle, scope, letter)
          ? new Set([from + 1])
          : new Set();
      }
      case "group": {
        switch (particle.compositor) {
          case "all": {
            return allEnds(particle.particles, from);
          }
          case "choice": {
            return new Set(
              particle.particles.flatMap((inner) => [...endsOf(inner, scope, word, from)]),
            );
          }
          case "sequence": {
            return sequenceEnds(particle.particles, from);
          }
          default: {
            return particle.compositor satisfies never;
          }
        }
      }
      default: {
        return particle satisfies never;
      }
    }
  };
  const step = (positions: ReadonlySet<number>): ReadonlySet<number> =>
    new Set([...positions].flatMap((at) => [...once(at)]));
  let current: ReadonlySet<number> = new Set([start]);

  for (let count = 0; count < particle.occurs.min && current.size > 0; count += 1) {
    current = step(current);
  }

  const ends = new Set(current);
  const extra = particle.occurs.max.pipe(Option.map((max) => max - particle.occurs.min));
  let frontier = current;

  for (
    let added = 0;
    frontier.size > 0 && !extra.pipe(Option.exists((most) => added >= most));
    added += 1
  ) {
    const fresh = [...step(frontier)].filter((at) => !ends.has(at));

    for (const at of fresh) {
      ends.add(at);
    }

    frontier = new Set(fresh);
  }

  return ends;
};

/**
 * Whether a content model admits a word of children, by the naive reading of {@link endsOf}.
 *
 * @param content - The model.
 * @param scope - Where the model\'s letters are matched.
 * @param word - The children.
 * @returns Whether the model matches the whole word; empty and simple content admit only no
 *   element children.
 */
export const admitsWord = (content: ContentType, scope: MatchScope, word: Word): boolean =>
  content._tag === "element-only" || content._tag === "mixed"
    ? endsOf(content.particle, scope, word, 0).has(word.length)
    : word.length === 0;

/**
 * What a letter costs in a generated document: how many elements its smallest instance holds, so a
 * minimal word picks the alternatives whose instances stay small rather than the ones listed first.
 */
export type Cost = (letter: Letter) => number;

/**
 * Every letter at one element: the cost when a word stands alone, with no instance under it.
 */
export const unitCost: Cost = () => 1;

/**
 * The letter a generated word puts at a strict wildcard: a strict wildcard admits only an element
 * a global declaration validates, and every strict wildcard of the pinned XSDs is `##other` under
 * a kind of the content package, the AfA DRD or the ASI, none of them in LOM's namespace.
 */
export const strictWildcardLetter = "lom:lom";

/**
 * The letter a particle's occurrence stands for in a generated word: an element particle's
 * cheapest kind, the first of the cheapest, or the foreign element a wildcard admits, in no
 * namespace for `##local`.
 *
 * @param particle - An element particle or a wildcard.
 * @param cost - What each letter costs.
 * @returns The letter.
 */
const letterOf = (
  particle: Extract<Particle, { readonly _tag: "any" | "element" }>,
  cost: Cost,
): Letter => {
  if (particle._tag === "any") {
    return particle.processing === "strict"
      ? { _tag: "kind", kind: strictWildcardLetter }
      : { _tag: "foreign", namespace: particle.namespace === "##local" ? "" : foreignNamespace };
  }

  let cheapest: Letter = { _tag: "kind", kind: particle.kinds[0] };

  for (const kind of particle.kinds) {
    const letter: Letter = { _tag: "kind", kind };

    if (cost(letter) < cost(cheapest)) {
      cheapest = letter;
    }
  }

  return cheapest;
};

/**
 * The cheapest of some words, the first of the cheapest.
 *
 * @param words - The words.
 * @param cost - What each letter costs.
 * @returns The cheapest, or no letters for none.
 */
const cheapestOf = (words: readonly Word[], cost: Cost): Word => {
  const total = (word: Word): number => word.reduce((sum, letter) => sum + cost(letter), 0);
  let cheapest: Option.Option<Word> = Option.none();

  for (const word of words) {
    if (!cheapest.pipe(Option.exists((held) => total(held) <= total(word)))) {
      cheapest = Option.some(word);
    }
  }

  return Option.getOrElse(cheapest, (): Word => []);
};

/**
 * A word repeated a number of times, none for 0: `Array.replicate` would give one copy for 0.
 *
 * @param word - The word.
 * @param times - How many times, at least 0.
 * @returns The repetitions, in order.
 */
const repeated = (word: Word, times: number): Word =>
  Array.from({ length: times }, () => word).flat();

/**
 * The minimal words already built, by cost and particle: a particle's word is a function of the
 * two, and the probes ask for the same subtrees many times.
 */
const minimalWords = new WeakMap<Cost, WeakMap<Particle, Word>>();

/**
 * The cheapest word a particle matches: each element particle its least number of times, as its
 * cheapest kind, and a choice its cheapest alternative.
 *
 * @param particle - The particle.
 * @param cost - What each letter costs.
 * @returns The word.
 */
export const minimalWord = (particle: Particle, cost: Cost): Word => {
  const cached = minimalWords.get(cost)?.get(particle);

  if (cached !== undefined) {
    return cached;
  }

  const one: Word = Match.valueTags(particle, {
    any: (wildcard): Word => [letterOf(wildcard, cost)],
    element: (element): Word => [letterOf(element, cost)],
    group: ({ compositor, particles }): Word =>
      compositor === "choice"
        ? cheapestOf(
            particles.map((inner) => minimalWord(inner, cost)),
            cost,
          )
        : particles.flatMap((inner) => minimalWord(inner, cost)),
  });

  const word = repeated(one, particle.occurs.min);
  const byParticle = minimalWords.get(cost) ?? new WeakMap<Particle, Word>();

  byParticle.set(particle, word);
  minimalWords.set(cost, byParticle);

  return word;
};

/**
 * One letter a model can hold: an element particle's kind, or a wildcard's foreign element, with
 * the particle's place among the model's element particles and wildcards in document order.
 */
export interface Target {
  readonly letter: Letter;
  readonly place: number;
}

/**
 * Every letter a particle can hold, in document order: each kind of each element particle, and
 * each wildcard's foreign element, of the particles that may occur.
 *
 * @param particle - The particle.
 * @returns The targets.
 */
export const targetsOf = (particle: Particle): readonly Target[] => {
  const found: Target[] = [];
  let place = 0;
  const visit = (node: Particle, possible: boolean): void => {
    const occurs = possible && !Option.contains(node.occurs.max, 0);

    if (node._tag === "group") {
      for (const inner of node.particles) {
        visit(inner, occurs);
      }

      return;
    }

    if (occurs) {
      const letters: readonly Letter[] =
        node._tag === "element"
          ? node.kinds.map((kind) => ({ _tag: "kind", kind }))
          : [letterOf(node, unitCost)];

      for (const letter of letters) {
        found.push({ letter, place });
      }
    }

    place += 1;
  };

  visit(particle, true);

  return found;
};

/**
 * A particle read while a target word is built: whether it holds the target, and its word.
 */
interface Reading {
  readonly holds: boolean;
  readonly word: Word;
}

/**
 * The shortest word a particle matches that holds a target letter at its place: every other
 * particle at its least, the choices on the way choosing the alternative that holds the target, and
 * each group on the way occurring at least once.
 *
 * @param particle - The particle.
 * @param target - The target.
 * @param cost - What each letter costs.
 * @returns The word, or `None` when the place is past the particle.
 */
export const wordWith = (particle: Particle, target: Target, cost: Cost): Option.Option<Word> => {
  let place = 0;
  const visit = (node: Particle): Reading => {
    const times = Math.max(node.occurs.min, 1);

    if (node._tag !== "group") {
      const here = place === target.place;

      place += 1;

      return here
        ? {
            holds: true,
            word: [target.letter, ...repeated([letterOf(node, cost)], times - 1)],
          }
        : { holds: false, word: minimalWord(node, cost) };
    }

    const inner = node.particles.map(visit);
    const holding = inner.findIndex((reading) => reading.holds);

    if (holding === -1) {
      return { holds: false, word: minimalWord(node, cost) };
    }

    const one =
      node.compositor === "choice"
        ? (inner[holding]?.word ?? [])
        : inner.flatMap((reading, index) =>
            index === holding
              ? reading.word
              : minimalWord(Arr.getUnsafe(node.particles, index), cost),
          );
    const rest = repeated(
      minimalWord({ ...node, occurs: { max: Option.some(1), min: 1 } }, cost),
      times - 1,
    );

    return { holds: true, word: [...one, ...rest] };
  };
  const reading = visit(particle);

  return reading.holds ? Option.some(reading.word) : Option.none();
};

/**
 * The one-step edits of a word, each named, so a failing case says which edit it was.
 */
export type Edit =
  | { readonly _tag: "delete"; readonly at: number }
  | { readonly _tag: "duplicate"; readonly at: number }
  | { readonly _tag: "swap"; readonly at: number };

/**
 * Every one-step edit of a word: each child deleted, each child repeated in place, and each pair of
 * neighbours swapped.
 *
 * @param word - The word.
 * @returns Each edit with the word it makes.
 */
export const editsOf = (word: Word): readonly (readonly [Edit, Word])[] => [
  ...word.map(
    (_, at) => [{ _tag: "delete", at }, [...word.slice(0, at), ...word.slice(at + 1)]] as const,
  ),
  ...word.map(
    (letter, at) =>
      [{ _tag: "duplicate", at }, [...word.slice(0, at), letter, ...word.slice(at)]] as const,
  ),
  ...word
    .slice(1)
    .map(
      (letter, index) =>
        [
          { _tag: "swap", at: index },
          [...word.slice(0, index), letter, Arr.getUnsafe(word, index), ...word.slice(index + 2)],
        ] as const,
    ),
];

/**
 * Escape text for an XML attribute value or character data.
 *
 * @param text - The text.
 * @returns It, with `&`, `<`, `>` and `"` escaped.
 */
export const escaped = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/**
 * Write the qualified name a namespace and local name have in the probes.
 *
 * @param world - The probe world.
 * @param namespace - The namespace, `""` for none.
 * @param local - The local name.
 * @returns `prefix:local`, or `local` in no namespace.
 */
export const qualified = (world: ProbeWorld, namespace: string, local: string): string =>
  namespace === "" ? local : `${world.prefixOf(namespace)}:${local}`;

/**
 * Write an element's tag pair around its content.
 *
 * @param name - Its qualified name.
 * @param attributes - Its attributes as (qualified name, value), each name kept once.
 * @param inner - Its content, already written.
 * @returns The element's text, an empty-element tag when it has no content.
 */
export const tagged = (
  name: string,
  attributes: readonly (readonly [string, string])[],
  inner: string,
): string => {
  const written = Arr.dedupeWith(attributes, ([left], [right]) => left === right)
    .map(([attribute, value]) => ` ${attribute}="${escaped(value)}"`)
    .join("");

  return inner === "" ? `<${name}${written}/>` : `<${name}${written}>${inner}</${name}>`;
};

/**
 * The value a probe gives an attribute: `x`, a junk value whose errors are values', not
 * structure's, but `default` for `xml:space`, whose values the XML parser itself checks before any
 * schema does.
 *
 * @param name - The attribute's qualified name.
 * @returns The value.
 */
export const probeValueOf = (name: string): string => (name === "xml:space" ? "default" : "x");

/**
 * The minimal instances already written, by world and kind.
 */
const instances = new WeakMap<ProbeWorld, Map<string, string>>();

/**
 * Write one letter as a minimal element: a kind's element with its required attributes, each the
 * value `x`, and the minimal word of its model, the cheapest by the world's costs, which ends,
 * since a kind's cost is its smallest finite tree; a foreign element empty.
 *
 * @param world - The probe world.
 * @param letter - The letter.
 * @returns The element's text.
 */
export const instanceOf = (world: ProbeWorld, letter: Letter): string => {
  if (letter._tag === "foreign") {
    return `<${qualified(world, letter.namespace, "w")}/>`;
  }

  const cached = instances.get(world)?.get(letter.kind);

  if (cached !== undefined) {
    return cached;
  }

  const written = Option.match(world.elementOf(letter.kind), {
    onNone: () => "",
    onSome: ({ local, namespace }) => {
      const children = Option.match(world.modelOf(letter.kind), {
        onNone: (): Word => [],
        onSome: (content) =>
          content._tag === "element-only" || content._tag === "mixed"
            ? minimalWord(content.particle, world.cost)
            : [],
      });

      return tagged(
        qualified(world, namespace, local),
        world.requiredOf(letter.kind).map(({ name }) => [name, probeValueOf(name)] as const),
        children.map((child) => instanceOf(world, child)).join(""),
      );
    },
  });
  const byKind = instances.get(world) ?? new Map<string, string>();

  byKind.set(letter.kind, written);
  instances.set(world, byKind);

  return written;
};

/**
 * Write a probe: an element with attributes, character data and children, each child a minimal
 * instance.
 *
 * @param world - The probe world.
 * @param name - Its qualified name.
 * @param attributes - Its attributes as (qualified name, value), each name kept once.
 * @param children - Its element children.
 * @param text - Character data before its children.
 * @returns The element's text, on one line.
 */
export const probeText = (
  world: ProbeWorld,
  name: string,
  attributes: readonly (readonly [string, string])[],
  children: Word,
  text: string,
): string =>
  tagged(
    name,
    attributes,
    `${escaped(text)}${children.map((child) => instanceOf(world, child)).join("")}`,
  );

/**
 * The classes of attribute name the open-name admission is tested over, by namespace and spelling,
 * each a named, countable variant (testing doctrine, rule 6).
 */
export const attributeClasses = [
  "declared",
  "undeclared-local",
  "data-valid",
  "data-invalid",
  "data-bare",
  "own-namespace",
  "foreign-namespace",
  "xml-declared",
  "xml-undeclared",
  "xsi-declared",
  "xsi-undeclared",
] as const;

/**
 * A class of attribute name.
 */
export type AttributeClass = (typeof attributeClasses)[number];

/**
 * One attribute a probe carries: its class, its namespace (`""` for none), its local name, and the
 * name a closed handle spells it with.
 */
export interface CandidateAttribute {
  readonly class: AttributeClass;
  readonly local: string;
  readonly namespace: string;
}

/**
 * The spellings each class of undeclared name is tried with, exhaustively: the box the admission
 * suite enumerates (testing doctrine, rule 9). The `data-` spellings sit on both sides of spec
 * reading 13's pattern.
 */
export const spellings: Readonly<
  Record<
    Exclude<AttributeClass, "declared" | "own-namespace" | "foreign-namespace">,
    readonly string[]
  >
> = {
  "data-bare": ["data"],
  "data-invalid": ["data-", "data-X", "data-é", "data-a b"],
  "data-valid": ["data-x", "data-a.b-c", "data-0", "data--", "data-_"],
  "undeclared-local": ["zz", "z-z", "z.z9", "Zz"],
  "xml-declared": ["lang", "space", "base", "id"],
  "xml-undeclared": ["zz"],
  "xsi-declared": ["schemaLocation", "noNamespaceSchemaLocation"],
  "xsi-undeclared": ["zz"],
};

/**
 * Whether a spelling is one XML allows as an attribute's local name, so a probe can carry it: the
 * names with a space cannot be written, and stand for spec reading 13's refusal only through
 * {@link dataName}.
 *
 * @param local - The local name.
 * @returns Whether it is an NCName the probes can write.
 */
export const writable = (local: string): boolean => /^[\p{L}_][\p{L}\p{N}._-]*$/u.test(local);

/**
 * Whether a no-namespace spelling is a valid `data-*` name, as spec reading 13 reads it.
 *
 * @param local - The local name.
 * @returns Whether it matches the reading's pattern.
 */
export const isDataName = (local: string): boolean => dataName.test(local);

/**
 * The schema versions each kind's probes are written for.
 */
export type ProbeVersion = SchemaVersion;

/**
 * Write the bounds an occurrence allows, for a failure's message.
 *
 * @param occurs - The bounds.
 * @returns `min..max`, `n` for unbounded.
 */
export const rangeOf = (occurs: Occurs): string =>
  `${occurs.min}..${Option.match(occurs.max, { onNone: () => "n", onSome: String })}`;
