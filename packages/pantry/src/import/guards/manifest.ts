/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The manifest guards: the facts about a manifest's rows that no single relation can state, judged
 * over the rows an import built before any of them is written.
 */
import type { AnyRelation, Uuid } from "@bjornpagen/grizzle";
import { Effect, Option, Predicate, Schema } from "effect";
import { collapse, replace, Rows } from "#pantry/import/tree.ts";
import type { WhiteSpace } from "#pantry/import/tree.ts";
import type { Entry } from "#pantry/package/read.ts";
import { Document } from "#pantry/schema/document.ts";
import * as drd from "#pantry/schema/kinds/drd.ts";
import * as csm from "#pantry/schema/csm.ts";
import * as md from "#pantry/schema/metadata.ts";
import {
  AttributeLexical,
  Edge,
  EntityReference,
  Node,
  TextNode,
  vocabularies,
  Ws,
} from "#pantry/schema/node.ts";
import type { RootKindHandle } from "#pantry/schema/node.ts";
import {
  Dependency,
  DrdEducationalLevelOfAdaptation,
  DrdLanguageOfAdaptation,
  File,
  FileContent,
  ManifestMetadata,
  ManifestSchemaVersion,
  Package,
  PackageEntry,
  Resource,
  ResourceHref,
  Variant,
  variantDrdRelations,
} from "#pantry/schema/package.ts";
import { rootOfType } from "#pantry/schema/seed/root-of-type.ts";
import { readXml } from "@qti-pie/crust/read.ts";

/**
 * A manifest guard refused the rows.
 *
 * `rule` names the guard and `detail` the first row that broke it.
 */
export class ManifestGuardRefusal extends Schema.TaggedError<ManifestGuardRefusal>()(
  "ManifestGuardRefusal",
  {
    detail: Schema.String,
    rule: Schema.Literals([
      "text-copy",
      "typed-copy",
      "ordering",
      "file-listed",
      "href-listed",
      "manifest-id-space",
      "root-type-reverse",
      "entry-kind",
    ]),
  },
) {
  /**
   * What was refused, in one sentence.
   */
  override get message(): string {
    return `The manifest rows break the ${this.rule} guard: ${this.detail}`;
  }
}

/**
 * The first refusal a check finds, or nothing when its rows are sound.
 */
type Finding = ManifestGuardRefusal | undefined;

const refuse = (rule: ManifestGuardRefusal["rule"], detail: string): ManifestGuardRefusal =>
  new ManifestGuardRefusal({ detail, rule });

const byPosition = (a: { readonly position: bigint }, b: { readonly position: bigint }): number =>
  Number(a.position - b.position);

/**
 * The rows of a relation as plain objects, for the checks that read a field by its name across
 * many relations.
 */
const rowsAt = (rows: Rows, relation: AnyRelation): readonly object[] => rows.get(relation) ?? [];

/**
 * The relations of the metadata module; its members that are rosters have no fields.
 */
const metadataRelations: readonly AnyRelation[] = Object.values<unknown>(md.relations).filter(
  (member): member is AnyRelation => Predicate.hasProperty(member, "fields"),
);

/**
 * The 17 relations of the DRD leaves, each of which copies its node's text.
 */
const drdLeafRelations: readonly AnyRelation[] = Object.entries(variantDrdRelations)
  .filter(([name]) => name.startsWith("Drd"))
  .map(([, relation]) => relation);

/**
 * Every relation whose rows copy a leaf's text: the LOM and qmd leaves, the DRD leaves and the
 * three CSM leaves.
 */
const textRelations: readonly AnyRelation[] = [
  ...metadataRelations,
  ...drdLeafRelations,
  csm.CsmCaseItemUri,
  csm.CsmGuid,
  csm.CsmLabel,
];

/**
 * The columns that hold a value after `replace`, so none holds a tab, line feed or carriage
 * return: the five CSM attributes, the two CSM leaves that replace, and the two DRD leaves that
 * replace.
 */
const replaceColumns: readonly AnyRelation[] = [
  csm.CsmMetadataProviderId,
  csm.CsmSetOfGuidsRegion,
  csm.CsmSetOfGuidsVersion,
  csm.CsmSetResourceLabel,
  csm.CsmSetResourcePartId,
  csm.CsmLabel,
  csm.CsmGuid,
  DrdEducationalLevelOfAdaptation,
  DrdLanguageOfAdaptation,
];

/**
 * What a metadata arm row holds when it copies a node's text: the node's id, the value and, on
 * some arms, the collapsed form beside it.
 */
