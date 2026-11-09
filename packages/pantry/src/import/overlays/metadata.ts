/**
 * The metadata overlays' rows (plan §1.7 O6, §C's `rowsOf`): from one document's XDM tree and the
 * ids its nodes are written under, the rows of every per-document relation
 * `#pantry/qti/metadata.ts` declares, each relation's rows a keyed set. Which document a record
 * names is no row's: the database reads it (`#pantry/qti/queries.ts` `namingRecords`).
 *
 * The rows restate what the tree says and nothing else: each overlay copies its nodes' tuples as
 * the tree's rows give them (`flatten` of `#pantry/model/xdm.ts`), and each copied text as written
 * and split around its collapsed value. The database proves every one of them (`metadataLaws`), so
 * a row this
 * builder gets wrong is refused, never accepted. A copied text past `keyText`'s bound is written as
 * it is, and its field's pattern refuses it under the schema's limit law.
 */
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { spelledBaseTypes } from "#pantry/grammar/attributes.ts";
import { collapse } from "#pantry/grammar/domains.ts";
import type { DocumentType } from "#pantry/grammar/install.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import {
  noLanguage,
  objectKinds,
  recordDocumentTypes,
  statisticKinds,
  usageValueKind,
} from "#pantry/qti/metadata.ts";
import type {
  AssessmentObject,
  LomEntry,
  LomGeneral,
  LomRecord,
  LomResourceType,
  LomResourceTypeSource,
  LomString,
  LomStringLanguage,
  LomTitle,
  LomTitleString,
  ObjectIdentifier,
  ObjectLang,
  ObjectTitle,
  StatisticDate,
  UsageBaseType,
  UsageValue,
  UsageValueBaseType,
} from "#pantry/qti/metadata.ts";

/**
 * The ids a document's rows are written under: its package's, and each of its tree's nodes',
 * drawn by the number `flatten` gives the node, in document order from the document node's 0.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface MetadataIds {
  /**
   * The document's context (spec reading 117), which its nodes' nearest interactions are folded
   * under, as every overlay's are (`#pantry/import/fold.ts`).
   */
  readonly context: DocumentContext;
  /**
   * The document's type, `manifest` for the manifest, else the resource's that lists it: a
   * package's records are read from a document of a type of `recordDocumentTypes` alone.
   */
  readonly documentType: (typeof DocumentType.handles)[number];
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
  readonly LomResourceType: ReadonlyMap<string, Addition<typeof LomResourceType>>;
  readonly LomResourceTypeSource: ReadonlyMap<string, Addition<typeof LomResourceTypeSource>>;
  readonly LomString: ReadonlyMap<string, Addition<typeof LomString>>;
  readonly LomStringLanguage: ReadonlyMap<string, Addition<typeof LomStringLanguage>>;
  readonly LomTitle: ReadonlyMap<string, Addition<typeof LomTitle>>;
  readonly LomTitleString: ReadonlyMap<string, Addition<typeof LomTitleString>>;
  readonly ObjectIdentifier: ReadonlyMap<string, Addition<typeof ObjectIdentifier>>;
  readonly ObjectLang: ReadonlyMap<string, Addition<typeof ObjectLang>>;
  readonly ObjectTitle: ReadonlyMap<string, Addition<typeof ObjectTitle>>;
  readonly StatisticDate: ReadonlyMap<string, Addition<typeof StatisticDate>>;
  readonly UsageBaseType: ReadonlyMap<string, Addition<typeof UsageBaseType>>;
  readonly UsageValue: ReadonlyMap<string, Addition<typeof UsageValue>>;
  readonly UsageValueBaseType: ReadonlyMap<string, Addition<typeof UsageValueBaseType>>;
}

/**
 * The kinds of an assessment object's root, as a set.
 */
const objects: ReadonlySet<string> = new Set(objectKinds);

/**
 * The usage statistics, as a set.
 */
const statistics: ReadonlySet<string> = new Set(statisticKinds);

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
 * One character of XML whitespace `S`: a tab, a line feed, a carriage return or a space.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
type SpaceCharacter = "\t" | "\n" | "\r" | " ";

/**
 * Decide whether a character is XML whitespace.
 *
 * @param character - The character.
 * @returns Whether it is one of {@link SpaceCharacter}'s four.
 */
