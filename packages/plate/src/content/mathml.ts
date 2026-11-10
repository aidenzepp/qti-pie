/**
 * MathML (I-18, issue m3e-05): a `math` element of the item body is read as the tree of MathML
 * elements the author wrote and rendered as MathML in the page, where the engines lay it out
 * natively and a screen reader voices and brailles it (WCAG 1.1.1 and 1.3.1).
 *
 * The walks call the module's steps in this order: the verdict hands each MathML island to
 * `check`, which gives no reason, so a document holding MathML is built; the body walk hands each
 * `math` to `normalise`, which rewrites every deprecated `mfenced` into the `mrow` and `mo`
 * elements MathML 3 defines it as equivalent to (section 3.3.8), then to `parse`, which reads the
 * tree and checks it once against the MathML 3 Recommendation's structural rules
 * (`#plate/content/mathml-validity.ts`, issue m3e-05b), refusing the document at the first defect;
 * `redact` keeps the node whole; `copy` makes the payload node; and `render` writes the tree as the
 * HTML parser reads a `math` element and its descendants, in the MathML namespace.
 *
 * What this module does not do, each the ruling of a reading or of another issue:
 *
 * - It judges only the validity rules `#plate/content/mathml-validity.ts` lists, the reading "MathML
 *   validity is the MathML 3 Recommendation" enforced where unambiguous. The rules the reading
 *   records as limits stay unchecked: `indenttarget` as a reference, the cells a `rowspan` or
 *   `columnspan` covers, a space inside an `mpadded` length, `mglyph`'s `src` and `alt` as
 *   required, and every rule that turns on what an expression means (a `sum`'s or `product`'s last
 *   argument, the coordinate names of `divergence`, `grad`, `curl` and `laplacian`, `definitionURL`
 *   and `cd` naming a definition). The ids a `share` or an `xref` may name are the island's own.
 *   Every other content model of the MathML XSD (a child count, an attribute's enumeration) is not
 *   walked, as the structural validator leaves MathML unwalked.
 * - It adds no `aria-label` from `alttext`, which is kept as written: an ARIA label on MathML
 *   overrides the braille a screen reader generates from the formula (the proposed reading filed
 *   with issue m3e-05).
 * - It neither rewrites nor styles `menclose`: MathML 3 defines no equivalent for it, so MathML Core
 *   renders it as an `mrow` (the proposed reading filed with issue m3e-05).
 * - It keeps a `cn` of type `hexdouble` as written, its 16 hexadecimal digits in either case (the
 *   R6-hexdouble ruling in `docs/spec-readings.md`).
 * - It substitutes no template variable into an `mi` or `ci` (`math-variable` is another issue's) and
 *   renders content and elementary MathML as the tree holds them (issue m5-08).
 *
 * This is a browser module: the emitter reaches it, so it value-imports from `effect` only
 * `Option` and `Result` (ruling OD-6), and builds its Schema from the kit the codec hands it.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Schema } from "effect";
import type { RedactedJson } from "#plate/codec/redacted.ts";
import type {
  BodyContentModule,
  ContentCopyKit,
  ContentRenderKit,
} from "#plate/content/contract.ts";
import { checkMathml } from "#plate/content/mathml-validity.ts";
import { attr, el, mathmlNamespace, text as sourceText } from "#plate/document/source.ts";
import type { SourceAttribute, SourceChild, SourceElement } from "#plate/document/source.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Node } from "#plate/emit/node.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { ParseContext } from "#plate/interactions/contract.ts";
import type { BodyNode } from "#plate/model/item.ts";
import type { PayloadNode } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The MathML element MathML content is read from.
 */
const element = "math";

/**
 * An attribute of a MathML element as written: one in no namespace, by its local name. Namespace
 * declarations and attributes of other namespaces are not part of the tree.
 */
export interface MathAttribute {
  readonly name: string;
  readonly value: string;
}

/**
 * A run of character data in a MathML element, as written.
 */
export interface MathText {
  readonly kind: "text";
  readonly text: string;
}

