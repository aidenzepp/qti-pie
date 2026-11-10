import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { createHandler, playgroundCaches } from "#plate/dev/page.ts";
import type { Handler } from "#plate/dev/page.ts";
import { testField } from "#plate/dev/packages.ts";
import { encodeIntent, intentName } from "#plate/form/intent.ts";
import type { Intent } from "#plate/session/session.ts";

/**
 * The origin every request is made against; the handler never opens it.
 */
const origin = "http://127.0.0.1:5190";

/**
 * The corpus root: the repository's `fixtures/` directory, which holds no `*.zip.d` directory, so
 * the M2 fixture package is the playground's one package.
 */
const fixturesRoot = path.resolve(import.meta.dirname, "..", "..", "fixtures");

/**
 * The M2 fixture's package id and its test's path, which its Start button posts. The test's part
 * P1 (nonlinear, simultaneous) holds items 1 to 3 and part P2 (linear, simultaneous) items 4 and 5;
 * only items 1 to 3 show a solution.
 */
const fixture = { id: "m2", test: "test.xml" } as const;

/**
 * The header the operator's ruling on D4-4 rests on: the opt-out every engine's back/forward cache
 * checks, so a browser keeps no session page to show again.
 */
const noStore = "no-store";

/**
 * The fields of a form post, in order.
 */
type Fields = readonly (readonly [string, string])[];

/**
 * One request of the walk: what the table calls it, its method and path, the fields it posts, and
 * the status it is answered with.
 */
interface Step {
  readonly fields?: Fields;
  readonly method: string;
  readonly route: string;
  readonly status: number;
  readonly target: string;
}

/**
 * One response as the table records it: the route, its status and its `cache-control`.
 */
interface Answered {
  readonly cacheControl: string | null;
  readonly route: string;
  readonly status: number;
}

/**
 * Construct a playground over the fixtures directory, with its own sessions and packages.
 *
 * @returns Its Fetch handler.
 */
const fixturePlayground = (): Handler =>
  createHandler(
    {},
    Layer.merge(
      playgroundCaches,
      ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: fixturesRoot })),
    ),
  );

/**
 * Send one request to the handler, a form post when it carries fields.
 *
 * @param handle The handler.
 * @param step The request.
 * @returns The response.
 */
const send = (handle: Handler, step: Pick<Step, "fields" | "method" | "target">) =>
  Effect.promise(() =>
    handle(
      new Request(
        `${origin}${step.target}`,
        step.fields === undefined
          ? { method: step.method }
          : {
              body: new URLSearchParams(step.fields.map(([name, value]) => [name, value])),
              method: step.method,
            },
      ),
    ),
  );

/**
 * Record a response as the table holds it.
 *
 * @param route What the table calls the request.
 * @param response The handler's response.
 * @returns The row.
 */
const record = (route: string, response: Response): Answered => ({
  cacheControl: response.headers.get("cache-control"),
  route,
  status: response.status,
});

/**
 * Give the form entry a session page's button posts for an intent.
 *
 * @param id The session id, the session's instance.
 * @param intent The intent.
 * @returns The entry.
 */
const pressed = (id: string, intent: Intent): Fields => [[intentName(id), encodeIntent(intent)]];

/**
 * Give every request a test session's pages take after its Start, in order: the walk through both
 * parts to the summary, the closed test's views and the posts it still takes, then each refusal on
 * the session and review routes.
 *
 * @param id The session id the Start's 303 named.
 * @returns The steps.
 */
