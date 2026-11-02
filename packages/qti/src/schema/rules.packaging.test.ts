import { isDeepStrictEqual } from "node:util";
import { Db } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Context, Effect, Layer, Option, Predicate } from "effect";
import { describe, inject } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { externalRows } from "#qti/import/external.ts";
import { itemRows } from "#qti/import/item.ts";
import { manifestRows } from "#qti/import/manifest.ts";
import { outcomeRows } from "#qti/import/outcome.ts";
import { changeSetOf, retrySchedule } from "#qti/import/package.ts";
import { kindOf, Rows } from "#qti/import/tree.ts";
import { listPackage, readEntry } from "#qti/package/read.ts";
import { admission as lomAdmission } from "#qti/schema/kinds/lom.ts";
import { Declaration, OutcomeDeclarationArm } from "#qti/schema/declaration.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import {
  ExternalLom,
  FileLom,
  Lom,
  LomObjectTitle,
  LomTitle,
  LomValue,
  ManifestLom,
  QtiMetadata,
  QtiMetadataInExternalLom,
  QtiMetadataInMetadata,
  QtiMetadataInResourceLom,
  ResourceLom,
  arms as metadataArms,
  r30Asserts,
  rules as metadataRules,
} from "#qti/schema/metadata.ts";
import { Admission, Edge, Node, TreeRoot } from "#qti/schema/node.ts";
import {
  File,
  FileMetadata,
  PackageEntry,
  Resource,
  ResourceMetadata,
  RootOfType,
} from "#qti/schema/package.ts";
import { OutcomeDocument } from "#qti/schema/outcome.ts";
import { materialize } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";
import { readXml } from "#qti/xml/read.ts";

/**
 * A row as a test edits it: every field of the schema is text or a bigint.
 */
type Row = Record<string, string | bigint>;

/**
 * The importer's rows for a fixture, a mutable copy per relation, which an alteration edits in
 * place before the rows are applied.
 */
type Draft = Map<AnyRelation, Row[]>;

/**
 * One side of a containment, mirror or capacity law as grizzle reports it.
 */
interface Side {
  readonly fields: readonly string[];
  readonly relation: string;
  readonly selection: readonly { readonly field: string; readonly value: string }[];
}

/**
 * The laws this file names, in the shape of the `law` of an `invariant-rejected` outcome.
 */
type Law =
  | { readonly fields: readonly string[]; readonly kind: "key"; readonly relation: string }
  | { readonly field: string; readonly kind: "alternatives"; readonly relation: string }
  | { readonly kind: "check"; readonly name: string; readonly relation: string }
  | { readonly from: Side; readonly kind: "contained"; readonly to: Side }
  | { readonly from: Side; readonly kind: "mirrors"; readonly to: Side }
  | {
      readonly from: Side;
      readonly kind: "capacity";
      readonly target: Side;
      readonly weight: { readonly kind: "count" };
      readonly within: { readonly high: bigint | "*"; readonly low: bigint };
    };

const side = (
  relation: AnyRelation,
  fields: readonly string[],
  selection: Side["selection"] = [],
): Side => ({ fields, relation: relation.name, selection });

const contained = (from: Side, to: Side): Law => ({ from, kind: "contained", to });

const mirrorsLaw = (from: Side, to: Side): Law => ({ from, kind: "mirrors", to });

const keyOf = (relation: AnyRelation, fields: readonly string[]): Law => ({
  fields,
  kind: "key",
  relation: relation.name,
});

const capacity = (
  target: Side,
  from: Side,
  within: { readonly high: bigint | "*"; readonly low: bigint },
): Law => ({ from, kind: "capacity", target, weight: { kind: "count" }, within });

/**
 * The type of the item resources, which `RootOfType` pairs with the `item` root.
 */
const itemType = "imsqti_item_xmlv3p0";

/**
 * A row from the entries of an importer fact, whose fields are all text or bigints.
 */
const rowOf = (entries: readonly (readonly [string, unknown])[]) =>
  Object.fromEntries(
    entries.map(([field, value]): [string, string | bigint] => [
      field,
      Predicate.isString(value) || Predicate.isBigInt(value)
        ? value
        : assert.fail(`${field} is neither text nor a bigint`),
    ]),
  );

const draftOf = (rows: Rows): Draft =>
  new Map(
    [...rows].map(([relation, facts]) => [
      relation,
      facts.map((fact) => rowOf(Object.entries(fact))),
    ]),
  );

/**
 * The editable rows of `relation`, an empty list when the draft has none.
 */
