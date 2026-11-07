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
import { Option } from "effect";
import { ChoiceBound, ContentReference, interactionKinds } from "#pantry/grammar/install.ts";
import { booleanOf } from "#pantry/grammar/domains.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { foldOf, ownContext } from "#pantry/import/fold.ts";
import type { Folded } from "#pantry/import/fold.ts";
import { declaredFieldsOf } from "#pantry/import/overlays/declarations.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { Declaration } from "#pantry/qti/declarations.ts";
import { itemKind, sectionKind, testKind } from "#pantry/qti/tests.ts";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";
import {
  adaptiveName,
  ariaNames,
  bindingAttributes,
  builtIns,
  choiceKinds,
  countDefault,
  hotspotKinds,
  hottextKind,
  integerStartPattern,
  nilUuid,
  readAttributes,
  references,
  referringRoots,
  sliderKind,
  unfragmentedRoots,
} from "#pantry/qti/interactions.ts";
import type {
  AriaElement,
  AriaRange,
  AriaValue,
  Binding,
  BindingDeclaration,
  BindingName,
  BoundVariable,
  Choice,
  ChoiceInteraction,
  ChoiceVariableName,
  ContextRef,
  CountBound,
  FeedbackRef,
  Hotspot,
  Hottext,
  Interaction,
  InteractionAttribute,
  ItemMode,
  PlacedBinding,
  PlacedBindingDeclaration,
  PlacedChoice,
  PlacedHottext,
  PrintedVariableRef,
  ReferringDocument,
  SectionContextName,
  SectionContextRef,
  SectionFeedbackName,
  SectionFeedbackRef,
  SectionPrintedName,
  SectionPrintedRef,
  SectionScope,
  SectionTemplateName,
  SectionTemplateRef,
  Slider,
  TemplateRef,
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
   * The document's context (spec reading 117), its own where none is given: an included
   * fragment's nodes take the interaction their includes stand in as their nearest.
   */
  readonly context?: DocumentContext;
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
  readonly BindingDeclaration: ReadonlyMap<string, Addition<typeof BindingDeclaration>>;
  readonly BindingName: ReadonlyMap<string, Addition<typeof BindingName>>;
  readonly BoundVariable: ReadonlyMap<string, Addition<typeof BoundVariable>>;
  readonly Choice: ReadonlyMap<string, Addition<typeof Choice>>;
  readonly ChoiceInteraction: ReadonlyMap<string, Addition<typeof ChoiceInteraction>>;
  readonly ChoiceVariableName: ReadonlyMap<string, Addition<typeof ChoiceVariableName>>;
  readonly ContextRef: ReadonlyMap<string, Addition<typeof ContextRef>>;
  readonly CountBound: ReadonlyMap<string, Addition<typeof CountBound>>;
  readonly FeedbackRef: ReadonlyMap<string, Addition<typeof FeedbackRef>>;
  readonly Hotspot: ReadonlyMap<string, Addition<typeof Hotspot>>;
  readonly Hottext: ReadonlyMap<string, Addition<typeof Hottext>>;
  readonly Interaction: ReadonlyMap<string, Addition<typeof Interaction>>;
  readonly InteractionAttribute: ReadonlyMap<string, Addition<typeof InteractionAttribute>>;
  readonly ItemMode: ReadonlyMap<string, Addition<typeof ItemMode>>;
  readonly PrintedVariableRef: ReadonlyMap<string, Addition<typeof PrintedVariableRef>>;
  readonly ReferringDocument: ReadonlyMap<string, Addition<typeof ReferringDocument>>;
  readonly SectionContextName: ReadonlyMap<string, Addition<typeof SectionContextName>>;
  readonly SectionFeedbackName: ReadonlyMap<string, Addition<typeof SectionFeedbackName>>;
  readonly SectionPrintedName: ReadonlyMap<string, Addition<typeof SectionPrintedName>>;
  readonly SectionTemplateName: ReadonlyMap<string, Addition<typeof SectionTemplateName>>;
  readonly Slider: ReadonlyMap<string, Addition<typeof Slider>>;
  readonly TemplateRef: ReadonlyMap<string, Addition<typeof TemplateRef>>;
}

/**
 * A content reference row as each reference relation writes it: the five relations share one
 * heading.
 */
type ReferenceRow = Addition<typeof FeedbackRef>;

/**
 * A declaration as the bindings and references resolve against it: its node, kind as a
 * `DeclarationKind`, identifier collapsed, and the codes its `base-type` and `cardinality` spell.
 */
