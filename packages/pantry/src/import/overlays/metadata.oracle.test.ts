/**
 * The metadata builder's free tests: over generated packages and the `metaData` fixture, the rows
 * hold one row per element of each overlay's kind (rules file, rule 7), each resource's code agrees
 * with `ResourceTypeLexical` (C17), each entry's pieces restate its text, and the `lom-identifier`
 * and `lom-title` laws over the rows refuse exactly the records reading 62 refuses: the identifier
 * as the law oracle (`#pantry/test/oracle.ts`) judges it and as the spec reads the package's own
 * sketch, the title as the spec reads the sketch, in `xs:normalizedString`'s value space with tags
 * compared without regard to case; a usage value has its typed row exactly where it writes a
 * `baseType` and a `fieldIdentifier`, a record's value (reading 105); and each LOM learning
 * resource type has its value's row and its source's row exactly where it holds them, each its
 * first term's string value (reading 122).
 */
import { NodeServices } from "@effect/platform-node";
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, boolean, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option, Result } from "effect";
import { inject } from "vitest";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { grammar, ResourceTypeLexical } from "#pantry/grammar/install.ts";
import { objectRowsOfPackage, piecesOf, rowsOf } from "#pantry/import/overlays/metadata.ts";
import type {
  MetadataIds,
  MetadataRows,
  NamedDocument,
  ObjectRows,
} from "#pantry/import/overlays/metadata.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { XdmDocument } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import type { AssessmentObject } from "#pantry/qti/metadata.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import {
  filesOf as resourceTypeFilesOf,
  packageSketches as resourceTypeSketches,
  readText,
} from "#pantry/test/gen/lom-resource-type.ts";
import type {
  PackageSketch as ResourceTypeSketch,
  TermSketch,
  TypeSketch,
} from "#pantry/test/gen/lom-resource-type.ts";
import { caseHang, searchTimeout } from "#pantry/test/gen/xdm.ts";

/**
 * The fixtures the global setup materializes: `metaData` among them.
 */
const fixtures = inject("fixtures");

/**
 * The grammar shred reads every document through.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * The law oracle's tables, derived once.
 */
const laws = lawsOf(grammar);

/**
 * The package every generated case is written under.
 */
const packageId: Uuid = "00000000-0000-4000-8000-00000000c0de";

/**
 * The namespaces the generated packages write.
 */
const namespaces = {
  asi: "http://www.imsglobal.org/xsd/imsqtiasi_v3p0",
  cp: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1",
  lom: "http://ltsc.ieee.org/xsd/LOM",
} as const;

/**
 * Draw the ids of one document's rows: a uuid whose groups spell the document's number and the
 * row's, so two documents' rows never share an id.
 *
 * @param document - The document's number in its package, the manifest 0.
 * @returns The ids, under the test package.
 */
const idsFor = (document: number): MetadataIds => ({
  idOf: (index) =>
    `00000000-0000-4000-8${document.toString(16).padStart(3, "0")}-${index.toString(16).padStart(12, "0")}`,
  package: packageId,
});

/**
 * Read the schema version a manifest declares: its root's `metadata` child's `schemaversion` text.
 *
 * @param manifest - The manifest crust read.
 * @returns The text, none when it declares none.
 */
const declaredVersion = (manifest: XmlDocument): Option.Option<string> =>
  Option.fromNullishOr(
    manifest.root.children
      .flatMap((child) => (child.kind === "element" && child.local === "metadata" ? [child] : []))
      .flatMap(({ children }) =>
        children.flatMap((child) =>
          child.kind === "element" && child.local === "schemaversion" ? [child] : [],
        ),
      )
      .map(({ children }) =>
        children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
      )
      .at(0),
  );

/**
 * A package's documents as the builder reads them: the manifest's tree, and each other XML entry's
 * that shreds, by its path, with its number.
 */
interface Shredded {
  readonly documents: ReadonlyMap<
    string,
    { readonly number: number; readonly tree: XdmDocument<Composed> }
  >;
  readonly manifest: XdmDocument<Composed>;
}

/**
 * Read and shred a package's manifest and its other XML entries, as the importer reads them.
 *
 * @param files - The package's entries.
 * @returns Its trees; dies when the manifest does not shred, which no case builds.
 */
const shredded = Effect.fn("test.metadata.shredded")(function* shreddedPackage(
  files: readonly PackageFile[],
) {
  const manifestFile = files.find(({ kind }) => kind === "manifest");
  assert.isDefined(manifestFile, "the package has a manifest");

  const manifestXml = yield* Effect.orDie(readXml(manifestFile.bytes));
  const version = Result.getOrThrow(
    versionOf(grammar.kinds.versions.handles, declaredVersion(manifestXml)),
  );
  const manifest = yield* Effect.orDie(shred(manifestXml, version, shredGrammar));
  const documents = new Map<
    string,
    { readonly number: number; readonly tree: XdmDocument<Composed> }
  >();

  for (const file of files.filter(({ kind, path }) => kind === "file" && path.endsWith(".xml"))) {
    const tree = yield* readXml(file.bytes).pipe(
      Effect.flatMap((xml) => shred(xml, version, shredGrammar)),
      Effect.option,
    );
    if (Option.isSome(tree)) {
      documents.set(file.path, { number: documents.size + 1, tree: tree.value });
    }
  }

  return { documents, manifest } satisfies Shredded;
});

/**
 * A package's metadata rows as the importer will build them: the manifest's {@link rowsOf}, each
 * document's assessment object, and the records' {@link objectRowsOfPackage}.
 */
