/**
 * The author role's privileges on the lease, PostgreSQL's own refusal their oracle: on a stored
 * table of `Qti`, the role may SELECT and INSERT, and an UPDATE or a DELETE through it is refused
 * with SQLSTATE 42501, insufficient_privilege (Bjorn's ruling of 2026-11-10: the author role holds
 * SELECT and INSERT only, no UPDATE and no DELETE).
 *
 * `#pantry/qti/roles.ts` states that ruling as an insert list in place of a write list, and
 * nothing else pins it. `schema.test.ts`'s `Author.write` assertion passes whether the role writes
 * or only inserts, since grizzle stores an insert list under `write` too, so a role that regained
 * UPDATE or DELETE would pass it unnoticed, and so would `schema.db.test.ts`, which reads the
 * installation through the role and never writes. The refusal itself is the one oracle that
 * cannot pass for a role that updates.
 *
 * The probe writes one row of `DataSsml`, a stored relation of one column whose only constraint is
 * a deferred foreign key, in a SERIALIZABLE transaction that is rolled back, so no row remains and
 * the foreign key is never judged. Each statement runs under a savepoint, since a refused one
 * aborts the transaction it is in. A control runs the same four statements as the database owner,
 * which owns the table and holds every privilege on it: UPDATE and DELETE are accepted there and
 * each affects the row, so the 42501 above is the role's and not the statement's.
 */
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import type { Client } from "pg";
import { describe } from "vitest";
import {
  authorRole,
  isServerError,
  loginSession,
  ownerSession,
  qtiSchemaName,
  rowsOf,
} from "#pantry/test/direct-sql.ts";
import { hasLease } from "#pantry/test/settings.ts";

/**
 * The table the probe writes: a stored relation of `Qti` of one column, `node`.
 */
const table = `${qtiSchemaName}.data_ssml`;

/**
 * The row the probe inserts: a node no attribute holds, which the table's deferred foreign key
 * would refuse at COMMIT and the rollback never reaches.
 */
const probeNode = "00000000-0000-4000-8000-00000000a001";

/**
 * What a probe statement's verdict reads when the server ran it.
 */
const accepted = "accepted";

/**
 * What the server did with one statement of the probe: the SQLSTATE of its refusal, or
 * {@link accepted}, and how many rows the statement returned.
 */
interface Verdict {
  readonly code: string;
  readonly rows: number;
}

/**
 * The four statements' verdicts, by the privilege each one exercises.
 */
interface Privileges {
  readonly delete: Verdict;
  readonly insert: Verdict;
  readonly select: Verdict;
  readonly update: Verdict;
}

/**
 * Run one statement of the probe under a savepoint and read the server's verdict: the savepoint is
 * released when the statement runs and rolled back to when the server refuses it, so the
 * transaction goes on to the next statement. The SQLSTATE comes from the server's error, never from
 * its message.
 *
 * @param client - The session, inside the probe's transaction.
 * @param text - The statement, which returns the rows it affects.
 * @param values - Its parameters.
 * @returns The verdict; fails with any failure that is no server error.
 */
const attempt = (client: Client, text: string, values: readonly unknown[]) =>
  Effect.gen(function* attempts() {
    yield* rowsOf(client, "SAVEPOINT probe");

    const verdict = yield* rowsOf(client, text, values).pipe(
      Effect.map((rows): Verdict => ({ code: accepted, rows: rows.length })),
      Effect.catch((error) =>
        isServerError(error.cause)
          ? Effect.succeed<Verdict>({ code: error.cause.code ?? "", rows: 0 })
          : Effect.fail(error),
      ),
    );

    yield* rowsOf(
      client,
      verdict.code === accepted ? "RELEASE SAVEPOINT probe" : "ROLLBACK TO SAVEPOINT probe",
    );

    return verdict;
  });

/**
 * Probe a session's privileges on {@link table}: in one SERIALIZABLE transaction, INSERT a row,
 * SELECT it back, UPDATE it and DELETE it, then roll back.
 *
 * @param client - The session.
 * @param opening - The statements that set the session's role after the transaction begins, none
 *   for a session that is its own role.
 * @returns Each statement's verdict.
 */
const privilegesOf = (client: Client, opening: readonly string[]) =>
  Effect.gen(function* probes() {
    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");
    for (const text of opening) {
      yield* rowsOf(client, text);
    }

    const insert = yield* attempt(
      client,
      `INSERT INTO ${table} (node) VALUES ($1) RETURNING node`,
      [probeNode],
    );
    const select = yield* attempt(client, `SELECT node FROM ${table} WHERE node = $1`, [probeNode]);
    // The table's one column is its key, which `SET node = node` names, so the statement needs
    // UPDATE on it and changes no value.
    const update = yield* attempt(
      client,
      `UPDATE ${table} SET node = node WHERE node = $1 RETURNING node`,
      [probeNode],
    );
    const remove = yield* attempt(client, `DELETE FROM ${table} WHERE node = $1 RETURNING node`, [
      probeNode,
    ]);

    return { delete: remove, insert, select, update } satisfies Privileges;
  }).pipe(Effect.ensuring(rowsOf(client, "ROLLBACK").pipe(Effect.orDie)));

describe.skipIf(!hasLease)("qti/roles.db.test.ts, on the lease", () => {
  it.effect(
    "lets the author role SELECT and INSERT on a stored table and refuses it UPDATE and DELETE with 42501",
    () =>
      // Oracle: PostgreSQL's privilege check, whose refusal is SQLSTATE 42501, read off the
      // server's error; the author role's own row is read back by the role itself.
      // Bound: one stored table, the four statements, one case.
      Effect.gen(function* authorPrivileges() {
        const client = yield* loginSession;
        const verdicts = yield* privilegesOf(client, [`SET LOCAL ROLE ${authorRole}`]);

        assert.deepStrictEqual(verdicts, {
          delete: { code: "42501", rows: 0 },
          insert: { code: accepted, rows: 1 },
          select: { code: accepted, rows: 1 },
          update: { code: "42501", rows: 0 },
        });
      }),
  );

  it.effect(
    "accepts the same four statements from the database owner, each of UPDATE and DELETE affecting the row",
    () =>
      // Oracle: the control. The owner holds every privilege on the table, so the statements that
      // the author role's 42501 refuses are valid and find the row.
      // Bound: one stored table, the four statements, one case.
      Effect.gen(function* ownerPrivileges() {
        const client = yield* ownerSession;
        const verdicts = yield* privilegesOf(client, []);

        assert.deepStrictEqual(verdicts, {
          delete: { code: accepted, rows: 1 },
          insert: { code: accepted, rows: 1 },
          select: { code: accepted, rows: 1 },
          update: { code: accepted, rows: 1 },
        });
      }),
  );
});
