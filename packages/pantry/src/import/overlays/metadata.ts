/**
 * The metadata overlays' rows (plan §1.7 O6, §C's `rowsOf`): from one document's view
 * (`DocumentView` of `#pantry/import/fold.ts`), the rows of every per-document relation
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
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { spelledBaseTypes } from "#pantry/grammar/attributes.ts";
import type { DocumentType } from "#pantry/grammar/install.ts";
import { foldAt } from "#pantry/import/fold.ts";
import type { DocumentView } from "#pantry/import/fold.ts";
import { piecesOf } from "#pantry/import/pieces.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeRow } from "#pantry/model/xdm.ts";
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
import {
  noLanguage,
  objectKinds,
  recordDocumentTypes,
  statisticKinds,
  usageValueKind,
} from "#pantry/vocab/terms/metadata.ts";

/**
 * Where a document stands in its package, as this builder reads it: the part of the importer's
 * `DocumentPlace` (Q5.15) it needs beside the document's view.
 */
export interface MetadataIds {
  /**
   * The document's type, `manifest` for the manifest, else the resource's that lists it: a
   * package's records are read from a document of a type of `recordDocumentTypes` alone.
   */
  readonly documentType: (typeof DocumentType.handles)[number];
  /**
   * The package's manifest identifier, which every row holds as `package`.
   */
  readonly package: string;
  /**
   * The document's path in the package, which every row holds as `path`.
   */
  readonly path: string;
}

/**
 * A document's metadata rows, one keyed set per relation: each map from the text of a row's key,
 * its node's `(package, path, start)` ({@link keyTextOf}), to the row as its writer writes it.
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
 * @returns Each node's string value, by its `start`: {@link noCharacters} for a node with no
 *   character child.
 */
export const stringValuesOf = (rows: FlatRows<Composed>): ((start: bigint) => string) => {
  const chars = new Map<bigint, string>([
    ...rows.texts.map(({ start, value }) => [start, value] as const),
    ...rows.whitespace.map(({ start, value }) => [start, value] as const),
    ...rows.entityRefs.map(({ name, start }) => [start, `&${name};`] as const),
  ]);
  const held = rows.nodes.flatMap(({ parent, start }) => {
    const value = chars.get(start);

    return value === undefined ? [] : [{ parent, value }];
  });
  const values = new Map(
    [...Map.groupBy(held, ({ parent }) => parent)].map(([parent, children]) => [
      parent,
      children.map(({ value }) => value).join(""),
    ]),
  );

  return (start) => values.get(start) ?? noCharacters;
};

/**
 * The text of a row's key in its relation's keyed set: its node's `(package, path, start)` as a
 * JSON array, so the rows of two documents never meet at one key.
 *
 * @param ids - The document's place.
 * @param start - The node's `start`.
 * @returns The key text.
 */
const keyTextOf = (ids: MetadataIds, start: bigint): string =>
  JSON.stringify([ids.package, ids.path, String(start)]);

/**
 * A document's node as every row of it holds it first: its key, `(package, path, start)`.
 */
interface NodeKey {
  readonly package: string;
  readonly path: string;
  readonly start: bigint;
}

/**
 * A document's tree as the builders read it: its flat rows, each node by its `start`, each
 * element's attributes and string value, and each node's {@link nodeRef}-shaped tuple.
 */
interface Tree {
  /**
   * Key a node's row: the node's key, and the text of that key in a keyed set.
   */
  readonly keyOf: (node: NodeRow<Composed>) => readonly [string, NodeKey];
  readonly nodes: readonly NodeRow<Composed>[];
  /**
   * Read a node's parent, which `flatten` writes before it; the document node is its own.
   */
  readonly parentOf: (node: NodeRow<Composed>) => NodeRow<Composed>;
  readonly stringValueOf: (start: bigint) => string;
  readonly tupleOf: (node: NodeRow<Composed>) => NodeKey & {
    readonly kind: NodeRow<Composed>["kind"];
    readonly nearest: bigint;
    readonly parent: bigint;
    readonly version: NodeRow<Composed>["version"];
  };
  readonly valueOf: (node: NodeRow<Composed>, name: string) => string | undefined;
}