interface DeclaredVariable {
  readonly baseType: ReferenceRow["baseType"];
  readonly cardinality: ReferenceRow["cardinality"];
  readonly declarationKind: ReferenceRow["declarationKind"];
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
 * XML whitespace at the start of a text.
 */
const leading = /^[\t\n\r ]*/u;

/**
 * XML whitespace at the end of a text.
 */
const trailing = /[\t\n\r ]*$/u;

/**
 * An `xs:integer` lexical form, the one a count's value is parsed from.
 */
const integerForm = /^[+-]?[0-9]+$/u;

/**
 * A printed variable's `base` or `index` that is an integer, not a variable's name
 * (`integerStartPattern`).
 */
const integerStart = new RegExp(integerStartPattern, "u");

/**
 * XML whitespace `S`, possibly none, as the `lead` and `trail` of a read attribute are typed.
 */
type Space = Addition<typeof InteractionAttribute>["lead"];

/**
 * Decide whether a text is XML whitespace, possibly none.
 *
 * @param text - The text.
 * @returns Whether it is a {@link Space}.
 */
const isSpace = (text: string): text is Space => /^[\t\n\r ]*$/u.test(text);

/**
 * A lexical form's pieces: its outer whitespace and its collapsed value.
 */
export interface Pieces {
  readonly lead: Space;
  readonly trail: Space;
  readonly value: string;
}

/**
 * Split a lexical form into its outer whitespace and its collapsed value, as `E1_derived` proves
 * it: an all-whitespace form puts its whitespace in `lead`.
 *
 * @param lexical - The lexical form as written.
 * @returns Its pieces.
 */
export const pieces = (lexical: string): Pieces => {
  const lead = leading.exec(lexical)?.[0] ?? "";
  const rest = lexical.slice(lead.length);
  const trail = trailing.exec(rest)?.[0] ?? "";

  return {
    lead: isSpace(lead) ? lead : "",
    trail: isSpace(trail) ? trail : "",
    value: rest.slice(0, rest.length - trail.length),
  };
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
 * What the tree's rows say of each node beside its own row: its fold (`#pantry/import/fold.ts`),
 * which holds its nearest interaction (N8) and its element counts, and each node's kind by id.
 */
interface TreeFacts {
  readonly folds: ReadonlyMap<NodeId, Folded>;
  readonly kindOf: (id: NodeId) => KindOfNode;
}

/**
 * Compute a document's {@link TreeFacts}.
 *
 * @param nodes - A document's node rows, in document order, so each parent precedes its children.
 * @param context - The document's context, whose nearest the document node's is (spec reading
 *   117), and whose kind an interaction of another document has.
 * @returns The facts.
 */
const treeFactsOf = (nodes: readonly NodeRow<Composed>[], context: DocumentContext): TreeFacts => {
  const kinds = new Map(nodes.map((node) => [node.id, node.kind] as const));

  return {
    folds: foldOf(nodes, context),
    kindOf: (id) => kinds.get(id) ?? (id === context.nearest ? context.nearestKind : "document"),
  };
};

/**
 * One document as the builders read it: its flat rows, its document node and root kind, the tree's
 * facts, each element's attributes, its declarations and whether it is an adaptive item.
 */
interface Context {
  readonly adaptive: boolean;
  readonly attributes: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
  readonly declared: readonly (DeclaredVariable & { readonly identifier: string })[];
  readonly document: NodeId;
  readonly facts: TreeFacts;
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
 * Read an element's attribute collapsed.
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
): Option.Option<string> =>
  Option.map(lexicalOf(context, node, name), (lexical) => pieces(lexical).value);

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
  nearest: context.facts.folds.get(node.id)?.nearest ?? context.document,
  node: node.id,
  parent: node.parent,
  start: node.start,
  version: node.version,
});

/**
 * Read a declaring element's fields as `Declaration`'s builder writes them
 * (`#pantry/import/overlays/declarations.ts` `declaredFieldsOf`).
 *
 * @param context - The document.
 * @param node - The element.
 * @returns Its fields; the kind none for an element that declares nothing.
 */
const declaredFieldsAt = (context: Pick<Context, "attributes">, node: NodeRow<Composed>) =>
  declaredFieldsOf(node.kind, (name) => Option.getOrUndefined(lexicalOf(context, node.id, name)));

/**
 * Read a document's declarations, each declaring element that writes an `identifier`, as
 * {@link declaredFieldsAt} reads them; one that writes none names nothing a reference resolves to.
 *
 * @param context - The document, its declarations not yet read.
 * @returns The declarations.
 */
