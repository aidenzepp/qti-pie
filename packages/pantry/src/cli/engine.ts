import { Effect } from "effect";

/**
 * Run `use` on the engine module `load` imports, inside the author application's pool, and load
 * that module only once the pool's settings resolve.
 *
 * `Effect.provide` builds `AuthorAppLayer` before the effect it wraps runs, so the cluster's
 * settings and its CA are read first, then the author login's committed served workload
 * (`#pantry/db/served.ts` `servedPath`), and a run whose settings, CA or served file cannot be read
 * fails there, with kind `config`, before `load` runs. The importer and the exporter take the
 * served login from that layer (`#pantry/db/served.ts` `ServedAuthorLogin`), which grizzle serves
 * from the file as the login's type, with no schema module evaluated and no workload built, and
 * the importer composes the grammar when its module is evaluated (`#pantry/grammar/install.ts`), so
 * a command whose set-up cannot be read never loads either engine.
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
  const { AuthorAppLayer } = yield* Effect.promise(() => import("#pantry/db/layer.ts"));

  return yield* Effect.promise(load).pipe(Effect.flatMap(use), Effect.provide(AuthorAppLayer));
});
