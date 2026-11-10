/**
 * The React layer's projection with part replacements, and the hook every interaction's component
 * is built on (issue m3g-01): {@link ItemScope} holds one item's tree, which `renderTree` builds,
 * so the page shows the tree the core builds and no second copy of `render`'s steps;
 * {@link project} turns that tree into React, applying each React part replacement under the swap
 * invariant; and {@link useInteraction} projects one interaction's subtree with the state props and
 * reports each change of its response as a post would be read.
 *
 * A filled component is `(props) => useInteraction("<key>", props)`, plus whatever its kind needs
 * beyond that. This module imports no interaction's component, `#plate/react/item.tsx` or
 * `#plate/react/index.tsx`, since each component imports it and `Item` imports each component.
 *
 * @module
 */
import { Option, Result } from "effect";
import {
  cloneElement,
  createContext,
  createElement,
  Fragment,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode, Ref, RefCallback, RefObject } from "react";
import type { Configuration } from "#plate/configuration.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import {
  attributeOf,
  lists,
  partForSlot,
  resolveOverrides,
  rowFor,
  splitTokens,
} from "#plate/emit/parts.ts";
import type { InteractionKey, PartKey, PartName, PartRow, RowContext } from "#plate/emit/parts.ts";
import { applyPart, PartSwapRefused } from "#plate/emit/swap.ts";
import { decode, entryName } from "#plate/form/encoding.ts";
import type { Binding, DecodeOptions, Entry } from "#plate/form/encoding.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type { PartSpec } from "#plate/interactions/contract.ts";
import { interactionsIn, modules } from "#plate/model/interactions.ts";
import type { ResponseValue } from "#plate/model/values.ts";
import { postings } from "#plate/payload.ts";
import type { Redacted } from "#plate/payload.ts";
import type {
  InteractionParts,
  InteractionProps,
  PartComponent,
  PartOverrides,
  PartProps,
} from "#plate/react/contract.tsx";
import { attributeName, Notice, propsOf } from "#plate/react/parts.tsx";
import { renderTree } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";

/**
 * One interaction root of an item's tree, with the response it binds: where `Item` places that
 * interaction's component, and what `useInteraction` projects.
 */
export interface Placement {
  readonly key: InteractionKey;
  /**
   * The root's position among the tree's interaction roots, in document order, which finds the
   * same root in a tree built again with other values.
   */
  readonly ordinal: number;
  readonly response: string;
  readonly root: Element;
}

/**
 * One item as {@link ItemScope} holds it: what `renderTree` took, the tree it built, the React part
 * replacements, and each interaction root's {@link Placement}, by root.
 */
export interface Scope {
  readonly configuration: Configuration;
  readonly instance: string;
  readonly options: Omit<Options, "parts">;
  readonly parts: PartOverrides;
  readonly placements: ReadonlyMap<Element, Placement>;
  readonly redacted: Redacted;
  readonly tree: Element;
}

/**
 * The element a projection marks as its host: the root `Item` upgrades, or the root of the
 * interaction `useInteraction` listens to, with the ref that reaches its DOM node and the classes
 * merged onto it.
 */
export interface Host {
  readonly className?: string | undefined;
  readonly ref: Ref<HTMLElement>;
  readonly root: Element;
}

/**
 * What one projection of a tree applies: the React part replacements, the host it marks, and,
 * for `Item`, the component it places at each interaction root.
 */
export interface Projection {
  readonly host?: Host;
  readonly parts: PartOverrides;
  /**
   * Render the interaction at a root, in place of projecting it.
   *
   * @param placement The root and the response it binds.
   * @returns What stands at the root.
   */
  readonly place?: (placement: Placement) => ReactNode;
  readonly placements: ReadonlyMap<Element, Placement>;
}

/**
 * Where a list owner places a child: under a list element, whose children must stay `li`
 * elements, the owner's row, its tag and the child's position.
 */
interface ListParent {
  readonly count: number;
  readonly index: number;
  readonly row: PartRow;
  readonly tag: string;
}

/**
 * What a parent writes onto, or asks of, a child's root as it places it: the list joint rule's
 * `role="listitem"` under a list owner that is not a list, or the list it must stay an `li` of.
 */
interface Joint {
  readonly listParent?: ListParent;
  readonly role?: string;
}

/**
 * The `input` types whose `checked` attribute is their default state.
 */
const checkables: ReadonlySet<string> = new Set(["checkbox", "radio"]);

/**
 * The joint of a child no list owner places.
 */
const noJoint: Joint = {};

/**
 * The owners of the chrome's parts, whose roots are no interaction's.
 */
const chrome: ReadonlySet<string> = new Set(["item", "test-navigation"]);

/**
 * The tag classes whose parts hold text only, handed as text rather than as nodes: a React
 * `option` takes only strings as its children and a `textarea` takes its text as `defaultValue`.
 */
const textClasses: ReadonlySet<string> = new Set(["option", "textarea"]);

/**
 * The parts each interaction module owns, by owner.
 */
const moduleParts: ReadonlyMap<string, Readonly<Partial<Record<PartKey, PartSpec>>>> = new Map(
  Object.values(modules).map((module) => [module.owner, module.parts]),
);

/**
 * Tell whether a module's parts hold a part, so `partRow` can read it.
 *
 * @param parts The module's parts.
 * @param part The part key.
 * @returns Whether the module owns the part.
 */
const ownsPart = <P extends PartKey>(
  parts: Readonly<Partial<Record<PartKey, PartSpec>>>,
  part: P,
): parts is Readonly<Record<P, PartSpec>> => Object.hasOwn(parts, part);

/**
 * Name the part an element of the tree is, by its `data-slot` marker.
 *
 * @param node The element.
 * @returns The interaction and the part, or undefined for an element no part marks.
 */
const partOf = (node: Element): PartName | undefined => {
  const slot = node.attrs["data-slot"];

  return slot === undefined || slot === true ? undefined : Option.getOrUndefined(partForSlot(slot));
};

/**
 * Read the placement a part's row depends on from the element the core placed: the Notice's
 * position from its `div`, the StatusHeading's level from its tag, and the Choice's Prompt markup
 * from its `legend`.
 *
 * @param node The element.
 * @param name The part it is.
 * @returns The row context `rowFor` takes.
 */
