/**
 * `openPackage`, the host's one entry from a QTI 3.0 content package's files to its verdict, and
 * the {@link AcceptedPackage} an accepting verdict holds.
 *
 * A package is judged whole (OD-4, per package). Its files are keyed by their normal form and its
 * manifest is read at `imsmanifest.xml`; a refusal of either ends the reading there. The file rules
 * run against the manifest, then each document a resource names is read once, at its `href`:
 *
 * - A resource of one of the four QTI types plate judges, item, test, section and stimulus, has its
 *   document judged as `open` judges one, read by the shared reader and checked against the
 *   committed tables, and keeps that verdict beneath the package's;
 * - A resource of a QTI type with a fixed root (`resourceRoots`) whose document has another root is
 *   `resource-type-mismatch` at the resource (T-h, refuse), which also reads, without judging, the
 *   documents of the three types M3 checks: outcome declarations, response processing and its
 *   templates;
 * - Each test's item refs resolve against the test's own path to an item resource the manifest lists
 *   (`item-ref-unresolved`), and each dotted reference in it that the test does not declare whole
 *   is judged by reading 48 against the items they resolve to, their variable mappings and its
 *   parts and sections: one no reading resolves, or one that reads the `duration` of an item that
 *   is not time dependent, is `undeclared-variable`, and one two readings resolve is
 *   `ambiguous-reference`;
 * - An item or test resource whose own LOM metadata gives identifier entries or title strings gives
 *   one equal to its document's `identifier` and `title` (`lom-identifier` and `lom-title`, reading
 *   62).
 *
 * A resource with no `href`, or with an absolute one (reading 35), names no document the package
 * holds, so nothing of it is read. The package's verdict follows from its parts: `refused` when
 * anything is refused, `unchecked` when nothing is and some document is, then
 * `accepted-with-unsupported` when some document is, and `accepted` otherwise. Only an accepting
 * package's documents are delivered. Like `open`, it runs over the shared reader and the Schema-
 * decoded tables, so it stays server-side.
 *
 * @module
 * @see https://www.imsglobal.org/content/packaging/cpv1p2pd2/imscp_infov1p2pd2.html
 */
import { Brand, Effect, Option, Result } from "effect";
import type { Array as Arr } from "effect";
import { resolveInside, schemePrefix } from "#plate/document/href.ts";
import { readSource } from "#plate/document/read.ts";
import { attributePath, qtiNamespace, walk } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceDocument,
  SourceElement,
  Visit,
} from "#plate/document/source.ts";
import { xsBooleanOf } from "#plate/model/attributes.ts";
import {
  expressionKinds,
  floatOrRefOf,
  integerOrRefOf,
  stringOrRefOf,
} from "#plate/model/expression.ts";
import type { ExpressionKind, LiteralOrRef, ReferenceEntry } from "#plate/model/expression.ts";
import { kindRules } from "#plate/model/expressions/read.ts";
import { itemRefsIn } from "#plate/model/item-refs.ts";
import { isNcName, trimXmlSpace } from "#plate/model/values.ts";
import { readManifest, resourceLom } from "#plate/package/manifest.ts";
import type { LomGeneral, LomValues, Manifest, ManifestResource } from "#plate/package/manifest.ts";
import { checkFiles, fileLocation, manifestFile, packageFiles } from "#plate/package/store.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { Location, RefusalRule } from "#plate/validate/refusal.ts";
import { tables } from "#plate/validate/tables.ts";
import { acceptedItem, check } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedStimulus, AcceptedTest, Verdict } from "#plate/validate/verdict.ts";
import { resourceRoots, resourceTypes } from "#plate/vocabulary.ts";
import type { CpVersion } from "#plate/vocabulary.ts";

/**
 * One item ref of a test, as {@link itemRefs} lists it: its identifier and its `href` as the test
 * model reads them.
 */
export interface ItemRefEntry {
  /**
   * The `href` with its outer whitespace removed and each inner run of it one space, as an
   * `anyURI` reads.
   */
  readonly href: string;
  readonly identifier: string;
}

/**
 * One test of an accepted package, with each of its item refs resolved to the item it names.
 */