const declaredOf = (context: Omit<Context, "adaptive" | "declared">): Context["declared"] =>
  context.rows.nodes.flatMap((node) => {
    const { declarationKind, ...fields } = declaredFieldsAt(context, node);

    return Option.isSome(declarationKind) &&
      Option.isSome(lexicalOf(context, node.id, "identifier"))
      ? [{ ...fields, declarationKind: declarationKind.value, node: node.id }]
      : [];
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
  const attributes = new Map<NodeId, Map<string, string>>();
  for (const { lexical, name, node } of rows.attributes) {
    const named = attributes.get(node) ?? new Map<string, string>();
    named.set(name, lexical);
    attributes.set(node, named);
  }

  const base = {
    attributes,
    document: rows.document.node,
    facts: treeFactsOf(rows.nodes, ids.context ?? ownContext(rows.document.node)),
    rootKind: doc.root.kind,
    rows,
  };
  const item = rows.nodes.find((node) => node.kind === itemKind);

  return {
    ...base,
    adaptive:
      item !== undefined &&
      Option.contains(Option.flatMap(valueOf(base, item.id, adaptiveName), booleanOf), true),
    declared: declaredOf(base),
  };
};

/**
 * The declaration kinds a content reference of each attribute on each kind may name, by
 * `<attribute> <kind>` (`ContentReference`).
 */
const allowedKinds: ReadonlyMap<string, readonly ReferenceRow["declarationKind"][]> = new Map(
  [...Map.groupBy(ContentReference.rows, ({ attribute, kind }) => `${attribute} ${kind}`)].map(
    ([key, rows]) => [key, rows.map(({ declaration }) => declaration)],
  ),
);

/**
 * Read the declaration kinds a content reference may name.
 *
 * @param attribute - The reference's attribute.
 * @param kind - The kind of the element that carries it.
 * @returns The kinds, in `ContentReference`'s order; none for an attribute no row names on the
 *   kind.
 */
const allowedOf = (attribute: string, kind: string): readonly ReferenceRow["declarationKind"][] =>
  allowedKinds.get(`${attribute} ${kind}`) ?? [];

/**
 * Resolve a name a binding or a reference makes: a built-in variable to its type under the nil
 * declaration; else a declaration of the name, one of an allowed kind where there is one; else the
 * nil declaration of the first allowed kind, which `declarationRef` refuses.
 *
 * @param declared - The declarations the name resolves among.
 * @param identifier - The name, collapsed.
 * @param allowed - The declaration kinds the name may resolve to.
 * @returns The variable.
 */
const resolveIn = (
  declared: Context["declared"],
  identifier: string,
  allowed: readonly ReferenceRow["declarationKind"][],
): DeclaredVariable => {
  const builtIn = builtIns.find(({ variable }) => variable === identifier);
  if (builtIn !== undefined) {
    return {
      baseType: builtIn.baseType,
      cardinality: builtIn.cardinality,
      declarationKind: builtIn.declaration,
      node: nilUuid,
    };
  }

  const named = declared.filter((declaration) => declaration.identifier === identifier);

  return (
    named.find(({ declarationKind }) => allowed.includes(declarationKind)) ??
    named[0] ?? {
      baseType: "none",
      cardinality: "single",
      declarationKind: allowed[0] ?? "qti-response-declaration",
      node: nilUuid,
    }
  );
};

/**
 * Find the response declaration a binding names among its item's declarations. A built-in
 * variable, a declaration of another kind and a name no declaration holds bind no response
 * variable, so each has none, and its binding no declaration row.
 *
 * @param declared - The item's declarations.
 * @param identifier - The name, collapsed.
 * @returns The response declaration, or none.
 */
const responseIn = (
  declared: Context["declared"],
  identifier: string,
): Option.Option<DeclaredVariable> =>
  Option.fromNullishOr(
    declared.find(
      (declaration) =>
        declaration.identifier === identifier &&
        declaration.declarationKind === "qti-response-declaration",
    ),
  );

/**
 * Build the read attributes: each attribute O3 reads, its lexical form and its pieces.
 *
 * @param context - The document.
 * @returns The rows, keyed by (node, name).
 */
const interactionAttributesOf = (context: Context) =>
  new Map(
    context.rows.attributes.flatMap(({ lexical, name, node }) => {
      const kind = context.facts.kindOf(node);
      const read =
        ariaNames.some((aria) => aria === name) ||
        (readAttributes.get(name) ?? []).some((held) => held === kind);

      return read
        ? [
            [
              keyOf([node, name]),
              {
                ...pieces(lexical),
                document: context.document,
                kind,
                lexical,
                name,
                node,
                rootKind: context.rootKind,
              } satisfies Addition<typeof InteractionAttribute>,
            ] as const,
          ]
        : [];
    }),
  );

/**
 * Build each interaction's binding, and in an item each of its bound variables and the response
 * declaration each names, where one does.
 *
 * @param context - The document.
 * @returns The `Binding` rows, keyed by node, and the `BindingName` rows of every document and
 *   the `BoundVariable` and `BindingDeclaration` rows of an item, each keyed by (node, attribute).
 */
const bindingsOf = (context: Context) => {
  const bindings = new Map<string, Addition<typeof Binding>>();
  const names = new Map<string, Addition<typeof BindingName>>();
  const bound = new Map<string, Addition<typeof BoundVariable>>();
  const declarations = new Map<string, Addition<typeof BindingDeclaration>>();
  for (const node of context.rows.nodes.filter(({ kind }) => interactions.has(kind))) {
    if (Option.isSome(valueOf(context, node.id, "response-identifier"))) {
      bindings.set(node.id, tupleOf(context, node));
    }

    for (const attribute of bindingAttributes) {
      for (const identifier of Option.toArray(valueOf(context, node.id, attribute))) {
        names.set(keyOf([node.id, attribute]), {
          attribute,
          document: context.document,
          identifier,
          kind: node.kind,
          node: node.id,
        });
      }
    }

    for (const attribute of context.rootKind === itemKind ? bindingAttributes : []) {
      for (const identifier of Option.toArray(valueOf(context, node.id, attribute))) {
        const binding = {
          attribute,
          document: context.document,
          identifier,
          kind: node.kind,
          node: node.id,
        };
        bound.set(keyOf([node.id, attribute]), { ...binding, adaptive: context.adaptive });
        for (const variable of Option.toArray(responseIn(context.declared, identifier))) {
          declarations.set(keyOf([node.id, attribute]), {
            ...binding,
            baseType: variable.baseType,
            cardinality: variable.cardinality,
            declaration: variable.node,
            declarationKind: variable.declarationKind,
          });
        }
      }
    }
  }

  return { bindings, bound, declarations, names };
};

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
      .filter(({ nearest }) => interactions.has(context.facts.kindOf(nearest)))
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
        Option.toArray(valueOf(context, node.id, "identifier")).map((identifier) => {
          const tuple = tupleOf(context, node);

          return [
            node.id,
            {
              ...tuple,
              identifier,
              nearestKind: context.facts.kindOf(tuple.nearest),
            } satisfies Addition<typeof Hottext>,
          ] as const;
        }),
      ),
  );

