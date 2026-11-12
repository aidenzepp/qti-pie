/**
 * The identity overlays' rows (plan §1.7 O1, §C's `rowsOf`): from one document's view
 * (`DocumentView` of `#pantry/import/fold.ts`), the rows of every relation
 * `#pantry/qti/identity.ts` declares, each relation's rows a keyed set; and, from every document's
 * rows, those placed under each assembly ({@link placedIdRowsOf}, {@link placedLanguageRowsOf}).
 *
 * The rows restate what the tree says and nothing else: each ID's lexical form as written and split
 * around its value, with the element its binding names; each element's text of an identity type and
 * its IDREF tokens; each `xml:lang`'s and each `label`'s element, each `xml:lang`'s catalog scope
 * and each element on the way up to it (reading R9-c), each LOM general language's string value,
 * each SSML attribute reading 3 reads with its fragment and each element on the way up to that
 * fragment, and the projections those rows carry, each value once (sets ruling 2). Which document
 * a LOM record names is no row's: the database reads it (R26's rule over a query,
 * `#pantry/qti/queries.ts`). The database proves every one of them (`identityLaws`), so a row this
 * builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { collapse, isNcName } from "#pantry/grammar/domains.ts";
import {
  attributeRows,
  grammar,
  TextDomain,
  toolLabelKinds,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { keyTextOf } from "#pantry/import/key-text.ts";
import { lowerAscii, stringValuesOf } from "#pantry/import/overlays/metadata.ts";
import { piecesOf, tokensOf } from "#pantry/import/pieces.ts";
import { foldAt, governorOf } from "#pantry/import/fold.ts";
import type { DocumentView, Folds } from "#pantry/import/fold.ts";
import type { DocumentPlace, Place } from "#pantry/import/write.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { AttributeRow, FlatRows, NodeRow } from "#pantry/model/xdm.ts";
import type {
  AssembledLang,
  BodyXmlLang,
  CatalogScope,
  DocumentId,
  DocumentLang,
  FragmentValue,
  AssembledId,
  IdBinding,
  IdentityText,
  IdrefTarget,
  LabelUse,
  LomLanguage,
  PlacedBodyXmlLang,
  PlacedId,
  PlacedIdref,
  PlacedXmlLang,
  ResourceLomLanguageSet,
  ShareFragment,
  SsmlAttribute,
  SsmlScope,
  TextIdref,
  XmlLang,
} from "#pantry/qti/identity.ts";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";
import { recordDocumentTypes } from "#pantry/vocab/terms/metadata.ts";
import { itemKind, testKind } from "#pantry/vocab/terms/tests.ts";

/**
 * Where a document stands in its package, as this builder reads it: the part of the importer's
 * `DocumentPlace` it needs beside the document's view. `assembled` says whether its IDREFs resolve
 * per instance (spec reading 117); `documentType` whether its LOM records are read
 * (`recordDocumentTypes`); `package` and `path`, its {@link Place}, are every row's.
 */
export type IdentityIds = Pick<DocumentPlace, "assembled" | "documentType" | "package" | "path">;

/**
 * One IDREF token of an element's text as its element's family nests it: without the element's
 * `package`, `path` and `start` the nesting supplies, nor the `at` the family draws.
 */
export type TextIdrefInsert = Omit<Addition<typeof TextIdref>, "package" | "path" | "start">;

/**
 * An element whose text is of an identity type, with its IDREF tokens nested at its count field.
 */
type IdentityTextRow = Addition<typeof IdentityText> & {
  readonly idrefs: readonly TextIdrefInsert[];
};

/**
 * A document's identity rows, one keyed set per relation: each map from the text of a row's key to
 * the row as its writer writes it, the key's values in key order as a JSON array, the document's
 * `package` and `path` first.
 */
