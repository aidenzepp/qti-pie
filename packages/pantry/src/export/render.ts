/**
 * The render half of export: the rows of one tree back to the XML tree they were imported from,
 * with no database in between.
 *
 * Every attribute comes from the column or optional-value row that holds it, written under the
 * name the kind's registry gives it. A typed copy of a value is never read: an element's text is
 * its text children, the `<attribute>N` columns and the owner and version copies are never
 * rendered, and an attribute whose node has an `AttributeLexical` row is written with that row's
 * value, because the typed column holds the collapsed or replaced form. Where the node has an
 * `AttributeSpelling` row instead, the attribute is written with the spelling, because the typed
 * integer holds only the value; with both, the lexical row wins (spec 4.6: lexical, else spelling,
 * else the canonical rendering).
 *
 * Attributes are placed in the order the module reads them: namespace declarations, the `xsi`
 * attributes (`schemaLocation`, `type`, `nil`, `noNamespaceSchemaLocation`), the kind's own
 * attributes in the order of `ownAttributes`, then the families, `id`, `role` and ARIA. The order
 * the source wrote them in is not stored, and it need not be: canonical XML sorts attributes, so
 * canonical equality holds whatever this order is.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { Option } from "effect";
import type { Rows as RowSet } from "#pantry/import/tree.ts";
import { Rows } from "#pantry/import/tree.ts";
import {
  by,
  foreignAttributesOf,
  indexOf,
  readersFor,
  xsiTypeAttributesOf,
} from "#pantry/schema/attribute-homes.ts";
import { ForeignElement } from "#pantry/schema/foreign.ts";
import type { RegistryRow } from "#pantry/schema/kinds/generic.ts";
import {
  AttributeEntityReference,
  AttributeLexical,
  AttributeSpelling,
  Comment as CommentRow,
  Edge,
  EntityReference,
  NamespaceDeclaration,
  Node,
  NoNamespaceSchemaLocation,
  Pi as PiRow,
  SchemaLocation,
  TextNode,
  Tree,
  TreeDoctype,
  TreeMisc,
  TreeRoot,
  TreeXmlEncoding,
  TreeXmlStandalone,
  TreeXmlVersion,
  vocabularies,
  Ws,
  XsiNil,
  XsiType,
} from "#pantry/schema/node.ts";
import type { Attribute, Child, Misc, XmlDocument } from "@qti-pie/crust/tree.ts";

const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

const xlinkNamespace = "http://www.w3.org/1999/xlink";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * The namespace prefixes in scope at a node, each bound to the URI it stands for there.
 */
type Scope = ReadonlyMap<string, string>;

/**
 * The prefix in scope for the XLink namespace, the nearest binding winning: the typed `xlink:`
 * relations store no prefix, and a source may bind XLink to another one. A source that wrote an
 * XLink attribute bound it, so `xlink` is only the answer for rows no source wrote.
 */
const xlinkPrefixIn = (scope: Scope): string =>
  [...scope].findLast(([prefix, uri]) => prefix !== "" && uri === xlinkNamespace)?.[0] ?? "xlink";

/**
 * The registry rows that name an element, by kind; the generic kinds are not elements and are left
 * out.
 */
const elementRows = vocabularies
  .flatMap((vocabulary) => Object.entries<RegistryRow>(vocabulary.registry))
  .filter(([, row]) => row.local !== "");

/**
 * The XML name and namespace of each element kind, from the registries.
 *
 * A kind named by two registries would let the later row replace the earlier, so building the map
 * refuses one.
 */
export const renderRegistry: ReadonlyMap<string, RegistryRow> = new Map(elementRows);

if (renderRegistry.size !== elementRows.length) {
  throw new Error("Two vocabulary registries name the same element kind.");
}

/**
 * The attribute `name` with `value`: `xml:*` names are in the XML namespace, `xlink:*` names in the
 * XLink namespace under `xlinkPrefix`, and every other name in none.
 */
const attributeOf = (
  name: string,
  value: string,
  references: Attribute["references"],
  xlinkPrefix: string,
): Attribute => {
  if (name.startsWith("xml:")) {
    return {
      local: name.slice("xml:".length),
      namespace: xmlNamespace,
      prefix: "xml",
      qname: name,
      references,
      value,
    };
  }

  if (name.startsWith("xlink:")) {
    const local = name.slice("xlink:".length);

    return {
      local,
      namespace: xlinkNamespace,
      prefix: xlinkPrefix,
      qname: `${xlinkPrefix}:${local}`,
      references,
      value,
    };
  }

  return { local: name, namespace: "", prefix: "", qname: name, references, value };
};

