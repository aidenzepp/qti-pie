/**
 * The metadata overlays' rows (plan §1.7 O6, §C's `rowsOf`): from one document's XDM tree and the
 * ids its nodes are written under, the rows of every per-document relation
 * `#pantry/qti/metadata.ts` declares, each relation's rows a keyed set; and, from a package's
 * manifest and its documents' assessment objects, each naming record's {@link LomObject},
 * {@link LomObjectIdentifier} and {@link LomObjectTitle} rows.
 *
 * The rows restate what the tree says and nothing else: each overlay copies its nodes' tuples as
 * the tree's rows give them (`flatten` of `#pantry/model/xdm.ts`), each copied text as written and
 * split around its collapsed value, and each resource's type as the `ResourceType` handle its
 * lexical form spells (C17). The database proves every one of them (`metadataLaws`), so a row this
 * builder gets wrong is refused, never accepted. A copied text past `keyText`'s bound is written as
 * it is, and its field's pattern refuses it under the schema's limit law.
 */
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { BaseType, ResourceType } from "#pantry/grammar/install.ts";
import { resourcePathsOf } from "#pantry/import/overlays/package.ts";
import { foldOf, ownContext } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import {
  objectKinds,
  objectTypes,
  recordDocumentTypes,
  statisticKinds,
  usageValueKind,
} from "#pantry/qti/metadata.ts";
import type {
  AssessmentObject,
  LomEntry,
  LomGeneral,
  LomObject,
  LomObjectIdentifier,
  LomObjectTitle,
  LomRecord,
  LomResource,
  LomResourceType,
  LomResourceTypeSource,
  LomString,
  LomStringLanguage,
  LomTitle,
  LomTitleString,
  ObjectLang,
  ResourceLomGeneral,
  StatisticDate,
  UsageValue,
} from "#pantry/qti/metadata.ts";

/**
 * The ids a document's rows are written under: its package's, and each of its tree's nodes', drawn
 * by the number `flatten` gives the node, in document order from the document node's 0.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface MetadataIds {
  /**
   * The document's type, the resource's that lists it, `none` for the manifest: a package's
   * records are read from a document of a type of `recordDocumentTypes` alone.
   */
  readonly documentType: (typeof ResourceType.handles)[number];
  readonly idOf: (index: number) => NodeId;
  readonly package: Uuid;
}

/**
 * A document's metadata rows, one keyed set per relation: each map from the text of a row's key,
 * its node's id, to the row as its writer writes it.
 */
export interface MetadataRows {
  readonly AssessmentObject: ReadonlyMap<string, Addition<typeof AssessmentObject>>;
  readonly LomEntry: ReadonlyMap<string, Addition<typeof LomEntry>>;
  readonly LomGeneral: ReadonlyMap<string, Addition<typeof LomGeneral>>;
  readonly LomRecord: ReadonlyMap<string, Addition<typeof LomRecord>>;
  readonly LomResource: ReadonlyMap<string, Addition<typeof LomResource>>;
  readonly LomResourceType: ReadonlyMap<string, Addition<typeof LomResourceType>>;
  readonly LomResourceTypeSource: ReadonlyMap<string, Addition<typeof LomResourceTypeSource>>;
  readonly LomString: ReadonlyMap<string, Addition<typeof LomString>>;
  readonly LomStringLanguage: ReadonlyMap<string, Addition<typeof LomStringLanguage>>;
  readonly LomTitle: ReadonlyMap<string, Addition<typeof LomTitle>>;
  readonly LomTitleString: ReadonlyMap<string, Addition<typeof LomTitleString>>;
  readonly ObjectLang: ReadonlyMap<string, Addition<typeof ObjectLang>>;
  readonly ResourceLomGeneral: ReadonlyMap<string, Addition<typeof ResourceLomGeneral>>;
  readonly StatisticDate: ReadonlyMap<string, Addition<typeof StatisticDate>>;
  readonly UsageValue: ReadonlyMap<string, Addition<typeof UsageValue>>;
}

/**
 * A package's object rows, one keyed set per relation, each by its record's id: the document each
 * naming record names, and the witnesses by which it names it.
 */
