/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * The content grammar: each (version, parent)'s content model as its Glushkov automaton (the
 * operator's ruling of 2026-11-05, Glushkov for all 638 models).
 *
 * A model's positions are its element and wildcard particles, numbered from 1 in tree order (U4's
 * particle numbering); 0 is the start. A child's `Admission` row carries its position: the one
 * position its kind names, or 0 where its kind names none (character data, which carries its
 * predecessor's state) or several (a shared kind, whose position the state decides through
 * `Symbol`). The law reads one bit, `Follow(version, parent, was, position)`, with `was` the
 * predecessor's position (0 for the first child), and the last child reads `Last(version, parent,
 * state)`. Under Unique Particle Attribution the automaton enforces order, required particles,
 * at-most-once and exclusive choice; a bound of 2…n, which a position automaton relaxes, is a count
 * law, `Counted(version, parent, position) → (min, max)`.
 *
 * Q3's `automatonOf` builds every automaton from the content-model IR; this module installs them.
 */
import { Array as Arr, Option, pipe, Result, Schema } from "effect";
import type { AdmittedChild } from "#pantry/grammar/admission.ts";
import {
  closed,
  dependentField,
  fin,
  idField,
  sourced,
  valueField,
} from "#pantry/grammar/closed.ts";
import type {
  ClosedRelationError,
  DependentField,
  IdField,
  Roster,
  Sourced,
  ValueField,
} from "#pantry/grammar/closed.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { foreignKinds } from "#pantry/grammar/kinds.ts";
import type {
  ContentModel,
  ContentType,
  Occurs,
  Particle,
  Source,
  Sources,
} from "#pantry/vocab/inventory/types.ts";
import { admitsNamespace, namespaceClassesUnder } from "#pantry/vocab/namespaces.ts";
import { automatonOf } from "#pantry/vocab/sequencing.ts";
import type { Automaton } from "#pantry/vocab/sequencing.ts";

/**
 * A spec reading that edits a content model where it says more than the XSD: a particle's group
 * required; a kind admitted beside another in every particle that names it; kinds that come
 * before every other element of the model and before its text that is not whitespace; or the
 * model restated whole, over the same kinds, where the language the reading follows is narrower
 * than the XSD's and no edit of a particle states it (spec reading 2, MathML's RelaxNG
 * interleaves).
 */
export type ModelEdit =
  | {
      readonly _tag: "require";
      readonly kind: string;
      readonly parent: string;
      readonly source: string;
    }
  | {
      readonly _tag: "beside";
      readonly kind: string;
      readonly parent: string;
      readonly source: string;
      readonly with: string;
    }
  | {
      readonly _tag: "first";
      readonly kinds: readonly [string, ...string[]];
      readonly parent: string;
      readonly source: string;
    }
  | {
      readonly _tag: "restate";
      readonly parent: string;
      readonly particle: Particle;
      readonly source: string;
    };

/**
 * A vocabulary's share of the content grammar: its spec readings' edits, and the models of kinds
 * no XSD declares (the document node, the foreign kinds).
 */
export interface ContentFacet {
  readonly edits: readonly ModelEdit[];
  readonly models: readonly ContentModel[];
}

/**
 * The key of a relation per (version, parent, position).
 */
type PositionKey = readonly [
  IdField<"version", SchemaVersion>,
  IdField<"parent", string>,
  DependentField<"position">,
];

/**
 * The content grammar's relations, and the host's view of each automaton.
 */
export interface ContentGrammar {
  /**
   * `Counted`: the positions whose count is a law beside the automaton, with their bounds, each
   * sourced to the particle whose bound it is.
   */
  readonly counted: Sourced<
    PositionKey,
    readonly [ValueField<"min", number>, ValueField<"max", number>]
  >;
  /**
   * `Follow`: (version, parent, from, to) where a child at position `to` may follow one at `from`,
   * `from` 0 the start, each sourced to the particle at `to`.
   */
  readonly follow: Sourced<
    readonly [
      IdField<"version", SchemaVersion>,
      IdField<"parent", string>,
      DependentField<"from">,
      DependentField<"to">,
    ],
    readonly []
  >;
  /**
   * `Last`: (version, parent, at) where a family may end at position `at`, 0 when it may be empty,
   * each sourced to the particle at `at`, or to the model at 0.
   */
  readonly last: Sourced<PositionKey, readonly []>;
  /**
   * The `Position` roster: 0, the start, then 1 to the widest model's last position.
   */
  readonly positions: Roster<string>;
  /**
   * Read `Symbol`'s row of a kind: the positions a family's model names it at, where several
   * positions name it and the state decides; none for a kind one position names, or none does.
   *
   * @param key - The family and the kind.
   * @returns The positions, ascending.
   */
  readonly sharedPositions: (key: {
    readonly kind: string;
    readonly parent: string;
    readonly version: SchemaVersion;
  }) => readonly number[];
  /**
   * Find where a family's position comes from: its particle in the XSD of its version, or the
   * reading or specification that states it; position 0 is the family's model as a whole. A content
   * refusal reads it, for the positions `Follow` allows next and the model they belong to.
   *
   * @param key - The family and the position.
   * @returns The source, or none for a position the family's model has not.
   */
  readonly sourceOf: (key: {
    readonly parent: string;
    readonly position: string;
    readonly version: SchemaVersion;
  }) => Option.Option<Source>;
  /**
   * `Symbol`: (version, parent, kind, position) for the kinds several positions of a model name,
   * whose position the state decides, each sourced to the particle at the position.
   */
  readonly symbol: Sourced<
    readonly [
      IdField<"version", SchemaVersion>,
      IdField<"parent", string>,
      IdField<"kind", string>,
      DependentField<"position">,
    ],
    readonly []
  >;
}

/**
 * A content model's automaton whose Unique Particle Attribution fails, so no automaton state
 * decides a child's particle.
 */
export class AmbiguousModel extends Schema.TaggedError<AmbiguousModel>()("AmbiguousModel", {
  kind: Schema.String,
  versions: Schema.String,
}) {
  /**
   * The kind, its versions, and the repair.
   */
  override get message(): string {
    return `The content model of ${this.kind} in ${this.versions} breaches Unique Particle Attribution, so a child's particle is not decided by the children before it. Correct the model, or state a spec reading that removes the ambiguity.`;
  }
}

