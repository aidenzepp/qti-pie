/**
 * The XSD's own validator against the law oracle, on every corpus document in both schema
 * versions (slice A2).
 *
 * Oracle: a second implementation. libxml2's XML Schema validator (`xmllintValidate`) judges each
 * document against the pinned XSDs of a version, through the catalog and drivers of
 * `#pantry/test/xsd-catalog.ts`, sharing no code with the grammar; the law oracle
 * (`#pantry/test/oracle.ts`) judges the same bytes in the same version by the grammar's laws.
 * Each document is judged in both versions, whatever its package declares, so each version's XSD
 * is compared with the grammar of that version on every document. The two are compared class by
 * class (`compareJudgments`), and every difference is either recorded below ({@link recorded}),
 * each with its reason, or the test fails: a difference is a bug in one of the two oracles, a
 * spec reading that departs from the XSD on purpose, or a limit of libxml2. A record no
 * difference matches any more fails too, so the records stay the exact list of what differs.
 *
 * The comparison's contract is per document and per class, not per message: the law oracle stops
 * at the reader's, the codec's or a fold's first refusal, so what `xmllint` says beyond it is
 * counted as masked rather than as a difference.
 *
 * Gated on `GR8DES_CORPUS=1` and on the XSD cache. It writes, under a folder of the run's own,
 * `work/xsd-corpus-*` (`#pantry/test/scratch.ts`), removed after the file's last test: `files/`
 * (the documents), `agreement.tsv` (one row per document and version) and `differences.tsv` (one
 * row per difference, with the record that classifies it). Each folder this file writes is the
 * run's own, so two runs at once never remove each other's documents under xmllint.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it as unit, layer } from "@effect/vitest";
import { Console, Effect, FileSystem, Layer, Option, Result } from "effect";
import { Digest } from "effect/crypto";
import { encode } from "@qti-pie/crust/encode.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { floorSeed, rotatingSeed } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { runOfProcess } from "@grizzle/testing/vitest/run";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { fragmentRoots } from "#pantry/grammar/facets.ts";
import { isForeignKind, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { foldGrammarOf, namesOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { toXmlDocument } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materializeCorpus } from "#pantry/test/fixtures.ts";
import { xdmDocument } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, explain, lawsOf, ruleOf } from "#pantry/test/oracle.ts";
import type { Laws } from "#pantry/test/oracle.ts";
import { fileScratchDirectory } from "#pantry/test/scratch.ts";
import { settings } from "#pantry/test/settings.ts";
import {
  classOfLaw,
  compareJudgments,
  driverFor,
  schemaSetOf,
  writeXsdOracle,
} from "#pantry/test/xsd-catalog.ts";
import type {
  Comparison,
  Difference,
  LawClass,
  LawJudgment,
  XsdOracle,
} from "#pantry/test/xsd-catalog.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { coveredElements } from "#pantry/vocab/inventory/extensions.ts";
import { asiNamespace, xlinkNamespace, xmlNamespace } from "#pantry/vocab/namespaces.ts";
import { foreignRoots } from "#pantry/vocab/open.ts";
import { OracleLayer, xmllintValidate } from "#pantry/xml/oracle.ts";
import type { XsdVerdict } from "#pantry/xml/oracle.ts";

/**
 * The folder the corpus comparison writes to, `packages/pantry/work/xsd-corpus-*`, the run's own.
 */
const outputRoot = fileScratchDirectory("xsd-corpus-");

/**
 * The folder the oracle's driver schemas and catalog are written to, `work/xsd-oracle-*`, the
 * run's own.
 */
const oracleRoot = fileScratchDirectory("xsd-oracle-");

/**
 * The timeout, in milliseconds, for the one test: two `xmllint` runs over every corpus document
 * (one per version, each compiling its version's XSDs once) and the law oracle over every document
 * in both versions.
 *
 * Measured on 2026-11-05: each `xmllint` run over the 380 documents took 16.4 s of wall time at a
 * load average near 30 (3.4 s of CPU). The budget is to be set from the whole test's measured
 * time; until then it is 300 s. Raise it only on a new measurement recorded here, never to make a
 * run pass.
 */
const testTimeoutMs = 300_000;

/**
 * Whether the XSD cache holds every pin, so `xmllint` can read them.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The services the test reads and spawns with.
 */
const TestLayer = Layer.mergeAll(
  NodeServices.layer,
  Digest.layerWebCrypto,
  OracleLayer.pipe(Layer.provide(NodeServices.layer)),
);

/**
 * Why one difference is no defect of either oracle:
 *
 * - `reading`: a spec reading (`docs/spec-readings.md`) departs from the XSD on purpose;
 * - `specification`: the information model states the rule in so many words, a rule over several
 *   elements or attributes that no XSD expresses, so the law beyond the XSD needs no reading; its
 *   `source` is the sentence's section, as the law table cites it;
 * - `libxml2`: a named class of libxml2's disagreement with XML Schema that holds wherever it
 *   applies, counted in every run's report rather than matched to one document, and never stale.
 *
 * A defect of the grammar, the codec, shred or the law oracle is never a record: it stays an
 * unrecorded difference, which fails its test until the owner's fix lands.
 */
type Reason =
  | { readonly _tag: "libxml2"; readonly why: string }
  | { readonly _tag: "reading"; readonly reading: number; readonly why: string }
  | { readonly _tag: "specification"; readonly source: string; readonly why: string };

/**
 * One recorded difference: what it matches (its direction, and optionally its class, the oracle's
 * rule, a pattern over its detail and the documents and versions it holds in) and why.
 */
interface Recorded {
  readonly class?: LawClass;
  readonly detail?: RegExp;
  readonly direction: Difference["direction"];
  readonly document?: RegExp;
  readonly reason: Reason;
  readonly rule?: string;
  readonly versions?: readonly SchemaVersion[];
}

/**
 * A dangling `xs:IDREF`: libxml2 2.9.13 never resolves an `xs:IDREF` under `--schema`, so a
 * dangling one, which XML Schema refuses (Part 1, 3.3.4 and the ID/IDREF table, cvc-id.1),
 * validates; it does refuse a repeated `xs:ID`.
 */
const idrefRecord: Recorded = {
  class: "identity",
  detail: /^Idref target /u,
  direction: "oracle-only",
  reason: { _tag: "libxml2", why: "libxml2 never resolves IDREF targets under --schema" },
  rule: "idref-target",
};

/**
 * The two location attributes: libxml2 2.9.13 never assesses the value of `xsi:schemaLocation` or
 * `xsi:noNamespaceSchemaLocation`, while it refuses the same value in `xml:base`. XML Schema types
 * them a list of `xs:anyURI` and `xs:anyURI` (Part 1, 3.2.7): Element Locally Valid (Complex Type),
 * clause 3, sets the four `xsi:` attributes aside from the attribute uses and the wildcard, and
 * Schema-Validity Assessment (Element), clause 2, still assesses every attribute (3.2.4), which
 * resolves these two to their built-in declarations.
 */
const locationRecord: Recorded = {
  class: "attribute-value",
  detail: /^value domain at \S+: xsi:(?:noNamespaceSchemaLocation|schemaLocation): /u,
  direction: "oracle-only",
  reason: {
    _tag: "libxml2",
    why: "libxml2 never assesses the value of xsi:schemaLocation or xsi:noNamespaceSchemaLocation against its built-in declaration",
  },
  rule: "attribute-lexical",
};

/**
 * `xsi:nil` on a foreign element: libxml2 2.9.13 never assesses the value of `xsi:nil` on an
 * element no declaration assesses, a foreign element, where the attribute's built-in declaration
 * (Part 1, 3.2.7, an `xs:boolean`) still assesses it, as {@link locationRecord} says of the two
 * location attributes.
 */
const laxNilRecord: Recorded = {
  class: "attribute-value",
  detail:
    /^value domain at \S*\/(?:foreign-element|no-namespace-element|own-namespace-element)\[\d+\]: xsi:nil: /u,
  direction: "oracle-only",
  reason: {
    _tag: "libxml2",
    why: "libxml2 never assesses the value of xsi:nil on a foreign element against its built-in declaration",
  },
  rule: "attribute-lexical",
};

/**
 * An empty `xs:IDREFS`: libxml2 2.9.13 accepts an `xs:IDREFS` that holds no token, an empty or
 * blank value, which the type's `minLength` of 1 refuses (XML Schema Part 2, 3.3.10).
 */
const emptyIdrefsRecord: Recorded = {
  class: "attribute-value",
  detail: /^value domain at \S+: \S+: "(?:\\[tnr]| )*" is outside xs:IDREFS, /u,
  direction: "oracle-only",
  reason: {
    _tag: "libxml2",
    why: "libxml2 accepts an xs:IDREFS of no token, which its minLength of 1 refuses",
  },
  rule: "attribute-lexical",
};

/**
 * A blank list in element content: libxml2 2.9.13 accepts an element an `xsi:type` types
 * `xs:NMTOKENS` or `xs:IDREFS` whose content is empty or blank, a list of no item, which the type's
 * `minLength` of 1 refuses (XML Schema Part 2, 3.3.5 and 3.3.10), as {@link emptyIdrefsRecord}
 * says of an attribute.
 */
const blankListRecord: Recorded = {
  class: "text-value",
  detail: /^TextDomain at \S+: "(?:\\[tnr]| )*" is outside xs:(?:IDREFS|NMTOKENS), /u,
  direction: "oracle-only",
  reason: {
    _tag: "libxml2",
    why: "libxml2 accepts an element of a list type, xs:NMTOKENS or xs:IDREFS, that holds no item, which the type's minLength of 1 refuses",
  },
  rule: "text-copy",
};

/**
 * A stray character in base64: libxml2 2.9.13 skips every character outside the base64 alphabet in
 * an `xs:base64Binary` value, as RFC 2045 §6.8 tells a decoder of mail to, so it accepts `<` or `a
 * b>&` and counts only the letters. XML Schema's lexical space (Part 2, 3.2.16, the `Base64Binary`
 * production) holds the alphabet, `=` padding and spaces only, and the value domain holds that.
 */
const base64Record: Recorded = {
  class: "text-value",
  detail: /^TextDomain at \S+: "(?:[^"\\]|\\.)*" is outside m:base64, /u,
  direction: "oracle-only",
  reason: {
    _tag: "libxml2",
    why: "libxml2 skips characters outside the base64 alphabet in xs:base64Binary, which XML Schema's lexical space does not hold",
  },
  rule: "text-copy",
};

/**
 * A second message for an `xsi:type`: libxml2 2.9.13 follows each `xsi:type` it cannot use, one
 * that is no QName, binds no prefix or names no type, with a second message on its element, "The
 * type definition is absent.", beside the one on the attribute that the comparison reads as the
 * value's class. The second message reports no other fault, so it is no difference of its own; the
 * first is compared as any other.
 */