const of = (draft: Draft, relation: AnyRelation): Row[] => {
  const found = draft.get(relation);
  if (found !== undefined) {
    return found;
  }

  const created: Row[] = [];
  draft.set(relation, created);

  return created;
};

const peek = (row: Row, field: string): string | bigint | undefined => row[field];

const text = (row: Row, field: string): string => {
  const value = peek(row, field);

  return Predicate.isString(value) ? value : assert.fail(`${field} is not text`);
};

const set = (row: Row, field: string, value: string | bigint): void => {
  row[field] = value;
};

const position = (row: Row): bigint => {
  const value = peek(row, "position");

  return Predicate.isBigInt(value) ? value : assert.fail("position is not a bigint");
};

/**
 * The first row of `relation`, which a fixture's draft has exactly one of or whose first is meant.
 */
const first = (draft: Draft, relation: AnyRelation): Row => {
  const [found] = of(draft, relation);
  assert.isDefined(found, relation.name);

  return found ?? {};
};

/**
 * The row of `relation` whose `field` is `value`.
 */
const rowWhere = (draft: Draft, relation: AnyRelation, field: string, value: string): Row => {
  const found = of(draft, relation).find((row) => peek(row, field) === value);
  assert.isDefined(found, `${relation.name}.${field} = ${value}`);

  return found ?? {};
};

/**
 * The `index`th node of `kind`, in the order the importer wrote them.
 */
const nodeOf = (draft: Draft, kind: string, index = 0): Row => {
  const found = of(draft, Node).filter((row) => text(row, "kind") === kind)[index];
  assert.isDefined(found, `${kind} #${index}`);

  return found ?? {};
};

/**
 * The `Edge` row whose child is `child`.
 */
const edgeInto = (draft: Draft, child: string): Row => rowWhere(draft, Edge, "child", child);

/**
 * Move the node `child` under `parent`, at `place` among its children: its edge names the new
 * parent and the parent's kind.
 */
const moveUnder = (draft: Draft, child: string, parent: string, place = 1001n): void => {
  const above = rowWhere(draft, Node, "id", parent);
  Object.assign(edgeInto(draft, child), {
    parent,
    parentKind: text(above, "kind"),
    position: place,
  });
};

/**
 * Add a node of `kind` as the last child of `parent`, with the edge into it. The caller adds the
 * arm row.
 *
 * @returns The new node's id.
 */
const addNode = (draft: Draft, kind: string, parent: string): string => {
  const above = rowWhere(draft, Node, "id", parent);
  const id = crypto.randomUUID();
  const tree = text(above, "tree");
  const version = text(above, "version");
  let last = 0n;
  for (const edge of of(draft, Edge)) {
    if (text(edge, "parent") === parent && position(edge) > last) {
      last = position(edge);
    }
  }

  of(draft, Node).push({
    id,
    kind,
    prefix: "",
    rootKind: text(above, "rootKind"),
    tree,
    version,
  });
  of(draft, Edge).push({
    child: id,
    childKind: kind,
    parent,
    parentKind: text(above, "kind"),
    position: last + 2n,
    tree,
    version,
  });

  return id;
};

/**
 * Replace every text value `from` with `to` in every row of every relation, so a field copied
 * across relations is altered together.
 */
const replaceEverywhere = (draft: Draft, from: string, to: string): void => {
  for (const facts of draft.values()) {
    for (const fact of facts) {
      for (const [field, value] of Object.entries(fact)) {
        if (value === from) {
          fact[field] = to;
        }
      }
    }
  }
};

/**
 * Remove every row of every relation that names one of `ids`.
 */
const removeRowsNaming = (draft: Draft, ids: ReadonlySet<string>): void => {
  for (const [relation, facts] of draft) {
    draft.set(
      relation,
      facts.filter((fact) => !Object.values(fact).some((v) => Predicate.isString(v) && ids.has(v))),
    );
  }
};

/**
 * The ids of the node `root` and every node under it.
 */
const subtreeIds = (draft: Draft, root: string): Set<string> => {
  const found = new Set([root]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const edge of of(draft, Edge)) {
      if (found.has(text(edge, "parent")) && !found.has(text(edge, "child"))) {
        found.add(text(edge, "child"));
        grew = true;
      }
    }
  }

  return found;
};

/**
 * Remove the node `root`, every node under it, and every row of any relation that names one of
 * them: its edges, its arm and its side rows.
 */
const removeSubtree = (draft: Draft, root: string): void => {
  removeRowsNaming(draft, subtreeIds(draft, root));
};

