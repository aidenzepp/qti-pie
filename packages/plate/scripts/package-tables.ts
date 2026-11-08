/**
 * Regenerates the package tables file, `src/package/tables.generated.json`, from the two QTI 3.0
 * content packaging profiles and every schema they import, cached under
 * `$HOME/.cache/gr8des/qti3/xsd/` at the paths `src/test/xsd-layout.ts` gives them, the layout
 * pantry's `fetch-xsds` writes.
 *
 * From the repository root:
 *
 * ```sh
 * node packages/plate/scripts/package-tables.ts && pnpm exec vp fmt packages/plate/src/package/tables.generated.json
 * ```
 *
 * For each profile the script reads the closure of its `xs:import`s, hashing every file, and runs
 * `generateTables` and `generateOccurrences` once per namespace the profile's tables reach, since
 * each reads one schema and records a reference into another namespace by name only. An import's
 * purl location is followed only to the path that table gives it. A schema the closure holds but
 * nothing reaches, such as `xlink/xlink.xsd`, is read and hashed and gives no table.
 * A `TableGenerationError` names an XSD construct the generator has no table form for; map it in
 * `src/validate/xsd.ts` before committing tables from that XSD.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Config, Console, Effect, Schema } from "effect";
import { readSource } from "#plate/document/read.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { xsdNamespace } from "#plate/document/source.ts";
import { xsdPathByUrl } from "#plate/test/xsd-layout.ts";
import type { ContentTable, TableGenerationError } from "#plate/validate/xsd.ts";
import { generateOccurrences, generateTables, Occurrences, Tables } from "#plate/validate/xsd.ts";

/**
 * Where the generated file goes.
 */
const output = fileURLToPath(new URL("../src/package/tables.generated.json", import.meta.url));

/**
 * The two CP profiles, each by the CP version its manifests name in `metadata/schemaversion` and
 * its file in the cache: the tables of a manifest are its version's.
 */
export const profiles = [
  { file: "imsqtiv3p0_imscpv1p2_v1p0.xsd", version: "3.0.0" },
  { file: "imsqtiv3p0p1_imscpv1p2_v1p0.xsd", version: "3.0.1" },
] as const;

/**
 * The folder the XSDs are cached in, `.cache/gr8des/qti3/xsd` under `HOME`.
 */
export const cacheDirectory = Config.String("HOME").pipe(
  Config.map((home) => `${home}/.cache/gr8des/qti3/xsd`),
);

/**
 * An XSD could not be read.
 */
class XsdUnreadable extends Schema.TaggedError<XsdUnreadable>()("XsdUnreadable", {
  path: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot read ${this.path}. Put there the 1EdTech XSD that src/test/xsd-layout.ts lists at that path, from the URL it gives and with the SHA-256 it pins, or set HOME to the home folder that holds .cache/gr8des.`;
  }
}

/**
 * The shared reader refused an XSD.
 */
class XsdRefused extends Schema.TaggedError<XsdRefused>()("XsdRefused", {
  path: Schema.String,
  rule: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `The reader refused ${this.path} under ${this.rule}. Replace it with the 1EdTech XSD that src/test/xsd-layout.ts lists at that path, with the SHA-256 it pins.`;
  }
}

/**
 * A profile's closure cannot be followed or tabled: an import the cache does not map, a construct
 * that joins two files into one namespace, or a namespace the tables reach that no file declares,
 * or that two do. `detail` says which, and what to change.
 */
class ClosureUnresolved extends Schema.TaggedError<ClosureUnresolved>()("ClosureUnresolved", {
  detail: Schema.String,
  path: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot table the closure at ${this.path}: ${this.detail}.`;
  }
}

/**
 * The tables file could not be written.
 */
