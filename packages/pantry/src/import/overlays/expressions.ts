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
import { Array as Arr, Option } from "effect";
import {
  integerMathOperators,
  rpTemplatePattern,
  rpTemplates,
  tableReaders,
  valueBases,
} from "#pantry/grammar/expression.ts";
import type {
  Language,
  ReferencedTable,
  ValueBase,
  ValueCardinality,
} from "#pantry/grammar/expression.ts";
import { isNcName } from "#pantry/grammar/domains.ts";
import { builtInBaseTypes, BuiltInVariable, nonElementKinds } from "#pantry/grammar/install.ts";
import type { BaseType, Cardinality } from "#pantry/grammar/install.ts";
import { testRoots } from "#pantry/grammar/references.ts";
import {
  piecesOf,
  spelledBaseTypeOf,
  typedCountOf,
  typedDeclarationOf,
} from "#pantry/import/overlays/declarations.ts";
import { charactersIn } from "#pantry/import/overlays/quotation.ts";
import { itemRefPathsOf, keyOf } from "#pantry/import/overlays/tests.ts";
import type {
  AssembledRows,
  InstanceMember,
  InstanceRoot,
  TestIds,
  TestRows,
} from "#pantry/import/overlays/tests.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Folds } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { AttributeRow, FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import {
  expressionKinds,
  processingReferences,
  rootLanguages,
  ruleKindHandles,
  setterKinds,
  typings,
  valueBaseOf,
  valueCardinalityOf,
} from "#pantry/qti/expression-types.ts";
import { optionallyTypedKinds } from "#pantry/qti/expressions.ts";
import type {
  AssembledReference,
  Expression,
  ExpressionAttribute,
  Literal,
  LiteralTyped,
  MappingLookup,
  MappingSourceDeclaration,
  NameLookup,
  Operand,
  PlacedDocument,
  PlacedReference,
  PlacedVariableRef,
  PlacedVariableRefDeclaration,
  Processing,
  ProcessingTemplate,
  Reading,
  ReadingCardinality,
  ReadingDeclaration,
  ReferenceDocument,
  ReferenceSegment,
  SectionIdentifier,
  TemplateDefault,
  TemplateDefaultCardinality,
  TemplateDefaultTarget,
  TestReference,
  VariableLookup,
  VariableRef,
  VariableRefCardinality,
  VariableRefDeclaration,
  VariableRefTable,
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
import type { DeclarationCardinality, DeclarationIdentifier } from "#pantry/qti/declarations.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes', drawn by the number
 * `flatten` gives it, in document order from the document node's 0.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface ExpressionIds {
  /**
   * The document's context (spec reading 117), `ownContext` of `#pantry/import/fold.ts` for a
   * document no site names: an included fragment's nodes take the interaction their includes stand
   * in as their nearest.
   */
  readonly context: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * A document's expression and processing rows, one keyed set per relation: each map from the text
 * of a row's key to the row as its writer writes it. A node-keyed overlay's key text is its node's
 * id; a (node, attribute)-keyed one's is the pair as a JSON array.
 */
export interface ExpressionRows {
  readonly Expression: ReadonlyMap<string, Addition<typeof Expression>>;
  readonly ExpressionAttribute: ReadonlyMap<string, Addition<typeof ExpressionAttribute>>;
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
  readonly VariableRefCardinality: ReadonlyMap<string, Addition<typeof VariableRefCardinality>>;
  readonly VariableRefDeclaration: ReadonlyMap<string, Addition<typeof VariableRefDeclaration>>;
  readonly VariableRefTable: ReadonlyMap<string, Addition<typeof VariableRefTable>>;
}

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
 * Read a variable's base type as an expression's: its declaration code's `ValueBase`, and
 * `unknown` where it has none, a record's (lane NIL's audit, B12).
 *
 * @param baseType - The variable's base type, none where it has none.
 * @returns The expression-typing code.
 */
const baseOf = (baseType: Option.Option<(typeof BaseType.handles)[number]>): ValueBase =>
  Option.match(baseType, { onNone: () => unknownType.baseType, onSome: valueBaseOf });

/**
 * Read a variable's cardinality as an expression's: its declaration code's `ValueCardinality`, and
 * `unknown` where it has none, unwritten or spelling nothing (spec reading 159), as
 * {@link baseOf} reads a base type.
 *
 * @param cardinality - The variable's cardinality, none where it has none.
 * @returns The expression-typing code.
 */
const cardinalityOf = (
  cardinality: Option.Option<(typeof Cardinality.handles)[number]>,
): ValueCardinality =>
  Option.match(cardinality, {
    onNone: () => unknownType.cardinality,
    onSome: valueCardinalityOf,
  });

/**
 * A reference's element type as {@link unknownType} gives it, which `withTypes` fills once every
 * expression is typed, and which stays where its element is no expression: the null object
 * `VariableRef` holds in the fields its case leaves unread.
 */
const unfilledTypes = {
  elementBase: unknownType.baseType,
  elementCardinality: unknownType.cardinality,
} as const;

/**
 * One declaration of the document as a reference resolves to it: its node, kind and codes, its
 * base type none where it has none, a record's or one that spells nothing (lane NIL's audit, B12),
 * and its cardinality none where it has none, unwritten or spelling nothing (spec reading 159).
 */
