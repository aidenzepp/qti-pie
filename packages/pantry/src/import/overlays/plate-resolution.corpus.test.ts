/**
 * Plate's resolution of an item's package URLs (`@qti-pie/plate`'s `assetPaths`, the paths `render`
 * looks up in the configuration's `assets`) against the importer's (`resolveIn`), over every URL
 * attribute of every item document of the 1EdTech corpus.
 *
 * A host builds `assets` from the importer's rows: each `ReferencePath` of the item's document,
 * joined to the `Entry` it names, gives a file's path and its address. `render` resolves the item's
 * own package URLs, against the item's path in the package, and fails `AssetMissing` for a path the
 * map lacks. So the two resolutions must name one file for every reference: a path plate resolves
 * that the importer does not is a picture no page can show. The two share no code: plate merges
 * the WHATWG URL parser's parsed path below the item's directory, and the importer merges the
 * written segments with its base and percent-decodes them (RFC 3986, §5.2).
 *
 * For each URL attribute plate writes, an attribute of the importer's reference census: when plate
 * names one file, the importer resolves the value to that entry; when plate names none (a remote
 * URL, a fragment, a value it drops, or a path that climbs above the item's own folder), the
 * importer names no entry at or below the item's folder. A value the importer cannot resolve under
 * a stated limit (a stray `%`, a backslash, …) and a `srcset` of several candidates or with a
 * descriptor are refused at import by "Href form", so no admitted item holds one, and they are
 * counted, never compared. plate resolves against the item's location alone and marks `xml:base`
 * unsupported, so a reference under an `xml:base` would resolve apart; the corpus holds none, and
 * the run fails if it ever does. Planted resolvers, each a plausible slip of plate's, show that the
 * corpus tells each apart from the importer.
 *
 * The run is gated on `GR8DES_CORPUS=1` and opens no database. plate is a devDependency of this
 * package only, so plate never depends on pantry.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { assetPaths } from "@qti-pie/plate";
import {
  baseIn,
  documentBase,
  hrefValueOf,
  referenceCensus,
  resolveIn,
} from "#pantry/import/overlays/package.ts";
import type { HrefResolution, WhiteSpace } from "#pantry/import/overlays/package.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materializeCorpus } from "#pantry/test/fixtures.ts";
import { settings } from "#pantry/test/settings.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * The packages `materializeCorpus` lists from the pinned examples tarball, pinned so that a run
 * over a missing or different corpus fails rather than passing over fewer references.
 */
const corpusPackages = 28;

/**
 * The namespace of QTI 3's elements, the HTML body elements among them, as crust resolves it.
 */
const qtiNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The namespace `xml:base` is in (Namespaces in XML, §3).
 */
const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

/**
 * The schema versions the reference census is keyed by.
 */
const censusVersions = ["3.0.0", "3.0.1"] as const;

/**
 * One URL attribute of an item document, as both resolvers read it.
 */
interface Reference {
  /**
   * The attribute's local name.
   */
  readonly attribute: string;
  /**
   * The `xml:base` values in scope at the element, outermost first, as written.
   */
  readonly bases: readonly string[];
  /**
   * The item document's path in its package, its location.
   */
  readonly document: string;
  /**
   * The element's local name.
   */
  readonly element: string;
  /**
   * The attribute's value as crust read it, normalized as XML normalizes an attribute value.
   */
  readonly lexical: string;
  /**
   * The corpus package's name, for a failure's message.
   */
  readonly package: string;
  /**
   * The attribute's whitespace class as the importer's census reads it.
   */
  readonly whiteSpace: WhiteSpace;
}

/**
 * What one walk of the corpus found: every URL attribute plate writes, and each attribute plate
 * writes that the importer's census does not list under both schema versions alike.
 */
interface Corpus {
  readonly packages: number;
  readonly references: readonly Reference[];
  readonly uncensused: readonly string[];
}

/**
 * A resolver of an item's package URL to the files it names, as plate's `assetPaths` is.
 */
type Resolver = (
  location: string,
  element: string,
  attribute: string,
  value: string,
) => readonly string[];

/**
 * Report whether plate writes a URL into an attribute of an element: a plain file name there names
 * one file, as it does in every context plate writes, `srcset` included.
 *
 * @param element - The element's local name.
 * @param attribute - The attribute's local name.
 * @returns Whether `assetPaths` resolves a file name there.
 */
const writesUrl = (element: string, attribute: string): boolean =>
  assetPaths("probe.xml", element, attribute, "probe.png").length > 0;

/**
 * Read the whitespace class the importer's census gives an attribute, the same under every schema
 * version it is keyed by.
 *
 * @param element - The element's local name, its kind.
 * @param attribute - The attribute's local name.
 * @returns The class, or none when a version's census does not list it or two disagree.
 */
const censusOf = (element: string, attribute: string): Option.Option<WhiteSpace> => {
  const classes = censusVersions.map((version) => referenceCensus(version, element, attribute));
  const [first] = classes;

  return first !== undefined &&
    Option.isSome(first) &&
    classes.every((each) => Option.isSome(each) && each.value === first.value)
    ? first
    : Option.none();
};