export interface ObjectRows {
  readonly LomObject: ReadonlyMap<string, Addition<typeof LomObject>>;
  readonly LomObjectIdentifier: ReadonlyMap<string, Addition<typeof LomObjectIdentifier>>;
  readonly LomObjectTitle: ReadonlyMap<string, Addition<typeof LomObjectTitle>>;
}

/**
 * The `ResourceType` handle a `cp:resource`'s `type` names.
 */
type ResourceTypeHandle = Addition<typeof LomResource>["named"];

/**
 * The `ResourceType` handles a lexical form can spell: every one but the null object `none`, which
 * `ResourceTypeLexical` holds no row for (C17).
 */
const spelledTypes: ReadonlyMap<string, ResourceTypeHandle> = new Map(
  ResourceType.handles.flatMap((handle) => (handle === "none" ? [] : [[handle, handle] as const])),
);

/**
 * The `BaseType` handle a usage value's `baseType` names.
 */
type BaseTypeHandle = Addition<typeof UsageValue>["baseType"];

/**
 * The `BaseType` handles a lexical form can spell: every one but the null object `none`, which
 * `BaseTypeLexical` holds no row for (C17), each spelled as itself.
 */
const spelledBaseTypes: ReadonlyMap<string, BaseTypeHandle> = new Map(
  BaseType.handles.flatMap((handle) => (handle === "none" ? [] : [[handle, handle] as const])),
);

/**
 * The resource types whose LOM record names its document, as a set.
 */
const naming: ReadonlySet<string> = new Set(objectTypes);

/**
 * The kinds of an assessment object's root, as a set.
 */
const objects: ReadonlySet<string> = new Set(objectKinds);

/**
 * The usage statistics, as a set.
 */
const statistics: ReadonlySet<string> = new Set(statisticKinds);

/**
 * The owner whose records name a resource.
 */
const resourceMetadata = "cp:metadata.resource";

/**
 * XML whitespace `S`, possibly none, as the overlays' `lead` and `trail` fields type it.
 */
type Space = Addition<typeof LomEntry>["lead"];

/**
 * A text split around its collapsed value: the whitespace before it, the rest with no whitespace at
 * either end, and the whitespace after it, empty when the rest is.
 */
export interface Pieces {
  readonly lead: Space;
  readonly token: string;
  readonly trail: Space;
}

/**
 * Decide whether a text is XML whitespace `S`, possibly none.
 *
 * @param text - The text.
 * @returns Whether every character is a space, a tab, a line feed or a carriage return.
 */
const isSpace = (text: string): text is Space => /^[\t\n\r ]*$/u.test(text);

/**
 * Split a text around its value, as the overlays' `lead ‖ token ‖ trail` holds it: the whitespace
 * `S` before the first character that is not whitespace, then up to and including the last one,
 * then the rest. An all-whitespace text is all lead.
 *
 * @param text - The text.
 * @returns Its pieces, which concatenate to it.
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
export const piecesOf = (text: string): Pieces => {
  const lead = /^[\t\n\r ]*/u.exec(text)?.[0] ?? "";
  const rest = text.slice(lead.length);
  const trail = /[\t\n\r ]*$/u.exec(rest)?.[0] ?? "";

  return {
    lead: isSpace(lead) ? lead : "",
    token: rest.slice(0, rest.length - trail.length),
    trail: isSpace(trail) ? trail : "",
  };
};

/**
 * Read a text in `xs:normalizedString`'s value space, as `Compute.replaceWhitespace` does: each
 * tab, line feed and carriage return a space.
 *
 * @param text - The text.
 * @returns The text with every such character replaced.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, whiteSpace}
 */
export const replaceWhitespace = (text: string): string => text.replaceAll(/[\t\n\r]/gu, " ");

/**
 * Collapse a text, as `Compute.collapse` does: each run of tabs, line feeds, carriage returns and
 * spaces one space, and none at either end. No other character is whitespace to it.
 *
 * @param text - The text.
 * @returns The collapsed text.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, whiteSpace}
 */
