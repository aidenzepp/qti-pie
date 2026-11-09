/* oxlint-disable unicorn/text-encoding-identifier-case -- The generated documents carry the charset label crust's reader reports, `UTF-8`. */
/**
 * The manifest's overlay rows and each document's reference rows against a second reading of the
 * same tree: a direct walk of the XDM document, numbering its nodes in document order as the tree's
 * rows are numbered, collecting each overlay's row from its element and attributes, and resolving
 * each href by the law oracle's own RFC 3986 resolver (`#pantry/test/resolution.ts`) with the
 * `xml:base` values the walk meets on its way down. The walk shares no code with the builder,
 * which reads the tree's flat rows (`flatten`) and resolves by `resolveIn`.
 */
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Layer, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import {
  documentTypes,
  grammar,
  interactionKinds,
  ReferenceAttribute,
  ResourceTypeLexical,
} from "#pantry/grammar/install.ts";
import {
  hrefPiecesOf,
  namedDocuments,
  referenceCensus,
  referencePiecesOf,
  referenceRowsOf,
  rowsOf,
} from "#pantry/import/overlays/package.ts";
import type {
  CensusEntry,
  DocumentIds,
  ManifestIds,
  PackageRows,
  ReferenceCensus,
  ReferenceRows,
} from "#pantry/import/overlays/package.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import { closedName, documentFamily } from "#pantry/model/xdm.ts";
import type {
  ClosedName,
  NodeId,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materialize, materializePackage } from "#pantry/test/fixtures.ts";
import type { FixtureName, NamedPackage } from "#pantry/test/fixtures.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { hrefParamsPattern, hrefPathPattern, manifestPath } from "#pantry/qti/package.ts";
import { comparedPath, oracleValueOf, resolve, resolveAttribute } from "#pantry/test/resolution.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";

/**
 * The file system and processes the fixtures' materializer and `readPackage` need.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The ids every case writes its rows under: the package's, and each node's by its number.
 */
const ids: ManifestIds = { idOf, package: "00000000-0000-4000-8000-0000000000aa" };

/**
 * One overlay row as the walk expects it: its relation and its fields.
 */
type Expected = { readonly [Relation in keyof PackageRows]: Map<string, object> };

/**
 * The text of a projection's key: its heading's values as a JSON array.
 *
 * @param values - The values.
 * @returns The key text.
 */
const heading = (values: readonly string[]): string => JSON.stringify(values);

/**
 * Resolve a manifest href as the oracle does (readings 102 and 103): its value collapsed as an
 * `xs:anyURI`, against the manifest's path and the `xml:base` values in scope.
 *
 * @param href - The href, as written.
 * @param bases - The `xml:base` values in scope, outermost first.
 * @returns Its scope and the path it is compared by.
 */
const manifestHrefOf = (href: string, bases: readonly string[]) => {
  const value = oracleValueOf(href, "collapse");
  const resolution = resolve({ bases, document: manifestPath, value });

  return { path: comparedPath(resolution, value), scope: resolution.scope };
};

/**
 * Expect a resource's `href` rows: its `ResourceHref`, resolved by the oracle; where its type
 * spells a handle, its `TypedHref` and the `NamedHref` of its compared path and type; and where its
 * type is written and spells none, its `UnreadTypeHref` and the `UnreadTypePath` of its compared
 * path.
 *
 * @param expected - The walk's rows so far.
 * @param resource - The resource's href, node, package, type and its lexical form, and the bases
 *   in scope.
 * @param resource.bases - The `xml:base` values in scope, its own last.
 * @param resource.href - Its href.
 * @param resource.node - Its node.
 * @param resource.pkg - Its package.
 * @param resource.type - The handle its type spells, none where it spells none.
 * @param resource.typeLexical - Its type as written.
 */
const expectHref = (
  expected: Expected,
  resource: {
    readonly bases: readonly string[];
    readonly href: string;
    readonly node: NodeId;
    readonly pkg: string;
    readonly type: Option.Option<string>;
    readonly typeLexical: string;
  },
): void => {
  const { bases, href, node, pkg, type, typeLexical } = resource;
  const { path: at, scope } = manifestHrefOf(href, bases);
  expected.ResourceHref.set(node, { href, node, package: pkg, path: at, scope, typeLexical });
  for (const code of Option.toArray(type)) {
    expected.TypedHref.set(node, { node, package: pkg, path: at, scope, type: code });
    expected.NamedHref.set(heading([pkg, at, code]), { package: pkg, path: at, type: code });
  }

  if (Option.isNone(type) && typeLexical !== "") {
    expected.UnreadTypeHref.set(node, { node, package: pkg, path: at, typeLexical });
    expected.UnreadTypePath.set(heading([pkg, at]), { package: pkg, path: at });
  }
};

/**
 * Expect a resource's rows: its `Resource`; its `ResourceTyped` where its type spells a handle; and
 * its href's rows where it writes one ({@link expectHref}).
 *
 * @param expected - The walk's rows so far.
 * @param resource - The resource's row, its href if written, the bases in scope and the spelled
 *   types.
 * @param resource.bases - The `xml:base` values in scope, its own last.
 * @param resource.href - Its href, none where unwritten.
 * @param resource.row - Its `Resource` row.
 * @param resource.spelled - The lexical forms a handle spells.
 */
const expectResource = (
  expected: Expected,
  resource: {
    readonly bases: readonly string[];
    readonly href: string | undefined;
    readonly row: { readonly node: NodeId; readonly package: string; readonly typeLexical: string };
    readonly spelled: ReadonlySet<string>;
  },
): void => {
  const { bases, href, row, spelled } = resource;
  const { node, package: pkg, typeLexical } = row;
  const type = spelled.has(typeLexical) ? Option.some(typeLexical) : Option.none();
  expected.Resource.set(node, row);
  for (const code of Option.toArray(type)) {
    expected.ResourceTyped.set(node, { node, package: pkg, type: code, typeLexical });
  }

  if (href !== undefined) {
    expectHref(expected, { bases, href, node, pkg, type, typeLexical });
  }
};

