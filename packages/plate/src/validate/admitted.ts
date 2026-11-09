/**
 * `openAdmitted`, the host's entry from the bytes of a document its content store has already
 * admitted to its verdict: parse, then judge, with none of the validators.
 *
 * A host that checks content once, when its store admits it, and serves it on every page after,
 * calls `open` at admission and this when it serves. It reads the bytes with the shared reader's
 * adapter, as `open` does, and judges the source with `checkAdmitted`: no structural walk's
 * refusals, no prose rules, and the securing tables in place of the full XSD tables, so a host that
 * serves only through it never loads or runs the full tables. E3 and the URL checks still secure
 * an item, by the same tables' values, so an `Accepted` it gives renders and scores as `open`'s
 * would. Its verdict is the second way a host reaches an `Accepted`, beside `open`'s.
 *
 * @module
 */
import { Effect, Result } from "effect";
import { readSource } from "#plate/document/read.ts";
import { securingTables } from "#plate/validate/securing-tables.ts";
import { checkAdmitted } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * Open a document the host's content store has already admitted: read its bytes into the source
 * view, then judge it with `checkAdmitted` against the securing tables.
 *
 * On a document `open` accepts, it gives the verdict `open` gives. It runs none of `open`'s checks,
 * so it accepts what they would refuse: give it only bytes the store admitted through its own
 * check, never a document from anywhere else. It never fails, because a refusal is a verdict. A
 * document the reader cannot build a tree from is `refused`, of kind `none`, with the reader's one
 * refusal (`not-well-formed` or `reader-refused`). Nothing but its two inputs decides the result.
 *
 * @param location The document's location as the host named it, which the verdict and every
 *   refusal carry as `document`.
 * @param bytes The document as read from the store.
 * @returns The verdict on the document.
 */
export const openAdmitted = Effect.fn("openAdmitted")(function* openAdmitted(
  location: string,
  bytes: Uint8Array,
): Effect.fn.Return<Verdict> {
  yield* Effect.annotateCurrentSpan("document.location", location);

  const read = yield* Effect.result(readSource(location, bytes));
  const verdict: Verdict = Result.isFailure(read)
    ? { document: location, kind: "none", refusals: [read.failure], verdict: "refused" }
    : checkAdmitted(read.success, securingTables);

  yield* Effect.annotateCurrentSpan("document.verdict", verdict.verdict);
  yield* Effect.annotateCurrentSpan("document.kind", verdict.kind);

  return verdict;
});
