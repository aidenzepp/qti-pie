/**
 * How the dev playground reads a post of an item's form: the post's entries, one posting per
 * response, and each response decoded through the item's own bindings.
 *
 * The item page (`page.ts`) and the session page (`test-page.ts`) both read their posts through
 * this, so a response posts and decodes alike on both.
 *
 * Dev playground code outside the core: nothing reachable from `src/index.ts` imports it.
 *
 * @module
 */
import { Effect, Option, Result } from "effect";
import { decode, entryName, isPosted, Malformed, partition } from "#plate/form/encoding.ts";
import type { Binding, DecodeOptions, Entry } from "#plate/form/encoding.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import type { Value } from "#plate/model/values.ts";
import type { Responses } from "#plate/session/session.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * How one response travels through the playground's form: its identifier, its binding under the
 * item instance's entry name, and the number base its Controls post in.
 */
export interface Posting {
  readonly binding: Binding;
  readonly options: DecodeOptions;
  readonly response: string;
}

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
 * Collect the postings of an item's interactions in document order, one per response: the
 * response's declared base type and cardinality under the entry name `render` gives its Controls
 * for the instance, and the number base a Text Entry or an Extended Text posts in, 10 for a
 * Choice.
 *
 * A response with no declaration, or of a base type no interaction posts, is left out, so the
 * post carries nothing for it: `checkResponses` treats it as NULL and `score` keeps its value.
 *
 * @param document The accepted item.
 * @param instance The item instance.
 * @returns The postings.
 */
export const postingsOf = (document: Accepted, instance: string): readonly Posting[] => {
  const seen = new Set<string>();

  return interactionsIn(document.item.body).flatMap((interaction): readonly Posting[] => {
    const { response } = interaction;
    const declaration = document.item.responses.get(response);
    if (seen.has(response) || declaration === undefined || !isPosted(declaration.baseType)) {
      return [];
    }

    seen.add(response);

    return [
      {
        binding: {
          baseType: declaration.baseType,
          cardinality: declaration.cardinality,
          name: entryName(instance, response),
        },
        options: { base: interaction.kind === "choice" ? 10 : interaction.base },
        response,
      },
    ];
  });
};

/**
 * Read what a post carries for an item: its own entries, partitioned by the item's instance, each
 * response decoded through the item's bindings, with the strings posted for it.
 *
 * @param document The accepted item.
 * @param instance The item instance.
 * @param entries The posted entries.
 * @returns The post.
 */
export const postOf = (document: Accepted, instance: string, entries: readonly Entry[]): Post => {
  const { own } = partition(entries, instance);
  const postings = postingsOf(document, instance);
  const decoded = Object.fromEntries(
    postings.map(({ binding, options, response }) => [
      response,
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
      postings.map(({ binding, response }) => [
        response,
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
