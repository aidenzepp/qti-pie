/**
 * The interaction overlays' rows (plan §1.7 O3, §C's `rowsOf`): from a document's XDM tree and the
 * ids its nodes are written under, the rows of every overlay `#pantry/qti/interactions.ts`
 * declares, each relation's rows a keyed set.
 *
 * The rows restate what the tree says and nothing else: each overlay copies its node's tuple as
 * the tree's own rows give it (`flatten` of `#pantry/model/xdm.ts`), each attribute's lexical form
 * as written and its collapsed value, each count as written or its XSD default, and each name a
 * binding or a reference makes resolved among the document's declarations. The database proves
 * every one of them (`interactionLaws`), so a row this builder gets wrong is refused, never
 * accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Array as Arr, Option } from "effect";
import {
  BuiltInVariable,
  ChoiceBound,
  ContentReference,
  interactionKinds,
} from "#pantry/grammar/install.ts";
import { booleanOf, collapse, isNcName } from "#pantry/grammar/domains.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Folds } from "#pantry/import/fold.ts";
import { declarationOf, typedCountOf } from "#pantry/import/overlays/declarations.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type {
  DeclarationBaseType,
  DeclarationCardinality,
  DeclarationIdentifier,
} from "#pantry/qti/declarations.ts";
import { itemKind } from "#pantry/qti/tests.ts";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";
import {
  adaptiveName,
  ariaNames,
  bindingAttributes,
  choiceKinds,
  countDefault,
  hotspotKinds,
  hottextKind,
  readAttributes,
  references,
  referringRoots,
  sliderKind,
} from "#pantry/qti/interactions.ts";
import type {
  AriaElement,
  AriaRange,
  AriaValue,
  Binding,
  BindingBaseType,
  BindingCardinality,
  BindingDeclaration,
  BindingName,
  BoundVariable,
  Choice,
  ChoiceInteraction,
  ChoiceVariableName,
  ContextRef,
  ContextRefDeclaration,
  CountBound,
  CountRange,
  FeedbackRef,
  FeedbackRefCardinality,
  FeedbackRefDeclaration,
  Hotspot,
  Hottext,
  Interaction,
  InteractionAttribute,
  ItemMode,
  LeastCount,
  MostCount,
  PlacedBinding,
  PlacedBindingBaseType,
  PlacedBindingCardinality,
  PlacedBindingDeclaration,
  PlacedChoice,
  PlacedHottext,
  PrintedVariableRef,
  PrintedVariableRefDeclaration,
  ReferringDocument,
  SectionContextName,
  SectionContextRef,
  SectionContextRefDeclaration,
  SectionFeedbackName,
  SectionFeedbackRef,
  SectionFeedbackRefCardinality,
  SectionFeedbackRefDeclaration,
  SectionPrintedName,
  SectionPrintedRef,
  SectionPrintedRefDeclaration,
  SectionScope,
  SectionTemplateName,
  SectionTemplateRef,
  SectionTemplateRefDeclaration,
  Slider,
  TemplateRef,
  TemplateRefDeclaration,
} from "#pantry/qti/interactions.ts";

/**
 * The ids a document's rows are written under: each node's, drawn by the number `flatten` gives
 * it, in document order from the document node's 0.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface InteractionIds {
  /**
   * The document's context (spec reading 117), `ownContext` of its document node for a document no
   * site names: an included fragment's nodes take the interaction their includes stand in as their
   * nearest.
   */
  readonly context: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * The interaction overlays' rows, one keyed set per relation: each map from the text of a row's key
 * to the row as its writer writes it. A node-keyed row's key text is its node's id; a row keyed by
 * more fields has its key's values in key order, as a JSON array.
 */
export interface InteractionRows {
  readonly AriaElement: ReadonlyMap<string, Addition<typeof AriaElement>>;
  readonly AriaRange: ReadonlyMap<string, Addition<typeof AriaRange>>;
  readonly AriaValue: ReadonlyMap<string, Addition<typeof AriaValue>>;
  readonly Binding: ReadonlyMap<string, Addition<typeof Binding>>;
  readonly BindingBaseType: ReadonlyMap<string, Addition<typeof BindingBaseType>>;
  readonly BindingCardinality: ReadonlyMap<string, Addition<typeof BindingCardinality>>;
  readonly BindingDeclaration: ReadonlyMap<string, Addition<typeof BindingDeclaration>>;
  readonly BindingName: ReadonlyMap<string, Addition<typeof BindingName>>;
  readonly BoundVariable: ReadonlyMap<string, Addition<typeof BoundVariable>>;
  readonly Choice: ReadonlyMap<string, Addition<typeof Choice>>;
  readonly ChoiceInteraction: ReadonlyMap<string, Addition<typeof ChoiceInteraction>>;
  readonly ChoiceVariableName: ReadonlyMap<string, Addition<typeof ChoiceVariableName>>;
  readonly ContextRef: ReadonlyMap<string, Addition<typeof ContextRef>>;
  readonly ContextRefDeclaration: ReadonlyMap<string, Addition<typeof ContextRefDeclaration>>;
  readonly CountBound: ReadonlyMap<string, Addition<typeof CountBound>>;
  readonly CountRange: ReadonlyMap<string, Addition<typeof CountRange>>;
  readonly FeedbackRef: ReadonlyMap<string, Addition<typeof FeedbackRef>>;
  readonly FeedbackRefCardinality: ReadonlyMap<string, Addition<typeof FeedbackRefCardinality>>;
  readonly FeedbackRefDeclaration: ReadonlyMap<string, Addition<typeof FeedbackRefDeclaration>>;
  readonly Hotspot: ReadonlyMap<string, Addition<typeof Hotspot>>;
  readonly Hottext: ReadonlyMap<string, Addition<typeof Hottext>>;
  readonly Interaction: ReadonlyMap<string, Addition<typeof Interaction>>;
  readonly InteractionAttribute: ReadonlyMap<string, Addition<typeof InteractionAttribute>>;
  readonly ItemMode: ReadonlyMap<string, Addition<typeof ItemMode>>;
  readonly LeastCount: ReadonlyMap<string, Addition<typeof LeastCount>>;
  readonly MostCount: ReadonlyMap<string, Addition<typeof MostCount>>;
  readonly PrintedVariableRef: ReadonlyMap<string, Addition<typeof PrintedVariableRef>>;
  readonly PrintedVariableRefDeclaration: ReadonlyMap<
    string,
    Addition<typeof PrintedVariableRefDeclaration>
  >;
  readonly ReferringDocument: ReadonlyMap<string, Addition<typeof ReferringDocument>>;
  readonly SectionContextName: ReadonlyMap<string, Addition<typeof SectionContextName>>;
  readonly SectionFeedbackName: ReadonlyMap<string, Addition<typeof SectionFeedbackName>>;
  readonly SectionPrintedName: ReadonlyMap<string, Addition<typeof SectionPrintedName>>;
  readonly SectionTemplateName: ReadonlyMap<string, Addition<typeof SectionTemplateName>>;
  readonly Slider: ReadonlyMap<string, Addition<typeof Slider>>;
  readonly TemplateRef: ReadonlyMap<string, Addition<typeof TemplateRef>>;
  readonly TemplateRefDeclaration: ReadonlyMap<string, Addition<typeof TemplateRefDeclaration>>;
}

/**
 * A content reference's declaration row as each reference relation's writes it: the four relations
 * share one heading.
 */
type ReferenceDeclarationRow = Addition<typeof FeedbackRefDeclaration>;

/**
 * A declaration as a binding or a reference resolves its name against it, whatever its cardinality
 * spells (spec reading 159): its node, kind as a `DeclarationKind`, name, the identifier collapsed,
 * and the codes its `cardinality` and `base-type` spell, each none where it spells none, which the
 * binding's or the reference's declaration row copies only as its count ({@link typedCountOf}) and
 * its cardinality and base type rows hold where they are.
 */
interface NamedVariable {
  readonly baseType: Option.Option<Addition<typeof BindingBaseType>["baseType"]>;
  readonly cardinality: Option.Option<Addition<typeof BindingCardinality>["cardinality"]>;
  readonly declarationKind: Addition<typeof BindingDeclaration>["declarationKind"];
  readonly identifier: string;
  readonly node: NodeId;
}

