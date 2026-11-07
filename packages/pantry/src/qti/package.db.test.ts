/* oxlint-disable unicorn/text-encoding-identifier-case -- The rows spell the XML encoding labels (`UTF-8`) as crust's reader reports them and `Document` stores them. */
/**
 * The package's laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): each
 * refused state is one the law's model refuses, named by the law it breaks.
 *
 * A row whose own laws are row CHECKs, or a count grizzle draws, is written through the author role
 * (`db.apply`), and the outcome is `invariant-rejected` with the expected law among its `laws`
 * (membership, since a merged native names several, C22). A row that breaks a deferred foreign key
 * is written by the direct SQL writer (`#pantry/test/direct-sql.ts`, README "Direct SQL access"):
 * the author login, `SET ROLE` to the author role, at SERIALIZABLE, the row inserted into its
 * table, never its view, with every column a writer fills, a family member's hidden index and copy
 * by grizzle's comment and its owners first (an owner axis is judged at the member's INSERT), every
 * deferrable foreign key deferred and then the one under test set immediate, found by the law its
 * comment names. PostgreSQL's SQLSTATE and that constraint are the verdict, and the transaction
 * rolls back.
 *
 * The cases over a whole imported package (the `lti` fixture refused under `attribute-lexical`, a
 * document whose root its resource type does not name, an href its resource's files do not list, a
 * document href with no entry, a resource sharing its manifest's identifier, and a package whose
 * entries pass one statement accepted) need the importer's ChangeSet (Q5.15), and are stated in
 * Q5.06's report for the network seat's probe.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { Fact, Law } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { AttributeName, Flag, NodeKind, SchemaVersion } from "#pantry/grammar/install.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import {
  Dependency,
  DependencyTarget,
  File,
  FileHref,
  ManifestIdSpace,
  manifestPath,
  NamedHref,
  Package,
  Reference,
  ReferencePath,
  ResourceFile,
  ResourceHref,
  ResourceTyped,
  TypedHref,
} from "#pantry/qti/package.ts";
import { Author } from "#pantry/qti/roles.ts";
import { bitsText } from "#pantry/test/bits.ts";
import {
  codeOf,
  constraintsDescribed,
  judged,
  loginSession,
  sqlRowOf,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

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
  outcome: { readonly kind: string; readonly refused?: { readonly laws: readonly Law[] } },
  picks: (law: Law) => boolean,
): boolean => outcome.kind === "invariant-rejected" && (outcome.refused?.laws ?? []).some(picks);

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
 * Pick a key by its relation and its fields, in order.
 *
 * @param relation - The key's relation.
 * @param fields - Its fields.
 * @returns The predicate.
 */
const keyOn =
  (relation: string, ...fields: readonly string[]) =>
  (law: Law): boolean =>
    law.kind === "key" &&
    law.side.relation === relation &&
    law.side.terms.map((term) => term.field).join(" ") === fields.join(" ");

/**
 * A document row, its node and package stray, as a direct writer fills its table: every written
 * column, the manifest's when `resourceType` is `none`, lawful on its own CHECKs (no declaration,
 * no site naming it, its context its own node), and its families' counts at 0.
 *
 * @param fields - The fields the case sets.
 * @returns The table's row.
 */
