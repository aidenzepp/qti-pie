/**
 * The render half of export: the rows of one tree back to the XML tree they were imported from,
 * with no database in between.
 *
 * Every attribute comes from the column or optional-value row that holds it, written under the
 * name the kind's registry gives it. A typed copy of a value is never read: an element's text is
 * its text children, and an attribute whose node has an `AttributeLexical` row is written with that
 * row's value, because the typed column holds the collapsed or replaced form.
 */
import { Option } from "effect";
import { renderProcessing } from "#qti/export/processing.ts";
import type { Rows as RowSet } from "#qti/import/tree.ts";
import { Rows } from "#qti/import/tree.ts";
import {
  Declaration,
  DeclarationExternalScored,
  DeclarationInterpretation,
  DeclarationLongInterpretation,
  DeclarationMasteryValue,
  DeclarationNormalMaximum,
  DeclarationNormalMinimum,
  DeclarationVariableIdentifierRef,
  DeclarationView,
  TypedDeclaration,
} from "#qti/schema/declaration.ts";
import { DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import { Img, ImgHeight, ImgLongdesc, ImgWidth } from "#qti/schema/html.ts";
import {
  ChoiceInteraction,
  ChoiceInteractionMaxSelectionsMessage,
  ChoiceInteractionMinSelectionsMessage,
  DeclaredFixed,
  DeclaredMaxChoices,
  DeclaredMinChoices,
  DeclaredOrientation,
  DeclaredShowHide,
  DeclaredShuffle,
  SimpleChoice,
  SimpleChoiceTemplateIdentifier,
} from "#qti/schema/interaction.ts";
import { AssessmentItem, DeclaredAdaptive } from "#qti/schema/item.ts";
import type { RegistryRow } from "#qti/schema/kinds/generic.ts";
import { LomStringLanguage } from "#qti/schema/metadata.ts";
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
import { Dependency, File, Package, Resource, ResourceHref } from "#qti/schema/package.ts";
import {
  ResponseProcessingTemplate,
  ResponseProcessingTemplateLocation,
} from "#qti/schema/processing.ts";
import { DeclaredValue, RecordField, ValueSetInterpretation } from "#qti/schema/value.ts";
import type { Attribute, Child, Misc, XmlDocument } from "#qti/xml/tree.ts";

const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * Attribute names with their values, in the order the kind's registry lists them.
 */
type Pairs = readonly (readonly [name: string, value: string])[];

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
const names: ReadonlyMap<string, RegistryRow> = new Map(elementRows);

if (names.size !== elementRows.length) {
  throw new Error("Two vocabulary registries name the same element kind.");
}

/**
 * `facts` keyed by `key`, the last fact winning a shared key.
 */
const by = <T extends object>(
  facts: readonly T[],
  key: (fact: T) => string,
): ReadonlyMap<string, T> => new Map(facts.map((fact) => [key(fact), fact]));

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
 * An attribute set in no namespace, from its name and value.
 */
const plain = (name: string, value: string, references: Attribute["references"]): Attribute => ({
  local: name,
  namespace: "",
  prefix: "",
  qname: name,
  references,
  value,
});

/**
 * The ids of a relation's facts, by `key`.
 */
const idsOf = <T extends object>(
  facts: readonly T[],
  key: (fact: T) => string,
): ReadonlySet<string> => new Set(facts.map(key));

/**
 * What each element kind writes as attributes, read from the rows: for a node, its attributes with
 * the value its column or optional-value row holds, before any `AttributeLexical` row takes the
 * place of that value.
 *
 * Attributes with no XSD default are written whenever their column exists; a defaulted attribute is
 * written only when its marker row exists, so an absent one stays absent.
 */
const attributeSources = (rows: RowSet): ReadonlyMap<string, (id: string) => Pairs> => {
  const optional = <T extends { readonly value: string }>(
    facts: readonly T[],
    key: (fact: T) => string,
  ) => {
    const found = by(facts, key);

    return (id: string): string | undefined => found.get(id)?.value;
  };
  const identifiers = by(Rows.of(rows, DocumentIdentifier), (fact) => fact.document);
  const titles = by(Rows.of(rows, DocumentTitle), (fact) => fact.document);
  const items = by(Rows.of(rows, AssessmentItem), (fact) => fact.id);
  const adaptive = idsOf(Rows.of(rows, DeclaredAdaptive), (fact) => fact.node);
  const declarations = by(Rows.of(rows, Declaration), (fact) => fact.id);
  const typed = by(Rows.of(rows, TypedDeclaration), (fact) => fact.id);
  const outcomeValues = {
    externalScored: optional(Rows.of(rows, DeclarationExternalScored), (fact) => fact.declaration),
    interpretation: optional(Rows.of(rows, DeclarationInterpretation), (fact) => fact.declaration),
    longInterpretation: optional(
      Rows.of(rows, DeclarationLongInterpretation),
      (fact) => fact.declaration,
    ),
    masteryValue: optional(Rows.of(rows, DeclarationMasteryValue), (fact) => fact.declaration),
    normalMaximum: optional(Rows.of(rows, DeclarationNormalMaximum), (fact) => fact.declaration),
    normalMinimum: optional(Rows.of(rows, DeclarationNormalMinimum), (fact) => fact.declaration),
    variableIdentifierRef: optional(
      Rows.of(rows, DeclarationVariableIdentifierRef),
      (fact) => fact.declaration,
    ),
    view: optional(Rows.of(rows, DeclarationView), (fact) => fact.declaration),
  };
  const setInterpretation = optional(
    Rows.of(rows, ValueSetInterpretation),
    (fact) => fact.valueSet,
  );
  const declaredValues = by(Rows.of(rows, DeclaredValue), (fact) => fact.id);
  const fields = by(Rows.of(rows, RecordField), (fact) => fact.id);
  const interactions = by(Rows.of(rows, ChoiceInteraction), (fact) => fact.id);
  const shuffle = idsOf(Rows.of(rows, DeclaredShuffle), (fact) => fact.node);
  const maxChoices = idsOf(Rows.of(rows, DeclaredMaxChoices), (fact) => fact.node);
  const minChoices = idsOf(Rows.of(rows, DeclaredMinChoices), (fact) => fact.node);
  const orientation = idsOf(Rows.of(rows, DeclaredOrientation), (fact) => fact.node);
  const minMessage = optional(
    Rows.of(rows, ChoiceInteractionMinSelectionsMessage),
    (fact) => fact.node,
  );
  const maxMessage = optional(
    Rows.of(rows, ChoiceInteractionMaxSelectionsMessage),
    (fact) => fact.node,
  );
  const choices = by(Rows.of(rows, SimpleChoice), (fact) => fact.id);
  const fixed = idsOf(Rows.of(rows, DeclaredFixed), (fact) => fact.node);
  const showHide = idsOf(Rows.of(rows, DeclaredShowHide), (fact) => fact.node);
  const templateIdentifier = optional(
    Rows.of(rows, SimpleChoiceTemplateIdentifier),
    (fact) => fact.node,
  );
  const template = by(Rows.of(rows, ResponseProcessingTemplate), (fact) => fact.node);
  const templateLocation = by(
    Rows.of(rows, ResponseProcessingTemplateLocation),
    (fact) => fact.node,
  );
  const images = by(Rows.of(rows, Img), (fact) => fact.id);
  const longdesc = optional(Rows.of(rows, ImgLongdesc), (fact) => fact.node);
  const height = optional(Rows.of(rows, ImgHeight), (fact) => fact.node);
  const width = optional(Rows.of(rows, ImgWidth), (fact) => fact.node);
  const packages = by(Rows.of(rows, Package), (fact) => fact.id);
  const resources = by(Rows.of(rows, Resource), (fact) => fact.id);
  const hrefs = by(Rows.of(rows, ResourceHref), (fact) => fact.resource);
  const files = by(Rows.of(rows, File), (fact) => fact.id);
  const dependencies = by(Rows.of(rows, Dependency), (fact) => fact.id);
  const languages = optional(Rows.of(rows, LomStringLanguage), (fact) => fact.node);

  const declared = (id: string): Pairs => {
    const declaration = declarations.get(id);
    const own = typed.get(id);
    const typing: Pairs =
      declaration?.shape === "record"
        ? [["cardinality", "record"]]
        : [...present("base-type", own?.baseType), ...present("cardinality", own?.cardinality)];

    return [...present("identifier", declaration?.identifier), ...typing];
  };

  return new Map<string, (id: string) => Pairs>([
    ...renderProcessing(rows),
    [
      "qti-assessment-item",
      (id) => [
        ...present("identifier", identifiers.get(id)?.value),
        ...present("title", titles.get(id)?.value),
        ...written(adaptive, id, "adaptive", items.get(id)?.adaptive),
        ...present("time-dependent", items.get(id)?.timeDependent),
      ],
    ],
    ["qti-response-declaration", declared],
    [
      "qti-outcome-declaration",
      (id) => [
        ...declared(id),
        ...present("view", outcomeValues.view(id)),
        ...present("interpretation", outcomeValues.interpretation(id)),
        ...present("long-interpretation", outcomeValues.longInterpretation(id)),
        ...present("normal-maximum", outcomeValues.normalMaximum(id)),
        ...present("normal-minimum", outcomeValues.normalMinimum(id)),
        ...present("mastery-value", outcomeValues.masteryValue(id)),
        ...present("external-scored", outcomeValues.externalScored(id)),
        ...present("variable-identifier-ref", outcomeValues.variableIdentifierRef(id)),
      ],
    ],
    ["qti-correct-response", (id) => present("interpretation", setInterpretation(id))],
    ["qti-default-value", (id) => present("interpretation", setInterpretation(id))],
    [
      "qti-value",
      (id) => [
        ...present("field-identifier", fields.get(id)?.fieldIdentifier),
        ...(declaredValues.get(id)?.shape === "record"
          ? present("base-type", declaredValues.get(id)?.baseType)
          : []),
      ],
    ],
    [
      "qti-choice-interaction",
      (id) => {
        const own = interactions.get(id);

        return [
          ...present("response-identifier", own?.responseIdentifier),
          ...written(shuffle, id, "shuffle", own?.shuffle),
          ...written(maxChoices, id, "max-choices", own?.maxChoices),
          ...written(minChoices, id, "min-choices", own?.minChoices),
          ...written(orientation, id, "orientation", own?.orientation),
          ...present("data-min-selections-message", minMessage(id)),
          ...present("data-max-selections-message", maxMessage(id)),
        ];
      },
    ],
    [
      "qti-simple-choice",
      (id) => {
        const own = choices.get(id);

        return [
          ...present("identifier", own?.identifier),
          ...written(fixed, id, "fixed", own?.fixed),
          ...present("template-identifier", templateIdentifier(id)),
          ...written(showHide, id, "show-hide", own?.showHide),
        ];
      },
    ],
    [
      "qti-response-processing",
      (id) => [
        ...present("template", template.get(id)?.uri),
        ...present("template-location", templateLocation.get(id)?.uri),
      ],
    ],
    [
      "img",
      (id) => [
        ...present("src", images.get(id)?.src),
        ...present("alt", images.get(id)?.alt),
        ...present("longdesc", longdesc(id)),
        ...present("height", height(id)),
        ...present("width", width(id)),
      ],
    ],
    ["cp:manifest", (id) => present("identifier", packages.get(id)?.identifier)],
    [
      "cp:resource",
      (id) => [
        ...present("identifier", resources.get(id)?.identifier),
        ...present("type", resources.get(id)?.type),
        ...present("href", hrefs.get(id)?.href),
      ],
    ],
    ["cp:file", (id) => present("href", files.get(id)?.href)],
    ["cp:dependency", (id) => present("identifierref", dependencies.get(id)?.target)],
    ["lom:string", (id) => present("language", languages(id))],
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
  const lexical = new Map(
    Rows.of(rows, AttributeLexical).map((row) => [`${row.node}\n${row.attribute}`, row.value]),
  );
  const references = Map.groupBy(
    Rows.of(rows, AttributeEntityReference),
    (row) => `${row.node}\n${row.attribute}`,
  );
  const sources = attributeSources(rows);

  const referencesOf = (id: string, qname: string): Attribute["references"] =>
    (references.get(`${id}\n${qname}`) ?? [])
      .toSorted((left, right) => Number(left.offset - right.offset))
      .map((row) => ({ name: row.name, offset: Number(row.offset) }));

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
    ...(sources.get(kind)?.(id) ?? []).map(([name, value]) =>
      plain(name, lexical.get(`${id}\n${name}`) ?? value, referencesOf(id, name)),
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

    const name = names.get(node.kind) ?? missing("registry row for the kind", node.kind);

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
