/**
 * The derivation of `seed/xsi.ts` (phase 11, decision 188).
 *
 * The seed module is data. This file is the only place it is derived: it reads the QTI schema
 * documents from the shared cache with the repository's own XML reader (`src/test/xsd.ts` follows
 * each schema set's `xs:import`, `xs:include` and `xs:redefine` from its root documents), walks
 * each closure, and compares what the documents declare with what the module holds.
 *
 * - `declaredRoot`: the global element declarations of the registry namespaces and their types.
 * - `declaredChild`: the element particles of each complex type's content model, through its groups
 *   and compositors and, for a type derived by extension, its base's particles.
 * - `namedTypes`: every named simple and complex type of the closure, and XML Schema's own.
 * - No element declaration in any cached schema is nillable, and no `block`, `blockDefault`, `final`,
 *   `finalDefault` or `abstract="true"` appears in the schema sets' own documents: both are scans
 *   of the documents, so a later schema release that adds one fails here.
 *
 * It also reports, without pinning it, the counts of each comparison and the census of declared
 * types that another named or built-in type derives from (decision 222's evidence).
 *
 * The comparisons are skipped, naming the cache directory, when it is absent.
 */
import { existsSync, readFileSync } from "node:fs";
import nodePath from "node:path";
import { assert, beforeAll, describe, it } from "@effect/vitest";
import type { Element } from "@qti-pie/crust/tree.ts";
import { namespaces } from "#pantry/schema/seed/wildcard.ts";
import * as seed from "#pantry/schema/seed/xsi.ts";
import {
  XS,
  allCachedFiles,
  attributeOf,
  cacheAvailable,
  cacheDirectory,
  childElements,
  closureOf,
  deriveTypeTables,
  indexOf,
  isXs,
  keyOf,
  parseSchema,
  required,
  resolveQName,
} from "#pantry/test/xsd.ts";
import type { Definition, Schema, TypeKey, TypeTables } from "#pantry/test/xsd.ts";

/**
 * One element particle of a content model, or one global element, with its declared type.
 */
interface Declared {
  readonly local: string;
  readonly namespace: string;
  readonly type: TypeKey;
}

/**
 * What the walk of one closure found.
 */
interface Derived {
  /**
   * The complex types' element particles by parent: every named complex type, and every anonymous
   * complex type that a declaration holds.
   */
  readonly children: readonly { readonly declared: Declared; readonly parent: TypeKey }[];
  /**
   * The named simple and complex types of the closure, by expanded name.
   */
  readonly named: readonly (readonly [string, string])[];
  /**
   * The global element declarations.
   */
  readonly roots: readonly Declared[];
  /**
   * The derivation, attribute uses and simple facets of the named types.
   */
  readonly types: TypeTables;
}

/**
 * Derive the declared types of one closure.
 *
 * A type key is the type's expanded name; an anonymous type's key is the path of the declaration
 * that holds it: the global element, or the named type or group it is written inside, then each
 * enclosing local element, each name preceded by the code of its namespace. An element declared
 * with neither `type` nor a type definition has `xs:anyType`.
 *
 * @param schemas - The closure's documents.
 * @param codeOf - A namespace's code, for the anonymous paths.
 * @returns The roots, the particles by parent and the type names.
 */
