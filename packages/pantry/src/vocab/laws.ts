/**
 * The law catalog: every law's name, the rule its refusal keeps, the source its statement comes
 * from, and the precedence among the rules. It is data and holds no judgment, so the importer and
 * the law oracle both read it and neither reads the other: the importer states each law in its
 * schema module, and the oracle judges each by its own host predicate (`src/grammar/purity.test.ts`
 * holds the oracle to reading no statement of the schema or the importer).
 */

/**
 * Every rule a law keeps or will keep, most specific first: the order `ruleOfLaws`
 * (`#pantry/import/refusal.ts`) picks a refusal's rule by when one PostgreSQL object discharges
 * several laws.
 *
 * The tiers run from QTI's own rules to the representation's:
 *
 * 1. QTI's information model, its overlays O1 to O7 in the plan's order (§1.7), then packaging's P1 to
 *    P4 (§1.6);
 * 2. The embedded languages' readings (MathML, SSML);
 * 3. XML Schema's assessment of an element's governing type, its attributes and its text;
 * 4. The content model: the ancestry bans, the nearest interaction, then the automaton's order, the
 *    counts it relaxes, the family's end and admission;
 * 5. The document layer: the stated bound on a key's text, foreign names, derived fields and the tree.
 *
 * A specific law says what in the content to change, and a general one only that the representation
 * broke, so a QTI rule wins over a tree law and a content-order law over a family law. The rules
 * `owedRules` (`#pantry/import/refusal.ts`) lists stand at their tier already, so the order holds
 * when their laws land.
 */
export const precedence = [
  // O1, identity.
  "document-key",
  "idref-target",
  "table-headers",
  "label-tool",
  "card-support",
  "card-default",
  "document-lang",
  // O2, declarations.
  "declaration-key",
  "declaration-reserved",
  "reserved-type",
  "declaration-type",
  "value-cardinality",
  "typed-copy",
  "mastery-range",
  // O3, interactions.
  "binding-declared",
  "binding-fit",
  "record-binding-fit",
  "binding-unique",
  "choice-bounds",
  "choice-identifier-distinct",
  "hotspot-default",
  "feedback-ref",
  "template-ref",
  "printed-variable-ref",
  "context-variable-ref",
  "pci-module-source",
  "slider-bounds",
  "max-strings-required",
  "aria-value-range",
  "varref-copy",
  "adaptive-feedback",
  // HTML content.
  "source-srcset",
  "source-src",
  "track-srclang",
  "q-punctuation",
  // O4, expressions.
  "P2",
  "P8",
  "P10",
  "P36",
  "prefixed-ref",
  "variable-kind",
  "P20",
  "P21",
  "P22",
  "P23",
  "P24",
  "P25",
  "P26",
  "P27",
  "P29",
  "item-duration",
  // O5 to O7: mapping, metadata, tests.
  "mapping-base-type",
  "lookup-cardinality",
  "map-key-unique",
  "lom-identifier",
  "lom-title",
  "lom-learning-resource-type",
  "selection-bounds",
  "selection-required",
  "structure-identifier",
  "test-name-key",
  "section-identifier-target",
  "branch-target",
  "branch-forward",
  "stimulus-ref-key",
  "variable-mapping-target",
  "variable-mapping-source",
  "template-default-target",
  "item-ref-target",
  "stimulus-ref-target",
  "include-target",
  "include-root",
  "inclusion-cycle",
  // P1 to P4, packaging.
  "root-type-reverse",
  "entry-kind",
  "file-listed",
  "file-exists",
  "href-listed",
  "self-dependency",
  "manifest-id-space",
  // The embedded languages.
  "math-arity",
  "ssml-fragment",
  "include-href",
  // XML Schema's assessment.
  "xsi-type",
  "required-attribute",
  "attribute-count",
  "attribute-lexical",
  "text-copy",
  "attribute-admission",
  // The content model.
  "ancestry-ban",
  "owner-copy",
  "ordering",
  "child-set",
  "union-count",
  "admission",
  // The document layer: its stated limit, then its laws.
  "key-text-bound",
  "href-form",
  "fragment-context",
  "namespace-name",
  "well-formedness",
  "unmodeled-vocabulary",
  "derived",
  "reachability",
] as const;

/**
 * A law's rule and where its statement comes from: a reading of `docs/spec-readings.md`, an XML
 * Schema or XSD anchor, a specification section, or the design document a structural law follows.
 */
interface LawEntry {
  readonly rule: (typeof precedence)[number];
  readonly source: string;
}

/**
 * Every law the schema states, by name, with the rule its refusal keeps and its spec source: the
 * one statement of both, which the importer's refusals (`#pantry/import/refusal.ts`) and the law
 * oracle's verdicts (`#pantry/test/oracle.ts` `ruleOf`, `lawSources`) read alike.
 *
 * The oracle states a host predicate for most of them, under the same name. The rest are the laws
 * the oracle states none for: the tree as grizzle states it, the package's structure, the overlays'
 * reachability and the variable reference copy.
 */
