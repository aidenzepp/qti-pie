/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column the `Declaration` and `ItemTool` rows name: the typed-or-record choice and the tool attributes written, not a structure. */
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Db } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Context, Effect, FileSystem, Layer, Predicate } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { changeSetOf, importPackage, readRows, retrySchedule } from "#pantry/import/package.ts";
import { ImportRefused, isMappedLaw, ruleOfLaw } from "#pantry/import/refusal.ts";
import type { ImportLaw, Rule } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { NodeLabel, NodeXmlLang } from "#pantry/schema/attributes.ts";
import {
  ContextDeclarationArm,
  Declaration,
  DeclarationNormalMaximum,
  OutcomeDeclarationArm,
  ResponseDeclarationArm,
  ResponseDeclarationId,
  TypedDeclaration,
} from "#pantry/schema/declaration.ts";
import { ContextDeclarationId, DocumentId, DocumentIdentifier } from "#pantry/schema/document.ts";
import { AssessmentItemLabel, ItemTool, ItemToolBoth, ItemToolName } from "#pantry/schema/item.ts";
import { InteractionBinding } from "#pantry/schema/interaction.ts";
import { FeedbackBlock } from "#pantry/schema/feedback.ts";
import { DocumentLang, ResourceLomGeneral, ResourceLomLanguageSet } from "#pantry/schema/lang.ts";
import {
  AreaMapping,
  MapEntry,
  MappableBaseType,
  Mapping,
  MatchTable,
  relations as mappingRelations,
} from "#pantry/schema/mapping.ts";
import { Lom, LomGeneral, LomLanguage, LomMetaMetadata } from "#pantry/schema/metadata.ts";
import { Edge, Node } from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { rowsOf } from "#pantry/test/rows.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The directory every export is written under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The fixtures whose importer rows the direct alterations edit: `cut-choice` for the item
 * attributes and `xml:lang` of an item (a 3.0.1 item), `cut-text-entry` for the declarations of an
 * item, `cut-extended-text` for a 3.0.0 item and `simple` for the manifest, whose resource has a
 * LOM `general` that lists no language.
 */
const bases = [
  "cut-choice",
  "cut-extended-text",
  "cut-text-entry",
  "simple",
] as const satisfies readonly FixtureName[];

/**
 * A row as a test edits it: every field of the schema is text or a bigint.
 */
type Row = Record<string, string | bigint>;

/**
 * The importer's rows for one fixture, a mutable copy per relation, which an alteration edits in
 * place before the rows are applied.
 */
type Draft = Map<AnyRelation, Row[]>;

/**
 * One side of a containment law as grizzle reports it.
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
  | { readonly kind: "check"; readonly name: string; readonly relation: string }
  | { readonly flags: "su" | "u"; readonly kind: "pattern"; readonly source: string }
  | { readonly contract: string; readonly kind: "contract" }
  | { readonly from: Side; readonly kind: "contained"; readonly to: Side };

const side = (
  relation: AnyRelation,
  fields: readonly string[],
  selection: Side["selection"] = [],
): Side => ({ fields, relation: relation.name, selection });

const containedLaw = (from: Side, to: Side): Law => ({ from, kind: "contained", to });

const checkLaw = (relation: AnyRelation, name: string): Law => ({
  kind: "check",
  name,
  relation: relation.name,
});

const patternLaw = (source: string): Law => ({ flags: "u", kind: "pattern", source });

const contractLaw = (contract: string): Law => ({ contract, kind: "contract" });

/**
 * The rows of every base fixture, read once for the suite.
 */
class BaseRows extends Context.Service<BaseRows, ReadonlyMap<FixtureName, Rows>>()(
  "content-c.test/BaseRows",
) {}

const BaseRowsLayer = Layer.effect(
  BaseRows,
  Effect.gen(function* readBaseRows() {
    const entries = yield* Effect.all(
      bases.map((name) =>
        Effect.gen(function* readOne() {
          const { rows } = yield* readRows(yield* materialize(name));

          return [name, rows] as const;
        }),
      ),
    );

    return new Map(entries);
  }),
).pipe(Layer.provide(NodeServices.layer));

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
 * Whether `value` is spelled as a UUID: 36 characters with a hyphen after the 8th, 13th, 18th and
 * 23rd.
 */
