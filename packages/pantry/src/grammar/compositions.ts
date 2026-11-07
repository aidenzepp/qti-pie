/**
 * The channel each composition of a vocabulary list is announced on.
 *
 * `compose` publishes the list it is given before its first generator runs, so a subscriber counts
 * the compositions its process makes, and which lists they were, without reading a generator. This
 * module imports only Node's channel, so a subscriber attaches before the first composition at no
 * cost: the test support's counter does, in every test file, before the file's imports load
 * (`src/test/compositions.ts`).
 */
import { channel } from "node:diagnostics_channel";

/**
 * The composition channel: each message is the vocabulary list one `compose` call composes, the
 * same object the caller passed. Nothing in production subscribes, and a channel with no subscriber
 * does nothing on `publish`.
 *
 * @see https://nodejs.org/api/diagnostics_channel.html
 */
export const compositions = channel("@qti-pie/pantry:grammar:compose");