export interface PackageTest {
  /**
   * The item of each of its item refs, keyed by the item ref's identifier, in document order: what
   * `startTest` takes as its items. Each item's `document` is its location in the package,
   * `<package location>/<path>`, which is the location `startTest` resolves the ref's `href` to,
   * by one rule on both sides: against the test's location (RFC 3986, section 5.2), each path
   * segment's percent escapes decoded, a malformed escape left as written, then its dot segments
   * removed, and its query and fragment set aside.
   */
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * What an accepted package holds, which only {@link openPackage} and {@link acceptPackageForTest}
 * brand.
 *
 * Every document is keyed by its location, the package's location, a `/` and the document's path
 * from the package's root, which is also the location its verdict and its accepted form carry as
 * `document`. A path is a file's real name, its percent escapes decoded.
 */
export interface PackageContents {
  /**
   * The files a host may serve from the package, by their paths from its root: every file the
   * manifest lists by a path inside the package, except what each resource of a QTI type (an item,
   * a test, a section, a stimulus, outcome declarations, response processing, a response-processing
   * template and a fragment) withholds. Such a resource whose `href` names a file inside the
   * package withholds that file, its document; one without an `href`, or with an absolute one
   * (reading 35), withholds every file it lists, since nothing tells which of them is its document.
   * The manifest is here only when a resource lists it.
   *
   * A QTI document holds what a candidate must not read, an item's correct responses and mappings
   * and the base values of response processing among them, whatever its file is named, so it is
   * left out by the resource that names it, not by its extension; a host reads those documents
   * through the package and serves only what `render` writes. A QTI document listed only by a
   * resource of another type, or as a further file of a QTI resource whose `href` names a file
   * inside the package, stays: no resource names it as a QTI document, and plate reads no other
   * file to find one. What stays is otherwise what an item embeds, its images, media, stylesheets
   * and package documents, which a host serves as live documents (from another origin or under the
   * CSP `sandbox` directive).
   */
  readonly files: ReadonlySet<string>;
  /**
   * Every item resource's item, each deliverable alone as an item outside a package is, a test's
   * items among them.
   */
  readonly items: ReadonlyMap<string, Accepted>;
  /**
   * The package's location, as the host named it.
   */
  readonly location: string;
  /**
   * Every stimulus resource's stimulus, each valid and delivered alone by no stage before M3.
   */
  readonly stimuli: ReadonlyMap<string, AcceptedStimulus>;
  /**
   * Every test resource's test, with its items.
   */
  readonly tests: ReadonlyMap<string, PackageTest>;
  /**
   * The content packaging profile the manifest's `schemaversion` names.
   */
  readonly version: CpVersion;
}

/**
 * A package {@link openPackage} accepted: the only way a host reaches a package's tests with their
 * items.
 *
 * The brand exists only in the type, as `Accepted`'s does: {@link openPackage} is its constructor,
 * and {@link acceptPackageForTest} the one named seam for tests.
 */
export type AcceptedPackage = Brand.Branded<PackageContents, "AcceptedPackage">;

/**
 * The brand's constructor, kept to this module.
 */
const acceptPackage = Brand.nominal<AcceptedPackage>();

/**
 * One resource of a judged package, in the manifest's order, with the verdict on its document.
 */
export interface PackageResource {
  readonly identifier: string;
  /**
   * The path of the document its `href` names, none for a resource with no `href` or an absolute
   * one.
   */
  readonly path: Option.Option<string>;
  /**
   * The type the manifest declares, as written.
   */
  readonly type: string;
  /**
   * The verdict on its document, which `openPackage` gives for an item, test, section or stimulus
   * resource whose document the package holds; none otherwise.
   */
  readonly verdict: Option.Option<Verdict>;
}

/**
 * The verdict on a package as a whole, by `verdict`.
 *
 * - `refused`: the manifest is refused, a file rule fails, a package rule fails or a document is
 *   refused. `refusals` holds every refusal that refuses it: the package's own, then each refused
 *   document's, in the manifest's order, each document once.
 * - `unchecked`: nothing is refused and some document is unchecked.
 * - `accepted-with-unsupported`: nothing is refused or unchecked and some document is accepted with
 *   unsupported features. A package carries no mark of its own in M2.
 * - `accepted`: every document is accepted.
 *
 * `resources` lists every resource with its document's verdict beneath the package's; it is empty
 * when the manifest is not read. `location` is the package's location.
 */
export type PackageVerdict =
  | {
      readonly location: string;
      readonly refusals: Arr.NonEmptyReadonlyArray<Refusal>;
      readonly resources: readonly PackageResource[];
      readonly verdict: "refused";
    }
  | {
      readonly location: string;
      readonly resources: readonly PackageResource[];
      readonly verdict: "unchecked";
    }
  | {
      readonly accepted: AcceptedPackage;
      readonly location: string;
      readonly resources: readonly PackageResource[];
      readonly verdict: "accepted" | "accepted-with-unsupported";
    };

/**
 * One document of the package, read once, with the verdict on it when a resource of a type plate
 * judges names it.
 */
interface Document {
  /**
   * Its source, or the shared reader's refusal of its bytes.
   */
  readonly source: Result.Result<SourceDocument, Refusal>;
  readonly verdict: Option.Option<Verdict>;
}

/**
 * The resource types whose documents plate judges: an item, a test, a section and a stimulus.
 */
const judgedTypes: ReadonlySet<string> = new Set([
  "imsqti_item_xmlv3p0",
  "imsqti_section_xmlv3p0",
  "imsqti_stimulus_xmlv3p0",
  "imsqti_test_xmlv3p0",
]);

/**
 * The QTI resource types, the eight `imsqti_*` types of the profile's `type` enumeration: what a
 * resource of one of these types withholds ({@link withheldFiles}) never reaches `files`.
 */
const qtiTypes: ReadonlySet<string> = new Set(
  Object.values(resourceTypes).flatMap((types) =>
    types.filter((type) => type.startsWith("imsqti_")),
  ),
);

/**
 * The root each QTI resource type with a fixed root names, by type.
 */
const rootOfType: ReadonlyMap<string, string> = new Map<string, string>(resourceRoots);

/**
 * The resource types whose document reading 62 ties to the resource's LOM metadata: an item and a
 * test.
 */
const lomBoundTypes: ReadonlySet<string> = new Set(["imsqti_item_xmlv3p0", "imsqti_test_xmlv3p0"]);

/**
 * The variables every item has besides those it declares (QTI's built-in item variables).
 */
const itemBuiltIns: ReadonlySet<string> = new Set(["completionStatus", "duration", "numAttempts"]);

/**
 * The declarations of an item's variables, by local name in QTI's namespace.
 */
const itemDeclarations: ReadonlySet<string> = new Set([
  "qti-context-declaration",
  "qti-outcome-declaration",
  "qti-response-declaration",
  "qti-template-declaration",
]);

/**
 * The expressions whose `identifier` a test may prefix with an item ref, a part or a section, by
 * local name in QTI's namespace: a variable's value, its correct response and its default.
 */
const referenceElements: ReadonlySet<string> = new Set([
  "qti-correct",
  "qti-default",
  "qti-variable",
]);

/**
 * The item ref, the one element of a test that references an item document, by local name in
 * QTI's namespace.
 */
const itemRefElements: ReadonlySet<string> = new Set(["qti-assessment-item-ref"]);

/**
 * The elements of a test whose identifier names a scope with a `duration`: a part and a section.
 */
const durationScopes: ReadonlySet<string> = new Set(["qti-assessment-section", "qti-test-part"]);

/**
 * The occurrence form of what follows a prefix, `N.VAR`: the variable of the item's Nth instance,
 * `N` counted from 1 as pantry's `prefixedReadings` reads it
 * (`packages/pantry/src/processing/prefixed.ts`). So `0.VAR` is no occurrence: it names the
 * variable `0.VAR`, which no item has, since an identifier never starts with a digit.
 */
const occurrenceForm = /^0*[1-9]\d*\.(?<variable>.+)$/su;

/**
 * The variables a test's processing holds besides those it declares, as pantry gives a test its
 * built-ins (`builtInsOf("test")` in `packages/pantry/src/processing/env.ts`).
 */
const testBuiltIns: ReadonlySet<string> = new Set([
  "QTI_CONTEXT",
  "completionStatus",
  "duration",
  "numAttempts",
]);

/**
 * The declarations of a test's variables, by local name in QTI's namespace: an outcome variable
 * and a context variable.
 */
const testDeclarations: ReadonlySet<string> = new Set([
  "qti-context-declaration",
  "qti-outcome-declaration",
]);

/**
 * The child of an item ref that names one of its item's variables by another name the test reads
 * it by, by local name in QTI's namespace.
 */
const mappingElements: ReadonlySet<string> = new Set(["qti-variable-mapping"]);

/**
 * Each expression kind, by its element's local name in QTI's namespace.
 */
const kindsByElement: ReadonlyMap<string, ExpressionKind> = new Map(
  expressionKinds.map((kind) => [`qti-${kind}`, kind] as const),
);

/**
 * Classify one value of a reference attribute as the literal or the reference it holds, through
 * the classifier of the base type its facet entry names, the one the item model's reader and the
 * validator use (`#plate/model/expression.ts`). Only the string classifier reads the names it is
 * given: a `pattern` is a reference only as a braced name of a variable held (ruling R1).
 */
const classifiers = {
  float: floatOrRefOf,
  integer: integerOrRefOf,
  string: stringOrRefOf,
} as const satisfies Record<
  ReferenceEntry["baseType"],
  (written: string, held: ReadonlySet<string>) => LiteralOrRef<unknown>
>;

/**
 * A run of XML whitespace inside an attribute value.
 */
const xmlWhitespaceRun = /[\t\n\r ]+/gu;

/**
 * Collapse a value's XML whitespace: its outer whitespace removed and each inner run of it one
 * space.
 *
 * @param value The value as written.
 * @returns The value collapsed.
 */
const collapse = (value: string): string => trimXmlSpace(value).replaceAll(xmlWhitespaceRun, " ");

/**
 * Construct a refusal the package reader gives.
 *
 * @param document The location of the document it refuses.
 * @param rule The rule it breaks.
 * @param path The path in that document of the element or attribute at issue.
 * @param detail The facts the verdict's wording reads.
 * @returns The refusal.
 */
const refuse = (
  document: string,
  rule: RefusalRule,
  path: string,
  detail: Readonly<Record<string, string>>,
): Refusal => {
  const location: Location = { kind: "path", path };

  return new Refusal({
    detail,
    document,
    location,
    readerRule: Option.none(),
    rule,
    suggestion: Option.none(),
  });
};

/**
 * Give an element's attribute in no namespace, as written.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns Its value, none when the element has no such attribute.
 */
const attributeOf = (element: SourceElement, local: string): Option.Option<string> =>
  Option.fromUndefinedOr(
    element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === local)
      ?.value,
  );