const TextCopy = Schema.Struct({
  collapsed: Schema.optionalKey(Schema.String),
  id: Schema.String,
  value: Schema.String,
});

const isTextCopy = Schema.is(TextCopy);

/**
 * The whitespace class of a leaf's content, spec 3.11: tab, line feed and carriage return become
 * spaces in the two leaves of a portable custom interaction context, the two DRD normalized
 * strings and the CSM label and GUID; the four `xs:boolean` leaves, the five DRD boolean and URI
 * leaves and the CSM case item URI collapse; and every other leaf is kept as read.
 */
const contentClass = (kind: string): WhiteSpace => {
  switch (kind) {
    case "csmd:GUID":
    case "csmd:label":
    case "drd:educationalLevelOfAdaptation":
    case "drd:languageOfAdaptation":
    case "qmd:customTypeIdentifier":
    case "qmd:interactionKind": {
      return "replace";
    }
    case "csmd:caseItemURI":
    case "drd:atInteroperable":
    case "drd:hasAdaptation":
    case "drd:isAdaptationOf":
    case "drd:isFullAdaptationOf":
    case "drd:isPartialAdaptationOf":
    case "qmd:composite":
    case "qmd:itemTemplate":
    case "qmd:solutionAvailable":
    case "qmd:timeDependent": {
      return "collapse";
    }
    default: {
      return "preserve";
    }
  }
};

const processed = (value: string, whiteSpace: WhiteSpace): string => {
  if (whiteSpace === "collapse") {
    return collapse(value);
  }

  return whiteSpace === "replace" ? replace(value) : value;
};

/**
 * The attribute names each element kind's registry carries.
 */
const registryAttributes: ReadonlyMap<string, readonly string[]> = new Map(
  vocabularies.flatMap((vocabulary) =>
    Object.entries<{ readonly attributes: readonly string[] }>(vocabulary.registry).map(
      ([kind, row]): [string, readonly string[]] => [kind, row.attributes],
    ),
  ),
);

/**
 * The kinds under a `cp:resource`, in the XSD sequence's order.
 */
const resourceOrder: readonly string[] = [
  "cp:metadata.resource",
  "cp:file",
  "cp:dependency",
  "cpx:variant",
];

/**
 * The kinds under a `drd:accessForAllResource`, in the order of its XSD sequence: the roster of
 * the DRD kinds lists them so, after the container itself.
 */
const accessForAllOrder: readonly string[] = drd.kinds.filter(
  (kind) => kind !== "drd:accessForAllResource",
);

/**
 * The kinds under a `csmd:labelledGUID`, in the order of its XSD sequence.
 */
const labelledGuidOrder: readonly string[] = ["csmd:label", "csmd:caseItemURI", "csmd:GUID"];

/**
 * The kinds under a `qmd:qtiMetadata`, in the order `QTIMetadataDType` lists them.
 */
const qtiMetadataOrder: readonly string[] = [
  "qmd:itemTemplate",
  "qmd:timeDependent",
  "qmd:composite",
  "qmd:interactionType",
  "qmd:portableCustomInteractionContext",
  "qmd:feedbackType",
  "qmd:solutionAvailable",
  "qmd:scoringMode",
  "qmd:toolName",
  "qmd:toolVersion",
  "qmd:toolVendor",
];

/**
 * The lookups the checks share: each parent's edges in position order, the node of each id, and
 * the content of the character children.
 */
interface Index {
  readonly children: ReadonlyMap<
    string,
    readonly { readonly child: string; readonly childKind: string }[]
  >;
  readonly nodes: ReadonlyMap<string, { readonly kind: string; readonly tree: Uuid }>;
  readonly pieces: ReadonlyMap<string, string>;
  readonly texts: ReadonlyMap<string, string>;
}

const indexOf = (rows: Rows): Index => ({
  children: Map.groupBy(Rows.of(rows, Edge).toSorted(byPosition), (edge) => edge.parent),
  nodes: new Map(Rows.of(rows, Node).map((node) => [node.id, node])),
  pieces: new Map([
    ...Rows.of(rows, TextNode).map((row): [string, string] => [row.id, row.value]),
    ...Rows.of(rows, Ws).map((row): [string, string] => [row.id, row.value]),
    ...Rows.of(rows, EntityReference).map((row): [string, string] => [row.id, `&${row.name};`]),
  ]),
  texts: new Map(Rows.of(rows, TextNode).map((row) => [row.id, row.value])),
});

