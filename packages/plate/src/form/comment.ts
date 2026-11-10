/**
 * The one mapping between an item's candidate comment and its form entry: the name the comment
 * posts under, and the text a posted entry decodes to.
 *
 * A comment posts under its item's instance, as the item's responses do, so `partition` of
 * `#plate/form/encoding.ts`, given the instance, calls the comment entry its own, and
 * {@link decodeComment} reads it by its own name.
 *
 * @module
 */
import { Array, Option } from "effect";
import type { Entry } from "#plate/form/encoding.ts";

/**
 * Name the form entry an item's candidate comment posts under.
 *
 * @param instance The item instance token.
 * @returns `<instance>.comment`.
 */
export const commentName = (instance: string): string => `${instance}.comment`;

/**
 * Decode the comment posted for an item.
 *
 * Only the entry named {@link commentName} of `instance` is read; every other entry, another
 * item's comment included, is ignored. The text is read as it was posted, with no trimming.
 *
 * @param entries The posted entries.
 * @param instance The item instance token.
 * @returns The comment, or none when no entry is named for the item, when more than one is, or
 *   when it is a file.
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
