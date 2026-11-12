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
 * are, in {@link queryLawsByName} beside the rules, so the schema's own naming of its laws reads
 * them (`#pantry/test/law-namer.ts` `namedLaws`).
 *
 * A derived relation's definition reads only the levels below its own, never another derived
 * relation of this level (grizzle's `admitExtend`), so a definition several queries share is a
 * query of its own over the stored level, such as `namingRecords`, which each of them matches.
 */
import {
  check,
  Compute,
  contained,
  derived,
  key,
  mirrors,
  on,
  query,
  select,
  v,
} from "@bjornpagen/grizzle";
import { documentTypes, NodeKind } from "#pantry/grammar/install.ts";
import { QtiBase } from "#pantry/qti/base.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { DataSsmlMember, DataSsmlProperty } from "#pantry/qti/data-ssml.ts";
import {
  DeclarationBaseType,
  DeclarationCardinality,
  DeclarationIdentifier,
} from "#pantry/qti/declarations.ts";
import {
  Choice,
  Hottext,
  itemBuiltInNames,
  PlacedChoice,
  PlacedHottext,
} from "#pantry/qti/interactions.ts";
import {
  conditionKindHandles,
  declaredKinds,
  heldKinds,
  lookupKindHandle,
  ReadingForm,
  setKindHandles,
} from "#pantry/qti/expression-types.ts";
import {
  Expression,
  MappingItemRefType,
  MappingSourceDeclaration,
  PlacedVariableRef,
  PlacedVariableRefDeclaration,
  Reading,
  ReadingDeclaration,
  silentBases,
  VariableRef,
  VariableRefTable,
} from "#pantry/qti/expressions.ts";
import {
  AssembledLang,
  DocumentLang,
  ResourceLomLanguageSet,
  statedLanguagePattern,
} from "#pantry/qti/identity.ts";
import {
  languageTagPattern,
  LomEntry,
  LomGeneral,
  LomRecord,
  LomString,
  LomTitle,
  LomTitleString,
  ObjectIdentifier,
  ObjectLang,
  ObjectTitle,
  objectTypes,
  resourceMetadata,
} from "#pantry/qti/metadata.ts";
import { integerKeyPattern, itemPattern, MapKeyItems, MapKeyType } from "#pantry/qti/mapping.ts";
import { doublePattern } from "#pantry/qti/operators.ts";
import {
  ManifestId,
  ResourceDocument,
  ResourceHref,
  ResourceId,
  ResourceTyped,
} from "#pantry/qti/package.ts";
import { Document } from "#pantry/qti/chardata.ts";
import {
  AssembledName,
  Instance,
  instanceRoots,
  InstanceName,
  ItemRefDocument,
  ItemRefHref,
  SiteTarget,
  TestDocument,
  VariableMapping,
} from "#pantry/qti/tests.ts";
import {
  itemKind,
  itemRefKind,
  itemResourceType,
  linkResourceTypes,
} from "#pantry/vocab/terms/tests.ts";
import { noLanguage } from "#pantry/vocab/terms/metadata.ts";

/**
 * The href of a resource that has a type, by the resource's place, `(package, path, start)`: its
 * {@link ResourceHref}'s scope and `target`, the path it is compared by, beside its
 * {@link ResourceTyped}'s code, so a document-typed resource's href is judged as the document it
 * names. A resource with an href and no type, or a type and no href, has no typed href, so no rule
 * over one asks anything of it.
 *
 * Its rows are a join no table stores and no write keeps, which the importer reads on the host
 * before it writes a row, to name the documents it reads (`#pantry/import/overlays/package.ts`
 * `typedHrefsOf`). It is a query of its own, which {@link TypedHref} names, so the queries over an
 * item ref's target ({@link itemRefTargets}, {@link targetHrefs}) match and negate it.
 */
const typedHrefs = query(QtiBase).rule((r) => {
  const { package: pkg, path, scope, start, target } = v(ResourceHref, "href");
  const { type } = v(ResourceTyped, "typed");

  return r
    .match(ResourceHref, { package: pkg, path, scope, start, target })
    .match(ResourceTyped, { package: pkg, path, start, type })
    .find({ package: pkg, path, scope, start, target, type });
});

/**
 * {@link typedHrefs} as a relation of the schema, which the rules of "Document entry",
 * "RootOfType" and the importer read.
 */
const TypedHref = derived("TypedHref", typedHrefs);

/**
 * The href of a resource whose `type` is written and spells no `ResourceType` handle, by the
 * resource's place: its {@link ResourceHref}'s `target`, where the resource's manifest `type` is
 * nonempty and the resource has no {@link ResourceTyped}, whose rows are exactly the resources
 * whose `type` spells a handle (spec reading 67: AL1's value domain refuses the `type` alone). The
 * two conditions are two filters, the `type` nonempty and no {@link ResourceTyped} naming the
 * resource, so the query reads no pattern over the attribute's unbounded lexical form. A resource
 * that writes no `type` has none (AL3 refuses it alone), and neither has one that writes no
 * `href`, which names no path. Its rows are a join no table stores, which "Item ref target" reads:
 * an item ref with no target ({@link UntargetedItemRef}) names a path one of these names, or is
 * refused (the oracle's `itemRefTargetOf` names no target there).
 */
const UnreadTypeHref = derived(
  "UnreadTypeHref",
  query(QtiBase).rule((r) => {
    const { package: pkg, path, start, target } = v(ResourceHref, "href");
    const { lexical } = v(Attribute, "type");

    return r
      .match(ResourceHref, { package: pkg, path, start, target })
      .match(Attribute, {
        documentType: "manifest",
        kind: "cp:resource",
        lexical,
        name: "type",
        package: pkg,
        path,
        start,
      })
      .where(r.ne(lexical, ""))
      .where(r.not(ResourceTyped, { package: pkg, path, start }))
      .find({ package: pkg, path, start, target });
  }),
);

/**
 * The paths a resource of the item type or an LTI type names, by package: the paths an item ref's
 * target is named at (the UP audit's B2 and B3, R36). An item ref whose target none of them names
 * has no target ({@link UntargetedItemRef}).
 */
const targetHrefs = query(QtiBase).rule((r) => {
  const { package: pkg, target, type } = v(typedHrefs, "typed");

  return r
    .match(typedHrefs, { package: pkg, target, type })
    .where(r.inSet(type, [itemResourceType, ...linkResourceTypes]))
    .find({ package: pkg, target });
});

/**
 * What an item ref names, by the item ref's place (the UP audit's B2 and B3): its
 * {@link ItemRefHref}'s `target`, and `type`, the type of a resource of the package whose href's
 * target that is, of the item type where one is, and else of an LTI type: the URI an
 * item ref holds is "the URI used to refer to the item's file (e.g., elsewhere in the same
 * content package)" (information model §5.6.5, `href`), so it names an item of the package, or an
 * LTI link (R36). Two rules state it, one per kind of target, and the link's negates the item's,
 * so an href that a resource of each type names is an item's alone. A path that several LTI types
 * name is a row per type, each a link.
 *
 * An item ref whose target no resource of either kind names has no target, and "Item ref target"
 * holds it to one a resource of an unread type names ({@link UntargetedItemRef}): a path
 * only a resource of another type the importer reads names, a test's or a stimulus's, is refused
 * there. One that writes no href has no {@link ItemRefHref} and names nothing, which AL3 alone
 * refuses (spec reading 155).
 *
 * In the corpus, feedbackTest's item ref `Example03-feedbackBlock-solution/...` names no file of
 * its package, which "Item ref target" refuses (`item-ref-target`, the verdict file's rule for
 * it), and testWithLti's two item refs name LTI links, a package refused under another rule.
 */
const itemRefTargets = query(QtiBase)
  .rule((r) => {
    const { package: pkg, path, start, target } = v(ItemRefHref, "href");
    const { type } = v(typedHrefs, "item");

    return r
      .match(ItemRefHref, { package: pkg, path, start, target })
      .match(typedHrefs, { package: pkg, target, type })
      .where(r.eq(type, itemResourceType))
      .find({ package: pkg, path, start, target, type });
  })
  .rule((r) => {
    const { package: pkg, path, start, target } = v(ItemRefHref, "href");
    const { type } = v(typedHrefs, "link");

    return r
      .match(ItemRefHref, { package: pkg, path, start, target })
      .match(typedHrefs, { package: pkg, target, type })
      .where(r.inSet(type, linkResourceTypes))
      .where(r.not(typedHrefs, { package: pkg, target, type: itemResourceType }))
      .find({ package: pkg, path, start, target, type });
  });

/**
 * {@link itemRefTargets} as a relation of the schema, which "Item ref target" reads: the item an
 * item ref names has its `ItemRefDocument`, and a mapping's copy of its item ref's type is one of
 * these.
 */
const ItemRefTarget = derived("ItemRefTarget", itemRefTargets);

/**
 * The item refs that have no target, by the item ref's place: each {@link ItemRefHref} whose
 * target no resource of the item type or an LTI type names ({@link targetHrefs}). Its negation
 * reads those hrefs alone, never {@link itemRefTargets}, whose link rule negates in turn.
 */
const UntargetedItemRef = derived(
  "UntargetedItemRef",
  query(QtiBase).rule((r) => {
    const { package: pkg, path, start, target } = v(ItemRefHref, "href");

    return r
      .match(ItemRefHref, { package: pkg, path, start, target })
      .where(r.not(targetHrefs, { package: pkg, target }))
      .find({ package: pkg, path, start, target });
  }),
);

/**
 * The item refs that name an item.
 */
const itemTargets = select(ItemRefTarget, (t) => t.eq(t.type, itemResourceType));

/**
 * The typed hrefs whose type `RootOfType` maps: each names a document of that type.
 */
const documentHrefs = select(TypedHref, (h) => h.in(h.type, documentTypes));

/**
 * Every rule over a typed href, each `check` named by its oracle law with spaces written as
 * underscores, the halves of P2 and P3 that `#pantry/qti/package.ts` states over the tables:
 *
 * - **P3 `entry-kind` ("Document entry"):** every document-typed href resolves in the package and
 *   names the one document at its target, of the href's type (reading 93). That document is an
 *   entry by `ResourceDocument`'s copy of its `Document` and the `Document`'s containment into
 *   `Entry`, so no rule here restates it.
 * - **P2 `root-type-reverse` ("RootOfType"):** every document a resource lists is at the target of a
 *   typed href of its type (spec reading 176).
 * - **B2 and B3 ("Item ref target"):** an item ref with no target names a path an unread-type
 *   resource names ({@link UntargetedItemRef}, {@link UnreadTypeHref}); an item ref names an item
 *   exactly where it has its `ItemRefDocument`, the document at its target; and a mapping's copy of
 *   its item ref's type, the item ref its `itemRef` places in the mapping's own document, is that
 *   item ref's target's.
 */
const packageQueryLawsByName = {
  "Document entry": [
    check("Document_entry", TypedHref, (h) =>
      h.or(h.not(h.in(h.type, documentTypes)), h.eq(h.scope, "entry")),
    ),
    contained(
      on(documentHrefs, "package", "target", "type"),
      on(ResourceDocument, "package", "path", "type"),
    ),
  ],
  "Item ref target": [
    // An item ref whose href names no resource of the item type or an LTI type names a path a
    // resource of an unread type names, so the type of what it names is unread, and nothing
    // judges it (spec reading 67).
    contained(on(UntargetedItemRef, "package", "target"), on(UnreadTypeHref, "package", "target")),
    contained(
      on(itemTargets, "package", "path", "start", "target"),
      on(ItemRefDocument, "package", "path", "start", "target"),
    ),
    contained(
      on(ItemRefDocument, "package", "path", "start", "target"),
      on(itemTargets, "package", "path", "start", "target"),
    ),
    contained(
      on(MappingItemRefType, "package", "path", "itemRef", "type"),
      on(ItemRefTarget, "package", "path", "start", "type"),
    ),
  ],
  RootOfType: [
    contained(
      on(ResourceDocument, "package", "path", "type"),
      on(TypedHref, "package", "target", "type"),
    ),
  ],
} as const;

/**
 * The identifiers of a package's manifest and its resources, one `xs:ID` space (IMS Content
 * Packaging 1.2): each collapsed identifier beside the kind of element that writes it,
 * `cp:manifest` ({@link ManifestId}) or `cp:resource` ({@link ResourceId}), the constant that
 * tells the two rules apart. Two resources of one identifier are one row, which "DocumentId key"
 * refuses over `ResourceId`; a resource of the manifest's identifier, the package's own key, is a
 * second row of its (package, identifier), which "Manifest id space" refuses. Every manifest writes
 * one, since the package is keyed by it; a resource that writes none has no row, so it is
 * compared with nothing.
 */
const ManifestIdSpace = derived(
  "ManifestIdSpace",
  query(QtiBase)
    .rule((r) => {
      const { identifier, package: pkg } = v(ManifestId, "manifest");

      return r
        .match(ManifestId, { identifier, package: pkg })
        .find({ identifier, kind: NodeKind.handle("cp:manifest"), package: pkg });
    })
    .rule((r) => {
      const { identifier, package: pkg } = v(ResourceId, "resource");

      return r
        .match(ResourceId, { identifier, package: pkg })
        .find({ identifier, kind: NodeKind.handle("cp:resource"), package: pkg });
    }),
);

/**
 * The package overlays' rules over the identifier space, each named by its oracle law: P4
 * `manifest-id-space` ("Manifest id space"), no resource's identifier is its manifest's.
 */
const manifestQueryLawsByName = {
  "Manifest id space": [key(on(ManifestIdSpace, "package", "identifier"))],
} as const;

/**
 * {@link manifestQueryLawsByName}'s rules in one list.
 */
const manifestQueryLaws = Object.values(manifestQueryLawsByName).flat();

/**
 * {@link packageQueryLawsByName}'s rules in one list.
 */
const packageQueryLaws = Object.values(packageQueryLawsByName).flat();

/**
 * The records that name a document, each with that document (spec reading 62): a `lom:lom` of a
 * resource's `cp:metadata`, its resource of an item's or a test's type, and the document a
 * resource lists at the target the resource's `href` names ({@link ResourceDocument}), whatever
 * type it is read as (reading 162). A record whose resource has no `href`, no such type, or an
 * `href` that names no listed document names none, and no law reads it: "Document entry" refuses
 * that `href` (reading 93). The manifest is no resource's document (reading 146), so an `href`
 * that names it names none (NS6).
 *
 * A row is the record's place, `(package, path, record)`, its `record` its `start` in the
 * manifest, and `document`, the path of the document it names. The record keys a row, since a
 * record's resource has one `href` and one type, and the package lists one document at a path
 * (`ResourceDocument`'s key over `package` and `path`).
 */
const namingRecords = query(QtiBase).rule((r) => {
  const { ownerParent: resource, package: pkg, path, start: record } = v(LomRecord, "record");
  const { target: document } = v(ResourceHref, "href");
  const { type } = v(ResourceTyped, "typed");

  return r
    .match(LomRecord, {
      owner: resourceMetadata,
      ownerParent: resource,
      package: pkg,
      path,
      start: record,
    })
    .match(ResourceHref, { package: pkg, path, start: resource, target: document })
    .match(ResourceTyped, { package: pkg, path, start: resource, type })
    .match(ResourceDocument, { package: pkg, path: document })
    .where(r.inSet(type, objectTypes))
    .find({ document, package: pkg, path, record });
});

/**
 * The general categories of the records that name a document, each with its record and that
 * document: a {@link LomGeneral}, whose parent is its record, both in the record's document. Every
 * `lom-identifier` and `lom-title` query reaches its record through one, from an entry's `holder`
 * or a title's `parent`, so a meta-metadata's or a relation's identifier, whose holder is no
 * general category, is read by none; and R26 reads a document's languages against each category
 * that describes it (`DescribedLang`).
 *
 * The category keys a row, its place `(package, path, general)`, since a node has one parent, and
 * a category describes one document, the one its record names.
 */
const namingGenerals = query(QtiBase).rule((r) => {
  const { package: pkg, parent: record, path, start: general } = v(LomGeneral, "general");
  const { document } = v(namingRecords, "named");

  return r
    .match(LomGeneral, { package: pkg, parent: record, path, start: general })
    .match(namingRecords, { document, package: pkg, path, record })
    .find({ document, general, package: pkg, path, record });
});

/**
 * The records that name a document and whose general category lists an `identifier`, each by its
 * record's place: `lom-identifier` reads each (§2.7.1.1). A meta-metadata's or a relation's
 * identifier is no general one.
 */
const ListedIdentifier = derived(
  "ListedIdentifier",
  query(QtiBase).rule((r) => {
    const { holder: general, package: pkg, path } = v(LomEntry, "entry");
    const { record } = v(namingGenerals, "general");

    return r
      .match(LomEntry, { holder: general, package: pkg, path })
      .match(namingGenerals, { general, package: pkg, path, record })
      .find({ package: pkg, path, record });
  }),
);

/**
 * The records that name a document one of whose general `identifier` entries is that document's
 * identifier, each by its record's place (§2.7.1.1: "One of the values given for the identifier
 * must have an entry that matches the identifier of the associated item, test or object bank"):
 * the entry's trimmed token is the root's collapsed `identifier` ({@link ObjectIdentifier}, in the
 * named document), so a document that writes none is named by no entry.
 */
const MatchedIdentifier = derived(
  "MatchedIdentifier",
  query(QtiBase).rule((r) => {
    const { holder: general, package: pkg, path, token } = v(LomEntry, "entry");
    const { document, record } = v(namingGenerals, "general");

    return r
      .match(LomEntry, { holder: general, package: pkg, path, token })
      .match(namingGenerals, { document, general, package: pkg, path, record })
      .match(ObjectIdentifier, { identifier: token, package: pkg, path: document })
      .find({ package: pkg, path, record });
  }),
);

/**
 * The records that name a document and whose general category has a `title`, each by its record's
 * place: `lom-title` reads each (§2.7.1.2).
 */
const ListedTitle = derived(
  "ListedTitle",
  query(QtiBase).rule((r) => {
    const { package: pkg, parent: general, path } = v(LomTitle, "title");
    const { record } = v(namingGenerals, "general");

    return r
      .match(LomTitle, { package: pkg, parent: general, path })
      .match(namingGenerals, { general, package: pkg, path, record })
      .find({ package: pkg, path, record });
  }),
);

/**
 * The strings of a general title of the records that name a document whose value is that
 * document's title, each with its record, the string, and the document's path and root: the
 * string's `textValue` is the root's `titleValue` ({@link ObjectTitle}), both in
 * `xs:normalizedString`'s value space. A string reaches its record through its {@link LomTitle},
 * whose parent is a general category, all three in the record's document.
 */
const titledStrings = query(QtiBase).rule((r) => {
  const {
    package: pkg,
    parent: title,
    path,
    start: string,
    textValue,
  } = v(LomTitleString, "string");
  const { parent: general } = v(LomTitle, "title");
  const { document, record } = v(namingGenerals, "general");
  const { start: root } = v(ObjectTitle, "objectTitle");

  return r
    .match(LomTitleString, { package: pkg, parent: title, path, start: string, textValue })
    .match(LomTitle, { package: pkg, parent: general, path, start: title })
    .match(namingGenerals, { document, general, package: pkg, path, record })
    .match(ObjectTitle, { package: pkg, path: document, start: root, titleValue: textValue })
    .find({ document, package: pkg, path, record, root, string });
});

/**
 * The records that name a document one of whose title strings is that document's title in its
 * language, each by its record's place (§2.7.1.2: "The title must have a value that matches the
 * value of the title attribute of the associated item, test or object bank. The language used to
 * interpret the title is taken from the language attribute"): a {@link titledStrings} row whose
 * root states no language or whose string is in the root's. Two rules state it, one for each
 * state of the root's optional `xml:lang`: where the root writes one ({@link ObjectLang}), its
 * compared form is no language tag (spec reading 151), or the string's {@link LomString} has none
 * ({@link noLanguage}), or the two are one tag without regard to case; and where it writes none,
 * any string is in its language.
 */
const MatchedTitle = derived(
  "MatchedTitle",
  query(QtiBase)
    .rule((r) => {
      const { document, package: pkg, path, record, root, string } = v(titledStrings, "titled");
      const { languageTag } = v(LomString, "string");
      const { langTag } = v(ObjectLang, "lang");

      return r
        .match(titledStrings, { document, package: pkg, path, record, root, string })
        .match(LomString, { languageTag, package: pkg, path, start: string })
        .match(ObjectLang, { langTag, package: pkg, path: document, start: root })
        .where(
          r.or(
            Compute.not(Compute.matches(langTag, languageTagPattern)),
            r.eq(languageTag, noLanguage),
            r.eq(languageTag, langTag),
          ),
        )
        .find({ package: pkg, path, record });
    })
    .rule((r) => {
      const { document, package: pkg, path, record, root } = v(titledStrings, "titled");

      return r
        .match(titledStrings, { document, package: pkg, path, record, root })
        .where(r.not(ObjectLang, { package: pkg, path: document, start: root }))
        .find({ package: pkg, path, record });
    }),
);

/**
 * Each language a document's `xml:lang` states, under each general category that describes the
 * document (`namingGenerals`), by the category's place: the form's compared value
 * ({@link DocumentLang}'s generated `value`), which R26 asks the category to list. A form that
 * states no language ({@link statedLanguagePattern}: the empty one, one of whitespace alone, or
 * one that is no tag once collapsed) asks nothing, so its value domain alone refuses one that is
 * no tag (spec reading 174), and an empty one is lawful beside an empty `lom:language`.
 */
const DescribedLang = derived(
  "DescribedLang",
  query(QtiBase).rule((r) => {
    const { lang, value } = v(DocumentLang, "form");
    const { document, general, package: pkg, path } = v(namingGenerals, "described");

    return r
      .match(DocumentLang, { lang, package: pkg, path: document, value })
      .match(namingGenerals, { document, general, package: pkg, path })
      .where(Compute.matches(lang, statedLanguagePattern))
      .find({ general, package: pkg, path, value });
  }),
);

/**
 * Each language an item's assembly states in place (spec reading 117), under each general
 * category that describes the item, as `DescribedLang` is a document's: the form's compared value
 * ({@link AssembledLang}'s generated `value`).
 */
const DescribedAssembledLang = derived(
  "DescribedAssembledLang",
  query(QtiBase).rule((r) => {
    const { assembly, lang, value } = v(AssembledLang, "form");
    const { general, package: pkg, path } = v(namingGenerals, "described");

    return r
      .match(AssembledLang, { assembly, lang, package: pkg, value })
      .match(namingGenerals, { document: assembly, general, package: pkg, path })
      .where(Compute.matches(lang, statedLanguagePattern))
      .find({ general, package: pkg, path, value });
  }),
);

/**
 * The identity overlays' rules over a query, each named by its oracle law: R26 (law "Document
 * lang", QTI 3.0 Metadata §2.7.1.3), each language a document or an item's assembly states is one
 * every general category describing it lists ({@link ResourceLomLanguageSet}).
 */
const identityQueryLawsByName = {
  "Document lang": [
    contained(
      on(DescribedLang, "package", "path", "general", "value"),
      on(ResourceLomLanguageSet, "package", "path", "general", "lang"),
    ),
    contained(
      on(DescribedAssembledLang, "package", "path", "general", "value"),
      on(ResourceLomLanguageSet, "package", "path", "general", "lang"),
    ),
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
const metadataQueryLawsByName = {
  LomObjectIdentifier: [
    contained(
      on(ListedIdentifier, "package", "path", "record"),
      on(MatchedIdentifier, "package", "path", "record"),
    ),
  ],
  LomObjectTitle: [
    contained(
      on(ListedTitle, "package", "path", "record"),
      on(MatchedTitle, "package", "path", "record"),
    ),
  ],
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
 * The type a setter or a lookup sets its variable to, one row per expression it holds, by the
 * setter's place: its `VariableRef` by `identifier` (`kind`, `baseType`, `cardinality` and
 * `resolution`, the reference's) joined with each `Expression` whose parent it is, in its own
 * document (`heldBase` and `heldCardinality`, that expression's type). Its content model allows
 * one expression, and a second breaks N5's `Follow`, so a lawful setter or lookup has one row.
 * `Set_type` (P20) and `Lookup_type` (P22) read it.
 *
 * A setter whose `identifier` names no variable, unwritten or no NCName (spec reading 152), has
 * no reference, and one that holds no expression holds no type, so neither has a row, and AL3,
 * its value domain or its content model refuses it alone.
 */
const HeldType = derived(
  "HeldType",
  query(QtiBase).rule((r) => {
    const {
      baseType,
      cardinality,
      kind,
      package: pkg,
      path,
      resolution,
      start,
    } = v(VariableRef, "reference");
    const { baseType: heldBase, cardinality: heldCardinality } = v(Expression, "held");

    return r
      .match(VariableRef, {
        attribute: "identifier",
        baseType,
        cardinality,
        kind,
        package: pkg,
        path,
        resolution,
        start,
      })
      .match(Expression, {
        baseType: heldBase,
        cardinality: heldCardinality,
        package: pkg,
        parent: start,
        path,
      })
      .where(r.inSet(kind, heldKinds))
      .find({
        baseType,
        cardinality,
        heldBase,
        heldCardinality,
        kind,
        package: pkg,
        path,
        resolution,
        start,
      });
  }),
);

/**
 * A reference to a name its document declares: each `VariableRef` joined with its document's
 * `DeclarationIdentifier` of the name it spells, whatever the declaration's cardinality spells
 * (spec reading 159). A reference resolves to a declaration exactly where its document declares
 * its name (M2), so `E1_derived` holds every row's `resolution` to `declared`, and a reference
 * that resolves to a built-in or to nothing is none of them.
 */
const DeclaredReference = derived(
  "DeclaredReference",
  query(QtiBase).rule((r) => {
    const {
      attribute,
      identifier,
      package: pkg,
      path,
      resolution,
      start,
    } = v(VariableRef, "reference");

    return r
      .match(VariableRef, { attribute, identifier, package: pkg, path, resolution, start })
      .match(DeclarationIdentifier, { identifier, package: pkg, path })
      .find({ attribute, package: pkg, path, resolution, start });
  }),
);

/**
 * A placed reference to a name its assembly's item declares (spec reading 117), as
 * {@link DeclaredReference} is a document's own: each `PlacedVariableRef` joined with the item's
 * `DeclarationIdentifier` of the name it spells, the item the document at the assembly's path,
 * every row `declared`. A row is the placed reference: its element's place, its instance in its
 * assembly, and its attribute.
 */
const DeclaredPlacement = derived(
  "DeclaredPlacement",
  query(QtiBase).rule((r) => {
    const {
      assembly,
      attribute,
      identifier,
      instance,
      package: pkg,
      path,
      resolution,
      start,
    } = v(PlacedVariableRef, "placed");

    return r
      .match(PlacedVariableRef, {
        assembly,
        attribute,
        identifier,
        instance,
        package: pkg,
        path,
        resolution,
        start,
      })
      .match(DeclarationIdentifier, { identifier, package: pkg, path: assembly })
      .find({ assembly, attribute, instance, package: pkg, path, resolution, start });
  }),
);

/**
 * A declared placed reference's type in its item (spec reading 117), keyed as the placed
 * reference: each `PlacedVariableRefDeclaration`, its `kind` and `declaration`, the declaration's
 * place in the item, the document at the assembly's path, joined with its element's
 * `Expression`, for `parentKind`, its parent's kind, and with the declaration's
 * `DeclarationBaseType` and `DeclarationCardinality`, for `baseType` and `cardinality`, as
 * `PlacedBindingBaseType`'s are a placed binding's (`#pantry/qti/interactions.ts`). A reference
 * in an included rules fragment is typed in the fragment's own document, where its name is
 * undeclared, so its `VariableRef`'s type is `unknown`; a row here types it in the item, and
 * "Condition type" reads it. The item's own document is an instance too, so an inline reference
 * has a row as well, and an inline condition is held twice, here and over its `Expression`, under
 * the one law.
 *
 * A declaration's type is never silent: a declaration whose cardinality spells nothing, or a
 * record, which writes no base type, has no row of either relation (spec readings 158 and 159),
 * so its references have none here, and no rule reads a type the declaration does not have.
 */
const PlacedReferenceType = derived(
  "PlacedReferenceType",
  query(QtiBase).rule((r) => {
    const {
      assembly,
      attribute,
      declaration,
      instance,
      kind,
      package: pkg,
      path,
      start,
    } = v(PlacedVariableRefDeclaration, "placed");
    const { parentKind } = v(Expression, "element");
    const { baseType } = v(DeclarationBaseType, "base");
    const { cardinality } = v(DeclarationCardinality, "cardinality");

    return r
      .match(PlacedVariableRefDeclaration, {
        assembly,
        attribute,
        declaration,
        instance,
        kind,
        package: pkg,
        path,
        start,
      })
      .match(Expression, { package: pkg, parentKind, path, start })
      .match(DeclarationBaseType, { baseType, package: pkg, path: assembly, start: declaration })
      .match(DeclarationCardinality, {
        cardinality,
        package: pkg,
        path: assembly,
        start: declaration,
      })
      .find({
        assembly,
        attribute,
        baseType,
        cardinality,
        declaration,
        instance,
        kind,
        package: pkg,
        parentKind,
        path,
        start,
      });
  }),
);

/**
 * A variable mapping whose item declares its target (spec reading 97): each
 * `MappingSourceDeclaration` joined with its item's `DeclarationIdentifier` of its target, the
 * item the document at its `itemDocument`, which `Variable_mapping_target` holds to the mapping's
 * own source: a mapping may not rename a variable of the item into another of the item's.
 */
const DeclaredTarget = derived(
  "DeclaredTarget",
  query(QtiBase).rule((r) => {
    const {
      itemDocument,
      package: pkg,
      path,
      source,
      start,
      target,
    } = v(MappingSourceDeclaration, "mapping");

    return r
      .match(MappingSourceDeclaration, {
        itemDocument,
        package: pkg,
        path,
        source,
        start,
        target,
      })
      .match(DeclarationIdentifier, { identifier: target, package: pkg, path: itemDocument })
      .find({ package: pkg, path, source, start, target });
  }),
);

/**
 * A written element of a test's assembly as a reading's scope reads it (spec readings 48 and 86):
 * each `AssembledName`, its identifier, place and placements, joined with each `InstanceName` that
 * places it, its kind and whether a replacement can repeat it there. A found reading's scope is
 * one of these rows, so a reading of an element placed twice reads one of its instances.
 */
const FoundName = derived(
  "FoundName",
  query(QtiBase).rule((r) => {
    const {
      assembly,
      identifier,
      package: pkg,
      path,
      placements,
      start,
    } = v(AssembledName, "name");
    const { kind, replaced } = v(InstanceName, "placed");

    return r
      .match(AssembledName, { assembly, identifier, package: pkg, path, placements, start })
      .match(InstanceName, { assembly, kind, package: pkg, path, replaced, start })
      .find({ assembly, identifier, kind, package: pkg, path, placements, replaced, start });
  }),
);

/**
 * A reading whose scope its test's assembly holds an element of: each `Reading` joined with the
 * `AssembledName` its `scope` names, which `E1_derived` holds `found`. A reading whose scope the
 * assembly holds none of has no row, and is not found.
 */
const HeldScope = derived(
  "HeldScope",
  query(QtiBase).rule((r) => {
    const {
      assembly,
      attribute,
      form,
      found,
      package: pkg,
      path,
      scope,
      split,
      start,
    } = v(Reading, "reading");

    return r
      .match(Reading, { assembly, attribute, form, found, package: pkg, path, scope, split, start })
      .match(AssembledName, { assembly, identifier: scope, package: pkg })
      .find({ assembly, attribute, form, found, package: pkg, path, split, start });
  }),
);

/**
 * A reading whose variable the document it reads declares (spec readings 48 and 106): an unsplit
 * reading's in the test's declarations, and a split or numbered reading's through a found item
 * ref in the declarations of the item it names (`ItemRefDocument`'s `target`), each joined with
 * the `DeclarationIdentifier` of its variable, whatever its cardinality spells (spec reading 159),
 * with its kind and its counts of cardinalities and base types. An item ref that names an LTI
 * link, or an item whose document the package lacks, names no declarations, so a reading through
 * it has no row. The declaration is named by its place, `declarationDocument` and `declaration`,
 * the document that declares it and its `start` there.
 *
 * A reading is `declared` exactly where it is one of these (`E1_derived`), and a resolving one's
 * `ReadingDeclaration` names that declaration.
 */
const DeclaredReading = derived(
  "DeclaredReading",
  query(QtiBase)
    .rule((r) => {
      const {
        assembly,
        attribute,
        package: pkg,
        path,
        split,
        start,
        variable,
      } = v(Reading, "reading");
      const {
        baseTypes,
        cardinalities,
        declarationKind,
        start: declaration,
      } = v(DeclarationIdentifier, "declared");

      return r
        .match(Reading, {
          assembly,
          attribute,
          form: "unsplit",
          package: pkg,
          path,
          split,
          start,
          variable,
        })
        .match(DeclarationIdentifier, {
          baseTypes,
          cardinalities,
          declarationKind,
          identifier: variable,
          package: pkg,
          path: assembly,
          start: declaration,
        })
        .find({
          assembly,
          attribute,
          baseTypes,
          cardinalities,
          declaration,
          declarationDocument: assembly,
          declarationKind,
          form: ReadingForm.handle("unsplit"),
          package: pkg,
          path,
          split,
          start,
        });
    })
    .rule((r) => {
      const {
        assembly,
        attribute,
        form,
        named,
        namedDocument,
        package: pkg,
        path,
        split,
        start,
        variable,
      } = v(Reading, "reading");
      const { target: item } = v(ItemRefDocument, "item");
      const {
        baseTypes,
        cardinalities,
        declarationKind,
        start: declaration,
      } = v(DeclarationIdentifier, "declared");

      return r
        .match(Reading, {
          assembly,
          attribute,
          form,
          found: true,
          named,
          namedDocument,
          namedKind: itemRefKind,
          package: pkg,
          path,
          split,
          start,
          variable,
        })
        .match(ItemRefDocument, { package: pkg, path: namedDocument, start: named, target: item })
        .match(DeclarationIdentifier, {
          baseTypes,
          cardinalities,
          declarationKind,
          identifier: variable,
          package: pkg,
          path: item,
          start: declaration,
        })
        .where(r.inSet(form, ["split", "numbered"]))
        .find({
          assembly,
          attribute,
          baseTypes,
          cardinalities,
          declaration,
          declarationDocument: item,
          declarationKind,
          form,
          package: pkg,
          path,
          split,
          start,
        });
    }),
);

/**
 * A reading whose variable its item ref maps (spec reading 97): a split or numbered reading
 * through a found item ref, joined with the `VariableMapping` of that item ref whose target is
 * its variable, a child of the item ref in its document. A mapped variable's reading is
 * `declared`, where the item declares it too, or `mapped` (`E1_derived`).
 */
const MappedReading = derived(
  "MappedReading",
  query(QtiBase).rule((r) => {
    const {
      assembly,
      attribute,
      form,
      named,
      namedDocument,
      package: pkg,
      path,
      source,
      split,
      start,
      variable,
    } = v(Reading, "reading");

    return r
      .match(Reading, {
        assembly,
        attribute,
        form,
        found: true,
        named,
        namedDocument,
        namedKind: itemRefKind,
        package: pkg,
        path,
        source,
        split,
        start,
        variable,
      })
      .match(VariableMapping, {
        package: pkg,
        parent: named,
        path: namedDocument,
        target: variable,
      })
      .where(r.inSet(form, ["split", "numbered"]))
      .find({ assembly, attribute, form, package: pkg, path, source, split, start });
  }),
);

/**
 * A reading through a found item ref that names an LTI link (spec reading 110): a split or
 * numbered reading joined with its item ref's target ({@link itemRefTargets}), of an LTI link's
 * type. A link has
 * no declarations, no template variables and no item to map from, so a name read through it is
 * accepted unchecked: its source is `link`, or `builtIn` for an item's built-in, never `none`,
 * `declared` or `mapped` (`E1_derived`), and a `link` reading is one of these.
 */
const LinkReading = derived(
  "LinkReading",
  query(QtiBase).rule((r) => {
    const {
      assembly,
      attribute,
      form,
      named,
      namedDocument,
      package: pkg,
      path,
      source,
      split,
      start,
    } = v(Reading, "reading");
    const { type } = v(itemRefTargets, "target");

    return r
      .match(Reading, {
        assembly,
        attribute,
        form,
        found: true,
        named,
        namedDocument,
        namedKind: itemRefKind,
        package: pkg,
        path,
        source,
        split,
        start,
      })
      .match(itemRefTargets, { package: pkg, path: namedDocument, start: named, type })
      .where(r.and(r.inSet(form, ["split", "numbered"]), r.inSet(type, linkResourceTypes)))
      .find({ assembly, attribute, form, package: pkg, path, source, split, start });
  }),
);

/**
 * A reading's key: its reference in its test, its element's place in the assembly and its
 * attribute, its form and the dot it splits at.
 */
const readingKey = ["package", "assembly", "path", "start", "attribute", "form", "split"] as const;

/**
 * The rules over the expression overlays' queries, grouped by the law each states, each `check`
 * named by its oracle law: `Condition_type` (P21) over {@link PlacedReferenceType}; `E1_derived`,
 * each reference's resolution and each reading's scope and source proved from what they are
 * derived from; `Lookup_type` (P22) and `Set_type` (P20) over {@link HeldType}; and
 * `Variable_mapping_target` (reading 97) over {@link DeclaredTarget}.
 */
const expressionQueryLawsByName = {
  "Condition type": [
    // The placed twin, per placement (spec reading 117): a variable, correct or default reference
    // that is a whole condition is typed as its item's declaration, never silent, since the row
    // exists only where the declaration has a base type and a cardinality. A composite condition
    // over a fragment's references stays reading 117's stated limit.
    check("Condition_type", PlacedReferenceType, (r) =>
      r.or(
        r.not(r.in(r.kind, declaredKinds)),
        r.not(r.in(r.parentKind, conditionKindHandles)),
        r.and(r.eq(r.baseType, "boolean"), r.eq(r.cardinality, "single")),
      ),
    ),
  ],
  "E1 derived": [
    // A reference, or a placed one, to a name its document or its assembly's item declares
    // resolves to that declaration.
    check("E1_derived", DeclaredReference, (d) => d.eq(d.resolution, "declared")),
    check("E1_derived", DeclaredPlacement, (d) => d.eq(d.resolution, "declared")),
    // A reading's scope: a found one is a written element of its assembly, its place, kind,
    // placements and replacement copied, and one the assembly holds an element of is found.
    contained(
      on(
        select(Reading, (r) => r.and(r.ne(r.form, "unsplit"), r.eq(r.found, true))),
        "package",
        "assembly",
        "scope",
        "namedDocument",
        "named",
        "namedKind",
        "placements",
        "replaced",
      ),
      on(
        FoundName,
        "package",
        "assembly",
        "identifier",
        "path",
        "start",
        "kind",
        "placements",
        "replaced",
      ),
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
        "declarationDocument",
        "declaration",
        "declarationKind",
        "declBaseTypes",
        "declCardinalities",
      ),
      on(
        DeclaredReading,
        ...readingKey,
        "declarationDocument",
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
    check("E1_derived", MappedReading, (m) => m.in(m.source, ["declared", "mapped", "link"])),
    // A reading through an LTI link (spec reading 110) reads it unchecked, as `link`, or as an
    // item's built-in; a `link` reading is one through an LTI link.
    check("E1_derived", LinkReading, (l) => l.in(l.source, ["builtIn", "link"])),
    contained(
      on(
        select(Reading, (r) => r.eq(r.source, "link")),
        ...readingKey,
      ),
      on(LinkReading, ...readingKey),
    ),
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
        "package",
        "path",
        "start",
      ),
      on(
        select(VariableRefTable, (t) =>
          t.and(t.eq(t.table, "qti-interpolation-table"), t.eq(t.attribute, "identifier")),
        ),
        "package",
        "path",
        "start",
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
 * An integer map key's typed value, one row per entry whose key is in `xs:integer`'s lexical space
 * (`integerKeyPattern`) and whose mapping's base type is `integer`: its entry's place, its
 * `mapping`'s `start` in the entry's document, and `value`, the integer the key names, which
 * PostgreSQL reads from the key's text by grizzle's `Compute.parseDecimal`, XML Schema's lexical
 * mapping of `xs:decimal`, whose restriction `xs:integer` is (Part 2 §3.3.13): `1`, `01`, `+1` and
 * `+0001` are one value, and `0` and `-0` another. The parse reads a text of any digits exactly
 * (reading 45: no integer is too long), and the key's text is `keyText`, inside the 16,384 bytes it
 * reads.
 *
 * The `where` selects by the match the parse needs as its guard, restated, since a query's
 * `where` narrows no term: `Compute.when`'s third argument is the value at a key the guard
 * refuses, and the `where` has taken that key out, so no row holds it.
 *
 * Its head holds the entry's place, so two entries whose keys name one integer are two rows, which
 * the key over the mapping's place and `value` refuses ("Map key"); a key of no integer's form has
 * no row, and `Typed_attribute_value` refuses it on its `MapKeyType` row alone.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#integer | XML Schema Part 2, §3.3.13 integer}
 */
const MapKeyInteger = derived(
  "MapKeyInteger",
  query(QtiBase).rule((r) => {
    const { key: form, mapping, package: pkg, path, start } = v(MapKeyType, "key");

    return r
      .match(MapKeyType, { baseType: "integer", key: form, mapping, package: pkg, path, start })
      .where(Compute.matches(form, integerKeyPattern))
      .find({
        mapping,
        package: pkg,
        path,
        start,
        value: Compute.when(
          Compute.matches(form, integerKeyPattern),
          (integer) => Compute.parseDecimal(integer),
          0n,
        ),
      });
  }),
);

/**
 * A float map key's typed value, one row per entry whose key is in `xs:double`'s lexical space as
 * an attribute writes it (`doublePattern`, XML Schema 1.0's, reading 71's edition, so `+INF` is
 * outside it) and whose mapping's base type is `float`: its entry's place, its `mapping`, and
 * `value`, the double the key names, which PostgreSQL reads from the key's text by grizzle's
 * `Compute.parseDouble`, XML Schema 1.1's doubleLexicalMap (Part 2 §3.3.5.2, reading 144): the
 * decimal rounded once to the nearest double, ties to even, of any digits and any exponent, an
 * infinity of its sign at or past the overflow threshold and a zero of its sign at or below half
 * the least subnormal. `doublePattern`'s language lies inside grizzle's `doubleText`, the text
 * the parse reads total.
 *
 * Every float key in the lexical space has a row (reading 154), so the key over
 * `(mapping, value)` compares every float key by its value: `1`, `1.0` and `10e-1` are one value,
 * `1e400`, `2e400` and `INF` another, and `0`, `-0` and `1e-400` a third. PostgreSQL's `float8`
 * equality holds -0 equal to 0 and NaN equal to NaN, as an identity constraint compares two keys
 * "equal or identical" (XML Schema 1.1 Part 1 §3.11.4). A key outside the lexical space has no
 * row, and `Typed_attribute_value` refuses it on its `MapKeyType` row alone.
 *
 * The `where` selects by the match the parse needs as its guard, restated, as `MapKeyInteger`'s
 * does: `Compute.when`'s third argument is the value at a key the `where` has taken out, so no
 * row holds it.
 */
const MapKeyFloat = derived(
  "MapKeyFloat",
  query(QtiBase).rule((r) => {
    const { key: form, mapping, package: pkg, path, start } = v(MapKeyType, "key");

    return r
      .match(MapKeyType, { baseType: "float", key: form, mapping, package: pkg, path, start })
      .where(Compute.matches(form, doublePattern))
      .find({
        mapping,
        package: pkg,
        path,
        start,
        value: Compute.when(
          Compute.matches(form, doublePattern),
          (double) => Compute.parseDouble(double),
          0,
        ),
      });
  }),
);

/**
 * A point map key's typed value, one row per entry of a point mapping whose key splits into two
 * runs ({@link MapKeyItems}) that are each in `xs:integer`'s lexical space: its entry's place,
 * its `mapping`, and `x` and `y`, the integers its two runs name, each PostgreSQL's
 * `Compute.parseDecimal` of the run's text, as `MapKeyInteger` reads one. A point is "an
 * integer tuple" (information model §8.13), so the key over `(mapping, x, y)` is uniqueness by
 * typed value: `1 2`, `01 +2` and `1`, a tab, `2` are one point.
 *
 * The key's probe compares the parses, which no index holds (grizzle indexes a rule's probe on
 * fields alone, `physical/ddl/rules.ts`), so no index pairs the two runs, each a key text, past
 * PostgreSQL's 2,704-byte entry. The `where` selects by the matches the parses need as their
 * guards, restated, so no row holds a `Compute.when`'s third argument.
 */
const MapKeyPoint = derived(
  "MapKeyPoint",
  query(QtiBase).rule((r) => {
    const { first, mapping, package: pkg, path, second, start } = v(MapKeyItems, "items");

    return r
      .match(MapKeyItems, { first, mapping, package: pkg, path, second, start })
      .match(MapKeyType, { baseType: "point", package: pkg, path, start })
      .where(
        r.and(
          Compute.matches(first, integerKeyPattern),
          Compute.matches(second, integerKeyPattern),
        ),
      )
      .find({
        mapping,
        package: pkg,
        path,
        start,
        x: Compute.when(
          Compute.matches(first, integerKeyPattern),
          (integer) => Compute.parseDecimal(integer),
          0n,
        ),
        y: Compute.when(
          Compute.matches(second, integerKeyPattern),
          (integer) => Compute.parseDecimal(integer),
          0n,
        ),
      });
  }),
);

/**
 * A pair map key's typed value, one row per entry of a pair mapping whose key splits into two
 * runs ({@link MapKeyItems}) that are each an item (`itemPattern`): its entry's place, its
 * `mapping`, and `value`, the split's `unordered` text, its least and greatest item with one
 * space between. A pair's association "is undirected so (A,B) and (B,A) are equivalent"
 * (information model §8.13), so the key over `(mapping, value)` is uniqueness by typed value:
 * `A B`, `B A` and `A`, a tab, `B` are one pair.
 */
const MapKeyPair = derived(
  "MapKeyPair",
  query(QtiBase).rule((r) => {
    const {
      first,
      mapping,
      package: pkg,
      path,
      second,
      start,
      unordered,
    } = v(MapKeyItems, "items");

    return r
      .match(MapKeyItems, { first, mapping, package: pkg, path, second, start, unordered })
      .match(MapKeyType, { baseType: "pair", package: pkg, path, start })
      .where(r.and(Compute.matches(first, itemPattern), Compute.matches(second, itemPattern)))
      .find({ mapping, package: pkg, path, start, value: unordered });
  }),
);

/**
 * A directed pair map key's typed value, one row per entry of a directed pair mapping whose key
 * splits into two runs ({@link MapKeyItems}) that are each an item (`itemPattern`): its entry's
 * place, its `mapping`, and `value`, the split's `ordered` text. A directed pair's association
 * "is directed so (A,B) and (B,A) are not equivalent" (information model §8.13), so the key over
 * `(mapping, value)` keeps the order and reads the whitespace between as one space: `A B` and
 * `A`, a tab, `B` are one directed pair, and `B A` another.
 */
const MapKeyDirectedPair = derived(
  "MapKeyDirectedPair",
  query(QtiBase).rule((r) => {
    const { first, mapping, ordered, package: pkg, path, second, start } = v(MapKeyItems, "items");

    return r
      .match(MapKeyItems, { first, mapping, ordered, package: pkg, path, second, start })
      .match(MapKeyType, { baseType: "directedPair", package: pkg, path, start })
      .where(r.and(Compute.matches(first, itemPattern), Compute.matches(second, itemPattern)))
      .find({ mapping, package: pkg, path, start, value: ordered });
  }),
);

/**
 * The mapping overlays' rules over a query, each named by its oracle law: a mapping's keys are
 * distinct by the values they name, each typed key by its query's value: an integer's, a
 * float's, a point's two integers, a pair's two items in order of code point and a directed
 * pair's two in order ("Map key", information model §5.88.4 and §7.21: a mapping is a function
 * of its source value, and §8.13).
 */
const mappingQueryLawsByName = {
  "Map key": [
    key(on(MapKeyInteger, "package", "path", "mapping", "value")),
    key(on(MapKeyFloat, "package", "path", "mapping", "value")),
    key(on(MapKeyPoint, "package", "path", "mapping", "x", "y")),
    key(on(MapKeyPair, "package", "path", "mapping", "value")),
    key(on(MapKeyDirectedPair, "package", "path", "mapping", "value")),
  ],
} as const;

/**
 * The mapping overlays' rules over a query, in one list.
 */
const mappingQueryLaws = Object.values(mappingQueryLawsByName).flat();

/**
 * The documents that head an assembly, by the document's package and path (spec reading 117): each
 * assembled document (`Document.assembled`, it has its `TestDocument`) that no include splices in
 * place, no `SiteTarget` that splices naming it as its `target` (`Inclusion.splices`: an include
 * under one of `splicingParents` that may stand for its target's root). An included fragment is
 * judged where it is included and not alone, and every other assembled document, a test, a section,
 * an item, a stimulus, a response processing template or a fragment no include splices, is judged
 * as its own merged document.
 */
const HeadDocument = derived(
  "HeadDocument",
  query(QtiBase).rule((r) => {
    const { package: pkg, path } = v(Document, "document");

    return r
      .match(Document, { assembled: true, package: pkg, path })
      .where(r.not(SiteTarget, { package: pkg, splices: true, target: path }))
      .find({ package: pkg, path });
  }),
);

/**
 * The documents some instance of an assembly places, by the document's package and path: the
 * projection of `Instance` on its `package` and `document`. A chain of section refs and includes
 * that returns to a document already on it, and that no head reaches, places none of its documents
 * in any assembly, so its documents are none of these (reading 85).
 */
const InstanceDocument = derived(
  "InstanceDocument",
  query(QtiBase).rule((r) => {
    const { document, package: pkg } = v(Instance, "instance");

    return r.match(Instance, { document, package: pkg }).find({ document, package: pkg });
  }),
);

/**
 * The tests overlays' rules over a query, each named by its oracle law:
 *
 * - **"E1 derived":** each assembly's root is a document that heads one ({@link HeadDocument});
 * - **"Inclusion cycle"** (reading 85): each document that heads an assembly is the root of one, and
 *   every document of a test or a section is one some instance places ({@link InstanceDocument}),
 *   so a chain no head reaches is refused.
 */
const testQueryLawsByName = {
  "E1 derived": [
    contained(on(instanceRoots, "package", "document"), on(HeadDocument, "package", "path")),
  ],
  "Inclusion cycle": [
    contained(on(HeadDocument, "package", "path"), on(instanceRoots, "package", "document")),
    contained(on(TestDocument, "package", "path"), on(InstanceDocument, "package", "document")),
  ],
} as const;

/**
 * The tests overlays' rules over a query, in one list.
 */
const testQueryLaws = Object.values(testQueryLawsByName).flat();

/**
 * Each choice and each hottext of a document, by its place, `(package, path, start)`, with the
 * identifier it bears: the nine choice classes' `Choice` rows and `Hottext`'s. Every choice class
 * says of its identifier "This identifier must not be used by any other choice or item variable"
 * (§5.132.1; §5.7.1, §5.55.1, §5.56.1, §5.58.1, §5.65.1, §5.67.1, §5.73.1 and §5.131.1 alike), and
 * the nine share one space of identifiers (spec reading 104 as amended, the stricter normative
 * reading), so "Choice identifier key" keys these rows by (package, path, identifier): at most one
 * choice or hottext of a document bears a name, of whichever class.
 */
const choicesAndHottexts = query(QtiBase)
  .rule((r) => {
    const { identifier, package: pkg, path, start } = v(Choice, "choice");

    return r
      .match(Choice, { identifier, package: pkg, path, start })
      .find({ identifier, package: pkg, path, start });
  })
  .rule((r) => {
    const { identifier, package: pkg, path, start } = v(Hottext, "hottext");

    return r
      .match(Hottext, { identifier, package: pkg, path, start })
      .find({ identifier, package: pkg, path, start });
  });

/**
 * {@link choicesAndHottexts} as a relation of the schema, which "Choice identifier key" keys.
 */
const ChoiceOrHottext = derived("ChoiceOrHottext", choicesAndHottexts);

/**
 * Each choice and each hottext an assembly places, by its assembly, its instance there and its
 * element's place, with the identifier it bears (spec reading 117): an included fragment's choices
 * are its item's, so "Choice identifier key" keys these rows by (package, assembly, identifier),
 * and a fragment placed twice in one item names each of its choices twice.
 */
const placedChoicesAndHottexts = query(QtiBase)
  .rule((r) => {
    const { assembly, identifier, instance, package: pkg, path, start } = v(PlacedChoice, "choice");

    return r
      .match(PlacedChoice, { assembly, identifier, instance, package: pkg, path, start })
      .find({ assembly, identifier, instance, package: pkg, path, start });
  })
  .rule((r) => {
    const {
      assembly,
      identifier,
      instance,
      package: pkg,
      path,
      start,
    } = v(PlacedHottext, "hottext");

    return r
      .match(PlacedHottext, { assembly, identifier, instance, package: pkg, path, start })
      .find({ assembly, identifier, instance, package: pkg, path, start });
  });

/**
 * {@link placedChoicesAndHottexts} as a relation of the schema, which "Choice identifier key"
 * keys.
 */
const PlacedChoiceOrHottext = derived("PlacedChoiceOrHottext", placedChoicesAndHottexts);

/**
 * The names a document's choices and hottexts bear, and those its assembly places, that no item
 * variable of the document bears, by (package, path, identifier), an assembly's under its head
 * document's path: no `DeclarationIdentifier` of the
 * document names it, whatever the declaration's cardinality spells (spec reading 159), and in an
 * item no built-in variable does ({@link itemBuiltInNames}), since the built-ins "are declared
 * implicitly" (§2.2.2). An assembly's placed names are its root document's, whose own
 * declarations they are held to (spec reading 117): a fragment declares nothing. "Choice not
 * variable" holds every choice's and hottext's name to one of these.
 */
const UnclaimedName = derived(
  "UnclaimedName",
  query(QtiBase)
    .rule((r) => {
      const { identifier, package: pkg, path } = v(choicesAndHottexts, "chosen");
      const { rootKind } = v(Document, "root");

      return r
        .match(choicesAndHottexts, { identifier, package: pkg, path })
        .match(Document, { package: pkg, path, rootKind })
        .where(r.not(DeclarationIdentifier, { identifier, package: pkg, path }))
        .where(r.or(r.ne(rootKind, itemKind), Compute.not(r.inSet(identifier, itemBuiltInNames))))
        .find({ identifier, package: pkg, path });
    })
    .rule((r) => {
      const { assembly, identifier, package: pkg } = v(placedChoicesAndHottexts, "placed");
      const { rootKind } = v(Document, "root");

      return r
        .match(placedChoicesAndHottexts, { assembly, identifier, package: pkg })
        .match(Document, { package: pkg, path: assembly, rootKind })
        .where(r.not(DeclarationIdentifier, { identifier, package: pkg, path: assembly }))
        .where(r.or(r.ne(rootKind, itemKind), Compute.not(r.inSet(identifier, itemBuiltInNames))))
        .find({ identifier, package: pkg, path: assembly });
    }),
);

/**
 * The interaction overlays' rules over a query, each named by its oracle law (spec reading 104):
 *
 * - **"Choice identifier key"** (reading 104 as amended): across the nine choice classes, at most one
 *   choice or hottext of a document bears a name, and at most one its assembly places; the
 *   per-class keys are `#pantry/qti/interactions.ts`'s;
 * - **"Choice not variable"**: every name a choice or a hottext bears, its document's own or one its
 *   assembly places, is one no item variable of the document bears ({@link UnclaimedName}).
 */
const interactionQueryLawsByName = {
  "Choice identifier key": [
    key(on(ChoiceOrHottext, "package", "path", "identifier")),
    key(on(PlacedChoiceOrHottext, "package", "assembly", "identifier")),
  ],
  "Choice not variable": [
    contained(
      on(ChoiceOrHottext, "package", "path", "identifier"),
      on(UnclaimedName, "package", "path", "identifier"),
    ),
    contained(
      on(PlacedChoiceOrHottext, "package", "assembly", "identifier"),
      on(UnclaimedName, "package", "path", "identifier"),
    ),
  ],
} as const;

/**
 * The interaction overlays' rules over a query, in one list.
 */
const interactionQueryLaws = Object.values(interactionQueryLawsByName).flat();

/**
 * Each property a `data-ssml` member requires, by the member's element's place, the member's place
 * in the value and the property's name (Data-SSML 1.0 §3.4: `phoneme`'s `ph`, `say-as`'s
 * `interpret-as`, `sub`'s `alias`): one rule per required property, each a member of that name,
 * beside the property's name. "Data SSML" holds each to a property its member writes.
 */
const RequiredSsmlProperty = derived(
  "RequiredSsmlProperty",
  query(QtiBase)
    .rule((r) => {
      const { at, package: pkg, path, start } = v(DataSsmlMember, "member");

      return r
        .match(DataSsmlMember, { at, member: "phoneme", package: pkg, path, start })
        .find({ member: at, name: "ph", package: pkg, path, start });
    })
    .rule((r) => {
      const { at, package: pkg, path, start } = v(DataSsmlMember, "member");

      return r
        .match(DataSsmlMember, { at, member: "say-as", package: pkg, path, start })
        .find({ member: at, name: "interpret-as", package: pkg, path, start });
    })
    .rule((r) => {
      const { at, package: pkg, path, start } = v(DataSsmlMember, "member");

      return r
        .match(DataSsmlMember, { at, member: "sub", package: pkg, path, start })
        .find({ member: at, name: "alias", package: pkg, path, start });
    }),
);

/**
 * The `data-ssml` rule over a query: every required property is written (Data-SSML 1.0 §3.4).
 */
const dataSsmlQueryLawsByName = {
  "Data SSML": [
    contained(
      on(RequiredSsmlProperty, "package", "path", "start", "member", "name"),
      on(DataSsmlProperty, "package", "path", "start", "member", "name"),
    ),
  ],
} as const;

/**
 * The `data-ssml` rule over a query, in one list.
 */
const dataSsmlQueryLaws = Object.values(dataSsmlQueryLawsByName).flat();

/**
 * Every query `Qti` names over its stored level, under its own name.
 */
export const queryRelations = {
  ChoiceOrHottext,
  DeclaredPlacement,
  DeclaredReading,
  DeclaredReference,
  DeclaredTarget,
  DescribedAssembledLang,
  DescribedLang,
  FoundName,
  HeadDocument,
  HeldScope,
  HeldType,
  InstanceDocument,
  ItemRefTarget,
  LinkReading,
  ListedIdentifier,
  ListedTitle,
  ManifestIdSpace,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
  MappedReading,
  MatchedIdentifier,
  MatchedTitle,
  PlacedChoiceOrHottext,
  PlacedReferenceType,
  RequiredSsmlProperty,
  TypedHref,
  UnclaimedName,
  UnreadTypeHref,
  UntargetedItemRef,
};

/**
 * Each domain's rules over the queries, grouped by the law each states, one record per domain.
 */
export const queryLawsByName = [
  packageQueryLawsByName,
  identityQueryLawsByName,
  metadataQueryLawsByName,
  expressionQueryLawsByName,
  mappingQueryLawsByName,
  dataSsmlQueryLawsByName,
  testQueryLawsByName,
  interactionQueryLawsByName,
  manifestQueryLawsByName,
] as const;

/**
 * One rule over a query, as its domain states it: the union of each domain's statement types,
 * each read from that domain's one record (`Object.values(record).flat()`), never from the list
 * of records. `Object.values` over a union of records falls back to lib's `values(o: {}): any[]`,
 * and a statement typed `any` types every statement of `Qti` `any` with it, so that grizzle can
 * tell no nested member's count apart; grizzle's `schema.extend` refuses such a list
 * (`1387c79d`).
 */
type QueryStatement =
  | (typeof packageQueryLaws)[number]
  | (typeof identityQueryLaws)[number]
  | (typeof metadataQueryLaws)[number]
  | (typeof expressionQueryLaws)[number]
  | (typeof mappingQueryLaws)[number]
  | (typeof dataSsmlQueryLaws)[number]
  | (typeof testQueryLaws)[number]
  | (typeof interactionQueryLaws)[number]
  | (typeof manifestQueryLaws)[number];

/**
 * Every rule over a query, each domain's list spread in {@link queryLawsByName}'s order.
 */
export const queryLaws: readonly QueryStatement[] = [
  ...packageQueryLaws,
  ...identityQueryLaws,
  ...metadataQueryLaws,
  ...expressionQueryLaws,
  ...mappingQueryLaws,
  ...dataSsmlQueryLaws,
  ...testQueryLaws,
  ...interactionQueryLaws,
  ...manifestQueryLaws,
];