const isSpaceCharacter = (character: string): character is SpaceCharacter =>
  character === "\t" || character === "\n" || character === "\r" || character === " ";

/**
 * Read the XML whitespace a text starts with, built a character at a time so its type is
 * {@link Space} by construction.
 *
 * @param text - The text.
 * @returns The longest prefix of whitespace, the empty text where the text starts with none.
 */
const leadOf = (text: string): Space => {
  let lead: Space = "";
  for (const character of text) {
    if (!isSpaceCharacter(character)) {
      break;
    }

    lead = `${lead}${character}`;
  }

  return lead;
};

/**
 * Read the XML whitespace a text ends with, built a character at a time from the end so its type
 * is {@link Space} by construction.
 *
 * @param text - The text.
 * @returns The longest suffix of whitespace, the empty text where the text ends with none.
 */
const trailOf = (text: string): Space => {
  let trail: Space = "";
  for (let at = text.length - 1; at >= 0; at -= 1) {
    const character = text.charAt(at);
    if (!isSpaceCharacter(character)) {
      break;
    }

    trail = `${character}${trail}`;
  }

  return trail;
};

/**
 * Split a text around its value, as the overlays' `lead ‖ token ‖ trail` holds it: the whitespace
 * `S` before the first character that is not whitespace, then up to and including the last one,
 * then the rest. An all-whitespace text is all lead. Every overlay that splits a text around its
 * value splits it here (`#pantry/import/overlays/identity.ts` reads an ID's form and each IDREF
 * token through it).
 *
 * @param text - The text.
 * @returns Its pieces, which concatenate to it.
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
export const piecesOf = (text: string): Pieces => {
  const lead = leadOf(text);
  const rest = text.slice(lead.length);
  const trail = trailOf(rest);

  return { lead, token: rest.slice(0, rest.length - trail.length), trail };
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
 * Fold a text's ASCII capitals to small letters, as `Compute.lowerAscii` does, every other
 * character as it is: a BCP 47 tag's case (RFC 5646 §2.1.1).
 *
 * @param text - The text.
 * @returns The folded text.
 */
export const lowerAscii = (text: string): string =>
  text.replaceAll(/[A-Z]/gu, (capital) => capital.toLowerCase());

/**
 * The string value of a node with no character child: the empty text, the concatenation of no
 * characters (`Node.stringValue`, "the empty string when it holds none", `#pantry/model/folds.ts`;
 * XDM 3.1 gives an element with no text descendants "the zero-length string").
 *
 * @see {@link https://www.w3.org/TR/xpath-datamodel-31/#dm-string-value | XDM 3.1, dm:string-value}
 */
const noCharacters = "";

/**
 * Compute each node's string value as `Node.stringValue` folds it for the kinds an overlay copies:
 * its children's characters in order, a text's and whitespace's as they are, an entity reference's
 * as `&name;`, an element's, a comment's and an instruction's none. Every overlay that copies a
 * node's string value reads it here (`#pantry/import/overlays/identity.ts` too).
 *
 * @param rows - The document's flat rows.
 * @returns Each node's string value, by its id: {@link noCharacters} for a node with no character
 *   child.
 */
export const stringValuesOf = (rows: FlatRows<Composed>): ((node: NodeId) => string) => {
  const chars = new Map<NodeId, string>([
    ...rows.texts.map(({ node, value }) => [node, value] as const),
    ...rows.whitespace.map(({ node, value }) => [node, value] as const),
    ...rows.entityRefs.map(({ name, node }) => [node, `&${name};`] as const),
  ]);
  const held = rows.nodes.flatMap(({ id, parent }) => {
    const value = chars.get(id);

    return value === undefined ? [] : [{ parent, value }];
  });
  const values = new Map(
    [...Map.groupBy(held, ({ parent }) => parent)].map(([parent, children]) => [
      parent,
      children.map(({ value }) => value).join(""),
    ]),
  );

  return (node) => values.get(node) ?? noCharacters;
};

/**
 * A document's tree as the builders read it: its flat rows, each node by its id, each element's
 * attributes and string value, and each node's {@link nodeRef}-shaped tuple.
 */
