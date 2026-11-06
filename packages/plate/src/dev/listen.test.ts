import { once } from "node:events";
import { connect } from "node:net";
import type { Socket } from "node:net";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Scope } from "effect";
import { bodyLimit, listen } from "#plate/dev/listen.ts";
import type { Handler } from "#plate/dev/page.ts";
import { dial } from "#plate/test/dial.ts";

/**
 * What a stub handler saw of one request.
 */
interface Seen {
  readonly body: string;
  readonly headers: Headers;
  readonly method: string;
  readonly url: string;
}

/**
 * Construct a stub handler that records every request it is called with and answers each with a
 * fresh response.
 *
 * @param answer Make the response for one request; a plain 200 by default.
 * @returns The handler and the requests it saw, in order.
 */
const recorder = (answer: () => Response = () => new Response("ok")) => {
  const seen: Seen[] = [];
  const handler: Handler = async (request) => {
    seen.push({
      body: await request.text(),
      headers: request.headers,
      method: request.method,
      url: request.url,
    });

    return answer();
  };

  return { handler, seen };
};

/**
 * Send one request with Node's `fetch` and read the whole answer.
 *
 * @param url The URL to request.
 * @param init The request's method, headers and body.
 * @returns The status, the headers and the body text.
 */
const request = (url: string, init: RequestInit = {}) =>
  Effect.promise(async () => {
    const response = await fetch(url, init);

    return { body: await response.text(), headers: response.headers, status: response.status };
  });

/**
 * Write raw HTTP to the port over `node:net` and read until the server closes the connection.
 *
 * Node's `fetch` writes its own `Host` header, so a forged one is written by hand.
 *
 * @param port The listener's port on `127.0.0.1`.
 * @param text The whole request, ending its header block with a blank line.
 * @returns Everything the server wrote back.
 */
const exchange = (port: number, text: string) =>
  Effect.callback<string>((resume) => {
    let received = "";
    const socket = connect(port, "127.0.0.1", () => {
      socket.write(text);
    });
    socket.setEncoding("latin1");
    socket.on("data", (chunk: string) => {
      received += chunk;
    });
    socket.once("error", (error) => {
      resume(Effect.die(error));
    });
    socket.once("close", () => {
      resume(Effect.succeed(received));
    });
  });

/**
 * Open a keep-alive connection and answer one request on it, leaving the connection open.
 *
 * @param port The listener's port on `127.0.0.1`.
 * @returns The socket, the first bytes of its answer, and a promise settled when it closes.
 */
const keepAlive = (port: number) =>
  Effect.callback<{
    readonly closed: Promise<unknown>;
    readonly first: string;
    readonly socket: Socket;
  }>((resume) => {
    const socket = connect(port, "127.0.0.1", () => {
      socket.write("GET / HTTP/1.1\r\nHost: plate.test\r\n\r\n");
    });
    const closed = once(socket, "close");
    socket.setEncoding("latin1");
    socket.once("data", (first: string) => {
      resume(Effect.succeed({ closed, first, socket }));
    });
    socket.once("error", (error) => {
      resume(Effect.die(error));
    });
  });

