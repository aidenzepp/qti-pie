/**
 * Packages of inclusion cycles through `rtest01`'s fragment, for the oracle's box
 * (`inclusion-cycles.oracle.test.ts`) and the database's (`import/inclusion-cycles.db.test.ts`).
 *
 * `rtest01`'s three set items each include `rtest01-fragment.xml`, a `div` holding a hottext
 * interaction bound to `RESPONSE`. A case keeps the include in the first `includers` items and
 * drops it from the rest, and closes its cycle: none; the fragment including itself
 * before its interaction; or the fragment including `rtest01-loop.xml`, a text fragment listed as
 * its own `imsqti_fragment_xmlv3p0` resource, which includes the fragment back.
 */
import { assert } from "@effect/vitest";
import type { PackageFile } from "#pantry/package/read.ts";

/**
 * The cycles a case's inclusion graph closes: none, the fragment through itself, or the fragment
 * and a text fragment through each other.
 */
export const cycles = ["none", "self", "pair"] as const;

/**
 * How many of `rtest01`'s set items include the fragment.
 */
export const includerCounts = [1, 2, 3] as const;

/**
 * One case: the cycle its inclusion graph closes and how many set items place the fragment.
 */
export interface CycleCase {
  readonly cycle: (typeof cycles)[number];
  readonly includers: (typeof includerCounts)[number];
}

/**
 * The include each `rtest01` set item writes.
 */
const setInclude = '<xi:include href="rtest01-fragment.xml" parse="xml"/>';

/**
 * Where the fragment's cycle-closing include goes: before its interaction.
 */
const interactionOpen = "<qti-hottext-interaction";

/**
 * The text fragment of a two-fragment cycle, which includes the fragment back.
 */
const loopText =
  '<?xml version="1.0" encoding="UTF-8"?>\n<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude"><p>Again.</p><xi:include href="rtest01-fragment.xml"/></div>\n';

/**
 * The text fragment's resource, listed after the others.
 */
const loopResource =
  '<resource identifier="r-rtest01-loop" type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-loop.xml"><file href="rtest01/rtest01-loop.xml"/></resource>';

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
    return assert.fail(`${search} does not occur once in the entry the case edits`);
  }

  return `${text.slice(0, at)}${replacement}${text.slice(at + search.length)}`;
};

/**
 * Write a case's package from `rtest01`'s entries.
 *
 * @param base - `rtest01`'s entries, as `readPackage` returns them.
 * @param drawn - The case.
 * @returns The case's entries, sorted by path.
 */
export const cyclePackageOf = (
  base: readonly PackageFile[],
  drawn: CycleCase,
): readonly PackageFile[] => {
  const edited = base.map((file): PackageFile => {
    const text = new TextDecoder().decode(file.bytes);
    const set = /rtest01-set0(?<n>[123])\.xml$/u.exec(file.path)?.groups?.["n"];
    const encode = (edit: string): PackageFile => ({
      ...file,
      bytes: new TextEncoder().encode(edit),
    });

    if (set !== undefined && Number(set) > drawn.includers) {
      return encode(replaceOnce(text, setInclude, ""));
    }

    if (file.path.endsWith("rtest01-fragment.xml") && drawn.cycle !== "none") {
      const href = drawn.cycle === "self" ? "rtest01-fragment.xml" : "rtest01-loop.xml";

      return encode(
        replaceOnce(text, interactionOpen, `<xi:include href="${href}"/>${interactionOpen}`),
      );
    }

    if (file.kind === "manifest" && drawn.cycle === "pair") {
      return encode(replaceOnce(text, "</resources>", `${loopResource}</resources>`));
    }

    return file;
  });

  return (
    drawn.cycle === "pair"
      ? [
          ...edited,
          {
            bytes: new TextEncoder().encode(loopText),
            kind: "file" as const,
            path: "rtest01/rtest01-loop.xml",
          },
        ]
      : edited
  ).toSorted((left, right) => (left.path < right.path ? -1 : 1));
};