interface Tree {
  readonly document: NodeId;
  readonly nodes: readonly NodeRow<Composed>[];
  /**
   * Read a node's parent, which `flatten` writes before it; the document node is its own.
   */
  readonly parentOf: (node: NodeRow<Composed>) => NodeRow<Composed>;
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
  const lexicals = new Map<string, string>(
    rows.attributes.map(({ lexical, name, node }) => [`${node} ${name}`, lexical]),
  );
  const folds = foldOf(rows.nodes, ids.context);
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const document = rows.document.node;

  return {
    document,
    nodes: rows.nodes,
    parentOf: (node) => {
      const parent = byId.get(node.parent);
      if (parent === undefined) {
        throw new Error(
          `Node ${node.id} names parent ${node.parent}, which the document holds no row of, but flatten writes every node's parent before it. Read the rows flatten writes as it writes them.`,
        );
      }

      return parent;
    },
    stringValueOf: stringValuesOf(rows),
    tupleOf: (node) => ({
      document,
      kind: node.kind,
      nearest: foldAt(folds, node.id).nearest,
      node: node.id,
      parent: node.parent,
      start: node.start,
      version: node.version,
    }),
    valueOf: (node, name) => lexicals.get(`${node.id} ${name}`),
  };
};

/**
 * Build a document's {@link LomRecord} rows: one per `lom:lom`, with its owner's kind, start and
 * parent.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's id.
 */
const recordRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof LomRecord>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      if (node.kind !== "lom:lom") {
        return [];
      }

      const owner = tree.parentOf(node);

      return [
        [
          node.id,
          {
            ...tree.tupleOf(node),
            owner: owner.kind,
            ownerParent: owner.parent,
            ownerStart: owner.start,
          },
        ] as const,
      ];
    }),
  );

/**
 * Build a document's {@link LomGeneral} rows: one per `lom:general`, its node's tuple.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's id.
 */
const generalRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof LomGeneral>> =>
  new Map(
    tree.nodes.flatMap((node) =>
      node.kind === "lom:general" ? [[node.id, tree.tupleOf(node)] as const] : [],
    ),
  );

/**
 * Build a document's {@link LomEntry} rows: one per `lom:entry`, with its identifier's kind, start
 * and parent (the holder) and its string value in pieces.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's id.
 */
const entryRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof LomEntry>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      if (node.kind !== "lom:entry") {
        return [];
      }

      const identifier = tree.parentOf(node);
      const text = tree.stringValueOf(node.id);

      return [
        [
          node.id,
          {
            ...tree.tupleOf(node),
            ...piecesOf(text),
            holder: identifier.parent,
            identifierKind: identifier.kind,
            identifierStart: identifier.start,
            text,
          },
        ] as const,
      ];
    }),
  );

/**
 * Build a document's {@link LomTitle} rows: one per `lom:title`, its node's tuple.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's id.
 */
const titleRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof LomTitle>> =>
  new Map(
    tree.nodes.flatMap((node) =>
      node.kind === "lom:title" ? [[node.id, tree.tupleOf(node)] as const] : [],
    ),
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
 * Read a `lom:string`'s language as `lom-title` compares it: its `language` case-folded, or
 * {@link noLanguage} where it writes none.
 *
 * @param tree - The document's tree.
 * @param node - The `lom:string`.
 * @returns The compared language.
 */
const languageTagOf = (tree: Tree, node: NodeRow<Composed>): string =>
  Option.match(Option.fromUndefinedOr(tree.valueOf(node, "language")), {
    onNone: () => noLanguage,
    onSome: lowerAscii,
  });

/**
 * Build a document's {@link LomString} and {@link LomStringLanguage} rows: one per `lom:string`,
 * with its compared language, and its `language` where it writes one.
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

        return language === undefined
          ? []
          : [[node.id, { language, languageTag: lowerAscii(language), node: node.id }] as const];
      }),
    ),
    strings: new Map(
      strings.map(
        (node) => [node.id, { languageTag: languageTagOf(tree, node), node: node.id }] as const,
      ),
    ),
  };
};

/**
 * Build a document's {@link LomTitleString} rows: one per `lom:string` of a title, with its string
 * value, and that value as `lom-title` compares it, its whitespace replaced.
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
      if (node.kind !== "lom:string" || !titles.has(node.parent)) {
        return [];
      }

      const text = tree.stringValueOf(node.id);

      return [
        [node.id, { ...tree.tupleOf(node), text, textValue: replaceWhitespace(text) }] as const,
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
      tree.parentOf(node).kind === "lom:learningResourceType" &&
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
 * Read an `xml:lang` as `lom-title` compares it: its value collapsed (an `xs:language`) and
 * case-folded (`Compute.lowerAscii`).
 *
 * @param lang - The attribute's lexical form.
 * @returns The compared language.
 */
const langTagOf = (lang: string): string => lowerAscii(collapse(lang));

/**
 * A document's root rows, each by its node's id: an item's or test's {@link AssessmentObject}, and
 * its {@link ObjectIdentifier}, {@link ObjectTitle} and {@link ObjectLang} where it writes the
 * attribute.
 */
type RootRows = Pick<
  MetadataRows,
  "AssessmentObject" | "ObjectIdentifier" | "ObjectLang" | "ObjectTitle"
>;

/**
 * Build a document's {@link AssessmentObject}, {@link ObjectIdentifier}, {@link ObjectTitle} and
 * {@link ObjectLang} rows: one {@link AssessmentObject} per item's or test's root, whatever it
 * writes, its node's tuple; and each attribute's own row where it is written: its `identifier`
 * split around its collapsed value, its `title` as written and with its whitespace replaced, and
 * its `xml:lang` as written and collapsed and case-folded. A root that writes no `identifier` or
 * `title` has no row of it, which AL3 refuses.
 *
 * @param tree - The document's tree.
 * @param document - The document's node.
 * @returns The rows, each by its node's id.
 */
const objectRowsOf = (tree: Tree, document: NodeId): RootRows => {
  const roots = tree.nodes.filter(({ kind }) => objects.has(kind));

  return {
    AssessmentObject: new Map(roots.map((node) => [node.id, tree.tupleOf(node)] as const)),
    ObjectIdentifier: new Map(
      roots.flatMap((node) => {
        const lexical = tree.valueOf(node, "identifier");
        if (lexical === undefined) {
          return [];
        }

        const { lead, token, trail } = piecesOf(lexical);

        return [[node.id, { document, identifier: token, lead, lexical, node: node.id, trail }]];
      }),
    ),
    ObjectLang: new Map(
      roots.flatMap((node) => {
        const lang = tree.valueOf(node, "xml:lang");

        return lang === undefined
          ? []
          : [[node.id, { lang, langTag: langTagOf(lang), node: node.id }] as const];
      }),
    ),
    ObjectTitle: new Map(
      roots.flatMap((node) => {
        const title = tree.valueOf(node, "title");

        return title === undefined
          ? []
          : [[node.id, { document, node: node.id, title, titleValue: replaceWhitespace(title) }]];
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
 * Build a document's {@link UsageBaseType} rows: one per usage value that writes a `baseType`,
 * whether or not it writes a `fieldIdentifier`, its lexical form as written.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's id.
 */
const usageBaseTypeRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof UsageBaseType>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const lexical = node.kind === usageValueKind ? tree.valueOf(node, "baseType") : undefined;

      return lexical === undefined ? [] : [[node.id, { lexical, node: node.id }] as const];
    }),
  );

/**
 * Build a document's {@link UsageValue} rows: one per usage value that forms part of a record, that
 * is, writes a `fieldIdentifier` and a `baseType` (spec reading 105), its `baseType` as written and
 * its text its string value. A `baseType` outside a record states no base type, so its value has no
 * row.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's id.
 */
const usageValueRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof UsageValue>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const lexical = node.kind === usageValueKind ? tree.valueOf(node, "baseType") : undefined;
      if (lexical === undefined || tree.valueOf(node, "fieldIdentifier") === undefined) {
        return [];
      }

      return [
        [
          node.id,
          { baseTypeLexical: lexical, node: node.id, text: tree.stringValueOf(node.id) },
        ] as const,
      ];
    }),
  );

/**
 * Build a document's {@link UsageValueBaseType} rows: one per {@link UsageValue} row whose
 * `baseType` spells a code, as written (`spelledBaseTypes`), that code beside its lexical form and
 * text. A `baseType` that spells none has no row, and its value domain refuses it alone (decision
 * 427).
 *
 * @param values - The document's usage value rows.
 * @returns The rows, by their node's id.
 */
