/**
 * A package applied through the author login as the database tests apply one: its import program
 * read, one edit of its inputs, and the login's `importWrite` member applied to its facts; and the
 * laws a refusal is matched against. A test judges its own package by the id its program minted
 * ({@link packageStored}), never by a count of every stored package, so it holds beside another
 * file's imports.
 */
import { Db } from "@bjornpagen/grizzle";
import type { ApplyOutcome, Law, Uuid } from "@bjornpagen/grizzle";
import { Duration, Effect, Option } from "effect";
import { AuthorLogin } from "#pantry/db/served.ts";
import { readProgram } from "#pantry/import/program.ts";
import { packageFactsOf } from "#pantry/import/write.ts";
import type { PackageInputs } from "#pantry/import/write.ts";

/**
 * Build a package's ChangeSet with one edit of its inputs and apply it, logging the apply's time.
 *
 * @param dir - The package.
 * @param edit - The edit of its inputs; none applies the package as read.
 * @returns The apply's outcome, and the id the package's program minted for it.
 */
export const applyEdited = (
  dir: string,
  edit: (inputs: PackageInputs) => PackageInputs = (held) => held,
) =>
  Effect.gen(function* appliesEdited() {
    const program = yield* readProgram(dir);
    const db = yield* Db.open((yield* AuthorLogin).roles.author, {});
    const [applied, outcome] = yield* Effect.timed(
      db.workload.importWrite.apply({ insert: packageFactsOf(edit(program.inputs)) }, {}),
    );

    yield* Effect.log("import apply", { applyMillis: Duration.toMillis(applied), dir });

    return { outcome, packageId: program.packageId };
  });

/**
 * Whether a package is stored, read back by its id through the author login's `packageOf`.
 *
 * @param id - The package's id.
 * @returns Whether its row is stored.
 */
export const packageStored = (id: Uuid) =>
  Effect.gen(function* storedById() {
    const db = yield* Db.open((yield* AuthorLogin).roles.author, {});

    return Option.isSome(yield* db.workload.packageOf.get({ id }));
  });

/**
 * Pick a check of one relation by its name.
 *
 * @param relation - The relation.
 * @param name - The check's name.
 * @returns The predicate.
 */
export const checkNamed =
  (relation: string, name: string) =>
  (law: Law): boolean =>
    law.kind === "check" && law.relation === relation && law.name === name;

/**
 * Pick a key by its relation and the fields it reads, in order.
 *
 * @param relation - The relation.
 * @param fields - The key's fields.
 * @returns The predicate.
 */
export const keyOn =
  (relation: string, ...fields: readonly string[]) =>
  (law: Law): boolean =>
    law.kind === "key" &&
    law.side.relation === relation &&
    law.side.terms.map(({ field }) => field).join(" ") === fields.join(" ");

/**
 * Whether an outcome is `invariant-rejected` with a law among its `refused.laws` one of the
 * predicates picks.
 *
 * @param outcome - The apply's outcome.
 * @param picks - The laws the case may be refused under.
 * @returns Whether it is.
 */
export const rejectedBy = (
  outcome: ApplyOutcome<unknown>,
  picks: readonly ((law: Law) => boolean)[],
): boolean =>
  outcome.kind === "invariant-rejected" &&
  outcome.refused.laws.some(({ law }) => picks.some((pick) => pick(law)));
