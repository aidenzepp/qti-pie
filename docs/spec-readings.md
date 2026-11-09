# Specification readings

How this repository reads QTI 3.0 and the languages it embeds where a specification is silent, ambiguous or split
between its schema and its prose. Every package follows these readings: the qti package when it accepts or refuses a
document, and the renderer when it renders one, so the two never disagree about the same file. Each reading is an
operator ruling. A new reading lands here by pull request, and a package that needs one asks the operator first.

## Validity

1. **Nothing valid is refused, except under a stated limit listed here.** Content that is valid QTI 3.0, including
   every language QTI embeds, is accepted, and content that is not valid is refused. The only exceptions are the
   stated limits below, each with its cause and the reading that states it, and reading 91 has each say what would
   lift it. A limit not on this list is not one: a package that refuses valid content, or accepts invalid content, for
   a reason this list does not give breaks this reading. A case that is both outlandish and absent from 1EdTech's
   official example packages may sit on the list, with a sensible default recorded plainly rather than built for. The
   list licenses neither accepting what QTI bans nor refusing ordinary valid content: each limit is narrow, refusing
   only what a package cannot represent or accepting only what it cannot check, for the cause it names.

   Limits that refuse valid content:
   - **Key-text bound** (`key-text-bound`): a text a key holds is at most 2,587 UTF-8 bytes, what a PostgreSQL B-tree
     entry leaves it beside the widest key's other columns (reading 133, with its copies in readings 2 and 60).
   - **Element depth** (`element-depth`): at most 256 elements are open at once, the bound `@qti-pie/crust`'s reader
     keeps for pantry and plate alike (`defaultElementDepth`, as in `xmllint`). XML and QTI set no depth; the bound
     protects the recursive walks over a read tree, and nesting that deep is outlandish and absent from the official
     packages (decision 445, stated here).
   - **Href form** (`href-form`): an href the importer reads no name from, such as a `%` that starts no
     percent-encoding, since the representation states no path for it (reading 102).
   - **Remote section ref** (`remote-section`): a section ref whose href is external, since the import is offline and
     never fetches the section the test is built from (reading 170).
   - **Fragment context** (`fragment-context`): a fragment two includes place under different nearest interactions,
     since each written element is one row, judged in one context (reading 117).
   - **Include root**: an include whose parent admits only a kind the composition splits by context, such as a
     template inside a rubric block, since a fragment's root is read by its name alone (reading 116).
   - **Idref target** beside an external include: an IDREF naming an ID only the unfetched resource could hold, since
     pantry cannot tell an ID that resource holds from one it lacks (reading 115).
   - Admissions by version: a wildcard reads an element or an attribute as a declaration of any schema set its kind's
     documents use, and an `xsi:type` as a type of any schema its version pins, not only its own document's set, so
     such an element is judged, and may be refused, where XML Schema would not assess it, since the grammar is keyed
     by version and not by schema set (readings 81 and 60).
   - **Astral identifiers**: an identifier holding a character from U+10000 up, such as U+1D538, is outside
     `xs:NCName` and refused by "value domain" on both sides. XML 1.0 Fifth Edition admits characters from U+10000 up
     in names, so this refusal rests on our reading 94 (XML Schema 1.0's NCName) and is a stated limit of ours, not a
     ban in the standard. The import still writes the derived row or the key such an identifier would have, so it also
     breaks "E1 derived" on a section identifier, "Section identifier target" or "Choice identifier key", which the law
     oracle does not raise, and the rule named first may differ. Outlandish and absent from the official packages;
     lifted by reading names from XML 1.0 Fifth Edition (reading 94), or by writing no row for a value outside its
     domain (decision 463, stated here).

   Limits that accept content without a check:
   - MathML prose rules no structural law reads, such as the definition a `definitionURL` names, and the importer's
     `cn` and row checks that stop short of the law oracle's, where no row carries what the oracle reads (reading 2).
   - A complex `xsi:type` under a wildcard, which needs a general XML Schema validator, and `xs:ENTITY`, which needs
     the DTD's unparsed entities (reading 50); plate's text under a wildcard, open for plate's own goal (reading 60).
   - A branch rule's order under a shuffle that `fixed` would hold, since `fixed` is not read (reading 87).
   - A variable mapping and a prefixed reference through an item ref that names an LTI link, since the package states
     no declaration to check them against (readings 106 and 110).
   - An external include's content, which pantry never fetches (reading 115), and a fragment's `xml:lang` forms and a
     rule fragment's other types, read in its own document until each is stated in place (reading 117). A rule
     fragment's map response ("Mapped response", P27) and a reference that is itself a condition ("Condition type",
     P21) are stated in place, typed in each item that places it. Its composite expressions (P20 to P29), a condition
     reference to a record, which has no base type, and its processing language are not. The composites and the record
     reference move a verdict: the import accepts a type error there that the law oracle, typing the fragment in its
     item, refuses. Absent from the official packages, none of which includes a rules fragment; lifted by typing an
     expression once per placement, planned as its own goal (decisions 465 and 466, stated here).
   - An `xi:fallback` in wildcard content, until a law holds a fallback to its parent (reading 118).
   - A URL's syntax and a `srcset`'s candidates beyond a file reference, since the URL and HTML Standards are living
     documents that no pinned source holds (reading 124).
   - A `’` that closes a quote around a `q`, since it is as often an apostrophe (reading 127).
   - A language tag's validity and a MIME type's registration, since IANA's registries are dated datasets that no
     pinned source holds (readings 129 and 135).
   - A `data-ssml` stored without the importer, since no pattern grizzle admits fits its language (reading 137).
   - A test's prefixed `qti-variable` and an unweighted `qti-test-variables` with no `base-type`, typed `unknown` until
     an expression is typed once per assembly (reading 167, decision 435).

   Limits that change no verdict, only the laws a refused package is found to break, and at most the rule it is named
   by:
   - Where a manifest's path breaks two laws, the refusal names the CHECK PostgreSQL judges first (reading 162).
   - A record file (`resourcemetadata/xml`) whose root is a `cp:manifest` and whose `cp:resource` owns a LOM record
     also breaks "E1 derived", which the law oracle does not raise: the import writes a `LomResource` for the package
     manifest's resources alone, while the record that resource owns is still read, and is held to a `LomResource`.
     A learning resource type the LOM vocabulary forbids in that record also breaks "LOM learning resource type",
     which the law oracle does not raise either: it reads a type only in a record's document, and a record file whose
     root is a `cp:manifest` is none (reading 122). The record read so also breaks "E1 derived" on its general object
     and "LomObjectIdentifier" on its identifier, which the law oracle does not raise either. "RootOfType" refuses the
     file on both sides, since such a file's root is a `lom:lom`, though the import can name the refusal
     `lom-identifier` where the law oracle names `root-type-reverse`. Outlandish and absent from the official packages;
     lifted by reading no record a record file's `cp:resource` owns (decision 449, stated here; decision 460, on the
     learning resource type; decision 463, on the general object, the identifier and the rule named).
   - An inclusion cycle closed only by an include that may not stand for its target's root breaks "Inclusion cycle"
     in the law oracle and not in the import: XInclude still recurses through such an include (reading 85), but the
     import places a child instance only at a site that places its target. Both refuse the package under "Include
     root" (reading 116), so the rule stays "Include root"; a cycle every edge of which is a standing include breaks
     "Inclusion cycle" on both sides. Outlandish and absent from the official packages; lifted by counting a
     non-standing include as an edge of the import's cycle (decision 451, stated here).
   - An element the grammar admits under its own parent, nested inside a forbidden element, such as a `cpx:variant`
     inside a 3.0.1 `cpx:variant`'s metadata, binds its ID in the import, though the law oracle drops the forbidden
     element's whole subtree. An ID it duplicates then breaks "DocumentId key" beside the ancestor's "N5 admitted",
     which refuses the package on both sides, so the refusal can be named "DocumentId key", which ranks first, where
     the law oracle names another rule. Outlandish and absent from the official packages; lifted by binding only an
     ID whose every ancestor the grammar admits (decision 452, stated here).
   - An empty value, such as an item ref's or a metadata object's `identifier=""` or a branch rule's `target=""`,
     still writes its derived row in the import, which then breaks "E1 derived" (an object identifier, a test token)
     or "Branch target", which the law oracle does not raise: it leaves the value to "value domain". An LTI resource
     type written in a 3.0.0 package, outside 3.0.0's domain, is the same shape the other way: the import reads it as
     an LTI link and the law oracle as no type, so the oracle alone raises "Prefixed reference" on a reference through
     it. "Value domain" refuses each on both sides, though the rule named first may differ. Outlandish and absent from
     the official packages; lifted by writing no derived row for a value outside its domain, and by both sides reading
     an out-of-domain resource type alike (decision 463, stated here).
   - Two identifiers outside their domain that share a value, such as two resources' or two hottexts'
     `identifier="0"`, are keyed by the import, which then breaks "DocumentId key" or "Choice identifier key", while
     the law oracle reads each as no identifier. "Value domain" refuses the package on both sides, though the rule
     named first may differ. Outlandish and absent from the official packages; lifted by keying only identifiers inside
     their domain, as decision 457 (2) does for one key (decision 463, stated here).
   - A required attribute or child left unwritten, such as a selection's `select`, a variable mapping's source or
     target, a template default's expression, or a slider's lower or upper bound, writes no row in the import, while a
     containment wants one per node, so the import breaks "Test overlay", "Template default target" or "E1 derived",
     which the law oracle does not raise. "AL3 required" refuses the package on both sides, though the rule named first
     may differ. It is kin to lane NIL's "(6) the absence defaults": an absent required attribute writes no row.
     Outlandish and absent from the official packages; lifted by a law that wants the row only where the attribute or
     child is written (decision 463, stated here).
   - A second child the content model forbids, such as two expressions under a template default or two mappings under
     one declaration, also breaks a per-parent key ("E1 derived") or a typing law ("Template default type") in the
     import, which the law oracle does not raise. The reverse holds for a record's repeated field whose values write no
     base type: the law oracle raises "Record field key", while the import writes no field row. "Arity", "N7 Last" or
     "Value cardinality" refuses the package on both sides, though the rule named first may differ. Outlandish and
     absent from the official packages; lifted by keying or typing only the child the content model admits (decision
     463, stated here).
   - A document whose root its type refuses, such as a section resource rooted at response processing or at a response
     condition, or an item document typed as a section, is still read by the import as its type's. Its references
     break "Variable declared", "Variable kind" or "Prefixed reference", and an item so placed twice breaks "Choice
     identifier key" on its placed choices, none of which the law oracle raises: it reads no references there.
     "RootOfType" refuses the package on both sides, though the rule named first may differ. It is decision 449's kin,
     for section and item documents. Outlandish and absent from the official packages; lifted by reading no references
     in a document whose root its type refuses (decision 463, stated here).
   - Under an inclusion cycle or a banned ancestor, one side reads less than the other. The law oracle drops content
     the import still reads: a test that places itself as a section loses its sections, so the oracle alone raises
     "Section identifier target", and a fragment that includes itself has its identifiers held to "value domain" by
     the import alone. A forbidden 3.0.1 `cpx:variant`'s `identifierref` is still checked under "Idref target" by the
     import, though the oracle drops the forbidden subtree (decision 452's limit above). The reverse holds for a
     context variable in a section document, which stands only in a PCI in a rubric, where "N6 ancestry" bans the PCI:
     the import writes no reference for it, and the oracle alone raises "Context variable reference". "Inclusion
     cycle", "N5 admitted" or "N6 ancestry" refuses the package on both sides, though the rule named first may differ.
     It is kin to decisions 451 and 452. Outlandish and absent from the official packages; lifted by the import
     dropping that content as the law oracle does, and by the import writing a section document's context references
     as the oracle reads them (decision 463, stated here).
   - One fragment placed in two items, once inside feedback and once outside, breaks "Adaptive feedback" in the
     import, which the law oracle does not raise: the import judges an interaction's feedback context per written node,
     not per placement, as in reading 117's fragment-context limit. "Binding declared" refuses the package on both
     sides, though the rule named first may differ. Outlandish and absent from the official packages; lifted by judging
     a fragment's feedback context per placement (decision 463, stated here).
   - `xml:base` on a `cp:resource` makes the import and the law oracle attach the resource's LOM record differently,
     so one side raises "LomObjectTitle" where the other does not. Any `xml:base` on a `cp:resource` breaks "Href
     listed" on both sides, which refuses the package, though the rule named first may differ. Outlandish and absent
     from the official packages; lifted by resolving a resource's `xml:base` alike on both sides (decision 463, stated
     here).
   - Two documents that fail the codec differently, such as a binary file typed as a fragment beside a document whose
     root has no namespace, are refused on both sides, and each side names the first in manifest order, so the rule
     named moves with resource order. Outlandish and absent from the official packages; lifted by a codec precedence
     that names one rule whatever the order (decision 463, stated here).

   (2026-10-30, restated without exceptions 2026-11-03. Amended under the operator's ruling of 2026-11-07, register
   D1, to defer to this list; the element-depth limit added by decision 445; the three limits that change no verdict
   after reading 162's added by decisions 449, 451 and 452; the limits added by decision 463; the rule fragment limit
   that moves a verdict stated by decisions 465 and 466.)

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
     `positive-integer` one "not consisting solely of "0"s", `integer` "an optional "-" (U+002D), followed by a string
     of decimal digits", and `number` "an optional prefix of "-" (U+002D), followed by an unsigned number", an unsigned
     number being "a string of decimal digits with up to one decimal point (U+002E)". The XSD types them
     `xs:unsignedLong`, `xs:positiveInteger`, `xs:integer` and `xs:decimal` (`mathml3-presentation.xsd` lines 93, 133,
     96 and 99, as `mathml3-presentation.rnc` does at lines 60, 75, 61 and 62), which admit a `+`, and `-0` for the
     first (reading 73), where §2.1.5.1 says "An explicit plus sign ('+') is not allowed as part of a numerical value
     except when it is specifically listed in the syntax". A value meets both, so `length`, `columnspan`, `rowspan`,
     `selection`, `position`, `shift`, `index` and `scriptsizemultiplier` take the notation's lexical space within the
     type's bounds, whitespace collapsed as the type collapses it (§2.1.5.1 asks only that outer whitespace "should be
     avoided"): `scriptsizemultiplier="+0.5"` is refused, and `-0.5`, `.5` and `5.` are admitted. `scriptlevel`, of the
     XSD's `m:integer` too, keeps its sign, because its own row states `( "+" | "-" )? unsigned-integer` (§3.3.4.2). A
     content `cn`'s `base`, which the XSD leaves untyped and the RelaxNG types `text` (`mathml3-content.xsd` line 18,
     `mathml3-content.rnc` line 34), "is a base 10 positive integer giving the value of base in which the text content
     of the cn is to be interpreted" (§4.2.1.3), so it takes `positive-integer`'s notation over the XSD's
     `m:positive-integer`, whitespace collapsed likewise: `base="16"` and `base=" 2 "` are admitted, and `base="+10"`
     and `base="0"` refused. "The base attribute should only be used on elements with type "integer" or "real"" is
     advice and is not read;
   - `mscarries` is not the last element of an `mstack` or `mlongdiv`: "It is an error for mscarries to be the last
     element of an mstack or mlongdiv element" (§3.6.5.1);
   - a `bind` holds at least one `bvar`: "a non-empty list of bvar elements denoting the bound variables" (§4.2.6.1);
   - qualifiers appear in the order "bvar, lowlimit, uplimit, interval, condition, domainofapplication, degree,
     momentabout, logbase" (§4.3.3), and a `condition` only after a `bvar`: "condition qualifiers always contain
     instances of the bound variable, and thus require a preceding bvar" (§4.3.3.1);
   - `selector` takes at least one argument ("It accepts one or more arguments", §4.4) and `partialdiff` without a
     `bvar` two;
   - an `maction`'s `selection` names one of its children: "If the value specified is out of range, it is an error"
     (§3.7.1.1);
   - an `mglyph` is accepted with or without `src`, `alt` and `index`. The Recommendation states the two as an
     unenforced recommendation: "Note that the src and alt attributes are required for correct usage in MathML 3,
     however this is not enforced by the schema due to the deprecated usage described below" (§3.2.1.2). Appendix A's
     `mglyph.attributes` makes `src` and `alt` optional and `mglyph.deprecatedattributes` makes `index` optional, so
     pantry refuses none of them (operator decision 327);
   - an `maligngroup` inside a table cell stands only where §3.5.5.2 lets it (an `mrow` or `mstyle` that changes no
     direction, `mphantom`, `mfenced`, the selected child of an `maction`, `semantics`) and the cell's first complete
     element is a group, while a group outside a cell is ignored and an `mrow dir="ltr"` in an LTR formula is no change
     of direction (decision 321);
   - a `share`'s `#id` names an element of its document, and no element dominates itself: "An element may not dominate
     itself" (§4.2.7);
   - `cn`'s content has the form its `type` implies (§4.2.1: integer, real, double, hexdouble, e-notation, rational,
     complex-cartesian and complex-polar; every other type is text), split at `m:sep`, with digits read in `base` from 2
     to 36;
   - `xref` names an `id` of its document, an `xs:IDREF`;
   - a MathML element whose RelaxNG content is `empty` (`mspace`, `mglyph`, `none`, `mprescripts`, `malignmark`,
     `maligngroup`, and the empty Content MathML elements) admits whitespace-only text. §2 says "The RelaxNG Schema is
     normative", RELAX NG matches a whitespace-only text against `empty`, and QTI's bundled XSD, whose empty types
     refuse it, is set aside here (decision 321: "MathML's own schema wins where QTI's bundled copy is stricter
     (accept)"). `<m:mspace> </m:mspace>` is accepted; text other than whitespace stays refused;
   - each operator's argument count under `apply`, by its class (MathML 3 §4.1.5, §4.3.4.5 and §4.3.4.6), for an
     `apply` that holds no qualifier but its operator's own. `moment` is left out, because the Recommendation's own
     example (§4.4.8.6) applies it to five arguments.

   The Recommendation's prose rules this package does not check are these, each a recorded limit (reading 91), with
   its cause and what would lift it:
   - `indenttarget` naming an element (§2.1.5.1's `idref`, "an identifier referring to another element within the
     document"; §3.2.5.2.3, "it must appear before being referenced"): the RelaxNG types it `text` and the XSD
     leaves it untyped. Reading it as `xs:IDREF`, as `xref` is read (`mathmlXrefReading`), would put it under Idref
     target;
   - the cells a `rowspan` or `columnspan` covers, which "must be omitted" (§3.5.4.2): a count of a row's cells
     against the spans above it, which no law states;
   - a space inside an `mpadded` length, "Formally, spaces are not allowed within these values" (§3.3.6.2), where
     both schemas' `mpadded-length` admits one: a notation reading, as §2.1.5.1's above, would lift it;
   - `mglyph`'s `src` and `alt`, "required for correct usage in MathML 3" though "not enforced by the schema due to
     the deprecated usage" (§3.2.1.2.2): the deprecated `fontfamily` and `index` form leaves them out;
   - the rules that turn on what an expression means: a `sum`'s or a `product`'s last argument "must be a function"
     where no bound variable is given (§4.4.6.1, §4.4.6.2), the coordinate names of `divergence`, `grad`, `curl` and
     `laplacian` "must be provided as bound variables" where the functions are defined implicitly (§4.4.4.4 to
     §4.4.4.7), and `definitionURL` and `cd` naming a definition (§4.2.3). No structural law reads a meaning.

   The importer's checks of some of the rules above stop short of the law oracle's in these cases, each a known limit
   (reading 91), with its cause. Where the two differ the database may judge a document otherwise than the oracle does:
   - a `cn` the database does not judge (`rowsOf`, `src/import/overlays/mathml-cn.ts`): one with a part that holds an
     element or an entity reference, or a `base` outside 2 to 36, has no `MathCn` row, so its part count is not
     checked, as the oracle's "MathML cn form" checks it (`src/test/oracle.ts`), nor, under a `base` outside 2 to 36,
     are its `double` and `hexdouble` parts, which the oracle reads in any base. A `cn` of any other `type` is text in
     both. A row that carries the part count alone would lift it;
   - a `cn` whose `type` or `base` is longer than the key-text bound (2,587 UTF-8 bytes, `keyTextBytes`,
     `src/qti/limits.ts`) is refused under "Key text bound", as every key-text copy is (`CnAttribute`,
     `src/qti/mathml-cn.ts`; findings row 24), though the XSD bounds neither attribute's length;
   - rows the host states that no statement refutes: a `MathCn` row's empty `typeLexical` or `baseLexical` says the
     attribute is unwritten and nothing refutes it where the node writes one, only a written lexical being proved
     (`cnLaws`, `src/qti/mathml-cn.ts`); a `MathQualifier` row's existence is proved row to node and row to head, so a
     host that omits the row of a stray `degree`, `momentabout` or `logbase` is not caught (`applyLaws`,
     `src/qti/mathml-apply.ts`); a `MathAlignScope` row's existence, its written `dir` and a cell's inherited direction
     (`alignLaws`, `src/qti/mathml-align.ts`); and a `MathRank` row's rank, of which only the order is proved
     (`shareLaws`, `src/qti/mathml-share.ts`). A statement over the tree's rows that states each row's existence would
     lift them;
   - a cell's alignment where the builder and the oracle read the tree differently (`src/import/overlays/mathml-align.ts`,
     `contentOfCell` and `placeOfGroup` in `src/test/oracle.ts`): an empty `m:mtd` nested in a cell is a cell of its
     own with no leaf, where the oracle counts it a leaf of the outer cell; a `dir` that is neither `ltr` nor `rtl`
     (HTML's `auto`) is no direction and the cell's root takes the nearest ancestor's `ltr` or `rtl`, where the oracle
     compares the raw nearest written `dir`. A non-integer or negative `selection` is refused by the database under
     "MathML maction selection" and the attribute domain, where the oracle skips it, a difference of the law's name
     only;
   - a `share` cycle that crosses a foreign element between two MathML elements (`annotation-xml`, then a foreign
     element, then an `m:math`): `MathRank` rows end at the nearest `m:math` (`src/import/overlays/mathml-share.ts`),
     so the cycle is not followed, where the oracle's "MathML share cycle" follows each child.

   Every other normative sentence of chapters 2 to 4 is one of the laws above, the content models and value domains of
   the XSD under this reading's edits, or binds a processor rather than a document (§2.3). (Listed 2026-11-06 by
   RV seat I, on the review of PR #46, under the operator's standing ruling of 2026-11-05 that the spec wins.)

## Scope of names and references

3. **In SSML, "the document" is each `speak` fragment.** An item may hold several `speak` fragments. SSML's rules
   that speak of the document (a `mark` name defined once, `startmark` and `endmark` naming a defined mark, a `lookup`
   naming a `lexicon`) apply within one fragment. Two fragments may each define `mark name="a"`. A reference from one
   fragment to a mark or lexicon in another does not resolve. (2026-11-03.)
   A `mark` name may repeat within a fragment. Only a `startmark` or `endmark` must name a mark defined once in its
   fragment (SSML 1.1, §3.1.1.1).
   A name is an `xsd:token` (`mark`'s `name`, `speak`'s `startmark` and `endmark`, SSML 1.1 §3.3.2 and
   `synthesis-nonamespace.xsd`), whose whiteSpace is `collapse` (XML Schema Part 2, §4.3.6), so names are compared by
   their collapsed value: `startmark="a  b"` names `<mark name="a b"/>`, and two marks named `a b` and `a  b` define
   one name twice. (Names compared collapsed, decided 2026-11-06 by RV seat I, on the review of PR #46, under the
   operator's standing ruling of 2026-11-05 that the spec wins.)
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
   The Schematron's two ARIA role rules bind, as its extension-attribute lists do (reading 90). The ASI binding says "5.
   The Schematron Rules. This Section is NORMATIVE" (`bind.txt` lines 431722 to 431724), and that its section 5.3, The
   Explicit Rule Definitions, is "the set of schematron rules used to enforce the features of the Information Model that
   are otherwise not enforced in the XSD" (lines 432272 to 432274). Its first rule set, `RULE_SET_ARIA_ROLES_1`
   (section 5.3.1, embedded in both ASI XSDs: 3.0.0 line 21700, 3.0.1 line 21870), states two rules, and each is
   stricter than the XSD, so it is the rule (readings 16 and 17):
   - RULE ARIA ROLE 1a: "The 'source' tag must not have an ARIA role attribute" (`count(@role)=0`). The XSD declares an
     optional `role` on `source`. A `source` that carries one is refused under `attribute-admission`: the extension
     lists cover `source` in both versions, so reading 90 leaves it no open name in no namespace that could admit it;
   - RULE ARIA ROLE 1b: "The 'h1' tag may have an ARIA role value of 'heading' or 'tab' or 'presentation' only". The XSD
     lists 74 ARIA roles for `h1`'s `role`, as for every other element's. An `h1`'s `role` other than those three is
     refused under `attribute-lexical`, compared as written, as the rule's test and the XSD's `preserve` compare it.
     `h2` to `h6` keep every role the XSD lists.

   Both rules hold by the element's name, so an `h1` or a `source` that an `xsi:type` governs is held to them too
   (reading 84). Main enforced both, as `AriaRoleH1` and `AriaRoleNotSource` at 2b276d76. These rules were set aside on
   2026-11-05, under the ruling that attributes follow the XSD exactly. The operator's ruling of 2026-11-06, to take
   Aiden's review of PR #46, withdrew that ruling wherever a normative source is stricter than the XSD, and Aiden ruled
   on 2026-11-06 that both rules come back, normative where the binding's Schematron states them. No corpus package
   carries a `role` on `source` or on `h1`, so no verdict moves. (Aiden's ruling of 2026-11-06, under the operator's
   ruling of that day; from RV seat X.)
   The Schematron's extension-attribute lists bind, read by their intent as reading 90 states.

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
13. **A `data-*` attribute name is `data-[a-z0-9_.-]+`, with no namespace.** The information model states the name
    twice, both normatively (section 7.11, DataHTML5Extension): its prose says the name "starts with the string
    'data-', has at least one character after the hyphen, is XML-compatible, and contains no uppercase ASCII letters",
    and its `pattern`, "the regular expression for the name of the attrubute", is `(data-)[a-zA-Z0-9_\-\.]+`. The prose
    bars upper case, which the pattern admits, and the pattern bars every character outside ASCII letters, digits, `_`,
    `-` and `.`, such as `é` and `·`, which "XML-compatible" and HTML's custom data attribute rule admit. Where two
    normative sources differ the stricter is the rule (readings 16 and 17), and each is the stricter on one point, so a
    name holds to both: `data-x`, `data-a.b-c` and `data-_` are valid, and `data-A`, `data-`, `data-é` and `data-x·y` are
    not. The XSD admits any attribute from any namespace and the Schematron checks only the `data-` prefix, both looser,
    and both are set aside. (2026-11-04; narrowed 2026-11-06, decision 324; restored 2026-11-07 by the Mind on audit
    b61b8f14's A4, the information model's pattern being normative: `data-é` and `data-x·y` are refused again.) Pantry holds this over its stored rows, not only when it reads a document: an attribute stored as a
    `data-*` attribute has a name in this form, an attribute in no namespace stored under no other class on an element
    that is not foreign does not begin `data-`, and a `data-` name an element's type declares as its own attribute
    (`data-catalog-idref`, `data-ssml` and the other seven of the ASI XSDs) is that attribute there and never a `data-*`
    attribute. The name's length is bounded only by the storage limit reading R15-g states.
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
    `not(not(@max-choices=0) and @max-choices < @min-choices)`) exempt 0: they skip the comparison with `min-choices`
    when `max-choices` is 0. The Schematron is a normative source here (reading 9) and the looser one, while the
    information model's comparison, which has no exemption, is the stricter. Readings 16 and 17 let the stricter
    source decide where both are normative, so the skip loses and the exemption is set aside. Decision 321 (6d) of
    2026-11-06 asked whether this reversal
    refuses any document whose `max-choices="0"` means unlimited, and found none. (1) No text gives `0` that meaning
    for either interaction: sections 5.97.3 and 5.61.2 describe `max-choices` as the most the candidate may select
    and order, with "If unspecified, all of the choices may be ordered" and nothing on `0`; the implementation guide's
    tables give the attribute as a non-negative number with the same unspecified sentence; rules 5Ba and 8Ba say only
    that the value, "provided it is not 0", must not be less than `min-choices`, which skips the comparison without
    saying what `0` means; and the sentence "If max-choices is 0 then there is no restriction" appears only for the
    choice, hotspot and hottext interactions (sections 5.30.2, 5.68.2 and 5.66.1). (2) The corpus (the 1EdTech
    examples tarball the verdict file names) holds 12 order or graphic-order interactions, and none writes
    `max-choices="0"`: 11 write neither bound and one writes `min-choices="1" max-choices="5"`. The reversal stands.
    An author who writes `max-choices="0"` beside a `min-choices` on one of these two interactions has the document
    refused, because `0` is below the least; with no `min-choices` beside it, nothing reads `max-choices` and the
    document is accepted. Against `main`, which exempted `max-choices="0"` as unlimited, such a document was accepted
    and now is not, and the author who meant no limit leaves `max-choices` out, which the information model gives the
    same meaning, "all of the choices may be ordered". (2026-11-04; restated 2026-11-05 under "the spec wins": the
    earlier text exempted `max-choices="0"` by the Schematron's rule, without the information model's sentence, which
    has no exemption, and did not bound either count by the choices.)
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
26. **An assessment section may hold no part.** The information model gives an `AssessmentSection`'s `sectionPart`,
    its item refs, sections, section refs and includes, the multiplicity "[0.. unbounded]" (section 4.2.15, in both
    versions, https://www.imsglobal.org/spec/qti/v3p0/info#RootAttribute_AssessmentSection_sectionPart), and both
    XSDs' choice of a section's parts is `minOccurs="0"` (`AssessmentSectionDType`). Both are normative. The sentence
    "A Section must contain at least one other Section or Item" stands in section 2.8, Tests, Testparts and
    Sections, inside section 2, Key Data Model Features, which both information models mark "This Section is NOT
    NORMATIVE" (`info.txt` lines 8350 and 9122, `info301.txt` lines 8791 and 9927). So it states no requirement, as
    reading 82 reads the implementation guide's informative text, and a section that holds a rubric block alone, or
    nothing, is valid under reading 1. No law counts a section's parts but reading 79's selection, which bounds a
    selection by them, zero included. This binds pantry and plate alike. This is not a case of documents in
    conflict: the normative sources agree. (2026-11-04; amended 2026-11-06 by RV seat VD (`7858a46c`), on the corpus
    verdict review, the earlier rule, that a section holds at least one child, withdrawn because its one source is
    non-normative; under the operator's standing ruling of 2026-11-05 that the spec wins. The earlier rule was
    upstream's, so the change is recorded in PR #46's decisions for Sterling and Aiden.)
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
31. **A card holds an HTML content node, file hrefs, both, or nothing.** The implementation guide says a card holds a
    single `qti-html-content`, or any number of `qti-file-href` nodes. The XSD admits both together and neither. One of
    the guide's own examples has both. This follows the XSD and the guide's example over the guide's "or", so both
    together is admitted, and the XSD's empty card is admitted too: the guide is not normative (decision 216), so its
    sentence that a card must contain at least some content binds nothing. The same holds for each `qti-card-entry`. A
    card or card entry may hold an HTML content node, file hrefs, both, or nothing, the XSD's model. This is not an
    information-model-over-XSD case: the guide's sentence and its example disagree, and the XSD settles one side each.
    (2026-11-04.) (Amended 2026-11-06, decision 324.)
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
38. **A `qti-gap` appears only within a gap-match interaction, and a `qti-hottext` may appear in any flow or inline
    content.** The information model's normative prose says a `qti-gap` must only appear within a gap-match
    interaction (section 5.55). The XSD admits it in any phrasing container. This follows the information model's prose
    and sets the XSD aside. The rule also refuses a gap inside the gap text of a graphic gap-match interaction. A
    hottext is not confined to a hottext interaction. Section 5.65 says "A HotText area is used within the content of an
    hotTextInteraction to provide the individual choices", which describes what a hottext is for and states no
    requirement. Its next sentence says a hottext "must not contain any nested interactions or other hottext areas",
    and the grammar's ancestry holds that one. The class tables give HotText the parents FlowGroup, InlineGroup,
    InlineStaticGroup and FeedbackFlowStaticGroup (section 5.65). FlowGroup's entry for it says only "used within the
    content" (section 6.15.3), and the XSD agrees. No normative source confines the hottext, so there is no stricter
    source to follow, and a hottext anywhere else is accepted, owned by no interaction (reading 1). Nothing is refused
    for a gap text that contains gaps either, because the prose says nothing about it. (2026-11-04. Amended 2026-11-06
    by RV seat VD, on the review of the import's sentinel values: the hottext sentence is reasoned from section 5.65
    rather than called silent; nothing it admits changed.)
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
44. **An SSML `token` or `w` holds no `voice`.** The SSML 1.1 Recommendation says "The token element can only contain
    text to be rendered and the following elements: audio, break, emphasis, mark, phoneme, prosody, say-as, sub", and
    "The w element is an alias for the token element" (section 3.1.8.2). The XSD's `tokenType`, which both elements
    take, also admits `voice` (`ssml/synthesis-nonamespace.xsd` lines 541-552). This follows the SSML Recommendation,
    which defines the language, and sets aside the XSD, which is looser than it. So `token` and `w` read one restated
    model, `tokenType` less `voice`. Its `##other` lax wildcard stays, because the Recommendation admits other
    namespaces: "Language-specific (i.e. non-SSML) elements and attributes may be inserted into SSML using an
    appropriate namespace" (section 2.2.3), and its fragment conformance removes them before judging (section 2.2.1). A
    `voice` inside a `token` or a `w` names no kind its parent admits, so the codec refuses it as
    `unmodeled-vocabulary`, as it refuses every element its parent's model does not name; a `token` inside a `voice`
    stays valid. (2026-11-04. Its law was stated 2026-11-06 by RV seat K, on the review of PR #46, which found that no
    law read it.)
45. **An integer has no largest or smallest value.** QTI's integer base type is "the same as the set of values
    defined by the integer primitiveType", and the information model's data types define Integer as "derived from
    the 'decimal' data-type i.e. no decimal places", beside Int, "with a numeric value from -2147483648 to
    2147483647". Neither the information model nor the XSD bounds the integer base type. So every integer written as
    a value of base type integer, in `qti-value`, in `qti-base-value` or in a typed-value attribute of reading 7 such
    as `map-key`, is accepted and kept exactly, however many digits it has: `9007199254740993` and
    `9007199254740992` are two values, and so are `1000000000000000000000000000000` and
    `1000000000000000000000000000001`. A package never refuses an integer for its size, never rounds one to a float and
    never stores one as an infinity, and it compares and computes integer results exactly. A value a key holds is the
    one exception, as a text rather than an integer: a `qti-value`'s or `qti-base-value`'s folded text and a `map-key`
    are copied into keys, and so are held to reading 133's key-text bound, 2,587 UTF-8 bytes. This reading is about
    values. A count attribute such as `max-choices` is not a value of the integer base type: a shared reading of its own
    holds counts to the signed 64-bit range, read exactly, and refuses a count beyond it with its rule and location. An
    attribute the XSD types `xs:int`, such as `base`, keeps `xs:int`'s range. Where QTI's types make a result a float,
    an integer operand becomes the nearest float, and an integer beyond the largest finite float becomes the largest
    finite float of its sign. This is not a case of documents in conflict: the sources agree that the type is unbounded
    and say nothing of overflow, and this reading forbids a package to add a bound beyond reading 133's stated limit of
    the representation. (2026-11-04.)
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
    only as reading 88 says, and a name a test reaches through two placements of one section document has one
    resolution for each placement (reading 86). (Restated 2026-11-05 under "the spec wins".)
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

    The limit this reading recorded in pantry on 2026-11-06 (from W5 Q5.11), under which a float map key outside
    grizzle's bounded lexical form of `double precision` was distinct from every other key by its text alone, is
    lifted by reading 154, which compares every float key by the double reading 144 maps it to.

    In pantry, reading 144 sets this reading aside where the two differ: a double's value is the one XML Schema 1.1's
    doubleLexicalMap gives (Part 2 §3.3.5.2), so `1e400` is `+INF`, not the largest finite double. This reading's
    first sentence holds in plate alone, whose double reading follows it until the renderer team moves it to 144 (a
    follow-up of PR #46).

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
    types it can name are XML Schema's built-ins and those of the document's schema set (reading 81). Reading 81's
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

    A prefix that no declaration in scope binds makes the `xsi:type` attribute itself invalid (reading 83).

    Two limits remain in pantry, each an exception to reading 1, stated here as a known limit:
    - An element of a kind reads its `xsi:type` against every type the pinned schemas of its version define, not only
      those of its document's schema set, because `XsiType` is keyed by version. So
      `<qti-description xsi:type="ud:ValueDType">` in an item is accepted and governed by the usage-data type, though
      the item's set does not import usage data and its `xsi:type` names no type there (section 3.3.4, Element Locally
      Valid (Element), clause 4.2). This is reading 81's limit, the grammar keyed by version and not by schema set,
      extended to the types an `xsi:type` names, and it closes with that limit.
    - A simple-content string value is folded into `Node.stringValue` only where its governor's `TextDomain` checks
      something or an overlay copies the text. A domain whose pattern admits every string of XML characters and that
      states no facet (`xs:anySimpleType` and `xs:normalizedString`) can fail no text, so its elements' text is not
      folded unless their kind is one of `copiedTextKinds` (`src/qti/node.ts`: `lom:entry`, `lom:language`, `qti-value`,
      `qti-base-value` and `ud:value`, whose text an overlay compares or checks against another row) or the element is a
      LOM title's `lom:string` (`copiedTitleText`, whose text `lom-title` compares, reading 62), or a LOM learning
      resource type's `lom:source` or `lom:value` (`copiedVocabularyText`, whose text `lom-learning-resource-type`
      reads, reading 122). The fold's step is selected by a closed read over the copies the child carries,
      `TextDomain(version, GoverningOf(version, parentKind, parentGoverns))` outside those domains, or `parentKind`
      among the copied kinds, or a title's string or a learning resource type's term; a copied kind gets no TextDomain
      law from it. The fold's running text rides the tree's predecessor and last axes, so it is a column of their keys,
      and grizzle refuses at compile a key whose B-tree entry can pass PostgreSQL's `BTMaxItemSize`
      (`UnrepresentableKey`). So the running text and `stringValue` are `keyText` (`src/qti/limits.ts`), bounded to
      reading 133's key-text bound, 2,587 UTF-8 bytes (`keyTextBytes`), what grizzle's `keyTextBytes` leaves beside the
      widest key's other columns, and a folded value past the bound is refused by `keyText`'s pattern on the fold's
      text, by name: a stated limit of the representation, not this reading's law. The corpus (28 packages, 353
      documents) holds 3,095 simple-content elements; the 227 under a checked domain are at most 92 code points; of the
      copied kinds, `qti-base-value` is at most 102 (1,208 elements), `lom:entry` 86 (59), `qti-value` 45 (898) and
      `lom:language` 2 (44), a LOM title's `lom:string` 121 (66), a learning resource type's `lom:value` 15 and
      `lom:source` 11 (18 each), and no `ud:value` is QTI 3's (the corpus's 77 are QTI 2.2's, refused `not-qti3` by
      reading 89); and the two over the bound (`lom:string`, 967 and 723 code points, past it in bytes too) are
      descriptions, `xs:normalizedString` and not copied, so not folded. (Recorded 2026-11-06, from W5 Q5.03; the copied
      kinds brought up to date at the readings merge, and the learning resource type's terms added by RV seat M,
      measured over the 1EdTech corpus at 0a92fbb.)

    This binds pantry and plate alike. pantry checks all of it but those two limits. plate does not yet check the
    text: under a `lax` wildcard it refuses element children and attributes other than the four `xsi:` ones, and
    accepts the text unchecked, and what a `strict` wildcard admits it keeps without walking; that is plate's open
    limit against this reading, for plate's own goal to close, not a second reading. This is not a case of documents in
    conflict: XML Schema decides what is valid. (The renderer's phase-3 default, delivery spec section 5.1, applied in
    plate, narrowed to the text by XML Schema Part 1, section 3.3.4; 2026-11-05. Restated 2026-11-05 under "the spec
    wins": the text is checked, which closes the limit the reading first recorded, and the `strict` wildcard and an
    `xsi:type` naming no type are decided. The first limit is recorded 2026-11-05, from seat QS's findings, beside one
    on `xs:NOTATION` that closed 2026-11-06 when its domain was stated empty (C47). plate's part is corrected
    2026-11-06, as upstream's reading 60 records it.)

61. **An element in QTI's own namespace inside `qti-ordering`'s extension slot is valid.** The information model says
    the slot's child tags "may be new tags and reused QTI ASI tags" (section 5.98.3, the `extensions` characteristic of
    the Ordering class, line 36355 of `info.txt`), though the XSD admits only other namespaces there
    (`any namespace="##other" processContents="lax"`, `imsqti_asiv3p0p1_v1p0.xsd` lines 29976 and 24031, the same in
    3.0.0). Where the information model says child tags may reuse QTI ASI tags elsewhere, the XSD writes `##any`: the
    custom interaction's (section 5.36.2, XSD line 26364) and the template's (section 5.144.1, line 32555); where it
    says they "must be new tags" it writes `##other` (sections 5.33.6, 5.37.5 and 5.129.4). So the slot is read as
    `##any`, laxly. An element in QTI's namespace that no global declaration names, such as `qti-variable` or `qti-foo`,
    is kept as the slot's extension content, a foreign element, not read as QTI ordering; a QTI root stays foreign
    (reading 6); and an HTML, MathML, SSML or XInclude global is read as its declaration. `qti-selection`'s slot is not
    covered: its information model text says the child tags "must be new tags i.e. not reused QTI ASI tags" (section
    5.129.4). libxml2 2.9.13's `xmllint` follows the XSD's `##other` and refuses these families, and its verdicts are
    recorded against this reading. This follows the information model and sets the XSD aside, because the information
    model outranks the XSD and the XSD's own mapping of the same sentence elsewhere is `##any`. The looser source holds
    here, where readings 16 and 17 take the stricter, because section 5.98.3's "may be new tags and reused QTI ASI tags"
    refuses nothing the standard allows: it is a permission, so the slot read as `##any` still admits every family the
    XSD's `##other` admits, and reading the XSD instead would refuse the reused tags the information model allows
    (reading 1). This is upstream's reading of 2026-11-06. (2026-11-06, merged by W5 seat PG from the UP audit's C65.)