const documentSqlRow = (
  fields: Pick<Fact<typeof Document>, "path" | "resourceType" | "rootKind">,
) =>
  sqlRowOf(Document, {
    assembled: false,
    bindings: 0n,
    charset: "UTF-8",
    choices: 0n,
    context: bitsText(Flag, []),
    contextNearest: stray,
    contextNearestKind: "document",
    encoding: "",
    exportCharset: "UTF-8",
    hottexts: 0n,
    idrefTargets: 0n,
    ids: 0n,
    langs: 0n,
    node: stray,
    nodeChildren: 1n,
    nodeDocument: stray,
    nodeGoverns: "none",
    nodeKind: "document",
    nodeParentKind: "document",
    nodeStart: 0n,
    package: stray,
    standalone: "none",
    targetedBy: 0n,
    variables: 0n,
    version: "3.0.1",
    xmlVersion: "none",
    ...fields,
  });

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
                { package: stray, path: "a.xml", scope: "entry" },
              ]),
              law: checkNamed("FileHref", "File_listed"),
              name: "FileHref",
            },
            {
              changes: ChangeSet.empty(Author).insert(ResourceFile, [
                { path: "a.xml", resource: stray, scope: "entry" },
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
        "refuses a resource's row by its own laws: its code and its manifest's identifier",
        () =>
          // Oracle: PostgreSQL, judged as the rows are inserted: C17's "E1 derived", a CHECK on a
          // resource's type (a code its lexical form does not spell), and P4 "Manifest id space",
          // the key over the package's identifier space that a resource of the manifest's
          // identifier breaks. Which types a version admits is the `type` attribute's value
          // domain's (spec reading 67), a law of `Attribute`, so no law of the row reads it.
          // Bound: one case per law, every other law of its rows kept.
          Effect.gen(function* resourceChecks() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const cases = [
              {
                changes: ChangeSet.empty(Author).insert(ResourceTyped, [
                  {
                    node: stray,
                    package: stray,
                    type: "imsqti_item_xmlv3p0",
                    typeLexical: "webcontent",
                  },
                ]),
                law: checkNamed("ResourceTyped", "E1_derived"),
                name: "E1 derived",
              },
              {
                changes: ChangeSet.empty(Author).insert(ManifestIdSpace, [
                  { identifier: "m", kind: "cp:manifest", package: stray },
                  { identifier: "m", kind: "cp:resource", package: stray },
                ]),
                law: keyOn("ManifestIdSpace", "package", "identifier"),
                name: "manifest-id-space",
              },
            ];
            for (const { changes, law, name } of cases) {
              const outcome = yield* db.apply(changes, {});

              assert.isTrue(rejectedBy(outcome, law), `${name}: ${outcome.kind}`);
            }
          }),
      );

      it.effect(
        "refuses a document whose root its resource type does not name, and a document of no resource but the manifest",
        () =>
          // Oracle: PostgreSQL, P2: a typed document's (resource type, root kind) is a row of the
          // set RootOfType (its containment, a CHECK on `Document`), and an untyped one is the
          // manifest, of type `none` at imsmanifest.xml (reading 93, the `RootOfType` CHECK).
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
        "refuses an unresolved href, a resolved path with a dot segment, a reference's scope its target refutes, and a dependency on its own resource, by each row check",
        () =>
          // Oracle: PostgreSQL, each row CHECK, judged as its row is inserted (its owners in the
          // same step, so no count is missing):
          // - E1_derived: a resource href's and a file's path resolved in the package that holds a
          //   dot segment, and a resolved reference's (resolvedPathPattern); a reference that is
          //   not `lead ‖ target ‖ params ‖ trail`; one whose target has a scheme but whose scope
          //   is not external; one whose target is not empty but whose scope is its own document's
          //   (reading 102);
          // - Href_form, the stated limit: a resource href, a file and a reference the importer
          //   reads no name from, and a srcset of two candidates even where external;
          // - Document_entry: a document-typed resource href outside the package;
          // - Self_dependency: a dependency whose identifierref names its own resource, its target
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
              scope: "entry",
              target: "a.png",
              trail: "",
            } as const;
            const resourceHref = {
              href: "a.xml",
              node: stray,
              package: stray,
              path: "a.xml",
              scope: "entry",
              typeLexical: "webcontent",
            } as const;
            const fileOf = (path: string, scope: "entry" | "unresolved") =>
              ChangeSet.empty(Author)
                .insert(FileHref, [{ package: stray, path, scope }])
                .insert(ResourceFile, [{ path, resource: stray, scope }])
                .insert(File, [
                  { ...tuple, href: path, kind: "cp:file", path, resource: stray, scope },
                ]);
            const cases = [
              {
                law: checkNamed("ResourceHref", "E1_derived"),
                name: "resource href resolved to a path with a dot segment",
                outcome: db.apply(
                  ChangeSet.empty(Author).insert(ResourceHref, [
                    { ...resourceHref, href: "b/../a.xml", path: "b/../a.xml" },
                  ]),
                  {},
                ),
              },
              {
                law: checkNamed("ResourceHref", "Href_form"),
                name: "resource href the importer reads no name from",
                outcome: db.apply(
                  ChangeSet.empty(Author).insert(ResourceHref, [
                    { ...resourceHref, href: "a%zz.xml", path: "a%zz.xml", scope: "unresolved" },
                  ]),
                  {},
                ),
              },
              {
                law: checkNamed("TypedHref", "Document_entry"),
                name: "document-typed resource href outside the package",
                outcome: db.apply(
                  ChangeSet.empty(Author)
                    .insert(NamedHref, [
                      { package: stray, path: "http://x.org/a.xml", type: "imsqti_item_xmlv3p0" },
                    ])
                    .insert(TypedHref, [
                      {
                        node: stray,
                        package: stray,
                        path: "http://x.org/a.xml",
                        scope: "external",
                        type: "imsqti_item_xmlv3p0",
                      },
                    ]),
                  {},
                ),
              },
              {
                law: checkNamed("File", "Href_form"),
                name: "file href the importer reads no name from",
                outcome: db.apply(fileOf("a%zz.xml", "unresolved"), {}),
              },
              {
                law: checkNamed("File", "E1_derived"),
                name: "file path resolved with a dot segment",
                outcome: db.apply(fileOf("./a.xml", "entry"), {}),
              },
              {
                law: checkNamed("DependencyTarget", "Self_dependency"),
                name: "dependency on its own resource",
                outcome: db.apply(
                  ChangeSet.empty(Author).insert(DependencyTarget, [
                    { node: stray, package: stray, ref: "r1", resource: stray, target: stray },
                  ]),
                  {},
                ),
              },
              {
                law: checkNamed("Reference", "E1_derived"),
                name: "reference not lead ‖ target ‖ params ‖ trail",
                outcome: db.apply(
                  ChangeSet.empty(Author).insert(Reference, [
                    { ...reference, lead: "", lexical: " a.png", scope: "external" },
                  ]),
                  {},
                ),
              },
              {
                law: checkNamed("Reference", "E1_derived"),
                name: "reference with a scheme not external",
                outcome: db.apply(
                  ChangeSet.empty(Author).insert(Reference, [
                    { ...reference, lexical: "http://x.org/a.png", target: "http://x.org/a.png" },
                  ]),
                  {},
                ),
              },
              {
                law: checkNamed("Reference", "E1_derived"),
                name: "reference with a target naming its own document",
                outcome: db.apply(
                  ChangeSet.empty(Author).insert(Reference, [{ ...reference, scope: "document" }]),
                  {},
                ),
              },
              {
                law: checkNamed("Reference", "Href_form"),
                name: "reference the importer reads no name from",
                outcome: db.apply(
                  ChangeSet.empty(Author).insert(Reference, [
                    { ...reference, lexical: "a%zz.png", scope: "unresolved", target: "a%zz.png" },
                  ]),
                  {},
                ),
              },
              {
                law: checkNamed("Reference", "Href_form"),
                name: "srcset of two external candidates",
                outcome: db.apply(
                  ChangeSet.empty(Author).insert(Reference, [
                    {
                      ...reference,
                      lexical: "http://x.org/a.png,http://x.org/b.png",
                      name: "srcset",
                      scope: "external",
                      target: "http://x.org/a.png,http://x.org/b.png",
                    },
                  ]),
                  {},
                ),
              },
              {
                law: checkNamed("ReferencePath", "E1_derived"),
                name: "resolved reference with a dot segment",
                outcome: db.apply(
                  ChangeSet.empty(Author)
                    .insert(Reference, [{ ...reference, node: strayOther }])
                    .insert(ReferencePath, [
                      {
                        document: stray,
                        kind: "img",
                        name: "src",
                        node: strayOther,
                        package: stray,
                        path: "items/../a.png",
                      },
                    ]),
                  {},
                ),
              },
            ] as const;
            for (const { law, name, outcome: applying } of cases) {
              const outcome = yield* applying;

              assert.isTrue(rejectedBy(outcome, law), `${name}: ${outcome.kind}`);
            }
          }),
      );

      it.effect(
        "refuses rows that name no row of the record or of a resource's files, by each containment",
        () =>
          // Oracle: PostgreSQL, each containment's foreign key, set immediate alone: 23503 on it.
          // - href-listed: a resource href's (scope, path) no file of its resource lists (CP 1.2
          //   §6.6.2, reading 102);
          // - entry-kind: a document-typed href that is no document of its type (reading 93), and a
          //   document-typed href, and a document, that is no entry of the record;
          // - a dependency whose identifierref names no resource of its package (CP 1.2 §6.11.5 B);
          // - file-exists: a file whose href resolves in the package, and a resolved reference, each
          //   naming no entry (CP 1.2 InterchangePackage (b) and (d));
          // - stimulus-ref-target: a stimulus ref's resolved href naming no stimulus document
          //   (information model §7.6, the UP audit's B5).
          // Bound: one stray row per containment, written to its table with every column a direct
          // writer fills (README, "Direct SQL access"), after the owners its families' owner axes
          // read, which PostgreSQL judges at the member's INSERT: a typed href's NamedHref, a
          // file's FileHref and ResourceFile, each lawful on its own CHECKs and counting the one
          // member.
          Effect.gen(function* containments() {
            const client = yield* loginSession;
            const itemHref: readonly Stated[] = [
              {
                fact: {
                  href: "item.xml",
                  node: stray,
                  package: stray,
                  path: "item.xml",
                  scope: "entry",
                  typeLexical: "imsqti_item_xmlv3p0",
                },
                relation: ResourceHref,
              },
            ];
            const typedItemHref: readonly Stated[] = [
              {
                fact: { package: stray, path: "item.xml", type: "imsqti_item_xmlv3p0" },
                relation: NamedHref,
              },
              {
                fact: {
                  node: stray,
                  package: stray,
                  path: "item.xml",
                  scope: "entry",
                  type: "imsqti_item_xmlv3p0",
                },
                relation: TypedHref,
              },
            ];
            const cases = [
              {
                comment:
                  "foreign key ResourceHref(node, scope, path) to ResourceFile(resource, scope, path)",
                inserts: itemHref,
                table: "resource_href",
              },
              {
                comment: "foreign key TypedHref(package where",
                inserts: typedItemHref,
                table: "typed_href",
              },
              {
                comment: "foreign key Document(package, path) to Entry(package, path)",
                inserts: [
                  {
                    fact: documentSqlRow({
                      path: manifestPath,
                      resourceType: "none",
                      rootKind: "cp:manifest",
                    }),
                    relation: Document,
                  },
                ],
                table: "document",
              },
              {
                comment: "foreign key Dependency(node) to DependencyTarget(node)",
                inserts: [
                  {
                    fact: {
                      document: stray,
                      kind: codeOf(NodeKind.handles, "cp:dependency"),
                      nearest: stray,
                      node: strayOther,
                      package: stray,
                      ref: "nowhere",
                      resource: stray,
                      start: 4,
                      version: codeOf(SchemaVersion.handles, "3.0.1"),
                    },
                    relation: Dependency,
                  },
                ],
                table: "dependency",
              },
              {
                comment: "foreign key File(package where",
                inserts: [
                  {
                    fact: { package: stray, path: "missing.png", scope: "entry" },
                    relation: FileHref,
                  },
                  {
                    fact: { path: "missing.png", resource: stray, scope: "entry" },
                    relation: ResourceFile,
                  },
                  {
                    fact: {
                      document: stray,
                      href: "missing.png",
                      kind: "cp:file",
                      nearest: stray,
                      node: strayOther,
                      package: stray,
                      path: "missing.png",
                      resource: stray,
                      scope: "entry",
                      start: 4n,
                      version: "3.0.1",
                    },
                    relation: File,
                  },
                ],
                table: "file",
              },
              {
                comment: "foreign key ReferencePath(package, path) to Entry(package, path)",
                inserts: [
                  {
                    fact: {
                      document: stray,
                      kind: codeOf(NodeKind.handles, "img"),
                      name: codeOf(AttributeName.handles, "src"),
                      node: strayOther,
                      package: stray,
                      path: "items/missing.png",
                    },
                    relation: ReferencePath,
                  },
                ],
                table: "reference_path",
              },
              {
                comment: "foreign key ReferencePath(package where",
                inserts: [
                  {
                    fact: {
                      document: stray,
                      kind: codeOf(NodeKind.handles, "qti-assessment-stimulus-ref"),
                      name: codeOf(AttributeName.handles, "href"),
                      node: strayOther,
                      package: stray,
                      path: "items/missing.png",
                    },
                    relation: ReferencePath,
                  },
                ],
                table: "reference_path",
              },
            ];
            for (const { comment, inserts, table } of cases) {
              const keys = yield* constraintsDescribed(client, table, `${comment}%`);
              assert.isNotEmpty(keys, comment);

              for (const key of keys) {
                const refused = Option.getOrUndefined(
                  yield* judged(client, statedInserts(inserts), [key]),
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