const contextOf = (node: Element, name: PartName): RowContext => {
  if (name.interaction === "item" && name.part === "notice") {
    return { position: node.tag === "div" ? "flow" : "phrasing" };
  }

  if (name.interaction === "item" && name.part === "statusHeading") {
    return { headingLevel: Number(node.tag.slice(1)) };
  }

  if (name.interaction === "choice-interaction") {
    const first = node.children.find((child) => child.kind === "element");
    const legend =
      name.part === "root"
        ? first?.kind === "element" && first.tag === "legend"
        : node.tag === "legend";

    return { promptMarkup: legend ? "legend" : "labelledby" };
  }

  return {};
};

/**
 * Give the row of a part as the core placed it: an interaction module's through `partRow`, every
 * other through `rowFor` with the placement read from the element.
 *
 * @param node The element.
 * @param name The part it is.
 * @returns The part's row.
 */
const rowOf = (node: Element, name: PartName): PartRow => {
  const parts = moduleParts.get(name.interaction);

  return parts !== undefined && ownsPart(parts, name.part)
    ? partRow({ owner: name.interaction, parts }, name.part)
    : rowFor(name.interaction, name.part, contextOf(node, name));
};

/**
 * List the interaction roots under a node, in document order, each with its interaction's key.
 *
 * @param node The node.
 * @returns The roots and their keys.
 */
const rootsIn = (node: Node): readonly (readonly [Element, InteractionKey])[] => {
  if (node.kind === "text") {
    return [];
  }

  const name = partOf(node);
  const own =
    name !== undefined && name.part === "root" && !chrome.has(name.interaction)
      ? [[node, name.interaction] as const]
      : [];

  return [...own, ...node.children.flatMap(rootsIn)];
};

/**
 * Bind each interaction root of an item's tree to its interaction: the item body's interactions,
 * in document order, matched to the roots of their kind in the same order, since a root names no
 * response of its own.
 *
 * @param tree The item's tree.
 * @param redacted The item.
 * @returns Each root's placement, by root.
 */
const placementsOf = (tree: Element, redacted: Redacted): ReadonlyMap<Element, Placement> => {
  const interactions = interactionsIn(redacted.body);
  const taken = new Set<number>();

  return new Map(
    rootsIn(tree).flatMap(([root, key], ordinal) => {
      const index = interactions.findIndex(
        (interaction, at) => !taken.has(at) && `${interaction.kind}-interaction` === key,
      );
      const interaction = interactions[index];
      if (interaction === undefined) {
        return [];
      }

      taken.add(index);

      return [[root, { key, ordinal, response: interaction.response, root }] as const];
    }),
  );
};

/**
 * A part function that stands for a React replacement while its key is checked, never called.
 *
 * @returns Nothing: it is never called.
 */
const keyOnly = (): Element => h("div", {});

/**
 * Check the React part replacements' keys against the part table, as `render` checks its own.
 *
 * @param parts The replacements.
 * @throws {UnknownPart} For the first interaction or part the part table lacks, as `render`
 *   returns it; React reports a component's failure by a throw.
 */
const checkParts = (parts: PartOverrides): void => {
  const keys = Object.fromEntries(
    Object.entries(parts).map(([interaction, replacements]: [string, unknown]) => [
      interaction,
      Object.fromEntries(Object.keys(replacements ?? {}).map((part) => [part, keyOnly])),
    ]),
  );

  Result.getOrThrow(resolveOverrides(keys));
};

/**
 * Build one item's tree with the scope's inputs, some replaced, and refuse as `render` refuses.
 *
 * @param scope The item's inputs.
 * @param options The inputs that replace the scope's.
 * @returns The tree's root.
 * @throws {InvalidInstance
 *   | NotRedacted
 *   | OutputTooLarge
 *   | PartSwapRefused
 *   | InvalidHeadingLevel}
 *   The first refusal `renderTree` gives, since React reports a component's failure by a throw.
 */
const treeOf = (
  scope: Pick<Scope, "configuration" | "instance" | "options" | "redacted">,
  options: Omit<Options, "instance" | "parts"> = {},
): Element =>
  Result.getOrThrow(
    renderTree(scope.redacted, scope.configuration, {
      ...scope.options,
      ...options,
      instance: scope.instance,
    }),
  ).root;

/**
 * Give the replacement for the part an element is, when the projection's parts replace it.
 *
 * @param parts The replacements.
 * @param name The part.
 * @returns The replacement, or undefined.
 */
const replacementOf = (parts: PartOverrides, name: PartName): PartComponent | undefined => {
  const own: Readonly<Record<string, PartComponent | undefined>> | undefined =
    parts[name.interaction];

  return own?.[name.part];
};

/**
 * Write a joint and a host's classes onto a root's attributes: the joint's `role` over the root's,
 * and the host's classes after the root's own, each class once.
 *
 * @param attrs The root's attributes, as the core or the swap gave them.
 * @param joint What the parent writes onto the root.
 * @param className The host's classes, if the root is the host.
 * @returns The attributes as the page shows them.
 */
const jointed = (attrs: Attributes, joint: Joint, className?: string): Attributes => {
  const withRole = joint.role === undefined ? attrs : { ...attrs, role: joint.role };
  if (className === undefined || className === "") {
    return withRole;
  }

  const own = withRole["class"];
  const tokens = new Set([
    ...(own === undefined || own === true ? [] : splitTokens(own)),
    ...splitTokens(className),
  ]);

  return { ...withRole, class: [...tokens].join(" ") };
};

/**
 * Give the joints a list owner gives its children, by position: under a list element each child
 * must stay an `li`, and under any other element each child's root takes `role="listitem"`, as the
 * core's list joint rule does on either path.
 *
 * @param row The part's row.
 * @param tag The tag the part's root has after any swap.
 * @param count How many children it holds.
 * @returns Each child's joint, by position; no joint for a part that owns no list.
 */
const childJoints =
  (row: PartRow, tag: string, count: number) =>
  (index: number): Joint => {
    if (!row.listOwner) {
      return noJoint;
    }

    return lists.has(tag) ? { listParent: { count, index, row, tag } } : { role: "listitem" };
  };

