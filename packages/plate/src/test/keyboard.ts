import { Option } from "effect";
import type { Element } from "#plate/emit/node.ts";
import {
  attribute,
  inputType,
  isFocusable,
  isSubmitButton,
  tabindexOf,
} from "#plate/test/accessibility.ts";

/**
 * A key a keyboard walk presses, or a run of text typed into the focused control.
 */
export type Key =
  | "Tab"
  | "Shift+Tab"
  | "ArrowDown"
  | "ArrowUp"
  | "ArrowRight"
  | "ArrowLeft"
  | "Space"
  | "Enter"
  | { readonly type: string };

/**
 * One entry of a form's entry list: a control's name and the value it posts.
 */
type Entry = readonly [string, string];

/**
 * What a key does to the walk's model, by the control it lands on.
 *
 * `submit` covers a `button` and an `input` whose type submits; `text` covers the `input` types a
 * person types a line into; `select` covers a drop-down `select`, one with no `multiple` and a
 * display size of 1; `other` is every element whose keys the walk does not model, a list-box
 * `select` included.
 */
type Kind = "checkbox" | "other" | "radio" | "select" | "submit" | "text" | "textarea";

/**
 * An element of the walked tree, with what the walk reads from it.
 */
interface Visit {
  /**
   * The element's form owner, its nearest `form` ancestor, `undefined` outside every form.
   */
  readonly form: Element | undefined;
  readonly element: Element;
  /**
   * The element's position in document order, the root at 0.
   */
  readonly index: number;
  readonly kind: Kind;
}

/**
 * The walked tree, flattened once.
 */
interface Page {
  /**
   * Every visit whose element is focusable and has no negative `tabindex`, in document order: the
   * candidates for a tab stop, before radio groups fold to one stop each.
   */
  readonly sequential: readonly Visit[];
  /**
   * Every element of the tree in document order, the root first.
   */
  readonly visits: readonly Visit[];
}

/**
 * The control state a walk changes: which radios and checkboxes are checked, each text control's
 * value, and each drop-down `select`'s selected `option`.
 */
interface State {
  readonly checked: Set<Element>;
  /**
   * Each drop-down `select`'s selected `option`; a `select` with no option selected is absent.
   */
  readonly selected: Map<Element, Element>;
  readonly values: Map<Element, string>;
}

/**
 * What one key did: focus moved or stayed, or a form was submitted.
 */
type Outcome = { readonly focus: Visit | undefined } | { readonly submitted: Element };

/**
 * The `input` types a person types one line of text into.
 */
const textTypes: ReadonlySet<string> = new Set([
  "email",
  "password",
  "search",
  "tel",
  "text",
  "url",
]);

/**
 * The `input` types that block implicit submission when a form has no submit button and more than
 * one of them.
 *
 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#field-that-blocks-implicit-submission
 */
const blockingTypes: ReadonlySet<string> = new Set([
  ...textTypes,
  "date",
  "datetime-local",
  "month",
  "number",
  "time",
  "week",
]);

/**
 * Decide whether a `select` is a drop-down box: no `multiple`, and a display size of 1.
 *
 * The display size is `size` by HTML's rules for parsing non-negative integers, 1 when it is absent
 * or does not parse; a `size` of 0 renders a drop-down box in both engines, as 1 does.
 *
 * @param select The `select` to read.
 * @returns Whether it renders as a drop-down box rather than a list box.
 * @see https://html.spec.whatwg.org/multipage/form-elements.html#concept-select-size
 */
const isDropDown = (select: Element): boolean => {
  const digits = /^[\t\n\f\r ]*\+?(?<digits>\d+)/u.exec(attribute(select, "size") ?? "")?.groups?.[
    "digits"
  ];

  return (
    attribute(select, "multiple") === undefined && (digits === undefined || Number(digits) <= 1)
  );
};

/**
 * Classify an element by what the walk's keys do to it.
 *
 * A `button` with a missing or unknown `type` is a submit button, as HTML's default says
 * ({@link isSubmitButton}).
 *
 * @param element The element to classify.
 * @returns The element's kind.
 */
