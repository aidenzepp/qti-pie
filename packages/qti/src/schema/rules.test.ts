/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the schema's field and the roster handle the declaration and value rows name; here it is the typed-or-record choice, not a structure. */
import { isDeepStrictEqual } from "node:util";
import { Db } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Context, Effect, Layer, Predicate } from "effect";
import { describe, inject } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { itemRows } from "#qti/import/item.ts";
import { manifestRows } from "#qti/import/manifest.ts";
import { changeSetOf, retrySchedule } from "#qti/import/package.ts";
import { Rows } from "#qti/import/tree.ts";
import { listPackage, readEntry } from "#qti/package/read.ts";
import { ResourceLomGeneral } from "#qti/schema/lang.ts";
import {
  OutcomeDeclarationArm,
  RecordDeclaration,
  Declaration,
  TypedDeclaration,
} from "#qti/schema/declaration.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import {
  BindingFit,
  ChoiceInteraction,
  InteractionBinding,
  SimpleChoice,
  TypedBinding,
} from "#qti/schema/interaction.ts";
import { AssessmentItem, ItemBody, Prompt } from "#qti/schema/item.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import {
  LomGeneral,
  LomIdentifierEntry,
  LomObjectIdentifier,
  LomObjectTitle,
  QmdTimeDependent,
  QmdToolName,
  QtiMetadata,
  ResourceLom,
  ResourceLomIdentified,
  ResourceLomTitled,
  rules as metadataRules,
} from "#qti/schema/metadata.ts";
import { Admission, AttributeLexical, Edge, Node, Tree } from "#qti/schema/node.ts";
import { ancestryStepRows, KindEnters } from "#qti/schema/seed/ancestry.ts";
import {
  Dependency,
  File,
  Organizations,
  Package,
  PackageEntry,
  Resource,
  ResourceTypeOf,
  RootOfType,
} from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import {
  ResponseProcessing,
  ResponseProcessingItem,
  ResponseProcessingTemplate,
} from "#qti/schema/processing.ts";
import {
  DeclaredValue,
  DefaultValueArm,
  TypedValueSet,
  ValueSet,
  relations as valueRelations,
} from "#qti/schema/value.ts";
import { readXml } from "#qti/xml/read.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

/**
 * A row as a test edits it: every field of the schema is text or a bigint.
 */
type Row = Record<string, string | bigint>;

/**
 * The importer's rows for `SIMPLE`, a mutable copy per relation, which an alteration edits in place
 * before the rows are applied.
 */
type Draft = Map<AnyRelation, Row[]>;

/**
 * One side of a containment or capacity law as grizzle reports it.
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
  | { readonly fields: readonly string[]; readonly kind: "primaryKey"; readonly relation: string }
  | { readonly kind: "check"; readonly name: string; readonly relation: string }
  | { readonly flags: "su" | "u"; readonly kind: "pattern"; readonly source: string }
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

/**
 * A `mirrors` law as grizzle reports it: one direction of the pair.
 */
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
 * The fields of the `key` statement `metadataRules` declares over the QTI metadata record.
 *
 * Campaign decision 12c moves this key to `(package, resource)` in phase 4, so the law is read from
 * the declaration and not spelled here.
 */
const qtiMetadataKey: readonly string[] = metadataRules.flatMap((rule) =>
  rule.kind === "key" && rule.relation === QtiMetadata ? [rule.fields] : [],
)[0] ?? ["<QtiMetadata declares no key>"];

/**
 * The importer's rows for `SIMPLE`, as `importPackage` builds them before its guards run.
 */