const isUuid = (value: string): boolean =>
  value.length === 36 && [8, 13, 18, 23].every((at) => value[at] === "-");

/**
 * The draft with every UUID replaced by a fresh one, the same everywhere it appears, so that a test
 * that is accepted leaves no row another test's rows collide with.
 */
const fresh = (draft: Draft): Draft => {
  const ids = new Map<string, string>();
  const renamed = (value: string): string => {
    if (!isUuid(value)) {
      return value;
    }

    const known = ids.get(value);
    if (known !== undefined) {
      return known;
    }

    const next = randomUUID();
    ids.set(value, next);

    return next;
  };

  return new Map(
    [...draft].map(([relation, rows]) => [
      relation,
      rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([field, value]): [string, string | bigint] => [
            field,
            Predicate.isString(value) ? renamed(value) : value,
          ]),
        ),
      ),
    ]),
  );
};

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

const text = (row: Row, field: string): string => {
  const value = row[field];

  return Predicate.isString(value) ? value : assert.fail(`${field} is not text`);
};

/**
 * The first row of `relation` that `matches`, which the fixture has by construction.
 */
const find = (draft: Draft, relation: AnyRelation, matches: (row: Row) => boolean = () => true) => {
  const found = of(draft, relation).find(matches);
  assert.isDefined(found, relation.name);

  return found ?? {};
};

/**
 * The first node of `kind`.
 */
const nodeOf = (draft: Draft, kind: string): Row =>
  find(draft, Node, (row) => text(row, "kind") === kind);

const idOf = (draft: Draft, kind: string): string => text(nodeOf(draft, kind), "id");

/**
 * A node of the draft as an edge names it.
 */
interface Placed {
  readonly ancestry: string;
  readonly id: string;
  readonly kind: string;
}

const placedOf = (draft: Draft, kind: string): Placed => ({
  ancestry: text(nodeOf(draft, kind), "ancestry"),
  id: idOf(draft, kind),
  kind,
});

/**
 * Add a childless node of `kind` as the last child of `parent`, at the ancestry `parent` is at,
 * with its arm row `arm` (when it has one), in the tree of `like`. The edge's position starts at
 * 1000, clear of the fixture's own.
 *
 * @returns The new node, placed, and the position of its edge.
 */
const attach = (
  draft: Draft,
  like: Row,
  parent: Placed,
  kind: string,
  arm?: { readonly relation: AnyRelation; readonly row: Row },
) => {
  const id = randomUUID();
  const position = BigInt(1000 + of(draft, Edge).length);

  of(draft, Node).push({ ...like, ancestry: parent.ancestry, id, kind });
  if (arm !== undefined) {
    of(draft, arm.relation).push({ ...arm.row, id });
  }

  of(draft, Edge).push({
    child: id,
    childAncestry: parent.ancestry,
    childKind: kind,
    parent: parent.id,
    parentAncestry: parent.ancestry,
    parentKind: parent.kind,
    position,
    tree: text(like, "tree"),
    version: text(like, "version"),
  });

  return { node: { ancestry: parent.ancestry, id, kind }, position };
};

/**
 * The item and its tree, as the rows a declaration or an item attribute names.
 */
const itemOf = (draft: Draft) => {
  const item = nodeOf(draft, "qti-assessment-item");

  return {
    id: text(item, "id"),
    like: item,
    tree: text(item, "tree"),
    version: text(item, "version"),
  };
};

/**
 * A typed declaration `identifier` of `kind`, a child of the item, with the rows its kind needs.
 *
 * @returns The declaration, placed.
 */
const declare = (
  draft: Draft,
  kind: "context" | "outcome" | "response",
  identifier: string,
  baseType: string,
  cardinality: string,
) => {
  const item = itemOf(draft);
  const arms = {
    context: { relation: ContextDeclarationArm, row: { version: item.version } },
    outcome: { relation: OutcomeDeclarationArm, row: {} },
    response: { relation: ResponseDeclarationArm, row: {} },
  };
  const { node } = attach(
    draft,
    item.like,
    placedOf(draft, "qti-assessment-item"),
    `qti-${kind}-declaration`,
    arms[kind],
  );

  of(draft, Declaration).push({
    document: item.tree,
    id: node.id,
    identifier,
    kind,
    shape: "typed",
  });
  of(draft, TypedDeclaration).push({
    baseType,
    cardinality,
    document: item.tree,
    id: node.id,
    identifier,
    kind,
  });

  if (kind === "response") {
    of(draft, DocumentId).push({
      document: item.tree,
      holder: "responseDeclaration",
      id: identifier,
    });
    of(draft, ResponseDeclarationId).push({ document: item.tree, id: identifier, node: node.id });
  }

  return node;
};