/**
 * Copy the document `tree` and every row that names a node of it under fresh ids, as a second
 * document. `rename` replaces text values in the copies only, as the new resource's name and
 * path.
 *
 * @returns The copy's document id.
 */
const copyDocument = (
  draft: Draft,
  tree: string,
  rename: ReadonlyMap<string, string> = new Map(),
): string => {
  const old = new Set([
    tree,
    ...of(draft, Node)
      .filter((row) => text(row, "tree") === tree)
      .map((row) => text(row, "id")),
  ]);
  const fresh = new Map([...old].map((id) => [id, crypto.randomUUID()]));

  for (const facts of draft.values()) {
    const copies = facts
      .filter((fact) => Object.values(fact).some((v) => Predicate.isString(v) && old.has(v)))
      .map((fact) =>
        rowOf(
          Object.entries(fact).map(([field, v]) => [
            field,
            Predicate.isString(v) ? (fresh.get(v) ?? rename.get(v) ?? v) : v,
          ]),
        ),
      );

    facts.push(...copies);
  }

  return fresh.get(tree) ?? assert.fail("the copied tree has no new id");
};

/**
 * Apply the draft through the author role.
 */
const apply = (draft: Draft) =>
  Effect.gen(function* applyDraft() {
    const db = yield* Db.open(AuthorApp.roles.author, {});

    return yield* db
      .apply(changeSetOf(draft), {})
      .pipe(Effect.retry({ schedule: retrySchedule, while: (e) => e._tag === "TransientFailure" }));
  });

/**
 * The importer's rows for the package at `dir`, as `importPackage` builds them before its guards
 * run: the manifest's, then each document by the builder of its root. `replace` supplies the
 * bytes of one listed document in place of the file's.
 */
const rowsOfPackage = (
  dir: string,
  replace?: { readonly bytes: Uint8Array; readonly path: string },
) =>
  Effect.gen(function* packageRows() {
    const entries = yield* listPackage(dir);
    const manifest = yield* readXml(
      replace?.path === "imsmanifest.xml"
        ? replace.bytes
        : yield* readEntry(dir, "imsmanifest.xml"),
    );
    const built = yield* manifestRows(dir, entries, manifest, Rows.empty());
    let { rows } = built;

    for (const listed of built.documents) {
      const bytes =
        replace !== undefined && replace.path === listed.path
          ? replace.bytes
          : yield* readEntry(dir, listed.path);
      const doc = yield* readXml(bytes);
      const input = {
        doc,
        packageId: built.packageId,
        path: listed.path,
        resource: listed.resource,
        resourceType: listed.type,
        version: built.version,
      };
      const root = Option.getOrUndefined(kindOf(doc.root, Option.none()));

      if (root === "qti-assessment-item") {
        ({ rows } = yield* itemRows(input, rows));
      } else if (root === "lom:lom") {
        ({ rows } = yield* externalRows(
          doc,
          {
            package: built.packageId,
            path: listed.path,
            resource: listed.resource,
            resourceType: listed.type,
            version: built.version,
          },
          rows,
        ));
      } else if (root === "qti-outcome-declaration") {
        ({ rows } = yield* outcomeRows(input, rows));
      } else {
        return yield* Effect.die(new Error(`${listed.path} has the root ${root ?? "?"}`));
      }
    }

    return rows;
  }).pipe(Effect.provide(NodeServices.layer));

/**
 * The importer's rows for each fixture the row-altering negatives read, built once for the suite.
 */
class FixtureRows extends Context.Service<
  FixtureRows,
  Readonly<
    Record<"extmeta" | "filelom" | "lomrest" | "nestedqmd" | "nestedqmdBoth" | "outcome", Rows>
  >
>()("rules.packaging.test/FixtureRows") {}

const rowsOfFixture = (name: FixtureName) =>
  Effect.flatMap(materialize(name), (dir) => rowsOfPackage(dir));

const FixtureRowsLayer = Layer.effect(
  FixtureRows,
  Effect.all({
    extmeta: rowsOfFixture("extmeta"),
    filelom: rowsOfFixture("filelom"),
    lomrest: rowsOfFixture("lomrest"),
    nestedqmd: rowsOfFixture("nestedqmd"),
    nestedqmdBoth: rowsOfFixture("nestedqmd-both"),
    outcome: rowsOfFixture("outcome"),
  }).pipe(Effect.provide(NodeServices.layer)),
);

/**
 * One alteration of a fixture's rows and the laws it may break: any one of them.
 */
