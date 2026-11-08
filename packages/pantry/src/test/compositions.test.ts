/**
 * The test support's composition counter (`#pantry/test/compositions.ts`) against a model of it,
 * and the composition channel it reads against `compose`.
 *
 * Oracle: a second implementation, the specification as a count: a list's compositions are the
 * messages on {@link compositions} that are that list, by identity, and a message that is no list
 * counts for nothing. Each case publishes fresh lists, so the counts this file's other cases left
 * read nothing of it, and none is production's list, which this file never composes.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Result } from "effect";
import { compose } from "#pantry/grammar/compose.ts";
import { compositions } from "#pantry/grammar/compositions.ts";
import { compositionsOf } from "#pantry/test/compositions.ts";
import { toyFacets, toyVocabulary } from "#pantry/test/gen/grammar.ts";

/**
 * How long one case may run: publishing a few messages takes microseconds, and composing a toy list
 * under a second, so a minute only bounds a hang under the swarm's load.
 */
const caseHang = Duration.minutes(1);

/**
 * How long the search of `compose`'s announcements may take: its 14 cases compose a toy list 34
 * times, 0.15 to 0.4 s each on 2026-11-06 at a load average of about 60, so two minutes bound a
 * hang. Measured 2026-11-07: 12.8 s at a load average of 75, under V8 coverage, and 3.9 s at 63 to
 * 73 without it.
 */
const composeTimeout = 120_000;

/**
 * The messages a case publishes, by name: the first and second of two lists, a copy of the first
 * (another list, though equal to it), and two messages that are no list, a number and `null`.
 */
const MESSAGES = ["first", "second", "copy", "number", "null"] as const;

/**
 * A message's name.
 */
type Message = (typeof MESSAGES)[number];

/**
 * The situations a search of the counter must reach: a list announced twice, a copy beside its
 * list, and a message that is no list.
 */
type Situation = "repeated" | "copied" | "no list";

/**
 * The situations, in the order a search reports them.
 */
const SITUATIONS = ["repeated", "copied", "no list"] as const satisfies readonly Situation[];

/**
 * A case's three lists: two lists, and a copy of the first, each made for the case alone.
 */
interface Lists {
  readonly copy: readonly string[];
  readonly first: readonly string[];
  readonly second: readonly string[];
}

/**
 * Make a case's lists.
 *
 * @returns Two new lists and a copy of the first.
 */
const listsOf = (): Lists => {
  const first = ["a"];

  return { copy: [...first], first, second: ["b"] };
};

/**
 * A message a case publishes: one of its lists, or a value that is no list.
 */
type Published = readonly string[] | number | null;

/**
 * Build the message each name stands for, over one case's lists.
 *
 * @param lists - The case's lists.
 * @returns Each name's message.
 */
const messagesOf = (lists: Lists): Readonly<Record<Message, Published>> => ({
  copy: lists.copy,
  first: lists.first,
  null: null,
  number: lists.first.length,
  second: lists.second,
});

/**
 * Name the situations a sequence of messages reaches.
 *
 * @param messages - The messages' names, in publishing order.
 * @returns The situations it reaches, in {@link SITUATIONS}' order.
 */
const situationsOf = (messages: readonly Message[]): readonly Situation[] => {
  const lists = messages.filter((message) => message !== "number" && message !== "null");
  const reached = {
    copied: messages.includes("first") && messages.includes("copy"),
    "no list": messages.includes("number") || messages.includes("null"),
    repeated: new Set(lists).size < lists.length,
  } satisfies Record<Situation, boolean>;

  return SITUATIONS.filter((situation) => reached[situation]);
};

/**
 * Publish a sequence of messages on the channel, and check the counter against the model after
 * each: a list's count is how many of the messages so far are that list.
 *
 * @param messages - The messages' names, in publishing order.
 */
const publishAndCount = (messages: readonly Message[]): void => {
  const lists = listsOf();
  const published = messagesOf(lists);
  for (const [at, message] of messages.entries()) {
    compositions.publish(published[message]);

    const sofar = messages.slice(0, at + 1);
    for (const name of ["first", "second", "copy"] as const) {
      assert.strictEqual(
        compositionsOf(lists[name]),
        sofar.filter((sent) => sent === name).length,
        `${name} after ${sofar.join(", ")}`,
      );
    }
  }
};

