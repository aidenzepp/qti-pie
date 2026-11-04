import { isDeepStrictEqual } from "node:util";
import { Db } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, it as unitIt, layer } from "@effect/vitest";
import { Context, Effect, Layer, Option, Predicate } from "effect";
import { describe, inject } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { externalRows } from "#qti/import/external.ts";
import { itemRows } from "#qti/import/item.ts";
import { manifestRows } from "#qti/import/manifest.ts";
import { outcomeRows } from "#qti/import/outcome.ts";
import { changeSetOf, retrySchedule } from "#qti/import/package.ts";
import { usageRows } from "#qti/import/usage.ts";
import { kindOf, Rows } from "#qti/import/tree.ts";
import { listPackage, readEntry } from "#qti/package/read.ts";
import { admission as lomAdmission } from "#qti/schema/kinds/lom.ts";
import { Declaration, OutcomeDeclarationArm } from "#qti/schema/declaration.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import {
  CsmCaseItemUri,
  CsmGuid,
  CsmLabel,
  CsmLabelledGuid,
  CsmMetadata,
  CsmMetadataProviderId,
  CsmSet,
  CsmSetOfGuids,
  CsmSetOfGuidsRegion,
  CsmSetOfGuidsVersion,
  CsmSetResourceLabel,
  CsmSetResourcePartId,
} from "#qti/schema/csm.ts";
import { ResourceLomGeneral } from "#qti/schema/lang.ts";
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
import { Admission, AttributeLexical, Edge, Node, Tree, TreeRoot } from "#qti/schema/node.ts";
import { OutcomeDocument } from "#qti/schema/outcome.ts";
import {
  AccessForAllResource,
  DrdAccessMode,
  DrdAccessModeAdapted,
  DrdAdaptationDetail,
  DrdAdaptationMediaType,
  DrdAdaptationType,
  DrdApiInteroperable,
  DrdAtInteroperable,
  DrdControlFlexibility,
  DrdDisplayTransformability,
  DrdEducationalComplexityOfAdaptation,
  DrdEducationalLevelOfAdaptation,
  DrdHasAdaptation,
  DrdHazard,
  DrdIsAdaptationOf,
  DrdIsFullAdaptationOf,
  DrdIsPartialAdaptationOf,
  DrdLanguageOfAdaptation,
  File,
  FileMetadata,
  ManifestId,
  ManifestIdOfManifest,
  ManifestIdOfResource,
  ManifestIdOfVariant,
  Package,
  PackageEntry,
  Resource,
  ResourceMetadata,
  RootOfType,
  Variant,
  VariantMetadata,
} from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import { ResponseProcessing, ResponseProcessingItem } from "#qti/schema/processing.ts";
import { ancestryStepRows, KindEnters } from "#qti/schema/seed/ancestry.ts";
import {
  CategorizedStatisticArm,
  OrdinaryStatisticArm,
  Statistic,
  StatisticCaseCount,
  StatisticGlossary,
  StatisticLastUpdated,
  StatisticStdDeviation,
  StatisticStdError,
  TargetObject,
  UsageData,
  UsageDataGlossary,
  UsageMapEntry,
  UsageMapping,
  UsageMappingLowerBound,
  UsageMappingUpperBound,
  UsageTypedValue,
  UsageValue,
  UsageValueBaseType,
  UsageValueFieldIdentifier,
  TargetObjectPartIdentifier,
  relations as usageRelations,
} from "#qti/schema/usage.ts";
import { materialize } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { fixtureRowsLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";
import { readXml } from "@qti-pie/crust/read.ts";

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
  | { readonly contract: string; readonly kind: "contract" }
  | { readonly flags: "su" | "u"; readonly kind: "pattern"; readonly source: string }
  | { readonly fields: readonly string[]; readonly kind: "primaryKey"; readonly relation: string }
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

/**
 * The pattern law of a column: grizzle reports the regex and its flags and no relation, one law for
 * every column that spells the same language.
 */
const patternLaw = (source: string, flags: "su" | "u" = "u"): Law => ({
  flags,
  kind: "pattern",
  source,
});

/**
 * The contract law of a column: grizzle reports the contract's name and no relation, one law for
 * every column that carries the contract.
 */
const contractLaw = (contract: string): Law => ({ contract, kind: "contract" });

const primaryKeyOf = (relation: AnyRelation, fields: readonly string[]): Law => ({
  fields,
  kind: "primaryKey",
  relation: relation.name,
});

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
  const parentAncestry = text(above, "ancestry");
  const parentKind = text(above, "kind");
  // The ancestry the importer computes for the child: the step of the parent's kind at its ancestry.
  const childAncestry =
    ancestryStepRows([parentKind], KindEnters).find((step) => step.ancestry === parentAncestry)
      ?.next ?? parentAncestry;
  const tree = text(above, "tree");
  const version = text(above, "version");
  let last = 0n;
  for (const edge of of(draft, Edge)) {
    if (text(edge, "parent") === parent && position(edge) > last) {
      last = position(edge);
    }
  }

  of(draft, Node).push({
    ancestry: childAncestry,
    id,
    kind,
    prefix: "",
    rootKind: text(above, "rootKind"),
    tree,
    version,
  });
  of(draft, Edge).push({
    child: id,
    childAncestry,
    childKind: kind,
    parent,
    parentAncestry,
    parentKind,
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
 * Copy the node `root`, every node under it and every row that names one of them under fresh ids,
 * as a second child of the same parent after its last child. A row's reference to anything outside
 * the subtree stays, so the copy hangs under the same parent and names the same owner.
 *
 * @returns The copy's root id.
 */
const copySubtree = (draft: Draft, root: string): string => {
  const old = subtreeIds(draft, root);
  const fresh = new Map([...old].map((id) => [id, crypto.randomUUID()]));
  const parent = text(edgeInto(draft, root), "parent");
  let last = 0n;
  for (const edge of of(draft, Edge)) {
    if (text(edge, "parent") === parent && position(edge) > last) {
      last = position(edge);
    }
  }

  const copied = fresh.get(root) ?? assert.fail("the copied subtree has no new root");
  for (const facts of draft.values()) {
    const copies = facts
      .filter((fact) => Object.values(fact).some((v) => Predicate.isString(v) && old.has(v)))
      .map((fact) =>
        rowOf(
          Object.entries(fact).map(([field, v]) => [
            field,
            Predicate.isString(v) ? (fresh.get(v) ?? v) : v,
          ]),
        ),
      );
    for (const copy of copies) {
      if (
        (peek(copy, "child") === copied || peek(copy, "id") === copied) &&
        Predicate.isBigInt(peek(copy, "position"))
      ) {
        set(copy, "position", last + 2n);
      }
    }

    facts.push(...copies);
  }

  return copied;
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
        resourceLomHasGeneral: Rows.of(built.rows, ResourceLomGeneral).some(
          (general) => general.resource === listed.resource,
        ),
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
      } else if (root === "ud:usageData") {
        ({ rows } = yield* usageRows(
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
      } else if (root === "qti-response-processing") {
        // No builder writes the template document's rows yet: the R16 tests build them by hand.
        continue;
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
    Record<
      | "csm"
      | "extmeta"
      | "filelom"
      | "lomrest"
      | "nestedqmd"
      | "nestedqmdBoth"
      | "outcome"
      | "resproc"
      | "usage3"
      | "usage3Typed"
      | "variant",
      Rows
    >
  >
>()("rules.packaging.test/FixtureRows") {}

const rowsOfFixture = (name: FixtureName) =>
  Effect.flatMap(materialize(name), (dir) => rowsOfPackage(dir));

const FixtureRowsLayer = Layer.effect(
  FixtureRows,
  Effect.all({
    csm: rowsOfFixture("csm"),
    extmeta: rowsOfFixture("extmeta"),
    filelom: rowsOfFixture("filelom"),
    lomrest: rowsOfFixture("lomrest"),
    nestedqmd: rowsOfFixture("nestedqmd"),
    nestedqmdBoth: rowsOfFixture("nestedqmd-both"),
    outcome: rowsOfFixture("outcome"),
    resproc: rowsOfFixture("resproc"),
    usage3: rowsOfFixture("usage3"),
    usage3Typed: rowsOfFixture("usage3-typed"),
    variant: rowsOfFixture("variant"),
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

const admission = contained(
  side(Edge, ["version", "parentKind", "childKind"]),
  side(Admission, ["version", "parent", "child"]),
);

/**
 * The negatives over the packaging relations, each an alteration of one fixture's rows and the law
 * it breaks.
 *
 * Every row but the one named was built by the importer from the fixture, so the alteration is the
 * only change; the unaltered controls at the end of the suite are accepted.
 */
const negatives: readonly Negative[] = [
  {
    alter: (draft) => {
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
    // A response declaration is not the root node of its document's tree either, so this write breaks
    // both containments, and which one the outcome names is the firing-order class, not the caller's choice.
    laws: [
      contained(side(OutcomeDocument, ["declaration"]), side(OutcomeDeclarationArm, ["id"])),
      contained(
        side(OutcomeDocument, ["document", "declaration"]),
        side(TreeRoot, ["tree", "node"]),
      ),
    ],
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
 * The id of the variant's `drd:accessForAllResource`, which the DRD leaves hang under.
 */
const accessForAll = (draft: Draft): string => text(first(draft, AccessForAllResource), "id");

/**
 * The 17 DRD leaves of the variant vocabulary, each with the value it is judged against and the
 * pattern or contract law its column reports. A value outside an enumeration has no `ext:` prefix,
 * which the enumerations admit; the two `normalizedString` leaves admit every string and have no
 * pattern negative.
 */
const drdLeaves = [
  {
    bad: "tactile ",
    handle: "drd:accessMode",
    law: contractLaw("AccessMode"),
    relation: DrdAccessMode,
  },
  {
    bad: "bogus",
    handle: "drd:accessModeAdapted",
    law: contractLaw("AccessModeAdapted"),
    relation: DrdAccessModeAdapted,
  },
  {
    bad: "bogus",
    handle: "drd:adaptationDetail",
    law: patternLaw(patterns.drdAdaptationDetail),
    relation: DrdAdaptationDetail,
  },
  {
    bad: "bogus",
    handle: "drd:adaptationMediaType",
    law: patternLaw(patterns.drdAdaptationMediaType),
    relation: DrdAdaptationMediaType,
  },
  {
    bad: "bogus",
    handle: "drd:adaptationType",
    law: patternLaw(patterns.drdAdaptationType),
    relation: DrdAdaptationType,
  },
  {
    bad: "bogus",
    handle: "drd:apiInteroperable",
    law: patternLaw(patterns.drdApiInteroperable),
    relation: DrdApiInteroperable,
  },
  {
    bad: undefined,
    handle: "drd:atInteroperable",
    law: undefined,
    relation: DrdAtInteroperable,
  },
  {
    bad: "bogus",
    handle: "drd:controlFlexibility",
    law: patternLaw(patterns.drdControlFlexibility),
    relation: DrdControlFlexibility,
  },
  {
    bad: "bogus",
    handle: "drd:displayTransformability",
    law: patternLaw(patterns.drdDisplayTransformability),
    relation: DrdDisplayTransformability,
  },
  {
    bad: "bogus",
    handle: "drd:educationalComplexityOfAdaptation",
    law: patternLaw(patterns.drdEducationalComplexityOfAdaptation),
    relation: DrdEducationalComplexityOfAdaptation,
  },
  {
    bad: undefined,
    handle: "drd:educationalLevelOfAdaptation",
    law: undefined,
    relation: DrdEducationalLevelOfAdaptation,
  },
  {
    bad: "a%zz",
    handle: "drd:hasAdaptation",
    law: contractLaw("DrdAdaptationUri"),
    relation: DrdHasAdaptation,
  },
  { bad: "bogus", handle: "drd:hazard", law: patternLaw(patterns.drdHazard), relation: DrdHazard },
  {
    bad: "a%zz",
    handle: "drd:isAdaptationOf",
    law: contractLaw("DrdAdaptationUri"),
    relation: DrdIsAdaptationOf,
  },
  {
    bad: "a%zz",
    handle: "drd:isFullAdaptationOf",
    law: contractLaw("DrdAdaptationUri"),
    relation: DrdIsFullAdaptationOf,
  },
  {
    bad: "a%zz",
    handle: "drd:isPartialAdaptationOf",
    law: contractLaw("DrdAdaptationUri"),
    relation: DrdIsPartialAdaptationOf,
  },
  {
    bad: undefined,
    handle: "drd:languageOfAdaptation",
    law: undefined,
    relation: DrdLanguageOfAdaptation,
  },
] as const;

/**
 * One of the DRD leaves.
 */
type DrdLeaf = (typeof drdLeaves)[number];

/**
 * Add a DRD leaf of `leaf` with `value` under the variant's `accessForAllResource`.
 */
const addLeaf = (draft: Draft, leaf: DrdLeaf, value: string): void => {
  const owner = accessForAll(draft);
  const id = addNode(draft, leaf.handle, owner);
  of(draft, leaf.relation).push({ id, owner, value });
};

const ordinaryStatistic = (draft: Draft): Row =>
  of(draft, Statistic).find((row) => peek(row, "kind") === "ordinary") ??
  assert.fail("the document has no ordinary statistic");

const categorizedStatistic = (draft: Draft): Row =>
  of(draft, Statistic).find((row) => peek(row, "kind") === "categorized") ??
  assert.fail("the document has no categorized statistic");

const ordinary = [{ field: "kind", value: "ordinary" }] as const;

const categorized = [{ field: "kind", value: "categorized" }] as const;

/**
 * The rows of `relation` whose `field` is `value`.
 */
const rowsWhere = (draft: Draft, relation: AnyRelation, field: string, value: string): Row[] =>
  of(draft, relation).filter((row) => peek(row, field) === value);

/**
 * Remove the subtree of every row of `relation` whose `field` is `value`.
 */
const removeChildren = (
  draft: Draft,
  relation: AnyRelation,
  field: string,
  value: string,
): void => {
  for (const row of rowsWhere(draft, relation, field, value)) {
    removeSubtree(draft, text(row, "id"));
  }
};

/**
 * The arms of a typed usage value, one per base type.
 */
const typedArms = Object.entries(usageRelations)
  .filter(([name]) => name.startsWith("UsageTypedValue") && name !== "UsageTypedValue")
  .map(([, relation]) => relation);

/**
 * One column of the usage-data document with a value outside its pattern, and the alteration that
 * writes that value.
 */
interface UsagePattern {
  readonly alter: (draft: Draft) => void;
  readonly bad: string;
  readonly base: "usage3" | "usage3Typed";
  readonly column: string;
  readonly law: Law;
}

/**
 * Write `value` into the column `field` of the first row of `relation`.
 */
const writeFirst =
  (relation: AnyRelation, field: string, value: string) =>
  (draft: Draft): void => {
    set(first(draft, relation), field, value);
  };

/**
 * Add an optional row of `relation` for the first row of `owner`, whose id the row names.
 */
const addFor =
  (relation: AnyRelation, owner: AnyRelation, value: string, field = "node") =>
  (draft: Draft): void => {
    of(draft, relation).push({ [field]: text(first(draft, owner), "id"), value });
  };

/**
 * Write `value` into every copy of the first typed float value: the typed value and the value it
 * names, whose collapsed form is `collapsed`. The caller writes the arm's.
 *
 * @returns The float arm's row.
 */
const writeTypedCopies = (draft: Draft, value: string, collapsed: string): Row => {
  const arm = first(draft, usageRelations.UsageTypedValueFloat);
  for (const row of rowsWhere(draft, UsageTypedValue, "id", text(arm, "id"))) {
    set(row, "value", value);
  }

  for (const row of rowsWhere(draft, UsageValue, "id", text(arm, "id"))) {
    set(row, "value", value);
    set(row, "collapsed", collapsed);
  }

  return arm;
};

/**
 * The first typed float value written `value`, which the float arm's pattern judges.
 */
const floatWritten =
  (value: string, collapsed: string) =>
  (draft: Draft): void => {
    set(writeTypedCopies(draft, value, collapsed), "value", value);
  };

/**
 * The first typed float value made an `integer` value written `value`: its base type, its copy of
 * it and its arm move together, so the integer arm's pattern is the law it can break.
 */
const floatMadeInteger =
  (value: string) =>
  (draft: Draft): void => {
    const arm = writeTypedCopies(draft, value, value);
    const id = text(arm, "id");
    for (const row of [
      ...rowsWhere(draft, UsageTypedValue, "id", id),
      ...rowsWhere(draft, UsageValueBaseType, "id", id),
    ]) {
      set(row, "baseType", "integer");
    }

    draft.set(
      usageRelations.UsageTypedValueFloat,
      of(draft, usageRelations.UsageTypedValueFloat).filter((row) => row !== arm),
    );
    of(draft, usageRelations.UsageTypedValueInteger).push({ id, value });
  };

/**
 * The columns of the usage-data document that carry a pattern or contract the spec's 4.14 names,
 * each with its value and the law it reports. The two closed rosters, `TargetObjectType` and
 * `BaseType`, name no value outside them, and the `^.*$` patterns of the `replace` and `preserve`
 * text columns admit every string, so none of them has a negative here.
 */
const usagePatterns: readonly UsagePattern[] = [
  {
    alter: writeFirst(Statistic, "name", "1a"),
    bad: "1a",
    base: "usage3",
    column: "Statistic.name",
    law: contractLaw("StatisticName"),
  },
  {
    alter: writeFirst(TargetObjectPartIdentifier, "value", "1a"),
    bad: "1a",
    base: "usage3",
    column: "TargetObjectPartIdentifier.value",
    law: contractLaw("UsagePartIdentifier"),
  },
  {
    alter: addFor(UsageValueFieldIdentifier, UsageValue, "1a", "id"),
    bad: "1a",
    base: "usage3",
    column: "UsageValueFieldIdentifier.value",
    law: contractLaw("UsageFieldIdentifier"),
  },
  {
    alter: writeFirst(Statistic, "context", "a%zz"),
    bad: "a%zz",
    base: "usage3",
    column: "Statistic.context",
    law: contractLaw("StatisticContextUri"),
  },
  {
    alter: addFor(UsageDataGlossary, UsageData, "a%zz"),
    bad: "a%zz",
    base: "usage3",
    column: "UsageDataGlossary.value",
    law: contractLaw("GlossaryUri"),
  },
  {
    alter: writeFirst(StatisticGlossary, "value", "a%zz"),
    bad: "a%zz",
    base: "usage3",
    column: "StatisticGlossary.value",
    law: contractLaw("GlossaryUri"),
  },
  {
    alter: writeFirst(StatisticCaseCount, "value", "1.5"),
    bad: "1.5",
    base: "usage3",
    column: "StatisticCaseCount.value",
    law: contractLaw("UsageCaseCount"),
  },
  {
    alter: writeFirst(StatisticStdError, "value", "x"),
    bad: "x",
    base: "usage3",
    column: "StatisticStdError.value",
    law: contractLaw("StatisticMeasure"),
  },
  {
    alter: addFor(StatisticStdDeviation, Statistic, "x"),
    bad: "x",
    base: "usage3",
    column: "StatisticStdDeviation.value",
    law: contractLaw("StatisticMeasure"),
  },
  {
    alter: writeFirst(UsageMappingLowerBound, "value", "x"),
    bad: "x",
    base: "usage3",
    column: "UsageMappingLowerBound.value",
    law: contractLaw("UsageMappingScore"),
  },
  {
    alter: writeFirst(UsageMappingUpperBound, "value", "x"),
    bad: "x",
    base: "usage3",
    column: "UsageMappingUpperBound.value",
    law: contractLaw("UsageMappingScore"),
  },
  {
    alter: writeFirst(UsageMapping, "defaultValue", "x"),
    bad: "x",
    base: "usage3",
    column: "UsageMapping.defaultValue",
    law: contractLaw("UsageMappingScore"),
  },
  {
    alter: writeFirst(UsageMapEntry, "mappedValue", "x"),
    bad: "x",
    base: "usage3",
    column: "UsageMapEntry.mappedValue",
    law: contractLaw("UsageMappingScore"),
  },
  {
    alter: writeFirst(StatisticLastUpdated, "value", "2004-13-04"),
    bad: "2004-13-04",
    base: "usage3",
    column: "StatisticLastUpdated.value",
    law: patternLaw(patterns.usageDate),
  },
  {
    alter: floatMadeInteger("0.87"),
    bad: "0.87",
    base: "usage3Typed",
    column: "UsageTypedValueInteger.value",
    law: contractLaw("UsageIntegerValue"),
  },
  {
    alter: floatWritten(" 0.87 ", "0.87"),
    bad: " 0.87 ",
    base: "usage3Typed",
    column: "UsageTypedValueFloat.value",
    law: contractLaw("UsageFloatValue"),
  },
];

/**
 * Add, by hand, the rows of an `rptemplate` document for the resource `rp1`: its tree, the root
 * node and its processing row. No builder writes them, so the template-rooted row has none of an
 * item's: no `ResponseProcessingItem`.
 *
 * @returns The document's id.
 */
const templateDocument = (draft: Draft): string => {
  const resource = rowWhere(draft, Resource, "identifier", "rp1");
  const manifest = first(draft, Package);
  const id = crypto.randomUUID();
  const version = text(manifest, "schemaversion");

  of(draft, Tree).push({
    charset: text(first(draft, Tree), "charset"),
    id,
    kind: "document",
    root: "rptemplate",
    version,
  });
  of(draft, Node).push({
    ancestry: "root",
    id,
    kind: "qti-response-processing",
    prefix: "",
    rootKind: "rptemplate",
    tree: id,
    version,
  });
  of(draft, TreeRoot).push({ node: id, tree: id });
  of(draft, Document).push({
    id,
    package: text(manifest, "id"),
    path: "rp/match_correct.xml",
    resource: text(resource, "identifier"),
    resourceType: text(resource, "type"),
    root: "rptemplate",
    version,
  });
  of(draft, ResponseProcessing).push({ id, rootKind: "rptemplate" });

  return id;
};

/**
 * The negatives of the second half: the variant, the DRD record, the manifest's `xs:ID` space, the
 * curriculum standards set, the usage-data document, the template root and the lexical rows. Each
 * is an alteration of one fixture's rows, and the law it breaks, as the first half's.
 */
const packagingNegatives: readonly Negative[] = [
  {
    alter: (draft) => {
      replaceEverywhere(draft, "3.0.0", "3.0.1");
    },
    base: "variant",
    laws: [admission],
    name: "an edge from cp:resource to cpx:variant at the version 3.0.1 is refused by the Edge containment into Admission",
  },
  {
    alter: (draft) => {
      const variant = first(draft, Variant);
      set(variant, "identifierref", text(variant, "resourceIdentifier"));
    },
    base: "variant",
    laws: [{ kind: "check", name: "VariantNotSelf", relation: Variant.name }],
    name: "a Variant whose identifierref is its own resource is refused by the VariantNotSelf check",
  },
  {
    alter: (draft) => {
      set(first(draft, Variant), "identifierref", "nonesuch");
    },
    base: "variant",
    laws: [
      contained(
        side(Variant, ["package", "identifierref"]),
        side(Resource, ["package", "identifier"]),
      ),
    ],
    name: "a Variant whose identifierref names no resource is refused by the containment into Resource",
  },
  {
    alter: (draft) => {
      set(first(draft, Variant), "resourceIdentifier", "elsewhere");
    },
    base: "variant",
    laws: [
      contained(
        side(Variant, ["resource", "package", "resourceIdentifier"]),
        side(Resource, ["id", "package", "identifier"]),
      ),
    ],
    name: "a Variant whose resourceIdentifier is not its parent resource's identifier is refused by the containment into Resource",
  },
  {
    alter: (draft) => {
      copySubtree(draft, text(first(draft, Variant), "id"));
    },
    base: "variant",
    laws: [keyOf(Variant, ["package", "identifier"])],
    name: "two Variant rows for one identifier are refused by the key on (package, identifier)",
  },
  {
    alter: (draft) => {
      removeSubtree(draft, text(first(draft, VariantMetadata), "id"));
    },
    base: "variant",
    laws: [
      capacity(side(Variant, ["id"]), side(VariantMetadata, ["variant"]), { high: 1n, low: 1n }),
    ],
    name: "a Variant with no cpx:metadata is refused by the capacity",
  },
  {
    alter: (draft) => {
      copySubtree(draft, text(first(draft, VariantMetadata), "id"));
    },
    base: "variant",
    laws: [keyOf(VariantMetadata, ["variant"])],
    name: "two VariantMetadata rows for one variant are refused by the key on variant",
  },
  {
    alter: (draft) => {
      removeSubtree(draft, text(first(draft, AccessForAllResource), "id"));
    },
    base: "variant",
    laws: [
      capacity(side(VariantMetadata, ["id"]), side(AccessForAllResource, ["metadata"]), {
        high: 1n,
        low: 1n,
      }),
    ],
    name: "a cpx:metadata with no accessForAllResource is refused by the capacity",
  },
  {
    alter: (draft) => {
      copySubtree(draft, text(first(draft, AccessForAllResource), "id"));
    },
    base: "variant",
    laws: [keyOf(AccessForAllResource, ["metadata"])],
    name: "two AccessForAllResource rows for one cpx:metadata are refused by the key on metadata",
  },
  ...drdLeaves.flatMap((leaf): Negative[] =>
    leaf.bad === undefined || leaf.law === undefined
      ? []
      : [
          {
            alter: (draft) => {
              addLeaf(draft, leaf, leaf.bad);
            },
            base: "variant",
            laws: [leaf.law],
            name: `a ${leaf.handle} value ${JSON.stringify(leaf.bad)} is refused by its ${leaf.law.kind} law`,
          },
        ],
  ),
  ...drdLeaves
    .filter(
      (leaf) =>
        leaf.handle === "drd:atInteroperable" ||
        leaf.handle === "drd:educationalComplexityOfAdaptation",
    )
    .map((leaf): Negative => ({
      alter: (draft) => {
        const value = leaf.handle === "drd:atInteroperable" ? "true" : "simplified";
        addLeaf(draft, leaf, value);
        addLeaf(draft, leaf, value);
      },
      base: "variant",
      laws: [keyOf(leaf.relation, ["owner"])],
      name: `two ${leaf.handle} leaves under one accessForAllResource are refused by the key on owner`,
    })),
  {
    alter: (draft) => {
      const identifier = text(first(draft, Package), "identifier");
      replaceEverywhere(draft, text(first(draft, ManifestIdOfVariant), "id"), identifier);
    },
    base: "variant",
    laws: [primaryKeyOf(ManifestId, ["package", "id"])],
    name: "a ManifestIdOfVariant whose id is the manifest's identifier is refused by the key on ManifestId",
  },
  {
    alter: (draft) => {
      const arm = first(draft, ManifestIdOfManifest);
      draft.set(
        ManifestId,
        of(draft, ManifestId).filter((row) => text(row, "id") !== text(arm, "id")),
      );
      draft.set(ManifestIdOfManifest, []);
    },
    base: "variant",
    laws: [
      mirrorsLaw(
        side(Package, ["id", "identifier"]),
        side(ManifestIdOfManifest, ["package", "id"]),
      ),
    ],
    name: "a Package with no ManifestIdOfManifest row is refused by the mirror",
  },
  {
    alter: (draft) => {
      const arm = of(draft, ManifestIdOfResource)[0] ?? assert.fail("no resource id");
      draft.set(
        ManifestId,
        of(draft, ManifestId).filter((row) => text(row, "id") !== text(arm, "id")),
      );
      draft.set(
        ManifestIdOfResource,
        of(draft, ManifestIdOfResource).filter((row) => row !== arm),
      );
    },
    base: "variant",
    laws: [
      mirrorsLaw(
        side(Resource, ["package", "identifier"]),
        side(ManifestIdOfResource, ["package", "id"]),
      ),
    ],
    name: "a Resource with no ManifestIdOfResource row is refused by the mirror",
  },
  {
    alter: (draft) => {
      const arm = first(draft, ManifestIdOfVariant);
      draft.set(
        ManifestId,
        of(draft, ManifestId).filter((row) => text(row, "id") !== text(arm, "id")),
      );
      draft.set(ManifestIdOfVariant, []);
    },
    base: "variant",
    laws: [
      mirrorsLaw(
        side(Variant, ["package", "identifier"]),
        side(ManifestIdOfVariant, ["package", "id"]),
      ),
    ],
    name: "a Variant with no ManifestIdOfVariant row is refused by the mirror",
  },
  {
    alter: (draft) => {
      of(draft, ManifestId).push({
        holder: "variant",
        id: "orphan",
        package: text(first(draft, Package), "id"),
      });
    },
    base: "variant",
    laws: [{ field: "holder", kind: "alternatives", relation: ManifestId.name }],
    name: "a ManifestId with the holder variant and no ManifestIdOfVariant row is refused by the alternatives",
  },
  {
    alter: (draft) => {
      copySubtree(draft, text(first(draft, CsmSet), "id"));
    },
    base: "csm",
    laws: [
      capacity(
        side(Node, ["id"], [{ field: "kind", value: "cp:metadata.manifest" }]),
        side(CsmSet, ["host"]),
        {
          high: 1n,
          low: 0n,
        },
      ),
    ],
    name: "two CsmSet rows under one manifest-level metadata are refused by the capacity",
  },
  {
    alter: (draft) => {
      const resourceSet = of(draft, CsmSet).find(
        (row) =>
          text(rowWhere(draft, Node, "id", text(row, "host")), "kind") === "cp:metadata.resource",
      );
      copySubtree(draft, text(resourceSet ?? assert.fail("no resource-level set"), "id"));
    },
    base: "csm",
    laws: [
      capacity(
        side(Node, ["id"], [{ field: "kind", value: "cp:metadata.resource" }]),
        side(CsmSet, ["host"]),
        {
          high: 1n,
          low: 0n,
        },
      ),
    ],
    name: "two CsmSet rows under one resource-level metadata are refused by the capacity",
  },
  {
    alter: (draft) => {
      removeChildren(draft, CsmMetadata, "set", text(first(draft, CsmSet), "id"));
    },
    base: "csm",
    laws: [capacity(side(CsmSet, ["id"]), side(CsmMetadata, ["set"]), { high: "*", low: 1n })],
    name: "a CsmSet with no curriculumStandardsMetadata is refused by the capacity",
  },
  {
    alter: (draft) => {
      removeChildren(draft, CsmSetOfGuids, "metadata", text(first(draft, CsmMetadata), "id"));
    },
    base: "csm",
    laws: [
      capacity(side(CsmMetadata, ["id"]), side(CsmSetOfGuids, ["metadata"]), {
        high: "*",
        low: 1n,
      }),
    ],
    name: "a curriculumStandardsMetadata with no setOfGUIDs is refused by the capacity",
  },
  {
    alter: (draft) => {
      removeChildren(draft, CsmLabelledGuid, "setOfGuids", text(first(draft, CsmSetOfGuids), "id"));
    },
    base: "csm",
    laws: [
      capacity(side(CsmSetOfGuids, ["id"]), side(CsmLabelledGuid, ["setOfGuids"]), {
        high: "*",
        low: 1n,
      }),
    ],
    name: "a setOfGUIDs with no labelledGUID is refused by the capacity",
  },
  {
    alter: (draft) => {
      removeChildren(draft, CsmGuid, "labelledGuid", text(first(draft, CsmLabelledGuid), "id"));
    },
    base: "csm",
    laws: [
      capacity(side(CsmLabelledGuid, ["id"]), side(CsmGuid, ["labelledGuid"]), {
        high: 1n,
        low: 1n,
      }),
    ],
    name: "a labelledGUID with no GUID is refused by the capacity",
  },
  ...(
    [
      ["csmd:GUID", CsmGuid, "guid"],
      ["csmd:label", CsmLabel, "label"],
      ["csmd:caseItemURI", CsmCaseItemUri, "urn:example:item"],
    ] as const
  ).map(([handle, relation, value]): Negative => ({
    alter: (draft) => {
      const owner = text(first(draft, CsmLabelledGuid), "id");
      const id = addNode(draft, handle, owner);
      of(draft, relation).push({ id, labelledGuid: owner, value });
    },
    base: "csm",
    laws: [keyOf(relation, ["labelledGuid"])],
    name: `two ${handle} leaves under one labelledGUID are refused by the key on labelledGuid`,
  })),
  {
    alter: (draft) => {
      set(first(draft, CsmCaseItemUri), "value", "a%zz");
    },
    base: "csm",
    laws: [contractLaw("CaseItemUri")],
    name: "a caseItemURI of a%zz is refused by the CaseItemUri contract",
  },
  ...[
    CsmSetResourceLabel,
    CsmSetResourcePartId,
    CsmMetadataProviderId,
    CsmSetOfGuidsRegion,
    CsmSetOfGuidsVersion,
  ].map((relation): Negative => ({
    alter: (draft) => {
      of(draft, relation).push({ node: text(first(draft, relation), "node"), value: "another" });
    },
    base: "csm",
    laws: [primaryKeyOf(relation, ["node"])],
    name: `a second ${relation.name} row for one node is refused by the key on node`,
  })),
  {
    alter: (draft) => {
      draft.set(UsageData, []);
    },
    base: "usage3",
    laws: [
      mirrorsLaw(
        side(Document, ["id"], [{ field: "root", value: "usagedata" }]),
        side(UsageData, ["document"]),
      ),
    ],
    name: "a usagedata Document with no UsageData row is refused by the mirror",
  },
  {
    alter: (draft) => {
      set(first(draft, UsageData), "id", text(first(draft, Statistic), "id"));
    },
    base: "usage3",
    laws: [contained(side(UsageData, ["id", "document"]), side(TreeRoot, ["node", "tree"]))],
    name: "a UsageData whose id is not the root node is refused by the containment into TreeRoot",
  },
  {
    alter: (draft) => {
      removeChildren(draft, TargetObject, "statistic", text(first(draft, Statistic), "id"));
    },
    base: "usage3",
    laws: [
      capacity(side(Statistic, ["id"]), side(TargetObject, ["statistic"]), { high: "*", low: 1n }),
    ],
    name: "a Statistic with no TargetObject is refused by the capacity",
  },
  {
    alter: (draft) => {
      const id = text(ordinaryStatistic(draft), "id");
      draft.set(
        OrdinaryStatisticArm,
        of(draft, OrdinaryStatisticArm).filter((row) => text(row, "id") !== id),
      );
    },
    base: "usage3",
    laws: [
      mirrorsLaw(
        side(Node, ["id"], [{ field: "kind", value: "ud:ordinaryStatistic" }]),
        side(OrdinaryStatisticArm, ["id"]),
      ),
      mirrorsLaw(
        side(Statistic, ["id"], [{ field: "kind", value: "ordinary" }]),
        side(OrdinaryStatisticArm, ["id"]),
      ),
    ],
    name: "an ordinary Statistic with no OrdinaryStatisticArm row is refused by a mirrors law into the arm",
  },
  {
    alter: (draft) => {
      const id = text(categorizedStatistic(draft), "id");
      draft.set(
        CategorizedStatisticArm,
        of(draft, CategorizedStatisticArm).filter((row) => text(row, "id") !== id),
      );
    },
    base: "usage3",
    laws: [
      mirrorsLaw(
        side(Node, ["id"], [{ field: "kind", value: "ud:categorizedStatistic" }]),
        side(CategorizedStatisticArm, ["id"]),
      ),
      mirrorsLaw(
        side(Statistic, ["id"], [{ field: "kind", value: "categorized" }]),
        side(CategorizedStatisticArm, ["id"]),
      ),
    ],
    name: "a categorized Statistic with no CategorizedStatisticArm row is refused by a mirrors law into the arm",
  },
  {
    alter: (draft) => {
      copySubtree(draft, text(first(draft, UsageValue), "id"));
    },
    base: "usage3",
    laws: [keyOf(UsageValue, ["statistic"])],
    name: "two UsageValue rows for one ordinary statistic are refused by the key on statistic",
  },
  {
    alter: (draft) => {
      removeSubtree(draft, text(first(draft, UsageValue), "id"));
    },
    base: "usage3",
    laws: [
      capacity(side(Statistic, ["id"], ordinary), side(UsageValue, ["statistic"]), {
        high: 1n,
        low: 1n,
      }),
    ],
    name: "an ordinary Statistic with no UsageValue is refused by the capacity",
  },
  {
    alter: (draft) => {
      removeSubtree(draft, text(first(draft, UsageMapping), "id"));
    },
    base: "usage3",
    laws: [
      capacity(side(Statistic, ["id"], categorized), side(UsageMapping, ["statistic"]), {
        high: 1n,
        low: 1n,
      }),
    ],
    name: "a categorized Statistic with no UsageMapping is refused by the capacity",
  },
  {
    alter: (draft) => {
      const owner = text(categorizedStatistic(draft), "id");
      const id = addNode(draft, "ud:value", owner);
      of(draft, UsageValue).push({ collapsed: "1", id, statistic: owner, value: "1" });
    },
    base: "usage3",
    laws: [admission],
    name: "an edge from ud:categorizedStatistic to ud:value is refused by the Edge containment into Admission",
  },
  {
    alter: (draft) => {
      copySubtree(draft, text(first(draft, UsageMapping), "id"));
    },
    base: "usage3",
    laws: [keyOf(UsageMapping, ["statistic"])],
    name: "two UsageMapping rows for one categorized statistic are refused by the key on statistic",
  },
  {
    alter: (draft) => {
      removeChildren(draft, UsageMapEntry, "mapping", text(first(draft, UsageMapping), "id"));
    },
    base: "usage3",
    laws: [
      capacity(side(UsageMapping, ["id"]), side(UsageMapEntry, ["mapping"]), {
        high: "*",
        low: 1n,
      }),
    ],
    name: "a UsageMapping with no map entry is refused by the capacity",
  },
  {
    alter: (draft) => {
      const id = text(first(draft, UsageTypedValue), "id");
      draft.set(
        UsageValueBaseType,
        of(draft, UsageValueBaseType).filter((row) => text(row, "id") !== id),
      );
    },
    base: "usage3Typed",
    laws: [mirrorsLaw(side(UsageTypedValue, ["id"]), side(UsageValueBaseType, ["id"]))],
    name: "a UsageTypedValue with no UsageValueBaseType row is refused by the mirror",
  },
  {
    alter: (draft) => {
      const id = text(first(draft, UsageTypedValue), "id");
      for (const relation of [UsageTypedValue, ...typedArms]) {
        draft.set(
          relation,
          of(draft, relation).filter((row) => peek(row, "id") !== id),
        );
      }
    },
    base: "usage3Typed",
    laws: [mirrorsLaw(side(UsageValueBaseType, ["id"]), side(UsageTypedValue, ["id"]))],
    name: "a UsageValueBaseType with no UsageTypedValue row is refused by the mirror",
  },
  {
    alter: (draft) => {
      const typed = first(draft, UsageTypedValue);
      for (const relation of [UsageTypedValue, ...typedArms]) {
        for (const row of rowsWhere(draft, relation, "id", text(typed, "id"))) {
          set(row, "value", "0.5");
        }
      }
    },
    base: "usage3Typed",
    laws: [contained(side(UsageTypedValue, ["id", "value"]), side(UsageValue, ["id", "value"]))],
    name: "a UsageTypedValue whose value differs from its UsageValue is refused by the containment into UsageValue",
  },
  ...usagePatterns.map(({ alter, base, bad, column, law }): Negative => ({
    alter,
    base,
    laws: [law],
    name: `a ${column} of ${JSON.stringify(bad)} is refused by its ${law.kind} law`,
  })),
  {
    alter: (draft) => {
      replaceEverywhere(draft, "imsqti_resprocessing_xmlv3p0", "webcontent");
      templateDocument(draft);
    },
    base: "resproc",
    laws: [contained(side(Document, ["resourceType", "root"]), side(RootOfType, ["type", "root"]))],
    name: "an rptemplate Document whose resource type is webcontent is refused by the containment into RootOfType",
  },
  {
    alter: (draft) => {
      const owner = text(first(draft, Variant), "id");
      of(draft, AttributeLexical).push({
        attribute: "identifier",
        kind: "cpx:variant",
        node: owner,
        value: "v1",
      });
    },
    base: "variant",
    laws: [patternLaw(patterns.uncollapsed, patterns.uncollapsedFlags)],
    name: "an AttributeLexical row holding an already collapsed value is refused by the attribute-lexical pattern",
  },
  {
    alter: (draft) => {
      const node = text(first(draft, Variant), "id");
      for (const value of [" v1", "v1 "]) {
        of(draft, AttributeLexical).push({
          attribute: "identifier",
          kind: "cpx:variant",
          node,
          value,
        });
      }
    },
    base: "variant",
    laws: [primaryKeyOf(AttributeLexical, ["node", "attribute"])],
    name: "two AttributeLexical rows for one attribute of a node are refused by the key on (node, attribute)",
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
 * The `(parent, child)` pairs the LOM content model admits and no R30 assert caps, whose child kind
 * R30 caps under another parent. Each of the 80 capacities selects `Edge` on its parent kind and
 * its child kind, so none of these pairs is capped, as the content model lets it repeat.
 */
const uncappedPairs = [
  { child: "lom:entity", context: "lom/lifeCycle/contribute", parent: "lom:contribute" },
  { child: "lom:language", context: "lom/general", parent: "lom:general" },
  { child: "lom:language", context: "lom/educational", parent: "lom:educational" },
  { child: "lom:description", context: "lom/general", parent: "lom:general" },
  { child: "lom:description", context: "lom/relation/resource", parent: "lom:resource" },
] as const;

unitIt("the LOM pairs an R30 child kind sits in uncapped are the five uncappedPairs", () => {
  const cappedChildren = new Set<string>(r30Pairs.map((row) => row.child));
  const capped = new Set(r30Pairs.map((row) => `${row.parent} ${row.child}`));
  const derived = new Set(
    lomAdmission
      .filter((row) => cappedChildren.has(row.child) && !capped.has(`${row.parent} ${row.child}`))
      .map((row) => `${row.parent} ${row.child}`),
  );
  const named = new Set(uncappedPairs.map((row) => `${row.parent} ${row.child}`));

  assert.deepStrictEqual([...derived].toSorted(), [...named].toSorted());
});

/**
 * The law a second `child` under one `parent` breaks, as the declarations order the statements.
 *
 * The child's arm keys its parent where the schema lists the assert's child kind as a candidate
 * key, and the key is the statement grizzle reports. Otherwise each pair has its own capacity, on
 * the `Edge` rows of that child kind under that parent kind, and that statement is reported.
 */
const lawOfPair = (pair: (typeof r30Pairs)[number]): Law => {
  const keyed = metadataRules.find(
    (rule) => rule.kind === "key" && rule.relation === metadataArms[pair.child],
  );
  if (keyed?.kind === "key" && !ownPosition.has(pair.child)) {
    return keyOf(metadataArms[pair.child], keyed.fields);
  }

  return capacity(
    side(metadataArms[pair.parent], ["id"]),
    side(
      Edge,
      ["parent"],
      [
        { field: "childKind", value: pair.child },
        { field: "parentKind", value: pair.parent },
      ],
    ),
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
    layer(Layer.mergeAll(AuthorAppLayer, FixtureRowsLayer), {
      excludeTestServices: true,
      timeout: fixtureRowsLayerHookTimeoutMs,
    })("the schema's bin 1 rules over the packaging relations, by direct ChangeSet", (it) => {
      for (const negative of [...negatives, ...packagingNegatives]) {
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

              const outcome = yield* apply(draftOf(yield* recordRows(pair.context, pair.child, 2)));

              assert.strictEqual(outcome.kind, "invariant-rejected");
              if (outcome.kind === "invariant-rejected") {
                const reported: unknown = outcome.law;
                assert.deepStrictEqual(reported, lawOfPair(pair));
              }
            }),
        );
      }

      for (const pair of uncappedPairs) {
        it.effect(`R30 over-cap control: one ${pair.child} under ${pair.parent} is accepted`, () =>
          Effect.gen(function* control() {
            const outcome = yield* apply(draftOf(yield* recordRows(pair.context, pair.child, 1)));

            assert.strictEqual(outcome.kind, "accepted");
          }),
        );

        it.effect(
          `two ${pair.child} under one ${pair.parent}, a pair no R30 assert caps, are accepted`,
          () =>
            Effect.gen(function* positive() {
              const outcome = yield* apply(draftOf(yield* recordRows(pair.context, pair.child, 2)));

              assert.strictEqual(outcome.kind, "accepted");
            }),
        );
      }

      for (const base of ["extmeta", "lomrest", "filelom", "nestedqmd", "outcome"] as const) {
        it.effect(`the unaltered ${base} rows are accepted`, () =>
          Effect.gen(function* accepted() {
            const fixtures = yield* FixtureRows;
            const draft = draftOf(fixtures[base]);
            const outcome = yield* apply(draft);

            assert.strictEqual(outcome.kind, "accepted");
          }),
        );
      }

      for (const base of ["csm", "usage3", "usage3Typed", "variant"] as const) {
        it.effect(`the unaltered ${base} rows are accepted`, () =>
          Effect.gen(function* accepted() {
            const fixtures = yield* FixtureRows;
            const outcome = yield* apply(draftOf(fixtures[base]));

            assert.strictEqual(outcome.kind, "accepted");
          }),
        );
      }

      it.effect(
        "an rptemplate Document under imsqti_resprocessing_xmlv3p0, with its ResponseProcessing row and no item row, is accepted",
        () =>
          Effect.gen(function* accepted() {
            const fixtures = yield* FixtureRows;
            const draft = draftOf(fixtures.resproc);
            const document = templateDocument(draft);

            assert.isEmpty(rowsWhere(draft, ResponseProcessingItem, "id", document));

            const outcome = yield* apply(draft);

            assert.strictEqual(outcome.kind, "accepted");
          }),
      );
    });
  },
);
