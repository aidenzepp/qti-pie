import { Option } from "effect";
import type { Element } from "#plate/emit/node.ts";
import { partForSlot, promptMarkupFor } from "#plate/emit/parts.ts";
import type { InteractionKey, PartName, PartOf } from "#plate/emit/parts.ts";

/**
 * The checks `checkTree` runs, in the order it reports their violations.
 *
 * Each is a static rule over the emitter's node tree: the goal's two name checks, the structural
 * rules an emitted page must keep, and spec §4.8's focus rules. They read explicit references only,
 * with no accname implementation and no browser (ruling `fb4fe744` S2).
 */
export const checks = [
  "control-name",
  "label-name",
  "prompt-name",
  "list-item",
  "img-alt",
  "lang",
  "heading-order",
  "duplicate-id",
  "focusable-native",
  "tabindex-positive",
  "tabindex-minus-one",
  "radio-group",
  "submit-order",
  "hidden-control",
  "autofocus",
] as const;

/**
 * The name of one check `checkTree` runs.
 */
export type Check = (typeof checks)[number];

/**
 * One element of a tree that breaks one check.
 */
export interface Violation {
  readonly check: Check;
  /**
   * The tags from the tree's root down to the offending element, both included.
   */
  readonly path: readonly string[];
}

/**
 * An element of a tree with the elements above it, root first.
 */
interface Visit {
  readonly ancestors: readonly Element[];
  readonly element: Element;
}

/**
 * The tree a check reads, flattened once, with the options `checkTree` was given.
 */
interface Scope {
  readonly baseLevel: number;
  readonly tree: Element;
  /**
   * Every element of the tree in document order, the root first.
   */
  readonly visits: readonly Visit[];
}

/**
 * The tags that hold a list's items.
 */
const listTags: ReadonlySet<string> = new Set(["menu", "ol", "ul"]);

/**
 * The elements a `label` element's `for` can name.
 *
 * @see https://html.spec.whatwg.org/multipage/forms.html#category-label
 */
const labelableTags: ReadonlySet<string> = new Set([
  "button",
  "input",
  "meter",
  "output",
  "progress",
  "select",
  "textarea",
]);

/**
 * The form controls whose `disabled` attribute removes them from focus.
 */
const disableableTags: ReadonlySet<string> = new Set(["button", "input", "select", "textarea"]);

/**
 * Read an attribute as a string, a boolean attribute present reading as the empty string.
 *
 * @param element The element to read.
 * @param name The attribute's name.
 * @returns The attribute's value, or `undefined` when the element does not carry it.
 */
const attribute = (element: Element, name: string): string | undefined => {
  const value = element.attrs[name];

  return value === true ? "" : value;
};

/**
 * Read the part an element is, from its `data-slot` marker through the part table (spec §4.3).
 *
 * @param element The element to read.
 * @returns The interaction and the part, or none for an element that is no part.
 */
const partOf = (element: Element): Option.Option<PartName> => {
  const slot = attribute(element, "data-slot");

  return slot === undefined ? Option.none() : partForSlot(slot);
};

/**
 * Tell whether an element is one part of one interaction or of the item chrome.
 *
 * @param element The element to read.
 * @param interaction The part's owner.
 * @param part The part.
 * @returns Whether the element's marker names that part.
 */
const isPart = <I extends InteractionKey>(
  element: Element,
  interaction: I,
  part: PartOf<I>,
): boolean =>
  Option.exists(partOf(element), (name) => name.interaction === interaction && name.part === part);

/**
 * Read the interaction whose Root an element is.
 *
 * @param element The element to read.
 * @returns The interaction, or none for the item Root and for every element that is no Root.
 */
const interactionRooted = (element: Element): Option.Option<InteractionKey> =>
  Option.flatMap(partOf(element), ({ interaction, part }) =>
    part === "root" && interaction !== "item" ? Option.some(interaction) : Option.none(),
  );

/**
 * Collapse runs of ASCII whitespace to one space and trim the ends.
 *
 * @param value The text to collapse.
 * @returns The collapsed text.
 */
const collapse = (value: string): string => value.replaceAll(/[\t\n\f\r ]+/gu, " ").trim();

/**
 * Decide whether an element hides itself and its subtree from assistive technology.
 *
 * @param element The element to read.
 * @returns Whether it carries `aria-hidden="true"`.
 */
