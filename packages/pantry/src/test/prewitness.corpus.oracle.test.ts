import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { Console, Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readEntries } from "#pantry/package/read.ts";
import type { PackageReadError } from "#pantry/package/read.ts";
import { examplesTarball, materializeCorpus } from "#pantry/test/fixtures.ts";
import { explain, judge, lawsOf, ruleOf, verdictOf } from "#pantry/test/oracle.ts";
import type { Breach, CodecRule, Judgment, OracleRule } from "#pantry/test/oracle.ts";
import { settings } from "#pantry/test/settings.ts";
import { parseVerdicts, verdictsPath } from "#pantry/test/verdicts.ts";

/**
 * The timeout, in milliseconds, for judging one corpus package: one read of its entries, then a
 * shred, a fold and every law over each document it lists, with no database.
 *
 * Measured on 2026-11-05 with the grammar of W3 on the shared tree: the slowest package,
 * `BPIG_22April`, took under 10 s while three other suites ran beside it. Measured 2026-11-07:
 * 9.6 s at a load average of 63 to 78, `BPIG_22April` again. The budget is the larger of twice that
 * and 60 s. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const caseTimeoutMs = 60_000;

/**
 * The folder the predicted verdicts are written to, `packages/pantry/work/verdicts`, beside the
 * corpus witness's own output and, like it, never committed.
 */
const outputRoot = path.resolve(import.meta.dirname, "..", "..", "work", "verdicts");

/**
 * The corpus's packages when `GR8DES_CORPUS=1`, and none otherwise.
 *
 * Vitest declares a file's cases before any runs, so the corpus is listed while the file is
 * collected; a run without the setting never opens the tarball.
 */
const corpus = settings.corpusRequested
  ? await Effect.runPromise(materializeCorpus().pipe(Effect.provide(NodeServices.layer)))
  : [];

/**
 * The composed grammar every case judges by, and the oracle's tables of it, built once.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * One corpus zip's predicted verdict, with the judgment it follows from.
 */
interface Predicted {
  readonly file: string;
  readonly judgment: Judgment;
  readonly name: string;
  readonly rule: OracleRule | "";
  readonly verdict: "accepted" | "refused";
}

/**
 * The verdict of every package the cases judged, in corpus order; the last case writes them.
 */
const predictions: Predicted[] = [];

/**
 * Order two strings by UTF-16 code unit, the order the verdict file is sorted in.
 *
 * @param a - One string.
 * @param b - The other.
 * @returns Negative, zero or positive as `a` sorts before, with or after `b`.
 */
const byCodeUnit = (a: string, b: string): number => {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
};

/**
 * Render predictions in the verdict file's layout: the header, then one line per zip sorted by
 * `file`, every line ended by a line feed.
 *
 * The layout is the committed file's, so the two compare line by line, but a rule may be one of
 * the oracle's own (`child-set`, `derived`, `selection-bounds`), which no rule of today's roster
 * names, so the text is written here rather than by `renderVerdicts`.
 *
 * @param rows - The predictions.
 * @returns The text.
 */
const renderPredicted = (rows: readonly Predicted[]): string =>
  [
    "file\tverdict\trule",
    ...rows
      .toSorted((left, right) => byCodeUnit(left.file, right.file))
      .map(({ file, rule, verdict }) => `${file}\t${verdict}\t${rule}`),
  ]
    .map((line) => `${line}\n`)
    .join("");

/**
 * Write one breach as a line of the detail file: the zip, the law, its rule, the document, the
 * node and its explanation, tab separated.
 *
 * @param file - The zip's tarball member.
 * @param breach - The breach.
 * @returns The line, its tabs and line breaks in the detail spaced out.
 */
const breachLine = (file: string, breach: Breach): string =>
  [
    file,
    breach.law,
    ruleOf(breach.law),
    breach.document,
    breach.keys["node"] ?? "",
    explain(breach.law, breach.keys, grammar),
  ]
    .map((field) => field.replaceAll(/[\t\r\n]+/gu, " "))
    .join("\t");

/**
 * Count each breach's rule over one judgment.
 *
 * @param judgment - The judgment.
 * @returns `rule ×count` for each rule its breaches keep, in first-breach order, or the codec's
 *   rule.
 */
const rulesOf = (judgment: Judgment): string => {
  if (judgment._tag === "CodecRefusal") {
    return `${judgment.rule} (${judgment.document}: ${judgment.detail})`;
  }

  const counts = Map.groupBy(judgment.breaches, ({ law }) => ruleOf(law));

  return [
    `${String(judgment.documents.length)} documents`,
    ...[...counts].map(([rule, held]) => `${rule} ×${String(held.length)}`),
  ].join(", ");
};

