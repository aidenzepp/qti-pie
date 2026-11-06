/**
 * The O3 overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): each
 * refused state is one the law's model refuses, named by the law it breaks, and each accepted edge
 * is one its own laws admit.
 *
 * A row whose law is a row CHECK, a containment into a closed relation (a CHECK on the row's
 * table) or a key is written through the author role (`db.apply`): PostgreSQL judges it as the row
 * is inserted, every foreign key into `Node`, `Declaration` and the other overlays being deferred,
 * so none speaks first, and the outcome is `invariant-rejected` with the expected law among its
 * `laws` (membership, since a merged native names several, C22). A row whose acceptance by its own
 * laws is the contract, and a law that is a foreign key between two stray rows, is written by a
 * direct SQL writer: the author login, `SET ROLE` to the author role, at SERIALIZABLE, every
 * constraint deferred and then the ones under test set immediate, so PostgreSQL's SQLSTATE and the
 * constraint it names are the verdict, and the transaction rolls back.
 *
 * The cases over a whole imported item need the importer's ChangeSet (Q5.15), and are listed in
 * Q5.09's report for the network seat's probe: a gap and a hottext owned through `nearest`, a
 * default hotspot followed by whitespace and one before another hotspot, AdaptiveFeedback, a
 * binding resolved against a real declaration, the read attributes' mirror of `Attribute`, and a
 * section document's references resolved under each test that places it.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { Addition, DbConnection, Fact, Law } from "@bjornpagen/grizzle";
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
  BaseType,
  Cardinality,
  DeclarationKind,
  NodeKind,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { Declaration } from "#pantry/qti/declarations.ts";
import {
  AriaRange,
  BoundVariable,
  Choice,
  ChoiceVariableName,
  CountBound,
  FeedbackRef,
  Hotspot,
  Hottext,
  InteractionAttribute,
  nilUuid,
  SectionFeedbackRef,
  Slider,
} from "#pantry/qti/interactions.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Author } from "#pantry/qti/roles.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

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
 * A uuid no stored row holds: the document and the declaration every stray row names.
 */
const stray = "00000000-0000-4000-8000-0000000019f0";

/**
 * The node of one stray row, distinct for each row of a case.
 *
 * @param at - The row's number, 0 to 99.
 * @returns Its uuid.
 */
const strayNode = (at: number): `${string}-${string}-${string}-${string}-${string}` =>
  `00000000-0000-4000-8000-0000000019${String(at).padStart(2, "0")}`;

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
 * Pick a key law over one relation's fields, in order, its side selected or not.
 *
 * @param relation - The relation.
 * @param fields - The key's fields.
 * @returns The predicate.
 */
const keyOver =
  (relation: string, fields: readonly string[]) =>
  (law: Law): boolean =>
    law.kind === "key" &&
    law.side.relation === relation &&
    law.side.terms.length === fields.length &&
    law.side.terms.every((term, at) => term.kind === "field" && term.field === fields[at]);