/**
 * A `qti-mapping` of the response `declaration`, whose rows copy the base type `baseType`.
 */
const mapping = (draft: Draft, declaration: Placed, baseType: string) => {
  const item = itemOf(draft);
  const { node } = attach(draft, item.like, declaration, "qti-mapping", {
    relation: Mapping,
    row: { baseType, declaration: declaration.id, defaultValue: "0", document: item.tree },
  });

  return node;
};

/**
 * The identifier of the item's one resource-level LOM `general` category and its record.
 */
const resourceGeneral = (draft: Draft) => {
  const lom = find(draft, Lom, (row) => text(row, "owner") === "resource");
  const general = find(draft, LomGeneral, (row) => text(row, "lom") === text(lom, "id"));
  const node = find(draft, Node, (row) => text(row, "id") === text(general, "id"));

  return {
    general: { ancestry: text(node, "ancestry"), id: text(node, "id"), kind: "lom:general" },
    like: node,
    lom: text(lom, "id"),
  };
};

/**
 * The parent of the resource record's `general` category, as an edge names it.
 */
const resourceGeneralParent = (draft: Draft): Placed => {
  const { general } = resourceGeneral(draft);
  const edge = find(draft, Edge, (row) => text(row, "child") === general.id);

  return {
    ancestry: text(edge, "parentAncestry"),
    id: text(edge, "parent"),
    kind: text(edge, "parentKind"),
  };
};

/**
 * A `lom:language` of `value` under `parent`, with the `LomLanguage` row of a resource record whose
 * `parentKind` is `parentKind`.
 */
