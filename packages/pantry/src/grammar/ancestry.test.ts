import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option } from "effect";
import { flags, rowOf, step } from "#pantry/grammar/ancestry.ts";
import { admits, ancestryIndexesOf } from "#pantry/test/indexes.ts";
import type { Ancestry, Flag } from "#pantry/grammar/ancestry.ts";
import { composed } from "#pantry/grammar/compose.ts";

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * The choice-like kinds spec 3.7 lets hold an interaction's options, whose content no interaction
 * may enter: the prompt, the choices, the label and the gap choices.
 */
const choiceLike = new Set([
  "qti-prompt",
  "qti-simple-choice",
  "qti-simple-associable-choice",
  "qti-inline-choice",
  "qti-label",
  "qti-gap-text",
  "qti-gap-img",
]);

/**
 * A kind's rows of the three flag sets, as the reference model states them.
 */
interface FlagSets {
  readonly banned: ReadonlySet<Flag>;
  readonly enters: ReadonlySet<Flag>;
  readonly needs: ReadonlySet<Flag>;
}

/**
 * Whether two sets of flags hold the same flags.
 *
 * @param left - A set.
 * @param right - A set.
 * @returns Whether they are equal.
 */
const same = (left: ReadonlySet<Flag>, right: ReadonlySet<Flag>): boolean =>
  left.symmetricDifference(right).size === 0;

/**
 * The reference model of the flag sets, written from the QTI readings by the kinds' categories
 * rather than from `ancestry.ts`'s blocks: which flags a kind enters, which it may not sit under,
 * and which it needs. MathML's `m:math` enters `math` and may not sit under it: "it is an error for
 * one math element to contain another" (MathML 3 §2.2, spec reading 2).
 *
 * @param kind - The kind.
 * @param interaction - Whether it is an interaction, by the `Interaction` set.
 * @returns Its flags.
 */
const referenceOf = (kind: string, interaction: boolean): FlagSets => {
  const template = kind.startsWith("qti-template-block") || kind.startsWith("qti-template-inline");
  const templateBlock = kind.startsWith("qti-template-block");
  const enters = new Set<Flag>([
    ...(interaction ? ["int" as const] : []),
    ...(kind === "qti-gap-match-interaction" ? ["gap" as const] : []),
    ...(choiceLike.has(kind) ? ["choice" as const] : []),
    ...(kind === "qti-hottext" ? ["htx" as const] : []),
    ...(kind === "qti-rubric-block" ? ["rubric" as const] : []),
    ...(templateBlock ? ["tmpl" as const] : []),
    ...(kind === "qti-modal-feedback" ? ["modal" as const] : []),
    ...(kind.startsWith("qti-feedback-block") || kind === "qti-feedback-inline"
      ? ["fb" as const]
      : []),
    ...(kind === "qti-rubric-block.test" || kind === "qti-test-feedback" ? ["test" as const] : []),
    ...(kind === "m:math" ? ["math" as const] : []),
  ]);
  const banned = new Set<Flag>([
    ...(interaction ? (["int", "choice", "htx", "rubric", "tmpl", "modal", "test"] as const) : []),
    ...(kind === "qti-rubric-block" ? ["rubric" as const] : []),
    ...(kind === "qti-hottext" ? ["htx" as const] : []),
    ...(template ? ["test" as const] : []),
    ...(kind === "m:math" ? ["math" as const] : []),
  ]);
  const needs = new Set<Flag>(kind === "qti-gap" ? ["gap"] : []);

  return { banned, enters, needs };
};

/**
 * Decide a path below the document node by the reference model, from each node's ancestors
 * directly: a node may sit where no ancestor (the document included) enters a flag it is banned
 * under and some ancestor enters every flag it needs. No step fold is read.
 *
 * @param path - The kinds, the document node first.
 * @param interaction - Whether a kind is an interaction.
 * @returns Whether every node of the path may sit where it does.
 */
const referenceAdmits = (
  path: readonly string[],
  interaction: (kind: string) => boolean,
): boolean =>
  path.every((kind, at) => {
    const above = new Set(
      path
        .slice(0, at)
        .flatMap((ancestor) => [...referenceOf(ancestor, interaction(ancestor)).enters]),
    );
    const own = referenceOf(kind, interaction(kind));

    return own.banned.isDisjointFrom(above) && own.needs.isSubsetOf(above);
  });

