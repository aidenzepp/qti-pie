/**
 * The host's collapse (`#pantry/test/gen/genetic/host-laws.ts` `collapse`) is the database's
 * `Compute.collapse`, `btrim(regexp_replace(x, '[ \t\n\r]+', ' ', 'g'))`: each run of tab, line
 * feed, carriage return and space one space, then the spaces at either end trimmed, and nothing
 * else. So a value of one no-break space (U+00A0), which XML Schema's `collapse` keeps, is no
 * whitespace to it, and the host holds "E1 derived" as the database does. GEN-A's search found
 * the host alone breaking "E1 derived" where it trimmed with `String.prototype.trim`, which also
 * strips U+00A0: on an interaction attribute (O14) and on a resource's identifier (O29).
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`).
 *
 * Bound: GEN-A's two reduced packages, an item whose `adaptive` is one U+00A0 and a resource whose
 * identifier is one, and each with an ASCII space in its place (the controls): 4 cases,
 * exhausted. None shows a disagreement.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The timeout, in milliseconds, that this file's test states: a hang guard, never a budget.
 * Measured 2026-11-09: 2.1 s at a load average of 83 to 131, its one test.
 */
const testTimeoutMs = 600_000;

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The text every XML file of the cases opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

/**
 * The manifest's opening, through its metadata.
 */
const manifestHead = `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata>`;

/**
 * The value written where GEN-A wrote one U+00A0: that character, or an ASCII space.
 */
const values = [
  { name: "one no-break space", text: "&#xA0;" },
  { name: "one ASCII space", text: " " },
] as const;

/**
 * Where the value is written: an item's `adaptive` (O14) or a resource's identifier (O29).
 */
const places = [
  {
    entries: (value: string): ReadonlyMap<string, string> =>
      new Map([
        [
          "es/choice.xml",
          `${declaration}<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" adaptive="${value}"/>`,
        ],
        [
          "imsmanifest.xml",
          `${manifestHead}<resources><resource type="imsqti_item_xmlv3p0" href="es/choice.xml"/></resources></manifest>`,
        ],
      ]),
    name: "an item's adaptive",
  },
  {
    entries: (value: string): ReadonlyMap<string, string> =>
      new Map([
        [
          "imsmanifest.xml",
          `${manifestHead}<resources><resource identifier="${value}"/></resources></manifest>`,
        ],
      ]),
    name: "a resource's identifier",
  },
] as const;

/**
 * One case of the bound.
 */
interface Case {
  readonly place: (typeof places)[number];
  readonly value: (typeof values)[number];
}

/**
 * Every case of the bound.
 */
const cases: readonly Case[] = places.flatMap((place) =>
  values.map((value): Case => ({ place, value })),
);

/**
 * Build a case's package.
 *
 * @param of - The case.
 * @returns The package's entries.
 */
const packageOf = (of: Case): ReadonlyMap<string, Uint8Array> => {
  const text = new TextEncoder();

  return new Map(
    [...of.place.entries(of.value.text)].map(([path, body]) => [path, text.encode(body)] as const),
  );
};

/**
 * Name a case.
 *
 * @param of - The case.
 * @returns Its name.
 */
const nameOf = (of: Case): string => `${of.place.name} of ${of.value.name}`;

layer(NodeServices.layer, { excludeTestServices: true })(
  "the host's collapse, against the database's",
  (it) => {
    it.effect(
      "trims only the spaces the database trims, so a no-break space breaks no E1 derived on the host",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* hostCollapseRuns() {
            const directory = yield* scratchDirectory("host-collapse-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(cases.length, 4);

            return yield* exhaust(
              {
                box: "2 places (an item's adaptive, a resource's identifier) and 2 values (one U+00A0, one ASCII space)",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => {
                  const of = cases[at];

                  return of === undefined ? String(at) : nameOf(of);
                },
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle, against the laws the import's rows break on the host",
                },
                suite: "pantry/host-collapse",
              },
              (at) =>
                Effect.gen(function* hostCollapseCase() {
                  const of = cases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const judged = yield* judgeOne(yield* genomeOf(packageOf(of)), bench, at);
                  const said = `${nameOf(of)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;
                  const derived = judged.disagreements.filter(
                    (disagreement) =>
                      disagreement.kind === "import-only-law" && disagreement.law === "E1 derived",
                  );

                  assert.deepStrictEqual(derived.map(shownDisagreement), [], said);
                  assert.deepStrictEqual(judged.disagreements.map(shownDisagreement), [], said);
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );
  },
);
