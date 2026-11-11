/**
 * The import is callable from pantry's exports alone: an application that builds its own author
 * `DbLayer` with grizzle, over its author login's served file, opens its `Db` and passes its
 * workload to `importPackage`, which needs nothing else. The login is either author login pantry
 * exports, `AuthorApp` over `Qti` or `MediaAuthorApp` over `QtiMedia`: both serve the import's
 * members, and grizzle's `MemberHandle` of a program is every login's handle of it. Every pantry
 * name here is imported by the package's own name, so the resolver holds each to the `exports`
 * map, and the assertion is a type `tsc` checks; the test's run only states it.
 */
import type { DbConnection, PoolBounds } from "@bjornpagen/grizzle/runtime";
import { Db, DbLayer, served } from "@bjornpagen/grizzle/runtime";
import { describe, expectTypeOf, it } from "@effect/vitest";
import { Effect } from "effect";
import { importPackage } from "@qti-pie/pantry/import/package.ts";
import type { importRowsOf } from "@qti-pie/pantry/import/program.ts";
import type { QtiPackage } from "@qti-pie/pantry/import/read.ts";
import type { AuthorAppLogin } from "@qti-pie/pantry/qti/logins.ts";
import type { MediaAuthorAppLogin } from "@qti-pie/pantry/qti/media.ts";

/**
 * A served file as grizzle's `served` takes it, the JSON value the application loaded.
 */
type ServedFile = Parameters<typeof served>[0];

/**
 * An application's import of a read package over `Qti`: the author login served from its own copy
 * of the served file, its own connection and pool, and pantry's `importPackage` given the `Db`'s
 * workload. It is never called: only its type is read.
 *
 * @param file - The author login's served file, as the application loads it.
 * @param connection - The application's connection, its password the login's.
 * @param pool - The application's pool bounds.
 * @param pkg - The package, as `readPackage` read it.
 * @returns The import, with every requirement provided.
 */
const appImport = (
  file: ServedFile,
  connection: DbConnection,
  pool: PoolBounds,
  pkg: QtiPackage,
) => {
  const login = served<AuthorAppLogin>(file, "author_app");

  return Effect.gen(function* applicationImport() {
    const db = yield* Db.open(login.roles.author, {});

    return yield* importPackage(db.workload, pkg);
  }).pipe(Effect.provide(DbLayer.make({ ...connection, login, pool })));
};

/**
 * The same import through an author login over the package-media level, `MediaAuthorApp`.
 *
 * @param file - The media author login's served file, as the application loads it.
 * @param connection - The application's connection, its password the login's.
 * @param pool - The application's pool bounds.
 * @param pkg - The package, as `readPackage` read it.
 * @returns The import, with every requirement provided.
 */
const mediaImport = (
  file: ServedFile,
  connection: DbConnection,
  pool: PoolBounds,
  pkg: QtiPackage,
) => {
  const login = served<MediaAuthorAppLogin>(file, "author_app");

  return Effect.gen(function* mediaApplicationImport() {
    const db = yield* Db.open(login.roles.author, {});

    return yield* importPackage(db.workload, pkg);
  }).pipe(Effect.provide(DbLayer.make({ ...connection, login, pool })));
};

describe("importPackage, called by an application from pantry's exports", () => {
  it("needs nothing an application's own DbLayer leaves unprovided, over either author login", () => {
    // Oracle: the type checker, over the exported names alone. Bound: importPackage's whole
    // requirement, the rows step's, and each author login's call.
    expectTypeOf<Effect.Services<ReturnType<typeof appImport>>>().toEqualTypeOf<never>();
    expectTypeOf<Effect.Services<ReturnType<typeof mediaImport>>>().toEqualTypeOf<never>();
    expectTypeOf<Effect.Services<ReturnType<typeof importRowsOf>>>().toEqualTypeOf<never>();
    expectTypeOf<Effect.Services<ReturnType<typeof importPackage>>>().toEqualTypeOf<never>();
  });
});
