/**
 * An element that writes no identifier names nothing (spec reading 147): a test part, section,
 * section ref, item ref or stimulus ref the XSD requires to write one, with no default, and whose
 * `IdentifierDType`, an `xs:NCName`, is never empty. It holds no place in its document's
 * namespace, so AL3 alone refuses it, on the import's rows as in the law oracle: the import writes
 * no `Named` or `StimulusRef` row for it, and the oracle gives it no name. Both read an unwritten
 * identifier as the empty one before, the import breaking "Test overlay"'s copy beside AL3, and
 * the oracle, for two such elements of one document or one assembly, "Structure identifier" or
 * "Test name key".
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`): no
 * case shows a disagreement but a class a lane's open fix owns (`known`).
 *
 * Bound: the every-relation package with any subset of six identifiers left unwritten, the test's
 * part, a section, an item ref and a section ref, the placed section document's root section and
 * the item's stimulus ref: 64 packages, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, boolean } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement, signatureOf } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The signatures of the disagreements a lane's open fix owns (`#pantry/test/gen/genetic/known.ts`),
 * which the box sets aside: the every-relation package shows some whatever its identifiers.
 */
const recorded: ReadonlySet<string> = new Set(Object.keys(known));

/**
 * The package every case starts from.
 */
const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });

/**
 * One identifier of the box: its document's path, and its element's start tag up to the
 * identifier, with it and without it.
 */
interface Identified {
  readonly path: string;
  readonly unwritten: string;
  readonly written: string;
}

/**
 * The six identifiers the box leaves unwritten or keeps: the test's part, a section, an item ref
 * and a section ref; the placed section document's root; and the item's stimulus ref.
 */
const identified: readonly Identified[] = [
  { attribute: ' identifier="part1"', path: "test.xml", tag: "<qti-test-part" },
  { attribute: ' identifier="first"', path: "test.xml", tag: "<qti-assessment-section" },
  { attribute: ' identifier="ref1"', path: "test.xml", tag: "<qti-assessment-item-ref" },
  { attribute: ' identifier="placement"', path: "test.xml", tag: "<qti-assessment-section-ref" },
  {
    attribute: ' identifier="placed"',
    path: "section.xml",
    tag: '<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"',
  },
  {
    attribute: ' identifier="stimulus1"',
    path: "items/item.xml",
    tag: "<qti-assessment-stimulus-ref",
  },
].map(({ attribute, path, tag }) => ({ path, unwritten: tag, written: `${tag}${attribute}` }));

/**
 * Write a case's package: the base, each chosen identifier left unwritten.
 *
 * @param unwritten - Whether each of {@link identified} is left unwritten, in order.
 * @returns Its entries.
 */
const packageOf = (unwritten: readonly boolean[]): PackageEntries => {
  const left = identified.filter((_, at) => unwritten[at] === true);

  return new Map(
    [...base].map(([path, bytes]) => {
      const edits = left.filter((edit) => edit.path === path);
      if (edits.length === 0) {
        return [path, bytes] as const;
      }

      let text = new TextDecoder().decode(bytes);
      for (const edit of edits) {
        text = text.replace(edit.written, edit.unwritten);
      }

      return [path, new TextEncoder().encode(text)] as const;
    }),
  );
};

/**
 * A situation the box must reach: every identifier written, one left unwritten, and two left
 * unwritten in one document, which an empty identifier would have made alike.
 */
type Situation = "all written" | "one unwritten" | "two of one document unwritten";

layer(NodeServices.layer, { excludeTestServices: true })("an unwritten identifier", (it) => {
  it.effect(
    "names nothing, so AL3 alone refuses its element, on the import's rows as in the law oracle",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* unwrittenIdentifierRuns() {
          const directory = yield* scratchDirectory("unwritten-identifier-");
          const bench = { directory, grammar, laws };
          let index = 0;
          for (const { path, written } of identified) {
            assert.deepStrictEqual(
              [...base].flatMap(([at, bytes]) =>
                at === path ? [new TextDecoder().decode(bytes).split(written).length - 1] : [],
              ),
              [1],
              `the base's ${path} writes ${written} once`,
            );
          }

          return yield* exhaust(
            {
              box: "the every-relation package with any subset of a test part's, a section's, an item ref's, a section ref's, a section document's and a stimulus ref's identifiers unwritten",
              caseHang: Duration.minutes(5),
              coverage: requiredInSpace<Situation>([
                "all written",
                "one unwritten",
                "two of one document unwritten",
              ]),
              generator: array(boolean, { max: identified.length, min: identified.length }),
              limit: 2 ** identified.length,
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "the law oracle against the laws the import's rows break on the host",
              },
              suite: "pantry/unwritten-identifier",
            },
            (unwritten: readonly boolean[], c) =>
              Effect.gen(function* unwrittenIdentifierCase() {
                const left = identified.filter((_, at) => unwritten[at] === true);
                const byDocument = Map.groupBy(left, ({ path }) => path);
                c.note(left.length === 0 ? "all written" : "one unwritten");
                if ([...byDocument.values()].some((held) => held.length > 1)) {
                  c.note("two of one document unwritten");
                }

                index += 1;
                const judged = yield* judgeOne(yield* genomeOf(packageOf(unwritten)), bench, index);

                assert.deepStrictEqual(
                  judged.disagreements
                    .filter((disagreement) => !recorded.has(signatureOf(disagreement)))
                    .map(shownDisagreement),
                  [],
                  `${left.map(({ written }) => written).join(", ") || "none"} unwritten: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                );
              }),
          );
        }).pipe(Effect.scoped),
      ),
    600_000,
  );
});
