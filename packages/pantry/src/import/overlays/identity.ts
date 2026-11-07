/**
 * The identity overlays' rows (plan §1.7 O1, §C's `rowsOf`): from one document's XDM tree and the
 * ids its nodes are written under, the rows of every relation `#pantry/qti/identity.ts` declares
 * but R26's witnesses, each relation's rows a keyed set; and, from every document's rows, the
 * package's witnesses ({@link languageRowsOf}).
 *
 * The rows restate what the tree says and nothing else: each ID's lexical form as written and split
 * around its value, with the element its binding names; each element's text of an identity type and
 * its IDREF tokens; each `xml:lang`'s and each `label`'s element, each `xml:lang`'s catalog scope
 * and each element on the way up to it (reading R9-c), each LOM general language's
 * string value, each resource's general category with the type its record names and the document it
 * describes, each SSML attribute reading 3 reads with its fragment and each element on the way up
 * to that fragment, and the projections those rows carry, each value once (sets ruling 2). The
 * database proves every one of them (`identityLaws`), so a row this builder gets wrong is refused,
 * never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import type { DocumentContext } from "#pantry/import/context.ts";
import { Option } from "effect";
import {
  attributeRows,
  GoverningOf,
  ResourceType,
  TextDomain,
  toolLabelKinds,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { collapse, lowerAscii } from "#pantry/import/overlays/metadata.ts";
import { resourcePathsOf } from "#pantry/import/overlays/package.ts";
import { foldOf, ownContext } from "#pantry/import/fold.ts";
import type { Folded } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { AttributeRow, FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type {
  AssembledLang,
  BodyXmlLang,
  CatalogScope,
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
  PlacedBodyXmlLang,
  PlacedGeneralLang,
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
import { objectTypes } from "#pantry/qti/metadata.ts";
import { itemKind, testKind } from "#pantry/qti/tests.ts";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes' and attributes', drawn by
 * the number `flatten` gives it, and the document node of each path of its package, which a
 * resource's `href` names.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface IdentityIds {
  /**
   * Whether the document is in an assembly (`Document.assembled`), so its IDREFs resolve per
   * instance (spec reading 117); none read as no.
   */
  readonly assembled?: boolean;
  /**
   * The document's context (spec reading 117), its own where none is given: an included
   * fragment's nodes take the interaction their includes stand in as their nearest.
   */
  readonly context?: DocumentContext;
  readonly documentAt: (path: string) => Option.Option<NodeId>;
  readonly idOf: (index: number) => NodeId;
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
  readonly BodyXmlLang: ReadonlyMap<string, Addition<typeof BodyXmlLang>>;
  readonly CatalogScope: ReadonlyMap<string, Addition<typeof CatalogScope>>;
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
  readonly PlacedBodyXmlLang: ReadonlyMap<string, Addition<typeof PlacedBodyXmlLang>>;
  readonly PlacedGeneralLang: ReadonlyMap<string, Addition<typeof PlacedGeneralLang>>;
  readonly PlacedXmlLang: ReadonlyMap<string, Addition<typeof PlacedXmlLang>>;
}

/**
 * The installed `GoverningOf`, keyed `version kind governs`: the governor an element reads its
 * attributes and its text under.
 */
const governorAt: ReadonlyMap<string, string> = new Map(
  GoverningOf.rows.map(({ governor, governs, kind, version }) => [
    `${version} ${kind} ${governs}`,
    governor,
  ]),
);

/**
 * The domains of the attribute grammar `AttributeGrammar` installs, keyed `version governor name`.
 */
const domainAt: ReadonlyMap<string, string> = new Map(
  attributeRows.map(({ domain, governor, name, version }) => [
    `${version} ${governor} ${name}`,
    domain,
  ]),
);

/**
 * The installed `TextDomain`, keyed `version governor`: the domain a governor reads its text in.
 */
const textDomainAt: ReadonlyMap<string, string> = new Map(
  TextDomain.rows.map(({ domain, governor, version }) => [`${version} ${governor}`, domain]),
);

/**
 * The installed `ValueIdentity`, keyed by domain.
 */
const identityAt: ReadonlyMap<string, string> = new Map(
  ValueIdentity.rows.map(({ domain, identity }) => [domain, identity]),
);

/**
 * The `ResourceType` handle a `cp:resource`'s `type` names.
 */
type ResourceTypeHandle = Addition<typeof GeneralNamed>["named"];

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
 * The kind of a MathML `share`, whose `src` of the form `#id` is a {@link ShareFragment}.
 */