export interface IdentityRows {
  readonly BodyXmlLang: ReadonlyMap<string, Addition<typeof BodyXmlLang>>;
  readonly CatalogScope: ReadonlyMap<string, Addition<typeof CatalogScope>>;
  readonly DocumentId: ReadonlyMap<string, Addition<typeof DocumentId>>;
  readonly DocumentLang: ReadonlyMap<string, Addition<typeof DocumentLang>>;
  readonly FragmentValue: ReadonlyMap<string, Addition<typeof FragmentValue>>;
  readonly IdBinding: ReadonlyMap<string, Addition<typeof IdBinding>>;
  readonly IdentityText: ReadonlyMap<string, IdentityTextRow>;
  readonly IdrefTarget: ReadonlyMap<string, Addition<typeof IdrefTarget>>;
  readonly LabelUse: ReadonlyMap<string, Addition<typeof LabelUse>>;
  readonly LomLanguage: ReadonlyMap<string, Addition<typeof LomLanguage>>;
  readonly ResourceLomLanguageSet: ReadonlyMap<string, Addition<typeof ResourceLomLanguageSet>>;
  readonly ShareFragment: ReadonlyMap<string, Addition<typeof ShareFragment>>;
  readonly SsmlAttribute: ReadonlyMap<string, Addition<typeof SsmlAttribute>>;
  readonly SsmlScope: ReadonlyMap<string, Addition<typeof SsmlScope>>;
  readonly XmlLang: ReadonlyMap<string, Addition<typeof XmlLang>>;
}

/**
 * A package's IDs and IDREF targets placed under each instance of each assembly, and the
 * assemblies' ID bindings (spec reading 117), one keyed set per relation.
 */
export interface PlacedIdRows {
  readonly AssembledId: ReadonlyMap<string, Addition<typeof AssembledId>>;
  readonly PlacedId: ReadonlyMap<string, Addition<typeof PlacedId>>;
  readonly PlacedIdref: ReadonlyMap<string, Addition<typeof PlacedIdref>>;
}

/**
 * A package's languages placed under each instance of an item's assembly (spec reading 117), one
 * keyed set per relation.
 */
export interface PlacedLanguageRows {
  readonly AssembledLang: ReadonlyMap<string, Addition<typeof AssembledLang>>;
  readonly PlacedBodyXmlLang: ReadonlyMap<string, Addition<typeof PlacedBodyXmlLang>>;
  readonly PlacedXmlLang: ReadonlyMap<string, Addition<typeof PlacedXmlLang>>;
}

/**
 * The document node's position in its document: the scope of an element no scope element holds,
 * the parent a document's root element names, and a test assembly's copy of a placed document
 * (`PlacedId.copy`).
 */
const documentNode = 0n;

/**
 * The installed `ValueIdentity`, keyed by domain: the identity type of each value domain that has
 * one. A domain of no identity has no row.
 */
const identityAt: ReadonlyMap<string, string> = new Map(
  ValueIdentity.rows.map(({ domain, identity }) => [domain, identity]),
);

/**
 * The identity type of each attribute's value domain under the attribute grammar
 * `AttributeGrammar` installs, keyed `version governor name`, for each attribute whose domain has
 * one.
 */
const attributeIdentityAt: ReadonlyMap<string, string> = new Map(
  attributeRows.flatMap(({ domain, governor, name, version }) =>
    Option.toArray(Option.fromUndefinedOr(identityAt.get(domain))).map(
      (identity) => [`${version} ${governor} ${name}`, identity] as const,
    ),
  ),
);

/**
 * The identity type of the domain each governor reads its text in, under the installed
 * `TextDomain`, keyed `version governor`, for each governor whose text domain has one.
 */
const textIdentityAt: ReadonlyMap<string, string> = new Map(
  TextDomain.rows.flatMap(({ domain, governor, version }) =>
    Option.toArray(Option.fromUndefinedOr(identityAt.get(domain))).map(
      (identity) => [`${version} ${governor}`, identity] as const,
    ),
  ),
);

/**
 * The types of the documents a package's records are read from (`recordDocumentTypes`).
 */
const recordTypes: ReadonlySet<string> = new Set(recordDocumentTypes);

/**
 * The schema version whose item root's own `label` is a `LabelUse` (spec reading 128, 3.0.1's
 * §4.1.3), as `#pantry/qti/identity.ts` selects it.
 */
const labelledRootVersion = "3.0.1";

/**
 * The kinds whose `label` is a `LabelUse`, as `#pantry/qti/identity.ts` selects them: those whose
 * label characteristic asks for its tool (spec reading 128).
 */
const toolLabelled: ReadonlySet<string> = new Set(toolLabelKinds);

/**
 * The kind of a MathML `share`, whose `src` of the form `#id` is a {@link ShareFragment}.
 */
const shareKind = "m:share";

/**
 * Read an element's governor, `Node.governor` (`#pantry/import/fold.ts` `governorOf`).
 *
 * @param element - The element's node row.
 * @returns The governor.
 */
