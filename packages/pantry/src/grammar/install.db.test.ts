/**
 * The installed grammar, judged by PostgreSQL against the generators' own packing: every closed
 * constant the migration packed from `install.ts`'s rows reads back as the cells `closed.ts`'s
 * layout gives the same rows, and each constant's cost is recorded beside it (C4, C24).
 *
 * A constant is named by the digest of its content, so no catalog name says which relation it packs
 * (`grizzle names` prints `closed constant <digest>`). The test therefore reads every constant of
 * the schema and matches each to the relations whose strings are as long: a relation's key set, one
 * bit a cell, and its string of cells, w bits a cell, whose payload codes it decodes back to the
 * relation's rows. It runs at N1 on the lease, through the author login with `SET ROLE` to the
 * author role, which holds EXECUTE on every constant its tables' statements call (README, "Direct
 * SQL access").
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import type { DbConnection } from "@bjornpagen/grizzle";
import { Effect, Option, Predicate, Redacted, Schema } from "effect";
import { Client } from "pg";
import type { QueryResultRow } from "pg";
import { describe } from "vitest";
import { loginConnection } from "#pantry/db/connection.ts";
import * as install from "#pantry/grammar/install.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The author login's PostgreSQL role, `<schema>__<login>`.
 */
const authorAppRole = "qti__author_app";

/**
 * The author role's PostgreSQL role, which holds EXECUTE on every constant its tables read.
 */
const authorRole = "qti__author";

/**
 * The PostgreSQL schema the installation's constants are in.
 */
const installSchema = "qti";

/**
 * A field's value in an installed relation's rows.
 */
const ValueSchema = Schema.Union([Schema.String, Schema.BigInt]);

/**
 * A field's value in an installed relation's rows.
 */
type Value = typeof ValueSchema.Type;

/**
 * An installed relation's row.
 */
const RowSchema = Schema.Record(Schema.String, ValueSchema);

/**
 * An installed relation's row.
 */
type Row = typeof RowSchema.Type;

/**
 * An installed closed relation as its packing reads it: each field's roster, a slot's fin, its key
 * and its rows (`install.ts`).
 */
const InstalledSchema = Schema.Struct({
  fields: Schema.Record(
    Schema.String,
    Schema.Struct({
      roster: Schema.optional(Schema.Struct({ handles: Schema.Array(Schema.String) })),
      slots: Schema.optional(
        Schema.Struct({
          count: Schema.String,
          owner: Schema.Struct({ key: Schema.Array(Schema.String), rows: Schema.Array(RowSchema) }),
        }),
      ),
    }),
  ),
  key: Schema.Array(Schema.String),
  kind: Schema.Literal("closedRelation"),
  name: Schema.String,
  rows: Schema.Array(RowSchema),
});

/**
 * An installed closed relation.
 */
type Installed = typeof InstalledSchema.Type;

/**
 * Every closed relation `install.ts` declares, parsed from its exports.
 */
const installed: readonly Installed[] = Object.values(install).flatMap((value) =>
  Option.toArray(Schema.decodeUnknownOption(InstalledSchema)(value)),
);

/**
 * The relations a §C law reads, whose constants the installation must hold.
 */
const readByLaws: ReadonlySet<string> = new Set([
  "AttributeGrammar",
  "Banned",
  "BarredOf",
  "BindingFit",
  "ChildGrammar",
  "ContentModelOf",
  "CountedOf",
  "Enters",
  "Follow",
  "GoverningOf",
  "Last",
  "MappableBaseType",
  "Needs",
  "OperatorArity",
  "PositionSelf",
  "RecordBindingFit",
  "Required",
  "ResourceTypeOf",
  "RootOfType",
  "SharedModelOf",
  "SlotSelf",
  "Symbol",
  "TextDomain",
  "XsiType",
]);

/**
 * Spell a value as text, a natural marked so no handle spells the same.
 *
 * @param value - A field's value.
 * @returns Its text.
 */
const textOf = (value: Value | undefined): string =>
  Predicate.isBigInt(value) ? `${value}n` : JSON.stringify(value ?? null);