/**
 * A host element's props as the projection writes them: each attribute in React's spelling, its
 * value a string or a boolean.
 */
type HostProps = ReturnType<typeof propsOf>;

/**
 * Tell whether an element is a radio button or a checkbox, whose `checked` attribute is its
 * default state.
 *
 * @param tag The element's tag.
 * @param attrs Its attributes.
 * @returns Whether it is an `input` of type `checkbox` or `radio`, in any case.
 */
const isCheckable = (tag: string, attrs: Attributes): boolean => {
  const type = attributeOf(attrs, "type");

  return (
    tag === "input" && type !== undefined && type !== true && checkables.has(type.toLowerCase())
  );
};

/**
 * Give an element's attributes as the React props the projection writes: React's spelling, with
 * `autofocus` left off, since React's `autoFocus` focuses the control when it mounts and the
 * layer never moves focus (WCAG 2.4.3); after a refused post the host moves focus itself.
 *
 * A radio button's or checkbox's `defaultChecked` and a `textarea`'s `defaultValue` are written
 * even when the core writes no state, as `false` and the empty string, because React updates
 * those defaults only while the prop is present: without it a re-render through the core with
 * another value would leave the old default standing in the markup.
 *
 * @param tag The element's tag.
 * @param attrs Its attributes.
 * @param children Its children, which give a `textarea` its `defaultValue`.
 * @returns The props.
 */
const projectedProps = (tag: string, attrs: Attributes, children: readonly Node[]): HostProps => {
  const { autoFocus: _autoFocus, ...props } = propsOf(h(tag, attrs, children));

  if (isCheckable(tag, attrs)) {
    return { ...props, defaultChecked: attributeOf(attrs, "checked") !== undefined };
  }

  return tag === "textarea" ? { defaultValue: "", ...props } : props;
};

/**
 * Give an element's attributes as the props a replacement receives: React's spelling, every value
 * a string or `true`.
 *
 * @param node The element.
 * @returns The props, without children.
 */
const partPropsOf = (node: Element): PartProps =>
  Object.fromEntries(
    Object.entries(projectedProps(node.tag, node.attrs, node.children)).map(([prop, value]) => [
      prop,
      value === true ? true : String(value),
    ]),
  );

/* oxlint-disable anti-slop/no-runtime-typeof, anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type -- From here to the matching enable, the helpers read what a host's replacement returned: React types an element's props, its type and a ref as unknown, so this is the boundary where that foreign tree is parsed, by `typeof` and `isValidElement`, into the neutral tree the core's swap checks. */

/**
 * The React props that write no HTML attribute, which a replacement's root keeps as it gave them.
 */
const reactOnly: ReadonlySet<string> = new Set([
  "suppressContentEditableWarning",
  "suppressHydrationWarning",
]);

/**
 * Read one React prop as the HTML attribute it writes.
 *
 * @param prop The prop's name.
 * @param value The prop's value.
 * @returns The attribute's value, `true` for a boolean attribute, or undefined for a prop that
 *   writes no attribute: a function, an object, `false`, `children` or a React-only prop.
 */
const attributeValue = (prop: string, value: unknown): string | true | undefined => {
  if (prop === "children" || reactOnly.has(prop)) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  if (typeof value === "boolean") {
    if (prop.startsWith("aria-") || prop.startsWith("data-")) {
      return String(value);
    }

    return value ? true : undefined;
  }

  return undefined;
};

/**
 * Read a replacement element's props as the HTML attributes they write.
 *
 * @param props The element's props.
 * @returns Its attributes.
 */
const attributesOf = (props: Readonly<Record<string, unknown>>): Attributes =>
  Object.fromEntries(
    Object.entries(props).flatMap(([prop, value]) => {
      const attribute = attributeValue(prop, value);

      return attribute === undefined ? [] : [[attributeName(prop), attribute] as const];
    }),
  );

/**
 * Keep the props of a replacement element that write no attribute: its handlers, its style
 * object, its `ref` and its React-only props, which the swapped root keeps beside the merged
 * attributes.
 *
 * @param props The element's props.
 * @returns Those props, without `children`.
 */