/**
 * A count attribute `ChoiceBound` names.
 */
type CountName = (typeof ChoiceBound.rows)[number]["min"];

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * An `xs:integer` form, split into its sign and its digits (XML Schema 1.1 Part 2 §3.3.13).
 */
const integerParts = /^(?<sign>[+-]?)(?<digits>[0-9]+)$/u;

/**
 * The largest count a package holds, the signed 64-bit integer's (spec reading 46).
 */
const countMost = 2n ** 63n - 1n;

/**
 * Read a count's form as its value: the import's own lexical mapping, apart from the law oracle's.
 * An `xs:integer` form is an optional sign and its digits, whose value is the digits' negated after
 * a `-` (XML Schema 1.1 Part 2 §3.3.13), so `0`, `+0`, `-0` and `00` all read 0 (§3.3.20). A count
 * is an `xs:nonNegativeInteger` held to the signed 64-bit range (reading 46), so a form whose value
 * lies outside it, `-1` or past 2^63 − 1, has none, as a form that is no integer's has none: its
 * value domain is its law. The database's own reading of the same forms is `integerReadOf` in
 * `#pantry/qti/interactions.ts`.
 *
 * @param form - The count's collapsed form.
 * @returns Its value, or none.
 */
const countValueOf = (form: string): Option.Option<bigint> => {
  const groups = integerParts.exec(form)?.groups;

  return Option.fromNullishOr(groups?.["digits"]).pipe(
    Option.map((digits) => (groups?.["sign"] === "-" ? -BigInt(digits) : BigInt(digits))),
    Option.filter((value) => value >= 0n && value <= countMost),
  );
};

/**
 * Write the key text of a row keyed by several fields.
 *
 * @param values - The key's values, in key order.
 * @returns Their JSON array.
 */
const keyOf = (values: readonly string[]): string => JSON.stringify(values);

/**
 * A node's kind as the tree's rows hold it.
 */
type KindOfNode = NodeRow<Composed>["kind"];

/**
 * Read a map at a key it holds by construction: a document's node kinds at a node of the document
 * (every attribute's element and every element's parent is a node `flatten` writes), the counted
 * bounds at a bound of the rows counted ({@link choiceCountsOf}), the package's item modes at an
 * item's assembly, whose root is an item document with its `ItemMode`.
 *
 * @param map - The map.
 * @param key - A key it holds.
 * @param holds - What the map holds, for the defect.
 * @returns The value at the key.
 * @throws {Error} When the map holds no value at the key: a defect of the caller, which read a key
 *   of other rows than the map was built from.
 */
const heldAt = <V>(map: ReadonlyMap<NodeId, V>, key: NodeId, holds: string): V => {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(
      `${key} is none of ${holds}, which hold every key the builder reads in them. Read each key in the rows the map was built from.`,
    );
  }

  return value;
};

/**
 * One document as the builders read it: its flat rows, its document node and root kind, each
 * node's fold (`#pantry/import/fold.ts`), which holds its nearest interaction (N8), that
 * interaction's kind and its element counts, each node's kind, each element's attributes, its
 * named declarations whatever their cardinality, which a binding, a reference and a choice's name
 * resolve against (spec reading 159), and, for an item, its mode: whether it is adaptive.
 */
interface Context {
  readonly attributes: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
  readonly document: NodeId;
  readonly folds: Folds;
  readonly itemMode: Option.Option<boolean>;
  readonly kinds: ReadonlyMap<NodeId, KindOfNode>;
  readonly named: readonly NamedVariable[];
  readonly rootKind: KindOfNode;
  readonly rows: FlatRows<Composed>;
}

/**
 * Read an element's attribute as written.
 *
 * @param context - The document.
 * @param node - The element.
 * @param name - The attribute's name.
 * @returns Its lexical form, or none where the element does not carry it.
 */
const lexicalOf = (
  context: Pick<Context, "attributes">,
  node: NodeId,
  name: string,
): Option.Option<string> => Option.fromNullishOr(context.attributes.get(node)?.get(name));

/**
 * Read an element's attribute collapsed (XML Schema Part 2, §4.3.6), as
 * `InteractionAttribute.value` holds it: whitespace inside a value is kept, one space a run, so a
 * value with some is no value of the attribute's atomic type, and its value domain refuses it
 * alone.
 *
 * @param context - The document.
 * @param node - The element.
 * @param name - The attribute's name.
 * @returns Its value, or none where the element does not carry it.
 */
const valueOf = (
  context: Pick<Context, "attributes">,
  node: NodeId,
  name: string,
): Option.Option<string> => Option.map(lexicalOf(context, node, name), collapse);

/**
 * Read the name an element's attribute gives: its value collapsed, where that is an NCName
 * ({@link isNcName}). Any other value names nothing, and its value domain refuses it alone (spec
 * reading 152).
 *
 * @param context - The document.
 * @param node - The element.
 * @param name - The attribute's name.
 * @returns The name, or none where the element does not carry the attribute or it names nothing.
 */
const nameOf = (
  context: Pick<Context, "attributes">,
  node: NodeId,
  name: string,
): Option.Option<string> => Option.filter(valueOf(context, node, name), isNcName);

/**
 * Read a node's `nodeRef` tuple, with its nearest interaction.
 *
 * @param context - The document.
 * @param node - The node.
 * @returns The tuple.
 */
const tupleOf = (context: Context, node: NodeRow<Composed>) => ({
  document: context.document,
  kind: node.kind,
  nearest: foldAt(context.folds, node.id).nearest,
  node: node.id,
  parent: node.parent,
  start: node.start,
  version: node.version,
});

/**
 * Read a document's declarations whose identifier names something, whatever their cardinality and
 * base type spell, in document order: the declarations a binding, a reference and a choice's name
 * resolve against (spec reading 159), as `DeclarationIdentifier` holds them
 * (`#pantry/import/overlays/declarations.ts` `declarationOf`). A declaring element whose
 * `identifier` is unwritten or names nothing has no name, so nothing binds or references it (spec
 * reading 157).
 *
 * @param context - The document, its declarations not yet read.
 * @returns The named declarations.
 */
const namedOf = (context: Omit<Context, "itemMode" | "named">): Pick<Context, "named"> => ({
  named: context.rows.nodes.flatMap((node) =>
    Option.toArray(declarationOf(node.kind, (name) => lexicalOf(context, node.id, name))).flatMap(
      (declaration) =>
        Option.toArray(declaration.name).map(({ pieces }) => ({
          baseType: declaration.baseType,
          cardinality: declaration.cardinality,
          declarationKind: declaration.declarationKind,
          identifier: pieces.name,
          node: node.id,
        })),
    ),
  ),
});

/**
 * The `adaptive` of an item that writes none: its XSD default (the QTI 3.0 ASI schema,
 * `imsqti_asiv3p0_v1p0.xsd`, `qti-assessment-item`: `<xs:attribute name="adaptive" use="optional"
 * default="false" type="xs:boolean" />`).
 */
const adaptiveDefault = false;

/**
 * Read whether an item is adaptive: its `adaptive` where written, true where its value is one of
 * `xs:boolean`'s true forms, as `ItemMode` mirrors them; else its XSD default,
 * {@link adaptiveDefault}. A written form that is no boolean is no true form, and its attribute's
 * value domain refuses it.
 *
 * @param context - The document, its attributes read.
 * @param item - The item's element.
 * @returns Whether the item is adaptive.
 */
const adaptiveOf = (context: Pick<Context, "attributes">, item: NodeId): boolean =>
  Option.match(valueOf(context, item, adaptiveName), {
    onNone: () => adaptiveDefault,
    onSome: (form) => Option.contains(booleanOf(form), true),
  });

/**
 * Read a document for the builders.
 *
 * @param doc - The document's tree.
 * @param ids - The ids its rows are written under.
 * @returns The document as the builders read it.
 */