/**
 * A relation's string of cells as `closed.ts` lays it out (fin.md §17, "The index"): its cells, the
 * bits of each, and the cell of each row's key, row-major mixed radix over the key's closed ids,
 * each slot block at its owner's offset after the blocks before it.
 */
interface Layout {
  readonly cells: number;
  readonly cellOf: (row: Row) => number;
  readonly payload: readonly { readonly field: string; readonly radix: number }[];
  readonly width: number;
}

/**
 * Lay out a relation's string of cells from its declaration: the second implementation of the
 * packing the migration's DO block performs.
 *
 * @param relation - The installed relation.
 * @returns Its layout.
 */
const layoutOf = (relation: Installed): Layout => {
  const handles = (field: string) => relation.fields[field]?.roster?.handles ?? [];
  const codeOf = (field: string, value: Value | undefined) =>
    handles(field).indexOf(Predicate.isString(value) ? value : "");
  const payload = Object.keys(relation.fields)
    .filter((field) => !relation.key.includes(field))
    .map((field) => ({
      field,
      radix:
        relation.fields[field]?.roster === undefined
          ? Math.max(1, new Set(relation.rows.map((row) => textOf(row[field]))).size)
          : handles(field).length,
    }));
  let points = 1;
  for (const { radix } of payload) {
    points *= radix;
  }

  const width = points.toString(2).length;
  const fin = relation.key
    .map((field) => relation.fields[field]?.slots)
    .find((slots) => slots !== undefined);
  if (fin === undefined) {
    let cells = 1;
    for (const field of relation.key) {
      cells *= handles(field).length;
    }

    return {
      cellOf: (row) => {
        let index = 0;
        for (const field of relation.key) {
          index = index * handles(field).length + codeOf(field, row[field]);
        }

        return index;
      },
      cells,
      payload,
      width,
    };
  }

  const prefix = relation.key.slice(0, fin.owner.key.length);
  const block = relation.key.slice(fin.owner.key.length);
  const counts = new Map(
    fin.owner.rows.map((row) => [
      fin.owner.key.map((field) => textOf(row[field])).join(" "),
      Number(row[fin.count]),
    ]),
  );
  const radicesOf = (owner: readonly string[]) => {
    const count = counts.get(owner.map((handle) => textOf(handle)).join(" ")) ?? 0;

    return block.map((field) =>
      relation.fields[field]?.slots === undefined ? handles(field).length : count,
    );
  };
  let owners: readonly (readonly string[])[] = [[]];
  for (const field of prefix) {
    owners = owners.flatMap((owner) => handles(field).map((handle) => [...owner, handle]));
  }

  const bases = new Map<string, number>();
  let cells = 0;
  for (const owner of owners) {
    bases.set(owner.join(" "), cells);
    let size = 1;
    for (const radix of radicesOf(owner)) {
      size *= radix;
    }

    cells += size;
  }

  return {
    cellOf: (row) => {
      const owner = prefix.map((field) => String(row[field]));
      const radices = radicesOf(owner);
      let index = 0;
      for (const [at, field] of block.entries()) {
        index = index * (radices[at] ?? 0) + codeOf(field, row[field]);
      }

      return (bases.get(owner.join(" ")) ?? 0) + index;
    },
    cells,
    payload,
    width,
  };
};

/**
 * The key set of a relation: one bit a cell, 1 where a row's key is.
 *
 * @param relation - The relation.
 * @param layout - Its layout.
 * @returns The bit string, as PostgreSQL spells a `bit varying`.
 */
const keySetOf = (relation: Installed, layout: Layout): string => {
  const bits = Array.from({ length: layout.cells }, () => "0");
  for (const row of relation.rows) {
    bits[layout.cellOf(row)] = "1";
  }

  return bits.join("");
};

/**
 * Decode an installed string of cells against a relation's rows: every cell is 0 exactly where no
 * row's key is, and every other holds 1 + the row's payload code, mixed radix over the payload in
 * heading order, a closed id's digit its handle's code, and an open-typed field's digits a
 * bijection with its values.
 *
 * @param relation - The relation.
 * @param layout - Its layout.
 * @param bits - The installed string.
 * @returns The disagreements, empty where the string packs the rows.
 */