const shareKind = "m:share";

/**
 * Write the key text of a projection's row.
 *
 * @param values - The heading's values, in the relation's key order.
 * @returns Their JSON array.
 */
const headingKey = (values: readonly string[]): string => JSON.stringify(values);

/**
 * Read the identity type of an attribute's or an element's value domain.
 *
 * @param domain - The domain, none where its owner's governor reads it under none.
 * @returns `ID`, `IDREF`, `IDREFS` or `none`.
 */
const identityOf = (domain: string | undefined): string =>
  domain === undefined ? "none" : (identityAt.get(domain) ?? "none");

/**
 * Read an element's governor, as `GoverningOf` gives it.
 *
 * @param element - The element's node row.
 * @returns The governor, none for a (version, kind, type) `GoverningOf` holds no row of.
 */
const governorOf = (element: NodeRow<Composed>): string | undefined =>
  governorAt.get(`${element.version} ${element.kind} ${element.governs}`);

/**
 * Decide whether an attribute's value is one of its document's IDs, as `identity.ts`'s
 * `idAttributes` selects it: its domain's identity under its element's governor is `xs:ID`, or it
 * is a context declaration's `identifier` (spec reading 74).
 *
 * @param attribute - The attribute row.
 * @param element - Its element's node row.
 * @returns Whether it is ID-typed.
 */
const holdsId = (attribute: AttributeRow<Composed>, element: NodeRow<Composed>): boolean => {
  const governor = governorOf(element);
  const domain =
    governor === undefined
      ? undefined
      : domainAt.get(`${element.version} ${governor} ${attribute.name}`);

  return (
    identityOf(domain) === "ID" ||
    (element.kind === "qti-context-declaration" && attribute.name === "identifier")
  );
};

/**
 * Decide whether an attribute's value is IDREF tokens, as `write.ts` splits an attribute's
 * `Idref` pieces: its domain's identity under its element's governor is `xs:IDREF` or
 * `xs:IDREFS`.
 *
 * @param attribute - The attribute row.
 * @param element - Its element's node row.
 * @returns Whether it is.
 */
const holdsIdref = (attribute: AttributeRow<Composed>, element: NodeRow<Composed>): boolean => {
  const governor = governorOf(element);
  const identity = identityOf(
    governor === undefined
      ? undefined
      : domainAt.get(`${element.version} ${governor} ${attribute.name}`),
  );

  return identity === "IDREF" || identity === "IDREFS";
};

/**
 * Read the identity type of an element's text, as `identity.ts`'s `textIdentityOf` reads it: its
 * governor's text domain's.
 *
 * @param element - The element's node row.
 * @returns `ID`, `IDREF`, `IDREFS` or `none`.
 */
const textIdentityOf = (element: NodeRow<Composed>): string => {
  const governor = governorOf(element);

  return identityOf(
    governor === undefined ? undefined : textDomainAt.get(`${element.version} ${governor}`),
  );
};

/**
 * The text `DocumentId.before` and `after` hold, and an IDREF piece's: XML whitespace, possibly
 * none.
 */
type Spacing = Addition<typeof DocumentId>["before"];

/**
 * Decide whether a text is XML whitespace, possibly none, the language of {@link Spacing}.
 *
 * @param text - The text.
 * @returns Whether every character of it is a tab, a line feed, a carriage return or a space.
 */
const isSpacing = (text: string): text is Spacing => /^[\t\n\r ]*$/u.test(text);

/**
 * Split a text around its value: the XML whitespace before it, the run between, and the
 * whitespace after. A form with whitespace inside its value keeps it in `value`, which the
 * database's `E1_derived` then refuses where the value must hold none, as AL1's lexical half does.
 *
 * @param text - The text as written.
 * @returns The three pieces, which concatenate to it; an all-whitespace text is all `before`.
 */
const piecesOf = (
  text: string,
): Option.Option<{ readonly after: Spacing; readonly before: Spacing; readonly value: string }> => {
  const before = /^[\t\n\r ]*/u.exec(text)?.[0] ?? "";
  const rest = text.slice(before.length);
  const after = /[\t\n\r ]*$/u.exec(rest)?.[0] ?? "";

  return isSpacing(before) && isSpacing(after)
    ? Option.some({ after, before, value: rest.slice(0, rest.length - after.length) })
    : Option.none();
};

