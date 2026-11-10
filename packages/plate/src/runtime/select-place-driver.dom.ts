/**
 * The select-then-place driver: the one DOM binding of the select-then-place protocol
 * (`runtime/select-place.dom.ts`) that every runtime controller of the family calls (Gap Match,
 * Graphic Gap Match, Associate, Order, Graphic Associate, Graphic Order and Position Object; issue
 * m3d-02).
 *
 * A controller hands it the elements the server rendered: the tokens, the targets, and a way to
 * find the placement an element inside a target shows. The driver binds the protocol's
 * {@link actionFor} key map and a single-pointer path over them (click a token, then click a target:
 * WCAG 2.5.7's alternative to dragging, acting on `click`, the up event, per 2.5.2), keeps each
 * token's toggle-button state (4.1.2), announces every step through the item's live region (4.1.3),
 * and reports the placements through {@link DriveOptions.onChange}. It never moves focus: while a
 * token is held, the arrow keys move a `data-cursor` attribute through the targets, and focus stays
 * where the user put it.
 *
 * The driver writes no markup beyond the attributes `tabindex`, `role`, `aria-pressed`,
 * `aria-disabled` and `data-cursor`; showing a placement inside its target, and writing the
 * response as hidden inputs, are the controller's, from `onChange`. Pointer dragging is not part of
 * it.
 *
 * @module
 */
import type { LiveRegion } from "#plate/runtime/announce.dom.ts";
import type { Teardown } from "#plate/runtime/contract.dom.ts";
import { actionFor, createSelectPlace } from "#plate/runtime/select-place.dom.ts";
import type { Placement, SelectPlaceState } from "#plate/runtime/select-place.dom.ts";

/**
 * A placement of rendered elements: a token element in a target element.
 */
type ElementPlacement = Placement<HTMLElement, HTMLElement>;

/**
 * What the select-then-place driver binds: one interaction's rendered tokens and targets, the
 * item's live region, and the controller's hooks. Tokens and targets are compared by identity.
 */
export interface DriveOptions {
  /**
   * The interaction's root; every listener the driver adds hangs from it, so a key pressed or a
   * click made anywhere under it reaches the protocol.
   */
  readonly root: HTMLElement;

  /**
   * The item's live region, the only place the driver announces.
   */
  readonly live: LiveRegion;

  /**
   * The tokens a user picks up, in the source, in reading order.
   */
  readonly tokens: readonly HTMLElement[];

  /**
   * The targets a held token can be placed in, in the order the arrow keys move through them.
   */
  readonly targets: readonly HTMLElement[];

  /**
   * Read the most placements a target holds.
   *
   * @param target A target.
   * @returns Its capacity, `Infinity` for none.
   */
  readonly capacity: (target: HTMLElement) => number;

  /**
   * Decide whether a token may be picked up now; by default every token may. A token it refuses is
   * `aria-disabled="true"`, and a key or a click on it does nothing and announces nothing.
   *
   * @param token A token.
   * @param placements The placements so far.
   * @returns False once the token is placed as often as its own limit allows.
   */
  readonly available?: (token: HTMLElement, placements: readonly ElementPlacement[]) => boolean;

  /**
   * The placements to start from, such as the ones the SSR restored; none for no placements.
   */
  readonly placements?: readonly ElementPlacement[];

  /**
   * Find the placement an element inside a target shows, for Delete, Backspace or a click on it,
   * which return it to the source. Without it, no placement can be returned.
   *
   * @param element The element the key was pressed on or the click landed on.
   * @returns The placement it shows, matched by its token and target, or `undefined` for none.
   */
  readonly placementOf?: (element: Element) => ElementPlacement | undefined;

  /**
   * Take the placements after each change to them: a placement made, or one returned to the
   * source. The controller writes them as hidden inputs and shows them.
   *
   * @param placements The placements, in the order they were made.
   */
  readonly onChange: (placements: readonly ElementPlacement[]) => void;

  /**
   * Read the name a token or a target is announced by; by default its `aria-label`, or else its
   * text with the white space collapsed.
   *
   * @param element A token or a target.
   * @returns Its name.
   */
  readonly label?: (element: HTMLElement) => string;
}

/**
 * The elements that take focus and act on Space and Enter by themselves, so the driver gives them
 * neither `tabindex` nor `role`.
 */