/**
 * A MathML element as written: its local name, its attributes and its children, each text or an
 * element. An element of another namespace below MathML is kept the same way, by its local name,
 * as the HTML parser reads it where it sits; validity is issue m3e-05b's.
 *
 * @template C The node an `annotation-xml`'s content is held as, which differs between the model,
 *   the payload and the JSON form.
 */
export interface MathElement<C> {
  readonly attributes: readonly MathAttribute[];
  readonly children: readonly MathChild<C>[];
  readonly kind: "element";
  readonly local: string;
}

/**
 * An `annotation-xml` of a `semantics` element: the one place beneath MathML where QTI elements
 * are admitted (the reading "QTI elements are admitted inside `m:annotation-xml`, and nowhere else
 * beneath MathML"), so its children are read as the body walk reads the item body, a
 * `qti-printed-variable` or an HTML `p` among them as it reads them anywhere, and emitted the same
 * way.
 *
 * @template C The node the content is held as.
 */
export interface MathAnnotationXml<C> {
  readonly attributes: readonly MathAttribute[];
  readonly content: readonly C[];
  readonly kind: "annotation-xml";
}

/**
 * A child of a MathML element: text, an element, or an `annotation-xml`.
 *
 * @template C The node an `annotation-xml`'s content is held as.
 */
export type MathChild<C> = MathAnnotationXml<C> | MathElement<C> | MathText;

/**
 * The model node of a `math` element in the item body: the `math` element as written, an
 * `annotation-xml`'s content as body nodes.
 */
export interface MathNode {
  readonly attributes: readonly MathAttribute[];
  readonly children: readonly MathChild<BodyNode>[];
  readonly kind: "element";
  readonly local: string;
}

/**
 * The payload node of a `math` element: the model node with an `annotation-xml`'s content copied
 * into payload nodes, which only `render` reads.
 */
export interface MathPayload {
  readonly attributes: readonly MathAttribute[];
  readonly children: readonly MathChild<PayloadNode>[];
  readonly kind: "element";
  readonly local: string;
}

/**
 * A body node in the redacted item's JSON form, which an `annotation-xml`'s content is written as.
 */
type BodyNodeJson = RedactedJson["body"][number];

/**
 * The JSON form of {@link MathNode} in a redacted item: the same tree, an `annotation-xml`'s
 * content in the body's JSON form.
 */
export interface MathJson {
  readonly attributes: readonly MathAttribute[];
  readonly children: readonly MathChild<BodyNodeJson>[];
  readonly kind: "element";
  readonly local: string;
}

/**
 * Report whether a source child is an element.
 *
 * @param child The child.
 * @returns Whether it is an element.
 */
const isElement = (child: SourceChild): child is SourceElement => child.kind === "element";

/**
 * Report whether a source element is one MathML element, by local name.
 *
 * @param source The element.
 * @param local The local name.
 * @returns Whether the element is in the MathML namespace with that name.
 */
const isMathml = (source: SourceElement, local: string): boolean =>
  source.namespace === mathmlNamespace && source.local === local;

/**
 * Read the value of an attribute in no namespace, or a default when the element writes none.
 *
 * @param source The element.
 * @param name The attribute's local name.
 * @param fallback The value when the element writes no such attribute.
 * @returns The value as written, or `fallback`.
 */
const attributeOr = (source: SourceElement, name: string, fallback: string): string =>
  source.attributes.find((attribute) => attribute.namespace === "" && attribute.local === name)
    ?.value ?? fallback;

/**
 * The attributes of `mfenced` that its expanded form consumes; every other attribute it carries
 * stays on the outer `mrow`, so an `id`, a `class` or a style attribute the author set keeps its
 * element.
 */
const fencedAttributes: ReadonlySet<string> = new Set(["close", "open", "separators"]);

/**
 * Construct an `mo` of an expanded `mfenced`: a fence or a separator, as MathML 3 section 3.3.8
 * marks them.
 *
 * @param role `fence` for the opening and closing fences, `separator` for a separator.
 * @param value The operator's character.
 * @returns The `mo`, carrying `fence="true"` or `separator="true"`.
 */