export const collapse = (text: string): string =>
  text
    .replaceAll(/[\t\n\r ]+/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * Fold a text's ASCII capitals to small letters, as `Compute.lowerAscii` does, every other
 * character as it is: a BCP 47 tag's case (RFC 5646 §2.1.1).
 *
 * @param text - The text.
 * @returns The folded text.
 */
export const lowerAscii = (text: string): string =>
  text.replaceAll(/[A-Z]/gu, (capital) => capital.toLowerCase());

/**
 * Read the code of a resource's `type` from its lexical form, as written: an `xs:string`
 * enumeration, whose whitespace is preserved (XSD 1.1 Part 2, §4.3.6).
 *
 * @param lexical - The `type` attribute's lexical form, as written.
 * @returns The handle it spells; none for a form no handle spells.
 */
const typeOf = (lexical: string): Option.Option<ResourceTypeHandle> =>
  Option.fromUndefinedOr(spelledTypes.get(lexical));

/**
 * Compute each element's string value as `Node.stringValue` folds it for the kinds an overlay
 * copies: its children's characters in order, a text's and whitespace's as they are, an entity
 * reference's as `&name;`, a comment's and an instruction's none.
 *
 * @param rows - The document's flat rows.
 * @returns Each element's string value, by its id, for every element with a child.
 */
const stringValuesOf = (rows: FlatRows<Composed>): ReadonlyMap<NodeId, string> => {
  const chars = new Map<NodeId, string>([
    ...rows.texts.map(({ node, value }) => [node, value] as const),
    ...rows.whitespace.map(({ node, value }) => [node, value] as const),
    ...rows.entityRefs.map(({ name, node }) => [node, `&${name};`] as const),
  ]);
  const values = new Map<NodeId, string>();

  for (const node of rows.nodes) {
    if (node.parent !== node.id) {
      values.set(node.parent, `${values.get(node.parent) ?? ""}${chars.get(node.id) ?? ""}`);
    }
  }

  return values;
};

/**
 * Index a document's attribute rows by their element and name.
 *
 * @param rows - The document's flat rows.
 * @returns Each element's attributes' lexical forms, by the element's id and the attribute's name.
 */
const attributesOf = (
  rows: FlatRows<Composed>,
): ReadonlyMap<NodeId, ReadonlyMap<string, string>> => {
  const byNode = new Map<NodeId, Map<string, string>>();

  for (const { lexical, name, node } of rows.attributes) {
    const named = byNode.get(node) ?? new Map<string, string>();
    named.set(name, lexical);
    byNode.set(node, named);
  }

  return byNode;
};

/**
 * A document's tree as the builders read it: its flat rows, each node by its id, each element's
 * attributes and string value, and each node's {@link nodeRef}-shaped tuple.
 */
interface Tree {
  readonly nodes: readonly NodeRow<Composed>[];
  readonly nodeOf: (id: NodeId) => NodeRow<Composed> | undefined;
  readonly stringValueOf: (id: NodeId) => string;
  readonly tupleOf: (node: NodeRow<Composed>) => {
    readonly document: NodeId;
    readonly kind: NodeRow<Composed>["kind"];
    readonly nearest: NodeId;
    readonly node: NodeId;
    readonly parent: NodeId;
    readonly start: bigint;
    readonly version: NodeRow<Composed>["version"];
  };
  readonly valueOf: (node: NodeRow<Composed>, name: string) => string | undefined;
}

/**
 * Read a document's tree once, as every builder below reads it.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns The tree's rows and lookups.
 */
const treeOf = (doc: XdmDocument<Composed>, ids: MetadataIds): Tree => {
  const rows = flatten(doc, ids.idOf);
  const attributes = attributesOf(rows);
  const folds = foldOf(rows.nodes, ownContext(rows.document.node));
  const values = stringValuesOf(rows);
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const document = rows.document.node;

  return {
    nodeOf: (id) => byId.get(id),
    nodes: rows.nodes,
    stringValueOf: (id) => values.get(id) ?? "",
    tupleOf: (node) => ({
      document,
      kind: node.kind,
      nearest: folds.get(node.id)?.nearest ?? document,
      node: node.id,
      parent: node.parent,
      start: node.start,
      version: node.version,
    }),
    valueOf: (node, name) => attributes.get(node.id)?.get(name),
  };
};

/**
 * Build a document's {@link LomResource} rows: one per `cp:resource`, `named` the handle its `type`
 * spells where it has an `href` and that handle is an item's or a test's, its `TypedHref`'s; else
 * `none`, a resource that names no assessment object, a type spelling nothing among them.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's id.
 */
const resourceRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof LomResource>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      if (node.kind !== "cp:resource") {
        return [];
      }

      const object = Option.filter(typeOf(tree.valueOf(node, "type") ?? ""), (type) =>
        naming.has(type),
      );
      const named: ResourceTypeHandle =
        tree.valueOf(node, "href") === undefined ? "none" : Option.getOrElse(object, () => "none");

      return [[node.id, { named, node: node.id }] as const];
    }),
  );

