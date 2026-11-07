import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materializeCorpus } from "#pantry/test/fixtures.ts";
import { judge, lawsOf, ruleOf } from "#pantry/test/oracle.ts";
import type { Breach, Judgment } from "#pantry/test/oracle.ts";
import { settings } from "#pantry/test/settings.ts";

/**
 * The timeout, in milliseconds, for judging one corpus package: one read of its entries, then a
 * shred, a fold and every law over each document it lists, with no database.
 *
 * The slowest package, `BPIG_22April`, took under 10 s beside three other suites when measured on
 * 2026-11-05 (`prewitness.corpus.oracle.test.ts`); this test judges five packages and keeps that
 * file's budget. Raise it only on a new measurement recorded here.
 */
const caseTimeoutMs = 60_000;

/**
 * The corpus packages that carry custom `data-*` attributes, by the name of their zip (the file
 * name without `.zip`): the five packages Revision 2.1 of phase 8 counted 93 of them in.
 */
const dataPackages = [
  "BPIG_22April",
  "items",
  "pci_item_examples",
  "pci_simple_example",
  "sharedStimulus",
] as const;

/**
 * The laws that judge an attribute's name or value, the ones a custom `data-*` attribute could
 * breach: admission, the `data-*` name laws, the open-name tables and the value domain.
 */
const attributeLaws: ReadonlySet<string> = new Set([
  "AL1 admission",
  "AL4 data name",
  "AL4 declared data name",
  "AL4 open name key",
  "AL4 open names",
  "value domain",
]);

/**
 * Whether a corpus package is one of {@link dataPackages}.
 *
 * @param name - The package's name.
 * @returns True for the five packages that carry custom `data-*` attributes.
 */
const carriesData = (name: string): boolean => dataPackages.some((held) => held === name);

/**
 * Every corpus package when `GR8DES_CORPUS=1`, and none otherwise.
 *
 * Vitest declares a file's cases before any runs, so the corpus is listed while the file is
 * collected; a run without the setting never opens the tarball.
 */
const everyPackage = settings.corpusRequested
  ? await Effect.runPromise(materializeCorpus().pipe(Effect.provide(NodeServices.layer)))
  : [];

/**
 * The five packages of {@link dataPackages} among {@link everyPackage}.
 */
const corpus = everyPackage.filter(({ name }) => carriesData(name));

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * Whether a breach concerns a `data-*` attribute.
 *
 * An attribute row's breach names its attribute class (`data-*` for a custom data attribute) and
 * an open-name breach its local name; the two whole-document open-name laws name no attribute, so
 * any breach of them counts.
 *
 * @param breach - The breach.
 * @returns True when the breach is of an attribute law and concerns a `data-*` attribute.
 */
const concernsData = (breach: Breach): boolean => {
  if (!attributeLaws.has(breach.law)) {
    return false;
  }

  const { keys } = breach;

  return (
    breach.law === "AL4 open names" ||
    breach.law === "AL4 open name key" ||
    keys["name"] === "data-*" ||
    (keys["local"]?.startsWith("data-") ?? false)
  );
};

/**
 * Judge one corpus package by the laws.
 *
 * @param dir - The package's directory.
 * @returns The judgment.
 */
const judged = Effect.fn("data.corpus.judged")(function* judged(dir: string) {
  const files = yield* readPackage(dir);

  return yield* judge(files, grammar, laws);
});

/**
 * Assert that a judgment holds nothing against a `data-*` attribute: a codec refusal names none
 * (the codec may refuse a package for another attribute, as it does `pci_item_examples` for
 * `fallback-configuration`), and no breach of an attribute law concerns one.
 *
 * @param judgment - The judgment of one package.
 * @returns The breaches the judgment holds, none when the codec refused the package.
 */
const dataHeld = (judgment: Judgment): readonly Breach[] => {
  if (judgment._tag === "CodecRefusal") {
    assert.notMatch(
      judgment.detail,
      /\bdata-/u,
      `codec refusal ${judgment.rule} in ${judgment.document} names a data-* attribute`,
    );

    return [];
  }

  assert.deepStrictEqual(
    judgment.breaches.filter(concernsData).map(({ document, law, keys }) => ({
      document,
      law,
      local: keys["local"] ?? keys["name"] ?? "",
    })),
    [],
    "no attribute law is breached on a data-* attribute",
  );

  return judgment.breaches;
};

describe.skipIf(!settings.corpusRequested)("data.corpus.oracle.test.ts, the corpus", () => {
  layer(NodeServices.layer, { excludeTestServices: true })(
    "custom data-* attributes of the corpus",
    (it) => {
      it.effect("the corpus holds all five packages", () =>
        Effect.sync(() => {
          assert.deepStrictEqual(corpus.map(({ name }) => name).toSorted(), [...dataPackages]);
        }),
      );

      for (const entry of corpus) {
        it.effect(
          `${entry.name}: no law of an attribute is breached on a data-* attribute`,
          () =>
            Effect.gen(function* held() {
              dataHeld(yield* judged(entry.dir));
            }),
          { timeout: caseTimeoutMs },
        );
      }

      it.effect(
        "items is still refused for the missing qti-rubric-block use of data-attributes.xml",
        () =>
          Effect.gen(function* required() {
            const entry = corpus.find(({ name }) => name === "items");

            assert.isDefined(entry, "the corpus holds items");

            const breaches = dataHeld(yield* judged(entry?.dir ?? ""));
            const missing = breaches.filter(
              ({ document, law }) =>
                law === "AL3 required" && document.endsWith("data-attributes.xml"),
            );

            assert.isAbove(missing.length, 0, "an AL3 required breach in data-attributes.xml");
            assert.deepStrictEqual(
              [...new Set(missing.map(({ law }) => ruleOf(law)))],
              ["required-attribute"],
            );
          }),
        { timeout: caseTimeoutMs },
      );
    },
  );
});