const nativelyFocusable = "a[href], area[href], button, input, select, summary, textarea";

/**
 * Read an element's accessible text: its `aria-label` when it has a non-empty one, or else its
 * text with the white space collapsed.
 *
 * @param element A token or a target.
 * @returns The text.
 */
const accessibleText = (element: HTMLElement): string => {
  const label = element.getAttribute("aria-label")?.trim() ?? "";

  return label === "" ? (element.textContent ?? "").replaceAll(/\s+/gu, " ").trim() : label;
};

/**
 * Admit every token: the availability of an interaction without a per-token limit.
 *
 * @returns True.
 */
const everyToken = (): boolean => true;

/**
 * Set an element's attribute back to a value it had, removing it when it had none.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @param value The value it had, `null` for none.
 */
const restore = (element: HTMLElement, name: string, value: string | null): void => {
  if (value === null) {
    element.removeAttribute(name);
  } else if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
};

/**
 * Bind the select-then-place protocol to rendered tokens and targets, without moving focus.
 *
 * A token not natively focusable gets `tabindex="0"` and `role="button"`, and every token gets
 * `aria-pressed`, `"true"` while held; a target not natively focusable gets `tabindex="0"`, so a
 * placed token shown inside it can be reached. Keys follow {@link actionFor}: the `source` context
 * on a token with nothing held, `holding` anywhere under the root while a token is held, and
 * `placed` on an element {@link DriveOptions.placementOf} resolves; a mapped key's default is
 * prevented, an unmapped one, or one with Alt, Control or Meta held, is left to the page. A `click`
 * on an available token picks it up (on the held token, cancels), on a target while holding moves
 * the cursor there and places, and on a placed token returns it. Calling `preventDefault` on a
 * mapped `keydown` stops a native button token's own click, so a key is never handled twice.
 *
 * @example
 *   const teardown = driveSelectPlace({
 *     capacity: (gap) => 1,
 *     live,
 *     onChange: (placements) => writeHidden(root, name, placements.map(pairOf)),
 *     root,
 *     targets: gaps,
 *     tokens: choices,
 *   });
 *
 * @param options The root, the tokens and targets, the live region and the controller's hooks.
 * @returns The teardown, which removes every listener and every attribute the driver added and
 *   restores any it changed, leaving the root as it was.
 */
