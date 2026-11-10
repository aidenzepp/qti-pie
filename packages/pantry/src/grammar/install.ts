/**
 * The grammar's rosters and closed relations, declared to grizzle (fin.md §17; plan §1.2, and the
 * W5 amendment's C4, C7, C8, C17 and C24).
 *
 * Every row here is a generator's: {@link grammar} is `composed()`, run once when this module
 * loads, and each declaration states one of its relations as `closed(name, handles)` or
 * `closed.relation(name, fields, key, rows)`. grizzle packs each into a content-addressed constant
 * when a law or a generated field reads it, and installs nothing for one no statement reads. This
 * is the one module under `src/grammar/` that imports grizzle (`purity.test.ts`), so the generators
 * stay pure and each schema module imports its rosters and relations from here.
 *
 * The migration states each constant as one hex literal under its row count and digest, which
 * `grizzle check` decodes, the one form grizzle writes (README, "Closed relations"); a generator
 * builds the rows and the generators' tests review them.
 *
 * `FollowSetOf`, which states `Last` as its `ends`, is keyed by its automaton
 * ({@link ContentModel}), `FollowMember` by its follow set ({@link FollowSet}), `SymbolSetOf` by
 * its shared model ({@link SharedModel}) and `SymbolMember` by its symbol set ({@link SymbolSet}):
 * a family reads its model through {@link ContentModelOf} or {@link SharedModelOf}, and a state its
 * set through {@link FollowSetOf}, so each is stated one to one.
 *
 * Where grizzle's surface differs from the generators' shapes, the declaration restates the
 * relation and says why:
 *
 * - A generator's dependent `fin` coordinate is a slot, `slot(closedId(Position), fin(O, n))`, over a
 *   count relation O over the model ({@link ModelPositions}), so each model's block holds its own
 *   positions and no other's (README, "Closed relations").
 * - A lexical form's code is a `<Roster>Lexical` payload, and a one-position law a function over
 *   (version, parent) ({@link CountedOf}, {@link BarredOf}). A singleton set is no relation's row:
 *   a schema module writes `Compute.singleton(id)`, and a handle's membership in a set is
 *   `Compute.subset(Compute.singleton(id), set)` (README, "Tables and types").
 * - A function holds a row only where its value is: a law says what holds where a key has none with
 *   `C.has`, `or(not(C.has(k)), φ(C.at(f, k)))`, never through a row that stands for the absence
 *   (README, "Closed relations"). {@link CountedOf}, {@link BarredOf}, {@link SharedModelOf},
 *   {@link ValueIdentity} and {@link TextDomain} are read so.
 * - An element's attributes and text are read under its governor ({@link GoverningOf}): its kind, or
 *   the type an `xsi:type` makes govern it (spec readings 60 and 84).
 */
import { closed, closedId, fin, natural, pg, slot, str } from "@bjornpagen/grizzle";
import { Array as Arr, Option, Result } from "effect";
import type { Flag as FlagHandle } from "#pantry/grammar/ancestry.ts";
import { attributeCounts } from "#pantry/grammar/attributes.ts";
import type { AttributeCount } from "#pantry/grammar/attributes.ts";
import type { Roster as GeneratedRoster } from "#pantry/grammar/closed.ts";
import { int8Max, rowsAt } from "#pantry/grammar/closed.ts";
import { composed, recordCardinality } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar, Kind } from "#pantry/grammar/compose.ts";
import {
  cnForms,
  cnPatternOf,
  mathArities,
  mathHeadOperators,
  mathHeadQualifiers,
} from "#pantry/grammar/expression.ts";
import { foreignKinds } from "#pantry/grammar/kinds.ts";
import { toolLabelKindsOf } from "#pantry/grammar/labels.ts";
import { vocabularyNamespacesPattern } from "#pantry/grammar/names.ts";
import type { SchemaVersion as Version } from "#pantry/grammar/kinds.ts";
import { typeDerivations } from "#pantry/vocab/inventory/models.ts";

/**
 * The composed grammar of production, every relation below read from it.
 *
 * It is computed once, when the module loads, so every process that imports a schema module pays
 * for it there, with this module's declarations: 6.7 s and 541 MB of resident memory on
 * 2026-11-06 at a load average of about 30, `composed()` 3.1 s of it (C24). A generator's refusal
 * is a defect of the vocabulary list, which no declaration can stand without, so it is thrown as
 * the refusal itself, whose message names the rows and the repair.
 */
export const grammar: ComposedGrammar = Result.getOrThrowWith(composed(), (refusal) => refusal);

/**
 * Take a generated roster's handles as a nonempty list, the form a grizzle roster declares, in the
 * generator's order, which is the order grizzle codes them in: a roster's codes follow its declared
 * order, and this package's migrations are drafted from zero (one `_init`), so no install of it
 * holds another history. Loading this module reads no snapshot.
 *
 * @param name - The roster's name, which the defect's message names.
 * @param handles - The handles in the generator's order.
 * @returns The same handles, typed nonempty.
 * @throws {Error} When the generator gave the roster no handle, which no vocabulary list does.
 */
const nonEmpty = <H extends string>(name: string, handles: readonly H[]): readonly [H, ...H[]] => {
  if (Arr.isReadonlyArrayNonEmpty(handles)) {
    return handles;
  }

  throw new Error(
    `The composed grammar gives the ${name} roster no handle, and a grizzle roster holds at least one. Check the vocabulary list its generator reads.`,
  );
};

/**
 * Narrow a generator's value to a handle of one of its rosters: the generators type their rows by
 * the IR's strings, and grizzle's declared rows hold each roster's handle type, which this test of
 * the roster proves. A value outside the roster is a fault of the generated rows, which the
 * composition's tests find (`faultOf`, `compose.test.ts`) and grizzle's `closedRows` refuses too.
 *
 * @param roster - The generated roster the value's field ranges over.
 * @param value - The value a generated row holds.
 * @returns The value as the roster's handle.
 * @throws {Error} When the roster lacks it: a defect of the generator that stated the row.
 */
const memberOf = <H extends string>(roster: GeneratedRoster<H>, value: string): H => {
  if (roster.has(value)) {
    return value;
  }

  throw new Error(
    `A generated row names ${value}, which the ${roster.name} roster does not hold. The generator's closed relation should have refused the row; correct the generator.`,
  );
};

/**
 * Narrow generators' values to the handles of a roster this module declares, through one keyed
 * lookup of the roster's handles, built once.
 *
 * @param name - The roster's name, for the defect's message.
 * @param handles - The roster's handles.
 * @returns The lookup: a value a generated row holds, as the roster's handle.
 * @throws {Error} From the lookup, when the roster lacks the value, which no generator's row does.
 */
const handleLookup = <H extends string>(
  name: string,
  handles: readonly H[],
): ((value: string) => H) => {
  const byValue = new Map<string, H>(handles.map((handle) => [handle, handle]));

  return (value) => {
    const found = byValue.get(value);
    if (found !== undefined) {
      return found;
    }

    throw new Error(
      `A generated row names ${value}, which the ${name} roster this module declares does not hold. Add the handle to the roster, or correct the generator.`,
    );
  };
};

/**
 * Any text, line ends included, as XML Schema's `xs:string` reads one: the type of a closed
 * relation's open text payloads, of every text no law reads, and the language every byte-bounded
 * text cuts (`#pantry/qti/limits.ts`). Its pattern is a tautology, so grizzle installs a field of
 * it as plain text, with no domain and no pattern law (`physical/ddl/domains.ts` `structuralRegex`
 * of the vendored engine). It is declared once, here, so grizzle analyzes the pattern once.
 */
export const anyText = str.regex("^.*$", "su");

// Handle lists (C8): membership is `Compute.in`, so these sets are lists, never installed.

/**
 * The kinds that are no element: the document node, character data, comments, instructions,
 * entity references and the doctype. `¬in(kind, nonElementKinds)` is an element (C8).
 */
export const nonElementKinds = [
  "document",
  "text",
  "ws",
  "comment",
  "pi",
  "entityRef",
  "doctype",
] as const satisfies readonly Kind[];

/**
 * The interaction kinds: a node whose parent is one takes that parent as its nearest interaction
 * (N8), `in(parentKind, interactionKinds)`.
 */
export const interactionKinds: readonly Kind[] = grammar.kinds.interaction.rows.map(({ kind }) =>
  memberOf(grammar.kinds.nodeKind, kind),
);

/**
 * The element classes, the `NodeKind` handles of a foreign element by its namespace's class:
 * `foreign-element`, `no-namespace-element` and `own-namespace-element`.
 */
export const openElementClasses = [
  foreignKinds.other,
  foreignKinds.absent,
  foreignKinds.own,
] as const satisfies readonly Kind[];

/**
 * The kinds whose `label` asks for its tool, the item's `tool-name` and `tool-version` (spec
 * reading 128): those whose declared type takes its `label` from a type whose characteristic states
 * the sentence (`labels.ts`), `in(kind, toolLabelKinds)`.
 */
export const toolLabelKinds: readonly Kind[] = toolLabelKindsOf({
  declaredType: grammar.xsi.declaredType,
  derivations: typeDerivations,
  kinds: grammar.kinds.nodeKind.handles,
}).kinds;

// Rosters, each a generator's in code order. Codes are history: a vocabulary appends.

