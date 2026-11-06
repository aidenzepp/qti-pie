# Specification readings

How this repository reads QTI 3.0 and the languages it embeds where a specification is silent, ambiguous or split
between its schema and its prose. Every package follows these readings: the qti package when it accepts or refuses a
document, and the renderer when it renders one, so the two never disagree about the same file. Each reading is an
operator ruling. A new reading lands here by pull request, and a package that needs one asks the operator first.

## Validity

1. **Nothing valid is refused.** Content that is valid QTI 3.0, including every language QTI embeds, is accepted.
   There are no exceptions. Content that is not valid is refused. (2026-10-30, restated without exceptions 2026-11-03.)
2. **MathML validity is the MathML 3 Recommendation**: its RelaxNG schema and its prose rules, not only the MathML XSD
   that QTI's schema imports. MathML that breaks a rule of the Recommendation, such as an operator applied to the wrong
   number of arguments or a piecewise expression with two `otherwise` parts, is invalid even when the QTI XSD accepts it.
   (2026-11-02.)

## Scope of names and references

3. **In SSML, "the document" is each `speak` fragment.** An item may hold several `speak` fragments. SSML's rules
   that speak of the document (a `mark` name defined once, `startmark` and `endmark` naming a defined mark, a `lookup`
   naming a `lexicon`) apply within one fragment. Two fragments may each define `mark name="a"`. A reference from one
   fragment to a mark or lexicon in another does not resolve. (2026-11-03.)
4. **Prefixed variable references** (`ITEMREF.N.VAR`) are valid in a test's pre-conditions and branch rules as well as
   in its outcome processing, as QTI's information model and 1EdTech's own examples use them. (2026-11-03.)
5. **A section document** may hold prefixed references and `section-identifier`. They resolve once for each test that
   includes the section, not once for the section on its own. (2026-11-03.)

## Foreign content

6. **A QTI root, processing root or manifest global nested inside wildcard content** (where QTI admits elements from
   any namespace under lax validation) is valid. It is kept as foreign content like any other element: it is not
   refused, and it is not read as QTI. (2026-11-03.)

## Typed values

7. **A typed value in element text is trimmed; in an attribute it is exact.** A typed value written as element content
   (`qti-value`, `qti-base-value` and the like) has its outer whitespace read as formatting, not meaning, because
   authoring tools and pretty-printers indent and wrap element content. It is read with outer whitespace removed for
   every non-string base type: `" completed "` is the identifier `completed` and `" true "` is `true`. For base type
   string, whitespace is part of the value and is kept. A round trip still reproduces the source spelling byte for
   byte. An attribute value is not reformatted by tools, so `" true"` is not `"true"`: outer whitespace around a typed
   value in an attribute makes it invalid, and the document is refused. The attributes this covers are those
   that carry a typed QTI value, and they are exactly these: `map-key` of a map entry and `mapped-value` of a map entry
   and of an area map entry; a mapping's and an area mapping's `lower-bound`, `upper-bound` and `default-value`; a match table's and an interpolation table's `default-value`, and
   their entries' `target-value`; an interpolation table entry's `source-value`; and the value attributes of the
   usage-data mapping (`ud:mapping`'s `defaultValue`, `lowerBound` and `upperBound`, and its `ud:mapEntry` entries'
   `mappedValue`). Where the value is of base type string, as for a `map-key` or `target-value` of a string variable,
   its whitespace is part of the value and is kept, as above. An attribute the XSD itself types, such
   as `normal-maximum` as `xs:double` or `max-choices` as `xs:nonNegativeInteger`, is read as the XSD reads it, outer whitespace
   collapsed, under reading 1. Free-text attributes such as `title` or `label` keep their text as written, spaces
   included. The split is a ruling because QTI's schema types the text of `qti-value` as `xs:normalizedString` and of
   `qti-base-value` as `xs:string`, never as the value's base type, and its information model lists each base type's
   values without saying how written text maps to them. The specification is silent, and the operator rules this
   reading. (2026-11-04.)

## Where QTI's own documents conflict

Where QTI's own documents conflict, the information model wins over the XSD, with the implementation guide's examples
as supporting evidence.

Each reading below names the document it follows and the one it sets aside, so a later 1EdTech erratum can be checked
against it. A reading that is not an information-model-over-XSD case says which document it follows instead and why.

8. **A match table entry's `target-value` is a value of the outcome's base type.** The XSD, and the information model's
   own attribute table for the entry, type `qti-match-table-entry/@target-value` as one of the base-type names
   (`boolean`, `directedPair` and so on). The information model's description of the same attribute calls it "the target
   value that is used to set the outcome when a match is found", as an interpolation table entry's `target-value` is,
   and the implementation guide's own examples write numbers there (`0.5`). This follows the information model's
   description and sets aside the XSD and the attribute table that matches it, with the guide's examples as supporting
   evidence: the base-type-name reading would make 1EdTech's examples invalid. (2026-11-04.)
9. **The Schematron's rules are read by their intent, not their text.** QTI's Schematron has rules that cannot do what
   they say: misspelled element names, rules that omit an ancestor, base-type tests that run against any declaration in
   the document instead of the one the content is bound to, an inline-choice rule whose test can never fail, a media
   rule that rejects `max-plays="0"` (unlimited), and a test of `@templateIdentifier` where the attribute is
   `template-identifier`. Each rule is implemented as its intent states it, over the bound declaration and the real
   ancestors, and the Schematron's text is not copied. This follows the intent that the information model's prose states
   for each rule and sets the Schematron's text aside, because a rule that never fires or always fails is a defect, not
   a requirement. (2026-11-04.)