const absentTypeRecord: Recorded = {
  class: "other",
  detail:
    /^line \d+ (?:\{[^}]*\})?\S+: The type definition is absent\.(?: \| line \d+ (?:\{[^}]*\})?\S+: The type definition is absent\.)*$/u,
  direction: "xsd-only",
  reason: {
    _tag: "libxml2",
    why: "libxml2 reports an xsi:type it cannot use a second time, on its element",
  },
};

/**
 * An `xml:id` held twice whose value is no NCName: libxml2 2.9.13's parser counts every `xml:id`
 * toward the document's IDs, its value valid or not, and reports the second as `ID … already
 * defined`. XML Schema keys only ID values (Part 1, 3.3.4, cvc-id.2), and a value outside
 * `xs:ID` is none, so the law oracle refuses each value (`value domain`) and no key.
 */
const invalidIdRecord: Recorded = {
  class: "identity",
  detail:
    /^line \d+: element \S+: validity error : ID (?![\p{L}_][\p{L}\p{N}._-]* already defined)[\s\S]+? already defined/u,
  direction: "xsd-only",
  reason: {
    _tag: "libxml2",
    why: "libxml2's parser counts an xml:id that is no NCName toward the document's IDs and reports the second as already defined",
  },
};

/**
 * The classes of disagreement libxml2's validator shows wherever they apply, on corpus and
 * generated documents alike, each shown by a control test below. Each run counts them; none goes
 * stale.
 */
const libxml2Records: readonly Recorded[] = [
  idrefRecord,
  locationRecord,
  laxNilRecord,
  emptyIdrefsRecord,
  blankListRecord,
  base64Record,
  absentTypeRecord,
  invalidIdRecord,
];

/**
 * Count the differences a libxml2 class accounts for.
 *
 * @param matches - The record each difference matched, `undefined` for none.
 * @returns How many matched one of {@link libxml2Records}.
 */
const libxml2Count = (matches: readonly (Recorded | undefined)[]): number =>
  matches.filter((match) => match !== undefined && libxml2Records.includes(match)).length;

/**
 * The class of disagreement spec reading 60 rules on, once open question B3 of
 * `docs/rfc/for-sterling.md`: an element no declaration of its document's schema set names,
 * assessed laxly under a wildcard, whose `xsi:type` is a QName that names no type of the schemas.
 * XML Schema's clause 1.2 fails there and lax assessment applies, which reads as valid, and
 * `xmllint` refuses it ("does not resolve to a type definition"), a verdict the reading records
 * against itself. Counted in every generated run; never stale.
 *
 * Only a laxly assessed element is this class, decided from the law oracle's own rows: it is one of
 * the foreign kinds, whose `OpenElementName` row holds its expanded name, or of a kind whose
 * namespace the document's schema set does not declare (reading 81). A strictly assessed
 * element whose `xsi:type` resolves to no type definition fails Element Locally Valid (Element),
 * cvc-elt clause 4.2 (XML Schema 1.0 Part 1 §3.3.4): it is invalid, so the law oracle accepting it
 * is a defect and stays unrecorded.
 */
const laxXsiType: Recorded = {
  class: "attribute-value",
  direction: "xsd-only",
  reason: {
    _tag: "reading",
    reading: 60,
    why: "an xsi:type naming no type, on an element laxly assessed under a wildcard: XML Schema's clause 1.2 fails and lax assessment applies, which reads as valid; xmllint refuses it",
  },
};

/**
 * One of `xmllint`'s messages that an element's `xsi:type` names no type definition, the element's
 * expanded name captured.
 */
const unresolvedXsiType =
  /^line \d+ (?<name>\{[^}]*\}\S+): The QName value '[^']*' of the xsi:type attribute does not resolve to a type definition\.$/u;

/**
 * Decide whether a difference is reading 60's class ({@link laxXsiType}): every message `xmllint`
 * gave for it says an `xsi:type` resolves to no type definition, each on an element the law
 * oracle's rows hold as laxly assessed.
 *
 * @param difference - The difference.
 * @param laxNames - The document's laxly assessed elements' expanded names.
 * @returns Whether it is.
 */
const isLaxXsiType = (difference: Difference, laxNames: ReadonlySet<string>): boolean =>
  difference.direction === laxXsiType.direction &&
  difference.class === laxXsiType.class &&
  difference.detail.split(" | ").every((message) => {
    const name = unresolvedXsiType.exec(message)?.groups?.["name"];

    return name !== undefined && laxNames.has(name);
  });

/**
 * The class of disagreement spec reading 6 departs from the XSD by: a QTI root, processing root or
 * manifest nested inside `lax` wildcard content is valid and kept as foreign content, while XML
 * Schema finds its global declaration there and assesses it strictly (Part 1, 3.10.4), so
 * `xmllint` refuses whatever in it the declaration does not admit.
 *
 * Only such a root and what it holds is this class, decided from the law oracle's own rows: a
 * foreign element named as one of `foreignRoots`' kinds is, and so is every element within it.
 */
const nestedRoot: Recorded = {
  direction: "xsd-only",
  reason: {
    _tag: "reading",
    reading: 6,
    why: "a QTI root nested in lax wildcard content is valid and kept as foreign content; xmllint assesses it against its global declaration",
  },
};

/**
 * Decide whether one `xmllint` message is reading 6's: it is on an element within a nested root.
 * `xmllint` names an element in no namespace by its local name alone, which the rows write `{}`
 * before.
 *
 * @param message - The message, as {@link compareJudgments} writes it.
 * @param nested - The expanded names of the document's elements within a nested root.
 * @returns Whether it is.
 */
const isNestedMessage = (message: string, nested: ReadonlySet<string>): boolean => {
  const name = /^line \d+ (?<name>\S+): /u.exec(message)?.groups?.["name"];

  return name !== undefined && nested.has(name.startsWith("{") ? name : `{}${name}`);
};

/**
 * Decide whether a difference is reading 6's class ({@link nestedRoot}): every message `xmllint`
 * gave for it is on an element within a nested root.
 *
 * @param difference - The difference.
 * @param nested - The expanded names of the document's elements within a nested root.
 * @returns Whether it is.
 */
const isNestedRoot = (difference: Difference, nested: ReadonlySet<string>): boolean =>
  difference.direction === nestedRoot.direction &&
  difference.detail.split(" | ").every((message) => isNestedMessage(message, nested));

/**
 * The class of disagreement spec reading 81 states as its known limit: the grammar is keyed by
 * version and not by schema set, so a kind that stands in documents of more than one set (LOM's,
 * in a manifest and in an external LOM file, and the foreign kinds, in every document) reads an
 * element under its `lax` wildcards as the declaration any of those sets gives it, and judges it
 * so, while XML Schema assesses an element the document's own set does not declare against
 * nothing. A `drd:hazard` beneath a LOM element in an external LOM file is the reading's example.
 *
 * Only a refusal of an element or attribute in a namespace outside the document's set is this
 * class, decided from the law oracle's own rows and the XSDs' imports ({@link isOutsideSet}).
 */
const outsideSet: Recorded = {
  direction: "oracle-only",
  reason: {
    _tag: "reading",
    reading: 81,
    why: "the grammar, keyed by version and not by schema set, judges an element or attribute its document's schema set does not declare as another set declares it; XML Schema assesses it against nothing",
  },
};

/**
 * `qti-ordering`'s extension slot (spec reading 61): it admits an element in QTI's own namespace
 * or in none, which the information model's "reused QTI ASI tags" allows, laxly, while the XSD's
 * `##other` wildcard refuses it and `xmllint` with it, naming the first such child of the slot.
 */
const orderingSlot: Recorded = {
  class: "content",
  direction: "xsd-only",
  reason: {
    _tag: "reading",
    reading: 61,
    why: "qti-ordering's extension slot admits QTI's own elements and elements in no namespace, read as ##any laxly; the XSD's ##other refuses them",
  },
};

/**
 * One `xmllint` message of reading 61's class: an element its parent's `##other` wildcard over
 * QTI's namespace does not expect, as {@link compareJudgments} writes it. `xmllint` names the
 * wildcard it expected only while no other element has matched it.
 */