const deriveClosure = (
  schemas: readonly Schema[],
  codeOf: (namespace: string) => string,
): Derived => {
  const index = indexOf(schemas);
  const anonymous = new Map<string, Definition>();
  const containerOf = (namespace: string, local: string) => `${codeOf(namespace)}:${local}`;
  const typeKeyOf = (declaration: Element, schema: Schema, path: string): TypeKey => {
    const typeName = attributeOf(declaration, "type");

    if (typeName !== undefined) {
      const [namespace, local] = resolveQName(schema, typeName);

      return { local, namespace };
    }

    const inline = childElements(declaration).find(
      (candidate) => isXs(candidate, "complexType") || isXs(candidate, "simpleType"),
    );

    if (inline === undefined) {
      return { local: "anyType", namespace: XS };
    }

    if (isXs(inline, "complexType")) {
      const known = anonymous.get(path);

      assert.isTrue(
        known === undefined || known.element === inline,
        `${schema.file} holds two anonymous types at ${path}`,
      );
      anonymous.set(path, { element: inline, local: path, namespace: "", schema });
    }

    return { anonymous: path };
  };
  const declare = (declaration: Element, schema: Schema, container: string): Declared => {
    const reference = attributeOf(declaration, "ref");

    if (reference !== undefined) {
      const [namespace, local] = resolveQName(schema, reference);
      const target = required(
        index.globalElements.get(keyOf(namespace, local)),
        `${schema.file} references the missing element ${reference}`,
      );

      return {
        local,
        namespace,
        type: typeKeyOf(target.element, target.schema, containerOf(namespace, local)),
      };
    }

    const name = required(
      attributeOf(declaration, "name"),
      `${schema.file} has an unnamed element`,
    );
    const form = attributeOf(declaration, "form");
    const qualified = form === "qualified" || (form === undefined && schema.elementsQualified);

    return {
      local: name,
      namespace: qualified ? schema.effective : "",
      type: typeKeyOf(declaration, schema, `${container}/${name}`),
    };
  };
  const walkContent = (parent: Element, schema: Schema, container: string, out: Declared[]) => {
    for (const child of childElements(parent)) {
      if (isXs(child, "element")) {
        out.push(declare(child, schema, container));
      } else if (isXs(child, "sequence") || isXs(child, "choice") || isXs(child, "all")) {
        walkContent(child, schema, container, out);
      } else if (isXs(child, "group")) {
        const reference = attributeOf(child, "ref");

        if (reference !== undefined) {
          const [namespace, local] = resolveQName(schema, reference);
          const group = required(
            index.groups.get(keyOf(namespace, local)),
            `${schema.file} references the missing group ${reference}`,
          );

          walkContent(group.element, group.schema, containerOf(namespace, local), out);
        }
      }
    }
  };
  const particlesOf = (definition: Element, schema: Schema, container: string): Declared[] => {
    const out: Declared[] = [];
    const content = childElements(definition);
    const complexContent = content.find((candidate) => isXs(candidate, "complexContent"));

    if (complexContent !== undefined) {
      const derivation = childElements(complexContent).find(
        (candidate) => isXs(candidate, "extension") || isXs(candidate, "restriction"),
      );

      if (derivation !== undefined) {
        const base = attributeOf(derivation, "base");

        if (isXs(derivation, "extension") && base !== undefined) {
          const [namespace, local] = resolveQName(schema, base);
          const inherited = index.complexTypes.get(keyOf(namespace, local));

          if (inherited !== undefined) {
            out.push(
              ...particlesOf(inherited.element, inherited.schema, containerOf(namespace, local)),
            );
          }
        }

        walkContent(derivation, schema, container, out);
      }
    } else if (!content.some((candidate) => isXs(candidate, "simpleContent"))) {
      walkContent(definition, schema, container, out);
    }

    return out;
  };
  const roots: Declared[] = [];
  const children: { declared: Declared; parent: TypeKey }[] = [];
  const parentsOf = (parent: TypeKey, particles: readonly Declared[]) => {
    for (const declared of particles) {
      children.push({ declared, parent });
    }
  };

  for (const global of index.globalElements.values()) {
    roots.push({
      local: global.local,
      namespace: global.namespace,
      type: typeKeyOf(global.element, global.schema, containerOf(global.namespace, global.local)),
    });
  }

  for (const type of index.complexTypes.values()) {
    parentsOf(
      { local: type.local, namespace: type.namespace },
      particlesOf(type.element, type.schema, containerOf(type.namespace, type.local)),
    );
  }

  const done = new Set<string>();

  for (let pending = [...anonymous.keys()]; pending.length > 0;) {
    for (const path of pending) {
      const type = required(anonymous.get(path), `${path} is not registered`);

      done.add(path);
      parentsOf({ anonymous: path }, particlesOf(type.element, type.schema, path));
    }

    pending = [...anonymous.keys()].filter((path) => !done.has(path));
  }

  return { children, named: index.typeNames, roots, types: deriveTypeTables(index, codeOf) };
};

/**
 * The 19 primitive datatypes of XML Schema Part 2, section 3.2.
 */