const governorOfElement = (element: NodeRow<Composed>): string =>
  governorOf(element.version, element.kind, element.governs);

/**
 * Read the identity type of an attribute's value domain under its element's governor.
 *
 * @param attribute - The attribute row.
 * @param element - Its element's node row.
 * @returns `ID`, `IDREF` or `IDREFS`; none where the governor reads the attribute under no domain,
 *   or its domain has no identity.
 */
const attributeIdentityOf = (
  attribute: AttributeRow<Composed>,
  element: NodeRow<Composed>,
): Option.Option<string> =>
  Option.fromUndefinedOr(
    attributeIdentityAt.get(`${element.version} ${governorOfElement(element)} ${attribute.name}`),
  );

/**
 * Decide whether an attribute's value is one of its document's IDs, as `identity.ts`'s
 * `idAttributes` selects it: its domain's identity under its element's governor is `xs:ID`, or it
 * is a context declaration's `identifier` (spec reading 74).
 *
 * @param attribute - The attribute row.
 * @param element - Its element's node row.
 * @returns Whether it is ID-typed.
 */
const holdsId = (attribute: AttributeRow<Composed>, element: NodeRow<Composed>): boolean =>
  Option.exists(attributeIdentityOf(attribute, element), (identity) => identity === "ID") ||
  (element.kind === "qti-context-declaration" && attribute.name === "identifier");

/**
 * Decide whether an attribute's value is IDREF tokens, as `write.ts` splits an attribute's
 * `Idref` pieces: its domain's identity under its element's governor is `xs:IDREF` or
 * `xs:IDREFS`.
 *
 * @param attribute - The attribute row.
 * @param element - Its element's node row.
 * @returns Whether it is.
 */
const holdsIdref = (attribute: AttributeRow<Composed>, element: NodeRow<Composed>): boolean =>
  Option.exists(
    attributeIdentityOf(attribute, element),
    (identity) => identity === "IDREF" || identity === "IDREFS",
  );

/**
 * Read the identity type of an element's text, as `identity.ts`'s `textIdentityOf` reads it: its
 * governor's text domain's.
 *
 * @param element - The element's node row.
 * @returns `ID`, `IDREF` or `IDREFS`; none where its text is of no identity type, or its governor
 *   reads its text in no domain.
 */
const textIdentityOf = (element: NodeRow<Composed>): Option.Option<string> =>
  Option.fromUndefinedOr(textIdentityAt.get(`${element.version} ${governorOfElement(element)}`));

/**
 * A document's tree as the builders below read it: its place in its package, its flat rows and root
 * kind, each node by its position, each node's string value, and each element's attributes by
 * name.
 */
interface Tree {
  /**
   * Each node's fold (`#pantry/import/fold.ts`): its nearest interaction among the rest, the
   * document node's its context's (spec reading 117).
   */
  readonly folds: Folds;
  /**
   * Read the node at a position of the document, an element a row names or its parent, which
   * `flatten` writes before every row that names it.
   */
  readonly nodeAt: (start: bigint) => NodeRow<Composed>;
  readonly place: Place;
  readonly rootKind: Addition<typeof LabelUse>["rootKind"];
  readonly rows: FlatRows<Composed>;
  readonly stringValueOf: (start: bigint) => string;
  readonly valueOf: (start: bigint, name: string) => string | undefined;
}

/**
 * Decide whether the grammar admits an element where it stands, as `identity.ts`'s
 * `admittedNodes` selects it: its parent's admission map holds its kind (`AdmissionIn`). Only
 * such an element's ID binds (R2); "N5 admitted" alone refuses any other.
 *
 * @param tree - The document's tree.
 * @param element - The element's node row.
 * @returns Whether it is admitted.
 */
const admitted = (tree: Tree, element: NodeRow<Composed>): boolean =>
  Option.isSome(
    grammar.admission.lookup({
      child: element.kind,
      parent: tree.nodeAt(element.parent).kind,
      version: element.version,
    }),
  );

/**
 * Split an ID's lexical form into its `DocumentId` row, bound to an owner: the whitespace before
 * its value, its value, and the whitespace after (`piecesOf`), where the value is an NCName
 * ({@link isNcName}), and whether its element is {@link admitted}. Any other form, empty,
 * whitespace alone or holding whitespace inside, is no ID value and has no row, so its value domain
 * or TextDomain refuses it alone (spec reading 156).
 *
 * @param tree - The document's tree.
 * @param element - The element that carries the ID.
 * @param lexical - The ID's lexical form.
 * @param owner - The position of the element its binding names: the attribute's element, or the
 *   text's parent.
 * @returns The row, none where the form names nothing.
 */