/**
 * What one item document's walk found: its references, and each attribute plate writes a URL into
 * that the census does not list.
 */
interface Found {
  readonly references: readonly Reference[];
  readonly uncensused: readonly string[];
}

/**
 * Collect the URL attributes plate writes of an item document's elements in QTI's namespace, each
 * with the `xml:base` values in scope, and each such attribute the census does not list.
 *
 * @param root - The document's root element.
 * @param source - The package's name and the document's path.
 * @param source.document - The document's path in its package.
 * @param source.package - The corpus package's name.
 * @returns The references, in document order, and the attributes the census lacks.
 */
const referencesIn = (
  root: Element,
  source: { readonly document: string; readonly package: string },
): Found => {
  const references: Reference[] = [];
  const uncensused: string[] = [];
  const stack: { readonly bases: readonly string[]; readonly element: Element }[] = [
    { bases: [], element: root },
  ];
  for (let top = stack.pop(); top !== undefined; top = stack.pop()) {
    const { element } = top;
    const own = element.attributes.find(
      (attribute) => attribute.namespace === xmlNamespace && attribute.local === "base",
    );
    const bases = own === undefined ? top.bases : [...top.bases, own.value];
    if (element.namespace === qtiNamespace) {
      for (const attribute of element.attributes) {
        if (attribute.namespace === "" && writesUrl(element.local, attribute.local)) {
          Option.match(censusOf(element.local, attribute.local), {
            onNone: () => {
              uncensused.push(`${element.local}@${attribute.local}`);
            },
            onSome: (whiteSpace) => {
              references.push({
                attribute: attribute.local,
                bases,
                document: source.document,
                element: element.local,
                lexical: attribute.value,
                package: source.package,
                whiteSpace,
              });
            },
          });
        }
      }
    }

    // Pushed in reverse, so the stack pops the children in document order.
    for (const child of element.children.toReversed()) {
      if (child.kind === "element") {
        stack.push({ bases, element: child });
      }
    }
  }

  return { references, uncensused };
};

/**
 * Every URL attribute plate writes of every item document of the corpus, read once for the file:
 * each corpus package read whole, each of its XML entries read by crust, and each whose root is a
 * QTI 3 `qti-assessment-item` walked. A run without `GR8DES_CORPUS=1` never opens the tarball.
 */
const corpus: Effect.Effect<Corpus> = Effect.runSync(
  Effect.cached(
    Effect.gen(function* readCorpus() {
      const packages = yield* materializeCorpus();
      const references: Reference[] = [];
      const uncensused = new Set<string>();
      for (const { dir, name } of packages) {
        for (const file of yield* readPackage(dir)) {
          const read = file.path.endsWith(".xml")
            ? yield* Effect.option(readXml(file.bytes))
            : Option.none();
          if (
            Option.isSome(read) &&
            read.value.root.namespace === qtiNamespace &&
            read.value.root.local === "qti-assessment-item"
          ) {
            const found = referencesIn(read.value.root, { document: file.path, package: name });
            references.push(...found.references);
            for (const each of found.uncensused) {
              uncensused.add(each);
            }
          }
        }
      }

      return { packages: packages.length, references, uncensused: [...uncensused].toSorted() };
    }).pipe(Effect.provide(NodeServices.layer), Effect.orDie),
  ),
);

/**
 * Resolve a reference as the importer does: each `xml:base` in scope against the one above it,
 * from the document's own path, then the value, read by its whitespace class, against the
 * innermost.
 *
 * @param reference - The reference.
 * @returns The importer's resolution.
 */
const importerOf = (reference: Reference): HrefResolution => {
  let base = documentBase(reference.document);
  for (const written of reference.bases) {
    base = baseIn(hrefValueOf(written, "collapse"), base);
  }

  return resolveIn(hrefValueOf(reference.lexical, reference.whiteSpace), base);
};

/**
 * Report whether an entry path lies at or below a document's own folder.
 *
 * @param entry - The entry's path in the package.
 * @param document - The document's path in the package.
 * @returns Whether the entry is in the document's folder or a folder below it.
 */
const belowFolderOf = (entry: string, document: string): boolean => {
  const folder = path.posix.dirname(document);

  return folder === "." || entry.startsWith(`${folder}/`);
};

/**
 * Name a reference for a failure's message.
 *
 * @param reference - The reference.
 * @returns Its package, document, element, attribute and value.
 */
const placeOf = (reference: Reference): string =>
  `${reference.package}/${reference.document}: ${reference.element}@${reference.attribute}=${JSON.stringify(reference.lexical)}`;

/**
 * How a comparison of one reference went: `agreed`, or one of the counted reasons it is not
 * compared, or the disagreement's message.
 */
type Compared =
  | { readonly _tag: "agreed" }
  | { readonly _tag: "disagreed"; readonly message: string }
  | { readonly _tag: "skipped"; readonly reason: "srcset" | "under xml:base" | "unresolved" };