const otherWildcardMessage =
  /^line \d+ (?<element>\S+): This element is not expected\.(?: Expected is \( ##other\{http:\/\/www\.imsglobal\.org\/xsd\/imsqtiasi_v3p0\}\* \)\.)?$/u;

/**
 * A document whose root is only an included fragment's (spec reading 114): its root is any kind an
 * include stands for, which the XSDs declare locally, so `xmllint`, validating the document alone,
 * finds no global declaration for its validation root and judges nothing below it, while the law
 * oracle judges the document as a fragment's, its root admitted, the package's `RootOfType`
 * judging it by its resource type. Every difference of such a document is this one's.
 */
const fragmentRoot: Recorded = {
  direction: "xsd-only",
  reason: {
    _tag: "reading",
    reading: 114,
    why: "a fragment's document roots at a kind an include stands for, which the XSDs declare locally; xmllint, validating it alone, finds no global declaration for the root",
  },
};

/**
 * The expanded names of the roots only a fragment's document has (spec reading 114), as
 * `namespace}local`.
 */
const fragmentOnlyRoots: ReadonlySet<string> = (() => {
  const grammar = Result.getOrThrow(composed());
  const listed = new Set(
    grammar.package.rootOfType.rows
      .filter(({ type }) => type !== "imsqti_fragment_xmlv3p0")
      .map(({ root }) => root),
  );

  return new Set(
    fragmentRoots.flatMap(({ root }) =>
      listed.has(root) || root === "cp:manifest"
        ? []
        : Option.toArray(grammar.kinds.elementName.lookup({ kind: root })).map(
            ({ local, namespace }) => `${namespace}}${local}`,
          ),
    ),
  );
})();

/**
 * The namespaces of the global attributes reading 81's limit types by the union of a kind's schema
 * sets, by the prefix the law table names them with: `xml.xsd`'s four, which the ASI and
 * content-packaging sets import, and XLink's ten, which the content-packaging set alone imports.
 */
const globalAttributeNamespaces: ReadonlyMap<string, string> = new Map([
  ["xml:", xmlNamespace],
  ["xlink:", xlinkNamespace],
]);

/**
 * A breach as the comparison writes it: its law, the node it is at, and what it says.
 */
const breachDetail = /^(?<law>.+?) at (?<path>\/\S*): (?<rest>[\s\S]*)$/u;

/**
 * Reading 6's class from the law oracle's side: a nested root kept as foreign content is judged as
 * foreign content, its text and attributes by the type its `xsi:type` names where that type
 * resolves (reading 60), while `xmllint` assesses the same element against its global
 * declaration, under which the `xsi:type` is no valid derivation and the text is not read so.
 */
const nestedRootLaw: Recorded = {
  direction: "oracle-only",
  reason: {
    _tag: "reading",
    reading: 6,
    why: "a QTI root nested in lax wildcard content is kept as foreign content and judged so, by its xsi:type (reading 60); xmllint assesses it against its global declaration",
  },
};

/**
 * Decide whether a difference is {@link nestedRootLaw}: a law refusal the law oracle states of a
 * node within a nested root, by the path the comparison writes.
 *
 * @param difference - The difference.
 * @param nestedPaths - The paths of the document's nodes within a nested root, as the law oracle
 *   writes a node's place.
 * @returns Whether it is.
 */
const isNestedRootLaw = (difference: Difference, nestedPaths: ReadonlySet<string>): boolean => {
  const place = breachDetail.exec(difference.detail)?.groups?.["path"];

  return (
    difference.direction === nestedRootLaw.direction &&
    place !== undefined &&
    nestedPaths.has(place)
  );
};

/**
 * Decide whether a difference is reading 81's limit ({@link outsideSet}): the law oracle refuses an
 * element whose kind's namespace, or an `xml:` or XLink attribute whose namespace, the document's
 * schema set does not declare, and a kind that stands in more than one set read it: a foreign
 * element above the element, or holding the attribute, whose wildcard reads every set, or, in an
 * external LOM file, LOM's kinds reading a manifest's set. An `xsi:` attribute is XML Schema's own,
 * which every set declares, and a foreign kind names no namespace of its own, so neither is this
 * class. An element outside the set that no such kind read is not the limit but the grammar reading
 * it where reading 81 makes it foreign, a defect, and stays unrecorded.
 *
 * @param difference - The difference.
 * @param names - The document's names, its schema set and what LOM's kinds read beyond it.
 * @param grammar - The composed grammar, whose `ElementName` gives each kind's namespace.
 * @returns Whether it is.
 */
const isOutsideSet = (
  difference: Difference,
  names: ForeignNames,
  grammar: ComposedGrammar,
): boolean => {
  const groups = breachDetail.exec(difference.detail)?.groups;
  if (difference.direction !== outsideSet.direction || groups === undefined) {
    return false;
  }

  const kinds = (groups["path"] ?? "")
    .split("/")
    .slice(1)
    .map((segment) => segment.replace(/\[\d+\]$/u, ""));
  const kind = kinds.at(-1) ?? "";
  const rest = groups["rest"] ?? "";
  const attribute = groups["law"] === "value domain" ? rest.slice(0, rest.indexOf(": ")) : "";
  if (attribute.startsWith("xsi:")) {
    return false;
  }

  // An element is read by its parent's wildcard, and an attribute by its own element's.
  const readers = attribute === "" ? kinds.slice(0, -1) : kinds;
  const beneathForeign = readers.some((held) => isForeignKind(held));

  const namespace = Option.orElse(
    Option.fromUndefinedOr(
      globalAttributeNamespaces.get(attribute.slice(0, attribute.indexOf(":") + 1)),
    ),
    () => Option.map(grammar.kinds.elementName.lookup({ kind }), ({ namespace: held }) => held),
  );

  return Option.exists(
    namespace,
    (held) => !names.set.has(held) && (beneathForeign || names.lomReads.has(held)),
  );
};

/**
 * The class of disagreement spec reading 90 departs from the XSD by: on an element the Schematron's
 * extension rules cover (`coveredElements`), an attribute its XSD does not declare is a `data-`
 * name in no namespace or the document is refused, while `xmllint`, which runs no Schematron,
 * admits it under the element's `##any` `lax` wildcard. The codec refuses it as an attribute its
 * kind admits under no name or open class.
 */
const extensionAttribute: Recorded = {
  class: "attribute-allowed",
  detail: new RegExp(
    `^codec at \\S*: The attribute (?!data-|xml:|xsi:)\\S+ in (?:[^\\s:]+:)?(?:${[
      ...new Set(coveredElements.map(({ element: named }) => named.local)),
    ].join("|")}) is admitted on its element under no name or open class`,
    "u",
  ),
  direction: "oracle-only",
  reason: {
    _tag: "reading",
    reading: 90,
    why: "the Schematron's extension rules admit no undeclared attribute but a data- one on the elements they cover; xmllint runs no Schematron and admits it under the ##any lax wildcard",
  },
  rule: "attribute-admission",
};

/**
 * Decide whether a generated case's difference is reading 81's limit ({@link outsideSet}) by where
 * its variant was applied: a named invalid variant at an element whose namespace the document's
 * schema set does not declare, which only a kind standing in more than one set reads as its
 * declaration, so the law oracle refuses what XML Schema assesses against nothing. The codec may
 * refuse such a variant before any law reads a row, so {@link isOutsideSet}, which reads the
 * oracle's rows, cannot see it.
 *
 * @param difference - The difference.
 * @param drawnCase - The case.
 * @param drawnCase.atNamespace - The namespace of the element the variant is applied at.
 * @param drawnCase.variant - The variant.
 * @param set - The namespaces of the document's schema set.
 * @returns Whether it is.
 */
const isOutsideVariant = (
  difference: Difference,
  drawnCase: { readonly atNamespace: string; readonly variant: Variant },
  set: ReadonlySet<string>,
): boolean =>
  difference.direction === outsideSet.direction &&
  drawnCase.variant !== "valid" &&
  !set.has(drawnCase.atNamespace);

/**
 * Every difference between the two oracles on the corpus, classified.
 */
const recorded: readonly Recorded[] = [
  extensionAttribute,
  {
    class: "content",
    detail:
      /^N7 Last at \S*qti-assessment-section\[\d+\]: qti-assessment-section holds \{(?:qti-rubric-block[^,}]*(?:, )?)*\}/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 26,
      why: "an assessment section has at least one child section or item reference; the XSD admits a section of rubric blocks alone",
    },
    rule: "child-set",
  },
  {
    class: "beyond",
    detail: /names completion_status, which nothing declares and no built-in variable is/u,
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 72,
      why: "the built-in outcome is completionStatus, compared exactly; adaptive.xml sets completion_status, which nothing declares",
    },
    rule: "P8",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "specification",
      source:
        "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_BaseSequence.Attr_label (§5.16.5)",
      why: "if an item uses labels then its root carries tool-name and tool-version; the XSD makes all three optional and relates none",
    },
    rule: "label-tool",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 104,
      why: "no two choices of one class in a document share an identifier, whichever interactions hold them; the XSD states no key over choice identifiers",
    },
    rule: "choice-identifier-distinct",
  },
];

/**
 * The differences generated documents show that no corpus document does, classified as
 * {@link recorded} classifies the corpus's. A generated run draws its own documents, so a record
 * here may match nothing in a run, and none goes stale.
 */
const generatedRecorded: readonly Recorded[] = [
  {
    class: "content",
    detail:
      /^codec at \/: The element \S+ in \S+ is in the MathML namespace, and its parent admits no MathML element of that name, while MathML content stands only inside an m:math element/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      why: "MathML content stands only inside m:math, as the MathML 3 RelaxNG's start and anyElement state; the XSD declares each MathML element globally, so a lax wildcard assesses one alone against its declaration",
    },
    rule: "unmodeled-vocabulary",
  },
  {
    class: "attribute-value",
    detail:
      /^line \d+ \{http:\/\/www\.imsglobal\.org\/xsd\/imsqtiasi_v3p0\}qti-match-table-entry: \[facet 'enumeration'\] The value '.*?' is not an element of the set \{'boolean', 'directedPair', [^}]*\}\.(?: \| line \d+ \{http:\/\/www\.imsglobal\.org\/xsd\/imsqtiasi_v3p0\}qti-match-table-entry: \[facet 'enumeration'\] The value '.*?' is not an element of the set \{'boolean', 'directedPair', [^}]*\}\.)*$/u,
    direction: "xsd-only",
    reason: {
      _tag: "reading",
      reading: 8,
      why: "a match table entry's target-value is a value of the outcome's base type; the XSD types it as one of the base-type names",
    },
  },
  {
    class: "content",
    detail: /^N7 Last at \S*qti-assessment-section\[\d+\]: qti-assessment-section holds \{\}/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 26,
      why: "an assessment section has at least one child; the XSD admits an empty one",
    },
    rule: "child-set",
  },
  {
    class: "content",
    detail:
      /^N6 ancestry at \S+: \S+ sits in \{[^}]*\}: Banned holds \{test\} of it, and Needs lacks \{\}$/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 25,
      why: "a test's rubric block and feedback hold no interactions or templates; the full ASI XSD admits them",
    },
    rule: "ancestry-ban",
  },
  {
    class: "content",
    detail:
      /^N6 ancestry at \S+: qti-gap sits in \{[^}]*\}: Banned holds \{\} of it, and Needs lacks \{gap\}$/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 38,
      why: "a qti-gap appears only within a gap-match interaction; the XSD admits it in any phrasing container",
    },
    rule: "ancestry-ban",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 74,
      why: "a variable's identifier is declared once in its item or test; the XSD states no key over declarations",
    },
    rule: "declaration-key",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 41,
      why: "SSML's meta takes a name or an http-equiv and not both, and its voice and prosody at least one attribute (readings 41 and 43); the SSML XSD makes each optional",
    },
    rule: "attribute-count",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 2,
      why: "a MathML operator takes the arguments its class states (MathML 3, 4.3.4); the XSD's apply takes any number",
    },
    rule: "math-arity",
  },
  {
    class: "beyond",
    detail: /^SSML (?:lexicon reference|trim mark) /u,
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 3,
      why: "an SSML startmark or endmark names a mark of its speak once, and a lookup's ref a lexicon of it (SSML 1.1, 3.1.1.1 and 3.1.5); the XSD types them as tokens",
    },
    rule: "ssml-fragment",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 78,
      why: "a mapping maps a base type other than file and duration, of a variable that is not a record, so a declaration with no base type maps none; the XSD admits a mapping in any response declaration",
    },
    rule: "mapping-base-type",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 100,
      why: "a match or interpolation table sets a single outcome, so one under a multiple, ordered or record outcome declaration is refused; the XSD admits the tables under any outcome declaration",
    },
    rule: "lookup-cardinality",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 75,
      why: "an interaction's response-identifier names a response its item declares; the XSD types it an identifier and resolves it nowhere",
    },
    rule: "binding-declared",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "specification",
      source:
        "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_ResponseIf (§2.5.1.2, ResponseIf and ResponseElseIf: 'An expression which must have an effective value of boolean'; §2.8.1.6, TemplateConstraint)",
      why: "a condition's expression is boolean and single; the XSD types no expression, so a dropped or swapped child leaves a condition of another type it accepts",
    },
    rule: "P21",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "specification",
      source:
        "https://www.imsglobal.org/spec/qti/v3p0/info#Expr3 (§2.11.3, each operator's sub-expressions' base types and cardinalities)",
      why: "each operator takes the operand types §2.11.3 states; the XSD admits any expression as any operand",
    },
    rule: "P23",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "specification",
      source:
        "https://www.imsglobal.org/spec/qti/v3p0/info#ExprTestNumberCorrect (§2.11.4, the test operators: 'can only be used in outcomes processing')",
      why: "the test operators stand only in outcome processing; the XSD admits them in any expression, response processing's included",
    },
    rule: "P25",
  },
];

/**
 * One corpus document: the zip it is in, its path in the zip, the version its package declares,
 * its bytes, and where it was written for `xmllint`.
 */
