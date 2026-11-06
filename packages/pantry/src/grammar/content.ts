/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
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
import type { AdmittedChild } from "#pantry/grammar/admission.ts";
import {
  closed,
  dependentField,
  fin,
  idField,
  roster,
  sourced,
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
import {
  admitsNamespace,
  mathmlNamespace,
  namespaceClassesUnder,
} from "#pantry/vocab/namespaces.ts";
import { automatonOf } from "#pantry/vocab/sequencing.ts";
import type { Automaton } from "#pantry/vocab/sequencing.ts";

/**
 * A spec reading that edits a content model where it says more than the XSD: a particle's group
 * required; a kind admitted beside another in every particle that names it; kinds that come
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
    }
  | {
      readonly _tag: "ends";
      readonly kinds: readonly [string, ...string[]];
      readonly parent: string;
      readonly source: string;
    };

/**
 * The kinds of one namespace that are its only roots: the only kinds of that namespace a wildcard
 * admits, wherever it stands, and where it comes from (spec reading 2: MathML's one root,
 * `m:math`).
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
   * `SharedModelOf`: (version, parent) → shared model, total, {@link noSharedModel} for a family
   * whose kinds each name one position.
   */
  readonly sharedModelOf: Closed<FamilyKey, readonly [IdField<"model", string>]>;
  /**
   * `SharedPositions`: shared model → positions, each shared model's position count, its start 0
   * included, `Symbol`'s dependent size; {@link noSharedModel} has none, so no block.
   */
  readonly sharedModelPositions: Closed<
    readonly [IdField<"model", string>],
    readonly [ValueField<"positions", number>]
  >;
  /**
   * The `SharedModel` roster: {@link noSharedModel}, then every distinct shared model in the code
   * order of its first family, each named as {@link ContentGrammar.models} names a model.
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
export type ContentError =
  | AmbiguousModel
  | ClosedRelationError
  | MixedEnding
  | UncountedCap
  | UnreadEdit;

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
 *
 * One exception stands over the XSD: a MathML element of empty content also admits whitespace, as
 * MathML 3's own RelaxNG does (§2, which matches a whitespace-only text against `empty`; spec
 * reading 2, operator decision 321 (5): "MathML's own schema wins where QTI's bundled copy is
 * stricter"). {@link dataOf} applies it; every other empty kind keeps the set below.
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
 * The character data a model admits between its children: its content type's, and whitespace too
 * where the model is empty and its kind is in MathML's namespace (spec reading 2).
 *
 * @param content - The model's content type.
 * @param namespace - The namespace of the model's kind.
 * @returns The admitted kinds of character data.
 */
const dataOf = (
  content: ContentType,
  namespace: string,
): readonly (typeof characterKinds)[number][] =>
  content._tag === "empty" && namespace === mathmlNamespace
    ? ["ws", "comment", "pi"]
    : characterData[content._tag];

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

  const ends = (number: number): boolean =>
    automaton.positions.some(
      ({ number: at, symbol }) =>
        at === number &&
        symbol._tag === "kinds" &&
        endings.every(({ kinds }) => symbol.kinds.every((held) => kinds.includes(held))),
    );

  return Result.succeed({
    ...automaton,
    last: new Set([...automaton.last].filter(ends)),
    nullable: false,
  });
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
  /**
   * The positions the readings cap at one child.
   */
  readonly caps: readonly Cap[];
  readonly data: readonly string[];
  readonly parent: string;
  /**
   * The model's source in its version, and each position's, position n at index n.
   */
  readonly sources: readonly [Source, ...Source[]];
  /**
   * The foreign kinds only `strict` wildcards of the model admit.
   */
  readonly strictly: readonly string[];
  readonly symbols: ReadonlyMap<string, readonly number[]>;
  readonly version: SchemaVersion;
}

/**
 * The handle of the shared model no shared kind is in: `SharedModelOf`'s value for a family whose
 * kinds each name one position.
 */
export const noSharedModel = "none";

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
}): readonly { readonly parent: string; readonly version: SchemaVersion }[] =>
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
    String(automaton.positions.length + 1),
    [
      ...[...automaton.first].map((to) => `0>${String(to)}`),
      ...automaton.follow.flatMap((next, index) =>
        [...next].map((to) => `${String(index + 1)}>${String(to)}`),
      ),
    ]
      .toSorted()
      .join(" "),
    [...(automaton.nullable ? [0] : []), ...automaton.last].map(String).toSorted().join(" "),
  ].join("|");