export const driveSelectPlace = (options: DriveOptions): Teardown => {
  const { capacity, live, onChange, placementOf, root, targets, tokens } = options;
  const available = options.available ?? everyToken;
  const label = options.label ?? accessibleText;
  const machine = createSelectPlace<HTMLElement, HTMLElement>({
    capacity,
    live,
    onChange,
    placements: options.placements ?? [],
    targetLabel: label,
    targets,
    tokenLabel: label,
  });

  /**
   * The value each attribute the driver wrote had before it, by element and then by name, `null`
   * for an attribute the element did not have.
   */
  const originals = new Map<HTMLElement, Map<string, string | null>>();

  /**
   * Set an attribute, keeping the value it had before the driver first wrote it.
   *
   * @param element The element.
   * @param name The attribute's name.
   * @param value The value.
   */
  const write = (element: HTMLElement, name: string, value: string): void => {
    const kept = originals.get(element) ?? new Map<string, string | null>();

    if (!kept.has(name)) {
      kept.set(name, element.getAttribute(name));
    }

    originals.set(element, kept);

    if (element.getAttribute(name) !== value) {
      element.setAttribute(name, value);
    }
  };

  /**
   * Put an attribute the driver wrote back as it was; one it never wrote is left alone.
   *
   * @param element The element.
   * @param name The attribute's name.
   */
  const unwrite = (element: HTMLElement, name: string): void => {
    const value = originals.get(element)?.get(name);

    if (value !== undefined) {
      restore(element, name, value);
    }
  };

  /**
   * Show a state on the elements: which token is pressed, which tokens are disabled, and which
   * target the cursor is on.
   *
   * @param state The machine's state after a step.
   */
  const show = (state: SelectPlaceState<HTMLElement, HTMLElement>): void => {
    const held = state.phase === "holding" ? state.token : undefined;
    const cursor =
      state.phase === "holding" && state.cursor !== undefined
        ? targets.at(state.cursor)
        : undefined;

    for (const token of tokens) {
      write(token, "aria-pressed", token === held ? "true" : "false");

      if (available(token, state.placements)) {
        unwrite(token, "aria-disabled");
      } else {
        write(token, "aria-disabled", "true");
      }
    }

    for (const target of targets) {
      if (target === cursor) {
        write(target, "data-cursor", "");
      } else {
        unwrite(target, "data-cursor");
      }
    }
  };

  /**
   * Find the token an element is or sits in.
   *
   * @param element The event's target.
   * @returns The token, or `undefined` when the element is in none.
   */
  const tokenAt = (element: Element): HTMLElement | undefined =>
    tokens.find((token) => token.contains(element));

  /**
   * Find the target an element is or sits in.
   *
   * @param element The event's target.
   * @returns The target, or `undefined` when the element is in none.
   */
  const targetAt = (element: Element): HTMLElement | undefined =>
    targets.find((target) => target.contains(element));

  /**
   * Pick a token up if it is available now.
   *
   * @param token The token.
   * @param placements The placements so far.
   */
  const pickUpIfAvailable = (token: HTMLElement, placements: readonly ElementPlacement[]): void => {
    if (available(token, placements)) {
      show(machine.pickUp(token));
    }
  };

  /**
   * Act on a key while a token is held, through the `holding` context.
   *
   * @param key The event's `key`.
   * @returns Whether the key is mapped, so its default is prevented.
   */
  const holdingKey = (key: string): boolean => {
    const action = actionFor("holding", key);

    if (action === "cancel") {
      show(machine.cancel());
    } else if (action === "place") {
      show(machine.place());
    } else if (
      action === "first" ||
      action === "last" ||
      action === "next" ||
      action === "previous"
    ) {
      show(machine.move(action));
    }

    return action !== undefined;
  };

  /**
   * Act on a key with nothing held: through the `placed` context on an element showing a
   * placement, or the `source` context on a token.
   *
   * @param element The element the key was pressed on.
   * @param key The event's `key`.
   * @param placements The placements so far.
   * @returns Whether the key is mapped in its context, so its default is prevented.
   */
  const idleKey = (
    element: Element,
    key: string,
    placements: readonly ElementPlacement[],
  ): boolean => {
    const placement = placementOf?.(element);

    if (placement !== undefined && actionFor("placed", key) === "return") {
      show(machine.returnToSource(placement));

      return true;
    }

    const token = tokenAt(element);

    if (token !== undefined && actionFor("source", key) === "pickUp") {
      pickUpIfAvailable(token, placements);

      return true;
    }

    return false;
  };

  /**
   * Take a key pressed under the root.
   *
   * @param event The `keydown` event.
   */
  const onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !(event.target instanceof Element)
    ) {
      return;
    }

    const state = machine.state();
    const mapped =
      state.phase === "holding"
        ? holdingKey(event.key)
        : idleKey(event.target, event.key, state.placements);

    if (mapped) {
      event.preventDefault();
    }
  };

  /**
   * Take a click under the root: the single-pointer path.
   *
   * @param event The `click` event.
   */
  const onClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || !(event.target instanceof Element)) {
      return;
    }

    const element = event.target;
    const state = machine.state();
    const token = tokenAt(element);

    if (state.phase === "holding") {
      const target = targetAt(element);

      if (token === state.token) {
        show(machine.cancel());
      } else if (target !== undefined) {
        machine.moveTo(target);
        show(machine.place());
      } else if (token !== undefined) {
        pickUpIfAvailable(token, state.placements);
      }

      return;
    }

    const placement = placementOf?.(element);

    if (placement !== undefined) {
      show(machine.returnToSource(placement));
    } else if (token !== undefined) {
      pickUpIfAvailable(token, state.placements);
    }
  };

  for (const token of tokens) {
    if (!token.matches(nativelyFocusable)) {
      write(token, "tabindex", "0");
      write(token, "role", "button");
    }
  }

  for (const target of targets) {
    if (!target.matches(nativelyFocusable)) {
      write(target, "tabindex", "0");
    }
  }

  show(machine.state());
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("click", onClick);

  return () => {
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("click", onClick);

    for (const [element, kept] of originals) {
      for (const [name, value] of kept) {
        restore(element, name, value);
      }
    }

    originals.clear();
  };
};