/**
 * Build a document's {@link LomRecord} rows: one per `lom:lom`, with its owner's kind, start and
 * parent, and its resource's `named` where its owner is a resource's `cp:metadata`.
 *
 * @param tree - The document's tree.
 * @param resources - The document's {@link LomResource} rows.
 * @returns The rows, by their node's id.
 */
const recordRowsOf = (
  tree: Tree,
  resources: ReadonlyMap<string, Addition<typeof LomResource>>,
): ReadonlyMap<string, Addition<typeof LomRecord>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const owner = node.kind === "lom:lom" ? tree.nodeOf(node.parent) : undefined;
      if (owner === undefined) {
        return [];
      }

      const resource = owner.kind === resourceMetadata ? resources.get(owner.parent) : undefined;

      return [
        [
          node.id,
          {
            ...tree.tupleOf(node),
            named: resource?.named ?? "none",
            owner: owner.kind,
            ownerParent: owner.parent,
            ownerStart: owner.start,
          },
        ] as const,
      ];
    }),
  );

/**
 * Build a document's {@link LomGeneral} rows: one per `lom:general`, with its record's owner and
 * owner's parent.
 *
 * @param tree - The document's tree.
 * @param records - The document's {@link LomRecord} rows.
 * @returns The rows, by their node's id.
 */
const generalRowsOf = (
  tree: Tree,
  records: ReadonlyMap<string, Addition<typeof LomRecord>>,
): ReadonlyMap<string, Addition<typeof LomGeneral>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const record = node.kind === "lom:general" ? records.get(node.parent) : undefined;

      return record === undefined
        ? []
        : [
            [
              node.id,
              { ...tree.tupleOf(node), owner: record.owner, ownerParent: record.ownerParent },
            ] as const,
          ];
    }),
  );

/**
 * Build a document's {@link LomEntry} rows: one per `lom:entry`, with its identifier's and holder's
 * tuples, its record's `named` where its holder is a general category, and its string value in
 * pieces.
 *
 * @param tree - The document's tree.
 * @param records - The document's {@link LomRecord} rows.
 * @returns The rows, by their node's id.
 */
const entryRowsOf = (
  tree: Tree,
  records: ReadonlyMap<string, Addition<typeof LomRecord>>,
): ReadonlyMap<string, Addition<typeof LomEntry>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const identifier = node.kind === "lom:entry" ? tree.nodeOf(node.parent) : undefined;
      const holder = identifier === undefined ? undefined : tree.nodeOf(identifier.parent);
      if (identifier === undefined || holder === undefined) {
        return [];
      }

      const text = tree.stringValueOf(node.id);
      const named =
        holder.kind === "lom:general" ? (records.get(holder.parent)?.named ?? "none") : "none";

      return [
        [
          node.id,
          {
            ...tree.tupleOf(node),
            ...piecesOf(text),
            holder: holder.id,
            holderKind: holder.kind,
            holderParent: holder.parent,
            holderStart: holder.start,
            identifierKind: identifier.kind,
            identifierStart: identifier.start,
            named,
            text,
          },
        ] as const,
      ];
    }),
  );