const documentIdOf = (
  tree: Tree,
  element: NodeRow<Composed>,
  lexical: string,
  owner: bigint,
): Option.Option<Addition<typeof DocumentId>> =>
  Option.map(
    Option.liftPredicate(piecesOf(lexical), ({ value }) => isNcName(value)),
    ({ lead, trail, value }) => ({
      ...tree.place,
      admitted: admitted(tree, element),
      after: trail,
      before: lead,
      id: value,
      lexical,
      owner,
      start: element.start,
    }),
  );

/**
 * Build the rows a document's attributes give: each attribute ID's `DocumentId` where its value is
 * an NCName, and the `LabelUse` of each `label` that asks for its tool.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its key text.
 */
const attributeRowsOf = (tree: Tree): Pick<IdentityRows, "DocumentId" | "LabelUse"> => {
  const { place, rootKind } = tree;
  const documentIds = new Map<string, Addition<typeof DocumentId>>();
  const labels = new Map<string, Addition<typeof LabelUse>>();

  for (const attribute of tree.rows.attributes) {
    const element = tree.nodeAt(attribute.start);
    const { lexical, name, start } = attribute;
    const at = keyTextOf(place.package, place.path, start);
    // An element's first ID-typed attribute whose value names something is its ID; XML Schema
    // gives it no second, which "DocumentId key"'s key over the ID-typed attributes' element
    // refuses.
    if (holdsId(attribute, element) && !documentIds.has(at)) {
      for (const id of Option.toArray(documentIdOf(tree, element, lexical, start))) {
        documentIds.set(at, id);
      }
    }

    if (
      name === "label" &&
      (toolLabelled.has(element.kind) ||
        (element.kind === itemKind && element.version === labelledRootVersion))
    ) {
      labels.set(at, { ...place, rootKind, start });
    }
  }

  return { DocumentId: documentIds, LabelUse: labels };
};

/**
 * Build the {@link ShareFragment} of each `m:share` whose `src` is `#` and one or more characters
 * (MathML 3 §4.2.7), as `#pantry/qti/identity.ts` selects them: its `src` as written and `id`, the
 * text after the `#`, and whether its document is in an assembly. Its `placements` are drawn.
 *
 * @param tree - The document's tree.
 * @param assembled - Whether the document is in an assembly, as {@link IdrefTarget}'s is.
 * @returns The rows, each by its key text.
 */
const shareFragmentsOf = (
  tree: Tree,
  assembled: boolean,
): Map<string, Addition<typeof ShareFragment>> => {
  const { place } = tree;
  const fragments = new Map<string, Addition<typeof ShareFragment>>();

  for (const { lexical, name, start } of tree.rows.attributes) {
    if (
      name === "src" &&
      lexical.length > 1 &&
      lexical.startsWith("#") &&
      tree.nodeAt(start).kind === shareKind
    ) {
      fragments.set(keyTextOf(place.package, place.path, start), {
        ...place,
        assembled,
        id: lexical.slice(1),
        src: lexical,
        start,
      });
    }
  }

  return fragments;
};

/**
 * Build the rows a document's identity-typed texts give (C50): each one's `IdentityText`, with its
 * IDREF tokens nested, and each ID text's `DocumentId` where its value is an NCName, bound to the
 * element's parent.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its key text.
 */
const textRowsOf = (tree: Tree): Pick<IdentityRows, "DocumentId" | "IdentityText"> => {
  const { place } = tree;
  const documentIds = new Map<string, Addition<typeof DocumentId>>();
  const identityTexts = new Map<string, IdentityTextRow>();

  for (const node of tree.rows.nodes) {
    const found = textIdentityOf(node);
    if (Option.isNone(found)) {
      continue;
    }

    const at = keyTextOf(place.package, place.path, node.start);
    const text = tree.stringValueOf(node.start);
    const identity = found.value;
    identityTexts.set(at, {
      ...place,
      governor: governorOfElement(node),
      idrefs: identity === "ID" ? [] : tokensOf(text),
      kind: node.kind,
      lexical: text,
      owner: node.parent,
      start: node.start,
      version: node.version,
    });

    if (identity === "ID") {
      for (const id of Option.toArray(documentIdOf(tree, node, text, node.parent))) {
        documentIds.set(at, id);
      }
    }
  }

  return { DocumentId: documentIds, IdentityText: identityTexts };
};