const kindOf = (element: Element): Kind => {
  switch (element.tag) {
    case "button": {
      return isSubmitButton(element) ? "submit" : "other";
    }
    case "input": {
      const type = inputType(element);
      if (type === "checkbox" || type === "radio" || type === "submit") {
        return type;
      }

      return textTypes.has(type) ? "text" : "other";
    }
    case "select": {
      return isDropDown(element) ? "select" : "other";
    }
    case "textarea": {
      return "textarea";
    }
    default: {
      return "other";
    }
  }
};

/**
 * Decide whether an element carries `disabled`.
 *
 * @param element The element to read.
 * @returns Whether it is disabled by its own attribute.
 */
const isDisabled = (element: Element): boolean => attribute(element, "disabled") !== undefined;

/**
 * Flatten a tree once into what every key reads.
 *
 * @param tree The tree's root.
 * @returns The tree's visits and its tab-stop candidates.
 */
const pageOf = (tree: Element): Page => {
  const visits: Visit[] = [];

  /**
   * Record an element and then, in order, every element below it, each with its form owner.
   *
   * @param element The element to record.
   * @param form The nearest `form` above it, absent outside every form.
   */
  const descend = (element: Element, form?: Element): void => {
    visits.push({ element, form, index: visits.length, kind: kindOf(element) });

    const owner = element.tag === "form" ? element : form;
    for (const child of element.children) {
      if (child.kind === "element") {
        descend(child, owner);
      }
    }
  };
  descend(tree);

  const sequential = visits.filter(
    (visit) => isFocusable(visit.element, tree) && (tabindexOf(visit.element) ?? 0) >= 0,
  );

  return { sequential, visits };
};

/**
 * List the radios in a radio's group, in document order.
 *
 * A group is the radios with the radio's non-empty `name` and its form owner; a radio with no name
 * is a group of its own.
 *
 * @param visits The visits to search.
 * @param radio The radio whose group is wanted.
 * @returns The group's radios among `visits`.
 * @see https://html.spec.whatwg.org/multipage/input.html#radio-button-group
 */
const groupOf = (visits: readonly Visit[], radio: Visit): readonly Visit[] => {
  const name = attribute(radio.element, "name") ?? "";

  return visits.filter(
    (other) =>
      other === radio ||
      (other.kind === "radio" &&
        name !== "" &&
        attribute(other.element, "name") === name &&
        other.form === radio.form),
  );
};

/**
 * Check a radio and uncheck the rest of its group.
 *
 * @param page The walked tree.
 * @param state The control state to change.
 * @param radio The radio to check.
 */
const check = (page: Page, state: State, radio: Visit): void => {
  for (const other of groupOf(page.visits, radio)) {
    state.checked.delete(other.element);
  }
  state.checked.add(radio.element);
};

/**
 * Collect the text an element's text children hold, as written.
 *
 * @param element The element to read.
 * @returns Its text children's text, concatenated.
 */
const ownText = (element: Element): string =>
  element.children.map((child) => (child.kind === "text" ? child.text : "")).join("");

/**
 * Collect the text of every text node below an element, in tree order, as written.
 *
 * @param element The element to read.
 * @returns Its descendant text, concatenated.
 */
const descendantText = (element: Element): string =>
  element.children
    .map((child) => (child.kind === "text" ? child.text : descendantText(child)))
    .join("");

/**
 * Read an `option`'s text: its descendant text with ASCII whitespace stripped and collapsed.
 *
 * @param option The `option` to read.
 * @returns The text a drop-down box shows for it.
 * @see https://html.spec.whatwg.org/multipage/form-elements.html#dom-option-text
 */
const optionText = (option: Element): string =>
  descendantText(option)
    .replaceAll(/[\t\n\f\r ]+/gu, " ")
    .trim();

/**
 * Read the value an `option` posts: its `value`, else its text.
 *
 * @param option The `option` to read.
 * @returns The option's value.
 * @see https://html.spec.whatwg.org/multipage/form-elements.html#concept-option-value
 */
const optionValue = (option: Element): string => attribute(option, "value") ?? optionText(option);

/**
 * List a `select`'s options: its `option` children, in tree order.
 *
 * @param select The `select` to read.
 * @returns Its options.
 */
const optionsOf = (select: Element): readonly Element[] =>
  select.children.filter(
    (child): child is Element => child.kind === "element" && child.tag === "option",
  );

