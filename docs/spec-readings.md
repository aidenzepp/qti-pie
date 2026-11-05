# Specification readings

How this repository reads QTI 3.0 and the languages it embeds where a specification is silent, ambiguous or split
between its schema and its prose. Every package follows these readings: the qti package when it accepts or refuses a
document, and the renderer when it renders one, so the two never disagree about the same file. Each reading is an
operator ruling, or a decision read from the normative text under the operator's standing ruling of 2026-11-05 that
the spec wins, recorded in the pull request that lands it. A new reading lands here by pull request.

## Validity

1. **Nothing valid is refused.** Content that is valid QTI 3.0, including every language QTI embeds, is accepted.
   There are no exceptions. Content that is not valid is refused. (2026-10-30, restated without exceptions 2026-11-03.)
2. **MathML validity is the MathML 3 Recommendation**: its RelaxNG schema and its prose rules, not only the MathML XSD
   that QTI's schema imports. MathML that breaks a rule of the Recommendation, such as an operator applied to the wrong
   number of arguments or a piecewise expression with two `otherwise` parts, is invalid even when the QTI XSD accepts it.
   (2026-11-02.)
   Where the RelaxNG and the XSD differ, the RelaxNG, the normative schema, is followed in both directions (2026-11-05,
   with §2.1.5.1's notation below). The two were compared on 2026-11-05 (the RelaxNG at
   https://www.w3.org/Math/RelaxNG/mathml3/): their attributes agree name for name, use and type, and their content
   models differ in exactly the cases below. MathML's own rules are enforced where they are unambiguous:
   - the RelaxNG's two element interleaves, `bvar` (one annotated variable and at most one `degree`, in either order,
     `mathml3-content.rnc` line 23) and `piecewise` (at most one `otherwise`, anywhere among its pieces, line 60), which
     the XSD widens to repetitions;
   - `interval` among the qualifiers: the RelaxNG's `DomainQ` is `(domainofapplication|condition|interval|(lowlimit,
     uplimit?))*` (line 41), and trang drops `interval` from it ("Ambiguous content model altered (interval)",
     `mathml3-content.xsd` line 92). So in `apply` and `bind` (lines 29 and 31), `lambda` (103), `set` and `list` (230
     and 231) and `vector`, `matrix` and `matrixrow` (325 to 327) an interval a qualifier follows is a qualifier, and an
     interval is otherwise an argument;
   - `annotation-xml` holds `(MathExpression|anyElement)*` (`mathml3-common.rnc` lines 59 and 61): any number of
     children, no text, each a math expression or an element in a namespace other than MathML's. The XSD's one lax
     element ("content model altered for libxml (annotation-xml)", `mathml3-common.xsd` line 42) is set aside. A QTI
     element directly inside is still read by its declaration, as reading 30 reads the wildcard;
   - `semantics` is a content expression: the RelaxNG's `ContExp` names `semantics-contexp`, whose first child is a
     content expression (`mathml3-strict-content.rnc` lines 14 and 23), and the XSD drops it ("Ambiguous content model
     altered (ContExp)", `mathml3-strict-content.xsd` line 8). So a `semantics` stands wherever a content expression
     does, and there its first child is one. A bound variable's `semantics` is `semantics-ci` (line 20), whose first
     child is `ci` or another of its own, in the XSD as in the RelaxNG;
   - `math` is MathML's one root: the RelaxNG's only start pattern is `math` (`mathml3-common.rnc` line 15), and §2.2
     says "All other MathML content must be contained in a math element … it is an error for one math element to
     contain another". The XSD declares every MathML element globally, so its lax wildcards admit a bare `m:mi`. Here a
     wildcard admits no MathML element but `math`, and no `math` sits inside another. With `anyElement`, this bars
     MathML anywhere inside foreign content in `annotation-xml`;
   - the notation types of §2.1.5.1 over the XSD's: `unsigned-integer` is "a string of decimal-digits",
     `positive-integer` one "not consisting solely of "0"s", and `integer` "an optional "-" (U+002D), followed by a
     string of decimal digits". The XSD types them `xs:unsignedLong`, `xs:positiveInteger` and `xs:integer`
     (`mathml3-presentation.xsd` lines 93, 133 and 96), which admit a `+`, and `-0` for the first (reading 64). A value
     meets both, so `length`, `columnspan`, `rowspan`, `selection`, `position`, `shift` and `index` take the notation's
     lexical space within the type's bounds, whitespace collapsed as the type collapses it (§2.1.5.1 asks only that
     outer whitespace "should be avoided"). `scriptlevel`, of the XSD's `m:integer` too, keeps its sign, because its
     own row states `( "+" | "-" )? unsigned-integer` (§3.3.4.2). `number` is not one of the three, and stays the XSD's
     `xs:decimal`;
   - each operator's argument count under `apply`, by its class (MathML 3 §4.1.5, §4.3.4.5 and §4.3.4.6), for an
     `apply` that holds no qualifier but its operator's own. `moment` is left out, because the Recommendation's own
     example (§4.4.8.6) applies it to five arguments.
     Every other difference between the Recommendation's prose and the MathML XSD is decision D12's ruled gap.

## Scope of names and references

3. **In SSML, "the document" is each `speak` fragment.** An item may hold several `speak` fragments. SSML's rules
   that speak of the document (a `mark` name defined once, `startmark` and `endmark` naming a defined mark, a `lookup`
   naming a `lexicon`) apply within one fragment. Two fragments may each define `mark name="a"`. A reference from one
   fragment to a mark or lexicon in another does not resolve. (2026-11-03.)
   A `mark` name may repeat within a fragment. Only a `startmark` or `endmark` must name a mark defined once in its
   fragment (SSML 1.1, §3.1.1.1).
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
   The Schematron's two ARIA role rules (no `role` on `source`; `h1`'s `role` limited to `heading`, `tab` or
   `presentation`) are not followed: the operator ruled on 2026-11-05 that attributes follow the XSD exactly, and those
   rules encode HTML's ARIA conformance prose, which QTI's XSD admits and does not restate.
   The Schematron's extension-attribute lists bind, read by their intent as reading 81 states.
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
14. **A text-entry interaction's `response-identifier` and `string-identifier` are `xs:IDREF`s, as the XSD types them.**
    The XSD, and the information model's attribute table for this interaction, type both as `xs:IDREF`
    (UniqueIdentifierRef). A response declaration's `identifier` is `UniqueIdentifierDType`, a restriction of `xs:ID`
    (3.0.1 line 30814, 3.0.0 line 30664), so each reference resolves to the declaration it names, as the information
    model describes, and an element `id` equal to a response identifier is a duplicate ID and invalid. This follows the
    XSD exactly. _(Restated by the operator, 2026-11-05: the earlier reading's premise, that a response declaration's
    identifier is not an `xs:ID`, contradicted both XSDs.)_
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
18. **An order or graphic-order interaction's `min-choices`, where written, is from 1 to its number of choices, and a
    `max-choices` written beside it is from `min-choices` to its number of choices.** The information model says of
    both interactions: "If specified, min-choices must be 1 or greater but must not exceed the number of choices
    available. If unspecified, all of the choices must be ordered and max-choices is ignored", and "Used in
    conjunction with min-choices, if specified, max-choices must be greater than or equal to min-choices and must not
    exceed the number of choices available" (sections 5.97.2 and 5.97.3, OrderInteraction; sections 5.61.1 and 5.61.2,
    GraphicOrderInteraction). The XSD allows `min-choices="0"`. This follows the information model and sets the XSD
    aside. The number of choices is the interaction's `qti-simple-choice` or `qti-hotspot-choice` children. A
    `max-choices` with no `min-choices` beside it is ignored, so no rule reads it. Neither interaction gives `0` the
    meaning "no restriction" that the choice interaction's `max-choices` has (section 5.30.2), so a `max-choices="0"`
    beside a written `min-choices` is below it and is refused. The Schematron's rules for the two (5Ba and 8Ba,
    `not(not(@max-choices=0) and @max-choices < @min-choices)`) exempt 0, and the information model outranks the XSD
    that embeds them, so the exemption is set aside. (2026-11-04; restated 2026-11-05 under "the spec wins": the earlier
    text exempted `max-choices="0"` by the Schematron's rule, without the information model's sentence, which has no
    exemption, and did not bound either count by the choices.)
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
39. **An SSML `speak/@version` is `1.1`.** The SSML 1.1 Recommendation says `speak` "must have the value "1.1"". QTI's
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
    `xs:NMTOKENS` or the empty string. SSML's own conformance criteria make a document adhere to the Recommendation
    "including the constraints expressed in the" schema of its Appendix D, which "is normative" (sections 2.2.1 and
    2.2.2), and that schema's `languages.datatype` is the same union (`ssml/synthesis-nonamespace.xsd` lines 338-340,
    as in the W3C's own copy). So a value is valid only where both admit it. The Recommendation narrows each NMTOKEN to
    a range, compared without regard to case (RFC 4647, section 2), so `UND` and `Zxx` are refused too. The schema
    refuses the `*` subtag an Extended Language Range allows (RFC 4647, section 2.2), since `*` is no XML name
    character, so `*`, `en-*` and `*-US` are refused. (2026-11-04; restated 2026-11-05 under "the spec wins": the
    earlier text said the XSD was looser than the Recommendation, which it is not for `*`.)
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
    The unsplit reading counts among them: a test-level reference also names the test's own variable of that whole
    identifier, declared in the test or built in, because a variable expression first "looks up the value of an item
    variable that has been declared in a corresponding variable declaration or is one of the built-in variables", and
    only then describes prefixing (information model, section 2.11.1.2). So in a test that declares `a.b` and holds an
    item ref `a` whose item declares `b`, the reference `a.b` is ambiguous and is refused. Not counting it would leave
    a test variable named `a.b`, which reading 37 admits, with no reference that reaches it. A numbered reading counts
    only as reading 79 says, and a name a test reaches through two placements of one section document has one
    resolution for each placement (reading 77). (Restated 2026-11-05 under "the spec wins".)
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
60. **Under a `lax` or `strict` wildcard, an element no global declaration checks is judged by its `xsi:type`: a
    simple type it names governs its text and is checked, a complex one is reading 50's limit, and a name the schemas
    do not define leaves it to lax assessment under `lax` and makes it invalid under `strict`.** This extends reading
    50, which accepts such an element without a check when its `xsi:type` names a complex type. XML Schema assesses an
    element that has no declaration but carries an `xsi:type` whose value is a QName resolving to a type definition
    strictly against that type (XML Schema Part 1, section 3.3.4, Schema-Validity Assessment (Element), clause 1.2). The
    types it can name are XML Schema's built-ins and those of the document's schema set (reading 72). Reading 72's
    refusal under `strict` is of an element that carries no such `xsi:type`: the wildcard requires "a top-level
    declaration for the item available, or the item must have an xsi:type, and the item must be valid as appropriate"
    (section 3.10.1), and an element that clause 1.2 assesses has a known validity. So:
    - A simple type, built into XML Schema or defined by the schema set: the element holds no attribute but the four
      `xsi:` ones, no element child, and text valid for the type (section 3.3.4, Element Locally Valid (Type), clause
      3.1). All three are checked, the text through the type's own domain.
    - A complex type: reading 50 holds, under `strict` as under `lax`, and the element is accepted without a check
      against the type. `xsi:type="xs:anyType"` names the ur-type, so its element is assessed as the lax walk assesses
      it, its children laxly in turn.
    - A QName, with a bound prefix or none, that names no type of the schemas: clause 1.2 fails. Under `lax` the
      element is laxly assessed against the ur-type definition (section 3.3.4, after clause 2), which is the lax walk
      itself, so it is valid and its children are assessed laxly in turn. libxml2, whose `xmllint` is the validity
      oracle, refuses it ("does not resolve to a type definition"); that verdict is recorded against this reading, not
      counted as a defect. Under `strict` the element's declaration is `mustFind`, and an element of unknown validity
      there makes its parent invalid (section 3.3.5, [validity], clause 1.1.3), so the document is refused.

    A prefix that no declaration in scope binds makes the `xsi:type` attribute itself invalid (reading 74).

    Two limits remain in pantry, each an exception to reading 1, stated here as a known limit:
    - `xs:NOTATION`'s value space is "the set of QNames of notations declared in the current schema" (XML Schema Part
      2, section 3.2.19), and no pinned XSD declares a notation, so the type holds no value and no text of an element
      it governs is valid. The domain compiler states no empty domain, so a foreign element whose `xsi:type` names
      `xs:NOTATION` is left ungoverned and its text unchecked, where XML Schema refuses it. It is closed when the
      compiler states the empty domain.
    - An element of a kind reads its `xsi:type` against every type the pinned schemas of its version define, not only
      those of its document's schema set, because `XsiType` is keyed by version. So
      `<qti-description xsi:type="ud:ValueDType">` in an item is accepted and governed by the usage-data type, though
      the item's set does not import usage data and its `xsi:type` names no type there (section 3.3.4, Element Locally
      Valid (Element), clause 4.2). This is reading 72's limit, the grammar keyed by version and not by schema set,
      extended to the types an `xsi:type` names, and it closes with that limit.

    This binds pantry and plate alike. pantry checks all of it but those two limits. plate does not yet check the text:
    it refuses element children and attributes other than the four `xsi:` ones, and accepts the text unchecked; that is
    plate's open limit against this reading, for plate's own goal to close, not a second reading. This is not a case of
    documents in conflict: XML Schema decides what is valid. (The renderer's phase-3 default, delivery spec section 5.1,
    applied in plate, narrowed to the text by XML Schema Part 1, section 3.3.4; 2026-11-05. Restated 2026-11-05 under
    "the spec wins": the text is checked, which closes the limit the reading first recorded, and the `strict` wildcard
    and an `xsi:type` naming no type are decided. The two limits are recorded 2026-11-05, from seat QS's findings.)

61. **An element in QTI's own namespace inside `qti-ordering`'s extension slot is valid.** The information model says
    the slot's child tags "may be new tags and reused QTI ASI tags" (section 5.98.3, the `extensions` attribute of the
    Ordering class), though the XSD admits only other namespaces there. Such an element is kept as the slot's extension
    content, not read as QTI ordering. `qti-selection`'s slot is not covered: its information model text says the child
    tags "must be new tags i.e. not reused QTI ASI tags" (section 5.129.4). (2026-11-06.)
62. **An item's or test's identifier and title must equal those its package's LOM metadata gives it, where that metadata gives one; a package where they differ is invalid and is refused.** The information model says of the item identifier (section 4.1.1) that "the two MUST be the same", and the same of the test identifier (section 4.4.1) and the item title (section 4.1.2: "these two MUST be the same"). The metadata binding says the identifier and title "must" match the object's own (sections 2.7.1.1, #Gen1, and 2.7.1.2, #Gen2). A resource whose metadata gives no identifier or title is outside the rule. (2026-11-06.)
63. **Item session control is resolved attribute by attribute: each of its seven attributes comes from the nearest
    element that writes it.** For an item ref, each attribute of `qti-item-session-control` is taken from the item ref,
    then from each enclosing section from the innermost out, then from the test part, and from its default only where
    none of them writes it. A section or item ref that writes only `max-attempts` keeps the part's `show-feedback`. The
    information model says these constraints can be given for an item ref, a section or a whole test part, that "a
    setting at qti-test-part level affects all items in that part unless the setting is overridden at the
    qti-assessment-section level or ultimately at the individual qti-assessment-item-ref", and that the defaults "are
    used only in the absence of any applicable constraint" (section 7.19, ItemSessionControl). The XSD gives six of the
    attributes defaults (`show-feedback` false, `allow-review` true, `show-solution` false, `allow-comment` false,
    `allow-skipping` true and `validate-responses` false), and XML Schema adds an attribute's default to every element
    that omits it (XML Schema Part 1, section 3.4.5, Attribute Default Value). Read element by element, a section that
    writes only `max-attempts` would then set `show-feedback` back to false. `max-attempts` has no default in the XSD,
    and where no element writes it, it is 1 for a non-adaptive item (section 7.19.1). 1EdTech's own test examples give a
    part `show-feedback="true"` and a section or item ref only `max-attempts`. This follows the information model and
    sets aside the element-wide reading of the XSD's defaults: an attribute an element does not write is no constraint,
    so it overrides nothing. This binds pantry and plate alike, so the two never read the same file differently. plate
    is the only implementation so far: pantry records which attributes each element writes and delivers nothing. (The
    operator's ruling, accepting the renderer's default; applied in plate by its phase-4 delivery spec, section 4.5;
    2026-11-04.)
64. **A `min-time` greater than its `max-time` is valid; each limit applies on its own, and where both cannot hold,
    `max-time` wins.** The information model gives `min-time` as the minimum and `max-time` as the maximum duration, in
    seconds, allocated to what holds them, and applies minimum times to sections and items only in linear navigation
    (section 2.8.5, Time Limits; section 7.40, TimeLimits, and its characteristics 7.40.1 and 7.40.2). The XSD types
    each as a non-negative double. Neither document orders the two, and no rule makes a document that writes `min-time`
    above `max-time` invalid, so under reading 1 it is valid, and neither package refuses it. Each limit applies as if
    the other were absent: `min-time` keeps the candidate in a linear section or item until it has elapsed, and
    `max-time` ends the time allowed whether or not `min-time` has elapsed, so `min-time` never holds a candidate past
    `max-time`. `allow-late-submission` still decides whether a response given after `max-time` is accepted (section
    7.40.3). This binds pantry and plate alike, so the two never read the same file differently, and both accept such a
    document today. Neither enforces a time limit yet: plate accepts `qti-time-limits` and marks it unsupported, and
    pantry stores both limits as written. This is not a case of documents in conflict: the sources are silent on how the
    two limits relate. (The renderer's pick, under the operator's delegation; 2026-11-04.)
65. **A section's rubric is shown with each item the section holds.** The information model says section rubric "is
    presented to the candidate with each item contained (directly or indirectly) by the section", and, as sections nest,
    that "the rubric presented for each item is the concatenation of the rubric blocks from the top-most section down to
    the item's immediately enclosing section" (section 4.2.14, the `qti-rubric-block` attribute of the AssessmentSection
    class). Each block is shown only to the views its `view` names. The implementation guide says rubric at test, part
    and section level is presented when the candidate first enters the structure that holds it, and that test- and
    part-level rubric need not stay visible after that but must remain available (section 4.6.1, Rubric Blocks). That
    relief names test and part rubric, not section rubric, and showing a section's rubric with each of its items also
    shows it on entry, so the guide's rule is met. This binds plate, which delivers tests; pantry stores rubric blocks
    and delivers nothing. plate does not show test, part or section rubric yet: it accepts `qti-rubric-block` there and
    marks it unsupported, and it follows this reading when it shows one. This is not a case of documents in conflict:
    the two documents' rules hold together, and only the information model says what happens after entry. (The
    operator's ruling, accepting the renderer's default; 2026-11-04.)
66. **A `fixed` child keeps its place in the sequence selection leaves, not its place in the document.** The information
    model says a fixed child "must never be shuffled", and that with a selection rule "fixed elements do not have their
    position fixed until after selection has taken place": selecting three of `{A,B,C,D}` might give `{A,B,C}`, and with
    `B` fixed a shuffle may give `{C,B,A}` but not `{A,C,B}` (section 4.2.3, the `fixed` characteristic of the
    AssessmentSection class, and section 5.6.3, the same characteristic of the AssessmentItemRef class). Selection runs
    first. Ordering then shuffles the selected children that are not fixed around those that are, and each fixed child
    keeps its position in the selected sequence. The implementation guide says ordering runs after selection and that
    fixed children "maintain their positions as specified in the source XML" (section 4.5.2, Ordering), which cannot
    hold once selection has dropped a child before a fixed one. This follows the information model, with its example,
    and sets aside the guide's sentence. This binds plate, which delivers tests; pantry stores `fixed` as written and
    delivers nothing. plate does not select or order yet: it delivers every child in document order and marks
    `qti-selection` and `qti-ordering` unsupported, and it follows this reading when it does. (The operator's ruling,
    accepting the renderer's default; 2026-11-04.)
67. **A package's manifest is judged against the content-packaging profile its `schemaversion` names, and its resource
    types are that profile's spellings.** `3.0.0` names the QTI 3.0 profile, `imsqtiv3p0_imscpv1p2_v1p0.xsd`, and
    `3.0.1` the QTI 3.0.1 profile, `imsqtiv3p0p1_imscpv1p2_v1p0.xsd`. Each profile enumerates its own value and no
    other, so a manifest with any other `schemaversion`, or none, is valid against neither and is refused. Content
    Packaging says the schema version declares the version of the profile that governs the manifest (IMS Content
    Packaging 1.2, section 6.4.4, SchemaVersion). The two profiles differ: the 3.0 profile lists the resource type
    `imsbasiclti_xmlv1p3` and admits `cpx:variant`, while the 3.0.1 profile lists `imslti_xmlv1p1` and `imsltia_xmlv1p0`
    in its place and forbids `cpx:variant`. A resource's `type` is one its profile enumerates, spelled as the profile
    spells it. The implementation guide says the schema version "MUST be set to" `3.0.0` (section 6.1.1, Manifest),
    which the 3.0.1 profile refuses, and spells the response-processing type `imsqti_responseprocessing_xmlv3p0`
    (section 6.2, Content), where both profiles spell it `imsqti_resprocessing_xmlv3p0`. The packaging sections of the
    3.0 and 3.0.1 XSD bindings, which mark themselves not normative, say the schema version must be `3.0.0` and `3.0.1`
    respectively, each for the profile it names (section 8, ASI Packaging), and the 3.0.1 binding spells the
    response-processing type as the profiles do. 1EdTech's own LTI example packages declare `3.0.0` and give resources
    the type `imslti_xmlv1p1`, which only the 3.0.1 profile lists, so they are refused. This follows the profile XSDs,
    the schemas a manifest is validated against, and sets aside the implementation guide's version and spelling. This
    binds pantry and plate alike, so the two never read the same package differently, and both implement it. (The
    operator's ruling, accepting the renderer's default; applied in plate by its phase-4 delivery spec, section 4.3;
    2026-11-04.)
68. **A duration in a results report is a number of seconds.** Every duration a report writes, an item's built-in
    `duration` (a float) and a test's, part's or section's (base type duration, reading 29), is its seconds in
    `xs:double`'s lexical form: `90.5`, never `PT1M30.5S`. Results Reporting defines a duration value as a time period
    "represented as a single float that records time in seconds", represented with `xsd:double` (QTI Results Reporting
    3.0, section 2.7.3, BaseTypeEnum), as the information model does (section 8.13, BaseTypeEnum), and the information
    model gives an item's `duration` as "a single float that records the accumulated time (in seconds)" (section
    2.2.2.2, Response Variable). The Results Reporting XSD types `value` as `xs:normalizedString` (`ValueDType`), so it
    cannot tell the two forms apart: one of 1EdTech's results examples writes its durations as ISO 8601 strings and
    still validates. Results Reporting's own basic example writes `100` (section 5.3.8.1). This binds plate, which
    writes results reports; pantry neither writes nor reads one. This is not a case of documents in conflict: both
    specifications define the value as seconds, and an example the XSD cannot check is not followed. (The operator's
    ruling, accepting the renderer's default; applied in plate by its phase-4 delivery spec, section 4.9; 2026-11-04.)
69. **A results report carries no extension content outside outcome information.** Results Reporting names one permitted
    extension point, the OutcomeInformation class, says any proprietary extension is non-conformant (QTI Results
    Reporting 3.0, section 4.1, Extending the Data Model), and says an exporting system "MUST NOT create an instance
    that contains any proprietary properties" (section 6.3, System Export Conformance), while an importing system
    identifies such an instance as invalid (section 6.2, System Import Conformance). Its XSD also ends every response
    variable with a strict wildcard for elements of other namespaces (`ResponseVariableDType`, through `grpStrict.any`),
    the same wildcard that `outcomeInformation` holds. That wildcard is not a permitted extension point, so content
    there is a proprietary extension. plate writes no extension content at all, in `outcomeInformation` or in a response
    variable. This binds plate, which writes results reports; pantry neither writes nor reads one. This follows the
    specification's text, which names one extension point, and sets aside the wider XSD. (The operator's ruling,
    accepting the renderer's default; applied in plate by its phase-4 delivery spec, section 4.9; 2026-11-04.)
70. **Under `allow-skipping="false"`, a response counts toward skipping only when the delivered item has a control that
    can post it.** The information model defines an item as skipped when "all response variables are submitted with
    their default value or are NULL", forbids submitting it under `allow-skipping="false"` until at least one response
    has another value, applies the rule only in a part with individual submission, and says "an item with no response
    variables cannot be skipped" (section 7.19.6, the `allow-skipping` characteristic of the ItemSessionControl class).
    It does not say how to count a response the candidate has no means to give. A response no interaction binds, one
    bound only to an interaction plate shows as a notice in place of its controls, and one of a base type that no
    interaction plate delivers can post: none of these can take another value from the candidate. Counting them would
    leave an item that can never be submitted and, in a linear part, never left. Such a response does not count, and a
    value a submission carries for it does not answer the item either. An item with no response that counts is treated
    as an item with no response variables: it is never skipped, so it never blocks moving on or submitting. This binds
    plate, which delivers tests; pantry delivers nothing. This is not a case of documents in conflict: the information
    model is silent on responses a candidate cannot give, and this follows its own rule for an item with none. (The
    renderer's ruling in its phase-4 repair, applied in plate; 2026-11-06.)
61. **`xs:anyURI` is XML Schema 1.0's: a value is valid when XLink's escaping makes it an RFC 2396 URI reference
    as RFC 2732 amends it, and libxml2's verdict, which follows RFC 3986, is set aside where the two differ.**
    QTI 3.0's information model cites XML Schema Part 2 of 2 May 2001 ([XSCHEMA, 01]) and RFC 2396 ([URI, 98]),
    and QTI's XSDs use nothing of XML Schema 1.1, so XML Schema 1.0 decides. Its Part 2 (W3C Recommendation, 28
    October 2004, section 3.2.17.1) makes the lexical space the strings that, once XLink 1.0's section 5.4 escapes
    their disallowed characters, "result in strings which are legal URIs according to [RFC 2396], as amended by
    [RFC 2732]". That is RFC 2396's `URI-reference` (Appendix A) with RFC 2732's three changes (section 3), judged
    on the collapsed value (section 4.3.6). RFC 2732 takes `IPv6address` from RFC 2373 without saying whether
    its Appendix B rule or its section 2.2 text forms are meant, and the rule cannot derive the section's own
    example `::13.1.68.3`. So both are admitted, `::` standing for one or more zero groups and a dotted part
    allowed leading zeros (reading 1, decision 227). libxml2, whose `xmllint` is the validity oracle, judges
    anyURI by RFC 3986 instead, with departures of its own, so the oracle and this reading disagree on these
    values, and each disagreement is recorded against this reading rather than counted as a defect. Nothing after
    the scheme (`foo:`) and a query with no path (`?q`): RFC 2396 refuses them, and libxml2 accepts them. A `[`
    or `]` in a query (`p?a[0]=1`) or after the first character of an opaque part (`foo:a[b]`): RFC 2732 admits
    it, and libxml2 refuses it. An authority that is a registry name holding a `:` or `@` beyond a host and a
    port (`http://h:abc/`, `http://a@b@c/`), and an empty port (`http://h:/`): RFC 2396 admits them, and libxml2
    refuses them. A port above 2,147,483,647: libxml2 refuses it. An IP literal that is not an RFC 2373 IPv6
    address (`[v1.x]`, `[zz]`, `[]`): libxml2 accepts it without reading it. Square brackets in a fragment
    (`#[x]`) are admitted by both. This binds pantry and plate alike, so the two never read the same URI
    differently. This is not a case of documents in conflict: XML Schema 1.0 decides, and libxml2 is a second
    implementation that reads the RFC that later replaced XML Schema 1.0's references. (Operator ruling "the spec
    wins", 2026-11-05.)
