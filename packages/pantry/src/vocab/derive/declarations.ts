/**
 * The declarations deriver: it reads every vocabulary's XSDs, in each schema version, into the
 * rosters and declarations of `src/vocab/inventory/types.ts`, and prints two generated leaves
 * (review R3, R10 and R11):
 *
 * - `vocabularies`, `src/vocab/inventory/vocabularies.ts`: each vocabulary's roster, one per
 *   namespace, its kinds in the order the XSDs first declare them, and the kinds a schema declares
 *   globally;
 * - `attributes`, `src/vocab/inventory/attributes.ts`: each kind's attribute declarations, its
 *   attribute wildcard and its text's simple type, each stated once for the versions it holds in;
 *   and beside them the governing types an `xsi:type` may give an element (spec readings 60 and 84,
 *   {@link governingRowsOf}): the attribute declarations and wildcard of each complex type derived
 *   from a type some element is declared with, and the text of every named simple type, the
 *   built-ins' included.
 *
 * Run it from `packages/pantry` as `node src/vocab/derive/declarations.ts <target>`; it reads only
 * the files `sources.ts` pins, touches no database, and imports nothing that reads the leaves:
 *
 * ```sh
 * node src/vocab/derive/declarations.ts vocabularies > src/vocab/inventory/vocabularies.ts
 * node src/vocab/derive/declarations.ts attributes > src/vocab/inventory/attributes.ts
 * pnpm exec vp fmt src/vocab/inventory/vocabularies.ts src/vocab/inventory/attributes.ts
 * ```
 *
 * `declarations.test.ts` beside it checks that a re-run reproduces both byte for byte.
 *
 * The kinds and the schemas of each version are the content-model IR's (`models.ts`). Beyond its
 * rules, and those of `derive.ts`, which reads a complex type's attributes and wildcard:
 *
 * - A kind's attributes are its type's, its base types' first, each name once: a restriction's own
 *   declaration of a name replaces its base's, as XML Schema 1.0 Part 1, 3.4.2, makes it. An
 *   element of a simple type, and one of no type, declares none.
 * - A kind's attribute wildcard is its type's complete wildcard (`attributeWildcardOf`); an element
 *   of no type holds `xs:anyType`'s, a lax `##any`.
 * - A kind's text type is its simple type, or its complex type's simple content's.
 * - A kind declared more than once in a version reads its first declaration's attributes; a kind
 *   whose declarations disagree on them is refused.
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Array as Arr, Console, Effect, Equal, Layer, Match, Option, Order, Result } from "effect";
import { Argument, Command } from "effect/cli";
import { Digest } from "effect/crypto";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { typeHandle } from "#pantry/grammar/xsi.ts";
import {
  attributeNameDirective,
  attributeOf,
  attributeWildcardOf,
  declaredType,
  entryOfType,
  firstXs,
  loadSchema,
  qualify,
  refuse,
  valueTypeOf,
  XsdReadingError,
} from "#pantry/vocab/derive/derive.ts";
import type { AttributeRow, KindSpec, XsdSchema } from "#pantry/vocab/derive/derive.ts";
import { builtinBases, valueDomainOf } from "#pantry/vocab/derive/domains.ts";
import type { DomainError } from "#pantry/vocab/derive/domains.ts";
import {
  declarationsIn,
  derivationsOf,
  handleOf,
  loadWorld,
  sourcesWriter,
  typeNameOf,
} from "#pantry/vocab/derive/models.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import { redefinitionKey } from "#pantry/vocab/derive/ssml.ts";
import type { Declaration, SchemaView, World } from "#pantry/vocab/derive/models.ts";
import type {
  AttributeDeclaration,
  AttributeWildcard,
  Domain,
  GlobalAttributeDeclaration,
  GlobalKind,
  Facet,
  Source,
  Sources,
  TextType,
  TypeAttributeDeclaration,
  TypeAttributeWildcard,
  TypeReading,
  TypeText,
  ValueType,
  VocabularyRoster,
} from "#pantry/vocab/inventory/types.ts";
import {
  vocabularyNamespaces,
  xlinkNamespace,
  xmlNamespace,
  xsNamespace,
} from "#pantry/vocab/namespaces.ts";

/**
 * What one version's XSDs declare about one kind: its attributes, its attribute wildcard and its
 * text type.
 */
interface KindReading {
  readonly attributes: readonly (AttributeRow & {
    readonly domain: Domain;
    readonly source: Source;
  })[];
  readonly text: Option.Option<{ readonly domain: Domain; readonly type: ValueType }>;
  readonly wildcard: Option.Option<Pick<AttributeWildcard, "namespace" | "processing">>;
}

/**
 * The attribute wildcard of `xs:anyType`, which an element of no type holds.
 */
const anyTypeWildcard = { namespace: "##any", processing: "lax" } as const;

/**
 * Keep one row per attribute name, the last: a restriction's own declaration replaces its base's.
 *
 * @param rows - The rows, base types' first.
 * @returns Each name's last row, in the order the names first appear.
 */
const lastOfEach = (rows: readonly AttributeRow[]): readonly AttributeRow[] =>
  Arr.dedupe(rows.map((row) => row.name)).flatMap((name) =>
    rows.filter((row) => row.name === name).slice(-1),
  );

/**
 * The prefix an attribute handle carries for a name in the XML namespace.
 */
const xmlPrefix = "xml:";

/**
 * The prefix an attribute handle carries for a name in the XLink namespace.
 */
const xlinkPrefix = "xlink:";

/**
 * The pin of XLink's attribute declarations, `xlink/xlink.xsd`, which the content-packaging
 * extension imports (`cpext/imsqtiv3p0p1_cpextv1p2_v1p0.xsd` line 10) and which declares ten global
 * attributes and no element.
 */
const xlinkSource = "xlink/xlink.xsd" satisfies SourcePath;

/**
 * Read a global attribute of a schema as the schema declares it.
 *
 * @param schema - The schema, or none where the version reads no such schema.
 * @param file - The schema's file, which a refusal names.
 * @param prefix - The prefix its handles carry, such as `xml:` or `xlink:`.
 * @param name - The handle, such as `xml:lang` or `xlink:href`.
 * @returns Its value type and domain, or an {@link XsdReadingError} for a name the schema does not
 *   declare.
 */
const globalAttributeIn = (
  schema: Option.Option<XsdSchema>,
  file: string,
  prefix: string,
  name: string,
): Result.Result<GlobalAttributeDeclaration, DomainError> =>
  Result.gen(function* globalAttributeInBody() {
    const local = name.slice(prefix.length);
    const declaration = schema.pipe(
      Option.flatMap((held) => Option.fromNullishOr(held.attributes.get(local))),
    );

    if (Option.isNone(schema) || Option.isNone(declaration)) {
      return yield* refuse(`${file} declares no global attribute ${local}`);
    }

    const type = yield* declaredType(schema.value, declaration.value);

    return {
      domain: yield* valueDomainOf(schema.value, type, `attribute ${name}`),
      name,
      type,
    };
  });

/**
 * Read a global attribute of the XML namespace as `w3/xml.xsd` declares it.
 *
 * @param world - The version's schemas, `xml.xsd` among them.
 * @param name - The handle, such as `xml:lang`.
 * @returns Its value type and domain, or an {@link XsdReadingError} for a name `xml.xsd` does not
 *   declare.
 */