62. **An item's or test's identifier and title are those its package's LOM metadata gives it, where that metadata
    gives them; a package where they differ is invalid and is refused.** The information model says of the item's
    identifier that "If an identifier is assigned in the corresponding item's resource metadata ... then the two MUST
    be the same" (section 4.1.1), of its title that "if the accompanying packaging metadata for this resource
    includes the title then these two MUST be the same" (section 4.1.2), of the test's identifier that "the unique
    identifier supplied in that metadata MUST be the same as for the 'qti-assessment-test' instance" (section 4.4.1),
    and of its title that "If the 'title' attribute in IEEE LOM is used it must match the value of this attribute"
    (section 4.4.2). The metadata binding they point to says how (QTI 3.0 Metadata, section 2.7.1, the General
    category of its LOM profile, normative by its section 1.2):
    - "One of the values given for the identifier must have an entry that matches the identifier of the associated
      item, test or object bank" (section 2.7.1.1). So when the resource's `lom:general` lists `identifier` entries,
      one of them names the document, and the others may name anything; a record that lists none is outside the
      rule. An entry is LOM's `CharacterString`, but it names the document, so it is compared in the identifier's
      value space, `UniqueIdentifierDType`, a restriction of `xs:ID` whose whitespace is collapsed: an entry
      of `item1` padded with spaces names `item1`.
    - "The title must have a value that matches the value of the title attribute of the associated item, test or
      object bank. The language used to interpret the title is taken from the language attribute of the associated
      item, test or object bank" (section 2.7.1.2). So when the resource's `lom:general` has a `title`, one of its
      `lom:string` values in the document's language equals the document's `title`: a string whose `language` is
      the root's `xml:lang`, compared as a language tag without regard to case, or a string with no `language`; and
      any string where the root states no `xml:lang`. A record with no general title is outside the rule. The
      comparison is in the title's value space, `xs:normalizedString`, so a tab, line feed or carriage return on
      either side reads as a space and nothing else changes.

    The record is the resource's own: a `lom:lom` of the resource's `cp:metadata`. A record a `cp:file` of the resource
    carries describes the file, not the item: "The scope of Metadata is the parent container class only" (IMS Content
    Packaging 1.2, section 6.7, Metadata), and "A File holds meta-data describing a computer file" (section 6.6.3,
    File). So its identifier entries and its title are outside the rule, whatever they name.

    The implementation guide's LOM profile says the same as a recommendation ("should", section 2.1.2), and the
    information model and the binding make it a requirement, so this reading is no exception to reading 1. This
    binds pantry and plate alike. This is not a case of documents in conflict: the information model and the binding
    agree, and the XSDs say nothing of it. (Upstream's reading 62 of 2026-11-06, merged with this repository's 62 of
    2026-11-05, which read the identifier only and from the guide; merged 2026-11-06 under the operator's standing
    ruling of 2026-11-05 that the spec wins. Amended 2026-11-07 by RV seat PG (`0ed523e1`), on the law oracle's LOM
    records: the record the rule reads named, as the schema reads it; no verdict moved.)

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
    spells it, and that enumeration is the rule's one statement: it is the value domain the grammar reads
    `cp:resource`'s `type` under in that version, so a type outside it is refused under `attribute-lexical`, the
    refusal of every value an XSD's enumeration leaves out, and the explanation lists the values the version admits.
    No law restates it. The implementation guide says the schema version "MUST be set to" `3.0.0` (section 6.1.1,
    Manifest), which the 3.0.1 profile refuses, and spells the response-processing type
    `imsqti_responseprocessing_xmlv3p0` (section 6.2, Content), where both profiles spell it
    `imsqti_resprocessing_xmlv3p0`. The packaging sections of the 3.0 and 3.0.1 XSD bindings, which mark themselves not
    normative, say the schema version must be `3.0.0` and `3.0.1` respectively, each for the profile it names (section
    8, ASI Packaging), and the 3.0.1 binding spells the response-processing type as the profiles do. 1EdTech's own LTI
    example packages declare `3.0.0` and give resources the type `imslti_xmlv1p1`, which only the 3.0.1 profile lists,
    so they are refused, under `attribute-lexical`. This follows the profile XSDs, the schemas a manifest is validated
    against, and sets aside the implementation guide's version and spelling. This binds pantry and plate alike, so the
    two never read the same package differently, and both implement it. (The operator's ruling, accepting the
    renderer's default; applied in plate by its phase-4 delivery spec, section 4.3; 2026-11-04. Amended 2026-11-07 by
    RV seat VD (`6fd1d67d`), on the corpus verdict review: the rule was stated twice, by the enumeration and by a
    `ResourceTypeOf` relation read from it under the rule `resource-type`; the coordinator ruled the XSD's enumeration
    its home, as reading 26's withdrawal leaves the content grammar the XSD's own, and the relation is deleted.)
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
71. **`xs:anyURI` is XML Schema 1.0's: a value is valid when XLink's escaping makes it an RFC 2396 URI reference
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
72. **The built-in outcome variable is `completionStatus`, spelled exactly; `completion_status` and
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
73. **`xs:unsignedLong`, `xs:unsignedInt`, `xs:unsignedShort` and `xs:unsignedByte` admit a sign as
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
    own answer and is consistent with reading 71. `xs:nonNegativeInteger` (section 3.3.20.1) and
    `xs:positiveInteger` (section 3.3.25.1) need no ruling: their prose and their derivation agree, `+` before any
    value and `-` before zero for the first, `+` before a positive value for the second. libxml2 2.9.13, whose
    `xmllint` is the validity oracle, refuses every sign on the four unsigned types, as the uncorrected prose says.
    libxml2 2.13.0 and later accept them. The oracle's verdict is recorded against this reading rather than counted
    as a defect. A value keeps its spelling through a round trip. Under QTI's XSDs these four types appear only as
    MathML's `m:unsigned-integer`, and whether MathML's own notation (MathML 3, section 2.1.5.1) narrows it is
    reading 2's question, not this one's. This binds pantry and plate alike. This is not a case of documents in
    conflict: XML Schema decides its own types, and where its prose and its derivation disagree, the derivation it
    validates by is followed. (Operator ruling "the spec wins", 2026-11-05.)
74. **An identifier names one variable among the declarations of its document.** The information model says "The
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
75. **An interaction's `response-identifier` names a declared response variable.** The information model says each
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
76. **A least count is at most its most, unless the most is 0.** The information model states this for each pair:
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
77. **A feedback element names an outcome variable, and a printed variable an outcome or a template variable, the
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
78. **A mapping maps a base type other than `file` and `duration`, of a variable that is not a record.** The
    information model's Mapping class is "A special class used to create a mapping from a source set of any
    base-type (except file and duration) to a single 'float'" (section 5.88,
    https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping). Its map response expression "cannot be applied to
    variables of record cardinality" (section 2.11.1.5). The map response template's sentence "The template applies
    to responses of any base-type and cardinality" (section 2.5.1) says where the template may be used, not what a
    mapping maps, and is read with the class definition, which is the narrower and the more specific. This is stated.
    It is a sentence inside the information model read beside its class definition, not a case of documents in
    conflict. (2026-11-05; the law `MappableBaseType`.)
79. **A selection without replacement selects at most its section's parts.** The information model says of `select`
    "The number of children to select may exceed the number of child elements defined only if with-replacement is
    true", and "Sub-sections always count as 1, regardless of how many child elements they have and whether or not
    they are visible" (section 5.129.1,
    https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Selection.Attr_select). So a section's parts
    (item references, sections and section references) are counted once each, and `select` above their number is
    refused unless `with-replacement` is true. `with-replacement` is an `xs:boolean`, so `1` is true; reading 34
    binds `qti-value` only. This is stated, and is not a case of documents in conflict. (2026-11-05; the law `Selection bound`.)
80. **A default hotspot is the last hotspot choice of its interaction, and a graphic gap match interaction has
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
81. **An element wildcard reads an element as a global declaration only where the schema set of the element's
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
    keys them by version. The same limit holds for attributes. An attribute wildcard reads an attribute against a global
    declaration only where the schema set of the element's document holds one: `xml.xsd`'s four in the ASI and
    content-packaging sets, whose root XSDs import it, and XLink's ten in the content-packaging set alone, through the
    content-packaging extension (`cpext/imsqtiv3p0p1_cpextv1p2_v1p0.xsd` line 10); the loose LOM binding and the
    usage-data XSD import neither. An attribute is assessed only against "a declaration resolved to by its [local name]
    and [namespace name]", and under `lax` one with none is not assessed (sections 3.10.4 and 3.4.4, clause 3.2). One
    grammar serves all of a kind's documents, so a kind's `xml:` and XLink names are typed by the union of the sets its
    documents may be assessed against (`holdsGlobals` and `attributeSchemaSets` in `src/vocab/open.ts`): a LOM kind
    stands both in a manifest and in an external LOM file, and a foreign element in documents of every set. So in an
    external LOM file a repeated `xml:id` is refused under "DocumentId key" and `xml:space="bogus"` under "value
    domain", which XML Schema accepts there, an exception to reading 1 of the same kind. The document's root kind names
    its set (`cp:manifest`, `lom:lom`, `ud:usageData`, the ASI roots), but no attribute row reads it: `AttributeGrammar`
    is keyed by (version, governor, name), and the governor, `GoverningOf` on Node, holds no schema set. It is closed by
    a schema-set digit on `GoverningOf`, from the root kind, and governors per set for the 62 LOM kinds that hold an
    attribute wildcard and for the three foreign kinds (UP audit C32). This binds pantry and plate alike. This is not a
    case of documents in conflict: XML Schema decides how a wildcard finds a declaration or a type, and QTI's XSDs and
    reading 24 fix the schema each document is assessed against. (The DRD finding of seat QF, with QD's correction for
    `xsi:type` under `strict`; "the spec wins", 2026-11-05.)

82. **A response-processing resource's type is `imsqti_resprocessing_xmlv3p0`, as the content-packaging XSD
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
83. **A prefix names the namespace its nearest declaration binds, in element and attribute names and in values of type
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
    the model stores nothing that no valid document is (`docs/qti-intent.md`, "Extremely tight data model").

    A QName value's prefix is bound by the element's ancestors, a fact the rows do not hold (they hold each element's
    own declarations, `Namespace`, keyed by element and prefix), so the codec reads every value of a QName type with the
    bindings in scope where it stands, from its domain alone (`Qualified` of `src/grammar/domains.ts`: an `xs:QName`, or
    a list of them), an attribute's value and an element's text through one check (shred's `resolvesIn`). It refuses a
    value one of whose QNames has a prefix none binds, as XML Schema 1.0 Part 2, section 3.2.18 says: "The mapping
    between literals in the lexical space and values in the value space of QName requires a namespace declaration to be
    in scope for the context in which QName is used". An `xsi:type` is refused as `type-unresolved`; SSML's `role`, a
    list of `xs:QName`, and the text of an element an `xsi:type` of `xs:QName` governs, as `prefix-unbound`; both are
    `unmodeled-vocabulary` refusals, so no stored row holds such a value. No kind's own text is of a QName type
    (`src/model/qname-scope.test.ts` reads every QName site the grammar holds). An element's or an attribute's name is
    held by the reader's namespace well-formedness (Namespaces in XML 1.0, section 5, "Namespace constraint: Prefix
    Declared"), since crust's reader refuses a prefix no declaration in scope binds as a `WellFormednessError`
    (`packages/crust/src/read.ts`, `saxes` reading with namespaces on). The corpus holds no `xsi:type` and no `role`, so
    no verdict moves. (The limit recorded 2026-11-06 from W5 seat PN, C48 of `docs/research/up.md`, closed 2026-11-07 by
    GEN-B (`5cdc88e7`), after the lexical differential found `ssml:token`'s `role="a:b"` accepted where xmllint refuses
    it.)

    This binds pantry and plate alike in what they refuse; how each enforces it is its own. This is not a case of
    documents in conflict: Namespaces in XML and XML Schema agree. (Operator ruling "the spec wins", 2026-11-05.)

84. **An element is judged under its governing type for everything XML Schema decides, and under its name for every
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
85. **An inclusion never reaches itself, and an included fragment is read in place, as XML, with no `xpointer`.** A
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
    section 4.2.7), and reading 86 says what two placements mean. Section 2.12 also says that "when using an XML
    binding, the xpointer mechanism defined by the XInclude specification MUST NOT be used", that "all included
    fragments must be treated as parsed xml", and that "the content of the fragment must satisfy the requirements of
    the specification in the context of the item in which it is being included". So an `xi:include` with an
    `xpointer` attribute, or with `parse="text"`, is refused, though the XSD admits both (`w3/XInclude.xsd` lines 22
    to 24), and an included fragment is judged as part of the document that includes it: its interactions bind that
    item's responses, and its identifiers count among that document's. This follows the information model and sets
    the XSD aside where the XSD is wider. This binds pantry and plate alike. (Operator ruling "the spec wins",
    2026-11-05.)
86. **The identifiers of a test's parts, sections, section refs and item refs are one namespace across the assembled
    test, and a section document a test places twice is written once.** The information model says "The identifier of
    the section or item reference must be unique within the test and must not be the identifier of any testPart"
    (section 4.2.1, AssessmentSection) and "The identifier of the test part must be unique within the test and must not
    be the identifier of any qti-assessment-section or qti-assessment-item-ref" (section 5.159.1, TestPart). The XSD
    types each `IdentifierDType`, an `xs:NCName` with no uniqueness, so this follows the information model. The test is
    the assembled test (reading 5): the test document and every section document its section refs and includes reach
    (reading 85). So no two of those elements written in its documents share an identifier, whatever their roles: an
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
87. **A branch rule names a reserved exit, or a later part of its own kind in its own test part, never inside a
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
    - From outside a section document a ref places, no target lies inside it: the ref is the leaf. The information
      model both says "branching rules should treat referred sections as leaf nodes" and binds: "Adaptive test branch
      rules can only refer to included or directly referenced sections, they can not refer to sections that are in
      their turn included or referenced within the referenced section" (section 7.5, `info.txt:67325`). A branch rule
      written inside that document resolves within its own placement and may name what the document holds.
    - No target is an item ref under a section whose `qti-selection` has `with-replacement` true, anywhere above it.
    - The target names exactly one element that meets these conditions; one that two placements of a section document
      supply twice (reading 86) is refused as ambiguous. This applies only to a rule outside the section document,
      whose target two placements can supply; a rule inside the document resolves within its own placement.
    - One fault, one rule. A target that names no element of an instance holding the rule's, or names one of the
      wrong kind, of another test part, or an item ref a replacement can repeat, breaks "Branch target" alone; only a
      target that rule admits by its name is judged by "Branch forward". The law oracle already reads the bullets in
      that order (`src/test/oracle-laws/tests.ts` `branchLawsOf`), and the schema states it: the resolution's target is
      a row of its own (`BranchTarget`), absent where nothing resolves, so its existence law refuses it; and
      `Branch_forward` holds of every target `Branch_target` refuses by its name. Before, an unresolved rule wrote a
      stand-in target, which broke both CHECKs, and PostgreSQL reported the one whose name sorts first,
      `branch_forward`.
    - Where a shuffle orders the two, that shuffle is a row of its own too (`BranchShuffle`): written only where the
      nearest name of the target's document holding the source and the target draws its children's order and its
      child holding the target does not hold the source, its `Branch_forward` proving exactly that, and counted by
      the target (`BranchTarget.shuffles`). A rule no shuffle orders has none, rather than a common element standing
      in as the target itself.

    Pre-conditions and branch rules are ignored in nonlinear mode (section 2.8.3), but the target rules are stated
    without that condition, so they hold in every mode. This binds pantry and plate alike. This is not a case of
    documents in conflict. (Operator ruling "the spec wins", 2026-11-05; amended in phase 15, 2026-11-06, for the
    operator; decision 321.)