62. **An item resource's LOM general identifier names the item, compared collapsed.** The implementation guide's LOM
    profile ([§2.1.2, "LOM Metadata"](https://www.imsglobal.org/spec/qti/v3p0/impl#h.lqndupc0ugmq)) says "the test or
    item identifier should be present as an identifier in the LOM metadata." So when an item resource's `lom:lom`
    lists `general/identifier` entries, one of them is the item document's `identifier`; a record that lists none is
    not judged, because the guide asks that the identifier be present among them, not that a record have one. The
    entry is LOM's `CharacterString`, an `xs:string`, but it names the item, so it is compared in the item
    identifier's value space, `UniqueIdentifierDType`, a restriction of `xs:ID` whose whitespace is collapsed: an
    entry `item1` names `item1`. This also follows reading 1, since nothing valid is refused for padding. The guide
    states the same for tests, so the law reads a test resource's record against the test document's `identifier`
    in the same way. The guide's word is "should", which RFC 2119 makes a recommendation, not a requirement. The
    operator rules it binding: a package whose record lists identifiers and none names its document is refused. That
    is a deliberate exception to reading 1, stated here so the two readings do not silently disagree: reading 1
    still governs every value-space question this law raises, which is why padding is collapsed rather than refused.
    Reading 33 reads another of the guide's "should"s as advice, and the two are consistent: that one would contradict
    Content Packaging 1.2's "shall describe all control files", which outranks the guide, so it yields. This one
    contradicts no rule of any specification, so the operator's ruling binds it. (Operator ruling, 2026-11-05.)
63. **The built-in outcome variable is `completionStatus`, spelled exactly; `completion_status` and
    `completion-status` name variables nothing declares.** The information model defines one built-in outcome
    variable, "'completionStatus', that is declared implicitly and must not appear in an outcome declaration"
    (section 2.2.2.3), and lists the reserved identifiers of the built-in session variables as "completionStatus,
    numAttempts and duration" (the `identifier` of OutcomeDeclaration, ResponseDeclaration and TemplateDeclaration,
    tables 4.5.1, 5.115.1 and 5.151.1). Every other variable must be declared (section 2.2.2), and identifiers "are
    always compared case-sensitively" (section 7.16). The implementation guide's examples, the results reporting
    specification's examples and QTI 2.0, 2.1 and 2.2 all write `completionStatus`. No QTI 3.0 document writes
    `completion_status`, which is the CMI data model's element name (SCORM's `cmi.completion_status`). QTI 2.x
    cited that data model for the values' meanings, and QTI 3.0 does not cite it. The `max-attempts` description
    (table 7.19.1) twice writes "completion-status", where QTI 2.2's same sentence wrote `completionStatus` beside
    `maxAttempts` and `showFeedback`. That is prose converted to kebab case with its neighbours, not a second
    definition. So a set rule or a variable reference that names `completion_status` or `completion-status` names a
    variable nothing declares, and the document is refused under P8. 1EdTech's `adaptive.xml` in the `maxfiles` and
    `test_package_minfiles` example packages is refused this way; the same item in its `items` package writes
    `completionStatus` and is not. The underscore in the value `not_attempted` belongs to a value of the identifier
    base type, not to a variable's name, and does not bear on it. This is not a case of documents in conflict: the
    XSD types the identifier as an `xs:NCName` and names no built-in, the information model defines the name, and
    every other QTI 3.0 source agrees with it; one example disagrees with all of them. (Operator ruling "the spec
    wins", 2026-11-05.)
64. **`xs:unsignedLong`, `xs:unsignedInt`, `xs:unsignedShort` and `xs:unsignedByte` admit a sign as
    `xs:nonNegativeInteger` does: `+` before any value, `-` only before zero.** XML Schema Part 2 (W3C
    Recommendation, 28 October 2004) says each "has a lexical representation consisting of a finite-length sequence
    of decimal digits" (sections 3.3.21.1 to 3.3.24.1). The same Recommendation derives each from the one before by
    `maxInclusive` alone, down from `xs:nonNegativeInteger` (sections 3.3.21 to 3.3.24, and Appendix A, where section
    3.3 says "the complete definitions of the built-in derived datatypes are provided"). Each therefore carries
    `xs:integer`'s pattern `[\-+]?[0-9]+` and `xs:nonNegativeInteger`'s `minInclusive` of 0 (section 4.1.2.1).
    Datatype Valid (section 4.1.4), the rule schema validity applies (Part 1, section 3.14.4), tests a literal
    against those facets and against no prose, so `+0`, `+1` and `-0` are valid and `-1` is not. XML Schema 1.0
    thus contradicts itself, and the derivation is followed for three reasons. Validity is computed from it. The
    Working Group settled the same contradiction for `xs:nonPositiveInteger` by correcting the prose to the
    derivation, and stated `xs:nonNegativeInteger`'s signs in the same erratum (E2-27, Rec issue R-149). And XML
    Schema 1.1 (Appendix I.2) revised the four types' prose "to agree with the schema for schemas by allowing for
    the possibility of a leading sign", keeping 1.0's schema for datatypes as it was. So this is XML Schema 1.0's
    own answer and is consistent with reading 61. `xs:nonNegativeInteger` (section 3.3.20.1) and
    `xs:positiveInteger` (section 3.3.25.1) need no ruling: their prose and their derivation agree, `+` before any
    value and `-` before zero for the first, `+` before a positive value for the second. libxml2 2.9.13, whose
    `xmllint` is the validity oracle, refuses every sign on the four unsigned types, as the uncorrected prose says.
    libxml2 2.13.0 and later accept them. The oracle's verdict is recorded against this reading rather than counted
    as a defect. A value keeps its spelling through a round trip. Under QTI's XSDs these four types appear only as
    MathML's `m:unsigned-integer`, and whether MathML's own notation (MathML 3, section 2.1.5.1) narrows it is
    reading 2's question, not this one's. This binds pantry and plate alike. This is not a case of documents in
    conflict: XML Schema decides its own types, and where its prose and its derivation disagree, the derivation it
    validates by is followed. (Operator ruling "the spec wins", 2026-11-05.)
65. **An identifier names one variable among the declarations of its document.** The information model says "The
    purpose of the declaration is to associate an identifier with the variable" (section 2.2.2, Item Variables,
    https://www.imsglobal.org/spec/qti/v3p0/info#Variables). Each declaration's `identifier` adds "All item
    variables declared in an item share the same namespace" (section 4.5.1, `#RootCharacteristic_OutcomeDeclaration.Attr_identifier`,
    and sections 5.34.1, 5.115.1 and 5.151.1). A response's and a context's identifier is a UniqueIdentifier,
    "unique within the scope of the instance" (sections 5.115.1, 5.34.1 and 7.43). The XSD types the response's
    `UniqueIdentifierDType`, an `xs:ID`, and the context's `IdentifierDType`, an `xs:NCName`; the information model
    outranks the XSD, so a context declaration's identifier is unique among its document's IDs as a response
    declaration's is. An outcome's and a template's is an Identifier, which neither document makes unique. One
    identifier declared twice in one namespace would stand for two variables, and a variable expression that names it
    (section 2.11.1.2) could not tell which. So no two declarations of a document, of any of the four kinds, share an
    identifier, and a test's own declarations form one namespace in the same way. This is implied, not stated: no
    sentence calls an outcome's or a template's identifier unique. Across the four kinds this is not a case of
    documents in conflict: the information model implies the rule, and the XSD states it only for the response kind,
    which it types `xs:ID`. For a context's identifier among the document's IDs it is one, and the information model
    is followed over the XSD. (2026-11-05; the law `Declaration key`. Restated 2026-11-05 under "the spec wins": the
    earlier text said the XSD types a context's identifier `xs:ID`, which it does not.)
66. **An interaction's `response-identifier` names a declared response variable.** The information model says each
    interaction "must be bound to a response variable" of the types it lists (section 2.4,
    https://www.imsglobal.org/spec/qti/v3p0/info#Main2p4; for example section 2.4.1.1, "The qti-choice-interaction
    must be bound to a response variable with a base-type of identifier and single or multiple cardinality"). It says
    "Response variables are declared by response declarations and bound to interactions in the itemBody" (section
    2.2.2.2, `#IV_Response`) and "All variables must be declared except for the built-in session variables" (section
    2.2.2). So a `response-identifier` that names no response declaration binds its interaction to nothing, and the
    item is refused. The built-in response variables `numAttempts` and `duration` are "declared implicitly", and the
    delivery engine maintains them (section 2.2.2.2), so an interaction bound to one is refused too. For the text
    entry interaction, whose reference the XSD types `xs:IDREF` (reading 14), the XSD already resolves it; the
    extended text interaction's is an `IdentifierDType`, as every other interaction's is, and this rule resolves it.
    This is implied: the binding sentence and the declaration sentence together state it, and no single sentence does.
    This is not a case of documents in conflict. (2026-11-05; the law `Binding declared`. Corrected 2026-11-05: the
    earlier text called the extended text interaction's reference an IDREF.)
67. **A least count is at most its most, unless the most is 0.** The information model states this for each pair:
    - "min-choices must be less than or equal to the limit imposed by max-choices" (section 5.30.3,
      https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ChoiceInteraction.Attr_min-choices), with "If
      max-choices is 0 then there is no restriction" (section 5.30.2);
    - the same sentence for `min-associations` (sections 5.8.3, 5.57.2, 5.59.1, 5.60.1, 5.89.3), `match-min`
      (sections 5.7.9, 5.56.6, 5.58.6, 5.131.7), the hottext, hotspot, position object and select point
      interactions' `min-choices` (sections 5.66.2, 5.68.1, 5.107.2, 5.128.1), and an extended text interaction's
      `min-strings` (section 5.48.7: "min-strings must be less than or equal to the limit imposed by max-strings").
      A limit of 0 imposes none, so any least meets it, and reading 53 reads `max-strings="0"` the same way. The order
      and graphic order interactions state their own rule, with no 0 exemption, since neither gives 0 that meaning:
      reading 18 reads it. The media interaction's plays have no such sentence. The Schematron states it (rule 13Ba),
      and reading 9 reads it by intent, with `max-plays="0"` as no limit (section 5.92.3: "A value of 0 (the default)
      indicates that there is no limit"). This is stated, and is not a case of documents in conflict. (2026-11-05; the
      law `Choice bounds`. Corrected 2026-11-05: the earlier text said the order interactions have no sentence, which
      sections 5.61.2 and 5.97.3 are.)
68. **A feedback element names an outcome variable, and a printed variable an outcome or a template variable, the
    built-in `completionStatus` among them.** The information model states both:
    - Every feedback element's `outcome-identifier` is "The identifier of an outcome variable that must have a
      base-type of identifier and be of either single or multiple cardinality" (sections 5.49.1, 5.52.1, 5.93.1,
      5.148.1 and 5.157.2, https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_FeedbackBlock.Attr_outcome-identifier).
    - A printed variable's `identifier` says "The outcome variable or template variable must have been defined. The
      values of response variables cannot be printed directly" (section 7.30.6,
      `#DerivedCharacteristic_PrintedVariable.Attr_identifier`).
      `completionStatus` is an outcome variable "declared implicitly", "a single identifier" (section 2.2.2.3), so a
      feedback element or a printed variable may name it. A response variable, declared or built in, is refused for
      both, and so is a feedback outcome of another base type or cardinality. This is stated, and is not a case of
      documents in conflict. (2026-11-05; the laws `Feedback reference` and `Printed
      variable reference`, which refused `completionStatus` until RD's patch and do not yet read the outcome's base
      type and cardinality.)
69. **A mapping maps a base type other than `file` and `duration`, of a variable that is not a record.** The
    information model's Mapping class is "A special class used to create a mapping from a source set of any
    base-type (except file and duration) to a single 'float'" (section 5.88,
    https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping). Its map response expression "cannot be applied to
    variables of record cardinality" (section 2.11.1.5). The map response template's sentence "The template applies
    to responses of any base-type and cardinality" (section 2.5.1) says where the template may be used, not what a
    mapping maps, and is read with the class definition, which is the narrower and the more specific. This is stated.
    It is a sentence inside the information model read beside its class definition, not a case of documents in
    conflict. (2026-11-05; the law `MappableBaseType`.)