/**
 * Read the option a drop-down `select` starts with selected, by HTML's selectedness setting
 * algorithm: the last option carrying `selected`, else the first option that is not disabled.
 *
 * @param select The drop-down `select` to read.
 * @returns The selected option, `undefined` when the select has none to select.
 * @see https://html.spec.whatwg.org/multipage/form-elements.html#selectedness-setting-algorithm
 */
const initialOption = (select: Element): Element | undefined => {
  const options = optionsOf(select);

  return (
    options.findLast((option) => attribute(option, "selected") !== undefined) ??
    options.find((option) => !isDisabled(option))
  );
};

/**
 * Read the control state a tree starts with: `checked`, an `input`'s `value`, a `textarea`'s text
 * and a drop-down `select`'s selected option.
 *
 * When several radios of one group carry `checked`, the last in document order is the checked one,
 * as the HTML parser leaves it.
 *
 * @param page The walked tree.
 * @returns The initial state.
 */
const initialState = (page: Page): State => {
  const state: State = { checked: new Set(), selected: new Map(), values: new Map() };
  for (const visit of page.visits) {
    const { element, kind } = visit;
    if (kind === "text") {
      state.values.set(element, (attribute(element, "value") ?? "").replaceAll(/[\n\r]/gu, ""));
    }

    if (kind === "textarea") {
      state.values.set(element, ownText(element).replaceAll(/\r\n?/gu, "\n"));
    }

    const option = kind === "select" ? initialOption(element) : undefined;
    if (option !== undefined) {
      state.selected.set(element, option);
    }

    if (attribute(element, "checked") !== undefined) {
      if (kind === "radio") {
        check(page, state, visit);
      }

      if (kind === "checkbox") {
        state.checked.add(element);
      }
    }
  }

  return state;
};

/**
 * List the tab stops under a control state, in document order.
 *
 * Each radio group folds to one stop, at its checked radio, else at its first.
 *
 * @param page The walked tree.
 * @param state The current control state.
 * @returns The stops' visits.
 */
const stopsOf = (page: Page, state: State): readonly Visit[] =>
  page.sequential.filter((visit) => {
    if (visit.kind !== "radio") {
      return true;
    }

    const group = groupOf(page.sequential, visit);

    return (group.find((radio) => state.checked.has(radio.element)) ?? group[0]) === visit;
  });

/**
 * Move focus one stop forwards or backwards along the tab order.
 *
 * With nothing focused, forwards goes to the first stop and backwards to the last. Past either end
 * focus leaves the page, so the next move starts again from nothing.
 *
 * @param page The walked tree.
 * @param state The current control state, which places each radio group's stop.
 * @param focus The focused element's visit, `undefined` for none.
 * @param step `1` for Tab, `-1` for Shift+Tab.
 * @returns The newly focused visit, `undefined` once focus leaves the page.
 */
const move = (
  page: Page,
  state: State,
  focus: Visit | undefined,
  step: -1 | 1,
): Visit | undefined => {
  const stops = stopsOf(page, state);
  if (focus === undefined) {
    return step === 1 ? stops[0] : stops.at(-1);
  }

  return step === 1
    ? stops.find((stop) => stop.index > focus.index)
    : stops.findLast((stop) => stop.index < focus.index);
};

/**
 * Move to the next or previous enabled radio of the focused radio's group, wrapping, and check it.
 *
 * @param page The walked tree.
 * @param state The control state to change.
 * @param radio The focused radio.
 * @param step `1` for ArrowDown and ArrowRight, `-1` for ArrowUp and ArrowLeft.
 * @returns The newly focused radio.
 */
const arrow = (page: Page, state: State, radio: Visit, step: -1 | 1): Visit => {
  const group = groupOf(page.sequential, radio);
  const at = group.indexOf(radio);
  const next = at === -1 ? radio : (group[(at + step + group.length) % group.length] ?? radio);
  check(page, state, next);

  return next;
};

/**
 * Append typed text to the focused control's value when it is a text `input` or a `textarea`; any
 * other control ignores it.
 *
 * A text `input` drops line breaks from its value, as HTML's value sanitization does; a `textarea`
 * keeps them.
 *
 * @param state The control state to change.
 * @param control The focused control.
 * @param typed The text typed.
 */