/**
 * Build the rows a document's LOM general categories give: each `lom:language`'s `LomLanguage`,
 * with its tag case-folded, and its category's language set, by those tags. A document of a type no
 * package record is read from (`recordDocumentTypes`) gives none: its `lom:*` elements are no
 * record's (170356bd's ruling).
 *
 * @param tree - The document's tree.
 * @param ids - Where the document stands in its package.
 * @returns The rows, each by its key text.
 */
const lomRowsOf = (
  tree: Tree,
  ids: IdentityIds,
): Pick<IdentityRows, "LomLanguage" | "ResourceLomLanguageSet"> => {
  const { place } = tree;
  const lomLanguages = new Map<string, Addition<typeof LomLanguage>>();
  const lomSets = new Map<string, Addition<typeof ResourceLomLanguageSet>>();
  const rows = { LomLanguage: lomLanguages, ResourceLomLanguageSet: lomSets };
  if (!recordTypes.has(ids.documentType)) {
    return rows;
  }

  for (const node of tree.rows.nodes) {
    if (node.kind === "lom:language" && tree.nodeAt(node.parent).kind === "lom:general") {
      const text = tree.stringValueOf(node.start);
      const tag = lowerAscii(text);
      lomLanguages.set(keyTextOf(place.package, place.path, node.start), {
        ...place,
        general: node.parent,
        lang: text,
        start: node.start,
        tag,
      });
      lomSets.set(keyTextOf(place.package, place.path, node.parent, tag), {
        ...place,
        general: node.parent,
        lang: tag,
      });
    }
  }

  return rows;
};

/**
 * The SSML attributes reading 3's laws read, by their element's kind, with the kind of element each
 * one's value names: a trim a `mark`, a lookup a `lexicon`, a definition its own kind.
 */
const ssmlReads: ReadonlyMap<
  string,
  {
    readonly names: readonly Addition<typeof SsmlAttribute>["name"][];
    readonly refers: Addition<typeof SsmlAttribute>["refers"];
  }
> = new Map([
  ["ssml:lexicon", { names: ["xml:id"], refers: "ssml:lexicon" }],
  ["ssml:lookup", { names: ["ref"], refers: "ssml:lexicon" }],
  ["ssml:mark", { names: ["name"], refers: "ssml:mark" }],
  ["ssml:speak", { names: ["startmark", "endmark"], refers: "ssml:mark" }],
]);

/**
 * The walk from an element up to its scope root, the element first, and the position of the scope
 * it ends at: the scope root's, or the document node's where none holds the element.
 */
interface ScopeWalk {
  readonly scope: bigint;
  readonly walk: readonly NodeRow<Composed>[];
}

/**
 * Walk from an element up to its scope: the element, then each parent, ending at the first element
 * of the scope's kind or at the document's root. A fragment is an SSML `speak`'s (spec reading 3),
 * a catalog a `qti-catalog-info`'s (reading R9-c).
 *
 * @param tree - The document's tree.
 * @param element - The element.
 * @param scopeKind - The kind of element that is its own scope.
 * @returns The walk, the element first, and its scope: the position of the element of that kind it
 *   ends at, or of the document node where none holds the element.
 */
const scopeWalkOf = (tree: Tree, element: NodeRow<Composed>, scopeKind: string): ScopeWalk => {
  const walk: NodeRow<Composed>[] = [];
  for (let at = element; ; at = tree.nodeAt(at.parent)) {
    walk.push(at);
    if (at.kind === scopeKind) {
      return { scope: at.start, walk };
    }

    if (at.parent === documentNode) {
      return { scope: documentNode, walk };
    }
  }
};

/**
 * Build the rows a document's SSML attributes give (spec reading 3): each read attribute's
 * `SsmlAttribute`, its value its lexical form collapsed, placed in its element's fragment; each
 * element on the walk up to that fragment its `SsmlScope`; and each fragment's values, by kind,
 * once each.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its key text.
 */
