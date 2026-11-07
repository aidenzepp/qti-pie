/**
 * The metadata overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3):
 * each refused state is one the law's model refuses, named by the constraint that states the law.
 *
 * Every case is a direct SQL writer's, as the rules file's rule 8 and grizzle's README ("Direct SQL
 * access") state it: the author login, `SET ROLE` to the author role, at SERIALIZABLE, every
 * deferrable foreign key deferred, the case's rows inserted into `Qti`'s tables with every column a
 * writer fills (each closed id by its code; generated columns PostgreSQL computes), then the one
 * constraint under test set immediate, and a rollback. A role writes a table, never its own view of
 * it: it holds INSERT on each table it writes and only SELECT on its views (README, "Security
 * model"), so a read back goes through the view. The rows are the builder's
 * (`#pantry/import/overlays/metadata.ts`) over the fixture's own documents, so a case restates its
 * setup as a fixture and an edit of it:
 *
 * - **`lom-identifier`** on `metaData`: its record's entry names `qti_v2_item_01` and its item is
 *   `choice`, so `LomObjectIdentifier`'s witness containment into the general entries refuses it
 *   (23503); with the entry edited to `choice`, or to `choice` padded, it holds.
 * - **`lom-title`** on `metaData`: its record's title string is `Metadata Example Item #1` and its
 *   item's title `Unattended Luggage`, so `LomObjectTitle`'s witness containment refuses it; with
 *   the string edited to the item's title, it holds.
 * - **the date** (`attribute-lexical`): each `lastUpdated` of the usage-data fixtures `usage3`,
 *   `usage3-typed`, `usage3-padded` and `usage3-float-padded` is accepted by its row's laws, its
 *   generated `date` the day it names; `usage3-feb-30`'s and `usage3-bad-month`'s are refused by
 *   `day`'s domain, `lexicalForm(date)` (23514).
 * - **Usage typed value** (reading 105): each usage value that writes a `baseType` in `usage3-typed`
 *   and `usage3-float-padded` is accepted by its row's laws; `usage3-integer-float`'s float under
 *   `integer` is refused by the `usage_typed_value` CHECK (23514), and a code its lexical form does
 *   not spell by `e_1_derived`.
 *
 * Whole-package cases, every law at once through the importer, arrive with Q5.15: `metaData`
 * refused `lom-identifier` and `lom-title`, `simple` accepted, `identifier-mismatch` refused
 * `lom-identifier`, `title-mismatch` refused `lom-title`, and the usage-data fixtures accepted but
 * `usage3-feb-30` (refused `attribute-lexical`, by `day`'s domain or AL1's value domain).
 */