const isAriaHidden = (element: Element): boolean => attribute(element, "aria-hidden") === "true";

/**
 * Read an element's `input` type, ASCII lower-cased, `text` when absent.
 *
 * @param element An `input` element.
 * @returns The type keyword.
 */
const inputType = (element: Element): string =>
  (attribute(element, "type") ?? "text").toLowerCase();

/**
 * Decide whether an element is a form control a person operates: an `input` that is not hidden, a
 * `textarea`, a `select` or a `button`.
 *
 * @param element The element to classify.
 * @returns Whether it is such a control.
 */
const isFormControl = (element: Element): boolean =>
  element.tag === "input" ? inputType(element) !== "hidden" : disableableTags.has(element.tag);

/**
 * Decide whether an element is a submit button: a `button` in the Submit state, which its `type`
 * gives when it is `submit`, absent or a value HTML does not know.
 *
 * @param element The element to classify.
 * @returns Whether it is a `button` whose `type` is neither `button` nor `reset`, in any ASCII
 *   case.
 * @see https://html.spec.whatwg.org/multipage/form-elements.html#attr-button-type
 */
const isSubmitButton = (element: Element): boolean => {
  const type = attribute(element, "type")?.toLowerCase();

  return element.tag === "button" && type !== "button" && type !== "reset";
};

/**
 * Parse an element's `tabindex` by HTML's rules for parsing integers.
 *
 * A value the rules cannot parse is ignored by the browser, so it reads as absent here.
 *
 * @param element The element to read.
 * @returns The parsed index, or `undefined` when it has none or it does not parse.
 * @see https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#rules-for-parsing-integers
 */
const tabindexOf = (element: Element): number | undefined => {
  const digits = /^[\t\n\f\r ]*(?<digits>[+-]?\d+)/u.exec(attribute(element, "tabindex") ?? "")
    ?.groups?.["digits"];

  return digits === undefined ? undefined : Number(digits);
};

/**
 * Decide whether an element is one of the kinds a browser focuses natively, a `tabindex` aside.
 *
 * A `summary` counts only as the summary of its parent `details`, its first `summary` child, so the
 * parent is needed.
 *
 * @param element The element to classify.
 * @param parent The element's parent, `undefined` for a root.
 * @returns Whether the element is a native focusable kind.
 * @see https://html.spec.whatwg.org/multipage/interaction.html#focusable-area
 */
const isNativeFocusable = (element: Element, parent: Element | undefined): boolean => {
  switch (element.tag) {
    case "a":
    case "area": {
      return attribute(element, "href") !== undefined;
    }
    case "audio":
    case "video": {
      return attribute(element, "controls") !== undefined;
    }
    case "summary": {
      return (
        parent?.tag === "details" &&
        parent.children.find((child) => child.kind === "element" && child.tag === "summary") ===
          element
      );
    }
    default: {
      return isFormControl(element);
    }
  }
};

/**
 * Decide whether an element can take focus, given its parent.
 *
 * @param element The element to classify.
 * @param parent The element's parent, `undefined` for a root.
 * @returns Whether the element can take focus.
 */
const isFocusableUnder = (element: Element, parent: Element | undefined): boolean => {
  if (disableableTags.has(element.tag) && attribute(element, "disabled") !== undefined) {
    return false;
  }

  return isNativeFocusable(element, parent) || tabindexOf(element) !== undefined;
};

/**
 * Flatten a tree into its elements in document order, each with its ancestors.
 *
 * @param tree The tree's root.
 * @returns Every element of the tree, the root first.
 */
const visitsOf = (tree: Element): readonly Visit[] => {
  const visits: Visit[] = [];
  const descend = (element: Element, ancestors: readonly Element[]): void => {
    visits.push({ ancestors, element });

    const below = [...ancestors, element];
    for (const child of element.children) {
      if (child.kind === "element") {
        descend(child, below);
      }
    }
  };
  descend(tree, []);

  return visits;
};

/**
 * Read a visit's parent.
 *
 * @param visit The visit to read.
 * @returns The element's parent, `undefined` for the root.
 */
const parentOf = (visit: Visit): Element | undefined => visit.ancestors.at(-1);

/**
 * Find the interaction Root a visit sits in: its nearest ancestor whose marker names an
 * interaction's Root.
 *
 * @param visit The visit to place.
 * @returns The Root, or `undefined` outside every interaction.
 */