70. **A selection without replacement selects at most its section's parts.** The information model says of `select`
    "The number of children to select may exceed the number of child elements defined only if with-replacement is
    true", and "Sub-sections always count as 1, regardless of how many child elements they have and whether or not
    they are visible" (section 5.129.1,
    https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Selection.Attr_select). So a section's parts
    (item references, sections and section references) are counted once each, and `select` above their number is
    refused unless `with-replacement` is true. `with-replacement` is an `xs:boolean`, so `1` is true; reading 34
    binds `qti-value` only. This is stated, and is not a case of documents in conflict. (2026-11-05; the law `Selection bound`.)
71. **A default hotspot is the last hotspot choice of its interaction, and a graphic gap match interaction has
    none.** The information model says "The default hotspot, if defined, must appear last":
    - in the HotspotChoice class (section 5.67, https://www.imsglobal.org/spec/qti/v3p0/info#Data_HotspotChoice),
      whose choices the hotspot and graphic order interactions hold;
    - in the hotspot interaction's `qti-hotspot-choice` (section 5.68.6).
      Of the graphic gap match interaction's hotspots it says "The default hotspot must not be defined" (section
      5.60.9). "Last" is last among the interaction's hotspots, which its content model places after its image, so it
      is its last element child: whitespace, comments and processing instructions after it are no hotspots and do not
      count. Of the graphic associate interaction's `qti-associable-hotspot` children, and of the AssociableHotspot
      class, it says no such thing (sections 5.59.4 and 5.7), so there a default hotspot may stand anywhere (reading
      1). This is stated, and is not a case of documents in conflict. (2026-11-05; the law `default hotspot last slot`,
      over `qti-hotspot-choice`, and `Graphic gap match default hotspot`. Corrected 2026-11-05: the earlier text cited
      the AssociableHotspot class for the rule, which it does not state, and the law that followed it refused valid
      graphic associate interactions.)
