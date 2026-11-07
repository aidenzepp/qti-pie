/**
 * Noise: edits of a package no law reads, for the metamorphic half of the differential. A package
 * and its noised copy must get the same verdict from each side, the same rule set from the oracle
 * and the same refusal or the same broken laws from the import, so a rule that moves with noise is
 * a refusal named by which statement happened to fire, not by the cause (the history's hot spot 1).
 *
 * - `attribute-order`: every element's attributes, namespace declarations included, reversed (reading
 *   137: no law reads attribute order);
 * - `prefix-rename`: each prefix a document declares renamed to one it does not use;
 * - `resource-order`: the manifest's resources reversed;
 * - `path-rename`: one document renamed within its directory, every href that names it rewritten to
 *   name it so; its directory is kept, so its own relative hrefs name what they named.
 *
 * Each is a pure function of the genome and a salt, so a run's noised copies are the same on every
 * replay.
 */
import type { Attribute, Child, Element } from "@qti-pie/crust/tree.ts";
import {
  attributeValue,
  directoryOf,
  editAt,
  elementsOf,
  isDeclaration,
  manifestPath,
  relativeHref,
  resolvedPath,
  withRoot,
} from "#pantry/test/gen/genetic/genome.ts";
import type { Entry, Genome } from "#pantry/test/gen/genetic/genome.ts";

/**
 * The noise kinds.
 */
export const noises = [
  "attribute-order",
  "prefix-rename",
  "resource-order",
  "path-rename",
] as const;

/**
 * One noise kind.
 */
export type Noise = (typeof noises)[number];

/**
 * The namespace of namespace declarations.
 */
const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * The attributes whose value is a reference to another entry, which a path rename rewrites.
 */
const hrefNames: ReadonlySet<string> = new Set(["data", "href", "src", "template-location"]);

/**
 * Rebuild every element of a tree by `edit`, children first.
 *
 * @param element - The tree's root.
 * @param edit - Rebuilds one element whose children are already rebuilt.
 * @returns The new root.
 */
const everyElement = (element: Element, edit: (element: Element) => Element): Element =>
  edit({
    ...element,
    children: element.children.map((child): Child =>
      child.kind === "element" ? everyElement(child, edit) : child,
    ),
  });

/**
 * Rebuild each XML document of a genome by `edit`.
 *
 * @param genome - The genome.
 * @param edit - Rebuilds one document's root, given its path.
 * @returns The genome.
 */
const everyDocument = (genome: Genome, edit: (root: Element, path: string) => Element): Genome =>
  genome.map((entry): Entry =>
    entry.body.kind === "xml"
      ? {
          body: {
            doc: withRoot(entry.body.doc, edit(entry.body.doc.root, entry.path)),
            kind: "xml",
          },
          path: entry.path,
        }
      : entry,
  );

/**
 * Reverse every element's attributes.
 *
 * @param genome - The genome.
 * @returns The genome, its attributes in reverse order.
 */
const attributeOrder = (genome: Genome): Genome =>
  everyDocument(genome, (root) =>
    everyElement(root, (element) => ({ ...element, attributes: element.attributes.toReversed() })),
  );

/**
 * Rename every prefix a document declares to `n<salt>_<prefix>`, a name no document of the corpus
 * uses, in its declarations and in every element and attribute name that uses it. A prefix some
 * attribute value or text of the document spells as `prefix:` is kept, since a QName in content
 * (an `xsi:type`'s value) resolves by it.
 *
 * @param genome - The genome.
 * @param salt - Distinguishes the new names.
 * @returns The genome.
 */