const rootOf = (visit: Visit): Element | undefined =>
  visit.ancestors.findLast((ancestor) => Option.isSome(interactionRooted(ancestor)));

/**
 * List the visits below an element, in document order.
 *
 * @param visits Every visit of the tree.
 * @param element The element whose descendants are wanted.
 * @returns The visits that have `element` among their ancestors.
 */
const below = (visits: readonly Visit[], element: Element): readonly Visit[] =>
  visits.filter((visit) => visit.ancestors.includes(element));

/**
 * Read a radio's group name, the empty string when it has none.
 *
 * @param visit The radio's visit.
 * @returns The radio's `name`.
 */
const radioName = (visit: Visit): string => attribute(visit.element, "name") ?? "";

/**
 * Build the violation of one check at one visit.
 *
 * @param check The check broken.
 * @param visit The offending element's visit.
 * @returns The violation, its path the tags from the root to the element.
 */
const violation = (check: Check, visit: Visit): Violation => ({
  check,
  path: [...visit.ancestors.map((ancestor) => ancestor.tag), visit.element.tag],
});

/**
 * Concatenate the text below an element as written, skipping `aria-hidden="true"` subtrees.
 *
 * @param node The element whose descendant text is wanted.
 * @returns The raw text, whitespace kept.
 */
const textBelow = (node: Element): string =>
  node.children
    .map((child) => {
      if (child.kind === "text") {
        return child.text;
      }

      return isAriaHidden(child) ? "" : textBelow(child);
    })
    .join("");

/**
 * Collect an element's descendant text, skipping `aria-hidden="true"` subtrees, with ASCII
 * whitespace collapsed and trimmed.
 *
 * Text is concatenated as written, with no space added at element boundaries. The element's own
 * `aria-hidden` is not read: a node `aria-labelledby` references contributes its text even when it
 * is hidden.
 *
 * @param element The element whose text is wanted.
 * @returns The text a reader of the element hears.
 */
export const textOf = (element: Element): string => collapse(textBelow(element));

/**
 * Split an IDREFS attribute, such as `aria-labelledby`, into its ids.
 *
 * @param value The attribute's value, if present.
 * @returns The ids in order, none for an absent attribute.
 */
const idRefs = (value: string | undefined): readonly string[] =>
  (value ?? "").split(/[\t\n\f\r ]+/u).filter((id) => id !== "");

/**
 * Compute the accessible name of a form control or a group Root from explicit references only.
 *
 * The first non-empty source wins: the text of the elements `aria-labelledby` names, in its order;
 * then `aria-label`; then, for a labelable element, the text of each `label` whose `for` is its
 * `id`; then, for a `button`, its own text.
 *
 * @param element The control or Root to name.
 * @param tree The tree the element and its references sit in.
 * @returns The name, empty when no source gives one.
 */
export const nameOf = (element: Element, tree: Element): string => {
  const elements = visitsOf(tree).map((visit) => visit.element);
  const labelledBy = idRefs(attribute(element, "aria-labelledby")).flatMap((id) => {
    const target = elements.find((candidate) => attribute(candidate, "id") === id);

    return target === undefined ? [] : [textOf(target)];
  });
  const id = attribute(element, "id");
  const sources = [
    () => labelledBy.join(" "),
    () => attribute(element, "aria-label") ?? "",
    () =>
      id === undefined || !labelableTags.has(element.tag)
        ? ""
        : elements
            .filter((candidate) => candidate.tag === "label" && attribute(candidate, "for") === id)
            .map(textOf)
            .join(" "),
    () => (element.tag === "button" ? textOf(element) : ""),
  ];
  for (const source of sources) {
    const name = collapse(source());
    if (name !== "") {
      return name;
    }
  }

  return "";
};

/**
 * Decide whether an element can take focus.
 *
 * The focusable kinds are an `input` that is not hidden, a `textarea`, a `select`, a `button`, an
 * `a` or `area` with an `href`, an `audio` or `video` with `controls`, the first `summary` child of
 * a `details`, and any element with a `tabindex`, `-1` included. A disabled control is not
 * focusable.
 *
 * @param element The element to classify.
 * @param tree The tree the element sits in, which places a `summary` under its `details`; an
 *   element outside it is judged as a root.
 * @returns Whether the element can take focus.
 */
