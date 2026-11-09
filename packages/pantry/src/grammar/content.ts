/**
 * The content grammar: each (version, parent)'s content model as its Glushkov automaton (the
 * operator's ruling of 2026-11-05, Glushkov for all 638 models).
 *
 * A model's positions are its element and wildcard particles, numbered from 1 in tree order (U4's
 * particle numbering); 0 is the start. A child's `Admission` row carries its position: the one
 * position its kind names, or 0 where its kind names none (character data, which carries its
 * predecessor's state) or several (a shared kind, whose position the state decides through
 * `Symbol`). The law reads one bit, `Follow(model, was, position)`, with `model` the family's
 * `ContentModelOf(version, parent)` and `was` the predecessor's position (0 for the first child),
 * and the last child reads `Last(model, state)`: the relations are keyed by automaton, each
 * distinct automaton stated once, however many families share it. Under Unique Particle Attribution
 * the automaton enforces order, required particles, at-most-once and exclusive choice; a bound of
 * 2…n, which a position automaton relaxes, is a count law, `Counted(version, parent, position) →
 * (min, max)`. So is a reading's cap, a particle of at most one that an enclosing group repeats,
 * which the automaton reads per repeat and the reading reads as the family's total: `Counted` holds
 * it as `(0, 1)` (spec reading 130, the loose LOM binding's Schematron).
 *
 * A group's bound of 2…n the automaton relaxes too, to `1..n` (`automatonOf` links a repeatable
 * group's last positions to its first, whatever its bounds), and no position carries it, so
 * `Counted` does not hold it. Every such bound in the pinned XSDs is a `choice` of 2..2 whose every
 * member is one operand exactly once, the content of nineteen expression operators: the fifteen
 * that share the pair at `imsqti_asiv3p0p1_v1p0.xsd:29337` (`qti-contains`, `qti-delete`,
 * `qti-divide`, `qti-duration-gte`, `qti-duration-lt`, `qti-gt`, `qti-gte`, `qti-integer-divide`,
 * `qti-integer-modulus`, `qti-lt`, `qti-lte`, `qti-match`, `qti-member`, `qti-power`,
 * `qti-subtract`), and `qti-equal`, `qti-equal-rounded`, `qti-string-match` and `qti-substring`,
 * each with its own (lines 26945, 27046, 32183, 32264); so the operator's child count is the
 * group's repeat count, and `OperatorArity(kind) → (min, max)`, which `aritiesOf` reads off that
 * same group, holds it: law O4, `Arity` (`src/qti/expressions.ts`), counts an expression's operands
 * against it. The automaton admits `qti-contains` with one operand, and Arity refuses it.
 * `content.test.ts` proves both halves: its occurrence-bound census refuses any counted group whose
 * operator's `OperatorArity` is not exactly its bound or whose repeat is not one child, and its
 * xmllint differential exhausts every family of at most 3 children over each such operator.
 *
 * Q3's `automatonOf` builds every automaton from the content-model IR; this module installs them.
 */