88. **A numbered reference such as `Q01.2.SCORE` names an instance of an item ref that a selection with replacement can
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
89. **A document whose root element is in a namespace of QTI 2 is not a QTI 3 document, and is refused as `not-qti3`
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
90. **On an element the Schematron's extension-attribute lists cover, an attribute its XSD does not declare is a
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
91. **No reading is advisory.** Every rule a reading here states is enforced wherever a package decides validity, as
    every rule of the XSDs is. In pantry that is a law PostgreSQL checks over the stored rows: "Every rule QTI states
    becomes a rule PostgreSQL enforces through grizzle, so invalid QTI cannot be stored", including "every structure
    and rule of the languages QTI embeds" (`docs/qti-intent.md`, "Settled" and "How it gets planned and built"). So
    the eight readings that had no law, 2 (MathML), 3 (SSML fragments), 9 (the Schematron by intent), 39, 41, 42 and
    43 (SSML's `version`, `meta`, `voice` languages and surviving attributes) and 47 (the `xsi:` attributes), are each
    a law, as every reading after them is. A rule a package cannot yet check is a recorded limit with its reason, as
    readings 50, 60 and 81 record theirs, never a rule followed only where it is convenient. This rules how the
    readings bind, not what the specification says, and it changes no verdict. (Operator ruling "the spec wins",
    2026-11-05.)
92. **The information model's binding and count sentences that no other reading restates hold as written.** Each is
    stated, and each admits content the XSD accepts, so a package that lacks it under-refuses:
    - "If max-choices is greater than 1 (or 0) then the interaction must be bound to a response with multiple
      cardinality", of the `max-choices` of the choice (section 5.30.2), hottext (5.66.1), hotspot (5.68.2), position
      object (5.107.3) and select point (5.128.2) interactions, and the same sentence of `max-associations` on the
      associate (5.8.2), gap match (5.57.3), graphic associate (5.59.2), graphic gap match (5.60.2) and match (5.89.2)
      interactions. An unwritten count is read as its XSD default.
    - "Each response variable declared may be bound to one and only one interaction" (section 2.2.2.2): no two
      interactions of an item, its included fragments among them (reading 85), name one response variable. "May"
      makes the binding optional, and "one and only one" bounds it.
    - A position object interaction's `min-choices`, where written, is at least 1: "If specified, min-choices must be
      1 or greater" (section 5.107.2). The XSD allows 0.
    - A PCI's `qti-context-variable` names a context variable: it "allows an item author to bind a context variable
      to the PCI instance" (section 5.106.6), the context variables are the declared ones and the built-in
      `QTI_CONTEXT` (section 2.2.2.1), and "All variables must be declared except for the built-in session variables"
      (section 2.2.2). The Schematron's rule 20Ba states the same.

    The other rules found with these live in the reading that states their kind: `min-strings` at most `max-strings`
    in reading 76, a feedback outcome's base type and cardinality in reading 77, no default hotspot in a graphic gap
    match in reading 80, the order interactions' counts against their choices in reading 18, and the XInclude rules in
    reading 85. This binds pantry and plate alike. This is not a case of documents in conflict. (Operator ruling "the
    spec wins", 2026-11-05.)

93. **A resource names a document only through its `href`, and a resource with no `href` names none: its files are
    files.** IMS Content Packaging 1.2 makes a resource's `href` the locator of its content, and its files mere
    locators: "A value declared for Manifest.Resources.Resource{Href} represents a URL that can be used to locate and
    access the content described by the resource", and "A value declared for Manifest.Resources.Resource.File{Href}
    shall be a locator for a single digital resource, with no other implication as to the use of the resource so
    identified" (Information Model, Version 1.2 Public Draft v2.0, section 6.11.3, the Href class; line 3303 of the
    published `imscp_infov1p2pd2.html`); "A value declared by a Resource{ Href } object is a launchable URI" (section
    6.6.2, the Resource class; line 2383). So a resource of a type `RootOfType` maps names the document at its `href`,
    which is read as a document of that type, and the `href` is one of its own files (the same section 6.6.2: "A file
    reference declared in a Resource{ Href } shall have an associated declaration in a File object in the same
    Resource"). A resource with no `href` names no document, whatever its type and however many files it lists, and
    each of its files is an entry like any other, which a `cp:file` must still list (reading 33). This sets aside the
    sole-file convention no source states: the old importer read an hrefless outcome, response-processing or metadata
    resource through its one file and refused one listing several as `record-unnamed`, and the oracle's
    `documentsOf` read every hrefless document-typed resource through its one file. The corpus moves no verdict: one
    package, `qtiv3-examples/packaging/maxfiles/maxfiles.zip`, has hrefless document-typed resources (two
    `imsqti_rptemplate_xmlv3p0` resources of one file each), and the oracle judges it refused under `P8` with those two
    files read as documents and without them. This binds pantry and plate alike. This is not a case of documents in
    conflict. (Decided 2026-11-06 by W5 Q5.06 under the operator's standing ruling of 2026-11-05 that the spec wins.)
94. **An `xs:NCName` takes its name characters from XML 1.0 Second Edition, as XML Schema 1.0 reads them, and the
    production states no length.** XML Schema Part 2 (W3C Recommendation, 28 October 2004) gives `NCName` the lexical
    space of the `NCName` production of Namespaces in XML (section 3.3.7), whose 1999 Recommendation writes it as
    `(Letter | '_') (NCNameChar)*` over XML 1.0's `Letter`, `Digit`, `CombiningChar` and `Extender` (productions [4] and
    [5]). Part 2's schema for schemas states the same type as the pattern `[\i-[:]][\c-[:]]*`, and its Appendix F
    defines `\i` as the characters `Letter | '_' | ':'` match and `\c` as those `NameChar` matches (section F.1.1),
    citing XML 1.0 Second Edition, whose `Letter` is `BaseChar | Ideographic` (Appendix B). XML 1.0 Fifth Edition's
    `NameStartChar` and `NameChar` (productions [4] and [4a]) hold every one of those characters and more, so the two
    readings differ in two cases, and both are refused here:
    - a character no Second Edition table holds, anywhere in the name: a letter Unicode assigned after version 2.0,
      such as `㐀` (U+3400), a character of the supplementary planes, such as `𐀀` (U+10000), or one the Second
      Edition leaves out on purpose, such as `Ĳ` (U+0132);
    - a character the Second Edition admits only after the first, written first: an `Extender` such as `ː`
      (U+02D0), so `ːa` is refused and `aː` is accepted.

    libxml2 2.9.13's `xmllint` gives the same verdict on each of these. The production states no length, so a name of
    any length is valid. A name a key holds is held to reading 133's key-text bound (2,587 UTF-8 bytes), an open
    attribute's local name, which a key holds beside a namespace name, to 1,329 bytes and a namespace prefix to 2,665:
    stated limits of the representation, not of `xs:NCName`. Every type derived from `xs:NCName` reads it so: `xs:ID`,
    `xs:IDREF`, `xs:ENTITY` and QTI's identifier types, and the bare variable reference that names a declaration.
    Reading 55 is not changed by this: a `pattern-mask` is a response pattern plate checks, and its `\i` and `\c` follow
    the later edition by that reading's own decision. This binds pantry and plate alike. This is not a case of documents
    in conflict: QTI's XSDs are XML Schema 1.0 (reading 71), and XML Schema 1.0 decides the lexical space of its own
    types. (Decided 2026-11-06 under the operator's standing ruling of 2026-11-05 that the spec wins.)

95. **An entity reference's name is an `NCName`: no entity name holds a colon.** Namespaces in XML 1.0 (Third
    Edition), section 7, Conformance of Documents: in a namespace-well-formed document, "No entity names, processing
    instruction targets, or notation names contain any colons." XML 1.0's `EntityRef` production takes any `Name`, a
    colon included, and crust's reader reads `&a:b;` where an external subset could declare it, so the document layer
    refuses it: a node of kind `entityRef` holds `&` and an `NCName` and `;` (the `entityRef_arm` check of
    `src/qti/chardata.ts`). The rule binds every entity name, an unexpanded reference inside an attribute value too.
    The corpus moves no verdict: its 28 packages' 395 XML files hold 70 entity references, none whose name has a
    colon, counted by a byte scan of every `.xml`, `.xhtml`, `.html`, `.svg` and `.xsd` file of each package's
    directory form for `&name;` with a colon in `name`. This binds pantry and plate alike. This is not a case of
    documents in conflict: Namespaces in XML decides the names a namespace-well-formed document holds, and every QTI
    document is read under it. (Decided 2026-11-06 by W5 Q5.04 under the operator's standing ruling of 2026-11-05 that
    the spec wins.)
96. **A repeated wildcard keeps its sequence's order: after a child the wildcard holds, no element of an earlier
    particle follows.** XML Schema 1.0 Part 1 (W3C Recommendation, 28 October 2004), section 3.8.4, Validation Rule:
    Element Sequence Valid, accepts a sequence's children only where "there is a partition of the sequence into n
    sub-sequences such that n is equal to the cardinality of {particles}", each sub-sequence valid, in order, against
    the corresponding particle. So once a child falls to a later particle, no child after it falls to an earlier
    one. `CompanionMaterialsInfoDType` is the sequence `qti-calculator*`, `qti-rule*`, `qti-protractor*`,
    `qti-digital-material*`, `qti-physical-material*`, then `grpStrict.any`'s `##other` `strict` wildcard, repeated
    (`imsqti_asiv3p0_v1p0.xsd` lines 26123 to 26129 and 23932, `imsqti_asiv3p0p1_v1p0.xsd` lines 26269 to 26275 and
    24018). A `##other` wildcard matches no element of the ASI namespace (section 3.10.4, Wildcard allows Namespace
    Name), so `qti-companion-materials-info` refuses a `qti-physical-material` after an `ssml:speak`, an
    `ssml:audio` or an `m:math`. The DRD's `Access_For_All_Resource.Type` ends the same way, with
    `drd:isPartialAdaptationOf*` and then `grpStrict.any` (both DRD XSDs, lines 408 and 409, the wildcard at line
    107). So `drd:accessForAllResource` refuses a `drd:isPartialAdaptationOf` after a child its wildcard holds.

    libxml2 2.9.13's `xmllint`, the validity oracle, accepts both. Its automaton for a wildcard that may repeat
    returns to the state the wildcard starts in (`xmlschemas.c` lines 12852 and 12924), which is the state its
    preceding particle ends in. An element particle that repeats without bound from at most one occurrence ends in a
    state that repeats it (line 12791). So the element just before the wildcard is admitted again after any child
    the wildcard holds. An element of an earlier particle, such as `qti-digital-material` or
    `drd:isFullAdaptationOf`, stays refused. Every content model of the pinned XSDs was walked through that
    construction, and these two are the only ones it widens. Its verdict is recorded against this reading rather
    than counted as a defect of the grammar, which keeps the XSD's order. The corpus moves no verdict: its one
    `qti-companion-materials-info` (`testWithLti.zip`'s `elements.xml`) holds a lone `qti-digital-material`, and no
    corpus document holds an `accessForAllResource`. This binds pantry and plate alike. This is not a case of
    documents in conflict: XML Schema decides how a sequence partitions its children. (Decided 2026-11-06 by W5 seat GX
    under the operator's standing ruling of 2026-11-05 that the spec wins.)

97. **A variable mapping's target names no other variable its item ref's item holds.** The information model says
    "Variable mappings allow outcome variables declared with the name source-identifier in the corresponding item to
    be treated as if they were declared with the name target-identifier during outcome processing" (section 7.48,
    VariableMapping, https://www.imsglobal.org/spec/qti/v3p0/info#Data_VariableMapping), and of every declaration's
    identifier "The identifiers of the built-in session variables are reserved. They are completionStatus, numAttempts
    and duration. All item variables declared in an item share the same namespace" (section 4.5.1, and sections
    5.115.1 and 5.151.1). Reading 74 gives one variable per identifier. A mapping's target is a name of the item's
    variables in the test's view of them, so a target that another variable of the item already holds would make two
    variables of one name there: one the item declares, other than the mapping's own source; one another mapping of
    the same item ref names; or a built-in session variable. Each is refused, the identifiers compared collapsed. A
    mapping whose target is its own source maps nothing away and is valid. This binds pantry and plate alike. This is
    not a case of documents in conflict. (Decided 2026-11-06 by W5 seats UP and Q5.13 under the operator's standing
    ruling of 2026-11-05 that the spec wins.)
98. **A mapping's map keys are distinct, compared as values of its base type.** The information model says "The map
    is defined by a set of mapEntries, each of which maps a single value from the source set onto a single float"
    (section 5.88.4, https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping, and section 7.21), so a mapping is a
    function of its source value, and two entries of one key would map one value twice. The keys are compared as the
    values section 8.13 gives each base type: an integer by its value (reading 45, at any length); a float as the
    double it names (reading 154, under reading 144); a point as its integer tuple; a pair as an
    unordered pair of identifiers ("The association is undirected so (A,B) and (B,A) are equivalent"); a directed pair
    as an ordered one; a boolean as written (reading 34); an identifier and a URI as written; and a string as its
    entry's `case-sensitive` says it is matched, "Used to control whether or not a qti-map-entry string is matched case
    sensitively. The default value is false" (section 7.21.3): by its code points where the entry writes
    `case-sensitive="true"`, case-folded where it is `false`, the default. A map key is refused only where one response
    value could map two ways, so two entries repeat a string key when they are matched the same way and the same string
    matches both: two case-insensitive entries whose keys are one string once case is folded, or two case-sensitive
    entries whose keys are one string. An entry matched case-sensitively beside an entry matched case-insensitively is
    two keys, as the examples' own item BG010 (`QTI3_BeginnersGuide_Examples/items/BG010.xml`) writes them: `York` with
    `case-sensitive="true"` mapped to 1 and `york` with the default mapped to 0.5; which entry a response that matches
    both takes is delivery's, which is plate's. So `1` and `01` repeat in an integer mapping, `A B` and `B A` in a pair
    mapping, `York` and `york` in a string mapping whose entries leave `case-sensitive` at its default, and `York` and
    `york` are two keys where both entries write `case-sensitive="true"`. The corpus holds no repeated key. This binds
    pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-06 by W5 seat Q5.11 under the
    operator's standing ruling of 2026-11-05 that the spec wins; amended by decision 321 (6), which replaces the
    code-point comparison of every string key.) (Proposed in phase 15, 2026-11-06, for the operator; decision 321.)
99. **An area mapping maps points.** The information model says of AreaMapping "A special class used to create a
    mapping from a source set of point values to a target set of float values" (section 5.5,
    https://www.imsglobal.org/spec/qti/v3p0/info#Data_AreaMapping), so a `qti-area-mapping`'s response declaration is
    of base type point, and one under a declaration of any other base type is refused. The XSD admits the element
    under any response declaration and does not decide this. This binds pantry and plate alike. This is not a case of
    documents in conflict. (Decided 2026-11-06 by W5 seat Q5.11 under the operator's standing ruling of 2026-11-05 that
    the spec wins.)
100. **A lookup table sets a single outcome.** The information model says a lookup table maps "a numeric source value
     to a single outcome value in the declared value set" (section 4.5.13,
     https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_OutcomeDeclaration_lookupTable), so a
     `qti-match-table` or `qti-interpolation-table` belongs to an outcome declaration of single cardinality, and one
     under a multiple, ordered or record outcome is refused. Its entries' `target-value` and its own `default-value`
     are values of that outcome's base type (reading 8), written exactly (reading 7). The XSD does not decide this. This
     binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-06 by W5 seat Q5.11
     under the operator's standing ruling of 2026-11-05 that the spec wins.)
101. **An ID that an element's text carries is bound to that element's parent.** XML Schema 1.0 Part 1 (§3.15.5,
     Schema Information Set Contribution: ID/IDREF Table) enters in the table "every attribute or element information
     item" validated by a type that "is the built-in ID, IDREF or IDREFS simple type definition or a type derived from
     one of them", and gives each id a `[binding]`: "A set consisting of every element information item for which …
     it has an attribute information item in its [attributes] or an element information item in its [children] which
     was ·validated· by the built-in ID simple type definition or a type derived from it whose [schema normalized
     value] is the [id] of this ID/IDREF binding". Validation Root Valid (ID/IDREF) (§3.3.4, cvc-id clause 2) refuses
     a binding "whose [binding] has more than one member". So an ID that an element's own text carries, where the
     element's governing type reads its text as an `xs:ID` (in the pinned grammar only an `xsi:type` gives one, on
     `qti-description`, `qti-physical-material`, `csmd:GUID`, `csmd:label`, the DRD and QTI metadata kinds of string
     content, and the three foreign element classes), is bound to the element's parent. Two ID-typed children of one
     element with one value are one binding of one member, and valid; so are an element's ID attribute and its
     ID-typed child of one value; two such children under different parents are refused, as two elements with one ID
     attribute value are. XML Schema 1.1 (§3.17.5.2) keeps the same `[binding]`, "an attribute information item in
     its [attributes] or an element information item in its [children] whose ·actual value· is or contains the [id]",
     and differs only in reading the `[schema actual value]`, so a default or fixed value takes part, and an id inside
     a list. A text of an `xs:IDREF` or `xs:IDREFS` type names ids of its document as an attribute's does. libxml2
     2.9.13's `xmllint`, the validity oracle, enters no element-typed ID or IDREF in its table: on a schema whose
     `parent` holds `id` children of type `xs:ID` and `ref` children of type `xs:IDREF` beside an `xs:ID` attribute,
     it accepts two parents each holding the id `a`, and a `ref` that names no id, while it refuses two attributes
     of the one value `a`. Its verdict is recorded against this reading. No corpus document writes an `xsi:type`, so
     no verdict moves. This binds pantry and plate alike. This is not a case of documents in conflict: XML Schema
     decides its own ID table. (Decided 2026-11-06 by W5 seat PI under the operator's standing ruling of 2026-11-05 that
     the spec wins.)