export const globalAttributeOf = (
  world: World,
  name: string,
): Result.Result<GlobalAttributeDeclaration, DomainError> =>
  globalAttributeIn(
    Option.map(Option.fromNullishOr(world.get(xmlNamespace)), ({ schema }) => schema),
    "xml.xsd",
    xmlPrefix,
    name,
  );

/**
 * The four attributes XML Schema declares in its instance namespace, which no pinned file states:
 * XML Schema 1.0 Part 1, 3.2.7, declares them for every schema processor, `xsi:type` a QName,
 * `xsi:nil` a boolean, `xsi:schemaLocation` a list of URIs and `xsi:noNamespaceSchemaLocation` a
 * URI.
 */
const instanceAttributes: readonly (readonly [string, ValueType])[] = [
  [
    "xsi:schemaLocation",
    {
      inline: Option.some({ _tag: "list", item: { _tag: "named", name: "xs:anyURI" } }),
      type: "list",
      whiteSpace: "collapse",
    },
  ],
  ["xsi:type", { inline: Option.none(), type: "xs:QName", whiteSpace: "collapse" }],
  ["xsi:nil", { inline: Option.none(), type: "xs:boolean", whiteSpace: "collapse" }],
  [
    "xsi:noNamespaceSchemaLocation",
    { inline: Option.none(), type: "xs:anyURI", whiteSpace: "collapse" },
  ],
];

/**
 * The value type and domain an open name is read under: `xs:anySimpleType`, preserved.
 */
const openType: ValueType = {
  inline: Option.none(),
  type: "xs:anySimpleType",
  whiteSpace: "preserve",
};

/**
 * Read the global attributes a kind may carry under their closed handles, and the open names'
 * type: `xml.xsd`'s four as it declares them, XML Schema's instance attributes, XLink's ten as
 * `xlink.xsd` declares them, and `xs:anySimpleType`.
 *
 * @returns The global attributes, `xml:` first, then `xsi:`, then `xlink:`, and the open type's
 *   declaration under the name `xs:anySimpleType`.
 */
export const loadGlobalAttributes = Effect.fn("vocab.loadGlobalAttributes")(
  function* loadGlobalAttributes() {
    const { world } = yield* loadWorld("3.0.1");
    const xml = Option.fromNullishOr(world.get(xmlNamespace));
    const xlink = yield* loadSchema(xlinkSource);

    if (Option.isNone(xml)) {
      return yield* new XsdReadingError({ detail: "no version reads w3/xml.xsd" });
    }

    if (xlink.targetNamespace !== xlinkNamespace) {
      return yield* new XsdReadingError({
        detail: `${xlinkSource} declares the namespace ${xlink.targetNamespace}, not XLink's`,
      });
    }

    const globals: GlobalAttributeDeclaration[] = [];

    for (const local of xml.value.schema.attributes.keys()) {
      globals.push(yield* Effect.fromResult(globalAttributeOf(world, `${xmlPrefix}${local}`)));
    }

    for (const [name, type] of instanceAttributes) {
      globals.push({
        domain: yield* Effect.fromResult(
          valueDomainOf(xml.value.schema, type, `attribute ${name}`),
        ),
        name,
        type,
      });
    }

    for (const local of xlink.attributes.keys()) {
      globals.push(
        yield* Effect.fromResult(
          globalAttributeIn(Option.some(xlink), xlinkSource, xlinkPrefix, `${xlinkPrefix}${local}`),
        ),
      );
    }

    return {
      globals,
      open: {
        domain: yield* Effect.fromResult(
          valueDomainOf(xml.value.schema, openType, "an open attribute name"),
        ),
        name: "xs:anySimpleType",
        type: openType,
      } satisfies GlobalAttributeDeclaration,
    };
  },
);

/**
 * Read what a complex type declares about the elements it governs: its attributes, its base
 * types' first, each name once, its complete attribute wildcard, and its simple content's type.
 *
 * @param world - The version's schemas.
 * @param view - The schema the type is in.
 * @param owner - What the type is read for, a kind's handle or a type's, which a refusal names it
 *   by.
 * @param spec - The kind's handle and element, and the name the entry records for its type.
 * @param definition - The `xs:complexType` element, named or anonymous.
 * @returns The reading, or a {@link DomainError}.
 */
const complexReadingOf = (
  world: World,
  view: SchemaView,
  owner: string,
  spec: KindSpec,
  definition: Element,
): Result.Result<KindReading, DomainError> =>
  Result.gen(function* complexReadingOfBody() {
    const entry = yield* entryOfType(view.schema, spec, definition);
    const wildcard = yield* attributeWildcardOf(view.schema, definition);
    const attributes: (AttributeRow & { readonly domain: Domain; readonly source: Source })[] = [];

    for (const row of lastOfEach(entry.attributes)) {
      const source = yield* view.sourceOf(row.declaration);

      if (row.name.startsWith(xmlPrefix)) {
        const global = yield* globalAttributeOf(world, row.name);

        attributes.push({ ...row, ...global.type, domain: global.domain, source });
      } else {
        attributes.push({
          ...row,
          domain: yield* valueDomainOf(view.schema, row, `attribute ${row.name} of ${owner}`),
          source,
        });
      }
    }

    const text: Option.Option<ValueType> =
      entry.content._tag === "text"
        ? Option.some({
            inline: entry.content.inline,
            type: entry.content.type,
            whiteSpace: entry.content.whiteSpace,
          })
        : Option.none();

    return {
      attributes,
      text: Option.isSome(text)
        ? Option.some({
            domain: yield* valueDomainOf(view.schema, text.value, `the text of ${owner}`),
            type: text.value,
          })
        : Option.none(),
      wildcard,
    };
  });

/**
 * Read what one declaration declares about its kind.
 *
 * An attribute a type references into the XML namespace (`xml:lang`) is read as `xml.xsd` declares
 * it ({@link globalAttributeOf}), never as the referencing schema would spell it.
 *
 * @param world - The version's schemas.
 * @param view - The schema the declaration is in.
 * @param kind - The kind's handle.
 * @param declared - The declaration.
 * @returns The reading, or a {@link DomainError}: an {@link XsdReadingError}, or an invalid
 *   type's length facets.
 */
const readingOf = (
  world: World,
  view: SchemaView,
  kind: string,
  declared: Declaration,
): Result.Result<KindReading, DomainError> =>
  Result.gen(function* readingOfBody() {
    const { type } = declared;

    if (type._tag === "anyType") {
      return { attributes: [], text: Option.none(), wildcard: Option.some(anyTypeWildcard) };
    }

    if (type._tag === "simple") {
      const anonymous = firstXs(declared.declaration, "simpleType");
      const text = yield* Option.match(anonymous, {
        onNone: () =>
          valueTypeOf(view.schema, {
            _tag: "Named",
            lexical: Option.getOrElse(attributeOf(declared.declaration, "type"), () => ""),
          }),
        onSome: (definition) => valueTypeOf(view.schema, { _tag: "Anonymous", definition }),
      });

      return {
        attributes: [],
        text: Option.some({
          domain: yield* valueDomainOf(view.schema, text, `the text of ${kind}`),
          type: text,
        }),
        wildcard: Option.none(),
      };
    }

    return yield* complexReadingOf(
      world,
      view,
      kind,
      { element: declared.local, handle: kind, type: type.name },
      type.definition,
    );
  });