/**
 * The `DocumentType` handle of the package's manifest, the IMS Content Packaging manifest document,
 * which is no resource's (spec readings 146 and 176).
 */
const manifestDocument = "manifest";

/**
 * The `SchemaVersion` roster: the QTI 3.0 schema versions, a key digit of every relation that
 * varies by version.
 */
export const SchemaVersion = closed(
  "SchemaVersion",
  nonEmpty("SchemaVersion", grammar.kinds.versions.handles),
);

/**
 * The `NodeKind` roster: the document layer's fixed kinds, then every vocabulary's in composition
 * order (`kinds.ts`).
 */
export const NodeKind = closed("NodeKind", nonEmpty("NodeKind", grammar.kinds.nodeKind.handles));

/**
 * The `AttributeName` roster: the open classes, the document layer's `xml:` and `xsi:` names, then
 * every vocabulary's names (`kinds.ts`).
 */
export const AttributeName = closed(
  "AttributeName",
  nonEmpty("AttributeName", grammar.kinds.attributeName.handles),
);

/**
 * The `TypeName` roster: the pinned XSDs' named types, each its namespace's prefix and its local
 * name (`typeHandle` of `xsi.ts`). No handle stands for no type: an element no named type governs
 * has no row of the relation that holds its type (`ElementType`, `OpenElementType`).
 */
export const TypeName = closed("TypeName", nonEmpty("TypeName", grammar.xsi.typeName.handles));

/**
 * The `BaseType` roster: QTI's base types, each spelled as its lexical form. A record has none
 * ("Variables with record cardinality have no base-type", QTI 3.0 information model, tables 4.5.3,
 * 5.34.3, 5.115.3 and 5.151.3), so no handle stands for its absence: a declaration's base type is a
 * row of its own (`DeclarationBaseType`), which a record does not have (lane NIL's audit, B12).
 */
export const BaseType = closed("BaseType", nonEmpty("BaseType", grammar.baseTypes.handles));

/**
 * A generated value as a `BaseType` handle ({@link handleLookup}).
 */
const asBaseType = handleLookup("BaseType", BaseType.handles);

/**
 * The `Cardinality` roster: the cardinalities of a typed variable, each spelled as its lexical
 * form, then `record`, so a record declaration is (none, record). `BindingFit` holds the typed
 * cardinalities alone, and `RecordBindingFit` a record's interactions.
 */
export const Cardinality = closed(
  "Cardinality",
  nonEmpty("Cardinality", [...grammar.typedCardinalities.handles, recordCardinality]),
);

/**
 * A generated value as a `Cardinality` handle ({@link handleLookup}).
 */
const asCardinality = handleLookup("Cardinality", Cardinality.handles);

/**
 * The `ResourceType` roster: the 21 types a `cp:resource` may name, each spelled as its lexical
 * form (`package.ts`). A lexical form no handle spells is outside the attribute's value domain, so
 * a resource that carries it is refused. No handle stands for no type: a resource whose `type`
 * spells none has no `ResourceTyped` row, and an item ref whose href names no resource has no
 * `ItemRefTarget` (a missing value is a row of its own relation, or no row).
 */
export const ResourceType = closed(
  "ResourceType",
  nonEmpty("ResourceType", grammar.package.resourceType.handles),
);

/**
 * The `DocumentType` roster: the type of a document of a package, which every node and attribute of
 * the document copies: `manifest`, the package's manifest document, then the 21 types a
 * `cp:resource` may name, the type of the resource that lists the document (IMS Content Packaging
 * 1.2 sets the manifest apart from the resources it declares; spec reading 176). Every document is
 * one or the other, so the type is total and names no absence.
 */
export const DocumentType = closed(
  "DocumentType",
  nonEmpty("DocumentType", [manifestDocument, ...grammar.package.resourceType.handles]),
);

/**
 * `ResourceDocumentType`: resource type → document type, the type of the documents a resource of
 * the type lists, spelled as the resource type is: a document a resource lists holds the type of
 * that resource, a row of its own (`ResourceDocument`), and its `DocumentType` by this function.
 * `none` names no resource, and has no row.
 */
export const ResourceDocumentType = closed.relation(
  "ResourceDocumentType",
  { documentType: closedId(DocumentType), type: closedId(ResourceType) },
  ["type"],
  grammar.package.resourceType.handles.map((type) => ({ documentType: type, type })),
);

/**
 * The `Flag` roster: the ancestry flags, `bits(Flag)` the ancestry a node's children inherit
 * (`ancestry.ts`).
 */
export const Flag = closed(
  "Flag",
  nonEmpty<FlagHandle>("Flag", grammar.ancestry.enters.key[1].roster.handles),
);

/**
 * The `Position` roster: a family's content positions, 0 its start, then 1 to the widest model's
 * last, each spelled as its numeral (`content.ts`).
 */
export const Position = closed("Position", nonEmpty("Position", grammar.content.positions.handles));

/**
 * The `AttributeSlot` roster: an admitted attribute's position among the names its (version, kind)
 * admits, numbered in `AttributeName` code order, so an element's attributes are a `bits` over it
 * (`attributes.ts`, D8).
 */
export const AttributeSlot = closed(
  "AttributeSlot",
  nonEmpty("AttributeSlot", grammar.attributes.positions.handles),
);

/**
 * The `ValueDomain` roster: every value domain an attribute or a text is read in (`attributes.ts`).
 */
export const ValueDomain = closed(
  "ValueDomain",
  nonEmpty("ValueDomain", grammar.attributes.valueDomain.key[0].roster.handles),
);

/**
 * A generated value as a `ValueDomain` handle ({@link handleLookup}).
 */
const asValueDomain = handleLookup("ValueDomain", ValueDomain.handles);

/**
 * The `Use` roster: whether an element of a kind must carry an attribute.
 */
export const Use = closed(
  "Use",
  nonEmpty("Use", grammar.attributes.admission.payload[1].roster.handles),
);

/**
 * The `DomainPrimitive` roster: the primitive a value domain's typed value is derived in.
 */
export const DomainPrimitive = closed(
  "DomainPrimitive",
  nonEmpty("DomainPrimitive", grammar.attributes.valueDomain.payload[0].roster.handles),
);

/**
 * The `BoundFacet` roster: the facets a double's or a float's lower bound is, `minExclusive` and
 * `minInclusive` ({@link DoubleBound}).
 */
export const BoundFacet = closed(
  "BoundFacet",
  nonEmpty("BoundFacet", grammar.attributes.doubleBound.payload[0].roster.handles),
);

/**
 * The `Identity` roster: `xs:ID`, `xs:IDREF` and `xs:IDREFS`, the identity types a domain may have.
 * A domain of none has no {@link ValueIdentity} row.
 */
export const Identity = closed(
  "Identity",
  nonEmpty("Identity", grammar.attributes.identity.payload[0].roster.handles),
);

/**
 * The `Governor` roster: what an element's attributes and text are read under. Each `NodeKind`
 * handle first, in code order, a kind governing its own elements by its declared type; then each
 * (kind, type) where the type governs an element of the kind in place of its declared type, or a
 * simple type governs a foreign element's text (spec readings 60 and 84), spelled `<kind> <type>`
 * (`attributes.ts`). A kind's handle holds no space, so no two spellings meet. The list is ordered
 * as the `Governor` roster, by the committed snapshot's codes with new handles last, so a kind's
 * handle keeps its place only while the snapshot says so.
 */
export const Governor = closed(
  "Governor",
  nonEmpty("Governor", [
    ...nonEmpty("NodeKind", grammar.kinds.nodeKind.handles),
    ...grammar.attributes.governor.payload[0].roster.handles,
  ]),
);

/**
 * A generated value as a `Governor` handle ({@link handleLookup}).
 */
const asGovernor = handleLookup("Governor", Governor.handles);

/**
 * The `DeclarationKind` roster: the kinds that declare a variable (`references.ts`).
 */
export const DeclarationKind = closed(
  "DeclarationKind",
  nonEmpty("DeclarationKind", grammar.references.declarationKind.handles),
);

/**
 * The `BuiltIn` roster: the built-in variables a reference may name without a declaration. The
 * function from each to the kind of declaration it stands as is {@link BuiltInVariable}.
 */
export const BuiltIn = closed(
  "BuiltIn",
  nonEmpty("BuiltIn", grammar.references.builtInVariable.handles),
);

/**
 * The `ReferenceSpelling` roster: how a reference's value spells a variable's name.
 */
export const ReferenceSpelling = closed(
  "ReferenceSpelling",
  nonEmpty("ReferenceSpelling", grammar.references.spelling.handles),
);

/**
 * The `ReferenceForm` roster: how a file reference's value names its files, one URI reference or an
 * image candidate list (spec reading 103).
 */
export const ReferenceForm = closed(
  "ReferenceForm",
  nonEmpty("ReferenceForm", grammar.references.referenceForm.handles),
);

/**
 * The `BoundZero` roster: what a most of 0 means on a kind's choice bound.
 */
export const BoundZero = closed(
  "BoundZero",
  nonEmpty("BoundZero", grammar.references.choiceBound.payload[2].roster.handles),
);

/**
 * The `ContentModel` roster: every distinct content automaton, named by its first family's parent
 * kind, `FollowSetOf` and `Last` keyed by it (the content grammar's own key, `content.ts`).
 */
