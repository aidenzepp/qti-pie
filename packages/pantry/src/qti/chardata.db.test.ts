/* oxlint-disable unicorn/text-encoding-identifier-case -- The rows spell the XML encoding labels (`UTF-8`) as crust's reader reports them and `Document` stores them. */
/**
 * The document layer's laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3):
 * each refused state is one the law's model refuses, named by the law it breaks.
 *
 * A row whose own laws are row CHECKs is written through the author role (`db.apply`), and the
 * outcome is `invariant-rejected` with the expected law among its `refused.laws` (membership, since
 * a merged native names several, C22). A row that breaks a deferred foreign key, or whose
 * acceptance by its own laws alone is the contract, is written by a direct SQL writer (grizzle's
 * README, "Direct SQL access"): the author login, `SET ROLE` to the author role, at SERIALIZABLE,
 * the row inserted into its table with every column a writer fills, its foreign keys deferred and
 * then the one under test set immediate, so PostgreSQL's SQLSTATE and the constraint it names are
 * the verdict, and the transaction rolls back. A role writes a table, never its own view of it,
 * which it holds SELECT on alone (README, "Security model").
 *
 * Every case writes rows no stored node names, so none needs a document on the lease. The cases
 * over a stored tree (a node of an arm's kind without its arm row, a prefix declared twice on one
 * element, a namespace family's gap and count, and the text, whitespace and entity reference
 * checks on `Node`) need a whole valid package written first, and arrive with the importer (Q5.15).
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { Fact } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Client, DatabaseError } from "pg";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { Flag, KindByNameUnder, KindNamespace, TypeAvailable } from "#pantry/grammar/install.ts";
import {
  Comment,
  Doctype,
  Document,
  EncodingDecl,
  OpenElementName,
  OpenElementType,
  Pi,
  SdDecl,
} from "#pantry/qti/chardata.ts";
import { governorOf } from "#pantry/import/fold.ts";
import { Author, AuthorApp } from "#pantry/qti/own-login.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { bitsText } from "#pantry/test/bits.ts";
import {
  authorRole,
  foreignKeysBetween,
  isServerError,
  judged,
  loginSession,
  qtiSchema,
  rowsOf,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";
import { isUriReference } from "#pantry/test/uri-reference.ts";
import { mathmlNamespace } from "#pantry/vocab/namespaces.ts";

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
 * Each arm and the document row, with a row of it whose node is no stored node, and the table its
 * containment into `Node` is installed on. The document row is the manifest's, lawful on its own
 * CHECKs: the `none` resource type, which only `imsmanifest.xml` bears, by `RootOfType`, no
 * family member yet (each count 0), no site naming it (so its context is the empty set and its
 * nearest context the document node, by `E1_derived`), and its node's copied tuple the document
 * node's. Its XML declaration is rows of their own, and it has none.
 */