/**
 * Build a document's {@link LomTitle} rows: one per `lom:title`, with its general category's kind,
 * start and parent (the record), and its record's `named`.
 *
 * @param tree - The document's tree.
 * @param records - The document's {@link LomRecord} rows.
 * @returns The rows, by their node's id.
 */
const titleRowsOf = (
  tree: Tree,
  records: ReadonlyMap<string, Addition<typeof LomRecord>>,
): ReadonlyMap<string, Addition<typeof LomTitle>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const general = node.kind === "lom:title" ? tree.nodeOf(node.parent) : undefined;
      if (general === undefined) {
        return [];
      }

      return [
        [
          node.id,
          {
            ...tree.tupleOf(node),
            generalKind: general.kind,
            generalStart: general.start,
            named: records.get(general.parent)?.named ?? "none",
            record: general.parent,
          },
        ] as const,
      ];
    }),
  );

/**
 * A document's string rows: each `lom:string`'s {@link LomString}, and its {@link LomStringLanguage}
 * where it writes a `language`, each by its node's id.
 */
interface StringRows {
  readonly languages: ReadonlyMap<string, Addition<typeof LomStringLanguage>>;
  readonly strings: ReadonlyMap<string, Addition<typeof LomString>>;
}

/**
 * Build a document's {@link LomString} and {@link LomStringLanguage} rows: one per `lom:string`,
 * with its `language` where it writes one.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its node's id.
 */
const stringRowsOf = (tree: Tree): StringRows => {
  const strings = tree.nodes.filter(({ kind }) => kind === "lom:string");

  return {
    languages: new Map(
      strings.flatMap((node) => {
        const language = tree.valueOf(node, "language");

        return language === undefined ? [] : [[node.id, { language, node: node.id }] as const];
      }),
    ),
    strings: new Map(
      strings.map(
        (node) =>
          [node.id, { language: tree.valueOf(node, "language") ?? "", node: node.id }] as const,
      ),
    ),
  };
};

/**
 * Build a document's {@link LomTitleString} rows: one per `lom:string` of a title, with its title's
 * record, its string value and its `language` as written, and the two as `lom-title` compares them:
 * the value with its whitespace replaced, the language case-folded.
 *
 * @param tree - The document's tree.
 * @param titles - The document's {@link LomTitle} rows.
 * @returns The rows, by their node's id.
 */
const titleStringRowsOf = (
  tree: Tree,
  titles: ReadonlyMap<string, Addition<typeof LomTitle>>,
): ReadonlyMap<string, Addition<typeof LomTitleString>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const title = node.kind === "lom:string" ? titles.get(node.parent) : undefined;
      if (title === undefined) {
        return [];
      }

      const language = tree.valueOf(node, "language") ?? "";
      const text = tree.stringValueOf(node.id);

      return [
        [
          node.id,
          {
            ...tree.tupleOf(node),
            language,
            languageTag: lowerAscii(language),
            record: title.record,
            text,
            textValue: replaceWhitespace(text),
          },
        ] as const,
      ];
    }),
  );

/**
 * A LOM learning resource type's term as its two overlays hold it: the type's node, the term's own
 * node and the term's string value. {@link LomResourceType} and {@link LomResourceTypeSource} share
 * the shape.
 */
type TermRow = Addition<typeof LomResourceType> & Addition<typeof LomResourceTypeSource>;

/**
 * Build a document's rows for one term of its LOM learning resource types (spec reading 122): one
 * per `lom:learningResourceType` that holds the term, its first in document order, with the term's
 * node and string value. The binding's Schematron caps each term at one per type (N7), so a second
 * names no row, and N7 refuses its document.
 *
 * @param tree - The document's tree.
 * @param kind - The term's kind: `lom:value` for {@link LomResourceType}, `lom:source` for
 *   {@link LomResourceTypeSource}.
 * @returns The rows, by the type's node's id.
 */
const termRowsOf = (tree: Tree, kind: "lom:source" | "lom:value"): ReadonlyMap<string, TermRow> => {
  const rows = new Map<string, TermRow>();

  for (const node of tree.nodes) {
    if (
      node.kind === kind &&
      tree.nodeOf(node.parent)?.kind === "lom:learningResourceType" &&
      !rows.has(node.parent)
    ) {
      rows.set(node.parent, {
        node: node.parent,
        term: node.id,
        text: tree.stringValueOf(node.id),
      });
    }
  }

  return rows;
};