interface Built {
  readonly manifest: MetadataRows;
  readonly objects: ReadonlyMap<string, Addition<typeof AssessmentObject>>;
  readonly rows: ObjectRows;
}

/**
 * Build a package's metadata rows as the importer will.
 *
 * @param input - The package's trees.
 * @returns Its rows.
 */
const builtOf = (input: Shredded): Built => {
  const documents = new Map<string, NamedDocument>();
  const objects = new Map<string, Addition<typeof AssessmentObject>>();

  for (const [path, { number, tree }] of input.documents) {
    const ids = idsFor(number);
    const object = rowsOf(tree, ids).AssessmentObject.values().next().value;
    documents.set(path, { document: ids.idOf(0), object });
    if (object !== undefined) {
      objects.set(object.document, object);
    }
  }

  return {
    manifest: rowsOf(input.manifest, idsFor(0)),
    objects,
    rows: objectRowsOfPackage(input.manifest, idsFor(0), documents),
  };
};

/**
 * Judge the `lom-identifier` law over a package's rows as PostgreSQL will: a record's row holds
 * when its document is its record's object's and has its identifier, and its witness is a general
 * entry of the record whose token is that identifier.
 *
 * @param built - The package's rows.
 * @returns The records whose row breaks the law, by id.
 */
const identifierRefusals = (built: Built): ReadonlySet<string> =>
  new Set(
    [...built.rows.LomObjectIdentifier.values()].flatMap((row) => {
      const entry = built.manifest.LomEntry.get(row.entry);
      const holds =
        built.rows.LomObject.get(row.record)?.document === row.document &&
        built.objects.get(row.document)?.identifier === row.identifier &&
        entry?.holderKind === "lom:general" &&
        entry.holderParent === row.record &&
        entry.holder === row.general &&
        entry.token === row.identifier;

      return holds ? [] : [row.record];
    }),
  );

/**
 * Judge the `lom-title` law over a package's rows as PostgreSQL will: a record's row holds when its
 * document is its record's object's and has its title's value and its `xml:lang`'s tag, its witness
 * is a title string of the record with that value and its own language tag, and the
 * `LomObjectTitle` check holds.
 *
 * @param built - The package's rows.
 * @returns The records whose row breaks the law, by id.
 */
const titleRefusals = (built: Built): ReadonlySet<string> =>
  new Set(
    [...built.rows.LomObjectTitle.values()].flatMap((row) => {
      const string = built.manifest.LomTitleString.get(row.string);
      const object = built.objects.get(row.document);
      const holds =
        built.rows.LomObject.get(row.record)?.document === row.document &&
        object?.titleValue === row.title &&
        object.langTag === row.objectLang &&
        string?.record === row.record &&
        string.textValue === row.title &&
        string.languageTag === row.stringLanguage &&
        (row.objectLang === "" ||
          row.stringLanguage === "" ||
          row.stringLanguage === row.objectLang);

      return holds ? [] : [row.record];
    }),
  );

/**
 * Count the breaches of `LomObjectIdentifier` the law oracle finds in a package.
 *
 * @param files - The package's entries.
 * @returns The count; fails the test when the codec refuses the package.
 */
const oracleBreaches = Effect.fn("test.metadata.oracleBreaches")(function* oracleBreaches(
  files: readonly PackageFile[],
) {
  const judgment = yield* judge(files, grammar, laws);

  return judgment._tag === "Judged"
    ? judgment.breaches.filter(({ law }) => law === "LomObjectIdentifier").length
    : assert.fail(`the codec refused the package: ${judgment.rule}, ${judgment.detail}`);
});

/**
 * One LOM entry of a sketch: its value and the whitespace around it.
 */
interface EntrySketch {
  readonly lead: string;
  readonly trail: string;
  readonly value: string;
}

/**
 * One string of a sketch's title: its text, and its `language`, none when it writes none.
 */
interface StringSketch {
  readonly language: Option.Option<string>;
  readonly text: string;
}

/**
 * One LOM record of a sketch: its general category's identifiers' entries and titles' strings, and
 * its meta-metadata identifiers' entries, each identifier a list of entries and each title a list
 * of strings.
 */
interface RecordSketch {
  readonly general: readonly (readonly EntrySketch[])[];
  readonly meta: readonly (readonly EntrySketch[])[];
  readonly titles: readonly (readonly StringSketch[])[];
}

/**
 * One resource of a sketch: its kind, whether it writes an `href`, and its records.
 */
interface ResourceSketch {
  readonly href: boolean;
  readonly kind: "item" | "test" | "webcontent";
  readonly records: readonly RecordSketch[];
}

/**
 * A package as the generator sketches it: its objects' identifier padding and an item's
 * `xml:lang`, its manifest's own records, and its resources.
 */
interface PackageSketch {
  readonly lang: Option.Option<string>;
  readonly lead: string;
  readonly manifestRecords: readonly RecordSketch[];
  readonly resources: readonly ResourceSketch[];
  readonly trail: string;
}

/**
 * The title every sketched object carries.
 */
const objectTitle = "T x";

/**
 * The whitespace a sketch writes around a value.
 */
const pads = element(["", " ", "\n\t "]);

/**
 * The values a sketch's entries hold: the objects' identifier, another, one whose collapse holds a
 * space, and none.
 */
const values = element(["choice", "other", "ch oice", ""]);

/**
 * The texts a sketch's title strings hold: the objects' title, the title with a line feed where it
 * has a space and with two spaces, another, and none.
 */
