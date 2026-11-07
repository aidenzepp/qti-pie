/**
 * The genetic search's genome: a QTI package as its entries, each XML document as the tree crust
 * reads it, so a mutation edits elements and attributes, never bytes (an intention, not a byte
 * string). An entry that does not read as XML, an image or a document a mutation broke on purpose,
 * is kept as its bytes.
 *
 * A genome renders back to the package's entries through crust's writer, and the law oracle and the
 * import both read those bytes, so the two sides of the differential judge one package.
 */
import { Effect, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Attribute, Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { writeXml } from "@qti-pie/crust/write.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";

/**
 * The path of a package's manifest, at its root.
 */
export const manifestPath = "imsmanifest.xml";

/**
 * The namespace of namespace declarations, which crust reads as attributes.
 */
const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * The XML namespace, bound to `xml` in every document and never declared.
 */
const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

/**
 * One entry's content: an XML document's tree, or bytes that do not read as one.
 */
export type Body =
  | { readonly doc: XmlDocument; readonly kind: "xml" }
  | { readonly bytes: Uint8Array; readonly kind: "bytes" };

/**
 * One entry of a package: its path below the package root, `/`-separated, and its content.
 */
export interface Entry {
  readonly body: Body;
  readonly path: string;
}

/**
 * A package as the search breeds it: its entries, sorted by path, the manifest among them.
 */
export type Genome = readonly Entry[];

/**
 * Where an element stands in its document: the index in `children` of each element on the way
 * down from the root, empty for the root.
 */
export type Address = readonly number[];

/**
 * One element of a document with its address and its parent, none for the root.
 */
export interface Placed {
  readonly address: Address;
  readonly element: Element;
  readonly parent: Element | undefined;
}

/**
 * Read a package's entries as a genome: each entry crust reads as XML is its tree, every other
 * entry its bytes.
 *
 * @param entries - The package's entries, by path.
 * @returns The genome, sorted by path.
 */
export const genomeOf = Effect.fnUntraced(function* genomeOf(entries: PackageEntries) {
  const read: Entry[] = [];
  for (const [path, bytes] of entries) {
    const xml = yield* Effect.result(readXml(bytes));
    read.push({
      body: Result.isSuccess(xml) ? { doc: xml.success, kind: "xml" } : { bytes, kind: "bytes" },
      path,
    });
  }

  return read.toSorted((left, right) => (left.path < right.path ? -1 : 1));
});

/**
 * Write a genome's entries: each tree serialized by crust and encoded as UTF-8, each byte body as
 * it is.
 *
 * @param genome - The genome.
 * @returns The package's entries, by path; crust's `EncodeError` for a tree it cannot write.
 */
export const entriesOf = Effect.fnUntraced(function* entriesOf(genome: Genome) {
  const written = new Map<string, Uint8Array>();
  const encoder = new TextEncoder();
  for (const { body, path } of genome) {
    written.set(path, body.kind === "xml" ? encoder.encode(yield* writeXml(body.doc)) : body.bytes);
  }

  return written;
});

/**
 * Write a package's entries as the text a report shows: each entry's path, then its text, or its
 * size for an entry whose path names no XML document.
 *
 * @param entries - The package's entries.
 * @returns The text, one entry after another.
 */
export const shownEntries = (entries: PackageEntries): string => {
  const decoder = new TextDecoder();

  return [...entries]
    .map(([path, bytes]) =>
      path.endsWith(".xml")
        ? `--- ${path}\n${decoder.decode(bytes)}`
        : `--- ${path} (${String(bytes.length)} bytes)`,
    )
    .join("\n");
};

/**
 * List a document's elements in document order, each with its address and parent.
 *
 * @param root - The document's root element.
 * @returns Every element, the root first.
 */
export const elementsOf = (root: Element): readonly Placed[] => {
  const placed: Placed[] = [];
  const stack: Placed[] = [{ address: [], element: root, parent: undefined }];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    placed.push(next);

    const below: Placed[] = [];
    for (const [index, child] of next.element.children.entries()) {
      if (child.kind === "element") {
        below.push({ address: [...next.address, index], element: child, parent: next.element });
      }
    }

    stack.push(...below.toReversed());
  }

  return placed;
};

