/**
 * The queries `Qti` names over its stored level (`#pantry/qti/base.ts` `QtiBase`), and every rule
 * that reads one: grizzle's rules over queries (README, "Rules over queries"). Each query is a live
 * derived relation, `derived(name, query(QtiBase)…)`, which stores nothing: a rule over it reads
 * its definition as the tables stand at COMMIT, through a deferred constraint trigger on each table
 * the definition reads. A relation the database derives from what the import writes is a query
 * here, never a stored copy the import keeps in step.
 *
 * A query is over the stored level, and no law of that level reads one, so the queries and their
 * rules live here, in a module `base.ts` never imports, and `Qti` (`#pantry/qti/schema.ts`) is the
 * level that holds them. Each domain's rules are grouped by the law each states, as every module's
 * are, and {@link queryLawsByName} lists those groups, so the importer names a refusal by them
 * (`#pantry/import/refusal.ts` `namedLaws`).
 *
 * A derived relation's definition reads only the levels below its own, never another derived
 * relation of this level (grizzle's `admitExtend`), so a definition several queries share is a
 * query of its own over `QtiBase`, such as {@link namingRecords}, which each of them matches.
 */
import {
  check,
  Compute,
  contained,
  derived,
  mirrors,
  on,
  query,
  select,
  v,
} from "@bjornpagen/grizzle";
import { documentTypes } from "#pantry/grammar/install.ts";
import { QtiBase } from "#pantry/qti/base.ts";
import { DeclarationIdentifier } from "#pantry/qti/declarations.ts";
import {
  heldKinds,
  lookupKindHandle,
  ReadingForm,
  setKindHandles,
} from "#pantry/qti/expression-types.ts";
import {
  Expression,
  MappingSourceDeclaration,
  PlacedVariableRef,
  Reading,
  ReadingDeclaration,
  silentBases,
  VariableRef,
  VariableRefTable,
} from "#pantry/qti/expressions.ts";
import { GeneralObject } from "#pantry/qti/identity.ts";
import {
  AssessmentObject,
  languageTagPattern,
  LomEntry,
  LomGeneral,
  LomRecord,
  LomTitle,
  LomTitleString,
  noLanguage,
  ObjectIdentifier,
  ObjectTitle,
  objectTypes,
  resourceMetadata,
} from "#pantry/qti/metadata.ts";
import { ResourceDocument, ResourceHref, ResourceTyped } from "#pantry/qti/package.ts";
import {
  AssembledName,
  InstanceName,
  ItemRefDocument,
  itemRefKind,
  ItemRefTarget,
  VariableMapping,
} from "#pantry/qti/tests.ts";

/**
 * The href of a resource that has a type, by the resource's node: its {@link ResourceHref}'s
 * package, path and scope beside its {@link ResourceTyped}'s code, so a document-typed resource's
 * href is judged as the document it names. A resource with an href and no type, or a type and no
 * href, has no typed href, so no rule over one asks anything of it.
 *
 * Its rows are a join no table stores and no write keeps, which the importer reads on the host
 * before it writes a row, to name the documents it reads (`#pantry/import/overlays/package.ts`
 * `typedHrefsOf`).
 */
export const TypedHref = derived(
  "TypedHref",
  query(QtiBase).rule((r) => {
    const { node, package: pkg, path, scope } = v(ResourceHref, "href");
    const { type } = v(ResourceTyped, "typed");

    return r
      .match(ResourceHref, { node, package: pkg, path, scope })
      .match(ResourceTyped, { node, type })
      .find({ node, package: pkg, path, scope, type });
  }),
);

/**
 * The typed hrefs whose type `RootOfType` maps: each names a document of that type.
 */
const documentHrefs = select(TypedHref, (h) => h.in(h.type, documentTypes));

/**
 * Every rule over a typed href, each `check` named by its oracle law with spaces written as
 * underscores, the halves of P2 and P3 that `#pantry/qti/package.ts` states over the tables:
 *
 * - **P3 `entry-kind` ("Document entry"):** every document-typed href resolves in the package and
 *   names the one document at its path, of the href's type (reading 93). That document is an entry
 *   by `ResourceDocument`'s copy of its `Document` and the `Document`'s containment into `Entry`,
 *   so no rule here restates it.
 * - **P2 `root-type-reverse` ("RootOfType"):** every document a resource lists is at the path of a
 *   typed href of its type (spec reading 167).
 * - **B2 and B3 ("Item ref target"):** an item ref's target is a (path, type) pair a typed href of
 *   its package names.
 */
