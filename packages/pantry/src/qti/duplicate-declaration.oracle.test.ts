/**
 * A second declaration of a name is refused by `Declaration key` alone, on the import's rows as in
 * the law oracle (spec reading 74): what a reference or a reading reads of a document's names is a
 * query over its `DeclarationIdentifier` rows (`#pantry/qti/queries.ts`), which states the key no
 * second time. A lookup that once forced in every declaration's node broke "E1 derived" beside the
 * key on every second declaration, a law the oracle never raises.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`): no
 * case shows any disagreement, and each side breaks `Declaration key` exactly where a name is
 * declared again.
 *
 * Bound: the every-relation package, whose item looks up its outcome `SCORE` (its own processing,
 * the test's `ref1.SCORE`, a variable mapping's source and a `qti-test-variables`) and its template
 * `N` (its template processing, a printed variable and the test's template default), with one of
 * the two declared one, two or three times: each added declaration of the original's codes or of
 * others, all of them before the original or after it. 21 packages, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The package every case starts from.
 */
const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });

/**
 * The item whose declarations a case adds to.
 */
const itemPath = "items/item.xml";

/**
 * One declared name of the item: the original declaration's start tag, and an added declaration of
 * the original's codes and one of other codes.
 */
interface Declared {
  readonly added: { readonly other: string; readonly same: string };
  readonly original: string;
}

/**
 * The outcome `SCORE`, which the item's processing, the test's `ref1.SCORE`, its variable mapping's
 * source and its `qti-test-variables` look up.
 */
const score: Declared = {
  added: {
    other:
      '<qti-outcome-declaration identifier="SCORE" cardinality="multiple" base-type="integer"/>',
    same: '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
  },
  original:
    '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="10" normal-minimum="0" mastery-value="5">',
};

/**
 * The template `N`, which the item's template processing and printed variable and the test's
 * template default look up.
 */
const template: Declared = {
  added: {
    other: '<qti-template-declaration identifier="N" cardinality="single" base-type="string"/>',
    same: '<qti-template-declaration identifier="N" cardinality="single" base-type="integer"/>',
  },
  original: '<qti-template-declaration identifier="N" cardinality="single" base-type="integer"/>',
};

/**
 * The codes of an added declaration: the original's, or others.
 */
type Codes = keyof Declared["added"];

/**
 * How many times a case declares its name.
 */
type Times = "declared once" | "declared three times" | "declared twice";

/**
 * A case's added declarations: their codes, and how many times the name is declared with them.
 */
interface Added {
  readonly codes: readonly Codes[];
  readonly times: Times;
}

/**
 * One case: the name declared again, its added declarations, and whether they stand before the
 * original or after its element.
 */
interface Case extends Added {
  readonly before: boolean;
  readonly name: Declared;
}

/**
 * The added declarations of a case that declares a name again: one or two, of each pair of codes.
 */
const addedSets: readonly Added[] = [
  { codes: ["same"], times: "declared twice" },
  { codes: ["other"], times: "declared twice" },
  { codes: ["same", "same"], times: "declared three times" },
  { codes: ["same", "other"], times: "declared three times" },
  { codes: ["other", "other"], times: "declared three times" },
];

/**
 * Every case, the base first: each name with one or two added declarations, of each pair of codes,
 * before the original or after it.
 */
const cases: readonly [Case, ...Case[]] = [
  { before: false, codes: [], name: score, times: "declared once" },
  ...[score, template].flatMap((name) =>
    addedSets.flatMap((added) => [false, true].map((before) => ({ ...added, before, name }))),
  ),
];

/**
 * Name a case.
 *
 * @param kase - The case.
 * @returns Its name, its added declarations' codes and where they stand.
 */
const caseLiteral = ({ before, codes, name, times }: Case): string =>
  `${name.original} ${times}, added ${codes.join(" and ") || "nothing"} ${before ? "before" : "after"} it`;