/**
 * Count the elements of a subtree.
 *
 * @param element - The subtree's root.
 * @returns Its elements, itself included.
 */
export const sizeOf = (element: Element): number => elementsOf(element).length;

/**
 * Rebuild a tree with the element at an address replaced by what `edit` makes of it: no node to
 * delete it, one to replace it, more to add siblings after it. The root is replaced by the first
 * element `edit` gives and kept when it gives none.
 *
 * @param root - The tree's root.
 * @param address - The element's address.
 * @param edit - Maps the element to the nodes that take its place.
 * @returns The new root.
 */
export const editAt = (
  root: Element,
  address: Address,
  edit: (element: Element) => readonly Child[],
): Element => {
  const [head, ...rest] = address;
  if (head === undefined) {
    const replaced = edit(root).find((child): child is Element => child.kind === "element");

    return replaced ?? root;
  }

  const child = root.children[head];
  if (child?.kind !== "element") {
    return root;
  }

  const placed: readonly Child[] = rest.length === 0 ? edit(child) : [editAt(child, rest, edit)];

  return {
    ...root,
    children: [...root.children.slice(0, head), ...placed, ...root.children.slice(head + 1)],
  };
};

/**
 * Rebuild a tree with a child inserted under the element at an address.
 *
 * @param root - The tree's root.
 * @param address - The parent's address.
 * @param at - The child's index among the parent's children, clamped to their count.
 * @param child - The child.
 * @returns The new root.
 */
export const insertAt = (root: Element, address: Address, at: number, child: Child): Element =>
  editAt(root, address, (parent) => {
    const index = Math.min(Math.max(at, 0), parent.children.length);

    return [
      {
        ...parent,
        children: [...parent.children.slice(0, index), child, ...parent.children.slice(index)],
      },
    ];
  });

/**
 * Whether an attribute is a namespace declaration.
 *
 * @param attribute - The attribute.
 * @returns Whether it is in the `xmlns` namespace.
 */
export const isDeclaration = (attribute: Attribute): boolean =>
  attribute.namespace === xmlnsNamespace || attribute.qname === "xmlns";

/**
 * Make a subtree stand on its own wherever it is put: its root declares every namespace prefix
 * its elements and attributes use that it does not declare itself, each bound as its first use in
 * document order is, and the default namespace its unprefixed elements are in. A subtree grafted
 * from another document, or moved out from under the element that declared its prefixes, then
 * reads in the same names it had.
 *
 * @param element - The subtree's root.
 * @returns The root with the declarations its subtree needs.
 */
export const selfContained = (element: Element): Element => {
  const declared = new Set(
    element.attributes
      .filter((attribute) => isDeclaration(attribute))
      .map(({ local, qname }) => (qname === "xmlns" ? "" : local)),
  );
  const needed = new Map<string, string>();
  const need = (prefix: string, namespace: string): void => {
    if (prefix !== "xml" && !declared.has(prefix) && !needed.has(prefix)) {
      needed.set(prefix, namespace);
    }
  };
  for (const { element: member } of elementsOf(element)) {
    need(member.prefix, member.namespace);
    for (const attribute of member.attributes) {
      if (!isDeclaration(attribute) && attribute.prefix !== "") {
        need(attribute.prefix, attribute.namespace);
      }
    }
  }

  const declarations = [...needed].flatMap(([prefix, namespace]): readonly Attribute[] =>
    namespace === xmlNamespace || (prefix !== "" && namespace === "")
      ? []
      : [
          {
            local: prefix === "" ? "xmlns" : prefix,
            namespace: xmlnsNamespace,
            prefix: prefix === "" ? "" : "xmlns",
            qname: prefix === "" ? "xmlns" : `xmlns:${prefix}`,
            references: [],
            value: namespace,
          },
        ],
  );

  return declarations.length === 0
    ? element
    : { ...element, attributes: [...declarations, ...element.attributes] };
};

