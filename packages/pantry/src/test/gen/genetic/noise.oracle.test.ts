/**
 * `path-rename` is a meaning-preserving noise: it renames one document and rewrites every href that
 * names it, so neither side's verdict may move under it. An `xs:anyURI` href collapses its
 * whitespace before it resolves, on both sides, while the rewrite resolves an href by its path
 * segments as written (`#pantry/test/gen/genetic/genome.ts` `resolvedPath`). So an href padded
 * with XML whitespace was left naming the old path after the rename, and both readers, collapsing
 * it, missed the renamed file: aeced65a's classes O15 (the oracle's verdict moved, gaining File
 * exists and File listed) and O16 (the import's, gaining Href listed), under salt 706. The noise
 * now leaves a genome with such an href as it is, as it leaves one with an `xml:base` or a
 * percent-encoded href.
 *
 * Oracle: a metamorphic relation, each side's verdict on a package against its verdict on the
 * package's `path-rename` twin (`#pantry/test/gen/genetic/judge.ts` `judgeOne` and `movedBy`).
 *
 * Bound: aeced65a's two reduced packages, a `cp:file` href padded with a tab and a line feed, the
 * second with its `cp:resource` naming the document too, and a control whose `cp:file` href is
 * unpadded, which the noise does rename: 3 cases, each judged with its twin under salt 706.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import type { Genome } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, movedBy, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { noised } from "#pantry/test/gen/genetic/noise.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The salt aeced65a's classes were found under, which picks `choice.xml`, the one document.
 */
const salt = 706;

/**
 * Write a package of one empty item, `choice.xml`, and a manifest whose one resource lists it.
 *
 * @param resource - The `cp:resource` element's attributes, each with its leading space.
 * @param file - The `cp:file` element's href, as written in the document.
 * @returns The package's entries.
 */
const packageOf = (resource: string, file: string): PackageEntries => {
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const manifest = `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource${resource}><file href="${file}"/></resource></resources></manifest>`;
  const encoder = new TextEncoder();

  return new Map([
    ["choice.xml", encoder.encode(`${declaration}<qti-assessment-item/>`)],
    ["imsmanifest.xml", encoder.encode(manifest)],
  ]);
};

/**
 * Show a genome's paths, in order.
 *
 * @param genome - The genome.
 * @returns Its paths.
 */
const pathsOf = (genome: Genome): string => genome.map(({ path }) => path).join(", ");

/**
 * Each case: its name, its package, and whether `path-rename` renames its document.
 */
const cases = [
  { entries: packageOf("", "&#x9;choice.xml&#xA;"), name: "O15", renamed: false },
  { entries: packageOf(' href="choice.xml"', "&#x9;choice.xml&#xA;"), name: "O16", renamed: false },
  { entries: packageOf("", "choice.xml"), name: "the control", renamed: true },
] as const;

layer(NodeServices.layer, { excludeTestServices: true })(
  "path-rename beside an href padded with whitespace",
  (it) => {
    it.effect(
      "moves neither side's verdict, leaving a padded href's genome as it is and renaming the control's document",
      () =>
        Effect.gen(function* pathRenamePadded() {
          const directory = yield* scratchDirectory("noise-path-rename-");
          const bench = { directory, grammar, laws };

          const seen = [];
          for (const [at, { entries, name }] of cases.entries()) {
            const genome = yield* genomeOf(entries);
            const twin = noised(genome, "path-rename", salt);
            const judged = yield* judgeOne(genome, bench, 2 * at);
            const twinJudged = yield* judgeOne(twin, bench, 2 * at + 1);

            seen.push({
              moved: movedBy(judged, twinJudged, "path-rename", salt).map(shownDisagreement),
              name,
              renamed: pathsOf(twin) !== pathsOf(genome),
            });
          }

          assert.deepStrictEqual(
            seen,
            cases.map(({ name, renamed }) => ({ moved: [], name, renamed })),
          );
        }).pipe(Effect.scoped),
    );
  },
);
