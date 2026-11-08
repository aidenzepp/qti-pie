/**
 * The XSD validity oracle's inputs: the XML catalog that maps every pinned XSD's published URL onto
 * its cached file, and one driver schema per schema version that imports every vocabulary of that
 * version, written into the package's ignored `work/` for `xmllintValidate`
 * (`#pantry/xml/oracle.ts`).
 *
 * The pins are `src/vocab/derive/sources.ts`'s, all 23: the two versions' ASI, content-packaging,
 * curriculum standards, CP extension and AfA DRD XSDs, and the QTI metadata, usage data, LOM,
 * MathML 3, SSML 1.1, `xml.xsd`, XInclude and XLink schemas both versions read. Each file is
 * hashed against its pin before the catalog names it, so the validator reads only pinned bytes;
 * the cache itself is data (the testing doctrine), never run. `--nonet` refuses every location the
 * catalog does not map, so a schema that reaches an unpinned file fails loudly rather than
 * validating against part of itself.
 *
 * A driver is a schema in a namespace of its own that imports pinned vocabularies' namespaces at
 * the URLs the XSDs themselves import them from. A version's union driver imports every pinned
 * vocabulary. It also declares `batch`, whose content is a lax `##any` wildcard, so one document
 * can hold many probes, each assessed against its own global declaration; and it may declare
 * probe elements, each a global element of a named type, so a value can be judged against a type
 * whose elements are only ever declared locally.
 *
 * A root driver imports one vocabulary, the one whose XSD declares a document's root, so the
 * schema a document is assessed against is its root's schema set (spec reading 81): that XSD and
 * every XSD it imports, transitively, as the XSDs' own `xs:import`s state it ({@link schemaSetOf}).
 * Under the union driver a `strict` wildcard would find a declaration no XSD of the document's
 * set imports, as a DRD element under an item's `qti-companion-materials-info`.
 */