/**
 * Build an attribute in no namespace, or with a prefix bound to a namespace.
 *
 * @param qname - Its name as written, `prefix:local` or `local`.
 * @param value - Its value.
 * @param namespace - Its namespace, empty for none.
 * @returns The attribute.
 */
export const attributeOf = (qname: string, value: string, namespace = ""): Attribute => {
  const colon = qname.indexOf(":");

  return {
    local: colon === -1 ? qname : qname.slice(colon + 1),
    namespace: qname.startsWith("xml:") ? xmlNamespace : namespace,
    prefix: colon === -1 ? "" : qname.slice(0, colon),
    qname,
    references: [],
    value,
  };
};

/**
 * Rebuild an element with an attribute set: its value replaced where the element has it, the
 * attribute appended where it does not.
 *
 * @param element - The element.
 * @param qname - The attribute's name as written.
 * @param value - Its new value.
 * @returns The element.
 */
export const withAttribute = (element: Element, qname: string, value: string): Element => {
  const at = element.attributes.findIndex((attribute) => attribute.qname === qname);
  const attribute = at === -1 ? attributeOf(qname, value) : element.attributes[at];

  return attribute === undefined
    ? element
    : {
        ...element,
        attributes:
          at === -1
            ? [...element.attributes, attribute]
            : element.attributes.map((held, index) =>
                index === at ? { ...held, references: [], value } : held,
              ),
      };
};

/**
 * Rebuild an element without an attribute.
 *
 * @param element - The element.
 * @param qname - The attribute's name as written.
 * @returns The element.
 */
export const withoutAttribute = (element: Element, qname: string): Element => ({
  ...element,
  attributes: element.attributes.filter((attribute) => attribute.qname !== qname),
});

/**
 * Read an element's attribute by its name as written.
 *
 * @param element - The element.
 * @param qname - The attribute's name.
 * @returns Its value, undefined where the element does not carry it.
 */
export const attributeValue = (element: Element, qname: string): string | undefined =>
  element.attributes.find((attribute) => attribute.qname === qname)?.value;

/**
 * Read the text an element holds directly: its text children joined.
 *
 * @param element - The element.
 * @returns The text.
 */
export const textOf = (element: Element): string =>
  element.children.map((child) => (child.kind === "text" ? child.value : "")).join("");

/**
 * Replace a genome's entry at a path, or add it.
 *
 * @param genome - The genome.
 * @param entry - The entry.
 * @returns The genome, sorted by path.
 */
export const withEntry = (genome: Genome, entry: Entry): Genome =>
  [...genome.filter(({ path }) => path !== entry.path), entry].toSorted((left, right) =>
    left.path < right.path ? -1 : 1,
  );

/**
 * Remove a genome's entry at a path.
 *
 * @param genome - The genome.
 * @param path - The entry's path.
 * @returns The genome without it.
 */
export const withoutEntry = (genome: Genome, path: string): Genome =>
  genome.filter((entry) => entry.path !== path);

/**
 * Rebuild a document with its root replaced.
 *
 * @param doc - The document.
 * @param root - The new root.
 * @returns The document.
 */
export const withRoot = (doc: XmlDocument, root: Element): XmlDocument => ({ ...doc, root });

/**
 * The directory part of an entry's path, with its trailing `/`, empty at the root.
 *
 * @param path - The path.
 * @returns Its directory.
 */
export const directoryOf = (path: string): string => path.slice(0, path.lastIndexOf("/") + 1);

/**
 * Write the relative reference from a document's directory to another entry: the entry's path
 * from the package root, with `../` for each directory the document is below.
 *
 * @param from - The referring document's path.
 * @param to - The target entry's path.
 * @returns The reference.
 */
export const relativeHref = (from: string, to: string): string => {
  const fromParts = directoryOf(from)
    .split("/")
    .filter((part) => part !== "");
  const toParts = to.split("/");
  let shared = 0;
  while (
    shared < fromParts.length &&
    shared < toParts.length - 1 &&
    fromParts[shared] === toParts[shared]
  ) {
    shared += 1;
  }

  return [...fromParts.slice(shared).map(() => ".."), ...toParts.slice(shared)].join("/");
};