/**
 * A document's root rows: an item's or test's {@link AssessmentObject}, and its
 * {@link ObjectLang} where it writes an `xml:lang`, each by its node's id.
 */
interface RootRows {
  readonly langs: ReadonlyMap<string, Addition<typeof ObjectLang>>;
  readonly objects: ReadonlyMap<string, Addition<typeof AssessmentObject>>;
}

/**
 * Build a document's {@link AssessmentObject} and {@link ObjectLang} rows: one per item's or test's
 * root, its `identifier` split around its collapsed value, its `title` as written and with its
 * whitespace replaced, and its `xml:lang` where it writes one, as written and collapsed and
 * case-folded. A root that writes no `identifier` or `title` has none, which AL3 refuses.
 *
 * @param tree - The document's tree.
 * @returns The rows, each by its node's id.
 */
const objectRowsOf = (tree: Tree): RootRows => {
  const roots = tree.nodes.filter(({ kind }) => objects.has(kind));

  return {
    langs: new Map(
      roots.flatMap((node) => {
        const lang = tree.valueOf(node, "xml:lang");

        return lang === undefined ? [] : [[node.id, { lang, node: node.id }] as const];
      }),
    ),
    objects: new Map(
      roots.flatMap((node) => {
        const lexical = tree.valueOf(node, "identifier");
        const title = tree.valueOf(node, "title");
        if (lexical === undefined || title === undefined) {
          return [];
        }

        const { lead, token, trail } = piecesOf(lexical);
        const lang = tree.valueOf(node, "xml:lang") ?? "";

        return [
          [
            node.id,
            {
              ...tree.tupleOf(node),
              identifier: token,
              identifierLead: lead,
              identifierLexical: lexical,
              identifierTrail: trail,
              lang,
              langTag: lowerAscii(collapse(lang)),
              title,
              titleValue: replaceWhitespace(title),
            },
          ] as const,
        ];
      }),
    ),
  };
};

/**
 * Build a document's {@link StatisticDate} rows: one per usage statistic that writes a
 * `lastUpdated`, split around its day.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's id.
 */
const dateRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof StatisticDate>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const lexical = statistics.has(node.kind) ? tree.valueOf(node, "lastUpdated") : undefined;
      if (lexical === undefined) {
        return [];
      }

      const { lead, token, trail } = piecesOf(lexical);

      return [[node.id, { day: token, lead, lexical, node: node.id, trail }] as const];
    }),
  );

/**
 * Build a document's {@link UsageValue} rows: one per usage value that writes a `baseType`, its
 * code the handle its lexical form spells (`none` where it spells none, which `E1_derived`
 * refuses) and its text its string value.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's id.
 */
const usageValueRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof UsageValue>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const lexical = node.kind === usageValueKind ? tree.valueOf(node, "baseType") : undefined;
      if (lexical === undefined) {
        return [];
      }

      return [
        [
          node.id,
          {
            baseType: spelledBaseTypes.get(lexical) ?? "none",
            baseTypeLexical: lexical,
            node: node.id,
            text: tree.stringValueOf(node.id),
          },
        ] as const,
      ];
    }),
  );

/**
 * The types of the documents a package's records are read from (`recordDocumentTypes`).
 */
const recordTypes: ReadonlySet<string> = new Set(recordDocumentTypes);

/**
 * The metadata rows of a document that holds no package record: every relation of the records
 * empty.
 */
const noRecordRows = {
  LomEntry: new Map(),
  LomGeneral: new Map(),
  LomRecord: new Map(),
  LomResource: new Map(),
  LomResourceType: new Map(),
  LomResourceTypeSource: new Map(),
  LomString: new Map(),
  LomStringLanguage: new Map(),
  LomTitle: new Map(),
  LomTitleString: new Map(),
  ResourceLomGeneral: new Map(),
} as const satisfies Omit<
  MetadataRows,
  "AssessmentObject" | "ObjectLang" | "StatisticDate" | "UsageValue"
