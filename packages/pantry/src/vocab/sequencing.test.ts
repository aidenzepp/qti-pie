import { describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage, requiredInSpace } from "@grizzle/testing/features";
import { array, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option } from "effect";
import {
  admitsWord,
  editsOf,
  foreignNamespace,
  targetsOf,
  unitCost,
  wordWith,
} from "#pantry/test/gen/vocab.ts";
import type { Letter, MatchScope, Word } from "#pantry/test/gen/vocab.ts";
import { contentModels } from "#pantry/vocab/inventory/models.ts";
import type { ContentModel, Occurs, Particle } from "#pantry/vocab/inventory/types.ts";
import { vocabularies } from "#pantry/vocab/inventory/vocabularies.ts";
import { automatonOf } from "#pantry/vocab/sequencing.ts";
import type { Automaton } from "#pantry/vocab/sequencing.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 99.7 s at a load average of 70 to
 * 74, its slowest test.
 */
const testTimeoutMs = 240_000;

/**
 * The longest a case may run before the search stops it: every case here is pure and reads one
 * model, so a minute is far past any of them.
 */
const caseHang = Duration.minutes(1);

/**
 * The namespace of each kind's element, from the rosters.
 */
const namespaces: ReadonlyMap<string, string> = new Map(
  vocabularies.flatMap(({ kinds, namespace }) =>
    kinds.map(({ handle }) => [handle, namespace] as const),
  ),
);

/**
 * A kind's namespace.
 *
 * @param kind - The kind.
 * @returns Its namespace, empty for a kind no roster holds.
 */
const namespaceOf = (kind: string): string => namespaces.get(kind) ?? "";

/**
 * The scope the automaton's language is read in: a wildcard takes foreign elements only, as its
 * positions do.
 *
 * @param own - The model's kind's namespace.
 * @returns The scope.
 */
const foreignOnly = (own: string): MatchScope => ({ kindNamespace: () => Option.none(), own });

/**
 * The IR rows that hold a particle: element and mixed content.
 */
const modelled = contentModels.flatMap((row) =>
  row.content._tag === "element-only" || row.content._tag === "mixed"
    ? [{ particle: row.content.particle, row }]
    : [],
);

/**
 * Relax bounds as the automaton reads them: a particle may be absent or must occur, may repeat or
 * not, and every count above one is the count laws'.
 *
 * @param occurs - The bounds.
 * @returns The relaxed bounds.
 */
const relaxedOccurs = (occurs: Occurs): Occurs => ({
  max: Option.match(occurs.max, {
    onNone: () => Option.none(),
    onSome: (max) => (max > 1 ? Option.none() : Option.some(max)),
  }),
  min: Math.min(occurs.min, 1),
});

/**
 * Relax every particle of a tree.
 *
 * @param particle - The particle.
 * @returns It, with every particle's bounds relaxed.
 */
const relaxed = (particle: Particle): Particle =>
  particle._tag === "group"
    ? {
        ...particle,
        occurs: relaxedOccurs(particle.occurs),
        particles: particle.particles.map(relaxed),
      }
    : { ...particle, occurs: relaxedOccurs(particle.occurs) };

/**
 * Whether a position's symbol takes a letter.
 *
 * @param automaton - The automaton.
 * @param number - The position.
 * @param own - The model's kind's namespace.
 * @param letter - The letter.
 * @returns Whether it does.
 */
const takes = (automaton: Automaton, number: number, own: string, letter: Letter): boolean => {
  const position = automaton.positions[number - 1];

  if (position === undefined) {
    return false;
  }

  const { symbol } = position;

  if (symbol._tag === "kinds") {
    return letter._tag === "kind" && symbol.kinds.includes(letter.kind);
  }

  if (letter._tag !== "foreign") {
    return false;
  }

  switch (symbol.namespace) {
    case "##any": {
      return true;
    }
    case "##local": {
      return letter.namespace === "";
    }
    case "##other": {
      return letter.namespace !== "" && letter.namespace !== own;
    }
    default: {
      return symbol.namespace satisfies never;
    }
  }
};