const disagreementsOf = (relation: Installed, layout: Layout, bits: string): readonly string[] => {
  const found: string[] = [];
  const byCell = new Map(relation.rows.map((row) => [layout.cellOf(row), row] as const));
  const dictionaries = new Map<string, Map<number, string>>();
  for (let cell = 0; cell < layout.cells; cell += 1) {
    const value = Number.parseInt(
      bits.slice(cell * layout.width, (cell + 1) * layout.width) || "0",
      2,
    );
    const row = byCell.get(cell);
    if (row === undefined || value === 0) {
      if ((row === undefined) !== (value === 0)) {
        found.push(
          `${relation.name} cell ${cell}: ${value} where the rows hold ${textOf(row === undefined ? undefined : JSON.stringify(row))}`,
        );
      }
    } else {
      let code = value - 1;
      for (const { field, radix } of layout.payload.toReversed()) {
        const digit = code % radix;
        code = Math.floor(code / radix);
        const handles = relation.fields[field]?.roster?.handles;
        if (handles === undefined) {
          const dictionary = dictionaries.get(field) ?? new Map<number, string>();
          dictionaries.set(field, dictionary);

          const held = dictionary.get(digit);
          if (held !== undefined && held !== textOf(row[field])) {
            found.push(
              `${relation.name} cell ${cell}: ${field} code ${digit} is ${held} and ${textOf(row[field])}`,
            );
          }

          dictionary.set(digit, textOf(row[field]));
        } else if (handles[digit] !== row[field]) {
          found.push(
            `${relation.name} cell ${cell}: ${field} is ${String(handles[digit])}, not ${textOf(row[field])}`,
          );
        }
      }
    }
  }

  return found;
};

/**
 * Read the password a connection authenticates with.
 *
 * @param password - The connection's password.
 * @returns Its text.
 */
const passwordText = (password: DbConnection["password"]) =>
  (Redacted.isRedacted(password) ? Effect.succeed(password) : password).pipe(
    Effect.map(Redacted.value),
  );

/**
 * A session of the author login on the lease over verify-full TLS, in the author role, closed with
 * its scope.
 */
const authorSession = Effect.gen(function* authorSession() {
  const connection = yield* loginConnection(authorAppRole);
  const password = yield* passwordText(connection.password);
  const client = new Client({
    database: connection.database,
    host: connection.transport.host,
    password,
    port: connection.transport.port,
    ssl: { ca: [connection.transport.ca].flat(), servername: connection.transport.servername },
    user: authorAppRole,
  });
  const session = yield* Effect.acquireRelease(
    Effect.tryPromise(() => client.connect()).pipe(Effect.as(client)),
    () => Effect.promise(() => client.end()),
  );
  yield* Effect.tryPromise(() => session.query(`SET ROLE ${authorRole}`));

  return session;
});

/**
 * Run one statement and return its rows.
 *
 * @param client - The session.
 * @param text - The statement.
 * @returns The rows.
 */
const query = <R extends QueryResultRow>(client: Client, text: string) =>
  Effect.tryPromise(() => client.query<R>(text)).pipe(Effect.map(({ rows }) => rows));

/**
 * Read every closed constant of the installation that returns a bit string: its function, as a
 * call names it, and its stored body's size.
 *
 * @param client - The session.
 * @returns The constants.
 */
const constantsOf = (client: Client) =>
  query<{ readonly body: number; readonly fn: string }>(
    client,
    `SELECT p.oid::pg_catalog.regprocedure::text AS fn, pg_catalog.pg_column_size(p.prosqlbody) AS body
       FROM pg_catalog.pg_proc p
       JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = '${installSchema}' AND p.pronargs = 0
        AND p.prorettype = 'pg_catalog.varbit'::pg_catalog.regtype`,
  );

/**
 * Call a constant and read its bits.
 *
 * @param client - The session.
 * @param fn - The constant's function, as `regprocedure` spells it.
 * @returns Its bits and how long the call took.
 */
const bitsOf = (client: Client, fn: string) =>
  Effect.gen(function* callConstant() {
    const started = performance.now();
    const [row] = yield* query<{ readonly bits: string }>(client, `SELECT ${fn}::text AS bits`);

    return { bits: row?.bits ?? "", ms: performance.now() - started };
  });

