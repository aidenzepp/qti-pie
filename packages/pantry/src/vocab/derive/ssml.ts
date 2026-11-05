/**
 * The SSML 1.1 derivation. It reads the SSML core profile that QTI imports, from the pinned XSDs,
 * and prints the SSML inventory leaf `src/vocab/inventory/ssml.ts`. It also reads, from each ASI
 * XSD, the QTI hosts whose content admits SSML elements.
 *
 * Run it from `packages/pantry` as `node src/vocab/derive/ssml.ts`. It prints the leaf
 * unformatted, and `pnpm exec vp fmt` turns that into the committed file:
 *
 * ```sh
 * node src/vocab/derive/ssml.ts > src/vocab/inventory/ssml.ts
 * pnpm exec vp fmt src/vocab/inventory/ssml.ts
 * ```
 *
 * It reads only the files `sources.ts` pins and touches no database. It imports nothing that
 * reads the leaf, so it still runs while the leaf is being rewritten. `ssml.test.ts` beside it
 * checks the leaf byte for byte, and checks `src/vocab/ssml.ts`'s hosts and wildcards against
 * what this module reads.
 *
 * Reading rules, beyond those of {@link entryOf} (`derive.ts`'s module comment), which already
 * reads a reference to an abstract element as the members of its substitution group:
 *
 * - The schema is `ssml/synthesis-nonamespace.xsd` as `ssml/ssmlv1p1-core.xsd` redefines it.
 *
 *   - The no-namespace file is a chameleon: its components take the core's target namespace (XML Schema
 *     Part 1, 4.2.1). So its unprefixed names resolve there through the core's default namespace, and
 *     each prefix it declares must be bound as the core binds it.
 *   - The core declares no component of its own.
 * - The core's `xsd:redefine` replaces each complex type it names (`speak` and `mark`) with a
 *   restriction of the original, and the restriction's base is the original (4.2.2).
 *
 *   - A restriction keeps every attribute of its base. An attribute it declares replaces the base's
 *     attribute of the same name in place (3.4.2). So `speak/@version`, `speak/@xml:lang` and
 *     `mark/@name` are required, and the rest of `speak`'s attributes stay optional.
 * - A type whose prefix the schema binds to the XML Schema namespace is written `xs:<local>`, as
 *   `derive.ts` writes the types of the `xml:` attributes. Every other type is written as declared.
 *   So the SSML leaf spells the built-ins as the ASI leaves do, though SSML's files bind `xsd:`.
 * - A type's attribute wildcard is the `anyAttribute` of the type, of its attribute groups, or of its
 *   restriction step.
 * - A host is an element declaration of an ASI XSD whose complex type's content references an element
 *   of the SSML namespace, once for each such type of the element.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-1/ | XML Schema Part 1: Structures, Second Edition}
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Array as Arr, Console, Effect, Layer, Option, Order, Result } from "effect";
import { Command } from "effect/cli";
import { Digest } from "effect/crypto";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import {
  attributeOf,
  contentOf,
  elementsOf,
  entryOf,
  firstXs,
  indexSchema,
  isXs,
  renderLeaf,
  requireAttribute,
  requireComponent,
  resolve,
  soleTypeOf,
  xsChildren,
  XsdReadingError,
} from "#pantry/vocab/derive/derive.ts";
import type { AttributeRow, Entry, LeafSpec, XsdSchema } from "#pantry/vocab/derive/derive.ts";
import { readSource } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import type { Wildcard } from "#pantry/vocab/open.ts";

/**
 * The XML Schema namespace, in which the built-in types are.
 */
const XS = "http://www.w3.org/2001/XMLSchema";

/**
 * The pinned no-namespace SSML schema, which holds every SSML component.
 */
const baseSource = "ssml/synthesis-nonamespace.xsd" satisfies SourcePath;

/**
 * The pinned SSML core profile: the schema the ASI XSDs import, which redefines
 * {@link baseSource} into the synthesis namespace.
 */
const coreSource = "ssml/ssmlv1p1-core.xsd" satisfies SourcePath;

/**
 * The prefix of every SSML kind handle.
 *
 * SSML's `p`, `sub` and `audio` share a local name with HTML kinds, so every SSML handle is
 * prefixed, as `xi:include` is. The ASI XSDs bind the namespace to `ssml11`; the handle
 * prefix is this repository's, not the XSDs'.
 */
export const handlePrefix = "ssml";

/**
 * The pinned ASI XSD of each QTI schema version, from which the SSML hosts are read.
 */