import { Array as Arr, Effect, FileSystem, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import {
  checkCache,
  sourcePaths,
  sources,
  verifySource,
  xsdDirectory,
} from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import type { XsdMessage, XsdVerdict } from "#pantry/xml/oracle.ts";

/**
 * The namespace the driver schemas and their probe elements are in, which no pinned XSD uses.
 */
export const driverNamespace = "urn:qti-pie:xsd-oracle";

/**
 * The imports both versions' drivers share: one file per namespace.
 */
const sharedImports = [
  ["http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0", "usagedata/imsqti_usagedatav3p0_v1p0.xsd"],
  ["http://www.imsglobal.org/xsd/imsqti_metadata_v3p0", "imsqti_metadatav3p0_v1p0.xsd"],
  ["http://ltsc.ieee.org/xsd/LOM", "lom/imsmd_loose_v1p3p2.xsd"],
  ["http://www.w3.org/1998/Math/MathML", "mathml/mathml3.xsd"],
  ["http://www.w3.org/2001/10/synthesis", "ssml/ssmlv1p1-core.xsd"],
  ["http://www.w3.org/2001/XInclude", "w3/XInclude.xsd"],
  ["http://www.w3.org/XML/1998/namespace", "w3/xml.xsd"],
  ["http://www.w3.org/1999/xlink", "xlink/xlink.xsd"],
] as const satisfies readonly (readonly [namespace: string, source: SourcePath])[];

/**
 * The namespaces every driver imports, each at the pinned URL the XSDs themselves import it from,
 * so no file is read twice under two locations: the version's own files for the five vocabularies
 * 3.0 and 3.0.1 publish apart (ASI, content packaging, curriculum standards, the CP extension and
 * the AfA DRD), and one file each for the rest (1EdTech publishes one usage data XSD for QTI 3.0,
 * which 3.0.1 reads too). The ASI, content-packaging and usage data imports alone reach every
 * pin; the others are imported too, so a probe element may name a type of any of them.
 */
export const driverImports = {
  "3.0.0": [
    ["http://www.imsglobal.org/xsd/imsqtiasi_v3p0", "imsqti_asiv3p0_v1p0.xsd"],
    ["http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1", "imsqtiv3p0_imscpv1p2_v1p0.xsd"],
    ["http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1", "csm/imsqtiv3p0_csmv1p1_v1p0.xsd"],
    [
      "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2",
      "cpext/imsqtiv3p0_cpextv1p2_v1p0.xsd",
    ],
    [
      "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0",
      "drd/imsqtiv3p0_afa3p0drd_v1p0.xsd",
    ],
    ...sharedImports,
  ],
  "3.0.1": [
    ["http://www.imsglobal.org/xsd/imsqtiasi_v3p0", "imsqti_asiv3p0p1_v1p0.xsd"],
    ["http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1", "imsqtiv3p0p1_imscpv1p2_v1p0.xsd"],
    ["http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1", "csm/imsqtiv3p0p1_csmv1p1_v1p0.xsd"],
    [
      "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2",
      "cpext/imsqtiv3p0p1_cpextv1p2_v1p0.xsd",
    ],
    [
      "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0",
      "drd/imsqtiv3p0p1_afa3p0drd_v1p0.xsd",
    ],
    ...sharedImports,
  ],
} as const satisfies Readonly<
  Record<SchemaVersion, readonly (readonly [namespace: string, source: SourcePath])[]>
>;

/**
 * A probe element a driver declares: a global element `local` in {@link driverNamespace} whose
 * type is the named type `{namespace}type`.
 */
export interface ProbeDeclaration {
  readonly local: string;
  readonly namespace: string;
  readonly type: string;
}

/**
 * What {@link writeXsdOracle} wrote: the catalog, each version's union driver, and each version's
 * root drivers by the namespace of the root they validate.
 */
export interface XsdOracle {
  readonly catalog: string;
  readonly drivers: Readonly<Record<SchemaVersion, string>>;
  readonly roots: Readonly<Record<SchemaVersion, ReadonlyMap<string, string>>>;
}

/**
 * The driver a document is validated with: its root namespace's root driver, so it is assessed
 * against its root's schema set, or the union driver for a root no pinned vocabulary declares,
 * whose `xmllint` verdict is the same either way (no global declaration for the root).
 *
 * @param oracle - What {@link writeXsdOracle} wrote.
 * @param version - The schema version.
 * @param namespace - The namespace of the document's root, empty for none or for a document that
 *   does not parse.
 * @returns The driver's path.
 */
export const driverFor = (oracle: XsdOracle, version: SchemaVersion, namespace: string): string =>
  oracle.roots[version].get(namespace) ?? oracle.drivers[version];

/**
 * Escape a value for an XML attribute written between double quotes.
 *
 * @param value - The value.
 * @returns The value with `&`, `<` and `"` as references.
 */
const attributeText = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

/**
 * Write the XML catalog: a `uri` and a `system` entry per pin, each mapping the pin's URL onto its
 * cached file, so an `xs:import` or `xs:include` naming the URL reads the file.
 *
 * @param directory - The cache directory the pins are read from.
 * @returns The catalog's text.
 */
export const catalogText = (directory: string): string =>
  [
    '<?xml version="1.0"?>',
    '<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog">',
    ...sourcePaths.flatMap((source) => {
      const url = attributeText(sources[source].url);
      const file = attributeText(`file://${directory}/${source}`);

      return [
        `  <uri name="${url}" uri="${file}"/>`,
        `  <system systemId="${url}" uri="${file}"/>`,
      ];
    }),
    "</catalog>",
    "",
  ].join("\n");

/**
 * Write a driver schema of a version: its imports, then its probe elements.
 *
 * @param version - The schema version.
 * @param probes - The probe elements it declares, none for a plain driver.
 * @param imports - The namespaces it imports with their pins, every one of the version's when not
 *   given.
 * @returns The schema's text.
 */
export const driverText = (
  version: SchemaVersion,
  probes: readonly ProbeDeclaration[],
  imports: readonly (readonly [namespace: string, source: SourcePath])[] = driverImports[version],
): string => {
  const namespaces = [...new Set(probes.map(({ namespace }) => namespace))];

  return [
    '<?xml version="1.0"?>',
    `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="${driverNamespace}"${namespaces
      .map((namespace, at) => ` xmlns:t${String(at)}="${attributeText(namespace)}"`)
      .join("")}>`,
    ...imports.map(
      ([namespace, source]) =>
        `  <xs:import namespace="${namespace}" schemaLocation="${attributeText(sources[source].url)}"/>`,
    ),
    '  <xs:element name="batch"><xs:complexType><xs:sequence><xs:any namespace="##any" processContents="lax" minOccurs="0" maxOccurs="unbounded"/></xs:sequence></xs:complexType></xs:element>',
    ...probes.map(
      ({ local, namespace, type }) =>
        `  <xs:element name="${local}" type="t${String(namespaces.indexOf(namespace))}:${type}"/>`,
    ),
    "</xs:schema>",
    "",
  ].join("\n");
};

/**
 * Each root driver of a version, one per namespace the version imports, with its path, named by
 * its place in {@link driverImports}.
 *
 * @param directory - The oracle's directory.
 * @param version - The schema version.
 * @returns Each import the driver holds alone, with the driver's path.
 */
const rootDriversOf = (directory: string, version: SchemaVersion) =>
  driverImports[version].map(
    (held, at) => [held, `${directory}/root-${version}-${String(at)}.xsd`] as const,
  );

/**
 * Check every pinned XSD in the cache against its pin, then write the catalog, both versions'
 * union drivers and their root drivers into a directory.
 *
 * @param directory - Where to write them, under the package's `work/`.
 * @param probes - Each version's probe elements, none when not given.
 * @returns The paths written; `XsdSourceMissing` when a pin is not cached, or `XsdSourceMismatch`
 *   when a cached file's bytes differ from its pin.
 */
export const writeXsdOracle = Effect.fn("test.writeXsdOracle")(function* writeXsdOracle(
  directory: string,
  probes: Partial<Readonly<Record<SchemaVersion, readonly ProbeDeclaration[]>>> = {},
) {
  const fs = yield* FileSystem.FileSystem;
  const cache = yield* xsdDirectory;

  yield* checkCache();
  yield* Effect.forEach(
    sourcePaths,
    (source) =>
      fs
        .readFile(`${cache}/${source}`)
        .pipe(Effect.flatMap((bytes) => verifySource(source, bytes))),
    { concurrency: 4, discard: true },
  );
  yield* fs.makeDirectory(directory, { recursive: true });

  const catalog = `${directory}/catalog.xml`;
  const drivers = {
    "3.0.0": `${directory}/driver-3.0.0.xsd`,
    "3.0.1": `${directory}/driver-3.0.1.xsd`,
  } as const satisfies Record<SchemaVersion, string>;

  const roots = {
    "3.0.0": rootDriversOf(directory, "3.0.0"),
    "3.0.1": rootDriversOf(directory, "3.0.1"),
  } as const;

  yield* fs.writeFileString(catalog, catalogText(cache));
  yield* fs.writeFileString(drivers["3.0.0"], driverText("3.0.0", probes["3.0.0"] ?? []));
  yield* fs.writeFileString(drivers["3.0.1"], driverText("3.0.1", probes["3.0.1"] ?? []));
  yield* Effect.forEach(
    schemaVersions.flatMap((version) =>
      roots[version].map(([held, file]) => [version, held, file] as const),
    ),
    ([version, held, file]) => fs.writeFileString(file, driverText(version, [], [held])),
    { discard: true },
  );

  return {
    catalog,
    drivers,
    roots: {
      "3.0.0": new Map(roots["3.0.0"].map(([[namespace], file]) => [namespace, file])),
      "3.0.1": new Map(roots["3.0.1"].map(([[namespace], file]) => [namespace, file])),
    },
  } satisfies XsdOracle;
});

/**
 * The XML Schema namespace, of `xs:import`, `xs:include` and `xs:redefine`.
 */
const xsNamespace = "http://www.w3.org/2001/XMLSchema";

/**
 * Each pin by its URL, the location an `xs:import`, `xs:include` or `xs:redefine` names it at.
 */
const sourceByUrl: ReadonlyMap<string, SourcePath> = new Map(
  sourcePaths.map((source) => [sources[source].url, source]),
);

/**
 * The schema sets read so far, by `version namespace`: a set depends on the pins alone, and the
 * root XSDs it parses are large, so each is read once per run.
 */
const readSets = new Map<string, ReadonlySet<string>>();

/**
 * Read a document's schema set from the pinned XSDs (spec reading 81): the XSD of a version that
 * declares a namespace, and every XSD it imports, includes or redefines, transitively, each
 * `schemaLocation` resolved against the URL of the XSD that names it and read from its pin. The
 * set is the target namespaces of those XSDs, read once per (version, namespace) a run asks for.
 *
 * @param version - The schema version.
 * @param namespace - The root's namespace.
 * @returns The namespaces of the set, none for a namespace no pin of the version declares; dies
 *   when an XSD names a location no pin holds, which the catalog would refuse too.
 */
export const schemaSetOf = Effect.fn("test.schemaSetOf")(function* schemaSetOf(
  version: SchemaVersion,
  namespace: string,
) {
  const known = readSets.get(`${version} ${namespace}`);
  if (known !== undefined) {
    return known;
  }

  const fs = yield* FileSystem.FileSystem;
  const cache = yield* xsdDirectory;
  const root = driverImports[version].find(([held]) => held === namespace);
  const reached = new Set<SourcePath>();
  const namespaces = new Set<string>();
  const pending: SourcePath[] = root === undefined ? [] : [root[1]];

  for (let source = pending.pop(); source !== undefined; source = pending.pop()) {
    if (reached.has(source)) {
      continue;
    }

    reached.add(source);

    const schema = yield* readXml(yield* fs.readFile(`${cache}/${source}`)).pipe(Effect.orDie);
    const base = sources[source].url;
    const target = schema.root.attributes.find(
      ({ local, namespace: held }) => local === "targetNamespace" && held === "",
    );
    if (target !== undefined) {
      namespaces.add(target.value);
    }

    for (const child of schema.root.children) {
      if (
        child.kind === "element" &&
        child.namespace === xsNamespace &&
        ["import", "include", "redefine"].includes(child.local)
      ) {
        const location = child.attributes.find(
          ({ local, namespace: held }) => local === "schemaLocation" && held === "",
        );
        if (location !== undefined) {
          const url = new URL(location.value, base).href;
          const next = sourceByUrl.get(url);
          if (next === undefined) {
            return yield* Effect.die(new Error(`${source} names ${url}, which no pin holds`));
          }

          pending.push(next);
        }
      }
    }
  }

  readSets.set(`${version} ${namespace}`, namespaces);

  return namespaces satisfies ReadonlySet<string>;
});

/**
 * The classes both oracles' refusals are compared in, each a kind of XSD rule:
 *
 * - `vocabulary`: the root is in no pinned vocabulary (xmllint finds no global declaration for it;
 *   the codec has no kind for it);
 * - `well-formed`: the bytes are not well-formed XML;
 * - `attribute-allowed`: an element carries an attribute its type does not declare;
 * - `attribute-required`: an element lacks an attribute its type requires;
 * - `attribute-value`: an attribute's value is outside its type's lexical space;
 * - `content`: an element's children break its content model (a child not expected, one missing,
 *   character data where none may stand), as admission, order, the child sets, arity and the
 *   ancestry bans state it;
 * - `text-value`: a simple-content element's text is outside its type's lexical space;
 * - `identity`: an `xs:ID` repeats or an `xs:IDREF` names no `xs:ID`;
 * - `other`: a message no class above reads, which the comparison reports as it is.
 */
export const refusalClasses = [
  "vocabulary",
  "well-formed",
  "attribute-allowed",
  "attribute-required",
  "attribute-value",
  "content",
  "text-value",
  "identity",
  "other",
] as const;

/**
 * A class of {@link refusalClasses}.
 */
export type RefusalClass = (typeof refusalClasses)[number];

/**
 * The atomic types whose failures, on a value that is a lexically valid NCName, libxml2 reports
 * for a repeated `xs:ID`: it words a duplicate ID as a value its type refuses.
 */
const idTypes =
  /is not a valid value of the atomic type '(?:xs:ID|[^']*UniqueIdentifierDType)'\.$/u;