/**
 * Build each identifier's {@link ChoiceVariableName} row: one per identifier a choice, a hottext
 * or a declaration of the document bears, each once, with the document's root kind. Its counts are
 * the families' to draw, so the row is the identifier alone. A declaration is read as Q5.08's
 * builder writes its `Declaration` row, its identifier collapsed or empty where it writes none (AL3
 * refuses that element), so every `Declaration` row has its projection row.
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
      ...context.rows.nodes.flatMap((node) => {
        const { declarationKind, identifier } = declaredFieldsAt(context, node);

        return Option.isSome(declarationKind) ? [identifier] : [];
      }),
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
                elementChildren: context.facts.folds.get(node.id)?.elementChildren ?? 0n,
                elements: context.facts.folds.get(node.id)?.elements ?? 0n,
                parentElementChildren: context.facts.folds.get(node.parent)?.elementChildren ?? 0n,
                parentElements: context.facts.folds.get(node.parent)?.elements ?? 0n,
                parentKind: context.facts.kindOf(node.parent),
              } satisfies Addition<typeof Hotspot>,
            ] as const,
        ),
      ),
  );

/**
 * Read one count of a bound: its value as written, else its XSD default, else `0`, and its integer.
 *
 * @param context - The document.
 * @param node - The element.
 * @param name - The count's attribute.
 * @returns The value, its integer (0 for a form no integer reads, which `E1_derived` refuses), and
 *   whether it is written.
 */
const countOf = (context: Context, node: NodeRow<Composed>, name: CountName) => {
  const written = valueOf(context, node.id, name);
  const value = Option.getOrElse(written, () =>
    Option.getOrElse(countDefault(node.version, node.kind, name), () => "0"),
  );

  return {
    integer: integerForm.test(value) ? BigInt(value) : 0n,
    value,
    written: Option.isSome(written),
  };
};

/**
 * Count the choices each interaction owns: its {@link ChoiceInteraction} rows.
 *
 * @param owned - Choices' interactions, of one document or of the whole package.
 * @returns Each interaction's count, by its node.
 */
const choiceCountsOf = (owned: Iterable<Addition<typeof ChoiceInteraction>>) => {
  const counts = new Map<string, bigint>();
  for (const { interaction } of owned) {
    counts.set(interaction, (counts.get(interaction) ?? 0n) + 1n);
  }

  return counts;
};

/**
 * Build each bound's row, an interaction's choices the count of the choices it owns in its own
 * document: {@link withPackageChoices} adds those a fragment placed in it holds.
 *
 * @param context - The document.
 * @param owned - The document's choices' interactions.
 * @returns The rows, keyed by node.
 */