10. **`aria-keyshorts` and `aria-keyshortcuts` are both accepted on empty elements.** The XSD, the information model's
    attribute table and the Schematron's allow-lists all name the attribute `aria-keyshorts` on the empty element
    families, a misspelling of ARIA's `aria-keyshortcuts`, which the information model's own description uses. A
    document with the correct ARIA spelling passes the XSD through its wildcard but fails the Schematron. This is not an
    information-model-over-XSD case: no document outranks another, so both spellings are accepted, the one written is
    kept, and it is exported as it was imported, because reading 1 refuses nothing valid. (2026-11-04.)
11. **A PCI's secondary module configuration is `secondary-configuration`.** The implementation guide calls the
    attribute `fallback-configuration`. The XSD and the information model call it `secondary-configuration`. This
    follows the XSD and the information model, which agree, and sets aside the implementation guide, so a document that
    writes `fallback-configuration`, as an item in 1EdTech's PCI example package does, is refused. The guide is the
    document that disagrees with both normative definitions. (2026-11-04.)
12. **Companion-material names are lowercase.** The implementation guide's examples write `Basic`, `Standard`,
    `Scientific` and `Graphing`, and the elements `qti-rule-system-SI` and `qti-increment-US`. The XSD and the
    information model write them in lowercase (`basic`, `qti-rule-system-si`, `qti-increment-us`). This follows the
    information model and the XSD, which agree, and sets aside the guide's examples, which are invalid against both.
    (2026-11-04.)
13. **A `data-*` attribute name is `data-[a-z0-9_.-]+`, with no namespace.** The information model's prose says the name
    is in no namespace and contains no uppercase ASCII letters. The pattern the information model gives for the same
    name, `(data-)[a-zA-Z0-9_\-\.]+`, allows uppercase, the XSD admits any attribute from any namespace, and the
    Schematron checks only the `data-` prefix. This follows the information model's prose and sets aside its own
    pattern, the XSD and the Schematron, because the prose states the rule and the other three are looser than it.
    (2026-11-04.)
14. **A text-entry interaction's `response-identifier` and `string-identifier` name response declarations, not
    `xs:IDREF`s.** The XSD, and the information model's attribute table for this one interaction, type both as
    `xs:IDREF` (UniqueIdentifierRef), while every other interaction's `response-identifier`, and an extended-text
    interaction's `string-identifier`, is a plain identifier. The information model describes `response-identifier` the
    same way for all of them: the response variable associated with the interaction. This follows that description and
    the other interactions, and sets aside the XSD and the text-entry attribute table. A response declaration's
    identifier is not an `xs:ID`, so the IDREF type would put a second reference rule on this one interaction and no
    other. (2026-11-04.)
15. **A `variable-identifier-ref` names an outcome declaration, not an `xs:ID`.** The XSD types
    `variable-identifier-ref` as `xs:IDREF`, which must match an `xs:ID` in the same document, and the information
    model's attribute table types it the same way (UniqueIdentifierRef). The information model's description calls it
    the identifier of an external variable that supplies the score, and outcome declarations' identifiers are not
    `xs:ID`, so the IDREF could never resolve. This follows the description and sets aside the XSD and the attribute
    table, because their type makes the attribute unusable. (2026-11-04.)
16. **`normal-maximum` is greater than zero.** The information model's prose says `normal-maximum` is positive. The
    XSD's type allows zero. This follows the information model and sets the XSD aside, because a normal maximum of zero
    cannot normalize a score, and where two normative sources differ the stricter one is the rule a valid document must
    meet. (2026-11-04.)
17. **A `view` list has at least one view.** The information model's prose requires at least one view. The XSD admits an
    empty list. This follows the information model and sets the XSD aside, with the stricter source deciding where both
    are normative. (2026-11-04.)
18. **An order or graphic-order interaction's `min-choices` is at least 1, and `max-choices="0"` is exempt from the
    count rule.** The information model's prose requires `min-choices` of at least 1 for these two interactions. The XSD
    allows 0. This follows the information model and sets the XSD aside. Separately, `max-choices="0"` means unlimited
    and is exempt from the rule that compares the counts, which is what the Schematron's rule intends, so the Schematron
    is followed for its intent and not its text (reading 9). (2026-11-04.)
19. **An extended-text interaction bound to a container has `max-strings`.** The XSD makes `max-strings` optional. The
    information model's prose requires it when the interaction is bound to a container (multiple or ordered
    cardinality). This follows the information model and sets the XSD aside, because the prose states the rule and the
    XSD cannot see the binding. (2026-11-04.)
20. **A PCI has exactly one `qti-interaction-markup`, which may be empty.** The information model's description calls
    the markup optional, while its multiplicity is `[1..1]`, the XSD requires it, and the implementation guide's
    examples write an empty one. This follows the multiplicity, which the information model and the XSD agree on, over
    the description's word "optional". This is not an information-model-over-XSD case: the conflict is inside the
    information model, and the XSD and the guide's examples show which half is meant. (2026-11-04.)
21. **`qti-repeat` has one or more operands.** The information model says `qti-repeat` takes "0 or more" sub-expressions
    in its operator overview and in two attribute descriptions, and "one or more" in its data definition, which states
    that at least one is required. The XSD requires at least one. This follows the information model's data definition,
    which the XSD agrees with, and sets aside the looser sentences. (2026-11-04.)
22. **A `qti-template-constraint` is a direct child of `qti-template-processing`.** The XSD admits
    `qti-template-constraint` inside `qti-template-if` and `qti-template-else`. The information model's prose allows it
    only as a direct child of `qti-template-processing`. This follows the information model's prose and sets the XSD
    aside, because the prose states the placement and the XSD is wider than it. (2026-11-04.)
