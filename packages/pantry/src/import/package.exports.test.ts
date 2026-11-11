/**
 * The import's requirement is satisfiable from pantry's exports alone: an application that builds
 * its own author `DbLayer` with grizzle, over the author login's served file, and provides that
 * served login as `AuthorLogin`, provides everything `importPackage` needs. Every pantry name here
 * is imported by the package's own name, so the resolver holds each to the `exports` map, and the
 * assertion is a type `tsc` checks; the test's run only states it.
 */
import type { DbConnection, PoolBounds } from "@bjornpagen/grizzle/runtime";
import { DbLayer, served } from "@bjornpagen/grizzle/runtime";
import { describe, expectTypeOf, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { AuthorLogin } from "@qti-pie/pantry/db/served.ts";
import { importPackage } from "@qti-pie/pantry/import/package.ts";
import type { importRowsOf } from "@qti-pie/pantry/import/program.ts";
import type { QtiPackage } from "@qti-pie/pantry/import/read.ts";
import type { AuthorAppLogin } from "@qti-pie/pantry/qti/logins.ts";
import type { AuthorRole } from "@qti-pie/pantry/qti/roles.ts";

/**
 * A served file as grizzle's `served` takes it, the JSON value the application loaded.
 */
type ServedFile = Parameters<typeof served>[0];

/**
 * An application's import of a read package: the author login served from its own copy of the
 * served file, its own connection and pool, and pantry's `importPackage` provided with them. It is
 * never called: only its type is read.
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
  const author = Layer.merge(
    DbLayer.make({ ...connection, login, pool }),
    Layer.succeed(AuthorLogin, login),
  );

  return importPackage(pkg).pipe(Effect.provide(author));
};

describe("importPackage, provided by an application from pantry's exports", () => {
  it("needs nothing an application's own DbLayer and the exported AuthorLogin leave unprovided", () => {
    // Oracle: the type checker, over the exported names alone. Bound: importPackage's whole
    // requirement, and the rows step's.
    expectTypeOf<Effect.Services<ReturnType<typeof appImport>>>().toEqualTypeOf<never>();
    expectTypeOf<Effect.Services<ReturnType<typeof importRowsOf>>>().toEqualTypeOf<never>();
    expectTypeOf<Effect.Services<ReturnType<typeof importPackage>>>().toEqualTypeOf<
      AuthorLogin | DbLayer<AuthorRole>
    >();
  });
});