const primitiveDatatypes = [
  "string",
  "boolean",
  "decimal",
  "float",
  "double",
  "duration",
  "dateTime",
  "time",
  "date",
  "gYearMonth",
  "gYear",
  "gMonthDay",
  "gDay",
  "gMonth",
  "hexBinary",
  "base64Binary",
  "anyURI",
  "QName",
  "NOTATION",
] as const;

/**
 * The 25 derived datatypes of XML Schema Part 2, section 3.3, each with the datatype it is derived
 * from by restriction, or by list (`NMTOKENS`, `IDREFS`, `ENTITIES`, whose base is the item type
 * in the Recommendation's figure and `xs:anySimpleType` in the type definition hierarchy).
 */
const derivedDatatypes = {
  ENTITIES: "anySimpleType",
  ENTITY: "NCName",
  ID: "NCName",
  IDREF: "NCName",
  IDREFS: "anySimpleType",
  NCName: "Name",
  NMTOKEN: "token",
  NMTOKENS: "anySimpleType",
  Name: "token",
  byte: "short",
  int: "long",
  integer: "decimal",
  language: "token",
  long: "integer",
  negativeInteger: "nonPositiveInteger",
  nonNegativeInteger: "integer",
  nonPositiveInteger: "integer",
  normalizedString: "string",
  positiveInteger: "nonNegativeInteger",
  short: "int",
  token: "normalizedString",
  unsignedByte: "unsignedShort",
  unsignedInt: "unsignedLong",
  unsignedLong: "nonNegativeInteger",
  unsignedShort: "unsignedInt",
} as const satisfies Record<string, string>;

/**
 * The derived datatypes that are lists; the others are restrictions.
 */
const listDatatypes: ReadonlySet<string> = new Set(["ENTITIES", "IDREFS", "NMTOKENS"]);

/**
 * The rows without repeats, in code-unit order.
 *
 * @param rows - The rows.
 * @returns The distinct rows, sorted.
 */
const sortedRows = (rows: Iterable<string>) => [...new Set(rows)].toSorted();

/**
 * The text of a type key: `<code>:<local>` for a named type, `!<path>` for an anonymous one.
 *
 * @param key - The type key.
 * @param codeOf - A namespace's code.
 * @returns The key as the seed module writes it.
 */
const textOfKey = (key: TypeKey, codeOf: (namespace: string) => string) =>
  "anonymous" in key ? `!${key.anonymous}` : `${codeOf(key.namespace)}:${key.local}`;

/**
 * The tables of one closure as the seed module writes them: sorted, without repeats, one string
 * per row.
 */
interface Tables {
  readonly attributeUse: readonly string[];
  readonly declaredChild: readonly string[];
  readonly declaredRoot: readonly string[];
  readonly namedTypes: readonly string[];
  readonly simpleFacet: readonly string[];
  readonly typeDerivation: readonly string[];
}

/**
 * Write the derived declarations as the seed module's rows. The roots and parents are restricted
 * to the namespaces a registry names on this base (the MathML and SSML rows are their phases'
 * joins); a particle is kept whatever namespace its element and type are in. The type names are
 * every name of the closure, every namespace included, and XML Schema's own.
 *
 * @param derived - A closure's derivation.
 * @param codeOf - A namespace's code.
 * @param registry - The codes of the registry namespaces.
 * @returns The tables.
 */