/**
 * Walk a manifest's tree in document order and collect the overlay rows it implies: each
 * `cp:manifest`, `cp:resource`, `cp:file` and `cp:dependency` with its node's tuple, its parent and
 * its attributes as written.
 *
 * @param doc - The manifest's tree.
 * @returns Every overlay's expected rows.
 */
const walk = (doc: XdmDocument<Composed>): Expected => {
  const expected: Expected = {
    Dependency: new Map(),
    DependencyTarget: new Map(),
    File: new Map(),
    FileHref: new Map(),
    ManifestId: new Map(),
    ManifestIdSpace: new Map(),
    NamedHref: new Map(),
    Resource: new Map(),
    ResourceFile: new Map(),
    ResourceHref: new Map(),
    ResourceId: new Map(),
    ResourceTyped: new Map(),
    TypedHref: new Map(),
    UnreadTypeHref: new Map(),
    UnreadTypePath: new Map(),
  };
  const document = ids.idOf(0);
  const interactions = new Set<string>(interactionKinds);
  const spelled = new Set<string>(ResourceTypeLexical.rows.map(({ lexical }) => lexical));
  let next = 1;
  const named: { readonly identifier: string; readonly node: NodeId }[] = [];
  const dependencies: { readonly node: NodeId; readonly ref: string; readonly resource: NodeId }[] =
    [];
  const visit = (
    child: XdmChild<Composed> | XdmDocument<Composed>["root"],
    parent: {
      readonly bases: readonly string[];
      readonly id: NodeId;
      readonly kind: string;
      readonly nearest: NodeId;
    },
  ): void => {
    const id = ids.idOf(next);
    const start = BigInt(next);
    next += 1;
    if (child._tag !== "element" && !("attributes" in child)) {
      return;
    }

    const kind = child._tag === "element" ? child.kind : child._tag;
    const nearest = interactions.has(parent.kind) ? parent.id : parent.nearest;
    const valueOf = (name: string): string | undefined =>
      child.attributes.find(
        (attribute) => attribute.name._tag === "closed" && attribute.name.handle === name,
      )?.lexical;
    const tuple = { document, kind, nearest, node: id, start, version: doc.version };
    const pkg = ids.package;
    const ownBase = valueOf("xml:base");
    const bases = ownBase === undefined ? parent.bases : [...parent.bases, ownBase];

    const identifier = valueOf("identifier");
    if (kind === "cp:manifest" && identifier !== undefined) {
      expected.ManifestId.set(id, { ...tuple, identifier, package: pkg, parent: parent.id });
      expected.ManifestIdSpace.set(heading([pkg, identifier, kind]), {
        identifier,
        kind,
        package: pkg,
      });
    }

    if (kind === "cp:resource") {
      const row = {
        ...tuple,
        package: pkg,
        parent: parent.id,
        typeLexical: valueOf("type") ?? "",
      };

      expectResource(expected, { bases, href: valueOf("href"), row, spelled });
      if (identifier !== undefined) {
        named.push({ identifier, node: id });
        expected.ResourceId.set(id, { identifier, node: id, package: pkg });
        expected.ManifestIdSpace.set(heading([pkg, identifier, kind]), {
          identifier,
          kind,
          package: pkg,
        });
      }
    }

    const fileHref = kind === "cp:file" ? valueOf("href") : undefined;
    if (fileHref !== undefined) {
      const { path: at, scope } = manifestHrefOf(fileHref, bases);
      expected.File.set(id, {
        ...tuple,
        href: fileHref,
        package: pkg,
        path: at,
        resource: parent.id,
        scope,
      });
      expected.FileHref.set(heading([pkg, scope, at]), { package: pkg, path: at, scope });
      expected.ResourceFile.set(heading([parent.id, scope, at]), {
        path: at,
        resource: parent.id,
        scope,
      });
    }

    const ref = kind === "cp:dependency" ? valueOf("identifierref") : undefined;
    if (ref !== undefined) {
      expected.Dependency.set(id, { ...tuple, package: pkg, ref, resource: parent.id });
      dependencies.push({ node: id, ref, resource: parent.id });
    }

    for (const grandchild of child.children) {
      visit(grandchild, { bases, id, kind, nearest });
    }
  };

  for (const child of documentFamily(doc)) {
    if (child._tag === "element") {
      visit(child, { bases: [], id: document, kind: "document", nearest: document });
    } else {
      next += 1;
    }
  }

  // A dependency names its own resource where that resource's identifier is its ref, and
  // otherwise the first resource in document order that writes the ref (IMS Content Packaging
  // 1.2, `dependency`), none where none does.
  for (const { node, ref, resource } of dependencies) {
    const target = named.some(
      ({ identifier, node: held }) => held === resource && identifier === ref,
    )
      ? resource
      : named.find(({ identifier }) => identifier === ref)?.node;
    if (target !== undefined) {
      expected.DependencyTarget.set(node, { node, package: ids.package, ref, resource, target });
    }
  }

  return expected;
};

/**
 * The overlay relations the builder writes rows of.
 */
const relationNames = [
  "Dependency",
  "DependencyTarget",
  "File",
  "FileHref",
  "ManifestId",
  "ManifestIdSpace",
  "NamedHref",
  "Resource",
  "ResourceFile",
  "ResourceHref",
  "ResourceId",
  "UnreadTypeHref",
  "UnreadTypePath",
] as const satisfies readonly (keyof PackageRows)[];