const usageValueBaseTypeRowsOf = (
  values: ReadonlyMap<string, Addition<typeof UsageValue>>,
): ReadonlyMap<string, Addition<typeof UsageValueBaseType>> =>
  new Map(
    [...values].flatMap(([id, value]) =>
      spelledBaseTypes.has(value.baseTypeLexical)
        ? [[id, { ...value, baseType: value.baseTypeLexical }] as const]
        : [],
    ),
  );

/**
 * The types of the documents a package's records are read from (`recordDocumentTypes`).
 */
const recordTypes: ReadonlySet<string> = new Set(recordDocumentTypes);

/**
 * The manifest's type, the one document whose `cp:resource`s are the package's resources: a
 * {@link LomResource} is the node of a `Resource`, which the manifest alone writes
 * (`#pantry/import/overlays/package.ts`'s `noPackageRows`), so a `cp:resource` of a record file
 * whose root is a `cp:manifest` names no resource of the package.
 */
const manifestType = "none" satisfies (typeof ResourceType.handles)[number];

/**
 * The metadata rows of a document that holds no package record: every relation of the records
 * empty.
 */
const noRecordRows = {
  LomEntry: new Map(),
  LomGeneral: new Map(),
  LomRecord: new Map(),
  LomResourceType: new Map(),
  LomResourceTypeSource: new Map(),
  LomString: new Map(),
  LomStringLanguage: new Map(),
  LomTitle: new Map(),
  LomTitleString: new Map(),
} as const satisfies Omit<
  MetadataRows,
  | "AssessmentObject"
  | "ObjectIdentifier"
  | "ObjectLang"
  | "ObjectTitle"
  | "StatisticDate"
  | "UsageBaseType"
  | "UsageValue"
  | "UsageValueBaseType"
>;

/**
 * Build the metadata rows of one document.
 *
 * A package's records are read from its manifest and its record files alone (`Qti`'s
 * `recordDocumentTypes`): the manifest is its one `imsmanifest.xml` (IMS Content Packaging 1.2),
 * and a `cp:metadata` of another document describes no part of the package (170356bd's ruling), so
 * a document of another type writes no record. In a document of a record type, every `lom:lom`,
 * `lom:general`, `lom:entry`, `lom:title` and `lom:string` has its row, every title's string its
 * {@link LomTitleString}, and every
 * learning resource type its {@link LomResourceType} where it holds a value and its
 * {@link LomResourceTypeSource} where it writes a source. In every document, an item's or
 * test's root has its {@link AssessmentObject}, a usage statistic its {@link StatisticDate} where
 * it writes a `lastUpdated`, and a usage value its {@link UsageBaseType} where it writes a
 * `baseType`, its {@link UsageValue} where it also writes a `fieldIdentifier`, and its
 * {@link UsageValueBaseType} where that `baseType` spells a code; an optional
 * attribute's row exists where it is written.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under, and its type.
 * @returns Every per-document overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: MetadataIds): MetadataRows => {
  const tree = treeOf(doc, ids);
  const usageValues = usageValueRowsOf(tree);
  const everyDocument = {
    ...objectRowsOf(tree, tree.document),
    StatisticDate: dateRowsOf(tree),
    UsageBaseType: usageBaseTypeRowsOf(tree),
    UsageValue: usageValues,
    UsageValueBaseType: usageValueBaseTypeRowsOf(usageValues),
  };
  if (!recordTypes.has(ids.documentType)) {
    return { ...noRecordRows, ...everyDocument };
  }

  const titles = titleRowsOf(tree);
  const strings = stringRowsOf(tree);

  return {
    ...everyDocument,
    LomEntry: entryRowsOf(tree),
    LomGeneral: generalRowsOf(tree),
    LomRecord: recordRowsOf(tree),
    LomResourceType: termRowsOf(tree, "lom:value"),
    LomResourceTypeSource: termRowsOf(tree, "lom:source"),
    LomString: strings.strings,
    LomStringLanguage: strings.languages,
    LomTitle: titles,
    LomTitleString: titleStringRowsOf(tree, titles),
  };
};