/**
 * Split an IDREF or IDREFS text into its tokens, each with the whitespace written before it, and
 * the last with the whitespace after it, so the pieces concatenate to the text and every token but
 * the first follows whitespace (`E1_derived` on `TextIdref`), as the importer splits an
 * attribute's.
 *
 * @param text - The element's string value.
 * @returns Its pieces, in order; none for a text with no token, which TextDomain refuses.
 */
const idrefPiecesOf = (text: string): readonly TextIdrefInsert[] => {
  const runs = [...text.matchAll(/(?<before>[\t\n\r ]*)(?<token>[^\t\n\r ]+)/gu)];
  const tail = runs.reduce((end, run) => end + run[0].length, 0);

  return runs.flatMap((run, at): readonly TextIdrefInsert[] => {
    const before = run.groups?.["before"] ?? "";
    const token = run.groups?.["token"] ?? "";
    const after = at === runs.length - 1 ? text.slice(tail) : "";

    return isSpacing(before) && isSpacing(after)
      ? [{ after, before, piece: `${before}${token}${after}`, token }]
      : [];
  });
};

/**
 * Compute each element's string value as `Node.stringValue` folds it: its children's characters in
 * order, a text's and whitespace's own, an unexpanded entity reference's `&name;`, a comment's and
 * an instruction's none.
 *
 * @param rows - The document's flat rows.
 * @returns Each parent's string value, by its id; an element with no character child has none.
 */
const stringValues = (rows: FlatRows<Composed>): ReadonlyMap<NodeId, string> => {
  const chars = new Map<NodeId, string>([
    ...rows.texts.map(({ node, value }) => [node, value] as const),
    ...rows.whitespace.map(({ node, value }) => [node, value] as const),
    ...rows.entityRefs.map(({ name, node }) => [node, `&${name};`] as const),
  ]);
  const values = new Map<NodeId, string>();

  for (const node of rows.nodes) {
    const held = chars.get(node.id);
    if (held !== undefined && node.parent !== node.id) {
      values.set(node.parent, (values.get(node.parent) ?? "") + held);
    }
  }

  return values;
};

/**
 * A document's tree as the builders below read it: its flat rows, its document node and root kind,
 * each node by its id, each element's string value, and each element's attributes by name.
 */
interface Tree {
  readonly byId: ReadonlyMap<NodeId, NodeRow<Composed>>;
  readonly document: NodeId;
  /**
   * Each node's fold (`#pantry/import/fold.ts`): its nearest interaction among the rest, the
   * document node's its context's (spec reading 117).
   */
  readonly folds: ReadonlyMap<NodeId, Folded>;
  readonly rootKind: Addition<typeof LabelUse>["rootKind"];
  readonly rows: FlatRows<Composed>;
  readonly valueOf: (node: NodeId, name: string) => string | undefined;
  readonly values: ReadonlyMap<NodeId, string>;
}

/**
 * Split an ID's lexical form into its `DocumentId` row, bound to an owner.
 *
 * @param tree - The document's tree.
 * @param node - The element that carries the ID.
 * @param lexical - The ID's lexical form.
 * @param owner - The element its binding names: the attribute's element, or the text's parent.
 * @returns The row, none for a form whose pieces are not whitespace.
 */
const documentIdOf = (
  tree: Tree,
  node: NodeId,
  lexical: string,
  owner: NodeId,
): Option.Option<Addition<typeof DocumentId>> =>
  Option.map(piecesOf(lexical), ({ after, before, value }) => ({
    after,
    before,
    document: tree.document,
    id: value,
    lexical,
    node,
    owner,
  }));

/**
 * Build the rows a document's attributes give: each attribute ID's `DocumentId` and the `LabelUse`
 * of each `label` that asks for its tool.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its key text.
 */
const attributeRowsOf = (tree: Tree): Pick<IdentityRows, "DocumentId" | "LabelUse"> => {
  const { document, rootKind } = tree;
  const documentIds = new Map<string, Addition<typeof DocumentId>>();
  const labels = new Map<string, Addition<typeof LabelUse>>();

  for (const attribute of tree.rows.attributes) {
    const element = tree.byId.get(attribute.node);
    const { lexical, name, node } = attribute;
    if (element !== undefined && holdsId(attribute, element)) {
      for (const row of Option.toArray(documentIdOf(tree, node, lexical, node))) {
        documentIds.set(node, documentIds.get(node) ?? row);
      }
    }

    if (
      element !== undefined &&
      name === "label" &&
      (toolLabelled.has(element.kind) ||
        (element.kind === itemKind && element.version === labelledRootVersion))
    ) {
      labels.set(node, { document, node, rootKind });
    }
  }

  return { DocumentId: documentIds, LabelUse: labels };
};