/**
 * List a keyed set's entries in key order, so two sets compare as sets.
 *
 * @param map - The keyed set.
 * @returns Its entries, sorted by key.
 */
const sortedEntries = (map: ReadonlyMap<string, object>): readonly (readonly [string, object])[] =>
  [...map].toSorted(([left], [right]) => left.localeCompare(right));

/**
 * Compare the builder's keyed sets with the walk's: every relation's keys and rows alike.
 *
 * @param rows - The builder's rows.
 * @param expected - The walk's.
 * @param label - The case, for a failure's message.
 */
const assertRows = (rows: PackageRows, expected: Expected, label: string): void => {
  for (const relation of relationNames) {
    assert.deepStrictEqual(
      sortedEntries(rows[relation]),
      sortedEntries(expected[relation]),
      `${label} ${relation}`,
    );
  }
};

/**
 * Build one generated manifest: a `cp:resources` of resources, each with an identifier, a type, an
 * optional href, its files and its dependencies.
 */
interface ManifestCase {
  readonly manifestBase: string | undefined;
  readonly manifestIdentifier: string | undefined;
  readonly resources: readonly {
    readonly base: string | undefined;
    readonly dependencies: readonly string[];
    readonly files: readonly string[];
    readonly href: string | undefined;
    readonly identifier: string | undefined;
    readonly type: string | undefined;
  }[];
  readonly resourcesBase: string | undefined;
}

/**
 * Read the identifier a generated resource writes: `own` is its own `r<n>`, any other drawn value
 * is written as drawn, and none is written for none.
 *
 * @param identifier - The drawn identifier.
 * @param at - The resource's place among its siblings.
 * @returns The identifier it writes, none where it writes none.
 */
const identifierAt = (identifier: string | undefined, at: number): string | undefined =>
  identifier === "own" ? `r${String(at)}` : identifier;

/**
 * The `xml:base` values a manifest case draws for its `cp:manifest`, its `cp:resources` and each
 * `cp:resource` (IMS Content Packaging 1.2, §6.11.1): none, a directory, one that climbs, an
 * external one, and one under a stated limit.
 */
const manifestBases = [undefined, "b/", "../b/", "http://x.org/", "a%zz/"] as const;

/**
 * The generated manifests: up to three resources, each of a document type, a type no document has
 * and a type no handle spells (named variant `unknown-type`), with or without an href (`no-href`),
 * an href with launch parameters or a fragment among them (`href-params`, reading 102), listing up
 * to three files drawn from two hrefs, so a file listed twice (`file-twice`) and a file two
 * resources list (`shared-file`) are drawn, and up to two dependencies, a resource's own identifier
 * among them (`self-dependency`).
 */
const manifests: Gen<ManifestCase> = (source) => ({
  manifestBase: source.draw(element(manifestBases)),
  manifestIdentifier: source.draw(element(["m", undefined] as const)),
  resources: source.draw(
    array(
      (inner) => ({
        base: inner.draw(element(manifestBases)),
        dependencies: inner.draw(array(element(["r0", "r1", "m"] as const), { max: 2, min: 0 })),
        files: inner.draw(
          array(element(["a.xml", "b/c.png", "b/c%20d.png", "b/c d.png", "./a.xml"] as const), {
            max: 3,
            min: 0,
          }),
        ),
        href: inner.draw(
          element([
            "a.xml",
            "b/c.png",
            "a.xml?x=1&y=2",
            "b/c.png#top",
            "?q",
            undefined,
            "b/../a.xml",
            "b/c d.png",
            "b%2Fc.png",
            "http://x.org/a.xml",
          ] as const),
        ),
        identifier: inner.draw(element(["own", "r0", "m", undefined] as const)),
        type: inner.draw(
          element(["imsqti_item_xmlv3p0", "webcontent", "bogus", undefined] as const),
        ),
      }),
      { max: 3, min: 0 },
    ),
  ),
  resourcesBase: source.draw(element(manifestBases)),
});

/**
 * A situation a generated manifest reaches, each a named variant the builder must hold.
 */
type Situation =
  | "file-twice"
  | "href-params"
  | "href-resolved"
  | "manifest-base"
  | "manifest-id-clash"
  | "no-href"
  | "resource-base"
  | "self-dependency"
  | "shared-file"
  | "unknown-type"
  | "unnamed-manifest"
  | "unnamed-resource"
  | "untyped";

/**
 * Name the situations one generated manifest reaches.
 *
 * @param input - The manifest.
 * @returns Its situations.
 */