const simpleRows = Effect.gen(function* simpleRows() {
  const dir = inject("fixtures").simple;
  const entries = yield* listPackage(dir);
  const manifest = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
  const built = yield* manifestRows(dir, entries, manifest, Rows.empty());
  let { rows } = built;

  for (const listed of built.documents) {
    const item = yield* itemRows(
      {
        doc: yield* readXml(yield* readEntry(dir, listed.path)),
        packageId: built.packageId,
        path: listed.path,
        resource: listed.resource,
        resourceLomHasGeneral: Rows.of(built.rows, ResourceLomGeneral).some(
          (general) => general.resource === listed.resource,
        ),
        resourceType: listed.type,
        version: built.version,
      },
      rows,
    );
    ({ rows } = item);
  }

  return rows;
}).pipe(Effect.provide(NodeServices.layer));

/**
 * The rows of `SIMPLE`, built once for the suite.
 */
class SimpleRows extends Context.Service<SimpleRows, Rows>()("rules.test/SimpleRows") {}

const SimpleRowsLayer = Layer.effect(SimpleRows, simpleRows);

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

/**
 * Read `field` of a row.
 */
const peek = (row: Row, field: string): string | bigint | undefined => row[field];

const text = (row: Row, field: string): string => {
  const value = peek(row, field);

  return Predicate.isString(value) ? value : assert.fail(`${field} is not text`);
};

/**
 * Write `field` of a row.
 */
const set = (row: Row, field: string, value: string | bigint): void => {
  row[field] = value;
};

const position = (row: Row): bigint => {
  const value = peek(row, "position");

  return Predicate.isBigInt(value) ? value : assert.fail("position is not a bigint");
};

/**
 * The first row of `relation`, which a `SIMPLE` draft has exactly one of or whose first is meant.
 */
const first = (draft: Draft, relation: AnyRelation): Row => {
  const [found] = of(draft, relation);
  assert.isDefined(found, relation.name);

  return found ?? {};
};

/**
 * The first node of `kind`.
 */
const nodeOf = (draft: Draft, kind: string): Row => {
  const found = of(draft, Node).find((row) => text(row, "kind") === kind);
  assert.isDefined(found, kind);

  return found ?? {};
};

/**
 * Add a node of `kind` as the last child of `parent`, with the edge into it. The caller adds the
 * arm row.
 *
 * @returns The new node's id.
 */
const addNode = (draft: Draft, kind: string, parent: string): string => {
  const above = of(draft, Node).find((row) => text(row, "id") === parent);
  assert.isDefined(above, parent);

  const id = crypto.randomUUID();
  const parentAncestry = text(above ?? {}, "ancestry");
  const parentKind = text(above ?? {}, "kind");
  // The ancestry the importer computes for the child: the step of the parent's kind at its ancestry.
  const childAncestry =
    ancestryStepRows([parentKind], KindEnters).find((step) => step.ancestry === parentAncestry)
      ?.next ?? parentAncestry;
  const tree = text(above ?? {}, "tree");
  const version = text(above ?? {}, "version");
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
    rootKind: text(above ?? {}, "rootKind"),
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
 * Remove the node `root`, every node under it, and every row of any relation that names one of
 * them: its edges, its arm and its side rows.
 */
const removeSubtree = (draft: Draft, root: string): void => {
  const doomed = new Set([root]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const edge of of(draft, Edge)) {
      if (doomed.has(text(edge, "parent")) && !doomed.has(text(edge, "child"))) {
        doomed.add(text(edge, "child"));
        grew = true;
      }
    }
  }

  for (const [relation, facts] of draft) {
    draft.set(
      relation,
      facts.filter(
        (fact) => !Object.values(fact).some((v) => Predicate.isString(v) && doomed.has(v)),
      ),
    );
  }
};

/**
 * Add a `cp:resource` of `type` with one `cp:file`, which names `choice.xml`.
 *
 * @returns The new resource node's id.
 */
const addResource = (draft: Draft, identifier: string, type: string): string => {
  const id = addNode(draft, "cp:resource", text(nodeOf(draft, "cp:resources"), "id"));
  const packageId = text(first(draft, Package), "id");

  of(draft, Resource).push({ id, identifier, package: packageId, type, version: "3.0.0" });

  const file = addNode(draft, "cp:file", id);
  of(draft, File).push({
    href: "choice.xml",
    id: file,
    package: packageId,
    position: position(of(draft, Edge).find((edge) => text(edge, "child") === file) ?? {}),
    resource: id,
  });

  return id;
};