/**
 * Build the {@link ShareFragment} of each `m:share` whose `src` is `#` and one or more characters
 * (MathML 3 §4.2.7), as `#pantry/qti/identity.ts` selects them: its `src` as written and `id`, the
 * text after the `#`.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its node.
 */
const shareFragmentsOf = (tree: Tree): Map<string, Addition<typeof ShareFragment>> => {
  const fragments = new Map<string, Addition<typeof ShareFragment>>();

  for (const { lexical, name, node } of tree.rows.attributes) {
    if (
      name === "src" &&
      lexical.length > 1 &&
      lexical.startsWith("#") &&
      tree.byId.get(node)?.kind === shareKind
    ) {
      fragments.set(node, { document: tree.document, id: lexical.slice(1), node, src: lexical });
    }
  }

  return fragments;
};

/**
 * Build the rows a document's identity-typed texts give (C50): each one's `IdentityText`, with its
 * IDREF tokens nested, and each ID text's `DocumentId`, bound to the element's parent.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its node's id.
 */
const textRowsOf = (tree: Tree): Pick<IdentityRows, "DocumentId" | "IdentityText"> => {
  const documentIds = new Map<string, Addition<typeof DocumentId>>();
  const identityTexts = new Map<string, IdentityTextRow>();

  for (const node of tree.rows.nodes) {
    const text = tree.values.get(node.id) ?? "";
    const identity = textIdentityOf(node);
    if (identity === "none") {
      continue;
    }

    identityTexts.set(node.id, {
      document: tree.document,
      governs: node.governs,
      idrefs: identity === "ID" ? [] : idrefPiecesOf(text),
      kind: node.kind,
      lexical: text,
      node: node.id,
      owner: node.parent,
      version: node.version,
    });

    if (identity === "ID") {
      for (const row of Option.toArray(documentIdOf(tree, node.id, text, node.parent))) {
        documentIds.set(node.id, row);
      }
    }
  }

  return { DocumentId: documentIds, IdentityText: identityTexts };
};

/**
 * Build the rows a document's LOM general categories give: each `lom:language`'s `LomLanguage`,
 * with its tag case-folded, and its category's language set, by those tags; and, for a category of
 * a resource's record, its `GeneralNamed` and, where the record names a document, its
 * `GeneralObject`.
 *
 * @param tree - The document's tree.
 * @param ids - The ids its rows are written under, whose `documentAt` resolves a resource's href.
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
  // Each resource's href resolved as its `ResourceHref` is, read only for a manifest's records.
  let resourcePaths: ReadonlyMap<NodeId, string> | undefined;

  for (const node of tree.rows.nodes) {
    const text = tree.values.get(node.id) ?? "";
    const parent = tree.byId.get(node.parent);
    if (node.kind === "lom:language" && parent?.kind === "lom:general") {
      const tag = lowerAscii(text);
      lomLanguages.set(node.id, { general: node.parent, lang: text, node: node.id, tag });
      lomSets.set(headingKey([node.parent, tag]), { general: node.parent, lang: tag });
    }

    const owner = parent?.kind === "lom:lom" ? tree.byId.get(parent.parent) : undefined;
    if (node.kind !== "lom:general" || parent === undefined || owner?.kind !== resourceMetadata) {
      continue;
    }

    const href = tree.valueOf(owner.parent, "href");
    const naming =
      href === undefined ? undefined : namingTypes.get(tree.valueOf(owner.parent, "type") ?? "");
    named.set(node.id, { general: node.id, named: naming ?? "none", record: parent.id });
    if (href !== undefined && naming !== undefined) {
      resourcePaths ??= resourcePathsOf(tree.rows);
      objects.set(node.id, {
        document: Option.getOrElse(
          ids.documentAt(resourcePaths.get(owner.parent) ?? ""),
          () => tree.document,
        ),
        general: node.id,
        record: parent.id,
      });
    }
  }

  return {
    GeneralNamed: named,
    GeneralObject: objects,
    LomLanguage: lomLanguages,
    ResourceLomLanguageSet: lomSets,
  };
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
 * The walk from an element up to its scope root, the element first, and the scope it ends at: the
 * scope root, or the document node where none holds the element.
 */
