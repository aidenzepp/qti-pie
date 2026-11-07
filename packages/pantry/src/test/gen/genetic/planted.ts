/**
 * The planted value-domain cases (REP-B's and N2's G1-2 finding): three packages of the
 * every-relation package, each with one attribute written outside its value domain's facets though
 * inside its lexical space, which the law oracle refuses under the value domain (attribute-lexical)
 * and today's database lets through, since no law of `Qti` reads `ValueDomainOf`'s facets:
 *
 * - A test part's `qti-time-limits` with `min-time="-1"`, under `xs:double`'s non-negative facet;
 * - A slider's `step="-1"`, under the positive integer `step` is;
 * - An outcome's `normal-maximum="0"`, under the positive double the normal maximum is.
 *
 * They are judged every run (`src/test/genetic.oracle.test.ts`): the import's host path must agree
 * with the oracle on each, so each disagrees until the import refuses a value outside its domain's
 * facets, and agrees once it does.
 */
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";

/**
 * One planted case: its name, and its package.
 */
export interface Planted {
  readonly entries: PackageEntries;
  readonly name: string;
}

/**
 * The every-relation package the cases edit, at its smallest member counts.
 */
const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });

/**
 * Rebuild the base with one passage of one entry replaced.
 *
 * @param path - The entry's path.
 * @param passage - The passage, which the entry holds once.
 * @param replacement - Its replacement.
 * @returns The package.
 */
const editedBase = (path: string, passage: string, replacement: string): PackageEntries => {
  const text = new TextDecoder().decode(base.get(path));
  const entries = new Map(base);
  entries.set(path, new TextEncoder().encode(text.replace(passage, replacement)));

  return entries;
};

/**
 * The three planted cases.
 */
export const plantedCases: readonly Planted[] = [
  {
    entries: editedBase(
      "test.xml",
      '<qti-test-part identifier="part1" navigation-mode="linear" submission-mode="individual">',
      '<qti-test-part identifier="part1" navigation-mode="linear" submission-mode="individual"><qti-time-limits min-time="-1"/>',
    ),
    name: 'a test part\'s qti-time-limits min-time="-1"',
  },
  {
    entries: editedBase(
      "items/item.xml",
      'upper-bound="10" step="1"',
      'upper-bound="10" step="-1"',
    ),
    name: 'a slider\'s step="-1"',
  },
  {
    entries: editedBase("items/item.xml", 'normal-maximum="10"', 'normal-maximum="0"'),
    name: 'an outcome\'s normal-maximum="0"',
  },
];