const boundsOf = (
  context: Context,
  owned: ReadonlyMap<string, Addition<typeof ChoiceInteraction>>,
) => {
  const counts = choiceCountsOf(owned.values());

  return new Map(
    context.rows.nodes.flatMap((node) =>
      ChoiceBound.rows
        .filter(({ kind }) => kind === node.kind)
        .map(({ max, min }) => {
          const least = countOf(context, node, min);
          const most = countOf(context, node, max);

          return [
            node.id,
            {
              ...tupleOf(context, node),
              choices: interactions.has(node.kind) ? (counts.get(node.id) ?? 0n) : 0n,
              least: least.value,
              leastValue: least.integer,
              maxName: max,
              maxWritten: most.written,
              minName: min,
              minWritten: least.written,
              most: most.value,
              mostValue: most.integer,
            } satisfies Addition<typeof CountBound>,
          ] as const;
        }),
    ),
  );
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
 * kinds that names a variable, in an item or a test, resolved among the document's declarations of
 * the kinds `ContentReference` allows there.
 *
 * @param context - The document.
 * @param read - The document's read attributes.
 * @param reference - The relation's attributes and kinds.
 * @param names - Whether a value names a variable, rather than being a literal.
 * @returns The rows, keyed by (node, attribute).
 */
const referencesOf = (
  context: Context,
  read: ReturnType<typeof interactionAttributesOf>,
  reference: (typeof references)[keyof typeof references],
  names: (value: string) => boolean,
): ReadonlyMap<string, ReferenceRow> =>
  new Map(
    referringRoots.some((root) => root === context.rootKind)
      ? [...read.values()]
          .filter(
            (row) =>
              reference.attributes.some((name) => name === row.name) &&
              reference.kinds.some((kind) => kind === row.kind) &&
              names(row.value),
          )
          .map((row) => {
            const variable = resolveIn(context.declared, row.value, allowedOf(row.name, row.kind));

            return [
              keyOf([row.node, row.name]),
              {
                attribute: row.name,
                baseType: variable.baseType,
                cardinality: variable.cardinality,
                declaration: variable.node,
                declarationKind: variable.declarationKind,
                document: context.document,
                identifier: row.value,
                kind: row.kind,
                node: row.node,
              },
            ] as const;
          })
      : [],
  );

/**
 * Decide that every value names a variable: an `IdentifierDType` attribute always does.
 *
 * @returns True.
 */
const always = () => true;

/**
 * Decide whether a printed variable's `base` or `index` names a variable rather than writing an
 * integer.
 *
 * @param value - The value, collapsed.
 * @returns Whether it is a name.
 */
const namesVariable = (value: string) => !integerStart.test(value);

/**
 * Build a section document's or an included fragment's references of one class: each read
 * attribute of the class's names and kinds that names a variable, unresolved, since neither
 * declares anything; each resolves once per assembly that places the document.
 *
 * @param context - The document.
 * @param read - The document's read attributes.
 * @param classes - The class's references and whether a value names a variable.
 * @param resolving - The root kinds of the documents that make no such reference of their own:
 *   {@link referringRoots}, whose references resolve in their own declarations, or
 *   {@link unfragmentedRoots} for a class only a fragment's references are.
 * @returns The rows, keyed by (node, attribute), none in a document `resolving` names.
 */
const sectionNamesOf = (
  context: Context,
  read: ReturnType<typeof interactionAttributesOf>,
  classes: readonly {
    readonly names: (value: string) => boolean;
    readonly reference: (typeof references)[keyof typeof references];
  }[],
  resolving: readonly string[],
): ReadonlyMap<string, Addition<typeof SectionFeedbackName>> =>
  new Map(
    resolving.every((root) => root !== context.rootKind)
      ? [...read.values()].flatMap((row) =>
          classes.some(
            ({ names, reference }) =>
              reference.attributes.some((name) => name === row.name) &&
              reference.kinds.some((kind) => kind === row.kind) &&
              names(row.value),
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
const sectionFeedbacks = [{ names: always, reference: references.feedback }] as const;

/**
 * A fragment's template variable references: its template elements' and choices'
 * `template-identifier`.
 */
const sectionTemplates = [{ names: always, reference: references.template }] as const;

/**
 * A fragment's context variable references: its `qti-context-variable`s' `identifier`.
 */
const sectionContexts = [{ names: always, reference: references.context }] as const;

/**
 * A section document's printed variable references: their names, and their bases and indices where
 * they name a variable.
 */
const sectionPrints = [
  { names: always, reference: references.printed },
  { names: namesVariable, reference: references.variable },
] as const;

/**
 * Build the interaction overlays' rows of one document.
 *
 * A required attribute that is absent leaves out the row its copy proves (a choice's `identifier`,
 * a hotspot's `shape`), and AL3 refuses the element. A binding or a reference whose name no
 * declaration of the document holds is written resolved to the nil declaration, which
 * `declarationRef` refuses.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: InteractionIds): InteractionRows => {
  const context = contextOf(doc, ids);
  const read = interactionAttributesOf(context);
  const { bindings, bound, declarations, names } = bindingsOf(context);
  const choices = choicesOf(context);
  const owned = choiceInteractionsOf(context, choices);
  const hottexts = hottextsOf(context);
  const aria = ariaOf(context);

  return {
    AriaElement: aria.elements,
    AriaRange: aria.ranges,
    AriaValue: aria.values,
    Binding: bindings,
    BindingDeclaration: declarations,
    BindingName: names,
    BoundVariable: bound,
    Choice: choices,
    ChoiceInteraction: owned,
    ChoiceVariableName: choiceNamesOf(context, choices, hottexts),
    ContextRef: referencesOf(context, read, references.context, always),
    CountBound: boundsOf(context, owned),
    FeedbackRef: referencesOf(context, read, references.feedback, always),
    Hotspot: hotspotsOf(context),
    Hottext: hottexts,
    Interaction: interactionsOf(context),
    InteractionAttribute: read,
    ItemMode: new Map(
      context.rootKind === itemKind
        ? [[context.document, { adaptive: context.adaptive, document: context.document }]]
        : [],
    ),
    PrintedVariableRef: new Map([
      ...referencesOf(context, read, references.printed, always),
      ...referencesOf(context, read, references.variable, namesVariable),
    ]),
    ReferringDocument: new Map(
      referringRoots.every((root) => root !== context.rootKind)
        ? [[context.document, { document: context.document }]]
        : [],
    ),
    SectionContextName: sectionNamesOf(context, read, sectionContexts, unfragmentedRoots),
    SectionFeedbackName: sectionNamesOf(context, read, sectionFeedbacks, referringRoots),
    SectionPrintedName: sectionNamesOf(context, read, sectionPrints, referringRoots),
    SectionTemplateName: sectionNamesOf(context, read, sectionTemplates, unfragmentedRoots),
    Slider: slidersOf(context),
    TemplateRef: referencesOf(context, read, references.template, always),
  };
};

/**
 * Count the choices each interaction owns across a package: every document's
 * {@link ChoiceInteraction} rows, a fragment's placed in an interaction among them (spec reading
 * 117: a fragment's choices are its item's, as its merged document holds them).
 *
 * @param parts - Every document's interaction rows.
 * @returns Each interaction's count, by its node, which `Interaction.choices` draws.
 */
export const packageChoicesOf = (parts: Iterable<InteractionRows>): ReadonlyMap<string, bigint> =>
  choiceCountsOf([...parts].flatMap(({ ChoiceInteraction: owned }) => [...owned.values()]));

/**
 * Give each interaction's bound in one document's rows its package count of choices, which
 * `CountBound.choices` copies from `Interaction.choices`.
 *
 * @param rows - A document's interaction rows.
 * @param counts - The package's counts ({@link packageChoicesOf}).
 * @returns The same rows, each interaction's bound recounted.
 */
export const withPackageChoices = (
  rows: InteractionRows,
  counts: ReadonlyMap<string, bigint>,
): InteractionRows => ({
  ...rows,
  CountBound: new Map(
    [...rows.CountBound].map(([key, bound]) => [
      key,
      interactions.has(bound.kind) ? { ...bound, choices: counts.get(bound.node) ?? 0n } : bound,
    ]),
  ),
});

/**
 * A package's section and fragment placements and their resolved references, one keyed set per
 * relation.
 */
export interface SectionRows {
  readonly SectionContextRef: ReadonlyMap<string, Addition<typeof SectionContextRef>>;
  readonly SectionFeedbackRef: ReadonlyMap<string, Addition<typeof SectionFeedbackRef>>;
  readonly SectionPrintedRef: ReadonlyMap<string, Addition<typeof SectionPrintedRef>>;
  readonly SectionScope: ReadonlyMap<string, Addition<typeof SectionScope>>;
  readonly SectionTemplateRef: ReadonlyMap<string, Addition<typeof SectionTemplateRef>>;
}

/**
 * Collect every instance of an assembly's tree, its root's own included, with the assembly it is
 * placed in.
 *
 * @param root - The assembly's root instance.
 * @returns Each instance and its assembly.
 */
const instancesOf = (
  root: InstanceRoot,
): readonly { readonly assembly: NodeId; readonly instance: InstanceMember | InstanceRoot }[] => {
  const found: { readonly assembly: NodeId; readonly instance: InstanceMember | InstanceRoot }[] =
    [];
  const stack: (InstanceMember | InstanceRoot)[] = [root];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    found.push({ assembly: root.assembly, instance: next });
    stack.push(...next.children);
  }

  return found;
};

/**
 * Resolve each reference of a section document or a fragment under one placement, among its
 * assembly's declarations.
 *
 * @param names - The document's references of one class.
 * @param declared - The assembly's declarations.
 * @param placement - The placement.
 * @param placement.assembly - The assembly's root document node.
 * @param placement.instance - The placement's instance.
 * @returns The resolved rows, keyed by (instance, node, attribute).
 */
const placedOf = (
  names: readonly Addition<typeof SectionFeedbackName>[],
  declared: Context["declared"],
  placement: { readonly assembly: NodeId; readonly instance: NodeId },
): readonly (readonly [string, Addition<typeof SectionFeedbackRef>])[] =>
  names.map((name) => {
    const variable = resolveIn(declared, name.identifier, allowedOf(name.attribute, name.kind));

    return [
      keyOf([placement.instance, name.node, name.attribute]),
      {
        ...name,
        assembly: placement.assembly,
        baseType: variable.baseType,
        cardinality: variable.cardinality,
        declaration: variable.node,
        declarationKind: variable.declarationKind,
        instance: placement.instance,
      },
    ] as const;
  });

/**
 * Decide whether an instance is a placement `SectionScope` holds: a section document under a test,
 * or an included fragment under an item (spec reading 117). A fragment a section document places
 * resolves nothing yet, a known under-refusal reading 117 lists.
 *
 * @param root - The assembly's root instance.
 * @param instance - The instance.
 * @returns Whether its references resolve under it.
 */
const resolvesUnder = (root: InstanceRoot, instance: InstanceMember | InstanceRoot): boolean =>
  (root.assemblyKind === testKind && instance.rootKind === sectionKind) ||
  (root.assemblyKind === itemKind && instance.rootKind !== itemKind);

/**
 * Build a package's placements: one per instance of a section document under a test and of an
 * included fragment under an item, and under it each of the document's references of each class,
 * resolved among the assembly's declarations, a built-in to its type under the nil declaration,
 * and a name no allowed declaration holds to the nil declaration, which `declarationRef` refuses.
 *
 * @param input - The package's rows the placements read.
 * @param input.contexts - Every fragment's context variable references ({@link rowsOf}'s
 *   `SectionContextName`).
 * @param input.declarations - Every declaration of the package (Q5.08's `Declaration` rows).
 * @param input.feedbacks - Every section document's and fragment's feedback references
 *   ({@link rowsOf}'s `SectionFeedbackName`).
 * @param input.instances - Every assembly's root instance, its tree nested (Q5.13's
 *   `assembledRowsOf`).
 * @param input.prints - Every section document's and fragment's printed variable references
 *   ({@link rowsOf}'s `SectionPrintedName`).
 * @param input.templates - Every fragment's template variable references ({@link rowsOf}'s
 *   `SectionTemplateName`).
 * @returns The rows.
 */
export const sectionRowsOf = (input: {
  readonly contexts: Iterable<Addition<typeof SectionContextName>>;
  readonly declarations: Iterable<Addition<typeof Declaration>>;
  readonly feedbacks: Iterable<Addition<typeof SectionFeedbackName>>;
  readonly instances: Iterable<InstanceRoot>;
  readonly prints: Iterable<Addition<typeof SectionPrintedName>>;
  readonly templates: Iterable<Addition<typeof SectionTemplateName>>;
}): SectionRows => {
  const declared = Map.groupBy(input.declarations, ({ document }) => document);
  const classes = {
    contexts: Map.groupBy(input.contexts, ({ document }) => document),
    feedbacks: Map.groupBy(input.feedbacks, ({ document }) => document),
    prints: Map.groupBy(input.prints, ({ document }) => document),
    templates: Map.groupBy(input.templates, ({ document }) => document),
  };
  const scopes = new Map<string, Addition<typeof SectionScope>>();
  const resolved = {
    contexts: new Map<string, Addition<typeof SectionContextRef>>(),
    feedbacks: new Map<string, Addition<typeof SectionFeedbackRef>>(),
    prints: new Map<string, Addition<typeof SectionPrintedRef>>(),
    templates: new Map<string, Addition<typeof SectionTemplateRef>>(),
  };
  for (const root of input.instances) {
    for (const { assembly, instance } of instancesOf(root)) {
      if (resolvesUnder(root, instance)) {
        scopes.set(instance.id, { assembly, document: instance.document, instance: instance.id });

        const placement = { assembly, instance: instance.id };
        const scope = declared.get(assembly) ?? [];
        for (const name of ["contexts", "feedbacks", "prints", "templates"] as const) {
          for (const [key, row] of placedOf(
            classes[name].get(instance.document) ?? [],
            scope,
            placement,
          )) {
            resolved[name].set(key, row);
          }
        }
      }
    }
  }

  return {
    SectionContextRef: resolved.contexts,
    SectionFeedbackRef: resolved.feedbacks,
    SectionPrintedRef: resolved.prints,
    SectionScope: scopes,
    SectionTemplateRef: resolved.templates,
  };
};

/**
 * A package's bindings placed under each instance of an item's assembly, keyed by (instance, node,
 * attribute).
 */
export interface PlacedBindingRows {
  readonly ChoiceVariableName: ReadonlyMap<string, Addition<typeof ChoiceVariableName>>;
  readonly PlacedBinding: ReadonlyMap<string, Addition<typeof PlacedBinding>>;
  readonly PlacedBindingDeclaration: ReadonlyMap<string, Addition<typeof PlacedBindingDeclaration>>;
  readonly PlacedChoice: ReadonlyMap<string, Addition<typeof PlacedChoice>>;
  readonly PlacedHottext: ReadonlyMap<string, Addition<typeof PlacedHottext>>;
}

/**
 * Build each instance of an item's assembly's bindings (spec reading 117): under the item's own
 * instance and each fragment it places, every binding attribute of the instance's document,
 * resolved among the item's declarations as `BoundVariable` resolves an item's own, and carrying
 * the item's `adaptive`, and its {@link PlacedBindingDeclaration} where a response declaration of
 * the item holds the name: a name none holds has none, which "Binding declared" refuses. Under each
 * instance of every assembly, its document's choices and hottexts, which count among the
 * assembly's, and each identifier they bear as a {@link ChoiceVariableName} of the assembly's root
 * document, which "Choice not variable" holds to the root's declarations.
 *
 * @param input - The package's rows the bindings read.
 * @param input.adaptive - Every item's mode ({@link rowsOf}'s `ItemMode`).
 * @param input.choices - Every document's choices ({@link rowsOf}'s `Choice`).
 * @param input.declarations - Every declaration of the package (Q5.08's `Declaration` rows).
 * @param input.hottexts - Every document's hottexts ({@link rowsOf}'s `Hottext`).
 * @param input.instances - Every assembly's root instance, its tree nested (Q5.13's
 *   `assembledRowsOf`).
 * @param input.names - Every document's binding attributes ({@link rowsOf}'s `BindingName`).
 * @returns The rows.
 */
export const placedBindingRowsOf = (input: {
  readonly adaptive: Iterable<Addition<typeof ItemMode>>;
  readonly choices: Iterable<Addition<typeof Choice>>;
  readonly declarations: Iterable<Addition<typeof Declaration>>;
  readonly hottexts: Iterable<Addition<typeof Hottext>>;
  readonly instances: Iterable<InstanceRoot>;
  readonly names: Iterable<Addition<typeof BindingName>>;
}): PlacedBindingRows => {
  const declared = Map.groupBy(input.declarations, ({ document }) => document);
  const names = Map.groupBy(input.names, ({ document }) => document);
  const adaptive = new Map([...input.adaptive].map((row) => [row.document, row.adaptive] as const));
  const choicesByDocument = Map.groupBy(input.choices, ({ document }) => document);
  const hottextsByDocument = Map.groupBy(input.hottexts, ({ document }) => document);
  const placed = new Map<string, Addition<typeof PlacedBinding>>();
  const placedDeclarations = new Map<string, Addition<typeof PlacedBindingDeclaration>>();
  const choices = new Map<string, Addition<typeof PlacedChoice>>();
  const hottexts = new Map<string, Addition<typeof PlacedHottext>>();
  const named = new Map<string, Addition<typeof ChoiceVariableName>>();
  const roots = [...input.instances];
  for (const root of roots) {
    const nameOf = (identifier: string) => {
      named.set(keyOf([root.assembly, identifier]), {
        document: root.assembly,
        identifier,
        rootKind: root.assemblyKind,
      });
    };
    for (const { assembly, instance } of instancesOf(root)) {
      for (const { document, identifier, kind, node } of choicesByDocument.get(instance.document) ??
        []) {
        choices.set(keyOf([instance.id, node]), {
          assembly,
          document,
          identifier,
          instance: instance.id,
          kind,
          node,
        });
        nameOf(identifier);
      }

      for (const { document, identifier, node } of hottextsByDocument.get(instance.document) ??
        []) {
        hottexts.set(keyOf([instance.id, node]), {
          assembly,
          document,
          identifier,
          instance: instance.id,
          node,
        });
        nameOf(identifier);
      }
    }
  }

  for (const root of roots) {
    for (const { assembly, instance } of root.assemblyKind === itemKind ? instancesOf(root) : []) {
      for (const name of names.get(instance.document) ?? []) {
        const binding = {
          ...name,
          assembly,
          document: instance.document,
          instance: instance.id,
        };
        const key = keyOf([instance.id, name.node, name.attribute]);
        placed.set(key, { ...binding, adaptive: adaptive.get(assembly) ?? false });
        for (const variable of Option.toArray(
          responseIn(declared.get(assembly) ?? [], name.identifier),
        )) {
          placedDeclarations.set(key, {
            ...binding,
            baseType: variable.baseType,
            cardinality: variable.cardinality,
            declaration: variable.node,
            declarationKind: variable.declarationKind,
          });
        }
      }
    }
  }

  return {
    ChoiceVariableName: named,
    PlacedBinding: placed,
    PlacedBindingDeclaration: placedDeclarations,
    PlacedChoice: choices,
    PlacedHottext: hottexts,
  };
};
