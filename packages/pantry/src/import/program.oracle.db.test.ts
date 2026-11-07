/**
 * The import on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): each accepted
 * package commits whole in one transaction, and each refused one is refused under the law its one
 * edit breaks (membership in the outcome's `refused.laws`, since one native object may discharge
 * several, C22). Written to run at N1 on the lease and restated in the network seat's probe, never
 * by a hand.
 *
 * The cases over a whole package that the slices left to the importer (their reports, and the
 * orchestrator's lists of 2026-11-06) run through one helper: a valid package, one edit, the
 * apply. An edit is either of the package's text ({@link editedSimple}, a fixture spec over
 * `simple`), which the reader and the codec read like any package, or of one row of its inputs
 * before the ChangeSet is built ({@link applyEdited}), which writes a state no valid document
 * shreds to but every written type admits. A corruption no written type admits (a gap in a
 * family's slots, a wrong count, a junk accumulator) cannot be written through the API at all;
 * those are the slices' direct-SQL cases.
 *
 * Each case also logs how long `db.compile` takes over its ChangeSet (the W5 amendment's C19), the
 * compile time per package the network seat reports.
 */
import { CommitUnknown, Db, query, uuid, v } from "@bjornpagen/grizzle";
import type { ApplyOutcome, DbConnection, Law, Plan } from "@bjornpagen/grizzle";
import { NodeFileSystem, NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Duration, Effect, Formatter, Layer, Option, Redacted, Result } from "effect";
import { Client } from "pg";
import type { QueryResultRow } from "pg";
import { describe, inject } from "vitest";
import { loginConnection } from "#pantry/db/connection.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { readProgram } from "#pantry/import/program.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import type { NodeMember, NodeRoot, PackageInputs } from "#pantry/import/write.ts";
import { readPackage } from "#pantry/package/read.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Package } from "#pantry/qti/package.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { Author } from "#pantry/qti/roles.ts";
import { materialize, materializeSpec, specOf } from "#pantry/test/fixtures.ts";
import type { FixtureName, TextEdit } from "#pantry/test/fixtures.ts";
import { materializeProcessing, processingFixtureNames } from "#pantry/test/processing-fixtures.ts";
import { processingVerdicts } from "#pantry/test/processing-verdicts.ts";
import { oracleLocate } from "#pantry/test/locate.ts";
import { judge, lawsOf, verdictOf } from "#pantry/test/oracle.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

const fixtures = inject("fixtures");

/**
 * The author login's PostgreSQL role, `<schema>__<login>`.
 */
const authorAppRole = "qti__author_app";

/**
 * The PostgreSQL schema of `Qti`'s tables.
 */
const qtiSchema = "qti";

/**
 * The table grizzle's migrations record themselves in, one per installation, beside `Qti`'s own.
 */
const ledgerTable = "__ledger";

/**
 * The trigger grizzle installs on each table of an installation, ledger included, that refuses a
 * write below SERIALIZABLE (`__require_serializable`, `01-setup.sql` of `migrations/qti`).
 */
const isolationTrigger = "__isolation";

/**
 * The tarball member `simple` is extracted from.
 */
const simpleMember = "qtiv3-examples/packaging/simple/simple.zip";

/**
 * `simple`'s manifest identifier, which a resource may not share (P4).
 */
const manifestIdentifier = "MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390";

/**
 * The accepted corpus packages (`verdicts/qti-examples-0a92fbb.tsv`), by name.
 */
const acceptedPackages = Effect.all({
  sharedMedia: materialize("sharedMedia"),
  simple: Effect.succeed(fixtures.simple),
  svg: materializeSpec({ edits: [], member: "qtiv3-examples/packaging/svg/svg.zip", name: "svg" }),
});

/**
 * `simple` with edits of its text, materialized once under its own name.
 *
 * @param name - The fixture's name.
 * @param edits - The edits, each a replacement of one occurrence in one file.
 * @returns The package's directory.
 */
const editedSimple = (name: string, edits: readonly TextEdit[]) =>
  materializeSpec({ edits, member: simpleMember, name: `q5.15-${name}` });

/**
 * Insert declarations into `simple`'s item after its response declaration, which content order
 * admits there.
 *
 * @param markup - The declarations.
 * @returns The edit.
 */
const afterResponse = (markup: string): TextEdit => ({
  _tag: "ReplaceText",
  file: "choice.xml",
  replacement: `</qti-response-declaration>${markup}`,
  search: "</qti-response-declaration>",
});

/**
 * Insert declarations into `simple`'s item after its outcome declaration.
 *
 * @param markup - The declarations.
 * @returns The edit.
 */
const afterOutcome = (markup: string): TextEdit => ({
  _tag: "ReplaceText",
  file: "choice.xml",
  replacement: `</qti-outcome-declaration>${markup}`,
  search: "</qti-outcome-declaration>",
});

