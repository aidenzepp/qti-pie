/* oxlint-disable unicorn/text-encoding-identifier-case -- The rows spell the XML encoding labels (`UTF-8`) as crust's reader reports them and `Document` stores them. */
/**
 * The document layer's laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3):
 * each refused state is one the law's model refuses, named by the law it breaks.
 *
 * A row whose own laws are row CHECKs is written through the author role (`db.apply`), and the
 * outcome is `invariant-rejected` with the expected law among its `laws` (membership, since a
 * merged native names several, C22). A row that breaks a deferred foreign key, or whose acceptance
 * by its own laws alone is the contract, is written by a direct SQL writer (grizzle's README,
 * "Direct SQL access"): the author login, `SET ROLE` to the author role, at SERIALIZABLE, the row
 * inserted into its table with every column a writer fills, its foreign keys deferred and then the
 * one under test set immediate, so PostgreSQL's SQLSTATE and the constraint it names are the
 * verdict, and the transaction rolls back. A role writes a table, never its own view of it, which
 * it holds SELECT on alone (README, "Security model").
 *
 * Every case writes rows no stored node names, so none needs a document on the lease. The cases
 * over a stored tree (a node of an arm's kind without its arm row, a prefix declared twice on one
 * element, a namespace family's gap and count, and the text, whitespace and entity reference
 * checks on `Node`) need a whole valid package written first, and arrive with the importer (Q5.15).
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { DbConnection, Fact } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option, Redacted } from "effect";
import { Client } from "pg";
import type { DatabaseError, QueryResultRow } from "pg";
import { describe } from "vitest";
import { loginConnection } from "#pantry/db/connection.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import {
  Flag,
  KindByNameUnder,
  KindNamespace,
  NodeKind,
  ResourceType,
  SchemaVersion,
  TypeAvailable,
  TypeName,
} from "#pantry/grammar/install.ts";
import { Document, OpenElementName, XmlStandalone } from "#pantry/qti/chardata.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { Author } from "#pantry/qti/roles.ts";
import { bitsText } from "#pantry/test/bits.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";
import { isUriReference } from "#pantry/test/uri-reference.ts";
import { mathmlNamespace } from "#pantry/vocab/namespaces.ts";

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
 * A row a direct writer inserts into one of `Qti`'s tables: every column it fills by name, a closed
 * id by its code.
 */
