# Changelog

Every change to `@qti-pie/plate` that a host can see, newest first. A change to how plate reads the
specification is a dated entry that names the reading and the corpus documents whose verdict
changes. [`docs/spec-readings.md`](../../docs/spec-readings.md) numbers the readings.

## Unreleased

These entries list the surface of M1 and M2, what M3 adds to it, and each change to how plate
reads the specification. plate is not published, and both of its entry points are unstable until
M3.

### How plate reads the shared readings after pantry's cutover, 2026-11-09 (align-54)

- plate now reads QTI 3.0 as [`docs/spec-readings.md`](../../docs/spec-readings.md) reads it after
  pantry's cutover. Each line below names its reading by number and wording, the rule and `check` a
  host receives, and the corpus documents whose verdict moves. Every corpus document and package
  that no line names keeps its verdict, its refusals and their sentences.
- Four refusal rules are new, under pantry's names: `inclusion-cycle`, `branch-target`,
  `document-lang` and `lom-learning-resource-type`. Every other new refusal is an existing rule with
  a new `check` in its detail.
- Tests and sections:
  - A section that holds only a rubric block, or nothing, is accepted and delivered. `open` refused
    it with `child-count` (reading 26, "an assessment section may hold no part"). Corpus:
    `englishHighLevelV2`'s test `Test_976288596.xml`, in its folder and in `englishHighLevelV2.zip`,
    moves from refused to `accepted-with-unsupported`. The package stays refused for its LOM title.
  - A test that declares one outcome twice, or an outcome and a context variable of one name, is
    refused `duplicate-identifier`, and so is an element whose `id` is a context variable's name
    (reading 74, "an identifier names one variable among the declarations of its document"). Corpus:
    none.
  - A `qti-selection` without replacement whose `select` is above its section's number of parts is
    refused `count-range`, check `selection` (reading 79, "a selection without replacement selects
    at most its section's parts"). Corpus: none.
  - `branch-target`: a branch rule that jumps backward, to itself, into another part, to a name the
    test does not hold, or to an item ref a selection with replacement can repeat is refused, in a
    test document and across a package's assembled test. Its `reason` says which: `backward`,
    `self`, `outside-part`, `unknown`, `repeatable` or `ambiguous` (reading 87, "a branch rule names
    a reserved exit, or a later part of its own kind in its own test part, never inside a section a
    ref places from outside it, and never an item a replacement can repeat"). A backward jump is not
    judged where delivery draws the order: where the nearest section that holds both shuffles, or a
    `keep-together="false"` section mixes them into one that does. A `fixed` choice inside a shuffle
    is not read, a recorded limit. Corpus: none.
  - A test or a section that holds an `xi:include` is `unchecked`, with the reason `xinclude`, so it
    is never delivered. Before, plate left the include out and delivered the rest. No include is
    refused for its form (reading 114, "an `xi:include` is the information model's Include only
    where its parent's model holds one"; reading 115, "an include names a document of its package or
    a resource outside it"; reading 117, "an included fragment is judged in place, as its merged
    document holds it"; reading 118, "an include holds at most one fallback"). Corpus: none.
  - A feedback element whose `outcome-identifier` names nothing, a response, a template variable or
    an outcome that is not a single or multiple `identifier` is refused, in items and in tests:
    `undeclared-variable`, or `expression-type` with check `feedback-outcome` (reading 77, "a
    feedback element names an outcome variable"). Corpus: none.
- Packages and their tests:
  - Dotted names. A read of a dotted name such as `a.b` that the test also declares whole is
    `ambiguous-reference` when item ref `a`'s item declares `b`, since the test's own variable
    counts as one reading (reading 48, "a dotted reference is accepted when exactly one reading
    names a real item ref, test part or section and its variable"). A test that sets `a.SCORE`
    without declaring it is refused `undeclared-variable`, check `setter` (reading 112, "a test's
    setter sets a variable of its own document, so a prefixed reading never resolves it"). A
    numbered name such as `Q1.2.SCORE` is accepted only where a selection with replacement can
    repeat `Q1`, and is refused `undeclared-variable`, check `numbered`, elsewhere (reading 88, "a
    numbered reference such as `Q01.2.SCORE` names an instance of an item ref that a selection with
    replacement can repeat, and nothing else"). Corpus: none.
  - A reference from outside a section document that a test places twice into that document is
    `ambiguous-reference` (reading 86, "a section document a test places twice is written once";
    reading 145, "a fragment a test or a section document splices is judged in the test that places
    it, once per placement"). Corpus: none.
  - `inclusion-cycle`: a section ref that leads back to a section document already on its chain is
    refused, and places nothing (reading 85, "an inclusion never reaches itself"). Corpus: none.
  - A `qti-variable-mapping` whose `target-identifier` names another variable of its item, or a
    built-in, is refused `duplicate-identifier` (reading 97, "a variable mapping's target names no
    other variable its item ref's item holds"). Corpus: none.
  - A test may read an item's `QTI_CONTEXT` through its item ref, which `openPackage` refused
    (reading 106, "a prefixed reference reaches every built-in variable its item ref's item holds,
    `QTI_CONTEXT` among them"). The package marks that processing, as it marks other reads of an
    item's context, and a session does not run it. Corpus: none.
  - A read of an item's built-in `duration` is no longer refused when the item is not time
    dependent, in the item or through a test's item ref, so `undeclared-variable` with
    `item-duration` is gone (reading 150, "an item's built-in `duration` may be read whether or not
    the item is time dependent"). plate holds no item duration for processing, so the verdict marks
    the processing that reads one, timed or not: an item's with `variable:duration`, and a test's
    outcome processing that reads `ITEM1.duration`. Neither runs. Corpus: none.
  - In a package whose manifest says QTI 3.0.1, every outcome declaration that writes no
    `normal-minimum`, an item's or the test's, numeric or not, has the minimum 0.0 (reading 149, "an
    outcome declaration's `normal-minimum` is 0.0 where a QTI 3.0.1 document writes none, and has no
    value where a QTI 3.0 document writes none"). A test's `qti-outcome-minimum` counts such an
    outcome, where it left it out, and `results` writes `normalMinimum="0"` for it. A 3.0.0 package,
    or a document you `open` alone, is unchanged. Corpus: no verdict moves. The results of a session
    of `BegGuide_March2025.zip` gain `normalMinimum="0"` on its six outcomes.
  - A `mastery-value` below its outcome's minimum or above its maximum is refused `attribute-type`,
    check `mastery-range`. In a 3.0.1 package the minimum is 0.0 where none is written (reading 149;
    reading 9, "the Schematron's rules are read by their intent, not their text"). Corpus: none.
  - An item that labels a body element, such as a track, a text entry, media or an object, carries
    `tool-name` and `tool-version` on its root, and in a 3.0.1 package so does an item whose root
    carries a `label`. One that does not is refused `missing-attribute`, check `label-tool`, once
    per item (reading 128, "a `label` asks for the tool that labelled it where its own
    characteristic's description says so"). Corpus: six items move to refused: `audio-video.xml`
    (accepted before) and `media_coords.xml` (`accepted-with-unsupported` before), each in
    `qtiv3-examples/packaging/items/` and in `items.zip`, and the BPIG
    `feedbackBlock-solution-random.xml` (unchecked before), in `QTI3_BPIG_Examples/items/` and in
    `BPIG_22April.zip`. `items.zip` and `BPIG_22April.zip` stay refused, each with
    `missing-attribute` added.
  - A package that holds a QTI 2 usage-data document is refused `not-qti-root` (reading 89, "a
    document whose root element is in a namespace of QTI 2 is not a QTI 3 document"). Corpus:
    `usageData.zip` moves from accepted to refused.
  - Each file reference that reading 103 lists, an image, a stylesheet, an item ref and a module
    configuration among them, resolves through the `xml:base` in scope and names a file the package
    holds or its manifest lists, or it is refused `package-file-missing`, check `reference`
    (reading 103, "a document's file references are the attributes its vocabularies define as the
    location of a file, and each one that resolves within the package names a file the manifest
    describes; an `xml:base` is a base, resolved and never a file reference"). An item ref that
    names no file is refused both `item-ref-unresolved` and `package-file-missing`. Corpus:
    `sharedStimulus.zip` (two missing images) and `BBQsTest.zip` (a missing stylesheet) move from
    unchecked to refused. `feedbackTest.zip` (a missing item) and `pci_item_examples.zip` (a missing
    module configuration) stay refused, with one more refusal each.
  - A path that resources name as two types of document is read as one, and each resource of the
    other type is refused `resource-type-mismatch`, check `path-type`. A document resource whose
    `href` names `imsmanifest.xml` is refused the same, check `manifest-document` (reading 146, "the
    manifest is the package's one document at `imsmanifest.xml`, and no resource's"; reading 162, "a
    path two document types name is the document its root bears out"). Corpus: none.
  - An item's or a test's title matches its LOM title only in the document's language, as an
    `xs:normalizedString`: tabs and line breaks read as spaces, and runs of spaces are kept. Before,
    a title in any language matched, its spaces collapsed. The `lom-title` refusal's sentence says
    so (reading 62, "an item's or test's identifier and title are those its package's LOM metadata
    gives it"; reading 151, "an item's `xml:lang` outside its value domain states no language"). An
    item or a test that writes no `title` or no `identifier` beside a LOM one is refused `lom-title`
    or `lom-identifier`, check `unwritten` (reading 148, "an assessment item or test that writes no
    `identifier` or no `title` has none for its LOM record to match"). Corpus: no verdict moves. The
    `lom-title` sentences of `englishHighLevelV2.zip`, `CASEWithOutcome.zip`, `metaData.zip` and
    `test_package_minfiles.zip` change.
  - `document-lang`: each language an item's or a test's `xml:lang` states is listed by each general
    category of its LOM record, compared as language tags (reading 134, "an item's or a test's
    languages are listed by its records' general categories"). Corpus: `BBQsTest.zip`, refused for
    this as well as for its stylesheet.
  - `lom-learning-resource-type`: a LOM `learningResourceType` of `exam` or `self assessment` from
    the LOM vocabulary is refused (reading 122, "a LOM `learningResourceType` of the LOM vocabulary
    is neither `exam` nor `self assessment`"). A LOM element repeated past the loose binding's cap
    is refused `child-count` (reading 130, "a LOM element repeats no more than the loose binding's
    Schematron allows"). Corpus: none.
  - An `href` and an `xml:base` lose their padding before they resolve. The `href` of a `cp:file` or
    of a non-document resource, or an `xml:base`, that leads outside the package is an external
    link, not refused. A document resource whose `href` is absolute, rooted or leads outside is
    refused `package-path-outside`, check `document-entry` (reading 102, "an href is read as its
    path and its params"). Corpus: none.
  - A file key that holds a backslash or begins with a drive prefix, such as `C:/x.xml`, is refused
    `package-path-outside`, check `entry-key`, where plate read it as a path (reading 138, "an entry
    path that holds a backslash or begins with a drive prefix is refused"). Reading 139 ("a package
    zip's central directory ends where its end record begins") judges a zip's own bytes, which plate
    never reads, since you unzip the package. Corpus: none.
  - An item ref that writes no `identifier` is judged like any other. One whose `href` names no item
    is refused `item-ref-unresolved`, check `unwritten` (reading 155, "an item ref that writes no
    `href` names nothing, so AL3 alone refuses it"). Corpus: none.
  - An item ref that names an LTI link, a resource of an LTI type, is accepted (reading 110, "under
    an item ref that names an LTI link a variable mapping is accepted unchecked, a recorded limit,
    and a template default is refused"). The package delivers its test with the ref marked
    `lti-link` and left out, so the link's item is never presented, and marks the outcome processing
    when it counts over the test's items. A built-in read through the ref, such as
    `lti.numAttempts`, is accepted and its processing marked. Corpus: none (`lti.zip` and
    `testWithLti.zip` stay refused at their manifests).
- Item content and interactions:
  - A choice's identifier is used by no other choice in its item, of any class, and names no item
    variable or built-in. The choices are the nine classes the information model's prose calls
    choices, pooled: simple, simple associable, inline, hotspot, associable hotspot, gap image, gap
    text and hottext choices, and `qti-gap` (reading 104, "a choice's identifier is used by no other
    choice of any class in its document, and names no item variable"). A repeat is refused
    `duplicate-identifier`, and a choice that names a variable is refused with check
    `choice-variable`. Corpus: 32 items of the `shared-vocabulary` set move to refused, 16 in
    `qtiv3-examples/items/shared-vocabulary/Items/` and the same 16 in
    `shared-vocabulary-imsmanifest.zip`: `Item_QTI3_CompWater_02` to `_04`, `Item_QTI3_Gap_Match_02`
    and `_03`, `Item_QTI3_Graphic_Gap_Match_02` and `_03`, `Item_QTI3_Hotspot_01` and `_02`,
    `Item_QTI3_Luggage_02` to `_05`, `Item_QTI3_Match_02` and `_03`, and
    `Item_QTI3_RichardTake2_01`. Of the 32, 14 were accepted, 16 `accepted-with-unsupported` and 2
    unchecked. The package stays refused, with `duplicate-identifier` added.
  - On an element the Schematron's extension-attribute lists cover, an attribute the XSD does not
    declare is refused `unknown-attribute` unless it is a `data-` attribute. Before, plate dropped
    it (reading 90, "on an element the Schematron's extension-attribute lists cover, an attribute
    its XSD does not declare is a `data-` attribute, or the document is refused"). Corpus: 7
    `shared-vocabulary` items move to refused, for an `object` with `alt` and for `patternMask`:
    `Item_QTI3_Graphic_Gap_Match_01` to `_03` in both copies, and `Item_QTI3_WritingPostcard_03` in
    the zip. Four of them are also under the line above. The package stays refused, with
    `unknown-attribute` added.
  - A Text Entry's or Extended Text's `string-identifier` names a declared `string` response other
    than its `response-identifier`, and an element's `id` may not equal a response's identifier
    (reading 14, "a text-entry interaction's `response-identifier` and `string-identifier` are
    `xs:IDREF`s"). A `string-identifier` that names a `record` response, or a response whose base
    type is spelled as anything but `string`, is refused, and no cardinality is asked of the
    response, for Text Entry and Extended Text alike. The information model asks only for "a second
    response variable (of base-type string)". The refusals are `undeclared-response`, `binding` with
    check `string-binding` or `bound-once`, and `duplicate-identifier`. Corpus: none.
  - An interaction whose count allows more than one choice, or any number, binds a `multiple`
    response (`binding`, check `count-cardinality`). Before, plate rendered it as a multi-select
    over a single response. One response binds one interaction (`binding`, check `bound-once`). A
    position object's `min-choices` is at least 1 (`attribute-type`). A PCI's `qti-context-variable`
    names a declared context variable (`undeclared-variable`, check `context-variable`). Each
    follows reading 92, "the information model's binding and count sentences that no other reading
    restates hold as written". Corpus: none.
  - A least count is at most its most, over five count pairs: `count-range`, check `count-pair`. An
    order or graphic-order interaction's counts are at most its choices (check `choice-count`), and
    its `max-choices="0"` beside a written `min-choices` is refused (reading 76, "a least count is
    at most its most, unless the most is 0"; reading 18, "an order or graphic-order interaction's
    `min-choices`, where written, is from 1 to its number of choices"). Corpus: none.
  - A default hotspot is the last hotspot choice of its interaction, and a graphic gap match has
    none: `misplaced-element`, check `default-hotspot` (reading 80, "a default hotspot is the last
    hotspot choice of its interaction"). Corpus: none.
  - A lookup table sets a single outcome: `misplaced-element`, check `lookup-cardinality`
    (reading 100, "a lookup table sets a single outcome"). Corpus: none.
  - A `source` takes no `role` (`unknown-attribute`), and a heading's `role` is `heading`, `tab` or
    `presentation` (`attribute-type`), as reading 9 reads the Schematron ("the Schematron's rules
    are read by their intent, not their text"). Corpus: none.
  - A `bdo` carries `dir`, `ltr` or `rtl` (reading 123, "a `bdo` carries `dir`"). A `source` in a
    `picture` carries `srcset`, one in `audio` or `video` carries `src`, and a media URL is not
    blank (reading 124, "a `source` in a `picture` carries `srcset`, and one in an `audio` or a
    `video` carries `src`"). A `track` with no `kind`, or `kind="subtitles"`, carries `srclang`
    (reading 125, "a `track` in the subtitles state carries `srclang`"). A MIME type is two tokens
    joined by a slash (reading 135, "a MIME type is RFC 2045's type and subtype"). Each is
    `missing-attribute` or `attribute-type`. Corpus: none.
  - Each token of a cell's `headers` names a `th` of the cell's own table, once: `attribute-type`,
    check `headers` (reading 126, "each token of a `td`'s or a `th`'s `headers` is the `id` of a
    `th` of the cell's own table"). Corpus: none.
  - No quotation mark stands immediately before, after or inside a `q`, which the browser quotes
    itself: `text-not-allowed`, check `quotation` (reading 127, "no quotation punctuation stands
    immediately before, after or inside a `q`"). Corpus: none.
  - `xml:lang`, `lang` and `srclang` hold well-formed BCP 47 language tags, or the document is
    refused `attribute-type` (reading 129, "`xml:lang`, `lang` and a track's `srclang` hold BCP 47
    language tags"). Corpus: none.
  - No interaction stands at any depth of a `qti-template-block`: `misplaced-element` (reading 143,
    "an interaction is banned at any depth of a template block"). Corpus: none.
  - A `tolerance` is one or two values, each a number above 0 or a variable's name. `0`, `-1`, an
    empty value and three values are refused `attribute-type`, check `tolerance-token`, and `+INF`
    and `1,5`, a name read at run time, are accepted: the reverse of before (reading 121, "every
    `tolerance` is one or two values, each number among them above 0"). Corpus: none.
  - A printed variable's `format` may hold text and `%%` around its conversion, or text alone, and
    `%%` prints a percent sign. All three were refused (reading 132, "a printed variable's `format`
    is a printf format string"; reading 161, "a printed variable's `format` may hold any number of
    conversion specifiers"). Corpus: none.
  - A mapping repeats no key, compared as values: `1` and `01`, `A B` and `B A` in a `pair`, and
    floats by their double. A repeat is refused `duplicate-identifier`, check `map-key` (reading 98,
    "a mapping's map keys are distinct, compared as values of its base type"; reading 154, "a float
    mapping's map keys are compared by the doubles reading 144 maps them to"; reading 160, "a
    mapping's keys repeat as written whatever its declaration's base type spells"). Corpus: none.
  - A record value writes no field twice (`duplicate-identifier`, check `field`). A record
    declaration that carries `base-type` is refused `unknown-attribute`, and every other declaration
    does, or it is refused `missing-attribute` (reading 153, "a record has no base type, so no value
    stands for one"; reading 158, "a declaration whose cardinality or base type spells nothing is
    still a declaration"). Corpus: none.
  - A QTI element in `qti-ordering`'s extension slot is checked, laxly, where plate passed over it
    (reading 61, "an element in QTI's own namespace inside `qti-ordering`'s extension slot is
    valid"). Corpus: none.
  - Under a `strict` wildcard, an element the tables declare is checked, and any other is refused
    `unknown-element` unless its `xsi:type` names a type. An `xsi:type` whose prefix nothing binds
    is refused `attribute-type` (reading 81, "a `strict` wildcard refuses any other element unless
    its `xsi:type` names a type of that set or a built-in"; reading 83, "a prefix nothing binds
    makes the document invalid"; reading 113, "a root that reading 6 keeps foreign stands under a
    `strict` wildcard that finds its declaration"). Corpus: none.
  - After a child a repeated wildcard holds, no element of an earlier particle follows:
    `misplaced-element`, check `order` (reading 96, "a repeated wildcard keeps its sequence's
    order"). Corpus: none.
  - The ID table, over the elements QTI's tables govern: a second element with one `id` is refused
    `duplicate-identifier`, an IDREF that names no ID `attribute-type` with check `idref-target`,
    and a wildcard `xml:id` on an element whose type declares an ID `unknown-attribute`
    (reading 101, "an ID that an element's text carries is bound to that element's parent";
    reading 109, "an element whose type has an ID attribute use holds no wildcard `xml:id`";
    reading 156, "an ID-typed attribute or text is one of its document's IDs only where its value is
    an NCName"; reading 84, "an element is judged under its governing type for everything XML Schema
    decides"). A manifest's identifiers are judged by the package's rules, not by this table.
    Corpus: none.
  - An identifier's characters follow XML 1.0 Second Edition, so a few rare non-ASCII letters are
    refused that were accepted (reading 94, "an `xs:NCName` takes its name characters from XML 1.0
    Second Edition"; reading 152, "a value names something only where it is an NCName"). Corpus:
    none.
  - A name that is not a valid identifier gets only its own refusal, not one from each rule that
    reads it (readings 157 to 159: "a declaration whose identifier names nothing is still a
    declaration", "a declaration whose cardinality or base type spells nothing is still a
    declaration", "a binding or a reference resolves by name to every declaration whose identifier
    names something"). Only refusal lists change. Corpus: none.
  - An item's `SCORE` or `MAXSCORE`, or a `PASSED` anywhere, declared `record` is refused
    `attribute-type`, check `reserved-outcome-type` (reading 153, and the information model's §4.5,
    "SCORE needs to be a float"). A test's `record` `SCORE` or `MAXSCORE` stays accepted, as the
    operator ruled. Corpus: none.
  - Built-ins named by kind (reading 111, "a processing element's `identifier` names a variable of
    the kind the element reads or sets"): a `qti-correct` of `numAttempts` or `duration`, a
    `qti-lookup-outcome-value` that sets `completionStatus`, a template `qti-set-default-value` of
    `completionStatus` or `numAttempts`, a template `qti-set-correct-response` of `numAttempts`, and
    a test's `qti-correct` of an item's `numAttempts` are accepted and run. A `qti-correct` or
    `qti-default` of a built-in reads what template processing set, else NULL, and never the
    built-in's own value. A mapping of a built-in stays refused. Corpus: none.
  - A `qti-graphic-order-interaction` binds an `ordered` `identifier` response (§5.61), and one
    bound otherwise is refused `binding`. A `qti-order-interaction`'s binding is not refused, since
    only the non-normative §2.4.1.2 states it. The operator ruled both, and reading 172 now says the
    same ("an order interaction may be bound to a response variable of any base type and
    cardinality"). Corpus: none.
- The operator's disputed rulings, which plate keeps:
  - `%d`: a printed variable's `format` with `%d`, or with two or more conversions, is accepted.
    `%d` prints as `%i`, the value fills the first conversion, and each later one prints as written.
    A conversion that ends in no listed code, such as `%q`, `%u` or a trailing `%`, stays refused.
  - `qti-custom-interaction`: in a package whose manifest says 3.0.0, an item that holds one is
    refused `unknown-element`, check `custom-interaction`. In a 3.0.1 package, or an item you `open`
    alone, whose version plate cannot know, it stays accepted with its notice.
  - `data-ssml`: a value that is not Data-SSML JSON, or that names an unknown property, type or
    value, is refused `attribute-type`, check `data-ssml`, its `problem` naming which. It is judged
    in every document: an item, a stimulus, and a test's or a section's rubric block. A valid value
    keeps its notice.
  - `qti-card`: an empty `qti-card` or `qti-card-entry` is accepted. It was refused `child-count`
    (reading 31, "a card holds an HTML content node, file hrefs, both, or nothing").
  - `qti-gap-match-interaction`: one with two or more gaps bound to a `single`, an `ordered` or a
    `record` response is refused `binding`, check `gap-match-single`, its `cardinality` fact naming
    which (reading 169, "a gap match interaction with two or more gaps binds a response of multiple
    cardinality"). A gap match of one gap is held to no cardinality.
  - The shared readings now agree with seven of the operator's eight disputed rulings: `%d` (P1),
    `qti-custom-interaction` (P2), `data-ssml` (P3), `qti-card` (P5), usage-data values (P6),
    `qti-gap-match-interaction` (P7) and a test's `SCORE` and `MAXSCORE` of any base type (P8). They
    agree with P4, on includes, in part: reading 115 admits an external include, and reading 85
    still refuses `xpointer` and `parse="text"`. plate keeps all eight. Nothing changes for P4, P6
    or P8.
- Later readings, each moving no corpus document:
  - A `qti-gap`'s identifier joins the choices' one pool (reading 104 as amended), so a gap that
    shares an identifier with a gap text or an inline choice is refused `duplicate-identifier`, and
    a gap named as a variable with check `choice-variable`. Corpus: none.
  - A test may declare `numAttempts` or `completionStatus`, and in a test only `duration` is
    reserved (reading 168, "a test may declare a variable named `numAttempts` or `completionStatus`;
    in a test only `duration` is reserved"). The declaration takes the place of plate's test-level
    built-in of that name, so the test's processing reads the declared variable, and a refusal that
    names it says the test declares it. A test's `duration`, and an item's three, stay refused
    `attribute-type`, check `reserved-identifier`. Corpus: none.
  - A catalog holds one card per support, `duplicate-identifier` with check `card-support`, and a
    card at most one default entry, `child-count` with check `card-default`. A `data-catalog-idref`
    names a `qti-catalog`, `attribute-type` with check `catalog-reference` (R9-a, "the catalog
    sentences of the information model hold as written"). Corpus: none.
  - A card's or card entry's `qti-file-href`, and a `qti-resource-icon`, name files the package
    holds, or they are refused `package-file-missing`, check `reference`, the refusal naming the
    `element` (R9-b, "card files and resource icons are file references"). Corpus: none.
  - An `xml:lang` inside a catalog asks for no LOM listing, so `document-lang` refuses less (R9-c,
    "R26 counts the metadata binding's elements, and catalog content is not among them"). Corpus:
    none.
  - A PCI names its module by `module`, by `qti-interaction-modules` or by both, or it is refused
    `missing-attribute`, check `pci-module-source` (R10-a, "a PCI names its module by `module`, by
    `qti-interaction-modules`, or by both"). Corpus: none.
  - Under an item ref that names an LTI link, a variable mapping's source is accepted unchecked, a
    recorded limit, and so is a name read through the ref, whose processing is marked. A template
    default under it stays refused `undeclared-variable` (reading 110 as amended; reading 106, "a
    prefixed reference reaches every built-in variable its item ref's item holds"). The mapping's
    target is judged by reading 97 ("a variable mapping's target names no other variable its item
    ref's item holds"): a second mapping of the ref with the same target, and a target that names
    `completionStatus`, `numAttempts` or `duration` other than the mapping's own source, are refused
    `duplicate-identifier`. A target of `QTI_CONTEXT` stays accepted there, since a link holds no
    item variables. Corpus: none.
  - A section ref whose `href` leads outside the package is refused `package-path-outside`, check
    `remote-section`, in the test and in each section document it places. It is a stated limit, not
    a rule of QTI: plate never fetches a section (reading 170, "a section ref whose href is external
    is refused under the stated limit 'Remote section ref'"). Corpus: none.
  - A tab, line feed or carriage return in a `data-ssml` value's `break.time` or `prosody.rate` is
    refused `attribute-type`, check `data-ssml` (R7-a, a `data-ssml` value is Data-SSML JSON).
    Corpus: none.
- Repairs after the phase's review, each moving no corpus document:
  - A session counts a numbered name such as `a.2.SCORE` as `openPackage` does, only through an
    item ref that a selection with replacement can repeat (reading 88). With item refs `a` and `a.2`
    and no such selection, outcome processing and a template default read item ref `a.2`'s `SCORE`.
    Through a section document's `a.2`, the processing is marked, as other reads through a section
    document are. `Test` and `TestScope` gain an optional `repeatable`, the identifiers of those
    item refs, which `buildTest` always gives. Corpus: none.
  - In a test's processing, and in a section document's under a test that reaches it, a
    `qti-map-response` or `qti-map-response-point` of the test's `duration`, or of the `numAttempts`
    plate keeps for a test that declares none, is refused `template-requirements`, as an item's of
    its own built-in is (reading 166, "an unprefixed `qti-map-response` or `qti-map-response-point`
    that names a built-in response variable, an item's `numAttempts` or `duration` or a test's
    `duration`, is refused under 'Mapped response' too"). A test that declares `numAttempts` keeps
    the `undeclared-variable` refusal (reading 168). The sentence for a built-in in a test's or a
    section's processing asks for a response an item declares, read through its item ref. Corpus:
    none.
  - A stimulus is judged as an item's body is for its choices, its PCIs, its table headers and its
    quotation marks. Two choices that share an identifier are refused `duplicate-identifier`
    (reading 104, "a choice's identifier is used by no other choice of any class in its document"),
    a PCI that names no module `missing-attribute` with check `pci-module-source` (R10-a), a
    `headers` token that names no `th` of its table `attribute-type` with check `headers`
    (reading 126), and a quotation mark beside or inside a `q` `text-not-allowed` with check
    `quotation` (reading 127). A stimulus declares no variables, so no choice of one is refused for
    naming a variable. Corpus: none.
  - A `qti-rubric-block` of a test or a section, and a `qti-test-feedback`, are judged for `headers`
    (reading 126) and `q` (reading 127) as an item's body is, in a test and in a section document.
    Corpus: none.
  - What the manifest's version decides is judged only on the elements the structural walk checks
    (reading 57, "in lax wildcard content, every prose rule judges the QTI elements the structural
    walk checks there"). In a 3.0.0 package, a `qti-custom-interaction` inside lax wildcard content,
    which the XSD declares only within its parents, is not refused. In a 3.0.1 package, a
    `mastery-value` inside a QTI root nested in lax content, which reading 6 keeps foreign, is not
    refused `mastery-range`. Corpus: none.
  - An element the walk passes over laxly has its `xml:id` and `xml:lang` judged, as XML Schema
    assesses it against the ur-type. Its `xml:lang` is held to reading 129's language tags. Its
    `xml:id` is held to `xs:ID`, and below an element QTI's tables govern it is one of the
    document's IDs: a repeat is refused `duplicate-identifier` (reading 101), an IDREF that names it
    resolves, and a `data-catalog-idref` that names it is refused `attribute-type` with check
    `catalog-reference`, since it names no `qti-catalog`, and not with check `idref-target`. An
    `xml:id` that a wildcard admits and that is no NCName is refused `attribute-type`, as a declared
    ID of that value is (reading 156). What the walk never visits stays unjudged, a README limit.
    Corpus: none.
  - A section document the manifest lists is judged whether or not a test reaches it: its item
    refs, its section refs (reading 170), its variable mappings and its template defaults
    (readings 97 and 110) are refused as a reached one's are, after the reached ones' refusals, in
    the manifest's order. Its expressions are judged only under a test that reaches it. Corpus:
    none.
  - The `path` of a file reference's `package-file-missing` and of an `item-ref-unresolved`, and the
    `chain` of an `inclusion-cycle`, are at most 1,024 characters: a longer one keeps its first 512
    and its last 511 characters around one `…` (U+2026). This is plate's own bound, not a rule of
    QTI, so that a hostile package cannot make its refusals too long to serialise. No corpus
    refusal carries a fact that long, so no wording moves.
  - These hostile shapes no longer take time that grows faster than their size: many sibling `q`
    elements, many default hotspots before trailing text, many resources that name one large
    document, many references under a deep `xml:base`, a section document that many parts place,
    many refusals across a test's placements, a long inclusion chain, and branch rules whose target
    many section documents write. On each, the time now grows about as the input does. No verdict,
    refusal or sentence moves.

### Record answers and `qti-field-value` (M3)

- A Text Entry or Extended Text bound to a `record` response renders as one text control. Before,
  it showed a notice in its place, and the verdict marked the response declaration
  `cardinality="record"`. A `record` response of base type `file`, or with a field of that base
  type, keeps the notice and the mark. The README's [Interactions](README.md#interactions) section
  says what a host can rely on.
- `postings` gives a `record` response a `RecordBinding`, and `decode` reads its posted text into a
  record: `stringValue`, and, when the text is a decimal number, `floatValue`, `integerValue`,
  `leftDigits`, `rightDigits`, `ndp`, `nsf` and `exponent`, each integer exact. `encode` posts a
  record's `stringValue`.
- `RecordValue` and `ResponseValue`, which is a `Value` or a `RecordValue`, are exported. `Binding`
  is now the union of `ValueBinding`, the binding of a response of a base type that `Binding` named
  before, and `RecordBinding`, and all three are exported. `decode`'s result follows its binding: a
  `Value` for a `ValueBinding`, a `RecordValue` for a `RecordBinding` and a `ResponseValue` for a
  `Binding`. `Posting.binding` is a `Binding`, so decoding every posting gives a `ResponseValue`.
- The maps of responses a host passes and gets back hold `ResponseValue`: `score`'s and
  `checkResponses`' responses, `render`'s `values`, and `Responses`, so `Step.responses`,
  `SessionItem.saved`, `Restored["values"]` and `solution`'s result. Type a map of responses as
  `Record<string, ResponseValue>` where you typed it as `Record<string, Value>`.
- `score` keeps a `record` answer in the stored record's `records`, beside `responses`. It checks
  the record's shape, never its fields' values. It refuses with `InvalidResponses` a malformed
  record, with the problem `not-a-value`, and a record for any other response or a value for a
  `record` response, with the problem `cardinality`. `InvalidResponses.expected` is
  `{ cardinality: "record" }` for a `record` response. `advance` refuses such a step with
  `StepResponseMisfit`.
- `checkResponses` judges a `record` answer to a Text Entry or Extended Text as the text typed, so
  its `pattern-mask` matches the `stringValue` as typed. `restore` gives a `record` answer back
  among its `values`, and `render` shows its `stringValue` in its control. An item whose session
  control does not allow skipping counts a `record` response as skipped while it is absent, the
  NULL record or its declared default.
- An item's first attempt starts each `record` response at its declared default, else the NULL
  record. `solution` gives each its declared correct response, else the NULL record.
- `results` writes a `record` response as a `responseVariable` with `cardinality="record"` and no
  `baseType`, whose `candidateResponse` holds a `value` per field with its `fieldIdentifier` and
  `baseType`. A NULL record writes an empty `candidateResponse`.
- `qti-field-value` runs, so plate runs all 64 expressions. It gives the value of the field it
  names, or NULL for a field the record lacks, a NULL record or an operand that is not a record.
  `qti-is-null` and `qti-match` read a record whole. The ledger no longer reports row I-9a
  (Response Processing: Full) as `limited`.
- `open` accepts a rule that sets a variable from `qti-field-value`, whatever the field, and
  `openPackage` accepts such a rule or template default in a test, because a `record` declaration
  types none of its fields. So neither knows the type of an expression whose type follows a
  field's, such as a `qti-sum` or `qti-max` over the field. When the field's base type, or the type
  of such an expression, is not the variable's, `score`, `startTest` and `advance` return
  `OutcomeMismatchError` and do not throw. For example, a `float` `SCORE` set from `integerValue`
  fails when the candidate types `12`, and so does an `integer` `COUNT` set from the `qti-sum` of
  `integerValue` and `2.0`, which is a `float`. `startTest` returns it for a template default of
  the first part that reads a field of a declared record, through `qti-default` or `qti-correct`,
  before anyone answers. Read the field whose base type is the variable's, such as `floatValue` for
  a `float`. Keep the type of an expression over a field fixed, such as a `float` set from a sum
  that includes a `float`.
- A `qti-multiple`, `qti-ordered` or `qti-repeat` built over a `qti-field-value` is NULL, as one
  built over `qti-custom-operator` is, even when the field holds a value. So `qti-container-size`
  of one is 0.
- `EngineFailure` gains `RecordOperandError`, which plate exports, for processing that reads a
  `record` response other than through `qti-field-value`, `qti-is-null` or `qti-match`. `open`
  refuses such a read in an item (P20, P23), so only a test's processing, on a test and items you
  `open` one at a time, meets it.
- A test's processing reads an item's `record` response through its item ref, such as
  `ITEM1.RESPONSE`, as the answer the item's record holds, or the NULL record when it holds none.
  Before, it read NULL. `qti-number-correct` and `qti-number-incorrect` match it against its
  declared correct response as `qti-match` compares two records, and `qti-number-responded` counts
  it when it differs from its declared default. A `record` outcome or template variable still
  reads NULL. plate never reads a context variable through an item ref. `openPackage` marks the
  processing that reads one, or leaves out the template default. When you `open` a test and its
  items one at a time, that read fails with `UnknownIdentifierError`.
- `Accepted`'s `item` gains `records`: its `record` response declarations, each with its declared
  correct response and default, absent when the item declares none. `unheld` no longer lists a
  `record` response, unless it or one of its fields has base type `file`.
- A redacted item's `responses` list a `record` response as `{ cardinality: "record", identifier }`,
  with no base type. Its Text Entry gains `cardinality`, `"record"` or `"single"`, and its Extended
  Text's `cardinality` takes `"record"`. `encodeRedacted` writes a Text Entry's `cardinality`, and
  `decodeRedacted` requires it, so a redacted item written before this change no longer reads.
- Template processing that sets a `record` response, through `qti-set-correct-response` or
  `qti-set-default-value`, is marked `record-set` at the rule and does not run.
- `open` refuses with `missing-attribute` a `qti-value` without `field-identifier` or `base-type` in
  the `qti-correct-response` or `qti-default-value` of a `record` declaration, as pantry does
  (`RecordFieldIdentifier`). It judges each field's text against the field's own `base-type`, with
  `value-type`. No corpus document declares a record, so no corpus verdict changes.
- `open` refuses a test's `record` outcome declaration as it refuses an item's: with
  `missing-attribute` a `qti-value` in its `qti-default-value` that has no `field-identifier` or no
  `base-type`, and with `value-type` one whose text is not of its own `base-type`. No corpus test
  declares a record outcome, so no corpus verdict moved.
- Both stored forms are version 4. A `StoredRecord` holds `records`, and a `StoredTestSession`'s
  `saved` holds `record` answers. plate refuses a version-3 record or session with `InvalidRecord`
  or `InvalidSession`, so a record or session written before this change no longer reads.

### How plate reads record answers (2026-11-08)

- These readings are not yet numbered in `docs/spec-readings.md`, and all of them await approval
  and can change _(pending)_:
  - A `record` answer's text is its `stringValue`, with CRLF and a lone CR made LF. An empty post
    is the NULL record.
  - When that text, trimmed of XML whitespace, is a decimal number with an optional sign and
    exponent, it also gives `floatValue`. A number past the largest double gives the largest finite
    double of its sign. `integerValue` comes only when no fractional digit and no exponent is
    written, so `5.` gives 5. `leftDigits` and `rightDigits` count the digits written before and
    after the point, zeros included. `ndp` is `rightDigits` minus the exponent, so for `1.5e3` it
    is minus 2. `nsf` counts from the first non-zero digit to the last digit written, and for zero
    it counts the digits after the point, at least 1. `exponent` comes only when one is written.
    `INF`, `-INF`, `NaN` and grouped digits such as `1,000` are not numbers here.
  - A Text Entry's `base` is not applied to a record.
  - In a declaration's written record, a NULL field is no field, a record with no field is NULL,
    and of two fields with one identifier the first written is kept. A `base-type` on the record
    declaration itself types none of its fields.
  - `qti-field-value` gives NULL for a field the record lacks, a NULL record and an operand that is
    not a record.
  - plate holds no value of a `record` outcome, template or context variable, `QTI_CONTEXT` among
    them. The verdict marks processing that reads one. A test reads a `record` outcome or template
    variable through an item ref as NULL, and `openPackage` marks a test's processing that reads an
    item's context variable that way. No printed variable prints a record.
  - A rule that sets a `record` response is marked `record-set`, so the response keeps the correct
    response and default its declaration writes.
  - `results` writes a NULL record as an empty `candidateResponse`.
  - An item whose `record` response declares no correct response is neither correct nor incorrect
    to `qti-number-correct` and `qti-number-incorrect`.
- No corpus document declares a record, reads a field or holds a context declaration, so no corpus
  verdict changes.

### Outcome processing and durations (M3)

- A test's outcome processing runs. A test session runs it from the declared defaults after
  `advance` submits an item of an individual part, once after it submits a simultaneous part, and
  once more when the test closes. `TestSession` gains `outcomes`, the test's outcomes as the last
  run left them, and `outcomeRuns`, the number of runs. In a test that holds a
  `qti-assessment-section-ref`, outcome processing that holds one of the eight outcome-only
  expressions is marked and does not run. The README's
  [Outcome processing](README.md#outcome-processing) section says what a host can rely on.
- `results` writes the test's own outcomes as the session holds them. A test with no outcome
  processing still writes its outcomes' defaults, and a test whose outcome processing the verdict
  marks still writes none of its own.
- `qti-number-correct`, `qti-number-incorrect`, `qti-number-presented`, `qti-number-responded`,
  `qti-number-selected`, `qti-outcome-minimum`, `qti-outcome-maximum` and `qti-test-variables`
  run in a test's outcome processing, and `qti-exit-test` ends the current run. A dotted name such
  as `ITEM1.SCORE` reads an item's variable through its item ref, through the ref's variable
  mappings, and a weighted `qti-variable` reads it times the ref's `qti-weight`. With
  `qti-duration-lt` and `qti-duration-gte`, plate runs 63 of the 64 expressions.
- A test reads an item's `numAttempts` as the number of attempts started, the count `results`
  writes, so `qti-number-incorrect` counts an item as attempted once it is shown, answered or not.
  `qti-number-correct` and `qti-number-incorrect` consider an item's `file` and `record` responses
  as they consider its others: an item with one that declares no correct response is neither
  correct nor incorrect. A test's `qti-default` of its own `duration` gives NULL of a single
  duration, since a built-in declares no default.
- `qti-template-default` sets an item's template defaults in a test: at the item's first
  presentation in a linear part, and when its part starts in a nonlinear part. `startTest`'s
  failure union gains `EngineFailure`, for a template default of the first part that does not fit
  its declaration, on a test and items you `open` one at a time. `advance`, whose `AdvanceFailure`
  already holds `EngineFailure`, also returns it for such a default later, and for a stored session
  whose records or template defaults do not fit its test. `openPackage` refuses such a default.
- `AcceptedTest`'s `test` gains `outcomeProcessing`, which is `absent`, `marked` or `runs` with its
  rules, and each item ref gains `weights`, `mappings` and `templateDefaults`.
- `Accepted`'s `item` gains `unheld`: its response, outcome and template declarations of base type
  `file` or cardinality `record`, keyed by identifier, which a test's processing reads through an
  item ref as NULL. It is absent when the item makes none. Each `UnheldDeclaration` holds the
  identifier, the base type and cardinality as written, and `kind`, which is `response`, `outcome`
  or `template`. A response's also holds `declaresCorrect`: whether it holds a
  `qti-correct-response`, which `qti-number-correct` and `qti-number-incorrect` read.
- A duration is a value: `Value` gains `{ baseType: "duration", value }`, its seconds as a double. A
  `qti-value`, a `qti-base-value` and a stored value of base type `duration` write its seconds as a
  float is written, such as `90.5` or `INF`, and `open` refuses an ISO 8601 duration such as
  `PT1M30.5S` with `value-type`. `qti-duration-lt` and `qti-duration-gte` run. `results` writes a
  duration as its seconds, and a printed variable prints one as it prints a float.
- `startTest`'s context takes `seed`, the session's processing seed, which keys every value the
  session's processing draws. `TestSession.seed` is that seed, or one `startTest` draws, never the
  configuration's `seed`. `TestSession` gains `shuffleSeed`, the configuration's `seed` when the
  session started, absent when it had none. It alone orders the session's shuffles, whatever `seed`
  you pass later. `itemView`'s configuration carries it, and `results` reports each shuffled order
  under it. `itemView(...).configuration.seed` is that shuffle seed, absent when there is none, and
  no longer the processing seed. A session started with no configured seed shuffles by its instance
  alone. Pass a processing seed apart from the configuration's `seed`, never one string as both.
- Both stored forms are version 3. A `StoredTestSession` holds the test's outcomes, the number of
  outcome processing runs, the shuffle seed when there is one, and the template defaults a
  nonlinear part's start computed for each item. plate refuses a version-2 record or session with
  `InvalidRecord` or `InvalidSession`, so a record or session written before this change no longer
  reads.
- `decodeSession` refuses with `InvalidSession` a session that does not fit its test: items that
  are not the test's item refs in document order, numbered from 1, parts out of order or in an
  impossible state, a record whose instance is not the session's and the item's number, dates that
  are not UTC instants or run backward, a position past the items, and outcomes that are not the
  test's declared outcomes of their declared types. Before, it checked only that the session named
  the test and its document.
- `render` draws its instance token, a lowercase UUID v4, from `crypto.getRandomValues`. It called
  `crypto.randomUUID`, which a browser gives only in a secure context, so on a page served over
  plain HTTP a `render` with no `instance` threw.
- `OutputTooLarge`'s `printed` and the redacted item's `unprinted`, in its JSON form too, gain
  `limit`: `"text"` when a printed text passed the 1,000,000 characters one text may hold, or
  `"budget"` when the printed variables passed the output budget `redact` ran under.
- `redact` holds an output budget outside 1 to 536,870,888 to that range: `NaN` becomes
  16,777,216, a fraction becomes its floor, anything above the range becomes 536,870,888 and
  anything below it becomes 1. Before, it used the number it was given.
- `open` refuses with `misplaced-element` a `qti-mapping` in a response declaration of base type
  `file` or `duration`, or of cardinality `record`, and a `qti-area-mapping` in one whose base type
  is not `point`, as pantry refuses them (`mapping-base-type`, `area-mapping-point`). Before, `open`
  refused neither. No corpus verdict changes.
- `decodeSession` also refuses with `InvalidSession` a session in which an item of a nonlinear part
  that has started holds template defaults that are not keyed by exactly the template variables its
  item ref's `qti-template-default`s set, with a key missing or one extra. It does not judge an item
  of a pending part or of a linear part. `advance` still checks the values when it shows the item.
- `openPackage` refuses with `duplicate-identifier` a part, section or item ref identifier given
  twice across a test and the section documents it reaches, as pantry refuses it
  (`structure-identifier`). It refuses the second at its section document, once however many tests
  reach that document, and keeps the first. `openPackage` also gives a verdict however long a chain
  of section refs runs. Before, a long chain, such as 8,000 section documents each naming the next,
  threw `RangeError`. No corpus verdict changes.
- In a test's outcome processing, a weighted `qti-variable` that reads an item's `integer` variable
  through its item ref is a `float` of the variable's cardinality, whether or not the item ref
  defines the weight. `qti-outcome-minimum` and `qti-outcome-maximum` are a multiple `float`, and so
  is a `qti-test-variables` with a `weight-identifier` and no `base-type`. `open` and `openPackage`
  refuse with `expression-type` a set of one of these into an outcome of another type (P20). pantry
  leaves each of these types unknown, so plate may refuse a package that pantry accepts, but only
  one that would fail at run time. The refusal of a weighted `qti-test-variables` whose `base-type`
  is not `float` (P29) now says that a weight is defined only for the base type `float` or none, and
  tells you to remove the `weight-identifier` or the `base-type`. No corpus verdict changes.
- A `qti-test-variables` with neither a `weight-identifier` nor a `base-type` is a multiple
  `integer` when every single `integer` or `float` declaration of its variable in the test's items,
  read through each item ref's variable mappings and whatever its filters, is `integer`, and a
  multiple `float` otherwise. `openPackage` types it so and refuses with `expression-type` a set of
  it into an outcome of another type (P20), and a test session decides its base type by the same
  declarations. Before, the session decided by the values it collected, so a `float` declaration
  whose value was NULL left the collection `integer`. `open` checks a test without its items, so it
  still types the collection unknown. pantry types it unknown in a package too, so plate may refuse
  a package that pantry accepts, but only one that would fail at run time. No corpus verdict
  changes.
- The `template-requirements` refusal of a test's dotted `qti-map-response` or
  `qti-map-response-point` names the response as one of the item that its item ref names, and tells
  you to give that response what it lacks in that item: a `qti-mapping`, or a `qti-area-mapping` and
  the base type `point`. Its detail gains `prefix`, the item ref. Before, it told you to declare the
  dotted name. `InvalidResponses` no longer lists `duration` among the base types `score` does not
  score, since `score` scores a duration response.
- An `undeclared-variable` refusal of a name in a test's processing, or in a section document that a
  test reaches, carries `declarer: "test"` in its detail, and its sentence names the test as what
  declares no such variable. For a response, such as the operand of a `qti-map-response`, it says
  that only an item declares responses, and tells you to name an item's response through its item
  ref, written `ITEMREF.RESPONSE`. Before, these sentences spoke of an item. An item's refusals do
  not change.
- `openPackage` marks a test's outcome processing, and leaves out a template default, that reads an
  item's context variable through its item ref (`ITEM1.CTX`, the item's `qti-context-declaration`),
  with `variable:<name>` at it. Before, the processing ran, and the first submission, or `startTest`
  for a nonlinear part's default, failed with `UnknownIdentifierError`. The marks are on the
  package's test. The test document's own verdict, judged without its items, does not carry them. No
  corpus verdict changes.

### How plate reads outcome processing and durations (2026-11-07)

- The verdict no longer marks `qti-outcome-processing`, `qti-weight`, `qti-variable-mapping` or
  `qti-template-default` in a test, nor a declaration or `qti-base-value` of base type `duration`.
- These six corpus test documents are now `accepted`. They were `accepted-with-unsupported` for
  those marks. The packages `CASE.zip` and `externalMetadata.zip` are now `accepted` as well, and
  were `accepted-with-unsupported`.
  - `qtiv3-examples/packaging/CASE/testitems/-TX_G06SAMP_000.xml`, and its copy inside `CASE.zip`
  - `qtiv3-examples/packaging/externalMetadata/testitems/-TX_G06SAMP_000.xml`, and its copy inside
    `externalMetadata.zip`
  - `qtiv3-examples/packaging/interactionMixSaxonyV3/InteractionMixSachsen_1901710679.xml`, and its
    copy inside `interactionMixSaxonyV3.zip`
- 23 other corpus test documents lose those marks and stay `accepted-with-unsupported` for features
  plate does not deliver, such as rubric blocks, test feedback and selection. No document is newly
  refused, and no item's verdict moves.
- A test session now runs the outcome processing of the tests in `CASE.zip`, `ccPackage.zip`,
  `englishBasicLevelV2.zip`, `externalMetadata.zip` and `interactionMixSaxonyV3.zip`.
- The verdict marks a test's outcome processing that reads or sets a variable plate holds no value
  for in a test, and that processing does not run _(pending)_: the test's own `numAttempts`,
  `completionStatus`, `QTI_CONTEXT` or a context variable, the `duration` of a part, a section or
  an item ref, in the occurrence form `ITEM1.1.duration` too, and a `qti-test-variables` of
  `duration`. In a test that holds a `qti-assessment-section-ref`, it also marks a dotted name that
  does not start with a part, section or item ref of the test document itself _(pending)_. It
  marks a template default that reads one, and that default is not applied _(pending)_. Nothing is
  refused, and no corpus test holds one.
- `open` refuses each of the following in a test's or a section's processing, as pantry does.
  Before, `open` judged only where a test's expressions stood and what its printed variables name.
  - With `undeclared-variable`: a name that nothing declares, other than a dotted name (P8).
  - With `expression-type`: an operand of a type its expression does not take (P23), a reference
    attribute that names a variable of another kind or type (P24), a set or lookup of another type
    than its outcome's (P20, P22), a `qti-outcome-if` or `qti-outcome-else-if` whose condition is
    not a single `boolean` (P21), a weighted `qti-test-variables` whose `base-type` is not
    `float` (P29), and a `qti-lookup-outcome-value` of a dotted name whose value is not a single
    `integer`, `float` or `duration` (P22, reading 28).
  - With `template-requirements`: a `qti-lookup-outcome-value` whose outcome holds no lookup table
    (P22).
  - With `value-type`: a `qti-base-value` whose text is not of its base type (P7).
  - A dotted name the test declares whole, such as an outcome named `A.B`, as its undotted form is:
    a `qti-correct` or `qti-map-response` of such an outcome, or a `qti-set-outcome-value` of such
    a context variable, with `undeclared-variable` (P8, P27).
- `open` refuses with `expression-placement` a `qti-variable` with a `weight-identifier` in an item,
  as pantry does (P12, reading 23).
- `openPackage` refuses each of the following, as pantry does.
  - With `undeclared-variable`: a dotted name that no reading resolves, the target of a
    `qti-set-outcome-value` or `qti-lookup-outcome-value` among them (reading 48, "a dotted
    reference is accepted when exactly one reading names a real item ref, test part or section and
    its variable", `prefixed-ref`),
    a dotted name that reads the built-in `duration` of an item that is not time dependent
    (`item-duration`), a `qti-variable-mapping` whose `source-identifier` names no outcome its item
    declares (`variable-mapping-source`), and a `qti-template-default` that names no template
    variable of its item (`template-default-target`).
  - With `ambiguous-reference`: the dotted target of a `qti-set-outcome-value` or
    `qti-lookup-outcome-value` that two readings resolve, as a dotted read already was (reading 48,
    "a dotted reference is accepted when exactly one reading names a real item ref, test part or
    section and its variable", `prefixed-ref`).
  - With `duplicate-identifier`: a second `qti-variable-mapping` on one item ref with the same
    `target-identifier` (`variable-mapping-target`).
  - With `expression-type`: a dotted read whose item variable's type breaks P20 to P24 where it
    stands, a braced name in a string attribute such as `pattern="{ITEM1.N}"` among them (P24),
    and a template default whose value is not of its variable's type (P20).
- `openPackage` reads a section document that a test reaches through a `qti-assessment-section-ref`
  as if it were inline in that test (reading 5). The test's dotted names resolve through the
  section document's item refs. `openPackage` refuses the section document's variable mappings and
  template defaults as it refuses the test's, and judges its expressions under each test that
  reaches it. A session delivers only the items of the test document's own item refs.
- The new P8 check takes a test's own `numAttempts`, `completionStatus`, `QTI_CONTEXT` and context
  variables as declared, as pantry types them for a test, so `open` accepts a read of one in the
  test's processing. `openPackage` never splits a dotted name the test declares whole, such as an
  outcome named `S.TOTAL`, so it no longer refuses one as `ambiguous-reference` when an item ref and
  one of its variables could also spell it.
- plate and pantry differ in three places until pantry follows. `openPackage` refuses a dotted
  `qti-correct` that reads anything but a response, with `undeclared-variable` _(pending)_. It
  refuses a dotted `qti-map-response` or `qti-map-response-point` that reads anything but a
  response, with `undeclared-variable`, and one whose response declares no mapping or area mapping,
  with `template-requirements` _(pending)_. pantry accepts all three.
- These readings are not yet numbered in `docs/spec-readings.md`, and each marked _pending_ awaits
  approval and can change:
  - A duration is its seconds as an `xs:double` in `qti-value`, `qti-base-value` and a stored
    value, and an ISO 8601 duration there is invalid.
  - A duration is not numerical _(pending)_. A printed duration prints its seconds as a float does
    _(pending)_. The duration comparisons compare the seconds exactly as doubles, with nothing
    truncated _(pending)_.
  - `qti-exit-test` ends only the current run of outcome processing.
  - A run's built-in `duration` is the seconds from the session's start to the run _(pending)_. A
    template default that reads it reads NULL _(pending)_.
  - A dotted name may stand in a `qti-template-default` _(pending)_.
  - One shared category is enough for `include-category` to include an item and for
    `exclude-category` to leave it out _(pending)_.
  - A weight the item ref does not define is 1.0, and a weighted read of another base type than
    integer or float, or of a name with no item ref, is unweighted _(pending)_.
  - A read through an item ref that finds no value gives NULL of the declared type and cardinality:
    a template variable the item's record does not hold yet, a `file` or `record` variable, and an
    occurrence other than the first _(pending)_. A dotted `qti-correct` or `qti-default` of a
    `file` or `record` variable gives the same NULL _(pending)_.
  - An item that declares no response is neither correct nor incorrect _(pending)_. A `file` or
    `record` response reads NULL, which matches no correct response, so an item with one that
    declares a correct response is never correct _(pending)_.
  - `qti-outcome-minimum` leaves out an item with no `normal-minimum` and applies no default for it
    _(pending)_. An item-session built-in has no `normal-minimum` or `normal-maximum`, so the
    minimum leaves the item out and the maximum is NULL _(pending)_.

### How plate reads booleans and mappings (2026-11-07)

- An `xs:boolean` attribute plate reads, such as `time-dependent`, `adaptive`, `shuffle`,
  `required`, `fixed`, `visible` and `keep-together`, takes `true`, `false`, `1` and `0`, as XML
  Schema Part 2 defines the type. plate already read all four, so no verdict changes.
- A boolean `qti-value` or `qti-base-value` is still `true` or `false` only, and `open` refuses `1`
  or `0` there with `value-type` (reading 34). The QTI XSD types both elements as strings, so it
  does not decide, and the information model permits `true` and `false`. No verdict changes.
- A value that two or more entries of a `qti-mapping` match maps by the first entry listed, as a
  point that two areas of a `qti-area-mapping` hold maps by the first area listed. The shared
  readings now say the same, as reading 165 ("a response that matches several entries takes the
  first one listed"). plate already mapped so, and no verdict changes.
- The refusal of a `qti-map-response`, `qti-map-response-point` or `qti-correct` that names a
  built-in, such as `numAttempts`, or a dotted name that reads anything but a response, says why
  and what to write instead: a built-in has no declaration, so no mapping or correct response, and
  the fix is a declared response, written `ITEMREF.RESPONSE` for a dotted name read through an item
  ref, test part or section. Before, it said to declare the name, which no declaration can give.
  The rule and the verdict do not change.

### Template processing (M3)

- Template processing runs. `open` reads each `qti-template-declaration` and the
  `qti-template-processing`, and the verdict no longer marks them. Response processing reads the
  template values, and the correct responses and defaults template processing set, from the item's
  record. The README's [Template processing](README.md#template-processing) section says what a
  host can rely on.
- `begin(document, { instance, seed })` is new. It starts an item's `StoredRecord`: it runs the
  item's template processing under the seed and sets each response and outcome to its default.
- `score` with no record fails with the new `RecordRequired` for an item whose template processing
  runs. `AdvanceFailure` gains `RecordRequired`, though a session never meets it, since a session
  always passes the item's record.
- An item scored alone, with no record, starts from its declared response defaults. Before, every
  response started at NULL, so a response the post left out scored as NULL. It now scores as its
  default.
- `restore`'s `Restored` gains `record`, the decoded record, beside `values`, and `restore` refuses
  another item's record with `RecordMismatch`, as `score` does. `score` and `restore` refuse with
  `InvalidRecord` a record of an item whose template processing runs that holds no value for one of
  its template variables. `ItemView`, and so the item that `current` gives, gains `record` too.
- `redact`, `checkResponses` and `solution` take the item's record as an optional last argument.
  With a record:
  - `redact` prints each printed variable, shows or hides each template block, template inline and
    choice by its template variable, and passes a `param-variable`'s value to each `param` that
    names it.
  - `checkResponses` judges only the interactions and the choices the page showed. It gives no
    message for a response that no shown interaction binds.
  - `solution` gives the correct responses template processing set.
- With no record, an item whose template processing runs shows a notice for each printed variable,
  template block, template inline and `param` that needs a template value, leaves out each choice
  that a template variable shows or hides, and gives NULL as the solution of each response that a
  `qti-set-correct-response` sets. plate fills in no value from a declaration.
- A redacted item's `notices` can name `qti-printed-variable`, `qti-template-block`,
  `qti-template-inline` and `param` for a part plate shows as a notice, and `template-identifier`,
  once, for the choices it leaves out with no record. They name no feature inside content the page
  does not see: a template block or inline that the record hides or plate withholds, a withheld
  `param`, or a choice that is hidden or left out. A redacted item's `responses` leave out each
  response that only content the page does not see binds.
- `encodeRedacted`'s JSON holds no `path`, so it does not say where hidden template content sits,
  and `decodeRedacted` gives every node the path `""`. It drops a `path` that older JSON holds, but
  refuses with `InvalidRedacted` older JSON whose `unprinted` names no `limit`. `redact`'s own
  result keeps its paths. Before, the JSON held each node's path.
- A printed variable prints. Before, it showed a notice, and the verdict listed
  `qti-printed-variable` as unsupported. With no record, an item whose template processing does not
  run prints its declared template defaults and its outcomes' starting values.
- `score` judges a post as the page its record showed. It refuses a choice that the record hides,
  with `ResponsesRefused`, and keeps the record's value for a response that only hidden template
  content binds, whether the page would show its interaction or a notice. A response that no
  interaction binds, or that only a notice in shown content binds, is scored as the host posts it.
- `qti-random`, `qti-random-integer` and `qti-random-float` run, so plate runs 53 of the 64
  expressions. A `qti-repeat` whose operands draw evaluates them once per pass, and gives NULL for
  more than 1,000,000 repeats.
- Template and response processing draw from an HMAC-SHA-256 stream keyed by the seed. A host
  built on an earlier commit of template processing, which drew from SplitMix32, gets other values
  for the same seed. A shuffle still draws from FNV-1a and SplitMix32, so no shuffled order changes.
- The seed is a string, where it was a number: `Configuration.seed`, `begin`'s `start.seed`,
  `TestSession.seed` and `StoredTestSession.seed`. A shuffle under the seed `"7"` gives the order
  the seed `7` gave. `configure` takes any string, number or boolean as the seed and keeps it as a
  string, so it now takes values it refused, such as `true` or `NaN`. It reads `""` as no seed.
- `TestSession.seed` is always present. It is the session's processing seed: the `seed` in
  `startTest`'s context, or 128 random bits `startTest` draws when the context gives none, and it is
  server data. A session's shuffles follow its shuffle seed, the configuration's `seed`, which
  `itemView`'s configuration carries. `begin` draws a seed when you pass none, and `score` when it
  starts a record itself. `render` draws none and keys an absent seed as `""`. Render a session's
  item with the configuration `itemView` gives. To fix the seed for `score`, start the record with
  `begin`.
- Both stored forms moved to version 2. A `StoredRecord` holds the seed, the template values, and
  the correct responses and defaults template processing set, and a `StoredTestSession` holds its
  seed as a string. plate refuses a version-1 record or session with `InvalidRecord` or
  `InvalidSession`, so a record or session written before this change no longer reads.
- From version 2, the record and the session are server data. The seed keys every drawn value,
  and the template values and correct responses can give the answers away. `ItemView` and
  `Restored` carry the record, so a host that sends either to the page now sends the answers, with
  no type error to warn it. Keep them where only your server reads them.
- A test session starts each item's record when it first shows the item, so a templated item in a
  test shows its template values. A session checks each post, and the skip rule, against the
  item's record. The skip rule, and the answered status `results` reports, take a response's
  default to be the one template processing set for it, else its declared one. So the
  `skipping-not-allowed` message says each response posted is "NULL or the default it started
  with", where it said "NULL or its declared default".
- `results` writes a `templateVariable` for each template declaration, and a shuffled interaction's
  `choiceSequence` lists only the choices the page showed. For a response that only hidden template
  content binds, it reports the value the item's record holds, as `score` keeps it, not the value a
  step saved for it.
- The plain-HTML host, `src/hosts/html.ts`, and the Astro host keep no record, so neither can
  score an item whose template processing runs.
- `Accepted`'s `item` holds `templates` and `templateProcessing`, its body holds printed
  variables, template blocks and template inlines, and a choice holds its template visibility.
- `Configuration` gains `outputBudget`, the most characters of HTML one `render` writes,
  16,777,216 by default. `configure` takes an integer from 1 to 536,870,888 and refuses any other
  value. Past the budget, `render` fails with the new `OutputTooLarge`, which names the budget and
  the item, and returns none of the page. `src/index.ts` exports `OutputTooLarge`. Its `printed`
  is none for the budget. When a printed variable's text passed its bound, `printed` names the
  bound and the variable, and the redacted item and its JSON form record them as `unprinted`.
- `redact` takes the output budget as an optional last argument, after the record:
  `{ outputBudget }` or the configuration itself, 16,777,216 when absent. It stops printing once
  the item's printed variables and `param-variable` values pass the budget, and records the one
  that passed it as `unprinted`, with the budget as its bound, so `render` fails with
  `OutputTooLarge` naming that variable, where it failed before with `printed` none. Pass the
  configuration you pass to `render`.

### How plate reads template processing (2026-11-07)

- These 14 corpus documents now run template processing and response processing: the seven below,
  each also as its copy inside `BPIG_22April.zip`, `BBQsTest.zip` or `items.zip`.
  - `QTI3_BPIG_Examples/items/adaptiveTemplate.xml`
  - `QTI3_BPIG_Examples/items/template_digging.xml`
  - `QTI3_BPIG_Examples/items/template_image.xml`
  - `qtiv3-examples/packaging/BBQsTest/id-bd44a757f562/SineRule-001.xml`
  - `qtiv3-examples/packaging/BBQsTest/id-13b92f311fc0/SineRule-002-maths.xml`
  - `qtiv3-examples/packaging/items/adaptive_template.xml`
  - `qtiv3-examples/packaging/items/template_image.xml`
- Both `template_digging.xml` and both `template_image.xml`, each with its zip copy, are now
  `accepted`. They were `accepted-with-unsupported` for their template marks. The other eight keep
  `accepted-with-unsupported` for features plate does not render, such as feedback.
- The verdict marks a template declaration of base type `duration` or `file`, of cardinality
  `record`, or with no base type, as it marks such a response or outcome declaration. Template
  processing that holds a marked feature does not run.
- The verdict marks template processing that reads `QTI_CONTEXT` or a context variable, or that
  reads or sets a variable plate does not model, and that processing does not run. Nothing is
  refused: the item is `accepted-with-unsupported`, and its record starts with no template value.
- `open` refuses each of the following, as pantry does.
  - With `expression-type`: a `qti-set-template-value`, `qti-set-correct-response` or
    `qti-set-default-value` whose expression is not of its variable's type (P20), a
    `qti-template-if`, `qti-template-else-if` or `qti-template-constraint` whose condition is not a
    single `boolean` (P21), and, in template processing, an operand of a type its expression does
    not take (P23) and a reference attribute that names a variable of another kind or type (P24).
  - With `expression-type`: a read in template processing of a response, an outcome or a built-in
    other than `QTI_CONTEXT`, through `qti-variable`, `qti-correct`, `qti-default`,
    `qti-map-response`, `qti-map-response-point` or a reference attribute (P26).
  - With `undeclared-variable`: in template processing, a reference attribute that names no
    declared variable (P8), and a template rule that names no variable of the kind it sets (P8, or
    P9 for a built-in).
  - With `attribute-type`: a printed variable's `format` that is not one printf conversion, such as
    `%d`, `%u` or `Score: %.1f` (R38).
  - With `undeclared-variable` or `expression-type`: a printed variable whose `identifier`, or
    whose `base` or `index` written as a name, names no variable of the kind and type it needs
    (`printed-variable-ref`), which in a test is an outcome the test declares, and a
    `template-identifier` that names no template variable of base type `identifier`, single or
    multiple (`template-ref`).
- `qtiv3-examples/packaging/items/template.xml` and its copy inside `items.zip` are now `refused`
  with `expression-type`. They were `accepted-with-unsupported`. Their `qti-set-correct-response`
  sets the `float` `RESPONSE` to a `qti-integer-divide`, an `integer` (P20). `items.zip` itself
  was already `refused`, so plate still agrees with pantry.
- plate and pantry differ in three places until pantry follows. plate accepts a `format` whose
  precision has no digits, such as `%.f`, and a printed variable that names the built-in
  `completionStatus`. It refuses a wrong `template-identifier` on a `qti-simple-choice`, which
  pantry does not check.
- These readings are not yet numbered in `docs/spec-readings.md`, and each marked _pending_ awaits
  approval and can change:
  - A false or NULL `qti-template-constraint` starts template processing again, at most 100 times
    in one run, and then the declared values stand.
  - `qti-random-integer` gives NULL when `max` is below `min` or `step` is 0 or below, and when
    `min` or `max` has more than 1,000,000 bits _(pending)_. `qti-random-float` gives NULL for a
    NaN or infinite bound, or when `max` is below `min` _(pending)_.
  - A drawing `qti-repeat` gives NULL for more than 1,000,000 repeats, and NULL as soon as a pass
    gives no value.
  - A printed tie rounds half away from zero on the shortest decimal, so 0.25 at `%.1f` prints
    `0.3`. Negative zero prints as `-0`. `index` counts from 1 _(pending)_, and `power-form`
    applies only with no `format` _(pending)_. `power-form` writes an ASCII `x`, as the information
    model writes it, so 1.5e21 prints `1.5 x 10 to the power 21`. An earlier commit of template
    processing wrote `×`.
  - Under `%i`, `%o`, `%x` or `%X`, a float prints its shortest decimal's integer part, truncated
    toward zero _(pending)_, so `%i` of `1e23` prints `100000000000000000000000`. An earlier commit
    of template processing cut the double's binary value and printed `99999999999999991611392`.
    An infinity or NaN prints `inf`, `-inf` or `nan` under those conversions, in upper case under
    `%X` _(pending)_. Under `%o`, `%x` or `%X`, a negative writes `-` and its digits
    _(pending)_. A `base` outside 2 to 36 writes base 10 _(pending)_.
  - A width or precision past 1,000,000 makes `render` fail with `OutputTooLarge`, which names the
    printed variable and the bound. So does a value whose whole printed text, delimiters included,
    would pass 1,000,000 characters, and a `param-variable` value whose text would, named by its
    template variable. An earlier commit of template processing printed nothing in their place, as
    for NULL.
  - A `param-variable` that holds a container passes its values joined by `;`, and NULL passes an
    empty value. The standard sets no written form for either, so these follow how a printed
    variable prints a container and NULL by default.

### How plate reads SCORE, MAXSCORE and PASSED (2026-11-07)

- `open` refuses an outcome declaration named `SCORE` or `MAXSCORE` whose base type is not `float`
  in an item, and one named `PASSED` whose base type is not `boolean` in an item or a test. The
  rule is `attribute-type`, at the declaration's `base-type`. The information model says these
  outcomes must have those types, and pantry refuses the same. A test's `SCORE` and `MAXSCORE` may
  have any base type, since QTI 3.0 types only an item's. pantry refuses them in a test too, so
  there plate accepts what pantry refuses until pantry follows. No corpus test declares a `SCORE` or
  `MAXSCORE` of a base type other than `float`, so no verdict moves. A `record` declaration of those
  names is accepted _(pending)_, and so is a response or template declaration of them.
- `qtiv3-examples/items/shared-vocabulary/Items/Item_QTI3_WritingPostcard_02/extended_text_qti3.xml`,
  which declares an `integer` `SCORE`, and its copy inside `shared-vocabulary-imsmanifest.zip`, are
  now `refused`. They were `accepted`. The package `shared-vocabulary-imsmanifest.zip` is now
  `refused`, as pantry has it. It was `unchecked`.

### Response processing (M3)

- In inline response processing, `score` runs every response rule and 50 of the 64 expressions
  QTI 3.0 defines. Before, it ran `qti-response-condition` and `qti-set-outcome-value` over eight
  expressions. `open` marked processing that held anything else, and that processing did not run.
  The README's [Scoring](README.md#scoring) section lists the 14 expressions that later stages of M3
  bring.
- `qti-lookup-outcome-value` maps a value through its outcome's `qti-match-table` or
  `qti-interpolation-table`, and the verdict no longer marks either table. `qti-exit-response` ends
  processing, and a `qti-response-processing-fragment`'s rules run where the fragment stands.
- `qti-equal` runs in its `absolute` and `relative` tolerance modes, as well as in `exact`.
- The verdict still marks `qti-custom-operator`, but its processing now runs, with the operator's
  value NULL. That NULL stands for a value plate cannot know, so a `qti-multiple`, `qti-ordered`,
  or `qti-repeat` that holds the operator's value is NULL as well. `qti-container-size` of such a
  container is 0, `qti-is-null` of it is true, and `qti-member` and `qti-contains` of it are NULL.
- The verdict still marks processing that holds any of these, and `score` does not run it: one of
  the later expressions that an item may hold, an `xi:include`, a `%` coordinate in a `qti-inside`
  or an area mapping, a `qti-pattern-match` pattern that plate cannot translate, a
  `qti-lookup-outcome-value` that sets an outcome of cardinality `multiple` or `ordered`, or a
  variable that plate holds no value for.
- `open` refuses each of the following, as pantry's processing checker does. The refusals with
  `expression-type` and `undeclared-variable` judge only inline response processing.
  - With `expression-type`: a `qti-response-if` or `qti-response-else-if` whose condition is not a
    single `boolean` (P21), an operand of a type its expression does not take (P23), and a
    reference attribute, such as `qti-index`'s `n`, that names a variable other than a single
    template or outcome variable of the attribute's base type (P24). Before, `open` judged the
    operands of `qti-equal` alone.
  - With `undeclared-variable`: a reference attribute that names no declared variable (P8), the
    built-in `duration` read in an item that is not time dependent (`item-duration`), and a
    `qti-lookup-outcome-value` that sets the built-in `completionStatus` (P9).
  - With `attribute-type`: a literal `figures` below 1, or below 0 in `decimalPlaces` mode (P10),
    and a literal `n` of `qti-index` below 1 (P11).
  - With `missing-attribute`: a `qti-equal` in `absolute` or `relative` mode that has no
    `tolerance` (P36).
- `open` also refuses each of the following with `attribute-type`, as pantry does. Before, `open`
  refused none of them.
  - A declaration named `completionStatus`, `numAttempts` or `duration`, the names of the built-in
    variables, in an item or a test (`DeclarationNotReserved`).
  - A `qti-equal` whose `tolerance` holds a token that is neither an `xs:double` nor a variable's
    name (an NCName), such as `1,5` (P6).
- Where QTI makes an integer a float, an integer beyond the largest finite float becomes the
  largest finite float of its sign (reading 45). Before, it became an infinity.
- `qti-inside` and an area mapping decide exactly whether a `circle`, `ellipse` or `poly` area
  holds a point, at any size. A point on the area's boundary is inside it (reading 52). For
  example, the point (312, 305) is now inside the ellipse `300,300,13,13`, so an answer at that
  point can score differently. Before, these tests rounded and could overflow. A point on the
  boundary could fall outside, and a huge area could hold a point far outside it. A coordinate
  beyond the largest finite float still reads as that float, as before.
- The math functions run on plate's own port of FDLIBM 5.3, so they give the same result in Node,
  Chromium and WebKit. [`NOTICE`](NOTICE) holds Sun's notice for the ported routines.
- `qti-sum`, `qti-subtract`, `qti-product` and `qti-lcm` give NULL for an integer result of more
  than 1,000,000 bits. `qti-multiple`, `qti-ordered` and `qti-repeat` give NULL for a container of
  more than 1,000,000 values. Values written in an item or stored in a record are never bounded.
  These bounds limit size, not time, so call `score` and `advance` on items you do not trust under
  a time limit.
- Processing reads and sets the built-in `completionStatus`, and an item's `StoredRecord` holds it
  among the outcomes. It is `not_attempted` before the first attempt and `unknown` when the first
  attempt's processing starts, and each later attempt starts from the value the last one left. The
  record's `version` stays 1. A record that does not hold `completionStatus`, such as one written
  before this change, still reads, and its next attempt starts it at `unknown`. Once an attempt has
  run, `results` reports the value the record holds.
- The verdict still marks an adaptive item `adaptive="true"`, and its processing runs as a
  non-adaptive item's. Each attempt starts from the declared defaults, so outcomes do not add up
  across attempts until M5.
- `Accepted`, which `@qti-pie/plate` exports, holds `item: Item`, so a host's types see the `Rule`
  and `Expression` types of `item.processing`. Their shape changed. Every expression is a
  `{ kind, operands, … }` variant of one of the 64 kinds. A leaf such as `variable` has
  `operands: []`, and `is-null`'s `operand` is now `operands`. `Rule` gains the kinds
  `lookup-outcome` and `exit`, and an `OutcomeDeclaration` holds its `lookupTable`. The list of
  exports is unchanged, and so is `EngineFailure`.

### Inline Choice (M3)

- `render` writes an Inline Choice as a native `select`. Its first option, the author's
  `data-prompt` or else "Select an answer", posts an empty value, which `decode` reads as NULL. In
  `review` and `solution`, the `select` is disabled and posts nothing.
- `render`'s `parts` option takes the key `inline-choice-interaction`, with the parts `root`,
  `label`, `control`, `placeholder` and `option`.
- `PartSwapRefused` has a new cause, `select-content`. It refuses a replacement for `control`,
  `placeholder` or `option` whose root does not hold exactly the nodes the part function receives,
  directly under it and in the order given.
- A replacement for `control` may not return a `select` that is `multiple` or has a `size` other
  than 1, and one for `placeholder` or `option` may not return an `option` with a `label`.
  `PartSwapRefused` refuses either with the cause `root-not-allowed`.
- `checkResponses` and `score` judge an Inline Choice's response. For an identifier that names none
  of its choices, `checkResponses` gives a message and `score` returns `ResponsesRefused`. Before,
  both took any identifier.
- `encodeRedacted` and `decodeRedacted` carry an Inline Choice, `results` reports a shuffled Inline
  Choice's order, and `src/styles.css` styles its parts.

### How plate reads an Inline Choice (2026-11-06)

- `open` builds an Inline Choice where it showed a notice before.
  `QTI3_BPIG_Examples/items/QTI3-inline-choice.xml` and
  `qtiv3-examples/packaging/items/inline_choice.xml` are now `accepted`. They were
  `accepted-with-unsupported`.
- `open` refuses an Inline Choice whose response is not of cardinality `single` and base type
  `identifier`, with the rule `binding`. The rule judges every Inline Choice, whatever its choices
  hold, one inside a feedback block included.
- `open` refuses two choices of one Inline Choice that share an identifier, with the rule
  `duplicate-identifier`.
- An item that breaks either rule is now `refused`. Before, it was `accepted-with-unsupported`, or
  `unchecked` when it also held something plate leaves unchecked, such as MathML. No corpus
  document breaks either rule.
- An Inline Choice whose choices hold anything but text and the inline elements that
  [`src/vocabulary.ts`](src/vocabulary.ts) lists keeps its notice, since an `option` shows only
  text. The verdict lists it as unsupported, and nothing is refused for it.
- `min-choices` above 1 on an Inline Choice is validated as written, as a Choice's is. Its response
  holds at most one identifier, so under `validateResponses`, `checkResponses` gives a message for
  every response.

### Items (M1)

- `open` checks an item's bytes and returns a verdict that names each feature plate does not render.
- `configure` decodes the host's settings into a `Configuration`.
- `redact` copies an accepted item without its correct responses and response processing.
  `encodeRedacted` and `decodeRedacted` carry that copy as JSON.
- `render` writes an item as HTML, with native controls for choice, text entry and extended text.
  Its `parts` option swaps a part for the host's own markup, built with `h`.
- `renderStatus` writes the Status part.
- `entryName`, `encode`, `decode`, `partition`, `isPosted` and `checkInstance` write and read a
  native form's entries.
- `checkResponses` validates responses. `score` scores them with inline response processing and six
  built-in templates, and returns the record the host stores.
- `src/styles.css` is the default theme. It reads shadcn's token names.

### Tests and packages (M2)

- `openPackage` checks a content package, and `itemRefs` lists a test's item refs.
- `startTest`, `current`, `itemView` and `permits` start a test session and say what it shows.
- `navigationState`, `allowedIntents`, `advance`, `intentName`, `encodeIntent` and `decodeIntent`
  are the navigation API. `renderNavigation` writes the navigation parts as plain buttons.
- `encodeSession` and `decodeSession` write a test session as a `StoredTestSession` and check one
  handed back.
- `restore(document, record)` gives an item's values back from its `StoredRecord`, and `solution`
  gives its correct responses.
- `render`'s `mode` option shows an item in `review` or `solution`, and `renderStatus` takes the
  headings `review`, `solution`, `partSubmitted` and `testFinished`.
- `results` writes a Results Reporting document for an item or a test session.
- `postings` lists each response that an interaction binds, with the response's binding and the
  options `decode` takes, so `decode` reads a posted Text Entry in the base its binding declares,
  not always in base 10. A response that no interaction binds has no posting, and keeps the value
  its record holds.
- `@qti-pie/plate/styles.css` is an entry point.

### Changed since M1

- `open` accepts tests, sections and stimuli, which M1 left unchecked. Every verdict carries `kind`,
  so read an accepted item with `acceptedItem`.
- A `StoredRecord` carries `version: 1`. plate refuses a record that M1's `score` wrote, since it
  names no version.
- A Text Entry's and an Extended Text's controls carry `autocomplete="off"` in every mode.
- `PartSwapRefused` refuses with `root-not-allowed` a replacement for a Text Entry's `control`
  that writes its type in another case, such as `TYPE="checkbox"`, as it already refused
  `type="checkbox"`.
- A replacement's attribute whose name differs only in case from one plate computes, such as
  `NAME` beside `name`, is dropped, so the root holds one attribute of that name, plate's. Before,
  both were written, and the browser read the replacement's.
- A replacement can no longer set a state plate leaves off: its `checked`, `selected`, `disabled`,
  `readonly`, `name`, `value` or `type`, in any case, is dropped on a part whose state plate
  computes, as are `disabled` and `hidden` on an Inline Choice option. So a replacement cannot set
  a control's own state or content. Disabling controls through an ancestor, such as a container
  swapped to a `fieldset disabled` or marked `inert`, is the host's; `render`'s `disabled` option
  is the supported way to disable every control. A Label replacement that is not a `label` carries
  no `for`, and still names the control through its id. Before, both were written.
- `PartSwapRefused` refuses with `select-content` a replacement for an Extended Text's `control`
  whose `textarea` holds anything beside the restored answer, or anything at all when no answer is
  restored, since a textarea posts its text. Before, host text beside the answer was accepted and
  posted as the candidate's.
- `decode` refuses posted text that holds a character XML 1.0 cannot carry, such as U+0000 or
  U+FFFE, with `Malformed` and the reason `character`. A stored record or session with a string or
  URI value that holds such a character is refused when plate reads it back.

### Changed during M2

A host built on an earlier commit of M2 sees these changes.

- `advance` ignores the responses a step carries when the current item is closed, and still carries
  out the step's intent. A closed item keeps the responses it closed with, which `itemView` shows
  and `results` reports.
- When the current item is open, `advance` refuses with `StepResponseMisfit` a step that carries a
  response the item does not declare, or one that does not match its declaration's base type and
  cardinality. `results` refuses with `InvalidSession` a test session whose item holds such a saved
  response.
- Under `allow-skipping="false"`, only the responses that `postings` lists count as answering an
  item. An item with none of them is never refused as `skipping-not-allowed`.
- An accepted package's `files` leaves out the document of every QTI resource: items, tests,
  sections, stimuli, outcome declarations, response processing, response-processing templates and
  fragments. It also leaves out every file listed by a QTI resource that has no `href` or an
  absolute one, because plate cannot tell which of them is its document. A QTI document listed in
  any other way stays.
- `restore` takes the item as well as its record, `restore(document, record)`. It refuses with
  `InvalidRecord` a record whose responses or outcomes do not fit the item's declarations.
  `results` refuses such a record too: with `InvalidRecord` for an item, and with `InvalidSession`
  for an item of a test session.
- `results` refuses a context with a `sourceId` that holds a character XML 1.0 cannot carry, with
  `InvalidResultContext`.
- `startTest` resolves a test's item hrefs as `openPackage` does. A test now starts when its
  package's location holds a percent escape such as `%41` or a `./` segment, or when its
  directory's name holds a percent escape. Before, `startTest` refused each with
  `TestNotDeliverable` and the reason `item-mismatch`.