/**
 * What one version's XSDs declare: each kind's reading, by kind in first-declaration order, the
 * kinds declared globally, each roster's kinds by namespace, and the named types an `xsi:type` may
 * give an element ({@link GoverningReading}).
 */
interface VersionReading {
  readonly globals: ReadonlySet<string>;
  readonly kinds: ReadonlyMap<string, KindReading>;
  readonly rosters: ReadonlyMap<string, ReadonlyMap<string, string>>;
  readonly types: GoverningReading;
}

/**
 * Read one version's declarations.
 *
 * @param world - The version's schemas.
 * @param documents - Every document of the version's schemas, each with its schema.
 * @returns The reading, or a {@link DomainError}.
 */
const versionReadingOf = (
  world: World,
  documents: readonly (readonly [SchemaView, { readonly root: Element }])[],
): Result.Result<Omit<VersionReading, "types">, DomainError> =>
  Result.gen(function* versionReadingOfBody() {
    const kinds = new Map<string, KindReading>();
    const globals = new Set<string>();
    const rosters = new Map<string, Map<string, string>>();

    for (const [view, document] of documents) {
      for (const declared of yield* declarationsIn(view, document.root)) {
        const kind = yield* handleOf(declared.namespace, declared.local, typeNameOf(declared.type));
        const reading = yield* readingOf(world, view, kind, declared);
        const known = kinds.get(kind);

        if (known === undefined) {
          kinds.set(kind, reading);
        } else if (
          !Equal.equals(
            known.attributes.map((row) => row.name),
            reading.attributes.map((row) => row.name),
          )
        ) {
          return yield* refuse(`the declarations of ${kind} declare different attributes`);
        }

        if (declared.global) {
          globals.add(kind);
        }

        const roster = rosters.get(declared.namespace) ?? new Map<string, string>();

        roster.set(kind, declared.local);
        rosters.set(declared.namespace, roster);
      }
    }

    return { globals, kinds, rosters };
  });

/**
 * What one version's XSDs declare about the named types an `xsi:type` may give an element, by each
 * type's `TypeName` handle (`typeHandle` of `#pantry/grammar/xsi.ts`):
 *
 * - `governors`: each named complex type validly derived from a named type some element is declared
 *   with, other than that type itself (`derivationsOf`). An `xsi:type` on such an element may name
 *   it, and it then governs the element in place of its declared type (XML Schema 1.0 Part 1,
 *   §3.3.4, Element Locally Valid (Element), clauses 4.3 and 5.2.1; spec reading 84), so its
 *   attributes, attribute wildcard and simple content are read as a kind's are.
 * - `simple`: the text of every named simple type of the version's schemas and of every built-in but
 *   `xs:anyType`. An `xsi:type` on a foreign element may name any of them, which then governs its
 *   text (§3.3.4, Element Locally Valid (Type), clause 3.1.3; spec reading 60), and one on a
 *   simple-content element may name one derived from its declared type (reading 84).
 */
interface GoverningReading {
  readonly governors: ReadonlyMap<string, KindReading>;
  readonly simple: ReadonlyMap<string, { readonly domain: Domain; readonly type: ValueType }>;
}

/**
 * Read one version's governing types.
 *
 * @param world - The version's schemas.
 * @param documents - Every document of those schemas, each with its schema.
 * @returns The reading, or a {@link DomainError}.
 */
const governingReadingOf = (
  world: World,
  documents: readonly (readonly [SchemaView, XmlDocument])[],
): Result.Result<GoverningReading, DomainError> =>
  Result.gen(function* governingReadingOfBody() {
    const derivations = yield* derivationsOf(world, documents);
    // `derivationsOf` reads a type by its expanded name, `{namespace}local`.
    const declared = new Set<string>();

    for (const [view, document] of documents) {
      for (const { type } of yield* declarationsIn(view, document.root)) {
        if (type._tag !== "anyType") {
          for (const { local, namespace } of Option.toArray(type.named)) {
            declared.add(`{${namespace}}${local}`);
          }
        }
      }
    }

    const governors = new Map<string, KindReading>();

    for (const expanded of declared) {
      for (const name of derivations.get(expanded)?.derived.slice(1) ?? []) {
        const owner = typeHandle(name);
        const view = world.get(name.namespace);
        const definition = Option.flatMap(Option.fromNullishOr(view), (held) =>
          Option.fromNullishOr(
            held.schema.complexTypes.get(
              held.redefined.has(name.local) ? redefinitionKey(name.local) : name.local,
            ),
          ),
        );

        if (view !== undefined && Option.isSome(definition) && !governors.has(owner)) {
          governors.set(
            owner,
            yield* complexReadingOf(
              world,
              view,
              owner,
              { element: name.local, handle: owner, type: name.local },
              definition.value,
            ),
          );
        }
      }
    }

    const simple = new Map<string, { readonly domain: Domain; readonly type: ValueType }>();
    const views = [...new Set(world.values())];
    const xsPrefixed = Arr.findFirst(views, ({ schema }) =>
      Arr.findFirst([...schema.namespaces], ([, namespace]) => namespace === xsNamespace).pipe(
        Option.map(([prefix]) => [schema, prefix] as const),
      ),
    );

    if (Option.isNone(xsPrefixed)) {
      return yield* refuse("no schema of the version binds a prefix to XML Schema's namespace");
    }

    const [xsSchema, xsPrefix] = xsPrefixed.value;
    const read = (schema: XsdSchema, lexical: string, owner: string) =>
      Result.gen(function* readSimple() {
        const type = yield* valueTypeOf(schema, { _tag: "Named", lexical });

        simple.set(owner, {
          domain: yield* valueDomainOf(schema, type, `the simple type ${owner}`),
          type,
        });
      });

    for (const local of builtinBases.keys()) {
      if (local !== "anyType") {
        yield* read(
          xsSchema,
          `${xsPrefix}:${local}`,
          typeHandle({ local, namespace: xsNamespace }),
        );
      }
    }

    for (const { schema } of views) {
      for (const local of schema.simpleTypes.keys()) {
        if (!local.endsWith(redefinitionKey(""))) {
          yield* read(
            schema,
            qualify(schema, local),
            typeHandle({ local, namespace: schema.targetNamespace }),
          );
        }
      }
    }

    return { governors, simple };
  });

/**
 * Read every version's declarations.
 *
 * @returns Each version's reading, in roster order.
 */
export const loadDeclarations = Effect.fn("vocab.loadDeclarations")(function* loadDeclarations() {
  const readings: (readonly [SchemaVersion, VersionReading])[] = [];

  for (const version of schemaVersions) {
    const { documents, world } = yield* loadWorld(version);

    readings.push([
      version,
      {
        ...(yield* Effect.fromResult(versionReadingOf(world, documents))),
        types: yield* Effect.fromResult(governingReadingOf(world, documents)),
      },
    ]);
  }

  return readings;
});

/**
 * State rows once for the versions that agree on them.
 *
 * @param readings - Each version's rows of one fact, by a key no two rows of a version share.
 * @returns Each distinct row with the versions it holds in, in first-seen order.
 */