const contextOf = (doc: XdmDocument<Composed>, ids: InteractionIds): Context => {
  const rows = flatten(doc, ids.idOf);
  const base = {
    attributes: new Map(
      [...Map.groupBy(rows.attributes, ({ node }) => node)].map(
        ([node, held]) =>
          [node, new Map(held.map(({ lexical, name }) => [name, lexical]))] as const,
      ),
    ),
    document: rows.document.node,
    folds: foldOf(rows.nodes, ids.context),
    kinds: new Map(rows.nodes.map((node) => [node.id, node.kind] as const)),
    rootKind: doc.root.kind,
    rows,
  };

  return {
    ...base,
    itemMode: Option.map(
      Option.filter(
        Arr.findFirst(rows.nodes, ({ kind }) => kind === itemKind),
        () => doc.root.kind === itemKind,
      ),
      (item) => adaptiveOf(base, item.id),
    ),
    ...namedOf(base),
  };
};

/**
 * The declaration kinds a content reference of each attribute on each kind may name
 * (`ContentReference`), as `<attribute> <kind> <declaration kind>`.
 */
const allowedNames: ReadonlySet<string> = new Set(
  ContentReference.rows.map(
    ({ attribute, declaration, kind }) => `${attribute} ${kind} ${declaration}`,
  ),
);

/**
 * Each built-in variable under the root that holds it, as `<root> <variable>`, as the installed
 * `BuiltInVariable` holds them (spec reading 29): an item's are not a test's.
 */
const rootBuiltIns: ReadonlySet<string> = new Set(
  BuiltInVariable.rows.map(({ root, variable }) => `${root} ${variable}`),
);

/**
 * Find the declaration a content reference names: none for a built-in variable of the root of the
 * assembly it resolves in, which stands as a declaration but has none, whose law reads the
 * installed `BuiltInVariable`; else the first declaration of the name of a kind `ContentReference`
 * lets the reference name, whatever its cardinality spells (spec reading 159); else none, a name
 * no declaration the reference may name holds, which its law refuses (lane NIL's NS2: a missing
 * value is a row of its own relation, never the nil uuid). A name only another root holds as a
 * built-in, a test's `completionStatus`, is no built-in there.
 *
 * @param named - The named declarations the name resolves among.
 * @param reference - The reference.
 * @param reference.assemblyKind - The root kind of the assembly it resolves in.
 * @param reference.attribute - The attribute it refers by.
 * @param reference.identifier - The name, collapsed.
 * @param reference.kind - The kind of the element that carries it.
 * @returns The declaration, or none.
 */
const declarationIn = (
  named: Context["named"],
  reference: {
    readonly assemblyKind: string;
    readonly attribute: string;
    readonly identifier: string;
    readonly kind: string;
  },
): Option.Option<NamedVariable> =>
  rootBuiltIns.has(`${reference.assemblyKind} ${reference.identifier}`)
    ? Option.none()
    : Arr.findFirst(
        named,
        ({ declarationKind, identifier }) =>
          identifier === reference.identifier &&
          allowedNames.has(`${reference.attribute} ${reference.kind} ${declarationKind}`),
      );

/**
 * The rows of one content reference relation, of its declarations, and of its declarations'
 * cardinalities where each has one (spec reading 159), each keyed alike. Only a feedback's
 * cardinality rows are a relation's ({@link FeedbackRefCardinality}): "Feedback outcome type" is
 * the one law over a content reference that reads its variable's cardinality.
 */
interface ReferenceRows<Reference, Declared, Cardinal> {
  readonly cardinalities: ReadonlyMap<string, Cardinal>;
  readonly declarations: ReadonlyMap<string, Declared>;
  readonly references: ReadonlyMap<string, Reference>;
}

/**
 * Find the response declaration a binding names among its item's named declarations, the first in
 * document order, whatever its cardinality spells (spec reading 159). A built-in variable, a
 * declaration of another kind and a name no declaration holds bind no response variable, so each
 * has none, and its binding no declaration row.
 *
 * @param named - The item's named declarations.
 * @param identifier - The name, collapsed.
 * @returns The response declaration, or none.
 */
const responseIn = (
  named: readonly NamedVariable[],
  identifier: string,
): Option.Option<NamedVariable> =>
  Arr.findFirst(
    named,
    (declaration) =>
      declaration.identifier === identifier &&
      declaration.declarationKind === "qti-response-declaration",
  );

/**
 * The attributes O3 reads on each kind ({@link readAttributes}), as `<name> <kind>`.
 */
const readOnKinds: ReadonlySet<string> = new Set(
  [...readAttributes].flatMap(([name, kinds]) => kinds.map((kind) => `${name} ${kind}`)),
);

/**
 * Build the read attributes: each attribute O3 reads, its lexical form and its value collapsed.
 *
 * @param context - The document.
 * @returns The rows, keyed by (node, name).
 */
const interactionAttributesOf = (context: Context) =>
  new Map(
    context.rows.attributes.flatMap(({ lexical, name, node }) => {
      const kind = heldAt(context.kinds, node, "the document's nodes");
      const read = ariaNames.some((aria) => aria === name) || readOnKinds.has(`${name} ${kind}`);

      return read
        ? [
            [
              keyOf([node, name]),
              {
                document: context.document,
                kind,
                lexical,
                name,
                node,
                rootKind: context.rootKind,
                value: collapse(lexical),
              } satisfies Addition<typeof InteractionAttribute>,
            ] as const,
          ]
        : [];
    }),
  );

/**
 * Build each interaction's row, every interaction element's, whether or not it writes a
 * `response-identifier`: the owner of its choices.
 *
 * @param context - The document.
 * @returns The rows, keyed by node.
 */
const interactionsOf = (context: Context) =>
  new Map(
    context.rows.nodes
      .filter(({ kind }) => interactions.has(kind))
      .map(
        (node) => [node.id, tupleOf(context, node) satisfies Addition<typeof Interaction>] as const,
      ),
  );

/**
 * Build each choice's row.
 *
 * @param context - The document.
 * @returns The rows, keyed by node.
 */
const choicesOf = (context: Context) =>
  new Map(
    context.rows.nodes
      .filter(({ kind }) => choiceKinds.some((choice) => choice === kind))
      .flatMap((node) =>
        Option.toArray(valueOf(context, node.id, "identifier")).map(
          (identifier) =>
            [
              node.id,
              { ...tupleOf(context, node), identifier } satisfies Addition<typeof Choice>,
            ] as const,
        ),
      ),
  );

/**
 * Build each choice's interaction: its nearest, where that is an interaction, in its own document
 * or the one its fragment is placed in. A choice no interaction encloses has none, and "N8 nearest"
 * refuses it; a gap among those breaks N6 first.
 *
 * @param context - The document.
 * @param choices - Its choices' rows.
 * @returns The rows, keyed by the choice's node.
 */
const choiceInteractionsOf = (
  context: Context,
  choices: ReadonlyMap<string, Addition<typeof Choice>>,
) =>
  new Map(
    [...choices.values()]
      .filter(({ node }) => interactions.has(foldAt(context.folds, node).nearestKind))
      .map(
        ({ nearest, node }) =>
          [
            node,
            { interaction: nearest, node } satisfies Addition<typeof ChoiceInteraction>,
          ] as const,
      ),
  );

/**
 * Build each hottext's row, with its nearest interaction's kind.
 *
 * @param context - The document.
 * @returns The rows, keyed by node.
 */
const hottextsOf = (context: Context) =>
  new Map(
    context.rows.nodes
      .filter(({ kind }) => kind === hottextKind)
      .flatMap((node) =>
        Option.toArray(valueOf(context, node.id, "identifier")).map(
          (identifier) =>
            [
              node.id,
              {
                ...tupleOf(context, node),
                identifier,
                nearestKind: foldAt(context.folds, node.id).nearestKind,
              } satisfies Addition<typeof Hottext>,
            ] as const,
        ),
      ),
  );

/**
 * Build each identifier's {@link ChoiceVariableName} row: one per identifier a choice, a hottext
 * or a declaration of the document bears, each once, with the document's root kind. Its counts are
 * the families' to draw, so the row is the identifier alone. A declaration is read as Q5.08's
 * builder writes its `DeclarationIdentifier` row (`declarationOf`), whatever its cardinality
 * spells (spec reading 159), so every `DeclarationIdentifier` row has its projection row, and a
 * declaration whose identifier names nothing counts toward no name.
 *
 * @param context - The document.
 * @param choices - Its choices' rows.
 * @param hottexts - Its hottexts' rows.
 * @returns The rows, keyed by (document, identifier).
 */