const type = (state: State, control: Visit, typed: string): void => {
  if (control.kind !== "text" && control.kind !== "textarea") {
    return;
  }

  const added = control.kind === "text" ? typed.replaceAll(/[\n\r]/gu, "") : typed;
  state.values.set(control.element, `${state.values.get(control.element) ?? ""}${added}`);
};

/**
 * Select an option of a focused drop-down `select` by type-ahead, as both engines do for one run
 * of text typed without a pause, its list closed.
 *
 * Each character extends the run's prefix. A one-character search, the run's first character or a
 * character that repeats the last one-character search, starts one option past the selected option
 * (the first option when none is selected), so a repeated letter cycles through the options it
 * starts; a longer prefix starts at the selected option, so typing on keeps a match. The search
 * wraps and selects the first option whose text starts with the prefix, case-insensitively; a
 * disabled option never matches, and no match leaves the selection. The Placeholder takes part like
 * any option. A pause longer than the engines' one second ends a run, and the walk has no clock, so
 * each `{ type }` key is one run and the next starts a new prefix: G, a pause, then L selects
 * Lancaster, as "La" typed at once does. A space inside a run is type-ahead in Blink but opens
 * WebKit's list; the walk follows Blink.
 *
 * @param state The control state to change.
 * @param select The focused drop-down `select`.
 * @param typed The run typed.
 * @see https://github.com/chromium/chromium/blob/5c0058a0e1210412c7c76e455481b4e4173210f5/third_party/blink/renderer/core/html/forms/type_ahead.cc#L66-L126
 * @see https://github.com/WebKit/WebKit/blob/6bea26d263294fb777243a6cb96c86c68b8037f2/Source/WebCore/html/TypeAhead.cpp#L56-L110
 * @see https://github.com/chromium/chromium/blob/5c0058a0e1210412c7c76e455481b4e4173210f5/third_party/blink/renderer/core/html/forms/html_select_element.cc#L1557-L1563
 */
const typeAhead = (state: State, select: Element, typed: string): void => {
  const options = optionsOf(select);
  if (options.length === 0) {
    return;
  }

  let buffer = "";
  let repeating = "";
  for (const character of typed) {
    buffer += character;
    const single = character === repeating || buffer === character;
    repeating = single ? character : "";
    const prefix = (single ? character : buffer).toLowerCase();
    const selected = state.selected.get(select);
    const at =
      ((selected === undefined ? 0 : options.indexOf(selected)) + (single ? 1 : 0)) %
      options.length;
    const match = [...options.slice(at), ...options.slice(0, at)].find(
      (option) => !isDisabled(option) && optionText(option).toLowerCase().startsWith(prefix),
    );
    if (match !== undefined) {
      state.selected.set(select, match);
    }
  }
};

/**
 * Decide whether Enter in a text `input` submits its form, by HTML's implicit submission.
 *
 * A form with a default button, its first submit button, submits unless that button is disabled. A
 * form with none submits only when it holds at most one field that blocks implicit submission.
 *
 * @param page The walked tree.
 * @param form The text input's form owner.
 * @returns Whether the form is submitted.
 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
 */
const submitsImplicitly = (page: Page, form: Element): boolean => {
  const owned = page.visits.filter((visit) => visit.form === form);
  const defaultButton = owned.find((visit) => visit.kind === "submit");
  if (defaultButton !== undefined) {
    return !isDisabled(defaultButton.element);
  }

  return (
    owned.filter(
      (visit) => visit.element.tag === "input" && blockingTypes.has(inputType(visit.element)),
    ).length <= 1
  );
};

/**
 * Decide whether Enter on a drop-down `select` submits its form.
 *
 * A `select` is no implicit-submission trigger in HTML, but both engines' drop-down key handlers
 * call their implicit submission with the trigger flag off: it activates the form's first enabled
 * submit button, past disabled ones, and with none it submits nothing, whatever fields the form
 * holds.
 *
 * @param page The walked tree.
 * @param form The select's form owner.
 * @returns Whether the form is submitted.
 * @see https://github.com/chromium/chromium/blob/5c0058a0e1210412c7c76e455481b4e4173210f5/third_party/blink/renderer/core/html/forms/select_type.cc#L446-L449
 * @see https://github.com/chromium/chromium/blob/5c0058a0e1210412c7c76e455481b4e4173210f5/third_party/blink/renderer/core/html/forms/html_form_element.cc#L612-L630
 * @see https://github.com/WebKit/WebKit/blob/6bea26d263294fb777243a6cb96c86c68b8037f2/Source/WebCore/html/HTMLSelectElement.cpp#L2101-L2102
 * @see https://github.com/WebKit/WebKit/blob/6bea26d263294fb777243a6cb96c86c68b8037f2/Source/WebCore/html/HTMLFormElement.cpp#L190-L203
 */