const tablesOf = (
  derived: Derived,
  codeOf: (namespace: string) => string,
  registry: ReadonlySet<string>,
): Tables => {
  const inRegistry = (key: TypeKey) =>
    registry.has("anonymous" in key ? (key.anonymous.split(":")[0] ?? "") : codeOf(key.namespace));
  const name = (namespace: string, local: string) => `${codeOf(namespace)}:${local}`;
  const builtin = (local: string) => name(XS, local);
  const xsDerivations = [
    `${builtin("anySimpleType")} ${builtin("anyType")} restriction simple`,
    ...primitiveDatatypes.map(
      (local) => `${builtin(local)} ${builtin("anySimpleType")} restriction simple`,
    ),
    ...Object.entries(derivedDatatypes).map(
      ([local, base]) =>
        `${builtin(local)} ${builtin(base)} ${listDatatypes.has(local) ? "list" : "restriction"} simple`,
    ),
  ];

  return {
    attributeUse: sortedRows(
      derived.types.uses.map(
        (use) =>
          `${textOfKey(use.type, codeOf)} ${name(use.namespace, use.local)} ${textOfKey(use.attributeType, codeOf)} ${use.required ? "required" : "optional"}`,
      ),
    ),
    declaredChild: sortedRows(
      derived.children
        .filter((child) => inRegistry(child.parent))
        .map(
          ({ declared, parent }) =>
            `${textOfKey(parent, codeOf)} ${name(declared.namespace, declared.local)} ${textOfKey(declared.type, codeOf)}`,
        ),
    ),
    declaredRoot: sortedRows(
      derived.roots
        .filter((root) => registry.has(codeOf(root.namespace)))
        .map((root) => `${name(root.namespace, root.local)} ${textOfKey(root.type, codeOf)}`),
    ),
    namedTypes: sortedRows([
      ...derived.named.map(([namespace, local]) => name(namespace, local)),
      ...["anyType", "anySimpleType", ...primitiveDatatypes, ...Object.keys(derivedDatatypes)].map(
        (local) => name(XS, local),
      ),
    ]),
    simpleFacet: sortedRows(
      derived.types.facets.map(
        (entry) => `${textOfKey(entry.type, codeOf)} ${entry.facet} ${entry.value}`,
      ),
    ),
    typeDerivation: sortedRows([
      ...derived.types.derivations.map(
        (entry) =>
          `${textOfKey(entry.type, codeOf)} ${textOfKey(entry.base, codeOf)} ${entry.method} ${entry.variety}`,
      ),
      ...xsDerivations,
    ]),
  };
};

const sets = ["asi", "manifest", "lom", "usagedata"] as const;

const versions = ["3.0.0", "3.0.1"] as const;

/**
 * The root document of each schema set and version, the document its validator is handed. The LOM
 * and usage data sets have one document, written for both versions.
 */
const setRoots = {
  asi: { "3.0.0": "imsqti_asiv3p0_v1p0.xsd", "3.0.1": "imsqti_asiv3p0p1_v1p0.xsd" },
  lom: { "3.0.0": "md/imsmd_loose_v1p3p2.xsd", "3.0.1": "md/imsmd_loose_v1p3p2.xsd" },
  manifest: {
    "3.0.0": "imsqtiv3p0_imscpv1p2_v1p0.xsd",
    "3.0.1": "imsqtiv3p0p1_imscpv1p2_v1p0.xsd",
  },
  usagedata: {
    "3.0.0": "imsqti_usagedatav3p0_v1p0.xsd",
    "3.0.1": "imsqti_usagedatav3p0_v1p0.xsd",
  },
} as const satisfies Record<(typeof sets)[number], Record<(typeof versions)[number], string>>;

/**
 * The codes of the namespaces a registry names on this base: the ASI target, XInclude, CP, CP
 * extension, DRD, `qmd`, LOM, CSM and usage data.
 */
const registryCodes: ReadonlySet<string> = new Set([
  "asi",
  "cp",
  "cpx",
  "csmd",
  "drd",
  "lom",
  "qmd",
  "ud",
  "xi",
]);

/**
 * The cached documents that are not the schema sets' own: the W3C's (`w3/`), the MathML and SSML
 * schemas.
 */
const foreignFile = /^(?:w3\/|mathml\/|ssml\/|mathml3\.xsd$|ssmlv1p1-core\.xsd$)/u;

/**
 * XML Schema Part 2, the Recommendation whose section 3 names the built-in datatypes.
 */
const partTwo = nodePath.join(cacheDirectory, "../../w3c/xmlschema-2-20041028.html");

/**
 * The timeout, in milliseconds, of the hook that derives every closure once. Measured on
 * 2026-11-05 on a 14-core M4 Pro: reading the six closures (the two ASI schemas are 24,000 lines
 * each) and walking them takes 10 s, past the 10 s default of a hook.
 */
const derivationTimeoutMs = 120_000;

const codeByNamespace = new Map<string, string>(
  Object.entries(seed.typeNamespaces).map(([code, namespace]) => [namespace, code]),
);

/**
 * A namespace's code in the module's table.
 *
 * @param namespace - The namespace.
 * @returns The code; the test fails when the table has none.
 */
const codeOf = (namespace: string) =>
  required(codeByNamespace.get(namespace), `${namespace} has no code in typeNamespaces`);

/**
 * Report one line on standard output.
 *
 * @param line - What was compared or found.
 */
