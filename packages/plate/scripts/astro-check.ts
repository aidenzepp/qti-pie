/**
 * The Astro host's check: it opens the host through `astroServer`, reads the page and posts
 * BG010's correct answer to it, and confirms port 5192 is free once the server's scope closes.
 *
 * From the repository root:
 *
 * ```sh
 * node packages/plate/scripts/astro-check.ts
 * ```
 *
 * It prints one line per check, `ok` or `not ok`, then how many passed, and exits 1 when one
 * fails or the host cannot be served. The expected fragment and score text come from plate itself:
 * `render` over the same bytes and instance, and the score message in the default locale.
 *
 * The post carries no `Origin` header, as a script's post does not. Astro's origin check refuses a
 * form post whose `Origin` is not matched by `Sec-Fetch-Site: same-origin`; the browser test
 * `src/hosts/astro.browser.test.ts` shows a browser's same-origin post is scored.
 */
import { Console, Effect, Option, Schema } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { acceptedItem, configure, open, postings, redact, render } from "#plate/index.ts";
import { message } from "#plate/messages.ts";
import { textOf } from "#plate/test/accessibility.ts";
import { dial } from "#plate/test/dial.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { astroPort, astroServer } from "#scripts/astro-server.ts";

/**
 * BG010's path under the corpus root, the item the host serves.
 */
const location = "QTI3_BPIG_Examples/items/BG010.xml";

/**
 * The instance token the host renders with.
 */
const instance = "q1";

/**
 * BG010's correct answer, which its `map_response` maps to 1.
 */
const correctAnswer = "York";

/**
 * The failure of the check's own setup: plate could not give what the host is checked against.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
class CheckSetupFailed extends Schema.TaggedError<CheckSetupFailed>()("CheckSetupFailed", {
  detail: Schema.String,
}) {
  /**
   * What plate could not give, and what to change.
   */
  override get message(): string {
    return `The Astro check cannot start: ${this.detail}`;
  }
}

/**
 * The failure of a request to the host that got no response.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
class RequestFailed extends Schema.TaggedError<RequestFailed>()("RequestFailed", {
  detail: Schema.String,
  url: Schema.String,
}) {
  /**
   * The request and why it got no response.
   */
  override get message(): string {
    return `The Astro check's request to ${this.url} got no response: ${this.detail}. Run the check again; if it fails again, start the host with pnpm --filter @qti-pie/plate host:astro and open the page.`;
  }
}

/**
 * What the host is checked against, all from plate: the fragment `render` writes for BG010 with
 * the host's instance, the entry name its Text Entry posts under, and the score text for 1.
 */
const expected = Effect.gen(function* expected() {
  const configuration = yield* configure({});
  const verdict = yield* open(location, yield* readCorpusFile(location));
  const accepted = acceptedItem(verdict);

  if (Option.isNone(accepted)) {
    return yield* new CheckSetupFailed({
      detail: `plate's verdict on ${location} is ${verdict.verdict}, for a document of kind ${verdict.kind}. Set PLATE_CORPUS_DIR to the 1EdTech examples plate accepts BG010 from.`,
    });
  }

  const redacted = redact(accepted.value);
  const rendered = render(redacted, configuration, { instance });
  const [posting, ...others] = postings(redacted, instance);

  if (rendered._tag === "Failure") {
    return yield* new CheckSetupFailed({ detail: rendered.failure.message });
  }

  if (posting === undefined || others.length > 0) {
    return yield* new CheckSetupFailed({
      detail: `BG010 gives ${String(others.length + (posting === undefined ? 0 : 1))} postings, not the one Text Entry the check posts. Check that ${location} is 1EdTech's BG010.`,
    });
  }

  return {
    fragment: rendered.success.html,
    name: posting.binding.name,
    score: message(configuration.locale, "score", { score: "1" }),
  };
});

/**
 * One response from the host, read whole.
 */
interface Page {
  readonly cacheControl: string | null;
  readonly html: string;
  readonly status: number;
}

/**
 * Send a request to the host and read its whole response.
 *
 * @param request The request.
 * @returns The response's status, `Cache-Control` and text; {@link RequestFailed} when no response
 *   came.
 */