const merged = <A>(
  readings: readonly (readonly [SchemaVersion, ReadonlyMap<string, A>])[],
): readonly {
  readonly row: A;
  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];
}[] => {
  const held = new Map<string, { row: A; versions: SchemaVersion[] }[]>();

  for (const [version, rows] of readings) {
    for (const [key, row] of rows) {
      const known = held.get(key) ?? [];
      const same = known.find((other) => Equal.equals(other.row, row));

      if (same === undefined) {
        held.set(key, [...known, { row, versions: [version] }]);
      } else {
        same.versions.push(version);
      }
    }
  }

  return [...held.values()].flat().flatMap(({ row, versions }) => {
    const [first, ...rest] = versions;

    return first === undefined ? [] : [{ row, versions: [first, ...rest] as const }];
  });
};

/**
 * State rows once for the versions that agree on them, whatever lines each version states them on,
 * with each version's source aligned with the versions.
 *
 * @param readings - Each version's rows of one fact with their sources, by a key no two rows of a
 *   version share.
 * @returns Each distinct row with the versions it holds in and their sources, in first-seen order.
 */
const mergedWithSources = <A>(
  readings: readonly (readonly [SchemaVersion, ReadonlyMap<string, readonly [A, Source]>])[],
): readonly {
  readonly row: A;
  readonly sources: Sources;
  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];
}[] => {
  const held = new Map<string, { row: A; sources: Source[]; versions: SchemaVersion[] }[]>();

  for (const [version, rows] of readings) {
    for (const [key, [row, source]] of rows) {
      const known = held.get(key) ?? [];
      const same = known.find((other) => Equal.equals(other.row, row));

      if (same === undefined) {
        held.set(key, [...known, { row, sources: [source], versions: [version] }]);
      } else {
        same.sources.push(source);
        same.versions.push(version);
      }
    }
  }

  return [...held.values()].flat().flatMap(({ row, sources, versions }) => {
    const [first, ...rest] = versions;
    const [firstSource, ...restSources] = sources;

    return first === undefined || firstSource === undefined
      ? []
      : [
          {
            row,
            sources: [firstSource, ...restSources] as const,
            versions: [first, ...rest] as const,
          },
        ];
  });
};

/**
 * The rosters, one per vocabulary, in `namespaces.ts`'s order: each namespace's kinds in the order
 * the versions first declare them, the earlier version's first, and the attribute handles those
 * kinds declare, in the order they first declare them.
 *
 * @param readings - Each version's reading.
 * @returns The rosters.
 */
export const rostersOf = (
  readings: readonly (readonly [SchemaVersion, VersionReading])[],
): readonly VocabularyRoster[] =>
  Object.entries(vocabularyNamespaces).map(([name, { namespace }]) => {
    const kinds = new Map<string, string>();

    for (const [, { rosters }] of readings) {
      for (const [handle, local] of rosters.get(namespace) ?? []) {
        if (!kinds.has(handle)) {
          kinds.set(handle, local);
        }
      }
    }

    const attributes = Arr.dedupe(
      [...kinds.keys()].flatMap((handle) =>
        readings.flatMap(([, reading]) =>
          (reading.kinds.get(handle)?.attributes ?? []).map((row) => row.name),
        ),
      ),
    );

    return {
      attributes,
      kinds: [...kinds].map(([handle, local]) => ({ handle, local })),
      name,
      namespace,
    };
  });

/**
 * The kinds declared globally, each once for the versions it holds in, in roster order.
 *
 * @param readings - Each version's reading.
 * @returns The rows.
 */
export const globalKindsOf = (
  readings: readonly (readonly [SchemaVersion, VersionReading])[],
): readonly GlobalKind[] =>
  merged(
    readings.map(([version, { globals }]) => [
      version,
      new Map([...globals].map((kind) => [kind, kind] as const)),
    ]),
  ).map(({ row, versions }) => ({ kind: row, versions }));

/**
 * The attribute declarations, each (kind, name) once for the versions that agree on it.
 *
 * @param readings - Each version's reading.
 * @returns The rows, in first-declaration order.
 */
export const attributeDeclarationsOf = (
  readings: readonly (readonly [SchemaVersion, Pick<VersionReading, "kinds">])[],
): readonly AttributeDeclaration[] =>
  mergedWithSources(
    readings.map(([version, { kinds }]) => [
      version,
      new Map(
        [...kinds].flatMap(([kind, { attributes }]) =>
          attributes.map(
            (row) =>
              [
                `${kind} ${row.name}`,
                [
                  {
                    default: row.default,
                    domain: row.domain,
                    kind,
                    name: row.name,
                    type: { inline: row.inline, type: row.type, whiteSpace: row.whiteSpace },
                    use: row.use,
                  },
                  row.source,
                ] as const,
              ] as const,
          ),
        ),
      ),
    ]),
  ).map(({ row, sources, versions }) => ({ ...row, sources, versions }));

/**
 * The attribute wildcards, each kind's once for the versions that agree on it.
 *
 * @param readings - Each version's reading.
 * @returns The rows, in first-declaration order.
 */
export const attributeWildcardsOf = (
  readings: readonly (readonly [SchemaVersion, Pick<VersionReading, "kinds">])[],
): readonly AttributeWildcard[] =>
  merged(
    readings.map(([version, { kinds }]) => [
      version,
      new Map(
        [...kinds].flatMap(([kind, { wildcard }]) =>
          Option.toArray(wildcard).map((held) => [kind, { kind, ...held }] as const),
        ),
      ),
    ]),
  ).map(({ row, versions }) => ({ ...row, versions }));

/**
 * The text types, each kind's once for the versions that agree on it.
 *
 * @param readings - Each version's reading.
 * @returns The rows, in first-declaration order.
 */
export const textTypesOf = (
  readings: readonly (readonly [SchemaVersion, VersionReading])[],
): readonly TextType[] =>
  merged(
    readings.map(([version, { kinds }]) => [
      version,
      new Map(
        [...kinds].flatMap(([kind, { text }]) =>
          Option.toArray(text).map(({ domain, type }) => [kind, { domain, kind, type }] as const),
        ),
      ),
    ]),
  ).map(({ row, versions }) => ({ ...row, versions }));

/**
 * The governing types' rows, each type's once for the versions that agree on it: the attribute
 * declarations and the attribute wildcard of each complex type that may govern an element in place
 * of its declared type, and the text of each named simple type and of each such complex type with
 * simple content.
 */
export interface GoverningRows {
  readonly declarations: readonly TypeAttributeDeclaration[];
  readonly texts: readonly TypeText[];
  readonly wildcards: readonly TypeAttributeWildcard[];
}

/**
 * State the governing types' rows, each type's once for the versions that agree on it.
 *
 * @param readings - Each version's reading.
 * @returns The rows, the declarations and wildcards in the order the types are first read, the
 *   texts each version's simple types first, then its governors'.
 */
export const governingRowsOf = (
  readings: readonly (readonly [SchemaVersion, VersionReading])[],
): GoverningRows => {
  const governors = readings.map(
    ([version, { types }]) => [version, { kinds: types.governors }] as const,
  );

  return {
    declarations: attributeDeclarationsOf(governors).map(({ kind, ...row }) => ({
      ...row,
      owner: kind,
    })),
    texts: merged(
      readings.map(([version, { types }]) => [
        version,
        new Map(
          [
            ...types.simple,
            ...[...types.governors].flatMap(([owner, { text }]) =>
              Option.toArray(text).map((held) => [owner, held] as const),
            ),
          ].map(([owner, { domain, type }]) => [owner, { domain, owner, type }] as const),
        ),
      ]),
    ).map(({ row, versions }) => ({ ...row, versions })),
    wildcards: attributeWildcardsOf(governors).map(({ kind, ...row }) => ({
      ...row,
      owner: kind,
    })),
  };
};

