import type { AnyRelation, Uuid } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { readTree, treesOf } from "#pantry/export/read.ts";
import { Rows } from "#pantry/import/tree.ts";

/**
 * The rows of `relation` an imported package holds, from every tree it has.
 *
 * @param id - The package id `importPackage` answered.
 * @param relation - The relation to read.
 * @returns The rows of the relation.
 */
export const rowsOf = <R extends AnyRelation>(id: Uuid, relation: R) =>
  Effect.gen(function* rowsOfPackage() {
    const trees = yield* treesOf(id);
    const read = yield* Effect.all(trees.map((tree) => readTree(id, tree)));

    return read.flatMap((rows) => Rows.of(rows, relation));
  });