interface ScopeWalk {
  readonly scope: NodeId;
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
 * @returns The walk, the element first, and its scope: the element of that kind it ends at, or the
 *   document node where none holds the element.
 */
const scopeWalkOf = (tree: Tree, element: NodeRow<Composed>, scopeKind: string): ScopeWalk => {
  const walk: NodeRow<Composed>[] = [];
  let at: NodeRow<Composed> | undefined = element;
  while (at !== undefined) {
    walk.push(at);
    if (at.kind === scopeKind) {
      return { scope: at.id, walk };
    }

    at = at.parent === tree.document ? undefined : tree.byId.get(at.parent);
  }

  return { scope: tree.document, walk };
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

    const { scope: fragment, walk } = scopeWalkOf(tree, element, "ssml:speak");
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
          nearest: tree.folds.get(node.id)?.nearest ?? tree.document,
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
 * Build the rows a document's `xml:lang`s give: each one's `XmlLang`, its `scope` its nearest
 * `qti-catalog-info` or the document (reading R9-c); each element on the walk up to that scope its
 * `CatalogScope`; and each form once, as a `DocumentLang`, where an element outside every catalog
 * carries it, since R26 counts no other.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its key text.
 */
const langRowsOf = (
  tree: Tree,
): Pick<IdentityRows, "BodyXmlLang" | "CatalogScope" | "DocumentLang" | "XmlLang"> => {
  const { document } = tree;
  const scopes = new Map<string, Addition<typeof CatalogScope>>();
  const xmlLangs = new Map<string, Addition<typeof XmlLang>>();
  const bodyLangs = new Map<string, Addition<typeof BodyXmlLang>>();
  const documentLangs = new Map<string, Addition<typeof DocumentLang>>();

  for (const { lexical, name, node } of tree.rows.attributes) {
    const element = tree.byId.get(node);
    if (element === undefined || name !== "xml:lang") {
      continue;
    }

    const { scope, walk } = scopeWalkOf(tree, element, "qti-catalog-info");
    xmlLangs.set(node, { document, lang: lexical, node, scope });
    if (scope === document) {
      bodyLangs.set(node, { document, lang: lexical, node });
      documentLangs.set(headingKey([document, lexical]), { document, lang: lexical });
    }

    for (const at of walk) {
      scopes.set(at.id, {
        document,
        kind: at.kind,
        nearest: tree.folds.get(at.id)?.nearest ?? document,
        node: at.id,
        parent: at.parent,
        scope,
        start: at.start,
        version: at.version,
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
 * Each overlay holds one row per element it describes, keyed by the element's node, and each
 * projection one row per value, so a value an element repeats is one row. A copied text past
 * `keyText`'s bound keeps its row, whatever its length: `keyText`'s own check refuses it in the
 * database under "Key text bound", the one rule a key text past its bound is refused by, as the law
 * oracle names it. Every document has its
 * {@link DocumentGenerals} row, whose count the database draws.
 *
 * A resource's general category names the type its record names: the resource's `type` where that
 * spells an item's or a test's handle and the resource has an `href` (Q5.12's `LomRecord.named`),
 * else `none`; and a naming category describes the document at the `href`'s path (reading 102), or
 * the manifest itself where the package holds none there, as Q5.12's `LomObject` does, whose
 * containments refuse it.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every identity relation's rows but R26's witnesses.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: IdentityIds): IdentityRows => {
  const rows = flatten(doc, ids.idOf);
  const lexicals = new Map(rows.attributes.map((row) => [`${row.node} ${row.name}`, row.lexical]));
  const tree: Tree = {
    byId: new Map(rows.nodes.map((node) => [node.id, node] as const)),
    document: rows.document.node,
    folds: foldOf(rows.nodes, ids.context ?? ownContext(rows.document.node)),
    rootKind: doc.root.kind,
    rows,
    valueOf: (node, name) => lexicals.get(`${node} ${name}`),
    values: stringValues(rows),
  };
  const attributed = attributeRowsOf(tree);
  const texts = textRowsOf(tree);
  const documentIds = new Map([...texts.DocumentId, ...attributed.DocumentId]);
  const assembled = ids.assembled ?? false;
  const shares = shareFragmentsOf(tree);
  const targets = [
    ...rows.attributes.flatMap((attribute) => {
      const element = tree.byId.get(attribute.node);

      return element !== undefined && holdsIdref(attribute, element)
        ? idrefPiecesOf(attribute.lexical).map(({ token }) => token)
        : [];
    }),
    ...[...texts.IdentityText.values()].flatMap(({ idrefs }) => idrefs.map(({ token }) => token)),
    ...[...shares.values()].map(({ id }) => id),
  ];

  return {
    ...attributed,
    ...lomRowsOf(tree, ids),
    ...langRowsOf(tree),
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
        { assembled, document: tree.document, id },
      ]),
    ),
    ShareFragment: shares,
  };
};

/**
 * The nil uuid: a placed ID's `copy` under a test's assembly, where a section document placed twice
 * holds its IDs once (reading 86).
 */
const nilUuid = "00000000-0000-0000-0000-000000000000";

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
 * projection, each placed ID's binding in its assembly, its copy the instance but under a test's
 * assembly, where a section document placed twice is written once (reading 86).
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
  const idsOf = Map.groupBy(input.ids, ({ document }) => document);
  const targetsOf = Map.groupBy(input.targets, ({ document }) => document);
  const placed = new Map<string, Addition<typeof PlacedId>>();
  const assembled = new Map<string, Addition<typeof AssembledId>>();
  const placedTargets = new Map<string, Addition<typeof PlacedIdref>>();
  for (const root of input.instances) {
    for (const instance of instancesOf(root)) {
      const copy = root.assemblyKind === testKind ? nilUuid : instance.id;
      for (const { document, id, node, owner } of idsOf.get(instance.document) ?? []) {
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

      for (const { document, id } of targetsOf.get(instance.document) ?? []) {
        placedTargets.set(headingKey([instance.id, id]), {
          assembly: root.assembly,
          document,
          id,
          instance: instance.id,
        });
      }
    }
  }

  return { AssembledId: assembled, PlacedId: placed, PlacedIdref: placedTargets };
};

/**
 * Build a package's R26 witnesses from every document's identity rows: for each general category
 * that describes a document ({@link IdentityRows.GeneralObject}, the manifest's) and each of the
 * document's `xml:lang` forms that states a language, a {@link GeneralLang} row where the category
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
  const formsOf = Map.groupBy(
    documents.flatMap((rows) => [...rows.DocumentLang.values()]),
    ({ document }) => document,
  );
  const witnesses = new Map<string, Addition<typeof GeneralLang>>();

  for (const { document, general } of documents.flatMap((rows) => [
    ...rows.GeneralObject.values(),
  ])) {
    for (const { lang } of formsOf.get(document) ?? []) {
      const value = lowerAscii(collapse(lang));
      if (value !== "" && listed.has(headingKey([general, value]))) {
        witnesses.set(headingKey([general, lang]), { document, general, lang, value });
      }
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
  const carriersOf = Map.groupBy(
    documents.flatMap((rows) => [...rows.XmlLang.values()]),
    ({ document }) => document,
  );
  const listed = new Set(
    documents.flatMap((rows) =>
      [...rows.ResourceLomLanguageSet.values()].map(({ general, lang }) =>
        headingKey([general, lang]),
      ),
    ),
  );
  const generalsOf = Map.groupBy(
    documents.flatMap((rows) => [...rows.GeneralObject.values()]),
    ({ document }) => document,
  );
  const placed = new Map<string, Addition<typeof PlacedXmlLang>>();
  const placedBody = new Map<string, Addition<typeof PlacedBodyXmlLang>>();
  const assembled = new Map<string, Addition<typeof AssembledLang>>();
  const witnesses = new Map<string, Addition<typeof PlacedGeneralLang>>();
  for (const root of instances) {
    for (const instance of root.assemblyKind === itemKind ? instancesOf(root) : []) {
      for (const { lang, node, scope } of carriersOf.get(instance.document) ?? []) {
        placed.set(headingKey([instance.id, node]), {
          assembly: root.assembly,
          document: instance.document,
          instance: instance.id,
          lang,
          node,
          scope,
        });
        if (scope === instance.document) {
          placedBody.set(headingKey([instance.id, node]), {
            assembly: root.assembly,
            document: instance.document,
            instance: instance.id,
            lang,
            node,
          });
          assembled.set(headingKey([root.assembly, lang]), { assembly: root.assembly, lang });
        }
      }
    }
  }

  for (const { assembly, lang } of assembled.values()) {
    const value = lowerAscii(collapse(lang));
    for (const { general } of generalsOf.get(assembly) ?? []) {
      if (value !== "" && listed.has(headingKey([general, value]))) {
        witnesses.set(headingKey([general, lang]), { assembly, general, lang, value });
      }
    }
  }

  return {
    AssembledLang: assembled,
    PlacedBodyXmlLang: placedBody,
    PlacedGeneralLang: witnesses,
    PlacedXmlLang: placed,
  };
};
