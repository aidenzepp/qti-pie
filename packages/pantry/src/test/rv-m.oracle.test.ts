/**
 * The law oracle on slice M's reading (RV, Aiden's review of PR #46, item 4): spec reading 122, a
 * LOM `learningResourceType` of the LOM vocabulary is neither `exam` nor `self assessment` (QTI 3.0
 * Metadata §2.7.5.1), under `lom-learning-resource-type`.
 *
 * Oracle: the specification's sentence turned into packages, two ways at once. Main's `exam`
 * fixture is refused and the record it edits is not. Over generated packages, drawn under a swarm
 * of the ways a type's source and value are written and placed, the sketch's own verdict, the law
 * oracle's breaches and the database's statements over the builder's rows and the tree's insert
 * agree on every type.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import {
  databaseRefusals,
  documentRowsOf,
  filesOf,
  packageSketches,
  repeats,
  sketchRefusals,
  typeRefused,
} from "#pantry/test/gen/lom-resource-type.ts";
import type { LomFeature, PackageSketch } from "#pantry/test/gen/lom-resource-type.ts";
import { caseHang, searchTimeout } from "#pantry/test/gen/xdm.ts";
import { judge, lawsOf, ruleOf } from "#pantry/test/oracle.ts";
import type { Breach } from "#pantry/test/oracle.ts";

/**
 * The tables the laws read, derived from the grammar once.
 */
const laws = lawsOf(grammar);

/**
 * The law this slice states, as the oracle names it.
 */
const law = "LOM learning resource type";

/**
 * Judge a package by the law oracle, and read its breaches of this slice's law and of N7's caps.
 *
 * @param files - The package's entries.
 * @returns The breaches of each; fails when the codec refuses the package.
 */
const breachesOf = Effect.fn("test.rv-m.breachesOf")(function* breachesOf(
  files: readonly PackageFile[],
) {
  const judgment = yield* judge(files, grammar, laws);
  if (judgment._tag !== "Judged") {
    return assert.fail(`the codec refused the package: ${judgment.rule}, ${judgment.detail}`);
  }

  const of = (name: string): readonly Breach[] =>
    judgment.breaches.filter((breach) => breach.law === name);

  return { capped: of("N7 Counted"), law: of(law) };
});

/**
 * Judge every document of a package that holds a learning resource type by the database's
 * statements, over the rows the importer will write for it.
 *
 * @param files - The package's entries.
 * @returns The copies that break and the types the law refuses, over the package.
 */
const databaseOf = Effect.fn("test.rv-m.databaseOf")(function* databaseOf(
  files: readonly PackageFile[],
) {
  const derived: string[] = [];
  let refused = 0;
  for (const [at, file] of files.entries()) {
    const text = new TextDecoder().decode(file.bytes);
    if (!text.includes("learningResourceType")) {
      continue;
    }

    const document = yield* Effect.orDie(readXml(file.bytes));
    const tree = yield* Effect.orDie(shred(document, "3.0.1", shredGrammarOf(grammar)));
    const judged = databaseRefusals(
      documentRowsOf(
        tree,
        (index) =>
          `00000000-0000-4000-8${at.toString(16).padStart(3, "0")}-${index.toString(16).padStart(12, "0")}`,
      ),
    );
    derived.push(...judged.derived.map((breach) => `${file.path}: ${breach}`));
    refused += judged.refused.size;
  }

  return { derived, refused };
});

describe("spec reading 122: main's fixtures, under lom-learning-resource-type", () => {
  for (const { name, refused } of [
    { name: "lomrest", refused: 0 },
    { name: "lomrest-exam", refused: 1 },
  ] as const satisfies readonly { readonly name: FixtureName; readonly refused: number }[]) {
    it.effect(`${refused === 0 ? "accepts" : "refuses"} ${name}`, () =>
      // Oracle: the specification as a checker: main's fixture edits `lomrest`'s one type of the
      // LOM vocabulary (source LOMv1.0) from `exercise` to `exam`, which §2.7.5.1 forbids.
      // Bound: the two fixtures.
      Effect.gen(function* fixture() {
        const files = yield* readPackage(yield* materialize(name));
        const breaches = yield* breachesOf(files);
        const database = yield* databaseOf(files);

        assert.lengthOf(breaches.law, refused, name);
        assert.strictEqual(database.refused, refused, name);
        assert.deepStrictEqual(database.derived, [], name);
        assert.strictEqual(ruleOf(law), "lom-learning-resource-type");
      }).pipe(Effect.provide(NodeServices.layer)),
    );
  }
});