/**
 * A stray item binding of a choice interaction to a declared single identifier response.
 *
 * @param at - The interaction's number.
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const boundRow = (at: number, fields: Partial<Fact<typeof BoundVariable>> = {}) =>
  ({
    adaptive: false,
    attribute: "response-identifier",
    baseType: "identifier",
    cardinality: "single",
    declaration: stray,
    declarationKind: "qti-response-declaration",
    document: stray,
    identifier: "RESPONSE",
    kind: "qti-choice-interaction",
    node: strayNode(at),
    ...fields,
  }) satisfies Fact<typeof BoundVariable>;

/**
 * A stray count bound of an order interaction whose least is written, every field true to
 * `E1_derived`: least 2 and most 3 of 3 choices.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const boundOf = (fields: Partial<Fact<typeof CountBound>> = {}) =>
  ({
    choices: 3n,
    document: stray,
    kind: "qti-order-interaction",
    least: "2",
    leastValue: 2n,
    maxName: "max-choices",
    maxWritten: true,
    minName: "min-choices",
    minWritten: true,
    most: "3",
    mostValue: 3n,
    nearest: stray,
    node: strayNode(0),
    parent: stray,
    start: 4n,
    version: "3.0.1",
    ...fields,
  }) satisfies Fact<typeof CountBound>;

/**
 * A stray hotspot choice of a hotspot interaction, the last of its parent's 2 element children.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const hotspotOf = (fields: Partial<Fact<typeof Hotspot>> = {}) =>
  ({
    area: "default",
    document: stray,
    elementChildren: 0n,
    elements: 2n,
    kind: "qti-hotspot-choice",
    nearest: stray,
    node: strayNode(0),
    parent: stray,
    parentElementChildren: 2n,
    parentElements: 1n,
    parentKind: "qti-hotspot-interaction",
    start: 6n,
    version: "3.0.1",
    ...fields,
  }) satisfies Fact<typeof Hotspot>;

/**
 * A stray feedback block's outcome reference, resolved to a declared single identifier outcome.
 *
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const feedbackOf = (fields: Partial<Fact<typeof FeedbackRef>> = {}) =>
  ({
    attribute: "outcome-identifier",
    baseType: "identifier",
    cardinality: "single",
    declaration: stray,
    declarationKind: "qti-outcome-declaration",
    document: stray,
    identifier: "FEEDBACK",
    kind: "qti-feedback-block",
    node: strayNode(0),
    ...fields,
  }) satisfies Fact<typeof FeedbackRef>;

/**
 * A stray choice of one interaction.
 *
 * @param at - The choice's number.
 * @param identifier - Its identifier.
 * @param kind - Its kind.
 * @returns The row.
 */
const choiceOf = (
  at: number,
  identifier: string,
  kind: Fact<typeof Choice>["kind"] = "qti-simple-choice",
): Fact<typeof Choice> => ({
  document: stray,
  identifier,
  interaction: stray,
  kind,
  node: strayNode(at),
  parent: stray,
  start: BigInt(5 + at),
  version: "3.0.1",
});

/**
 * A stray hottext of a hottext interaction.
 *
 * @param at - The hottext's number.
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const hottextOf = (at: number, fields: Partial<Fact<typeof Hottext>> = {}) =>
  ({
    document: stray,
    identifier: "H",
    kind: "qti-hottext",
    nearest: strayNode(99),
    nearestKind: "qti-hottext-interaction",
    node: strayNode(at),
    parent: stray,
    start: BigInt(5 + at),
    version: "3.0.1",
    ...fields,
  }) satisfies Fact<typeof Hottext>;

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
 * them, a closed id by its code, a boolean as itself.
 */
type SqlRow = Readonly<Record<string, string | number | boolean>>;

/**
 * The foreign keys from one of `Qti`'s tables into another, by constraint name, read from the
 * catalogue: the constraints the containments between the two relations install.
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
 * Insert rows as the author role, every constraint deferred, then set the given ones immediate,
 * and roll back: the server's verdict on the rows by those constraints alone, or none when the
 * rows' own laws and those constraints accept them.
 *
 * @param client - The session.
 * @param inserts - Each row, with the author role's view it is inserted into.
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
 * A count bound as a direct writer's row, every closed id by its code.
 *
 * @param fields - The row as the API writes it.
 * @returns The view's row.
 */
const countBoundSql = (fields: Fact<typeof CountBound>) =>
  ({
    choices: String(fields.choices),
    document: fields.document,
    kind: codeOf(NodeKind.handles, fields.kind),
    least: fields.least,
    least_value: String(fields.leastValue),
    max_name: codeOf(AttributeName.handles, fields.maxName),
    max_written: fields.maxWritten,
    min_name: codeOf(AttributeName.handles, fields.minName),
    min_written: fields.minWritten,
    most: fields.most,
    most_value: String(fields.mostValue),
    nearest: fields.nearest,
    node: fields.node,
    parent: fields.parent,
    start: String(fields.start),
    version: codeOf(SchemaVersion.handles, fields.version),
  }) satisfies SqlRow;

/**
 * A bound variable as a direct writer's row, every closed id by its code.
 *
 * @param fields - The row as the API writes it.
 * @returns The view's row.
 */
