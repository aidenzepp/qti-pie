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
 * `Follow` and `Last` are keyed by their automaton ({@link ContentModel}), and `Symbol` by its
 * shared model ({@link SharedModel}), as the content grammar generates them (`content.ts`): a
 * family reads its model through {@link ContentModelOf} or {@link SharedModelOf}, so each is stated
 * one to one.
 *
 * Where grizzle's surface differs from the generators' shapes, the declaration restates the
 * relation and says why:
 *
 * - A generator's dependent `fin` coordinate is a slot, `slot(closedId(Position), fin(O, n))`, over a
 *   count relation O over the model ({@link ModelPositions}, {@link SharedPositions}), so each
 *   model's block holds its own positions and no other's (README, "Closed relations").
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
import type { Roster as GeneratedRoster } from "#pantry/grammar/closed.ts";
import { int8Max, rowsAt } from "#pantry/grammar/closed.ts";
import { composed, recordCardinality } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar, Kind } from "#pantry/grammar/compose.ts";
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
 * Take a generated roster's handles as a nonempty list, the form a grizzle roster declares.
 *
 * @param name - The roster's name, for the defect's message.
 * @param handles - The handles in code order.
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
 * Narrow a generator's value to a handle of one of its rosters.
 *
 * @param roster - The generated roster the value's field ranges over.
 * @param value - The value a generated row holds.
 * @returns The value as the roster's handle.
 * @throws {Error} When the roster lacks it, which `closed.ts` refuses before a generator returns a
 *   row.
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
 * The text type of a closed relation's open text payloads: any text, as XML Schema's `xs:string`
 * reads one, line terminators included.
 */
const anyText = str.regex("^.*$", "su");

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
 * The null object of a roster whose value may be absent: the handle a row takes where it has none,
 * which no lexical form spells.
 */
const none = "none";

/**
 * The `ResourceType` handle of a document no resource lists, the manifest.
 */
const noResourceType = none;

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
 * The `TypeName` roster: `none`, then the pinned XSDs' named types, each its namespace's prefix and
 * its local name (`typeHandle` of `xsi.ts`).
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
 * The `ResourceType` roster: `none`, the null object of the manifest's own `Document` row, at code
 * 0, then the 21 types a `cp:resource` may name, each spelled as its lexical form (`package.ts`).
 * No `RootOfType` or `ResourceTypeLexical` row names `none`, and a lexical form no handle spells
 * is outside the attribute's value domain, so a resource that carries it is refused.
 */
