/**
 * The one mapping between a candidate's comment and its form entry: the name the comment posts
 * under and the text a posted entry decodes to.
 *
 * A comment posts under the instance of the item it belongs to, as an item's responses do, so
 * `partition` of `#plate/form/encoding.ts`, given that instance, calls the comment entry the
 * item's own, as it calls `<instance>.intent` the own entry of that instance. {@link decodeComment}
 * reads the entry by its own name, and a host passes what it reads as `Step.comment`.
 *
 * @module
 */
import { Array, Option } from "effect";
import type { Entry } from "#plate/form/encoding.ts";

/**
 * Name the form entry an item's comment posts under.
 *
 * @param instance The item's instance token.
 * @returns `<instance>.comment`.
 */
export const commentName = (instance: string): string => `${instance}.comment`;

/**
 * Decode the comment posted for an item.
 *
 * Only the entry named {@link commentName} of `instance` is read; every other entry, another
 * item's comment included, is ignored. The text is kept as posted, with no trimming: whether a
 * blank comment is kept is the comment module's to decide.
 *
 * @param entries The posted entries.
 * @param instance The item's instance token.
 * @returns The comment's text, or none when no entry is named for the item, when more than one is,
 *   or when it is a file.
 */
export const decodeComment = (
  entries: readonly Entry[],
  instance: string,
): Option.Option<string> => {
  const name = commentName(instance);
  const posted = entries.filter(([entry]) => entry === name).map(([, value]) => value);
  const texts = posted.filter((value): value is string => typeof value === "string");

  return posted.length === 1 ? Array.head(texts) : Option.none();
};