export const ContentModel = closed(
  "ContentModel",
  nonEmpty("ContentModel", grammar.content.models.handles),
);

/**
 * The `SharedModel` roster: each content model in which a kind names several positions (C4), named
 * by its parent kind.
 */
export const SharedModel = closed(
  "SharedModel",
  nonEmpty("SharedModel", grammar.content.sharedModels.handles),
);

/**
 * The `AdmissionMap` roster: every distinct admission map of a family, as the content grammar
 * numbers them (`#pantry/grammar/content.ts`): the children a family admits at their positions,
 * each distinct map stated once (rule 0: identical facts are one fact), so its 1,288 families hold
 * 190 maps. `ContentModelOf` names each family's map, and `AdmissionIn` each map's children, so
 * the (version, parent, child) → position function `Admission` is, ChildGrammar once, is read as
 * `AdmissionIn(ContentModelOf.admission(version, parent), child)`. A family that admits no child
 * holds the empty map, which `AdmissionIn` holds no row of.
 */
export const AdmissionMap = closed(
  "AdmissionMap",
  nonEmpty("AdmissionMap", grammar.content.admissionMaps.handles),
);

/**
 * `ContentModelOf`: (version, parent) → (model, admission), total, the automaton a parent's
 * children follow in the version, read by N5b and N7 as `ContentModelOf.at("model", version,
 * parentKind)`, and the family's admission map, read by N5 as `ContentModelOf.at("admission",
 * version, parentKind)` ({@link AdmissionIn}).
 */
export const ContentModelOf = closed.relation(
  "ContentModelOf",
  {
    admission: closedId(AdmissionMap),
    model: closedId(ContentModel),
    parent: closedId(NodeKind),
    version: closedId(SchemaVersion),
  },
  ["version", "parent"],
  grammar.content.contentModelOf.rows.map(({ admission, model, parent, version }) => ({
    admission,
    model,
    parent: memberOf(grammar.kinds.nodeKind, parent),
    version,
  })),
);

// The count relations a slot's fin reads.

/**
 * `ModelPositions`: model → positions, the number of content positions of each automaton, its start
 * 0 included, so the model of a family with no model, or an empty one, has 1. `FollowSetOf`'s and
 * `Last`'s slots are its counts (README, "Closed relations").
 */
export const ModelPositions = closed.relation(
  "ModelPositions",
  { model: closedId(ContentModel), positions: natural },
  ["model"],
  grammar.content.modelPositions.rows.map(({ model, positions }) => ({
    model,
    positions: BigInt(positions),
  })),
);

/**
 * A content position of an automaton, a slot of its model's `ModelPositions` count.
 */
const familyPosition = slot(closedId(Position), fin(ModelPositions, "positions"));

// The content grammar (N5, N7).

/**
 * `AdmissionIn`: (map, child) → position, each admission map's children at their positions in
 * their parent's content model, 0 for character data and for a kind several positions name: the
 * function `Admission` states per family (`compose.ts`), stated per map ({@link AdmissionMap}).
 */
export const AdmissionIn = closed.relation(
  "AdmissionIn",
  { child: closedId(NodeKind), map: closedId(AdmissionMap), position: closedId(Position) },
  ["map", "child"],
  grammar.content.admissionIn.rows.map(({ child, map, position }) => ({
    child: memberOf(grammar.kinds.nodeKind, child),
    map,
    position,
  })),
);

/**
 * The states, as `model state`, at which a family of a content model may end: the content grammar's
 * `Last`, 0 where a family may be empty. Each is a state of its model, so `FollowSetOf`, keyed by
 * every state, states it as its `ends` payload, and no relation of its own repeats the keys.
 */
const endingStates: ReadonlySet<string> = new Set(
  grammar.content.last.rows.map(({ model, position }) => `${model} ${position}`),
);

/**
 * The `FollowSet` roster: every distinct follow set of a content model's state, numbered from 0
 * (`content.ts`): `FollowSetOf` names one per state, and `FollowMember` holds each set's positions
 * once, however many states of however many models share it.
 */
export const FollowSet = closed(
  "FollowSet",
  nonEmpty("FollowSet", grammar.content.followSets.handles),
);

/**
 * `FollowSetOf`: (model, from) → (set, ends), total over each content model's states, `from` 0 the
 * start: the set of the positions a child may take after one at `from`, in the model's automaton,
 * and whether a family may end at `from` (the content grammar's `Last`). N5 reads
 * `FollowMember.row(FollowSetOf.at("set", model, was))`, which holds exactly the positions the
 * automaton's transitions from `was` reach, and N7 `FollowSetOf.at("ends", model, lastState)`,
 * which holds exactly where `Last` held `(model, lastState)`.
 */
export const FollowSetOf = closed.relation(
  "FollowSetOf",
  {
    ends: pg.boolean,
    from: familyPosition,
    model: closedId(ContentModel),
    set: closedId(FollowSet),
  },
  ["model", "from"],
  grammar.content.followSetOf.rows.map(({ from, model, set }) => ({
    ends: endingStates.has(`${model} ${from}`),
    from,
    model,
    set,
  })),
);

/**
 * `FollowMember`: the set of (set, to) where a follow set holds position `to`. The empty set, a
 * state nothing follows, has no row.
 */
export const FollowMember = closed.relation(
  "FollowMember",
  { set: closedId(FollowSet), to: closedId(Position) },
  ["set", "to"],
  grammar.content.followMember.rows.map(({ set, to }) => ({ set, to })),
);

/**
 * `SharedModelOf`: (version, parent) → model, the shared model of each family a kind names at
 * several positions. A family no kind names so has no row (`SharedModelOf.has`).
 */
export const SharedModelOf = closed.relation(
  "SharedModelOf",
  { model: closedId(SharedModel), parent: closedId(NodeKind), version: closedId(SchemaVersion) },
  ["version", "parent"],
  grammar.content.sharedModelOf.rows.map(({ model, parent, version }) => ({
    model,
    parent: memberOf(grammar.kinds.nodeKind, parent),
    version,
  })),
);

/**
 * The `SymbolSet` roster: every distinct set of positions a shared model names a kind at, as the
 * content grammar numbers them (`#pantry/grammar/content.ts`): 3,282 (model, kind) pairs hold 333
 * sets, so N5 reads a shared kind's positions as `SymbolMember.row(SymbolSetOf.at("set", model,
 * kind))`.
 */
export const SymbolSet = closed(
  "SymbolSet",
  nonEmpty("SymbolSet", grammar.content.symbolSets.handles),
);

/**
 * `SymbolSetOf`: (model, kind) → set, the positions a shared model names the kind at, so the state
 * decides which (N5c), for each kind several positions of the model name. Each (version, parent)
 * family reads its model through `SharedModelOf`; a kind of no row is named at one position or
 * none, which a law reads through `SymbolSetOf.has`.
 */
export const SymbolSetOf = closed.relation(
  "SymbolSetOf",
  { kind: closedId(NodeKind), model: closedId(SharedModel), set: closedId(SymbolSet) },
  ["model", "kind"],
  grammar.content.symbolSetOf.rows.map(({ kind, model, set }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    model,
    set,
  })),
);

/**
 * `SymbolMember`: the set of (set, position) where a symbol set holds the position.
 */
export const SymbolMember = closed.relation(
  "SymbolMember",
  { position: closedId(Position), set: closedId(SymbolSet) },
  ["set", "position"],
  grammar.content.symbolMember.rows,
);

/**
 * Index a generator's rows by (version, parent), refusing a family with two of them: the law over
 * the rows names one position per family (N7).
 *
 * @param name - The relation the rows are stated as, for the defect's message.
 * @param rows - The generator's rows.
 * @returns Each family's row, by `<version> <parent>`.
 * @throws {Error} When two rows name one family, which no vocabulary states today.
 */
const onePerFamily = <R extends { readonly parent: string; readonly version: string }>(
  name: string,
  rows: readonly R[],
): ReadonlyMap<string, R> => {
  const held = new Map<string, R>();
  for (const row of rows) {
    const family = `${row.version} ${row.parent}`;
    if (held.has(family)) {
      throw new Error(
        `${name} reads one position per (version, parent), and the grammar states two under ${row.parent} in ${row.version}. State the law per position, or merge the positions into one.`,
      );
    }

    held.set(family, row);
  }

  return held;
};

/**
 * Whether a `Counted` row bounds its position to at most one child: a reading's cap (spec reading
 * 130), which {@link Capped} states, where every other row is a count {@link CountedOf} states.
 *
 * @param row - The row.
 * @returns Whether its bounds are 0 and 1.
 */
const atMostOnce = (row: { readonly max: number; readonly min: number }): boolean =>
  row.min === 0 && row.max === 1;

/**
 * Today's `Counted` rows but the caps, one per family: {@link onePerFamily}.
 */
const countedByFamily = onePerFamily(
  "CountedOf",
  grammar.content.counted.rows.filter((row) => !atMostOnce(row)),
);

/**
 * Today's `ChildBarredBy` rows, one per family: {@link onePerFamily}.
 */
const barredByFamily = onePerFamily("BarredOf", grammar.barredBy.rows);

/**
 * Convert a count bound to a natural, an unbounded maximum being `int8Max`, the bound that bounds
 * nothing.
 *
 * @param bound - A bound as `Counted` states it, `Infinity` for none.
 * @returns The natural.
 */