const titleTexts = element([objectTitle, "T\nx", "T  x", "U", ""]);

/**
 * The `language` a sketch's title string writes: none, another than the item's, the item's, the
 * item's in capitals, and the empty text.
 */
const languages = element([
  Option.none<string>(),
  Option.some("fr"),
  Option.some("en"),
  Option.some("EN"),
  Option.some(""),
]);

/**
 * The `xml:lang` a sketched item writes: `en`, ` EN` (`en` padded and in capitals), none, and the
 * empty text.
 */
const itemLangs = element([
  Option.some("en"),
  Option.some(" EN"),
  Option.none<string>(),
  Option.some(""),
]);

/**
 * One entry of a sketch.
 *
 * @param source - The choice source.
 * @returns The entry.
 */
const entries: Gen<EntrySketch> = (source) => ({
  lead: pads(source),
  trail: pads(source),
  value: values(source),
});

/**
 * One title string of a sketch.
 *
 * @param source - The choice source.
 * @returns The string.
 */
const strings: Gen<StringSketch> = (source) => ({
  language: languages(source),
  text: titleTexts(source),
});

/**
 * One identifier's entries.
 */
const identifiers = array(entries, { max: 2, min: 0 });

/**
 * One title's strings.
 */
const titleStrings = array(strings, { max: 2, min: 0 });

/**
 * One record of a sketch.
 *
 * @param source - The choice source.
 * @returns The record.
 */
const records: Gen<RecordSketch> = (source) => ({
  general: array(identifiers, { max: 2, min: 0 })(source),
  meta: array(identifiers, { max: 1, min: 0 })(source),
  titles: array(titleStrings, { max: 1, min: 0 })(source),
});

/**
 * One resource of a sketch.
 *
 * @param source - The choice source.
 * @returns The resource.
 */
const resources: Gen<ResourceSketch> = (source) => ({
  href: boolean(source),
  kind: element(["item", "test", "webcontent"] as const)(source),
  records: array(records, { max: 2, min: 0 })(source),
});

/**
 * A package of a sketch: up to two resources, each with up to two records, and up to one record
 * of the manifest's own.
 *
 * @param source - The choice source.
 * @returns The package.
 */
const sketches: Gen<PackageSketch> = (source) => ({
  lang: itemLangs(source),
  lead: pads(source),
  manifestRecords: array(records, { max: 1, min: 0 })(source),
  resources: array(resources, { max: 2, min: 1 })(source),
  trail: pads(source),
});

/**
 * The resource type each sketched kind is written as.
 */
const resourceTypes = {
  item: "imsqti_item_xmlv3p0",
  test: "imsqti_test_xmlv3p0",
  webcontent: "webcontent",
} as const;

/**
 * Write a sketched identifier as a `lom:identifier` with a catalog and its entries.
 *
 * @param list - The identifier's entries.
 * @returns Its XML.
 */
const identifierXml = (list: readonly EntrySketch[]): string =>
  `<imsmd:identifier><imsmd:catalog>c</imsmd:catalog>${list
    .map(({ lead, trail, value }) => `<imsmd:entry>${lead}${value}${trail}</imsmd:entry>`)
    .join("")}</imsmd:identifier>`;

/**
 * Write a sketched title as a `lom:title` with its strings.
 *
 * @param list - The title's strings.
 * @returns Its XML.
 */
const titleXml = (list: readonly StringSketch[]): string =>
  `<imsmd:title>${list
    .map(({ language, text }) => {
      const attribute = Option.match(language, {
        onNone: () => "",
        onSome: (value) => ` language="${value}"`,
      });

      return `<imsmd:string${attribute}>${text}</imsmd:string>`;
    })
    .join("")}</imsmd:title>`;

/**
 * Write a sketched record as a `lom:lom`.
 *
 * @param record - The record.
 * @returns Its XML.
 */
const recordXml = (record: RecordSketch): string => {
  const meta =
    record.meta.length === 0
      ? ""
      : `<imsmd:metaMetadata>${record.meta.map(identifierXml).join("")}</imsmd:metaMetadata>`;

  return `<imsmd:lom><imsmd:general>${record.general.map(identifierXml).join("")}${record.titles.map(titleXml).join("")}</imsmd:general>${meta}</imsmd:lom>`;
};

/**
 * The path a sketched resource's document is written at.
 *
 * @param resource - The resource.
 * @param at - Its place among the package's resources.
 * @returns The path.
 */
const pathOf = (resource: ResourceSketch, at: number): string =>
  resource.kind === "webcontent" ? `r${String(at)}.html` : `r${String(at)}.xml`;

/**
 * Write a sketched package's files: its manifest, and each resource's document, an item or test
 * root whose identifier is `choice` between the sketch's padding and whose title is
 * {@link objectTitle}, an item with the sketch's `xml:lang` (a test admits none, reading 90), or a
 * web page.
 *
 * A resource with no `href` lists no file, so no reading takes one of its files for its document.
 *
 * @param sketch - The package.
 * @returns Its entries, sorted by path.
 */