const boundVariableSql = (fields: Fact<typeof BoundVariable>) =>
  ({
    adaptive: fields.adaptive,
    attribute: codeOf(AttributeName.handles, fields.attribute),
    base_type: codeOf(BaseType.handles, fields.baseType),
    cardinality: codeOf(Cardinality.handles, fields.cardinality),
    declaration: fields.declaration,
    declaration_kind: codeOf(DeclarationKind.handles, fields.declarationKind),
    document: fields.document,
    identifier: fields.identifier,
    kind: codeOf(NodeKind.handles, fields.kind),
    node: fields.node,
  }) satisfies SqlRow;

/**
 * A content reference as a direct writer's row, every closed id by its code.
 *
 * @param fields - The row as the API writes it.
 * @returns The view's row.
 */
const referenceSql = (fields: Fact<typeof FeedbackRef>) =>
  ({
    attribute: codeOf(AttributeName.handles, fields.attribute),
    base_type: codeOf(BaseType.handles, fields.baseType),
    cardinality: codeOf(Cardinality.handles, fields.cardinality),
    declaration: fields.declaration,
    declaration_kind: codeOf(DeclarationKind.handles, fields.declarationKind),
    document: fields.document,
    identifier: fields.identifier,
    kind: codeOf(NodeKind.handles, fields.kind),
    node: fields.node,
  }) satisfies SqlRow;

/**
 * A hotspot as a direct writer's row, every closed id by its code.
 *
 * @param fields - The row as the API writes it.
 * @returns The view's row.
 */
const hotspotSql = (fields: Fact<typeof Hotspot>) =>
  ({
    area: fields.area,
    document: fields.document,
    element_children: String(fields.elementChildren),
    elements: String(fields.elements),
    kind: codeOf(NodeKind.handles, fields.kind),
    nearest: fields.nearest,
    node: fields.node,
    parent: fields.parent,
    parent_element_children: String(fields.parentElementChildren),
    parent_elements: String(fields.parentElements),
    parent_kind: codeOf(NodeKind.handles, fields.parentKind),
    start: String(fields.start),
    version: codeOf(SchemaVersion.handles, fields.version),
  }) satisfies SqlRow;

/**
 * A printed variable's `index` reference as a direct writer's row.
 *
 * @param identifier - The name it makes.
 * @param declaration - The declaration it resolves to.
 * @returns The view's row.
 */
const indexReference = (identifier: string, declaration: Fact<typeof FeedbackRef>["declaration"]) =>
  referenceSql(
    feedbackOf({ attribute: "index", declaration, identifier, kind: "qti-printed-variable" }),
  );

/**
 * A used identifier's projection row as a direct writer's row, its counts written as the families
 * would draw them, its root kind by its code.
 *
 * @param identifier - The identifier.
 * @param rootKind - Its document's root kind.
 * @param counts - Its counts of choices, declarations and hottexts.
 * @returns The view's row.
 */
const nameSql = (
  identifier: string,
  rootKind: Fact<typeof ChoiceVariableName>["rootKind"],
  counts: {
    readonly choices: number;
    readonly declarations: number;
    readonly hottexts: number;
  },
) =>
  ({
    choices: String(counts.choices),
    declarations: String(counts.declarations),
    document: stray,
    hottexts: String(counts.hottexts),
    identifier,
    root_kind: codeOf(NodeKind.handles, rootKind),
  }) satisfies SqlRow;

