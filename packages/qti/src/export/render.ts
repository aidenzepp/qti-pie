/**
 * The render half of export: the rows of one tree back to the XML tree they were imported from,
 * with no database in between.
 *
 * Every attribute comes from the column or optional-value row that holds it, written under the
 * name the kind's registry gives it. A typed copy of a value is never read: an element's text is
 * its text children, the `<attribute>N` columns and the owner and version copies are never
 * rendered, and an attribute whose node has an `AttributeLexical` row is written with that row's
 * value, because the typed column holds the collapsed or replaced form.
 *
 * Attributes are placed in the order the module reads them: namespace declarations,
 * `xsi:schemaLocation`, the kind's own attributes in the order of `ownAttributes`, then the
 * families, `id`, `role` and ARIA. The order the source wrote them in is not stored, and it need
 * not be: canonical XML sorts attributes, so canonical equality holds whatever this order is.
 */
import { Option } from "effect";
import { renderProcessing } from "#qti/export/processing.ts";
import type { Rows as RowSet } from "#qti/import/tree.ts";
import { Rows } from "#qti/import/tree.ts";
import { by, indexOf, readersFor } from "#qti/schema/attribute-homes.ts";
import {
  CsmMetadataProviderId,
  CsmSetOfGuidsRegion,
  CsmSetOfGuidsVersion,
  CsmSetResourceLabel,
  CsmSetResourcePartId,
} from "#qti/schema/csm.ts";
import type { RegistryRow } from "#qti/schema/kinds/generic.ts";
import {
  AttributeEntityReference,
  AttributeLexical,
  Comment as CommentRow,
  Edge,
  EntityReference,
  NamespaceDeclaration,
  Node,
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
} from "#qti/schema/node.ts";
import { Variant } from "#qti/schema/package.ts";
import * as usage from "#qti/schema/usage.ts";
import type { Attribute, Child, Misc, XmlDocument } from "#qti/xml/tree.ts";

const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

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
 * The attribute `qname` with `value` on the node `id`: `xml:*` names are in the XML namespace and
 * every other name in none.
 */
const attributeOf = (
  qname: string,
  value: string,
  references: Attribute["references"],
): Attribute =>
  qname.startsWith("xml:")
    ? {
        local: qname.slice("xml:".length),
        namespace: xmlNamespace,
        prefix: "xml",
        qname,
        references,
        value,
      }
    : { local: qname, namespace: "", prefix: "", qname, references, value };

/**
 * Attribute names with their values, in the order the kind's registry lists them.
 */
type Pairs = readonly (readonly [name: string, value: string])[];

/**
 * The attribute `name` with `value`, none when `value` is absent.
 */
const present = (name: string, value: string | undefined): Pairs =>
  value === undefined ? [] : [[name, value]];

/**
 * The attribute `name` with `value` when the source wrote it, which `marker` says by holding the
 * node.
 */
const written = (
  marker: ReadonlySet<string>,
  id: string,
  name: string,
  value: string | undefined,
) => (marker.has(id) ? present(name, value) : []);

/**
 * The ids of a relation's facts, by `key`.
 */
const idsOf = <T extends object>(
  facts: readonly T[],
  key: (fact: T) => string,
): ReadonlySet<string> => new Set(facts.map(key));

/**
 * The `value` of the fact `key` gives for a node, read through the facts by that key; none when no
 * fact holds the node.
 */
const optional = <T extends { readonly value: string }>(
  facts: readonly T[],
  key: (fact: T) => string,
) => {
  const found = by(facts, key);

  return (id: string): string | undefined => found.get(id)?.value;
};

/**
 * The attributes of the kinds `attribute-homes.ts` does not name yet, read from the rows, before
 * any `AttributeLexical` row takes the place of a value: every processing kind and `xi:include`
 * through {@link renderProcessing}, and the usage-data, variant and curriculum standards kinds.
 * A defaulted attribute is written only when its marker row exists.
 */