/**
 * The lines of a JSDoc comment; `vp fmt` wraps them.
 *
 * @param paragraphs - Each paragraph as its lines.
 * @returns The comment, from its opening line to its closing one.
 */
const commentOf = (paragraphs: readonly (readonly string[])[]): readonly string[] => [
  "/**",
  ...paragraphs.flatMap((lines, index) => [
    ...(index === 0 ? [] : [" *"]),
    ...lines.map((line) => ` * ${line}`),
  ]),
  " */",
];

/**
 * Write the versions a row holds in: `everyVersion` for both, else the list.
 *
 * @param versions - The versions.
 * @returns The expression.
 */
const versionsExpression = (versions: readonly SchemaVersion[]): string =>
  versions.length === schemaVersions.length ? "everyVersion" : JSON.stringify(versions);

/**
 * The lines that state `everyVersion`.
 */
const everyVersionLines: readonly string[] = [
  ...commentOf([["Both schema versions."]]),
  'const everyVersion = ["3.0.0", "3.0.1"] as const;',
  "",
];

/**
 * Write the vocabularies leaf, unformatted.
 *
 * @param rosters - The rosters, in composition order.
 * @param globals - The kinds declared globally.
 * @returns The module text, without a final line break.
 */
export const renderVocabularies = (
  rosters: readonly VocabularyRoster[],
  globals: readonly GlobalKind[],
): string =>
  [
    ...commentOf([
      [
        `The vocabularies the pinned XSDs declare, one per namespace, ${rosters.length} rosters of ${rosters.reduce((sum, { kinds }) => sum + kinds.length, 0)} kinds, and the ${globals.length} kinds a schema declares globally.`,
      ],
      [
        "Generated by `node src/vocab/derive/declarations.ts vocabularies` and formatted with `vp fmt`; `src/vocab/derive/declarations.test.ts` checks that a re-run reproduces this file byte for byte. A roster lists its kinds in the order its XSDs first declare them, the 3.0 XSDs' first, which is their append-only code order.",
      ],
    ]),
    'import type { SchemaVersion } from "#pantry/grammar/kinds.ts";',
    'import type { GlobalKind, RosterKind, VocabularyRoster } from "#pantry/vocab/inventory/types.ts";',
    "",
    ...everyVersionLines,
    ...commentOf([
      ["One kind of a roster."],
      [
        "@param handle - Its handle.",
        "@param local - Its element's local name.",
        "@returns The kind.",
      ],
    ]),
    "const kind = <const Handle extends string>(",
    "  handle: Handle,",
    "  local: string,",
    "): RosterKind & { readonly handle: Handle } => ({ handle, local });",
    "",
    ...commentOf([
      ["One kind declared globally."],
      [
        "@param handle - The kind.",
        "@param versions - The versions it is declared in.",
        "@returns The row.",
      ],
    ]),
    "const global = (",
    "  handle: string,",
    "  versions: readonly [SchemaVersion, ...SchemaVersion[]],",
    "): GlobalKind => ({ kind: handle, versions });",
    "",
    ...commentOf([["Every vocabulary's roster, in composition order."]]),
    "export const vocabularies = [",
    ...rosters.flatMap(({ attributes, kinds, name, namespace }) => [
      "  {",
      "    attributes: [",
      ...attributes.map((attribute) => `      ${JSON.stringify(attribute)},`),
      "    ],",
      "    kinds: [",
      ...kinds.map(
        ({ handle, local }) => `      kind(${JSON.stringify(handle)}, ${JSON.stringify(local)}),`,
      ),
      "    ],",
      `    name: ${JSON.stringify(name)},`,
      `    namespace: ${JSON.stringify(namespace)},`,
      "  },",
    ]),
    "] as const satisfies readonly VocabularyRoster[];",
    "",
    ...commentOf([
      [
        "The kinds a schema declares globally, which a `lax` or `strict` element wildcard reads an element as.",
      ],
    ]),
    "export const globalKinds: readonly GlobalKind[] = [",
    ...globals.map(
      ({ kind, versions }) => `  global(${JSON.stringify(kind)}, ${versionsExpression(versions)}),`,
    ),
    "];",
  ].join("\n");

/**
 * Write a type reading as the attributes leaf builds it.
 *
 * @param type - The type reading.
 * @returns The expression.
 */
const typeReadingExpression = (type: TypeReading): string =>
  Match.valueTags(type, {
    list: ({ item }) => `list(${typeReadingExpression(item)})`,
    named: ({ name }) => `ref(${JSON.stringify(name)})`,
    restriction: ({ base, facets }) =>
      `restriction(${[
        typeReadingExpression(base),
        ...facets.map(({ facet, value }) => `[${JSON.stringify(facet)}, ${JSON.stringify(value)}]`),
      ].join(", ")})`,
    union: ({ members }) => `union(${members.map(typeReadingExpression).join(", ")})`,
  });

/**
 * The type readings an anonymous type nests, its own tag included.
 *
 * @param type - The type reading.
 * @returns The tags of every reading in it.
 */
const tagsIn = (type: TypeReading): readonly TypeReading["_tag"][] => {
  const nested: readonly TypeReading[] = Match.valueTags(type, {
    list: ({ item }) => [item],
    named: () => [],
    restriction: ({ base }) => [base],
    union: ({ members }) => members,
  });

  return [type._tag, ...nested.flatMap(tagsIn)];
};

/**
 * Write an identifier stem: `aria-current` is `ariaCurrent`, `xs:string` is `xsString`.
 *
 * @param name - A name.
 * @returns The stem.
 */