72. **An element wildcard reads an element as a global declaration only where the schema set of the element's
    document declares it, and a `strict` wildcard refuses any other element unless its `xsi:type` names a type of
    that set or a built-in.** XML Schema 1.0 Part 1 (W3C Recommendation, 28 October 2004) defines `strict` as
    "There must be a top-level declaration for the item available, or the item must have an xsi:type, and the item
    must be valid as appropriate" (section 3.10.1). A `strict` wildcard's element has the context-determined
    declaration `mustFind` (section 3.10.4, Item Valid (Wildcard), clause 2). It is assessed strictly when its name
    resolves to a declaration in the schema the document is assessed against (section 3.3.4, Schema-Validity
    Assessment (Element), clause 1.1.1.3.2), or when its `xsi:type` resolves to a type definition there (clause
    1.2). A parent with a `mustFind` child that neither assesses, whose validity is unknown, is invalid (section
    3.3.5, Assessment Outcome (Element), [validity] clause 1.1.3). Under `lax` the element is assessed only where a
    declaration is found (section 3.10.4, clause 1), and otherwise against nothing. Which schema a document is
    assessed against is the application's to direct (section 4.3.2: an instance's `xsi:schemaLocation` hints are used
    "unless directed otherwise, for example by the invoking application"). QTI directs it. The full ASI XSD of the
    document's version is the validator for every ASI file (reading 24), and a manifest's is the content-packaging
    XSD of its version. Each XSD's `grpStrict.any` group says "the schema must be imported" (`imsqti_asiv3p0_v1p0.xsd`
    line 23927, `imsqti_asiv3p0p1_v1p0.xsd` line 24013, the CP XSDs lines 166 and 165, both DRD XSDs line 102). So a
    document's schema set is its root XSD and every XSD that XSD imports, transitively, and an
    `xsi:schemaLocation` in the document adds nothing to it. The sets are four:
    - an item, section, stimulus, test, outcome declaration or response-processing template: the ASI XSD, with
      `xml.xsd`, XInclude, MathML 3 and SSML 1.1 (both ASI XSDs, lines 12 to 15);
    - a manifest: the content-packaging XSD, with `xml.xsd`, LOM, the curriculum standards metadata, the QTI metadata
      and the content-packaging extension (both CP XSDs, lines 12 to 16), which imports XLink and the AfA DRD (both
      `cpext/` XSDs, lines 10 and 11);
    - an external LOM metadata file (`resourcemetadata/xml`): the loose LOM binding, which imports nothing;
    - a usage-data file (`qtiusagedata/xml`): the usage-data XSD, which imports nothing.

    So beneath `qti-companion-materials-info`, whose model ends in the `strict` `##other` wildcard of
    `grpStrict.any` (`imsqti_asiv3p0_v1p0.xsd` line 26129, `imsqti_asiv3p0p1_v1p0.xsd` line 26275), an element of
    MathML, SSML or XInclude is assessed against its global declaration. An element of the DRD, such as
    `drd:educationalComplexityOfAdaptation`, has no declaration there, because the ASI XSDs import no DRD, and
    neither does one of LOM, the curriculum standards metadata, the QTI metadata, the content-packaging extension or
    usage data. In a manifest, the `strict` wildcards of the file metadata (`imsqtiv3p0_imscpv1p2_v1p0.xsd` line 269,
    `imsqtiv3p0p1_imscpv1p2_v1p0.xsd` line 251) and of the DRD's `accessForAllResource` (both DRD XSDs, line 409) find
    no declaration for an element of the ASI namespace, MathML, SSML, XInclude or usage data. Under those wildcards
    such an element, like any element no declaration of the set names, stands only with an `xsi:type` that names a
    type of the document's set, or one of XML Schema's own (a built-in, or `xs:anyType`). It is then assessed against
    that type, as reading 60 says. With no `xsi:type`, or with one that resolves to no type of the set, the element is
    refused: a DRD type is no type of an item's set. libxml2 2.9.13, whose `xmllint` is the validity oracle, refuses
    every element under a `strict` wildcard that has no declaration before it reads the `xsi:type`, so it refuses
    `<f:x xmlns:f="urn:f" xsi:type="xs:string">a</f:x>` there, which XML Schema assesses and accepts. Its verdict is
    recorded against this reading rather than counted as a defect. Under a `lax` wildcard, an element the
    document's set does not declare is foreign content, assessed laxly as readings 6 and 57 say, and is not read
    as the declaration another set gives it.
    One limit follows from the grammar being keyed by version and not by schema set. A kind that stands in documents
    of more than one set has one set of wildcard admissions for all of them, and its `lax` wildcards read an element as
    its declaration when any of those sets declares it. Such kinds are LOM's, in a manifest and in an external LOM
    file, and the foreign kinds, in every document. That keeps reading 57's walk beneath a foreign element in an item,
    where MathML, SSML and QTI's own global elements are read and judged. It also reads, in the same places, an
    element that the document's own set does not import. Beneath a foreign element in an item, a `lom:lom` is judged
    as LOM, where XML Schema would assess it against nothing, and beneath a LOM element in an external LOM file, a
    `drd:hazard` is judged as DRD's. Such an element is refused when it breaks its declaration. That is an exception
    to reading 1, stated here as a known limit. It is closed when the grammar keys its admissions by schema set as it
    keys them by version. This binds pantry and plate alike. This is not a case of documents in conflict: XML Schema
    decides how a wildcard finds a declaration or a type, and QTI's XSDs and reading 24 fix the schema each document
    is assessed against. (The DRD finding of seat QF, with QD's correction for `xsi:type` under `strict`; "the spec
    wins", 2026-11-05.)

73. **A response-processing resource's type is `imsqti_resprocessing_xmlv3p0`, as the content-packaging XSD
    enumerates it, and the implementation guide's `imsqti_responseprocessing_xmlv3p0` is refused.** The
    content-packaging XSD enumerates the values of a `cp:resource`'s `type`, and among them is
    `imsqti_resprocessing_xmlv3p0` (`imsqtiv3p0_imscpv1p2_v1p0.xsd` line 400, `imsqtiv3p0p1_imscpv1p2_v1p0.xsd`
    line 353). The implementation guide's table of resource types spells the same type
    `imsqti_responseprocessing_xmlv3p0`, "QTI 3 ResponseProcessing" (section 6.2, `impl.txt` line 13291). The guide is
    "an informative resource in the Document Set" that "does not include any normative requirements" (section 1.3,
    `impl.txt` lines 818 to 821). The ASI XML binding's list of the vocabulary names neither spelling, and its section
    says "This Section is NOT NORMATIVE" (section 8, ASI Packaging, `bind.txt` lines 434905 and 434933). The
    information model does not speak to packaging. So the XSD is the one normative source that states the vocabulary,
    and it decides: a resource typed `imsqti_resprocessing_xmlv3p0` is accepted, and its file is a document whose root
    is `qti-response-processing`, as for `imsqti_rptemplate_xmlv3p0`, both paired with the guide's section 6.2.4. A
    resource typed `imsqti_responseprocessing_xmlv3p0` is refused, because the XSD's enumeration refuses it and reading
    1 refuses content that is not valid. This follows the XSD and sets aside the guide's table, as readings 11 and 12
    set the guide aside where it disagrees with a normative definition. This is not an information-model-over-XSD
    case: the information model is silent, and the conflict is between the XSD and an informative guide. ("The spec
    wins", 2026-11-05.)
74. **A prefix names the namespace its nearest declaration binds, in element and attribute names and in values of type
    QName alike, and a prefix nothing binds makes the document invalid.** Namespaces in XML 1.0 (Third Edition, W3C
    Recommendation, 8 December 2009) requires every prefix but `xml` and `xmlns` to be declared on the element that
    uses it or on an ancestor ("Namespace constraint: Prefix Declared", section 5), scopes a declaration to its element
    less the scope of any inner declaration of the same prefix (section 6.1), and makes conformance require both
    (section 7). XML Schema 1.0 reads a value of type QName the same way: a prefixed value needs a namespace in its
    element's [in-scope namespaces] with that prefix, and an unprefixed one takes the default namespace in scope, or
    none (Part 1, section 3.15.3, QName Interpretation, clauses 1.1 and 2.2; Part 2, section 3.2.18, whose note says
    the mapping "requires a namespace declaration to be in scope"). The values of type QName that QTI's schemas hold
    are `xsi:type` and each item of SSML's `role`, a list of `xsd:QName` (`ssml/synthesis-nonamespace.xsd` line 308).
    So an `xsi:type` or a `role` item whose prefix no declaration in scope binds is refused. That holds for the
    `xsi:type` of a foreign element under a `lax` or `strict` wildcard as well: with no element declaration, XML
    Schema still assesses the attribute against its built-in declaration (Part 1, section 3.2.4, Schema-Validity
    Assessment (Attribute), clause 1.2, and section 3.2.7), which the ur-type's `lax` attribute wildcard lets it
    find. Under `skip` nothing is assessed (section 3.10.1), and the value is kept as written. Every element and
    attribute name resolves its prefix the same way, to the namespace that is the name's. pantry states each of these
    as a law over its stored rows, the names and the QName values alike, and does not leave the names to its reader:
    a row whose prefix resolves to no binding, or to another namespace than its name's, describes no document, and
    the model stores nothing that no valid document is (`docs/qti-intent.md`, "Extremely tight data model"). This
    binds pantry and plate alike in what they refuse; how each enforces it is its own. This is not a case of
    documents in conflict: Namespaces in XML and XML Schema agree. (Operator ruling "the spec wins", 2026-11-05.)
75. **An element is judged under its governing type for everything XML Schema decides, and under its name for every
    rule QTI adds.** An element whose valid `xsi:type` names a type derived from its declared one is validated against
    the named type, its "actual type definition", and not the declared one (XML Schema Part 1, section 3.3.4, Element
    Locally Valid (Element), clauses 4 and 5.2.1; reading 47). So its admitted and required attributes, their value
    domains, its content model, the domain of its text, and which of its values are IDs and IDREFs are the governing
    type's. Under QTI 3.0's XSDs that reaches three groups. `qti-null`, `qti-exit-response`, `qti-exit-template` and
    `qti-exit-test` are declared `EmptyPrimitiveTypeDType` (ASI 3.0.1 XSD line 24052, a restriction of `xs:anyType`
    with no content), which 41 types extend, each with attributes only. `qti-description`, `qti-physical-material`
    and `qti-minimum-length`, and the metadata's `interactionKind` and `customTypeIdentifier`, are declared
    `xs:normalizedString` or `xs:integer`, whose restrictions an `xsi:type` may name. SSML's `speak` and `mark` each
    admit one derived type. So `<qti-null xsi:type="VariableDType" identifier="SCORE"/>` is valid and is accepted;
    `<qti-null xsi:type="VariableDType"/>`, without the `identifier` `VariableDType` requires, is invalid and is
    refused; and a `qti-exit-response` typed `TrackDType` needs `TrackDType`'s required `src`. The information model's
    own rules are stated of elements, not of types. It defines `qti-null` as the expression that "returns the NULL
    value" (section 6.9.19), and it states each interaction's rules of its element (section 2.4, as section 2.4.1.1's
    "The qti-choice-interaction must be bound to a response variable"). So a rule QTI adds to the XSD, stated by the
    information model or by a reading here, follows the element's name, and a type never carries it onto another
    element. `<qti-null xsi:type="TextEntryInteractionDType" response-identifier="R"/>` is a null expression: it binds
    no response and no interaction rule judges it, while its `response-identifier`, an `xs:IDREF` under that type,
    must still name an ID of its document, as XML Schema requires. This binds pantry and plate alike. This is not a
    case of documents in conflict: XML Schema decides validity against a type, and the information model names the
    elements its rules are about. (Operator ruling "the spec wins", 2026-11-05.)
76. **An inclusion never reaches itself, and an included fragment is read in place, as XML, with no `xpointer`.** A
    `qti-assessment-section-ref` "functions as a facade for the qti-assessment-section to which it refers", and the
    document that holds it, "with the refered-to section merged in, should behave exactly the same as a document that
    has all the same sections aggregated in one document" (information model, section 7.5, AssessmentSectionRef). An
    `xi:include` "is treated as if it was actually an instance of the root element of the fragment referred to"
    (section 2.12, Items and Test Fragments). A chain of section refs and includes that returns to a document already
    on it would merge that document into itself without end, which no aggregated document is, and "unbounded
    repetition is not supported" (section 2.8.3.2). For `xi:include` XInclude makes the same chain "a fatal error"
    (XInclude 1.0 Second Edition, W3C Recommendation, 15 November 2006, section 4.2.7, Inclusion Loops, and the same
    section of XInclude 1.1, the W3C Working Group Note of July 2016 that the information model cites). So a test or
    item whose section refs and includes, in any mix, reach a document already on their chain is refused, the refusal
    naming the chain. Two refs or includes of one document that are not nested are no loop (XInclude's own example in
    section 4.2.7), and reading 77 says what two placements mean. Section 2.12 also says that "when using an XML
    binding, the xpointer mechanism defined by the XInclude specification MUST NOT be used", that "all included
    fragments must be treated as parsed xml", and that "the content of the fragment must satisfy the requirements of
    the specification in the context of the item in which it is being included". So an `xi:include` with an
    `xpointer` attribute, or with `parse="text"`, is refused, though the XSD admits both (`w3/XInclude.xsd` lines 22
    to 24), and an included fragment is judged as part of the document that includes it: its interactions bind that
    item's responses, and its identifiers count among that document's. This follows the information model and sets
    the XSD aside where the XSD is wider. This binds pantry and plate alike. (Operator ruling "the spec wins",
    2026-11-05.)
77. **The identifiers of a test's parts, sections, section refs and item refs are one namespace across the assembled
    test, and a section document a test places twice is written once.** The information model says "The identifier of
    the section or item reference must be unique within the test and must not be the identifier of any testPart"
    (section 4.2.1, AssessmentSection) and "The identifier of the test part must be unique within the test and must not
    be the identifier of any qti-assessment-section or qti-assessment-item-ref" (section 5.159.1, TestPart). The XSD
    types each `IdentifierDType`, an `xs:NCName` with no uniqueness, so this follows the information model. The test is
    the assembled test (reading 5): the test document and every section document its section refs and includes reach
    (reading 76). So no two of those elements written in its documents share an identifier, whatever their roles: an
    item ref and a section named alike are refused, and so are a test part and an item ref, or a section ref and a
    section. Of a section ref's `href` the information model says "There is no requirement that this be unique. A test
    may refer to the same section multiple times within a test. Note however that each reference must have a unique
    identifier" (section 7.5.3). A section document placed twice is one document, and its identifiers do not collide
    with themselves: refusing it would refuse what section 7.5.3 calls valid (reading 1). Each placement is still an
    instance of everything the document holds, so a reference that names an item ref or a section through such a
    document, or one of their variables, resolves once for each placement. Reading 48 accepts a reference only when
    exactly one reading resolves, so it is refused, its refusal naming both placements. A section ref, the facade of
    its placement (section 7.5), keeps its own distinct identifier and names that placement as a section does. This is
    a conflict inside the information model, between section 4.2.1's general sentence read across placements and
    section 7.5.3's specific one, and the specific one is followed for the case it names. (Operator ruling "the spec
    wins", 2026-11-05.)
78. **A branch rule names a reserved exit, or a later part of its own kind in its own test part, never inside a
    section a ref places from outside it, and never an item a replacement can repeat.** The information model says a
    branch rule "is evaluated after the item, section or part has been presented to the candidate. If the expression
    evaluates to 'true' the test jumps forward to the item, section or part referred to by the target identifier. In
    the case of an item or section, the target must refer to an item or section in the same test-part that has not
    yet been presented. For test-parts, the target must refer to another test-part" (section 5.23, BranchRule, and
    section 2.8.3.2), and reserves `EXIT_SECTION`, `EXIT_TESTPART` and `EXIT_TEST` (section 5.23.1). Of section refs
    it says "branching rules should treat referred sections as leaf nodes, that have no children that are amenable to
    branching separately from their immediate parent" (section 7.5). Of selection with replacement it says it "enables
    two or more instances of an item referred to by the same assessment-item-ref to appear in the sequence of items
    for a test. It is therefore an error to make such an item the target of a branch-rule" (section 5.98, Ordering).
    Read over the assembled test (reading 5), each sentence is a rule a document can be judged by:
    - A target is one of the three reserved values, which are admitted on every branch rule, or the identifier of a
      test part, section, section ref or item ref of the assembled test.
    - On a test part a target names another test part, after it. On an item ref, section or section ref it names an
      item ref, section or section ref of the same test part, after the source's end: so neither the source, nor an
      ancestor of it, nor a descendant of it.
    - "After" is document order, which is the test's sequence wherever no shuffle can reorder the two. Where the
      section that orders them shuffles (`qti-ordering shuffle="true"` on their nearest common section, or on the
      section that an invisible common section with `keep-together="false"` mixes its children into, section 5.98),
      their order is drawn at delivery and is not judged here, in either direction. `fixed`, which holds some orders
      under a shuffle, is not read, so a pair it would hold backward is accepted: a recorded limit, as reading 50's
      are (decision 227).
    - From outside a section document a ref places, no target lies inside it: the ref is the leaf. A branch rule
      written inside that document may name what the document holds.
    - No target is an item ref under a section whose `qti-selection` has `with-replacement` true, anywhere above it.
    - The target names exactly one element that meets these conditions; one that two placements of a section document
      supply twice (reading 77) is refused as ambiguous.

    Pre-conditions and branch rules are ignored in nonlinear mode (section 2.8.3), but the target rules are stated
    without that condition, so they hold in every mode. This binds pantry and plate alike. This is not a case of
    documents in conflict. (Operator ruling "the spec wins", 2026-11-05.)

