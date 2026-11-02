/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` (the typed-or-record choice of a declaration and a binding) and `ShapeHandle` (a geometric shape) are the column and roster names the declaration, binding and `Coords` relations fix; neither is a structure. */

/**
 * What the interaction builders share: the binding, copy, marker, coordinate and ownership writers
 * every interaction family writes through, and the entry point that runs the six family builders.
 *
 * The family builders of `interactions/*.ts` read the elements of one item and write the arm rows
 * of the interaction kinds they own; each takes an {@link InteractionContext} and the rows so far.
 */
import type { Relation, uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import { associateRows } from "#qti/import/interactions/associate.ts";
import { gapRows } from "#qti/import/interactions/gap.ts";
import { hotRows } from "#qti/import/interactions/hot.ts";
import { orderRows } from "#qti/import/interactions/order.ts";
import { otherRows } from "#qti/import/interactions/other.ts";
import { textRows } from "#qti/import/interactions/text.ts";
import { ItemRefusal, replace, Rows, typedAttribute } from "#qti/import/tree.ts";
import type { NodeIndex, UnmodeledVocabulary, WhiteSpace } from "#qti/import/tree.ts";
import { ChoiceTemplateRef } from "#qti/schema/choices.ts";
import type { BoundHandle, ShapeHandle } from "#qti/schema/content/rosters.ts";
import { entryOf } from "#qti/schema/content/xsd-inventory.ts";
import type { BaseType, DeclarationShape, TypedCardinality } from "#qti/schema/declaration.ts";
import {
  GapMatchBinding,
  InteractionBinding,
  RecordBinding,
  TypedBinding,
} from "#qti/schema/interaction.ts";
import { NodeKind } from "#qti/schema/node.ts";
import type { AncestryHandle, AttributeNameHandle, NodeKindHandle } from "#qti/schema/node.ts";
import {
  Coords,
  CoordsCircle,
  CoordsDefault,
  CoordsEllipse,
  CoordsPoly,
  CoordsRect,
} from "#qti/schema/shapes.ts";
import type { Element } from "#qti/xml/tree.ts";

/**
 * The variable a declaration names, as the bindings of an interaction copy it.
 */
export interface DeclaredVariable {
  readonly baseType: Option.Option<(typeof BaseType.handles)[number]>;
  readonly cardinality: Option.Option<(typeof TypedCardinality.handles)[number]>;
  readonly id: string;
  readonly shape: (typeof DeclarationShape.handles)[number];
}

/**
 * What the builders need to know about the item beside its tree: the effective `adaptive` lexical
 * of its `qti-assessment-item`, which every binding copies.
 */
export interface ItemFacts {
  readonly adaptive: string;
}

/**
 * The identity of an element of the tree: its node id and its kind.
 */
export interface NodeRef {
  readonly id: string;
  readonly kind: NodeKindHandle;
}

/**
 * The attributes of one element, read through {@link typedAttribute} under the whitespace class its
 * kind's inventory entry gives each.
 *
 * `rows` is the rows so far with the `AttributeLexical` rows the reads produced, and `written` is
 * the set of attribute names the element carries, which a DTD default counts into.
 */
export interface AttributeReader {
  readonly read: (name: AttributeNameHandle) => Option.Option<string>;
  readonly rows: () => Rows;
  readonly written: () => ReadonlySet<string>;
}

/**
 * A relation of one `node` column: the marker that says the source wrote a defaulted attribute.
 */
export type MarkerRelation = Relation<string, { readonly node: typeof uuid }, readonly ["node"]>;

/**
 * Everything one family builder receives beside the rows.
 */
export interface InteractionContext {
  /**
   * The variables the item's declarations name, by identifier.
   */
  readonly declarations: ReadonlyMap<string, DeclaredVariable>;
  /**
   * The id of the item's document, which is also its tree's id.
   */
  readonly documentId: string;
  readonly item: ItemFacts;
  /**
   * The node each element of the tree became.
   */
  readonly nodes: NodeIndex;
  /**
   * The item's root element.
   */
  readonly root: Element;
  readonly shared: Shared;
}

/**
 * The shared writers, as the family builders receive them.
 */
export interface Shared {
  readonly attributes: typeof attributeReader;
  readonly bindingRows: typeof bindingRows;
  readonly coordsRows: typeof coordsRows;
  readonly gapMatchBindingRow: typeof gapMatchBindingRow;
  readonly markers: typeof markers;
  readonly maxBoundOf: typeof maxBoundOf;
  readonly maxCountDefault: typeof maxCountDefault;
  readonly nearestInteraction: typeof nearestInteraction;
  readonly templateRef: typeof templateRef;
  readonly typedCopy: typeof typedCopy;
}

/**
 * The value of the attribute `element` carries under `name` with no namespace, as read.
 */
const lexicalOf = (element: Element, name: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((found) => found.namespace === "" && found.local === name),
  ).pipe(Option.map((found) => found.value));

/**
 * The whitespace class of an attribute of `kind`: the class its inventory entry gives it, and
 * `preserve` for a `union` type or a name the entry does not list, which have no class to apply.
 */
const whiteSpaceOf = (kind: NodeKindHandle, name: AttributeNameHandle): WhiteSpace => {
  const found = entryOf(kind).pipe(
    Option.flatMapNullishOr((entry) =>
      entry.attributes.find((attribute) => attribute.name === name),
    ),
  );

  return Option.match(found, {
    onNone: () => "preserve",
    onSome: ({ whiteSpace }) => (whiteSpace === "union" ? "preserve" : whiteSpace),
  });
};

/**
 * Read the attributes of `element`, one at a time, each through `typedAttribute` under the class of
 * its kind.
 *
 * @param rows - The rows so far.
 * @param element - The element whose attributes are read.
 * @param node - The element's node id and kind.
 * @returns The reader; its `rows` hold an `AttributeLexical` row for each read whose processing
 *   changed the value.
 */
export const attributeReader = (rows: Rows, element: Element, node: NodeRef): AttributeReader => {
  let built = rows;

  return {
    read: (name) =>
      Option.map(lexicalOf(element, name), (lexical) => {
        const typed = typedAttribute(
          built,
          node.id,
          node.kind,
          name,
          lexical,
          whiteSpaceOf(node.kind, name),
        );
        built = typed.rows;

        return typed.value;
      }),
    rows: () => built,
    written: () =>
      new Set(element.attributes.flatMap((found) => (found.namespace === "" ? [found.local] : []))),
  };
};

/**
 * The non-negative integer a lexical form writes. A form that is not one reads as 0: the lexical
 * column beside it carries the form and its pattern refuses it at commit.
 */
const naturalOf = (lexical: string): bigint =>
  /^\+?[0-9]+$/u.test(lexical) ? BigInt(lexical) : 0n;

/**
 * The value of a typed `<attr>N` column.
 *
 * @param lexical - The attribute as the source wrote it, `None` when it is absent.
 * @param fallback - The value the schema defaults an absent attribute to.
 * @returns The integer the lexical form writes, 0 for a form that is no natural number, and
 *   `fallback` when the attribute is absent.
 */
export const typedCopy = (lexical: Option.Option<string>, fallback: bigint): bigint =>
  Option.match(lexical, { onNone: () => fallback, onSome: naturalOf });

/**
 * Whether a `max-choices` bounds the choice count of an order interaction.
 *
 * @param maxChoicesN - The typed `max-choices`, 0 when the attribute is absent.
 * @returns `unlimited` for 0 and `bounded` for any other count.
 */
export const maxBoundOf = (maxChoicesN: bigint): BoundHandle =>
  maxChoicesN === 0n ? "unlimited" : "bounded";

/**
 * The kinds whose count is their `max-choices`, with the count an absent attribute reads as.
 */
const maxChoicesDefaults: Readonly<Partial<Record<NodeKindHandle, bigint>>> = {
  "qti-choice-interaction": 1n,
  "qti-hotspot-interaction": 1n,
  "qti-hottext-interaction": 1n,
  "qti-position-object-interaction": 1n,
  "qti-select-point-interaction": 0n,
};

/**
 * The kinds whose count is their `max-associations`; an absent attribute reads as 1.
 */
const maxAssociationsKinds: ReadonlySet<NodeKindHandle> = new Set([
  "qti-associate-interaction",
  "qti-gap-match-interaction",
  "qti-graphic-associate-interaction",
  "qti-match-interaction",
]);

/**
 * The `maxCount` of an interaction's typed binding.
 *
 * The count is `max-choices` for choice, hottext, hotspot and position-object (1 where absent) and
 * select-point (0 where absent, which is unlimited), and `max-associations` for associate, match,
 * graphic-associate and gap-match (1 where absent). The other kinds have no count rule, and their
 * bindings write 1: the always-multiple and always-ordered kinds are `BindingFit` rows alone.
 *
 * @param kind - The interaction's kind.
 * @param attributes - The interaction's attributes by name, as read, absent ones left out.
 * @returns The count to write.
 */
export const maxCountDefault = (
  kind: NodeKindHandle,
  attributes: ReadonlyMap<string, string>,
): bigint => {
  const choices = maxChoicesDefaults[kind];
  if (choices !== undefined) {
    return typedCopy(Option.fromNullishOr(attributes.get("max-choices")), choices);
  }

  return maxAssociationsKinds.has(kind)
    ? typedCopy(Option.fromNullishOr(attributes.get("max-associations")), 1n)
    : 1n;
};

/**
 * Write the marker of each defaulted attribute the source wrote.
 *
 * @param rows - The rows so far.
 * @param relationByName - The marker relation of each defaulted attribute, by attribute name.
 * @param node - The id of the element that carries the attributes.
 * @param present - The names of the attributes the source wrote.
 * @returns The rows with one marker row for each named attribute in `present`.
 */
export const markers = (
  rows: Rows,
  relationByName: Readonly<Record<string, MarkerRelation>>,
  node: string,
  present: ReadonlySet<string>,
): Rows => {
  let built = rows;
  for (const [name, relation] of Object.entries(relationByName)) {
    if (present.has(name)) {
      built = Rows.add(built, relation, [{ node }]);
    }
  }

  return built;
};

/**
 * Write the coordinates of one hotspot-like element: its `Coords` row and the arm row of its shape.
 *
 * @param rows - The rows so far.
 * @param node - The id of the element that carries the `coords` attribute.
 * @param ownerKind - The element's own kind, which the row's owner copy repeats.
 * @param shape - The element's shape.
 * @param lexical - The `coords` attribute as read.
 * @returns The rows with the value stored after `replace`, an `AttributeLexical` row where that
 *   changed it, and the arm of `shape`.
 */
export const coordsRows = (
  rows: Rows,
  node: string,
  ownerKind: NodeKindHandle,
  shape: ShapeHandle,
  lexical: string,
): Rows => {
  const value = replace(lexical);
  const lexicalRows = typedAttribute(rows, node, ownerKind, "coords", lexical, "replace").rows;
  const withCoords = Rows.add(lexicalRows, Coords, [{ node, ownerKind, shape, value }]);
  const fact = [{ node, value }];
  switch (shape) {
    case "circle": {
      return Rows.add(withCoords, CoordsCircle, fact);
    }
    case "default": {
      return Rows.add(withCoords, CoordsDefault, fact);
    }
    case "ellipse": {
      return Rows.add(withCoords, CoordsEllipse, fact);
    }
    case "poly": {
      return Rows.add(withCoords, CoordsPoly, fact);
    }
    case "rect": {
      return Rows.add(withCoords, CoordsRect, fact);
    }
    default: {
      return shape satisfies never;
    }
  }
};

/**
 * The interaction kinds: every node kind named for an interaction.
 */
const interactionKinds: ReadonlySet<NodeKindHandle> = new Set(
  NodeKind.handles.filter((handle) => handle.endsWith("-interaction")),
);

/**
 * The parent of each indexed element, by identity, derived from the children of the indexed
 * elements; kept per index so the walk of one tree is read once.
 */
const parentsOf = (() => {
  const known = new WeakMap<NodeIndex, ReadonlyMap<Element, Element>>();

  return (nodes: NodeIndex): ReadonlyMap<Element, Element> => {
    const found = known.get(nodes);
    if (found !== undefined) {
      return found;
    }

    const parents = new Map<Element, Element>();
    for (const parent of nodes.keys()) {
      for (const child of parent.children) {
        if (child.kind === "element") {
          parents.set(child, parent);
        }
      }
    }

    known.set(nodes, parents);

    return parents;
  };
})();

/**
 * The nearest interaction that encloses an element, of whatever kind.
 *
 * The family builders decide what to write from the result: a choice's `interaction` owner copy,
 * a gap's enclosing gap-match at any depth, and a hottext's owner row exactly when the kind is
 * `qti-hottext-interaction`.
 *
 * @param nodes - The node index of the tree.
 * @param node - The element whose enclosing interaction is wanted.
 * @returns The nearest ancestor element whose kind is an interaction kind, with its node id;
 *   `None` when no ancestor is one, and when `node` is not in the tree.
 */
export const nearestInteraction = (nodes: NodeIndex, node: Element): Option.Option<NodeRef> => {
  const parents = parentsOf(nodes);
  let above = parents.get(node);
  while (above !== undefined) {
    const indexed = nodes.get(above);
    if (indexed !== undefined && interactionKinds.has(indexed.kind)) {
      return Option.some({ id: indexed.id, kind: indexed.kind });
    }

    above = parents.get(above);
  }

  return Option.none();
};

/**
 * An attribute value whose column's pattern judges it at commit: the typed columns of booleans are
 * template-literal types, and the value read is a string until that pattern says it fits, so the
 * cast narrows only the type; a value the pattern refuses is refused there.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` is the column type the caller's row demands; the call site names it by inference.
const judgedLater = <T extends string>(value: string): T =>
  // SAFETY: the column's regex law judges the value at commit, which is the importer's refusal for it (spec 3.9, 4.5).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  value as T;

/**
 * Write one interaction's binding to the response variable it names.
 *
 * @param rows - The rows so far.
 * @param node - The id of the interaction element.
 * @param document - The id of the item's document.
 * @param kind - The interaction's kind.
 * @param responseIdentifier - The interaction's `response-identifier`.
 * @param declaration - The variable the identifier names, `None` when no declaration names it.
 * @param ancestry - The ancestry the interaction's node sits in.
 * @param adaptive - The item's effective `adaptive` lexical form.
 * @param maxCount - The count the typed binding holds, from {@link maxCountDefault}.
 * @returns The rows with the `InteractionBinding` and its `TypedBinding` or `RecordBinding`;
 *   `ItemRefusal` for a `response-identifier` that no declaration of the document names, since no
 *   type can be copied to the binding.
 */
export const bindingRows = Effect.fn("import.bindingRows")(function* bindingRows(
  rows: Rows,
  node: string,
  document: string,
  kind: NodeKindHandle,
  responseIdentifier: string,
  declaration: Option.Option<DeclaredVariable>,
  ancestry: AncestryHandle,
  adaptive: string,
  maxCount: bigint,
): Effect.fn.Return<Rows, ItemRefusal> {
  if (Option.isNone(declaration)) {
    return yield* new ItemRefusal({
      detail: `The ${kind} names the response variable "${responseIdentifier}", which no declaration of this item declares. Declare it with a qti-response-declaration, or correct the response-identifier.`,
      rule: "binding-declared",
    });
  }

  const declared = declaration.value;
  const built = Rows.add(rows, InteractionBinding, [
    {
      adaptive: judgedLater(adaptive),
      ancestry,
      document,
      interactionKind: kind,
      node,
      responseIdentifier,
      shape: declared.shape,
    },
  ]);
  if (declared.shape === "record") {
    return Rows.add(built, RecordBinding, [{ interactionKind: kind, node }]);
  }

  return Option.isSome(declared.baseType) && Option.isSome(declared.cardinality)
    ? Rows.add(built, TypedBinding, [
        {
          baseType: declared.baseType.value,
          cardinality: declared.cardinality.value,
          document,
          interactionKind: kind,
          maxCount,
          node,
          responseIdentifier,
        },
      ])
    : built;
});

/**
 * Write a gap-match interaction's binding to its typed variable.
 *
 * @param rows - The rows so far.
 * @param node - The id of the gap-match interaction.
 * @param declaration - The variable the interaction's `response-identifier` names.
 * @returns The rows with the `GapMatchBinding` holding the variable's cardinality; unchanged for a
 *   record variable and for one with no cardinality, which have no typed binding to bound.
 */
export const gapMatchBindingRow = (
  rows: Rows,
  node: string,
  declaration: DeclaredVariable,
): Rows =>
  declaration.shape === "typed" && Option.isSome(declaration.cardinality)
    ? Rows.add(rows, GapMatchBinding, [{ cardinality: declaration.cardinality.value, node }])
    : rows;

/**
 * Write the template variable a choice takes its identifier from.
 *
 * @param rows - The rows so far.
 * @param node - The id of the choice element.
 * @param document - The id of the item's document.
 * @param identifier - The choice's `template-identifier`.
 * @param declarations - The variables the item's declarations name, by identifier.
 * @returns The rows with the `ChoiceTemplateRef` holding the type the declaration has; whether that
 *   declaration is a template one is the row's law to judge. `ItemRefusal` for an identifier that
 *   no typed declaration of the document names, since no type can be copied to the reference.
 */
export const templateRef = Effect.fn("import.templateRef")(function* templateRef(
  rows: Rows,
  node: string,
  document: string,
  identifier: string,
  declarations: ReadonlyMap<string, DeclaredVariable>,
): Effect.fn.Return<Rows, ItemRefusal> {
  const declared = declarations.get(identifier);
  if (
    declared === undefined ||
    Option.isNone(declared.baseType) ||
    Option.isNone(declared.cardinality)
  ) {
    return yield* new ItemRefusal({
      detail: `The template-identifier "${identifier}" names no typed variable of this item. Declare it with a qti-template-declaration that has a base-type and a cardinality, or correct the template-identifier.`,
      rule: "binding-declared",
    });
  }

  return Rows.add(rows, ChoiceTemplateRef, [
    {
      baseType: declared.baseType.value,
      cardinality: declared.cardinality.value,
      document,
      identifier,
      node,
    },
  ]);
});

/**
 * The shared writers, handed to every family builder.
 */
const shared: Shared = {
  attributes: attributeReader,
  bindingRows,
  coordsRows,
  gapMatchBindingRow,
  markers,
  maxBoundOf,
  maxCountDefault,
  nearestInteraction,
  templateRef,
  typedCopy,
};

/**
 * The rows of every interaction of an item, written by the six family builders in turn.
 *
 * @param root - The item's root element.
 * @param nodes - The node index of the item's tree.
 * @param documentId - The id of the item's document.
 * @param declarations - The variables the item's declarations name, by identifier.
 * @param item - What the builders need to know about the item.
 * @param rows - The rows so far.
 * @returns The rows with every interaction's arm, binding, owner copy and attribute rows;
 *   `UnmodeledVocabulary` and `ItemRefusal` as the builders raise them.
 */
export const interactionRows = Effect.fn("import.interactionRows")(function* interactionRows(
  root: Element,
  nodes: NodeIndex,
  documentId: string,
  declarations: ReadonlyMap<string, DeclaredVariable>,
  item: ItemFacts,
  rows: Rows,
): Effect.fn.Return<Rows, UnmodeledVocabulary | ItemRefusal> {
  const ctx: InteractionContext = { declarations, documentId, item, nodes, root, shared };
  let built = rows;
  built = yield* orderRows(ctx, built);
  built = yield* associateRows(ctx, built);
  built = yield* gapRows(ctx, built);
  built = yield* hotRows(ctx, built);
  built = yield* textRows(ctx, built);
  built = yield* otherRows(ctx, built);

  return built;
});
