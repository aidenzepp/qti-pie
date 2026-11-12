/**
 * The interaction overlays' rows (plan §1.7 O3, §C's `rowsOf`): from a document's view
 * (`DocumentView` of `#pantry/import/fold.ts`), the rows of every overlay
 * `#pantry/qti/interactions.ts` declares, each relation's rows a keyed set.
 *
 * The rows restate what the tree says and nothing else: each overlay copies its node's tuple as the
 * tree's own rows give it (`flatten` of `#pantry/model/xdm.ts`), each attribute's lexical form as
 * written and its collapsed value, each count as written or its XSD default, and each name a
 * binding or a reference makes resolved among the document's declarations. Every row holds its
 * document's place, `package` and `path`, beside its element's `start`, and every link is a
 * position: an element's in the same document, or an instance's in its assembly's tree. The
 * database proves every one of them (`interactionLaws`), so a row this builder gets wrong is
 * refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Array as Arr, Option } from "effect";
import {
  BuiltInVariable,
  ChoiceBound,
  ContentReference,
  interactionKinds,
} from "#pantry/grammar/install.ts";
import { booleanOf, collapse } from "#pantry/grammar/domains.ts";
import { foldAt } from "#pantry/import/fold.ts";
import type { DocumentView, Folds } from "#pantry/import/fold.ts";
import { namedBy } from "#pantry/import/names.ts";
import { declarationOf, typedCountOf } from "#pantry/import/overlays/declarations.ts";
import type { Place } from "#pantry/import/overlays/declarations.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeRow } from "#pantry/model/xdm.ts";
import type {
  DeclarationBaseType,
  DeclarationCardinality,
  DeclarationIdentifier,
} from "#pantry/qti/declarations.ts";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";
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
  ContextRef,
  ContextRefDeclaration,
  CountBound,
  CountRange,
  FeedbackRef,
  FeedbackRefCardinality,
  FeedbackRefDeclaration,
  GapInteraction,
  Hotspot,
  Hottext,
  Interaction,
  InteractionAttribute,
  ItemMode,
  LeastCount,
  MostCount,
  PciModuleForm,
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
  SectionTemplateRefCardinality,
  SectionTemplateRefDeclaration,
  Slider,
  TemplateRef,
  TemplateRefCardinality,
  TemplateRefDeclaration,
} from "#pantry/qti/interactions.ts";
import { itemKind } from "#pantry/vocab/terms/tests.ts";
import {
  adaptiveName,
  ariaNames,
  bindingAttributes,
  choiceKinds,
  countDefault,
  gapKind,
  hotspotKinds,
  hottextKind,
  modulesKind,
  pciKind,
  readAttributes,
  references,
  referringRoots,
  sliderKind,
} from "#pantry/vocab/terms/interactions.ts";

/**
 * The interaction overlays' rows, one keyed set per relation: each map from the text of a row's key
 * to the row as its writer writes it, its key's values in key order as a JSON array ({@link
 * keyOf}), so the rows of two documents never meet at one key.
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
  readonly ContextRef: ReadonlyMap<string, Addition<typeof ContextRef>>;
  readonly ContextRefDeclaration: ReadonlyMap<string, Addition<typeof ContextRefDeclaration>>;
  readonly CountBound: ReadonlyMap<string, Addition<typeof CountBound>>;
  readonly CountRange: ReadonlyMap<string, Addition<typeof CountRange>>;
  readonly FeedbackRef: ReadonlyMap<string, Addition<typeof FeedbackRef>>;
  readonly FeedbackRefCardinality: ReadonlyMap<string, Addition<typeof FeedbackRefCardinality>>;
  readonly FeedbackRefDeclaration: ReadonlyMap<string, Addition<typeof FeedbackRefDeclaration>>;
  readonly GapInteraction: ReadonlyMap<string, Addition<typeof GapInteraction>>;
  readonly Hotspot: ReadonlyMap<string, Addition<typeof Hotspot>>;
  readonly Hottext: ReadonlyMap<string, Addition<typeof Hottext>>;
  readonly Interaction: ReadonlyMap<string, Addition<typeof Interaction>>;
  readonly InteractionAttribute: ReadonlyMap<string, Addition<typeof InteractionAttribute>>;
  readonly ItemMode: ReadonlyMap<string, Addition<typeof ItemMode>>;
  readonly LeastCount: ReadonlyMap<string, Addition<typeof LeastCount>>;
  readonly MostCount: ReadonlyMap<string, Addition<typeof MostCount>>;
  readonly PciModuleForm: ReadonlyMap<string, Addition<typeof PciModuleForm>>;
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
  readonly TemplateRefCardinality: ReadonlyMap<string, Addition<typeof TemplateRefCardinality>>;
  readonly TemplateRefDeclaration: ReadonlyMap<string, Addition<typeof TemplateRefDeclaration>>;
}

/**
 * A content reference's declaration row as each reference relation's writes it: the four relations
 * share one heading.
 */
type ReferenceDeclarationRow = Addition<typeof FeedbackRefDeclaration>;

/**
 * A declaration as a binding or a reference resolves its name against it, whatever its cardinality
 * spells (spec reading 159): its `start`, kind as a `DeclarationKind`, name, the identifier
 * collapsed, and the codes its `cardinality` and `base-type` spell, each none where it spells none,
 * which the binding's or the reference's declaration row copies only as its count ({@link
 * typedCountOf}) and its cardinality and base type rows hold where they are.
 */
