/**
 * The expression and processing overlays' rows (plan §1.7 O4, §C's `rowsOf`): from one document's
 * XDM tree and the ids its nodes are written under, the rows of every relation
 * `#pantry/qti/expressions.ts` declares, each relation's rows a keyed set.
 *
 * The rows restate what the tree says and nothing else: each element's `nodeRef` tuple, each
 * processing element's language as its root opens it, each reference as its attribute spells it
 * and as the document's declarations resolve it, and each expression's type, derived from its
 * operands, its attributes and its variable by the same rules the laws state. A derived value is
 * written as the rule gives it even where the content breaks a law, so the database refuses the
 * content under the law it breaks (`expressionLaws`); a row this builder gets wrong is refused,
 * never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import type { DocumentContext } from "#pantry/import/context.ts";
import { Option } from "effect";
import {
  integerMathOperators,
  lookupKind,
  rpTemplatePattern,
  rpTemplates,
  tableReaders,
  valueBases,
  valueCardinalities,
} from "#pantry/grammar/expression.ts";
import type {
  Language,
  ReferencedTable,
  ValueBase,
  ValueCardinality,
} from "#pantry/grammar/expression.ts";
import { BuiltInVariable, nonElementKinds } from "#pantry/grammar/install.ts";
import type { BaseType, Cardinality } from "#pantry/grammar/install.ts";
import { testRoots } from "#pantry/grammar/references.ts";
import { baseTypeOf, piecesOf, typedDeclarationOf } from "#pantry/import/overlays/declarations.ts";
import { itemRefPathsOf, keyOf } from "#pantry/import/overlays/tests.ts";
import type {
  AssembledRows,
  InstanceMember,
  InstanceRoot,
  TestIds,
  TestRows,
} from "#pantry/import/overlays/tests.ts";
import { foldOf, ownContext } from "#pantry/import/fold.ts";
import type { Folded } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { AttributeRow, FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import {
  expressionKinds,
  heldKinds,
  ncChar,
  ncStart,
  processingReferences,
  rootLanguages,
  ruleKindHandles,
  setterKinds,
  typings,
} from "#pantry/qti/expression-types.ts";
import type {
  AssembledReference,
  DeclarationTable,
  Expression,
  ExpressionAttribute,
  ItemTiming,
  Literal,
  LiteralTyped,
  MappingItemRef,
  MappingLookup,
  MappingSourceDeclaration,
  NameLookup,
  Operand,
  PlacedDocument,
  PlacedReference,
  PlacedVariableRef,
  Processing,
  ProcessingTemplate,
  Reading,
  ReferenceDocument,
  ReferenceSegment,
  SectionIdentifier,
  TemplateDefault,
  TemplateDefaultTarget,
  TestReference,
  VariableLookup,
  VariableRef,
} from "#pantry/qti/expressions.ts";
import {
  itemKind,
  itemRefKind,
  itemResourceType,
  linkResourceTypes,
  partKind,
  sectionKind,
  sectionRefKind,
  testKind,
} from "#pantry/qti/tests.ts";
import type { ItemRefDocument, ItemRefTarget } from "#pantry/qti/tests.ts";
import type { Declaration } from "#pantry/qti/declarations.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes', drawn by the number
 * `flatten` gives it, in document order from the document node's 0.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface ExpressionIds {
  /**
   * The document's context (spec reading 117), its own where none is given: an included
   * fragment's nodes take the interaction their includes stand in as their nearest.
   */
  readonly context?: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * A document's expression and processing rows, one keyed set per relation: each map from the text
 * of a row's key to the row as its writer writes it. A node-keyed overlay's key text is its node's
 * id; a (node, attribute)-keyed one's is the pair as a JSON array.
 */
export interface ExpressionRows {
  readonly DeclarationTable: ReadonlyMap<string, Addition<typeof DeclarationTable>>;
  readonly Expression: ReadonlyMap<string, Addition<typeof Expression>>;
  readonly ExpressionAttribute: ReadonlyMap<string, Addition<typeof ExpressionAttribute>>;
  readonly ItemTiming: ReadonlyMap<string, Addition<typeof ItemTiming>>;
  readonly Literal: ReadonlyMap<string, Addition<typeof Literal>>;
  readonly LiteralTyped: ReadonlyMap<string, Addition<typeof LiteralTyped>>;
  readonly Operand: ReadonlyMap<string, Addition<typeof Operand>>;
  readonly Processing: ReadonlyMap<string, Addition<typeof Processing>>;
  readonly ProcessingTemplate: ReadonlyMap<string, Addition<typeof ProcessingTemplate>>;
  readonly ReferenceDocument: ReadonlyMap<string, Addition<typeof ReferenceDocument>>;
  readonly SectionIdentifier: ReadonlyMap<string, Addition<typeof SectionIdentifier>>;
  readonly TestReference: ReadonlyMap<string, Addition<typeof TestReference>>;
  readonly VariableLookup: ReadonlyMap<string, Addition<typeof VariableLookup>>;
  readonly VariableRef: ReadonlyMap<string, Addition<typeof VariableRef>>;
}

/**
 * The nil uuid, a reference's `declaration` where it names no declaration.
 */
const nilUuid = "00000000-0000-0000-0000-000000000000";

/**
 * A type as the laws give it: a base type and a cardinality.
 */
interface Typed {
  readonly baseType: ValueBase;
  readonly cardinality: ValueCardinality;
}

/**
 * The type of a value no declaration says.
 */
const unknownType: Typed = { baseType: "unknown", cardinality: "unknown" };

/**
 * One declaration of the document as a reference resolves to it: its node, kind and codes.
 */
interface DeclarationEntry {
  readonly baseType: (typeof BaseType.handles)[number];
  readonly cardinality: (typeof Cardinality.handles)[number];
  readonly kind: string;
  readonly node: NodeId;
  readonly tables: ReadonlySet<string>;
}

/**
 * The declaration kinds, the elements that declare a variable by its `identifier`.
 */
const declarationKinds: ReadonlySet<string> = new Set([
  "qti-context-declaration",
  "qti-outcome-declaration",
  "qti-response-declaration",
  "qti-template-declaration",
]);

/**
 * The tables a declaration may hold, which a map response or a lookup reads.
 */
const tableKinds: ReadonlySet<string> = new Set([
  "qti-area-mapping",
  "qti-interpolation-table",
  "qti-mapping",
  "qti-match-table",
]);

/**
 * The kinds that are no element.
 */
const notElements: ReadonlySet<string> = new Set(nonElementKinds);

/**
 * The expression kinds, and their typings by kind.
 */
const expressions: ReadonlySet<string> = new Set(expressionKinds);

/**
 * Each expression kind's typing.
 */
const typingOf = new Map(typings.map((typing) => [typing.kind, typing] as const));

/**
 * The rule and processing kinds.
 */
const rules: ReadonlySet<string> = new Set(ruleKindHandles);

/**
 * The language each root opens.
 */
const rootLanguage: ReadonlyMap<string, Language> = new Map(rootLanguages);

/**
 * The setters and the lookup, whose reference copies their one expression's type.
 */
const holders: ReadonlySet<string> = new Set(heldKinds);

/**
 * Each processing reference's spelling, by `kind attribute`.
 */
const spellingOf: ReadonlyMap<string, "bare" | "braced"> = new Map(
  processingReferences.map(({ attribute, kind, spelling }) => [`${kind} ${attribute}`, spelling]),
);

/**
 * The roots whose references resolve against the tests that place their documents: a test's and
 * a section's (spec reading 5).
 */
const tests: ReadonlySet<string> = new Set(testRoots);

/**
 * A true `xs:boolean`'s lexical forms, its whitespace collapse absorbed.
 */
const trueForm = /^[\t\n\r ]*(?:true|1)[\t\n\r ]*$/u;

/**
 * A bare reference's lexical form: the name with the whitespace a collapsing type absorbs.
 */
const bareForm = new RegExp(
  `^(?<before>[\\t\\n\\r ]*)(?<name>[${ncStart}][${ncChar}]*)(?<after>[\\t\\n\\r ]*)$`,
  "u",
);

/**
 * A braced reference's lexical form: the name between braces.
 */
const bracedForm = new RegExp(`^\\{(?<name>[${ncStart}][${ncChar}]*)\\}$`, "u");

/**
 * What a reference's lexical form holds around its name, as `VariableRef` types it.
 */
type Affix = Addition<typeof VariableRef>["before"];

/**
 * Whether a run of text is XML whitespace, possibly none: a bare reference's affix.
 *
 * @param text - The text.
 * @returns Whether it is.
 */
const isSpace = (text: string): text is Affix => /^[\t\n\r ]*$/u.test(text);

/**
 * A float literal that is also a name, which a float-or-reference attribute reads as the literal.
 */
const floatName = /^[\t\n\r ]*(?:INF|NaN)[\t\n\r ]*$/u;

/**
 * The names `qti-math-operator` gives an integer result.
 */
const integerNames = new RegExp(integerMathOperators, "u");

/**
 * The published template a `template` URI names, `none` for any other.
 *
 * @param uri - The URI as written.
 * @returns The `RpTemplate` handle.
 */
const templateOf = (uri: string): (typeof rpTemplates)[number] =>
  rpTemplates.find(
    (template) => template !== "none" && new RegExp(rpTemplatePattern(template), "u").test(uri),
  ) ?? "none";

/**
 * Read a coded attribute's handle from its lexical form, exactly, as a `whiteSpace` preserve
 * enumeration spells it.
 *
 * @param handles - The roster's handles.
 * @param lexical - The lexical form, if written.
 * @returns The handle it spells, or none.
 */
const handleOf = <H extends string>(handles: readonly H[], lexical: string | undefined) =>
  handles.find((handle) => handle === lexical);

/**
 * Index a document's attribute rows by their element and name.
 *
 * @param rows - The document's flat rows.
 * @returns Each element's attributes, by the element's id and the attribute's name.
 */
const attributesOf = (
  rows: FlatRows<Composed>,
): ReadonlyMap<NodeId, ReadonlyMap<string, AttributeRow<Composed>>> => {
  const byNode = new Map<NodeId, Map<string, AttributeRow<Composed>>>();

  for (const row of rows.attributes) {
    const named = byNode.get(row.node) ?? new Map<string, AttributeRow<Composed>>();
    named.set(row.name, row);
    byNode.set(row.node, named);
  }

  return byNode;
};