>;

/**
 * Build the metadata rows of one document.
 *
 * A package's records are read from its manifest and its record files alone (`Qti`'s
 * `recordDocumentTypes`): the manifest is its one `imsmanifest.xml` (IMS Content Packaging 1.2),
 * and a `cp:metadata` of another document describes no part of the package (170356bd's ruling), so
 * a document of another type writes no record. In a document of a record type, every `lom:lom`,
 * `lom:general`, `lom:entry`, `lom:title` and `lom:string` has its row, every
 * `cp:resource` its {@link LomResource}, every general category under a resource's `cp:metadata`
 * its {@link ResourceLomGeneral}, every title's string its {@link LomTitleString}, and every
 * learning resource type its {@link LomResourceType} where it holds a value and its
 * {@link LomResourceTypeSource} where it writes a source. In every document, an item's or
 * test's root has its {@link AssessmentObject}, a usage statistic its {@link StatisticDate} where
 * it writes a `lastUpdated`, and a usage value its {@link UsageValue} where it writes a
 * `baseType`; an optional attribute's row exists where it is written.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under, and its type.
 * @returns Every per-document overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: MetadataIds): MetadataRows => {
  const tree = treeOf(doc, ids);
  const assessment = objectRowsOf(tree);
  const everyDocument = {
    AssessmentObject: assessment.objects,
    ObjectLang: assessment.langs,
    StatisticDate: dateRowsOf(tree),
    UsageValue: usageValueRowsOf(tree),
  };
  if (!recordTypes.has(ids.documentType)) {
    return { ...noRecordRows, ...everyDocument };
  }

  const resources = resourceRowsOf(tree);
  const records = recordRowsOf(tree, resources);
  const generals = generalRowsOf(tree, records);
  const titles = titleRowsOf(tree, records);
  const strings = stringRowsOf(tree);

  return {
    ...everyDocument,
    LomEntry: entryRowsOf(tree, records),
    LomGeneral: generals,
    LomRecord: records,
    LomResource: resources,
    LomResourceType: termRowsOf(tree, "lom:value"),
    LomResourceTypeSource: termRowsOf(tree, "lom:source"),
    LomString: strings.strings,
    LomStringLanguage: strings.languages,
    LomTitle: titles,
    LomTitleString: titleStringRowsOf(tree, titles),
    ResourceLomGeneral: new Map(
      [...generals.values()].flatMap(({ node, owner, ownerParent }) =>
        owner === resourceMetadata ? [[node, { node, resource: ownerParent }] as const] : [],
      ),
    ),
  };
};

/**
 * A document of a package as the object rows read it: its node's id, and its root's
 * {@link AssessmentObject} row where it has one.
 */
export interface NamedDocument {
  readonly document: NodeId;
  readonly object: Addition<typeof AssessmentObject> | undefined;
}

/**
 * Decide whether a title string is in an object's language (`lom-title`): the object states no
 * `xml:lang` (an empty one, or one of whitespace alone, states none), the string no `language` (an
 * empty one states none alike), or the two name one tag without regard to case.
 *
 * @param string - The title string.
 * @param object - The object.
 * @returns Whether the string's language is the object's.
 */
const inLanguage = (
  string: Addition<typeof LomTitleString>,
  object: Addition<typeof AssessmentObject> | undefined,
): boolean =>
  object === undefined ||
  object.langTag === "" ||
  string.languageTag === "" ||
  string.languageTag === object.langTag;

/**
 * Build a naming record's {@link LomObjectIdentifier} row: its witness the first general entry of
 * the record, in document order, whose token is the document's identifier, or the first when none
 * is.
 *
 * @param record - The record's node.
 * @param document - The document it names.
 * @param object - The document's assessment object, none when it has none.
 * @param generalEntries - The manifest's general entries.
 * @returns The row, none when the record lists no general entry.
 */
