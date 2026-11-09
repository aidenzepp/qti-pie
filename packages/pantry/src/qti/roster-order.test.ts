import { assert, describe, it } from "@effect/vitest";
import { committedRosters } from "#pantry/db/codes.ts";
import { qtiRelations } from "#pantry/qti/base.ts";

/**
 * Find the first declared handle that grizzle would refuse: one the committed snapshot holds
 * placed after a handle it lacks, or before a handle of lower code.
 *
 * @param committed - The roster's live handles in code order from the snapshot.
 * @param declared - The roster's handles as the schema declares them.
 * @returns The offending pair as text, or `undefined` when the order is accepted.
 */
const firstMisorder = (
  committed: readonly string[],
  declared: readonly string[],
): string | undefined => {
  const codes = new Map(committed.map((handle, code) => [handle, code]));
  let previous: { readonly code: number; readonly handle: string } | undefined;
  let newest: string | undefined;

  for (const handle of declared) {
    const code = codes.get(handle);

    if (code === undefined) {
      newest ??= handle;
    } else if (newest !== undefined) {
      return `"${newest}" is new but is declared before "${handle}", which the snapshot holds`;
    } else if (previous !== undefined && previous.code > code) {
      return `"${previous.handle}" is declared before "${handle}", whose code in the snapshot is lower`;
    } else {
      previous = { code, handle };
    }
  }

  return undefined;
};

describe("the declared rosters", () => {
  it("are in the committed snapshot's code order, handles new since the snapshot last", () => {
    const closedRosters = Object.entries(qtiRelations).flatMap(([name, member]) =>
      member.kind === "closed" ? [{ handles: member.handles, name }] : [],
    );

    assert.isAbove(closedRosters.length, 0);
    assert.deepStrictEqual(
      closedRosters.flatMap(({ handles, name }) => {
        const misorder = firstMisorder(committedRosters.get(name) ?? [], handles);

        return misorder === undefined ? [] : [`${name}: ${misorder}`];
      }),
      [],
    );
  });
});