const selectSubmits = (page: Page, form: Element): boolean =>
  page.visits.some(
    (visit) => visit.form === form && visit.kind === "submit" && !isDisabled(visit.element),
  );

/**
 * Apply Enter's native effect to the focused control.
 *
 * Enter adds a line feed in a `textarea`, submits from a text `input` by implicit submission and
 * from a drop-down `select` through its form's first enabled submit button, and activates a submit
 * button.
 *
 * @param page The walked tree.
 * @param state The control state, changed in place.
 * @param focus The focused element's visit.
 * @returns Focus unchanged, or the form Enter submitted.
 */
const enter = (page: Page, state: State, focus: Visit): Outcome => {
  const { form, kind } = focus;
  if (kind === "textarea") {
    type(state, focus, "\n");
  }

  const submits =
    kind === "submit" ||
    (kind === "text" && form !== undefined && submitsImplicitly(page, form)) ||
    (kind === "select" && form !== undefined && selectSubmits(page, form));

  return submits && form !== undefined ? { submitted: form } : { focus };
};

/**
 * Apply Space's native effect to the focused control.
 *
 * Space checks a radio, toggles a checkbox, types a space into a text control and activates a
 * submit button.
 *
 * @param page The walked tree.
 * @param state The control state, changed in place.
 * @param focus The focused element's visit.
 * @returns Focus unchanged, or the form Space submitted.
 */
const space = (page: Page, state: State, focus: Visit): Outcome => {
  const { form, kind } = focus;
  if (kind === "radio") {
    check(page, state, focus);
  }

  if (kind === "checkbox" && !state.checked.delete(focus.element)) {
    state.checked.add(focus.element);
  }

  type(state, focus, " ");

  return kind === "submit" && form !== undefined ? { submitted: form } : { focus };
};

/**
 * Apply one key's native effect.
 *
 * @param page The walked tree.
 * @param state The control state, changed in place.
 * @param focus The focused element's visit, `undefined` for none.
 * @param key The key pressed or the text typed.
 * @returns Where focus is after the key, or the form the key submitted.
 */
const press = (page: Page, state: State, focus: Visit | undefined, key: Key): Outcome => {
  switch (key) {
    case "Tab": {
      return { focus: move(page, state, focus, 1) };
    }
    case "Shift+Tab": {
      return { focus: move(page, state, focus, -1) };
    }
    case "ArrowDown":
    case "ArrowRight": {
      return { focus: focus?.kind === "radio" ? arrow(page, state, focus, 1) : focus };
    }
    case "ArrowLeft":
    case "ArrowUp": {
      return { focus: focus?.kind === "radio" ? arrow(page, state, focus, -1) : focus };
    }
    case "Enter": {
      return focus === undefined ? { focus } : enter(page, state, focus);
    }
    case "Space": {
      return focus === undefined ? { focus } : space(page, state, focus);
    }
    default: {
      if (focus?.kind === "select") {
        typeAhead(state, focus.element, key.type);
      } else if (focus !== undefined) {
        type(state, focus, key.type);
      }

      return { focus };
    }
  }
};

/**
 * Build the entry list a form posts under a control state.
 *
 * Its controls are taken in tree order, skipping disabled controls and controls with no `name`: a
 * checked radio or checkbox posts its `value` (`on` without one), a text `input` its value, a
 * `textarea` its value with every line break sent as CRLF, and a drop-down `select` its selected
 * option's value unless that option is disabled. The submit button itself is not posted.
 *
 * @param page The walked tree.
 * @param state The control state at submission.
 * @param form The submitted form.
 * @returns The form's entries.
 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-form-data-set
 */