/**
 * Run an automaton over a word, as a deterministic automaton runs: from the start state, each
 * letter to the one position of the state's set that takes it.
 *
 * @param automaton - The automaton.
 * @param own - The model's kind's namespace.
 * @param word - The word.
 * @returns Whether it accepts the word.
 */
const accepts = (automaton: Automaton, own: string, word: Word): boolean => {
  let state = 0;

  for (const letter of word) {
    const next = [...(automaton.next[state] ?? [])].find((number) =>
      takes(automaton, number, own, letter),
    );

    if (next === undefined) {
      return false;
    }

    state = next;
  }

  return automaton.ends.has(state);
};

/**
 * The kinds two or more of an automaton's positions name, where a child's kind does not decide its
 * position and the automaton's state does.
 *
 * @param automaton - The automaton.
 * @returns The kinds, sorted.
 */
const kindsNamedTwice = (automaton: Automaton): readonly string[] => {
  const counts = new Map<string, number>();
  for (const { symbol } of automaton.positions) {
    if (symbol._tag === "kinds") {
      for (const kind of new Set(symbol.kinds)) {
        counts.set(kind, (counts.get(kind) ?? 0) + 1);
      }
    }
  }

  return [...counts].flatMap(([kind, count]) => (count > 1 ? [kind] : [])).toSorted();
};

/**
 * A model's alphabet: one kind of each class of kinds the same positions name, a kind no particle
 * names, and a foreign element in no namespace, in the model's own and in another, so every letter
 * the language tells apart is tried once.
 *
 * @param automaton - The model's automaton.
 * @param own - The model's kind's namespace.
 * @returns The letters.
 */
const alphabetOf = (automaton: Automaton, own: string): readonly Letter[] => {
  const signature = new Map<string, string>();

  for (const { number, symbol } of automaton.positions) {
    if (symbol._tag === "kinds") {
      for (const kind of symbol.kinds) {
        signature.set(kind, `${signature.get(kind) ?? ""} ${number}`);
      }
    }
  }

  const representatives = [
    ...new Map([...signature].map(([kind, held]) => [held, kind] as const)).values(),
  ];

  return [
    ...representatives.map((kind): Letter => ({ _tag: "kind", kind })),
    { _tag: "kind", kind: "a kind no particle names" },
    { _tag: "foreign", namespace: "" },
    { _tag: "foreign", namespace: own },
    { _tag: "foreign", namespace: foreignNamespace },
  ];
};

/**
 * The most words the exhaustive check tries per model: the longest length every word of which fits
 * stands, up to {@link longestWord}.
 */
const wordsPerModel = 2500;

/**
 * The longest words the exhaustive check tries.
 */
const longestWord = 4;

/**
 * Every word over an alphabet up to a length.
 *
 * @param letters - The alphabet.
 * @param length - The longest.
 * @returns The words, shortest first.
 */
const wordsUpTo = (letters: readonly Letter[], length: number): readonly Word[] => {
  const words: Word[] = [[]];
  let last: readonly Word[] = [[]];

  for (let at = 0; at < length; at += 1) {
    last = last.flatMap((word) => letters.map((letter) => [...word, letter]));
    words.push(...last);
  }

  return words;
};

/**
 * The longest length whose every word over an alphabet stays within {@link wordsPerModel}.
 *
 * @param size - The alphabet's size.
 * @returns The length, at least 1.
 */
const lengthFor = (size: number): number =>
  Math.max(1, ...Arr.range(1, longestWord).filter((length) => size ** length <= wordsPerModel));

/**
 * Write a model's row for a failure's message.
 *
 * @param row - The row.
 * @returns Its versions and kind.
 */
const named = (row: ContentModel): string => `${row.versions.join(",")} ${row.kind}`;

/**
 * The element particles and wildcards of a tree that may occur, in tree order: what an independent
 * walk numbers. A particle under a bound of 0, its own or a group's, cannot occur.
 *
 * @param particle - The tree.
 * @returns Its leaves.
 */