const operator = (role: "fence" | "separator", value: string): SourceElement =>
  el("mo", [attr(role, "true")], [sourceText(value)], mathmlNamespace);

/**
 * Rewrite an `mfenced` into the expanded form MathML 3 section 3.3.8 defines it as equivalent to:
 * an `mrow` holding an `mo` with the `open` value (`(` by default), the arguments, and an `mo`
 * with the `close` value (`)` by default). Two or more arguments are grouped in an inner `mrow`,
 * each but the last followed by an `mo` taken in turn from the characters of `separators` (`,`
 * by default), white space in it ignored, the last one repeated for further arguments, and none
 * when it is empty; one argument stands alone between the fences, and none leaves the two fences.
 *
 * The arguments are the element's element children, each rewritten in turn; the character data
 * between them, which MathML's element content does not hold, is not an argument.
 *
 * @param source The `mfenced` element.
 * @returns Its expanded form.
 * @see https://www.w3.org/TR/MathML3/chapter3.html#presm.mfenced
 */
const expandFenced = (source: SourceElement): SourceElement => {
  const separators = attributeOr(source, "separators", ",").match(/\S/gu) ?? [];
  const kept = source.attributes.filter(
    (attribute) => !(attribute.namespace === "" && fencedAttributes.has(attribute.local)),
  );
  const separated = source.children
    .filter(isElement)
    // oxlint-disable-next-line eslint/no-use-before-define -- the rewrite is recursive: an argument of an `mfenced` may hold another, and the two functions are read only when called.
    .map(normaliseElement)
    .flatMap((argument, index) => {
      const separator =
        index === 0 ? undefined : separators.at(Math.min(index, separators.length) - 1);

      return separator === undefined ? [argument] : [operator("separator", separator), argument];
    });
  const fenced = separated.length > 1 ? [el("mrow", [], separated, mathmlNamespace)] : separated;

  return el(
    "mrow",
    kept,
    [
      operator("fence", attributeOr(source, "open", "(")),
      ...fenced,
      operator("fence", attributeOr(source, "close", ")")),
    ],
    mathmlNamespace,
  );
};

/**
 * Rewrite a MathML element and its descendants into the form `parse` reads: each `mfenced`, at any
 * depth, expanded ({@link expandFenced}); every other element kept, its element children
 * rewritten in turn.
 *
 * @param source The element.
 * @returns The element with no `mfenced` below it.
 */
const normaliseElement = (source: SourceElement): SourceElement => {
  if (isMathml(source, "mfenced")) {
    return expandFenced(source);
  }

  const children = source.children.map((child) =>
    isElement(child) ? normaliseElement(child) : child,
  );

  return children.every((child, index) => child === source.children[index])
    ? source
    : { ...source, children };
};

/**
 * Read the attributes of a source element the tree keeps: those in no namespace, as written.
 *
 * @param attributes The element's attributes.
 * @returns The attributes kept, in document order.
 */
const attributesOf = (attributes: readonly SourceAttribute[]): readonly MathAttribute[] =>
  attributes.flatMap((attribute) =>
    attribute.namespace === "" ? [{ name: attribute.local, value: attribute.value }] : [],
  );

/**
 * Read the children of a MathML element into the tree: text as itself, an `annotation-xml` with
 * its content read as body nodes through the kit, any other element with its own children read
 * the same way. An entity reference the reader kept unexpanded has no place in the tree and is
 * dropped; the verdict leaves a document holding one unchecked, so no item built from an accepted
 * document holds one.
 *
 * @param source The element whose children are read.
 * @param context The parse context of the `math` element.
 * @returns The children, in document order, or the first refusal the body walk gave an
 *   `annotation-xml`'s content.
 */