const report = (line: string) => {
  process.stdout.write(`xsi: ${line}\n`);
};

/**
 * Assert the module's rows equal the derived rows, and report how many were compared.
 *
 * @param label - Names the comparison.
 * @param actual - The module's rows as strings.
 * @param expected - The derived rows.
 * @param minimum - How few rows the schemas may hold; a table a schema set has no rows of passes 0.
 */
const sameRows = (
  label: string,
  actual: readonly string[],
  expected: readonly string[],
  minimum = 1,
) => {
  const have = new Set(actual);
  const want = new Set(expected);
  const missing = [...want].filter((row) => !have.has(row)).toSorted();
  const extra = [...have].filter((row) => !want.has(row)).toSorted();

  assert.strictEqual(have.size, actual.length, `${label} repeats a row`);
  assert.deepStrictEqual(
    {
      extra: extra.slice(0, 5),
      extras: extra.length,
      missing: missing.slice(0, 5),
      missings: missing.length,
    },
    { extra: [], extras: 0, missing: [], missings: 0 },
    `${label}: the module and the schemas differ`,
  );
  assert.isAtLeast(want.size, minimum, `${label} derived too few rows`);
  report(`${label}: ${want.size} rows compared`);
};

/**
 * A name as the derivation writes it.
 *
 * @param namespace - The namespace.
 * @param local - The local name.
 * @returns `<code>:<local>`.
 */
const nameText = (namespace: string, local: string) => `${codeOf(namespace)}:${local}`;

/**
 * The module's type key as the derivation writes it.
 *
 * @param key - The module's key.
 * @returns `<code>:<local>` or `!<path>`.
 */
const keyText = (key: seed.TypeKey) =>
  "anonymous" in key ? `!${key.anonymous}` : `${codeOf(key.namespace)}:${key.local}`;

/**
 * The module's rows of one schema set and version, as the derivation writes them.
 *
 * @param set - The schema set.
 * @param version - The version.
 * @returns The tables.
 */
const moduleTables = (set: (typeof sets)[number], version: (typeof versions)[number]): Tables => {
  const here = (row: { readonly set: string; readonly version: string }) =>
    row.set === set && row.version === version;

  return {
    attributeUse: seed.attributeUse
      .filter(here)
      .map(
        (row) =>
          `${keyText(row.type)} ${nameText(row.namespace, row.local)} ${keyText(row.attributeType)} ${row.required ? "required" : "optional"}`,
      ),
    declaredChild: seed.declaredChild
      .filter(here)
      .map(
        (row) =>
          `${keyText(row.parent)} ${nameText(row.namespace, row.local)} ${keyText(row.type)}`,
      ),
    declaredRoot: seed.declaredRoot
      .filter(here)
      .map((row) => `${nameText(row.namespace, row.local)} ${keyText(row.type)}`),
    namedTypes: seed.namedTypes.filter(here).map((row) => nameText(row.namespace, row.local)),
    simpleFacet: seed.simpleFacet
      .filter(here)
      .map((row) => `${keyText(row.type)} ${row.facet} ${row.value}`),
    typeDerivation: seed.typeDerivation
      .filter(here)
      .map((row) => `${keyText(row.type)} ${keyText(row.base)} ${row.method} ${row.variety}`),
  };
};

/**
 * Whether an attribute restricts derivation or substitution: `block`, `blockDefault`, `final` or
 * `finalDefault` with any value, or `abstract="true"`.
 *
 * @param name - The attribute's local name.
 * @param value - Its value.
 * @returns Whether the schema scan reports it.
 */
const restrictsDerivation = (name: string, value: string) =>
  ["block", "blockDefault", "final", "finalDefault"].includes(name) ||
  (name === "abstract" && value === "true");

/**
 * The attributes a document sets that the scans look for, by element.
 *
 * @param element - The element to search from.
 * @param found - Receives `<element> <attribute>="<value>"` for each match.
 * @param wanted - Whether an attribute with this name and value is one the scan looks for.
 */
const collectAttributes = (
  element: Element,
  found: string[],
  wanted: (name: string, value: string) => boolean,
) => {
  for (const attribute of element.attributes) {
    if (attribute.namespace === "" && wanted(attribute.local, attribute.value)) {
      found.push(`${element.local} ${attribute.local}="${attribute.value}"`);
    }
  }

  for (const child of childElements(element)) {
    collectAttributes(child, found, wanted);
  }
};