const naturalOf = (bound: number): bigint => (Number.isFinite(bound) ? BigInt(bound) : int8Max);

/**
 * Read the attribute slot a barring's attribute takes under its parent's own governor.
 *
 * @param barring - The barring's family and attribute.
 * @param barring.name - The attribute whose presence bars.
 * @param barring.parent - The parent kind.
 * @param barring.version - The version.
 * @returns The attribute's slot in the parent's `AttributeGrammar`.
 * @throws {Error} When the parent admits no such attribute, so the barring names a slot it has
 *   not; `ChildBarredBy` is stated only for attributes its parents declare.
 */
const barringSlot = (barring: {
  readonly name: string;
  readonly parent: string;
  readonly version: Version;
}): string =>
  Option.getOrThrowWith(
    Option.map(
      grammar.attributes.admission.lookup({
        kind: barring.parent,
        name: barring.name,
        version: barring.version,
      }),
      ({ position }) => position,
    ),
    () =>
      new Error(
        `BarredOf bars ${barring.parent}'s children by its attribute ${barring.name} in ${barring.version}, which ${barring.parent}'s attribute grammar does not admit, so the barring has no slot. Bar by an attribute ${barring.parent} declares.`,
      ),
  );

/**
 * `CountedOf`: (version, parent) → (position, min, max), the one position of a family whose count
 * is a law beside its automaton, with its bounds (C25: `qti-simple-match-set` under
 * `qti-match-interaction`). A family whose count is no such law has no row, and N7 Counted holds of
 * it through `CountedOf.has` (README, "Closed relations").
 */
export const CountedOf = closed.relation(
  "CountedOf",
  {
    max: natural,
    min: natural,
    parent: closedId(NodeKind),
    position: closedId(Position),
    version: closedId(SchemaVersion),
  },
  ["version", "parent"],
  [...countedByFamily.values()].map(({ max, min, parent, position, version }) => ({
    max: naturalOf(max),
    min: naturalOf(min),
    parent: memberOf(grammar.kinds.nodeKind, parent),
    position,
    version,
  })),
);

/**
 * `Capped`: the set of (version, parent, position) where at most one child of a family stands, the
 * `Counted` rows whose bounds are 0 and 1 (spec reading 130: the loose LOM binding's Schematron
 * caps). A family may hold several, so they are no total function of the family as {@link CountedOf}
 * is: `node.ts` holds them by a key over each family's children at a capped position, `(parent,
 * state)`, which no count fold needs. It is keyed by the family, not by its {@link ContentModel} as
 * {@link Last} is: a model is an automaton, whose positions name no kind, so families of other kinds
 * share a LOM category's model, and a cap keyed by model would cap them too.
 */
export const Capped = closed.relation(
  "Capped",
  {
    parent: closedId(NodeKind),
    position: closedId(Position),
    version: closedId(SchemaVersion),
  },
  ["version", "parent", "position"],
  grammar.content.counted.rows.filter(atMostOnce).map(({ parent, position, version }) => ({
    parent: memberOf(grammar.kinds.nodeKind, parent),
    position,
    version,
  })),
);

/**
 * `BarredOf`: (version, parent) → (slot, position), the attribute slot whose presence bars a
 * family's children at the position (C25: `colgroup`'s `span`). The slot is the barring attribute's
 * position in `AttributeGrammar`. A family nothing bars has no row, and N7 barred by holds of it
 * through `BarredOf.has` (README, "Closed relations").
 *
 * The slot is read under the parent kind's own governor, never under the type an `xsi:type` makes
 * govern it, and that is exact: an `xsi:type` may name only the declared type or one validly
 * derived from it (XML Schema 1.0 Part 1, §3.3.4, clause 4.3), and no named type of either ASI XSD
 * derives from `colgroup`'s `ColGroupDType` (`imsqti_asiv3p0_v1p0.xsd` line 26095,
 * `imsqti_asiv3p0p1_v1p0.xsd` line 26241; the `XsiType` rows of `colgroup` are `ColGroupDType`
 * alone, in both versions), so a `colgroup` with an `xsi:type` is governed by its own kind and
 * reads its own slot layout.
 */
export const BarredOf = closed.relation(
  "BarredOf",
  {
    parent: closedId(NodeKind),
    position: closedId(Position),
    slot: closedId(AttributeSlot),
    version: closedId(SchemaVersion),
  },
  ["version", "parent"],
  [...barredByFamily.values()].map(({ name, parent, position, version }) => ({
    parent: memberOf(grammar.kinds.nodeKind, parent),
    position,
    slot: barringSlot({ name, parent, version }),
    version,
  })),
);

/**
 * `StrictlyHeld`: the set of (version, parent, child) where only `strict` wildcards of the parent's
 * model admit the foreign kind, so the child stands only under an `xsi:type` its document's schema
 * set resolves (spec reading 81).
 */
export const StrictlyHeld = closed.relation(
  "StrictlyHeld",
  {
    child: closedId(NodeKind),
    parent: closedId(NodeKind),
    version: closedId(SchemaVersion),
  },
  ["version", "parent", "child"],
  grammar.content.strictlyHeld.rows.map(({ child, parent, version }) => ({
    child: memberOf(grammar.kinds.nodeKind, child),
    parent: memberOf(grammar.kinds.nodeKind, parent),
    version,
  })),
);

// Ancestry (N6, C7).

/**
 * Read one of the ancestry generator's three sets as grizzle rows.
 *
 * @param set - `Enters`, `Banned` or `Needs`.
 * @returns Its (kind, flag) rows.
 */
const kindFlags = (set: ComposedGrammar["ancestry"]["banned"]) =>
  set.rows.map(({ flag, kind }) => ({ flag, kind: memberOf(grammar.kinds.nodeKind, kind) }));

/**
 * `Enters`: the set of (kind, flag) where an element of the kind enters the flag for its
 * descendants: `ancestry = parentAncestry ∪ Enters.row(kind)`.
 */
export const Enters = closed.relation(
  "Enters",
  { flag: closedId(Flag), kind: closedId(NodeKind) },
  ["kind", "flag"],
  kindFlags(grammar.ancestry.enters),
);

/**
 * `Banned`: the set of (kind, flag) where an element of the kind may not stand under the flag.
 */
export const Banned = closed.relation(
  "Banned",
  { flag: closedId(Flag), kind: closedId(NodeKind) },
  ["kind", "flag"],
  kindFlags(grammar.ancestry.banned),
);

/**
 * `Needs`: the set of (kind, flag) where an element of the kind must stand under the flag.
 */
export const Needs = closed.relation(
  "Needs",
  { flag: closedId(Flag), kind: closedId(NodeKind) },
  ["kind", "flag"],
  kindFlags(grammar.ancestry.needs),
);

// Types (N12).

/**
 * `XsiType`: the set of (version, kind, type) where an element of the kind may name the type in
 * `xsi:type`, validly derived from its declared type, the declared type among them.
 */
export const XsiType = closed.relation(
  "XsiType",
  { kind: closedId(NodeKind), type: closedId(TypeName), version: closedId(SchemaVersion) },
  ["version", "kind", "type"],
  grammar.xsi.xsiType.rows.map(({ kind, type, version }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    type,
    version,
  })),
);

/**
 * `AnonymousType`: the set of (version, kind) whose content model declares an anonymous type, so
 * an element of the kind stands with no named governing type and has no `XsiType` row: no named
 * type derives from an anonymous one.
 */
export const AnonymousType = closed.relation(
  "AnonymousType",
  { kind: closedId(NodeKind), version: closedId(SchemaVersion) },
  ["version", "kind"],
  grammar.xsi.anonymousType.rows.map(({ kind, version }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    version,
  })),
);

// Attributes and texts under their governor (AL1 to AL3, text-copy; spec readings 60 and 84).

/**
 * The governor of each (version, kind, governs) the grammar's `Governor` relation holds, by
 * `<version> <kind> <governs>`.
 */
const governorAt: ReadonlyMap<string, string> = new Map(
  grammar.attributes.governor.rows.map(
    ({ governor, governs, kind, version }) => [`${version} ${kind} ${governs}`, governor] as const,
  ),
);

/**
 * State `GoverningOf`'s rows, on every (version, kind, governs) a law admits an element's named
 * governing type at:
 *
 * - Each `XsiType` row, governed by the grammar's governor of the triple, else by the kind itself;
 * - Each foreign kind under every type, by its simple governor where the grammar holds one, else by
 *   the kind.
 *
 * A node no named type governs reads no row: its governor is its kind's own ({@link KindGovernor}).
 *
 * @returns The rows, each (version, kind, governs) once.
 * @throws {Error} When the two sources give one triple two governors, which none does today.
 */