class OutputUnwritable extends Schema.TaggedError<OutputUnwritable>()("OutputUnwritable", {
  path: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot write ${this.path}. Make its folder writable and run the script again.`;
  }
}

/**
 * One XSD the script read: its path under {@link cacheDirectory}, its SHA-256, its source view and
 * its target namespace, `""` for none.
 */
interface ReadXsd {
  readonly namespace: string;
  readonly path: string;
  readonly sha256: string;
  readonly source: SourceDocument;
}

/**
 * One namespace's tables and occurrences, generated from the one schema that declares it.
 */
export interface NamespaceTables {
  readonly occurrences: Occurrences;
  readonly tables: Tables;
}

/**
 * What the generation built and read: per CP version, the tables and occurrences of each namespace
 * its profile reaches, keyed by namespace URI in sorted order; and every XSD it read, by path under
 * {@link cacheDirectory} in sorted order, with its SHA-256.
 */
export interface PackageGeneration {
  readonly read: ReadonlyMap<string, string>;
  readonly versions: ReadonlyMap<string, ReadonlyMap<string, NamespaceTables>>;
}

/**
 * Compare two strings by UTF-16 code units, so the output's order does not depend on a locale.
 *
 * @param left The first string.
 * @param right The second string.
 * @returns A negative number, zero or a positive number as `left` sorts before, with or after
 *   `right`.
 */
const compareText = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }

  return left > right ? 1 : 0;
};

/**
 * Read one XSD of the cache, hash it and parse it.
 *
 * @param directory The cache folder.
 * @param file The XSD's path under it.
 * @returns What was read, or the failure to read or parse it.
 */
const readXsd = Effect.fn("readXsd")(function* readXsd(
  directory: string,
  file: string,
): Effect.fn.Return<ReadXsd, XsdUnreadable | XsdRefused> {
  const location = `${directory}/${file}`;
  const bytes = yield* Effect.tryPromise({
    catch: () => new XsdUnreadable({ path: location }),
    try: () => readFile(location),
  });
  const source = yield* readSource(file, bytes).pipe(
    Effect.mapError((refusal) => new XsdRefused({ path: location, rule: refusal.rule })),
  );
  const namespace =
    source.root.attributes.find(
      (attribute) => attribute.namespace === "" && attribute.local === "targetNamespace",
    )?.value ?? "";

  return {
    namespace,
    path: file,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    source,
  };
});

/**
 * Read an XSD element's `schemaLocation`.
 *
 * @param element The `xs:import`, `xs:include` or `xs:redefine`.
 * @returns The location as written, or `undefined` when it has none.
 */
const locationOf = (element: SourceElement): string | undefined =>
  element.attributes.find(
    (attribute) => attribute.namespace === "" && attribute.local === "schemaLocation",
  )?.value;

/**
 * List the files an XSD imports, each by its path under the cache folder.
 *
 * An import's purl location maps to the path `src/test/xsd-layout.ts` gives that URL; a relative
 * location resolves against the importing file's folder. An import without a `schemaLocation` names
 * no file to follow. `xs:include` and `xs:redefine` join another file into the importer's
 * namespace, which one run of the generator per namespace cannot table, so they fail.
 *
 * @param xsd The XSD.
 * @returns The imported files' paths, or {@link ClosureUnresolved} naming the location or
 *   construct.
 */
const importsOf = (xsd: ReadXsd): Effect.Effect<readonly string[], ClosureUnresolved> => {
  /**
   * Fail the listing of this XSD's imports.
   *
   * @param detail Which location or construct cannot be followed, and what to change.
   * @returns The failure, {@link ClosureUnresolved} at this XSD's path.
   */
  const unresolved = (detail: string) =>
    Effect.fail(new ClosureUnresolved({ detail, path: xsd.path }));
  const files: string[] = [];
  for (const child of xsd.source.root.children) {
    if (child.kind !== "element" || child.namespace !== xsdNamespace) {
      continue;
    }

    if (child.local === "include" || child.local === "redefine") {
      return unresolved(
        `xs:${child.local} joins another file into ${xsd.namespace}; table the joined schema as one file before generating from it`,
      );
    }

    const location = locationOf(child);
    if (child.local !== "import" || location === undefined) {
      continue;
    }

    const mapped = xsdPathByUrl.get(location);
    if (mapped !== undefined) {
      files.push(mapped);
    } else if (location.includes("://")) {
      return unresolved(
        `the import location ${location} is not a URL src/test/xsd-layout.ts lists; add the file there with its path under the cache, its URL and its SHA-256`,
      );
    } else {
      const resolved = path.posix.normalize(
        path.posix.join(path.posix.dirname(xsd.path), location),
      );
      if (resolved.startsWith("../")) {
        return unresolved(
          `the import location ${location} leaves the cache folder; cache the schema it names inside that folder`,
        );
      }

      files.push(resolved);
    }
  }

  return Effect.succeed(files);
};

/**
 * List the namespaces one table names: its attributes', its children's and its wildcards' listed
 * namespaces.
 *
 * @param table An element table or a type's entry.
 * @returns The namespaces, possibly repeated.
 */
const contentNamespaces = (table: ContentTable): readonly string[] => [
  ...table.attributes.map((attribute) => attribute.namespace),
  ...table.children.map((child) => child.namespace),
  ...[table.anyAttribute, table.anyElement].flatMap((wildcard) =>
    wildcard === undefined || wildcard.namespace === "##any" || wildcard.namespace === "##other"
      ? []
      : wildcard.namespace,
  ),
];

/**
 * List the namespaces a schema's tables reach: every namespace an element table or a type's entry
 * names, through attributes, children, wildcards, declared types, bases and union members, apart
 * from XML Schema's own and no namespace.
 *
 * @param tables The schema's tables.
 * @returns The namespaces, each once.
 */
const reachedNamespaces = (tables: Tables): ReadonlySet<string> => {
  const names = new Set<string>();
  for (const table of Object.values(tables.elements)) {
    for (const namespace of [
      ...contentNamespaces(table),
      ...table.types.map((type) => type.namespace),
    ]) {
      names.add(namespace);
    }
  }
  for (const entry of Object.values(tables.types)) {
    const derived = entry.derivation === "union" ? entry.members : [entry.base];
    for (const namespace of [
      ...contentNamespaces(entry),
      ...derived.map((type) => type.namespace),
    ]) {
      names.add(namespace);
    }
  }
  names.delete("");
  names.delete(xsdNamespace);

  return names;
};

/**
 * Read a profile's closure: the profile and every file it imports, transitively.
 *
 * @param directory The cache folder.
 * @param profile The profile's path under it.
 * @param read The files already read, by path, shared between profiles so a file is read once;
 *   every file this call reads is added.
 * @returns The closure's files, by path, or the failure to read or follow one.
 */
const readClosure = Effect.fn("readClosure")(function* readClosure(
  directory: string,
  profile: string,
  read: Map<string, ReadXsd>,
): Effect.fn.Return<ReadonlyMap<string, ReadXsd>, XsdUnreadable | XsdRefused | ClosureUnresolved> {
  const closure = new Map<string, ReadXsd>();
  const pending = [profile];
  for (let file = pending.pop(); file !== undefined; file = pending.pop()) {
    if (closure.has(file)) {
      continue;
    }

    const xsd = read.get(file) ?? (yield* readXsd(directory, file));
    read.set(file, xsd);
    closure.set(file, xsd);
    pending.push(...(yield* importsOf(xsd)));
  }

  return closure;
});

/**
 * Index a closure's files by target namespace.
 *
 * @param profile The profile's path, which a failure names.
 * @param closure The closure's files.
 * @returns Each namespace's file, or {@link ClosureUnresolved} when two files declare one
 *   namespace.
 */
const byNamespace = (
  profile: string,
  closure: ReadonlyMap<string, ReadXsd>,
): Effect.Effect<ReadonlyMap<string, ReadXsd>, ClosureUnresolved> => {
  const files = new Map<string, ReadXsd>();
  for (const xsd of closure.values()) {
    const seen = files.get(xsd.namespace);
    if (seen !== undefined) {
      return Effect.fail(
        new ClosureUnresolved({
          detail: `${seen.path} and ${xsd.path} both declare ${xsd.namespace}; the tables hold one schema per namespace`,
          path: profile,
        }),
      );
    }

    files.set(xsd.namespace, xsd);
  }

  return Effect.succeed(files);
};

/**
 * Table each namespace a profile's tables reach, from its namespace outward, with the closure's
 * file for it.
 *
 * @param profile The profile, as read.
 * @param files The closure's files by namespace.
 * @returns The tables and occurrences, or the failure to generate one, or
 *   {@link ClosureUnresolved} when the tables reach a namespace no file of the closure declares.
 */
const tableProfile = Effect.fn("tableProfile")(function* tableProfile(
  profile: ReadXsd,
  files: ReadonlyMap<string, ReadXsd>,
): Effect.fn.Return<
  ReadonlyMap<string, NamespaceTables>,
  TableGenerationError | ClosureUnresolved
> {
  const tabled = new Map<string, NamespaceTables>();
  const pending = [profile.namespace];
  for (let namespace = pending.pop(); namespace !== undefined; namespace = pending.pop()) {
    if (tabled.has(namespace)) {
      continue;
    }

    const xsd = files.get(namespace);
    if (xsd === undefined) {
      return yield* new ClosureUnresolved({
        detail: `its tables reach ${namespace}, which no file it imports declares; import that namespace's schema with a schemaLocation`,
        path: profile.path,
      });
    }

    const tables = yield* generateTables(xsd.source);
    tabled.set(namespace, { occurrences: yield* generateOccurrences(xsd.source), tables });
    pending.push(...reachedNamespaces(tables));
  }

  return new Map([...tabled].toSorted(([left], [right]) => compareText(left, right)));
});

