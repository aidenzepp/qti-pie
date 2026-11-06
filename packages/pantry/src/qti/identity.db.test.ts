/**
 * The identity overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3),
 * written to run at N1 and never by a hand: each refused state is one the law's model refuses,
 * named by the constraint that states the law.
 *
 * Every case is a direct SQL writer's, as the rules file's rule 8 states it: the author login,
 * `SET ROLE` to the author role, SERIALIZABLE, every deferrable foreign key deferred, the case's
 * rows inserted with every column a writer fills (a family's hidden ones by the comment grizzle
 * installs on each), then the one deferred constraint under test set immediate, and a rollback.
 * A row's CHECKs, keys and non-deferrable foreign keys (a counted family's owner axis) are judged
 * as it is inserted, so a refused case's verdict is its SQLSTATE and the constraint that states the
 * law, and a control's is that the same constraint passes.
 *
 * The cases that need a whole stored document arrive with the importer (Q5.15), and probe P2
 * restates them over a package: a dangling IDREF token, refused at COMMIT by `foreign key
 * Idref(document, token) to IdBinding(document, id)` (23503), and a text's by `TextIdref`'s, which
 * this file holds to their fields by the catalogue, since a token's owner axis into `Attribute` or
 * `IdentityText` is not deferrable; the copies between `Attribute`, `Node` and each overlay, both
 * ways; and R26 over a manifest and an item.
 */
import type { DbConnection } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { assert, it } from "@effect/vitest";
import { Effect, Option, Redacted } from "effect";
import { Client } from "pg";
import type { DatabaseError, QueryResultRow } from "pg";
import { describe } from "vitest";
import { loginConnection } from "#pantry/db/connection.ts";
import { AttributeName, NodeKind, SchemaVersion, TypeName } from "#pantry/grammar/install.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The author login's PostgreSQL role, `<schema>__<login>`.
 */
const authorAppRole = "qti__author_app";

/**
 * The author role's PostgreSQL role.
 */
const authorRole = "qti__author";

/**
 * The PostgreSQL schema of `Qti`'s tables.
 */
const qtiSchema = "qti";

/**
 * The name PostgreSQL gives every `E1_derived` check of the identity overlays: the check's name,
 * which grizzle writes in snake case.
 */
const derivedCheck = "e_1_derived";

/**
 * Read the password a connection authenticates with.
 *
 * @param password - The connection's password.
 * @returns The password's text.
 */
const passwordText = (password: DbConnection["password"]) =>
  (Redacted.isRedacted(password) ? Effect.succeed(password) : password).pipe(
    Effect.map(Redacted.value),
  );

/**
 * A session of the author login on the lease, over verify-full TLS against the cluster's CA,
 * closed with its scope: a direct SQL writer.
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
 * Decide whether a failure is a server error of node-postgres's, which carries a SQLSTATE and the
 * constraint it names.
 *
 * @param error - The failure's cause.
 * @returns Whether it is one.
 */
const isServerError = (error: unknown): error is DatabaseError =>
  error instanceof Error && "code" in error && "constraint" in error;

/**
 * One column of a table as a direct writer fills it: its name, whether PostgreSQL generates it,
 * and grizzle's comment on it (empty for a declared field).
 */
interface Column {
  readonly comment: string;
  readonly generated: boolean;
  readonly name: string;
}

/**
 * Read a table's columns from the catalogue.
 *
 * @param client - The session.
 * @param table - The table.
 * @returns Its live columns, in order.
 */
const columnsOf = (client: Client, table: string) =>
  rowsOf<{ readonly comment: string | null; readonly generated: string; readonly name: string }>(
    client,
    `SELECT a.attname AS name, a.attgenerated AS generated,
            pg_catalog.col_description(a.attrelid, a.attnum) AS comment
       FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = pg_catalog.to_regclass($1) AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY a.attnum`,
    [`${qtiSchema}.${table}`],
  ).pipe(
    Effect.map((rows) =>
      rows.map((row): Column => ({
        comment: row.comment ?? "",
        generated: row.generated !== "",
        name: row.name,
      })),
    ),
  );

/**
 * A row a direct writer inserts into one of `Qti`'s tables: its declared columns by their names,
 * and its hidden columns by the comment grizzle installs on each.
 */
interface SqlRow {
  readonly fields: Readonly<Record<string, string | number>>;
  readonly hidden?: Readonly<Record<string, number>>;
}

/**
 * The rows of one table a case inserts, in one statement.
 */
interface Insert {
  readonly rows: readonly SqlRow[];
  readonly table: string;
}