const otherPropsOf = (
  props: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> =>
  Object.fromEntries(
    Object.entries(props).filter(
      ([prop, value]) =>
        prop !== "children" &&
        (reactOnly.has(prop) ||
          (typeof value !== "string" &&
            typeof value !== "number" &&
            typeof value !== "bigint" &&
            typeof value !== "boolean")),
    ),
  );

/**
 * The props of a {@link Handed} marker.
 */
interface HandedProps {
  readonly index: number;
  readonly joint: Joint;
  readonly node: Node;
  readonly owner: Element;
  readonly projection: Projection;
}

/**
 * Stand for one node the core handed a swapped part, as a replacement places its children: it
 * projects the node, with the joint its parent gives it. The swap finds it by its `owner` and
 * `index` props, which survive React's `Children` helpers, so I2 reads which handed node each
 * marker is wherever the replacement put it.
 *
 * @param props The node, the swapped element that owns it, its position, its joint and the
 *   projection.
 * @param props.joint What the parent writes onto the node's root.
 * @param props.node The handed node.
 * @param props.projection The projection in force.
 * @returns The node as the projection renders it.
 */
const Handed = ({ joint, node, projection }: HandedProps): ReactNode =>
  // oxlint-disable-next-line eslint/no-use-before-define -- `project`, `Swap` and `Handed` are mutually recursive, as a swapped part holds the nodes it was handed; the call runs only after all three are defined.
  project(node, projection, joint);

/**
 * Read a React element's props, which React types as unknown.
 *
 * @param element The element.
 * @returns Its props.
 */
const propsOfElement = (element: ReactElement): Readonly<Record<string, unknown>> =>
  // SAFETY: a React element's props are always an object; React types them as unknown.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above.
  element.props as Readonly<Record<string, unknown>>;

/**
 * Tell whether an element is a {@link Handed} marker of a given swapped element.
 *
 * @param element The element.
 * @param owner The swapped element.
 * @returns Whether it is a marker `owner` handed its replacement.
 */
const isHanded = (element: ReactElement, owner: Element): element is ReactElement<HandedProps> =>
  element.type === Handed && propsOfElement(element)["owner"] === owner;

/**
 * Give the position among the handed nodes a {@link Handed} marker of a swapped element stands
 * for.
 *
 * @param element The element.
 * @param owner The swapped element.
 * @returns The position, or undefined when it is no marker of `owner`.
 */
const handedIndex = (element: ReactElement, owner: Element): number | undefined =>
  isHanded(element, owner) ? element.props.index : undefined;

/**
 * Name a component for a refusal's detail.
 *
 * @param type The element's type.
 * @returns Its display name or function name, or `component`.
 */
const componentName = (type: unknown): string => {
  if (typeof type === "function") {
    const named: { readonly displayName?: unknown; readonly name: string } = type;

    return typeof named.displayName === "string" ? named.displayName : named.name || "component";
  }

  return "component";
};

/**
 * Tell whether a React node is an iterable of nodes: an array or another iterable, which React
 * renders child by child.
 *
 * @param node The node.
 * @returns Whether it is iterable and not a string.
 */
const isNodes = (node: ReactNode): node is Iterable<ReactNode> =>
  typeof node === "object" && node !== null && Symbol.iterator in node;

/**
 * Read what a replacement placed below its root as the neutral tree, so the core's swap checks
 * read it: host elements as elements, texts as texts, each {@link Handed} marker as the node it
 * stands for, by identity, and any other component as an opaque element whose content the check
 * cannot see.
 *
 * @param node The React node.
 * @param owner The swapped element, whose markers stand for its handed nodes.
 * @param handed The nodes the core handed the part.
 * @returns The nodes, in order.
 */
const neutralOf = (node: ReactNode, owner: Element, handed: readonly Node[]): readonly Node[] => {
  if (node === null || node === undefined || typeof node === "boolean") {
    return [];
  }

  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") {
    return [text(String(node))];
  }

  if (isNodes(node)) {
    return Array.from(node, (child) => neutralOf(child, owner, handed)).flat();
  }

  if (!isValidElement(node)) {
    return [];
  }

  const props = propsOfElement(node);
  // SAFETY: children of a React element's props are React nodes; React types the props as unknown.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above.
  const children = props["children"] as ReactNode;
  if (node.type === Fragment) {
    return neutralOf(children, owner, handed);
  }

  const index = handedIndex(node, owner);
  if (index !== undefined) {
    const child = handed[index];

    return child === undefined ? [] : [child];
  }

  return typeof node.type === "string"
    ? // oxlint-disable-next-line eslint/no-use-before-define -- `neutralOf` and `neutralElement` are mutually recursive, as elements nest; the call runs only after both are defined.
      [neutralElement(node.type, props, owner, handed)]
    : [h(componentName(node.type), {}, [])];
};

/**
 * Read one host element a replacement returned as a neutral element: its attributes, and, for a
 * `textarea`, its `defaultValue` or `value` as its text.
 *
 * @param tag The element's tag.
 * @param props The element's props.
 * @param owner The swapped element.
 * @param handed The nodes the core handed the part.
 * @returns The element.
 */
const neutralElement = (
  tag: string,
  props: Readonly<Record<string, unknown>>,
  owner: Element,
  handed: readonly Node[],
): Element => {
  const { value: _value, ...attrs } = attributesOf(props);
  if (tag !== "textarea") {
    // SAFETY: children of a React element's props are React nodes.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above.
    return h(tag, attributesOf(props), neutralOf(props["children"] as ReactNode, owner, handed));
  }

  const content = props["defaultValue"] ?? props["value"];

  return h(tag, attrs, typeof content === "string" && content !== "" ? [text(content)] : []);
};

/**
 * Join the text of some nodes.
 *
 * @param nodes The nodes.
 * @returns Their characters, an element's included.
 */
const textOf = (nodes: readonly Node[]): string =>
  nodes.map((node) => (node.kind === "text" ? node.text : textOf(node.children))).join("");

/**
 * Read a replacement's result as the root the core's swap checks: one host element.
 *
 * @param returned What the replacement returned.
 * @param row The part's row, which names the part a refusal names.
 * @returns The element, or the refusal of a result that is not one host element.
 */
const replacementRoot = (
  returned: ReactNode,
  row: PartRow,
): Result.Result<ReactElement & { readonly type: string }, PartSwapRefused> => {
  if (isValidElement(returned) && typeof returned.type === "string") {
    // SAFETY: the type is checked a string above; TypeScript does not narrow a property's type.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above.
    return Result.succeed(returned as ReactElement & { readonly type: string });
  }

  const what = isValidElement(returned)
    ? `the component <${componentName(returned.type)}>, whose element the swap cannot check`
    : "no single element";

  return Result.fail(
    new PartSwapRefused({
      cause: "root-not-allowed",
      detail: `the replacement returned ${what}, and a React replacement returns exactly one element`,
      interaction: row.interaction,
      part: row.part,
    }),
  );
};

/**
 * Give the joints of the markers below a replacement's root, rebuilt where a joint applies.
 *
 * @param node The React node the replacement placed.
 * @param owner The swapped element.
 * @param joint Each handed child's joint, by position.
 * @returns The node with each marker of `owner` given its joint.
 */
const withJoints = (
  node: ReactNode,
  owner: Element,
  joint: (index: number) => Joint,
): ReactNode => {
  if (isNodes(node)) {
    return Array.from(node, (child) => withJoints(child, owner, joint));
  }

  if (!isValidElement(node)) {
    return node;
  }

  if (isHanded(node, owner)) {
    return cloneElement(node, { joint: joint(node.props.index) });
  }

  const props = propsOfElement(node);
  if (
    (typeof node.type !== "string" && node.type !== Fragment) ||
    props["children"] === undefined
  ) {
    return node;
  }

  // SAFETY: children of a React element's props are React nodes.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above.
  return cloneElement(node, undefined, withJoints(props["children"] as ReactNode, owner, joint));
};

/**
 * Tell whether a ref is a callback ref, which React calls with the element.
 *
 * @param ref The ref.
 * @returns Whether it is a function.
 */