79. **A numbered reference such as `Q01.2.SCORE` names an instance of an item ref that a selection with replacement can
    repeat, and nothing else.** The information model says "In adaptive tests that contain items that are allowed to
    be replaced (i.e. that have the with-replacement attribute set to "true"), the same item can be instantiated more
    than once. In order to access the outcome variable values of each instantiation, a number that denotes the
    instance's place in the sequence of the item's instantiation is inserted between the item variable identifier
    and the item variable" (section 2.11.1.2, Variable Expression). So reading 48's numbered reading (item ref, number,
    variable) counts only where its item ref lies under a section whose `qti-selection` has `with-replacement` true,
    anywhere above it in the assembled test (reading 5), and where its number is all digits and at least 1, the
    first instance being 1. No bound is set on the number: how many instances a selection draws is decided at
    delivery, and a number beyond them names an instance that was never drawn, which no static rule refuses. Elsewhere
    the numbered form names nothing, so a reference whose only resolving reading would be numbered names no declared
    variable and is refused (P8). An unnumbered reference to a repeatable item ref, `Q01.SCORE`, is valid; the same
    section says which instance's value it reads. This binds pantry and plate alike. This is not a case of documents
    in conflict. (Operator ruling "the spec wins", 2026-11-05.)
80. **A document whose root element is in a namespace of QTI 2 is not a QTI 3 document, and is refused as `not-qti3`
    before any name in it is read.** QTI 3.0's schemas declare their own namespaces, each XSD's `targetNamespace`, the
    usage data's among them: `http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0`
    (`usagedata/imsqti_usagedatav3p0_v1p0.xsd` line 3), which the implementation guide's usage-data example writes
    (`impl.txt` line 15614) and whose resource type `qtiusagedata/xml` it lists as "QTI 3 Usage Data" (section 6.2,
    `impl.txt` line 13336). QTI 2's published XSDs declare others, each under `http://www.imsglobal.org/xsd/`:
    `imsqti_v2p0`, `imsqti_v2p1` and `imsqti_v2p2` for items, sections and tests, and `imsqti_metadata_v2p1`,
    `imsqti_metadata_v2p2`, `imsqti_result_v2p1`, `imsqti_result_v2p2`, `imsqti_usagedata_v2p1` and
    `imsqti_usagedata_v2p2`. A document whose root is in one of these is a QTI 2 document, which no QTI 3 schema reads,
    whatever its package's manifest declares. It is refused under `not-qti3`, the rule a package that declares a QTI 2
    schema version is refused under, decided from the root's namespace alone, so the refusal says what the document is
    rather than that one of its names is unknown. A root in any other namespace that QTI 3.0 does not declare is still
    `unmodeled-vocabulary`. 1EdTech's `usageData` example package is refused this way: its manifest declares QTI 3.0.0,
    and its three usage-data files are in `imsqti_usagedata_v2p2`. This binds pantry and plate alike, wherever each
    reads such a document. This is not a case of documents in conflict: QTI 3.0 and QTI 2 declare disjoint namespaces.
    (Operator ruling "the spec wins", 2026-11-05.)