/**
 * Read a document's view once, as every builder below reads it.
 *
 * @param view - The document's view: its rows, and their folds under its context (spec reading
 *   117), which its nodes' nearest interactions are folded under.
 * @param ids - Where the document stands in its package, the key every row holds.
 * @returns The tree's rows and lookups.
 */
const treeOf = (view: DocumentView, ids: MetadataIds): Tree => {
  const { folds, rows } = view;
  const lexicals = new Map<string, string>(
    rows.attributes.map(({ lexical, name, start }) => [`${start} ${name}`, lexical]),
  );
  const byStart = new Map(rows.nodes.map((node) => [node.start, node] as const));
  const keyOf = (node: NodeRow<Composed>): readonly [string, NodeKey] => [
    keyTextOf(ids, node.start),
    { package: ids.package, path: ids.path, start: node.start },
  ];

  return {
    keyOf,
    nodes: rows.nodes,
    parentOf: (node) => {
      const parent = byStart.get(node.parent);
      if (parent === undefined) {
        throw new Error(
          `Node ${node.start} names parent ${node.parent}, which the document holds no row of, but flatten writes every node's parent before it. Read the rows flatten writes as it writes them.`,
        );
      }

      return parent;
    },
    stringValueOf: stringValuesOf(rows),
    tupleOf: (node) => ({
      ...keyOf(node)[1],
      kind: node.kind,
      nearest: foldAt(folds, node.start).nearest,
      parent: node.parent,
      version: node.version,
    }),
    valueOf: (node, name) => lexicals.get(`${node.start} ${name}`),
  };
};

/**
 * Build a document's {@link LomRecord} rows: one per `lom:lom`, with its owner's kind and parent.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's key.
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
          tree.keyOf(node)[0],
          { ...tree.tupleOf(node), owner: owner.kind, ownerParent: owner.parent },
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
      node.kind === "lom:general" ? [[tree.keyOf(node)[0], tree.tupleOf(node)] as const] : [],
    ),
  );

/**
 * Build a document's {@link LomEntry} rows: one per `lom:entry`, with its identifier's kind and
 * parent (the holder) and its string value in pieces.
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
      const text = tree.stringValueOf(node.start);
      const { lead, trail, value } = piecesOf(text);

      return [
        [
          tree.keyOf(node)[0],
          {
            ...tree.tupleOf(node),
            holder: identifier.parent,
            identifierKind: identifier.kind,
            lead,
            text,
            token: value,
            trail,
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
      node.kind === "lom:title" ? [[tree.keyOf(node)[0], tree.tupleOf(node)] as const] : [],
    ),
  );

/**
 * A document's string rows: each `lom:string`'s {@link LomString}, and its {@link LomStringLanguage}
 * where it writes a `language`, each by its node's key.
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
        const [text, key] = tree.keyOf(node);

        return language === undefined ? [] : [[text, { ...key, language }] as const];
      }),
    ),
    strings: new Map(
      strings.map((node) => {
        const [text, key] = tree.keyOf(node);

        return [text, { ...key, languageTag: languageTagOf(tree, node) }] as const;
      }),
    ),
  };
};

/**
 * Build a document's {@link LomTitleString} rows: one per `lom:string` of a title, with its string
 * value, and that value as `lom-title` compares it, its whitespace replaced.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's key.
 */
const titleStringRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof LomTitleString>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      if (node.kind !== "lom:string" || tree.parentOf(node).kind !== "lom:title") {
        return [];
      }

      const text = tree.stringValueOf(node.start);

      return [[tree.keyOf(node)[0], { ...tree.tupleOf(node), text }] as const];
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
 * @returns The rows, by the type's node's key.
 */
const termRowsOf = (tree: Tree, kind: "lom:source" | "lom:value"): ReadonlyMap<string, TermRow> => {
  const rows = new Map<string, TermRow>();

  for (const node of tree.nodes.filter((term) => term.kind === kind)) {
    const type = tree.parentOf(node);
    const [text, key] = tree.keyOf(type);
    if (type.kind === "lom:learningResourceType" && !rows.has(text)) {
      rows.set(text, { ...key, term: node.start, text: tree.stringValueOf(node.start) });
    }
  }

  return rows;
};