/**
 * Read the value a row gives a written column: its own field, or its hidden column by the column's
 * comment.
 *
 * @param row - The row.
 * @param column - The column.
 * @returns The value; a column the row does not fill fails the case, since every identity table's
 *   written columns are the case's to state.
 */
const valueOf = (row: SqlRow, column: Column): string | number =>
  row.fields[column.name] ??
  Object.entries(row.hidden ?? {}).find(([comment]) => comment === column.comment)?.[1] ??
  assert.fail(`no value for ${column.name} (${column.comment})`);

/**
 * Insert each step's rows as the author role, every deferrable foreign key deferred, set the
 * named constraints immediate, and roll back: the server's verdict on the rows by their CHECKs,
 * keys, non-deferrable foreign keys and the named constraints.
 *
 * @param client - The session.
 * @param inserts - The statements' rows, in order.
 * @param immediate - The deferred constraints to check once every row is in, as `table.name`.
 * @returns The server's error, or none when every statement succeeded; fails with any other
 *   failure.
 */
const verdictOf = (client: Client, inserts: readonly Insert[], immediate: readonly string[] = []) =>
  Effect.gen(function* transaction() {
    const statements: { readonly text: string; readonly values: readonly (string | number)[] }[] =
      [];
    for (const { rows, table } of inserts) {
      const columns = (yield* columnsOf(client, table)).filter(({ generated }) => !generated);
      const tuples = rows.map(
        (_row, r) =>
          `(${columns.map((_column, c) => `$${String(r * columns.length + c + 1)}`).join(", ")})`,
      );
      statements.push({
        text: `INSERT INTO ${qtiSchema}.${table} (${columns.map(({ name }) => `"${name}"`).join(", ")}) VALUES ${tuples.join(", ")}`,
        values: rows.flatMap((row) => columns.map((column) => valueOf(row, column))),
      });
    }

    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");

    const outcome = yield* Effect.gen(function* statementsInOrder() {
      yield* rowsOf(client, `SET ROLE ${authorRole}`);
      yield* rowsOf(client, "SET CONSTRAINTS ALL DEFERRED");
      for (const { text, values } of statements) {
        yield* rowsOf(client, text, values);
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

    return Option.getOrUndefined(outcome);
  });

/**
 * Find the one constraint of a table whose comment matches a `LIKE` pattern: a key's or a foreign
 * key's, which grizzle names by a digest and describes by its comment.
 *
 * @param client - The session.
 * @param table - The table.
 * @param pattern - The comment's pattern.
 * @returns The constraint's name.
 */
const constraintDescribed = (client: Client, table: string, pattern: string) =>
  rowsOf<{ readonly conname: string }>(
    client,
    `SELECT c.conname FROM pg_catalog.pg_constraint c
      WHERE c.conrelid = pg_catalog.to_regclass($1)
        AND pg_catalog.obj_description(c.oid, 'pg_constraint') LIKE $2`,
    [`${qtiSchema}.${table}`, pattern],
  ).pipe(
    Effect.map((rows) => {
      assert.strictEqual(rows.length, 1, `${table}: one constraint described ${pattern}`);

      return rows[0]?.conname ?? "";
    }),
  );

/**
 * Read a foreign key's referencing and referenced columns from the catalogue.
 *
 * @param client - The session.
 * @param name - The constraint's name.
 * @returns The two tables and their columns, in key order.
 */
const foreignKeyOf = (client: Client, name: string) =>
  rowsOf<{ readonly columns: string; readonly target: string; readonly targets: string }>(
    client,
    `SELECT pg_catalog.string_agg(a.attname, ' ' ORDER BY k.n) AS columns,
            t.relname AS target,
            pg_catalog.string_agg(b.attname, ' ' ORDER BY k.n) AS targets
       FROM pg_catalog.pg_constraint c
       JOIN pg_catalog.pg_namespace s ON s.oid = c.connamespace
       JOIN pg_catalog.pg_class t ON t.oid = c.confrelid
       CROSS JOIN LATERAL pg_catalog.unnest(c.conkey, c.confkey) WITH ORDINALITY AS k(src, dst, n)
       JOIN pg_catalog.pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.src
       JOIN pg_catalog.pg_attribute b ON b.attrelid = c.confrelid AND b.attnum = k.dst
      WHERE s.nspname = $1 AND c.conname = $2 AND c.contype = 'f'
      GROUP BY t.relname`,
    [qtiSchema, name],
  ).pipe(Effect.map((rows) => rows[0]));

/**
 * Assert that a case's verdict is the refusal of one constraint by its SQLSTATE.
 *
 * @param refused - The server's error, if any.
 * @param constraint - The constraint stating the law.
 * @param sqlstate - The SQLSTATE: 23514 for a CHECK, 23505 for a key, 23503 for a foreign key.
 * @param label - The case.
 */
const assertRefusedBy = (
  refused: DatabaseError | undefined,
  constraint: string,
  sqlstate: "23503" | "23505" | "23514",
  label: string,
) => {
  assert.strictEqual(refused?.code, sqlstate, `${label}: ${refused?.message ?? "accepted"}`);
  assert.strictEqual(refused?.constraint, constraint, label);
};

/**
 * Assert that a case's every statement succeeded: no CHECK, key or immediate foreign key refused
 * it.
 *
 * @param refused - The server's error, if any.
 * @param label - The case.
 */
const assertAccepted = (refused: DatabaseError | undefined, label: string) => {
  assert.isUndefined(
    refused,
    `${label}: ${refused?.code ?? ""} ${refused?.constraint ?? ""} ${refused?.message ?? ""}`,
  );
};

/**
 * The uuid of the case's row numbered `n`: no stored row holds one.
 *
 * @param n - The number, below 256.
 * @returns The uuid.
 */
const uuidOf = (n: number): string =>
  `00000000-0000-4000-8000-00000000${n.toString(16).padStart(4, "0")}`;

/**
 * The two documents the cases write into.
 */
const [first, second] = [uuidOf(1), uuidOf(2)] as const;

/**
 * The family whose owner is each ID's binding, `IdBinding` over `DocumentId`.
 */
const bindingFamily = "IdBinding.carriers";

/**
 * A `DocumentId` row of an element, a member of its binding's family at its slot: its lexical form
 * split around its value as the builder splits it, or as the case corrupts it, and its owner, the
 * element itself for an attribute's ID.
 *
 * @param node - The element's number.
 * @param document - Its document.
 * @param pieces - The lexical form and its pieces.
 * @param pieces.before - The whitespace before the value.
 * @param pieces.id - The value.
 * @param pieces.after - The whitespace after the value.
 * @param pieces.lexical - The lexical form; by default the pieces concatenated.
 * @param pieces.owner - The number of the element its binding names; by default its own.
 * @param place - Its slot in its binding's family and its binding's count; by default the one.
 * @param place.at - Its slot.
 * @param place.count - Its binding's count.
 * @returns The row.
 */
const documentIdRow = (
  node: number,
  document: string,
  {
    after = "",
    before = "",
    id,
    lexical = `${before}${id}${after}`,
    owner = node,
  }: {
    readonly after?: string;
    readonly before?: string;
    readonly id: string;
    readonly lexical?: string;
    readonly owner?: number;
  },
  place?: { readonly at: number; readonly count: number },
): SqlRow => ({
  fields: { after, before, document, id, lexical, node: uuidOf(node), owner: uuidOf(owner) },
  hidden: {
    [`the index of the family ${bindingFamily}`]: place?.at ?? 0,
    [`the owner's count of the family ${bindingFamily}`]: place?.count ?? 1,
  },
});

/**
 * An `IdBinding` row: an id of a document bound to an element, carried by `carriers` IDs.
 *
 * @param document - The document.
 * @param id - The id.
 * @param owner - The number of the element it is bound to.
 * @param carriers - The IDs that bind it.
 * @returns The row.
 */
const bindingRow = (document: string, id: string, owner: number, carriers = 1): SqlRow => ({
  fields: { carriers, document, id, owner: uuidOf(owner) },
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
 * The family of one projection and its members, by their tables, its count field and the comment
 * prefix grizzle gives a member's hidden columns: `DocumentLang` over `XmlLang`, and
 * `ResourceLomLanguageSet` over `LomLanguage`.
 */
interface Projection {
  readonly count: string;
  readonly member: (node: number, owner: string, lang: string) => SqlRow["fields"];
  readonly memberTable: string;
  readonly owner: (owner: string, lang: string, carriers: number) => SqlRow["fields"];
  readonly ownerTable: string;
}

/**
 * The two projections, each over its owner field: a document, or a LOM general category.
 */
const projections: readonly Projection[] = [
  {
    count: "DocumentLang.carriers",
    member: (node, document, lang) => ({ document, lang, node: uuidOf(node) }),
    memberTable: "xml_lang",
    owner: (document, lang, carriers) => ({ carriers, document, generals: 0, lang }),
    ownerTable: "document_lang",
  },
  {
    count: "ResourceLomLanguageSet.carriers",
    member: (node, general, lang) => ({ general, lang, node: uuidOf(node) }),
    memberTable: "lom_language",
    owner: (general, lang, carriers) => ({ carriers, general, lang }),
    ownerTable: "resource_lom_language_set",
  },
];

/**
 * A member of a projection's family at its slot of its owner's count, its hidden columns as
 * grizzle's filler sets them.
 *
 * @param projection - The projection.
 * @param fields - The member's fields.
 * @param place - Its slot and its owner's count.
 * @param place.at - Its slot.
 * @param place.count - Its owner's count.
 * @returns The row.
 */
const memberRow = (
  projection: Projection,
  fields: SqlRow["fields"],
  { at, count }: { readonly at: number; readonly count: number },
): SqlRow => ({
  fields,
  hidden: {
    [`the index of the family ${projection.count}`]: at,
    [`the owner's count of the family ${projection.count}`]: count,
  },
});

/**
 * One `LabelUse` row, of an element in a document whose root is of the given kind.
 *
 * @param rootKind - The document's root kind.
 * @returns The statement's rows.
 */
const labelled = (rootKind: string): Insert => ({
  rows: [
    {
      fields: {
        document: first,
        node: uuidOf(3),
        root_kind: codeOf(NodeKind.handles, rootKind),
      },
    },
  ],
  table: "label_use",
});

/**
 * A document's `DocumentGenerals` row, its count of describing categories written as a case
 * states it.
 *
 * @param generals - The count.
 * @returns The statement's rows.
 */
const described = (generals: number): Insert => ({
  rows: [{ fields: { document: first, generals } }],
  table: "document_generals",
});

/**
 * A `DocumentLang` row of the first document, carried once, its count of listing categories
 * written as a case states it.
 *
 * @param lang - The `xml:lang` form.
 * @param generals - The count of its witnesses.
 * @returns The statement's rows.
 */
const form = (lang: string, generals: number): Insert => ({
  rows: [{ fields: { carriers: 1, document: first, generals, lang } }],
  table: "document_lang",
});

/**
 * One R26 witness of the first document's form, its one listing category's, beside the form's
 * `DocumentLang` row, its family's hidden columns as grizzle's filler sets them.
 *
 * @param lang - The `xml:lang` form.
 * @param pieces - The form's pieces as the case writes them.
 * @param pieces.lead - The whitespace before the value.
 * @param pieces.trail - The whitespace after it.
 * @param pieces.value - The value.
 * @returns The two statements' rows.
 */
const witness = (
  lang: string,
  pieces: { readonly lead: string; readonly trail: string; readonly value: string },
): readonly Insert[] => [
  form(lang, 1),
  {
    rows: [
      {
        fields: { document: first, general: uuidOf(9), lang, ...pieces },
        hidden: {
          "the index of the family DocumentLang.generals": 0,
          "the owner's count of the family DocumentLang.generals": 1,
        },
      },
    ],
    table: "general_lang",
  },
];

/**
 * An `IdentityText` row of a `qti-description` under a governing type, with its IDREF token count
 * and their concatenation's end as a case states them.
 *
 * @param governs - The governing type's `TypeName` handle.
 * @param lexical - The element's text.
 * @param idrefs - Its token count.
 * @param idrefText - Its tokens' concatenation.
 * @returns The statement's rows.
 */
const identityText = (
  governs: string,
  lexical: string,
  idrefs: number,
  idrefText: string,
): Insert => ({
  rows: [
    {
      fields: {
        document: first,
        governs: codeOf(TypeName.handles, governs),
        idref_text: idrefText,
        idrefs,
        kind: codeOf(NodeKind.handles, "qti-description"),
        lexical,
        node: uuidOf(4),
        owner: uuidOf(3),
        version: codeOf(SchemaVersion.handles, "3.0.1"),
      },
    },
  ],
  table: "identity_text",
});

/**
 * The family whose owner is each SSML fragment's value, `FragmentValue` over `SsmlAttribute`.
 */
const fragmentFamily = "FragmentValue.carriers";

/**
 * A `FragmentValue` row: a value the attributes of one kind of element hold in a fragment.
 *
 * @param fragment - The fragment's `speak`, by number.
 * @param kind - The element kind.
 * @param value - The value.
 * @param carriers - The attributes that hold it.
 * @returns The statement's rows.
 */
const fragmentValue = (
  fragment: number,
  kind: string,
  value: string,
  carriers: number,
): Insert => ({
  rows: [
    {
      fields: {
        carriers,
        fragment: uuidOf(fragment),
        kind: codeOf(NodeKind.handles, kind),
        value,
      },
    },
  ],
  table: "fragment_value",
});

/**
 * One SSML attribute of a fragment, a member of its value's family at slot 0 of 1, its value
 * written bare.
 *
 * @param node - Its element's number.
 * @param fragment - Its fragment's `speak`, by number.
 * @param read - The attribute: its element kind, its name, the kind it names, and its value.
 * @param read.kind - The element kind.
 * @param read.name - The attribute's name.
 * @param read.refers - The kind its value names.
 * @param read.value - The value.
 * @returns The statement's rows.
 */
const ssmlAttribute = (
  node: number,
  fragment: number,
  read: {
    readonly kind: string;
    readonly name: string;
    readonly refers: string;
    readonly value: string;
  },
): Insert => ({
  rows: [
    {
      fields: {
        fragment: uuidOf(fragment),
        kind: codeOf(NodeKind.handles, read.kind),
        lead: "",
        lexical: read.value,
        name: codeOf(AttributeName.handles, read.name),
        node: uuidOf(node),
        refers: codeOf(NodeKind.handles, read.refers),
        trail: "",
        value: read.value,
      },
      hidden: {
        [`the index of the family ${fragmentFamily}`]: 0,
        [`the owner's count of the family ${fragmentFamily}`]: 1,
      },
    },
  ],
  table: "ssml_attribute",
});

/**
 * An `SsmlScope` row of the first document's element, its fragment as a case writes it.
 *
 * @param node - The element's number.
 * @param scope - The element's kind, its parent's number and its fragment's.
 * @param scope.fragment - The fragment's number; the document's node is the document itself.
 * @param scope.kind - The element kind.
 * @param scope.parent - The parent's number; the document's node is the document itself.
 * @returns The statement's rows.
 */
const ssmlScope = (
  node: number,
  scope: { readonly fragment: number; readonly kind: string; readonly parent: number },
): Insert => ({
  rows: [
    {
      fields: {
        document: first,
        fragment: uuidOf(scope.fragment),
        kind: codeOf(NodeKind.handles, scope.kind),
        nearest: first,
        node: uuidOf(node),
        parent: uuidOf(scope.parent),
        start: node,
        version: codeOf(SchemaVersion.handles, "3.0.1"),
      },
    },
  ],
  table: "ssml_scope",
});

describe.skipIf(!hasLease)("qti/identity.db.test.ts, on the lease", () => {
  it.effect(
    "refuses one id bound to two elements of one document by DocumentId key, and accepts one id bound twice to one element and one id in two documents",
    () =>
      // Oracle: PostgreSQL, the UNIQUE of `key(on(IdBinding, "document", "id"))`, against XML
      // Schema 1.0 Part 1 §3.15.5 and cvc-id clause 2 (reading 93): an id's [binding] is the set of
      // elements that purport it, an attribute's element or an ID-typed text's parent, and no
      // binding has two members; so two ID-typed children of one parent with one value, ` a ` and
      // `a`, are one binding, and so are one id in each of two documents.
      // Bound: one id on two elements of one document; one id twice under one parent, as written
      // and padded; one id in two documents.
      Effect.gen(function* documentKey() {
        const client = yield* loginSession;
        const key = yield* constraintDescribed(client, "id_binding", "key IdBinding(document, id)");

        assertRefusedBy(
          yield* verdictOf(client, [
            { rows: [bindingRow(first, "a", 3), bindingRow(first, "a", 4)], table: "id_binding" },
          ]),
          key,
          "23505",
          "one id on two elements",
        );
        assertAccepted(
          yield* verdictOf(client, [
            { rows: [bindingRow(first, "a", 3, 2)], table: "id_binding" },
            {
              rows: [
                documentIdRow(4, first, { id: "a", owner: 3 }, { at: 0, count: 2 }),
                documentIdRow(
                  5,
                  first,
                  { after: " ", before: "\t", id: "a", owner: 3 },
                  { at: 1, count: 2 },
                ),
              ],
              table: "document_id",
            },
          ]),
          "one id twice under one parent",
        );
        assertAccepted(
          yield* verdictOf(client, [
            { rows: [bindingRow(first, "a", 3), bindingRow(second, "a", 4)], table: "id_binding" },
            {
              rows: [documentIdRow(3, first, { id: "a" }), documentIdRow(4, second, { id: "a" })],
              table: "document_id",
            },
          ]),
          "one id in two documents",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses an ID row whose pieces are not its lexical form's value and outer whitespace, by E1_derived, and accepts the builder's split",
    () =>
      // Oracle: PostgreSQL, `DocumentId`'s `E1_derived` CHECK, against XML Schema 1.0 Part 2
      // §4.3.6's whiteSpace collapse of an xs:NCName: the value is the form with its outer
      // whitespace removed, one run with no whitespace in it.
      // Bound: a value that is not the form's, whitespace kept in the value, inner whitespace, an
      // empty value, and the control.
      Effect.gen(function* idSplit() {
        const client = yield* loginSession;
        const cases = [
          ["another value", { id: "b", lexical: "a" }],
          ["outer whitespace in the value", { id: " a", lexical: " a" }],
          ["inner whitespace", { id: "a b" }],
          ["an empty value", { before: " ", id: "" }],
        ] as const;

        for (const [label, pieces] of cases) {
          assertRefusedBy(
            yield* verdictOf(client, [
              { rows: [bindingRow(first, pieces.id, 3)], table: "id_binding" },
              { rows: [documentIdRow(3, first, pieces)], table: "document_id" },
            ]),
            derivedCheck,
            "23514",
            label,
          );
        }

        assertAccepted(
          yield* verdictOf(client, [
            { rows: [bindingRow(first, "a", 3)], table: "id_binding" },
            {
              rows: [documentIdRow(3, first, { after: "\n", before: " ", id: "a" })],
              table: "document_id",
            },
          ]),
          "the split",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses each projection's member whose value its owner lacks, and an owner value no member carries, and accepts one value carried twice as one row",
    () =>
      // Oracle: PostgreSQL, each counted family's owner-axis foreign key (not deferrable, so judged
      // at its INSERT) and the owner's `E1_derived` CHECK, `carriers > 0`, against the
      // specification of a projection (sets ruling 2): its rows are exactly the values its members
      // carry, each once. These are the `lang-set-copy` fixtures, both ways.
      // Bound: each projection's missing owner, its uncarried owner, and its value carried by two
      // members.
      Effect.gen(function* langSetCopy() {
        const client = yield* loginSession;
        for (const projection of projections) {
          const ownerAxis = yield* constraintDescribed(
            client,
            projection.memberTable,
            `foreign key %the owner's count of the family ${projection.count}) to %`,
          );
          const label = projection.ownerTable;

          assertRefusedBy(
            yield* verdictOf(client, [
              {
                rows: [
                  memberRow(projection, projection.member(3, first, "fr"), { at: 0, count: 1 }),
                ],
                table: projection.memberTable,
              },
            ]),
            ownerAxis,
            "23503",
            `${label}: a member whose value its owner lacks`,
          );
          assertRefusedBy(
            yield* verdictOf(client, [
              {
                rows: [{ fields: projection.owner(first, "fr", 0) }],
                table: projection.ownerTable,
              },
            ]),
            derivedCheck,
            "23514",
            `${label}: an owner value no member carries`,
          );
          assertAccepted(
            yield* verdictOf(client, [
              {
                rows: [{ fields: projection.owner(first, "fr", 2) }],
                table: projection.ownerTable,
              },
              {
                rows: [
                  memberRow(projection, projection.member(3, first, "fr"), { at: 0, count: 2 }),
                  memberRow(projection, projection.member(4, first, "fr"), { at: 1, count: 2 }),
                ],
                table: projection.memberTable,
              },
            ]),
            `${label}: one value carried twice`,
          );
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses a label in an item whose root names no tool, by Label tools, and binds no label in a stimulus",
    () =>
      // Oracle: PostgreSQL, the two foreign keys from `select(LabelUse, rootKind =
      // qti-assessment-item)` into the item roots' `tool-name` and `tool-version`, set immediate,
      // against the information model's label characteristic (§5.16.5: "If an item uses labels
      // then values for the associated toolName and toolVersion characteristics must also be
      // provided"), which binds an item, not a stimulus.
      // Bound: a label in an item with neither tool stored, and the same label in a stimulus.
      Effect.gen(function* labelTools() {
        const client = yield* loginSession;
        const tools = yield* Effect.forEach(["tool-name", "tool-version"], (tool) =>
          constraintDescribed(
            client,
            "label_use",
            `foreign key LabelUse(document where %"${tool}"%`,
          ),
        );
        for (const tool of tools) {
          assertRefusedBy(
            yield* verdictOf(client, [labelled("qti-assessment-item")], [tool]),
            tool,
            "23503",
            `an item's label beside no ${tool}`,
          );
        }

        assertAccepted(
          yield* verdictOf(client, [labelled("qti-assessment-stimulus")], tools),
          "a stimulus's label",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "holds Idref target as the foreign keys from Idref's and TextIdref's (document, token) into IdBinding's (document, id)",
    () =>
      // Oracle: the catalogue, against the statements `contained(on(Idref, "document", "token"),
      // on(IdBinding, "document", "id"))` and its `TextIdref` twin: XML Schema's Validation Root, an
      // IDREF, an attribute's or an element text's (reading 93), names an ID of its document. The
      // dangling token itself is refused over a whole stored document (Q5.15, P2).
      // Bound: the two foreign keys.
      Effect.gen(function* idrefTarget() {
        const client = yield* loginSession;
        for (const [relation, table] of [
          ["Idref", "idref"],
          ["TextIdref", "text_idref"],
        ] as const) {
          const name = yield* constraintDescribed(
            client,
            table,
            `foreign key ${relation}(document, token) to IdBinding(document, id)`,
          );

          assert.deepStrictEqual(
            yield* foreignKeyOf(client, name),
            { columns: "document token", target: "id_binding", targets: "document id" },
            relation,
          );
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses a stated xml:lang form whose listing categories fall short of its document's, by Document lang, and accepts an equal count, an unstated form and a document no category describes",
    () =>
      // Oracle: PostgreSQL, the deferred foreign key of `documentLang` set immediate, against QTI
      // 3.0 Metadata §2.7.1.3 ("There must be one value for each of the languages referred to by
      // the language attributes"), counted: a form that states a language is listed by as many
      // general categories (`DocumentLang.generals`, its witnesses) as describe its document
      // (`DocumentGenerals.generals`), and an empty or all-whitespace form states none (XML 1.0
      // §2.12).
      // Bound: a stated form listed by none of one category; listed by it; the empty form and a
      // form of whitespace alone beside one category; a stated form of a document no category
      // describes.
      Effect.gen(function* documentLangLaw() {
        const client = yield* loginSession;
        const law = yield* constraintDescribed(
          client,
          "document_lang",
          "foreign key DocumentLang(document, generals where %) to DocumentGenerals(document, generals)%",
        );
        assertRefusedBy(
          yield* verdictOf(client, [described(1), form("en", 0)], [law]),
          law,
          "23503",
          "a stated form no category lists",
        );
        for (const [label, inserts] of [
          ["a stated form its one category lists", [described(1), form("en", 1)]],
          ["the empty form", [described(1), form("", 0)]],
          ["a form of whitespace alone", [described(1), form(" \t", 0)]],
          ["a document no category describes", [described(0), form("en", 0)]],
        ] as const) {
          assertAccepted(yield* verdictOf(client, inserts, [law]), label);
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses an R26 witness whose value is not its form's collapsed value, by E1_derived, and accepts the builder's split",
    () =>
      // Oracle: PostgreSQL, `GeneralLang`'s `E1_derived` CHECK, against XML Schema 1.0 Part 2
      // §3.3.3: an xs:language's value is its form collapsed, outer whitespace removed, and a form
      // that states a language has a nonempty one.
      // Bound: another value, whitespace kept in the value, an empty value, and the control.
      Effect.gen(function* witnessSplit() {
        const client = yield* loginSession;
        for (const [label, lang, pieces] of [
          ["another value", "en", { lead: "", trail: "", value: "fr" }],
          ["whitespace kept in the value", " en", { lead: "", trail: "", value: " en" }],
          ["an empty value", " ", { lead: " ", trail: "", value: "" }],
        ] as const) {
          assertRefusedBy(
            yield* verdictOf(client, witness(lang, pieces)),
            derivedCheck,
            "23514",
            label,
          );
        }

        assertAccepted(
          yield* verdictOf(client, witness(" fr\n", { lead: " ", trail: "\n", value: "fr" })),
          "the split",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses an identity-typed text whose tokens do not fit its identity, by E1_derived, and accepts an ID with no tokens and an IDREF whose tokens are its text",
    () =>
      // Oracle: PostgreSQL, `IdentityText`'s `E1_derived` CHECK over the installed `GoverningOf`,
      // `TextDomain` and `ValueIdentity`, against XML Schema 1.0 Part 1 §3.15.5 (C50): an element
      // whose governing type reads its text as an xs:ID holds one ID and no IDREF token, one read
      // as an xs:IDREF or xs:IDREFS holds tokens that concatenate to its text, and an element of
      // no identity type has no row.
      // Bound: an ID with a token, an IDREF whose tokens are not its text, an untyped text, and
      // the two controls.
      Effect.gen(function* identityTextCheck() {
        const client = yield* loginSession;
        for (const [label, insert] of [
          ["an ID with a token", identityText("xs:ID", "a", 1, "a")],
          ["an IDREF whose tokens are not its text", identityText("xs:IDREF", "a", 1, "b")],
          ["a text of no identity type", identityText("xs:normalizedString", "a", 0, "")],
        ] as const) {
          assertRefusedBy(yield* verdictOf(client, [insert]), derivedCheck, "23514", label);
        }

        for (const [label, insert] of [
          ["an ID", identityText("xs:ID", " a ", 0, "")],
          ["an IDREF", identityText("xs:IDREF", " a ", 1, " a ")],
        ] as const) {
          assertAccepted(yield* verdictOf(client, [insert]), label);
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );
  it.effect(
    "refuses a startmark whose mark its fragment defines other than once, by SSML trim mark, and a lookup whose lexicon its fragment lacks, by SSML lexicon reference, and accepts each named once",
    () =>
      // Oracle: PostgreSQL, the deferred foreign keys of `ssmlTrimMark` and `ssmlLexiconReference`
      // set immediate, against SSML 1.1 §3.1.1.1 ("Only markers defined once in the document … are
      // permitted as the value of either startmark or endmark") and §3.1.5.1 (a lexicon's name is
      // scoped to "the current SSML document") under spec reading 3, each fragment a speak.
      // Bound: a startmark whose mark the fragment holds twice, none, or once; a lookup whose
      // lexicon the fragment holds or not.
      Effect.gen(function* ssmlFragment() {
        const client = yield* loginSession;
        const [trim, lookup] = yield* Effect.forEach(
          [
            "foreign key SsmlAttribute(node, refers, value where %) to FragmentValue(fragment, kind, value where %",
            "foreign key SsmlAttribute(fragment, refers, value where %) to FragmentValue(fragment, kind, value)%",
          ],
          (pattern) => constraintDescribed(client, "ssml_attribute", pattern),
        );
        const startmark = ssmlAttribute(3, 3, {
          kind: "ssml:speak",
          name: "startmark",
          refers: "ssml:mark",
          value: "m",
        });
        const reference = ssmlAttribute(4, 3, {
          kind: "ssml:lookup",
          name: "ref",
          refers: "ssml:lexicon",
          value: "L",
        });

        for (const [label, carriers] of [
          ["a mark defined twice", 2],
          ["no such mark", 0],
        ] as const) {
          assertRefusedBy(
            yield* verdictOf(
              client,
              [
                fragmentValue(3, "ssml:speak", "m", 1),
                ...(carriers === 0 ? [] : [fragmentValue(3, "ssml:mark", "m", carriers)]),
                startmark,
              ],
              [trim ?? ""],
            ),
            trim ?? "",
            "23503",
            label,
          );
        }

        assertAccepted(
          yield* verdictOf(
            client,
            [
              fragmentValue(3, "ssml:speak", "m", 1),
              fragmentValue(3, "ssml:mark", "m", 1),
              startmark,
            ],
            [trim ?? ""],
          ),
          "a mark defined once",
        );
        assertRefusedBy(
          yield* verdictOf(
            client,
            [fragmentValue(3, "ssml:lookup", "L", 1), reference],
            [lookup ?? ""],
          ),
          lookup ?? "",
          "23503",
          "a lexicon the fragment lacks",
        );
        assertAccepted(
          yield* verdictOf(
            client,
            [
              fragmentValue(3, "ssml:lookup", "L", 1),
              fragmentValue(3, "ssml:lexicon", "L", 1),
              reference,
            ],
            [lookup ?? ""],
          ),
          "a lexicon of the fragment",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses a scope whose fragment is not its nearest speak's, by E1_derived, and accepts a speak's own, a root's document and an inherited one",
    () =>
      // Oracle: PostgreSQL, `SsmlScope`'s `E1_derived` CHECK, against spec reading 3's fragment:
      // the nearest ssml:speak, itself included, or none (the document node) above a root that is
      // no speak; an inner element's is read from its parent by the deferred containment.
      // Bound: a speak in another fragment, a root in a fragment, and the three controls.
      Effect.gen(function* ssmlScopeCheck() {
        const client = yield* loginSession;
        for (const [label, insert] of [
          [
            "a speak in another fragment",
            ssmlScope(3, { fragment: 2, kind: "ssml:speak", parent: 2 }),
          ],
          [
            "a root in a fragment",
            ssmlScope(1, { fragment: 3, kind: "qti-assessment-item", parent: 1 }),
          ],
        ] as const) {
          assertRefusedBy(yield* verdictOf(client, [insert]), derivedCheck, "23514", label);
        }

        for (const [label, insert] of [
          ["a speak's own fragment", ssmlScope(3, { fragment: 3, kind: "ssml:speak", parent: 2 })],
          [
            "a root's document",
            ssmlScope(2, { fragment: 1, kind: "qti-assessment-item", parent: 1 }),
          ],
          ["an inherited fragment", ssmlScope(4, { fragment: 3, kind: "ssml:mark", parent: 3 })],
        ] as const) {
          assertAccepted(yield* verdictOf(client, [insert]), label);
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );
});