const leavesOf = (
  particle: Particle,
): readonly Extract<Particle, { readonly _tag: "any" | "element" }>[] => {
  if (Option.contains(particle.occurs.max, 0)) {
    return [];
  }

  return particle._tag === "group" ? particle.particles.flatMap(leavesOf) : [particle];
};

/**
 * Replace one leaf of a tree with a choice of it and itself, a model Unique Particle Attribution
 * forbids wherever the leaf may occur.
 *
 * @param particle - The tree.
 * @param place - The leaf's place in tree order, among the leaves that may occur.
 * @returns The mutant, `None` when the leaf cannot occur, so no state reaches it.
 */
const doubled = (particle: Particle, place: number): Option.Option<Particle> => {
  let at = 0;
  let possible = false;
  const visit = (node: Particle, reachable: boolean): Particle => {
    const here = reachable && !Option.contains(node.occurs.max, 0);

    if (node._tag === "group") {
      return { ...node, particles: node.particles.map((inner) => visit(inner, here)) };
    }

    if (!here) {
      return node;
    }

    const mine = at === place;

    at += 1;

    if (!mine || node._tag !== "element") {
      return node;
    }

    possible = here;

    return {
      _tag: "group",
      compositor: "choice",
      occurs: node.occurs,
      particles: [
        { ...node, occurs: { max: Option.some(1), min: 1 } },
        { ...node, occurs: { max: Option.some(1), min: 1 } },
      ],
      sources: node.sources,
    };
  };
  const mutant = visit(particle, true);

  return possible ? Option.some(mutant) : Option.none();
};

/**
 * Every (model, leaf) of the IR: the box the UPA mutant check exhausts.
 */
const doubledCase: Gen<{ readonly index: number; readonly place: number }> = (source) => {
  const index = source.draw(int(0, modelled.length - 1));
  const leaves = leavesOf(Arr.getUnsafe(modelled, index).particle).length;

  return { index, place: leaves === 0 ? 0 : source.draw(int(0, leaves - 1)) };
};

/**
 * A model and words for it: each valid word that holds one of its targets, repeated up to three
 * times in a row where its particle repeats, and every one-step edit of each, a named invalid case.
 */
const caseOf: Gen<{ readonly edits: readonly Word[]; readonly index: number }> = (source) => {
  const index = source.draw(int(0, modelled.length - 1));
  const { particle } = Arr.getUnsafe(modelled, index);
  const targets = targetsOf(particle);
  const chosen = Arr.isReadonlyArrayNonEmpty(targets)
    ? source.draw(array(element(targets), { max: 3, min: 1 }))
    : [];
  const words = chosen.flatMap((target) => Option.toArray(wordWith(particle, target, unitCost)));
  const joined = words.flat();

  return { edits: [joined, ...editsOf(joined).map(([, word]) => word)], index };
};

