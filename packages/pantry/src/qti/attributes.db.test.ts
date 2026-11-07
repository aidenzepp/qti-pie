/**
 * The attribute layer's laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3):
 * each refused row is one the law's model refuses, named by the constraint that states the law.
 *
 * Every case is a direct SQL writer's, as the rules file's rule 8 states it: the author login, `SET
 * ROLE` to the author role, at SERIALIZABLE, every deferrable foreign key deferred, one `INSERT` of
 * the case's rows into `Qti`'s table with every column a writer fills (the hidden ones by the
 * comments grizzle installs on them, `grizzle names`'s mapping), and a rollback. A row's CHECKs and
 * keys are judged as the row is inserted, before any foreign key's trigger runs at the statement's
 * end, so a refused row's verdict is its SQLSTATE and the constraint that states the law, and a
 * control's is that no CHECK and no key refuses it: it meets, at most, the owner axis's foreign key
 * into a `Node` row the case does not write (23503).
 *
 * PostgreSQL evaluates a table's CHECKs in the order of their names, and each control sets every
 * family column as grizzle's filler would, so a corrupted row breaks exactly the law its case
 * names.
 *
 * Cases over a stored tree arrive with the importer (Q5.15), and probe P1 restates them over a
 * whole package: AL3 required and TextDomain, which are CHECKs on `Node` beside the tree's own, and
 * the families' last-axis foreign keys (an open-class attribute whose `OpenAttributeName` is
 * missing, an IDREF attribute whose tokens are missing), which need the owner's `Node` row.
 *
 * `value_domain` reads `ValueDomainOf`'s patterns, which compile once grammar/domains.ts emits them
 * without lookaround (seat QX); its cases run once it does.
 */
import type { DbConnection } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { assert, it } from "@effect/vitest";
import { Effect, Option, Redacted } from "effect";
import { Client } from "pg";
import type { DatabaseError, QueryResultRow } from "pg";
import { describe } from "vitest";
import { loginConnection } from "#pantry/db/connection.ts";
import {
  AttributeName,
  attributeRows,
  AttributeSlot,
  GoverningOf,
  KindNamespace,
  NodeKind,
  SchemaVersion,
  TypeName,
} from "#pantry/grammar/install.ts";
import { bitsText, bitsWidth } from "#pantry/test/bits.ts";
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
 * Whether a failure is a server error of node-postgres's, which carries a SQLSTATE and the
 * constraint it names.
 *
 * @param error - The failure's cause.
 * @returns Whether it is one.
 */
const isServerError = (error: unknown): error is DatabaseError =>
  error instanceof Error && "code" in error && "constraint" in error;

/**
 * One column of a table as a direct writer fills it: its name, whether PostgreSQL generates it,
 * grizzle's comment on it (empty for a declared field), its base type and, for a bit string, its
 * width.
 */
interface Column {
  readonly base: string;
  readonly comment: string;
  readonly generated: boolean;
  readonly name: string;
  readonly width: number;
}

/**
 * Read a table's columns from the catalogue.
 *
 * @param client - The session.
 * @param table - The table.
 * @returns Its live columns, in order.
 */
const columnsOf = (client: Client, table: string) =>
  rowsOf<{
    readonly base: string;
    readonly comment: string | null;
    readonly generated: string;
    readonly name: string;
    readonly width: number;
  }>(
    client,
    `SELECT a.attname AS name, a.attgenerated AS generated,
            pg_catalog.col_description(a.attrelid, a.attnum) AS comment,
            bt.typname AS base,
            CASE WHEN t.typtype = 'd' THEN t.typtypmod ELSE a.atttypmod END AS width
       FROM pg_catalog.pg_attribute a
       JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
       JOIN pg_catalog.pg_type bt ON bt.oid = CASE WHEN t.typtype = 'd' THEN t.typbasetype ELSE t.oid END
      WHERE a.attrelid = pg_catalog.to_regclass($1) AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY a.attnum`,
    [`${qtiSchema}.${table}`],
  ).pipe(
    Effect.map((rows) =>
      rows.map((row): Column => ({
        base: row.base,
        comment: row.comment ?? "",
        generated: row.generated !== "",
        name: row.name,
        width: row.width,
      })),
    ),
  );