/**
 * A document's root rows, each by its node's key: an item's or test's {@link AssessmentObject}, and
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
 * @returns The rows, each by its node's key.
 */
const objectRowsOf = (tree: Tree): RootRows => {
  const roots = tree.nodes.filter(({ kind }) => objects.has(kind));

  return {
    AssessmentObject: new Map(
      roots.map((node) => [tree.keyOf(node)[0], tree.tupleOf(node)] as const),
    ),
    ObjectIdentifier: new Map(
      roots.flatMap((node) => {
        const lexical = tree.valueOf(node, "identifier");
        if (lexical === undefined) {
          return [];
        }

        const { lead, trail, value } = piecesOf(lexical);
        const [text, key] = tree.keyOf(node);

        return [[text, { ...key, identifier: value, lead, lexical, trail }] as const];
      }),
    ),
    ObjectLang: new Map(
      roots.flatMap((node) => {
        const lang = tree.valueOf(node, "xml:lang");
        const [text, key] = tree.keyOf(node);

        return lang === undefined ? [] : [[text, { ...key, lang }] as const];
      }),
    ),
    ObjectTitle: new Map(
      roots.flatMap((node) => {
        const title = tree.valueOf(node, "title");
        const [text, key] = tree.keyOf(node);

        return title === undefined ? [] : [[text, { ...key, title }] as const];
      }),
    ),
  };
};

/**
 * Build a document's {@link StatisticDate} rows: one per usage statistic that writes a
 * `lastUpdated`, split around its day.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's key.
 */
const dateRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof StatisticDate>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const lexical = statistics.has(node.kind) ? tree.valueOf(node, "lastUpdated") : undefined;
      if (lexical === undefined) {
        return [];
      }

      const { lead, trail, value } = piecesOf(lexical);
      const [text, key] = tree.keyOf(node);

      return [[text, { ...key, day: value, lead, lexical, trail }] as const];
    }),
  );

/**
 * Build a document's {@link UsageBaseType} rows: one per usage value that writes a `baseType`,
 * whether or not it writes a `fieldIdentifier`, its lexical form as written.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's key.
 */
const usageBaseTypeRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof UsageBaseType>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const lexical = node.kind === usageValueKind ? tree.valueOf(node, "baseType") : undefined;
      if (lexical === undefined) {
        return [];
      }

      const [text, key] = tree.keyOf(node);

      return [[text, { ...key, lexical }] as const];
    }),
  );

/**
 * Build a document's {@link UsageValue} rows: one per usage value that forms part of a record, that
 * is, writes a `fieldIdentifier` and a `baseType` (spec reading 105), its `baseType` as written and
 * its text its string value. A `baseType` outside a record states no base type, so its value has no
 * row.
 *
 * @param tree - The document's tree.
 * @returns The rows, by their node's key.
 */
const usageValueRowsOf = (tree: Tree): ReadonlyMap<string, Addition<typeof UsageValue>> =>
  new Map(
    tree.nodes.flatMap((node) => {
      const lexical = node.kind === usageValueKind ? tree.valueOf(node, "baseType") : undefined;
      if (lexical === undefined || tree.valueOf(node, "fieldIdentifier") === undefined) {
        return [];
      }

      const [text, key] = tree.keyOf(node);

      return [
        [text, { ...key, baseTypeLexical: lexical, text: tree.stringValueOf(node.start) }] as const,
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
 * @returns The rows, by their node's key.
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
 * @param view - The document's view.
 * @param ids - Where it stands in its package: its package, its path and its type.
 * @returns Every per-document overlay's rows.
 */
export const rowsOf = (view: DocumentView, ids: MetadataIds): MetadataRows => {
  const tree = treeOf(view, ids);
  const usageValues = usageValueRowsOf(tree);
  const everyDocument = {
    ...objectRowsOf(tree),
    StatisticDate: dateRowsOf(tree),
    UsageBaseType: usageBaseTypeRowsOf(tree),
    UsageValue: usageValues,
    UsageValueBaseType: usageValueBaseTypeRowsOf(usageValues),
  };
  if (!recordTypes.has(ids.documentType)) {
    return { ...noRecordRows, ...everyDocument };
  }

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
    LomTitle: titleRowsOf(tree),
    LomTitleString: titleStringRowsOf(tree),
  };
};