const prefixRename = (genome: Genome, salt: number): Genome =>
  everyDocument(genome, (root) => {
    const declared = new Set(
      elementsOf(root).flatMap(({ element }) =>
        element.attributes.flatMap((attribute) =>
          attribute.namespace === xmlnsNamespace && attribute.prefix === "xmlns"
            ? [attribute.local]
            : [],
        ),
      ),
    );
    const spelled = elementsOf(root).flatMap(({ element }) => [
      ...element.attributes
        .filter((attribute) => !isDeclaration(attribute))
        .map(({ value }) => value),
      ...element.children.flatMap((child) => (child.kind === "text" ? [child.value] : [])),
    ]);
    for (const prefix of declared) {
      if (spelled.some((text) => text.includes(`${prefix}:`))) {
        declared.delete(prefix);
      }
    }

    const renamed = (prefix: string): string =>
      declared.has(prefix) ? `n${String(salt)}_${prefix}` : prefix;
    const named = <N extends Attribute | Element>(node: N): N =>
      node.prefix === "" || !declared.has(node.prefix)
        ? node
        : { ...node, prefix: renamed(node.prefix), qname: `${renamed(node.prefix)}:${node.local}` };

    const declaration = (attribute: Attribute): Attribute =>
      attribute.prefix === "xmlns"
        ? {
            ...attribute,
            local: renamed(attribute.local),
            qname: `xmlns:${renamed(attribute.local)}`,
          }
        : attribute;

    return everyElement(root, (element) =>
      named({
        ...element,
        attributes: element.attributes.map((attribute) =>
          isDeclaration(attribute) ? declaration(attribute) : named(attribute),
        ),
      }),
    );
  });

/**
 * Reverse the manifest's resources.
 *
 * @param genome - The genome.
 * @returns The genome.
 */
const resourceOrder = (genome: Genome): Genome =>
  everyDocument(genome, (root, path) => {
    const resources = elementsOf(root).find(({ element }) => element.local === "resources");

    return path !== manifestPath || resources === undefined
      ? root
      : editAt(root, resources.address, (element) => [
          { ...element, children: element.children.toReversed() },
        ]);
  });

/**
 * Rename one document (the salt picks which) within its directory, to `moved<salt>-<name>`, and
 * rewrite every href of every document that names it. A genome with an `xml:base` or a
 * percent-encoded href is left as it is, since such an href resolves by more than the path
 * segments this rewrite reads.
 *
 * @param genome - The genome.
 * @param salt - Picks the document and names it.
 * @returns The genome, unchanged where it has no document but the manifest.
 */
const pathRename = (genome: Genome, salt: number): Genome => {
  const documents = genome.filter(({ body, path }) => body.kind === "xml" && path !== manifestPath);
  const moved = documents[salt % Math.max(1, documents.length)];
  const based = genome.some(
    ({ body }) =>
      body.kind === "xml" &&
      elementsOf(body.doc.root).some(
        ({ element }) =>
          attributeValue(element, "xml:base") !== undefined ||
          element.attributes.some(
            ({ qname, value }) => hrefNames.has(qname) && value.includes("%"),
          ),
      ),
  );
  if (moved === undefined || based) {
    return genome;
  }

  const directory = directoryOf(moved.path);
  const to = `${directory}moved${String(salt)}-${moved.path.slice(directory.length)}`;
  const newPath = (path: string): string => (path === moved.path ? to : path);
  const rewritten = everyDocument(genome, (root, path) =>
    everyElement(root, (element) => ({
      ...element,
      attributes: element.attributes.map((attribute) => {
        const value = hrefNames.has(attribute.qname)
          ? attributeValue(element, attribute.qname)
          : undefined;
        const named = value === undefined ? undefined : resolvedPath(path, value);

        return named === undefined || value?.includes("#") === true
          ? attribute
          : { ...attribute, references: [], value: relativeHref(newPath(path), newPath(named)) };
      }),
    })),
  );

  return rewritten.map((entry) => (entry.path === moved.path ? { ...entry, path: to } : entry));
};

/**
 * Apply one noise to a genome.
 *
 * @param genome - The genome.
 * @param noise - The noise.
 * @param salt - What a noise that picks or names something reads.
 * @returns The noised genome.
 */
export const noised = (genome: Genome, noise: Noise, salt: number): Genome => {
  switch (noise) {
    case "attribute-order": {
      return attributeOrder(genome);
    }
    case "prefix-rename": {
      return prefixRename(genome, salt);
    }
    case "resource-order": {
      return resourceOrder(genome);
    }
    case "path-rename": {
      return pathRename(genome, salt);
    }
    default: {
      return noise satisfies never;
    }
  }
};