/**
 * The character content of a node as its `text`, `ws` and `entityRef` children give it, in order.
 */
const contentOf = (index: Index, id: string): string =>
  (index.children.get(id) ?? []).map((edge) => index.pieces.get(edge.child) ?? "").join("");

/**
 * `text-copy`: every `value` copy on a LOM, qmd, DRD or CSM leaf arm is its node's character
 * content under the leaf's class, and every `collapsed` copy is the collapse of the `value` beside
 * it.
 */
const textCopy = (rows: Rows, index: Index): Finding => {
  for (const relation of textRelations) {
    for (const row of rowsAt(rows, relation)) {
      if (!isTextCopy(row)) {
        continue;
      }

      const { collapsed, id, value } = row;
      const node = index.nodes.get(id);
      if (node === undefined) {
        return refuse("text-copy", `${relation.name} row ${id} names no node.`);
      }

      const expected = processed(contentOf(index, id), contentClass(node.kind));
      if (value !== expected) {
        return refuse(
          "text-copy",
          `${relation.name} row ${id} holds ${JSON.stringify(value)}; its ${node.kind} children give ${JSON.stringify(expected)}.`,
        );
      }

      if (collapsed !== undefined && collapsed !== collapse(value)) {
        return refuse(
          "text-copy",
          `${relation.name} row ${id} holds collapsed ${JSON.stringify(collapsed)} beside value ${JSON.stringify(value)}, which collapses to ${JSON.stringify(collapse(value))}.`,
        );
      }
    }
  }

  return undefined;
};

/**
 * The typed column an `AttributeLexical` row of a manifest node shadows, by element kind and
 * attribute: the five attributes of the manifest and the two of a variant, which collapse, and the
 * five of the curriculum standards metadata, which replace.
 */
type Shadow = (rows: Rows, node: string) => string | undefined;

const shadows: ReadonlyMap<string, Shadow> = new Map<string, Shadow>([
  [
    "cp:manifest/identifier",
    (rows, node) => Rows.of(rows, Package).find((row) => row.id === node)?.identifier,
  ],
  [
    "cp:resource/identifier",
    (rows, node) => Rows.of(rows, Resource).find((row) => row.id === node)?.identifier,
  ],
  [
    "cp:resource/href",
    (rows, node) => Rows.of(rows, ResourceHref).find((row) => row.resource === node)?.href,
  ],
  ["cp:file/href", (rows, node) => Rows.of(rows, File).find((row) => row.id === node)?.href],
  [
    "cp:dependency/identifierref",
    (rows, node) => Rows.of(rows, Dependency).find((row) => row.id === node)?.target,
  ],
  [
    "cpx:variant/identifier",
    (rows, node) => Rows.of(rows, Variant).find((row) => row.id === node)?.identifier,
  ],
  [
    "cpx:variant/identifierref",
    (rows, node) => Rows.of(rows, Variant).find((row) => row.id === node)?.identifierref,
  ],
  [
    "csmd:curriculumStandardsMetadata/providerId",
    (rows, node) =>
      Rows.of(rows, csm.CsmMetadataProviderId).find((row) => row.node === node)?.value,
  ],
  [
    "csmd:curriculumStandardsMetadataSet/resourceLabel",
    (rows, node) => Rows.of(rows, csm.CsmSetResourceLabel).find((row) => row.node === node)?.value,
  ],
  [
    "csmd:curriculumStandardsMetadataSet/resourcePartId",
    (rows, node) => Rows.of(rows, csm.CsmSetResourcePartId).find((row) => row.node === node)?.value,
  ],
  [
    "csmd:setOfGUIDs/region",
    (rows, node) => Rows.of(rows, csm.CsmSetOfGuidsRegion).find((row) => row.node === node)?.value,
  ],
  [
    "csmd:setOfGUIDs/version",
    (rows, node) => Rows.of(rows, csm.CsmSetOfGuidsVersion).find((row) => row.node === node)?.value,
  ],
]);

const shadowed = (rows: Rows, kind: string, attribute: string, node: string): string | undefined =>
  shadows.get(`${kind}/${attribute}`)?.(rows, node);

/**
 * The whitespace class of a manifest attribute: the curriculum standards attributes replace, and
 * every other attribute of the manifest collapses.
 */
const attributeClass = (kind: string): WhiteSpace =>
  kind.startsWith("csmd:") ? "replace" : "collapse";

/**
 * What a row holds when it has a `value` column.
 */
const isValued = Schema.is(Schema.Struct({ value: Schema.String }));