const choiceNamesOf = (
  context: Context,
  choices: ReadonlyMap<string, Addition<typeof Choice>>,
  hottexts: ReadonlyMap<string, Addition<typeof Hottext>>,
) =>
  new Map(
    [
      ...[...choices.values()].map(({ identifier }) => identifier),
      ...[...hottexts.values()].map(({ identifier }) => identifier),
      ...context.named.map(({ identifier }) => identifier),
    ].map(
      (identifier) =>
        [
          keyOf([context.document, identifier]),
          {
            document: context.document,
            identifier,
            rootKind: context.rootKind,
          } satisfies Addition<typeof ChoiceVariableName>,
        ] as const,
    ),
  );

/**
 * Build each hotspot's row: its shape, its parent's kind, and its and its parent's element counts.
 *
 * @param context - The document.
 * @returns The rows, keyed by node.
 */
const hotspotsOf = (context: Context) =>
  new Map(
    context.rows.nodes
      .filter(({ kind }) => hotspotKinds.some((hotspot) => hotspot === kind))
      .flatMap((node) =>
        Option.toArray(valueOf(context, node.id, "shape")).map(
          (area) =>
            [
              node.id,
              {
                ...tupleOf(context, node),
                area,
                elementChildren: foldAt(context.folds, node.id).elementChildren,
                elements: foldAt(context.folds, node.id).elements,
                parentElementChildren: foldAt(context.folds, node.parent).elementChildren,
                parentElements: foldAt(context.folds, node.parent).elements,
                parentKind: heldAt(context.kinds, node.parent, "the document's nodes"),
              } satisfies Addition<typeof Hotspot>,
            ] as const,
        ),
      ),
  );

/**
 * Read one count of a bound: whether it is written, and its value where it has one. A written count
 * has the value its form names where it has one ({@link countValueOf}); an unwritten one has its
 * XSD default where the XSD gives one. Any other count has none, and no row holds it (lane NIL's
 * audit, B8: a missing value is a row of its own relation, never a sentinel).
 *
 * @param context - The document.
 * @param node - The element.
 * @param name - The count's attribute.
 * @returns Whether it is written, and its value's form and integer, where it has one.
 */
const countOf = (context: Context, node: NodeRow<Composed>, name: CountName) => {
  const written = valueOf(context, node.id, name);
  const form = Option.orElse(written, () => countDefault(node.version, node.kind, name));

  return {
    value: form.pipe(
      Option.flatMap((lexical) =>
        countValueOf(lexical).pipe(Option.map((integer) => ({ form: lexical, integer }))),
      ),
    ),
    written: Option.isSome(written),
  };
};

/**
 * Read the count of most values a binding's interaction has: 1 where `ChoiceBound` pairs its kind's
 * counts and its most has a value ({@link countOf}), else 0, which `BindingDeclaration.mosts` and
 * `PlacedBindingDeclaration.mosts` copy.
 *
 * @param context - The document.
 * @param node - The interaction.
 * @returns The count.
 */
const mostsOf = (context: Context, node: NodeRow<Composed>): bigint =>
  ChoiceBound.rows.some(
    ({ kind, max }) => kind === node.kind && Option.isSome(countOf(context, node, max).value),
  )
    ? 1n
    : 0n;

/**
 * Build each interaction's binding, and in an item, under its mode, each of its bound variables,
 * the response declaration each names, where one does, whatever its cardinality spells, and that
 * declaration's cardinality and base type, each where it has one (spec reading 159).
 *
 * @param context - The document.
 * @returns The `Binding` rows, keyed by node, and the `BindingName` rows of every document and
 *   the `BoundVariable`, `BindingDeclaration`, `BindingCardinality` and `BindingBaseType` rows of
 *   an item, each keyed by (node, attribute).
 */
const bindingsOf = (context: Context) => {
  const bindings = new Map<string, Addition<typeof Binding>>();
  const names = new Map<string, Addition<typeof BindingName>>();
  const bound = new Map<string, Addition<typeof BoundVariable>>();
  const declarations = new Map<string, Addition<typeof BindingDeclaration>>();
  const cardinalities = new Map<string, Addition<typeof BindingCardinality>>();
  const baseTyped = new Map<string, Addition<typeof BindingBaseType>>();
  for (const node of context.rows.nodes.filter(({ kind }) => interactions.has(kind))) {
    if (Option.isSome(valueOf(context, node.id, "response-identifier"))) {
      bindings.set(node.id, tupleOf(context, node));
    }

    for (const attribute of bindingAttributes) {
      for (const identifier of Option.toArray(nameOf(context, node.id, attribute))) {
        names.set(keyOf([node.id, attribute]), {
          attribute,
          document: context.document,
          identifier,
          kind: node.kind,
          node: node.id,
        });
      }
    }

    for (const adaptive of Option.toArray(context.itemMode)) {
      for (const attribute of bindingAttributes) {
        for (const identifier of Option.toArray(nameOf(context, node.id, attribute))) {
          const binding = {
            attribute,
            document: context.document,
            identifier,
            kind: node.kind,
            node: node.id,
          };
          bound.set(keyOf([node.id, attribute]), { ...binding, adaptive });
          for (const variable of Option.toArray(responseIn(context.named, identifier))) {
            const baseTypes = typedCountOf(variable.baseType);
            declarations.set(keyOf([node.id, attribute]), {
              ...binding,
              baseTypes,
              cardinalities: typedCountOf(variable.cardinality),
              declaration: variable.node,
              declarationKind: variable.declarationKind,
            });
            for (const cardinality of Option.toArray(variable.cardinality)) {
              cardinalities.set(keyOf([node.id, attribute]), {
                attribute,
                baseTypes,
                cardinality,
                declaration: variable.node,
                kind: node.kind,
                mosts: mostsOf(context, node),
                node: node.id,
              });
              for (const baseType of Option.toArray(variable.baseType)) {
                baseTyped.set(keyOf([node.id, attribute]), {
                  attribute,
                  baseType,
                  cardinality,
                  declaration: variable.node,
                  kind: node.kind,
                  node: node.id,
                });
              }
            }
          }
        }
      }
    }
  }

  return { baseTyped, bindings, bound, cardinalities, declarations, names };
};

/**
 * Join two row sets on a key: each left row, in its order, with every right row whose key is its
 * own, none where no right row's is; a right row whose key no left row has joins nothing. Both
 * sides are grouped under the one key and each group is read whole, so no lookup by key can miss.
 *
 * @param left - The left rows.
 * @param leftKey - A left row's key.
 * @param right - The right rows.
 * @param rightKey - A right row's key.
 * @returns Each left row with its right rows.
 */
const joinOn = <L, R>(
  left: Iterable<L>,
  leftKey: (row: L) => string,
  right: Iterable<R>,
  rightKey: (row: R) => string,
): readonly (readonly [L, readonly R[]])[] => {
  const sides: readonly (
    | { readonly at: number; readonly row: L; readonly side: "left" }
    | { readonly row: R; readonly side: "right" }
  )[] = [
    ...Array.from(left, (row, at) => ({ at, row, side: "left" as const })),
    ...Array.from(right, (row) => ({ row, side: "right" as const })),
  ];

  return [
    ...Map.groupBy(sides, (side) =>
      side.side === "left" ? leftKey(side.row) : rightKey(side.row),
    ).values(),
  ]
    .flatMap((group) => {
      const rights = group.flatMap((side) => (side.side === "right" ? [side.row] : []));

      return group.flatMap((side) =>
        side.side === "left" ? [{ at: side.at, joined: [side.row, rights] as const }] : [],
      );
    })
    .toSorted((a, b) => a.at - b.at)
    .map(({ joined }) => joined);
};

/**
 * Count the choices each of some bounds' nodes owns: its {@link ChoiceInteraction} rows among
 * `owned`, which `CountBound.choices` holds, an interaction's `Interaction.choices`. A node no row
 * names owns none: an interaction with no choice, and every choice, which encloses no choice as its
 * interaction (`CountBound`'s `E1_derived`). A row whose interaction is none of the nodes, a
 * fragment's choice in the interaction of the item that includes it, counts toward none of them.
 *
 * @param nodes - The bounds' nodes, of one document or of the whole package.
 * @param owned - Choices' interactions, of the same.
 * @returns Each node's count.
 */