/**
 * A comment or processing instruction of the prolog or epilog from its `TreeMisc` text: a
 * processing instruction's text is its target alone, or its target, one space and its data.
 */
const miscOf = (row: { readonly kind: "comment" | "pi"; readonly text: string }): Misc => {
  if (row.kind === "comment") {
    return { kind: "comment", text: row.text };
  }

  const space = row.text.indexOf(" ");

  return space === -1
    ? { data: "", kind: "pi", target: row.text }
    : { data: row.text.slice(space + 1), kind: "pi", target: row.text.slice(0, space) };
};

/**
 * The rows of a tree are missing a row its structure names; the importer writes it and the reader
 * returns it, so rows that lack it were not read from a database that holds this tree.
 */
const missing = (what: string, id: string): never => {
  throw new Error(
    `The rows hold no ${what} for ${id}. Render the rows of a tree the importer wrote or the reader returned whole.`,
  );
};

/**
 * Render the tree `treeId` of `rows` back to the XML document it was imported from.
 *
 * The document is the one `readXml` gave the importer, except that an element's text keeps no CDATA
 * form and the whitespace between tags is the `Ws` rows'. Rendering reads rows only, so a document
 * round-trips through memory exactly as it will through the database.
 *
 * @param rows - The rows of the tree, `Rows` as the importer builds them and the reader returns
 *   them; rows of other trees may be present and are ignored.
 * @param treeId - The id of the tree to render, which is its root node's id.
 * @returns The document: its charset, declaration, doctype, prolog, root element and epilog. Throws
 *   when the rows lack the tree's `Tree` row, its root, or a row an edge or a node names.
 */
