/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * The child-set laws: what the children of a parent must and must not hold, as closed relations
 * over per-parent positions (fin.md §16, ruling D8), and the map from each of the old schema's 56
 * `capacity` uses to the statement that replaces it (fin.md §6).
 *
 * A node folds its children into two sets over its own positions: `childKinds`, the positions at
 * least one child holds, and `childTwos`, the positions two or more children hold, by B2's
 * saturating fold `twos = twos | (kinds & x)` before `kinds = kinds | x`. The laws read those two
 * sets against the rows of the node's (version, kind):
 *
 * - `subset(ChildRequired[v, kind], childKinds)`: every required position is held;
 * - For each slot s, `ChildAnyOf[v, kind, s] = ∅ ∨ intersects(childKinds, ChildAnyOf[v, kind, s])`. A
 *   parent with fewer slots than the widest reads an empty mask at the rest, which must hold;
 * - For each slot s, `bitCount(childKinds & ChildExclusive[v, kind, s]) <= 1`;
 * - `disjoint(childTwos, ChildAtMostOnce[v, kind])`;
 * - `ChildBarredBy[v, kind]`, a (name, position) cell: the position is not held while `attrs` holds
 *   the name.
 *
 * A position is a class of child kinds that every law of the parent treats alike: the atoms of the
 * Boolean algebra the parent's member sets generate, numbered from 1 in the code order of their
 * first kind. Position 0 holds every admitted kind no law reads, so `ChildPosition` is total over
 * the admitted triples and no fold reads an absent cell. A union a law counts as one, such as
 * `(object | img | picture)`, is then one position, and "exactly one of them" is one required bit
 * and one at-most-once bit, with no count. Sets stay `bit(positions)` wide, 7 bits at today's
 * vocabularies, where a set over every kind would be `bit(K)`.
 *
 * The statements port today's rules exactly: the guards `union-count`, `body-empty` and `P28`, the
 * content-model `capacity` uses, and the two R30 asserts the old schema held as keys. Deriving the
 * XSD's occurrence bounds, which the inventory flattens past its choice groups, is a later
 * extension, as ruling D3 settles for `Order`.
 */