const governingRows = () => {
  const rows = new Map<
    string,
    {
      readonly governor: string;
      readonly governs: string;
      readonly kind: Kind;
      readonly version: Version;
    }
  >();
  const add = (version: Version, kind: Kind, governs: string) => {
    const at = `${version} ${kind} ${governs}`;
    const row = {
      // A triple the attribute grammar gives no governor is governed by its kind.
      governor: Option.match(Option.fromNullishOr(governorAt.get(at)), {
        onNone: (): string => kind,
        onSome: (governor) => governor,
      }),
      governs,
      kind,
      version,
    };
    const held = rows.get(at);
    if (held !== undefined && held.governor !== row.governor) {
      throw new Error(
        `GoverningOf states two governors of ${kind} under ${governs} in ${version}: ${held.governor} and ${row.governor}. Give the triple one governor in the attribute grammar.`,
      );
    }

    rows.set(at, row);
  };
  for (const { kind, type, version } of grammar.xsi.xsiType.rows) {
    add(version, memberOf(grammar.kinds.nodeKind, kind), type);
  }

  for (const version of grammar.kinds.versions.handles) {
    for (const kind of openElementClasses) {
      for (const type of grammar.xsi.typeName.handles) {
        add(version, kind, type);
      }
    }
  }

  return [...rows.values()];
};

/**
 * `GoverningOf`: (version, kind, governs) → governor, what an element of the kind under the named
 * type reads its attributes and text by, at every triple a law admits the type at. A law reads it
 * where an element's type is a row of its own (`ElementType`, `OpenElementType`), and states the
 * kind's own governor where the triple is absent ({@link KindGovernor}): an `xsi:type` naming a
 * type its kind's declared type does not derive, which `XsiType derived` refuses.
 */
export const GoverningOf = closed.relation(
  "GoverningOf",
  {
    governor: closedId(Governor),
    governs: closedId(TypeName),
    kind: closedId(NodeKind),
    version: closedId(SchemaVersion),
  },
  ["version", "kind", "governs"],
  governingRows(),
);

/**
 * `KindGovernor`: kind → governor, each kind's own `Governor` handle, what a node no named type
 * governs reads its attributes and text by: a node that is no element, an element of an anonymous
 * declared type, and a foreign element its `xsi:type` gives no type.
 */
export const KindGovernor = closed.relation(
  "KindGovernor",
  { governor: closedId(Governor), kind: closedId(NodeKind) },
  ["kind"],
  grammar.kinds.nodeKind.handles.map((kind) => ({ governor: asGovernor(kind), kind })),
);

/**
 * The attribute grammar as the generators state it, a row per (version, governor, name): each
 * attribute an element may carry under its governor in the version, with its value domain, its use
 * and its slot among the names the (version, governor) admits, slots 0 to n − 1. A kind's own rows
 * are the grammar's `AttributeGrammar`, a governing type's its `GovernedAttribute`. The installed
 * relations restate it by attribute model ({@link AttributeGrammar}); the host reads these rows.
 */
export const attributeRows = [
  ...grammar.attributes.admission.rows.map(({ domain, kind, name, position, use, version }) => ({
    domain,
    governor: asGovernor(kind),
    name: memberOf(grammar.kinds.attributeName, name),
    position,
    use,
    version: memberOf(grammar.kinds.versions, version),
  })),
  ...grammar.attributes.governed.rows.map(({ domain, governor, name, position, use, version }) => ({
    domain,
    governor: asGovernor(governor),
    name: memberOf(grammar.kinds.attributeName, name),
    position,
    use,
    version: memberOf(grammar.kinds.versions, version),
  })),
];

/**
 * One attribute row of {@link attributeRows}.
 */
type AttributeRow = (typeof attributeRows)[number];

/**
 * The attribute models the grammar is keyed by: two (version, governor) pairs whose rows are equal,
 * name, domain, use and slot alike, are one model (rule 0), so a few hundred models stand for every
 * (version, governor) the `Governor` roster holds, read in code order, the empty set among them. A
 * model is named by its first governor, or by `<version> <governor>` where an earlier model took
 * that name, so every handle is a governor's or six bytes longer, within a PostgreSQL name.
 */
const attributeModels = (() => {
  const byGovernor = Map.groupBy(attributeRows, (row) => `${row.version} ${row.governor}`);
  const models: { readonly handle: string; readonly rows: readonly AttributeRow[] }[] = [];
  const bySignature = new Map<string, string>();
  const named = new Set<string>();
  const families = grammar.kinds.versions.handles.flatMap((version) =>
    Governor.handles.map((governor) => {
      const at = `${version} ${governor}`;
      // A governor no attribute row names admits the empty set.
      const rows = rowsAt(byGovernor, at).toSorted(
        (left, right) => Number(left.position) - Number(right.position),
      );
      const signature = rows
        .map(({ domain, name, position, use }) => `${position}:${name}:${domain}:${use}`)
        .join(" ");
      const model = bySignature.getOrInsertComputed(signature, () => {
        const fresh = named.has(governor) ? at : governor;
        named.add(fresh);
        models.push({ handle: fresh, rows });

        return fresh;
      });

      return { governor, model, version };
    }),
  );

  return { families, models };
})();

/**
 * The `AttributeModel` roster: every distinct attribute grammar of a (version, governor), named by
 * its first governor, {@link AttributeGrammar} keyed by it.
 */
export const AttributeModel = closed(
  "AttributeModel",
  nonEmpty(
    "AttributeModel",
    attributeModels.models.map(({ handle }) => handle),
  ),
);

/**
 * A generated value as a `AttributeModel` handle ({@link handleLookup}).
 */
const asAttributeModel = handleLookup("AttributeModel", AttributeModel.handles);

/**
 * `AttributeModelOf`: (version, governor) → model, total, the attribute grammar an element under
 * the governor reads in the version, read by AL1 to AL3 as `AttributeModelOf.at("model", version,
 * governor)`.
 */
export const AttributeModelOf = closed.relation(
  "AttributeModelOf",
  {
    governor: closedId(Governor),
    model: closedId(AttributeModel),
    version: closedId(SchemaVersion),
  },
  ["version", "governor"],
  attributeModels.families.map(({ governor, model, version }) => ({
    governor,
    model: asAttributeModel(model),
    version,
  })),
);

/**
 * `AttributeSlots`: model → slots, the number of attributes each model admits, whose slots 0 to
 * n − 1 key {@link Required}'s and {@link CountedSlot}'s blocks (README, "Closed relations").
 */
export const AttributeSlots = closed.relation(
  "AttributeSlots",
  { model: closedId(AttributeModel), slots: natural },
  ["model"],
  attributeModels.models.map(({ handle, rows }) => ({
    model: asAttributeModel(handle),
    slots: BigInt(rows.length),
  })),
);

/**
 * A slot of an attribute model, a slot of its `AttributeSlots` count.
 */
const modelSlot = slot(closedId(AttributeSlot), fin(AttributeSlots, "slots"));

/**
 * `AttributeGrammar`: (model, name) → (slot, domain, use), each attribute a model admits: its slot
 * among the model's names, one of the slots 0 to n − 1 of its `AttributeSlots` count, its value
 * domain and its use. Every law reads an element's attribute by its name (AL1, AL2's slot and the
 * value domain), so the relation is keyed by name: an unadmitted name reads no row, and
 * `AttributeGrammar.row(model)` is the set of the model's names.
 */
export const AttributeGrammar = closed.relation(
  "AttributeGrammar",
  {
    domain: closedId(ValueDomain),
    model: closedId(AttributeModel),
    name: closedId(AttributeName),
    slot: closedId(AttributeSlot),
    use: closedId(Use),
  },
  ["model", "name"],
  attributeModels.models.flatMap(({ handle, rows }) =>
    rows.map(({ domain, name, position, use }) => ({
      domain,
      model: asAttributeModel(handle),
      name,
      slot: position,
      use,
    })),
  ),
);

/**
 * `Required`: the set of (model, slot) where an element under a governor of the model must carry
 * the attribute at the slot, `AttributeGrammar`'s rows of use `required` (C7), read as
 * `Required.row(model)` by AL3.
 */
export const Required = closed.relation(
  "Required",
  { model: closedId(AttributeModel), slot: modelSlot },
  ["model", "slot"],
  AttributeGrammar.rows
    .filter(({ use }) => use === "required")
    .map(({ model, slot: at }) => ({ model, slot: at })),
);

/**
 * The attribute models a count of `attributeCounts` judges (spec readings 41 and 43), each with
 * its count: the model each element of a counted kind reads under its governor, its counted slots
 * the slots of the count's names the model admits, and its bounds, an unbounded `max` written as
 * the number of those slots, which no count exceeds. A name a model does not admit has no slot, so
 * it counts nothing, as the oracle reads it.
 *
 * A model is shared by every (version, governor) of one attribute grammar, so a counted model
 * another kind reads, or two counts read, would judge that kind by a count that is not its own:
 * the grammar has neither, and a change that makes one throws here rather than install it.
 */
const countedModels = (() => {
  const modelAt = new Map(
    AttributeModelOf.rows.map(({ governor, model, version }) => [`${version} ${governor}`, model]),
  );
  const modelOfRow = ({ governor, version }: (typeof GoverningOf.rows)[number]) => {
    const model = modelAt.get(`${version} ${governor}`);
    if (model === undefined) {
      throw new Error(
        `The governor ${governor} has no attribute model in version ${version}, though AttributeModelOf is total; correct its rows.`,
      );
    }

    return model;
  };
  const counts = new Map<string, AttributeCount>();
  for (const row of GoverningOf.rows) {
    const count = attributeCounts.find(({ kind }) => kind === row.kind);
    if (count !== undefined) {
      const model = modelOfRow(row);
      const earlier = counts.get(model);
      if (earlier !== undefined && earlier !== count) {
        throw new Error(
          `The attribute model ${model} is read by the counted kinds ${earlier.kind} and ${count.kind}, whose counts differ; give each its own model.`,
        );
      }

      counts.set(model, count);
    }
  }

  for (const row of GoverningOf.rows) {
    const model = modelOfRow(row);
    if (counts.has(model) && !attributeCounts.some(({ kind }) => kind === row.kind)) {
      throw new Error(
        `The attribute model ${model} is read by ${row.kind}, which no attribute count names, and by ${counts.get(model)?.kind ?? model}, which one does; give the counted kind its own model.`,
      );
    }
  }

  return [...counts].map(([model, { max, min, names }]) => {
    const slots = AttributeGrammar.rows
      .filter((row) => row.model === model && names.includes(row.name))
      .map(({ slot: at }) => at);

    return { max: BigInt(Math.min(max, slots.length)), min: BigInt(min), model, slots };
  });
})();

