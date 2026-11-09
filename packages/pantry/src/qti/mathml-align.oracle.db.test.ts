/**
 * The align laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): the laws
 * "MathML maction selection", "MathML align placement" and "MathML align first", over whole
 * packages through the importer and over direct rows.
 *
 * - **Whole packages through the importer:** each case is a formula in the prompt of the MathML base
 *   item. A fixture of the free tables (`#pantry/test/fixtures.mathml.ts`) is used as it stands,
 *   and its expected law and rule are the ones its table row states; the one case no fixture covers
 *   is a spec of this file ({@link formulaSpec}). A refused one is refused under its law and its
 *   rule, in the origin of the `ImportRefused` the importer raises, and the law oracle
 *   (`#pantry/test/oracle.ts`) predicts the same law and rule with no database. An accepted one
 *   commits, as the oracle predicts.
 * - **Direct rows:** a `MathAction` row that writes `selection="-1"` (F4, the leased witness of
 *   `repair-sn-3`) is refused by `MathML_maction_selection` and not by `E1_derived`, whose
 *   derivation of the selection it satisfies; a `MathAlignScope` row whose state contradicts what
 *   its parent passes is refused by `E1_derived`.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer, Result } from "effect";
import { describe } from "vitest";
import { composed } from "#pantry/grammar/compose.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import type { LawName, Rule } from "#pantry/import/refusal.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { readPackage } from "#pantry/package/read.ts";
import { MathAction, MathAlignScope } from "#pantry/qti/mathml-align.ts";
import { assertVerdict, judged, loginSession, statedInserts } from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import type { FixtureSpec } from "#pantry/test/fixtures.ts";
import { materializeMathml, mathmlNegatives, mathmlSpecOf } from "#pantry/test/fixtures.mathml.ts";
import type { MathmlFixtureName } from "#pantry/test/fixtures.mathml.ts";
import { judge, lawsOf, ruleOf, verdictOf } from "#pantry/test/oracle.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The spec of a formula item: the MathML base item the free fixtures are cut from, with the
 * formula in its prompt replaced by `block`.
 *
 * @param name - The fixture's name, which names its directory.
 * @param block - The `m:math` element's text, in the `m` prefix the base item declares.
 * @returns The spec; the edit that places the formula is the one fixture `math-apply-binary-one`
 *   makes, which the spec of this one takes as it is but for its text.
 */
const formulaSpec = (name: string, block: string): FixtureSpec => {
  const base = mathmlSpecOf("math-apply-binary-one");
  const edits = base.edits.map((edit) =>
    edit._tag === "ReplaceText" && edit.search === "<qti-prompt>"
      ? { ...edit, replacement: `<qti-prompt>${block}` }
      : edit,
  );

  assert.lengthOf(
    base.edits.filter((edit) => edit._tag === "ReplaceText" && edit.search === "<qti-prompt>"),
    1,
    "the base fixture places its formula by one edit at <qti-prompt>",
  );

  return { ...base, edits, name };
};

/**
 * The law a free negative fixture is expected to be refused under, and its rule.
 */
interface NegativeVerdict {
  readonly law: LawName;
  readonly rule: Rule;
}

/**
 * The law and the rule a free negative fixture is expected to be refused under, as its table row
 * states them.
 *
 * @param name - The negative fixture's name.
 * @returns Its law and rule; a name no negative has fails the case.
 */
const negativeOf = (name: MathmlFixtureName): NegativeVerdict => {
  const found = mathmlNegatives.find((negative) => negative.name === name);

  if (found === undefined || found.law === "codec") {
    return assert.fail(`${name} is no negative of a law`);
  }

  return { law: found.law, rule: found.rule };
};

/**
 * The formulas the laws refuse, with the law and the rule each is refused under.
 */
