/**
 * The select-then-place protocol: the keyboard path of every interaction whose response puts tokens
 * into targets (Gap Match, Graphic Gap Match, Match, Associate, Order and their graphic kin), as
 * data and a state machine.
 *
 * A user picks a token up from the source, moves through the targets with the arrow keys, Home and
 * End, and places it, or cancels with Escape; a placed token goes back to the source with Delete or
 * Backspace. Every step is announced through the item's live region in the words of
 * {@link announcements}. A target holds at most its capacity of placements. The machine builds no
 * markup and reads no keys itself: an interaction's controller maps its keys through
 * {@link actionFor}, calls the machine, and writes {@link SelectPlaceOptions.onChange}'s placements
 * as hidden inputs (`runtime/wire.dom.ts`). Pointer dragging is not part of it.
 *
 * Its texts are English and local to this module (D7).
 *
 * @module
 */
import type { LiveRegion } from "#plate/runtime/announce.dom.ts";

/**
 * A move through the targets: to the next or previous one, wrapping at either end, or to the first
 * or last.
 */
export type Direction = "first" | "last" | "next" | "previous";

/**
 * What a key does in the protocol: pick up the focused token, move through the targets, place the
 * held token, cancel, or return a placed token to the source.
 */
export type KeyAction = Direction | "cancel" | "pickUp" | "place" | "return";

/**
 * Where the key is pressed: on a token in the source with nothing held, anywhere while a token is
 * held, or on a placed token.
 */
export type KeyContext = "holding" | "placed" | "source";

/**
 * The key map, by context and then by `KeyboardEvent.key`: Space or Enter on a token picks it up;
 * while holding, ArrowRight and ArrowDown move to the next target, ArrowLeft and ArrowUp to the
 * previous, Home to the first and End to the last, Enter or Space places and Escape cancels; Delete
 * or Backspace on a placed token returns it to the source.
 */
export const keyMap = {
  holding: {
    " ": "place",
    ArrowDown: "next",
    ArrowLeft: "previous",
    ArrowRight: "next",
    ArrowUp: "previous",
    End: "last",
    Enter: "place",
    Escape: "cancel",
    Home: "first",
  },
  placed: { Backspace: "return", Delete: "return" },
  source: { " ": "pickUp", Enter: "pickUp" },
} as const satisfies Readonly<Record<KeyContext, Readonly<Record<string, KeyAction>>>>;

/**
 * Look a key up in the {@link keyMap}.
 *
 * @param context Where the key is pressed.
 * @param key The event's `key`.
 * @returns The action, or `undefined` for a key the protocol leaves to the page.
 */
export const actionFor = (context: KeyContext, key: string): KeyAction | undefined => {
  const keys: Readonly<Record<string, KeyAction>> = keyMap[context];

  return Object.hasOwn(keys, key) ? keys[key] : undefined;
};

/**
 * The protocol's announcements, English, each given the token's and the target's names as the
 * interaction labels them.
 */
export const announcements = {
  cancelled: (token: string): string => `Cancelled. ${token} is back in the source.`,
  full: (target: string): string => `${target} is full.`,
  moved: (target: string, n: number, of: number): string => `${target}, ${n} of ${of}.`,
  pickedUp: (token: string): string =>
    `Picked up ${token}. Use the arrow keys to choose a target, Enter to place, Escape to cancel.`,
  placed: (token: string, target: string): string => `${token} placed in ${target}.`,
  returned: (token: string): string => `${token} returned to the source.`,
} as const;

/**
 * One token in one target.
 */
export interface Placement<Token, Target> {
  readonly target: Target;
  readonly token: Token;
}

/**
 * Where the protocol stands: nothing held, or a token held with the target the cursor is on, none
 * until the first move. The placements are the response so far either way.
 */
export type SelectPlaceState<Token, Target> =
  | {
      readonly phase: "idle";
      readonly placements: readonly Placement<Token, Target>[];
    }
  | {
      readonly cursor: number | undefined;
      readonly phase: "holding";
      readonly placements: readonly Placement<Token, Target>[];
      readonly token: Token;
    };

/**
 * What a select-then-place machine works over. Tokens and targets are compared by identity.
 */
export interface SelectPlaceOptions<Token, Target> {
  /**
   * The most placements a target holds.
   *
   * @param target A target.
   * @returns Its capacity, `Infinity` for none.
   */
  readonly capacity: (target: Target) => number;

  /**
   * The name a token is announced by.
   *
   * @param token A token.
   * @returns Its accessible name.
   */
  readonly tokenLabel: (token: Token) => string;

  /**
   * The name a target is announced by.
   *
   * @param target A target.
   * @returns Its accessible name.
   */
  readonly targetLabel: (target: Target) => string;
  readonly live: LiveRegion;

  /**
   * Take the response after each change to it: a placement made, or one returned to the source.
   * The interaction's controller writes them as hidden inputs here.
   *
   * @param placements The placements, in the order they were made.
   */
  readonly onChange?: (placements: readonly Placement<Token, Target>[]) => void;

  /**
   * The response the machine starts from, such as a restored one; none for no placements.
   */
  readonly placements?: readonly Placement<Token, Target>[];