/**
 * `CountedSlot`: the set of (model, slot) where the attribute at the slot counts toward its model's
 * `AttributeCountOf`, read as `CountedSlot.row(model)` by AL5.
 */
export const CountedSlot = closed.relation(
  "CountedSlot",
  { model: closedId(AttributeModel), slot: modelSlot },
  ["model", "slot"],
  countedModels.flatMap(({ model, slots }) => slots.map((at) => ({ model, slot: at }))),
);

/**
 * `AttributeCountOf`: model → (min, max), how many of its `CountedSlot` attributes an element under
 * a governor of the model carries (spec readings 41 and 43), a model of no count having no row,
 * which AL5 reads through `AttributeCountOf.has`.
 */
export const AttributeCountOf = closed.relation(
  "AttributeCountOf",
  { max: pg.bigint, min: pg.bigint, model: closedId(AttributeModel) },
  ["model"],
  countedModels.map(({ max, min, model }) => ({ max, min, model })),
);

/**
 * `ValueDomainOf`: domain → (primitive, pattern), each value domain's primitive and the pattern its
 * lexical forms match as written, its lexical space. AL1 and the text law read `pattern` through
 * `Compute.matches`, whose pattern term must meet its subject's type, so `pattern` is plain text,
 * no contract.
 */
export const ValueDomainOf = closed.relation(
  "ValueDomainOf",
  {
    domain: closedId(ValueDomain),
    pattern: anyText,
    primitive: closedId(DomainPrimitive),
  },
  ["domain"],
  grammar.attributes.valueDomain.rows.map(({ domain, pattern, primitive }) => ({
    domain,
    pattern,
    primitive,
  })),
);

/**
 * `DoubleBound`: domain → (facet, value), the lower bound of each domain whose typed value carries
 * one, a double's or a float's (`DoubleBound` of `#pantry/grammar/domains.ts`). No pattern states
 * it, since whether a literal clears it turns on IEEE rounding; the bound law reads it on the
 * database's parse of the form (`#pantry/qti/attributes.ts`).
 */
export const DoubleBound = closed.relation(
  "DoubleBound",
  { domain: closedId(ValueDomain), facet: closedId(BoundFacet), value: pg.float8 },
  ["domain"],
  grammar.attributes.doubleBound.rows.map(({ domain, facet, value }) => ({ domain, facet, value })),
);

/**
 * The empty value domains: each `ValueDomain` handle whose lexical space holds no value, so it has
 * no `ValueDomainOf` row and no pattern, and no lexical form is in it (`emptyDomains` of the
 * attribute grammar): `xs:NOTATION`'s in the pinned grammar, the text domain of a foreign element
 * whose `xsi:type` names it (C47). A law refuses a value of one by `¬in(domain, emptyDomains)`,
 * since grizzle admits no pattern no text matches (`scalar/regex/admit.ts:98-102`, `matchPattern`).
 */
export const emptyDomains: readonly (typeof ValueDomain.handles)[number][] =
  grammar.attributes.emptyDomains.map((domain) => asValueDomain(domain));

/**
 * The domains whose typed value a bound judges: each with a {@link DoubleBound} row, whose
 * attributes' and texts' forms the bound law parses as doubles.
 */
export const boundedDomains: readonly (typeof ValueDomain.handles)[number][] =
  grammar.attributes.doubleBound.rows.map(({ domain }) => asValueDomain(domain));

/**
 * `ValueIdentity`: domain → identity, the identity type of each domain that has one, so an overlay
 * selects the attributes whose domain is an `xs:ID` or carries `xs:IDREF` tokens. A domain of no
 * identity has no row, which a law reads through `ValueIdentity.has`.
 */
export const ValueIdentity = closed.relation(
  "ValueIdentity",
  { domain: closedId(ValueDomain), identity: closedId(Identity) },
  ["domain"],
  grammar.attributes.identity.rows.map(({ domain, identity }) => ({
    domain: asValueDomain(domain),
    identity,
  })),
);

/**
 * The simple-content domain of each (version, governor) the grammar states one for: a kind's text
 * (`TextDomain`) under the kind, a named type's (`TypeText`) under each governor of that type.
 */
const textDomainAt: ReadonlyMap<string, string> = new Map([
  ...grammar.attributes.text.rows.map(
    ({ domain, kind, version }) => [`${version} ${kind}`, domain] as const,
  ),
  ...grammar.attributes.governor.rows.flatMap(({ governs, kind, version }) =>
    Option.toArray(grammar.attributes.typeText.lookup({ governs, version })).map(
      ({ domain }) => [`${version} ${kind} ${governs}`, domain] as const,
    ),
  ),
]);

/**
 * `TextDomain`: (version, governor) → domain, the value domain an element under the governor holds
 * its text in: its kind's simple content for a kind, the governing type's for a (kind, type). A
 * governor with no simple content has no row, and no law reads its text in a domain
 * (`TextDomain.has`).
 */
export const TextDomain = closed.relation(
  "TextDomain",
  { domain: closedId(ValueDomain), governor: closedId(Governor), version: closedId(SchemaVersion) },
  ["version", "governor"],
  grammar.kinds.versions.handles.flatMap((version) =>
    Governor.handles.flatMap((governor) =>
      Option.toArray(Option.fromNullishOr(textDomainAt.get(`${version} ${governor}`))).map(
        (domain) => ({ domain: asValueDomain(domain), governor, version }),
      ),
    ),
  ),
);

/**
 * `KindNamespace`: kind → namespace, the namespace name an element of the kind is written in, for
 * every element kind a vocabulary declares; the foreign kinds keep theirs in `OpenElementName`.
 */
export const KindNamespace = closed.relation(
  "KindNamespace",
  { kind: closedId(NodeKind), namespace: anyText },
  ["kind"],
  grammar.kinds.elementName.rows.map(({ kind, namespace }) => ({ kind, namespace })),
);

// Foreign names (C8, C15, C36; `names.ts`).

/**
 * `KindByNameUnder`: (version, parent) → names, for every (version, parent) that admits a foreign
 * element: the pattern of the expanded names, `namespace}local` (`expandedText` of `names.ts`), of
 * the element kinds the parent admits there. A name the parent admits resolves to its kind, so no
 * foreign element under it holds one (C8): `¬Compute.matches(expanded,
 * KindByNameUnder.at("names", version, parentKind))`, where `expanded` is
 * `Compute.concat(Compute.concat(namespace, "}"), local)`.
 *
 * A foreign element's name is open text, and a closed relation is keyed by closed ids only, so the
 * relation is keyed by what the law has, (version, parent), not by the name.
 */
export const KindByNameUnder = closed.relation(
  "KindByNameUnder",
  { names: anyText, parent: closedId(NodeKind), version: closedId(SchemaVersion) },
  ["version", "parent"],
  grammar.kindByNameUnder.rows.map(({ names, parent, version }) => ({
    names,
    parent: memberOf(grammar.kinds.nodeKind, parent),
    version,
  })),
);

/**
 * `HeldRootsUnder`: (version, parent) → names, for every (version, parent) that holds a foreign
 * element only under `strict` wildcards (`StrictlyHeld`): the pattern of the expanded names,
 * `namespace}local`, of spec reading 6's roots its strict wildcards assess against the global
 * declarations of its documents' schema set (C13, `cp:manifest` under `drd:accessForAllResource`),
 * `^$` where there is none. Such a root is stored as a foreign element and governed by no type, and
 * Strictly held lets it stand: the foreign elements that need a type, which hold an
 * `OpenElementType`, are those with `StrictlyHeld(version, parentKind, kind) ∧
 * ¬Compute.matches(Compute.concat(Compute.concat(namespace, "}"), local),
 * HeldRootsUnder.at("names", version, parentKind))`.
 */
export const HeldRootsUnder = closed.relation(
  "HeldRootsUnder",
  { names: anyText, parent: closedId(NodeKind), version: closedId(SchemaVersion) },
  ["version", "parent"],
  grammar.heldRootsUnder.rows.map(({ names, parent, version }) => ({
    names,
    parent: memberOf(grammar.kinds.nodeKind, parent),
    version,
  })),
);

/**
 * `TypeAvailable`: type → namespaces, total over `TypeName`: the pattern of the vocabulary
 * namespaces under whose elements an element's `xsi:type` may name the type, every namespace for
 * XML Schema's own types (spec readings 60 and 81; C15, C36). An element whose parent's namespace
 * is no vocabulary's stands in documents of every schema set, so it may name any type: the law
 * over a foreign element's `OpenElementType` is `Compute.matches(parentNamespace,
 * TypeAvailable.at("namespaces", type)) ∨ ¬Compute.matches(parentNamespace,
 * vocabularyNamespacePattern)`.
 */