const situationsOf = (input: ManifestCase): readonly Situation[] => {
  const files = input.resources.flatMap(({ files: listed }) => listed);
  const identifiers = new Set(
    input.resources.map(({ identifier }, at) => identifierAt(identifier, at)),
  );

  const reached: [Situation, boolean][] = [
    ["no-href", input.resources.some(({ href }) => href === undefined)],
    ["unknown-type", input.resources.some(({ type }) => type === "bogus")],
    ["untyped", input.resources.some(({ type }) => type === undefined)],
    ["unnamed-manifest", input.manifestIdentifier === undefined],
    ["unnamed-resource", identifiers.has(undefined)],
    [
      "manifest-id-clash",
      input.manifestIdentifier !== undefined && identifiers.has(input.manifestIdentifier),
    ],
    [
      "file-twice",
      input.resources.some(({ files: listed }) => new Set(listed).size < listed.length),
    ],
    ["shared-file", new Set(files).size < files.length],
    ["href-params", input.resources.some(({ href }) => href !== undefined && /[?#]/u.test(href))],
    [
      "self-dependency",
      input.resources.some(
        ({ dependencies, identifier }, at) =>
          identifier !== undefined && dependencies.includes(identifierAt(identifier, at) ?? ""),
      ),
    ],
    [
      "href-resolved",
      input.resources.some(({ files: listed, href }) =>
        [href ?? "", ...listed].some((value) => /\.\/|%| /u.test(value)),
      ),
    ],
    ["manifest-base", input.manifestBase !== undefined || input.resourcesBase !== undefined],
    ["resource-base", input.resources.some(({ base }) => base !== undefined)],
  ];

  return reached.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

/**
 * An element of the manifest vocabulary with closed attributes.
 *
 * @param kind - Its kind.
 * @param attributes - Its attributes' names and lexical forms, in order.
 * @param children - Its children.
 * @returns The element.
 */
const elementOf = (
  kind: XdmClosedElement<Composed>["kind"],
  attributes: readonly (readonly [ClosedName<Composed>, string])[],
  children: readonly XdmChild<Composed>[],
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes: attributes.map(([handle, lexical]) => ({
    lexical,
    name: closedName(handle),
    references: [],
  })),
  children,
  governs: "none",
  kind,
  namespaces: [],
  prefix: "",
});

/**
 * Write an `xml:base` as an element's attribute, none for none.
 *
 * @param base - The base.
 * @returns The attribute list.
 */
const baseAttribute = (base: string | undefined) =>
  base === undefined ? [] : [["xml:base", base] as const];

/**
 * Write an attribute that may be unwritten as an element's attribute list.
 *
 * @param name - Its name.
 * @param value - Its lexical form, none where it is unwritten.
 * @returns The list: the attribute, or nothing.
 */
const attributeIf = (name: "href" | "identifier" | "type", value: string | undefined) =>
  value === undefined ? [] : [[name, value] as const];

/**
 * Write a generated manifest as the tree shred would give: a `cp:manifest`, of identifier `m` or
 * none, holding its `cp:resources`, each resource with the identifier and type it draws, if any,
 * its files and its dependencies, whitespace between them so character data shares the numbering.
 *
 * @param input - The manifest.
 * @returns The tree.
 */
const treeOf = (input: ManifestCase): XdmDocument<Composed> => {
  const ws: XdmChild<Composed> = { _tag: "ws", value: "\n" };
  const resources = input.resources.map(
    ({ base, dependencies, files, href, identifier, type }, at) =>
      elementOf(
        "cp:resource",
        [
          ...attributeIf("identifier", identifierAt(identifier, at)),
          ...attributeIf("type", type),
          ...attributeIf("href", href),
          ...baseAttribute(base),
        ],
        [
          ...files.flatMap((file) => [ws, elementOf("cp:file", [["href", file]], [])]),
          ...dependencies.map((ref) => elementOf("cp:dependency", [["identifierref", ref]], [])),
        ],
      ),
  );

  return {
    _tag: "document",
    charset: "UTF-8",
    declaration: Option.none(),
    doctype: Option.none(),
    epilog: [],
    exportCharset: "UTF-8",
    prolog: [{ _tag: "comment", value: " manifest " }],
    root: elementOf(
      "cp:manifest",
      [
        ...attributeIf("identifier", input.manifestIdentifier),
        ...baseAttribute(input.manifestBase),
      ],
      [ws, elementOf("cp:resources", baseAttribute(input.resourcesBase), resources)],
    ),
    version: "3.0.1",
  };
};

/**
 * The fixtures whose manifests the builder is checked over: the accepted packages and those whose
 * manifests carry the cases a law reads: an unknown resource type, external metadata, an outcome
 * declaration, a response-processing template, files listed as bytes, LTI links.
 */
const fixtures = [
  "simple",
  "sharedMedia",
  "extmeta",
  "extmeta-hrefless",
  "outcome",
  "resproc",
  "resproc-webcontent",
  "bytes",
  "bytes-webcontent-item",
  "lti300",
  "lti301",
  "lti300-as-301",
] as const satisfies readonly FixtureName[];

/**
 * The published packages read beside the fixtures: an unknown resource type (`lti`), a LOM record
 * (`metaData`) and usage data (`usageData`).
 */
const packages = ["lti", "metaData", "usageData"] as const satisfies readonly NamedPackage[];

/**
 * Read a manifest's schema version from its tree: the text of `metadata/schemaversion`.
 *
 * @param manifest - The manifest as crust read it.
 * @returns The version it declares, none when it declares none.
 */
const declaredVersion = (manifest: XmlDocument): Option.Option<string> =>
  Option.fromNullishOr(
    manifest.root.children
      .flatMap((child) => (child.kind === "element" && child.local === "metadata" ? [child] : []))
      .flatMap((metadata) =>
        metadata.children.flatMap((child) =>
          child.kind === "element" && child.local === "schemaversion" ? [child] : [],
        ),
      )
      .map((found) =>
        found.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
      )
      .at(0),
  );

/**
 * Build a manifest of resources, each its own identifier, its href listed as its one file and the
 * type it writes, if any, and read the rows the builder writes for unread types.
 *
 * @param resources - Each resource's href and type, none where it writes no type.
 * @returns The (path, type as written) of each `UnreadTypeHref`, the path of each `UnreadTypePath`
 *   and of each `TypedHref`.
 */
const unreadOf = (
  resources: readonly { readonly href: string; readonly type: string | undefined }[],
) => {
  const rows = rowsOf(
    treeOf({
      manifestBase: undefined,
      manifestIdentifier: "m",
      resources: resources.map(({ href, type }) => ({
        base: undefined,
        dependencies: [],
        files: [href],
        href,
        identifier: "own",
        type,
      })),
      resourcesBase: undefined,
    }),
    ids,
  );

  return {
    hrefs: [...rows.UnreadTypeHref.values()].map(({ path, typeLexical }) => [path, typeLexical]),
    paths: [...rows.UnreadTypePath.values()].map(({ path }) => path),
    typed: [...rows.TypedHref.values()].map(({ path }) => path),
  };
};

describe("import/overlays/package.ts", () => {
  it.effect("writes each overlay's rows as the walk of the manifest's tree names them", (ctx) =>
    // Oracle: a second implementation, a direct walk of the XDM document that numbers its nodes in
    // document order and reads each element's attributes, against the builder's read of the tree's
    // flat rows; the type codes against `ResourceTypeLexical`.
    // Bound: a manifest with or without its identifier, up to 3 resources of 3 types or none, each
    // with its own identifier, another's, the manifest's or none, with or without one of 9 hrefs
    // (3 with a query or a fragment, 4 that need resolving), listing up to 3 of 5 files and up to
    // 2 dependencies, under 5 xml:base values on each of the manifest, its resources and each
    // resource, 300 runs.
    searched(
      ctx,
      explore(
        {
          caseHang: Duration.seconds(10),
          concurrency: 1,
          coverage: required<Situation>(
            [
              "no-href",
              "unknown-type",
              "file-twice",
              "shared-file",
              "href-params",
              "self-dependency",
              "href-resolved",
              "manifest-base",
              "resource-base",
              "untyped",
              "unnamed-manifest",
              "unnamed-resource",
              "manifest-id-clash",
            ],
            { cases: 200, sense: notesOnly },
          ),
          draw: drawn(manifests),
          kept: [],
          literal: Formatter.format,
          oracle: {
            kind: "second-implementation",
            name: "a direct walk of the XDM tree, its hrefs by the oracle's RFC 3986 resolver",
          },
          runs: 300,
          shrink: completeShrink,
          steerEvery: 16,
          suite: "pantry/import/overlays-package",
        },
        (input, c) =>
          Effect.sync(() => {
            c.noteAll(situationsOf(input));

            const doc = treeOf(input);
            const rows = rowsOf(doc, ids);

            assertRows(rows, walk(doc), "generated");
            for (const [at, { type }] of namedDocuments(rows)
              .values()
              .map((named) => [named.path, named] as const)) {
              assert.include(documentTypes, type, at);
            }
          }),
      ),
    ),
  );

  it("writes an UnreadTypeHref and an UnreadTypePath for a resource whose written type spells no handle, and none for a typed or untyped one", () => {
    // Oracle: R-O6's manifest (the genetic repair's gr-5a): its first resource's type carries a
    // trailing space, so it spells no handle; the test resource's spells one. A `bogus` type is
    // unread too; a resource that writes no type has neither row, and AL3 refuses it alone.
    assert.deepStrictEqual(
      unreadOf([
        { href: "item.xml", type: "resourceextmetadata/xml " },
        { href: "test.xml", type: "imsqti_test_xmlv3p0" },
      ]),
      {
        hrefs: [["item.xml", "resourceextmetadata/xml "]],
        paths: ["item.xml"],
        typed: ["test.xml"],
      },
      "R-O6",
    );
    assert.deepStrictEqual(
      unreadOf([{ href: "item.xml", type: "bogus" }]),
      { hrefs: [["item.xml", "bogus"]], paths: ["item.xml"], typed: [] },
      "bogus",
    );
    assert.deepStrictEqual(
      unreadOf([{ href: "item.xml", type: undefined }]),
      { hrefs: [], paths: [], typed: [] },
      "no type",
    );
    assert.deepStrictEqual(
      unreadOf([
        { href: "item.xml", type: "bogus" },
        { href: "item.xml", type: "bogus" },
      ]).paths,
      ["item.xml"],
      "two unread resources of one path, one UnreadTypePath",
    );
  });
});

layer(TestLayer, { excludeTestServices: true })("import/overlays/package.ts, fixtures", (suite) => {
  suite.effect(
    "writes each fixture manifest's overlay rows as the walk of its tree names them",
    () =>
      // Oracle: the same direct walk, over the manifests of real packages.
      // Bound: the fixtures of `fixtures`, each manifest that shreds.
      Effect.gen(function* fixtureRows() {
        let shredded = 0;
        const read = [
          ...(yield* Effect.all(
            fixtures.map((name) => Effect.map(materialize(name), (dir) => [name, dir] as const)),
          )),
          ...(yield* Effect.all(
            packages.map((name) =>
              Effect.map(materializePackage(name), (dir) => [name, dir] as const),
            ),
          )),
        ];
        for (const [name, dir] of read) {
          const files = yield* readPackage(dir);
          const manifest = files.find(({ kind }) => kind === "manifest");
          assert.isDefined(manifest, name);
          if (manifest === undefined) {
            continue;
          }

          const xml = yield* readXml(manifest.bytes);
          const version = versionOf(grammar.kinds.versions.handles, declaredVersion(xml));
          if (Result.isFailure(version)) {
            continue;
          }

          const tree = yield* Effect.option(shred(xml, version.success, shredGrammarOf(grammar)));
          if (Option.isNone(tree)) {
            continue;
          }

          shredded += 1;
          const rows = rowsOf(tree.value, ids);
          assertRows(rows, walk(tree.value), name);
          assert.isNotEmpty(rows.ManifestId, name);
        }

        assert.isAtLeast(shredded, 8);
      }),
  );
});

/**
 * The letters the split box draws from: a plain letter, the path's `/` and `:`, the `?` and `#`
 * that start its params, and the whitespace a reference may be surrounded by.
 */
const splitLetters = ["a", "/", ":", "?", "#", " ", "\t"] as const;

/**
 * Every lexical form of at most 4 of {@link splitLetters}: the split box, 2,801 forms.
 */
const lexicals: Gen<string> = (source) =>
  source.draw(array(element(splitLetters), { max: 4, min: 0 })).join("");

/**
 * RFC 3986's own reading of a URI reference (Appendix B): scheme, authority, path, query and
 * fragment, each optional but the path.
 */
const appendixB =
  /^(?<scheme>(?:[^:/?#]+):)?(?<authority>\/\/(?:[^/?#]*))?(?<path>[^?#]*)(?<query>\?(?:[^#]*))?(?<fragment>#(?:.*))?$/su;

/**
 * Split a reference as RFC 3986's Appendix B reads it, after setting aside the XML whitespace
 * around it: a second implementation of `referencePiecesOf`, its target the scheme, authority and
 * path, its params the query and fragment.
 *
 * @param lexical - The lexical form.
 * @returns Its four pieces.
 */
const appendixPieces = (lexical: string) => {
  let first = 0;
  while (first < lexical.length && " \t\n\r".includes(lexical.charAt(first))) {
    first += 1;
  }

  let last = lexical.length;
  while (last > first && " \t\n\r".includes(lexical.charAt(last - 1))) {
    last -= 1;
  }

  const groups = appendixB.exec(lexical.slice(first, last))?.groups ?? {};

  return {
    lead: lexical.slice(0, first),
    params: `${groups["query"] ?? ""}${groups["fragment"] ?? ""}`,
    target: `${groups["scheme"] ?? ""}${groups["authority"] ?? ""}${groups["path"] ?? ""}`,
    trail: lexical.slice(last),
  };
};

/**
 * A situation the split box must reach.
 */
type SplitSituation = "fragment" | "lead" | "plain" | "query" | "trail";

/**
 * The census the reference rows are built over in these cases: four attributes of the grammar's
 * reference census, with their types' whitespace classes (`img@src` and `a@href` are
 * `xs:anyURI`s, `source@srcset` and `video@poster` `URLDType`s), one of them a srcset, and none
 * for `div@title`, which names no file.
 */
const census: ReferenceCensus = (_version, kind, name) =>
  Option.fromUndefinedOr(
    new Map<string, CensusEntry>([
      ["a href", { form: "uri", whiteSpace: "collapse" }],
      ["img src", { form: "uri", whiteSpace: "collapse" }],
      ["source srcset", { form: "srcset", whiteSpace: "replace" }],
      ["video poster", { form: "uri", whiteSpace: "replace" }],
    ]).get(`${kind} ${name}`),
  );

/**
 * The elements a generated document holds, each with the one attribute it carries.
 */
const carriers = [
  ["img", "src"],
  ["a", "href"],
  ["source", "srcset"],
  ["video", "poster"],
  ["div", "title"],
] as const;

/**
 * The values a generated reference takes: a plain path at the root and below, a leading `../` and
 * `./`, a dot segment after a plain one, a climb past the root, an external URI, a same-document
 * fragment, a padded path, a media fragment, a descriptor, two candidates, an empty value, a space
 * and its percent-encoding, an encoded `/`, an encoded `..`, a stray `%` and a backslash.
 */
const referenceValues = [
  "a.png",
  "img/b.png",
  "../c.png",
  "./d.png",
  "a/../b.png",
  "../../../e.png",
  "http://x.org/d.png",
  "#top",
  " e.png ",
  "f.mp4#t=1",
  "a.png 2x",
  "a.png,b.png",
  "",
  "my sign.png",
  "my%20sign.png",
  "a%2Fb.png",
  "%2E%2E/c.png",
  "a%zz.png",
  "a\\b.png",
] as const;

/**
 * The `xml:base` values a generated document draws for its root and for each element: none, a
 * directory, one that climbs, an external one, and one under a stated limit.
 */
const referenceBases = [undefined, "x/", "../", "http://h.org/", "x%zz/"] as const;

/**
 * One generated document: its path, its root's `xml:base`, and its elements, each with its own.
 */
interface ReferenceCase {
  readonly base: string | undefined;
  readonly elements: readonly {
    readonly base: string | undefined;
    readonly carrier: (typeof carriers)[number];
    readonly value: string;
  }[];
  readonly path: string;
}

/**
 * The generated documents: at the root or below it, with or without an `xml:base` on the root and
 * on each element, holding up to four elements of {@link carriers} with values of
 * {@link referenceValues}.
 */
const referenceCases: Gen<ReferenceCase> = (source) => ({
  base: source.draw(element(referenceBases)),
  elements: source.draw(
    array(
      (inner) => ({
        base: inner.draw(element(referenceBases)),
        carrier: inner.draw(element(carriers)),
        value: inner.draw(element(referenceValues)),
      }),
      { max: 4, min: 0 },
    ),
  ),
  path: source.draw(element(["item.xml", "items/item.xml"] as const)),
});

/**
 * Write a generated document as shred would give it: a `qti-assessment-item` holding its elements,
 * whitespace before each so character data shares the numbering.
 *
 * @param input - The document.
 * @returns The tree.
 */
const referenceTreeOf = (input: ReferenceCase): XdmDocument<Composed> => ({
  _tag: "document",
  charset: "UTF-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  exportCharset: "UTF-8",
  prolog: [],
  root: elementOf(
    "qti-assessment-item",
    baseAttribute(input.base),
    input.elements.flatMap(({ base, carrier: [kind, name], value }) => [
      { _tag: "ws", value: "\n" } as const,
      elementOf(kind, [[name, value], ...baseAttribute(base)], []),
    ]),
  ),
  version: "3.0.1",
});

/**
 * The reference rows a generated document implies, by a second reading: its nodes numbered in
 * document order (the document node 0, its root 1, then each whitespace node and element in turn),
 * each census attribute split by RFC 3986's Appendix B, and each value resolved by the law
 * oracle's own resolver with the root's and the element's `xml:base`, outermost first.
 *
 * @param input - The document.
 * @param documentIds - The ids its rows are written under.
 * @returns Its expected rows.
 */
const expectedReferences = (input: ReferenceCase, documentIds: DocumentIds) => {
  const document = documentIds.idOf(0);
  const references = new Map<string, object>();
  const paths = new Map<string, object>();
  for (const [at, { base, carrier, value }] of input.elements.entries()) {
    const [kind, name] = carrier;
    const node = documentIds.idOf(3 + 2 * at);
    for (const entry of Option.toArray(census("3.0.1", kind, name))) {
      const resolution = resolveAttribute({
        bases: [input.base, base].flatMap((written) => (written === undefined ? [] : [written])),
        document: documentIds.path,
        lexical: value,
        srcset: entry.form === "srcset",
        whiteSpace: entry.whiteSpace,
      });
      references.set(JSON.stringify([node, name]), {
        document,
        kind,
        lexical: value,
        name,
        node,
        scope: resolution.scope,
        ...appendixPieces(value),
      });
      if (resolution.scope === "entry") {
        paths.set(JSON.stringify([node, name]), {
          document,
          kind,
          name,
          node,
          package: documentIds.package,
          path: resolution.path,
        });
      }
    }
  }

  return { Reference: references, ReferencePath: paths };
};

/**
 * A situation the reference rows' search must reach: each scope, each kind of value, and an
 * `xml:base` in scope of a resolved reference.
 */
type ReferenceSituation =
  | "base beside a reference"
  | "decoded"
  | "external"
  | "not in the census"
  | "padded"
  | "params"
  | "resolved"
  | "same document"
  | "srcset"
  | "unresolved";

/**
 * Name the situations one generated document reaches.
 *
 * @param input - The document.
 * @param rows - Its rows, as the builder writes them.
 * @returns Its situations.
 */
const referenceSituationsOf = (
  input: ReferenceCase,
  rows: ReferenceRows,
): readonly ReferenceSituation[] => {
  const references = [...rows.Reference.values()];
  const based = input.base !== undefined || input.elements.some(({ base }) => base !== undefined);
  const reached: [ReferenceSituation, boolean][] = [
    ["resolved", rows.ReferencePath.size > 0],
    ["base beside a reference", based && rows.ReferencePath.size > 0],
    ["external", references.some(({ scope }) => scope === "external")],
    ["same document", references.some(({ scope }) => scope === "document")],
    ["unresolved", references.some(({ scope }) => scope === "unresolved")],
    ["decoded", [...rows.ReferencePath.values()].some(({ path: at }) => at.includes(" "))],
    ["padded", references.some(({ lead, trail }) => lead !== "" || trail !== "")],
    ["params", references.some(({ params }) => params !== "")],
    ["srcset", references.some(({ name }) => name === "srcset")],
    ["not in the census", input.elements.some(({ carrier: [kind] }) => kind === "div")],
  ];

  return reached.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

/**
 * Read an attribute's whitespace class from the inventory by a second walk, a union's read as
 * `preserve`.
 *
 * @param version - The schema version.
 * @param kind - The element's kind.
 * @param name - The attribute's name.
 * @returns The class, none for an undeclared attribute.
 */
const declaredWhiteSpace = (version: string, kind: string, name: string) => {
  const declaration = attributeDeclarations.find(
    (declared) =>
      declared.kind === kind &&
      declared.name === name &&
      declared.versions.some((held) => held === version),
  );

  return declaration?.type.whiteSpace === "union" ? "preserve" : declaration?.type.whiteSpace;
};

describe("import/overlays/package.ts, hrefs and references", () => {
  it("reads the grammar's census as ReferenceAttribute's rows hold it, each with its type's whitespace class, and no form for an attribute outside it", () => {
    // Oracle: the closed relation's own rows (`ReferenceAttribute`, spec reading 103), which the
    // database's copy into Reference selects by, against the builder's lookup; and the attribute
    // inventory's declarations, read by a second walk, for each one's whitespace class.
    // Bound: every row of ReferenceAttribute, and three attributes outside it.
    assert.isNotEmpty(ReferenceAttribute.rows);
    for (const { form, kind, name, version } of ReferenceAttribute.rows) {
      assert.deepStrictEqual(
        referenceCensus(version, kind, name),
        Option.some({ form, whiteSpace: declaredWhiteSpace(version, kind, name) }),
        `${version} ${kind} ${name}`,
      );
    }

    for (const [kind, name] of [
      ["div", "title"],
      ["cp:file", "href"],
      ["qti-assessment-item", "xml:base"],
    ] as const) {
      assert.isTrue(Option.isNone(referenceCensus("3.0.1", kind, name)), `${kind} ${name}`);
    }
  });

  it.effect(
    "splits every lexical form of the box as RFC 3986's Appendix B does, each piece of its pattern",
    (ctx) =>
      // Oracle: a second implementation, RFC 3986's Appendix B regular expression over the form
      // with its XML whitespace set aside; and the specification as a checker, each piece against
      // the pattern its field's check reads (hrefPathPattern, hrefParamsPattern, XML's S).
      // Bound: every lexical form of at most 4 of 7 letters, 2,801.
      searched(
        ctx,
        exhaust(
          {
            box: "every lexical form of at most 4 of a / : ? # space tab",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<SplitSituation>([
              "plain",
              "query",
              "fragment",
              "lead",
              "trail",
            ]),
            generator: lexicals,
            limit: 3000,
            literal: (lexical) => JSON.stringify(lexical),
            oracle: { kind: "second-implementation", name: "RFC 3986, Appendix B" },
            suite: "import/overlays-package-split",
          },
          (lexical: string, c) =>
            Effect.sync(() => {
              const pieces = referencePiecesOf(lexical);
              const expected = appendixPieces(lexical);
              const core = lexical.slice(
                expected.lead.length,
                lexical.length - expected.trail.length,
              );

              c.note(expected.params.startsWith("?") ? "query" : "plain");
              if (expected.params.startsWith("#")) {
                c.note("fragment");
              }

              if (expected.lead !== "") {
                c.note("lead");
              }

              if (expected.trail !== "") {
                c.note("trail");
              }

              assert.deepStrictEqual(pieces, expected, JSON.stringify(lexical));
              assert.deepStrictEqual(
                hrefPiecesOf(core),
                { params: expected.params, path: expected.target },
                JSON.stringify(core),
              );
              assert.match(pieces.target, new RegExp(hrefPathPattern, "u"));
              assert.match(pieces.params, new RegExp(hrefParamsPattern, "su"));
              assert.strictEqual(
                `${pieces.lead}${pieces.target}${pieces.params}${pieces.trail}`,
                lexical,
              );
            }),
        ),
      ),
  );

  it.effect(
    "writes each document's reference rows as a second reading of its tree names them",
    (ctx) =>
      // Oracle: a second implementation, `expectedReferences`: the nodes numbered by hand, each
      // value split by RFC 3986's Appendix B and resolved by the law oracle's own RFC 3986
      // resolver with the xml:base values in scope.
      // Bound: documents at 2 paths, under 5 xml:base values on the root and on each of up to 4
      // elements of 5 kinds with 19 values, 400 runs.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required<ReferenceSituation>(
              [
                "resolved",
                "base beside a reference",
                "decoded",
                "external",
                "same document",
                "unresolved",
                "padded",
                "params",
                "srcset",
                "not in the census",
              ],
              { cases: 300, sense: notesOnly },
            ),
            draw: drawn(referenceCases),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "a second reading of the tree, its values by the oracle's RFC 3986 resolver",
            },
            runs: 400,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "import/overlays-package-references",
          },
          (input, c) =>
            Effect.sync(() => {
              const documentIds: DocumentIds = { ...ids, path: input.path };
              const rows = referenceRowsOf(referenceTreeOf(input), documentIds, census);
              const expected = expectedReferences(input, documentIds);

              c.noteAll(referenceSituationsOf(input, rows));
              for (const relation of ["Reference", "ReferencePath"] as const) {
                assert.deepStrictEqual(
                  sortedEntries(rows[relation]),
                  sortedEntries(expected[relation]),
                  relation,
                );
              }
            }),
        ),
      ),
  );

  it("writes a TextReference for each card file and resource icon, resolved as an attribute is, and none for a calculator's or digital material's file", () => {
    // Oracle: a second implementation, the nodes numbered by hand (the document node 0, the root 1,
    // then each whitespace node, element and its text in turn), each string value split by RFC
    // 3986's Appendix B and resolved by the law oracle's own resolver with the xml:base in scope,
    // under the whitespace class of its text's type (`xs:anyURI` collapses, `URLDType` replaces).
    // Bound: one card file padded and percent-encoded, one icon under an xml:base, one icon of a
    // same-document fragment, one file of a digital material, and an empty card file.
    const textOf = (
      kind: "qti-file-href" | "qti-file-href.card" | "qti-resource-icon",
      value: string,
      base?: string,
    ) => [
      { _tag: "ws", value: "\n" } as const,
      elementOf(kind, baseAttribute(base), value === "" ? [] : [{ _tag: "text", value }]),
    ];
    const cases = [
      { base: undefined, kind: "qti-file-href.card", value: " my%20clip.mp4 " },
      { base: "x/", kind: "qti-resource-icon", value: "img/b.svg" },
      { base: undefined, kind: "qti-resource-icon", value: "#top" },
      { base: undefined, kind: "qti-file-href", value: "absent.png" },
      { base: undefined, kind: "qti-file-href.card", value: "" },
    ] as const;
    const tree: XdmDocument<Composed> = {
      ...referenceTreeOf({ base: undefined, elements: [], path: "items/item.xml" }),
      root: elementOf(
        "qti-assessment-item",
        [],
        cases.flatMap(({ base, kind, value }) => textOf(kind, value, base)),
      ),
    };
    const documentIds: DocumentIds = { ...ids, path: "items/item.xml" };
    const rows = referenceRowsOf(tree, documentIds, census);

    const expectedTexts = new Map<string, object>();
    const expectedPaths = new Map<string, object>();
    let next = 2;
    for (const { base, kind, value } of cases) {
      const node = documentIds.idOf(next + 1);
      next += value === "" ? 2 : 3;
      if (kind === "qti-file-href") {
        continue;
      }

      const resolution = resolveAttribute({
        bases: base === undefined ? [] : [base],
        document: documentIds.path,
        lexical: value,
        srcset: false,
        whiteSpace: kind === "qti-resource-icon" ? "replace" : "collapse",
      });
      expectedTexts.set(JSON.stringify([node]), {
        document: documentIds.idOf(0),
        kind,
        lexical: value,
        node,
        scope: resolution.scope,
        ...appendixPieces(value),
      });
      if (resolution.scope === "entry") {
        expectedPaths.set(JSON.stringify([node]), {
          document: documentIds.idOf(0),
          kind,
          node,
          package: documentIds.package,
          path: resolution.path,
        });
      }
    }

    assert.strictEqual(expectedTexts.size, 4);
    assert.deepStrictEqual(sortedEntries(rows.TextReference), sortedEntries(expectedTexts));
    assert.deepStrictEqual(sortedEntries(rows.TextReferencePath), sortedEntries(expectedPaths));
    assert.deepStrictEqual(
      [...rows.TextReferencePath.values()].map(({ path: at }) => at),
      ["items/my clip.mp4", "items/x/img/b.svg"],
    );
  });
});