/**
 * An NCName, as near as a duplicate-ID test needs: a letter or `_`, then letters, digits, `.`,
 * `-` and `_`.
 */
const ncName = /^[\p{L}_][\p{L}\p{N}._-]*$/u;

/**
 * Read the class of a parser message: none for a warning, `attribute-value` for libxml2's own
 * `xml:id` check of a value (the xml:id Recommendation's, of the value, not of the document's
 * form), `identity` for its check that an ID is held once (`ID … already defined`), and
 * `well-formed` for every other error.
 *
 * @param text - The message.
 * @returns Its class.
 */
const parserClassOf = (text: string): Option.Option<RefusalClass> => {
  if (/^\S+ warning :/u.test(text)) {
    return Option.none();
  }

  if (text.startsWith("validity error : xml:id :")) {
    return Option.some("attribute-value");
  }

  return Option.some(
    /validity error : ID [\s\S]* already defined/u.test(text) ? "identity" : "well-formed",
  );
};

/**
 * The structural messages, as libxml2 words them, each with whether it must name an attribute
 * (`undefined` when either may) and its class.
 */
const structuralClasses: readonly (readonly [RegExp, boolean | undefined, RefusalClass])[] = [
  [/No matching global declaration available for the validation root/u, undefined, "vocabulary"],
  [/^The attribute '[^']+' is required but missing\./u, undefined, "attribute-required"],
  [/^The attribute '[^']+' is not allowed\./u, undefined, "attribute-allowed"],
  [/demanded by the strict wildcard/u, true, "attribute-allowed"],
  [/^This element is not expected\./u, undefined, "content"],
  [/^Missing child element\(s\)\./u, undefined, "content"],
  [/^Character content (?:other than whitespace )?is not allowed/u, undefined, "content"],
  [/^Element content is not allowed/u, undefined, "content"],
  [/demanded by the strict wildcard/u, false, "content"],
];