/**
 * Models read off the families they hold: each model with its handle and its first family's
 * value, in first-family order, and the handle of each family a model holds, by
 * `<version> <parent>`.
 */
interface Models<V> {
  readonly handles: readonly string[];
  readonly models: readonly { readonly handle: string; readonly value: V }[];
  readonly of: ReadonlyMap<string, string>;
}

/**
 * Read the (version, parent) families as models: two families are one model exactly when their
 * signatures are equal (rule 0: identical facts are one fact), and the model states its first
 * family's rows, which every family of it states alike. A model is named by its first family's
 * parent kind, or by `<version> <parent>` where an earlier model took that name, so every handle is
 * a kind's or a family's and at most 63 bytes.
 *
 * @param rosters - The versions and the kinds, whose product the families are.
 * @param rosters.versions - The `SchemaVersion` roster.
 * @param rosters.kinds - The `NodeKind` roster.
 * @param read - A family's signature and the value its model states, none for a family no model
 *   holds; read once per family, by `<version> <parent>`.
 * @returns The models and each family's, families read in (version, parent) code order.
 */
const modelsOf = <V>(
  rosters: { readonly kinds: Roster<string>; readonly versions: Roster<SchemaVersion> },
  read: (family: string) => Option.Option<{ readonly signature: string; readonly value: V }>,
): Models<V> => {
  const models: { readonly handle: string; readonly value: V }[] = [];
  const bySignature = new Map<string, string>();
  const named = new Set<string>();
  const of = new Map<string, string>();
  for (const { parent, version } of familiesOf(rosters)) {
    const family = `${version} ${parent}`;
    for (const { signature, value } of Option.toArray(read(family))) {
      const known = bySignature.get(signature);
      const handle = known ?? (named.has(parent) ? family : parent);
      if (known === undefined) {
        bySignature.set(signature, handle);
        named.add(handle);
        models.push({ handle, value });
      }

      of.set(family, handle);
    }
  }

  return { handles: models.map(({ handle }) => handle), models, of };
};

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
 * @returns The content grammar and the admitted triples with their positions, or the first model or
 *   reading that has none.
 */
