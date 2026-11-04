/**
 * Serves the dev playground (`src/dev/page.ts`) on `127.0.0.1`, the only file of the package that
 * opens a port.
 *
 * From the repository root:
 *
 * ```sh
 * pnpm --filter @qti-pie/plate serve
 * ```
 *
 * Then open `http://localhost:5190`. `PLATE_DEV_PORT` picks another port and `PLATE_CORPUS_DIR`
 * another corpus root. It adapts each Node request to a Fetch `Request` for the playground's
 * handler and writes the `Response` back. Ctrl-C, or SIGTERM, closes the server and every open
 * connection, so the process exits.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Config, Console, Effect, Option, Schema } from "effect";
import { handler } from "#plate/dev/page.ts";

/**
 * The address the playground listens on: this machine only.
 */
const host = "127.0.0.1";

/**
 * The port: `PLATE_DEV_PORT`, 5190 when it is not set.
 */
const port = Config.Port("PLATE_DEV_PORT").pipe(Config.withDefault(5190));

/**
 * The largest request body the listener reads, in bytes; a form post of phase 1's items is far
 * smaller.
 */
const bodyLimit = 1_048_576;

/**
 * The failure of a listen: the port is taken or not permitted.
 */
class ListenFailed extends Schema.TaggedError<ListenFailed>()("ListenFailed", {
  detail: Schema.String,
  port: Schema.Number,
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `Cannot listen on ${host}:${String(this.port)}: ${this.detail}. Stop what holds the port, or set PLATE_DEV_PORT to a free one.`;
  }
}

/**
 * The failure of a request whose body could not be read, or is larger than {@link bodyLimit}.
 */
class BodyUnreadable extends Schema.TaggedError<BodyUnreadable>()("BodyUnreadable", {
  detail: Schema.String,
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `Cannot read the request body: ${this.detail}. Post a form smaller than ${String(bodyLimit)} bytes.`;
  }
}

/**
 * Read a request's whole body, refusing one larger than {@link bodyLimit}.
 *
 * @param incoming The Node request.
 * @returns The body's bytes.
 */
const readBody = (
  incoming: IncomingMessage,
): Effect.Effect<Uint8Array<ArrayBuffer>, BodyUnreadable> =>
  Effect.tryPromise({
    catch: (cause) =>
      new BodyUnreadable({ detail: cause instanceof Error ? cause.message : String(cause) }),
    try: async (): Promise<Option.Option<Uint8Array<ArrayBuffer>>> => {
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of incoming) {
        const bytes = chunk instanceof Uint8Array ? chunk : new TextEncoder().encode(String(chunk));
        size += bytes.byteLength;
        if (size > bodyLimit) {
          return Option.none();
        }

        chunks.push(bytes);
      }
      const body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }

      return Option.some(body);
    },
  }).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () =>
          Effect.fail(
            new BodyUnreadable({ detail: `it is larger than ${String(bodyLimit)} bytes` }),
          ),
        onSome: (body) => Effect.succeed(body),
      }),
    ),
  );

/**
 * Adapt a Node request to a Fetch `Request` on the listener's own origin.
 *
 * The origin is fixed rather than read from the `Host` header, which the client writes; the
 * playground reads only the path and the query.
 *
 * @param incoming The Node request.
 * @param origin The listener's origin.
 * @returns The request, or a 400 response for a target that is not a URL.
 */
const toRequest = Effect.fn("serve.toRequest")(function* toRequest(
  incoming: IncomingMessage,
  origin: string,
): Effect.fn.Return<Request | Response, BodyUnreadable> {
  const method = incoming.method ?? "GET";
  const url = URL.parse(incoming.url ?? "/", origin);
  if (url === null) {
    return new Response("The request target is not a URL.", { status: 400 });
  }

  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) {
    for (const each of Array.isArray(value) ? value : [value]) {
      if (each !== undefined) {
        headers.append(name, each);
      }
    }
  }

  const body = method === "GET" || method === "HEAD" ? null : yield* readBody(incoming);

  return new Request(url, { body, headers, method });
});

/**
 * Write a Fetch `Response` to a Node response.
 *
 * @param response The playground's response.
 * @param outgoing The Node response.
 * @returns An effect that ends the Node response with the body.
 */
const send = (response: Response, outgoing: ServerResponse) =>
  Effect.promise(async () => {
    const body = new Uint8Array(await response.arrayBuffer());
    outgoing.statusCode = response.status;
    for (const [name, value] of response.headers) {
      outgoing.setHeader(name, value);
    }
    outgoing.end(body);
  });

/**
 * Answer one Node request through the playground's handler; a body that cannot be read answers
 * 413 with its message, and a defect ends the response with a 500, or drops the connection when
 * the headers are already sent, so no request is left open.
 *
 * @param incoming The Node request.
 * @param outgoing The Node response.
 * @param origin The listener's origin.
 * @returns An effect that answers the request and never fails.
 */
const answer = Effect.fn("serve.answer")(
  function* answer(incoming: IncomingMessage, outgoing: ServerResponse, origin: string) {
    const adapted = yield* toRequest(incoming, origin).pipe(
      Effect.catch((error) => Effect.succeed(new Response(error.message, { status: 413 }))),
    );
    const response =
      adapted instanceof Response ? adapted : yield* Effect.promise(() => handler(adapted));

    yield* send(response, outgoing);
  },
  (effect, _incoming, outgoing) =>
    effect.pipe(
      Effect.catchDefect(() =>
        Effect.sync(() => {
          if (outgoing.headersSent) {
            outgoing.destroy();
          } else {
            outgoing.statusCode = 500;
            outgoing.end("The playground failed to answer this request.");
          }
        }),
      ),
    ),
);

/**
 * Listen on {@link host} at the configured port, answer every request through the playground,
 * and close the server and its connections on SIGINT or SIGTERM.
 */
const program = Effect.gen(function* serve() {
  const listening = yield* port;
  const origin = `http://${host}:${String(listening)}`;
  const server = createServer((incoming, outgoing) => {
    Effect.runFork(answer(incoming, outgoing, origin));
  });

  const bound = yield* Effect.callback<number, ListenFailed>((resume) => {
    server.once("error", (error) => {
      resume(Effect.fail(new ListenFailed({ detail: error.message, port: listening })));
    });
    server.listen(listening, host, () => {
      resume(Effect.succeed(listening));
    });
  });
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      server.close();
      server.closeAllConnections();
    });
  }
  yield* Console.log(
    `The dev playground is at http://localhost:${String(bound)}/ (listening on ${origin} only). Ctrl-C stops it.`,
  );
});

await Effect.runPromise(
  program.pipe(
    Effect.catch((error) =>
      Console.error(error.message).pipe(
        Effect.andThen(
          Effect.sync(() => {
            process.exitCode = 1;
          }),
        ),
      ),
    ),
  ),
);