interface NamedVariable {
  readonly baseType: Option.Option<Addition<typeof BindingBaseType>["baseType"]>;
  readonly cardinality: Option.Option<Addition<typeof BindingCardinality>["cardinality"]>;
  readonly declarationKind: Addition<typeof BindingDeclaration>["declarationKind"];
  readonly identifier: string;
  readonly start: bigint;
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
 * Write the key text of a row: its key's values in key order, each as its text, as a JSON array.
 *
 * @param values - The key's values, in key order.
 * @returns Their JSON array.
 */
const keyOf = (values: readonly (bigint | boolean | string)[]): string =>
  JSON.stringify(values.map(String));

/**
 * Write the key text of an element's place, `(package, path, start)`, the key every row over one
 * element starts with and the group a family over an interaction's rows names it by.
 *
 * @param row - The row: its document's place and its element's start.
 * @param row.package - The package's manifest identifier.
 * @param row.path - The document's path.
 * @param row.start - The element's position in the document.
 * @returns The key text.
 */
const placeKeyOf = (row: {
  readonly package: string;
  readonly path: string;
  readonly start: bigint;
}): string => keyOf([row.package, row.path, row.start]);

/**
 * A node's kind as the tree's rows hold it.
 */
type KindOfNode = NodeRow<Composed>["kind"];

/**
 * Read a map at a key it holds by construction: a document's node kinds at a node of the document
 * (every attribute's element and every element's parent is a node `flatten` writes), the counted
 * bounds at a bound of the rows counted ({@link choiceCountsOf}), the package's item modes at an
 * item's assembly, whose head is an item document with its `ItemMode`.
 *
 * @param map - The map.
 * @param key - A key it holds.
 * @param holds - What the map holds, for the defect.
 * @returns The value at the key.
 * @throws {Error} When the map holds no value at the key: a defect of the caller, which read a key
 *   of other rows than the map was built from.
 */
const heldAt = <K extends bigint | string, V>(map: ReadonlyMap<K, V>, key: K, holds: string): V => {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(
      `${String(key)} is none of ${holds}, which hold every key the builder reads in them. Read each key in the rows the map was built from.`,
    );
  }

  return value;
};

/**
 * One document as the builders read it: its flat rows, its place in its package and its root kind,
 * each node's fold (`#pantry/import/fold.ts`), which holds its nearest interaction (N8), the
 * document that interaction is in, its kind and its element counts, each node's kind by its start,
 * each element's attributes, its
 * named declarations whatever their cardinality, which a binding, a reference and a choice's name
 * resolve against (spec reading 159), and, for an item, its mode: whether it is adaptive.
 */
interface Context {
  readonly attributes: ReadonlyMap<bigint, ReadonlyMap<string, string>>;
  readonly folds: Folds;
  readonly itemMode: Option.Option<boolean>;
  readonly kinds: ReadonlyMap<bigint, KindOfNode>;
  readonly named: readonly NamedVariable[];
  readonly place: Place;
  readonly rootKind: KindOfNode;
  readonly rows: FlatRows<Composed>;
}

/**
 * Read an element's attribute as written.
 *
 * @param context - The document.
 * @param start - The element's start.
 * @param name - The attribute's name.
 * @returns Its lexical form, or none where the element does not carry it.
 */
const lexicalOf = (
  context: Pick<Context, "attributes">,
  start: bigint,
  name: string,
): Option.Option<string> => Option.fromNullishOr(context.attributes.get(start)?.get(name));

/**
 * Read an element's attribute collapsed (XML Schema Part 2, §4.3.6), as
 * `InteractionAttribute.value` holds it: whitespace inside a value is kept, one space a run, so a
 * value with some is no value of the attribute's atomic type, and its value domain refuses it
 * alone.
 *
 * @param context - The document.
 * @param start - The element's start.
 * @param name - The attribute's name.
 * @returns Its value, or none where the element does not carry it.
 */
const valueOf = (
  context: Pick<Context, "attributes">,
  start: bigint,
  name: string,
): Option.Option<string> => Option.map(lexicalOf(context, start, name), collapse);

/**
 * Read the name an element's attribute gives ({@link namedBy}), the test `namedBinding` of
 * `#pantry/qti/interactions.ts` states: a value that names nothing has no `BindingName` and no
 * `BoundVariable`, so "Binding declared" never judges it beside its value domain (spec reading
 * 152).
 *
 * @param context - The document.
 * @param start - The element's start.
 * @param name - The attribute's name.
 * @returns The name, or none where the element does not carry the attribute or it names nothing.
 */
const nameOf = (
  context: Pick<Context, "attributes">,
  start: bigint,
  name: string,
): Option.Option<string> => Option.flatMap(lexicalOf(context, start, name), namedBy);

/**
 * Read a node's `nodeRef` tuple, with its nearest interaction's position.
 *
 * @param context - The document.
 * @param node - The node.
 * @returns The tuple.
 */
