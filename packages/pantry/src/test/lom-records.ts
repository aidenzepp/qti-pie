/**
 * Packages of `simple` whose resource's own LOM record and whose image file's LOM record each name
 * the item's identifier and title or another, for the oracle's box (`lom-records.oracle.test.ts`)
 * and the database's (`import/lom-records.db.test.ts`).
 *
 * Spec reading 62 binds the resource's own record, a `lom:lom` of the resource's `cp:metadata`: its
 * identifier entries and its title name the item. A `cp:file`'s record describes the file: "The
 * scope of Metadata is the parent container class only" (IMS Content Packaging 1.2 §6.7, Metadata),
 * and "A File holds meta-data describing a computer file" (§6.6.3, File). So a file's identifier or
 * title that is not the item's breaks nothing.
 */
import { assert } from "@effect/vitest";
import type { PackageFile } from "#pantry/package/read.ts";

/**
 * What a record names: the item's identifier or title, or another.
 */
export const namings = ["the item's", "another"] as const;

/**
 * The image file's record: none, or one whose general category names another title, another
 * identifier, or both.
 */
export const fileRecords = ["none", "title", "identifier", "both"] as const;

/**
 * One case: what the resource's record names for the identifier and the title, and the file's
 * record.
 */
export interface RecordCase {
  readonly file: (typeof fileRecords)[number];
  readonly identifier: (typeof namings)[number];
  readonly title: (typeof namings)[number];
}

/**
 * Replace the one occurrence of a text in an entry, or fail the case's construction.
 *
 * @param text - The entry's text.
 * @param search - The text to replace, which occurs once.
 * @param replacement - Its replacement.
 * @returns The edited text.
 */
const replaceOnce = (text: string, search: string, replacement: string): string => {
  const at = text.indexOf(search);
  if (at === -1 || text.includes(search, at + 1)) {
    return assert.fail(`${search} does not occur once in the manifest`);
  }

  return `${text.slice(0, at)}${replacement}${text.slice(at + search.length)}`;
};

/**
 * The image file's record for a case, its general category's identifier before its title.
 *
 * @param file - The file's record.
 * @returns The file element with its metadata, or the file as `simple` writes it.
 */
const fileOf = (file: RecordCase["file"]): string => {
  const identifier =
    file === "identifier" || file === "both"
      ? "<imsmd:identifier><imsmd:entry>sign</imsmd:entry></imsmd:identifier>"
      : "";
  const title =
    file === "title" || file === "both"
      ? "<imsmd:title><imsmd:string>Sign image</imsmd:string></imsmd:title>"
      : "";

  return file === "none"
    ? '<file href="images/sign.png"/>'
    : `<file href="images/sign.png"><metadata><imsmd:lom><imsmd:general>${identifier}${title}</imsmd:general></imsmd:lom></metadata></file>`;
};

/**
 * Write a case's package from `simple`'s entries.
 *
 * @param base - `simple`'s entries, as `readEntries` returns them.
 * @param drawn - The case.
 * @returns The case's entries.
 */
export const recordPackageOf = (
  base: readonly PackageFile[],
  drawn: RecordCase,
): readonly PackageFile[] =>
  base.map((file): PackageFile => {
    if (file.kind !== "manifest") {
      return file;
    }

    const steps: readonly (readonly [string, string])[] = [
      [
        "<imsmd:entry>choice</imsmd:entry>",
        drawn.identifier === "another"
          ? "<imsmd:entry>elsewhere</imsmd:entry>"
          : "<imsmd:entry>choice</imsmd:entry>",
      ],
      [
        "<imsmd:string>Unattended Luggage</imsmd:string>",
        drawn.title === "another"
          ? "<imsmd:string>Something else</imsmd:string>"
          : "<imsmd:string>Unattended Luggage</imsmd:string>",
      ],
      ['<file href="images/sign.png"/>', fileOf(drawn.file)],
    ];

    let text = new TextDecoder().decode(file.bytes);
    for (const [search, replacement] of steps) {
      text = replaceOnce(text, search, replacement);
    }

    return { ...file, bytes: new TextEncoder().encode(text) };
  });

/**
 * The rules a case's import may be refused under: the resource's record's, each where it names
 * another; none, so the case is accepted, where it names the item's identifier and title.
 *
 * @param drawn - The case.
 * @returns The rules.
 */
export const rulesOf = (drawn: RecordCase): readonly string[] => [
  ...(drawn.identifier === "another" ? ["lom-identifier"] : []),
  ...(drawn.title === "another" ? ["lom-title"] : []),
];
