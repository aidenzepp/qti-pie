/**
 * The grammar's rosters and closed relations, declared to grizzle (fin.md §17; plan §1.2, and the
 * W5 amendment's C4, C6 to C8, C17 and C24).
 *
 * Every row here is a generator's: {@link grammar} is `composed()`, run once when this module
 * loads, and each declaration states one of its relations as `closed(name, handles)` or
 * `closed.relation(name, fields, key, rows)`. grizzle packs each into a content-addressed constant
 * when a law or a generated field reads it, and installs nothing for one no statement reads. This
 * is the one module under `src/grammar/` that imports grizzle (`purity.test.ts`), so the generators
 * stay pure and each schema module imports its rosters and relations from here.
 *
 * Where grizzle's surface differs from the generators' shapes, the declaration restates the
 * relation and says why:
 *
 * - `Follow` and `Last` are keyed by their automaton ({@link ContentModel}), and `Symbol` by its
 *   shared model ({@link SharedModel}), rather than by (version, parent): 114 automata stand for
 *   the 1,288 families, and 23 parents share a kind between positions, each the same in both
 *   versions. A family reads its model through {@link ContentModelOf} or {@link SharedModelOf}.
 * - A generator's dependent `fin` coordinate is a slot, `slot(closedId(Position), fin(O, n))`, over a
 *   count relation O over the model ({@link ModelPositions}, {@link SharedPositions}), so each
 *   model's block holds its own positions and no other's (README, "Closed relations").
 * - A singleton set is a diagonal's row ({@link PositionSelf}, {@link SlotSelf},
 *   {@link AttributeNameSelf}), a lexical form's code a `<Roster>Lexical` payload, and a
 *   one-position law a total function over (version, parent) ({@link CountedOf},
 *   {@link BarredOf}).
 * - An element's attributes and text are read under its governor ({@link GoverningOf}): its kind, or
 *   the type an `xsi:type` makes govern it (spec readings 60 and 75).
 */
import { closed, closedId, fin, natural, slot, str } from "@bjornpagen/grizzle";
import { Array as Arr, Option, Result } from "effect";
import type { Flag as FlagHandle } from "#pantry/grammar/ancestry.ts";
import { openDomain } from "#pantry/grammar/attributes.ts";
import type { Roster as GeneratedRoster } from "#pantry/grammar/closed.ts";
import { int8Max } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar, Kind, Name } from "#pantry/grammar/compose.ts";
import { foreignKinds, openClasses as openNameClasses } from "#pantry/grammar/kinds.ts";
import { vocabularyNamespacesPattern } from "#pantry/grammar/names.ts";
import type { SchemaVersion as Version } from "#pantry/grammar/kinds.ts";

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
 * Narrow a generator's value to a handle of a roster this module declares.
 *
 * @param name - The roster's name, for the defect's message.
 * @param handles - The roster's handles.
 * @param value - The value a generated row holds.
 * @returns The value as the roster's handle.
 * @throws {Error} When the roster lacks it, which no generator's row does.
 */