/**
 * Fold a path below the document node through the grammar, as the host and the database fold
 * `parentAncestry | Enters[kind]`: the document node sits in the empty ancestry (N1), and each node
 * must be admitted in the ancestry its parent hands it.
 *
 * @param sets - The ancestry grammar.
 * @param path - The kinds, the document node first.
 * @returns Whether every node may sit where it does.
 */
const grammarAdmits = (sets: Parameters<typeof step>[0], path: readonly string[]): boolean => {
  let ancestry: Ancestry = new Set();
  for (const kind of path) {
    if (!admits(sets, ancestry, kind)) {
      return false;
    }

    ancestry = step(sets, ancestry, kind);
  }

  return true;
};

/**
 * The 27 kinds the exhaustive search draws paths over: every kind some flag set names but the
 * interactions, of which it holds four (the choice, gap match, portable custom and text entry
 * interactions), and two kinds no set names, `p` and `div`. The other interactions are checked row
 * by row, beside every other kind, by the whole-roster test below.
 */
const flagged = [
  "p",
  "div",
  ...choiceLike,
  "qti-gap",
  "qti-gap-match-interaction",
  "qti-hottext",
  "qti-rubric-block",
  "qti-rubric-block.test",
  "qti-test-feedback",
  "qti-modal-feedback",
  "qti-feedback-block",
  "qti-feedback-block.template",
  "qti-feedback-inline",
  "qti-template-block",
  "qti-template-inline",
  "qti-template-block.rubric",
  "qti-template-inline.rubric",
  "qti-choice-interaction",
  "qti-portable-custom-interaction",
  "qti-text-entry-interaction",
  "m:math",
] as const;

/**
 * How long the exhaustive path search may take: ten times the 4.5 s its 16,276 cases (25 kinds)
 * took on 2026-11-05 at a load average of about 15, rounded up. Its 18,279 cases (every path of at
 * most 3 of 26 kinds, 1 + 26 + 26² + 26³) took 6.5 s the same day at a load average of about 40,
 * and its 20,440 (27 kinds) are within the same bound.
 * Measured 2026-11-07: 5.2 s at a load average of 63 to 73.
 */
const pathsTimeout = 60_000;

describe("the ancestry grammar against the reference model", () => {
  it.effect(
    "admits exactly the paths the readings admit, every path of at most 3 flag-relevant kinds below the document node",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every path of at most 3 of the 27 flag-relevant kinds below the document node: 20,440 paths",
            caseHang: Duration.minutes(5),
            coverage: requiredInSpace<"admitted" | "refused" | "self-banned admitted">([
              "admitted",
              "refused",
              "self-banned admitted",
            ]),
            generator: array(element(flagged), { max: 3, min: 0 }),
            limit: 50_000,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the reference model of the flag sets, written from the QTI readings by the kinds' categories (referenceAdmits)",
            },
            suite: "grammar/ancestry/paths",
          },
          (path, c) =>
            Effect.gen(function* everyPath() {
              const { ancestry, kinds } = yield* grammar;
              const interaction = (kind: string) =>
                Option.isSome(kinds.interaction.lookup({ kind }));
              const full = ["document", ...path];
              const expected = referenceAdmits(full, interaction);
              c.note(expected ? "admitted" : "refused");

              const [last] = path.slice(-1);
              if (
                expected &&
                last !== undefined &&
                !rowOf(ancestryIndexesOf(ancestry).banned, last).isDisjointFrom(
                  rowOf(ancestry.enters, last),
                )
              ) {
                c.note("self-banned admitted");
              }

              assert.strictEqual(grammarAdmits(ancestry, full), expected, full.join(" > "));
            }),
        ),
      ),
    pathsTimeout,
  );

  it.effect("states every kind's rows as the reference does, over the whole roster", () =>
    Effect.gen(function* everyKind() {
      const { ancestry, kinds } = yield* grammar;
      const differing = kinds.nodeKind.handles.flatMap((kind) => {
        const reference = referenceOf(kind, Option.isSome(kinds.interaction.lookup({ kind })));

        return same(rowOf(ancestry.enters, kind), reference.enters) &&
          same(rowOf(ancestryIndexesOf(ancestry).banned, kind), reference.banned) &&
          same(rowOf(ancestryIndexesOf(ancestry).needs, kind), reference.needs)
          ? []
          : [kind];
      });

      assert.deepStrictEqual(differing, []);
      assert.deepStrictEqual(rowOf(ancestry.enters, "document"), new Set());
      assert.deepStrictEqual(
        [...flags],
        ["fb", "modal", "rubric", "tmpl", "int", "gap", "choice", "htx", "test", "math"],
      );
    }),
  );
});
