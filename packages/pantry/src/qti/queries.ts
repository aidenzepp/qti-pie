/**
 * The queries `Qti` names over its stored level (`#pantry/qti/base.ts` `QtiBase`), and every rule
 * that reads one: grizzle's rules over queries (README, "Rules over queries"). Each query is a live
 * derived relation, `derived(name, query(base)…)`, which stores nothing: a rule over it reads
 * its definition as the tables stand at COMMIT, through a deferred constraint trigger on each table
 * the definition reads. A relation the database derives from what the import writes is a query
 * here, never a stored copy the import keeps in step.
 *
 * A query is over the stored level, and no law of that level reads one, so the queries and their
 * rules live here, in a module `base.ts` never imports, and `Qti` (`#pantry/qti/schema.ts`) is the
 * level that holds them. Each domain's rules are grouped by the law each states, as every module's
 * are, and {@link queriesOf} returns those groups beside the rules, so the schema's own naming of
 * its laws reads them (`#pantry/test/law-namer.ts` `namedLaws`).
 *
 * A query is a value over one built stored level, so {@link queriesOf} builds them over the level it
 * is given, and loading this module builds none. Its statements are its call's own: the caller that
 * builds a schema of them holds them with it.
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
import { documentTypes } from "#pantry/grammar/install.ts";
import type { QtiBase } from "#pantry/qti/base.ts";
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
import { ResourceDocument, ResourceHref, ResourceTyped } from "#pantry/qti/package.ts";
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
 * Build every query `Qti` names over a stored level, and every rule over one: each query under its
 * own name (`relations`), each domain's rules grouped by the law each states, one record per domain
 * (`lawsByName`), and every rule in one list (`laws`).
 *
 * @param base - The stored level the queries read, built for an install's policy or none.
 * @returns The queries and their rules.
 */