describe.skipIf(!hasLease)("grammar/install.db.test.ts, on the lease", () => {
  layer(NodeServices.layer, { excludeTestServices: true })(
    "the installed grammar, judged by PostgreSQL",
    (it) => {
      it.effect(
        "packs every relation a law reads as closed.ts lays it out: its key set bit for bit, and its cells decoded to its rows",
        (ctx) =>
          // Oracle: a second implementation of the packing, `layoutOf`'s mixed radix and dependent
          // sum over the declaration's rows, against the bit strings PostgreSQL packed.
          // Bound: every installed relation, every cell of each constant as long as one of its
          // strings.
          Effect.gen(function* packing() {
            const client = yield* authorSession;
            const constants = yield* constantsOf(client);
            const strings = new Map<string, string>();
            for (const { fn } of constants) {
              strings.set(fn, (yield* bitsOf(client, fn)).bits);
            }

            const held = new Set(strings.values());
            const disagreements: string[] = [];
            const missing: string[] = [];
            for (const relation of installed) {
              const layout = layoutOf(relation);
              const keySet = keySetOf(relation, layout);
              const cells = [...strings.values()].filter(
                (bits) => layout.width > 1 && bits.length === layout.cells * layout.width,
              );
              const decoded = cells.map((bits) => disagreementsOf(relation, layout, bits));
              if (cells.length > 0 && decoded.every((found) => found.length > 0)) {
                disagreements.push(...(decoded[0] ?? []).slice(0, 5));
              }

              if (
                readByLaws.has(relation.name) &&
                !held.has(keySet) &&
                !decoded.some((found) => found.length === 0)
              ) {
                missing.push(relation.name);
              }
            }

            yield* Effect.promise(() =>
              ctx.annotate(
                `${constants.length} constants over ${installed.length} relations`,
                "bound",
              ),
            );
            assert.deepStrictEqual(disagreements, []);
            assert.deepStrictEqual(missing, []);
          }),
        leaseTestTimeoutMs,
      );

      it.effect(
        "records each constant's pack time, stored body and first use per backend",
        (ctx) =>
          // Measures, not laws (C4): each key set is packed again by the migration's template, a
          // string_agg over generate_series joined to the rows' cells, and compared with the
          // installed constant, PostgreSQL the judge of the cells; each constant's body is its
          // pg_proc.prosqlbody size; its first use is its first call in a fresh backend.
          // Bound: every installed relation.
          Effect.gen(function* measures() {
            const client = yield* authorSession;
            const constants = yield* constantsOf(client);
            const fresh = yield* authorSession;
            const firstUse = new Map<string, { readonly bits: string; readonly ms: number }>();
            for (const { fn } of constants) {
              firstUse.set(fn, yield* bitsOf(fresh, fn));
            }

            const lines: string[] = [];
            for (const relation of installed) {
              const layout = layoutOf(relation);
              const keySet = keySetOf(relation, layout);
              const values = relation.rows.map((row) => `(${layout.cellOf(row)}, 0)`).join(", ");
              const started = performance.now();
              const [packed] = yield* query<{ readonly cells: string }>(
                client,
                `SELECT COALESCE(pg_catalog.string_agg(COALESCE(1 + r.c, 0)::bit(1)::text, '' ORDER BY g.i), '') AS cells
                   FROM pg_catalog.generate_series(0, ${layout.cells - 1}) AS g(i)
                   ${values === "" ? "" : `LEFT JOIN (VALUES ${values}) AS r(i, c) ON r.i = g.i`}`,
              );
              const packMs = performance.now() - started;
              assert.strictEqual(packed?.cells, keySet, relation.name);

              const constant = constants.find(({ fn }) => firstUse.get(fn)?.bits === keySet);
              const installedAs =
                constant === undefined
                  ? "key set not installed"
                  : `body ${constant.body} B, first use ${(firstUse.get(constant.fn)?.ms ?? 0).toFixed(1)} ms`;
              lines.push(
                `${relation.name}: ${layout.cells} cells × ${layout.width}, pack ${packMs.toFixed(1)} ms, ${installedAs}`,
              );
            }

            yield* Effect.promise(() => ctx.annotate(lines.join("\n"), "measures"));
          }),
        leaseTestTimeoutMs * 4,
      );
    },
  );
});
