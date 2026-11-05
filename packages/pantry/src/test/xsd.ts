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
 * It also holds the one walk that every table of `seed/xsi.ts` about types shares: the index of a
 * closure's top-level definitions, and the derivation, attribute uses and simple facets of its
 * named types (`deriveTypeTables`). Nothing here judges a document. The tests that derive a table
 * from the schemas hold the other walks.
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
 * The namespace the `xml` prefix is bound to without a declaration (Namespaces in XML, section 3).
 */
const XML = "http://www.w3.org/XML/1998/namespace";

/**
 * One schema document of a closure.
 */
export interface Schema {
  /**
   * The namespace the document's names belong to: its `targetNamespace`, or the including
   * document's when it has none (a chameleon include or a redefine into another namespace).
   */
  readonly attributesQualified: boolean;
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

/**
 * A value a lookup must have found.
 *
 * @param value - The value, or `undefined`.
 * @param message - What is missing, for the failure.
 * @returns The value; the walk fails when it is `undefined`.
 */
export const required = <A>(value: A | undefined, message: string): A => {
  if (value === undefined) {
    return assert.fail(message);
  }

  return value;
};

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
      attributesQualified: attributeOf(root, "attributeFormDefault") === "qualified",
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
 *   namespace, or the document's effective namespace when it declares none, and the `xml` prefix
 *   needs no declaration.
 */
export const resolveQName = (schema: Schema, qname: string): readonly [string, string] => {
  const colon = qname.indexOf(":");

  if (colon === -1) {
    const declared = schema.prefixes.get("") ?? "";

    return [declared === "" ? schema.effective : declared, qname];
  }

  const prefix = qname.slice(0, colon);
  const namespace = schema.prefixes.get(prefix) ?? (prefix === "xml" ? XML : undefined);

  assert.isDefined(namespace, `${schema.file} uses the undeclared prefix of ${qname}`);

  return [namespace ?? "", qname.slice(colon + 1)];
};

/**
 * A type: a named type by its expanded name, or an anonymous one by the path of the declaration
 * that holds it.
 */
export type TypeKey =
  | { readonly anonymous: string }
  | { readonly local: string; readonly namespace: string };

/**
 * A named definition and the document it is written in.
 */
export interface Definition {
  readonly element: Element;
  readonly local: string;
  readonly namespace: string;
  readonly schema: Schema;
}

/**
 * The definitions of a closure, by expanded name.
 */
export interface Index {
  readonly attributeGroups: ReadonlyMap<string, Definition>;
  readonly attributes: ReadonlyMap<string, Definition>;
  readonly complexTypes: ReadonlyMap<string, Definition>;
  readonly globalElements: ReadonlyMap<string, Definition>;
  readonly groups: ReadonlyMap<string, Definition>;
  /**
   * The complex types an `xs:redefine` replaces. The redefinition is the type a validator holds
   * under the name; its `base` names the definition it replaces, which `complexTypes` still holds.
   */
  readonly redefinedComplexTypes: ReadonlyMap<string, Definition>;
  readonly simpleTypes: ReadonlyMap<string, Definition>;
  readonly typeNames: readonly (readonly [string, string])[];
}

/**
 * Index a closure's top-level definitions. A definition inside an `xs:redefine` replaces one that
 * is already named, so it adds a name to nothing but the closure's type names.
 *
 * @param schemas - The closure's documents.
 * @returns The definitions the walks read.
 */
export const indexOf = (schemas: readonly Schema[]): Index => {
  const attributeGroups = new Map<string, Definition>();
  const attributes = new Map<string, Definition>();
  const complexTypes = new Map<string, Definition>();
  const globalElements = new Map<string, Definition>();
  const groups = new Map<string, Definition>();
  const redefinedComplexTypes = new Map<string, Definition>();
  const simpleTypes = new Map<string, Definition>();
  const typeNames = new Map<string, readonly [string, string]>();

  for (const schema of schemas) {
    for (const child of childElements(schema.root)) {
      const inRedefine = isXs(child, "redefine");

      for (const definition of inRedefine ? childElements(child) : [child]) {
        const name = attributeOf(definition, "name");

        if (name === undefined) {
          continue;
        }

        const entry = { element: definition, local: name, namespace: schema.effective, schema };
        const key = keyOf(schema.effective, name);

        if (isXs(definition, "complexType")) {
          typeNames.set(key, [schema.effective, name]);

          if (inRedefine) {
            redefinedComplexTypes.set(key, entry);
          } else {
            complexTypes.set(key, entry);
          }
        } else if (isXs(definition, "simpleType")) {
          assert.isFalse(inRedefine, `${schema.file} redefines the simple type ${name}`);
          typeNames.set(key, [schema.effective, name]);
          simpleTypes.set(key, entry);
        } else if (isXs(definition, "group") && !inRedefine) {
          groups.set(key, entry);
        } else if (isXs(definition, "attributeGroup")) {
          assert.isFalse(inRedefine, `${schema.file} redefines the attribute group ${name}`);
          attributeGroups.set(key, entry);
        } else if (isXs(definition, "attribute") && !inRedefine) {
          attributes.set(key, entry);
        } else if (isXs(definition, "element") && !inRedefine) {
          globalElements.set(key, entry);
        }
      }
    }
  }

  return {
    attributeGroups,
    attributes,
    complexTypes,
    globalElements,
    groups,
    redefinedComplexTypes,
    simpleTypes,
    typeNames: [...typeNames.values()],
  };
};

/**
 * The constraining facets of XML Schema Part 2, section 4.3, that a restriction states.
 */
export const facetNames = [
  "enumeration",
  "fractionDigits",
  "length",
  "maxExclusive",
  "maxInclusive",
  "maxLength",
  "minExclusive",
  "minInclusive",
  "minLength",
  "pattern",
  "totalDigits",
  "whiteSpace",
] as const;

/**
 * How a type derives from its base: Part 1, 2.2.1.1 and 3.14.1. A list or union simple type's base
 * is `xs:anySimpleType`.
 */
export type DerivationMethod = "extension" | "list" | "restriction" | "union";

/**
 * One named type's derivation.
 */
export interface DerivationEntry {
  readonly base: TypeKey;
  readonly method: DerivationMethod;
  readonly type: TypeKey;
  readonly variety: "complex" | "simple";
}

/**
 * One attribute use of a named complex type.
 */
export interface AttributeUseEntry {
  readonly attributeType: TypeKey;
  readonly local: string;
  readonly namespace: string;
  readonly required: boolean;
  readonly type: TypeKey;
}

/**
 * One facet a named simple type, or a complex type with simple content, states.
 */
export interface FacetEntry {
  readonly facet: (typeof facetNames)[number];
  readonly type: TypeKey;
  readonly value: string;
}

/**
 * What the walk of one closure's named types found.
 */
export interface TypeTables {
  readonly derivations: readonly DerivationEntry[];
  readonly facets: readonly FacetEntry[];
  readonly uses: readonly AttributeUseEntry[];
}

interface Use {
  readonly attributeType: TypeKey;
  readonly local: string;
  readonly namespace: string;
  readonly required: boolean;
}

interface OwnUses {
  readonly prohibited: ReadonlySet<string>;
  readonly uses: readonly Use[];
}

/**
 * The type a QName in a document names.
 */
const resolveType = (schema: Schema, qname: string): TypeKey => {
  const [namespace, local] = resolveQName(schema, qname);

  return { local, namespace };
};

const anyType: TypeKey = { local: "anyType", namespace: XS };

const anySimpleType: TypeKey = { local: "anySimpleType", namespace: XS };

/**
 * The `xs:extension` or `xs:restriction` that derives a complex type, directly or inside its
 * `xs:complexContent` or `xs:simpleContent`, or a simple type's `xs:restriction`.
 */
const derivationElementOf = (definition: Element) => {
  const content = childElements(definition).find(
    (candidate) => isXs(candidate, "complexContent") || isXs(candidate, "simpleContent"),
  );

  return childElements(content ?? definition).find(
    (candidate) => isXs(candidate, "extension") || isXs(candidate, "restriction"),
  );
};

/**
 * The type an attribute declaration names, or the anonymous key of the simple type it holds; an
 * untyped attribute is `xs:anySimpleType`.
 */
const attributeTypeOf = (declaration: Element, schema: Schema, path: string): TypeKey => {
  const typeName = attributeOf(declaration, "type");

  if (typeName !== undefined) {
    return resolveType(schema, typeName);
  }

  return childElements(declaration).some((candidate) => isXs(candidate, "simpleType"))
    ? { anonymous: path }
    : anySimpleType;
};

/**
 * Derive the derivation, attribute uses and simple facets of a closure's named types.
 *
 * A complex type's attribute uses are its own `xs:attribute` children and the uses of the attribute
 * groups it references (nested groups expanded), then its base's: a type derived by extension adds
 * its own to all of its base's; one derived by restriction keeps the base's uses but those it names
 * itself (Part 1, 3.4.2, {attribute uses}, clause 3). A use with `use="prohibited"` is left out. A
 * type an `xs:redefine` replaces is the redefinition, derived from the definition it replaces: its
 * derivation row names the replaced definition's base, since the replaced definition has no name of
 * its own.
 *
 * @param index - The closure's definitions.
 * @param codeOf - A namespace's code, for the anonymous paths.
 * @returns The derivations, attribute uses and facets of the named types.
 */
export const deriveTypeTables = (
  index: Index,
  codeOf: (namespace: string) => string,
): TypeTables => {
  const containerOf = (namespace: string, local: string) => `${codeOf(namespace)}:${local}`;
  const collect = (parent: Element, schema: Schema, container: string): OwnUses => {
    const prohibited = new Set<string>();
    const uses: Use[] = [];

    for (const child of childElements(parent)) {
      if (isXs(child, "attribute")) {
        const reference = attributeOf(child, "ref");
        let use: Use;

        if (reference === undefined) {
          const name = required(
            attributeOf(child, "name"),
            `${schema.file} has an unnamed attribute`,
          );
          const form = attributeOf(child, "form");
          const qualified =
            form === "qualified" || (form === undefined && schema.attributesQualified);

          use = {
            attributeType: attributeTypeOf(child, schema, `${container}/@${name}`),
            local: name,
            namespace: qualified ? schema.effective : "",
            required: attributeOf(child, "use") === "required",
          };
        } else {
          const [namespace, local] = resolveQName(schema, reference);
          const target = required(
            index.attributes.get(keyOf(namespace, local)),
            `${schema.file} references the missing attribute ${reference}`,
          );

          use = {
            attributeType: attributeTypeOf(
              target.element,
              target.schema,
              `${codeOf(namespace)}:@${local}`,
            ),
            local,
            namespace,
            required: attributeOf(child, "use") === "required",
          };
        }

        if (attributeOf(child, "use") === "prohibited") {
          prohibited.add(keyOf(use.namespace, use.local));
        } else {
          uses.push(use);
        }
      } else if (isXs(child, "attributeGroup")) {
        const reference = attributeOf(child, "ref");

        if (reference !== undefined) {
          const [namespace, local] = resolveQName(schema, reference);
          const group = required(
            index.attributeGroups.get(keyOf(namespace, local)),
            `${schema.file} references the missing attribute group ${reference}`,
          );
          const inner = collect(group.element, group.schema, containerOf(namespace, local));

          uses.push(...inner.uses);

          for (const name of inner.prohibited) {
            prohibited.add(name);
          }
        }
      }
    }

    return { prohibited, uses };
  };
  const memo = new Map<Element, ReadonlyMap<string, Use>>();
  const effectiveOf = (key: string) =>
    index.redefinedComplexTypes.get(key) ?? index.complexTypes.get(key);
  const usesOf = (definition: Definition): ReadonlyMap<string, Use> => {
    const known = memo.get(definition.element);

    if (known !== undefined) {
      return known;
    }

    const derivation = derivationElementOf(definition.element);
    const own = collect(
      derivation ?? definition.element,
      definition.schema,
      containerOf(definition.namespace, definition.local),
    );
    const out = new Map<string, Use>();
    const baseName = derivation === undefined ? undefined : attributeOf(derivation, "base");

    if (derivation !== undefined && baseName !== undefined) {
      const [namespace, local] = resolveQName(definition.schema, baseName);
      const key = keyOf(namespace, local);
      const base =
        index.redefinedComplexTypes.get(key) === definition
          ? index.complexTypes.get(key)
          : effectiveOf(key);

      if (base !== undefined) {
        for (const [name, use] of usesOf(base)) {
          if (isXs(derivation, "extension") || !own.prohibited.has(name)) {
            out.set(name, use);
          }
        }
      }
    }

    for (const use of own.uses) {
      out.set(keyOf(use.namespace, use.local), use);
    }

    memo.set(definition.element, out);

    return out;
  };
  const derivations: DerivationEntry[] = [];
  const facets: FacetEntry[] = [];
  const uses: AttributeUseEntry[] = [];
  const facetsOf = (type: TypeKey, restriction: Element) => {
    for (const child of childElements(restriction)) {
      const facet = facetNames.find((name) => isXs(child, name));

      if (facet !== undefined) {
        facets.push({
          facet,
          type,
          value: required(attributeOf(child, "value"), `a ${facet} facet has no value`),
        });
      }
    }
  };

  for (const definition of index.complexTypes.values()) {
    const type = { local: definition.local, namespace: definition.namespace };
    const derivation = derivationElementOf(definition.element);
    const baseName = derivation === undefined ? undefined : attributeOf(derivation, "base");

    derivations.push({
      base: baseName === undefined ? anyType : resolveType(definition.schema, baseName),
      method:
        derivation !== undefined && isXs(derivation, "extension") ? "extension" : "restriction",
      type,
      variety: "complex",
    });

    const effective = required(
      effectiveOf(keyOf(definition.namespace, definition.local)),
      `${definition.local} has no effective definition`,
    );

    for (const use of usesOf(effective).values()) {
      uses.push({ ...use, type });
    }

    if (
      derivation !== undefined &&
      isXs(derivation, "restriction") &&
      childElements(definition.element).some((candidate) => isXs(candidate, "simpleContent"))
    ) {
      facetsOf(type, derivation);
    }
  }

  for (const definition of index.simpleTypes.values()) {
    const type = { local: definition.local, namespace: definition.namespace };
    const children = childElements(definition.element);
    const restriction = children.find((candidate) => isXs(candidate, "restriction"));
    const list = children.find((candidate) => isXs(candidate, "list"));
    const baseName = restriction === undefined ? undefined : attributeOf(restriction, "base");

    if (restriction === undefined) {
      assert.isTrue(
        list !== undefined || children.some((candidate) => isXs(candidate, "union")),
        `${definition.local} is a simple type with no restriction, list or union`,
      );
      derivations.push({
        base: anySimpleType,
        method: list === undefined ? "union" : "list",
        type,
        variety: "simple",
      });
    } else {
      derivations.push({
        base:
          baseName === undefined
            ? { anonymous: `${containerOf(definition.namespace, definition.local)}/base` }
            : resolveType(definition.schema, baseName),
        method: "restriction",
        type,
        variety: "simple",
      });
      facetsOf(type, restriction);
    }
  }

  return { derivations, facets, uses };
};