const filesOf = (sketch: PackageSketch): readonly PackageFile[] => {
  const identifier = `${sketch.lead}choice${sketch.trail}`;
  const lang = Option.match(sketch.lang, {
    onNone: () => "",
    onSome: (value) => ` xml:lang="${value}"`,
  });
  const roots = {
    item: `<qti-assessment-item xmlns="${namespaces.asi}" identifier="${identifier}" title="${objectTitle}" time-dependent="false"${lang}/>`,
    test: `<qti-assessment-test xmlns="${namespaces.asi}" identifier="${identifier}" title="${objectTitle}"/>`,
    webcontent: "<html/>",
  } as const;
  const resourcesXml = sketch.resources
    .map((resource, at) => {
      const path = pathOf(resource, at);
      const metadata =
        resource.records.length === 0
          ? ""
          : `<metadata>${resource.records.map(recordXml).join("")}</metadata>`;
      const href = resource.href ? ` href="${path}"` : "";
      const file = resource.href ? `<file href="${path}"/>` : "";

      return `<resource identifier="R${String(at)}" type="${resourceTypes[resource.kind]}"${href}>${metadata}${file}</resource>`;
    })
    .join("");
  const manifest = `<manifest xmlns="${namespaces.cp}" xmlns:imsmd="${namespaces.lom}" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion>${sketch.manifestRecords.map(recordXml).join("")}</metadata><organizations/><resources>${resourcesXml}</resources></manifest>`;
  const encoder = new TextEncoder();

  return [
    { bytes: encoder.encode(manifest), kind: "manifest" as const, path: "imsmanifest.xml" },
    ...sketch.resources.flatMap((resource, at) =>
      resource.href
        ? [
            {
              bytes: encoder.encode(roots[resource.kind]),
              kind: "file" as const,
              path: pathOf(resource, at),
            },
          ]
        : [],
    ),
  ].toSorted((left, right) => (left.path < right.path ? -1 : 1));
};

/**
 * Collapse a text as XML Schema's `collapse` whitespace class does.
 *
 * @param text - The text.
 * @returns Its collapsed value.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, whiteSpace}
 */