102. **An href is read as its path and its params, and the importer resolves its path before any row is written:
     merged with its base, its dot segments removed and each segment percent-decoded, so a law compares resolved
     paths.** IMS Content Packaging 1.2 (Information Model, Version 1.2 Public Draft v2.0, section 6.6.2, the Resource
     class; line 770 of `imscp_infov1p2pd2.txt`, line 2384 of the published `.html`): "A file reference declared in a
     Resource{ Href } shall have an associated declaration in a File object in the same Resource. The Href of the
     associated File object shall reference the same file as the Resource{ Href }. The Resource{ Href } and associated
     File{ Href } URIs may differ in that the Resource{ Href } may contain “launch” parameters in the URI." RFC 3986
     (section 3.3, line 1204): "The path is terminated by the first question mark ("?") or number sign ("#")
     character, or by the end of the URI." So every href is read in two written pieces, `path ‖ params`: `path` up to
     its first `?` or `#`, and `params`, empty or the query and fragment from there. Only the path names a file: a
     resource's launch parameters, a reference's query or media fragment (`#t=00:00:01`) name no other file.

     Every href is resolved by the importer before its row is written (`src/import/overlays/package.ts` `resolveIn`),
     a `cp:file`'s and a `cp:resource`'s as much as a document's reference, by RFC 3986's reference resolution
     (sections 5.2.2 to 5.2.4, lines 1701 to 1844) in these steps:
     - The value is read by its attribute's whitespace class (XML Schema Part 2, section 4.3.6): an `xs:anyURI`, every
       QTI `href`, every manifest href and every `xml:base`, collapses; HTML's `URLDType` (`src`, `srcset`, `poster`),
       an `xs:normalizedString`, replaces each tab, line feed and carriage return with a space; `object@data`, an
       `xs:string`, is kept as written. The spaces around it are then set aside, as an `xs:anyURI` collapses them and
       an HTML URL may be "potentially surrounded by spaces".
     - A path that starts with a scheme (an absolute URI, reading 35) or with `/` is external, admitted and never
       resolved where a `cp:file` or a content reference holds it, and refused where a law needs it to name an entry
       (a document-typed resource's href, "Document entry"). The second is a judgment: RFC 3986 (section 4.2,
       line 1440) calls a reference that begins with `//` a network-path reference and one that begins with a single `/`
       an absolute-path reference, and both resolve against the authority and root of the location a package is read
       from, not against the package's own root; Content Packaging binds only "a URI that resolves to a location
       within the InterchangePackage" (InterchangePackage (b) and (d), lines 409 and 411), says that "The files
       described by a resource may be local or remote" (line 276), and has the references from the root manifest to
       files in a package interchange file be relative references, "relative to the root of the PIF" (PIF (d), line
       416).
     - A path that is empty, as the empty reference, a query alone and a fragment alone have, names its own document
       (RFC 3986, section 4.4: such a reference's "dereference should not result in a new retrieval action"), even in
       the scope of an `xml:base`, and is never resolved.
     - Any other path is merged with its base (section 5.2.3): the `xml:base` in scope (reading 103), each resolved
       against the one above it, or else the document's own path, the manifest's directory being the package root.
       Its dot segments are then removed (section 5.2.4), a segment written `%2E` or `%2e` counting as a `.`, since a
       percent-encoded unreserved character is the character itself (sections 2.3 and 6.2.2.2). A path whose `..`
       segments climb above the package root resolves outside it, external and admitted, as `../../a.png` from
       `items/` is: the package root is a directory of the location the package is read from, not the URI's root.
     - Each segment that remains is percent-decoded (section 2.1), its octets read as UTF-8 (section 2.5, and XLink
       1.0's section 5.4, which escapes a character outside the URI set as its UTF-8 octets). The importer decodes
       after it splits the path at `/`, so a `%2F` stays data within its segment (section 2.2: a percent-encoded
       reserved character is not equivalent to the character). The path names the entry it spells: `my%20sign.png`
       and `my sign.png` from `items/i.xml` both name `items/my sign.png` (Aiden's ruling of 2026-11-06, PR #46
       comment 3: an href is percent-decoded before it is resolved, RFC 3986 sections 2.1 and 5.2, which goes past
       main, whose resolver never decoded), `images/../images/sign.png` names `items/images/sign.png`, `a/./b.png`
       names `items/a/b.png`, and `a/b/..` names the directory `items/a/`, which no entry is (`file-exists`).

     A resource's href names the document at its resolved path (reading 93); `href-listed` compares it with its own
     files' resolved paths, and an external href with its files' hrefs as written, since the representation resolves
     no URI outside the package. No relation can percent-decode a name, so the resolution is the importer's: the
     database holds each href's outcome (`HrefScope`: `entry`, `external`, `document` or `unresolved`) and the path it
     names, compares the path with `Entry`, and proves what a row can (a resolved path holds no dot segment, a target
     with a scheme or a leading `/` is external, only an empty target names its document); the law oracle resolves by
     a second implementation of RFC 3986 that shares no code with the importer (`src/test/resolution.ts`), the
     differential that holds the importer to the RFC.

     What the importer reads no name from is refused under the stated limit "Href form" (`href-form`), never under a
     law of Content Packaging or QTI, each for a cause the representation cannot state, and each lifted by what is
     named:
     - a `%` that starts no percent-encoding (`a%zz.png`, a `%` at the end): RFC 3986 (section 2.1) gives it no octet,
       so the path names nothing, while the URL Standard keeps it as written, as a validation error; an `xs:anyURI`'s
       value domain refuses it first (reading 71). A ruling that a URL-typed attribute follows the URL Standard there
       would lift it.
     - percent-encoded octets that spell no UTF-8 (`%FF`, a lone `%C3`): an entry's path is Unicode text, so the
       octets name no entry the representation can compare with; which file they name depends on the archive's own
       name encoding (a zip without its UTF-8 flag names in code page 437). Reading an entry's name as the octets the
       archive stores would lift it.
     - a segment that decodes to a `/` or U+0000 (`a%2Fb.png`, `%00`): the `/` is data in its segment, naming a file
       whose name holds `/`, and a resolved path is one text whose segments are separated by `/`, so it cannot hold
       that segment apart (a path held as one row per segment would lift it); PostgreSQL text holds no U+0000, so that
       one stays.
     - a backslash: XLink's escaping makes it the name's octet `%5C`, while the URL Standard, which HTML resolves its
       URL attributes by, reads it as `/` in a URL of a special scheme, so the two sources a QTI document's hrefs
       answer to name different files by it. A ruling of which reading governs each attribute type would lift it.
     - a tab, line feed or carriage return a preserving type keeps in the path (`object@data`): XLink's escaping makes
       it the name's octet, while the URL Standard removes it. The same ruling would lift it. Under the other types the
       whitespace class has turned each into a space first, so there it is resolved.
     - a `:` in the first segment of a path with no scheme (`1:a.png`; `./1:a.png` is resolved): RFC 3986 (section
       4.2) makes it no relative reference, since it "would be mistaken for a scheme name", while the URL Standard
       reads it as a path; an `xs:anyURI`'s value domain refuses it first. The same ruling would lift it.
     - a `srcset` of several image candidates or with a descriptor: the HTML Standard's own parsing algorithm splits
       a `srcset` into candidates, which the representation does not state, and a `ReferencePath` holds one path per
       attribute. Stating that algorithm, with a candidate's index in the key, would lift it.

     Lifted from the earlier limit: dot segments anywhere in a path, a climb above the root (now external), any
     percent-encoding that decodes to UTF-8, whitespace inside a path that its type replaces or collapses, an
     `xml:base` in a document, and an `xml:base` on a `cp:manifest`, `cp:resources` or `cp:resource`, which IMS
     Content Packaging 1.2 resolves by RFC 3986 (section 6.11.1, the Base class: "Relative references appearing
     within the scope of a Base object shall then be interpreted according to the rules defined in RFC3986").

     The corpus moves no verdict, counted by a scan of every manifest and every XML document of its 28 packages, and
     again on 2026-11-06 over the 1,657 file-reference and `xml:base` attributes of every XML entry of its zips: no
     `cp:resource` href holds a query or a fragment; every `cp:file` href is a plain relative path; no element anywhere
     holds an `xml:base`; no relative href holds a `%`, a space, a tab, a backslash or a dot segment after a plain one.
     Among the documents' references, `BPIG_22April` holds two media fragments (`asl/item123.mp4#t=00:00:01,00:00:10.0`
     and `asl/item123.mp4#t=00:00:16.0`, whose path is an entry) and three stimulus refs
     `../passages/unbelievableNight.xml` from `items/`, which name the entry `passages/unbelievableNight.xml`;
     `maxfiles` holds three response-processing `template-location`s `../rptemplates/match_correct.xml` and
     `../rptemplates/map_response.xml`, which name entries; no reference climbs above the root; `BBQsTest` holds
     thirteen absolute `http:` references in `a@href` and `img@src`, external; the four `srcset` values are each one URL
     with no descriptor. This binds pantry and plate alike. This is not a case of documents in conflict: Content
     Packaging states the launch parameters and the base, and RFC 3986 decides where a path ends and what it names.
     (Decided 2026-11-06 by W5 seat HP under the operator's standing ruling of 2026-11-05 that the spec wins; restated
     2026-11-06 by RV seat P, on the review of PR #46, under Aiden's ruling of 2026-11-06 on percent-decoding.)

103. **A document's file references are the attributes its vocabularies define as the location of a file, and each one
     that resolves within the package names a file the manifest describes; an `xml:base` is a base, resolved and never
     a file reference.** IMS Content Packaging 1.2 (Information Model, Version 1.2 Public Draft v2.0, section 6.3, the
     InterchangePackage class; lines 409 and 411 of `imscp_infov1p2pd2.txt`) says "b) Any file described in the
     Manifest using a URI that resolves to a location within the InterchangePackage shall be included in the
     InterchangePackage" and "d) Files contained in the InterchangePackage may contain internal references to other
     files (e.g., a HTML content file may reference a JPEG content file ...). When a file contained in an
     InterchangePackage references another file using a URI that resolves to a location within the InterchangePackage,
     the referenced file shall be described in the InterchangePackage’s Manifest." Content Packaging does not say which
     attributes of a file are its references to other files. Each vocabulary's own specification does, so the census
     reads them there:
     - QTI's HTML subset: `a@href`, a hyperlink; `blockquote@cite` and `q@cite`, the quotation's source; `img@src`,
       `img@longdesc`, `object@data`, `audio@src`, `video@src`, `video@poster`, `source@src` and `track@src`, HTML's URL
       attributes; and `source@srcset`, HTML's list of image candidate strings, each candidate's URL one reference.
     - QTI's own attributes: the `href` of `qti-stylesheet`, `qti-assessment-item-ref`, `qti-assessment-section-ref`,
       `qti-assessment-stimulus-ref`, `qti-adaptive-engine-ref`, `qti-adaptive-settings-ref`, `qti-metadata-ref` and
       `qti-usagedata-ref`; `qti-interaction-modules@primary-configuration` and `@secondary-configuration`, module
       configuration files (the implementation guide's `modules/maths_config.js`, line 8500 of `impl.txt`);
       `qti-response-processing@template-location`, a template file (the guide's `../rptemplates/match_correct.xml`,
       line 13693); and `qti-outcome-declaration@long-interpretation`, which points to a fuller description of the
       outcome.
     - XInclude 1.0's `xi:include@href` (section 3.1); MathML 3's `href` on every element (section 2.1.6), `math@altimg`
       and `math@cdgroup` (section 2.2.1), `mglyph@src`, `share@src`, `annotation@src` and `annotation-xml@src`; and
       SSML 1.1's `audio@src` and `lexicon@uri`.

     Left out, each because its value names no file as written: `cp:file@href` and `cp:resource@href`, the manifest's
     own description of its files, which (b) binds; `qti-interaction-module@primary-path` and `@fallback-path`, a
     module location the AMD loader extends with `.js` (the guide's `modules/lib/handlebarsV2.min`, line 8501);
     `qti-response-processing@template`, a template's identifier (reading 51); and the URIs that identify rather than
     locate, `qti-custom-operator@definition`, `qti-portable-custom-interaction@custom-interaction-type-identifier`,
     MathML's `definitionURL`, and the usage data's `context` and `glossary`.

     An `xml:base` is left out too, as a base and not a reference: xml.xsd says it "provides a URI to be used as the
     base for interpreting any relative URIs in the scope of the element on which it appears; its value is inherited"
     (`~/.cache/gr8des/qti3/xsd/w3/xml.xsd`, lines 118 to 122), and the information model's `base` is "An optional URI
     used to change the base for resolving relative URI for the scope of this object" (section 5.15.6). So it names no
     file of its own: each `xml:base` is resolved against the base above it, the innermost in scope having "the highest
     precedence" (RFC 3986, section 5.1), and every reference in its scope, the element's own attributes included,
     resolves against it; in the manifest, IMS Content Packaging 1.2's Base class (section 6.11.1) does the same for a
     `cp:file`'s and a `cp:resource`'s href.

     A census attribute's value, and a manifest href, is resolved as reading 102 resolves an href: only its path names a
     file, merged with the `xml:base` in scope or the document's own path, its dot segments removed and each segment
     percent-decoded. Upstream's census, from its own specification's section 4.6, holds the HTML attributes, the `href`
     of `qti-stylesheet` and the four other `qti-*-ref` files above, and `xi:include@href`; the rest are added here by
     the same rule, and the three refs' `href` is the one path their targets are read through. This binds pantry and
     plate alike. This is not a case of documents in conflict: Content Packaging states the rule, each vocabulary says
     which of its attributes name files, and XML Base says what a base is. (Decided 2026-11-06 by W5 seat PG under the
     operator's standing ruling of 2026-11-05 that the spec wins; the `xml:base` clause restated 2026-11-06 by
     RV seat P, on the review of PR #46.)

104. **A choice's identifier is used by no other choice of any class in its document, and names no item variable.** Four
     choice classes of the information model say of their identifier "This identifier must not be used by any other
     choice or item variable" (section 5.132.1, SimpleChoice,
     https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_SimpleChoice.Attr_identifier, and sections
     5.131.1, 5.73.1 and 5.67.1 of SimpleAssociableChoice, InlineChoice and HotspotChoice), and the other five name
     their own noun: "any other gap" (section 5.55.1, Gap), "any other image" (5.56.1, GapImg), "any other text"
     (5.58.1, GapText), "any other hotspot" (5.7.1, AssociableHotspot) and "any other hottext choice" (5.65.1,
     HotText). The four are read literally: "any other choice" is any other element of the nine choice classes, each an
     element whose identifier a response holds as an identifier, pair or directed pair value, "a logical reference to
     another object in the item, such as an itemVariable or choice" (section 7.16, Identifier). The five say what
     their own class bars and do not say that another class may reuse the identifier, and a response names a choice by
     its identifier alone, so the nine classes share one space of identifiers, and the stricter reading of the
     normative text is the one taken. A gap and a gap text of one gap match interaction therefore may not share an
     identifier, and neither may a simple choice and a hottext, or an inline choice and a gap. The sentence names no
     interaction, and its other term, "item variable", is the item's. So the scope is the document: no two choices of
     the nine classes in one document share an identifier, whichever interactions hold them, and no two hottexts do,
     inside a hottext interaction or not (reading 38). The item variables are an item's declared variables, of all four
     kinds, and its built-in variables, which "are declared implicitly" (section 2.2.2): `completionStatus`,
     `numAttempts` and `duration`, and `QTI_CONTEXT` (section 2.2.2.1). So in an item no choice and no hottext bears
     the identifier of a declaration of its document or of a built-in variable. A document that is no item, such as a
     stimulus, has no built-in variables, and its choices are judged against its declarations, of which it has none.
     Identifiers are compared collapsed (reading 7). The schema states it with "Choice identifier key", which holds
     the per-class keys, and a check on `ChoiceVariableName` that a name one of the nine classes bears is borne by no
     other choice or hottext, in the document and over its assembly (an included fragment's choices count among its
     item's, reading 117). In the corpus, the 28 packages hold 1,266 elements of the nine classes, and none shares an
     identifier with an element of another class; 16 items of `shared-vocabulary` repeat choice identifiers across the
     interactions each one replicates (`Item_QTI3_Hotspot_01` holds two hotspot interactions whose choices are both `A`
     to `D`), and that package is refused already; no item gives a choice the identifier of a declaration or of a
     built-in variable. So no verdict moves. This binds pantry and plate alike. This is not a case of documents in
     conflict: the XSD types a choice's identifier `IdentifierDType` and decides nothing of its uniqueness. (Decided
     2026-11-06 by W5 seat PM under the operator's standing ruling of 2026-11-05 that the spec wins. Amended 2026-11-08
     by the overseer under the operator's delegation, mail 7a7e6287, ruling 1: the four classes' "any other choice" is
     read across classes, the stricter normative reading, and the nine classes share one space of identifiers; the
     reading of those four one class at a time is withdrawn.)
105. **A usage statistic's value is typed by the base type it names, and untyped where it names none.** The usage data
     binding (QTI 3.0 Usage Data Information Model and XSD Binding 1.0, section 2.6.5, the Value class,
     https://www.imsglobal.org/sites/default/files/spec/qti/v3/ud-bind/index.html; line 2620 of the page in
     `~/.cache/gr8des/qti3/ud-bind.html`) describes `ud:value` as "A class that can represent a single value of any
     baseType", an `xs:normalizedString` with an optional `baseType` of BaseTypeEnum (section 2.7.1), whose terms give
     each base type the values the information model gives it (section 8.13). Its `baseType` row adds "This attribute is
     only used for specifying the base-type of a value that forms part of a record" (line 2694), and its
     `fieldIdentifier` row says the same of the field identifier, "only used for specifying the field identifier for a
     value that forms part of a record" (section 2.6.5.1). A value forms part of a record where it writes a
     `fieldIdentifier`. A `baseType` outside a record has no base type to state and is not read as one: a `ud:value`
     that writes no `fieldIdentifier` is its type's `xs:normalizedString` text whatever `baseType` it writes, neither
     refused nor typed (decision 321 (6): "usage-data baseType outside a record accepted untyped"). Read as the
     attribute's purpose, not as a ban (reading 1), a `baseType` written on a value inside a record states that value's
     base type. So a `ud:value` inside a record that writes `baseType` holds a lexical form of that base type, read as a
     `qti-value`'s text is: outer
     whitespace is formatting but for string (reading 7), a boolean is `true` or `false` (reading 34), an integer is
     unbounded (reading 45), a float or a duration is an `xs:double`, an identifier an `IdentifierDType`, a uri an
     `xs:anyURI` (reading 71), a point two integers and a pair or a directed pair two identifiers, each with one
     whitespace character between, and a string or a file any text. The Value class's other sentence, "The base-type is
     defined by the baseType attribute of the declaration", has no declaration to read in usage data, so a value that
     writes no `baseType` is its type's `xs:normalizedString` text and nothing more, as the implementation guide's own
     usage-data file writes every value (section 6.5, `<value>0.87</value>`). The corpus holds no QTI 3 usage data (its
     `usageData` package is in QTI 2.2's namespace, refused `not-qti3` by reading 89), so no verdict moves; of the
     fixtures, `usage3-integer-float` (`<value baseType="integer">0.87</value>`, outside a record) is accepted untyped,
     as are `usage3-typed` and `usage3-float-padded`. This binds pantry and plate alike. This is not a case of documents
     in conflict: the XSD types the text `xs:normalizedString` and the binding types the value by the base type it names
     where it forms part of a record. (Decided 2026-11-06 by W5 seat PM under the operator's standing ruling of
     2026-11-05 that the spec wins; amended by decision 321 (6).) (Proposed in phase 15, 2026-11-06, for the operator;
     decision 321.)
106. **A prefixed reference reaches every built-in variable its item ref's item holds, `QTI_CONTEXT` among them.** The
     information model says "Item variables are declared by variable declarations: context, response, outcome or
     template variables" (section 2.2.2), "QTI_CONTEXT is a built-in variable and so any references within an item or
     an assessment to the QTI_CONTEXT variable, or to the three built-in fields, must succeed" (section 2.2.2.1), and
     that during outcome processing "values taken from an individual item session can be looked up by prefixing the
     name of the item variable with the identifier assigned to the item in the qti-assessment-item-ref" (section
     2.11.1.2). So `Q01.numAttempts`, `Q01.duration`, `Q01.completionStatus` and `Q01.QTI_CONTEXT` each name a
     variable of item ref `Q01`'s item, the built-ins the installed `BuiltInVariable` lists under an item's root with
     the types reading 29 gives them, and each counts as a resolving reading under reading 48. The upstream rule set
     this repository ported (the UP audit's A55) reached only the three session variables; `QTI_CONTEXT` is admitted
     here because section 2.2.2.1 says a reference to it must succeed (reading 1). A `duration` read so is the item's
     whether or not the item is time dependent (reading 150), and an item ref
     that names an LTI link has no item whose declarations a prefix reads, so a prefixed reference through it is
     accepted unchecked, a recorded limit (reading 110). In the corpus, the one test package that prefixes names,
     `test_package_minfiles`, reads `item034.SCORE`,
     `item063.SCORE`, `item065.SCORE` and `item160.SCORE`, each declared and each resolving once, and every test
     package is refused at the codec today, so no verdict moves. This binds pantry and plate alike. This is not a case
     of documents in conflict. (Decided 2026-11-06 by W5 seat PE under the operator's standing ruling of 2026-11-05 that
     the spec wins; its LTI clause amended by decision 321 (6); amended 2026-11-07 by the coordinator from seat FIX-A1,
     the bar on a `duration` read so, which section 2.2.2.2 alone carried, withdrawn by reading 150.) (Proposed in
     phase 15, 2026-11-06, for the operator; decision 321.)
107. **A variable mapping adds a name for an item's outcome, and the outcome's own name still names it.** The
     information model says "Variable mappings allow outcome variables declared with the name source-identifier in the
     corresponding item to be treated as if they were declared with the name target-identifier during outcome
     processing" (section 7.48), and of the source "The identifier of the outcome variable to identify the name of the
     source identifier during outcome processing variable mapping" (section 7.48.1). It does not say the source name
     stops naming the variable, and section 2.11.1.2's prefixed lookup names "the item variable" by its declared
     identifier. So under an item ref `Q01` whose mapping maps `SCORE` to `S2`, both `Q01.SCORE` (declared) and
     `Q01.S2` (mapped) resolve, each to the item's `SCORE`, with that declaration's type. A mapping's source names an
     outcome declaration of the item its item ref names, and reading 97 keeps its target from naming any other
     variable the item declares, so no name of an item ref reaches two variables. Refusing `Q01.SCORE` would refuse
     what section 2.11.1.2 states (reading 1). The corpus holds no variable mapping, so no verdict moves. This binds
     pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-06 by W5 seat PE under the
     operator's standing ruling of 2026-11-05 that the spec wins.)
108. **A template default names a template variable of its item, and its expression is a value of that variable's
     type.** The information model says of TemplateDefault "The default value of a template variable in an item can be
     overridden based on the test context in which the template is instantiated. The value is obtained by evaluating
     an expression defined within the reference to the item at test level and which may therefore depend on the
     values of variables taken from other items in the test or from outcomes defined at test level itself" (section
     5.152), and of `template-identifier` "The identifier of the template variable affected" (section 5.152.1). So the
     identifier, compared collapsed (reading 7), names a template declaration of the item its item ref names, and the
     expression's value becomes that variable's default value, a value of its declared base type and cardinality, as
     a setter's expression "must have an effective value type which is compatible with the variable's base-type and
     cardinality" (section 2.5.1.3; the old checker's P20), a type no declaration says passing (reading 4). Its
     references resolve against the test, prefixed ones included, as reading 4 states once its text names template
     defaults beside pre-conditions and branch rules (the UP audit's A38). An item ref that names an LTI link has no
     template variable, so a template default under one is refused. The corpus holds no template default, so no
     verdict moves. This binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-06
     by W5 seat PE under the operator's standing ruling of 2026-11-05 that the spec wins.)
109. **An element whose type has an ID attribute use holds no wildcard `xml:id`.** XML Schema 1.0 Part 1 (section 3.4.4,
     Element Locally Valid (Complex Type), clause 5) calls "wild IDs" the attributes an attribute wildcard admits whose
     declaration's "{type definition} is or is derived from ID", and requires: "5.1 There must be no more than one item
     in wild IDs" and "5.2 If wild IDs is non-empty, there must not be any attribute uses among the {attribute uses}
     whose {attribute declaration}'s {type definition} is or is derived from ID". `xml:id`, which `xml.xsd` declares of
     type `xs:ID`, is the only global attribute of an ID type the pinned XSDs hold, so it is the only wild ID and clause
     5.1 always holds. Under a `lax` or `strict` attribute wildcard it is assessed against that declaration and is a
     wild ID; under `skip` it is not assessed and is not one; an `xml:id` the type declares itself is an attribute use,
     not a wild ID. So on an element whose type, its kind's declared type or the type an `xsi:type` makes govern it
     (reading 84), has an attribute use of an ID-derived type, such as `id` of `UniqueIdentifierDType`, a wildcard's
     `xml:id` is refused under attribute admission, even with no `id` written: `<qti-null xsi:type="ImgDType"
     xml:id="b"/>` is invalid, as is `<qti-null xsi:type="ImgDType" id="a" xml:id="b"/>`. In the pinned grammar the rule
     bars `xml:id` under 52 governors in both versions, the empty-content `qti-null`, `qti-exit-response`,
     `qti-exit-template` and `qti-exit-test` each under the thirteen `xsi:type`s that declare `id` (`ImgDType`,
     `BRDType`, `ColDType` and ten more); no kind's own type is barred, since every kind whose wildcard validates
     `xml:id` declares no ID attribute, and the HTML and QTI kinds that declare `id` admit no `xml:id` they do not
     declare (reading 90). libxml2 2.9.13's `xmllint`, the validity oracle, does not implement clause 5.2
     (`xmlschemas.c` lines 25642 to 25656, "URGENT VAL TODO: implement"): it prints "Unimplemented block" and accepts
     such an element, and its verdict is recorded against this reading. No corpus document writes an `xsi:type`, so no
     corpus verdict moves. This binds pantry and plate alike. This is not a case of documents in conflict: XML Schema
     decides its own validity. (Decided 2026-11-06 by W5 seats UP and PG under the operator's standing ruling of
     2026-11-05 that the spec wins.)
110. **A variable mapping and a template default name variables an item declares; under an item ref that names an LTI
     link a variable mapping is accepted unchecked, a recorded limit, and a template default is refused.** The
     information model says "Variable mappings allow outcome variables declared with the name source-identifier in the
     corresponding item to be treated as if they were declared with the name target-identifier during outcome
     processing" (section 7.48), and "The default value of a template variable in an item can be overridden based on the
     test context in which the template is instantiated" (section 5.152), its `template-identifier` being "The
     identifier of the template variable affected" (section 5.152.1). Each names a variable declared in the
     corresponding item. An item ref may name an LTI link instead of an item (the implementation guide's section 6.2.9,
     informative; the UP audit's B3), and an LTI link is no QTI item: the package holds no declaration of what the
     external tool reports, so a mapping's source under such an item ref names a variable nothing in the package lists,
     and a prefixed reference through it names one too (reading 106). Both are accepted unchecked. This is a recorded
     limit, not a law of the specification: the cause is that the package states no declaration to check the name
     against (audit F13), and what would lift it is a source that lists the outcomes an LTI link reports, against which
     the source and the prefixed name would be checked as they are under an item. A template default stays refused
     under such an item ref, under `template-default-target`, as a template its item does not declare is: an LTI link
     is no QTI item and has no template variables to override, whatever outcomes it reports. A variable mapping under
     an item ref that names an item is still refused under `variable-mapping-source` where its source is a variable the
     item does not declare, and never as a derived field. The corpus's LTI item refs (testWithLti) hold neither, so no
     verdict moves. This binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-06
     by W5 seat PE under the operator's standing ruling of 2026-11-05 that the spec wins; amended by decision 321 (6).)
     (Proposed in phase 15, 2026-11-06, for the operator; decision 321.)
111. **A processing element's `identifier` names a variable of the kind the element reads or sets.** The information
     model defines each: a correct value is of "the associated response variable" (section 7.10.1), a map response's
     and a map response point's variable a response (sections 7.22.1, 6.9.46), a lookup's "the outcome variable to be
     set" (section 5.87.1), a set outcome value's an outcome (sections 6.32.3, 6.39.4), a set template value's a
     template (section 6.50.1), a set default value's "The response variable or outcome variable" (section 6.50.4),
     a set correct response's a response (section 6.50.5), and a variable's and a default's any item variable,
     context, response, outcome or template (sections 7.47.1, 7.12.1, 2.2.2). A built-in variable stands as the
     declaration kind `BuiltInVariable` gives it under its document's root (reading 29), so setting `numAttempts`
     by a set outcome value is refused and setting `completionStatus` is not. Through a test's prefix the variable
     is the item's, typed by its own declaration (reading 48). In the corpus, 2,462 such references name a variable,
     each of a kind its element admits, so no verdict moves. This binds pantry and plate alike. This is not a case
     of documents in conflict. (Decided 2026-11-06 by W5 seat PE under the operator's standing ruling of 2026-11-05 that
     the spec wins.)
112. **A test's setter sets a variable of its own document, so a prefixed reading never resolves it.** The
     information model names a setter's `identifier` "The identifier of the variable to be set" (section 5.130.1,
     SetValue) and a lookup's "The identifier of the outcome variable to be set" (section 5.87.1), each rule setting
     "the value of an outcome variable" or of "a template variable" (sections 6.32.3, 6.39.4, 6.50.1) or the default
     or correct value of a response (sections 6.50.4, 6.50.5); and an item's variables reach a test only to be read:
     "values taken from an individual item session can be looked up by prefixing the name of the item variable with
     the identifier assigned to the item in the qti-assessment-item-ref" (section 2.11.1.2). So of a
     `qti-set-outcome-value`, `qti-set-template-value`, `qti-set-correct-response`, `qti-set-default-value` or
     `qti-lookup-outcome-value` only the unsplit reading resolves, a declaration of the setter's own document
     (reading 111 types it), and its split and numbered readings count for nothing under reading 48: a test that
     declares `a.SCORE` and sets it is not ambiguous beside an item ref `a` whose item declares `SCORE`, and a test
     that sets `a.SCORE` without declaring it is refused (`variable-kind`), since it would set an item's variable. In
     the corpus, the 27 setters of the 14 test and section documents name `SCORE`, `TEST_total`, `TEST_FEEDBACK`,
     `SECTION_1_total` to `SECTION_4_total` and `s1FB` to `s4FB`, none prefixed, so no verdict moves. This binds
     pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-06 by W5 seat PE under the
     operator's standing ruling of 2026-11-05 that the spec wins.)
113. **A root that reading 6 keeps foreign stands under a `strict` wildcard that finds its declaration.** Reading 6
     keeps a QTI root, a processing root or the manifest, nested inside wildcard content, as foreign content: it is not
     refused and not read as QTI. A `strict` wildcard requires "a top-level declaration for the item available, or the
     item must have an xsi:type" (XML Schema 1.0 Part 1, section 3.10.1). The wildcard finds that declaration in the
     document's schema set (section 3.10.4, Item Valid (Wildcard), clause 2; section 3.3.4, clause 1.1.1.3.2; reading
     81), and the root is then assessed against it. So a root that set declares is an element the wildcard holds by its
     declaration, and it stands, kept foreign as it is under `lax`, rather than being refused as `strict-undeclared`
     (`HeldRootsUnder`). One wildcard of the pinned XSDs is such today: the DRD's `accessForAllResource`, whose
     `grpStrict.any` is `##other` `strict` (both DRD XSDs, line 409) and whose documents' set, the manifest's,
     declares `cp:manifest`. A root that set does not declare, such as a `qti-assessment-item` there, has no
     declaration, so with no `xsi:type` naming a type of the set it is refused as before. A root in the wildcard's own
     namespace is no element `##other` admits. libxml2 agrees on every arm of the box: two roots under the three
     `strict` wildcards in both versions. No corpus document holds a root under a `strict` wildcard, so no verdict
     moves. This binds pantry and plate alike. This is not a case of documents in conflict. (The UP audit's C13, decided
     2026-11-06 by W5 seat PX under the operator's standing ruling of 2026-11-05 that the spec wins.)
114. **An `xi:include` is the information model's Include only where its parent's model holds one, and there it stands
     for its fragment's root, one of that include's alternatives.** The information model lists the classes that hold
     Include (Table 9.4.1, Include's parent classes: `BlockGroup`, `FlowGroup`, `FlowStaticGroup`, `InlineGroup`,
     `InlineStaticGroup`, `OutcomeRule`, `ResponseRuleGroup`, `SectionPart` and the rest), says that "the instance of
     include is treated as if it was actually an instance of the root element of the fragment referred to by the 'href'
     characteristic of the 'Include' class" and that "a fragment may appear anywhere in the model where one of the
     following abstract classes may appear: flowStatic, inlineStatic, blockStatic, responseRule, sectionPart or
     outcomeRule" (section 2.12, Items and Test Fragments). The pinned XSDs state each class as a `choice` group holding
     an explicit `xi:include` particle beside the class's members, so an include under a parent whose model holds that
     particle is Include, and the kinds it may stand for are the element kinds of that particle's choice group, nested
     choices flattened (`IncludeRoot`: 8,300 (version, parent, kind) rows over 155 (version, parent) families and 112
     kinds). Each of them takes a position of the parent's content automaton that follows and is followed by the same
     positions as the include's own, so N5, stepping the include at its own position, judges the merged document; a
     fragment whose root is no alternative there is refused under "Include root", though the XSD admits the include
     (an interaction included into a simple choice, a response rule into an item body). An include a wildcard admits
     (a custom interaction's markup, `qti-ordering`'s extension slot, HTML's `template`, `qti-companion-materials-info`,
     a custom operator, `qti-selection`) is no Include, since no class of Table 9.4.1 is a wildcard: it is kept as
     written, as reading 6 keeps a root nested in wildcard content, and is no site of reading 85's inclusion chains. A
     fragment's document is listed by a resource of type `imsqti_fragment_xmlv3p0` (QTI 3.0 Best Practice and
     Implementation Guide, section 6.2: "QTI 3 inclusion (XInclude)", its example `tests/rtest01-set01`), and its root
     is any kind an include stands for, so `RootOfType` is a set of (type, root) pairs and the document node's model
     admits those roots. The XSDs declare most of them locally, so `xmllint` cannot validate a fragment's document on
     its own; it is judged where it is included (reading 117). No corpus zip holds an include or a fragment resource, so
     no verdict moves; the examples' loose `tests/rtest01-set01.xml` to `rtest01-set03.xml`, packaged with
     `rtest01-fragment.xml`, are accepted. This follows the information model. This binds pantry and plate alike. This
     is not a case of documents in conflict. (Decided 2026-11-06 by W5 seat IN under the operator's standing ruling of
     2026-11-05 that the spec wins.)
115. **An include names a document of its package or a resource outside it, by an href with no fragment identifier.**
     The information model says
     "Fragments are packaged as separate resources and can be transported independently" (section 2.12), and XInclude
     says "If the href attribute is absent when parse="xml", the xpointer attribute must be present" and "Fragment
     identifiers must not be used; their appearance is a fatal error" (XInclude 1.0 Second Edition, W3C Recommendation,
     15 November 2006, section 3.1). Reading 85 refuses `xpointer`, so an include the information model reads
     (reading 114) whose href is absent or empty, or names no document the manifest lists, is refused under "Include
     target", and one whose href holds a `#` after its path, with or without a query before it, is refused under
     "Include fragment identifier", wherever the include stands. A query is admitted and names no other file (reading
     102). `XInclude.xsd` types `href` an optional `xs:anyURI`, which admits all of these; XInclude itself makes them
     fatal errors. An include whose href is external (reading 102: it starts with a scheme or with `/`) names a resource
     the package does not hold, and is admitted: it is stored as written, with its element, and never fetched, and its
     content is judged by no law, since there is no document to judge. That is a recorded under-check, not a law of the
     specification: the information model says an included fragment's content "must satisfy the requirements of the
     specification in the context of the item in which it is being included" (section 2.12, reading 117), which a
     fragment pantry never reads cannot be checked against. What would lift it is a fetch of the resource, which an
     importer of a package does not do (audit C B2). An IDREF of the including document that names an ID only that
     resource could hold is refused under "Idref target", as one that names no ID is: the merged document holds none of
     the resource's content, so its assembly binds no such ID (reading 117), and pantry cannot tell an ID the resource
     holds from one it lacks. That is a recorded over-refusal with the same cause as the under-check above, and the same
     fetch would lift it. The corpus holds no external include, so no verdict moves. The
     schema states it with one cause per fault. A site's href is a row of its own (`SitePath`), written only where the
     href resolves to a path of the package, with `entry`, whether the package holds an entry there, and its target is
     another row (`SiteTarget`):
     - An href naming a path no entry holds breaks `SitePath`'s `File_exists` CHECK, which PostgreSQL meets as the row
       is inserted, so it is refused under "File exists" alone, whether its site is an include or a section ref. The
       include's and the section ref's document laws read only paths an entry holds.
     - An include with no href or an empty one has no `SitePath`, and breaks "Include target" alone; an external one
       has no `SitePath` either and is admitted (`Site.external`, above). So does an include whose path names an entry
       the manifest lists as no document.
     - A section ref, which must write an href (AL3 refuses one that doesn't), names a section document the package
       lists. One that names an entry that is no section document breaks "Document entry" alone, and one that is
       external breaks the stated limit "Remote section ref" alone (reading 170).

     This binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-06 by W5 seat IN
     under the operator's standing ruling of 2026-11-05 that the spec wins; amended by the audit of PR #46, C B2.
     Amended 2026-11-07 by the coordinator, under the operator's standing ruling of 2026-11-05, from RV seat NIL
     (`25d16460`), on the review of the import's sentinel values: the schema's statement recorded; nothing it refuses
     changed.) (Amended 2026-11-07 by the Mind, decision 416, on audit e8db90e1's F9: the refusal of an IDREF into an
     external include's content recorded; nothing it refuses changed.) (Proposed in phase 15, 2026-11-06, for the
     operator; decision 321.)

116. **A fragment's root is read by its name at its document's root, so the three kinds the composition splits by
     context never root a fragment: a stated limit.** The composition gives three element names two kinds each, by the
     context the XSDs declare them in: `qti-template-block` and `qti-template-block.rubric`, `qti-template-inline` and
     `qti-template-inline.rubric`, `qti-feedback-block` and `qti-feedback-block.template`, whose content models differ
     (a rubric's template inline admits no hottext, gap, feedback inline or nested template inline, and each block's
     content body is its own kind). A fragment's root stands at its own document's root, which reads an element by its
     expanded name alone, so a fragment rooted at one of those names is read as the kind whose handle is the name, and
     an include whose parent admits only the split kind there (a template inside a rubric block, a feedback block inside
     a template block) is refused under "Include root". One written element is one row of one kind, so this is a limit
     of the representation, not a law of the specification; no corpus document includes such a fragment. This binds
     pantry. This is not a case of documents in conflict. (Recorded by W5 seat IN, 2026-11-06.)
117. **An included fragment is judged in place, as its merged document holds it, under one nearest interaction: the
     last a stated limit.** The information model says "When including externally defined fragments the content of the
     fragment must satisfy the requirements of the specification in the context of the item in which it is being
     included. For example, interactions included from fragments must be correctly bound to response variables declared
     in the items" (section 2.12), and the include "is treated as if it was actually an instance of the root element of
     the fragment". So a fragment's content is judged as XInclude's result infoset holds it:
     - its nodes inherit the ancestry of the includes that place it, the union over its placements, which is exact for
       every ban, a ban being a disjointness: an interaction a fragment brings into a simple choice is refused (N6), and
       a gap a fragment brings into a gap match's text stands;
     - its nodes' nearest interaction is the one its includes stand in (N8), so a fragment's hottexts and gaps are that
       interaction's choices;
     - under each item that places it, its interactions bind that item's response variables ("Binding declared",
       "BindingFit", "Binding cardinality", "Adaptive feedback", and "Binding unique" over the item and every
       placement);
     - its IDs and IDREFs are its assembly's: an item's IDREF may name an ID its fragment holds, a fragment's IDREF one
       its item holds, and a fragment's IDs are distinct from its item's ("Idref target" and "DocumentId key" over the
       assembly);
     - its catalog references are its assembly's: a `data-catalog-idref` in a fragment names a `qti-catalog` of the
       item that places it, and a test's names one of the test or of a section document it places ("Catalog reference"
       over the assembly, as "Idref target");
     - its `m:share` elements are its assembly's: a share's `src` names an element of the assembly, and "MathML share
       cycle" follows the merged document's edges per placement, so a fragment placed in two items is judged in each,
       apart, and the walk enters an element an include splices from the include's parent, so a cycle that closes
       through an include is refused by both judges; under a test's assembly, a share naming an element of another
       document the test places whole is ranked by the schema, while the law oracle reads shares in the document and
       its splices alone, a recorded difference on a cycle across such documents (no corpus test holds a share);
     - its choices and hottexts are its item's: their identifiers are distinct from the item's and from every other
       placed fragment's ("Choice identifier key" over the assembly), and name no variable of the item ("Choice not
       variable" against the item's declarations and built-in variables);
     - its feedback, template, printed-variable and context-variable references resolve in the declarations of each
       item that places it ("Feedback reference", "Feedback outcome type", "Template reference", "Printed variable
       reference" and "Context variable reference"), once per placement, as a section document's feedback and printed
       variables resolve once per test that places it (reading 5);
     - its `xml:lang` forms are its item's, so each is listed by every general category of the item's records ("Document
       lang" over the assembly);
     - a response or outcome rule fragment's variable references name its item's variables, a declaration or a built-in
       ("Variable declared" over the assembly), of a declaration kind its element may name.

     A fragment placed twice in one item is merged twice: its interactions bind their responses twice and its IDs
     appear twice, so it is refused, as its merged document is. Reading 86's rule that a section document a test places
     twice is written once is the information model's for section documents in a test's assembly (section 7.5.3, "A
     test may refer to the same section multiple times"), a different construct, and includes in a section follow it.
     A fragment's nodes are one written element each, one row each, so a fragment is judged under one nearest
     interaction: two includes that place it inside different interactions, or one inside an interaction and one
     outside every interaction, are refused under "Fragment context", a limit of the representation, not a law of the
     specification; no corpus document places a fragment inside an interaction. A rule fragment's references are
     typed in each item that places it, once per placement, where the reference is the whole expression a law types: a
     map response or map response point names a declaration of that item that holds a mapping or an area mapping
     ("Mapped response", P27), and a `qti-variable`, `qti-correct` or `qti-default` that is itself a condition names a
     boolean single declaration of that item ("Condition type", P21); a reference read through an LTI link stays
     unchecked (reading 110). Until each is stated in place, these laws read a fragment's content in its own document
     alone, each a known under-refusal and never an over-refusal: the `xml:lang` forms of a fragment a section document
     or a test places, listed by the test's records; a rule fragment's other types, the type laws over its composite
     expressions (P20 to P29), such as a `qti-sum` of its variables under a `qti-response-if`, which read its variables
     untyped; a condition reference to a declaration with no base type, a record, which writes no placed type and so is
     not typed; and the processing language its rules are written in (O4), which reads as none. The composites and the
     record reference move a verdict: the import accepts a package whose fragment holds such a type error, which the
     law oracle, typing the fragment in its item, refuses. Typing an expression once per placement is planned as its
     own goal. This binds pantry and plate alike. This is not a case of documents in conflict.
     (Decided 2026-11-06 by W5 seat IN under the operator's standing ruling of 2026-11-05 that the spec wins. Amended
     2026-11-07 by the Mind, decision 416, on audit e8db90e1's F2, and decision 417, on its F3. Amended 2026-11-07 by
     the coordinator, under the operator's standing ruling of 2026-11-05, from seat FIX-ASM: the content references of
     a fragment a section document or a test places resolve in the test, reading 145. Amended 2026-11-09 by the Mind,
     decision 463, on research aeced65a's O18 and O38: a placed reference's mapping and its type as a condition, typed
     in its item; and decisions 465 and 466: a rule fragment's composite expressions and its condition references to a
     record, stated as a limit that moves a verdict.)

118. **An include holds at most one fallback, and its `accept` and `accept-language` hold header characters alone,
     though `XInclude.xsd` admits more.** XInclude says "The children property of the xi:include element may include a
     single xi:fallback element; the appearance of more than one xi:fallback element, an xi:include element, or any
     other element from the XInclude namespace is a fatal error", and of `accept` and `accept-language`, "Values
     containing characters outside the range #x20 through #x7E must be flagged as fatal errors" (XInclude 1.0 Second
     Edition, section 3.1). `XInclude.xsd`'s `includeType` admits any number of `xi:fallback` children, and types the
     two attributes `xs:string`. So `xi:include`'s content model is restated as the elements it ignores, of another
     namespace or of none, with at most one `xi:fallback` among them, and the two attributes take the pattern
     `[ -~]*`. XInclude also says "It is a fatal error for an xi:fallback element to appear in a document anywhere other
     than as the direct child of the xi:include" (section 3.2). The pinned XSDs name `xi:fallback` only under
     `xi:include`, but a wildcard reads XInclude's globals as their kinds, so a fallback in wildcard content is read as
     XInclude's element and not refused: a known under-refusal, until a law holds a fallback to its parent. No corpus
     document holds an include. This binds pantry and plate alike. This is not a case of documents in conflict.
     (Decided 2026-11-06 by W5 seat IN under the operator's standing ruling of 2026-11-05 that the spec wins.)
119. **A rounding operator's integer `figures` is at least 1 under significant figures and at least 0 under decimal
     places.** The information model says of EqualRounded's `figures` "If roundingMode= 'significantFigures', the
     value of figures must be a non-zero positive integer. If roundingMode='decimalPlaces', the value of figures must
     be an integer greater than or equal to zero" (§5.47.2; the 3.0.1 model's the same), and of RoundTo's the same
     with `rounding-mode` (§5.119.2). `rounding-mode` defaults to `significantFigures` on `qti-equal-rounded`
     (§5.47.1) and is required on `qti-round-to` (§5.119.1, `[1]`, where AL3 refuses its absence and this reading
     reads no mode). `figures` is `IntegerOrVariableRef`, a union of `xs:integer` and a variable's name (the XSD's
     `VariableStringDType`, an NCName): an integer is read collapsed, as the union's `xs:integer` member collapses
     whitespace, so `" 0 "` is 0, within reading 46's signed 64-bit range, and `-0` is 0; a name is read at run time
     and is not judged. A mode outside the enumeration is AL1's and binds neither bound. The XSD types `figures` as
     that union and does not decide this. This follows the information model and sets the XSD aside (readings 16 and
     17). Law "Rounding figures" (rule `P10`, main's), a check on `Rounding`, one row per rounding operator that copies
     its `figures` and its `rounding-mode` and holds the mode in force (`src/qti/operators.ts`). (Decided 2026-11-06 by
     RV seat O, on the review of PR #46, under the operator's standing ruling of 2026-11-05 that the spec wins.)
120. **A `qti-index`'s `n` is at least 1 where it is a number.** The information model says of Index "'n' must be a
     positive integer. If 'n' exceeds the number of values in the container (or the sub-expression is NULL) then the
     result of the index operator is NULL. If 'n' is an identifier, it is the value of 'n' at runtime that is used"
     (section 5.72, in both versions), and types `n` as `IntOrIdentifier`, "The union consists of values of
     data-type(s): NCName (Primitive-type), Int (Primitive-type)" (section 5.72.1). The XSD types it as a union of
     `xs:NCName` and `xs:int`, which admits `0` and negative integers. This follows the information model and sets the
     XSD aside, with the stricter source deciding where both are normative (readings 16 and 17): the union's `xs:int`
     member is held to 1 and above, and keeps `xs:int`'s largest value (reading 46). An NCName never begins with a
     digit or a sign, so `0`, `+0`, `-0` and `-1` meet only the integer member and are refused under
     `attribute-lexical`, while `1`, `+1`, `n=" 2 "` and `2147483647` are admitted. An `n` that is an NCName names a
     variable whose value is read at run time; that its value is positive is the renderer's, and pantry checks only
     that the variable is declared. (Decided 2026-11-06 by RV seat G, on the review of PR #46, under the operator's
     standing ruling of 2026-11-05 that the spec wins.)
121. **Under `tolerance-mode` absolute or relative, a `qti-equal` carries a `tolerance`; every `tolerance` is one or two
     values, each number among them above 0.** The information model says of Equal's `tolerance` "If the tolerance
     mode is absolute or relative then the tolerance must be specified. The tolerance consists of two positive
     numbers, t0 and t1, that define the lower and upper bounds. If only one value is given it is used for both"
     (§5.46.2; the 3.0.1 model's the same), with `tolerance-mode` `exact` by default (§5.46.1). Its type,
     ToleranceList, is "a space separated list of either strings (must not contain a space) or numbers. Each value
     must either be of primitiveType String or primitiveType double" (§9.1.5). A value written in `xs:double`'s lexical
     space (XML Schema 1.0 Part 2 §3.2.5.1) is a number; any other value is a string, which names a variable read at
     run time and is not judged. "Positive" excludes zero, as reading 16 reads `normal-maximum`, so `0`, `-0` and
     `0e5` are refused, and so are `NaN` and `-INF`; `INF` is a positive number, and `+INF` is no `xs:double` under
     XML Schema 1.0, so a string. Positivity is read off the number as written, its sign and a mantissa digit other
     than 0, not off its nearest double: `-0.1234567890123456` is refused though a double precision holds fewer
     significant digits, and `1e-400` is accepted though binary64 rounds it to 0. The count and the values bind every
     `tolerance`, in exact mode too, since the sentence says what a tolerance is, so `tolerance=""` holds no value and
     is refused. Both modes are `xs:string` enumerations under whiteSpace `preserve`, read as written. The XSD types
     `tolerance` as an unbounded list of a union of `xs:string` and `xs:double`, which admits any value, and does not
     decide this; main bounded neither the count nor the sign. This follows the information model and sets the XSD
     aside (readings 16 and 17). Law "Equal tolerance" (rule `P36`, main's): the containment of an `absolute` or
     `relative` mode's `Attribute` selection in `Tolerance(node)`, a check on `Tolerance` for the count, and a check
     on `ToleranceToken` for each value's sign, the values split as `TextIdref` splits a text
     (`src/qti/operators.ts`). (Decided 2026-11-06 by RV seat O, on the review of PR #46, under the operator's standing
     ruling of 2026-11-05 that the spec wins.)
122. **A LOM `learningResourceType` of the LOM vocabulary is neither `exam` nor `self assessment`.** The QTI 3.0
     Metadata binding says: "QTI objects are designed to be reusable in a variety of assessment scenarios. Therefore,
     the LOM-defined values self assessment and exam are forbidden. If the standard LOM vocabulary is used then only
     the values exercise or questionnaire should be used to describe an item" (section 2.7.5.1,
     https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html, normative by its section 1.2). The
     ban is of the _LOM-defined_ values, so it binds a term of the LOM vocabulary. A term is the LOM vocabulary's when
     its `source` is `LOMv1.0`; when its `source` is empty, which the loose binding's `default="LOMv1.0"` fills
     (`imsmd_loose_v1p3p2.xsd` line 1288, `LearningResourceType.Type`); or when it writes no `source`, which this
     reading reads as the same default. A term of any other source is another vocabulary's, which the loose binding
     "does not enforce" (section 3.6), so its `exam` is not refused (reading 1). Source and value are compared
     collapsed, so `<value> self  assessment </value>` is refused and `<source> LOMv1.0 </source>` is the LOM's source;
     a source of whitespace alone collapses to the empty source and is read as it is, as reading 62 reads an `xml:lang`
     of whitespace alone. The comparison keeps case, so `Exam` is no LOM-defined value, and `self-assessment` is none
     either. "Should" (exercise, questionnaire) is advice and is not read. The binding's Schematron caps a type at one
     `source` and one `value` (lines 529 and 533, reading 130), so a second is refused under `child-set` before this law
     reads the first. A `value` of another LOM vocabulary (an interactivity type's `exam`) and an element of another
     namespace inside the type are not read. The law is `lom-learning-resource-type` (`src/qti/metadata.ts`,
     `LomResourceType` and `LomResourceTypeSource`): a type whose value collapses to a forbidden one has a source naming
     another vocabulary. It holds over the records: a resource's metadata and the manifest's own, in the package
     manifest, and an external record file. A `cp:metadata` of any other document describes no part of the package, so
     a `learningResourceType` there is no record's and is not read (the ruling of `170356bd`; `recordDocumentTypes`,
     `src/qti/metadata.ts`). The 1EdTech corpus holds 18 `learningResourceType`s, every one of source `RDNLTSNType`,
     so no verdict moves. Main refused the two values whatever the source; this reading refuses only the LOM
     vocabulary's. This binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-06
     by RV seat M, on the review of PR #46, under the operator's standing ruling of 2026-11-05 that the spec wins.)
     (Amended 2026-11-09 by the Mind, decision 460, on gr2-close's class B: the records the law reads stated, as the
     import already read them; nothing the import refuses changed.)
123. **A `bdo` carries `dir`, and its value is `ltr` or `rtl`.** The information model says of BDO "Authors must
     specify the dir attribute on this tag, with the value ltr to specify a left-to-right override and with the value
     rtl to specify a right-to-left override. The auto value must not be specified" (section 5.11, in both versions).
     The XSD declares `bdo`'s `dir` optional, with the values `ltr`, `rtl` and `auto` and the default `auto`. This
     follows the information model and sets the XSD aside, the information model being the stricter source (readings
     16 and 17): a `bdo` with no `dir` is refused under `required-attribute`, and `dir="auto"` under
     `attribute-lexical`. The XSD's default is never read, since a valid `bdo` always writes the attribute. Every other
     element's `dir` keeps `auto`. The rule holds by the element's name, so a `bdo` an `xsi:type` governs carries `dir`
     too (reading 84). This restores the rule that the ruling of 2026-11-05 that attributes follow the XSD (reading 9)
     had removed; the operator's ruling of 2026-11-06 overrules that ruling wherever the information model is stricter.
     (Decided 2026-11-06 by RV seat G, on the review of PR #46, under the operator's standing ruling of 2026-11-05 that
     the spec wins.)
124. **A `source` in a `picture` carries `srcset`, and one in an `audio` or a `video` carries `src`.** The information
     model's Source class says of `srcset` "This attribute is required when 'source' is used in 'picture'" (§5.135.3),
     and of `src` "The value must be a valid non-empty URL potentially surrounded by spaces. This characteristic must
     be present" (§5.135.1), while it gives `src` the multiplicity `[0..1]` and the class the parents Audio, Picture
     and Video. Read alone, §5.135.1's last sentence contradicts §5.135.3, since a `picture`'s source then needs both.
     The HTML Standard the class restates splits the two by the parent: where "The source element's parent is a
     picture element", "The srcset attribute must be present" and "The src attribute must not be present"; where it
     "is a media element", `src` "must be present" (HTML, the source element). So §5.135.1's sentence is read in a
     media element alone: a `source` whose parent is an `audio` or a `video` carries `src`, and one whose parent is a
     `picture` carries `srcset`. A `source` QTI admits elsewhere, in a `template`'s content or an open wildcard, is
     bound by neither. HTML's two prohibitions, no `src` in a `picture` and no `srcset` or `sizes` in a media element,
     are not stated by the information model and are not read. This follows the information model, with the HTML
     Standard deciding §5.135.1 by context, and sets aside the XSD, whose `src` and `srcset` are both optional
     `URLDType` (an `xs:normalizedString`). Laws "Picture source srcset" (rule `source-srcset`, main's) and "Media
     source src" (rule `source-src`), each a check on `Node` that the attribute's slot is in `attrs`
     (`src/qti/html.ts`).
     Each media URL the information model describes as "a valid non-empty URL potentially surrounded by spaces" holds
     a character other than a space: an `audio`'s and a `video`'s `src` ("The attribute, if present, must contain a
     valid non-empty URL potentially surrounded by spaces", sections 5.9.1 and 5.166.1), a `video`'s `poster` (the same
     sentence, section 5.166.9), and a `source`'s `src` ("The value must be a valid non-empty URL potentially
     surrounded by spaces", section 5.135.1). A `source`'s `srcset` holds one too: the information model says it
     "specifies the URL of the image to use in different situations" (section 5.135.3), and the HTML Standard, which the
     class restates, that a `srcset` "must consist of one or more image candidate strings", each holding "A valid
     non-empty URL" (the HTML Standard, srcset attributes, as published 5 November 2026). The XSD types each of them
     `URLDType`, an `xs:normalizedString`, so it admits the empty and the blank value; this follows the information
     model and the HTML Standard, the stricter sources. Spaces around the URL are admitted, and a tab or a line break
     counts as a space, since `replace` maps each to one before the value is read; so `src=""`, `src=" "` and
     `poster="&#9;"` are refused under `attribute-lexical`, and `src=" v.mp4 "` is admitted. The URL Standard's syntax
     of a valid URL string, and a `srcset`'s candidate strings and their descriptors, are not checked beyond what
     readings 102 and 103 read of a file reference: that is this reading's stated limit. Its cause is that the URL
     Standard and the HTML Standard are living documents that no pinned source holds. What would lift it is a dated
     copy of each pinned beside the XSDs, with a domain for the valid URL string and a family of a `srcset`'s
     candidates under its attribute, as `Idref` splits tokens. (Decided 2026-11-06 by RV seats H and G, on the review of
     PR #46, under the operator's standing ruling of 2026-11-05 that the spec wins.)
125. **A `track` in the subtitles state carries `srclang`, and a `track` with no `kind` is in that state.** The
     information model's Track class says of `srclang` "This attribute must be present if the tag's kind attribute is
     in the subtitles state" (§5.163.3), and maps `kind`'s keywords to HTML's states with no default of its own
     (§5.163.1). The HTML Standard it restates gives the state of a `track` that writes no `kind`: "The attribute's
     missing value default is the subtitles state, and its invalid value default is the metadata state" (HTML, the
     track element). So a `track` that writes no `kind`, or writes `kind="subtitles"`, carries `srclang`, and one of
     any other state need not. `kind`'s value domain is an enumeration under whiteSpace `preserve`, so a written `kind`
     is in the subtitles state exactly where its lexical form is `subtitles`, and an invalid keyword, HTML's metadata
     state, is refused by its domain before its state is read. This follows the information model with HTML's missing
     value default, and sets aside the XSD's optional `srclang` and its `kind` with no default. Law "Track srclang"
     (rule `track-srclang`, main's): a check on `Node` for a `track` that writes no `kind`, and a containment of the
     `track`s whose `kind` is `subtitles` in those that write `srclang`, by element (`src/qti/html.ts`).
     A `track`'s `src`, which the XSD already requires, holds a character other than a space: "The 'src'
     characteristic gives the address of the text track data. The value must be a valid non-empty URL potentially
     surrounded by spaces. This attribute must be present" (section 5.163.2). Its type is `URLDType`, read as reading
     124 reads a media URL, with reading 124's limit on the URL's own syntax. A `track`'s `srclang`, where written, is
     a BCP 47 language tag and never empty (reading 129), so `srclang="english language"` and `srclang=""` are refused
     under `attribute-lexical`. (Decided 2026-11-06 by RV seats H and G, on the review of PR #46, under the operator's
     standing ruling of 2026-11-05 that the spec wins.)
126. **Each token of a `td`'s or a `th`'s `headers` is the `id` of a `th` of the cell's own table, and no token is
     written twice.** The information model's TDH class says of `headers`: "This is a string consisting of an
     unordered set of unique space-separated tokens that are case-sensitive, each of which must have the value of an
     ID of a 'th' tag taking part in the same table as the 'td' or 'th' tag" (§5.140.1). The XSD types it a list of
     `IdentifierDType`, an `xs:NCName`, with no reference rule. A cell takes part in its nearest `table`, a nested
     table's cell in the nested table, as the HTML Standard's table model reads them; a cell no `table` holds, which
     QTI admits in a custom interaction's open content or in a `template`, takes part in no table, so no `th` is its
     header and every token it writes is refused. A token names a `th` by the value of its `id` (an `xs:ID`, collapsed),
     compared case-sensitively; a token that names no element, a `td`, any other element or a `th` of another table,
     enclosing or nested, is refused, and so is a token written twice. This follows the information model and sets
     aside the XSD's plain identifier list, the stricter source being the rule (readings 16 and 17); it restores the
     rule the operator's ruling of 2026-11-05 (question 3) removed, which the operator's ruling of 2026-11-06 on
     Aiden's review reverses. HTML's further rule, "A th element must not be targeted by itself", is not stated by the
     information model and is not read. Law "Table headers" (rule `table-headers`): each `HeaderToken(table, token)` is
     a `(table, id)` of the `th`s that take part in a table, and `HeaderToken` is keyed by `(node, token)`
     (`src/qti/html.ts`: `TableScope`, `CellHeaders`, `HeaderToken`, `TableHeader`). (Decided 2026-11-06 by RV seat H,
     on the review of PR #46, under the operator's standing ruling of 2026-11-05 that the spec wins.)
127. **No quotation punctuation stands immediately before, after or inside a `q`.** The information model says of Q:
     "Quotation punctuation (such as quotation marks) that is quoting the contents of the tag must not appear
     immediately before, after, or inside q tags; they will be inserted into the rendering by the user agent" (section
     5.111, https://www.imsglobal.org/spec/qti/v3p0/info#Data_Q; the 3.0.1 information model's section 5.111 says the
     same). The 3.0.0 and 3.0.1 ASI XSDs state it only as the documentation of `QDType`, whose mixed content admits any
     text. So a `q` is refused where any one of four characters is a quotation mark, each alone, as the sentence's "or"
     says: the last character of its sibling before it, the first character of its sibling after it, and the first and
     last characters of its own content. A mark inside the content but not at its start or its end does not quote the
     contents, and is not judged. The quotation marks are the double quote `"` (U+0022), the curly and low quotes `‘`
     `‚` `‛` `“` `”` `„` `‟`, and the guillemets `«` `»` `‹` `›`. The ASCII apostrophe (U+0027) and the right single
     quotation mark `’` (U+2019) are left out: each is an apostrophe as often as a quote, and a possessive or an elision
     beside a `q` (`the students’<q>…</q>`) quotes nothing, so a `’` that does close a quote around a `q` is not
     refused, a known under-refusal; an opening `‘` is refused. A character is read only off a neighbour that holds
     characters, a text: an element beside a `q`, or at the start or end of its content, holds none and is not judged,
     a space between a mark and a `q` keeps the mark from being immediately beside it, and so does a comment or a
     processing instruction between them. A predefined entity is read as its character, since the reader substitutes
     it (XML 1.0 section 4.6), so `&quot;` beside a `q` is refused and `&apos;` is not; a reference to an entity the
     document does not declare is read as written, `&` and `;`, since its replacement text is unknown. A `q` inside a
     `q` is judged by its own neighbours and content. This binds pantry and plate alike. This is not a case of
     documents in conflict. (Decided 2026-11-06 by RV seat Q, on the review of PR #46, under the operator's standing
     ruling of 2026-11-05 that the spec wins.)
128. **A `label` asks for the tool that labelled it where its own characteristic's description says so: a body
     element's in both versions, and a QTI 3.0.1 item's own.** The information model states the sentence "If an
     item uses labels then values for the associated toolName and toolVersion characteristics must also be
     provided" in the description of one `label` characteristic per class, and each label is read by its own:
     - both versions state it of BasePromptInteraction's `label` (section 5.15.5), of the BaseSequence family's
       (sections 5.16.5 to 5.21.5) and of ItemBody's (section 5.79.4), so a `label` on any kind whose type takes it
       from one of those classes asks for tools;
     - the 3.0.1 information model states it of the item's own `label` too ("The label characteristic provides
       authoring systems with a mechanism for labelling elements of the content model with application specific
       data. If an item uses labels then values for the associated toolName and toolVersion attributes must also be
       provided", section 4.1.3,
       https://www.imsglobal.org/sites/default/files/spec/qti/v3/info/imsqti_asi_v3p0p1_infomodel_v1p0.html), where
       3.0's says only "A human readable label that can be used to describe the Item" (section 4.1.3);
     - four descriptions state no such sentence in either version, and their labels ask for nothing: the stimulus's
       ("A human readable label that can be used to describe the Stimulus", section 4.3.3), ItemFileInfo's, the type
       of `qti-calculator-info` and `qti-digital-material` ("A human readable label/short description for the
       file", section 5.80.2; ItemFileInfo derives from no class and is no body element), and PrintedVariable's
       ("The label attribute represents information for the element that can be used to identify it or its
       functionality, such as would be appropriate for a tooltip", section 7.30.4).

     So an item one of whose elements carries a `label` its characteristic asks a tool for, in either version, or
     whose root carries one in a 3.0.1 document, carries both `tool-name` and `tool-version` on its root, and is
     refused under `label-tool` otherwise. A 3.0.0 item root's own `label`, a digital material's, a calculator's
     info's and a printed variable's ask for nothing. The kinds are read from the types the ASI XSDs declare: a
     kind's `label` asks for its tool exactly when its declared type is one of the eight above or derives from one,
     which is also exactly the kinds whose `label` the XSD declares inside one of them (`src/grammar/labels.ts`). A
     document's version is the `schemaversion` its manifest names (reading 67), and the sentence binds an item, so no
     stimulus, section or test is asked for tools. In the corpus, `testWithLti`'s labelled `qti-digital-material`
     asks for nothing, and the package is still refused, under `attribute-lexical` (reading 67). This binds pantry and
     plate alike. This is not a case of documents in conflict: each characteristic's text is read for its own elements,
     and each version's for its own documents. (Decided 2026-11-06 by RV seat I, on the review of PR #46; amended
     2026-11-06 by RV seat VD (`d389fca9`) on the corpus verdict review, the ItemFileInfo and printed-variable labels
     read by their own descriptions; both under the operator's standing ruling of 2026-11-05 that the spec wins.)

129. **`xml:lang`, `lang` and a track's `srclang` hold BCP 47 language tags, well-formed as RFC 5646 defines them.**
     XML 1.0 says of `xml:lang` "The values of the attribute are language identifiers as defined by [IETF BCP 47], Tags
     for the Identification of Languages; in addition, the empty string may be specified" (section 2.12). The
     information model says of each `lang` "Its value must be a valid [BCP 47] language tag, or the empty string"
     (sections 5.15.3 to 5.21.3), and the same of the deprecated `language` rows, which are `xml:lang` (sections 5.15.4
     to 5.21.4, and 7.30.3); of the item's and the stimulus's `language`, their `xml:lang`, "Natural language
     identifiers as defined by [BCP 47]" (sections 4.1.4 and 4.3.4); and of a track's `srclang` "The value must be a
     valid ]BCP 47] [sic] language tag" (section 5.163.3). The XSD types `lang` and `srclang` as `xs:normalizedString`,
     which admits any value, and `xml.xsd` types `xml:lang` as a union of `xs:language`, whose pattern is RFC 3066's
     (XML Schema Part 2, section 3.3.3), and the empty string. Each is read as its stricter source states it:
     - `xml:lang`, on every element, the document layer's included, is a tag or empty (XML 1.0, section 2.12), its
       whitespace collapsed as `xs:language` collapses it. Under a `skip` wildcard, as MathML's are, no declaration
       types it, and XML 1.0's sentence, a rule of XML itself, still holds: the value as written is a tag or empty;
     - on `qti-assessment-item` and `qti-assessment-stimulus`, `xml:lang` is a tag and never empty, since sections
       4.1.4 and 4.3.4 state no empty value;
     - `lang`, on every element that declares it, is a tag or empty. Its `replace` whitespace stays, so `lang="en "` is
       refused, since whitespace is no part of a tag;
     - `srclang` on `track` is a tag and never empty, since section 5.163.3 states no empty value.

     A tag is RFC 5646's `Language-Tag` (section 2.1, Figure 1): a `langtag`, a private-use tag, or one of the 26
     grandfathered tags. Tags "are to be treated as case insensitive" (section 2.1.1), the ABNF's repetitions are
     unbounded, and "Whitespace is not permitted in a language tag" (section 2.1). So `en`, `zh-Hant-TW`, `de-CH-1996`,
     `x-none`, `i-klingon`, `en-GB-oed`, `sgn-BE-FR` and `EN-us` are admitted, and `en_US x`, `english language`,
     `a-value` (section 2.2.6, rule 1), `en--x`, `1a` and `en-` are refused under `attribute-lexical`. RFC 5646 calls a
     tag that conforms to the ABNF well-formed, and a well-formed tag valid when its subtags appear in the IANA Language
     Subtag Registry as of a registry date and it repeats no variant and no singleton subtag (section 2.2.9).
     Well-formedness is checked, and validity is this reading's stated limit, so `qq-ZZ` and `de-1996-1996` are
     admitted. Its cause is that the registry is a dated external dataset that no pinned source holds, and a repeated
     subtag is a comparison between a tag's subtags that no pattern over the value states. What would lift it is a
     closed relation of a pinned registry's subtags, with each tag split into its subtags as `Idref` splits tokens, so
     a law can look each subtag up and key a tag's variants and singletons. (Decided 2026-11-06 by RV seat G, on the
     review of PR #46, under the operator's standing ruling of 2026-11-05 that the spec wins.)

130. **A LOM element repeats no more than the loose binding's Schematron allows.** QTI 3.0 packages bind LOM with IMS
     Metadata v1.3.2, "a 'loose' binding of the IEEE LOM information model i.e. it permits extensions and does not
     enforce any of the default enumerated vocabularies" (QTI 3.0 Metadata binding, section 3.6), the binding
     `lom/imsmd_loose_v1p3p2.xsd`. The binding's own header says "This is a Loose binding of LOMv1.0. The strict
     multiplicity of elements has been imposed, there is no vocabulary validation and extensions are permitted as
     elements and attributes" (lines 18-21). Its XSD writes each category as an unbounded choice of its elements (line
     984, `AggregationLevel.Type`, and its siblings), so the XSD alone admits any number of each, and each element's own
     particle states its multiplicity, `maxOccurs="1"` or `unbounded`. Its embedded Schematron is "the set of
     Schematron rules that have been created to enforce the use of the "Unordered" stereotype. These rules ensure that
     the number of entries in an unordered complexType of an element obey the multiplicity constraints" (lines 85-92):
     43 rules and 94 asserts, each `count(lom:X) = 0 or count(lom:X) = 1` (lines 93-911), and they cap exactly the
     elements the XSD bounds to one inside an unbounded choice. They are 82 pairs of a parent and an element, since
     `contribute` and `role` stand in two contexts and `date` and `identifier` in three, and every context asserts the
     same caps of each. So a `lom` holds at most one `general`, `lifeCycle`, `metaMetadata`, `technical` and `rights`
     (lines 567-583), a `general` at most one `title`, `structure` and `aggregationLevel` (lines 387-395), and a
     `classification` at most one `purpose` and `description` (lines 145-149), through all 94; `keyword`, `language`,
     `educational`, `classification`, `contribute`, `identifier` and every element the XSD leaves unbounded repeat
     freely. A `duration` in `technical` is the binding's `Duration.Type` (line 1583), capped at one there (line 883),
     and the `duration` inside it is its character string, capped at one there (line 333). The Schematron is the
     binding's own statement of LOM's multiplicities, and it binds, read by its intent as reading 9 reads QTI's: each
     assert counts the children of one element at its context's place. The Metadata binding's section 3.5, "There are
     no schematron rules used in this XSD binding of the specification", is about its own QTI metadata XSD, not the LOM
     binding of its section 3.6. This is not a case of documents in conflict: the binding's XSD and its Schematron are
     one binding, and where they differ the stricter part is the rule (readings 16 and 17). The law is N7 Counted, rule
     `child-set`: `Counted` holds each cap as at most one child at the capped element's position, and in the database a
     key over each family's children at a capped position holds it. (Decided 2026-11-06 by RV seat K, on the review of
     PR #46, under the operator's standing ruling of 2026-11-05 that the spec wins.)
131. **A namespace declaration's value is an RFC 3986 URI reference, or empty.** Namespaces in XML 1.0 (Third Edition)
     says "The attribute's normalized value MUST be either a URI reference — the namespace name identifying the
     namespace — or an empty string" (section 3), and "An XML namespace is identified by a URI reference [RFC3986]"
     (section 2.1). The URI reference is RFC 3986's `URI-reference` (section 4.1, Appendix A), which this package
     reads off Appendix A's grammar, and not reading 71's `xs:anyURI`, the RFC 2396 language that binds only values of
     that type. A relative reference is one: "The use of relative URI references, including same-document references,
     in namespace declarations is deprecated" (section 2.2), and a deprecated form is still valid, so `a/b` is
     admitted. The empty string is one, a `relative-ref` of an empty path, and stands only where the reader admits it,
     where an unprefixed declaration undeclares the default namespace. The value is the attribute's normalized value
     (section 2.3), so a space the document writes is kept and refused, as are a `%` that two hex digits do not follow,
     a character beyond US-ASCII, an IP literal that is no IPv6 or IPvFuture address, and a port of anything but
     digits: `xmlns:x="http://[bad"`, `"a b"`, `"%zz"` and `"http://h:x/"` are refused under `namespace-name`, and
     `"urn:x:y"`, `"http://a/b?c#d"`, `"http://[::1]/"` and `"http://[V1.x]/"` are admitted (RFC 5234 section 2.3
     reads ABNF's quoted `"v"` without regard to case). Section 8 says a processor "is not REQUIRED to check that
     namespace names are URI references", which frees a processor and leaves the document's constraint standing.
     libxml2 2.9.13's `xmllint` reports `namespace error : xmlns:x: 'http://[bad' is not a valid URI` for each of the
     four refused names above, says nothing of `a/b`, and exits 0 for all five: it warns where this reading refuses,
     so its verdict is not this reading's. A foreign element's or attribute's namespace comes from a
     declaration, so each holds a name this law has judged. This binds pantry and plate alike. This is not a case of
     documents in conflict. (Decided 2026-11-06 by RV seat I, on the review of PR #46, under the operator's standing
     ruling of 2026-11-05 that the spec wins.)
132. **A printed variable's `format` is a printf format string of at most one conversion, over the information
     model's conversion codes.** The information model says "The syntax of the format attribute is based on the format
     conversion specifiers defined in the C programming language [ISO 9899] for use with printf and related functions.
     Each conversion specifier starts with a '%' character and is followed by zero or more flag characters (#, 0, -, "
     " [space] and +), an optional digit string indicating the minimum field width, an optional precision (consisting
     of a "." followed by zero or more digits) and finally one of the conversion type codes: E, e, f, G, g, r, R, i, o,
     X, or x" (section 2.3.4), and of `format` "The format conversion specifier to use when converting numerical values
     to strings" (section 7.30.7). The XSD types `format` as `xs:normalizedString`, which admits any value. A format is
     read as a C format string, whose conversion specifiers the information model restricts: characters other than
     `%`, the escape `%%`, which is C's one way to write a `%`, and conversion specifiers with the listed codes. A
     format holds at most one conversion specifier, and may hold none. C says of `fprintf` "If there are insufficient
     arguments for the format, the behavior is undefined" (ISO/IEC 9899:2011, section 7.21.6.1), and a printed variable
     formats its one value, so a second specifier would read an argument that is not there. `%%` converts no argument,
     and a format of text alone prints its text. So `%.2f`, `%.f`, `%5.2e`, `Score: %i%%`, `%#x` and `100%%` are
     admitted, and `%q`, `2f%`, `%`, `%d`, `%i of %i` and `%%%e%%%G` are refused under `attribute-lexical`: `d` is no
     listed code, though the implementation guide's informative example writes `format="%d"`. "Float values should
     only be formatted in the e, E, f, g, G, r or R styles" (section 7.30) is advice and is not read. (Decided
     2026-11-06 by RV seat G, on the review of PR #46, under the operator's standing ruling of 2026-11-05 that the spec
     wins; at most one conversion is the operator's decision of 2026-11-06 on item L4.)

     Reading 161 sets aside this reading's rule that a format holds at most one conversion specifier, and with it the
     operator's decision on item L4: a format of any number of specifiers is accepted and stored as written, so
     `%i of %i` and `%%%e%%%G` are admitted. The rest of this reading stands: each specifier ends in one of the listed
     codes, and `%q`, `2f%` and `%` are still refused under `attribute-lexical`; reading 171 adds `d` to the listed
     codes.

133. **A key text holds at most 2,587 UTF-8 bytes: a stated limit of the representation, not a law of QTI.** No QTI
     specification bounds the length of an identifier, an ID, an IDREF, an `xml:lang`, a title, an href, a map key or a
     value's lexical form (readings 45 and 94 state that the productions state no length). pantry's representation still
     refuses one past a bound, because grizzle puts every text that takes part in a cross-row equality in a B-tree key,
     and PostgreSQL refuses a B-tree entry above `BTMaxItemSize`, 2,704 bytes at `BLCKSZ` 8192 (`nbtree.h`). Such a text
     is copied into a field of type `keyText` (`src/qti/limits.ts`). keyText is grizzle's byte refinement,
     `str.bytes(keyTextBytes(widestTextKey), any text)`, at most 2,587 UTF-8 bytes, which is what grizzle's own rule,
     `keyTextBytes`, leaves beside the widest key's other fields: the tree's predecessor axis on `Node`, a uuid, five
     naturals and a closed id beside the string value's running text. That's about 2,587 ASCII, 1,293 two-byte, 862 CJK
     or 646 astral characters. `limits.test.ts` holds the bound to `keyTextBytes` exactly. The one bound applies evenly:
     every text the schema copies into a keyText field counts against it, so a `<p id>` past 2,587 bytes is refused just
     as a resource identifier past it is, by the oracle's "Key text bound" (rule `key-text-bound`) and by the database
     under the same rule: the import writes the copy's row whatever its length, as it writes every copy (no host-side
     pre-filter leaves an over-long copy out), and keyText's own check refuses it. `src/test/keys.oracle.test.ts` holds
     the database's rule, read from the import's rows, to the oracle's. The law oracle reads the list of such copies
     from the schema's statements (`src/test/key-copies.ts`), and `src/test/keys.oracle.test.ts` holds its verdict to
     the import's rows in 1-, 2-, 3- and 4-byte scripts. The bound is no part of the text's type, as a pattern isn't, so
     the copy of an unbounded attribute value meets it in a containment. An entry path holds the key text's 2,587 bytes.
     An open attribute's local name and its namespace name share their key, `(node, uri, local)`, evenly: 1,329 bytes
     each. A namespace prefix holds 2,665 bytes, what its key `Namespace(node, prefix)` leaves beside the element's id.

     The bound is in UTF-8 bytes, as the operator ruled, and in no other measure: grizzle 27c4cd2 gives the byte bound
     as a refinement, `str.bytes(n, pattern)`, after a text contract proved unable to be a copy's target
     (`docs/grizzle-findings.md`). On what would lift the bound itself, grizzle's statement: "The bound is permanent for
     any key a foreign key references or a put arbitrates on, while PostgreSQL's B-tree is its only unique index. For
     other keys it would be lifted by a hash-exclusion key form, which grizzle does not plan." This binds pantry alone:
     plate holds no key. (Decided 2026-11-06 by RV seat S-ORACLE, on the review of PR #46 and Aiden's question of
     2026-11-06, under the operator's ruling that the bound is applied evenly.)

134. **An item's or a test's languages are listed by its records' general categories, compared as language tags.** The
     QTI 3.0 Metadata binding says "There must be one value for each of the languages referred to by the language
     attributes on the associated assessmentItem, test or object bank and its 'bodyElements'" (section 2.7.1.3,
     normative by its section 1.2), and RFC 5646 says "At all times, language tags and their subtags, including private
     use and extensions, are to be treated as case insensitive" (section 2.1.1) and "Whitespace is not permitted in a
     language tag" (section 2.1). `xml:lang` is an `xs:language`, whose whiteSpace is `collapse` (XML Schema Part 2,
     section 3.3.3; `xml.xsd`), so it is compared by its value, its form collapsed, its ASCII letters folded to small
     ones. A LOM `language` is a `CharacterString`, an `xs:string` whose whitespace is preserved (the loose binding,
     `imsmd_loose_v1p3p2.xsd`, `general/language`), so it is compared as written, its ASCII letters folded. So
     `xml:lang="en-GB"` is listed by `en-gb`, `EN` by `en`, and `" en "` by `en`; and a LOM `language` with spaces
     around it is no tag and lists no language, so `<imsmd:language> en </imsmd:language>` does not list the `en` an
     `xml:lang` states, and the item is refused under `document-lang`. An empty `xml:lang` states no language (XML 1.0,
     section 2.12) and asks for no listing; one of whitespace alone is no value of its type and is refused by reading
     129 before this reading reads it. Each general category of each record that names the document (reading 93) lists
     every language its item or test, and the item's body elements, state; a document no such category describes is not
     judged. This binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-06 by RV
     seat I, on the review of PR #46, under the operator's standing ruling of 2026-11-05 that the spec wins.)
135. **A MIME type is RFC 2045's type and subtype: two tokens joined by a slash.** The information model types eight
     characteristics `MimeType` (the `type` of `a`, `object`, `param`, `source` and `qti-stylesheet`, and the
     `mime-type` of `qti-file-href`, `qti-calculator-info` and `qti-digital-material`) and the upload interaction's
     `type` `MimeTypeList`, a list of them (sections 5.165.1 and 9.1.3), nine attributes in all. It defines the type as
     "The mime type (type and subtype), as defined by [RFC 2045]" (section 7.25), and says of `a`'s and `source`'s
     `type` "The value must be a valid MIME type" and "If specified, its value must be a valid MIME type" (sections
     5.1.2 and 5.135.2). RFC 2045 writes the type `type "/" subtype`, each a `token`, "1*<any (US-ASCII) CHAR except
     SPACE, CTLs, or tspecials>", the tspecials being `(`, `)`, `<`, `>`, `@`, `,`, `;`, `:`, `\`, `"`, `/`, `[`, `]`,
     `?` and `=` (section 5.1). The XSD types them `MimeTypeDType`, an `xs:normalizedString` whose pattern, the same as
     the information model's `pattern` for MimeType (section 7.25.1), takes any Basic Latin character but the tspecials
     on either side of one slash, and so admits a space and the control character `U+007F`. This follows the information
     model and RFC 2045 and sets the XSD aside where it admits more, the information model being the stricter source
     (readings 16 and 17): a value meets both patterns, so it is exactly RFC 2045's two tokens and the slash. So
     `image/png`, `IMAGE/PNG`, `image/svg+xml`, `application/vnd.ms-excel`, `x-world/x-vrml` and `*/*` are admitted, and
     ` image/png`, `image/png `, `image /png`, `image/ png`, `a b/c`, a tab or a line break, which the type's `replace`
     makes a space, `image/png` followed by `U+007F`, `image`, `/png`, `image/` and `a/b/c` are refused under
     `attribute-lexical`. The value is the type itself, not a Content-Type header field, so the header's whitespace and
     comments between tokens (RFC 2045, section 5.1, after RFC 822's structured fields) have no place in it. A parameter
     is no part of "type and subtype", and the XSD refuses its `;` and `=` already, so `text/html;charset=utf-8` is
     refused as it was. Each item of the upload interaction's list is read the same way, the list's `collapse`
     separating its items, so `type=" image/png text/plain "` is admitted and `type="image/png a(b)/c"` is refused. Main
     at 2b276d76 read these attributes as `^[^/ \t\r\n]{1,127}/[^ \t\r\n]{1,255}$` in place of the XSD's pattern: the
     same refusal of whitespace, but it admitted `a/b/c`, `é/x` and `text/html;charset=utf-8`, which the XSD refuses,
     and bounded the lengths, which no source does. RFC 2045's names are not bounded, so neither are these.

     This reading's stated limit is registration. RFC 2045's type is one it lists (`text`, `image`, `audio`, `video`,
     `application`, `message`, `multipart`), an `X-` name, or "An extension token defined by a standards-track RFC and
     registered with IANA", and its subtype is registered with IANA or an `X-` name. So `foo/bar` is a well-formed type
     that is not a valid one, and it is admitted. The cause is that IANA's media type registry is a dated external
     dataset that no pinned source holds. What would lift it is a closed relation of a pinned registry's types and
     subtypes, with each value split at its slash, as reading 129's limit would be lifted for language tags. The reading
     holds by the element's name, as reading 84 has every reading do: it reads the nine attributes on their own
     elements, whatever type governs them, and the XSD's type alone elsewhere, so a `qti-null` or an exit element that
     an `xsi:type` gives a `type` (24 governed rows in all), and a foreign element whose `xsi:type` names
     `MimeTypeDType` (reading 60), are judged by XML Schema's pattern only. No corpus package carries a MIME type this
     refuses, so no verdict moves. This restores the rule that the ruling of 2026-11-05 that attributes follow the XSD
     (reading 9) had removed; the operator's ruling of 2026-11-06 overrules that ruling wherever the information model
     is stricter. (Decided 2026-11-06 by RV seat X, on the review of PR #46, under the operator's standing ruling of
     2026-11-05 that the spec wins.)

136. **A `default` shape carries `coords`, as every shape does, and they are a `CoordsDType`.** The information model
     says of the Coords type "(e) default: no coordinates should be given" (section 7.9, and the Inside class's
     `coords`, section 5.75.2), and of the shape "The default shape refers to the entire area of the associated image"
     and "A value of a shape is always accompanied by coordinates" (section 8.29, ShapeEnum). It gives `coords` the
     multiplicity [1] on every class that has a shape: AssociableHotspot, HotspotChoice, Inside and AreaMapEntry
     (sections 5.7.6, 5.67.5, 5.75.2 and 7.4.2). The XSD declares `coords` required on `qti-associable-hotspot`,
     `qti-hotspot-choice`, `qti-inside` and `qti-area-map-entry`, and types it `CoordsDType`, whose pattern admits
     three, four, or an even number of six or more non-negative integers or percentages, whatever the shape. The
     sentence for `default` is a "should", and the information model says that "SHOULD/SHOULD NOT/RECOMMENDED statements
     constitute a best practice; ignoring a best practice does not violate conformance" (section 1.3). The multiplicity,
     the ShapeEnum sentence and the XSD are requirements, and all three require coordinates. Read as a requirement, the
     "should" would contradict them and leave no valid `default` area, since the XSD refuses an element without `coords`
     and the pattern refuses an empty value. So this follows the XSD and the information model's requirements, and reads
     the "should" as the best practice it states: a `default` hotspot, hotspot choice, inside test or area map entry
     carries `coords`, a `CoordsDType`, and one without `coords` is refused under `required-attribute`, as on main
     (`CoordsDefault` at 2b276d76 holds the `CoordsDType` pattern). What a `default` area's coordinates mean is reading
     59's: they are ignored, and the area is the whole image. `qti-media-interaction`'s `coords`, which no shape reads,
     stays optional, as the XSD declares it. This is no departure from the XSD, so the attribute grammar states nothing
     for it. (Decided 2026-11-06 by RV seat X, on the review of PR #46, under the operator's standing ruling of
     2026-11-05 that the spec wins.)
137. **An element's attributes and its namespace declarations are kept in the order they are written, the export
     writes each family back in that order, and no law reads either order.** XML 1.0 says "Note that the order of
     attribute specifications in a start-tag or empty-element tag is not significant" (section 3.1). The XML
     Information Set gives an element its [attributes], "An unordered set of attribute information items, one for
     each of the attributes (specified or defaulted from the DTD) of this element. Namespace declarations do not
     appear in this set", and its [namespace attributes], "An unordered set of attribute information items, one for
     each of the namespace declarations" (section 2.2). Canonical XML 1.0 imposes "Lexicographic order ... on the
     namespace declarations and attributes of each element" (section 1.1), every namespace node before every
     attribute node (section 2.2). So the order means nothing, and keeping it is fidelity alone: each attribute is
     stored at its slot among its element's attributes as written (`Attribute.at`), and each declaration at its slot
     among its element's declarations (`Namespace.at`); the export writes an element's declarations, in their order,
     then its attributes, in theirs. The one order not kept is the interleaving of the two families, which the
     Information Set holds as two properties: a declaration written after an attribute is exported before it, and
     Canonical XML, the equality the export promises, sorts both. No law reads either order: a package's verdict, the
     rule its refusal is named by and the breaches it is refused for are functions of each element's attributes and
     declarations as sets. Where several of an element's attributes have no representation, the codec refuses the
     first of them by namespace name and then local name, Canonical XML's keys, never the first written, so `<div
     foo="1" data-="x">` and `<div data-="x" foo="1">` are both refused under `unmodeled-vocabulary`, for `data-`.
     Main stored no order: its `AttributeLexical` was keyed by `(node, attribute)` (`2b276d76`). This binds pantry
     and plate alike. This is not a case of documents in conflict. (Operator ruling of 2026-11-06 that attribute and
     namespace-declaration order is kept as written, from RV seat AO.)

**R6-hexdouble** (a proposal for the operator; numbered at integration). A MathML `cn` of type `hexdouble` holds
exactly 16 hexadecimal digits, in either case, kept as written. The definition of the type is the 64-bit pattern of a
double, so 16 digits is what it means; the Recommendation's 8-digit example `7F800000` (the single-precision infinity
pattern) is an error in an informative example, and a shorter or longer string is refused. The definition's "0-9, A-F"
names the digit values and does not ban a spelling, hex case carries no meaning and the MathML schema puts no pattern
on `cn` text, so `a-f` is admitted and the source spelling is kept (section 4.2.1.2, Strict uses of `cn`, of MathML 3).
This binds pantry and plate alike. (The operator's ruling 346e70e2; 2026-11-06.)

**R6-head-qualifiers** (a proposal for the operator; numbered at integration). `degree`, `momentabout` and `logbase`
stand only beside an operator whose §4.4 syntax table lists them (`degree` beside `root` and `moment`, and, to refuse
none of the Recommendation's own examples, `diff` and `partialdiff`; `momentabout` beside `moment`; `logbase` beside
`log`); beside any head that is no built-in operator (`apply`, `ci`, `csymbol`, `fn`, `semantics`, `lambda`) nothing is
judged; `BvarQ` and `DomainQ` are the RelaxNG's on every `apply`. This binds pantry and plate alike.

**Element attributes follow the Schematron's per-element lists.** On an element the Schematron's extension-attribute
lists cover, an attribute its XSD does not declare is a `data-` attribute or the document is refused, as readings 9 and
90 state: the Schematron is normative. Where the XSD's attribute wildcard admits an attribute the lists do not,
readings 16 and 17 take the stricter normative source. This binds pantry and plate alike. (Label R15-j; proposed in
phase 15, 2026-11-06, for the operator; decision 327.)

**A braced `pattern` that names no declared variable is a string value, stored as written.** The information model
says of `StringOrVariableRef` that "if a string attribute appears to be a reference to a template or outcome variable
but there is no variable with the given name it should be treated simply as string value" (section 2.7.2, line 9106 of
`~/.cache/gr8des/qti3-text/info.txt`; section 9.3.4 says it again, line 74267; identical in 3.0.1). A `qti-pattern-match`'s
`pattern` is the one attribute of that type, so a `pattern` written `{name}` where no variable of that name is declared
is a string value, not a reference: pantry stores it as written and does not check it as a regular expression (reading
58's brace rule is not applied to a value treated as a string), and what delivery matches against it is plate's. A name
that matches a declared variable of the wrong kind or base type, one that is no template or outcome variable of base
type string and single cardinality, is still refused (P24), as a name that resolves more than one way in a test is.
This binds pantry and plate alike. (Label R15-k; proposed in phase 15, 2026-11-06, for the operator; decision 331.)

**A template element or a choice names a template variable of base type identifier, of single or multiple
cardinality.** The information model says of the template identifier of a template block (section 5.145.1), a template
inline (section 5.155.1), their rubric forms (sections 5.122.1 and 5.124.1) and the two hotspots (sections 5.67.2 and
5.7.2): "The identifier of a template variable that must have a base-type of identifier and be of either single or
multiple cardinality"; and of the other seven choices (sections 5.132.3, 5.131.3, 5.73.3, 5.65.2, 5.55.2, 5.56.2 and
5.58.2) the same rule, written "be either single of multiple cardinality". Pantry therefore refuses a template
identifier that names a template variable of another base type or of record or ordered cardinality, under "Template
variable type", beside "Template reference", which refuses a name that is no template variable. The type binds whatever
`show-hide` says or defaults to. A portable custom interaction's `qti-template-variable` (section 7.38.1: "the
identifier of a template variable defined in the item whose value should be passed to the PCI module on
initialization") states no type and may name any template variable, and a test's template default (section 5.152.1) is
"Template default type"'s. This is stated, and is not a case of documents in conflict. This binds pantry and plate
alike. (Label R15-l; proposed in phase 15, 2026-11-07, for the operator; decision 383; the law `Template variable type`.)

R9-a. **The catalog sentences of the information model hold as written.** A catalog holds one card per support ("Use
only one card for any particular named support in a catalog", section 5.26.1); a card holds at most one entry with
`default` true ("Only one of the CardEntry instances can have a default designation", section 5.27.2); and a
`data-catalog-idref` names a `qti-catalog` of its own document (section 5.28.1, "The unique identifier used to locate
the catalog from a data-catalog-idref"; section 5.15.9, "The associated 'catalog' MUST be supplied in the same
'assessmentItem' definition"). The XSD states none of them. `support` is compared by its collapsed value; `default`
designates where its collapsed value is `true` or `1`. This is not a case of documents in conflict; it has the same
shape as reading 92. (A proposal for the operator; numbered at integration.)

R9-b. **Card files and resource icons are file references.** Reading 103's census reads attributes; section 6.6
(CardSelection: "these files MUST be contained in the corresponding QTI content package") and section 5.80.4
(`qti-resource-icon`: "This file MUST be contained within the correponding QTI content package") name two element-text
references. A `qti-file-href` of a card or card entry, and a `qti-resource-icon`, are read as reading 102 reads an href
and join the census. The ItemFileInfo `qti-file-href` of a calculator or digital material is left out (section 5.80.3
says only "available at the location identified by a URI"). This amends reading 103 or stands beside it, as the operator
prefers. (A proposal for the operator; numbered at integration.)

R9-c. **R26 counts the metadata binding's elements, and catalog content is not among them.** The binding's section
2.7.1.3 names "the associated assessmentItem, test or object bank and its 'bodyElements'". A catalog is dormant
alternative content outside the body (section 5.28: "A container of content or resource references that is outside the
content body node"), so the `xml:lang` of a `qti-card`, a `qti-card-entry`, a `qti-html-content` and everything they
hold is not counted. This is decision 85's reading, restated on the new model. (A proposal for the operator; numbered
at integration.)

R10-a. **A PCI names its module by `module`, by `qti-interaction-modules`, or by both.** The information model's
section 5.106.2 (`module`, in both versions) says "If this characteristic is provided the qti-interaction-modules child
attribute is not required, if omitted then the modules child element is mandatory." The XSD makes both optional; this
follows the information model. (A proposal for the operator; numbered at integration.)

R10-b. **A 3.0.0 document holds no `qti-custom-interaction`; a 3.0.1 document may.** The 3.0.0 information model's
section 5.106 says "PCIs MUST be used instead of custom interactions (the latter have been deprecated)"; the 3.0.1 text
drops the sentence. Both XSDs declare the element; this follows the information model of each version. (A proposal for
the operator, only if goal 3.14 stays; numbered at integration.)

**R7-a** (a proposal for the operator; numbered at integration). **A `data-ssml` value, on an element that declares the
attribute, is one JSON object that Data-SSML 1.0's normative JSON Schema admits, judged as written; the importer checks
it, and the database stores it as text and does not re-prove its form.** QTI's information model types `data-ssml` as a
String, "the container for the equivalent JSON value that is to be passed to the SSML processor" (section 5.20.10), and
its implementation guide names the 1EdTech Data-SSML document as the definition of that JSON. That document's JSON
Schema (section 3.4) is normative, and validation is required (section 3.1's MUST over section 1.3's SHOULD). So the
value is one JSON text (RFC 8259) holding one object (the schema's root, over the prose's "one or more JSON objects")
whose members are among `break`, `phoneme`, `prosody`, `say-as` and `sub`, each an object holding only the properties the
schema lists for it (`strength` and `time`; `ph`, `alphabet` and `type`; `rate`; `interpret-as`; `alias`), each property
a string, with `ph`, `interpret-as` and `alias` present, and `strength`, `alphabet`, `type` and `interpret-as` one of the
schema's values. `time` and `rate` are any normalized string (OAS3, Appendix C and the information model's `RateUnion`,
over OAS2 and the prose's percentage), so no tab, line feed or carriage return in their decoded value. Names and values
are compared after JSON's escapes are decoded, so `"break"` is `break`. A name written twice in one object is
accepted, since RFC 8259 section 4 says only that names "SHOULD be unique", and each of its values is judged. On an
element that does not declare `data-ssml`, it is a custom `data-*` attribute (readings 13 and 90). The value is kept as
written, with no length bound.

Where the check lives: pantry's importer parses the value as JSON and judges it against the schema's tables
(`src/vocab/data-ssml.ts`), and refuses a package that holds a value the schema does not admit under
`attribute-lexical`, the rule of a value its domain refuses. The law oracle judges the same value with a reader of
its own (`src/test/oracle-laws/data-ssml.ts`), written from the schema apart from the importer's, which the purity guard
keeps it from reading, so the two judges are independent. The attribute's value domain in the database stays
`xs:string`. Writing the language as the domain's pattern was tried and does not fit: one pattern for it needs about
4,400 positions where grizzle admits 4,096 (`regexMaxPositions`), and splitting it into chained pattern steps makes a
product of about 35,791, past pantry's `productPositions` of 4,096 (`docs/grizzle-findings.md`, the row for the pattern
size). Dropping any JSON spelling of a name or value to make it fit would refuse valid content, which decision 321
forbids. So a ChangeSet written without the importer could store a `data-ssml` the schema refuses: that is this
reading's stated limit, the same shape as the `xsi:type` and SSML `role` values the codec checks and no law over the
stored rows holds. This binds pantry and plate alike as to what is valid; where it is checked is pantry's. (Decision
351; 2026-11-06. Amended 2026-11-07 by the Mind on audit b61b8f14's C2: the oracle's own reader.)

138. **An entry path that holds a backslash or begins with a drive prefix is refused under `href-path`, in a zip and in
     a directory alike.** The ZIP format's file name field says "The path stored MUST NOT contain a drive or device
     letter, or a leading slash. All slashes MUST be forward slashes '/'", rather than backslashes (PKWARE APPNOTE
     6.3.10, section 4.4.17.1). A manifest's `href` is an RFC 3986 URI reference: its grammar has no `\` (section 2),
     and a reference that begins `C:` parses as one whose scheme is `C` (section 3.1), so neither names an entry of the
     package. A zip and a directory are read alike: one rule refuses both forms in either, with the reason it gives, and
     the import names it `href-path`, as it names every entry path outside the package. This binds pantry and plate
     alike. (Decided 2026-11-07 by the coordinator, ruling P-7, under the operator's standing ruling of 2026-11-05, from
     RV seat REP-B (`5502d569`): the zip reader refused both forms, and the directory reader read a `\` as a character
     of a file name and a drive prefix as the start of a relative path, so one package was read two ways by its form.)
139. **A package zip's central directory ends where its end record begins: other bytes between them are refused under
     `zip-format`.** APPNOTE 6.3.10 lays a zip out as its local headers and data, then the central directory, then the
     ZIP64 end of central directory record and locator, then the end of central directory record (section 4.3.6), and
     the end record's "size of the central directory" is "The size (in bytes) of the entire central directory" beside
     its "Offset of the start of the central directory" (sections 4.4.23 and 4.4.24). So the directory's offset and size
     name the end record's own offset, and only the ZIP64 records, which pantry does not read and refuses as such, may
     stand there. An archive with any other bytes there is no zip, and its central directory does not parse where its
     offsets say; Python's `zipfile` and Info-ZIP's `unzip` both refuse or repair it. Content Packaging 1.2 names no zip
     format of its own: "Physical encapsulation shall be as a compressed binary file conforming to RFC1951" (section
     6.3, condition a), so the container's form is APPNOTE's. Refusing a malformed container is no refusal of valid QTI:
     reading 1 protects valid content, and these bytes make the file no valid package interchange file. This binds
     pantry and plate alike. (Decided 2026-11-07 by the coordinator, on GEN-B/zip's finding, under the operator's
     standing ruling of 2026-11-05, from RV seat REP-B (`8558cbaa`, its comments renumbered in `bcafe951`).)
140. **A reader refuses where the infoset the specification defines is undetermined.** crust checks no DTD validity in
     general, since QTI validity is XSD validity, but a default that references a general entity the internal subset
     declares only after the attribute-list declaration is refused everywhere:
     - In WFC Entity Declared's scope, the document is not well-formed. That scope is a document with no DTD, one whose
       internal subset references no parameter entity, or one with `standalone='yes'`. XML 1.0 (Fifth Edition) section
       4.1 says: "The declaration of a general entity MUST precede any reference to it which appears in a default value
       in an attribute-list declaration."
     - Outside that scope, the same rule is VC Entity Declared ("the declaration of a general entity MUST precede any
       attribute-list declaration containing a default value with a direct or indirect reference to that general
       entity"), so the document is not valid.
     - There, too, the default's value is undetermined. A reader taking the subset in order has not seen the entity at
       the attribute-list declaration, and neither section 4.4 nor 5.1 fixes what a reader that does not validate
       supplies. libxml2 2.9.13 supplies the empty string.
     - Refusing is the one choice that neither invents an infoset nor follows one implementation. Reading 1 ("Content
       that is not valid is refused") covers it.
     - The same scope decides an undeclared reference elsewhere: refused inside the WFC's scope, kept as an unexpanded
       reference outside it. A parameter-entity reference in the internal subset takes a document out of the scope, as
       an external subset does.

     This binds pantry and plate alike. (Decided 2026-11-07 by the coordinator, under the operator's standing ruling of
     2026-11-05, from RV seat GEN-B/codec (`3fe6a888`, `bb71b197`; its guard `2e4d053b`).)

141. **A document's encoding is the row of XML 1.0 Appendix F.1 its first bytes are in, and the label it is read as must
     name an encoding of that row: UTF-16 with a byte order mark is `UTF-16` alone, UTF-16 without one is `UTF-16BE` or
     `UTF-16LE` in its own order, and the writer gives each scheme the opening it is read by.** XML 1.0 (Fifth Edition)
     section 4.3.3 says "it is a fatal error for an entity including an encoding declaration to be presented to the XML
     processor in an encoding other than that named in the declaration, or for an entity which begins with neither a
     Byte Order Mark nor an encoding declaration to use an encoding other than UTF-8", and Appendix F.1's note says that
     where the opening bytes settle the encoding "section 4.3.3 still requires that the encoding declaration, if
     present, be read and that the encoding name be checked to match the actual encoding of the entity". Section 4.3.3
     also says "The terms "UTF-8" and "UTF-16" in this specification do not apply to related character encodings,
     including but not limited to UTF-16BE, UTF-16LE", and "Entities encoded in UTF-16 MUST ... begin with the Byte
     Order Mark". Unicode 16.0 section 3.10 says "In UTF-16BE, an initial byte sequence <FE FF> is interpreted as U+FEFF
     ZERO WIDTH NO-BREAK SPACE" (D96), and likewise `<FF FE>` in UTF-16LE (D97); RFC 2781 says "Systems labelling
     UTF-16BE text MUST NOT prepend a BOM to the text", and likewise UTF-16LE (section 3.3), and that "The detection of
     an initial BOM does not affect de-serialization of text labelled as UTF-16BE" (sections 4.1 and 4.2). So `FE FF` or
     `FF FE` (not followed by `00 00`, the table's `##` rule) is UTF-16 and reads only under the label `UTF-16` or none;
     `EF BB BF` is UTF-8 and reads only under `UTF-8` or none; `00 3C 00 3F` and `3C 00 3F 00` are UTF-16BE and UTF-16LE
     and read only under that label, so `UTF-16`, which must open with a mark, the other order, and no encoding
     declaration at all (which makes the document UTF-8) are each refused; anything else writes ASCII as single bytes
     and reads under any label but a UTF-16 one, `UTF-8` when it names none. UCS-4 in its four orders, with a mark or
     without, and EBCDIC are encodings crust's reader "is unable to process", a fatal error of section 4.3.3. A label
     the bytes rule out is refused under crust's rule `encoding-mismatch` (`decode.ts`), which replaces the narrower
     `bare-utf16`. The declaration is read in the row's code units however far its white space runs ([3] S bounds none),
     so no declaration is unread for its length. crust's writer gives `UTF-16` the mark `FF FE` and little-endian units,
     and `UTF-16LE` and `UTF-16BE` no mark (`encode.ts`), so every document it writes in its own label reads back under
     that label. libxml2 2.9.13's `xmllint` reads a UTF-16 mark under `UTF-16LE` or `UTF-16BE`, and unmarked UTF-16
     under `UTF-8` or with no encoding declaration, in the encoding its first bytes say, and a UTF-8 mark under
     `ISO-8859-1` in the declared label, so `é` reads as `Ã©`; it exits 0 for each, and this reading refuses each, so
     its verdict is not this reading's. The 1EdTech example corpus holds no document with a mark or in UTF-16, and of
     the QTI 3.0 schema set only `w3/XInclude.xsd` opens with one (`FF FE`, no declaration), which reads as `UTF-16` as
     before. This binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-07 by the
     coordinator, under the operator's standing ruling of 2026-11-05, from RV seat CRUST (`23329950`), on GEN-B/codec's
     findings N3 and N4.)
142. **crust's reader holds a namespace declaration's normalized value to RFC 3986's `URI-reference` in an XML 1.0
     document and to RFC 3987's `IRI-reference` in an XML 1.1 one, and an XML 1.1 document is one whose version is
     `1.1`.** Reading 131 holds pantry and plate to Namespaces in XML 1.0 (Third Edition) section 3, "The attribute's
     normalized value MUST be either a URI reference — the namespace name identifying the namespace — or an empty
     string", with section 2.1's "An XML namespace is identified by a URI reference [RFC3986]"; crust's reader now
     refuses such a declaration itself, as a well-formedness error, so neither reader of the codec sees a namespace name
     outside the grammar, and pantry's `NamespaceUri` pattern takes its source from crust's (`@qti-pie/crust/uri.ts`),
     byte for byte the pattern it held. Namespaces in XML 1.0 says "This specification applies to XML 1.0 documents" and
     Namespaces in XML 1.1 (Second Edition) "applies to XML 1.1 documents" (each section 7), and the latter's section 3
     asks "either an IRI reference ... or an empty string" (RFC 3987 section 2.2, which widens `unreserved` by `ucschar`
     and `query` by `iprivate` and changes nothing else). XML 1.1's [26] VersionNum is `1.1` alone, and XML 1.0 section
     2.8 has an XML 1.0 processor read a document that "specifies a 1.x version number other than '1.0'" as a 1.0
     document; so a document declaring `1.1` is held to Namespaces 1.1, IRIs and prefix undeclaring included, and every
     other one, one declaring no version or `1.5` among them, to Namespaces 1.0. The value is the one attribute-value
     normalization leaves: "replacement of XML character and entity references has already been done before any
     comparison" (Namespaces 1.0 section 2.3), so `xmlns:p="&#x20;"` holds a space, which no URI reference holds, and is
     refused as no URI reference, not as the empty value an undeclaration would be; a literal tab becomes a space and is
     refused the same way. A value that keeps a reference to an entity only an unread external subset may declare names
     a namespace no reader knows (XML 1.0 section 4.4.3); crust does not judge its grammar, and pantry refuses it under
     `namespace-entity`. libxml2 2.9.13's `xmllint` reports `namespace error : xmlns:p: '…' is not a valid URI` for
     `&#x20;`, `&#x20;urn:x`, `a b`, `%zz`, `urn:a#b#c`, `&quot;`, `urn:é`, `&#9;` and `http://[bad` alike, as this
     reading refuses them; with `--noout` it reports nothing for `&#38;f;http://x`, whose first segment holds a colon
     (RFC 3986 section 4.2), which this reading refuses, and only `--c14n` refuses it. This binds pantry and plate
     alike, which read through crust. This is not a case of documents in conflict. (Decided 2026-11-07 by the
     coordinator, under the operator's standing ruling of 2026-11-05, from RV seat CRUST (`daed3e96`), on GEN-B/codec's
     finding N2.)

143. **An interaction is banned at any depth of a template block, and in a template inline only as its own content model
     bans it, so the four inline interactions are admitted inside a template inline's HTML.** The information model says
     "A qti-template-block must not contain any interactions, either directly or indirectly" (section 5.145,
     TemplateBlock, in both versions). That is stricter than its own class tables and the XSD, which reach the four
     inline interactions through the HTML of a template block's content body (sections 5.147, 6.10, 6.14 and 5.64
     HTMLText, whose children are inlineGroup, section 6.26; the XSD's HTMLTextDType), so the stricter source is the
     rule (readings 16 and 17). The information model states no such rule of a template inline (section 5.155). Its own
     content, InlineStaticGroup (section 6.27), holds no interaction, and neither does the XSD's TemplateInlineDType, so
     the content model refuses an interaction as its child. Its HTML, span and its kin of HTMLText (section 6.25), holds
     inlineGroup's four interactions, which are admitted there. So the grammar's `tmpl` ancestry flag, which carries the
     ban, is entered under the template block and its rubric variant alone (`templateBlockKinds`), and every other
     template facet still reads all four template kinds. Lane GEN-B's XSD search found the grammar refusing an XSD-valid
     interaction inside a template inline's span. This is a case of documents in conflict: the information model's prose
     against its tables and the XSD, for the template block. (Decided 2026-11-07 by the coordinator, under the
     operator's standing ruling of 2026-11-05, from seat FIX-TMPL, on lane VD's ruling.)

144. **A bounded `xs:double` is judged on its IEEE value: a `NonNegativeDoubleDType` value is not below 0, and a
     `normal-maximum` is above 0, each as XML Schema's value bound states it, held by a typed value beside the lexical
     form.** Both QTI 3.0 XSDs derive `NonNegativeDoubleDType` from `xs:double` by `<xs:minInclusive value="0.0" />`
     (`imsqti_asiv3p0_v1p0.xsd` lines 24034 to 24038, `imsqti_asiv3p0p1_v1p0.xsd` lines 24120 to 24124). They type with
     it `qti-time-limits`' `min-time` and `max-time`, the slider interaction's `lower-bound`, `upper-bound` and `step`,
     and the outcome declaration's `normal-maximum` (v3p0 lines 34627, 34628, 31838 to 31840 and 29988; v3p0p1 lines
     34861, 34862, 31988 to 31990 and 30136), and an `xsi:type` may give the type to a foreign element's text. The
     information model types each as NonNegativeDouble, "the data-type for numbers that are of the data-type 'double'
     but must not be negative i.e. the minimum value is 0.0" (sections 7.26, 7.40.1 and 5.134.3). Of `normal-maximum`
     it says further "it must be a positive value" (section 4.5.7), the stricter source, which reading 16 follows over
     the XSD's `minInclusive`. A bound judges the value, and a literal's value is its IEEE double, rounded to nearest
     (XML Schema 1.1 Part 2 §3.3.5.2, doubleLexicalMap), a magnitude below 2^-1075 rounding to a zero of its sign; -0
     equals 0. So `-0` and `-1e-400` meet `minInclusive 0.0`, `1e-400` and `-0` fail reading 16's `minExclusive 0`,
     `4.9e-324` meets both, and `-1`, `-INF` and `NaN` (which meets no bound) are refused under `attribute-lexical`.
     Whether a literal clears a bound turns on that rounding, which no regular language decides, so the domain's
     pattern states the lexical space alone, XML Schema 1.0's (reading 71's edition, in which `+INF` is outside it)
     less `NaN`, since a datatype's lexical space is "the prescribed set of strings which the lexical mapping for that
     datatype maps to values of that datatype" (XML Schema 1.1 Part 2 §2.3) and NaN meets no bound, so it is no value
     of the bounded type; the value is a row of its own: the import reads the double once from the lexical form or the
     text (`DoubleValue`, `TextDoubleValue`), where the form is in the lexical space, and the bound is a check on that
     value (`Double bound`), read from the domain's `DoubleBound`. grizzle stores a `float8` with one zero, `-0` as 0,
     which no bound tells apart. G1-2 found the database accepting `min-time="-1"`, `step="-1"` and
     `normal-maximum="0"` while the law oracle refused them: the bound had been an unread `facets` column. (Decided
     2026-11-07 by the coordinator, under the operator's standing ruling of 2026-11-05, from seat FIX-G12.)
145. **A fragment a test or a section document splices is judged in the test that places it, once per placement: its
     content references name the test's variables, and a rule fragment's variable references are the test's own.**
     Reading 117 reads an included fragment as XInclude's result holds it, "in the context of the item in which it is
     being included" (information model section 2.12), and a section document's references resolve once for each test
     that places it (reading 5). A fragment that a test's or a section document's include splices is read in that
     test's context the same way:
     - its feedback, template, printed-variable and context-variable references each name a variable the test declares,
       or one of its built-in variables, of a kind its element may name ("Feedback reference", "Feedback outcome type",
       "Template reference", "Printed variable reference" and "Context variable reference"), once per placement, as
       the section document's own content references do;
     - a rule fragment spliced into the test's outcome processing makes the test's variable references, each read as
       readings 48 and 88 read a test-level reference ("Prefixed reference"), an unprefixed one that resolves nowhere
       naming nothing ("Variable declared").

     A content reference names its variable whole, in a test as in an item, and never through a prefix: a printed
     variable's "outcome variable or template variable must have been defined" (section 7.30.6), a feedback element's
     outcome is "an outcome variable" (reading 77), and prefixing is the Variable expression's, by which "During
     outcomes processing, values taken from an individual item session can be looked up" (section 2.11.1.2). An item's references resolve in its
     own declarations, and no test places an item. This lifts reading 117's known under-refusal of the content
     references of a fragment a section document or a test places; that fragment's `xml:lang` forms, and a rule
     fragment's types and language, stay the under-refusals reading 117 lists. This binds pantry and plate alike. This
     is not a case of documents in conflict. (Decided 2026-11-07 by the coordinator, under the operator's standing
     ruling of 2026-11-05, from seat FIX-ASM.)

146. **The manifest is the package's one document at `imsmanifest.xml`, and no resource's: a document-typed resource
     whose `href` names it names no document of its type, and the manifest is read once.** IMS Content Packaging 1.2
     sets the manifest apart from the files it describes: "The InterchangePackage shall include a Manifest object and
     may include content files and control files", and a package interchange file "shall contain a single 1EdTech
     manifest document object at the root of the PIF. That object shall be bound as an XML document named
     imsmanifest.xml" (Information Model, Version 1.2 Public Draft v2.0, section 6.3, the InterchangePackage class).
     "Resource and File are used to reference content files and control files" (section 6.4.1, the Manifest class),
     and the manifest is neither: a content file embodies "the content described by the logical package" (section
     3.1.3), and a control file "governs the binding of the information model" (section 3.1.4), of which the manifest
     is the bound instance. QTI 3.0's profile says the same: "a single manifest called imsmanifest.xml MUST be present
     at the root of the content package", and "each resource is declared using a resource element which references a
     single separate XML instance file. All files in the Content Package other than the manifest must be referenced in
     a resource declaration" (implementation guide, sections 6.1 and 6.1.1). So the manifest is the one document of
     its path, of no resource type (`none`), and a path is one document, of one type (reading 93). A resource of a
     type `RootOfType` maps whose `href` names `imsmanifest.xml` names no document of its type, and "Document entry"
     (`entry-kind`) refuses it, as it refuses the href of a second type at a path a first type names. The manifest is
     never read again as that resource's document: the importer and the law oracle each read it once, as the
     manifest. A `cp:file` that names it is a locator "with no other implication as to the use of the resource so
     identified" (section 6.11.3, the Href class), and is admitted, as is the `href` of a resource of a type
     `RootOfType` does not map, which names no document (reading 93); no `cp:file` need list the manifest. A site
     whose href names the manifest names no document (readings 114 and 115), whatever resource names it. This sets
     aside the reading of the manifest as the document of each document-typed resource that named it, under which the
     importer and the oracle read it twice: the copy wrote the manifest overlays again, a second `ManifestId` of the
     package ("Manifest overlay"), broke "DocumentId key", "E1 derived" and `RootOfType`, and a site could target it.
     The corpus moves no verdict: no resource or file of any manifest of its 29 zips names `imsmanifest.xml`, by a
     scan of their 1,100 `resource` and `file` elements. This binds pantry and plate alike. This is not a case of
     documents in conflict. (Decided 2026-11-07 by the coordinator, under the operator's standing ruling of
     2026-11-05, from seat FIX-MANIFEST.)
147. **A test part, section, section ref, item ref or stimulus ref that writes no `identifier` names nothing: it holds
     no place in its document's namespace, and AL3 alone refuses it.** The ASI XSD requires the identifier of each,
     with no default: `<xs:attribute name="identifier" use="required" type="IdentifierDType" />` in `TestPartDType`,
     `AssessmentSectionDType`, `AssessmentSectionRefDType`, `AssessmentItemRefDType` and `AssessmentStimulusRefDType`
     (`imsqti_asiv3p0_v1p0.xsd`), and `IdentifierDType` restricts `xs:NCName`, so no identifier is empty. An element
     that writes none has no identifier, not the empty one: it shares no identifier with another element ("Structure
     identifier", "Test name key", "Stimulus ref key", reading 86), and no branch rule names it (reading 87). It has
     no `Named` or `StimulusRef` row, and the importer's laws that require one require it only of an element that
     writes its identifier; AL3 ("required-attribute") refuses the element under its own rule. A branch rule whose
     owner names nothing resolves from no source, and "Branch target" refuses it beside AL3, as the law oracle refuses
     a rule whose owner it holds no name for. This sets aside the reading of an unwritten identifier as the empty one:
     the importer's, under which "Test overlay"'s copy of the identifier broke beside AL3, and the law oracle's
     (`testDocumentOf`'s empty default, `src/test/oracle-laws/assembly.ts`), under which two such elements of one
     document broke "Structure identifier". This binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-07
     by the coordinator, under the operator's standing ruling of 2026-11-05, from seat FB-TESTS.)
148. **An assessment item or test that writes no `identifier` or no `title` has none for its LOM record to match: no
     entry or title string names it, the empty one included, and AL3 refuses the root while `lom-identifier` or
     `lom-title` refuses a record that lists an entry or a title.** The ASI XSD requires both, with no default:
     `<xs:attribute name="identifier" use="required" type="IdentifierDType" />` and `<xs:attribute name="title"
     use="required" type="xs:normalizedString" />` in `AssessmentItemDType` and `AssessmentTestDType`
     (`imsqti_asiv3p0_v1p0.xsd`). QTI 3.0 Metadata §2.7.1.1 asks that "One of the values given for the identifier must
     have an entry that matches the identifier of the associated item, test or object bank", and §2.7.1.2 that "The
     title must have a value that matches the value of the title attribute of the associated item, test or object
     bank". A root that writes no `identifier` or `title` has no value to match, not the empty one, so an empty
     `lom:entry` or `lom:string` matches nothing (reading 62). The importer holds each attribute as a row of its own
     (`ObjectIdentifier`, `ObjectTitle`, `src/qti/metadata.ts`) beside the root's `AssessmentObject`, which every item
     and test root has, and a record none of whose entries or strings names its document writes no witness row, so
     the law's existence refuses it under its own name. This sets aside the reading of an unwritten identifier or title
     as the empty one: the importer's, under which a root missing either had no `AssessmentObject`, so "E1 derived"
     broke beside AL3 and an empty entry matched an unwritten identifier; and the law oracle's (`lomTitleLawsOf`'s
     empty default, `src/test/oracle-laws/documents.ts`), under which an empty title string matched an unwritten
     title. This binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-07 by the
     coordinator, under the operator's standing ruling of 2026-11-05, from seat FB-META.)
149. **An outcome declaration's `normal-minimum` is 0.0 where a QTI 3.0.1 document writes none, and has no value where a
     QTI 3.0 document writes none, so `Mastery range` judges a 3.0.1 mastery value against 0.0.** QTI 3.0.1's
     information model gives the characteristic a default: its value space reads "See Appendix A1.3. Default =
     "0.0".", and its description "It is set to 0 by default" (section 4.5.8, Table 4.5.8). Its ASI XSD agrees:
     `<xs:attribute name="normal-minimum" use="optional" default="0.0" type="xs:double" />`
     (`imsqti_asiv3p0p1_v1p0.xsd` line 30137). QTI 3.0's states none: its value space is "See Appendix A1.3." alone,
     its description "The normalMinimum characteristic optionally defines the minimum value of numeric outcome
     variables, it may be negative" (section 4.5.8), and its XSD declares `<xs:attribute name="normal-minimum"
     use="optional" type="xs:double" />` (`imsqti_asiv3p0_v1p0.xsd` line 29989). Neither version gives
     `normal-maximum` or `mastery-value` a default: each table states none, and each XSD declares both
     `use="optional"` with no `default` (3.0.0 lines 29988 and 29990, 3.0.1 lines 30136 and 30138). The versions
     differ, so each follows its own document; within each, the information model and the XSD agree, so neither is
     the stricter. A 3.0.1 outcome declaration that writes a `mastery-value` and no `normal-minimum` has 0.0 as the
     floor of its normal range, and the Schematron's RULE SPECIFIC CLASS OUTCOMEDEC 1, "The mastery-value attribute
     value must not be less than the normal-minimum value" (reading 9), judges it: `mastery-value="-1"` with no
     `normal-minimum` is refused under `mastery-range` in 3.0.1 and admitted in 3.0.0. No source orders
     `normal-minimum` against `normal-maximum`, so the default reaches no other law. The importer writes a
     `NormalMinimum` row for every 3.0.1 outcome declaration that has a row, the form it writes or else the
     inventory leaf's default (`normalMinimumDefaults`, `src/qti/declarations.ts`), with whether it is written, and
     `E1_derived` holds one not written to its version's default; `MasteryFloor` is written where the declaration has
     a normal minimum and a mastery value. The law oracle states the default in its own words
     (`normalMinimumByDefault`, `src/test/oracle-laws/documents.ts`). This sets aside, for the floor in 3.0.1, the law
     catalog's reading of reading 9, "each pair judged where both are written", under which the importer and the law
     oracle admitted a 3.0.1 mastery value below its default floor. The corpus moves no verdict: no document of its 29
     zips writes a `mastery-value`. This binds pantry and plate alike: a 3.0.1 outcome that writes no
     `normal-minimum` has 0.0 wherever its minimum is read. This is not a case of documents in conflict. (Decided
     2026-11-07 by the coordinator, under the operator's standing ruling of 2026-11-05, from seat FIX-NORMALMIN.)
150. **An item's built-in `duration` may be read whether or not the item is time dependent.** The one sentence that bars
     it, "The value of duration for items that are not time dependent must not be used in any item or test-level
     expression, though systems should still report it in itemResults when it is known" (section 2.2.2.2, `info.txt`
     line 8468), stands in section 2, Key Data Model Features, which the information model marks "This Section is NOT
     NORMATIVE" (`info.txt` line 8350). So it states no requirement, as reading 26 reads section 2.8's sentence on a
     section's parts. The normative sources require and type the attribute and say nothing of the expressions that read
     `duration`: the information model's `time-dependent` "Denotes if the Item must be answered within some defined time
     limit", a Boolean of multiplicity [1] (section 4.1.8, `info.txt` line 10273), and the XSD declares `<xs:attribute
     name="time-dependent" use="required" type="xs:boolean" />` (`AssessmentItemDType`, `imsqti_asiv3p0_v1p0.xsd`). So
     no law reads an item's `time-dependent`: its `duration`, read in the item or through an item ref (reading 106), is
     a single float (reading 29) whatever the attribute says, and `time-dependent` stays an attribute the grammar admits
     by the XSD and AL3 requires. This sets aside the "Item duration" law (the UP audit's A62), under which a read of
     the `duration` of an item that is not time dependent was refused: the importer's, which contained each such read,
     in the item and through an item ref, in the time-dependent items' `ItemTiming` rows, and the law oracle's, which
     judged a read in the item. This binds pantry and plate alike. This is not a case of documents in conflict: the
     normative sources agree. The earlier rule was upstream's, so the change is recorded in PR #46's decisions. (Decided
     2026-11-07 by the coordinator, under the operator's standing ruling of 2026-11-05, from seat FIX-A1.)
151. **An item's `xml:lang` outside its value domain states no language, so `lom-title` judges the record's title
     without one, beside AL1.** QTI 3.0 Metadata says "The title must have a value that matches the value of the
     title attribute of the associated item, test or object bank. The language used to interpret the title is taken
     from the language attribute of the associated item, test or object bank" (section 2.7.1.2). Reading 62 reads a
     root that states no `xml:lang` as admitting a string in any language. An item's `xml:lang` is a BCP 47 tag and
     never empty (reading 129), and a form outside that domain names no language. Of the empty value, XML 1.0 says
     "it is considered that there is no language information available, just as if xml:lang had not been
     specified" (section 2.12). A form RFC 5646's ABNF does not produce is no language tag (sections 2.1 and 2.2.9),
     so it identifies no language either. Such a form states no language, and `lom-title` reads the item as it reads
     one that writes none: a string with the title's value names the document, whatever its `language`. That holds
     for the empty form, one of whitespace alone and an ill-formed tag such as `en_GB`. AL1 (`attribute-lexical`)
     refuses the attribute under its own rule, and `lom-title` refuses a record none of whose strings holds the
     title, as reading 148 has AL3 and `lom-title` each refuse under its own. This reading is exact on the unknown
     language: no record is refused that some tag the item could have written would admit, and a record with no
     string holding the title is refused under every such tag. It sets aside two readings. The law oracle's
     (`typedOr`'s none, `lomTitleLawsOf`, `src/test/oracle-laws/documents.ts`) did not judge `lom-title` where the
     `xml:lang` lay outside its domain, so a record titled otherwise passed beside AL1. The importer's compared an
     ill-formed tag as written (`LomObjectTitle`'s check, `src/qti/metadata.ts`), so a string in `en` failed against
     `xml:lang="en_GB"`, a breach no tag the item could have written gives. The importer now reads the compared
     form as a language only where it matches the tag pattern (`languageTagPattern`); the law oracle reads the
     attribute through its own AL1 reading (`typedValueOf`). It reads `lom-title` alone: `document-lang`'s reading of
     the same attribute is reading 134's. This binds pantry and plate alike. This is not a case of documents in
     conflict. (Decided 2026-11-07 by the coordinator, under the operator's standing ruling of 2026-11-05, from seat
     FIX-LOMLANG.)
152. **A value names something only where it is an NCName: a variable reference's, an interaction's binding, a
     declaration's `identifier`, a record field's `field-identifier`, a test part's, section's, section ref's or item
     ref's `identifier` and a `cp:dependency`'s `identifierref`. Any other value names nothing: no row holds it as a
     name, and its value domain alone refuses it.** The ASI XSD types each such attribute `IdentifierDType`,
     which restricts `xs:NCName` (`imsqti_asiv3p0_v1p0.xsd`), or, in a literal-or-reference union, holds the
     variable by its `VariableStringDType` member, an `xs:NCName` too (a printed variable's `base` and `index`, a
     random integer's `min` and `max`, a rounding's `figures`), or by `EncVariableStringDType`, an NCName between
     braces. IMS Content Packaging 1.2's binding types a `cp:dependency`'s `identifierref` `xs:IDREF`, which restricts
     `xs:NCName` (`imsqtiv3p0_imscpv1p2_v1p0.xsd`). A form outside a type's lexical space denotes no value of it (XML
     Schema Part 2, §2.3), so `""`, a form of whitespace alone, `1a`, `a b`, or a name only XML 1.0's fifth edition
     admits, such as one that starts with ARABIC-INDIC DIGIT ZERO, which the `Letter` tables `\i` and `\c` read (XML
     Schema Part 2, Appendix F) hold as a digit, names no variable, declaration, field, test structure or resource. It
     shares no name with another, no reference resolves to it, and the law a reference, a binding or a name is held to
     does not judge it; the attribute's value domain refuses it under its own rule. The grammar states the NCName once
     (`ncNamePattern`, `src/grammar/domains.ts`), and the schema's sources and the importer's readers each read it.
     This sets aside the importer's reading of any string as a name: a content reference or a binding by its
     collapsed value, so `template-identifier=""` was a template reference no declaration held, a declaration's or a
     field's identifier by any form not whitespace alone, and a processing reference by the fifth edition's names. Its
     rows broke the reference's law, "Binding declared", "Variable declared" or "E1 derived" beside the value domain
     the law oracle alone raised (`referenced`, `typedValueOf`, `src/test/oracle.ts`). A declaration whose identifier
     names nothing has no `Declaration` row, so "Declaration overlay"'s copies of its cardinality and base type, which
     ask a row of every declaration, still break beside its value domain, as they did for an empty identifier
     before; that wants the declaration's name as a row of its own, as `RecordFieldName` is a field's. This
     binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-07 by the
     coordinator, under the operator's standing ruling of 2026-11-05, from seat FIX-NCNAME.) (Amended 2026-11-09,
     decision 457 (2).)
153. **A record has no base type, so no value stands for one: a law about a record's whole value judges its cardinality,
     and a law over a base type reads the declaration's own, where it writes one.** The information model says
     "Variables with record cardinality have no base-type" (tables 4.5.3, 5.34.3, 5.115.3 and 5.151.3,
     https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_base-type), and of a value
     "The base-type is defined by the 'base-type' attribute of the declaration except in the case of variables with
     record cardinality" (section 7.46). So a record's value is a field, read in its own base type, never in its
     declaration's, even where a record writes one, which Declaration base type refuses. A mapping is of no record
     (reading 78: its map response "cannot be applied to variables of record cardinality", section 2.11.1.5); an area
     mapping maps "a source set of point values" (section 5.5); a feedback element's outcome is "of either single or
     multiple cardinality" (section 5.49.1); a string identifier's variable is "of base-type string" (section 5.48.2);
     and SCORE, MAXSCORE and PASSED are typed (section 2.2.2.3): each refuses a record by its cardinality, as the
     specification states it, and judges any other variable's base type where it has one. A variable that is no
     record and writes no base type is refused by Declaration base type alone, never by a law over a type it does not
     have (the orchestrator's ruling of 2026-11-06: one cause is refused under one rule), and an expression reads its
     type as `unknown`. A declaration's base type is a row of its own (`DeclarationBaseType`), every row that names a
     declaration copies only its count of them, and each row that reads one copies it from that row, so only where it
     is. This sets aside the importer's reading of a record's base type as `none`, a code no lexical form spells,
     which every row that named a declaration copied (lane NIL's audit, B12), under which a record's mapping was
     refused as a base type `MappableBaseType` does not hold and a record's values were read in `none`, every text;
     and the law oracle's reading of an unwritten base type as empty or `none`, under which it refused a single
     variable that writes none under each law over a type, read a single variable's values in their own base type,
     and a record's in its declaration's. This binds pantry and plate alike. This is not a case of documents in
     conflict. (Decided 2026-11-07 by the coordinator, under the operator's standing ruling of 2026-11-05, from seat
     FIX-B12.)
154. **A float mapping's map keys are compared by the doubles reading 144 maps them to, and every key in the float
     domain has one: `1e400`, `2e400` and `INF` repeat, as do `0`, `-0` and `1e-400`, and two `NaN`s.** Reading 98
     makes a mapping's keys distinct as values of its base type, a float's as the double it names, and reading 144
     settles that double: XML Schema 1.1's doubleLexicalMap (Part 2 §3.3.5.2), the decimal of any digits and any
     exponent rounded once to the nearest double, ties to even, an infinity of its sign at or past the overflow
     threshold and a zero of its sign at or below half the least subnormal. A key is in the float domain when it is in
     `xs:double`'s lexical space as XML Schema 1.0 writes it (reading 71's edition, so `+INF` is no key of a float
     mapping and is refused under `attribute-lexical`), and every such key has its value, at the database
     (`MapKeyFloat`, which PostgreSQL generates by grizzle's `Compute.parseDouble`, `src/qti/mapping.ts`) and in the
     law oracle. Two keys repeat where their values are "pairwise equal or identical", as XML Schema 1.1 compares the
     values of an identity constraint's keys (Part 1 §3.11.4, Identity-constraint Satisfied): "0 = −0 (although they
     are not identical) and NaN ≠ NaN (although NaN is of course identical to itself)", so "0 and −0 are thus
     equivalent for purposes of enumerations, identity constraints, and minimum and maximum values" (Part 2
     §3.3.5.1). So `0` and `-0` repeat, as reading 144 reads them, and two `NaN` keys repeat, as their one spelling
     already does by its text; a mapping may hold one `NaN` key. Refusing both is also the stricter reading, since a
     mapping is a function of its source value. This sets aside reading 56 where it read `1e400` as the largest
     finite double, and the limit it recorded for pantry, under which a key outside grizzle's former bounded form of
     `double precision` (15 significant digits on each side of the point, an exponent of at most 293, zero runs of at
     most 255) had no typed value and was distinct by its text alone, so a mapping keyed `1e400` and `2e400` was
     accepted. The corpus holds no float mapping, so no verdict moves. This binds pantry and plate alike; plate's own
     reading of a double is the renderer team's follow-up. This is not a case of documents in conflict. (Decided
     2026-11-07 by the coordinator, under the operator's standing ruling of 2026-11-05, from seat FIX-FLOATKEY.)
155. **An item ref that writes no `href` names nothing, so AL3 alone refuses it; and the laws over what an item ref
     names judge every item ref, whether or not it, its sections or its test part write an `identifier`.** The ASI XSD
     requires the href, with no default: `<xs:attribute name="href" use="required" type="xs:anyURI" />` in
     `AssessmentItemRefDType` (`imsqti_asiv3p0_v1p0.xsd`), and the information model gives it multiplicity `[1]`: "The
     URI used to refer to the item's file (e.g., elsewhere in the same content package)" (§5.6.5, info.txt:14761 to
     :14764). An item ref that writes none refers to no file, so it has no `ReferencePath`, `ItemRefTarget` or
     `ItemRefDocument`: the importer's laws require a target only of an item ref that writes an href ("Item ref target",
     `src/qti/tests.ts`), and copy a target's type into an assembly's lookup only where the lookup names a resource
     (`src/qti/expressions.ts`), so AL3 ("required-attribute") refuses the item ref under its own rule. An item ref
     whose href names no item or LTI link of the package, an external or an empty URI included, breaks "Item ref
     target", as before. Reading 147 takes an item ref that writes no identifier out of its document's namespace, not
     out of its other laws: its href still names its item, and its variable mappings and template defaults still read
     that item ("Item ref target", "Variable mapping source", "Variable mapping target", "Template default target"), as
     the importer's rows, keyed by the item ref's node, judge them. This sets aside the importer's demand of a target
     and a resolved href of every item ref, under which an item ref with no href broke "Item ref target" and "Test
     overlay" beside AL3, and the law oracle's reading of an item ref's laws through its name (`itemRefLawsOf` and
     `documentLawsOf`, `src/test/oracle-laws/tests.ts`), under which an item ref that writes no identifier escaped them.
     The corpus moves no verdict: each of the 209 item refs of its 29 zips writes an href and an identifier, by a scan
     of their XML entries. This binds pantry and plate alike. This is not a case of documents in conflict. (Decided
     2026-11-07 by the coordinator, under the operator's standing ruling of 2026-11-05, from seat FIX-ITEMREF.)
156. **An ID-typed attribute or text is one of its document's IDs only where its value is an NCName. Any other value is
     no ID: it binds nothing, no IDREF and no cell's `headers` token names it, and its value domain alone refuses it.**
     `xs:ID` restricts `xs:NCName`, whose lexical space it keeps (XML Schema Part 2, §3.3.8), as does the
     `IdentifierDType` a context declaration's `identifier` holds (reading 74), and a form outside a type's lexical
     space denotes no value of it (§2.3). So `""`, a form of whitespace alone, `1a`, `a b` or `٠a`, written as an
     `id`, a response or context declaration's `identifier`, a manifest's or a resource's `identifier`, or an
     ID-typed element's text, is no ID value, as reading 152 reads the names. An IDREF written to the same form names
     no ID, and cvc-id clause 1 ("There must be no ID/IDREF binding in the item's [ID/IDREF table] whose [binding] is
     the empty set", XML Schema 1.0 Part 1, Validation Root) refuses it under "Idref target"; a cell's `headers` token
     written to it names no `th`, since each token "must have the value of an ID of a 'th' tag taking part in the
     same table" (info §5.140.1, reading 126), and "Table headers" refuses it. The schema copies an ID-typed
     attribute or text into `DocumentId`, and a `th`'s `id` into `TableHeader`, only where its form names something
     once collapsed (`namingPattern`, over the grammar's one `ncNamePattern`, `src/qti/identity.ts`), and the importer
     writes their rows by `isNcName`. This sets aside the importer's reading of every ID-typed form as an ID, under
     which an empty identifier, or one with whitespace inside, had a `DocumentId` row that "E1 derived" refused beside
     its value domain, and `1a` was an ID an IDREF of `1a` resolved to; and the law oracle's reading of a `th`'s
     `id` as a header whatever its form, under which `headers="1a"` named `<th id="1a">`. This binds pantry and plate
     alike. This is not a case of documents in conflict. (Decided 2026-11-07 by the coordinator, under the
     operator's standing ruling of 2026-11-05, from seat FIX-IDNCNAME.)
157. **A declaration whose identifier names nothing is still a declaration: its type, its values, its mapping and its
     tables are judged by their own laws, and only its name is missing.** The ASI XSD requires a declaration's
     `identifier`, typed `IdentifierDType`, an `xs:NCName` (`imsqti_asiv3p0_v1p0.xsd`, each of
     `qti-response-declaration`, `qti-outcome-declaration`, `qti-template-declaration` and `qti-context-declaration`),
     so one that writes none breaks AL3, and one whose value is no NCName once collapsed names nothing and breaks its
     value domain (reading 152). The information model states the rest of a declaration apart from its identifier: its
     cardinality and base type (§4.5.2 and §4.5.3, and §5.34, §5.115 and §5.151 alike), its default value and correct
     response (§5.41, §5.35), its mapping and area mapping (§5.88, §5.5) and its lookup tables (§4.5.13). The laws over
     them read the declaration's type and its children, never its name: Declaration base type, Value cardinality,
     Typed value, Mastery range, MappableBaseType, AreaMapping base type, Map key, Typed attribute value, Lookup table
     cardinality and Key text bound. So each judges a declaration whose identifier is unwritten or names nothing as it
     judges any other, which is also the stricter reading. Only the laws over a name do not read it: Declaration key
     (reading 74), Declaration not reserved (reading 72), Reserved type, and every reference's and binding's
     resolution, since such a declaration holds no place in its document's namespace, and two of them share no name.
     The importer writes the declaration's row and every row below it, and its name as a row of its own,
     `DeclarationName` (`src/qti/declarations.ts`), only where the identifier names something, as `RecordFieldName` is
     a field's: a missing value is a row of its own relation, never a sentinel. This sets aside reading 152's leaving
     such a declaration no `Declaration` row, under which the importer's rows broke "Declaration overlay"'s copy of its
     cardinality and "Mapping overlay"'s copy of each map key beside the value domain, and judged none of its values,
     map keys or tables, so a map key past the key-text bound went unrefused where the law oracle named "Key text
     bound"; and it sets aside the law oracle's reading, which judged such a declaration's mapping and tables but not
     its type and values, and read two declarations that name nothing as one name under Declaration key. A declaration
     whose cardinality is unwritten or spells nothing, or whose base type spells nothing, still has no row (lane NIL's
     audit, B11), and the copies its children ask still break beside its own law; that is a case of its own, which
     `known.ts` records. This binds pantry and plate alike. This is not a case of documents in conflict. (Decided
     2026-11-07 by the coordinator, under the operator's standing ruling of 2026-11-05, from seat FIX-DECLNAME.)
158. **A declaration whose cardinality or base type spells nothing is still a declaration: each law over it judges what
     it does spell, and the attribute that spells nothing is refused by AL3 or its value domain alone.** The ASI XSD
     requires a declaration's `cardinality` and types it, and its `base-type`, by enumerations that restrict
     `xs:string` (`imsqti_asiv3p0_v1p0.xsd`, each declaration kind's `cardinality` and `base-type`), whose whiteSpace
     is `preserve`, so a `cardinality` left unwritten breaks AL3, and one written empty, padded or as no code (`many`),
     like such a `base-type`, lies outside its value domain and denotes no cardinality or base type (XML Schema Part 2,
     §2.3). The information model states the rest of a declaration apart from both (§4.5, §5.34, §5.115, §5.151), and
     each law over it reads one attribute or neither: Declaration key, Declaration not reserved, Mastery range, Record
     field key and Map key read neither; Typed attribute value, a reserved name's base type and MappableBaseType's and
     AreaMapping base type's halves over a base type read the base type alone; Lookup table cardinality, a record's
     mapping or area mapping, a typed name's cardinality and Value cardinality read the cardinality alone, but for Value
     cardinality's rule that a value writes a `field-identifier` and a `base-type` both or neither, which reads
     neither; and Declaration base type and Typed value read both. So each judges a declaration where the attributes it
     reads spell something, and nowhere else, which is also the stricter reading: a declaration of `cardinality="many"`
     with a mapping that repeats a key breaks Map key beside its value domain, and one of `base-type="bogus"` whose
     single correct response holds two values breaks Value cardinality. A base type that spells nothing types nothing, as an
     unwritten one does, so a value is read in no base type and a reference to the declaration resolves and is judged
     by its cardinality alone; Declaration base type reads the attribute as written, so a variable of another
     cardinality than record that writes a `base-type` spelling nothing is its value domain's alone. A cardinality that
     spells nothing types the declaration's name nothing, so no reference resolves to it, as reading 157 reads a
     declaration with no name. The importer writes every declaration's row and every row below it, and its cardinality
     as a row of its own, `DeclarationCardinality`, beside `DeclarationBaseType` and `DeclarationIdentifier`
     (`src/qti/declarations.ts`), only where it spells a code: a missing value is a row of its own relation, never a
     sentinel. Each law over a cardinality reads that row, through a row that hangs from the declaration beside it
     (`ValueSetCardinality`, `TypedValue`, `FieldValue`, `MappingCardinality`, `AreaMappingCardinality`,
     `LookupTableCardinality`, `DeclarationName`), or from it (Declaration base type). This sets aside lane NIL's B11
     reading, under which such a declaration had no `Declaration` row and nothing below it, so the importer's rows broke
     "Declaration overlay"'s copy of its cardinality and "Mapping overlay"'s copy of each map key beside the value
     domain, and judged none of its values, map keys or tables; and it sets aside the law oracle's reading, which
     judged no law of such a declaration's own, and none of its mapping's but its map keys. This binds pantry and plate
     alike. This is not a case of documents in conflict. (Decided 2026-11-07 by the coordinator, under the operator's
     standing ruling of 2026-11-05, from seat FIX-DECLCARD.)
159. **A binding or a reference resolves by name to every declaration whose identifier names something, whatever its
     cardinality spells, and each law over it judges what the declaration does spell.** The information model reads a
     binding and a reference by the variable's name and kind: "Response variables are declared by response
     declarations and bound to interactions in the itemBody" (section 2.2.2.2, reading 75), and a feedback element or
     a printed variable names "an outcome variable" or "a template variable" (reading 77). A response declaration whose
     `cardinality` is unwritten or spells nothing still declares its name (reading 158: it is still a declaration, and
     AL3 or its value domain refuses the attribute alone). So each law over a binding or a reference reads the
     declaration's name and kind, its cardinality, or its base type, and judges it where what it reads spells
     something, as reading 158 has each law over the declaration itself do: Binding declared, Binding unique and every
     reference's existence and kind laws read the name and the kind, so a binding to such a response declaration is
     declared, and a feedback element naming such a response declaration still breaks Feedback reference; BindingFit,
     RecordBindingFit, Binding cardinality, Max strings required and the laws over a referenced variable's type read
     its cardinality, and judge nothing where it has none. This is also the stricter reading, since every law that does
     not read the cardinality judges the binding or the reference as any other. It narrows reading 158's "no reference
     resolves to it" to the type: such a name types nothing, so no law over a type reads one from it. The importer
     resolves a name through `DeclarationIdentifier` (`declarationIdentifierRef`, `src/qti/declarations.ts`), and a law
     over the referenced declaration's cardinality reads a row of the resolving row's own, copied from
     `DeclarationCardinality` and written only where the declaration has one: a missing value is a row of its own
     relation, never a sentinel. This sets aside lane NIL's B11 reading, under which a binding or a reference to a name
     only such a declaration holds resolved to nothing, so the importer's rows broke Binding declared, or held no
     reference row and broke "E1 derived"'s copy of the attribute, beside the AL3 or value domain the law oracle alone
     raised. This binds pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-07 by the
     coordinator, under the operator's standing ruling of 2026-11-05, from seat FIX-BINDCARD.)
160. **A mapping's keys repeat as written whatever its declaration's base type spells, and as values of the base type
     only where it spells one.** Reading 98 makes a mapping's keys distinct as values of its base type, since "The map
     is defined by a set of mapEntries, each of which maps a single value from the source set onto a single float"
     (section 5.88.4, https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping), and reading 158 counts Map key among
     the laws that read neither the cardinality nor the base type. Both hold, as two comparisons. Two keys written alike
     are one form, which names one value under every base type whose lexical space holds it and none under any other,
     so a mapping that writes a key twice maps one source twice whatever its base type spells: that comparison reads
     neither attribute and judges every mapping. Two keys written apart are one value only under a base type whose
     values have several forms (`1` and `01` as integers, reading 45; `A B` and `B A` as pairs, reading 98; `0` and
     `-0` as floats, reading 154), so that comparison reads the base type and judges a mapping only where it spells a
     code, as reading 158 has each law over a base type do. So a mapping under `base-type=" string "` that writes the
     key `a` twice breaks Map key beside its value domain, and one under `base-type=" integer "` keyed `1` and `01`
     breaks its value domain alone. This is also the stricter reading: no base type accepts a key written twice. The
     schema states the two as two keys (`src/qti/mapping.ts`): `key(MapKey(mapping, key))` over every mapping's keys as
     written, and `key(mapping, value)` over the typed keys, which hang from `MapKeyType`, written only where the
     declaration has a base type; the law oracle reads a key as written where the base type spells nothing, and as
     `mapKeyValueOf` gives it where the base type spells a code (`src/test/oracle.ts`). This sets aside lane NIL's B11
     reading, under which neither the import's rows (no `Declaration` row, so no `MapKey`) nor the law oracle (no base
     type to read the keys in) judged the keys of a mapping whose base type spells nothing, so a key written twice there
     broke its value domain alone; reading 158 left it at 6fea789a, and `src/test/unspelled-declarations.oracle.test.ts`
     expected it until this reading. The corpus holds no repeated key (reading 98), so no verdict moves. This binds
     pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-07 by the coordinator, under
     the operator's standing ruling of 2026-11-05, from seat FIX-MAPKEYDUP.)
161. **A printed variable's `format` may hold any number of conversion specifiers, two or more included, and pantry
     stores it as written; each specifier is still one reading 132 admits.** The upstream reviewer of PR #46 ruled
     "`qti-printed-variable@format` with two or more conversions, such as `%d %d`: our side has ruled it should be
     accepted and stored as written. QTI defines `format` by reference to printf for one value, but it doesn't ban a
     second conversion, and C's undefined behaviour isn't a QTI prohibition. Pantry never renders, so it can store the
     value. How a renderer prints the extra conversion is the renderer's call" (comment 6701102861, 2026-11-07,
     https://github.com/aidenzepp/qti-pie/pull/46#issuecomment-6701102861), and the operator's standing steer takes that
     reviewer's advice. The information model defines `format` as "The format conversion specifier to use when
     converting numerical values to strings" (section 7.30.7) and the syntax of a specifier (section 2.3.4), and states
     no count; ISO/IEC 9899:2011's "If there are insufficient arguments for the format, the behavior is undefined"
     (section 7.21.6.1) says what a C program that prints such a format does, not what a QTI document may write. So a
     format is a printf format string over the listed codes: characters other than `%`, the escape `%%`, and conversion
     specifiers, any number of them, none included (`printfFormat`, `src/grammar/attributes.ts`). `%i of %i`, `%%%e%%%G`
     and `%i, %.2f and %#x` are admitted and kept as the attribute's lexical form; `%i of %d` and `%d %d` are admitted since reading 171, and `%i of %` is still
     refused under `attribute-lexical`, since a `%` at the end ends in no code at all. (Before reading 171 the first
     two were refused too, since reading 132 read `d` as no listed code.) The law oracle reads
     the composed grammar's domain, so both sides judge by the one pattern. This sets aside reading 132's rule of at
     most one specifier, and the operator's decision of 2026-11-06 on item L4 that it recorded. The corpus writes only
     `%.1f`, so no verdict moves. This binds pantry and plate alike in what a document may write; how a renderer prints
     a second conversion is plate's own reading. This is not a case of documents in conflict. (Decided 2026-11-07 by the
     coordinator, under the operator's standing ruling of 2026-11-05, from seat FIX-PRINTFMT.)
162. **A path two document types name is the document its root bears out: of the types its resources name, the first in
     the manifest's order whose `RootOfType` pair holds its root's kind, and the first of all where none does.** Reading
     93 has a resource of a type `RootOfType` maps name the document at its `href`, "read as a document of that type",
     and a path is one document, of one type (readings 93 and 146), so two resources that name one path under two
     document types are refused under "Document entry" (`entry-kind`): the `href` of the type the document is not read
     as names no document of its type. IMS Content Packaging 1.2 gives the resources no order: "The order of the child
     Resource and IPointer objects is not significant" (Information Model, Version 1.2 Public Draft v2.0, section 6.6.1,
     the Resources class; line 744 of `imscp_infov1p2pd2.txt`). So the type the document is read as cannot turn on which
     resource is listed first, as it did when the importer and the law oracle read it as the first type listed:
     `simple`'s item path listed as a stimulus and then as an item was read as a stimulus, a type its item root does not
     bear out, and broke `RootOfType` beside "Document entry", while listed the other way round it broke "Document
     entry" alone. The document is read as a type whose `RootOfType` pair holds its root's kind, the first in the
     manifest's order where two do (an included fragment's type holds every kind an include stands for, reading 114),
     and as the first type of all where none does, since no reading then bears its root out (`documentTypeOf`,
     `src/import/program.ts`; `typingResource`, `src/test/oracle.ts`). A path two types name then breaks `RootOfType`
     only where its root bears out neither, in either order, and "Document entry" alone otherwise. The records of each
     item or test resource that names the path still describe the document, whatever type it is read as (reading 62;
     `resourceNamer`, `src/import/overlays/metadata.ts`), and the law oracle's `lom-identifier` and `document-lang` read
     each such resource's records, not the first listing's alone. The database judges `RootOfType` over `Document` as a
     CHECK on the row the import writes, at its insert, and this "Document entry" as the deferred containment of the
     other `href` in `Document`, so under the first-type reading it refused the stimulus-first package under
     `root-type-reverse` where the catalog's precedence, entry-kind ahead of root-type-reverse (ee28115f), names
     entry-kind; read this way, it names entry-kind, as the law oracle does. Where the root bears out neither type both
     laws break, and the database names the CHECK it judges first, a stated limit of naming a refusal by the laws
     PostgreSQL reports (`src/import/package.ts`). This sets aside the first-type reading the importer and the law
     oracle held (NS4, `src/test/gen/genetic/known.ts`). This reading moves no corpus verdict: no manifest of the 28
     QTI 3 packages the corpus witness judges, nor of the tarball's one QTI 2.2 zip
     (`qtiv2p2-examples/items/items.zip`), names one `href` under two types, by a scan of their resources. This binds
     pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-07 by the coordinator, under
     the operator's standing ruling of 2026-11-05, from seat DBLANE-1.)
163. **SCORE's and MAXSCORE's float rule binds items only; PASSED's boolean rule binds items and tests.** The information
     model's section 4.5, OutcomeDeclaration (https://www.imsglobal.org/spec/qti/v3p0/info#Root_OutcomeDeclaration), says
     of SCORE "Items that declare a numeric outcome variable representing the candidate's overall performance on the item
     should use the outcome name 'SCORE' for the variable. SCORE needs to be a float." (`info.txt:11979`), and of
     MAXSCORE "Items that declare a maximum score (in multiple response choice interactions, for example) should do so
     by declaring the 'MAXSCORE' variable. MAXSCORE needs to be a float." (`info.txt:11979`). Both sentences are about
     items. It says of PASSED "Items or tests that want to make the fact that the candidate scored above a predefined
     threshold available as a variable should use the 'PASSED' variable. PASSED needs to be a boolean."
     (`info.txt:11979`), which covers a test as well. Section 2.2.2.3, which is not normative, says the same with
     "MUST". So an outcome declaration named SCORE or MAXSCORE of an item is refused unless its base type is float, a
     test's of any base type is accepted (an integer included), and one named PASSED is refused unless it is a boolean,
     in an item and in a test alike. This refuses nothing the specification states and accepts what it leaves open;
     reading 1 protects valid content. No corpus test declares a SCORE or MAXSCORE of another base type. This binds
     pantry and plate alike. (Decided 2026-11-07 by the operator, mail `e64ace73` from the renderer; the law `Reserved
     type`. Re-cited 2026-11-07 by the Mind on audit b61b8f14's D2: §4.5 for the non-normative §2.2.2.3.)
164. **A MathML formula's direction starts at its `m:math`: `ltr`, unless the `math` element writes `rtl`, whatever the
     HTML around it says.** MathML 3 section 2.2.1, Attributes
     (https://www.w3.org/TR/MathML3/chapter2.html#interf.toplevel.atts), says "Note that the dir attribute defaults to
     "ltr" on the math element (but inherits on all other elements which accept the dir attribute); this provides for
     backward compatibility with MathML 2.0 which had no notion of directionality.", and section 3.1.5.1 says "The
     overall directionality for a formula, basically the direction of the Layout Schemata, is specified by the dir
     attribute on the containing math element (see Section 2.2 The Top-Level <math> Element). The default is ltr." So
     the direction an element of a formula inherits is the `dir` of its nearest ancestor that writes `ltr` or `rtl`, up
     to and including its `m:math`, and `ltr` where none does; an HTML ancestor's `dir`, `rtl` or `auto`, is not read.
     The alignment laws read that direction (section 3.5.5.2: an `mrow` or `mstyle` lets a group through only where it
     changes no direction), so `<div dir="rtl"><m:math>…<m:mrow dir="ltr"><m:maligngroup/>…` keeps its group in its cell
     and is accepted. By the same rule `<div dir="rtl"><m:math>…<m:mrow dir="rtl"><m:maligngroup/>…` is refused: the
     formula starts at `ltr`, so the `mrow`'s `rtl` changes direction and the group cannot pass it; a formula meant to
     run right to left writes `dir="rtl"` on its `m:math`. A `dir` that spells neither `ltr` nor `rtl` changes no
     direction (MathML 3 lists only those two; the value domain refuses another on a MathML element). This binds pantry
     and plate alike. This is not a case of documents in conflict. (Proposed by the Mind (audit e8db90e1's F6), for
     the operator's acceptance; 2026-11-07, decision 416.)
165. **Two string map keys that differ only by case are two keys, and a response that matches several entries takes the
     first one listed.** A string mapping whose entries leave `case-sensitive` at its default writes `York` (mapped to 2)
     and `york` (mapped to 1); the document is accepted, and the response `york` matches both. The standard bans
     nothing here: no XSD carries a uniqueness constraint (no `xs:unique` or `xs:key` in `imsqti_asiv3p0_v1p0.xsd` or
     `imsqti_itemv3p0p1_v1p0.xsd`), and `case-sensitive` is "Used to control whether or not a qti-map-entry string is
     matched case sensitively" (section 7.21.3), which governs how a response is matched, not what a key is. Section
     5.88 says each entry "maps a single value from the source set onto a single float", which describes each entry,
     not a rule that no two may overlap. The standard already lets entries overlap: the official example BG010 writes
     `York` with `case-sensitive="true"` beside `york` with the default, and the response `York` matches both. Where
     QTI states a tie-break it is order: AreaMapping's areas are checked with "those listed first taking priority"
     (section 5.115). Mapping states none, so the same rule applies to it: the first listed entry that matches gives
     the value. Keys written apart are two keys whatever their matching: `York` and `york` are two keys. A key written
     twice is one key whatever each entry's `case-sensitive` says, so `york` written twice, once matched
     case-sensitively and once by the default, maps one source twice and is refused under Map key (reading 160). This
     narrows reading 98's string clause: its sentence that `York` and `york` repeat in a string mapping whose entries
     leave `case-sensitive` at its default no longer holds, and everything else in reading 98 stands, including the
     refusal of an exact repeat and of `1` and `01` in an integer mapping. A reader that picks among several matching
     entries, plate's score included, takes the lowest start (the first listed) and invents no other policy. This binds
     pantry and plate alike. This is not a case of documents in conflict. (Decided 2026-11-07 by the Mind, decision 425,
     delegated by the operator in mail 69fd02ec; register row B11. Amended 2026-11-07 by the Mind, decision 433: a key
     written twice is a repeat whatever its matching, as reading 160 holds.)
166. **A test's prefixed `qti-map-response` names a response variable whose declaration holds a `qti-mapping`, and a
     test's prefixed `qti-correct` names a response variable.** A test's outcome processing may name an item's variable
     through its item ref (reading 48), `I.RESPONSE`. The information model's section 7.22, MapResponse
     (https://www.imsglobal.org/spec/qti/v3p0/info#Derived_MapResponse), says "This expression looks up the value of a
     response variable and then transforms it using the associated mapping, which must have been declared."
     (`info.txt:69185`), and section 7.10, Correct (https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Correct), says
     "This expression looks up the declaration of a response variable and returns the associated correctResponse or
     NULL if no correct value was declared. When used in outcomes processing item identifier prefixing (see variable)
     may be used to obtain the correct response from an individual item." (`info.txt:67866`). Neither sentence is
     limited to an item's own processing. So a test's `<qti-map-response identifier="I.RESPONSE"/>` is refused where
     the item's `RESPONSE` declares no `qti-mapping` ("Mapped response"), and so is one that reads a built-in response
     variable, such as `I.numAttempts`, which has no declaration and so no mapping. A prefixed `qti-map-response` or
     `qti-correct` that names anything but a response variable, such as the item's outcome `I.SCORE`, is refused by
     "Variable kind", which already judged every resolving reading by the declaration kinds its element may name
     (sections 7.10.1 and 7.22.1); this reading records that it binds a prefixed name as it binds an unprefixed one. A
     dotted map response of a mapped response, a dotted correct of a response, and a name read through an LTI link
     (reading 110) are accepted. Between the two packages the stricter normative reading wins. This binds pantry and
     plate alike, as plate's readings 194, 195 and 196 hold. This is not a case of documents in conflict. (Decided
     2026-11-07 by the Mind, decisions 429 and 430 (1), on operator mails b4df4b29 and 526fbbd9.)

     The same holds for a test's prefixed `qti-map-response-point` and for a map response of a built-in response
     variable (decision 431). The information model states MapResponsePoint in section 6.9.46, the
     `qti-map-response-point` attribute (https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-map-response-point):
     "The mapResponsePoint expression looks up the value of a response variable that must be of base-type point, and
     transforms it using the associated areaMapping." (`info.txt:53022`; section 2.11.1.6 says the same, "transforms it
     using the associated qti-area-mapping", `info.txt:9314`). That text does not repeat section 7.22's "which must have
     been declared", but the expression presupposes an area mapping exactly as a map response presupposes its mapping,
     and pantry already refuses an unprefixed `qti-map-response-point` whose response holds no `qti-area-mapping` under
     "Mapped response". So a test's `<qti-map-response-point identifier="I.POINT"/>` is held the same way: refused under
     "Mapped response" where the item's `POINT` declares no `qti-area-mapping`, and so is one that reads a built-in
     response. An unprefixed `qti-map-response` or `qti-map-response-point` that names a built-in response variable,
     an item's `numAttempts` or `duration` or a test's `duration`, is refused under "Mapped response" too: a built-in
     has no declaration, so no mapping or area mapping has been declared (section 7.22). A built-in of another kind,
     such as `completionStatus`, stays "Variable kind"'s alone. A dotted map response point of a response with an area
     mapping is accepted. (Decided 2026-11-07 by the Mind, decision 431.)

167. **A weighted `qti-test-variables` is float: with no `base-type` it is typed float, and with a `base-type` other
     than float it is refused. Two expression types stay stated limits.** The information model's section 7.39.5, TestVariables `weight-identifier`
     (https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_TestVariables.Attr_weight-identifier), says
     "The behaviour of this characterisic is only defined if the base-type attribute is float or omitted . When a
     weighting is specified the result of the expression always has base-type float. Note that this option is
     incomptable with base-type integer.", and section 7.39.6, its `base-type`, says "If specified, matches only
     variables declared with this base-type. This also becomes the base-type of the result (subject to type promotion
     through weighting, as described below). If omitted, variables declared with base-type integer or float are
     matched. The base-type of the result is integer if all matching values have base-type integer, otherwise it is
     float and integer values are subject to type promotion." So a `qti-test-variables` that writes a
     `weight-identifier` and no `base-type` is float multiple, whether or not an item ref holds the named weight:
     `<qti-test-variables variable-identifier="RAW" weight-identifier="W"/>` set into an integer multiple outcome is
     refused under "Set type", and a `qti-gcd` of it under "Operand fit", while `rtest04.xml`'s weighted sum into its
     float `SCORE` is accepted. One that writes a `base-type` has that base, and weighted only float is admitted: with
     `integer` the section calls the option incompatible, and with any other base it leaves the behaviour undefined,
     so both are refused under "Weighted base", the stricter reading. `qti-outcome-minimum` and `qti-outcome-maximum`
     are float multiple, weighted or not (sections 6.9.63 and 6.9.64: "The result has cardinality multiple and
     base-type float."; section 7.28.5 gives their `weight-identifier` "As per the 'weight-identifier' characteristic
     of 'qti-test-variables'.").

     Two types stay `unknown`, each a stated limit (reading 91). First, a test's prefixed `qti-variable`, `I.SCORE`,
     weighted or not, is `unknown` in its document. Its type is the declaration of the item each placing test's item
     ref names (readings 5 and 117), so no one type of the element is right in every test, and a weight changes it
     only for an integer or float item variable (section 7.47.2: "Weights only apply to item variables with
     base-types integer and float. If the item variable is of any other type the weight is ignored."). Typing every
     weighted read float would refuse valid content, such as a weighted `I.RESPONSE` of an identifier response in a
     `qti-match`. Second, an unweighted `qti-test-variables` with no `base-type` is `unknown`: by section 7.39.6 its
     base turns on which items the assembled test's sections and categories match, and, where they mix integer and
     float, on which values are present at run time. What would lift both is typing an expression once per assembly,
     each placing test's own type of the read and the matched declarations' bases folded per assembly (judging only
     the uniform case of the second), with per-assembly copies of every law that reads an expression's type. Until
     then each is accepted wherever `unknown` is, and a renderer evaluating real values may judge more. Between the two
     packages the stricter normative reading wins. This binds pantry and plate alike, and pairs with plate's readings
     198 and 199. This is not a case of documents in conflict.

     Plate types both cases when it checks a whole package: a prefixed `qti-variable` takes the type of the declaration
     of the item the item ref names, weighted as its reading 198 says, and an unweighted `qti-test-variables` with no
     `base-type` is integer only when every item variable it can match is integer, and float otherwise. A test checked
     alone keeps `unknown`, as pantry does. So in a package where those types decide a type check, plate refuses what
     would fail at run time and pantry accepts it. This is a known acceptance difference between the packages,
     recorded under decision 436, not a different reading of the text. What would lift it is the per-assembly typing
     above. (Decided 2026-11-08 by the Mind, decisions 434 and 435, on research ba1a2d84, relay 4da02d14 of plate
     readings 198 and 199, under the operator's delegation; FYI to the operator. Decision 436 (2026-11-08) records
     plate's package-level typing.)

168. **A test may declare a variable named `numAttempts` or `completionStatus`; in a test only `duration` is reserved.**
     The information model says of an item's variables "All variables must be declared except for the built-in session
     variables referred to below which are declared implicitly and must not be declared" (section 2.2.2, not
     normative), and the identifier rows of the declaration classes list "completionStatus, numAttempts and duration"
     and go on "All item variables declared in an item share the same namespace" (tables 4.5.1, 5.115.1 and 5.151.1).
     Section 2.2.2.2 makes `numAttempts` "the number of attempts at each item", and a test's processing holds
     `duration` and `QTI_CONTEXT` as built-ins and neither of the other two (reading 29). So a test's declaration of
     `numAttempts` or `completionStatus` shadows no built-in of the test and is accepted, a test's declaration of
     `duration` stays refused under "Declaration not reserved", and so does an item's declaration of any of the three.
     An unprefixed `numAttempts` in a test's processing names the test's own declaration where it has one, and a
     prefixed `Q01.numAttempts` still names the item's built-in (reading 106). This narrows "Declaration not
     reserved", which held the three names reserved in every document (reading 72's law). In the corpus, none of the
     28 packages' tests or sections declares any of the three, so no verdict moves. This binds pantry and plate alike.
     (Decided 2026-11-08 by the overseer under the operator's delegation, mail 7a7e6287, ruling 2:
     the refusal in a test rests on the non-normative section 2.2.2.)

169. **A gap match interaction with two or more gaps binds a response of multiple cardinality.** The information model
     says "The GapMatchInteraction must be bound to a response variable with base-type directedPair and either single or
     multiple cardinality, depending on the number of gaps" (section 5.57). Each gap takes a pair of its own, and a
     single response holds one pair, so with one gap either cardinality may bind, and with two or more only `multiple`
     may. Reading 92's sentence on `max-associations` (section 5.57.3) still holds beside it. The gaps counted are the
     interaction's own `qti-gap` elements, an included fragment's among them (reading 117). The law is "Binding
     cardinality" (rule `binding-fit`). In the corpus, 13 gap match interactions hold two or more gaps and each binds a
     `multiple` response, so no verdict moves. Plate refuses the case already. This binds pantry and plate alike.
     (Decided 2026-11-08 by the overseer under the operator's delegation, mail 7a7e6287, ruling 3, on the
     operator's review of PR #46, comment 6716564108.)

170. **A section ref whose href is external is refused under the stated limit "Remote section ref" (`remote-section`):
     a stated limit of pantry, not a law of QTI.** pantry imports a package offline and cannot assemble a test from a
     section it does not hold. The information model makes a section ref a facade "for the qti-assessment-section to
     which it refers" (section 7.5) and bans no remote one, but pantry assembles every test from its package's
     documents (readings 86 and 117) and never fetches a resource (reading 115). An external include can stand as
     written because its document's own content is judged without it; a section ref's section is the test's content,
     so there is nothing to judge. What would lift the limit is a fetch of the section at import. It is listed with the
     other stated limits (`limitRules`: key-text bound, href form, fragment context). In the corpus, no section ref of
     the 28 packages is external, so no verdict moves. This binds pantry and plate alike.
     (Decided 2026-11-08 by
     the overseer under the operator's delegation, mail 7a7e6287, ruling 5; register row B5.)

171. **A printed variable's `format` may use `d` as a conversion code.** The code list of the information model's
     section 2.3.4 (E, e, f, G, g, r, R, i, o, X, x) is in a section the information model marks not normative; the
     normative section 7.30.7 says only "The format conversion specifier to use when converting numerical values to
     strings"; the implementation guide's own example writes `format="%d"`; and C reads `d` as it reads `i` (ISO/IEC
     9899:2011, section 7.21.6.1: "d,i The int argument is converted to signed decimal"). So `%d`, `%5d`, `%d %d` and
     `%i of %d` are admitted and stored as written, and `%q`, `2f%` and `%` stay refused under `attribute-lexical`.
     This adds `d` to the codes of readings 132 and 161. In the corpus, the only `format` is `%.1f`, so no verdict
     moves. This binds pantry and plate alike. (Decided 2026-11-08 by the overseer under the operator's
     delegation, mail 7a7e6287, ruling 8, on the operator's ruling in his comment on PR #46, 6722164084: admit `d`.)

172. **An order interaction may be bound to a response variable of any base type and cardinality: its class description
     states no binding.** The one sentence that binds it, "The qti-order-interaction must be bound to a response
     variable with a base-type of identifier and ordered cardinality only" (section 2.4.1.2, `info.txt` line 8766,
     `info-v3p0p1.txt` line 8854), stands in section 2, Key Data Model Features, which both versions of the information
     model mark "This Section is NOT NORMATIVE" (`info.txt` line 8352, `info-v3p0p1.txt` line 8436). So it states no
     requirement. The normative sources state none: the OrderInteraction class description (section 5.97, `info.txt`
     line 36046) gives the candidate's task and nothing of the variable it is bound to, where the GraphicOrderInteraction
     class description states its own: "The order hotspot interaction must be bound to a response variable with a
     base-type of identifier and ordered cardinality" (section 5.61, `info.txt` line 29186). Under the operator's rule
     that what the standard does not ban is not refused, an order interaction binds a declared response variable of any
     base type and cardinality, as the custom and portable custom interactions do (reading 75), and the graphic order
     interaction keeps its (identifier, ordered) row. Neither `BindingFit` nor `RecordBindingFit` holds a row of the
     order interaction, which makes it one of `anyTypeKinds` (`typedFits`, `src/grammar/facets.ts`;
     `src/qti/interactions.ts`), and "Binding declared" and "Binding unique" judge it as any other interaction
     (readings 75 and 92); the law oracle's "Binding unique" reads every interaction, as the schema's key over
     `BoundVariable` does (`src/test/oracle.ts`). This sets aside the (identifier, ordered, `qti-order-interaction`) row,
     under which an order interaction bound to a variable of another type was refused under "BindingFit", and one bound
     to a record under "RecordBindingFit". In the corpus, each of the 9 order interactions, in 5 zips, binds an
     identifier response of ordered cardinality, so no verdict moves. This binds pantry and plate alike. It matches
     reading 165 of PR #55. (Decided 2026-11-09 by the overseer under the operator's delegation, decision 448, overseer
     mail f74ee547.)
