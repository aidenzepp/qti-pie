import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";
import { readSource } from "#plate/document/read.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import type { SourceDocument } from "#plate/document/source.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import { openCorpus } from "#plate/test/sweep.ts";
import type { Member } from "#plate/test/sweep.ts";

/**
 * Opening the corpus (about 800 members) runs in seconds here; the bound leaves room for a slow
 * machine without letting a hung run stall the suite.
 */
const sweepTimeoutMs = 600_000;

/**
 * The roots the processing rules judge outside an item: a test's and a section's.
 */
const judgedRoots: ReadonlySet<string> = new Set(["qti-assessment-section", "qti-assessment-test"]);

/**
 * A step of a path that lies inside one of a test's four processing contexts: its outcome
 * processing, a pre-condition, a branch rule or a template default, with or without its sibling
 * index.
 */
const contextStep =
  /(?:^|\/)(?:qti-branch-rule|qti-outcome-processing|qti-pre-condition|qti-template-default)(?:\[\d+\])?(?:\/|$)/u;

/**
 * The last step of a `weight-identifier` attribute's path.
 */
const weightStep = "/@weight-identifier";

/**
 * One corpus test or section document, with its source and what `open` gave it.
 */
interface Judged {
  readonly member: Member;
  readonly source: SourceDocument;
}

/**
 * Every corpus member whose root is a QTI test or section, each `.zip.d` copy included, in the
 * corpus set's order. The set is found by reading each member's source, never by its verdict, so a
 * document `open` judged wrongly is still swept. It runs once per test file, as `openCorpus` does.
 */
const judgedDocuments = Effect.runSync(
  Effect.cached(
    Effect.gen(function* judgedDocuments() {
      const judged: Judged[] = [];
      for (const member of yield* openCorpus) {
        const source = yield* Effect.option(readSource(member.location, member.bytes));
        if (
          Option.isSome(source) &&
          source.value.root.namespace === qtiNamespace &&
          judgedRoots.has(source.value.root.local)
        ) {
          judged.push({ member, source: source.value });
        }
      }

      return judged;
    }),
  ),
);

/**
 * Report whether a refusal points inside a test's processing context or at a `weight-identifier`.
 *
 * @param refusal The refusal.
 * @returns Whether its path lies where the processing rules judge.
 */
const inProcessingContext = (refusal: Refusal): boolean =>
  refusal.location.kind === "path" &&
  (contextStep.test(refusal.location.path) || refusal.location.path.endsWith(weightStep));

/**
 * Report whether a document's root holds a QTI `qti-outcome-processing` child.
 *
 * @param source The document.
 * @returns Whether its root has outcome processing.
 */
const holdsOutcomeProcessing = (source: SourceDocument): boolean =>
  source.root.children.some(
    (child) =>
      child.kind === "element" &&
      child.namespace === qtiNamespace &&
      child.local === "qti-outcome-processing",
  );

describe("the processing rules over the corpus's tests and sections", { tags: ["corpus"] }, () => {
  it.effect(
    "[T-9] refuses no corpus test or section document inside its outcome processing, pre-conditions, branch rules or template defaults, nor at a weight-identifier",
    () =>
      Effect.gen(function* noProcessingRefusal() {
        const documents = yield* judgedDocuments;
        const problems = documents.flatMap(({ member }) =>
          Exit.match(member.verdict, {
            onFailure: (cause) => [
              `${member.location}: open let a defect escape: ${String(cause)}`,
            ],
            onSuccess: (verdict) =>
              verdict.verdict === "refused"
                ? verdict.refusals
                    .filter(inProcessingContext)
                    .map(
                      (refusal) =>
                        `${member.location}: ${refusal.rule} at ${refusal.location.kind === "path" ? refusal.location.path : refusal.location.kind}`,
                    )
                : [],
          }),
        );

        assert.isAbove(documents.length, 0, "the corpus holds no test or section document");
        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[T-9] judges at least one corpus test that holds outcome processing",
    () =>
      Effect.gen(function* someOutcomeProcessingJudged() {
        const judged = (yield* judgedDocuments).filter(
          ({ member, source }) =>
            source.root.local === "qti-assessment-test" &&
            holdsOutcomeProcessing(source) &&
            Exit.isSuccess(member.verdict) &&
            member.verdict.value.verdict !== "unchecked",
        );

        assert.isAbove(judged.length, 0, "no judged corpus test holds outcome processing");
      }),
    sweepTimeoutMs,
  );
});
