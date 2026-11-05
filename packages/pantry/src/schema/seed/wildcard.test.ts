/**
 * The derivation of `seed/wildcard.ts` (phase 11, unit W03a).
 *
 * The seed module is data. This file is the only place it is derived: it reads the QTI schema
 * documents from the shared cache with the repository's own XML reader, follows each schema set's
 * `xs:import`, `xs:include` and `xs:redefine` from its root documents, and compares what the
 * documents declare with what the module holds.
 *
 * - The wildcard sites: each element declaration whose complex type carries an `xs:any` or an
 *   `xs:anyAttribute`, reached through its groups, attribute groups and extension bases, is a host.
 *   A host whose kind the model has is a `wildcardHost` or `attributeWildcard` row, or stands on
 *   the named pending-join list of the phase that brings its kind or its rows (`pendingJoins`).
 * - The global elements and attributes of each schema set, from that set's own closure.
 * - The three `xlink` rosters, from `w3/xlink.xsd`'s enumerations.
 * - The namespace exclusions, by the policy rules of the spec's 4.3, plus the rows derived from the
 *   MathML Recommendation rather than from any XSD (reading 2, decision 110): MathML is validated
 *   by RelaxNG and prose, and its `anyElement` excludes every `m:*` at any depth, so no host admits
 *   a MathML element as foreign content.
 *
 * The comparisons are skipped when the cache directory is absent. Each comparison reports the rows
 * it compared on standard output.
 */
import { existsSync, globSync, readFileSync } from "node:fs";
import { assert, beforeAll, describe, it } from "@effect/vitest";
import { Config, Effect } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { NamespacePolicy, ProcessContents, SchemaSet } from "#pantry/schema/content/rosters.ts";
import type {
  NamespacePolicyHandle,
  ProcessContentsHandle,
} from "#pantry/schema/content/rosters.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import { AttributeName, NodeKind, RootKind, vocabularies } from "#pantry/schema/node.ts";
import type { NodeKindHandle } from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import * as seed from "#pantry/schema/seed/wildcard.ts";

const home = Effect.runSync(Config.String("HOME").pipe(Config.withDefault("")));

/**
 * The shared cache of the QTI schema documents, never the repository.
 */
const cacheDirectory = `${home}/.cache/gr8des/qti3/xsd`;

const XS = "http://www.w3.org/2001/XMLSchema";

const XMLNS = "http://www.w3.org/2000/xmlns/";

/**
 * The namespace of `m:*`, the one namespace the Recommendation-derived exclusion rows name.
 */
const MATHML = "http://www.w3.org/1998/Math/MathML";

/**
 * The root documents of each schema set, the documents its validator is handed.
 */
const setRoots = {
  asi: ["imsqti_asiv3p0_v1p0.xsd", "imsqti_asiv3p0p1_v1p0.xsd"],
  lom: ["md/imsmd_loose_v1p3p2.xsd"],
  manifest: ["imsqtiv3p0_imscpv1p2_v1p0.xsd", "imsqtiv3p0p1_imscpv1p2_v1p0.xsd"],
  usagedata: ["imsqti_usagedatav3p0_v1p0.xsd"],
} as const;

type SetName = keyof typeof setRoots;

/**
 * The schema sets, in the roster's order.
 */
const sets = ["asi", "lom", "manifest", "usagedata"] as const satisfies readonly SetName[];

/**
 * The schema set each root kind is validated against (the spec's 3.4).
 */
const rootSets = {
  externalLom: "lom",
  item: "asi",
  manifest: "manifest",
  outcomes: "asi",
  rptemplate: "asi",
  section: "asi",
  stimulus: "asi",
  test: "asi",
  usagedata: "usagedata",
} as const satisfies Record<(typeof RootKind.handles)[number], SetName>;

/**
 * The hosts whose rows another phase writes: the host and the phase that owns its join, by
 * namespace and local name. A host leaves this list in the unit that adds its rows, and the
 * comparison then requires the row. A host on the list has no row until then.
 */
const pendingHosts: readonly (readonly [string, string, string])[] = [
  ["http://www.imsglobal.org/xsd/imsqtiasi_v3p0", "qti-selection", "J5"],
  ["http://www.imsglobal.org/xsd/imsqtiasi_v3p0", "qti-ordering", "J5"],
  ["http://www.imsglobal.org/xsd/imsqtiasi_v3p0", "qti-companion-materials-info", "J9"],
  ["http://www.imsglobal.org/xsd/imsqtiasi_v3p0", "qti-custom-interaction", "J10"],
  ["http://www.imsglobal.org/xsd/imsqtiasi_v3p0", "template", "J10"],
];

/**
 * The `xlink` namespace: its four elements are abstract and no document in any closure names one in
 * a `substitutionGroup`, so the wildcards of their local children are unreachable.
 */
const XLINK = "http://www.w3.org/1999/xlink";

/**
 * The vocabularies whose every host is not this phase's: MathML (J6), SSML (J7), and `xlink`,
 * whose hosts no instance document reaches.
 */
const deferredNamespaces: readonly (readonly [string, string])[] = [
  [MATHML, "J6"],
  ["http://www.w3.org/2001/10/synthesis", "J7"],
  [XLINK, "unreachable"],
];

/**
 * The attribute groups the `data-*` slot comes through: `extensionAnyTypeLax.Attr` in 3.0.1 and
 * the `dataExtension.<Type>.Attr` family in 3.0.0. Their `##any lax` slot is phase 8's.
 */
const dataSlotGroup = /^(?:extensionAnyTypeLax|dataExtension\..+)\.Attr$/u;

/**
 * Read an element's attribute by its qualified name.
 *
 * @param element - The element.
 * @param name - The attribute's name as written.
 * @returns The value, or `undefined`.
 */