interface CorpusDocument {
  readonly bytes: Uint8Array;
  readonly declared: string;
  readonly file: string;
  readonly path: string;
  readonly zip: string;
}

/**
 * One document's judgment in one version, compared, and the record each difference matched.
 */
interface Judged {
  readonly comparison: Comparison;
  readonly document: CorpusDocument;
  readonly matches: readonly (Recorded | undefined)[];
  readonly version: SchemaVersion;
}

/**
 * Give the node numbered `index` a uuid that spells its number, as the oracle's own ids do.
 *
 * @param index - The node's number in document order.
 * @returns The uuid.
 */
const nodeIdOf = (index: number): NodeId =>
  `00000000-0000-4000-8fff-${index.toString(16).padStart(12, "0")}`;

/**
 * What a document's rows say of the elements XML Schema assesses laxly or not at all, each name as
 * `{namespace}local`: every foreign element (`lax`); every element within a nested root that
 * reading 6 keeps foreign (`nested`, {@link nestedRoot}), and each such node's place as the law
 * oracle writes it (`nestedPaths`, {@link nestedRootLaw}); every element of a kind whose namespace
 * the document's schema set does not declare (`outside`, reading 81), which a wildcard can only
 * assess laxly; that set's namespaces (`set`); and the namespaces LOM's kinds read beyond it
 * (`lomReads`): in an external LOM file, a manifest's set, since LOM's kinds stand in manifests too
 * (reading 81's limit), and none in any other document.
 */
interface ForeignNames {
  readonly lax: ReadonlySet<string>;
  readonly lomReads: ReadonlySet<string>;
  readonly nested: ReadonlySet<string>;
  readonly nestedPaths: ReadonlySet<string>;
  readonly outside: ReadonlySet<string>;
  readonly set: ReadonlySet<string>;
}

/**
 * Write an expanded name as `xmllint`'s messages do.
 *
 * @param name - The name.
 * @param name.local - Its local name.
 * @param name.namespace - Its namespace name, empty for none.
 * @returns `{namespace}local`.
 */
const writtenName = ({ local, namespace }: { local: string; namespace: string }): string =>
  `{${namespace}}${local}`;

/**
 * Collect a document's {@link ForeignNames} from its rows: its foreign elements by their
 * `OpenElementName` rows, and its nested roots, foreign elements named as one of `foreignRoots`'
 * kinds, with every element whose interval lies within one, a kind by its `ElementName`.
 *
 * @param bytes - The document.
 * @param version - The version it is read in.
 * @param grammar - The composed grammar.
 * @returns The names; none when the document does not shred.
 */
const foreignNamesOf = Effect.fn("test.foreignNamesOf")(function* foreignNamesOf(
  bytes: Uint8Array,
  version: SchemaVersion,
  grammar: ComposedGrammar,
): Effect.fn.Return<ForeignNames, never, FileSystem.FileSystem> {
  const tree = yield* Effect.result(
    readXml(bytes).pipe(Effect.flatMap((xml) => shred(xml, version, shredGrammarOf(grammar)))),
  );
  const kindNameOf = (kind: string) => grammar.kinds.elementName.lookup({ kind });
  const rootNames = new Set(
    [...foreignRoots].flatMap((kind) => Option.toArray(kindNameOf(kind)).map(writtenName)),
  );
  if (Result.isFailure(tree)) {
    return {
      lax: new Set(),
      lomReads: new Set(),
      nested: new Set(),
      nestedPaths: new Set(),
      outside: new Set(),
      set: new Set(),
    };
  }

  const namespaceOf = (kind: string): string =>
    Option.match(kindNameOf(kind), { onNone: () => "", onSome: ({ namespace }) => namespace });
  const rootNamespace = namespaceOf(tree.success.root.kind);
  const set = yield* schemaSetOf(version, rootNamespace).pipe(Effect.orDie);
  const lomReads =
    rootNamespace === namespaceOf("lom:lom")
      ? yield* schemaSetOf(version, namespaceOf("cp:manifest")).pipe(Effect.orDie)
      : new Set<string>();
  const rows = flatten(tree.success, nodeIdOf);
  const opened = new Map(rows.openElementNames.map((row) => [row.node, writtenName(row)]));
  const roots = rows.nodes.filter((node) => rootNames.has(opened.get(node.id) ?? ""));
  const within = rows.nodes.filter((node) =>
    roots.some((root) => root.start <= node.start && node.end <= root.end),
  );

  const byId = new Map(rows.nodes.map((node) => [node.id, node]));
  const placeOf = (node: (typeof rows.nodes)[number]): string => {
    const steps: string[] = [];
    for (let at = byId.get(node.id); at !== undefined && at.start > 0n; at = byId.get(at.parent)) {
      steps.push(`${at.kind}[${String(at.at)}]`);
    }

    return `/${steps.toReversed().join("/")}`;
  };

  return {
    lax: new Set(opened.values()),
    lomReads,
    nested: new Set(
      within.flatMap((node) =>
        Option.toArray(
          Option.orElse(Option.fromNullishOr(opened.get(node.id)), () =>
            Option.map(kindNameOf(node.kind), writtenName),
          ),
        ),
      ),
    ),
    nestedPaths: new Set(within.map(placeOf)),
    outside: new Set(
      rows.nodes.flatMap((node) =>
        Option.toArray(kindNameOf(node.kind))
          .filter(({ namespace }) => !set.has(namespace))
          .map(writtenName),
      ),
    ),
    set,
  };
});

/**
 * The judgment of a document the reader, the codec or a fold refused: its one refusal.
 *
 * @param law - What refused it.
 * @param rule - The rule the refusal is named by.
 * @param detail - What it said.
 * @param cls - The refusal's class.
 * @returns The judgment, stopped.
 */
const stop = (law: string, rule: string, detail: string, cls: LawClass): LawJudgment => ({
  refusals: [{ class: cls, detail, law, node: "", rule }],
  stopped: true,
});

/**
 * Judge one document by the law oracle alone, in one version: crust's reader, the codec (shred),
 * the folds, then every document law (`documentBreaches`). The package laws are left out, since
 * they read a manifest's listing, which no XSD judges.
 *
 * @param input - What to judge.
 * @param input.bytes - The document's bytes.
 * @param input.grammar - The composed grammar.
 * @param input.laws - Its tables, from `lawsOf`.
 * @param input.path - Its path, which the breaches name.
 * @param input.version - The version it is read in.
 * @returns The judgment.
 */
const judgeDocument = Effect.fn("test.judgeDocument")(function* judgeDocument(input: {
  readonly bytes: Uint8Array;
  readonly grammar: ComposedGrammar;
  readonly laws: Laws;
  readonly path: string;
  readonly version: SchemaVersion;
}): Effect.fn.Return<LawJudgment> {
  const read = yield* Effect.result(readXml(input.bytes));
  if (Result.isFailure(read)) {
    const rule = read.failure._tag === "WellFormednessError" ? "well-formedness" : "reader-refusal";

    return stop("reader", rule, read.failure.message, "well-formed");
  }

  const tree = yield* Effect.result(
    shred(read.success, input.version, shredGrammarOf(input.grammar)),
  );
  if (Result.isFailure(tree)) {
    const { failure } = tree;
    if (failure._tag === "NotQti3") {
      return stop("codec", "not-qti3", failure.message, "vocabulary");
    }

    const cls = ((): LawClass => {
      if (failure.kind === "attribute") {
        // An attribute no handle names, one its kind admits under neither its closed handle nor
        // its open class, an xml: or xsi: attribute its kind does not admit, and a data-* name
        // outside the data class's language (reading 13) are attributes the element does not
        // allow (cvc-complex-type clause 3), as xmllint's "is not allowed" says. An xsi:type that
        // is no QName in scope, or names no type, is a value its attribute's declaration refuses
        // (cvc-elt clauses 4.1 and 4.2), which xmllint reports on the attribute. A namespace name
        // behind an entity reference is no schema rule's.
        const { reason } = failure;
        switch (reason) {
          case "data-name":
          case "declared":
          case "unadmitted":
          case "unnamed": {
            return "attribute-allowed";
          }
          case "namespace-entity": {
            return "other";
          }
          case "type-unknown":
          case "type-unresolved": {
            return "attribute-value";
          }
          case "strict-undeclared": {
            // An element's refusal, never an attribute's: a strictly held element no type
            // assesses, which xmllint reports as "demanded by the strict wildcard".
            return "content";
          }
          case "mathml-foreign": {
            // An element's refusal, never an attribute's: MathML content outside m:math, which
            // the MathML 3 RelaxNG's start and anyElement refuse (reading 2), where xmllint
            // assesses the element against its global declaration.
            return "content";
          }
          default: {
            return reason satisfies never;
          }
        }
      }

      return Option.isNone(failure.parent) ? "vocabulary" : "content";
    })();

    return stop(
      "codec",
      failure.reason === "unadmitted" ? "attribute-admission" : "unmodeled-vocabulary",
      failure.message,
      cls,
    );
  }

  const rows = fold(tree.success, nodeIdOf, foldGrammarOf(input.grammar));
  if (Result.isFailure(rows)) {
    return rows.failure._tag === "ChildUnadmitted"
      ? stop("N5 admitted", "admission", rows.failure.message, "content")
      : stop("AL1 admission", "attribute-admission", rows.failure.message, "attribute-allowed");
  }

  // A law that throws on rows the folds wrote is the oracle's defect on this document, reported as
  // such rather than ending the comparison of every other document.
  const breaches = yield* Effect.result(
    Effect.try({
      catch: (error) =>
        error instanceof Error
          ? `${error.message} (${(error.stack ?? "")
              .split("\n")
              .slice(1, 3)
              .map((frame) => frame.trim())
              .join("; ")})`
          : String(error),
      try: () => documentBreaches(input.path, rows.success, input.laws),
    }),
  );
  if (Result.isFailure(breaches)) {
    return stop("oracle", "internal", `a law threw: ${breaches.failure}`, "internal");
  }

  return {
    refusals: breaches.success.map((breach) => ({
      class: classOfLaw(breach.law, ruleOf(breach.law)),
      detail: explain(breach.law, breach.keys, input.grammar),
      law: breach.law,
      node: breach.keys["node"] ?? "",
      rule: ruleOf(breach.law),
    })),
    stopped: false,
  };
});

/**
 * Find the record a difference matches.
 *
 * @param document - The document.
 * @param version - The version it was judged in.
 * @param difference - The difference.
 * @returns The first record that matches it, or `undefined`.
 */
const recordOf = (
  document: CorpusDocument,
  version: SchemaVersion,
  difference: Difference,
  records: readonly Recorded[] = recorded,
): Recorded | undefined =>
  records.find(
    (record) =>
      record.direction === difference.direction &&
      (record.class === undefined || record.class === difference.class) &&
      (record.rule === undefined || record.rule === difference.rule) &&
      (record.detail === undefined || record.detail.test(difference.detail)) &&
      (record.document === undefined || record.document.test(`${document.zip}/${document.path}`)) &&
      (record.versions === undefined || record.versions.includes(version)),
  );

