/**
 * Every family's member names an owner row the import writes, over a package drawn to break each
 * law the law oracle declares (lane NIL's audit: Site, B5 and B6).
 *
 * Each import is one ChangeSet of immutable relations, so grizzle appends a counted or ordered
 * family's member only to an owner that ChangeSet inserts, and refuses any other on the host before
 * a statement reaches PostgreSQL, under no rule of the schema (`#pantry/test/family-owners.ts`). A
 * package the schema must refuse is refused by its law only where no member of its rows is such an
 * orphan: this file holds the importer to that over the packages `src/test/oracle.complete.test.ts`
 * draws, one per law, each breaking that law in a package the oracle accepts, and over the accepted
 * bases themselves.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { orphansOf } from "#pantry/test/family-owners.ts";
import {
  everyRelationPackage,
  memberCounts,
  scopedPackage,
} from "#pantry/test/gen/every-relation.ts";
import type { MemberCounts, PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { contentEdits } from "#pantry/test/oracle-complete/content-edits.ts";
import { documentMutations } from "#pantry/test/oracle-complete/documents.ts";
import { expressionMutations } from "#pantry/test/oracle-complete/expressions.ts";
import { foreignEdits } from "#pantry/test/oracle-complete/foreign-edits.ts";
import { layerMutations } from "#pantry/test/oracle-complete/layer.ts";
import { everyRelationBase } from "#pantry/test/oracle-complete/mutation.ts";
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";
import { overlayMutations } from "#pantry/test/oracle-complete/overlays.ts";
import { packageMutations } from "#pantry/test/oracle-complete/packages.ts";
import { testMutations } from "#pantry/test/oracle-complete/tests.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 2.4 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * Every law's mutation over a package's text, by law, as `oracle.complete.test.ts` gathers them:
 * the mutations over folded rows write no package and are left out.
 */
const packageMutationsByLaw: readonly (readonly [string, Mutation])[] = Object.entries({
  ...layerMutations,
  ...overlayMutations,
  ...packageMutations,
  ...foreignEdits,
  ...contentEdits,
  ...documentMutations,
  ...expressionMutations,
  ...testMutations,
}).filter(([, mutation]) => mutation.over === "package");

/**
 * Read a package's import rows and hold every family member to its owner.
 *
 * @param entries - The package.
 * @param label - Its name, for the assertion's message.
 * @returns The check.
 */
const ownersHold = (entries: PackageEntries, label: string) =>
  Effect.gen(function* familyOwnersHold() {
    // A package the reader or the codec refuses writes no row at all, so no member of its rows can
    // name an absent owner: a mutation whose law moved to the reader (crust daed3e96's URI
    // reference, for Namespace name) holds here by having no rows.
    const program = yield* readProgram(yield* scopedPackage(entries)).pipe(
      Effect.map(Option.some),
      Effect.catchTag("ImportRefused", () => Effect.succeed(Option.none())),
    );
    if (Option.isNone(program)) {
      return;
    }

    const orphans = orphansOf(program.value.inputs);
    assert.deepStrictEqual(
      orphans,
      [],
      `${label}: family members with no owner row: ${orphans.map(({ key, member, owner }) => `${member} ${key} into ${owner}`).join("; ")}`,
    );
  }).pipe(Effect.scoped, Effect.provide(NodeServices.layer));

describe("every family member names an owner the import writes", () => {
  it.effect(
    "over the every-relation package, which the oracle accepts",
    (ctx) =>
      // Oracle: grizzle's own rule, that a member's group key names an owner its ChangeSet inserts,
      // evaluated over the rows. Bound: the every-relation package's member counts; 4 runs.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(120),
            concurrency: 1,
            coverage: noCoverage,
            draw: drawn(memberCounts),
            kept: [],
            literal: JSON.stringify,
            oracle: { kind: "specification", name: "grizzle's append to an inserted owner" },
            runs: 4,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/family-owners/every-relation",
          },
          (members: MemberCounts) =>
            ownersHold(everyRelationPackage(members), JSON.stringify(members)),
        ),
      ),
    testTimeoutMs,
  );

  for (const [law, mutation] of packageMutationsByLaw) {
    if (mutation.over === "package") {
      it.effect(
        `over a package drawn to break ${law}`,
        (ctx) =>
          // Oracle: as above. Bound: the every-relation package's member counts (or the
          // mutation's own base), each case drawing the mutation's site and value; 2 runs.
          searched(
            ctx,
            explore(
              {
                caseHang: Duration.seconds(120),
                concurrency: 1,
                coverage: noCoverage,
                draw: drawn(memberCounts),
                kept: [],
                literal: JSON.stringify,
                oracle: { kind: "specification", name: "grizzle's append to an inserted owner" },
                runs: 2,
                shrink: completeShrink,
                steerEvery: 16,
                suite: `pantry/family-owners/${law}`,
              },
              (members: MemberCounts, c) => {
                const entries = (mutation.base ?? everyRelationBase)(members);
                const mutated = c.draw(mutation.mutate({ entries, members }, grammar));

                return ownersHold(mutated, `${law} ${JSON.stringify(members)}`);
              },
            ),
          ),
        testTimeoutMs,
      );
    }
  }
});