export const TypeAvailable = closed.relation(
  "TypeAvailable",
  { namespaces: anyText, type: closedId(TypeName) },
  ["type"],
  grammar.typeAvailable.rows.map(({ namespaces, type }) => ({ namespaces, type })),
);

/**
 * The pattern of every vocabulary's namespace, the literal `TypeAvailable`'s law reads to find a
 * parent whose namespace is no vocabulary's, every such one, the empty namespace included.
 */
export const vocabularyNamespacePattern: string = vocabularyNamespacesPattern(
  grammar.kinds.elementName.rows.map(({ namespace }) => namespace),
);

// Files (spec reading 103).

/**
 * `ReferenceAttribute`: (version, kind, name) → form, every attribute by which an element of a kind
 * names a file of its package in the version, and how its value names it: R6's census, IMS Content
 * Packaging 1.2's InterchangePackage (d) (spec reading 103). A law reads it as
 * `ReferenceAttribute.at("form", version, kind, name)`, absent for an attribute of no census row.
 */
export const ReferenceAttribute = closed.relation(
  "ReferenceAttribute",
  {
    form: closedId(ReferenceForm),
    kind: closedId(NodeKind),
    name: closedId(AttributeName),
    version: closedId(SchemaVersion),
  },
  ["version", "kind", "name"],
  grammar.references.referenceAttribute.rows.map(({ form, kind, name, version }) => ({
    form,
    kind: memberOf(grammar.kinds.nodeKind, kind),
    name: memberOf(grammar.kinds.attributeName, name),
    version,
  })),
);

// Expressions and interactions (O3 to O5).

/**
 * `OperatorArity`: kind → (min, max), the fewest and the most operands an expression kind admits,
 * `int8Max` for no upper bound.
 */
export const OperatorArity = closed.relation(
  "OperatorArity",
  { kind: closedId(NodeKind), max: natural, min: natural },
  ["kind"],
  grammar.operatorArity.rows.map(({ kind, max, min }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    max,
    min,
  })),
);

/**
 * The `CnType` roster: the `type` values of a MathML `cn` whose content takes a form
 * ({@link cnForms}); every other `type` is text and is no handle.
 */
export const CnType = closed("CnType", nonEmpty("CnType", [...cnForms.keys()]));

/**
 * A generated value as a `CnType` handle ({@link handleLookup}).
 */
const asCnType = handleLookup("CnType", CnType.handles);

/**
 * The `CnPartForm` roster: the forms a part of a `cn`'s content takes ({@link cnForms}), in the
 * order a type first states them.
 */
export const CnPartForm = closed(
  "CnPartForm",
  nonEmpty("CnPartForm", [...new Set([...cnForms.values()].flat())]),
);

/**
 * A generated value as a `CnPartForm` handle ({@link handleLookup}).
 */
const asCnPartForm = handleLookup("CnPartForm", CnPartForm.handles);

/**
 * The `CnPart` roster: a part's place among the parts of a `cn`'s content, the numerals 0 to the
 * most any type holds ({@link cnForms}). The last place is one no type lists: a `cn` with more
 * parts than its type writes a row there, which `CnForm` lists for no type, and its drawn count
 * passes `CnParts`' for no type, so the database refuses it. It is appended, so `"0"` and `"1"`
 * keep their codes.
 */
export const CnPart = closed(
  "CnPart",
  nonEmpty(
    "CnPart",
    Arr.range(0, Math.max(...[...cnForms.values()].map((forms) => forms.length))).map(String),
  ),
);

/**
 * The `CnBase` roster: the radixes of a `cn`'s digits, the numerals 2 to 36 ({@link cnPatternOf}).
 */
export const CnBase = closed("CnBase", nonEmpty("CnBase", Arr.range(2, 36).map(String)));

/**
 * `MathArity`: Content MathML operator kind → (min, max), the fewest and the most arguments its
 * `m:apply` takes ({@link mathArities}), `int8Max` for no upper bound.
 */
export const MathArity = closed.relation(
  "MathArity",
  { kind: closedId(NodeKind), max: natural, min: natural },
  ["kind"],
  [...mathArities].map(([kind, { max, min }]) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    max: naturalOf(max),
    min: naturalOf(min),
  })),
);

/**
 * `MathHeadOperator`: the set of operator kinds the head-qualifier law judges
 * ({@link mathHeadOperators}).
 */
export const MathHeadOperator = closed.relation(
  "MathHeadOperator",
  { kind: closedId(NodeKind) },
  ["kind"],
  [...mathHeadOperators].map((kind) => ({ kind: memberOf(grammar.kinds.nodeKind, kind) })),
);

/**
 * `HeadQualifier`: the set of (head, qualifier) where an operator's syntax table lists the
 * qualifier beside its arguments ({@link mathHeadQualifiers}).
 */
export const HeadQualifier = closed.relation(
  "HeadQualifier",
  { head: closedId(NodeKind), qualifier: closedId(NodeKind) },
  ["head", "qualifier"],
  mathHeadQualifiers.map(({ head, qualifier }) => ({
    head: memberOf(grammar.kinds.nodeKind, head),
    qualifier: memberOf(grammar.kinds.nodeKind, qualifier),
  })),
);

/**
 * `CnParts`: type → parts, how many parts a `cn` of the type holds, the count of its {@link CnForm}
 * rows.
 */
export const CnParts = closed.relation(
  "CnParts",
  { parts: natural, type: closedId(CnType) },
  ["type"],
  [...cnForms].map(([type, forms]) => ({
    parts: BigInt(forms.length),
    type: asCnType(type),
  })),
);

/**
 * `CnForm`: (type, part) → form, the form of each part of a `cn` of the type, a part's number being
 * its place among the parts `m:sep` separates ({@link cnForms}).
 */
export const CnForm = closed.relation(
  "CnForm",
  {
    form: closedId(CnPartForm),
    part: slot(closedId(CnPart), fin(CnParts, "parts")),
    type: closedId(CnType),
  },
  ["type", "part"],
  [...cnForms].flatMap(([type, forms]) =>
    forms.map((form, part) => ({
      form: asCnPartForm(form),
      part: String(part),
      type: asCnType(type),
    })),
  ),
);

/**
 * `CnPattern`: (form, base) → pattern, the lexical space of a part of the form, its digits read in
 * the base from 2 to 36 ({@link cnPatternOf}); a double's and a hexdouble's pattern reads no base.
 * {@link cnPatternOf} returns an XML Schema pattern, which anchors itself; PostgreSQL's `~`
 * searches, and grizzle requires a pattern anchored by `^` and `$`, so each row's payload is the
 * pattern wrapped as `^(?:…)$` and the database judges a part's whole text.
 */
export const CnPattern = closed.relation(
  "CnPattern",
  { base: closedId(CnBase), form: closedId(CnPartForm), pattern: anyText },
  ["form", "base"],
  CnPartForm.handles.flatMap((form) =>
    Arr.range(2, 36).flatMap((base) =>
      Option.toArray(cnPatternOf(form, base)).map((pattern) => ({
        base: String(base),
        form,
        pattern: `^(?:${pattern})$`,
      })),
    ),
  ),
);

/**
 * `BindingFit`: the set of (baseType, cardinality, kind) where an interaction of the kind may bind
 * a typed response variable of the base type and cardinality.
 */
export const BindingFit = closed.relation(
  "BindingFit",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    kind: closedId(NodeKind),
  },
  ["baseType", "cardinality", "kind"],
  grammar.bindingFit.rows.map(({ baseType, cardinality, kind }) => ({
    baseType,
    cardinality,
    kind: memberOf(grammar.kinds.nodeKind, kind),
  })),
);

/**
 * `RecordBindingFit`: the set of interaction kinds that may bind a record response variable.
 */
export const RecordBindingFit = closed.relation(
  "RecordBindingFit",
  { kind: closedId(NodeKind) },
  ["kind"],
  grammar.recordBindingFit.rows.map(({ kind }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
  })),
);

/**
 * `MappableBaseType`: the set of base types a `qti-mapping` may be of.
 */
export const MappableBaseType = closed.relation(
  "MappableBaseType",
  { baseType: closedId(BaseType) },
  ["baseType"],
  grammar.mappableBaseType.rows.map(({ baseType }) => ({ baseType })),
);

// The package (P1, P2).

/**
 * `RootOfType`: the set of (type, root), each root element kind the documents a resource type
 * lists may have; a type with no row lists no document. Each type but an included fragment's has
 * one root, and the fragment's type has every kind an include stands for (spec reading 114).
 */
export const RootOfType = closed.relation(
  "RootOfType",
  { root: closedId(NodeKind), type: closedId(ResourceType) },
  ["type", "root"],
  grammar.package.rootOfType.rows.map(({ root, type }) => ({
    root: memberOf(grammar.kinds.nodeKind, root),
    type,
  })),
);

// Includes (spec readings 85 and 114).

/**
 * The `IncludeParent` roster: every kind whose content model holds an explicit `xi:include`, the
 * parents an include of the information model's Table 9.4.1 stands under. Keying `IncludeSetOf` by
 * it rather than by `NodeKind` keeps the constant at the parents that hold one.
 */