/**
 * A row a direct writer inserts: its declared columns by their names, and its hidden columns by
 * the comment grizzle installs on each (`the owner's count of the family Node.attributes`).
 */
interface SqlRow {
  readonly fields: Readonly<Record<string, string | number | boolean>>;
  readonly hidden?: Readonly<Record<string, string | number>>;
}

/**
 * A column's value where the case states none: the identity of its type, which no CHECK of the
 * attribute layer reads unless the case sets it.
 *
 * @param column - The column.
 * @returns Zero, the empty text, the nil uuid, or the empty set.
 */
const identityOf = (column: Column): string | number | boolean => {
  switch (column.base) {
    case "bit": {
      assert.strictEqual(
        column.width,
        bitsWidth(AttributeSlot),
        `${column.name}: the attribute layer's one set is over AttributeSlot`,
      );

      return bitsText(AttributeSlot, []);
    }
    case "bool": {
      return false;
    }
    case "uuid": {
      return "00000000-0000-0000-0000-000000000000";
    }
    case "text": {
      return "";
    }
    default: {
      return 0;
    }
  }
};

/**
 * The value a row gives a column: its own field, its hidden column by the column's comment, or the
 * column's type's identity.
 *
 * @param row - The row.
 * @param column - The column.
 * @returns The value.
 */
const valueOf = (row: SqlRow, column: Column): string | number | boolean => {
  const hidden = Object.entries(row.hidden ?? {}).find(([comment]) => comment === column.comment);

  return row.fields[column.name] ?? hidden?.[1] ?? identityOf(column);
};

/**
 * Insert rows into one of `Qti`'s tables as the author role, every deferrable foreign key deferred,
 * and roll back: the server's verdict on the rows by their CHECKs, keys and immediate foreign keys.
 *
 * @param client - The session.
 * @param table - The table.
 * @param rows - The rows.
 * @returns The server's error, or none when the statement succeeded; fails with any other failure.
 */