export const ResourceType = closed(
  "ResourceType",
  nonEmpty("ResourceType", [noResourceType, ...grammar.package.resourceType.handles]),
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
 * (`attributes.ts`). A kind's handle holds no space, so no two spellings meet.
 */
export const Governor = closed("Governor", [
  ...nonEmpty("NodeKind", grammar.kinds.nodeKind.handles),
  ...grammar.attributes.governor.payload[0].roster.handles,
]);

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
 * kind, `Follow` and `Last` keyed by it (the content grammar's own key, `content.ts`).
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
 * `ContentModelOf`: (version, parent) → model, total, the automaton a parent's children follow in
 * the version, read by N5b and N7 as `ContentModelOf.at("model", version, parentKind)`.
 */
export const ContentModelOf = closed.relation(
  "ContentModelOf",
  { model: closedId(ContentModel), parent: closedId(NodeKind), version: closedId(SchemaVersion) },
  ["version", "parent"],
  grammar.content.contentModelOf.rows.map(({ model, parent, version }) => ({
    model,
    parent: memberOf(grammar.kinds.nodeKind, parent),
    version,
  })),
);

// The count relations a slot's fin reads.

/**
 * `ModelPositions`: model → positions, the number of content positions of each automaton, its start
 * 0 included, so the model of a family with no model, or an empty one, has 1. `Follow`'s and
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
 * `SharedPositions`: model → positions, the number of content positions of each shared model, its
 * start 0 included.
 */
export const SharedPositions = closed.relation(
  "SharedPositions",
  { model: closedId(SharedModel), positions: natural },
  ["model"],
  grammar.content.sharedModelPositions.rows.map(({ model, positions }) => ({
    model,
    positions: BigInt(positions),
  })),
);

/**
 * A content position of an automaton, a slot of its model's `ModelPositions` count.
 */
const familyPosition = slot(closedId(Position), fin(ModelPositions, "positions"));

/**
 * A content position of a shared model, a slot of its `SharedPositions` count.
 */
const modelPosition = slot(closedId(Position), fin(SharedPositions, "positions"));

// The content grammar (N5, N7).

/**
 * `ChildGrammar`: (version, parent, child) → position, the child kind's position in its parent's
 * content model, 0 for character data and for a kind several positions name. Its key set is
 * admission (`Admission` in `compose.ts`).
 */
export const ChildGrammar = closed.relation(
  "ChildGrammar",
  {
    child: closedId(NodeKind),
    parent: closedId(NodeKind),
    position: closedId(Position),
    version: closedId(SchemaVersion),
  },
  ["version", "parent", "child"],
  grammar.admission.rows.map(({ child, parent, position, version }) => ({
    child: memberOf(grammar.kinds.nodeKind, child),
    parent: memberOf(grammar.kinds.nodeKind, parent),
    position,
    version,
  })),
);

/**
 * `Follow`: the set of (model, from, to) where a child at position `to` may follow one at `from`,
 * `from` 0 the start, in the content model's automaton.
 */
export const Follow = closed.relation(
  "Follow",
  { from: familyPosition, model: closedId(ContentModel), to: familyPosition },
  ["model", "from", "to"],
  grammar.content.follow.rows.map(({ from, model, to }) => ({ from, model, to })),
);

/**
 * `Last`: the set of (model, position) where a family of the content model may end, 0 when it may
 * be empty.
 */
export const Last = closed.relation(
  "Last",
  { model: closedId(ContentModel), position: familyPosition },
  ["model", "position"],
  grammar.content.last.rows.map(({ model, position }) => ({ model, position })),
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
 * `Symbol`: the set of (model, kind, position) where a shared model names the kind at the position,
 * so the state decides which (N5c). Each (version, parent) family reads its model through
 * `SharedModelOf`.
 */
export const Symbol = closed.relation(
  "Symbol",
  { kind: closedId(NodeKind), model: closedId(SharedModel), position: modelPosition },
  ["model", "kind", "position"],
  grammar.content.symbol.rows.map(({ kind, model, position }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    model,
    position,
  })),
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
const kindFlags = (set: ComposedGrammar["ancestry"]["enters"]) =>
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
 * `xsi:type`, validly derived from its declared type, `none` its declared type's absence.
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
 * State `GoverningOf`'s rows, total on every (version, kind, governs) a node may hold:
 *
 * - Each `XsiType` row, governed by the grammar's governor of the triple, else by the kind itself;
 * - Each foreign kind under every type, by its simple governor where the grammar holds one, else by
 *   the kind;
 * - Each kind that is no element, under `none`, by the kind.
 *
 * @returns The rows, each (version, kind, governs) once.
 * @throws {Error} When two of the three sources give one triple two governors, which none does
 *   today.
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

    for (const kind of nonElementKinds) {
      add(version, kind, none);
    }
  }

  return [...rows.values()];
};

/**
 * `GoverningOf`: (version, kind, governs) → governor, what an element of the kind under the type
 * reads its attributes and text by, total on every triple a node may hold.
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
 * The attribute grammar as the generators state it, a row per (version, governor, name): each
 * attribute an element may carry under its governor in the version, with its value domain, its use
 * and its slot among the names the (version, governor) admits, slots 0 to n − 1. A kind's own rows
 * are the grammar's `AttributeGrammar`, a governing type's its `GovernedAttribute`. The installed
 * relations restate it by attribute model and slot ({@link AttributeGrammar},
 * {@link AttributeSlotOf}); the host reads these rows.
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
 * its first governor, {@link AttributeGrammar} and {@link AttributeSlotOf} keyed by it.
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
 * `AttributeSlots`: model → slots, the number of attributes each model admits, the slots 0 to
 * n − 1 of {@link AttributeGrammar}'s blocks (README, "Closed relations").
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
 * `AttributeGrammar`: (model, slot) → (name, domain, use), each attribute a model admits at its
 * slot, keyed by the model's own slots as `Follow` is by its model's positions, so each model's
 * block holds its own attributes and no other's: its name, its value domain and its use.
 */
export const AttributeGrammar = closed.relation(
  "AttributeGrammar",
  {
    domain: closedId(ValueDomain),
    model: closedId(AttributeModel),
    name: closedId(AttributeName),
    slot: modelSlot,
    use: closedId(Use),
  },
  ["model", "slot"],
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
 * `AttributeSlotOf`: (model, name) → slot, the slot of each name a model admits, the index an
 * element's attribute is read through by name (AL1, AL2's slot and the value domain); an
 * unadmitted name reads no row, and `AttributeSlotOf.row(model)` is the set of the model's names.
 */
export const AttributeSlotOf = closed.relation(
  "AttributeSlotOf",
  {
    model: closedId(AttributeModel),
    name: closedId(AttributeName),
    slot: closedId(AttributeSlot),
  },
  ["model", "name"],
  attributeModels.models.flatMap(({ handle, rows }) =>
    rows.map(({ name, position }) => ({
      model: asAttributeModel(handle),
      name,
      slot: position,
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
 * it, since whether a literal clears it turns on IEEE rounding; `DoubleValue`'s bound law reads it
 * (`#pantry/qti/attributes.ts`).
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
 * attributes carry a `DoubleValue`.
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
 * Strictly held lets it stand: `¬StrictlyHeld(version, parentKind, kind) ∨ governs ≠ none ∨
 * Compute.matches(Compute.concat(Compute.concat(namespace, "}"), local),
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
 * `none` and XML Schema's own types (spec readings 60 and 81; C15, C36). An element whose parent's
 * namespace is no vocabulary's stands in documents of every schema set, so it may name any type:
 * the law over a foreign element's `governs` is `Compute.matches(parentNamespace,
 * TypeAvailable.at("namespaces", governs)) ∨ ¬Compute.matches(parentNamespace,
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
 * parents an include of the information model's Table 9.4.1 stands under. Keying `IncludeRoot` by
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
 * `IncludeRoot`: the set of (version, include parent, kind), each kind an include under the parent
 * stands for: the alternatives of its particle's choice group (`#pantry/grammar/include.ts`).
 */
export const IncludeRoot = closed.relation(
  "IncludeRoot",
  {
    kind: closedId(NodeKind),
    parent: closedId(IncludeParent),
    version: closedId(SchemaVersion),
  },
  ["version", "parent", "kind"],
  grammar.include.includeRoot.rows.map(({ kind, parent, version }) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    parent,
    version,
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
 * `ResourceTypeLexical`: code → lexical, each resource type's lexical form; `none` has none, since
 * nothing writes it from a lexical form.
 */
export const ResourceTypeLexical = closed.relation(
  "ResourceTypeLexical",
  { code: closedId(ResourceType), lexical: anyText },
  ["code"],
  ResourceType.handles
    .filter((code) => code !== noResourceType)
    .map((code) => ({ code, lexical: code })),
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