/**
 * The end of the original declaration's element: its start tag where it is empty, else the end tag
 * after it.
 *
 * @param text - The item's text.
 * @param original - The original's start tag.
 * @returns The offset just past the element.
 */
const endOf = (text: string, original: string): number => {
  const start = text.indexOf(original);
  const empty = original.endsWith("/>");
  const close = `</${original.slice(1, original.indexOf(" "))}>`;

  return empty ? start + original.length : text.indexOf(close, start) + close.length;
};

/**
 * Write a case's package: the base, its item declaring the name again where the case says.
 *
 * @param kase - The case.
 * @returns Its entries.
 */
const packageOf = ({ before, codes, name }: Case): PackageEntries =>
  new Map(
    [...base].map(([path, bytes]) => {
      if (path !== itemPath || codes.length === 0) {
        return [path, bytes] as const;
      }

      const text = new TextDecoder().decode(bytes);
      const at = before ? text.indexOf(name.original) : endOf(text, name.original);
      const copies = codes.map((code) => `${name.added[code]}\n  `).join("");
      const edited = before
        ? `${text.slice(0, at)}${copies}${text.slice(at)}`
        : `${text.slice(0, at)}\n  ${copies.trimEnd()}${text.slice(at)}`;

      return [path, new TextEncoder().encode(edited)] as const;
    }),
  );

/**
 * A situation the box must reach: a name declared once, twice and three times, an added
 * declaration of other codes, and one standing first.
 */
type Situation = Times | "added declaration first" | "added declaration of other codes";

/**
 * Whether a side's features name a law: the oracle's `o:<law> @ …`, or the import's
 * `i:<rule> @ …`.
 *
 * @param features - The features of a judgment.
 * @param prefix - The side's prefix and the law or rule.
 * @returns Whether one feature names it.
 */
const names = (features: ReadonlySet<string>, prefix: string): boolean =>
  [...features].some((feature) => feature.startsWith(`${prefix} @ `));

layer(NodeServices.layer, { excludeTestServices: true })("a second declaration of a name", (it) => {
  it.effect(
    "is refused by Declaration key alone, on the import's rows as in the law oracle",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* duplicateDeclarationRuns() {
          const directory = yield* scratchDirectory("duplicate-declaration-");
          const bench = { directory, grammar, laws };
          const item = new TextDecoder().decode(base.get(itemPath));
          let index = 0;
          for (const { original } of [score, template]) {
            assert.strictEqual(
              item.split(original).length - 1,
              1,
              `the base's item writes ${original} once`,
            );
          }

          return yield* exhaust(
            {
              box: "the every-relation package, its item declaring SCORE or N once, twice or three times, each added declaration of the original's codes or others, before the original or after it",
              caseHang: Duration.minutes(5),
              coverage: requiredInSpace<Situation>([
                "added declaration first",
                "added declaration of other codes",
                "declared once",
                "declared three times",
                "declared twice",
              ]),
              generator: element(cases),
              limit: cases.length,
              literal: caseLiteral,
              oracle: {
                kind: "second-implementation",
                name: "the law oracle against the laws the import's rows break on the host",
              },
              suite: "pantry/duplicate-declaration",
            },
            (kase: Case, c) =>
              Effect.gen(function* duplicateDeclarationCase() {
                c.note(kase.times);
                if (kase.codes.includes("other")) {
                  c.note("added declaration of other codes");
                }

                if (kase.before && kase.codes.length > 0) {
                  c.note("added declaration first");
                }

                index += 1;
                const judged = yield* judgeOne(yield* genomeOf(packageOf(kase)), bench, index);
                const again = kase.codes.length > 0;
                const verdicts = `${caseLiteral(kase)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;

                assert.deepStrictEqual(judged.disagreements.map(shownDisagreement), [], verdicts);
                assert.strictEqual(names(judged.features, "o:Declaration key"), again, verdicts);
                assert.strictEqual(names(judged.features, "i:declaration-key"), again, verdicts);
              }),
          );
        }).pipe(Effect.scoped),
      ),
    600_000,
  );
});
