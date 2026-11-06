/**
 * Opens a port on `127.0.0.1` and answers it through a playground handler, for as long as a
 * scope lasts. Every port the package opens is opened here.
 *
 * Its callers are `scripts/serve.ts`, a person's entry to the dev playground on 5190, and the
 * browser harness (`src/test/browsers.ts`), which listens on a port the system chooses. It adapts
 * each Node request to a Fetch `Request` on the listener's own origin and writes the handler's
 * `Response` back.
 *
 * Node's HTTP server is used directly: the package depends on `effect` alone, and Effect's Node
 * HTTP server lives in `@effect/platform-node`, which it does not depend on.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { Effect, Option, Schema } from "effect";
import type { Scope } from "effect";
import type { Handler } from "#plate/dev/page.ts";

/**
 * The address every listener binds: this machine only.
 */
const host = "127.0.0.1";

/**
 * The largest request body a listener reads, in bytes; a form post of phase 1's items is far
 * smaller.
 */
export const bodyLimit = 1_048_576;

/**
 * A bound listener: the origin its handler's requests carry and the port it holds.
 *
 * `origin` is `http://127.0.0.1:<port>`, with the port the system bound, so a caller that asked
 * for port 0 learns the port here.
 */
export interface Listening {
  readonly origin: string;
  readonly port: number;
}

/**
 * The part of `server.address()` a listener reads: a bound TCP server's address carries its port,
 * while a pipe's name or a closed server's `null` does not.
 */
const TcpAddress = Schema.Struct({ port: Schema.Number });

/**
 * The failure of a listen: the port is taken or not permitted.
 */
export class ListenFailed extends Schema.TaggedError<ListenFailed>()("ListenFailed", {
  detail: Schema.String,
  port: Schema.Number,
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `Cannot listen on ${host}:${String(this.port)}: ${this.detail}. Stop what holds the port, or listen on a free one; port 0 lets the system choose.`;
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
const toRequest = Effect.fn("listen.toRequest")(function* toRequest(
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
 * @param response The handler's response.
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
 * Answer one Node request through the handler; a body that cannot be read answers 413 with its
 * message, and a defect ends the response with a 500, or drops the connection when the headers
 * are already sent, so no request is left open.
 *
 * @param handler The playground's handler.
 * @param incoming The Node request.
 * @param outgoing The Node response.
 * @param origin The listener's origin.
 * @returns An effect that answers the request and never fails.
 */
const answer = Effect.fn("listen.answer")(
  function* answer(
    handler: Handler,
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    origin: string,
  ) {
    const adapted = yield* toRequest(incoming, origin).pipe(
      Effect.catch((error) => Effect.succeed(new Response(error.message, { status: 413 }))),
    );
    const response =
      adapted instanceof Response ? adapted : yield* Effect.promise(() => handler(adapted));

    yield* send(response, outgoing);
  },
  (effect, _handler, _incoming, outgoing) =>
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
 * Bind a server to {@link host} at the port and answer its requests through the handler.
 *
 * The request listener is attached in the `listening` callback, which Node runs before it
 * accepts any connection, so every request carries the bound port's origin.
 *
 * @param handler The playground's handler.
 * @param port The port to bind; 0 lets the system choose.
 * @returns The listening server and what a caller learns of it.
 */
const bind = (handler: Handler, port: number) =>
  Effect.callback<{ readonly listening: Listening; readonly server: Server }, ListenFailed>(
    (resume) => {
      const server = createServer();
      server.once("error", (error) => {
        resume(Effect.fail(new ListenFailed({ detail: error.message, port })));
      });
      server.listen(port, host, () => {
        const address = Schema.decodeUnknownOption(TcpAddress)(server.address());
        if (Option.isNone(address)) {
          server.close();
          resume(Effect.fail(new ListenFailed({ detail: "it bound no TCP port", port })));

          return;
        }

        const bound = address.value.port;
        const origin = `http://${host}:${String(bound)}`;
        server.on("request", (incoming: IncomingMessage, outgoing: ServerResponse) => {
          Effect.runFork(answer(handler, incoming, outgoing, origin));
        });
        resume(Effect.succeed({ listening: { origin, port: bound }, server }));
      });
    },
  );

/**
 * Close a server and every connection it holds, completing once the server has closed.
 *
 * @param bound The server to close.
 * @param bound.server The server.
 * @returns An effect that closes it.
 */
const close = (bound: { readonly server: Server }) =>
  Effect.callback((resume: (closed: Effect.Effect<void>) => void) => {
    bound.server.close(() => {
      resume(Effect.void);
    });
    bound.server.closeAllConnections();
  });

/**
 * Listen on `127.0.0.1` at the port and answer every request through the handler until the
 * scope closes; closing the scope closes the server and every open connection.
 *
 * The adapter fixes each request's origin to the listener's own, never reading it from the
 * `Host` header; a body larger than {@link bodyLimit} answers 413 and never reaches the handler;
 * a defect answers 500, or drops the connection when the headers are already sent.
 *
 * @param options The handler and the port.
 * @param options.handler The handler every request is answered through.
 * @param options.port The port to bind; 0 lets the system choose one.
 * @returns The bound origin and port, or {@link ListenFailed} when the port is taken or not
 *   permitted.
 */
export const listen = Effect.fn("listen")(function* listen(options: {
  readonly handler: Handler;
  readonly port: number;
}): Effect.fn.Return<Listening, ListenFailed, Scope.Scope> {
  const bound = yield* Effect.acquireRelease(bind(options.handler, options.port), close);

  return bound.listening;
});