/**
 * The expression-typing base type of a declaration's base type: itself among QTI's eleven, and
 * `unknown` for a record's `none` (`ValueBaseOf`).
 *
 * @param baseType - The declaration's code.
 * @returns The expression-typing code.
 */
const valueBaseOf = (baseType: string): ValueBase =>
  valueBases.find((base) => base === baseType && base !== "any") ?? "unknown";

/**
 * The expression-typing cardinality of a declaration's cardinality (`ValueCardinalityOf`).
 *
 * @param cardinality - The declaration's code.
 * @returns The expression-typing code.
 */
const valueCardinalityOf = (cardinality: string): ValueCardinality =>
  valueCardinalities.find((held) => held === cardinality) ?? "unknown";

/**
 * Each root's built-in variables with their types, as the installed `BuiltInVariable` holds them
 * (the UP audit's A63), their declaration codes read as expression-typing codes.
 */
export const builtInsByRoot: ReadonlyMap<string, ReadonlyMap<string, Typed>> = new Map(
  [...Map.groupBy(BuiltInVariable.rows, ({ root }) => root)].map(([root, rows]) => [
    root,
    new Map(
      rows.map(({ baseType, cardinality, variable }) => [
        variable,
        { baseType: valueBaseOf(baseType), cardinality: valueCardinalityOf(cardinality) },
      ]),
    ),
  ]),
);

/**
 * Each root's built-in variables with the declaration kind each stands as there (the installed
 * `BuiltInVariable`).
 */
export const builtInKindsByRoot: ReadonlyMap<
  string,
  ReadonlyMap<string, Addition<typeof VariableRef>["declarationKind"]>
> = new Map(
  [...Map.groupBy(BuiltInVariable.rows, ({ root }) => root)].map(([root, rows]) => [
    root,
    new Map(rows.map(({ declaration, variable }) => [variable, declaration])),
  ]),
);

/**
 * The operand bits of some types' base types: each but `any`, once.
 *
 * @param types - The operands' types.
 * @returns Their base types, `any` left out.
 */
const basesOf = (types: readonly Typed[]): ReadonlySet<ValueBase> =>
  new Set(types.flatMap(({ baseType }) => (baseType === "any" ? [] : [baseType])));

/**
 * The base type a set of operand bits gives a container or an index: `any` for none, the one for
 * one, `unknown` for several.
 *
 * @param bases - The bits.
 * @returns The base type.
 */
const oneOf = (bases: ReadonlySet<ValueBase>): ValueBase => {
  if (bases.size === 0) {
    return "any";
  }

  return bases.size === 1 ? ([...bases][0] ?? "unknown") : "unknown";
};

/**
 * The tables each kind of reference reads, in the order it reads them (`tableReaders` of
 * `#pantry/grammar/expression.ts`, `TableReader`'s rows).
 */
const tablesRead: ReadonlyMap<string, readonly ReferencedTable[]> = new Map(
  [...Map.groupBy(tableReaders, ({ kind }) => kind)].map(([kind, rows]) => [
    kind,
    rows.map(({ table }) => table),
  ]),
);

/**
 * Read the table a reference of a kind reads among those its declaration holds: the first it
 * reads that the declaration holds, else none.
 *
 * @param kind - The reference's kind.
 * @param held - The tables its declaration holds.
 * @returns The table.
 */
const heldTableOf = (kind: string, held: ReadonlySet<string>): ReferencedTable =>
  (tablesRead.get(kind) ?? []).find((table) => held.has(table)) ?? "none";

/**
 * The table a reference's element needs its declaration to hold, as the declaration holds it: a map
 * response's mapping, a point's area mapping, a lookup's match or interpolation table; `none` where
 * the declaration holds none of them or the reference needs none, which `Mapped_response` and
 * `Lookup_type` then judge.
 *
 * @param kind - The element's kind.
 * @param attribute - The attribute the reference is made by.
 * @param declared - The declaration it resolves to, if any.
 * @returns The `ReferencedTable` handle.
 */
const tableOf = (
  kind: string,
  attribute: string,
  declared: DeclarationEntry | undefined,
): ReferencedTable =>
  attribute === "identifier" ? heldTableOf(kind, declared?.tables ?? new Set<string>()) : "none";

/**
 * The base type a numeric aggregate gives: `unknown` when an operand is unknown, `integer` when
 * every typed operand is an integer, else `float`.
 *
 * @param operands - Its operands' types.
 * @returns The base type.
 */
const numericOf = (operands: readonly Typed[]): ValueBase => {
  const bases = basesOf(operands);
  if (bases.has("unknown")) {
    return "unknown";
  }

  return bases.size === 1 && bases.has("integer") ? "integer" : "float";
};

/**
 * The base type an expression's own attribute gives: a math operator's by its `name`, a base
 * value's and a test variables' by its `base-type`, `unknown` where none is written or the one
 * written spells no base (`E1_derived` on `ExpressionAttribute`).
 *
 * @param kind - The expression's kind.
 * @param baseTypeLexical - Its `base-type`, if written.
 * @param name - Its `name`, if written.
 * @returns The base type.
 */
const attributeBaseOf = (
  kind: string,
  baseTypeLexical: string | undefined,
  name: string | undefined,
): ValueBase => {
  if (kind === "qti-math-operator") {
    return integerNames.test(name ?? "") ? "integer" : "float";
  }

  const written = handleOf(valueBases, baseTypeLexical);

  return written === undefined || written === "any" ? "unknown" : written;
};

/**
 * The type a row holds, as a type alone: its base type and cardinality, `unknown` for none.
 *
 * @param row - A typed row, an operand's type or a reference's.
 * @returns Its type.
 */
const typeIn = (row: Typed | undefined): Typed =>
  row === undefined ? unknownType : { baseType: row.baseType, cardinality: row.cardinality };

/**
 * What an expression's type derives from beside its kind.
 */
interface TypeInputs {
  readonly baseTypeLexical: string | undefined;
  readonly name: string | undefined;
  readonly operands: readonly Typed[];
  readonly reference: Typed | undefined;
}

/**
 * Derive an expression's type as the laws do: its kind's typing over its operands' types, its own
 * attributes, and the variable its `identifier` names.
 *
 * @param kind - The expression's kind.
 * @param inputs - Its operands' types, in order, its `base-type` and `name`, and its
 *   `identifier`'s reference.
 * @returns The type.
 */
const typeOf = (kind: string, inputs: TypeInputs): Typed => {
  const typing = typingOf.get(kind);
  if (typing === undefined) {
    return unknownType;
  }

  const cardinality = typing.resultCardinalities[0] ?? "unknown";
  switch (typing.typing) {
    case "numeric": {
      return { baseType: numericOf(inputs.operands), cardinality };
    }
    case "container": {
      return { baseType: oneOf(basesOf(inputs.operands)), cardinality };
    }
    case "first": {
      return { baseType: inputs.operands[0]?.baseType ?? "any", cardinality };
    }
    case "second": {
      return typeIn(inputs.operands[1]);
    }
    case "declared": {
      return typeIn(inputs.reference);
    }
    case "attribute": {
      return { baseType: attributeBaseOf(kind, inputs.baseTypeLexical, inputs.name), cardinality };
    }
    case "fixed": {
      return { baseType: typing.resultBases[0] ?? "unknown", cardinality };
    }
    default: {
      return typing.typing satisfies never;
    }
  }
};

/**
 * One document as the builder reads it: its flat rows indexed by node, each node's attributes,
 * children, fold (`#pantry/import/fold.ts`, its nearest interaction among the rest) and processing
 * language, its root's kind, its declarations that have a `Declaration` row, and the names only a
 * declaration with none holds.
 */
interface Document {
  readonly attributes: ReadonlyMap<NodeId, ReadonlyMap<string, AttributeRow<Composed>>>;
  readonly byId: ReadonlyMap<NodeId, NodeRow<Composed>>;
  readonly childrenOf: ReadonlyMap<NodeId, readonly NodeRow<Composed>[]>;
  readonly declarations: ReadonlyMap<string, DeclarationEntry>;
  readonly folds: ReadonlyMap<NodeId, Folded>;
  readonly untyped: ReadonlySet<string>;
  readonly id: NodeId;
  readonly language: ReadonlyMap<NodeId, Language>;
  readonly rootKind: NodeRow<Composed>["kind"];
  readonly rows: FlatRows<Composed>;
  readonly timeDependent: boolean;
}

/**
 * Read an attribute's lexical form.
 *
 * @param doc - The document.
 * @param node - The element.
 * @param name - The attribute's name.
 * @returns Its lexical form, if written.
 */
const valueOf = (doc: Document, node: NodeId, name: string): string | undefined =>
  doc.attributes.get(node)?.get(name)?.lexical;

/**
 * An element's element children, in order.
 *
 * @param doc - The document.
 * @param node - The element.
 * @returns Its children that are elements.
 */
const elementsOf = (doc: Document, node: NodeId): readonly NodeRow<Composed>[] =>
  (doc.childrenOf.get(node) ?? []).filter(({ kind }) => !notElements.has(kind));

/**
 * A node's parent's kind, `document` for the document node's own.
 *
 * @param doc - The document.
 * @param node - The node.
 * @returns The kind.
 */
const parentKindOf = (doc: Document, node: NodeRow<Composed>): NodeRow<Composed>["kind"] =>
  doc.byId.get(node.parent)?.kind ?? "document";

/**
 * Read each node's processing language in document order: a root's its own, a rule's or an
 * expression's under a rule or an expression its parent's, and every other node's `none`.
 *
 * @param rows - The document's flat rows, in document order.
 * @param byId - The nodes by id.
 * @returns Each node's language.
 */
const languagesOf = (
  rows: FlatRows<Composed>,
  byId: ReadonlyMap<NodeId, NodeRow<Composed>>,
): ReadonlyMap<NodeId, Language> => {
  const language = new Map<NodeId, Language>();
  for (const node of rows.nodes) {
    const parentKind = byId.get(node.parent)?.kind ?? "document";
    const carried = rules.has(parentKind) || expressions.has(parentKind);
    language.set(
      node.id,
      rootLanguage.get(node.kind) ?? (carried ? (language.get(node.parent) ?? "none") : "none"),
    );
  }

  return language;
};