const ssmlRowsOf = (
  tree: Tree,
): Pick<IdentityRows, "FragmentValue" | "SsmlAttribute" | "SsmlScope"> => {
  const { place } = tree;
  const attributes = new Map<string, Addition<typeof SsmlAttribute>>();
  const scopes = new Map<string, Addition<typeof SsmlScope>>();
  const values = new Map<string, Addition<typeof FragmentValue>>();

  for (const element of tree.rows.nodes) {
    const read = ssmlReads.get(element.kind);
    if (read === undefined) {
      continue;
    }

    const { scope: fragment, walk } = scopeWalkOf(tree, element, "ssml:speak");
    for (const name of read.names) {
      const lexical = tree.valueOf(element.start, name);
      if (lexical === undefined) {
        continue;
      }

      const value = collapse(lexical);
      attributes.set(keyTextOf(place.package, place.path, element.start, name), {
        ...place,
        fragment,
        kind: element.kind,
        lexical,
        name,
        refers: read.refers,
        start: element.start,
        value,
      });
      values.set(keyTextOf(place.package, place.path, fragment, element.kind, value), {
        ...place,
        fragment,
        kind: element.kind,
        value,
      });

      for (const node of walk) {
        scopes.set(keyTextOf(place.package, place.path, node.start), {
          ...place,
          fragment,
          kind: node.kind,
          nearest: foldAt(tree.folds, node.start).nearest,
          parent: node.parent,
          start: node.start,
          version: node.version,
        });
      }
    }
  }

  return { FragmentValue: values, SsmlAttribute: attributes, SsmlScope: scopes };
};

/**
 * Build the rows a document's `xml:lang`s give: each one's `XmlLang`, its `scope` the position of
 * its nearest `qti-catalog-info` or of the document node (reading R9-c); each element on the walk
 * up to that scope its `CatalogScope`; and each form once, as a `DocumentLang`, where an element
 * outside every catalog carries it, since R26 counts no other.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its key text.
 */
const langRowsOf = (
  tree: Tree,
): Pick<IdentityRows, "BodyXmlLang" | "CatalogScope" | "DocumentLang" | "XmlLang"> => {
  const { place } = tree;
  const scopes = new Map<string, Addition<typeof CatalogScope>>();
  const xmlLangs = new Map<string, Addition<typeof XmlLang>>();
  const bodyLangs = new Map<string, Addition<typeof BodyXmlLang>>();
  const documentLangs = new Map<string, Addition<typeof DocumentLang>>();

  for (const { lexical, name, start } of tree.rows.attributes) {
    if (name !== "xml:lang") {
      continue;
    }

    const at = keyTextOf(place.package, place.path, start);
    const { scope, walk } = scopeWalkOf(tree, tree.nodeAt(start), "qti-catalog-info");
    xmlLangs.set(at, { ...place, lang: lexical, scope, start });
    if (scope === documentNode) {
      bodyLangs.set(at, { ...place, lang: lexical, start });
      documentLangs.set(keyTextOf(place.package, place.path, lexical), { ...place, lang: lexical });
    }

    for (const node of walk) {
      scopes.set(keyTextOf(place.package, place.path, node.start), {
        ...place,
        kind: node.kind,
        nearest: foldAt(tree.folds, node.start).nearest,
        parent: node.parent,
        scope,
        start: node.start,
        version: node.version,
      });
    }
  }

  return {
    BodyXmlLang: bodyLangs,
    CatalogScope: scopes,
    DocumentLang: documentLangs,
    XmlLang: xmlLangs,
  };
};

/**
 * Build a document's identity rows.
 *
 * Each overlay holds one row per element it describes, keyed by the element, `(package, path,
 * start)`, and each projection one row per value, so a value an element repeats is one row. A
 * copied text past `keyText`'s bound keeps its row, whatever its length: `keyText`'s own check
 * refuses it in the database under "Key text bound", the one rule a key text past its bound is
 * refused by, as the law oracle names it.
 *
 * @param view - The document's view: its rows, and their folds under its context (spec reading
 *   117), whose interaction an included fragment's nodes take as their nearest.
 * @param ids - Where it stands in its package.
 * @returns Every identity relation's rows.
 * @throws {Error} When a row of the document names a position its document holds no node at, which
 *   `flatten` rules out: a defect of the caller, never of the document.
 */