const entriesOf = (page: Page, state: State, form: Element): readonly Entry[] =>
  page.visits.flatMap(({ element, form: owner, kind }): readonly Entry[] => {
    const name = attribute(element, "name") ?? "";
    if (owner !== form || name === "" || isDisabled(element)) {
      return [];
    }

    switch (kind) {
      case "checkbox":
      case "radio": {
        return state.checked.has(element) ? [[name, attribute(element, "value") ?? "on"]] : [];
      }
      case "select": {
        const option = state.selected.get(element);

        return option === undefined || isDisabled(option) ? [] : [[name, optionValue(option)]];
      }
      case "text": {
        return [[name, state.values.get(element) ?? ""]];
      }
      case "textarea": {
        return [[name, (state.values.get(element) ?? "").replaceAll("\n", "\r\n")]];
      }
      case "other":
      case "submit": {
        return [];
      }
      default: {
        return kind satisfies never;
      }
    }
  });

/**
 * List a tree's tab order: its sequentially focusable elements in document order.
 *
 * An element is a stop when {@link isFocusable} holds and its `tabindex` is not negative, so the
 * Status region's `tabindex="-1"` and disabled controls are skipped. A radio group, the radios
 * sharing one `name` and form, is one stop: its checked radio, else its first. A positive
 * `tabindex` does not reorder the stops; `checkTree` refuses one.
 *
 * @param tree The tree's root.
 * @returns The stops, in the order Tab visits them.
 * @see https://html.spec.whatwg.org/multipage/interaction.html#sequential-focus-navigation
 */
export const tabOrder = (tree: Element): readonly Element[] => {
  const page = pageOf(tree);

  return stopsOf(page, initialState(page)).map((visit) => visit.element);
};

/**
 * Run a script of keys over a tree and return the entries its form posts at the first submission.
 *
 * The walk models native browser behaviour as the HTML standard and the APG describe it, inferred
 * and not run in a browser (spec §4.8, R-2). Focus starts on the first focusable `autofocus`
 * element, else on nothing, and the initial state is read from the tree. Tab and Shift+Tab move
 * along {@link tabOrder}, recomputed from the current state. Arrow keys on a radio move to the next
 * or previous enabled radio of its group, wrapping, and check it. Space checks a radio, toggles a
 * checkbox and types a space into a text control. Typed text appends to a focused text `input` or
 * `textarea`, and on a focused drop-down `select` selects an option by type-ahead ({@link
 * typeAhead}). Enter adds a line feed in a `textarea`, submits from a text `input` by implicit
 * submission and from a drop-down `select` through its form's first enabled submit button ({@link
 * selectSubmits}). Enter or Space on a submit button submits its form. A form is the focused
 * control's nearest `form` ancestor; a control outside every form submits nothing. On a drop-down
 * `select`, ArrowDown, ArrowUp and Space open its list without changing the value, as measured in
 * Chromium and WebKit on macOS, so the walk leaves the value; ArrowLeft and ArrowRight leave it
 * too, unmeasured. Not modelled: a `select`'s open list, `multiple` and a
 * `size` above 1 (both `other`), `optgroup`, an `option`'s `label`, `a` activation, `fieldset
 * disabled`, `readonly`, `maxlength`, constraint validation, the submitter's own entry, Enter on a
 * focused radio or checkbox (a browser submits the form implicitly from those too; the walk leaves
 * focus where it is), and a named `hidden` input (a browser posts it; the walk's `other` kind posts
 * nothing).
 *
 * @param tree The tree's root.
 * @param keys The keys pressed, in order.
 * @returns The posted entries, in tree order, or `none` when the keys never submit.
 */
export const keyboardWalk = (
  tree: Element,
  keys: readonly Key[],
): Option.Option<readonly (readonly [string, string])[]> => {
  const page = pageOf(tree);
  const state = initialState(page);
  let focus = page.visits.find(
    (visit) =>
      attribute(visit.element, "autofocus") !== undefined && isFocusable(visit.element, tree),
  );
  for (const key of keys) {
    const outcome = press(page, state, focus, key);
    if ("submitted" in outcome) {
      return Option.some(entriesOf(page, state, outcome.submitted));
    }

    ({ focus } = outcome);
  }

  return Option.none();
};