export const IncludeParent = closed(
  "IncludeParent",
  nonEmpty("IncludeParent", grammar.include.includeParent.handles),
);

/**
 * `IncludeParentKind`: include parent → kind, the `NodeKind` each include parent is, so a row that
 * copies an include's parent kind proves its include parent's code.
 */
export const IncludeParentKind = closed.relation(
  "IncludeParentKind",
  { kind: closedId(NodeKind), parent: closedId(IncludeParent) },
  ["parent"],
  grammar.include.includeParentKind.rows.map(({ kind, parent }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    parent,
  })),
);

/**
 * The `IncludeSet` roster: every distinct set of kinds an include stands for, as the include
 * grammar numbers them (`#pantry/grammar/include.ts`): 155 families hold 21 sets, so a law reads an
 * include's kinds as `IncludeMember.row(IncludeSetOf.at("set", version, parent))`.
 */
export const IncludeSet = closed(
  "IncludeSet",
  nonEmpty("IncludeSet", grammar.include.includeSet.handles),
);

/**
 * `IncludeSetOf`: (version, include parent) → set, the kinds an include under the parent stands
 * for, for each family that holds one; a law reads a family of none through `IncludeSetOf.has`.
 */
export const IncludeSetOf = closed.relation(
  "IncludeSetOf",
  {
    parent: closedId(IncludeParent),
    set: closedId(IncludeSet),
    version: closedId(SchemaVersion),
  },
  ["version", "parent"],
  grammar.include.includeSetOf.rows,
);

/**
 * `IncludeMember`: the set of (set, kind) where an include set holds the kind.
 */
export const IncludeMember = closed.relation(
  "IncludeMember",
  { kind: closedId(NodeKind), set: closedId(IncludeSet) },
  ["set", "kind"],
  grammar.include.includeMember.rows.map(({ kind, set }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    set,
  })),
);

/**
 * The kinds an include parent is: the parents a law selects an include's site by.
 */
export const includeParentKinds: readonly (typeof NodeKind.handles)[number][] =
  IncludeParentKind.rows.map(({ kind }) => kind);

// Variables and references (O2 to O7, `references.ts`).

/**
 * `Declares`: kind → declaration, each declaration kind as a `NodeKind` to itself as a
 * `DeclarationKind`; its key set is the declaration kinds.
 */
export const Declares = closed.relation(
  "Declares",
  { declaration: closedId(DeclarationKind), kind: closedId(NodeKind) },
  ["kind"],
  grammar.references.declares.rows.map(({ declaration, kind }) => ({
    declaration,
    kind: memberOf(grammar.kinds.nodeKind, kind),
  })),
);

/**
 * `BuiltInVariable`: (root, variable) → (declaration, cardinality), each built-in variable the
 * processing of a document's root holds, with the declaration kind and cardinality it stands as
 * there (spec reading 29, the UP audit's A63): an item's and a response processing template's
 * `numAttempts`, `duration` and `completionStatus`, a test's and a section's `duration`, and
 * `QTI_CONTEXT`, a record, under all four. A reference to it reads as one to a declaration of that
 * kind, and a name with no row under its document's root is no built-in there. The base type each
 * but the record stands as is {@link builtInBaseTypes}'.
 */
export const BuiltInVariable = closed.relation(
  "BuiltInVariable",
  {
    cardinality: closedId(Cardinality),
    declaration: closedId(DeclarationKind),
    root: closedId(NodeKind),
    variable: closedId(BuiltIn),
  },
  ["root", "variable"],
  grammar.references.builtIn.rows.map(({ cardinality, declaration, root, variable }) => ({
    cardinality: asCardinality(cardinality),
    declaration,
    root: memberOf(grammar.kinds.nodeKind, root),
    variable,
  })),
);

/**
 * The base type each built-in variable stands as under a root, for the variables that have one
 * (`BuiltInBaseType` of the grammar): an item's `numAttempts` an integer, its `duration` a float
 * and its `completionStatus` an identifier, and a test's and a section's `duration` a duration.
 * `QTI_CONTEXT` is a record, which has no base type, and no row (information model §2.2.2.1 and
 * tables 4.5.3 and 5.34.3). Only the host reads it, in typing a reference to a built-in.
 */
export const builtInBaseTypes: readonly {
  readonly baseType: (typeof BaseType.handles)[number];
  readonly root: (typeof NodeKind.handles)[number];
  readonly variable: (typeof BuiltIn.handles)[number];
}[] = grammar.references.builtInBaseType.rows.map(({ baseType, root, variable }) => ({
  baseType: asBaseType(baseType),
  root: memberOf(grammar.kinds.nodeKind, root),
  variable,
}));

/**
 * `VariableReference`: (kind, attribute) → spelling, every attribute by which an element of a kind
 * names a variable, and how its value spells the name.
 */
export const VariableReference = closed.relation(
  "VariableReference",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    spelling: closedId(ReferenceSpelling),
  },
  ["kind", "attribute"],
  grammar.references.variableReference.rows.map(({ attribute, kind, spelling }) => ({
    attribute: memberOf(grammar.kinds.attributeName, attribute),
    kind: memberOf(grammar.kinds.nodeKind, kind),
    spelling,
  })),
);

/**
 * `ContentReference`: the set of (kind, attribute, declaration) where an element's attribute names
 * a declaration of that kind.
 */
export const ContentReference = closed.relation(
  "ContentReference",
  {
    attribute: closedId(AttributeName),
    declaration: closedId(DeclarationKind),
    kind: closedId(NodeKind),
  },
  ["kind", "attribute", "declaration"],
  grammar.references.contentReference.rows.map(({ attribute, declaration, kind }) => ({
    attribute: memberOf(grammar.kinds.attributeName, attribute),
    declaration,
    kind: memberOf(grammar.kinds.nodeKind, kind),
  })),
);

/**
 * `ChoiceBound`: kind → (min, max, zero), the attributes of the least and the most count a kind's
 * element bounds, and what a most of 0 means there.
 */
export const ChoiceBound = closed.relation(
  "ChoiceBound",
  {
    kind: closedId(NodeKind),
    max: closedId(AttributeName),
    min: closedId(AttributeName),
    zero: closedId(BoundZero),
  },
  ["kind"],
  grammar.references.choiceBound.rows.map(({ kind, max, min, zero }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    max: memberOf(grammar.kinds.attributeName, max),
    min: memberOf(grammar.kinds.attributeName, min),
    zero,
  })),
);

/**
 * The last-slot rules the vocabularies state (`LastWhere` of `#pantry/grammar/children.ts`), each
 * kind and parent read as a `NodeKind` handle once, here, for the default-hotspot law that reads
 * them.
 */
export const lastWhereRules = grammar.lastWhere.map(({ kind, parents, ...rule }) => ({
  ...rule,
  kind: memberOf(grammar.kinds.nodeKind, kind),
  parents: parents.map((parent) => memberOf(grammar.kinds.nodeKind, parent)),
}));

/**
 * `ChoiceCount`: kind → choice, the kind of the children whose number bounds both of the kind's
 * counts (spec reading 18).
 */
export const ChoiceCount = closed.relation(
  "ChoiceCount",
  { choice: closedId(NodeKind), kind: closedId(NodeKind) },
  ["kind"],
  grammar.references.choiceCount.rows.map(({ choice, kind }) => ({
    choice: memberOf(grammar.kinds.nodeKind, choice),
    kind: memberOf(grammar.kinds.nodeKind, kind),
  })),
);

/**
 * `SectionPart`: the set of kinds a section holds as its parts, among which its selection selects.
 */
export const SectionPart = closed.relation(
  "SectionPart",
  { kind: closedId(NodeKind) },
  ["kind"],
  grammar.references.sectionPart.rows.map(({ kind }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
  })),
);

// Lexical forms of coded enumerations (C17).

/**
 * `BaseTypeLexical`: code → lexical, each base type's lexical form, which proves an overlay's
 * written code: `eq(BaseTypeLexical.at("lexical", baseType), lexical)`.
 */
export const BaseTypeLexical = closed.relation(
  "BaseTypeLexical",
  { code: closedId(BaseType), lexical: anyText },
  ["code"],
  BaseType.handles.map((code) => ({ code, lexical: code })),
);

/**
 * `CardinalityLexical`: code → lexical, each cardinality's lexical form, `record` among them.
 */
export const CardinalityLexical = closed.relation(
  "CardinalityLexical",
  { code: closedId(Cardinality), lexical: anyText },
  ["code"],
  Cardinality.handles.map((code) => ({ code, lexical: code })),
);

/**
 * `ResourceTypeLexical`: code → lexical, each resource type's lexical form.
 */
export const ResourceTypeLexical = closed.relation(
  "ResourceTypeLexical",
  { code: closedId(ResourceType), lexical: anyText },
  ["code"],
  ResourceType.handles.map((code) => ({ code, lexical: code })),
);

/**
 * The resource types whose files are documents: the types of `RootOfType`'s rows, once each, so a
 * resource of one of them lists a document of a root kind it holds, `in(type, documentTypes)`.
 */
export const documentTypes: readonly string[] = [
  ...new Set(grammar.package.rootOfType.rows.map(({ type }) => type)),
];

/**
 * The versions every version-keyed relation ranges over, for a reader that enumerates them.
 */
export const versions: readonly Version[] = grammar.kinds.versions.handles;