export const lawTable = {
  "AL1 admission": {
    rule: "attribute-admission",
    source:
      "the XSDs' attribute declarations and wildcards as AttributeAdmission (fin.md D2); reading 13 for data-*, reading 47 for xsi:; and the declarations readings refuse (attributes.ts readingRefusals): 9 (role on source, the Schematron's RULE ARIA ROLE 1a) and 85 (xi:include's xpointer)",
  },
  "AL1 owner": {
    rule: "attribute-admission",
    source: "fin.md §16, the attribute family's owner copy (kind, version, document)",
  },
  "AL2 count": {
    rule: "attribute-admission",
    source: "fin.md §16, the attribute family's count",
  },
  "AL2 distinct": {
    rule: "attribute-admission",
    source:
      "XML 1.0 §3.1, WFC Unique Att Spec, by position (fin.md §16, masked by the open classes, D2)",
  },
  "AL2 fold": {
    rule: "attribute-admission",
    source: "fin.md §16, attrs = attrsWas | bit(position)",
  },
  "AL2 last slot": {
    rule: "attribute-admission",
    source: "fin.md §16, the attribute family's end value",
  },
  "AL3 required": {
    rule: "required-attribute",
    source:
      "the XSDs' use=\"required\", and reading 123: https://www.imsglobal.org/spec/qti/v3p0/info#Data_BDO (§5.11: 'Authors must specify the dir attribute on this tag'), where the XSD declares bdo's dir optional (attributes.ts readingUses): AttributeAdmission's use side (Required)",
  },
  "AL4 data name": {
    rule: "attribute-admission",
    source:
      "reading 13 of docs/spec-readings.md: HTML's custom data attribute rule read in XML (https://html.spec.whatwg.org/multipage/dom.html#custom-data-attribute: a name in no namespace that starts with data-, has at least one character after the hyphen, is a valid attribute local name and contains no ASCII upper alphas) and the information model's prose (dataExtension): a data-* attribute's name is in that language, and a no-namespace name of an element that is not foreign never begins data- (vocab/open.ts dataName, attributes.ts AL4_data_name)",
  },
  "AL4 declared data name": {
    rule: "attribute-admission",
    source:
      "goal part E: a data- name QTI declares is that attribute, never a custom one; reading 13",
  },
  "AL4 open name key": {
    rule: "attribute-admission",
    source: "fin.md D2, an open-class attribute keeps its exact name; reading 13",
  },
  "AL4 open names": {
    rule: "attribute-admission",
    source: "fin.md D2, an open-class attribute keeps its exact name; reading 13",
  },
  "AL5 attribute count": {
    rule: "attribute-count",
    source:
      "readings 41 and 43 (attributes.ts attributeCounts): https://www.w3.org/TR/speech-synthesis11/#S3.1.6 (SSML 1.1 §3.1.6, meta: 'Either a name or http-equiv attribute is required. It is an error to provide both name and http-equiv attributes'); https://www.w3.org/TR/speech-synthesis11/#S3.2.1 and #S3.2.4 (§3.2.1, voice, and §3.2.4, prosody: 'Although each attribute individually is optional, it is an error if no attributes are specified'), counting what §2.2.1's fragment removal keeps: SSML's own attributes, xml:lang and xml:base",
  },
  "Adaptive feedback": {
    rule: "adaptive-feedback",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_FeedbackBlock (§5.49, FeedbackBlock, and §5.52, FeedbackInline: 'A feedback element that forms part of a Non-adaptive Item must not contain an interaction object, either directly or indirectly'), plan §1.7 O3 (Q5.09): a non-adaptive item binds no response variable whose interaction stands inside feedback, select(BoundVariable, response, adaptive = false) contained in the interactions outside every feedback flag",
  },
  "AreaMapping base type": {
    rule: "mapping-base-type",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_AreaMapping (§5.5, the AreaMapping class: 'A special class used to create a mapping from a source set of point values to a target set of float values'): an area mapping's response declaration is of base type point (mapping.ts AreaMapping_base_type)",
  },
  "Aria value range": {
    rule: "aria-value-range",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ARIABase.Attr_aria-valuemax (§5.2.31, and §7.1.31 of ARIABaseEmpty: 'Authors MUST ensure the value of 'aria-valuemax' is greater than or equal to the value of 'aria-valuemin''), both read as xs:decimal, as the XSD types them (interactions.ts AriaRange); reading 91 makes the MUST a law",
  },
  Arity: {
    rule: "P2",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Abstract_ExpressionGroup (§6.9, ExpressionGroup: each operator's attribute is of a container class whose logic attribute's multiplicity is its sub-expression count, §5.83.1 Logic0toMany '[0.. unbounded]', §5.84.1 Logic1toMany and §5.94.1 NumericLogic1toMany '[1.. unbounded]', §5.85.1 LogicPair '[2]' and §5.86.1 LogicSingle '[1]', or of its own class, whose logic attribute states its count, as §5.113.2 Repeat's '[1.. unbounded]' with §5.113's 'The repeat operator takes one or more sub-expressions', over §6.9.49's '0 or more'; a leaf class's children row reads 'There are no children.'; as §6.9.21, https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-match, 'The match operator takes two sub-expressions') (expression.ts OperatorArity); reading 21",
  },
  "Attribute prefix": {
    rule: "attribute-admission",
    source:
      "reading 47 (an xsi: attribute is exported byte for byte, C54), with https://www.w3.org/TR/xml-names/#ns-decl (Namespaces in XML 1.0 §3: 'The prefix xml is by definition bound to the namespace name http://www.w3.org/XML/1998/namespace … Other prefixes MUST NOT be bound to this namespace name'; 'The prefix xmlns is used only to declare namespace bindings') and https://www.w3.org/TR/xml-names/#defaulting (§6.2: 'The namespace name for an unprefixed attribute name always has no value'): every attribute keeps the prefix its name is written with, empty for a name in no namespace, xml for the XML namespace's, and neither empty, xml nor xmlns for an xsi:, xlink: or namespaced open name (attributes.ts Attribute_prefix)",
  },
  "AttributeEntity owner": {
    rule: "attribute-lexical",
    source: "XML 1.0 §4.1 (entity references in attribute values), kept unexpanded (plan §1.4)",
  },
  "Binding cardinality": {
    rule: "binding-fit",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ChoiceInteraction.Attr_max-choices (§5.30.2: 'If max-choices is greater than 1 (or 0) then the interaction must be bound to a response with multiple cardinality'), and the same sentence of max-choices (§5.66.1, §5.68.2, §5.107.3, §5.128.2) and max-associations (§5.8.2, §5.57.3, §5.59.2, §5.60.2, §5.89.2), reading 92; the Schematron's RESPONSEDEC rule 2 is the choice interaction's case; a most left unwritten reads its XSD default",
  },
  "Binding declared": {
    rule: "binding-declared",
    source:
      "reading 75: https://www.imsglobal.org/spec/qti/v3p0/info#Data_ResponseDeclaration (§5.115: 'Response variables are declared by response declarations and bound to interactions in the itemBody'), https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_BasePromptInteraction.Attr_response-identifier (§5.15.7, and §5.18.6, §5.19.6, §5.45.1 and §5.162.1, each of multiplicity [1]: 'The response variable associated with the interaction') and each interaction class's binding sentence, as https://www.imsglobal.org/spec/qti/v3p0/info#Data_ChoiceInteraction (§5.30: 'The ChoiceInteraction must be bound to a response variable with a base-type of identifier and single or multiple cardinality'): an interaction's response-identifier names a response declaration of its item; the text entry interaction's response-identifier is the XSD's IDREF (reading 14), every other interaction's, the extended text interaction's among them, an IdentifierDType this law resolves",
  },
  "Binding unique": {
    rule: "binding-unique",
    source:
      "reading 92: https://www.imsglobal.org/spec/qti/v3p0/info#Data_ResponseDeclaration (§5.115: 'Each response variable declared may be bound to one and only one interaction'): no two interactions of an item name one response variable",
  },
  BindingFit: {
    rule: "binding-fit",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Main2p4 (§2.4, each interaction's 'must be bound to a response variable with a base-type of … and … cardinality', as §2.4.1.1 https://www.imsglobal.org/spec/qti/v3p0/info#ChoiceInt) (expression.ts BindingFit)",
  },
  "Branch forward": {
    rule: "branch-forward",
    source:
      "reading 87: https://www.imsglobal.org/spec/qti/v3p0/info#Data_BranchRule (§5.23: 'the test jumps forward to the item, section or part referred to by the target identifier', 'the target must refer to an item or section in the same test-part that has not yet been presented'): a target lies after its source's end in the assembled test, unless the section that orders the two shuffles (§5.98: the child elements of an invisible section not kept together 'are mixed into the parent's selection prior to shuffling'); fixed is not read, a recorded limit (tests.ts Branch_forward)",
  },
  "Branch target": {
    rule: "branch-target",
    source:
      "reading 87: https://www.imsglobal.org/spec/qti/v3p0/info#Data_BranchRule (§5.23: 'In the case of an item or section, the target must refer to an item or section in the same test-part … For test-parts, the target must refer to another test-part'; §5.23.1, the reserved EXIT_SECTION, EXIT_TESTPART and EXIT_TEST), §7.5 ('branching rules should treat referred sections as leaf nodes') and §5.98 ('It is therefore an error to make such an item the target of a branch-rule', of an item a selection with replacement can repeat): a target is an exit, or a part of its source's kind in its source's test part, in an instance that holds its source's, never a replaceable item ref (tests.ts Branch_target)",
  },
  "Card default entry": {
    rule: "card-default",
    source:
      "reading R9-a: https://www.imsglobal.org/spec/qti/v3p0/info#Data_CardEntry (§5.27.2, CardEntry's default: 'Only one of the CardEntry instances can have a default designation'): a card holds at most one entry whose default, an xs:boolean collapsed, is true or 1 (catalog.ts DefaultEntry)",
  },
  "Card support": {
    rule: "card-support",
    source:
      "reading R9-a: https://www.imsglobal.org/spec/qti/v3p0/info#Data_Card (§5.26.1, Card's support: 'Use only one card for any particular named support in a catalog'): a catalog holds one card for each support, compared by its collapsed value (catalog.ts CardSupport)",
  },
  "Catalog reference": {
    rule: "idref-target",
    source:
      "reading R9-a: https://www.imsglobal.org/spec/qti/v3p0/info#Data_Catalog (§5.28.1, a catalog's id, which §5.15.9's data-catalog-idref names): a data-catalog-idref, an xs:IDREF collapsed, is the id of a qti-catalog of its document, and no other ID of it (catalog.ts CatalogRef, CatalogId)",
  },
  "Choice bounds": {
    rule: "choice-bounds",
    source:
      "reading 76: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ChoiceInteraction.Attr_min-choices (§5.30.3: 'min-choices must be less than or equal to the limit imposed by max-choices'; §5.30.2: 'If max-choices is 0 then there is no restriction'), the same sentence for min-associations (§5.8.3, §5.57.2, §5.59.1, §5.60.1, §5.89.3), match-min (§5.7.9, §5.56.6, §5.58.6, §5.131.7), min-choices (§5.66.2, §5.68.1, §5.107.2, §5.128.1) and min-strings (§5.48.7, with reading 53's 0); reading 18: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_OrderInteraction.Attr_max-choices (§5.97.3, and §5.61.2 of the graphic order interaction: 'Used in conjunction with min-choices, if specified, max-choices must be greater than or equal to min-choices and must not exceed the number of choices available'; §5.97.2, §5.61.1: min-choices 'must not exceed the number of choices available. If unspecified, all of the choices must be ordered and max-choices is ignored'), with no 0 exemption, read only where min-choices is written (references.ts ChoiceBound's counted zero and ChoiceCount); the media interaction's plays by reading 9, the Schematron's rule 13Ba read by intent, max-plays 0 no limit (§5.92.3)",
  },
  "Choice identifier key": {
    rule: "choice-identifier-distinct",
    source:
      'reading 104: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_SimpleChoice.Attr_identifier (§5.132.1, and §5.7.1, §5.55.1, §5.56.1, §5.58.1, §5.65.1, §5.67.1, §5.73.1 and §5.131.1: \'This identifier must not be used by any other choice or item variable\', each class naming its own noun) and https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Identifier (§7.16: an identifier is \'a logical reference to another object in the item, such as an itemVariable or choice\'): no two choices of one kind in a document share an identifier, whichever interactions hold them, nor two hottexts of a document, compared collapsed (interactions.ts key(on(Choice, "document", "kind", "identifier")) and key(on(Hottext, "document", "identifier")))',
  },
  "Choice not variable": {
    rule: "choice-identifier-distinct",
    source:
      "reading 104: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_SimpleChoice.Attr_identifier (§5.132.1 and the other choice classes' identifier: 'This identifier must not be used by any other choice or item variable'), https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Variable (§7.47: a variable is one 'declared in a corresponding variable declaration or is one of the built-in variables'), https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ResponseDeclaration.Attr_identifier (§5.115.1, and §4.5.1 and §5.151.1: 'The identifiers of the built-in session variables are reserved. They are completionStatus, numAttempts and duration') and https://www.imsglobal.org/spec/qti/v3p0/info#Data_ContextDeclaration (§5.34: 'There is one built-in context variable named \"QTI_CONTEXT\" with record cardinality'): no choice or hottext bears the identifier of a declaration of its document, nor in an item that of a built-in variable, compared collapsed (interactions.ts ChoiceVariableName, Choice_not_variable)",
  },
  "Condition type": {
    rule: "P21",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_ResponseCondition_qti-response-if (§5.114.1, and §5.114.2 and §5.117 of the response branches, §5.99.1, §5.99.2 and §5.101 of the outcome branches, and §5.149.1, §5.149.2 and §5.154 of the template branches: each 'consists of an expression which must have an effective base-type of boolean and single cardinality'), and https://www.imsglobal.org/spec/qti/v3p0/info#Data_TemplateConstraint (§5.150: 'A templateConstraint contains an expression which must have an effective base-type of boolean and single cardinality') (expressions.ts Condition_type; the old checker's P21)",
  },
  "Context variable reference": {
    rule: "context-variable-ref",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_PortableCustomInteraction_qti-context-variable (§5.106.6: 'This allows an item author to bind a context variable to the PCI instance'), https://www.imsglobal.org/spec/qti/v3p0/info#Data_ContextDeclaration (§5.34: 'Context variables, variables declared by context declarations', and 'There is one built-in context variable named \"QTI_CONTEXT\" with record cardinality') and the Schematron's rule 20Ba (reading 9): a PCI's qti-context-variable names QTI_CONTEXT or a declared context variable (references.ts ContentReference)",
  },
  "Custom interaction version": {
    rule: "admission",
    source:
      "R10-b: https://www.imsglobal.org/spec/qti/v3p0/info#Data_PortableCustomInteraction (§5.106, 3.0.0: 'PCIs MUST be used instead of custom interactions (the latter have been deprecated)', a sentence the 3.0.1 text drops): a 3.0.0 document holds no qti-custom-interaction, and a 3.0.1 document may (interactions.ts Custom_interaction_version)",
  },
  "Declaration base type": {
    rule: "declaration-type",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_base-type (§4.5.3, and §5.34.3, §5.115.3, §5.151.3: 'The value space from which the variable's value can be drawn (or in the case of containers, from which the individual values are drawn) is identified with a base-type', 'Variables with record cardinality have no base-type'): a record declares no base type (BaseType none), and every other variable declares one",
  },
  "Declaration key": {
    rule: "declaration-key",
    source:
      "reading 74: https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_identifier (§4.5.1, and §5.34.1, §5.115.1, §5.151.1: 'All item variables declared in an item share the same namespace'); a response's and a context's identifier is a UniqueIdentifier (§5.115.1, §5.34.1; §7.43: 'unique within the scope of the instance'), though the 3.0.1 XSD types the context's an IdentifierDType, an xs:NCName, so DocumentId key counts it among the IDs",
  },
  "Declaration not reserved": {
    rule: "declaration-reserved",
    source:
      "reading 72: https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_identifier (§4.5.1, §5.115.1, §5.151.1: 'The identifiers of the built-in session variables are reserved. They are completionStatus, numAttempts and duration'), each spelled exactly, with no alias, the identifier compared collapsed (references.ts BuiltInVariable, its session variables); the context variable QTI_CONTEXT is Reserved type's",
  },
  "Declaration overlay": {
    rule: "reachability",
    source:
      "plan §1.7 O2 and the W5 amendment's C18: each O2 overlay (Declaration, ValueSet, Value, RecordField, OutcomeRange) is its element's row, keyed by its node: it copies its node's nodeRef tuple and takes its values from its element's attributes and Node's string value, a value set copies its declaration through declarationRef, and every value set and value has its row (Q5.08)",
  },
  "Dependency target": {
    rule: "idref-target",
    source:
      'IMS Content Packaging 1.2: a dependency\'s identifierref names a resource of its manifest, contained(on(Dependency, "package", "ref"), on(Resource, "package", "identifier")) (Q5.06)',
  },
  Document: {
    rule: "reachability",
    source: "the XDM document node as the Document row (plan §1.4, fin.md D7)",
  },
  "Document entry": {
    rule: "entry-kind",
    source:
      "IMS Content Packaging 1.2: a listed document is an entry of the package, and one document: a resource names the document at its href, read as a document of its type (reading 93), so no path is listed as documents of two types (qti/package.ts, Document's key over package and path); and https://www.imsglobal.org/spec/qti/v3p0/info#Derived_AssessmentSectionRef (§7.5: a section ref 'functions as a facade for the qti-assessment-section to which it refers'): a section ref's href names a section document the package lists, its path an entry (qti/tests.ts sectionRefPaths)",
  },
  "Document lang": {
    rule: "document-lang",
    source:
      "https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.1.3, Language: 'There must be one value for each of the languages referred to by the language attributes on the associated assessmentItem, test or object bank and its 'bodyElements'', normative by its §1.2; ~/.cache/gr8des/qti-md-bind/index.txt:1509 and :388): each language an item's or a test's xml:lang states (XML 1.0 §2.12, the empty one stating none) is listed by every general category of each record of the resource whose href names the document (identity.ts documentLang, through metadata.ts LomObject); xml:lang compared by its collapsed xs:language value and the LOM language as written, both as tags without regard to case (RFC 5646 §2.1.1); reading R9-c: a catalog is outside the content body (information model §5.28: 'outside the content body node'), so the xml:lang of a catalog's cards, entries and HTML content is not counted (identity.ts CatalogScope)",
  },
  "DocumentId key": {
    rule: "document-key",
    source:
      "XML Schema Part 1, Validation Rule: Validation Root (the ID/IDREF table): no id's [binding] has more than one member, an attribute's binding its element, an ID-typed element text's its parent (§3.15.5; reading 101; identity.ts IdBinding); reading 14; reading 74: a context declaration's identifier, a UniqueIdentifier (https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ContextDeclaration.Attr_identifier, §5.34.1), is one of the document's IDs, though the 3.0.1 XSD types it an IdentifierDType",
  },
  "E1 derived": {
    rule: "derived",
    source:
      "fin.md §17, E1: the fields closed relations determine, and the string value (folds.ts)",
  },
  "Entry family": {
    rule: "reachability",
    source:
      "plan §1.6: the package's entries in listing order, an ordered family under Package at entries, one entry per path; the record the model is rebuilt from",
  },
  "Equal tolerance": {
    rule: "P36",
    source:
      "reading 121: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Equal.Attr_tolerance (§5.46.2: 'If the tolerance mode is absolute or relative then the tolerance must be specified. The tolerance consists of two positive numbers, t0 and t1, that define the lower and upper bounds. If only one value is given it is used for both') and #DataModel_ToleranceList (§9.1.5: 'a space separated list of either strings (must not contain a space) or numbers'): a qti-equal whose tolerance-mode is absolute or relative writes tolerance, every tolerance holds one or two values, and each value in xs:double's lexical space is above 0, a string naming a variable read at run time (operators.ts Tolerance, toleranceRequired, Equal_tolerance)",
  },
  "Feedback outcome type": {
    rule: "feedback-ref",
    source:
      "reading 77: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_FeedbackBlock.Attr_outcome-identifier (§5.49.1, and §5.52.1, §5.93.1, §5.148.1, §5.157.2: 'The identifier of an outcome variable that must have a base-type of identifier and be of either single or multiple cardinality'); the built-in completionStatus is 'a single identifier' (§2.2.2.3)",
  },
  "Feedback reference": {
    rule: "feedback-ref",
    source:
      "reading 77: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_FeedbackBlock.Attr_outcome-identifier (§5.49.1, and §5.52.1, §5.93.1, §5.148.1, §5.157.2: 'The identifier of an outcome variable that must have a base-type of identifier and be of either single or multiple cardinality'), the built-in completionStatus among them (§2.2.2.3: 'a single identifier'); the outcome's base type and cardinality are Feedback outcome type's (references.ts ContentReference)",
  },
  "File exists": {
    rule: "file-exists",
    source:
      "imscp_infov1p2pd2.txt:409 and :411 (IMS Content Packaging 1.2, InterchangePackage (b): 'Any file described in the Manifest using a URI that resolves to a location within the InterchangePackage shall be included in the InterchangePackage'; (d): 'When a file contained in an InterchangePackage references another file using a URI that resolves to a location within the InterchangePackage, the referenced file shall be described in the InterchangePackage's Manifest'): a cp:file's href that resolves in the package names an entry, an external one left out (reading 35), and so does each reference a document resolves in the package (readings 102 and 103, package.ts ReferencePath), and each card file and resource icon a document resolves in the package (reading R9-b, package.ts TextReferencePath)",
  },
  "File listed": {
    rule: "file-listed",
    source: "IMS Content Packaging 1.2 and QTI packaging: every file is described; reading 33",
  },
  "Foreign attribute class": {
    rule: "attribute-admission",
    source:
      "XML Schema 1.0 Part 1 §3.10.4 (Wildcard allows Namespace Name), with Namespaces in XML 1.0 §2 for the absent namespace: an open attribute's class agrees with its stored namespace against its element's",
  },
  "Foreign element class": {
    rule: "unmodeled-vocabulary",
    source:
      "XML Schema 1.0 Part 1 §3.10.4 (Wildcard allows Namespace Name), with Namespaces in XML 1.0 §2 for the absent namespace: a foreign element's class agrees with its stored namespace against its parent's; and Namespaces in XML 1.0 §5 (Namespace constraint: No Prefix Undeclaring) with §6.2, a name in no namespace is unprefixed, so a no-namespace element is written with no prefix (C4)",
  },
  "Foreign simple content": {
    rule: "child-set",
    source:
      "reading 60: https://www.w3.org/TR/xmlschema-1/#cvc-type (XML Schema 1.0 Part 1 §3.3.4, Element Locally Valid (Type), clause 3.1.2: an element a simple type governs holds no element child), over each foreign element whose xsi:type names a simple type (attributes.ts Governor, TypeText); its attributes are AL1's under the governor, the four xsi: names alone (clause 3.1.1), and its text TextDomain's under the type (clause 3.1.3)",
  },
  "Fragment context": {
    rule: "fragment-context",
    source:
      "reading 117: https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_FlowGroup_include (§6.15.8, and the include attribute of each class §9.4.1 lists: 'This provides the insertion of markup from external files. … When using XML this is achieved using the 'XInclude' approach') and https://www.w3.org/TR/xinclude-11/#creating-result (XInclude 1.1 §4.7: 'The result infoset is a copy of the source infoset, with each xi:include element processed as follows'): an included fragment's content is judged in place, as the including document's result infoset holds it; it is one written element per node, judged under the union of the ancestries of the includes that place it and under one nearest interaction; a fragment two includes place inside different interactions, or one inside an interaction and one outside, would need two rows per node, so it is refused: a stated limit of the representation, not a law of the specification",
  },
  "Graphic gap match default hotspot": {
    rule: "hotspot-default",
    source:
      "reading 80: https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_GraphicGapMatchInteraction_qti-associable-hotspot (§5.60.9: 'The default hotspot must not be defined')",
  },
  "Href form": {
    rule: "href-form",
    source:
      "reading 102 (overlays/package.ts Limit): every href is resolved before its row is written, its value read by its whitespace class, its path merged with the xml:base in scope or its document's path, its dot segments removed and each segment percent-decoded (RFC 3986 §2.1, §5.2 and §6.2.2.2); a path with a scheme, a leading /, a climb above the package root or an external base is external (reading 35), admitted and never resolved where a cp:file or a content reference holds it, and refused where a law needs the href to name an entry; an empty path names its own document (§4.4). What stays refused is a stated limit of the representation, not a law of the specification: a % that starts no percent-encoding, octets that spell no UTF-8, a segment that decodes to / or U+0000, a backslash, a tab, line feed or carriage return a preserving type keeps, a : in the first segment of a path with no scheme, and a srcset of more than one candidate or with a descriptor",
  },
  "Href listed": {
    rule: "href-listed",
    source:
      "imscp_infov1p2pd2.txt:770 (IMS Content Packaging 1.2, §6.6.2: 'A file reference declared in a Resource{ Href } shall have an associated declaration in a File object in the same Resource'): a resource href names the file one of its own files names, compared by resolved path in the package and as written outside it, its launch parameters aside (reading 102)",
  },
  "Idref target": {
    rule: "idref-target",
    source:
      "XML Schema Part 1, Validation Rule: Validation Root (the ID/IDREF table): an IDREF names an ID of its document, an attribute's tokens and an IDREF- or IDREFS-typed element text's alike (§3.15.5; reading 101); reading 14; reading 2 and https://www.w3.org/TR/MathML3/chapter4.html#contm.share (MathML 3 §4.2.7: a share's src names 'the id attribute of the root node of the expression tree' it stands for): a same-document fragment of an m:share's src, a # and the characters after it, names an ID of its document as an IDREF token does, and a src that is no fragment is reading 103's file reference, which is not read here (operator decision 321)",
  },
  "Include fragment identifier": {
    rule: "include-href",
    source:
      "reading 115: https://www.w3.org/TR/xinclude-11/#include_element (XInclude 1.1 §3.1, href: 'Fragment identifiers must not be used; their appearance is a fatal error'): an xi:include's href carries no #, wherever it stands after the path",
  },
  "Include root": {
    rule: "include-root",
    source:
      "reading 114: https://www.imsglobal.org/spec/qti/v3p0/info#Imported_Include (§9.4.1, Include's parent classes, and 'This denotes the use of the XInclude feature [XInclude, 16]'), https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_FlowGroup_include (§6.15.8 and its siblings: 'This provides the insertion of markup from external files') and https://www.w3.org/TR/xinclude-11/#docii (XInclude 1.1 §4.2.1: an included document's 'set of top-level included items is the children of the acquired infoset's document information item'): an include under a parent whose model holds one stands for its fragment's root, which is one of its particle's choice-group alternatives, a kind whose position the parent's automaton follows and ends on as the include's",
  },
  "Include target": {
    rule: "include-target",
    source:
      "reading 115: https://www.imsglobal.org/spec/qti/v3p0/info#Imported_Include (§9.4.1: 'This denotes the use of the XInclude feature [XInclude, 16]'); https://www.w3.org/TR/xinclude-11/#include_element (XInclude 1.1 §3.1: 'If the href attribute is absent when XML processing is specified, the xpointer or fragid attribute must be present', and reading 85 refuses xpointer, and the pinned XInclude.xsd declares no fragid), https://www.w3.org/TR/xinclude-11/#xml-included-items (§4.2: 'Resources that are unavailable for any reason … result in a resource error') and https://www.w3.org/TR/xinclude-11/#fallback_element (§3.2: 'If the xi:fallback element is missing, a resource error results in a fatal error'): an include the information model reads names, by an href this representation resolves, a document its package lists; one that holds a fallback is refused alike, since the representation applies no fallback, a stated limit; an include whose href is external (reading 102) names a resource the package does not hold, and is admitted, stored as written and never fetched",
  },
  "Inclusion cycle": {
    rule: "inclusion-cycle",
    source:
      "reading 85: https://www.w3.org/TR/xinclude-11/#loops (XInclude 1.1 §4.2.7: 'it is a fatal error to process another xi:include element with an include location and xpointer attribute value that have already been processed in the inclusion chain'), the XInclude https://www.imsglobal.org/spec/qti/v3p0/info#Imported_Include (§9.4.1) names, and https://www.imsglobal.org/spec/qti/v3p0/info#Derived_AssessmentSectionRef (§7.5: the section ref 'functions as a facade for the qti-assessment-section to which it refers', the document that holds it, 'with the refered-to section merged in', behaving as 'a document that has all the same sections aggregated in one document', which a chain that returns to its own document has none of): no chain of qti-assessment-section-ref and xi:include hrefs, over the documents the manifest lists, returns to a document already on it",
  },
  "Item duration": {
    rule: "item-duration",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#IV_Response (§2.2.2.2: 'The value of duration for items that are not time dependent must not be used in any item or test-level expression', info.txt:8468) (expressions.ts Item_duration over ItemTiming; the UP audit's A62)",
  },
  "Item ref target": {
    rule: "item-ref-target",
    source:
      "the UP audit's B2: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_AssessmentItemRef.Attr_href (§5.6.5: 'The URI used to refer to the item's file (e.g., elsewhere in the same content package)', info.txt:14764): an item ref's href names a document of the package, and that document's root is an item (tests.ts ItemRefTarget)",
  },
  "Key text bound": {
    rule: "key-text-bound",
    source:
      "src/qti/limits.ts: a text a key, a containment or a family's hidden columns hold takes its kind's one bound, the least every key of the kind leaves it under grizzle's representability rule, PostgreSQL's BTMaxItemSize (nbtree.h): a key text (keyText) at most keyTextBytes UTF-8 bytes, a namespace name (namespaceText) at most namespaceBytes, a local name at most localNameBytes, each what grizzle's keyTextBytes leaves beside its widest key's other fields; a stated limit of the representation, not a law of the specification",
  },
  "LOM learning resource type": {
    rule: "lom-learning-resource-type",
    source:
      "reading 122: https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.5.1, Learning Resource Type: 'the LOM-defined values self assessment and exam are forbidden', normative by its §1.2): a learningResourceType of the LOM vocabulary holds neither, its term the LOM vocabulary's where its source is LOMv1.0, empty, or not written, which the loose binding defaults to LOMv1.0 (imsmd_loose_v1p3p2.xsd:1288); a term of another source is another vocabulary's, which the loose binding does not enforce (§3.6), and is not refused; source and value compared collapsed (metadata.ts LomResourceType, LomResourceTypeSource)",
  },
  "Label tools": {
    rule: "label-tool",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_BaseSequence.Attr_label (§5.16.5, and §5.15.5, §5.17.5 to §5.21.5 and §5.79.4: 'If an item uses labels then values for the associated toolName and toolVersion characteristics must also be provided'), of the label of each kind whose type takes it from one of those classes, in both versions (labels.ts toolLabelKinds), and not of ItemFileInfo's ('A human readable label/short description for the file', §5.80.2) or PrintedVariable's ('such as would be appropriate for a tooltip', §7.30.4), which state none; reading 128: https://www.imsglobal.org/sites/default/files/spec/qti/v3/info/imsqti_asi_v3p0p1_infomodel_v1p0.html (QTI 3.0.1 §4.1.3, the item's label: 'If an item uses labels then values for the associated toolName and toolVersion attributes must also be provided'; ~/.cache/gr8des/qti301/info301.txt:11490) of a 3.0.1 item root's own label, where 3.0.0's §4.1.3 ('A human readable label that can be used to describe the Item', ~/.cache/gr8des/anyuri-specs/qti/info.txt:10162) states none; the version is the manifest's schemaversion (reading 67), and the sentence binds an item, not a stimulus or a test",
  },
  "Literal lexical": {
    rule: "attribute-lexical",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_BaseTypeEnum (§8.13, BaseTypeEnum, each base type's value set): a qti-base-value's text is a lexical form of its base-type, the same language as Typed value's (expression-types.ts BaseTypePattern; readings 7, 34, 45 and 71)",
  },
  LomObjectIdentifier: {
    rule: "lom-identifier",
    source:
      "https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.1.1, Identifier: 'One of the values given for the identifier must have an entry that matches the identifier of the associated item, test or object bank', normative by its §1.2), over the general category's identifiers alone; info §4.1.1 and §4.4.1 ('MUST be the same'); reading 62 as UP's audit merges it (docs/research/up.md §2.2), the entry compared collapsed",
  },
  LomObjectTitle: {
    rule: "lom-title",
    source:
      "https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.1.2, Title: 'The title must have a value that matches the value of the title attribute of the associated item, test or object bank. The language used to interpret the title is taken from the language attribute of the associated item, test or object bank', normative by its §1.2); info §4.1.2 and §4.4.2; reading 62 as UP's audit merges it (docs/research/up.md §2.2). Titles compare in xs:normalizedString's value space and language tags without regard to case (RFC 5646 §2.1.1; metadata.ts)",
  },
  "Lookup table cardinality": {
    rule: "lookup-cardinality",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootAttribute_OutcomeDeclaration_lookupTable (§4.5.13: a lookup table maps 'a numeric source value to a single outcome value in the declared value set'): a qti-match-table's or qti-interpolation-table's outcome declaration is of single cardinality (mapping.ts Lookup_table_cardinality)",
  },
  "Lookup type": {
    rule: "P22",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_LookupOutcomeValue_expressionGroup (§5.87.2: 'An expression which must have single cardinality and an effective base-type of either integer, float or duration. Integer type is required when the associated table is a matchTable'), looked up in the outcome's table (§5.87: 'in the lookupTable associated with the outcome's declaration') (expressions.ts Lookup_type; the old checker's P22)",
  },
  "Manifest id space": {
    rule: "manifest-id-space",
    source:
      "IMS Content Packaging 1.2: the manifest's and its resources' identifiers are one xs:ID space",
  },
  "Manifest overlay": {
    rule: "reachability",
    source:
      "plan §1.6 and the W5 amendment's C18: each manifest overlay (ManifestId, Resource, ResourceHref, File, Dependency) is its element's row, keyed by its node: it copies its node's nodeRef tuple, names a node of its kind and its package's Document row, takes its values from its element's attributes, and a file's and a dependency's resource is their node's parent; one manifest per package (Q5.06)",
  },
  "Map key": {
    rule: "map-key-unique",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping (§5.88.4 and §7.21: 'The map is defined by a set of mapEntries, each of which maps a single value from the source set onto a single float'), so a mapping is a function of its source value: no two of its entries share a key, compared as values of its base type where the schema holds one (an integer's canonical form, a float of grizzle's double form as its double, mapping.ts MapKeyInteger and MapKeyFloat) and as written otherwise (readings 7, 34 and 45), but a string as its entry's case-sensitive says it is matched (§7.21.3: 'The default value is false'): case-folded where false and by code points where true, two entries repeating a string key only where they are matched the same way and one string matches both (reading 98)",
  },
  MappableBaseType: {
    rule: "mapping-base-type",
    source:
      "reading 78: https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping (§5.88, the Mapping class: \"A special class used to create a mapping from a source set of any base-type (except file and duration) to a single 'float'\") (expression.ts MappableBaseType)",
  },
  "Mapped response": {
    rule: "P27",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Derived_MapResponse (§7.22, MapResponse: it 'transforms it using the associated mapping, which must have been declared'; §6.9.46, MapResponsePoint: it takes 'a response variable that must be of base-type point, and transforms it using the associated areaMapping', which §5.115.7 says 'may only be present in declarations of variables with base-type point') (expressions.ts Mapped_response; the old checker's P27)",
  },
  "Mapping overlay": {
    rule: "reachability",
    source:
      "plan §1.7 O5 and the W5 amendment's C18: each O5 overlay (Mapping, MapKey, MapKeyInteger, MapKeyFloat, AreaMapping, MatchTable, InterpolationTable) is its element's row, keyed by its node: it copies its node's nodeRef tuple and its declaration's declarationRef tuple, names a node of its kind, takes its key from its element's map-key attribute, and a typed key is the row of exactly the map keys of its form (Q5.11)",
  },
  "Mastery range": {
    rule: "mastery-range",
    source:
      "reading 9: the Schematron's RULE SPECIFIC CLASS OUTCOMEDEC 1 (ASI 3.0.1 XSD, on qti-outcome-declaration: 'not(@mastery-value < @normal-minimum)', 'The mastery-value attribute value must not be less than the normal-minimum value'; 'not(@mastery-value > @normal-maximum)', 'The mastery-value attribute value must not be greater than the normal-maximum value'), read by its intent: each pair judged where both are written, as xs:double values (INF and -INF infinite), NaN ordered against nothing; a value outside grizzle's double lexical form (outer whitespace, over 15 significant digits, an exponent beyond 293) is not judged, a recorded limit",
  },
  "MathML align first": {
    rule: "ordering",
    source:
      "reading 2: https://www.w3.org/TR/MathML3/chapter3.html#presm.malign.group (MathML 3 §3.5.5.2: 'the first complete element must be an maligngroup element' in a table cell whose alignment groups are checked, a complete element being one with no element children); a cell is judged when it holds a group that stands where §3.5.5.2 lets it (the align placement law), and a group outside a cell or under an maction child that is not selected is not judged (§3.5.5.9)",
  },
  "MathML align placement": {
    rule: "admission",
    source:
      "reading 2: https://www.w3.org/TR/MathML3/chapter3.html#presm.malign.group (MathML 3 §3.5.5.2: an maligngroup in a table cell stands in the cell directly or inside an mrow or mstyle that changes no direction, mphantom, mfenced, the selected sub-expression of an maction, or semantics) and #presm.malign.mtable (§3.5.5.9); a group with no cell above it is ignored, only an maction's selected sub-expression is checked, and a change of direction is a dir other than the one the element inherits, so mrow dir='ltr' in a formula that reads left to right changes none (operator decision 321)",
  },
  "MathML arity": {
    rule: "math-arity",
    source:
      "reading 2 (expression.ts mathArities): https://www.w3.org/TR/MathML3/chapter4.html#contm.unary (MathML 3 §4.3.4.6: 'Unary operators take a single argument') and #contm.binary (§4.3.4.5: 'Binary operators take two arguments'), each operator's class from its syntax table in §4.4 (§4.1.5: the Class row 'indicate[s] how many arguments the operator represented by this element takes'); an apply with a qualifier or an interval beside its operator is not judged, and moment is left out, since §4.4.8.6's own example applies it to five arguments",
  },
  "MathML cn form": {
    rule: "attribute-lexical",
    source:
      "spec readings 2 and R6-hexdouble: https://www.w3.org/TR/MathML3/chapter4.html#contm.cn (MathML 3 §4.2.1: the content of a cn has the form its type implies, integer, real, double, hexdouble, e-notation, rational, complex-cartesian and complex-polar, split at m:sep; every other type is text), digits read in its base from 2 to 36; a part holding an element or an entity reference is not judged, and a base beyond the alphabet leaves the digits application specific (expression.ts cnForms and cnPatternOf)",
  },
  "MathML foreign element": {
    rule: "unmodeled-vocabulary",
    source:
      "MathML 3 RelaxNG mathml3-common.rnc: start = math (line 15) and anyElement = element (* - m:*) (line 61); MathML 3 §2.2, 'All other MathML content must be contained in a math element'; reading 2",
  },
  "MathML head qualifier": {
    rule: "admission",
    source:
      "spec reading R6-head-qualifiers (expression.ts mathHeadQualifiers) and MathML 3's §4.4 syntax tables: https://www.w3.org/TR/MathML3/chapter4.html#contm.root (§4.4.2.11), #contm.log (§4.4.7.7) and #contm.moment (§4.4.8.6) list degree, logbase and momentabout beside their operators; an apply whose first child is no built-in operator is not judged",
  },
  "MathML maction selection": {
    rule: "union-count",
    source:
      "reading 2: https://www.w3.org/TR/MathML3/chapter3.html#presm.maction (MathML 3 §3.7.1.1: 'If the value specified is out of range, it is an error' and 'If no selected sub-expression exists, it is a MathML error'): an maction has at least one element child and its selection, 1 when absent, is at most their number",
  },
  "MathML share cycle": {
    rule: "document-key",
    source:
      "reading 2: https://www.w3.org/TR/MathML3/chapter4.html#contm.share (MathML 3 §4.2.7, c4#contm.acyclicity: 'An element may not dominate itself'): an element dominates its children and, where it is an m:share whose src is a same-document fragment, the element that fragment names, so an m:share on a cycle of those edges is refused",
  },
  "Max strings required": {
    rule: "max-strings-required",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ExtendedTextInteraction.Attr_max-strings (§5.48.6: 'The max-strings characteristic is required when the interaction is bound to a response variable that is a container'): an extended text interaction bound to a multiple or ordered response writes max-strings, select(BindingDeclaration, response-identifier, extended text, multiple or ordered)(node, kind) contained in select(CountBound, maxWritten)(node, kind) (interactions.ts, Q5.09)",
  },
  "Media source src": {
    rule: "source-src",
    source:
      "reading 124: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Source.Attr_src (§5.135.1: 'The value must be a valid non-empty URL potentially surrounded by spaces. This characteristic must be present'), read in a media element as the HTML Standard it restates splits it (https://html.spec.whatwg.org/multipage/embedded-content.html#the-source-element: where 'The source element's parent is a media element', 'This attribute must be present'; where it is a picture element, 'The src attribute must not be present'): a source whose parent is an audio or a video carries src (html.ts Media_source_src)",
  },
  "N1 one document node": {
    rule: "reachability",
    source: "XML 1.0 §2.1, one document entity; fin.md §12, entry 8",
  },
  "N1 sentinel": {
    rule: "reachability",
    source:
      "fin.md §12, entry 8: the document node is its own parent, document and nearest, at slot 0",
  },
  "N2 key": {
    rule: "reachability",
    source: "fin.md §5.2, the ordered family's key (parent, at)",
  },
  "N2 mirrors": {
    rule: "reachability",
    source: "fin.md §5.2, the ordered family: slots 0 to children − 1, each held",
  },
  "N2 tree": {
    rule: "reachability",
    source:
      'trees.md §2 to §4, T0 to T6: tree(on(Node, "parent", "at"), fin(Node, "children"), { root: "document" }), its key (parent, at), UNIQUE (document, start) and its interval checks (plan §1.3 N2, N9 and N10)',
  },
  "N4 kinds": {
    rule: "admission",
    source: "fin.md §17, the NodeKind and SchemaVersion rosters",
  },
  "N5 Follow": {
    rule: "ordering",
    source:
      "XML Schema Part 1 §3.8, each content model as its Glushkov automaton (content.ts Follow; the operator's ruling of 2026-11-05)",
  },
  "N5 admitted": {
    rule: "admission",
    source: "the XSDs' content models as Admission (content.ts); reading 6 for wildcard content",
  },
  "N5 first slot": {
    rule: "ordering",
    source: "fin.md §4.3, each fold's identity at slot 0",
  },
  "N5 fold": {
    rule: "ordering",
    source: "fin.md §4.5a, the predecessor copy",
  },
  "N6 ancestry": {
    rule: "ancestry-ban",
    source:
      "fin.md §13 P3 and §16: the information model's nesting rules as Banned and Needs (ancestry.ts, facets.ts); readings 25 and 38",
  },
  "N7 Counted": {
    rule: "child-set",
    source:
      "XML Schema Part 1 §3.9 occurrence bounds of 2 to n, which a position automaton relaxes (content.ts Counted), and the loose LOM binding's Schematron caps: each element the binding bounds to one inside an unbounded choice stands at most once in its family (lom/imsmd_loose_v1p3p2.xsd:18-21 and 85-92, its 94 asserts at 93-911; reading 130)",
  },
  "N7 Last": {
    rule: "child-set",
    source:
      "XML Schema Part 1 §3.8, each content model as its Glushkov automaton (content.ts Last)",
  },
  "N7 barred by": {
    rule: "child-set",
    source:
      "the HTML Standard, colgroup: a span attribute bars col children (children.ts ChildBarredBy)",
  },
  "N7 empty family": {
    rule: "union-count",
    source: "fin.md §5.2, an empty family's end values are each fold's identity",
  },
  "N7 last slot": {
    rule: "union-count",
    source: "fin.md §5.2, the last-slot copy",
  },
  "N8 nearest": {
    rule: "owner-copy",
    source: "plan-qti-pie N8, the nearest interaction (fin.md §15, rule 3)",
  },
  "Namespace family": {
    rule: "reachability",
    source: "Namespaces in XML 1.0 §3, declarations in source order (fin.md §5.2)",
  },
  "Namespace name": {
    rule: "namespace-name",
    source:
      "reading 131: https://www.w3.org/TR/xml-names/#ns-decl (Namespaces in XML 1.0 (Third Edition) §3: 'The attribute's normalized value MUST be either a URI reference — the namespace name identifying the namespace — or an empty string'; §2.1: 'An XML namespace is identified by a URI reference [RFC3986]'; a relative reference is deprecated, §2.2, not refused; §8 lets a processor leave it unchecked, which leaves the document's constraint standing): a namespace declaration's normalized value is RFC 3986's URI-reference (https://www.rfc-editor.org/rfc/rfc3986#appendix-A), the empty one a relative-ref of an empty path (chardata.ts NamespaceUri)",
  },
  "Node key": {
    rule: "reachability",
    source: "trees.md §1, the tree relation's key, id",
  },
  "One base": {
    rule: "P23",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-multiple (§6.9.13, and §6.9.14 Ordered: 'Although the sub-expressions may be of any base-type they must all be of the same base-type'; §5.113, Repeat: 'all of which must have either single or ordered cardinality and the same base-type'; §6.9.21, Match: 'which must both have the same base-type and cardinality'; §6.9.33, Member, and §6.9.20, Delete: 'which must both have the same base-type'; §6.9.25, Contains: 'which must both have the same base-type and cardinality - either multiple or ordered'), a type no declaration says aside (reading 4) (expressions.ts One_base; the old checker's P23)",
  },
  OpenElementName: {
    rule: "unmodeled-vocabulary",
    source: "fin.md D2, a foreign element keeps its expanded name; reading 6",
  },
  "OpenElementName canonical": {
    rule: "unmodeled-vocabulary",
    source:
      "https://www.w3.org/TR/xmlschema-1/#cvc-assess-elt (XML Schema 1.0 Part 1 §3.3.4, Schema-Validity Assessment (Element), clauses 1.1.1.2 and 1.1.1.3.2: an element is assessed against the declaration its context determines or its name resolves to, a particle's own or a top-level one a lax or strict wildcard finds, §3.10.4 clause 2), so an element whose expanded name its parent admits there is that declaration's kind and never a foreign element (shred.ts childReadingOf; install.ts KindByNameUnder, the names each (version, parent) admits, C8)",
  },
  "Operand fit": {
    rule: "P23",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-member (§6.9, ExpressionGroup, normative: each operator's sub-expression base types and cardinalities, as §6.9.33 qti-member and §6.9.20 qti-delete say: 'The first sub-expression must have single cardinality and the second must be a multiple or ordered container'), a type no declaration says aside (reading 4) (expression.ts expressionTypings, OperandBase, LeadCardinality and TailCardinality; the old checker's P23)",
  },
  "Outcome only": {
    rule: "P25",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-number-correct (§6.9.58 to §6.9.64 and §6.9.41, normative: qti-number-correct, qti-number-incorrect, qti-number-presented, qti-number-responded, qti-number-selected, qti-outcome-minimum, qti-outcome-maximum and qti-test-variables, each 'which can only be used in outcomes processing') (expressions.ts Outcome_only, its language Processing's; the old checker's P25)",
  },
  "PCI module source": {
    rule: "pci-module-source",
    source:
      "R10-a: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_PortableCustomInteraction.Attr_module (§5.106.2: 'If this characteristic is provided the qti-interaction-modules child attribute is not required, if omitted then the modules child element is mandatory'): a portable custom interaction names its module by a module attribute, by a qti-interaction-modules child, or by both (interactions.ts PCI_module_source)",
  },
  "Package key": {
    rule: "reachability",
    source:
      "plan §1.6: one Package row per imported package, keyed by the id the importer mints for it",
  },
  "Picture source srcset": {
    rule: "source-srcset",
    source:
      "reading 124: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Source.Attr_srcset (§5.135.3: \"This attribute is required when 'source' is used in 'picture'\"); https://html.spec.whatwg.org/multipage/embedded-content.html#the-source-element (where 'The source element's parent is a picture element', 'The srcset attribute must be present'): a source whose parent is a picture carries srcset (html.ts Picture_source_srcset)",
  },
  "Prefixed reference": {
    rule: "prefixed-ref",
    source:
      "readings 48 and 88: https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Variable (§7.47: 'values taken from an individual item session can be looked up by prefixing the name of the item variable with the identifier assigned to the item in the qti-assessment-item-ref, separated by a period character'; for an item 'allowed to be replaced (i.e. that have the with-replacement attribute set to \"true\")', 'a number that denotes the instance's place in the sequence of the item's instantiation is inserted between the item variable identifier and the item variable'), https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_identifier (§4.2.1: 'Identifiers containing the period character are reserved for use in prefixing') and https://www.imsglobal.org/spec/qti/v3p0/info#Derived_TimeLimits (§7.40: 'For qti-assessment-sections, qti-test-parts and whole qti-assessment-tests the time limits relate to the durations of all the item sessions plus any other time spent navigating that part of the test'), a part's or section's duration read by its identifier's prefix as an item's variables are (reading 48), over the assembled test (readings 4, 5 and 86): a test-level reference is accepted when exactly one of its readings, unsplit, split at a dot, or numbered at two dots, names a scope of the test and a variable of that scope, a numbered one only under a selection with replacement and only from 1, and none through a name two placements give; a name read through an item ref that names an LTI link resolves unchecked, an LTI link having no declarations (reading 110, expressions.ts linkHeld); and a braced reference, a string attribute's, that resolves nowhere is a string value, refused only for two resolving readings (reading R15-k) (expressions.ts Reading: the key and the containment over its resolving readings, M3, and Prefixed_reference)",
  },
  "Printed variable reference": {
    rule: "printed-variable-ref",
    source:
      "reading 77: https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_PrintedVariable.Attr_identifier (§7.30.6: 'The outcome variable or template variable must have been defined. The values of response variables cannot be printed directly'), the built-in completionStatus among them (§2.2.2.3) (references.ts ContentReference)",
  },
  "Quotation punctuation": {
    rule: "q-punctuation",
    source:
      "reading 127: https://www.imsglobal.org/spec/qti/v3p0/info#Data_Q (§5.111, Q: 'Quotation punctuation (such as quotation marks) that is quoting the contents of the tag must not appear immediately before, after, or inside q tags; they will be inserted into the rendering by the user agent'; ~/.cache/gr8des/anyuri-specs/qti/info.txt:38400, and the 3.0.1 model's ~/.cache/gr8des/qti301/info301.txt:55430): a q is refused where the last character of its sibling before it, the first of its sibling after it, or the first or last character of its own content is a quotation mark, one of \" « » ‘ ‚ ‛ “ ” „ ‟ ‹ › (main's set, which leaves out the apostrophes ' and ’), each read off a text, whitespace or entity reference row, so an element, a comment or an instruction beside the q holds no punctuation (quotation.ts Quotation_punctuation)",
  },
  "Record field key": {
    rule: "value-cardinality",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_CardinalityEnum (§8.16, CardinalityEnum, record: 'a special container that contains a set of independent values each identified by its own identifier and having its own base-type'): no two fields of one record value share a field-identifier, compared collapsed",
  },
  RecordBindingFit: {
    rule: "record-binding-fit",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_TextEntryInteraction (§5.162: 'The textEntryInteraction must be bound to a response variable with single or record cardinality only') and https://www.imsglobal.org/spec/qti/v3p0/info#Data_ExtendedTextInteraction (§5.48: 'The qti-extended-text-interaction must be bound to a response variable of single, multiple, ordered or record cardinality'); every other class's binding sentence names no record (§5.30 and BindingFit's others) (expression.ts RecordBindingFit)",
  },
  "Reference overlay": {
    rule: "reachability",
    source:
      "IMS Content Packaging 1.2 (b) and (d), and readings 102 and 103: each document's references (Reference) are an attribute's copy keyed by its node and name, and each the importer resolves in the package has its ReferencePath, in its document's package",
  },
  "Reference type": {
    rule: "P24",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Union_IntegerOrVariableRef (§9.3.3, §9.3.1 and §9.3.4: an integerOrVariableRef, floatOrVariableRef or stringOrVariableRef names a template or outcome variable of that base type, single) (expression.ts ReferenceBase; the old checker's P24)",
  },
  "Reserved type": {
    rule: "reserved-type",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Root_OutcomeDeclaration (§4.5, OutcomeDeclaration: 'SCORE needs to be a float.', 'MAXSCORE needs to be a float.', 'PASSED needs to be a boolean.'), of an outcome declaration of that identifier; https://www.imsglobal.org/spec/qti/v3p0/info#RootAttribute_AssessmentItem_qti-context-declaration (§4.1.10, and §4.4.7 of a test: 'An implementation MUST support the global variable \"QTI_CONTEXT\" with record cardinality') and https://www.imsglobal.org/spec/qti/v3p0/info#Data_ContextDeclaration (§5.34: 'There is one built-in context variable named \"QTI_CONTEXT\" with record cardinality'), which the implementation guide, a document with no normative mark, declares explicitly (its §3.7.11, 'an explicit (though unnecessary) <qti-context-declaration> of QTI_CONTEXT'): a declaration of QTI_CONTEXT is a record context declaration, since one of another kind or cardinality would make one identifier name two variables (reading 74)",
  },
  RootOfType: {
    rule: "root-type-reverse",
    source: "QTI 3 packaging: the document root of each resource type (package.ts)",
  },
  "Rounding figures": {
    rule: "P10",
    source:
      "reading 119: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_EqualRounded.Attr_figures (§5.47.2: 'If roundingMode= 'significantFigures', the value of figures must be a non-zero positive integer. If roundingMode='decimalPlaces', the value of figures must be an integer greater than or equal to zero') and #DataCharacteristic_RoundTo.Attr_figures (§5.119.2, the same of rounding-mode), under the EqualRounded default significantFigures (§5.47.1): a figures whose collapsed form is an integer is at least 1 under significantFigures and at least 0 under decimalPlaces, a variable's name read at run time (operators.ts Rounding, Rounding_figures)",
  },
  "SSML lexicon reference": {
    rule: "ssml-fragment",
    source:
      "reading 3: https://www.w3.org/TR/speech-synthesis11/#S3.1.5.2 (SSML 1.1 §3.1.5.2: 'The ref attribute specifies a name that references a lexicon document as assigned by the xml:id attribute of the lexicon element') and #S3.1.5.1 (§3.1.5.1: 'The scope of this name is the current SSML document'), the document being the lookup's nearest speak (identity.ts ssmlLexiconReference, through SsmlScope)",
  },
  "SSML trim mark": {
    rule: "ssml-fragment",
    source:
      "reading 3: https://www.w3.org/TR/speech-synthesis11/#S3.1.1.1 (SSML 1.1 §3.1.1.1: 'Only markers defined once in the document, i.e. that are unique, are permitted as the value of either startmark or endmark'; 'It is an error if the value given for either startmark or endmark is not a valid mark in the document'), the document being the speak, each name an xs:token (§3.3.2) compared by its collapsed value (identity.ts ssmlTrimMark)",
  },
  "Section identifier target": {
    rule: "section-identifier-target",
    source:
      "readings 5 and 86: https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_Number.Attr_section-identifier (§7.27.1, and §7.28.1, §7.39.1: 'If specified, only variables from items in the qti-assessment-section with matching identifier are matched', info.txt:69115), resolved over each test that places the document: a section-identifier names exactly one section or section ref of the assembled test (expressions.ts Reading, form name; the UP audit's A61)",
  },
  "Selection bound": {
    rule: "selection-bounds",
    source:
      "reading 79: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Selection.Attr_select (§5.129.1: 'The number of children to select may exceed the number of child elements defined only if with-replacement is true'; 'Sub-sections always count as 1') (references.ts SectionPart)",
  },
  "Selection required": {
    rule: "selection-required",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_required (§4.2.2, and §5.6.2 of the item ref: 'If a child element is required it must appear (at least once) in the selection. It is an error if a section contains a selection rule that selects fewer child elements than the number of required elements it contains'): a section's parts whose required is true are at most its selection's select (tests.ts Selection_required)",
  },
  "Self dependency": {
    rule: "self-dependency",
    source:
      "imscp_infov1p2pd2.txt:1105 (IMS Content Packaging 1.2, §6.11.5, the IdentifierRef class, rule B ii: an IdentifierRef child of a Dependency object 'Shall not reference the Dependency's parent Resource'): a cp:dependency's identifierref is not its own resource's identifier, compared as written (package.ts Self_dependency)",
  },
  "Set type": {
    rule: "P20",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_SetValue (§5.130, SetValue, normative, the class of every setter, outcome, response and template rules alike: 'floating point values can not be assigned to integer variables and vice-versa. The truncate, round or integerToFloat operators must be used to achieve numeric type conversion'; §5.130.2, its expression: 'The expression which must have an effective base-type and cardinality that matches the base-type and cardinality of the outcome variable being set') (expressions.ts Set_type; the old checker's P20)",
  },
  "Slider bounds": {
    rule: "slider-bounds",
    source:
      "reading 9, the Schematron's rule 14Ba (RULE_SET_INTERACTION_14B, ASI 3.0.1 XSD, on qti-slider-interaction: 'not(@upper-bound < @lower-bound)', 'The upper-bound attribute value must not be less than the lower-bound value'), its values read as xs:double; the information model (§5.134.1-2) states no order",
  },
  "Stimulus ref key": {
    rule: "stimulus-ref-key",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_AssessmentStimulusRef.Attr_identifier (§7.6.1: 'The unique identifier for the stimulus reference'; §7.6.2: 'each reference must have a unique identifier'), compared collapsed: no two stimulus refs of one item share an identifier (tests.ts StimulusRef)",
  },
  "Stimulus ref target": {
    rule: "stimulus-ref-target",
    source:
      "info.txt:67012 and :67066 (https://www.imsglobal.org/spec/qti/v3p0/info#Derived_AssessmentStimulusRef, §7.6: the stimulus ref 'enables reference to a 'qti-assessment-stimulus' instance', and its href is 'The uri used to refer to the stimulus file'): a stimulus ref's href that resolves in the package names a listed document whose root is a qti-assessment-stimulus; an external href is not resolved (reading 35's reading of an absolute URI) (package.ts ReferencePath, the UP audit's B5)",
  },
  "Strictly held": {
    rule: "unmodeled-vocabulary",
    source:
      "reading 81: https://www.w3.org/TR/xmlschema-1/#cvc-wildcard (XML Schema 1.0 Part 1 §3.10.4, Item Valid (Wildcard), clause 2: a strict wildcard's element has the context-determined declaration mustFind), with §3.3.4 clause 1.2 and §3.3.5 [validity] clause 1.1.3: an element only the strict wildcards of its parent's model hold (install.ts StrictlyHeld) stands only under an xsi:type naming a type of its document's schema set or a built-in, so its governing type is not none (C44; shred: strict-undeclared), but for reading 6's root whose declaration the wildcard finds (§3.10.4 clause 2, §3.3.4 clause 1.1.1.3.2), kept foreign and unrefused (install.ts HeldRootsUnder, C13)",
  },
  "Structure identifier": {
    rule: "structure-identifier",
    source:
      "reading 86: https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_identifier (§4.2.1: 'The identifier of the section or item reference must be unique within the test and must not be the identifier of any testPart') and §5.159.1 ('The identifier of the test part must be unique within the test and must not be the identifier of any qti-assessment-section or qti-assessment-item-ref'), compared collapsed: no two test parts, sections, section refs or item refs of one document share an identifier, whatever their roles (tests.ts Named)",
  },
  "T1 document order": {
    rule: "reachability",
    source: "trees.md §2, T1",
  },
  "T2 root": {
    rule: "reachability",
    source: "trees.md §2, T2",
  },
  "T3 first child": {
    rule: "reachability",
    source: "trees.md §2, T3, with the merged parent copy (trees.md §6)",
  },
  "T4 next sibling": {
    rule: "reachability",
    source: "trees.md §2, T4",
  },
  "T5 last child": {
    rule: "reachability",
    source: "trees.md §2, T5",
  },
  "T6 nonempty and leaf": {
    rule: "reachability",
    source: "trees.md §2, T6",
  },
  "Table headers": {
    rule: "table-headers",
    source:
      "reading 126: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TDH.Attr_headers (§5.140.1: \"an unordered set of unique space-separated tokens that are case-sensitive, each of which must have the value of an ID of a 'th' tag taking part in the same table as the 'td' or 'th' tag\"); https://html.spec.whatwg.org/multipage/tables.html#attr-tdth-headers: a cell's headers tokens are unique, and each is the id of a th whose nearest table is the cell's, a cell no table holds taking part in none (html.ts TableScope, TableHeader, tableHeaders)",
  },
  "Template default target": {
    rule: "template-default-target",
    source:
      "the UP audit's A37: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TemplateDefault.Attr_template-identifier (§5.152.1: 'The identifier of the template variable affected'; §5.152: 'The default value of a template variable in an item can be overridden based on the test context'): a template default names a template declaration of the item its item ref names, compared collapsed (expressions.ts TemplateDefaultTarget, through tests.ts ItemRefDocument); an item ref that names an LTI link names no item, so no template of it: a template default under it still breaks this law (reading 110)",
  },
  "Template default type": {
    rule: "P20",
    source:
      "the UP audit's A38, the old checker's P20 for a setter: https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_TemplateDefault_expressionGroup (§5.152.2: 'An expression which must result in a value with base-type and cardinality matching the declaration of the associated variable's qti-template-declaration'): a template default's expression fits its template variable's type, a type no declaration says aside (reading 4) (expressions.ts TemplateDefaultTarget Template_default_type)",
  },
  "Template reads": {
    rule: "P26",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Abstract_TemplateRuleGroup (§6.50: 'An expression used in a qti-template-rule must not refer to the value of a response variable or outcome variable. It may only refer to the values of the template variables'), with https://www.imsglobal.org/spec/qti/v3p0/info#Data_ContextDeclaration (§5.34: 'Context variables may be referenced in template processing, in response processing, and in outcome processing'): template processing reads template and context variables, QTI_CONTEXT among them, and no response, outcome or built-in session variable (expressions.ts Template_reads; the old checker's P26)",
  },
  "Template reference": {
    rule: "template-ref",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TemplateBlock.Attr_template-identifier (§5.145.1, and §5.155.1, §5.122.1, §5.124.1 and each choice's, as §5.132.3: 'The identifier of a template variable'), a template variable being one a template declaration declares (https://www.imsglobal.org/spec/qti/v3p0/info#Data_TemplateDeclaration, §5.151: 'Template declarations declare item variables that are to be used specifically for the purposes of cloning items') (references.ts ContentReference)",
  },
  "Template variable type": {
    rule: "template-ref",
    source:
      "reading R15-l: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TemplateBlock.Attr_template-identifier (§5.145.1, and §5.7.2, §5.67.2, §5.122.1, §5.124.1, §5.155.1: 'The identifier of a template variable that must have a base-type of identifier and be of either single or multiple cardinality') and #DataCharacteristic_SimpleChoice.Attr_template-identifier (§5.132.3, and §5.55.2, §5.56.2, §5.58.2, §5.65.2, §5.73.3, §5.131.3: the same rule, written 'be either single of multiple cardinality'); a portable custom interaction's template variable (§7.38.1) states no type (interactions.ts Template_variable_type)",
  },
  "Test name key": {
    rule: "test-name-key",
    source:
      "reading 86: https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_identifier (§4.2.1) and §5.159.1, read over the assembled test (reading 5): the test document and every section document its section refs and includes place; and §7.5.3 ('A test may refer to the same section multiple times within a test'), so a section document placed twice is one document and names nothing twice: no two written elements of one test share an identifier (tests.ts InstanceName, AssembledName)",
  },
  "Test overlay": {
    rule: "reachability",
    source:
      "plan §1.7 O7 and the W5 amendment's C15, C18: each O7 overlay (TestDocument, TestToken, TestFlag, Named, Section, SectionMember, SectionSelection, SectionOrdering, Site, BranchRule) is its element's row, keyed by its node (a token or flag by node and name): it copies its node's nodeRef tuple and its attributes' values, collapsed, and exists exactly where its element does (Q5.13)",
  },
  TextDomain: {
    rule: "text-copy",
    source:
      "XML Schema Part 2, each simple-content kind's type compiled with its whiteSpace (domains.ts); reading 7; and https://www.w3.org/TR/xmlschema-2/#NOTATION (§3.2.19: 'The ·value space· of NOTATION is the set of QNames of notations declared in the current schema'), which no pinned XSD declares, so a text read in xs:NOTATION's empty domain is refused (reading 60, C47: attributes.ts emptyDomains)",
  },
  "Track srclang": {
    rule: "track-srclang",
    source:
      'reading 125: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Track.Attr_srclang (§5.163.3: "This attribute must be present if the tag\'s kind attribute is in the subtitles state"); https://html.spec.whatwg.org/multipage/media.html#the-track-element (kind: "The attribute\'s missing value default is the subtitles state"): a track that writes no kind, or writes kind as subtitles, carries srclang (html.ts Track_srclang, subtitleTrackSrclang)',
  },
  "Typed attribute value": {
    rule: "attribute-lexical",
    source:
      "readings 7 and 8, and https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_BaseTypeEnum (§8.13, BaseTypeEnum, each base type's value set): a qti-map-entry's map-key is a value of its mapping's base type (§7.21.1, 'The source value'), and a lookup table entry's target-value and a table's default-value are values of its outcome's base type (§5.90.1, §5.78.1, §7.23.2, §7.18.3); each is written as its base type's lexical form with no whitespace around it unless the base type is string (mapping.ts Typed_attribute_value over expression-types.ts BaseTypePattern)",
  },
  "Typed value": {
    rule: "typed-copy",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Value (§7.46, Value: 'The base-type is defined by the 'base-type' attribute of the declaration except in the case of variables with record cardinality') and https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_BaseTypeEnum (§8.13, BaseTypeEnum, each base type's value set): a qti-value's text is a lexical form of its base type, outer whitespace formatting but for string (reading 7): boolean true or false (reading 34), integer xs:integer unbounded (reading 45), float xs:double (reading 56) and duration xs:double (§8.13: 'Durations are represented using the 'xsd:double' datatype'), identifier IdentifierDType, uri xs:anyURI (reading 71), point two integers, pair and directedPair two identifiers; string and file any text",
  },
  "Usage typed value": {
    rule: "typed-copy",
    source:
      "reading 105: https://www.imsglobal.org/sites/default/files/spec/qti/v3/ud-bind/index.html (QTI 3.0 Usage Data binding §2.6.5, Value: 'A class that can represent a single value of any baseType'; §2.7.1, BaseTypeEnum) and https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_BaseTypeEnum (§8.13, BaseTypeEnum, each base type's value set): a ud:value that forms part of a record (it writes a fieldIdentifier) and writes baseType holds a lexical form of that base type, read as a qti-value's text is (readings 7, 34, 45 and 71), and any other ud:value, outside a record or writing no baseType, is xs:normalizedString text, accepted untyped (metadata.ts UsageValue over expression-types.ts BaseTypePattern)",
  },
  "Value cardinality": {
    rule: "value-cardinality",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_CardinalityEnum (§8.16, CardinalityEnum: single 'a single value'; record 'a set of independent values each identified by its own identifier and having its own base-type') and https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Value (§7.46.1, §7.46.2: field-identifier and base-type are 'only used for' a value that forms part of a record): a single variable's default or correct value holds one qti-value, and a value is a record's field, with its field-identifier and base-type, exactly when its variable is a record",
  },
  "Variable declared": {
    rule: "P8",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-variable (§6.9.40, qti-variable, normative: 'This expression looks up the value of an itemVariable that has been declared in a corresponding variableDeclaration or is one of the built-in variables'), https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_Variable.Attr_identifier (§7.47.1, Variable's identifier: 'The identifier of the item variable that has been declared in a corresponding variable declaration or of the built-in variables') and https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_SetValue.Attr_identifier (§5.130.1, a setter's: 'The identifier of the variable to be set') (references.ts); readings 4, 29 and 48; and reading R15-k, https://www.imsglobal.org/spec/qti/v3p0/info#Union_StringOrVariableRef (§9.3.4, StringOrVariableRef: 'if a string appears to be a reference to a template or outcome variable but there is no variable with the given name it should be treated simply as string value'): a braced qti-pattern-match pattern that names no variable is a string value, not an undeclared reference",
  },
  "Variable kind": {
    rule: "variable-kind",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info, each processing element's definition of the variable it reads or sets: §7.10.1 Correct ('The identifier of the associated response variable'), §7.22.1 MapResponse ('the associated Response variable'), §6.9.46 MapResponsePoint ('looks up the value of a response variable'), §5.87.1 and §6.32.1 LookupOutcomeValue ('the outcome variable to be set'), §6.32.3 and §6.39.4 SetOutcomeValue ('sets the value of an outcome variable'), §6.50.1 SetTemplateValue ('sets the value of a template variable'), §6.50.4 SetDefaultValue ('The response variable or outcome variable to have its default value set'), §6.50.5 SetCorrectResponse ('The response variable to have its correct value set'), and §7.47.1 Variable and §7.12.1 Default, any item variable (§2.2.2: 'context, response, outcome or template variables'): a reference by identifier names a declaration, or a built-in standing as one (BuiltInVariable), of a kind its element reads or sets; and a setter (§5.130.1 SetValue: 'The identifier of the variable to be set') sets a variable of its own document, which only an unsplit reading names, since an item's variables reach a test only to be looked up (§2.11.1.2: 'values taken from an individual item session can be looked up by prefixing'), reading 112 (expression-types.ts ReferenceDeclaration and setterKinds, over VariableRef and a test's Reading)",
  },
  "Variable mapping source": {
    rule: "variable-mapping-source",
    source:
      "the UP audit's A34: https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_VariableMapping.Attr_source-identifier (§7.48.1: 'The identifier of the outcome variable to identify the name of the source identifier during outcome processing variable mapping', info.txt:71657): a mapping's source names an outcome declaration of the item its item ref names, compared collapsed (expressions.ts MappingSourceDeclaration, through tests.ts ItemRefDocument); an item ref that names an LTI link names no item, so no outcome of it, and a mapping under it is accepted unchecked (reading 110, expressions.ts heldMappings leaves out a mapping whose MappingItemRef names an LTI link)",
  },
  "Variable mapping target": {
    rule: "variable-mapping-target",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Derived_VariableMapping (§7.48: 'Variable mappings allow outcome variables declared with the name source-identifier in the corresponding item to be treated as if they were declared with the name target-identifier during outcome processing') with §4.5.1 ('All item variables declared in an item share the same namespace'; 'The identifiers of the built-in session variables are reserved') and reading 74: no two mappings of one item ref name one target, no target names a built-in session variable, and no target names another variable its item declares (reading 97), compared collapsed (tests.ts VariableMapping; expressions.ts MappingSourceDeclaration, its declared half)",
  },
  "Variable reference copy": {
    rule: "varref-copy",
    source:
      "plan §1.7 O3, the varref-copy rule (Q5.09): every printed variable base or index that names a variable has its VarRef row, which resolves it; the XSD's union of xs:integer and VariableStringDType on those attributes decides what names a variable",
  },
  "Weighted base": {
    rule: "P29",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_TestVariables.Attr_weight-identifier (§7.39.5, TestVariables: 'The behaviour of this characterisic is only defined if the base-type attribute is float or omitted . When a weighting is specified the result of the expression always has base-type float'): with a weight-identifier, a base-type, where written, is float (expressions.ts Weighted_base; the old checker's P29)",
  },
  "XML production": {
    rule: "well-formedness",
    source:
      "XML 1.0 §2.2 Char, §2.5 Comment, §2.6 PI, §2.8 doctypedecl and VersionNum, §4.3.3 EncName, and Namespaces in XML 1.0 §3 NCName: a stored text outside its production is no well-formed XML, which crust's reader refuses before any row exists, so only an importer defect reaches the law",
  },
  "XsiType available": {
    rule: "xsi-type",
    source:
      "readings 60 and 81: https://www.w3.org/TR/xmlschema-1/#cvc-assess-elt (XML Schema 1.0 Part 1 §3.3.4, Schema-Validity Assessment (Element), clause 1.2: an element no declaration assesses is assessed against the type its xsi:type resolves to in the schema its document is assessed against), so a foreign element's governing type is none, one of XML Schema's own, or a type of a schema set its parent's namespace stands in (open.ts typeAvailable; install.ts TypeAvailable, C15 and C36); a parent in no vocabulary's namespace stands in documents of every set, and the document's own set is reading 81's recorded limit",
  },
  "XsiType derived": {
    rule: "xsi-type",
    source:
      "reading 47: https://www.w3.org/TR/xmlschema-1/#cvc-elt (XML Schema 1.0 Part 1 §3.3.4, Element Locally Valid (Element), clause 4.3: the local type definition 'must be validly derived from the {type definition}', §3.4.6 and §3.14.6), over the type that governs each element of a vocabulary kind (Node.governs: its xsi:type's, else its declared type; xsi.ts XsiType). Clauses 4.1 and 4.2, a value that is no QName in scope or names no type, are the codec's (shred: type-unresolved, type-unknown)",
  },
  "comment arm": {
    rule: "text-copy",
    source: "the XDM comment nodes as rows (plan §1.4)",
  },
  "default hotspot last slot": {
    rule: "hotspot-default",
    source:
      "reading 80: https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_HotspotInteraction_qti-hotspot-choice (§5.68.6, and the HotspotChoice class description, §5.67: 'The default hotspot, if defined, must appear last'), of qti-hotspot-choice only, since the AssociableHotspot class (§5.7) and the graphic associate interaction's hotspots (§5.59.4) state no such rule; last among its parent's element children, so whitespace, comments and instructions after it do not count (children.ts LastWhere, ruling D3)",
  },
  "doctype arm": {
    rule: "text-copy",
    source: "the XDM doctype as a row (plan §1.4)",
  },
  "entityRef arm": {
    rule: "text-copy",
    source: "the XDM entity references as rows (plan §1.4)",
  },
  "pi arm": {
    rule: "text-copy",
    source: "the XDM processing instructions as rows (plan §1.4)",
  },
  "text arm": {
    rule: "text-copy",
    source: "the XDM text nodes as rows (plan §1.4)",
  },
  "value domain": {
    rule: "attribute-lexical",
    source:
      "XML Schema Part 2, each attribute's simple type compiled with its whiteSpace and residual facets (domains.ts); readings 7, 45, 46, 56 and 71; and the readings that hold a type to its stricter source (attributes.ts specReadings): 2 (MathML's number without a plus, and cn's base a positive integer), 9 (h1's role heading, tab or presentation, the Schematron's RULE ARIA ROLE 1b), 120 (qti-index's n at least 1), 123 (bdo's dir without auto), 124 and 125 (a media URL non-empty), 129 (xml:lang, lang and srclang BCP 47 language tags), 132 (a printed variable's format a printf format string of at most one conversion) and 135 (a MIME type RFC 2045's two tokens and a slash); and a usage statistic's lastUpdated, the usage data's DateDType (usagedata/imsqti_usagedatav3p0_v1p0.xsd:127-131, xs:date restricted by the pattern [0-9]{4}-[0-9]{2}-[0-9]{2}), the month lengths and the leap rule included (XML Schema 1.1 Part 2 §3.3.9, Day-of-month Representations), which StatisticDate.day restates as grizzle's lexical(date), whose pattern makes the generated date's cast total (Q5.12)",
  },
  "ws arm": {
    rule: "text-copy",
    source: "the XDM whitespace nodes as rows (plan §1.4)",
  },
} as const satisfies Readonly<Record<string, LawEntry>>;