/**
 * The first replace-class column holding a tab, line feed or carriage return, as a refusal.
 */
const replaceTabs = (rows: Rows): Finding => {
  for (const relation of replaceColumns) {
    const tabbed = rowsAt(rows, relation).find(
      (row) => isValued(row) && /[\t\n\r]/u.test(row.value),
    );
    if (isValued(tabbed)) {
      return refuse(
        "typed-copy",
        `${relation.name} holds ${JSON.stringify(tabbed.value)}, a value kept after replace that still holds a tab, line feed or carriage return.`,
      );
    }
  }

  return undefined;
};

/**
 * `typed-copy`: a package's manifest holds a `cp:schemaversion` row, the text of every
 * `cp:schemaversion` is its row's `version`, every lexical row of a manifest node processes under
 * its attribute's class to the column it shadows and differs from it as read, and no column that
 * holds a `replace` value holds a tab, line feed or carriage return.
 */
const typedCopy = (rows: Rows, index: Index): Finding => {
  const metadata = Rows.of(rows, ManifestMetadata);
  const versions = Rows.of(rows, ManifestSchemaVersion);
  const packages = new Set(Rows.of(rows, Package).map((row) => row.id));

  for (const row of Rows.of(rows, Package)) {
    const own = new Set(
      metadata.filter((found) => found.manifest === row.id).map((found) => found.id),
    );
    const held = versions.filter((version) => own.has(version.metadata));
    if (held.length === 0) {
      return refuse("typed-copy", `Package ${row.id} has no ManifestSchemaVersion row.`);
    }
  }

  for (const [id, node] of index.nodes) {
    if (node.kind === "cp:schemaversion" && packages.has(node.tree)) {
      const text = (index.children.get(id) ?? [])
        .map((edge) => index.texts.get(edge.child) ?? "")
        .join("");
      const version = versions.find((found) => found.id === id);
      if (version?.version !== text) {
        return refuse(
          "typed-copy",
          `The cp:schemaversion ${id} reads ${JSON.stringify(text)}, and ${version === undefined ? "no ManifestSchemaVersion row holds it" : `its row holds ${version.version}`}; a schemaversion is 3.0.0 or 3.0.1.`,
        );
      }
    }
  }

  for (const row of Rows.of(rows, AttributeLexical)) {
    const node = index.nodes.get(row.node);
    if (node === undefined || !packages.has(node.tree)) {
      continue;
    }

    if (registryAttributes.get(row.kind)?.includes(row.attribute) !== true) {
      return refuse(
        "typed-copy",
        `The ${row.kind} registry carries no attribute ${row.attribute}.`,
      );
    }

    const typed = shadowed(rows, row.kind, row.attribute, row.node);
    if (typed === undefined) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} of ${row.kind} ${row.node} shadows no collapsed column.`,
      );
    }

    const whiteSpace = attributeClass(row.kind);
    const expected = processed(row.value, whiteSpace);
    if (expected !== typed) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} ${JSON.stringify(row.value)} of ${row.kind} ${row.node} ${whiteSpace === "collapse" ? "collapses" : "replaces"} to ${JSON.stringify(expected)}, and its column holds ${JSON.stringify(typed)}.`,
      );
    }

    if (row.value === typed) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} of ${row.kind} ${row.node} equals its column ${JSON.stringify(typed)}; a lexical row exists only where processing changed the value.`,
      );
    }
  }

  return replaceTabs(rows);
};

/**
 * `ordering`: the children of each `cp:resource`, `qmd:qtiMetadata`, `drd:accessForAllResource`
 * and `csmd:labelledGUID` follow the order their XSD sequence lists; kinds the sequence does not
 * list (whitespace, comments, instructions) are skipped.
 */
const ordering = (rows: Rows): Finding => {
  const orders = new Map([
    ["cp:resource", resourceOrder],
    ["qmd:qtiMetadata", qtiMetadataOrder],
    ["drd:accessForAllResource", accessForAllOrder],
    ["csmd:labelledGUID", labelledGuidOrder],
  ]);

  const grouped = Map.groupBy(
    Rows.of(rows, Edge).filter((edge) => orders.has(edge.parentKind)),
    (edge) => edge.parent,
  );
  for (const [parent, edges] of grouped) {
    const order = orders.get(edges[0]?.parentKind ?? "") ?? [];
    let last = -1;
    for (const edge of edges.toSorted(byPosition)) {
      const rank = order.indexOf(edge.childKind);
      if (rank === -1) {
        continue;
      }

      if (rank < last) {
        return refuse(
          "ordering",
          `Under ${edges[0]?.parentKind} ${parent}, a ${edge.childKind} at position ${edge.position} follows a ${order[last]}; the sequence is ${order.join(", ")}.`,
        );
      }

      last = rank;
    }
  }

  return undefined;
};

/**
 * `file-listed`: every file entry of the package is the `href` of some `File`.
 */
const fileListed = (rows: Rows, entries: readonly Entry[]): Finding => {
  const listed = new Set<string>(Rows.of(rows, File).map((file) => file.href));
  const held = [
    ...entries,
    ...Rows.of(rows, PackageEntry).map(({ kind, path }) => ({ kind, path })),
  ];
  const missing = held.find((entry) => entry.kind === "file" && !listed.has(entry.path));

  return missing === undefined
    ? undefined
    : refuse("file-listed", `The package entry ${missing.path} is the href of no cp:file.`);
};

/**
 * Whether two columns of different contracts hold the same text: each contract brands its own
 * type, so a direct comparison across two of them is refused.
 */
const sameText = (left: string, right: string): boolean => left === right;

/**
 * `href-listed`: every resource `href` is the `href` of a `File` of the same resource.
 */
const hrefListed = (rows: Rows): Finding => {
  const files = Rows.of(rows, File);
  const missing = Rows.of(rows, ResourceHref).find(
    (row) => !files.some((file) => file.resource === row.resource && sameText(file.href, row.href)),
  );

  return missing === undefined
    ? undefined
    : refuse(
        "href-listed",
        `The href ${missing.href} of resource ${missing.resource} is the href of none of its files.`,
      );
};

/**
 * `manifest-id-space`: no resource identifier is its manifest's identifier.
 */
const manifestIdSpace = (rows: Rows): Finding => {
  const packages = Rows.of(rows, Package);
  const shared = Rows.of(rows, Resource).find((resource) =>
    packages.some((row) => row.id === resource.package && row.identifier === resource.identifier),
  );

  return shared === undefined
    ? undefined
    : refuse(
        "manifest-id-space",
        `The resource ${shared.id} and its manifest share the identifier ${shared.identifier}.`,
      );
};

/**
 * The local name of the root element each root kind of a document has, for the roots that
 * `RootOfType` names. `RootKind` holds handles such as `rptemplate` and `usagedata`, not element
 * names, and the non-QTI roots (`lom`, `usageData`) are no node kind, so the pairs are written out
 * here.
 */
const rootElements: readonly (readonly [local: string, root: RootKindHandle])[] = [
  ["lom", "externalLom"],
  ["qti-assessment-item", "item"],
  ["qti-assessment-section", "section"],
  ["qti-assessment-stimulus", "stimulus"],
  ["qti-assessment-test", "test"],
  ["qti-outcome-declaration", "outcomes"],
  ["qti-response-processing", "rptemplate"],
  ["usageData", "usagedata"],
];

const rootOfElement: ReadonlyMap<string, RootKindHandle> = new Map(rootElements);

/**
 * The resource types `RootOfType` maps to each root kind.
 */
const typesOfRoot: ReadonlyMap<RootKindHandle, ReadonlySet<string>> = new Map(
  Map.groupBy(rootOfType, ({ root }) => root)
    .entries()
    .map(([root, found]): [RootKindHandle, ReadonlySet<string>] => [
      root,
      new Set(found.map(({ type }) => type)),
    ]),
);

/**
 * Every resource type `RootOfType` names, under any root.
 */
const documentTypes: ReadonlySet<string> = new Set(rootOfType.map(({ type }) => type));

/**
 * The name a root kind's element has in a refusal.
 */
const elementOfRoot = (root: RootKindHandle): string =>
  rootElements.find(([, found]) => found === root)?.[0] ?? root;

const keyOf = (row: { readonly package: string; readonly path: string }): string =>
  `${row.package}\u0000${row.path}`;

/**
 * `entry-kind`: each file entry of the package is a `Document`'s path or a `FileContent`'s path,
 * never both and never neither.
 */
const entryKind = (rows: Rows): Finding => {
  const documents = new Set(Rows.of(rows, Document).map(keyOf));
  const contents = new Set(Rows.of(rows, FileContent).map(keyOf));

  for (const entry of Rows.of(rows, PackageEntry)) {
    if (entry.kind !== "file") {
      continue;
    }

    const isDocument = documents.has(keyOf(entry));
    const isBytes = contents.has(keyOf(entry));
    if (isDocument && isBytes) {
      return refuse(
        "entry-kind",
        `The package entry ${entry.path} is both a Document and a FileContent row; an entry is one or the other.`,
      );
    }

    if (!isDocument && !isBytes) {
      return refuse(
        "entry-kind",
        `The package entry ${entry.path} is neither a Document nor a FileContent row; an entry is one or the other.`,
      );
    }
  }

  return undefined;
};

/**
 * `root-type-reverse`: an entry whose content is XML with a root `RootOfType` names, a stored
 * document or bytes alike, is not packaged as a file of a resource whose type names no root, and
 * bytes of such a root are listed by at least one resource whose type maps to that root.
 *
 * The root of a `Document` is its row's; the root of bytes is read from the entry's own XML, and a
 * file that is not well-formed XML, or whose root no `RootOfType` row names (a fragment), is not a
 * candidate.
 */
const rootTypeReverse = Effect.fn("manifestGuards.rootTypeReverse")(function* rootTypeReverse(
  rows: Rows,
): Effect.fn.Return<Finding> {
  const stored = yield* Effect.forEach(
    Rows.of(rows, FileContent),
    (entry) =>
      Effect.option(readXml(Buffer.from(entry.content, "base64"))).pipe(
        Effect.map((doc): readonly [string, RootKindHandle | undefined] => [
          entry.path,
          Option.isSome(doc) ? rootOfElement.get(doc.value.root.local) : undefined,
        ]),
      ),
    { concurrency: 4 },
  );
  const bytes = new Set<string>(Rows.of(rows, FileContent).map((entry) => entry.path));
  const roots = new Map<string, RootKindHandle>([
    ...Rows.of(rows, Document).map((row): [string, RootKindHandle] => [row.path, row.root]),
    ...stored.flatMap(([path, root]): [string, RootKindHandle][] =>
      root === undefined ? [] : [[path, root]],
    ),
  ]);
  const holders = new Map(Rows.of(rows, Resource).map((resource) => [resource.id, resource]));
  const listings = [
    ...Rows.of(rows, File).map(({ href, resource }) => ({ href, resource })),
    ...Rows.of(rows, ResourceHref).map(({ href, resource }) => ({ href, resource })),
  ].flatMap(({ href, resource }) => {
    const holder = holders.get(resource);

    return holder === undefined ? [] : [{ holder, path: href }];
  });

  for (const { holder, path } of listings) {
    const root = roots.get(path);
    if (root !== undefined && !documentTypes.has(holder.type)) {
      return refuse(
        "root-type-reverse",
        `The entry ${path} is XML with root ${elementOfRoot(root)}, and the ${holder.type} resource ${holder.identifier} lists it as a packaged file; the resource types ${[...(typesOfRoot.get(root) ?? [])].join(", ")} name that root.`,
      );
    }
  }

  for (const [path, root] of roots) {
    const types = typesOfRoot.get(root);
    const listed = listings.some(
      (listing) => listing.path === path && (types?.has(listing.holder.type) ?? false),
    );
    if (bytes.has(path) && !listed) {
      return refuse(
        "root-type-reverse",
        `The entry ${path} is stored as bytes and is XML with root ${elementOfRoot(root)}, and no resource of type ${[...(types ?? [])].join(", ")} lists it.`,
      );
    }
  }

  return undefined;
});

/**
 * Refuse manifest rows that break one of the eight cross-relation facts: the text copies, the typed
 * copies, the order of children, the files listed, the hrefs listed, the manifest's id space, the
 * kind of each entry and the root of the bytes each resource type admits.
 *
 * The first refusal found, in that order, is the failure. Reads rows only; writes nothing.
 *
 * @param rows - The rows the import built.
 * @param entries - The package's entries, as `listPackage` returns them.
 * @returns Nothing when every guard passes; fails with the first {@link ManifestGuardRefusal}
 *   otherwise.
 */
export const manifestGuards = Effect.fn("manifestGuards")(function* manifestGuards(
  rows: Rows,
  entries: readonly Entry[],
): Effect.fn.Return<void, ManifestGuardRefusal> {
  const index = indexOf(rows);
  const found =
    textCopy(rows, index) ??
    typedCopy(rows, index) ??
    ordering(rows) ??
    fileListed(rows, entries) ??
    hrefListed(rows) ??
    manifestIdSpace(rows) ??
    entryKind(rows) ??
    (yield* rootTypeReverse(rows));
  if (found !== undefined) {
    yield* found;
  }
});
