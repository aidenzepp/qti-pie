/**
 * A placed ID's copy, held over the every-relation package (lane NIL's audit, C1; NS4): the law
 * oracle's verdict, the importer's rows, and the schema's E1 law over them.
 *
 * Every ID of an assembly is placed once per instance ({@link PlacedId}) and bound in its
 * assembly's ID table ({@link AssembledId}), keyed by `(assembly, id, owner, copy)`. Under an
 * item's assembly the copy is the instance, since a fragment placed twice holds its IDs twice, as
 * its merged document does. Under a test's assembly a section document placed twice is written once
 * (reading 86), so the copy is the placed document. Before NS4 that copy was the nil uuid, an id
 * the import never mints (GEN-A's `dangling-uuid: AssembledId.copy` and `PlacedId.copy`). The key
 * `(assembly, id)` is "DocumentId key" over the merged document either way.
 *
 * For every case:
 *
 * - The oracle names it by exactly the rules the case says;
 * - Every copy is an id the import mints: the instance under an item's assembly, the placed document
 *   under a test's, which is the `E1_derived` law the schema states over `PlacedId`;
 * - No member of any family of the schema names an owner the import writes no row of.
 *
 * The cases edit the every-relation package's test and its section document: the section's rubric
 * carries an ID or not, the test places the section document once or twice, and the test's own
 * rubric carries that ID too or not.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { InstanceMember } from "#pantry/import/overlays/tests.ts";
import { orphansOf } from "#pantry/test/family-owners.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { cases, holdsTwice, packageOf, shown } from "#pantry/test/placed-id-copy-cases.ts";
import type { CopyCase } from "#pantry/test/placed-id-copy-cases.ts";
import { judge, lawsOf, ruleOf, shownBreach } from "#pantry/test/oracle.ts";

/**
 * The oracle's tables over the installed grammar, which the importer reads.
 */
const laws = lawsOf(grammar);

/**
 * Hold one case.
 *
 * @param drawnCase - The case.
 * @returns The check.
 */
const holds = (drawnCase: CopyCase) =>
  Effect.gen(function* placedIdCopyHolds() {
    const label = shown(drawnCase);
    const entries = packageOf(drawnCase);
    const judgment = yield* judge(filesOf(entries), grammar, laws);
    assert.strictEqual(judgment._tag, "Judged", `${label}: the codec refuses the case`);

    const breaches = judgment._tag === "Judged" ? judgment.breaches : [];
    assert.deepStrictEqual(
      [...new Set(breaches.map(({ law }) => ruleOf(law)))].toSorted(),
      holdsTwice(drawnCase) ? ["document-key"] : [],
      `${label}: the oracle's breaches:\n${breaches.map((breach) => `  ${shownBreach(breach, grammar)}`).join("\n")}`,
    );

    const { inputs } = yield* readProgram(yield* scopedPackage(entries));
    const orphans = orphansOf(inputs);
    assert.deepStrictEqual(
      orphans,
      [],
      `${label}: family members with no owner row: ${orphans.map(({ key, member, owner }) => `${member} ${key} into ${owner}`).join("; ")}`,
    );

    const instances = (instance: InstanceMember): readonly InstanceMember[] => [
      instance,
      ...instance.children.flatMap(instances),
    ];
    const minted = new Set([
      ...[...inputs.Instance.values()].flatMap(instances).map((instance) => instance.id),
      ...inputs.Document.keys(),
    ]);
    const placed = [...inputs.PlacedId.values()];
    assert.isTrue(
      !drawnCase.sectionId ||
        placed.some(({ assemblyKind }) => assemblyKind === "qti-assessment-test"),
      `${label}: no ID is placed under the test`,
    );
    for (const row of placed) {
      assert.strictEqual(
        row.copy,
        row.assemblyKind === "qti-assessment-test" ? row.document : row.instance,
        `${label}: ${row.id}'s copy under ${row.assemblyKind}`,
      );
    }
    const bindings = [...inputs.AssembledId.values()];
    for (const row of bindings) {
      assert.isTrue(minted.has(row.copy), `${label}: ${row.id}'s copy ${row.copy} is no minted id`);
    }
    const bound = Map.groupBy(bindings, ({ assembly, id: held }) => `${assembly} ${held}`);
    assert.strictEqual(
      [...bound.values()].some((rows) => rows.length > 1),
      holdsTwice(drawnCase),
      `${label}: an assembly binds one ID twice, which "DocumentId key" refuses`,
    );
  }).pipe(Effect.scoped, Effect.provide(NodeServices.layer));

describe("a placed ID's copy (lane NIL's audit, C1)", () => {
  it.effect(
    "is the instance under an item's assembly and the placed document under a test's, never an id the import does not mint",
    (ctx) =>
      // Oracle: the specification as a checker (the law oracle's DocumentId key over the merged
      // test, reading 86), and the schema's E1 law and its families over the importer's rows.
      // Bound: a section ID or none, the section placed once or twice, the test's own rubric
      // carrying the ID or not; 8 cases, exhausted.
      searched(
        ctx,
        exhaust(
          {
            box: "a section ID or none, placed once or twice, the test's own ID or none",
            caseHang: Duration.seconds(120),
            coverage: noCoverage,
            generator: int(0, cases.length - 1),
            limit: cases.length,
            literal: (at) => {
              const drawnCase = cases[at];

              return drawnCase === undefined ? String(at) : shown(drawnCase);
            },
            oracle: { kind: "specification", name: "the law oracle, and PlacedId's E1 over rows" },
            suite: "pantry/placed-id-copy",
          },
          (at) => {
            const drawnCase = cases[at];
            assert.isDefined(drawnCase, `no case ${String(at)}`);

            return drawnCase === undefined ? Effect.void : holds(drawnCase);
          },
        ),
      ),
    600_000,
  );
});
