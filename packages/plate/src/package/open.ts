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
 * - Each test places, through its section refs and then each placed section document's, every section
 *   document a section resource names, once for each section ref that names it (reading 86), as if
 *   it were inline; a section ref that returns to a document already on its chain is
 *   `inclusion-cycle` (reading 85) and places nothing. That reach is the test's own parts, sections
 *   and item refs and each placed document's. Through that reach:
 *
 *   - Each part's, section's and item ref's identifier is given once: one a section document gives
 *     again after the test or a document reached before it gave it is `duplicate-identifier` at that
 *     document (`info.txt:10759`, pantry's `structure-identifier`), given once however many tests
 *     reach it, and is left out of the reach, so the first wins; a section document placed twice
 *     gives its identifiers once;
 *   - Each item ref resolves against its own document's path to an item resource the manifest lists; a
 *     test's own item ref that does not is `item-ref-unresolved`, one that writes no identifier
 *     included (reading 155);
 *   - Each dotted reference in the test, a name an expression reads, is judged by reading 48 ("a dotted
 *     reference is accepted when exactly one reading names a real item ref, test part or section and
 *     its variable") against the test's own variables, the items the item refs resolve to, their
 *     variable mappings and built-ins, `QTI_CONTEXT` among them (reading 106), and the reach's parts
 *     and sections: the unsplit reading, the test's own variable of the whole name, counts among the
 *     readings, and a numbered one only through an item ref a selection with replacement can repeat
 *     (reading 88). A reading through an element of a section document placed twice reads one
 *     placement each time: the reference's own, from inside it, and each, from outside it (reading
 *     86). One no reading counts for is `undeclared-variable`, and one two readings count for is
 *     `ambiguous-reference`. A name an outcome rule sets is the test's own variable (reading 112), so
 *     one the test does not declare is `undeclared-variable`. An item's `duration` resolves whether
 *     or not the item is time dependent (reading 150). A variable read through a prefix is judged by
 *     its kind, a built-in by the kind it stands as (reading 111): a reference attribute reads only a
 *     template or outcome variable (`expression-type`), a `qti-correct` only a response
 *     (`undeclared-variable`), and a mapping expression only a response its item declares
 *     (`undeclared-variable`) with the mapping it needs (`template-requirements`);
 *   - Each item ref's variable mappings, the test's own and a reached section document's, name an
 *     outcome its item declares as their source (`undeclared-variable`) and each its own target, no
 *     other variable its item holds (`duplicate-identifier`, reading 97), and its template defaults a
 *     template variable its item declares (`undeclared-variable`), each refusal at its own document
 *     and given once however many tests reach it;
 *   - The test's expressions are typed through its reach, so the item's processing rules judge what
 *     they read there and what each template default sets (`expression-type`);
 *   - Each placement of a section document a test places is judged under that test as the test is, its
 *     dotted references against the test's reach and its expressions in the test's processing scope
 *     (`undeclared-variable`, `expression-type`; readings 5 and 145), each refusal at the section
 *     document and given once however many placements and tests give it;
 *   - Each branch rule of the test and of each placement names a reserved exit or a later element of
 *     its own kind in its own test part, never inside a section document a ref places from outside
 *     it, and never an item ref a selection with replacement can repeat (`branch-target`, reading
 *     87);
 *   - Each read in the test document's outcome processing or in one of its item refs' template defaults
 *     of an item's context variable through its item ref, one the item declares in a
 *     `qti-context-declaration` or the built-in `QTI_CONTEXT`, is found: the engine holds no value of
 *     it, and the delivered test marks the processing that reads it (see below);
 * - An item or test resource whose own LOM metadata gives identifier entries or title strings gives
 *   one equal to its document's `identifier` and `title` (`lom-identifier` and `lom-title`, reading
 *   62).
 *
 * A resource with no `href`, or with an absolute one (reading 35), names no document the package
 * holds, so nothing of it is read. The package's verdict follows from its parts: `refused` when
 * anything is refused, `unchecked` when nothing is and some document is, then
 * `accepted-with-unsupported` when some document is or some test is delivered with processing the
 * package marks (see below), and `accepted` otherwise. Only an accepting package's documents are
 * delivered. A test is delivered with the model its document's own verdict holds, except that one
 * whose processing reads an item's context variable through its item ref is delivered with that
 * processing marked, `variable:<name>` at it: its outcome processing `marked`, and each template
 * default that reads one left out, so its template variable starts at its declared default. The
 * test document's own verdict cannot carry those marks, since the document is judged without its
 * items, and it keeps its own; the package's verdict carries them, so a read of the built-in
 * `QTI_CONTEXT`, which marks no item, still makes the package `accepted-with-unsupported`. Like
 * `open`, it runs over the shared reader and the Schema-decoded tables, so it stays server-side.
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
import { xmlWhitespaceRun, xsBooleanOf } from "#plate/model/attributes.ts";
import {
  expressionKinds,
  floatOrRefOf,
  integerOrRefOf,
  singleOf,
  stringOrRefOf,
} from "#plate/model/expression.ts";
import type {
  ExpressionKind,
  ExpressionType,
  LiteralOrRef,
  ReferenceEntry,
} from "#plate/model/expression.ts";
import { kindRules } from "#plate/model/expressions/read.ts";
import { itemRefsIn, occurrenceOf } from "#plate/model/item-refs.ts";
import { withUnheldReads } from "#plate/model/test.ts";
import type { UnheldRead } from "#plate/model/test.ts";
import { isNcName, trimXmlSpace } from "#plate/model/values.ts";
import { readManifest, resourceLom } from "#plate/package/manifest.ts";
import type { LomGeneral, LomValues, Manifest, ManifestResource } from "#plate/package/manifest.ts";
import { checkFiles, fileLocation, manifestFile, packageFiles } from "#plate/package/store.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { Location, RefusalRule } from "#plate/validate/refusal.ts";
import {
  declarationType,
  declarationsOf,
  mappingRequirement,
  processingRefusals,
} from "#plate/validate/rules.ts";
import type { CollectedTyper, PrefixedTyper } from "#plate/validate/rules.ts";
import { tables } from "#plate/validate/tables.ts";
import { acceptMarkedTest, acceptedItem, check } from "#plate/validate/verdict.ts";
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
  /**
   * The test, as its document's own verdict accepts it, or, when its processing reads an item's
   * context variable through its item ref, with that processing marked: the outcome processing
   * `marked` and each template default that reads one left out, each read `variable:<name>` at the
   * processing element, after the document's own marks. The test document is judged without its
   * items, so its own verdict cannot carry those marks, and keeps its own.
   */
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
 * The kind of variable a variable stands as, the declaration kind of its declaration or, for a
 * built-in, the one QTI gives it: what a reference judged by kind (reading 111, "a processing
 * element's `identifier` names a variable of the kind the element reads or sets") reads.
 */
type VariableKind = "context" | "outcome" | "response" | "template";

/**
 * A built-in variable: the kind it stands as and its type.
 */
interface BuiltIn {
  readonly kind: VariableKind;
  readonly type: ExpressionType;
}

/**
 * The variables every item has besides those it declares, which a test reads through an item ref
 * (reading 106, "a prefixed reference reaches every built-in variable its item ref's item holds,
 * `QTI_CONTEXT` among them"), each with the kind it stands as (reading 111) and its type, as the
 * qti package's `BuiltInVariable` holds them under an item's root
 * (`packages/pantry/src/grammar/install.ts`, its rows `builtIns` in
 * `packages/pantry/src/grammar/references.ts`): the responses `numAttempts`, a single integer, and
 * `duration`, a single float, seconds (reading 29), the outcome `completionStatus`, a single
 * identifier, and the context variable `QTI_CONTEXT`, a record.
 */
const itemBuiltIns: ReadonlyMap<string, BuiltIn> = new Map<string, BuiltIn>([
  ["completionStatus", { kind: "outcome", type: singleOf("identifier") }],
  ["duration", { kind: "response", type: singleOf("float") }],
  ["numAttempts", { kind: "response", type: singleOf("integer") }],
  ["QTI_CONTEXT", { kind: "context", type: { baseType: "unknown", cardinality: "record" } }],
]);

/**
 * A part's or a section's `duration`: a response, a single duration, where an item's is a float
 * (`builtIns` in `packages/pantry/src/grammar/references.ts`, which gives a test's, a part's and a
 * section's `duration` the kind of a response declaration).
 */
const scopeDuration: BuiltIn = { kind: "response", type: singleOf("duration") };

/**
 * The type of a name no reading resolves, or two readings resolve: unknown, which satisfies every
 * rule, so such a name earns its reading's refusal alone ({@link judgeReference}).
 */
const unknownType: ExpressionType = { baseType: "unknown", cardinality: "unknown" };

/**
 * The kinds of variable a reference attribute may name through an item ref: a template variable
 * and an outcome variable (P24), a built-in by the kind it stands as.
 */
const namableKinds: ReadonlySet<VariableKind> = new Set(["outcome", "template"]);

/**
 * The declarations of an item's variables, by local name in QTI's namespace, each with the kind
 * of variable it declares.
 */
const itemDeclarations: ReadonlyMap<string, VariableKind> = new Map<string, VariableKind>([
  ["qti-context-declaration", "context"],
  ["qti-outcome-declaration", "outcome"],
  ["qti-response-declaration", "response"],
  ["qti-template-declaration", "template"],
]);

/**
 * The expressions whose `identifier` a test may prefix with an item ref, a part or a section, by
 * local name in QTI's namespace: a variable's value, its default, a response's correct response,
 * and a response mapped through its mapping or its area mapping. The outcome rules whose
 * `identifier` a test writes dotted are {@link targetElements}, which no prefix resolves.
 */
const referenceElements: ReadonlySet<string> = new Set([
  "qti-correct",
  "qti-default",
  "qti-map-response",
  "qti-map-response-point",
  "qti-variable",
]);

/**
 * The outcome rules of a test, a set and a lookup of an outcome's value, by local name in QTI's
 * namespace, whose `identifier` names the variable they set: a variable of the test's own document,
 * so of a dotted `identifier` only the unsplit reading resolves (reading 112, "a test's setter sets
 * a variable of its own document, so a prefixed reading never resolves it"), as the qti package's
 * `resolves` gives a setter's reading (the relation `Reading` in
 * `packages/pantry/src/qti/expressions.ts`). A test's processing holds no other setter.
 */
const targetElements: ReadonlySet<string> = new Set([
  "qti-lookup-outcome-value",
  "qti-set-outcome-value",
]);

/**
 * The expressions that map a response, by local name in QTI's namespace.
 */
const mappingExpressions: ReadonlySet<string> = new Set([
  "qti-map-response",
  "qti-map-response-point",
]);

/**
 * The expressions whose `identifier` names a response, by local name in QTI's namespace: its
 * correct response, which "looks up the declaration of a response variable" (`info.txt:9302`), and
 * each mapping of it ({@link mappingExpressions}).
 */
const responseExpressions: ReadonlySet<string> = new Set(["qti-correct", ...mappingExpressions]);

/**
 * The child of an item ref that gives one of its item's template variables a value before its
 * template processing, by local name in QTI's namespace.
 */
const templateDefaultElements: ReadonlySet<string> = new Set(["qti-template-default"]);

/**
 * A test's outcome processing, by local name in QTI's namespace.
 */
const processingElements: ReadonlySet<string> = new Set(["qti-outcome-processing"]);

/**
 * The expressions that read a variable by its `identifier`, its value or its default, by local name
 * in QTI's namespace: those a read of an item's context variable through its item ref is found in
 * ({@link contextReadsIn}).
 */
const contextReadElements: ReadonlySet<string> = new Set(["qti-default", "qti-variable"]);

/**
 * The item ref, the one element of a test that references an item document, by local name in
 * QTI's namespace.
 */
const itemRefElements: ReadonlySet<string> = new Set(["qti-assessment-item-ref"]);

/**
 * The section ref, the one element of a test or a section document that references a section
 * document, by local name in QTI's namespace.
 */
const sectionRefElements: ReadonlySet<string> = new Set(["qti-assessment-section-ref"]);

/**
 * The elements of a test whose identifier names a scope with a `duration`: a part and a section.
 */
const durationScopes: ReadonlySet<string> = new Set(["qti-assessment-section", "qti-test-part"]);

/**
 * A section, by local name in QTI's namespace, the one element of a test whose `qti-selection`
 * may let its item refs be instantiated more than once.
 */
const sectionElements: ReadonlySet<string> = new Set(["qti-assessment-section"]);

/**
 * A section's selection, by local name in QTI's namespace.
 */
const selectionElements: ReadonlySet<string> = new Set(["qti-selection"]);

/**
 * The variables a test's processing holds besides those it declares, each with the kind it stands
 * as and its type: `QTI_CONTEXT`, a context variable and a record, `completionStatus`, an outcome
 * and a single identifier, and `duration` and `numAttempts`, responses, a single duration and a
 * single integer. The qti package now gives a test only `duration` and `QTI_CONTEXT` (`builtIns`
 * in `packages/pantry/src/grammar/references.ts`); plate keeps a test's own `numAttempts` and
 * `completionStatus`, accepted and marked, an agreement difference (G-R3 184, pending).
 */
const testBuiltIns: ReadonlyMap<string, BuiltIn> = new Map<string, BuiltIn>([
  ["QTI_CONTEXT", { kind: "context", type: { baseType: "unknown", cardinality: "record" } }],
  ["completionStatus", { kind: "outcome", type: singleOf("identifier") }],
  ["duration", scopeDuration],
  ["numAttempts", { kind: "response", type: singleOf("integer") }],
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
 * A test part, by local name in QTI's namespace: the element a test's sections and item refs lie
 * in, and the only kind a test part's branch rule may name (reading 87).
 */
const partElements: ReadonlySet<string> = new Set(["qti-test-part"]);

/**
 * The elements of a test or section document a branch rule's `target` may name, by local name in
 * QTI's namespace: a test part, a section, a section ref and an item ref (reading 87, "a target is
 * one of the three reserved values ... or the identifier of a test part, section, section ref or
 * item ref of the assembled test").
 */
const branchNameElements: ReadonlySet<string> = new Set([
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-assessment-section-ref",
  "qti-test-part",
]);

/**
 * The elements a branch rule may sit on, its owner, by local name in QTI's namespace: a test part,
 * a section and an item ref, as the ASI XSD places `qti-branch-rule`.
 */
const branchOwnerElements: ReadonlySet<string> = new Set([
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-test-part",
]);

/**
 * A branch rule, by local name in QTI's namespace.
 */
const branchRuleElements: ReadonlySet<string> = new Set(["qti-branch-rule"]);

/**
 * A section's ordering, by local name in QTI's namespace.
 */
const orderingElements: ReadonlySet<string> = new Set(["qti-ordering"]);

/**
 * The reserved targets every branch rule may name (reading 87; information model section
 * 5.23.1).
 */
const branchExits: ReadonlySet<string> = new Set(["EXIT_SECTION", "EXIT_TEST", "EXIT_TESTPART"]);

/**
 * Each expression kind, by its element's local name in QTI's namespace.
 */
const kindsByElement: ReadonlyMap<string, ExpressionKind> = new Map(
  expressionKinds.map((kind) => [`qti-${kind}`, kind] as const),
);

/**
 * The classifier of each base type a reference facet entry names, the one the item model's reader
 * and the validator use (`#plate/model/expression.ts`): each classifies one value of a reference
 * attribute as the literal or the reference it holds. Only the string classifier reads the names
 * it is given: a `pattern` is a reference only as a braced name of a variable held (ruling R1).
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
 * Give the verdict on a document of the package from its reading: the reader's refusal as a
 * refused verdict of kind `none`, or `check`'s verdict against the committed tables under the
 * package's QTI version, which `open` cannot know of a document alone.
 *
 * @param location The document's location.
 * @param source Its reading.
 * @param version The package's version, as its manifest states it.
 * @returns The verdict on it.
 */
const judge = (
  location: string,
  source: Result.Result<SourceDocument, Refusal>,
  version: CpVersion,
): Verdict =>
  Result.isFailure(source)
    ? { document: location, kind: "none", refusals: [source.failure], verdict: "refused" }
    : check(source.success, tables, Option.some(version));

/**
 * Read each document the manifest's QTI resources name, once, and judge each one a resource of a
 * judged type names, under the version the manifest states.
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
        verdict: isJudged
          ? Option.some(judge(documentLocation, source, manifest.version))
          : Option.none(),
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
   * The variables the item declares, each identifier with its declaration: a response, an outcome,
   * a template or a context declaration. Of two that share an identifier the last is kept, as the
   * rules keep it (`declarationsOf`); the item's own verdict refuses the pair.
   */
  readonly declarations: ReadonlyMap<string, SourceElement>;
}

/**
 * Report whether an item declares a variable by a declaration of one kind.
 *
 * @param variables The item's variables.
 * @param identifier The variable's identifier.
 * @param local The declaration's local name, such as `qti-outcome-declaration`.
 * @returns Whether the item's declaration of that identifier is one of that kind.
 */
const declaresAs = (variables: ItemVariables, identifier: string, local: string): boolean =>
  variables.declarations.get(identifier)?.local === local;

/**
 * Read what a reading of a dotted reference may name through an item ref from its item's document:
 * the variables it declares. Its `time-dependent` is not read: an item's `duration` may be read
 * whether or not the item is time dependent (reading 150).
 *
 * @param document The item's document.
 * @returns Its variables, none when the document is unread or its root is not an item.
 */
const variablesOf = (document: Document | undefined): Option.Option<ItemVariables> => {
  if (document === undefined || Result.isFailure(document.source)) {
    return Option.none();
  }

  const source = document.source.success;
  const { root } = source;
  if (root.namespace !== qtiNamespace || root.local !== "qti-assessment-item") {
    return Option.none();
  }

  return Option.some({
    declarations: new Map(
      [...itemDeclarations.keys()].flatMap((local) => [...declarationsOf(source, local)]),
    ),
  });
};

/**
 * What a reading of a dotted reference may name through one resolved item ref: its item's
 * variables, and the targets of the item ref's variable mappings whose source the item declares, as
 * pantry's reach holds them (the relations `VariableLookup` and `MappingLookup` in
 * `packages/pantry/src/qti/expressions.ts`).
 */
interface ItemRefVariables extends ItemVariables {
  /**
   * Each mapping target, with the declaration of the source it reads.
   */
  readonly mapped: ReadonlyMap<string, SourceElement>;
}

/**
 * What a test's dotted references resolve against, its reach, from where a reference stands: the
 * variables of each resolved item ref, the identifiers of the parts and sections of the test and of
 * each section document it places through its section refs, as if each section document were
 * inline, the test's own variables, and the placements a reading through each item ref, part or
 * section reads from there.
 */
interface ReferenceScope {
  readonly durations: ReadonlySet<string>;
  readonly items: ReadonlyMap<string, ItemRefVariables>;
  /**
   * The placements a reading through an item ref, part or section of the reach reads from where the
   * reference stands, each with whether a selection with replacement can repeat the item ref there:
   * the one that holds the reference, when the element's document is the reference's own or lies
   * above it, and otherwise every placement of the element's document (reading 86, "a reference
   * that names an item ref or a section through such a document, or one of their variables,
   * resolves once for each placement"). A numbered reading counts only through a placement that can
   * repeat its item ref (reading 88).
   */
  readonly placements: (identifier: string) => readonly boolean[];
  /**
   * The test's own variables by their whole identifier, each a declaration of the test or one of
   * its built-ins: what the unsplit reading of a reference reads (reading 48, "the unsplit reading
   * counts among them").
   */
  readonly whole: ReadonlyMap<string, ReadVariable>;
}

/**
 * The variable one resolving reading of a dotted reference reads, as pantry's relation `Reading`
 * gives it (`packages/pantry/src/qti/expressions.ts`).
 */
interface ReadVariable {
  /**
   * The declaration the reading names directly: a variable its item declares, or, for the unsplit
   * reading, one the test declares; none for a mapping target and a built-in.
   */
  readonly declaration: Option.Option<SourceElement>;
  /**
   * The kind of variable it stands as (reading 111): a declared variable's its declaration's, a
   * mapping target's an outcome, as pantry reads one, and a built-in's the kind QTI gives it.
   */
  readonly kind: VariableKind;
  /**
   * Its type: a mapping target's is its source's, a declared variable's its declaration's, a
   * built-in's its built-in type; unknown where the declaration's type is not judged.
   */
  readonly type: ExpressionType;
}

/**
 * One reading of a dotted reference that resolves (reading 48, "a dotted reference is accepted when
 * exactly one reading names a real item ref, test part or section and its variable"): its form,
 * the item ref, part or section its prefix names, the rest, as written, and the variable it reads.
 * The `unsplit` reading reads the test's own variable of the whole reference, its prefix empty and
 * its rest the reference; a `split` reading splits at one dot; a `numbered` one reads an instance
 * of its item ref's item, its rest `N.VAR` (reading 88). A split or numbered reading reads one
 * placement of its prefix's element ({@link ReferenceScope}), so an element of a section document
 * placed twice gives it twice.
 */
interface Reading {
  readonly form: "numbered" | "split" | "unsplit";
  readonly prefix: string;
  /**
   * Whether a selection with replacement can repeat its item ref in the placement it reads, through
   * which alone a numbered reading counts (reading 88); false for any other reading.
   */
  readonly repeatable: boolean;
  readonly rest: string;
  readonly variable: ReadVariable;
}

/**
 * Give the kind of variable a declaration declares, by its local name ({@link itemDeclarations}).
 * Every declaration this module reads, an item's four and a test's two, has one; anything else
 * would read as an outcome.
 *
 * @param declaration The declaration.
 * @returns Its kind.
 */
const kindOf = (declaration: SourceElement): VariableKind =>
  itemDeclarations.get(declaration.local) ?? "outcome";

/**
 * Give the variable a built-in reads as.
 *
 * @param builtIn The built-in.
 * @returns The variable, which no declaration names.
 */
const builtInVariable = ({ kind, type }: BuiltIn): ReadVariable => ({
  declaration: Option.none(),
  kind,
  type,
});

/**
 * Give the type a declaration declares, unknown when it is not judged (the item's own verdict's
 * refusal).
 *
 * @param declaration The declaration.
 * @returns Its type.
 */
const declaredType = (declaration: SourceElement): ExpressionType =>
  Option.getOrElse(declarationType(declaration), () => unknownType);

/**
 * Resolve the variable one split or numbered reading of a dotted reference names (reading 48, "a
 * dotted reference is accepted when exactly one reading names a real item ref, test part or section
 * and its variable"), in pantry's order (the relation `Reading` in
 * `packages/pantry/src/qti/expressions.ts`, its source mapped, declared or built in).
 *
 * After an item ref, the rest names, directly or in the numbered form `N.VAR`
 * ({@link occurrenceOf}), a target of the item ref's variable mappings, else a variable its item
 * declares, else one of the built-ins every item has, `QTI_CONTEXT` among them (reading 106, "a
 * prefixed reference reaches every built-in variable its item ref's item holds, `QTI_CONTEXT`
 * among them"). After a part or a section, the rest is its `duration`, a built-in.
 *
 * @param scope What the test's references resolve against.
 * @param prefix The part before the dot the reading splits at.
 * @param rest The part after it.
 * @returns The reading's form and the variable it reads, none when it does not resolve.
 */
const variableOf = (
  scope: ReferenceScope,
  prefix: string,
  rest: string,
): Option.Option<readonly [form: Reading["form"], variable: ReadVariable]> => {
  const item = scope.items.get(prefix);
  if (item === undefined) {
    return scope.durations.has(prefix) && rest === "duration"
      ? Option.some(["split", builtInVariable(scopeDuration)])
      : Option.none();
  }

  const { variable } = occurrenceOf(rest);
  const form = variable === rest ? "split" : "numbered";
  const source = item.mapped.get(variable);
  if (source !== undefined) {
    return Option.some([
      form,
      { declaration: Option.none(), kind: "outcome", type: declaredType(source) },
    ]);
  }

  const declaration = item.declarations.get(variable);
  if (declaration !== undefined) {
    return Option.some([
      form,
      {
        declaration: Option.some(declaration),
        kind: kindOf(declaration),
        type: declaredType(declaration),
      },
    ]);
  }

  return Option.map(
    Option.fromUndefinedOr(itemBuiltIns.get(variable)),
    (builtIn) => [form, builtInVariable(builtIn)] as const,
  );
};

/**
 * Give every reading of a reference that resolves, whether or not it counts: the unsplit reading,
 * when the test declares or holds the whole reference, then, for each dot the reference may split
 * at, from the first dot, one for each placement of the element its prefix names that the reference
 * reads from where it stands ({@link ReferenceScope}). A numbered reading resolves here whether or
 * not a selection with replacement can repeat its item ref in its placement; {@link isCounted}
 * decides whether it counts.
 *
 * @param scope What the test's references resolve against.
 * @param reference The reference.
 * @returns Each resolving reading.
 */
const resolvingReadings = (scope: ReferenceScope, reference: string): readonly Reading[] => {
  const readings: Reading[] = Option.toArray(
    Option.map(Option.fromUndefinedOr(scope.whole.get(reference)), (variable): Reading => ({
      form: "unsplit",
      prefix: "",
      repeatable: false,
      rest: reference,
      variable,
    })),
  );
  for (let dot = reference.indexOf("."); dot !== -1; dot = reference.indexOf(".", dot + 1)) {
    const prefix = reference.slice(0, dot);
    const rest = reference.slice(dot + 1);
    for (const [form, variable] of Option.toArray(variableOf(scope, prefix, rest))) {
      readings.push(
        ...scope
          .placements(prefix)
          .map((repeatable): Reading => ({ form, prefix, repeatable, rest, variable })),
      );
    }
  }

  return readings;
};

/**
 * Report whether a resolving reading counts under reading 48 ("a dotted reference is accepted when
 * exactly one reading names a real item ref, test part or section and its variable"): every one
 * but a numbered reading whose item ref no selection with replacement can repeat in the placement
 * it reads (reading 88, "a numbered reference such as `Q01.2.SCORE` names an instance of an item
 * ref that a selection with replacement can repeat, and nothing else").
 *
 * @param reading The reading.
 * @returns Whether it counts.
 */
const isCounted = (reading: Reading): boolean => reading.form !== "numbered" || reading.repeatable;

/**
 * Give every reading of a reference that resolves and counts ({@link isCounted}): the unsplit
 * reading, then those for each dot it may split at, from the first dot.
 *
 * @param scope What the test's references resolve against.
 * @param reference The reference.
 * @returns Each resolving reading that counts.
 */
const readingsOf = (scope: ReferenceScope, reference: string): readonly Reading[] =>
  resolvingReadings(scope, reference).filter((reading) => isCounted(reading));

/**
 * Give the type of the variable a `qti-test-variables` reads by a name through one item ref, as
 * the engine resolves it (`itemName` in `#plate/engine/scope.ts`): a target of the item ref's
 * variable mappings names its source's declaration, else the item's own declaration of the name,
 * else one of the built-ins every item has. An item's context variable, declared or the built-in
 * `QTI_CONTEXT`, is passed over, since the engine holds none and so never collects one.
 *
 * @param item What the name may name through the item ref.
 * @param name The `variable-identifier`.
 * @returns The variable's type, unknown where its declaration is not judged; none when the name
 *   names nothing of the item.
 */
const collectedDeclaration = (
  item: ItemRefVariables,
  name: string,
): Option.Option<ExpressionType> => {
  const source = item.mapped.get(name);
  if (source !== undefined) {
    return Option.some(declaredType(source));
  }

  const declaration = item.declarations.get(name);

  return declaration === undefined || declaresAs(item, name, "qti-context-declaration")
    ? Option.fromUndefinedOr(itemBuiltIns.get(name)).pipe(
        Option.filter(({ kind }) => kind !== "context"),
        Option.map(({ type }) => type),
      )
    : Option.some(declaredType(declaration));
};

/**
 * Give the base type an unweighted `qti-test-variables` with no `base-type` collects of a variable,
 * from its declarations in every item of the test's reach, whatever the kind's filters (G-R3 199):
 * `float` when one of them declares it a single float, else `integer`, none declaring it included,
 * as the engine decides it (`collectedBaseType` in `#plate/engine/expressions/test.ts`). A
 * declaration of another base type, or of another cardinality, is not matched. A declaration whose
 * type is not judged, the item's own verdict's refusal, makes it `unknown`.
 *
 * @param items What a name may name through each resolved item ref.
 * @param name The `variable-identifier`.
 * @returns The base type.
 */
const collectedBaseType = (
  items: ReadonlyMap<string, ItemRefVariables>,
  name: string,
): ReturnType<CollectedTyper> => {
  const matched = [...items.values()]
    .flatMap((item) => Option.toArray(collectedDeclaration(item, name)))
    .filter(({ cardinality }) => cardinality === "single" || cardinality === "unknown");
  if (
    matched.some(({ baseType, cardinality }) => baseType === "unknown" || cardinality === "unknown")
  ) {
    return "unknown";
  }

  return matched.some(({ baseType }) => baseType === "float") ? "float" : "integer";
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
  /**
   * The base type a reference attribute's facet entry names, which the variable must have (P24);
   * none for an `identifier`, which names a variable of any type.
   */
  readonly baseType: Option.Option<ReferenceEntry["baseType"]>;
  readonly identifier: string;
}

/**
 * Give each variable an element of a test names, in the element's attribute order: the `identifier`
 * of a `qti-variable`, `qti-correct`, `qti-default`, `qti-map-response` or `qti-map-response-point`
 * ({@link referenceElements}), the `identifier` a `qti-set-outcome-value` or
 * `qti-lookup-outcome-value` sets ({@link targetElements}), and each value of a reference attribute
 * its expression kind's reference facet checks, as pantry derives them from the XSD's unions with
 * an NCName member (`referenceMembers` in `packages/pantry/src/grammar/references.ts`: `figures`,
 * `max`, `min`, `n`, `number-repeats`, `pattern` and `step`), with the base type its entry names.
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

    if (
      attribute.local === "identifier" &&
      (referenceElements.has(element.local) || targetElements.has(element.local))
    ) {
      const identifier = trimXmlSpace(attribute.value);

      return isNcName(identifier) ? [{ attribute, baseType: Option.none(), identifier }] : [];
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
        ? [{ attribute, baseType: Option.some(entry.baseType), identifier: classified.identifier }]
        : [];
    });
  });
};

/**
 * Judge one dotted reference of a test by reading 48 ("a dotted reference is accepted when exactly
 * one reading names a real item ref, test part or section and its variable"), as the qti package
 * judges a test-level reference over its readings (the relation `Reading` in
 * `packages/pantry/src/qti/expressions.ts`, judged by its `Prefixed_reference` and
 * `Variable_declared` laws, refused `prefixed-ref`).
 *
 * The readings that count are the unsplit reading, the test's own variable of the whole reference,
 * declared or built in (reading 48, "the unsplit reading counts among them"), each split reading,
 * and each numbered reading whose item ref a selection with replacement can repeat in its placement
 * (reading 88, {@link isCounted}), a split or numbered one once for each placement it reads
 * ({@link ReferenceScope}). A rule's target ({@link targetElements}) is judged by its unsplit
 * reading alone (reading 112, "a test's setter sets a variable of its own document, so a prefixed
 * reading never resolves it"): one the test does not hold whole is `undeclared-variable` with
 * `check: "setter"`, the `reference` and the `reading`, whatever its split readings resolve, and
 * what one the test holds sets is the rules' to judge. Of any other reference:
 *
 * - One no reading counts for is `undeclared-variable` with `check: "numbered"`, the `reference`, the
 *   `itemRef` of its first numbered reading and the `reading`, when a numbered reading would
 *   resolve it were its item ref repeatable, and otherwise with `check: "reading"` and the
 *   `reading`, pantry's `prefixed-ref` with no reading.
 * - One two readings count for is `ambiguous-reference`, its detail the `reference` and its first two
 *   counting readings, prefix and variable each, the unsplit reading's prefix empty, pantry's
 *   `prefixed-ref` with its readings, and the `reading` that settles it: 86 where the two are one
 *   reading through two placements of a section document, read from outside it (reading 86, "a
 *   section document a test places twice is written once"), and 48 otherwise.
 * - One whose one counting reading is the unsplit one names the test's own variable, which the rules
 *   judge (`#plate/validate/rules.ts`), so it earns nothing here.
 *
 * An expression's reference whose one reading reads the built-in `duration` of an item is never
 * refused for the item's `time-dependent` (reading 150, "an item's built-in `duration` may be read
 * whether or not the item is time dependent"). Each refusal is at the attribute; an
 * `undeclared-variable` names the `element`, the `identifier` as written and, for an attribute
 * other than `identifier`, the `attribute`.
 *
 * An expression's reference whose one counting reading is split or numbered is judged by the kind
 * of variable it reads (reading 111, "a processing element's `identifier` names a variable of the
 * kind the element reads or sets"), a built-in by the kind it stands as, at the element, as the
 * rules judge a name the test declares:
 *
 * - In a reference attribute, a variable that is not a template or outcome variable (a response, a
 *   context variable, or a built-in response or context variable) is `expression-type` with `check:
 *   "reference"`, its detail the rules' P24 detail, as pantry's `Reference_type` law judges a
 *   resolved reading. One of another type is the rules' own P24, which they judge through the typed
 *   reach.
 * - In a `qti-correct`, a variable that is not a response (an outcome, a template or context
 *   variable, a mapping target, which reads an outcome, or the built-in `completionStatus` or
 *   `QTI_CONTEXT`) is `undeclared-variable` at the attribute with `expected: "response"`, the
 *   detail the rules give an item's expression of a name that is no response, with the `prefix` the
 *   reading reads through: a `qti-correct` "looks up the declaration of a response variable"
 *   (`info.txt:9302`). An item's `numAttempts` and `duration`, and a part's or a section's
 *   `duration`, are responses, so a `qti-correct` of one is accepted.
 * - In a `qti-map-response` or `qti-map-response-point`, a variable that is not a response its item
 *   declares, a built-in response included, since no declaration gives it a mapping, is
 *   `undeclared-variable` likewise: each mapping "looks up the value of a response variable"
 *   (`:9306`, `:9314`) and "transforms it using the associated mapping, which must have been
 *   declared" (`:9306`). The `prefix` is what tells the wording a read through an item ref, part or
 *   section from a dotted name a document declares whole, which the rules refuse with no `prefix`.
 *   Pantry does not judge what a prefixed name reads there, so this is an agreement difference
 *   (G-R3, pending).
 * - In a `qti-map-response` or `qti-map-response-point`, a response its item declares without the
 *   mapping or the area mapping the expression needs is `template-requirements`, as an item's
 *   inline expression is, the `identifier` as written, with the `prefix` the reading reads through:
 *   the information model's "transforms it using the associated mapping, which must have been
 *   declared" (`info.txt:9306`). The `prefix` is what tells the wording that the response is one
 *   the item that item ref names declares, to be given its mapping there, and not a dotted name to
 *   declare. Pantry checks no P27 for a prefixed name, so this is an agreement difference (G-R3,
 *   pending).
 *
 * @param document The test's location.
 * @param visit The element's visit.
 * @param reference The attribute and the name it holds.
 * @param scope What the test's references resolve against.
 * @returns The refusals, none when exactly one reading counts for it and what that one reads may be
 *   read there.
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
  const byIdentifier = attribute.local === "identifier";
  const named = byIdentifier
    ? { element, identifier }
    : { attribute: attribute.local, element, identifier };
  if (byIdentifier && isQti(visit.element, targetElements)) {
    return scope.whole.has(identifier)
      ? []
      : [
          refuse(document, "undeclared-variable", path, {
            ...named,
            check: "setter",
            reading: "112",
            reference: identifier,
          }),
        ];
  }

  const resolving = resolvingReadings(scope, identifier);
  const [first, second] = resolving.filter((reading) => isCounted(reading));
  if (first === undefined) {
    const numbered = resolving.find((reading) => reading.form === "numbered");

    return [
      numbered === undefined
        ? refuse(document, "undeclared-variable", path, {
            ...named,
            check: "reading",
            reading: "48",
          })
        : refuse(document, "undeclared-variable", path, {
            ...named,
            check: "numbered",
            itemRef: numbered.prefix,
            reading: "88",
            reference: identifier,
          }),
    ];
  }

  if (second !== undefined) {
    return [
      refuse(document, "ambiguous-reference", path, {
        firstPrefix: first.prefix,
        firstVariable: first.rest,
        reading: first.prefix === second.prefix && first.rest === second.rest ? "86" : "48",
        reference: identifier,
        secondPrefix: second.prefix,
        secondVariable: second.rest,
      }),
    ];
  }

  if (first.form === "unsplit") {
    return [];
  }

  const { variable } = first;
  const isMapping = byIdentifier && isQti(visit.element, mappingExpressions);
  const response = variable.kind === "response";
  const readsResponse = isMapping ? response && Option.isSome(variable.declaration) : response;

  return [
    ...(byIdentifier && isQti(visit.element, responseExpressions) && !readsResponse
      ? [
          refuse(document, "undeclared-variable", path, {
            ...named,
            expected: "response",
            prefix: first.prefix,
          }),
        ]
      : []),
    ...(namableKinds.has(variable.kind)
      ? []
      : reference.baseType.pipe(
          Option.map((expectedBaseType) =>
            refuse(document, "expression-type", visit.path, {
              attribute: attribute.local,
              check: "reference",
              element,
              expectedBaseType,
              identifier,
            }),
          ),
          Option.toArray,
        )),
    ...variable.declaration.pipe(
      Option.filter(() => isMapping && response),
      Option.flatMap((declaration) => mappingRequirement(element, identifier, declaration)),
      Option.map((detail) =>
        refuse(document, "template-requirements", visit.path, { ...detail, prefix: first.prefix }),
      ),
      Option.toArray,
    ),
  ];
};

/**
 * Judge the variable mappings of the item refs of a test or of a section document a test reaches,
 * as pantry judges a `VariableMapping` (the `Variable mapping target` and `Variable mapping source`
 * laws in `packages/pantry/src/qti/tests.ts` and `packages/pantry/src/qti/expressions.ts`), each in
 * document order.
 *
 * A mapping's `source-identifier` that names no outcome variable the item ref's item declares, a
 * name it does not declare or one it declares as another kind of variable, is
 * `undeclared-variable` at that attribute, its detail the `element`, the `attribute`, the
 * `identifier` and `expected: "outcome"`, pantry's `variable-mapping-source`. It is judged only
 * through an item ref whose item the package holds and the reader read, as pantry contains a
 * mapping's source in the declarations of the item its item ref resolves to. A second mapping of
 * one item ref with the same `target-identifier` is `duplicate-identifier` at that attribute, its
 * detail the `identifier`, the key of a mapping by its item ref and its target. So is a target that
 * names another variable its item holds (reading 97, "a variable mapping's target names no other
 * variable its item ref's item holds"): one the item declares, other than the mapping's own source,
 * or one of the built-ins every item has, `QTI_CONTEXT` among them, its detail the `identifier` and
 * `reading: "97"`, judged only through an item ref whose item the reader read; both are pantry's
 * `Variable_mapping_target`. A target that is its own source maps nothing away, and is accepted. A
 * value that is no NCName is the structure check's refusal, so it is passed over.
 *
 * @param document The document's location.
 * @param visits The visits of the document's elements, in document order.
 * @param variablesFor The variables of the item an item ref resolves to, none when it resolves to
 *   no item the reader read.
 * @returns The refusals, in document order.
 */
const judgeMappings = (
  document: string,
  visits: readonly Visit[],
  variablesFor: (itemRef: SourceElement) => Option.Option<ItemVariables>,
): readonly Refusal[] => {
  const targets = new Map<SourceElement, Set<string>>();
  const refusals: Refusal[] = [];
  for (const { element, parent, path } of visits) {
    const itemRef = parent.pipe(
      Option.filter((one) => isQti(one, itemRefElements)),
      Option.getOrUndefined,
    );
    if (itemRef !== undefined && isQti(element, mappingElements)) {
      /**
       * Give the variable an attribute of the mapping names.
       *
       * @param local The attribute's local name.
       * @returns Its value with its outer XML whitespace removed, none when the mapping has no
       *   such attribute or its value is no NCName.
       */
      const named = (local: string): Option.Option<string> =>
        attributeOf(element, local).pipe(Option.map(trimXmlSpace), Option.filter(isNcName));
      /**
       * Give the path of an attribute of the mapping, where a refusal of it is located.
       *
       * @param local The attribute's local name.
       * @returns Its path.
       */
      const at = (local: string): string => attributePath(path, { local, namespace: "" });
      for (const source of Option.toArray(named("source-identifier"))) {
        if (
          Option.exists(
            variablesFor(itemRef),
            (variables) => !declaresAs(variables, source, "qti-outcome-declaration"),
          )
        ) {
          refusals.push(
            refuse(document, "undeclared-variable", at("source-identifier"), {
              attribute: "source-identifier",
              element: element.local,
              expected: "outcome",
              identifier: source,
            }),
          );
        }
      }

      for (const target of Option.toArray(named("target-identifier"))) {
        const seen = targets.get(itemRef) ?? new Set<string>();
        if (seen.has(target)) {
          refusals.push(
            refuse(document, "duplicate-identifier", at("target-identifier"), {
              identifier: target,
            }),
          );
        } else if (
          !Option.contains(named("source-identifier"), target) &&
          Option.exists(
            variablesFor(itemRef),
            (variables) => variables.declarations.has(target) || itemBuiltIns.has(target),
          )
        ) {
          refusals.push(
            refuse(document, "duplicate-identifier", at("target-identifier"), {
              identifier: target,
              reading: "97",
            }),
          );
        }

        seen.add(target);
        targets.set(itemRef, seen);
      }
    }
  }

  return refusals;
};

/**
 * What judging the template defaults of a document's item refs gives: their refusals, and the type
 * of the template variable each other one sets.
 */
interface TemplateDefaults {
  readonly refusals: readonly Refusal[];
  /**
   * Each template default whose target its item declares as a template variable of a judged type,
   * with that type.
   */
  readonly targets: ReadonlyMap<SourceElement, ExpressionType>;
}

/**
 * Judge the template defaults of the item refs of a test or of a section document a test reaches,
 * as pantry judges a `TemplateDefault` (the `Template default target` law in
 * `packages/pantry/src/qti/expressions.ts`), each in document order, and type the template variable
 * each sets, as pantry's `TemplateDefaultTarget` does (the `Template default type` law in
 * `packages/pantry/src/qti/expressions.ts`).
 *
 * A default's `template-identifier` that names no template variable the item ref's item declares, a
 * name it does not declare or one it declares as another kind of variable, is
 * `undeclared-variable` at that attribute, its detail the `element`, the `attribute`, the
 * `identifier` and `expected: "template"`, pantry's `template-default-target`. It is judged only
 * through an item ref whose item the package holds and the reader read. A value that is no NCName,
 * or a default without the attribute, is the structure check's refusal, so it is passed over.
 *
 * @param document The document's location.
 * @param visits The visits of the document's elements, in document order.
 * @param variablesFor The variables of the item an item ref resolves to, none when it resolves to
 *   no item the reader read.
 * @returns The refusals, in document order, and each typed target.
 */
const judgeTemplateDefaults = (
  document: string,
  visits: readonly Visit[],
  variablesFor: (itemRef: SourceElement) => Option.Option<ItemVariables>,
): TemplateDefaults => {
  const refusals: Refusal[] = [];
  const targets = new Map<SourceElement, ExpressionType>();
  for (const { element, parent, path } of visits) {
    const itemRef = parent.pipe(
      Option.filter((one) => isQti(one, itemRefElements)),
      Option.getOrUndefined,
    );
    if (itemRef !== undefined && isQti(element, templateDefaultElements)) {
      const variables = variablesFor(itemRef);
      const target = attributeOf(element, "template-identifier").pipe(
        Option.map(trimXmlSpace),
        Option.filter(isNcName),
      );
      if (Option.isSome(variables) && Option.isSome(target)) {
        const declaration = variables.value.declarations.get(target.value);
        if (declaration?.local === "qti-template-declaration") {
          for (const type of Option.toArray(declarationType(declaration))) {
            targets.set(element, type);
          }
        } else {
          refusals.push(
            refuse(
              document,
              "undeclared-variable",
              attributePath(path, { local: "template-identifier", namespace: "" }),
              {
                attribute: "template-identifier",
                element: element.local,
                expected: "template",
                identifier: target.value,
              },
            ),
          );
        }
      }
    }
  }

  return { refusals, targets };
};

/**
 * Give a refusal's facts as one string, its document, rule, location and detail, the detail's facts
 * in key order, so two refusals with the same facts give the same string.
 *
 * The document is a fact because a location is a path within a document: two section documents
 * that two tests reach may hold the same error at the same path, and each is refused.
 *
 * @param refusal The refusal.
 * @returns Its facts.
 */
const factsOf = (refusal: Refusal): string =>
  JSON.stringify([
    refusal.document,
    refusal.rule,
    refusal.location,
    Object.entries(refusal.detail).toSorted(([one], [other]) => (one < other ? -1 : 1)),
  ]);

/**
 * Give the refusals of one list that another does not already hold, each held one passing over one
 * refusal with its facts ({@link factsOf}).
 *
 * @param refusals The refusals.
 * @param held The refusals already given.
 * @returns The refusals not held, in order.
 */
const notHeld = (refusals: readonly Refusal[], held: readonly Refusal[]): readonly Refusal[] => {
  const counts = new Map<string, number>();
  for (const refusal of held) {
    counts.set(factsOf(refusal), (counts.get(factsOf(refusal)) ?? 0) + 1);
  }

  const kept: Refusal[] = [];
  for (const refusal of refusals) {
    const left = counts.get(factsOf(refusal)) ?? 0;
    if (left > 0) {
      counts.set(factsOf(refusal), left - 1);
    } else {
      kept.push(refusal);
    }
  }

  return kept;
};

/**
 * One item ref of a test or a section document whose `href` resolves to an item resource the
 * manifest lists, whether or not it writes an identifier: the item ref and its item's path.
 */
interface ItemRefTarget {
  readonly element: SourceElement;
  readonly path: string;
}

/**
 * One item ref of a test or a section document that writes an identifier and resolves to an item
 * resource the manifest lists: its identifier, and whether a selection with replacement in its own
 * document can repeat it.
 */
interface ResolvedItemRef extends ItemRefTarget {
  readonly identifier: string;
  /**
   * Whether it lies under a section of its own document whose `qti-selection` has
   * `with-replacement` true ({@link replacingSections}).
   */
  readonly replaced: boolean;
}

/**
 * One section ref of a test or a section document whose `href` names a path inside the package:
 * the section ref, its `href` collapsed as written, the path of the element, the path its `href`
 * resolves to, and whether a selection with replacement in its own document can repeat what it
 * places.
 */
interface SectionPlacement {
  readonly element: SourceElement;
  readonly href: string;
  /**
   * The section ref's own path in its document, where a refusal of it is located.
   */
  readonly at: string;
  readonly path: string;
  /**
   * Whether the section ref lies under a section of its own document whose `qti-selection` has
   * `with-replacement` true ({@link replacingSections}).
   */
  readonly replaced: boolean;
}

/**
 * One part's, section's or item ref's `identifier` in a test or section document, which must be
 * unique within the test that reaches the document (`info.txt:10759`).
 */
interface StructureIdentifier {
  /**
   * The document's location, where a refusal of the identifier is.
   */
  readonly document: string;
  readonly element: SourceElement;
  readonly identifier: string;
  /**
   * The path of the element's `identifier` attribute, where a refusal of it is located.
   */
  readonly path: string;
  /**
   * Whether the element is a part or a section, a scope with a `duration`, rather than an item ref.
   */
  readonly scope: boolean;
}

/**
 * What a test's reach is built from in one test or section document, read from its elements in
 * document order.
 */
interface DocumentStructure {
  /**
   * The identifier of each of its parts, sections and item refs, in document order, an item ref's
   * whether it resolves or not.
   */
  readonly identifiers: readonly StructureIdentifier[];
  /**
   * Each item ref that writes an identifier and resolves, against the document's path, to an item
   * resource.
   */
  readonly itemRefs: readonly ResolvedItemRef[];
  /**
   * Each of its section refs whose `href` names a path inside the package, in document order.
   */
  readonly sectionRefs: readonly SectionPlacement[];
  /**
   * Each item ref that resolves to an item resource, whether or not it writes an identifier, in
   * document order: what its variable mappings and template defaults are judged against (reading
   * 155).
   */
  readonly targets: readonly ItemRefTarget[];
  /**
   * Each item ref that resolves to no item resource, `item-ref-unresolved` at the item ref.
   */
  readonly unresolved: readonly Refusal[];
  /**
   * The visits of its elements, in document order, which its references, variable mappings and
   * template defaults are judged over.
   */
  readonly visits: readonly Visit[];
}

/**
 * Report whether an element is a section whose `qti-selection` has `with-replacement` true, as
 * `xs:boolean` reads it, which lets each item ref beneath it be instantiated more than once
 * (reading 88).
 *
 * @param element The element.
 * @returns Whether it is.
 */
const replacesItems = (element: SourceElement): boolean =>
  isQti(element, sectionElements) &&
  element.children.some(
    (child) =>
      child.kind === "element" &&
      isQti(child, selectionElements) &&
      Option.exists(Option.flatMap(attributeOf(child, "with-replacement"), xsBooleanOf), Boolean),
  );

/**
 * Give the elements of a document that lie under a section whose `qti-selection` has
 * `with-replacement` true ({@link replacesItems}), each such section included.
 *
 * @param visits The visits of the document's elements, in document order, each parent before its
 *   children.
 * @returns The elements.
 */
const replacingSections = (visits: readonly Visit[]): ReadonlySet<SourceElement> => {
  const replacing = new Set<SourceElement>();
  for (const { element, parent } of visits) {
    if (Option.exists(parent, (above) => replacing.has(above)) || replacesItems(element)) {
      replacing.add(element);
    }
  }

  return replacing;
};

/**
 * Read what a test's reach is built from in one test or section document: its parts', sections' and
 * item refs' identifiers, each with the path of its `identifier` attribute, its item refs, each
 * resolved against the document's path to an item resource the manifest lists, and its section
 * refs, each with the path it names, each item ref and section ref with whether a selection with
 * replacement in the document lies above it ({@link replacingSections}).
 *
 * An item ref that resolves to no listed item resource is `item-ref-unresolved` at the item ref,
 * its detail the `identifier`, the `href` and, when the `href` names a path inside the package,
 * that `path`. An item ref that writes no identifier names nothing, so it holds no place in the
 * document's identifiers and no reading resolves through it; its missing identifier is the test's
 * own verdict's (reading 147). It is otherwise judged like any other (reading 155, "the laws over
 * what an item ref names judge every item ref, whether or not it ... write[s] an identifier"): one
 * that resolves to no listed item resource is `item-ref-unresolved` with `check: "unwritten"`, the
 * missing `attribute`, the `href`, the `path` when there is one, and `reading: "155"`, and one that
 * resolves has its variable mappings and template defaults judged (`targets`). An item ref that
 * writes no `href` names nothing, and is the test's own verdict's (reading 155). Each `href` is
 * collapsed and resolved by {@link resolveReference}.
 *
 * @param source The document's source.
 * @param base The document's path, which its `href`s resolve against.
 * @param itemPaths The path of every item resource's document.
 * @returns What it holds.
 */
const structureIn = (
  source: SourceDocument,
  base: string,
  itemPaths: ReadonlySet<string>,
): DocumentStructure => {
  const visits = [...walk(source)];
  const replacing = replacingSections(visits);
  const identifiers: StructureIdentifier[] = [];
  const itemRefs: ResolvedItemRef[] = [];
  const sectionRefs: SectionPlacement[] = [];
  const targets: ItemRefTarget[] = [];
  const unresolved: Refusal[] = [];
  for (const { element, path } of visits) {
    const identifier = Option.getOrUndefined(identifierOf(element));
    const href = Option.getOrUndefined(attributeOf(element, "href"));
    const scope = isQti(element, durationScopes);
    if (identifier !== undefined && (scope || isQti(element, itemRefElements))) {
      identifiers.push({
        document: source.location,
        element,
        identifier,
        path: attributePath(path, { local: "identifier", namespace: "" }),
        scope,
      });
    }

    if (href !== undefined && isQti(element, sectionRefElements)) {
      const written = collapse(href);
      sectionRefs.push(
        ...Option.toArray(
          Option.map(resolveReference(base, written), (resolved) => ({
            at: path,
            element,
            href: written,
            path: resolved,
            replaced: replacing.has(element),
          })),
        ),
      );
    } else if (href !== undefined && isQti(element, itemRefElements)) {
      const written = collapse(href);
      const resolved = resolveReference(base, written);
      if (Option.isSome(resolved) && itemPaths.has(resolved.value)) {
        targets.push({ element, path: resolved.value });
        if (identifier !== undefined) {
          itemRefs.push({
            element,
            identifier,
            path: resolved.value,
            replaced: replacing.has(element),
          });
        }
      } else {
        const at = Option.match(resolved, {
          onNone: () => ({}),
          onSome: (resolvedPath) => ({ path: resolvedPath }),
        });
        unresolved.push(
          refuse(
            source.location,
            "item-ref-unresolved",
            path,
            identifier === undefined
              ? {
                  ...at,
                  attribute: "identifier",
                  check: "unwritten",
                  href: written,
                  reading: "155",
                }
              : { ...at, href: written, identifier },
          ),
        );
      }
    }
  }

  return { identifiers, itemRefs, sectionRefs, targets, unresolved, visits };
};

/**
 * The scope a section gives what lies under it, as pantry reads a `Section` for reading 87
 * (`testDocumentOf` in `packages/pantry/src/test/oracle-laws/assembly.ts`): its test part, none
 * when its document holds none above it; whether its children's order is drawn at delivery
 * (`mixes`): it shuffles, or it is invisible with `keep-together` false and its parent's order is
 * drawn, so its children are mixed into its parent's; and whether that looseness reaches its
 * document's root (`looseChain`), so the order of the section ref that places the document draws
 * it.
 */
interface OrderScope {
  readonly looseChain: boolean;
  readonly mixes: boolean;
  readonly part: Option.Option<SourceElement>;
}

/**
 * One element of a test or section document a branch rule may name ({@link branchNameElements})
 * that writes an identifier, with its place in its document: its pre-order interval among the
 * document's elements, its parent, and the scope it lies in.
 */
interface BranchName extends OrderScope {
  readonly element: SourceElement;
  /**
   * One past the pre-order index of its last descendant.
   */
  readonly end: number;
  readonly identifier: string;
  readonly parent: Option.Option<SourceElement>;
  /**
   * Whether it lies under a section of its document whose `qti-selection` has `with-replacement`
   * true ({@link replacingSections}).
   */
  readonly replaced: boolean;
  /**
   * Its pre-order index among its document's elements.
   */
  readonly start: number;
}

/**
 * One section ref of a test or section document, a site where a section document is placed, with
 * its pre-order index and the scope of the parent it is placed in.
 */
interface BranchSite {
  readonly parentLooseChain: boolean;
  readonly parentMixes: boolean;
  readonly part: Option.Option<SourceElement>;
  readonly start: number;
}

/**
 * One branch rule of a test or section document whose `target` names no reserved exit: the rule,
 * its owner, the target with its outer whitespace removed, and the path of the `target` attribute,
 * where a refusal of it is located.
 */
interface BranchRule {
  readonly at: string;
  readonly owner: SourceElement;
  readonly target: string;
}

/**
 * What reading 87 reads of one test or section document: its names, by element and, the first in
 * document order, by identifier; its branch rules; and its sites.
 */
interface DocumentLayout {
  readonly byIdentifier: ReadonlyMap<string, BranchName>;
  readonly names: ReadonlyMap<SourceElement, BranchName>;
  readonly rules: readonly BranchRule[];
  readonly sites: ReadonlyMap<SourceElement, BranchSite>;
}

/**
 * Read an `xs:boolean` attribute of an element, as `xs:boolean` reads it.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @param otherwise The value when it is unwritten or not an `xs:boolean`.
 * @returns Its value.
 */
const flagOf = (element: SourceElement, local: string, otherwise: boolean): boolean =>
  Option.getOrElse(Option.flatMap(attributeOf(element, local), xsBooleanOf), () => otherwise);

/**
 * Report whether a section shuffles its children: its `qti-ordering` has `shuffle` true.
 *
 * @param section The section.
 * @returns Whether it does.
 */
const shufflesChildren = (section: SourceElement): boolean =>
  section.children.some(
    (child) =>
      child.kind === "element" && isQti(child, orderingElements) && flagOf(child, "shuffle", false),
  );

/**
 * Give the end of each element's pre-order interval among a document's elements: one past the
 * index of its last descendant.
 *
 * @param visits The visits of the document's elements, in document order.
 * @returns Each element's end.
 */
const endsOf = (visits: readonly Visit[]): ReadonlyMap<SourceElement, number> => {
  const ends = new Map<SourceElement, number>();
  for (const [offset, { element, parent }] of visits.toReversed().entries()) {
    const end = ends.get(element) ?? visits.length - offset;
    ends.set(element, end);
    for (const above of Option.toArray(parent)) {
      ends.set(above, Math.max(ends.get(above) ?? 0, end));
    }
  }

  return ends;
};

/**
 * Give each section's scope ({@link OrderScope}), from the section above it: under a test part,
 * the part, with no looseness reaching up; at a section document's root, no part, its looseness
 * reaching the root. A section is loose when it is invisible (`visible`, false when unwritten) and
 * does not keep together (`keep-together`, true when unwritten).
 *
 * @param visits The visits of the document's elements, in document order, each parent before its
 *   children.
 * @returns Each section's scope.
 */
const orderScopesOf = (visits: readonly Visit[]): ReadonlyMap<SourceElement, OrderScope> => {
  const sections = new Map<SourceElement, OrderScope>();
  for (const { element, parent } of visits) {
    if (isQti(element, sectionElements)) {
      const underPart = parent.pipe(Option.filter((one) => isQti(one, partElements)));
      const scope = parent.pipe(
        Option.flatMap((one) => Option.fromUndefinedOr(sections.get(one))),
        Option.getOrElse((): OrderScope => ({
          looseChain: Option.isNone(underPart),
          mixes: false,
          part: underPart,
        })),
      );
      const loose = !flagOf(element, "visible", false) && !flagOf(element, "keep-together", true);
      sections.set(element, {
        looseChain: loose && scope.looseChain,
        mixes: shufflesChildren(element) || (loose && scope.mixes),
        part: scope.part,
      });
    }
  }

  return sections;
};

/**
 * Read a branch rule that names a target: one on a test part, a section or an item ref, the owners
 * the ASI XSD places it on, whose `target` is no reserved exit ({@link branchExits}). One with no
 * `target` is the document's own verdict's.
 *
 * @param visit The element's visit.
 * @returns The rule, none for any other element.
 */
const branchRuleOf = ({ element, parent, path }: Visit): Option.Option<BranchRule> =>
  Option.all([
    parent.pipe(Option.filter((owner) => isQti(owner, branchOwnerElements))),
    attributeOf(element, "target").pipe(
      Option.map(trimXmlSpace),
      Option.filter((target) => !branchExits.has(target)),
    ),
  ]).pipe(
    Option.filter(() => isQti(element, branchRuleElements)),
    Option.map(([owner, target]) => ({
      at: attributePath(path, { local: "target", namespace: "" }),
      owner,
      target,
    })),
  );

/**
 * Read what reading 87 reads of one test or section document, as pantry's law oracle reads a test
 * document (`testDocumentOf` in `packages/pantry/src/test/oracle-laws/assembly.ts`): each name,
 * with its section's scope ({@link orderScopesOf}) or, for an element that is not a section, its
 * parent's, no order of its own drawn, a test part its own part; each section ref, a site in its
 * parent's scope; and each branch rule that names a target ({@link branchRuleOf}).
 *
 * @param visits The visits of the document's elements, in document order.
 * @returns What reading 87 reads of it.
 */
const layoutOf = (visits: readonly Visit[]): DocumentLayout => {
  const ends = endsOf(visits);
  const replacing = replacingSections(visits);
  const sections = orderScopesOf(visits);
  /**
   * Give the scope a parent gives what lies under it: a section's own, or, under any other parent,
   * no drawn order, and the parent as the part when it is one.
   *
   * @param parent The parent.
   * @returns The scope.
   */
  const scopeUnder = (parent: Option.Option<SourceElement>): OrderScope =>
    Option.match(parent, {
      onNone: () => ({ looseChain: false, mixes: false, part: Option.none() }),
      onSome: (above) =>
        sections.get(above) ?? {
          looseChain: false,
          mixes: false,
          part: isQti(above, partElements) ? Option.some(above) : Option.none(),
        },
    });
  const byIdentifier = new Map<string, BranchName>();
  const names = new Map<SourceElement, BranchName>();
  const sites = new Map<SourceElement, BranchSite>();
  for (const [start, { element, parent }] of visits.entries()) {
    const identifier = Option.getOrUndefined(identifierOf(element));
    if (identifier !== undefined && isQti(element, branchNameElements)) {
      const name: BranchName = {
        element,
        end: ends.get(element) ?? start + 1,
        identifier,
        parent,
        replaced: replacing.has(element),
        start,
        ...(sections.get(element) ?? {
          looseChain: false,
          mixes: false,
          part: isQti(element, partElements) ? Option.some(element) : scopeUnder(parent).part,
        }),
      };
      names.set(element, name);
      if (!byIdentifier.has(identifier)) {
        byIdentifier.set(identifier, name);
      }
    }

    if (isQti(element, sectionRefElements)) {
      const scope = scopeUnder(parent);
      sites.set(element, {
        parentLooseChain: scope.looseChain,
        parentMixes: scope.mixes,
        part: scope.part,
        start,
      });
    }
  }

  return {
    byIdentifier,
    names,
    rules: visits.flatMap((visit) => Option.toArray(branchRuleOf(visit))),
    sites,
  };
};

/**
 * One section document a test reaches through a section ref, with what it holds.
 */
interface ReachedSection {
  readonly path: string;
  readonly source: SourceDocument;
  readonly structure: DocumentStructure;
}

/**
 * One placement of a test or section document in a test's assembled test, an instance of the
 * document, as pantry's `Instance` is one (`packages/pantry/src/qti/tests.ts`): the test document
 * itself, or a section document a section ref places. A section document placed by two section refs
 * has two placements.
 */
interface Placement extends ReachedSection {
  readonly layout: DocumentLayout;
  /**
   * Whether the order of the section that places it is drawn at delivery, so its loose content is
   * mixed into that order ({@link OrderScope}).
   */
  readonly mixes: boolean;
  /**
   * The placement whose document holds the section ref that places it; none for the test.
   */
  readonly parent: Placement | undefined;
  /**
   * The test part it lies in, none for the test.
   */
  readonly part: Option.Option<SourceElement>;
  /**
   * Whether a section whose `qti-selection` has `with-replacement` true lies above it, anywhere
   * above it in the assembled test, so a selection with replacement can repeat each item ref it
   * holds.
   */
  readonly replaced: boolean;
  /**
   * The pre-order index, in its parent's document, of the section ref that places it; 0 for the
   * test.
   */
  readonly siteStart: number;
}

/**
 * What placing a test's section documents gives: each placement, the test's first, in pre-order,
 * and the `inclusion-cycle` refusal of each section ref that returns to a document on its chain.
 */
interface Assembly {
  readonly cycles: readonly Refusal[];
  readonly placements: readonly Placement[];
}

/**
 * Give the section document at a path, when a section resource names it and the reader read it
 * with the root `qti-assessment-section`.
 *
 * @param path The document's path.
 * @param sectionPaths The path of every section resource's document.
 * @param documents The package's documents.
 * @returns Its source, none otherwise.
 */
const sectionDocumentAt = (
  path: string,
  sectionPaths: ReadonlySet<string>,
  documents: ReadonlyMap<string, Document>,
): Option.Option<SourceDocument> => {
  const source = sectionPaths.has(path) ? documents.get(path)?.source : undefined;

  return source !== undefined &&
    Result.isSuccess(source) &&
    source.success.root.namespace === qtiNamespace &&
    source.success.root.local === "qti-assessment-section"
    ? Option.some(source.success)
    : Option.none();
};

/**
 * Place a test's section documents, as the qti package's assembled test places them (its `Instance`
 * tree, `packages/pantry/src/qti/tests.ts`): a section ref "functions as a facade for the
 * qti-assessment-section to which it refers", so the test places the section document each of its
 * section refs names ({@link sectionDocumentAt}), and, before the ref after it, the ones that
 * document's own section refs name, depth first in document order. A ref whose `href` names no
 * section document the reader read places nothing.
 *
 * Each section ref places its document once, so two refs to one document place it twice (reading
 * 86, "a section document a test places twice is written once"). A ref to a document already on its
 * own chain, the documents from the test down to it, would merge that document into itself without
 * end, which no aggregated document is (reading 85, "an inclusion never reaches itself"): it is
 * `inclusion-cycle` at the section ref, its detail the section ref's `identifier` when it writes
 * one, its `href` as written, the `chain` of document paths from the test through the repeated one,
 * space-separated, and `reading: "85"`, given once for each such section ref of the test, and it
 * places nothing, as pantry's law "Inclusion cycle" refuses it alone. An `xi:include` is never
 * fetched here (S-6), so a loop through includes is not seen, a recorded limit (rule `db2ef322`).
 *
 * Each placement carries whether a section whose selection has replacement lies above it, in the
 * document of any placement above it, so a numbered reading through one of its item refs counts
 * there (reading 88: "anywhere above it in the assembled test"); its test part; and whether its
 * section's order is drawn at delivery, as reading 87 reads them.
 *
 * The walk keeps the placements still open in a list of its own rather than on the call stack, so
 * no length of a chain of refs, each document naming the next, overflows the stack, and no limit is
 * set on it. The work grows with the number of placements, which documents that each place the
 * next more than once multiply; no bound is set on that either, a recorded limit (rule
 * `db2ef322`), as pantry's assembled test holds one instance per placement.
 *
 * @param test The test's own placement.
 * @param sectionPaths The path of every section resource's document.
 * @param itemPaths The path of every item resource's document.
 * @param documents The package's documents.
 * @returns The placements, the test's first, in pre-order, and the cycles' refusals.
 */
const assemble = (
  test: Placement,
  sectionPaths: ReadonlySet<string>,
  itemPaths: ReadonlySet<string>,
  documents: ReadonlyMap<string, Document>,
): Assembly => {
  const read = new Map<
    string,
    Option.Option<Omit<ReachedSection, "path"> & Pick<Placement, "layout">>
  >();
  /**
   * Read the section document at a path once, with what it holds.
   *
   * @param path The document's path.
   * @returns Its source, structure and layout, none when no section document is there.
   */
  const readAt = (path: string) => {
    const known = read.get(path);
    if (known !== undefined) {
      return known;
    }

    const found = Option.map(sectionDocumentAt(path, sectionPaths, documents), (source) => {
      const structure = structureIn(source, path, itemPaths);

      return { layout: layoutOf(structure.visits), source, structure };
    });
    read.set(path, found);

    return found;
  };

  const placements: Placement[] = [test];
  const cycles: Refusal[] = [];
  const refused = new Set<SourceElement>();
  const onChain = new Set<string>([test.path]);
  // Each open placement with the index of its next section ref, the innermost last.
  const open: { readonly placement: Placement; next: number }[] = [{ next: 0, placement: test }];
  for (let frame = open.at(-1); frame !== undefined; frame = open.at(-1)) {
    const { placement } = frame;
    const site = placement.structure.sectionRefs.at(frame.next);
    frame.next += 1;
    if (site === undefined) {
      open.pop();
      onChain.delete(placement.path);
    } else {
      const found = readAt(site.path);
      if (Option.isSome(found) && onChain.has(site.path) && !refused.has(site.element)) {
        refused.add(site.element);

        const chain = [site.path];
        for (
          let above: Placement | undefined = placement;
          above !== undefined;
          above = above.parent
        ) {
          chain.unshift(above.path);
        }

        cycles.push(
          refuse(placement.source.location, "inclusion-cycle", site.at, {
            chain: chain.join(" "),
            href: site.href,
            ...Option.match(identifierOf(site.element), {
              onNone: () => ({}),
              onSome: (identifier) => ({ identifier }),
            }),
            reading: "85",
          }),
        );
      } else if (Option.isSome(found) && !onChain.has(site.path)) {
        const scope = placement.layout.sites.get(site.element);
        const child: Placement = {
          ...found.value,
          mixes:
            (scope?.parentMixes ?? false) ||
            ((scope?.parentLooseChain ?? false) && placement.mixes),
          parent: placement,
          part: Option.orElse(scope?.part ?? Option.none(), () => placement.part),
          path: site.path,
          replaced: site.replaced || placement.replaced,
          siteStart: scope?.start ?? 0,
        };
        placements.push(child);
        onChain.add(site.path);
        open.push({ next: 0, placement: child });
      }
    }
  }

  return { cycles, placements };
};

/**
 * Give the variables of the item each of some resolved item refs names.
 *
 * @param itemRefs The resolved item refs.
 * @param documents The package's documents.
 * @returns What gives an item ref's item's variables, none for an item ref not among them or one
 *   whose item the reader did not read.
 */
const variablesThrough = (
  itemRefs: readonly ItemRefTarget[],
  documents: ReadonlyMap<string, Document>,
): ((itemRef: SourceElement) => Option.Option<ItemVariables>) => {
  const paths = new Map(itemRefs.map((itemRef) => [itemRef.element, itemRef.path] as const));

  return (itemRef) =>
    Option.flatMap(Option.fromUndefinedOr(paths.get(itemRef)), (path) =>
      variablesOf(documents.get(path)),
    );
};

/**
 * Find each part, section and item ref identifier that a test's reach gives again, walking the
 * test's own document, then each section document it reaches, in the order it reaches them, each in
 * its document order.
 *
 * The identifier of a section or item reference "must be unique within the test and must not be the
 * identifier of any testPart" (`info.txt:10759`), and a section ref reads as if its section
 * document were inline. Pantry keys each structure identifier within its document (the `Structure
 * identifier` law, refused `structure-identifier`) and across the assembled test (the `Test name
 * key` law, refused `test-name-key`), both in `packages/pantry/src/qti/tests.ts`. The first
 * occurrence wins: a later one that a document reached before already gave is
 * `duplicate-identifier` at its `identifier` attribute, its detail the `identifier`, as the test
 * rules give one within a document. One a document gives twice is its own verdict's
 * (`duplicateIdentifier` in `#plate/validate/test-rules.ts`), so only a document's first occurrence
 * of an identifier is judged here, and a refusal is never given twice.
 *
 * @param test What the test's own document holds.
 * @param reached The section documents it reaches, in the order the walk reaches them.
 * @returns Each later occurrence's element, with its refusal, at the section document that gives
 *   it.
 */
const repeatsIn = (
  test: DocumentStructure,
  reached: readonly ReachedSection[],
): ReadonlyMap<SourceElement, Refusal> => {
  const met = new Set<string>();
  const repeats = new Map<SourceElement, Refusal>();
  for (const { identifiers } of [test, ...reached.map((section) => section.structure)]) {
    const own = new Set<string>();
    for (const { document, element, identifier, path } of identifiers) {
      if (met.has(identifier) && !own.has(identifier)) {
        repeats.set(element, refuse(document, "duplicate-identifier", path, { identifier }));
      }

      own.add(identifier);
    }

    for (const identifier of own) {
      met.add(identifier);
    }
  }

  return repeats;
};

/**
 * Give each read of an item's context variable through its item ref in a test document's
 * processing: a `qti-variable` or a `qti-default` ({@link contextReadElements}) that lies in the
 * test's `qti-outcome-processing` or in a `qti-template-default` of one of its item refs, and whose
 * `identifier` is a name the predicate takes. The test model, built from the document alone, holds
 * such a read and would run it; the engine holds no value of it: the item marks a declared context
 * variable, and the engine holds no item's `QTI_CONTEXT`.
 *
 * @param source The test's source.
 * @param visits The visits of its elements, in document order.
 * @param readsContext Whether a name reads an item's context variable through its item ref.
 * @returns The reads, in document order, each with the item ref and the path of the processing
 *   element it lies in.
 */
const contextReadsIn = (
  source: SourceDocument,
  visits: readonly Visit[],
  readsContext: (name: string) => boolean,
): readonly UnheldRead[] => {
  const places = new Map<SourceElement, (name: string) => UnheldRead>();
  const reads: UnheldRead[] = [];
  for (const { element, parent, path } of visits) {
    const above = Option.getOrUndefined(parent);
    const itemRef =
      above !== undefined && isQti(above, itemRefElements) ? identifierOf(above) : Option.none();
    const inherited = above === undefined ? undefined : places.get(above);
    if (above === source.root && isQti(element, processingElements)) {
      places.set(element, (name) => ({ kind: "outcome-processing", name, path }));
    } else if (Option.isSome(itemRef) && isQti(element, templateDefaultElements)) {
      places.set(element, (name) => ({
        itemRef: itemRef.value,
        kind: "template-default",
        name,
        path,
      }));
    } else if (inherited !== undefined) {
      places.set(element, inherited);

      const name = Option.getOrUndefined(identifierOf(element));
      if (name !== undefined && isQti(element, contextReadElements) && readsContext(name)) {
        reads.push(inherited(name));
      }
    }
  }

  return reads;
};

/**
 * One name a branch rule's target may resolve to, with the path of the document that writes it.
 */
interface WrittenName {
  readonly name: BranchName;
  readonly path: string;
}

/**
 * Report whether a name's pre-order interval in its document holds a point of that document.
 *
 * @param name The name.
 * @param point The point, a pre-order index.
 * @returns Whether `start ≤ point < end`.
 */
const holdsPoint = (name: BranchName, point: number): boolean =>
  name.start <= point && point < name.end;

/**
 * A branch rule's target resolved in one placement ({@link resolveTarget}): the rule's owner as a
 * name, the placement that holds the target, its index on the chain, and the target as a name.
 */
interface ResolvedTarget {
  readonly holder: Placement;
  readonly holderAt: number;
  readonly owner: BranchName;
  readonly placement: Placement;
  readonly target: BranchName;
}

/**
 * Resolve a branch rule's target in one placement, as reading 87 resolves it: to the element its
 * identifier names in the rule's own placement or one above it, the outermost where several do,
 * since from outside a section document a ref places no target lies inside it (branch rules "treat
 * referred sections as leaf nodes", section 7.5).
 *
 * One that names no such element is `unknown`, unless a section document that two section refs
 * place writes it, so two placements supply it: then it is `ambiguous` (reading 87, "one that two
 * placements of a section document supply twice ... is refused as ambiguous", which the operator's
 * comment on PR #46 asks to apply only to a rule outside that document). A rule whose owner writes
 * no identifier resolves from no source, and is `unknown` beside the owner's own refusal (reading
 * 147).
 *
 * @param chain The placements from the test down to the rule's, the rule's last.
 * @param rule The rule.
 * @param names Each name of the reach by identifier, each document that writes it in the order the
 *   walk reaches them.
 * @param placedAt Each document's placements, by path.
 * @returns The resolved target, or the reason it does not resolve.
 */
const resolveTarget = (
  chain: readonly Placement[],
  rule: BranchRule,
  names: ReadonlyMap<string, readonly WrittenName[]>,
  placedAt: ReadonlyMap<string, readonly Placement[]>,
): Result.Result<ResolvedTarget, string> => {
  const placement = chain.at(-1);
  const owner = placement?.layout.names.get(rule.owner);
  const written = names.get(rule.target) ?? [];
  const holderAt = chain.findIndex(({ path }) => written.some((one) => one.path === path));
  const holder = holderAt === -1 ? undefined : chain.at(holderAt);
  const target = written.find((one) => one.path === holder?.path)?.name;
  if (placement === undefined || owner === undefined) {
    return Result.fail("unknown");
  }

  if (holder === undefined || target === undefined) {
    return Result.fail(
      written.some(({ path }) => (placedAt.get(path)?.length ?? 0) > 1) ? "ambiguous" : "unknown",
    );
  }

  return Result.succeed({ holder, holderAt, owner, placement, target });
};

/**
 * Give why a resolved target is not one its rule may name, in this order, one fault, one reason: on
 * a test part, the target is a test part, and on an item ref or a section, an item ref, section or
 * section ref of the same test part, else `outside-part`; it is no item ref under a section whose
 * `qti-selection` has `with-replacement` true, anywhere above it in the assembled test, else
 * `repeatable`; it is not the rule's own owner, else `self` (reading 87).
 *
 * @param rule The rule.
 * @param resolved Its target, resolved.
 * @returns The reason, none when the target is one the rule may name.
 */
const namingFault = (
  rule: BranchRule,
  { holder, owner, placement, target }: ResolvedTarget,
): Option.Option<string> => {
  const ownsPart = isQti(rule.owner, partElements);
  const isPart = isQti(target.element, partElements);
  const ownerPart = Option.getOrUndefined(Option.orElse(owner.part, () => placement.part));
  const targetPart = Option.getOrUndefined(Option.orElse(target.part, () => holder.part));
  if (ownsPart ? !isPart : isPart || ownerPart !== targetPart) {
    return Option.some("outside-part");
  }

  if (isQti(target.element, itemRefElements) && (target.replaced || holder.replaced)) {
    return Option.some("repeatable");
  }

  return holder === placement && target.element === rule.owner
    ? Option.some("self")
    : Option.none();
};

/**
 * Report whether a resolved target lies after its rule's source, as pantry's law "Branch forward"
 * reads it: in the owner's document, at or after the owner's end; in a document above, after the
 * section ref the rule's placement descends through. A target before it is still accepted when the
 * rule is no test part's, the two do not nest, and the nearest name above the target that holds the
 * source draws its children's order at delivery (it shuffles, or a loose section mixes its children
 * into one that does, {@link OrderScope}), the target under a child of it that does not hold the
 * source: "their order is drawn at delivery and is not judged here, in either direction" (reading
 * 87). A `fixed` choice, which holds some orders under a shuffle, is not read, so a pair it would
 * hold backward is accepted, a recorded limit, as reading 87 records it.
 *
 * @param chain The placements from the test down to the rule's, the rule's last.
 * @param rule The rule.
 * @param resolved Its target, resolved.
 * @returns Whether the target lies after the source, or their order is drawn.
 */
const isForward = (
  chain: readonly Placement[],
  rule: BranchRule,
  { holder, holderAt, owner, placement, target }: ResolvedTarget,
): boolean => {
  const same = holder === placement;
  const point = same ? owner.start : (chain.at(holderAt + 1)?.siteStart ?? owner.start);
  if (same ? target.start >= owner.end : target.start > point) {
    return true;
  }

  const nested =
    holdsPoint(target, point) || (same && owner.start <= target.start && target.start < owner.end);
  /**
   * Give the name that is a name's parent in the target's document.
   *
   * @param name The name.
   * @returns Its parent's name, undefined when its parent is no name.
   */
  const above = (name: BranchName): BranchName | undefined =>
    name.parent.pipe(
      Option.flatMap((parent) => Option.fromUndefinedOr(holder.layout.names.get(parent))),
      Option.getOrUndefined,
    );
  let branch = target;
  let common = above(branch);
  while (common !== undefined && !holdsPoint(common, point)) {
    branch = common;
    common = above(branch);
  }

  return (
    !isQti(rule.owner, partElements) &&
    !nested &&
    common !== undefined &&
    !holdsPoint(branch, point) &&
    (common.mixes || (common.looseChain && holder.mixes))
  );
};

/**
 * Give why reading 87 refuses one branch rule's target in one placement, as pantry's laws "Branch
 * target" and "Branch forward" judge an instance's rule (`packages/pantry/src/qti/tests.ts`): one
 * that does not resolve ({@link resolveTarget}), one the rule may not name ({@link namingFault}),
 * or one before its source whose order is not drawn ({@link isForward}), `backward`.
 *
 * @param chain The placements from the test down to the rule's, the rule's last.
 * @param rule The rule.
 * @param names Each name of the reach by identifier, each document that writes it in the order the
 *   walk reaches them.
 * @param placedAt Each document's placements, by path.
 * @returns The reason, none when the target holds.
 */
const branchFault = (
  chain: readonly Placement[],
  rule: BranchRule,
  names: ReadonlyMap<string, readonly WrittenName[]>,
  placedAt: ReadonlyMap<string, readonly Placement[]>,
): Option.Option<string> =>
  Result.match(resolveTarget(chain, rule, names, placedAt), {
    onFailure: (reason) => Option.some(reason),
    onSuccess: (resolved) =>
      Option.orElse(namingFault(rule, resolved), () =>
        isForward(chain, rule, resolved) ? Option.none() : Option.some("backward"),
      ),
  });

/**
 * Judge the branch rules of one placement over the assembled test (reading 87, {@link branchFault}),
 * as the qti package judges each instance's rules: each target that does not hold is
 * `branch-target` at its `target`, its detail the `target`, the `reason` and `reading: "87"`.
 *
 * @param chain The placements from the test down to the one judged, it last.
 * @param names Each name of the reach by identifier, each document that writes it in the order the
 *   walk reaches them.
 * @param placedAt Each document's placements, by path.
 * @returns The refusals, in document order.
 */
const judgeBranches = (
  chain: readonly Placement[],
  names: ReadonlyMap<string, readonly WrittenName[]>,
  placedAt: ReadonlyMap<string, readonly Placement[]>,
): readonly Refusal[] => {
  const placement = chain.at(-1);

  return (placement?.layout.rules ?? []).flatMap((rule) =>
    Option.toArray(
      Option.map(branchFault(chain, rule, names, placedAt), (reason) =>
        refuse(placement?.source.location ?? "", "branch-target", rule.at, {
          reading: "87",
          reason,
          target: rule.target,
        }),
      ),
    ),
  );
};

/**
 * Give the refusals of the verdict on the document at a path: what its own check already gives,
 * which a package-level judgement of it does not give again.
 *
 * @param documents The package's documents.
 * @param path The document's path.
 * @returns The refusals, none when it is not refused or no verdict is on it.
 */
const ownRefusals = (documents: ReadonlyMap<string, Document>, path: string): readonly Refusal[] =>
  Option.match(
    Option.flatMap(Option.fromUndefinedOr(documents.get(path)), (document) => document.verdict),
    {
      onNone: () => [],
      onSome: (verdict) => (verdict.verdict === "refused" ? verdict.refusals : []),
    },
  );

/**
 * Where one item ref, part or section identifier of a test's reach is written: its document's
 * path, and, for an item ref, whether a selection with replacement in that document can repeat it.
 */
interface WrittenAt {
  readonly document: string;
  readonly replaced: boolean;
}

/**
 * What a test's placements give its references and branch rules ({@link reachOf}).
 */
interface Reach {
  /**
   * Each part and section identifier of the reach, whose `duration` a reading may read.
   */
  readonly durations: ReadonlySet<string>;
  /**
   * Each item ref of the reach, by identifier: the test's own, then each reached section
   * document's that no document before it gave.
   */
  readonly itemRefs: ReadonlyMap<string, ResolvedItemRef>;
  readonly names: ReadonlyMap<string, readonly WrittenName[]>;
  /**
   * Each document's placements, by path, in the order the walk places them.
   */
  readonly placedAt: ReadonlyMap<string, readonly Placement[]>;
  /**
   * Each section document the test places, at its first placement, in the order the walk places
   * them.
   */
  readonly reached: readonly Placement[];
  readonly repeats: ReadonlyMap<SourceElement, Refusal>;
  readonly written: ReadonlyMap<string, WrittenAt>;
}

/**
 * Gather what a test's placements give its references and branch rules: each document's
 * placements; the section documents placed, each once; the identifiers a document gives again
 * across the reach ({@link repeatsIn}), which are left out of it, so the first wins; each item ref,
 * part and section identifier, where it is written; and each name a branch rule may name, with
 * each document that writes it.
 *
 * @param test The test's own placement.
 * @param placements Every placement, the test's first, in pre-order.
 * @returns What they give.
 */
const reachOf = (test: Placement, placements: readonly Placement[]): Reach => {
  const placedAt = new Map<string, Placement[]>();
  for (const placement of placements) {
    placedAt.set(placement.path, [...(placedAt.get(placement.path) ?? []), placement]);
  }

  const reached = [...placedAt.values()].flatMap(([first]) =>
    first === undefined || first === test ? [] : [first],
  );
  const repeats = repeatsIn(test.structure, reached);
  const itemRefs = new Map(
    test.structure.itemRefs.map((itemRef) => [itemRef.identifier, itemRef] as const),
  );
  const written = new Map<string, WrittenAt>(
    test.structure.itemRefs.map(
      ({ identifier, replaced }) => [identifier, { document: test.path, replaced }] as const,
    ),
  );
  for (const { path, structure } of reached) {
    for (const itemRef of structure.itemRefs) {
      if (!repeats.has(itemRef.element) && !itemRefs.has(itemRef.identifier)) {
        itemRefs.set(itemRef.identifier, itemRef);
        written.set(itemRef.identifier, { document: path, replaced: itemRef.replaced });
      }
    }
  }

  const durations = new Set<string>();
  const names = new Map<string, WrittenName[]>();
  for (const { layout, path, structure } of [test, ...reached]) {
    for (const { element, identifier, scope } of structure.identifiers) {
      if (scope && !repeats.has(element)) {
        durations.add(identifier);
        if (!written.has(identifier)) {
          written.set(identifier, { document: path, replaced: false });
        }
      }
    }

    for (const [identifier, name] of layout.byIdentifier) {
      names.set(identifier, [...(names.get(identifier) ?? []), { name, path }]);
    }
  }

  return { durations, itemRefs, names, placedAt, reached, repeats, written };
};

/**
 * Give what a reading may name through each item ref of a test's reach: its item's variables, and
 * the targets of its variable mappings whose source the item declares.
 *
 * @param itemRefs Each item ref of the reach, by identifier.
 * @param documents The package's documents.
 * @returns What each names, by identifier, none for an item ref whose item the reader did not read.
 */
const itemsOf = (
  itemRefs: ReadonlyMap<string, ResolvedItemRef>,
  documents: ReadonlyMap<string, Document>,
): ReadonlyMap<string, ItemRefVariables> => {
  const items = new Map<string, ItemRefVariables>();
  for (const [identifier, itemRef] of itemRefs) {
    for (const variables of Option.toArray(variablesOf(documents.get(itemRef.path)))) {
      items.set(identifier, {
        ...variables,
        mapped: new Map(
          mappingsOf(itemRef.element).flatMap(([from, to]) =>
            Option.toArray(
              Option.map(
                Option.fromUndefinedOr(variables.declarations.get(from)),
                (declaration) => [to, declaration] as const,
              ),
            ),
          ),
        ),
      });
    }
  }

  return items;
};

/**
 * Give a test's own variables by their whole identifier: its built-ins, then each outcome or
 * context variable it declares, what the unsplit reading of a reference reads.
 *
 * @param source The test's source.
 * @returns Its variables.
 */
const wholeOf = (source: SourceDocument): ReadonlyMap<string, ReadVariable> =>
  new Map<string, ReadVariable>([
    ...[...testBuiltIns].map(([name, builtIn]) => [name, builtInVariable(builtIn)] as const),
    ...source.root.children.flatMap((child) =>
      child.kind === "element" && isQti(child, testDeclarations)
        ? Option.toArray(
            Option.map(
              identifierOf(child),
              (identifier) =>
                [
                  identifier,
                  {
                    declaration: Option.some(child),
                    kind: kindOf(child),
                    type: declaredType(child),
                  },
                ] as const,
            ),
          )
        : [],
    ),
  ]);

/**
 * What judging one test gives: each of its own item refs' item path, keyed by the item ref's
 * identifier, in document order; the section documents it reaches; the test's refusals: the item
 * refs', their variable mappings', their template defaults', the references', those of the test's
 * processing that only its typed reach gives, then its branch rules', each in document order; the
 * reads of an item's context variable through its item ref in the test document's processing; and
 * the refusals of the section documents it reaches, judged under it.
 */
interface TestJudgement {
  readonly reached: readonly ReachedSection[];
  /**
   * Each read of an item's context variable through its item ref in the test document's outcome
   * processing or in a template default of one of its item refs ({@link contextReadsIn}), which
   * the delivered test marks.
   */
  readonly reads: readonly UnheldRead[];
  readonly refs: ReadonlyMap<string, string>;
  readonly refusals: readonly Refusal[];
  /**
   * The refusals of the section documents the test places, judged under the test: each section ref
   * that returns to a document on its chain, then, for each placement in the order the walk places
   * them, the identifiers its document gives again across the test's reach, at its first placement,
   * its references', those of its expressions that only the test's scope and typed reach give, and
   * its branch rules', each at the section document, in its document order, each given once
   * however many placements give it.
   */
  readonly sections: readonly Refusal[];
}

/**
 * Judge one test document of the package: each item ref resolved against the test's path to an item
 * resource the manifest lists ({@link structureIn}), its variable mappings by {@link judgeMappings}
 * and its template defaults by {@link judgeTemplateDefaults}, each dotted reference by reading 48
 * ("a dotted reference is accepted when exactly one reading names a real item ref, test part or
 * section and its variable"), then the test's processing through its typed reach, then its branch
 * rules over the assembled test (reading 87, {@link judgeBranches}).
 *
 * The test's reach is its own parts, sections and item refs and those of each section document it
 * places through its section refs ({@link assemble}), each item ref of a section document resolved
 * against that document's path. A part, section or item ref identifier is given once across the
 * reach: one a section document gives again after the test or a document reached before gave it is
 * `duplicate-identifier` at that document and left out of the reach, so the first wins
 * ({@link repeatsIn}; pantry's `structure-identifier`), so a later item ref never shadows a part's
 * or a section's `duration`; a section document placed twice gives its identifiers once (reading
 * 86). The test's dotted references resolve through the rest and through the test's own variables:
 * a name the test declares whole, as an outcome or context variable (reading 37 lets an identifier
 * hold `.`), or holds as a built-in, is its unsplit reading, which counts beside every other
 * (reading 48, "the unsplit reading counts among them"). A reading through an item ref, part or
 * section reads one placement of its document: from inside that document, or a document it places,
 * the placement that holds the reference, and from anywhere else each placement, so a reference
 * from outside a section document placed twice reads it twice and is `ambiguous-reference` (reading
 * 86; pantry refuses a reading through a name two placements give wherever the reference stands,
 * `Prefixed_reference`, an agreement difference). An item ref a selection with replacement can
 * repeat in that placement, in its own document or above the section ref that places it, is
 * repeatable there, and only through one does a numbered reading count (reading 88). A name with no
 * `.` is the test's own check's; every other is judged by {@link judgeReference}. An item ref
 * resolves a reading only through an item whose document the package holds and the reader read, so
 * a reference through any other names nothing, as pantry's reach holds no such item ref. Only the
 * test's own item refs are its items (`refs`): a session delivers no section document's item, and
 * the test model marks a processing that reads through one.
 *
 * The test's expressions are then judged by the item's processing rules (`processingRefusals` in
 * `#plate/validate/rules.ts`: P20 to P24), with each prefixed read typed by the variable its one
 * counting reading reads, as pantry's `typePrefixed` types it, and a name no reading or two
 * readings count for typed unknown, so it keeps its reading's refusal alone; with each unweighted
 * `qti-test-variables` with no `base-type` typed from the declarations of the reach's items
 * ({@link collectedBaseType}; G-R3 199); and with each template default judged against the
 * template variable it sets. Only what that typed run adds is reported (Admission A5): the same
 * rules over the test alone, every prefixed read unknown, are the test document's own verdict's,
 * and a refusal the references already gave is not given again. A reached section document's item
 * refs are judged once for the package ({@link judgeReached}).
 *
 * Each placement of a section document is then judged under the test, as the qti package places a
 * test or section document once per instance of every test that places it (its law
 * `Prefixed_reference` and its `Instance` tree, `packages/pantry/src/qti/expressions.ts` and
 * `packages/pantry/src/qti/tests.ts`), since its references "resolve once for each test that
 * includes the section, not once for the section on its own" (reading 5) and a fragment a section
 * document places "is judged in the test that places it, once per placement" (reading 145): its
 * dotted references by {@link judgeReference} against the test's reach from that placement, the
 * test's own variables among their readings, its expressions by the item's processing rules under
 * the test's processing scope, its declarations and built-ins, with the test's typed reach from
 * that placement, its collections typed from the reach's items, and each of the section document's
 * template defaults judged against the template variable it sets, and its branch rules over the
 * assembled test. Each refusal is at the section document, and given once however many placements
 * give it. As for the test, only what that run adds is reported: the same rules over the section
 * alone, every name unknown, are the section document's own verdict's, and so are the branch
 * refusals its own check already gives.
 *
 * Last, it finds each read in the test document's processing, its outcome processing and its item
 * refs' template defaults, of an item's context variable through its item ref
 * ({@link contextReadsIn}): a name the test does not hold whole whose one counting reading reads a
 * variable the item declares in a `qti-context-declaration`, directly or in the numbered form, or
 * the built-in `QTI_CONTEXT` (reading 106, "a prefixed reference reaches every built-in variable
 * its item ref's item holds, `QTI_CONTEXT` among them"). The engine holds no value of either, so
 * the delivered test marks the processing that reads it. A read in a reached section document is
 * left alone: a session delivers none of its items, and the test model marks a read through one.
 *
 * @param source The test's source.
 * @param testPath The test's path.
 * @param itemPaths The path of every item resource's document.
 * @param sectionPaths The path of every section resource's document.
 * @param documents The package's documents.
 * @returns Its own item refs' item paths, the section documents it reaches, its refusals and theirs
 *   under it, and its reads of an item's context variable.
 */
const judgeTest = (
  source: SourceDocument,
  testPath: string,
  itemPaths: ReadonlySet<string>,
  sectionPaths: ReadonlySet<string>,
  documents: ReadonlyMap<string, Document>,
): TestJudgement => {
  const own = structureIn(source, testPath, itemPaths);
  const test: Placement = {
    layout: layoutOf(own.visits),
    mixes: false,
    parent: undefined,
    part: Option.none(),
    path: testPath,
    replaced: false,
    siteStart: 0,
    source,
    structure: own,
  };
  const { cycles, placements } = assemble(test, sectionPaths, itemPaths, documents);
  const { durations, itemRefs, names, placedAt, reached, repeats, written } = reachOf(
    test,
    placements,
  );
  const items = itemsOf(itemRefs, documents);
  const variablesFor = variablesThrough(own.targets, documents);
  const mappingRefusals = judgeMappings(source.location, own.visits, variablesFor);
  const defaults = judgeTemplateDefaults(source.location, own.visits, variablesFor);
  const whole = wholeOf(source);
  // The placements from the test down to the one being judged, it last, and each by its document's
  // path: the scope reads them, so it is read only while that placement is judged.
  const chain: Placement[] = [test];
  const chainAt = new Map<string, Placement>([[testPath, test]]);
  const scope: ReferenceScope = {
    durations,
    items,
    placements: (identifier) => {
      const at = written.get(identifier);
      if (at === undefined) {
        return [];
      }

      const holder = chainAt.get(at.document);

      return (holder === undefined ? (placedAt.get(at.document) ?? []) : [holder]).map(
        (placement) => at.replaced || placement.replaced,
      );
    },
    whole,
  };
  /**
   * Report whether the test holds a variable by a name, as it must for a `pattern`'s braced name to
   * reference it (ruling R1).
   *
   * @param name The name.
   * @returns Whether the test declares it whole, holds it as a built-in, or resolves it by a
   *   reading.
   */
  const held = (name: string): boolean => whole.has(name) || readingsOf(scope, name).length > 0;

  /**
   * Judge each dotted reference of a test or section document's elements by reading 48 ("a dotted
   * reference is accepted when exactly one reading names a real item ref, test part or section and
   * its variable") against the test's reach from the placement being judged, the test's own
   * variables included.
   *
   * @param document The document's location.
   * @param visits The visits of its elements, in document order.
   * @returns The refusals, in document order.
   */
  const judgeReferences = (document: string, visits: readonly Visit[]): readonly Refusal[] =>
    visits.flatMap((visit) =>
      referencesOf(visit.element, held).flatMap((reference) =>
        reference.identifier.includes(".") ? judgeReference(document, visit, reference, scope) : [],
      ),
    );
  const references = judgeReferences(source.location, own.visits);

  /**
   * Type a prefixed read by the variable its one resolving reading reads, from the placement being
   * judged.
   *
   * @param name The prefixed read.
   * @returns Its type, unknown when no reading or two readings resolve it.
   */
  const typed: PrefixedTyper = (name) => {
    const [only, ...others] = readingsOf(scope, name);

    return only === undefined || others.length > 0 ? unknownType : only.variable.type;
  };
  /**
   * Type what an unweighted `qti-test-variables` with no `base-type` collects, from the reach's
   * items (G-R3 199).
   *
   * @param name The `variable-identifier`.
   * @returns The base type.
   */
  const collected: CollectedTyper = (name) => collectedBaseType(items, name);
  const processing = notHeld(
    processingRefusals(
      source,
      tables,
      typed,
      (templateDefault) => Option.fromUndefinedOr(defaults.targets.get(templateDefault)),
      Option.none(),
      collected,
    ),
    [...processingRefusals(source, tables, () => unknownType), ...references],
  );
  const branches = notHeld(judgeBranches(chain, names, placedAt), ownRefusals(documents, testPath));

  /**
   * Report whether a name the test's processing reads names an item's context variable through its
   * item ref: the test does not hold it whole, and its one counting reading reads a context
   * variable, one its item declares in a `qti-context-declaration` or the built-in `QTI_CONTEXT`
   * (reading 106).
   *
   * @param name The name.
   * @returns Whether it does.
   */
  const readsContext = (name: string): boolean => {
    if (whole.has(name)) {
      return false;
    }

    const [only, ...others] = readingsOf(scope, name);

    return only !== undefined && others.length === 0 && only.variable.kind === "context";
  };
  const reads = contextReadsIn(source, own.visits, readsContext);

  // What each section document gives the same in every placement: the targets of its template
  // defaults, and its processing's refusals alone.
  const once = new Map<
    string,
    {
      readonly alone: readonly Refusal[];
      readonly targets: ReadonlyMap<SourceElement, ExpressionType>;
    }
  >();
  /**
   * Judge one placement of a section document under the test, the placement last on the chain:
   * at its document's first placement, the identifiers it gives again across the reach; its
   * references', those of its expressions that only the test's scope and typed reach give, and its
   * branch rules', beyond those its own verdict already gives.
   *
   * @param placement The placement.
   * @returns The refusals, at the section document, in its document order.
   */
  const judgePlacement = ({ path, source: section, structure }: Placement): readonly Refusal[] => {
    const known = once.get(path);
    const { alone, targets } = known ?? {
      alone: processingRefusals(section, tables, () => unknownType),
      targets: judgeTemplateDefaults(
        section.location,
        structure.visits,
        variablesThrough(structure.targets, documents),
      ).targets,
    };
    once.set(path, { alone, targets });

    const sectionReferences = judgeReferences(section.location, structure.visits);

    return [
      ...(known === undefined
        ? structure.identifiers.flatMap(({ element }) =>
            Option.toArray(Option.fromUndefinedOr(repeats.get(element))),
          )
        : []),
      ...sectionReferences,
      ...notHeld(
        processingRefusals(
          section,
          tables,
          typed,
          (templateDefault) => Option.fromUndefinedOr(targets.get(templateDefault)),
          Option.some(source),
          collected,
        ),
        [...alone, ...sectionReferences],
      ),
      ...notHeld(judgeBranches(chain, names, placedAt), ownRefusals(documents, path)),
    ];
  };
  const sections: Refusal[] = [...cycles];
  for (const placement of placements.slice(1)) {
    while (chain.length > 0 && chain.at(-1) !== placement.parent) {
      chainAt.delete(chain.pop()?.path ?? "");
    }

    chain.push(placement);
    chainAt.set(placement.path, placement);
    sections.push(...notHeld(judgePlacement(placement), sections));
  }

  return {
    reached,
    reads,
    refs: new Map(own.itemRefs.map(({ identifier, path }) => [identifier, path] as const)),
    refusals: [
      ...own.unresolved,
      ...mappingRefusals,
      ...defaults.refusals,
      ...references,
      ...processing,
      ...branches,
    ],
    sections,
  };
};

/**
 * Judge the item refs of a section document a test reaches, once for the package however many tests
 * reach it: their variable mappings by {@link judgeMappings} and their template defaults by
 * {@link judgeTemplateDefaults}, against the item each resolves to from the section document's path,
 * each refusal at the section document, as pantry contains a mapping's source and a default's
 * target in its item ref's item's declarations (the `Template default target` and `Variable mapping
 * source` laws in `packages/pantry/src/qti/expressions.ts`). A section document no test reaches is
 * judged by its own verdict alone.
 *
 * @param section The reached section document.
 * @param documents The package's documents.
 * @returns The refusals, the mappings' then the template defaults', each in document order.
 */
const judgeReached = (
  section: ReachedSection,
  documents: ReadonlyMap<string, Document>,
): readonly Refusal[] => {
  const { location } = section.source;
  const { targets, visits } = section.structure;
  const variablesFor = variablesThrough(targets, documents);

  return [
    ...judgeMappings(location, visits, variablesFor),
    ...judgeTemplateDefaults(location, visits, variablesFor).refusals,
  ];
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
 * Each test is delivered as its document's own verdict accepted it, unless the test document's
 * processing reads an item's context variable through its item ref: then it is delivered with that
 * processing marked (`withUnheldReads` in `#plate/model/test.ts`), the outcome processing `marked`
 * and each template default that reads one left out.
 *
 * @param manifest The manifest.
 * @param documents The package's documents, every judged one accepted.
 * @param tests What judging each test gave, its item paths, by item ref identifier, and its reads
 *   of an item's context variable, keyed by the test's path.
 * @param location The package's location.
 * @returns The contents.
 */
const contentsOf = (
  manifest: Manifest,
  documents: ReadonlyMap<string, Document>,
  tests: ReadonlyMap<string, Pick<TestJudgement, "reads" | "refs">>,
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
          Option.map((test): PackageTest => {
            const reads = tests.get(path)?.reads ?? [];

            return {
              items: new Map(
                [...(tests.get(path)?.refs ?? new Map<string, string>())].flatMap(
                  ([identifier, itemPath]) =>
                    Option.toArray(
                      itemAt(itemPath).pipe(Option.map((item) => [identifier, item] as const)),
                    ),
                ),
              ),
              test:
                reads.length === 0
                  ? test
                  : acceptMarkedTest(test, withUnheldReads(test.test, reads)),
            };
          }),
        ),
      (entry) => entry.test.document,
    ),
    version: manifest.version,
  };
};