/**
 * Insert a resource into `simple`'s manifest before its first.
 *
 * @param markup - The resource.
 * @returns The edit.
 */
const resourceBefore = (markup: string): TextEdit => ({
  _tag: "ReplaceText",
  file: "imsmanifest.xml",
  replacement: `<resources>${markup}`,
  search: "<resources>",
});

/**
 * Pick a check of one relation by its name.
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
 * Pick a key by its relation and the fields it reads, in order.
 *
 * @param relation - The relation.
 * @param fields - The key's fields.
 * @returns The predicate.
 */
const keyOn =
  (relation: string, ...fields: readonly string[]) =>
  (law: Law): boolean =>
    law.kind === "key" &&
    law.side.relation === relation &&
    law.side.terms.map((term) => term.field).join(" ") === fields.join(" ");

/**
 * Whether an outcome is `invariant-rejected` with a law among its `refused.laws` one of the
 * predicates picks.
 *
 * @param outcome - The apply's outcome.
 * @param picks - The laws the case may be refused under.
 * @returns Whether it is.
 */
const rejectedBy = (
  outcome: ApplyOutcome<unknown>,
  picks: readonly ((law: Law) => boolean)[],
): boolean =>
  outcome.kind === "invariant-rejected" &&
  outcome.refused.laws.some((law) => picks.some((pick) => pick(law)));

/**
 * The number of packages stored, through a query that counts each by its key.
 */
const packagesCounted = query(Author).rule((r) => {
  const { id } = v(Package, "package");

  return r.match(Package, { id }).find({ total: r.count() });
});

/**
 * A package stored by its id.
 */
const packageById = query(Author).rule((r) => {
  const { id } = v(Package, "package");

  return r
    .match(Package, { id })
    .where(r.eq(id, r.param("id", uuid)))
    .find({ id });
});

/**
 * Count the packages stored.
 */
const storedPackages = Effect.gen(function* storedPackages() {
  const db = yield* Db.open(AuthorApp.roles.author, {});
  const rows = yield* (yield* db.execute(packagesCounted, {})).collect;

  return rows[0]?.total ?? 0n;
});

/**
 * Build a package's ChangeSet with one edit of its inputs, and apply it, logging the compile time
 * of the ChangeSet and the apply's.
 *
 * @param dir - The valid package.
 * @param edit - The edit of its inputs; none applies the package as read.
 * @returns The package's id and the apply's outcome.
 */
const applyEdited = (
  dir: string,
  edit: (inputs: PackageInputs) => PackageInputs = (held) => held,
) =>
  Effect.gen(function* appliesEdited() {
    const program = yield* readProgram(dir);
    const changes = changeSetOf(Author, edit(program.inputs));
    const db = yield* Db.open(AuthorApp.roles.author, {});
    const [compiled] = yield* Effect.scoped(Effect.timed(db.compile(changes)));
    const [applied, outcome] = yield* Effect.timed(db.apply(changes, {}));

    yield* Effect.log("import compile and apply", {
      applyMillis: Duration.toMillis(applied),
      compileMillis: Duration.toMillis(compiled),
      dir,
    });

    return { outcome, packageId: program.packageId };
  });

/**
 * Hold PostgreSQL to a verdict on a package: an accepted one commits, and a refused one is
 * refused under its rule.
 *
 * @param name - The package's name, for the assertions' messages.
 * @param dir - The package.
 * @param verdict - The verdict it is held to.
 * @returns Nothing, once PostgreSQL's verdict is the one given.
 */
const holdsVerdict = (
  name: string,
  dir: string,
  verdict:
    | { readonly verdict: "accepted" }
    | { readonly rule: string; readonly verdict: "refused" },
) =>
  Effect.gen(function* heldToVerdict() {
    if (verdict.verdict === "accepted") {
      const { outcome } = yield* applyEdited(dir);

      assert.strictEqual(outcome.kind, "accepted", `${name}: ${Formatter.format(outcome)}`);

      return;
    }

    const refused = yield* Effect.flip(importPackage(dir));

    assert.strictEqual(
      refused instanceof ImportRefused ? refused.rule : refused._tag,
      verdict.rule,
      name,
    );
  });

/**
 * A document's tree after one node of it is replaced, and whether one was.
 */
interface Replaced {
  readonly done: boolean;
  readonly root: NodeRoot;
}

/**
 * Replace each node of a document's tree that a predicate picks, the first of them only, through
 * its nesting.
 *
 * @param root - The document node.
 * @param picks - Picks the node to replace.
 * @param replace - Its replacement.
 * @returns The tree with the node replaced, and whether one was.
 */
