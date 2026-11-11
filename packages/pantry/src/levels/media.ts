/**
 * The package-media level, {@link packageMedia}: a level over pantry's `Qti` whose laws refuse a
 * package that would make a player fetch anything but a file of the package whose extension the
 * app's roster lists, or that holds a file nothing fetches. An app serves each file of the package
 * itself, wherever it keeps them, with the media type the roster gives its extension.
 *
 * The level is refuse-only by construction: `schema.extend` adds relations and laws over its base
 * and takes none of the base's away, so a package the level accepts is one `Qti` accepts (GOAL G4).
 * Its six rules are policy, not QTI: they live outside `docs/spec-readings.md` and pantry's law
 * table, each in a module of its own, stated as derived relations over `Qti` and checks over them
 * (GOAL L3). Three are its own, `MediaPath`, `MediaType` and `MediaEntryUsed`; the other three are
 * the single-CDN level's data, style and foreign-markup rules, stated once for any level and named
 * for this one, `MediaData`, `MediaStyle` and `MediaForeign` (`#pantry/levels/cdn-data.ts`,
 * `cdn-style.ts` and `cdn-foreign.ts`). A refusal by one of them names level `Media` and the
 * check's name.
 */
import { schema } from "@bjornpagen/grizzle";
import { Array as Arr, Schema } from "effect";
import { dataRule } from "#pantry/levels/cdn-data.ts";
import { foreignRule } from "#pantry/levels/cdn-foreign.ts";
import { styleRule } from "#pantry/levels/cdn-style.ts";
import { mediaEntryUsedRule } from "#pantry/levels/media-entry-used.ts";
import { mediaPathRule } from "#pantry/levels/media-path.ts";
import { mediaTypeRule } from "#pantry/levels/media-type.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * A file extension the roster lists: lowercase ASCII letters and digits, without its dot, as an
 * entry's path writes it after its last `.` (`photo.jpg` is `jpg`). An extension matches as
 * written, so a roster lists one spelling of each and a path in another case is refused.
 */
const MediaExtension = Schema.String.check(
  Schema.isPattern(/^[a-z0-9]+$/u, {
    message:
      "Write an extension in lowercase ASCII letters and digits, without its dot, such as svg or jpg",
  }),
);

/**
 * The media type an app serves an extension's files with, as an HTTP `Content-Type` names it: a
 * type and a subtype, each a restricted name (RFC 6838, §4.2), in lower case, the form the
 * registry writes, with no parameter.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc6838#section-4.2 | RFC 6838, §4.2 Naming Requirements}
 */
const MediaContentType = Schema.String.check(
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
 * The options {@link packageMedia} builds the level with: `{ media: { <extension>: <media type> }
 * }`, the one closed record of the extensions a player may fetch, each with the media type the app
 * serves its files with. It lists at least one extension, and each media type under one extension,
 * its one spelling: a roster that lists `jpg` for `image/jpeg` lists no `jpeg`. Decode a caller's
 * options with it, with `onExcessProperty: "error"` to refuse a key beside `media`, before building
 * the level; {@link packageMedia} itself trusts its argument.
 */
export const MediaOptions = Schema.Struct({
  media: Schema.Record(MediaExtension, MediaContentType).check(
    Schema.isMinProperties(1, {
      message: 'List at least one extension, such as { "svg": "image/svg+xml" }',
    }),
    Schema.makeFilter(typesSpelledTwice),
  ),
});

/**
 * Extend a base level with the `Media` level for one roster's extensions: the six rules' derived
 * relations, by name, and their checks.
 *
 * @param base - The level the rules read, pantry's `Qti`.
 * @param extensions - The roster's extensions, at least one.
 * @returns The `Media` level over the base.
 */
const buildMedia = (base: QtiSchema, extensions: readonly string[]) => {
  const rules = {
    data: dataRule(base, "Media"),
    entryUsed: mediaEntryUsedRule(base),
    foreign: foreignRule(base, "Media"),
    path: mediaPathRule(base),
    style: styleRule(base, "Media"),
    type: mediaTypeRule(base, extensions),
  };

  return schema.extend(
    base,
    "Media",
    {
      ...rules.path.relations,
      ...rules.type.relations,
      ...rules.entryUsed.relations,
      ...rules.data.relations,
      ...rules.style.relations,
      ...rules.foreign.relations,
    },
    [
      ...rules.path.statements,
      ...rules.type.statements,
      ...rules.entryUsed.statements,
      ...rules.data.statements,
      ...rules.style.statements,
      ...rules.foreign.statements,
    ],
  );
};

/**
 * The package-media level, as {@link packageMedia} returns it: a level over `Qti` that an
 * application's own level may extend.
 */
export type MediaLevel = ReturnType<typeof buildMedia>;

/**
 * The levels {@link packageMedia} has built, by base and then by the roster's extensions, sorted
 * and joined by a space, which no extension holds.
 */
const built = new WeakMap<QtiSchema, Map<string, MediaLevel>>();

/**
 * Build the package-media level over a base level, once per base and set of extensions: the same
 * base and extensions give the same level value, so every level built over it meets one schema. The
 * roster's media types are the app's to serve with and state no law, so two rosters that list the
 * same extensions give one level.
 *
 * @param base - The level the media rules read, pantry's `Qti` (`qti()`).
 * @param options - The level's options, decoded with {@link MediaOptions}.
 * @returns The `Media` level over the base.
 */
export const packageMedia = (base: QtiSchema, options: typeof MediaOptions.Type): MediaLevel => {
  const extensions = Object.keys(options.media).toSorted();
  const key = extensions.join(" ");
  const byRoster = built.get(base) ?? new Map<string, MediaLevel>();
  built.set(base, byRoster);

  const known = byRoster.get(key);
  if (known !== undefined) {
    return known;
  }

  const level = buildMedia(base, extensions);
  byRoster.set(key, level);

  return level;
};