const isRefCallback = (ref: unknown): ref is RefCallback<HTMLElement> => typeof ref === "function";

/**
 * Hand an element to a ref, as React hands one: a callback ref is called with it, and an object
 * ref holds it as its `current`.
 *
 * @param ref The ref: a callback, an object with `current`, or anything else, which is left alone.
 * @param element The element, or null when it unmounts.
 */
const setRef = (ref: unknown, element: HTMLElement | null): void => {
  if (isRefCallback(ref)) {
    ref(element);
  } else if (typeof ref === "object" && ref !== null && "current" in ref) {
    Object.assign(ref, { current: element });
  }
};

/**
 * Join two refs into one, so a swapped host root reaches both the host and the replacement's own
 * ref.
 *
 * @param own The replacement's ref, if it gave one.
 * @param host The host's ref.
 * @returns One ref.
 */
const joinedRefs = (own: unknown, host: Ref<HTMLElement>): Ref<HTMLElement> => {
  if (own === undefined || own === null) {
    return host;
  }

  const joined: RefCallback<HTMLElement> = (element) => {
    setRef(own, element);
    setRef(host, element);
  };

  return joined;
};

/* oxlint-enable anti-slop/no-runtime-typeof, anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type */

/**
 * Give the children a replacement receives: an `option`'s text as one string, which is all a React
 * `option` takes, and otherwise the {@link Handed} markers, none for a part handed none.
 *
 * @param row The part's row.
 * @param handed The nodes the core handed the part.
 * @param markers The markers that stand for them.
 * @returns The children, or undefined for none.
 */
const offeredChildrenOf = (
  row: PartRow,
  handed: readonly Node[],
  markers: readonly ReactNode[],
): ReactNode => {
  if (row.tagClass === "option" && handed.length > 0) {
    return textOf(handed);
  }

  return markers.length > 0 ? markers : undefined;
};

/**
 * The props of a {@link Swap}.
 */
interface SwapProps {
  readonly joint: Joint;
  readonly name: PartName;
  readonly node: Element;
  readonly projection: Projection;
  readonly replacement: PartComponent;
}

/**
 * Render one part through its React replacement, holding the swap invariant as the core's swap
 * does (`applyPart` in `#plate/emit/swap.ts`).
 *
 * The replacement receives the element's attributes in React's spelling and its children as
 * {@link Handed} markers (an `option`'s text as a string, a `textarea`'s as `defaultValue`), and is
 * called as a function, so the hooks it calls are this component's and it must be the same function
 * on every render. What it returns is read as the neutral tree and handed to `applyPart`, so I3
 * (the root's tag class), I2 (each handed child once, in order), the legend, list and
 * handed-content rules and I1 (the required attributes written over the root's) are the core's own;
 * then the merged attributes go onto the replacement's root, beside its handlers and other props.
 * Its root must be one host element: a component the swap cannot see into is refused, and handed
 * children placed inside a component are not found. A breach throws the core's `PartSwapRefused`,
 * since React reports a component's failure by a throw.
 *
 * @param props The element, the part it is, its joint, the projection and the replacement.
 * @param props.joint What the parent writes onto, or asks of, the part's root.
 * @param props.name The part.
 * @param props.node The element the core built for the part.
 * @param props.projection The projection in force.
 * @param props.replacement The React replacement.
 * @returns The replacement's root, merged.
 * @throws {PartSwapRefused} When the replacement breaks the swap invariant.
 */
const Swap = ({ joint, name, node, projection, replacement }: SwapProps): ReactNode => {
  const row = rowOf(node, name);
  const host = projection.host?.root === node ? projection.host : undefined;
  const handed = node.children;
  const givenText = textClasses.has(row.tagClass);
  const markers = givenText
    ? []
    : handed.map((child, index) =>
        createElement(Handed, {
          index,
          joint: noJoint,
          key: index,
          node: child,
          owner: node,
          projection,
        }),
      );
  const given = partPropsOf(node);
  const offeredChildren = offeredChildrenOf(row, handed, markers);
  // SAFETY: `PartProps` is the attributes and the children; TypeScript reads its index signature as
  // also typing `children`, so the one object that holds both needs the assertion.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above.
  const offered = (
    offeredChildren === undefined ? given : { ...given, children: offeredChildren }
  ) as PartProps;
  const root = Result.getOrThrow(replacementRoot(replacement(offered), row));
  const own = propsOfElement(root);
  const converted = neutralElement(root.type, own, node, handed);
  const checked =
    givenText &&
    handed.every((child) => child.kind === "text") &&
    textOf(converted.children) === textOf(handed)
      ? h(converted.tag, converted.attrs, handed)
      : converted;
  const required = Object.fromEntries(
    Object.entries(node.attrs).filter(([attribute, value]) => row.defaults[attribute] !== value),
  );
  const placed = Result.getOrThrow(applyPart(row, required, handed, () => checked));
  const parent = joint.listParent;
  if (parent !== undefined && lists.has(parent.tag) && placed.tag !== "li") {
    throw new PartSwapRefused({
      cause: "list-item",
      detail: `child ${String(parent.index + 1)} of ${String(parent.count)}, <${placed.tag}>, is a Choice root under a <${parent.tag}>, which holds only <li> children`,
      interaction: parent.row.interaction,
      part: parent.row.part,
    });
  }

  const props = {
    ...otherPropsOf(own),
    ...projectedProps(placed.tag, jointed(placed.attrs, joint, host?.className), placed.children),
    ref: host === undefined ? own["ref"] : joinedRefs(own["ref"], host.ref),
  };
  // SAFETY: children of a React element's props are React nodes.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above.
  const children = own["children"] as ReactNode;
  if (placed.tag === "textarea" || children === undefined) {
    return createElement(placed.tag, props);
  }

  return createElement(
    placed.tag,
    props,
    row.listOwner
      ? withJoints(children, node, childJoints(row, placed.tag, handed.length))
      : children,
  );
};

