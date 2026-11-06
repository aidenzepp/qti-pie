/* oxlint-disable unicorn/text-encoding-identifier-case -- The rows spell the XML encoding labels (`UTF-8`) as crust's reader reports them and `Document` stores them. */
/**
 * The package's laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): each
 * refused state is one the law's model refuses, named by the law it breaks.
 *
 * A row whose own laws are row CHECKs, or a count grizzle draws, is written through the author role
 * (`db.apply`), and the outcome is `invariant-rejected` with the expected law among its `laws`
 * (membership, since a merged native names several, C22). A row that breaks a foreign key, all of
 * which the package's laws defer, is written by a direct SQL writer: the author login, `SET ROLE`
 * to the author role, at SERIALIZABLE, every foreign key deferred and then the one under test set
 * immediate, found by the law its comment names, so PostgreSQL's SQLSTATE and that constraint are
 * the verdict, and the transaction rolls back.
 *
 * The cases over a whole imported package (the `lti` fixture refused under `resource-type`, a
 * document whose root its resource type does not name, an href its resource's files do not list, a
 * document href with no entry, a resource sharing its manifest's identifier, and a package whose
 * entries pass one statement accepted) need the importer's ChangeSet (Q5.15), and are stated in
 * Q5.06's report for the network seat's probe.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { DbConnection, Fact, Law } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option, Redacted } from "effect";
import { Client } from "pg";
import type { DatabaseError, QueryResultRow } from "pg";
import { describe } from "vitest";
import { loginConnection } from "#pantry/db/connection.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import {
  AttributeName,
  NodeKind,
  ResourceType,
  ResourceTypeOf,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import {
  Dependency,
  DocumentDirectory,
  File,
  FileHref,
  manifestPath,
  NamedHref,
  Package,
  Reference,
  ReferencePath,
  Resource,
  ResourceFile,
  ResourceHref,
  XmlBase,
} from "#pantry/qti/package.ts";
import { Author } from "#pantry/qti/roles.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

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
 * A uuid no stored row holds: every stray row below names it as its node, package or resource.
 */
const stray = "00000000-0000-4000-8000-0000000006f0";

/**
 * A second stray uuid, where a row names two.
 */
const strayOther = "00000000-0000-4000-8000-0000000006f1";

/**
 * The base64 of two bytes, a manifest's stand-in content.
 */
const someContent = "AAE=";

/**
 * Whether an outcome is `invariant-rejected` with a law among its `laws` that the predicate picks.
 *
 * @param outcome - The apply's outcome.
 * @param picks - Picks the expected law.
 * @returns Whether it holds one.
 */
const rejectedBy = (
  outcome: { readonly kind: string; readonly laws?: readonly Law[] },
  picks: (law: Law) => boolean,
): boolean => outcome.kind === "invariant-rejected" && (outcome.laws ?? []).some(picks);

/**
 * Pick the check of one relation by its name.
 *
 * @param relation - The relation.
 * @param name - The check's name.
 * @returns The predicate.
 */
const checkNamed =
  (relation: string, name: string) =>
  (law: Law): boolean =>
    law.kind === "check" && law.relation === relation && law.name === name;

/**
 * Pick a containment by the relations of its two sides.
 *
 * @param from - The source's relation.
 * @param to - The target's relation.
 * @returns The predicate.
 */
