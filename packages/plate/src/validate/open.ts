/**
 * `open`, the host's entry from a document's bytes to its verdict: parse, then validate. It is
 * published as `@qti-pie/plate/open`, apart from the serving entry, because it loads the full XSD
 * tables, a committed JSON module of 5 MB, which a host serving admitted content never needs.
 *
 * It reads the bytes with the shared reader's adapter and checks the source against the committed
 * XSD tables. Its verdict is one of the two ways a host reaches an `Accepted`, which `redact` and
 * `score` take; `openAdmitted`'s, for a document a check like this one already admitted, is the
 * other. It stays server-side: the tables are 5 MB, and the reader is crust's.
 *
 * @module
 */
import { Effect, Result } from "effect";
import { readSource } from "#plate/document/read.ts";
import { tables } from "#plate/validate/tables.ts";
import { check } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * Open a document: read its bytes into the source view, then judge it with `check` against the
 * committed tables.
 *
 * It never fails, because a refusal is a verdict. A document the reader cannot build a tree from
 * is `refused`, of kind `none`, with the reader's one refusal (`not-well-formed` or
 * `reader-refused`); any other is `check`'s verdict. Nothing but its two inputs decides the result.
 *
 * @param location The document's location as the host named it, which the verdict and every
 *   refusal carry as `document`.
 * @param bytes The document as read from storage.
 * @returns The verdict on the document.
 */
export const open = Effect.fn("open")(function* open(
  location: string,
  bytes: Uint8Array,
): Effect.fn.Return<Verdict> {
  yield* Effect.annotateCurrentSpan("document.location", location);

  const read = yield* Effect.result(readSource(location, bytes));
  const verdict: Verdict = Result.isFailure(read)
    ? { document: location, kind: "none", refusals: [read.failure], verdict: "refused" }
    : check(read.success, tables);

  yield* Effect.annotateCurrentSpan("document.verdict", verdict.verdict);
  yield* Effect.annotateCurrentSpan("document.kind", verdict.kind);

  return verdict;
});