/**
 * Project a node of an item's tree to React, applying the projection's part replacements under the
 * swap invariant: each element to the element of its tag with its attributes in React's spelling,
 * a part the projection replaces through its replacement ({@link Swap}), and, for `Item`, each
 * interaction root through the component `Item` places there.
 *
 * @param node The node.
 * @param projection The replacements, the host and the placements.
 * @param joint What the node's parent writes onto its root; none by default.
 * @returns The node as React renders it.
 * @throws {PartSwapRefused} When a replacement breaks the swap invariant, from the {@link Swap}
 *   that renders it.
 */
export const project = (node: Node, projection: Projection, joint: Joint = noJoint): ReactNode => {
  if (node.kind === "text") {
    return node.text;
  }

  const placement = projection.placements.get(node);
  if (placement !== undefined && projection.place !== undefined) {
    return projection.place(placement);
  }

  const name = partOf(node);
  const replacement = name === undefined ? undefined : replacementOf(projection.parts, name);
  if (name !== undefined && replacement !== undefined) {
    return createElement(Swap, { joint, name, node, projection, replacement });
  }

  const host = projection.host?.root === node ? projection.host : undefined;
  const props = {
    ...projectedProps(node.tag, jointed(node.attrs, joint, host?.className), node.children),
    ref: host?.ref,
  };
  if (node.children.length === 0 || node.tag === "textarea") {
    return createElement(node.tag, props);
  }

  const joints =
    name === undefined
      ? () => noJoint
      : childJoints(rowOf(node, name), node.tag, node.children.length);

  return createElement(
    node.tag,
    props,
    ...node.children.map((child, index) => project(child, projection, joints(index))),
  );
};

/**
 * The options of a scope given none, one object so the tree is built once while none is given.
 */
const noOptions: Omit<Options, "parts"> = {};

/**
 * The part replacements of a scope given none, one object for the same reason as
 * {@link noOptions}.
 */
const noParts: PartOverrides = {};

/**
 * The item the nearest {@link ItemScope} holds, none outside one.
 */
const ScopeContext = createContext<Scope | undefined>(undefined);

/**
 * The interaction root `Item` placed the nearest component at, none elsewhere.
 */
const PlacementContext = createContext<Placement | undefined>(undefined);

/**
 * Hold one item for the interaction components inside: build its tree once through `renderTree`,
 * with the instance given and `options` (no core `parts`), and find each interaction root and the
 * response it binds. `Item` renders inside one; a test mounts a component inside one to reach its
 * controlled mode, which `Item` alone does not use. Inside it with no placement, `useInteraction`
 * takes the first interaction of its kind in document order bound to its response.
 *
 * @param props The item, its configuration, the instance, `render`'s options and the React part
 *   replacements.
 * @param props.children The components that read the item.
 * @param props.configuration The configuration `renderTree` takes.
 * @param props.instance The instance token the tree is built with, one `checkInstance` passes.
 * @param props.options `render`'s options but `instance` and `parts`.
 * @param props.parts The React part replacements, keyed as the core's `parts` option is.
 * @param props.redacted The item, as `redact` or `decodeRedacted` made it.
 * @returns The children, with the item in scope.
 * @throws {InvalidInstance
 *   | NotRedacted
 *   | OutputTooLarge
 *   | PartSwapRefused
 *   | InvalidHeadingLevel}
 *   The first refusal `renderTree` gives, since React reports a component's failure by a throw.
 * @throws {UnknownPart} For a replacement keyed by an interaction or part the part table lacks.
 */
export const ItemScope = ({
  children,
  configuration,
  instance,
  options = noOptions,
  parts = noParts,
  redacted,
}: {
  readonly children?: ReactNode;
  readonly configuration: Configuration;
  readonly instance: string;
  readonly options?: Omit<Options, "parts">;
  readonly parts?: PartOverrides;
  readonly redacted: Redacted;
}): ReactNode => {
  const scope = useMemo((): Scope => {
    const { parts: _core, ...rest }: Options = options;
    const tree = treeOf({ configuration, instance, options: rest, redacted });

    checkParts(parts);

    return {
      configuration,
      instance,
      options: rest,
      parts,
      placements: placementsOf(tree, redacted),
      redacted,
      tree,
    };
  }, [configuration, instance, options, parts, redacted]);

  return <ScopeContext value={scope}>{children}</ScopeContext>;
};

/**
 * Read the item the nearest {@link ItemScope} holds.
 *
 * @returns The scope, or undefined outside one.
 */
export const useItemScope = (): Scope | undefined => useContext(ScopeContext);

/**
 * Place a component at one interaction root, so the `useInteraction` it calls projects that root:
 * `Item` wraps each filled component in one.
 *
 * @param props The root and the component.
 * @param props.children The component placed there.
 * @param props.placement The root and the response it binds.
 * @returns The children, with the placement in scope.
 */
export const Placed = ({
  children,
  placement,
}: {
  readonly children?: ReactNode;
  readonly placement: Placement;
}): ReactNode => <PlacementContext value={placement}>{children}</PlacementContext>;

/**
 * Give the posting a response is read through, under the entry name its controls post under.
 *
 * @param redacted The item.
 * @param instance The instance token.
 * @param response The response's identifier.
 * @param name The entry name its controls post under.
 * @returns The binding and the decode options, or undefined for a response no posting reads.
 */
const postingOf = (
  redacted: Redacted,
  instance: string,
  response: string,
  name: string,
): { readonly binding: Binding; readonly options: DecodeOptions } | undefined => {
  const posting = postings(redacted, instance).find(({ identifier }) => identifier === response);

  return posting === undefined
    ? undefined
    : { binding: { ...posting.binding, name }, options: posting.options };
};

/**
 * Give the entries one control would post under a name, as the form data set reads it: a checked
 * radio button or checkbox, a text control's value, each selected option, each chosen file (one
 * empty file when none is chosen), and nothing for a disabled control or a button.
 *
 * @param control The control.
 * @param name The entry name.
 * @returns Its entries.
 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-form-data-set
 */