const collapse = (text: string): string =>
  text
    .replaceAll(/[\t\n\r]/gu, " ")
    .replaceAll(/ +/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * Normalize a text as XML Schema's `replace` whitespace class does, `xs:normalizedString`'s.
 *
 * @param text - The text.
 * @returns Its value: each tab, line feed and carriage return a space.
 */
const normalize = (text: string): string => text.replaceAll(/[\t\n\r]/gu, " ");

/**
 * Read a language tag without regard to case (RFC 5646 §2.1.1): its ASCII capitals as small
 * letters, a tag's subtags being ASCII (§2.1).
 *
 * @param tag - The tag.
 * @returns The folded tag.
 */
const asciiFolded = (tag: string): string => tag.replaceAll(/[A-Z]/gu, (c) => c.toLowerCase());

/**
 * Judge `E1_derived`'s compared forms over a package's rows as PostgreSQL will: each object's
 * `titleValue` is its title with its whitespace replaced and its `langTag` its `xml:lang`
 * collapsed and case-folded, and each title string's `textValue` and `languageTag` are its text
 * and its language so read.
 *
 * @param built - The package's rows.
 * @returns The rows whose compared forms differ, by id.
 */
const comparedFormBreaches = (built: Built): readonly string[] => [
  ...[...built.objects.values()].flatMap((object) =>
    object.titleValue === normalize(object.title) &&
    object.langTag === asciiFolded(collapse(object.lang))
      ? []
      : [object.node],
  ),
  ...[...built.manifest.LomTitleString.values()].flatMap((string) =>
    string.textValue === normalize(string.text) &&
    string.languageTag === asciiFolded(string.language)
      ? []
      : [string.node],
  ),
];

/**
 * The records of a sketch that name a document: those of an item or test resource with an `href`,
 * each with its resource's kind.
 *
 * @param sketch - The package.
 * @returns The records, with the kind of object each names.
 */
const namingOf = (
  sketch: PackageSketch,
): readonly { readonly kind: "item" | "test"; readonly record: RecordSketch }[] =>
  sketch.resources.flatMap(({ href, kind, records: listed }) =>
    href && kind !== "webcontent" ? listed.map((record) => ({ kind, record })) : [],
  );

/**
 * Count the records reading 62's identifier half refuses in a sketch: each naming record that lists
 * a general entry, none of whose entries collapses to `choice`.
 *
 * @param sketch - The package.
 * @returns The count.
 */
const sketchIdentifierBreaches = (sketch: PackageSketch): number =>
  namingOf(sketch).filter(({ record }) => {
    const texts = record.general.flat().map(({ lead, trail, value }) => `${lead}${value}${trail}`);

    return texts.length > 0 && !texts.some((text) => collapse(text) === "choice");
  }).length;

/**
 * Count the records reading 62's title half refuses in a sketch: each naming record with a general
 * title none of whose strings in the object's language holds the object's title, under the
 * binding's comparisons (`strict`: `xs:normalizedString`'s value space, the `xml:lang` collapsed,
 * and tags without regard to case) or exact ones, which the situations compare it with.
 *
 * @param sketch - The package.
 * @param strict - Whether to compare as the binding does.
 * @returns The count.
 */
const sketchTitleBreaches = (sketch: PackageSketch, strict: boolean): number => {
  const fold = (text: string) => (strict ? asciiFolded(text) : text);
  const value = (text: string) => (strict ? normalize(text) : text);

  return namingOf(sketch).filter(({ kind, record }) => {
    const written = kind === "item" ? Option.getOrElse(sketch.lang, () => "") : "";
    const lang = strict ? collapse(written) : written;
    const named = record.titles.flat().some(({ language, text }) => {
      const tag = Option.getOrElse(language, () => "");

      return (
        value(text) === value(objectTitle) &&
        (lang === "" || tag === "" || fold(tag) === fold(lang))
      );
    });

    return record.titles.length > 0 && !named;
  }).length;
};

/**
 * A situation the generated packages must reach.
 */
type SketchSituation =
  | "identifier refused"
  | "identifier named"
  | "padded entry names"
  | "test names"
  | "no href"
  | "webcontent"
  | "meta-metadata entry"
  | "manifest record"
  | "entry with inner space"
  | "title refused"
  | "title named"
  | "title in another language"
  | "empty title"
  | "named only in the value space";

/**
 * Decide whether a sketched entry names the objects' identifier: its text collapses to `choice`.
 *
 * @param entry - The entry.
 * @returns Whether it names the objects.
 */
const names = ({ lead, trail, value }: EntrySketch): boolean =>
  collapse(`${lead}${value}${trail}`) === "choice";

/**
 * Sort rows by their node's place in document order.
 *
 * @param rows - The rows.
 * @returns Them, by `start`.
 */
const byStart = <R extends { readonly start: bigint }>(rows: Iterable<R>): readonly R[] =>
  [...rows].toSorted((left, right) => Number(left.start - right.start));

/**
 * Name the situations a sketch reaches.
 *
 * @param sketch - The package.
 * @returns Its situations.
 */
const situationsOf = (sketch: PackageSketch): readonly SketchSituation[] => {
  const naming = namingOf(sketch);
  const generalEntries = naming.flatMap(({ record }) => record.general.flat());
  const found: readonly (readonly [boolean, SketchSituation])[] = [
    [sketchIdentifierBreaches(sketch) > 0, "identifier refused"],
    [generalEntries.some(names), "identifier named"],
    [
      generalEntries.some((entry) => names(entry) && `${entry.lead}${entry.trail}` !== ""),
      "padded entry names",
    ],
    [
      naming.some(({ kind, record }) => kind === "test" && record.general.flat().some(names)),
      "test names",
    ],
    [sketch.resources.some(({ href, records: listed }) => !href && listed.length > 0), "no href"],
    [
      sketch.resources.some(
        ({ kind, records: listed }) => kind === "webcontent" && listed.length > 0,
      ),
      "webcontent",
    ],
    [
      sketch.resources.some(({ records: listed }) =>
        listed.some(({ meta }) => meta.flat().length > 0),
      ),
      "meta-metadata entry",
    ],
    [sketch.manifestRecords.length > 0, "manifest record"],
    [generalEntries.some(({ value }) => value === "ch oice"), "entry with inner space"],
    [sketchTitleBreaches(sketch, true) > 0, "title refused"],
    [
      naming.some(({ record }) => record.titles.length > 0) &&
        sketchTitleBreaches(sketch, true) <
          naming.filter(({ record }) => record.titles.length > 0).length,
      "title named",
    ],
    [
      naming.some(
        ({ kind, record }) =>
          kind === "item" &&
          record.titles
            .flat()
            .some(({ language }) =>
              Option.exists(
                language,
                (tag) =>
                  tag !== "" &&
                  asciiFolded(tag) !==
                    asciiFolded(collapse(Option.getOrElse(sketch.lang, () => ""))),
              ),
            ),
      ) && Option.exists(sketch.lang, (lang) => collapse(lang) !== ""),
      "title in another language",
    ],
    [naming.some(({ record }) => record.titles.some((title) => title.length === 0)), "empty title"],
    [
      sketchTitleBreaches(sketch, false) > sketchTitleBreaches(sketch, true),
      "named only in the value space",
    ],
  ];

  return found.flatMap(([holds, situation]) => (holds ? [situation] : []));
};

/**
 * What the generated packages must reach, steered over 200 cases.
 */
const reached = required<SketchSituation>(
  [
    "identifier refused",
    "identifier named",
    "padded entry names",
    "test names",
    "no href",
    "webcontent",
    "meta-metadata entry",
    "manifest record",
    "entry with inner space",
    "title refused",
    "title named",
    "title in another language",
    "empty title",
    "named only in the value space",
  ],
  { cases: 200, sense: notesOnly },
);

describe("import/overlays/metadata.ts, generated packages", { timeout: searchTimeout }, () => {
  it.effect(
    "gives one row per element of each overlay's kind, codes as ResourceTypeLexical spells them, and pieces that restate each entry's text",
    (ctx) =>
      // Oracle: the specification as a checker, the sketch each package is written from: its
      // `lom:lom`, `lom:general`, `lom:entry`, `lom:title` and `lom:string` elements, resources and
      // objects, each entry's and string's text, and `ResourceTypeLexical`'s rows for each
      // resource's code (C17).
      // Bound: up to 2 resources of 3 kinds, each with up to 2 records of up to 2 general and 1
      // meta-metadata identifiers of up to 2 entries over 4 values and 3 paddings, and up to 1
      // title of up to 2 strings over 5 texts and 5 languages; 300 cases.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: reached,
            draw: drawn(sketches),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "specification", name: "the package's sketch and ResourceTypeLexical" },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "import/overlays/metadata-rows",
          },
          (sketch, c) =>
            Effect.gen(function* oneRowEach() {
              c.noteAll(situationsOf(sketch));

              const input = yield* shredded(filesOf(sketch));
              const { manifest } = builtOf(input);
              const listed = [
                ...sketch.manifestRecords,
                ...sketch.resources.flatMap(({ records: of }) => of),
              ];
              const recordsByStart = byStart(manifest.LomRecord.values());
              const entriesByStart = byStart(manifest.LomEntry.values());
              const stringsByStart = byStart(manifest.LomTitleString.values());
              const allStrings = listed.flatMap(({ titles }) => titles.flat());

              assert.strictEqual(recordsByStart.length, listed.length, "one LomRecord a lom:lom");
              assert.strictEqual(manifest.LomGeneral.size, listed.length, "one LomGeneral each");
              assert.strictEqual(
                manifest.ResourceLomGeneral.size,
                sketch.resources.flatMap(({ records: of }) => of).length,
                "one ResourceLomGeneral a resource's general",
              );
              assert.strictEqual(manifest.LomResource.size, sketch.resources.length);
              assert.strictEqual(
                manifest.LomTitle.size,
                listed.flatMap(({ titles }) => titles).length,
              );
              assert.strictEqual(manifest.LomString.size, allStrings.length, "one LomString each");
              assert.strictEqual(manifest.LomTitleString.size, allStrings.length);
              assert.strictEqual(
                manifest.LomStringLanguage.size,
                allStrings.filter(({ language }) => Option.isSome(language)).length,
              );
              for (const [at, record] of recordsByStart.entries()) {
                const sketched = listed[at];
                assert.isDefined(sketched);

                const of = (holderKind: string) =>
                  entriesByStart
                    .filter((e) => e.holderParent === record.node && e.holderKind === holderKind)
                    .map(({ text }) => text);
                const texts = (ids: readonly (readonly EntrySketch[])[]) =>
                  ids.flat().map(({ lead, trail, value }) => `${lead}${value}${trail}`);

                assert.deepStrictEqual(of("lom:general"), texts(sketched.general), "general");
                assert.deepStrictEqual(of("lom:metaMetadata"), texts(sketched.meta), "meta");
                assert.deepStrictEqual(
                  stringsByStart
                    .filter((s) => s.record === record.node)
                    .map(({ language, text }) => ({ language, text })),
                  sketched.titles.flat().map(({ language, text }) => ({
                    language: Option.getOrElse(language, () => ""),
                    text,
                  })),
                  "title strings",
                );
              }

              assert.strictEqual(
                manifest.LomEntry.size,
                listed.flatMap(({ general, meta }) => [...general.flat(), ...meta.flat()]).length,
                "one LomEntry a lom:entry",
              );
              for (const entry of manifest.LomEntry.values()) {
                assert.strictEqual(`${entry.lead}${entry.token}${entry.trail}`, entry.text);
                assert.deepStrictEqual(piecesOf(entry.text).token, entry.token);
              }

              for (const resource of manifest.LomResource.values()) {
                const lexical = ResourceTypeLexical.rows.find(
                  ({ code }) => code === resource.named,
                );
                assert.isTrue(
                  resource.named === "none" ||
                    (lexical !== undefined &&
                      [resourceTypes.item, resourceTypes.test].some(
                        (type) => type === lexical.lexical,
                      )),
                  `${resource.named} is none or an assessment object's type`,
                );
              }

              for (const general of manifest.ResourceLomGeneral.values()) {
                assert.isTrue(manifest.LomResource.has(general.resource), "its resource's row");
              }
            }),
        ),
      ),
  );

  it.effect(
    "refuses exactly the records reading 62 refuses: the identifier as the law oracle judges it, the title in its value space with tags compared without regard to case",
    (ctx) =>
      // Oracle: for the identifier, two at once: a second implementation, the law oracle's
      // `LomObjectIdentifier` (`#pantry/test/oracle.ts`, over the shredded and folded package),
      // and the specification as a checker, reading 62 over the package's sketch (a naming record
      // that lists general entries names its document's collapsed identifier). For the title, the
      // specification over the sketch (QTI 3.0 Metadata §2.7.1.2): titles compared as
      // xs:normalizedString values, the root's xml:lang collapsed, and tags without regard to case
      // (RFC 5646 §2.1.1); each row's compared forms as E1 derived states them.
      // Bound: as the rows' search above; 300 cases.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: reached,
            draw: drawn(sketches),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the law oracle's LomObjectIdentifier, and reading 62 over the sketch",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "import/overlays/metadata-reading-62",
          },
          (sketch, c) =>
            Effect.gen(function* reading62() {
              c.noteAll(situationsOf(sketch));

              const files = filesOf(sketch);
              const built = builtOf(yield* shredded(files));
              const identified = identifierRefusals(built);
              const titles = titleRefusals(built);

              assert.strictEqual(identified.size, sketchIdentifierBreaches(sketch), "sketch");
              assert.strictEqual(identified.size, yield* oracleBreaches(files), "law oracle");
              assert.strictEqual(titles.size, sketchTitleBreaches(sketch, true), "title");
              assert.deepStrictEqual(comparedFormBreaches(built), [], "compared forms");
            }),
        ),
      ),
  );
});