23. **The eight outcome-only expressions are forbidden outside outcome processing.** The information model's prose says
    `qti-number-*`, `qti-outcome-minimum`, `qti-outcome-maximum` and `qti-test-variables` can be used only in outcome
    processing. The XSD admits them anywhere, and the Schematron forbids only three of them, and only under response
    processing. This follows the information model's prose and sets aside both the XSD and the Schematron's partial
    rule, because the prose is the only source that states the whole rule. (2026-11-04.)
24. **A test may hold a `qti-context-declaration`; the per-root profile XSDs are not a second validity test.** The test
    profile XSD drops `qti-context-declaration` from a test, and it rejects `qti-feedback-inline` inside
    `qti-test-feedback` content, where 1EdTech's own feedback test examples put it, although the full ASI XSD and the
    prose admit both. The full ASI XSD of the document's QTI version is the validator for every file, and the per-root
    profiles are not a second bar. This follows the full ASI XSD and the information model's prose and sets the profile
    XSDs aside, because content the information model admits must not be refused by a subset schema (reading 1).
    (2026-11-04.)
25. **A test's rubric and feedback hold no interactions or templates, and may print variables.** The full ASI XSD admits
    interactions and template content inside test rubric blocks and test feedback. The information model's prose and the
    test profile XSD forbid them. This follows the prose, with the test profile XSD agreeing, over the full XSD's wider
    type. Printed variables are allowed although the information model's description of test rubric content excludes
    them: its own test rubric class has a printed-variable child, the test profile XSD admits them, and the
    implementation guide's test rubric example prints one. This is the one place the profile XSD is followed.
    (2026-11-04.)
26. **An assessment section has at least one child.** The information model's prose requires at least one child. The XSD
    admits an empty `qti-assessment-section`. This follows the information model's prose and sets the XSD aside, with
    the stricter source deciding where both are normative. (2026-11-04.)
27. **`count-attempt` is a boolean.** The information model's description of `count-attempt` on
    `qti-end-attempt-interaction` reads as a count of attempts. Its type is boolean in both the XSD and the information
    model's own attribute table. This is not an information-model-over-XSD case: the conflict is inside the information
    model, and the type is followed because two sources give it and only one sentence reads otherwise. (2026-11-04.)
28. **A lookup operand is a single integer, float or duration, and an integer when the table is a match table.** The
    implementation guide's examples feed a lookup (`qti-match-table`, `qti-interpolation-table`) a string field. The
    information model's prose says the operand is a single integer, float or duration, and an integer for a match table.
    This follows the information model's prose and sets aside the guide's examples, which the type rules of the
    information model do not allow. (2026-11-04.)
29. **The built-in `duration` variable's type depends on where it is read.** The information model says an item's
    `duration` is a single float and a test, part or section's `duration` has base type duration. The results reporting
    specification's example reports a test's `duration` with the identifier and the base type swapped, and a section's
    `duration` as a float. Both information model sentences are followed, each at its own level: seconds as a float in
    an item, base-type duration in a test, part or section. The example is not followed. This is not an
    information-model-over-XSD case: the XSD does not type the variable, and the conflict is between the information
    model and an example in the results reporting specification. (2026-11-04.)
30. **QTI elements are admitted inside `m:annotation-xml`, and nowhere else beneath MathML.** `annotation-xml` is
    MathML's carrier for other XML vocabularies, and the XSD gives it a single lax wildcard (`mathml3-common.xsd`
    lines 42-44, `xs:any processContents="lax"`), so a QTI element there is valid. The implementation guide says so
    too: "At present, QTI's qti-printed-variable can be used within MathML and HTML." (`impl.txt` line 1045). Lax
    processing recognises only an element with a global declaration, and `qti-printed-variable` has none, so written
    directly inside `annotation-xml` it is accepted and kept as foreign content, while inside a `div` or `p` in the
    annotation it is read as a printed variable. An author who wants it interpreted wraps it in a `div` or `p`. A nested
    QTI root, processing root or manifest global stays foreign content, as reading 6 says. Outside
    `annotation-xml`, a `qti-` element beneath MathML is refused, because MathML's own content model does not admit it
    there. That is a MathML validity refusal (reading 2), not a rule of this reading. The information model's sentence,
    "Although it is impossible to embed objects such as printed variable ... within a math object" (`info.txt` line
    8670), is not a prohibition. It describes why the section that follows offers the math-variable technique, and it
    states no rule that conflicts with the wildcard or the guide, so there is nothing for the information model to
    outrank. The rule is: if the standard does not ban it, do not refuse it. (Corrected 2026-11-04 by decision 214,
    replacing the earlier reading, which refused every `qti-` element beneath MathML.)
    (Refined 2026-11-04 by decision 217.)
31. **A card holds at least one of an HTML content node or file hrefs, and may hold both.** The implementation guide
    says a card holds a single `qti-html-content`, or any number of `qti-file-href` nodes, and that it must contain at
    least some content. The XSD admits both together and neither. One of the guide's own examples has both. This follows
    the guide's "at least some content" over the XSD's empty card, and the XSD and the guide's example over the guide's
    "or", so both together is admitted. The same holds for each `qti-card-entry`. This is not an
    information-model-over-XSD case: the guide's sentence and its example disagree, and the XSD settles one side each.
    (2026-11-04.)
32. **`qtiMetadata` is accepted as a `cp:metadata` child or inside `lom`.** The XSD places `qtiMetadata` as a child of
    `cp:metadata`. The metadata specification and the metadata binding place it inside `lom`. Both forms validate.
    Neither document outranks the other, so both are accepted and the form is recorded and exported as it was imported,
    because reading 1 refuses nothing valid. (2026-11-04.)
