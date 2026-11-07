/**
 * Choices and their interactions, held three ways over one scope (`#pantry/test/choice-owner-
 * cases.ts`; lane NIL's audit, B5 and B6): the law oracle's verdict, the importer's rows, and the
 * schema's laws over those rows.
 *
 * A choice's interaction is a row of its own, {@link ChoiceInteraction}, written only where an
 * interaction encloses the choice, and the counted family's member; every interaction element has
 * its {@link Interaction}, the family's owner, whether or not it writes a `response-identifier`. So
 * no family member names an owner the import does not write, and the laws judge: a gap outside a
 * gap-match breaks N6 (`ancestry-ban`), an immediate CHECK on `Node`, which PostgreSQL meets before
 * any overlay row; an interaction with no `response-identifier` breaks AL3 (`required-attribute`),
 * likewise. Before, `Choice.interaction` held the document node for "no interaction", and grizzle
 * refused both on the host under no rule.
 *
 * For every case:
 *
 * - The oracle names it by exactly the rules the case says ({@link expectedRules});
 * - No member of any counted or ordered family of the schema names an owner the import writes no row
 *   of ({@link orphansOf});
 * - Every interaction element has its `Interaction` row and every `Binding` its interaction's; every
 *   `ChoiceInteraction` names an `Interaction` and is its choice's nearest, and exists exactly
 *   where the choice's nearest is one: no row stands for "none";
 * - Each interaction's `CountBound.choices` is the count of choices it owns across the package, a
 *   placed fragment's among them, as `Interaction.choices` draws it;
 * - A choice with no `ChoiceInteraction`, the existence law's breach ("N8 nearest"), is only ever in
 *   a case the oracle refuses under N6, which the database meets first.
 *
 * The database's own verdict over the same scope is `src/import/choice-owner.db.test.ts`'s.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar, interactionKinds } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { NodeMember } from "#pantry/import/write.ts";
import {
  choiceOwnerPackage,
  drawnCases,
  expectedRules,
  shownCase,
  smallScope,
} from "#pantry/test/choice-owner-cases.ts";
import type { ChoiceOwnerCase } from "#pantry/test/choice-owner-cases.ts";
import { orphansOf } from "#pantry/test/family-owners.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { judge, lawsOf, ruleOf, shownBreach } from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 4.4 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * The oracle's tables over the installed grammar, which the importer reads.
 */
const laws = lawsOf(grammar);

/**
 * Hold one case to the oracle and its rows to the laws.
 *
 * @param drawnCase - The case.
 * @returns The check.
 */
const holds = (drawnCase: ChoiceOwnerCase) =>
  Effect.gen(function* choiceOwnerHolds() {
    const label = shownCase(drawnCase);
    const entries = choiceOwnerPackage(drawnCase);
    const expected = expectedRules(drawnCase);

    const judgment = yield* judge(filesOf(entries), grammar, laws);
    assert.strictEqual(judgment._tag, "Judged", `${label}: the codec refuses the case`);

    const breaches = judgment._tag === "Judged" ? judgment.breaches : [];
    assert.deepStrictEqual(
      [...new Set(breaches.map(({ law }) => ruleOf(law)))].toSorted(),
      expected,
      `${label}: the oracle's breaches:\n${breaches.map((breach) => `  ${shownBreach(breach, grammar)}`).join("\n")}`,
    );

    const { inputs } = yield* readProgram(yield* scopedPackage(entries));
    const orphans = orphansOf(inputs);
    assert.deepStrictEqual(
      orphans,
      [],
      `${label}: family members with no owner row: ${orphans.map(({ key, member, owner }) => `${member} ${key} into ${owner}`).join("; ")}`,
    );

    const flat = (node: NodeMember): readonly NodeMember[] => [
      node,
      ...node.children.flatMap(flat),
    ];
    const interactionNodes = new Set(
      [...inputs.Node.values()]
        .flatMap(flat)
        .filter(({ kind }) => interactionKinds.includes(kind))
        .map(({ id }) => id),
    );
    const interactions = new Set(inputs.Interaction.keys());
    assert.sameMembers([...interactions], [...interactionNodes], `${label}: Interaction rows`);
    for (const { node } of inputs.Binding.values()) {
      assert.isTrue(interactions.has(node), `${label}: Binding ${node} has no Interaction`);
    }

    const counts = new Map<string, bigint>();
    for (const choice of inputs.Choice.values()) {
      const owned = inputs.ChoiceInteraction.get(choice.node);
      assert.strictEqual(
        owned !== undefined,
        interactions.has(choice.nearest),
        `${label}: choice ${choice.identifier}'s ChoiceInteraction, its nearest ${choice.nearest}`,
      );
      if (owned === undefined) {
        assert.include(
          expected,
          "ancestry-ban",
          `${label}: choice ${choice.identifier} has no interaction, where N6 does not refuse it`,
        );
      } else {
        assert.strictEqual(owned.interaction, choice.nearest, `${label}: ${choice.identifier}`);
        counts.set(owned.interaction, (counts.get(owned.interaction) ?? 0n) + 1n);
      }
    }
    for (const owned of inputs.ChoiceInteraction.values()) {
      assert.isTrue(interactions.has(owned.interaction), `${label}: ${owned.node}'s interaction`);
    }
    for (const bound of inputs.CountBound.values()) {
      if (interactions.has(bound.node)) {
        assert.strictEqual(
          bound.choices,
          counts.get(bound.node) ?? 0n,
          `${label}: CountBound.choices of ${bound.kind}`,
        );
      }
    }
  }).pipe(Effect.scoped, Effect.provide(NodeServices.layer));

describe("choices and their interactions (lane NIL's audit, B5 and B6)", () => {
  it.effect(
    "the small scope: one interaction of each kind, named or not, under each gap placement",
    (ctx) =>
      // Oracle: the specification as a checker (the law oracle), and the schema's family and
      // existence laws evaluated over the importer's rows. Bound: 5 interaction kinds x named or
      // not x 4 gap placements, 40 cases, exhausted.
      searched(
        ctx,
        exhaust(
          {
            box: "one interaction of each kind, named or not, under each gap placement",
            caseHang: Duration.seconds(60),
            coverage: noCoverage,
            generator: int(0, smallScope.length - 1),
            limit: smallScope.length,
            literal: (at) => {
              const drawnCase = smallScope[at];

              return drawnCase === undefined ? String(at) : shownCase(drawnCase);
            },
            oracle: {
              kind: "specification",
              name: "the law oracle, and the family laws over rows",
            },
            suite: "pantry/choice-owner/small-scope",
          },
          (at) => {
            const drawnCase = smallScope[at];
            assert.isDefined(drawnCase, `no case ${String(at)}`);

            return drawnCase === undefined ? Effect.void : holds(drawnCase);
          },
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "drawn cases: up to four interactions under a swarm over kinds, unnamed ones and gap placements",
    (ctx) =>
      // Oracle: as above. Bound: a swarm over the 5 kinds, an unnamed interaction and the 4 gap
      // placements, then 1 to 4 interactions and a placement under it; 40 runs.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(60),
            concurrency: 1,
            coverage: noCoverage,
            draw: drawn(drawnCases),
            kept: [],
            literal: shownCase,
            oracle: {
              kind: "specification",
              name: "the law oracle, and the family laws over rows",
            },
            runs: 40,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/choice-owner/drawn",
          },
          holds,
        ),
      ),
    testTimeoutMs,
  );
});
