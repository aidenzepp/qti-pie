import { Effect } from "effect";

/**
 * Run `use` on the engine module `load` imports, on `ImportLive` (`#pantry/db/layer.ts`), the
 * author application's pool and login and the file system, the one layer an import runs on, and
 * load that module only once the pool's settings resolve.
 *
 * `Effect.provide` builds `ImportLive` before the effect it wraps runs, so the cluster's
 * settings, its CA and the snapshot are read first, and a run that cannot reach the database fails
 * there, with kind `config`, before `load` runs. The importer and the exporter reach the author
 * login (`#pantry/qti/own-login.ts`), whose workload grizzle builds when that module is evaluated,
 * and the layer itself loads the login only after its settings, so a command that cannot reach the
 * database never builds the workload.
 *
 * @param load - Imports the engine module: a dynamic `import()` of it, so the command line's
 *   static graph never reaches it.
 * @param use - The work to run with the loaded module, on the pool.
 * @returns What `use` returns. Fails with what building the pool fails with, and with what `use`
 *   fails with.
 */
export const withAuthorApp = Effect.fn("cli.withAuthorApp")(function* withAuthorApp<M, A, E, R>(
  load: () => Promise<M>,
  use: (engine: M) => Effect.Effect<A, E, R>,
) {
  const { ImportLive } = yield* Effect.promise(() => import("#pantry/db/layer.ts"));

  return yield* Effect.promise(load).pipe(Effect.flatMap(use), Effect.provide(ImportLive));
});