/**
 * Compare one reference's resolution by a resolver with the importer's.
 *
 * @param resolver - Plate's resolver, or a planted one.
 * @param reference - The reference.
 * @returns The comparison.
 */
const compare = (resolver: Resolver, reference: Reference): Compared => {
  const importer = importerOf(reference);
  const files = resolver(
    reference.document,
    reference.element,
    reference.attribute,
    reference.lexical,
  );
  const words = `plate names ${JSON.stringify(files)} where the importer resolves ${JSON.stringify(importer)}`;
  if (reference.bases.length > 0) {
    return { _tag: "skipped", reason: "under xml:base" };
  }

  if (importer.scope === "unresolved") {
    return { _tag: "skipped", reason: "unresolved" };
  }

  if (reference.attribute === "srcset" && /[\t\n\r ,]/u.test(reference.lexical.trim())) {
    return { _tag: "skipped", reason: "srcset" };
  }

  if (files.length === 0) {
    return importer.scope === "entry" && belowFolderOf(importer.path, reference.document)
      ? { _tag: "disagreed", message: `${placeOf(reference)}: ${words}` }
      : { _tag: "agreed" };
  }

  return files.length === 1 && importer.scope === "entry" && importer.path === files[0]
    ? { _tag: "agreed" }
    : { _tag: "disagreed", message: `${placeOf(reference)}: ${words}` };
};

/**
 * The disagreements of a resolver with the importer over the corpus.
 *
 * @param resolver - The resolver.
 * @param references - The corpus's references.
 * @returns Each disagreement's message, in corpus order.
 */
const disagreementsOf = (resolver: Resolver, references: readonly Reference[]): readonly string[] =>
  references.flatMap((reference) => {
    const compared = compare(resolver, reference);

    return compared._tag === "disagreed" ? [compared.message] : [];
  });

/**
 * A planted resolver: plate's with one plausible slip, which the corpus must tell apart from the
 * importer.
 */
interface Planted {
  readonly name: string;
  readonly resolver: Resolver;
}

/**
 * The planted resolvers: one that resolves against the package root rather than the item's
 * folder, as a resolver that forgets the item's location does; and one that keeps a URL's query
 * and fragment in the file's path, as one that never splits the path from them does, so a video's
 * `#t=…` names no file the package holds.
 */
const planted: readonly Planted[] = [
  {
    name: "resolves against the package root",
    resolver: (location, element, attribute, value) =>
      assetPaths(path.posix.basename(location), element, attribute, value),
  },
  {
    name: "keeps the query and fragment in the path",
    resolver: (location, element, attribute, value) => {
      const at = value.search(/[?#]/u);
      const params = at === -1 ? "" : value.slice(at);

      return assetPaths(location, element, attribute, value).map((file) => `${file}${params}`);
    },
  },
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "plate's assetPaths against the importer's resolveIn over the corpus",
  (it) => {
    it.effect.skipIf(!settings.corpusRequested)(
      "names, for every URL attribute plate writes of every corpus item, the one file the importer resolves it to, and no file where the importer names none in the item's folder",
      () =>
        Effect.gen(function* agreement() {
          const { packages, references } = yield* corpus;
          const compared = references.map((reference) => compare(assetPaths, reference));
          const count = (tag: Compared["_tag"]): number =>
            compared.filter((each) => each._tag === tag).length;
          const named = references.filter(
            (reference) =>
              assetPaths(
                reference.document,
                reference.element,
                reference.attribute,
                reference.lexical,
              ).length > 0,
          );

          console.log(
            `${String(references.length)} references: ${String(count("agreed"))} agreed, ${String(named.length)} naming a file, ${String(count("skipped"))} not compared`,
          );
          assert.strictEqual(packages, corpusPackages);
          assert.isNotEmpty(named, "no corpus reference names a file of its package");
          assert.deepStrictEqual(disagreementsOf(assetPaths, references), []);
        }),
    );

    it.effect.skipIf(!settings.corpusRequested)(
      "finds every attribute plate writes a URL into in the importer's reference census, read under one whitespace class in both schema versions",
      () =>
        Effect.gen(function* census() {
          const { references, uncensused } = yield* corpus;

          assert.isNotEmpty(references);
          assert.deepStrictEqual(uncensused, []);
        }),
    );

    it.effect.skipIf(!settings.corpusRequested)(
      "meets no reference under an xml:base, which plate does not resolve against",
      () =>
        Effect.gen(function* noXmlBase() {
          const { references } = yield* corpus;

          assert.deepStrictEqual(
            references.filter((reference) => reference.bases.length > 0).map(placeOf),
            [],
          );
        }),
    );

    for (const { name, resolver } of planted) {
      it.effect.skipIf(!settings.corpusRequested)(
        `tells the planted resolver that ${name} apart from the importer`,
        () =>
          Effect.gen(function* plantedBug() {
            const { references } = yield* corpus;

            assert.isNotEmpty(disagreementsOf(resolver, references), name);
          }),
      );
    }
  },
);