export const asiSources = {
  "3.0.0": "imsqti_asiv3p0_v1p0.xsd",
  "3.0.1": "imsqti_asiv3p0p1_v1p0.xsd",
} as const satisfies Readonly<Record<string, SourcePath>>;

/**
 * What the SSML inventory records for one kind, and its type's attribute wildcard: the
 * `anyAttribute` it declares, `None` when it declares none.
 */
export interface SsmlEntry extends Entry {
  readonly attributeWildcard: Option.Option<Wildcard>;
}

/**
 * The SSML vocabulary as the pinned XSDs state it: its namespace and its entries, in handle order.
 */
export interface SsmlVocabulary {
  readonly entries: readonly SsmlEntry[];
  readonly namespace: string;
}

/**
 * One QTI element declaration whose type's content references SSML elements: the element, its
 * type, and the local names of the SSML elements the type references, in reference order, each
 * once.
 */
export interface SsmlHost {
  readonly element: string;
  readonly ssml: readonly string[];
  readonly type: string;
}

/**
 * The SSML schema, ready to read entries from.
 *
 * `schema` is the chameleon view: the no-namespace file's components in the core's namespaces.
 * There, each redefined complex type also stands under {@link redefinitionKey}, while its own
 * name keeps the original, which a redefinition's base names. `redefined` names the redefined
 * types.
 */
interface SsmlSchema {
  readonly redefined: ReadonlySet<string>;
  readonly schema: XsdSchema;
}

/**
 * Refuse a construct the reading rules do not cover.
 *
 * @param detail - The construct and what about it is not read.
 * @returns The failure.
 */
const refuse = (detail: string): Result.Result<never, XsdReadingError> =>
  Result.fail(new XsdReadingError({ detail }));

/**
 * The key a redefined complex type's redefinition stands under in the chameleon view.
 *
 * `#` cannot occur in an NCName, so the key never names a component of the schema. It has no
 * colon, so {@link resolve} reads it as a name in the view's target namespace.
 *
 * @param name - The redefined type's name.
 * @returns The key.
 */
const redefinitionKey = (name: string): string => `${name}#redefined`;

/**
 * The local name a QName-valued attribute names in the schema's target namespace.
 *
 * @param schema - The schema the value is written in.
 * @param lexical - The value as written.
 * @returns The local name, or `None` when the name is in another namespace.
 */
const ownLocal = (
  schema: XsdSchema,
  lexical: string,
): Result.Result<Option.Option<string>, XsdReadingError> =>
  Result.map(resolve(schema, lexical), (name) =>
    name.namespace === schema.targetNamespace ? Option.some(name.local) : Option.none(),
  );

/**
 * Read the complex types the core's `xsd:redefine` replaces.
 *
 * @param core - The core profile, indexed.
 * @param root - Its `xsd:schema` element.
 * @returns Each redefinition by the name it redefines. It is an {@link XsdReadingError} when the
 *   core redefines another file or anything but a complex type, or when a redefinition is not a
 *   `complexContent` restriction of the type it redefines.
 */
const redefinitionsOf = (
  core: XsdSchema,
  root: Element,
): Result.Result<ReadonlyMap<string, Element>, XsdReadingError> =>
  Result.gen(function* redefinitionsOfBody() {
    const redefinitions = new Map<string, Element>();
    const location = baseSource.slice(baseSource.lastIndexOf("/") + 1);

    for (const redefine of xsChildren(root, "redefine")) {
      const target = yield* requireAttribute(redefine, "schemaLocation");

      if (target !== location) {
        return yield* refuse(`the core redefines ${target}, not ${location}`);
      }

      for (const component of elementsOf(redefine).filter((node) => !isXs(node, "annotation"))) {
        if (!isXs(component, "complexType")) {
          return yield* refuse(`the core redefines an ${component.qname}, not a complex type`);
        }

        const name = yield* requireAttribute(component, "name");
        const step = Option.flatMap(firstXs(component, "complexContent"), (content) =>
          firstXs(content, "restriction"),
        );
        const base = Option.isSome(step)
          ? yield* ownLocal(core, yield* requireAttribute(step.value, "base"))
          : Option.none();

        if (!Option.contains(base, name)) {
          return yield* refuse(
            `the redefinition of ${name} is not a complexContent restriction of ${name}`,
          );
        }

        redefinitions.set(name, component);
      }
    }

    return redefinitions;
  });

/**
 * Build the SSML schema from its two files.
 *
 * @param base - The no-namespace file, `ssml/synthesis-nonamespace.xsd`.
 * @param core - The core profile, `ssml/ssmlv1p1-core.xsd`.
 * @returns The schema, or an {@link XsdReadingError} when the files do not have the shape the
 *   reading rules describe.
 */