/**
 * Write a reason as one line.
 *
 * @param reason - The reason.
 * @returns Its tag, its reading, and why.
 */
const reasonText = (reason: Reason): string => {
  switch (reason._tag) {
    case "libxml2": {
      return `libxml2: ${reason.why}`;
    }
    case "reading": {
      return `reading ${String(reason.reading)}: ${reason.why}`;
    }
    case "specification": {
      return `${reason.source}: ${reason.why}`;
    }
    default: {
      return reason satisfies never;
    }
  }
};

/**
 * Write rows as TSV: a header, then one line per row, each field's tabs and line breaks spaced
 * out.
 *
 * @param header - The column names.
 * @param rows - The rows.
 * @returns The text.
 */
const tsv = (header: readonly string[], rows: readonly (readonly string[])[]): string =>
  [header, ...rows]
    .map((row) => `${row.map((field) => field.replaceAll(/[\t\r\n]+/gu, " ")).join("\t")}\n`)
    .join("");

/**
 * Read the schema version a manifest declares, for the report: the text of its first
 * `schemaversion` element.
 *
 * @param bytes - The manifest's bytes.
 * @returns The version as written, or empty when it declares none.
 */
const declaredOf = (bytes: Uint8Array): string =>
  /<(?:\w+:)?schemaversion>\s*(?<version>[^<]*?)\s*</u.exec(new TextDecoder().decode(bytes))
    ?.groups?.["version"] ?? "";

/**
 * Validate documents with `xmllint` in a version, each against its root's schema set (spec reading
 * 81): grouped by the namespace of their root, each group with that namespace's root driver.
 *
 * @param oracle - What `writeXsdOracle` wrote.
 * @param version - The schema version.
 * @param documents - Each document's bytes and the file it was written to.
 * @returns Each document's verdict, in order.
 */
const validated = Effect.fn("test.validated")(function* validated(
  oracle: XsdOracle,
  version: SchemaVersion,
  documents: readonly { readonly bytes: Uint8Array; readonly file: string }[],
) {
  const roots = yield* Effect.forEach(
    documents,
    ({ bytes }) =>
      readXml(bytes).pipe(
        Effect.map(({ root }) => root.namespace),
        Effect.orElseSucceed(() => ""),
      ),
    { concurrency: 1 },
  );
  const groups = Map.groupBy(
    documents.map((document, at) => ({ ...document, at, root: roots[at] ?? "" })),
    ({ root }) => root,
  );
  const verdicts = new Map<number, XsdVerdict>();

  for (const [root, held] of groups) {
    const got = yield* xmllintValidate({
      catalog: oracle.catalog,
      paths: held.map(({ file }) => file),
      schema: driverFor(oracle, version, root),
    });

    for (const [slot, { at, file }] of held.entries()) {
      verdicts.set(at, got[slot] ?? (yield* Effect.die(new Error(`no verdict for ${file}`))));
    }
  }

  const ordered: XsdVerdict[] = [];
  for (const [at, { file }] of documents.entries()) {
    ordered.push(verdicts.get(at) ?? (yield* Effect.die(new Error(`no verdict for ${file}`))));
  }

  return ordered;
});

/**
 * Read every XML document of the corpus and write each where `xmllint` reads it.
 *
 * @returns The documents, in corpus order.
 */
const corpusDocuments = Effect.fn("xsd.corpusDocuments")(function* corpusDocuments() {
  const fs = yield* FileSystem.FileSystem;
  const corpus = yield* materializeCorpus();
  const documents: CorpusDocument[] = [];

  for (const entry of corpus) {
    const files = yield* readPackage(entry.dir);
    const manifest = files.find(({ kind }) => kind === "manifest");
    const declared = manifest === undefined ? "" : declaredOf(manifest.bytes);

    for (const file of files.filter(({ path: at }) => at.toLowerCase().endsWith(".xml"))) {
      const written = `${outputRoot}/files/${entry.name}/${file.path}`;

      yield* fs.makeDirectory(path.dirname(written), { recursive: true });
      yield* fs.writeFile(written, file.bytes);
      documents.push({
        bytes: file.bytes,
        declared,
        file: written,
        path: file.path,
        zip: entry.name,
      });
    }
  }

  return documents;
});

describe.skipIf(!settings.corpusRequested || !cached)(
  "xsd.corpus.oracle.test.ts, the corpus",
  () => {
    layer(TestLayer, { excludeTestServices: true })("xmllint against the law oracle", (it) => {
      it.effect(
        "every corpus document's two verdicts, per class, differ only as recorded",
        () =>
          Effect.gen(function* compareCorpus() {
            const fs = yield* FileSystem.FileSystem;
            const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
            const laws = lawsOf(grammar);

            yield* fs.remove(outputRoot, { force: true, recursive: true });

            const documents = yield* corpusDocuments();
            const oracle = yield* writeXsdOracle(oracleRoot);
            const judged: Judged[] = [];

            for (const version of schemaVersions) {
              const verdicts = yield* validated(oracle, version, documents);

              for (const [at, document] of documents.entries()) {
                const xsd =
                  verdicts[at] ??
                  (yield* Effect.die(new Error(`xmllint gave no verdict for ${document.file}`)));

                const law = yield* judgeDocument({
                  bytes: document.bytes,
                  grammar,
                  laws,
                  path: document.path,
                  version,
                });
                const comparison = compareJudgments(xsd, law);

                judged.push({
                  comparison,
                  document,
                  matches: comparison.differences.map((difference) =>
                    recordOf(document, version, difference, [...recorded, ...libxml2Records]),
                  ),
                  version,
                });
              }
            }

            yield* fs.writeFileString(
              `${outputRoot}/agreement.tsv`,
              tsv(
                [
                  "zip",
                  "document",
                  "declared",
                  "version",
                  "verdicts",
                  "xmllint",
                  "laws",
                  "masked",
                  "differences",
                ],
                judged.map(({ comparison, document, version }) => [
                  document.zip,
                  document.path,
                  document.declared,
                  version,
                  comparison.verdicts,
                  comparison.xsdClasses.join(" "),
                  comparison.lawClasses.join(" "),
                  comparison.masked.join(" "),
                  String(comparison.differences.length),
                ]),
              ),
            );
            yield* fs.writeFileString(
              `${outputRoot}/differences.tsv`,
              tsv(
                ["zip", "document", "version", "direction", "class", "rule", "record", "detail"],
                judged.flatMap(({ comparison, document, matches, version }) =>
                  comparison.differences.map((difference, at) => {
                    const match = matches[at];

                    return [
                      document.zip,
                      document.path,
                      version,
                      difference.direction,
                      difference.class,
                      difference.rule,
                      match === undefined ? "UNRECORDED" : reasonText(match.reason),
                      difference.detail.slice(0, 600),
                    ];
                  }),
                ),
              ),
            );

            const tally = (verdicts: Comparison["verdicts"]) =>
              judged.filter(({ comparison }) => comparison.verdicts === verdicts).length;
            const unrecorded = judged.flatMap(({ comparison, document, matches, version }) =>
              comparison.differences.flatMap((difference, at) =>
                matches[at] === undefined
                  ? [
                      `${document.zip}/${document.path} ${version} ${difference.direction} ${difference.class} ${difference.rule}: ${difference.detail.slice(0, 300)}`,
                    ]
                  : [],
              ),
            );
            const used = new Set(judged.flatMap(({ matches }) => matches));
            const stale = recorded.filter((record) => !used.has(record));

            yield* Console.log(
              [
                `xsd.corpus: ${String(documents.length)} documents x ${String(schemaVersions.length)} versions = ${String(judged.length)} judgments`,
                `  accepted by both ${String(tally("accepted by both"))}, refused by both ${String(tally("refused by both"))}, xmllint only ${String(tally("xmllint only"))}, laws only ${String(tally("laws only"))}`,
                `  differences ${String(judged.reduce((sum, { comparison }) => sum + comparison.differences.length, 0))}, unrecorded ${String(unrecorded.length)}, stale records ${String(stale.length)}, libxml2 ${String(libxml2Count(judged.flatMap(({ matches }) => matches)))} (${libxml2Records.map(({ reason }) => reasonText(reason)).join("; ")})`,
              ].join("\n"),
            );

            assert.deepStrictEqual(
              unrecorded,
              [],
              "every difference between the two oracles is recorded",
            );
            assert.deepStrictEqual(
              stale.map(
                ({ class: cls, direction, reason }) => `${direction} ${cls}: ${reasonText(reason)}`,
              ),
              [],
              "every record still matches a difference",
            );
          }),
        { timeout: testTimeoutMs },
      );
    });
  },
);

/**
 * The folder the differential property writes to, `packages/pantry/work/xsd-generated-*`, the
 * run's own.
 */
const generatedRoot = fileScratchDirectory("xsd-generated-");

/**
 * The number of generated documents one run judges: each run draws its own (its stream rotates
 * with the run's seed, so different runs explore different documents), and all of them are
 * validated in one `xmllint` process per version, since one compile of the ASI XSD costs 3 s of
 * CPU.
 */
const generatedCases = 240;

/**
 * The timeout, in milliseconds, for the differential property: building the grammar, drawing and
 * writing the documents, two `xmllint` runs and the law oracle on each document. To be set from a
 * measurement; 300 s until then. Raise it only on a new measurement recorded here, never to make
 * a run pass. Unmeasured, pending integration's three runs with the swarm idle.
 */
const generatedTimeoutMs = 300_000;

/**
 * The named invalid variants of a generated document (doctrine rule 6), each one edit of the XML
 * tree the generator's valid tree is written as, at one element the case draws:
 *
 * - `valid`: no edit;
 * - `drop-attribute`: remove one of the element's attributes;
 * - `undeclared-attribute`: add an attribute no schema declares, in no namespace;
 * - `wild-value`: give one of its attributes a value no type's lexical space is likely to hold;
 * - `drop-child`, `duplicate-child`: remove, or repeat in place, one of its element children;
 * - `swap-children`: swap two of its element children;
 * - `foreign-child`: add, as its first child, an element of a namespace no schema declares;
 * - `stray-text`: add character data as its first child.
 *
 * A variant the drawn element cannot take (no attribute to drop, fewer than two children to swap)
 * applies nothing, and the case records `none`, so the tape reads the edit actually made.
 */
const variants = [
  "valid",
  "drop-attribute",
  "undeclared-attribute",
  "wild-value",
  "drop-child",
  "duplicate-child",
  "swap-children",
  "foreign-child",
  "stray-text",
] as const;

/**
 * A variant of {@link variants}, or `none` for one the drawn element could not take.
 */
type Variant = (typeof variants)[number] | "none";

/**
 * The values `wild-value` writes.
 */
const wildValues = ["", " ", "#!", "-1", "zz zz", "9999999999999999999999"] as const;

/**
 * One generated case: the version, the XML tree, the edit made to it, and whether the tree holds
 * an unexpanded entity reference.
 */
