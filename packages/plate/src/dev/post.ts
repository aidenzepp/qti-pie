/**
 * How the dev playground reads a post of an item's form: the post's entries, and each response
 * decoded through the public `postings`, as any host decodes a post.
 *
 * The item page (`page.ts`) and the session page (`test-page.ts`) both read their posts through
 * this, so a response posts and decodes alike on both, and alike with every other host.
 *
 * Dev playground code outside the core: nothing reachable from `src/index.ts` imports it.
 *
 * @module
 */
import { Effect, Option, Result } from "effect";
import { decode, Malformed, partition } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import type { Value } from "#plate/model/values.ts";
import { postings } from "#plate/payload.ts";
import { redact } from "#plate/render.ts";
import type { Responses } from "#plate/session/session.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * What one post carries for an item: each posted response decoded, the strings posted for each,
 * and the responses whose entries do not decode.
 */
export interface Post {
  readonly decoded: Readonly<Record<string, Malformed | Value>>;
  readonly malformed: ReadonlySet<string>;
  readonly posted: Readonly<Record<string, readonly string[]>>;
}

/**
 * Read a post's body as form entries.
 *
 * @param request The post.
 * @returns The entries in posted order, or none when the body is not a form.
 */
export const entriesOf = Effect.fnUntraced(function* entriesOf(
  request: Request,
): Effect.fn.Return<Option.Option<readonly Entry[]>> {
  const form = yield* Effect.result(
    // oxlint-disable-next-line typescript/no-deprecated -- The deprecation warns against parsing an untrusted server's multipart response; this is a post to the playground's own form, read on 127.0.0.1, and scripts/serve.ts caps its body at 1 MiB before the handler sees it.
    Effect.tryPromise(() => request.formData()),
  );

  return Result.isFailure(form)
    ? Option.none()
    : Option.some(Array.from(form.success, ([name, value]): Entry => [name, value]));
});

/**
 * Read what a post carries for an item: its own entries, partitioned by the item's instance, each
 * response decoded through the item's `postings`, with the strings posted for it.
 *
 * A response no interaction binds has no posting, so the post carries nothing for it:
 * `checkResponses` treats it as NULL and `score` keeps its record value.
 *
 * @param document The accepted item.
 * @param instance The item instance.
 * @param entries The posted entries.
 * @returns The post.
 */
export const postOf = (document: Accepted, instance: string, entries: readonly Entry[]): Post => {
  const { own } = partition(entries, instance);
  const itemPostings = postings(redact(document), instance);
  const decoded = Object.fromEntries(
    itemPostings.map(({ binding, identifier, options }) => [
      identifier,
      Result.merge(decode(own, binding, options)),
    ]),
  );

  return {
    decoded,
    malformed: new Set(
      Object.entries(decoded).flatMap(([response, value]) =>
        value instanceof Malformed ? [response] : [],
      ),
    ),
    posted: Object.fromEntries(
      itemPostings.map(({ binding, identifier }) => [
        identifier,
        own.flatMap(([name, value]) =>
          name !== binding.name || value instanceof Blob ? [] : [value],
        ),
      ]),
    ),
  };
};

/**
 * Give the values a post carries that decode.
 *
 * @param post The post.
 * @returns Each decoded value, by response.
 */
export const valuesOf = (post: Post): Responses =>
  Object.fromEntries(
    Object.entries(post.decoded).flatMap(([response, value]) =>
      value instanceof Malformed ? [] : [[response, value] as const],
    ),
  );