/**
 * The document's declarations by collapsed identifier, the first of a repeated one (which
 * `declaration-key` refuses), each with the tables it holds: those with a `Declaration` row
 * (`typedDeclarationOf`), and the names only declarations with none hold, whose identifier or
 * cardinality is unwritten or spells nothing. No reference to such a name is written: AL3 or the
 * value domain refuses its declaration alone, and no law reads a type it does not have (lane NIL's
 * audit, B11).
 *
 * @param rows - The document's flat rows.
 * @param attributes - Each element's attributes.
 * @param childrenOf - Each node's children.
 * @returns The declarations, and the untyped names.
 */
const declarationsOf = (
  rows: FlatRows<Composed>,
  attributes: Document["attributes"],
  childrenOf: Document["childrenOf"],
): Pick<Document, "declarations" | "untyped"> => {
  const declarations = new Map<string, DeclarationEntry>();
  const unnamed = new Set<string>();
  for (const node of rows.nodes) {
    const lexical = (attribute: string) => attributes.get(node.id)?.get(attribute)?.lexical;
    const identifier = lexical("identifier");
    if (declarationKinds.has(node.kind) && identifier !== undefined) {
      const typed = typedDeclarationOf({
        baseType: lexical("base-type"),
        cardinality: lexical("cardinality"),
        identifier,
      });
      const { name } = piecesOf(identifier);
      if (Option.isNone(typed)) {
        unnamed.add(name);
      } else if (!declarations.has(name)) {
        declarations.set(name, {
          baseType: typed.value.baseType,
          cardinality: typed.value.cardinality,
          kind: node.kind,
          node: node.id,
          tables: new Set(
            (childrenOf.get(node.id) ?? []).flatMap(({ kind }) =>
              tableKinds.has(kind) ? [kind] : [],
            ),
          ),
        });
      }
    }
  }

  return {
    declarations,
    untyped: new Set([...unnamed].filter((name) => !declarations.has(name))),
  };
};

/**
 * Read a document for the builder.
 *
 * @param tree - The document's tree.
 * @param ids - The ids its rows are written under.
 * @returns The document, indexed.
 */
const documentOf = (tree: XdmDocument<Composed>, ids: ExpressionIds): Document => {
  const rows = flatten(tree, ids.idOf);
  const attributes = attributesOf(rows);
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const childrenOf: ReadonlyMap<NodeId, readonly NodeRow<Composed>[]> = Map.groupBy(
    rows.nodes.filter((node) => node.parent !== node.id),
    ({ parent }) => parent,
  );

  return {
    attributes,
    byId,
    childrenOf,
    ...declarationsOf(rows, attributes, childrenOf),
    folds: foldOf(rows.nodes, ids.context ?? ownContext(rows.document.node)),
    id: rows.document.node,
    language: languagesOf(rows, byId),
    rootKind: tree.root.kind,
    rows,
    timeDependent: trueForm.test(
      rows.attributes.find(
        ({ name, node }) => name === "time-dependent" && byId.get(node)?.kind === itemKind,
      )?.lexical ?? "",
    ),
  };
};

/**
 * Split a reference's lexical form around the name it spells, or none for a value of its
 * attribute that is a literal.
 *
 * @param node - The element.
 * @param attribute - The attribute.
 * @returns The affixes and the name, or none.
 */
const spelledBy = (
  node: NodeRow<Composed>,
  attribute: AttributeRow<Composed>,
): { readonly after: Affix; readonly before: Affix; readonly name: string } | undefined => {
  const spelling = spellingOf.get(`${node.kind} ${attribute.name}`);
  if (
    spelling === undefined ||
    (node.kind === "qti-random-float" && floatName.test(attribute.lexical))
  ) {
    return undefined;
  }

  const groups = (spelling === "braced" ? bracedForm : bareForm).exec(attribute.lexical)?.groups;
  if (groups === undefined) {
    return undefined;
  }

  const before = groups["before"] ?? "";
  const after = groups["after"] ?? "";
  if (spelling === "braced") {
    return { after: "}", before: "{", name: groups["name"] ?? "" };
  }

  return isSpace(before) && isSpace(after)
    ? { after, before, name: groups["name"] ?? "" }
    : undefined;
};

/**
 * Resolve a referenced name: to a declaration of the document, else to a built-in variable, else
 * to nothing, with the type each gives.
 *
 * @param doc - The document.
 * @param name - The name.
 * @returns The resolution, the type, and the declaration it names, if any.
 */
const resolve = (doc: Document, name: string) => {
  const declared = doc.declarations.get(name);
  const builtIn = builtInsByRoot.get(doc.rootKind)?.get(name);
  if (declared !== undefined) {
    return {
      declared,
      resolution: "declared" as const,
      type: {
        baseType: valueBaseOf(declared.baseType),
        cardinality: valueCardinalityOf(declared.cardinality),
      },
    };
  }

  return builtIn === undefined
    ? { declared, resolution: "unresolved" as const, type: unknownType }
    : { declared, resolution: "builtIn" as const, type: builtIn };
};

/**
 * Build one reference's row, its element's type and a holder's expression type to fill.
 *
 * @param doc - The document.
 * @param node - The element.
 * @param attribute - The attribute it makes the reference by.
 * @returns The row, or none for a literal value and for a name only a declaration with no row
 *   holds (`declarationsOf`).
 */
const referenceOf = (
  doc: Document,
  node: NodeRow<Composed>,
  attribute: AttributeRow<Composed>,
): Addition<typeof VariableRef> | undefined => {
  const spelled = spelledBy(node, attribute);
  if (spelled === undefined || doc.untyped.has(spelled.name)) {
    return undefined;
  }

  const { declared, resolution, type } = resolve(doc, spelled.name);

  return {
    after: spelled.after,
    attribute: attribute.name,
    baseType: type.baseType,
    before: spelled.before,
    cardinality: type.cardinality,
    declBaseType: declared?.baseType ?? "none",
    declCardinality: declared?.cardinality ?? "single",
    declaration: declared?.node ?? nilUuid,
    declarationKind:
      declared?.kind ??
      (resolution === "builtIn"
        ? builtInKindsByRoot.get(doc.rootKind)?.get(spelled.name)
        : undefined) ??
      "qti-outcome-declaration",
    document: doc.id,
    elementBase: "unknown",
    elementCardinality: "unknown",
    heldBase: "unknown",
    heldCardinality: "unknown",
    identifier: spelled.name,
    kind: node.kind,
    language: doc.language.get(node.id) ?? "none",
    lexical: attribute.lexical,
    node: node.id,
    parent: node.parent,
    resolution,
    rootKind: doc.rootKind,
    table: tableOf(node.kind, attribute.name, declared),
    timeDependent: doc.timeDependent,
  };
};

/**
 * The key text of a (node, attribute)-keyed row.
 *
 * @param node - The node.
 * @param attribute - The attribute.
 * @returns Their JSON array.
 */
const pairKey = (node: NodeId, attribute: string): string => JSON.stringify([node, attribute]);

/**
 * Type every expression of a document bottom-up, in reverse document order, so each operand is
 * typed before its operator.
 *
 * @param doc - The document.
 * @param references - Its references, before their element types are filled.
 * @returns Each expression's type.
 */
const typesOf = (
  doc: Document,
  references: ReadonlyMap<string, Addition<typeof VariableRef>>,
): ReadonlyMap<NodeId, Typed> => {
  const typed = new Map<NodeId, Typed>();
  for (const node of doc.rows.nodes.toReversed()) {
    if (expressions.has(node.kind)) {
      typed.set(
        node.id,
        typeOf(node.kind, {
          baseTypeLexical: valueOf(doc, node.id, "base-type"),
          name: valueOf(doc, node.id, "name"),
          operands: elementsOf(doc, node.id).flatMap((child) =>
            expressions.has(child.kind) ? [typed.get(child.id) ?? unknownType] : [],
          ),
          reference: references.get(pairKey(node.id, "identifier")),
        }),
      );
    }
  }

  return typed;
};

/**
 * A node's `nodeRef` tuple, as every overlay row copies it.
 *
 * @param doc - The document.
 * @param node - The node.
 * @returns The tuple.
 */
const tupleOf = (doc: Document, node: NodeRow<Composed>) => ({
  document: doc.id,
  kind: node.kind,
  nearest: doc.folds.get(node.id)?.nearest ?? doc.id,
  node: node.id,
  parent: node.parent,
  start: node.start,
  version: node.version,
});

/**
 * The attributes each kind's type follows from, which `ExpressionAttribute` holds.
 */
const typingAttributes: ReadonlyMap<string, readonly string[]> = new Map([
  ["qti-base-value", ["base-type"]],
  ["qti-math-operator", ["name"]],
  ["qti-test-variables", ["base-type", "weight-identifier"]],
]);

/**
 * The attribute that types each attribute-typed kind, which has a row on every element of the
 * kind, unwritten where the element omits it.
 */
const typeAttributeOf: ReadonlyMap<string, "base-type" | "name"> = new Map([
  ["qti-base-value", "base-type"],
  ["qti-math-operator", "name"],
  ["qti-test-variables", "base-type"],
]);

/**
 * Add a rule's `Processing` row, and a response processing's `ProcessingTemplate` row where it
 * writes a `template`.
 *
 * @param doc - The document.
 * @param node - The rule.
 * @param built - The rows built so far, which this adds to.
 */
const processingRowsOf = (
  doc: Document,
  node: NodeRow<Composed>,
  built: {
    readonly Processing: Map<string, Addition<typeof Processing>>;
    readonly ProcessingTemplate: Map<string, Addition<typeof ProcessingTemplate>>;
  },
): void => {
  built.Processing.set(node.id, {
    ...tupleOf(doc, node),
    language: doc.language.get(node.id) ?? "none",
    parentKind: parentKindOf(doc, node),
  });

  const uri =
    node.kind === "qti-response-processing" ? valueOf(doc, node.id, "template") : undefined;
  if (uri !== undefined) {
    built.ProcessingTemplate.set(node.id, { node: node.id, template: templateOf(uri), uri });
  }
};