/**
 * The rule each of `readEntries`'s own refusals is named by: a package with no manifest at its
 * root, and an entry path that leads outside it.
 */
const readRules = {
  "entry-path": "href-path",
  "manifest-root": "manifest-root",
} as const satisfies Readonly<Record<PackageReadError["rule"], CodecRule>>;

/**
 * Name a package the reader refused before any document was read.
 *
 * @param document - The entry the refusal concerns.
 * @param detail - What the reader found.
 * @param rule - The rule it is named by.
 * @returns The judgment.
 */
const unread = (document: string, detail: string, rule: CodecRule): Judgment => ({
  _tag: "CodecRefusal",
  detail,
  document,
  rule,
});

/**
 * Judge one corpus package and keep its predicted verdict.
 *
 * @param entry - The corpus zip: its file, its tarball member and its name.
 * @param entry.dir - The zip file.
 * @param entry.member - Its tarball member.
 * @param entry.name - Its name.
 * @returns Completes once the prediction is kept.
 */
const predict = Effect.fn("prewitness.predict")(function* predict(entry: {
  readonly dir: string;
  readonly member: string;
  readonly name: string;
}) {
  const judgment = yield* readEntries(entry.dir).pipe(
    Effect.flatMap((files) => judge(files, grammar, laws)),
    Effect.catchTags({
      PackageReadError: (failure) =>
        Effect.succeed(unread(failure.path, failure.message, readRules[failure.rule])),
      ZipRefusal: (failure) => Effect.succeed(unread(failure.entry, failure.message, failure.rule)),
    }),
  );
  const verdict = verdictOf(judgment);

  predictions.push({
    file: entry.member,
    judgment,
    name: entry.name,
    rule: verdict.verdict === "refused" ? verdict.rule : "",
    verdict: verdict.verdict,
  });
});

describe.skipIf(!settings.corpusRequested)("prewitness.corpus.oracle.test.ts, the corpus", () => {
  layer(NodeServices.layer, { excludeTestServices: true })(
    "the predicted verdict of every corpus package",
    (it) => {
      for (const entry of corpus) {
        it.effect(`${entry.name} is judged by the laws`, () => predict(entry), {
          timeout: caseTimeoutMs,
        });
      }

      it.effect("the predictions, written beside the committed verdicts", () =>
        Effect.gen(function* written() {
          const tarball = yield* examplesTarball;
          const committed = yield* parseVerdicts(readFileSync(verdictsPath(tarball), "utf-8"));
          const byFile = new Map(committed.map((row) => [row.file, row]));
          const changed = predictions.filter((row) => {
            const held = byFile.get(row.file);

            return (
              held?.verdict !== row.verdict ||
              (row.verdict === "refused" && !held.rules.some((rule) => rule === row.rule))
            );
          });
          const accepted = predictions.filter(({ verdict }) => verdict === "accepted").length;

          mkdirSync(outputRoot, { recursive: true });
          writeFileSync(path.join(outputRoot, "predicted.tsv"), renderPredicted(predictions));
          writeFileSync(
            path.join(outputRoot, "predicted.breaches.tsv"),
            [
              "file\tlaw\trule\tdocument\tnode\tdetail",
              ...predictions
                .toSorted((left, right) => byCodeUnit(left.file, right.file))
                .flatMap(({ file, judgment }) =>
                  judgment._tag === "Judged"
                    ? judgment.breaches.map((breach) => breachLine(file, breach))
                    : [
                        [file, "codec", judgment.rule, judgment.document, "", judgment.detail]
                          .map((field) => field.replaceAll(/[\t\r\n]+/gu, " "))
                          .join("\t"),
                      ],
                ),
            ]
              .map((line) => `${line}\n`)
              .join(""),
          );

          yield* Console.log(
            [
              `prewitness: accepted ${String(accepted)} refused ${String(predictions.length - accepted)} of ${String(predictions.length)}; committed accepted ${String(committed.filter(({ verdict }) => verdict === "accepted").length)}; ${String(changed.length)} rows changed`,
              ...changed.map((row) => {
                const held = byFile.get(row.file);

                return `  ${row.name}: ${held?.verdict ?? "absent"} ${held?.rules.join("|") ?? ""} -> ${row.verdict} ${row.rule}; ${rulesOf(row.judgment)}`;
              }),
            ].join("\n"),
          );

          assert.deepStrictEqual(
            predictions.map(({ file }) => file).toSorted(byCodeUnit),
            committed.map(({ file }) => file).toSorted(byCodeUnit),
            "one prediction per corpus zip, the committed file's zips",
          );
        }),
      );
    },
  );
});
