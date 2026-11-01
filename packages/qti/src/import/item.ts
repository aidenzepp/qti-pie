/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The item document's rows: the document itself, the `qti-assessment-item` root and the elements
 * of its first milestone that no other module owns: the body, the prompt, the paragraph and the
 * image.
 *
 * The declarations, values, bindings, interactions, choices and processing are written by the
 * modules that read the {@link NodeIndex} this one returns.
 */
import { Effect, Option, Schema } from "effect";
import {
  collapse,
  kindOf,
  Rows,
  treeRows,
  typedAttribute,
  UnmodeledVocabulary,
} from "#qti/import/tree.ts";
import type { NodeIndex, WhiteSpace } from "#qti/import/tree.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import { Img, ImgHeight, ImgLongdesc, ImgWidth, P } from "#qti/schema/html.ts";
import { AssessmentItem, DeclaredAdaptive, ItemBody, Prompt } from "#qti/schema/item.ts";
import type { AttributeNameHandle, NodeKindHandle, SchemaVersionHandle } from "#qti/schema/node.ts";
import type { Element, XmlDocument } from "#qti/xml/tree.ts";

/**
 * An item the importer reads but whose bindings do not hold together.
 *
 * `rule` names the importer rule the item breaks and `detail` says which part of the item does.
 */
export class ItemRefusal extends Schema.TaggedError<ItemRefusal>()("ItemRefusal", {
  detail: Schema.String,
  rule: Schema.Literal("binding-declared"),
}) {}

/**
 * What {@link itemRows} needs to know about the document beside its tree.
 */
export interface ItemInput {
  readonly doc: XmlDocument;
  readonly packageId: string;
  readonly path: string;
  readonly resource: string;
  readonly resourceType: string;
  readonly version: SchemaVersionHandle;
}

/**
 * The value of the attribute `element` carries under `name` with no namespace, as read.
 */
const lexicalOf = (element: Element, name: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === name),
  ).pipe(Option.map((attribute) => attribute.value));

/**
 * Process one attribute of an element the way its whitespace class says, appending an
 * `AttributeLexical` row when processing changed it.
 *
 * @returns The processed value, `None` when the element does not carry the attribute, and the rows.
 */
const attributeOf = (
  rows: Rows,
  element: Element,
  node: { readonly id: string; readonly kind: NodeKindHandle },
  name: AttributeNameHandle,
  whiteSpace: WhiteSpace,
): { rows: Rows; value: Option.Option<string> } =>
  Option.match(lexicalOf(element, name), {
    onNone: () => ({ rows, value: Option.none<string>() }),
    onSome: (lexical) => {
      const typed = typedAttribute(rows, node.id, node.kind, name, lexical, whiteSpace);

      return { rows: typed.rows, value: Option.some(typed.value) };
    },
  });

/**
 * An attribute value whose column's pattern judges it at commit: the typed columns of booleans and
 * lengths are template-literal types, and the value read is a string until that pattern says it
 * fits, so the cast narrows only the type; a value the pattern refuses is refused there.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` is the column type the caller's row demands; the call site names it by inference.
const judgedLater = <T extends string>(value: string): T =>
  // SAFETY: the column's regex law judges the value at commit, which is the importer's refusal for it (spec 3.9, 4.5).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  value as T;

/**
 * Every element of `element`'s subtree beside its parent element, in document order.
 */
const withParents = (
  element: Element,
  parent: Option.Option<Element>,
): readonly (readonly [Element, Option.Option<Element>])[] => [
  [element, parent],
  ...element.children.flatMap((child) =>
    child.kind === "element" ? withParents(child, Option.some(element)) : [],
  ),
];

/**
 * Write the rows of an item document: its tree, its `Document` row with the identifier and title
 * rows, the item root and the body, prompt, paragraph and image rows under it.
 *
 * Every attribute passes through `typedAttribute` with its whitespace class: `identifier`,
 * `adaptive`, `time-dependent`, `src` and `longdesc` collapse, `title` replaces, and `alt`,
 * `height` and `width` are kept as read. `adaptive` takes its XSD default `false` when absent, and
 * a root that omits the required `time-dependent` takes `false` as well; the guards judge it.
 *
 * @param input - The decoded item and where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with this item's added, the node index of its tree and the document's id, which
 *   is the tree's; `UnmodeledVocabulary` for a root that is not `qti-assessment-item` in the ASI
 *   namespace, naming it, and for any element or attribute the registries do not model.
 */