export const packageQueryLawsByName = {
  "Document entry": [
    check("Document_entry", TypedHref, (h) =>
      h.or(h.not(h.in(h.type, documentTypes)), h.eq(h.scope, "entry")),
    ),
    contained(
      on(documentHrefs, "package", "path", "type"),
      on(ResourceDocument, "package", "path", "type"),
    ),
  ],
  "Item ref target": [
    contained(
      on(ItemRefTarget, "package", "path", "type"),
      on(TypedHref, "package", "path", "type"),
    ),
  ],
  RootOfType: [
    contained(
      on(ResourceDocument, "package", "path", "type"),
      on(TypedHref, "package", "path", "type"),
    ),
  ],
} as const;

/**
 * {@link packageQueryLawsByName}'s rules in one list.
 */
const packageQueryLaws = Object.values(packageQueryLawsByName).flat();

/**
 * The records that name a document, each with that document (spec reading 62): a `lom:lom` of a
 * resource's `cp:metadata`, its resource of an item's or a test's type, and the document a resource
 * lists at the path the resource's `href` names ({@link ResourceDocument}), whatever type it is
 * read as (reading 162). A record whose resource has no `href`, no such type, or an `href` that
 * names no listed document names none, and no law reads it: "Document entry" refuses that `href`
 * (reading 93). The manifest is no resource's document (reading 146), so an `href` that names it
 * names none (NS6).
 *
 * The record keys a row, since a record's resource has one `href` and one type, and the package
 * lists one document at a path (`ResourceDocument`'s key over `package` and `path`).
 */
export const namingRecords = query(QtiBase).rule((r) => {
  const { node: record, ownerParent: resource } = v(LomRecord, "record");
  const { package: pkg, path } = v(ResourceHref, "href");
  const { type } = v(ResourceTyped, "typed");
  const { node: document } = v(ResourceDocument, "document");

  return r
    .match(LomRecord, { node: record, owner: resourceMetadata, ownerParent: resource })
    .match(ResourceHref, { node: resource, package: pkg, path })
    .match(ResourceTyped, { node: resource, package: pkg, type })
    .match(ResourceDocument, { node: document, package: pkg, path })
    .where(r.inSet(type, objectTypes))
    .find({ document, record });
});

/**
 * The records that name a document and whose general category lists an `identifier`, each by its
 * record: `lom-identifier` reads each (§2.7.1.1). A meta-metadata's or a relation's identifier is
 * no general one.
 */
export const ListedIdentifier = derived(
  "ListedIdentifier",
  query(QtiBase).rule((r) => {
    const { holderParent: record } = v(LomEntry, "entry");

    return r
      .match(LomEntry, { holderKind: "lom:general", holderParent: record })
      .match(namingRecords, { record })
      .find({ record });
  }),
);

/**
 * The records that name a document one of whose general `identifier` entries is that document's
 * identifier, each by its record (§2.7.1.1: "One of the values given for the identifier must have
 * an entry that matches the identifier of the associated item, test or object bank"): the entry's
 * trimmed token is the root's collapsed `identifier` ({@link ObjectIdentifier}), so a document that
 * writes none is named by no entry.
 */
export const MatchedIdentifier = derived(
  "MatchedIdentifier",
  query(QtiBase).rule((r) => {
    const { holderParent: record, token } = v(LomEntry, "entry");
    const { document } = v(namingRecords, "named");

    return r
      .match(LomEntry, { holderKind: "lom:general", holderParent: record, token })
      .match(namingRecords, { document, record })
      .match(ObjectIdentifier, { document, identifier: token })
      .find({ record });
  }),
);

/**
 * The records that name a document and whose general category has a `title`, each by its record:
 * `lom-title` reads each (§2.7.1.2).
 */
export const ListedTitle = derived(
  "ListedTitle",
  query(QtiBase).rule((r) => {
    const { record } = v(LomTitle, "title");

    return r.match(LomTitle, { record }).match(namingRecords, { record }).find({ record });
  }),
);