const readChildren = (
  source: SourceElement,
  context: ParseContext,
): Result.Result<readonly MathChild<BodyNode>[], Refusal> =>
  Result.map(
    Result.all(
      source.children.flatMap((child): readonly Result.Result<MathChild<BodyNode>, Refusal>[] => {
        if (child.kind === "text") {
          return [Result.succeed({ kind: "text", text: child.text })];
        }

        if (child.kind === "entity") {
          return [];
        }

        if (isMathml(child, "annotation-xml")) {
          return [
            Result.map(context.read.nodes(child), (content) => ({
              attributes: attributesOf(child.attributes),
              content,
              kind: "annotation-xml",
            })),
          ];
        }

        return [
          Result.map(readChildren(child, context), (children) => ({
            attributes: attributesOf(child.attributes),
            children,
            kind: "element",
            local: child.local,
          })),
        ];
      }),
    ),
    (children) => children,
  );

/**
 * Rewrite the content of every `annotation-xml` in a tree, keeping everything else as it is.
 *
 * @template A The content nodes read.
 * @template B The content nodes written.
 * @param node The element.
 * @param content The rewrite of an `annotation-xml`'s content.
 * @returns The element with each `annotation-xml`'s content rewritten.
 */
const mapContent = <A, B>(
  node: MathElement<A>,
  content: (nodes: readonly A[]) => readonly B[],
): MathElement<B> => ({
  ...node,
  children: node.children.map((child): MathChild<B> => {
    switch (child.kind) {
      case "annotation-xml": {
        return { ...child, content: content(child.content) };
      }
      case "element": {
        return mapContent(child, content);
      }
      case "text": {
        return child;
      }
      default: {
        return child satisfies never;
      }
    }
  }),
});

/**
 * The content of every `annotation-xml` in a tree, in document order.
 *
 * @template C The content nodes.
 * @param node The element.
 * @returns The content nodes, flattened.
 */
const contentOf = <C>(node: MathElement<C>): readonly C[] =>
  node.children.flatMap((child) => {
    switch (child.kind) {
      case "annotation-xml": {
        return child.content;
      }
      case "element": {
        return contentOf(child);
      }
      case "text": {
        return [];
      }
      default: {
        return child satisfies never;
      }
    }
  });

/**
 * An attribute name that names an event handler, which the serialiser refuses on any element
 * (`EventHandlerAttribute` in `#plate/emit/serialise.ts`), so the render leaves it out rather than
 * lose the page to it; plate runs no script of an item.
 */
const eventHandlerName = /^on/iu;

/**
 * Write a tree's attributes as the output tree holds them: each as written, in document order, but
 * for an event-handler attribute ({@link eventHandlerName}).
 *
 * @param attributes The attributes.
 * @returns The output attributes.
 */
const outputAttributes = (attributes: readonly MathAttribute[]): Attributes =>
  Object.fromEntries(
    attributes
      .filter(({ name }) => !eventHandlerName.test(name))
      .map(({ name, value }) => [name, value]),
  );

/**
 * Render the children of a MathML payload element: text as itself, an element with its children,
 * an `annotation-xml` with its content emitted through the kit as body content.
 *
 * @param children The children.
 * @param kit The render kit.
 * @returns The output nodes, or the first refusal of a part swap in an `annotation-xml`'s content.
 */
const renderChildren = (
  children: readonly MathChild<PayloadNode>[],
  kit: ContentRenderKit,
): Result.Result<readonly Node[], PartSwapRefused> =>
  Result.map(
    Result.all(
      children.map((child): Result.Result<Node, PartSwapRefused> => {
        switch (child.kind) {
          case "annotation-xml": {
            return Result.map(kit.nodes(child.content), (content) =>
              h("annotation-xml", outputAttributes(child.attributes), content),
            );
          }
          case "element": {
            return Result.map(renderChildren(child.children, kit), (nodes) =>
              h(child.local, outputAttributes(child.attributes), nodes),
            );
          }
          case "text": {
            return Result.succeed(text(child.text));
          }
          default: {
            return child satisfies never;
          }
        }
      }),
    ),
    (nodes) => nodes,
  );