const unhomedSources = (rows: RowSet): ReadonlyMap<string, (id: string) => Pairs> => {
  const variants = by(Rows.of(rows, Variant), (fact) => fact.id);
  const resourceLabel = optional(Rows.of(rows, CsmSetResourceLabel), (fact) => fact.node);
  const resourcePartId = optional(Rows.of(rows, CsmSetResourcePartId), (fact) => fact.node);
  const providerId = optional(Rows.of(rows, CsmMetadataProviderId), (fact) => fact.node);
  const region = optional(Rows.of(rows, CsmSetOfGuidsRegion), (fact) => fact.node);
  const guidsVersion = optional(Rows.of(rows, CsmSetOfGuidsVersion), (fact) => fact.node);

  const usageGlossary = optional(Rows.of(rows, usage.UsageDataGlossary), (fact) => fact.node);
  const statisticRows = by(Rows.of(rows, usage.Statistic), (fact) => fact.id);
  const statistics = {
    caseCount: optional(Rows.of(rows, usage.StatisticCaseCount), (fact) => fact.node),
    glossary: optional(Rows.of(rows, usage.StatisticGlossary), (fact) => fact.node),
    lastUpdated: optional(Rows.of(rows, usage.StatisticLastUpdated), (fact) => fact.node),
    stdDeviation: optional(Rows.of(rows, usage.StatisticStdDeviation), (fact) => fact.node),
    stdError: optional(Rows.of(rows, usage.StatisticStdError), (fact) => fact.node),
  };
  const targets = by(Rows.of(rows, usage.TargetObject), (fact) => fact.id);
  const partIdentifier = optional(
    Rows.of(rows, usage.TargetObjectPartIdentifier),
    (fact) => fact.node,
  );
  const objectType = optional(Rows.of(rows, usage.TargetObjectObjectType), (fact) => fact.node);
  const usageBaseType = by(Rows.of(rows, usage.UsageValueBaseType), (fact) => fact.id);
  const usageFieldIdentifier = optional(
    Rows.of(rows, usage.UsageValueFieldIdentifier),
    (fact) => fact.id,
  );
  const mappings = by(Rows.of(rows, usage.UsageMapping), (fact) => fact.id);
  const declaredDefault = idsOf(Rows.of(rows, usage.DeclaredDefaultValue), (fact) => fact.node);
  const lowerBound = optional(Rows.of(rows, usage.UsageMappingLowerBound), (fact) => fact.node);
  const upperBound = optional(Rows.of(rows, usage.UsageMappingUpperBound), (fact) => fact.node);
  const entries = by(Rows.of(rows, usage.UsageMapEntry), (fact) => fact.id);
  const caseSensitive = optional(
    Rows.of(rows, usage.UsageMapEntryCaseSensitive),
    (fact) => fact.node,
  );

  const statistic = (id: string): Pairs => [
    ...present("caseCount", statistics.caseCount(id)),
    ...present("context", statisticRows.get(id)?.context),
    ...present("glossary", statistics.glossary(id)),
    ...present("lastUpdated", statistics.lastUpdated(id)),
    ...present("name", statisticRows.get(id)?.name),
    ...present("stdDeviation", statistics.stdDeviation(id)),
    ...present("stdError", statistics.stdError(id)),
  ];

  return new Map<string, (id: string) => Pairs>([
    ...renderProcessing(rows),
    ["ud:usageData", (id) => present("glossary", usageGlossary(id))],
    ["ud:ordinaryStatistic", statistic],
    ["ud:categorizedStatistic", statistic],
    [
      "ud:targetObject",
      (id) => [
        ...present("identifier", targets.get(id)?.identifier),
        ...present("objectType", objectType(id)),
        ...present("partIdentifier", partIdentifier(id)),
      ],
    ],
    [
      "ud:value",
      (id) => [
        ...present("baseType", usageBaseType.get(id)?.baseType),
        ...present("fieldIdentifier", usageFieldIdentifier(id)),
      ],
    ],
    [
      "ud:mapping",
      (id) => [
        ...written(declaredDefault, id, "defaultValue", mappings.get(id)?.defaultValue),
        ...present("lowerBound", lowerBound(id)),
        ...present("upperBound", upperBound(id)),
      ],
    ],
    [
      "ud:mapEntry",
      (id) => [
        ...present("caseSensitive", caseSensitive(id)),
        ...present("mapKey", entries.get(id)?.mapKey),
        ...present("mappedValue", entries.get(id)?.mappedValue),
      ],
    ],
    [
      "cpx:variant",
      (id) => [
        ...present("identifier", variants.get(id)?.identifier),
        ...present("identifierref", variants.get(id)?.identifierref),
      ],
    ],
    [
      "csmd:curriculumStandardsMetadataSet",
      (id) => [
        ...present("resourceLabel", resourceLabel(id)),
        ...present("resourcePartId", resourcePartId(id)),
      ],
    ],
    ["csmd:curriculumStandardsMetadata", (id) => present("providerId", providerId(id))],
    [
      "csmd:setOfGUIDs",
      (id) => [...present("region", region(id)), ...present("version", guidsVersion(id))],
    ],
  ]);
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
export const renderTree = (rows: RowSet, treeId: string): XmlDocument => {
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
  const schemaLocations = by(Rows.of(rows, SchemaLocation), (row) => row.node);
  const lexical = Map.groupBy(Rows.of(rows, AttributeLexical), (row) => row.node);
  const references = Map.groupBy(
    Rows.of(rows, AttributeEntityReference),
    (row) => `${row.node}\n${row.attribute}`,
  );
  const index = indexOf(rows);
  const readersOf = readersFor(index);
  const unhomed = unhomedSources(rows);

  const referencesOf = (id: string, qname: string): Attribute["references"] =>
    (references.get(`${id}\n${qname}`) ?? [])
      .toSorted((left, right) => Number(left.offset - right.offset))
      .map((row) => ({ name: row.name, offset: Number(row.offset) }));

  const stored = (id: string, kind: string): ReadonlyMap<string, string> => {
    const values = new Map<string, string>();
    for (const [name, read] of readersOf(kind)) {
      const value = read(id);
      if (value !== undefined) {
        values.set(name, value);
      }
    }

    for (const [name, value] of unhomed.get(kind)?.(id) ?? []) {
      values.set(name, value);
    }

    for (const row of lexical.get(id) ?? []) {
      values.set(row.attribute, row.value);
    }

    return values;
  };

  const attributesOf = (id: string, kind: string): readonly Attribute[] => [
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
    ...Option.match(Option.fromNullishOr(schemaLocations.get(id)), {
      onNone: (): readonly Attribute[] => [],
      onSome: (row): readonly Attribute[] => {
        const qname = `${row.prefix}:schemaLocation`;

        return [
          {
            local: "schemaLocation",
            namespace: xsiNamespace,
            prefix: row.prefix,
            qname,
            references: referencesOf(id, qname),
            value: row.value,
          },
        ];
      },
    }),
    ...[...stored(id, kind)].map(([name, value]) =>
      attributeOf(name, value, referencesOf(id, name)),
    ),
  ];

  const render = (id: string): Child => {
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

    const name = renderRegistry.get(node.kind) ?? missing("registry row for the kind", node.kind);

    return {
      attributes: attributesOf(id, node.kind),
      children: (children.get(id) ?? [])
        .toSorted((left, right) => Number(left.position - right.position))
        .map((edge) => render(edge.child)),
      kind: "element",
      local: name.local,
      namespace: name.namespace,
      prefix: node.prefix,
      qname: node.prefix === "" ? name.local : `${node.prefix}:${name.local}`,
    };
  };

  const root = rootId === undefined ? missing("TreeRoot row", treeId) : render(rootId);
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
