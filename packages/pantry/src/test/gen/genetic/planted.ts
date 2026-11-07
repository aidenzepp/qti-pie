/**
 * The planted value-domain cases (REP-B's and N2's G1-2 finding): three packages of the
 * every-relation package, each with one attribute written inside its lexical space but outside its
 * value domain's bound, which the law oracle and the database both refuse under `Double bound`
 * (attribute-lexical), the bound judged on the attribute's typed value (`DoubleValue`):
 *
 * - A test part's `qti-time-limits` with `min-time="-1"`, under `NonNegativeDoubleDType`'s
 *   `minInclusive="0.0"`;
 * - A slider's `step="-1"`, under the same bound;
 * - An outcome's `normal-maximum="0"`, under reading 16's `minExclusive="0"`.
 *
 * They are judged every run (`src/test/genetic.oracle.test.ts`), and the two sides agree on each:
 * none waits on a fix.
 */
import { Option } from "effect";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import type { Owned } from "#pantry/test/gen/genetic/known.ts";

/**
 * One planted case: its name, its package, and the fix it waits on while the two sides disagree on
 * it.
 */
export interface Planted {
  readonly entries: PackageEntries;
  readonly name: string;
  readonly waits: Option.Option<Owned>;
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
    waits: Option.none(),
  },
  {
    entries: editedBase(
      "items/item.xml",
      'upper-bound="10" step="1"',
      'upper-bound="10" step="-1"',
    ),
    name: 'a slider\'s step="-1"',
    waits: Option.none(),
  },
  {
    entries: editedBase("items/item.xml", 'normal-maximum="10"', 'normal-maximum="0"'),
    name: 'an outcome\'s normal-maximum="0"',
    waits: Option.none(),
  },
];
