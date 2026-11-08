/**
 * The spec-alignment census as code (slice A12): every XSD rule the pinned schemas state and every
 * spec reading, each joined to the composed grammar's relation that owns it, with its status.
 *
 * The XSD rules are read from the content-model and attribute IR (`#pantry/vocab/inventory/`),
 * which the deriver writes from the 23 pinned XSDs and whose own tests check a re-run reproduces
 * it byte for byte, so the census reads the schemas without reading the cache. Each rule is one
 * of:
 *
 * - `content:admission`, per (version, kind): the children its model admits, element particles and
 *   what its wildcards read, against `Admission`'s children;
 * - `content:character`, per (version, kind): whether character data may stand among its children,
 *   against `Admission`'s `text` child;
 * - `content:automaton`, per (version, kind) with element content: order, required particles,
 *   at-most-once and exclusive choice, which the operator's ruling of 2026-11-05 gives one owner,
 *   the Glushkov automaton (`Follow` and `Last`);
 * - `content:count`, per particle whose bound lies in 2…n: the count law `Counted`, which the
 *   automaton relaxes;
 * - `content:count-beyond`, per `Counted` row the XSD's particle does not state as a total: a
 *   reading's count ({@link readingCounts}), or a contradiction;
 * - `attribute:admission`, `attribute:type` and `attribute:required`, per declared (version, kind,
 *   name): `AttributeAdmission`'s row, its domain's enumeration against the XSD type's, and its
 *   use;
 * - `attribute:undeclared`, per admitted (version, kind, name) no declaration and no wildcard of the
 *   kind explains;
 * - `attribute:wildcard`, per (version, kind) whose attribute wildcard admits the XML namespace:
 *   `xml.xsd`'s four global attributes admitted, but on a kind the Schematron's extension rules
 *   cover, where spec reading 90 admits none the kind does not declare;
 * - `attribute:extension`, per (version, kind) the Schematron's extension rules cover: no name
 *   admitted but a declared one, `data-*`, an `xsi:` name and a reading's second spelling (spec
 *   readings 90 and 10);
 * - `text:domain`, per simple-content (version, kind): `TextDomain`'s row;
 * - `reading`, per spec reading of `docs/spec-readings.md`, with the status the alignment audit gives
 *   it after the operator's rulings.
 *
 * A status is `G` (the grammar states the rule), `reading` (it departs from the XSD by a recorded
 * spec reading), `R` (a ruled gap: reading 2's recorded MathML limits and reading 50), `P` (a named
 * slice owns it and nothing states it yet), `RG` (a representation gap the operator has not ruled),
 * `U` (nothing owns it: XSD-invalid content is accepted) or `X` (contradicted: the grammar refuses
 * XSD-valid content, or states a rule with no reading behind it). The value domains' lexical spaces
 * beyond their enumerations are `lexical.oracle.test.ts`'s, against `xmllint`.
 */