/**
 * Give an element's identifier, its outer XML whitespace removed, as an NCName reads.
 *
 * @param element The element.
 * @returns The identifier, none when it has none.
 */
const identifierOf = (element: SourceElement): Option.Option<string> =>
  attributeOf(element, "identifier").pipe(Option.map(trimXmlSpace));

/**
 * Report whether an element is the QTI element with a local name in a set.
 *
 * @param element The element.
 * @param locals The local names.
 * @returns Whether it is in QTI's namespace and its local name is one of them.
 */
const isQti = (element: SourceElement, locals: ReadonlySet<string>): boolean =>
  element.namespace === qtiNamespace && locals.has(element.local);

/**
 * Name a document's root as a refusal's detail names it: its local name in QTI's namespace,
 * `{<namespace>}<local>` otherwise, as a path step spells it.
 *
 * @param root The root.
 * @returns Its name.
 */
const rootName = (root: SourceElement): string =>
  root.namespace === qtiNamespace ? root.local : `{${root.namespace}}${root.local}`;

/**
 * Give the path of the document a resource's `href` names.
 *
 * @param resource The resource.
 * @returns The path, none for no `href` or an absolute one.
 */
const documentPath = (resource: ManifestResource): Option.Option<string> =>
  resource.href.pipe(Option.flatMap((href) => href.path));

/**
 * Give the paths of the files a resource of a QTI type withholds from `files`: the document its
 * `href` names inside the package, or, when it has no `href` or an absolute one (reading 35),
 * every file it lists, since nothing tells which of them is its document.
 *
 * @param resource The resource, of a QTI type.
 * @returns The withheld paths.
 */
const withheldFiles = (resource: ManifestResource): readonly string[] =>
  Option.match(documentPath(resource), {
    onNone: () => resource.files.flatMap((file) => Option.toArray(file.path)),
    onSome: (path) => [path],
  });

/**
 * Resolve a reference a document makes against the document's own path through
 * {@link resolveInside}, by the rule the manifest resolves an `href` by and `startTest` an item
 * ref's.
 *
 * @param base The referring document's path from the package's root.
 * @param reference The reference as written.
 * @returns The path it names from the package's root; none for an absolute URI, a path from a
 *   host's root, or one whose `..` climbs above the package's root.
 */
const resolveReference = (base: string, reference: string): Option.Option<string> =>
  schemePrefix.test(reference)
    ? Option.none()
    : Option.map(resolveInside(base.split("/"), reference), (segments) => segments.join("/"));

/**
 * Give the verdict `open` gives a document from its reading: the reader's refusal as a refused
 * verdict of kind `none`, or `check`'s verdict against the committed tables.
 *
 * @param location The document's location.
 * @param source Its reading.
 * @returns The verdict on it.
 */
const judge = (location: string, source: Result.Result<SourceDocument, Refusal>): Verdict =>
  Result.isFailure(source)
    ? { document: location, kind: "none", refusals: [source.failure], verdict: "refused" }
    : check(source.success, tables);