describe.skipIf(!hasLease)("qti/interactions.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer, { timeout: authorLayerHookTimeoutMs })(
    "the interaction overlays' laws, judged by PostgreSQL",
    (it) => {
      it.effect(
        "refuses a binding of a type its interaction does not fit, by BindingFit, RecordBindingFit and a string binding's base type",
        () =>
          // Oracle: PostgreSQL, the containments of a typed and a record binding into the closed
          // `BindingFit` and `RecordBindingFit` (CHECKs on BoundVariable's table), and the
          // `BindingFit` check on a string binding (§5.48.2, §5.162.3).
          // Bound: a choice interaction bound to a single string, and to a record; a text entry's
          // string binding to an integer.
          Effect.gen(function* bindingFit() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const cases = [
              {
                picks: containedIn("BoundVariable", "BindingFit"),
                row: boundRow(0, { baseType: "string" }),
              },
              {
                picks: containedIn("BoundVariable", "RecordBindingFit"),
                row: boundRow(0, { baseType: "none", cardinality: "record" }),
              },
              {
                picks: checkNamed("BoundVariable", "BindingFit"),
                row: boundRow(0, {
                  attribute: "string-identifier",
                  baseType: "integer",
                  kind: "qti-text-entry-interaction",
                }),
              },
            ];
            for (const { picks, row } of cases) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(BoundVariable, [row]),
                {},
              );

              assert.isTrue(rejectedBy(outcome, picks), `${row.attribute} ${row.baseType}`);
            }
          }),
      );

      it.effect(
        "refuses a binding to a variable that is no response declaration, by Binding declared",
        () =>
          // Oracle: PostgreSQL, the `Binding_declared` check (reading 75): an interaction binds a
          // response variable.
          // Bound: a binding resolved to an outcome declaration.
          Effect.gen(function* bindingDeclared() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const outcome = yield* db.apply(
              ChangeSet.empty(Author).insert(BoundVariable, [
                boundRow(0, { declarationKind: "qti-outcome-declaration" }),
              ]),
              {},
            );

            assert.isTrue(rejectedBy(outcome, checkNamed("BoundVariable", "Binding_declared")));
          }),
      );

      it.effect(
        "refuses two bindings of one response variable, two interactions' or one interaction's response and string identifiers, by the key on (document, identifier)",
        () =>
          // Oracle: PostgreSQL's UNIQUE, or the host's key check before it, of
          // key(on(BoundVariable, "document", "identifier")): reading 92, "Each response variable
          // declared may be bound to one and only one interaction", and the string identifier's
          // "second response variable" (§5.162.3), the old `string-identifier-distinct`.
          // Bound: two interactions naming one variable; one text entry naming it twice.
          Effect.gen(function* bindingUnique() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const rows of [
              [boundRow(0), boundRow(1)],
              [
                boundRow(0, { baseType: "string", kind: "qti-text-entry-interaction" }),
                boundRow(0, {
                  attribute: "string-identifier",
                  baseType: "string",
                  kind: "qti-text-entry-interaction",
                }),
              ],
            ]) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(BoundVariable, rows),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, keyOver("BoundVariable", ["document", "identifier"])),
              );
            }
          }),
      );

      it.effect(
        "refuses counts past their bounds and a typed count its lexical form does not spell, by Choice bounds and E1 derived",
        () =>
          // Oracle: PostgreSQL, the `Choice_bounds` check (readings 18 and 76) and `E1_derived`'s
          // G-parse agreement of each count's integer with its lexical form.
          // Bound: an order interaction's most one past its choices, its least past its choices,
          // its least past a most of 0 (no exemption, reading 18); a choice interaction's least
          // past its most; a least whose integer disagrees with its form, and a form no integer
          // reads.
          Effect.gen(function* choiceBounds() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const cases = [
              { name: "Choice_bounds", row: boundOf({ most: "4", mostValue: 4n }) },
              { name: "Choice_bounds", row: boundOf({ choices: 1n }) },
              { name: "Choice_bounds", row: boundOf({ most: "0", mostValue: 0n }) },
              {
                name: "Choice_bounds",
                row: boundOf({
                  choices: 0n,
                  kind: "qti-choice-interaction",
                  least: "2",
                  leastValue: 2n,
                  most: "1",
                  mostValue: 1n,
                }),
              },
              { name: "E1_derived", row: boundOf({ least: "02", leastValue: 3n }) },
              { name: "E1_derived", row: boundOf({ least: "two", leastValue: 2n }) },
            ];
            for (const { name, row } of cases) {
              const outcome = yield* db.apply(
                ChangeSet.empty(Author).insert(CountBound, [row]),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, checkNamed("CountBound", name)),
                `${row.kind} ${row.least} ${row.most} ${String(row.choices)}`,
              );
            }
          }),
      );

      it.effect(
        "accepts an order interaction's most equal to its choices, and a choice interaction's most of 0 below its least, by every law of the row itself",
        () =>
          // Oracle: PostgreSQL, the row's domains and CHECKs with every foreign key deferred and
          // none set immediate: the edge maxChoices = choices (reading 18), and reading 76's 0.
          // Bound: the two edges.
          Effect.gen(function* choiceEdges() {
            const client = yield* loginSession;
            for (const row of [
              boundOf(),
              boundOf({
                choices: 0n,
                kind: "qti-choice-interaction",
                least: "2",
                leastValue: 2n,
                most: "0",
                mostValue: 0n,
              }),
            ]) {
              const refused = Option.getOrUndefined(
                yield* deferredInsert(
                  client,
                  [{ row: countBoundSql(row), view: "count_bound" }],
                  [],
                ),
              );

              assert.isUndefined(refused, refused?.message);
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a single response bound to an interaction whose most is not 1, and accepts a most of 1, by the containment into CountBound",
        () =>
          // Oracle: PostgreSQL, the foreign key of "Binding cardinality" (reading 92): a single
          // response's interaction is in select(CountBound, mostValue = 1). 23503 on that key.
          // Bound: a choice interaction's most of 2 and of 0, refused, and of 1, accepted.
          Effect.gen(function* bindingCardinality() {
            const client = yield* loginSession;
            const keys = yield* foreignKeys(client, "bound_variable", "count_bound");
            assert.isNotEmpty(keys);

            for (const [most, refusedExpected] of [
              [2n, true],
              [0n, true],
              [1n, false],
            ] as const) {
              const refused = Option.getOrUndefined(
                yield* deferredInsert(
                  client,
                  [
                    { row: boundVariableSql(boundRow(0)), view: "bound_variable" },
                    {
                      row: countBoundSql(
                        boundOf({
                          choices: 0n,
                          kind: "qti-choice-interaction",
                          least: "0",
                          leastValue: 0n,
                          most: String(most),
                          mostValue: most,
                        }),
                      ),
                      view: "count_bound",
                    },
                  ],
                  keys,
                ),
              );

              assert.strictEqual(
                refused?.code,
                refusedExpected ? "23503" : undefined,
                String(most),
              );
              if (refusedExpected) {
                assert.include(keys, refused?.constraint);
              }
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses an extended text interaction bound to a container without max-strings, by the containment into CountBound",
        () =>
          // Oracle: PostgreSQL, the foreign key of `max-strings-required` (reading 19): a multiple
          // or ordered binding's extended text is in select(CountBound, maxWritten = true).
          // Bound: a multiple binding with max-strings unwritten, refused, and written, accepted.
          Effect.gen(function* maxStrings() {
            const client = yield* loginSession;
            const keys = yield* foreignKeys(client, "bound_variable", "count_bound");
            for (const written of [false, true]) {
              const refused = Option.getOrUndefined(
                yield* deferredInsert(
                  client,
                  [
                    {
                      row: boundVariableSql(
                        boundRow(0, {
                          baseType: "string",
                          cardinality: "multiple",
                          kind: "qti-extended-text-interaction",
                        }),
                      ),
                      view: "bound_variable",
                    },
                    {
                      row: countBoundSql(
                        boundOf({
                          choices: 0n,
                          kind: "qti-extended-text-interaction",
                          least: "0",
                          leastValue: 0n,
                          maxName: "max-strings",
                          maxWritten: written,
                          minName: "min-strings",
                          minWritten: false,
                          most: written ? "2" : "0",
                          mostValue: written ? 2n : 0n,
                        }),
                      ),
                      view: "count_bound",
                    },
                  ],
                  keys,
                ),
              );

              assert.strictEqual(refused?.code, written ? undefined : "23503", String(written));
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a default hotspot before its parent's last element and a graphic gap match's default hotspot, by the default hotspot checks",
        () =>
          // Oracle: PostgreSQL, the `default_hotspot_last_slot` and
          // `Graphic_gap_match_default_hotspot` checks (reading 80).
          // Bound: a hotspot interaction's default hotspot at element 1 of 2; a graphic gap match's
          // associable hotspot of shape default.
          Effect.gen(function* defaultHotspot() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const cases = [
              { name: "default_hotspot_last_slot", row: hotspotOf({ elements: 1n }) },
              {
                name: "Graphic_gap_match_default_hotspot",
                row: hotspotOf({
                  kind: "qti-associable-hotspot",
                  parentKind: "qti-graphic-gap-match-interaction",
                }),
              },
            ];
            for (const { name, row } of cases) {
              const outcome = yield* db.apply(ChangeSet.empty(Author).insert(Hotspot, [row]), {});

              assert.isTrue(rejectedBy(outcome, checkNamed("Hotspot", name)), name);
            }
          }),
      );

      it.effect(
        "accepts a default hotspot as its parent's last element, and another shape anywhere, by every law of the row itself",
        () =>
          // Oracle: PostgreSQL, the row's domains and CHECKs with every foreign key deferred.
          // Bound: the last default hotspot of 2, and a rect hotspot at element 1 of 2.
          Effect.gen(function* lastHotspot() {
            const client = yield* loginSession;
            for (const row of [hotspotOf(), hotspotOf({ area: "rect", elements: 1n })]) {
              const refused = Option.getOrUndefined(
                yield* deferredInsert(client, [{ row: hotspotSql(row), view: "hotspot" }], []),
              );

              assert.isUndefined(refused, refused?.message);
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses an upper bound below the lower and an aria-valuemax below aria-valuemin, by Slider bounds and Aria value range",
        () =>
          // Oracle: PostgreSQL, the `Slider_bounds` check (reading 9, the Schematron's 14Ba) and
          // the `Aria_value_range` check (§5.2.31), each value cast by G-parse.
          // Bound: 5 above 3, 1e1 above 9.5, and aria 2 above 1.5.
          Effect.gen(function* ranges() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const row of [
              { lower: "5", node: strayNode(0), upper: "3" },
              { lower: "1e1", node: strayNode(0), upper: "9.5" },
            ] satisfies Fact<typeof Slider>[]) {
              const outcome = yield* db.apply(ChangeSet.empty(Author).insert(Slider, [row]), {});

              assert.isTrue(rejectedBy(outcome, checkNamed("Slider", "Slider_bounds")), row.lower);
            }

            const outcome = yield* db.apply(
              ChangeSet.empty(Author).insert(AriaRange, [
                { max: "1.5", min: "2", node: strayNode(0) },
              ]),
              {},
            );
            assert.isTrue(rejectedBy(outcome, checkNamed("AriaRange", "Aria_value_range")));
          }),
      );

      it.effect(
        "refuses a feedback outcome of another type, in an item's or a section's placement, and a reference to a built-in its law does not allow, by Feedback outcome type and the containment into ContentReference",
        () =>
          // Oracle: PostgreSQL, the `Feedback_outcome_type` check (reading 77) and the containment
          // of (kind, attribute, declarationKind) into the closed `ContentReference`.
          // Bound: a float outcome, of an item's feedback and of a section's feedback placed under
          // a test (port audit A45); a feedback naming the response built-in numAttempts.
          Effect.gen(function* references() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const typed = yield* db.apply(
              ChangeSet.empty(Author).insert(FeedbackRef, [feedbackOf({ baseType: "float" })]),
              {},
            );
            assert.isTrue(rejectedBy(typed, checkNamed("FeedbackRef", "Feedback_outcome_type")));

            const builtIn = yield* db.apply(
              ChangeSet.empty(Author).insert(FeedbackRef, [
                feedbackOf({
                  baseType: "integer",
                  declaration: nilUuid,
                  declarationKind: "qti-response-declaration",
                  identifier: "numAttempts",
                }),
              ]),
              {},
            );
            assert.isTrue(rejectedBy(builtIn, containedIn("FeedbackRef", "ContentReference")));

            const placed = yield* db.apply(
              ChangeSet.empty(Author).insert(SectionFeedbackRef, [
                {
                  ...feedbackOf({ baseType: "float" }),
                  assembly: stray,
                  instance: strayNode(1),
                },
              ]),
              {},
            );
            assert.isTrue(
              rejectedBy(placed, checkNamed("SectionFeedbackRef", "Feedback_outcome_type")),
            );
          }),
      );

      it.effect(
        "refuses a reference to an undeclared name, and accepts one to the built-in completionStatus, by the containment into Declaration",
        () =>
          // Oracle: PostgreSQL, the foreign key of a printed variable's `index` reference into
          // `declarationRef` (the old `varref-copy`), selected out for a built-in's name, and the
          // `Printed_variable_reference` check that resolves the built-in. 23503 on that key.
          // Bound: an undeclared name, refused; completionStatus under the nil declaration,
          // accepted.
          Effect.gen(function* varRef() {
            const client = yield* loginSession;
            const keys = yield* foreignKeys(client, "var_ref", "declaration");
            assert.isNotEmpty(keys);

            const undeclared = Option.getOrUndefined(
              yield* deferredInsert(
                client,
                [{ row: indexReference("UNDECLARED", stray), view: "var_ref" }],
                keys,
              ),
            );
            assert.strictEqual(undeclared?.code, "23503");
            assert.include(keys, undeclared?.constraint);

            const builtIn = Option.getOrUndefined(
              yield* deferredInsert(
                client,
                [{ row: indexReference("completionStatus", nilUuid), view: "var_ref" }],
                keys,
              ),
            );
            assert.isUndefined(builtIn, builtIn?.message);
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses two choices of one kind in one document with one identifier, of one interaction or of two, and two hottexts of one document, and lets a gap and a gap text share one, by their keys",
        () =>
          // Oracle: PostgreSQL's UNIQUE, or the host's key check before it, of
          // key(on(Choice, "document", "kind", "identifier")) and key(on(Hottext, "document",
          // "identifier")): the choice classes' "This identifier must not be used by any other
          // choice or item variable" (§5.132.1, §5.65.1), each class of its own kind, the document
          // its scope (reading 104).
          // Bound: two simple choices named A of one interaction, and of two; two hottexts named H,
          // one in a hottext interaction and one outside any; a gap and a gap text named A of one
          // interaction, which the key lets be (the rows are stray, so the deferred foreign keys
          // refuse them at commit, and the key is not among the laws).
          Effect.gen(function* choiceKeys() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const second of [
              choiceOf(1, "A"),
              { ...choiceOf(1, "A"), interaction: strayNode(98) },
            ]) {
              const choices = yield* db.apply(
                ChangeSet.empty(Author).insert(Choice, [choiceOf(0, "A"), second]),
                {},
              );
              assert.isTrue(
                rejectedBy(choices, keyOver("Choice", ["document", "kind", "identifier"])),
                second.interaction,
              );
            }

            const hottexts = yield* db.apply(
              ChangeSet.empty(Author).insert(Hottext, [
                hottextOf(0),
                hottextOf(1, { nearest: stray, nearestKind: "document" }),
              ]),
              {},
            );
            assert.isTrue(rejectedBy(hottexts, keyOver("Hottext", ["document", "identifier"])));

            const classes = yield* db.apply(
              ChangeSet.empty(Author).insert(Choice, [
                choiceOf(0, "A", "qti-gap"),
                choiceOf(1, "A", "qti-gap-text"),
              ]),
              {},
            );
            assert.isFalse(
              rejectedBy(classes, keyOver("Choice", ["document", "kind", "identifier"])),
            );
          }),
      );

      it.effect(
        "refuses a choice or a hottext named as a declaration of its document, or in an item as a built-in variable, by Choice not variable",
        () =>
          // Oracle: PostgreSQL, the `Choice_not_variable` check on `ChoiceVariableName` (reading 104:
          // "This identifier must not be used by any other choice or item variable"), over the
          // counts its three families draw from the rows the ChangeSet writes.
          // Bound: a simple choice and an outcome declaration named A; a hottext and that
          // declaration; a simple choice named numAttempts in an item.
          Effect.gen(function* choiceNotVariable() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const named = (identifier: string) =>
              ({
                document: stray,
                identifier,
                rootKind: "qti-assessment-item",
              }) satisfies Addition<typeof ChoiceVariableName>;
            const declared = {
              baseType: "identifier",
              baseTypeLexical: "identifier",
              cardinality: "single",
              cardinalityLexical: "single",
              declarationKind: "qti-outcome-declaration",
              document: stray,
              identifier: "A",
              identifierLead: "",
              identifierLexical: "A",
              identifierTrail: "",
              kind: "qti-outcome-declaration",
              nearest: stray,
              node: strayNode(50),
              parent: stray,
              start: 2n,
              version: "3.0.1",
            } satisfies Fact<typeof Declaration>;

            const choice = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(ChoiceVariableName, [named("A")])
                .insert(Choice, [choiceOf(0, "A")])
                .insert(Declaration, [declared]),
              {},
            );
            assert.isTrue(
              rejectedBy(choice, checkNamed("ChoiceVariableName", "Choice_not_variable")),
              "choice",
            );

            const hottext = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(ChoiceVariableName, [named("A")])
                .insert(Hottext, [hottextOf(0, { identifier: "A" })])
                .insert(Declaration, [declared]),
              {},
            );
            assert.isTrue(
              rejectedBy(hottext, checkNamed("ChoiceVariableName", "Choice_not_variable")),
              "hottext",
            );

            const builtIn = yield* db.apply(
              ChangeSet.empty(Author)
                .insert(ChoiceVariableName, [named("numAttempts")])
                .insert(Choice, [choiceOf(0, "numAttempts")]),
              {},
            );
            assert.isTrue(
              rejectedBy(builtIn, checkNamed("ChoiceVariableName", "Choice_not_variable")),
              "numAttempts",
            );
          }),
      );

      it.effect(
        "accepts a name of choices alone, of a declaration alone and a stimulus choice named as a built-in, and refuses a name counted by both and one counted by none, by the row's own checks",
        () =>
          // Oracle: PostgreSQL, `ChoiceVariableName`'s CHECKs with every foreign key and family
          // proof deferred and none set immediate: `Choice_not_variable` (reading 104) and
          // `E1_derived` (some count above 0), 23514 on the check refused.
          // Bound: two choices of one name; one declaration; a stimulus's choice named
          // numAttempts, accepted; a hottext and a declaration of one name, and a name of no
          // choice, hottext or declaration, refused.
          Effect.gen(function* nameRows() {
            const client = yield* loginSession;

            for (const [label, row, refusedBy] of [
              [
                "choices alone",
                nameSql("A", "qti-assessment-item", { choices: 2, declarations: 0, hottexts: 0 }),
                undefined,
              ],
              [
                "a declaration alone",
                nameSql("A", "qti-assessment-item", { choices: 0, declarations: 1, hottexts: 0 }),
                undefined,
              ],
              [
                "a stimulus choice named numAttempts",
                nameSql("numAttempts", "qti-assessment-stimulus", {
                  choices: 1,
                  declarations: 0,
                  hottexts: 0,
                }),
                undefined,
              ],
              [
                "a hottext and a declaration",
                nameSql("A", "qti-assessment-item", { choices: 0, declarations: 1, hottexts: 1 }),
                "choice_not_variable",
              ],
              [
                "no use",
                nameSql("A", "qti-assessment-item", { choices: 0, declarations: 0, hottexts: 0 }),
                "e_1_derived",
              ],
            ] as const) {
              const refused = Option.getOrUndefined(
                yield* deferredInsert(client, [{ row, view: "choice_variable_name" }], []),
              );

              if (refusedBy === undefined) {
                assert.isUndefined(refused, `${label}: ${refused?.message ?? ""}`);
              } else {
                assert.strictEqual(
                  refused?.code,
                  "23514",
                  `${label}: ${refused?.message ?? "accepted"}`,
                );
                assert.strictEqual(refused?.constraint, refusedBy, label);
              }
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a hottext whose nearest kind is not its nearest node's, and a read attribute whose value keeps outer whitespace, by E1 derived",
        () =>
          // Oracle: PostgreSQL, the `E1_derived` checks: a hottext's nearest is the document node
          // exactly when its nearest kind is `document`; a value is its lexical form collapsed.
          // Bound: a hottext of a hottext interaction whose nearest is its document; a value " R".
          Effect.gen(function* derived() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const hottext = yield* db.apply(
              ChangeSet.empty(Author).insert(Hottext, [hottextOf(0, { nearest: stray })]),
              {},
            );
            assert.isTrue(rejectedBy(hottext, checkNamed("Hottext", "E1_derived")));

            const read = yield* db.apply(
              ChangeSet.empty(Author).insert(InteractionAttribute, [
                {
                  document: stray,
                  kind: "qti-choice-interaction",
                  lead: "",
                  lexical: " R",
                  name: "response-identifier",
                  node: strayNode(0),
                  rootKind: "qti-assessment-item",
                  trail: "",
                  value: " R",
                },
              ]),
              {},
            );
            assert.isTrue(rejectedBy(read, checkNamed("InteractionAttribute", "E1_derived")));
          }),
      );
    },
  );
});