const resourceLanguage = (draft: Draft, parent: Placed, parentKind: string, value: string) => {
  const { like, lom } = resourceGeneral(draft);
  const { node, position } = attach(draft, like, parent, "lom:language");

  of(draft, LomLanguage).push({ id: node.id, lom, owner: "resource", parentKind, position, value });

  return node;
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
 * One alteration of an item's or a manifest's rows, the law that must refuse it and the rule the
 * roster names for that law.
 */
interface Negative {
  readonly alter: (draft: Draft) => void;
  readonly fixture: FixtureName;
  readonly law: Law;
  readonly name: string;
  readonly rule: Rule;
}

/**
 * One alteration the database admits.
 */
interface Positive {
  readonly alter: (draft: Draft) => void;
  readonly fixture: FixtureName;
  readonly name: string;
}

/**
 * The `ItemTool` rows of the item: the root wrote `tool-name` only.
 */
const nameOnlyTool = (draft: Draft) => {
  const { tree } = itemOf(draft);

  of(draft, ItemTool).push({ shape: "nameOnly", tree });
  of(draft, ItemToolName).push({ toolName: "gr8des", tree });
};

/**
 * A `NodeLabel` row of `p`, the body-element label of goal 3.12.
 */
const bodyLabel = (draft: Draft) => {
  const { tree } = itemOf(draft);

  of(draft, NodeLabel).push({
    attribute: "label",
    kind: "p",
    node: idOf(draft, "p"),
    rootKind: "item",
    tree,
    value: "L",
  });
};

/**
 * The root's `label`, as the item-level row the importer writes for it, at `version`.
 */
const rootLabel = (draft: Draft, version: string) => {
  const { id, tree } = itemOf(draft);

  of(draft, AssessmentItemLabel).push({ node: id, tree, value: "L", version });
};

/**
 * The item document of the manifest's one item resource, as a language row copies it.
 */
const itemDocument = (draft: Draft) => {
  const row = find(draft, DocumentIdentifier, (candidate) => text(candidate, "root") === "item");

  return {
    document: text(row, "document"),
    package: text(row, "package"),
    resource: text(row, "resource"),
  };
};

/**
 * The fields the language and tool containments read, as grizzle reports them.
 */
const documentLangSet = containedLaw(
  side(DocumentLang, ["package", "resource", "value"], [{ field: "lomGeneral", value: "yes" }]),
  side(ResourceLomLanguageSet, ["package", "resource", "value"]),
);

const xmlLangDocument = containedLaw(
  side(NodeXmlLang, ["tree", "value"], [{ field: "rootKind", value: "item" }]),
  side(DocumentLang, ["document", "value"]),
);

const lomLanguageSet = containedLaw(
  side(
    LomLanguage,
    ["lom", "value"],
    [
      { field: "owner", value: "resource" },
      { field: "parentKind", value: "lom:general" },
    ],
  ),
  side(ResourceLomLanguageSet, ["lom", "value"]),
);

const lomLanguageParentKind = containedLaw(
  side(LomLanguage, ["id", "parentKind"]),
  side(Edge, ["child", "parentKind"]),
);

const negatives: readonly Negative[] = [
  {
    alter: (draft) => {
      mapping(draft, declare(draft, "response", "FILE", "file", "single"), "file");
    },
    fixture: "cut-choice",
    law: containedLaw(side(Mapping, ["baseType"]), side(MappableBaseType, ["baseType"])),
    name: "a mapping on a file response is refused by the containment into MappableBaseType",
    rule: "mapping-base-type",
  },
  {
    alter: (draft) => {
      const response = declare(draft, "response", "AREA", "identifier", "single");

      attach(draft, itemOf(draft).like, response, "qti-area-mapping", {
        relation: AreaMapping,
        row: {
          declaration: response.id,
          defaultValue: "0",
          document: itemOf(draft).tree,
        },
      });
    },
    fixture: "cut-choice",
    law: containedLaw(
      side(AreaMapping, ["declaration"]),
      side(TypedDeclaration, ["id"], [{ field: "baseType", value: "point" }]),
    ),
    name: "an area mapping on an identifier response is refused by the containment into the point declarations",
    rule: "area-mapping-point",
  },
  {
    alter: (draft) => {
      const outcome = declare(draft, "outcome", "TABLE", "float", "multiple");

      attach(draft, itemOf(draft).like, outcome, "qti-match-table", {
        relation: MatchTable,
        row: { baseType: "float", declaration: outcome.id, document: itemOf(draft).tree },
      });
    },
    fixture: "cut-choice",
    law: containedLaw(
      side(MatchTable, ["declaration"]),
      side(TypedDeclaration, ["id"], [{ field: "cardinality", value: "single" }]),
    ),
    name: "a match table on a multiple outcome is refused by the containment into the single declarations",
    rule: "table-outcome",
  },
  {
    alter: (draft) => {
      const response = declare(draft, "response", "KEYED", "identifier", "single");
      const parent = mapping(draft, response, "identifier");
      const entry = attach(draft, itemOf(draft).like, parent, "qti-map-entry", {
        relation: mappingRelations.MapEntryIdentifier,
        row: { mapKey: "Choice A" },
      });

      of(draft, MapEntry).push({
        baseType: "identifier",
        caseSensitive: "true",
        declaration: response.id,
        id: entry.node.id,
        mappedValue: "1",
        mapping: parent.id,
        position: entry.position,
      });
    },
    fixture: "cut-choice",
    law: contractLaw("MapKeyIdentifierValue"),
    name: "a map key of Choice A on an identifier map entry is refused by the MapKeyIdentifierValue contract",
    rule: "map-key-lexical",
  },
  {
    alter: (draft) => {
      of(draft, DeclarationNormalMaximum).push({
        declaration: text(
          find(draft, Declaration, (row) => text(row, "identifier") === "SCORE"),
          "id",
        ),
        value: "0",
      });
    },
    fixture: "cut-choice",
    law: patternLaw(patterns.positiveDouble),
    name: "a normal-maximum of 0 is refused by the positiveDouble pattern",
    rule: "normal-maximum",
  },
  {
    alter: (draft) => {
      find(draft, TypedDeclaration, (row) => text(row, "identifier") === "SCORE")["baseType"] =
        "integer";
    },
    fixture: "cut-text-entry",
    law: checkLaw(TypedDeclaration, "ReservedOutcomeTypes"),
    name: "an outcome SCORE of base type integer is refused by the ReservedOutcomeTypes check",
    rule: "reserved-type",
  },
  {
    alter: (draft) => {
      nameOnlyTool(draft);
      bodyLabel(draft);
    },
    fixture: "cut-choice",
    law: containedLaw(
      side(NodeLabel, ["tree"], [{ field: "rootKind", value: "item" }]),
      side(ItemToolBoth, ["tree"]),
    ),
    name: "a label on a body node of an item that wrote tool-name only is refused by the containment into ItemToolBoth",
    rule: "label-tool",
  },
  {
    alter: (draft) => {
      rootLabel(draft, "3.0.1");
    },
    fixture: "cut-choice",
    law: containedLaw(
      side(AssessmentItemLabel, ["tree"], [{ field: "version", value: "3.0.1" }]),
      side(ItemToolBoth, ["tree"]),
    ),
    name: "a root label of a 3.0.1 item with no tool values is refused by the containment into ItemToolBoth",
    rule: "label-tool",
  },
  {
    alter: (draft) => {
      of(draft, DocumentLang).push({ ...itemDocument(draft), lomGeneral: "yes", value: "de" });
    },
    fixture: "simple",
    law: documentLangSet,
    name: "a document language de that the resource's LOM set lacks is refused by the containment into ResourceLomLanguageSet",
    rule: "document-lang",
  },
  {
    alter: (draft) => {
      const { tree } = itemOf(draft);

      of(draft, NodeXmlLang).push({
        attribute: "xml:lang",
        kind: "p",
        node: idOf(draft, "p"),
        rootKind: "item",
        tree,
        value: "de",
      });
    },
    fixture: "cut-choice",
    law: xmlLangDocument,
    name: "an item xml:lang of de with no DocumentLang row is refused by the containment into DocumentLang",
    rule: "document-lang",
  },
  {
    alter: (draft) => {
      const { general } = resourceGeneral(draft);

      resourceLanguage(draft, general, "lom:general", "fr");
    },
    fixture: "simple",
    law: lomLanguageSet,
    name: "a resource-level general language fr with no ResourceLomLanguageSet row is refused by the containment into the set",
    rule: "document-lang",
  },
  {
    alter: (draft) => {
      const { general } = resourceGeneral(draft);

      resourceLanguage(draft, general, "lom:metaMetadata", "fr");
    },
    fixture: "simple",
    law: lomLanguageParentKind,
    name: "a LomLanguage whose parentKind differs from its edge's is refused by the containment into Edge",
    rule: "admission",
  },
  {
    alter: (draft) => {
      declare(draft, "context", "CONTEXT", "string", "single");
    },
    fixture: "cut-extended-text",
    law: containedLaw(
      side(ContextDeclarationArm, ["id"], [{ field: "version", value: "3.0.0" }]),
      side(ContextDeclarationId, ["node"]),
    ),
    name: "a 3.0.0 context declaration with no ContextDeclarationId row is refused by the containment into the holder",
    rule: "context-id",
  },
];

/**
 * The alterations the database admits.
 */
const positives: readonly Positive[] = [
  {
    alter: (draft) => {
      find(draft, Declaration, (row) => text(row, "identifier") === "SCORE")["identifier"] =
        "TOTAL";
      find(draft, TypedDeclaration, (row) => text(row, "identifier") === "SCORE")["identifier"] =
        "TOTAL";
      declare(draft, "response", "SCORE", "identifier", "single");
    },
    fixture: "cut-text-entry",
    name: "a response declaration named SCORE of base type identifier is admitted, the reserved types binding outcomes alone",
  },
  {
    alter: (draft) => {
      rootLabel(draft, "3.0.0");
    },
    fixture: "cut-extended-text",
    name: "a root label of a 3.0.0 item with no tool values is admitted",
  },
  {
    alter: (draft) => {
      assert.isAbove(
        of(draft, LomLanguage).filter((row) => text(row, "owner") === "manifest").length,
        0,
      );
      assert.strictEqual(of(draft, ResourceLomLanguageSet).length, 0);
    },
    fixture: "simple",
    name: "a manifest-level LomLanguage with no ResourceLomLanguageSet row is admitted",
  },
  {
    alter: (draft) => {
      const string = nodeOf(draft, "lom:string");

      of(draft, NodeXmlLang).push({
        attribute: "xml:lang",
        kind: "lom:string",
        node: text(string, "id"),
        rootKind: "manifest",
        tree: text(string, "tree"),
        value: "en",
      });
    },
    fixture: "simple",
    name: "a manifest xml:lang of en on a lom:string with no DocumentLang row is admitted",
  },
  {
    alter: (draft) => {
      const { lom } = resourceGeneral(draft);
      const document = itemDocument(draft);

      of(draft, ResourceLomLanguageSet).push({
        lom,
        package: document.package,
        resource: document.resource,
        value: "",
      });
    },
    fixture: "simple",
    name: "a ResourceLomLanguageSet row with the empty value is admitted",
  },
  {
    alter: (draft) => {
      const { like, lom } = resourceGeneral(draft);
      const metaMetadata = attach(draft, like, resourceGeneralParent(draft), "lom:metaMetadata", {
        relation: LomMetaMetadata,
        row: { lom },
      });

      resourceLanguage(draft, metaMetadata.node, "lom:metaMetadata", "fr");
    },
    fixture: "simple",
    name: "a resource-level LomLanguage under lom:metaMetadata with no ResourceLomLanguageSet row is admitted",
  },
];

/**
 * The XML copy the database refuses: an interaction in a feedback block of an item that writes
 * `adaptive="0"`, which R33 allows only in an adaptive item.
 */
const refusedCopy = "adaptive-zero-feedback" as const satisfies FixtureName;

/**
 * Import a fixture, export it to `work/export/<name>/` and compare the export with the fixture.
 *
 * @param name - The fixture to round-trip.
 * @returns The package id the import answered and the comparison report, whose rendering is also
 *   left beside the export in `work/export/<name>.report.txt`.
 */
const roundTrip = (name: FixtureName) =>
  Effect.gen(function* roundTripFixture() {
    const fs = yield* FileSystem.FileSystem;
    const source = yield* materialize(name);
    const exported = `${workDirectory}/export/${name}`;
    const id = yield* importPackage(source);

    yield* fs.remove(exported, { force: true, recursive: true });
    yield* fs.makeDirectory(exported, { recursive: true });
    yield* exportPackage(id, exported);

    const report = yield* comparePackage(source, exported);

    yield* fs.writeFileString(`${exported}.report.txt`, `${renderReport(report)}\n`);

    return { id, report };
  });

/**
 * Assert that a round trip compares all equal.
 */
const assertAllEqual = (report: Effect.Success<ReturnType<typeof roundTrip>>["report"]) => {
  assert.strictEqual(
    report.filter(
      (item) => item.outcome.kind !== "canonical-equal" && item.outcome.kind !== "byte-identical",
    ).length,
    0,
    renderReport(report),
  );
  assert.isTrue(renderReport(report).endsWith("\nall equal"), renderReport(report));
};

describe.skipIf(!hasLease)(
  "import/content-c.test.ts, the negatives and positives, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, BaseRowsLayer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("mappings, item attributes, R26, goal 3.12 and goal 3.1 by direct ChangeSet", (it) => {
      for (const negative of negatives) {
        it.effect(negative.name, () =>
          Effect.gen(function* refused() {
            const rows = (yield* BaseRows).get(negative.fixture);
            assert.isDefined(rows, negative.fixture);

            const draft = draftOf(rows ?? Rows.empty());
            negative.alter(draft);

            const outcome = yield* apply(draft);

            assert.strictEqual(outcome.kind, "invariant-rejected");
            if (outcome.kind === "invariant-rejected") {
              const reported: unknown = outcome.law;

              assert.deepStrictEqual(reported, negative.law);
              assert.strictEqual(ruleOfLaw(outcome.law satisfies ImportLaw), negative.rule);
              if (!isMappedLaw(outcome.law satisfies ImportLaw)) {
                yield* Effect.log(
                  `FINDING ${negative.name}: ruleOfLaw sorts this law to ${negative.rule} by its kind alone`,
                );
              }
            }
          }),
        );
      }

      for (const name of bases) {
        it.effect(
          `the unaltered rows of ${name} are accepted, so each refusal above is its alteration's`,
          () =>
            Effect.gen(function* unaltered() {
              const rows = (yield* BaseRows).get(name);
              assert.isDefined(rows, name);

              const outcome = yield* apply(fresh(draftOf(rows ?? Rows.empty())));

              assert.strictEqual(outcome.kind, "accepted");
            }),
        );
      }

      for (const positive of positives) {
        it.effect(positive.name, () =>
          Effect.gen(function* admitted() {
            const rows = (yield* BaseRows).get(positive.fixture);
            assert.isDefined(rows, positive.fixture);

            const draft = draftOf(rows ?? Rows.empty());
            positive.alter(draft);

            const outcome = yield* apply(fresh(draft));

            assert.strictEqual(outcome.kind, "accepted");
          }),
        );
      }
    });

    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the XML copies are imported through importPackage", (it) => {
      it.effect(
        "label-3-0-0 imports and round-trips with one AssessmentItemLabel and no NodeLabel",
        () =>
          Effect.gen(function* label() {
            const { id, report } = yield* roundTrip("label-3-0-0");

            assertAllEqual(report);

            assert.deepStrictEqual(
              (yield* rowsOf(id, AssessmentItemLabel)).map((row) => `${row.version}=${row.value}`),
              ["3.0.0=L"],
            );
            assert.strictEqual((yield* rowsOf(id, NodeLabel)).length, 0);
          }),
      );

      it.effect(
        "manifest-xml-lang round-trips with one NodeXmlLang row and no DocumentLang row for the manifest",
        () =>
          Effect.gen(function* manifestLang() {
            const { id, report } = yield* roundTrip("manifest-xml-lang");

            assertAllEqual(report);

            assert.deepStrictEqual(
              (yield* rowsOf(id, NodeXmlLang)).map(
                (row) => `${row.rootKind}:${row.kind}=${row.value}`,
              ),
              ["manifest:lom:string=en"],
            );
            assert.strictEqual((yield* rowsOf(id, DocumentLang)).length, 0);
          }),
      );

      it.effect(
        "item-lang-en is accepted with the item's DocumentLang row and the LOM's set row",
        () =>
          Effect.gen(function* itemLang() {
            const { id, report } = yield* roundTrip("item-lang-en");

            assertAllEqual(report);

            assert.deepStrictEqual(
              (yield* rowsOf(id, DocumentLang)).map((row) => `${row.lomGeneral}:${row.value}`),
              ["yes:en"],
            );
            assert.deepStrictEqual(
              (yield* rowsOf(id, ResourceLomLanguageSet)).map((row) => row.value),
              ["en"],
            );
            assert.strictEqual((yield* rowsOf(id, ResourceLomGeneral)).length, 1);
          }),
      );

      it.effect(
        "item-lang-no-general is accepted: a resource LOM with no general is outside R26, so lomGeneral is no",
        () =>
          Effect.gen(function* noGeneral() {
            const { id, report } = yield* roundTrip("item-lang-no-general");

            assertAllEqual(report);

            assert.deepStrictEqual(
              (yield* rowsOf(id, DocumentLang)).map((row) => `${row.lomGeneral}:${row.value}`),
              ["no:en"],
            );
            assert.strictEqual((yield* rowsOf(id, ResourceLomLanguageSet)).length, 0);
            assert.strictEqual((yield* rowsOf(id, ResourceLomGeneral)).length, 0);
          }),
      );

      it.effect(
        'adaptive-one-feedback is admitted: adaptive="1" is an xs:boolean true, so its feedback block is judged adaptive and keeps its FeedbackBlock row',
        () =>
          Effect.gen(function* adaptiveOne() {
            const { id, report } = yield* roundTrip("adaptive-one-feedback");

            assertAllEqual(report);

            assert.deepStrictEqual(
              (yield* rowsOf(id, FeedbackBlock)).map((row) => row.identifier),
              ["shown"],
            );
          }),
      );

      it.effect(`${refusedCopy} is refused by the database under the adaptive-feedback rule`, () =>
        Effect.gen(function* adaptiveZero() {
          const result = yield* Effect.result(importPackage(yield* materialize(refusedCopy)));
          assert.strictEqual(result._tag, "Failure", `${refusedCopy} was accepted`);
          if (result._tag === "Success") {
            return;
          }

          const refusal = result.failure;
          assert.isTrue(refusal instanceof ImportRefused, refusal.message);
          if (!(refusal instanceof ImportRefused)) {
            return;
          }

          assert.strictEqual(refusal.rule, "adaptive-feedback", refusal.message);
          assert.deepStrictEqual(refusal.law, checkLaw(InteractionBinding, "AdaptiveFeedback"));
        }),
      );
    });
  },
);