/**
 * Read each document the manifest's QTI resources name, once, and judge each one a resource of a
 * judged type names.
 *
 * @param manifest The manifest.
 * @param files The package's files, keyed by normal form.
 * @param location The package's location.
 * @returns Each document the package holds, keyed by path, in the order the manifest first names
 *   it.
 */
const readDocuments = Effect.fnUntraced(function* readDocuments(
  manifest: Manifest,
  files: ReadonlyMap<string, Uint8Array>,
  location: string,
): Effect.fn.Return<ReadonlyMap<string, Document>> {
  const judged = new Map<string, boolean>();
  for (const resource of manifest.resources) {
    if (judgedTypes.has(resource.type) || rootOfType.has(resource.type)) {
      for (const path of Option.toArray(documentPath(resource))) {
        judged.set(path, (judged.get(path) ?? false) || judgedTypes.has(resource.type));
      }
    }
  }

  const documents = new Map<string, Document>();
  for (const [path, isJudged] of judged) {
    const bytes = files.get(path);
    if (bytes !== undefined) {
      const documentLocation = fileLocation(location, path);
      const source = yield* Effect.result(readSource(documentLocation, bytes));
      documents.set(path, {
        source,
        verdict: isJudged ? Option.some(judge(documentLocation, source)) : Option.none(),
      });
    }
  }

  return documents;
});

/**
 * Compare each resource's declared type with its document's root (T-h).
 *
 * A resource of a type `resourceRoots` pairs with a root, whose document the package holds and the
 * reader read, is `resource-type-mismatch` at the resource when the document's root is another.
 * The detail names the declared `type`, the document's `path`, the `root` found and, when exactly
 * one type names that root, that type as `expected`. A fragment names no root and is never
 * compared. A document the reader cannot read has no root to compare: a judged document's own
 * verdict refuses it, and one of the three types M3 checks is passed over, as plate does not judge
 * those documents.
 *
 * @param manifest The manifest.
 * @param documents The package's documents.
 * @param manifestLocation The manifest's location, which each refusal carries.
 * @returns The refusals, in the manifest's order.
 */
const checkRoots = (
  manifest: Manifest,
  documents: ReadonlyMap<string, Document>,
  manifestLocation: string,
): readonly Refusal[] =>
  manifest.resources.flatMap((resource) => {
    const expected = rootOfType.get(resource.type);
    const path = Option.getOrUndefined(documentPath(resource));
    const source = path === undefined ? undefined : documents.get(path)?.source;
    if (
      expected === undefined ||
      path === undefined ||
      source === undefined ||
      Result.isFailure(source)
    ) {
      return [];
    }

    const { root } = source.success;
    if (root.namespace === qtiNamespace && root.local === expected) {
      return [];
    }

    const found = rootName(root);
    const facts = { path, root: found, type: resource.type };
    const [only, ...others] = resourceRoots
      .filter(([, named]) => named === found)
      .map(([type]) => type);

    return [
      refuse(
        manifestLocation,
        "resource-type-mismatch",
        resource.location,
        only === undefined || others.length > 0 ? facts : { expected: only, ...facts },
      ),
    ];
  });

/**
 * Compare each item and test resource's own LOM metadata with its document's `identifier` and
 * `title` (reading 62).
 *
 * Each `general` of the resource's LOM that gives identifier entries must give one equal to the
 * document's `identifier`, or the resource is `lom-identifier` at the `general`'s first
 * `identifier`; one that gives title strings must give one equal to its `title`, or it is
 * `lom-title` at its first `title`. Both sides are compared with their whitespace collapsed. The
 * detail names the `resource`, the document's `path`, its `identifier` or `title`, the first LOM
 * value as `metadata`, how many other values there are as `others` when there are any, and the
 * `reading`, each value collapsed. A `general` that gives neither is outside the rule, and so is a
 * document the reader cannot read, one whose root is not the one its type names (`checkRoots`
 * refuses it) and one that lacks the attribute (its own verdict refuses it).
 *
 * @param manifest The manifest.
 * @param lom Each resource's LOM generals, keyed by its location.
 * @param documents The package's documents.
 * @param manifestLocation The manifest's location, which each refusal carries.
 * @returns The refusals, in the manifest's order, each `general`'s identifier before its title.
 */
const checkLom = (
  manifest: Manifest,
  lom: ReadonlyMap<string, readonly LomGeneral[]>,
  documents: ReadonlyMap<string, Document>,
  manifestLocation: string,
): readonly Refusal[] =>
  manifest.resources.flatMap((resource) => {
    const expected = lomBoundTypes.has(resource.type) ? rootOfType.get(resource.type) : undefined;
    const path = Option.getOrUndefined(documentPath(resource));
    const source = path === undefined ? undefined : documents.get(path)?.source;
    if (
      expected === undefined ||
      path === undefined ||
      source === undefined ||
      Result.isFailure(source)
    ) {
      return [];
    }

    const { root } = source.success;
    if (root.namespace !== qtiNamespace || root.local !== expected) {
      return [];
    }

    /**
     * Refuse the values one LOM `general` gives for an attribute when none equals the document's.
     *
     * @param rule The rule a mismatch breaks.
     * @param attribute The document's attribute the values describe.
     * @param given The values the `general` gives, none when it gives none.
     * @returns The refusal, or none when a value matches, the `general` gives none or the
     *   document has no such attribute.
     */
    const compare = (
      rule: "lom-identifier" | "lom-title",
      attribute: "identifier" | "title",
      given: Option.Option<LomValues>,
    ): readonly Refusal[] => {
      const own = Option.getOrUndefined(Option.map(attributeOf(root, attribute), collapse));
      const values = Option.getOrUndefined(given);
      if (
        own === undefined ||
        values === undefined ||
        values.values.some((value) => collapse(value) === own)
      ) {
        return [];
      }

      const facts = {
        [attribute]: own,
        metadata: collapse(values.values[0]),
        path,
        reading: "62",
        resource: resource.identifier,
      };
      const others = values.values.length - 1;

      return [
        refuse(
          manifestLocation,
          rule,
          values.location,
          others > 0 ? { ...facts, others: others.toString() } : facts,
        ),
      ];
    };

    return (lom.get(resource.location) ?? []).flatMap((general) => [
      ...compare("lom-identifier", "identifier", general.identifier),
      ...compare("lom-title", "title", general.title),
    ]);
  });

