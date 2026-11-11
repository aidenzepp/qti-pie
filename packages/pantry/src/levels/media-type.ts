/**
 * The package-media level's type rule, `MediaType`: every entry a fetched field resolves to has an
 * extension the app's roster lists, so the app can serve each with the media type the roster gives
 * it. The extension is the text after the last `.` of the path's last segment, where that `.` is
 * not the segment's first character, as Node's `path.posix.extname` reads that segment, so a path
 * that ends with `/` has none; matched case-sensitively, so `photo.JPG` and `photo.jpeg` are
 * refused under a roster that lists `jpg` ({@link typedPathPattern}).
 *
 * The rule reads the resolved path, `ReferencePath.path` or `TextReferencePath.path`, which
 * `file-exists` holds to be the entry's own, of every field `MediaPath` selects
 * (`#pantry/levels/media-path.ts`): a fetched attribute by its name under a governor or on an
 * element of a kind that fetches it, a fetched text by its governor or kind. A manifest's `href`,
 * an item, section or stimulus ref's, an `xi:include`'s, a link's and every other reference that
 * names a document rather than fetched media stays `file-exists`'s alone, whatever its extension.
 *
 * The rule is stated at the `Media` level (`packageMedia`, `#pantry/levels/media.ts`), never as a
 * law of `Qti`: two derived relations over `Qti` select the resolved paths, and a `MediaType` check
 * over each judges them by the roster's pattern.
 *
 * @see {@link https://nodejs.org/api/path.html#pathextnamepath | Node.js, path.extname}
 */
import { check, Compute, derived, query, v } from "@bjornpagen/grizzle";
import { mediaFetchedNames, mediaTextGovernors } from "#pantry/levels/media-path.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Node } from "#pantry/qti/node.ts";
import { ReferencePath, TextReferencePath } from "#pantry/qti/package.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";
import { fetchedTexts } from "#pantry/vocab/fetched.ts";

/**
 * Write the pattern of a path whose extension a roster lists: a character of its last segment other
 * than `/`, so the `.` is not the segment's first, then the `.` and one of the extensions, at the
 * end. An extension is lowercase letters and digits (`MediaExtension` of
 * `#pantry/levels/media.ts`), so it holds no `.` or `/` and no character a pattern reads as an
 * operator, and the `.` before it is the last of the segment. The extensions are sorted, so a
 * roster gives one pattern however its keys are ordered.
 *
 * @param extensions - The roster's extensions, at least one, as the level's options decode them.
 * @returns The pattern's source, read under the flag `u`.
 */
export const typedPathPattern = (extensions: readonly string[]): string =>
  String.raw`[^/]\.(?:${extensions.toSorted().join("|")})$`;

/**
 * Select, over a base level, the resolved paths of the fetched attributes: each `ReferencePath` of
 * an attribute `MediaPath` selects, by its element and name, with its path.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const fetchedPathsOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { governor, kind, name, node } = v(Attribute, "attribute");
    const { path } = v(ReferencePath, "resolved");

    return r
      .match(Attribute, { governor, kind, name, node })
      .match(ReferencePath, { name, node, path })
      .where(
        r.or(
          ...mediaFetchedNames.map((fetched) =>
            r.and(
              r.eq(name, fetched.name),
              r.or(r.inSet(governor, fetched.governors), r.inSet(kind, fetched.kinds)),
            ),
          ),
        ),
      )
      .find({ name, node, path });
  });

/**
 * Select, over a base level, the resolved paths of the fetched texts: each `TextReferencePath` of a
 * node under a governor whose text is fetched or of a kind whose text is, with its path.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const fetchedTextPathsOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { governor, id, kind } = v(Node, "node");
    const { path } = v(TextReferencePath, "resolved");

    return r
      .match(Node, { governor, id, kind })
      .match(TextReferencePath, { node: id, path })
      .where(r.or(r.inSet(governor, mediaTextGovernors), r.inSet(kind, fetchedTexts)))
      .find({ node: id, path });
  });

/**
 * Build the type rule for one base level and roster: the derived relations over the base it judges,
 * by name, and a `MediaType` check over each, holding its path to {@link typedPathPattern}.
 *
 * - `MediaFetchedPath`: the resolved paths of the fetched attributes;
 * - `MediaFetchedTextPath`: the resolved paths of the fetched texts.
 *
 * A path is `keyText`, whose type bounds its bytes within what PostgreSQL's regular expressions
 * read, so grizzle compiles the match in the trigger's violation query.
 *
 * @param base - The level the derived relations read, pantry's `Qti`.
 * @param extensions - The roster's extensions, at least one.
 * @returns The relations and statements the rule adds to the `Media` level.
 */
export const mediaTypeRule = (base: QtiSchema, extensions: readonly string[]) => {
  const typed = Compute.pattern(typedPathPattern(extensions));
  const MediaFetchedPath = derived("MediaFetchedPath", fetchedPathsOf(base));
  const MediaFetchedTextPath = derived("MediaFetchedTextPath", fetchedTextPathsOf(base));

  return {
    relations: { MediaFetchedPath, MediaFetchedTextPath },
    statements: [
      check("MediaType", MediaFetchedPath, (p) => Compute.matches(p.path, typed)),
      check("MediaType", MediaFetchedTextPath, (p) => Compute.matches(p.path, typed)),
    ] as const,
  };
};
