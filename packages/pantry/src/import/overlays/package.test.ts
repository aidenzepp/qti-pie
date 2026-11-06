/* oxlint-disable unicorn/text-encoding-identifier-case -- The generated documents carry the charset label crust's reader reports, `UTF-8`. */
/**
 * The manifest's overlay rows against a second reading of the same tree: a direct walk of the XDM
 * document, numbering its nodes in document order as the tree's rows are numbered, and collecting
 * each overlay's row from its element and attributes. The walk shares no code with the builder,
 * which reads the tree's flat rows (`flatten`).
 */
import path from "node:path";
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
  directoryOf,
  hrefPiecesOf,
  namedDocuments,
  referenceCensus,
  referencePiecesOf,
  referenceRowsOf,
  resolutionOf,
  rowsOf,
} from "#pantry/import/overlays/package.ts";
import type {
  DocumentIds,
  ManifestIds,
  PackageRows,
  ReferenceCensus,
  ReferenceForm,
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
import { resolvedHref } from "#pantry/qti/limits.ts";
import { DotSegments, hrefParamsPattern, hrefPathPattern } from "#pantry/qti/package.ts";

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
 * Expect a resource's `href` rows: its `ResourceHref`, split at its first `?` or `#` (reading 94),
 * and the `NamedHref` of its path and type.
 *
 * @param expected - The walk's rows so far.
 * @param resource - The resource's href, node, package and type.
 * @param resource.href - Its href.
 * @param resource.node - Its node.
 * @param resource.pkg - Its package.
 * @param resource.type - Its type.
 */
const expectHref = (
  expected: Expected,
  resource: {
    readonly href: string;
    readonly node: NodeId;
    readonly pkg: string;
    readonly type: string;
  },
): void => {
  const { href, node, pkg, type } = resource;
  const query = /[?#]/u.exec(href)?.index ?? href.length;
  const at = href.slice(0, query);
  expected.ResourceHref.set(node, {
    href,
    node,
    package: pkg,
    params: href.slice(query),
    path: at,
    type,
  });
  expected.NamedHref.set(heading([pkg, at, type]), { package: pkg, path: at, type });
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
    File: new Map(),
    FileHref: new Map(),
    ManifestId: new Map(),
    NamedHref: new Map(),
    Resource: new Map(),
    ResourceFile: new Map(),
    ResourceHref: new Map(),
  };
  const document = ids.idOf(0);
  const interactions = new Set<string>(interactionKinds);
  const spelled = new Set<string>(ResourceTypeLexical.rows.map(({ lexical }) => lexical));
  let next = 1;
  let manifestIdentifier = "";
  const identifiers = new Map<NodeId, string>();
  const visit = (
    child: XdmChild<Composed> | XdmDocument<Composed>["root"],
    parent: { readonly id: NodeId; readonly kind: string; readonly nearest: NodeId },
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

    if (kind === "cp:manifest") {
      manifestIdentifier = valueOf("identifier") ?? "";
      expected.ManifestId.set(id, {
        ...tuple,
        identifier: manifestIdentifier,
        package: pkg,
        parent: parent.id,
      });
    }

    if (kind === "cp:resource") {
      const typeLexical = valueOf("type") ?? "";
      const type = spelled.has(typeLexical) ? typeLexical : "none";
      const href = valueOf("href");
      identifiers.set(id, valueOf("identifier") ?? "");
      expected.Resource.set(id, {
        ...tuple,
        identifier: valueOf("identifier") ?? "",
        manifestIdentifier,
        package: pkg,
        parent: parent.id,
        type,
        typeLexical,
      });
      if (href !== undefined) {
        expectHref(expected, { href, node: id, pkg, type });
      }
    }

    const fileHref = kind === "cp:file" ? valueOf("href") : undefined;
    if (fileHref !== undefined) {
      expected.File.set(id, { ...tuple, href: fileHref, package: pkg, resource: parent.id });
      expected.FileHref.set(heading([pkg, fileHref]), { href: fileHref, package: pkg });
      expected.ResourceFile.set(heading([parent.id, fileHref]), {
        href: fileHref,
        resource: parent.id,
      });
    }

    const ref = kind === "cp:dependency" ? valueOf("identifierref") : undefined;
    if (ref !== undefined) {
      expected.Dependency.set(id, {
        ...tuple,
        package: pkg,
        ref,
        resource: parent.id,
        resourceIdentifier: identifiers.get(parent.id) ?? "",
      });
    }

    for (const grandchild of child.children) {
      visit(grandchild, { id, kind, nearest });
    }
  };

  for (const child of documentFamily(doc)) {
    if (child._tag === "element") {
      visit(child, { id: document, kind: "document", nearest: document });
    } else {
      next += 1;
    }
  }

  return expected;
};

/**
 * The overlay relations the builder writes rows of.
 */
const relationNames = [
  "Dependency",
  "File",
  "FileHref",
  "ManifestId",
  "NamedHref",
  "Resource",
  "ResourceFile",
  "ResourceHref",
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
  readonly resources: readonly {
    readonly dependencies: readonly string[];
    readonly files: readonly string[];
    readonly href: string | undefined;
    readonly type: string;
  }[];
}

/**
 * The generated manifests: up to three resources, each of a document type, a type no document has
 * and a type no handle spells (named variant `unknown-type`), with or without an href (`no-href`),
 * an href with launch parameters or a fragment among them (`href-params`, reading 94), listing up
 * to three files drawn from two hrefs, so a file listed twice (`file-twice`) and a file two
 * resources list (`shared-file`) are drawn, and up to two dependencies, a resource's own identifier
 * among them (`self-dependency`).
 */
const manifests: Gen<ManifestCase> = (source) => ({
  resources: source.draw(
    array(
      (inner) => ({
        dependencies: inner.draw(array(element(["r0", "r1", "m"] as const), { max: 2, min: 0 })),
        files: inner.draw(array(element(["a.xml", "b/c.png"] as const), { max: 3, min: 0 })),
        href: inner.draw(
          element(["a.xml", "b/c.png", "a.xml?x=1&y=2", "b/c.png#top", "?q", undefined] as const),
        ),
        type: inner.draw(element(["imsqti_item_xmlv3p0", "webcontent", "bogus"] as const)),
      }),
      { max: 3, min: 0 },
    ),
  ),
});

/**
 * A situation a generated manifest reaches, each a named variant the builder must hold.
 */
type Situation =
  | "file-twice"
  | "href-params"
  | "no-href"
  | "self-dependency"
  | "shared-file"
  | "unknown-type";

/**
 * Name the situations one generated manifest reaches.
 *
 * @param input - The manifest.
 * @returns Its situations.
 */
const situationsOf = (input: ManifestCase): readonly Situation[] => {
  const files = input.resources.flatMap(({ files: listed }) => listed);

  const reached: [Situation, boolean][] = [
    ["no-href", input.resources.some(({ href }) => href === undefined)],
    ["unknown-type", input.resources.some(({ type }) => type === "bogus")],
    [
      "file-twice",
      input.resources.some(({ files: listed }) => new Set(listed).size < listed.length),
    ],
    ["shared-file", new Set(files).size < files.length],
    ["href-params", input.resources.some(({ href }) => href !== undefined && /[?#]/u.test(href))],
    [
      "self-dependency",
      input.resources.some(({ dependencies }, at) => dependencies.includes(`r${String(at)}`)),
    ],
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
 * Write a generated manifest as the tree shred would give: a `cp:manifest` of identifier `m`
 * holding its `cp:resources`, each resource `r<n>` with its files and dependencies, whitespace
 * between them so character data shares the numbering.
 *
 * @param input - The manifest.
 * @returns The tree.
 */
const treeOf = (input: ManifestCase): XdmDocument<Composed> => {
  const ws: XdmChild<Composed> = { _tag: "ws", value: "\n" };
  const resources = input.resources.map(({ dependencies, files, href, type }, at) =>
    elementOf(
      "cp:resource",
      [
        ["identifier", `r${String(at)}`],
        ["type", type],
        ...(href === undefined ? [] : [["href", href] as const]),
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
      [["identifier", "m"]],
      [ws, elementOf("cp:resources", [], resources)],
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

describe("import/overlays/package.ts", () => {
  it.effect("writes each overlay's rows as the walk of the manifest's tree names them", (ctx) =>
    // Oracle: a second implementation, a direct walk of the XDM document that numbers its nodes in
    // document order and reads each element's attributes, against the builder's read of the tree's
    // flat rows; the type codes against `ResourceTypeLexical`.
    // Bound: up to 3 resources of 3 types, with or without one of 5 hrefs (3 with a query or a
    // fragment), listing up to 3 of 2 files and up to 2 dependencies, 300 runs.
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
            ],
            { cases: 200, sense: notesOnly },
          ),
          draw: drawn(manifests),
          kept: [],
          literal: Formatter.format,
          oracle: { kind: "second-implementation", name: "a direct walk of the XDM tree" },
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
 * reference census, one of them a srcset, and none for `div@title`, which names no file.
 */
const census: ReferenceCensus = (_version, kind, name) =>
  new Map<string, ReferenceForm>([
    ["a href", "uri"],
    ["img src", "uri"],
    ["source srcset", "srcset"],
    ["video poster", "uri"],
  ]).get(`${kind} ${name}`);

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
 * `./`, a dot segment after a plain one, an external URI, a same-document fragment, a padded path,
 * a media fragment, a descriptor, two candidates and an empty value.
 */
const referenceValues = [
  "a.png",
  "img/b.png",
  "../c.png",
  "./d.png",
  "a/../b.png",
  "http://x.org/d.png",
  "#top",
  " e.png ",
  "f.mp4#t=1",
  "a.png 2x",
  "a.png,b.png",
  "",
] as const;

/**
 * One generated document: its path, whether its root holds an `xml:base`, and its elements.
 */
interface ReferenceCase {
  readonly base: boolean;
  readonly elements: readonly {
    readonly carrier: (typeof carriers)[number];
    readonly value: string;
  }[];
  readonly path: string;
}

/**
 * The generated documents: at the root or below it, with or without an `xml:base`, holding up to
 * four elements of {@link carriers} with values of {@link referenceValues}.
 */
const referenceCases: Gen<ReferenceCase> = (source) => ({
  base: source.draw(element([false, true] as const)),
  elements: source.draw(
    array(
      (inner) => ({
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
    input.base ? [["xml:base", "x/"]] : [],
    input.elements.flatMap(({ carrier: [kind, name], value }) => [
      { _tag: "ws", value: "\n" } as const,
      elementOf(kind, [[name, value]], []),
    ]),
  ),
  version: "3.0.1",
});

/**
 * Resolve a target as the walk reads RFC 3986 §5.2.4 for leading dot segments, segment by segment:
 * its leading `.` and `..` segments are `ups`, the rest must be in the form, each `..` removes
 * one of the directory's last segments (all of them, and the climb's depth capped at 8, where it
 * climbs above the root or further than that), and the path is what is kept followed by the rest.
 *
 * @param directory - The document's directory.
 * @param target - The target.
 * @param form - The `resolvedHref` form.
 * @returns The `ReferencePath` pieces, or null for a target outside the form.
 */
const walkResolution = (directory: string, target: string, form: RegExp) => {
  const segments = target.split("/");
  const lead = segments.findIndex((segment) => segment !== "." && segment !== "..");
  const leading = lead === -1 ? segments : segments.slice(0, lead);
  const rest = segments.slice(leading.length).join("/");
  if (!form.test(rest)) {
    return null;
  }

  const climb = leading.filter((segment) => segment === "..").length;
  const held = directory.split("/").slice(0, -1);
  const fits = climb <= held.length && climb <= 8;
  const kept = fits ? held.slice(0, held.length - climb).map((segment) => `${segment}/`) : [];

  return {
    climb: String(Math.min(climb, 8)),
    kept: kept.join(""),
    path: `${kept.join("")}${rest}`,
    removed: fits ? directory.slice(kept.join("").length) : directory,
    rest,
    ups: leading.map((segment) => `${segment}/`).join(""),
  };
};

/**
 * The reference rows a generated document implies, by a second reading: its nodes numbered in
 * document order (the document node 0, its root 1, then each whitespace node and element in turn),
 * its directory and name by Node's `path.posix`, each census attribute split by RFC 3986's
 * Appendix B, and each target the form admits (`resolvedHref`, which `qti/package.test.ts` holds to
 * RFC 3986's grammar) resolved against the directory.
 *
 * @param input - The document.
 * @param documentIds - The ids its rows are written under.
 * @returns Its expected rows.
 */
const expectedReferences = (input: ReferenceCase, documentIds: DocumentIds) => {
  const document = documentIds.idOf(0);
  const dirname = path.posix.dirname(documentIds.path);
  const directory = dirname === "." ? "" : `${dirname}/`;
  const form = new RegExp(resolvedHref, "u");
  const references = new Map<string, object>();
  const paths = new Map<string, object>();
  for (const [at, { carrier, value }] of input.elements.entries()) {
    const [kind, name] = carrier;
    const node = documentIds.idOf(3 + 2 * at);
    if (census("3.0.1", kind, name) !== undefined) {
      const pieces = appendixPieces(value);
      references.set(JSON.stringify([node, name]), {
        document,
        kind,
        lexical: value,
        name,
        node,
        ...pieces,
      });

      const resolution = walkResolution(directory, pieces.target, form);
      if (resolution !== null) {
        paths.set(JSON.stringify([node, name, "0"]), {
          ...resolution,
          at: 0n,
          directory,
          document,
          kind,
          name,
          node,
          package: documentIds.package,
          target: pieces.target,
        });
      }
    }
  }

  return {
    DocumentDirectory: new Map([
      [
        document,
        {
          directory,
          name: path.posix.basename(documentIds.path),
          node: document,
          package: documentIds.package,
          path: documentIds.path,
        },
      ],
    ]),
    Reference: references,
    ReferencePath: paths,
    XmlBase: new Map(
      input.base ? [[documentIds.idOf(1), { document, node: documentIds.idOf(1) }]] : [],
    ),
  };
};

/**
 * A situation the reference rows' search must reach: each kind of value, and a document with an
 * `xml:base` beside a resolved reference, which "Href form" refuses.
 */
type ReferenceSituation =
  | "base beside a reference"
  | "dot segments"
  | "external"
  | "not in the census"
  | "outside the form"
  | "padded"
  | "params"
  | "resolved"
  | "same document"
  | "srcset";

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
  const reached: [ReferenceSituation, boolean][] = [
    ["resolved", rows.ReferencePath.size > 0],
    ["base beside a reference", input.base && rows.ReferencePath.size > 0],
    ["external", references.some(({ target }) => target.startsWith("http:"))],
    ["same document", references.some(({ lexical }) => lexical.startsWith("#"))],
    ["outside the form", references.some(({ target }) => target.includes("/../"))],
    ["dot segments", [...rows.ReferencePath.values()].some(({ ups }) => ups !== "")],
    ["padded", references.some(({ lead, trail }) => lead !== "" || trail !== "")],
    ["params", references.some(({ params }) => params !== "")],
    ["srcset", references.some(({ name }) => name === "srcset")],
    ["not in the census", input.elements.some(({ carrier: [kind] }) => kind === "div")],
  ];

  return reached.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

/**
 * The segments the resolution box writes targets of: a plain segment, `.`, `..` and a plain
 * segment holding a dot.
 */
const resolutionSegments = ["x", ".", "..", "y.z"] as const;

/**
 * One case of the resolution box: a document's directory and a reference's target.
 */
interface ResolutionCase {
  readonly directory: string;
  readonly target: string;
}

/**
 * Every target of one to four of {@link resolutionSegments} under the package root, one directory
 * and two: the resolution box, 1,020 cases.
 */
const resolutionCases: Gen<ResolutionCase> = (source) => ({
  directory: source.draw(element(["", "a/", "a/b/"] as const)),
  target: source.draw(array(element(resolutionSegments), { max: 4, min: 1 })).join("/"),
});

/**
 * Read `DotSegments`' `ups` pattern at a depth, as the database reads it.
 *
 * @param depth - The depth.
 * @returns The pattern.
 */
const statedUps = (depth: string): RegExp =>
  new RegExp(DotSegments.rows.find((row) => row.depth === depth)?.ups ?? "^$.", "u");

/**
 * Read `DotSegments`' `removed` pattern at a depth, as the database reads it.
 *
 * @param depth - The depth.
 * @returns The pattern.
 */
const statedRemoved = (depth: string): RegExp =>
  new RegExp(DotSegments.rows.find((row) => row.depth === depth)?.removed ?? "^$.", "u");

/**
 * The patterns `ReferencePath`'s "Href form" reads at a depth, as `DotSegments` installs them, and
 * two mutants: the climb's segments of any depth, and the removed segments of any number.
 */
const dotPatterns = {
  removedAny: { removed: () => /^(?:[^/]+\/)*$/u, ups: (depth: string) => statedUps(depth) },
  stated: {
    removed: (depth: string) => statedRemoved(depth),
    ups: (depth: string) => statedUps(depth),
  },
  upsAny: { removed: (depth: string) => statedRemoved(depth), ups: () => /^(?:\.\.?\/)*$/u },
} as const;

/**
 * Whether a `ReferencePath`'s pieces hold its "Href form" under a set of patterns: its rest in the
 * `resolvedHref` form, its `ups` and `removed` those of its climb.
 *
 * @param pieces - The pieces.
 * @param patterns - The patterns.
 * @returns Whether they hold.
 */
const formHolds = (
  pieces: {
    readonly climb: string;
    readonly removed: string;
    readonly rest: string;
    readonly ups: string;
  },
  patterns: (typeof dotPatterns)[keyof typeof dotPatterns],
): boolean =>
  new RegExp(resolvedHref, "u").test(pieces.rest) &&
  patterns.ups(pieces.climb).test(pieces.ups) &&
  patterns.removed(pieces.climb).test(pieces.removed);

/**
 * A situation the resolution box must reach.
 */
type ResolutionSituation =
  | "above the root"
  | "climbs"
  | "limit"
  | "plain"
  | "removed-any killed"
  | "ups-any killed";

describe("import/overlays/package.ts, hrefs and references", () => {
  it.effect(
    "resolves every target of the box to the entry the WHATWG URL Standard names, in pieces its row checks hold, and leaves exactly the stated limit unresolved",
    (ctx) =>
      // Oracle: a second implementation, the WHATWG URL Standard's resolution (Node's URL) against
      // `pkg:/r/<directory>d.xml`, the sentinel segment `r` telling a target that climbs above the
      // package root; and the specification as a checker, ReferencePath's E1_derived and
      // Href_form restated over the pieces with DotSegments' installed patterns, which also
      // refuse the pieces of a climb written as no climb, and of a climb that removes too little.
      // Bound: every target of one to four of 4 segments under 3 directories, 1,020.
      searched(
        ctx,
        exhaust(
          {
            box: "every target of one to four of x . .. y.z under the root, a/ and a/b/",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<ResolutionSituation>([
              "plain",
              "climbs",
              "above the root",
              "limit",
              "removed-any killed",
              "ups-any killed",
            ]),
            generator: resolutionCases,
            limit: 1100,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the WHATWG URL Standard's resolution, with a sentinel root",
            },
            suite: "import/overlays-package-resolution",
          },
          ({ directory, target }: ResolutionCase, c) =>
            Effect.sync(() => {
              const resolution = resolutionOf(directory, target);
              const whatwg = new URL(target, `pkg:/r/${directory}d.xml`).pathname;
              const segments = target.split("/");
              const lead = segments.findIndex((segment) => segment !== "." && segment !== "..");
              const rest = lead === -1 ? [] : segments.slice(lead);
              if (
                rest.length === 0 ||
                rest.some((segment) => segment === "." || segment === "..")
              ) {
                c.note("limit");
                assert.isUndefined(resolution, target);

                return;
              }

              assert.isDefined(resolution, target);
              if (resolution === undefined) {
                return;
              }

              assert.strictEqual(`${resolution.ups}${resolution.rest}`, target);
              assert.strictEqual(`${resolution.kept}${resolution.removed}`, directory);
              assert.strictEqual(resolution.path, `${resolution.kept}${resolution.rest}`);
              if (whatwg.startsWith("/r/")) {
                c.note(resolution.ups === "" ? "plain" : "climbs");
                assert.isTrue(formHolds(resolution, dotPatterns.stated), target);
                assert.strictEqual(resolution.path, whatwg.slice("/r/".length), target);
              } else {
                c.note("above the root");
                assert.isFalse(formHolds(resolution, dotPatterns.stated), target);
              }

              if (resolution.climb !== "0") {
                const asNoClimb = { ...resolution, climb: "0", removed: "" };
                const tooLittle = { ...resolution, removed: "" };

                assert.isFalse(formHolds(asNoClimb, dotPatterns.stated), target);
                assert.isFalse(formHolds(tooLittle, dotPatterns.stated), target);
                if (formHolds(asNoClimb, dotPatterns.upsAny)) {
                  c.note("ups-any killed");
                }

                if (formHolds(tooLittle, dotPatterns.removedAny)) {
                  c.note("removed-any killed");
                }
              }
            }),
        ),
      ),
  );

  it("reads the grammar's census as ReferenceAttribute's rows hold it, and no form for an attribute outside it", () => {
    // Oracle: the closed relation's own rows (`ReferenceAttribute`, spec reading 95), which the
    // database's copy into Reference selects by, against the builder's lookup.
    // Bound: every row of ReferenceAttribute, and three attributes outside it.
    assert.isNotEmpty(ReferenceAttribute.rows);
    for (const { form, kind, name, version } of ReferenceAttribute.rows) {
      assert.strictEqual(referenceCensus(version, kind, name), form, `${version} ${kind} ${name}`);
    }

    for (const [kind, name] of [
      ["div", "title"],
      ["cp:file", "href"],
      ["qti-assessment-item", "xml:base"],
    ] as const) {
      assert.isUndefined(referenceCensus("3.0.1", kind, name), `${kind} ${name}`);
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

  it.effect("splits every path of the box at its last slash as Node's path.posix does", (ctx) =>
    // Oracle: a second implementation, Node's `path.posix.dirname` and `basename`.
    // Bound: every path of one to three segments of 3, 39.
    searched(
      ctx,
      exhaust(
        {
          box: "every path of one to three segments of a, b.c and ü",
          caseHang: Duration.seconds(10),
          coverage: requiredInSpace<"root" | "below">(["root", "below"]),
          generator: (source) =>
            source.draw(array(element(["a", "b.c", "ü"] as const), { max: 3, min: 1 })).join("/"),
          limit: 100,
          literal: (entry) => entry,
          oracle: { kind: "second-implementation", name: "Node's path.posix" },
          suite: "import/overlays-package-directory",
        },
        (entry: string, c) =>
          Effect.sync(() => {
            const dirname = path.posix.dirname(entry);

            c.note(dirname === "." ? "root" : "below");
            assert.deepStrictEqual(directoryOf(entry), {
              directory: dirname === "." ? "" : `${dirname}/`,
              name: path.posix.basename(entry),
            });
          }),
      ),
    ),
  );

  it.effect(
    "writes each document's reference rows as a second reading of its tree names them",
    (ctx) =>
      // Oracle: a second implementation, `expectedReferences`: the nodes numbered by hand, the
      // directory by Node's path.posix, each value split by RFC 3986's Appendix B.
      // Bound: documents at 2 paths, with and without an xml:base, of up to 4 elements of 5 kinds
      // with 10 values, 400 runs.
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
                "dot segments",
                "external",
                "same document",
                "outside the form",
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
            oracle: { kind: "second-implementation", name: "a second reading of the tree" },
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
              for (const relation of [
                "DocumentDirectory",
                "Reference",
                "ReferencePath",
                "XmlBase",
              ] as const) {
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
});