/**
 * Name the situations a sketch reaches: each way a type is refused or accepted, each spelling, each
 * placement, and each decoy.
 *
 * @param sketch - The package.
 * @returns Its situations.
 */
const situationsOf = (sketch: PackageSketch): readonly LomFeature[] => {
  const types = sketch.records.flatMap(({ educational }) => educational.flat());
  const terms = types.flatMap(({ source, value }) => [
    ...Option.toArray(source),
    ...Option.toArray(value),
  ]);
  const found: readonly (readonly [boolean, LomFeature])[] = [
    [types.some(typeRefused), "forbidden"],
    [types.some((type) => Option.isSome(type.source) && typeRefused(type)), "lom source"],
    [
      types.some((type) => !typeRefused(type) && typeRefused({ ...type, source: Option.none() })),
      "other source",
    ],
    [types.some((type) => Option.isNone(type.source) && typeRefused(type)), "no source"],
    [types.some(({ value }) => Option.isNone(value)), "no value"],
    [terms.some(({ text }) => text !== text.trim()), "padding"],
    [terms.some(({ spelling, text }) => spelling === "comment" && text.length > 1), "comment"],
    [terms.some(({ spelling, text }) => spelling === "cdata" && text !== ""), "cdata"],
    [terms.some(({ spelling, text }) => spelling === "charref" && text !== ""), "charref"],
    [repeats(sketch), "repeat"],
    [types.some(({ foreign }) => foreign), "foreign"],
    [sketch.records.some(({ decoy }) => Option.isSome(decoy)), "decoy"],
    [sketch.records.some(({ placement }) => placement === "external"), "external"],
    [sketch.records.some(({ placement }) => placement === "manifest"), "manifest"],
  ];

  return found.flatMap(([holds, situation]) => (holds ? [situation] : []));
};

describe("spec reading 122 over generated packages", { timeout: searchTimeout }, () => {
  it.effect(
    "refuses exactly the types the specification refuses, as the law oracle and the database's statements over the rows each judge them",
    (ctx) =>
      // Oracle: three at once. The specification as a checker over the sketch (`sketchRefusals`:
      // §2.7.5.1's two values, collapsed, under a source that collapses to LOMv1.0 or to nothing,
      // or none); the law oracle's breaches over the package; and the database's statements
      // restated over each document's rows (`databaseRefusals`), whose copies must all hold, but
      // where a term repeats past the binding's cap, which N7 refuses first.
      // Bound: one to three records, in a resource's metadata, the manifest's or a file of their
      // own, each of one or two educational categories of one to three types, each term drawn
      // from 4 forbidden and 7 allowed values or 2 LOM and 5 other sources, under 3 paddings, 4
      // spellings and a repeat, beside a foreign term and another vocabulary's value; each case
      // under its own swarm of the 14 features; 300 cases.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<LomFeature>(
              [
                "forbidden",
                "lom source",
                "other source",
                "no source",
                "no value",
                "padding",
                "comment",
                "cdata",
                "charref",
                "repeat",
                "foreign",
                "decoy",
                "external",
                "manifest",
              ],
              { cases: 200, sense: notesOnly },
            ),
            draw: drawn(packageSketches),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "QTI 3.0 Metadata §2.7.5.1 over the sketch, against the law oracle and the database's statements over the rows",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "test/oracle-rv-m",
          },
          (sketch, c) =>
            Effect.gen(function* generated() {
              c.noteAll(situationsOf(sketch));

              const files = filesOf(sketch);
              const breaches = yield* breachesOf(files);
              const database = yield* databaseOf(files);
              const expected = sketchRefusals(sketch);

              assert.lengthOf(breaches.law, expected, "the law oracle");
              assert.strictEqual(database.refused, expected, "the database's law");
              if (repeats(sketch)) {
                assert.isNotEmpty(breaches.capped, "N7 caps a repeated term");
              } else {
                assert.deepStrictEqual(database.derived, [], "the copies");
                assert.isEmpty(breaches.capped, "no cap is passed");
              }
            }),
        ),
      ),
  );
});