/**
 * What a reading of a dotted reference may name through an item ref, read from its item's
 * document.
 */
interface ItemVariables {
  /**
   * The identifiers of the variables the item declares.
   */
  readonly declared: ReadonlySet<string>;
  /**
   * Whether the item's `time-dependent` reads false as `xs:boolean`, so that no expression may
   * read its `duration`. One that is absent or outside `xs:boolean` is the item's own verdict's
   * refusal and does not make the item untimed here.
   */
  readonly untimed: boolean;
}

/**
 * Read what a reading of a dotted reference may name through an item ref from its item's document:
 * the variables it declares, and whether it is time dependent.
 *
 * @param document The item's document.
 * @returns Its variables, none when the document is unread or its root is not an item.
 */
const variablesOf = (document: Document | undefined): Option.Option<ItemVariables> => {
  if (document === undefined || Result.isFailure(document.source)) {
    return Option.none();
  }

  const { root } = document.source.success;
  if (root.namespace !== qtiNamespace || root.local !== "qti-assessment-item") {
    return Option.none();
  }

  const declared = root.children.flatMap((child) =>
    child.kind === "element" && isQti(child, itemDeclarations)
      ? Option.toArray(identifierOf(child))
      : [],
  );

  return Option.some({
    declared: new Set(declared),
    untimed: Option.exists(
      Option.flatMap(attributeOf(root, "time-dependent"), xsBooleanOf),
      (timeDependent) => !timeDependent,
    ),
  });
};

/**
 * What a reading of a dotted reference may name through one resolved item ref: its item's
 * variables, and the targets of the item ref's variable mappings whose source the item declares,
 * as pantry's reach holds them (`testProcessingRows` in `packages/pantry/src/import/reference.ts`).
 */
interface ItemRefVariables extends ItemVariables {
  readonly mapped: ReadonlySet<string>;
}

/**
 * What a test's dotted references resolve against: each resolved item ref's variables, and the
 * identifiers of its parts and sections.
 */
interface ReferenceScope {
  readonly durations: ReadonlySet<string>;
  readonly items: ReadonlyMap<string, ItemRefVariables>;
}

/**
 * One reading of a dotted reference that resolves (reading 48): the item ref, part or section its
 * prefix names, and the rest, as written.
 */
interface Reading {
  readonly prefix: string;
  readonly rest: string;
  /**
   * Whether it reads the built-in `duration` of an item that is not time dependent, which "must
   * not be used in any item or test-level expression" (`info-compact.txt:8472`).
   */
  readonly untimed: boolean;
}

/**
 * Resolve one reading of a dotted reference (reading 48), in pantry's order (`resolveReading` in
 * `packages/pantry/src/processing/env.ts`).
 *
 * After an item ref, the rest names, directly or in the occurrence form `N.VAR` (reading 4), a
 * target of the item ref's variable mappings, else a variable its item declares, else one of the
 * built-ins every item has. After a part or a section, the rest is its `duration`.
 *
 * @param scope What the test's references resolve against.
 * @param prefix The part before the dot the reading splits at.
 * @param rest The part after it.
 * @returns The reading, none when it does not resolve.
 */
const readingOf = (scope: ReferenceScope, prefix: string, rest: string): Option.Option<Reading> => {
  const item = scope.items.get(prefix);
  if (item === undefined) {
    return scope.durations.has(prefix) && rest === "duration"
      ? Option.some({ prefix, rest, untimed: false })
      : Option.none();
  }

  const variable = occurrenceForm.exec(rest)?.groups?.["variable"] ?? rest;
  if (item.mapped.has(variable) || item.declared.has(variable)) {
    return Option.some({ prefix, rest, untimed: false });
  }

  return itemBuiltIns.has(variable)
    ? Option.some({ prefix, rest, untimed: item.untimed && variable === "duration" })
    : Option.none();
};

/**
 * Give every reading of a dotted reference that resolves, one for each dot it may split at, from
 * the first dot.
 *
 * @param scope What the test's references resolve against.
 * @param reference The reference.
 * @returns Each resolving reading.
 */
const readingsOf = (scope: ReferenceScope, reference: string): readonly Reading[] => {
  const readings: Reading[] = [];
  for (let dot = reference.indexOf("."); dot !== -1; dot = reference.indexOf(".", dot + 1)) {
    readings.push(
      ...Option.toArray(readingOf(scope, reference.slice(0, dot), reference.slice(dot + 1))),
    );
  }

  return readings;
};

/**
 * Give the variable mappings an item ref holds, each its `source-identifier` and its
 * `target-identifier`, in document order. One that lacks either names nothing here, and is its
 * test's own verdict's refusal.
 *
 * @param itemRef The item ref.
 * @returns Each mapping's source and target.
 */
const mappingsOf = (
  itemRef: SourceElement,
): readonly (readonly [source: string, target: string])[] =>
  itemRef.children.flatMap((child) =>
    child.kind === "element" && isQti(child, mappingElements)
      ? Option.toArray(
          Option.all([
            attributeOf(child, "source-identifier"),
            attributeOf(child, "target-identifier"),
          ]).pipe(Option.map(([from, to]) => [trimXmlSpace(from), trimXmlSpace(to)] as const)),
        )
      : [],
  );

/**
 * One attribute of an element of a test that names a variable, with the name.
 */
interface NamedReference {
  readonly attribute: SourceAttribute;
  readonly identifier: string;
}

/**
 * Give each variable an element of a test names, in the element's attribute order: the
 * `identifier` of a `qti-variable`, `qti-correct` or `qti-default`, and each value of a reference
 * attribute its expression kind's reference facet checks, as pantry's `referenceAttributes` lists
 * them (`figures`, `max`, `min`, `n`, `number-repeats`, `pattern` and `step`;
 * `packages/pantry/src/processing/check.ts`).
 *
 * A literal names no variable, and a `pattern` names one only as a braced name of a variable the
 * test holds (ruling R1). A name that is no NCName is the structure check's refusal, so it is
 * passed over.
 *
 * @param element The element.
 * @param held Whether the test holds a variable by a name: declares it whole, holds it as a
 *   built-in, or resolves it by a reading.
 * @returns The variables it names.
 */