/**
 * A node's characters as `Node.chars` holds them: a text's or whitespace's value, an entity
 * reference's `&name;`, and nothing for any other node, so a base value's text is its string
 * value.
 *
 * @param doc - The document.
 * @param node - The node.
 * @returns Its characters.
 */
const charsOf = (doc: Document, node: NodeId): string => {
  const text =
    doc.rows.texts.find((row) => row.node === node) ??
    doc.rows.whitespace.find((row) => row.node === node);
  if (text !== undefined) {
    return text.value;
  }

  const reference = doc.rows.entityRefs.find((row) => row.node === node);

  return reference === undefined ? "" : `&${reference.name};`;
};

/**
 * Add an expression's rows: its `Expression` row, its `Operand` row where its parent is an
 * expression, an `ExpressionAttribute` row for each attribute its type follows from, and a base
 * value's `Literal` row, with its `LiteralTyped` where its `base-type` spells a base.
 *
 * @param doc - The document.
 * @param node - The expression.
 * @param type - Its type.
 * @param built - The rows built so far, which this adds to.
 */
const expressionRowsOf = (
  doc: Document,
  node: NodeRow<Composed>,
  type: Typed,
  built: {
    readonly Expression: Map<string, Addition<typeof Expression>>;
    readonly ExpressionAttribute: Map<string, Addition<typeof ExpressionAttribute>>;
    readonly Literal: Map<string, Addition<typeof Literal>>;
    readonly LiteralTyped: Map<string, Addition<typeof LiteralTyped>>;
    readonly Operand: Map<string, Addition<typeof Operand>>;
  },
): void => {
  const parentKind = parentKindOf(doc, node);
  const language = doc.language.get(node.id) ?? "none";
  const own = { ...type, kind: node.kind, language, node: node.id, parent: node.parent };
  built.Expression.set(node.id, { ...tupleOf(doc, node), ...type, language, parentKind });

  if (expressions.has(parentKind)) {
    built.Operand.set(node.id, {
      ...type,
      children: BigInt(elementsOf(doc, node.id).length),
      kind: node.kind,
      language,
      node: node.id,
      operator: node.parent,
      rank: BigInt(elementsOf(doc, node.parent).findIndex(({ id }) => id === node.id) + 1),
    });
  }

  for (const name of typingAttributes.get(node.kind) ?? []) {
    const attribute = doc.attributes.get(node.id)?.get(name);
    if (attribute !== undefined) {
      built.ExpressionAttribute.set(pairKey(node.id, name), {
        ...own,
        attribute: attribute.name,
        lexical: attribute.lexical,
        written: true,
      });
    }
  }

  const typing = typeAttributeOf.get(node.kind);
  if (typing !== undefined && !built.ExpressionAttribute.has(pairKey(node.id, typing))) {
    built.ExpressionAttribute.set(pairKey(node.id, typing), {
      ...own,
      attribute: typing,
      lexical: "",
      written: false,
    });
  }

  if (node.kind === "qti-base-value") {
    const text = (doc.childrenOf.get(node.id) ?? []).map(({ id }) => charsOf(doc, id)).join("");
    built.Literal.set(node.id, { ...own, text });
    if (type.baseType !== "unknown") {
      built.LiteralTyped.set(node.id, {
        baseType: type.baseType,
        node: node.id,
        text,
        typeCode: baseTypeOf(valueOf(doc, node.id, "base-type")),
      });
    }
  }
};

/**
 * An item's `ItemTiming` row, keyed by its root's node: its `time-dependent` as written and the
 * code it spells; none for a document that is no item, or an item that omits the attribute, which
 * AL3 refuses.
 *
 * @param doc - The document.
 * @returns The row, by its node.
 */
const itemTimingOf = (doc: Document): Map<string, Addition<typeof ItemTiming>> => {
  const attribute = doc.rows.attributes.find(
    ({ name, node }) => name === "time-dependent" && doc.byId.get(node)?.kind === itemKind,
  );

  return attribute === undefined
    ? new Map<string, Addition<typeof ItemTiming>>()
    : new Map<string, Addition<typeof ItemTiming>>([
        [
          attribute.node,
          {
            document: doc.id,
            lexical: attribute.lexical,
            node: attribute.node,
            timeDependent: doc.timeDependent,
          },
        ],
      ]);
};

/**
 * Fill a reference's element type, an expression's own, and a setter's or a lookup's one
 * expression's type, once every expression is typed.
 *
 * @param doc - The document.
 * @param typed - Each expression's type.
 * @param reference - The reference's row.
 * @returns The row with both filled, `unknown` where its element holds none.
 */
const withTypes = (
  doc: Document,
  typed: ReadonlyMap<NodeId, Typed>,
  reference: Addition<typeof VariableRef>,
): Addition<typeof VariableRef> => {
  const element = typed.get(reference.node);
  const holding = holders.has(reference.kind) && reference.attribute === "identifier";
  const operand = holding ? elementsOf(doc, reference.node)[0] : undefined;
  const holds = operand === undefined ? undefined : typed.get(operand.id);

  return {
    ...reference,
    elementBase: element?.baseType ?? "unknown",
    elementCardinality: element?.cardinality ?? "unknown",
    heldBase: holds?.baseType ?? "unknown",
    heldCardinality: holds?.cardinality ?? "unknown",
  };
};

/**
 * The key text of a (document, name)-keyed row, a lookup's.
 *
 * @param document - The document, or the test or item ref, the name is looked up in.
 * @param name - The name.
 * @returns Their JSON array.
 */
export const lookupKey = (document: NodeId, name: string): string =>
  JSON.stringify([document, name]);

/**
 * A declaration lookup's row where the document declares the name: the declaration and its codes.
 *
 * @param document - The document.
 * @param name - The name.
 * @param declared - The declaration.
 * @returns The row.
 */
const declaredLookup = (
  document: NodeId,
  name: string,
  declared: DeclarationEntry,
): Addition<typeof VariableLookup> => ({
  baseType: declared.baseType,
  cardinality: declared.cardinality,
  declaration: declared.node,
  declarationKind: declared.kind,
  declared: true,
  document,
  name,
});

/**
 * A declaration lookup's row where the document declares no such name: the document itself, and
 * the null objects.
 *
 * @param document - The document.
 * @param name - The name.
 * @returns The row.
 */
export const absentLookup = (document: NodeId, name: string): Addition<typeof VariableLookup> => ({
  baseType: "none",
  cardinality: "single",
  declaration: document,
  declarationKind: "qti-outcome-declaration",
  declared: false,
  document,
  name,
});

/**
 * Write a document's declaration lookups: one forced in per declaration it holds, by collapsed
 * identifier, and one absent row per name a reference claims it does not declare, one built in or
 * none (M2: the claim is proved by the key).
 *
 * @param doc - The document.
 * @param references - Its references.
 * @returns The rows, by `[document, name]`.
 */
const variableLookupsOf = (
  doc: Document,
  references: ReadonlyMap<string, Addition<typeof VariableRef>>,
): ReadonlyMap<string, Addition<typeof VariableLookup>> => {
  const lookups = new Map<string, Addition<typeof VariableLookup>>();
  for (const [name, declared] of doc.declarations) {
    lookups.set(lookupKey(doc.id, name), declaredLookup(doc.id, name, declared));
  }

  for (const reference of references.values()) {
    if (reference.resolution !== "declared") {
      lookups.set(
        lookupKey(doc.id, reference.identifier),
        absentLookup(doc.id, reference.identifier),
      );
    }
  }

  return lookups;
};

/**
 * The lookup table a declaration holds: its match table, else its interpolation table, else none.
 *
 * @param held - The tables it holds.
 * @returns The `ReferencedTable` handle.
 */
const lookupOf = (held: ReadonlySet<string>): ReferencedTable => heldTableOf(lookupKind, held);

/**
 * The kinds that read a table of their variable's declaration.
 */
const tableReaderKinds: ReadonlySet<string> = new Set(tablesRead.keys());

/**
 * Write a document's declaration tables: a row for every declaration with a `Declaration` row that
 * holds a table, and for every such declaration a map response or a lookup names, each slot the
 * table the declaration holds there or `none`.
 *
 * @param doc - The document.
 * @param references - Its references.
 * @returns The rows, by declaration.
 */
const declarationTablesOf = (
  doc: Document,
  references: ReadonlyMap<string, Addition<typeof VariableRef>>,
): ReadonlyMap<string, Addition<typeof DeclarationTable>> => {
  const named = new Set(
    [...references.values()].flatMap((reference) =>
      reference.resolution === "declared" &&
      reference.attribute === "identifier" &&
      tableReaderKinds.has(reference.kind)
        ? [reference.declaration]
        : [],
    ),
  );
  const typed = new Set([...doc.declarations.values()].map(({ node }) => node));
  const tables = new Map<string, Addition<typeof DeclarationTable>>();
  for (const node of doc.rows.nodes.filter(({ id }) => typed.has(id))) {
    const held = new Set(
      (doc.childrenOf.get(node.id) ?? []).flatMap(({ kind }) =>
        tableKinds.has(kind) ? [kind] : [],
      ),
    );
    if (declarationKinds.has(node.kind) && (held.size > 0 || named.has(node.id))) {
      tables.set(node.id, {
        areaMapping: held.has("qti-area-mapping") ? "qti-area-mapping" : "none",
        declaration: node.id,
        lookup: lookupOf(held),
        mapping: held.has("qti-mapping") ? "qti-mapping" : "none",
      });
    }
  }

  return tables;
};

/**
 * Write a document's `section-identifier`s, each split around the name it spells.
 *
 * @param doc - The document.
 * @returns The rows, by node.
 */
const sectionIdentifiersOf = (doc: Document): Map<string, Addition<typeof SectionIdentifier>> =>
  new Map(
    doc.rows.attributes.flatMap((attribute) => {
      const node = doc.byId.get(attribute.node);
      if (attribute.name !== "section-identifier" || node === undefined) {
        return [];
      }

      const { lead, name, trail } = piecesOf(attribute.lexical);

      return [
        [
          node.id,
          {
            after: trail,
            attribute: attribute.name,
            before: lead,
            document: doc.id,
            identifier: name,
            kind: node.kind,
            lexical: attribute.lexical,
            node: node.id,
            rootKind: doc.rootKind,
          },
        ] as const,
      ];
    }),
  );