/**
 * A spec reading names a kind or a parent the models do not hold.
 */
export class UnreadEdit extends Schema.TaggedError<UnreadEdit>()("UnreadEdit", {
  kind: Schema.String,
  parent: Schema.String,
  source: Schema.String,
}) {
  /**
   * The reading, the kind and parent, and the repair.
   */
  override get message(): string {
    return `The spec reading ${this.source} edits ${this.kind} under ${this.parent}, which no particle of ${this.parent}'s model names. Correct the reading's kind or parent.`;
  }
}

/**
 * The ways the content models have no content grammar.
 */
export type ContentError = AmbiguousModel | ClosedRelationError | UnreadEdit;

/**
 * The kinds of character data, comments, instructions and entity references: the XDM's nodes
 * between elements, none of them an element. Every composition's `NodeKind` holds them first,
 * after the fixed kinds.
 */
export const characterKinds = ["text", "ws", "comment", "pi", "entityRef"] as const;

/**
 * The character data, comments and instructions each content type admits between its children
 * (XML Schema Part 1 §3.4.4): whitespace, comments and processing instructions in element content,
 * comments and processing instructions alone in empty content, text and entity references too
 * where character data is the content's.
 */
const characterData: Readonly<
  Record<ContentType["_tag"], readonly (typeof characterKinds)[number][]>
> = {
  "element-only": ["ws", "comment", "pi"],
  empty: ["comment", "pi"],
  mixed: ["text", "ws", "comment", "pi", "entityRef"],
  simple: ["text", "ws", "comment", "pi", "entityRef"],
};

/**
 * A particle tree after an edit, and whether the edit found what it names.
 */
interface Edited {
  readonly found: boolean;
  readonly particle: Particle;
}

/**
 * Key a family by the version and parent of a key prefix.
 *
 * @param prefix - The prefix's values.
 * @returns The family's key.
 */
const familyOf = (prefix: Readonly<Record<string, string>>): string =>
  `${prefix["version"] ?? ""} ${prefix["parent"] ?? ""}`;