/**
 * The attributes a `math` element renders with: its own as written, and `dir="ltr"` when it writes
 * no `dir`, since a formula's direction starts at its `math` whatever the HTML around it says (the
 * reading "A MathML formula's direction starts at its `m:math`"; WCAG 1.3.2).
 *
 * @param attributes The `math` element's attributes.
 * @returns The output attributes.
 */
const mathAttributes = (attributes: readonly MathAttribute[]): Attributes => {
  const written = outputAttributes(attributes);

  return Object.hasOwn(written, "dir") ? written : { ...written, dir: "ltr" };
};

/**
 * The MathML module (I-18, issue m3e-05): `math` read as written, `mfenced` expanded, rendered as
 * MathML. It judges no validity (issue m3e-05b), adds no `aria-label` from `alttext`, and neither
 * rewrites nor styles `menclose`.
 */
export const mathmlModule: BodyContentModule<typeof element, MathNode, MathPayload, MathJson> = {
  /**
   * Give no reason for any island: the document is built, and the validity of its MathML is
   * issue m3e-05b's.
   */
  check: () => [],
  /**
   * The content of every `annotation-xml`, which the render writes through the kit, so the
   * heading shift reads it.
   */
  content: contentOf,
  /**
   * Copy the node, each `annotation-xml`'s content into payload nodes through the kit.
   */
  copy: (node: MathNode, kit: ContentCopyKit): MathPayload => mapContent(node, kit.nodes),
  element,
  feature: ["I-18"],
  implemented: true,
  namespace: mathmlNamespace,
  /**
   * Expand every `mfenced` below the `math` element, at any depth ({@link expandFenced}); a `math`
   * holding none is given back as it is.
   */
  normalise: normaliseElement,
  /**
   * Read the `math` element into its tree, its marks recorded once, and check the tree against the
   * MathML 3 Recommendation's structural rules ({@link checkMathml}, issue m3e-05b) before giving
   * it: the first defect refuses the document.
   */
  parse: (source, context) => {
    context.read.markElement(source);

    return Result.flatMap(readChildren(source, context), (children) => {
      const node: MathNode = {
        attributes: attributesOf(source.attributes),
        children,
        kind: "element",
        local: source.local,
      };

      return Option.match(checkMathml(node, context.read, context.path), {
        onNone: () => Result.succeed(node),
        onSome: (refusal) => Result.fail(refusal),
      });
    });
  },
  /**
   * The tree's codec, recursive through its children, an `annotation-xml`'s content through the
   * body's codec.
   */
  payloadSchema: ({ BodyNodes, Schema: schema }) => {
    const Attribute = schema.Struct({ name: schema.String, value: schema.String });
    const Attributes = schema.Array(Attribute);
    const Text = schema.Struct({ kind: schema.Literal("text"), text: schema.String });
    const AnnotationXml = schema.Struct({
      attributes: Attributes,
      content: BodyNodes,
      kind: schema.Literal("annotation-xml"),
    });
    const Element: Schema.Codec<MathNode, MathJson> = schema.Struct({
      attributes: Attributes,
      children: schema.Array(
        // oxlint-disable-next-line eslint/no-use-before-define -- the tree is recursive; the suspended reference is read only after `Child` is defined.
        schema.suspend((): Schema.Codec<MathChild<BodyNode>, MathChild<BodyNodeJson>> => Child),
      ),
      kind: schema.Literal("element"),
      local: schema.String,
    });
    const Child = schema.Union([AnnotationXml, Element, Text]);

    return Element;
  },
  placement: "body",
  /**
   * Keep the node, each `annotation-xml`'s content walked through the kit; nothing is withheld.
   */
  redact: (node, kit) => Option.some(mapContent(node, kit.nodes)),
  /**
   * Write the tree: the `math` element with its attributes as written and its direction
   * ({@link mathAttributes}), its descendants as MathML local names, which the serialiser writes
   * as the HTML parser reads them, in the MathML namespace, and an `annotation-xml`'s content
   * through the kit. No `aria-label` and no class is added.
   */
  render: (payload, _state, kit) =>
    Result.map(renderChildren(payload.children, kit), (children) =>
      h(element, mathAttributes(payload.attributes), children),
    ),
};