/**
 * Resolve a relative reference against a document's path, as a package path: `.` and `..`
 * segments applied, no query or fragment.
 *
 * @param from - The referring document's path.
 * @param href - The reference as written.
 * @returns The package path it names, or undefined for an absolute reference or one that leaves
 *   the package.
 */
export const resolvedPath = (from: string, href: string): string | undefined => {
  const bare = href.split(/[?#]/u)[0] ?? "";
  if (bare === "" || /^[a-z][a-z0-9+.-]*:/iu.test(bare) || bare.startsWith("/")) {
    return undefined;
  }

  const parts: string[] = directoryOf(from)
    .split("/")
    .filter((part) => part !== "");
  for (const segment of bare.split("/")) {
    if (segment === "..") {
      if (parts.pop() === undefined) {
        return undefined;
      }
    } else if (segment !== "." && segment !== "") {
      parts.push(segment);
    }
  }

  return parts.join("/");
};

/**
 * List the genomes one cut smaller than a genome, the largest cuts first, for a reduction: each
 * entry but the manifest left out; then, document by document, each element left out, the
 * shallowest first; then a document's prolog and epilog, and each element's comments and
 * processing instructions; then each attribute left out, a namespace declaration included, which a
 * reduction keeps only where the package still reads as it did; then each element's text left
 * out.
 *
 * @param genome - The genome.
 * @returns The smaller genomes.
 */
export const cutsOf = (genome: Genome): readonly Genome[] => {
  const documents = genome.flatMap(({ body, path }) =>
    body.kind === "xml" ? [{ doc: body.doc, path }] : [],
  );
  const rooted = (path: string, root: Element): Genome =>
    genome.map((entry): Entry =>
      entry.path === path && entry.body.kind === "xml"
        ? { body: { doc: withRoot(entry.body.doc, root), kind: "xml" }, path }
        : entry,
    );
  const placed = documents.map(({ doc, path }) => ({
    doc,
    elements: elementsOf(doc.root).toSorted(
      (left, right) => left.address.length - right.address.length,
    ),
    path,
  }));

  return [
    ...genome.flatMap(({ path }) => (path === manifestPath ? [] : [withoutEntry(genome, path)])),
    ...placed.flatMap(({ doc, elements, path }) =>
      elements.flatMap(({ address }) =>
        address.length === 0
          ? []
          : [
              rooted(
                path,
                editAt(doc.root, address, () => []),
              ),
            ],
      ),
    ),
    ...documents.flatMap(({ doc, path }): readonly Genome[] =>
      doc.prolog.length > 0 || doc.epilog.length > 0
        ? [
            genome.map((entry): Entry =>
              entry.path === path
                ? { body: { doc: { ...doc, epilog: [], prolog: [] }, kind: "xml" }, path }
                : entry,
            ),
          ]
        : [],
    ),
    ...placed.flatMap(({ doc, elements, path }) =>
      elements.flatMap(({ address, element }) =>
        element.children.some((child) => child.kind === "comment" || child.kind === "pi")
          ? [
              rooted(
                path,
                editAt(doc.root, address, (held) => [
                  {
                    ...held,
                    children: held.children.filter(
                      (child) => child.kind !== "comment" && child.kind !== "pi",
                    ),
                  },
                ]),
              ),
            ]
          : [],
      ),
    ),
    ...placed.flatMap(({ doc, elements, path }) =>
      elements.flatMap(({ address, element }) =>
        element.attributes.map(({ qname }) =>
          rooted(
            path,
            editAt(doc.root, address, (held) => [withoutAttribute(held, qname)]),
          ),
        ),
      ),
    ),
    ...placed.flatMap(({ doc, elements, path }) =>
      elements.flatMap(({ address, element }) =>
        element.children.some((child) => child.kind === "text")
          ? [
              rooted(
                path,
                editAt(doc.root, address, (held) => [
                  { ...held, children: held.children.filter((child) => child.kind !== "text") },
                ]),
              ),
            ]
          : [],
      ),
    ),
  ];
};
