/**
 * The identity overlays' rows (plan §1.7 O1, §C's `rowsOf`): from one document's XDM tree and the
 * ids its nodes are written under, the rows of every relation `#pantry/qti/identity.ts` declares
 * but R26's witnesses, each relation's rows a keyed set; and, from every document's rows, the
 * package's witnesses ({@link languageRowsOf}).
 *
 * The rows restate what the tree says and nothing else: each ID's lexical form as written and split
 * around its value, with the element its binding names; each element's text of an identity type and
 * its IDREF tokens; each `xml:lang`'s and each `label`'s element, each LOM general language's
 * string value, each resource's general category with the type its record names and the document it
 * describes, each SSML attribute reading 3 reads with its fragment and each element on the way up
 * to that fragment, and the projections those rows carry, each value once (sets ruling 2). The
 * database proves every one of them (`identityLaws`), so a row this builder gets wrong is refused,
 * never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import type { DocumentContext, ListedTarget } from "#pantry/import/context.ts";
import { Option } from "effect";
import { collapse, isNcName } from "#pantry/grammar/domains.ts";
import {
  attributeRows,
  ResourceType,
  TextDomain,
  toolLabelKinds,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import {
  lowerAscii,
  namesNoDocument,
  piecesOf,
  statesLanguage,
  stringValuesOf,
} from "#pantry/import/overlays/metadata.ts";
import { resourcePathsOf } from "#pantry/import/overlays/package.ts";
import { foldAt, foldOf, governorOf } from "#pantry/import/fold.ts";
import type { Folds } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { AttributeRow, FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type {
  AssembledLang,
  DocumentGenerals,
  DocumentId,
  DocumentLang,
  FragmentValue,
  GeneralLang,
  GeneralNamed,
  GeneralObject,
  AssembledId,
  IdBinding,
  IdentityText,
  IdrefTarget,
  LabelUse,
  LomLanguage,
  PlacedGeneralLang,
  PlacedId,
  PlacedIdref,
  PlacedXmlLang,
  ResourceLomLanguageSet,
  SsmlAttribute,
  SsmlScope,
  TextIdref,
  XmlLang,
} from "#pantry/qti/identity.ts";
import { objectTypes, recordDocumentTypes } from "#pantry/qti/metadata.ts";
import { itemKind, testKind } from "#pantry/qti/tests.ts";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes' and attributes', drawn by
 * the number `flatten` gives it, and the document a resource names at each path of its package,
 * which a resource's `href` names.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface IdentityIds {
  /**
   * Whether the document is in an assembly (`Document.assembled`), so its IDREFs resolve per
   * instance (spec reading 117).
   */
  readonly assembled: boolean;
  /**
   * The document's context (spec reading 117): an included fragment's nodes take the interaction
   * their includes stand in as their nearest, and every other document's is its own
   * (`ownContext`).
   */
  readonly context: DocumentContext;
  /**
   * The document's type, the resource's that lists it, `none` for the manifest: its LOM records
   * are read where it is of a type a package's records are read from (`recordDocumentTypes`).
   */
  readonly documentType: Addition<typeof GeneralNamed>["named"];
  readonly idOf: (index: number) => NodeId;
  /**
   * The document a resource names at a path of the package, none where no resource names one
   * there, the manifest's included, as Q5.12's `LomResource.named` reads it.
   *
   * @param path - A path in the package, as `ResourceHref` compares it.
   * @returns The document's node.
   */
  readonly targetAt: (path: string) => Option.Option<Pick<ListedTarget, "node">>;
}

/**
 * One IDREF token of an element's text as its element's family nests it: without the `node` the
 * nesting supplies, nor the `at` the family draws.
 */
export type TextIdrefInsert = Omit<Addition<typeof TextIdref>, "node">;

/**
 * An element whose text is of an identity type, with its IDREF tokens nested at its count field.
 */
export type IdentityTextRow = Addition<typeof IdentityText> & {
  readonly idrefs: readonly TextIdrefInsert[];
};