81. **On an element the Schematron's extension-attribute lists cover, an attribute its XSD does not declare is a
    `data-` attribute, or the document is refused.** QTI's ASI binding says "5. The Schematron Rules. This Section is
    NORMATIVE" (`bind.txt` lines 431722 to 431724), and that its section 5.2, The Constrained Namespace Extension Rule
    Definitions, is "the set of schematron rules used to enforce the constraints on the naming convention for
    extensions to the list of XML attributes for an element", the convention being `(data-)[a-zA-Z0-9_\-\.]+`. The
    information model gives the same elements a `dataExtension` characteristic, "a characteristic in no namespace
    whose name starts with the string 'data-'" (for example section 4.1.9). The rules are the
    `RULESET_ROOTELEMENT_DATAEXTENSIONRULES`, `RULESET_GLOBALELEMENT_DATAEXTENSIONRULES` and
    `RULESET_LOCALELEMENT_DATAEXTENSIONRULES` patterns that both ASI XSDs embed, over 127 elements in 3.0.1 (from line 130) and 126 in 3.0.0 (from line 131). Read by their intent (reading 9), they bind: on those elements every
    attribute the XSD does not declare is an extension, and an extension is a `data-` attribute in no namespace, in
    reading 13's form. So an undeclared attribute in no namespace (`foo="x"`, or `patternMask` for `pattern-mask`), one
    in another namespace (`f:x`), and an `xml:` attribute the element does not declare (`xml:id`, `xml:space`) are
    refused there, though the XSD's `##any` `lax` attribute wildcard admits them. The information model and the
    normative binding agree, and both outrank the XSD's wildcard. Three things are no extension and are not refused:
    XML Schema's `xsi:` attributes, which "need not be declared to be allowed in instances, but must not be declared"
    (XML Schema Part 1, section 3.2.7) and which reading 47 governs; namespace declarations, which are not attributes;
    and `aria-keyshortcuts` on the empty element families, which reading 10 admits. The lists' text is read by its
    intent, not copied: they test the name as written, so they are applied to expanded names, and they test only as
    many attribute positions as each list has names, so here every attribute is checked. On an element the lists do
    not cover, the XSD's wildcards admit what they admit. This binds pantry and plate alike. One corpus package's
    verdict moves: `qtiv3-examples/items/shared-vocabulary/shared-vocabulary-imsmanifest.zip`, which the oracle
    otherwise accepts, is refused `attribute-admission`, for `object@alt` (120 occurrences; `object` declares no `alt`
    in either ASI XSD) and `qti-extended-text-interaction@patternMask` (one, for `pattern-mask`). The committed
    verdict file's row stays `refused`; only its rule moves, from `unmodeled-vocabulary` to `attribute-admission`.
    (Operator ruling "the spec wins", 2026-11-05.)