const referencesOf = (
  element: SourceElement,
  held: (name: string) => boolean,
): readonly NamedReference[] => {
  if (element.namespace !== qtiNamespace) {
    return [];
  }

  const kind = kindsByElement.get(element.local);
  const entries = kind === undefined ? [] : kindRules[kind].references;

  return element.attributes.flatMap((attribute) => {
    if (attribute.namespace !== "") {
      return [];
    }

    if (attribute.local === "identifier" && referenceElements.has(element.local)) {
      const identifier = trimXmlSpace(attribute.value);

      return isNcName(identifier) ? [{ attribute, identifier }] : [];
    }

    const entry = entries.find((one) => one.checked && one.attribute === attribute.local);
    if (entry === undefined) {
      return [];
    }

    const values = entry.list
      ? attribute.value.split(xmlWhitespaceRun).filter((token) => token !== "")
      : [attribute.value];

    return values.flatMap((value) => {
      const classified = classifiers[entry.baseType](
        value,
        new Set([value.slice(1, -1)].filter(held)),
      );

      return classified._tag === "ref" && isNcName(classified.identifier)
        ? [{ attribute, identifier: classified.identifier }]
        : [];
    });
  });
};

/**
 * Judge one dotted reference of a test, which the test does not hold whole, by reading 48, as
 * pantry's `reference` judges a prefixed name (`packages/pantry/src/processing/check.ts`).
 *
 * A reference no reading resolves is `undeclared-variable` with `check: "reading"` and the
 * `reading`, pantry's `prefixed-ref` with no reading. One two readings resolve is
 * `ambiguous-reference`, its detail the `reference` and its first two resolving readings, prefix
 * and variable each, pantry's `prefixed-ref` with its readings. One whose one reading reads the
 * built-in `duration` of an item that is not time dependent is `undeclared-variable` with `check:
 * "untimed-duration"`, pantry's `item-duration`. Each is at the attribute; an
 * `undeclared-variable` names the `element`, the `identifier` as written and, for an attribute
 * other than `identifier`, the `attribute`.
 *
 * @param document The test's location.
 * @param visit The element's visit.
 * @param reference The attribute and the name it holds.
 * @param scope What the test's references resolve against.
 * @returns The refusal, none when exactly one reading resolves it and that one may be read.
 */
const judgeReference = (
  document: string,
  visit: Visit,
  reference: NamedReference,
  scope: ReferenceScope,
): readonly Refusal[] => {
  const { attribute, identifier } = reference;
  const path = attributePath(visit.path, attribute);
  const element = visit.element.local;
  const named =
    attribute.local === "identifier"
      ? { element, identifier }
      : { attribute: attribute.local, element, identifier };
  const [first, second] = readingsOf(scope, identifier);
  if (first === undefined) {
    return [
      refuse(document, "undeclared-variable", path, { ...named, check: "reading", reading: "48" }),
    ];
  }

  if (second !== undefined) {
    return [
      refuse(document, "ambiguous-reference", path, {
        firstPrefix: first.prefix,
        firstVariable: first.rest,
        reading: "48",
        reference: identifier,
        secondPrefix: second.prefix,
        secondVariable: second.rest,
      }),
    ];
  }

  return first.untimed
    ? [refuse(document, "undeclared-variable", path, { ...named, check: "untimed-duration" })]
    : [];
};

/**
 * What judging one test gives: each item ref's item path, keyed by the item ref's identifier, in
 * document order, and the test's refusals, the item refs' then the references', each in document
 * order.
 */
interface TestJudgement {
  readonly refs: ReadonlyMap<string, string>;
  readonly refusals: readonly Refusal[];
}

/**
 * Judge one test document of the package: each item ref resolved against the test's path to an item
 * resource the manifest lists, then each dotted reference by reading 48.
 *
 * An item ref that resolves to no listed item resource is `item-ref-unresolved` at the item ref,
 * its detail the `identifier`, the `href` and, when the `href` names a path inside the package,
 * that `path`. A reference the test declares whole, as an outcome or context variable (reading 37
 * lets an identifier hold `.`), or holds as a built-in is never split, and a name with no `.` is
 * the test's own check's; every other is judged by {@link judgeReference}. An item ref resolves a
 * reading only through an item whose document the package holds and the reader read, so a
 * reference through any other names nothing, as pantry's reach holds no such item ref.
 *
 * @param source The test's source.
 * @param testPath The test's path.
 * @param itemPaths The path of every item resource's document.
 * @param documents The package's documents.
 * @returns The item refs' item paths and the refusals.
 */
const judgeTest = (
  source: SourceDocument,
  testPath: string,
  itemPaths: ReadonlySet<string>,
  documents: ReadonlyMap<string, Document>,
): TestJudgement => {
  const visits = [...walk(source)];
  const refs = new Map<string, string>();
  const mappings = new Map<string, readonly (readonly [source: string, target: string])[]>();
  const unresolved: Refusal[] = [];
  const durations = new Set<string>();
  for (const { element, path } of visits) {
    const identifier = Option.getOrUndefined(identifierOf(element));
    const href = Option.getOrUndefined(attributeOf(element, "href"));
    if (identifier !== undefined && isQti(element, durationScopes)) {
      durations.add(identifier);
    } else if (identifier !== undefined && href !== undefined && isQti(element, itemRefElements)) {
      const written = collapse(href);
      const resolved = resolveReference(testPath, written);
      if (Option.isSome(resolved) && itemPaths.has(resolved.value)) {
        refs.set(identifier, resolved.value);
        mappings.set(identifier, mappingsOf(element));
      } else {
        const facts = { href: written, identifier };
        unresolved.push(
          refuse(
            source.location,
            "item-ref-unresolved",
            path,
            Option.match(resolved, {
              onNone: () => facts,
              onSome: (resolvedPath) => ({ ...facts, path: resolvedPath }),
            }),
          ),
        );
      }
    }
  }

  const items = new Map<string, ItemRefVariables>();
  for (const [identifier, itemPath] of refs) {
    for (const variables of Option.toArray(variablesOf(documents.get(itemPath)))) {
      items.set(identifier, {
        ...variables,
        mapped: new Set(
          (mappings.get(identifier) ?? []).flatMap(([from, to]) =>
            variables.declared.has(from) ? [to] : [],
          ),
        ),
      });
    }
  }

  const scope: ReferenceScope = { durations, items };
  const whole: ReadonlySet<string> = new Set([
    ...testBuiltIns,
    ...source.root.children.flatMap((child) =>
      child.kind === "element" && isQti(child, testDeclarations)
        ? Option.toArray(identifierOf(child))
        : [],
    ),
  ]);
  const held = (name: string): boolean => whole.has(name) || readingsOf(scope, name).length > 0;
  const references = visits.flatMap((visit) =>
    referencesOf(visit.element, held).flatMap((reference) =>
      whole.has(reference.identifier) || !reference.identifier.includes(".")
        ? []
        : judgeReference(source.location, visit, reference, scope),
    ),
  );

  return { refs, refusals: [...unresolved, ...references] };
};