const arms: readonly Stated[] = [
  { fact: { node: strayNode, value: "a comment" }, relation: Comment },
  { fact: { data: "", node: strayNode, target: "t" }, relation: Pi },
  { fact: { node: strayNode, value: "<!DOCTYPE r>" }, relation: Doctype },
  {
    fact: {
      assembled: false,
      charset: "UTF-8",
      context: bitsText(Flag, []),
      contextNearest: strayNode,
      contextNearestKind: "document",
      documentType: "manifest",
      exportCharset: "UTF-8",
      node: strayNode,
      nodeChildren: 1n,
      package: strayNode,
      path: manifestPath,
      rootKind: "cp:manifest",
      version: "3.0.1",
    },
    relation: Document,
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
    Partial<Pick<Fact<typeof OpenElementName>, "local">>,
): Fact<typeof OpenElementName> => ({
  document: strayNode,
  local: "e",
  nearest: strayNode,
  node: strayNode,
  parent: strayNode,
  start: 1n,
  version: "3.0.1",
  ...fields,
});

/**
 * A foreign element's type row, its node and its node's tuple stray, its governor the one its type
 * gives its class (`governorOf`), so its `E1_derived` holds.
 *
 * @param fields - The fields the case sets.
 * @param fields.kind - The element's class.
 * @param fields.parentNamespace - Its parent's namespace.
 * @param fields.type - Its governing type's handle.
 * @returns The row.
 */
const foreignType = (fields: {
  readonly kind: Fact<typeof OpenElementType>["kind"];
  readonly parentNamespace: string;
  readonly type: Fact<typeof OpenElementType>["type"];
}): Fact<typeof OpenElementType> => ({
  document: strayNode,
  governor: governorOf("3.0.1", fields.kind, Option.some(fields.type)),
  kind: fields.kind,
  node: strayNode,
  parentNamespace: fields.parentNamespace,
  type: fields.type,
  version: "3.0.1",
});

/**
 * A foreign element's name row as a direct writer sends it, its node and its node's tuple stray,
 * each closed id by its code, with its type row where a type governs it.
 *
 * @param fields - The fields the case sets.
 * @param fields.governs - The governing type's handle, none for an element no type governs.
 * @param fields.kind - The element's class.
 * @param fields.local - Its local name.
 * @param fields.namespace - Its namespace name.
 * @param fields.parentKind - Its parent's kind.
 * @param fields.parentNamespace - Its parent's namespace, QTI's where none is given.
 * @returns The rows.
 */
const lawfulNameRows = (fields: {
  readonly governs: Option.Option<Fact<typeof OpenElementType>["type"]>;
  readonly kind: Fact<typeof OpenElementName>["kind"];
  readonly local: string;
  readonly namespace: string;
  readonly parentKind: Fact<typeof OpenElementName>["parentKind"];
  readonly parentNamespace?: string;
}): readonly Stated[] => {
  const parentNamespace = fields.parentNamespace ?? asi;

  return [
    {
      fact: {
        document: strayNode,
        kind: fields.kind,
        local: fields.local,
        namespace: fields.namespace,
        nearest: strayNode,
        node: strayNode,
        parent: strayNode,
        parentKind: fields.parentKind,
        parentNamespace,
        start: 1n,
        version: "3.0.1",
      },
      relation: OpenElementName,
    },
    ...Option.toArray(
      fields.governs.pipe(
        Option.map((type): Stated => ({
          fact: foreignType({ kind: fields.kind, parentNamespace, type }),
          relation: OpenElementType,
        })),
      ),
    ),
  ];
};

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
            for (const arm of arms) {
              const inserts = statedInserts([arm]);
              const table = inserts[0]?.table ?? "";
              const keys = yield* foreignKeysBetween(client, table, "node");
              assert.isNotEmpty(keys, `${table} references node`);

              const refused = Option.getOrUndefined(yield* judged(client, inserts, keys));

              assert.strictEqual(refused?.code, "23503", table);
              assert.include(keys, refused?.constraint, table);
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "accepts the Document row of a document that writes no declaration, by every law of the row itself",
        () =>
          // Oracle: PostgreSQL, the row's domains and CHECKs, with every foreign key deferred and
          // none set immediate.
          // Bound: the manifest's row, of the `none` resource type, with no declaration's rows.
          Effect.gen(function* undeclared() {
            const client = yield* loginSession;
            const document = arms.find(({ relation }) => relation === Document);
            assert.isDefined(document);

            const refused = Option.getOrUndefined(yield* judged(client, statedInserts([document])));

            assert.isUndefined(refused, refused?.message);
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses an encoding or a standalone with no declaration, by the Document law's containments into XmlDecl",
        () =>
          // Oracle: PostgreSQL, the containments `EncodingDecl(node) ⊆ XmlDecl(node)` and
          // `SdDecl(node) ⊆ XmlDecl(node)`: neither part is written outside a declaration (XML 1.0
          // §2.8, `XMLDecl ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'`).
          // Bound: each part's row alone, on a node with no XmlDecl row.
          Effect.gen(function* partWithoutDeclaration() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const parts = [
              {
                changes: ChangeSet.empty(Author).insert(EncodingDecl, [
                  { encoding: "UTF-8", node: strayNode },
                ]),
                relation: "EncodingDecl",
              },
              {
                changes: ChangeSet.empty(Author).insert(SdDecl, [
                  { node: strayNode, standalone: "yes" },
                ]),
                relation: "SdDecl",
              },
            ] as const;
            for (const { changes, relation } of parts) {
              const outcome = yield* db.apply(changes, {});

              assert.strictEqual(outcome.kind, "invariant-rejected", relation);
              assert.isTrue(
                outcome.kind === "invariant-rejected" &&
                  outcome.refused.laws.some(
                    (law) =>
                      law.kind === "contained" &&
                      law.from.relation === relation &&
                      law.to.relation === "XmlDecl",
                  ),
                relation,
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
                  outcome.refused.laws.some(
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
                  outcome.refused.laws.some(
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
              ChangeSet.empty(Author).insert(OpenElementType, [
                foreignType({
                  kind: "foreign-element",
                  parentNamespace: asi,
                  type: otherSetType,
                }),
              ]),
              {},
            );

            assert.strictEqual(outcome.kind, "invariant-rejected");
            assert.isTrue(
              outcome.kind === "invariant-rejected" &&
                outcome.refused.laws.some(
                  (law) =>
                    law.kind === "check" &&
                    law.relation === "OpenElementType" &&
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
            const client = yield* loginSession;
            const keys = yield* foreignKeysBetween(
              client,
              "open_element_name",
              "open_element_type",
            );
            assert.isNotEmpty(keys, "open_element_name references open_element_type");
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
              const refused = Option.getOrUndefined(
                yield* judged(
                  client,
                  statedInserts([{ fact: row, relation: OpenElementName }]),
                  keys,
                ),
              );

              assert.strictEqual(refused?.code, "23503", row.local);
              assert.include(keys, refused?.constraint, row.local);
            }
          }).pipe(Effect.scoped),
      );

      it.effect(
        "accepts qti-ordering's QTI-named and no-namespace elements, an xs: type or none, a typed element under a strict slot and a root its set declares there, by every law of the rows themselves",
        () =>
          // Oracle: PostgreSQL, the row's domains and CHECKs (`Foreign_element_class`,
          // `OpenElementName_canonical`, `XsiType_available` and `MathML_foreign_element`), with
          // every foreign key deferred and none set immediate: upstream's spec reading 61 admits
          // each in `qti-ordering`'s slot.
          // Bound: `qti-variable` in QTI's namespace and `foo` in none under `qti-ordering`, each
          // governed by no type; a foreign element under `qti-selection` governed by `xs:string`;
          // one under a foreign parent governed by a content-packaging type, which stands since its
          // parent's namespace is no vocabulary's (reading 81's recorded limit); and `cp:manifest`
          // under `drd:accessForAllResource`'s strict slot with no type, a root its set declares
          // (C13, `HeldRootsUnder`); and one under `qti-companion-materials-info`'s strict slot
          // governed by `xs:string`, which assesses it (reading 60).
          Effect.gen(function* lawful() {
            const client = yield* loginSession;
            for (const row of [
              lawfulNameRows({
                governs: Option.none(),
                kind: "own-namespace-element",
                local: "qti-variable",
                namespace: asi,
                parentKind: "qti-ordering",
              }),
              lawfulNameRows({
                governs: Option.none(),
                kind: "no-namespace-element",
                local: "foo",
                namespace: "",
                parentKind: "qti-ordering",
              }),
              lawfulNameRows({
                governs: Option.some("xs:string"),
                kind: "foreign-element",
                local: "x",
                namespace: "urn:example:f",
                parentKind: "qti-selection",
              }),
              lawfulNameRows({
                governs: Option.some(otherSetType),
                kind: "foreign-element",
                local: "x",
                namespace: "urn:example:f",
                parentKind: "foreign-element",
                parentNamespace: "urn:example:p",
              }),
              lawfulNameRows({
                governs: Option.some("xs:string"),
                kind: "foreign-element",
                local: "x",
                namespace: "urn:example:f",
                parentKind: "qti-companion-materials-info",
              }),
              lawfulNameRows({
                governs: Option.none(),
                kind: "foreign-element",
                local: "manifest",
                namespace: namespaceOf("cp:manifest"),
                parentKind: "drd:accessForAllResource",
                parentNamespace: namespaceOf("drd:accessForAllResource"),
              }),
            ]) {
              const refused = Option.getOrUndefined(yield* judged(client, statedInserts(row)));

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
                  outcome.refused.laws.some(
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