export const itemRows = Effect.fn("import.itemRows")(function* itemRows(
  input: ItemInput,
  rows: Rows,
): Effect.fn.Return<
  { rows: Rows; nodes: NodeIndex; documentId: string },
  UnmodeledVocabulary | ItemRefusal
> {
  const { doc, packageId, version } = input;
  const { root } = doc;
  if (Option.getOrUndefined(kindOf(root, Option.none())) !== "qti-assessment-item") {
    return yield* new UnmodeledVocabulary({
      kind: "element",
      name: root.qname,
      parent: Option.none(),
    });
  }

  const documentId = crypto.randomUUID();
  const tree = yield* treeRows(
    doc,
    { charset: doc.charset, id: documentId, kind: "document", root: "item", version },
    rows,
  );
  const { nodes } = tree;
  let built = Rows.add(tree.rows, Document, [
    {
      id: documentId,
      package: packageId,
      path: input.path,
      resource: input.resource,
      resourceType: input.resourceType,
      root: "item",
      version,
    },
  ]);

  const rootNode = nodes.get(root);
  if (rootNode === undefined) {
    return yield* new ItemRefusal({
      detail: "The item's root element has no node.",
      rule: "binding-declared",
    });
  }

  const common = {
    document: documentId,
    package: packageId,
    resource: input.resource,
    root: "item",
  } as const;
  const identifier = attributeOf(built, root, rootNode, "identifier", "collapse");
  built = identifier.rows;
  built = Rows.add(
    built,
    DocumentIdentifier,
    Option.match(identifier.value, {
      onNone: () => [],
      onSome: (value) => [{ ...common, value }],
    }),
  );
  const title = attributeOf(built, root, rootNode, "title", "replace");
  built = title.rows;
  built = Rows.add(
    built,
    DocumentTitle,
    Option.match(title.value, {
      onNone: () => [],
      onSome: (value) => [{ ...common, collapsed: collapse(value), value }],
    }),
  );
  const adaptive = attributeOf(built, root, rootNode, "adaptive", "collapse");
  built = adaptive.rows;
  const timeDependent = attributeOf(built, root, rootNode, "time-dependent", "collapse");
  built = timeDependent.rows;
  built = Rows.add(built, AssessmentItem, [
    {
      adaptive: judgedLater(Option.getOrElse(adaptive.value, () => "false")),
      id: rootNode.id,
      timeDependent: judgedLater(Option.getOrElse(timeDependent.value, () => "false")),
    },
  ]);
  built = Rows.add(
    built,
    DeclaredAdaptive,
    Option.isSome(adaptive.value) ? [{ node: rootNode.id }] : [],
  );

  for (const [element, parent] of withParents(root, Option.none())) {
    const node = nodes.get(element);
    const parentNode = Option.flatMapNullishOr(parent, (above) => nodes.get(above));
    if (node === undefined) {
      continue;
    }

    if (node.kind === "qti-item-body" && Option.isSome(parentNode)) {
      built = Rows.add(built, ItemBody, [{ id: node.id, item: parentNode.value.id }]);
    } else if (node.kind === "qti-prompt" && Option.isSome(parentNode)) {
      built = Rows.add(built, Prompt, [{ id: node.id, parent: parentNode.value.id }]);
    } else if (node.kind === "p") {
      built = Rows.add(built, P, [{ id: node.id }]);
    } else if (node.kind === "img") {
      const src = attributeOf(built, element, node, "src", "collapse");
      built = src.rows;
      const longdesc = attributeOf(built, element, node, "longdesc", "collapse");
      built = longdesc.rows;
      const height = lexicalOf(element, "height");
      const width = lexicalOf(element, "width");
      built = Rows.add(built, Img, [
        {
          alt: Option.getOrElse(lexicalOf(element, "alt"), () => ""),
          id: node.id,
          src: Option.getOrElse(src.value, () => ""),
        },
      ]);
      built = Rows.add(
        built,
        ImgLongdesc,
        Option.match(longdesc.value, {
          onNone: () => [],
          onSome: (value) => [{ node: node.id, value }],
        }),
      );
      built = Rows.add(
        built,
        ImgHeight,
        Option.match(height, {
          onNone: () => [],
          onSome: (value) => [{ node: node.id, value: judgedLater(value) }],
        }),
      );
      built = Rows.add(
        built,
        ImgWidth,
        Option.match(width, {
          onNone: () => [],
          onSome: (value) => [{ node: node.id, value: judgedLater(value) }],
        }),
      );
    }
  }

  return { documentId, nodes, rows: built };
});