const ssmlSchemaOf = (
  base: XmlDocument,
  core: XmlDocument,
): Result.Result<SsmlSchema, XsdReadingError> =>
  Result.gen(function* ssmlSchemaOfBody() {
    const own = yield* indexSchema(base);
    const including = yield* indexSchema(core);
    const declared = [
      including.attributeGroups.size,
      including.complexTypes.size,
      including.declarations.size,
      including.elements.size,
      including.groups.size,
      including.simpleTypes.size,
    ].reduce((sum, size) => sum + size, 0);

    if (declared > 0) {
      return yield* refuse(`the core declares ${declared} components of its own`);
    }

    for (const [prefix, namespace] of own.namespaces) {
      if (including.namespaces.get(prefix) !== namespace) {
        return yield* refuse(`the no-namespace file binds the prefix ${prefix} unlike the core`);
      }
    }

    const redefinitions = yield* redefinitionsOf(including, core.root);

    return {
      redefined: new Set(redefinitions.keys()),
      schema: {
        ...own,
        complexTypes: new Map([
          ...own.complexTypes,
          ...[...redefinitions].map(([name, type]) => [redefinitionKey(name), type] as const),
        ]),
        namespaces: including.namespaces,
        targetNamespace: including.targetNamespace,
        targetPrefix: including.targetPrefix,
      },
    };
  });

/**
 * What each `namespace` value of an `xsd:anyAttribute` the reading covers means.
 */
const namespaceReadings: ReadonlyMap<string, Wildcard["namespaces"]> = new Map([
  ["##any", "any"],
  ["##other", "other"],
]);

/**
 * What each `processContents` value of an `xsd:anyAttribute` means.
 */
const processingReadings: ReadonlyMap<string, Wildcard["processing"]> = new Map([
  ["lax", "lax"],
  ["skip", "skip"],
  ["strict", "strict"],
]);

/**
 * Read a value of a wildcard's attribute through its table of readings.
 *
 * @param node - The wildcard.
 * @param name - The attribute, `namespace` or `processContents`.
 * @param fallback - The attribute's XSD default, read when the wildcard omits it.
 * @param readings - What each value the reading covers means.
 * @returns The value's meaning, or an {@link XsdReadingError} for a value the table lacks.
 */
const readWildcardAttribute = <A>(
  node: Element,
  name: string,
  fallback: string,
  readings: ReadonlyMap<string, A>,
): Result.Result<A, XsdReadingError> => {
  const value = Option.getOrElse(attributeOf(node, name), () => fallback);

  return Option.match(Option.fromNullishOr(readings.get(value)), {
    onNone: () => refuse(`an ${node.qname} has ${name}="${value}", which is not read`),
    onSome: (reading) => Result.succeed(reading),
  });
};

/**
 * Read an attribute wildcard in `open.ts`'s shape, with the XSD defaults `##any` and `strict`.
 *
 * @param node - An `xsd:anyAttribute` element.
 * @returns The wildcard, or an {@link XsdReadingError} for a namespace list or an unknown
 *   `processContents`, which the shape does not hold.
 */
const wildcardOf = (node: Element): Result.Result<Wildcard, XsdReadingError> =>
  Result.gen(function* wildcardOfBody() {
    return {
      namespaces: yield* readWildcardAttribute(node, "namespace", "##any", namespaceReadings),
      processing: yield* readWildcardAttribute(
        node,
        "processContents",
        "strict",
        processingReadings,
      ),
    };
  });

/**
 * The attribute wildcards a holder declares: its own `anyAttribute`, then those of its attribute
 * groups, in reference order.
 *
 * @param schema - The chameleon view.
 * @param holder - A complex type, a restriction step or an attribute group.
 * @returns The wildcards, or an {@link XsdReadingError} for an unknown attribute group.
 */
const attributeWildcardsOf = (
  schema: XsdSchema,
  holder: Element,
): Result.Result<readonly Wildcard[], XsdReadingError> =>
  Result.gen(function* attributeWildcardsOfBody() {
    const found: Wildcard[] = [];

    for (const wildcard of xsChildren(holder, "anyAttribute")) {
      found.push(yield* wildcardOf(wildcard));
    }

    for (const reference of xsChildren(holder, "attributeGroup")) {
      const group = yield* requireComponent(
        schema,
        schema.attributeGroups,
        "attributeGroup",
        yield* requireAttribute(reference, "ref"),
      );

      found.push(...(yield* attributeWildcardsOf(schema, group)));
    }

    return found;
  });