import { Option } from "effect";
import { readingRefusals, readingSpellings, readingUses } from "#pantry/grammar/attributes.ts";
import type { Use, ValueDomain } from "#pantry/grammar/attributes.ts";
import { coveredBy } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import { foreignKinds, isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import {
  attributeDeclarations,
  attributeWildcards,
  textTypes,
} from "#pantry/vocab/inventory/attributes.ts";
import { contentModels } from "#pantry/vocab/inventory/models.ts";
import type {
  AttributeDeclaration,
  ContentModel,
  Domain,
  NamespaceConstraint,
  Particle,
} from "#pantry/vocab/inventory/types.ts";
import { globalKinds } from "#pantry/vocab/inventory/vocabularies.ts";
import { namespaceClassesUnder, vocabularyNamespaces } from "#pantry/vocab/namespaces.ts";
import { foreignRoots } from "#pantry/vocab/open.ts";

/**
 * A rule's status, as the alignment audit's §2 defines it.
 */
export type Status = "G" | "P" | "R" | "RG" | "U" | "X" | "meta" | "reading";

/**
 * The statuses, in the order the census reports them.
 */
export const statuses = [
  "G",
  "reading",
  "R",
  "P",
  "RG",
  "U",
  "X",
  "meta",
] as const satisfies readonly Status[];

/**
 * One rule of the census: its family, the version and parent kind it holds in (`both` when the
 * versions agree), what it is about, its owner, its status and what the grammar states of it.
 */
export interface Rule {
  readonly detail: string;
  readonly family: string;
  readonly owner: string;
  readonly parent: string;
  readonly status: Status;
  readonly subject: string;
  readonly version: SchemaVersion | "both";
}

/**
 * A spec reading's entry: its status after the operator's rulings of 2026-11-05 and the slice or
 * relation that owns it, from the alignment audit's Matrix B (§7).
 */
interface ReadingEntry {
  readonly owner: string;
  readonly status: Status;
}

/**
 * Every spec reading's status and owner. Reading 14 is restated to follow the XSD (the text-entry
 * references are IDREFs), so the Idref family owns it; D4 is closed by the Glushkov ruling, so the
 * ruled gaps are reading 2's recorded MathML limits (reading 91) and reading 50; reading 60,
 * restated, checks a simple `xsi:type`'s text and leaves a complex one reading 50's. Readings 51 to
 * 55, 58, 59, 65, 66, 68, 69 and 70 bind plate, which delivers, scores and reports; pantry's part
 * is to store the values they read as written, which the codec does.
 */
export const readings: ReadonlyMap<number, ReadingEntry> = new Map<number, ReadingEntry>([
  [1, { owner: "every law", status: "meta" }],
  [
    2,
    {
      owner:
        "the automaton's restated models (`m:bvar`, `m:piecewise`, the `interval` qualifier's eight, `m:annotation-xml`, `m:lambda`'s ending), `m:semantics.contexp` beside `m:ci`, MathML's root (`roots`), the `math` ancestry flag, the notation domains (`mathmlNotationReadings`, `number` among them, `cnBaseReadings` for `m:cn`'s `base`, and `mathmlXrefReading` for `xref`), the `m:mstack` restatement and the `m:mlongdiv` ending, the restated `qualified` and `bind` models, the arity rows of `selector` and `partialdiff`, the MathML arity law and the laws `MathML head qualifier`, `MathML cn form`, `MathML maction selection`, `MathML align placement`, `MathML align first` and `MathML share cycle`; the MathML empty-content whitespace (`src/grammar/content.ts` `characterData`); the MathML foreign element law (QS); the Recommendation's other prose rules, the five recorded limits the reading lists and the known limits of its checks (reading 91)",
      status: "R",
    },
  ],
  [
    3,
    {
      owner:
        "identity.ts's SSML overlay (`SsmlAttribute`, its `value` the lexical form collapsed; `SsmlScope`, `FragmentValue`, `ssmlTrimMark`, `ssmlLexiconReference`); the oracle's SSML lexicon reference and SSML trim mark, names compared collapsed",
      status: "G",
    },
  ],
  [
    4,
    {
      owner:
        "PE's `Reading` family (`src/qti/expressions.ts`): every `VariableRef` of a test or a section document, in outcome processing, a pre-condition, a branch rule or a template default, read in every reading by each test that places it; the oracle's Prefixed reference",
      status: "G",
    },
  ],
  [
    5,
    {
      owner:
        "RG3's `Instance` tree (`src/qti/tests.ts`) and PE's `PlacedReference` and `AssembledReference` (`src/qti/expressions.ts`): a section document's references and `section-identifier`s resolve once per test that places it; the oracle's Prefixed reference and Section identifier target",
      status: "G",
    },
  ],
  [6, { owner: "N5 admission (`open.ts` `foreignRoots`), shred", status: "G" }],
  [7, { owner: "Q5.08 O2, Q5.11 O5, G5", status: "P" }],
  [8, { owner: "Q5.11 O5", status: "P" }],
  [
    9,
    {
      owner:
        "the Schematron the ASI XSDs embed, each rule to its law (docs/research/unowned-readings.md §9), its extension-attribute lists to reading 90's AL1 rows, and `RULE_SET_ARIA_ROLES_1` to AL1 (`headingRole`, `h1`'s `role` heading, tab or presentation; `readingRefusals`, no `role` on `source`, `src/grammar/attributes.ts`); mastery-range, string-identifier-distinct and reading 23 in W5",
      status: "P",
    },
  ],
  [
    10,
    {
      owner:
        "AL1: `aria-keyshortcuts` admitted closed beside `aria-keyshorts` (`readingSpellings` of attributes.ts)",
      status: "G",
    },
  ],
  [11, { owner: "codec", status: "G" }],
  [12, { owner: "admission, TextDomain", status: "G" }],
  [
    13,
    {
      owner: "the codec's `data-name` and the laws AL4 data name and AL4 declared data name",
      status: "G",
    },
  ],
  [14, { owner: "the Idref family, contained in DocumentId (Q5.05)", status: "G" }],
  [15, { owner: "AttributeAdmission's domain, a kind reading (A5)", status: "X" }],
  [16, { owner: "AL1 (`positiveDouble`)", status: "G" }],
  [17, { owner: "AL1 (`viewList`)", status: "G" }],
  [
    18,
    {
      owner:
        "AL1 (`min-choices` at least 1); Choice bounds over ChoiceBound's `counted` zero and ChoiceCount (references.ts), pinned by `references.order-zero.test.ts` (p15-3: a `max-choices` of 0 stays refused)",
      status: "G",
    },
  ],
  [19, { owner: "Q5.09 O3", status: "P" }],
  [20, { owner: "N5 / N7 (the XSD's `once`)", status: "G" }],
  [21, { owner: "O4 arity", status: "G" }],
  [22, { owner: "N5 (admission omits it)", status: "G" }],
  [23, { owner: "Q5.10 O4 (an ancestry flag)", status: "P" }],
  [24, { owner: "N5", status: "G" }],
  [25, { owner: "N6 (ancestry flag `test`)", status: "G" }],
  [
    26,
    {
      owner:
        "the XSD's own section model, unedited, and no law: a section holds any number of parts, none included (§4.2.15)",
      status: "G",
    },
  ],
  [27, { owner: "AL1", status: "G" }],
  [28, { owner: "Q5.10 O4 (D5)", status: "P" }],
  [
    29,
    {
      owner:
        "the installed `BuiltInVariable` (`src/grammar/install.ts`, re-keyed (root, variable) by PG), read by `VariableRef`'s `E1_derived` and PE's `Reading` (`src/qti/expressions.ts`)",
      status: "G",
    },
  ],
  [30, { owner: "N5, shred", status: "G" }],
  [31, { owner: "the automaton (the XSD's card and card-entry models as written)", status: "G" }],
  [32, { owner: "N5", status: "G" }],
  [33, { owner: "P1 to P3 (Q5.06)", status: "G" }],
  [34, { owner: "Q5.08 O2", status: "P" }],
  [35, { owner: "AL1", status: "G" }],
  [36, { owner: "P3 adds no key (Q5.06)", status: "G" }],
  [37, { owner: "AL1", status: "G" }],
  [38, { owner: "N6", status: "G" }],
  [39, { owner: "AL1 (`version.datatype`, reading 39)", status: "G" }],
  [40, { owner: "the automaton", status: "G" }],
  [41, { owner: "AL5 attribute count (`attributeCounts`)", status: "G" }],
  [42, { owner: "AL1 (`languages.datatype`, reading 42)", status: "G" }],
  [43, { owner: "AL5 attribute count (`attributeCounts`)", status: "G" }],
  [
    44,
    {
      owner:
        "the restated `tokenType` of `ssml:token` and `ssml:w` (`facets.ts` `tokenEdits`); a `voice` there names no kind its parent admits, which the codec refuses (`unmodeled-vocabulary`)",
      status: "G",
    },
  ],
  [
    45,
    {
      owner: "G5, Q5.08; a value a key holds is held to reading 133's key-text bound",
      status: "P",
    },
  ],
  [46, { owner: "G5's derived `int8`", status: "P" }],
  [
    47,
    {
      owner:
        "`xsi:nil` admitted only on the foreign kinds (A6); XsiType derived (Q11's `XsiType`); the governing type's attributes and text under reading 84 (Governor, GovernedAttribute, TypeText)",
      status: "P",
    },
  ],
  [
    48,
    {
      owner:
        "PE's RG4 (`src/qti/expressions.ts`): `ReferenceSegment`'s pieces, `Reading`'s readings counted exactly, `NameLookup`, `VariableLookup` and `MappingLookup` (M2), and the key and the containment over the resolving readings (M3); the oracle's Prefixed reference",
      status: "G",
    },
  ],
  [49, { owner: "N5", status: "G" }],
  [50, { owner: "a ruled limit (decision 227)", status: "R" }],
  [51, { owner: "plate runs the templates; pantry records the name, as written", status: "G" }],
  [52, { owner: "plate scores; pantry stores the mapping as written", status: "G" }],
  [53, { owner: "plate delivers; pantry stores `max-strings` as written", status: "G" }],
  [54, { owner: "plate checks responses; pantry stores `pattern-mask` as written", status: "G" }],
  [55, { owner: "plate checks responses; pantry stores `pattern-mask` as written", status: "G" }],
  [
    56,
    {
      owner:
        "G5's typed `xs:double` values (Q5.08): `Compute.cast` over `doubleForm` for `Mastery_range` (`src/qti/declarations.ts`) and for an interaction's bounds (`src/qti/interactions.ts`), and `MapKeyFloat`'s `value` (`src/qti/mapping.ts`), each rounding the decimal once as XML Schema's mapping does; the stated limit: a float map key outside grizzle's `double precision` form (`floatKeyPattern`) has no typed value and is distinct by its spelling (the float map key row of `docs/grizzle-findings.md`)",
      status: "G",
    },
  ],
  [57, { owner: "the W5 overlays over every node the walk checks (Q5.09)", status: "P" }],
  [58, { owner: "plate checks the pattern; pantry stores `pattern-mask` as written", status: "G" }],
  [59, { owner: "plate scores; pantry stores `coords` as written", status: "G" }],
  [
    60,
    {
      owner:
        "the foreign governor laws: shred's foreign governs (type-unresolved, strict-undeclared), Governor's four xsi: names, TypeText under TextDomain, and Foreign simple content (node.ts `Foreign_simple_content`, C41)",
      status: "P",
    },
  ],
  [
    61,
    {
      owner:
        "content:admission: `qti-ordering`'s restated model (`orderingModel` of `src/grammar/facets.ts`), N5 admitted, Follow and Last; the xmllint differentials set its `##other` verdicts aside by this reading",
      status: "G",
    },
  ],
  [
    62,
    {
      owner:
        "LomObjectIdentifier, LomObjectTitle, over the resource's own records, each a `lom:lom` of its `cp:metadata` (`resourceRecords` and `resourceGenerals`, `src/qti/metadata.ts`); the oracle's lom-identifier and lom-title over the same records, held by the cases `src/test/lom-records.ts` builds, a file's record naming another",
      status: "G",
    },
  ],
  [
    63,
    {
      owner:
        "plate resolves item session control attribute by attribute; pantry stores each `qti-item-session-control` attribute as written, its XSD defaults read by no law",
      status: "G",
    },
  ],
  [
    64,
    {
      owner:
        "no law relates `min-time` and `max-time`; each is the XSD's `NonNegativeDoubleDType` (AttributeGrammar)",
      status: "G",
    },
  ],
  [
    65,
    {
      owner: "plate shows section rubric; pantry stores `qti-rubric-block` as written",
      status: "G",
    },
  ],
  [
    66,
    {
      owner:
        "plate selects and orders; pantry stores `fixed` as written (`Branch_forward` does not read it: reading 87's limit)",
      status: "G",
    },
  ],
  [
    67,
    {
      owner:
        "shred's `versionOf` from the manifest's `schemaversion` (`not-qti3`, reason `schema-version`); the value domain of `cp:resource`'s `type`, each version's XSD enumeration (`attribute-lexical`), and E1_derived over `ResourceTypeLexical` (`src/qti/package.ts`); the per-version `cp:resource` model (`cpx:variant` 0..0 in 3.0.1)",
      status: "G",
    },
  ],
  [
    68,
    {
      owner:
        "plate writes results reports; pantry writes none, and reads a duration value as `xs:double` (`expression-types.ts` `domainValues`)",
      status: "G",
    },
  ],
  [69, { owner: "plate writes results reports; pantry neither writes nor reads one", status: "G" }],
  [70, { owner: "plate delivers tests; pantry delivers nothing", status: "G" }],
  [
    71,
    {
      owner: "the anyURI domain's pattern, RFC 2396 with RFC 2732 (Q3's builtinDomainOf, Q9)",
      status: "G",
    },
  ],
  [72, { owner: "Variable declared (P8)", status: "G" }],
  [73, { owner: "the derived unsigned domains", status: "G" }],
  [74, { owner: "Declaration key", status: "G" }],
  [75, { owner: "Binding declared", status: "G" }],
  [76, { owner: "Choice bounds (references.ts ChoiceBound)", status: "G" }],
  [
    77,
    { owner: "Feedback reference, Feedback outcome type, Printed variable reference", status: "G" },
  ],
  [78, { owner: "MappableBaseType", status: "G" }],
  [79, { owner: "Selection bound", status: "G" }],
  [
    80,
    {
      owner:
        "default hotspot last slot (`qti-hotspot-choice` only), Graphic gap match default hotspot",
      status: "G",
    },
  ],
  [
    81,
    {
      owner:
        "Admission under a wildcard by the document's schema set (`open.wildcardReads`), `StrictlyHeld` and shred's `strict-undeclared`, over the stored rows Strictly held (node.ts, C44) and XsiType available (chardata.ts, C15 and C36); the version-keyed admissions of LOM's and the foreign kinds are its stated limit",
      status: "G",
    },
  ],
  [
    82,
    {
      owner:
        "the value domain of `cp:resource`'s `type` and RootOfType (facets.ts `package.roots`): `imsqti_resprocessing_xmlv3p0` admitted, the guide's spelling refused",
      status: "G",
    },
  ],
  [
    83,
    {
      owner:
        "shred's `type-unresolved` over `xsi:type` values (B2) and `prefix-unbound` over every other value of a QName domain, an attribute's and an element's text through one check (`resolvesIn`; `Qualified`, src/grammar/domains.ts; guard src/model/qname-scope.test.ts); element and attribute name prefixes held by crust's reader (`WellFormednessError`, Namespaces in XML 1.0 §5 Prefix Declared), with no law over the stored rows",
      status: "G",
    },
  ],
  [
    84,
    {
      owner: "Q5.05's AttributeGrammar keyed by the governing type; Q5.03's `Node.governs`",
      status: "P",
    },
  ],
  [
    85,
    {
      owner:
        "AL1 (`xi:include` `parse` is `xml` and `xpointer` refused, attributes.ts); the oracle's Inclusion cycle over a package; Q5.13's `Instance` tree, item-level includes among it",
      status: "P",
    },
  ],
  [86, { owner: "Q5.13's `TestName`; the oracle's test name key", status: "P" }],
  [
    87,
    {
      owner:
        "Q5.13's branch resolutions over `Instance`, each target and shuffle a row of its own (`BranchTarget`, `BranchShuffle`): `Branch_target` and `Branch_forward` in `testLawsByName` (`src/qti/tests.ts`), a rule placed in its own instance by `instanceStart`, held by `src/test/gen/assembly.test.ts`; the oracle's Branch target and Branch forward (`src/test/oracle-laws/tests.ts`, `branchLawsOf`), held by `oracle-laws.differential.oracle.test.ts`",
      status: "P",
    },
  ],
  [
    88,
    {
      owner:
        "PE's numbered `Reading` (`src/qti/expressions.ts`): its item ref's `InstanceName.replaced` through `NameLookup`, and a number of at least 1; the oracle's Prefixed reference",
      status: "G",
    },
  ],
  [89, { owner: "shred's `root-namespace` reason of `not-qti3`", status: "P" }],
  [
    90,
    {
      owner:
        "AL1: the composition's `coveredBy` over the Schematron's extension rules (`src/vocab/inventory/extensions.ts`)",
      status: "G",
    },
  ],
  [91, { owner: "every reading's law, or its recorded limit", status: "meta" }],
  [
    92,
    {
      owner:
        "AL1 (a position object's `min-choices` at least 1); Context variable reference (ContentReference); the oracle's Binding cardinality and Binding unique, Q5.09",
      status: "P",
    },
  ],
  [
    93,
    {
      owner:
        "P2 and P3 over `ResourceHref` and `NamedHref` (`src/qti/package.ts`): a document-typed resource names the document at its href, and every document but the manifest is one a resource names; the importer reads documents through `namedDocuments` (`src/import/overlays/package.ts`)",
      status: "G",
    },
  ],
  [
    94,
    {
      owner:
        "AL1: `xs:NCName` and the types derived from it, over XML 1.0 Second Edition's name tables (`src/grammar/domains.ts`, read from the cached specification by `domains.test.ts`, judged against xmllint by `lexical.oracle.test.ts`); the oracle's bare variable reference; a name a key holds is held to reading 133's key-text bound; an open attribute's local name to 1,329 bytes (`OpenLocal`) and a namespace prefix to 2,665",
      status: "G",
    },
  ],
  [
    95,
    {
      owner:
        "the `entityRef_arm` check of `src/qti/chardata.ts`: a node of kind `entityRef` holds `&`, an NCName and `;`",
      status: "G",
    },
  ],
  [
    96,
    {
      owner:
        "content:automaton: `Follow` and `Last` keep the XSD's sequence order after a repeated wildcard; `content.test.ts`'s xmllint differential sets libxml2's widened verdict aside by this reading, and its reading-96 test exhausts the two widened models",
      status: "G",
    },
  ],
  [
    97,
    {
      owner:
        "Q5.13's `VariableMapping` (`src/qti/tests.ts`): the key (item ref, target) and `Variable_mapping_target`, no session variable; PE's `MappingSource` (`src/qti/expressions.ts`): no other variable of the item, through `ItemRefDocument` and `VariableLookup`",
      status: "G",
    },
  ],
  [
    98,
    {
      owner:
        "Q5.11's map keys (`src/qti/mapping.ts`): `key(MapKey(mapping, key))` over the lexical key (readings 160 and 164 narrow it: a key's identity is the key as written, whatever its matching), and `key(mapping, value)` over each typed relation, `MapKeyInteger`, `MapKeyFloat` (reading 154), `MapKeyPoint`, `MapKeyPair` and `MapKeyDirectedPair`; for matching, `E1_derived` sets `folded` for a string key whose entry is not `case-sensitive=\"true\"` and `matched` to its ASCII lowercase (`Compute.lowerAscii`, grizzle offering no Unicode fold) and otherwise to the key as written; the oracle's `Map key` (`mapKeyValueOf`, `src/test/oracle.ts`)",
      status: "G",
    },
  ],
  [
    99,
    {
      owner:
        "Q5.11's `AreaMapping_base_type` check (`src/qti/mapping.ts`) over the declaration's base type `AreaMapping` copies; the oracle's `AreaMapping base type`",
      status: "G",
    },
  ],
  [
    100,
    {
      owner:
        "Q5.11's `Lookup_table_cardinality` check on `LookupTable`, and `Typed_attribute_value` on `LookupValue` (`src/qti/mapping.ts`); the oracle's `Lookup table cardinality` and `Typed attribute value`",
      status: "G",
    },
  ],
  [
    101,
    {
      owner:
        "PI's `IdBinding` (`src/qti/identity.ts`): each `DocumentId` bound to its `owner`, an attribute's element or an ID-typed text's parent (`IdentityText`), the key (document, id) over the bindings, and Idref target over attribute and text tokens (`TextIdref`); the oracle's `DocumentId key` and `Idref target`",
      status: "G",
    },
  ],
  [
    102,
    {
      owner:
        "P's resolution at import (`src/import/overlays/package.ts` `resolveIn`, `baseIn`, `hrefResolverOf`; RFC 3986 §2.1 and §5.2, each value read by its whitespace class, `xml:base` and the manifest's Base resolved, dot segments removed, segments percent-decoded); `HrefScope` on `File`, `ResourceHref`, `FileHref`, `ResourceFile` and `Reference`, their resolved `path`, `Reference` `lead ‖ target ‖ params ‖ trail` and its scope's written-form implications (`E1_derived`), `resolvedPathPattern` (`E1_derived`), href-listed over (scope, path), `Document_entry` on a document-typed href, and the stated limit `Href_form` (`scope <> unresolved`, `srcsetCandidatePattern`) (`src/qti/package.ts`); the oracle's own resolver `src/test/resolution.ts` and its Href form, Href listed, Document entry and File exists",
      status: "G",
    },
  ],
  [
    103,
    {
      owner:
        "the census `ReferenceAttribute` (`src/grammar/references.ts`, `asiCensus`, `xiCensus`, `mathmlCensus`, `ssmlCensus`; installed by `src/grammar/install.ts`), each value resolved by `src/import/overlays/package.ts` `referenceRowsOf` with the `xml:base` in scope (`basesOf`), read by R6 `file-exists` over `Reference` and `ReferencePath` (`src/qti/package.ts`)",
      status: "P",
    },
  ],
  [
    104,
    {
      owner:
        "PM's `ChoiceVariableName` (`src/qti/interactions.ts`): `Choice_not_variable` over the counted families of `Choice`, `Hottext` and `Declaration` on (document, identifier), and the keys `Choice(document, kind, identifier)` and `Hottext(document, identifier)`; the oracle's Choice not variable and Choice identifier key",
      status: "G",
    },
  ],
  [
    105,
    {
      owner:
        "PM's `UsageValue` (`src/qti/metadata.ts`): a row only for a `ud:value` that writes a `fieldIdentifier` (inside a record) and a `baseType` (`usageRecordValues`), its code a row of its own where the `baseType` spells one (`UsageValueBaseType`, decision 427), `Usage_typed_value` over `BaseTypePattern` on its text, folded by `copiedTextKinds` (`src/qti/node.ts`), and a `baseType` outside a record left untyped; the oracle's Usage typed value (`src/test/oracle.ts`), the same test",
      status: "G",
    },
  ],
  [
    106,
    {
      owner:
        "PE's `Reading` (`src/qti/expressions.ts`): an item ref's prefix reaches the built-ins `BuiltInVariable` lists under an item's root, `QTI_CONTEXT` among them; the oracle's Prefixed reference",
      status: "G",
    },
  ],
  [
    107,
    {
      owner:
        "PE's `MappingSource` and `MappingLookup` (`src/qti/expressions.ts`): a mapped name and its source both resolve; the oracle's Variable mapping source and Prefixed reference",
      status: "G",
    },
  ],
  [
    108,
    {
      owner:
        "PE's `TemplateDefault` (`src/qti/expressions.ts`): `Template_default_target` and `Template_default_type`; the oracle's Template default target and Template default type",
      status: "G",
    },
  ],
  [
    109,
    {
      owner:
        "AL1 admission: the composition's `admitsWild` (`src/grammar/compose.ts`) admits no wildcard `xml:id` on a kind or governor whose declared uses include an ID-derived one; `compose.test.ts`'s wild-ID test over every (version, kind) and (version, governor); xmllint's unimplemented clause 5.2 recorded",
      status: "G",
    },
  ],
  [
    110,
    {
      owner:
        "PE's `MappingItemRef`, `MappingItemRefType`, `MappingSourceDeclaration` and `TemplateDefaultTarget` (`src/qti/expressions.ts`), through `ItemRefDocument` (`src/qti/tests.ts`): a variable mapping under an LTI item ref is accepted unchecked, a recorded limit (`heldMappings` leaves out a mapping whose `MappingItemRefType` names an LTI link; a name read through the link is `linkHeld`), and a template default under it, which has no `TemplateDefaultTarget`, is refused by Template default target; the oracle's Template default target and, over an item an item ref names, its Variable mapping source (`itemRefLaws`, `src/test/oracle-laws/tests.ts`)",
      status: "G",
    },
  ],
  [
    111,
    {
      owner:
        "PE's `ReferenceDeclaration` (`src/qti/expression-types.ts`, each row cited), over `VariableRef` and a test's resolving `Reading` (`src/qti/expressions.ts`); the oracle's Variable kind",
      status: "G",
    },
  ],
  [
    112,
    {
      owner:
        "PE's `setterKinds` (`src/qti/expression-types.ts`): a setter's prefixed `Reading` resolves nothing, and a setter's reference resolves only by its own document's declaration (`src/qti/expressions.ts`); the oracle's Variable kind",
      status: "G",
    },
  ],
  [
    113,
    {
      owner:
        "PG's `HeldRootsUnder` (`install.ts`), read by shred's `heldRoot` (`src/model/shred.ts`, so a held root is no `strict-undeclared`) and PN's `Strictly_held` on `OpenElementName` (`src/qti/chardata.ts`); the oracle's Strictly held",
      status: "G",
    },
  ],
  [
    114,
    {
      owner:
        "IN's `IncludeRoot` and `IncludeParent` (`src/grammar/include.ts`, `install.ts`), the fragment rows of `RootOfType` (`facets.ts` `fragmentRoots`) and the document node's roots; `Inclusion` into `IncludeRoot` (`src/qti/tests.ts`); `include.test.ts` against each parent's automaton; the oracle's Include root and its in-place splice",
      status: "G",
    },
  ],
  [
    115,
    {
      owner:
        "IN's `SiteTarget`, each site's target, a row only where its href names a document the manifest lists: `SiteTarget` into `Site` and into `Document`, every include an include parent reads its `Site`, and each such include that is not `external` its `SiteTarget` (`includeSites`, `src/qti/tests.ts`, Include target); a `Site` marked `external` is proven by its href's `Reference` row (`externalSites` into `externalHrefs`), stored as written and never fetched; and `Include_fragment_identifier` on `Reference` (`src/qti/package.ts`); the oracle's Include target, admitting an external href (`inclusionBreaches`, `src/test/oracle.ts`), and Include fragment identifier; and the schema's one cause per fault: a site's href is its `SitePath` (`src/qti/tests.ts`), written only where it resolves to a path of the package, its `entry` held by `File_exists` (\"File exists\"), every include that is not `external` has its `SitePath` (Include target), every section ref its `SitePath` (\"Document entry\"), and the oracle's Document entry, the box `src/test/gen/sites.test.ts` exhausts",
      status: "G",
    },
  ],
  [
    116,
    {
      owner:
        "IN's `fragmentRootsOf` (`src/grammar/include.ts`): a context-split kind roots no fragment, so `IncludeRoot` refuses an include where only it stands; a stated limit",
      status: "G",
    },
  ],
  [
    117,
    {
      owner:
        "IN's document context (`Document.context`, `contextNearest`, `src/qti/chardata.ts`, through `nodeContext`; `SiteTarget`'s fold and `Fragment_context`, `src/qti/tests.ts`), `PlacedBinding`, `PlacedChoice`, `PlacedHottext`, `ChoiceVariableName`'s placed counts and the section references' fragment placements (`SectionScope`, `SectionTemplateRef`, `SectionContextRef`, `src/qti/interactions.ts`) `IdrefTarget`, `PlacedId`, `AssembledId`, `PlacedIdref`, `PlacedXmlLang`, `AssembledLang` and `PlacedGeneralLang` (`src/qti/identity.ts`), `PlacedVariableRef` (`src/qti/expressions.ts`) and `CatalogTarget`, `PlacedCatalogRef` and `AssembledCatalog` (`src/qti/catalog.ts`), `PlacedMathRank` and `PlacedShareTarget` (`src/qti/mathml-share.ts`), ranked per assembly by `placedShareRowsOf`, under Q5.13's `Instance`; the importer's `contextsOf` (`src/import/context.ts`); the oracle's in-place splice (`inPlaceBreaches`), Fragment context and Document lang over the merged item, and its catalog resolution over the assembly (`Assembly.catalogs`); the laws it lists are known under-refusals",
      status: "G",
    },
  ],
  [
    118,
    {
      owner:
        "IN's restated `xi:include` model (`facets.ts` `includeModel`) and `httpHeaderText` on `accept` and `accept-language` (`src/grammar/attributes.ts`); a fallback in wildcard content is a known under-refusal",
      status: "G",
    },
  ],
  [
    119,
    {
      owner:
        "O's `Rounding` and `Rounding_figures`, one row per qti-equal-rounded and qti-round-to, its shape's `RoundingFigures`, `RoundingMode` and `RoundingModeFigures` where it has them (`src/qti/operators.ts`, rows from `src/import/overlays/operators.ts`)",
      status: "G",
    },
  ],
  [
    120,
    {
      owner: "AL1 (`positiveIndex`, `qti-index`'s `n` at least 1 where it is a number)",
      status: "G",
    },
  ],
  [
    121,
    {
      owner:
        "O's `Tolerance` and `ToleranceToken`, `toleranceRequired` (a containment from the absolute or relative mode's `Attribute` selection into `Tolerance`) and the two `Equal_tolerance` checks (`src/qti/operators.ts`, rows from `src/import/overlays/operators.ts`)",
      status: "G",
    },
  ],
  [
    122,
    {
      owner:
        "M's `LomResourceType` and `LomResourceTypeSource` overlays (`src/qti/metadata.ts`), the law `lom-learning-resource-type` as a containment of a forbidden value's type in a source of another vocabulary, over `Node.stringValue` folded by `copiedVocabularyText` (`src/qti/node.ts`); the oracle's LOM learning resource type",
      status: "G",
    },
  ],
  [
    123,
    {
      owner:
        "AL1 (`overrideDirection`, `bdo`'s `dir` without `auto`) and AL3 (`readingUses` through `readDeclarations`, `bdo`'s `dir` required)",
      status: "G",
    },
  ],
  [
    124,
    {
      owner:
        "H's `Picture_source_srcset` and `Media_source_src`, checks on `Node` over `attrs` (`src/qti/html.ts`); AL1 (`nonEmptyUrl` on `audio`, `video` and `source` `src`, `video` `poster` and `source` `srcset`); the URL Standard's syntax is a stated limit",
      status: "G",
    },
  ],
  [
    125,
    {
      owner:
        "H's `Track_srclang`, a check on `Node` for a track that writes no kind, and `subtitleTrackSrclang`, a containment between two `Attribute` selections (`src/qti/html.ts`); AL1 (`nonEmptyUrl` on `track`'s `src`, and `languageOnly` on its `srclang`, reading 129)",
      status: "G",
    },
  ],
  [
    126,
    {
      owner:
        "H's `TableScope`, `CellHeaders`, `HeaderToken` and `TableHeader` (`src/qti/html.ts`, rows from `src/import/overlays/html.ts`): `tableHeaders` and `HeaderToken`'s key on (node, token)",
      status: "G",
    },
  ],
  [
    127,
    {
      owner:
        "Q's `Quotation` overlay and its `Quotation_punctuation` check (`src/qti/quotation.ts`), over `Node.first` and `Node.last`, which `E1_derived` proves (`src/qti/node.ts`); the oracle's Quotation punctuation; a `’` that closes a quote is a known under-refusal",
      status: "G",
    },
  ],
  [
    128,
    {
      owner:
        "identity.ts's Label tools (`labelAttributes` keeps the labels of `toolLabelKinds`, the kinds whose declared type states the tool sentence, read from the ASI XSDs by `src/grammar/labels.ts` and installed by `src/grammar/install.ts`, and a 3.0.1 item root's own label, as a `LabelUse`; `itemLabels` contained in `toolNames` and `toolVersions`); the oracle's Label tools",
      status: "G",
    },
  ],
  [
    129,
    {
      owner:
        "AL1 (`languageTag`: `xmlLanguage` on every `xml:lang`, the document layer's and a `skip` wildcard's included, `rootLanguage` on the item and stimulus roots, `languageOrEmpty` on `lang`, `languageOnly` on `srclang`); RFC 5646 validity under the IANA registry is a stated limit",
      status: "G",
    },
  ],
  [
    130,
    {
      owner:
        "N7 Counted: the loose LOM binding's 82 capped pairs as `Counted` rows of 0 to 1 (`facets.ts` `lomCaps`, `content.ts` `cappedBy`), installed as `Capped` (`install.ts`) and held by the key over `Node`'s `(parent, state)` at a capped position (`node.ts` `cappedChildren`)",
      status: "G",
    },
  ],
  [
    131,
    {
      owner:
        "chardata.ts `NamespaceUri`, RFC 3986's URI-reference over `Namespace.uri` (law Namespace name, rule `namespace-name`); the oracle's Namespace name over its own Appendix A recogniser (`#pantry/test/uri-reference.ts`)",
      status: "G",
    },
  ],
  [
    132,
    {
      owner:
        "AL1 (`printfFormat` on `qti-printed-variable`'s `format`): each conversion specifier over the listed codes; its one-specifier rule is set aside by reading 161",
      status: "G",
    },
  ],
  [
    133,
    {
      owner:
        "S-ORACLE's `keyText` (`src/qti/limits.ts`: grizzle's `str.bytes(keyTextBytes, …)`, `keyTextBytes` 2,587, what grizzle's `keyTextBytes` leaves beside the widest key, held by `limits.test.ts`), the oracle's Key text bound (rule `key-text-bound`, measured in UTF-8 bytes) over the schema's key copies (`src/test/key-copies.ts`), held to the import's rows by `src/test/keys.oracle.test.ts`. The import writes every copy whatever its length, so the database refuses an over-long one under `key-text-bound`, the oracle's rule",
      status: "G",
    },
  ],
  [
    134,
    {
      owner:
        "R26 `document-lang` (identity.ts `GeneralLang`'s `value`, `lowerAscii(collapse(lang))`, and `LomLanguage`'s `tag`, `lowerAscii(lang)`; `documentLang`); the oracle's Document lang",
      status: "G",
    },
  ],
  [
    135,
    {
      owner:
        "AL1 (`mediaType` through `mediaTypeReadings`, `src/grammar/attributes.ts`: every MimeTypeDType attribute, and each item of the upload interaction's list, RFC 2045's two tokens and a slash); IANA registration is the stated limit",
      status: "G",
    },
  ],
  [
    136,
    {
      owner:
        "AL3 (the XSD's `use=\"required\"` on the four shaped kinds' `coords`) and AL1 (`CoordsDType`), with no reading of its own in the grammar",
      status: "G",
    },
  ],
  [
    137,
    {
      owner:
        "the record: `Attribute.at` and `Namespace.at` keep each family's order (shred, `rootInsertOf`), assembly places by `at`, and `unshred` writes declarations then attributes; no law reads either order, shred's `refusalOrder` names a codec refusal by Canonical XML's keys, and the oracle lists an element's breaches law by law (`attribute-order.oracle.test.ts`, `attribute-order.export.test.ts`, `attribute-order.db.test.ts`)",
      status: "G",
    },
  ],
  [
    138,
    {
      owner:
        "the package reader: `unsafeEntryPath` (`src/package/zip.ts`), which a zip's entry names and a package directory's file paths both meet (`readZip` under `href-path`, `readDirectoryEntry` under `entry-path`, which the import names `href-path`), held by `src/package/entry-path.test.ts`",
      status: "G",
    },
  ],
  [
    139,
    {
      owner:
        "the package reader: `locateDirectory` (`src/package/zip.ts`) requires the central directory's offset plus its size to be the end record's offset, refusing a gap under `zip-format` (ZIP64 records there are refused as ZIP64), held by `src/package/zip-gap.test.ts` and GEN-B's `src/test/genetic-zip.test.ts`",
      status: "G",
    },
  ],
  [
    140,
    {
      owner:
        "crust's DTD reader (`packages/crust/src/dtd.ts`): an attribute default referencing a general entity the subset declares after it is refused; WFC Entity Declared's scope decided at the internal subset's end, a parameter-entity reference taking a document out of it; held by `packages/crust/src/read.forward.test.ts`",
      status: "G",
    },
  ],
  [
    141,
    {
      owner:
        "crust's decoder and encoder (`packages/crust/src/decode.ts` `rows`, `asciiRow` and `decodeRow`, rule `encoding-mismatch`; `packages/crust/src/encode.ts` `encoders`): a document is read in the row of XML 1.0 Appendix F.1 its first bytes are in, under a label that row admits, and each UTF-16 scheme is written with the opening it is read by; held by `packages/crust/src/decode.detection.test.ts` against `packages/crust/src/test/appendix-f.ts`, and by `src/test/genetic-codec.test.ts`'s fixed seeds N3 and N4",
      status: "G",
    },
  ],
  [
    142,
    {
      owner:
        "crust's namespace pass (`packages/crust/src/namespaces.ts` `bindingViolation`, `namespacesVersionOf`) over `packages/crust/src/uri.ts` (`uriReference`, RFC 3986's URI-reference, which pantry's `NamespaceUri` reads; `isNamespaceName`, RFC 3987's IRI-reference under Namespaces 1.1); held by `src/test/namespace-name.test.ts` against the law oracle's `#pantry/test/uri-reference.ts`, `packages/crust/src/uri.test.ts` against RFC 3987 §2.2's ranges, and `src/test/genetic-codec.test.ts`'s fixed seed N2",
      status: "G",
    },
  ],
  [
    143,
    {
      owner:
        "the grammar's `tmpl` flag (`src/grammar/facets.ts` `templateBlockKinds`), held by `src/test/template-interactions.oracle.test.ts` and `src/grammar/ancestry.test.ts`",
      status: "G",
    },
  ],
  [
    144,
    {
      owner:
        "the grammar's `DoubleBound` and `BoundFacet` (`src/grammar/domains.ts`, `src/grammar/install.ts`: a double's or a float's one lower bound, its pattern the lexical space less NaN); the import's `DoubleValue` and `TextDoubleValue` (`src/qti/attributes.ts`, read by `doubleOf` in `src/import/write.ts`) under laws Double value and Double bound (rule `attribute-lexical`); the oracle's Double bound, held by `src/qti/double-bound.oracle.test.ts` against XML Schema's value bound",
      status: "G",
    },
  ],
  [
    145,
    {
      owner:
        "`SectionScope`'s placements over every instance of an item's or a test's assembly whose document is neither (`sectionPlacements`, `src/qti/interactions.ts`; `resolvesUnder`, `src/import/overlays/interactions.ts`), and `TestReference`, `ReferenceDocument` and `PlacedDocument` over every document that is no item (`src/qti/expressions.ts`); the oracle's test references read through what each placed document splices (`readDocumentsOf`, `contentBreachesOf`, `src/test/oracle-laws/tests.ts`), held by `src/test/test-fragment-references.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    146,
    {
      owner:
        "the import's listing, one document per path with the manifest's `none` first (`listDocuments`, `src/import/program.ts`), under \"Document entry\"'s key over `Document`'s (package, path) and its containment of each document-typed href in a document of its type (`src/qti/package.ts`); the oracle's listing and its `typesAt` from the manifest's `none` (`judge`, `packageBreaches`, `src/test/oracle.ts`), held by `src/import/manifest-document.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    147,
    {
      owner:
        "the import's `Named` and `StimulusRef` rows, written only for an element that writes its identifier (`namedOf`, `stimulusRefsOf`, `src/import/overlays/tests.ts`), under \"Test overlay\"'s containment of each such element's identifier attribute in its row (`src/qti/tests.ts`); the oracle's names, given only to an element that writes one (`testDocumentOf`, `src/test/oracle-laws/assembly.ts`); held by `src/import/overlays/tests.test.ts`'s names property and `src/import/overlays/unwritten-identifier.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    148,
    {
      owner:
        "the import's `ObjectIdentifier` and `ObjectTitle`, each copied from its attribute and none without it, beside the `AssessmentObject` every item and test root has, and `LomObjectIdentifier` and `LomObjectTitle` written only for a witness that names the document (`objectRowsOf`, `identifierRowOf`, `titleRowOf`, `src/import/overlays/metadata.ts`; `src/qti/metadata.ts`); the oracle's lom-identifier over the root's identifier, none where unwritten (`packageBreaches`, `src/test/oracle.ts`), and lom-title over its title, none where unwritten (`lomTitleLawsOf`, `src/test/oracle-laws/documents.ts`); held by `src/import/overlays/object-attributes.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    149,
    {
      owner:
        "the import's `NormalMinimum`, written for an outcome declaration where it writes a `normal-minimum` or its version's XSD defaults one, from the inventory leaf (`normalMinimumDefaults`, `src/qti/declarations.ts`; `minimumOf`, `src/import/overlays/declarations.ts`), under \"E1 derived\"'s check of an unwritten one against its version's default and \"Declaration overlay\"'s containment of each 3.0.1 outcome declaration in it, so `MasteryFloor` and Mastery range read it; the oracle's `normalMinimumByDefault` (`src/test/oracle-laws/documents.ts`), held by `src/test/normal-minimum-default.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    150,
    {
      owner:
        "no law: an item's `time-dependent` is the XSD's required `xs:boolean`, which the grammar admits and AL3 requires, and no relation reads it, so an item's `duration` is read in the item or through an item ref whatever it says (`src/qti/expressions.ts`; the oracle's `referenceLaws`, `src/test/oracle-laws/expressions.ts`)",
      status: "G",
    },
  ],
  [
    151,
    {
      owner:
        "the import's `LomObjectTitle` check, under which an object's `xml:lang` compared form that is no language tag (`languageTagPattern`, `src/qti/metadata.ts`, over the grammar's `languageTag`) states no language, and its witness search (`inLanguage`, `src/import/overlays/metadata.ts`); the oracle's lom-title over the root's `xml:lang` as its own AL1 reading reads it, none where it states none (`statedLanguage`, `lomTitleLawsOf`, `src/test/oracle-laws/documents.ts`); held by `src/import/overlays/object-lang.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    152,
    {
      owner:
        "the grammar's one NCName, `ncNamePattern` and its host reading `isNcName` (`src/grammar/domains.ts`), read by the schema's sources of the content references and bindings (`referenceReadOf`, `printedReference`, `sectionFeedbackSource`, `fragmentReferenceOf`, `namedBinding`, `src/qti/interactions.ts`), of the processing references (`namePattern`, `bareReference`, `bracedReference`, `src/qti/expressions.ts`) and of the declaration and field names (`identifiers`, `namedFields`, `src/qti/declarations.ts`), and by the import's readers (`referencesOf`, `sectionNamesOf`, `nameOf`, `src/import/overlays/interactions.ts`; `spelledBy`, `src/import/overlays/expressions.ts`; `namedPiecesOf`, `src/import/overlays/declarations.ts`); the oracle's bare reference and typed values (`referenced`, `typedValueOf`, `src/test/oracle.ts`); held by `src/import/overlays/reference-names.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    153,
    {
      owner:
        "the import's `DeclarationBaseType`, counted by `Declaration.baseTypes`, which `declarationRef` copies into every row that names a declaration, and the typed rows each law over a base type reads (`TypedValue`, `src/qti/declarations.ts`; `BindingBaseType` and `PlacedBindingBaseType`, `src/qti/interactions.ts`; `MappingBaseType`, `MapKeyType` and `LookupValueType`, `src/qti/mapping.ts`), with each record judged by its cardinality (`Reserved_type`, `MappableBaseType`, `AreaMapping_base_type`, `Feedback_outcome_type` and the string binding's `BindingFit`); the oracle's `typedValueOf` (`src/test/oracle-view.ts`), read by `baseTypeOf` and the laws over a type (`src/test/oracle.ts`, `src/test/oracle-laws/documents.ts`, `src/test/oracle-laws/expressions.ts`, `src/test/oracle-laws/tests.ts`); held by `src/test/record-declarations.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    154,
    {
      owner:
        "`MapKeyFloat` (`src/qti/mapping.ts`), its `value` generated by grizzle's `Compute.parseDouble` over `FloatKey`, `xs:double`'s lexical space (`doublePattern`, `src/qti/operators.ts`), mirrored with every float key of it (`floatKeys`, and the import's test in `src/import/overlays/mapping.ts`), under its `key(mapping, value)` (Map key); the oracle's `mapKeyValueOf` over `numberOf` (`src/test/oracle.ts`); held by `src/import/overlays/float-keys.oracle.test.ts` against an exact reference",
      status: "G",
    },
  ],
  [
    155,
    {
      owner:
        "the schema's \"Item ref target\" over the item refs that write an href (`attributesOf(\"href\", [itemRefKind])` into `ItemRefTarget`, `src/qti/tests.ts`) and its copy of a target's type into the assembly's lookup where it names a resource (`targetedItemRefs`, `src/qti/expressions.ts`); the oracle's item ref laws over every item ref, named or not (`itemRefsOf`, read by `itemRefLawsOf` and `documentLawsOf`, `src/test/oracle-laws/tests.ts`); held by `src/qti/item-ref-href.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    156,
    {
      owner:
        "the schema's copy sources of the IDs into `DocumentId`, `namingIdAttributes` and `idTexts` (`namingPattern` over `ncNamePattern`, `src/qti/identity.ts`), and of a `th`'s ID into `TableHeader`, `headerIds` (`src/qti/html.ts`), under \"DocumentId key\" and \"E1 derived\"; the import's `documentIdOf` (`src/import/overlays/identity.ts`) and `th` headers (`src/import/overlays/html.ts`) by `isNcName`; the oracle's `idsOf` by each ID's value domain and `tableHeadersOf` by `nameForm` (`src/test/oracle.ts`); held by `src/import/overlays/id-names.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    157,
    {
      owner:
        "the import's `DeclarationIdentifier`, a declaration's name as a row of its own beside its `Declaration`, which every reference by name targets through `declarationIdentifierRef` and every row that hangs from a declaration copies without it through `declarationRef` (`src/qti/declarations.ts`; `typedDeclarationOf`, `src/import/overlays/declarations.ts`), so a declaration whose identifier names nothing keeps its rows, values, mapping, map keys and tables (`declarationsOf` and `declarationTablesOf`, `src/import/overlays/expressions.ts`; `declarationOf`, read by `src/import/overlays/mapping.ts`); the oracle's declaration laws over every declaration, named or not, and its names by their typed value (`declarationLawsOf`, `src/test/oracle-laws/documents.ts`; `overlayBreaches`, `src/test/oracle.ts`); held by `src/import/overlays/unnamed-declarations.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    158,
    {
      owner:
        "the import's `Declaration` row of every declaration element and its `DeclarationCardinality`, counted by `Declaration.cardinalities`, which `declarationRef` copies, beside `DeclarationBaseType` and `DeclarationIdentifier`, each only where its attribute spells or names something (`src/qti/declarations.ts`; `typedDeclarationOf` and `declarationOf`, `src/import/overlays/declarations.ts`), and the rows each law over a cardinality reads beside it (`ValueSetCardinality`, `TypedValue`, `FieldValue` and `DeclarationName`, `src/qti/declarations.ts`; `MappingCardinality`, `AreaMappingCardinality` and `LookupTableCardinality`, `src/qti/mapping.ts`), with Declaration base type stated from `DeclarationCardinality`; the oracle's declaration laws each where the attributes it reads spell something (`declarationLawsOf` and `valueSetLawsOf`, `src/test/oracle-laws/documents.ts`; `baseTypeOf`, `cardinalityOf` and `recordBreach`, `src/test/oracle.ts`); held by `src/import/overlays/untyped-declarations.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    159,
    {
      owner:
        "`declarationIdentifierRef` (`src/qti/declarations.ts`), the one tuple a name resolves to, which `DeclarationName` copies; the bindings' resolution through it, `BindingDeclaration` and `PlacedBindingDeclaration`, with the cardinality rows the fit laws, Binding cardinality and Max strings required read, `BindingCardinality` and `PlacedBindingCardinality` (`src/qti/interactions.ts`; `namedOf`, `responseIn` and `namedVariablesOf`, `src/import/overlays/interactions.ts`), held by `src/import/overlays/untyped-bindings.oracle.test.ts`; the references' resolution through it, every content reference's, variable reference's, lookup's, template default's, variable mapping's and reading's declaration row, with the cardinality rows Feedback outcome type, a variable reference's type, Template default type and Reference type read, `FeedbackRefCardinality` and `SectionFeedbackRefCardinality` (`src/qti/interactions.ts`; `declarationIn`, `referencesOf`, `placedOf` and `sectionRowsOf`, `src/import/overlays/interactions.ts`), `VariableRefCardinality`, `TemplateDefaultCardinality` and `ReadingCardinality` (`src/qti/expressions.ts`; `declarationsOf`, `referenceDeclarationsOf`, `templateDefaultsOf`, `readingCardinalityOf` and `placedVariableRowsOf`, `src/import/overlays/expressions.ts`), and a choice's name against every named declaration (`declarationNameFamily`, `src/qti/interactions.ts`; `choiceNamesOf`), held by `src/import/overlays/referenced-cardinality.oracle.test.ts`; the oracle's binding and reference laws, which resolve a name whatever the declaration's cardinality, and judge each half of Feedback outcome type and Template default type where what it reads spells something (`src/test/oracle.ts`, `src/test/oracle-laws/tests.ts`, `src/test/oracle-laws/expressions.ts`)",
      status: "G",
    },
  ],
  [
    160,
    {
      owner:
        "the schema's two Map key keys (`src/qti/mapping.ts`): `key(MapKey(mapping, key))` over every mapping's keys as written, whatever its declaration's base type spells, and `key(mapping, value)` over `MapKeyInteger`, `MapKeyFloat`, `MapKeyPoint`, `MapKeyPair` and `MapKeyDirectedPair`, which hang from `MapKeyType`, only where the declaration has a base type; the oracle's mapping law, which reads a key as written where the base type spells nothing and by `mapKeyValueOf` where it spells a code (`src/test/oracle.ts`); held by `src/test/unspelled-declarations.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    161,
    {
      owner:
        "AL1 (`printfFormat` on `qti-printed-variable`'s `format`, `src/grammar/attributes.ts`): text, `%%` and conversion specifiers over the listed codes, any number of them, kept as the attribute's lexical form; the law oracle reads the same composed domain; held by `src/grammar/attributes.test.ts` (read 161, searched, against `printfSpecifiers`) and `src/test/rv-g.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    162,
    {
      owner:
        "the law `Reserved type` (`reservedBaseTypes`' `root` and the containment of a non-float SCORE or MAXSCORE into a test's root, `src/qti/declarations.ts`; the oracle producer in `src/test/oracle-laws/documents.ts`), held by `Reserved type` in `src/test/laws.oracle.test.ts`",
      status: "G",
    },
  ],
  [
    163,
    {
      owner:
        "the law oracle's direction (`inheritedDirectionOf` and `changesDirection`, `src/test/oracle.ts`) and the builder's (`reading.owns`, `src/import/overlays/mathml-align.ts`): a formula's direction starts at its `m:math`, `ltr` unless it writes `rtl`, and an HTML ancestor's `dir` is not read; held by `src/test/align-direction.test.ts`",
      status: "G",
    },
  ],
  [
    164,
    {
      owner:
        "Q5.11's map keys (`src/qti/mapping.ts`): `key(MapKey(mapping, key))`, the key as written whatever its matching (reading 160, decision 433), so `York` and `york` are two keys and one key written twice is a repeat whatever each entry's `case-sensitive` says (`MapKey.folded` and `matched` stay for matching, set by `E1_derived`); the oracle's `Map key` (`mapKeyValueOf`, `src/test/oracle.ts`), the same identity; held by `src/qti/mapping.oracle.test.ts` and `src/import/overlays/mapping.test.ts`",
      status: "G",
    },
  ],
  [
    165,
    {
      owner:
        'the schema\'s "Mapped response" over a test\'s prefixed readings (`prefixedTableReaders` into `mappedDeclarations` and `areaMappedDeclarations`) and over a reference to a built-in response (`mapsNoBuiltIn` on `VariableRef` and `PlacedVariableRef`, `src/qti/expressions.ts`), and its "Variable kind" over every resolving reading (`namedReadings` into `ReferenceDeclaration`); the oracle\'s Mapped response and Variable kind over each reading (`referenceLawsOf` and `tablesIn`, `src/test/oracle-laws/tests.ts`) and its Mapped response over each built-in response reference (`src/test/oracle-laws/expressions.ts`); held by `src/test/test-map-response.oracle.test.ts`',
      status: "G",
    },
  ],
]);

/**
 * The admissions a spec reading removes from a model: (parent, child) pairs the XSD admits and
 * the grammar refuses on purpose.
 */
const readingOmissions: ReadonlyMap<string, number> = new Map([
  ["qti-template-else qti-template-constraint", 22],
  ["qti-template-else-if qti-template-constraint", 22],
  ["qti-template-if qti-template-constraint", 22],
  ["ssml:token ssml:voice", 44],
  ["ssml:w ssml:voice", 44],
]);

/**
 * The admissions a spec reading adds to a model: (parent, child) pairs the XSD does not admit and
 * the grammar admits on purpose. Spec reading 2 follows the MathML 3 RelaxNG: its `ContExp` holds
 * `semantics-contexp` (`mathml3-strict-content.rnc` line 14), the kind `m:semantics.contexp`, under
 * every model that reads `ContExp`; and `annotation-xml`'s `MathExpression` holds `m:semantics`
 * (`mathml3-common.rnc` line 59), which no XSD declares globally, so its lax wildcard never admits
 * it.
 */
const readingAdmissions: ReadonlyMap<string, number> = new Map([
  ...[
    "m:apply",
    "m:bind",
    "m:lambda",
    "m:set",
    "m:list",
    "m:vector",
    "m:matrix",
    "m:matrixrow",
    "m:semantics.contexp",
    "m:cerror",
    "m:domainofapplication",
    "m:condition",
    "m:uplimit",
    "m:lowlimit",
    "m:degree",
    "m:momentabout",
    "m:logbase",
    "m:piece",
    "m:otherwise",
    "m:reln",
    "m:fn",
    "m:declare",
    "m:interval",
  ].map((parent): readonly [string, number] => [`${parent} m:semantics.contexp`, 2]),
  ["m:annotation-xml m:semantics", 2],
  // Spec reading 61: `qti-ordering`'s slot reads `##any` where the XSD writes
  // `##other`, so it admits QTI's own namespace's globals, but its roots, and the own- and
  // no-namespace foreign classes, beside the XSD's other namespaces.
  ...[
    ...globalKinds
      .filter(({ kind }) => !kind.includes(":") && !foreignRoots.has(kind))
      .map(({ kind }) => kind),
    foreignKinds.own,
    foreignKinds.absent,
  ].map((child): readonly [string, number] => [`qti-ordering ${child}`, 61]),
]);

/**
 * The attribute rules a spec reading departs from the XSD in, by `family parent subject`: a
 * value the XSD's enumeration lists that a reading refuses, an attribute a reading refuses
 * (`readingRefusals`), and an optional attribute a reading requires (`readingUses`).
 */
const readingDepartures: ReadonlyMap<string, number> = new Map([
  ["attribute:type bdo dir", 123],
  ["attribute:type h1 role", 9],
  ["attribute:type qti-match-table-entry target-value", 8],
  ["attribute:type xi:include parse", 85],
  ...readingRefusals.map(({ kind, name, reading }): readonly [string, number] => [
    `attribute:admission ${kind} ${name}`,
    reading,
  ]),
  ...readingUses.map(({ kind, name, reading }): readonly [string, number] => [
    `attribute:required ${kind} ${name}`,
    reading,
  ]),
]);

/**
 * The rules nothing states yet that a named slice owns, by `family parent subject`, with the
 * slice.
 */
const planned: ReadonlyMap<string, string> = new Map();

/**
 * The attribute names the document layer admits on every kind, beside the open classes: XML's
 * and XML Schema's own (`xml:` and `xsi:`), which no kind's declarations list.
 *
 * @param name - The attribute handle.
 * @returns Whether the layer admits it.
 */
const isLayerName = (name: string): boolean =>
  name.startsWith("xml:") || name.startsWith("xsi:") || openClasses.some((open) => open === name);

/**
 * The children a particle admits: the kinds its element particles name, and its wildcards'
 * namespace constraints.
 */
interface Children {
  readonly kinds: readonly string[];
  readonly wildcards: readonly NamespaceConstraint[];
}

/**
 * The children of a model with no particle.
 */
const noChildren: Children = { kinds: [], wildcards: [] };

/**
 * The child kinds a particle names, its wildcards' included as `any` markers.
 *
 * @param particle - The particle.
 * @returns The element kinds, and the wildcards' namespace constraints.
 */
const childrenOf = (particle: Particle): Children => {
  switch (particle._tag) {
    case "element": {
      return Option.contains(particle.occurs.max, 0)
        ? { kinds: [], wildcards: [] }
        : { kinds: particle.kinds, wildcards: [] };
    }
    case "any": {
      return {
        kinds: [],
        wildcards: Option.contains(particle.occurs.max, 0) ? [] : [particle.namespace],
      };
    }
    case "group": {
      const held = particle.particles.map(childrenOf);

      return Option.contains(particle.occurs.max, 0)
        ? { kinds: [], wildcards: [] }
        : {
            kinds: held.flatMap(({ kinds }) => kinds),
            wildcards: held.flatMap(({ wildcards }) => wildcards),
          };
    }
    default: {
      return particle satisfies never;
    }
  }
};

/**
 * The particles of a model numbered as the content grammar numbers positions: its element and
 * wildcard particles from 1, in tree order, each with whether a group that encloses it may repeat,
 * so that its own bound is per repeat and no total of the family's children.
 *
 * @param particle - The model's particle.
 * @returns Each element and wildcard particle with its position and whether it is repeated.
 */
const positionsOf = (particle: Particle): readonly (readonly [Particle, number, boolean])[] => {
  const out: (readonly [Particle, number, boolean])[] = [];
  const visit = (at: Particle, repeated: boolean): void => {
    if (at._tag === "group") {
      for (const inner of at.particles) {
        visit(
          inner,
          repeated || Option.getOrElse(at.occurs.max, () => Number.POSITIVE_INFINITY) > 1,
        );
      }
    } else {
      out.push([at, out.length + 1, repeated]);
    }
  };
  visit(particle, false);

  return out;
};

/**
 * Whether a wildcard's namespace constraint admits a namespace, `target` being the namespace of
 * the schema it is written in (XML Schema Part 1, 3.10.4).
 *
 * @param constraint - The constraint.
 * @param namespace - The namespace, empty for none.
 * @param target - The schema's target namespace.
 * @returns Whether it admits it.
 */
const admits = (constraint: NamespaceConstraint, namespace: string, target: string): boolean => {
  switch (constraint) {
    case "##any": {
      return true;
    }
    case "##local": {
      return namespace === "";
    }
    case "##other": {
      return namespace !== "" && namespace !== target;
    }
    default: {
      return constraint satisfies never;
    }
  }
};

/**
 * The enumeration values a resolved XSD domain lists, when it is an enumeration: an atomic type
 * whose facets enumerate, or a union of such.
 *
 * @param domain - The domain.
 * @returns The values, or none when the domain is no enumeration.
 */
const enumerationOf = (domain: Domain): Option.Option<ReadonlySet<string>> => {
  const own = domain.facets
    .filter(({ facet }) => facet === "enumeration")
    .map(({ value }) => value);

  if (domain._tag === "atomic") {
    return own.length === 0 ? Option.none() : Option.some(new Set(own));
  }

  if (domain._tag === "union") {
    const members = domain.members.map(enumerationOf);

    return members.every(Option.isSome)
      ? Option.some(
          new Set(
            members.flatMap((member) => [...Option.getOrElse(member, () => new Set<string>())]),
          ),
        )
      : Option.none();
  }

  return Option.none();
};

/**
 * Merge rules that hold alike in both versions into one row each, `version` `both`.
 *
 * @param rules - The rules, one per version.
 * @returns The rules, each identical pair merged.
 */
const merged = (rules: readonly Rule[]): readonly Rule[] => {
  const byKey = new Map<string, Rule>();
  for (const rule of rules) {
    const key = [rule.family, rule.parent, rule.subject, rule.status, rule.owner, rule.detail].join(
      "\u0000",
    );
    const held = byKey.get(key);
    byKey.set(
      key,
      held === undefined || held.version === rule.version ? rule : { ...rule, version: "both" },
    );
  }

  return [...byKey.values()];
};

/**
 * What the census reads of a composed grammar, indexed once: each (version, parent)'s admitted
 * children, each element kind's namespace, which (version, parent)s have an automaton, `Counted`'s
 * rows, the domains, `AttributeAdmission`'s rows and `TextDomain`'s keys.
 */
interface Index {
  readonly admitted: ReadonlyMap<
    string,
    ComposedGrammar["attributes"]["admission"]["rows"][number]
  >;
  readonly automata: ReadonlySet<string>;
  readonly children: ReadonlyMap<string, ReadonlySet<string>>;
  readonly counted: ReadonlyMap<string, ComposedGrammar["content"]["counted"]["rows"][number]>;
  readonly domains: ReadonlyMap<string, ValueDomain>;
  readonly namespaces: ReadonlyMap<string, string>;
  readonly texts: ReadonlySet<string>;
}

/**
 * Index a composed grammar for the census.
 *
 * @param grammar - The grammar.
 * @returns The index.
 */
const indexOf = (grammar: ComposedGrammar): Index => {
  const children = new Map<string, Set<string>>();
  for (const row of grammar.admission.rows) {
    const key = `${row.version} ${row.parent}`;
    children.set(key, (children.get(key) ?? new Set()).add(row.child));
  }

  // The content models whose automata state a row, every model but that of no model.
  const stated = new Set(
    [...grammar.content.follow.rows, ...grammar.content.last.rows].map(({ model }) => model),
  );

  return {
    admitted: new Map(
      grammar.attributes.admission.rows.map((row) => [
        `${row.version} ${row.kind} ${row.name}`,
        row,
      ]),
    ),
    automata: new Set(
      grammar.content.contentModelOf.rows
        .filter(({ model }) => stated.has(model))
        .map((row) => `${row.version} ${row.parent}`),
    ),
    children,
    counted: new Map(
      grammar.content.counted.rows.map((row) => [
        `${row.version} ${row.parent} ${row.position}`,
        row,
      ]),
    ),
    domains: new Map(grammar.attributes.domains.map((domain) => [domain.handle, domain])),
    namespaces: new Map(grammar.kinds.elementName.rows.map((row) => [row.kind, row.namespace])),
    texts: new Set(grammar.attributes.text.rows.map((row) => `${row.version} ${row.kind}`)),
  };
};

/**
 * The kinds each version declares globally.
 */
const globals: ReadonlyMap<SchemaVersion, ReadonlySet<string>> = new Map(
  (["3.0.0", "3.0.1"] as const).map((version) => [
    version,
    new Set(
      globalKinds.filter(({ versions }) => versions.includes(version)).map(({ kind }) => kind),
    ),
  ]),
);

/**
 * The kinds a schema declares globally in a version, which a `lax` or `strict` wildcard reads.
 *
 * @param version - The version.
 * @returns The kinds.
 */
const globalsIn = (version: SchemaVersion): ReadonlySet<string> =>
  globals.get(version) ?? new Set<string>();

/**
 * The element-content particle of a model, none for empty or simple content.
 *
 * @param model - The model.
 * @returns Its particle.
 */
const particleOf = (model: ContentModel): Option.Option<Particle> =>
  model.content._tag === "element-only" || model.content._tag === "mixed"
    ? Option.some(model.content.particle)
    : Option.none();

/**
 * Write an occurrence's bounds, `n` for unbounded.
 *
 * @param min - The least count.
 * @param max - The greatest, none for unbounded.
 * @returns The bounds as `min..max`.
 */
const boundsText = (min: number, max: Option.Option<number>): string =>
  `${String(min)}..${Option.match(max, { onNone: () => "n", onSome: String })}`;

/**
 * The census of one model in one version: its admission, its character content, its automaton and
 * its counted particles.
 *
 * @param index - The grammar's index.
 * @param model - The model.
 * @param version - The version.
 * @returns The rules.
 */
const modelRules = (index: Index, model: ContentModel, version: SchemaVersion): readonly Rule[] => {
  const parent = model.kind;
  const held = index.children.get(`${version} ${parent}`) ?? new Set<string>();
  const particle = particleOf(model);
  const { kinds, wildcards } = Option.match(particle, {
    onNone: () => noChildren,
    onSome: childrenOf,
  });
  const target = index.namespaces.get(parent) ?? "";
  const explained = (kind: string): boolean =>
    kinds.includes(kind) ||
    // A foreign kind is its namespace class (§3.10.1): a wildcard explains the classes its
    // constraint admits.
    wildcards.some((constraint) =>
      namespaceClassesUnder[constraint].some(
        (namespaceClass) => foreignKinds[namespaceClass] === kind,
      ),
    ) ||
    wildcards.some(
      (constraint) =>
        globalsIn(version).has(kind) &&
        admits(constraint, index.namespaces.get(kind) ?? "", target),
    );
  const elementChildren = [...held].filter(
    (kind) => index.namespaces.has(kind) || isForeignKind(kind),
  );
  const missing = [...new Set(kinds)].filter((kind) => !held.has(kind));
  const unread = missing.filter((kind) => !readingOmissions.has(`${parent} ${kind}`));
  const added = elementChildren.filter(
    (kind) => !explained(kind) && readingAdmissions.has(`${parent} ${kind}`),
  );
  const extra = elementChildren.filter((kind) => !explained(kind) && !added.includes(kind));
  const admission = ((): Status => {
    if (unread.length > 0 || extra.length > 0) {
      return "X";
    }

    return missing.length > 0 || added.length > 0 ? "reading" : "G";
  })();
  const wantsText = model.content._tag === "mixed" || model.content._tag === "simple";
  const base = { parent, subject: parent, version };
  const automaton = index.automata.has(`${version} ${parent}`);

  return [
    {
      ...base,
      detail: `refused [${unread.join(" ")}]; by reading [${missing.filter((kind) => !unread.includes(kind)).join(" ")}]; added by reading [${added.join(" ")}]; unexplained [${extra.join(" ")}]`,
      family: "content:admission",
      owner: "Admission",
      status: admission,
    },
    {
      ...base,
      detail: `${model.content._tag}; text admitted: ${String(held.has("text"))}`,
      family: "content:character",
      owner: "Admission (text)",
      status: wantsText === held.has("text") ? "G" : "X",
    },
    ...Option.toArray(particle).flatMap((found): readonly Rule[] => [
      {
        ...base,
        detail: automaton ? "automaton installed" : "no automaton",
        family: "content:automaton",
        owner: "Follow, Last (Glushkov)",
        status: automaton ? "G" : "P",
      },
      ...positionsOf(found).flatMap(([at, position]): readonly Rule[] => {
        const max = Option.getOrElse(at.occurs.max, () => Number.POSITIVE_INFINITY);
        if (at.occurs.min < 2 && !(max >= 2 && Number.isFinite(max))) {
          return [];
        }

        const row = index.counted.get(`${version} ${parent} ${String(position)}`);
        const stated =
          row !== undefined &&
          row.min === at.occurs.min &&
          (!Number.isFinite(max) || row.max === max);

        return [
          {
            ...base,
            detail: `position ${String(position)}: ${boundsText(at.occurs.min, at.occurs.max)}; ${row === undefined ? "no Counted row" : `Counted ${String(row.min)}..${String(row.max)}`}`,
            family: "content:count",
            owner: "Counted",
            status: stated ? "G" : "U",
            subject: at._tag === "element" ? at.kinds.join(" ") : "##any",
          },
        ];
      }),
    ]),
  ];
};

/**
 * The spec reading that states the count of a kind in a family beyond the XSD's particles: spec
 * reading 130 for every LOM element under a LOM element, whose loose binding's Schematron caps
 * them, and none for any other.
 *
 * @param namespaces - Each element kind's namespace.
 * @param parent - The family's parent.
 * @param kinds - The kinds the counted particle names.
 * @returns The reading, or none.
 */
const readingCounts = (
  namespaces: ReadonlyMap<string, string>,
  parent: string,
  kinds: readonly string[],
): Option.Option<number> =>
  Option.liftPredicate(130, () =>
    [parent, ...kinds].every((kind) => namespaces.get(kind) === vocabularyNamespaces.lom.namespace),
  );

/**
 * The `Counted` rows the XSD does not state: a count whose particle the XSD bounds otherwise, or
 * bounds per repeat of a group that encloses it, so its bound is no total. A count a spec reading
 * states is the reading's ({@link readingCounts}); any other is contradicted.
 *
 * @param grammar - The grammar.
 * @returns One rule per such row.
 */
const countsBeyond = (grammar: ComposedGrammar): readonly Rule[] => {
  const namespaces = new Map(
    grammar.kinds.elementName.rows.map((row) => [row.kind, row.namespace]),
  );

  return grammar.content.counted.rows.flatMap((row): readonly Rule[] => {
    const model = contentModels.find(
      ({ kind, versions }) => kind === row.parent && versions.includes(row.version),
    );
    const found = Option.flatMap(Option.fromNullishOr(model), particleOf).pipe(
      Option.flatMap((particle) =>
        Option.fromNullishOr(
          positionsOf(particle).find(([, position]) => String(position) === row.position),
        ),
      ),
      Option.map(([particle, , repeated]) => ({ particle, repeated })),
    );
    const same = Option.exists(
      found,
      ({ particle: { occurs }, repeated }) =>
        !repeated &&
        occurs.min === row.min &&
        Option.getOrElse(occurs.max, () => Number.POSITIVE_INFINITY) === row.max,
    );
    if (same) {
      return [];
    }

    const reading = found.pipe(
      Option.flatMap(({ particle }) =>
        particle._tag === "element"
          ? readingCounts(namespaces, row.parent, particle.kinds)
          : Option.none(),
      ),
    );

    return [
      {
        detail: `Counted ${String(row.min)}..${String(row.max)} at position ${row.position}; XSD ${Option.match(found, { onNone: () => "no particle", onSome: ({ particle: { occurs }, repeated }) => `${boundsText(occurs.min, occurs.max)}${repeated ? " in a repeated group" : ""}` })}${Option.match(reading, { onNone: () => "", onSome: (held) => `; by reading ${String(held)}` })}`,
        family: "content:count-beyond",
        owner: "Counted",
        parent: row.parent,
        status: Option.isSome(reading) ? "reading" : "X",
        subject: Option.match(found, {
          onNone: () => row.position,
          onSome: ({ particle }) =>
            particle._tag === "element" ? particle.kinds.join(" ") : "##any",
        }),
        version: row.version,
      },
    ];
  });
};

/**
 * The status of a declared attribute's use against the grammar's.
 *
 * @param declared - The XSD's use.
 * @param stated - The grammar's.
 * @param key - The rule's `family parent subject`, which a planned owner and a reading that
 *   requires the attribute are looked up by.
 * @returns The status.
 */
const useStatus = (declared: Use, stated: Use, key: string): Status => {
  if (declared === stated) {
    return "G";
  }

  if (declared === "required") {
    return planned.has(key) ? "P" : "U";
  }

  return readingDepartures.has(key) ? "reading" : "X";
};

/**
 * The status of a domain's enumeration against the XSD type's.
 *
 * @param same - Whether they agree.
 * @param reading - The reading that departs from the XSD here, if any.
 * @returns The status.
 */
const typeStatus = (same: boolean, reading: number | undefined): Status => {
  if (same) {
    return "G";
  }

  return reading === undefined ? "X" : "reading";
};

/**
 * The census of a declared attribute's enumeration against its domain's compiled pattern: every
 * XSD value is matched. That the pattern matches nothing else is the lexical oracle's, against
 * `xmllint`.
 *
 * @param base - The rule's place.
 * @param base.parent - The kind.
 * @param base.subject - The attribute.
 * @param base.version - The version.
 * @param domain - The grammar's domain.
 * @param theirs - The XSD type's values.
 * @param row - The declaration.
 * @returns The rule.
 */
const typeRule = (
  base: Pick<Rule, "parent" | "subject" | "version">,
  domain: ValueDomain,
  theirs: ReadonlySet<string>,
  row: AttributeDeclaration,
): Rule => {
  const pattern = new RegExp(domain.pattern, patternFlags);
  const refused = [...theirs].filter((value) => !pattern.test(value));
  const reading = readingDepartures.get(`attribute:type ${row.kind} ${row.name}`);
  const read = refused.length === 0 || reading === undefined ? "" : `; reading ${String(reading)}`;

  return {
    ...base,
    detail: `${String(theirs.size)} XSD values; refused [${refused.join(" ")}]${read}`,
    family: "attribute:type",
    owner: "ValueDomain pattern (enumeration)",
    status: typeStatus(refused.length === 0, reading),
  };
};

/**
 * The census of one declared attribute in one version: its admission, its enumeration and its use.
 *
 * @param index - The grammar's index.
 * @param row - The declaration.
 * @param version - The version.
 * @returns The rules.
 */
const attributeRules = (
  index: Index,
  row: AttributeDeclaration,
  version: SchemaVersion,
): readonly Rule[] => {
  const held = index.admitted.get(`${version} ${row.kind} ${row.name}`);
  const base = { parent: row.kind, subject: row.name, version };
  const refused = readingDepartures.get(`attribute:admission ${row.kind} ${row.name}`);
  const admission: Rule = {
    ...base,
    detail:
      held === undefined
        ? `not admitted${refused === undefined ? "" : `; reading ${String(refused)}`}`
        : `domain ${held.domain}`,
    family: "attribute:admission",
    owner: "AttributeAdmission",
    status: typeStatus(held !== undefined, refused),
  };
  if (held === undefined) {
    return [admission];
  }

  const domain = index.domains.get(held.domain);
  const theirs = enumerationOf(row.domain);
  const types =
    Option.isSome(theirs) && domain !== undefined
      ? [typeRule(base, domain, theirs.value, row)]
      : [];
  const key = `attribute:required ${row.kind} ${row.name}`;
  const status = useStatus(row.use, held.use, key);
  const requiredBy = readingDepartures.get(key);
  const uses: readonly Rule[] =
    row.use === "required" || held.use === "required"
      ? [
          {
            ...base,
            detail: `XSD ${row.use}; grammar ${held.use}${status === "P" ? `; ${planned.get(key) ?? ""}` : ""}${status === "reading" && requiredBy !== undefined ? `; reading ${String(requiredBy)}` : ""}`,
            family: "attribute:required",
            owner: "Required",
            status,
          },
        ]
      : [];

  return [admission, ...types, ...uses];
};

/**
 * The spelling a spec reading admits an attribute under beside a declared one, with its reading:
 * reading 10's `aria-keyshortcuts` beside `aria-keyshorts`.
 *
 * @param declared - The declared `version kind name` keys.
 * @param row - An admitted attribute.
 * @param row.kind - Its kind.
 * @param row.name - Its name.
 * @param row.version - Its version.
 * @returns The reading that admits it beside a name its kind declares, if one does.
 */
const spelledBy = (
  declared: ReadonlySet<string>,
  row: { readonly kind: string; readonly name: string; readonly version: string },
): number | undefined =>
  readingSpellings.find(
    (spelling) =>
      spelling.name === row.name && declared.has(`${row.version} ${row.kind} ${spelling.declared}`),
  )?.reading;

/**
 * The attributes the grammar admits that no declaration states and no wildcard of the kind admits,
 * the document layer's names aside: contradicted, or by a reading where a reading's second
 * spelling of a declared name explains it. On a kind the Schematron's extension rules cover, a
 * wildcard explains no name but the layer's `data-*` (spec reading 90).
 *
 * @param grammar - The grammar.
 * @param index - Its index.
 * @param declared - The declared `version kind name` keys.
 * @returns One rule per such attribute.
 */
const undeclaredRules = (
  grammar: ComposedGrammar,
  index: Index,
  declared: ReadonlySet<string>,
): readonly Rule[] => {
  const covered = coveredBy(grammar.kinds);

  return grammar.attributes.admission.rows.flatMap((row): readonly Rule[] => {
    const { version } = row;
    if (!grammar.kinds.versions.has(version)) {
      return [];
    }

    // A foreign element is assessed laxly against `xs:anyType`, whose attribute wildcard is a lax
    // `##any` (XML Schema 1.0 Part 1, §3.4.7).
    const wildcard = isForeignKind(row.kind)
      ? { namespace: "##any" as const }
      : attributeWildcards.find(
          ({ kind, versions }) => kind === row.kind && versions.includes(version),
        );
    const namespace = row.name.startsWith("xlink:") ? "http://www.w3.org/1999/xlink" : "";
    const viaWildcard =
      wildcard !== undefined &&
      !covered(version, row.kind) &&
      admits(wildcard.namespace, namespace, index.namespaces.get(row.kind) ?? "");
    if (
      declared.has(`${row.version} ${row.kind} ${row.name}`) ||
      isLayerName(row.name) ||
      viaWildcard
    ) {
      return [];
    }

    const reading = spelledBy(declared, row);

    return [
      {
        detail: `domain ${row.domain}${reading === undefined ? "" : `; reading ${String(reading)}`}`,
        family: "attribute:undeclared",
        owner: "AttributeAdmission",
        parent: row.kind,
        status: reading === undefined ? "X" : "reading",
        subject: row.name,
        version,
      },
    ];
  });
};

/**
 * The namespace of XML's own attributes, which `xml.xsd` declares globally.
 */
const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

/**
 * The attributes `xml.xsd` declares globally, which a wildcard that admits the XML namespace
 * admits on its kind.
 */
const xmlGlobals = ["xml:base", "xml:id", "xml:lang", "xml:space"] as const;

/**
 * The census of the attribute wildcards that admit the XML namespace: each admits `xml.xsd`'s four
 * global attributes on its kind (validated against their declarations under `lax` and `strict`,
 * unvalidated under `skip`), so `AttributeAdmission` must hold each; but on a kind the
 * Schematron's extension rules cover, spec reading 90 admits only those the kind declares, so a
 * name it does not declare is held by the reading when the grammar refuses it.
 *
 * @param grammar - The grammar.
 * @param index - Its index.
 * @param declared - The declared `version kind name` keys.
 * @returns One rule per (version, kind, name).
 */
const wildcardXmlRules = (
  grammar: ComposedGrammar,
  index: Index,
  declared: ReadonlySet<string>,
): readonly Rule[] => {
  const covered = coveredBy(grammar.kinds);

  return attributeWildcards.flatMap((wildcard) =>
    admits(wildcard.namespace, xmlNamespace, index.namespaces.get(wildcard.kind) ?? "")
      ? wildcard.versions.flatMap((version) =>
          xmlGlobals.map((name): Rule => {
            const held = index.admitted.has(`${version} ${wildcard.kind} ${name}`);
            const refused =
              covered(version, wildcard.kind) &&
              !declared.has(`${version} ${wildcard.kind} ${name}`);
            const status = ((): Status => {
              if (refused) {
                return held ? "X" : "reading";
              }

              return held ? "G" : "X";
            })();

            return {
              detail: `${wildcard.namespace} ${wildcard.processing}; ${held ? "admitted" : "not admitted"}${refused ? "; reading 90" : ""}`,
              family: "attribute:wildcard",
              owner: "AttributeAdmission (the document layer's xml: names)",
              parent: wildcard.kind,
              status,
              subject: name,
              version,
            };
          }),
        )
      : [],
  );
};

/**
 * The census of spec reading 90 on each (version, kind) the Schematron's extension rules cover:
 * every name `AttributeAdmission` holds there is one the kind declares, `data-*`, an `xsi:` name,
 * or a reading's second spelling of a declared name (reading 10). Any other is a name the reading
 * refuses that the grammar admits.
 *
 * @param grammar - The grammar.
 * @param declared - The declared `version kind name` keys.
 * @returns One rule per covered (version, kind).
 */
const extensionRules = (
  grammar: ComposedGrammar,
  declared: ReadonlySet<string>,
): readonly Rule[] => {
  const covered = coveredBy(grammar.kinds);
  const byKind = Map.groupBy(
    grammar.attributes.admission.rows.filter(({ kind, version }) => covered(version, kind)),
    ({ kind, version }) => `${version} ${kind}`,
  );

  return [...byKind.values()].flatMap((rows): readonly Rule[] => {
    const [first] = rows;
    if (first === undefined || !grammar.kinds.versions.has(first.version)) {
      return [];
    }

    const extra = rows
      .filter(
        (row) =>
          !declared.has(`${row.version} ${row.kind} ${row.name}`) &&
          row.name !== "data-*" &&
          !row.name.startsWith("xsi:") &&
          spelledBy(declared, row) === undefined,
      )
      .map(({ name }) => name);

    return [
      {
        detail: `${String(rows.length)} names; beyond the reading [${extra.join(" ")}]`,
        family: "attribute:extension",
        owner: "AttributeAdmission (reading 90, compose.ts coveredBy)",
        parent: first.kind,
        status: extra.length === 0 ? "G" : "X",
        subject: first.kind,
        version: first.version,
      },
    ];
  });
};

/**
 * The census of the spec readings: each reading's entry, reading 15's status read from the grammar
 * (its attribute's domain), every other's as recorded.
 *
 * @param index - The grammar's index.
 * @returns One rule per reading.
 */
const readingRules = (index: Index): readonly Rule[] => {
  const variableRef = index.admitted.get("3.0.1 qti-outcome-declaration variable-identifier-ref");

  return [...readings].map(([reading, entry]): Rule => {
    const fifteen = reading === 15;
    const resolved = fifteen && variableRef !== undefined && !/idref/iu.test(variableRef.domain);

    return {
      detail: fifteen ? `domain ${variableRef?.domain ?? "none"}` : "",
      family: "reading",
      owner: entry.owner,
      parent: "",
      status: resolved ? "G" : entry.status,
      subject: String(reading),
      version: "both",
    };
  });
};

/**
 * Take the census of the XSD rules and spec readings against a composed grammar.
 *
 * @param grammar - The composed grammar.
 * @returns Every rule, identical rules of both versions merged.
 */
export const census = (grammar: ComposedGrammar): readonly Rule[] => {
  const index = indexOf(grammar);
  const declared = new Set(
    attributeDeclarations.flatMap((row) =>
      row.versions.map((version) => `${version} ${row.kind} ${row.name}`),
    ),
  );

  return merged([
    ...contentModels.flatMap((model) =>
      model.versions.flatMap((version) => modelRules(index, model, version)),
    ),
    ...countsBeyond(grammar),
    ...attributeDeclarations.flatMap((row) =>
      row.versions.flatMap((version) => attributeRules(index, row, version)),
    ),
    ...undeclaredRules(grammar, index, declared),
    ...wildcardXmlRules(grammar, index, declared),
    ...extensionRules(grammar, declared),
    ...textTypes.flatMap((row) =>
      row.versions.map((version): Rule => {
        const held = index.texts.has(`${version} ${row.kind}`);

        return {
          detail: held ? "TextDomain row" : "no TextDomain row",
          family: "text:domain",
          owner: "TextDomain",
          parent: row.kind,
          status: held ? "G" : "U",
          subject: row.kind,
          version,
        };
      }),
    ),
    ...readingRules(index),
  ]);
};

/**
 * The census's counts: per family and status, and the rules that are contradicted or unowned.
 */
export interface Counts {
  readonly byFamily: Readonly<Record<string, Partial<Readonly<Record<Status, number>>>>>;
  readonly total: number;
  readonly unowned: number;
}

/**
 * Count a census by family and status.
 *
 * @param rules - The census.
 * @returns The counts.
 */
export const countsOf = (rules: readonly Rule[]): Counts => {
  const byFamily: Record<string, Partial<Record<Status, number>>> = {};
  for (const rule of rules) {
    const family = byFamily[rule.family] ?? {};
    family[rule.status] = (family[rule.status] ?? 0) + 1;
    byFamily[rule.family] = family;
  }

  return {
    byFamily,
    total: rules.length,
    unowned: rules.filter(({ status }) => status === "U").length,
  };
};