/**
 * Collect the element and wildcard particles within a particle, in document order.
 *
 * @param particle - The particle.
 * @returns Its leaves.
 */
const leavesOf = (particle: Particle): readonly Exclude<Particle, { readonly _tag: "group" }>[] =>
  particle._tag === "group" ? particle.particles.flatMap(leavesOf) : [particle];

/**
 * Restate a model whose leading kinds come before every other element and before text that is not
 * whitespace, as spec reading 40 says of SSML's `meta`, `metadata` and `lexicon` in `speak`: the
 * leading kinds and the wildcards in any order, then any run of text, the other kinds and the
 * wildcards, each step a text or another kind followed by any wildcards.
 *
 * As a regular expression over the model's kinds, `(K | W)* ((text | E) W*)*`, with `K` the leading
 * kinds, `E` the others and `W` the wildcards. Text is one position, the first of each step, so
 * Unique Particle Attribution keeps it unique; a wildcard is two, one before the steps and one
 * within them, which the state tells apart. Whitespace keeps no position and carries the state, so
 * it stands anywhere. The restated model holds the XSD's element order wherever the XSD's model is
 * `(K | W)* (E (E | W)*)?`, which `content.test.ts` checks against the XSD.
 *
 * @param particle - The model's particle.
 * @param leading - The kinds that come first.
 * @returns The restated model, and whether the model names every leading kind.
 */
const leadingFirst = (particle: Particle, leading: readonly string[], source: string): Edited => {
  const leaves = leavesOf(particle).filter(({ occurs }) => !Option.contains(occurs.max, 0));
  const named = leaves.flatMap((leaf) => (leaf._tag === "element" ? leaf.kinds : []));
  const others = [...new Set(named)].filter((kind) => !leading.includes(kind));
  const wildcards = [
    ...new Map(
      leaves.flatMap((leaf) =>
        leaf._tag === "any" ? [[`${leaf.namespace} ${leaf.processing}`, leaf] as const] : [],
      ),
    ).values(),
  ];
  const once: Occurs = { max: Option.some(1), min: 1 };
  const many: Occurs = { max: Option.none(), min: 0 };
  // The restated groups and the text position are the reading's; a kind's particle keeps the
  // XSD's own source where the model states it.
  const sources: Sources = pipe(
    particle.sources,
    Arr.map((): Source => ({ _tag: "spec", cite: source })),
  );
  const element = (kind: string): Particle => ({
    _tag: "element",
    kinds: [kind],
    occurs: once,
    sources: Option.getOrElse(
      Arr.findFirst(leaves, (leaf) => leaf._tag === "element" && leaf.kinds.includes(kind)).pipe(
        Option.map((leaf) => leaf.sources),
      ),
      () => sources,
    ),
  });

  return {
    found: leading.every((kind) => named.includes(kind)),
    particle: {
      _tag: "group",
      compositor: "sequence",
      occurs: once,
      particles: [
        {
          _tag: "group",
          compositor: "choice",
          occurs: many,
          particles: [
            ...leading.map(element),
            ...wildcards.map((wildcard) => ({ ...wildcard, occurs: once })),
          ],
          sources,
        },
        {
          _tag: "group",
          compositor: "choice",
          occurs: many,
          particles: [
            {
              _tag: "group",
              compositor: "sequence",
              occurs: once,
              particles: [
                {
                  _tag: "group",
                  compositor: "choice",
                  occurs: once,
                  particles: ["text", ...others].map(element),
                  sources,
                },
                ...wildcards.map((wildcard) => ({ ...wildcard, occurs: many })),
              ],
              sources,
            },
          ],
          sources,
        },
      ],
      sources,
    },
  };
};

/**
 * Apply a spec reading's edit to a particle tree.
 *
 * @param particle - The model's particle.
 * @param edit - The edit.
 * @returns The edited particle, and whether the edit found what it names.
 */