/**
 * Copy the item document's tree under fresh ids, as the document of a second resource, `choice2`.
 */
const addDocumentCopy = (draft: Draft): void => {
  const tree = text(first(draft, Document), "id");
  const old = new Set([
    tree,
    ...of(draft, Node)
      .filter((row) => text(row, "tree") === tree)
      .map((row) => text(row, "id")),
  ]);
  const fresh = new Map([...old].map((id) => [id, crypto.randomUUID()]));

  addResource(draft, "choice2", "imsqti_item_xmlv3p0");
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

    facts.push(...copies);
  }

  const copy = fresh.get(tree);
  for (const relation of [Document, DocumentIdentifier, DocumentTitle]) {
    for (const row of of(draft, relation)) {
      if (peek(row, "id") === copy || peek(row, "document") === copy) {
        set(row, "resource", "choice2");
      }
    }
  }
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
 * One alteration of the `SIMPLE` rows and the laws it may break: any one of them.
 */
interface Negative {
  readonly alter: (draft: Draft) => void;
  readonly laws: readonly Law[];
  readonly name: string;
}

/**
 * The `Edge` row whose child is `child`.
 */
const edgeInto = (draft: Draft, child: string): Row => {
  const found = of(draft, Edge).find((row) => text(row, "child") === child);
  assert.isDefined(found, child);

  return found ?? {};
};

/**
 * Add a second default value set to the declaration `declarationId`, holding one float value, so
 * that only the key on `(declaration, role)` is broken.
 */
const addDefaultSet = (draft: Draft, declarationId: string): void => {
  const set_ = addNode(draft, "qti-default-value", declarationId);
  const old = of(draft, TypedValueSet).find((row) => text(row, "declaration") === declarationId);
  assert.isDefined(old, declarationId);

  of(draft, ValueSet).push({
    declaration: declarationId,
    id: set_,
    role: "default",
    shape: "typed",
  });
  of(draft, TypedValueSet).push({
    baseType: text(old ?? {}, "baseType"),
    cardinality: text(old ?? {}, "cardinality"),
    declaration: declarationId,
    id: set_,
  });
  of(draft, DefaultValueArm).push({ id: set_ });

  const value = addNode(draft, "qti-value", set_);
  of(draft, DeclaredValue).push({
    baseType: "float",
    id: value,
    position: position(edgeInto(draft, value)),
    shape: "typed",
    valueSet: set_,
  });
  of(draft, valueRelations.DeclaredValueFloat).push({ id: value, value: "1" });
};

/**
 * The `Declaration` row of `identifier`.
 */
const declarationOf = (draft: Draft, identifier: string): Row => {
  const found = of(draft, Declaration).find((row) => text(row, "identifier") === identifier);
  assert.isDefined(found, identifier);

  return found ?? {};
};

/**
 * Give the `RESPONSE` declaration the base type `float` in every copy: its typed row, its correct
 * value set, the value of that set (an identifier arm becomes a float arm), and the binding's.
 */
const retypeResponseAsFloat = (draft: Draft): void => {
  const id = text(declarationOf(draft, "RESPONSE"), "id");
  for (const relation of [TypedDeclaration, TypedValueSet, TypedBinding]) {
    for (const row of of(draft, relation)) {
      if (
        peek(row, "id") === id ||
        peek(row, "declaration") === id ||
        peek(row, "node") !== undefined
      ) {
        set(row, "baseType", "float");
      }
    }
  }

  const sets = new Set(
    of(draft, ValueSet)
      .filter((row) => text(row, "declaration") === id)
      .map((row) => text(row, "id")),
  );
  for (const row of of(draft, DeclaredValue)) {
    if (sets.has(text(row, "valueSet"))) {
      set(row, "baseType", "float");
      draft.set(
        valueRelations.DeclaredValueIdentifier,
        of(draft, valueRelations.DeclaredValueIdentifier).filter(
          (arm) => text(arm, "id") !== text(row, "id"),
        ),
      );
      of(draft, valueRelations.DeclaredValueFloat).push({ id: text(row, "id"), value: "1" });
    }
  }
};