/**
 * Judge a package whose manifest is read: the file rules, the documents, the roots, the LOM
 * metadata, the tests and the section documents they reach, then the verdict over them.
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
  const sectionPaths = new Set(pathsOfType(manifest, "imsqti_section_xmlv3p0"));
  const tests = new Map<string, Pick<TestJudgement, "reads" | "refs">>();
  const testRefusals: Refusal[] = [];
  const underTests: Refusal[] = [];
  const reached = new Map<string, ReachedSection>();
  for (const path of pathsOfType(manifest, "imsqti_test_xmlv3p0")) {
    const source = documents.get(path)?.source;
    if (
      source !== undefined &&
      Result.isSuccess(source) &&
      source.success.root.namespace === qtiNamespace &&
      source.success.root.local === "qti-assessment-test"
    ) {
      const judged = judgeTest(source.success, path, itemPaths, sectionPaths, documents);
      tests.set(path, judged);
      testRefusals.push(...judged.refusals);
      underTests.push(...notHeld(judged.sections, underTests));
      for (const section of judged.reached) {
        if (!reached.has(section.path)) {
          reached.set(section.path, section);
        }
      }
    }
  }

  const sectionRefusals = [...reached.values()].flatMap((section) =>
    judgeReached(section, documents),
  );

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
    ...sectionRefusals,
    ...underTests,
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
    verdict:
      verdicts.some((verdict) => verdict.verdict === "accepted-with-unsupported") ||
      [...tests.values()].some((judged) => judged.reads.length > 0)
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
