/**
 * A probe of the author login served from a file compiled in process with a test's own members
 * beside the login's (grizzle's `compileServed`, the one compile `grizzle generate` runs for a
 * login): a database test reads a program no production path runs through it, and every production
 * path (`importPackage`, the export) runs on the same layer, since the file holds the login's own
 * workloads too.
 *
 * The file is served twice, once as the author login's type, which `AuthorLogin` provides for the
 * production paths, and once as the probe's, whose role's `db.workload` holds the test's members.
 * Both name the login `author_app` and its role `author`, so one layer serves both: the database's
 * installed role is the same.
 */
import type { AnyLogin } from "@bjornpagen/grizzle";
import { compileServed } from "@bjornpagen/grizzle/compile";
import { DbLayer, roleNameOf, served } from "@bjornpagen/grizzle/runtime";
import type { ServedLogin } from "@bjornpagen/grizzle/runtime";
import { Context, Effect, Layer } from "effect";
import snapshot from "#migrations/qti/snapshot.json" with { type: "json" };
import { connectionServices, loginConnection } from "#pantry/db/connection.ts";
import { AuthorLogin } from "#pantry/db/served.ts";
import type { AuthorAppLogin } from "#pantry/qti/logins.ts";

/**
 * The probe layer's session pool: one session, closed a second after its last use. A database test
 * file's calls on its probe run one after another, each in its file's own worker.
 */
const probePool = { idleTimeoutMs: 1000, max: 1, min: 0 } as const;

/**
 * Serve a probe of the author login, from a file compiled in process under the committed snapshot:
 * a login a test builds as the installed one, `login(Qti, "author_app", [role], { workload:
 * [...authorWorkloadsOf(Qti, role), workload(role, members)] })` over an author role of its own,
 * with its members beside the login's.
 *
 * @param probe - The probe login.
 * @returns `ProbeLogin`, the service of the probe's served login, whose `roles.author` opens a
 *   `Db` holding the members; and `layer`, which provides it, `AuthorLogin` and the login's
 *   `DbLayer`, and fails with the compile's `ServedRefusal`, the layer's `OpenError`, or the
 *   connection's settings' errors.
 */
export const servedProbe = <const L extends AnyLogin>(probe: L) => {
  /**
   * The probe's served login, typed with the test's members.
   */
  class ProbeLogin extends Context.Service<ProbeLogin, ServedLogin<L>>()(
    "pantry/test/served-members/ProbeLogin",
  ) {}

  const layer = Layer.unwrap(
    Effect.gen(function* servedProbeLayer() {
      const file = yield* compileServed(probe, snapshot, probe.workload);
      const asAuthor = served<AuthorAppLogin>(file, "author_app");
      const connectionOf = yield* loginConnection;

      return Layer.mergeAll(
        DbLayer.make({ ...connectionOf(roleNameOf(asAuthor)), login: asAuthor, pool: probePool }),
        Layer.succeed(AuthorLogin, asAuthor),
        Layer.succeed(ProbeLogin, served<L>(file, probe.name)),
      );
    }),
  ).pipe(Layer.provide(connectionServices));

  return { ProbeLogin, layer };
};
