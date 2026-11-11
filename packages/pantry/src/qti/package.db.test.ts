/* oxlint-disable unicorn/text-encoding-identifier-case -- The rows spell the XML encoding labels (`UTF-8`) as crust's reader reports them and `Document` stores them. */
/**
 * The package's laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): each
 * refused state is one the law's model refuses, named by the law it breaks.
 *
 * Only the law the database alone evaluates stays here: "Document entry" over the query
 * `TypedHref`, its check and its containment in `ResourceDocument`. The row CHECKs, counts and
 * containments the host judges are held on the free tier, by the law oracle and
 * `#pantry/qti/package.oracle.test.ts`; grizzle's Bind and flight bounds are grizzle's to test.
 *
 * Each case is written by the direct SQL writer (`#pantry/test/direct-sql.ts`, README "Direct SQL
 * access"): the author login, `SET ROLE` to the author role, at SERIALIZABLE, the row inserted into
 * its table, never its view, with every column a writer fills, a family member's hidden index and
 * copy by grizzle's comment and its owners first (an owner axis is judged at the member's INSERT),
 * every deferrable foreign key deferred and then the one under test set immediate, found by the law
 * its comment names. PostgreSQL's SQLSTATE and that constraint are the verdict, and the transaction
 * rolls back.
 */