/**
 * Read a complex type's attribute wildcard: that of its derivation step when it is a restriction,
 * else its own.
 *
 * @param schema - The chameleon view.
 * @param complexType - The `xsd:complexType` element.
 * @returns The wildcard, `None` when it declares none. It is an {@link XsdReadingError} when the
 *   type derives by extension, whose wildcard joins its base's, or declares more than one wildcard,
 *   which XML Schema would intersect: this reading does neither.
 */
const attributeWildcardOf = (
  schema: XsdSchema,
  complexType: Element,
): Result.Result<Option.Option<Wildcard>, XsdReadingError> =>
  Result.gen(function* attributeWildcardOfBody() {
    const content = Option.orElse(firstXs(complexType, "complexContent"), () =>
      firstXs(complexType, "simpleContent"),
    );

    if (Option.exists(content, (step) => Option.isSome(firstXs(step, "extension")))) {
      return yield* refuse("the attribute wildcard of a type derived by extension is not read");
    }

    const holder = content.pipe(
      Option.flatMap((step) => firstXs(step, "restriction")),
      Option.getOrElse(() => complexType),
    );
    const found = yield* attributeWildcardsOf(schema, holder);

    return found.length > 1
      ? yield* refuse(`a complex type declares ${found.length} attribute wildcards`)
      : Arr.head(found);
  });

/**
 * Write a type the way the leaf writes it: `xs:<local>` when its prefix is bound to the XML
 * Schema namespace, else as written.
 *
 * An unbound prefix is left as written. It can only be `derive.ts`'s own `xs:` spelling of an
 * `xml:` attribute's type, because {@link entryOf} resolves every declared type and refuses one
 * with an unbound prefix.
 *
 * @param schema - The schema the attribute is declared in.
 * @param row - The attribute row.
 * @returns The row with its type so written.
 */
const spelled = (schema: XsdSchema, row: AttributeRow): AttributeRow => {
  const colon = row.type.indexOf(":");
  const bound =
    colon === -1
      ? Option.none()
      : Option.fromNullishOr(schema.namespaces.get(row.type.slice(0, colon)));

  return Option.contains(bound, XS) ? { ...row, type: `xs:${row.type.slice(colon + 1)}` } : row;
};

/**
 * Apply a restriction to the attribute rows read for it: its base's, then its own.
 *
 * Each name keeps its first position and takes its last row, so a declaration of the
 * restriction replaces the base's declaration of the same name in place.
 *
 * @param rows - The base's rows, then the restriction's.
 * @returns The restricted type's rows.
 */
const restricted = (rows: readonly AttributeRow[]): readonly AttributeRow[] =>
  Arr.dedupe(rows.map((row) => row.name)).flatMap((name) =>
    rows.filter((row) => row.name === name).slice(-1),
  );

/**
 * Read one SSML kind's entry.
 *
 * @param ssml - The SSML schema.
 * @param element - The element's name.
 * @returns The entry, with its restriction applied, its built-in types spelled `xs:` and its
 *   attribute wildcard read.
 */
const ssmlEntryOf = (
  ssml: SsmlSchema,
  element: string,
): Result.Result<SsmlEntry, XsdReadingError> =>
  Result.gen(function* ssmlEntryOfBody() {
    const { schema } = ssml;
    const type = yield* soleTypeOf(schema, element);
    const local = yield* ownLocal(schema, type);
    const redefined = Option.exists(local, (name) => ssml.redefined.has(name));
    const key = redefined ? redefinitionKey(type) : type;
    const entry = yield* entryOf(schema, {
      element,
      handle: `${handlePrefix}:${element}`,
      type: key,
    });
    const attributes = redefined ? restricted(entry.attributes) : entry.attributes;

    return {
      ...entry,
      attributeWildcard: yield* attributeWildcardOf(
        schema,
        yield* requireComponent(schema, schema.complexTypes, "complexType", key),
      ),
      attributes: attributes.map((row) => spelled(schema, row)),
      type,
    };
  });

/**
 * Read the SSML vocabulary from its two files.
 *
 * Every element the no-namespace file declares with a type is a kind: its 17 top-level elements
 * and the `meta`, `metadata` and `lexicon` that `speak`'s content declares locally. The abstract
 * `aws` and `struct` declare no type and are no kind.
 *
 * @param base - The no-namespace file, `ssml/synthesis-nonamespace.xsd`.
 * @param core - The core profile, `ssml/ssmlv1p1-core.xsd`.
 * @returns The vocabulary, its entries in handle order.
 */
