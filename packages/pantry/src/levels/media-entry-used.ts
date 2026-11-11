/**
 * The package-media level's entry rule, `MediaEntryUsed`: every entry of a package is the manifest,
 * a document (`Document`), or the path a reference resolves to in the package (`ReferencePath`) or
 * a text reference does (`TextReferencePath`). `file-exists` holds every resolved path to an entry,
 * so under this rule the package's files and what its documents name match one to one, and a file
 * nothing names, a stray schema or an unused picture, is refused, so an app serves no file nothing
 * fetches.
 *
 * It is the level's and not `Qti`'s own: IMS Content Packaging 1.2 has every file a manifest or a
 * document names be in the package, never the reverse, and QTI packages list files no document
 * references (the 1EdTech examples list their XSDs and unused media), so `Qti` keeps them, as the
 * spec readings read the specifications. An app that serves only what its items name states it
 * with this level, and imports only what it serves.
 *
 * The rule is stated at the `Media` level (`packageMedia`, `#pantry/levels/media.ts`), never as a
 * law of `Qti`: a derived relation over `Qti` selects the entries nothing names, and a
 * `MediaEntryUsed` check over it holds each to be the manifest.
 *
 * @see {@link https://www.imsglobal.org/content/packaging/ | IMS Content Packaging}
 */
import { check, derived, query, v } from "@bjornpagen/grizzle";
import { Document } from "#pantry/qti/chardata.ts";
import { Entry, ReferencePath, TextReferencePath } from "#pantry/qti/package.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";
import { manifestPath } from "#pantry/vocab/terms/package.ts";

/**
 * Select, over a base level, the entries no document is at and no reference resolves to, by package
 * and path. Each negation is a filter of its own, as grizzle states a rule over a query whose
 * relational negation stands alone.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const unusedEntriesOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { package: pkg, path } = v(Entry, "entry");

    return r
      .match(Entry, { package: pkg, path })
      .where(r.not(Document, { package: pkg, path }))
      .where(r.not(ReferencePath, { package: pkg, path }))
      .where(r.not(TextReferencePath, { package: pkg, path }))
      .find({ package: pkg, path });
  });

/**
 * Build the entry rule for one base level: the derived relation over the base it judges, by name,
 * and a `MediaEntryUsed` check over it.
 *
 * - `MediaUnusedEntry`: the entries no document is at and no reference resolves to, each held to be
 *   the manifest, which is always a document too, so a package whose every file is named has no row
 *   of it, and any other entry breaks the check.
 *
 * @param base - The level the derived relation reads, pantry's `Qti`.
 * @returns The relations and statements the rule adds to the `Media` level.
 */
export const mediaEntryUsedRule = (base: QtiSchema) => {
  const MediaUnusedEntry = derived("MediaUnusedEntry", unusedEntriesOf(base));

  return {
    relations: { MediaUnusedEntry },
    statements: [
      check("MediaEntryUsed", MediaUnusedEntry, (u) => u.eq(u.path, manifestPath)),
    ] as const,
  };
};