interface GeneratedCase {
  readonly at: string;
  /**
   * The namespace of the element the variant is applied at.
   */
  readonly atNamespace: string;
  /**
   * Whether an entity reference stays unexpanded in the tree, in content or in an attribute's
   * value. Its entity is declared only in an external subset no processor here reads, so the
   * infoset XML Schema assesses is not the document's, and no XSD verdict exists to compare.
   */
  readonly entities: boolean;
  readonly tree: XmlDocument;
  readonly variant: Variant;
  readonly version: SchemaVersion;
}

/**
 * The elements of a tree in document order, each with its path of child indexes from the root.
 *
 * @param root - The root.
 * @returns Every element and its path.
 */
const elementsIn = (root: Element): readonly (readonly [Element, readonly number[]])[] => {
  const out: (readonly [Element, readonly number[]])[] = [];
  const visit = (node: Element, route: readonly number[]): void => {
    out.push([node, route]);
    for (const [at, child] of node.children.entries()) {
      if (child.kind === "element") {
        visit(child, [...route, at]);
      }
    }
  };
  visit(root, []);

  return out;
};

/**
 * Decide whether a difference is reading 61's ({@link orderingSlot}): at least one message is the
 * `##other` wildcard's on a child of a `qti-ordering` of the document, where the law oracle admits
 * it, and every other is reading 6's ({@link isNestedMessage}), since `xmllint` reports both
 * classes' messages as one content difference. The same message under another `##other` slot,
 * such as `qti-selection`'s, which reading 61 leaves to the XSD, is not this class.
 *
 * @param difference - The difference.
 * @param root - The document's root.
 * @param nested - The expanded names of the document's elements within a nested root.
 * @returns Whether it is.
 */
const isOrderingSlot = (
  difference: Difference,
  root: Element,
  nested: ReadonlySet<string>,
): boolean => {
  if (difference.direction !== orderingSlot.direction || difference.class !== orderingSlot.class) {
    return false;
  }

  const slotted = new Set(
    elementsIn(root)
      .filter(([node]) => node.namespace === asiNamespace && node.local === "qti-ordering")
      .flatMap(([node]) => node.children)
      .flatMap((child) =>
        child.kind === "element"
          ? [child.namespace === "" ? child.local : `{${child.namespace}}${child.local}`]
          : [],
      ),
  );

  const slotMessage = (message: string): boolean => {
    const named = otherWildcardMessage.exec(message)?.groups?.["element"];

    return named !== undefined && slotted.has(named);
  };
  const messages = difference.detail.split(" | ");

  return (
    messages.some(slotMessage) &&
    messages.every((message) => slotMessage(message) || isNestedMessage(message, nested))
  );
};

/**
 * Whether an element or anything below it holds an unexpanded entity reference.
 *
 * @param node - The element.
 * @returns Whether a child or an attribute value of it, or of a descendant, holds one.
 */
const holdsReferences = (node: Element): boolean =>
  node.attributes.some(({ references }) => references.length > 0) ||
  node.children.some(
    (child) => child.kind === "entityRef" || (child.kind === "element" && holdsReferences(child)),
  );

/**
 * Replace the element at a path.
 *
 * @param root - The root.
 * @param route - The child indexes from the root.
 * @param edit - The new element, from the old.
 * @returns The new root.
 */
const editAt = (
  root: Element,
  route: readonly number[],
  edit: (node: Element) => Element,
): Element => {
  const [head, ...rest] = route;
  if (head === undefined) {
    return edit(root);
  }

  return {
    ...root,
    children: root.children.map((child, at): Child =>
      at === head && child.kind === "element" ? editAt(child, rest, edit) : child,
    ),
  };
};

/**
 * Whether an element can take a variant: it has an attribute to drop or change, an element child
 * to drop or repeat, or two to swap. Every element takes the others.
 *
 * @param node - The element.
 * @param variant - The variant.
 * @returns Whether {@link applied} would apply it.
 */
const takes = (node: Element, variant: (typeof variants)[number]): boolean => {
  const attributes = node.attributes.filter(
    ({ namespace }) => namespace !== "http://www.w3.org/2000/xmlns/",
  ).length;
  const elements = node.children.filter((child) => child.kind === "element").length;

  switch (variant) {
    case "drop-attribute":
    case "wild-value": {
      return attributes > 0;
    }
    case "drop-child":
    case "duplicate-child": {
      return elements > 0;
    }
    case "swap-children": {
      return elements > 1;
    }
    case "foreign-child":
    case "stray-text":
    case "undeclared-attribute":
    case "valid": {
      return true;
    }
    default: {
      return variant satisfies never;
    }
  }
};

/**
 * Apply a variant to an element, drawing what it needs.
 *
 * @param node - The element.
 * @param variant - The variant.
 * @param pick - Draws an index below a bound.
 * @returns The edited element and the variant applied, `none` when it could not be.
 */
const applied = (
  node: Element,
  variant: (typeof variants)[number],
  pick: (bound: number) => number,
): readonly [Element, Variant] => {
  const attributes = node.attributes.filter(
    ({ namespace }) => namespace !== "http://www.w3.org/2000/xmlns/",
  );
  const elements = node.children.flatMap((child, at) => (child.kind === "element" ? [at] : []));
  switch (variant) {
    case "valid": {
      return [node, "valid"];
    }
    case "drop-attribute":
    case "wild-value": {
      const target = attributes[attributes.length === 0 ? 0 : pick(attributes.length)];
      if (target === undefined) {
        return [node, "none"];
      }

      const value = wildValues[pick(wildValues.length)] ?? "";

      return [
        {
          ...node,
          attributes:
            variant === "drop-attribute"
              ? node.attributes.filter((held) => held !== target)
              : node.attributes.map((held) =>
                  held === target ? { ...held, references: [], value } : held,
                ),
        },
        variant,
      ];
    }
    case "undeclared-attribute": {
      return node.attributes.some(({ qname }) => qname === "zz-undeclared")
        ? [node, "none"]
        : [
            {
              ...node,
              attributes: [
                ...node.attributes,
                {
                  local: "zz-undeclared",
                  namespace: "",
                  prefix: "",
                  qname: "zz-undeclared",
                  references: [],
                  value: "1",
                },
              ],
            },
            variant,
          ];
    }
    case "drop-child":
    case "duplicate-child": {
      const target = elements[elements.length === 0 ? 0 : pick(elements.length)];
      if (target === undefined) {
        return [node, "none"];
      }

      return [
        {
          ...node,
          children: node.children.flatMap((child, at) => {
            if (at !== target) {
              return [child];
            }

            return variant === "drop-child" ? [] : [child, child];
          }),
        },
        variant,
      ];
    }
    case "swap-children": {
      if (elements.length < 2) {
        return [node, "none"];
      }

      const first = pick(elements.length - 1);
      const left = elements[first] ?? 0;
      const right = elements[first + 1] ?? 0;

      return [
        {
          ...node,
          children: node.children.map((child, at) => {
            if (at === left) {
              return node.children[right] ?? child;
            }

            return at === right ? (node.children[left] ?? child) : child;
          }),
        },
        variant,
      ];
    }
    case "foreign-child": {
      const foreign: Element = {
        attributes: [
          {
            local: "zz",
            namespace: "http://www.w3.org/2000/xmlns/",
            prefix: "xmlns",
            qname: "xmlns:zz",
            references: [],
            value: "urn:qti-pie:nowhere",
          },
        ],
        children: [],
        kind: "element",
        local: "stray",
        namespace: "urn:qti-pie:nowhere",
        prefix: "zz",
        qname: "zz:stray",
      };

      return [{ ...node, children: [foreign, ...node.children] }, variant];
    }
    case "stray-text": {
      return [
        { ...node, children: [{ cdata: false, kind: "text", value: "stray" }, ...node.children] },
        variant,
      ];
    }
    default: {
      return variant satisfies never;
    }
  }
};

/**
 * Draw a generated case: a valid tree over the grammar (Q2's generator), written as XML, and one
 * named variant applied at one element of it.
 *
 * @param grammar - The composed grammar.
 * @returns The generator.
 */
const generatedCaseOf = (grammar: ComposedGrammar): Gen<GeneratedCase> => {
  const valid = xdmDocument(grammar);
  const names = namesOf(grammar);

  return (source) => {
    const generated = source.draw(valid);
    const tree = toXmlDocument(generated.document, names);
    const drawnVariant = source.draw(element(variants));
    const all = elementsIn(tree.root);
    const eligible = all.filter(([node]) => takes(node, drawnVariant));
    const elements = eligible.length === 0 ? all : eligible;
    const [target, route] = elements[source.draw(int(0, elements.length - 1))] ?? [tree.root, []];
    const [edited, variant] = applied(target, drawnVariant, (bound) =>
      source.draw(int(0, bound - 1)),
    );

    return {
      at: `/${route.join("/")} ${target.qname}`,
      atNamespace: target.namespace,
      entities: holdsReferences(tree.root),
      tree: { ...tree, root: editAt(tree.root, route, () => edited) },
      variant,
      version: generated.document.version,
    };
  };
};