type SqlRow = Readonly<Record<string, string | number>>;

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
  rowsOf<{ readonly name: string }>(
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
  rowsOf<{ readonly conname: string }>(
    client,
    `SELECT con.conname FROM pg_constraint con
       JOIN pg_class src ON src.oid = con.conrelid
       JOIN pg_class dst ON dst.oid = con.confrelid
       JOIN pg_namespace n ON n.oid = src.relnamespace
      WHERE con.contype = 'f' AND n.nspname = $1 AND src.relname = $2 AND dst.relname = $3`,
    [qtiSchema, from, to],
  ).pipe(Effect.map((rows) => rows.map(({ conname }) => conname)));

/**
 * Insert one row into its table as the author role, every foreign key deferred, then set the given
 * ones immediate, and roll back: the server's verdict on the row by those constraints alone, or
 * none when the row's own laws and those constraints accept it.
 *
 * @param client - The session.
 * @param table - The table to insert into.
 * @param row - The row, exactly the table's written columns; any other row fails the case before
 *   any statement runs.
 * @param immediate - The constraints to check at once after the insert.
 * @returns The server's error, or none when every statement succeeded; fails with any other
 *   failure.
 */
const deferredInsert = (client: Client, table: string, row: SqlRow, immediate: readonly string[]) =>
  Effect.gen(function* insertDeferred() {
    const columns = Object.keys(row);
    assert.sameMembers(
      columns,
      yield* writtenColumnsOf(client, table),
      `${table}: the row fills every column a direct writer fills`,
    );
    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");

    const outcome = yield* Effect.gen(function* statements() {
      yield* rowsOf(client, `SET ROLE ${authorRole}`);
      yield* rowsOf(client, "SET CONSTRAINTS ALL DEFERRED");
      yield* rowsOf(
        client,
        `INSERT INTO ${qtiSchema}.${table} (${columns.join(", ")}) VALUES (${columns
          .map((_, at) => `$${String(at + 1)}`)
          .join(", ")})`,
        Object.values(row),
      );
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
 * Read the type one of `Qti`'s columns casts its values to: a grizzle text domain for a field of a
 * pattern contract, by the name PostgreSQL prints it with.
 *
 * @param client - The session.
 * @param table - The table.
 * @param column - The column.
 * @returns The domain's name, schema-qualified.
 */
const domainOf = (client: Client, table: string, column: string) =>
  rowsOf<{ readonly domain: string }>(
    client,
    `SELECT a.atttypid::pg_catalog.regtype::text AS domain FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = pg_catalog.to_regclass($1) AND a.attname = $2 AND NOT a.attisdropped`,
    [`${qtiSchema}.${table}`, column],
  ).pipe(
    Effect.map(
      (rows) =>
        rows[0]?.domain ?? assert.fail(`${table}.${column}: the catalogue holds no such column`),
    ),
  );

/**
 * Cast one text to a domain as the author role, and roll back: PostgreSQL's verdict on the value by
 * the domain's CHECK, as a statement casts a value before any row's constraint (README, "Direct SQL
 * access": a value its pattern refuses is 23514, as the statement casts it).
 *
 * @param client - The session.
 * @param domain - The domain, as {@link domainOf} names it.
 * @param text - The value.
 * @returns The server's error, or none when the domain admits the value; fails with any other
 *   failure.
 */
const castTo = (client: Client, domain: string, text: string) =>
  Effect.gen(function* cast() {
    yield* rowsOf(client, "BEGIN");

    const outcome = yield* Effect.gen(function* statements() {
      yield* rowsOf(client, `SET LOCAL ROLE ${authorRole}`);
      yield* rowsOf(client, `SELECT $1::${domain} AS value`, [text]);
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
 * Judge many texts by a domain in one statement as the author role: `pg_input_is_valid` reads each
 * through the domain's input, its CHECK among it, and answers false for a value the domain refuses.
 *
 * @param client - The session.
 * @param domain - The domain, as {@link domainOf} names it.
 * @param texts - The values.
 * @returns Each value's verdict, in order.
 */
const admittedBy = (client: Client, domain: string, texts: readonly string[]) =>
  Effect.gen(function* admitted() {
    yield* rowsOf(client, "BEGIN");
    yield* rowsOf(client, `SET LOCAL ROLE ${authorRole}`);

    const rows = yield* rowsOf<{ readonly admitted: boolean; readonly text: string }>(
      client,
      `SELECT t.text, pg_catalog.pg_input_is_valid(t.text, $2) AS admitted
         FROM pg_catalog.unnest($1::text[]) WITH ORDINALITY AS t(text, at)
        ORDER BY t.at`,
      [[...texts], domain],
    );
    yield* rowsOf(client, "ROLLBACK");

    return rows;
  });

/**
 * The characters the namespace name box is drawn over: a letter, a digit, every delimiter whose
 * place RFC 3986's grammar fixes, and a space, which no URI reference holds.
 */
const uriCharacters = ["a", "1", ".", ":", "/", "?", "#", "%", "@", "[", "]", " "] as const;

/**
 * Every text of at most three of {@link uriCharacters}, the empty one first: the small scope of
 * namespace names, exhausted.
 */
const shortUris: readonly string[] = [0, 1, 2, 3].flatMap((length) =>
  Array.from({ length: uriCharacters.length ** length }, (_, at) =>
    Array.from(
      { length },
      (_unused, place) =>
        uriCharacters[Math.floor(at / uriCharacters.length ** place) % uriCharacters.length],
    ).join(""),
  ),
);

/**
 * Namespace names by name, each a case RFC 3986's grammar decides by one of its rules: the QTI
 * namespace, a URN, a relative reference with every part, an IP literal, and the refusals spec
 * reading 131 names (an unclosed IP literal, a space, a percent sign without two hex digits, a port
 * that is no digits) with an IRI's character beyond ASCII and leading whitespace.
 */
const namedUris = [
  "http://www.imsglobal.org/xsd/imsqtiasi_v3p0",
  "urn:x:y",
  "../a/b;c?d=e#f",
  "http://[::1]/",
  "http://[bad",
  "a b",
  "%zz",
  "http://h:x/",
  "http://\u{4F8B}.jp/",
  " urn:x",
] as const;

/**
 * A uuid no stored row holds: the arms' rows below name it as their node.
 */
const strayNode = "00000000-0000-4000-8000-0000000000f0";

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
 * Each arm and the document row, with a row of it whose node is no stored node, and the table its
 * containment into `Node` is installed on. The document row is the manifest's, lawful on its own
 * CHECKs: every optional field its null object (no declaration, so `none` version and standalone
 * and the empty encoding; the `none` resource type, which only `imsmanifest.xml` bears, by
 * `RootOfType`), no family member yet (each count 0), no site naming it (so its context is the
 * empty set and its nearest context the document node, by `E1_derived`), and its node's copied
 * tuple the document node's.
 */
const arms: readonly { readonly row: SqlRow; readonly table: string }[] = [
  { row: { node: strayNode, value: "a comment" }, table: "comment" },
  { row: { data: "", node: strayNode, target: "t" }, table: "pi" },
  { row: { node: strayNode, value: "<!DOCTYPE r>" }, table: "doctype" },
  {
    row: {
      assembled: "false",
      bindings: 0,
      charset: "UTF-8",
      choices: 0,
      context: bitsText(Flag, []),
      context_nearest: strayNode,
      context_nearest_kind: codeOf(NodeKind.handles, "document"),
      encoding: "",
      export_charset: "UTF-8",
      hottexts: 0,
      idref_targets: 0,
      ids: 0,
      langs: 0,
      node: strayNode,
      node_children: 1,
      node_document: strayNode,
      node_governs: codeOf(TypeName.handles, "none"),
      node_kind: codeOf(NodeKind.handles, "document"),
      node_parent_kind: codeOf(NodeKind.handles, "document"),
      node_start: 0,
      package: strayNode,
      path: manifestPath,
      resource_type: codeOf(ResourceType.handles, "none"),
      root_kind: codeOf(NodeKind.handles, "cp:manifest"),
      standalone: codeOf(XmlStandalone.handles, "none"),
      targeted_by: 0,
      variables: 0,
      version: codeOf(SchemaVersion.handles, "3.0.1"),
      xml_version: "none",
    },
    table: "document",
  },
];

/**
 * A kind `KindNamespace` holds and the namespace it gives an element of that kind: a closed parent
 * of the foreign elements below.
 */
const closedParent =
  KindNamespace.rows.find(({ namespace }) => namespace !== "" && namespace !== mathmlNamespace) ??
  assert.fail("KindNamespace holds a kind in a namespace other than MathML's");

/**
 * The namespace of QTI 3's assessment vocabulary.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The namespace an element of a kind is written in, `KindNamespace`'s.
 *
 * @param kind - The kind.
 * @returns Its namespace; the test fails for a kind `KindNamespace` does not hold.
 */
const namespaceOf = (kind: string): string =>
  KindNamespace.rows.find((row) => row.kind === kind)?.namespace ??
  assert.fail(`KindNamespace holds no ${kind}`);

/**
 * A type no element under a QTI parent may name: the first of `TypeAvailable`'s types whose
 * namespaces leave QTI's own out, a type of the content-packaging set (spec reading 81).
 */
const otherSetType =
  TypeAvailable.rows.find(({ namespaces }) => !new RegExp(namespaces, "u").test(asi))?.type ??
  assert.fail("TypeAvailable holds no type outside QTI's schema set");

/**
 * A kind of QTI's namespace whose content admits no foreign element, so `KindByNameUnder` holds no
 * row of it in 3.0.1 and its closed read is null.
 */
const closedContent =
  KindNamespace.rows.find(
    ({ kind, namespace }) =>
      namespace === asi &&
      !KindByNameUnder.rows.some((row) => row.version === "3.0.1" && row.parent === kind),
  )?.kind ?? assert.fail("every kind of QTI's namespace admits a foreign element");

/**
 * A foreign element's name row, its node and its node's tuple stray: the class law's CHECK is
 * judged as the row is inserted, before any of its foreign keys.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const foreignName = (
  fields: Pick<
    Fact<typeof OpenElementName>,
    "kind" | "namespace" | "parentKind" | "parentNamespace"
  > &
    Partial<Pick<Fact<typeof OpenElementName>, "governs" | "local">>,
): Fact<typeof OpenElementName> => ({
  document: strayNode,
  governs: "none",
  local: "e",
  nearest: strayNode,
  node: strayNode,
  parent: strayNode,
  start: 1n,
  version: "3.0.1",
  ...fields,
});

/**
 * A foreign element's name row as a direct writer sends it, its node and its node's tuple stray,
 * each closed id by its code.
 *
 * @param fields - The fields the case sets.
 * @param fields.governs - The governing type's handle.
 * @param fields.kind - The element's class.
 * @param fields.local - Its local name.
 * @param fields.namespace - Its namespace name.
 * @param fields.parentKind - Its parent's kind.
 * @param fields.parentNamespace - Its parent's namespace, QTI's where none is given.
 * @returns The row.
 */
const lawfulNameRow = (fields: {
  readonly governs: string;
  readonly kind: string;
  readonly local: string;
  readonly namespace: string;
  readonly parentKind: string;
  readonly parentNamespace?: string;
}) =>
  ({
    document: strayNode,
    governs: codeOf(TypeName.handles, fields.governs),
    kind: codeOf(NodeKind.handles, fields.kind),
    local: fields.local,
    namespace: fields.namespace,
    nearest: strayNode,
    node: strayNode,
    parent: strayNode,
    parent_kind: codeOf(NodeKind.handles, fields.parentKind),
    parent_namespace: fields.parentNamespace ?? asi,
    start: 1,
    version: codeOf(SchemaVersion.handles, "3.0.1"),
  }) satisfies SqlRow;

describe.skipIf(!hasLease)("qti/chardata.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer, { timeout: authorLayerHookTimeoutMs })(
    "the document layer's laws, judged by PostgreSQL",
    (it) => {
      it.effect(
        "refuses a Comment, Pi, Doctype or Document row whose node is no stored node of its kind, by its containment into Node",
        () =>
          // Oracle: PostgreSQL, the arm's containment into select(Node, kind = k), a foreign key
          // into UNIQUE (id, kind) through the arm's constant law column: 23503 on that key.
          // Bound: every arm and the document row, one stray row each.
          Effect.gen(function* armsIntoNode() {
            const client = yield* loginSession;
            for (const { row, table } of arms) {
              const keys = yield* foreignKeys(client, table, "node");
              assert.isNotEmpty(keys, `${table} references node`);

              const refused = Option.getOrUndefined(
                yield* deferredInsert(client, table, row, keys),
              );

              assert.strictEqual(refused?.code, "23503", table);
              assert.include(keys, refused?.constraint, table);
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "accepts a Document row whose optional fields are each their null object, by every law of the row itself",
        () =>
          // Oracle: PostgreSQL, the row's domains and CHECKs, the `Document` check among them, with
          // every foreign key deferred and none set immediate.
          // Bound: the one row that holds every null object: no declaration, so `none` version and
          // standalone and the empty encoding, and the manifest's `none` resource type.
          Effect.gen(function* nullObjects() {
            const client = yield* loginSession;
            const document = arms.find(({ table }) => table === "document");
            assert.isDefined(document);

            const refused = Option.getOrUndefined(
              yield* deferredInsert(client, "document", document.row, []),
            );

            assert.isUndefined(refused, refused?.message);
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a document that writes no declaration but an encoding or a standalone, by the Document check",
        () =>
          // Oracle: PostgreSQL, the `Document` CHECK (q1.02's no-declaration rule), judged as the
          // row is inserted.
          // Bound: each field a declaration alone writes, set without one, on the manifest's row,
          // whose `none` resource type `RootOfType` admits, so the one check under test refuses it.
          Effect.gen(function* noDeclaration() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const base = {
              assembled: false,
              charset: "UTF-8",
              contextNearest: strayNode,
              contextNearestKind: "document",
              encoding: "",
              exportCharset: "UTF-8",
              node: strayNode,
              nodeChildren: 1n,
              nodeDocument: strayNode,
              nodeGoverns: "none",
              nodeKind: "document",
              nodeParentKind: "document",
              nodeStart: 0n,
              package: strayNode,
              path: manifestPath,
              resourceType: "none",
              rootKind: "cp:manifest",
              standalone: "none",
              version: "3.0.0",
              xmlVersion: "none",
            } as const;
            for (const row of [
              { ...base, encoding: "UTF-8" },
              { ...base, standalone: "yes" },
            ] as const) {
              const outcome = yield* db.apply(ChangeSet.empty(Author).insert(Document, [row]), {});

              assert.strictEqual(outcome.kind, "invariant-rejected");
              assert.isTrue(
                outcome.kind === "invariant-rejected" &&
                  outcome.laws.some(
                    (law) =>
                      law.kind === "check" &&
                      law.relation === "Document" &&
                      law.name === "Document",
                  ),
              );
            }
          }),
      );

      it.effect(
        "refuses a foreign element of each class whose stored namespace is not its class's against its parent's, by the Foreign element class check",
        () =>
          // Oracle: PostgreSQL, the `Foreign_element_class` CHECK, against XML Schema 1.0 Part 1
          // §3.10.4's classes: no-namespace-element in none, own-namespace-element in its parent's,
          // foreign-element in another; the parent's namespace `KindNamespace`'s for a parent of a
          // kind.
          // Bound: each class with a wrong namespace under a foreign parent, and a parent of a kind
          // stored with another namespace than `KindNamespace` gives it.
          Effect.gen(function* foreignClass() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const elsewhere = "urn:example:elsewhere";
            for (const row of [
              foreignName({
                kind: "no-namespace-element",
                namespace: elsewhere,
                parentKind: "foreign-element",
                parentNamespace: "urn:example:parent",
              }),
              foreignName({
                kind: "own-namespace-element",
                namespace: elsewhere,
                parentKind: "foreign-element",
                parentNamespace: "urn:example:parent",
              }),
              foreignName({
                kind: "own-namespace-element",
                namespace: "",
                parentKind: "no-namespace-element",
                parentNamespace: "",
              }),
              foreignName({
                kind: "foreign-element",
                namespace: elsewhere,
                parentKind: "foreign-element",
                parentNamespace: elsewhere,
              }),
              foreignName({
                kind: "foreign-element",
                namespace: "",
                parentKind: "foreign-element",
                parentNamespace: elsewhere,
              }),
              foreignName({
                kind: "foreign-element",
                namespace: elsewhere,
                parentKind: closedParent.kind,
                parentNamespace: `${closedParent.namespace}x`,
              }),
            ]) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(OpenElementName, [row]),
                {},
              );

              assert.strictEqual(outcome.kind, "invariant-rejected", row.kind);
              assert.isTrue(
                outcome.kind === "invariant-rejected" &&
                  outcome.laws.some(
                    (law) =>
                      law.kind === "check" &&
                      law.relation === "OpenElementName" &&
                      law.name === "Foreign_element_class",
                  ),
                row.kind,
              );
            }
          }),
      );

      it.effect(
        "refuses a foreign element named as a kind its parent admits, or under a parent that admits none, by the OpenElementName canonical check",
        () =>
          // Oracle: PostgreSQL, the `OpenElementName_canonical` CHECK (C8): XML Schema 1.0 Part 1
          // §3.3.4 clause 1.1.1 reads a name its parent admits as that declaration's kind, so no
          // foreign row bears it; `KindByNameUnder` holds no row of a parent that admits no
          // foreign element, and its null read is refused.
          // Bound: `div` stored as an own-namespace element under `qti-ordering`, whose restated
          // slot (upstream's spec reading 61) reads it as `div`; and a foreign element under a
          // QTI kind whose content admits none.
          Effect.gen(function* canonical() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const row of [
              foreignName({
                kind: "own-namespace-element",
                local: "div",
                namespace: asi,
                parentKind: "qti-ordering",
                parentNamespace: asi,
              }),
              foreignName({
                kind: "foreign-element",
                namespace: "urn:example:f",
                parentKind: closedContent,
                parentNamespace: asi,
              }),
            ]) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(OpenElementName, [row]),
                {},
              );

              assert.strictEqual(outcome.kind, "invariant-rejected", row.parentKind);
              assert.isTrue(
                outcome.kind === "invariant-rejected" &&
                  outcome.laws.some(
                    (law) =>
                      law.kind === "check" &&
                      law.relation === "OpenElementName" &&
                      law.name === "OpenElementName_canonical",
                  ),
                row.parentKind,
              );
            }
          }),
      );

      it.effect(
        "refuses a foreign element under a QTI parent whose xsi:type names a type of another schema set, by the XsiType available check",
        () =>
          // Oracle: PostgreSQL, the `XsiType_available` CHECK (C15, C36; spec readings 60 and 81):
          // an item's set holds no content-packaging type, so under a parent in QTI's namespace the
          // type is no type `TypeAvailable` gives that namespace.
          // Bound: one row, a foreign element under `qti-selection`'s lax slot, governed by the
          // first type outside QTI's set; every other law of the row kept.
          Effect.gen(function* available() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const outcome = yield* db.apply(
              ChangeSet.empty(Author).insert(OpenElementName, [
                foreignName({
                  governs: otherSetType,
                  kind: "foreign-element",
                  namespace: "urn:example:f",
                  parentKind: "qti-selection",
                  parentNamespace: asi,
                }),
              ]),
              {},
            );

            assert.strictEqual(outcome.kind, "invariant-rejected");
            assert.isTrue(
              outcome.kind === "invariant-rejected" &&
                outcome.laws.some(
                  (law) =>
                    law.kind === "check" &&
                    law.relation === "OpenElementName" &&
                    law.name === "XsiType_available",
                ),
            );
          }),
      );

      it.effect(
        "refuses a foreign element only a strict wildcard holds, with no type and no root's name, by the Strictly held check",
        () =>
          // Oracle: PostgreSQL, the `Strictly_held` CHECK (C44, spec reading 81): a `strict`
          // wildcard's element is `mustFind` (XML Schema 1.0 Part 1 §3.10.4 clause 2), so with no
          // governing type and no declaration of its set's roots (`HeldRootsUnder`) it has no
          // known validity, and its parent is invalid (§3.3.5 [validity] clause 1.1.3).
          // Bound: a foreign element under `qti-companion-materials-info`'s strict slot, and an
          // element named as `cp:manifest` under the same slot, whose set (an item's) declares no
          // manifest; every other law of each row kept.
          Effect.gen(function* strictlyHeld() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const row of [
              foreignName({
                kind: "foreign-element",
                namespace: "urn:example:f",
                parentKind: "qti-companion-materials-info",
                parentNamespace: asi,
              }),
              foreignName({
                kind: "foreign-element",
                local: "manifest",
                namespace: namespaceOf("cp:manifest"),
                parentKind: "qti-companion-materials-info",
                parentNamespace: asi,
              }),
            ]) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(OpenElementName, [row]),
                {},
              );

              assert.strictEqual(outcome.kind, "invariant-rejected", row.local);
              assert.isTrue(
                outcome.kind === "invariant-rejected" &&
                  outcome.laws.some(
                    (law) =>
                      law.kind === "check" &&
                      law.relation === "OpenElementName" &&
                      law.name === "Strictly_held",
                  ),
                row.local,
              );
            }
          }),
      );

      it.effect(
        "accepts qti-ordering's QTI-named and no-namespace elements, an xs: or none type, a typed element under a strict slot and a root its set declares there, by every law of the row itself",
        () =>
          // Oracle: PostgreSQL, the row's domains and CHECKs (`Foreign_element_class`,
          // `OpenElementName_canonical`, `XsiType_available` and `MathML_foreign_element`), with
          // every foreign key deferred and none set immediate: upstream's spec reading 61 admits
          // each in `qti-ordering`'s slot.
          // Bound: `qti-variable` in QTI's namespace and `foo` in none under `qti-ordering`, each
          // governed by `none`; a foreign element under `qti-selection` governed by `xs:string`;
          // one under a foreign parent governed by a content-packaging type, which stands since its
          // parent's namespace is no vocabulary's (reading 81's recorded limit); and `cp:manifest`
          // under `drd:accessForAllResource`'s strict slot with no type, a root its set declares
          // (C13, `HeldRootsUnder`); and one under `qti-companion-materials-info`'s strict slot
          // governed by `xs:string`, which assesses it (reading 60).
          Effect.gen(function* lawful() {
            const client = yield* loginSession;
            for (const row of [
              lawfulNameRow({
                governs: "none",
                kind: "own-namespace-element",
                local: "qti-variable",
                namespace: asi,
                parentKind: "qti-ordering",
              }),
              lawfulNameRow({
                governs: "none",
                kind: "no-namespace-element",
                local: "foo",
                namespace: "",
                parentKind: "qti-ordering",
              }),
              lawfulNameRow({
                governs: "xs:string",
                kind: "foreign-element",
                local: "x",
                namespace: "urn:example:f",
                parentKind: "qti-selection",
              }),
              lawfulNameRow({
                governs: otherSetType,
                kind: "foreign-element",
                local: "x",
                namespace: "urn:example:f",
                parentKind: "foreign-element",
                parentNamespace: "urn:example:p",
              }),
              lawfulNameRow({
                governs: "xs:string",
                kind: "foreign-element",
                local: "x",
                namespace: "urn:example:f",
                parentKind: "qti-companion-materials-info",
              }),
              lawfulNameRow({
                governs: "none",
                kind: "foreign-element",
                local: "manifest",
                namespace: namespaceOf("cp:manifest"),
                parentKind: "drd:accessForAllResource",
                parentNamespace: namespaceOf("drd:accessForAllResource"),
              }),
            ]) {
              const refused = Option.getOrUndefined(
                yield* deferredInsert(client, "open_element_name", row, []),
              );

              assert.isUndefined(refused, refused?.message);
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a namespace name that is no RFC 3986 URI reference by NamespaceUri's domain, and admits a relative reference, as the specification's grammar judges every name of the box (spec reading 131)",
        () =>
          // Oracle: the law oracle's own recogniser of RFC 3986's `URI-reference`, Appendix A's
          // grammar run rule by rule (`#pantry/test/uri-reference.ts`), against Namespaces in XML
          // 1.0 §3 ("either a URI reference … or an empty string") and §2.1 (RFC 3986): PostgreSQL
          // judges `Namespace.uri`'s domain, `NamespaceUri`'s pattern as grizzle installs it, and a
          // refused name's cast is 23514 by the domain's CHECK, named `check` (rule
          // `namespace-name`).
          // Bound: the small scope exhausted, every name of at most three of twelve characters (1,885
          // names, the empty one among them), and ten names drawn by name; one refused and one
          // admitted cast besides.
          Effect.gen(function* namespaceName() {
            const client = yield* loginSession;
            const domain = yield* domainOf(client, "namespace", "uri");

            const refused = Option.getOrUndefined(yield* castTo(client, domain, "http://[bad"));
            assert.strictEqual(refused?.code, "23514", refused?.message ?? "admitted");
            assert.strictEqual(refused?.constraint, "check");
            assert.isTrue(
              refused?.dataType !== undefined && domain.endsWith(refused.dataType),
              `the refusal names the domain ${domain}: ${refused?.dataType ?? "none"}`,
            );

            const relative = Option.getOrUndefined(yield* castTo(client, domain, "../a/b;c?d=e#f"));
            assert.isUndefined(relative, relative?.message);

            for (const { admitted, text } of yield* admittedBy(client, domain, [
              ...shortUris,
              ...namedUris,
            ])) {
              assert.strictEqual(admitted, isUriReference(text), JSON.stringify(text));
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a foreign element in MathML's namespace, by the MathML foreign element check",
        () =>
          // Oracle: PostgreSQL, the `MathML_foreign_element` CHECK (spec reading 2), judged as the
          // row is inserted.
          // Bound: one row, a foreign-element under a parent of a kind, every other law of the row
          // kept.
          Effect.gen(function* foreignChecks() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const cases = [
              {
                name: "MathML_foreign_element",
                row: foreignName({
                  kind: "foreign-element",
                  namespace: mathmlNamespace,
                  parentKind: closedParent.kind,
                  parentNamespace: closedParent.namespace,
                }),
              },
            ] as const;
            for (const { name, row } of cases) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(OpenElementName, [row]),
                {},
              );

              assert.strictEqual(outcome.kind, "invariant-rejected", name);
              assert.isTrue(
                outcome.kind === "invariant-rejected" &&
                  outcome.laws.some(
                    (law) =>
                      law.kind === "check" &&
                      law.relation === "OpenElementName" &&
                      law.name === name,
                  ),
                name,
              );
            }
          }),
      );
    },
  );
});