export const ssmlOf = (
  base: XmlDocument,
  core: XmlDocument,
): Result.Result<SsmlVocabulary, XsdReadingError> =>
  Result.gen(function* ssmlOfBody() {
    const ssml = yield* ssmlSchemaOf(base, core);
    const entries: SsmlEntry[] = [];

    for (const element of ssml.schema.declarations.keys()) {
      entries.push(yield* ssmlEntryOf(ssml, element));
    }

    return {
      entries: Arr.sort(
        entries,
        Order.mapInput(Order.String, (entry: SsmlEntry) => entry.handle),
      ),
      namespace: ssml.schema.targetNamespace,
    };
  });

/**
 * Read the QTI hosts of the SSML elements from an ASI XSD.
 *
 * @param asi - An ASI XSD, indexed.
 * @param namespace - The SSML namespace.
 * @returns Each element declaration whose complex type's content references an element of the
 *   namespace, in declaration order, once for each such type of the element.
 */
export const hostsOf = (
  asi: XsdSchema,
  namespace: string,
): Result.Result<readonly SsmlHost[], XsdReadingError> =>
  Result.gen(function* hostsOfBody() {
    const hosts: SsmlHost[] = [];

    for (const [element, types] of asi.declarations) {
      for (const type of types) {
        const local = yield* ownLocal(asi, type);
        const complexType = local.pipe(
          Option.flatMap((name) => Option.fromNullishOr(asi.complexTypes.get(name))),
        );

        if (Option.isNone(complexType)) {
          continue;
        }

        const ssml: string[] = [];

        for (const { name } of (yield* contentOf(asi, complexType.value)).references) {
          const resolved = yield* resolve(asi, name);

          if (resolved.namespace === namespace && !ssml.includes(resolved.local)) {
            ssml.push(resolved.local);
          }
        }

        if (ssml.length > 0) {
          hosts.push({ element, ssml, type });
        }
      }
    }

    return hosts;
  });

/**
 * Read the SSML vocabulary from the cache.
 *
 * @returns The vocabulary.
 */
export const loadSsml = Effect.fn("vocab.loadSsml")(function* loadSsml() {
  const [base, core] = yield* Effect.all([readSource(baseSource), readSource(coreSource)], {
    concurrency: "unbounded",
  });

  return yield* Effect.fromResult(ssmlOf(base, core));
});

/**
 * Read the SSML hosts of one QTI schema version from the cache.
 *
 * @param version - The schema version.
 * @param namespace - The SSML namespace, as {@link loadSsml} reads it.
 * @returns The hosts.
 */
export const loadHosts = Effect.fn("vocab.loadHosts")(function* loadHosts(
  version: keyof typeof asiSources,
  namespace: string,
) {
  const asi = yield* Effect.fromResult(indexSchema(yield* readSource(asiSources[version])));

  return yield* Effect.fromResult(hostsOf(asi, namespace));
});

/**
 * What the SSML leaf says about itself.
 */
export const ssmlLeafSpec: LeafSpec = {
  command: "node src/vocab/derive/ssml.ts",
  exportName: "ssmlInventory",
  label: "SSML 1.1",
  largerGroups:
    "the twelve members of the `aws` substitution group and the content choices of 9 to 16 names, all `0..n` but those of `speak`'s first sentence-and-structure choice, which are `0..1`",
  notes: [
    [
      "The schema is the no-namespace file as the core profile redefines it into the synthesis namespace, so `speak/@version`, `speak/@xml:lang` and `mark/@name` are required. Built-in types are spelled `xs:`, as in the ASI leaves. The reading rules are `src/vocab/derive/ssml.ts`'s.",
    ],
  ],
  sources: [baseSource, coreSource],
  test: "src/vocab/derive/ssml.test.ts",
};

/**
 * The command line: `ssml` prints the SSML inventory leaf to standard output.
 */
const command = Command.make(
  "ssml",
  {},
  Effect.fn("vocab.ssmlCommand")(function* ssmlCommand() {
    const { entries } = yield* loadSsml();

    yield* Console.log(renderLeaf(ssmlLeafSpec, entries));
  }),
).pipe(
  Command.withDescription(
    "Print the SSML inventory leaf, read from the pinned XSDs in ~/.cache/gr8des/qti3/xsd.",
  ),
);

if (import.meta.main) {
  NodeRuntime.runMain(
    Command.run(command, { version: "0.0.0" }).pipe(
      Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto)),
    ),
  );
}