describe.skipIf(!cached)("xsd.corpus.oracle.test.ts, generated documents", () => {
  layer(TestLayer, { excludeTestServices: true })("xmllint against the law oracle", (it) => {
    it.effect(
      "every generated document, valid or a named invalid variant, has the same verdict from both",
      () =>
        Effect.gen(function* compareGenerated() {
          const fs = yield* FileSystem.FileSystem;
          const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
          const laws = lawsOf(grammar);
          const run = yield* runOfProcess;
          const stream = rotatingSeed(run.seed, floorSeed("pantry/xsd-differential"));
          const cases = sample(generatedCaseOf(grammar), stream, generatedCases);

          yield* fs.remove(generatedRoot, { force: true, recursive: true });
          yield* fs.makeDirectory(generatedRoot, { recursive: true });

          const judgeable = cases.filter(({ entities }) => !entities);
          const written = yield* Effect.all(
            judgeable.map((drawnCase, at) =>
              Effect.gen(function* writeCase() {
                const file = `${generatedRoot}/case-${String(at)}.xml`;
                const bytes = yield* encode(drawnCase.tree, "utf-8").pipe(Effect.orDie);
                yield* fs.writeFile(file, bytes);

                return { ...drawnCase, bytes, file, index: at };
              }),
            ),
          );
          const oracle = yield* writeXsdOracle(oracleRoot);
          const lines: string[] = [];
          const unrecorded: string[] = [];
          const matched: (Recorded | undefined)[] = [];

          for (const version of schemaVersions) {
            const mine = written.filter((held) => held.version === version);
            const verdicts = mine.length === 0 ? [] : yield* validated(oracle, version, mine);

            for (const [at, held] of mine.entries()) {
              const xsd =
                verdicts[at] ?? (yield* Effect.die(new Error(`no verdict for ${held.file}`)));
              const law = yield* judgeDocument({
                bytes: held.bytes,
                grammar,
                laws,
                path: held.file,
                version,
              });
              const comparison = compareJudgments(xsd, law);
              const document: CorpusDocument = {
                bytes: held.bytes,
                declared: version,
                file: held.file,
                path: `case-${String(held.index)}.xml`,
                zip: "generated",
              };
              const names = yield* foreignNamesOf(held.bytes, version, grammar);
              const set = yield* schemaSetOf(version, held.tree.root.namespace).pipe(Effect.orDie);
              const fragment = fragmentOnlyRoots.has(
                `${held.tree.root.namespace}}${held.tree.root.local}`,
              );
              const records = comparison.differences.map((difference) => {
                if (fragment) {
                  return fragmentRoot;
                }

                if (isNestedRoot(difference, names.nested)) {
                  return nestedRoot;
                }

                if (isNestedRootLaw(difference, names.nestedPaths)) {
                  return nestedRootLaw;
                }

                if (isOrderingSlot(difference, held.tree.root, names.nested)) {
                  return orderingSlot;
                }

                if (
                  isOutsideSet(difference, names, grammar) ||
                  isOutsideVariant(difference, held, set)
                ) {
                  return outsideSet;
                }

                return isLaxXsiType(difference, new Set([...names.lax, ...names.outside]))
                  ? laxXsiType
                  : recordOf(document, version, difference, [
                      ...recorded,
                      ...libxml2Records,
                      ...generatedRecorded,
                    ]);
              });
              const open = comparison.differences.filter((_, slot) => records[slot] === undefined);

              matched.push(...records);

              lines.push(
                [
                  String(held.index),
                  version,
                  held.variant,
                  held.at,
                  comparison.verdicts,
                  comparison.xsdClasses.join(" "),
                  comparison.lawClasses.join(" "),
                  comparison.differences
                    .map(({ class: cls, direction }) => `${direction}:${cls}`)
                    .join(" "),
                ].join("\t"),
              );
              unrecorded.push(
                ...open.map(
                  (difference) =>
                    `case ${String(held.index)} (${version}, ${held.variant} at ${held.at}): ${difference.direction} ${difference.class} ${difference.rule}: ${difference.detail.slice(0, 240)}`,
                ),
              );
            }
          }

          yield* fs.writeFileString(
            `${generatedRoot}/cases.tsv`,
            ["case\tversion\tvariant\tat\tverdicts\txmllint\tlaws\tdifferences", ...lines]
              .map((line) => `${line}\n`)
              .join(""),
          );
          yield* Console.log(
            `xsd.generated: TEST_SEED=${String(run.seed)}, ${String(cases.length)} cases drawn (stream pantry/xsd-differential), ${String(cases.length - judgeable.length)} left out for unexpanded entity references, ${String(judgeable.length)} judged; ${String(unrecorded.length)} unrecorded differences; libxml2 ${String(libxml2Count(matched))}; lax xsi:type (reading 60) ${String(matched.filter((match) => match === laxXsiType).length)}; nested roots (reading 6) ${String(matched.filter((match) => match === nestedRoot || match === nestedRootLaw).length)}; fragment roots (reading 114) ${String(matched.filter((match) => match === fragmentRoot).length)}; outside the schema set (reading 81) ${String(matched.filter((match) => match === outsideSet).length)}; qti-ordering's slot (reading 61) ${String(matched.filter((match) => match === orderingSlot).length)}; the documents are under ${generatedRoot} while the file runs`,
          );

          assert.deepStrictEqual(
            unrecorded.slice(0, 100),
            [],
            "both oracles judge every generated document alike",
          );
        }),
      { timeout: generatedTimeoutMs },
    );
  });
});

/**
 * The timeout, in milliseconds, for the libxml2 control: one `xmllint` run over four small
 * documents, which compiles the 3.0.0 XSDs once. Measured on 2026-11-05 under the shared tree's
 * load: over 5 s, so the budget is 60 s. Raise it only on a new measurement recorded here.
 */
const controlTimeoutMs = 60_000;

/**
 * The folder the libxml2 control writes to, `packages/pantry/work/xsd-control-*`, the run's own.
 */
const controlRoot = fileScratchDirectory("xsd-control-");

/**
 * An item with the given companion materials and item-body content, every attribute it needs.
 *
 * @param companion - The `qti-companion-materials-info` children, none for no element.
 * @param body - The item body's content.
 * @returns The item's text.
 */
const controlItem = (companion: string, body: string): string =>
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false" adaptive="false">${
    companion === ""
      ? ""
      : `<qti-companion-materials-info>${companion}</qti-companion-materials-info>`
  }<qti-item-body>${body}</qti-item-body></qti-assessment-item>`;

/**
 * `figcaption` beneath SSML's `mark`, whose content is a `##other` lax wildcard: a globally
 * declared element there is validated (Part 1, 3.10.4), so its attributes are typed.
 *
 * @param attributes - The `figcaption` elements, each as its attributes.
 * @returns The companion materials' content.
 */
const underMark = (...attributes: readonly string[]): string =>
  `<ssml:mark xmlns:ssml="http://www.w3.org/2001/10/synthesis" name="m">${attributes
    .map((held) => `<figcaption ${held}>x</figcaption>`)
    .join("")}</ssml:mark>`;

/**
 * An item whose companion materials hold an SSML `mark`, whose content is a `##other` lax
 * wildcard, holding the given content, with the `xsi` prefix bound. The item's schema set holds
 * the ASI XSD, MathML and SSML (spec reading 81), so a global element of either beneath the mark is
 * assessed against its declaration, and an element no XSD of the set declares against nothing.
 *
 * @param content - The mark's content, as written, in the ASI namespace unless it says otherwise.
 * @returns The item's text.
 */
const markedItem = (content: string): string =>
  controlItem(
    `<ssml:mark xmlns:ssml="http://www.w3.org/2001/10/synthesis" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="m">${content}</ssml:mark>`,
    "<p>x</p>",
  );

/**
 * A test whose one part carries the given attribute, every attribute it needs besides.
 *
 * @param attribute - The attribute, as written.
 * @returns The test's text.
 */
const locatedTest = (attribute: string): string =>
  `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" identifier="T" title="t"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual" ${attribute}><qti-assessment-section identifier="S" title="s" visible="true"><qti-assessment-item-ref identifier="I" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * A test whose one section's selection carries the given attribute, every attribute it needs
 * besides. The Schematron's extension rules cover `qti-test-part` and not `qti-selection`, so an
 * `xml:` name `qti-selection`'s `##other` wildcard admits is still read by its declaration there,
 * where spec reading 90 refuses one on the test part outright.
 *
 * @param attribute - The attribute, as written.
 * @returns The test's text.
 */