const choiceCountsOf = (
  nodes: Iterable<NodeId>,
  owned: Iterable<Addition<typeof ChoiceInteraction>>,
): ReadonlyMap<NodeId, bigint> =>
  new Map(
    joinOn(
      nodes,
      (node) => node,
      owned,
      ({ interaction }) => interaction,
    ).map(([node, choices]) => [node, BigInt(choices.length)] as const),
  );

/**
 * Build each bound's rows, an interaction's choices the count of the choices it owns in its own
 * document: {@link withPackageChoices} adds those a fragment placed in it holds. Each bound has
 * its {@link CountBound}, and each of its counts that has a value ({@link countOf}) its
 * {@link LeastCount} or {@link MostCount}, and a bound both of whose counts have one its
 * {@link CountRange}.
 *
 * @param context - The document.
 * @param owned - The document's choices' interactions.
 * @returns The rows, each relation's keyed by node.
 */
const boundsOf = (
  context: Context,
  owned: ReadonlyMap<string, Addition<typeof ChoiceInteraction>>,
) => {
  const bounded = context.rows.nodes.flatMap((node) =>
    ChoiceBound.rows
      .filter(({ kind }) => kind === node.kind)
      .map(({ max, min }) => ({ max, min, node })),
  );
  const counts = choiceCountsOf(
    bounded.map(({ node }) => node.id),
    owned.values(),
  );
  const bounds = new Map<string, Addition<typeof CountBound>>();
  const leasts = new Map<string, Addition<typeof LeastCount>>();
  const mosts = new Map<string, Addition<typeof MostCount>>();
  const ranges = new Map<string, Addition<typeof CountRange>>();
  for (const { max, min, node } of bounded) {
    const least = countOf(context, node, min);
    const most = countOf(context, node, max);
    const choices = heldAt(counts, node.id, "the counted bounds");
    const copied = { choices, kind: node.kind, node: node.id, version: node.version };
    bounds.set(node.id, {
      ...tupleOf(context, node),
      choices,
      maxName: max,
      maxWritten: most.written,
      minName: min,
      minWritten: least.written,
    });
    for (const { form, integer } of Option.toArray(least.value)) {
      leasts.set(node.id, {
        ...copied,
        least: form,
        leastValue: integer,
        minName: min,
        minWritten: least.written,
      });
    }

    for (const { form, integer } of Option.toArray(most.value)) {
      mosts.set(node.id, {
        ...copied,
        maxName: max,
        maxWritten: most.written,
        minWritten: least.written,
        most: form,
        mostValue: integer,
      });
    }

    for (const [leastValue, mostValue] of Option.toArray(Option.all([least.value, most.value])).map(
      ([lower, upper]) => [lower.integer, upper.integer] as const,
    )) {
      ranges.set(node.id, {
        kind: node.kind,
        leastValue,
        minWritten: least.written,
        mostValue,
        node: node.id,
      });
    }
  }

  return { bounds, leasts, mosts, ranges };
};

/**
 * Build each slider's bounds, where it writes both.
 *
 * @param context - The document.
 * @returns The rows, keyed by node.
 */
const slidersOf = (context: Context) =>
  new Map(
    context.rows.nodes
      .filter(({ kind }) => kind === sliderKind)
      .flatMap((node) =>
        Option.toArray(
          Option.all([
            valueOf(context, node.id, "lower-bound"),
            valueOf(context, node.id, "upper-bound"),
          ]),
        ).map(
          ([lower, upper]) =>
            [node.id, { lower, node: node.id, upper } satisfies Addition<typeof Slider>] as const,
        ),
      ),
  );

/**
 * Build the ARIA range rows: each range attribute's value, each element that carries one, and each
 * that carries both.
 *
 * @param context - The document.
 * @returns The `AriaValue` rows, keyed by (node, name), and the `AriaElement` and `AriaRange` rows,
 *   keyed by node.
 */
const ariaOf = (context: Context) => {
  const values = new Map<string, Addition<typeof AriaValue>>();
  const elements = new Map<string, Addition<typeof AriaElement>>();
  const ranges = new Map<string, Addition<typeof AriaRange>>();
  for (const node of context.rows.nodes) {
    const [min, max] = [
      valueOf(context, node.id, "aria-valuemin"),
      valueOf(context, node.id, "aria-valuemax"),
    ];
    for (const [name, value] of [
      ["aria-valuemin", min],
      ["aria-valuemax", max],
    ] as const) {
      if (Option.isSome(value)) {
        values.set(keyOf([node.id, name]), { name, node: node.id, value: value.value });
        elements.set(node.id, { node: node.id });
      }
    }

    if (Option.isSome(min) && Option.isSome(max)) {
      ranges.set(node.id, { max: max.value, min: min.value, node: node.id });
    }
  }

  return { elements, ranges, values };
};

/**
 * Build one content reference relation's rows: each read attribute of the relation's names and
 * kinds that names a variable ({@link isNcName}), in an item or a test, under its document's root
 * kind, the root of its own assembly, and its declaration row where the name is that of a
 * declaration of the document of a kind `ContentReference` allows there and no built-in of the root
 * ({@link declarationIn}), whatever its cardinality spells, with its cardinality row where it has
 * one (spec reading 159). A value that is no NCName names nothing and has neither, so its value
 * domain refuses it alone (spec reading 152).
 *
 * @param context - The document.
 * @param read - The document's read attributes.
 * @param reference - The relation's attributes and kinds.
 * @returns The rows, each keyed by (node, attribute).
 */
const referencesOf = (
  context: Context,
  read: ReturnType<typeof interactionAttributesOf>,
  reference: (typeof references)[keyof typeof references],
): ReferenceRows<
  Addition<typeof FeedbackRef>,
  ReferenceDeclarationRow,
  Addition<typeof FeedbackRefCardinality>
> => {
  const named = referringRoots.some((root) => root === context.rootKind)
    ? [...read.values()]
        .filter(
          (row) =>
            reference.attributes.some((name) => name === row.name) &&
            reference.kinds.some((kind) => kind === row.kind) &&
            isNcName(row.value),
        )
        .map((row) => ({
          key: keyOf([row.node, row.name]),
          reference: {
            assemblyKind: context.rootKind,
            attribute: row.name,
            document: context.document,
            identifier: row.value,
            kind: row.kind,
            node: row.node,
          },
        }))
    : [];
  const resolved = named.flatMap(({ key, reference: referred }) =>
    Option.toArray(declarationIn(context.named, referred)).map((variable) => ({
      key,
      referred,
      variable,
    })),
  );

  return {
    cardinalities: new Map(
      resolved.flatMap(({ key, referred, variable }) =>
        Option.toArray(variable.cardinality).map(
          (cardinality) =>
            [
              key,
              {
                attribute: referred.attribute,
                cardinality,
                declaration: variable.node,
                node: referred.node,
              },
            ] as const,
        ),
      ),
    ),
    declarations: new Map(
      resolved.map(
        ({ key, referred, variable }) =>
          [
            key,
            {
              ...referred,
              baseTypes: typedCountOf(variable.baseType),
              cardinalities: typedCountOf(variable.cardinality),
              declaration: variable.node,
              declarationKind: variable.declarationKind,
            },
          ] as const,
      ),
    ),
    references: new Map(named.map(({ key, reference: referred }) => [key, referred] as const)),
  };
};

/**
 * Build a section document's or an included fragment's references of one class: each read
 * attribute of the class's names and kinds that names a variable ({@link isNcName}), unresolved,
 * since neither declares anything; each resolves once per assembly that places the document (spec
 * readings 5 and 117).
 *
 * @param context - The document.
 * @param read - The document's read attributes.
 * @param classes - The class's attributes and kinds.
 * @returns The rows, keyed by (node, attribute), none in an item or a test
 *   ({@link referringRoots}), whose references resolve in their own declarations.
 */
const sectionNamesOf = (
  context: Context,
  read: ReturnType<typeof interactionAttributesOf>,
  classes: readonly (typeof references)[keyof typeof references][],
): ReadonlyMap<string, Addition<typeof SectionFeedbackName>> =>
  new Map(
    referringRoots.every((root) => root !== context.rootKind)
      ? [...read.values()].flatMap((row) =>
          isNcName(row.value) &&
          classes.some(
            (reference) =>
              reference.attributes.some((name) => name === row.name) &&
              reference.kinds.some((kind) => kind === row.kind),
          )
            ? [
                [
                  keyOf([row.node, row.name]),
                  {
                    attribute: row.name,
                    document: context.document,
                    identifier: row.value,
                    kind: row.kind,
                    node: row.node,
                  },
                ] as const,
              ]
            : [],
        )
      : [],
  );