export const isFocusable = (element: Element, tree: Element): boolean => {
  const visit = visitsOf(tree).find((candidate) => candidate.element === element);

  return isFocusableUnder(element, visit === undefined ? undefined : parentOf(visit));
};

/**
 * Decide whether a Choice Root and its Prompt take one of the two markups the operator ruled
 * (rule `efed9867`), and nothing else.
 *
 * Both keep the Root a native `fieldset` with no `role`. In the `legend` markup the Prompt is a
 * `legend` of phrasing content, the Root's first element child, and the Root carries no
 * `aria-labelledby`. In the `labelledby` markup the Prompt is no `legend`, holds content a legend
 * may not, and has an `id`, which the Root's `aria-labelledby` names alone, so the Root's name is
 * the Prompt's text. The content decides which markup is due, through the part table's
 * {@link promptMarkupFor}.
 *
 * @param root The Choice Root.
 * @param prompt The Prompt the Root owns.
 * @param tree The tree both sit in.
 * @returns Whether the pair takes the markup its Prompt's content calls for.
 */
const promptNamesGroup = (root: Element, prompt: Element, tree: Element): boolean => {
  if (root.tag !== "fieldset" || attribute(root, "role") !== undefined) {
    return false;
  }

  const labelledBy = idRefs(attribute(root, "aria-labelledby"));
  if (promptMarkupFor(prompt.children) === "legend") {
    return (
      prompt.tag === "legend" &&
      labelledBy.length === 0 &&
      root.children.find((child) => child.kind === "element") === prompt
    );
  }

  const id = attribute(prompt, "id");

  return (
    prompt.tag !== "legend" &&
    id !== undefined &&
    labelledBy.length === 1 &&
    labelledBy[0] === id &&
    nameOf(root, tree) === textOf(prompt)
  );
};

/**
 * Find each element that breaks one check, in document order.
 *
 * @param scope The tree and options `checkTree` was given.
 * @returns The offending elements' visits.
 */
type Rule = (scope: Scope) => readonly Visit[];

/**
 * Every check's rule, keyed by its name.
 */