const refusals = [
  {
    ...negativeOf("math-maction-selection"),
    dir: () => materializeMathml("math-maction-selection"),
    name: "a selection of 3 over two children",
  },
  {
    // Both judges refuse it under this law, and name different rules: the oracle's verdict is the
    // catalog's most specific breach, `child-set` (N7 Last ranks first), where the importer names
    // the first PostgreSQL object to refuse, `union-count`. That is the stated limit in
    // `#pantry/import/package.ts` (grizzle writes in relation-name order), so the import's rule is
    // held to be among the oracle's breach rules, not equal to its verdict.
    dir: () =>
      materializeSpec(
        formulaSpec(
          "p6n-28-maction-no-child",
          '<m:math><m:maction actiontype="toggle"></m:maction></m:math>',
        ),
      ),
    law: "MathML maction selection",
    name: "an maction with no child",
    precedence: false,
    rule: "union-count",
  },
  {
    ...negativeOf("math-maligngroup-placement"),
    dir: () => materializeMathml("math-maligngroup-placement"),
    name: "a group in a cell under an mfrac, mtd > mfrac > mrow(maligngroup, mi)",
  },
  {
    ...negativeOf("math-maligngroup-first"),
    dir: () => materializeMathml("math-maligngroup-first"),
    name: "a cell whose first complete element is no group, mtd(mi, maligngroup, mi)",
  },
] as const;

/**
 * The formulas the laws accept.
 */
const acceptances = [
  {
    dir: () => materializeMathml("math-mrow-dir-group"),
    name: "a group in an mrow dir=ltr, which changes no direction",
  },
  {
    dir: () => materializeMathml("math-maction-group-unselected"),
    name: "a group in an maction child that is not the selected one",
  },
  {
    dir: () => materializeMathml("math-group-outside-scope"),
    name: "a group outside a table",
  },
] as const;

/**
 * The node of the action the direct cases write.
 */
const actionNode = "00000000-0000-4000-8000-0000000000a1";

/**
 * The node of the scope row the direct cases write.
 */
const scopeNode = "00000000-0000-4000-8000-0000000000a2";

/**
 * The document the direct cases' rows name, which holds none of them.
 */
const strayDocument = "00000000-0000-4000-8000-0000000000ff";

/**
 * The cell the scope row stands in.
 */
const strayCell = "00000000-0000-4000-8000-0000000000c1";

/**
 * The name PostgreSQL gives `E1_derived`'s check, which grizzle writes in snake case.
 */
const derivedCheck = "e_1_derived";

/**
 * The name PostgreSQL gives `MathML_maction_selection`'s check.
 */
const selectionCheck = "math_ml_maction_selection";

/**
 * The facts of an `m:maction` that writes a `selection` over two element children: the lexical
 * form, its collapsed text and the integer `E1_derived` derives from them.
 *
 * @param lexical - The attribute's form as written.
 * @param selection - The integer the form reads as, 0 for a negative one.
 * @returns The facts; every field is lawful but the selection's range.
 */
const action = (lexical: string, selection: bigint): readonly Stated[] => [
  {
    fact: {
      elementChildren: 2n,
      elements: 0n,
      node: actionNode,
      selection,
      selectionLexical: lexical,
      selectionText: lexical,
      selectionWritten: true,
    },
    relation: MathAction,
  },
];

/**
 * The facts of an `m:mi` row of a cell's scope, whose state each case varies: lawful where it
 * states the state its parent passes, with a parent that is a cell.
 *
 * @param overrides - The fields a case sets beside the lawful ones.
 * @returns The facts, in writing order.
 */
const scoped = (overrides: Readonly<Record<string, string | bigint>>): readonly Stated[] => [
  {
    fact: {
      cell: strayCell,
      chosen: 0n,
      dirLexical: "",
      document: strayDocument,
      elementChildren: 0n,
      elements: 1n,
      inherited: "ltr",
      kind: "m:mi",
      nearest: strayCell,
      node: scopeNode,
      own: "ltr",
      parent: strayCell,
      parentKind: "m:mtd",
      passes: "closed",
      received: "open",
      start: 2n,
      state: "open",
      version: "3.0.1",
      ...overrides,
    },
    relation: MathAlignScope,
  },
];