export const rowsOf = (view: DocumentView, ids: IdentityIds): IdentityRows => {
  const { rows } = view;
  const place: Place = { package: ids.package, path: ids.path };
  const lexicals = new Map(rows.attributes.map((row) => [`${row.start} ${row.name}`, row.lexical]));
  const byStart = new Map(rows.nodes.map((node) => [node.start, node] as const));
  const tree: Tree = {
    folds: view.folds,
    nodeAt: (start) => {
      const node = byStart.get(start);
      if (node === undefined) {
        throw new Error(
          `A row of ${ids.path} names the node at ${String(start)}, which the document holds no row of, but flatten writes every node before a row that names it. Read the rows flatten writes as it writes them.`,
        );
      }

      return node;
    },
    place,
    rootKind: view.tree.root.kind,
    rows,
    stringValueOf: stringValuesOf(rows),
    valueOf: (start, name) => lexicals.get(`${start} ${name}`),
  };
  const attributed = attributeRowsOf(tree);
  const texts = textRowsOf(tree);
  const documentIds = new Map([...texts.DocumentId, ...attributed.DocumentId]);
  const shares = shareFragmentsOf(tree, ids.assembled);
  const targets = [
    ...rows.attributes.flatMap((attribute) =>
      holdsIdref(attribute, tree.nodeAt(attribute.start))
        ? tokensOf(attribute.lexical).map(({ token }) => token)
        : [],
    ),
    ...[...texts.IdentityText.values()].flatMap(({ idrefs }) => idrefs.map(({ token }) => token)),
    ...[...shares.values()].map(({ id }) => id),
  ];

  return {
    ...attributed,
    ...lomRowsOf(tree, ids),
    ...langRowsOf(tree),
    ...ssmlRowsOf(tree),
    DocumentId: documentIds,
    IdBinding: new Map(
      [...documentIds.values()].map(({ admitted: bound, id, owner }) => [
        keyTextOf(place.package, place.path, id, owner),
        { ...place, admitted: bound, id, owner },
      ]),
    ),
    IdentityText: texts.IdentityText,
    IdrefTarget: new Map(
      targets.map((id) => [
        keyTextOf(place.package, place.path, id),
        { ...place, assembled: ids.assembled, id },
      ]),
    ),
    ShareFragment: shares,
  };
};

/**
 * Pair each row of one set with each row of another that shares its key, as an inner join does:
 * the left rows in their order, each with its partners in theirs. A left row no right row shares a
 * key with pairs with none, and a right row no left row shares one with is in no pair.
 *
 * @param left - The left rows.
 * @param right - The right rows.
 * @param leftKey - A left row's key.
 * @param rightKey - A right row's key.
 * @returns The pairs.
 */
const joined = <Left, Right, Key>(
  left: Iterable<Left>,
  right: Iterable<Right>,
  leftKey: (row: Left) => Key,
  rightKey: (row: Right) => Key,
): readonly (readonly [Left, Right])[] => {
  const partners = Map.groupBy(right, rightKey);

  return [...left].flatMap((row) =>
    Option.match(Option.fromUndefinedOr(partners.get(leftKey(row))), {
      onNone: () => [],
      onSome: (group) => group.map((partner) => [row, partner] as const),
    }),
  );
};

/**
 * One instance of an assembly as the placements read it: its assembly, `(package, assembly)` and
 * its kind, its own position `instance` in the assembly's instance tree, and the path of the
 * document it places.
 */
interface Placement {
  readonly assembly: InstanceRoot["assembly"];
  readonly assemblyKind: InstanceRoot["assemblyKind"];
  readonly document: InstanceRoot["document"];
  readonly instance: bigint;
  readonly package: InstanceRoot["package"];
}

/**
 * Number every instance of an assembly's tree by its pre-order position, `Instance.start`, as the
 * instance tree draws it: the root 0, then each child's subtree in slot order.
 *
 * @param root - The assembly's root instance.
 * @returns Each instance's placement, in pre-order.
 */
const placementsOf = (root: InstanceRoot): readonly Placement[] => {
  const found: Placement[] = [];
  const pending: (InstanceMember | InstanceRoot)[] = [root];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    found.push({
      assembly: root.assembly,
      assemblyKind: root.assemblyKind,
      document: next.document,
      instance: BigInt(found.length),
      package: root.package,
    });
    pending.push(...next.children.toReversed());
  }

  return found;
};

/**
 * The key a placement and a document's row meet at: the document, `(package, path)`.
 *
 * @param document - The document's identity.
 * @param document.package - Its package.
 * @param document.path - Its path.
 * @returns The key text.
 */
const documentKey = (document: { readonly package: string; readonly path: string }): string =>
  keyTextOf(document.package, document.path);

