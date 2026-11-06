import { assert, describe, it } from "@effect/vitest";
import { Cause, Effect, Exit, Option, Result } from "effect";
import { rowFor } from "#plate/emit/parts.ts";
import { configure } from "#plate/index.ts";
import type { Accepted, Configuration, Element, Node, Verdict } from "#plate/index.ts";
import { message } from "#plate/messages.ts";
import { refusalRules } from "#plate/validate/refusal.ts";
import { checkTree, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { acceptedOf, openCorpus, threeStates } from "#plate/test/sweep.ts";
import type { Member } from "#plate/test/sweep.ts";

/**
 * Opening the corpus (about 800 members) and rendering every accepted item in three states runs
 * in seconds here; the bound leaves room for a slow machine without letting a hung run stall the
 * suite.
 */
const sweepTimeoutMs = 600_000;

/**
 * The Notice part's `data-slot` marker, read through the part table.
 */
const noticeSlot = rowFor("item", "notice").slot;

/**
 * The verdict kinds that carry an accepted document.
 */
const acceptingKinds: ReadonlySet<Verdict["verdict"]> = new Set([
  "accepted",
  "accepted-with-unsupported",
]);

/**
 * The kinds of place a refusal can point at.
 */
const locationKinds: ReadonlySet<string> = new Set(["document", "path", "position"]);

/**
 * List the elements of a tree in document order, the root first.
 *
 * @param nodes The tree's nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the verdicts the sweep opened, by member. A member `open` let a defect escape from has no
 * verdict and is left out here; the first test names it.
 *
 * @param members The opened members.
 * @returns Each member that has a verdict, with it.
 */
const verdictsOf = (members: readonly Member[]): readonly (readonly [Member, Verdict])[] =>
  members.flatMap((member) =>
    Exit.match(member.verdict, {
      onFailure: () => [],
      onSuccess: (verdict) => [[member, verdict] as const],
    }),
  );

/**
 * Remove each of a multiset's values once per occurrence in another.
 *
 * @param from The values, with repeats.
 * @param taken The values to remove, with repeats.
 * @returns What stays of `from`, in its order.
 */
const without = (from: readonly string[], taken: readonly string[]): readonly string[] => {
  const left = [...taken];

  return from.filter((value) => {
    const index = left.indexOf(value);
    if (index === -1) {
      return true;
    }

    left.splice(index, 1);

    return false;
  });
};

/**
 * Parse one state's HTML into its single root element.
 *
 * @param html The state's HTML.
 * @returns The root element, or none when the HTML is not exactly one element.
 */
const rootOf = (html: string): Option.Option<Element> => {
  const parsed = parseHtml(html);
  const [root] = parsed;

  return parsed.length === 1 && root?.kind === "element" ? Option.some(root) : Option.none();
};

/**
 * One accepted member's render: its three states, or the error `render` gave.
 */
interface Rendering {
  readonly accepted: Accepted;
  /**
   * The locale the states rendered in, which words their Notices.
   */
  readonly locale: Configuration["locale"];
  readonly location: string;
  readonly states: ReturnType<typeof threeStates>;
}

/**
 * Render every accepted member in its three states.
 *
 * @param members The opened members.
 * @param configuration The configuration every state renders with.
 * @returns Each accepted member's render, in the set's order.
 */
const renderingsOf = (
  members: readonly Member[],
  configuration: Configuration,
): readonly Rendering[] =>
  members.flatMap((member) =>
    Option.match(acceptedOf(member), {
      onNone: () => [],
      onSome: (accepted) => [
        {
          accepted,
          locale: configuration.locale,
          location: member.location,
          states: threeStates(accepted, configuration),
        },
      ],
    }),
  );

/**
 * Collect the problems one check finds in every state of every render, naming the member and the
 * state of each; a render that failed, or HTML that is not exactly one element, is a problem.
 *
 * @param renderings The renders.
 * @param problemsOf The check, over one state's root element.
 * @returns Every problem, empty when every state holds.
 */
const statesProblems = (
  renderings: readonly Rendering[],
  problemsOf: (rendering: Rendering, where: string, root: Element) => readonly string[],
): readonly string[] =>
  renderings.flatMap((rendering) =>
    Result.match(rendering.states, {
      onFailure: (error) => [
        `${rendering.location}: render failed: ${error._tag}: ${error.message}`,
      ],
      onSuccess: (states) =>
        states.flatMap((state) => {
          const where = `${rendering.location}, ${state.name}`;

          return Option.match(rootOf(state.html), {
            onNone: () => [`${where}: the HTML is not exactly one element`],
            onSome: (root) => problemsOf(rendering, where, root),
          });
        }),
    }),
  );

/**
 * Check one state against the round trip and R1: its HTML round-trips, shows a notice for exactly
 * the verdict's notice-shown features, and shows none for the features the verdict marks, which
 * render nowhere.
 *
 * @param rendering The render, with its accepted document.
 * @param where The member and state, which every problem names.
 * @param root The state's root element.
 * @returns Each problem found, empty when the state holds.
 */
const r1Problems = (rendering: Rendering, where: string, root: Element): readonly string[] => {
  const { unsupported } = rendering.accepted;
  const featureOf = new Map(
    unsupported.map(
      (entry) =>
        [message(rendering.locale, "notice", { feature: entry.feature }), entry.feature] as const,
    ),
  );
  const shown = elementsOf([root])
    .filter((element) => element.attrs["data-slot"] === noticeSlot)
    .map((element) => {
      const text = textOf(element);

      return featureOf.get(text) ?? `(a notice no feature gives: ${JSON.stringify(text)})`;
    })
    .toSorted();
  const noticed = unsupported
    .filter((entry) => entry.shown === "notice")
    .map((entry) => entry.feature)
    .toSorted();
  const marked = unsupported
    .filter((entry) => entry.shown === "mark")
    .map((entry) => entry.feature)
    .toSorted();
  const nowhere = without(
    unsupported.map((entry) => entry.feature),
    shown,
  ).toSorted();

  return [
    ...(roundTrips(root) ? [] : [`${where}: the HTML does not round-trip`]),
    ...(JSON.stringify(shown) === JSON.stringify(noticed)
      ? []
      : [
          `${where}: the HTML shows notices for ${JSON.stringify(shown)}, the verdict's notice-shown features are ${JSON.stringify(noticed)}`,
        ]),
    ...(JSON.stringify(nowhere) === JSON.stringify(marked)
      ? []
      : [
          `${where}: the features with no notice are ${JSON.stringify(nowhere)}, the verdict's marks are ${JSON.stringify(marked)}`,
        ]),
  ];
};

/**
 * Check one state with `checkTree` at base level 2.
 *
 * @param _rendering The render, unused.
 * @param where The member and state, which every problem names.
 * @param root The state's root element.
 * @returns The violations, as one problem, or none.
 */
const treeProblems = (_rendering: Rendering, where: string, root: Element): readonly string[] => {
  const violations = checkTree(root, { baseLevel: 2 });

  return violations.length === 0
    ? []
    : [`${where}: checkTree at base level 2 finds ${JSON.stringify(violations)}`];
};

describe("the verdict and render sweep over the corpus", () => {
  it.effect(
    "every corpus member gets a verdict on its own location, and no defect escapes open",
    () =>
      Effect.gen(function* everyVerdict() {
        const members = yield* openCorpus;
        const problems = members.flatMap((member) =>
          Exit.match(member.verdict, {
            onFailure: (cause) => [`${member.location}: open failed: ${Cause.pretty(cause)}`],
            onSuccess: (verdict) =>
              verdict.document === member.location
                ? []
                : [`${member.location}: the verdict names ${verdict.document}`],
          }),
        );

        assert.isNotEmpty(members, "the corpus document set is empty");
        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "each refused member carries a refusal with a rule and a location, and each unchecked member a reason",
    () =>
      Effect.gen(function* refusedAndUnchecked() {
        const rules: ReadonlySet<string> = new Set(refusalRules);
        const problems = verdictsOf(yield* openCorpus).flatMap(([member, verdict]) => {
          switch (verdict.verdict) {
            case "refused": {
              if (verdict.refusals.length === 0) {
                return [`${member.location}: refused with no refusal`];
              }

              return verdict.refusals.flatMap((refusal, index) => {
                const where = `${member.location}: refusal ${index}`;

                return [
                  ...(rules.has(refusal.rule) ? [] : [`${where} names no rule: ${refusal.rule}`]),
                  ...(locationKinds.has(refusal.location.kind)
                    ? []
                    : [`${where} (${refusal.rule}) has no location`]),
                  ...(refusal.location.kind === "path" && refusal.location.path === ""
                    ? [`${where} (${refusal.rule}) has an empty path`]
                    : []),
                  ...(refusal.document === member.location
                    ? []
                    : [`${where} (${refusal.rule}) names ${refusal.document}`]),
                ];
              });
            }
            case "unchecked": {
              return verdict.reasons.length === 0
                ? [`${member.location}: unchecked with no reason`]
                : verdict.reasons.flatMap((reason) =>
                    reason.path === ""
                      ? [`${member.location}: the ${reason.reason} reason has an empty path`]
                      : [],
                  );
            }
            case "accepted":
            case "accepted-with-unsupported": {
              return [];
            }
            default: {
              return verdict satisfies never;
            }
          }
        });

        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-7] [I-8] every accepted item renders in three states whose HTML round-trips and shows exactly its notice-shown features as notices (R1)",
    () =>
      Effect.gen(function* everyRender() {
        const members = yield* openCorpus;
        const renderings = renderingsOf(members, yield* configure({}));
        const counted = verdictsOf(members).filter(([, verdict]) =>
          acceptingKinds.has(verdict.verdict),
        );

        assert.lengthOf(renderings, counted.length, "every accepting verdict is rendered");
        assert.deepStrictEqual(statesProblems(renderings, r1Problems), []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-7] [I-8] every accepted item's three states pass checkTree at base level 2",
    () =>
      Effect.gen(function* everyTree() {
        const renderings = renderingsOf(yield* openCorpus, yield* configure({}));

        assert.deepStrictEqual(statesProblems(renderings, treeProblems), []);
      }),
    sweepTimeoutMs,
  );
});