const walkFrom = (id: string): readonly Step[] => {
  const session = `/sessions/${id}`;
  const confirm = `${session}/confirm`;

  return [
    { method: "GET", route: "the session page, item 1", status: 200, target: session },
    {
      fields: [],
      method: "POST",
      route: "a session post with no intent",
      status: 400,
      target: session,
    },
    {
      fields: pressed(id, { kind: "next" }),
      method: "POST",
      route: "the session form's Next",
      status: 303,
      target: session,
    },
    {
      fields: pressed(id, { kind: "submit-part" }),
      method: "POST",
      route: "P1's Submit part, to its confirm page",
      status: 303,
      target: session,
    },
    { method: "GET", route: "P1's confirm page", status: 200, target: confirm },
    {
      fields: pressed(id, { kind: "submit-part" }),
      method: "POST",
      route: "P1's Confirm, which submits the part",
      status: 303,
      target: confirm,
    },
    {
      method: "GET",
      route: "the session page, item 4, Part submitted",
      status: 200,
      target: `${session}?notice=part-submitted`,
    },
    {
      fields: pressed(id, { kind: "next" }),
      method: "POST",
      route: "the session form's Next in P2",
      status: 303,
      target: session,
    },
    {
      fields: pressed(id, { kind: "submit-part" }),
      method: "POST",
      route: "P2's Submit part, to its confirm page",
      status: 303,
      target: session,
    },
    { method: "GET", route: "P2's confirm page", status: 200, target: confirm },
    {
      fields: pressed(id, { kind: "submit-part" }),
      method: "POST",
      route: "P2's Confirm, which finishes the test",
      status: 303,
      target: confirm,
    },
    { method: "GET", route: "the summary", status: 200, target: session },
    { method: "GET", route: "item 1's review", status: 200, target: `${session}/review/1` },
    { method: "GET", route: "item 1's solution", status: 200, target: `${session}/solution/1` },
    { method: "GET", route: "the results document", status: 200, target: `${session}/results.xml` },
    {
      fields: pressed(id, { kind: "next" }),
      method: "POST",
      route: "a session post after the test closed",
      status: 303,
      target: session,
    },
    {
      method: "GET",
      route: "the confirm page after the test closed",
      status: 303,
      target: confirm,
    },
    {
      method: "GET",
      route: "an unknown session's page",
      status: 404,
      target: "/sessions/s-unknown",
    },
    {
      method: "GET",
      route: "an unknown session's confirm page",
      status: 404,
      target: "/sessions/s-unknown/confirm",
    },
    {
      fields: [[testField, fixture.test]],
      method: "POST",
      route: "a Start of an unknown package",
      status: 404,
      target: "/packages/no-such-package/tests",
    },
    {
      fields: [[testField, "no-such-test.xml"]],
      method: "POST",
      route: "a Start of a test the package lacks",
      status: 404,
      target: `/packages/${fixture.id}/tests`,
    },
    {
      fields: [],
      method: "POST",
      route: "a Start that names no test",
      status: 400,
      target: `/packages/${fixture.id}/tests`,
    },
    {
      method: "GET",
      route: "an item's review the session lacks",
      status: 404,
      target: `${session}/review/6`,
    },
    {
      method: "GET",
      route: "an item's solution its control does not show",
      status: 404,
      target: `${session}/solution/4`,
    },
    {
      method: "GET",
      route: "an unknown session's results document",
      status: 404,
      target: "/sessions/s-unknown/results.xml",
    },
    { method: "GET", route: "a Start's GET", status: 405, target: `/packages/${fixture.id}/tests` },
    { method: "PUT", route: "a session page's PUT", status: 405, target: session },
    { method: "PUT", route: "a confirm page's PUT", status: 405, target: confirm },
    { method: "POST", route: "a review's POST", status: 405, target: `${session}/review/1` },
    { method: "POST", route: "a solution's POST", status: 405, target: `${session}/solution/1` },
    {
      method: "POST",
      route: "the results document's POST",
      status: 405,
      target: `${session}/results.xml`,
    },
  ];
};

describe("dev/page.ts: the test session's response headers", () => {
  it.effect(
    "pins the no-store ruling on D4-4: every response a test session's routes give, its refusals included, says Cache-Control: no-store",
    () =>
      Effect.gen(function* noStoreEverywhere() {
        const handle = fixturePlayground();
        const started = yield* send(handle, {
          fields: [[testField, fixture.test]],
          method: "POST",
          target: `/packages/${fixture.id}/tests`,
        });
        const location = started.headers.get("location") ?? "";
        assert.match(location, /^\/sessions\/s-[\da-f-]{36}$/u);

        const steps = walkFrom(location.slice("/sessions/".length));
        const answered: Answered[] = [record("a Start", started)];
        for (const step of steps) {
          answered.push(record(step.route, yield* send(handle, step)));
        }

        assert.deepStrictEqual(answered, [
          { cacheControl: noStore, route: "a Start", status: 303 },
          ...steps.map(({ route, status }) => ({ cacheControl: noStore, route, status })),
        ]);
      }),
  );
});