const selectedTest = (attribute: string): string =>
  `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="t"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="s" visible="true"><qti-selection select="1" ${attribute}/><qti-assessment-item-ref identifier="I" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * Response processing that holds one `qti-exit-response`, with the `xsi` prefix and `t` for the QTI
 * namespace in scope.
 *
 * @param exit - The `qti-exit-response`, as written.
 * @returns The processing's text.
 */
const exitProcessing = (exit: string): string =>
  `<qti-response-processing xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:t="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">${exit}</qti-response-processing>`;

/**
 * Write control documents under the control folder, validate them with `xmllint` against the 3.0.0
 * XSDs, and judge them with the law oracle.
 *
 * @param folder - The control folder's subfolder to write them to.
 * @param documents - Each document's text by name.
 * @returns Each document's comparison and the records its differences match, in order.
 */
const controlled = Effect.fn("test.controlled")(function* controlled(
  folder: string,
  documents: Readonly<Record<string, string>>,
) {
  const fs = yield* FileSystem.FileSystem;
  const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
  const laws = lawsOf(grammar);
  const directory = `${controlRoot}/${folder}`;

  yield* fs.remove(directory, { force: true, recursive: true });
  yield* fs.makeDirectory(directory, { recursive: true });

  const written = Object.entries(documents).map(([name, text]) => ({
    bytes: new TextEncoder().encode(text),
    file: `${directory}/${name}.xml`,
    name,
  }));
  for (const { bytes, file } of written) {
    yield* fs.writeFile(file, bytes);
  }

  const oracle = yield* writeXsdOracle(oracleRoot);
  const verdicts = yield* validated(oracle, "3.0.0", written);

  return yield* Effect.forEach(
    written,
    ({ bytes, file, name }, at) =>
      Effect.gen(function* compared() {
        const xsd = verdicts[at] ?? (yield* Effect.die(new Error(`no verdict for ${file}`)));
        const law = yield* judgeDocument({ bytes, grammar, laws, path: file, version: "3.0.0" });
        const comparison = compareJudgments(xsd, law);
        const names = yield* foreignNamesOf(bytes, "3.0.0", grammar);
        const document: CorpusDocument = {
          bytes,
          declared: "3.0.0",
          file,
          path: `${name}.xml`,
          zip: "control",
        };

        return {
          comparison,
          records: comparison.differences.map((difference) => {
            if (isNestedRoot(difference, names.nested)) {
              return nestedRoot;
            }

            if (isNestedRootLaw(difference, names.nestedPaths)) {
              return nestedRootLaw;
            }

            return isLaxXsiType(difference, new Set([...names.lax, ...names.outside]))
              ? laxXsiType
              : recordOf(document, "3.0.0", difference, libxml2Records);
          }),
        };
      }),
    { concurrency: 1 },
  );
});

describe.skipIf(!cached)(
  "xsd.corpus.oracle.test.ts, the libxml2 classes and reading 6 on their controls, and xmllint on a retyped element",
  () => {
    layer(TestLayer, { excludeTestServices: true })("the control", (it) => {
      it.effect(
        "libxml2 refuses a repeated ID in item-body content and under ssml:mark/figcaption, and accepts a dangling IDREF in both",
        () =>
          Effect.gen(function* control() {
            const fs = yield* FileSystem.FileSystem;
            const documents = {
              "body-dangling-idref": controlItem("", `<p aria-errormessage="nowhere">x</p>`),
              "body-repeated-id": controlItem("", `<p id="d1">x</p><p id="d1">y</p>`),
              "mark-dangling-idref": controlItem(
                underMark(`aria-errormessage="nowhere"`),
                "<p>x</p>",
              ),
              "mark-repeated-id": controlItem(underMark(`id="d1"`, `id="d1"`), "<p>x</p>"),
            };

            yield* fs.remove(controlRoot, { force: true, recursive: true });
            yield* fs.makeDirectory(controlRoot, { recursive: true });

            const files = Object.keys(documents).map((name) => `${controlRoot}/${name}.xml`);
            for (const [name, text] of Object.entries(documents)) {
              yield* fs.writeFileString(`${controlRoot}/${name}.xml`, text);
            }

            const oracle = yield* writeXsdOracle(oracleRoot);
            const verdicts = yield* xmllintValidate({
              catalog: oracle.catalog,
              paths: files,
              schema: oracle.drivers["3.0.0"],
            });

            assert.deepStrictEqual(
              verdicts.map(({ _tag }) => _tag),
              ["Valid", "Invalid", "Valid", "Invalid"],
              "a dangling IDREF validates and a repeated ID does not, in item-body content and under the lax wildcard alike",
            );
          }),
        { timeout: controlTimeoutMs },
      );

      it.effect(
        "each document root's schema set, read from the XSDs' own imports, is reading 81's",
        () =>
          Effect.gen(function* schemaSets() {
            const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";
            const cp = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";
            const lom = "http://ltsc.ieee.org/xsd/LOM";
            const usage = "http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0";
            const xml = "http://www.w3.org/XML/1998/namespace";
            const sets = yield* Effect.forEach(
              schemaVersions.flatMap((version) =>
                [asi, cp, lom, usage].map((root) => [version, root] as const),
              ),
              ([version, root]) =>
                Effect.map(schemaSetOf(version, root), (set) => [...set].toSorted()),
              { concurrency: 1 },
            );
            const expected = [
              [
                asi,
                "http://www.w3.org/1998/Math/MathML",
                "http://www.w3.org/2001/10/synthesis",
                "http://www.w3.org/2001/XInclude",
                xml,
              ],
              [
                lom,
                "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0",
                "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0",
                "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2",
                cp,
                "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1",
                "http://www.w3.org/1999/xlink",
                xml,
              ],
              [lom],
              [usage],
            ].map((set) => set.toSorted());

            assert.deepStrictEqual(
              sets,
              [...expected, ...expected],
              "an item's set is the ASI XSD with xml, XInclude, MathML and SSML; a manifest's the CP XSD with xml, LOM, the curriculum standards and QTI metadata, and the CP extension with XLink and the DRD; a LOM file's and a usage data file's their XSD alone",
            );
          }),
        { timeout: controlTimeoutMs },
      );

      it.effect(
        "each libxml2 record matches its control's difference, and the nearest value both oracles refuse makes none",
        () =>
          Effect.gen(function* libxml2Controls() {
            const bytes = (value: string) =>
              controlItem(
                "",
                `<p><math xmlns="http://www.w3.org/1998/Math/MathML"><cbytes>${value}</cbytes></math></p>`,
              );
            const held = yield* controlled("libxml2", {
              "base64-short": bytes("zz"),
              "base64-stray": bytes("QUFh&lt;"),
              "idrefs-empty": controlItem("", `<p id="a" aria-labelledby="">x</p>`),
              "idrefs-whole": controlItem("", `<p id="a" aria-labelledby="a">x</p>`),
              "list-blank": markedItem(
                `<widget xmlns="urn:w" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:NMTOKENS"> </widget>`,
              ),
              "list-whole": markedItem(
                `<widget xmlns="urn:w" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:NMTOKENS">a b</widget>`,
              ),
              "location-base": selectedTest(`xml:base="a]b"`),
              "location-no-namespace": locatedTest(`xsi:noNamespaceSchemaLocation="a]b"`),
              "location-pairs": locatedTest(`xsi:schemaLocation="urn:a a]b"`),
              "nil-lax": markedItem(`<widget xmlns="urn:w" xsi:nil="v">x</widget>`),
              "nil-lax-true": markedItem(`<widget xmlns="urn:w" xsi:nil="true">x</widget>`),
              "type-unknown": markedItem(
                `<widget xmlns="urn:w" xmlns:x="urn:x" xsi:type="x:v">x</widget>`,
              ),
            });

            assert.deepStrictEqual(
              held.map(({ comparison }) => comparison.verdicts),
              [
                "refused by both",
                "laws only",
                "laws only",
                "accepted by both",
                "laws only",
                "accepted by both",
                "refused by both",
                "laws only",
                "laws only",
                "laws only",
                "accepted by both",
                "xmllint only",
              ],
              "xmllint refuses a base64 value of two letters and xml:base's value, as the law oracle does, and accepts a stray character in base64, an empty IDREFS, a blank NMTOKENS element, the two xsi: locations' values and a lax xsi:nil's, which the law oracle refuses; it refuses an xsi:type naming no type on a lax element, which the law oracle accepts (reading 60)",
            );
            assert.deepStrictEqual(
              held.map(({ records }) => records),
              [
                [],
                [base64Record],
                [emptyIdrefsRecord],
                [],
                [blankListRecord],
                [],
                [],
                [locationRecord],
                [locationRecord],
                [laxNilRecord],
                [],
                [laxXsiType, absentTypeRecord],
              ],
              "each libxml2 record matches exactly its control's differences, and reading 60's the unresolved xsi:type's",
            );
          }),
        { timeout: controlTimeoutMs },
      );

      it.effect(
        "a QTI root nested in an item's lax wildcard content: xmllint assesses it, and the law oracle keeps it foreign (reading 6)",
        () =>
          Effect.gen(function* nested() {
            const held = yield* controlled("nested", {
              "nested-bare": markedItem("<qti-assessment-item>x</qti-assessment-item>"),
              "nested-whole": markedItem(
                `<qti-assessment-item identifier="i" title="t" time-dependent="false"/>`,
              ),
            });

            assert.deepStrictEqual(
              held.map(({ comparison }) => [comparison.verdicts, comparison.xsdClasses]),
              [
                ["xmllint only", ["attribute-required", "content"]],
                ["accepted by both", []],
              ],
              "xmllint refuses the bare nested item's missing attributes and its text, and accepts the whole one",
            );
            assert.deepStrictEqual(
              held.map(({ records }) => records),
              [[nestedRoot, nestedRoot], []],
              "reading 6's class matches every difference the nested item makes",
            );
          }),
        { timeout: controlTimeoutMs },
      );

      // Two defects the law oracle shares with the grammar and the codec, left unrecorded, so a
      // generated document that shows one fails the generated test until its owner's fix lands;
      // this control states xmllint's verdict alone. An element an xsi:type retypes is assessed
      // against the type it names (XML Schema 1.0 Part 1, 3.3.4, cvc-elt clause 4, as reading 47
      // has it), so its attributes are that type's, but the grammar's attribute admission is by
      // kind, so a qti-exit-response typed TrackDType is accepted without TrackDType's required
      // src. An xsi:type whose prefix no declaration binds is no QName (Part 2, 3.2.18), which its
      // built-in declaration (Part 1, 3.2.7) refuses wherever the element sits, but the codec
      // refuses it only on an element a declaration assesses (shred's type-unresolved).
      it.effect(
        "xmllint refuses a qti-exit-response an xsi:type retypes to TrackDType without src and a foreign element's xsi:type of an unbound prefix, and accepts a plain qti-exit-response",
        () =>
          Effect.gen(function* retyped() {
            const held = yield* controlled("retyped", {
              "retyped-plain": exitProcessing("<qti-exit-response/>"),
              "retyped-track": exitProcessing(`<qti-exit-response xsi:type="t:TrackDType"/>`),
              "unbound-prefix": markedItem(`<widget xmlns="urn:w" xsi:type="zz:t">x</widget>`),
            });

            assert.deepStrictEqual(
              held.map(({ comparison }) => comparison.xsdClasses),
              [[], ["attribute-required"], ["attribute-value", "other"]],
              "xmllint assesses the retyped element against TrackDType, whose src is required, and refuses the unbound prefix on the xsi:type and, a second time, on its element",
            );
          }),
        { timeout: controlTimeoutMs },
      );

      // The defects three earlier records named, now fixed and so no records: an element in no
      // namespace under an ##other wildcard, which ##other never admits (XML Schema 1.0 Part 1,
      // 3.10.1); a foreign element in xi:include, whose includeType is (fallback | any ##other
      // lax)*; and a simple-content element with no text, whose empty string its type must admit.
      // Both oracles judge each alike, so a regression shows here as well as in a generated run.
      it.effect(
        "both oracles judge alike the three defects the earlier records named",
        () =>
          Effect.gen(function* fixed() {
            const held = yield* controlled("fixed", {
              "empty-schemaversion": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion></schemaversion></metadata><organizations/><resources/></manifest>`,
              "foreign-in-include": `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="T" title="t"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="s" visible="true"><xi:include href="s.xml"><widget xmlns="urn:w"/></xi:include></qti-assessment-section></qti-test-part></qti-assessment-test>`,
              "no-namespace-under-other": `<lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general/><widget xmlns="">x</widget></lom>`,
            });

            assert.deepStrictEqual(
              held.map(({ comparison }) => [comparison.verdicts, comparison.differences]),
              [
                ["refused by both", []],
                ["accepted by both", []],
                ["refused by both", []],
              ],
              "an empty schemaversion and a no-namespace element under ##other are refused by both, and a foreign element in xi:include is accepted by both",
            );
          }),
        { timeout: controlTimeoutMs },
      );
    });
  },
);

/**
 * `xmllint`'s message that an element's `xsi:type` resolves to no type definition.
 *
 * @param name - The element's expanded name.
 * @returns The message as the comparison writes it.
 */
const unresolvedMessage = (name: string): string =>
  `line 4 ${name}: The QName value '{urn:x}v' of the xsi:type attribute does not resolve to a type definition.`;

/**
 * An `xsd-only` attribute-value difference.
 *
 * @param detail - What `xmllint` said.
 * @returns The difference.
 */
const xsdOnly = (detail: string): Difference => ({
  class: "attribute-value",
  detail,
  direction: "xsd-only",
  rule: "",
});

describe("xsd.corpus.oracle.test.ts, reading 6's class", () => {
  unit(
    "matches an xsd-only difference whose every message is on an element within a nested root",
    () => {
      const nested = new Set(["{urn:q}item", "{urn:q}config"]);
      const within = `line 4 {urn:q}item: The attribute 'identifier' is required but missing. | line 5 {urn:q}config: This element is not expected.`;

      assert.isTrue(isNestedRoot(xsdOnly(within), nested), "the root and an element within it");
      assert.isFalse(
        isNestedRoot(
          xsdOnly(`${within} | line 2 {urn:q}section: Missing child element(s).`),
          nested,
        ),
        "a difference that also holds a message on an element outside",
      );
      assert.isFalse(
        isNestedRoot(xsdOnly("line 4: Character content is not allowed."), nested),
        "a message on no element",
      );
      assert.isFalse(
        isNestedRoot({ ...xsdOnly(within), direction: "oracle-only" }, nested),
        "a difference the law oracle refuses",
      );
    },
  );
});

describe("xsd.corpus.oracle.test.ts, reading 60's class of a lax xsi:type", () => {
  unit(
    "matches an unresolvable xsi:type on a laxly assessed element, and never a strictly assessed one",
    () => {
      const lax = new Set(["{urn:x}widget"]);

      assert.isTrue(
        isLaxXsiType(xsdOnly(unresolvedMessage("{urn:x}widget")), lax),
        "a foreign element",
      );
      assert.isFalse(
        isLaxXsiType(
          xsdOnly(
            unresolvedMessage("{http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1}schemaversion"),
          ),
          lax,
        ),
        "a declared element, which cvc-elt clause 4.2 refuses",
      );
      assert.isFalse(
        isLaxXsiType(
          xsdOnly(`${unresolvedMessage("{urn:x}widget")} | line 5 {urn:x}widget: another message.`),
          lax,
        ),
        "a difference that also holds another message",
      );
    },
  );
});