/**
 * Up to sixteen messages, each drawn under one swarm of the names, so a case may weigh any of them
 * up, or leave any out.
 */
const swarmedMessages: Gen<readonly Message[]> = (source) => {
  const weights = source.draw(swarm(MESSAGES));

  return source.draw(array(swarmChoice(weights, MESSAGES), { max: 16, min: 1 }));
};

/**
 * Two toy lists for `compose`: one that composes, and one that `compose` refuses, since its
 * vocabulary states one admitted triple twice. Each is announced before a generator runs, so a
 * refused composition counts as one.
 */
const toyLists = {
  composes: [
    toyVocabulary({
      admission: [{ child: "e1", parent: "e0", version: "3.0.1" }],
      attributes: [],
      data: ["ws"],
      facets: toyFacets({}),
      kinds: ["e0", "e1"],
    }),
  ],
  refused: [
    toyVocabulary({
      admission: [
        { child: "e1", parent: "e0", version: "3.0.1" },
        { child: "e1", parent: "e0", version: "3.0.1" },
      ],
      attributes: [],
      data: ["ws"],
      facets: toyFacets({}),
      kinds: ["e0", "e1"],
    }),
  ],
} as const;

/**
 * Which toy list a step of the `compose` search composes.
 */
type Toy = keyof typeof toyLists;

describe("the test support's composition counter", () => {
  it.effect(
    "counts each list's announcements by identity, a copy as another list and a message that is no list as none, on every sequence of up to four",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every sequence of 0 to 4 messages over first, second, copy, number and null",
            caseHang,
            coverage: requiredInSpace<Situation>(SITUATIONS),
            generator: array(element(MESSAGES), { max: 4, min: 0 }),
            limit: 781,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "a count of the identical messages" },
            suite: "pantry/test/compositions/exhaustive",
          },
          (messages, c) =>
            Effect.sync(() => {
              for (const situation of situationsOf(messages)) {
                c.note(situation);
              }

              publishAndCount(messages);
            }),
        ),
      ),
  );

  it.effect(
    "counts each list's announcements by identity over sixteen messages under a swarm of the names",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<Situation>(SITUATIONS, { cases: 300, sense: notesOnly }),
            draw: drawn(swarmedMessages),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "a count of the identical messages" },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/test/compositions/swarmed",
          },
          (messages, c) =>
            Effect.sync(() => {
              for (const situation of situationsOf(messages)) {
                c.note(situation);
              }

              publishAndCount(messages);
            }),
        ),
      ),
  );
});

describe("compose's announcements", () => {
  it.effect(
    "announce each call with the list it is given, a refused composition included, on every sequence of up to three calls over two toy lists",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every sequence of 1 to 3 compose calls over a toy list that composes and one compose refuses",
            caseHang,
            coverage: requiredInSpace<"refused" | "repeated">(["refused", "repeated"]),
            generator: array(element(["composes", "refused"] as const), { max: 3, min: 1 }),
            limit: 14,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "one announcement per compose call" },
            suite: "pantry/test/compositions/compose",
          },
          (calls, c) =>
            Effect.sync(() => {
              const before = {
                composes: compositionsOf(toyLists.composes),
                refused: compositionsOf(toyLists.refused),
              };
              for (const [at, toy] of calls.entries()) {
                const result = compose(toyLists[toy]);
                assert.strictEqual(Result.isSuccess(result), toy === "composes", toy);
                for (const counted of ["composes", "refused"] as const satisfies readonly Toy[]) {
                  assert.strictEqual(
                    compositionsOf(toyLists[counted]) - before[counted],
                    calls.slice(0, at + 1).filter((call) => call === counted).length,
                    `${counted} after ${calls.slice(0, at + 1).join(", ")}`,
                  );
                }
              }

              if (calls.includes("refused")) {
                c.note("refused");
              }

              if (new Set(calls).size < calls.length) {
                c.note("repeated");
              }
            }),
        ),
      ),
    composeTimeout,
  );
});
