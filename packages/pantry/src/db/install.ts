/**
 * A package-media policy file, `policy.json`, as an application keeps it: the extensions a player
 * may fetch, each with the media type the application serves its files with. Each entry is one
 * `MediaType` row of the package-media level (`#pantry/qti/media.ts`), which states the same two
 * laws: one type per extension, and one extension per type.
 */
import { Array as Arr, Schema } from "effect";

/**
 * A file extension a media policy lists: lowercase ASCII letters and digits, at most 127, without
 * its dot, as an entry's path writes it after its last `.` (`photo.jpg` is `jpg`). An extension
 * matches as written, so a policy lists one spelling of each and a path in another case is
 * refused.
 */
export const MediaExtension = Schema.String.check(
  Schema.isPattern(/^[a-z0-9]{1,127}$/u, {
    message:
      "Write an extension in lowercase ASCII letters and digits, at most 127, without its dot, such as svg or jpg",
  }),
);

/**
 * The media type a policy serves an extension's files with, as an HTTP `Content-Type` names it: a
 * type and a subtype, each a restricted name (RFC 6838, §4.2), in lower case, the form the
 * registry writes, with no parameter.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc6838#section-4.2 | RFC 6838, §4.2 Naming Requirements}
 */
export const MediaType = Schema.String.check(
  Schema.isPattern(/^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$/u, {
    message:
      "Write a media type in lower case as a type and a subtype with no parameter, such as image/svg+xml (RFC 6838, §4.2)",
  }),
);

/**
 * Find the media types a roster lists under more than one extension, each with those extensions.
 *
 * @param media - The roster.
 * @returns One message per such type; none where each type has one extension.
 */
const typesSpelledTwice = (media: Readonly<Record<string, string>>): readonly string[] =>
  Object.entries(Arr.groupBy(Object.entries(media), ([, type]) => type)).flatMap(([type, listed]) =>
    listed.length > 1
      ? [
          `${type} is listed under ${listed.map(([extension]) => extension).join(", ")}: list each media type under one extension, the one spelling its files use`,
        ]
      : [],
  );

/**
 * An install's policy, `policy.json`: exactly `{ "media": { "<extension>": "<type>/<subtype>", ...
 * } }`, the one closed record of the extensions a player may fetch, each with the media type the
 * install serves its files with, each entry one row of `MediaType` (`#pantry/qti/media.ts`), which
 * holds the same two laws: one type per extension, and one extension per type. It lists at least
 * one extension, and each media type under one extension, its one spelling: a policy that lists
 * `jpg` for `image/jpeg` lists no `jpeg`.
 */
export const MediaPolicySchema = Schema.Struct({
  media: Schema.Record(MediaExtension, MediaType).check(
    Schema.isMinProperties(1, {
      message: 'List at least one extension, such as { "svg": "image/svg+xml" }',
    }),
    Schema.makeFilter(typesSpelledTwice),
  ),
});