interface DeclarationEntry {
  readonly baseType: Option.Option<(typeof BaseType.handles)[number]>;
  readonly cardinality: Option.Option<(typeof Cardinality.handles)[number]>;
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
 * The rule and processing kinds.
 */
const rules: ReadonlySet<string> = new Set(ruleKindHandles);

/**
 * The language each root opens.
 */
const rootLanguage: ReadonlyMap<string, Language> = new Map(rootLanguages);

/**
 * Each processing reference's spelling, by `kind attribute`.
 */
const spellingOf: ReadonlyMap<string, "bare" | "braced"> = new Map(
  processingReferences.map(({ attribute, kind, spelling }) => [`${kind} ${attribute}`, spelling]),
);

/**
 * The roots of the documents that hold item refs, a test's and a section's (spec reading 5), whose
 * template defaults name the templates of the items their item refs name.
 */
const tests: ReadonlySet<string> = new Set(testRoots);

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
 * Read the whitespace a bare reference's split leaves around its name as the affix it is.
 *
 * @param text - The whitespace.
 * @returns It, as an {@link Affix}.
 * @throws {Error} When it holds a character that is no XML whitespace, which the split strips
 *   nothing else of: a defect of the split.
 */
const affixOf = (text: string): Affix =>
  Option.getOrThrowWith(
    Option.liftPredicate(text, isSpace),
    () =>
      new Error(
        `A bare reference's split left ${JSON.stringify(text)} beside its name, which is no XML whitespace. Strip only tab, line feed, carriage return and space.`,
      ),
  );

/**
 * A float literal that is also a name, which a float-or-reference attribute reads as the literal.
 */
const floatName = /^[\t\n\r ]*(?:INF|NaN)[\t\n\r ]*$/u;

/**
 * The names `qti-math-operator` gives an integer result.
 */
const integerNames = new RegExp(integerMathOperators, "u");

/**
 * The `RpTemplate` handle of a `template` URI that names none of the published templates, as
 * `ProcessingTemplate` holds it (`E1_derived`'s last arm, `#pantry/qti/expressions.ts`): a URI may
 * name a template of its own, which no law refuses.
 */
const unpublished = "none" satisfies (typeof rpTemplates)[number];

/**
 * The published templates, each with the pattern its `template` URI matches.
 */
const published = rpTemplates.flatMap((template) =>
  template === unpublished
    ? []
    : [{ pattern: new RegExp(rpTemplatePattern(template), "u"), template }],
);

/**
 * The published template a `template` URI names, {@link unpublished} for any other.
 *
 * @param uri - The URI as written.
 * @returns The `RpTemplate` handle.
 */
const templateOf = (uri: string): (typeof rpTemplates)[number] =>
  Option.match(
    Arr.findFirst(published, ({ pattern }) => pattern.test(uri)),
    { onNone: () => unpublished, onSome: ({ template }) => template },
  );

/**
 * Index a document's attribute rows by their element and name.
 *
 * @param rows - The document's flat rows.
 * @returns Each element's attributes, by the element's id and the attribute's name.
 */
const attributesOf = (
  rows: FlatRows<Composed>,
): ReadonlyMap<NodeId, ReadonlyMap<string, AttributeRow<Composed>>> =>
  new Map(
    [...Map.groupBy(rows.attributes, ({ node }) => node)].map(
      ([node, attributes]) => [node, new Map(attributes.map((row) => [row.name, row]))] as const,
    ),
  );

/**
 * A built-in variable as a root holds it: its type, its declaration codes read as expression-typing
 * codes.
 */
interface BuiltIn {
  readonly type: Typed;
}

/**
 * Each root's built-in variables, as the installed `BuiltInVariable` holds them (the UP audit's
 * A63).
 */
const builtInsByRoot: ReadonlyMap<string, ReadonlyMap<string, BuiltIn>> = new Map(
  [...Map.groupBy(BuiltInVariable.rows, ({ root }) => root)].map(([root, rows]) => [
    root,
    new Map(
      rows.map(({ cardinality, variable }) => [
        variable,
        {
          type: {
            baseType: baseOf(
              Option.map(
                Arr.findFirst(
                  builtInBaseTypes,
                  (typed) => typed.root === root && typed.variable === variable,
                ),
                ({ baseType }) => baseType,
              ),
            ),
            cardinality: valueCardinalityOf(cardinality),
          },
        },
      ]),
    ),
  ]),
);

/**
 * Read the built-in variable a root holds under a name.
 *
 * @param root - The root's kind.
 * @param name - The name.
 * @returns The built-in, none where the root holds no built-in of the name, or none at all.
 */
const builtInOf = (root: string, name: string): Option.Option<BuiltIn> =>
  Option.flatMap(Option.fromNullishOr(builtInsByRoot.get(root)), (held) =>
    Option.fromNullishOr(held.get(name)),
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
 * The base type of no operand: `any`, as `baseOfOperands` and `baseOfTail` of
 * `#pantry/qti/expressions.ts` state it for an expression whose operands set no bit.
 */
const noOperandBase = "any" satisfies ValueBase;

/**
 * The base type a set of operand bits gives a container, an Index or a Random, and a Delete's later
 * operands give it: {@link noOperandBase} for none, the one for one, `unknown` for several
 * (`baseOfOperands` and `baseOfTail` of `#pantry/qti/expressions.ts`).
 *
 * @param bases - The bits.
 * @returns The base type.
 */
const oneOf = (bases: ReadonlySet<ValueBase>): ValueBase =>
  Arr.match([...bases], {
    onEmpty: () => noOperandBase,
    onNonEmpty: ([only, ...rest]) => (rest.length === 0 ? only : unknownType.baseType),
  });

/**
 * The cardinality a Delete's later operands give it: their one cardinality, `unknown` set aside
 * (no operand's bit, `ValueCardinalityBit`), and `unknown` for none or several (`cardinalityOfTail`
 * of `#pantry/qti/expressions.ts`).
 *
 * @param types - The later operands' types.
 * @returns The cardinality.
 */
const oneCardinalityOf = (types: readonly Typed[]): ValueCardinality =>
  Arr.match(
    [
      ...new Set(
        types.flatMap(({ cardinality }) =>
          cardinality === unknownType.cardinality ? [] : [cardinality],
        ),
      ),
    ],
    {
      onEmpty: () => unknownType.cardinality,
      onNonEmpty: ([only, ...rest]) => (rest.length === 0 ? only : unknownType.cardinality),
    },
  );

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
 * Read the table a declared reference claims of its declaration (`VariableRefTable`): by its
 * `identifier`, the first table its kind reads that the declaration holds. A reference by another
 * attribute, of a kind that reads no table, or to a declaration that holds none of those its kind
 * reads claims none, and has no claim row, so `Mapped_response` or `Lookup_type` judges a map
 * response, a map response point or a lookup that claims none.
 *
 * @param kind - The reference's kind.
 * @param attribute - The attribute the reference is made by.
 * @param held - The tables its declaration holds.
 * @returns The table, or none.
 */
const claimedTableOf = (
  kind: string,
  attribute: string,
  held: ReadonlySet<string>,
): Option.Option<ReferencedTable> =>
  attribute === "identifier"
    ? Option.flatMap(Option.fromNullishOr(tablesRead.get(kind)), (tables) =>
        Arr.findFirst(tables, (table) => held.has(table)),
      )
    : Option.none();

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
 * QTI's eleven base types, the bases a `base-type` spells.
 */
const spelledBases: readonly ValueBase[] = valueBases.filter(
  (base) => base !== noOperandBase && base !== unknownType.baseType,
);

/**
 * The base type an expression's own attribute gives (`E1_derived` on `ExpressionAttribute`): a
 * math operator's `integer` where its `name` is one of the integer operators and `float` for every
 * other (information model §2.11.3.32), an unwritten one among them, as the law oracle reads it;
 * a base value's and a test variables' the base its `base-type` spells exactly, `unknown` where
 * none is written or the one written spells none.
 *
 * @param kind - The expression's kind.
 * @param baseTypeLexical - Its `base-type`, if written.
 * @param name - Its `name`, if written.
 * @returns The base type.
 */
const attributeBaseOf = (
  kind: string,
  baseTypeLexical: Option.Option<string>,
  name: Option.Option<string>,
): ValueBase => {
  if (kind === "qti-math-operator") {
    return Option.exists(name, (written) => integerNames.test(written)) ? "integer" : "float";
  }

  return baseTypeLexical.pipe(
    Option.flatMap((lexical) => Arr.findFirst(spelledBases, (base) => base === lexical)),
    Option.getOrElse(() => unknownType.baseType),
  );
};

/**
 * The type a row holds, as a type alone: its base type and cardinality, `unknown` for none, the
 * type of a variable no declaration types.
 *
 * @param row - A typed row, a reference's or its element's, where it has one.
 * @returns Its type.
 */
const typeIn = (row: Option.Option<Typed>): Typed =>
  Option.match(row, {
    onNone: () => unknownType,
    onSome: ({ baseType, cardinality }) => ({ baseType, cardinality }),
  });

/**
 * What an expression's type derives from beside its kind.
 */
interface TypeInputs {
  readonly baseTypeLexical: Option.Option<string>;
  readonly name: Option.Option<string>;
  readonly operands: readonly Typed[];
  readonly reference: Option.Option<Typed>;
}

/**
 * A kind's typing as the host derives its type: the typing, and the one result cardinality, and
 * for a fixed typing the one result base, the typing gives where its type is its own.
 */
type Rule =
  | {
      readonly cardinality: ValueCardinality;
      readonly typing: "attribute" | "container" | "first" | "numeric";
    }
  | {
      readonly baseType: ValueBase;
      readonly cardinality: ValueCardinality;
      readonly typing: "fixed";
    }
  | { readonly typing: "declared" | "second" };

/**
 * Read the one value a typing gives where its kind's type is its own.
 *
 * @param kind - The typing's kind.
 * @param values - The values it gives.
 * @param what - What they are, for the defect.
 * @returns The one value.
 * @throws {Error} When the typing gives none or several, which the generator gives no kind of a
 *   typing whose type is its own: a defect of the generated table.
 */
const onlyOf = <A>(kind: string, values: readonly A[], what: string): A =>
  Option.getOrThrowWith(
    values.length === 1 ? Arr.head(values) : Option.none(),
    () =>
      new Error(
        `The typing of ${kind} gives ${String(values.length)} ${what}s, and a typing whose type is its kind's own gives one. Check expressionTypings in #pantry/grammar/expression.ts.`,
      ),
  );

/**
 * Each expression kind's {@link Rule}, read once from the generated typings.
 */
const ruleOf: ReadonlyMap<string, Rule> = new Map(
  typings.map(({ kind, resultBases, resultCardinalities, typing }): readonly [string, Rule] => {
    switch (typing) {
      case "attribute":
      case "container":
      case "first":
      case "numeric": {
        return [
          kind,
          { cardinality: onlyOf(kind, resultCardinalities, "result cardinality"), typing },
        ];
      }
      case "fixed": {
        return [
          kind,
          {
            baseType: onlyOf(kind, resultBases, "result base"),
            cardinality: onlyOf(kind, resultCardinalities, "result cardinality"),
            typing,
          },
        ];
      }
      case "declared":
      case "second": {
        return [kind, { typing }];
      }
      default: {
        return typing satisfies never;
      }
    }
  }),
);

/**
 * Derive an expression's type as the laws do: its kind's typing over its operands' types, its own
 * attributes, and the variable its `identifier` names.
 *
 * @param kind - The expression's kind.
 * @param inputs - Its operands' types, in order, its `base-type` and `name`, and its
 *   `identifier`'s reference.
 * @returns The type.
 * @throws {Error} When the kind has no typing, which every expression kind has: a defect of the
 *   caller, which typed a node that is no expression.
 */
const typeOf = (kind: string, inputs: TypeInputs): Typed => {
  const rule = Option.getOrThrowWith(
    Option.fromNullishOr(ruleOf.get(kind)),
    () =>
      new Error(
        `The kind ${kind} has no expression typing, and every expression kind has one. Type expressions alone.`,
      ),
  );
  switch (rule.typing) {
    case "numeric": {
      return { baseType: numericOf(inputs.operands), cardinality: rule.cardinality };
    }
    case "container":
    case "first": {
      return { baseType: oneOf(basesOf(inputs.operands)), cardinality: rule.cardinality };
    }
    case "second": {
      const later = Arr.drop(inputs.operands, 1);

      return { baseType: oneOf(basesOf(later)), cardinality: oneCardinalityOf(later) };
    }
    case "declared": {
      return typeIn(inputs.reference);
    }
    case "attribute": {
      return {
        baseType: attributeBaseOf(kind, inputs.baseTypeLexical, inputs.name),
        cardinality: rule.cardinality,
      };
    }
    case "fixed": {
      return { baseType: rule.baseType, cardinality: rule.cardinality };
    }
    default: {
      return rule satisfies never;
    }
  }
};

/**
 * One document as the builder reads it: its flat rows indexed by node, each node's attributes,
 * children, fold (`#pantry/import/fold.ts`, its nearest interaction among the rest) and processing
 * language, its root's kind, and its named declarations, by name.
 */
interface Document extends Tree {
  readonly attributes: ReadonlyMap<NodeId, ReadonlyMap<string, AttributeRow<Composed>>>;
  /**
   * A node's own characters as `Node.chars` holds them (`charactersIn` of
   * `#pantry/import/overlays/quotation.ts`).
   */
  readonly charsOf: (node: NodeRow<Composed>) => string;
  readonly declarations: ReadonlyMap<string, DeclarationEntry>;
  readonly folds: Folds;
  readonly id: NodeId;
  /**
   * A node's processing language ({@link languagesOf}), which every node of the document has.
   */
  readonly languageOf: (node: NodeId) => Language;
  readonly rootKind: NodeRow<Composed>["kind"];
  readonly rows: FlatRows<Composed>;
}

/**
 * A document's tree as its flat rows hold it, read through two readers that cannot miss: a
 * node's row by its id, and a node's children.
 */
interface Tree {
  /**
   * A node's children, in order: none for a node no row names as its parent.
   */
  readonly childrenOf: (node: NodeId) => readonly NodeRow<Composed>[];
  /**
   * A node's row by its id: a node's parent's among them, the document node its own parent.
   */
  readonly nodeOf: (node: NodeId) => NodeRow<Composed>;
}

/**
 * Index a document's flat rows as a {@link Tree}.
 *
 * @param rows - The document's flat rows.
 * @returns The tree.
 * @throws {Error} From `nodeOf`, when the id is no node's of the rows, which every node's parent
 *   is: a defect of the caller, which read a node of another document.
 */
const treeOf = (rows: FlatRows<Composed>): Tree => {
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const byParent = Map.groupBy(
    rows.nodes.filter((node) => node.parent !== node.id),
    ({ parent }) => parent,
  );

  return {
    childrenOf: (node) => Option.getOrElse(Option.fromNullishOr(byParent.get(node)), Arr.empty),
    nodeOf: (node) =>
      Option.getOrThrowWith(
        Option.fromNullishOr(byId.get(node)),
        () =>
          new Error(
            `Node ${node} is no node of the document's rows, and every node's parent is one. Read a node in its own document's rows.`,
          ),
      ),
  };
};

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
const elementsOf = (doc: Tree, node: NodeId): readonly NodeRow<Composed>[] =>
  doc.childrenOf(node).filter(({ kind }) => !notElements.has(kind));

/**
 * A node's parent's kind, `document` for the document node, its own parent.
 *
 * @param doc - The document.
 * @param node - The node.
 * @returns The kind.
 */
const parentKindOf = (doc: Tree, node: NodeRow<Composed>): NodeRow<Composed>["kind"] =>
  doc.nodeOf(node.parent).kind;

/**
 * The language of a node outside every processing root: `none`, as `Processing`'s `E1_derived`
 * holds a node that is no root and sits under no rule.
 */
const outsideProcessing = "none" satisfies Language;

/**
 * Read each node's processing language in document order: a root's its own, a rule's or an
 * expression's under a rule or an expression its parent's, and every other node's
 * {@link outsideProcessing}.
 *
 * @param rows - The document's flat rows, in document order.
 * @param tree - The rows' tree.
 * @returns The reader of each node's language.
 * @throws {Error} From the reader, when the id is no node's of the rows, every one of which this
 *   reads: a defect of the caller.
 */
const languagesOf = (rows: FlatRows<Composed>, tree: Tree): ((node: NodeId) => Language) => {
  const language = new Map<NodeId, Language>();
  const languageOf = (node: NodeId): Language =>
    Option.getOrThrowWith(
      Option.fromNullishOr(language.get(node)),
      () =>
        new Error(
          `Node ${node} has no processing language, and every node of the document has one, each read after its parent. Read the language of a node of the same document.`,
        ),
    );
  for (const node of rows.nodes) {
    const parent = tree.nodeOf(node.parent);
    const carried =
      parent.id !== node.id && (rules.has(parent.kind) || expressions.has(parent.kind));
    language.set(
      node.id,
      Option.getOrElse(Option.fromNullishOr(rootLanguage.get(node.kind)), () =>
        carried ? languageOf(parent.id) : outsideProcessing,
      ),
    );
  }

  return languageOf;
};

/**
 * The document's declarations by name: each that has a `DeclarationIdentifier`
 * (`typedDeclarationOf`), its identifier naming something, whatever its cardinality and base type
 * spell (spec reading 159), the first of a repeated one (which `Declaration key` refuses), with
 * its codes, each none where it has none, and the tables it holds. A reference to a name whose
 * declaration has no cardinality resolves to it, and only a law over the cardinality reads none:
 * AL3 or the value domain refuses the declaration's attribute alone (spec reading 158). A
 * declaration whose identifier is unwritten or names nothing has its row but no name, so no
 * reference resolves to it (spec reading 157).
 *
 * @param rows - The document's flat rows.
 * @param attributes - Each element's attributes.
 * @param childrenOf - Each node's children.
 * @returns The declarations.
 */
const declarationsOf = (
  rows: FlatRows<Composed>,
  attributes: Document["attributes"],
  childrenOf: Tree["childrenOf"],
): Document["declarations"] => {
  const declarations = new Map<string, DeclarationEntry>();
  for (const node of rows.nodes.filter(({ kind }) => declarationKinds.has(kind))) {
    const lexical = (attribute: string) =>
      Option.fromUndefinedOr(attributes.get(node.id)?.get(attribute)?.lexical);
    const typed = typedDeclarationOf({
      baseType: lexical("base-type"),
      cardinality: lexical("cardinality"),
      identifier: lexical("identifier"),
    });
    for (const { pieces } of Option.toArray(typed.name)) {
      if (!declarations.has(pieces.name)) {
        declarations.set(pieces.name, {
          baseType: typed.baseType,
          cardinality: typed.cardinality,
          kind: node.kind,
          node: node.id,
          tables: new Set(
            childrenOf(node.id).flatMap(({ kind }) => (tableKinds.has(kind) ? [kind] : [])),
          ),
        });
      }
    }
  }

  return declarations;
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
  const indexed = treeOf(rows);

  return {
    ...indexed,
    attributes,
    charsOf: charactersIn(rows),
    declarations: declarationsOf(rows, attributes, indexed.childrenOf),
    folds: foldOf(rows.nodes, ids.context),
    id: rows.document.node,
    languageOf: languagesOf(rows, indexed),
    rootKind: tree.root.kind,
    rows,
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
  const { lexical } = attribute;
  if (spelling === undefined || (node.kind === "qti-random-float" && floatName.test(lexical))) {
    return undefined;
  }

  if (spelling === "braced") {
    const name = lexical.slice(1, -1);

    return lexical.startsWith("{") && lexical.endsWith("}") && isNcName(name)
      ? { after: "}", before: "{", name }
      : undefined;
  }

  const rest = lexical.replace(/^[\t\n\r ]+/u, "");
  const name = rest.replace(/[\t\n\r ]+$/u, "");

  return isNcName(name)
    ? {
        after: affixOf(rest.slice(name.length)),
        before: affixOf(lexical.slice(0, lexical.length - rest.length)),
        name,
      }
    : undefined;
};

/**
 * Resolve a referenced name: to a declaration of the document, else to a built-in variable, else
 * to nothing, with the type each gives.
 *
 * @param doc - The document.
 * @param name - The name.
 * @returns The resolution and the type.
 */
const resolve = (doc: Document, name: string) => {
  const declared = doc.declarations.get(name);
  if (declared !== undefined) {
    return {
      resolution: "declared" as const,
      type: {
        baseType: baseOf(declared.baseType),
        cardinality: cardinalityOf(declared.cardinality),
      },
    };
  }

  return Option.match(builtInOf(doc.rootKind, name), {
    onNone: () => ({ resolution: "unresolved" as const, type: unknownType }),
    onSome: (builtIn) => ({ resolution: "builtIn" as const, type: builtIn.type }),
  });
};

/**
 * Build one reference's row, its element's type to fill.
 *
 * @param doc - The document.
 * @param node - The element.
 * @param attribute - The attribute it makes the reference by.
 * @returns The row, or none for a literal value.
 */
const referenceOf = (
  doc: Document,
  node: NodeRow<Composed>,
  attribute: AttributeRow<Composed>,
): Addition<typeof VariableRef> | undefined => {
  const spelled = spelledBy(node, attribute);
  if (spelled === undefined) {
    return undefined;
  }

  const { resolution, type } = resolve(doc, spelled.name);

  return {
    after: spelled.after,
    attribute: attribute.name,
    baseType: type.baseType,
    before: spelled.before,
    cardinality: type.cardinality,
    document: doc.id,
    ...unfilledTypes,
    identifier: spelled.name,
    kind: node.kind,
    language: doc.languageOf(node.id),
    lexical: attribute.lexical,
    node: node.id,
    parent: node.parent,
    resolution,
    rootKind: doc.rootKind,
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
  const operandOf = (child: NodeRow<Composed>): Typed =>
    Option.getOrThrowWith(
      Option.fromNullishOr(typed.get(child.id)),
      () =>
        new Error(
          `The operand ${child.id} is untyped when its operator is typed, and reverse document order types every expression after the ones below it. Type a document's expressions in reverse document order.`,
        ),
    );
  for (const node of doc.rows.nodes.toReversed()) {
    if (expressions.has(node.kind)) {
      typed.set(
        node.id,
        typeOf(node.kind, {
          baseTypeLexical: Option.fromNullishOr(valueOf(doc, node.id, "base-type")),
          name: Option.fromNullishOr(valueOf(doc, node.id, "name")),
          operands: elementsOf(doc, node.id).flatMap((child) =>
            expressions.has(child.kind) ? [operandOf(child)] : [],
          ),
          reference: Option.fromNullishOr(references.get(pairKey(node.id, "identifier"))),
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
  nearest: foldAt(doc.folds, node.id).nearest,
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
 * The typing attribute of each kind whose element may omit it (`optionallyTypedKinds` of
 * `#pantry/qti/expressions.ts`), which has a row on every element of the kind, unwritten where the
 * element omits it: a test variables' `base-type`. A base value's `base-type` and a math operator's
 * `name` are required, so an element that omits one has no row, and AL3 refuses it alone.
 */
const unwrittenTypingOf: ReadonlyMap<string, "base-type"> = new Map(
  optionallyTypedKinds.map((kind) => [kind, "base-type"] as const),
);

/**
 * The lexical form of an unwritten typing attribute's row: empty, `ExpressionAttribute`'s null
 * object, which `E1_derived` holds an unwritten row to (M2: the absence the type follows from is a
 * keyed row of its own, which the attribute's copy refutes where it is written).
 */
const unwrittenLexical = "";

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
    language: doc.languageOf(node.id),
    parentKind: parentKindOf(doc, node),
  });

  const uri =
    node.kind === "qti-response-processing" ? valueOf(doc, node.id, "template") : undefined;
  if (uri !== undefined) {
    built.ProcessingTemplate.set(node.id, { node: node.id, template: templateOf(uri), uri });
  }
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
  const language = doc.languageOf(node.id);
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
      rank: BigInt(
        Option.getOrThrowWith(
          Arr.findFirstIndex(elementsOf(doc, node.parent), ({ id }) => id === node.id),
          () =>
            new Error(
              `The operand ${node.id} is not among its operator ${node.parent}'s elements, which every element child is. Rank an element among its own parent's.`,
            ),
        ) + 1,
      ),
    });
  }

  for (const name of Option.getOrElse(
    Option.fromNullishOr(typingAttributes.get(node.kind)),
    Arr.empty,
  )) {
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

  const typing = unwrittenTypingOf.get(node.kind);
  if (typing !== undefined && !built.ExpressionAttribute.has(pairKey(node.id, typing))) {
    built.ExpressionAttribute.set(pairKey(node.id, typing), {
      ...own,
      attribute: typing,
      lexical: unwrittenLexical,
      written: false,
    });
  }

  if (node.kind === "qti-base-value") {
    const text = doc.childrenOf(node.id).map(doc.charsOf).join("");
    built.Literal.set(node.id, { ...own, text });

    // A literal is typed where its base-type spells a code, the one its type is (7230d050).
    const typeCode = spelledBaseTypeOf(Option.fromUndefinedOr(valueOf(doc, node.id, "base-type")));
    if (type.baseType !== "unknown" && Option.isSome(typeCode)) {
      built.LiteralTyped.set(node.id, {
        baseType: type.baseType,
        node: node.id,
        text,
        typeCode: typeCode.value,
      });
    }
  }
};

/**
 * Fill a reference's element type, an expression's own, once every expression is typed.
 *
 * @param typed - Each expression's type.
 * @param reference - The reference's row.
 * @returns The row with it filled, `unknown` where its element is no expression.
 */
const withTypes = (
  typed: ReadonlyMap<NodeId, Typed>,
  reference: Addition<typeof VariableRef>,
): Addition<typeof VariableRef> => {
  const element = typeIn(Option.fromNullishOr(typed.get(reference.node)));

  return {
    ...reference,
    elementBase: element.baseType,
    elementCardinality: element.cardinality,
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
 * A declaration lookup's row where the document declares no such name: its verdict, the row's one
 * datum (M2: the claim is proved by the key). A declared name's row says `declared` and no more;
 * its declaration is its `DeclarationIdentifier`'s.
 *
 * @param document - The document.
 * @param name - The name.
 * @returns The row.
 */
const absentLookup = (document: NodeId, name: string): Addition<typeof VariableLookup> => ({
  declared: false,
  document,
  name,
});

/**
 * Write a document's declaration lookups: one forced in per name it declares, by collapsed
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
  for (const name of doc.declarations.keys()) {
    lookups.set(lookupKey(doc.id, name), { declared: true, document: doc.id, name });
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
 * A document's declared references' declarations, each a row of its own, their declarations'
 * cardinalities, each where the declaration has one, and the tables they claim, each where one
 * claims one, by `[node, attribute]`.
 */
interface ReferenceDeclarations {
  readonly cardinalities: ReadonlyMap<string, Addition<typeof VariableRefCardinality>>;
  readonly declarations: ReadonlyMap<string, Addition<typeof VariableRefDeclaration>>;
  readonly tables: ReadonlyMap<string, Addition<typeof VariableRefTable>>;
}

/**
 * Write each declared reference's declaration as a row of its own (lane NIL's NS1): the declaration
 * of the document its name resolves to, whatever its cardinality spells (spec reading 159), with
 * its kind and its counts of cardinalities and base types, and the reference's fields its laws
 * read beside them; where the declaration has a cardinality, that cardinality beside the
 * reference's type's, a row of its own; and where it claims a table of the declaration
 * ({@link claimedTableOf}), that claim, a row of its own. A reference to a built-in variable or to
 * nothing has none of them.
 *
 * @param doc - The document.
 * @param references - Its references, their types filled.
 * @returns The rows, by `[node, attribute]`.
 * @throws {Error} When a declared reference's name has no declaration of the document, which its
 *   resolution read: a defect of the builder.
 */
const referenceDeclarationsOf = (
  doc: Document,
  references: ReadonlyMap<string, Addition<typeof VariableRef>>,
): ReferenceDeclarations => {
  const declarations = new Map<string, Addition<typeof VariableRefDeclaration>>();
  const cardinalities = new Map<string, Addition<typeof VariableRefCardinality>>();
  const tables = new Map<string, Addition<typeof VariableRefTable>>();
  for (const [at, reference] of references) {
    if (reference.resolution === "declared") {
      const declared = Option.getOrThrowWith(
        Option.fromNullishOr(doc.declarations.get(reference.identifier)),
        () =>
          new Error(
            `The reference ${reference.node} ${reference.attribute} resolved to a declaration of ${reference.identifier}, which its document's declarations do not hold. Resolve a reference against its own document's declarations.`,
          ),
      );
      declarations.set(at, {
        attribute: reference.attribute,
        baseType: reference.baseType,
        cardinality: reference.cardinality,
        declBaseTypes: typedCountOf(declared.baseType),
        declCardinalities: typedCountOf(declared.cardinality),
        declaration: declared.node,
        declarationKind: declared.kind,
        document: reference.document,
        identifier: reference.identifier,
        kind: reference.kind,
        language: reference.language,
        node: reference.node,
      });
      for (const declCardinality of Option.toArray(declared.cardinality)) {
        cardinalities.set(at, {
          attribute: reference.attribute,
          cardinality: reference.cardinality,
          declCardinality,
          declaration: declared.node,
          node: reference.node,
        });
      }

      for (const table of Option.toArray(
        claimedTableOf(reference.kind, reference.attribute, declared.tables),
      )) {
        tables.set(at, {
          attribute: reference.attribute,
          declaration: declared.node,
          kind: reference.kind,
          node: reference.node,
          table,
        });
      }
    }
  }

  return { cardinalities, declarations, tables };
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
      if (attribute.name !== "section-identifier") {
        return [];
      }

      const node = doc.nodeOf(attribute.node);
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
 * Write the references of a document that is no item, which resolve against each test that places
 * it: its variable references and its `section-identifier`s; none for an item, whose references
 * resolve in its own declarations.
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
  if (doc.rootKind === itemKind) {
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
 * holder's type are filled once their expressions are typed, so each rule the laws state reads
 * values already derived.
 *
 * @param tree - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (tree: XdmDocument<Composed>, ids: ExpressionIds): ExpressionRows => {
  const doc = documentOf(tree, ids);
  const references = new Map<string, Addition<typeof VariableRef>>();
  for (const attribute of doc.rows.attributes) {
    const reference = referenceOf(doc, doc.nodeOf(attribute.node), attribute);
    if (reference !== undefined) {
      references.set(pairKey(attribute.node, attribute.name), reference);
    }
  }

  const typed = typesOf(doc, references);
  for (const [at, reference] of references) {
    references.set(at, withTypes(typed, reference));
  }

  const built = {
    Expression: new Map<string, Addition<typeof Expression>>(),
    ExpressionAttribute: new Map<string, Addition<typeof ExpressionAttribute>>(),
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
  const declared = referenceDeclarationsOf(doc, references);

  return {
    ...built,
    ReferenceDocument:
      doc.rootKind === itemKind
        ? new Map<string, Addition<typeof ReferenceDocument>>()
        : new Map([[doc.id, { document: doc.id }]]),
    SectionIdentifier: sectionIdentifiers,
    TestReference: testReferencesOf(doc, references, sectionIdentifiers),
    VariableLookup: variableLookupsOf(doc, references),
    VariableRefCardinality: declared.cardinalities,
    VariableRefDeclaration: declared.declarations,
    VariableRefTable: declared.tables,
  };
};

/**
 * One document as the package-level builder reads it: its declarations' cardinalities, each where
 * it has one (Q5.08's `DeclarationCardinality` rows), its named declarations (Q5.08's
 * `DeclarationIdentifier` rows, each by its node), its expression rows, its test rows, its tree and
 * the ids its rows are written under.
 */
export interface AssembledExpressionInput {
  readonly cardinalities: ReadonlyMap<string, Addition<typeof DeclarationCardinality>>;
  readonly declarations: ReadonlyMap<string, Addition<typeof DeclarationIdentifier>>;
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
  readonly MappingLookup: ReadonlyMap<string, Addition<typeof MappingLookup>>;
  readonly MappingSourceDeclaration: ReadonlyMap<string, Addition<typeof MappingSourceDeclaration>>;
  readonly NameLookup: ReadonlyMap<string, Addition<typeof NameLookup>>;
  readonly PlacedDocument: ReadonlyMap<string, Addition<typeof PlacedDocument>>;
  readonly PlacedReference: ReadonlyMap<string, Addition<typeof PlacedReference>>;
  readonly Reading: ReadonlyMap<string, Addition<typeof Reading>>;
  readonly ReadingCardinality: ReadonlyMap<string, Addition<typeof ReadingCardinality>>;
  readonly ReadingDeclaration: ReadonlyMap<string, Addition<typeof ReadingDeclaration>>;
  readonly TemplateDefault: ReadonlyMap<string, Addition<typeof TemplateDefault>>;
  readonly TemplateDefaultCardinality: ReadonlyMap<
    string,
    Addition<typeof TemplateDefaultCardinality>
  >;
  readonly TemplateDefaultTarget: ReadonlyMap<string, Addition<typeof TemplateDefaultTarget>>;
  readonly VariableLookup: ReadonlyMap<string, Addition<typeof VariableLookup>>;
}

/**
 * The resource type of a name that names no resource: `none`, `NameLookup`'s null object for a name
 * that is no item ref, or an item ref whose href names no resource of the package (its
 * `E1_derived`).
 */
const noResource = "none" satisfies Addition<typeof NameLookup>["resourceType"];

/**
 * The setters, whose prefixed readings resolve nothing.
 */
const setters: ReadonlySet<string> = new Set(setterKinds);

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
  /**
   * Each declaration's cardinality, by the declaration's node, where it has one (spec reading
   * 159): a declaration whose cardinality is unwritten or spells nothing has none.
   */
  readonly cardinalities: ReadonlyMap<string, Addition<typeof DeclarationCardinality>>;
  /**
   * Each document's named declarations by `[document, name]`, the first of a repeated name (which
   * `Declaration key` refuses), as the document builder resolves a reference (`declarationsOf`):
   * the declaration a declared reading reads, through `declarationIdentifierRef`.
   */
  readonly declarations: ReadonlyMap<string, Addition<typeof DeclarationIdentifier>>;
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
}

/**
 * Read a declaration's cardinality, where it has one: none for a declaration whose cardinality is
 * unwritten or spells nothing, and for a node that declares nothing, the document a probe names.
 *
 * @param lookups - The lookups.
 * @param declaration - The declaration's node.
 * @returns Its cardinality, or none.
 */
const cardinalityAt = (
  lookups: Lookups,
  declaration: NodeId,
): Option.Option<Addition<typeof DeclarationCardinality>["cardinality"]> =>
  Option.map(
    Option.fromNullishOr(lookups.cardinalities.get(declaration)),
    ({ cardinality }) => cardinality,
  );

/**
 * Look a name up in a document's declarations, writing an absent probe where it declares none.
 *
 * @param lookups - The lookups.
 * @param document - The document.
 * @param name - The name.
 * @returns The declaration of that name, or none.
 */
const declarationProbe = (
  lookups: Lookups,
  document: NodeId,
  name: string,
): Option.Option<Addition<typeof DeclarationIdentifier>> => {
  const key = lookupKey(document, name);
  const held = Option.fromNullishOr(lookups.declarations.get(key));
  if (Option.isNone(held)) {
    lookups.probes.set(key, absentLookup(document, name));
  }

  return held;
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
    resourceType: noResource,
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
        resourceType: noResource,
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
const holdsBuiltIn = (text: ReadingText, scope: Scope, itemScoped: boolean): boolean => {
  if (text.form === "unsplit") {
    return Option.isSome(builtInOf(testKind, text.variable));
  }

  if (itemScoped) {
    return Option.isSome(builtInOf(itemKind, text.variable));
  }

  return (
    text.form === "split" &&
    scope.found &&
    durationScopes.has(scope.kind) &&
    text.variable === "duration"
  );
};

/**
 * What a reading's variable is: declared, else mapped, else built in, else none.
 *
 * @param declared - Whether the document it reads declares it.
 * @param mapped - Whether its item ref maps it.
 * @param builtIn - Whether it names a built-in of its scope.
 * @returns The source.
 */
const sourceOf = (
  declared: boolean,
  mapped: boolean,
  builtIn: boolean,
): Addition<typeof Reading>["source"] => {
  if (declared) {
    return "declared";
  }

  if (mapped) {
    return "mapped";
  }

  return builtIn ? "builtIn" : "none";
};

/**
 * The codes of the declaration a reading's variable reads, where it reads one: a declared
 * variable's, the declaration its lookup document declares of its name; a mapped one's, its
 * mapping's source's, where its item declares that source. A built-in variable, nothing, and a
 * mapping whose source its item declares nothing under give none, so the reading holds no
 * declaration, and the law that refuses the mapping refuses the reading's claim to it ("Variable
 * mapping source").
 */
type DeclarationCodes = Pick<
  Addition<typeof ReadingDeclaration>,
  "declBaseTypes" | "declCardinalities" | "declaration" | "declarationKind"
>;

/**
 * Read the codes of the declaration a reading's variable reads, as {@link DeclarationCodes} gives
 * them.
 *
 * @param source - The reading's source.
 * @param declared - Its declaration, where it reads one and the document declares its name.
 * @param mappedSource - Its mapping's source declaration, where its item declares one.
 * @returns The codes, or none.
 */
const declarationCodesOf = (
  source: Addition<typeof Reading>["source"],
  declared: Option.Option<Addition<typeof DeclarationIdentifier>>,
  mappedSource: Option.Option<Addition<typeof MappingSourceDeclaration>>,
): Option.Option<DeclarationCodes> => {
  if (source === "declared") {
    return declared.pipe(
      Option.map((declaration) => ({
        declBaseTypes: declaration.baseTypes,
        declCardinalities: declaration.cardinalities,
        declaration: declaration.node,
        declarationKind: declaration.declarationKind,
      })),
    );
  }

  return source === "mapped"
    ? mappedSource.pipe(
        Option.map((mapping) => ({
          declBaseTypes: mapping.declBaseTypes,
          declCardinalities: mapping.declCardinalities,
          declaration: mapping.declaration,
          declarationKind: mapping.declarationKind,
        })),
      )
    : Option.none();
};

/**
 * One reading of a reference by one test, and the declaration it reads where it resolves to a
 * declared or mapped variable whose declaration is held ({@link DeclarationCodes}).
 */
interface ReadingRows {
  readonly declaration: Option.Option<Addition<typeof ReadingDeclaration>>;
  readonly reading: Addition<typeof Reading>;
}

/**
 * Whether a reading resolves (M3), as `Reading`'s `resolves` states it: it reads a variable, which
 * a source names, a setter's only unsplit, and, numbered, through an item ref a replacement can
 * repeat, at a number of at least 1 (reading 88).
 *
 * @param reading - The reading.
 * @returns Whether it resolves.
 */
const readingResolves = (reading: Addition<typeof Reading>): boolean =>
  reading.form !== "name" &&
  reading.source !== "none" &&
  (reading.form === "unsplit" || !setters.has(reading.kind)) &&
  (reading.form !== "numbered" ||
    (reading.replaced && /^[0-9]*[1-9][0-9]*$/u.test(reading.number)));

/**
 * Read one reading of a reference by one test: its scope in the assembly, its variable in the
 * test's or the item's declarations and the item ref's mappings, and the source those give; and,
 * where it resolves, the declaration its declared or mapped variable reads, a row of its own. A
 * reading of a built-in variable or of nothing, one through a mapping whose source its item
 * declares nothing under, and one that does not resolve hold none.
 *
 * @param lookups - The lookups, which this adds probes to.
 * @param assembly - The test's document node.
 * @param reference - The reference.
 * @param text - The reading's text.
 * @returns The reading's row, and its declaration's where it holds one.
 */
const readingOf = (
  lookups: Lookups,
  assembly: NodeId,
  reference: Addition<typeof TestReference>,
  text: ReadingText,
): ReadingRows => {
  const scope = scopeOf(lookups, assembly, text);
  const itemScoped =
    text.form !== "unsplit" && text.form !== "name" && scope.found && scope.kind === itemRefKind;
  const itemHeld = itemScoped && scope.resourceType === itemResourceType;
  const declared =
    text.form === "unsplit" || itemHeld
      ? declarationProbe(lookups, scope.itemDocument, text.variable)
      : Option.none();
  const mapped = itemScoped && mappingProbe(lookups, scope.node, text.variable).mapped;
  const reading: Addition<typeof Reading> = {
    assembly,
    attribute: reference.attribute,
    declared: Option.isSome(declared),
    form: text.form,
    found: scope.found,
    identifier: reference.identifier,
    kind: reference.kind,
    lookupDocument: scope.itemDocument,
    mapped,
    named: scope.node,
    namedKind: scope.kind,
    node: reference.node,
    number: text.number,
    placements: scope.placements,
    replaced: scope.replaced,
    resourceType: scope.resourceType,
    role: reference.role,
    scope: text.scope,
    source: sourceOf(Option.isSome(declared), mapped, holdsBuiltIn(text, scope, itemScoped)),
    split: BigInt(text.split),
    variable: text.variable,
  };
  const codes = readingResolves(reading)
    ? declarationCodesOf(
        reading.source,
        declared,
        itemScoped
          ? Option.fromNullishOr(lookups.mappingSources.get(lookupKey(scope.node, text.variable)))
          : Option.none(),
      )
    : Option.none();

  return {
    declaration: codes.pipe(
      Option.map((held) => ({
        ...held,
        assembly,
        attribute: reading.attribute,
        form: reading.form,
        kind: reading.kind,
        lookupDocument: reading.lookupDocument,
        named: reading.named,
        node: reading.node,
        source: reading.source,
        split: reading.split,
        variable: reading.variable,
      })),
    ),
    reading,
  };
};

/**
 * Write a reading's declaration's cardinality where `Reference_type` reads it, as a row of its own:
 * a resolving reading by an attribute other than `identifier`, one that stands for a literal, of a
 * declared or mapped variable whose declaration has a cardinality (spec reading 159). Any other
 * reading has none.
 *
 * @param lookups - The lookups.
 * @param declaration - The reading's declaration, where it holds one.
 * @returns Its cardinality row, or none.
 */
const readingCardinalityOf = (
  lookups: Lookups,
  declaration: Option.Option<Addition<typeof ReadingDeclaration>>,
): Option.Option<Addition<typeof ReadingCardinality>> =>
  declaration.pipe(
    Option.filter(({ attribute }) => attribute !== "identifier"),
    Option.flatMap((held) =>
      Option.map(cardinalityAt(lookups, held.declaration), (declCardinality) => ({
        assembly: held.assembly,
        attribute: held.attribute,
        declCardinality,
        declaration: held.declaration,
        form: held.form,
        node: held.node,
        split: held.split,
      })),
    ),
  );

/**
 * A reference as one test reads it: its row with its name's pieces nested, and its readings, their
 * declarations where they hold one, and those declarations' cardinalities where `Reference_type`
 * reads one, each by `[assembly, node, attribute, form, split]`.
 */
interface ReadReference {
  readonly cardinalities: ReadonlyMap<string, Addition<typeof ReadingCardinality>>;
  readonly declarations: ReadonlyMap<string, Addition<typeof ReadingDeclaration>>;
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
  }));
  const readings = readingTextsOf(reference.identifier, reference.role).map((text) => {
    const { declaration, reading } = readingOf(lookups, assembly, reference, text);

    return {
      at: JSON.stringify([
        assembly,
        reading.node,
        reading.attribute,
        reading.form,
        String(reading.split),
      ]),
      cardinality: readingCardinalityOf(lookups, declaration),
      declaration,
      reading,
    };
  });

  return {
    cardinalities: new Map(
      readings.flatMap(({ at, cardinality }) =>
        Option.toArray(cardinality).map((row) => [at, row] as const),
      ),
    ),
    declarations: new Map(
      readings.flatMap(({ at, declaration }) =>
        Option.toArray(declaration).map((row) => [at, row] as const),
      ),
    ),
    readings: new Map(readings.map(({ at, reading }) => [at, reading])),
    row: {
      assembly,
      attribute: reference.attribute,
      document: reference.document,
      identifier: reference.identifier,
      kind: reference.kind,
      lastDigit: Option.exists(Arr.last(segments), ({ digit }) => digit),
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
 * A test's template defaults, each by its node: its row; its target, the declaration of the item
 * its item ref names, where that item declares a variable of its name; and its target's
 * declaration's cardinality, where the declaration has one.
 */
interface TemplateDefaultRows {
  readonly cardinalities: readonly (readonly [
    string,
    Addition<typeof TemplateDefaultCardinality>,
  ])[];
  readonly targets: readonly (readonly [string, Addition<typeof TemplateDefaultTarget>])[];
  readonly templateDefaults: readonly (readonly [string, Addition<typeof TemplateDefault>])[];
}

/**
 * Write a test's template defaults, each that writes its `template-identifier`, which every one
 * must (AL3): its row, and its target where its item ref names an item that declares a variable of
 * its template's name, whatever its cardinality spells (spec reading 159), and it holds its
 * expression, with that declaration and the expression's type, and beside the target the
 * declaration's cardinality where it has one. A template default with no target has none: no value
 * stands for the declaration it lacks, so "Template default target" refuses it, and its row says
 * nothing of an item.
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

  const targets = defaults.flatMap(({ node, pieces }) => {
    const itemDocument = lookups.items.get(node.parent);
    const declared =
      itemDocument === undefined
        ? undefined
        : lookups.declarations.get(lookupKey(itemDocument, pieces.name));
    const expression = held.get(node.id);

    return itemDocument === undefined || declared === undefined || expression === undefined
      ? []
      : [
          [
            node.id,
            {
              declBaseTypes: declared.baseTypes,
              declCardinalities: declared.cardinalities,
              declaration: declared.node,
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
  });

  return {
    cardinalities: targets.flatMap(([at, target]) =>
      Option.toArray(cardinalityAt(lookups, target.declaration)).map(
        (declCardinality) =>
          [
            at,
            {
              declCardinality,
              declaration: target.declaration,
              heldCardinality: target.heldCardinality,
              node: target.node,
            },
          ] as const,
      ),
    ),
    targets,
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
      const types = Option.getOrElse(Option.fromNullishOr(typesAt.get(href.path)), Arr.empty).map(
        ({ type }) => type,
      );
      const type = Option.getOrUndefined(
        Option.orElse(
          Arr.findFirst(preferred, (wanted) => types.includes(wanted)),
          () => Arr.head(types),
        ),
      );
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
 * Index a package's named declarations by `[document, name]`, the first of a repeated name, as the
 * document builder keeps it (`declarationsOf`); `Declaration key` refuses the second.
 *
 * @param documents - Every document of the package.
 * @returns The declarations, by `[document, name]`.
 */
const namedDeclarationsOf = (
  documents: readonly AssembledExpressionInput[],
): ReadonlyMap<string, Addition<typeof DeclarationIdentifier>> => {
  const named = new Map<string, Addition<typeof DeclarationIdentifier>>();
  for (const declaration of documents.flatMap((input) => [...input.declarations.values()])) {
    const key = lookupKey(declaration.document, declaration.identifier);
    if (!named.has(key)) {
      named.set(key, declaration);
    }
  }

  return named;
};

/**
 * Read the lookups a package's documents hold: each document's named declarations and their
 * cardinalities, and what each item ref names.
 *
 * @param documents - Every document of the package.
 * @param items - What each item ref names.
 * @returns The lookups, no probe written yet.
 */
const lookupsOf = (
  documents: readonly AssembledExpressionInput[],
  items: ItemRefRows,
): Lookups => ({
  cardinalities: new Map(documents.flatMap((input) => [...input.cardinalities])),
  declarations: namedDeclarationsOf(documents),
  items: new Map(
    [...items.itemRefDocuments.values()].map(({ document, node }) => [node, document]),
  ),
  mappingSources: new Map(),
  mappings: new Map(),
  names: new Map(),
  probes: new Map(),
  targets: new Map([...items.itemRefTargets.values()].map(({ node, type }) => [node, type])),
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

      if (itemDocument !== undefined && source !== undefined) {
        const row: Addition<typeof MappingSourceDeclaration> = {
          declBaseTypes: source.baseTypes,
          declCardinalities: source.cardinalities,
          declaration: source.node,
          declarationKind: source.declarationKind,
          itemDocument,
          itemRef: mapping.parent,
          node: mapping.node,
          source: mapping.source,
          target: mapping.target,
          targetDeclared: Option.isSome(declarationProbe(lookups, itemDocument, mapping.target)),
        };
        sources.set(mapping.node, row);
        lookups.mappingSources.set(key, row);
      }
    }
  }

  return sources;
};

/**
 * Force every written element of every test's assembly into the name lookups: its node, kind and
 * placements, one instance that places it and whether a replacement can repeat it there, and,
 * for an item ref, what it names. An item ref of the item type whose item the package holds no
 * document of takes the test itself as its item, `NameLookup`'s null object for "no item"
 * (`representation-gaps.md` §4.3), which `ItemRefDocument` holds no row of, so "Item ref target"
 * refuses it as it refuses the item ref; and an item ref whose href names no resource has
 * {@link noResource} for its type, which no `ItemRefTarget` row holds.
 *
 * @param documents - Every document of the package.
 * @param assembled - The package's assemblies.
 * @param lookups - The lookups, which this adds to.
 * @throws {Error} When a written element has no instance that places it or no `Named` row, which
 *   `AssembledName`, a projection of `InstanceName` over `Named`, rules out: a defect of the
 *   assembly's rows.
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
    const unplaced = () =>
      new Error(
        `The written element ${name.node} of the assembly ${name.assembly} has no instance that places it or no Named row, and AssembledName projects InstanceName over Named. Build the names from the same assembly's rows.`,
      );
    const placements = Option.getOrThrowWith(
      Option.fromNullishOr(placed.get(keyOf([name.assembly, name.node]))),
      unplaced,
    );
    const placement = Option.getOrThrowWith(Arr.head(placements), unplaced);
    const kind = Option.getOrThrowWith(Option.fromNullishOr(kinds.get(name.node)), unplaced);
    const resourceType =
      kind === itemRefKind
        ? Option.getOrElse(Option.fromNullishOr(lookups.targets.get(name.node)), () => noResource)
        : noResource;
    const holdsItem = kind === itemRefKind && resourceType === itemResourceType;
    if (!lookups.names.has(key)) {
      lookups.names.set(key, {
        assembly: name.assembly,
        found: true,
        instance: placement.instance,
        itemDocument: holdsItem
          ? Option.getOrElse(
              Option.fromNullishOr(lookups.items.get(name.node)),
              () => name.assembly,
            )
          : name.assembly,
        kind,
        name: name.identifier,
        node: name.node,
        placements: BigInt(placements.length),
        replaced: placement.replaced,
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
  readonly ReadingCardinality: ReadonlyMap<string, Addition<typeof ReadingCardinality>>;
  readonly ReadingDeclaration: ReadonlyMap<string, Addition<typeof ReadingDeclaration>>;
}

/**
 * Place every reference of every document each test places but an item, once per instance, and
 * read each once per test: the test's own, a section document's, and a fragment's the test or a
 * section document splices (spec reading 117).
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
  const declarations = new Map<string, Addition<typeof ReadingDeclaration>>();
  const cardinalities = new Map<string, Addition<typeof ReadingCardinality>>();
  const roots = [...assembled.Instance.values()].filter(
    ({ assemblyKind }) => assemblyKind === testKind,
  );
  for (const root of roots) {
    for (const instance of instancesIn(root).filter(({ rootKind }) => rootKind !== itemKind)) {
      placedDocuments.set(instance.id, {
        assembly: root.assembly,
        assemblyKind: root.assemblyKind,
        document: instance.document,
        instance: instance.id,
      });
      for (const reference of Option.getOrElse(
        Option.fromNullishOr(references.get(instance.document)),
        Arr.empty,
      )) {
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

          for (const [key, declaration] of read.declarations) {
            declarations.set(key, declaration);
          }

          for (const [key, cardinality] of read.cardinalities) {
            cardinalities.set(key, cardinality);
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
    ReadingCardinality: cardinalities,
    ReadingDeclaration: declarations,
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
    MappingLookup: lookups.mappings,
    MappingSourceDeclaration: sources,
    NameLookup: lookups.names,
    TemplateDefault: new Map(templateDefaults.flatMap((rows) => rows.templateDefaults)),
    TemplateDefaultCardinality: new Map(templateDefaults.flatMap((rows) => rows.cardinalities)),
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
  Map.groupBy([...rows.Reading.values()].filter(readingResolves), ({ assembly, attribute, node }) =>
    keyOf([assembly, node, attribute]),
  );

/**
 * A package's variable references placed under each instance of an item's assembly (spec reading
 * 117), and the declaration lookups their claims of no declaration read.
 */
export interface PlacedVariableRows {
  readonly PlacedVariableRef: ReadonlyMap<string, Addition<typeof PlacedVariableRef>>;
  readonly PlacedVariableRefDeclaration: ReadonlyMap<
    string,
    Addition<typeof PlacedVariableRefDeclaration>
  >;
  readonly VariableLookup: ReadonlyMap<string, Addition<typeof VariableLookup>>;
}

/**
 * Resolve a name among an item's declarations, else its built-in variables, else to nothing.
 *
 * @param declaration - The item's declaration of the name, if any.
 * @param name - The name.
 * @returns The resolution.
 */
const placedResolutionOf = (
  declaration: Addition<typeof DeclarationIdentifier> | undefined,
  name: string,
): Addition<typeof PlacedVariableRef>["resolution"] => {
  if (declaration !== undefined) {
    return "declared";
  }

  return Option.isSome(builtInOf(itemKind, name)) ? "builtIn" : "unresolved";
};

/**
 * Build a package's variable references in place (spec reading 117): under each instance of an
 * item's assembly, every `VariableRef` of the instance's document, its name resolved as an item's
 * own is, among the item's declarations, whatever their cardinality spells (spec reading 159),
 * else to one of an item's built-in variables, else to nothing, which "Variable declared" refuses;
 * and for each name that resolves to no declaration, the item's absent lookup that proves it.
 *
 * @param input - The package's rows the placed references read.
 * @param input.declarations - Every named declaration of the package, with its counts of
 *   cardinalities and base types (Q5.08's `DeclarationIdentifier` rows).
 * @param input.instances - Every assembly's root instance, its tree nested (Q5.13's
 *   `assembledRowsOf`).
 * @param input.references - Every document's references ({@link rowsOf}'s `VariableRef`).
 * @returns The rows.
 */
export const placedVariableRowsOf = (input: {
  readonly declarations: Iterable<Addition<typeof DeclarationIdentifier>>;
  readonly instances: Iterable<InstanceRoot>;
  readonly references: Iterable<Addition<typeof VariableRef>>;
}): PlacedVariableRows => {
  const declared = new Map(
    [...input.declarations].map((row) => [keyOf([row.document, row.identifier]), row] as const),
  );
  const referencesOf = Map.groupBy(input.references, ({ document }) => document);
  const placed = new Map<string, Addition<typeof PlacedVariableRef>>();
  const placedDeclarations = new Map<string, Addition<typeof PlacedVariableRefDeclaration>>();
  const lookups = new Map<string, Addition<typeof VariableLookup>>();
  for (const root of input.instances) {
    for (const instance of root.assemblyKind === itemKind ? instancesIn(root) : []) {
      for (const reference of Option.getOrElse(
        Option.fromNullishOr(referencesOf.get(instance.document)),
        Arr.empty,
      )) {
        const declaration = declared.get(keyOf([root.assembly, reference.identifier]));
        const at = keyOf([instance.id, reference.node, reference.attribute]);
        placed.set(at, {
          assembly: root.assembly,
          attribute: reference.attribute,
          document: instance.document,
          identifier: reference.identifier,
          instance: instance.id,
          kind: reference.kind,
          node: reference.node,
          resolution: placedResolutionOf(declaration, reference.identifier),
          rootKind: itemKind,
        });
        if (declaration === undefined) {
          lookups.set(
            lookupKey(root.assembly, reference.identifier),
            absentLookup(root.assembly, reference.identifier),
          );
        } else {
          placedDeclarations.set(at, {
            assembly: root.assembly,
            attribute: reference.attribute,
            declBaseTypes: declaration.baseTypes,
            declCardinalities: declaration.cardinalities,
            declaration: declaration.node,
            declarationKind: declaration.declarationKind,
            identifier: reference.identifier,
            instance: instance.id,
            kind: reference.kind,
            node: reference.node,
          });
        }
      }
    }
  }

  return {
    PlacedVariableRef: placed,
    PlacedVariableRefDeclaration: placedDeclarations,
    VariableLookup: lookups,
  };
};