interface Negative {
  readonly alter?: (draft: Draft) => void;
  readonly base: keyof (typeof FixtureRows)["Service"];
  readonly laws: readonly Law[];
  readonly name: string;
}

const externalDocument = { field: "root", value: "externalLom" } as const;

const outcomesDocument = { field: "root", value: "outcomes" } as const;

/**
 * The `Document` row whose root is `root`.
 */
const documentRooted = (draft: Draft, root: string): Row => rowWhere(draft, Document, "root", root);

/**
 * Remove the `lom:identifier` the relation's `lom:resource` holds.
 *
 * The importer writes it as a `LomIdentifier` at the same position as the general category's, and
 * the key on `(lom, position)` refuses the pair, so `lomrest` as built is refused before any
 * alteration. The removal makes the base committable, so each negative below is its alteration's.
 */
const withoutRelationIdentifier = (draft: Draft): void => {
  for (const edge of of(draft, Edge)) {
    if (
      text(edge, "childKind") === "lom:identifier" &&
      text(edge, "parentKind") === "lom:resource"
    ) {
      removeSubtree(draft, text(edge, "child"));
    }
  }
};

const admission = contained(
  side(Edge, ["version", "parentKind", "childKind"]),
  side(Admission, ["version", "parent", "child"]),
);

/**
 * The negatives over the packaging relations, each an alteration of one fixture's rows and the law
 * it breaks.
 *
 * Every row but the one named was built by the importer from the fixture, so the alteration is the
 * only change; the unaltered controls at the end of the suite are accepted. `extmeta` has no
 * control: the importer's external record is refused by the containment of `Lom (id, package)` into
 * `Node (id, tree)` before any alteration, so each negative over it names a law grizzle reports
 * ahead of that one.
 */
