import { Array } from "effect";
import rosters from "#pantry/db/rosters.json" with { type: "json" };

/**
 * A roster's handles in the one order grizzle accepts: the handles the committed snapshot holds
 * live that `handles` still declares, in their code order, then the handles new since the
 * snapshot, in the order `handles` gives them.
 *
 * Grizzle numbers a roster's handles by history: a kept handle keeps its code, a new one takes the
 * next, and the declared order must be the code order. A handle the snapshot holds that `handles`
 * dropped is left out, which grizzle records as a hole. A renamed handle counts as new here; the
 * rename is declared to grizzle, never inferred.
 *
 * @param committed - The roster's live handles in code order from the snapshot; empty when the
 *   snapshot holds no such roster
 * @param handles - The roster's handles as the grammar computes them
 * @returns The same handles, ordered
 */
export const inCommittedOrder = <H extends string>(
  committed: readonly string[],
  handles: readonly [H, ...H[]],
): readonly [H, ...H[]] => {
  const declared: ReadonlySet<string> = new Set(handles);
  const kept = committed.filter((handle): handle is H => declared.has(handle));
  const keptSet: ReadonlySet<string> = new Set(kept);
  const ordered = [...kept, ...handles.filter((handle) => !keptSet.has(handle))];

  // `handles` is nonempty and every handle of it lands in `ordered`, so the fallback never runs;
  // the guard gives `ordered` its nonempty type without an assertion.
  return Array.isReadonlyArrayNonEmpty(ordered) ? ordered : handles;
};

/**
 * Each roster's live handles in code order, from the snapshot committed in this checkout, by the
 * roster's name. Empty when the checkout has no snapshot, which is a schema with no migration and
 * so no history.
 *
 * They come from `rosters.json`, which `pnpm --filter @qti-pie/pantry run rosters` writes from
 * `migrations/qti/snapshot.json` (`#pantry/db/rosters.ts`), so evaluating this module opens no file
 * and parses no megabytes of snapshot; `rosters.committed.test.ts` fails when the two disagree.
 */
export const committedRosters: ReadonlyMap<string, readonly string[]> = new Map(
  Object.entries(rosters),
);