const insertRows = (client: Client, table: string, rows: readonly SqlRow[]) =>
  Effect.gen(function* insertStatement() {
    const columns = (yield* columnsOf(client, table)).filter(({ generated }) => !generated);
    const values = rows.flatMap((row) => columns.map((column) => valueOf(row, column)));
    const tuples = rows.map(
      (_row, r) =>
        `(${columns.map((_column, c) => `$${String(r * columns.length + c + 1)}`).join(", ")})`,
    );

    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");

    const outcome = yield* Effect.gen(function* statements() {
      yield* rowsOf(client, `SET ROLE ${authorRole}`);
      yield* rowsOf(client, "SET CONSTRAINTS ALL DEFERRED");
      yield* rowsOf(
        client,
        `INSERT INTO ${qtiSchema}.${table} (${columns.map(({ name }) => `"${name}"`).join(", ")}) VALUES ${tuples.join(", ")}`,
        values,
      );
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
 * Find the constraint of a table whose comment starts as given: a family's law, which grizzle names
 * by a digest and describes by its comment.
 *
 * @param client - The session.
 * @param table - The table.
 * @param prefix - The comment's start.
 * @returns The constraint's name.
 */
const constraintDescribed = (client: Client, table: string, prefix: string) =>
  rowsOf<{ readonly conname: string }>(
    client,
    `SELECT c.conname FROM pg_catalog.pg_constraint c
      WHERE c.conrelid = pg_catalog.to_regclass($1)
        AND pg_catalog.starts_with(pg_catalog.obj_description(c.oid, 'pg_constraint'), $2)`,
    [`${qtiSchema}.${table}`, prefix],
  ).pipe(
    Effect.map((rows) => {
      assert.strictEqual(rows.length, 1, `${table}: one constraint described "${prefix}"`);

      return rows[0]?.conname ?? "";
    }),
  );

/**
 * Assert that a statement's verdict is a CHECK's or a key's refusal by the named constraint.
 *
 * @param refused - The server's error, if any.
 * @param constraint - The constraint stating the law.
 * @param sqlstate - The SQLSTATE: 23514 for a CHECK, 23505 for a key.
 * @param label - The case.
 */
const assertRefusedBy = (
  refused: DatabaseError | undefined,
  constraint: string,
  sqlstate: "23505" | "23514",
  label: string,
) => {
  assert.strictEqual(refused?.code, sqlstate, `${label}: ${refused?.message ?? "accepted"}`);
  assert.strictEqual(refused?.constraint, constraint, label);
};

/**
 * Assert that no CHECK and no key refused a statement: it succeeded, or met a foreign key.
 *
 * @param refused - The server's error, if any.
 * @param label - The case.
 */
const assertNoRowLawRefuses = (refused: DatabaseError | undefined, label: string) => {
  assert.isTrue(
    refused === undefined || refused.code === "23503",
    `${label}: ${refused?.code ?? ""} ${refused?.constraint ?? ""} ${refused?.message ?? ""}`,
  );
};

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
 * A set of `AttributeSlot` handles as its column reads it, in grizzle's one spelling of a bit
 * string (`#pantry/test/bits.ts`).
 *
 * @param slots - The slots, by code.
 * @returns The set's text.
 */
const slotBits = (...slots: readonly number[]): string =>
  bitsText(
    AttributeSlot,
    AttributeSlot.handles.filter((_, code) => slots.includes(code)),
  );

/**
 * The element of every Attribute case: a hotspot choice in 3.0.1 under its declared type, which
 * requires `identifier`, `shape` and `coords` and admits `data-*` and ARIA's IDREFS.
 */
const kind = "qti-hotspot-choice";

/**
 * The version of every case but the version-difference one.
 */
const version = "3.0.1";

/**
 * The governing type a hotspot choice under its own governor holds: the `GoverningOf` row whose
 * governor is the kind.
 */
const governs =
  GoverningOf.rows.find(
    (row) => row.kind === kind && row.governor === kind && row.version === version,
  )?.governs ?? assert.fail(`GoverningOf holds ${kind} under its own governor`);

/**
 * The slot of a name a governor admits in a version.
 *
 * @param name - The attribute's name.
 * @param at - The version.
 * @param governor - The governor.
 * @returns Its `AttributeGrammar` position's code.
 */
const slotOf = (name: string, at: string = version, governor: string = kind): number =>
  Number(
    attributeRows.find(
      (row) => row.version === at && row.governor === governor && row.name === name,
    )?.position ?? assert.fail(`${governor} admits ${name} in ${at}`),
  );

/**
 * A uuid no stored row holds: the cases' element.
 */
const strayNode = "00000000-0000-4000-8000-0000000000a0";

/**
 * The comment on an Attribute row's copy of its element's attribute count.
 */
const attributeCount = "the owner's count of the family Node.attributes";

/**
 * An attribute row of the hotspot choice, its every family column as grizzle's filler sets it for
 * the attribute at slot `at` of `count`, after the slots `was`: the control each case corrupts.
 *
 * @param fields - The attribute's name and lexical form, and whatever the case sets.
 * @param fields.name - The name.
 * @param fields.lexical - The lexical form.
 * @param place - Its slot, its element's count, and the slots before it.
 * @param place.at - Its slot.
 * @param place.count - Its element's attribute count.
 * @param place.host - Its element's kind and governing type, which governs it: the hotspot choice
 *   under its declared type by default.
 * @param place.was - The slots of the closed names before it.
 * @param place.rest - Any other column the case sets.
 * @returns The row.
 */
const attributeRow = (
  { lexical, name }: { readonly lexical: string; readonly name: string },
  {
    at = 0,
    count = 1,
    host = { governs, kind },
    rest = {},
    was = [],
  }: {
    readonly at?: number;
    readonly count?: number;
    readonly host?: { readonly governs: string; readonly kind: string };
    readonly rest?: Readonly<Record<string, string | number>>;
    readonly was?: readonly number[];
  } = {},
): SqlRow => {
  const open = ["data-*", "foreign", "no-namespace", "own-namespace"].includes(name);
  const slot = slotOf(name, version, host.kind);

  return {
    fields: {
      at,
      attrs_after: slotBits(...was, ...(open ? [] : [slot])),
      attrs_was: slotBits(...was),
      document: strayNode,
      governs: codeOf(TypeName.handles, host.governs),
      id: `00000000-0000-4000-8000-0000000001${String(at).padStart(2, "0")}`,
      kind: codeOf(NodeKind.handles, host.kind),
      lexical,
      name: codeOf(AttributeName.handles, name),
      node: strayNode,
      open_name: open ? 1 : 0,
      slot: slotBits(slot),
      version: codeOf(SchemaVersion.handles, version),
      ...rest,
    },
    hidden: { [attributeCount]: count },
  };
};

/**
 * Read the governing type a kind's elements hold under the kind's own governor in the cases'
 * version: the host of a case on another kind than the hotspot choice.
 *
 * @param of - The kind.
 * @returns The kind and its governing type.
 */
const hostOf = (of: string) => ({
  governs:
    GoverningOf.rows.find(
      (row) => row.kind === of && row.governor === of && row.version === version,
    )?.governs ?? assert.fail(`GoverningOf holds ${of} under its own governor`),
  kind: of,
});

describe.skipIf(!hasLease)("qti/attributes.db.test.ts, on the lease", () => {
  it.effect(
    "accepts a hotspot choice's admitted, distinct, rightly folded attributes by every CHECK and key, and refuses each corruption by its law",
    () =>
      // Oracle: PostgreSQL, Attribute's CHECKs as grizzle installs them: AL1_admission, E1_derived,
      // AL2_distinct and AL4_open_names by name, and the or fold's slot-0 pin and combine by its
      // comment; each control is the row the fold would write.
      // Bound: one control per law and one corruption per named invalid variant (rules file rule
      // 8): an unadmitted name, a wrong slot, a repeated closed name, a junk accumulator at slot
      // 0, a wrong after, an open class stepping the fold (the mutant without the step selection),
      // and open names counted 0 or 2.
      Effect.gen(function* attributeChecks() {
        const client = yield* loginSession;
        const fold = yield* constraintDescribed(
          client,
          "attribute",
          "check of Attribute for law or fold over fin(Node, attributes)",
        );
        const identifier = slotOf("identifier");
        const admitted = attributeRow({ lexical: "H1", name: "identifier" });

        assertNoRowLawRefuses(yield* insertRows(client, "attribute", [admitted]), "control");

        const unadmitted =
          AttributeName.handles.find(
            (name) =>
              !attributeRows.some(
                (row) => row.version === version && row.governor === kind && row.name === name,
              ),
          ) ?? assert.fail(`${kind} admits every name`);
        const unadmittedRow: SqlRow = {
          ...admitted,
          fields: {
            ...admitted.fields,
            attrs_after: slotBits(),
            name: codeOf(AttributeName.handles, unadmitted),
            slot: slotBits(),
          },
        };
        assertRefusedBy(
          yield* insertRows(client, "attribute", [unadmittedRow]),
          "al_1_admission",
          "23514",
          `${unadmitted} on ${kind}`,
        );

        const wrongSlot = slotOf("shape");
        assertRefusedBy(
          yield* insertRows(client, "attribute", [
            {
              ...admitted,
              fields: {
                ...admitted.fields,
                attrs_after: slotBits(wrongSlot),
                slot: slotBits(wrongSlot),
              },
            },
          ]),
          "e_1_derived",
          "23514",
          "identifier holding shape's slot",
        );

        assertRefusedBy(
          yield* insertRows(client, "attribute", [
            attributeRow(
              { lexical: "H2", name: "identifier" },
              { at: 1, count: 2, was: [identifier] },
            ),
          ]),
          "al_2_distinct",
          "23514",
          "identifier repeated",
        );

        assertRefusedBy(
          yield* insertRows(client, "attribute", [
            attributeRow({ lexical: "H1", name: "identifier" }, { was: [slotOf("shape")] }),
          ]),
          fold,
          "23514",
          "a junk attrsWas at slot 0",
        );

        assertRefusedBy(
          yield* insertRows(client, "attribute", [
            { ...admitted, fields: { ...admitted.fields, attrs_after: slotBits() } },
          ]),
          fold,
          "23514",
          "an after that left the slot out",
        );

        const data = attributeRow({ lexical: "x", name: "data-*" });
        assertNoRowLawRefuses(yield* insertRows(client, "attribute", [data]), "data-* control");
        assertNoRowLawRefuses(
          yield* insertRows(client, "attribute", [
            attributeRow({ lexical: "y", name: "data-*" }, { at: 1, count: 2 }),
          ]),
          "a second data-*: the fold steps over open classes, so attrsWas holds no open slot",
        );
        assertRefusedBy(
          yield* insertRows(client, "attribute", [
            { ...data, fields: { ...data.fields, attrs_after: slotBits(slotOf("data-*")) } },
          ]),
          fold,
          "23514",
          "data-* stepping the fold, which the step selection leaves it out of",
        );

        for (const openName of [0, 2]) {
          assertRefusedBy(
            yield* insertRows(client, "attribute", [
              { ...data, fields: { ...data.fields, open_name: openName } },
            ]),
            "al_4_open_names",
            "23514",
            `data-* with ${String(openName)} open names`,
          );
        }

        assertRefusedBy(
          yield* insertRows(client, "attribute", [
            { ...admitted, fields: { ...admitted.fields, open_name: 1 } },
          ]),
          "al_4_open_names",
          "23514",
          "a closed name with an open name",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "admits a name in exactly the versions whose grammar admits it on the kind, each version judged by its own rows",
    () =>
      // Oracle: PostgreSQL's AL1_admission against `AttributeGrammar`'s rows, the XSDs' declarations
      // per version (§1.2).
      // Bound: every (kind, name) the two versions' grammars admit differently, up to 8.
      Effect.gen(function* versionDifferences() {
        const client = yield* loginSession;
        const kinds: ReadonlySet<string> = new Set(NodeKind.handles);
        const admittedIn = (at: string) =>
          new Set(
            attributeRows
              .filter((row) => row.version === at && kinds.has(row.governor))
              .map(({ governor, name }) => `${governor}\u0000${name}`),
          );
        const differences = [
          ...[...admittedIn("3.0.1")].filter((key) => !admittedIn("3.0.0").has(key)),
          ...[...admittedIn("3.0.0")].filter((key) => !admittedIn("3.0.1").has(key)),
        ].slice(0, 8);

        for (const key of differences) {
          const [governor = "", name = ""] = key.split("\u0000");
          for (const at of ["3.0.0", "3.0.1"]) {
            const row = attributeRows.find(
              (held) => held.version === at && held.governor === governor && held.name === name,
            );
            const governing = GoverningOf.rows.find(
              (held) => held.version === at && held.kind === governor && held.governor === governor,
            );
            if (governing === undefined) {
              continue;
            }

            const slot = row === undefined ? [] : [Number(row.position)];
            const refused = yield* insertRows(client, "attribute", [
              {
                fields: {
                  at: 0,
                  attrs_after: slotBits(...slot),
                  attrs_was: slotBits(),
                  document: strayNode,
                  governs: codeOf(TypeName.handles, governing.governs),
                  id: "00000000-0000-4000-8000-000000000200",
                  kind: codeOf(NodeKind.handles, governor),
                  lexical: "",
                  name: codeOf(AttributeName.handles, name),
                  node: strayNode,
                  slot: slotBits(...slot),
                  version: codeOf(SchemaVersion.handles, at),
                },
                hidden: { [attributeCount]: 1 },
              },
            ]);
            const label = `${name} on ${governor} in ${at}`;

            if (row === undefined) {
              assertRefusedBy(refused, "al_1_admission", "23514", label);
            } else {
              assert.notStrictEqual(refused?.constraint, "al_1_admission", label);
            }
          }
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "judges an attribute's lexical form by its domain's pattern, coords by CoordsDType whatever its shape (spec reading 59)",
    () =>
      // Oracle: PostgreSQL's value_domain CHECK over `ValueDomainOf`'s patterns; the expected
      // verdicts are CoordsDType's (imsqti_asiv3p0p1_v1p0.xsd lines 24088 to 24092) and the roster
      // of aria-live's enumeration, the old `attribute-lexical` guard's fixture.
      // Bound: coords of 3, 4 and 6 values accepted, 2 and 5 refused; aria-live in and outside
      // its roster.
      Effect.gen(function* lexical() {
        const client = yield* loginSession;
        for (const [value, valid] of [
          ["1,2,3", true],
          ["1,2,3,4", true],
          ["1,2,3,4,5,6", true],
          ["1,2", false],
          ["1,2,3,4,5", false],
        ] as const) {
          const refused = yield* insertRows(client, "attribute", [
            attributeRow({ lexical: value, name: "coords" }),
          ]);

          if (valid) {
            assertNoRowLawRefuses(refused, `coords ${value}`);
          } else {
            assertRefusedBy(refused, "value_domain", "23514", `coords ${value}`);
          }
        }

        assertNoRowLawRefuses(
          yield* insertRows(client, "attribute", [
            attributeRow({ lexical: "polite", name: "aria-live" }),
          ]),
          "aria-live polite",
        );
        assertRefusedBy(
          yield* insertRows(client, "attribute", [
            attributeRow({ lexical: "loud", name: "aria-live" }),
          ]),
          "value_domain",
          "23514",
          "aria-live loud",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "holds each attribute's prefix to the namespace its name is in, XLink's values to xlink.xsd's types and a rubric block's view to one or more views",
    () =>
      // Oracle: PostgreSQL's Attribute_prefix CHECK, against Namespaces in XML 1.0 §6.2 (an
      // unprefixed attribute is in no namespace) and §3 (`xml` is the XML namespace's alone,
      // `xmlns` declares only): a name in no namespace has none, an `xml:` name `xml`, any other a
      // declared prefix; and value_domain over `ValueDomainOf`'s patterns, against
      // `xlink/xlink.xsd` lines 29 to 105 and spec reading 17.
      // Bound: each name class with a prefix right and wrong (a closed name in no namespace,
      // `data-*`, `xml:lang`, `xsi:schemaLocation` under `xsi` and `zs`, `xlink:href` on
      // `lom:source`, and both namespaced open classes on a foreign element); xlink:type and
      // xlink:role in and outside their domains; view empty and listed.
      Effect.gen(function* prefixesAndDomains() {
        const client = yield* loginSession;
        const lom = hostOf("lom:source");
        const foreign = hostOf("foreign-element");
        const rubric = hostOf("qti-rubric-block");
        const cases: readonly (readonly [
          string,
          string,
          string,
          string,
          { readonly governs: string; readonly kind: string },
          boolean,
        ])[] = [
          ["identifier", "H1", "", "", { governs, kind }, true],
          ["identifier", "H1", "x", "attribute_prefix", { governs, kind }, false],
          ["data-*", "v", "", "", { governs, kind }, true],
          ["data-*", "v", "x", "attribute_prefix", { governs, kind }, false],
          ["xml:lang", "en", "xml", "", { governs, kind }, true],
          ["xml:lang", "en", "", "attribute_prefix", { governs, kind }, false],
          ["xml:lang", "en", "x", "attribute_prefix", { governs, kind }, false],
          ["xsi:schemaLocation", "urn:a b", "xsi", "", { governs, kind }, true],
          ["xsi:schemaLocation", "urn:a b", "zs", "", { governs, kind }, true],
          ["xsi:schemaLocation", "urn:a b", "", "attribute_prefix", { governs, kind }, false],
          ["xsi:schemaLocation", "urn:a b", "xml", "attribute_prefix", { governs, kind }, false],
          ["xsi:schemaLocation", "urn:a b", "xmlns", "attribute_prefix", { governs, kind }, false],
          ["xlink:href", "a.xml", "xl", "", lom, true],
          ["xlink:href", "a.xml", "", "attribute_prefix", lom, false],
          ["foreign", "1", "f", "", foreign, true],
          ["foreign", "1", "", "attribute_prefix", foreign, false],
          ["own-namespace", "1", "o", "", foreign, true],
          ["own-namespace", "1", "", "attribute_prefix", foreign, false],
          ["xlink:type", "simple", "xlink", "", lom, true],
          ["xlink:type", " locator ", "xlink", "", lom, true],
          ["xlink:type", "bogus", "xlink", "value_domain", lom, false],
          ["xlink:role", "urn:r", "xlink", "", lom, true],
          ["xlink:role", "", "xlink", "value_domain", lom, false],
          ["xlink:role", " ", "xlink", "value_domain", lom, false],
          ["view", "candidate tutor", "", "", rubric, true],
          ["view", "", "", "value_domain", rubric, false],
          ["view", "  ", "", "value_domain", rubric, false],
        ];
        for (const [name, lexical, prefix, constraint, host, valid] of cases) {
          const label = `${name}=${JSON.stringify(lexical)} written with ${JSON.stringify(prefix)} on ${host.kind}`;
          const refused = yield* insertRows(client, "attribute", [
            attributeRow({ lexical, name }, { host, rest: { prefix } }),
          ]);

          if (valid) {
            assertNoRowLawRefuses(refused, label);
          } else {
            assertRefusedBy(refused, constraint, "23514", label);
          }
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "carries an IDREFS attribute's tokens as Idref pieces that concatenate to its lexical form, and none on any other attribute",
    () =>
      // Oracle: PostgreSQL, E1_derived on Attribute (the concatenation's end is the lexical form of
      // an IDREF or IDREFS attribute, and no other attribute has tokens) and on Idref (each piece
      // is its whitespace and its token, a token holds no whitespace, and every token after the
      // first follows whitespace), and the concat fold's slot-0 pin by its comment.
      // Bound: one control and one corruption of each law.
      Effect.gen(function* idrefTokens() {
        const client = yield* loginSession;
        const controls = attributeRow(
          { lexical: "a b", name: "aria-controls" },
          { rest: { idref_text: "a b", idrefs: 2 } },
        );
        assertNoRowLawRefuses(yield* insertRows(client, "attribute", [controls]), "IDREFS control");
        assertRefusedBy(
          yield* insertRows(client, "attribute", [
            { ...controls, fields: { ...controls.fields, idref_text: "a", idrefs: 1 } },
          ]),
          "e_1_derived",
          "23514",
          "tokens short of the lexical form",
        );
        assertRefusedBy(
          yield* insertRows(client, "attribute", [
            attributeRow(
              { lexical: "H1", name: "identifier" },
              { rest: { idref_text: "H1", idrefs: 1 } },
            ),
          ]),
          "e_1_derived",
          "23514",
          "an identifier, of no IDREF domain, with tokens",
        );

        const idrefCount = "the owner's count of the family Attribute.idrefs";
        const piece = (at: number, fields: Readonly<Record<string, string>>): SqlRow => ({
          fields: {
            after: "",
            at,
            attribute: "00000000-0000-4000-8000-000000000100",
            before: at === 0 ? "" : " ",
            document: strayNode,
            node: strayNode,
            ...fields,
          },
          hidden: { [idrefCount]: 2 },
        });
        const first = piece(0, { piece: "a", pieces_after: "a", pieces_was: "", token: "a" });
        const second = piece(1, { piece: " b", pieces_after: "a b", pieces_was: "a", token: "b" });
        assertNoRowLawRefuses(
          yield* insertRows(client, "idref", [first, second]),
          "pieces control",
        );

        for (const [label, row] of [
          [
            "a piece that is not its parts",
            piece(0, { piece: "x", pieces_after: "x", pieces_was: "", token: "a" }),
          ],
          [
            "a token holding a space",
            piece(0, { piece: "a c", pieces_after: "a c", pieces_was: "", token: "a c" }),
          ],
          [
            "a second token with no whitespace before it",
            piece(1, { before: "", piece: "b", pieces_after: "ab", pieces_was: "a", token: "b" }),
          ],
        ] as const) {
          assertRefusedBy(yield* insertRows(client, "idref", [row]), "e_1_derived", "23514", label);
        }

        assertRefusedBy(
          yield* insertRows(client, "idref", [
            piece(0, { piece: "a", pieces_after: "za", pieces_was: "z", token: "a" }),
          ]),
          yield* constraintDescribed(client, "idref", "check of Idref for law concat fold"),
          "23514",
          "a junk running text at slot 0",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "holds an open name's namespace to its class against its element's, and its expanded name distinct on its element",
    () =>
      // Oracle: PostgreSQL, Foreign_attribute_class by name (XML Schema 1.0 Part 1 §3.10.4, with
      // Namespaces in XML 1.0 §2 for the absent namespace) and OpenAttributeName's key (node, uri,
      // local) by its comment (XML Namespaces' unique expanded names); the open names' count by
      // the ordered family's index CHECK.
      // Bound: each class with its namespace right and wrong; a closed kind's element namespace
      // right and wrong; two names of one expanded name; two open names under one attribute.
      Effect.gen(function* openNames() {
        const client = yield* loginSession;
        const openCount = "the owner's count of the family Attribute.openName";
        const kindNamespace =
          KindNamespace.rows.find((row) => row.kind === kind)?.namespace ??
          assert.fail(`KindNamespace holds ${kind}`);
        const name = (
          fields: Readonly<Record<string, string | number>>,
          attribute = "00000000-0000-4000-8000-000000000100",
        ): SqlRow => ({
          fields: {
            at: 0,
            attribute,
            element_namespace: "urn:element",
            kind: codeOf(NodeKind.handles, "foreign-element"),
            local: "a",
            node: strayNode,
            uri: "",
            ...fields,
          },
          hidden: { [openCount]: 1 },
        });
        const classOf = (open: string) => codeOf(AttributeName.handles, open);
        const cases: readonly (readonly [string, SqlRow, boolean])[] = [
          ["no-namespace in none", name({ class: classOf("no-namespace") }), true],
          [
            "no-namespace in a namespace",
            name({ class: classOf("no-namespace"), uri: "urn:x" }),
            false,
          ],
          ["data-* in none", name({ class: classOf("data-*"), local: "data-a" }), true],
          [
            "data-* in a namespace",
            name({ class: classOf("data-*"), local: "data-a", uri: "urn:x" }),
            false,
          ],
          [
            "own-namespace in its element's",
            name({ class: classOf("own-namespace"), uri: "urn:element" }),
            true,
          ],
          [
            "own-namespace in another",
            name({ class: classOf("own-namespace"), uri: "urn:x" }),
            false,
          ],
          ["own-namespace in none", name({ class: classOf("own-namespace") }), false],
          ["foreign in another", name({ class: classOf("foreign"), uri: "urn:x" }), true],
          [
            "foreign in its element's",
            name({ class: classOf("foreign"), uri: "urn:element" }),
            false,
          ],
          ["foreign in none", name({ class: classOf("foreign") }), false],
          [
            "foreign on a kind, its element's namespace the kind's",
            name({
              class: classOf("foreign"),
              element_namespace: kindNamespace,
              kind: codeOf(NodeKind.handles, kind),
              uri: "urn:x",
            }),
            true,
          ],
          [
            "foreign on a kind, its element's namespace another",
            name({
              class: classOf("foreign"),
              element_namespace: "urn:other",
              kind: codeOf(NodeKind.handles, kind),
              uri: "urn:x",
            }),
            false,
          ],
        ];
        for (const [label, row, valid] of cases) {
          const refused = yield* insertRows(client, "open_attribute_name", [row]);

          if (valid) {
            assertNoRowLawRefuses(refused, label);
          } else {
            assertRefusedBy(refused, "foreign_attribute_class", "23514", label);
          }
        }

        const foreign = { class: classOf("foreign"), uri: "urn:x" };
        assertRefusedBy(
          yield* insertRows(client, "open_attribute_name", [
            name(foreign),
            name(foreign, "00000000-0000-4000-8000-000000000101"),
          ]),
          yield* constraintDescribed(
            client,
            "open_attribute_name",
            "key OpenAttributeName(node, uri, local)",
          ),
          "23505",
          "two attributes of one expanded name on one element",
        );
        assertRefusedBy(
          yield* insertRows(client, "open_attribute_name", [
            name(foreign),
            {
              ...name({ ...foreign, local: "b" }),
              fields: { ...name({ ...foreign, local: "b" }).fields, at: 1 },
            },
          ]),
          yield* constraintDescribed(
            client,
            "open_attribute_name",
            "check of OpenAttributeName for law ordered",
          ),
          "23514",
          "two open names under one attribute",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );
});