const negatives: readonly Negative[] = [
  {
    alter: (draft) => {
      withoutRelationIdentifier(draft);

      const educational = nodeOf(draft, "lom:educational");
      const owner = text(
        rowWhere(draft, metadataArms["lom:educational"], "id", text(educational, "id")),
        "lom",
      );
      const title = of(draft, LomTitle).find((row) => text(row, "lom") === owner);
      assert.isDefined(title, "the educational's record has no title");

      const old = position(title ?? {});
      for (const copy of [...of(draft, LomTitle), ...of(draft, LomObjectTitle)]) {
        if (peek(copy, "lom") === owner && peek(copy, "position") === old) {
          set(copy, "position", 1001n);
        }
      }

      moveUnder(draft, text(title ?? {}, "id"), text(educational, "id"));
    },
    base: "lomrest",
    laws: [admission],
    name: "an edge from lom:educational to lom:title is refused by the Edge containment into Admission",
  },
  ...[" self  assessment ", "exam"].map((written): Negative => ({
    alter: (draft) => {
      withoutRelationIdentifier(draft);

      const value = of(draft, LomValue).find(
        (row) => text(row, "parentKind") === "lom:learningResourceType",
      );
      assert.isDefined(value, "lomrest has no learningResourceType value");
      replaceEverywhere(draft, text(value ?? {}, "value"), written);
      set(value ?? {}, "collapsed", written.trim().replaceAll(/ +/gu, " "));
    },
    base: "lomrest",
    laws: [{ kind: "check", name: "LomLearningResourceType", relation: LomValue.name }],
    name: `a learningResourceType value written ${JSON.stringify(written)} is refused by the LomLearningResourceType check`,
  })),
  {
    base: "nestedqmdBoth",
    laws: [keyOf(QtiMetadata, ["package", "resource"])],
    name: "two QtiMetadata rows for one resource are refused by the key on (package, resource)",
  },
  {
    alter: (draft) => {
      const node = text(first(draft, QtiMetadataInResourceLom), "id");
      const manifestLom = text(first(draft, ManifestLom), "lom");
      set(first(draft, QtiMetadataInResourceLom), "lom", manifestLom);
      moveUnder(draft, node, manifestLom);
    },
    base: "nestedqmd",
    laws: [
      contained(
        side(QtiMetadataInResourceLom, ["lom", "package", "resource"]),
        side(ResourceLom, ["lom", "package", "resource"]),
      ),
    ],
    name: "a QtiMetadataInResourceLom whose lom is the manifest lom is refused by the containment into ResourceLom",
  },
  {
    alter: (draft) => {
      const record = first(draft, QtiMetadataInResourceLom);
      draft.set(QtiMetadataInResourceLom, []);
      set(first(draft, QtiMetadata), "host", "externalLom");
      of(draft, QtiMetadataInExternalLom).push(record);
    },
    base: "nestedqmd",
    laws: [
      contained(
        side(QtiMetadataInExternalLom, ["lom", "package", "resource"]),
        side(ExternalLom, ["lom", "package", "resource"]),
      ),
    ],
    name: "a QtiMetadataInExternalLom whose lom is a resource lom is refused by the containment into ExternalLom",
  },
  {
    alter: (draft) => {
      const manifestMetadata = text(nodeOf(draft, "cp:metadata.manifest"), "id");
      set(first(draft, QtiMetadataInMetadata), "metadata", manifestMetadata);
    },
    base: "filelom",
    laws: [
      contained(
        side(QtiMetadataInMetadata, ["metadata", "resourceNode"]),
        side(ResourceMetadata, ["id", "resource"]),
      ),
    ],
    name: "a QtiMetadataInMetadata whose metadata is the manifest-level cp:metadata is refused by the containment into ResourceMetadata",
  },
  {
    alter: (draft) => {
      draft.set(QtiMetadataInResourceLom, []);
      set(first(draft, QtiMetadata), "host", "externalLom");
    },
    base: "nestedqmd",
    laws: [
      { field: "host", kind: "alternatives", relation: QtiMetadata.name },
      mirrorsLaw(
        side(QtiMetadata, ["id"], [{ field: "host", value: "externalLom" }]),
        side(QtiMetadataInExternalLom, ["id"]),
      ),
    ],
    name: "a QtiMetadata with the host externalLom and no arm row is refused by the alternatives",
  },
  {
    alter: (draft) => {
      const file = text(first(draft, FileMetadata), "file");
      const id = addNode(draft, "cp:metadata.file", file);
      of(draft, FileMetadata).push({ file, id });
    },
    base: "filelom",
    laws: [keyOf(FileMetadata, ["file"])],
    name: "two FileMetadata rows for one file are refused by the key on file",
  },
  {
    alter: (draft) => {
      const fresh = crypto.randomUUID();
      const old = text(first(draft, FileMetadata), "file");
      for (const row of [...of(draft, FileMetadata), ...of(draft, FileLom)]) {
        if (peek(row, "file") === old) {
          set(row, "file", fresh);
        }
      }
    },
    base: "filelom",
    laws: [contained(side(FileMetadata, ["file"]), side(File, ["id"]))],
    name: "a FileMetadata whose file names no File is refused by the containment into File",
  },
  {
    alter: (draft) => {
      const resourceMetadata = text(first(draft, ResourceMetadata), "id");
      const record = first(draft, FileLom);
      set(record, "metadata", resourceMetadata);
      moveUnder(draft, text(record, "lom"), resourceMetadata);
    },
    base: "filelom",
    laws: [contained(side(FileLom, ["metadata", "file"]), side(FileMetadata, ["id", "file"]))],
    name: "a FileLom whose metadata is a resource's cp:metadata is refused by the containment into FileMetadata",
  },
  {
    alter: (draft) => {
      replaceEverywhere(draft, "resourcemetadata/xml", itemType);
    },
    base: "extmeta",
    laws: [contained(side(Document, ["resourceType", "root"]), side(RootOfType, ["type", "root"]))],
    name: "an externalLom Document whose resource type is an item's is refused by the containment into RootOfType",
  },
  {
    alter: (draft) => {
      const lom = text(first(draft, ExternalLom), "lom");
      draft.set(ExternalLom, []);

      const qtiMetadata = text(first(draft, QtiMetadataInExternalLom), "id");
      removeSubtree(draft, qtiMetadata);
      draft.set(
        Lom,
        of(draft, Lom).filter((row) => text(row, "id") !== lom),
      );
    },
    base: "extmeta",
    laws: [mirrorsLaw(side(Document, ["id"], [externalDocument]), side(ExternalLom, ["document"]))],
    name: "an externalLom Document with no ExternalLom row is refused by the mirror",
  },
  {
    alter: (draft) => {
      const document = documentRooted(draft, "externalLom");
      of(draft, DocumentIdentifier).push({
        document: text(document, "id"),
        package: text(document, "package"),
        resource: text(document, "resource"),
        root: "externalLom",
        value: "record",
      });
    },
    base: "extmeta",
    laws: [
      capacity(side(Document, ["id"], [externalDocument]), side(DocumentIdentifier, ["document"]), {
        high: 0n,
        low: 0n,
      }),
    ],
    name: "a DocumentIdentifier for an externalLom Document is refused by the capacity",
  },
  {
    alter: (draft) => {
      const document = documentRooted(draft, "externalLom");
      const path = "meta/copy.xml";
      of(draft, PackageEntry).push({ kind: "file", package: text(document, "package"), path });
      copyDocument(draft, text(document, "id"), new Map([[text(document, "path"), path]]));
    },
    base: "extmeta",
    laws: [keyOf(Document, ["package", "resource"])],
    name: "two ExternalLom rows for one resource are refused by the key on Document (package, resource)",
  },
  {
    alter: (draft) => {
      const document = documentRooted(draft, "externalLom");
      const resources = text(nodeOf(draft, "cp:resources"), "id");
      const resource = addNode(draft, "cp:resource", resources);
      of(draft, Resource).push({
        id: resource,
        identifier: "choice-meta2",
        package: text(document, "package"),
        type: text(document, "resourceType"),
        version: text(document, "version"),
      });
      copyDocument(draft, text(document, "id"), new Map([["choice-meta", "choice-meta2"]]));
    },
    base: "extmeta",
    laws: [keyOf(Document, ["package", "path"])],
    name: "two Document rows for one path are refused by the key on (package, path)",
  },
  {
    alter: (draft) => {
      const other = text(nodeOf(draft, "qmd:qtiMetadata"), "id");
      set(first(draft, ExternalLom), "lom", other);
    },
    base: "extmeta",
    laws: [contained(side(ExternalLom, ["lom", "document"]), side(TreeRoot, ["node", "tree"]))],
    name: "an ExternalLom whose lom is not the record's root is refused by the containment into TreeRoot",
  },
  {
    alter: (draft) => {
      const item = of(draft, Document).find((row) => text(row, "root") === "item");
      assert.isDefined(item, "extmeta has no item document");
      set(first(draft, ExternalLom), "document", text(item ?? {}, "id"));
    },
    base: "extmeta",
    laws: [contained(side(ExternalLom, ["lom", "document"]), side(TreeRoot, ["node", "tree"]))],
    name: "an ExternalLom whose document is the item document is refused by the containment into TreeRoot",
  },
  {
    alter: (draft) => {
      draft.set(OutcomeDocument, []);
    },
    base: "outcome",
    laws: [
      mirrorsLaw(side(Document, ["id"], [outcomesDocument]), side(OutcomeDocument, ["document"])),
    ],
    name: "an outcomes Document with no OutcomeDocument row is refused by the mirror",
  },
  {
    alter: (draft) => {
      const document = documentRooted(draft, "outcomes");
      of(draft, DocumentTitle).push({
        collapsed: "Scores",
        document: text(document, "id"),
        package: text(document, "package"),
        resource: text(document, "resource"),
        root: "outcomes",
        value: "Scores",
      });
    },
    base: "outcome",
    laws: [
      capacity(side(Document, ["id"], [outcomesDocument]), side(DocumentTitle, ["document"]), {
        high: 0n,
        low: 0n,
      }),
    ],
    name: "a DocumentTitle for an outcomes Document is refused by the capacity",
  },
  {
    alter: (draft) => {
      const response = of(draft, Declaration).find((row) => text(row, "kind") === "response");
      assert.isDefined(response, "outcome has no response declaration");
      set(first(draft, OutcomeDocument), "declaration", text(response ?? {}, "id"));
    },
    base: "outcome",
    laws: [contained(side(OutcomeDocument, ["declaration"]), side(OutcomeDeclarationArm, ["id"]))],
    name: "an OutcomeDocument whose declaration is a response declaration is refused by the containment into the outcome arm",
  },
  {
    alter: (draft) => {
      const document = text(first(draft, OutcomeDocument), "document");
      const item = of(draft, Declaration).find(
        (row) => text(row, "kind") === "outcome" && text(row, "document") !== document,
      );
      assert.isDefined(item, "outcome has no item outcome declaration");
      set(first(draft, OutcomeDocument), "declaration", text(item ?? {}, "id"));
    },
    base: "outcome",
    laws: [
      contained(
        side(OutcomeDocument, ["document", "declaration"]),
        side(TreeRoot, ["tree", "node"]),
      ),
    ],
    name: "an OutcomeDocument whose declaration is not the root node is refused by the containment into TreeRoot",
  },
  {
    alter: (draft) => {
      const record = first(draft, OutcomeDocument);
      const identifier = text(record, "identifier");
      set(record, "identifier", "OTHER");
      for (const row of of(draft, DocumentIdentifier)) {
        if (peek(row, "document") === text(record, "document")) {
          set(row, "value", "OTHER");
        }
      }

      assert.notStrictEqual(identifier, "OTHER");
    },
    base: "outcome",
    laws: [
      contained(
        side(OutcomeDocument, ["declaration", "document", "identifier"]),
        side(Declaration, ["id", "document", "identifier"]),
      ),
    ],
    name: "an OutcomeDocument whose identifier differs from its declaration's is refused by the containment into Declaration",
  },
  {
    alter: (draft) => {
      const record = first(draft, OutcomeDocument);
      set(record, "identifier", "OTHER");
      for (const row of of(draft, Declaration)) {
        if (peek(row, "id") === text(record, "declaration")) {
          set(row, "identifier", "OTHER");
        }
      }
    },
    base: "outcome",
    laws: [
      contained(
        side(OutcomeDocument, ["document", "identifier"]),
        side(DocumentIdentifier, ["document", "value"]),
      ),
    ],
    name: "an OutcomeDocument whose identifier differs from the DocumentIdentifier is refused by the containment into DocumentIdentifier",
  },
];