const containedIn =
  (from: string, to: string) =>
  (law: Law): boolean =>
    law.kind === "contained" && law.from.relation === from && law.to.relation === to;

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
const rowsOf = <R extends QueryResultRow>(
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
 * A row a direct writer inserts into one of the author role's views: its columns as the view names
 * them, a closed id by its code.
 */
type SqlRow = Readonly<Record<string, string | number>>;

/**
 * The foreign keys on one of `Qti`'s tables whose comment, the law grizzle writes on each
 * constraint, starts with the given text: the constraint that law installs.
 *
 * @param client - The session, before `SET ROLE`.
 * @param table - The referencing table.
 * @param comment - The start of the constraint's comment, `foreign key <side> to <side>`.
 * @returns The constraint names.
 */
const foreignKeysOf = (client: Client, table: string, comment: string) =>
  rowsOf<{ readonly conname: string }>(
    client,
    `SELECT con.conname FROM pg_constraint con
       JOIN pg_class src ON src.oid = con.conrelid
       JOIN pg_namespace n ON n.oid = src.relnamespace
      WHERE con.contype = 'f' AND n.nspname = $1 AND src.relname = $2
        AND starts_with(obj_description(con.oid, 'pg_constraint'), $3)`,
    [qtiSchema, table, comment],
  ).pipe(Effect.map((rows) => rows.map(({ conname }) => conname)));

/**
 * Insert rows as the author role, every foreign key deferred, then set the given ones immediate,
 * and roll back: the server's verdict on the rows by those constraints alone, or none when the
 * rows' own laws and those constraints accept them.
 *
 * @param client - The session.
 * @param inserts - The views to insert into, each with its row, in order.
 * @param immediate - The constraints to check at once after the inserts.
 * @returns The server's error, or none when every statement succeeded; fails with any other
 *   failure.
 */
const deferredInsert = (
  client: Client,
  inserts: readonly { readonly row: SqlRow; readonly view: string }[],
  immediate: readonly string[],
) =>
  Effect.gen(function* insertDeferred() {
    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");

    const outcome = yield* Effect.gen(function* statements() {
      yield* rowsOf(client, `SET ROLE ${authorRole}`);
      yield* rowsOf(client, "SET CONSTRAINTS ALL DEFERRED");
      for (const { row, view } of inserts) {
        const columns = Object.keys(row);
        yield* rowsOf(
          client,
          `INSERT INTO ${authorRole}.${view} (${columns.join(", ")}) VALUES (${columns
            .map((_, at) => `$${String(at + 1)}`)
            .join(", ")})`,
          Object.values(row),
        );
      }

      for (const name of immediate) {
        yield* rowsOf(client, `SET CONSTRAINTS ${qtiSchema}."${name}" IMMEDIATE`);
      }
    }).pipe(
      Effect.as(Option.none<DatabaseError>()),
      Effect.catch((error) =>
        isServerError(error.cause) ? Effect.succeed(Option.some(error.cause)) : Effect.fail(error),
      ),
    );
    yield* rowsOf(client, "ROLLBACK");

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
 * A resource row, its node and package stray, every field of it set by `fields`: its own CHECKs
 * are judged as it is inserted, before any of its foreign keys.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const resourceRow = (
  fields: Pick<
    Fact<typeof Resource>,
    "identifier" | "manifestIdentifier" | "type" | "typeLexical" | "version"
  >,
): Fact<typeof Resource> => ({
  document: stray,
  kind: "cp:resource",
  nearest: stray,
  node: stray,
  package: stray,
  parent: stray,
  start: 3n,
  ...fields,
});

/**
 * A document row, its node and package stray: the manifest's when `resourceType` is `none`.
 *
 * @param fields - The fields the case sets.
 * @returns The row as the author role's view names its columns.
 */
const documentSqlRow = (
  fields: Pick<Fact<typeof Document>, "path" | "resourceType" | "rootKind">,
) =>
  ({
    charset: "UTF-8",
    encoding: "",
    export_charset: "UTF-8",
    node: stray,
    package: stray,
    path: fields.path,
    resource_type: codeOf(ResourceType.handles, fields.resourceType),
    root_kind: codeOf(NodeKind.handles, fields.rootKind),
    standalone: 0,
    xml_version: "none",
  }) satisfies SqlRow;

describe.skipIf(!hasLease)("qti/package.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer, { timeout: authorLayerHookTimeoutMs })(
    "the package's laws, judged by PostgreSQL",
    (it) => {
      it.effect("accepts a package whose one entry is its manifest, which no file lists", () =>
        // Oracle: PostgreSQL, the record's laws: the entry family, the key on (package, path), and
        // file-listed over every entry but the manifest.
        // Bound: one package, a fresh id, one entry.
        Effect.gen(function* manifestOnly() {
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const id = crypto.randomUUID();
          const outcome = yield* db.apply(
            ChangeSet.empty(Author).insert(Package, [
              {
                entries: [{ content: someContent, path: manifestPath }],
                id,
                name: "manifest-only",
              },
            ]),
            {},
          );

          assert.strictEqual(outcome.kind, "accepted");
        }),
      );

      it.effect("refuses an entry no file lists, by file-listed", () =>
        // Oracle: PostgreSQL, `contained(select(Entry, path != imsmanifest.xml)(package, path),
        // FileHref(package, href))`: P3 `file-listed`, reading 33.
        // Bound: one package of the manifest and one other entry, no file listing it.
        Effect.gen(function* unlisted() {
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const outcome = yield* db.apply(
            ChangeSet.empty(Author).insert(Package, [
              {
                entries: [
                  { content: someContent, path: manifestPath },
                  { content: someContent, path: "unlisted.txt" },
                ],
                id: crypto.randomUUID(),
                name: "unlisted",
              },
            ]),
            {},
          );

          assert.isTrue(rejectedBy(outcome, containedIn("Entry", "FileHref")), outcome.kind);
        }),
      );

      it.effect(
        "judges a package whose entries pass one statement's array literal in one transaction, by the same law as a small one",
        () =>
          // Oracle: a metamorphic relation over grizzle's transport (fin.md §4.5a): a family past
          // one statement's array literal (536,870,888 UTF-16 code units, V8's longest string, the
          // README's Limits) is cut into consecutive statements of one transaction, so its verdict
          // is the law's, here file-listed over its unlisted entries, as for a small package, and
          // never `InputTooLarge`. The accepted form needs a whole manifest, which the importer's
          // ChangeSet writes (Q5.15).
          // Bound: eight entries of 64 Mi base64 characters each, 24 code units past the literal's
          // bound, sharing one string, so the host holds 64 MiB of content and grizzle's chunks.
          Effect.gen(function* pastOneStatement() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const large = "A".repeat(64 * 1024 * 1024);
            const outcome = yield* db.apply(
              ChangeSet.empty(Author).insert(Package, [
                {
                  entries: [
                    { content: someContent, path: manifestPath },
                    ...Array.from({ length: 8 }, (_, at) => ({
                      content: large,
                      path: `large/${String(at)}.bin`,
                    })),
                  ],
                  id: crypto.randomUUID(),
                  name: "past-one-statement",
                },
              ]),
              {},
            );

            assert.isTrue(rejectedBy(outcome, containedIn("Entry", "FileHref")), outcome.kind);
          }),
        { timeout: 600_000 },
      );

      it.effect("refuses a projection row no member names, by its count above 0", () =>
        // Oracle: PostgreSQL, each projection's count CHECK: a FileHref no file names breaks "File
        // listed", a ResourceFile no file names "Href listed", a NamedHref no resource href names
        // "RootOfType". grizzle draws each count from the members, 0 here.
        // Bound: one row of each projection, each alone.
        Effect.gen(function* emptyProjections() {
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const cases = [
            {
              changes: ChangeSet.empty(Author).insert(FileHref, [
                { href: "a.xml", package: stray },
              ]),
              law: checkNamed("FileHref", "File_listed"),
              name: "FileHref",
            },
            {
              changes: ChangeSet.empty(Author).insert(ResourceFile, [
                { href: "a.xml", resource: stray },
              ]),
              law: checkNamed("ResourceFile", "Href_listed"),
              name: "ResourceFile",
            },
            {
              changes: ChangeSet.empty(Author).insert(NamedHref, [
                { package: stray, path: "a.xml", type: "imsqti_item_xmlv3p0" },
              ]),
              law: checkNamed("NamedHref", "RootOfType"),
              name: "NamedHref",
            },
          ] as const;
          for (const { changes, law, name } of cases) {
            const outcome = yield* db.apply(changes, {});

            assert.isTrue(rejectedBy(outcome, law), `${name}: ${outcome.kind}`);
          }
        }),
      );

      it.effect(
        "refuses a resource's row by its own laws: its type, its code and its manifest's identifier",
        () =>
          // Oracle: PostgreSQL, the resource row's CHECKs, judged as it is inserted: P1 `resource-type`
          // (the `lti` fixture's (3.0.0, imslti_xmlv1p1), which no ResourceTypeOf row holds), C17's
          // "E1 derived" (a code its lexical form does not spell), and P4 "Manifest id space".
          // Bound: one row per law, every other law of the row kept.
          Effect.gen(function* resourceChecks() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const ltiPair = { type: "imslti_xmlv1p1", version: "3.0.0" } as const;

            assert.isFalse(
              ResourceTypeOf.rows.some(
                ({ type, version }) => type === ltiPair.type && version === ltiPair.version,
              ),
            );
            assert.include(SchemaVersion.handles, ltiPair.version);

            const cases = [
              {
                law: containedIn("Resource", "ResourceTypeOf"),
                name: "resource-type",
                row: resourceRow({
                  identifier: "r1",
                  manifestIdentifier: "m",
                  type: ltiPair.type,
                  typeLexical: ltiPair.type,
                  version: ltiPair.version,
                }),
              },
              {
                law: checkNamed("Resource", "E1_derived"),
                name: "E1 derived",
                row: resourceRow({
                  identifier: "r1",
                  manifestIdentifier: "m",
                  type: "imsqti_item_xmlv3p0",
                  typeLexical: "webcontent",
                  version: "3.0.1",
                }),
              },
              {
                law: checkNamed("Resource", "Manifest_id_space"),
                name: "manifest-id-space",
                row: resourceRow({
                  identifier: "m",
                  manifestIdentifier: "m",
                  type: "webcontent",
                  typeLexical: "webcontent",
                  version: "3.0.1",
                }),
              },
            ];
            for (const { law, name, row } of cases) {
              const outcome = yield* db.apply(ChangeSet.empty(Author).insert(Resource, [row]), {});

              assert.isTrue(rejectedBy(outcome, law), `${name}: ${outcome.kind}`);
            }
          }),
      );

      it.effect(
        "refuses a document whose root its resource type does not name, and a document of no resource but the manifest",
        () =>
          // Oracle: PostgreSQL, P2: a typed document's (resource type, root kind) is a row of the
          // set RootOfType (its containment, a CHECK on `Document`), and an untyped one is the
          // manifest, of type `none` at imsmanifest.xml (reading 84, the `RootOfType` CHECK).
          // Bound: an item resource's document with a stimulus root, and a `none` document at
          // another path.
          Effect.gen(function* rootOfType() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const base = {
              assembled: false,
              charset: "UTF-8",
              contextNearest: stray,
              contextNearestKind: "document",
              encoding: "",
              exportCharset: "UTF-8",
              node: stray,
              nodeChildren: 1n,
              nodeDocument: stray,
              nodeGoverns: "none",
              nodeKind: "document",
              nodeParentKind: "document",
              nodeStart: 0n,
              package: stray,
              standalone: "none",
              version: "3.0.0",
              xmlVersion: "none",
            } as const;
            for (const row of [
              {
                ...base,
                path: "item.xml",
                resourceType: "imsqti_item_xmlv3p0",
                rootKind: "qti-assessment-stimulus",
              },
              { ...base, path: "other.xml", resourceType: "none", rootKind: "cp:manifest" },
            ] as const) {
              const outcome = yield* db.apply(ChangeSet.empty(Author).insert(Document, [row]), {});

              assert.isTrue(
                rejectedBy(
                  outcome,
                  row.resourceType === "none"
                    ? checkNamed("Document", "RootOfType")
                    : containedIn("Document", "RootOfType"),
                ),
                row.path,
              );
            }
          }),
      );

      it.effect(
        "refuses an href outside its form, a split that is not the href, and a dependency on its own resource, by each row check",
        () =>
          // Oracle: PostgreSQL, each row CHECK, judged as its row is inserted (its owners in the
          // same step, so no count is missing):
          // - E1_derived: an href that is not `path ‖ params`, a reference that is not
          //   `lead ‖ target ‖ params ‖ trail`, a resolved path that is not `kept ‖ rest`, a
          //   document path that is not `directory ‖ name` (reading 94);
          // - Href_form, the stated limit: a resource href's path and a file's href with a dot
          //   segment or a percent-encoding, a reference target with a dot segment after a plain
          //   one, a srcset of two candidates, a resolved target that climbs above the package
          //   root or has a dot segment after a plain one, and a document holding an xml:base and
          //   a resolved reference (`#pantry/qti/limits.ts` resolvedHref, DotSegments);
          // - Self_dependency: a dependency whose identifierref is its own resource's identifier
          //   (CP 1.2 §6.11.5 B ii).
          // Bound: one row per case.
          Effect.gen(function* rowChecks() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const tuple = {
              document: stray,
              nearest: stray,
              node: stray,
              package: stray,
              start: 4n,
              version: "3.0.1",
            } as const;
            const reference = {
              document: stray,
              kind: "img",
              lead: "",
              lexical: "a.png",
              name: "src",
              node: stray,
              params: "",
              target: "a.png",
              trail: "",
            } as const;
            const directory = {
              directory: "items/",
              name: "a.xml",
              node: stray,
              package: stray,
              path: "items/a.xml",
            } as const;
            const resolved = {
              at: 0n,
              climb: "0",
              directory: "items/",
              document: stray,
              kept: "items/",
              kind: "img",
              name: "src",
              node: strayOther,
              package: stray,
              path: "items/a.png",
              removed: "",
              rest: "a.png",
              target: "a.png",
              ups: "",
            } as const;
            const named = { package: stray, path: "a.xml", type: "webcontent" } as const;
            const resourceHref = { ...named, href: "a.xml", node: stray, params: "" } as const;
            const cases = [
              {
                changes: ChangeSet.empty(Author)
                  .insert(NamedHref, [named])
                  .insert(ResourceHref, [{ ...resourceHref, href: "a.xml?x=1", params: "?x=2" }]),
                law: checkNamed("ResourceHref", "E1_derived"),
                name: "resource href not path ‖ params",
              },
              {
                changes: ChangeSet.empty(Author)
                  .insert(NamedHref, [{ ...named, path: "../a.xml" }])
                  .insert(ResourceHref, [{ ...resourceHref, href: "../a.xml", path: "../a.xml" }]),
                law: checkNamed("ResourceHref", "Href_form"),
                name: "resource href path with a dot segment",
              },
              {
                changes: ChangeSet.empty(Author)
                  .insert(FileHref, [{ href: "a%20b.xml", package: stray }])
                  .insert(ResourceFile, [{ href: "a%20b.xml", resource: stray }])
                  .insert(File, [
                    { ...tuple, href: "a%20b.xml", kind: "cp:file", resource: stray },
                  ]),
                law: checkNamed("File", "Href_form"),
                name: "file href with a percent-encoding",
              },
              {
                changes: ChangeSet.empty(Author).insert(Dependency, [
                  {
                    ...tuple,
                    kind: "cp:dependency",
                    ref: "r1",
                    resource: stray,
                    resourceIdentifier: "r1",
                  },
                ]),
                law: checkNamed("Dependency", "Self_dependency"),
                name: "dependency on its own resource",
              },
              {
                changes: ChangeSet.empty(Author).insert(Reference, [
                  { ...reference, lead: "", lexical: " a.png" },
                ]),
                law: checkNamed("Reference", "E1_derived"),
                name: "reference not lead ‖ target ‖ params ‖ trail",
              },
              {
                changes: ChangeSet.empty(Author).insert(Reference, [
                  { ...reference, lexical: "a/../b.png", target: "a/../b.png" },
                ]),
                law: checkNamed("Reference", "Href_form"),
                name: "reference target with a dot segment after a plain one",
              },
              {
                changes: ChangeSet.empty(Author).insert(Reference, [
                  { ...reference, lexical: "a.png,b.png", name: "srcset", target: "a.png,b.png" },
                ]),
                law: checkNamed("Reference", "Href_form"),
                name: "srcset of two candidates",
              },
              {
                changes: ChangeSet.empty(Author).insert(DocumentDirectory, [
                  { ...directory, directory: "items", name: "/a.xml" },
                ]),
                law: checkNamed("DocumentDirectory", "E1_derived"),
                name: "document path not split at its last slash",
              },
              {
                changes: ChangeSet.empty(Author)
                  .insert(DocumentDirectory, [directory])
                  .insert(ReferencePath, [{ ...resolved, path: "a.png" }]),
                law: checkNamed("ReferencePath", "E1_derived"),
                name: "resolved path not kept ‖ rest",
              },
              {
                changes: ChangeSet.empty(Author)
                  .insert(DocumentDirectory, [directory])
                  .insert(ReferencePath, [
                    {
                      ...resolved,
                      climb: "2",
                      kept: "",
                      path: "a.png",
                      removed: "items/",
                      target: "../../a.png",
                      ups: "../../",
                    },
                  ]),
                law: checkNamed("ReferencePath", "Href_form"),
                name: "resolved target climbing above the package root",
              },
              {
                changes: ChangeSet.empty(Author)
                  .insert(DocumentDirectory, [directory])
                  .insert(ReferencePath, [
                    {
                      ...resolved,
                      path: "items/a/../b.png",
                      rest: "a/../b.png",
                      target: "a/../b.png",
                    },
                  ]),
                law: checkNamed("ReferencePath", "Href_form"),
                name: "resolved target with a dot segment after a plain one",
              },
              {
                changes: ChangeSet.empty(Author)
                  .insert(DocumentDirectory, [directory])
                  .insert(XmlBase, [{ document: stray, node: strayOther }])
                  .insert(ReferencePath, [resolved]),
                law: checkNamed("DocumentDirectory", "Href_form"),
                name: "xml:base beside a resolved reference",
              },
            ] as const;
            for (const { changes, law, name } of cases) {
              const outcome = yield* db.apply(changes, {});

              assert.isTrue(rejectedBy(outcome, law), `${name}: ${outcome.kind}`);
            }
          }),
      );

      it.effect(
        "refuses rows that name no row of the record or of a resource's files, by each containment",
        () =>
          // Oracle: PostgreSQL, each containment's foreign key, set immediate alone: 23503 on it.
          // - href-listed: a resource href's path no file of its resource lists (CP 1.2 §6.6.2,
          //   reading 94);
          // - root-type-reverse: a document-typed href that is no document of its type (reading 84);
          // - entry-kind: a document-typed href, and a document, that is no entry of the record;
          // - a dependency whose identifierref names no resource of its package (CP 1.2 §6.11.5 B);
          // - file-exists: a file whose href is in the resolvedHref form, and a resolved reference,
          //   each naming no entry (CP 1.2 InterchangePackage (b) and (d));
          // - stimulus-ref-target: a stimulus ref's resolved href naming no stimulus document
          //   (information model §7.6, the UP audit's B5).
          // Bound: one stray row per containment.
          Effect.gen(function* containments() {
            const client = yield* loginSession;
            const itemHref = {
              href: "item.xml",
              node: stray,
              package: stray,
              params: "",
              path: "item.xml",
              type: codeOf(ResourceType.handles, "imsqti_item_xmlv3p0"),
            };
            const cases = [
              {
                comment: "foreign key ResourceHref(node, path) to ResourceFile(resource, href)",
                inserts: [{ row: itemHref, view: "resource_href" }],
                table: "resource_href",
              },
              {
                comment: "foreign key ResourceHref(package where",
                inserts: [{ row: itemHref, view: "resource_href" }],
                table: "resource_href",
              },
              {
                comment: "foreign key Document(package, path) to Entry(package, path)",
                inserts: [
                  {
                    row: documentSqlRow({
                      path: manifestPath,
                      resourceType: "none",
                      rootKind: "cp:manifest",
                    }),
                    view: "document",
                  },
                ],
                table: "document",
              },
              {
                comment: "foreign key Dependency(package, ref) to Resource(package, identifier)",
                inserts: [
                  {
                    row: {
                      document: stray,
                      kind: codeOf(NodeKind.handles, "cp:dependency"),
                      nearest: stray,
                      node: strayOther,
                      package: stray,
                      ref: "nowhere",
                      resource: stray,
                      resource_identifier: "r",
                      start: 4,
                      version: codeOf(SchemaVersion.handles, "3.0.1"),
                    },
                    view: "dependency",
                  },
                ],
                table: "dependency",
              },
              {
                comment: "foreign key File(package where",
                inserts: [
                  {
                    row: {
                      document: stray,
                      href: "missing.png",
                      kind: codeOf(NodeKind.handles, "cp:file"),
                      nearest: stray,
                      node: strayOther,
                      package: stray,
                      resource: stray,
                      start: 4,
                      version: codeOf(SchemaVersion.handles, "3.0.1"),
                    },
                    view: "file",
                  },
                ],
                table: "file",
              },
              {
                comment: "foreign key ReferencePath(package, path) to Entry(package, path)",
                inserts: [
                  {
                    row: {
                      at: 0,
                      climb: 0,
                      directory: "items/",
                      document: stray,
                      kept: "items/",
                      kind: codeOf(NodeKind.handles, "img"),
                      name: codeOf(AttributeName.handles, "src"),
                      node: strayOther,
                      package: stray,
                      path: "items/missing.png",
                      removed: "",
                      rest: "missing.png",
                      target: "missing.png",
                      ups: "",
                    },
                    view: "reference_path",
                  },
                ],
                table: "reference_path",
              },
              {
                comment: "foreign key ReferencePath(package where",
                inserts: [
                  {
                    row: {
                      at: 0,
                      climb: 0,
                      directory: "items/",
                      document: stray,
                      kept: "items/",
                      kind: codeOf(NodeKind.handles, "qti-assessment-stimulus-ref"),
                      name: codeOf(AttributeName.handles, "href"),
                      node: strayOther,
                      package: stray,
                      path: "items/missing.png",
                      removed: "",
                      rest: "missing.png",
                      target: "missing.png",
                      ups: "",
                    },
                    view: "reference_path",
                  },
                ],
                table: "reference_path",
              },
            ];
            for (const { comment, inserts, table } of cases) {
              const keys = yield* foreignKeysOf(client, table, comment);
              assert.isNotEmpty(keys, comment);

              for (const key of keys) {
                const refused = Option.getOrUndefined(
                  yield* deferredInsert(client, inserts, [key]),
                );

                assert.strictEqual(refused?.code, "23503", `${comment} (${key})`);
                assert.strictEqual(refused?.constraint, key, comment);
              }
            }
          }).pipe(Effect.scoped),
        { timeout: leaseTestTimeoutMs },
      );
    },
  );
});