export const contentOf = (input: {
  readonly facets: readonly ContentFacet[];
  readonly foreignRoots: ReadonlySet<string>;
  readonly globalKinds: (version: SchemaVersion, parent: string) => readonly string[];
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
    const rootsOf: ReadonlyMap<string, ReadonlySet<string>> = new Map(
      input.facets
        .flatMap((facet) => facet.roots)
        .map(({ kinds, namespace }) => [namespace, new Set<string>(kinds)] as const),
    );
    const installed: Installed[] = [];
    const used = new Set<ModelEdit>();
    for (const model of [...input.models, ...input.facets.flatMap((facet) => facet.models)]) {
      const { content } = model;
      const own = input.namespaceOf(model.kind);
      const data = dataOf(content, own);
      const particle: Option.Option<Particle> =
        content._tag === "element-only" || content._tag === "mixed"
          ? Option.some(editedBy(content.particle, edits, model.kind, used))
          : Option.none();
      const automaton = yield* endedBy(
        Option.match(particle, {
          onNone: () => noAutomaton,
          onSome: (held) => automatonOf(held, input.namespaceOf, own),
        }),
        edits,
        model.kind,
      );
      if (automaton.ambiguous.length > 0) {
        return yield* Result.fail(
          new AmbiguousModel({ kind: model.kind, versions: model.versions.join(" and ") }),
        );
      }

      const caps = yield* cappedBy(automaton, edits, model.kind);

      for (const version of model.versions) {
        const named = new Set(
          automaton.positions.flatMap(({ symbol }) =>
            symbol._tag === "kinds" ? symbol.kinds : [],
          ),
        );
        const symbols = new Map<string, number[]>();
        // The processing of each wildcard position that admits a foreign kind.
        const processings = new Map<string, string[]>();
        const hold = (kind: string, processing: string) => {
          processings.set(kind, [...(processings.get(kind) ?? []), processing]);
        };
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
              for (const kind of input.globalKinds(version, model.kind)) {
                if (
                  !named.has(kind) &&
                  !input.foreignRoots.has(kind) &&
                  (rootsOf.get(input.namespaceOf(kind))?.has(kind) ?? true) &&
                  admitsNamespace(symbol.namespace, own, input.namespaceOf(kind))
                ) {
                  admit(kind, number);
                }
              }
            }

            // An element no declaration names is its namespace class's foreign kind, and the
            // wildcard admits the classes its constraint does (§3.10.1). Under `strict` such an
            // element stands only with an `xsi:type` its document's schema set can resolve
            // (§3.3.4, clause 1.2; spec reading 81), which `StrictlyHeld` marks for the reader.
            for (const namespaceClass of namespaceClassesUnder[symbol.namespace]) {
              admit(foreignKinds[namespaceClass], number);
              hold(foreignKinds[namespaceClass], symbol.processing);
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
          caps,
          data,
          parent: model.kind,
          sources: [
            inVersion(model.sources),
            ...automaton.positions.map((held) => inVersion(held.sources)),
          ],
          strictly: [...processings].flatMap(([kind, held]) =>
            held.every((processing) => processing === "strict") ? [kind] : [],
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
              case "cap":
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
    const byFamily = new Map<string, Installed>(
      installed.map((entry) => [`${entry.version} ${entry.parent}`, entry]),
    );
    const sizes = new Map(
      installed.map(({ automaton, parent: held, version: in_ }) => [
        `${in_} ${held}`,
        automaton.positions.length + 1,
      ]),
    );
    // A family's positions are 0, its start, then its model's own: the dependent sum Σ (P + 1).
    const sizeOf = (prefix: Readonly<Record<string, string>>) => sizes.get(familyOf(prefix)) ?? 1;
    const position = dependentField("position", positions, sizeOf);
    // Each family's kinds that several positions of its model name, with those positions.
    const sharedOf = (entry: Installed) =>
      [...entry.symbols].flatMap(([kind, numbers]) => {
        const distinct = [...new Set(numbers)].toSorted((left, right) => left - right);

        return distinct.length > 1 ? [{ kind, numbers: distinct }] : [];
      });
    // The models, read once per family in (version, parent) code order: a family's automaton is its
    // model's whenever an earlier family's has the same positions, `Follow` and `Last`. A model's
    // versions share its automaton, so each is signed once.
    const signatures = new Map<Automaton, string>();
    const signed = (automaton: Automaton): string => {
      const known = signatures.get(automaton) ?? signatureOf(automaton);
      signatures.set(automaton, known);

      return known;
    };
    const contentModels = modelsOf(input, (held) =>
      Option.some(
        Option.match(Option.fromNullishOr(byFamily.get(held)), {
          // The family of no model: one position, which nothing follows and nothing ends at.
          onNone: () => ({ signature: "1||", value: undefined }),
          onSome: (entry) => ({ signature: signed(entry.automaton), value: entry.automaton }),
        }),
      ),
    );
    const sharedModels = modelsOf(input, (held) =>
      Option.flatMap(Option.fromNullishOr(byFamily.get(held)), (entry) => {
        const shared = sharedOf(entry);

        return shared.length === 0
          ? Option.none()
          : Option.some({
              signature: [
                entry.parent,
                String(entry.automaton.positions.length + 1),
                ...shared
                  .flatMap(({ kind, numbers }) => numbers.map((number) => `${kind}:${number}`))
                  .toSorted(),
              ].join(" "),
              value: { positions: entry.automaton.positions.length + 1, shared },
            });
      }),
    );
    const model = idField("model", yield* roster("ContentModel", contentModels.handles));
    const sharedModel = idField(
      "model",
      yield* roster("SharedModel", [noSharedModel, ...sharedModels.handles]),
    );
    const modelSizes = new Map(
      contentModels.models.map(({ handle, value }) => [
        handle,
        value === undefined ? 1 : value.positions.length + 1,
      ]),
    );
    const sharedSizes = new Map(
      sharedModels.models.map(({ handle, value }) => [handle, value.positions]),
    );
    const modelPosition = <const Name extends string>(name: Name) =>
      dependentField(name, positions, (prefix) => modelSizes.get(prefix["model"] ?? "") ?? 0);
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
    // A bound of 2…n the automaton relaxes is the particle's; a cap is its reading's, at most one
    // child where the model's enclosing group repeats the particle.
    const countedRows = installed.flatMap(({ automaton, caps, parent: held, version: in_ }) => [
      ...automaton.positions.flatMap(({ number, occurs }) => {
        const max = Option.getOrElse(occurs.max, () => Number.POSITIVE_INFINITY);

        return occurs.min >= 2 || (max >= 2 && Number.isFinite(max))
          ? [{ max, min: occurs.min, parent: held, position: String(number), version: in_ }]
          : [];
      }),
      ...caps.map(({ position: at }) => ({
        max: 1,
        min: 0,
        parent: held,
        position: String(at),
        version: in_,
      })),
    ]);
    const capSources = new Map(
      installed.flatMap(({ caps, parent: held, version: in_ }) =>
        caps.map(
          ({ position: at, source }) =>
            [`${in_} ${held} ${String(at)}`, { _tag: "spec", cite: source } as const] as const,
        ),
      ),
    );
    const sourceOf = (key: {
      readonly parent: string;
      readonly position: string;
      readonly version: SchemaVersion;
    }): Option.Option<Source> =>
      Option.fromNullishOr(
        byFamily.get(`${key.version} ${key.parent}`)?.sources[Number(key.position)],
      );
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
    const symbol = yield* closed({
      key: [
        sharedModel,
        idField("kind", input.kinds),
        dependentField(
          "position",
          positions,
          (prefix) => sharedSizes.get(prefix["model"] ?? "") ?? 0,
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
      rows: familiesOf(input).map((held) => ({
        ...held,
        model: sharedModels.of.get(`${held.version} ${held.parent}`) ?? noSharedModel,
      })),
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
          rows: familiesOf(input).map((held) => ({
            ...held,
            model: contentModels.of.get(`${held.version} ${held.parent}`) ?? "",
          })),
        }),
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
          (row) => capSources.get(`${row.version} ${row.parent} ${row.position}`) ?? sourceAt(row),
        ),
        follow: yield* closed({
          key: [model, modelPosition("from"), modelPosition("to")],
          name: "Follow",
          payload: [],
          rows: contentModels.models.flatMap(({ handle, value }) =>
            value === undefined
              ? []
              : [
                  ...[...value.first].map((to) => ({ from: "0", model: handle, to: String(to) })),
                  ...value.follow.flatMap((next, index) =>
                    [...next].map((to) => ({
                      from: String(index + 1),
                      model: handle,
                      to: String(to),
                    })),
                  ),
                ],
          ),
        }),
        last: yield* closed({
          key: [model, modelPosition("position")],
          name: "Last",
          payload: [],
          rows: contentModels.models.flatMap(({ handle, value }) =>
            value === undefined
              ? []
              : [
                  ...(value.nullable ? [{ model: handle, position: "0" }] : []),
                  ...[...value.last].map((number) => ({
                    model: handle,
                    position: String(number),
                  })),
                ],
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
              (sharedAt.get(`${shared} ${kind}`) ?? []).map((row) => Number(row.position)),
          }),
        sourceOf,
        strictlyHeld: sourced(
          yield* closed({
            key: [version, parent, idField("child", input.kinds)],
            name: "StrictlyHeld",
            payload: [],
            rows: installed.flatMap(({ parent: held, strictly, version: in_ }) =>
              strictly.map((child) => ({ child, parent: held, version: in_ })),
            ),
          }),
          ({ child, parent: held, version: in_ }) =>
            sourceAt({
              parent: held,
              position: String(
                admitted.find(
                  (row) => row.version === in_ && row.parent === held && row.child === child,
                )?.position ?? 0,
              ),
              version: in_,
            }),
        ),
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
  const model = contentModelOf(content, key);
  const follows = (to: number) =>
    Option.exists(model, (held) =>
      Option.isSome(content.follow.lookup({ from: String(was), model: held, to: String(to) })),
    );

  return Option.flatMap(positionOf(key), (position) => {
    if (position !== 0) {
      return Option.liftPredicate(position, follows);
    }

    const shared = content.sharedPositions({
      kind: key.child,
      parent: key.parent,
      version: key.version,
    });
    if (shared.length === 0) {
      return Option.some(was);
    }

    const next = shared.filter(follows);

    return next.length === 1 ? Arr.head(next) : Option.none();
  });
};

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