/**
 * The `(parent, child)` pairs of the LOM at-most-one asserts: one per distinct pair, with the path
 * of the parent's context.
 */
const r30Pairs = [
  ...new Map(r30Asserts.map((row) => [`${row.parent} ${row.child}`, row] as const)).values(),
];

/**
 * The kinds whose arm keys `position` as the child's own place among its siblings, which two
 * siblings do not share, so the key is not the statement a second sibling breaks. An identifier's
 * `entry` copies the identifier's position instead, which two entries of one identifier share.
 */
const ownPosition = new Set(["lom:entity"]);

/**
 * The law a second `child` under one `parent` breaks, as the declarations order the statements.
 *
 * The child's arm keys its parent where the schema lists the assert's child kind as a candidate
 * key, and the key is the statement grizzle reports. Otherwise the 80 capacities are lowered to
 * one unique index per child kind, so the statement reported is the first declared for that child
 * kind, whichever parent the pair names.
 */
const lawOfPair = (pair: (typeof r30Pairs)[number]): Law => {
  const keyed = metadataRules.find(
    (rule) => rule.kind === "key" && rule.relation === metadataArms[pair.child],
  );
  if (keyed?.kind === "key" && !ownPosition.has(pair.child)) {
    return keyOf(metadataArms[pair.child], keyed.fields);
  }

  const owner = r30Pairs.find((candidate) => candidate.child === pair.child) ?? pair;

  return capacity(
    side(metadataArms[owner.parent], ["id"]),
    side(Edge, ["parent"], [{ field: "childKind", value: pair.child }]),
    { high: 1n, low: 0n },
  );
};