import type { Addition, DbConnection } from "@bjornpagen/grizzle";
import { NodeFileSystem, NodeServices } from "@effect/platform-node";
import { assert, it } from "@effect/vitest";
import { Effect, Option, Redacted, Result } from "effect";
import { Client } from "pg";
import type { DatabaseError, QueryResultRow } from "pg";
import { describe, inject } from "vitest";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { loginConnection } from "#pantry/db/connection.ts";
import {
  BaseType,
  grammar,
  NodeKind,
  ResourceType,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { objectRowsOfPackage, rowsOf } from "#pantry/import/overlays/metadata.ts";
import type { MetadataIds, NamedDocument } from "#pantry/import/overlays/metadata.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import type { LomEntry, LomTitleString, UsageValue } from "#pantry/qti/metadata.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The fixtures the global setup materializes: `metaData` among them.
 */
const fixtures = inject("fixtures");

/**
 * The author login's PostgreSQL role, `<schema>__<login>`.
 */
const authorAppRole = "qti__author_app";

/**
 * The author role's PostgreSQL role, which is also the schema of its views.
 */
const authorRole = "qti__author";

/**
 * The PostgreSQL schema of `Qti`'s tables.
 */
const qtiSchema = "qti";

/**
 * The grammar shred reads every document through.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * The password a connection authenticates with, read once.
 *
 * @param password - The connection's password.
 * @returns The password's text.
 */
const passwordText = (password: DbConnection["password"]) =>
  (Redacted.isRedacted(password) ? Effect.succeed(password) : password).pipe(
    Effect.map(Redacted.value),
  );

/**
 * A session of the author login on the lease, over verify-full TLS against the cluster's CA, closed
 * with its scope: a direct SQL writer.
 */
const loginSession = Effect.gen(function* loginSession() {
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

  return yield* Effect.acquireRelease(
    Effect.tryPromise(() => client.connect()).pipe(Effect.as(client)),
    () => Effect.promise(() => client.end()),
  );
}).pipe(Effect.provide(NodeFileSystem.layer));

/**
 * Run one statement on a session and return its rows.
 *
 * @param client - The session.
 * @param text - The statement.
 * @param values - Its parameters.
 * @returns The rows, each as node-postgres decodes it.
 */
const rowsOfQuery = <R extends QueryResultRow>(
  client: Client,
  text: string,
  values: readonly unknown[] = [],
) =>
  Effect.tryPromise(() => client.query<R>(text, [...values])).pipe(Effect.map(({ rows }) => rows));

/**
 * Whether a failure is a server error of node-postgres's, which carries a SQLSTATE and the
 * constraint it names.
 *
 * @param error - The failure's cause.
 * @returns Whether it is one.
 */
const isServerError = (error: unknown): error is DatabaseError =>
  error instanceof Error && "code" in error && "constraint" in error;

/**
 * A row a direct writer inserts into one of `Qti`'s tables: every column it fills by name, a closed
 * id by its code, a natural as its decimal text.
 */
type SqlRow = Readonly<Record<string, string | number>>;

/**
 * One row of a case, with the table it is inserted into.
 */
interface Insert {
  readonly row: SqlRow;
  readonly table: string;
}

/**
 * Read the columns of one of `Qti`'s tables a direct writer fills: every live column PostgreSQL
 * does not generate, a family's hidden ones among them (README, "Direct SQL access": a family's
 * values are a direct writer's to fill).
 *
 * @param client - The session.
 * @param table - The table.
 * @returns The columns' names, none for a table the schema does not hold.
 */
const writtenColumnsOf = (client: Client, table: string) =>
  rowsOfQuery<{ readonly name: string }>(
    client,
    `SELECT a.attname AS name FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = pg_catalog.to_regclass($1) AND a.attnum > 0 AND NOT a.attisdropped
        AND a.attgenerated = ''
      ORDER BY a.attnum`,
    [`${qtiSchema}.${table}`],
  ).pipe(Effect.map((rows) => rows.map(({ name }) => name)));

/**
 * The foreign keys from one of `Qti`'s tables into another, by constraint name, read from the
 * catalogue: the constraints a containment between the two relations installs.
 *
 * @param client - The session, before `SET ROLE`.
 * @param from - The referencing table.
 * @param to - The referenced table.
 * @returns The constraint names.
 */
const foreignKeys = (client: Client, from: string, to: string) =>
  rowsOfQuery<{ readonly conname: string }>(
    client,
    `SELECT con.conname FROM pg_constraint con
       JOIN pg_class src ON src.oid = con.conrelid
       JOIN pg_class dst ON dst.oid = con.confrelid
       JOIN pg_namespace n ON n.oid = src.relnamespace
      WHERE con.contype = 'f' AND n.nspname = $1 AND src.relname = $2 AND dst.relname = $3`,
    [qtiSchema, from, to],
  ).pipe(Effect.map((rows) => rows.map(({ conname }) => conname)));

/**
 * Insert a case's rows into their tables as the author role, every foreign key deferred, then set
 * the given ones immediate, read what the case reads, and roll back. Each row fills exactly its
 * table's written columns, or the case fails before any statement runs.
 *
 * @param client - The session.
 * @param inserts - The rows, in order.
 * @param immediate - The constraints to check at once after the inserts.
 * @param read - A statement to read before the rollback, none to read nothing.
 * @returns The server's error, or none when every statement succeeded, with the read's rows.
 */
const deferredInserts = (
  client: Client,
  inserts: readonly Insert[],
  immediate: readonly string[],
  read: Option.Option<{ readonly text: string; readonly values: readonly unknown[] }>,
) =>
  Effect.gen(function* insertDeferred() {
    for (const { row, table } of inserts) {
      assert.sameMembers(
        Object.keys(row),
        yield* writtenColumnsOf(client, table),
        `${table}: the row fills every column a direct writer fills`,
      );
    }

    yield* rowsOfQuery(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");

    const outcome = yield* Effect.gen(function* statements() {
      yield* rowsOfQuery(client, `SET ROLE ${authorRole}`);
      yield* rowsOfQuery(client, "SET CONSTRAINTS ALL DEFERRED");
      for (const { row, table } of inserts) {
        const columns = Object.keys(row);
        yield* rowsOfQuery(
          client,
          `INSERT INTO ${qtiSchema}.${table} (${columns.join(", ")}) VALUES (${columns
            .map((_, at) => `$${String(at + 1)}`)
            .join(", ")})`,
          Object.values(row),
        );
      }

      for (const name of immediate) {
        yield* rowsOfQuery(client, `SET CONSTRAINTS ${qtiSchema}."${name}" IMMEDIATE`);
      }

      return yield* Option.match(read, {
        onNone: () => Effect.succeed<readonly QueryResultRow[]>([]),
        onSome: ({ text, values }) => rowsOfQuery(client, text, values),
      });
    }).pipe(
      Effect.map((rows) => ({ error: Option.none<DatabaseError>(), rows })),
      Effect.catch((error) =>
        isServerError(error.cause)
          ? Effect.succeed({ error: Option.some(error.cause), rows: [] })
          : Effect.fail(error),
      ),
    );
    yield* rowsOfQuery(client, "ROLLBACK");

    return outcome;
  });

/**
 * The code of a handle in its roster, the value a direct writer stores in its closed-id column.
 *
 * @param handles - The roster's handles.
 * @param handle - The handle.
 * @returns Its code.
 */
const codeOf = (handles: readonly string[], handle: string): number => {
  const code = handles.indexOf(handle);
  assert.isAtLeast(code, 0, `${handle} is a handle of its roster`);

  return code;
};

/**
 * Draw the ids of one document's rows, numbered by its place in the package, the manifest 0.
 *
 * @param document - The document's number.
 * @returns The ids.
 */
const idsFor = (document: number): MetadataIds => ({
  idOf: (index) =>
    `00000000-0000-4000-8${document.toString(16).padStart(3, "0")}-${index.toString(16).padStart(12, "0")}`,
  package: "00000000-0000-4000-8000-00000000c0de",
});

/**
 * Read the schema version a manifest declares.
 *
 * @param manifest - The manifest crust read.
 * @returns The `schemaversion` text, none when it declares none.
 */
const declaredVersion = (manifest: XmlDocument): Option.Option<string> =>
  Option.fromNullishOr(
    manifest.root.children
      .flatMap((child) => (child.kind === "element" && child.local === "metadata" ? [child] : []))
      .flatMap(({ children }) =>
        children.flatMap((child) =>
          child.kind === "element" && child.local === "schemaversion" ? [child] : [],
        ),
      )
      .map(({ children }) =>
        children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
      )
      .at(0),
  );

/**
 * Build a package's metadata rows as the importer will: each document's rows, and the records'
 * object rows over the documents' assessment objects.
 *
 * @param files - The package's entries.
 * @returns The manifest's rows, every document's statistic dates and typed usage values, and the
 *   object rows.
 */
const builtOf = Effect.fn("test.metadata.db.builtOf")(function* builtOf(
  files: readonly PackageFile[],
) {
  const manifestFile = files.find(({ kind }) => kind === "manifest");
  assert.isDefined(manifestFile);

  const manifestXml = yield* Effect.orDie(readXml(manifestFile.bytes));
  const version = Result.getOrThrow(
    versionOf(grammar.kinds.versions.handles, declaredVersion(manifestXml)),
  );
  const manifest = yield* Effect.orDie(shred(manifestXml, version, shredGrammar));
  const documents = new Map<string, NamedDocument>();
  const dates = [];
  const values = [];
  for (const [at, file] of files
    .filter(({ kind, path }) => kind === "file" && path.endsWith(".xml"))
    .entries()) {
    const tree = yield* readXml(file.bytes).pipe(
      Effect.flatMap((xml) => shred(xml, version, shredGrammar)),
      Effect.option,
    );
    if (Option.isSome(tree)) {
      const ids = idsFor(at + 1);
      const rows = rowsOf(tree.value, ids);
      documents.set(file.path, {
        document: ids.idOf(0),
        object: rows.AssessmentObject.values().next().value,
      });
      dates.push(...rows.StatisticDate.values());
      values.push(...rows.UsageValue.values());
    }
  }

  return {
    dates,
    manifest: rowsOf(manifest, idsFor(0)),
    objects: objectRowsOfPackage(manifest, idsFor(0), documents),
    values,
  };
});

/**
 * Write a `LomEntry` row as its table names its columns.
 *
 * @param row - The row.
 * @returns The table's row.
 */
const entryRow = (row: Addition<typeof LomEntry>) =>
  ({
    document: row.document,
    holder: row.holder,
    holder_kind: codeOf(NodeKind.handles, row.holderKind),
    holder_parent: row.holderParent,
    holder_start: String(row.holderStart),
    identifier_kind: codeOf(NodeKind.handles, row.identifierKind),
    identifier_start: String(row.identifierStart),
    kind: codeOf(NodeKind.handles, row.kind),
    lead: row.lead,
    named: codeOf(ResourceType.handles, row.named),
    nearest: row.nearest,
    node: row.node,
    parent: row.parent,
    start: String(row.start),
    text: row.text,
    token: row.token,
    trail: row.trail,
    version: codeOf(SchemaVersion.handles, row.version),
  }) satisfies SqlRow;

/**
 * Write a `LomTitleString` row as its table names its columns.
 *
 * @param row - The row.
 * @returns The table's row.
 */
const titleStringRow = (row: Addition<typeof LomTitleString>) =>
  ({
    document: row.document,
    kind: codeOf(NodeKind.handles, row.kind),
    language: row.language,
    language_tag: row.languageTag,
    nearest: row.nearest,
    node: row.node,
    parent: row.parent,
    record: row.record,
    start: String(row.start),
    text: row.text,
    text_value: row.textValue,
    version: codeOf(SchemaVersion.handles, row.version),
  }) satisfies SqlRow;

/**
 * Replace one passage of a package's manifest, failing when the manifest does not hold it.
 *
 * @param files - The package's entries.
 * @param passage - The passage.
 * @param replacement - What replaces it.
 * @returns The package with its manifest edited.
 */
const editManifest = (
  files: readonly PackageFile[],
  passage: string,
  replacement: string,
): readonly PackageFile[] =>
  files.map((file) => {
    if (file.kind !== "manifest") {
      return file;
    }

    const text = new TextDecoder().decode(file.bytes);
    assert.include(text, passage, "the manifest holds the passage");

    return { ...file, bytes: new TextEncoder().encode(text.replace(passage, replacement)) };
  });

/**
 * The `metaData` manifest's one general entry, which names `qti_v2_item_01`.
 */
const metaDataEntry = "<imsmd:entry>qti_v2_item_01</imsmd:entry>";

/**
 * The `metaData` manifest's general title string, which is not its item's title.
 */
const metaDataTitle = '<imsmd:string language="en">Metadata Example Item #1</imsmd:string>';

/**
 * A `UsageValue` row as a direct writer inserts it into its table, its base type by its code.
 *
 * @param row - The row.
 * @returns The insert.
 */
const usageRow = (row: Addition<typeof UsageValue>) => ({
  row: {
    base_type: codeOf(BaseType.handles, row.baseType),
    base_type_lexical: row.baseTypeLexical,
    node: row.node,
    text: row.text,
  },
  table: "usage_value",
});

describe.skipIf(!hasLease)("qti/metadata.db.test.ts, on the lease", () => {
  it.effect(
    "refuses metaData's record by lom-identifier, and accepts it with its entry naming choice, padded or not",
    () =>
      // Oracle: PostgreSQL, `LomObjectIdentifier`'s witness containment into the general entries,
      // a foreign key into `lom_entry`: 23503 on that key where no general entry of the record
      // has the item's identifier as its token.
      // Bound: the fixture, and its entry edited to `choice` and to `choice` padded.
      Effect.gen(function* lomIdentifier() {
        const client = yield* loginSession;
        const keys = yield* foreignKeys(client, "lom_object_identifier", "lom_entry");
        assert.isNotEmpty(keys, "lom_object_identifier references lom_entry");

        const files = yield* readPackage(fixtures.metaData);

        for (const [label, edited, refused] of [
          ["metaData", files, true],
          [
            "choice",
            editManifest(files, metaDataEntry, "<imsmd:entry>choice</imsmd:entry>"),
            false,
          ],
          [
            "padded choice",
            editManifest(files, metaDataEntry, "<imsmd:entry>\n  choice\t</imsmd:entry>"),
            false,
          ],
        ] as const) {
          const built = yield* builtOf(edited);
          const [named] = built.objects.LomObjectIdentifier.values();
          assert.isDefined(named, `${label}: its record names its item`);

          const outcome = yield* deferredInserts(
            client,
            [
              ...[...built.manifest.LomEntry.values()].map((row) => ({
                row: entryRow(row),
                table: "lom_entry",
              })),
              {
                row: {
                  document: named.document,
                  entry: named.entry,
                  general: named.general,
                  identifier: named.identifier,
                  record: named.record,
                },
                table: "lom_object_identifier",
              },
            ],
            keys,
            Option.none(),
          );

          assert.strictEqual(Option.isSome(outcome.error), refused, label);
          if (refused) {
            assert.strictEqual(Option.getOrUndefined(outcome.error)?.code, "23503", label);
            assert.include(keys, Option.getOrUndefined(outcome.error)?.constraint, label);
          }
        }
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses metaData's record by lom-title, and accepts it with its title string the item's title",
    () =>
      // Oracle: PostgreSQL, `LomObjectTitle`'s witness containment into the title strings, a
      // foreign key into `lom_title_string`: 23503 where no title string of the record has the
      // item's title as its text, in the item's language.
      // Bound: the fixture, and its title string edited to `Unattended Luggage`.
      Effect.gen(function* lomTitle() {
        const client = yield* loginSession;
        const keys = yield* foreignKeys(client, "lom_object_title", "lom_title_string");
        assert.isNotEmpty(keys, "lom_object_title references lom_title_string");

        const files = yield* readPackage(fixtures.metaData);

        for (const [label, edited, refused] of [
          ["metaData", files, true],
          [
            "the item's title",
            editManifest(
              files,
              metaDataTitle,
              '<imsmd:string language="en">Unattended Luggage</imsmd:string>',
            ),
            false,
          ],
        ] as const) {
          const built = yield* builtOf(edited);
          const [named] = built.objects.LomObjectTitle.values();
          assert.isDefined(named, `${label}: its record titles its item`);

          const outcome = yield* deferredInserts(
            client,
            [
              ...[...built.manifest.LomTitleString.values()].map((row) => ({
                row: titleStringRow(row),
                table: "lom_title_string",
              })),
              {
                row: {
                  document: named.document,
                  object_lang: named.objectLang,
                  record: named.record,
                  string: named.string,
                  string_language: named.stringLanguage,
                  title: named.title,
                },
                table: "lom_object_title",
              },
            ],
            keys,
            Option.none(),
          );

          assert.strictEqual(Option.isSome(outcome.error), refused, label);
          if (refused) {
            assert.strictEqual(Option.getOrUndefined(outcome.error)?.code, "23503", label);
            assert.include(keys, Option.getOrUndefined(outcome.error)?.constraint, label);
          }
        }
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
    leaseTestTimeoutMs,
  );

  it.effect(
    "accepts each usage-data fixture's lastUpdated as the day it names, and refuses one that names no day",
    () =>
      // Oracle: PostgreSQL, `StatisticDate`'s own laws: `day`'s domain, `lexicalForm(date)` (23514
      // where the text names no day), the pieces' check, and the generated `date`, read back
      // before the rollback as the day's ISO text.
      // Bound: the four usage-data positives, and the two negatives whose first statistic's
      // `lastUpdated` is edited to no day (`2004-02-30`, `2004-13-04`); every other row of theirs
      // is accepted.
      Effect.gen(function* calendar() {
        const client = yield* loginSession;

        for (const [name, bad] of [
          ["usage3", ""],
          ["usage3-typed", ""],
          ["usage3-padded", ""],
          ["usage3-float-padded", ""],
          ["usage3-feb-30", "2004-02-30"],
          ["usage3-bad-month", "2004-13-04"],
        ] as const satisfies readonly (readonly [FixtureName, string])[]) {
          const built = yield* builtOf(yield* readPackage(yield* materialize(name)));
          assert.isNotEmpty(built.dates, `${name} writes a lastUpdated`);
          assert.strictEqual(
            built.dates.some(({ day }) => day === bad),
            bad !== "",
            `${name} writes its edited lastUpdated`,
          );

          for (const row of built.dates) {
            const refused = row.day === bad;
            const outcome = yield* deferredInserts(
              client,
              [
                {
                  row: {
                    day: row.day,
                    lead: row.lead,
                    lexical: row.lexical,
                    node: row.node,
                    trail: row.trail,
                  },
                  table: "statistic_date",
                },
              ],
              [],
              Option.some({
                text: `SELECT date::text AS date FROM ${authorRole}.statistic_date WHERE node = $1`,
                values: [row.node],
              }),
            );

            assert.strictEqual(Option.isSome(outcome.error), refused, `${name} ${row.lexical}`);
            if (refused) {
              assert.strictEqual(Option.getOrUndefined(outcome.error)?.code, "23514", name);
            } else {
              assert.deepStrictEqual(outcome.rows, [{ date: row.day }], name);
            }
          }
        }
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
    leaseTestTimeoutMs,
  );

  it.effect(
    "accepts each usage value its base type reads, and refuses a float under integer and a code its lexical form does not spell, by Usage typed value and E1 derived",
    () =>
      // Oracle: PostgreSQL, `UsageValue`'s own laws: the `Usage_typed_value` check (reading 105),
      // its text matched against `BaseTypePattern`'s pattern of its base type (23514 on
      // `usage_typed_value`), and `E1_derived`, its code the one `BaseTypeLexical` spells.
      // Bound: the three usage-data fixtures whose values write a `baseType`: `usage3-typed`'s 24
      // (19 floats and 5 identifiers), `usage3-float-padded`'s padded float, accepted, and
      // `usage3-integer-float`'s `0.87` under `integer`, refused; one hand row of code `float`
      // under the lexical form `integer`.
      Effect.gen(function* usageTyped() {
        const client = yield* loginSession;
        for (const [name, count, refused] of [
          ["usage3-typed", 24, false],
          ["usage3-float-padded", 1, false],
          ["usage3-integer-float", 1, true],
        ] as const satisfies readonly (readonly [FixtureName, number, boolean])[]) {
          const built = yield* builtOf(yield* readPackage(yield* materialize(name)));
          assert.lengthOf(built.values, count, `${name} writes a baseType on ${String(count)}`);

          for (const row of built.values) {
            const outcome = yield* deferredInserts(client, [usageRow(row)], [], Option.none());
            const error = Option.getOrUndefined(outcome.error);
            if (refused) {
              assert.strictEqual(error?.code, "23514", `${name}: ${error?.message ?? "accepted"}`);
              assert.strictEqual(error?.constraint, "usage_typed_value", name);
            } else {
              assert.isUndefined(error, `${name} ${row.text}: ${error?.message ?? ""}`);
            }
          }
        }

        const misspelled = yield* deferredInserts(
          client,
          [
            usageRow({
              baseType: "float",
              baseTypeLexical: "integer",
              node: "00000000-0000-4000-8fff-000000000001",
              text: "1",
            }),
          ],
          [],
          Option.none(),
        );
        const error = Option.getOrUndefined(misspelled.error);
        assert.strictEqual(error?.code, "23514", error?.message ?? "accepted");
        assert.strictEqual(error?.constraint, "e_1_derived");
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
    leaseTestTimeoutMs,
  );
});