/**
 * The records that name a document one of whose title strings is that document's title in its
 * language, each by its record (§2.7.1.2: "The title must have a value that matches the value of
 * the title attribute of the associated item, test or object bank. The language used to interpret
 * the title is taken from the language attribute"): the string's `textValue` is the root's
 * `titleValue` ({@link ObjectTitle}), both in `xs:normalizedString`'s value space, and the root
 * states no language (its compared `xml:lang` is no language tag, spec reading 151), or the string
 * has none ({@link noLanguage}), or the two are one tag without regard to case.
 */
export const MatchedTitle = derived(
  "MatchedTitle",
  query(QtiBase).rule((r) => {
    const { languageTag, record, textValue } = v(LomTitleString, "string");
    const { document } = v(namingRecords, "named");
    const { langTag } = v(AssessmentObject, "root");

    return r
      .match(LomTitleString, { languageTag, record, textValue })
      .match(namingRecords, { document, record })
      .match(ObjectTitle, { document, titleValue: textValue })
      .match(AssessmentObject, { document, langTag })
      .where(
        r.or(
          Compute.not(Compute.matches(langTag, languageTagPattern)),
          r.eq(languageTag, noLanguage),
          r.eq(languageTag, langTag),
        ),
      )
      .find({ record });
  }),
);

/**
 * The general categories of the records that name a document, keyed by the category's node, each
 * with that document: the categories R26 reads a document's languages against
 * (`#pantry/qti/identity.ts` `documentLang`).
 */
export const NamingGeneral = derived(
  "NamingGeneral",
  query(QtiBase).rule((r) => {
    const { node: general, parent: record } = v(LomGeneral, "general");
    const { document } = v(namingRecords, "named");

    return r
      .match(LomGeneral, { node: general, parent: record })
      .match(namingRecords, { document, record })
      .find({ document, general });
  }),
);

/**
 * The identity overlays' rules over a query, each named by its oracle law: each `GeneralObject`,
 * the stored copy R26's count reads (gap G2), is exactly a {@link NamingGeneral} row, both ways
 * ("E1 derived").
 */
export const identityQueryLawsByName = {
  "E1 derived": [
    mirrors(on(GeneralObject, "document", "general"), on(NamingGeneral, "document", "general")),
  ],
} as const;

/**
 * The metadata overlays' rules over a query, each named by its oracle law (spec reading 62):
 *
 * - **`lom-identifier`:** a record that names a document and lists a general identifier names that
 *   document's identifier ("LomObjectIdentifier");
 * - **`lom-title`:** a record that names a document and has a general title names that document's
 *   title in its language ("LomObjectTitle").
 */
export const metadataQueryLawsByName = {
  LomObjectIdentifier: [contained(on(ListedIdentifier, "record"), on(MatchedIdentifier, "record"))],
  LomObjectTitle: [contained(on(ListedTitle, "record"), on(MatchedTitle, "record"))],
} as const;

/**
 * The identity overlays' rules over a query, in one list.
 */
const identityQueryLaws = Object.values(identityQueryLawsByName).flat();

/**
 * The metadata overlays' rules over a query, in one list.
 */
const metadataQueryLaws = Object.values(metadataQueryLawsByName).flat();

/**
 * The type a setter or a lookup sets its variable to, one row per expression it holds: its
 * `VariableRef` by `identifier` (`node`, `kind`, `baseType`, `cardinality` and `resolution`, the
 * reference's) joined with each `Expression` whose parent it is (`heldBase` and `heldCardinality`,
 * that expression's type). Its content model allows one expression, and a second breaks N5's
 * `Follow`, so a lawful setter or lookup has one row. `Set_type` (P20) and `Lookup_type` (P22) read
 * it.
 *
 * A setter whose `identifier` names no variable, unwritten or no NCName (spec reading 152), has no
 * reference, and one that holds no expression holds no type, so neither has a row, and AL3, its
 * value domain or its content model refuses it alone.
 */
export const HeldType = derived(
  "HeldType",
  query(QtiBase).rule((r) => {
    const { baseType, cardinality, kind, node, resolution } = v(VariableRef, "reference");
    const { baseType: heldBase, cardinality: heldCardinality } = v(Expression, "held");

    return r
      .match(VariableRef, {
        attribute: "identifier",
        baseType,
        cardinality,
        kind,
        node,
        resolution,
      })
      .match(Expression, { baseType: heldBase, cardinality: heldCardinality, parent: node })
      .where(r.inSet(kind, heldKinds))
      .find({ baseType, cardinality, heldBase, heldCardinality, kind, node, resolution });
  }),
);