const edited = (particle: Particle, edit: ModelEdit): Edited => {
  if (edit._tag === "first") {
    return leadingFirst(particle, edit.kinds, edit.source);
  }

  if (edit._tag === "restate") {
    // A restatement replaces the XSD's particle only over the same element kinds and no wildcard,
    // so it narrows the model's language and never admits a kind the XSD does not.
    const kindsOf = (held: Particle): ReadonlySet<string> =>
      new Set(leavesOf(held).flatMap((leaf) => (leaf._tag === "element" ? leaf.kinds : ["##any"])));
    const before = kindsOf(particle);
    const after = kindsOf(edit.particle);
    const same =
      !before.has("##any") &&
      before.size === after.size &&
      [...after].every((kind) => before.has(kind));

    return { found: same, particle: same ? edit.particle : particle };
  }

  let found = false;
  const walk = (node: Particle): Particle => {
    switch (node._tag) {
      case "element": {
        if (edit._tag === "beside" && node.kinds.includes(edit.with)) {
          found = true;

          return {
            ...node,
            kinds: [...node.kinds, edit.kind],
            sources: pipe(
              node.sources,
              Arr.map((): Source => ({ _tag: "spec", cite: edit.source })),
            ),
          };
        }

        return node;
      }
      case "any": {
        return node;
      }
      case "group": {
        const holds =
          edit._tag === "require" &&
          node.particles.some(
            (child) => child._tag === "element" && child.kinds.includes(edit.kind),
          );
        found ||= holds;

        return {
          ...node,
          occurs: holds ? { ...node.occurs, min: Math.max(1, node.occurs.min) } : node.occurs,
          particles: node.particles.map(walk),
          // The group a reading requires takes the reading as its source.
          sources: holds
            ? pipe(
                node.sources,
                Arr.map((): Source => ({ _tag: "spec", cite: edit.source })),
              )
            : node.sources,
        };
      }
      default: {
        return node satisfies never;
      }
    }
  };
  const result = walk(particle);

  return { found, particle: result };
};

/**
 * Apply every spec reading's edit of a kind's model, in order, and record each edit that found what
 * it names.
 *
 * @param particle - The model's particle.
 * @param edits - Every reading's edits.
 * @param kind - The model's kind.
 * @param used - The edits that found what they name, added to.
 * @returns The edited particle.
 */
const editedBy = (
  particle: Particle,
  edits: readonly ModelEdit[],
  kind: string,
  used: Set<ModelEdit>,
): Particle => {
  let tree = particle;
  for (const edit of edits) {
    if (edit.parent === kind) {
      const result = edited(tree, edit);
      if (result.found) {
        used.add(edit);
      }

      tree = result.particle;
    }
  }

  return tree;
};

/**
 * The automaton of a content type that holds no particle: no position, and the empty family.
 */
const noAutomaton: Automaton = {
  ambiguous: [],
  choices: [],
  first: new Set(),
  follow: [],
  last: new Set(),
  nullable: true,
  positions: [],
  shared: [],
};

/**
 * Find a state from which one kind leads to two positions, so that no state decides the child's
 * position: a breach of determinism over the kind alphabet. An XSD's Unique Particle Attribution
 * rules it out wherever a kind carries what the XSD tells particles apart by, as a foreign kind
 * carries its namespace class; this refuses, when the grammar composes, a kind that does not.
 *
 * @param automaton - The automaton.
 * @param symbols - The positions each kind names.
 * @returns A kind with such a state, or none.
 */
const undecidedKindOf = (
  automaton: Automaton,
  symbols: ReadonlyMap<string, readonly number[]>,
): Option.Option<string> =>
  Arr.findFirst([...symbols], ([, numbers]) =>
    [automaton.first, ...automaton.follow].some(
      (next) => [...new Set(numbers)].filter((number) => next.has(number)).length > 1,
    ),
  ).pipe(Option.map(([kind]) => kind));

/**
 * One installed automaton: its version, parent, model and the kinds it admits by each position.
 */
interface Installed {
  readonly automaton: Automaton;
  readonly data: readonly string[];
  readonly parent: string;
  /**
   * The model's source in its version, and each position's, position n at index n.
   */
  readonly sources: readonly [Source, ...Source[]];
  readonly symbols: ReadonlyMap<string, readonly number[]>;
  readonly version: SchemaVersion;
}