/**
 * The `metaData` package's one entry, which names no document: its item is `choice`.
 */
const metaDataEntry = "<imsmd:entry>qti_v2_item_01</imsmd:entry>";

/**
 * Replace the `metaData` manifest's entry, failing when the manifest does not hold it.
 *
 * @param files - The package's entries.
 * @param entry - The entry's new text.
 * @returns The package with its manifest edited.
 */
const withEntry = (files: readonly PackageFile[], entry: string): readonly PackageFile[] =>
  files.map((file) => {
    if (file.kind !== "manifest") {
      return file;
    }

    const text = new TextDecoder().decode(file.bytes);
    assert.include(text, metaDataEntry, "the manifest holds the entry");

    return {
      ...file,
      bytes: new TextEncoder().encode(
        text.replace(metaDataEntry, `<imsmd:entry>${entry}</imsmd:entry>`),
      ),
    };
  });

describe("import/overlays/metadata.ts, the metaData fixture", () => {
  it.effect(
    "refuses metaData's record, whose entry names another item, and accepts it naming choice, padded or not",
    () =>
      // Oracle: a second implementation, the law oracle's `LomObjectIdentifier` over each package.
      // Bound: the fixture, and its entry edited to `choice` and to `choice` padded.
      Effect.gen(function* metaData() {
        const files = yield* readPackage(fixtures.metaData);

        for (const [label, edited, expected] of [
          ["metaData", files, 1],
          ["choice", withEntry(files, "choice"), 0],
          ["padded choice", withEntry(files, "\n    choice\t"), 0],
        ] as const) {
          const built = builtOf(yield* shredded(edited));

          assert.strictEqual(built.rows.LomObjectIdentifier.size, 1, `${label}: one record names`);
          assert.strictEqual(identifierRefusals(built).size, expected, label);
          assert.strictEqual(yield* oracleBreaches(edited), expected, `${label}, by the oracle`);
          assert.strictEqual(built.rows.LomObjectTitle.size, 1, `${label}: its title`);
          assert.strictEqual(titleRefusals(built).size, 1, `${label}: titled otherwise`);
        }
      }).pipe(Effect.provide(NodeServices.layer)),
  );
});