/**
 * Write the references of a test or a section document, which resolve against each test that places
 * it: its variable references and its `section-identifier`s; none for any other document.
 *
 * @param doc - The document.
 * @param references - Its variable references.
 * @param sectionIdentifiers - Its `section-identifier`s.
 * @returns The rows, by `[node, attribute]`.
 */
const testReferencesOf = (
  doc: Document,
  references: ReadonlyMap<string, Addition<typeof VariableRef>>,
  sectionIdentifiers: ReadonlyMap<string, Addition<typeof SectionIdentifier>>,
): ReadonlyMap<string, Addition<typeof TestReference>> => {
  const rows = new Map<string, Addition<typeof TestReference>>();
  if (!tests.has(doc.rootKind)) {
    return rows;
  }

  for (const v of references.values()) {
    rows.set(pairKey(v.node, v.attribute), {
      attribute: v.attribute,
      document: v.document,
      identifier: v.identifier,
      kind: v.kind,
      node: v.node,
      role: "variable",
      rootKind: v.rootKind,
    });
  }

  for (const named of sectionIdentifiers.values()) {
    rows.set(pairKey(named.node, named.attribute), {
      attribute: named.attribute,
      document: named.document,
      identifier: named.identifier,
      kind: named.kind,
      node: named.node,
      role: "section",
      rootKind: named.rootKind,
    });
  }

  return rows;
};

/**
 * Build the rows of every expression and processing overlay of one document.
 *
 * An expression's type is derived after its operands', and a reference's element type and a
 * holder's expression type are filled once their expressions are typed, so each rule the laws
 * state reads values already derived.
 *
 * @param tree - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (tree: XdmDocument<Composed>, ids: ExpressionIds): ExpressionRows => {
  const doc = documentOf(tree, ids);
  const references = new Map<string, Addition<typeof VariableRef>>();
  for (const node of doc.rows.nodes) {
    for (const attribute of doc.attributes.get(node.id)?.values() ?? []) {
      const reference = referenceOf(doc, node, attribute);
      if (reference !== undefined) {
        references.set(pairKey(node.id, attribute.name), reference);
      }
    }
  }

  const typed = typesOf(doc, references);
  for (const [at, reference] of references) {
    references.set(at, withTypes(doc, typed, reference));
  }

  const built = {
    Expression: new Map<string, Addition<typeof Expression>>(),
    ExpressionAttribute: new Map<string, Addition<typeof ExpressionAttribute>>(),
    ItemTiming: itemTimingOf(doc),
    Literal: new Map<string, Addition<typeof Literal>>(),
    LiteralTyped: new Map<string, Addition<typeof LiteralTyped>>(),
    Operand: new Map<string, Addition<typeof Operand>>(),
    Processing: new Map<string, Addition<typeof Processing>>(),
    ProcessingTemplate: new Map<string, Addition<typeof ProcessingTemplate>>(),
    VariableRef: references,
  };
  for (const node of doc.rows.nodes) {
    if (rules.has(node.kind)) {
      processingRowsOf(doc, node, built);
    }

    const type = typed.get(node.id);
    if (type !== undefined) {
      expressionRowsOf(doc, node, type, built);
    }
  }

  const sectionIdentifiers = sectionIdentifiersOf(doc);

  return {
    ...built,
    DeclarationTable: declarationTablesOf(doc, references),
    ReferenceDocument: tests.has(doc.rootKind)
      ? new Map([[doc.id, { document: doc.id }]])
      : new Map<string, Addition<typeof ReferenceDocument>>(),
    SectionIdentifier: sectionIdentifiers,
    TestReference: testReferencesOf(doc, references, sectionIdentifiers),
    VariableLookup: variableLookupsOf(doc, references),
  };
};

/**
 * One document as the package-level builder reads it: its expression rows, its test rows, its
 * tree and the ids its rows are written under.
 */
export interface AssembledExpressionInput {
  readonly expressions: ExpressionRows;
  readonly ids: TestIds;
  readonly tests: TestRows;
  readonly tree: XdmDocument<Composed>;
}

/**
 * A resource of the package as an item ref's target reads it: the path its href names and its
 * type (`TypedHref`'s, the package builder's).
 */
export interface NamedResource {
  readonly path: string;
  readonly type: Addition<typeof ItemRefTarget>["type"];
}

/**
 * A name piece of a reference as its owner nests it: every written field but the owner's key.
 */
export type SegmentMember = Omit<
  Addition<typeof ReferenceSegment>,
  "assembly" | "attribute" | "node"
>;

/**
 * A reference as one test reads it, its name's pieces nested at `segments` in order.
 */
export type AssembledReferenceRow = Addition<typeof AssembledReference> & {
  readonly segments: readonly SegmentMember[];
};

/**
 * The rows a package's documents build together, one keyed set per relation: what a test reads
 * of every document it places, and what its item refs read of the items they name. A
 * `VariableLookup` row here is a probe of a name no document's own rows hold; every other key of it
 * is the document builder's.
 */
export interface AssembledExpressionRows {
  readonly AssembledReference: ReadonlyMap<string, AssembledReferenceRow>;
  readonly ItemRefDocument: ReadonlyMap<string, Addition<typeof ItemRefDocument>>;
  readonly ItemRefTarget: ReadonlyMap<string, Addition<typeof ItemRefTarget>>;
  readonly MappingItemRef: ReadonlyMap<string, Addition<typeof MappingItemRef>>;
  readonly MappingLookup: ReadonlyMap<string, Addition<typeof MappingLookup>>;
  readonly MappingSourceDeclaration: ReadonlyMap<string, Addition<typeof MappingSourceDeclaration>>;
  readonly NameLookup: ReadonlyMap<string, Addition<typeof NameLookup>>;
  readonly PlacedDocument: ReadonlyMap<string, Addition<typeof PlacedDocument>>;
  readonly PlacedReference: ReadonlyMap<string, Addition<typeof PlacedReference>>;
  readonly Reading: ReadonlyMap<string, Addition<typeof Reading>>;
  readonly TemplateDefault: ReadonlyMap<string, Addition<typeof TemplateDefault>>;
  readonly TemplateDefaultTarget: ReadonlyMap<string, Addition<typeof TemplateDefaultTarget>>;
  readonly VariableLookup: ReadonlyMap<string, Addition<typeof VariableLookup>>;
}

/**
 * The setters, whose prefixed readings resolve nothing.
 */
const setters: ReadonlySet<string> = new Set(setterKinds);

/**
 * The built-in names a test's unsplit references reach.
 */
const testBuiltInNames: ReadonlySet<string> = new Set(builtInsByRoot.get(testKind)?.keys());

/**
 * The built-in names an item ref's prefix reaches: its item's.
 */
const itemBuiltInNames: ReadonlySet<string> = new Set(builtInsByRoot.get(itemKind)?.keys());

/**
 * The kinds a prefix names a `duration` of (spec reading 86 for the section ref).
 */
const durationScopes: ReadonlySet<string> = new Set([partKind, sectionKind, sectionRefKind]);

/**
 * A name piece of all digits.
 */
const digits = /^[0-9]+$/u;

/**
 * The lookups the package-level builder reads and the probes it writes.
 */
interface Lookups {
  readonly declarations: ReadonlyMap<string, Addition<typeof VariableLookup>>;
  readonly items: ReadonlyMap<string, NodeId>;
  readonly mappings: Map<string, Addition<typeof MappingLookup>>;
  /**
   * Each mapping whose source its item declares, by its item ref and its target: the declaration a
   * mapped reading reads.
   */
  readonly mappingSources: Map<string, Addition<typeof MappingSourceDeclaration>>;
  readonly names: Map<string, Addition<typeof NameLookup>>;
  readonly probes: Map<string, Addition<typeof VariableLookup>>;
  readonly targets: ReadonlyMap<string, Addition<typeof ItemRefTarget>["type"]>;
  readonly timing: ReadonlyMap<string, boolean>;
}

/**
 * Look a name up in a document's declarations, writing an absent probe where it declares none.
 *
 * @param lookups - The lookups.
 * @param document - The document.
 * @param name - The name.
 * @returns The lookup's row.
 */
const declarationProbe = (
  lookups: Lookups,
  document: NodeId,
  name: string,
): Addition<typeof VariableLookup> => {
  const key = lookupKey(document, name);
  const held = lookups.declarations.get(key);
  if (held?.declared === true) {
    return held;
  }

  const absent = absentLookup(document, name);
  lookups.probes.set(key, absent);

  return absent;
};

/**
 * Look a name up in an item ref's mappings, writing an absent probe where it maps none.
 *
 * @param lookups - The lookups.
 * @param itemRef - The item ref.
 * @param name - The name.
 * @returns The lookup's row.
 */
const mappingProbe = (
  lookups: Lookups,
  itemRef: NodeId,
  name: string,
): Addition<typeof MappingLookup> => {
  const key = lookupKey(itemRef, name);
  const held = lookups.mappings.get(key);
  if (held !== undefined) {
    return held;
  }

  const absent: Addition<typeof MappingLookup> = { itemRef, mapped: false, name };
  lookups.mappings.set(key, absent);

  return absent;
};

/**
 * Look a name up in a test's assembly, writing an absent probe where it holds none.
 *
 * @param lookups - The lookups.
 * @param assembly - The test's document node.
 * @param name - The name.
 * @returns The lookup's row.
 */
const nameProbe = (
  lookups: Lookups,
  assembly: NodeId,
  name: string,
): Addition<typeof NameLookup> => {
  const key = lookupKey(assembly, name);
  const held = lookups.names.get(key);
  if (held !== undefined) {
    return held;
  }

  const absent: Addition<typeof NameLookup> = {
    assembly,
    found: false,
    instance: assembly,
    itemDocument: assembly,
    kind: "document",
    name,
    node: assembly,
    placements: 0n,
    replaced: false,
    resourceType: "none",
  };
  lookups.names.set(key, absent);

  return absent;
};