const attributeOf = (element: Element, name: string) =>
  element.attributes.find((candidate) => candidate.qname === name)?.value;

/**
 * An element's element children.
 *
 * @param element - The element.
 * @returns Its children that are elements.
 */
const childElements = (element: Element) =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Whether an element is the named `xs:` element.
 *
 * @param element - The element.
 * @param local - The local name.
 * @returns Whether it is in the schema namespace with that name.
 */
const isXs = (element: Element, local: string) =>
  element.namespace === XS && element.local === local;

/**
 * Every descendant element of an element, in document order.
 *
 * @param element - The element.
 * @returns The descendants, the element itself excluded.
 */
const descendants = (element: Element): readonly Element[] =>
  childElements(element).flatMap((child) => [child, ...descendants(child)]);

/**
 * One schema document of a closure.
 */
interface Schema {
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
 * The cached schema documents by basename. The 38 basenames are unique: the directories do not
 * mirror the purl paths the documents name in `schemaLocation`.
 */
const cachedFiles = (() => {
  const byBasename = new Map<string, string>();

  for (const file of globSync("**/*.xsd", { cwd: cacheDirectory })) {
    const basename = file.split("/").at(-1) ?? file;

    assert.isFalse(byBasename.has(basename), `a second cached document is named ${basename}`);
    byBasename.set(basename, file);
  }

  return byBasename;
})();

const parsed = new Map<string, Element>();

/**
 * Parse one cached schema document with the repository's XML reader, which decodes a byte order
 * mark (`w3/XInclude.xsd` is UTF-16 little-endian). A document several closures reach (`xml.xsd`,
 * the LOM schema) is parsed once.
 *
 * @param file - The path under the cache directory.
 * @returns The document's root element.
 */
const parseSchema = (file: string) => {
  const known = parsed.get(file);

  if (known !== undefined) {
    return known;
  }

  const { root } = Effect.runSync(readXml(readFileSync(`${cacheDirectory}/${file}`)));

  parsed.set(file, root);

  return root;
};

/**
 * The timeout, in milliseconds, of the hook that derives every closure once. Measured on
 * 2026-11-04 on a 14-core M4 Pro: parsing the six closures (the two ASI schemas are 24,000 lines
 * each) and walking their 2,500 declarations takes 3 to 6 s, past the 5 s default of a test and
 * inside the 10 s default of a hook only without load.
 */
const derivationTimeoutMs = 60_000;

/**
 * Follow `xs:import`, `xs:include` and `xs:redefine` from a root document, resolving each
 * `schemaLocation` by its basename in the cache.
 *
 * @param rootFile - The root document's path under the cache directory.
 * @returns Every document the validator holds for that root, the root first.
 */
const closureOf = (rootFile: string) => {
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
        const cached = cachedFiles.get(basename);

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
const resolve = (schema: Schema, qname: string): readonly [string, string] => {
  const colon = qname.indexOf(":");

  if (colon === -1) {
    const declared = schema.prefixes.get("") ?? "";

    return [declared === "" ? schema.effective : declared, qname];
  }

  const namespace = schema.prefixes.get(qname.slice(0, colon));

  assert.isDefined(namespace, `${schema.file} uses the undeclared prefix of ${qname}`);

  return [namespace ?? "", qname.slice(colon + 1)];
};

const keyOf = (namespace: string, local: string) => `${namespace}|${local}`;

/**
 * A named definition and the document it is written in.
 */
interface Definition {
  readonly element: Element;
  readonly schema: Schema;
}

/**
 * One `xs:element` declaration with a name.
 */
interface Declaration {
  /**
   * The named complex type or group the declaration is written inside, or `""` at top level or
   * inside an anonymous type of a global element.
   */
  readonly container: string;
  readonly local: string;
  readonly namespace: string;
  readonly schema: Schema;
  readonly anonymous: Element | undefined;
  readonly typeKey: string | undefined;
}

/**
 * The definitions of a closure.
 */
interface Model {
  readonly attributeGroups: ReadonlyMap<string, Definition>;
  readonly declarations: readonly Declaration[];
  readonly globalAttributes: readonly { readonly local: string; readonly namespace: string }[];
  readonly globalElements: readonly {
    readonly abstract: boolean;
    readonly local: string;
    readonly namespace: string;
  }[];
  readonly groups: ReadonlyMap<string, Definition>;
  readonly schemas: readonly Schema[];
  readonly simpleTypes: ReadonlyMap<string, Definition>;
  readonly types: ReadonlyMap<string, Definition>;
}

/**
 * Index a closure's definitions and element declarations.
 *
 * @param schemas - The closure's documents.
 * @returns The model the wildcard walk reads.
 */
const buildModel = (schemas: readonly Schema[]): Model => {
  const attributeGroups = new Map<string, Definition>();
  const groups = new Map<string, Definition>();
  const simpleTypes = new Map<string, Definition>();
  const types = new Map<string, Definition>();
  const declarations: Declaration[] = [];
  const globalAttributes: { local: string; namespace: string }[] = [];
  const globalElements: { abstract: boolean; local: string; namespace: string }[] = [];

  for (const schema of schemas) {
    for (const child of childElements(schema.root)) {
      const name = attributeOf(child, "name");

      if (name === undefined) {
        continue;
      }

      const key = keyOf(schema.effective, name);

      if (isXs(child, "complexType")) {
        types.set(key, { element: child, schema });
      } else if (isXs(child, "simpleType")) {
        simpleTypes.set(key, { element: child, schema });
      } else if (isXs(child, "group")) {
        groups.set(key, { element: child, schema });
      } else if (isXs(child, "attributeGroup")) {
        attributeGroups.set(key, { element: child, schema });
      } else if (isXs(child, "attribute")) {
        globalAttributes.push({ local: name, namespace: schema.effective });
      } else if (isXs(child, "element")) {
        globalElements.push({
          abstract: attributeOf(child, "abstract") === "true",
          local: name,
          namespace: schema.effective,
        });
      }
    }

    const visit = (parent: Element, container: string) => {
      for (const child of childElements(parent)) {
        const name = attributeOf(child, "name");
        const topLevel = parent === schema.root;
        const inside =
          topLevel && name !== undefined && (isXs(child, "complexType") || isXs(child, "group"))
            ? keyOf(schema.effective, name)
            : container;

        if (isXs(child, "element") && name !== undefined) {
          const form = attributeOf(child, "form");
          const qualified =
            topLevel || form === "qualified" || (form === undefined && schema.elementsQualified);
          const typeName = attributeOf(child, "type");

          declarations.push({
            anonymous: childElements(child).find((candidate) => isXs(candidate, "complexType")),
            container: inside,
            local: name,
            namespace: qualified ? schema.effective : "",
            schema,
            typeKey: typeName === undefined ? undefined : keyOf(...resolve(schema, typeName)),
          });
        }

        visit(child, inside);
      }
    };

    visit(schema.root, "");
  }

  return {
    attributeGroups,
    declarations,
    globalAttributes,
    globalElements,
    groups,
    schemas,
    simpleTypes,
    types,
  };
};

/**
 * What a wildcard slot admits, as a row of the host tables.
 */
interface Slot {
  readonly policy: NamespacePolicyHandle;
  readonly process: ProcessContentsHandle;
  readonly target: string;
}

/**
 * One `xs:any` or `xs:anyAttribute`, as written.
 */
interface RawWildcard {
  readonly namespace: string;
  readonly process: string;
  readonly target: string;
}

/**
 * The wildcards a complex type carries, by kind of slot, before they are merged into one slot.
 */
interface Wildcards {
  readonly attributes: RawWildcard[];
  readonly elements: RawWildcard[];
}

const policyHandles: readonly string[] = NamespacePolicy.handles;

const processHandles: readonly string[] = ProcessContents.handles;

const isPolicy = (value: string): value is NamespacePolicyHandle => policyHandles.includes(value);

const isProcess = (value: string): value is ProcessContentsHandle => processHandles.includes(value);

const nodeKindHandles: readonly string[] = NodeKind.handles;

const isNodeKind = (value: string): value is NodeKindHandle => nodeKindHandles.includes(value);

/**
 * A value a lookup must have found.
 *
 * @param value - The value, or `undefined`.
 * @param message - What is missing, for the failure.
 * @returns The value; the test fails when it is `undefined`.
 */
const required = <A>(value: A | undefined, message: string): A => {
  if (value === undefined) {
    return assert.fail(message);
  }

  return value;
};

/**
 * The wildcard an `xs:any` or `xs:anyAttribute` declares.
 *
 * @param child - The element.
 * @param schema - The document it is written in; its effective namespace is `##other`'s target.
 * @returns The wildcard as written, defaults applied.
 */
const rawOf = (child: Element, schema: Schema): RawWildcard => ({
  namespace: attributeOf(child, "namespace") ?? "##any",
  process: attributeOf(child, "processContents") ?? "strict",
  target: schema.effective,
});

/**
 * The wildcards a type carries: its own `xs:any` and `xs:anyAttribute`, those of the groups and
 * attribute groups it references, and those of its extension base. An element of the content
 * model is not entered (its own type is another host's). The `data-*` slot attribute groups are
 * not entered: that slot is phase 8's, and `dataSlotReferences` counts it.
 *
 * @param model - The closure's definitions.
 * @param definition - The type's definition.
 * @param seen - The extension bases already entered.
 * @returns The type's wildcards.
 */
const wildcardsOf = (
  model: Model,
  definition: Definition,
  seen = new Set<Element>(),
): Wildcards => {
  const found: Wildcards = { attributes: [], elements: [] };
  const referenced = (
    definitions: ReadonlyMap<string, Definition>,
    reference: string,
    schema: Schema,
  ) => {
    const target = required(
      definitions.get(keyOf(...resolve(schema, reference))),
      `${schema.file} references the missing definition ${reference}`,
    );

    return { element: target.element, schema: target.schema };
  };
  const inherit = (extension: Element, schema: Schema) => {
    const base = attributeOf(extension, "base");
    const inherited =
      base === undefined ? undefined : model.types.get(keyOf(...resolve(schema, base)));

    if (inherited !== undefined && !seen.has(inherited.element)) {
      seen.add(inherited.element);

      const above = wildcardsOf(model, inherited, seen);

      found.elements.push(...above.elements);
      found.attributes.push(...above.attributes);
    }
  };
  // What the walk enters next: a referenced group, or the child itself; nothing for a leaf.
  const classify = (child: Element, schema: Schema) => {
    const reference = attributeOf(child, "ref");

    if (isXs(child, "element") || isXs(child, "attribute") || isXs(child, "annotation")) {
      return null;
    }

    if (isXs(child, "any")) {
      found.elements.push(rawOf(child, schema));

      return null;
    }

    if (isXs(child, "anyAttribute")) {
      found.attributes.push(rawOf(child, schema));

      return null;
    }

    if (isXs(child, "group") && reference !== undefined) {
      return referenced(model.groups, reference, schema);
    }

    if (isXs(child, "attributeGroup") && reference !== undefined) {
      return dataSlotGroup.test(reference.split(":").at(-1) ?? reference)
        ? null
        : referenced(model.attributeGroups, reference, schema);
    }

    if (isXs(child, "extension")) {
      inherit(child, schema);
    }

    return { element: child, schema };
  };
  const walk = (parent: Element, schema: Schema) => {
    for (const child of childElements(parent)) {
      const next = classify(child, schema);

      if (next !== null) {
        walk(next.element, next.schema);
      }
    }
  };

  walk(definition.element, definition.schema);

  return found;
};

/**
 * The policy a union of `namespace` tokens names: `##any` swallows the rest, and `##other` with
 * `##local` is `otherOrLocal`.
 *
 * @param tokens - The `namespace` tokens of one slot's wildcards.
 * @returns The policy's name, `local` for a `##local` alone.
 */
const policyOf = (tokens: ReadonlySet<string>) => {
  if (tokens.has("##any")) {
    return "any";
  }

  if (tokens.has("##other")) {
    return tokens.has("##local") ? "otherOrLocal" : "other";
  }

  return "local";
};

/**
 * Merge the wildcards of one slot kind into the one slot a host row names.
 *
 * @param raw - The wildcards of one slot kind.
 * @param label - Names the host in a failure.
 * @returns The slot, or `undefined` when the type carries none.
 */
const mergeSlot = (raw: readonly RawWildcard[], label: string): Slot | undefined => {
  if (raw.length === 0) {
    return undefined;
  }

  const tokens = new Set(raw.flatMap((item) => item.namespace.split(/\s+/u)));
  const processes = new Set(raw.map((item) => item.process));
  const targets = new Set(raw.map((item) => item.target));
  const policy = policyOf(tokens);
  const [processContents = ""] = processes;
  const [target = ""] = targets;

  assert.strictEqual(processes.size, 1, `${label} mixes processContents`);
  assert.strictEqual(targets.size, 1, `${label} mixes target namespaces`);
  assert.isTrue(
    tokens.size === 1 || tokens.has("##any") || (tokens.size === 2 && policy === "otherOrLocal"),
    `${label} names an explicit namespace list`,
  );

  if (!isPolicy(policy) || !isProcess(processContents)) {
    return assert.fail(`${label} has the policy ${policy} and processContents ${processContents}`);
  }

  return { policy, process: processContents, target };
};

/**
 * The kinds of every vocabulary: handle, namespace and local name.
 */
const kindRows = vocabularies.flatMap((vocabulary) =>
  Object.entries(vocabulary.registry).flatMap(([handle, row]) =>
    isNodeKind(handle)
      ? [
          {
            handle,
            local: row.local,
            namespace: row.namespace,
            parent: row.parent._tag === "Some" ? row.parent.value : undefined,
          },
        ]
      : [],
  ),
);

/**
 * The kind a declaration names. A name one kind holds is that kind. A name several kinds hold
 * (`source`, `entry`, `duration` in LOM; `metadata` in the content package) is the kind whose
 * registry `parent` is the kind of the element that owns the type the declaration is written in,
 * and otherwise the kind that has no parent.
 *
 * @param model - The closure's definitions.
 * @param declaration - The element declaration.
 * @param depth - Guards the recursion over owners.
 * @returns The handle, or `undefined` when no kind names it.
 */
const kindOf = (model: Model, declaration: Declaration, depth = 0): NodeKindHandle | undefined => {
  const candidates = kindRows.filter(
    (row) => row.namespace === declaration.namespace && row.local === declaration.local,
  );

  if (candidates.length <= 1 || depth > 8) {
    return candidates[0]?.handle;
  }

  const owners = new Set<string | undefined>(
    model.declarations
      .filter((owner) => declaration.container !== "" && owner.typeKey === declaration.container)
      .map((owner) => kindOf(model, owner, depth + 1)),
  );

  return (
    candidates.find((row) => row.parent !== undefined && owners.has(row.parent))?.handle ??
    candidates.find((row) => row.parent === undefined)?.handle
  );
};

/**
 * One host the closure declares, merged over every declaration of its kind.
 */
interface Host {
  readonly attributes: Slot | undefined;
  readonly elements: Slot | undefined;
  readonly kind: NodeKindHandle | undefined;
  readonly local: string;
  readonly namespace: string;
}

/**
 * The definition of the complex type a declaration has: its anonymous type, or the named type it
 * references.
 *
 * @param model - The closure's definitions.
 * @param declaration - The element declaration.
 * @returns The type's definition, or `undefined` for a simple or built-in type.
 */
const definitionOf = (model: Model, declaration: Declaration): Definition | undefined => {
  if (declaration.anonymous !== undefined) {
    return { element: declaration.anonymous, schema: declaration.schema };
  }

  return declaration.typeKey === undefined ? undefined : model.types.get(declaration.typeKey);
};

/**
 * The hosts one closure declares, merged over every declaration of the same kind (or, for a name
 * no kind holds, of the same namespace and local name). Declarations of one host agree.
 *
 * @param model - The closure's definitions.
 * @returns One entry per host.
 */
const hostsOf = (model: Model) => {
  const hosts = new Map<string, Host>();
  const memo = new Map<Element, Wildcards>();

  for (const declaration of model.declarations) {
    const definition = definitionOf(model, declaration);

    if (definition === undefined) {
      continue;
    }

    const found = memo.get(definition.element) ?? wildcardsOf(model, definition);

    memo.set(definition.element, found);

    if (found.elements.length === 0 && found.attributes.length === 0) {
      continue;
    }

    const label = `${declaration.namespace}:${declaration.local}`;
    const kind = kindOf(model, declaration);
    const host: Host = {
      attributes: mergeSlot(found.attributes, `${label} attributes`),
      elements: mergeSlot(found.elements, `${label} elements`),
      kind,
      local: declaration.local,
      namespace: declaration.namespace,
    };
    const key = kind ?? keyOf(declaration.namespace, declaration.local);
    const earlier = hosts.get(key);

    if (earlier !== undefined) {
      assert.deepStrictEqual(host, earlier, `${label} is declared with two wildcard shapes`);
    }

    hosts.set(key, host);
  }

  return [...hosts.values()];
};

/**
 * The references to a `data-*` slot attribute group across a closure.
 *
 * @param model - The closure's definitions.
 * @returns How many `xs:attributeGroup ref` elements name one.
 */
const dataSlotReferences = (model: Model) =>
  model.schemas
    .flatMap((schema) => descendants(schema.root))
    .filter((candidate) => {
      const reference = attributeOf(candidate, "ref");

      return (
        isXs(candidate, "attributeGroup") &&
        reference !== undefined &&
        dataSlotGroup.test(reference.split(":").at(-1) ?? reference)
      );
    }).length;

/**
 * Which pending join a host stands on, if any.
 *
 * @param host - The host.
 * @returns The join's name, or `undefined`.
 */
const pendingOf = (host: Host) =>
  pendingHosts.find(
    ([namespace, local]) => namespace === host.namespace && local === host.local,
  )?.[2] ?? deferredNamespaces.find(([namespace]) => namespace === host.namespace)?.[1];

/**
 * Compute once, on first use, so a missing cache directory is a skip and not an import failure.
 *
 * @param make - Computes the value.
 * @returns A function that returns the one value.
 */
const lazy = <A>(make: () => A) => {
  const cell = new Map<"value", A>();

  return () => {
    const known = cell.get("value");

    if (known !== undefined) {
      return known;
    }

    const made = make();

    cell.set("value", made);

    return made;
  };
};

/**
 * One closure: a root document of a schema set, its documents and its hosts.
 */
interface Closure {
  readonly hosts: readonly Host[];
  readonly model: Model;
  readonly root: string;
  readonly set: SetName;
}

/**
 * What the documents declare, derived once: every closure, and the hosts merged over them, where a
 * host both editions declare agrees.
 */
const derived = lazy(() => {
  const closures: Closure[] = sets.flatMap((set) =>
    setRoots[set].map((root) => {
      const model = buildModel(closureOf(root));

      return { hosts: hostsOf(model), model, root, set };
    }),
  );
  const merged = new Map<string, Host>();

  for (const closure of closures) {
    for (const host of closure.hosts) {
      const key = host.kind ?? keyOf(host.namespace, host.local);
      const earlier = merged.get(key);

      if (earlier !== undefined) {
        assert.deepStrictEqual(host, earlier, `${key} differs between two closures`);
      }

      merged.set(key, host);
    }
  }

  return { closures, hosts: [...merged.values()] };
});

/**
 * A host row of the module's shape, from a derived host's slot.
 *
 * @param host - The derived host.
 * @param slot - The slot the row is for.
 * @returns The row.
 */
const rowOf = (host: Host, slot: Slot): seed.WildcardHostRow => ({
  host: required(host.kind, `${host.namespace}:${host.local} has a wildcard and no kind`),
  policy: slot.policy,
  process: slot.process,
  target: slot.target,
});

/**
 * The element wildcard rows the documents give the kinds the model has: every host that is not
 * on the pending-join list.
 *
 * @returns The rows.
 */
const derivedElementRows = () =>
  derived().hosts.flatMap((host) =>
    host.elements !== undefined && pendingOf(host) === undefined
      ? [rowOf(host, host.elements)]
      : [],
  );

/**
 * The attribute wildcard rows the documents give the kinds the model has: the lax attribute
 * wildcards that are not on the pending-join list. A strict or skipped attribute wildcard is
 * always a pending join's (strict attribute hosts get typed `xml:` rows and no row here).
 *
 * @returns The rows.
 */
const derivedAttributeRows = () =>
  derived().hosts.flatMap((host) => {
    if (host.attributes === undefined) {
      return [];
    }

    if (host.attributes.process !== "lax") {
      assert.isDefined(
        pendingOf(host),
        `${host.namespace}:${host.local} has a ${host.attributes.process} attribute wildcard and no pending join`,
      );
    }

    return host.attributes.process === "lax" && pendingOf(host) === undefined
      ? [rowOf(host, host.attributes)]
      : [];
  });

/**
 * The `foreign` host row of both tables: any namespace, lax, no target.
 */
const foreignRow: seed.WildcardHostRow = {
  host: "foreign",
  policy: "any",
  process: "lax",
  target: "",
};

const reported: { compared: number; label: string }[] = [];

/**
 * Assert the module's keys equal the derived keys, and record how many were compared.
 *
 * @param label - The comparison's name.
 * @param actual - The keys the module holds.
 * @param expected - The keys derived from the documents.
 */
const sameRows = (label: string, actual: readonly string[], expected: readonly string[]) => {
  const have = new Set(actual);
  const want = new Set(expected);

  assert.strictEqual(have.size, actual.length, `${label}: the module repeats a row`);
  assert.deepStrictEqual(
    {
      extra: [...have].filter((row) => !want.has(row)).toSorted(),
      missing: [...want].filter((row) => !have.has(row)).toSorted(),
    },
    { extra: [], missing: [] },
    label,
  );
  reported.push({ compared: want.size, label });
};

const hostKey = (row: seed.WildcardHostRow) =>
  [row.host, row.policy, row.process, row.target].join("|");

const pairKey = (row: seed.HostNamespaceRow) => `${row.host}|${row.namespace}`;

const globalKey = (row: seed.GlobalRow) => `${row.set}|${row.namespace}|${row.local}`;

/**
 * The namespaces a host row's policy excludes, by the spec's 4.3: `##other` excludes the target
 * and no namespace, `##other ##local` excludes the target, `##any` excludes nothing.
 *
 * @param row - The host row.
 * @returns The excluded namespaces.
 */
const excludedBy = (row: seed.WildcardHostRow) => {
  if (row.policy === "other") {
    return [row.target, ""];
  }

  return row.policy === "otherOrLocal" ? [row.target] : [];
};

/**
 * The declared global elements of a schema set, from its roots' closures: each root of the set
 * gives the same set of names.
 *
 * @param set - The schema set.
 * @returns The `namespace|local` keys of the non-abstract elements.
 */
const declaredElements = (set: SetName) => {
  const perRoot = derived()
    .closures.filter((closure) => closure.set === set)
    .map((closure) =>
      closure.model.globalElements
        .filter((element) => !element.abstract)
        .map((element) => keyOf(element.namespace, element.local))
        .toSorted(),
    );

  for (const names of perRoot) {
    assert.deepStrictEqual(names, perRoot[0], `the editions of ${set} declare different elements`);
  }

  return perRoot[0] ?? [];
};

/**
 * The declared global attributes of a schema set, from its roots' closures.
 *
 * @param set - The schema set.
 * @returns The `namespace|local` keys.
 */
const declaredAttributes = (set: SetName) => {
  const perRoot = derived()
    .closures.filter((closure) => closure.set === set)
    .map((closure) =>
      closure.model.globalAttributes
        .map((attribute) => keyOf(attribute.namespace, attribute.local))
        .toSorted(),
    );

  for (const names of perRoot) {
    assert.deepStrictEqual(
      names,
      perRoot[0],
      `the editions of ${set} declare different attributes`,
    );
  }

  return perRoot[0] ?? [];
};

/**
 * The enumeration of the simple type an `xlink:` attribute is declared with.
 *
 * @param attributeName - The attribute's local name.
 * @returns The enumerated values in document order.
 */
const xlinkEnumeration = (attributeName: string) => {
  const schema = required(
    derived()
      .closures.flatMap((closure) => closure.model.schemas)
      .find((candidate) => candidate.file === "w3/xlink.xsd"),
    "the manifest closure reaches w3/xlink.xsd",
  );
  const topLevel = childElements(schema.root);
  const declaration = required(
    topLevel.find(
      (candidate) =>
        isXs(candidate, "attribute") && attributeOf(candidate, "name") === attributeName,
    ),
    `w3/xlink.xsd declares no attribute ${attributeName}`,
  );
  const typeName = attributeOf(declaration, "type") ?? "";
  const simpleType = required(
    topLevel.find(
      (candidate) =>
        isXs(candidate, "simpleType") &&
        attributeOf(candidate, "name") === typeName.slice(typeName.indexOf(":") + 1),
    ),
    `w3/xlink.xsd declares no simple type ${typeName}`,
  );

  return descendants(simpleType)
    .filter((candidate) => isXs(candidate, "enumeration"))
    .map((candidate) => attributeOf(candidate, "value") ?? "");
};

describe("seed/wildcard rows", () => {
  it("every row names a roster handle, a valid namespace and an NCName, and keeps its key", () => {
    const namespacePattern = new RegExp(patterns.anyUri, "u");
    const localPattern = new RegExp(patterns.ncName, "u");
    const hostRows = [...seed.wildcardHost, ...seed.attributeWildcard];
    const pairRows = [...seed.wildcardExclusion, ...seed.attributeExclusion];
    const globals = [...seed.opaqueGlobals, ...seed.globalElement, ...seed.globalAttribute];

    for (const row of [...hostRows, ...pairRows]) {
      assert.include(NodeKind.handles, row.host);
    }

    for (const row of hostRows) {
      assert.include(NamespacePolicy.handles, row.policy);
      assert.include(ProcessContents.handles, row.process);
      assert.match(row.target, namespacePattern);
    }

    for (const row of pairRows) {
      assert.match(row.namespace, namespacePattern);
    }

    for (const row of globals) {
      assert.include(SchemaSet.handles, row.set);
      assert.match(row.namespace, namespacePattern);
      assert.match(row.local, localPattern);
    }

    for (const row of seed.rootSchemaSet) {
      assert.include(RootKind.handles, row.root);
      assert.include(SchemaSet.handles, row.set);
    }

    for (const row of seed.wildcardAttributeAdmission) {
      assert.include(NodeKind.handles, row.kind);
      assert.include(AttributeName.handles, row.attribute);
    }

    assert.strictEqual(
      new Set(seed.wildcardHost.map((row) => row.host)).size,
      seed.wildcardHost.length,
    );
    assert.strictEqual(
      new Set(seed.attributeWildcard.map((row) => row.host)).size,
      seed.attributeWildcard.length,
    );
    assert.strictEqual(
      new Set(seed.rootSchemaSet.map((row) => row.root)).size,
      seed.rootSchemaSet.length,
    );
  });

  it("every attribute wildcard host and every exclusion row stands on a wildcard host", () => {
    const elementHosts = new Set(seed.wildcardHost.map((row) => row.host));
    const attributeHosts = new Set(seed.attributeWildcard.map((row) => row.host));

    for (const row of seed.wildcardExclusion) {
      assert.isTrue(
        elementHosts.has(row.host),
        `${row.host} excludes a namespace and is no wildcard host`,
      );
    }

    for (const row of seed.attributeExclusion) {
      assert.isTrue(
        attributeHosts.has(row.host),
        `${row.host} excludes an attribute namespace and is no host`,
      );
    }
  });

  it("foreign is the only element kind with an empty local name, and the only such host", () => {
    const characterKinds: readonly string[] = generic.kinds;

    assert.deepStrictEqual(
      kindRows
        .filter((row) => row.local === "" && !characterKinds.includes(row.handle))
        .map((row) => row.handle),
      ["foreign"],
    );

    for (const row of [...seed.wildcardHost, ...seed.attributeWildcard]) {
      assert.isTrue(
        row.host === "foreign" ||
          kindRows.some((kind) => kind.handle === row.host && kind.local !== ""),
        `${row.host} is a host with no local name`,
      );
    }
  });
});

describe.skipIf(!existsSync(cacheDirectory))(
  `seed/wildcard derivation (skipped when ${cacheDirectory} is absent)`,
  () => {
    beforeAll(() => {
      derived();
    }, derivationTimeoutMs);

    it("the cache holds the 38 documents, and the SSML core file places the redefined one", () => {
      assert.strictEqual(cachedFiles.size, 38);

      const schemas = derived().closures.flatMap((closure) => closure.model.schemas);
      const core = schemas.find((schema) => schema.file === "ssmlv1p1-core.xsd");
      const redefined = schemas.find((schema) => schema.file === "ssml/synthesis-nonamespace.xsd");

      assert.isDefined(core);
      assert.strictEqual(redefined?.targetNamespace, "");
      assert.strictEqual(redefined?.effective, core?.targetNamespace);
      assert.strictEqual(core?.targetNamespace, "http://www.w3.org/2001/10/synthesis");
    });

    it("the xlink elements are abstract and no substitution group reaches them", () => {
      for (const closure of derived().closures) {
        const inXlink = closure.model.globalElements.filter(
          (element) => element.namespace === XLINK,
        );

        assert.isTrue(inXlink.every((element) => element.abstract));

        for (const schema of closure.model.schemas) {
          assert.isFalse(
            descendants(schema.root).some((candidate) => {
              const head = attributeOf(candidate, "substitutionGroup");

              return head !== undefined && resolve(schema, head)[0] === XLINK;
            }),
            `${schema.file} places an element in an xlink substitution group`,
          );
        }
      }
    });

    it("the data-* slot is the 21 references of each ASI edition", () => {
      const counts = derived()
        .closures.filter((closure) => closure.set === "asi")
        .map((closure) => dataSlotReferences(closure.model));

      assert.deepStrictEqual(counts, [21, 21]);
      reported.push({ compared: 21, label: "data-* hosts excluded by name (per edition)" });
    });

    it("wildcardHost is every derived element wildcard host, and foreign", () => {
      const rows = derivedElementRows();

      sameRows(
        "wildcardHost",
        seed.wildcardHost.filter((row) => row.host !== "foreign").map(hostKey),
        rows.map(hostKey),
      );
      assert.deepStrictEqual(
        seed.wildcardHost.filter((row) => row.host === "foreign"),
        [foreignRow],
      );
    });

    it("attributeWildcard is every derived lax attribute wildcard host, and foreign", () => {
      const rows = derivedAttributeRows();

      sameRows(
        "attributeWildcard",
        seed.attributeWildcard.filter((row) => row.host !== "foreign").map(hostKey),
        rows.map(hostKey),
      );
      assert.deepStrictEqual(
        seed.attributeWildcard.filter((row) => row.host === "foreign"),
        [foreignRow],
      );
    });

    it("the LOM hosts follow the invariant: grpLax.any is a host row, anyAttribute an attribute row", () => {
      const lom = derived().hosts.filter((host) => host.namespace === seed.namespaces.lom);

      assert.isTrue(lom.length > 0);
      assert.isTrue(
        lom.every((host) => host.kind?.startsWith("lom:") === true),
        "a LOM declaration names no kind",
      );

      const elements = lom
        .filter((host) => host.elements !== undefined)
        .map((host) => host.kind ?? "");
      const attributes = lom
        .filter((host) => host.attributes !== undefined)
        .map((host) => host.kind ?? "");

      sameRows(
        "LOM element hosts",
        seed.wildcardHost.filter((row) => row.host.startsWith("lom:")).map((row) => row.host),
        elements,
      );
      sameRows(
        "LOM attribute hosts",
        seed.attributeWildcard.filter((row) => row.host.startsWith("lom:")).map((row) => row.host),
        attributes,
      );
    });

    it("a pending join is a derived host with no row, and every pending join is still a host", () => {
      const { hosts } = derived();
      const rowHosts = new Set<string>([
        ...seed.wildcardHost.map((row) => row.host),
        ...seed.attributeWildcard.map((row) => row.host),
      ]);

      for (const [namespace, local, join] of pendingHosts) {
        const host = hosts.find(
          (candidate) => candidate.namespace === namespace && candidate.local === local,
        );

        assert.isDefined(host, `${join} names ${local}, which no schema declares as a host`);
        assert.isFalse(
          rowHosts.has(host?.kind ?? ""),
          `${local} has a row and is on the ${join} list`,
        );
      }

      for (const [namespace, join] of deferredNamespaces) {
        assert.isTrue(
          hosts.some((candidate) => candidate.namespace === namespace),
          `${join} names a namespace no host is declared in`,
        );
      }

      reported.push({
        compared: hosts.filter((host) => pendingOf(host) !== undefined).length,
        label: "pending-join hosts (J5, J6, J7, J9, J10 and the unreachable xlink hosts)",
      });
    });

    it("wildcardExclusion is the policy rules of 4.3, and the MathML Recommendation's rows named apart", () => {
      const hostRows = [...derivedElementRows(), foreignRow];
      const fromXsd = hostRows.flatMap((row) =>
        excludedBy(row).map((namespace) => `${row.host}|${namespace}`),
      );
      const fromRecommendation = hostRows
        .filter((row) => row.target !== MATHML)
        .map((row) => `${row.host}|${MATHML}`);
      const inModule = seed.wildcardExclusion.map(pairKey);

      sameRows(
        "wildcardExclusion (XSD-derived)",
        inModule.filter((row) => !row.endsWith(`|${MATHML}`)),
        fromXsd,
      );
      sameRows(
        "wildcardExclusion (Recommendation-derived, MathML)",
        inModule.filter((row) => row.endsWith(`|${MATHML}`)),
        fromRecommendation,
      );
    });

    it("attributeExclusion is xmlns for every attribute wildcard host, and no namespace and the target for other", () => {
      const hostRows = [...derivedAttributeRows(), foreignRow];
      const expected = hostRows.flatMap((row) => [
        `${row.host}|${XMLNS}`,
        ...(row.policy === "other" ? [`${row.host}|`, `${row.host}|${row.target}`] : []),
      ]);

      sameRows("attributeExclusion", seed.attributeExclusion.map(pairKey), expected);
    });

    it("wildcardAttributeAdmission is xml:lang, xml:base, xml:space and xml:id on every attribute wildcard host and foreign", () => {
      const kinds = [...derivedAttributeRows().map((row) => row.host), "foreign"];

      sameRows(
        "wildcardAttributeAdmission",
        seed.wildcardAttributeAdmission.map((row) => `${row.kind}|${row.attribute}`),
        kinds.flatMap((kind) =>
          ["xml:lang", "xml:base", "xml:space", "xml:id"].map(
            (attribute) => `${kind}|${attribute}`,
          ),
        ),
      );
    });

    it("globalElement is each set's declared elements less the opaque globals", () => {
      const declared = sets.flatMap((set) => declaredElements(set).map((name) => `${set}|${name}`));
      const opaque = new Set(seed.opaqueGlobals.map(globalKey));

      for (const row of opaque) {
        assert.include(declared, row, `${row} is opaque and declared by no schema of its set`);
      }

      sameRows(
        "globalElement",
        seed.globalElement.map(globalKey),
        declared.filter((row) => !opaque.has(row)),
      );
      reported.push({
        compared: declared.length,
        label: "declared global elements, opaque included",
      });
    });

    it("opaqueGlobals is the seven ASI roots and every global of the manifest and lom sets", () => {
      const { asi } = seed.namespaces;
      const roots = [
        "qti-assessment-item",
        "qti-assessment-section",
        "qti-assessment-stimulus",
        "qti-assessment-test",
        "qti-outcome-declaration",
        "qti-outcome-processing",
        "qti-response-processing",
      ].map((local) => `asi|${asi}|${local}`);
      const wholeSets = (["lom", "manifest"] as const).flatMap((set) =>
        declaredElements(set).map((name) => `${set}|${name}`),
      );

      sameRows("opaqueGlobals", seed.opaqueGlobals.map(globalKey), [...roots, ...wholeSets]);
    });

    it("globalAttribute is each set's declared attributes", () => {
      sameRows(
        "globalAttribute",
        seed.globalAttribute.map(globalKey),
        sets.flatMap((set) => declaredAttributes(set).map((name) => `${set}|${name}`)),
      );
    });

    it("rootSchemaSet maps each of the nine root kinds to its set, whose closure declares the root", () => {
      sameRows(
        "rootSchemaSet",
        seed.rootSchemaSet.map((row) => `${row.root}|${row.set}`),
        RootKind.handles.map((root) => `${root}|${rootSets[root]}`),
      );

      for (const [set, handle] of [
        ["manifest", "cp:manifest"],
        ["lom", "lom:lom"],
        ["usagedata", "ud:usageData"],
      ] as const) {
        const row = kindRows.find((candidate) => candidate.handle === handle);

        assert.include(declaredElements(set), keyOf(row?.namespace ?? "", row?.local ?? ""));
      }

      assert.deepStrictEqual(
        [...new Set(seed.rootSchemaSet.map((row) => row.set))].toSorted(),
        [...SchemaSet.handles].toSorted(),
      );
    });

    it("the xlink rosters are w3/xlink.xsd's enumerations", () => {
      assert.deepStrictEqual(xlinkEnumeration("type"), [...rosters.XlinkTypeValue.handles]);
      assert.deepStrictEqual(xlinkEnumeration("show"), [...rosters.XlinkShowValue.handles]);
      assert.deepStrictEqual(xlinkEnumeration("actuate"), [...rosters.XlinkActuateValue.handles]);
      reported.push({
        compared:
          rosters.XlinkTypeValue.handles.length +
          rosters.XlinkShowValue.handles.length +
          rosters.XlinkActuateValue.handles.length,
        label: "xlink roster handles",
      });
    });

    it("the XmlSpace roster is w3/xml.xsd's space enumeration", () => {
      const schema = required(
        derived()
          .closures.flatMap((closure) => closure.model.schemas)
          .find((candidate) => candidate.file === "w3/xml.xsd"),
        "a closure reaches w3/xml.xsd",
      );
      const declaration = required(
        childElements(schema.root).find(
          (candidate) => isXs(candidate, "attribute") && attributeOf(candidate, "name") === "space",
        ),
        "w3/xml.xsd declares no attribute space",
      );
      const values = descendants(declaration)
        .filter((candidate) => isXs(candidate, "enumeration"))
        .map((candidate) => attributeOf(candidate, "value") ?? "");

      assert.deepStrictEqual(values, [...rosters.XmlSpace.handles]);
      reported.push({
        compared: rosters.XmlSpace.handles.length,
        label: "XmlSpace roster handles",
      });
    });

    it("reports the rows each comparison covered", () => {
      for (const { compared, label } of reported) {
        process.stdout.write(`wildcard W03a: ${label}: ${compared} compared\n`);
      }

      assert.isAbove(reported.length, 0);
    });
  },
);