/**
 * One usage value of the usage-value box: its `baseType` as written, none where it writes none, its
 * `fieldIdentifier` as written, none where it writes none (a value that writes one forms part of a
 * record, spec reading 105), and its content, as XML text and as the string value XML 1.0 reads
 * from it.
 */
interface UsageCase {
  readonly baseType: string | undefined;
  readonly fieldIdentifier: string | undefined;
  readonly content: { readonly value: string; readonly xml: string };
}

/**
 * The usage-value box: a `ud:value` that writes no `baseType`, one of three spelled base types, a
 * misspelled one and a padded one, with and without a `fieldIdentifier`, over four contents: none,
 * a number, a padded number, and a text that escapes its ampersand, which the reader expands (XML
 * 1.0 §4.6, the predefined entities).
 */
const usageCases: Gen<UsageCase> = (source) => ({
  baseType: source.draw(element([undefined, "float", "integer", "identifier", "Float", " float"])),
  content: source.draw(
    element([
      { value: "", xml: "" },
      { value: "0.87", xml: "0.87" },
      { value: " 0.87\n", xml: " 0.87\n" },
      { value: "a&b", xml: "a&amp;b" },
    ]),
  ),
  fieldIdentifier: source.draw(element([undefined, "SCORE"])),
});

/**
 * A situation the usage-value box must reach.
 */
type UsageSituation =
  | "escaped"
  | "misspelled"
  | "outside a record"
  | "padded"
  | "spelled"
  | "unwritten";

/**
 * The base types the usage-value box spells as `BaseType` handles.
 */
const spelledUsageTypes: ReadonlySet<string> = new Set(["float", "integer", "identifier"]);

/**
 * Name a usage value's `baseType` situation, for the box's coverage.
 *
 * @param baseType - The `baseType` as written, none where it writes none.
 * @returns Its situation.
 */
const usageSituationOf = (baseType: string | undefined): UsageSituation => {
  if (baseType === undefined) {
    return "unwritten";
  }

  if (spelledUsageTypes.has(baseType)) {
    return "spelled";
  }

  return baseType.trim() === baseType ? "misspelled" : "padded";
};

describe("import/overlays/metadata.ts, usage values", () => {
  it.effect(
    "writes a UsageValue row exactly for a ud:value that writes baseType and fieldIdentifier, its code the handle it spells and its text its string value, and a UsageBaseType row for every one that writes baseType, as written",
    (ctx) =>
      // Oracle: the specification as a checker, reading 105 and C17: a row where `baseType` and
      // `fieldIdentifier` are both written, the value forming part of a record, and none elsewhere
      // (a `baseType` outside a record is no base type, so its value is untyped text), its code the
      // `BaseType` handle its lexical form spells as written (`none` for a misspelling, which
      // `E1_derived` refuses), its text the string value of its content; and a `UsageBaseType` row
      // for every value that writes a `baseType`, in a record or not, its lexical form as written.
      // Bound: 6 baseType spellings, none among them, by 2 field identifiers, none among them, by
      // 4 contents, 48 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "a ud:value with no, a spelled, a misspelled or a padded baseType, with and without a fieldIdentifier, by four contents",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<UsageSituation>([
              "escaped",
              "misspelled",
              "outside a record",
              "padded",
              "spelled",
              "unwritten",
            ]),
            generator: usageCases,
            limit: 50,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "reading 105 and C17's spelled codes" },
            suite: "pantry/import/overlays-metadata-usage-values",
          },
          (input: UsageCase, c) =>
            Effect.gen(function* usageValue() {
              c.note(usageSituationOf(input.baseType));
              if (input.baseType !== undefined && input.fieldIdentifier === undefined) {
                c.note("outside a record");
              }

              if (input.content.xml !== input.content.value) {
                c.note("escaped");
              }

              const attribute = [
                input.baseType === undefined ? "" : ` baseType="${input.baseType}"`,
                input.fieldIdentifier === undefined
                  ? ""
                  : ` fieldIdentifier="${input.fieldIdentifier}"`,
              ].join("");
              const xml = [
                '<usageData xmlns="http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0">',
                '<ordinaryStatistic name="AIS" context="http://example.org/c">',
                '<targetObject identifier="item"/>',
                `<value${attribute}>${input.content.xml}</value>`,
                "</ordinaryStatistic></usageData>",
              ].join("");
              const read = yield* Effect.orDie(readXml(new TextEncoder().encode(xml)));
              const tree = yield* Effect.orDie(shred(read, "3.0.1", shredGrammar));
              const built = rowsOf(tree, idsFor(1));
              const rows = [...built.UsageValue.values()];
              const copies = [...built.UsageBaseType.values()];

              assert.deepStrictEqual(
                rows.map(({ baseType, baseTypeLexical, text }) => ({
                  baseType,
                  baseTypeLexical,
                  text,
                })),
                input.baseType === undefined || input.fieldIdentifier === undefined
                  ? []
                  : [
                      {
                        baseType: spelledUsageTypes.has(input.baseType) ? input.baseType : "none",
                        baseTypeLexical: input.baseType,
                        text: input.content.value,
                      },
                    ],
              );
              assert.deepStrictEqual(
                copies.map(({ lexical }) => lexical),
                input.baseType === undefined ? [] : [input.baseType],
              );
              assert.deepStrictEqual(
                copies.map(({ node }) => node),
                [...built.UsageBaseType.keys()],
              );
            }),
        ),
      ),
  );
});