/**
 * One reading's text before its probes: its form, the dot it splits at, and its pieces.
 */
interface ReadingText {
  readonly form: Addition<typeof Reading>["form"];
  readonly number: string;
  readonly scope: string;
  readonly split: number;
  readonly variable: string;
}

/**
 * List every reading of a test-level reference (spec readings 48 and 88): a `section-identifier`'s
 * one name reading; a variable's unsplit reading, its split at every dot, and its numbered reading
 * at every dot followed by a piece of digits and then another dot.
 *
 * @param identifier - The name.
 * @param role - What the reference names.
 * @returns The readings, in form and split order.
 */
export const readingTextsOf = (
  identifier: string,
  role: Addition<typeof TestReference>["role"],
): readonly ReadingText[] => {
  if (role === "section") {
    return [{ form: "name", number: "", scope: identifier, split: 0, variable: "" }];
  }

  const pieces = identifier.split(".");
  const joined = (from: number, to?: number) => pieces.slice(from, to).join(".");

  return [
    { form: "unsplit", number: "", scope: "", split: 0, variable: identifier },
    ...pieces.slice(1).map((_, at) => ({
      form: "split" as const,
      number: "",
      scope: joined(0, at + 1),
      split: at + 1,
      variable: joined(at + 1),
    })),
    ...pieces.slice(1, -1).flatMap((piece, at) =>
      digits.test(piece)
        ? [
            {
              form: "numbered" as const,
              number: piece,
              scope: joined(0, at + 1),
              split: at + 1,
              variable: joined(at + 2),
            },
          ]
        : [],
    ),
  ];
};

/**
 * A reading's scope as its name probe reads it.
 */
type Scope = Pick<
  Addition<typeof NameLookup>,
  "found" | "itemDocument" | "kind" | "node" | "placements" | "replaced" | "resourceType"
>;

/**
 * Read a reading's scope: the test itself for an unsplit reading, else its name in the assembly.
 *
 * @param lookups - The lookups, which this adds probes to.
 * @param assembly - The test's document node.
 * @param text - The reading's text.
 * @returns The scope.
 */
const scopeOf = (lookups: Lookups, assembly: NodeId, text: ReadingText): Scope =>
  text.form === "unsplit"
    ? {
        found: true,
        itemDocument: assembly,
        kind: testKind,
        node: assembly,
        placements: 1n,
        replaced: false,
        resourceType: "none",
      }
    : nameProbe(lookups, assembly, text.scope);

/**
 * Whether a reading's variable is a built-in its scope holds: the test's, unsplit; the item's,
 * through an item ref; a part's or a section's `duration`.
 *
 * @param text - The reading's text.
 * @param scope - Its scope.
 * @param itemScoped - Whether its scope is a found item ref.
 * @returns Whether it is.
 */
const builtInOf = (text: ReadingText, scope: Scope, itemScoped: boolean): boolean => {
  if (text.form === "unsplit") {
    return testBuiltInNames.has(text.variable);
  }

  if (itemScoped) {
    return itemBuiltInNames.has(text.variable);
  }

  return (
    text.form === "split" &&
    scope.found &&
    durationScopes.has(scope.kind) &&
    text.variable === "duration"
  );
};

/**
 * What a reading's variable is, and the codes of the declaration that types it: declared, else
 * mapped, else built in, else none, the null objects where no declaration types it. A mapped
 * variable's declaration is its mapping's source's; a mapping whose source its item declares
 * nothing under has none, so its reading holds the null objects, and the law that refuses the
 * mapping refuses the reading's claim to it ("Variable mapping source").
 *
 * @param declared - Its declaration lookup, where it reads one.
 * @param mapped - Its mapping lookup, where it reads one.
 * @param mappedSource - Its mapping's source declaration, where its item declares one.
 * @param builtIn - The declaration kind of the built-in of its scope it names, if any.
 * @param scope - Its scope.
 * @returns The source and the codes.
 */
const sourceOf = (
  declared: Addition<typeof VariableLookup> | undefined,
  mapped: Addition<typeof MappingLookup> | undefined,
  mappedSource: Addition<typeof MappingSourceDeclaration> | undefined,
  builtIn: Addition<typeof Reading>["declarationKind"] | undefined,
  scope: Scope,
): Pick<
  Addition<typeof Reading>,
  "declBaseType" | "declCardinality" | "declaration" | "declarationKind" | "source"
> => {
  if (declared?.declared === true) {
    return {
      declBaseType: declared.baseType,
      declCardinality: declared.cardinality,
      declaration: declared.declaration,
      declarationKind: declared.declarationKind,
      source: "declared",
    };
  }

  if (mapped?.mapped === true) {
    return mappedSource === undefined
      ? {
          declBaseType: "none",
          declCardinality: "single",
          declaration: scope.itemDocument,
          declarationKind: "qti-outcome-declaration",
          source: "mapped",
        }
      : {
          declBaseType: mappedSource.declBaseType,
          declCardinality: mappedSource.declCardinality,
          declaration: mappedSource.declaration,
          declarationKind: mappedSource.declarationKind,
          source: "mapped",
        };
  }

  return {
    declBaseType: "none",
    declCardinality: "single",
    declaration: scope.itemDocument,
    declarationKind: builtIn ?? "qti-outcome-declaration",
    source: builtIn === undefined ? "none" : "builtIn",
  };
};

/**
 * The root whose built-ins a reading's scope holds: a test's, unsplit; an item's, through an item
 * ref; a section's, for a part's, a section's or a section ref's `duration`.
 *
 * @param text - The reading's text.
 * @param itemScoped - Whether its scope is a found item ref.
 * @returns The root's kind.
 */
const builtInRootOf = (text: ReadingText, itemScoped: boolean): string => {
  if (text.form === "unsplit") {
    return testKind;
  }

  return itemScoped ? itemKind : sectionKind;
};

/**
 * Read one reading of a reference by one test: its scope in the assembly, its variable in the
 * test's or the item's declarations and the item ref's mappings, and the source those give.
 *
 * @param lookups - The lookups, which this adds probes to.
 * @param assembly - The test's document node.
 * @param reference - The reference.
 * @param text - The reading's text.
 * @returns The reading's row.
 */
const readingOf = (
  lookups: Lookups,
  assembly: NodeId,
  reference: Addition<typeof TestReference>,
  text: ReadingText,
): Addition<typeof Reading> => {
  const scope = scopeOf(lookups, assembly, text);
  const itemScoped =
    text.form !== "unsplit" && text.form !== "name" && scope.found && scope.kind === itemRefKind;
  const itemHeld = itemScoped && scope.resourceType === itemResourceType;
  const declared =
    text.form === "unsplit" || itemHeld
      ? declarationProbe(lookups, scope.itemDocument, text.variable)
      : undefined;
  const mapped = itemScoped ? mappingProbe(lookups, scope.node, text.variable) : undefined;
  const typed = sourceOf(
    declared,
    mapped,
    itemScoped ? lookups.mappingSources.get(lookupKey(scope.node, text.variable)) : undefined,
    builtInOf(text, scope, itemScoped)
      ? builtInKindsByRoot.get(builtInRootOf(text, itemScoped))?.get(text.variable)
      : undefined,
    scope,
  );
  const timed = itemHeld && typed.source === "builtIn" && text.variable === "duration";

  return {
    ...typed,
    assembly,
    attribute: reference.attribute,
    declared: declared?.declared ?? false,
    form: text.form,
    found: scope.found,
    identifier: reference.identifier,
    kind: reference.kind,
    lookupDocument: scope.itemDocument,
    mapped: mapped?.mapped ?? false,
    named: scope.node,
    namedKind: scope.kind,
    node: reference.node,
    number: text.number,
    placements: scope.placements,
    replaced: scope.replaced,
    resourceType: scope.resourceType,
    role: reference.role,
    scope: text.scope,
    split: BigInt(text.split),
    timeDependent: timed && (lookups.timing.get(scope.itemDocument) ?? false),
    variable: text.variable,
  };
};

/**
 * A reference as one test reads it: its row with its name's pieces nested, and its readings by
 * `[assembly, node, attribute, form, split]`.
 */
interface ReadReference {
  readonly readings: ReadonlyMap<string, Addition<typeof Reading>>;
  readonly row: AssembledReferenceRow;
}

/**
 * Write a reference as one test reads it: its row, its name's pieces nested, and its readings.
 *
 * @param lookups - The lookups.
 * @param assembly - The test's document node.
 * @param reference - The reference.
 * @returns The row, and its readings by `[assembly, node, attribute, form, split]`.
 */
const assembledReferenceOf = (
  lookups: Lookups,
  assembly: NodeId,
  reference: Addition<typeof TestReference>,
): ReadReference => {
  const pieces = reference.role === "variable" ? reference.identifier.split(".") : [];
  const segments = pieces.map((piece, at): SegmentMember => ({
    digit: at > 0 && digits.test(piece),
    piece,
    separator: at === 0 ? "" : ".",
    token: at === 0 ? piece : `.${piece}`,
  }));
  const readings = readingTextsOf(reference.identifier, reference.role).map((text) =>
    readingOf(lookups, assembly, reference, text),
  );

  return {
    readings: new Map(
      readings.map((reading) => [
        JSON.stringify([
          assembly,
          reading.node,
          reading.attribute,
          reading.form,
          String(reading.split),
        ]),
        reading,
      ]),
    ),
    row: {
      assembly,
      attribute: reference.attribute,
      document: reference.document,
      identifier: reference.identifier,
      kind: reference.kind,
      lastDigit: segments.at(-1)?.digit ?? false,
      node: reference.node,
      role: reference.role,
      rootKind: reference.rootKind,
      segments,
    },
  };
};

/**
 * Walk an assembly's instance tree in pre-order.
 *
 * @param member - The instance.
 * @returns It and every instance below it.
 */
const instancesIn = (
  member: InstanceMember | InstanceRoot,
): readonly (InstanceMember | InstanceRoot)[] => [member, ...member.children.flatMap(instancesIn)];

/**
 * A test's template defaults, each by its node: its row, and its target, the template declaration
 * of the item its item ref names, where that item declares a variable of its name.
 */