/**
 * Install the automata of content models, and project their admitted triples with each child's
 * position (plan R12, U4).
 *
 * An element particle admits its kinds. A wildcard admits, by its processing, the globally
 * declared kinds in its namespaces that no element particle of the model names, but the roots
 * reading 6 keeps foreign (`lax`, `strict`), and the foreign kinds of the namespace classes its
 * constraint admits (`lax`, `skip`). The content type admits its character data at position 0.
 *
 * @param input - The models, the vocabularies' readings, and what a wildcard reads.
 * @returns The content grammar and the admitted triples with their positions, or the first model or
 *   reading that has none.
 */
export const contentOf = (input: {
  readonly facets: readonly ContentFacet[];
  readonly foreignRoots: ReadonlySet<string>;
  readonly globalKinds: (version: SchemaVersion) => readonly string[];
  readonly kinds: Roster<string>;
  readonly models: readonly ContentModel[];
  readonly namespaceOf: (kind: string) => string;
  readonly versions: Roster<SchemaVersion>;
}): Result.Result<
  {
    readonly admitted: readonly (AdmittedChild & { readonly position: number })[];
    readonly content: ContentGrammar;
  },
  ContentError
> =>
  Result.gen(function* installContent() {
    const edits = input.facets.flatMap((facet) => facet.edits);
    const installed: Installed[] = [];
    const used = new Set<ModelEdit>();
    for (const model of [...input.models, ...input.facets.flatMap((facet) => facet.models)]) {
      const { content } = model;
      const data = characterData[content._tag];
      const own = input.namespaceOf(model.kind);
      const particle: Option.Option<Particle> =
        content._tag === "element-only" || content._tag === "mixed"
          ? Option.some(editedBy(content.particle, edits, model.kind, used))
          : Option.none();
      const automaton = Option.match(particle, {
        onNone: () => noAutomaton,
        onSome: (held) => automatonOf(held, input.namespaceOf, own),
      });
      if (automaton.ambiguous.length > 0) {
        return yield* Result.fail(
          new AmbiguousModel({ kind: model.kind, versions: model.versions.join(" and ") }),
        );
      }

      for (const version of model.versions) {
        const named = new Set(
          automaton.positions.flatMap(({ symbol }) =>
            symbol._tag === "kinds" ? symbol.kinds : [],
          ),
        );
        const symbols = new Map<string, number[]>();
        const admit = (kind: string, position: number) => {
          symbols.set(kind, [...(symbols.get(kind) ?? []), position]);
        };
        // `automatonOf` gives no position to a particle that never occurs, or sits in a group that
        // never does, so every position is one some family reaches.
        for (const { number, symbol } of automaton.positions) {
          if (symbol._tag === "kinds") {
            for (const kind of symbol.kinds) {
              admit(kind, number);
            }
          } else {
            if (symbol.processing !== "skip") {
              for (const kind of input.globalKinds(version)) {
                if (
                  !named.has(kind) &&
                  !input.foreignRoots.has(kind) &&
                  admitsNamespace(symbol.namespace, own, input.namespaceOf(kind))
                ) {
                  admit(kind, number);
                }
              }
            }

            // An element no declaration names is its namespace class's foreign kind, and the
            // wildcard admits the classes its constraint does (§3.10.1), unless it is strict.
            if (symbol.processing !== "strict") {
              for (const namespaceClass of namespaceClassesUnder[symbol.namespace]) {
                admit(foreignKinds[namespaceClass], number);
              }
            }
          }
        }

        const undecided = undecidedKindOf(automaton, symbols);
        if (Option.isSome(undecided)) {
          return yield* Result.fail(
            new AmbiguousModel({
              kind: `${model.kind} (for ${undecided.value})`,
              versions: version,
            }),
          );
        }

        // `sources` are aligned with the model's versions, so this version's is at its index.
        const at = model.versions.indexOf(version);
        const inVersion = (sources: Sources): Source => sources[at] ?? sources[0];
        installed.push({
          automaton,
          data,
          parent: model.kind,
          sources: [
            inVersion(model.sources),
            ...automaton.positions.map((held) => inVersion(held.sources)),
          ],
          symbols,
          version,
        });
      }
    }

    const unused = edits.find((edit) => !used.has(edit));
    if (unused !== undefined) {
      return yield* Result.fail(
        new UnreadEdit({
          kind: ((): string => {
            switch (unused._tag) {
              case "first": {
                return unused.kinds.join(", ");
              }
              case "restate": {
                return [
                  ...new Set(
                    leavesOf(unused.particle).flatMap((leaf) =>
                      leaf._tag === "element" ? leaf.kinds : [],
                    ),
                  ),
                ].join(", ");
              }
              case "beside":
              case "require": {
                return unused.kind;
              }
              default: {
                return unused satisfies never;
              }
            }
          })(),
          parent: unused.parent,
          source: unused.source,
        }),
      );
    }

    const widest = Math.max(0, ...installed.map(({ automaton }) => automaton.positions.length));
    const positions = fin("Position", widest + 1);
    const version = idField("version", input.versions);
    const parent = idField("parent", input.kinds);
    const sizes = new Map(
      installed.map(({ automaton, parent: held, version: in_ }) => [
        `${in_} ${held}`,
        automaton.positions.length + 1,
      ]),
    );
    // A family's positions are 0, its start, then its model's own: the dependent sum Σ (P + 1).
    const sizeOf = (prefix: Readonly<Record<string, string>>) => sizes.get(familyOf(prefix)) ?? 1;
    const position = dependentField("position", positions, sizeOf);
    // `Symbol` holds rows only where a kind names several positions, so a family whose kinds each
    // name one has an empty block.
    const sharing = new Set(
      installed.flatMap(({ parent: held, symbols, version: in_ }) =>
        [...symbols.values()].some((numbers) => new Set(numbers).size > 1)
          ? [`${in_} ${held}`]
          : [],
      ),
    );
    const sharedPosition = dependentField("position", positions, (prefix) =>
      sharing.has(familyOf(prefix)) ? sizeOf(prefix) : 0,
    );
    const admitted = installed.flatMap(({ data, parent: held, symbols, version: in_ }) => [
      ...[...symbols].map(([child, numbers]) => {
        const [only, ...rest] = new Set(numbers);

        return {
          child,
          parent: held,
          position: only !== undefined && rest.length === 0 ? only : 0,
          version: in_,
        };
      }),
      // Character data a model gives a position, as spec reading 40 gives SSML's text, is admitted
      // there; the rest carries its predecessor's state.
      ...data
        .filter((child) => !symbols.has(child))
        .map((child) => ({ child, parent: held, position: 0, version: in_ })),
    ]);
    const countedRows = installed.flatMap(({ automaton, parent: held, version: in_ }) =>
      automaton.positions.flatMap(({ number, occurs }) => {
        const max = Option.getOrElse(occurs.max, () => Number.POSITIVE_INFINITY);

        return occurs.min >= 2 || (max >= 2 && Number.isFinite(max))
          ? [{ max, min: occurs.min, parent: held, position: String(number), version: in_ }]
          : [];
      }),
    );
    const sourcesOf = new Map(
      installed.map(({ parent: held, sources, version: in_ }) => [`${in_} ${held}`, sources]),
    );
    const sourceOf = (key: {
      readonly parent: string;
      readonly position: string;
      readonly version: SchemaVersion;
    }): Option.Option<Source> =>
      Option.fromNullishOr(sourcesOf.get(`${key.version} ${key.parent}`)?.[Number(key.position)]);
    // Every row a relation states is at a position of its family's model, so a row with none is a
    // defect here.
    const sourceAt = (key: {
      readonly parent: string;
      readonly position: string;
      readonly version: SchemaVersion;
    }): Source =>
      Option.getOrThrowWith(
        sourceOf(key),
        () =>
          new Error(
            `The content grammar states position ${key.position} of ${key.parent} in ${key.version}, which its model has not.`,
          ),
      );
    // `Symbol`'s rows by family and kind: the kinds several positions of a model name.
    const shared = new Map(
      installed.flatMap(({ parent: held, symbols, version: in_ }) =>
        [...symbols].flatMap(([kind, numbers]) => {
          const distinct = [...new Set(numbers)].toSorted((left, right) => left - right);

          return distinct.length > 1
            ? [
                [
                  `${in_} ${held} ${kind}`,
                  { kind, numbers: distinct, parent: held, version: in_ },
                ] as const,
              ]
            : [];
        }),
      ),
    );

    return {
      admitted,
      content: {
        counted: sourced(
          yield* closed({
            key: [version, parent, position],
            name: "Counted",
            payload: [
              valueField(
                "min",
                countedRows.map(({ min }) => min),
              ),
              valueField(
                "max",
                countedRows.map(({ max }) => max),
              ),
            ],
            rows: countedRows,
          }),
          sourceAt,
        ),
        follow: sourced(
          yield* closed({
            key: [
              version,
              parent,
              dependentField("from", positions, sizeOf),
              dependentField("to", positions, sizeOf),
            ],
            name: "Follow",
            payload: [],
            rows: installed.flatMap(({ automaton, parent: held, version: in_ }) => [
              ...[...automaton.first].map((to) => ({
                from: "0",
                parent: held,
                to: String(to),
                version: in_,
              })),
              ...automaton.follow.flatMap((next, index) =>
                [...next].map((to) => ({
                  from: String(index + 1),
                  parent: held,
                  to: String(to),
                  version: in_,
                })),
              ),
            ]),
          }),
          ({ parent: held, to, version: in_ }) =>
            sourceAt({ parent: held, position: to, version: in_ }),
        ),
        last: sourced(
          yield* closed({
            key: [version, parent, position],
            name: "Last",
            payload: [],
            rows: installed.flatMap(({ automaton, parent: held, version: in_ }) => [
              ...(automaton.nullable ? [{ parent: held, position: "0", version: in_ }] : []),
              ...[...automaton.last].map((number) => ({
                parent: held,
                position: String(number),
                version: in_,
              })),
            ]),
          }),
          sourceAt,
        ),
        positions,
        sharedPositions: ({ kind, parent: held, version: in_ }) =>
          shared.get(`${in_} ${held} ${kind}`)?.numbers ?? [],
        sourceOf,
        symbol: sourced(
          yield* closed({
            key: [version, parent, idField("kind", input.kinds), sharedPosition],
            name: "Symbol",
            payload: [],
            rows: [...shared.values()].flatMap(({ kind, numbers, parent: held, version: in_ }) =>
              numbers.map((number) => ({
                kind,
                parent: held,
                position: String(number),
                version: in_,
              })),
            ),
          }),
          sourceAt,
        ),
      },
    };
  });

