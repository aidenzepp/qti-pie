/**
 * Test support: the cached QTI schema documents read as closures.
 *
 * The documents live in the shared cache, never the repository. A closure is every document a
 * validator holds for one root document: the root, then each `xs:import`, `xs:include` and
 * `xs:redefine` it names, followed by basename, because the cached directories do not mirror the
 * purl paths the documents name in `schemaLocation`. Each document is read once with the
 * repository's own XML reader, which decodes a byte order mark (`w3/XInclude.xsd` is UTF-16
 * little-endian).
 *
 * Nothing here judges a document. The tests that derive a table from the schemas hold the walks.
 */
import { existsSync, globSync, readFileSync } from "node:fs";
import { assert } from "@effect/vitest";
import { Config, Effect } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

const home = Effect.runSync(Config.String("HOME").pipe(Config.withDefault("")));

/**
 * The shared cache of the QTI schema documents.
 */
export const cacheDirectory = `${home}/.cache/gr8des/qti3/xsd`;

/**
 * Whether the cache directory is present; a test that reads it skips, naming the directory, when it
 * is not.
 */
export const cacheAvailable = existsSync(cacheDirectory);

/**
 * The XML Schema namespace.
 */
export const XS = "http://www.w3.org/2001/XMLSchema";

/**
 * The namespace that namespace declarations live in.
 */
export const XMLNS = "http://www.w3.org/2000/xmlns/";

/**
 * One schema document of a closure.
 */
export interface Schema {
  /**
   * The namespace the document's names belong to: its `targetNamespace`, or the including
   * document's when it has none (a chameleon include or a redefine into another namespace).
   */
  readonly effective: string;
  readonly elementsQualified: boolean;
  readonly file: string;
  readonly prefixes: ReadonlyMap<string, string>;
  readonly root: Element;
  readonly targetNamespace: string;
}

/**
 * Read an element's attribute by its qualified name.
 *
 * @param element - The element.
 * @param name - The attribute's name as written.
 * @returns The value, or `undefined`.
 */
export const attributeOf = (element: Element, name: string) =>
  element.attributes.find((candidate) => candidate.qname === name)?.value;

/**
 * An element's element children.
 *
 * @param element - The element.
 * @returns Its children that are elements.
 */
export const childElements = (element: Element) =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Whether an element is the named `xs:` element.
 *
 * @param element - The element.
 * @param local - The local name.
 * @returns Whether it is in the schema namespace with that name.
 */
export const isXs = (element: Element, local: string) =>
  element.namespace === XS && element.local === local;

/**
 * The key of a name in a namespace.
 *
 * @param namespace - The namespace.
 * @param local - The local name.
 * @returns The two joined, for a map key.
 */
export const keyOf = (namespace: string, local: string) => `${namespace}|${local}`;

let cachedFilesByBasename: ReadonlyMap<string, string> | undefined;

/**
 * The cached schema documents by basename, read from the directory once. The basenames are unique.
 *
 * @returns Each basename and its path under the cache directory.
 */
const cachedFiles = () => {
  if (cachedFilesByBasename !== undefined) {
    return cachedFilesByBasename;
  }

  const byBasename = new Map<string, string>();

  for (const file of globSync("**/*.xsd", { cwd: cacheDirectory })) {
    const basename = file.split("/").at(-1) ?? file;

    assert.isFalse(byBasename.has(basename), `a second cached document is named ${basename}`);
    byBasename.set(basename, file);
  }

  cachedFilesByBasename = byBasename;

  return byBasename;
};

/**
 * Every cached schema document.
 *
 * @returns The paths under the cache directory, sorted.
 */
export const allCachedFiles = () => [...cachedFiles().values()].toSorted();

const parsed = new Map<string, Element>();

/**
 * Parse one cached schema document. A document several closures reach is parsed once.
 *
 * @param file - The path under the cache directory.
 * @returns The document's root element.
 */
export const parseSchema = (file: string) => {
  const known = parsed.get(file);

  if (known !== undefined) {
    return known;
  }

  const { root } = Effect.runSync(readXml(readFileSync(`${cacheDirectory}/${file}`)));

  parsed.set(file, root);

  return root;
};

/**
 * Follow `xs:import`, `xs:include` and `xs:redefine` from a root document, resolving each
 * `schemaLocation` by its basename in the cache.
 *
 * @param rootFile - The root document's path under the cache directory.
 * @returns Every document the validator holds for that root, the root first.
 */
export const closureOf = (rootFile: string) => {
  const schemas: Schema[] = [];
  const seen = new Set<string>();
  const pending: [string, string][] = [[rootFile, ""]];

  for (let entry = pending.pop(); entry !== undefined; entry = pending.pop()) {
    const [file, including] = entry;

    if (seen.has(file)) {
      continue;
    }

    seen.add(file);

    const root = parseSchema(file);
    const targetNamespace = attributeOf(root, "targetNamespace") ?? "";
    const effective = targetNamespace === "" ? including : targetNamespace;
    const prefixes = new Map(
      root.attributes
        .filter((candidate) => candidate.namespace === XMLNS)
        .map((candidate) => [candidate.prefix === "xmlns" ? candidate.local : "", candidate.value]),
    );

    schemas.push({
      effective,
      elementsQualified: attributeOf(root, "elementFormDefault") === "qualified",
      file,
      prefixes,
      root,
      targetNamespace,
    });

    for (const child of childElements(root)) {
      const location = attributeOf(child, "schemaLocation");

      if (
        (isXs(child, "import") || isXs(child, "include") || isXs(child, "redefine")) &&
        location !== undefined
      ) {
        const basename = location.split("/").at(-1) ?? location;
        const cached = cachedFiles().get(basename);

        assert.isDefined(cached, `${file} names ${location}, which the cache does not hold`);
        pending.push([cached ?? basename, effective]);
      }
    }
  }

  return schemas;
};

/**
 * Resolve a QName in a document's prefix map.
 *
 * @param schema - The document the QName is written in.
 * @param qname - The QName.
 * @returns The namespace and local name; an unprefixed name takes the document's default
 *   namespace, or the document's effective namespace when it declares none.
 */
export const resolveQName = (schema: Schema, qname: string): readonly [string, string] => {
  const colon = qname.indexOf(":");

  if (colon === -1) {
    const declared = schema.prefixes.get("") ?? "";

    return [declared === "" ? schema.effective : declared, qname];
  }

  const namespace = schema.prefixes.get(qname.slice(0, colon));

  assert.isDefined(namespace, `${schema.file} uses the undeclared prefix of ${qname}`);

  return [namespace ?? "", qname.slice(colon + 1)];
};