/**
 * Count the `xs:element` declarations under an element.
 *
 * @param element - The element to search from.
 * @returns How many descendants, itself included, are `xs:element`.
 */
const countElementDeclarations = (element: Element): number =>
  (isXs(element, "element") ? 1 : 0) +
  childElements(element).reduce((sum, child) => sum + countElementDeclarations(child), 0);

/**
 * A type key as the derivation writes it.
 *
 * @param key - The derivation's key.
 * @returns `<code>:<local>` or `!<path>`.
 */
const typeId = (key: TypeKey) =>
  "anonymous" in key ? `!${key.anonymous}` : `${codeOf(key.namespace)}:${key.local}`;

/**
 * The census of declared types that another type derives from, over one closure's rows.
 *
 * @param derived - The closure's derivation.
 * @returns One line per declared type with a type derived from it, and how many element names
 *   carry it.
 */
const censusOf = (derived: Derived) => {
  const baseOfType = new Map<string, string>(
    derived.types.derivations.map((entry) => [typeId(entry.type), typeId(entry.base)]),
  );

  for (const local of primitiveDatatypes) {
    baseOfType.set(`xs:${local}`, "xs:anySimpleType");
  }

  for (const [local, base] of Object.entries(derivedDatatypes)) {
    baseOfType.set(`xs:${local}`, `xs:${base}`);
  }

  const named = new Map<string, string[]>();
  const builtin = new Map<string, string[]>();

  for (const type of baseOfType.keys()) {
    const seen = new Set<string>([type]);

    for (
      let up = baseOfType.get(type);
      up !== undefined && !seen.has(up);
      up = baseOfType.get(up)
    ) {
      seen.add(up);

      const counts = type.startsWith("xs:") ? builtin : named;

      counts.set(up, [...(counts.get(up) ?? []), type]);
    }
  }

  const declaredBy = new Map<string, Set<string>>();
  const declare = (namespace: string, local: string, type: TypeKey) => {
    const key = typeId(type);

    if (!("anonymous" in type) && key !== "xs:anyType" && key !== "xs:anySimpleType") {
      declaredBy.set(key, (declaredBy.get(key) ?? new Set()).add(`${codeOf(namespace)}:${local}`));
    }
  };

  for (const root of derived.roots) {
    if (registryCodes.has(codeOf(root.namespace))) {
      declare(root.namespace, root.local, root.type);
    }
  }

  for (const { declared, parent } of derived.children) {
    const parentCode =
      "anonymous" in parent ? (parent.anonymous.split(":")[0] ?? "") : codeOf(parent.namespace);

    if (registryCodes.has(parentCode)) {
      declare(declared.namespace, declared.local, declared.type);
    }
  }

  const lines = [...declaredBy]
    .filter(([type]) => (named.get(type)?.length ?? 0) + (builtin.get(type)?.length ?? 0) > 0)
    .toSorted(([left], [right]) => left.localeCompare(right));

  return {
    lines: lines.map(
      ([type, elements]) =>
        `${type} (${elements.size}: ${[...elements].toSorted().join(", ")}) has ${named.get(type)?.length ?? 0} named types derived from it (${(named.get(type) ?? []).toSorted().join(", ")}) and ${builtin.get(type)?.length ?? 0} built-in`,
    ),
    names: new Set(lines.flatMap(([, elements]) => [...elements])).size,
  };
};