/**
 * A reference to a name its document declares: each `VariableRef` joined with its document's
 * `DeclarationIdentifier` of the name it spells, whatever the declaration's cardinality spells
 * (spec reading 159). A reference resolves to a declaration exactly where its document declares
 * its name (M2), so `E1_derived` holds every row's `resolution` to `declared`, and a reference that
 * resolves to a built-in or to nothing is none of them.
 */
export const DeclaredReference = derived(
  "DeclaredReference",
  query(QtiBase).rule((r) => {
    const { attribute, document, identifier, node, resolution } = v(VariableRef, "reference");

    return r
      .match(VariableRef, { attribute, document, identifier, node, resolution })
      .match(DeclarationIdentifier, { document, identifier })
      .find({ attribute, node, resolution });
  }),
);

/**
 * A placed reference to a name its assembly's item declares (spec reading 117), as
 * {@link DeclaredReference} is a document's own: each `PlacedVariableRef` joined with the item's
 * `DeclarationIdentifier` of the name it spells, every row `declared`.
 */
export const DeclaredPlacement = derived(
  "DeclaredPlacement",
  query(QtiBase).rule((r) => {
    const { assembly, attribute, identifier, instance, node, resolution } = v(
      PlacedVariableRef,
      "placed",
    );

    return r
      .match(PlacedVariableRef, { assembly, attribute, identifier, instance, node, resolution })
      .match(DeclarationIdentifier, { document: assembly, identifier })
      .find({ attribute, instance, node, resolution });
  }),
);

/**
 * A variable mapping whose item declares its target (spec reading 97): each
 * `MappingSourceDeclaration` joined with its item's `DeclarationIdentifier` of its target, which
 * `Variable_mapping_target` holds to the mapping's own source: a mapping may not rename a variable
 * of the item into another of the item's.
 */
export const DeclaredTarget = derived(
  "DeclaredTarget",
  query(QtiBase).rule((r) => {
    const { itemDocument, node, source, target } = v(MappingSourceDeclaration, "mapping");

    return r
      .match(MappingSourceDeclaration, { itemDocument, node, source, target })
      .match(DeclarationIdentifier, { document: itemDocument, identifier: target })
      .find({ node, source, target });
  }),
);

/**
 * A written element of a test's assembly as a reading's scope reads it (spec readings 48 and 86):
 * each `AssembledName`, its identifier, node and placements, joined with each `InstanceName` that
 * places it, its kind and whether a replacement can repeat it there. A found reading's scope is
 * one of these rows, so a reading of an element placed twice reads one of its instances.
 */
export const FoundName = derived(
  "FoundName",
  query(QtiBase).rule((r) => {
    const { assembly, identifier, node, placements } = v(AssembledName, "name");
    const { kind, replaced } = v(InstanceName, "placed");

    return r
      .match(AssembledName, { assembly, identifier, node, placements })
      .match(InstanceName, { assembly, kind, node, replaced })
      .find({ assembly, identifier, kind, node, placements, replaced });
  }),
);

/**
 * A reading whose scope its test's assembly holds an element of: each `Reading` joined with the
 * `AssembledName` its `scope` names, which `E1_derived` holds `found`. A reading whose scope the
 * assembly holds none of has no row, and is not found.
 */
export const HeldScope = derived(
  "HeldScope",
  query(QtiBase).rule((r) => {
    const { assembly, attribute, form, found, node, scope, split } = v(Reading, "reading");

    return r
      .match(Reading, { assembly, attribute, form, found, node, scope, split })
      .match(AssembledName, { assembly, identifier: scope })
      .find({ assembly, attribute, form, found, node, split });
  }),
);

/**
 * A reading whose variable the document it reads declares (spec readings 48 and 106): an unsplit
 * reading's in the test's declarations, and a split or numbered reading's through a found item
 * ref in the declarations of the item it names (`ItemRefDocument`), each joined with the
 * `DeclarationIdentifier` of its variable, whatever its cardinality spells (spec reading 159),
 * with its kind and its counts of cardinalities and base types. An item ref that names an LTI
 * link, or an item whose document the package lacks, names no declarations, so a reading through
 * it has no row.
 *
 * A reading is `declared` exactly where it is one of these (`E1_derived`), and a resolving one's
 * `ReadingDeclaration` names that declaration.
 */
