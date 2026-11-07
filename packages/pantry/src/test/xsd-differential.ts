/**
 * The XSD differential's judge and its records: libxml2's XML Schema validator (`xmllint`) and the
 * law oracle judging one document in one version each, compared class by class
 * (`compareJudgments`), and every class of difference that is no defect of either side, each with
 * its reason. A difference no record matches is a bug in one of the two oracles.
 *
 * Two searches judge by it: the corpus comparison (`#pantry/test/xsd.corpus.oracle.test.ts`), whose
 * records ({@link recorded}) must each still match a difference, and the genetic search over
 * documents built from the grammar (`#pantry/test/genetic-xsd.oracle.test.ts`), whose bred
 * documents may show the differences no corpus document does ({@link generatedRecorded}), and
 * whose chain of reading classes is {@link generatedRecordOf}. Every reading a record cites is a
 * live reading of `docs/spec-readings.md` that states the difference; a record whose reading was
 * withdrawn is deleted, so the difference it hid fails until its owner's fix lands.
 *
 * Oracle: a second implementation. `xmllint` shares no code with the grammar, and the law oracle
 * (`#pantry/test/oracle.ts`) judges the same bytes by the grammar's laws.
 */
import { Effect, Option, Result } from "effect";
import type { FileSystem } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { fragmentRoots } from "#pantry/grammar/facets.ts";
import { isForeignKind } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { documentBreaches, explain, ruleOf } from "#pantry/test/oracle.ts";
import type { Laws } from "#pantry/test/oracle.ts";
import { classOfLaw, classOfMessage, driverFor, schemaSetOf } from "#pantry/test/xsd-catalog.ts";
import type {
  Comparison,
  Difference,
  LawClass,
  LawJudgment,
  RefusalClass,
  XsdOracle,
} from "#pantry/test/xsd-catalog.ts";
import { coveredElements } from "#pantry/vocab/inventory/extensions.ts";
import { asiNamespace, xlinkNamespace, xmlNamespace } from "#pantry/vocab/namespaces.ts";
import { foreignRoots } from "#pantry/vocab/open.ts";
import { xmllintValidate } from "#pantry/xml/oracle.ts";
import type { XsdVerdict } from "#pantry/xml/oracle.ts";

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
export type Reason =
  | { readonly _tag: "libxml2"; readonly why: string }
  | {
      readonly _tag: "reading";
      readonly reading: number;
      /**
       * A sentence the reading states, word for word, which a test holds to the reading as
       * `docs/spec-readings.md` states it today (`#pantry/test/live-readings.ts`), so a reading
       * rewritten or withdrawn under the record turns it stale.
       */
      readonly says: string;
      readonly why: string;
    }
  | { readonly _tag: "specification"; readonly source: string; readonly why: string };

/**
 * One recorded difference: what it matches (its direction, and optionally its class, the oracle's
 * rule, a pattern over its detail and the documents and versions it holds in) and why.
 */