const tupleOf = (context: Context, node: NodeRow<Composed>) => ({
  kind: node.kind,
  nearest: foldAt(context.folds, node.start).nearest,
  package: context.place.package,
  parent: node.parent,
  path: context.place.path,
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
    Option.toArray(
      declarationOf(node.kind, (name) => lexicalOf(context, node.start, name)),
    ).flatMap((declaration) =>
      Option.toArray(declaration.name).map(({ pieces }) => ({
        baseType: declaration.baseType,
        cardinality: declaration.cardinality,
        declarationKind: declaration.declarationKind,
        identifier: pieces.value,
        start: node.start,
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
 * @param item - The item's element's start.
 * @returns Whether the item is adaptive.
 */
const adaptiveOf = (context: Pick<Context, "attributes">, item: bigint): boolean =>
  Option.match(valueOf(context, item, adaptiveName), {
    onNone: () => adaptiveDefault,
    onSome: (form) => Option.contains(booleanOf(form), true),
  });

/**
 * Read a document for the builders.
 *
 * @param view - The document's view.
 * @param place - Where it stands in its package.
 * @returns The document as the builders read it.
 */
const contextOf = (view: DocumentView, place: Place): Context => {
  const { rows } = view;
  const base = {
    attributes: new Map(
      [...Map.groupBy(rows.attributes, ({ start }) => start)].map(
        ([start, held]) =>
          [start, new Map(held.map(({ lexical, name }) => [name, lexical]))] as const,
      ),
    ),
    folds: view.folds,
    kinds: new Map(rows.nodes.map((node) => [node.start, node.kind] as const)),
    place,
    rootKind: view.tree.root.kind,
    rows,
  };

  return {
    ...base,
    itemMode: Option.map(
      Option.filter(
        Arr.findFirst(rows.nodes, ({ kind }) => kind === itemKind),
        () => view.tree.root.kind === itemKind,
      ),
      (item) => adaptiveOf(base, item.start),
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
 * value is a row of its own relation, never a sentinel). A name only another root holds as a
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
 * cardinalities where each has one (spec reading 159), each keyed alike. Only a feedback's and a
 * template's cardinality rows are a relation's ({@link FeedbackRefCardinality},
 * {@link TemplateRefCardinality}, the latter with its reference's kind, {@link kindedOf}):
 * "Feedback outcome type" and "Template variable type" are the laws over a content reference that
 * read its variable's cardinality (decision 432).
 */
interface ReferenceRows<Reference, Declared, Cardinal> {
  readonly cardinalities: ReadonlyMap<string, Cardinal>;
  readonly declarations: ReadonlyMap<string, Declared>;
  readonly references: ReadonlyMap<string, Reference>;
}

/**
 * Give each of a template reference relation's cardinality rows its reference's kind, which
 * "Template variable type" reads (a portable custom interaction's `qti-template-variable` is free;
 * decision 432): each cardinality row's key is its reference's.
 *
 * @param rows - The relation's references and cardinality rows, keyed alike.
 * @param rows.cardinalities - The cardinality rows.
 * @param rows.references - The references.
 * @returns Each cardinality row with its reference's kind, under its key.
 */
const kindedOf = <Row extends object, Reference extends { readonly kind: unknown }>(rows: {
  readonly cardinalities: ReadonlyMap<string, Row>;
  readonly references: ReadonlyMap<string, Reference>;
}): ReadonlyMap<string, Row & { readonly kind: Reference["kind"] }> =>
  new Map(
    [...rows.cardinalities].flatMap(([key, row]) =>
      Option.toArray(Option.fromUndefinedOr(rows.references.get(key))).map(
        ({ kind }) => [key, { ...row, kind }] as const,
      ),
    ),
  );

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
 * @returns The rows, keyed by (package, path, start, name).
 */
const interactionAttributesOf = (context: Context) =>
  new Map(
    context.rows.attributes.flatMap(({ lexical, name, start }) => {
      const kind = heldAt(context.kinds, start, "the document's nodes");
      const read = ariaNames.some((aria) => aria === name) || readOnKinds.has(`${name} ${kind}`);

      return read
        ? [
            [
              keyOf([context.place.package, context.place.path, start, name]),
              {
                kind,
                lexical,
                name,
                package: context.place.package,
                path: context.place.path,
                rootKind: context.rootKind,
                start,
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
 * @returns The rows, keyed by place.
 */
const interactionsOf = (context: Context) =>
  new Map(
    context.rows.nodes
      .filter(({ kind }) => interactions.has(kind))
      .map((node) => {
        const row = tupleOf(context, node) satisfies Addition<typeof Interaction>;

        return [placeKeyOf(row), row] as const;
      }),
  );

/**
 * Build each portable custom interaction's module forms: an attribute form for its `module`
 * attribute and an element form for its `qti-interaction-modules` child (R10-a).
 *
 * @param context - The document.
 * @returns The rows, keyed by place and form.
 */
const pciModuleFormsOf = (context: Context) => {
  const forms = new Map<string, Addition<typeof PciModuleForm>>();
  const { package: pkg, path } = context.place;
  for (const node of context.rows.nodes) {
    if (node.kind === pciKind && context.attributes.get(node.start)?.has("module") === true) {
      forms.set(keyOf([pkg, path, node.start, false]), {
        element: false,
        package: pkg,
        path,
        start: node.start,
      });
    }

    if (
      node.kind === modulesKind &&
      heldAt(context.kinds, node.parent, "the document's nodes") === pciKind
    ) {
      forms.set(keyOf([pkg, path, node.parent, true]), {
        element: true,
        package: pkg,
        path,
        start: node.parent,
      });
    }
  }

  return forms;
};

/**
 * Build each choice's row.
 *
 * @param context - The document.
 * @returns The rows, keyed by place.
 */
const choicesOf = (context: Context) =>
  new Map(
    context.rows.nodes
      .filter(({ kind }) => choiceKinds.some((choice) => choice === kind))
      .flatMap((node) =>
        Option.toArray(valueOf(context, node.start, "identifier")).map((identifier) => {
          const row = { ...tupleOf(context, node), identifier } satisfies Addition<typeof Choice>;

          return [placeKeyOf(row), row] as const;
        }),
      ),
  );

/**
 * Build each choice's interaction: its nearest, where that is an interaction, in its own document
 * or, where the fold gives a `nearestPath`, the one its fragment is placed in. A choice no
 * interaction encloses has none, and "N8 nearest" refuses it; a gap among those breaks N6 first.
 *
 * @param context - The document.
 * @param choices - Its choices' rows.
 * @returns The rows, keyed by the choice's place.
 */
const choiceInteractionsOf = (
  context: Context,
  choices: ReadonlyMap<string, Addition<typeof Choice>>,
) =>
  new Map(
    [...choices].flatMap(([key, { nearest, package: pkg, path, start }]) => {
      const fold = foldAt(context.folds, start);

      return interactions.has(fold.nearestKind)
        ? [
            [
              key,
              {
                interaction: nearest,
                interactionPath: Option.getOrElse(fold.nearestPath, () => path),
                package: pkg,
                path,
                start,
              } satisfies Addition<typeof ChoiceInteraction>,
            ] as const,
          ]
        : [];
    }),
  );

/**
 * Build each gap's interaction: a copy of its {@link ChoiceInteraction} row, which only a gap among
 * the choices has (spec reading 169).
 *
 * @param choices - The document's choices' rows.
 * @param owned - Their interactions, keyed alike.
 * @returns The rows, keyed by the gap's place.
 */
const gapInteractionsOf = (
  choices: ReadonlyMap<string, Addition<typeof Choice>>,
  owned: ReadonlyMap<string, Addition<typeof ChoiceInteraction>>,
): ReadonlyMap<string, Addition<typeof GapInteraction>> =>
  new Map([...owned].filter(([key]) => choices.get(key)?.kind === gapKind));

/**
 * Build each hottext's row, with its nearest interaction's kind and the document it is in.
 *
 * @param context - The document.
 * @returns The rows, keyed by place.
 */
const hottextsOf = (context: Context) =>
  new Map(
    context.rows.nodes
      .filter(({ kind }) => kind === hottextKind)
      .flatMap((node) =>
        Option.toArray(valueOf(context, node.start, "identifier")).map((identifier) => {
          const { nearestKind, nearestPath } = foldAt(context.folds, node.start);
          const row = {
            ...tupleOf(context, node),
            identifier,
            nearestKind,
            nearestPath: Option.getOrElse(nearestPath, () => context.place.path),
          } satisfies Addition<typeof Hottext>;

          return [placeKeyOf(row), row] as const;
        }),
      ),
  );

/**
 * Build each hotspot's row: its shape, its parent's kind, and its and its parent's element counts.
 *
 * @param context - The document.
 * @returns The rows, keyed by place.
 */
const hotspotsOf = (context: Context) =>
  new Map(
    context.rows.nodes
      .filter(({ kind }) => hotspotKinds.some((hotspot) => hotspot === kind))
      .flatMap((node) =>
        Option.toArray(valueOf(context, node.start, "shape")).map((area) => {
          const own = foldAt(context.folds, node.start);
          const parent = foldAt(context.folds, node.parent);
          const row = {
            ...tupleOf(context, node),
            area,
            elementChildren: own.elementChildren,
            elements: own.elements,
            parentElementChildren: parent.elementChildren,
            parentElements: parent.elements,
            parentKind: heldAt(context.kinds, node.parent, "the document's nodes"),
          } satisfies Addition<typeof Hotspot>;

          return [placeKeyOf(row), row] as const;
        }),
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
  const written = valueOf(context, node.start, name);
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
 * declaration's cardinality and base type, each where it has one (spec reading 159). A cardinality
 * row's `gaps` is its interaction's count of the gaps it owns in its own document:
 * {@link withPackageChoices} adds those a fragment placed in it holds.
 *
 * @param context - The document.
 * @param gaps - Each of the document's interactions' count of gaps in the document, by its place's
 *   key text ({@link placeKeyOf}).
 * @returns The `Binding` rows, keyed by place, and the `BindingName` rows of every document and
 *   the `BoundVariable`, `BindingDeclaration`, `BindingCardinality` and `BindingBaseType` rows of
 *   an item, each keyed by (package, path, start, attribute).
 */
const bindingsOf = (context: Context, gaps: ReadonlyMap<string, bigint>) => {
  const bindings = new Map<string, Addition<typeof Binding>>();
  const names = new Map<string, Addition<typeof BindingName>>();
  const bound = new Map<string, Addition<typeof BoundVariable>>();
  const declarations = new Map<string, Addition<typeof BindingDeclaration>>();
  const cardinalities = new Map<string, Addition<typeof BindingCardinality>>();
  const baseTyped = new Map<string, Addition<typeof BindingBaseType>>();
  const { package: pkg, path } = context.place;
  for (const node of context.rows.nodes.filter(({ kind }) => interactions.has(kind))) {
    const { start } = node;
    const place = { package: pkg, path, start };
    if (Option.isSome(valueOf(context, start, "response-identifier"))) {
      bindings.set(placeKeyOf(place), tupleOf(context, node));
    }

    for (const attribute of bindingAttributes) {
      for (const identifier of Option.toArray(nameOf(context, start, attribute))) {
        names.set(keyOf([pkg, path, start, attribute]), {
          ...place,
          attribute,
          identifier,
          kind: node.kind,
        });
      }
    }

    for (const adaptive of Option.toArray(context.itemMode)) {
      for (const attribute of bindingAttributes) {
        for (const identifier of Option.toArray(nameOf(context, start, attribute))) {
          const key = keyOf([pkg, path, start, attribute]);
          const binding = { ...place, attribute, identifier, kind: node.kind };
          bound.set(key, { ...binding, adaptive });
          for (const variable of Option.toArray(responseIn(context.named, identifier))) {
            const baseTypes = typedCountOf(variable.baseType);
            declarations.set(key, {
              ...binding,
              baseTypes,
              cardinalities: typedCountOf(variable.cardinality),
              declaration: variable.start,
              declarationKind: variable.declarationKind,
            });
            for (const cardinality of Option.toArray(variable.cardinality)) {
              cardinalities.set(key, {
                ...place,
                attribute,
                baseTypes,
                cardinality,
                declaration: variable.start,
                gaps: heldAt(gaps, placeKeyOf(place), "the document's interactions"),
                kind: node.kind,
                mosts: mostsOf(context, node),
              });
              for (const baseType of Option.toArray(variable.baseType)) {
                baseTyped.set(key, {
                  ...place,
                  attribute,
                  baseType,
                  cardinality,
                  declaration: variable.start,
                  kind: node.kind,
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
 * Count the choices each of some bounds owns: its {@link ChoiceInteraction} rows among `owned`,
 * which `CountBound.choices` holds, an interaction's `Interaction.choices`, each row naming its
 * interaction by `(package, interactionPath, interaction)`. A bound no row names owns none: an
 * interaction with no choice, and every choice, which encloses no choice as its interaction
 * (`CountBound`'s `E1_derived`). A row whose interaction is none of the bounds, a fragment's choice
 * in the interaction of the item that includes it, counts toward none of them.
 *
 * @param bounds - The bounds' places' key texts ({@link placeKeyOf}), of one document or of the
 *   whole package.
 * @param owned - Choices' interactions, of the same.
 * @returns Each bound's count, by its place's key text.
 */
const choiceCountsOf = (
  bounds: Iterable<string>,
  owned: Iterable<Addition<typeof ChoiceInteraction>>,
): ReadonlyMap<string, bigint> =>
  new Map(
    joinOn(
      bounds,
      (bound) => bound,
      owned,
      ({ interaction, interactionPath, package: pkg }) =>
        placeKeyOf({ package: pkg, path: interactionPath, start: interaction }),
    ).map(([bound, choices]) => [bound, BigInt(choices.length)] as const),
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
 * @returns The rows, each relation's keyed by place.
 */
const boundsOf = (
  context: Context,
  owned: ReadonlyMap<string, Addition<typeof ChoiceInteraction>>,
) => {
  const { package: pkg, path } = context.place;
  const bounded = context.rows.nodes.flatMap((node) =>
    ChoiceBound.rows
      .filter(({ kind }) => kind === node.kind)
      .map(({ max, min }) => ({
        key: placeKeyOf({ package: pkg, path, start: node.start }),
        max,
        min,
        node,
      })),
  );
  const counts = choiceCountsOf(
    bounded.map(({ key }) => key),
    owned.values(),
  );
  const bounds = new Map<string, Addition<typeof CountBound>>();
  const leasts = new Map<string, Addition<typeof LeastCount>>();
  const mosts = new Map<string, Addition<typeof MostCount>>();
  const ranges = new Map<string, Addition<typeof CountRange>>();
  for (const { key, max, min, node } of bounded) {
    const least = countOf(context, node, min);
    const most = countOf(context, node, max);
    const choices = heldAt(counts, key, "the counted bounds");
    const place = { package: pkg, path, start: node.start };
    const copied = { ...place, choices, kind: node.kind, version: node.version };
    bounds.set(key, {
      ...tupleOf(context, node),
      choices,
      maxName: max,
      maxWritten: most.written,
      minName: min,
      minWritten: least.written,
    });
    for (const { form, integer } of Option.toArray(least.value)) {
      leasts.set(key, {
        ...copied,
        least: form,
        leastValue: integer,
        minName: min,
        minWritten: least.written,
      });
    }

    for (const { form, integer } of Option.toArray(most.value)) {
      mosts.set(key, {
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
      ranges.set(key, {
        ...place,
        kind: node.kind,
        leastValue,
        minWritten: least.written,
        mostValue,
      });
    }
  }

  return { bounds, leasts, mosts, ranges };
};

/**
 * Build each slider's bounds, where it writes both.
 *
 * @param context - The document.
 * @returns The rows, keyed by place.
 */
const slidersOf = (context: Context) =>
  new Map(
    context.rows.nodes
      .filter(({ kind }) => kind === sliderKind)
      .flatMap((node) =>
        Option.toArray(
          Option.all([
            valueOf(context, node.start, "lower-bound"),
            valueOf(context, node.start, "upper-bound"),
          ]),
        ).map(([lower, upper]) => {
          const row = {
            ...context.place,
            lower,
            start: node.start,
            upper,
          } satisfies Addition<typeof Slider>;

          return [placeKeyOf(row), row] as const;
        }),
      ),
  );

/**
 * Build the ARIA range rows: each range attribute's value, each element that carries one, and each
 * that carries both.
 *
 * @param context - The document.
 * @returns The `AriaValue` rows, keyed by (package, path, start, name), and the `AriaElement` and
 *   `AriaRange` rows, keyed by place.
 */
const ariaOf = (context: Context) => {
  const values = new Map<string, Addition<typeof AriaValue>>();
  const elements = new Map<string, Addition<typeof AriaElement>>();
  const ranges = new Map<string, Addition<typeof AriaRange>>();
  for (const node of context.rows.nodes) {
    const place = { ...context.place, start: node.start };
    const key = placeKeyOf(place);
    const [min, max] = [
      valueOf(context, node.start, "aria-valuemin"),
      valueOf(context, node.start, "aria-valuemax"),
    ];
    for (const [name, value] of [
      ["aria-valuemin", min],
      ["aria-valuemax", max],
    ] as const) {
      if (Option.isSome(value)) {
        values.set(keyOf([place.package, place.path, place.start, name]), {
          ...place,
          name,
          value: value.value,
        });
        elements.set(key, place);
      }
    }

    if (Option.isSome(min) && Option.isSome(max)) {
      ranges.set(key, { ...place, max: max.value, min: min.value });
    }
  }

  return { elements, ranges, values };
};

/**
 * Build one content reference relation's rows: each read attribute of the relation's names and
 * kinds that names a variable ({@link namedBy}), in an item or a test, under its document's root
 * kind, the root of its own assembly, and its declaration row where the name is that of a
 * declaration of the document of a kind `ContentReference` allows there and no built-in of the root
 * ({@link declarationIn}), whatever its cardinality spells, with its cardinality row where it has
 * one (spec reading 159). A value that is no NCName names nothing and has neither, so its value
 * domain refuses it alone (spec reading 152).
 *
 * The NCName test decides which value is a reference, as each relation's source does
 * (`referenceSources` of `#pantry/qti/interactions.ts`), and the schema holds the source forward
 * only, so no law refuses a row beyond it. No law refuses what the test leaves out, either: a
 * printed variable's `base` and `index` hold an `xs:integer` literal or a variable's name, so
 * `base="10"` is lawful and names nothing, and a row for it would break "Printed variable
 * reference" on a package the database must accept. So the test stays here for as long as each
 * relation is written rows, not a query over its source.
 *
 * @param context - The document.
 * @param read - The document's read attributes.
 * @param reference - The relation's attributes and kinds.
 * @returns The rows, each keyed by (package, path, start, attribute).
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
            reference.kinds.some((kind) => kind === row.kind),
        )
        .flatMap((row) =>
          Option.toArray(namedBy(row.lexical)).map((identifier) => ({
            key: keyOf([row.package, row.path, row.start, row.name]),
            reference: {
              assemblyKind: context.rootKind,
              attribute: row.name,
              identifier,
              kind: row.kind,
              package: row.package,
              path: row.path,
              start: row.start,
            },
          })),
        )
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
                declaration: variable.start,
                package: referred.package,
                path: referred.path,
                start: referred.start,
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
              declaration: variable.start,
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
 * attribute of the class's names and kinds that names a variable ({@link namedBy}), unresolved,
 * since neither declares anything; each resolves once per assembly that places the document (spec
 * readings 5 and 117). The NCName test stays for the reasons {@link referencesOf} gives, each
 * relation's source being `sectionSources` of `#pantry/qti/interactions.ts`.
 *
 * @param context - The document.
 * @param read - The document's read attributes.
 * @param classes - The class's attributes and kinds.
 * @returns The rows, keyed by (package, path, start, attribute), none in an item or a test
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
          classes.some(
            (reference) =>
              reference.attributes.some((name) => name === row.name) &&
              reference.kinds.some((kind) => kind === row.kind),
          )
            ? Option.toArray(namedBy(row.lexical)).map(
                (identifier) =>
                  [
                    keyOf([row.package, row.path, row.start, row.name]),
                    {
                      attribute: row.name,
                      identifier,
                      kind: row.kind,
                      package: row.package,
                      path: row.path,
                      start: row.start,
                    },
                  ] as const,
              )
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
 * NS2: never a sentinel). A binding or a reference to a name a declaration with no cardinality
 * holds has its declaration row and no cardinality row, so no law over the cardinality judges it
 * and that declaration's own law refuses it alone (spec readings 158 and 159).
 *
 * @param view - The document's view: its rows, and their folds under its context (spec reading
 *   117), whose interaction an included fragment's nodes take as their nearest.
 * @param place - Where the document stands in its package: every row holds it.
 * @returns Every overlay's rows.
 */
export const rowsOf = (view: DocumentView, place: Place): InteractionRows => {
  const context = contextOf(view, place);
  const read = interactionAttributesOf(context);
  const choices = choicesOf(context);
  const owned = choiceInteractionsOf(context, choices);
  const gaps = gapInteractionsOf(choices, owned);
  const interactionRows = interactionsOf(context);
  const { baseTyped, bindings, bound, cardinalities, declarations, names } = bindingsOf(
    context,
    choiceCountsOf(interactionRows.keys(), gaps.values()),
  );
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
    ContextRef: contexts.references,
    ContextRefDeclaration: contexts.declarations,
    CountBound: counts.bounds,
    CountRange: counts.ranges,
    FeedbackRef: feedbacks.references,
    FeedbackRefCardinality: feedbacks.cardinalities,
    FeedbackRefDeclaration: feedbacks.declarations,
    GapInteraction: gaps,
    Hotspot: hotspotsOf(context),
    Hottext: hottexts,
    Interaction: interactionRows,
    InteractionAttribute: read,
    ItemMode: new Map(
      Option.toArray(context.itemMode).map(
        (adaptive) => [keyOf([place.package, place.path]), { ...place, adaptive }] as const,
      ),
    ),
    LeastCount: counts.leasts,
    MostCount: counts.mosts,
    PciModuleForm: pciModuleFormsOf(context),
    PrintedVariableRef: new Map(prints.flatMap(({ references: held }) => [...held])),
    PrintedVariableRefDeclaration: new Map(prints.flatMap(({ declarations: held }) => [...held])),
    ReferringDocument: new Map(
      referringRoots.every((root) => root !== context.rootKind)
        ? [[keyOf([place.package, place.path]), place]]
        : [],
    ),
    SectionContextName: sectionNamesOf(context, read, sectionContexts),
    SectionFeedbackName: sectionNamesOf(context, read, sectionFeedbacks),
    SectionPrintedName: sectionNamesOf(context, read, sectionPrints),
    SectionTemplateName: sectionNamesOf(context, read, sectionTemplates),
    Slider: slidersOf(context),
    TemplateRef: templates.references,
    TemplateRefCardinality: kindedOf(templates),
    TemplateRefDeclaration: templates.declarations,
  };
};

/**
 * A package's counts of the choices each bound owns and of the gaps each interaction owns
 * ({@link packageChoicesOf}), each by its place's key text ({@link placeKeyOf}).
 */
interface PackageChoices {
  /**
   * Each bound's count of choices, an interaction's the count `Interaction.choices` draws.
   */
  readonly choices: ReadonlyMap<string, bigint>;
  /**
   * Each interaction's count of gaps, the count `Interaction.gaps` draws.
   */
  readonly gaps: ReadonlyMap<string, bigint>;
}

/**
 * Count the choices each bound's node owns, and the gaps each interaction owns, across a package:
 * every document's {@link ChoiceInteraction} and {@link GapInteraction} rows, a fragment's placed in
 * an interaction among them (spec reading 117: a fragment's choices are its item's, as its merged
 * document holds them).
 *
 * @param parts - Every document's interaction rows.
 * @returns The counts.
 */
export const packageChoicesOf = (parts: Iterable<InteractionRows>): PackageChoices => {
  const read = [...parts];

  return {
    choices: choiceCountsOf(
      read.flatMap(({ CountBound: bounds }) => [...bounds.keys()]),
      read.flatMap(({ ChoiceInteraction: owned }) => [...owned.values()]),
    ),
    gaps: choiceCountsOf(
      read.flatMap(({ Interaction: held }) => [...held.keys()]),
      read.flatMap(({ GapInteraction: gaps }) => [...gaps.values()]),
    ),
  };
};

/**
 * Give each bound in one document's rows its package count of choices, which `CountBound.choices`
 * copies from `Interaction.choices` for an interaction, and its `LeastCount` and `MostCount` from
 * `CountBound`; and each binding's cardinality row its interaction's package count of gaps, which
 * `BindingCardinality.gaps` copies from `Interaction.gaps`.
 *
 * @param rows - A document's interaction rows.
 * @param counts - The package's counts ({@link packageChoicesOf}), whose bounds and interactions
 *   hold the document's.
 * @returns The same rows, each bound, count and binding cardinality recounted.
 */
export const withPackageChoices = (
  rows: InteractionRows,
  counts: PackageChoices,
): InteractionRows => {
  const recounted = <Row extends Pick<Addition<typeof CountBound>, "choices">>(
    bounds: ReadonlyMap<string, Row>,
  ): ReadonlyMap<string, Row> =>
    new Map(
      [...bounds].map(([key, bound]) => [
        key,
        { ...bound, choices: heldAt(counts.choices, key, "the package's counted bounds") },
      ]),
    );

  return {
    ...rows,
    BindingCardinality: new Map(
      [...rows.BindingCardinality].map(([key, binding]) => [
        key,
        {
          ...binding,
          gaps: heldAt(counts.gaps, placeKeyOf(binding), "the package's interactions"),
        },
      ]),
    ),
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
  readonly SectionTemplateRefCardinality: ReadonlyMap<
    string,
    Addition<typeof SectionTemplateRefCardinality>
  >;
  readonly SectionTemplateRefDeclaration: ReadonlyMap<
    string,
    Addition<typeof SectionTemplateRefDeclaration>
  >;
}

/**
 * One instance of an assembly's tree, with the assembly it is placed in, named by its head
 * document's path, that assembly's root kind, its package, and the instance's position in the
 * tree's pre-order, `start`, which the tree draws the same way (`Instance.start`): the instance's
 * key in its assembly.
 */
interface Placement {
  readonly assembly: string;
  readonly assemblyKind: InstanceRoot["assemblyKind"];
  readonly instance: InstanceMember | InstanceRoot;
  readonly package: string;
  readonly start: bigint;
}

/**
 * Collect every instance of an assembly's tree in pre-order, its root's own first at 0, each
 * numbered as the tree numbers it, with the assembly it is placed in and that assembly's root kind.
 *
 * @param root - The assembly's root instance.
 * @returns Each instance and its assembly, in pre-order.
 */
const instancesOf = (root: InstanceRoot): readonly Placement[] => {
  const found: Placement[] = [];
  const stack: (InstanceMember | InstanceRoot)[] = [root];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    found.push({
      assembly: root.assembly,
      assemblyKind: root.assemblyKind,
      instance: next,
      package: root.package,
      start: BigInt(found.length),
    });
    stack.push(...next.children.toReversed());
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
 * @returns The placed, declaration and cardinality rows, each keyed by (package, assembly,
 *   instance, start, attribute).
 */
const placedOf = (
  names: readonly Addition<typeof SectionFeedbackName>[],
  named: Context["named"],
  placement: Placement,
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
      instance: placement.start,
    };
    const variable = declarationIn(named, placed);

    return {
      cardinality: variable.pipe(
        Option.flatMap(({ cardinality, start }) =>
          cardinality.pipe(
            Option.map((held) => ({
              assembly: placement.assembly,
              attribute: name.attribute,
              cardinality: held,
              declaration: start,
              instance: placement.start,
              package: name.package,
              start: name.start,
            })),
          ),
        ),
      ),
      declaration: variable.pipe(
        Option.map((resolved) => ({
          ...placed,
          baseTypes: typedCountOf(resolved.baseType),
          cardinalities: typedCountOf(resolved.cardinality),
          declaration: resolved.start,
          declarationKind: resolved.declarationKind,
        })),
      ),
      key: keyOf([name.package, placement.assembly, placement.start, name.start, name.attribute]),
      placed,
    };
  });

/**
 * A named declaration as a package's builders resolve a name against it: its document's place
 * beside what {@link NamedVariable} holds.
 */
type PackageVariable = NamedVariable & { readonly package: string; readonly path: string };

/**
 * Read a package's named declarations, whatever their cardinality spells, as a binding or a placed
 * reference resolves its name against them (spec reading 159): each `DeclarationIdentifier` row
 * with its declaration's cardinality and base type, each none where the declaration has no
 * `DeclarationCardinality` or `DeclarationBaseType` row, in the order the rows are given.
 *
 * @param declarations - Every named declaration's `DeclarationIdentifier` row.
 * @param cardinalities - Every declaration's `DeclarationCardinality` row, where it has one.
 * @param baseTypes - Every declaration's `DeclarationBaseType` row, where it has one.
 * @returns Each named declaration, with its document's place.
 */
const namedVariablesOf = (
  declarations: Iterable<Addition<typeof DeclarationIdentifier>>,
  cardinalities: Iterable<Addition<typeof DeclarationCardinality>>,
  baseTypes: Iterable<Addition<typeof DeclarationBaseType>>,
): readonly PackageVariable[] => {
  const cardinalityOf = new Map(
    [...cardinalities].map((row) => [placeKeyOf(row), row.cardinality] as const),
  );
  const baseTypeOf = new Map([...baseTypes].map((row) => [placeKeyOf(row), row.baseType] as const));

  return [...declarations].map((row) => ({
    baseType: Option.fromUndefinedOr(baseTypeOf.get(placeKeyOf(row))),
    cardinality: Option.fromUndefinedOr(cardinalityOf.get(placeKeyOf(row))),
    declarationKind: row.declarationKind,
    identifier: row.identifier,
    package: row.package,
    path: row.path,
    start: row.start,
  }));
};

/**
 * Write the key text of a document's place, `(package, path)`, which the package's builders join
 * a document's rows on.
 *
 * @param row - The row: its document's place.
 * @param row.package - The package's manifest identifier.
 * @param row.path - The document's path.
 * @returns The key text.
 */
const documentKeyOf = (row: { readonly package: string; readonly path: string }): string =>
  keyOf([row.package, row.path]);

/**
 * Write the key text of the document an instance places, `(package, document)`.
 *
 * @param placement - The instance's placement.
 * @returns The key text.
 */
const placedDocumentKeyOf = (placement: Placement): string =>
  keyOf([placement.package, placement.instance.document]);

/**
 * Write the key text of an assembly's head document, `(package, assembly)`, whose declarations
 * its placed rows resolve among.
 *
 * @param placement - An instance's placement.
 * @returns The key text.
 */
const assemblyKeyOf = (placement: Placement): string =>
  keyOf([placement.package, placement.assembly]);

/**
 * Decide whether an instance is a placement `SectionScope` holds: an instance of an item's or a
 * test's assembly whose document is neither (`referringRoots`), a section document or a fragment
 * under a test, a fragment under an item (spec reading 117).
 *
 * @param placement - The instance's placement.
 * @returns Whether its references resolve under it.
 */
const resolvesUnder = (placement: Placement): boolean =>
  referringRoots.some((kind) => kind === placement.assemblyKind) &&
  referringRoots.every((kind) => kind !== placement.instance.rootKind);

/**
 * Build a package's placements: one per instance of a section document or a fragment under a test
 * and of an included fragment under an item, and under it each of the document's references of each
 * class, under the assembly's root kind, with its declaration row where the name is that of an
 * assembly's declaration of a kind it may name, whatever its cardinality spells, and a feedback's
 * or a template's cardinality row where that declaration has one (spec reading 159, decision 432):
 * a built-in of the assembly's root has none, and its law reads `BuiltInVariable`; a name no
 * allowed declaration holds has none, and its law refuses it (lane NIL's NS2: never a sentinel).
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
    instancesOf(root).filter(resolvesUnder),
  );
  const scoped = joinOn(
    placements,
    assemblyKeyOf,
    namedVariablesOf(input.declarations, input.cardinalities, input.baseTypes),
    documentKeyOf,
  );
  const resolvedOf = (names: Iterable<Addition<typeof SectionFeedbackName>>) => {
    const placed = joinOn(
      scoped,
      ([placement]) => placedDocumentKeyOf(placement),
      names,
      documentKeyOf,
    ).flatMap(([[placement, scope], named]) => placedOf(named, scope, placement));

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
        (placement) =>
          [
            keyOf([placement.package, placement.assembly, placement.start]),
            {
              assembly: placement.assembly,
              assemblyKind: placement.assemblyKind,
              document: placement.instance.document,
              instance: placement.start,
              package: placement.package,
            },
          ] as const,
      ),
    ),
    SectionTemplateRef: templates.references,
    SectionTemplateRefCardinality: kindedOf(templates),
    SectionTemplateRefDeclaration: templates.declarations,
  };
};

/**
 * A package's bindings placed under each instance of an item's assembly, keyed by (package,
 * assembly, instance, start, attribute), and its choices and hottexts under each instance of every
 * assembly, keyed by (package, assembly, instance, start).
 */
export interface PlacedBindingRows {
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
 * assembly's: "Choice not variable" holds each identifier they bear to the declarations of the
 * assembly's root document (`UnclaimedName`, `#pantry/qti/queries.ts`).
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
 * @param input.gaps - Every document's gaps' interactions ({@link rowsOf}'s `GapInteraction`): a
 *   placed binding's `gaps` counts those its interaction owns, `Interaction.gaps`.
 * @param input.hottexts - Every document's hottexts ({@link rowsOf}'s `Hottext`).
 * @param input.instances - Every assembly's root instance, its tree nested (Q5.13's
 *   `assembledRowsOf`).
 * @param input.mosts - Every document's most counts that have a value ({@link rowsOf}'s
 *   `MostCount`), whose elements a placed binding's `mosts` counts.
 * @param input.names - Every document's binding attributes ({@link rowsOf}'s `BindingName`).
 * @returns The rows.
 */
export const placedBindingRowsOf = (input: {
  readonly adaptive: Iterable<Addition<typeof ItemMode>>;
  readonly baseTypes: Iterable<Addition<typeof DeclarationBaseType>>;
  readonly cardinalities: Iterable<Addition<typeof DeclarationCardinality>>;
  readonly choices: Iterable<Addition<typeof Choice>>;
  readonly declarations: Iterable<Addition<typeof DeclarationIdentifier>>;
  readonly gaps: Iterable<Addition<typeof GapInteraction>>;
  readonly hottexts: Iterable<Addition<typeof Hottext>>;
  readonly instances: Iterable<InstanceRoot>;
  readonly mosts: Iterable<Addition<typeof MostCount>>;
  readonly names: Iterable<Addition<typeof BindingName>>;
}): PlacedBindingRows => {
  const counted = new Set([...input.mosts].map(placeKeyOf));
  const gapsAt = Map.groupBy(input.gaps, ({ interaction, interactionPath, package: pkg }) =>
    placeKeyOf({ package: pkg, path: interactionPath, start: interaction }),
  );
  const declarations = namedVariablesOf(input.declarations, input.cardinalities, input.baseTypes);
  const modes = new Map([...input.adaptive].map((row) => [documentKeyOf(row), row.adaptive]));
  const placements = [...input.instances].flatMap((root) => instancesOf(root));
  const placedOfDocument = <Row extends { readonly package: string; readonly path: string }>(
    rows: Iterable<Row>,
  ) =>
    joinOn(placements, placedDocumentKeyOf, rows, documentKeyOf).flatMap(([placement, held]) =>
      held.map((row) => ({ placement, row })),
    );
  const choices = placedOfDocument(input.choices);
  const hottexts = placedOfDocument(input.hottexts);
  const bound = joinOn(
    joinOn(
      placements.filter(({ assemblyKind }) => assemblyKind === itemKind),
      assemblyKeyOf,
      declarations,
      documentKeyOf,
    ),
    ([placement]) => placedDocumentKeyOf(placement),
    input.names,
    documentKeyOf,
  ).flatMap(([[placement, declared], names]) =>
    names.map((name) => ({
      binding: { ...name, assembly: placement.assembly, instance: placement.start },
      declared,
      key: keyOf([name.package, placement.assembly, placement.start, name.start, name.attribute]),
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
    PlacedBinding: new Map(
      bound.map(
        ({ binding, key }) =>
          [
            key,
            {
              ...binding,
              adaptive: heldAt(
                modes,
                keyOf([binding.package, binding.assembly]),
                "the package's item modes",
              ),
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
                assembly: binding.assembly,
                attribute: binding.attribute,
                baseType,
                cardinality,
                declaration: variable.start,
                instance: binding.instance,
                kind: binding.kind,
                package: binding.package,
                start: binding.start,
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
              assembly: binding.assembly,
              attribute: binding.attribute,
              baseTypes: typedCountOf(variable.baseType),
              cardinality,
              declaration: variable.start,
              gaps: BigInt(gapsAt.get(placeKeyOf(binding))?.length ?? 0),
              instance: binding.instance,
              kind: binding.kind,
              mosts: counted.has(placeKeyOf(binding)) ? 1n : 0n,
              package: binding.package,
              path: binding.path,
              start: binding.start,
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
              declaration: variable.start,
              declarationKind: variable.declarationKind,
            },
          ] as const,
      ),
    ),
    PlacedChoice: new Map(
      choices.map(
        ({ placement, row: { identifier, kind, package: pkg, path, start } }) =>
          [
            keyOf([pkg, placement.assembly, placement.start, start]),
            {
              assembly: placement.assembly,
              identifier,
              instance: placement.start,
              kind,
              package: pkg,
              path,
              start,
            },
          ] as const,
      ),
    ),
    PlacedHottext: new Map(
      hottexts.map(
        ({ placement, row: { identifier, package: pkg, path, start } }) =>
          [
            keyOf([pkg, placement.assembly, placement.start, start]),
            {
              assembly: placement.assembly,
              identifier,
              instance: placement.start,
              package: pkg,
              path,
              start,
            },
          ] as const,
      ),
    ),
  };
};