interface TemplateDefaultRows {
  readonly targets: readonly (readonly [string, Addition<typeof TemplateDefaultTarget>])[];
  readonly templateDefaults: readonly (readonly [string, Addition<typeof TemplateDefault>])[];
}

/**
 * Write a test's template defaults, each that writes its `template-identifier`, which every one
 * must (AL3): its row, and its target where its item ref names an item that declares a variable of
 * its template's name and it holds its expression, with that declaration and the expression's
 * type. A template default with no target has none: no value stands for the declaration it lacks,
 * so "Template default target" refuses it, and its row says nothing of an item.
 *
 * @param input - A document.
 * @param lookups - The lookups.
 * @returns The rows, by node.
 */
const templateDefaultsOf = (
  input: AssembledExpressionInput,
  lookups: Lookups,
): TemplateDefaultRows => {
  const rows = flatten(input.tree, input.ids.idOf);
  const held = new Map(
    [...input.expressions.Expression.values()]
      .filter(({ parentKind }) => parentKind === "qti-template-default")
      .map((row) => [row.parent, row] as const),
  );
  const written = rows.attributes.filter(({ name }) => name === "template-identifier");
  const defaults = rows.nodes.flatMap((node) => {
    const attribute =
      node.kind === "qti-template-default"
        ? written.find(({ node: owner }) => owner === node.id)
        : undefined;

    return attribute === undefined
      ? []
      : [{ lexical: attribute.lexical, node, pieces: piecesOf(attribute.lexical) }];
  });

  return {
    targets: defaults.flatMap(({ node, pieces }) => {
      const itemDocument = lookups.items.get(node.parent);
      const declared =
        itemDocument === undefined
          ? undefined
          : lookups.declarations.get(lookupKey(itemDocument, pieces.name));
      const expression = held.get(node.id);

      return itemDocument === undefined || declared?.declared !== true || expression === undefined
        ? []
        : [
            [
              node.id,
              {
                declBaseType: declared.baseType,
                declCardinality: declared.cardinality,
                declaration: declared.declaration,
                declarationKind: declared.declarationKind,
                heldBase: expression.baseType,
                heldCardinality: expression.cardinality,
                itemDocument,
                itemRef: node.parent,
                node: node.id,
                template: pieces.name,
              },
            ] as const,
          ];
    }),
    templateDefaults: defaults.map(
      ({ lexical, node, pieces: { lead, name, trail } }) =>
        [
          node.id,
          { itemRef: node.parent, lead, lexical, node: node.id, template: name, trail },
        ] as const,
    ),
  };
};

/**
 * What each item ref names, by the item ref's node: its target, and its item where it names one.
 */
interface ItemRefRows {
  readonly itemRefDocuments: ReadonlyMap<string, Addition<typeof ItemRefDocument>>;
  readonly itemRefTargets: ReadonlyMap<string, Addition<typeof ItemRefTarget>>;
}

/**
 * Write what each item ref names (the UP audit's B2 and B3), each a row only where the package
 * holds it (lane NIL's NS3: a missing value is a row of its own relation, never a sentinel): its
 * href's path and the type of the resource of the package whose href's path that is, an item's
 * before an LTI link's before any other, and none where no resource names it; and, for an item,
 * the document there, and none where the package holds no document at that path. "Item ref target"
 * refuses an item ref with no target, or of the item type with no document.
 *
 * @param documents - Every document of the package.
 * @param resources - The package's resources.
 * @returns Each item ref's target, and each item ref's item, by the item ref's node.
 */
const itemRefTargetsOf = (
  documents: readonly AssembledExpressionInput[],
  resources: Iterable<NamedResource>,
): ItemRefRows => {
  const typesAt = Map.groupBy(resources, ({ path }) => path);
  const preferred = [itemResourceType, ...linkResourceTypes];
  const itemRefTargets = new Map<string, Addition<typeof ItemRefTarget>>();
  const itemRefDocuments = new Map<string, Addition<typeof ItemRefDocument>>();
  for (const { ids, tree } of documents) {
    for (const href of itemRefPathsOf(tree, ids)) {
      const types = (typesAt.get(href.path) ?? []).map(({ type }) => type);
      const type = preferred.find((wanted) => types.includes(wanted)) ?? types[0];
      if (type !== undefined) {
        itemRefTargets.set(href.node, {
          node: href.node,
          package: href.package,
          path: href.path,
          type,
        });
      }

      const document = type === itemResourceType ? ids.documentAt(href.path) : Option.none();
      if (Option.isSome(document)) {
        itemRefDocuments.set(href.node, {
          document: document.value,
          node: href.node,
          package: href.package,
          path: href.path,
        });
      }
    }
  }

  return { itemRefDocuments, itemRefTargets };
};

/**
 * Read the lookups a package's documents hold: each document's declarations and its items'
 * timing, and what each item ref names.
 *
 * @param documents - Every document of the package.
 * @param items - What each item ref names.
 * @returns The lookups, no probe written yet.
 */
const lookupsOf = (
  documents: readonly AssembledExpressionInput[],
  items: ItemRefRows,
): Lookups => ({
  declarations: new Map(documents.flatMap((input) => [...input.expressions.VariableLookup])),
  items: new Map(
    [...items.itemRefDocuments.values()].map(({ document, node }) => [node, document]),
  ),
  mappingSources: new Map(),
  mappings: new Map(),
  names: new Map(),
  probes: new Map(),
  targets: new Map([...items.itemRefTargets.values()].map(({ node, type }) => [node, type])),
  timing: new Map(
    documents.flatMap((input) =>
      [...input.expressions.ItemTiming.values()].map(
        ({ document, timeDependent }) => [document, timeDependent] as const,
      ),
    ),
  ),
});

/**
 * Write each variable mapping's source in the item it maps, where its item ref names an item that
 * declares a variable of its source's name, with that declaration and whether the item declares
 * its target too; and force its target into the item ref's mapping lookups, a mapping whose source
 * is undeclared included, since the item ref maps the name all the same. A mapping with no source
 * declaration has none: no value stands for it, so "Variable mapping source" refuses it.
 *
 * @param documents - Every document of the package.
 * @param lookups - The lookups, which this adds to.
 * @returns The source declarations, by the mapping's node.
 */
const mappingSourcesOf = (
  documents: readonly AssembledExpressionInput[],
  lookups: Lookups,
): ReadonlyMap<string, Addition<typeof MappingSourceDeclaration>> => {
  const sources = new Map<string, Addition<typeof MappingSourceDeclaration>>();
  for (const input of documents) {
    for (const mapping of input.tests.VariableMapping.values()) {
      const key = lookupKey(mapping.parent, mapping.target);
      lookups.mappings.set(key, { itemRef: mapping.parent, mapped: true, name: mapping.target });

      const itemDocument = lookups.items.get(mapping.parent);
      const source =
        itemDocument === undefined
          ? undefined
          : lookups.declarations.get(lookupKey(itemDocument, mapping.source));

      if (itemDocument !== undefined && source?.declared === true) {
        const row: Addition<typeof MappingSourceDeclaration> = {
          declBaseType: source.baseType,
          declCardinality: source.cardinality,
          declaration: source.declaration,
          declarationKind: source.declarationKind,
          itemDocument,
          itemRef: mapping.parent,
          node: mapping.node,
          source: mapping.source,
          target: mapping.target,
          targetDeclared: declarationProbe(lookups, itemDocument, mapping.target).declared,
        };
        sources.set(mapping.node, row);
        lookups.mappingSources.set(key, row);
      }
    }
  }

  return sources;
};

/**
 * Write what each variable mapping's item ref names, its `ItemRefTarget`'s type, which leaves a
 * mapping under an LTI link unchecked (spec reading 110). A mapping whose item ref has no target
 * has none, and "Item ref target" refuses it with its item ref.
 *
 * @param documents - Every document of the package.
 * @param lookups - The lookups, which hold each item ref's target.
 * @returns The mappings' item refs, by the mapping's node.
 */
const mappingItemRefsOf = (
  documents: readonly AssembledExpressionInput[],
  lookups: Lookups,
): ReadonlyMap<string, Addition<typeof MappingItemRef>> =>
  new Map(
    documents.flatMap((input) =>
      [...input.tests.VariableMapping.values()].flatMap((mapping) => {
        const type = lookups.targets.get(mapping.parent);

        return type === undefined
          ? []
          : [[mapping.node, { itemRef: mapping.parent, node: mapping.node, type }] as const];
      }),
    ),
  );

/**
 * Force every written element of every test's assembly into the name lookups: its node, kind and
 * placements, one instance that places it and whether a replacement can repeat it there, and,
 * for an item ref, what it names. An item ref of the item type whose item the package holds no
 * document of takes the test itself as its item, `NameLookup`'s null object for "no item"
 * (`representation-gaps.md` §4.3), which `ItemRefDocument` holds no row of, so "Item ref target"
 * refuses it as it refuses the item ref.
 *
 * @param documents - Every document of the package.
 * @param assembled - The package's assemblies.
 * @param lookups - The lookups, which this adds to.
 */
const forceNames = (
  documents: readonly AssembledExpressionInput[],
  assembled: AssembledRows,
  lookups: Lookups,
): void => {
  const kinds = new Map(
    documents.flatMap((input) =>
      [...input.tests.Named.values()].map(({ kind, node }) => [node, kind] as const),
    ),
  );
  const placed = Map.groupBy(assembled.InstanceName.values(), ({ assembly, node }) =>
    keyOf([assembly, node]),
  );
  for (const name of assembled.AssembledName.values()) {
    const key = lookupKey(name.assembly, name.identifier);
    const placements = placed.get(keyOf([name.assembly, name.node])) ?? [];
    const kind = kinds.get(name.node) ?? "document";
    const resourceType = kind === itemRefKind ? (lookups.targets.get(name.node) ?? "none") : "none";
    const holdsItem = kind === itemRefKind && resourceType === itemResourceType;
    if (!lookups.names.has(key)) {
      lookups.names.set(key, {
        assembly: name.assembly,
        found: true,
        instance: placements[0]?.instance ?? name.assembly,
        itemDocument: holdsItem ? (lookups.items.get(name.node) ?? name.assembly) : name.assembly,
        kind,
        name: name.identifier,
        node: name.node,
        placements: BigInt(placements.length),
        replaced: placements[0]?.replaced ?? false,
        resourceType,
      });
    }
  }
};