const identifierRowOf = (
  record: NodeId,
  document: NodeId,
  object: Addition<typeof AssessmentObject> | undefined,
  generalEntries: readonly Addition<typeof LomEntry>[],
): Addition<typeof LomObjectIdentifier> | undefined => {
  const entries = generalEntries.filter(({ holderParent }) => holderParent === record);
  const identifier = object?.identifier ?? "";
  const witness = entries.find(({ token }) => token === identifier) ?? entries.at(0);

  return witness === undefined
    ? undefined
    : { document, entry: witness.node, general: witness.holder, identifier, record };
};

/**
 * Build a naming record's {@link LomObjectTitle} row: its witness the first title string of the
 * record, in document order, in the document's language whose text has its title's value (both
 * with their whitespace replaced), or the first string when none is, or the title itself when the
 * record's titles hold no string.
 *
 * @param record - The record's node.
 * @param document - The document it names.
 * @param object - The document's assessment object, none when it has none.
 * @param metadata - The manifest's rows.
 * @returns The row, none when the record has no general title.
 */
const titleRowOf = (
  record: NodeId,
  document: NodeId,
  object: Addition<typeof AssessmentObject> | undefined,
  metadata: MetadataRows,
): Addition<typeof LomObjectTitle> | undefined => {
  const first = [...metadata.LomTitle.values()].find((title) => title.record === record);
  const strings = [...metadata.LomTitleString.values()].filter(
    (string) => string.record === record,
  );
  const title = object?.titleValue ?? "";
  const witness =
    strings.find((string) => string.textValue === title && inLanguage(string, object)) ??
    strings.at(0);

  return first === undefined
    ? undefined
    : {
        document,
        objectLang: object?.langTag ?? "",
        record,
        string: witness?.node ?? first.node,
        stringLanguage: witness?.languageTag ?? "",
        title,
      };
};

/**
 * Build a package's object rows (reading 62): each naming record's {@link LomObject}, the document
 * at its resource's `href`'s path; its {@link LomObjectIdentifier} where it lists a general entry;
 * and its {@link LomObjectTitle} where it has a general title.
 *
 * Each witness is the first, in document order, that names the document (an entry whose token is
 * its identifier; a title string in its language whose text is its title), or the first of its
 * kind when none does, so the law refuses the record. A title with no string has no string to name,
 * so its row names the title itself, which no title string is. A resource whose `href` names no
 * document gets the manifest as its document, which the record's containments refuse. An href's
 * path is the one its `ResourceHref` row compares it by, resolved as the package overlays resolve
 * it (`resourcePathsOf`, readings 102 and 103).
 *
 * @param manifest - The manifest's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @param documents - Each document of the package by its path.
 * @returns The rows, each a keyed set by its record's id.
 */
export const objectRowsOfPackage = (
  manifest: XdmDocument<Composed>,
  ids: MetadataIds,
  documents: ReadonlyMap<string, NamedDocument>,
): ObjectRows => {
  const paths = resourcePathsOf(flatten(manifest, ids.idOf));
  const metadata = rowsOf(manifest, ids);
  const generalEntries = [...metadata.LomEntry.values()].filter(
    ({ holderKind }) => holderKind === "lom:general",
  );
  const named = {
    LomObject: new Map<string, Addition<typeof LomObject>>(),
    LomObjectIdentifier: new Map<string, Addition<typeof LomObjectIdentifier>>(),
    LomObjectTitle: new Map<string, Addition<typeof LomObjectTitle>>(),
  };

  for (const record of metadata.LomRecord.values()) {
    const path = paths.get(record.ownerParent);
    if (record.named === "none" || path === undefined) {
      continue;
    }

    const target = documents.get(path);
    const object = target?.object;
    const document = target?.document ?? record.document;
    named.LomObject.set(record.node, {
      document,
      package: ids.package,
      path,
      record: record.node,
      resource: record.ownerParent,
      type: record.named,
    });

    const identified = identifierRowOf(record.node, document, object, generalEntries);
    if (identified !== undefined) {
      named.LomObjectIdentifier.set(record.node, identified);
    }

    const titled = titleRowOf(record.node, document, object, metadata);
    if (titled !== undefined) {
      named.LomObjectTitle.set(record.node, titled);
    }
  }

  return named;
};