/**
 * Give the paths of the documents the manifest's resources of one type name, each once, in the
 * manifest's order.
 *
 * @param manifest The manifest.
 * @param type The resource type.
 * @returns The paths.
 */
const pathsOfType = (manifest: Manifest, type: string): readonly string[] => [
  ...new Set(
    manifest.resources
      .filter((resource) => resource.type === type)
      .flatMap((resource) => Option.toArray(documentPath(resource))),
  ),
];

/**
 * Give the verdict on the document at a path, none when the package holds none there or no
 * resource of a judged type names it.
 *
 * @param documents The package's documents.
 * @param path The document's path.
 * @returns Its verdict.
 */
const verdictAt = (
  documents: ReadonlyMap<string, Document>,
  path: string,
): Option.Option<Verdict> =>
  Option.fromUndefinedOr(documents.get(path)).pipe(Option.flatMap((document) => document.verdict));

/**
 * Give the accepted test of a verdict that accepts a test.
 *
 * @param verdict The verdict.
 * @returns The test, none for any other verdict.
 */
const acceptedTest = (verdict: Verdict): Option.Option<AcceptedTest> =>
  (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
  verdict.kind === "test"
    ? Option.some(verdict.accepted)
    : Option.none();

/**
 * Give the accepted stimulus of a verdict that accepts a stimulus.
 *
 * @param verdict The verdict.
 * @returns The stimulus, none for any other verdict.
 */
const acceptedStimulus = (verdict: Verdict): Option.Option<AcceptedStimulus> =>
  (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
  verdict.kind === "stimulus"
    ? Option.some(verdict.accepted)
    : Option.none();

/**
 * Key what each of some paths finds by its document's location, passing over a path that finds
 * nothing, and keeping the first of two that find one document.
 *
 * @param paths The paths, in order.
 * @param find What a path finds.
 * @param documentOf The location of what was found.
 * @returns What each path found, keyed by its location, in the paths' order.
 */
const byDocument = <A>(
  paths: readonly string[],
  find: (path: string) => Option.Option<A>,
  documentOf: (found: A) => string,
): ReadonlyMap<string, A> => {
  const found = new Map<string, A>();
  for (const value of paths.flatMap((path) => Option.toArray(find(path)))) {
    if (!found.has(documentOf(value))) {
      found.set(documentOf(value), value);
    }
  }

  return found;
};

/**
 * Build the contents of an accepted package from its judged documents.
 *
 * @param manifest The manifest.
 * @param documents The package's documents, every judged one accepted.
 * @param tests Each test's item paths, by item ref identifier, keyed by the test's path.
 * @param location The package's location.
 * @returns The contents.
 */
const contentsOf = (
  manifest: Manifest,
  documents: ReadonlyMap<string, Document>,
  tests: ReadonlyMap<string, ReadonlyMap<string, string>>,
  location: string,
): PackageContents => {
  /**
   * Give the accepted item of the document at a path.
   *
   * @param path The document's path.
   * @returns Its item, none when no accepted item document is there.
   */
  const itemAt = (path: string): Option.Option<Accepted> =>
    verdictAt(documents, path).pipe(Option.flatMap(acceptedItem));

  const withheld = new Set(
    manifest.resources.flatMap((resource) =>
      qtiTypes.has(resource.type) ? withheldFiles(resource) : [],
    ),
  );

  return {
    files: new Set(
      manifest.resources.flatMap((resource) =>
        resource.files.flatMap((file) =>
          Option.toArray(file.path).filter((path) => !withheld.has(path)),
        ),
      ),
    ),
    items: byDocument(
      pathsOfType(manifest, "imsqti_item_xmlv3p0"),
      itemAt,
      (item) => item.document,
    ),
    location,
    stimuli: byDocument(
      pathsOfType(manifest, "imsqti_stimulus_xmlv3p0"),
      (path) => verdictAt(documents, path).pipe(Option.flatMap(acceptedStimulus)),
      (stimulus) => stimulus.document,
    ),
    tests: byDocument(
      pathsOfType(manifest, "imsqti_test_xmlv3p0"),
      (path) =>
        verdictAt(documents, path).pipe(
          Option.flatMap(acceptedTest),
          Option.map((test): PackageTest => ({
            items: new Map(
              [...(tests.get(path) ?? new Map<string, string>())].flatMap(
                ([identifier, itemPath]) =>
                  Option.toArray(
                    itemAt(itemPath).pipe(Option.map((item) => [identifier, item] as const)),
                  ),
              ),
            ),
            test,
          })),
        ),
      (entry) => entry.test.document,
    ),
    version: manifest.version,
  };
};

/**
 * Judge a package whose manifest is read: the file rules, the documents, the roots, the LOM
 * metadata and the tests, then the verdict over them.
 *
 * @param manifest The manifest.
 * @param lom Each resource's LOM generals, keyed by its location.
 * @param files The package's files, as the host gave them.
 * @param held The package's files, keyed by normal form.
 * @param location The package's location.
 * @returns The package's verdict.
 */
const judgeContents = Effect.fnUntraced(function* judgeContents(
  manifest: Manifest,
  lom: ReadonlyMap<string, readonly LomGeneral[]>,
  files: ReadonlyMap<string, Uint8Array>,
  held: ReadonlyMap<string, Uint8Array>,
  location: string,
): Effect.fn.Return<PackageVerdict> {
  const fileRules = checkFiles(manifest, files, location);
  const documents = yield* readDocuments(manifest, held, location);
  const itemPaths = new Set(pathsOfType(manifest, "imsqti_item_xmlv3p0"));
  const tests = new Map<string, ReadonlyMap<string, string>>();
  const testRefusals: Refusal[] = [];
  for (const path of pathsOfType(manifest, "imsqti_test_xmlv3p0")) {
    const source = documents.get(path)?.source;
    if (
      source !== undefined &&
      Result.isSuccess(source) &&
      source.success.root.namespace === qtiNamespace &&
      source.success.root.local === "qti-assessment-test"
    ) {
      const judged = judgeTest(source.success, path, itemPaths, documents);
      tests.set(path, judged.refs);
      testRefusals.push(...judged.refusals);
    }
  }

  const verdicts = [...documents.values()].flatMap((document) => Option.toArray(document.verdict));
  const resources = manifest.resources.map((resource): PackageResource => {
    const path = documentPath(resource);

    return {
      identifier: resource.identifier,
      path,
      type: resource.type,
      verdict: judgedTypes.has(resource.type)
        ? path.pipe(Option.flatMap((value) => verdictAt(documents, value)))
        : Option.none(),
    };
  });
  const [first, ...rest] = [
    ...(Result.isFailure(fileRules) ? fileRules.failure : []),
    ...checkRoots(manifest, documents, fileLocation(location, manifestFile)),
    ...checkLom(manifest, lom, documents, fileLocation(location, manifestFile)),
    ...testRefusals,
    ...verdicts.flatMap((verdict) => (verdict.verdict === "refused" ? verdict.refusals : [])),
  ];
  if (first !== undefined) {
    return { location, refusals: [first, ...rest], resources, verdict: "refused" };
  }

  if (verdicts.some((verdict) => verdict.verdict === "unchecked")) {
    return { location, resources, verdict: "unchecked" };
  }

  return {
    accepted: acceptPackage(contentsOf(manifest, documents, tests, location)),
    location,
    resources,
    verdict: verdicts.some((verdict) => verdict.verdict === "accepted-with-unsupported")
      ? "accepted-with-unsupported"
      : "accepted",
  };
});

/**
 * The verdict on a package whose reading ends before its documents: refused, with no resources.
 *
 * @param location The package's location.
 * @param refusals Why it ends.
 * @returns The verdict.
 */
const refusedUnread = (
  location: string,
  refusals: Arr.NonEmptyReadonlyArray<Refusal>,
): PackageVerdict => ({ location, refusals, resources: [], verdict: "refused" });

/**
 * Read a package's manifest, then judge the package.
 *
 * @param location The package's location.
 * @param files The package's files, as the host gave them.
 * @returns The package's verdict.
 */
const readPackage = Effect.fnUntraced(function* readPackage(
  location: string,
  files: ReadonlyMap<string, Uint8Array>,
): Effect.fn.Return<PackageVerdict> {
  const held = packageFiles(files, location);
  if (Result.isFailure(held)) {
    return refusedUnread(location, held.failure);
  }

  // `packageFiles` refuses a package without its manifest, so the empty fallback is never read.
  const bytes = held.success.get(manifestFile) ?? new Uint8Array();
  const source = yield* Effect.result(readSource(fileLocation(location, manifestFile), bytes));
  if (Result.isFailure(source)) {
    return refusedUnread(location, [source.failure]);
  }

  const manifest = readManifest(source.success);
  if (Result.isFailure(manifest)) {
    return refusedUnread(location, manifest.failure);
  }

  return yield* judgeContents(
    manifest.success,
    resourceLom(source.success),
    files,
    held.success,
    location,
  );
});

/**
 * Open a package: read its manifest, then judge its files, its documents and its tests, into one
 * verdict over the whole package.
 *
 * It never fails, because a refusal is a verdict. A key that leaves the package's root, a package
 * without `imsmanifest.xml` at its root, a manifest the reader cannot read and a manifest
 * `readManifest` refuses each end the reading with those refusals and no resources. Otherwise every
 * rule runs and every refusal is reported. Nothing but its two inputs decides the result.
 *
 * @param location The package's location as the host named it. Each file's location is it, then
 *   `/`, then the file's path, which each document's verdict and each refusal of a file carry.
 * @param files The package's files keyed by their paths from its root, as the host unzipped them.
 * @returns The verdict on the package.
 */
export const openPackage = Effect.fn("openPackage")(function* openPackage(
  location: string,
  files: ReadonlyMap<string, Uint8Array>,
): Effect.fn.Return<PackageVerdict> {
  yield* Effect.annotateCurrentSpan("package.location", location);

  const verdict = yield* readPackage(location, files);

  yield* Effect.annotateCurrentSpan("package.verdict", verdict.verdict);

  return verdict;
});

/**
 * List a test's item refs in document order, each with its identifier and its `href`, the item refs
 * a session over the test delivers.
 *
 * @param test The accepted test.
 * @returns Its item refs, every part's and section's, in document order.
 */
export const itemRefs = (test: AcceptedTest): readonly ItemRefEntry[] =>
  test.test.parts.flatMap((part) =>
    itemRefsIn(part.children).map(({ href, identifier }) => ({ href, identifier })),
  );

/**
 * Brand a package's contents as accepted, the one named seam through which a test builds an
 * {@link AcceptedPackage} without {@link openPackage}. No production code calls it.
 *
 * @param contents What the package holds.
 * @returns The accepted package.
 */
export const acceptPackageForTest = (contents: PackageContents): AcceptedPackage =>
  acceptPackage(contents);