const handleIn = <H extends string>(name: string, handles: readonly H[], value: string): H => {
  const found = handles.find((handle) => handle === value);
  if (found !== undefined) {
    return found;
  }

  throw new Error(
    `A generated row names ${value}, which the ${name} roster this module declares does not hold. Add the handle to the roster, or correct the generator.`,
  );
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
 * The open attribute classes, the `AttributeName` handles that name no one attribute: `data-*`,
 * `foreign`, `no-namespace` and `own-namespace` (D2).
 */
export const openClasses = openNameClasses satisfies readonly Name[];

/**
 * The element classes, the `NodeKind` handles of a foreign element by its namespace's class:
 * `foreign-element`, `no-namespace-element` and `own-namespace-element`.
 */
export const openElementClasses = [
  foreignKinds.other,
  foreignKinds.absent,
  foreignKinds.own,
] as const satisfies readonly Kind[];

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
 * The `BaseType` roster: QTI's base types, each spelled as its lexical form, then `none`, the base
 * type of a record, which the specification gives none ("Variables with record cardinality have no
 * base-type", QTI 3.0 information model, tables 4.5.3, 5.34.3, 5.115.3 and 5.151.3). No
 * `BaseTypeLexical` row names `none`: nothing writes it from a lexical form.
 */
export const BaseType = closed(
  "BaseType",
  nonEmpty("BaseType", [...grammar.baseTypes.handles, none]),
);

/**
 * The cardinality of a record variable, whose fields carry their own base types and which has none.
 */
const recordCardinality = "record";

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
 * The `ResourceType` roster: `none`, the null object of the manifest's own `Document` row, at code
 * 0, then the 21 types a `cp:resource` may name, each spelled as its lexical form (`package.ts`).
 * No `ResourceTypeOf`, `RootOfType` or `ResourceTypeLexical` row names `none`, so a resource that
 * carries it is refused.
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
 * The `Identity` roster: `xs:ID`, `xs:IDREF` and `xs:IDREFS`, the identity types a domain may have,
 * then `none`, a domain's of no identity, so {@link ValueIdentity} is total.
 */
export const Identity = closed(
  "Identity",
  nonEmpty("Identity", [...grammar.attributes.identity.payload[0].roster.handles, none]),
);

/**
 * The `Governor` roster: what an element's attributes and text are read under. Each `NodeKind`
 * handle first, in code order, a kind governing its own elements by its declared type; then each
 * (kind, type) where the type governs an element of the kind in place of its declared type, or a
 * simple type governs a foreign element's text (spec readings 60 and 75), spelled `<kind> <type>`
 * (`attributes.ts`). A kind's handle holds no space, so no two spellings meet.
 */
export const Governor = closed("Governor", [
  ...nonEmpty("NodeKind", grammar.kinds.nodeKind.handles),
  ...grammar.attributes.governor.payload[0].roster.handles,
]);

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
 * image candidate list (spec reading 95).
 */
export const ReferenceForm = closed(
  "ReferenceForm",
  nonEmpty("ReferenceForm", grammar.references.referenceForm.handles),
);

/**
 * The `ReservedTarget` roster: the targets a branch rule names that are no identifier,
 * `EXIT_SECTION`, `EXIT_TESTPART` and `EXIT_TEST` (information model §5.23.1, the UP audit's A25),
 * each spelled as its lexical form ({@link ReservedTargetLexical}).
 */
export const ReservedTarget = closed(
  "ReservedTarget",
  nonEmpty("ReservedTarget", grammar.references.reservedTarget.handles),
);

/**
 * The `BoundZero` roster: what a most of 0 means on a kind's choice bound.
 */
export const BoundZero = closed(
  "BoundZero",
  nonEmpty("BoundZero", grammar.references.choiceBound.payload[2].roster.handles),
);

/**
 * Content models read off the families they hold: each model in first-family order with its first
 * family, `<version> <parent>`, and its position count, its start 0 included, and the model of each
 * (version, parent) family that has one, by `<version> <parent>`.
 */
interface Models {
  readonly models: readonly {
    readonly first: string;
    readonly handle: string;
    readonly positions: number;
  }[];
  readonly of: ReadonlyMap<string, string>;
}

/**
 * Read the (version, parent) families as models: two families are one model exactly when their
 * signatures are equal (rule 0: identical facts are one fact). A model is named by its first
 * family's parent kind, or by `<version> <parent>` where an earlier model took that name, so every
 * handle is a kind's or a family's and at most 63 bytes.
 *
 * @param signatureOf - A family's signature and position count, none for a family no model holds.
 * @returns The models and each family's, families read in (version, parent) code order.
 */
const modelsOf = (
  signatureOf: (
    version: Version,
    parent: Kind,
  ) => Option.Option<{ readonly positions: number; readonly signature: string }>,
): Models => {
  const models: { readonly first: string; readonly handle: string; readonly positions: number }[] =
    [];
  const bySignature = new Map<string, string>();
  const named = new Set<string>();
  const of = new Map<string, string>();
  for (const version of grammar.kinds.versions.handles) {
    for (const parent of grammar.kinds.nodeKind.handles) {
      const family = `${version} ${parent}`;
      for (const { positions, signature } of Option.toArray(signatureOf(version, parent))) {
        const known = bySignature.get(signature);
        const handle = known ?? (named.has(parent) ? family : parent);
        if (known === undefined) {
          bySignature.set(signature, handle);
          named.add(handle);
          models.push({ first: family, handle, positions });
        }

        of.set(family, handle);
      }
    }
  }

  return { models, of };
};

/**
 * Group a content relation's rows by family, `<version> <parent>`.
 *
 * @param rows - The rows.
 * @returns Each family's rows.
 */
const byFamily = <R extends { readonly parent: string; readonly version: string }>(
  rows: readonly R[],
): ReadonlyMap<string, readonly R[]> =>
  Map.groupBy(rows, ({ parent, version }) => `${version} ${parent}`);

/**
 * The content grammar's `Follow`, `Last` and `Symbol` rows, each family's by `<version> <parent>`.
 */
const familyRows = {
  follow: byFamily(grammar.content.follow.rows),
  last: byFamily(grammar.content.last.rows),
  symbol: byFamily(grammar.content.symbol.rows),
};

/**
 * The content models `Follow` and `Last` are keyed by: every family's automaton, its position
 * count, the pairs `Follow` holds and the positions `Last` holds, so 114 automata stand for the
 * 1,288 (version, parent) families, and a family with no model of its own is the automaton of one
 * position that nothing follows and nothing ends at.
 */
const contentModels = ((): Models => {
  const { follow: follows, last: lasts } = familyRows;

  return modelsOf((version, parent) => {
    const family = `${version} ${parent}`;
    const positions = grammar.content.follow.key[2].sizeOf({ parent, version });

    return Option.some({
      positions,
      signature: [
        String(positions),
        (follows.get(family) ?? [])
          .map(({ from, to }) => `${from}>${to}`)
          .toSorted()
          .join(" "),
        (lasts.get(family) ?? [])
          .map(({ position }) => position)
          .toSorted()
          .join(" "),
      ].join("|"),
    });
  });
})();

/**
 * The shared content models `Symbol` is keyed by: a parent's, where every version gives it the same
 * shared positions and position count, else the parent's in each version. A family whose kinds each
 * name one position has no shared model.
 */
const sharedModels = ((): Models => {
  const blocks = familyRows.symbol;

  return modelsOf((version, parent) =>
    Option.map(
      Option.filter(
        Option.fromNullishOr(blocks.get(`${version} ${parent}`)),
        Arr.isReadonlyArrayNonEmpty,
      ),
      (rows) => {
        const positions = grammar.content.symbol.key[3].sizeOf({ parent, version });

        return {
          positions,
          signature: [
            parent,
            String(positions),
            ...rows.map(({ kind, position }) => `${kind}:${position}`).toSorted(),
          ].join(" "),
        };
      },
    ),
  );
})();

/**
 * The handle of the model no shared kind is in: `SharedModelOf`'s value for a family whose kinds
 * each name one position, or none.
 */
const noSharedModel = none;

/**
 * The `ContentModel` roster: every distinct content automaton, named by its first family's parent
 * kind, `Follow` and `Last` keyed by it.
 */
export const ContentModel = closed(
  "ContentModel",
  nonEmpty(
    "ContentModel",
    contentModels.models.map(({ handle }) => handle),
  ),
);

/**
 * The `SharedModel` roster: `none`, then each content model in which a kind names several positions
 * (C4), named by its parent kind.
 */
export const SharedModel = closed("SharedModel", [
  noSharedModel,
  ...sharedModels.models.map(({ handle }) => handle),
]);

/**
 * The model of a family, `ContentModelOf`'s row.
 *
 * @param version - The family's version.
 * @param parent - The family's parent kind.
 * @returns Its model's handle.
 * @throws {Error} When the family has none, which {@link contentModels} gives every family.
 */
const contentModelOf = (version: string, parent: string): string => {
  const model = contentModels.of.get(`${version} ${parent}`);
  if (model === undefined) {
    throw new Error(
      `The content models give ${parent} in ${version} no model, and every (version, parent) family has one. Correct the content model reader.`,
    );
  }

  return model;
};

/**
 * `ContentModelOf`: (version, parent) → model, total, the automaton a parent's children follow in
 * the version, read by N5b and N7 as `ContentModelOf.at("model", version, parentKind)`.
 */
export const ContentModelOf = closed.relation(
  "ContentModelOf",
  { model: closedId(ContentModel), parent: closedId(NodeKind), version: closedId(SchemaVersion) },
  ["version", "parent"],
  grammar.kinds.versions.handles.flatMap((version) =>
    grammar.kinds.nodeKind.handles.map((parent) => ({
      model: contentModelOf(version, parent),
      parent,
      version,
    })),
  ),
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
  contentModels.models.map(({ handle, positions }) => ({
    model: handle,
    positions: BigInt(positions),
  })),
);

/**
 * `SharedPositions`: model → positions, the number of content positions of each shared model, its
 * start 0 included. `none` has no row, so `Symbol` gives it no block.
 */
export const SharedPositions = closed.relation(
  "SharedPositions",
  { model: closedId(SharedModel), positions: natural },
  ["model"],
  sharedModels.models.map(({ handle, positions }) => ({
    model: handle,
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
 * State each model's rows once, from its first family's: every family of a model states the same
 * rows, a model being their signature, so the others' are the same facts (rule 0).
 *
 * @param models - The models.
 * @param rows - Each family's rows.
 * @param rowOf - A family row as the model's row.
 * @returns The models' rows.
 */
const modelRows = <R, M>(
  models: Models,
  rows: ReadonlyMap<string, readonly R[]>,
  rowOf: (row: R, model: string) => M,
): readonly M[] =>
  models.models.flatMap(({ first, handle }) =>
    (rows.get(first) ?? []).map((row) => rowOf(row, handle)),
  );

/**
 * `Follow`: the set of (model, from, to) where a child at position `to` may follow one at `from`,
 * `from` 0 the start, in the content model's automaton.
 */
export const Follow = closed.relation(
  "Follow",
  { from: familyPosition, model: closedId(ContentModel), to: familyPosition },
  ["model", "from", "to"],
  modelRows(contentModels, familyRows.follow, ({ from, to }, model) => ({ from, model, to })),
);

/**
 * `Last`: the set of (model, position) where a family of the content model may end, 0 when it may
 * be empty.
 */
export const Last = closed.relation(
  "Last",
  { model: closedId(ContentModel), position: familyPosition },
  ["model", "position"],
  modelRows(contentModels, familyRows.last, ({ position }, model) => ({ model, position })),
);

/**
 * `SharedModelOf`: (version, parent) → model, total, `none` for a family no kind names at several
 * positions.
 */
export const SharedModelOf = closed.relation(
  "SharedModelOf",
  { model: closedId(SharedModel), parent: closedId(NodeKind), version: closedId(SchemaVersion) },
  ["version", "parent"],
  grammar.kinds.versions.handles.flatMap((version) =>
    grammar.kinds.nodeKind.handles.map((parent) => ({
      model: sharedModels.of.get(`${version} ${parent}`) ?? noSharedModel,
      parent,
      version,
    })),
  ),
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
  modelRows(sharedModels, familyRows.symbol, ({ kind, position }, model) => ({
    kind: memberOf(grammar.kinds.nodeKind, kind),
    model,
    position,
  })),
);

/**
 * Index a generator's rows by (version, parent), refusing a family with two of them: the law over
 * the rows names one position per family (N7).
 *
 * @param name - The relation the rows are made total as, for the defect's message.
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
 * Today's `Counted` rows, one per family: {@link onePerFamily}.
 */
const countedByFamily = onePerFamily("CountedOf", grammar.content.counted.rows);

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
 * `CountedOf`: (version, parent) → (position, min, max), total: the one position of the family
 * whose count is a law beside its automaton, with its bounds, or position 0, min 0 and max
 * `int8Max` where none is (C25: `qti-simple-match-set` under `qti-match-interaction`).
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
  grammar.kinds.versions.handles.flatMap((version) =>
    grammar.kinds.nodeKind.handles.map((parent) => {
      const counted = countedByFamily.get(`${version} ${parent}`);

      return {
        max: counted === undefined ? int8Max : naturalOf(counted.max),
        min: counted === undefined ? 0n : naturalOf(counted.min),
        parent,
        position: counted?.position ?? "0",
        version,
      };
    }),
  ),
);

/**
 * `BarredOf`: (version, parent) → (slot, position), total: the attribute slot whose presence bars a
 * family's children at the position, or slot 0 and position 0 where nothing is barred (C25:
 * `colgroup`'s `span`). The slot is the barring attribute's position in `AttributeGrammar`.
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
  grammar.kinds.versions.handles.flatMap((version) =>
    grammar.kinds.nodeKind.handles.map((parent) => {
      const barred = barredByFamily.get(`${version} ${parent}`);
      const slotOf = Option.flatMap(Option.fromNullishOr(barred), ({ name }) =>
        grammar.attributes.admission.lookup({ kind: parent, name, version }),
      );

      return {
        parent,
        position: barred?.position ?? "0",
        slot: Option.match(slotOf, {
          onNone: () => "0",
          onSome: ({ position }) => position,
        }),
        version,
      };
    }),
  ),
);

/**
 * `StrictlyHeld`: the set of (version, parent, child) where only `strict` wildcards of the parent's
 * model admit the foreign kind, so the child stands only under an `xsi:type` its document's schema
 * set resolves (spec reading 72).
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

/**
 * `PositionSelf`: the diagonal of `Position`, so `PositionSelf.row(p)` is the singleton {p} (C6).
 */
export const PositionSelf = closed.relation(
  "PositionSelf",
  { position: closedId(Position), self: closedId(Position) },
  ["position", "self"],
  grammar.content.positions.handles.map((position) => ({ position, self: position })),
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

// Attributes and texts under their governor (AL1 to AL3, text-copy; spec readings 60 and 75).

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
      governor: governorAt.get(at) ?? kind,
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
 * `AttributeGrammar`: (version, governor, name) → (domain, use, position), each attribute an
 * element may carry under its governor in the version: its value domain, its use, and its slot
 * among the names the (version, governor) admits. A kind's own rows are the grammar's
 * `AttributeGrammar`, a governing type's its `GovernedAttribute`, and an unadmitted name reads no
 * row.
 */
export const AttributeGrammar = closed.relation(
  "AttributeGrammar",
  {
    domain: closedId(ValueDomain),
    governor: closedId(Governor),
    name: closedId(AttributeName),
    position: closedId(AttributeSlot),
    use: closedId(Use),
    version: closedId(SchemaVersion),
  },
  ["version", "governor", "name"],
  [
    ...grammar.attributes.admission.rows.map(({ domain, kind, name, position, use, version }) => ({
      domain,
      governor: kind,
      name: memberOf(grammar.kinds.attributeName, name),
      position,
      use,
      version: memberOf(grammar.kinds.versions, version),
    })),
    ...grammar.attributes.governed.rows.map(
      ({ domain, governor, name, position, use, version }) => ({
        domain,
        governor,
        name: memberOf(grammar.kinds.attributeName, name),
        position,
        use,
        version: memberOf(grammar.kinds.versions, version),
      }),
    ),
  ],
);

/**
 * `Required`: the set of (version, governor, slot) where an element under the governor must carry
 * the attribute at the slot, `AttributeGrammar`'s rows of use `required` (C7), read as
 * `Required.row(version, governor)` by AL3.
 */
export const Required = closed.relation(
  "Required",
  { governor: closedId(Governor), slot: closedId(AttributeSlot), version: closedId(SchemaVersion) },
  ["version", "governor", "slot"],
  AttributeGrammar.rows
    .filter(({ use }) => use === "required")
    .map(({ governor, position, version }) => ({ governor, slot: position, version })),
);

/**
 * `SlotSelf`: the diagonal of `AttributeSlot`, so `SlotSelf.row(s)` is the singleton {s} (C6),
 * AL2's fold step.
 */
export const SlotSelf = closed.relation(
  "SlotSelf",
  { self: closedId(AttributeSlot), slot: closedId(AttributeSlot) },
  ["slot", "self"],
  grammar.attributes.positions.handles.map((held) => ({ self: held, slot: held })),
);

/**
 * `AttributeNameSelf`: the diagonal of `AttributeName`, so `AttributeNameSelf.row(n)` is the
 * singleton {n} (C6), and AL1's admission is `subset(AttributeNameSelf.row(name),
 * AttributeGrammar.row(version, governor))`, a named check.
 */
export const AttributeNameSelf = closed.relation(
  "AttributeNameSelf",
  { name: closedId(AttributeName), self: closedId(AttributeName) },
  ["name", "self"],
  grammar.kinds.attributeName.handles.map((name) => ({ name, self: name })),
);

/**
 * `ValueDomainOf`: domain → (primitive, pattern, facets), each value domain's primitive, the
 * pattern its lexical forms match as written, and its residual facets, `facet=value`
 * space-separated. AL1 and the text law read `pattern` through `Compute.matches`, whose pattern
 * term must meet its subject's type, so `pattern` is plain text, no contract.
 */
export const ValueDomainOf = closed.relation(
  "ValueDomainOf",
  {
    domain: closedId(ValueDomain),
    facets: anyText,
    pattern: anyText,
    primitive: closedId(DomainPrimitive),
  },
  ["domain"],
  grammar.attributes.valueDomain.rows.map(({ domain, facets, pattern, primitive }) => ({
    domain,
    facets,
    pattern,
    primitive,
  })),
);

/**
 * The empty value domains: each `ValueDomain` handle whose lexical space holds no value, so it has
 * no `ValueDomainOf` row and no pattern, and no lexical form is in it (`emptyDomains` of the
 * attribute grammar): `xs:NOTATION`'s in the pinned grammar, the text domain of a foreign element
 * whose `xsi:type` names it (C47). A law refuses a value of one by `¬in(domain, emptyDomains)`,
 * since grizzle admits no pattern no text matches (`scalar/regex/admit.ts:121`).
 */
export const emptyDomains: readonly (typeof ValueDomain.handles)[number][] =
  grammar.attributes.emptyDomains.map((domain) =>
    handleIn("ValueDomain", ValueDomain.handles, domain),
  );

/**
 * The identity of each domain that has one.
 */
const identityOf: ReadonlyMap<string, string> = new Map(
  grammar.attributes.identity.rows.map(({ domain, identity }) => [domain, identity] as const),
);

/**
 * `ValueIdentity`: domain → identity, total, the identity type of each domain, `none` for one of no
 * identity, so an overlay selects the attributes whose domain is an `xs:ID` or carries `xs:IDREF`
 * tokens.
 */
export const ValueIdentity = closed.relation(
  "ValueIdentity",
  { domain: closedId(ValueDomain), identity: closedId(Identity) },
  ["domain"],
  ValueDomain.handles.map((domain) => ({ domain, identity: identityOf.get(domain) ?? none })),
);

/**
 * The domain a governor reads a text in where it has no simple content: `xs:anySimpleType`, every
 * value (`attributes.ts`).
 */
const anyTextDomain = memberOf(grammar.attributes.valueDomain.key[0].roster, openDomain.handle);

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
 * `TextDomain`: (version, governor) → domain, total, the value domain an element under the governor
 * holds its text in: its kind's simple content for a kind, the governing type's for a (kind, type),
 * and `xs:anySimpleType` where the governor has no simple content.
 */
export const TextDomain = closed.relation(
  "TextDomain",
  { domain: closedId(ValueDomain), governor: closedId(Governor), version: closedId(SchemaVersion) },
  ["version", "governor"],
  grammar.kinds.versions.handles.flatMap((version) =>
    Governor.handles.map((governor) => ({
      domain: textDomainAt.get(`${version} ${governor}`) ?? anyTextDomain,
      governor,
      version,
    })),
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
 * `none` and XML Schema's own types (spec readings 60 and 72; C15, C36). An element whose parent's
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

// Files (spec reading 95).

/**
 * `ReferenceAttribute`: (version, kind, name) → form, every attribute by which an element of a kind
 * names a file of its package in the version, and how its value names it: R6's census, IMS Content
 * Packaging 1.2's InterchangePackage (d) (spec reading 95). A law reads it as
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
 * `BaseTypeSelf`: the diagonal of `BaseType`, so `BaseTypeSelf.row(b)` is the singleton {b} (C6),
 * an operand's one-handle set of base types.
 */
export const BaseTypeSelf = closed.relation(
  "BaseTypeSelf",
  { baseType: closedId(BaseType), self: closedId(BaseType) },
  ["baseType", "self"],
  BaseType.handles.map((baseType) => ({ baseType, self: baseType })),
);

/**
 * `CardinalitySelf`: the diagonal of `Cardinality`, so `CardinalitySelf.row(c)` is the singleton
 * {c} (C6), an operand's one-handle set of cardinalities.
 */
export const CardinalitySelf = closed.relation(
  "CardinalitySelf",
  { cardinality: closedId(Cardinality), self: closedId(Cardinality) },
  ["cardinality", "self"],
  Cardinality.handles.map((cardinality) => ({ cardinality, self: cardinality })),
);

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
 * `ResourceTypeOf`: the set of (version, type) a resource may carry.
 */
export const ResourceTypeOf = closed.relation(
  "ResourceTypeOf",
  { type: closedId(ResourceType), version: closedId(SchemaVersion) },
  ["version", "type"],
  grammar.package.resourceTypeOf.rows.map(({ type, version }) => ({ type, version })),
);

/**
 * `RootOfType`: the set of (type, root), each root element kind the documents a resource type
 * lists may have; a type with no row lists no document. Each type but an included fragment's has
 * one root, and the fragment's type has every kind an include stands for (spec reading 107).
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

// Includes (spec readings 76 and 107).

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
 * `BuiltInVariable`: (root, variable) → (declaration, baseType, cardinality), each built-in
 * variable the processing of a document's root holds, with the declaration kind, base type and
 * cardinality it stands as there (spec reading 29, the UP audit's A63): an item's and a response
 * processing template's `numAttempts`, `duration` (a float) and `completionStatus`, a test's and a
 * section's `duration` (a duration), and `QTI_CONTEXT`, a record of base type `none`, under all
 * four. A reference to it reads as one to a declaration of that kind and type, and a name with no
 * row under its document's root is no built-in there.
 */
export const BuiltInVariable = closed.relation(
  "BuiltInVariable",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    declaration: closedId(DeclarationKind),
    root: closedId(NodeKind),
    variable: closedId(BuiltIn),
  },
  ["root", "variable"],
  grammar.references.builtIn.rows.map(({ baseType, cardinality, declaration, root, variable }) => ({
    baseType: handleIn("BaseType", BaseType.handles, baseType),
    cardinality: handleIn("Cardinality", Cardinality.handles, cardinality),
    declaration,
    root: memberOf(grammar.kinds.nodeKind, root),
    variable,
  })),
);

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
 * written code: `eq(BaseTypeLexical.at("lexical", baseType), lexical)`; `none` has none.
 */
export const BaseTypeLexical = closed.relation(
  "BaseTypeLexical",
  { code: closedId(BaseType), lexical: anyText },
  ["code"],
  BaseType.handles.filter((code) => code !== none).map((code) => ({ code, lexical: code })),
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
 * `ReservedTargetLexical`: code → lexical, each reserved branch target's lexical form, which proves
 * an overlay's written code: `eq(ReservedTargetLexical.at("lexical", code), target)`. A target is
 * spelled exactly, so `in(target, reservedTargets)` reads the same set as text.
 */
export const ReservedTargetLexical = closed.relation(
  "ReservedTargetLexical",
  { code: closedId(ReservedTarget), lexical: anyText },
  ["code"],
  ReservedTarget.handles.map((code) => ({ code, lexical: code })),
);

/**
 * The reserved branch targets' lexical forms, the list `Compute.in` reads a written target against:
 * a target in it names an exit, any other an identifier of the test.
 */
export const reservedTargets: readonly string[] = ReservedTarget.handles;

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