export const DeclaredReading = derived(
  "DeclaredReading",
  query(QtiBase)
    .rule((r) => {
      const { assembly, attribute, node, split, variable } = v(Reading, "reading");
      const {
        baseTypes,
        cardinalities,
        declarationKind,
        node: declaration,
      } = v(DeclarationIdentifier, "declared");

      return r
        .match(Reading, { assembly, attribute, form: "unsplit", node, split, variable })
        .match(DeclarationIdentifier, {
          baseTypes,
          cardinalities,
          declarationKind,
          document: assembly,
          identifier: variable,
          node: declaration,
        })
        .find({
          assembly,
          attribute,
          baseTypes,
          cardinalities,
          declaration,
          declarationKind,
          form: ReadingForm.handle("unsplit"),
          node,
          split,
        });
    })
    .rule((r) => {
      const { assembly, attribute, form, named, node, split, variable } = v(Reading, "reading");
      const { document } = v(ItemRefDocument, "item");
      const {
        baseTypes,
        cardinalities,
        declarationKind,
        node: declaration,
      } = v(DeclarationIdentifier, "declared");

      return r
        .match(Reading, {
          assembly,
          attribute,
          form,
          found: true,
          named,
          namedKind: itemRefKind,
          node,
          split,
          variable,
        })
        .match(ItemRefDocument, { document, node: named })
        .match(DeclarationIdentifier, {
          baseTypes,
          cardinalities,
          declarationKind,
          document,
          identifier: variable,
          node: declaration,
        })
        .where(r.inSet(form, ["split", "numbered"]))
        .find({
          assembly,
          attribute,
          baseTypes,
          cardinalities,
          declaration,
          declarationKind,
          form,
          node,
          split,
        });
    }),
);

/**
 * A reading whose variable its item ref maps (spec reading 97): a split or numbered reading
 * through a found item ref, joined with the `VariableMapping` of that item ref whose target is its
 * variable. A mapped variable's reading is `declared`, where the item declares it too, or `mapped`
 * (`E1_derived`).
 */
export const MappedReading = derived(
  "MappedReading",
  query(QtiBase).rule((r) => {
    const { assembly, attribute, form, named, node, source, split, variable } = v(
      Reading,
      "reading",
    );

    return r
      .match(Reading, {
        assembly,
        attribute,
        form,
        found: true,
        named,
        namedKind: itemRefKind,
        node,
        source,
        split,
        variable,
      })
      .match(VariableMapping, { parent: named, target: variable })
      .where(r.inSet(form, ["split", "numbered"]))
      .find({ assembly, attribute, form, node, source, split });
  }),
);

/**
 * A reading's key: its reference in its test, its form and the dot it splits at.
 */
const readingKey = ["assembly", "node", "attribute", "form", "split"] as const;

/**
 * The rules over the expression overlays' queries, grouped by the law each states, each `check`
 * named by its oracle law: `E1_derived`, each reference's resolution and each reading's scope and
 * source proved from what they are derived from; `Lookup_type` (P22) and `Set_type` (P20) over
 * {@link HeldType}; and `Variable_mapping_target` (reading 97) over {@link DeclaredTarget}.
 */