export const queriesOf = (base: QtiBase) => {
  /**
   * The href of a resource that has a type, by the resource's node: its {@link ResourceHref}'s
   * package, path and scope beside its {@link ResourceTyped}'s code, so a document-typed resource's
   * href is judged as the document it names. A resource with an href and no type, or a type and no
   * href, has no typed href, so no rule over one asks anything of it.
   *
   * Its rows are a join no table stores and no write keeps, which the importer reads on the host
   * before it writes a row, to name the documents it reads (`#pantry/import/overlays/package.ts`
   * `typedHrefsOf`). It is a query of its own, which {@link TypedHref} names, so the queries over an
   * item ref's target ({@link itemRefTargets}, {@link targetHrefs}) match and negate it.
   */
  const typedHrefs = query(base).rule((r) => {
    const { node, package: pkg, path, scope } = v(ResourceHref, "href");
    const { type } = v(ResourceTyped, "typed");

    return r
      .match(ResourceHref, { node, package: pkg, path, scope })
      .match(ResourceTyped, { node, type })
      .find({ node, package: pkg, path, scope, type });
  });

  /**
   * {@link typedHrefs} as a relation of the schema, which the rules of "Document entry",
   * "RootOfType" and the importer read.
   */
  const TypedHref = derived("TypedHref", typedHrefs);

  /**
   * The href of a resource whose `type` is written and spells no `ResourceType` handle, by the
   * resource's node: its {@link ResourceHref}'s package and path, where the resource's manifest
   * `type` is nonempty and the resource has no {@link ResourceTyped}, whose rows are exactly the
   * resources whose `type` spells a handle (spec reading 67: AL1's value domain refuses the `type`
   * alone). The two conditions are two filters: grizzle states a rule over a query whose relational
   * negation stands alone as a filter, never inside a conjunction, and reads no pattern over the
   * attribute's unbounded lexical form in a query. A resource that writes no `type` has none (AL3
   * refuses it alone), and neither has one that writes no `href`, which names no path. Its rows are
   * a join no table stores, which "Item ref target" reads: an item ref with no target
   * ({@link UntargetedItemRef}) names a path one of these names, or is refused (the oracle's
   * `itemRefTargetOf` names no target there).
   */
  const UnreadTypeHref = derived(
    "UnreadTypeHref",
    query(base).rule((r) => {
      const { node, package: pkg, path } = v(ResourceHref, "href");
      const { lexical } = v(Attribute, "type");

      return r
        .match(ResourceHref, { node, package: pkg, path })
        .match(Attribute, {
          documentType: "manifest",
          kind: "cp:resource",
          lexical,
          name: "type",
          node,
        })
        .where(r.ne(lexical, ""))
        .where(r.not(ResourceTyped, { node }))
        .find({ node, package: pkg, path });
    }),
  );

  /**
   * The paths a resource of the item type or an LTI type names, by package: the paths an item ref's
   * target is named at (the UP audit's B2 and B3, R36). An item ref whose path none of them names
   * has no target ({@link UntargetedItemRef}).
   */
  const targetHrefs = query(base).rule((r) => {
    const { package: pkg, path, type } = v(typedHrefs, "typed");

    return r
      .match(typedHrefs, { package: pkg, path, type })
      .where(r.inSet(type, [itemResourceType, ...linkResourceTypes]))
      .find({ package: pkg, path });
  });

  /**
   * What an item ref names, by the item ref's node (the UP audit's B2 and B3): its
   * {@link ItemRefHref}'s `package` and `path`, and `type`, the type of a resource of the package
   * whose href's path that is, of the item type where one is, and else of an LTI type: the URI an
   * item ref holds is "the URI used to refer to the item's file (e.g., elsewhere in the same
   * content package)" (information model §5.6.5, `href`), so it names an item of the package, or an
   * LTI link (R36). Two rules state it, one per kind of target, and the link's negates the item's,
   * so an href that a resource of each type names is an item's alone. A path that several LTI types
   * name is a row per type, each a link.
   *
   * An item ref whose path no resource of either kind names has no target, and "Item ref target"
   * holds its path to one a resource of an unread type names ({@link UntargetedItemRef}): a path
   * only a resource of another type the importer reads names, a test's or a stimulus's, is refused
   * there. One that writes no href has no {@link ItemRefHref} and names nothing, which AL3 alone
   * refuses (spec reading 155).
   *
   * In the corpus, feedbackTest's item ref `Example03-feedbackBlock-solution/...` names no file of
   * its package, which "Item ref target" refuses (`item-ref-target`, the verdict file's rule for
   * it), and testWithLti's two item refs name LTI links, a package refused under another rule.
   */
  const itemRefTargets = query(base)
    .rule((r) => {
      const { node, package: pkg, path } = v(ItemRefHref, "href");
      const { type } = v(typedHrefs, "item");

      return r
        .match(ItemRefHref, { node, package: pkg, path })
        .match(typedHrefs, { package: pkg, path, type })
        .where(r.eq(type, itemResourceType))
        .find({ node, package: pkg, path, type });
    })
    .rule((r) => {
      const { node, package: pkg, path } = v(ItemRefHref, "href");
      const { type } = v(typedHrefs, "link");

      return r
        .match(ItemRefHref, { node, package: pkg, path })
        .match(typedHrefs, { package: pkg, path, type })
        .where(r.inSet(type, linkResourceTypes))
        .where(r.not(typedHrefs, { package: pkg, path, type: itemResourceType }))
        .find({ node, package: pkg, path, type });
    });

  /**
   * {@link itemRefTargets} as a relation of the schema, which "Item ref target" reads: the item an
   * item ref names has its `ItemRefDocument`, and a mapping's copy of its item ref's type is one of
   * these.
   */
  const ItemRefTarget = derived("ItemRefTarget", itemRefTargets);

  /**
   * The item refs that have no target, by the item ref's node: each {@link ItemRefHref} whose path
   * no resource of the item type or an LTI type names ({@link targetHrefs}). Its negation reads
   * those hrefs alone, never {@link itemRefTargets}, whose link rule negates in turn.
   */
  const UntargetedItemRef = derived(
    "UntargetedItemRef",
    query(base).rule((r) => {
      const { node, package: pkg, path } = v(ItemRefHref, "href");

      return r
        .match(ItemRefHref, { node, package: pkg, path })
        .where(r.not(targetHrefs, { package: pkg, path }))
        .find({ node, package: pkg, path });
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
   *   names the one document at its path, of the href's type (reading 93). That document is an
   *   entry by `ResourceDocument`'s copy of its `Document` and the `Document`'s containment into
   *   `Entry`, so no rule here restates it.
   * - **P2 `root-type-reverse` ("RootOfType"):** every document a resource lists is at the path of a
   *   typed href of its type (spec reading 176).
   * - **B2 and B3 ("Item ref target"):** an item ref with no target names a path an unread-type
   *   resource names ({@link UntargetedItemRef}, {@link UnreadTypeHref}); an item ref names an item
   *   exactly where it has its `ItemRefDocument`, the document at its path; and a mapping's copy of
   *   its item ref's type is that item ref's target's.
   */
  const packageQueryLawsByName = {
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
      // An item ref whose href names no resource of the item type or an LTI type names a path a
      // resource of an unread type names, so the type of what it names is unread, and nothing
      // judges it (spec reading 67).
      contained(on(UntargetedItemRef, "package", "path"), on(UnreadTypeHref, "package", "path")),
      contained(
        on(itemTargets, "node", "package", "path"),
        on(ItemRefDocument, "node", "package", "path"),
      ),
      contained(
        on(ItemRefDocument, "node", "package", "path"),
        on(itemTargets, "node", "package", "path"),
      ),
      contained(on(MappingItemRefType, "itemRef", "type"), on(ItemRefTarget, "node", "type")),
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
   * resource's `cp:metadata`, its resource of an item's or a test's type, and the document a
   * resource lists at the path the resource's `href` names ({@link ResourceDocument}), whatever
   * type it is read as (reading 162). A record whose resource has no `href`, no such type, or an
   * `href` that names no listed document names none, and no law reads it: "Document entry" refuses
   * that `href` (reading 93). The manifest is no resource's document (reading 146), so an `href`
   * that names it names none (NS6).
   *
   * The record keys a row, since a record's resource has one `href` and one type, and the package
   * lists one document at a path (`ResourceDocument`'s key over `package` and `path`).
   */
  const namingRecords = query(base).rule((r) => {
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
   * The general categories of the records that name a document, each with its record and that
   * document: a {@link LomGeneral}, whose parent is its record. Every `lom-identifier` and
   * `lom-title` query reaches its record through one, from an entry's `holder` or a title's
   * `parent`, so a meta-metadata's or a relation's identifier, whose holder is no general category,
   * is read by none; and R26 reads a document's languages against each category that describes it
   * (`DescribedLang`).
   *
   * The category keys a row, since a node has one parent, and a category describes one document,
   * the one its record names.
   */
  const namingGenerals = query(base).rule((r) => {
    const { node: general, parent: record } = v(LomGeneral, "general");
    const { document } = v(namingRecords, "named");

    return r
      .match(LomGeneral, { node: general, parent: record })
      .match(namingRecords, { document, record })
      .find({ document, general, record });
  });

  /**
   * The records that name a document and whose general category lists an `identifier`, each by its
   * record: `lom-identifier` reads each (§2.7.1.1). A meta-metadata's or a relation's identifier is
   * no general one.
   */
  const ListedIdentifier = derived(
    "ListedIdentifier",
    query(base).rule((r) => {
      const { holder: general } = v(LomEntry, "entry");
      const { record } = v(namingGenerals, "general");

      return r
        .match(LomEntry, { holder: general })
        .match(namingGenerals, { general, record })
        .find({ record });
    }),
  );

  /**
   * The records that name a document one of whose general `identifier` entries is that document's
   * identifier, each by its record (§2.7.1.1: "One of the values given for the identifier must have
   * an entry that matches the identifier of the associated item, test or object bank"): the entry's
   * trimmed token is the root's collapsed `identifier` ({@link ObjectIdentifier}), so a document
   * that writes none is named by no entry.
   */
  const MatchedIdentifier = derived(
    "MatchedIdentifier",
    query(base).rule((r) => {
      const { holder: general, token } = v(LomEntry, "entry");
      const { document, record } = v(namingGenerals, "general");

      return r
        .match(LomEntry, { holder: general, token })
        .match(namingGenerals, { document, general, record })
        .match(ObjectIdentifier, { document, identifier: token })
        .find({ record });
    }),
  );

  /**
   * The records that name a document and whose general category has a `title`, each by its record:
   * `lom-title` reads each (§2.7.1.2).
   */
  const ListedTitle = derived(
    "ListedTitle",
    query(base).rule((r) => {
      const { parent: general } = v(LomTitle, "title");
      const { record } = v(namingGenerals, "general");

      return r
        .match(LomTitle, { parent: general })
        .match(namingGenerals, { general, record })
        .find({ record });
    }),
  );

  /**
   * The strings of a general title of the records that name a document whose value is that
   * document's title, each with its record and the document's root: the string's `textValue` is the
   * root's `titleValue` ({@link ObjectTitle}), both in `xs:normalizedString`'s value space. A
   * string reaches its record through its {@link LomTitle}, whose parent is a general category.
   */
  const titledStrings = query(base).rule((r) => {
    const { node: string, parent: title, textValue } = v(LomTitleString, "string");
    const { parent: general } = v(LomTitle, "title");
    const { document, record } = v(namingGenerals, "general");
    const { node: root } = v(ObjectTitle, "objectTitle");

    return r
      .match(LomTitleString, { node: string, parent: title, textValue })
      .match(LomTitle, { node: title, parent: general })
      .match(namingGenerals, { document, general, record })
      .match(ObjectTitle, { document, node: root, titleValue: textValue })
      .find({ record, root, string });
  });

  /**
   * The records that name a document one of whose title strings is that document's title in its
   * language, each by its record (§2.7.1.2: "The title must have a value that matches the value of
   * the title attribute of the associated item, test or object bank. The language used to interpret
   * the title is taken from the language attribute"): a {@link titledStrings} row whose root states
   * no language or whose string is in the root's. Two rules state it, one for each state of the
   * root's optional `xml:lang`: where the root writes one ({@link ObjectLang}), its compared form
   * is no language tag (spec reading 151), or the string's {@link LomString} has none ({@link
   * noLanguage}), or the two are one tag without regard to case; and where it writes none, any
   * string is in its language.
   */
  const MatchedTitle = derived(
    "MatchedTitle",
    query(base)
      .rule((r) => {
        const { record, root, string } = v(titledStrings, "titled");
        const { languageTag } = v(LomString, "string");
        const { langTag } = v(ObjectLang, "lang");

        return r
          .match(titledStrings, { record, root, string })
          .match(LomString, { languageTag, node: string })
          .match(ObjectLang, { langTag, node: root })
          .where(
            r.or(
              Compute.not(Compute.matches(langTag, languageTagPattern)),
              r.eq(languageTag, noLanguage),
              r.eq(languageTag, langTag),
            ),
          )
          .find({ record });
      })
      .rule((r) => {
        const { record, root } = v(titledStrings, "titled");

        return r
          .match(titledStrings, { record, root })
          .where(r.not(ObjectLang, { node: root }))
          .find({ record });
      }),
  );

  /**
   * Each language a document's `xml:lang` states, under each general category that describes the
   * document (`namingGenerals`): the form's compared value ({@link DocumentLang}'s generated
   * `value`), which R26 asks the category to list. A form that states no language
   * ({@link statedLanguagePattern}: the empty one, one of whitespace alone, or one that is no tag
   * once collapsed) asks nothing, so its value domain alone refuses one that is no tag (spec
   * reading 174), and an empty one is lawful beside an empty `lom:language`.
   */
  const DescribedLang = derived(
    "DescribedLang",
    query(base).rule((r) => {
      const { document, lang, value } = v(DocumentLang, "form");
      const { general } = v(namingGenerals, "described");

      return r
        .match(DocumentLang, { document, lang, value })
        .match(namingGenerals, { document, general })
        .where(Compute.matches(lang, statedLanguagePattern))
        .find({ general, value });
    }),
  );

  /**
   * Each language an item's assembly states in place (spec reading 117), under each general
   * category that describes the item, as `DescribedLang` is a document's: the form's compared value
   * ({@link AssembledLang}'s generated `value`).
   */
  const DescribedAssembledLang = derived(
    "DescribedAssembledLang",
    query(base).rule((r) => {
      const { assembly, lang, value } = v(AssembledLang, "form");
      const { general } = v(namingGenerals, "described");

      return r
        .match(AssembledLang, { assembly, lang, value })
        .match(namingGenerals, { document: assembly, general })
        .where(Compute.matches(lang, statedLanguagePattern))
        .find({ general, value });
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
        on(DescribedLang, "general", "value"),
        on(ResourceLomLanguageSet, "general", "lang"),
      ),
      contained(
        on(DescribedAssembledLang, "general", "value"),
        on(ResourceLomLanguageSet, "general", "lang"),
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
      contained(on(ListedIdentifier, "record"), on(MatchedIdentifier, "record")),
    ],
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
   * reference's) joined with each `Expression` whose parent it is (`heldBase` and
   * `heldCardinality`, that expression's type). Its content model allows one expression, and a
   * second breaks N5's `Follow`, so a lawful setter or lookup has one row. `Set_type` (P20) and
   * `Lookup_type` (P22) read it.
   *
   * A setter whose `identifier` names no variable, unwritten or no NCName (spec reading 152), has
   * no reference, and one that holds no expression holds no type, so neither has a row, and AL3,
   * its value domain or its content model refuses it alone.
   */
  const HeldType = derived(
    "HeldType",
    query(base).rule((r) => {
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
   * its name (M2), so `E1_derived` holds every row's `resolution` to `declared`, and a reference
   * that resolves to a built-in or to nothing is none of them.
   */
  const DeclaredReference = derived(
    "DeclaredReference",
    query(base).rule((r) => {
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
  const DeclaredPlacement = derived(
    "DeclaredPlacement",
    query(base).rule((r) => {
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
   * A declared placed reference's type in its item (spec reading 117), keyed as the placed
   * reference: each `PlacedVariableRefDeclaration`, its `kind` and `declaration`, joined with its
   * element's `Expression`, for `parentKind`, its parent's kind, and with the declaration's
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
    query(base).rule((r) => {
      const { attribute, declaration, instance, kind, node } = v(
        PlacedVariableRefDeclaration,
        "placed",
      );
      const { parentKind } = v(Expression, "element");
      const { baseType } = v(DeclarationBaseType, "base");
      const { cardinality } = v(DeclarationCardinality, "cardinality");

      return r
        .match(PlacedVariableRefDeclaration, { attribute, declaration, instance, kind, node })
        .match(Expression, { node, parentKind })
        .match(DeclarationBaseType, { baseType, node: declaration })
        .match(DeclarationCardinality, { cardinality, node: declaration })
        .find({ attribute, baseType, cardinality, declaration, instance, kind, node, parentKind });
    }),
  );

  /**
   * A variable mapping whose item declares its target (spec reading 97): each
   * `MappingSourceDeclaration` joined with its item's `DeclarationIdentifier` of its target, which
   * `Variable_mapping_target` holds to the mapping's own source: a mapping may not rename a
   * variable of the item into another of the item's.
   */
  const DeclaredTarget = derived(
    "DeclaredTarget",
    query(base).rule((r) => {
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
  const FoundName = derived(
    "FoundName",
    query(base).rule((r) => {
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
  const HeldScope = derived(
    "HeldScope",
    query(base).rule((r) => {
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
  const DeclaredReading = derived(
    "DeclaredReading",
    query(base)
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
   * through a found item ref, joined with the `VariableMapping` of that item ref whose target is
   * its variable. A mapped variable's reading is `declared`, where the item declares it too, or
   * `mapped` (`E1_derived`).
   */
  const MappedReading = derived(
    "MappedReading",
    query(base).rule((r) => {
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
   * A reading through a found item ref that names an LTI link (spec reading 110): a split or
   * numbered reading joined with its item ref's target ({@link itemRefTargets}), of an LTI link's
   * type. A link has
   * no declarations, no template variables and no item to map from, so a name read through it is
   * accepted unchecked: its source is `link`, or `builtIn` for an item's built-in, never `none`,
   * `declared` or `mapped` (`E1_derived`), and a `link` reading is one of these.
   */
  const LinkReading = derived(
    "LinkReading",
    query(base).rule((r) => {
      const { assembly, attribute, form, named, node, source, split } = v(Reading, "reading");
      const { type } = v(itemRefTargets, "target");

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
        })
        .match(itemRefTargets, { node: named, type })
        .where(r.and(r.inSet(form, ["split", "numbered"]), r.inSet(type, linkResourceTypes)))
        .find({ assembly, attribute, form, node, source, split });
    }),
  );

  /**
   * A reading's key: its reference in its test, its form and the dot it splits at.
   */
  const readingKey = ["assembly", "node", "attribute", "form", "split"] as const;

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
   * An integer map key's typed value, one row per entry whose key is in `xs:integer`'s lexical
   * space (`integerKeyPattern`) and whose mapping's base type is `integer`: its entry's `node`, its
   * `mapping`, and `value`, the integer the key names, which PostgreSQL reads from the key's text
   * by grizzle's `Compute.parseDecimal`, XML Schema's lexical mapping of `xs:decimal`, whose
   * restriction `xs:integer` is (Part 2 §3.3.13): `1`, `01`, `+1` and `+0001` are one value, and
   * `0` and `-0` another. The parse reads a text of any digits exactly (reading 45: no integer is
   * too long), and the key's text is `keyText`, inside the 16,384 bytes it reads.
   *
   * The `where` selects by the match the parse needs as its guard, restated, since a query's
   * `where` narrows no term: `Compute.when`'s third argument is the value at a key the guard
   * refuses, and the `where` has taken that key out, so no row holds it.
   *
   * Its head holds the entry's node, so two entries whose keys name one integer are two rows, which
   * the key over `(mapping, value)` refuses ("Map key"); a key of no integer's form has no row, and
   * `Typed_attribute_value` refuses it on its `MapKeyType` row alone.
   *
   * @see {@link https://www.w3.org/TR/xmlschema-2/#integer | XML Schema Part 2, §3.3.13 integer}
   */
  const MapKeyInteger = derived(
    "MapKeyInteger",
    query(base).rule((r) => {
      const { key: form, mapping, node } = v(MapKeyType, "key");

      return r
        .match(MapKeyType, { baseType: "integer", key: form, mapping, node })
        .where(Compute.matches(form, integerKeyPattern))
        .find({
          mapping,
          node,
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
   * outside it) and whose mapping's base type is `float`: its entry's `node`, its `mapping`, and
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
    query(base).rule((r) => {
      const { key: form, mapping, node } = v(MapKeyType, "key");

      return r
        .match(MapKeyType, { baseType: "float", key: form, mapping, node })
        .where(Compute.matches(form, doublePattern))
        .find({
          mapping,
          node,
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
   * runs ({@link MapKeyItems}) that are each in `xs:integer`'s lexical space: its entry's `node`,
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
    query(base).rule((r) => {
      const { first, mapping, node, second } = v(MapKeyItems, "items");

      return r
        .match(MapKeyItems, { first, mapping, node, second })
        .match(MapKeyType, { baseType: "point", node })
        .where(
          r.and(
            Compute.matches(first, integerKeyPattern),
            Compute.matches(second, integerKeyPattern),
          ),
        )
        .find({
          mapping,
          node,
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
   * runs ({@link MapKeyItems}) that are each an item (`itemPattern`): its entry's `node`, its
   * `mapping`, and `value`, the split's `unordered` text, its least and greatest item with one
   * space between. A pair's association "is undirected so (A,B) and (B,A) are equivalent"
   * (information model §8.13), so the key over `(mapping, value)` is uniqueness by typed value:
   * `A B`, `B A` and `A`, a tab, `B` are one pair.
   */
  const MapKeyPair = derived(
    "MapKeyPair",
    query(base).rule((r) => {
      const { first, mapping, node, second, unordered } = v(MapKeyItems, "items");

      return r
        .match(MapKeyItems, { first, mapping, node, second, unordered })
        .match(MapKeyType, { baseType: "pair", node })
        .where(r.and(Compute.matches(first, itemPattern), Compute.matches(second, itemPattern)))
        .find({ mapping, node, value: unordered });
    }),
  );

  /**
   * A directed pair map key's typed value, one row per entry of a directed pair mapping whose key
   * splits into two runs ({@link MapKeyItems}) that are each an item (`itemPattern`): its entry's
   * `node`, its `mapping`, and `value`, the split's `ordered` text. A directed pair's association
   * "is directed so (A,B) and (B,A) are not equivalent" (information model §8.13), so the key over
   * `(mapping, value)` keeps the order and reads the whitespace between as one space: `A B` and
   * `A`, a tab, `B` are one directed pair, and `B A` another.
   */
  const MapKeyDirectedPair = derived(
    "MapKeyDirectedPair",
    query(base).rule((r) => {
      const { first, mapping, node, ordered, second } = v(MapKeyItems, "items");

      return r
        .match(MapKeyItems, { first, mapping, node, ordered, second })
        .match(MapKeyType, { baseType: "directedPair", node })
        .where(r.and(Compute.matches(first, itemPattern), Compute.matches(second, itemPattern)))
        .find({ mapping, node, value: ordered });
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
      key(on(MapKeyInteger, "mapping", "value")),
      key(on(MapKeyFloat, "mapping", "value")),
      key(on(MapKeyPoint, "mapping", "x", "y")),
      key(on(MapKeyPair, "mapping", "value")),
      key(on(MapKeyDirectedPair, "mapping", "value")),
    ],
  } as const;

  /**
   * The mapping overlays' rules over a query, in one list.
   */
  const mappingQueryLaws = Object.values(mappingQueryLawsByName).flat();

  /**
   * The documents that head an assembly, by the document's node (spec reading 117): each assembled
   * document (`Document.assembled`, it has its `TestDocument`) that no include splices in place, no
   * `SiteTarget` that splices naming it (`Inclusion.splices`: an include under one of
   * `splicingParents` that may stand for its target's root). An included fragment is judged where
   * it is included and not alone, and every other assembled document, a test, a section, an item, a
   * stimulus, a response processing template or a fragment no include splices, is judged as its own
   * merged document.
   */
  const HeadDocument = derived(
    "HeadDocument",
    query(base).rule((r) => {
      const { node } = v(Document, "document");

      return r
        .match(Document, { assembled: true, node })
        .where(r.not(SiteTarget, { splices: true, target: node }))
        .find({ node });
    }),
  );

  /**
   * The documents some instance of an assembly places, by the document's node: the projection of
   * `Instance` on its `document`. A chain of section refs and includes that returns to a document
   * already on it, and that no head reaches, places none of its documents in any assembly, so its
   * documents are none of these (reading 85).
   */
  const InstanceDocument = derived(
    "InstanceDocument",
    query(base).rule((r) => {
      const { document } = v(Instance, "instance");

      return r.match(Instance, { document }).find({ document });
    }),
  );

  /**
   * The tests overlays' rules over a query, each named by its oracle law:
   *
   * - **"E1 derived":** each assembly's root is a document that heads one ({@link HeadDocument});
   * - **"Inclusion cycle"** (reading 85): each document that heads an assembly is the root of one,
   *   and every document of a test or a section is one some instance places
   *   ({@link InstanceDocument}), so a chain no head reaches is refused.
   */
  const testQueryLawsByName = {
    "E1 derived": [contained(on(instanceRoots, "document"), on(HeadDocument, "node"))],
    "Inclusion cycle": [
      contained(on(HeadDocument, "node"), on(instanceRoots, "document")),
      contained(on(TestDocument, "node"), on(InstanceDocument, "document")),
    ],
  } as const;

  /**
   * The tests overlays' rules over a query, in one list.
   */
  const testQueryLaws = Object.values(testQueryLawsByName).flat();

  /**
   * Each choice and each hottext of a document, by its node, with the document and the identifier
   * it bears: the nine choice classes' `Choice` rows and `Hottext`'s. Every choice class says of
   * its identifier "This identifier must not be used by any other choice or item variable"
   * (§5.132.1; §5.7.1, §5.55.1, §5.56.1, §5.58.1, §5.65.1, §5.67.1, §5.73.1 and §5.131.1 alike),
   * and the nine share one space of identifiers (spec reading 104 as amended, the stricter
   * normative reading), so "Choice identifier key" keys these rows by (document, identifier): at
   * most one choice or hottext of a document bears a name, of whichever class.
   */
  const choicesAndHottexts = query(base)
    .rule((r) => {
      const { document, identifier, node } = v(Choice, "choice");

      return r.match(Choice, { document, identifier, node }).find({ document, identifier, node });
    })
    .rule((r) => {
      const { document, identifier, node } = v(Hottext, "hottext");

      return r.match(Hottext, { document, identifier, node }).find({ document, identifier, node });
    });

  /**
   * {@link choicesAndHottexts} as a relation of the schema, which "Choice identifier key" keys.
   */
  const ChoiceOrHottext = derived("ChoiceOrHottext", choicesAndHottexts);

  /**
   * Each choice and each hottext an assembly places, by its instance and node, with the assembly's
   * root document and the identifier it bears (spec reading 117): an included fragment's choices
   * are its item's, so "Choice identifier key" keys these rows by (assembly, identifier), and a
   * fragment placed twice in one item names each of its choices twice.
   */
  const placedChoicesAndHottexts = query(base)
    .rule((r) => {
      const { assembly, identifier, instance, node } = v(PlacedChoice, "choice");

      return r
        .match(PlacedChoice, { assembly, identifier, instance, node })
        .find({ assembly, identifier, instance, node });
    })
    .rule((r) => {
      const { assembly, identifier, instance, node } = v(PlacedHottext, "hottext");

      return r
        .match(PlacedHottext, { assembly, identifier, instance, node })
        .find({ assembly, identifier, instance, node });
    });

  /**
   * {@link placedChoicesAndHottexts} as a relation of the schema, which "Choice identifier key"
   * keys.
   */
  const PlacedChoiceOrHottext = derived("PlacedChoiceOrHottext", placedChoicesAndHottexts);

  /**
   * The names a document's choices and hottexts bear, and those its assembly places, that no item
   * variable of the document bears, by (document, identifier): no `DeclarationIdentifier` of the
   * document names it, whatever the declaration's cardinality spells (spec reading 159), and in an
   * item no built-in variable does ({@link itemBuiltInNames}), since the built-ins "are declared
   * implicitly" (§2.2.2). An assembly's placed names are its root document's, whose own
   * declarations they are held to (spec reading 117): a fragment declares nothing. "Choice not
   * variable" holds every choice's and hottext's name to one of these.
   */
  const UnclaimedName = derived(
    "UnclaimedName",
    query(base)
      .rule((r) => {
        const { document, identifier } = v(choicesAndHottexts, "chosen");
        const { rootKind } = v(Document, "root");

        return r
          .match(choicesAndHottexts, { document, identifier })
          .match(Document, { node: document, rootKind })
          .where(r.not(DeclarationIdentifier, { document, identifier }))
          .where(r.or(r.ne(rootKind, itemKind), Compute.not(r.inSet(identifier, itemBuiltInNames))))
          .find({ document, identifier });
      })
      .rule((r) => {
        const { assembly, identifier } = v(placedChoicesAndHottexts, "placed");
        const { rootKind } = v(Document, "root");

        return r
          .match(placedChoicesAndHottexts, { assembly, identifier })
          .match(Document, { node: assembly, rootKind })
          .where(r.not(DeclarationIdentifier, { document: assembly, identifier }))
          .where(r.or(r.ne(rootKind, itemKind), Compute.not(r.inSet(identifier, itemBuiltInNames))))
          .find({ document: assembly, identifier });
      }),
  );

  /**
   * The interaction overlays' rules over a query, each named by its oracle law (spec reading 104):
   *
   * - **"Choice identifier key"** (reading 104 as amended): across the nine choice classes, at most
   *   one choice or hottext of a document bears a name, and at most one its assembly places; the
   *   per-class keys are `#pantry/qti/interactions.ts`'s;
   * - **"Choice not variable"**: every name a choice or a hottext bears, its document's own or one
   *   its assembly places, is one no item variable of the document bears ({@link UnclaimedName}).
   */
  const interactionQueryLawsByName = {
    "Choice identifier key": [
      key(on(ChoiceOrHottext, "document", "identifier")),
      key(on(PlacedChoiceOrHottext, "assembly", "identifier")),
    ],
    "Choice not variable": [
      contained(
        on(ChoiceOrHottext, "document", "identifier"),
        on(UnclaimedName, "document", "identifier"),
      ),
      contained(
        on(PlacedChoiceOrHottext, "assembly", "identifier"),
        on(UnclaimedName, "document", "identifier"),
      ),
    ],
  } as const;

  /**
   * The interaction overlays' rules over a query, in one list.
   */
  const interactionQueryLaws = Object.values(interactionQueryLawsByName).flat();

  /**
   * Each property a `data-ssml` member requires, by the member's element, its place and the
   * property's name (Data-SSML 1.0 §3.4: `phoneme`'s `ph`, `say-as`'s `interpret-as`, `sub`'s
   * `alias`): one rule per required property, each a member of that name, beside the property's
   * name. "Data SSML" holds each to a property its member writes.
   */
  const RequiredSsmlProperty = derived(
    "RequiredSsmlProperty",
    query(base)
      .rule((r) => {
        const { at, node } = v(DataSsmlMember, "member");

        return r
          .match(DataSsmlMember, { at, member: "phoneme", node })
          .find({ member: at, name: "ph", node });
      })
      .rule((r) => {
        const { at, node } = v(DataSsmlMember, "member");

        return r
          .match(DataSsmlMember, { at, member: "say-as", node })
          .find({ member: at, name: "interpret-as", node });
      })
      .rule((r) => {
        const { at, node } = v(DataSsmlMember, "member");

        return r
          .match(DataSsmlMember, { at, member: "sub", node })
          .find({ member: at, name: "alias", node });
      }),
  );

  /**
   * The `data-ssml` rule over a query: every required property is written (Data-SSML 1.0 §3.4).
   */
  const dataSsmlQueryLawsByName = {
    "Data SSML": [
      contained(
        on(RequiredSsmlProperty, "node", "member", "name"),
        on(DataSsmlProperty, "node", "member", "name"),
      ),
    ],
  } as const;

  /**
   * The `data-ssml` rule over a query, in one list.
   */
  const dataSsmlQueryLaws = Object.values(dataSsmlQueryLawsByName).flat();

  /**
   * Every query `Qti` names, under its own name.
   */
  const relations = {
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
  const lawsByName = [
    packageQueryLawsByName,
    identityQueryLawsByName,
    metadataQueryLawsByName,
    expressionQueryLawsByName,
    mappingQueryLawsByName,
    dataSsmlQueryLawsByName,
    testQueryLawsByName,
    interactionQueryLawsByName,
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
    | (typeof interactionQueryLaws)[number];

  /**
   * Every rule over a query, each domain's list spread in `lawsByName`'s order.
   */
  const laws: readonly QueryStatement[] = [
    ...packageQueryLaws,
    ...identityQueryLaws,
    ...metadataQueryLaws,
    ...expressionQueryLaws,
    ...mappingQueryLaws,
    ...dataSsmlQueryLaws,
    ...testQueryLaws,
    ...interactionQueryLaws,
  ];

  return { laws, lawsByName, relations };
};