export const renderTree = (rows: RowSet, treeId: Uuid): XmlDocument => {
  const tree = Rows.of(rows, Tree).find((row) => row.id === treeId) ?? missing("Tree row", treeId);
  const rootId = Rows.of(rows, TreeRoot).find((row) => row.tree === treeId)?.node;
  const nodes = by(Rows.of(rows, Node), (row) => row.id);
  const children = Map.groupBy(Rows.of(rows, Edge), (edge) => edge.parent);
  const texts = by(Rows.of(rows, TextNode), (row) => row.id);
  const whitespace = by(Rows.of(rows, Ws), (row) => row.id);
  const comments = by(Rows.of(rows, CommentRow), (row) => row.id);
  const instructions = by(Rows.of(rows, PiRow), (row) => row.id);
  const entities = by(Rows.of(rows, EntityReference), (row) => row.id);
  const declarations = Map.groupBy(Rows.of(rows, NamespaceDeclaration), (row) => row.node);
  const foreignElements = by(Rows.of(rows, ForeignElement), (row) => row.id);
  const xsiRows = [
    ["schemaLocation", by(Rows.of(rows, SchemaLocation), (row) => row.node)],
    ["type", by(Rows.of(rows, XsiType), (row) => row.node)],
    ["nil", by(Rows.of(rows, XsiNil), (row) => row.node)],
    ["noNamespaceSchemaLocation", by(Rows.of(rows, NoNamespaceSchemaLocation), (row) => row.node)],
  ] as const;
  const lexical = Map.groupBy(Rows.of(rows, AttributeLexical), (row) => row.node);
  const spelling = Map.groupBy(Rows.of(rows, AttributeSpelling), (row) => row.node);
  const references = Map.groupBy(
    Rows.of(rows, AttributeEntityReference),
    (row) => `${row.node}\n${row.attribute}`,
  );
  const index = indexOf(rows);
  const readersOf = readersFor(index);
  const foreignOf = foreignAttributesOf(index);
  const addedOf = xsiTypeAttributesOf(index);

  const referencesOf = (id: Uuid, qname: string): Attribute["references"] =>
    (references.get(`${id}\n${qname}`) ?? [])
      .toSorted((left, right) => Number(left.offset - right.offset))
      .map((row) => ({ name: row.name, offset: Number(row.offset) }));

  const stored = (id: Uuid, kind: string): ReadonlyMap<string, string> => {
    const values = new Map<string, string>();
    for (const [name, read] of readersOf(kind)) {
      const value = read(id);
      if (value !== undefined) {
        values.set(name, value);
      }
    }

    for (const row of spelling.get(id) ?? []) {
      values.set(row.attribute, row.value);
    }

    for (const row of lexical.get(id) ?? []) {
      values.set(row.attribute, row.value);
    }

    return values;
  };

  const scopeAt = (id: Uuid, parent: Scope): Scope => {
    const scope = new Map(parent);
    for (const row of declarations.get(id) ?? []) {
      scope.delete(row.prefix);
      scope.set(row.prefix, row.uri);
    }

    return scope;
  };

  const attributesOf = (id: Uuid, kind: string, scope: Scope): readonly Attribute[] => [
    ...(declarations.get(id) ?? [])
      .toSorted((left, right) => Number(left.position - right.position))
      .map((row): Attribute => {
        const qname = row.prefix === "" ? "xmlns" : `xmlns:${row.prefix}`;

        return {
          local: row.prefix === "" ? "xmlns" : row.prefix,
          namespace: xmlnsNamespace,
          prefix: row.prefix === "" ? "" : "xmlns",
          qname,
          references: referencesOf(id, qname),
          value: row.uri,
        };
      }),
    ...xsiRows.flatMap(([local, byNode]): readonly Attribute[] => {
      const row = byNode.get(id);
      if (row === undefined) {
        return [];
      }

      const qname = `${row.prefix}:${local}`;

      return [
        {
          local,
          namespace: xsiNamespace,
          prefix: row.prefix,
          qname,
          references: referencesOf(id, qname),
          value: row.value,
        },
      ];
    }),
    ...[...stored(id, kind)].map(([name, value]) =>
      attributeOf(name, value, referencesOf(id, name), xlinkPrefixIn(scope)),
    ),
    ...[...foreignOf(id), ...addedOf(id)].map((row): Attribute => {
      const qname = row.prefix === "" ? row.local : `${row.prefix}:${row.local}`;

      return {
        local: row.local,
        namespace: row.namespace,
        prefix: row.prefix,
        qname,
        references: referencesOf(id, qname),
        value: row.value,
      };
    }),
  ];

  const render = (id: Uuid, parent: Scope): Child => {
    const node = nodes.get(id) ?? missing("Node row", id);
    if (node.kind === "text") {
      return {
        cdata: false,
        kind: "text",
        value: (texts.get(id) ?? missing("TextNode row", id)).value,
      };
    }

    if (node.kind === "ws") {
      return {
        cdata: false,
        kind: "text",
        value: (whitespace.get(id) ?? missing("Ws row", id)).value,
      };
    }

    if (node.kind === "comment") {
      return { kind: "comment", text: (comments.get(id) ?? missing("Comment row", id)).text };
    }

    if (node.kind === "pi") {
      const row = instructions.get(id) ?? missing("Pi row", id);

      return { data: row.data, kind: "pi", target: row.target };
    }

    if (node.kind === "entityRef") {
      return {
        kind: "entityRef",
        name: (entities.get(id) ?? missing("EntityReference row", id)).name,
      };
    }

    const name =
      node.kind === "foreign"
        ? (foreignElements.get(id) ?? missing("ForeignElement row", id))
        : (renderRegistry.get(node.kind) ?? missing("registry row for the kind", node.kind));
    const scope = scopeAt(id, parent);

    return {
      attributes: attributesOf(id, node.kind, scope),
      children: (children.get(id) ?? [])
        .toSorted((left, right) => Number(left.position - right.position))
        .map((edge) => render(edge.child, scope)),
      kind: "element",
      local: name.local,
      namespace: name.namespace,
      prefix: node.prefix,
      qname: node.prefix === "" ? name.local : `${node.prefix}:${name.local}`,
    };
  };

  const root = rootId === undefined ? missing("TreeRoot row", treeId) : render(rootId, new Map());
  if (root.kind !== "element") {
    return missing("root element", treeId);
  }

  const misc = Rows.of(rows, TreeMisc).filter((row) => row.tree === treeId);
  const around = (placement: "prolog" | "epilog"): readonly Misc[] =>
    misc
      .filter((row) => row.placement === placement)
      .toSorted((left, right) => Number(left.position - right.position))
      .map(miscOf);
  const version = Rows.of(rows, TreeXmlVersion).find((row) => row.tree === treeId);
  const encoding = Rows.of(rows, TreeXmlEncoding).find((row) => row.tree === treeId);
  const standalone = Rows.of(rows, TreeXmlStandalone).find((row) => row.tree === treeId);
  const doctype = Rows.of(rows, TreeDoctype).find((row) => row.tree === treeId);

  return {
    charset: tree.charset,
    declaration:
      version === undefined
        ? Option.none()
        : Option.some({
            encoding: Option.fromNullishOr(encoding?.value),
            standalone: Option.fromNullishOr(standalone?.value),
            version: version.value,
          }),
    doctype: Option.fromNullishOr(doctype?.text),
    epilog: around("epilog"),
    prolog: around("prolog"),
    root,
  };
};