33. **Packaged XSDs are listed as files, like every other file, and a `controlfile` resource is admitted.** The IMS
    Content Packaging 1.2 specification says a manifest shall describe all control files, and QTI's packaging rules
    require every file to be described. The implementation guide says packaged XSDs should not be described as separate
    resources. This follows Content Packaging, the specification the package is built on, and the QTI rule that every
    file is listed, with the guide's sentence read as advice ("should"), not a ban. A packaged XSD must be listed as a
    file, as every file must, and the `controlfile` resource type is admitted but not required. (2026-11-04.)
34. **A boolean written in `qti-value` is `true` or `false`.** `xs:boolean` also admits `1` and `0`. The information
    model lists a boolean's permitted values as `true` and `false`. The XSD does not decide this, because it types
    `qti-value` as untyped text, so this follows the information model, whose value list is the only source that speaks
    to it, and refuses `1` and `0`. (2026-11-04.)
35. **Absolute `file/@href` and `template-location` values are admitted, stored as URIs and never fetched.** The sources
    do not say whether an absolute `href` or `template-location` is acceptable in a valid package. Content Packaging
    allows external files, and the implementation guide says an absolute `template-location` is supported, with
    in-package templates as best practice. This follows the packaging specifications and the guide, which admit them,
    and the best-practice sentence is not read as a ban (reading 1). They are stored and never fetched on import.
    (2026-11-04.)
36. **One file may be listed by several resources, and a resource may list a file twice.** The sources say nothing about
    duplicate `file` entries or about one file listed by several resources, and the packages of 1EdTech's own examples
    do both. This follows the packaging specifications, which do not forbid either, so both are admitted (reading 1).
    (2026-11-04.)
37. **An identifier may contain `.`.** The normative prose reserves `.` for prefixing (`ITEMREF.VAR`) but does not say a
    declared identifier must not contain one, and the XSD's identifier type allows it. This follows the information
    model and the XSD, which admit it, and reads "reserved" as stated, not as a prohibition, because reading 1 refuses
    nothing valid. (2026-11-04.)
38. **A `qti-gap` appears only within a gap-match interaction.** The information model's normative prose says a
    `qti-gap` must only appear within a gap-match interaction. The XSD admits it in any phrasing container. This follows
    the information model's prose and sets the XSD aside. The rule also refuses a gap inside the gap text of a graphic
    gap-match interaction. Where the prose is silent, such as hottext placement or a gap text that contains gaps,
    nothing is refused. (2026-11-04.)
39. **An SSML `speak/@version` is `1.1`.** The SSML 1.1 Recommendation says `speak` "MUST have the value 1.1". QTI's
    core XSD types the attribute as `xs:NMTOKEN`. This follows the SSML Recommendation and sets the XSD aside, because
    the Recommendation defines the language and the XSD's type is wider than it. (2026-11-04.)
40. **SSML `meta`, `metadata` and `lexicon` come before everything else in `speak`.** The SSML 1.1 Recommendation says
    they "MUST occur before all other elements and text contained within the root `speak` element". The XSD's sequence
    orders the elements but cannot order text. This follows the SSML Recommendation, which defines the language, and
    sets aside the XSD, which is looser than it: they come before every other SSML child and before any text that is not
    whitespace. (2026-11-04.)
41. **An SSML `meta` has exactly one of `name` and `http-equiv`.** The SSML 1.1 Recommendation says either a name or an
    `http-equiv` attribute is required, and that providing both is an error. The XSD makes both optional. This follows
    the SSML Recommendation, which defines the language, and sets aside the XSD, which is looser than it. (2026-11-04.)
42. **An SSML `voice/@languages` holds language ranges, and `und` and `zxx` are refused.** The SSML 1.1 Recommendation
    defines the value as the empty string or a space-separated list of languages, each written `language` or
    `language:accent`, where each part is an Extended Language Range, and disallows `und` and `zxx`. The XSD types it as
    `xs:NMTOKENS` or the empty string. This follows the SSML Recommendation, which defines the language, and sets aside
    the XSD, which is looser than it. (2026-11-04.)
43. **An SSML `voice` or `prosody` has at least one attribute that survives fragment removal.** The SSML 1.1
    Recommendation says it is an error if no attributes are specified on `voice` or `prosody`. The XSD makes every
    attribute optional. This follows the SSML Recommendation, which defines the language, and sets aside the XSD, which
    is looser than it. The attribute counted is one the Recommendation's fragment removal keeps: an SSML attribute,
    `xml:lang` or `xml:base`. (2026-11-04.)
44. **An SSML `token` or `w` holds no `voice`.** The SSML 1.1 Recommendation says they can contain only text to be
    rendered and `audio`, `break`, `emphasis`, `mark`, `phoneme`, `prosody`, `say-as` and `sub`. The XSD's `tokenType`
    also admits `voice`. This follows the SSML Recommendation, which defines the language, and sets aside the XSD, which
    is looser than it. (2026-11-04.)
45. **An integer has no largest or smallest value.** QTI's integer base type is "the same as the set of values
    defined by the integer primitiveType", and the information model's data types define Integer as "derived from
    the 'decimal' data-type i.e. no decimal places", beside Int, "with a numeric value from -2147483648 to
    2147483647". Neither the information model nor the XSD bounds the integer base type. So every integer written as
    a value of base type integer, in `qti-value`, in `qti-base-value` or in a typed-value attribute of reading 7 such
    as `map-key`, is accepted and kept exactly, however many digits it has: `9007199254740993` and
    `9007199254740992` are two values, and so are `1000000000000000000000000000000` and
    `1000000000000000000000000000001`. A package never refuses an integer for its size, never rounds one to a float
    and never stores one as an infinity, and it compares and computes integer results exactly. This reading is
    about values. A count attribute such as `max-choices` is not a value of the integer base type: a shared reading of
    its own holds counts to the signed 64-bit range, read exactly, and refuses a count beyond it with its rule and
    location. An attribute the XSD types `xs:int`, such as `base`, keeps `xs:int`'s range. Where
    QTI's types make a result a float, an integer operand becomes the nearest float, and an integer beyond the
    largest finite float becomes the largest finite float of its sign. This is not a case of documents
    in conflict: the sources agree that the type is unbounded and say nothing of overflow, and this reading forbids
    a package to add a bound, so reading 1 holds without an exception. (2026-11-04.)