const rules = {
  autofocus: ({ visits }) =>
    visits
      .filter((visit) => attribute(visit.element, "autofocus") !== undefined)
      .filter(
        (visit, index) =>
          index > 0 ||
          !(
            isFocusableUnder(visit.element, parentOf(visit)) ||
            isPart(visit.element, "item", "status")
          ),
      ),
  "control-name": ({ tree, visits }) =>
    visits.filter((visit) => isFormControl(visit.element) && nameOf(visit.element, tree) === ""),
  "duplicate-id": ({ visits }) =>
    visits.filter((visit, index) => {
      const id = attribute(visit.element, "id");

      return (
        id !== undefined &&
        visits.slice(0, index).some((earlier) => attribute(earlier.element, "id") === id)
      );
    }),
  "focusable-native": ({ visits }) =>
    visits.filter(
      (visit) =>
        (tabindexOf(visit.element) ?? -1) >= 0 &&
        !isNativeFocusable(visit.element, parentOf(visit)),
    ),
  "heading-order": ({ baseLevel, visits }) => {
    let previous = baseLevel - 1;

    return visits.filter((visit) => {
      const level = /^h(?<level>[1-6])$/u.exec(visit.element.tag)?.groups?.["level"];
      if (level === undefined) {
        return false;
      }

      const current = Number(level);
      const broken = current < baseLevel || current > previous + 1;
      previous = current;

      return broken;
    });
  },
  "hidden-control": ({ visits }) =>
    visits.filter(
      (visit) =>
        isFormControl(visit.element) && [...visit.ancestors, visit.element].some(isAriaHidden),
    ),
  "img-alt": ({ visits }) =>
    visits.filter(
      (visit) => visit.element.tag === "img" && attribute(visit.element, "alt") === undefined,
    ),
  "label-name": ({ tree, visits }) =>
    visits
      .filter((visit) => isPart(visit.element, "choice-interaction", "choice"))
      .flatMap((row) => {
        const inside = below(visits, row.element);
        const label = inside.find((visit) => isPart(visit.element, "choice-interaction", "label"));
        if (label === undefined) {
          return [];
        }

        const expected = textOf(label.element);

        return inside.filter(
          (visit) =>
            isPart(visit.element, "choice-interaction", "control") &&
            nameOf(visit.element, tree) !== expected,
        );
      }),
  lang: ({ tree, visits }) =>
    collapse(attribute(tree, "lang") ?? "") === "" ? visits.slice(0, 1) : [],
  "list-item": ({ visits }) =>
    visits.filter((visit) => {
      const parent = parentOf(visit);

      return (
        visit.element.tag === "li" &&
        (parent === undefined ||
          !(listTags.has(parent.tag) || attribute(parent, "role") === "list"))
      );
    }),
  "prompt-name": ({ tree, visits }) =>
    visits.flatMap((root) => {
      const interaction = interactionRooted(root.element);
      if (Option.isNone(interaction)) {
        return [];
      }

      const owned = below(visits, root.element).filter((visit) => rootOf(visit) === root.element);
      const prompt = owned.find((visit) => isPart(visit.element, interaction.value, "prompt"));
      if (prompt === undefined) {
        return [];
      }

      if (interaction.value === "choice-interaction") {
        return promptNamesGroup(root.element, prompt.element, tree) ? [] : [root];
      }

      const control = owned.find((visit) => isPart(visit.element, interaction.value, "control"));
      if (control === undefined) {
        return [root];
      }

      return nameOf(control.element, tree) === textOf(prompt.element) ? [] : [control];
    }),
  "radio-group": ({ visits }) => {
    const radios = visits.filter(
      (visit) => visit.element.tag === "input" && inputType(visit.element) === "radio",
    );
    const splitByName = new Set(
      radios.filter((radio) => {
        const name = radioName(radio);
        const first = radios.find((other) => name !== "" && radioName(other) === name);

        return (
          first !== undefined &&
          first !== radio &&
          (rootOf(radio) === undefined || rootOf(radio) !== rootOf(first))
        );
      }),
    );
    const mixedInRoot = new Set(
      radios.filter((radio) => {
        const root = rootOf(radio);
        const peers = radios.filter((other) => root !== undefined && rootOf(other) === root);
        const [first] = peers;

        return (
          peers.length > 1 &&
          first !== undefined &&
          (radioName(radio) === "" || radioName(radio) !== radioName(first))
        );
      }),
    );

    return radios.filter((radio) => splitByName.has(radio) || mixedInRoot.has(radio));
  },
  "submit-order": ({ visits }) =>
    visits.filter((visit, index) => {
      if (!isSubmitButton(visit.element)) {
        return false;
      }

      const form = visit.ancestors.findLast((ancestor) => ancestor.tag === "form");

      return (
        form === undefined ||
        visits
          .slice(index + 1)
          .some((later) => later.ancestors.includes(form) && isFormControl(later.element))
      );
    }),
  "tabindex-minus-one": ({ visits }) =>
    visits.filter(
      (visit) => (tabindexOf(visit.element) ?? 0) < 0 && !isPart(visit.element, "item", "status"),
    ),
  "tabindex-positive": ({ visits }) =>
    visits.filter((visit) => (tabindexOf(visit.element) ?? 0) > 0),
} satisfies { readonly [check in Check]: Rule };

/**
 * Check an emitted tree against the static accessibility rules every emitting slice calls.
 *
 * The rules are {@link checks}'s, reported in that order and, within one check, in document order.
 * Parts are found by their `data-slot` markers, read through the part table's `partForSlot` (spec
 * §4.3): the item's Status, and an interaction's Root, Prompt, Choice, Control and Label. The form
 * and its submit button are the host's composition, not parts, so `submit-order` reads them from
 * the HTML: a submit button must sit inside a `form`, after every control of that form. A Choice
 * Root's Prompt must take one of the two ruled markups, a `legend` first in the `fieldset` or a
 * `qti-prompt` the `fieldset` names through `aria-labelledby`. A Root with no Prompt has no name
 * requirement (Q9).
 *
 * @param tree The tree's root, which must carry `lang`.
 * @param options How the tree sits in its page.
 * @param options.baseLevel The heading level the tree's headings start at: none may sit below it,
 *   and the first may sit at it.
 * @returns Every violation, empty for a tree that passes.
 */
export const checkTree = (
  tree: Element,
  options: { readonly baseLevel: number },
): readonly Violation[] => {
  const scope: Scope = { baseLevel: options.baseLevel, tree, visits: visitsOf(tree) };

  return checks.flatMap((check) => rules[check](scope).map((visit) => violation(check, visit)));
};
