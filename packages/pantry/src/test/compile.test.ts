/**
 * Witnesses that every statement of the `Qti` schema and every program of its login compile, with
 * no database and no child process: grizzle's `compileServed` builds the schema the login is over
 * and compiles each of the login's workloads under the committed snapshot, the one compile `grizzle
 * generate` runs for a login, as the database tests' probes do (`#pantry/test/served-members.ts`).
 * A statement or a program grizzle refuses fails here as the `ServedRefusal` naming it, in the free
 * suite, instead of waiting for a regenerate or a leased run.
 *
 * Its bound is the one schema, its one login (`AuthorApp`, the login `grizzle.config.ts` names) and
 * every program of it. Whether the committed served file is the one generate writes is `grizzle
 * check`'s, which the integration checks run (AGENTS.md, Workflow, Integration).
 */
import { compileServed } from "@bjornpagen/grizzle/compile";
import { assert, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import snapshot from "#migrations/qti/snapshot.json" with { type: "json" };
import { AuthorApp } from "#pantry/qti/own-login.ts";

it.effect("every statement and every program of Qti's login compiles", () =>
  Effect.gen(function* compiles() {
    // Oracle: grizzle's own compile of the login, the one `grizzle generate` runs.
    // Bound: the one schema, its login and every program; residual none.
    const exit = yield* Effect.exit(compileServed(AuthorApp, snapshot, AuthorApp.workload));

    assert.isTrue(Exit.isSuccess(exit), Exit.isFailure(exit) ? String(exit.cause) : "");
  }),
);
