/**
 * The host's permission to show an item's feedback in a test session, derived once so no host
 * reads the item's `show-feedback` by hand.
 *
 * @module
 */
import type { ItemView } from "#plate/session/start.ts";

/**
 * Decide whether the host lets an item's feedback show now: true while the item is open, and the
 * item's `show-feedback` once it is closed, whichever way it closed (its attempt limit reached, its
 * part ended, its timed scope expired or the test closed).
 *
 * The `show-feedback` it reads is the view's own: the configuration the view carries has the item's
 * session control written in, the nearest `qti-item-session-control` that sets it, so it follows
 * the test, not the host's configuration. It is the `feedback` option `redact` takes, and the
 * `feedback.shown` fact a feedback module's `redact` reads from the kit.
 *
 * @example
 *   redact(document, view.record, view.configuration, { feedback: feedbackShown(view) });
 *
 * @param view The item's view, as `itemView` or `current` gives it.
 * @returns Whether feedback may show: true for an open item, the item's `show-feedback` for a
 *   closed one.
 */
export const feedbackShown = (view: ItemView): boolean =>
  view.disabled ? view.configuration.showFeedback : true;