/**
 * The learning resource types each file of a sketched package writes, in document order: the
 * manifest's own records' and then its item resource's, and each external record's in its file.
 *
 * @param sketch - The package.
 * @returns Each file's types, by its path.
 */
const typesByFile = (sketch: ResourceTypeSketch): ReadonlyMap<string, readonly TypeSketch[]> => {
  const typesOf = (placement: string) =>
    sketch.records
      .filter((record) => record.placement === placement)
      .flatMap(({ educational }) => educational.flat());

  return new Map([
    ["imsmanifest.xml", [...typesOf("manifest"), ...typesOf("resource")]],
    ...sketch.records
      .filter(({ placement }) => placement === "external")
      .map((record, at) => [`meta/r${String(at)}.xml`, record.educational.flat()] as const),
  ]);
};

/**
 * Read a sketched term's string value, none where the type writes none.
 *
 * @param term - The term.
 * @returns Its string value.
 */
const termText = (term: Option.Option<TermSketch>): Option.Option<string> =>
  term.pipe(Option.map((written) => readText(written)));

describe("import/overlays/metadata.ts, learning resource types", { timeout: searchTimeout }, () => {
  it.effect(
    "gives each learning resource type a value row and a source row exactly where it holds the term, each naming its first term and holding its string value",
    (ctx) =>
      // Oracle: the specification as a checker, the sketch each package is written from: each
      // `lom:learningResourceType`'s first `lom:value` and first `lom:source` (the binding caps
      // each at one, so a second is N7's), read as XML 1.0 reads its text through a comment, a
      // CDATA section or a character reference, and no row for a term of another namespace.
      // Bound: as `rv-m.oracle.test.ts`'s search, under each case's swarm; 150 cases.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<"external" | "manifest" | "resource">(
              ["external", "manifest", "resource"],
              { cases: 100, sense: notesOnly },
            ),
            draw: drawn(resourceTypeSketches),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "specification", name: "the package's sketch" },
            runs: 150,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "import/overlays/metadata-learning-resource-types",
          },
          (sketch, c) =>
            Effect.gen(function* resourceTypeRows() {
              c.noteAll(sketch.records.map(({ placement }) => placement));

              const files = resourceTypeFilesOf(sketch);
              for (const [path, types] of typesByFile(sketch)) {
                const file = files.find((entry) => entry.path === path);
                assert.isDefined(file, path);
                if (file === undefined) {
                  return;
                }

                const xml = yield* Effect.orDie(readXml(file.bytes));
                const tree = yield* Effect.orDie(shred(xml, "3.0.1", shredGrammar));
                const ids = idsFor(1);
                const rows = rowsOf(tree, ids);
                const { nodes } = flatten(tree, ids.idOf);
                const typeNodes = nodes.filter(({ kind }) => kind === "lom:learningResourceType");
                const firstOf = (parent: string, kind: string) =>
                  nodes.find((node) => node.parent === parent && node.kind === kind)?.id;

                assert.lengthOf(typeNodes, types.length, path);
                assert.strictEqual(
                  rows.LomResourceType.size,
                  types.filter(({ value }) => Option.isSome(value)).length,
                  `${path}: one value row a type that holds a value`,
                );
                assert.strictEqual(
                  rows.LomResourceTypeSource.size,
                  types.filter(({ source }) => Option.isSome(source)).length,
                  `${path}: one source row a type that writes a source`,
                );
                for (const [at, node] of typeNodes.entries()) {
                  const type = types[at];
                  assert.isDefined(type);
                  if (type === undefined) {
                    return;
                  }

                  const value = rows.LomResourceType.get(node.id);
                  const source = rows.LomResourceTypeSource.get(node.id);
                  assert.deepStrictEqual(
                    Option.fromNullishOr(value).pipe(Option.map(({ text }) => text)),
                    termText(type.value),
                    `${path}: the value of type ${String(at)}`,
                  );
                  assert.deepStrictEqual(
                    Option.fromNullishOr(source).pipe(Option.map(({ text }) => text)),
                    termText(type.source),
                    `${path}: the source of type ${String(at)}`,
                  );
                  assert.strictEqual(value?.term, value && firstOf(node.id, "lom:value"));
                  assert.strictEqual(source?.term, source && firstOf(node.id, "lom:source"));
                }
              }
            }),
        ),
      ),
  );
});
