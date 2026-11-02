/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The manifest guards: the facts about a manifest's rows that no single relation can state, judged
 * over the rows an import built before any of them is written.
 */
import type { AnyRelation } from "@bjornpagen/grizzle";
import { Effect, Predicate, Schema } from "effect";
import { collapse, replace, Rows } from "#qti/import/tree.ts";
import type { WhiteSpace } from "#qti/import/tree.ts";
import type { Entry } from "#qti/package/read.ts";
import * as md from "#qti/schema/metadata.ts";
import {
  AttributeLexical,
  Edge,
  EntityReference,
  Node,
  TextNode,
  vocabularies,
  Ws,
} from "#qti/schema/node.ts";
import {
  Dependency,
  File,
  ManifestMetadata,
  ManifestSchemaVersion,
  Package,
  PackageEntry,
  Resource,
  ResourceHref,
} from "#qti/schema/package.ts";

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
 * spaces in the two leaves of a portable custom interaction context, the four `xs:boolean` leaves
 * collapse, and every other leaf is kept as read.
 */
const contentClass = (kind: string): WhiteSpace => {
  switch (kind) {
    case "qmd:customTypeIdentifier":
    case "qmd:interactionKind": {
      return "replace";
    }
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
const resourceOrder: readonly string[] = ["cp:metadata.resource", "cp:file", "cp:dependency"];

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
  readonly nodes: ReadonlyMap<string, { readonly kind: string; readonly tree: string }>;
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
 * `text-copy`: every `value` copy on a LOM or qmd leaf arm is its node's character content under
 * the leaf's class, and every `collapsed` copy is the collapse of the `value` beside it.
 */
const textCopy = (rows: Rows, index: Index): Finding => {
  for (const relation of metadataRelations) {
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
 * attribute: the five attributes of the manifest that collapse.
 */
const shadowed = (
  rows: Rows,
  kind: string,
  attribute: string,
  node: string,
): string | undefined => {
  switch (`${kind}/${attribute}`) {
    case "cp:manifest/identifier": {
      return Rows.of(rows, Package).find((row) => row.id === node)?.identifier;
    }
    case "cp:resource/identifier": {
      return Rows.of(rows, Resource).find((row) => row.id === node)?.identifier;
    }
    case "cp:resource/href": {
      return Rows.of(rows, ResourceHref).find((row) => row.resource === node)?.href;
    }
    case "cp:file/href": {
      return Rows.of(rows, File).find((row) => row.id === node)?.href;
    }
    case "cp:dependency/identifierref": {
      return Rows.of(rows, Dependency).find((row) => row.id === node)?.target;
    }
    default: {
      return undefined;
    }
  }
};

/**
 * `typed-copy`: a package's `schemaversion` is the text of every `cp:schemaversion` of its
 * manifest, and every lexical row of a manifest node collapses to the column it shadows.
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

    const stray = held.find((version) => version.value !== row.schemaversion);
    if (stray !== undefined) {
      return refuse(
        "typed-copy",
        `Package ${row.id} holds schemaversion ${row.schemaversion} beside a cp:schemaversion of ${stray.value}.`,
      );
    }
  }

  for (const [id, node] of index.nodes) {
    if (node.kind === "cp:schemaversion" && packages.has(node.tree)) {
      const text = (index.children.get(id) ?? [])
        .map((edge) => index.texts.get(edge.child) ?? "")
        .join("");
      const version = versions.find((found) => found.id === id);
      if (version?.value !== text) {
        return refuse(
          "typed-copy",
          `The cp:schemaversion ${id} reads ${JSON.stringify(text)}, and ${version === undefined ? "no ManifestSchemaVersion row holds it" : `its row holds ${version.value}`}; a schemaversion is 3.0.0 or 3.0.1.`,
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

    if (collapse(row.value) !== typed) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} ${JSON.stringify(row.value)} of ${row.kind} ${row.node} collapses to ${JSON.stringify(collapse(row.value))}, and its column holds ${JSON.stringify(typed)}.`,
      );
    }

    if (row.value === typed) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} of ${row.kind} ${row.node} equals its column ${JSON.stringify(typed)}; a lexical row exists only where processing changed the value.`,
      );
    }
  }

  return undefined;
};

/**
 * `ordering`: the children of each `cp:resource` and each `qmd:qtiMetadata` follow the order their
 * XSD sequence lists; kinds the sequence does not list (whitespace, comments, instructions) are
 * skipped.
 */
const ordering = (rows: Rows): Finding => {
  const orders = new Map([
    ["cp:resource", resourceOrder],
    ["qmd:qtiMetadata", qtiMetadataOrder],
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
  const listed = new Set(Rows.of(rows, File).map((file) => file.href));
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
 * `href-listed`: every resource `href` is the `href` of a `File` of the same resource.
 */
const hrefListed = (rows: Rows): Finding => {
  const files = Rows.of(rows, File);
  const missing = Rows.of(rows, ResourceHref).find(
    (row) => !files.some((file) => file.resource === row.resource && file.href === row.href),
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
 * Refuse manifest rows that break one of the six cross-relation facts: the text copies, the typed
 * copies, the order of children, the files listed, the hrefs listed and the manifest's id space.
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
    manifestIdSpace(rows);
  if (found !== undefined) {
    yield* found;
  }
});
