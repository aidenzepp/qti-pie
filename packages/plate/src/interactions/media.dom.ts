/**
 * Media's (Q-14, the `media` kind) runtime controller: it counts the candidate's plays of the
 * author's native `audio` or `video` into the response's one hidden input, and stops a play past
 * `max-plays`.
 *
 * The author's media element, its controls and its captions are the SSR's and stay the browser's,
 * so the controller builds no player, never overrides `controls`, never starts playback (it only
 * pauses a play the limit forbids) and never moves focus. A play is a playback begun from rest
 * (issue ei-03b): the media is at rest before its first playback and again after `ended`, and a
 * `play` event while it is at rest begins a playback and counts one, wherever the candidate had
 * seeked to. A `play` after a `pause` of the same playback, with no `ended` between, is a resume,
 * wherever the position, and counts nothing. A looping media counts each wrap of the loop as one
 * more. A media that was already playing when the page upgraded, as `autoplay` may have made it,
 * counts once if it began within its first second. The count continues from the one the SSR
 * restored in the hidden input, and is written back after every counted play.
 *
 * The limit is `data-max-plays` on the Root, 0 for none. Past it a `play` begun from rest is
 * paused at once and the item's live region says so (WCAG 4.1.3); a play the limit paused began no
 * playback, so the media is still at rest and the next press is paused and announced again; the
 * last allowed play of a looping media is not looped, so it ends instead of wrapping into a play
 * past the limit, and teardown gives `loop` back as the author's element had it. `data-min-plays`,
 * the least count, is the server's check under `validateResponses` and is not read here.
 *
 * Only an answering, unfinished interaction is upgraded: in review and solution, and when the
 * author finished the item, the media plays freely and posts nothing. A Root without its entry
 * name or its media element is left as the SSR wrote it.
 *
 * @module
 */
import type { Controller, LiveRegion, Teardown } from "#plate/runtime/contract.dom.ts";
import { entryNameOf, readHidden, writeHidden } from "#plate/runtime/wire.dom.ts";

/**
 * The author's media element inside the Root's media part: the Prompt may hold media of its own,
 * which is never the one counted.
 */
const mediaSelector = '[data-slot="media-interaction-media"] :is(audio, video)';

/**
 * How far into its first seconds a media already playing at upgrade may be and count as begun from
 * rest: an `autoplay` the browser began before the script ran.
 */
const underway = 1;

/**
 * How near the end, in seconds, the last tick before a looping media's position drops back to the
 * start may be for the drop to be the loop wrapping, not a seek: a `timeupdate` comes about every
 * quarter second.
 */
const wrapWindow = 1;

/**
 * The teardown of an upgrade that attached nothing.
 */
const noTeardown: Teardown = (): void => undefined;

/**
 * Read a whole number the SSR wrote, such as `data-max-plays` or the count in the hidden input.
 *
 * @param written The text, none when the SSR wrote none.
 * @returns The number, 0 for none or text that is no positive whole number.
 */
const wholeNumber = (written: string | undefined): number => {
  const parsed = Math.trunc(Number(written ?? ""));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/**
 * Write the announcement of a limit reached, in English (decision D7).
 *
 * @param limit The most plays allowed.
 * @returns The text the live region says.
 */
const limitReached = (limit: number): string =>
  `The limit of ${limit} ${limit === 1 ? "play" : "plays"} has been reached, so the media cannot be played again.`;

/**
 * Tell whether a Root takes answers: it is rendered for answering and the author did not finish
 * the item. In review and solution the media plays freely and posts nothing.
 *
 * @param root The interaction's root.
 * @returns Whether its plays are counted.
 */
const isAnswering = (root: HTMLElement): boolean =>
  (root.dataset["mode"] ?? "answering") === "answering" && root.dataset["disabled"] === undefined;

/**
 * Attach the play count and the limit to one media element.
 *
 * @param root The interaction's root, which holds the hidden input and carries `data-max-plays`.
 * @param live The item's live region, which says that the limit was reached.
 * @param name The entry name the hidden input posts under.
 * @param media The author's `audio` or `video`.
 * @returns The teardown that removes every listener and gives `loop` back as the author wrote it.
 */
const attach = (
  root: HTMLElement,
  live: LiveRegion,
  name: string,
  media: HTMLMediaElement,
): Teardown => {
  const limit = wholeNumber(root.dataset["maxPlays"]);
  const listeners = new AbortController();
  const { signal } = listeners;
  const authoredLoop = media.loop;
  let count = wholeNumber(readHidden(root, name)[0]);
  let lastTime = 0;
  let adopted = false;
  let begun = false;

  /**
   * Tell whether the count has reached the limit, so the next play is past it.
   *
   * @returns Whether a limit is set and the count meets it.
   */
  const spent = (): boolean => limit > 0 && count >= limit;

  /**
   * Take the loop off a media whose limit is reached, so its last play ends instead of wrapping
   * into one more.
   */
  const stopLooping = (): void => {
    if (spent() && media.loop) {
      media.loop = false;
    }
  };

  /**
   * Count one play, write the count as the hidden input, and mark a playback as underway, so a
   * `play` event before the next `ended` is a resume.
   */
  const record = (): void => {
    count += 1;
    begun = true;
    writeHidden(root, name, [String(count)]);
    stopLooping();
  };

  /**
   * Begin a play from rest: count it, or, with the limit reached, pause it at once and say so. A
   * play the limit paused began no playback, so the media stays at rest.
   */
  const start = (): void => {
    lastTime = media.currentTime;

    if (spent()) {
      media.pause();
      live.announce(limitReached(limit));

      return;
    }

    record();
  };

  media.addEventListener(
    "play",
    () => {
      if (adopted) {
        adopted = false;

        return;
      }

      if (!begun) {
        start();
      }
    },
    { signal },
  );
  media.addEventListener(
    "pause",
    () => {
      adopted = false;
    },
    { signal },
  );
  media.addEventListener(
    "ended",
    () => {
      adopted = false;
      begun = false;
      lastTime = 0;
    },
    { signal },
  );
  media.addEventListener(
    "timeupdate",
    () => {
      const time = media.currentTime;
      const wrapped = media.loop && time < lastTime && lastTime >= media.duration - wrapWindow;

      adopted = false;
      lastTime = time;

      if (wrapped) {
        record();
      }
    },
    { signal },
  );

  stopLooping();

  if (!media.paused && !media.ended && media.currentTime < underway) {
    adopted = true;
    start();
  }

  return () => {
    listeners.abort();

    if (media.loop !== authoredLoop) {
      media.loop = authoredLoop;
    }
  };
};

/**
 * Media's (Q-14, the `media` kind) controller: it counts plays into the hidden input and holds
 * `max-plays`, on an answering Root that names its entry and holds the author's `audio` or
 * `video`, and attaches nothing to any other.
 */
export const controller: Controller<"media"> = {
  implemented: true,
  kind: "media",
  upgrade: (root, live) => {
    const name = entryNameOf(root);
    const media = root.querySelector<HTMLMediaElement>(mediaSelector);

    return name === undefined || media === null || !isAnswering(root)
      ? noTeardown
      : attach(root, live, name, media);
  },
};