/**
 * Each alteration changes `SIMPLE`'s rows so that exactly one statement of the schema is broken,
 * and every copy of an altered field is altered with it, so a refusal by another statement is a
 * finding.
 */
const negatives: readonly Negative[] = [
  {
    alter: (draft) => {
      Object.assign(edgeInto(draft, text(nodeOf(draft, "qti-simple-choice"), "id")), {
        parent: text(nodeOf(draft, "qti-prompt"), "id"),
        parentKind: "qti-prompt",
        position: 1000n,
      });
    },
    laws: [
      contained(
        side(Edge, ["version", "parentKind", "childKind"]),
        side(Admission, ["version", "parent", "child"]),
      ),
    ],
    name: "an edge from qti-prompt to qti-simple-choice is refused by Admission",
  },
  {
    alter: (draft) => {
      const edge = edgeInto(draft, text(nodeOf(draft, "qti-simple-choice"), "id"));
      of(draft, Edge).push({ ...edge, position: 1000n });
    },
    laws: [keyOf(Edge, ["child"])],
    name: "two edges with one child are refused by the key on Edge.child",
  },
  {
    alter: (draft) => {
      const tree = text(first(draft, Document), "id");
      for (const row of [...of(draft, Node), ...of(draft, Edge)]) {
        if (text(row, "tree") === tree) {
          set(row, "version", "3.0.1");
        }
      }
    },
    laws: [
      contained(side(Node, ["tree", "version", "rootKind"]), side(Tree, ["id", "version", "root"])),
    ],
    name: "a node whose version differs from its tree's is refused by the containment into Tree",
  },
  {
    alter: (draft) => {
      addResource(draft, "lti", "imslti_xmlv1p1");
    },
    laws: [
      contained(side(Resource, ["version", "type"]), side(ResourceTypeOf, ["version", "type"])),
    ],
    name: "a 3.0.0 resource of type imslti_xmlv1p1 is refused by the containment into ResourceTypeOf",
  },
  {
    alter: (draft) => {
      const type = "imsqti_test_xmlv3p0";
      for (const relation of [
        Resource,
        ResourceLom,
        ResourceLomIdentified,
        ResourceLomTitled,
        LomObjectIdentifier,
        LomObjectTitle,
      ]) {
        for (const row of of(draft, relation)) {
          set(row, "type", type);
        }
      }

      set(first(draft, Document), "resourceType", type);
    },
    laws: [contained(side(Document, ["resourceType", "root"]), side(RootOfType, ["type", "root"]))],
    name: "an item document whose resource types read imsqti_test_xmlv3p0 is refused by the containment into RootOfType",
  },
  {
    alter: (draft) => {
      addResource(draft, "choice", "imsqti_item_xmlv3p0");
    },
    laws: [keyOf(Resource, ["package", "identifier"])],
    name: "two resources with one (package, identifier) are refused by the key",
  },
  {
    alter: (draft) => {
      set(first(draft, File), "href", "missing.xml");
    },
    laws: [contained(side(File, ["package", "href"]), side(PackageEntry, ["package", "path"]))],
    name: "a file whose href names no entry is refused by the containment into PackageEntry",
  },
  {
    alter: (draft) => {
      set(first(draft, File), "href", "../x");
    },
    laws: [{ flags: "u", kind: "pattern", source: patterns.hrefInPackage }],
    name: "a file with href ../x is refused by the href pattern",
  },
  {
    alter: (draft) => {
      const resource = first(draft, Resource);
      const id = addNode(draft, "cp:dependency", text(resource, "id"));
      of(draft, Dependency).push({
        id,
        package: text(resource, "package"),
        resource: text(resource, "identifier"),
        target: text(resource, "identifier"),
      });
    },
    laws: [{ kind: "check", name: "DependencyNotSelf", relation: Dependency.name }],
    name: "a dependency whose target is its own resource is refused by DependencyNotSelf",
  },
  {
    alter: addDocumentCopy,
    laws: [keyOf(Document, ["package", "path"])],
    name: "two documents with one (package, path) are refused by the key",
  },
  {
    alter: (draft) => {
      draft.set(DocumentIdentifier, []);
    },
    laws: [
      capacity(
        side(Document, ["id"], [{ field: "root", value: "item" }]),
        side(DocumentIdentifier, ["document"]),
        { high: 1n, low: 1n },
      ),
      contained(
        side(LomObjectIdentifier, ["package", "resource", "collapsed"]),
        side(DocumentIdentifier, ["package", "resource", "value"]),
      ),
    ],
    name: "an item document with no identifier row is refused by the capacity on Document or the containment into DocumentIdentifier",
  },
  {
    alter: (draft) => {
      removeSubtree(draft, text(nodeOf(draft, "cp:organizations"), "id"));
    },
    laws: [
      capacity(side(Package, ["id"]), side(Organizations, ["manifest"]), { high: 1n, low: 1n }),
    ],
    name: "a package whose cp:organizations subtree is removed is refused by the capacity on Package",
  },
  {
    alter: (draft) => {
      for (const file of of(draft, File)) {
        removeSubtree(draft, text(file, "id"));
      }
    },
    laws: [capacity(side(Resource, ["id"]), side(File, ["resource"]), { high: "*", low: 1n })],
    name: "a resource whose cp:file subtrees are removed is refused by the capacity on Resource",
  },
  {
    alter: (draft) => {
      const lom = text(first(draft, ResourceLom), "lom");
      of(draft, LomGeneral).push({ id: addNode(draft, "lom:general", lom), lom });
    },
    laws: [keyOf(LomGeneral, ["lom"])],
    name: "two LomGeneral rows for one lom are refused by the key",
  },
  {
    alter: (draft) => {
      set(first(draft, LomObjectIdentifier), "collapsed", "other");
      Object.assign(first(draft, LomIdentifierEntry), { collapsed: "other", value: "other" });
    },
    laws: [
      contained(
        side(LomObjectIdentifier, ["package", "resource", "collapsed"]),
        side(DocumentIdentifier, ["package", "resource", "value"]),
      ),
    ],
    name: "a LomObjectIdentifier that differs from the document's identifier is refused by the containment",
  },
  {
    alter: (draft) => {
      const existing = first(draft, QtiMetadata);
      const above = of(draft, Edge).find((edge) => text(edge, "child") === text(existing, "id"));
      assert.isDefined(above, "the first QtiMetadata's node has a parent");
      of(draft, QtiMetadata).push({
        host: text(existing, "host"),
        id: addNode(draft, "qmd:qtiMetadata", text(above ?? {}, "parent")),
        package: text(existing, "package"),
        resource: text(existing, "resource"),
      });
    },
    laws: [keyOf(QtiMetadata, qtiMetadataKey)],
    name: "two QtiMetadata for one resource are refused by the key the relation declares",
  },
  {
    alter: (draft) => {
      const qtiMetadata = text(first(draft, QtiMetadata), "id");
      of(draft, QmdTimeDependent).push({
        id: addNode(draft, "qmd:timeDependent", qtiMetadata),
        qtiMetadata,
        value: "true",
      });
    },
    laws: [keyOf(QmdTimeDependent, ["qtiMetadata"])],
    name: "two qmd:timeDependent leaves under one qtiMetadata are refused by the key",
  },
  {
    alter: (draft) => {
      const qtiMetadata = text(first(draft, QtiMetadata), "id");
      of(draft, QmdToolName).push({
        id: addNode(draft, "qmd:toolName", qtiMetadata),
        qtiMetadata,
        value: "x".repeat(257),
      });
    },
    laws: [{ flags: "su", kind: "pattern", source: patterns.toolString }],
    name: "a QmdToolName of 257 characters is refused by the tool string pattern",
  },
  {
    alter: (draft) => {
      of(draft, AttributeLexical).push({
        attribute: "adaptive",
        kind: "qti-assessment-item",
        node: text(first(draft, AssessmentItem), "id"),
        value: "false",
      });
    },
    laws: [{ flags: "su", kind: "pattern", source: patterns.uncollapsed }],
    name: "an AttributeLexical already collapsed is refused by the uncollapsed pattern",
  },
  {
    alter: (draft) => {
      const node = text(first(draft, AssessmentItem), "id");
      of(draft, AttributeLexical).push(
        { attribute: "adaptive", kind: "qti-assessment-item", node, value: " false" },
        { attribute: "adaptive", kind: "qti-assessment-item", node, value: "false " },
      );
    },
    laws: [{ fields: ["node", "attribute"], kind: "primaryKey", relation: AttributeLexical.name }],
    name: "two AttributeLexical rows for one (node, attribute) are refused by the primary key",
  },

  {
    alter: (draft) => {
      const row = declarationOf(draft, "SCORE");
      set(row, "identifier", "duration");
      for (const typed of of(draft, TypedDeclaration)) {
        if (peek(typed, "id") === peek(row, "id")) {
          set(typed, "identifier", "duration");
        }
      }
    },
    laws: [{ kind: "check", name: "DeclarationNotReserved", relation: Declaration.name }],
    name: "a declaration named duration is refused by DeclarationNotReserved",
  },
  {
    alter: (draft) => {
      const item = text(first(draft, Document), "id");
      const id = addNode(draft, "qti-outcome-declaration", item);
      of(draft, Declaration).push({
        document: item,
        id,
        identifier: "RESPONSE",
        kind: "outcome",
        shape: "record",
      });
      of(draft, RecordDeclaration).push({ id });
      of(draft, OutcomeDeclarationArm).push({ id });
    },
    laws: [keyOf(Declaration, ["document", "identifier"])],
    name: "two declarations named RESPONSE are refused by the key on Declaration",
  },
  {
    alter: (draft) => {
      const row = of(draft, DeclaredValue).find((value) => text(value, "baseType") === "float");
      assert.isDefined(row, "float value");
      set(row ?? {}, "baseType", "identifier");

      const id = text(row ?? {}, "id");
      draft.set(
        valueRelations.DeclaredValueFloat,
        of(draft, valueRelations.DeclaredValueFloat).filter((arm) => text(arm, "id") !== id),
      );
      of(draft, valueRelations.DeclaredValueIdentifier).push({ id, value: "ChoiceA" });
    },
    laws: [
      contained(
        side(DeclaredValue, ["valueSet", "baseType"], [{ field: "shape", value: "typed" }]),
        side(TypedValueSet, ["id", "baseType"]),
      ),
    ],
    name: "an identifier value under the float default set is refused by the containment into TypedValueSet",
  },
  {
    alter: (draft) => {
      const set_ = text(
        of(draft, ValueSet).find((row) => text(row, "role") === "default") ?? {},
        "id",
      );
      const value = addNode(draft, "qti-value", set_);
      of(draft, DeclaredValue).push({
        baseType: "float",
        id: value,
        position: position(edgeInto(draft, value)),
        shape: "typed",
        valueSet: set_,
      });
      of(draft, valueRelations.DeclaredValueFloat).push({ id: value, value: "1" });
    },
    laws: [
      capacity(
        side(TypedValueSet, ["id"], [{ field: "cardinality", value: "single" }]),
        side(DeclaredValue, ["valueSet"]),
        { high: 1n, low: 1n },
      ),
    ],
    name: "two values under a single value set are refused by the single capacity",
  },
  {
    alter: (draft) => {
      const set_ = text(
        of(draft, ValueSet).find((row) => text(row, "role") === "default") ?? {},
        "id",
      );
      for (const value of of(draft, DeclaredValue).filter((v) => text(v, "valueSet") === set_)) {
        removeSubtree(draft, text(value, "id"));
      }
    },
    laws: [
      capacity(
        side(TypedValueSet, ["id"], [{ field: "cardinality", value: "single" }]),
        side(DeclaredValue, ["valueSet"]),
        { high: 1n, low: 1n },
      ),
      capacity(side(ValueSet, ["id"]), side(DeclaredValue, ["valueSet"]), { high: "*", low: 1n }),
    ],
    name: "a value set whose qti-value subtrees are removed is refused by the presence or the single capacity",
  },
  {
    alter: (draft) => {
      addDefaultSet(draft, text(declarationOf(draft, "SCORE"), "id"));
    },
    laws: [keyOf(ValueSet, ["declaration", "role"])],
    name: "two default value sets for one declaration are refused by the key on ValueSet",
  },
  {
    alter: (draft) => {
      for (const relation of [InteractionBinding, TypedBinding, ChoiceInteraction]) {
        for (const row of of(draft, relation)) {
          set(row, "responseIdentifier", "UNDECLARED");
        }
      }
    },
    laws: [
      contained(
        side(InteractionBinding, ["document", "responseIdentifier"]),
        side(Declaration, ["document", "identifier"], [{ field: "kind", value: "response" }]),
      ),
      contained(
        side(InteractionBinding, ["document", "responseIdentifier", "shape"]),
        side(Declaration, ["document", "identifier", "shape"]),
      ),
    ],
    name: "a binding that names an undeclared identifier is refused by the containment into Declaration",
  },
  {
    alter: (draft) => {
      draft.set(InteractionBinding, []);
      draft.set(TypedBinding, []);
    },
    laws: [
      contained(
        side(
          ChoiceInteraction,
          ["id", "responseIdentifier"],
          [{ field: "rootKind", value: "item" }],
        ),
        side(InteractionBinding, ["node", "responseIdentifier"]),
      ),
    ],
    name: "a choice interaction with no binding is refused by the containment into InteractionBinding",
  },
  {
    alter: (draft) => {
      retypeResponseAsFloat(draft);
    },
    laws: [
      contained(
        side(TypedBinding, ["interactionKind", "baseType", "cardinality"]),
        side(BindingFit, ["interactionKind", "baseType", "cardinality"]),
      ),
    ],
    name: "a float binding to a choice interaction is refused by the containment into BindingFit",
  },
  {
    alter: (draft) => {
      set(first(draft, TypedBinding), "maxCount", 2n);
      Object.assign(first(draft, ChoiceInteraction), { maxChoices: "2", maxChoicesN: 2n });
    },
    laws: [{ kind: "check", name: "BindingMax", relation: TypedBinding.name }],
    name: "a binding with maxCount 2 on a single variable is refused by BindingMax",
  },
  {
    alter: (draft) => {
      for (const choice of of(draft, SimpleChoice)) {
        removeSubtree(draft, text(choice, "id"));
      }
    },
    laws: [
      capacity(side(ChoiceInteraction, ["id"]), side(SimpleChoice, ["interaction"]), {
        high: "*",
        low: 1n,
      }),
    ],
    name: "a choice interaction whose qti-simple-choice subtrees are removed is refused by the capacity",
  },
  {
    alter: (draft) => {
      Object.assign(first(draft, ChoiceInteraction), {
        maxChoices: "1",
        maxChoicesN: 1n,
        minChoices: "2",
        minChoicesN: 2n,
      });
    },
    laws: [{ kind: "check", name: "ChoiceBounds", relation: ChoiceInteraction.name }],
    name: "minChoices 2 above maxChoices 1 is refused by ChoiceBounds",
  },
  {
    alter: (draft) => {
      const [, second] = of(draft, SimpleChoice);
      set(second ?? {}, "identifier", "ChoiceA");
    },
    laws: [keyOf(SimpleChoice, ["interaction", "identifier"])],
    name: "two choices named ChoiceA are refused by the key on SimpleChoice",
  },
  {
    alter: (draft) => {
      const parent = text(first(draft, ChoiceInteraction), "id");
      of(draft, Prompt).push({ id: addNode(draft, "qti-prompt", parent), parent });
    },
    laws: [keyOf(Prompt, ["parent"])],
    name: "two prompts for one parent are refused by the key on Prompt",
  },
  {
    alter: (draft) => {
      const item = text(first(draft, ItemBody), "item");
      of(draft, ItemBody).push({ id: addNode(draft, "qti-item-body", item), item });
    },
    laws: [keyOf(ItemBody, ["item"])],
    name: "two item bodies for one item are refused by the key on ItemBody",
  },
  {
    alter: (draft) => {
      const item = text(first(draft, ResponseProcessingItem), "item");
      const id = addNode(draft, "qti-response-processing", item);
      of(draft, ResponseProcessing).push({ id, rootKind: "item" });
      of(draft, ResponseProcessingItem).push({ id, item });
    },
    laws: [keyOf(ResponseProcessingItem, ["item"])],
    name: "two response processing rows for one item are refused by the key on ResponseProcessingItem",
  },
  {
    alter: (draft) => {
      draft.set(ResponseProcessingItem, []);
    },
    laws: [
      mirrorsLaw(
        side(ResponseProcessing, ["id"], [{ field: "rootKind", value: "item" }]),
        side(ResponseProcessingItem, ["id"]),
      ),
    ],
    name: "an item-rooted response processing with no ResponseProcessingItem is refused by the mirror",
  },
  {
    alter: (draft) => {
      const item = text(first(draft, ResponseProcessingItem), "item");
      removeSubtree(draft, text(nodeOf(draft, "qti-response-processing"), "id"));
      of(draft, ResponseProcessingItem).push({
        id: text(nodeOf(draft, "qti-item-body"), "id"),
        item,
      });
    },
    laws: [
      mirrorsLaw(
        side(ResponseProcessingItem, ["id"]),
        side(ResponseProcessing, ["id"], [{ field: "rootKind", value: "item" }]),
      ),
    ],
    name: "a ResponseProcessingItem with no item-rooted response processing is refused by the mirror",
  },
  // The structural row of the spec's 4.10 bin 1 table, "a base type exists exactly when the shape is typed", has no negative: a record declaration's rows and a typed one's are arms of one `alternatives`, so no row can carry a base type without its arm, and none can omit it.
  ...["a%zz", "http://[::1", "1a:b"].map((uri): Negative => ({
    alter: (draft) => {
      set(first(draft, ResponseProcessingTemplate), "uri", uri);
    },
    laws: [{ flags: "u", kind: "pattern", source: patterns.anyUri }],
    name: `a response processing template ${uri} is refused by the anyUri pattern`,
  })),
];

describe.skipIf(!hasLease)(
  "schema/rules.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, SimpleRowsLayer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the schema's bin 1 rules, by direct ChangeSet", (it) => {
      for (const negative of negatives) {
        it.effect(negative.name, () =>
          Effect.gen(function* refused() {
            const draft = draftOf(yield* SimpleRows);
            negative.alter(draft);

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

      it.effect("the unaltered rows are accepted, so each refusal above is its alteration's", () =>
        Effect.gen(function* accepted() {
          const outcome = yield* apply(draftOf(yield* simpleRows));

          assert.strictEqual(outcome.kind, "accepted");
        }),
      );
    });
  },
);