import { Array as Arr, Option, pipe, Result, Schema } from "effect";
import type { Admission, AdmittedChild } from "#pantry/grammar/admission.ts";
import {
  closed,
  dependentField,
  fin,
  idField,
  prefixHandle,
  roster,
  rowsAt,
  sourced,
  sourceIn,
  valueField,
} from "#pantry/grammar/closed.ts";
import type {
  Closed,
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
import type { NamespaceOfKind } from "#pantry/vocab/namespaces.ts";
import { automatonOf } from "#pantry/vocab/sequencing.ts";
import type { Automaton, Position } from "#pantry/vocab/sequencing.ts";

/**
 * A spec reading that edits a content model where it says more than the XSD: a kind admitted beside
 * another in every particle that names it; kinds that come
 * before every other element of the model and before its text that is not whitespace; the model
 * restated whole, where the language the reading follows is not the XSD's and no edit of a particle
 * states it, narrower or wider (spec reading 2, MathML's RelaxNG); the kinds a family's last
 * child is one of, which narrows the model's `Last` where its language is no deterministic
 * expression's (spec reading 2, MathML's `lambda`); or a kind that stands at most once among a
 * family's children wherever the model repeats it, a count `Counted` states beside the automaton
 * (spec reading 130, the loose LOM binding's Schematron).
 */
export type ModelEdit =
  | {
      readonly _tag: "cap";
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
    }
  | {
      readonly _tag: "ends";
      readonly kinds: readonly [string, ...string[]];
      readonly parent: string;
      readonly source: string;
    };

/**
 * The kinds of one namespace, named by its URI, that are its only roots: the only kinds of that
 * namespace a wildcard admits, wherever it stands, and where it comes from (spec reading 2:
 * MathML's one root, `m:math`).
 */
export interface Roots {
  readonly kinds: readonly [string, ...string[]];
  readonly namespace: string;
  readonly source: string;
}

/**
 * A vocabulary's share of the content grammar: its spec readings' edits, the models of kinds no XSD
 * declares (the document node, the foreign kinds), and the roots of its namespace, none where a
 * wildcard admits every kind it declares globally.
 */
export interface ContentFacet {
  readonly edits: readonly ModelEdit[];
  readonly models: readonly ContentModel[];
  readonly roots: readonly Roots[];
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
 * The key of a relation per (version, parent) family.
 */
type FamilyKey = readonly [IdField<"version", SchemaVersion>, IdField<"parent", string>];

/**
 * The content grammar's relations, and the host's view of each automaton.
 *
 * `Follow`, `Last` and `Symbol` are keyed by the automaton, not by the (version, parent) family:
 * two families whose automata have the same positions, `Follow` and `Last` are one content model
 * (rule 0: identical facts are one fact), and a family reads its model through `ContentModelOf`;
 * `Symbol` is keyed likewise by its shared model, through `SharedModelOf`. Where a family's row
 * comes from is the family's, not the model's, so {@link ContentGrammar.sourceOf} answers it by
 * family and position.
 */
export interface ContentGrammar {
  /**
   * `ContentModelOf`: (version, parent) → model, total, the automaton the family's children
   * follow; a family no content model holds reads the model of one position that nothing follows
   * and nothing ends at.
   */
  readonly contentModelOf: Closed<FamilyKey, readonly [IdField<"model", string>]>;
  /**
   * `Counted`: the positions whose count is a law beside the automaton, with their bounds, each
   * sourced to the particle whose bound it is, or to the reading that caps it at one.
   */
  readonly counted: Sourced<
    PositionKey,
    readonly [ValueField<"min", number>, ValueField<"max", number>]
  >;
  /**
   * `Follow`: (model, from, to) where a child at position `to` may follow one at `from`, `from` 0
   * the start, in the content model's automaton.
   */
  readonly follow: Closed<
    readonly [IdField<"model", string>, DependentField<"from">, DependentField<"to">],
    readonly []
  >;
  /**
   * `Last`: (model, at) where a family of the model may end at position `at`, 0 when it may be
   * empty.
   */
  readonly last: Closed<
    readonly [IdField<"model", string>, DependentField<"position">],
    readonly []
  >;
  /**
   * `ModelPositions`: model → positions, each content model's position count, its start 0
   * included, `Follow`'s and `Last`'s dependent sizes.
   */
  readonly modelPositions: Closed<
    readonly [IdField<"model", string>],
    readonly [ValueField<"positions", number>]
  >;
  /**
   * The `ContentModel` roster: every distinct automaton, in the code order of its first family,
   * each named by that family's parent kind, or by `<version> <parent>` where an earlier model took
   * that name.
   */
  readonly models: Roster<string>;
  /**
   * The `Position` roster: 0, the start, then 1 to the widest model's last position.
   */
  readonly positions: Roster<string>;
  /**
   * `SharedModelOf`: (version, parent) → shared model, for each family a kind names at several
   * positions; a family whose kinds each name one position has no row.
   */
  readonly sharedModelOf: Closed<FamilyKey, readonly [IdField<"model", string>]>;
  /**
   * `SharedPositions`: shared model → positions, each shared model's position count, its start 0
   * included, `Symbol`'s dependent size.
   */
  readonly sharedModelPositions: Closed<
    readonly [IdField<"model", string>],
    readonly [ValueField<"positions", number>]
  >;
  /**
   * The `SharedModel` roster: every distinct shared model in the code order of its first family,
   * each named as {@link ContentGrammar.models} names a model.
   */
  readonly sharedModels: Roster<string>;
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
   * `Symbol`: (shared model, kind, position) for the kinds several positions of a model name, whose
   * position the state decides.
   */
  readonly symbol: Closed<
    readonly [IdField<"model", string>, IdField<"kind", string>, DependentField<"position">],
    readonly []
  >;
  /**
   * `StrictlyHeld`: (version, parent, child) for each foreign kind only `strict` wildcards of the
   * parent's model admit, each sourced to the wildcard. Such a child has no declaration its
   * document's schema set gives it, so it stands only where its `xsi:type` names a type that set
   * holds or a built-in, against which XML Schema assesses it (Part 1, §3.3.4 clause 1.2; spec
   * reading 81); without one it is invalid (§3.10.4 clause 2, §3.3.5 [validity] clause 1.1.3).
   */
  readonly strictlyHeld: Sourced<
    readonly [
      IdField<"version", SchemaVersion>,
      IdField<"parent", string>,
      IdField<"child", string>,
    ],
    readonly []
  >;
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
 * A spec reading's ending names some kinds of one of its model's positions and not the others, so
 * no position state tells a family that ends there with a listed kind from one that ends with
 * another.
 */
export class MixedEnding extends Schema.TaggedError<MixedEnding>()("MixedEnding", {
  kinds: Schema.String,
  parent: Schema.String,
  source: Schema.String,
}) {
  /**
   * The reading, the position's kinds, and the repair.
   */
  override get message(): string {
    return `The spec reading ${this.source} ends ${this.parent}'s families with some of the kinds ${this.kinds}, which one position of its model names together, so the ending is not decided by the last child's position. Restate the model so that position is split, or list all its kinds or none.`;
  }
}

/**
 * A spec reading caps a kind that its model names at several positions, or beside other kinds at
 * one, so no one position's count is the kind's count.
 */
export class UncountedCap extends Schema.TaggedError<UncountedCap>()("UncountedCap", {
  kind: Schema.String,
  parent: Schema.String,
  source: Schema.String,
}) {
  /**
   * The reading, the kind and parent, and the repair.
   */
  override get message(): string {
    return `The spec reading ${this.source} caps ${this.kind} under ${this.parent}, which ${this.parent}'s model does not name at exactly one position of its own, so no position's count is the kind's. Restate the model so one particle names ${this.kind} alone, or state the count as a law of its own.`;
  }
}

/**
 * The ways the content models have no content grammar.
 */
export type ContentError = ClosedRelationError | MixedEnding | UncountedCap | UnreadEdit;

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
 * @param source - The reading, which the restated groups and the text position cite.
 * @returns The restated model, and whether the model names every leading kind; the model as it
 *   is where it names one not, which leaves the reading unread ({@link UnreadEdit}).
 */
const leadingFirst = (particle: Particle, leading: readonly string[], source: string): Edited => {
  const leaves = leavesOf(particle).filter(({ occurs }) => !Option.contains(occurs.max, 0));
  const named = leaves.flatMap((leaf) => (leaf._tag === "element" ? leaf.kinds : []));
  if (!leading.every((kind) => named.includes(kind))) {
    return { found: false, particle };
  }

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
  // XSD's own source, its first particle's in the model.
  const sources: Sources = pipe(
    particle.sources,
    Arr.map((): Source => ({ _tag: "spec", cite: source })),
  );
  const element = (kind: string, held: Sources): Particle => ({
    _tag: "element",
    kinds: [kind],
    occurs: once,
    sources: held,
  });
  // Every kind restated here is one the model names: a leading kind, or one of the others.
  const restated = (kind: string): Particle =>
    element(
      kind,
      Option.getOrThrowWith(
        Arr.findFirst(leaves, (leaf) => leaf._tag === "element" && leaf.kinds.includes(kind)).pipe(
          Option.map((leaf) => leaf.sources),
        ),
        () =>
          new Error(
            `The reading ${source} restates ${kind}, which no particle of the model names.`,
          ),
      ),
    );

  return {
    found: true,
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
            ...leading.map(restated),
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
                  particles: [element("text", sources), ...others.map(restated)],
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
    // A restatement is the reading's whole model: it replaces the XSD's particle, narrowing or
    // widening its language, and the reading's own recognizer (`#pantry/test/gen/relaxng.ts`,
    // `relaxNgModels`) is what it is checked against.
    return { found: true, particle: edit.particle };
  }

  if (edit._tag === "ends" || edit._tag === "cap") {
    // An ending narrows the automaton and a cap counts beside it, neither the particle
    // (`contentOf`); each is found when the model names one of its kinds.
    const named = new Set(
      leavesOf(particle).flatMap((leaf) => (leaf._tag === "element" ? leaf.kinds : [])),
    );
    const kinds = edit._tag === "cap" ? [edit.kind] : edit.kinds;

    return { found: kinds.some((kind) => named.has(kind)), particle };
  }

  let found = false;
  const walk = (node: Particle): Particle => {
    switch (node._tag) {
      case "element": {
        if (node.kinds.includes(edit.with)) {
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
        return { ...node, particles: node.particles.map(walk) };
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
 * it names: the particle {@link contentOf} builds the model's automaton from, which the tests read
 * too (`content.test.ts`, Unique Particle Attribution over every model of a composition).
 *
 * @param particle - The model's particle.
 * @param edits - Every reading's edits.
 * @param kind - The model's kind.
 * @param used - The edits that found what they name, added to.
 * @returns The edited particle.
 */
export const editedBy = (
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
 * Narrow an automaton by the readings' endings of its kind: a family may end only at a position
 * whose kinds an ending lists, every ending's, and never empty. `Follow` is untouched, so the
 * family's other children keep the model's order. A family's last state is its last child's
 * position, so an ending is exact only where each position names kinds all of which or none of
 * which it lists; a position it lists in part is refused as {@link MixedEnding}.
 *
 * An ending states a language no deterministic expression does: MathML's `lambda` is
 * `bvar*, DomainQ, ContExp` with `interval` in both `DomainQ` and `ContExp` (spec reading 2), whose
 * minimal automaton breaks Brüggemann-Klein and Wood's orbit property, so no particle Unique
 * Particle Attribution keeps deterministic states it. Its restatement `bvar*, (interval |
 * qualifier)*, other?`, ended by the content expressions, is deterministic, and its `Last` ends a
 * family where the RelaxNG's does.
 *
 * @param automaton - The model's automaton.
 * @param edits - Every reading's edits.
 * @param kind - The model's kind.
 * @returns The automaton, its `Last` narrowed by the kind's endings, or the first ending a position
 *   is listed in only in part by.
 * @see {@link https://doi.org/10.1006/inco.1997.2695 | Brüggemann-Klein and Wood, One-Unambiguous Regular Languages (Information and Computation 142(2), 1998)}
 */
const endedBy = (
  automaton: Automaton,
  edits: readonly ModelEdit[],
  kind: string,
): Result.Result<Automaton, MixedEnding> => {
  const endings = edits.flatMap((edit) =>
    edit._tag === "ends" && edit.parent === kind ? [edit] : [],
  );
  for (const ending of endings) {
    const listed = new Set<string>(ending.kinds);
    for (const { symbol } of automaton.positions) {
      if (
        symbol._tag === "kinds" &&
        symbol.kinds.some((held) => listed.has(held)) &&
        !symbol.kinds.every((held) => listed.has(held))
      ) {
        return Result.fail(
          new MixedEnding({
            kinds: symbol.kinds.join(", "),
            parent: kind,
            source: ending.source,
          }),
        );
      }
    }
  }

  if (endings.length === 0) {
    return Result.succeed(automaton);
  }

  // A state is the position its family's last child stands at; state 0, the empty family, has no
  // last child, so no position names its kinds and an ending drops it.
  const listed = (state: number): boolean =>
    automaton.positions.some(
      ({ number: at, symbol }) =>
        at === state &&
        symbol._tag === "kinds" &&
        endings.every(({ kinds }) => symbol.kinds.every((held) => kinds.includes(held))),
    );

  return Result.succeed({ ...automaton, ends: new Set([...automaton.ends].filter(listed)) });
};

/**
 * One position a reading caps: at most one child of a family stands there.
 */
interface Cap {
  readonly position: number;
  readonly source: string;
}

/**
 * Find the positions the readings' caps of a kind's model count: for each cap, the one position
 * that names its kind and no other kind, so the count of the family's children there is the count
 * of the kind. A kind a model names at several positions, or beside another kind at one, has no
 * such position, and its cap is refused as {@link UncountedCap}. A kind no particle of the model
 * names leaves the cap unread, which {@link contentOf} refuses as {@link UnreadEdit}, and one whose
 * particles never occur has no child to count.
 *
 * @param automaton - The model's automaton.
 * @param edits - Every reading's edits.
 * @param kind - The model's kind.
 * @returns The capped positions, or the first cap no one position counts.
 */
const cappedBy = (
  automaton: Automaton,
  edits: readonly ModelEdit[],
  kind: string,
): Result.Result<readonly Cap[], UncountedCap> => {
  const caps: Cap[] = [];
  for (const edit of edits) {
    if (edit._tag === "cap" && edit.parent === kind) {
      const [only, ...rest] = automaton.positions.filter(
        ({ symbol }) => symbol._tag === "kinds" && symbol.kinds.includes(edit.kind),
      );
      if (only !== undefined) {
        if (rest.length > 0 || only.symbol._tag !== "kinds" || only.symbol.kinds.length > 1) {
          return Result.fail(
            new UncountedCap({ kind: edit.kind, parent: kind, source: edit.source }),
          );
        }

        caps.push({ position: only.number, source: edit.source });
      }
    }
  }

  return Result.succeed(caps);
};

/**
 * The automaton of a content type that holds no particle: no position, and the empty family, which
 * ends at the start.
 */
const noAutomaton: Automaton = {
  ends: new Set([0]),
  next: [new Set()],
  positions: [],
};

/**
 * The automaton of a family no content model holds: its start, which nothing follows and nothing
 * ends at, so the family admits no word, not even the empty one.
 */
const emptyLanguage: Automaton = {
  ends: new Set(),
  next: [new Set()],
  positions: [],
};

/**
 * A position of a model in one of its versions: the position, and where its particle is stated in
 * the version.
 */
interface Placed {
  readonly position: Position;
  readonly source: Source;
}

/**
 * One installed automaton: its version, parent, model and the kinds it admits by each position.
 */
interface Installed {
  readonly automaton: Automaton;
  /**
   * The positions the readings cap at one child.
   */
  readonly caps: readonly Cap[];
  readonly data: readonly string[];
  readonly parent: string;
  /**
   * Each position of the model, with its particle's source in the version.
   */
  readonly positions: readonly Placed[];
  /**
   * The automaton's signature ({@link signatureOf}), one per model, which its versions share.
   */
  readonly signature: string;
  /**
   * The model's source in its version.
   */
  readonly source: Source;
  /**
   * The foreign kinds only `strict` wildcards of the model admit.
   */
  readonly strictly: ReadonlySet<string>;
  /**
   * The positions each kind the model admits is named at, in position order.
   */
  readonly symbols: ReadonlyMap<string, readonly Placed[]>;
  readonly version: SchemaVersion;
}

/**
 * A child the content models admit under a parent, at its position, with the source of the
 * position: its particle's where one position names it, its model's at 0.
 */
export type AdmittedRow = AdmittedChild & {
  readonly position: number;
  readonly source: Source;
};

/**
 * A (version, parent) family.
 */
interface Family {
  readonly parent: string;
  readonly version: SchemaVersion;
}

/**
 * Every (version, parent) family, in code order: the rosters' product, version first.
 *
 * @param rosters - The versions and the kinds.
 * @param rosters.versions - The `SchemaVersion` roster.
 * @param rosters.kinds - The `NodeKind` roster.
 * @returns The families.
 */
const familiesOf = (rosters: {
  readonly kinds: Roster<string>;
  readonly versions: Roster<SchemaVersion>;
}): readonly Family[] =>
  rosters.versions.handles.flatMap((version) =>
    rosters.kinds.handles.map((parent) => ({ parent, version })),
  );

/**
 * Write what makes two automata one content model: the position count, start included, the pairs
 * `Follow` holds and the positions `Last` holds, each list sorted, so two automata of one language
 * built apart write the same text exactly when they state the same rows.
 *
 * @param automaton - The automaton.
 * @returns Its signature.
 */
const signatureOf = (automaton: Automaton): string =>
  [
    String(automaton.next.length),
    automaton.next
      .flatMap((next, from) => [...next].map((to) => `${String(from)}>${String(to)}`))
      .toSorted()
      .join(" "),
    [...automaton.ends].map(String).toSorted().join(" "),
  ].join("|");

/**
 * The signature of {@link emptyLanguage}, the model of every family no content model holds.
 */
const emptySignature = signatureOf(emptyLanguage);

/**
 * A family's model as {@link modelsOf} reads it: the signature that makes two families one model,
 * and the value the model states.
 */
interface Signed<V> {
  readonly family: Family;
  readonly signature: string;
  readonly value: V;
}

/**
 * Models read off the families they hold: each model with its handle and its first family's
 * value, in first-family order, and each family with its model's handle, in the families' order.
 */
interface Models<V> {
  readonly families: readonly (Family & { readonly model: string })[];
  readonly handles: readonly string[];
  readonly models: readonly { readonly handle: string; readonly value: V }[];
}

/**
 * Read families as models: two families are one model exactly when their signatures are equal
 * (rule 0: identical facts are one fact), and the model states its first family's rows, which
 * every family of it states alike. A model is named by its first family's parent kind, or by
 * `<version> <parent>` where an earlier model took that name, so every handle is a kind's or a
 * family's and at most 63 bytes.
 *
 * @param signed - Each family a model holds, with its signature and the value its model states, in
 *   (version, parent) code order.
 * @returns The models and each family's.
 */
const modelsOf = <V>(signed: readonly Signed<V>[]): Models<V> => {
  const models: { readonly handle: string; readonly value: V }[] = [];
  const bySignature = new Map<string, string>();
  const named = new Set<string>();
  const families = signed.map(({ family, signature, value }) => {
    const handle = bySignature.getOrInsertComputed(signature, () => {
      const fresh = named.has(family.parent) ? `${family.version} ${family.parent}` : family.parent;
      named.add(fresh);
      models.push({ handle: fresh, value });

      return fresh;
    });

    return { ...family, model: handle };
  });

  return { families, handles: models.map(({ handle }) => handle), models };
};

/**
 * Read a count a generator states for every handle of a roster.
 *
 * @param counts - The counts, by handle.
 * @param handle - The handle.
 * @param relation - The relation the counts are, as the defect's message names it.
 * @returns The handle's count.
 * @throws {Error} When the counts hold none for the handle, which every handle of the roster has.
 */
const countOf = (counts: ReadonlyMap<string, number>, handle: string, relation: string): number =>
  Option.getOrThrowWith(
    Option.fromNullishOr(counts.get(handle)),
    () =>
      new Error(
        `${relation} states no count for ${handle}, and it states one for every model of its roster. Count ${handle}'s positions.`,
      ),
  );

/**
 * A particle's greatest number of occurrences, `Infinity` for `unbounded`: `{max occurs}` is
 * "either a non-negative integer or unbounded" (XML Schema 1.0 Part 1, §3.9.1), and the IR holds
 * `unbounded` as none.
 *
 * @param occurs - The particle's bounds.
 * @returns Its maximum.
 */
export const maxOccursOf = (occurs: Occurs): number =>
  Option.match(occurs.max, { onNone: () => Number.POSITIVE_INFINITY, onSome: (most) => most });

/**
 * Install the automata of content models, and project their admitted triples with each child's
 * position (plan R12, U4).
 *
 * An element particle admits its kinds. A wildcard admits, by its processing, the globally
 * declared kinds in its namespaces that no element particle of the model names and that the
 * schema sets of the model's documents declare (spec reading 81), but the roots reading 6 keeps
 * foreign and, of a namespace a facet states the roots of, every kind but those roots (`lax`,
 * `strict`), and the foreign kinds of the namespace classes its constraint admits (`lax`, `skip`).
 * The content type admits its character data at position 0. A reading's ending narrows the
 * automaton's `Last` ({@link endedBy}).
 *
 * @param input - The models, the vocabularies' readings, and what a wildcard reads.
 * @param input.globalKinds - The kinds a `lax` or `strict` wildcard of a parent reads as their
 *   global declarations in a version: those a schema set of the parent's documents declares.
 * @param input.namespaceOf - The namespace of each kind's elements.
 * @returns The content grammar and the admitted triples with their positions, or the first model or
 *   reading that has none.
 */
export const contentOf = (input: {
  readonly facets: readonly ContentFacet[];
  readonly foreignRoots: ReadonlySet<string>;
  readonly globalKinds: (version: SchemaVersion, parent: string) => readonly string[];
  readonly kinds: Roster<string>;
  readonly models: readonly ContentModel[];
  readonly namespaceOf: (kind: string) => NamespaceOfKind;
  readonly versions: Roster<SchemaVersion>;
}): Result.Result<
  {
    readonly admitted: readonly AdmittedRow[];
    readonly content: ContentGrammar;
  },
  ContentError
> =>
  Result.gen(function* installContent() {
    const edits = input.facets.flatMap((facet) => facet.edits);
    const rootsOf: ReadonlyMap<string, ReadonlySet<string>> = new Map(
      input.facets
        .flatMap((facet) => facet.roots)
        .map(({ kinds, namespace }) => [namespace, new Set<string>(kinds)] as const),
    );
    // A namespace a facet states the roots of admits those kinds alone through a wildcard, and any
    // other namespace every kind it declares globally.
    const rootAdmits = (kind: string): boolean => {
      const namespace = input.namespaceOf(kind);

      return Option.match(
        namespace._tag === "in" ? Option.fromNullishOr(rootsOf.get(namespace.uri)) : Option.none(),
        { onNone: () => true, onSome: (roots) => roots.has(kind) },
      );
    };
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
      const automaton = yield* endedBy(
        Option.match(particle, {
          onNone: () => noAutomaton,
          onSome: automatonOf,
        }),
        edits,
        model.kind,
      );
      const caps = yield* cappedBy(automaton, edits, model.kind);
      const signature = signatureOf(automaton);

      for (const [at, version] of model.versions.entries()) {
        const named = new Set(
          automaton.positions.flatMap(({ symbol }) =>
            symbol._tag === "kinds" ? symbol.kinds : [],
          ),
        );
        // `sources` are aligned with the model's versions, so this version's is at its index.
        const positions = automaton.positions.map((position): Placed => ({
          position,
          source: sourceIn(
            position.sources,
            at,
            `Position ${String(position.number)} of the content model of ${model.kind}`,
          ),
        }));
        const symbols = new Map<string, Placed[]>();
        // The processing of each wildcard position that admits a foreign kind.
        const processings = new Map<string, string[]>();
        const admit = (kind: string, placed: Placed) => {
          symbols.getOrInsertComputed(kind, () => []).push(placed);
        };
        // `automatonOf` gives no position to a particle that never occurs, or sits in a group that
        // never does, so every position is one some family reaches.
        for (const placed of positions) {
          const { symbol } = placed.position;
          if (symbol._tag === "kinds") {
            for (const kind of symbol.kinds) {
              admit(kind, placed);
            }
          } else {
            if (symbol.processing !== "skip") {
              for (const kind of input.globalKinds(version, model.kind)) {
                if (
                  !named.has(kind) &&
                  !input.foreignRoots.has(kind) &&
                  rootAdmits(kind) &&
                  admitsNamespace(symbol.namespace, own, input.namespaceOf(kind))
                ) {
                  admit(kind, placed);
                }
              }
            }

            // An element no declaration names is its namespace class's foreign kind, and the
            // wildcard admits the classes its constraint does (§3.10.1). Under `strict` such an
            // element stands only with an `xsi:type` its document's schema set can resolve
            // (§3.3.4, clause 1.2; spec reading 81), which `StrictlyHeld` marks for the reader.
            for (const namespaceClass of namespaceClassesUnder[symbol.namespace]) {
              admit(foreignKinds[namespaceClass], placed);
              processings
                .getOrInsertComputed(foreignKinds[namespaceClass], () => [])
                .push(symbol.processing);
            }
          }
        }

        installed.push({
          automaton,
          caps,
          data,
          parent: model.kind,
          positions,
          signature,
          source: sourceIn(model.sources, at, `The content model of ${model.kind}`),
          strictly: new Set(
            [...processings].flatMap(([kind, held]) =>
              held.every((processing) => processing === "strict") ? [kind] : [],
            ),
          ),
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
              case "ends":
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
              case "cap": {
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
    const byFamily = new Map<string, Installed>(
      installed.map((entry) => [`${entry.version} ${entry.parent}`, entry]),
    );
    const installedAt = (family: {
      readonly parent: string;
      readonly version: string;
    }): Option.Option<Installed> =>
      Option.fromNullishOr(byFamily.get(`${family.version} ${family.parent}`));
    // A family no content model holds reads the empty language: its start alone.
    const automatonAt = (family: {
      readonly parent: string;
      readonly version: string;
    }): Automaton =>
      Option.match(installedAt(family), {
        onNone: () => emptyLanguage,
        onSome: ({ automaton }) => automaton,
      });
    // Each child a family's model admits, at its position: the one position its kind names, with
    // that position's source, or 0 with the model's, for a kind several positions name and for
    // character data the model gives no position, which carries its predecessor's state.
    const admittedOf = (entry: Installed): readonly AdmittedRow[] => [
      ...[...entry.symbols].map(([child, placed]) => {
        const [only, ...rest] = new Map(
          placed.map((held) => [held.position.number, held]),
        ).values();

        return only !== undefined && rest.length === 0
          ? {
              child,
              parent: entry.parent,
              position: only.position.number,
              source: only.source,
              version: entry.version,
            }
          : {
              child,
              parent: entry.parent,
              position: 0,
              source: entry.source,
              version: entry.version,
            };
      }),
      ...entry.data
        .filter((child) => !entry.symbols.has(child))
        .map((child) => ({
          child,
          parent: entry.parent,
          position: 0,
          source: entry.source,
          version: entry.version,
        })),
    ];
    // Each family's kinds that several positions of its model name, with those positions.
    const sharedOf = (entry: Installed) =>
      [...entry.symbols].flatMap(([kind, placed]) => {
        const distinct = [...new Set(placed.map(({ position }) => position.number))].toSorted(
          (left, right) => left - right,
        );

        return distinct.length > 1 ? [{ kind, numbers: distinct }] : [];
      });
    // The models, read once per family in (version, parent) code order: a family's automaton is its
    // model's whenever an earlier family's has the same positions, `Follow` and `Last`.
    const contentModels = modelsOf(
      familiesOf(input).map((family) =>
        Option.match(installedAt(family), {
          onNone: () => ({ family, signature: emptySignature, value: emptyLanguage }),
          onSome: (entry) => ({ family, signature: entry.signature, value: entry.automaton }),
        }),
      ),
    );
    const sharedModels = modelsOf(
      familiesOf(input).flatMap((family) =>
        Option.toArray(installedAt(family)).flatMap((entry) => {
          const shared = sharedOf(entry);

          return shared.length === 0
            ? []
            : [
                {
                  family,
                  signature: [
                    entry.parent,
                    String(entry.automaton.next.length),
                    ...shared
                      .flatMap(({ kind, numbers }) => numbers.map((number) => `${kind}:${number}`))
                      .toSorted(),
                  ].join(" "),
                  value: { positions: entry.automaton.next.length, shared },
                },
              ];
        }),
      ),
    );
    const model = idField("model", yield* roster("ContentModel", contentModels.handles));
    const sharedModel = idField("model", yield* roster("SharedModel", sharedModels.handles));
    const modelSizes = new Map(
      contentModels.models.map(({ handle, value }) => [handle, value.next.length]),
    );
    const sharedSizes = new Map(
      sharedModels.models.map(({ handle, value }) => [handle, value.positions]),
    );
    // A family's positions are 0, its start, then its model's own: the dependent sum Σ (P + 1).
    const position = dependentField(
      "position",
      positions,
      (prefix) =>
        automatonAt({
          parent: prefixHandle(prefix, "parent"),
          version: prefixHandle(prefix, "version"),
        }).next.length,
    );
    const modelPosition = <const Name extends string>(name: Name) =>
      dependentField(name, positions, (prefix) =>
        countOf(modelSizes, prefixHandle(prefix, "model"), "ModelPositions"),
      );
    const admitted = installed.flatMap(admittedOf);
    // A bound of 2…n the automaton relaxes is the particle's; a cap is its reading's, at most one
    // child where the model's enclosing group repeats the particle.
    const countedRows = installed.flatMap(
      ({ caps, parent: held, positions: placed, version: in_ }) => [
        ...placed.flatMap(({ position: { number, occurs }, source }) => {
          const max = maxOccursOf(occurs);

          return occurs.min >= 2 || (max >= 2 && Number.isFinite(max))
            ? [
                {
                  row: {
                    max,
                    min: occurs.min,
                    parent: held,
                    position: String(number),
                    version: in_,
                  },
                  source,
                },
              ]
            : [];
        }),
        ...caps.map(({ position: at, source }) => ({
          row: { max: 1, min: 0, parent: held, position: String(at), version: in_ },
          source: { _tag: "spec", cite: source } as const,
        })),
      ],
    );
    const sourceOf = (key: {
      readonly parent: string;
      readonly position: string;
      readonly version: SchemaVersion;
    }): Option.Option<Source> =>
      Option.flatMap(installedAt(key), (entry) => {
        const number = Number(key.position);

        return number === 0
          ? Option.some(entry.source)
          : Arr.findFirst(entry.positions, ({ position: held }) => held.number === number).pipe(
              Option.map(({ source }) => source),
            );
      });
    const symbol = yield* closed({
      key: [
        sharedModel,
        idField("kind", input.kinds),
        dependentField("position", positions, (prefix) =>
          countOf(sharedSizes, prefixHandle(prefix, "model"), "SharedPositions"),
        ),
      ],
      name: "Symbol",
      payload: [],
      rows: sharedModels.models.flatMap(({ handle, value }) =>
        value.shared.flatMap(({ kind, numbers }) =>
          numbers.map((number) => ({ kind, model: handle, position: String(number) })),
        ),
      ),
    });
    const sharedModelOf = yield* closed({
      key: [version, parent],
      name: "SharedModelOf",
      payload: [sharedModel],
      rows: sharedModels.families,
    });
    // `Symbol`'s positions by shared model and kind, for the host's step.
    const sharedAt = Map.groupBy(symbol.rows, (row) => `${row.model} ${row.kind}`);

    return {
      admitted,
      content: {
        contentModelOf: yield* closed({
          key: [version, parent],
          name: "ContentModelOf",
          payload: [model],
          rows: contentModels.families,
        }),
        counted: yield* sourced({
          key: [version, parent, position],
          name: "Counted",
          payload: [
            valueField(
              "min",
              countedRows.map(({ row }) => row.min),
            ),
            valueField(
              "max",
              countedRows.map(({ row }) => row.max),
            ),
          ],
          rows: countedRows,
        }),
        follow: yield* closed({
          key: [model, modelPosition("from"), modelPosition("to")],
          name: "Follow",
          payload: [],
          rows: contentModels.models.flatMap(({ handle, value }) =>
            value.next.flatMap((next, from) =>
              [...next].map((to) => ({ from: String(from), model: handle, to: String(to) })),
            ),
          ),
        }),
        last: yield* closed({
          key: [model, modelPosition("position")],
          name: "Last",
          payload: [],
          rows: contentModels.models.flatMap(({ handle, value }) =>
            [...value.ends].map((state) => ({ model: handle, position: String(state) })),
          ),
        }),
        modelPositions: yield* closed({
          key: [model],
          name: "ModelPositions",
          payload: [valueField("positions", modelSizes.values())],
          rows: [...modelSizes].map(([handle, size]) => ({ model: handle, positions: size })),
        }),
        models: model.roster,
        positions,
        sharedModelOf,
        sharedModelPositions: yield* closed({
          key: [sharedModel],
          name: "SharedPositions",
          payload: [valueField("positions", sharedSizes.values())],
          rows: [...sharedSizes].map(([handle, size]) => ({ model: handle, positions: size })),
        }),
        sharedModels: sharedModel.roster,
        sharedPositions: ({ kind, parent: held, version: in_ }) =>
          Option.match(sharedModelOf.lookup({ parent: held, version: in_ }), {
            onNone: () => [],
            onSome: ({ model: shared }) =>
              rowsAt(sharedAt, `${shared} ${kind}`).map((row) => Number(row.position)),
          }),
        sourceOf,
        strictlyHeld: yield* sourced({
          key: [version, parent, idField("child", input.kinds)],
          name: "StrictlyHeld",
          payload: [],
          rows: installed.flatMap((entry) =>
            admittedOf(entry).flatMap(({ child, parent: held, source, version: in_ }) =>
              entry.strictly.has(child)
                ? [{ row: { child, parent: held, version: in_ }, source }]
                : [],
            ),
          ),
        }),
        symbol,
      },
    };
  });

/**
 * Read a family's content model: `ContentModelOf`'s cell.
 *
 * @param content - The content grammar.
 * @param key - The family.
 * @param key.version - The version.
 * @param key.parent - The parent's kind.
 * @returns The model's handle, or none for a family outside the rosters.
 */
export const contentModelOf = (
  content: ContentGrammar,
  key: { readonly parent: string; readonly version: string },
): Option.Option<string> => Option.map(content.contentModelOf.lookup(key), ({ model }) => model);

/**
 * Whether a child at one position may follow one at another in a family: `Follow`'s cell under the
 * family's model.
 *
 * @param content - The content grammar.
 * @param key - The family and the two positions.
 * @param key.version - The version.
 * @param key.parent - The parent's kind.
 * @param key.from - The predecessor's position, 0 for the start.
 * @param key.to - The child's position.
 * @returns Whether `Follow` holds the pair.
 */
export const contentFollows = (
  content: ContentGrammar,
  key: {
    readonly from: string;
    readonly parent: string;
    readonly to: string;
    readonly version: string;
  },
): boolean =>
  Option.exists(contentModelOf(content, key), (model) =>
    Option.isSome(content.follow.lookup({ from: key.from, model, to: key.to })),
  );

/**
 * Where a child stands in its family's content model, read once from its `Admission` position and
 * the family's `Symbol` rows. `Admission` installs one position per (version, parent, child), 0 for
 * a kind that names no position or several; the host tells the two apart here, once.
 *
 * - `at`: the one position the child's kind names.
 * - `carries`: a kind no position names, character data, which keeps its predecessor's state.
 * - `shared`: the positions several of which name the child's kind, where the state decides.
 */
export type Placement =
  | { readonly _tag: "at"; readonly position: number }
  | { readonly _tag: "carries" }
  | { readonly _tag: "shared"; readonly positions: readonly [number, ...number[]] };

/**
 * The family and child a step reads.
 */
interface StepKey {
  readonly child: string;
  readonly parent: string;
  readonly version: SchemaVersion;
}

/**
 * Read a child's placement from its `Admission` position.
 *
 * @param content - The content grammar, whose `Symbol` rows hold a shared kind's positions.
 * @param key - The family and the child.
 * @param position - The child's `Admission` position.
 * @returns The placement.
 */
const placementAt = (content: ContentGrammar, key: StepKey, position: number): Placement => {
  if (position !== 0) {
    return { _tag: "at", position };
  }

  const shared = content.sharedPositions({
    kind: key.child,
    parent: key.parent,
    version: key.version,
  });

  return Arr.isReadonlyArrayNonEmpty(shared)
    ? { _tag: "shared", positions: shared }
    : { _tag: "carries" };
};

/**
 * Read where a child stands in its family's content model.
 *
 * @param grammar - The composed grammar's `Admission` and content grammar.
 * @param grammar.admission - `Admission`.
 * @param grammar.content - The content grammar.
 * @param key - The family and the child.
 * @returns The child's placement, or none where the parent does not admit its kind.
 */
export const placementOf = (
  grammar: { readonly admission: Admission; readonly content: ContentGrammar },
  key: StepKey,
): Option.Option<Placement> =>
  Option.map(grammar.admission.lookup(key), ({ position }) =>
    placementAt(grammar.content, key, Number(position)),
  );

/**
 * Step a family's automaton by one placed child, as `Node`'s position derives (the host's
 * evaluation of the law the database proves): an `at` child moves to its position where `Follow`
 * allows, a `shared` one to the one of its positions `Follow` allows, and a `carries` one keeps its
 * predecessor's state.
 *
 * @param content - The content grammar.
 * @param key - The family and the child.
 * @param placement - The child's placement.
 * @param was - The predecessor's state, 0 for the first child.
 * @returns The child's state, or none when no position follows.
 */
export const placedStep = (
  content: ContentGrammar,
  key: StepKey,
  placement: Placement,
  was: number,
): Option.Option<number> => {
  const model = contentModelOf(content, key);
  const follows = (to: number) =>
    Option.exists(model, (held) =>
      Option.isSome(content.follow.lookup({ from: String(was), model: held, to: String(to) })),
    );

  switch (placement._tag) {
    case "at": {
      return Option.liftPredicate(placement.position, follows);
    }
    case "carries": {
      return Option.some(was);
    }
    case "shared": {
      const next = placement.positions.filter(follows);

      return next.length === 1 ? Arr.head(next) : Option.none();
    }
    default: {
      return placement satisfies never;
    }
  }
};

/**
 * Step a family's automaton by one child: its {@link placementOf}, then {@link placedStep}.
 *
 * @param grammar - The composed grammar's `Admission` and content grammar.
 * @param grammar.admission - `Admission`.
 * @param grammar.content - The content grammar.
 * @param key - The family and the child.
 * @param was - The predecessor's state, 0 for the first child.
 * @returns The child's state, or none where the parent does not admit the kind or no position
 *   follows.
 */
export const stepOf = (
  grammar: { readonly admission: Admission; readonly content: ContentGrammar },
  key: StepKey,
  was: number,
): Option.Option<number> =>
  Option.flatMap(placementOf(grammar, key), (placement) =>
    placedStep(grammar.content, key, placement, was),
  );

/**
 * Whether a family may end in a state: `Last`'s cell under the family's model.
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
): boolean =>
  Option.exists(contentModelOf(content, { parent, version }), (model) =>
    Option.isSome(content.last.lookup({ model, position: String(state) })),
  );

/**
 * Judge a family of child kinds by the installed automaton, as the database does: each child steps
 * from its predecessor's state (0 for the first), and the last state must be one `Last` holds.
 *
 * @param grammar - The composed grammar's `Admission` and content grammar.
 * @param grammar.admission - `Admission`.
 * @param grammar.content - The content grammar.
 * @param version - The version.
 * @param parent - The parent's kind.
 * @param children - The children's kinds, in order.
 * @returns Whether the family's content is the model's.
 */
export const accepts = (
  grammar: { readonly admission: Admission; readonly content: ContentGrammar },
  version: SchemaVersion,
  parent: string,
  children: readonly string[],
): boolean => {
  let state = 0;
  for (const child of children) {
    const next = stepOf(grammar, { child, parent, version }, state);
    if (Option.isNone(next)) {
      return false;
    }

    state = next.value;
  }

  return contentEnds(grammar.content, version, parent, state);
};