82. **No reading is advisory.** Every rule a reading here states is enforced wherever a package decides validity, as
    every rule of the XSDs is. In pantry that is a law PostgreSQL checks over the stored rows: "Every rule QTI states
    becomes a rule PostgreSQL enforces through grizzle, so invalid QTI cannot be stored", including "every structure
    and rule of the languages QTI embeds" (`docs/qti-intent.md`, "Settled" and "How it gets planned and built"). So
    the eight readings that had no law, 2 (MathML), 3 (SSML fragments), 9 (the Schematron by intent), 39, 41, 42 and
    43 (SSML's `version`, `meta`, `voice` languages and surviving attributes) and 47 (the `xsi:` attributes), are each
    a law, as every reading after them is. A rule a package cannot yet check is a recorded limit with its reason, as
    readings 50, 60 and 72 record theirs, never a rule followed only where it is convenient. This rules how the
    readings bind, not what the specification says, and it changes no verdict. (Operator ruling "the spec wins",
    2026-11-05.)
83. **The information model's binding and count sentences that no other reading restates hold as written.** Each is
    stated, and each admits content the XSD accepts, so a package that lacks it under-refuses:
    - "If max-choices is greater than 1 (or 0) then the interaction must be bound to a response with multiple
      cardinality", of the `max-choices` of the choice (section 5.30.2), hottext (5.66.1), hotspot (5.68.2), position
      object (5.107.3) and select point (5.128.2) interactions, and the same sentence of `max-associations` on the
      associate (5.8.2), gap match (5.57.3), graphic associate (5.59.2), graphic gap match (5.60.2) and match (5.89.2)
      interactions. An unwritten count is read as its XSD default.
    - "Each response variable declared may be bound to one and only one interaction" (section 2.2.2.2): no two
      interactions of an item, its included fragments among them (reading 76), name one response variable. "May"
      makes the binding optional, and "one and only one" bounds it.
    - A position object interaction's `min-choices`, where written, is at least 1: "If specified, min-choices must be
      1 or greater" (section 5.107.2). The XSD allows 0.
    - A PCI's `qti-context-variable` names a context variable: it "allows an item author to bind a context variable
      to the PCI instance" (section 5.106.6), the context variables are the declared ones and the built-in
      `QTI_CONTEXT` (section 2.2.2.1), and "All variables must be declared except for the built-in session variables"
      (section 2.2.2). The Schematron's rule 20Ba states the same.

    The other rules found with these live in the reading that states their kind: `min-strings` at most `max-strings`
    in reading 67, a feedback outcome's base type and cardinality in reading 68, no default hotspot in a graphic gap
    match in reading 71, the order interactions' counts against their choices in reading 18, and the XInclude rules in
    reading 76. This binds pantry and plate alike. This is not a case of documents in conflict. (Operator ruling "the
    spec wins", 2026-11-05.)
