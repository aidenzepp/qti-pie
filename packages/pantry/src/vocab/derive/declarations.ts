/**
 * The declarations deriver: it reads every vocabulary's XSDs, in each schema version, into the
 * rosters and declarations of `src/vocab/inventory/types.ts`, and prints two generated leaves
 * (review R3, R10 and R11):
 *
 * - `vocabularies`, `src/vocab/inventory/vocabularies.ts`: each vocabulary's roster, one per
 *   namespace, its kinds in the order the XSDs first declare them, and the kinds a schema declares
 *   globally;
 * - `attributes`, `src/vocab/inventory/attributes.ts`: each kind's attribute declarations, its
 *   attribute wildcard and its text's simple type, each stated once for the versions it holds in.
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
import type { Element } from "@qti-pie/crust/tree.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import {
  attributeNameDirective,
  attributeOf,
  attributeWildcardOf,
  declaredType,
  entryOfType,
  firstXs,
  refuse,
  valueTypeOf,
  XsdReadingError,
} from "#pantry/vocab/derive/derive.ts";
import type { AttributeRow } from "#pantry/vocab/derive/derive.ts";
import { valueDomainOf } from "#pantry/vocab/derive/domains.ts";
import {
  declarationsIn,
  handleOf,
  loadWorld,
  sourcesWriter,
  typeNameOf,
} from "#pantry/vocab/derive/models.ts";
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
  TypeReading,
  ValueType,
  VocabularyRoster,
} from "#pantry/vocab/inventory/types.ts";
import { vocabularyNamespaces, xmlNamespace } from "#pantry/vocab/namespaces.ts";

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
): Result.Result<GlobalAttributeDeclaration, XsdReadingError> =>
  Result.gen(function* globalAttributeOfBody() {
    const local = name.slice(xmlPrefix.length);
    const view = Option.fromNullishOr(world.get(xmlNamespace));
    const declaration = view.pipe(
      Option.flatMap(({ schema }) => Option.fromNullishOr(schema.attributes.get(local))),
    );

    if (Option.isNone(view) || Option.isNone(declaration)) {
      return yield* refuse(`xml.xsd declares no global attribute ${local}`);
    }

    const type = yield* declaredType(view.value.schema, declaration.value);

    return { domain: yield* valueDomainOf(view.value.schema, type), name, type };
  });

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
 * Read the global attributes every schema processor knows, and the open names' type: `xml.xsd`'s
 * four as it declares them, XML Schema's instance attributes, and `xs:anySimpleType`.
 *
 * @returns The global attributes, `xml:` first, and the open type's declaration under the name
 *   `xs:anySimpleType`.
 */
export const loadGlobalAttributes = Effect.fn("vocab.loadGlobalAttributes")(
  function* loadGlobalAttributes() {
    const { world } = yield* loadWorld("3.0.1");
    const xml = Option.fromNullishOr(world.get(xmlNamespace));

    if (Option.isNone(xml)) {
      return yield* new XsdReadingError({ detail: "no version reads w3/xml.xsd" });
    }

    const globals: GlobalAttributeDeclaration[] = [];

    for (const local of xml.value.schema.attributes.keys()) {
      globals.push(yield* Effect.fromResult(globalAttributeOf(world, `${xmlPrefix}${local}`)));
    }

    for (const [name, type] of instanceAttributes) {
      globals.push({
        domain: yield* Effect.fromResult(valueDomainOf(xml.value.schema, type)),
        name,
        type,
      });
    }

    return {
      globals,
      open: {
        domain: yield* Effect.fromResult(valueDomainOf(xml.value.schema, openType)),
        name: "xs:anySimpleType",
        type: openType,
      } satisfies GlobalAttributeDeclaration,
    };
  },
);

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
 * @returns The reading, or an {@link XsdReadingError}.
 */
const readingOf = (
  world: World,
  view: SchemaView,
  kind: string,
  declared: Declaration,
): Result.Result<KindReading, XsdReadingError> =>
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
        text: Option.some({ domain: yield* valueDomainOf(view.schema, text), type: text }),
        wildcard: Option.none(),
      };
    }

    const entry = yield* entryOfType(
      view.schema,
      { element: declared.local, handle: kind, type: type.name },
      type.definition,
    );
    const wildcard = yield* attributeWildcardOf(view.schema, type.definition);
    const attributes: (AttributeRow & { readonly domain: Domain; readonly source: Source })[] = [];

    for (const row of lastOfEach(entry.attributes)) {
      const source = yield* view.sourceOf(row.declaration);

      if (row.name.startsWith(xmlPrefix)) {
        const global = yield* globalAttributeOf(world, row.name);

        attributes.push({ ...row, ...global.type, domain: global.domain, source });
      } else {
        attributes.push({ ...row, domain: yield* valueDomainOf(view.schema, row), source });
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
        ? Option.some({ domain: yield* valueDomainOf(view.schema, text.value), type: text.value })
        : Option.none(),
      wildcard,
    };
  });

/**
 * What one version's XSDs declare: each kind's reading, by kind in first-declaration order, the
 * kinds declared globally, and each roster's kinds by namespace.
 */
interface VersionReading {
  readonly globals: ReadonlySet<string>;
  readonly kinds: ReadonlyMap<string, KindReading>;
  readonly rosters: ReadonlyMap<string, ReadonlyMap<string, string>>;
}

/**
 * Read one version's declarations.
 *
 * @param world - The version's schemas.
 * @param documents - Every document of the version's schemas, each with its schema.
 * @returns The reading, or an {@link XsdReadingError}.
 */
const versionReadingOf = (
  world: World,
  documents: readonly (readonly [SchemaView, { readonly root: Element }])[],
): Result.Result<VersionReading, XsdReadingError> =>
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
 * Read every version's declarations.
 *
 * @returns Each version's reading, in roster order.
 */
export const loadDeclarations = Effect.fn("vocab.loadDeclarations")(function* loadDeclarations() {
  const readings: (readonly [SchemaVersion, VersionReading])[] = [];

  for (const version of schemaVersions) {
    const { documents, world } = yield* loadWorld(version);

    readings.push([version, yield* Effect.fromResult(versionReadingOf(world, documents))]);
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
  readings: readonly (readonly [SchemaVersion, VersionReading])[],
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
  readings: readonly (readonly [SchemaVersion, VersionReading])[],
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

  for (const row of declarations) {
    const key = `${row.kind} ${row.versions.join(" ")}`;
    const stem = Option.isSome(row.type.inline) ? row.name : row.type.type;
    const type = typeOf(row.type, stem);
    const domain = domainOfRow(row.domain, stem);
    const sources = writer.expression(row.sources);
    const written = Option.match(row.default, {
      onNone: () =>
        `attribute(${JSON.stringify(row.name)}, ${JSON.stringify(row.use)}, ${type}, ${domain}, ${sources})`,
      onSome: (value) =>
        `defaulted(${JSON.stringify(row.name)}, ${JSON.stringify(row.use)}, ${type}, ${domain}, ${sources}, ${JSON.stringify(value)})`,
    });
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
        "The attributes every schema processor declares, which kinds admit under their closed handles: `w3/xml.xsd`'s four, as it declares them, and the four of XML Schema's instance namespace, as XML Schema 1.0 Part 1, 3.2.7, declares them.",
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