export const expressionQueryLawsByName = {
  "E1 derived": [
    // A reference, or a placed one, to a name its document or its assembly's item declares
    // resolves to that declaration.
    check("E1_derived", DeclaredReference, (d) => d.eq(d.resolution, "declared")),
    check("E1_derived", DeclaredPlacement, (d) => d.eq(d.resolution, "declared")),
    // A reading's scope: a found one is a written element of its assembly, its node, kind,
    // placements and replacement copied, and one the assembly holds an element of is found.
    contained(
      on(
        select(Reading, (r) => r.and(r.ne(r.form, "unsplit"), r.eq(r.found, true))),
        "assembly",
        "scope",
        "named",
        "namedKind",
        "placements",
        "replaced",
      ),
      on(FoundName, "assembly", "identifier", "node", "kind", "placements", "replaced"),
    ),
    check("E1_derived", HeldScope, (h) => h.eq(h.found, true)),
    // A reading's source: declared exactly where the document it reads declares its variable,
    // that declaration its ReadingDeclaration's; where its item ref maps it, declared or mapped.
    mirrors(
      on(
        select(Reading, (r) => r.eq(r.source, "declared")),
        ...readingKey,
      ),
      on(DeclaredReading, ...readingKey),
    ),
    contained(
      on(
        select(ReadingDeclaration, (d) => d.eq(d.source, "declared")),
        ...readingKey,
        "declaration",
        "declarationKind",
        "declBaseTypes",
        "declCardinalities",
      ),
      on(
        DeclaredReading,
        ...readingKey,
        "declaration",
        "declarationKind",
        "baseTypes",
        "cardinalities",
      ),
    ),
    contained(
      on(
        select(Reading, (r) => r.eq(r.source, "mapped")),
        ...readingKey,
      ),
      on(MappedReading, ...readingKey),
    ),
    check("E1_derived", MappedReading, (m) => m.in(m.source, ["declared", "mapped"])),
  ],
  "Lookup type": [
    check("Lookup_type", HeldType, (h) =>
      h.or(
        h.ne(h.kind, lookupKindHandle),
        h.and(
          h.in(h.heldCardinality, ["single", "unknown"]),
          h.in(h.heldBase, ["duration", "float", "integer", ...silentBases]),
        ),
      ),
    ),
    // A match table maps an integer: a declared lookup of a value of another base claims an
    // interpolation table, its declaration's one lookup table where it claims one.
    contained(
      on(
        select(HeldType, (h) =>
          h.and(
            h.eq(h.kind, lookupKindHandle),
            h.eq(h.resolution, "declared"),
            h.not(h.in(h.heldBase, ["integer", ...silentBases])),
          ),
        ),
        "node",
      ),
      on(
        select(VariableRefTable, (t) =>
          t.and(t.eq(t.table, "qti-interpolation-table"), t.eq(t.attribute, "identifier")),
        ),
        "node",
      ),
    ),
  ],
  "Set type": [
    check("Set_type", HeldType, (h) =>
      h.or(
        h.not(h.in(h.kind, setKindHandles)),
        h.and(
          h.or(
            h.eq(h.heldBase, h.baseType),
            h.in(h.heldBase, silentBases),
            h.in(h.baseType, silentBases),
          ),
          h.or(
            h.eq(h.heldCardinality, h.cardinality),
            h.eq(h.heldCardinality, "unknown"),
            h.eq(h.cardinality, "unknown"),
          ),
        ),
      ),
    ),
  ],
  "Variable mapping target": [
    check("Variable_mapping_target", DeclaredTarget, (m) => m.eq(m.target, m.source)),
  ],
} as const;

/**
 * The expression overlays' rules over queries, in one list.
 */
const expressionQueryLaws = Object.values(expressionQueryLawsByName).flat();

/**
 * Every query `Qti` names, under its own name.
 */
export const queryRelations = {
  DeclaredPlacement,
  DeclaredReading,
  DeclaredReference,
  DeclaredTarget,
  FoundName,
  HeldScope,
  HeldType,
  ListedIdentifier,
  ListedTitle,
  MappedReading,
  MatchedIdentifier,
  MatchedTitle,
  NamingGeneral,
  TypedHref,
};

/**
 * Each domain's rules over the queries, grouped by the law each states, one record per domain.
 */
export const queryLawsByName = [
  packageQueryLawsByName,
  identityQueryLawsByName,
  metadataQueryLawsByName,
  expressionQueryLawsByName,
] as const;

/**
 * One rule over a query, as its domain states it: the union of each domain's statement types, each
 * read from that domain's one record (`Object.values(record).flat()`), never from the list of
 * records. `Object.values` over a union of records falls back to lib's `values(o: {}): any[]`, and
 * a statement typed `any` types every statement of `Qti` `any` with it, so that grizzle can tell no
 * nested member's count apart; grizzle's `schema.extend` refuses such a list (`1387c79d`).
 */
type QueryStatement =
  | (typeof packageQueryLaws)[number]
  | (typeof identityQueryLaws)[number]
  | (typeof metadataQueryLaws)[number]
  | (typeof expressionQueryLaws)[number];

/**
 * Every rule over a query, each domain's list spread in {@link queryLawsByName}'s order.
 */
export const queryLaws: readonly QueryStatement[] = [
  ...packageQueryLaws,
  ...identityQueryLaws,
  ...metadataQueryLaws,
  ...expressionQueryLaws,
];