/**
 * Step a family's automaton by one child, as `Node`'s position derives (the host's evaluation of
 * the law the database proves).
 *
 * A child whose `Admission` position is not 0 moves to it where `Follow` allows; one whose kind
 * several positions name moves to the one position both `Follow` and `Symbol` hold; one whose kind
 * names no position (character data) keeps its predecessor's state.
 *
 * @param content - The content grammar.
 * @param positionOf - A child's `Admission` position.
 * @param key - The family and the child.
 * @param key.version - The version.
 * @param key.parent - The parent's kind.
 * @param key.child - The child's kind.
 * @param was - The predecessor's state, 0 for the first child.
 * @returns The child's state, or none when no position follows.
 */
export const contentStep = (
  content: ContentGrammar,
  positionOf: (key: {
    readonly child: string;
    readonly parent: string;
    readonly version: SchemaVersion;
  }) => Option.Option<number>,
  key: { readonly child: string; readonly parent: string; readonly version: SchemaVersion },
  was: number,
): Option.Option<number> => {
  const { parent, version } = key;
  const follows = (to: number) =>
    Option.isSome(content.follow.lookup({ from: String(was), parent, to: String(to), version }));

  return Option.flatMap(positionOf(key), (position) => {
    if (position !== 0) {
      return Option.liftPredicate(position, follows);
    }

    const shared = content.sharedPositions({ kind: key.child, parent, version });
    if (shared.length === 0) {
      return Option.some(was);
    }

    const next = shared.filter(follows);

    return next.length === 1 ? Arr.head(next) : Option.none();
  });
};

/**
 * Whether a family may end in a state: `Last`'s cell.
 *
 * @param content - The content grammar.
 * @param version - The version.
 * @param parent - The parent's kind.
 * @param state - The last child's state, 0 for an empty family.
 * @returns Whether the family may end there.
 */
export const contentEnds = (
  content: ContentGrammar,
  version: SchemaVersion,
  parent: string,
  state: number,
): boolean => Option.isSome(content.last.lookup({ parent, position: String(state), version }));