const replaceFirst = (
  root: NodeRoot,
  picks: (node: NodeMember) => boolean,
  replace: (node: NodeMember) => NodeMember,
): Replaced => {
  let done = false;
  const walk = (node: NodeMember): NodeMember => {
    if (!done && picks(node)) {
      done = true;

      return replace(node);
    }

    return { ...node, children: node.children.map(walk) };
  };
  const children = root.children.map(walk);

  return { done, root: { ...root, children } };
};

/**
 * Edit the first node any document's tree holds that a predicate picks.
 *
 * @param picks - Picks the node.
 * @param replace - Its replacement.
 * @returns The edit of a package's inputs; a test failure when no tree holds such a node.
 */
const editNode =
  (picks: (node: NodeMember) => boolean, replace: (node: NodeMember) => NodeMember) =>
  (inputs: PackageInputs): PackageInputs => {
    for (const [id, root] of inputs.Node) {
      const edited = replaceFirst(root, picks, replace);
      if (edited.done) {
        return { ...inputs, Node: new Map([...inputs.Node, [id, edited.root]]) };
      }
    }

    return assert.fail("no tree of the package holds the node the case edits");
  };

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
 * with its scope: a direct reader of the catalog.
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
 * @returns The rows.
 */
const rowsOf = <R extends QueryResultRow>(
  client: Client,
  text: string,
  values: readonly string[] = [],
) =>
  Effect.tryPromise(() => client.query<R>(text, [...values])).pipe(Effect.map(({ rows }) => rows));

/**
 * Every node of a plan tree, the plan itself first.
 *
 * @param plan - The plan.
 * @returns Its nodes' names.
 */
const planNodes = (plan: Plan): readonly string[] => [
  plan.node,
  ...plan.children.flatMap(planNodes),
];

/**
 * Insert markup into `simple`'s item body before its choice interaction, where flow content stands.
 *
 * @param markup - The markup.
 * @returns The edit.
 */
const inBody = (markup: string): TextEdit => ({
  _tag: "ReplaceText",
  file: "choice.xml",
  replacement: `${markup}<qti-choice-interaction`,
  search: "<qti-choice-interaction",
});

/**
 * The metadata fixtures and the verdicts Q5.12 states for them: the rules each may be refused
 * under, none for an accepted one.
 */
const metadataVerdicts: readonly (readonly [FixtureName, readonly string[]])[] = [
  ["identifier-mismatch", ["lom-identifier"]],
  ["title-mismatch", ["lom-title"]],
  ["usage3", []],
  ["usage3-typed", []],
  ["usage3-padded", []],
  ["usage3-float-padded", []],
  ["usage3-feb-30", ["attribute-lexical"]],
  ["usage3-integer-float", ["typed-copy"]],
];