describe("vocab/sequencing.ts", () => {
  it.effect(
    "accepts exactly each model's relaxed language, every word of its alphabet in the box",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: `every element or mixed model of the IR, each on every word of its alphabet up to the longest length (at most 4) whose words number at most 2,500: ${modelled.length} models`,
            caseHang,
            coverage: requiredInSpace<"accepted" | "refused" | "shared" | "wildcard">([
              "accepted",
              "refused",
              "wildcard",
              "shared",
            ]),
            generator: int(0, modelled.length - 1),
            limit: modelled.length,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the relaxed particle tree's own acceptor (admitsWord)",
            },
            suite: "vocab/sequencing-glushkov-language",
          },
          (index, c) =>
            Effect.sync(() => {
              const { particle, row } = Arr.getUnsafe(modelled, index);
              const own = namespaceOf(row.kind);
              const automaton = automatonOf(particle, namespaceOf, own);
              const tree = relaxed(particle);
              const letters = alphabetOf(automaton, own);

              if (automaton.positions.some(({ symbol }) => symbol._tag === "wildcard")) {
                c.note("wildcard");
              }

              if (kindsNamedTwice(automaton).length > 0) {
                c.note("shared");
              }

              for (const word of wordsUpTo(letters, lengthFor(letters.length))) {
                const expected = admitsWord(
                  { _tag: "element-only", particle: tree },
                  foreignOnly(own),
                  word,
                );

                c.note(expected ? "accepted" : "refused");
                if (accepts(automaton, own, word) !== expected) {
                  throw new Error(
                    `${named(row)}: the automaton ${expected ? "refuses" : "accepts"} ${Formatter.format(word)}, which the particle tree ${expected ? "accepts" : "refuses"}`,
                  );
                }
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "agrees with the particle tree on its words and their one-step edits, longer ones too",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: noCoverage,
            draw: drawn(caseOf),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the relaxed particle tree's own acceptor (admitsWord)",
            },
            runs: 2000,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "vocab/sequencing-glushkov-edits",
          },
          ({ edits, index }) =>
            Effect.sync(() => {
              const { particle, row } = Arr.getUnsafe(modelled, index);
              const own = namespaceOf(row.kind);
              const automaton = automatonOf(particle, namespaceOf, own);
              const tree = relaxed(particle);

              for (const word of edits) {
                const expected = admitsWord(
                  { _tag: "element-only", particle: tree },
                  foreignOnly(own),
                  word,
                );

                if (accepts(automaton, own, word) !== expected) {
                  throw new Error(
                    `${named(row)}: the automaton ${expected ? "refuses" : "accepts"} ${Formatter.format(word)}, which the particle tree ${expected ? "accepts" : "refuses"}`,
                  );
                }
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it("is deterministic on every model, as Unique Particle Attribution requires", () => {
    const breaches = modelled.flatMap(({ particle, row }) =>
      automatonOf(particle, namespaceOf, namespaceOf(row.kind)).ambiguous.map(
        (ambiguity) => `${named(row)} ${Formatter.format(ambiguity)}`,
      ),
    );

    if (breaches.length > 0) {
      throw new Error(`UPA breaches: ${breaches.join("; ")}`);
    }
  });

  it.effect(
    "finds the breach in every model with an element particle doubled in a choice",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every (model, leaf that may occur) of the IR's element and mixed models",
            caseHang,
            coverage: noCoverage,
            generator: doubledCase,
            limit: 40_000,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "Unique Particle Attribution (XML Schema 1.0 Part 1 §3.8.6): an element particle in a choice with itself is ambiguous, by construction",
            },
            suite: "vocab/sequencing-upa-mutants",
          },
          ({ index, place }) =>
            Effect.sync(() => {
              const { particle, row } = Arr.getUnsafe(modelled, index);
              const mutant = doubled(particle, place);

              if (Option.isSome(mutant)) {
                const automaton = automatonOf(mutant.value, namespaceOf, namespaceOf(row.kind));

                if (automaton.ambiguous.length === 0) {
                  throw new Error(`${named(row)}: doubling position ${place + 1} went unnoticed`);
                }
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it("numbers every element particle and wildcard once, densely, in tree order", () => {
    for (const { particle, row } of modelled) {
      const automaton = automatonOf(particle, namespaceOf, namespaceOf(row.kind));
      const leaves = leavesOf(particle);
      const counts = new Map<string, number>();

      for (const leaf of leaves) {
        if (leaf._tag === "element") {
          for (const kind of new Set(leaf.kinds)) {
            counts.set(kind, (counts.get(kind) ?? 0) + 1);
          }
        }
      }

      const shared = [...counts].flatMap(([kind, count]) => (count > 1 ? [kind] : []));

      if (
        automaton.positions.length !== leaves.length ||
        automaton.positions.some(({ number }, at) => number !== at + 1) ||
        automaton.positions.some(({ occurs }, at) => occurs !== leaves[at]?.occurs) ||
        kindsNamedTwice(automaton).join(" ") !== shared.toSorted().join(" ")
      ) {
        throw new Error(`${named(row)}: the positions are not the tree's leaves in order`);
      }
    }
  });
});