const camelOf = (name: string): string =>
  name
    .split(/[^A-Za-z0-9]+/u)
    .filter((part) => part !== "")
    .map((part, index) =>
      index === 0
        ? `${part.charAt(0).toLowerCase()}${part.slice(1)}`
        : `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
    )
    .join("");

/**
 * The type builders the attributes leaf may call, in the order it defines them, with their lines.
 */
const typeBuilders = {
  inlineType: [
    ...commentOf([
      ["An anonymous simple type."],
      [
        "@param type - Its designator.",
        "@param whiteSpace - Its class.",
        "@param definition - Its definition.",
        "@returns The value type.",
      ],
    ]),
    "const inlineType = (",
    "  type: string,",
    '  whiteSpace: ValueType["whiteSpace"],',
    "  definition: InlineType,",
    "): ValueType => ({ inline: Option.some(definition), type, whiteSpace });",
  ],
  list: [
    ...commentOf([
      ["An anonymous list type."],
      ["@param item - Its item type.", "@returns The definition."],
    ]),
    'const list = (item: TypeReading): InlineType => ({ _tag: "list", item });',
  ],
  named: [
    ...commentOf([
      ["A named simple type."],
      [
        "@param type - Its QName, a built-in spelled `xs:`.",
        "@param whiteSpace - Its class.",
        "@returns The value type.",
      ],
    ]),
    'const named = (type: string, whiteSpace: ValueType["whiteSpace"]): ValueType => ({',
    "  inline: Option.none(),",
    "  type,",
    "  whiteSpace,",
    "});",
  ],
  ref: [
    ...commentOf([
      ["A reference to a named simple type."],
      ["@param name - Its QName.", "@returns The reading."],
    ]),
    'const ref = (name: string): TypeReading => ({ _tag: "named", name });',
  ],
  restriction: [
    ...commentOf([
      ["An anonymous restriction."],
      [
        "@param base - The restricted type.",
        "@param facets - Its facets, each as its name and value.",
        "@returns The definition.",
      ],
    ]),
    "const restriction = (",
    "  base: TypeReading,",
    "  ...facets: readonly (readonly [FacetName, string])[]",
    "): InlineType => ({",
    '  _tag: "restriction",',
    "  base,",
    "  facets: facets.map(([facet, value]) => ({ facet, value })),",
    "});",
  ],
  union: [
    ...commentOf([
      ["An anonymous union."],
      ["@param members - Its member types.", "@returns The definition."],
    ]),
    "const union = (...members: readonly TypeReading[]): InlineType => ({",
    '  _tag: "union",',
    "  members,",
    "});",
  ],
} as const;

/**
 * The type builders' names, in the order the leaf defines them.
 */
const typeBuilderNames: readonly (keyof typeof typeBuilders)[] = [
  "inlineType",
  "list",
  "named",
  "ref",
  "restriction",
  "union",
];

/**
 * Write facets as the attributes leaf's domain builders take them: each as its name and value.
 *
 * @param facets - The facets.
 * @returns The expression.
 */
const facetsExpression = (facets: readonly Facet[]): string =>
  `[${facets.map(({ facet, value }) => `[${JSON.stringify(facet)}, ${JSON.stringify(value)}]`).join(", ")}]`;

/**
 * Write the attributes leaf, unformatted.
 *
 * The module states each distinct value type once as a constant, then each kind's attribute list,
 * one constant per list that more than one kind declares, then the rows.
 *
 * @param declarations - The attribute declarations.
 * @param wildcards - The attribute wildcards.
 * @param texts - The text types.
 * @param globals - The global attributes every schema processor knows, and the open names' type.
 * @param governing - The governing types' rows ({@link governingRowsOf}), stated after every
 *   kind's.
 * @returns The module text, without a final line break.
 */
export const renderAttributes = (
  declarations: readonly AttributeDeclaration[],
  wildcards: readonly AttributeWildcard[],
  texts: readonly TextType[],
  globals: {
    readonly globals: readonly GlobalAttributeDeclaration[];
    readonly open: GlobalAttributeDeclaration;
  },
  governing: GoverningRows,
): string => {
  const typeNames = new Map<string, string>();
  const taken = new Set<string>();
  const typeLines: string[] = [];
  const builders = new Set<keyof typeof typeBuilders>();
  const typeOf = (type: ValueType, stem: string): string => {
    const key = JSON.stringify(type);
    const known = typeNames.get(key);

    if (known !== undefined) {
      return known;
    }

    let name = `${camelOf(stem)}Type`;

    for (let suffix = 2; taken.has(name); suffix += 1) {
      name = `${camelOf(stem)}Type${suffix}`;
    }

    taken.add(name);
    typeNames.set(key, name);

    const written = Option.match(type.inline, {
      onNone: () => {
        builders.add("named");

        return `named(${JSON.stringify(type.type)}, ${JSON.stringify(type.whiteSpace)})`;
      },
      onSome: (definition) => {
        builders.add("inlineType");

        for (const tag of tagsIn(definition)) {
          builders.add(tag === "named" ? "ref" : tag);
        }

        return `inlineType(${JSON.stringify(type.type)}, ${JSON.stringify(type.whiteSpace)}, ${typeReadingExpression(definition)})`;
      },
    });

    typeLines.push(`const ${name} = ${written};`, "");

    return name;
  };
  const writer = sourcesWriter();
  const domainNames = new Map<string, string>();
  const domainLines: string[] = [];
  // A list's item and a union's members are domains of their own, named like any other, so a
  // domain the leaf states twice, as `xs:anyURI`'s is as an attribute's and as `xsi:schemaLocation`'s
  // item, is written once.
  const domainOfRow = (domain: Domain, stem: string): string => {
    const key = JSON.stringify(domain);
    const known = domainNames.get(key);

    if (known !== undefined) {
      return known;
    }

    const written = Match.valueTags(domain, {
      atomic: ({ builtin, facets, patterns, primitive }) =>
        `atomic(${JSON.stringify(primitive)}, ${JSON.stringify(builtin)}, ${facetsExpression(facets)}, ${JSON.stringify(patterns)})`,
      list: ({ facets, item, patterns }) =>
        `listOf(${domainOfRow(item, `${stem} item`)}, ${facetsExpression(facets)}, ${JSON.stringify(patterns)})`,
      union: ({ facets, members, patterns }) =>
        `unionOf([${members.map((member, at) => domainOfRow(member, `${stem} member ${at + 1}`)).join(", ")}], ${facetsExpression(facets)}, ${JSON.stringify(patterns)})`,
    });
    let name = `${camelOf(stem)}Domain`;

    for (let suffix = 2; taken.has(name); suffix += 1) {
      name = `${camelOf(stem)}Domain${suffix}`;
    }

    taken.add(name);
    domainNames.set(key, name);
    domainLines.push(`const ${name} = ${written};`, "");

    return name;
  };
  const groups = new Map<
    string,
    { kind: string; rows: string[]; versions: readonly SchemaVersion[] }
  >();

  const writtenOf = (row: Omit<AttributeDeclaration, "kind">): string => {
    const stem = Option.isSome(row.type.inline) ? row.name : row.type.type;
    const type = typeOf(row.type, stem);
    const domain = domainOfRow(row.domain, stem);
    const sources = writer.expression(row.sources);

    return Option.match(row.default, {
      onNone: () =>
        `attribute(${JSON.stringify(row.name)}, ${JSON.stringify(row.use)}, ${type}, ${domain}, ${sources})`,
      onSome: (value) =>
        `defaulted(${JSON.stringify(row.name)}, ${JSON.stringify(row.use)}, ${type}, ${domain}, ${sources}, ${JSON.stringify(value)})`,
    });
  };

  for (const row of declarations) {
    const key = `${row.kind} ${row.versions.join(" ")}`;
    const written = writtenOf(row);
    const group = groups.get(key) ?? { kind: row.kind, rows: [], versions: row.versions };

    group.rows.push(written);
    groups.set(key, group);
  }

  const listUses = new Map<string, number>();

  for (const { rows } of groups.values()) {
    const key = rows.join("\n");

    listUses.set(key, (listUses.get(key) ?? 0) + 1);
  }

  const listNames = new Map<string, string>();
  const listLines: string[] = [];
  const declares = [...groups.values()].map(({ kind, rows, versions }) => {
    const key = rows.join("\n");
    const shared = (listUses.get(key) ?? 0) > 1;
    let list = listNames.get(key);

    if (shared && list === undefined) {
      const stem = `${camelOf(kind)}Attributes`;

      list = stem;
      for (let suffix = 2; taken.has(list); suffix += 1) {
        list = `${stem}${suffix}`;
      }

      taken.add(list);
      listNames.set(key, list);
      listLines.push(
        ...commentOf([[`The attributes \`${kind}\` declares, which other kinds declare alike.`]]),
        `const ${list} = [`,
        ...rows.map((row) => `  ${row},`),
        "] as const;",
        "",
      );
    }

    return `  ...declares(${JSON.stringify(kind)}, ${versionsExpression(versions)}, ${list ?? `[${rows.join(", ")}]`}),`;
  });
  const globalRows = globals.globals.map(
    ({ domain, name, type }) =>
      `  global(${JSON.stringify(name)}, ${typeOf(type, name)}, ${domainOfRow(domain, name)}),`,
  );
  const openRow = `export const openAttribute: GlobalAttributeDeclaration = global(${JSON.stringify(globals.open.name)}, ${typeOf(globals.open.type, globals.open.name)}, ${domainOfRow(globals.open.domain, globals.open.name)});`;
  const textRows = texts.map(
    ({ domain, kind, type, versions }) =>
      `  text(${JSON.stringify(kind)}, ${versionsExpression(versions)}, ${typeOf(type, `${kind} text`)}, ${domainOfRow(domain, `${kind} text`)}),`,
  );
  const ownerGroups = new Map<
    string,
    { owner: string; rows: string[]; versions: readonly SchemaVersion[] }
  >();

  for (const row of governing.declarations) {
    const key = `${row.owner} ${row.versions.join(" ")}`;
    const group = ownerGroups.get(key) ?? { owner: row.owner, rows: [], versions: row.versions };

    group.rows.push(writtenOf(row));
    ownerGroups.set(key, group);
  }

  const typeDeclares = [...ownerGroups.values()].map(
    ({ owner, rows, versions }) =>
      `  ...typeDeclares(${JSON.stringify(owner)}, ${versionsExpression(versions)}, ${listNames.get(rows.join("\n")) ?? `[${rows.join(", ")}]`}),`,
  );
  const typeWildcardRows = governing.wildcards.map(
    ({ namespace, owner, processing, versions }) =>
      `  typeWildcard(${JSON.stringify(owner)}, ${versionsExpression(versions)}, ${JSON.stringify(namespace)}, ${JSON.stringify(processing)}),`,
  );
  const typeTextRows = governing.texts.map(
    ({ domain, owner, type, versions }) =>
      `  typeText(${JSON.stringify(owner)}, ${versionsExpression(versions)}, ${typeOf(type, type.type)}, ${domainOfRow(domain, type.type)}),`,
  );
  const imports = Arr.sort(
    Arr.dedupe([
      "AttributeDeclaration",
      "AttributeWildcard",
      "Domain",
      "Facet",
      "GlobalAttributeDeclaration",
      "Primitive",
      "XsdBuiltin",
      "NamespaceConstraint",
      "Processing",
      "Source",
      "Sources",
      "TextType",
      "TypeAttributeDeclaration",
      "TypeAttributeWildcard",
      "TypeText",
      "ValueType",
      ...(builders.has("inlineType") ? ["InlineType", "TypeReading"] : []),
      ...(builders.has("restriction") ? ["FacetName"] : []),
    ]),
    Order.String,
  );

  return [
    ...([...taken].some((name) => /shape/iu.test(name)) ? [attributeNameDirective] : []),
    ...commentOf([
      [
        `The attribute declarations, attribute wildcards and text types the pinned XSDs give every kind: ${declarations.length} declarations, ${wildcards.length} wildcards and ${texts.length} text types, each stated once for the schema versions it holds in.`,
      ],
      [
        `Beside them, the governing types an \`xsi:type\` may give an element (spec readings 60 and 84): ${governing.declarations.length} attribute declarations and ${governing.wildcards.length} wildcards of the complex types that may govern an element in place of its declared type, and the texts of ${governing.texts.length} named types with simple content.`,
      ],
      [
        "Generated by `node src/vocab/derive/declarations.ts attributes` and formatted with `vp fmt`; `src/vocab/derive/declarations.test.ts` checks that a re-run reproduces this file byte for byte.",
      ],
    ]),
    'import { Option } from "effect";',
    "",
    'import type { SchemaVersion } from "#pantry/grammar/kinds.ts";',
    'import type { SourcePath } from "#pantry/vocab/derive/sources.ts";',
    "import type {",
    ...imports.map((name) => `  ${name},`),
    '} from "#pantry/vocab/inventory/types.ts";',
    "",
    ...everyVersionLines,
    ...writer.preamble(),
    ...typeBuilderNames.flatMap((name) => (builders.has(name) ? [...typeBuilders[name], ""] : [])),
    ...typeLines,
    ...commentOf([
      ["An atomic domain."],
      [
        "@param primitive - The primitive it restricts.",
        "@param builtin - The first built-in its derivation meets.",
        "@param facets - The facets in force, each as its name and value.",
        "@param patterns - Its pattern sets, one per derivation step.",
        "@returns The domain.",
      ],
    ]),
    "const atomic = (",
    "  primitive: Primitive,",
    "  builtin: XsdBuiltin,",
    '  facets: readonly (readonly [Facet["facet"], string])[],',
    "  patterns: readonly (readonly string[])[],",
    '): Domain => ({ _tag: "atomic", builtin, facets: facets.map(([facet, value]) => ({ facet, value })), patterns, primitive });',
    "",
    ...commentOf([
      ["A list domain."],
      [
        "@param item - Its item type's domain.",
        "@param facets - The list's facets.",
        "@param patterns - The list's pattern sets.",
        "@returns The domain.",
      ],
    ]),
    "const listOf = (",
    "  item: Domain,",
    '  facets: readonly (readonly [Facet["facet"], string])[],',
    "  patterns: readonly (readonly string[])[],",
    '): Domain => ({ _tag: "list", facets: facets.map(([facet, value]) => ({ facet, value })), item, patterns });',
    "",
    ...commentOf([
      ["A union domain."],
      [
        "@param members - Its members' domains.",
        "@param facets - The union's facets.",
        "@param patterns - The union's pattern sets.",
        "@returns The domain.",
      ],
    ]),
    "const unionOf = (",
    "  members: readonly Domain[],",
    '  facets: readonly (readonly [Facet["facet"], string])[],',
    "  patterns: readonly (readonly string[])[],",
    '): Domain => ({ _tag: "union", facets: facets.map(([facet, value]) => ({ facet, value })), members, patterns });',
    "",
    ...domainLines,
    ...commentOf([
      ["One attribute of a kind's list, with no default."],
      [
        "@param name - Its handle.",
        "@param use - Whether the XSD requires it.",
        "@param type - Its value type.",
        "@param domain - Its value type's domain.",
        "@param sources - Where each version declares it.",
        "@returns The attribute, its kind and versions to come.",
      ],
    ]),
    "const attribute = (",
    "  name: string,",
    '  use: AttributeDeclaration["use"],',
    "  type: ValueType,",
    "  domain: Domain,",
    "  sources: Sources,",
    '): Omit<AttributeDeclaration, "kind" | "versions"> => ({',
    "  default: Option.none(),",
    "  domain,",
    "  name,",
    "  sources,",
    "  type,",
    "  use,",
    "});",
    "",
    ...commentOf([
      ["One attribute of a kind's list, with its XSD default."],
      [
        "@param name - Its handle.",
        "@param use - Whether the XSD requires it.",
        "@param type - Its value type.",
        "@param domain - Its value type's domain.",
        "@param sources - Where each version declares it.",
        "@param value - Its default.",
        "@returns The attribute, its kind and versions to come.",
      ],
    ]),
    "const defaulted = (",
    "  name: string,",
    '  use: AttributeDeclaration["use"],',
    "  type: ValueType,",
    "  domain: Domain,",
    "  sources: Sources,",
    "  value: string,",
    '): Omit<AttributeDeclaration, "kind" | "versions"> => ({',
    "  default: Option.some(value),",
    "  domain,",
    "  name,",
    "  sources,",
    "  type,",
    "  use,",
    "});",
    "",
    ...commentOf([
      ["A kind's declarations in some versions."],
      [
        "@param kind - The kind.",
        "@param versions - The versions.",
        "@param attributes - Its attributes.",
        "@returns The rows.",
      ],
    ]),
    "const declares = (",
    "  kind: string,",
    "  versions: readonly [SchemaVersion, ...SchemaVersion[]],",
    '  attributes: readonly Omit<AttributeDeclaration, "kind" | "versions">[],',
    "): readonly AttributeDeclaration[] => attributes.map((declared) => ({ ...declared, kind, versions }));",
    "",
    ...commentOf([
      ["A global attribute."],
      [
        "@param name - Its handle.",
        "@param type - Its value type.",
        "@param domain - Its value type's domain.",
        "@returns The declaration.",
      ],
    ]),
    "const global = (name: string, type: ValueType, domain: Domain): GlobalAttributeDeclaration => ({",
    "  domain,",
    "  name,",
    "  type,",
    "});",
    "",
    ...commentOf([
      ["A kind's attribute wildcard."],
      [
        "@param kind - The kind.",
        "@param versions - The versions.",
        "@param namespace - Its namespace constraint.",
        "@param processing - Its processing.",
        "@returns The row.",
      ],
    ]),
    "const wildcard = (",
    "  kind: string,",
    "  versions: readonly [SchemaVersion, ...SchemaVersion[]],",
    "  namespace: NamespaceConstraint,",
    "  processing: Processing,",
    "): AttributeWildcard => ({ kind, namespace, processing, versions });",
    "",
    ...commentOf([
      ["A kind's text type."],
      [
        "@param kind - The kind.",
        "@param versions - The versions.",
        "@param type - Its simple type.",
        "@returns The row.",
      ],
    ]),
    "const text = (",
    "  kind: string,",
    "  versions: readonly [SchemaVersion, ...SchemaVersion[]],",
    "  type: ValueType,",
    "  domain: Domain,",
    "): TextType => ({ domain, kind, type, versions });",
    "",
    ...listLines,
    ...commentOf([["Every kind's attribute declarations."]]),
    "export const attributeDeclarations: readonly AttributeDeclaration[] = [",
    ...declares,
    "];",
    "",
    ...commentOf([["Every kind's attribute wildcard."]]),
    "export const attributeWildcards: readonly AttributeWildcard[] = [",
    ...wildcards.map(
      ({ kind, namespace, processing, versions }) =>
        `  wildcard(${JSON.stringify(kind)}, ${versionsExpression(versions)}, ${JSON.stringify(namespace)}, ${JSON.stringify(processing)}),`,
    ),
    "];",
    "",
    ...commentOf([["The simple type of every kind whose content is text alone."]]),
    "export const textTypes: readonly TextType[] = [",
    ...textRows,
    "];",
    "",
    ...commentOf([
      [
        "The global attribute declarations kinds admit under their closed handles: `w3/xml.xsd`'s four, as it declares them; the four of XML Schema's instance namespace, as XML Schema 1.0 Part 1, 3.2.7, declares them; and `xlink/xlink.xsd`'s ten, as it declares them, which the content-packaging extension imports.",
      ],
    ]),
    "export const globalAttributes: readonly GlobalAttributeDeclaration[] = [",
    ...globalRows,
    "];",
    "",
    ...commentOf([
      [
        "The type an open name's value is read under: `xs:anySimpleType`, its whitespace preserved, since no declaration governs it (fin.md, D2).",
      ],
    ]),
    openRow,
    "",
    ...commentOf([
      ["A governing type's declarations in some versions."],
      [
        "@param owner - The type's `TypeName` handle.",
        "@param versions - The versions.",
        "@param attributes - Its attributes.",
        "@returns The rows.",
      ],
    ]),
    "const typeDeclares = (",
    "  owner: string,",
    "  versions: readonly [SchemaVersion, ...SchemaVersion[]],",
    '  attributes: readonly Omit<AttributeDeclaration, "kind" | "versions">[],',
    "): readonly TypeAttributeDeclaration[] => attributes.map((declared) => ({ ...declared, owner, versions }));",
    "",
    ...commentOf([
      ["A governing type's attribute wildcard."],
      [
        "@param owner - The type's `TypeName` handle.",
        "@param versions - The versions.",
        "@param namespace - Its namespace constraint.",
        "@param processing - Its processing.",
        "@returns The row.",
      ],
    ]),
    "const typeWildcard = (",
    "  owner: string,",
    "  versions: readonly [SchemaVersion, ...SchemaVersion[]],",
    "  namespace: NamespaceConstraint,",
    "  processing: Processing,",
    "): TypeAttributeWildcard => ({ namespace, owner, processing, versions });",
    "",
    ...commentOf([
      ["A named type's text type."],
      [
        "@param owner - The type's `TypeName` handle.",
        "@param versions - The versions.",
        "@param type - Its simple type.",
        "@param domain - Its simple type's domain.",
        "@returns The row.",
      ],
    ]),
    "const typeText = (",
    "  owner: string,",
    "  versions: readonly [SchemaVersion, ...SchemaVersion[]],",
    "  type: ValueType,",
    "  domain: Domain,",
    "): TypeText => ({ domain, owner, type, versions });",
    "",
    ...commentOf([
      [
        "The attribute declarations of every complex type an `xsi:type` may name in place of a kind's declared type, which an element it governs carries in place of its declared type's (spec reading 84).",
      ],
    ]),
    "export const typeAttributeDeclarations: readonly TypeAttributeDeclaration[] = [",
    ...typeDeclares,
    "];",
    "",
    ...commentOf([["The attribute wildcard of every such complex type."]]),
    "export const typeAttributeWildcards: readonly TypeAttributeWildcard[] = [",
    ...typeWildcardRows,
    "];",
    "",
    ...commentOf([
      [
        "The text type of every named simple type of the pinned XSDs and every built-in but `xs:anyType`, and of every such complex type with simple content: the text of an element an `xsi:type` gives that type (spec readings 60 and 84).",
      ],
    ]),
    "export const typeTexts: readonly TypeText[] = [",
    ...typeTextRows,
    "];",
  ].join("\n");
};

/**
 * The targets the deriver prints.
 */
const targetNames = ["vocabularies", "attributes"] as const;

/**
 * The command line: `declarations <target>` prints one leaf to standard output.
 */
const command = Command.make(
  "declarations",
  { target: Argument.Literals("target", targetNames) },
  Effect.fn("vocab.deriveDeclarationsCommand")(function* deriveDeclarationsCommand({ target }) {
    const readings = yield* loadDeclarations();

    yield* Console.log(
      target === "vocabularies"
        ? renderVocabularies(rostersOf(readings), globalKindsOf(readings))
        : renderAttributes(
            attributeDeclarationsOf(readings),
            attributeWildcardsOf(readings),
            textTypesOf(readings),
            yield* loadGlobalAttributes(),
            governingRowsOf(readings),
          ),
    );
  }),
).pipe(
  Command.withDescription(
    "Print a declarations leaf, read from the pinned XSDs in ~/.cache/gr8des/qti3/xsd.",
  ),
);

if (import.meta.main) {
  NodeRuntime.runMain(
    Command.run(command, { version: "0.0.0" }).pipe(
      Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto)),
    ),
  );
}