const fetchPage = Effect.fnUntraced(function* fetchPage(
  request: Request,
): Effect.fn.Return<Page, RequestFailed> {
  const failed = (cause: unknown) =>
    new RequestFailed({
      detail: cause instanceof Error ? cause.message : String(cause),
      url: request.url,
    });
  const response = yield* Effect.tryPromise({ catch: failed, try: () => fetch(request) });
  const html = yield* Effect.tryPromise({ catch: failed, try: () => response.text() });

  return { cacheControl: response.headers.get("cache-control"), html, status: response.status };
});

/**
 * List the elements of a parsed page in document order, each parent before its children.
 *
 * @param nodes The page's nodes.
 * @returns Every element under them.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node): readonly Element[] =>
    node.kind === "element" ? [node, ...elementsOf(node.children)] : [],
  );

/**
 * The checks run so far, in order.
 */
const results: { readonly name: string; readonly passed: boolean }[] = [];

/**
 * Record one check and print its line.
 *
 * @param name What the check asserts.
 * @param passed Whether it held.
 * @param seen What was seen instead, printed when it did not hold.
 * @returns An effect that prints the line.
 */
const check = (name: string, passed: boolean, seen = ""): Effect.Effect<void> => {
  results.push({ name, passed });

  const number = String(results.length);

  return passed
    ? Console.log(`ok ${number} - ${name}`)
    : Console.log(`not ok ${number} - ${name}${seen === "" ? "" : `; saw ${seen}`}`);
};

/**
 * The checks one page shares: its status, its `Cache-Control` and that it holds no script.
 *
 * @param label Which request the page answered.
 * @param page The page.
 * @returns An effect that runs the three checks.
 */
const pageChecks = (label: string, page: Page): Effect.Effect<void> =>
  Effect.gen(function* checkPage() {
    yield* check(`${label} answers 200`, page.status === 200, String(page.status));
    yield* check(
      `${label} sends Cache-Control: no-store`,
      page.cacheControl === "no-store",
      String(page.cacheControl),
    );
    yield* check(`${label}'s page holds no <script`, !page.html.toLowerCase().includes("<script"));
  });

/**
 * Serve the host, check the page and a post of the correct answer, close the server, and check
 * that its port is free.
 */
const program = Effect.gen(function* astroCheck() {
  const want = yield* expected;

  yield* Effect.scoped(
    Effect.gen(function* served() {
      const { origin } = yield* astroServer;
      const got = yield* fetchPage(new Request(`${origin}/`));
      const forms = elementsOf(parseHtml(got.html)).filter((element) => element.tag === "form");
      const [form] = forms;

      yield* pageChecks("GET /", got);
      yield* check(
        "GET /'s page holds render's BG010 fragment byte for byte",
        got.html.includes(want.fragment),
      );
      yield* check(
        'GET /\'s one form has method="POST" and autocomplete="off"',
        forms.length === 1 &&
          String(form?.attrs["method"]).toLowerCase() === "post" &&
          form?.attrs["autocomplete"] === "off",
        `${String(forms.length)} forms, the first with method ${String(form?.attrs["method"])} and autocomplete ${String(form?.attrs["autocomplete"])}`,
      );

      const posted = yield* fetchPage(
        new Request(`${origin}/`, {
          body: new URLSearchParams([[want.name, correctAnswer]]).toString(),
          headers: { "content-type": "application/x-www-form-urlencoded" },
          method: "POST",
        }),
      );
      const statuses = elementsOf(parseHtml(posted.html)).filter(
        (element) => element.attrs["data-slot"] === rowFor("item", "status").slot,
      );
      const [status] = statuses;
      const shown = status === undefined ? "" : textOf(status);

      yield* pageChecks(`POST / of ${correctAnswer}`, posted);
      yield* check(
        `POST / of ${correctAnswer}'s Status part shows "${want.score}"`,
        statuses.length === 1 && shown.includes(want.score),
        `${String(statuses.length)} Status parts, the first reading "${shown}"`,
      );
    }),
  );

  const free = yield* dial(astroPort);

  yield* check(
    `127.0.0.1:${String(astroPort)} is free once the server's scope closes`,
    free === "refused",
    `a dial ${free}`,
  );

  const failed = results.filter((result) => !result.passed).length;

  yield* Console.log(
    `${String(results.length - failed)} of ${String(results.length)} checks passed.`,
  );

  if (failed > 0) {
    yield* Effect.sync(() => {
      process.exitCode = 1;
    });
  }
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