/**
 * Read both profiles' closures and generate, per CP version, the tables and occurrences of every
 * namespace the profile reaches, with the hash of every file read.
 */
export const generatePackageTables = Effect.gen(function* generatePackageTables() {
  const directory = yield* cacheDirectory;
  const read = new Map<string, ReadXsd>();
  const versions = new Map<string, ReadonlyMap<string, NamespaceTables>>();
  for (const { file, version } of profiles) {
    const closure = yield* readClosure(directory, file, read);
    const profile = closure.get(file);
    if (profile === undefined) {
      return yield* new ClosureUnresolved({ detail: "the profile was not read", path: file });
    }

    versions.set(version, yield* tableProfile(profile, yield* byNamespace(file, closure)));
  }

  const generation: PackageGeneration = {
    read: new Map(
      [...read.values()]
        .map((xsd) => [xsd.path, xsd.sha256] as const)
        .toSorted(([left], [right]) => compareText(left, right)),
    ),
    versions,
  };

  return generation;
});

/**
 * Encode a generation as the tables file holds it: per CP version, per namespace URI, that
 * namespace's occurrences and tables.
 *
 * @param generation The generation.
 * @returns The file's content, or the Schema failure to encode a table.
 */
export const encodePackageTables = Effect.fn("encodePackageTables")(function* encodePackageTables(
  generation: PackageGeneration,
) {
  const file: Record<string, Record<string, { occurrences: unknown; tables: unknown }>> = {};
  for (const [version, namespaces] of generation.versions) {
    const entries: Record<string, { occurrences: unknown; tables: unknown }> = {};
    for (const [namespace, { occurrences, tables }] of namespaces) {
      entries[namespace] = {
        occurrences: yield* Schema.encodeEffect(Occurrences)(occurrences),
        tables: yield* Schema.encodeEffect(Tables)(tables),
      };
    }
    file[version] = entries;
  }

  return file;
});

/**
 * Generate the package tables and write them as JSON.
 */
const program = Effect.gen(function* regenerate() {
  const generation = yield* generatePackageTables;
  const file = yield* encodePackageTables(generation);

  yield* Effect.tryPromise({
    catch: () => new OutputUnwritable({ path: output }),
    try: () => writeFile(output, `${JSON.stringify(file, undefined, 2)}\n`),
  });
  yield* Console.log(
    `Wrote the tables of ${[...generation.versions].map(([version, namespaces]) => `${String(namespaces.size)} namespaces for CP ${version}`).join(" and ")} to ${output}, from ${String(generation.read.size)} XSDs.`,
  );
});

if (import.meta.main) {
  await Effect.runPromise(program);
}
