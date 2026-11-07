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
 * They are judged every run (`src/test/genetic.oracle.test.ts`): each disagrees while it waits on
 * its owner's fix, the import refusing a value outside its domain's facets, and must agree once the
 * fix lands, whose commit drops the wait.
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
 * The fix the three cases wait on.
 */
const facets = Option.some({
  fix: "G1-2: the import refuses an attribute value outside its value domain's facets",
  owner: "REP-B",
});

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
    waits: facets,
  },
  {
    entries: editedBase(
      "items/item.xml",
      'upper-bound="10" step="1"',
      'upper-bound="10" step="-1"',
    ),
    name: 'a slider\'s step="-1"',
    waits: facets,
  },
  {
    entries: editedBase("items/item.xml", 'normal-maximum="10"', 'normal-maximum="0"'),
    name: 'an outcome\'s normal-maximum="0"',
    waits: facets,
  },
];
