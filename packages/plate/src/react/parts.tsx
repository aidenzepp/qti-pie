/**
 * The React layer's core pieces: {@link useParts}, the projection of the neutral tree to React;
 * {@link useUpgrade}, the runtime's mount; {@link Notice}, the item's notice every stub renders;
 * and the stub marker, {@link markStub} and {@link isStub}, which names the pieces still stubs.
 * `Item` lives in `#plate/react/item.tsx`, and the projection that applies part replacements in
 * `#plate/react/interaction.tsx` (issue m3g-01).
 *
 * @module
 */
import { createElement, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import type { InteractionKey } from "#plate/emit/parts.ts";
import { message } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { InteractionComponent, UseParts, UseUpgrade } from "#plate/react/contract.tsx";
import { upgrade } from "#plate/runtime.dom.ts";

/**
 * The pieces of the React layer that are still stubs, as {@link markStub} marked them. A weak set,
 * so a mark keeps no component alive.
 */
const stubs = new WeakSet<object>();

/**
 * Mark a piece of the React layer as a stub: one that renders the item's notice, or fails at mount,
 * until its issue fills it. The issue that fills it drops the mark by replacing the stub, so
 * {@link isStub} names exactly the pieces still to fill, and the gate's stub case reads its roster
 * from the mark (issue m3g-01).
 *
 * @example
 *   export const Status = markStub(({ configuration }: StatusProps) => <Notice … />);
 *
 * @param component The stub.
 * @returns The same component, marked.
 */
export const markStub = <C extends object>(component: C): C => {
  stubs.add(component);

  return component;
};

/**
 * Tell whether a value is a piece of the React layer that {@link markStub} marked: `Item` passes
 * an interaction whose component is a stub to the projection, so every kind the core renders shows
 * in `Item` before its component is filled.
 *
 * @param component Any value, such as an export of `#plate/react/index.tsx`.
 * @returns Whether it is a marked stub.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The marker is asked of every export of the React surface, components and functions and values alike, as the gate's stub case asks it.
export const isStub = (component: unknown): boolean =>
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- Only an object or a function can be in the weak set; any other export is no stub.
  (typeof component === "function" || (typeof component === "object" && component !== null)) &&
  stubs.has(component);

/**
 * The HTML attribute names whose React prop is spelt otherwise, by HTML name. A name not listed is
 * the same in both, as `id`, `role`, `type` and every `aria-*` and `data-*` name are.
 */
const reactNames: ReadonlyMap<string, string> = new Map([
  ["accesskey", "accessKey"],
  ["autocomplete", "autoComplete"],
  ["autofocus", "autoFocus"],
  ["class", "className"],
  ["colspan", "colSpan"],
  ["contenteditable", "contentEditable"],
  ["crossorigin", "crossOrigin"],
  ["datetime", "dateTime"],
  ["enterkeyhint", "enterKeyHint"],
  ["for", "htmlFor"],
  ["inputmode", "inputMode"],
  ["maxlength", "maxLength"],
  ["minlength", "minLength"],
  ["novalidate", "noValidate"],
  ["readonly", "readOnly"],
  ["rowspan", "rowSpan"],
  ["spellcheck", "spellCheck"],
  ["srcset", "srcSet"],
  ["tabindex", "tabIndex"],
  ["usemap", "useMap"],
  ["xlink:href", "xlinkHref"],
  ["xml:lang", "xmlLang"],
]);

/**
 * The HTML attribute name of each React prop {@link propName} spells otherwise, by React name: the
 * inverse of {@link reactNames}, with an uncontrolled default read back as the state attribute
 * it mounts (`defaultChecked` as `checked`, `defaultValue` as `value`).
 */
const htmlNames: ReadonlyMap<string, string> = new Map([
  ...[...reactNames].map(([html, react]) => [react, html] as const),
  ["defaultChecked", "checked"],
  ["defaultValue", "value"],
]);

/**
 * Name a React prop as the HTML attribute it writes: the inverse of the projection's spelling, so
 * a replacement's props are read as the attributes the swap invariant compares.
 *
 * @param prop The React prop's name, such as `className` or `defaultChecked`.
 * @returns The attribute's HTML name, such as `class` or `checked`; a name React spells as HTML
 *   does, as `id` and every `aria-*` and `data-*` name, as it is.
 */
export const attributeName = (prop: string): string => htmlNames.get(prop) ?? prop;

/**
 * The React props that take a boolean, by React name: a boolean attribute present (`true` in the
 * neutral tree) is `true` for these, and the empty string for any other name, as HTML reads an
 * attribute present with no value.
 */
const booleanProps: ReadonlySet<string> = new Set([
  "autoFocus",
  "checked",
  "defaultChecked",
  "disabled",
  "hidden",
  "inert",
  "multiple",
  "noValidate",
  "open",
  "readOnly",
  "required",
  "selected",
]);

/**
 * Name one attribute of an element as React takes it. A form control's state attribute becomes
 * its uncontrolled default (`checked` to `defaultChecked`, a text control's `value` to
 * `defaultValue`), so the projection mounts the state the HTML holds without taking control of it.
 *
 * @param element The element the attribute is on.
 * @param name The attribute's HTML name.
 * @returns The React prop's name.
 */
const propName = (element: Element, name: string): string => {
  if (name === "checked") {
    return "defaultChecked";
  }

  // A checkbox's or a radio button's `value` is the value it posts, not its current text.
  const { type } = element.attrs;
  const posts = type === "checkbox" || type === "radio";
  if (name === "value" && (element.tag === "textarea" || (element.tag === "input" && !posts))) {
    return "defaultValue";
  }

  return reactNames.get(name) ?? name;
};

/**
 * The characters of an element's text children, joined.
 *
 * @param children The element's children.
 * @returns Their text, an element child's included.
 */
const textOf = (children: readonly Node[]): string =>
  children.map((child) => (child.kind === "text" ? child.text : textOf(child.children))).join("");

/**
 * Give an element's attributes as React props, as {@link useParts} and the projection that applies
 * part replacements (`#plate/react/interaction.tsx`) both write them.
 *
 * A `textarea`'s text becomes its `defaultValue`, since React takes a text area's content as a prop
 * and refuses it as children. A boolean attribute is `true` for a prop React takes as a boolean
 * and the empty string otherwise, so no value is `false`.
 *
 * @param element The element.
 * @returns Its props in React's spelling.
 */
export const propsOf = (element: Element): Readonly<Record<string, string | boolean>> => {
  const entries = Object.entries(element.attrs).map(
    ([name, value]: [string, Attributes[string]]) => {
      const prop = propName(element, name);

      return [prop, value === true ? booleanProps.has(prop) || "" : value] as const;
    },
  );
  const props = Object.fromEntries(entries);

  return element.tag === "textarea" && element.children.length > 0
    ? { ...props, defaultValue: textOf(element.children) }
    : props;
};

/**
 * Project a node of the neutral tree to React.
 *
 * @param node The node.
 * @returns A text node's characters, or an element of the node's tag, its props, and its children
 *   projected in order; an element with no children is given none, as a void element must be.
 */
const project = (node: Node): ReactNode => {
  if (node.kind === "text") {
    return node.text;
  }

  const props = propsOf(node);
  if (node.children.length === 0 || node.tag === "textarea") {
    return createElement(node.tag, props);
  }

  return createElement(node.tag, props, ...node.children.map(project));
};

/**
 * Project a node of the neutral tree to React (OD-8): every element to the element of its tag,
 * with the same attributes in React's spelling, so the markers, ids and names a React page holds
 * are the ones `render`'s HTML holds. Part replacements are not applied here: `Item` and
 * `useInteraction` (`#plate/react/interaction.tsx`) apply them through the swap invariant.
 *
 * @example
 *   const Prompt = () => useParts(h("p", { "data-slot": "item-notice" }, [text("Hello")]));
 *   // renders <p data-slot="item-notice">Hello</p>
 *
 * @param node The node, as a part function returns it.
 * @returns The node as React renders it.
 */
export const useParts: UseParts = (node) => useMemo(() => project(node), [node]);

/**
 * Upgrade the rendered interactions under an element: `upgrade` from the runtime when the element
 * mounts, and its teardown when it unmounts. Issue m3g-01 owns it.
 *
 * @example
 *   const ref = useRef<HTMLDivElement>(null);
 *   useUpgrade(ref);
 *   return <div ref={ref}>{useParts(tree)}</div>;
 *
 * @param ref The element to upgrade under.
 */
export const useUpgrade: UseUpgrade = (ref) => {
  useEffect(() => {
    const root = ref.current;

    return root === null ? undefined : upgrade(root).teardown;
  }, [ref]);
};

/**
 * The props of {@link Notice}.
 */
export interface NoticeProps {
  /**
   * The feature's key in QTI's own spelling, such as an element name, which the notice names.
   */
  readonly feature: string;
  /**
   * The locale of the notice's text; English by default.
   */
  readonly locale?: Locale;
}

/**
 * The item's notice, as plate writes it at a flow position for a feature it does not render: the
 * `item-notice` part, a note reading "Not supported here: <feature>". Every React stub renders it.
 *
 * @param props The feature and the locale.
 * @returns The notice.
 */
export const Notice = ({ feature, locale = "en" }: NoticeProps): ReactNode =>
  useParts(
    useMemo(
      () =>
        h("div", { "data-slot": rowFor("item", "notice").slot, role: "note" }, [
          text(message(locale, "notice", { feature })),
        ]),
      [feature, locale],
    ),
  );

/**
 * Make an interaction's stub component, which renders the item's notice naming the interaction's
 * QTI element, `qti-<key>`, until its issue fills it. The component is marked
 * ({@link markStub}), so `Item` projects that interaction's root as the core rendered it instead
 * of mounting the stub.
 *
 * @param key The interaction's key, such as `hotspot-interaction`.
 * @returns The stub component, marked.
 */
export const stubInteraction = <I extends InteractionKey>(key: I): InteractionComponent<I> =>
  markStub((): ReactNode => <Notice feature={`qti-${key}`} />);
