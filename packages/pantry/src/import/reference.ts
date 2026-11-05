/**
 * The package-level stage: what is judged and written once every document of a package is read,
 * across documents rather than inside one.
 *
 * It resolves each item, section and stimulus reference to the document or LTI resource it names,
 * writes a row for every in-package file an attribute names, computes what each test reaches
 * through its section refs, and writes the arms that need a resolved item reference: a test's
 * variable mappings and template defaults (spec 4.4, 4.5, 4.6 and 4.9).
 */
import type { Fact, Uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import { typedValues } from "#pantry/schema/attribute-homes.ts";
import { resolvePackageReference } from "#pantry/import/package-reference.ts";
import { reachOf } from "#pantry/import/reach.ts";
import type { StructureDocument } from "#pantry/import/reach.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { attributeReader } from "#pantry/import/interactions.ts";
import { requiredAttribute } from "#pantry/import/required.ts";
import { Rows, withParents } from "#pantry/import/tree.ts";
import type { ItemRefusal, NodeIndex } from "#pantry/import/tree.ts";
import {
  MappedVariableName,
  PackagePath,
  TestStructureIdentifier,
} from "#pantry/schema/contracts.ts";
import { NodeXmlBase } from "#pantry/schema/attributes.ts";
import { Document } from "#pantry/schema/document.ts";
import { Edge, Node } from "#pantry/schema/node.ts";
import type { AttributeNameHandle, NodeKindHandle } from "#pantry/schema/node.ts";
import { File, Resource, ResourceHref } from "#pantry/schema/package.ts";
import {
  AttributeFileReference,
  ItemRefDocument,
  ItemRefLti,
  ItemRefResolution,
  SectionRefResolution,
  StimulusRefResolution,
} from "#pantry/schema/reference.ts";
import { ItemStimulusRef } from "#pantry/schema/stimulus.ts";
import { TemplateDefault, VariableMapping } from "#pantry/schema/test/rules.ts";
import {
  ItemRef,
  SectionRef,
  TestDocument,
  TestIdentifier,
  TestReach,
} from "#pantry/schema/test/structure.ts";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * One decoded document of the package and the node each of its elements became, which the stage
 * reads the attributes of its mappings and template defaults from.
 */
export interface StagedDocument {
  readonly doc: XmlDocument;
  readonly nodes: NodeIndex;
}

/**
 * The resource types that stand for an LTI tool, which an item reference may name in place of an
 * item (R36).
 */
const ltiTypes: ReadonlySet<string> = new Set([
  "imsbasiclti_xmlv1p3",
  "imslti_xmlv1p1",
  "imsltia_xmlv1p0",
]);

/**
 * The in-package URI attributes of a QTI document by element kind (spec 4.6's census). Item,
 * section and stimulus refs have their own resolutions.
 */
const fileAttributes: ReadonlyMap<NodeKindHandle, readonly AttributeNameHandle[]> = new Map<
  NodeKindHandle,
  readonly AttributeNameHandle[]
>([
  ["a", ["href"]],
  ["audio", ["src"]],
  ["blockquote", ["cite"]],
  ["img", ["src", "longdesc"]],
  ["object", ["data"]],
  ["q", ["cite"]],
  ["qti-adaptive-engine-ref", ["href"]],
  ["qti-adaptive-settings-ref", ["href"]],
  ["qti-metadata-ref", ["href"]],
  ["qti-stylesheet", ["href"]],
  ["qti-usagedata-ref", ["href"]],
  ["source", ["src", "srcset"]],
  ["track", ["src"]],
  ["video", ["src", "poster"]],
  ["xi:include", ["href"]],
]);

/**
 * The URL of each candidate of a `srcset` value, in order: a candidate is a run of non-space
 * characters, with any commas that end it dropped, then an optional descriptor up to the next comma
 * outside parentheses. A candidate's position is its index in this list, whether or not it names a
 * file of the package.
 *
 * @param value - The `srcset` as written.
 * @returns The candidates' URLs.
 */
export const srcsetUrls = (value: string): readonly string[] => {
  const urls: string[] = [];
  let at = 0;
  while (at < value.length) {
    while (at < value.length && /[\s,]/u.test(value.charAt(at))) {
      at += 1;
    }

    const start = at;
    while (at < value.length && !/\s/u.test(value.charAt(at))) {
      at += 1;
    }

    if (at > start) {
      const url = value.slice(start, at);
      urls.push(url.replace(/,+$/u, ""));
      if (!url.endsWith(",")) {
        let depth = 0;
        while (at < value.length && (depth > 0 || value.charAt(at) !== ",")) {
          depth += value.charAt(at) === "(" ? 1 : 0;
          depth -= value.charAt(at) === ")" && depth > 0 ? 1 : 0;
          at += 1;
        }
      }
    }
  }

  return urls;
};

/**
 * The `xml:base` values in force at each node, outermost first: the node's own and each
 * ancestor's.
 */
const baseChains = (rows: Rows): ((node: string) => readonly string[]) => {
  const parents = new Map<string, string>(
    Rows.of(rows, Edge).map((edge) => [edge.child, edge.parent]),
  );
  const bases = new Map<string, string>(
    Rows.of(rows, NodeXmlBase).map((row) => [row.node, row.value]),
  );

  return (node) => {
    const chain: string[] = [];
    const seen = new Set<string>();
    for (
      let at: string | undefined = node;
      at !== undefined && !seen.has(at);
      at = parents.get(at)
    ) {
      seen.add(at);

      const base = bases.get(at);
      if (base !== undefined) {
        chain.push(base);
      }
    }

    return chain.toReversed();
  };
};

/**
 * What the stage reads of the rows so far.
 */
interface Context {
  readonly chain: (node: string) => readonly string[];
  readonly documents: ReadonlyMap<string, Fact<typeof Document>>;
  readonly rows: Rows;
}

/**
 * The in-package path `value` names when carried by `node` of `document`, none when it names no
 * file of the package or the document is not among the rows.
 */
const pathOf = (
  context: Context,
  value: string,
  document: string,
  node: string,
): string | undefined => {
  const base = context.documents.get(document)?.path;
  if (base === undefined) {
    return undefined;
  }

  const result = resolvePackageReference(value, base, context.chain(node));

  return result._tag === "InPackage" ? result.path : undefined;
};

/**
 * The documents of the package at `path`, by package and path, in the order the rows hold them.
 */
const documentsAt = (documents: ReadonlyMap<string, Fact<typeof Document>>) => {
  const byPath = Map.groupBy(documents.values(), (found) => `${found.package}\n${found.path}`);

  return (pkg: string, path: string): readonly Fact<typeof Document>[] =>
    byPath.get(`${pkg}\n${path}`) ?? [];
};

/**
 * The document a reference resolves to: the one at `path` whose root is `root`, or, when none is,
 * the first document at `path`, so that a reference to a document of another kind is written and
 * refused by its resolution's containment rather than dropped.
 */
const targetAt = (
  found: readonly Fact<typeof Document>[],
  root: Fact<typeof Document>["root"],
): Fact<typeof Document> | undefined => found.find((one) => one.root === root) ?? found[0];

/**
 * The resolution rows of every item ref: its document when the path names an item document or a
 * document of another kind, its LTI resource when the path is the `href` of a resource of an LTI
 * type, and nothing when the path names neither (the item ref has no resolution, which its
 * containment refuses). A resource names its link by its `href`, or, when it has none (the `lti`
 * example's), by the one `file` it lists.
 */
const itemRefRows = (context: Context, rows: Rows): Rows => {
  const at = documentsAt(context.documents);
  const resources = new Map<string, Fact<typeof Resource>>(
    Rows.of(rows, Resource).map((resource) => [resource.id, resource]),
  );
  const resourceAt = new Map<string, Fact<typeof Resource>>();
  const register = (key: string, id: string): void => {
    const resource = resources.get(id);
    if (resource !== undefined && ltiTypes.has(resource.type) && !resourceAt.has(key)) {
      resourceAt.set(key, resource);
    }
  };
  for (const href of Rows.of(rows, ResourceHref)) {
    register(`${href.package}\n${href.href}`, href.resource);
  }

  for (const file of Rows.of(rows, File)) {
    register(`${file.package}\n${file.href}`, file.resource);
  }

  let built = rows;
  for (const ref of Rows.of(rows, ItemRef)) {
    const document = context.documents.get(ref.document);
    const path = pathOf(context, ref.href, ref.document, ref.id);
    if (document === undefined || path === undefined) {
      continue;
    }

    const target = targetAt(at(document.package, path), "item");
    const link = resourceAt.get(`${document.package}\n${path}`);
    if (target !== undefined) {
      built = Rows.add(built, ItemRefResolution, [
        { itemRef: ref.id, package: document.package, path: PackagePath(path), targetKind: "item" },
      ]);
      built = Rows.add(built, ItemRefDocument, [
        {
          document: target.id,
          itemRef: ref.id,
          package: document.package,
          path: PackagePath(path),
        },
      ]);
    } else if (link !== undefined) {
      built = Rows.add(built, ItemRefResolution, [
        { itemRef: ref.id, package: document.package, path: PackagePath(path), targetKind: "lti" },
      ]);
      built = Rows.add(built, ItemRefLti, [
        { itemRef: ref.id, package: document.package, resource: link.identifier, type: link.type },
      ]);
    }
  }

  return built;
};

/**
 * The resolution rows of every section ref and stimulus ref: the document at the path its `href`
 * resolves to, preferring one of the expected root.
 */
const documentRefRows = (context: Context, rows: Rows): Rows => {
  const at = documentsAt(context.documents);
  let built = rows;
  for (const ref of Rows.of(rows, SectionRef)) {
    const document = context.documents.get(ref.document);
    const path = pathOf(context, ref.href, ref.document, ref.id);
    const target =
      document === undefined || path === undefined
        ? undefined
        : targetAt(at(document.package, path), "section");
    if (document !== undefined && path !== undefined && target !== undefined) {
      built = Rows.add(built, SectionRefResolution, [
        {
          document: target.id,
          package: document.package,
          path: PackagePath(path),
          sectionRef: ref.id,
        },
      ]);
    }
  }

  for (const ref of Rows.of(rows, ItemStimulusRef)) {
    const document = context.documents.get(ref.document);
    const path = pathOf(context, ref.href, ref.document, ref.id);
    const target =
      document === undefined || path === undefined
        ? undefined
        : targetAt(at(document.package, path), "stimulus");
    if (document !== undefined && path !== undefined && target !== undefined) {
      built = Rows.add(built, StimulusRefResolution, [
        {
          document: target.id,
          package: document.package,
          path: PackagePath(path),
          stimulusRef: ref.id,
        },
      ]);
    }
  }

  return built;
};

/**
 * The `AttributeFileReference` rows: one per in-package value of a census attribute of a node of a
 * QTI document, a `srcset` one per candidate by its index among all candidates.
 */
const fileReferenceRows = (context: Context, rows: Rows): Rows => {
  const value = typedValues(rows);
  const facts: Fact<typeof AttributeFileReference>[] = [];
  for (const node of Rows.of(rows, Node)) {
    const document = context.documents.get(node.tree);
    if (document === undefined) {
      continue;
    }

    for (const attribute of fileAttributes.get(node.kind) ?? []) {
      const written = value(node.id, node.kind, attribute);
      if (written === undefined) {
        continue;
      }

      const candidates = attribute === "srcset" ? srcsetUrls(written) : [written];
      for (const [position, candidate] of candidates.entries()) {
        const path = pathOf(context, candidate, node.tree, node.id);
        if (path !== undefined) {
          facts.push({
            attribute,
            document: document.id,
            kind: node.kind,
            node: node.id,
            package: document.package,
            path: PackagePath(path),
            position: BigInt(position),
          });
        }
      }
    }
  }

  return Rows.add(rows, AttributeFileReference, facts);
};

/**
 * The `TestReach` and `TestDocument` rows: what each test reaches through the section refs the
 * rows resolved, or a refusal for a cycle of section refs.
 */
const reachRows = Effect.fn("import.reachRows")(function* reachRows(
  context: Context,
  rows: Rows,
): Effect.fn.Return<Rows, ImportRefused> {
  const targets = new Map(
    Rows.of(rows, SectionRefResolution).map((row) => [row.sectionRef, row.document]),
  );
  const structures = (root: "section" | "test"): readonly StructureDocument[] =>
    [...context.documents.values()]
      .filter((document) => document.root === root)
      .map((document) => ({
        document: document.id,
        holders: Rows.of(rows, TestIdentifier)
          .filter((row) => row.scope === document.id)
          .map((row) => ({
            holder: row.holder,
            holderKind: row.holderKind,
            identifier: row.identifier,
          })),
        sectionRefs: Rows.of(rows, SectionRef).flatMap((ref) => {
          const section = targets.get(ref.id);

          return ref.document === document.id && section !== undefined
            ? [{ document: section, holder: ref.id }]
            : [];
        }),
      }));
  const reach = yield* reachOf({ sections: structures("section"), tests: structures("test") }).pipe(
    Effect.mapError(
      (cycle) => new ImportRefused({ detail: cycle.message, rule: "section-ref-cycle" }),
    ),
  );
  // `reachOf` works over plain strings; every id it hands back is one of these rows' own.
  const ids = new Map<string, Uuid>([
    ...context.documents.values().map((found): [string, Uuid] => [found.id, found.id]),
    ...Rows.of(rows, TestIdentifier).map((row): [string, Uuid] => [row.holder, row.holder]),
  ]);
  const idOf = (id: string): Uuid => Option.getOrThrow(Option.fromNullishOr(ids.get(id)));
  const held = Rows.add(
    rows,
    TestReach,
    reach.reach.map((reached) => ({
      holder: idOf(reached.holder),
      holderKind: reached.holderKind,
      identifier: TestStructureIdentifier(reached.identifier),
      test: idOf(reached.test),
    })),
  );

  return Rows.add(
    held,
    TestDocument,
    reach.documents.map((reached) => ({
      document: idOf(reached.document),
      test: idOf(reached.test),
    })),
  );
});

/**
 * The element each element of the tree under `root` sits directly under.
 */
const parentOf = (root: Element) => {
  const parents = new Map(withParents(root, Option.none()));

  return (element: Element): Option.Option<Element> => parents.get(element) ?? Option.none();
};

/**
 * The `VariableMapping` and `TemplateDefault` arms of the documents given: each under an item ref
 * that resolved to an item document, holding that document, with its attributes as the reader
 * gives them. One under an item ref that did not resolve has no arm, which the node's `mirrors`
 * law refuses.
 */
const ruleArmRows = Effect.fn("import.ruleArmRows")(function* ruleArmRows(
  documents: readonly StagedDocument[],
  rows: Rows,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const itemDocuments = new Map(
    Rows.of(rows, ItemRefDocument).map((row) => [row.itemRef, row.document]),
  );
  let built = rows;
  for (const { doc, nodes } of documents) {
    const parent = parentOf(doc.root);
    for (const [element] of withParents(doc.root, Option.none())) {
      const node = nodes.get(element);
      if (node?.kind !== "qti-variable-mapping" && node?.kind !== "qti-template-default") {
        continue;
      }

      const owner = Option.flatMapNullishOr(parent(element), (above) => nodes.get(above)).pipe(
        Option.filter((above) => above.kind === "qti-assessment-item-ref"),
      );
      const itemDocument = Option.flatMapNullishOr(owner, (above) => itemDocuments.get(above.id));
      const attributes = attributeReader(built, element, node);
      if (node.kind === "qti-variable-mapping") {
        const source = yield* requiredAttribute(
          element,
          "source-identifier",
          attributes.read("source-identifier"),
        );
        const target = yield* requiredAttribute(
          element,
          "target-identifier",
          attributes.read("target-identifier"),
        );
        built = Rows.add(
          attributes.rows(),
          VariableMapping,
          Option.isSome(owner) && Option.isSome(itemDocument)
            ? [
                {
                  id: node.id,
                  itemDocument: itemDocument.value,
                  itemRef: owner.value.id,
                  source,
                  target: MappedVariableName(target),
                },
              ]
            : [],
        );
      } else {
        const identifier = yield* requiredAttribute(
          element,
          "template-identifier",
          attributes.read("template-identifier"),
        );
        built = Rows.add(
          attributes.rows(),
          TemplateDefault,
          Option.isSome(owner) && Option.isSome(itemDocument)
            ? [
                {
                  id: node.id,
                  itemDocument: itemDocument.value,
                  itemRef: owner.value.id,
                  templateIdentifier: identifier,
                },
              ]
            : [],
        );
      }
    }
  }

  return built;
});

/**
 * Run the package-level stage over the rows of every document of one package.
 *
 * Writes `ItemRefResolution` with its `ItemRefDocument` or `ItemRefLti` arm, `SectionRefResolution`
 * and `StimulusRefResolution` for each reference whose `href` names a document or an LTI resource
 * of the package; `AttributeFileReference` for each in-package value of a census attribute;
 * `TestReach` and `TestDocument` for each test; and, for the `documents` given, the
 * `VariableMapping` and `TemplateDefault` arms of the mappings and template defaults they hold.
 * A reference that names nothing of the package has no row.
 *
 * @param rows - The rows of the whole package.
 * @param documents - The decoded documents and their node indexes, for the arms read from an
 *   element's attributes.
 * @returns The rows with the stage's added; `ImportRefused` (`section-ref-cycle`) when section
 *   documents refer to each other in a cycle, and `ItemRefusal` (`required-attribute`) for a
 *   mapping or template default that omits a required attribute.
 */
export const packageStage = Effect.fn("import.packageStage")(function* packageStage(
  rows: Rows,
  documents: readonly StagedDocument[] = [],
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const context: Context = {
    chain: baseChains(rows),
    documents: new Map(Rows.of(rows, Document).map((found) => [found.id, found])),
    rows,
  };
  const resolved = documentRefRows(context, itemRefRows(context, rows));
  const referenced = fileReferenceRows(context, resolved);
  const reached = yield* reachRows(context, referenced);

  return yield* ruleArmRows(documents, reached);
});