const entriesOf = (control: globalThis.Element, name: string): readonly Entry[] => {
  if (control.getAttribute("name") !== name || control.matches(":disabled")) {
    return [];
  }

  if (control instanceof HTMLSelectElement) {
    return [...control.selectedOptions].map((option) => [name, option.value] as const);
  }

  if (control instanceof HTMLTextAreaElement) {
    return [[name, control.value]];
  }

  if (!(control instanceof HTMLInputElement)) {
    return [];
  }

  switch (control.type) {
    case "button":
    case "image":
    case "reset":
    case "submit": {
      return [];
    }
    case "checkbox":
    case "radio": {
      return control.checked ? [[name, control.value]] : [];
    }
    case "file": {
      const files = [...(control.files ?? [])];

      return files.length === 0
        ? [[name, new File([], "")]]
        : files.map((file) => [name, file] as const);
    }
    default: {
      return [[name, control.value]];
    }
  }
};

/**
 * Give the entries the controls under an interaction's root would post under its entry name, in
 * document order.
 *
 * @param root The interaction's root.
 * @param name The entry name.
 * @returns The entries.
 */
const entriesUnder = (root: HTMLElement, name: string): readonly Entry[] =>
  [...root.querySelectorAll("input, select, textarea")].flatMap((control) =>
    entriesOf(control, name),
  );

/**
 * Key a list of entries, so two reads of the same controls compare equal.
 *
 * @param entries The entries.
 * @returns A string that differs exactly when the entries' values differ.
 */
const keyOf = (entries: readonly Entry[]): string =>
  JSON.stringify(
    entries.map(([, value]) =>
      value instanceof Blob ? [value instanceof File ? value.name : "", value.size] : value,
    ),
  );

/**
 * Tell whether an element of the tree is a control whose state the candidate changes: an `input`
 * other than a hidden or a file input, a `textarea` or an `option`.
 *
 * @param tag The element's tag.
 * @param type Its `type`, lower case, for an `input`.
 * @returns Whether its state is the candidate's.
 */
const holdsState = (tag: string, type: string): boolean =>
  tag === "textarea" ||
  tag === "option" ||
  (tag === "input" && type !== "hidden" && type !== "file");

/**
 * List the controls of a tree whose state the candidate changes, in document order.
 *
 * @param node The tree's node.
 * @returns The controls.
 */
const statefulIn = (node: Node): readonly Element[] => {
  if (node.kind === "text") {
    return [];
  }

  const type = attributeOf(node.attrs, "type");
  const own = holdsState(
    node.tag,
    type === undefined || type === true ? "text" : type.toLowerCase(),
  )
    ? [node]
    : [];

  return [...own, ...node.children.flatMap(statefulIn)];
};

/**
 * Set every control under an interaction's root to the state the tree it was rendered from gives:
 * a controlled interaction shows its `value`, not what the candidate's last action left. The tree
 * is read, not the DOM's default attributes, since React leaves a default standing when its prop
 * goes away (an `option`'s `selected` is set as a property only).
 *
 * @param element The interaction's root.
 * @param tree The interaction's root in the tree it was rendered from.
 */
const showTree = (element: HTMLElement, tree: Element): void => {
  const states = statefulIn(tree);
  const controls = [...element.querySelectorAll("input, option, textarea")].filter((control) =>
    holdsState(control.localName, control instanceof HTMLInputElement ? control.type : ""),
  );

  for (const [index, control] of controls.entries()) {
    const state = states[index];
    if (state === undefined) {
      return;
    }

    if (control instanceof HTMLOptionElement) {
      control.selected = attributeOf(state.attrs, "selected") !== undefined;
    } else if (control instanceof HTMLTextAreaElement) {
      const shown = textOf(state.children);
      if (control.value !== shown) {
        control.value = shown;
      }
    } else if (control instanceof HTMLInputElement) {
      const value = attributeOf(state.attrs, "value");
      if (control.type === "checkbox" || control.type === "radio") {
        control.checked = attributeOf(state.attrs, "checked") !== undefined;
      } else if (control.value !== (value === true || value === undefined ? "" : value)) {
        control.value = value === true || value === undefined ? "" : value;
      }
    }
  }
};

/**
 * Tell whether a DOM node is a hidden input or holds one.
 *
 * @param node The node.
 * @returns Whether it is an `input[type=hidden]` or an element holding one.
 */
const holdsHidden = (node: globalThis.Node): boolean =>
  node instanceof HTMLInputElement
    ? node.type === "hidden"
    : node instanceof HTMLElement && node.querySelector('input[type="hidden"]') !== null;

/**
 * Tell whether a DOM mutation touched a hidden input, the wire a runtime interaction writes its
 * response into without dispatching an event.
 *
 * @param record The mutation.
 * @returns Whether it changed a hidden input's attributes, or added or removed one.
 */
const touchesHidden = (record: MutationRecord): boolean =>
  record.type === "attributes"
    ? holdsHidden(record.target)
    : [...record.addedNodes, ...record.removedNodes].some(holdsHidden);

/**
 * The latest props a listener reads: whether the interaction is controlled and its change
 * callback.
 */
interface Latest {
  readonly controlled: boolean;
  readonly onValueChange: ((value: ResponseValue) => void) | undefined;
  readonly root: Element;
}

/**
 * Listen for each change of an interaction's response: after a control's `input` or `change` event
 * and after a hidden input under the root changes, read the entries its controls would post and,
 * when they differ from the last read, decode them and report the value. A controlled interaction's
 * controls are set back to the tree it was rendered from before the report.
 *
 * @param element The interaction's root.
 * @param posting The binding and decode options its response is read through.
 * @param seen The key of the entries last read, which the listener updates.
 * @param latest The latest props.
 * @returns The listener's teardown.
 */
const listen = (
  element: HTMLElement,
  posting: { readonly binding: Binding; readonly options: DecodeOptions },
  seen: RefObject<string | undefined>,
  latest: RefObject<Latest>,
): (() => void) => {
  const check = (): void => {
    const entries = entriesUnder(element, posting.binding.name);
    if (keyOf(entries) === seen.current) {
      return;
    }

    const decoded = decode(entries, posting.binding, posting.options);
    if (latest.current.controlled) {
      showTree(element, latest.current.root);
    }

    seen.current = keyOf(entriesUnder(element, posting.binding.name));
    if (Result.isSuccess(decoded)) {
      latest.current.onValueChange?.(decoded.success);
    }
  };
  const observer = new MutationObserver((records) => {
    if (records.some(touchesHidden)) {
      check();
    }
  });

  element.addEventListener("input", check);
  element.addEventListener("change", check);
  observer.observe(element, {
    attributeFilter: ["disabled", "name", "type", "value"],
    attributes: true,
    childList: true,
    subtree: true,
  });

  return () => {
    element.removeEventListener("input", check);
    element.removeEventListener("change", check);
    observer.disconnect();
  };
};