describe("listen", () => {
  it.effect("binds 127.0.0.1 at a port the system chooses when given port 0", () =>
    Effect.gen(function* systemPort() {
      const { handler } = recorder();
      const listening = yield* listen({ handler, port: 0 });

      assert.isAbove(listening.port, 0);
      assert.strictEqual(listening.origin, `http://127.0.0.1:${String(listening.port)}`);
      assert.strictEqual(yield* dial(listening.port), "accepted");
    }),
  );

  it.effect("passes a GET's path, query and headers through, and its answer back unchanged", () =>
    Effect.gen(function* passThrough() {
      const { handler, seen } = recorder(
        () =>
          new Response("a short answer", {
            headers: { "content-type": "text/plain; charset=utf-8", "x-plate-probe": "answered" },
            status: 418,
          }),
      );
      const listening = yield* listen({ handler, port: 0 });
      const answer = yield* request(`${listening.origin}/a/b%20c?x=1&y=two`, {
        headers: { "x-plate-probe": "asked" },
      });

      assert.strictEqual(seen.length, 1);
      assert.strictEqual(seen[0]?.method, "GET");
      assert.strictEqual(seen[0]?.url, `${listening.origin}/a/b%20c?x=1&y=two`);
      assert.strictEqual(seen[0]?.headers.get("x-plate-probe"), "asked");
      assert.strictEqual(answer.status, 418);
      assert.strictEqual(answer.headers.get("x-plate-probe"), "answered");
      assert.strictEqual(answer.headers.get("content-type"), "text/plain; charset=utf-8");
      assert.strictEqual(answer.body, "a short answer");
    }),
  );

  it.effect("keeps the listener's own origin when the Host header is forged", () =>
    Effect.gen(function* forgedHost() {
      const { handler, seen } = recorder();
      const listening = yield* listen({ handler, port: 0 });
      const answer = yield* exchange(
        listening.port,
        "GET /forged/path?q=1 HTTP/1.1\r\nHost: attacker.example:8080\r\nConnection: close\r\n\r\n",
      );

      assert.isTrue(answer.startsWith("HTTP/1.1 200"));
      assert.strictEqual(seen.length, 1);
      assert.strictEqual(seen[0]?.url, `${listening.origin}/forged/path?q=1`);
      assert.strictEqual(seen[0]?.headers.get("host"), "attacker.example:8080");
    }),
  );

  it.effect("passes a POST body up to the limit through to the handler", () =>
    Effect.gen(function* postBody() {
      const { handler, seen } = recorder();
      const listening = yield* listen({ handler, port: 0 });
      const form = yield* request(`${listening.origin}/post`, {
        body: "answer=A&answer=B",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
      });
      const full = yield* request(`${listening.origin}/post`, {
        body: "a".repeat(bodyLimit),
        method: "POST",
      });

      assert.strictEqual(form.status, 200);
      assert.strictEqual(full.status, 200);
      assert.strictEqual(seen.length, 2);
      assert.strictEqual(seen[0]?.method, "POST");
      assert.strictEqual(seen[0]?.body, "answer=A&answer=B");
      assert.strictEqual(seen[1]?.body.length, bodyLimit);
    }),
  );

  it.effect("answers 413 to a body one byte over the limit and never calls the handler", () =>
    Effect.gen(function* overLimit() {
      const { handler, seen } = recorder();
      const listening = yield* listen({ handler, port: 0 });
      const answer = yield* request(`${listening.origin}/post`, {
        body: "a".repeat(bodyLimit + 1),
        method: "POST",
      });

      assert.strictEqual(answer.status, 413);
      assert.isNotEmpty(answer.body);
      assert.strictEqual(seen.length, 0);
    }),
  );

  it.effect("refuses new connections and closes kept-alive ones when its scope closes", () =>
    Effect.gen(function* scopeCloses() {
      const { handler } = recorder();
      const scope = yield* Scope.fork(yield* Scope.Scope);
      const listening = yield* Scope.provide(scope)(listen({ handler, port: 0 }));
      const kept = yield* keepAlive(listening.port);

      assert.isTrue(kept.first.startsWith("HTTP/1.1 200"));
      assert.isFalse(kept.socket.destroyed);

      yield* Scope.close(scope, Exit.void);
      yield* Effect.promise(() => kept.closed);

      assert.strictEqual(yield* dial(listening.port), "refused");
    }),
  );

  it.effect("fails with ListenFailed carrying the port when the port is held", () =>
    Effect.gen(function* portHeld() {
      const { handler } = recorder();
      const first = yield* listen({ handler, port: 0 });
      const failure = yield* Effect.flip(listen({ handler, port: first.port }));

      assert.strictEqual(failure._tag, "ListenFailed");
      assert.strictEqual(failure.port, first.port);
    }),
  );
});