import type { Fact } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { Flag } from "#pantry/grammar/install.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { ResourceDocument, ResourceHref, ResourceTyped } from "#pantry/qti/package.ts";
import { bitsText } from "#pantry/test/bits.ts";
import {
  judged,
  loginSession,
  qtiSchema,
  rowsOf,
  sqlRowOf,
  statedInserts,
  tableOf,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { checkConstraintOf } from "#pantry/test/judged-laws.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { manifestPath } from "#pantry/vocab/terms/package.ts";

/**
 * A uuid no stored row holds: every stray row below names it as its node, package or resource.
 */
const stray = "00000000-0000-4000-8000-0000000006f0";

/**
 * A second stray uuid, where a row names two.
 */
const strayOther = "00000000-0000-4000-8000-0000000006f1";

/**
 * A document row, its node and package stray, as a direct writer fills its table: every written
 * column, the manifest's when `documentType` is `manifest`, lawful on its own CHECKs (no
 * declaration, no site naming it, its context its own node), and its families' counts at 0.
 *
 * @param fields - The fields the case sets.
 * @returns The table's row.
 */
const documentSqlRow = (
  fields: Pick<Fact<typeof Document>, "documentType" | "path" | "rootKind">,
) =>
  sqlRowOf(Document, {
    assembled: false,
    bindings: 0n,
    charset: "UTF-8",
    choices: 0n,
    context: bitsText(Flag, []),
    contextNearest: stray,
    contextNearestKind: "document",
    exportCharset: "UTF-8",
    hottexts: 0n,
    idrefTargets: 0n,
    ids: 0n,
    langs: 0n,
    node: stray,
    nodeChildren: 1n,
    package: stray,
    targetedBy: 0n,
    variables: 0n,
    version: "3.0.1",
    ...fields,
  });

/**
 * The item document a resource of type `imsqti_item_xmlv3p0` lists: its type, which is its
 * resource's, and the one root kind `RootOfType` pairs with that type.
 */
const itemDocument = {
  documentType: "imsqti_item_xmlv3p0",
  rootKind: "qti-assessment-item",
  type: "imsqti_item_xmlv3p0",
} as const;

/**
 * The test document a resource of type `imsqti_test_xmlv3p0` lists: its type, which is its
 * resource's, and the one root kind `RootOfType` pairs with that type.
 */
const testDocument = {
  documentType: "imsqti_test_xmlv3p0",
  rootKind: "qti-assessment-test",
  type: "imsqti_test_xmlv3p0",
} as const;

/**
 * The rows of a document the package lists under a resource type, its node and package stray: its
 * `Document` row, lawful on its own CHECKs, and the `ResourceDocument` row that names it under the
 * type, whose own CHECKs hold it to its `Document`'s path, root kind and document type.
 *
 * @param path - The path the document stands at.
 * @param held - The document's type and its root kind.
 * @returns The two rows.
 */
const listedDocumentAt = (
  path: string,
  held: typeof itemDocument | typeof testDocument,
): readonly Stated[] => [
  {
    fact: documentSqlRow({
      documentType: held.documentType,
      path,
      rootKind: held.rootKind,
    }),
    relation: Document,
  },
  {
    fact: {
      documentType: held.documentType,
      node: stray,
      package: stray,
      path,
      rootKind: held.rootKind,
      type: held.type,
    },
    relation: ResourceDocument,
  },
];

/**
 * The rows of a resource of the item type whose href names a path in the package, its package
 * stray and its node the other stray: its `ResourceHref` and its `ResourceTyped`, which are the
 * query `TypedHref`'s one row for it, each lawful on its own CHECKs.
 *
 * @param path - The path its href names, which is also the href as written.
 * @returns The two rows.
 */
const itemResourceNaming = (path: string): readonly Stated[] => [
  {
    fact: { href: path, node: strayOther, package: stray, path, scope: "entry" },
    relation: ResourceHref,
  },
  {
    fact: {
      node: strayOther,
      package: stray,
      type: itemDocument.type,
      typeLexical: itemDocument.type,
    },
    relation: ResourceTyped,
  },
];

/**
 * The names of the constraint triggers that hold "Document entry"'s containment of a
 * document-typed href in `ResourceDocument` (`documentHrefs` into `ResourceDocument`,
 * `#pantry/qti/queries.ts`), read from the catalog.
 *
 * A containment whose source is a query is no foreign key: grizzle installs it as one deferred
 * constraint trigger on each table the query reads, all under one name that it mints from a digest
 * and describes only by the trigger's comment, `trigger of rule` and the law as `lawsOf` spells it.
 * So neither `constraintsDescribed`, which reads a constraint's comment, nor `checkConstraintOf`,
 * whose `constraintNamesOf` names a check alone, finds it (grizzle's README, "Rules over
 * queries"). The trigger raises 23503 under its own name, and `SET CONSTRAINTS` takes that name.
 *
 * @param client - The session.
 * @returns The trigger's name on `resource_href`, a table the query reads.
 */
const documentHrefContainment = (client: Parameters<typeof rowsOf>[0]) =>
  rowsOf<{ readonly tgname: string }>(
    client,
    `SELECT t.tgname FROM pg_catalog.pg_trigger t
      WHERE t.tgrelid = pg_catalog.to_regclass($1)
        AND pg_catalog.obj_description(t.oid, 'pg_trigger') LIKE $2`,
    [
      `${qtiSchema}.${tableOf(ResourceHref.name)}`,
      `trigger of rule TypedHref(package, path, type) where % in ${ResourceDocument.name}(package, path, type)`,
    ],
  ).pipe(Effect.map((rows) => rows.map(({ tgname }) => tgname)));

/**
 * Judge a case's rows twice by what the database holds of "Document entry"'s containment of a
 * document-typed href: with every deferrable constraint deferred, the case's control, and then
 * with each trigger that holds the containment set immediate alone.
 *
 * @param client - The session.
 * @param stated - The case's rows.
 * @returns The refusal with every constraint deferred, none where the rows' own laws accept them,
 *   and each immediate verdict beside the constraint set immediate. A case whose catalog holds no
 *   such constraint fails.
 */
const judgedByDocumentHrefContainment = (
  client: Parameters<typeof rowsOf>[0],
  stated: readonly Stated[],
) =>
  Effect.gen(function* byContainment() {
    const keys = yield* documentHrefContainment(client);
    assert.isNotEmpty(
      keys,
      "the catalog holds a constraint for the document-typed href containment",
    );

    const inserts = statedInserts(stated);
    const deferred = Option.getOrUndefined(yield* judged(client, inserts));
    const immediate = yield* Effect.all(
      keys.map((key) =>
        judged(client, inserts, [key]).pipe(
          Effect.map((verdict) => ({ key, refused: Option.getOrUndefined(verdict) })),
        ),
      ),
    );

    return { deferred, immediate };
  });

describe.skipIf(!hasLease)("qti/package.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer)("the package's laws, judged by PostgreSQL", (it) => {
    it.effect(
      "refuses a document-typed resource href outside the package, by the rule over its typed href",
      () =>
        // Oracle: PostgreSQL, "Document entry"'s check over the query `TypedHref`
        // (`src/qti/queries.ts`; README, "Rules over queries"): a deferred constraint trigger on
        // each table the query reads, under the check's own name, set immediate alone, which
        // raises 23514 under that name for a typed href of a document type outside the package
        // (reading 93).
        // Bound: one resource href, external, beside its resource's item type, each row lawful
        // on its own CHECKs.
        Effect.gen(function* typedHrefOutside() {
          const client = yield* loginSession;
          const rule = checkConstraintOf(Qti, "TypedHref", "Document_entry");
          const refused = Option.getOrUndefined(
            yield* judged(
              client,
              statedInserts([
                {
                  fact: {
                    href: "http://x.org/a.xml",
                    node: stray,
                    package: stray,
                    path: "http://x.org/a.xml",
                    scope: "external",
                  },
                  relation: ResourceHref,
                },
                {
                  fact: {
                    node: stray,
                    package: stray,
                    type: "imsqti_item_xmlv3p0",
                  },
                  relation: ResourceTyped,
                },
              ]),
              [rule],
            ),
          );

          assert.strictEqual(refused?.code, "23514", rule);
          assert.strictEqual(refused?.constraint, rule);
        }).pipe(Effect.scoped),
      { timeout: leaseTestTimeoutMs },
    );

    it.effect(
      "refuses a document-typed resource href naming the manifest, by the containment of its typed href in ResourceDocument",
      () =>
        // Oracle: PostgreSQL, "Document entry"'s containment of a document-typed href in
        // `ResourceDocument` (`documentHrefs` into `ResourceDocument`, `src/qti/queries.ts`): a
        // deferred constraint trigger on each table `TypedHref` reads, found by its comment in the
        // catalog and set immediate alone, which raises 23503 under its name for a typed href
        // whose (package, path, type) no `ResourceDocument` row holds. The manifest is no
        // resource's document (reading 146): its `Document` is of type `manifest`, and a
        // `ResourceDocument` row is held to a `Document` of its own type at its path, so none
        // stands at `imsmanifest.xml`, whatever type a resource names it under.
        // Bound: the manifest's `Document` row, and one item-typed resource whose href and path
        // are `imsmanifest.xml`, each row lawful on its own CHECKs, so the control, with every
        // constraint deferred, accepts them and the containment alone refuses them.
        Effect.gen(function* typedHrefNamingManifest() {
          const client = yield* loginSession;
          const { deferred, immediate } = yield* judgedByDocumentHrefContainment(client, [
            {
              fact: documentSqlRow({
                documentType: "manifest",
                path: manifestPath,
                rootKind: "cp:manifest",
              }),
              relation: Document,
            },
            ...itemResourceNaming(manifestPath),
          ]);

          assert.isUndefined(
            deferred,
            `the rows break no law that is not deferred: ${deferred?.message ?? ""}`,
          );
          for (const { key, refused } of immediate) {
            assert.strictEqual(refused?.code, "23503", key);
            assert.strictEqual(refused?.constraint, key);
          }
        }).pipe(Effect.scoped),
      { timeout: leaseTestTimeoutMs },
    );

    it.effect(
      "refuses a document-typed resource href naming a document of another type, by the same containment",
      () =>
        // Oracle: PostgreSQL, the containment of the test above. A path holds one document, of
        // one type (the key `ResourceDocument` states over (package, path); reading 93), so where
        // a test document stands, no `ResourceDocument` row holds that path under the item type,
        // and an item-typed href naming it is held by none.
        // Bound: a test document at `test.xml`, its `Document` and `ResourceDocument` rows, and
        // one item-typed resource whose href and path are `test.xml`, each row lawful on its own
        // CHECKs, so the control, with every constraint deferred, accepts them and the
        // containment alone refuses them.
        Effect.gen(function* typedHrefNamingOtherType() {
          const client = yield* loginSession;
          const { deferred, immediate } = yield* judgedByDocumentHrefContainment(client, [
            ...listedDocumentAt("test.xml", testDocument),
            ...itemResourceNaming("test.xml"),
          ]);

          assert.isUndefined(
            deferred,
            `the rows break no law that is not deferred: ${deferred?.message ?? ""}`,
          );
          for (const { key, refused } of immediate) {
            assert.strictEqual(refused?.code, "23503", key);
            assert.strictEqual(refused?.constraint, key);
          }
        }).pipe(Effect.scoped),
      { timeout: leaseTestTimeoutMs },
    );

    it.effect(
      "accepts a document-typed resource href naming a document of its type, with the same containment immediate",
      () =>
        // Oracle: PostgreSQL, the containment of the tests above, whose lawful twin this is: the
        // same item-typed resource naming a path where the package lists an item document, so the
        // typed href's (package, path, type) is the one a `ResourceDocument` row holds.
        // Bound: an item document at `item.xml`, its `Document` and `ResourceDocument` rows, and
        // one item-typed resource whose href and path are `item.xml`, each row lawful on its own
        // CHECKs, with the containment immediate.
        Effect.gen(function* typedHrefNamingItsType() {
          const client = yield* loginSession;
          const { deferred, immediate } = yield* judgedByDocumentHrefContainment(client, [
            ...listedDocumentAt("item.xml", itemDocument),
            ...itemResourceNaming("item.xml"),
          ]);

          assert.isUndefined(deferred, deferred?.message);
          for (const { key, refused } of immediate) {
            assert.isUndefined(refused, `${key}: ${refused?.message ?? ""}`);
          }
        }).pipe(Effect.scoped),
      { timeout: leaseTestTimeoutMs },
    );
  });
});