/**
 * Read the class of one of `xmllint`'s messages.
 *
 * @param message - The message.
 * @returns Its class, or none for a warning, which judges nothing.
 */
export const classOfMessage = (message: XsdMessage): Option.Option<RefusalClass> => {
  const { attribute, source, text } = message;

  if (source === "parser") {
    return parserClassOf(text);
  }

  const structural = Arr.findFirst(
    structuralClasses,
    ([pattern, wantsAttribute]) =>
      pattern.test(text) &&
      (wantsAttribute === undefined || wantsAttribute === Option.isSome(attribute)),
  );
  if (Option.isSome(structural)) {
    return Option.some(structural.value[2]);
  }

  if (Option.isSome(attribute)) {
    const value = /^'(?<value>[^']*)' is not a valid value/u.exec(text)?.groups?.["value"];

    return Option.some(
      value !== undefined && ncName.test(value) && idTypes.test(text)
        ? "identity"
        : "attribute-value",
    );
  }

  return Option.some(/is not a valid value|^\[facet '/u.test(text) ? "text-value" : "other");
};

/**
 * What a law refusal is, for the comparison: an XSD rule's class, `beyond` for a law that states a
 * rule beyond the XSDs (a spec reading, a Schematron rule or the information model's prose), or
 * `internal` for a law over the rows' own consistency (keys, mirrors, folds, derived fields), which
 * a document's content can never break and so is always the model's defect.
 */
export type LawClass = RefusalClass | "beyond" | "internal";

/**
 * The class of each law the oracle names a breach by, where the law alone decides it: the laws
 * over the rows' own consistency, which every rule would otherwise misread.
 */
const lawClasses: ReadonlyMap<string, LawClass> = new Map([
  ["AL1 owner", "internal"],
  ["AL2 count", "internal"],
  ["AL2 distinct", "internal"],
  ["AL2 fold", "internal"],
  ["AL4 open name key", "internal"],
  ["AL4 open names", "internal"],
  ["AttributeEntity owner", "internal"],
  ["OpenElementName", "internal"],
  ["comment arm", "internal"],
  ["doctype arm", "internal"],
  ["entityRef arm", "internal"],
  ["pi arm", "internal"],
  ["text arm", "internal"],
  ["ws arm", "internal"],
  ["AL2 last slot", "internal"],
  ["Document", "internal"],
  ["E1 derived", "internal"],
  ["N1 DocumentNode", "internal"],
  ["N1 one document node", "internal"],
  ["N1 sentinel", "internal"],
  ["N2 key", "internal"],
  ["N2 mirrors", "internal"],
  ["N3 rank", "internal"],
  ["N5 first slot", "internal"],
  ["N5 fold", "internal"],
  ["Namespace family", "internal"],
  ["Node key", "internal"],
]);

/**
 * The class of each rule the oracle and the codec name a refusal by, for a law {@link lawClasses}
 * does not decide. A rule not listed states a law beyond the XSDs.
 */
const ruleClasses: ReadonlyMap<string, LawClass> = new Map([
  ["admission", "content"],
  ["ancestry-ban", "content"],
  ["attribute-admission", "attribute-allowed"],
  ["attribute-lexical", "attribute-value"],
  ["body-empty", "content"],
  ["child-set", "content"],
  ["derived", "internal"],
  ["document-key", "identity"],
  ["idref-target", "identity"],
  ["not-qti3", "vocabulary"],
  ["ordering", "content"],
  ["owner-copy", "content"],
  ["P2", "content"],
  ["P28", "content"],
  ["reachability", "internal"],
  ["reader-refusal", "well-formed"],
  ["required-attribute", "attribute-required"],
  ["text-copy", "text-value"],
  ["union-count", "content"],
  ["well-formedness", "well-formed"],
  ["xsi-type", "attribute-value"],
]);

/**
 * Read the class of one law refusal.
 *
 * @param law - The law it breaks.
 * @param rule - The rule it is named by.
 * @returns Its class.
 */
export const classOfLaw = (law: string, rule: string): LawClass =>
  lawClasses.get(law) ?? ruleClasses.get(rule) ?? "beyond";

/**
 * One refusal the law oracle states of a document: the law, the rule it is named by, its class,
 * where it broke and what broke.
 */
export interface LawRefusal {
  readonly class: LawClass;
  readonly detail: string;
  readonly law: string;
  readonly node: string;
  readonly rule: string;
}

/**
 * The law oracle's judgment of one document in one version: its refusals, and whether it
 * `stopped`, because the reader, the codec or a fold refused the document before any law read it,
 * so its one refusal is all it states.
 */
export interface LawJudgment {
  readonly refusals: readonly LawRefusal[];
  readonly stopped: boolean;
}

/**
 * One way the two oracles' judgments of a document differ:
 *
 * - `xsd-only`: `xmllint` refuses the document under a class the law oracle states no refusal of;
 * - `oracle-only`: the law oracle refuses it under an XSD rule's class `xmllint` does not;
 * - `beyond`: the law oracle refuses it under a law beyond the XSDs, which only a recorded reading
 *   justifies;
 * - `internal`: a law over the rows' own consistency broke.
 *
 * `detail` is what the refusing side said: `xmllint`'s messages for `xsd-only`, the breaches'
 * laws, nodes and details otherwise. `rule` is the oracle's rule, empty for `xsd-only`.
 */
export interface Difference {
  readonly class: LawClass;
  readonly detail: string;
  readonly direction: "beyond" | "internal" | "oracle-only" | "xsd-only";
  readonly rule: string;
}

/**
 * How two judgments of one document compare: whether both accept it, both refuse it, or not, and
 * every {@link Difference}. When the law oracle stopped, its one refusal is compared with
 * `xmllint`'s classes, and what `xmllint` says beyond it is `masked`: the oracle never read it.
 * When `xmllint` met an element its parent's content model did not expect, it assessed nothing
 * below it, so a law refusal of a class other than content is not a difference either.
 */
export interface Comparison {
  readonly differences: readonly Difference[];
  readonly lawClasses: readonly LawClass[];
  readonly masked: readonly RefusalClass[];
  readonly verdicts: "accepted by both" | "refused by both" | "xmllint only" | "laws only";
  readonly xsdClasses: readonly RefusalClass[];
}

/**
 * Compare `xmllint`'s verdict on a document with the law oracle's judgment of it, class by class.
 *
 * @param xsd - `xmllint`'s verdict.
 * @param law - The law oracle's judgment.
 * @returns The comparison.
 */
export const compareJudgments = (xsd: XsdVerdict, law: LawJudgment): Comparison => {
  const messages = xsd._tag === "Invalid" ? xsd.messages : [];
  const xsdClasses = [
    ...new Set(messages.flatMap((message) => Option.toArray(classOfMessage(message)))),
  ];
  const lawClassesHeld = [...new Set(law.refusals.map(({ class: cls }) => cls))];
  const xsdRefused = xsd._tag === "Invalid";
  const lawRefused = law.refusals.length > 0;
  const said = (cls: RefusalClass): string =>
    messages
      .filter((message) => Option.contains(classOfMessage(message), cls))
      .map(
        ({ element, line, text }) =>
          `line ${String(line)}${Option.match(element, { onNone: () => "", onSome: (name) => ` ${name}` })}: ${text}`,
      )
      .join(" | ");
  // XML Schema assesses no element its parent's content model did not expect (Part 1, 3.4.4,
  // clause 2.4 and 3.10.4), so below one `xmllint` judges nothing: a law refusal of another class
  // than content there is masked, as `xmllint`'s classes are when the law oracle stops.
  const xsdStopped = messages.some(({ text }) => text.startsWith("This element is not expected."));
  const differences: Difference[] = [
    ...law.refusals.flatMap((refusal): readonly Difference[] => {
      const detail = `${refusal.law} at ${refusal.node === "" ? "/" : refusal.node}: ${refusal.detail}`;

      if (refusal.class === "beyond" || refusal.class === "internal") {
        return [{ class: refusal.class, detail, direction: refusal.class, rule: refusal.rule }];
      }

      return xsdClasses.includes(refusal.class) || (xsdStopped && refusal.class !== "content")
        ? []
        : [{ class: refusal.class, detail, direction: "oracle-only", rule: refusal.rule }];
    }),
    ...(law.stopped
      ? []
      : xsdClasses
          .filter((cls) => !lawClassesHeld.includes(cls))
          .map((cls): Difference => ({
            class: cls,
            detail: said(cls),
            direction: "xsd-only",
            rule: "",
          }))),
  ];
  const verdicts = ((): Comparison["verdicts"] => {
    if (xsdRefused && lawRefused) {
      return "refused by both";
    }

    if (xsdRefused) {
      return "xmllint only";
    }

    return lawRefused ? "laws only" : "accepted by both";
  })();

  return {
    differences,
    lawClasses: lawClassesHeld,
    masked: law.stopped ? xsdClasses.filter((cls) => !lawClassesHeld.includes(cls)) : [],
    verdicts,
    xsdClasses,
  };
};