/**
 * A section document's feedback references: its feedback elements' outcomes.
 */
const sectionFeedbacks = [references.feedback] as const;

/**
 * A section document's or a fragment's template variable references: its template elements' and
 * choices' `template-identifier`.
 */
const sectionTemplates = [references.template] as const;

/**
 * A section document's or a fragment's context variable references: its
 * `qti-context-variable`s' `identifier`.
 */
const sectionContexts = [references.context] as const;

/**
 * A section document's printed variable references: their names, bases and indices.
 */
const sectionPrints = [references.printed, references.variable] as const;

/**
 * Build the interaction overlays' rows of one document.
 *
 * A required attribute that is absent leaves out the row its copy proves (a choice's `identifier`,
 * a hotspot's `shape`), and AL3 refuses the element. A reference whose name no declaration of the
 * document it may name holds, and no built-in variable, has no declaration row, which its law
 * refuses; a binding to it has no declaration row, which "Binding declared" refuses (lane NIL's
 * NS2: never the nil uuid). A binding or a reference to a name a declaration with no cardinality
 * holds has its declaration row and no cardinality row, so no law over the cardinality judges it
 * and that declaration's own law refuses it alone (spec readings 158 and 159).
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: InteractionIds): InteractionRows => {
  const context = contextOf(doc, ids);
  const read = interactionAttributesOf(context);
  const { baseTyped, bindings, bound, cardinalities, declarations, names } = bindingsOf(context);
  const choices = choicesOf(context);
  const owned = choiceInteractionsOf(context, choices);
  const hottexts = hottextsOf(context);
  const aria = ariaOf(context);
  const counts = boundsOf(context, owned);
  const contexts = referencesOf(context, read, references.context);
  const feedbacks = referencesOf(context, read, references.feedback);
  const prints = [
    referencesOf(context, read, references.printed),
    referencesOf(context, read, references.variable),
  ];
  const templates = referencesOf(context, read, references.template);

  return {
    AriaElement: aria.elements,
    AriaRange: aria.ranges,
    AriaValue: aria.values,
    Binding: bindings,
    BindingBaseType: baseTyped,
    BindingCardinality: cardinalities,
    BindingDeclaration: declarations,
    BindingName: names,
    BoundVariable: bound,
    Choice: choices,
    ChoiceInteraction: owned,
    ChoiceVariableName: choiceNamesOf(context, choices, hottexts),
    ContextRef: contexts.references,
    ContextRefDeclaration: contexts.declarations,
    CountBound: counts.bounds,
    CountRange: counts.ranges,
    FeedbackRef: feedbacks.references,
    FeedbackRefCardinality: feedbacks.cardinalities,
    FeedbackRefDeclaration: feedbacks.declarations,
    Hotspot: hotspotsOf(context),
    Hottext: hottexts,
    Interaction: interactionsOf(context),
    InteractionAttribute: read,
    ItemMode: new Map(
      Option.toArray(context.itemMode).map(
        (adaptive) => [context.document, { adaptive, document: context.document }] as const,
      ),
    ),
    LeastCount: counts.leasts,
    MostCount: counts.mosts,
    PrintedVariableRef: new Map(prints.flatMap(({ references: held }) => [...held])),
    PrintedVariableRefDeclaration: new Map(prints.flatMap(({ declarations: held }) => [...held])),
    ReferringDocument: new Map(
      referringRoots.every((root) => root !== context.rootKind)
        ? [[context.document, { document: context.document }]]
        : [],
    ),
    SectionContextName: sectionNamesOf(context, read, sectionContexts),
    SectionFeedbackName: sectionNamesOf(context, read, sectionFeedbacks),
    SectionPrintedName: sectionNamesOf(context, read, sectionPrints),
    SectionTemplateName: sectionNamesOf(context, read, sectionTemplates),
    Slider: slidersOf(context),
    TemplateRef: templates.references,
    TemplateRefDeclaration: templates.declarations,
  };
};

/**
 * Count the choices each bound's node owns across a package: every document's
 * {@link ChoiceInteraction} rows, a fragment's placed in an interaction among them (spec reading
 * 117: a fragment's choices are its item's, as its merged document holds them).
 *
 * @param parts - Every document's interaction rows.
 * @returns Each bound's count, by its node, an interaction's the count `Interaction.choices`
 * draws.
 */
export const packageChoicesOf = (parts: Iterable<InteractionRows>): ReadonlyMap<NodeId, bigint> => {
  const read = [...parts];

  return choiceCountsOf(
    read.flatMap(({ CountBound: bounds }) => [...bounds.values()].map(({ node }) => node)),
    read.flatMap(({ ChoiceInteraction: owned }) => [...owned.values()]),
  );
};

/**
 * Give each bound in one document's rows its package count of choices, which `CountBound.choices`
 * copies from `Interaction.choices` for an interaction, and its `LeastCount` and `MostCount` from
 * `CountBound`.
 *
 * @param rows - A document's interaction rows.
 * @param counts - The package's counts ({@link packageChoicesOf}), whose bounds hold the
 *   document's.
 * @returns The same rows, each bound and count recounted.
 */
export const withPackageChoices = (
  rows: InteractionRows,
  counts: ReadonlyMap<NodeId, bigint>,
): InteractionRows => {
  const recounted = <Row extends Pick<Addition<typeof CountBound>, "choices" | "node">>(
    bounds: ReadonlyMap<string, Row>,
  ): ReadonlyMap<string, Row> =>
    new Map(
      [...bounds].map(([key, bound]) => [
        key,
        { ...bound, choices: heldAt(counts, bound.node, "the package's counted bounds") },
      ]),
    );

  return {
    ...rows,
    CountBound: recounted(rows.CountBound),
    LeastCount: recounted(rows.LeastCount),
    MostCount: recounted(rows.MostCount),
  };
};

/**
 * A package's section and fragment placements and their resolved references, one keyed set per
 * relation.
 */
export interface SectionRows {
  readonly SectionContextRef: ReadonlyMap<string, Addition<typeof SectionContextRef>>;
  readonly SectionContextRefDeclaration: ReadonlyMap<
    string,
    Addition<typeof SectionContextRefDeclaration>
  >;
  readonly SectionFeedbackRef: ReadonlyMap<string, Addition<typeof SectionFeedbackRef>>;
  readonly SectionFeedbackRefCardinality: ReadonlyMap<
    string,
    Addition<typeof SectionFeedbackRefCardinality>
  >;
  readonly SectionFeedbackRefDeclaration: ReadonlyMap<
    string,
    Addition<typeof SectionFeedbackRefDeclaration>
  >;
  readonly SectionPrintedRef: ReadonlyMap<string, Addition<typeof SectionPrintedRef>>;
  readonly SectionPrintedRefDeclaration: ReadonlyMap<
    string,
    Addition<typeof SectionPrintedRefDeclaration>
  >;
  readonly SectionScope: ReadonlyMap<string, Addition<typeof SectionScope>>;
  readonly SectionTemplateRef: ReadonlyMap<string, Addition<typeof SectionTemplateRef>>;
  readonly SectionTemplateRefDeclaration: ReadonlyMap<
    string,
    Addition<typeof SectionTemplateRefDeclaration>
  >;
}

/**
 * One instance of an assembly's tree, with the assembly it is placed in and that assembly's root
 * kind.
 */
interface Placement {
  readonly assembly: NodeId;
  readonly assemblyKind: InstanceRoot["assemblyKind"];
  readonly instance: InstanceMember | InstanceRoot;
}

/**
 * Collect every instance of an assembly's tree, its root's own included, with the assembly it is
 * placed in and that assembly's root kind.
 *
 * @param root - The assembly's root instance.
 * @returns Each instance and its assembly.
 */
const instancesOf = (root: InstanceRoot): readonly Placement[] => {
  const found: Placement[] = [];
  const stack: (InstanceMember | InstanceRoot)[] = [root];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    found.push({ assembly: root.assembly, assemblyKind: root.assemblyKind, instance: next });
    stack.push(...next.children);
  }

  return found;
};