describe.skipIf(!hasLease)(
  "import/program.oracle.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("one ChangeSet per package, judged by PostgreSQL", (it) => {
      it.effect(
        "accepts simple, sharedMedia and svg whole, each in one apply, logging the compile time",
        () =>
          // Oracle: PostgreSQL, every law of the schema over each accepted corpus package
          // (Q5.03's "accepted through grizzle", for the whole package), and the package read
          // back by its id.
          Effect.gen(function* acceptsCorpus() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            for (const [name, dir] of Object.entries(yield* acceptedPackages)) {
              const { outcome, packageId } = yield* applyEdited(dir);

              assert.strictEqual(outcome.kind, "accepted", name);
              assert.lengthOf(
                yield* (yield* db.execute(packageById, { id: packageId })).collect,
                1,
                name,
              );
            }
          }),
      );

      it.effect("imports one package twice as two packages, every id fresh, both accepted", () =>
        // Oracle: the specification as a checker, the brief's "the same package imported twice is
        // two packages, with fresh ids each time": both imports are accepted and the count of
        // packages grows by two.
        Effect.gen(function* twice() {
          const before = yield* storedPackages;
          const first = yield* importPackage(fixtures.simple, { locate: oracleLocate });
          const second = yield* importPackage(fixtures.simple, { locate: oracleLocate });

          assert.notStrictEqual(first, second);
          assert.strictEqual(yield* storedPackages, before + 2n);
        }),
      );

      it.effect("leaves no row when a failure is injected in place of the apply", () =>
        // Oracle: the specification as a checker, one transaction per package and `CommitUnknown`'s
        // resolution: an apply that never ran commits nothing, the read-back finds no package, and
        // the import fails with the injected failure while the count of packages is unchanged.
        Effect.gen(function* noRow() {
          const before = yield* storedPackages;
          const failed = yield* Effect.flip(
            importPackage(fixtures.simple, { wrapApply: () => Effect.fail(new CommitUnknown()) }),
          );

          assert.strictEqual(failed._tag, "CommitUnknown");
          assert.strictEqual(yield* storedPackages, before);
        }),
      );

      it.effect("plans no recursion, and its only triggers are grizzle's isolation guards", () =>
        // Oracle: PostgreSQL's own planner and catalog. No statement of an accepted package's
        // ChangeSet plans a recursive union or a work-table scan (`db.explain`, estimate only). The
        // user triggers (`pg_trigger.tgisinternal` false, so the foreign keys' own triggers are not
        // counted) on the installation's tables and its roles' views are exactly grizzle's
        // `__isolation`, which refuses a write below SERIALIZABLE, once on each table: a table per
        // stored relation of `Qti` and grizzle's migration ledger. Qti installs none of its own.
        Effect.gen(function* planAudit() {
          const db = yield* Db.open(AuthorApp.roles.author, {});
          for (const dir of Object.values(yield* acceptedPackages)) {
            const program = yield* readProgram(dir);
            const plans = yield* db.explain(changeSetOf(Author, program.inputs), {});
            const nodes = plans.flatMap(planNodes);

            assert.isAbove(plans.length, 0, dir);
            assert.notInclude(nodes, "Recursive Union", dir);
            assert.notInclude(nodes, "WorkTable Scan", dir);
          }

          const client = yield* loginSession;
          const tables = yield* rowsOf<{ readonly relname: string }>(
            client,
            `SELECT c.relname FROM pg_catalog.pg_class c
               JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = $1 AND c.relkind = 'r'`,
            [qtiSchema],
          );
          const triggers = yield* rowsOf<{
            readonly nspname: string;
            readonly relname: string;
            readonly tgname: string;
          }>(
            client,
            `SELECT n.nspname, c.relname, t.tgname FROM pg_catalog.pg_trigger t
               JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
               JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
              WHERE (n.nspname = $1 OR n.nspname LIKE $2) AND NOT t.tgisinternal`,
            [qtiSchema, `${qtiSchema}\\_\\_%`],
          );
          const stored = Object.values(Qti.relations).filter(({ kind }) => kind === "relation");

          assert.strictEqual(
            tables.length,
            stored.length + 1,
            "a table per stored relation, and the ledger",
          );
          assert.include(
            tables.map(({ relname }) => relname),
            ledgerTable,
          );
          assert.deepStrictEqual(
            triggers
              .map(({ nspname, relname, tgname }) => `${nspname}.${relname} ${tgname}`)
              .toSorted(),
            tables.map(({ relname }) => `${qtiSchema}.${relname} ${isolationTrigger}`).toSorted(),
          );
        }).pipe(Effect.scoped),
      );

      it.effect("accepts a string mapping keyed York and york", () =>
        // Oracle: PostgreSQL, Q5.11's `map-key-unique` over a string mapping: keys compare as
        // written, so two keys of different case are two keys.
        Effect.gen(function* yorkKeys() {
          const dir = yield* editedSimple("york-keys", [
            afterResponse(
              `<qti-response-declaration identifier="CITY" cardinality="single" base-type="string"><qti-mapping default-value="0"><qti-map-entry map-key="York" mapped-value="1"/><qti-map-entry map-key="york" mapped-value="2"/></qti-mapping></qti-response-declaration>`,
            ),
          ]);
          const { outcome } = yield* applyEdited(dir);

          assert.strictEqual(outcome.kind, "accepted");
        }),
      );

      it.effect(
        "accepts an item whose digital material, calculator info and printed variable carry labels and whose root names no tool, and refuses it once a paragraph carries one, as the law oracle judges both (label-tool, reading 128)",
        () =>
          // Oracle: the law oracle's verdict on the same package (`judge`), and the information
          // model's label characteristics behind both: an ItemFileInfo's label (§5.80.2) and a
          // printed variable's (§7.30.4) ask for no tool, a paragraph's (§5.16.5) does. PostgreSQL
          // judges them through LabelUse's two containments with the selected labels and Label
          // tools' containment of an item's labels in its root's tool-name.
          // Bound: simple with the three labels that ask for nothing, then with a labelled paragraph
          // beside them.
          Effect.gen(function* labelCharacteristics() {
            const grammar = Result.getOrThrow(composed());
            const laws = lawsOf(grammar);
            const readers = `<qti-companion-materials-info><qti-calculator><qti-calculator-type>basic</qti-calculator-type><qti-description>A calculator</qti-description><qti-calculator-info label="calculator"><qti-file-href>https://example.org/calculator.html</qti-file-href></qti-calculator-info></qti-calculator><qti-digital-material label="table"><qti-file-href>https://example.org/table.html</qti-file-href></qti-digital-material></qti-companion-materials-info><qti-item-body><p>Score: <qti-printed-variable identifier="SCORE" label="score"/></p>`;
            for (const [name, body, accepted] of [
              ["label-readers", readers, true],
              ["label-readers-body", `${readers}<p label="paragraph">Labelled</p>`, false],
            ] as const) {
              const dir = yield* editedSimple(name, [
                {
                  _tag: "ReplaceText",
                  file: "choice.xml",
                  replacement: body,
                  search: "<qti-item-body>",
                },
              ]);
              const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
              const { outcome } = yield* applyEdited(dir);

              assert.strictEqual(
                judgment._tag === "Judged" && judgment.breaches.length === 0,
                accepted,
                `${name}: the oracle's verdict`,
              );
              if (accepted) {
                assert.strictEqual(
                  outcome.kind,
                  "accepted",
                  `${name}: ${Formatter.format(outcome)}`,
                );
              } else {
                assert.isTrue(
                  judgment._tag === "Judged" &&
                    judgment.breaches.every(({ law }) => law === "Label tools"),
                  `${name}: the oracle's breaches are Label tools'`,
                );
                assert.isTrue(
                  rejectedBy(outcome, [containedIn("LabelUse", "Attribute")]),
                  `${name}: ${Formatter.format(outcome)}`,
                );
              }
            }
          }),
      );

      it.effect(
        "accepts a test whose section holds a rubric block and no part, as the law oracle judges it (spec reading 26)",
        () =>
          // Oracle: the law oracle's verdict on the same package (`judge`), and the information
          // model's §4.2.15 behind both: a section's sectionPart is [0..unbounded], as both XSDs'
          // minOccurs="0" are, so no law counts a section's parts but reading 79's selection.
          // Bound: test-linear with one more section in its test part, of a rubric block alone.
          Effect.gen(function* emptySection() {
            const grammar = Result.getOrThrow(composed());
            const linear = specOf("test-linear");
            const dir = yield* materializeSpec({
              ...linear,
              edits: [
                ...linear.edits,
                {
                  _tag: "ReplaceText",
                  file: "rtest13.xml",
                  replacement: `<qti-assessment-section identifier="bare" title="Bare" visible="true"><qti-rubric-block view="candidate" use="instructions"><qti-content-body><p>Only a rubric</p></qti-content-body></qti-rubric-block></qti-assessment-section></qti-test-part>`,
                  search: "    </qti-test-part>",
                },
              ],
              name: "empty-section",
            });
            const judgment = yield* judge(yield* readPackage(dir), grammar, lawsOf(grammar));
            const { outcome } = yield* applyEdited(dir);

            assert.isTrue(
              judgment._tag === "Judged" && judgment.breaches.length === 0,
              "the oracle's verdict",
            );
            assert.strictEqual(outcome.kind, "accepted", Formatter.format(outcome));
          }),
      );

      const cases = [
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("mapping-file", [
                afterResponse(
                  `<qti-response-declaration identifier="UPLOAD" cardinality="single" base-type="file"><qti-mapping default-value="0"><qti-map-entry map-key="a" mapped-value="1"/></qti-mapping></qti-response-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [containedIn("Mapping", "MappableBaseType")],
          name: "a mapping on a file response (mapping-base-type, Q5.11)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("mapping-record", [
                afterResponse(
                  `<qti-response-declaration identifier="REC" cardinality="record"><qti-mapping default-value="0"><qti-map-entry map-key="a" mapped-value="1"/></qti-mapping></qti-response-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [containedIn("Mapping", "MappableBaseType")],
          name: "a mapping on a record response (mapping-base-type, Q5.11)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("mapping-integer-keys", [
                afterResponse(
                  `<qti-response-declaration identifier="INT" cardinality="single" base-type="integer"><qti-mapping default-value="0"><qti-map-entry map-key="1" mapped-value="1"/><qti-map-entry map-key="01" mapped-value="2"/></qti-mapping></qti-response-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [keyOn("MapKeyInteger", "mapping", "value")],
          name: "an integer mapping keyed 1 and 01 (map-key-unique, Q5.11)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("mapping-float-keys", [
                afterResponse(
                  `<qti-response-declaration identifier="FLT" cardinality="single" base-type="float"><qti-mapping default-value="0"><qti-map-entry map-key="1" mapped-value="1"/><qti-map-entry map-key="1.0" mapped-value="2"/></qti-mapping></qti-response-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [keyOn("MapKeyFloat", "mapping", "value")],
          name: "a float mapping keyed 1 and 1.0 (map-key-unique, Q5.11)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("mapping-repeated-entry", [
                afterResponse(
                  `<qti-response-declaration identifier="TWICE" cardinality="single" base-type="identifier"><qti-mapping default-value="0"><qti-map-entry map-key="a" mapped-value="1"/><qti-map-entry map-key="a" mapped-value="1"/></qti-mapping></qti-response-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [keyOn("MapKey", "mapping", "folded", "matched")],
          name: "two identical map entries (map-key-unique, Q5.11)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("area-mapping-pair", [
                afterResponse(
                  `<qti-response-declaration identifier="AREA" cardinality="single" base-type="pair"><qti-area-mapping default-value="0"><qti-area-map-entry shape="circle" coords="1,1,1" mapped-value="1"/></qti-area-mapping></qti-response-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [checkNamed("AreaMapping", "AreaMapping_base_type")],
          name: "an area mapping on a pair response (mapping-base-type, Q5.11)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("match-table-multiple", [
                afterOutcome(
                  `<qti-outcome-declaration identifier="TABLE" cardinality="multiple" base-type="integer"><qti-match-table default-value="0"><qti-match-table-entry source-value="1" target-value="1"/></qti-match-table></qti-outcome-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [checkNamed("MatchTable", "Lookup_table_cardinality")],
          name: "a match table on a multiple-cardinality outcome (lookup-cardinality, Q5.11)",
        },
        {
          // P2's (resource type, root kind) containment into RootOfType (`qti/package.ts`
          // packageLaws): of the statements named RootOfType, the one this edit breaks, and the
          // oracle's one breach.
          apply: () =>
            Effect.flatMap(
              editedSimple("stimulus-root", [
                {
                  _tag: "ReplaceText",
                  file: "imsmanifest.xml",
                  replacement: `type="imsqti_stimulus_xmlv3p0" href="choice.xml"`,
                  search: `type="imsqti_item_xmlv3p0" href="choice.xml"`,
                },
              ]),
              (dir) =>
                Effect.gen(function* oneLawBroken() {
                  const grammar = Result.getOrThrow(composed());
                  const judgment = yield* judge(yield* readPackage(dir), grammar, lawsOf(grammar));

                  assert.deepStrictEqual(
                    judgment._tag === "Judged" ? judgment.breaches.map(({ law }) => law) : judgment,
                    ["RootOfType"],
                    "the oracle finds RootOfType alone broken",
                  );

                  return yield* applyEdited(dir);
                }),
            ),
          laws: [containedIn("Document", "RootOfType")],
          name: "an item named as a stimulus, a root its resource type does not name (root-type-reverse, Q5.06)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("unlisted-href", [
                resourceBefore(
                  `<resource identifier="extra" type="webcontent" href="choice.xml"><file href="images/sign.png"/></resource>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [containedIn("ResourceHref", "ResourceFile")],
          name: "a resource href its own files do not list (href-listed, Q5.06)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("missing-entry", [
                resourceBefore(
                  `<resource identifier="ghost" type="imsqti_item_xmlv3p0" href="ghost.xml"><file href="ghost.xml"/></resource>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [
            containedIn("ResourceHref", "Entry"),
            containedIn("ResourceHref", "Document"),
            containedIn("FileHref", "Entry"),
            containedIn("File", "Entry"),
          ],
          name: "a document href no entry holds (entry-kind, Q5.06)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("shared-identifier", [
                {
                  _tag: "ReplaceText",
                  file: "imsmanifest.xml",
                  replacement: `identifier="${manifestIdentifier}" type="imsqti_item_xmlv3p0"`,
                  search: `identifier="choice" type="imsqti_item_xmlv3p0"`,
                },
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [checkNamed("Resource", "Manifest_id_space"), keyOn("IdBinding", "document", "id")],
          name: "a resource sharing its manifest's identifier (manifest-id-space, Q5.06)",
        },
        {
          apply: () =>
            acceptedPackages.pipe(
              Effect.flatMap(({ svg }) =>
                applyEdited(svg, (inputs) => ({
                  ...inputs,
                  Comment: new Map([...inputs.Comment].slice(1)),
                })),
              ),
            ),
          laws: [containedIn("Node", "Comment")],
          name: "a comment node with no Comment row (the comment arm, Q5.04)",
        },
        {
          apply: () =>
            applyEdited(
              fixtures.simple,
              editNode(
                (node) => node.namespaces.length > 0,
                (node) => ({
                  ...node,
                  namespaces: [...node.namespaces, ...node.namespaces.slice(0, 1)],
                }),
              ),
            ),
          laws: [keyOn("Namespace", "node", "prefix")],
          name: "one prefix declared twice on an element (Namespace family, Q5.04)",
        },
        {
          apply: () =>
            applyEdited(
              fixtures.simple,
              // The item body's first paragraph's text, which no text domain holds, so the text
              // arm alone refuses it: the manifest's first text, cp:schema's, is TextDomain's first.
              editNode(
                (node) => node.kind === "text" && node.chars === "Look at the text in the picture.",
                (node) => ({
                  ...node,
                  chars: " ",
                  first: " ",
                  last: " ",
                  stringPiece: node.stringPiece === "" ? "" : " ",
                }),
              ),
            ),
          laws: [checkNamed("Node", "text_arm")],
          name: "a text node of whitespace alone (the text arm, Q5.04)",
        },
        {
          apply: () =>
            applyEdited(
              fixtures.simple,
              editNode(
                (node) => node.kind === "ws",
                (node) => ({
                  ...node,
                  chars: "x",
                  first: "x",
                  last: "x",
                  stringPiece: node.stringPiece === "" ? "" : "x",
                }),
              ),
            ),
          laws: [checkNamed("Node", "ws_arm")],
          name: "a whitespace node holding a letter (the ws arm, Q5.04)",
        },
        {
          apply: () =>
            applyEdited(
              fixtures.simple,
              editNode(
                (node) => node.kind === "qti-assessment-item",
                (node) => ({
                  ...node,
                  attributes: node.attributes.filter(({ name }) => name !== "identifier"),
                }),
              ),
            ),
          laws: [checkNamed("Node", "AL3_required")],
          name: "an item without its required identifier (AL3, Q5.05)",
        },
        {
          apply: () =>
            applyEdited(
              fixtures.simple,
              editNode(
                (node) => node.kind === "cp:schemaversion",
                (node) => ({
                  ...node,
                  children: node.children.map((child) =>
                    child.kind === "text"
                      ? { ...child, chars: "3.0.x", first: "3", last: "x", stringPiece: "3.0.x" }
                      : child,
                  ),
                }),
              ),
            ),
          laws: [checkNamed("Node", "TextDomain")],
          name: "a schema version outside its text domain (TextDomain, Q5.05)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("mapping-pair-keys", [
                afterResponse(
                  `<qti-response-declaration identifier="PAIR" cardinality="single" base-type="pair"><qti-mapping default-value="0"><qti-map-entry map-key="A B" mapped-value="1"/><qti-map-entry map-key="B A" mapped-value="2"/></qti-mapping></qti-response-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [keyOn("MapKeyPair", "mapping", "value")],
          name: "a pair mapping keyed A B and B A (map-key-unique, Q5.11)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("mapping-point-keys", [
                afterResponse(
                  `<qti-response-declaration identifier="POINT" cardinality="single" base-type="point"><qti-mapping default-value="0"><qti-map-entry map-key="1 2" mapped-value="1"/><qti-map-entry map-key="01 +2" mapped-value="2"/></qti-mapping></qti-response-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [keyOn("MapKeyPoint", "mapping", "value")],
          name: "a point mapping keyed 1 2 and 01 +2 (map-key-unique, Q5.11)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("mapping-integer-word", [
                afterResponse(
                  `<qti-response-declaration identifier="WORD" cardinality="single" base-type="integer"><qti-mapping default-value="0"><qti-map-entry map-key="abc" mapped-value="1"/></qti-mapping></qti-response-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [checkNamed("MapKey", "Typed_attribute_value")],
          name: "an integer mapping keyed abc (Typed attribute value, Q5.11)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("match-table-target", [
                afterOutcome(
                  `<qti-outcome-declaration identifier="LOOK" cardinality="single" base-type="integer"><qti-match-table default-value="0"><qti-match-table-entry source-value="1" target-value="x"/></qti-match-table></qti-outcome-declaration>`,
                ),
              ]),
              (dir) => applyEdited(dir),
            ),
          laws: [checkNamed("LookupValue", "Typed_attribute_value")],
          name: "an integer outcome's match table entry targeting x (Typed attribute value, Q5.11)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("dangling-idref", [inBody(`<p aria-describedby="nowhere">See.</p>`)]),
              (dir) => applyEdited(dir),
            ),
          laws: [containedIn("IdrefTarget", "IdBinding")],
          name: "an IDREF token naming no id of its document (Idref target, Q5.07)",
        },
        {
          apply: () =>
            Effect.flatMap(
              editedSimple("open-name-missing", [inBody(`<p data-note="x">See.</p>`)]),
              (dir) =>
                applyEdited(
                  dir,
                  editNode(
                    (node) => node.attributes.some(({ name }) => name === "data-*"),
                    (node) => ({
                      ...node,
                      attributes: node.attributes.map((attribute) =>
                        attribute.name === "data-*" ? { ...attribute, openName: [] } : attribute,
                      ),
                    }),
                  ),
                ),
            ),
          laws: [checkNamed("Attribute", "AL4_open_names")],
          name: "an open-class attribute without its open name (AL4, Q5.05)",
        },
        {
          apply: () =>
            Effect.flatMap(materialize("sharedMedia"), (dir) =>
              applyEdited(
                dir,
                editNode(
                  (node) => node.attributes.some(({ idrefs }) => idrefs.length > 0),
                  (node) => ({
                    ...node,
                    attributes: node.attributes.map((attribute) => ({ ...attribute, idrefs: [] })),
                  }),
                ),
              ),
            ),
          laws: [checkNamed("Attribute", "E1_derived")],
          name: "an IDREF attribute without its tokens (E1 derived, Q5.05)",
        },
        {
          apply: () =>
            applyEdited(fixtures.simple, (inputs) => ({
              ...inputs,
              Value: new Map([...inputs.Value].slice(1)),
            })),
          laws: [containedIn("Node", "Value")],
          name: "a value with no Value row (Q5.08)",
        },
        {
          apply: () =>
            applyEdited(fixtures.simple, (inputs) => ({
              ...inputs,
              Value: new Map(
                [...inputs.Value].map(([key, row], at) => [
                  key,
                  at === 0 ? { ...row, text: `${row.text}x` } : row,
                ]),
              ),
            })),
          laws: [containedIn("Value", "Node"), containedIn("Node", "Value")],
          name: "a value whose text is not its node's string value (Q5.08)",
        },
      ];

      for (const { apply, laws, name } of cases) {
        it.effect(`refuses ${name}`, () =>
          // Oracle: PostgreSQL, the law the case's one edit breaks, named in the outcome's `refused.laws`.
          Effect.gen(function* refused() {
            const before = yield* storedPackages;
            const { outcome } = yield* apply();

            assert.isTrue(rejectedBy(outcome, laws), `${name}: ${Formatter.format(outcome)}`);
            assert.strictEqual(yield* storedPackages, before);
          }),
        );
      }

      for (const [name, rules] of metadataVerdicts) {
        it.effect(`gives ${name} Q5.12's verdict`, () =>
          // Oracle: PostgreSQL, Q5.12's laws over a whole package (lom-identifier, lom-title, and
          // lastUpdated's value domain) beside every other law, as Q5.12 states each fixture's
          // verdict.
          Effect.gen(function* metadataVerdict() {
            const outcome = yield* Effect.result(importPackage(yield* materialize(name)));

            if (rules.length === 0) {
              assert.isTrue(outcome._tag === "Success", `${name} was refused`);
            } else {
              assert.isTrue(
                outcome._tag === "Failure" &&
                  outcome.failure instanceof ImportRefused &&
                  rules.includes(outcome.failure.rule),
                `${name}: ${outcome._tag === "Failure" ? outcome.failure.message : "accepted"}`,
              );
            }
          }),
        );
      }

      for (const name of processingFixtureNames) {
        it.effect(`gives the processing fixture ${name} its stated verdict`, () =>
          // Oracle: the specification as a checker, the stated verdicts (Q5.10,
          // `processing-verdicts.ts`, which the law oracle predicts with no database): a checker's
          // fixture is refused under its frozen rule, a codec-refused one under the codec's rule, a
          // guard's by AL3, N7's Last or N5's Follow, and an accepted one commits. A package with
          // no frozen row (a round-trip, template or padded package) has no stated verdict, so the
          // law oracle's verdict on it is the one PostgreSQL is held to.
          Effect.gen(function* processingVerdict() {
            const stated = (yield* processingVerdicts)(name);
            const dir = yield* materializeProcessing(name);

            if (Option.isNone(stated)) {
              const grammar = Result.getOrThrow(composed());

              yield* holdsVerdict(
                name,
                dir,
                verdictOf(yield* judge(yield* readPackage(dir), grammar, lawsOf(grammar))),
              );

              return;
            }

            const verdict = stated.value;

            if (verdict.rule === "accepted") {
              yield* holdsVerdict(name, dir, { verdict: "accepted" });

              return;
            }

            if (verdict.source === "guard") {
              const { outcome } = yield* applyEdited(dir);

              assert.isTrue(
                rejectedBy(outcome, [
                  checkNamed("Node", "AL3_required"),
                  checkNamed("Node", "N7_Last"),
                  checkNamed("Node", "N5_Follow"),
                ]),
                `${name}: ${Formatter.format(outcome)}`,
              );

              return;
            }

            yield* holdsVerdict(name, dir, { rule: verdict.rule, verdict: "refused" });
          }),
        );
      }

      it.effect("refuses lti under attribute-lexical, locating the breach through the oracle", () =>
        // Oracle: PostgreSQL, the value domain of cp:resource's type, its 3.0.0 enumeration (spec
        // reading 67), with the importer's refusal: its rule, and the node the oracle finds (Q5.06's
        // case).
        Effect.gen(function* lti() {
          const refused = yield* Effect.flip(importPackage(fixtures.lti, { locate: oracleLocate }));

          assert.instanceOf(refused, ImportRefused);
          assert.strictEqual(
            refused instanceof ImportRefused ? refused.rule : undefined,
            "attribute-lexical",
          );
        }),
      );

      it.effect("reads the package back when the commit's outcome is unknown", () =>
        // Oracle: the specification as a checker, `CommitUnknown`'s resolution: the apply ran and
        // committed, so the package is read back and the import answers its id.
        Effect.gen(function* readsBack() {
          const id = yield* importPackage(fixtures.simple, {
            wrapApply: (apply) => Effect.andThen(apply, Effect.fail(new CommitUnknown())),
          });
          const db = yield* Db.open(AuthorApp.roles.author, {});

          assert.lengthOf(yield* (yield* db.execute(packageById, { id })).collect, 1);
        }),
      );
    });
  },
);