46. **A count attribute holds a signed 64-bit integer.** The count attributes (`max-choices`, `min-choices`,
    `max-associations`, `min-associations`, `match-max`, `match-min`, `max-plays` and `min-plays` on the interactions
    and choices that carry them, the order interactions' `min-choices` among them) and `figures` on `qti-round-to` and
    `qti-equal-rounded` are typed by the XSD as integers with no largest value (`xs:nonNegativeInteger`, and
    `xs:integer` for `figures`). A package holds each of them to the signed 64-bit range, -9223372036854775808 to
    9223372036854775807, read exactly, and refuses a count beyond it with its rule and its location. XML Schema permits
    this: a processor may set a limit on the number of digits it supports if it documents that limit, and must support
    at least 18 (XML Schema Part 2, section 3.2.3), and this reading is that documentation. Values are not counts: a
    value of base type integer stays unbounded and exact (reading 45). An attribute the XSD types `xs:int`, such as
    `base`, `colspan` or `qti-index`'s `n`, keeps `xs:int`'s range. This is not a case of documents in conflict: the
    XSD leaves the counts unbounded and XML Schema lets a processor document a limit, so reading 1 holds without an
    exception. (2026-11-04.)
47. **`xsi:type`, `xsi:nil` and `xsi:noNamespaceSchemaLocation` are accepted as XML Schema judges them, stored and
    exported byte for byte.** A document may carry the schema-instance attributes wherever XML Schema allows them, and
    it is valid QTI when it carries them validly. `xsi:type` is valid only when it names the declared type or a type
    derived from it. `xsi:nil` is valid only on an element that is nillable. Where QTI admits wildcard content, the
    wildcard's processing mode is the XSD's: under `skip` the content is not assessed, and under `lax` it is assessed
    only where a declaration is found. Each attribute is stored with its spelling and exported byte for byte. This
    follows reading 1: these attributes are valid wherever XML Schema allows them, so a document that carries them
    validly is valid QTI, and refusing it would refuse valid content. `xsi:schemaLocation` is already accepted. The
    sources are XML Schema Part 1 (W3C Recommendation, 28 October 2004): section 2.6 and its subsections 2.6.1
    (`xsi:type`), 2.6.2 (`xsi:nil`) and 2.6.3 (`xsi:schemaLocation` and `xsi:noNamespaceSchemaLocation`) define the
    attributes; section 3.3.4 (Element Locally Valid (Element)) holds the `xsi:nil` rule (clause 3, which needs
    `{nillable}`) and the `xsi:type` rule (clause 4, which needs a type derived from the declared one); section 3.10.1
    (the Wildcard Schema Component, `{process contents}`) and section 3.10.4 (Item Valid (Wildcard)) define `skip` and
    `lax`. This is not a case of documents in conflict: QTI's XSD is itself an XML Schema, so the XML Schema
    Recommendation decides what is valid in it. (2026-11-04.)
48. **A dotted reference is accepted when exactly one reading names a real item ref, test part or section and its
    variable.** Reading 37 lets an identifier contain `.`, so a prefixed reference such as `ITEMREF.VAR` can be split at
    more than one dot. Take a test whose item refs include `a` and `a.b`: `a.b.SCORE` could be item ref `a.b` with
    variable `SCORE`, or item ref `a` with variable `b.SCORE`. When only one of those readings names a real item ref and
    a variable that item has, that reading is meant, and the reference is accepted. The same holds when a reading's
    prefix names a test part or a section, as in a section's `duration`: every reading that resolves counts. When both
    resolve, QTI itself leaves the case ambiguous, and the document is refused with a refusal that names both readings.
    This binds the renderer the same way as the qti package, so the two never read the same file differently. This is
    not a case of documents in conflict: the specification reserves `.` for prefixing and says nothing of splitting a
    reference at a dot, so this reading fills the gap and keeps every unambiguous reference valid, as reading 1
    requires. (2026-11-04.)
49. **QTI and foreign elements beneath MathML and in card content are admitted wherever the schema admits them.**
    Inside `m:annotation-xml` this is reading 30. In card content (`qti-html-content` of a `qti-card` or
    `qti-card-entry`) the same basis applies: an element is accepted wherever the schema admits it and no normative text
    bans it, and refused only where the schema or a normative rule refuses it. In the XSD, card content has no wildcard
    of its own: `HTMLContentDType` lists only HTML, MathML and SSML elements (`imsqti_asiv3p0p1_v1p0.xsd` lines
    28247-28330). QTI elements are admitted there where the HTML the schema admits there declares them: a block-level
    `div` (`DivDType`, lines 26673-26794) declares 28, every block interaction among them, and text-level HTML
    (`HTMLTextDType`, lines 28332-28401) declares 9, the inline ones, `qti-printed-variable` (line 28344) among them. A
    foreign or QTI element placed directly in `qti-html-content`, or anywhere else no declaration or wildcard reaches,
    is refused because the schema refuses it. Beneath `m:math` the only wildcard is `annotation-xml`'s, so MathML's content model refuses
    any other placement. This binds the renderer the same way as the qti package, so the two accept and refuse the same
    file. (Corrected 2026-11-04 by decision 214, replacing the version merged earlier that day under decision 212.) (Wording corrected 2026-11-04, decision 218; the rule is decision 216's.)
50. **Two `xsi:type` cases are accepted without a check: a complex type under a lax wildcard, and `xs:ENTITY`.** This
    extends reading 47. Under a `lax` wildcard, foreign content whose `xsi:type` names a resolved complex type is
    accepted without being checked against that type. Checking it would take a general XML Schema validator, which is
    its own phase, so this is a known limit, to be revisited if a real package needs it. `xsi:type="xs:ENTITY"` is
    accepted as written, unverified. XML Schema requires the value to be a declared entity name, one of the DTD's
    unparsed entities, and neither package reads the DTD's unparsed-entity declarations, so neither can tell. The rule
    behind both is the operator's, decision 227: "if the standard does not ban it, do not refuse it"; where we cannot
    tell, prefer accepting over refusing and record the limit. Refusing what cannot be shown invalid would refuse
    content that may be valid, and reading 1 forbids that. Both limits bind pantry and plate alike, so the two never
    read the same file differently. The sources are XML Schema Part 1 (W3C Recommendation, 28 October 2004): section
    3.10.4 (Item Valid (Wildcard), clause 1) defines `lax` as assessing an item only where a declaration is found,
    and section 3.14.4 (String Valid, clause 2.1) holds the declared-entity-name constraint on `ENTITY`, defined
    just after it as "declared entity name". This is not a case of documents in conflict: the XML Schema Recommendation
    decides what is valid, and what it requires is beyond what this package can read. (Decision 227, 2026-11-05.)
51. **The six response-processing templates the information model publishes are built in, named by file name under
    either published prefix.** The information model lists six standard templates (section 2.5.1, Response Processing
    Templates): `match_correct`, `map_response` and `map_response_point`, and the Common Cartridge templates
    `CC2_match`, `CC2_match_basic` and `CC2_map_response`, each with its full URL under
    `https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/`. It says an engine that does not run general response
    processing can implement these templates instead. The implementation guide's examples address them under
    `https://www.imsglobal.org/question/qti_v3p0/rptemplates/`. A `template` URI names a built-in template when, with
    its whitespace collapsed (the XSD types it `xs:anyURI`, whose whitespace facet is `collapse`: XML Schema Part 2,
    section 4.3.6), it is one of those two prefixes followed by the template's name, with or without `.xml`. plate
    holds each template's rules, taken from its published file, and never fetches the URI. Any other `template` URI
    names no built-in template: the item is accepted and its response processing is marked unsupported, so its outcomes
    keep their defaults. This binds plate, which runs response processing. pantry runs none: it records which published
    template a `template` URI names, and it already names the same six under the same two prefixes, so the two agree.
    This is not a case of documents in conflict: the information model names the templates, and the guide's examples
    use a second spelling of their address. (The renderer's phase-3 default, delivery spec section 5.1, applied in
    plate; 2026-11-04.)
52. **An area mapping holds a point on a shape's boundary, maps a point by the first area listed that holds it, maps
    each area once, and adds `default-value` once for each distinct point in no area.** The information model says
    `qti-map-response-point` tests the points "against each area in turn" and that, when mapping containers, "each area
    can be mapped once only" (section 2.11.1.6, Map Response Point Expression), and that areas listed first take
    priority where areas overlap and a point falls in the intersection (section 5.5.4, the `qti-area-map-entry`
    attribute of AreaMapping). An area mapping's attributes mean what a mapping's do (section 5.5), and a mapping's
    `default-value` is used "when no explicit mapping for a source value is given" (section 5.88.3). The information
    model says nothing of a point on an area's edge, nor of how often a point in no area adds `default-value`. This
    reading fills both. A point on the boundary of a `rect`, `circle`, `ellipse` or `poly` is inside it, and `default`
    holds every point, as "the entire area of the associated image" (section 8.29, ShapeEnum). Areas are tried in
    document order, the first that holds a point maps it, and each area is mapped at most once. Each distinct point
    that falls in no area adds `default-value` once, as `qti-map-response` counts a repeated value once (section
    2.11.1.5). The sum is then held to `lower-bound` and `upper-bound`, and a NULL response maps to 0 before the bounds
    apply. This binds plate, which scores; pantry scores nothing. This is not a case of documents in conflict: the
    information model is silent on these points, and no other document speaks to them. (The renderer's phase-3
    default, delivery spec section 5.1, applied in plate; 2026-11-04.)
53. **`max-strings="0"` places no limit on the number of strings.** For an extended-text interaction bound to a
    container, the information model says a delivery engine "must use the value of this attribute to control the
    maximum number of separate strings accepted from the candidate" (section 5.48.6), and gives `0` no meaning. The
    XSD types `max-strings` as `xs:nonNegativeInteger`, so `0` is valid. Read literally, `0` accepts no string and
    leaves an interaction no candidate can answer. The information model's other counts read `0` as no restriction:
    "If max-choices is 0 then there is no restriction" (section 5.30.2), and `max-associations` (section 5.8.2) and
    `match-max` (section 5.7.8) say the same. This reading reads `max-strings` the same way, so a response is never
    refused for the number of its strings when `max-strings` is `0`. This binds plate, which delivers; pantry stores
    `max-strings` as written and delivers nothing. This is not a case of documents in conflict: the information model
    is silent on `0` here, and this follows its own reading of `0` for every other count. (The renderer's phase-3
    default, delivery spec section 5.1, applied in plate; 2026-11-04.)
54. **A `pattern-mask` on an `integer` or `float` binding is matched against the value, written in one form, not the
    text as typed.** The information model says the mask "specifies a regular expression that the candidate's response
    must match in order to be considered valid" (sections 5.48.4 and 5.162.5), and does not say whether, for a numeric
    response, that is the text the candidate typed or the number it names. This reading matches the number: the posted
    text is read as the binding's base type, written back in one form, and that form is matched. An integer is written
    as its decimal digits, with `-` for a negative and no `+` or leading zero, which is XML Schema's canonical integer
    form (Part 2, section 3.3.13.2). A float is written as the shortest decimal that reads back to the same double, as
    JavaScript writes a number (`1.5`, `100`, `1e+21`), with `INF`, `-INF` and `NaN` by name. That is not XML
    Schema's canonical double form (section 3.2.5.2), which writes `1.0E2`. A `string` binding is matched as the
    candidate typed it, its line breaks made LF, and each member of a container is matched on its own. The form is
    weaker than an author's mask in one direction and stricter in the other. On a `float` binding `1e2` is matched as
    `100` and `+5` as `5`, so a mask that forbids `e` and `+` admits both. On an `integer` binding `007` is matched as
    `7`, so `[0-9]{3}` refuses what the candidate typed. This binds plate, which checks responses; pantry stores
    `pattern-mask` as written and checks no response. This is not a case of documents in conflict: the information
    model leaves the matched text open. (The renderer's phase-3 default, delivery spec section 5.1, applied in plate;
    2026-11-04.)
55. **In a `pattern-mask`, a category escape follows the Unicode version the engine ships, and `\i` and `\c` follow
    XML 1.0 Fifth Edition's name characters.** The information model takes `pattern-mask`'s language from Appendix F of
    XML Schema Part 2 (sections 5.48.4 and 5.162.5). In XML Schema Part 2 (W3C Recommendation, 28 October 2004),
    Appendix F defines `\p{X}` and `\P{X}` by the Unicode Database's General Category property (section F.1.1,
    production [25]), and `\d` and `\w` through them; its normative reference is the Unicode Character Database 3.1.
    It says a minimally conforming processor must support the version current when it became a Recommendation, and
    "implementors are encouraged to support the character properties defined in any future version". It defines `\i`
    as the characters matched by `Letter | '_' | ':'` and `\c` as those matched by `NameChar`, the productions of XML
    1.0 Second Edition, its normative reference. XML 1.0 Fifth Edition replaced those with `NameStartChar` and
    `NameChar` (productions [4] and [4a]) and left the old character classes orphaned (Appendix B). This reading takes
    the later version of each: a category escape follows the Unicode version of the JavaScript engine plate runs on,
    `\i` is Fifth Edition's `NameStartChar` and `\c` its `NameChar`. A block escape (`\p{IsBasicLatin}`) keeps Part 2's
    own block table, and `\s` keeps its four characters. This binds plate, which checks responses against
    `pattern-mask`; pantry stores the pattern as written and checks none. This is not a case of documents in conflict:
    XML Schema encourages the later Unicode version, and XML 1.0's current edition defines the name characters. (The
    renderer's phase-3 default, delivery spec section 5.1, applied in plate; 2026-11-04.)
56. **An `xs:double` literal beyond the largest finite double names the largest finite double of its sign; only `INF`
    and `-INF` name the infinities.** XML Schema Part 2 says a literal representing a decimal number d "maps to the
    normalized value in the value space of double that is closest to d" (section 3.2.5), and gives the infinities the
    lexical representations `INF` and `-INF` (section 3.2.5.1). The value closest to `1e400` is the largest finite
    double, about 1.8 × 10^308, so `1e400` names it, and `-1e400` names its negative. JavaScript's `Number` reads
    `1e400` as an infinity, so a package that reads some doubles with it and others by XML Schema's mapping reads one
    literal two ways; this reading picks XML Schema's. It holds wherever a package reads an `xs:double` literal: an
    attribute the XSD types `xs:double`, such as `normal-maximum`, and a value of base type float, which both packages
    read in `xs:double`'s lexical space. It agrees with reading 45, under which an integer beyond the largest finite
    float becomes the largest finite float of its sign. This binds pantry and plate alike, so the two never read the
    same file differently; plate is the only implementation so far. This is not a case of documents in conflict: XML
    Schema decides how its own literal maps to a value. (The renderer's phase-3 default, delivery spec section 5.1,
    applied in plate; 2026-11-04.)
57. **In lax wildcard content, every prose rule judges the QTI elements the structural walk checks there, as it judges
    them anywhere else.** Under a `lax` element wildcard, such as the content of `qti-custom-interaction`, XML Schema
    assesses an element against its declaration when one is found, and only then (XML Schema Part 1, section 3.10.1,
    the Wildcard Schema Component's `{process contents}`, and section 3.10.4, Item Valid (Wildcard), clause 1). A QTI
    element with a global declaration there is checked as QTI, except a nested QTI root, which stays foreign content
    (reading 6). A QTI element declared only locally, such as `qti-choice-interaction`, has no declaration lax
    processing can find, so it is passed over and its children are assessed in turn, as reading 30 says of
    `qti-printed-variable` in `annotation-xml`. The information model does not say whether the rules it states in
    prose, beyond the XSD, reach the elements lax content checks, in particular whether the item-wide rules reach into
    a custom interaction's content. This reading says they do: the prose rules judge exactly the elements the walk
    checks, no more and no fewer. An interaction checked there must bind a declared response of a fitting type, its
    identifiers count toward the item's unique identifiers, and every other rule applies as it does anywhere in the
    item. Content the walk passes over is not judged. Rendering does not change: a custom interaction's content is
    still not rendered. This binds pantry and plate alike, so the two never judge the same file differently; plate is
    the only implementation so far. This is not a case of documents in conflict: XML Schema decides which elements
    lax content checks, and the information model's rules for a QTI element do not depend on where it sits. (The
    renderer's phase-3 default, delivery spec section 5.1, applied in plate; 2026-11-04.)
58. **In a `pattern-mask`, a `{` or `}` that does not open or close a repetition count is not a regular expression;
    the author writes `\{` or `\}`.** The information model takes `pattern-mask`'s language from Appendix F of XML
    Schema Part 2 (sections 5.48.4 and 5.162.5). Appendix F defines a metacharacter as one of `.`, `\`, `?`, `*`, `+`,
    `{`, `}`, `(`, `)`, `[` or `]`, and a normal character as any XML character that is not a metacharacter. Its
    production [10] `Char`, `[^.\?*+()|#x5B#x5D]`, leaves `{` and `}` out of the characters it excludes, so the
    definition refuses a lone `{` and the production admits it. This follows the definition, as XML Schema 1.1 does:
    its Part 2 (W3C Recommendation, 5 April 2012) excludes `{` and `}` in production [73] `NormalChar` (Appendix G.3).
    Production [24] `SingleCharEsc` lets `\{` and `\}` stand for the characters themselves. A pattern this refuses
    does not make the document invalid, because the XSD types `pattern-mask` as `xs:string`: plate keeps the
    interaction and shows its `pattern-mask` notice in place of checking responses against the pattern. This binds
    pantry and plate alike, so the two never read the same pattern differently; plate is the only implementation so
    far, because pantry stores `pattern-mask` as written and checks no pattern. This is a conflict inside one
    document, XML Schema 1.0's Appendix F, and that document's next version settles it. (The renderer's phase-3
    default, delivery spec section 5.1, applied in plate; 2026-11-05.)
59. **An area's `coords` that do not fit its shape are read as the HTML Standard's image-map processing reads an
    `area`'s.** The information model gives each shape's coordinates (section 7.9, Coords, and section 8.29,
    ShapeEnum): `rect` is left-x, top-y, right-x, bottom-y; `circle` is center-x, center-y, radius; `poly` is x1, y1
    to xN, yN, closed when its last pair differs from its first; `ellipse` is center-x, center-y, h-radius, v-radius,
    and is deprecated "as it is not defined by XHTML"; and `default` takes none. It takes the lengths from XHTML 1.1.
    The XSD requires `coords` on every area and admits three, four, or an even number of six or more non-negative
    integers or percentages (`CoordsDType`), whatever the shape, and nothing says what an area means whose
    coordinates do not fit it. This reading follows the HTML Standard's image-map processing model (section 4.8.14.2,
    Processing model). An area with fewer coordinates than its shape needs (four for `rect`, three for `circle`, six
    for `poly`, and four for `ellipse`) holds no point. Coordinates beyond those are ignored, a `default` area's among
    them, and a `poly` with an odd count drops its last. A `rect`'s corners may come in either order. A `circle`
    whose radius is 0 holds no point, and so does an `ellipse` with either radius 0. A `poly` is filled by the
    even-odd rule, and a point on its edge is inside (reading 52). This binds plate, which scores; pantry scores
    nothing. This is not a case of documents in conflict: QTI is silent, and HTML, where its shapes come from, decides.
    (The renderer's phase-3 default, delivery spec section 5.1, applied in plate; 2026-11-05.)
60. **Under a `lax` wildcard, an element no global QTI declaration checks, whose `xsi:type` names a built-in simple
    type of XML Schema, has its text accepted without a check.** This extends reading 50, which accepts such an
    element without a check when its `xsi:type` names a complex type. XML Schema assesses an element that has no
    declaration but carries an `xsi:type` naming a type it can resolve against that type (XML Schema Part 1, section
    3.3.4, Schema-Validity Assessment (Element), clause 1.2). Under a simple type the element must hold no attribute
    but the four `xsi:` ones, no element child, and text valid for the type (section 3.3.4, Element Locally Valid
    (Type), clause 3.1). plate does not check an element's text against a simple type, so it cannot tell whether the
    text is valid, and by reading 50's rule the text is accepted unchecked, a known limit. The attribute and child
    rules can be checked, so they stand. `xsi:type="xs:anyType"`, and an `xsi:type` that resolves to no type, do not
    count: XML Schema then assesses the element laxly, against the ur-type definition (section 3.3.4, Schema-Validity
    Assessment (Element), after clause 2), which is the lax walk itself, so its children are assessed laxly in turn.
    This binds pantry and plate alike, so the two never read the same file differently. plate is the only
    implementation so far, and it still keeps such an element unchecked with everything below it, attributes and
    children included. This is not a case of documents in conflict: XML Schema decides what is valid, and only the
    text is beyond what a package here can check. (The renderer's phase-3 default, delivery spec section 5.1, applied
    in plate, narrowed to the text by XML Schema Part 1, section 3.3.4; 2026-11-05.)
61. **An element in QTI's own namespace inside `qti-ordering`'s extension slot is valid.** The information model says
    the slot's child tags "may be new tags and reused QTI ASI tags" (section 5.98.3, the `extensions` attribute of the
    Ordering class), though the XSD admits only other namespaces there. Such an element is kept as the slot's extension
    content, not read as QTI ordering. `qti-selection`'s slot is not covered: its information model text says the child
    tags "must be new tags i.e. not reused QTI ASI tags" (section 5.129.4). (2026-11-06.)
62. **An item's or test's identifier and title must equal those its package's LOM metadata gives it, where that metadata gives one; a package where they differ is invalid and is refused.** The information model says of the item identifier (section 4.1.1) that "the two MUST be the same", and the same of the test identifier (section 4.4.1) and the item title (section 4.1.2: "these two MUST be the same"). The metadata binding says the identifier and title "must" match the object's own (sections 2.7.1.1, #Gen1, and 2.7.1.2, #Gen2). A resource whose metadata gives no identifier or title is outside the rule. (2026-11-06.)