/**
 * Project one interaction and report each change of its response: the subtree of the tree the
 * scope holds, or, when the state props ask for another name, value or disabled state, of a tree
 * built again through `renderTree` with them.
 *
 * `defaultValue` is the value the controls mount with and is read once; `value`, when given, is
 * the value they show on every render, so a control the candidate changes is set back to it until
 * the host passes the new value. A change is read the way a post is read (`postings`, then `decode`
 * over the entries the interaction's controls would post), once per change, after a control's
 * `input` or `change` event and after a hidden input under the root changes, since the runtime
 * writes hidden inputs and dispatches no event. Entries that do not decode report nothing.
 *
 * @param props The placement, the scope and the interaction's props.
 * @param props.placement The root and the response it binds.
 * @param props.scope The item.
 * @param props.state The interaction's props: its state props, `className` merged onto the root's
 *   classes, and `parts` merged over the scope's for its kind.
 * @returns The interaction's root, projected.
 * @throws {UnknownPart} For a part the interaction's `parts` names that its kind lacks.
 */
export const InteractionHost = ({
  placement,
  scope,
  state,
}: {
  readonly placement: Placement;
  readonly scope: Scope;
  readonly state: InteractionProps<InteractionKey>;
}): ReactNode => {
  const ref = useRef<HTMLElement>(null);
  const { key, ordinal, response } = placement;
  const [initial] = useState(() => state.defaultValue);
  const shown = state.value ?? initial;
  const controlled = state.value !== undefined;
  const names = scope.options.names ?? {};
  const values = scope.options.values ?? {};
  const scopeName = names[response] ?? entryName(scope.instance, response);
  const name = state.name ?? scopeName;
  const scopeDisabled = scope.options.disabled ?? false;
  const disabled = state.disabled ?? scopeDisabled;
  const own = shown !== values[response] || name !== scopeName || disabled !== scopeDisabled;
  const root = useMemo(() => {
    if (!own) {
      return placement.root;
    }

    const { [response]: _shown, ...others } = values;
    const tree = treeOf(scope, {
      disabled,
      names: { ...names, [response]: name },
      values: shown === undefined ? others : { ...others, [response]: shown },
    });

    return rootsIn(tree)[ordinal]?.[0] ?? placement.root;
  }, [disabled, name, names, ordinal, own, placement.root, response, scope, shown, values]);
  const parts = useMemo((): PartOverrides => {
    if (state.parts === undefined) {
      return scope.parts;
    }

    const interactionParts: InteractionParts<InteractionKey> = state.parts;

    checkParts({ [key]: interactionParts });

    const inScope: InteractionParts<InteractionKey> | undefined = scope.parts[key];

    return { ...scope.parts, [key]: { ...inScope, ...interactionParts } };
  }, [key, scope.parts, state.parts]);
  const posting = useMemo(
    () => postingOf(scope.redacted, scope.instance, response, name),
    [name, response, scope.instance, scope.redacted],
  );
  const latest = useRef<Latest>({ controlled, onValueChange: state.onValueChange, root });
  const seen = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    latest.current = { controlled, onValueChange: state.onValueChange, root };

    const element = ref.current;
    if (element === null) {
      return;
    }

    if (controlled) {
      showTree(element, root);
    }

    seen.current = keyOf(entriesUnder(element, name));
  });

  useEffect(() => {
    const element = ref.current;

    return element === null || posting === undefined
      ? undefined
      : listen(element, posting, seen, latest);
  }, [posting]);

  return project(root, {
    host: { className: state.className, ref, root },
    parts,
    placements: new Map(),
  });
};

/**
 * Project one interaction of the item in scope, with its state props, as every interaction's
 * component does: `(props) => useInteraction("choice-interaction", props)` is a filled Choice.
 *
 * Inside an `Item`, at the root `Item` placed the component for, it projects that root; inside an
 * {@link ItemScope} with no placement, the first `key` interaction in document order bound to
 * `responseIdentifier`. `defaultValue` (or none) is the state the controls mount with; `value`,
 * when given, the state they show on every render, re-rendered through the core; `name` the
 * entry name they post under; `disabled` disables them; `className` is merged onto the root's
 * classes; `parts` is merged over the item's for `key`; and `onValueChange` is called with the
 * response's new value, as `decode` reads the entries the controls would post, once per change.
 * Outside an item, or for a response the item binds no `key` interaction to, it renders the
 * item's notice naming `qti-<key>`, as a stub does, and never throws for that.
 *
 * @example
 *   export const Choice = (props: InteractionProps<"choice-interaction">) =>
 *     useInteraction("choice-interaction", props);
 *
 * @param key The interaction's key.
 * @param props The interaction's props.
 * @returns The interaction as React renders it, or the notice.
 * @throws {InvalidInstance
 *   | NotRedacted
 *   | OutputTooLarge
 *   | PartSwapRefused
 *   | InvalidHeadingLevel}
 *   The first refusal `renderTree` gives when the state props build the tree again.
 * @throws {UnknownPart} For a part `props.parts` names that `key` lacks.
 * @throws {PartSwapRefused} For a replacement that breaks the swap invariant.
 */
export const useInteraction = <I extends InteractionKey>(
  key: I,
  props: InteractionProps<I>,
): ReactNode => {
  const scope = useContext(ScopeContext);
  const placed = useContext(PlacementContext);
  if (scope === undefined) {
    return <Notice feature={`qti-${key}`} />;
  }

  const placement =
    placed !== undefined && placed.key === key && placed.response === props.responseIdentifier
      ? placed
      : [...scope.placements.values()].find(
          (candidate) => candidate.key === key && candidate.response === props.responseIdentifier,
        );

  return placement === undefined ? (
    <Notice feature={`qti-${key}`} locale={scope.configuration.locale} />
  ) : (
    <InteractionHost placement={placement} scope={scope} state={props} />
  );
};