export interface Recorded {
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
 * validates; it does refuse a repeated `xs:ID`. A dangling `m:share` `src` is no `xs:IDREF` (the
 * XSD types it `xs:anyURI`), so it is left to its own reading-2 record, not to libxml2.
 */
const idrefRecord: Recorded = {
  class: "identity",
  detail: /^Idref target (?!at \S+\/m:share\[\d+\]: src names )/u,
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
export const locationRecord: Recorded = {
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
export const laxNilRecord: Recorded = {
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
export const emptyIdrefsRecord: Recorded = {
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
export const blankListRecord: Recorded = {
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
export const base64Record: Recorded = {
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
export const absentTypeRecord: Recorded = {
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
 * One of `xmllint`'s messages that a padded `xsi:type` names nothing: a leading space makes its
 * prefix one no declaration binds (`' t:T'`), and a trailing one leaves its local name one no type
 * has (`'{urn:t}T '`, the prefix resolved).
 */
const paddedTypeMessage =
  "line \\d+ \\S+: The QName value '(?:[\\t\\n\\r ]+[^'\\t\\n\\r ]+[\\t\\n\\r ]*|[^'\\t\\n\\r ]+[\\t\\n\\r ]+)' has no corresponding namespace declaration in scope\\.|line \\d+ \\S+: The QName value '(?:\\{[^}]*\\})?[^'\\t\\n\\r ]*[\\t\\n\\r ]+[^'\\t\\n\\r ]*' of the xsi:type attribute does not resolve to a type definition\\.";

/**
 * A padded `xsi:type`: libxml2 2.9.13 resolves an `xsi:type`'s QName before it collapses the
 * value's whitespace, so `xsi:type=" t:T"` names no declaration of the prefix " t", and
 * `xsi:type="t:T "` resolves its prefix and names no type `T `. XML Schema types the attribute
 * `xs:QName` (Part 1, 3.2.7), whose whitespace facet is fixed at collapse (Part 2, 3.2.18), so the
 * value is the QName `t:T`, which the law oracle reads. Shown by its control: `xs:ENTITY` and
 * `xs:NCName` named plain and with a trailing space, on an element a lax wildcard holds.
 */
export const paddedTypeRecord: Recorded = {
  class: "attribute-value",
  detail: new RegExp(`^(?:${paddedTypeMessage})(?: \\| (?:${paddedTypeMessage}))*$`, "u"),
  direction: "xsd-only",
  reason: {
    _tag: "libxml2",
    why: "libxml2 resolves an xsi:type's QName before it collapses the QName's whitespace",
  },
};

/**
 * A widened `##other` attribute wildcard: libxml2 2.9.13 builds an attribute group's wildcard once
 * and, where a type that references the group extends a base whose wildcard is `##any`, widens it
 * in place to the union, so every other type that references the group admits an attribute in no
 * namespace too. QTI 3.0.1's `extensionNamespaceLax.Attr` (`##other`, lax) is such a group, so
 * `qti-custom-operator`, whose `CustomOperatorDType` holds that group alone, admits `zz="1"` under
 * the 3.0.1 XSD and refuses it under 3.0.0's. XML Schema assesses each type's own complete
 * wildcard (Part 1, 3.4.2), and `##other` admits no attribute in no namespace (3.10.4, Wildcard
 * allows Namespace Name, clause 2.3). Shown by its control: the same group widened by a derived
 * type, and alone.
 */
export const widenedOtherRecord: Recorded = {
  class: "attribute-allowed",
  detail:
    /^codec at \S*: The attribute [^\s:]+ in (?:[^\s:]+:)?qti-custom-operator is admitted on its element under no name or open class/u,
  direction: "oracle-only",
  reason: {
    _tag: "libxml2",
    why: "libxml2 widens a shared ##other attribute wildcard to ##any once a type that references its group extends an ##any base",
  },
  rule: "attribute-admission",
  versions: ["3.0.1"],
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
export const libxml2Records: readonly Recorded[] = [
  idrefRecord,
  locationRecord,
  laxNilRecord,
  emptyIdrefsRecord,
  blankListRecord,
  base64Record,
  absentTypeRecord,
  invalidIdRecord,
  paddedTypeRecord,
  widenedOtherRecord,
];

/**
 * Count the differences a libxml2 class accounts for.
 *
 * @param matches - The record each difference matched, `undefined` for none.
 * @returns How many matched one of {@link libxml2Records}.
 */
export const libxml2Count = (matches: readonly (Recorded | undefined)[]): number =>
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
export const laxXsiType: Recorded = {
  class: "attribute-value",
  direction: "xsd-only",
  reason: {
    _tag: "reading",
    reading: 60,
    says: "a name the schemas do not define leaves it to lax assessment under `lax`",
    why: "an xsi:type naming no type, on an element laxly assessed under a wildcard: XML Schema's clause 1.2 fails and lax assessment applies, which reads as valid; xmllint refuses it",
  },
};

/**
 * One of `xmllint`'s messages that an element's `xsi:type` names no type definition, the element's
 * expanded name captured.
 */
const unresolvedXsiType =
  /^line \d+ (?<name>(?:\{[^}]*\})?\S+): The QName value '[^'\t\n\r ]*' of the xsi:type attribute does not resolve to a type definition\.$/u;

/**
 * Decide whether a difference is reading 60's class ({@link laxXsiType}): every message `xmllint`
 * gave for it says an `xsi:type` resolves to no type definition, each on an element the law
 * oracle's rows hold as laxly assessed. A padded value is libxml2's ({@link paddedTypeRecord}),
 * since its collapsed QName may name a type.
 *
 * @param difference - The difference.
 * @param laxNames - The document's laxly assessed elements' expanded names.
 * @returns Whether it is.
 */
export const isLaxXsiType = (difference: Difference, laxNames: ReadonlySet<string>): boolean =>
  difference.direction === laxXsiType.direction &&
  difference.class === laxXsiType.class &&
  difference.detail.split(" | ").every((message) => {
    const name = unresolvedXsiType.exec(message)?.groups?.["name"];

    // xmllint names an element in no namespace by its local name alone, which the rows write `{}`
    // before.
    return name !== undefined && laxNames.has(name.startsWith("{") ? name : `{}${name}`);
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
export const nestedRoot: Recorded = {
  direction: "xsd-only",
  reason: {
    _tag: "reading",
    reading: 6,
    says: "It is kept as foreign content like any other element",
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
export const isNestedRoot = (difference: Difference, nested: ReadonlySet<string>): boolean =>
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
export const outsideSet: Recorded = {
  direction: "oracle-only",
  reason: {
    _tag: "reading",
    reading: 81,
    says: "One limit follows from the grammar being keyed by version and not by schema set.",
    why: "the grammar, keyed by version and not by schema set, judges an element or attribute its document's schema set does not declare as another set declares it; XML Schema assesses it against nothing",
  },
};

/**
 * `qti-ordering`'s extension slot (spec reading 61): it admits an element in QTI's own namespace
 * or in none, which the information model's "reused QTI ASI tags" allows, laxly, while the XSD's
 * `##other` wildcard refuses it and `xmllint` with it, naming the first such child of the slot.
 */
export const orderingSlot: Recorded = {
  class: "content",
  direction: "xsd-only",
  reason: {
    _tag: "reading",
    reading: 61,
    says: "An element in QTI's own namespace inside `qti-ordering`'s extension slot is valid.",
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
export const fragmentRoot: Recorded = {
  direction: "xsd-only",
  reason: {
    _tag: "reading",
    reading: 114,
    says: "there it stands for its fragment's root",
    why: "a fragment's document roots at a kind an include stands for, which the XSDs declare locally; xmllint, validating it alone, finds no global declaration for the root",
  },
};

/**
 * The kinds of the roots only a fragment's document has (spec reading 114): every kind an include
 * stands for that no resource type lists as its root, the manifest aside.
 */
export const fragmentOnlyKinds: ReadonlySet<string> = (() => {
  const grammar = Result.getOrThrow(composed());
  const listed = new Set(
    grammar.package.rootOfType.rows
      .filter(({ type }) => type !== "imsqti_fragment_xmlv3p0")
      .map(({ root }) => root),
  );

  return new Set(
    fragmentRoots.flatMap(({ root }) => (listed.has(root) || root === "cp:manifest" ? [] : [root])),
  );
})();

/**
 * The expanded names of {@link fragmentOnlyKinds}, as `namespace}local`.
 */
export const fragmentOnlyRoots: ReadonlySet<string> = (() => {
  const grammar = Result.getOrThrow(composed());

  return new Set(
    [...fragmentOnlyKinds].flatMap((kind) =>
      Option.toArray(grammar.kinds.elementName.lookup({ kind })).map(
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
export const nestedRootLaw: Recorded = {
  direction: "oracle-only",
  reason: {
    _tag: "reading",
    reading: 6,
    says: "It is kept as foreign content like any other element",
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
export const isNestedRootLaw = (
  difference: Difference,
  nestedPaths: ReadonlySet<string>,
): boolean => {
  const place = breachDetail.exec(difference.detail)?.groups?.["path"];

  return (
    difference.direction === nestedRootLaw.direction &&
    place !== undefined &&
    nestedPaths.has(place)
  );
};

/**
 * The law oracle's side of a padded `xsi:type` ({@link paddedTypeRecord}): libxml2 assesses the
 * element by no type, laxly where a lax wildcard holds it, and the law oracle by the type the
 * collapsed QName names, so it refuses within that element what the type refuses and `xmllint`
 * never assessed: a text outside a simple type's domain, a child or an attribute the type does
 * not admit.
 */
export const paddedTypeLaw: Recorded = {
  direction: "oracle-only",
  reason: {
    _tag: "libxml2",
    why: "libxml2 assesses an element whose xsi:type is padded by no type, so the refusals of the type its collapsed QName names are the law oracle's alone",
  },
};

/**
 * Decide whether a difference is {@link paddedTypeLaw}: a law refusal the law oracle states of a
 * node at or within an element whose `xsi:type` is padded, by the path the comparison writes.
 *
 * @param difference - The difference.
 * @param paddedPaths - The paths of the document's nodes at or within such an element, as the law
 *   oracle writes a node's place.
 * @returns Whether it is.
 */
export const isPaddedTypeLaw = (
  difference: Difference,
  paddedPaths: ReadonlySet<string>,
): boolean => {
  const place = breachDetail.exec(difference.detail)?.groups?.["path"];

  return (
    difference.direction === paddedTypeLaw.direction &&
    place !== undefined &&
    paddedPaths.has(place)
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
export const isOutsideSet = (
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
    says: "an attribute its XSD does not declare is a `data-` attribute, or the document is refused.",
    why: "the Schematron's extension rules admit no undeclared attribute but a data- one on the elements they cover; xmllint runs no Schematron and admits it under the ##any lax wildcard",
  },
  rule: "attribute-admission",
};

/**
 * Decide whether a bred document's difference is reading 81's limit ({@link outsideSet}) by where
 * its edits were made: the law oracle stopped at the codec or a fold, refusing what an edit made at
 * an element whose namespace the document's schema set does not declare, which only a kind
 * standing in more than one set reads as its declaration, so the law oracle refuses what XML
 * Schema assesses against nothing. The codec refuses such an edit before any law reads a row, so
 * {@link isOutsideSet}, which reads the oracle's rows, cannot see it; a judgment the oracle did
 * not stop is left to {@link isOutsideSet}.
 *
 * @param difference - The difference.
 * @param stopped - Whether the law oracle stopped at the reader, the codec or a fold.
 * @param edited - The namespaces of the elements the document's edits changed, from its seed.
 * @param set - The namespaces of the document's schema set.
 * @returns Whether it is.
 */
const isOutsideEdit = (
  difference: Difference,
  stopped: boolean,
  edited: ReadonlySet<string>,
  set: ReadonlySet<string>,
): boolean =>
  stopped &&
  difference.direction === outsideSet.direction &&
  [...edited].some((namespace) => !set.has(namespace));

/**
 * Every difference between the two oracles on the corpus, classified.
 */
export const recorded: readonly Recorded[] = [
  extensionAttribute,
  {
    class: "beyond",
    detail: /names completion_status, which nothing declares and no built-in variable is/u,
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 72,
      says: "The built-in outcome variable is `completionStatus`, spelled exactly",
      why: "the built-in outcome is completionStatus, compared exactly; adaptive.xml sets completion_status, which nothing declares",
    },
    rule: "P8",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 128,
      says: "A `label` asks for the tool that labelled it where its own characteristic's description says so",
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
      says: "A choice's identifier names it among its document's choices of its class",
      why: "no two choices of one class in a document share an identifier, whichever interactions hold them; the XSD states no key over choice identifiers",
    },
    rule: "choice-identifier-distinct",
  },
];

/**
 * The whitespace a breach's detail writes around a value: a space, or a tab or line end escaped.
 */
const bcp47Space = String.raw`(?:\\[tnr]| )*`;

/**
 * A well-formed BCP 47 language tag, RFC 5646 section 2.1's `Language-Tag` (case-insensitive),
 * written from the RFC's ABNF and not from the grammar's domain, so the reading 129 record below
 * holds only for a value the RFC itself refuses: a `langtag` (language with up to three extlangs,
 * script, region, variants, extensions and a private use), a private use alone, or one of the
 * grandfathered tags.
 */
const bcp47Tag = [
  String.raw`(?:[A-Za-z]{2,3}(?:-[A-Za-z]{3}){0,3}|[A-Za-z]{4}|[A-Za-z]{5,8})(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|[0-9]{3}))?(?:-(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(?:-[0-9A-WYZa-wyz](?:-[A-Za-z0-9]{2,8})+)*(?:-[Xx](?:-[A-Za-z0-9]{1,8})+)?`,
  String.raw`[Xx](?:-[A-Za-z0-9]{1,8})+`,
  ...[
    "en-GB-oed",
    "i-ami",
    "i-bnn",
    "i-default",
    "i-enochian",
    "i-hak",
    "i-klingon",
    "i-lux",
    "i-mingo",
    "i-navajo",
    "i-pwn",
    "i-tao",
    "i-tay",
    "i-tsu",
    "sgn-BE-FR",
    "sgn-BE-NL",
    "sgn-CH-DE",
    "art-lojban",
    "cel-gaulish",
    "no-bok",
    "no-nyn",
    "zh-guoyu",
    "zh-hakka",
    "zh-min",
    "zh-min-nan",
    "zh-xiang",
  ].map((tag) =>
    tag.replaceAll(/[A-Za-z]/gu, (letter) => `[${letter.toLowerCase()}${letter.toUpperCase()}]`),
  ),
].join("|");

/**
 * The differences generated documents show that no corpus document does, classified as
 * {@link recorded} classifies the corpus's. A generated run draws its own documents, so a record
 * here may match nothing in a run, and none goes stale.
 */
export const generatedRecorded: readonly Recorded[] = [
  {
    class: "attribute-required",
    detail: /^AL3 required at \S*\/bdo(?:\[\d+\])?: bdo lacks \{dir\}, which Required holds$/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 123,
      says: "A `bdo` carries `dir`, and its value is `ltr` or `rtl`.",
      why: "the information model requires a bdo's dir; the XSD declares it optional, so xmllint accepts a bdo without it",
    },
    rule: "required-attribute",
  },
  {
    class: "attribute-value",
    detail: new RegExp(
      [
        `^value domain at (?:`,
        // An item's or a stimulus's xml:lang: a tag, its whitespace collapsed, never empty.
        `\\S*\\/(?:qti-assessment-item|qti-assessment-stimulus)(?:\\[\\d+\\])?: xml:lang: "(?!${bcp47Space}(?:${bcp47Tag})${bcp47Space}")`,
        // Any other xml:lang: a tag, its whitespace collapsed, or empty.
        `|\\S+: xml:lang: "(?!${bcp47Space}(?:${bcp47Tag})?${bcp47Space}")`,
        // A track's srclang: a tag as written, never empty.
        `|\\S*\\/track(?:\\[\\d+\\])?: srclang: "(?!(?:${bcp47Tag})")`,
        // A lang: a tag as written, or empty.
        `|\\S+: lang: "(?!(?:${bcp47Tag})?")`,
        `)(?:[^"\\\\]|\\\\.)*" is outside \\S+ \\(reading 129\\)(?: \\(\\d+\\))?, whose pattern is `,
      ].join(""),
      "u",
    ),
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 129,
      says: "`xml:lang`, `lang` and a track's `srclang` hold BCP 47 language tags, well-formed as RFC 5646 defines them.",
      why: "xml:lang is a BCP 47 tag or empty (XML 1.0 2.12), never empty on an item or a stimulus, a lang a tag or empty and a track's srclang a tag, both as written; xml.xsd types xml:lang as xs:language, RFC 3066's pattern, or empty, and the XSD lang and srclang as xs:normalizedString",
    },
    rule: "attribute-lexical",
  },
  {
    class: "content",
    detail:
      /^N6 ancestry at \S*\/qti-template-block(?:\.rubric)?\[\d+\]\/\S*: \S+ sits in \{[^}]*\btmpl\b[^}]*\}: Banned holds \{[^}]*\btmpl\b[^}]*\}/u,
    direction: "oracle-only",
    reason: {
      _tag: "specification",
      source:
        "https://www.imsglobal.org/spec/qti/v3p0/info#Data_TemplateBlock (§5.145, info.txt:44712 and info301.txt:65416: 'A qti-template-block must not contain any interactions, either directly or indirectly'); VD's ruling of 2026-11-07, its reading to come at schema slot 7",
      why: "a template block holds no interaction at any depth; the XSD admits one its content's HTML holds",
    },
    rule: "ancestry-ban",
  },
  {
    class: "content",
    detail:
      /^N7 Counted at \S*\/lom:[\w.]+(?:\[\d+\])?: \d+ children at position \d+, which Counted bounds to \d+ to \d+$/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 130,
      says: "A LOM element repeats no more than the loose binding's Schematron allows.",
      why: "the loose LOM binding's Schematron caps each LOM element's repeats; its XSD leaves them unbounded",
    },
    rule: "child-set",
  },
  {
    class: "attribute-value",
    detail:
      /^value domain at \S*\/source(?:\[\d+\])?: src: "(?:\\[tnr]| )*" is outside URLDType \(reading 124\)/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 124,
      says: "A `source` in a `picture` carries `srcset`, and one in an `audio` or a `video` carries `src`.",
      why: "the information model says a source's src is a valid non-empty URL potentially surrounded by spaces (5.135.1); the XSD types src as a URL that may be blank",
    },
    rule: "attribute-lexical",
  },
  {
    class: "content",
    detail:
      /^codec at \/: The element \S+ in \S+ is in the MathML namespace, and its parent admits no MathML element of that name, while MathML content stands only inside an m:math element/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: "`math` is MathML's one root",
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
      says: "A match table entry's `target-value` is a value of the outcome's base type.",
      why: "a match table entry's target-value is a value of the outcome's base type; the XSD types it as one of the base-type names",
    },
  },
  {
    class: "content",
    detail:
      /^N6 ancestry at \S+: \S+ sits in \{[^}]*\}: Banned holds \{test\} of it, and Needs lacks \{\}$/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 25,
      says: "A test's rubric and feedback hold no interactions or templates",
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
      says: "A `qti-gap` appears only within a gap-match interaction",
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
      says: "An identifier names one variable among the declarations of its document.",
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
      says: "An SSML `meta` has exactly one of `name` and `http-equiv`.",
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
      says: "such as an operator applied to the wrong number of arguments",
      why: "a MathML operator takes the arguments its class states (MathML 3, 4.3.4); the XSD's apply takes any number",
    },
    rule: "math-arity",
  },
  {
    class: "content",
    detail:
      /^N5 Follow at \S+: (?:m:\S+ follows state \d+, after which m:\S+'s content model in \S+ admits |no position of m:\S+'s content model that names m:\S+ follows its predecessor in )/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: 'qualifiers appear in the order "bvar, lowlimit, uplimit, interval, condition, domainofapplication, degree, momentabout, logbase"',
      why: "MathML's qualifiers stand in the order bvar, lowlimit, uplimit, interval, condition, domainofapplication, degree, momentabout, logbase, a condition only after a bvar (MathML 3, 4.3.3 and 4.3.3.2), and a bind's bound variables come before its body (4.2.6.1); the XSD's apply and bind take their qualifiers in any order",
    },
    rule: "ordering",
  },
  {
    class: "content",
    detail: /^N7 Last at \S+: m:(?:bind|mlongdiv|mstack) holds /u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: "It is an error for mscarries to be the last element of an mstack or mlongdiv element",
      why: "an mscarries is not the last element of an mstack or an mlongdiv, and a bind holds at least one bvar (MathML 3, 3.6.1 and 4.2.6.1); both schemas repeat those children in any order, so the automaton's last-position law states it",
    },
    rule: "child-set",
  },
  {
    class: "content",
    detail: /^MathML head qualifier at \S+: m:apply applies /u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: "for an `apply` that holds no qualifier but its operator's own",
      why: "spec reading R6-head-qualifiers: an apply's operator takes only the qualifiers its MathML 3 syntax table lists (degree with root, logbase with log, momentabout with moment, 4.4); the XSD's apply takes any qualifier beside any operator",
    },
    rule: "admission",
  },
  {
    class: "attribute-value",
    detail: /^MathML cn form at \S+: (?:a cn of type|part \d+ of a cn of type) /u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: "`cn`'s content has the form its `type` implies",
      why: "spec reading R6-hexdouble: a cn's content has the form its type implies, split at m:sep, with digits read in its base (MathML 3, 4.2.1); the XSD types the content as mixed text",
    },
    rule: "attribute-lexical",
  },
  {
    class: "content",
    detail: /^MathML maction selection at \S+: an m:maction /u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: "an `maction`'s `selection` names one of its children",
      why: "an maction's selection names one of its children, and one with no child selects none (MathML 3, 3.7.1.1: 'If the value specified is out of range, it is an error'); the XSD types selection a positive integer and counts no children",
    },
    rule: "union-count",
  },
  {
    class: "content",
    detail: /^MathML align placement at \S+: an m:maligngroup /u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: "an `maligngroup` inside a table cell stands only where §3.5.5.2 lets it",
      why: "an maligngroup in a table cell stands only where MathML 3, 3.5.5.2 lets it (an mrow or mstyle that changes no direction, mphantom, mfenced, the selected child of an maction, semantics); the XSD admits it under any presentation element",
    },
    rule: "admission",
  },
  {
    class: "content",
    detail: /^MathML align first at \S+: the table cell at /u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: "the cell's first complete element is a group",
      why: "a table cell holding an alignment group starts with one (MathML 3, 3.5.5.2: 'the first complete element must be an maligngroup element'); the XSD's mtd takes its children in any order",
    },
    rule: "ordering",
  },
  {
    class: "identity",
    detail: /^MathML share cycle at \S+: the m:share at /u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: 'no element dominates itself: "An element may not dominate itself"',
      why: "no element dominates itself, and a share's same-document src names the element it stands for (MathML 3, 4.2.7: 'An element may not dominate itself'); the XSD types src xs:anyURI and follows no reference",
    },
    rule: "document-key",
  },
  {
    class: "identity",
    detail: /^Idref target at \S+\/m:share\[\d+\]: src names /u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: "a `share`'s `#id` names an element of its document",
      why: "a share's src, a same-document fragment '#id', names an element of its document (MathML 3, 4.2.7); the XSD types src xs:anyURI and resolves it nowhere",
    },
    rule: "idref-target",
  },
  {
    class: "content",
    detail:
      /^line \d+ \{http:\/\/www\.w3\.org\/1998\/Math\/MathML\}\S+: Character content is not allowed, because the content type is empty\.(?: \| line \d+ \{http:\/\/www\.w3\.org\/1998\/Math\/MathML\}\S+: Character content is not allowed, because the content type is empty\.)*$/u,
    direction: "xsd-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: "RELAX NG matches a whitespace-only text against `empty`",
      why: "a MathML element whose RelaxNG content is empty admits whitespace-only text, as RELAX NG matches it against empty; the normative MathML 3 RelaxNG is followed over QTI's bundled XSD, whose empty types refuse it (xmllint's XSD validator)",
    },
  },
  {
    class: "beyond",
    detail: /^SSML (?:lexicon reference|trim mark) /u,
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 3,
      says: 'In SSML, "the document" is each `speak` fragment.',
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
      says: "A mapping maps a base type other than `file` and `duration`, of a variable that is not a record.",
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
      says: "A lookup table sets a single outcome.",
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
      says: "An interaction's `response-identifier` names a declared response variable.",
      why: "an interaction's response-identifier names a response its item declares; the XSD types it an identifier and resolves it nowhere",
    },
    rule: "binding-declared",
  },
  {
    class: "attribute-value",
    detail:
      /^value domain at \S+: (?:src|poster|srcset): "(?: |\\[nrt])*" is outside URLDType \(reading [^)]*\b12[45]\b/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 124,
      says: 'Each media URL the information model describes as "a valid non-empty URL potentially surrounded by spaces" holds a character other than a space',
      why: 'a media URL "must contain a valid non-empty URL potentially surrounded by spaces" (information model §5.9.1, §5.135.1, §5.163.2, §5.166.1, §5.166.9; reading 125 for track), so an empty or blank src, poster or srcset is refused; the XSD\'s URLDType is any xs:normalizedString',
    },
    rule: "attribute-lexical",
  },
  {
    class: "attribute-value",
    detail: /^value domain at \S+: xref: ".*" is outside xs:IDREF\b/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 2,
      says: "`xref` names an `id` of its document, an `xs:IDREF`",
      why: "MathML 3's xref names an id of its document (an xs:IDREF, §5.4.2), where QTI's bundled MathML XSD types it xs:anySimpleType, so text that is no IDREF is refused",
    },
    rule: "attribute-lexical",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "specification",
      source:
        "R10-a: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_PortableCustomInteraction.Attr_module (§5.106.2: 'If this characteristic is provided the qti-interaction-modules child attribute is not required, if omitted then the modules child element is mandatory')",
      why: "a portable custom interaction names its module by module, by qti-interaction-modules, or by both; the XSD makes both optional",
    },
    rule: "pci-module-source",
  },
  {
    class: "content",
    direction: "oracle-only",
    reason: {
      _tag: "specification",
      source:
        "R10-b: https://www.imsglobal.org/spec/qti/v3p0/info#Data_PortableCustomInteraction (§5.106, 3.0.0: 'PCIs MUST be used instead of custom interactions (the latter have been deprecated)')",
      why: "a 3.0.0 document holds no custom interaction, which the XSD still declares; a 3.0.1 document may",
    },
    rule: "admission",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "specification",
      source:
        "https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_ResponseCondition_qti-response-if (§5.114.1, and §5.114.2 and §5.117 of the response branches, §5.99.1, §5.99.2 and §5.101 of the outcome branches, and §5.149.1, §5.149.2 and §5.154 of the template branches: each 'consists of an expression which must have an effective base-type of boolean and single cardinality'), and https://www.imsglobal.org/spec/qti/v3p0/info#Data_TemplateConstraint (§5.150: 'A templateConstraint contains an expression which must have an effective base-type of boolean and single cardinality')",
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
        "https://www.imsglobal.org/spec/qti/v3p0/info#Abstract_ExpressionGroup (§6.9, ExpressionGroup: each operator's attribute states its sub-expressions' base types and cardinalities, as §6.9.33, qti-member, 'The first sub-expression must have single cardinality and the second must be a multiple or ordered container', and §6.9.21, qti-match, 'which must both have the same base-type and cardinality')",
      why: "each operator takes the operand types §6.9 states; the XSD admits any expression as any operand",
    },
    rule: "P23",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 23,
      says: "The eight outcome-only expressions are forbidden outside outcome processing.",
      why: "the test operators stand only in outcome processing; the XSD admits them in any expression, response processing's included",
    },
    rule: "P25",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "specification",
      source:
        "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_base-type (§4.5.3, and §5.34.3, §5.115.3, §5.151.3: 'Variables with record cardinality have no base-type')",
      why: "a record declares no base type and every other variable declares one; the XSD makes base-type optional on every declaration",
    },
    rule: "declaration-type",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 77,
      says: "A response variable, declared or built in, is refused for both",
      why: "a feedback element's outcome-identifier names a declared outcome; the XSD types it an identifier and resolves it nowhere",
    },
    rule: "feedback-ref",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 77,
      says: "The outcome variable or template variable must have been defined.",
      why: "a printed variable names a declared outcome or template variable; the XSD types its identifier and resolves it nowhere",
    },
    rule: "printed-variable-ref",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "specification",
      source:
        "https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_LookupOutcomeValue_expressionGroup (§5.87.2: 'An expression which must have single cardinality and an effective base-type of either integer, float or duration. Integer type is required when the associated table is a matchTable')",
      why: "a lookup's expression is a single integer, float or duration, and an integer for a match table; the XSD types no expression",
    },
    rule: "P22",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "specification",
      source:
        "https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-variable (§6.9.40: 'This expression looks up the value of an itemVariable that has been declared in a corresponding variableDeclaration or is one of the built-in variables'), and #DataCharacteristic_SetValue.Attr_identifier (§5.130.1: 'The identifier of the variable to be set')",
      why: "a variable reference or setter names a declared or built-in variable; the XSD types its identifier and resolves it nowhere",
    },
    rule: "P8",
  },
  {
    class: "beyond",
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 79,
      says: "The number of children to select may exceed the number of child elements defined only if with-replacement is true",
      why: "a selection without replacement selects at most its section's parts; the XSD bounds select by no count",
    },
    rule: "selection-bounds",
  },
];

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
export interface ForeignNames {
  readonly lax: ReadonlySet<string>;
  readonly lomReads: ReadonlySet<string>;
  readonly nested: ReadonlySet<string>;
  readonly nestedPaths: ReadonlySet<string>;
  readonly outside: ReadonlySet<string>;
  /**
   * The places, as the law oracle writes them, of the nodes at or within an element whose
   * `xsi:type` is padded ({@link paddedTypeLaw}).
   */
  readonly paddedPaths: ReadonlySet<string>;
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
export const foreignNamesOf = Effect.fn("test.foreignNamesOf")(function* foreignNamesOf(
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
      paddedPaths: new Set(),
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
  const padded = new Set(
    rows.attributes.flatMap(({ lexical, name, node }) =>
      name === "xsi:type" && lexical.trim() !== lexical ? [node] : [],
    ),
  );
  const typed = rows.nodes.filter((node) => padded.has(node.id));

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
    paddedPaths: new Set(
      rows.nodes
        .filter((node) => typed.some((at) => at.start <= node.start && node.end <= at.end))
        .map(placeOf),
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
export const judgeDocument = Effect.fn("test.judgeDocument")(function* judgeDocument(input: {
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
          case "prefix-unbound":
          case "type-unknown":
          case "type-unresolved": {
            // A QName value no binding in scope resolves, or that names no type, is a value its
            // attribute's declaration refuses, which xmllint reports on the attribute.
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
 * @param document - The document, by the zip it is in and its path there, which a record's
 *   `document` pattern reads.
 * @param document.path - Its path.
 * @param document.zip - Its zip.
 * @param version - The version it was judged in.
 * @param difference - The difference.
 * @param records - The records it may match, the corpus's by default.
 * @returns The first record that matches it, or `undefined`.
 */
export const recordOf = (
  document: { readonly path: string; readonly zip: string },
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
export const reasonText = (reason: Reason): string => {
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
 * Validate documents with `xmllint` in a version, each against its root's schema set (spec reading
 * 81): grouped by the namespace of their root, each group with that namespace's root driver, the
 * groups' processes at once, since each spends its time compiling its own schema set.
 *
 * @param oracle - What `writeXsdOracle` wrote.
 * @param version - The schema version.
 * @param documents - Each document's bytes and the file it was written to.
 * @returns Each document's verdict, in order.
 */
export const validated = Effect.fn("test.validated")(function* validated(
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
  const judged = yield* Effect.forEach(
    groups,
    ([root, held]) =>
      Effect.map(
        xmllintValidate({
          catalog: oracle.catalog,
          paths: held.map(({ file }) => file),
          schema: driverFor(oracle, version, root),
        }),
        (got) => [held, got] as const,
      ),
    { concurrency: "unbounded" },
  );

  for (const [held, got] of judged) {
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
export const isOrderingSlot = (
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
 * The classes {@link elementGrainDifferences} compares element by element: each is one both sides
 * report on the element that breaks it, `xmllint` on the element its message names and the law
 * oracle at the node its breach names. Content is among them because the comparison holds only
 * where `xmllint` met no unexpected child, which it names where the law oracle names the parent:
 * what is left, a missing child and character or element content an element may not hold, both
 * sides name on the element itself.
 */
const elementGrainClasses: ReadonlySet<RefusalClass> = new Set([
  "attribute-allowed",
  "attribute-required",
  "attribute-value",
  "content",
  "text-value",
]);

/**
 * Write an element's expanded name as `xmllint`'s messages do: `{namespace}local`, or `local` alone
 * in no namespace.
 *
 * @param name - The name.
 * @param name.local - Its local name.
 * @param name.namespace - Its namespace name.
 * @returns The name.
 */
const messageName = ({ local, namespace }: { local: string; namespace: string }): string =>
  namespace === "" ? local : `{${namespace}}${local}`;

/**
 * The kind a node place names last, as the law oracle writes a place (`/a[0]/b[2]`).
 *
 * @param node - The place.
 * @returns The kind, empty for the document.
 */
const kindOfNode = (node: string): string =>
  (node.split("/").at(-1) ?? "").replace(/\[\d+\]$/u, "");

/**
 * Compare the two judgments of a document element by element, in each class both sides refused it
 * under and the element grain decides ({@link elementGrainClasses}): an element of a kind the
 * grammar names that one side refuses under the class and the other does not is a difference,
 * written as {@link compareJudgments} writes one, so the same records classify it. The class-level
 * comparison sees none there, since both sides hold the class.
 *
 * It holds only where both judgments are whole: the law oracle stopped at no refusal, and
 * `xmllint` met no element its parent's model did not expect, below which it assesses nothing.
 * The law oracle names a foreign element by its foreign kind, not its expanded name, so the
 * document's foreign elements are compared as one: an `xmllint` message on one of them is matched
 * by any refusal of its class at a node of a foreign kind, and such a refusal by any such message.
 *
 * @param xsd - `xmllint`'s verdict.
 * @param law - The law oracle's judgment.
 * @param comparison - The two compared class by class.
 * @param grammar - The composed grammar, which names each kind's element.
 * @param foreign - The expanded names of the document's foreign elements, as `{namespace}local`
 *   (`ForeignNames.lax`).
 * @returns The differences the class-level comparison does not report.
 */
export const elementGrainDifferences = (
  xsd: XsdVerdict,
  law: LawJudgment,
  comparison: Comparison,
  grammar: ComposedGrammar,
  foreign: ReadonlySet<string>,
): readonly Difference[] => {
  if (
    law.stopped ||
    xsd._tag !== "Invalid" ||
    xsd.messages.some(({ text }) => text.startsWith("This element is not expected."))
  ) {
    return [];
  }

  const kinds = new Set(grammar.kinds.elementName.rows.map(messageName));
  const foreignNames = new Set([...foreign].map((name) => name.replace(/^\{\}/u, "")));
  // A foreign element's messages and refusals meet under one name no kind has.
  const foreignGroup = "(foreign)";
  const nameOfNode = (node: string): string | undefined =>
    isForeignKind(kindOfNode(node))
      ? foreignGroup
      : Option.getOrUndefined(
          Option.map(grammar.kinds.elementName.lookup({ kind: kindOfNode(node) }), messageName),
        );
  const nameOfMessage = (name: string): string | undefined => {
    if (foreignNames.has(name)) {
      return foreignGroup;
    }

    return kinds.has(name) ? name : undefined;
  };

  return comparison.xsdClasses.flatMap((cls): readonly Difference[] => {
    if (!elementGrainClasses.has(cls) || !comparison.lawClasses.includes(cls)) {
      return [];
    }

    const said = Map.groupBy(
      xsd.messages.flatMap((message) =>
        Option.contains(classOfMessage(message), cls)
          ? Option.toArray(
              message.element.pipe(
                Option.flatMap((name) => Option.fromUndefinedOr(nameOfMessage(name))),
                Option.map((name) => ({ message, name })),
              ),
            )
          : [],
      ),
      ({ name }) => name,
    );
    const refused = Map.groupBy(
      law.refusals.flatMap((refusal) => {
        const name = refusal.class === cls ? nameOfNode(refusal.node) : undefined;

        return name === undefined ? [] : [{ name, refusal }];
      }),
      ({ name }) => name,
    );

    return [
      ...[...said]
        .filter(([name]) => !refused.has(name))
        .map(([, held]): Difference => ({
          class: cls,
          detail: held
            .map(({ message, name }) => `line ${String(message.line)} ${name}: ${message.text}`)
            .join(" | "),
          direction: "xsd-only",
          rule: "",
        })),
      ...[...refused]
        .filter(([name]) => !said.has(name))
        .flatMap(([, held]) =>
          held.map(({ refusal }): Difference => ({
            class: cls,
            detail: `${refusal.law} at ${refusal.node === "" ? "/" : refusal.node}: ${refusal.detail}`,
            direction: "oracle-only",
            rule: refusal.rule,
          })),
        ),
    ];
  });
};

/**
 * What {@link generatedRecordOf} reads of one judged document beside its difference.
 */
export interface GeneratedContext {
  /**
   * The document, by a zip and a path, as a record's `document` pattern reads it.
   */
  readonly document: { readonly path: string; readonly zip: string };
  /**
   * The namespaces of the elements the document's edits changed, from its seed; empty for a seed.
   */
  readonly edited: ReadonlySet<string>;
  readonly grammar: ComposedGrammar;
  readonly names: ForeignNames;
  readonly root: Element;
  /**
   * The namespaces of the document's schema set (reading 81).
   */
  readonly set: ReadonlySet<string>;
  /**
   * Whether the law oracle stopped at the reader, the codec or a fold.
   */
  readonly stopped: boolean;
  readonly version: SchemaVersion;
}

/**
 * Find the record a generated or bred document's difference matches: reading 114's fragment root,
 * reading 6's nested roots on `xmllint`'s side and on the law oracle's, reading 61's ordering slot,
 * reading 81's schema set by the rows or by an edit the codec refused, reading 60's lax
 * `xsi:type`, and then the corpus's, libxml2's and the generated records.
 *
 * @param difference - The difference.
 * @param context - What the classes read of the document.
 * @returns The record, or `undefined` for a difference no record matches: a bug.
 */
export const generatedRecordOf = (
  difference: Difference,
  context: GeneratedContext,
): Recorded | undefined => {
  const { names, root } = context;
  if (fragmentOnlyRoots.has(`${root.namespace}}${root.local}`)) {
    return fragmentRoot;
  }

  if (isNestedRoot(difference, names.nested)) {
    return nestedRoot;
  }

  if (isNestedRootLaw(difference, names.nestedPaths)) {
    return nestedRootLaw;
  }

  if (isPaddedTypeLaw(difference, names.paddedPaths)) {
    return paddedTypeLaw;
  }

  if (isOrderingSlot(difference, root, names.nested)) {
    return orderingSlot;
  }

  if (
    isOutsideSet(difference, names, context.grammar) ||
    isOutsideEdit(difference, context.stopped, context.edited, context.set)
  ) {
    return outsideSet;
  }

  return isLaxXsiType(difference, new Set([...names.lax, ...names.outside]))
    ? laxXsiType
    : recordOf(context.document, context.version, difference, [
        ...recorded,
        ...libxml2Records,
        ...generatedRecorded,
      ]);
};

/**
 * Every record a difference may match: the corpus's, the generated ones, libxml2's classes and the
 * reading classes {@link generatedRecordOf} decides from a document's rows.
 */
export const everyRecord: readonly Recorded[] = [
  ...recorded,
  ...generatedRecorded,
  ...libxml2Records,
  fragmentRoot,
  laxXsiType,
  nestedRoot,
  nestedRootLaw,
  orderingSlot,
  outsideSet,
  paddedTypeLaw,
];