describe.skipIf(!hasLease)(
  "qti/mathml-align.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the align laws, judged by PostgreSQL", (it) => {
      for (const { dir, law, name, ...stated } of refusals) {
        const { rule } = stated;
        const verdictEqual = !("precedence" in stated);

        it.effect(`refuses ${name} under ${law}, as the law oracle predicts`, () =>
          // Oracle: the specification as a checker (MathML 3 §3.7.1.1 and §3.5.5.2, reading 2): the
          // free fixtures' law and rule for the formula, which the law oracle predicts as well.
          Effect.gen(function* refusedAlign() {
            const package_ = yield* dir();
            const grammar = Result.getOrThrow(composed());
            const judgment = yield* judge(yield* readPackage(package_), grammar, lawsOf(grammar));
            const refused = yield* Effect.flip(importPackage(package_));

            assert.isTrue(
              judgment._tag === "Judged" && judgment.breaches.some((breach) => breach.law === law),
              `${name}: the oracle's breaches name ${law}`,
            );
            if (verdictEqual) {
              assert.deepStrictEqual(verdictOf(judgment), { rule, verdict: "refused" }, name);
            } else {
              assert.isTrue(
                judgment._tag === "Judged" &&
                  judgment.breaches.some((breach) => ruleOf(breach.law) === rule),
                `${name}: the import's rule ${rule} is among the oracle's breach rules`,
              );
            }

            assert.isTrue(refused instanceof ImportRefused, `${name}: ${refused._tag}`);

            if (refused instanceof ImportRefused) {
              assert.strictEqual(refused.rules[0], rule, name);
              assert.strictEqual(refused.origin._tag, "Database", name);
              assert.isTrue(
                refused.origin._tag === "Database" &&
                  refused.origin.laws.some((refusedLaw) => refusedLaw.name === law),
                `${name}: the database's laws name ${law}`,
              );
            }
          }),
        );
      }

      for (const { dir, name } of acceptances) {
        it.effect(`accepts ${name}, as the law oracle predicts`, () =>
          // Oracle: the specification as a checker (MathML 3 §3.5.5.2 and §3.5.5.9, operator
          // decision 321), and the law oracle's verdict on the same package.
          Effect.gen(function* acceptedAlign() {
            const package_ = yield* dir();
            const grammar = Result.getOrThrow(composed());
            const judgment = yield* judge(yield* readPackage(package_), grammar, lawsOf(grammar));
            const imported = yield* Effect.result(importPackage(package_));

            assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" }, name);
            assert.isTrue(
              imported._tag === "Success",
              `${name}: ${imported._tag === "Failure" ? imported.failure.message : "accepted"}`,
            );
          }),
        );
      }

      it.effect(
        "refuses an maction that writes selection=-1 by MathML_maction_selection, not by E1_derived, and accepts a selection of 2 over two children",
        () =>
          // Oracle: MathML 3 §3.7.1.1 ("If the value specified is out of range, it is an error"),
          // F4 of repair-sn-3: a negative selection is derived as 0 by `E1_derived`, which this row
          // satisfies, so only the range check refuses it.
          // Bound: a selection of -1 over two children, whose derivation is lawful; a selection of 2
          // over two children, the last child.
          Effect.gen(function* negativeSelection() {
            const client = yield* loginSession;

            assertVerdict(
              yield* judged(client, statedInserts(action("-1", 0n))),
              selectionCheck,
              true,
              "selection -1 over two children",
            );
            assertVerdict(
              yield* judged(client, statedInserts(action("2", 2n))),
              selectionCheck,
              false,
              "selection 2 over two children",
            );
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a scope row whose state contradicts its parent's, by E1_derived, and accepts the state its parent passes",
        () =>
          // Oracle: MathML 3 §3.5.5.2 and §3.5.5.9 as the module states them: a row's state is
          // what its parent passed, `unjudged` under an maction where its rank is not the chosen
          // one.
          // Bound: a child of an open cell that states `closed` where it received `open`; one that
          // states `open` where it received `closed`; a child of an maction, not the selected
          // one, that states `open`; and the lawful state in each of the first and the third.
          Effect.gen(function* scopeState() {
            const client = yield* loginSession;
            const underAction = {
              chosen: 2n,
              elements: 1n,
              parentKind: "m:maction",
              passes: "unjudged",
              state: "unjudged",
            } as const;

            for (const [label, overrides, refused] of [
              ["closed where it received open", { state: "closed" }, true],
              ["open where it received closed", { received: "closed" }, true],
              [
                "open under an maction, not the chosen child",
                { ...underAction, passes: "open", state: "open" },
                true,
              ],
              ["open where it received open", {}, false],
              ["unjudged under an maction, not the chosen child", underAction, false],
            ] as const) {
              assertVerdict(
                yield* judged(client, statedInserts(scoped(overrides))),
                derivedCheck,
                refused,
                label,
              );
            }
          }).pipe(Effect.scoped),
      );
    });
  },
);