describe.skipIf(!cacheAvailable)(
  `xsi declared types (skipped without the cache directory ${cacheDirectory})`,
  () => {
    const derivations = new Map<string, Derived>();

    beforeAll(() => {
      for (const set of sets) {
        for (const version of versions) {
          const file = setRoots[set][version];

          if (!derivations.has(file)) {
            derivations.set(file, deriveClosure(closureOf(file), codeOf));
          }
        }
      }
    }, derivationTimeoutMs);

    const derivedOf = (set: (typeof sets)[number], version: (typeof versions)[number]) =>
      required(derivations.get(setRoots[set][version]), `${set} ${version} was not derived`);
    const derivedTables = (set: (typeof sets)[number], version: (typeof versions)[number]) =>
      tablesOf(derivedOf(set, version), codeOf, registryCodes);

    it("typeNamespaces is the namespaces of wildcard.ts, xs and none, one code each", () => {
      const entries = Object.entries(seed.typeNamespaces);

      assert.deepStrictEqual(
        Object.fromEntries(entries.filter(([code]) => code !== "xs" && code !== "none")),
        namespaces,
      );
      assert.strictEqual(seed.typeNamespaces.xs, XS);
      assert.strictEqual(seed.typeNamespaces.none, "");
      assert.strictEqual(new Set(entries.map(([, namespace]) => namespace)).size, entries.length);

      for (const code of registryCodes) {
        assert.isTrue(Object.hasOwn(seed.typeNamespaces, code), `${code} is not a code`);
      }
    });

    it("declaredRoot is the global elements of the registry namespaces of each set and version", () => {
      for (const set of sets) {
        for (const version of versions) {
          sameRows(
            `declaredRoot ${set} ${version}`,
            moduleTables(set, version).declaredRoot,
            derivedTables(set, version).declaredRoot,
          );
        }
      }
    });

    it("declaredChild is the element particles of each complex type of each set and version", () => {
      for (const set of sets) {
        for (const version of versions) {
          sameRows(
            `declaredChild ${set} ${version}`,
            moduleTables(set, version).declaredChild,
            derivedTables(set, version).declaredChild,
          );
        }
      }
    });

    it("namedTypes is every named type of each closure and XML Schema's own", () => {
      for (const set of sets) {
        for (const version of versions) {
          sameRows(
            `namedTypes ${set} ${version}`,
            moduleTables(set, version).namedTypes,
            derivedTables(set, version).namedTypes,
          );
        }
      }
    });

    it("typeDerivation is the base, method and variety of every named type but xs:anyType", () => {
      for (const set of sets) {
        for (const version of versions) {
          sameRows(
            `typeDerivation ${set} ${version}`,
            moduleTables(set, version).typeDerivation,
            derivedTables(set, version).typeDerivation,
          );
        }
      }
    });

    it("attributeUse is the attribute uses of every named complex type, base uses included", () => {
      for (const set of sets) {
        for (const version of versions) {
          sameRows(
            `attributeUse ${set} ${version}`,
            moduleTables(set, version).attributeUse,
            derivedTables(set, version).attributeUse,
          );
        }
      }
    });

    it("simpleFacet is the facets every named simple type and simple content restriction states", () => {
      for (const set of sets) {
        for (const version of versions) {
          sameRows(
            `simpleFacet ${set} ${version}`,
            moduleTables(set, version).simpleFacet,
            derivedTables(set, version).simpleFacet,
            set === "lom" ? 0 : 1,
          );
        }
      }
    });

    it.skipIf(!existsSync(partTwo))(
      "the built-in datatypes and their bases are those of XML Schema Part 2, section 3",
      () => {
        const html = readFileSync(partTwo, "utf-8");
        const listed = [...html.matchAll(/\b3\.[23]\.\d+ <a href="#(?<name>[A-Za-z0-9]+)">/gu)]
          .map((match) => match.groups?.["name"] ?? "")
          .toSorted();
        const text = html
          .replaceAll(/<[^>]+>/gu, "")
          .replaceAll("&#xb7;", "\u00B7")
          .replaceAll(/\s+/gu, " ");
        const bases = Object.fromEntries(
          [...text.matchAll(/The \u00B7base type\u00B7 of (?<name>\w+) is (?<base>\w+)\./gu)].map(
            (match) => [match.groups?.["name"] ?? "", match.groups?.["base"] ?? ""],
          ),
        );

        assert.deepStrictEqual(
          listed,
          [...primitiveDatatypes, ...Object.keys(derivedDatatypes)].toSorted(),
        );
        assert.strictEqual(listed.length, 44);
        assert.isTrue(
          text.includes("\u00B7base type\u00B7 of all \u00B7primitive\u00B7 datatypes"),
          "Part 2 no longer names the base of the primitive datatypes",
        );
        assert.deepStrictEqual(
          bases,
          Object.fromEntries(
            Object.entries(derivedDatatypes).filter(([local]) => !listDatatypes.has(local)),
          ),
        );
        assert.strictEqual(Object.keys(bases).length, 22);
        assert.deepStrictEqual([...listDatatypes].toSorted(), ["ENTITIES", "IDREFS", "NMTOKENS"]);
      },
    );

    it("every base and attribute type resolves, and the derivation has no cycle", () => {
      for (const set of sets) {
        for (const version of versions) {
          const named = new Set(
            seed.namedTypes
              .filter((row) => row.set === set && row.version === version)
              .map((row) => nameText(row.namespace, row.local)),
          );
          const here = (row: { readonly set: string; readonly version: string }) =>
            row.set === set && row.version === version;
          const rows = seed.typeDerivation.filter(here);
          const baseByType = new Map(rows.map((row) => [keyText(row.type), keyText(row.base)]));
          const resolves = (key: seed.TypeKey) =>
            "anonymous" in key ? key.anonymous.length > 0 : named.has(keyText(key));

          assert.strictEqual(baseByType.size, rows.length, "a type has two derivations");
          assert.deepStrictEqual(
            [...baseByType.keys()].toSorted(),
            [...named].filter((name) => name !== "xs:anyType").toSorted(),
            `${set} ${version}: the derived types are the named types but xs:anyType`,
          );
          assert.deepStrictEqual(
            rows.filter((row) => !resolves(row.base)).map((row) => keyText(row.type)),
            [],
          );
          assert.deepStrictEqual(
            seed.attributeUse
              .filter(here)
              .filter((row) => !resolves(row.type) || !resolves(row.attributeType))
              .map((row) => keyText(row.type)),
            [],
          );
          assert.deepStrictEqual(
            seed.simpleFacet
              .filter(here)
              .filter((row) => !resolves(row.type))
              .map((row) => keyText(row.type)),
            [],
          );

          for (const start of baseByType.keys()) {
            const seen = new Set<string>();

            for (
              let up: string | undefined = start;
              up !== undefined && up !== "xs:anyType";
              up = baseByType.get(up)
            ) {
              assert.isFalse(seen.has(up), `${set} ${version}: ${start} derives from itself`);
              seen.add(up);
            }
          }
        }
      }
    });

    it(
      "no element declaration in any cached schema is nillable",
      () => {
        const nillable: string[] = [];
        let declarations = 0;

        for (const file of allCachedFiles()) {
          const root = parseSchema(file);
          const found: string[] = [];

          declarations += countElementDeclarations(root);
          collectAttributes(root, found, (name) => name === "nillable");
          nillable.push(...found.map((entry) => `${file}: ${entry}`));
        }

        assert.deepStrictEqual(nillable, []);
        assert.isAbove(declarations, 4000, "the scan saw too few element declarations");
        report(
          `nillable: ${declarations} element declarations in ${allCachedFiles().length} documents, none nillable`,
        );
      },
      derivationTimeoutMs,
    );

    it(
      "no block, blockDefault, final, finalDefault or abstract=true in the schema sets' own documents",
      () => {
        const own = new Set<string>();

        for (const set of sets) {
          for (const version of versions) {
            for (const schema of closureOf(setRoots[set][version])) {
              own.add(schema.file);
            }
          }
        }

        const inOwn: string[] = [];
        let others = 0;

        for (const file of allCachedFiles()) {
          const found: string[] = [];

          collectAttributes(parseSchema(file), found, restrictsDerivation);

          if (foreignFile.test(file)) {
            others += found.length;
          } else if (own.has(file)) {
            inOwn.push(...found.map((entry) => `${file}: ${entry}`));
          }
        }

        assert.deepStrictEqual(inOwn, []);
        assert.isAbove(
          others,
          0,
          "the scan found none in the W3C, MathML and SSML documents it is known to see",
        );
        report(
          `own documents: ${[...own].filter((file) => !foreignFile.test(file)).length} scanned, no block, final or abstract (${others} in the others)`,
        );
      },
      derivationTimeoutMs,
    );

    it("reports the census of declared types that another type derives from", () => {
      for (const set of sets) {
        for (const version of versions) {
          const { lines, names } = censusOf(derivedOf(set, version));

          report(
            `census ${set} ${version}: ${names} element names; ${lines.length} declared types are derived from`,
          );

          for (const line of lines) {
            report(`census ${set} ${version}:   ${line}`);
          }
        }
      }
    });
  },
);
