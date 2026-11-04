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
30. **A printed variable is not admitted inside `m:math`.** The information model says it is impossible to embed objects
    such as printed variables within a math object. The implementation guide says otherwise, and the XSD admits QTI
    content inside MathML only through the lax wildcard of `annotation-xml`. This follows the information model and sets
    aside the guide and the wildcard, so no `qti-` element is admitted anywhere beneath MathML. (2026-11-04.)
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