/**
 * The key a placement meets its document's rows at ({@link documentKey}): its package and the path
 * of the document it places.
 *
 * @param placement - The placement.
 * @returns The key text.
 */
const placementKey = (placement: Placement): string =>
  documentKey({ package: placement.package, path: placement.document });

/**
 * Build a package's placed IDs and IDREF targets (spec reading 117): under each instance of each
 * assembly, every `DocumentId` and every `IdrefTarget` of the instance's document; and their
 * projection, each placed ID's binding in its assembly, its copy the instance, but the placed
 * document under a test's assembly, where a section document placed twice is written once (reading
 * 86).
 *
 * @param input - The package's rows the placements read.
 * @param input.ids - Every document's IDs ({@link rowsOf}'s `DocumentId`).
 * @param input.instances - Every assembly's root instance, its tree nested (Q5.13's
 *   `assembledRowsOf`).
 * @param input.targets - Every document's IDREF targets ({@link rowsOf}'s `IdrefTarget`).
 * @returns The rows.
 */
export const placedIdRowsOf = (input: {
  readonly ids: Iterable<Addition<typeof DocumentId>>;
  readonly instances: Iterable<InstanceRoot>;
  readonly targets: Iterable<Addition<typeof IdrefTarget>>;
}): PlacedIdRows => {
  const placements = [...input.instances].flatMap(placementsOf);
  const placed = new Map<string, Addition<typeof PlacedId>>();
  const assembled = new Map<string, Addition<typeof AssembledId>>();
  const placedTargets = new Map<string, Addition<typeof PlacedIdref>>();
  for (const [placement, { id, owner, path, start }] of joined(
    placements,
    input.ids,
    placementKey,
    documentKey,
  )) {
    const { assembly, assemblyKind, instance } = placement;
    const copy = assemblyKind === testKind ? documentNode : instance;
    placed.set(keyTextOf(placement.package, assembly, instance, start), {
      assembly,
      assemblyKind,
      copy,
      id,
      instance,
      owner,
      package: placement.package,
      path,
      start,
    });
    assembled.set(keyTextOf(placement.package, assembly, id, path, owner, copy), {
      assembly,
      copy,
      id,
      owner,
      package: placement.package,
      path,
    });
  }

  for (const [placement, { id, path }] of joined(
    placements,
    input.targets,
    placementKey,
    documentKey,
  )) {
    const { assembly, instance } = placement;
    placedTargets.set(keyTextOf(placement.package, assembly, instance, id), {
      assembly,
      id,
      instance,
      package: placement.package,
      path,
    });
  }

  return { AssembledId: assembled, PlacedId: placed, PlacedIdref: placedTargets };
};

/**
 * Build a package's languages in place (spec reading 117): under each instance of an item's
 * assembly, every `xml:lang` carrier of the instance's document; and each form the assembly
 * carries, once, whose compared value the database derives and R26 reads (`DescribedAssembledLang`,
 * `#pantry/qti/queries.ts`).
 *
 * @param documents - Each document's identity rows, the manifest's among them.
 * @param instances - Every assembly's root instance, its tree nested (Q5.13's `assembledRowsOf`).
 * @returns The rows.
 */
export const placedLanguageRowsOf = (
  documents: readonly IdentityRows[],
  instances: Iterable<InstanceRoot>,
): PlacedLanguageRows => {
  const placed = new Map<string, Addition<typeof PlacedXmlLang>>();
  const placedBody = new Map<string, Addition<typeof PlacedBodyXmlLang>>();
  const assembled = new Map<string, Addition<typeof AssembledLang>>();
  for (const [{ assembly, instance, package: pkg }, { lang, path, scope, start }] of joined(
    [...instances].flatMap((root) => (root.assemblyKind === itemKind ? placementsOf(root) : [])),
    documents.flatMap((rows) => [...rows.XmlLang.values()]),
    (placement) => documentKey({ package: placement.package, path: placement.document }),
    documentKey,
  )) {
    const at = keyTextOf(pkg, assembly, instance, start);
    placed.set(at, { assembly, instance, lang, package: pkg, path, scope, start });
    if (scope === documentNode) {
      placedBody.set(at, { assembly, instance, lang, package: pkg, path, start });
      assembled.set(keyTextOf(pkg, assembly, lang), { assembly, lang, package: pkg });
    }
  }

  return { AssembledLang: assembled, PlacedBodyXmlLang: placedBody, PlacedXmlLang: placed };
};