  /**
   * The targets in the order the arrow keys move through them.
   */
  readonly targets: readonly Target[];
}

/**
 * A running select-then-place machine. Each step returns the state after it; a step the state does
 * not admit (a move with nothing held, a place before any move) changes nothing and announces
 * nothing.
 */
export interface SelectPlace<Token, Target> {
  /**
   * Cancel the held token: it goes back to the source and the placements are unchanged.
   *
   * @returns The state after the step.
   */
  readonly cancel: () => SelectPlaceState<Token, Target>;

  /**
   * Move the cursor through the targets while a token is held, and announce the target reached.
   *
   * @param direction The move.
   * @returns The state after the step.
   */
  readonly move: (direction: Direction) => SelectPlaceState<Token, Target>;

  /**
   * Pick a token up from the source, replacing any token held.
   *
   * @param token The token.
   * @returns The state after the step.
   */
  readonly pickUp: (token: Token) => SelectPlaceState<Token, Target>;

  /**
   * Place the held token in the target under the cursor; a full target refuses it, announcing so,
   * and the token stays held.
   *
   * @returns The state after the step.
   */
  readonly place: () => SelectPlaceState<Token, Target>;

  /**
   * Return a placed token to the source.
   *
   * @param placement The placement to undo, matched by its token and target.
   * @returns The state after the step.
   */
  readonly returnToSource: (placement: Placement<Token, Target>) => SelectPlaceState<Token, Target>;

  /**
   * Read the state.
   *
   * @returns The current state.
   */
  readonly state: () => SelectPlaceState<Token, Target>;
}

/**
 * Find the target index a move lands on.
 *
 * @param direction The move.
 * @param cursor The index the cursor is on, none before the first move.
 * @param count The number of targets, at least 1.
 * @returns The index: `next` from none is the first and `previous` from none the last, and both
 *   wrap at the ends.
 */
const landing = (direction: Direction, cursor: number | undefined, count: number): number => {
  if (direction === "first") {
    return 0;
  }

  if (direction === "last") {
    return count - 1;
  }

  const step = direction === "next" ? 1 : -1;

  if (cursor === undefined) {
    return step === 1 ? 0 : count - 1;
  }

  return (cursor + step + count) % count;
};

/**
 * Start a select-then-place machine over some targets, idle, with the given placements.
 *
 * @example
 *   const machine = createSelectPlace({
 *     capacity: () => 1,
 *     live: liveRegionOf(item),
 *     onChange: (placements) => writeHidden(root, name, placements.map(pairOf)),
 *     targetLabel: (gap) => gap.label,
 *     targets: gaps,
 *     tokenLabel: (choice) => choice.label,
 *   });
 *
 * @param options The targets, their capacities and names, the live region and the change hook.
 * @returns The machine.
 */
export const createSelectPlace = <Token, Target>(
  options: SelectPlaceOptions<Token, Target>,
): SelectPlace<Token, Target> => {
  const { capacity, live, onChange, targetLabel, targets, tokenLabel } = options;
  let current: SelectPlaceState<Token, Target> = {
    phase: "idle",
    placements: options.placements ?? [],
  };

  /**
   * Make a state current and hand it back.
   *
   * @param next The new state.
   * @returns The new state.
   */
  const become = (next: SelectPlaceState<Token, Target>): SelectPlaceState<Token, Target> => {
    current = next;

    return next;
  };

  return {
    cancel: () => {
      if (current.phase !== "holding") {
        return current;
      }

      live.announce(announcements.cancelled(tokenLabel(current.token)));

      return become({ phase: "idle", placements: current.placements });
    },
    move: (direction) => {
      if (current.phase !== "holding" || targets.length === 0) {
        return current;
      }

      const cursor = landing(direction, current.cursor, targets.length);
      const target = targets.at(cursor);

      if (target === undefined) {
        return current;
      }

      live.announce(announcements.moved(targetLabel(target), cursor + 1, targets.length));

      return become({ ...current, cursor });
    },
    pickUp: (token) => {
      live.announce(announcements.pickedUp(tokenLabel(token)));

      return become({ cursor: undefined, phase: "holding", placements: current.placements, token });
    },
    place: () => {
      if (current.phase !== "holding" || current.cursor === undefined) {
        return current;
      }

      const target = targets.at(current.cursor);

      if (target === undefined) {
        return current;
      }

      const held = current.placements.filter((placement) => placement.target === target).length;

      if (held >= capacity(target)) {
        live.announce(announcements.full(targetLabel(target)));

        return current;
      }

      const placements = [...current.placements, { target, token: current.token }];

      live.announce(announcements.placed(tokenLabel(current.token), targetLabel(target)));
      onChange?.(placements);

      return become({ phase: "idle", placements });
    },
    returnToSource: (placement) => {
      const index = current.placements.findIndex(
        ({ target, token }) => target === placement.target && token === placement.token,
      );

      if (index === -1) {
        return current;
      }

      const placements = current.placements.toSpliced(index, 1);

      live.announce(announcements.returned(tokenLabel(placement.token)));
      onChange?.(placements);

      return become({ ...current, placements });
    },
    state: () => current,
  };
};