/**
 * Place each reference of a section document or a fragment under one placement, and resolve it
 * among its assembly's declarations: each has its placed row, under its assembly's root kind, and
 * its declaration row where the name is that of an assembly's declaration of a kind it may name and
 * no built-in of the assembly's root ({@link declarationIn}), whatever its cardinality spells, with
 * its cardinality row where it has one (spec reading 159).
 *
 * @param names - The document's references of one class.
 * @param named - The assembly's named declarations.
 * @param placement - The placement.
 * @param placement.assembly - The assembly's root document node.
 * @param placement.assemblyKind - The assembly's root kind.
 * @param placement.instance - The placement's instance.
 * @returns The placed, declaration and cardinality rows, each keyed by (instance, node,
 * attribute).
 */
const placedOf = (
  names: readonly Addition<typeof SectionFeedbackName>[],
  named: Context["named"],
  placement: {
    readonly assembly: NodeId;
    readonly assemblyKind: Placement["assemblyKind"];
    readonly instance: NodeId;
  },
): readonly {
  readonly cardinality: Option.Option<Addition<typeof SectionFeedbackRefCardinality>>;
  readonly declaration: Option.Option<Addition<typeof SectionFeedbackRefDeclaration>>;
  readonly key: string;
  readonly placed: Addition<typeof SectionFeedbackRef>;
}[] =>
  names.map((name) => {
    const placed = {
      ...name,
      assembly: placement.assembly,
      assemblyKind: placement.assemblyKind,
      instance: placement.instance,
    };
    const variable = declarationIn(named, placed);

    return {
      cardinality: variable.pipe(
        Option.flatMap(({ cardinality, node }) =>
          cardinality.pipe(
            Option.map((held) => ({
              attribute: name.attribute,
              cardinality: held,
              declaration: node,
              instance: placement.instance,
              node: name.node,
            })),
          ),
        ),
      ),
      declaration: variable.pipe(
        Option.map((resolved) => ({
          ...placed,
          baseTypes: typedCountOf(resolved.baseType),
          cardinalities: typedCountOf(resolved.cardinality),
          declaration: resolved.node,
          declarationKind: resolved.declarationKind,
        })),
      ),
      key: keyOf([placement.instance, name.node, name.attribute]),
      placed,
    };
  });

/**
 * Read a package's named declarations, whatever their cardinality spells, as a binding or a placed
 * reference resolves its name against them (spec reading 159): each `DeclarationIdentifier` row
 * with its declaration's cardinality and base type, each none where the declaration has no
 * `DeclarationCardinality` or `DeclarationBaseType` row, in the order the rows are given.
 *
 * @param declarations - Every named declaration's `DeclarationIdentifier` row.
 * @param cardinalities - Every declaration's `DeclarationCardinality` row, where it has one.
 * @param baseTypes - Every declaration's `DeclarationBaseType` row, where it has one.
 * @returns Each named declaration, under its document.
 */
const namedVariablesOf = (
  declarations: Iterable<Addition<typeof DeclarationIdentifier>>,
  cardinalities: Iterable<Addition<typeof DeclarationCardinality>>,
  baseTypes: Iterable<Addition<typeof DeclarationBaseType>>,
): readonly (NamedVariable & { readonly document: NodeId })[] => {
  const cardinalityOf = new Map(
    [...cardinalities].map(({ cardinality, node }) => [node, cardinality] as const),
  );
  const baseTypeOf = new Map([...baseTypes].map(({ baseType, node }) => [node, baseType] as const));

  return [...declarations].map(({ declarationKind, document, identifier, node }) => ({
    baseType: Option.fromUndefinedOr(baseTypeOf.get(node)),
    cardinality: Option.fromUndefinedOr(cardinalityOf.get(node)),
    declarationKind,
    document,
    identifier,
    node,
  }));
};

/**
 * Decide whether an instance is a placement `SectionScope` holds: an instance of an item's or a
 * test's assembly whose document is neither (`referringRoots`), a section document or a fragment
 * under a test, a fragment under an item (spec reading 117).
 *
 * @param root - The assembly's root instance.
 * @param instance - The instance.
 * @returns Whether its references resolve under it.
 */
const resolvesUnder = (root: InstanceRoot, instance: InstanceMember | InstanceRoot): boolean =>
  referringRoots.some((kind) => kind === root.assemblyKind) &&
  referringRoots.every((kind) => kind !== instance.rootKind);

/**
 * Build a package's placements: one per instance of a section document or a fragment under a test
 * and of an included fragment under an item, and under it each of the document's references of each
 * class, under the assembly's root kind, with its declaration row where the name is that of an
 * assembly's declaration of a kind it may name, whatever its cardinality spells, and a feedback's
 * cardinality row where that declaration has one (spec reading 159): a built-in of the assembly's
 * root has none, and its law reads `BuiltInVariable`; a name no allowed declaration holds has none,
 * and its law refuses it (lane NIL's NS2: never the nil uuid).
 *
 * @param input - The package's rows the placements read.
 * @param input.baseTypes - Every declaration's base type, where it has one (Q5.08's
 *   `DeclarationBaseType` rows).
 * @param input.cardinalities - Every declaration's cardinality, where it has one (Q5.08's
 *   `DeclarationCardinality` rows).
 * @param input.contexts - Every section document's and fragment's context variable references
 *   ({@link rowsOf}'s `SectionContextName`).
 * @param input.declarations - Every named declaration of the package (Q5.08's
 *   `DeclarationIdentifier` rows).
 * @param input.feedbacks - Every section document's and fragment's feedback references
 *   ({@link rowsOf}'s `SectionFeedbackName`).
 * @param input.instances - Every assembly's root instance, its tree nested (Q5.13's
 *   `assembledRowsOf`).
 * @param input.prints - Every section document's and fragment's printed variable references
 *   ({@link rowsOf}'s `SectionPrintedName`).
 * @param input.templates - Every section document's and fragment's template variable references
 *   ({@link rowsOf}'s `SectionTemplateName`).
 * @returns The rows.
 */
export const sectionRowsOf = (input: {
  readonly baseTypes: Iterable<Addition<typeof DeclarationBaseType>>;
  readonly cardinalities: Iterable<Addition<typeof DeclarationCardinality>>;
  readonly contexts: Iterable<Addition<typeof SectionContextName>>;
  readonly declarations: Iterable<Addition<typeof DeclarationIdentifier>>;
  readonly feedbacks: Iterable<Addition<typeof SectionFeedbackName>>;
  readonly instances: Iterable<InstanceRoot>;
  readonly prints: Iterable<Addition<typeof SectionPrintedName>>;
  readonly templates: Iterable<Addition<typeof SectionTemplateName>>;
}): SectionRows => {
  const placements = [...input.instances].flatMap((root) =>
    instancesOf(root).filter(({ instance }) => resolvesUnder(root, instance)),
  );
  const scoped = joinOn(
    placements,
    ({ assembly }) => assembly,
    namedVariablesOf(input.declarations, input.cardinalities, input.baseTypes),
    ({ document }) => document,
  );
  const resolvedOf = (names: Iterable<Addition<typeof SectionFeedbackName>>) => {
    const placed = joinOn(
      scoped,
      ([{ instance }]) => instance.document,
      names,
      ({ document }) => document,
    ).flatMap(([[{ assembly, assemblyKind, instance }, scope], named]) =>
      placedOf(named, scope, { assembly, assemblyKind, instance: instance.id }),
    );

    return {
      cardinalities: new Map(
        placed.flatMap(({ cardinality, key }) =>
          Option.toArray(cardinality).map((row) => [key, row] as const),
        ),
      ),
      declarations: new Map(
        placed.flatMap(({ declaration, key }) =>
          Option.toArray(declaration).map((row) => [key, row] as const),
        ),
      ),
      references: new Map(placed.map(({ key, placed: row }) => [key, row] as const)),
    };
  };
  const contexts = resolvedOf(input.contexts);
  const feedbacks = resolvedOf(input.feedbacks);
  const prints = resolvedOf(input.prints);
  const templates = resolvedOf(input.templates);

  return {
    SectionContextRef: contexts.references,
    SectionContextRefDeclaration: contexts.declarations,
    SectionFeedbackRef: feedbacks.references,
    SectionFeedbackRefCardinality: feedbacks.cardinalities,
    SectionFeedbackRefDeclaration: feedbacks.declarations,
    SectionPrintedRef: prints.references,
    SectionPrintedRefDeclaration: prints.declarations,
    SectionScope: new Map(
      placements.map(
        ({ assembly, assemblyKind, instance }) =>
          [
            instance.id,
            { assembly, assemblyKind, document: instance.document, instance: instance.id },
          ] as const,
      ),
    ),
    SectionTemplateRef: templates.references,
    SectionTemplateRefDeclaration: templates.declarations,
  };
};