/**
 * A test's reading of the references of the documents it places: each instance's document, each
 * reference placed in each instance, and each reference read once per test, with its readings.
 */
interface PlacedRows {
  readonly AssembledReference: ReadonlyMap<string, AssembledReferenceRow>;
  readonly PlacedDocument: ReadonlyMap<string, Addition<typeof PlacedDocument>>;
  readonly PlacedReference: ReadonlyMap<string, Addition<typeof PlacedReference>>;
  readonly Reading: ReadonlyMap<string, Addition<typeof Reading>>;
}

/**
 * Place every reference of every document each test places, once per instance, and read each once
 * per test.
 *
 * @param documents - Every document of the package.
 * @param assembled - The package's assemblies.
 * @param lookups - The lookups, which this adds probes to.
 * @returns The rows.
 */
const placedRowsOf = (
  documents: readonly AssembledExpressionInput[],
  assembled: AssembledRows,
  lookups: Lookups,
): PlacedRows => {
  const references = Map.groupBy(
    documents.flatMap((input) => [...input.expressions.TestReference.values()]),
    ({ document }) => document,
  );
  const placedDocuments = new Map<string, Addition<typeof PlacedDocument>>();
  const placedReferences = new Map<string, Addition<typeof PlacedReference>>();
  const assembledReferences = new Map<string, AssembledReferenceRow>();
  const readings = new Map<string, Addition<typeof Reading>>();
  const roots = [...assembled.Instance.values()].filter(
    ({ assemblyKind }) => assemblyKind === testKind,
  );
  for (const root of roots) {
    for (const instance of instancesIn(root).filter(({ rootKind }) =>
      testRoots.some((kind) => kind === rootKind),
    )) {
      placedDocuments.set(instance.id, {
        assembly: root.assembly,
        assemblyKind: root.assemblyKind,
        document: instance.document,
        instance: instance.id,
      });
      for (const reference of references.get(instance.document) ?? []) {
        placedReferences.set(keyOf([instance.id, reference.node, reference.attribute]), {
          assembly: root.assembly,
          attribute: reference.attribute,
          document: reference.document,
          instance: instance.id,
          node: reference.node,
        });

        const at = keyOf([root.assembly, reference.node, reference.attribute]);
        if (!assembledReferences.has(at)) {
          const read = assembledReferenceOf(lookups, root.assembly, reference);
          assembledReferences.set(at, read.row);
          for (const [key, reading] of read.readings) {
            readings.set(key, reading);
          }
        }
      }
    }
  }

  return {
    AssembledReference: assembledReferences,
    PlacedDocument: placedDocuments,
    PlacedReference: placedReferences,
    Reading: readings,
  };
};

/**
 * Build the rows a package's documents build together (`representation-gaps.md` §4; spec
 * readings 5, 48 and 88): each mapping's and template default's item declarations, and for each
 * test, every reference of every document it places, placed once per instance, read once, split
 * into its name's pieces, and read in every reading, each reading's scope, variable and source
 * looked up, absent names written as probes. Where the documents break a law, the rows still say
 * what they hold, so the law that refuses them is the one their rows name: two readings that
 * resolve are both written, and a reference no reading resolves has none that does.
 *
 * @param documents - Every document of one package, with its rows ({@link rowsOf} and the test
 *   builder's), its tree and its ids.
 * @param assembled - The package's assemblies (`assembledRowsOf` of the test builder).
 * @param resources - The package's typed resources, each href's path and type (the package
 *   builder's `TypedHref` rows).
 * @returns The rows.
 */
export const assembledExpressionRowsOf = (
  documents: readonly AssembledExpressionInput[],
  assembled: AssembledRows,
  resources: Iterable<NamedResource>,
): AssembledExpressionRows => {
  const items = itemRefTargetsOf(documents, resources);
  const lookups = lookupsOf(documents, items);
  const sources = mappingSourcesOf(documents, lookups);
  forceNames(documents, assembled, lookups);

  const placed = placedRowsOf(documents, assembled, lookups);
  const templateDefaults = documents.flatMap((input) =>
    tests.has(input.tree.root.kind) ? [templateDefaultsOf(input, lookups)] : [],
  );

  return {
    ...placed,
    ItemRefDocument: items.itemRefDocuments,
    ItemRefTarget: items.itemRefTargets,
    MappingItemRef: mappingItemRefsOf(documents, lookups),
    MappingLookup: lookups.mappings,
    MappingSourceDeclaration: sources,
    NameLookup: lookups.names,
    TemplateDefault: new Map(templateDefaults.flatMap((rows) => rows.templateDefaults)),
    TemplateDefaultTarget: new Map(templateDefaults.flatMap((rows) => rows.targets)),
    VariableLookup: lookups.probes,
  };
};

/**
 * The readings of each reference that resolve, by the reference (`[assembly, node, attribute]`):
 * the readings "Prefixed reference" counts, so a refusal for two names both.
 *
 * @param rows - The package-level rows.
 * @returns Each reference's resolving readings.
 */
export const resolvingReadingsOf = (
  rows: Pick<AssembledExpressionRows, "Reading">,
): ReadonlyMap<string, readonly Addition<typeof Reading>[]> =>
  Map.groupBy(
    [...rows.Reading.values()].filter(
      (reading) =>
        reading.form !== "name" &&
        reading.source !== "none" &&
        (reading.form === "unsplit" || !setters.has(reading.kind)) &&
        (reading.form !== "numbered" ||
          (reading.replaced && /^[0-9]*[1-9][0-9]*$/u.test(reading.number))),
    ),
    ({ assembly, attribute, node }) => keyOf([assembly, node, attribute]),
  );

/**
 * A package's variable references placed under each instance of an item's assembly (spec reading
 * 117), and the declaration lookups their claims of no declaration read.
 */
export interface PlacedVariableRows {
  readonly PlacedVariableRef: ReadonlyMap<string, Addition<typeof PlacedVariableRef>>;
  readonly VariableLookup: ReadonlyMap<string, Addition<typeof VariableLookup>>;
}

/**
 * Resolve a name among an item's declarations, else its built-in variables, else to nothing, with
 * the declaration fields a placed reference carries.
 *
 * @param declaration - The item's declaration of the name, if any.
 * @param name - The name.
 * @returns The resolution and its `declarationRef` tuple, the null objects where it names none.
 */
const placedResolutionOf = (
  declaration: Addition<typeof Declaration> | undefined,
  name: string,
): Pick<
  Addition<typeof PlacedVariableRef>,
  "declBaseType" | "declCardinality" | "declaration" | "declarationKind" | "resolution"
> => {
  if (declaration !== undefined) {
    return {
      declBaseType: declaration.baseType,
      declCardinality: declaration.cardinality,
      declaration: declaration.node,
      declarationKind: declaration.declarationKind,
      resolution: "declared" as const,
    };
  }

  const builtIn = builtInKindsByRoot.get(itemKind)?.get(name);

  return {
    declBaseType: "none",
    declCardinality: "single",
    declaration: nilUuid,
    declarationKind: builtIn ?? "qti-outcome-declaration",
    resolution: builtIn === undefined ? "unresolved" : "builtIn",
  };
};

/**
 * Build a package's variable references in place (spec reading 117): under each instance of an
 * item's assembly, every `VariableRef` of the instance's document, its name resolved as an item's
 * own is, among the item's declarations, else to one of an item's built-in variables, else to
 * nothing, which "Variable declared" refuses; and for each name that resolves to no declaration,
 * the item's absent lookup that proves it. A name only an item's declaration with no `Declaration`
 * row holds is placed nowhere, as its own references are written nowhere (`declarationsOf`).
 *
 * @param input - The package's rows the placed references read.
 * @param input.declarations - Every declaration of the package (Q5.08's `Declaration` rows).
 * @param input.instances - Every assembly's root instance, its tree nested (Q5.13's
 *   `assembledRowsOf`).
 * @param input.references - Every document's references ({@link rowsOf}'s `VariableRef`).
 * @param input.untyped - Every document's names only a declaration with no row holds
 *   (`#pantry/import/overlays/declarations.ts` `untypedNamesOf`).
 * @returns The rows.
 */
export const placedVariableRowsOf = (input: {
  readonly declarations: Iterable<Addition<typeof Declaration>>;
  readonly instances: Iterable<InstanceRoot>;
  readonly references: Iterable<Addition<typeof VariableRef>>;
  readonly untyped: Iterable<{ readonly document: NodeId; readonly name: string }>;
}): PlacedVariableRows => {
  const declared = new Map(
    [...input.declarations].map((row) => [keyOf([row.document, row.identifier]), row] as const),
  );
  const untyped = new Set([...input.untyped].map(({ document, name }) => keyOf([document, name])));
  const referencesOf = Map.groupBy(input.references, ({ document }) => document);
  const placed = new Map<string, Addition<typeof PlacedVariableRef>>();
  const lookups = new Map<string, Addition<typeof VariableLookup>>();
  for (const root of input.instances) {
    for (const instance of root.assemblyKind === itemKind ? instancesIn(root) : []) {
      for (const reference of (referencesOf.get(instance.document) ?? []).filter(
        ({ identifier }) => !untyped.has(keyOf([root.assembly, identifier])),
      )) {
        const declaration = declared.get(keyOf([root.assembly, reference.identifier]));
        placed.set(keyOf([instance.id, reference.node, reference.attribute]), {
          ...placedResolutionOf(declaration, reference.identifier),
          assembly: root.assembly,
          attribute: reference.attribute,
          document: instance.document,
          identifier: reference.identifier,
          instance: instance.id,
          kind: reference.kind,
          node: reference.node,
          rootKind: itemKind,
        });
        if (declaration === undefined) {
          lookups.set(
            lookupKey(root.assembly, reference.identifier),
            absentLookup(root.assembly, reference.identifier),
          );
        }
      }
    }
  }

  return { PlacedVariableRef: placed, VariableLookup: lookups };
};
