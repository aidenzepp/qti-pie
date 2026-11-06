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
 *   (`item-ref-unresolved`), and each dotted reference in it is judged by reading 48 against the
 *   items they resolve to and its parts and sections (`ambiguous-reference`);
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
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { itemRefsIn } from "#plate/model/item-refs.ts";
import { trimXmlSpace } from "#plate/model/values.ts";
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
   * manifest lists by a path inside the package, except the document of each resource of a QTI
   * type (an item, a test, a section, a stimulus, outcome declarations, response processing, a
   * response-processing template and a fragment), and never the manifest.
   *
   * A QTI document holds what a candidate must not read, an item's correct responses and mappings
   * and the base values of response processing among them, whatever its file is named, so it is
   * left out by the resource that names it, not by its extension; a host reads those documents
   * through the package and serves only what `render` writes. What stays is what an item embeds,
   * its images, media, stylesheets and package documents, which a host serves as live documents
   * (from another origin or under the CSP `sandbox` directive).
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
 * The QTI resource types, the eight `imsqti_*` types of the profile's `type` enumeration: the
 * document of a resource of one of these types never reaches `files`.
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
 * The occurrence form of what follows a prefix, `N.VAR`: the variable of the item's Nth instance.
 */
const occurrenceForm = /^\d+\.(?<variable>.+)$/su;

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
 * The variables an item's document declares and the built-ins every item has, which a reading of
 * a dotted reference may name.
 *
 * @param document The item's document.
 * @returns Its variables, none when the document is unread or its root is not an item.
 */
const variablesOf = (document: Document | undefined): Option.Option<ReadonlySet<string>> => {
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

  return Option.some(new Set([...itemBuiltIns, ...declared]));
};

/**
 * What a test's dotted references resolve against: each resolved item ref's variables, and the
 * identifiers of its parts and sections.
 */
interface ReferenceScope {
  readonly durations: ReadonlySet<string>;
  readonly items: ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * Report whether one reading of a dotted reference names a real item ref, part or section and a
 * variable it has (reading 48).
 *
 * After an item ref, the rest names one of its item's variables directly, or in the occurrence
 * form `N.VAR` (reading 4). After a part or a section, the rest is its `duration`.
 *
 * @param scope What the test's references resolve against.
 * @param prefix The part before the dot the reading splits at.
 * @param rest The part after it.
 * @returns Whether the reading resolves.
 */
const resolves = (scope: ReferenceScope, prefix: string, rest: string): boolean => {
  const variables = scope.items.get(prefix);
  if (variables !== undefined) {
    return variables.has(occurrenceForm.exec(rest)?.groups?.["variable"] ?? rest);
  }

  return scope.durations.has(prefix) && rest === "duration";
};

/**
 * Give every reading of a dotted reference that resolves, one for each dot it may split at, from
 * the first dot.
 *
 * @param scope What the test's references resolve against.
 * @param reference The reference.
 * @returns Each resolving reading's prefix and rest.
 */
const readingsOf = (
  scope: ReferenceScope,
  reference: string,
): readonly (readonly [prefix: string, rest: string])[] => {
  const readings: (readonly [prefix: string, rest: string])[] = [];
  for (let dot = reference.indexOf("."); dot !== -1; dot = reference.indexOf(".", dot + 1)) {
    const prefix = reference.slice(0, dot);
    const rest = reference.slice(dot + 1);
    if (resolves(scope, prefix, rest)) {
      readings.push([prefix, rest]);
    }
  }

  return readings;
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
 * that `path`. A reference two of whose readings resolve is `ambiguous-reference` at its
 * `identifier`, its detail the `reference` and its first two resolving readings, prefix and
 * variable each. An item ref resolves a reading only through an item whose document the package
 * holds and the reader read.
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

  const items = new Map<string, ReadonlySet<string>>();
  for (const [identifier, itemPath] of refs) {
    for (const variables of Option.toArray(variablesOf(documents.get(itemPath)))) {
      items.set(identifier, variables);
    }
  }

  const scope: ReferenceScope = { durations, items };
  const ambiguous = visits.flatMap(({ element, path }) =>
    isQti(element, referenceElements)
      ? element.attributes
          .filter((attribute) => attribute.namespace === "" && attribute.local === "identifier")
          .flatMap((attribute) => {
            const reference = trimXmlSpace(attribute.value);
            const [first, second] = readingsOf(scope, reference);

            return first === undefined || second === undefined
              ? []
              : [
                  refuse(source.location, "ambiguous-reference", attributePath(path, attribute), {
                    firstPrefix: first[0],
                    firstVariable: first[1],
                    reading: "48",
                    reference,
                    secondPrefix: second[0],
                    secondVariable: second[1],
                  }),
                ];
          })
      : [],
  );

  return { refs, refusals: [...unresolved, ...ambiguous] };
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

  const documentPaths = new Set(
    manifest.resources.flatMap((resource) =>
      qtiTypes.has(resource.type) ? Option.toArray(documentPath(resource)) : [],
    ),
  );

  return {
    files: new Set(
      manifest.resources.flatMap((resource) =>
        resource.files.flatMap((file) =>
          Option.toArray(file.path).filter((path) => !documentPaths.has(path)),
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