/**
 * The kinds whose element holds only text, and the text each is written with.
 */
const textLeaves = new Map([
  ["lom:catalog", "URI"],
  ["lom:dateTime", "2026-01-15"],
  ["lom:duration.string", "PT1H"],
  ["lom:entity", "reviewer"],
  ["lom:entry", "urn:example:record"],
  ["lom:id", "M1"],
  ["lom:language", "en"],
  ["lom:maximumVersion", "2.0"],
  ["lom:minimumVersion", "1.0"],
  ["lom:size", "1024"],
  ["lom:source", "LOMv1.0"],
  ["lom:value", "exercise"],
]);

/**
 * The kinds whose element is a `LangString`: one `string` child.
 */
const langStrings = new Set([
  "lom:description",
  "lom:entry.langString",
  "lom:installationRemarks",
  "lom:otherPlatformRequirements",
  "lom:source.langString",
  "lom:version",
]);

/**
 * The kinds whose element is a vocabulary: a `source` and a `value`.
 */
const vocabularies = new Set([
  "lom:aggregationLevel",
  "lom:copyrightAndOtherRestrictions",
  "lom:cost",
  "lom:difficulty",
  "lom:interactivityLevel",
  "lom:interactivityType",
  "lom:kind",
  "lom:name",
  "lom:purpose",
  "lom:role",
  "lom:semanticDensity",
  "lom:status",
  "lom:structure",
  "lom:type",
]);

/**
 * The element of `kind` as `lom` writes it: its local name, without a handle's dotted suffix, and
 * its content by the form the kind has, a container holding nothing.
 */