/**
 * A package's bindings placed under each instance of an item's assembly, keyed by (instance, node,
 * attribute).
 */
export interface PlacedBindingRows {
  readonly ChoiceVariableName: ReadonlyMap<string, Addition<typeof ChoiceVariableName>>;
  readonly PlacedBinding: ReadonlyMap<string, Addition<typeof PlacedBinding>>;
  readonly PlacedBindingBaseType: ReadonlyMap<string, Addition<typeof PlacedBindingBaseType>>;
  readonly PlacedBindingCardinality: ReadonlyMap<string, Addition<typeof PlacedBindingCardinality>>;
  readonly PlacedBindingDeclaration: ReadonlyMap<string, Addition<typeof PlacedBindingDeclaration>>;
  readonly PlacedChoice: ReadonlyMap<string, Addition<typeof PlacedChoice>>;
  readonly PlacedHottext: ReadonlyMap<string, Addition<typeof PlacedHottext>>;
}

/**
 * Build each instance of an item's assembly's bindings (spec reading 117): under the item's own
 * instance and each fragment it places, every binding attribute of the instance's document,
 * resolved among the item's declarations as `BoundVariable` resolves an item's own, and carrying
 * the item's `adaptive`, and its {@link PlacedBindingDeclaration} where a response declaration of
 * the item holds the name, whatever its cardinality spells, with its
 * {@link PlacedBindingCardinality} and its `PlacedBindingBaseType` where the declaration has each
 * (spec reading 159): a name none holds has none, which "Binding declared" refuses. Under each
 * instance of every assembly, its document's choices and hottexts, which count among the
 * assembly's, and each identifier they bear as a {@link ChoiceVariableName} of the assembly's root
 * document, which "Choice not variable" holds to the root's declarations.
 *
 * @param input - The package's rows the bindings read.
 * @param input.adaptive - Every item's mode ({@link rowsOf}'s `ItemMode`).
 * @param input.baseTypes - Every declaration's base type, where it has one (Q5.08's
 *   `DeclarationBaseType` rows).
 * @param input.cardinalities - Every declaration's cardinality, where it has one (Q5.08's
 *   `DeclarationCardinality` rows).
 * @param input.choices - Every document's choices ({@link rowsOf}'s `Choice`).
 * @param input.declarations - Every named declaration of the package, whatever its cardinality
 *   (Q5.08's `DeclarationIdentifier` rows).
 * @param input.hottexts - Every document's hottexts ({@link rowsOf}'s `Hottext`).
 * @param input.instances - Every assembly's root instance, its tree nested (Q5.13's
 *   `assembledRowsOf`).
 * @param input.mosts - Every document's most counts that have a value ({@link rowsOf}'s
 *   `MostCount`), whose nodes a placed binding's `mosts` counts.
 * @param input.names - Every document's binding attributes ({@link rowsOf}'s `BindingName`).
 * @returns The rows.
 */
export const placedBindingRowsOf = (input: {
  readonly adaptive: Iterable<Addition<typeof ItemMode>>;
  readonly baseTypes: Iterable<Addition<typeof DeclarationBaseType>>;
  readonly cardinalities: Iterable<Addition<typeof DeclarationCardinality>>;
  readonly choices: Iterable<Addition<typeof Choice>>;
  readonly declarations: Iterable<Addition<typeof DeclarationIdentifier>>;
  readonly hottexts: Iterable<Addition<typeof Hottext>>;
  readonly instances: Iterable<InstanceRoot>;
  readonly mosts: Iterable<Addition<typeof MostCount>>;
  readonly names: Iterable<Addition<typeof BindingName>>;
}): PlacedBindingRows => {
  const counted = new Set([...input.mosts].map(({ node }) => node));
  const declarations = namedVariablesOf(input.declarations, input.cardinalities, input.baseTypes);
  const modes = new Map([...input.adaptive].map((row) => [row.document, row.adaptive] as const));
  const placements = [...input.instances].flatMap((root) => instancesOf(root));
  const placedOfDocument = <Row extends { readonly document: NodeId }>(rows: Iterable<Row>) =>
    joinOn(
      placements,
      ({ instance }) => instance.document,
      rows,
      ({ document }) => document,
    ).flatMap(([placement, held]) => held.map((row) => ({ placement, row })));
  const choices = placedOfDocument(input.choices);
  const hottexts = placedOfDocument(input.hottexts);
  const bound = joinOn(
    joinOn(
      placements.filter(({ assemblyKind }) => assemblyKind === itemKind),
      ({ assembly }) => assembly,
      declarations,
      ({ document }) => document,
    ),
    ([{ instance }]) => instance.document,
    input.names,
    ({ document }) => document,
  ).flatMap(([[placement, declared], names]) =>
    names.map((name) => ({
      binding: {
        ...name,
        assembly: placement.assembly,
        document: placement.instance.document,
        instance: placement.instance.id,
      },
      declared,
      key: keyOf([placement.instance.id, name.node, name.attribute]),
    })),
  );
  const resolved = bound.flatMap(({ binding, declared, key }) =>
    Option.toArray(responseIn(declared, binding.identifier)).map((variable) => ({
      binding,
      key,
      variable,
    })),
  );
  const typed = resolved.flatMap((held) =>
    Option.toArray(held.variable.cardinality).map((cardinality) => ({ ...held, cardinality })),
  );

  return {
    ChoiceVariableName: new Map(
      [...choices, ...hottexts].map(
        ({ placement: { assembly, assemblyKind }, row: { identifier } }) =>
          [
            keyOf([assembly, identifier]),
            { document: assembly, identifier, rootKind: assemblyKind },
          ] as const,
      ),
    ),
    PlacedBinding: new Map(
      bound.map(
        ({ binding, key }) =>
          [
            key,
            {
              ...binding,
              adaptive: heldAt(modes, binding.assembly, "the package's item modes"),
            },
          ] as const,
      ),
    ),
    PlacedBindingBaseType: new Map(
      typed.flatMap(({ binding, cardinality, key, variable }) =>
        Option.toArray(variable.baseType).map(
          (baseType) =>
            [
              key,
              {
                attribute: binding.attribute,
                baseType,
                cardinality,
                declaration: variable.node,
                instance: binding.instance,
                kind: binding.kind,
                node: binding.node,
              },
            ] as const,
        ),
      ),
    ),
    PlacedBindingCardinality: new Map(
      typed.map(
        ({ binding, cardinality, key, variable }) =>
          [
            key,
            {
              attribute: binding.attribute,
              baseTypes: typedCountOf(variable.baseType),
              cardinality,
              declaration: variable.node,
              instance: binding.instance,
              kind: binding.kind,
              mosts: counted.has(binding.node) ? 1n : 0n,
              node: binding.node,
            },
          ] as const,
      ),
    ),
    PlacedBindingDeclaration: new Map(
      resolved.map(
        ({ binding, key, variable }) =>
          [
            key,
            {
              ...binding,
              baseTypes: typedCountOf(variable.baseType),
              cardinalities: typedCountOf(variable.cardinality),
              declaration: variable.node,
              declarationKind: variable.declarationKind,
            },
          ] as const,
      ),
    ),
    PlacedChoice: new Map(
      choices.map(
        ({ placement: { assembly, instance }, row: { document, identifier, kind, node } }) =>
          [
            keyOf([instance.id, node]),
            { assembly, document, identifier, instance: instance.id, kind, node },
          ] as const,
      ),
    ),
    PlacedHottext: new Map(
      hottexts.map(
        ({ placement: { assembly, instance }, row: { document, identifier, node } }) =>
          [
            keyOf([instance.id, node]),
            { assembly, document, identifier, instance: instance.id, node },
          ] as const,
      ),
    ),
  };
};