import { Option, Result, Schema } from "effect";
import { closed } from "#pantry/grammar/closed.ts";
import type { Closed, ClosedRelationError, Field } from "#pantry/grammar/closed.ts";
import type { AdmissionRow, SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";

/**
 * One or more kind handles.
 */
export type Kinds = readonly [string, ...string[]];

/**
 * The child kinds a law counts over: named kinds, or every element the parent admits in the law's
 * version.
 */
export type Members = { readonly of: "elements" } | { readonly kinds: Kinds; readonly of: "kinds" };

/**
 * A law over the children of one parent.
 *
 * - `atLeastOne`, `atMostOne`, `exactlyOne`: the count of children whose kind is a member, over the
 *   members as one union.
 * - `exclusive`: the children's kinds come from at most one alternative, as `(tbody* | tr+)`.
 * - `barredBy`: no child of the kinds while the parent carries the attribute `name`.
 */
export type ChildLaw =
  | { readonly law: "atLeastOne"; readonly members: Members }
  | { readonly law: "atMostOne"; readonly members: Members }
  | { readonly law: "exactlyOne"; readonly members: Members }
  | { readonly alternatives: readonly [Kinds, Kinds, ...Kinds[]]; readonly law: "exclusive" }
  | { readonly kinds: Kinds; readonly law: "barredBy"; readonly name: string };

/**
 * A law stated once for the parents and the schema versions it holds in.
 */
export interface ChildRule {
  readonly law: ChildLaw;
  readonly parents: Kinds;
  readonly versions: readonly [SchemaVersionHandle, ...SchemaVersionHandle[]];
}

/**
 * A rule with the rule of today's model it ports: a guard's rule name, or a {@link CapacityUse}'s
 * `id`.
 */
export interface ChildStatement extends ChildRule {
  readonly source: string;
}

/**
 * What a `capacity` use becomes. A set law is a rule of this module. Every other use names the
 * relation that owns its replacement and that statement, in fin.md's notation: `key` for at most
 * one, `containment` for at least one, both for exactly one, and a counted family for a bound
 * read from another field (§6).
 */
export type Replacement =
  | { readonly as: "set law"; readonly rules: readonly ChildRule[] }
  | {
      readonly as: "containment" | "counted family" | "key" | "key and containment";
      readonly law: string;
      readonly owner: string;
    };

/**
 * One `capacity` use of the old schema, as written, and what replaces it.
 *
 * `id` is the module under `src/schema/` and the use's place among that module's uses, from 1.
 * `target` and `from` are its two sides as `Relation.field`, a selection written
 * `Relation[field = value].field`; `bound` is its range as `low..high`, `*` unbounded and a field's
 * name for a bound read from that field, or the bound's expression as written.
 */
export interface CapacityUse {
  readonly becomes: Replacement;
  readonly bound: string;
  readonly from: string;
  readonly id: string;
  readonly target: string;
}

/**
 * The parts of a vocabulary the generator reads: its admission rows, and the registry whose empty
 * local names mark the kinds that are not elements.
 */
export interface Vocabulary {
  readonly admission: readonly AdmissionRow[];
  readonly registry: Readonly<Record<string, { readonly local: string }>>;
}

/**
 * What the generator runs over: the rosters whose codes its key fields carry, in code order, the
 * vocabularies, and the statements.
 */
export interface ChildSetsInput {
  readonly attributes: readonly string[];
  readonly kinds: readonly string[];
  readonly statements: readonly ChildStatement[];
  readonly versions: readonly SchemaVersionHandle[];
  readonly vocabularies: readonly Vocabulary[];
}

/**
 * A position the parent's children must not hold while the parent carries the attribute `name`.
 */
export interface Barring {
  readonly name: string;
  readonly position: number;
}

/**
 * The child-set laws of one (version, parent) as positions, for the host's folds and judgments.
 *
 * `positions` maps every child kind the parent admits in the version to its position, 0 for a kind
 * no law reads. A parent with no law admits its children at position 0 and reads nothing.
 */
export interface ParentLaws {
  readonly anyOf: readonly ReadonlySet<number>[];
  readonly atMostOnce: ReadonlySet<number>;
  readonly barredBy: Option.Option<Barring>;
  readonly exclusive: readonly ReadonlySet<number>[];
  readonly positions: ReadonlyMap<string, number>;
  readonly required: ReadonlySet<number>;
}

/**
 * The version field of every child-set relation's key.
 */
type VersionField = Field<"version", SchemaVersionHandle>;

/**
 * A field over the `NodeKind` roster.
 */
type KindField<Name extends string> = Field<Name, string>;

/**
 * A field over a parent's positions, 0 to `positions` − 1.
 */
type PositionField = Field<"position", number>;

/**
 * A field over a parent's slots of one law, 0 to the widest parent's count − 1.
 */
type SlotField = Field<"slot", number>;

/**
 * The key of a set of positions per (version, parent).
 */
type MaskKey = readonly [VersionField, KindField<"parent">, PositionField];

/**
 * The key of a set of positions per (version, parent, slot).
 */
type SlotMaskKey = readonly [VersionField, KindField<"parent">, SlotField, PositionField];

/**
 * The child-set relations of a vocabulary list, and the host's view of them.
 *
 * Each relation is a closed relation for `install.ts` to declare; the sets are read as a prefix's
 * completions, `bit(positions)` slices.
 */
export interface ChildSets {
  readonly anyOf: Closed<SlotMaskKey, readonly []>;
  readonly atMostOnce: Closed<MaskKey, readonly []>;
  readonly barredBy: Closed<
    readonly [VersionField, KindField<"parent">],
    readonly [Field<"name", string>, PositionField]
  >;
  readonly exclusive: Closed<SlotMaskKey, readonly []>;
  /**
   * Read the laws of one parent in one version.
   *
   * @param version - The schema version.
   * @param parent - The parent's kind handle.
   * @returns Its positions and masks; no positions and no masks for a kind that admits no child.
   */
  readonly lawsOf: (version: SchemaVersionHandle, parent: string) => ParentLaws;
  /**
   * `ChildPosition`: (version, parent, child) → position, for every admitted triple. A child's set
   * step is the singleton of its cell.
   */
  readonly position: Closed<
    readonly [VersionField, KindField<"parent">, KindField<"child">],
    readonly [PositionField]
  >;
  /**
   * The width of every child set, `childKinds`, `childTwos` and their folds: one bit per position,
   * position 0 included.
   */
  readonly positions: number;
  readonly required: Closed<MaskKey, readonly []>;
}

/**
 * A statement names a child its parent does not admit in that version.
 */
export class UnadmittedChild extends Schema.TaggedError<UnadmittedChild>()("UnadmittedChild", {
  child: Schema.String,
  parent: Schema.String,
  source: Schema.String,
  version: Schema.String,
}) {
  /**
   * The statement, the child, the parent and version, and the repair.
   */
  override get message(): string {
    return `The child-set law ported from ${this.source} names ${this.child} under ${this.parent} in ${this.version}, which ${this.parent} does not admit there, so the law states nothing about it. Correct the kind, or drop ${this.version} from the law's versions.`;
  }
}

/**
 * A statement counts the element children of a parent that admits no element.
 */
export class NoElementChild extends Schema.TaggedError<NoElementChild>()("NoElementChild", {
  parent: Schema.String,
  source: Schema.String,
  version: Schema.String,
}) {
  /**
   * The statement, the parent and version, and the repair.
   */
  override get message(): string {
    return `The child-set law ported from ${this.source} counts the element children of ${this.parent} in ${this.version}, and ${this.parent} admits no element there. State the law over the kinds ${this.parent} admits, or drop ${this.version} from its versions.`;
  }
}

/**
 * A set a law reads as one bit spans several positions, because another law of the parent tells
 * its kinds apart.
 */
export class SplitMembers extends Schema.TaggedError<SplitMembers>()("SplitMembers", {
  kinds: Schema.String,
  parent: Schema.String,
  source: Schema.String,
  version: Schema.String,
}) {
  /**
   * The statement, the set, the parent and version, and the repair.
   */
  override get message(): string {
    return `The child-set law ported from ${this.source} reads ${this.kinds} under ${this.parent} in ${this.version} as one position, but another law of ${this.parent} tells those kinds apart, so they hold several positions and one bit cannot stand for them. State each alternative or barred set so that no other law of ${this.parent} splits it.`;
  }
}

/**
 * The ways a list of statements has no child-set relations.
 */
export type ChildSetsError = ClosedRelationError | NoElementChild | SplitMembers | UnadmittedChild;

/**
 * The two schema versions, for the rules that hold in both.
 */
const everyVersion = ["3.0.0", "3.0.1"] as const satisfies ChildRule["versions"];

/**
 * Construct a law over named kinds: their union counted at least once, at most once, or exactly
 * once.
 *
 * @param law - The count.
 * @param kinds - The union's kinds.
 * @returns The law.
 */
const count = (law: "atLeastOne" | "atMostOne" | "exactlyOne", kinds: Kinds): ChildLaw => ({
  law,
  members: { kinds, of: "kinds" },
});

/**
 * Construct a rule that holds in both versions.
 *
 * @param parents - The parents it holds under.
 * @param law - The law.
 * @returns The rule.
 */
const always = (parents: Kinds, law: ChildLaw): ChildRule => ({
  law,
  parents,
  versions: everyVersion,
});

/**
 * Construct a rule that holds in one version.
 *
 * @param version - The version.
 * @param parents - The parents it holds under.
 * @param law - The law.
 * @returns The rule.
 */
const onlyIn = (version: SchemaVersionHandle, parents: Kinds, law: ChildLaw): ChildRule => ({
  law,
  parents,
  versions: [version],
});

/**
 * Construct the replacement of a use that becomes rules of this module.
 *
 * @param rules - The rules.
 * @returns The replacement.
 */
const setLaw = (...rules: readonly ChildRule[]): Replacement => ({ as: "set law", rules });

/**
 * Construct the replacement of a use that another relation's statement owns.
 *
 * @param as - The statement's form.
 * @param owner - The relation that owns it.
 * @param law - The statement.
 * @returns The replacement.
 */
const ownedBy = (
  as: "containment" | "counted family" | "key" | "key and containment",
  owner: string,
  law: string,
): Replacement => ({ as, law, owner });

/**
 * The at-most-once asserts of the LOM loose binding's Schematron (R30) that the old schema held as
 * `capacity` uses: asserts 1 to 94 but 36 and 57, 80 distinct (parent, child) pairs, by parent in
 * assert order. A dotted handle is the child's kind in that context (`duration` under a
 * `Duration.Type` container, `source` and `entry` under `taxonPath` and `taxon`).
 *
 * Assert 92 caps `duration` under `lom:technical`, where the element is the `Duration.Type`
 * container `lom:duration` itself. The old schema capped `lom:duration.string` there, a kind
 * `lom:technical` never admits, so its cap could not fire; the generator refuses that spelling.
 */
const r30: readonly (readonly [parent: string, children: Kinds])[] = [
  ["lom:aggregationLevel", ["lom:source", "lom:value"]],
  ["lom:annotation", ["lom:entity", "lom:date", "lom:description"]],
  ["lom:classification", ["lom:purpose", "lom:description"]],
  ["lom:context", ["lom:source", "lom:value"]],
  ["lom:contribute", ["lom:role", "lom:date"]],
  ["lom:copyrightAndOtherRestrictions", ["lom:source", "lom:value"]],
  ["lom:cost", ["lom:source", "lom:value"]],
  ["lom:date", ["lom:dateTime", "lom:description"]],
  ["lom:difficulty", ["lom:source", "lom:value"]],
  ["lom:typicalLearningTime", ["lom:duration.string", "lom:description"]],
  ["lom:duration", ["lom:duration.string", "lom:description"]],
  [
    "lom:educational",
    [
      "lom:interactivityType",
      "lom:interactivityLevel",
      "lom:semanticDensity",
      "lom:difficulty",
      "lom:typicalLearningTime",
      "lom:description",
    ],
  ],
  ["lom:general", ["lom:structure", "lom:aggregationLevel"]],
  ["lom:identifier", ["lom:catalog", "lom:entry"]],
  ["lom:intendedEndUserRole", ["lom:source", "lom:value"]],
  ["lom:interactivityLevel", ["lom:source", "lom:value"]],
  ["lom:interactivityType", ["lom:source", "lom:value"]],
  ["lom:kind", ["lom:source", "lom:value"]],
  ["lom:learningResourceType", ["lom:source", "lom:value"]],
  ["lom:lifeCycle", ["lom:version", "lom:status"]],
  ["lom:lom", ["lom:lifeCycle", "lom:metaMetadata", "lom:technical", "lom:rights"]],
  ["lom:metaMetadata", ["lom:language"]],
  ["lom:name", ["lom:source", "lom:value"]],
  ["lom:orComposite", ["lom:type", "lom:name", "lom:minimumVersion", "lom:maximumVersion"]],
  ["lom:purpose", ["lom:source", "lom:value"]],
  ["lom:relation", ["lom:kind", "lom:resource"]],
  ["lom:rights", ["lom:cost", "lom:copyrightAndOtherRestrictions", "lom:description"]],
  ["lom:role", ["lom:source", "lom:value"]],
  ["lom:semanticDensity", ["lom:source", "lom:value"]],
  ["lom:status", ["lom:source", "lom:value"]],
  ["lom:structure", ["lom:source", "lom:value"]],
  ["lom:taxon", ["lom:id", "lom:entry.langString"]],
  ["lom:taxonPath", ["lom:source.langString"]],
  [
    "lom:technical",
    ["lom:size", "lom:installationRemarks", "lom:otherPlatformRequirements", "lom:duration"],
  ],
  ["lom:type", ["lom:source", "lom:value"]],
];

/**
 * The law that a `coords` attribute stands for the old `Coords` row a shaped element holds: one
 * attribute row, by the attribute family's distinct names, which `Coords` requires wherever the
 * shape is not `default`.
 */
const coordsRequired =
  "coords is one Attribute row of the element (AL2's distinct names); contained(on(select(Coords, c ⇒ c.ne(c.shape, default)), node), on(select(Attribute, a ⇒ a.eq(a.name, coords)), node))";

/**
 * The law that a choice-counting interaction's bound reads: its choices as a counted family over
 * the interaction, bounded by the interaction's own count field.
 */
const choiceBounds = (field: string): string =>
  `counted(on(Choice, interaction), fin(Interaction, choices)); check(Interaction, i ⇒ i.or(i.eq(i.maxBound, unbounded), i.le(i.${field}, i.choices)))`;

/**
 * The law that an expression's operand count reads: its element children, the end value of its
 * node's element fold, between the arity `OperatorArity` derives.
 */
const operatorArity =
  "check(Expression, e ⇒ e.and(e.le(e.min, e.elementChildren), e.le(e.elementChildren, e.max))), min and max derived from OperatorArity[kind]";

/**
 * Every `capacity` use of the old schema, in module order and, within a module, in source order,
 * with what replaces it.
 *
 * Thirty-one become rules of this module. The rest move to the relation that already holds the
 * fields they read: an attribute the uniform attribute family keys and requires (AL1 to AL3), an
 * overlay's key or containment, or a counted family whose bound is another field, the ref-bounded
 * uses of fin.md §6.
 */
export const capacityMap: readonly CapacityUse[] = [
  {
    becomes: ownedBy(
      "key and containment",
      "Attribute",
      "dir is one Attribute row of a bdo (AL2's distinct names); Required holds (bdo, dir) in both versions (AL3, subset(required, attrs))",
    ),
    bound: "1..1",
    from: "NodeDir.node",
    id: "attributes.ts#1",
    target: "Node[kind = bdo].id",
  },
  {
    becomes: setLaw(
      always(["cp:metadata.manifest"], count("atMostOne", ["csmd:curriculumStandardsMetadataSet"])),
    ),
    bound: "0..1",
    from: "CsmSet.host",
    id: "csm.ts#1",
    target: "Node[kind = cp:metadata.manifest].id",
  },
  {
    becomes: setLaw(
      always(["cp:metadata.resource"], count("atMostOne", ["csmd:curriculumStandardsMetadataSet"])),
    ),
    bound: "0..1",
    from: "CsmSet.host",
    id: "csm.ts#2",
    target: "Node[kind = cp:metadata.resource].id",
  },
  {
    becomes: setLaw(
      always(
        ["csmd:curriculumStandardsMetadataSet"],
        count("atLeastOne", ["csmd:curriculumStandardsMetadata"]),
      ),
    ),
    bound: "1..*",
    from: "CsmMetadata.set",
    id: "csm.ts#3",
    target: "CsmSet.id",
  },
  {
    becomes: setLaw(
      always(["csmd:curriculumStandardsMetadata"], count("atLeastOne", ["csmd:setOfGUIDs"])),
    ),
    bound: "1..*",
    from: "CsmSetOfGuids.metadata",
    id: "csm.ts#4",
    target: "CsmMetadata.id",
  },
  {
    becomes: setLaw(always(["csmd:setOfGUIDs"], count("atLeastOne", ["csmd:labelledGUID"]))),
    bound: "1..*",
    from: "CsmLabelledGuid.setOfGuids",
    id: "csm.ts#5",
    target: "CsmSetOfGuids.id",
  },
  {
    becomes: setLaw(always(["csmd:labelledGUID"], count("exactlyOne", ["csmd:GUID"]))),
    bound: "1..1",
    from: "CsmGuid.labelledGuid",
    id: "csm.ts#6",
    target: "CsmLabelledGuid.id",
  },
  {
    becomes: ownedBy(
      "key and containment",
      "Attribute",
      "a root element's identifier is one Attribute row (AL2), which Required holds for the item, outcomes, section, stimulus and test roots (AL3); the other roots' 0..0 forbade an overlay copy, and no overlay copies it",
    ),
    bound: "count(identified,handle)",
    from: "DocumentIdentifier.document",
    id: "document.ts#1",
    target: "Document[root = handle].id",
  },
  {
    becomes: ownedBy(
      "key and containment",
      "Attribute",
      "a root element's title is one Attribute row (AL2), which Required holds for the item, section, stimulus and test roots (AL3); the other roots' 0..0 forbade an overlay copy, and no overlay copies it",
    ),
    bound: "count(titled,handle)",
    from: "DocumentTitle.document",
    id: "document.ts#2",
    target: "Document[root = handle].id",
  },
  {
    becomes: ownedBy(
      "key and containment",
      "Attribute",
      "figures is one Attribute row (AL2) whose lexical form, an integer or a {name} reference, is the record of its value relation, bound to the row both ways (§1.5); VariableRef reads a reference",
    ),
    bound: "1..1",
    from: "EqualRoundedFiguresRef.node",
    id: "expression-attributes.ts#1",
    target: "EqualRounded[figuresKind = ref].id",
  },
  {
    becomes: ownedBy(
      "key and containment",
      "Attribute",
      "figures is one Attribute row (AL2) whose lexical form, an integer or a {name} reference, is the record of its value relation, bound to the row both ways (§1.5); VariableRef reads a reference",
    ),
    bound: "1..1",
    from: "RoundToFiguresRef.node",
    id: "expression-attributes.ts#2",
    target: "RoundTo[figuresKind = ref].id",
  },
  {
    becomes: ownedBy(
      "key and containment",
      "Attribute",
      "n is one Attribute row (AL2) whose lexical form, an integer or a {name} reference, is the record of its value relation, bound to the row both ways (§1.5); VariableRef reads a reference",
    ),
    bound: "1..1",
    from: "IndexNRef.node",
    id: "expression-attributes.ts#3",
    target: "Index[nKind = ref].id",
  },
  {
    becomes: ownedBy(
      "key and containment",
      "Attribute",
      "number-repeats is one Attribute row (AL2) whose lexical form, an integer or a {name} reference, is the record of its value relation, bound to the row both ways (§1.5); VariableRef reads a reference",
    ),
    bound: "1..1",
    from: "RepeatNumberRepeatsRef.node",
    id: "expression-attributes.ts#4",
    target: "Repeat[numberRepeatsKind = ref].id",
  },
  {
    becomes: setLaw(
      onlyIn("3.0.1", ["qti-modal-feedback"], count("exactlyOne", ["qti-content-body.modal"])),
    ),
    bound: "1..1",
    from: "Edge[childKind = qti-content-body.modal].parent",
    id: "feedback.ts#1",
    target: "ModalFeedback[version = 3.0.1].id",
  },
  {
    becomes: setLaw(
      onlyIn("3.0.0", ["qti-modal-feedback"], count("atMostOne", ["qti-content-body.modal"])),
    ),
    bound: "0..1",
    from: "Edge[childKind = qti-content-body.modal].parent",
    id: "feedback.ts#2",
    target: "ModalFeedback[version = 3.0.0].id",
  },
  {
    becomes: setLaw(always(["picture"], count("exactlyOne", ["img"]))),
    bound: "1..1",
    from: "node.Edge[childKind = img].parent",
    id: "html/media.ts#1",
    target: "Picture.id",
  },
  {
    becomes: setLaw(always(["picture"], count("atLeastOne", ["source"]))),
    bound: "1..*",
    from: "node.Edge[childKind = source].parent",
    id: "html/media.ts#2",
    target: "Picture.id",
  },
  {
    becomes: setLaw(always(["table"], count("atMostOne", ["caption"]))),
    bound: "0..1",
    from: "node.Edge[childKind = caption].parent",
    id: "html/structure.ts#1",
    target: "Table.id",
  },
  {
    becomes: setLaw(always(["table"], count("atMostOne", ["thead"]))),
    bound: "0..1",
    from: "node.Edge[childKind = thead].parent",
    id: "html/structure.ts#2",
    target: "Table.id",
  },
  {
    becomes: setLaw(always(["table"], count("atMostOne", ["tfoot"]))),
    bound: "0..1",
    from: "node.Edge[childKind = tfoot].parent",
    id: "html/structure.ts#3",
    target: "Table.id",
  },
  {
    becomes: setLaw(always(["details"], count("exactlyOne", ["summary"]))),
    bound: "1..1",
    from: "node.Edge[childKind = summary].parent",
    id: "html/structure.ts#4",
    target: "Details.id",
  },
  {
    becomes: setLaw(always(["colgroup"], { kinds: ["col"], law: "barredBy", name: "span" })),
    bound: "0..0",
    from: "node.Edge[childKind = col].parent",
    id: "html/structure.ts#5",
    target: "ColgroupSpan.node",
  },
  {
    becomes: setLaw(always(["qti-choice-interaction"], count("atLeastOne", ["qti-simple-choice"]))),
    bound: "1..*",
    from: "SimpleChoice.interaction",
    id: "interaction.ts#1",
    target: "ChoiceInteraction.id",
  },
  {
    becomes: ownedBy(
      "counted family",
      "Interaction",
      "counted(on(MatchSet, interaction), fin(Interaction, sets)); check(select(Interaction, i ⇒ i.eq(i.kind, qti-match-interaction)), i ⇒ i.eq(i.sets, 2)); childTwos states at least two, and no set states at most two",
    ),
    bound: "2..2",
    from: "Edge[childKind = qti-simple-match-set].parent",
    id: "interactions/associate.ts#1",
    target: "MatchInteraction.id",
  },
  {
    becomes: ownedBy(
      "key",
      "Gap",
      "key(on(select(Gap, g ⇒ g.eq(g.cardinality, single)), interaction)), the binding's cardinality copied onto each gap",
    ),
    bound: "0..1",
    from: "Gap.interaction",
    id: "interactions/gap.ts#1",
    target: "GapMatchBinding[cardinality = single].node",
  },
  {
    becomes: ownedBy("counted family", "Choice", choiceBounds("maxChoices")),
    bound: "maxChoicesN..*",
    from: "HotspotChoice.interaction",
    id: "interactions/hot.ts#1",
    target: "GraphicOrderInteraction[maxBound = bounded].id",
  },
  {
    becomes: ownedBy("counted family", "Choice", choiceBounds("minChoices")),
    bound: "minChoicesN..*",
    from: "HotspotChoice.interaction",
    id: "interactions/hot.ts#2",
    target: "GraphicOrderInteraction[maxBound = bounded].id",
  },
  {
    becomes: ownedBy("counted family", "Choice", choiceBounds("maxChoices")),
    bound: "maxChoicesN..*",
    from: "SimpleChoice.interaction",
    id: "interactions/order.ts#1",
    target: "OrderInteraction[maxBound = bounded].id",
  },
  {
    becomes: ownedBy("counted family", "Choice", choiceBounds("minChoices")),
    bound: "minChoicesN..*",
    from: "SimpleChoice.interaction",
    id: "interactions/order.ts#2",
    target: "OrderInteraction[maxBound = bounded].id",
  },
  {
    becomes: setLaw(
      always(["qti-inline-choice-interaction"], count("atLeastOne", ["qti-inline-choice"])),
    ),
    bound: "1..*",
    from: "InlineChoice.interaction",
    id: "interactions/text.ts#1",
    target: "InlineChoiceInteraction.id",
  },
  {
    becomes: setLaw(
      ...r30.flatMap(([parent, children]) =>
        children.map((child) => always([parent], count("atMostOne", [child]))),
      ),
    ),
    bound: "0..1",
    from: "Edge[childKind = row.child, parentKind = row.parent].parent",
    id: "metadata.ts#1",
    target: "arms[row.parent].id",
  },
  {
    becomes: ownedBy(
      "containment",
      "ResourceLomIdentified",
      "contained(on(ResourceLomIdentified, lom), on(LomIdentifier, lom)): the marker stands only over a record with an identifier",
    ),
    bound: "1..*",
    from: "LomIdentifier.lom",
    id: "metadata.ts#2",
    target: "ResourceLomIdentified.lom",
  },
  {
    becomes: ownedBy(
      "key and containment",
      "LomObjectIdentifier",
      "key(on(LomObjectIdentifier, lom)); contained(on(select(ResourceLomIdentified, r ⇒ r.eq(r.type, imsqti_item_xmlv3p0)), lom), on(LomObjectIdentifier, lom))",
    ),
    bound: "1..1",
    from: "LomObjectIdentifier.lom",
    id: "metadata.ts#3",
    target: "ResourceLomIdentified[type = imsqti_item_xmlv3p0].lom",
  },
  {
    becomes: ownedBy(
      "key and containment",
      "ResourceLomTitled",
      "R30 assert 36 keeps one lom:title under lom:general; contained(on(ResourceLomTitled, lom), on(LomGeneralTitle, lom)) makes it present",
    ),
    bound: "1..1",
    from: "LomGeneralTitle.lom",
    id: "metadata.ts#4",
    target: "ResourceLomTitled.lom",
  },
  {
    becomes: ownedBy(
      "key and containment",
      "LomObjectTitle",
      "key(on(LomObjectTitle, lom)); contained(on(select(ResourceLomTitled, r ⇒ r.eq(r.type, imsqti_item_xmlv3p0)), lom), on(LomObjectTitle, lom))",
    ),
    bound: "1..1",
    from: "LomObjectTitle.lom",
    id: "metadata.ts#5",
    target: "ResourceLomTitled[type = imsqti_item_xmlv3p0].lom",
  },
  {
    becomes: setLaw(always(["cpx:variant"], count("exactlyOne", ["cpx:metadata"]))),
    bound: "1..1",
    from: "VariantMetadata.variant",
    id: "package.ts#1",
    target: "Variant.id",
  },
  {
    becomes: setLaw(always(["cpx:metadata"], count("exactlyOne", ["drd:accessForAllResource"]))),
    bound: "1..1",
    from: "AccessForAllResource.metadata",
    id: "package.ts#2",
    target: "VariantMetadata.id",
  },
  {
    becomes: setLaw(always(["cp:manifest"], count("exactlyOne", ["cp:metadata.manifest"]))),
    bound: "1..1",
    from: "ManifestMetadata.manifest",
    id: "package.ts#3",
    target: "Package.id",
  },
  {
    becomes: setLaw(always(["cp:manifest"], count("exactlyOne", ["cp:organizations"]))),
    bound: "1..1",
    from: "Organizations.manifest",
    id: "package.ts#4",
    target: "Package.id",
  },
  {
    becomes: setLaw(always(["cp:manifest"], count("exactlyOne", ["cp:resources"]))),
    bound: "1..1",
    from: "Resources.manifest",
    id: "package.ts#5",
    target: "Package.id",
  },
  {
    becomes: setLaw(always(["cp:metadata.manifest"], count("exactlyOne", ["cp:schema"]))),
    bound: "1..1",
    from: "ManifestSchema.metadata",
    id: "package.ts#6",
    target: "ManifestMetadata.id",
  },
  {
    becomes: setLaw(always(["cp:metadata.manifest"], count("exactlyOne", ["cp:schemaversion"]))),
    bound: "1..1",
    from: "ManifestSchemaVersion.metadata",
    id: "package.ts#7",
    target: "ManifestMetadata.id",
  },
  {
    becomes: setLaw(always(["cp:resource"], count("atLeastOne", ["cp:file"]))),
    bound: "1..*",
    from: "File.resource",
    id: "package.ts#8",
    target: "Resource.id",
  },
  {
    becomes: ownedBy("counted family", "Expression", operatorArity),
    bound: "min..*",
    from: "Operand.expression",
    id: "processing.ts#1",
    target: "Expression.id",
  },
  {
    becomes: ownedBy("counted family", "Expression", operatorArity),
    bound: "0..max",
    from: "Operand.expression",
    id: "processing.ts#2",
    target: "ExpressionMax.id",
  },
  {
    becomes: ownedBy("key and containment", "Coords", coordsRequired),
    bound: "1..1",
    from: "Coords.node",
    id: "shapes.ts#1",
    target: "arm[shape = circle].id",
  },
  {
    becomes: ownedBy("key", "Attribute", "coords is one Attribute row of the element (AL2)"),
    bound: "0..1",
    from: "Coords.node",
    id: "shapes.ts#2",
    target: "arm[shape = default].id",
  },
  {
    becomes: ownedBy("key and containment", "Coords", coordsRequired),
    bound: "1..1",
    from: "Coords.node",
    id: "shapes.ts#3",
    target: "arm[shape = ellipse].id",
  },
  {
    becomes: ownedBy("key and containment", "Coords", coordsRequired),
    bound: "1..1",
    from: "Coords.node",
    id: "shapes.ts#4",
    target: "arm[shape = poly].id",
  },
  {
    becomes: ownedBy("key and containment", "Coords", coordsRequired),
    bound: "1..1",
    from: "Coords.node",
    id: "shapes.ts#5",
    target: "arm[shape = rect].id",
  },
  {
    becomes: setLaw(
      always(
        ["ud:ordinaryStatistic", "ud:categorizedStatistic"],
        count("atLeastOne", ["ud:targetObject"]),
      ),
    ),
    bound: "1..*",
    from: "TargetObject.statistic",
    id: "usage.ts#1",
    target: "Statistic.id",
  },
  {
    becomes: setLaw(always(["ud:ordinaryStatistic"], count("exactlyOne", ["ud:value"]))),
    bound: "1..1",
    from: "UsageValue.statistic",
    id: "usage.ts#2",
    target: "Statistic[kind = ordinary].id",
  },
  {
    becomes: setLaw(always(["ud:categorizedStatistic"], count("exactlyOne", ["ud:mapping"]))),
    bound: "1..1",
    from: "UsageMapping.statistic",
    id: "usage.ts#3",
    target: "Statistic[kind = categorized].id",
  },
  {
    becomes: setLaw(always(["ud:mapping"], count("atLeastOne", ["ud:mapEntry"]))),
    bound: "1..*",
    from: "UsageMapEntry.mapping",
    id: "usage.ts#4",
    target: "UsageMapping.id",
  },
  {
    becomes: ownedBy(
      "counted family",
      "ValueSet",
      "check(ValueSet, s ⇒ s.or(s.ne(s.cardinality, single), s.eq(s.elementChildren, 1))), elementChildren copied from the set's Node: qti-value is the one element a value set admits",
    ),
    bound: "1..1",
    from: "DeclaredValue.valueSet",
    id: "value.ts#1",
    target: "TypedValueSet[cardinality = single].id",
  },
  {
    becomes: setLaw(
      always(["qti-correct-response", "qti-default-value"], count("atLeastOne", ["qti-value"])),
    ),
    bound: "1..*",
    from: "DeclaredValue.valueSet",
    id: "value.ts#2",
    target: "ValueSet.id",
  },
];

/**
 * The parents that hold exactly one `(object | img | picture)`, the guard's stage hosts.
 */
const stageHosts: Kinds = [
  "qti-drawing-interaction",
  "qti-gap-img",
  "qti-graphic-associate-interaction",
  "qti-graphic-gap-match-interaction",
  "qti-graphic-order-interaction",
  "qti-hotspot-interaction",
  "qti-position-object-interaction",
  "qti-position-object-stage",
  "qti-select-point-interaction",
];

/**
 * The six rules a `qti-template-processing` holds.
 */
const templateRules: Kinds = [
  "qti-exit-template",
  "qti-set-correct-response",
  "qti-set-default-value",
  "qti-set-template-value",
  "qti-template-condition",
  "qti-template-constraint",
];

/**
 * The statements ported from the import guards `union-count` (spec 3.7), `body-empty` (spec 3.6)
 * and `P28`, and the two R30 asserts the old schema held as keys of `LomGeneralTitle` and
 * `LomGeneral` rather than as `capacity` uses.
 */
export const guardStatements: readonly ChildStatement[] = [
  {
    ...always(stageHosts, count("exactlyOne", ["object", "img", "picture"])),
    source: "union-count",
  },
  {
    ...always(["qti-media-interaction"], count("exactlyOne", ["object", "audio", "video"])),
    source: "union-count",
  },
  {
    ...always(
      ["qti-gap-match-interaction", "qti-graphic-gap-match-interaction"],
      count("atLeastOne", ["qti-gap-text", "qti-gap-img"]),
    ),
    source: "union-count",
  },
  { ...always(["tr"], count("atLeastOne", ["td", "th"])), source: "union-count" },
  {
    ...onlyIn("3.0.1", ["table"], { alternatives: [["tbody"], ["tr"]], law: "exclusive" }),
    source: "union-count",
  },
  {
    ...always(["qti-item-body"], { law: "atLeastOne", members: { of: "elements" } }),
    source: "body-empty",
  },
  { ...always(["qti-template-processing"], count("atLeastOne", templateRules)), source: "P28" },
  { ...always(["lom:general"], count("atMostOne", ["lom:title"])), source: "R30 assert 36" },
  { ...always(["lom:lom"], count("atMostOne", ["lom:general"])), source: "R30 assert 57" },
];

/**
 * Every child-set statement: the set laws of {@link capacityMap}, each sourced by its use's id,
 * then {@link guardStatements}.
 */
export const childStatements: readonly ChildStatement[] = [
  ...capacityMap.flatMap(({ becomes, id }) =>
    becomes.as === "set law" ? becomes.rules.map((rule) => ({ ...rule, source: id })) : [],
  ),
  ...guardStatements,
];

/**
 * A statement read under one (version, parent): its member sets as kinds the parent admits.
 */
type Resolved =
  | {
      readonly kinds: readonly string[];
      readonly law: "atLeastOne" | "atMostOne" | "exactlyOne";
      readonly source: string;
    }
  | {
      readonly alternatives: readonly (readonly string[])[];
      readonly law: "exclusive";
      readonly source: string;
    }
  | {
      readonly kinds: readonly string[];
      readonly law: "barredBy";
      readonly name: string;
      readonly source: string;
    };

/**
 * A (version, parent) that admits a child, with the kinds it admits, once each, in admission order.
 */
interface Pair {
  readonly children: readonly string[];
  readonly parent: string;
  readonly version: SchemaVersionHandle;
}

/**
 * Where a statement is read: its source, and the (version, parent) it is read under.
 */
interface Site {
  readonly parent: string;
  readonly source: string;
  readonly version: SchemaVersionHandle;
}

/**
 * Key a (version, parent) pair.
 *
 * @param version - The schema version.
 * @param parent - The parent's kind handle.
 * @returns One string per pair; handles hold no space.
 */
const pairKey = (version: string, parent: string): string => `${version} ${parent}`;

/**
 * Collect every (version, parent) that admits a child.
 *
 * @param vocabularies - The vocabularies.
 * @returns Each pair by its key, with its children once each in admission order.
 */
const pairsOf = (vocabularies: readonly Vocabulary[]): ReadonlyMap<string, Pair> => {
  const pairs = new Map<string, { readonly children: Set<string> } & Omit<Pair, "children">>();
  for (const { admission } of vocabularies) {
    for (const { child, parent, version } of admission) {
      const key = pairKey(version, parent);
      const pair = pairs.get(key) ?? { children: new Set<string>(), parent, version };
      pairs.set(key, pair);
      pair.children.add(child);
    }
  }

  return new Map([...pairs].map(([key, pair]) => [key, { ...pair, children: [...pair.children] }]));
};

/**
 * Read a member list under one (version, parent) as kinds the parent admits.
 *
 * @param members - The members as stated.
 * @param site - Where the statement is read.
 * @param admitted - The kinds the parent admits in the version.
 * @param elements - The kinds that are elements.
 * @returns The kinds, or the first one the parent does not admit.
 */
const membersOf = (
  members: Members,
  site: Site,
  admitted: readonly string[],
  elements: ReadonlySet<string>,
): Result.Result<readonly string[], NoElementChild | UnadmittedChild> => {
  if (members.of === "elements") {
    const found = admitted.filter((kind) => elements.has(kind));

    return found.length > 0 ? Result.succeed(found) : Result.fail(new NoElementChild(site));
  }

  const outside = members.kinds.find((kind) => !admitted.includes(kind));

  return outside === undefined
    ? Result.succeed(members.kinds)
    : Result.fail(new UnadmittedChild({ ...site, child: outside }));
};

/**
 * Read one statement's law under one (version, parent).
 *
 * @param law - The law as stated.
 * @param site - Where it is read.
 * @param admitted - The kinds the parent admits in the version.
 * @param elements - The kinds that are elements.
 * @returns The law over admitted kinds, or the first member the parent does not admit.
 */
const resolve = (
  law: ChildLaw,
  site: Site,
  admitted: readonly string[],
  elements: ReadonlySet<string>,
): Result.Result<Resolved, NoElementChild | UnadmittedChild> => {
  const { source } = site;
  const named = (kinds: Kinds) => membersOf({ kinds, of: "kinds" }, site, admitted, elements);

  if (law.law === "exclusive") {
    return Result.map(Result.all(law.alternatives.map(named)), (alternatives) => ({
      alternatives,
      law: law.law,
      source,
    }));
  }

  if (law.law === "barredBy") {
    return Result.map(named(law.kinds), (kinds) => ({
      kinds,
      law: law.law,
      name: law.name,
      source,
    }));
  }

  return Result.map(membersOf(law.members, site, admitted, elements), (kinds) => ({
    kinds,
    law: law.law,
    source,
  }));
};

/**
 * List the member sets a resolved statement reads.
 *
 * @param statement - The statement.
 * @returns Its alternatives for an `exclusive` law, else its one set.
 */
const masksOf = (statement: Resolved): readonly (readonly string[])[] =>
  statement.law === "exclusive" ? statement.alternatives : [statement.kinds];

/**
 * Number a parent's positions: the atoms of its member sets, the classes of kinds that lie in
 * exactly the same sets, numbered from 1 in the code order of their first kind.
 *
 * @param masks - The parent's member sets.
 * @param kinds - The `NodeKind` roster, in code order.
 * @returns The position of each kind some set holds.
 */
const atomsOf = (
  masks: readonly (readonly string[])[],
  kinds: readonly string[],
): ReadonlyMap<string, number> => {
  const signatures = new Map<string, string>();
  for (const [index, mask] of masks.entries()) {
    for (const kind of mask) {
      signatures.set(kind, `${signatures.get(kind) ?? ""},${index}`);
    }
  }

  const numbered = new Map<string, number>();
  const positions = new Map<string, number>();
  for (const kind of kinds) {
    const signature = signatures.get(kind);
    if (signature !== undefined) {
      const position = numbered.get(signature) ?? numbered.size + 1;
      numbered.set(signature, position);
      positions.set(kind, position);
    }
  }

  return positions;
};

/**
 * Collect the positions a set of kinds holds.
 *
 * @param positions - The parent's position of each kind a law reads.
 * @param kinds - The set.
 * @returns Its positions.
 */
const spanOf = (positions: ReadonlyMap<string, number>, kinds: readonly string[]): Set<number> =>
  new Set(kinds.flatMap((kind) => Option.toArray(Option.fromNullishOr(positions.get(kind)))));

/**
 * The masks a parent's count laws accumulate into while it is lowered.
 */
interface Counts {
  readonly anyOf: ReadonlySet<number>[];
  readonly atMostOnce: Set<number>;
  readonly exclusive: ReadonlySet<number>[];
  readonly required: Set<number>;
}

/**
 * Add "at least one child at these positions": a required bit for one position, else a slot.
 *
 * @param counts - The parent's masks so far.
 * @param held - The positions of the counted union.
 */
const countAtLeastOne = (counts: Counts, held: ReadonlySet<number>): void => {
  if (held.size === 1) {
    for (const position of held) {
      counts.required.add(position);
    }
  } else {
    counts.anyOf.push(held);
  }
};

/**
 * Add "at most one child at these positions": an at-most-once bit per position, and a slot that
 * keeps two of the positions from both being held.
 *
 * @param counts - The parent's masks so far.
 * @param held - The positions of the counted union.
 */
const countAtMostOne = (counts: Counts, held: ReadonlySet<number>): void => {
  for (const position of held) {
    counts.atMostOnce.add(position);
  }

  if (held.size > 1) {
    counts.exclusive.push(held);
  }
};

/**
 * The laws of one (version, parent), with every barring it states, before the key of
 * `ChildBarredBy` keeps one.
 */
interface Lowered extends ParentLaws {
  readonly barrings: readonly Barring[];
}

/**
 * Lower a parent's statements to its masks over positions.
 *
 * A count over one position is a required or at-most-once bit. A count over several positions is
 * an `anyOf` slot for at least one, and for at most one an at-most-once bit per position plus an
 * `exclusive` slot over them, since one child of each would also break "at most one of the union".
 *
 * @param statements - The pair's statements, read under it.
 * @param pair - The pair.
 * @param kinds - The `NodeKind` roster, in code order.
 * @returns The pair's laws, or the first set read as one bit that spans several positions.
 */
const lower = (
  statements: readonly Resolved[],
  pair: Pair,
  kinds: readonly string[],
): Result.Result<Lowered, SplitMembers> =>
  Result.gen(function* lowerPair() {
    const positions = atomsOf(statements.flatMap(masksOf), kinds);
    const one = (members: readonly string[], source: string) => {
      const [position, ...rest] = spanOf(positions, members);

      return position !== undefined && rest.length === 0
        ? Result.succeed(position)
        : Result.fail(
            new SplitMembers({
              kinds: members.join(", "),
              parent: pair.parent,
              source,
              version: pair.version,
            }),
          );
    };
    const counts: Counts = { anyOf: [], atMostOnce: new Set(), exclusive: [], required: new Set() };
    const barrings: Barring[] = [];

    for (const statement of statements) {
      if (statement.law === "exclusive") {
        const alternatives = statement.alternatives.map((members) =>
          one(members, statement.source),
        );
        counts.exclusive.push(new Set(yield* Result.all(alternatives)));
      } else if (statement.law === "barredBy") {
        const position = yield* one(statement.kinds, statement.source);
        barrings.push({ name: statement.name, position });
      } else {
        const held = spanOf(positions, statement.kinds);
        if (statement.law !== "atMostOne") {
          countAtLeastOne(counts, held);
        }

        if (statement.law !== "atLeastOne") {
          countAtMostOne(counts, held);
        }
      }
    }

    return {
      ...counts,
      barredBy: Option.fromNullishOr(barrings[0]),
      barrings,
      positions: new Map(pair.children.map((kind) => [kind, positions.get(kind) ?? 0])),
    };
  });

/**
 * The laws of a (version, parent) that admits no child: no positions and no masks.
 */
const noLaws: ParentLaws = {
  anyOf: [],
  atMostOnce: new Set(),
  barredBy: Option.none(),
  exclusive: [],
  positions: new Map(),
  required: new Set(),
};

/**
 * Number the codes 0 to `size` − 1, a field over `fin(size)`.
 *
 * @param size - The field's size.
 * @returns The codes, ascending.
 */
const fin = (size: number): readonly number[] => Array.from({ length: size }, (_, code) => code);

/**
 * Read every statement under each (version, parent) it names, grouped by pair.
 *
 * @param statements - The statements.
 * @param pairs - The pairs that admit a child.
 * @param elements - The kinds that are elements.
 * @returns Each pair's statements by its key, or the first member a parent does not admit.
 */
const resolveAll = (
  statements: readonly ChildStatement[],
  pairs: ReadonlyMap<string, Pair>,
  elements: ReadonlySet<string>,
): Result.Result<ReadonlyMap<string, readonly Resolved[]>, NoElementChild | UnadmittedChild> =>
  Result.gen(function* resolveStatements() {
    const byPair = new Map<string, Resolved[]>();
    for (const { law, parents, source, versions } of statements) {
      for (const version of versions) {
        for (const parent of parents) {
          const key = pairKey(version, parent);
          const admitted = pairs.get(key)?.children ?? [];
          const resolved = yield* resolve(law, { parent, source, version }, admitted, elements);
          byPair.set(key, [...(byPair.get(key) ?? []), resolved]);
        }
      }
    }

    return byPair;
  });

/**
 * Generate the child-set relations of a vocabulary list from its statements.
 *
 * Every member a statement names must be a child its parent admits in each of the statement's
 * versions; every set an `exclusive` or `barredBy` law reads as one bit must be one position; a
 * parent bars children under one attribute at most; and each relation must fit its constant.
 *
 * @param input - The rosters, the vocabularies and the statements.
 * @returns The relations, or the first reason the statements have none.
 */
export const childSets = (input: ChildSetsInput): Result.Result<ChildSets, ChildSetsError> =>
  Result.gen(function* generateChildSets() {
    const { attributes, kinds, statements, versions, vocabularies } = input;
    const pairs = pairsOf(vocabularies);
    const elements = new Set(
      vocabularies.flatMap(({ registry }) =>
        Object.entries(registry).flatMap(([kind, row]) => (row.local === "" ? [] : [kind])),
      ),
    );
    const byPair = yield* resolveAll(statements, pairs, elements);
    const rows: {
      readonly laws: Lowered;
      readonly parent: string;
      readonly version: SchemaVersionHandle;
    }[] = [];
    for (const [key, pair] of pairs) {
      const laws = yield* lower(byPair.get(key) ?? [], pair, kinds);
      rows.push({ laws, parent: pair.parent, version: pair.version });
    }

    const lowered = new Map(
      rows.map(({ laws, parent, version }) => [pairKey(version, parent), laws]),
    );
    const widest = (read: (laws: Lowered) => number): number =>
      Math.max(0, ...rows.map(({ laws }) => read(laws)));
    const positions = 1 + widest((laws) => Math.max(0, ...laws.positions.values()));
    const versionField = { name: "version", values: versions } satisfies VersionField;
    const parentField = { name: "parent", values: kinds } satisfies KindField<"parent">;
    const positionField = { name: "position", values: fin(positions) } satisfies PositionField;
    const maskRows = (read: (laws: Lowered) => ReadonlySet<number>) =>
      rows.flatMap(({ laws, parent, version }) =>
        [...read(laws)].map((position) => ({ parent, position, version })),
      );
    const slotted = (read: (laws: Lowered) => readonly ReadonlySet<number>[]) => ({
      field: { name: "slot", values: fin(widest((laws) => read(laws).length)) } satisfies SlotField,
      rows: rows.flatMap(({ laws, parent, version }) =>
        read(laws).flatMap((mask, slot) =>
          [...mask].map((position) => ({ parent, position, slot, version })),
        ),
      ),
    });
    const anyOf = slotted((laws) => laws.anyOf);
    const exclusive = slotted((laws) => laws.exclusive);

    return {
      anyOf: yield* closed({
        key: [versionField, parentField, anyOf.field, positionField],
        name: "ChildAnyOf",
        payload: [],
        rows: anyOf.rows,
      }),
      atMostOnce: yield* closed({
        key: [versionField, parentField, positionField],
        name: "ChildAtMostOnce",
        payload: [],
        rows: maskRows((laws) => laws.atMostOnce),
      }),
      barredBy: yield* closed({
        key: [versionField, parentField],
        name: "ChildBarredBy",
        payload: [{ name: "name", values: attributes }, positionField],
        rows: rows.flatMap(({ laws, parent, version }) =>
          laws.barrings.map(({ name, position }) => ({ name, parent, position, version })),
        ),
      }),
      exclusive: yield* closed({
        key: [versionField, parentField, exclusive.field, positionField],
        name: "ChildExclusive",
        payload: [],
        rows: exclusive.rows,
      }),
      lawsOf: (version, parent) => lowered.get(pairKey(version, parent)) ?? noLaws,
      position: yield* closed({
        key: [versionField, parentField, { name: "child", values: kinds }],
        name: "ChildPosition",
        payload: [positionField],
        rows: rows.flatMap(({ laws, parent, version }) =>
          [...laws.positions].map(([child, position]) => ({ child, parent, position, version })),
        ),
      }),
      positions,
      required: yield* closed({
        key: [versionField, parentField, positionField],
        name: "ChildRequired",
        payload: [],
        rows: maskRows((laws) => laws.required),
      }),
    };
  });