const elementOf = (kind: string): string => {
  const name = `imsmd:${kind.slice("lom:".length).split(".")[0] ?? ""}`;
  const leaf = textLeaves.get(kind);
  if (leaf !== undefined) {
    return `<${name}>${leaf}</${name}>`;
  }

  if (langStrings.has(kind)) {
    return `<${name}><imsmd:string>a string</imsmd:string></${name}>`;
  }

  return vocabularies.has(kind)
    ? `<${name}><imsmd:source>LOMv1.0</imsmd:source><imsmd:value>exercise</imsmd:value></${name}>`
    : `<${name}/>`;
};

/**
 * `simple`'s manifest with a record of its own on the file `images/sign.png`: a `lom` holding
 * `copies` elements of `child` under the parent that `context` names, each step of the path an
 * element of its own.
 */
const manifestWithRecord = (context: string, child: string, copies: number): string => {
  const steps = context.split("/").slice(1);
  const inner = Array.from({ length: copies }, () => elementOf(child)).join("");
  let body = inner;
  for (const step of steps.toReversed()) {
    body = `<imsmd:${step}>${body}</imsmd:${step}>`;
  }

  return `<file href="images/sign.png"><metadata><imsmd:lom>${body}</imsmd:lom></metadata></file>`;
};

/**
 * The importer's rows for `simple` with the record of {@link manifestWithRecord}.
 */
const recordRows = (context: string, child: string, copies: number) =>
  Effect.gen(function* withRecord() {
    const dir = inject("fixtures").simple;
    const original = new TextDecoder().decode(
      yield* readEntry(dir, "imsmanifest.xml").pipe(Effect.provide(NodeServices.layer)),
    );
    const marker = '<file href="images/sign.png"/>';
    assert.include(original, marker);

    return yield* rowsOfPackage(dir, {
      bytes: new TextEncoder().encode(
        original.replace(marker, manifestWithRecord(context, child, copies)),
      ),
      path: "imsmanifest.xml",
    });
  });

describe.skipIf(!hasLease)(
  "schema/rules.packaging.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, FixtureRowsLayer), { excludeTestServices: true })(
      "the schema's bin 1 rules over the packaging relations, by direct ChangeSet",
      (it) => {
        for (const negative of negatives) {
          it.effect(negative.name, () =>
            Effect.gen(function* refused() {
              const fixtures = yield* FixtureRows;
              const draft = draftOf(fixtures[negative.base]);
              negative.alter?.(draft);

              const outcome = yield* apply(draft);

              assert.strictEqual(outcome.kind, "invariant-rejected");
              if (outcome.kind === "invariant-rejected") {
                const named = negative.laws.find((law) => isDeepStrictEqual(outcome.law, law));
                const reported: unknown = outcome.law;
                assert.deepStrictEqual(reported, named ?? negative.laws[0]);
              }
            }),
          );
        }

        for (const pair of r30Pairs) {
          if (!lomAdmission.some((row) => row.parent === pair.parent && row.child === pair.child)) {
            it.effect(
              `one ${pair.child} under ${pair.parent}, a pair the content model never admits, is refused by the Edge containment into Admission`,
              () =>
                Effect.gen(function* unadmitted() {
                  const outcome = yield* apply(
                    draftOf(yield* recordRows(pair.context, pair.child, 1)),
                  );

                  assert.strictEqual(outcome.kind, "invariant-rejected");
                  if (outcome.kind === "invariant-rejected") {
                    const reported: unknown = outcome.law;
                    assert.deepStrictEqual(reported, admission);
                  }
                }),
            );
            continue;
          }

          it.effect(
            `two ${pair.child} under one ${pair.parent} are refused by the capacity on the ${pair.parent} row`,
            () =>
              Effect.gen(function* capped() {
                const one = yield* apply(draftOf(yield* recordRows(pair.context, pair.child, 1)));

                assert.strictEqual(one.kind, "accepted");

                const outcome = yield* apply(
                  draftOf(yield* recordRows(pair.context, pair.child, 2)),
                );

                assert.strictEqual(outcome.kind, "invariant-rejected");
                if (outcome.kind === "invariant-rejected") {
                  const reported: unknown = outcome.law;
                  assert.deepStrictEqual(reported, lawOfPair(pair));
                }
              }),
          );
        }

        for (const base of ["lomrest", "filelom", "nestedqmd", "outcome"] as const) {
          it.effect(`the unaltered ${base} rows are accepted`, () =>
            Effect.gen(function* accepted() {
              const fixtures = yield* FixtureRows;
              const draft = draftOf(fixtures[base]);
              if (base === "lomrest") {
                withoutRelationIdentifier(draft);
              }

              const outcome = yield* apply(draft);

              assert.strictEqual(outcome.kind, "accepted");
            }),
          );
        }
      },
    );
  },
);