/**
 * A document's identity rows, one keyed set per relation: each map from the text of a row's key to
 * the row as its writer writes it. A node-keyed overlay's key text is its node's id; a projection's
 * is its heading's values in key order, as a JSON array.
 */
export interface IdentityRows {
  readonly DocumentGenerals: ReadonlyMap<string, Addition<typeof DocumentGenerals>>;
  readonly DocumentId: ReadonlyMap<string, Addition<typeof DocumentId>>;
  readonly DocumentLang: ReadonlyMap<string, Addition<typeof DocumentLang>>;
  readonly FragmentValue: ReadonlyMap<string, Addition<typeof FragmentValue>>;
  readonly GeneralNamed: ReadonlyMap<string, Addition<typeof GeneralNamed>>;
  readonly GeneralObject: ReadonlyMap<string, Addition<typeof GeneralObject>>;
  readonly IdBinding: ReadonlyMap<string, Addition<typeof IdBinding>>;
  readonly IdentityText: ReadonlyMap<string, IdentityTextRow>;
  readonly IdrefTarget: ReadonlyMap<string, Addition<typeof IdrefTarget>>;
  readonly LabelUse: ReadonlyMap<string, Addition<typeof LabelUse>>;
  readonly LomLanguage: ReadonlyMap<string, Addition<typeof LomLanguage>>;
  readonly ResourceLomLanguageSet: ReadonlyMap<string, Addition<typeof ResourceLomLanguageSet>>;
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
 * A package's R26 witnesses, one keyed set, each by its heading `[general, lang]`.
 */
export interface LanguageRows {
  readonly GeneralLang: ReadonlyMap<string, Addition<typeof GeneralLang>>;
}

/**
 * A package's languages placed under each instance of an item's assembly (spec reading 117), one
 * keyed set per relation.
 */
export interface PlacedLanguageRows {
  readonly AssembledLang: ReadonlyMap<string, Addition<typeof AssembledLang>>;
  readonly PlacedGeneralLang: ReadonlyMap<string, Addition<typeof PlacedGeneralLang>>;
  readonly PlacedXmlLang: ReadonlyMap<string, Addition<typeof PlacedXmlLang>>;
}

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
 * The `ResourceType` handle a `cp:resource`'s `type` names.
 */
type ResourceTypeHandle = Addition<typeof GeneralNamed>["named"];

/**
 * The types of the documents a package's records are read from (`recordDocumentTypes`).
 */
const recordTypes: ReadonlySet<string> = new Set(recordDocumentTypes);

/**
 * The handles a resource's `type` names a document by, each spelled as written (C17): an item's
 * and a test's (Q5.12's `objectTypes`).
 */
const namingTypes: ReadonlyMap<string, ResourceTypeHandle> = new Map(
  ResourceType.handles.flatMap((handle) =>
    objectTypes.some((type) => type === handle) ? [[handle, handle] as const] : [],
  ),
);

/**
 * The kind of a resource's `cp:metadata`, the owner whose records name the resource.
 */
const resourceMetadata = "cp:metadata.resource";

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
 * Write the key text of a projection's row.
 *
 * @param values - The heading's values, in the relation's key order.
 * @returns Their JSON array.
 */
const headingKey = (values: readonly string[]): string => JSON.stringify(values);

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
 * Split an IDREF or IDREFS text into its tokens, each with the whitespace written before it, and
 * the last with the whitespace after it, so the pieces concatenate to the text and every token but
 * the first follows whitespace (`E1_derived` on `TextIdref`), as the importer splits an
 * attribute's. Each run of whitespace and the token after it splits as {@link piecesOf} splits a
 * text, and the whitespace after the last is the text's own trail.
 *
 * @param text - The element's string value.
 * @returns Its pieces, in order; none for a text with no token, which TextDomain refuses.
 */
const idrefPiecesOf = (text: string): readonly TextIdrefInsert[] => {
  const { trail } = piecesOf(text);
  const runs = [...text.matchAll(/[\t\n\r ]*[^\t\n\r ]+/gu)];

  return runs.map((run, at): TextIdrefInsert => {
    const { lead: before, token } = piecesOf(run[0]);
    const after = at === runs.length - 1 ? trail : "";

    return { after, before, token };
  });
};

/**
 * A document's tree as the builders below read it: its flat rows, its document node and root kind,
 * each node a row names, each node's string value, and each element's attributes by name.
 */
interface Tree {
  readonly document: NodeId;
  /**
   * Each node's fold (`#pantry/import/fold.ts`): its nearest interaction among the rest, the
   * document node's its context's (spec reading 117).
   */
  readonly folds: Folds;
  /**
   * Read the node a row of the tree names, its element or its parent, which `flatten` writes
   * before every row that names it.
   */
  readonly nodeAt: (id: NodeId) => NodeRow<Composed>;
  readonly rootKind: Addition<typeof LabelUse>["rootKind"];
  readonly rows: FlatRows<Composed>;
  readonly stringValueOf: (node: NodeId) => string;
  readonly valueOf: (node: NodeId, name: string) => string | undefined;
}

/**
 * Split an ID's lexical form into its `DocumentId` row, bound to an owner: the whitespace before
 * its value, its value, and the whitespace after (`piecesOf`), where the value is an NCName
 * ({@link isNcName}). Any other form, empty, whitespace alone or holding whitespace inside, is no
 * ID value and has no row, so its value domain or TextDomain refuses it alone (spec reading 156).
 *
 * @param tree - The document's tree.
 * @param node - The element that carries the ID.
 * @param lexical - The ID's lexical form.
 * @param owner - The element its binding names: the attribute's element, or the text's parent.
 * @returns The row, none where the form names nothing.
 */
const documentIdOf = (
  tree: Tree,
  node: NodeId,
  lexical: string,
  owner: NodeId,
): Option.Option<Addition<typeof DocumentId>> =>
  Option.map(
    Option.liftPredicate(piecesOf(lexical), ({ token }) => isNcName(token)),
    ({ lead, token, trail }) => ({
      after: trail,
      before: lead,
      document: tree.document,
      id: token,
      lexical,
      node,
      owner,
    }),
  );

/**
 * Build the rows a document's attributes give: each attribute ID's `DocumentId` where its value is
 * an NCName, each `xml:lang`'s `XmlLang` and form, and the `LabelUse` of each `label` that asks for
 * its tool.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its key text.
 */
const attributeRowsOf = (
  tree: Tree,
): Pick<IdentityRows, "DocumentId" | "DocumentLang" | "LabelUse" | "XmlLang"> => {
  const { document, rootKind } = tree;
  const documentIds = new Map<string, Addition<typeof DocumentId>>();
  const xmlLangs = new Map<string, Addition<typeof XmlLang>>();
  const documentLangs = new Map<string, Addition<typeof DocumentLang>>();
  const labels = new Map<string, Addition<typeof LabelUse>>();

  for (const attribute of tree.rows.attributes) {
    const element = tree.nodeAt(attribute.node);
    const { lexical, name, node } = attribute;
    // An element's first ID-typed attribute whose value names something is its ID; XML Schema
    // gives it no second, which "DocumentId key"'s key over the ID-typed attributes' node refuses.
    if (holdsId(attribute, element) && !documentIds.has(node)) {
      for (const id of Option.toArray(documentIdOf(tree, node, lexical, node))) {
        documentIds.set(node, id);
      }
    }

    if (name === "xml:lang") {
      xmlLangs.set(node, { document, lang: lexical, node });
      documentLangs.set(headingKey([document, lexical]), { document, lang: lexical });
    }

    if (
      name === "label" &&
      (toolLabelled.has(element.kind) ||
        (element.kind === itemKind && element.version === labelledRootVersion))
    ) {
      labels.set(node, { document, node, rootKind });
    }
  }

  return {
    DocumentId: documentIds,
    DocumentLang: documentLangs,
    LabelUse: labels,
    XmlLang: xmlLangs,
  };
};

/**
 * Build the rows a document's identity-typed texts give (C50): each one's `IdentityText`, with its
 * IDREF tokens nested, and each ID text's `DocumentId` where its value is an NCName, bound to the
 * element's parent.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its node's id.
 */
const textRowsOf = (tree: Tree): Pick<IdentityRows, "DocumentId" | "IdentityText"> => {
  const documentIds = new Map<string, Addition<typeof DocumentId>>();
  const identityTexts = new Map<string, IdentityTextRow>();

  for (const node of tree.rows.nodes) {
    const text = tree.stringValueOf(node.id);
    const found = textIdentityOf(node);
    if (Option.isNone(found)) {
      continue;
    }

    const identity = found.value;
    identityTexts.set(node.id, {
      document: tree.document,
      governor: governorOfElement(node),
      idrefs: identity === "ID" ? [] : idrefPiecesOf(text),
      kind: node.kind,
      lexical: text,
      node: node.id,
      owner: node.parent,
      version: node.version,
    });

    if (identity === "ID") {
      for (const id of Option.toArray(documentIdOf(tree, node.id, text, node.parent))) {
        documentIds.set(node.id, id);
      }
    }
  }

  return { DocumentId: documentIds, IdentityText: identityTexts };
};

/**
 * Build the rows a document's LOM general categories give: each `lom:language`'s `LomLanguage`,
 * with its tag case-folded, and its category's language set, by those tags; and, for a category of
 * a resource's record, its `GeneralNamed` and, where the record names a document, its
 * `GeneralObject`. A record names the document its resource's `href` names, where the resource's
 * type is an item's or a test's and a resource names a document at that path (Q5.12's
 * `LomRecord.named`); a record whose `href` names none names nothing, and "Document entry" refuses
 * the href. A document of a type no package record is read from (`recordDocumentTypes`) gives
 * none: its `lom:*` elements are no record's (170356bd's ruling).
 *
 * @param tree - The document's tree.
 * @param ids - The ids its rows are written under, whose `targetAt` resolves a resource's href.
 * @returns The rows, each by its key text.
 */
const lomRowsOf = (
  tree: Tree,
  ids: IdentityIds,
): Pick<
  IdentityRows,
  "GeneralNamed" | "GeneralObject" | "LomLanguage" | "ResourceLomLanguageSet"
> => {
  const lomLanguages = new Map<string, Addition<typeof LomLanguage>>();
  const lomSets = new Map<string, Addition<typeof ResourceLomLanguageSet>>();
  const named = new Map<string, Addition<typeof GeneralNamed>>();
  const objects = new Map<string, Addition<typeof GeneralObject>>();
  const rows = {
    GeneralNamed: named,
    GeneralObject: objects,
    LomLanguage: lomLanguages,
    ResourceLomLanguageSet: lomSets,
  };
  if (!recordTypes.has(ids.documentType)) {
    return rows;
  }

  // Each resource's href resolved as its `ResourceHref` is, by which its records name a document.
  const resourcePaths = resourcePathsOf(tree.rows);

  for (const node of tree.rows.nodes) {
    const parent = tree.nodeAt(node.parent);
    if (node.kind === "lom:language" && parent.kind === "lom:general") {
      const text = tree.stringValueOf(node.id);
      const tag = lowerAscii(text);
      lomLanguages.set(node.id, { general: node.parent, lang: text, node: node.id, tag });
      lomSets.set(headingKey([node.parent, tag]), { general: node.parent, lang: tag });
    }

    if (node.kind !== "lom:general" || parent.kind !== "lom:lom") {
      continue;
    }

    const owner = tree.nodeAt(parent.parent);
    if (owner.kind !== resourceMetadata) {
      continue;
    }

    // The type and the document the record names: its resource's, where its `type` spells an
    // item's or a test's handle and a resource names a document at its `href`'s path.
    const object = Option.zipWith(
      Option.fromNullishOr(tree.valueOf(owner.parent, "type")).pipe(
        Option.flatMap((type) => Option.fromNullishOr(namingTypes.get(type))),
      ),
      Option.fromNullishOr(resourcePaths.get(owner.parent)).pipe(Option.flatMap(ids.targetAt)),
      (type, { node: document }) => ({ document, type }),
    );
    named.set(node.id, {
      general: node.id,
      named: Option.match(object, { onNone: () => namesNoDocument, onSome: ({ type }) => type }),
      record: parent.id,
    });
    for (const { document } of Option.toArray(object)) {
      objects.set(node.id, { document, general: node.id, record: parent.id });
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
 * The walk from an element up to its SSML fragment, the element first, and the fragment it ends
 * at: a `speak`, or the document node where no `speak` holds the element.
 */
interface ScopeWalk {
  readonly fragment: NodeId;
  readonly walk: readonly NodeRow<Composed>[];
}

/**
 * Walk from an element up to its SSML fragment (spec reading 3): the element, then each parent,
 * ending at the first `ssml:speak` or at the document's root.
 *
 * @param tree - The document's tree.
 * @param element - The element.
 * @returns The walk, the element first, and its fragment: the `speak` it ends at, or the document
 *   node where no `speak` holds the element.
 */
const scopeWalkOf = (tree: Tree, element: NodeRow<Composed>): ScopeWalk => {
  const walk: NodeRow<Composed>[] = [];
  for (let at = element; ; at = tree.nodeAt(at.parent)) {
    walk.push(at);
    if (at.kind === "ssml:speak") {
      return { fragment: at.id, walk };
    }

    if (at.parent === tree.document) {
      return { fragment: tree.document, walk };
    }
  }
};

/**
 * Build the rows a document's SSML attributes give (spec reading 3): each read attribute's
 * `SsmlAttribute`, its value its lexical form collapsed, placed in its element's fragment; each
 * element on the
 * walk up to that fragment its `SsmlScope`; and each fragment's values, by kind, once each.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its key text.
 */
const ssmlRowsOf = (
  tree: Tree,
): Pick<IdentityRows, "FragmentValue" | "SsmlAttribute" | "SsmlScope"> => {
  const attributes = new Map<string, Addition<typeof SsmlAttribute>>();
  const scopes = new Map<string, Addition<typeof SsmlScope>>();
  const values = new Map<string, Addition<typeof FragmentValue>>();

  for (const element of tree.rows.nodes) {
    const read = ssmlReads.get(element.kind);
    if (read === undefined) {
      continue;
    }

    const { fragment, walk } = scopeWalkOf(tree, element);
    for (const name of read.names) {
      const lexical = tree.valueOf(element.id, name);
      if (lexical === undefined) {
        continue;
      }

      const value = collapse(lexical);
      attributes.set(headingKey([element.id, name]), {
        fragment,
        kind: element.kind,
        lexical,
        name,
        node: element.id,
        refers: read.refers,
        value,
      });
      values.set(headingKey([fragment, element.kind, value]), {
        fragment,
        kind: element.kind,
        value,
      });

      for (const node of walk) {
        scopes.set(node.id, {
          document: tree.document,
          fragment,
          kind: node.kind,
          nearest: foldAt(tree.folds, node.id).nearest,
          node: node.id,
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
 * Build a document's identity rows.
 *
 * Each overlay holds one row per element it describes, keyed by the element's node, and each
 * projection one row per value, so a value an element repeats is one row. A copied text past
 * `keyText`'s bound keeps its row, whatever its length: `keyText`'s own check refuses it in the
 * database under "Key text bound", the one rule a key text past its bound is refused by, as the law
 * oracle names it. Every document has its
 * {@link DocumentGenerals} row, whose count the database draws.
 *
 * A resource's general category names the type its record names: the resource's `type` where that
 * spells an item's or a test's handle and its `href` names a document a resource names, at the path
 * its `ResourceHref` compares it by (reading 102; Q5.12's `LomRecord.named`), else `none`; and a
 * naming category describes that document, as Q5.12's `LomObject` does. A category whose `href`
 * names no document describes none, and "Document entry" refuses the href.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every identity relation's rows but R26's witnesses.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: IdentityIds): IdentityRows => {
  const rows = flatten(doc, ids.idOf);
  const lexicals = new Map(rows.attributes.map((row) => [`${row.node} ${row.name}`, row.lexical]));
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const tree: Tree = {
    document: rows.document.node,
    folds: foldOf(rows.nodes, ids.context),
    nodeAt: (id) => {
      const node = byId.get(id);
      if (node === undefined) {
        throw new Error(
          `A row of the document names node ${id}, which the document holds no row of, but flatten writes every node before a row that names it. Read the rows flatten writes as it writes them.`,
        );
      }

      return node;
    },
    rootKind: doc.root.kind,
    rows,
    stringValueOf: stringValuesOf(rows),
    valueOf: (node, name) => lexicals.get(`${node} ${name}`),
  };
  const attributed = attributeRowsOf(tree);
  const texts = textRowsOf(tree);
  const documentIds = new Map([...texts.DocumentId, ...attributed.DocumentId]);
  const targets = [
    ...rows.attributes.flatMap((attribute) =>
      holdsIdref(attribute, tree.nodeAt(attribute.node))
        ? idrefPiecesOf(attribute.lexical).map(({ token }) => token)
        : [],
    ),
    ...[...texts.IdentityText.values()].flatMap(({ idrefs }) => idrefs.map(({ token }) => token)),
  ];

  return {
    ...attributed,
    ...lomRowsOf(tree, ids),
    ...ssmlRowsOf(tree),
    DocumentGenerals: new Map([[tree.document, { document: tree.document }]]),
    DocumentId: documentIds,
    IdBinding: new Map(
      [...documentIds.values()].map(({ document, id, owner }) => [
        headingKey([document, id, owner]),
        { document, id, owner },
      ]),
    ),
    IdentityText: texts.IdentityText,
    IdrefTarget: new Map(
      targets.map((id) => [
        headingKey([tree.document, id]),
        { assembled: ids.assembled, document: tree.document, id },
      ]),
    ),
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
 * Collect every instance of an assembly's tree, its root's own included.
 *
 * @param root - The assembly's root instance.
 * @returns Each instance.
 */
const instancesOf = (root: InstanceRoot): readonly (InstanceMember | InstanceRoot)[] => {
  const found: (InstanceMember | InstanceRoot)[] = [];
  const stack: (InstanceMember | InstanceRoot)[] = [root];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    found.push(next);
    stack.push(...next.children);
  }

  return found;
};

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
  const placements = [...input.instances].flatMap((root) =>
    instancesOf(root).map((instance) => ({ instance, root })),
  );
  const placed = new Map<string, Addition<typeof PlacedId>>();
  const assembled = new Map<string, Addition<typeof AssembledId>>();
  const placedTargets = new Map<string, Addition<typeof PlacedIdref>>();
  for (const [{ instance, root }, { document, id, node, owner }] of joined(
    placements,
    input.ids,
    (placement) => placement.instance.document,
    (row) => row.document,
  )) {
    const copy = root.assemblyKind === testKind ? instance.document : instance.id;
    placed.set(headingKey([instance.id, node]), {
      assembly: root.assembly,
      assemblyKind: root.assemblyKind,
      copy,
      document,
      id,
      instance: instance.id,
      node,
      owner,
    });
    assembled.set(headingKey([root.assembly, id, owner, copy]), {
      assembly: root.assembly,
      copy,
      id,
      owner,
    });
  }

  for (const [{ instance, root }, { document, id }] of joined(
    placements,
    input.targets,
    (placement) => placement.instance.document,
    (row) => row.document,
  )) {
    placedTargets.set(headingKey([instance.id, id]), {
      assembly: root.assembly,
      document,
      id,
      instance: instance.id,
    });
  }

  return { AssembledId: assembled, PlacedId: placed, PlacedIdref: placedTargets };
};

/**
 * Build a package's R26 witnesses from every document's identity rows: for each general category
 * that describes a document ({@link IdentityRows.GeneralObject}, the manifest's) and each of the
 * document's `xml:lang` forms that states a language, a language tag once collapsed
 * ({@link statesLanguage}, spec reading 164), a {@link GeneralLang} row where the category
 * lists the form's value, collapsed and case-folded, among its case-folded languages
 * ({@link IdentityRows.ResourceLomLanguageSet}). A
 * form no category lists has no witness, so its count falls short of its document's categories and
 * the database refuses it under "Document lang".
 *
 * @param documents - Each document's identity rows, the manifest's among them.
 * @returns The witnesses, by their heading.
 */
export const languageRowsOf = (documents: readonly IdentityRows[]): LanguageRows => {
  const listed = new Set(
    documents.flatMap((rows) =>
      [...rows.ResourceLomLanguageSet.values()].map(({ general, lang }) =>
        headingKey([general, lang]),
      ),
    ),
  );
  const witnesses = new Map<string, Addition<typeof GeneralLang>>();

  for (const [{ document, general }, { lang }] of joined(
    documents.flatMap((rows) => [...rows.GeneralObject.values()]),
    documents.flatMap((rows) => [...rows.DocumentLang.values()]),
    (object) => object.document,
    (form) => form.document,
  )) {
    const value = lowerAscii(collapse(lang));
    if (statesLanguage(value) && listed.has(headingKey([general, value]))) {
      witnesses.set(headingKey([general, lang]), { document, general, lang, value });
    }
  }

  return { GeneralLang: witnesses };
};

/**
 * Build a package's languages in place (spec reading 117): under each instance of an item's
 * assembly, every `xml:lang` carrier of the instance's document; each form the assembly carries,
 * once; and R26's witnesses in place, for each general category that describes the item and each
 * form of its assembly that states a language, a {@link PlacedGeneralLang} row where the category
 * lists the form's value, collapsed and case-folded. A form no category lists has no witness, so
 * its count falls short of the item's categories and the database refuses it under "Document
 * lang".
 *
 * @param documents - Each document's identity rows, the manifest's among them.
 * @param instances - Every assembly's root instance, its tree nested (Q5.13's `assembledRowsOf`).
 * @returns The rows.
 */
export const placedLanguageRowsOf = (
  documents: readonly IdentityRows[],
  instances: Iterable<InstanceRoot>,
): PlacedLanguageRows => {
  const listed = new Set(
    documents.flatMap((rows) =>
      [...rows.ResourceLomLanguageSet.values()].map(({ general, lang }) =>
        headingKey([general, lang]),
      ),
    ),
  );
  const placed = new Map<string, Addition<typeof PlacedXmlLang>>();
  const assembled = new Map<string, Addition<typeof AssembledLang>>();
  const witnesses = new Map<string, Addition<typeof PlacedGeneralLang>>();
  for (const [{ instance, root }, { lang, node }] of joined(
    [...instances].flatMap((assembly) =>
      assembly.assemblyKind === itemKind
        ? instancesOf(assembly).map((member) => ({ instance: member, root: assembly }))
        : [],
    ),
    documents.flatMap((rows) => [...rows.XmlLang.values()]),
    (placement) => placement.instance.document,
    (carrier) => carrier.document,
  )) {
    placed.set(headingKey([instance.id, node]), {
      assembly: root.assembly,
      document: instance.document,
      instance: instance.id,
      lang,
      node,
    });
    assembled.set(headingKey([root.assembly, lang]), { assembly: root.assembly, lang });
  }

  for (const [{ assembly, lang }, { general }] of joined(
    assembled.values(),
    documents.flatMap((rows) => [...rows.GeneralObject.values()]),
    (form) => form.assembly,
    (object) => object.document,
  )) {
    const value = lowerAscii(collapse(lang));
    if (statesLanguage(value) && listed.has(headingKey([general, value]))) {
      witnesses.set(headingKey([general, lang]), { assembly, general, lang, value });
    }
  }

  return { AssembledLang: assembled, PlacedGeneralLang: witnesses, PlacedXmlLang: placed };
};
