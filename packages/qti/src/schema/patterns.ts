/**
 * Every regex source the schema uses, each a literal string that `str.regex(source)` accepts. A
 * source whose flags are `"su"` has a sibling `<name>Flags` constant; every other source takes
 * `str.regex`'s default flags, `"u"`. No regex literal lives in a schema module: they import from
 * here.
 */

/**
 * The first characters of an XML Namespaces NCName: the XML 1.0 NameStartChar production without
 * the colon, written as classes because grizzle's grammar has no `\p`.
 */
const ncNameStart = "A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�\u{10000}-\u{EFFFF}" as const;

/**
 * The later characters of an NCName: the start characters and the NameChar additions of XML 1.0.
 */
const ncNameContinuation = `${ncNameStart}\\-.0-9·̀-ͯ‿-⁀` as const;

/**
 * The NCName production without anchors, bounded to 256 characters because identifiers sit in keys
 * and a key over text needs a byte bound.
 */
const ncNameBody = `[${ncNameStart}][${ncNameContinuation}]{0,255}` as const;

/**
 * XML Namespaces NCName: a name with no colon, at most 256 characters.
 */
export const ncName = `^${ncNameBody}$` as const;

/**
 * An NCName or the empty string, for a name that an attribute may leave blank.
 */
export const ncNameOrEmpty = `^(?:${ncNameBody})?$` as const;

/**
 * XML Namespaces QName: an NCName with an optional NCName prefix and colon.
 */
export const qName = `^(?:${ncNameBody}:)?${ncNameBody}$` as const;

/**
 * XML 1.0 EncName: the encoding label of an XML declaration.
 */
export const encName = "^[A-Za-z][A-Za-z0-9._\\-]{0,63}$" as const;

/**
 * `xs:boolean` lexical space: `true`, `false`, `1` or `0`.
 */
export const xsBoolean = "^(true|false|1|0)$" as const;

/**
 * `xs:nonNegativeInteger` lexical space: digits with an optional leading plus.
 */
export const xsNonNegativeInteger = "^\\+?[0-9]+$" as const;

/**
 * `xs:integer` lexical space: digits with an optional sign.
 */
export const xsInteger = "^[+\\-]?[0-9]+$" as const;

/**
 * `xs:double` lexical space: a decimal with an optional exponent, `INF`, `-INF`, or `NaN`.
 */
export const xsDouble =
  "^(?:[+\\-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+\\-]?[0-9]+)?|-?INF|NaN)$" as const;

/**
 * `xs:string` lexical space: any text, whitespace preserved. The same source as `wildcard`; the
 * name tells an attribute column its `whiteSpace` class is `preserve`.
 */
export const xsString = "^.*$" as const;

/**
 * The flags of `xsString`: `s` lets `.` match line terminators.
 */
export const xsStringFlags = "su" as const;

/**
 * `xs:normalizedString` lexical space: any text. The same source as `xsString`; the name tells an
 * attribute column its `whiteSpace` class is `replace`.
 */
export const xsNormalizedString = "^.*$" as const;

/**
 * The flags of `xsNormalizedString`.
 */
export const xsNormalizedStringFlags = "su" as const;

/**
 * `xs:token` lexical space: no tab, line feed or carriage return, no leading or trailing space and
 * no two adjacent spaces, the empty string included.
 */
export const xsToken = "^(?:[^ \\t\\n\\r]+(?: [^ \\t\\n\\r]+)*)?$" as const;

/**
 * The flags of `xsToken`.
 */
export const xsTokenFlags = "su" as const;

/**
 * The `xs:token` lexical space (no tab, line feed or carriage return, no leading, trailing or
 * doubled space, the empty string included) with at most 256 non-space characters, so at most 511
 * code points and 1,279 bytes. The collapsed form a key-shaped containment target holds (campaign
 * decision 26); `xsToken` stays unbounded for every other field.
 */
export const boundedToken = "^(?:[^ \\t\\n\\r](?: ?[^ \\t\\n\\r]){0,255})?$" as const;

/**
 * The flags of `boundedToken`.
 */
export const boundedTokenFlags = "su" as const;

/**
 * Text made only of XML whitespace characters, at least one.
 */
export const whitespaceOnly = "^[ \\t\\r\\n]+$" as const;

/**
 * Text holding at least one character that is not XML whitespace.
 */
export const nonWhitespaceText = "^.*[^ \\t\\r\\n].*$" as const;

/**
 * The flags of `nonWhitespaceText`.
 */
export const nonWhitespaceTextFlags = "su" as const;

/**
 * A string whose `xs:token` collapse differs from it: a leading or trailing whitespace character, a
 * tab, line feed or carriage return anywhere, or two adjacent whitespace characters. The type of
 * `AttributeLexical.value`.
 */
export const uncollapsed =
  "^(?:[\\t\\n\\r ].*|.*[\\t\\n\\r ]|.*[\\t\\n\\r].*|.*[\\t\\n\\r ]{2}.*)$" as const;

/**
 * The flags of `uncollapsed`.
 */
export const uncollapsedFlags = "su" as const;

/**
 * Grizzle's own wildcard, any text: the type of the LOM leaves, the generic arms and the qmd
 * replace leaves.
 */
export const wildcard = "^.*$" as const;

/**
 * The flags of `wildcard`.
 */
export const wildcardFlags = "su" as const;

/**
 * An XML declaration version, `1.` and digits, for `TreeXmlVersion`.
 */
export const xmlVersion = "^1\\.[0-9]+$" as const;

/**
 * An XML declaration standalone value, `yes` or `no`, for `TreeXmlStandalone`.
 */
export const yesNo = "^(yes|no)$" as const;

/**
 * `xs:base64Binary` lexical space: whole four-character groups with an optional padded final group.
 */
export const base64 = "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$" as const;

/**
 * A reference that stays inside the package (R8): a relative path of at most eight segments with no
 * `..` segment and no leading `/`, or an absolute URI with a scheme. Written without lookarounds; a
 * segment is one character, two characters that are not `..`, or three to 80. For an absolute URI
 * the scheme has at most 32 characters and at most 255 follow the colon, so the pattern proves at
 * most 647 code points and 2,567 UTF-8 bytes, and a key of a `uuid` and a path (2,600 bytes) fits
 * grizzle's 2,704-byte B-tree entry (campaign decision 26). Judged on the collapsed value.
 */
export const hrefInPackage =
  "^(?:[A-Za-z][A-Za-z0-9+.\\-]{0,31}:[^ \\t\\r\\n]{0,255}|(?:[^/]|[^/.][^/]|\\.[^/.]|[^/]{3,80})(?:/(?:[^/]|[^/.][^/]|\\.[^/.]|[^/]{3,80})){0,7})$" as const;

/**
 * `xs:anyURI` lexical space as `xmllint` enforces it: libxml2's mapping of the characters outside
 * the URI set to `_`, then RFC 3986's URI-reference grammar with a closed IP literal, a non-empty
 * port, a relative-path reference whose first segment has no colon, and a fragment that admits `[`
 * and `]`. Judged on the collapsed value; the strict RFC 3986 grammar exceeds the engine's regex
 * budget (2,516 constructs), this one takes 384 of 512.
 */
export const anyUri =
  "^(?:[A-Za-z][A-Za-z0-9+\\-.]*:(?://(?:(?:[^#%/?@\\[\\]]|%[0-9A-Fa-f]{2})*@)?(?:\\[[^\\]]*\\]|(?:[^#%/?:@\\[\\]]|%[0-9A-Fa-f]{2})*)(?::[0-9]+)?(?:/(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?|/(?:(?:[^#%/?\\[\\]]|%[0-9A-Fa-f]{2})(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?|(?:[^#%/?\\[\\]]|%[0-9A-Fa-f]{2})(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?|(?://(?:(?:[^#%/?@\\[\\]]|%[0-9A-Fa-f]{2})*@)?(?:\\[[^\\]]*\\]|(?:[^#%/?:@\\[\\]]|%[0-9A-Fa-f]{2})*)(?::[0-9]+)?(?:/(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?|/(?:(?:[^#%/?\\[\\]]|%[0-9A-Fa-f]{2})(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?|(?:[^#%/?:\\[\\]]|%[0-9A-Fa-f]{2})+(?:/(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?)?)(?:\\?(?:[^#%\\[\\]]|%[0-9A-Fa-f]{2})*)?(?:#(?:[^#%]|%[0-9A-Fa-f]{2})*)?$" as const;

/**
 * `xs:language` lexical space: dash-separated subtags of at most eight characters, the first
 * alphabetic.
 */
export const xsLanguage = "^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$" as const;

/**
 * `xsLanguage` or the empty string: the LOM language bar (`LomStringLanguage.value`,
 * `LomLanguage.value`).
 */
export const xsLanguageOrEmpty = "^(?:[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*)?$" as const;

/**
 * A media type: a type, a slash and a subtype, with no whitespace.
 */
export const mimeType = "^[^/ \\t\\r\\n]{1,127}/[^ \\t\\r\\n]{1,255}$" as const;

/**
 * The CP profile's `LengthDType`: digits with an optional percent sign.
 */
export const lengthDType = "^[0-9]+%?$" as const;

/**
 * The lexical envelope of a content-package resource type, the vocabulary `ResourceTypeOf` seeds.
 */
export const resourceType = "^[a-z0-9_/\\-]{1,80}$" as const;

/**
 * The seven `schema` values the QTI 3 content-package profile enumerates
 * (`imsqtiv3p0_imscpv1p2_v1p0.xsd` lines 327 to 333, `imsqtiv3p0p1_imscpv1p2_v1p0.xsd` lines 295 to
 * 301).
 */
export const cpSchema =
  "^(QTI Package|QTI Test Bank|QTI Item Bank|QTI Object Bank|QTI Test|QTI Section|QTI Item)$" as const;

/**
 * The `schemaversion` values of the QTI 3 CP profile: `3.0.0` and `3.0.1`.
 */
export const schemaVersion = "^3\\.0\\.[01]$" as const;

/**
 * The 22 `interactionType` values of the QTI metadata XSD (`imsqti_metadatav3p0_v1p0.xsd` lines 169
 * to 190), in XSD order. A literal alternation costs one construct per character, so this list has
 * no headroom under the engine's 512-construct budget.
 */
export const qmdInteractionType =
  "^(associateInteraction|choiceInteraction|customInteraction|drawingInteraction|endAttemptInteraction|extendedTextInteraction|gapMatchInteraction|graphicAssociateInteraction|graphicGapMatchInteraction|graphicOrderInteraction|hotspotInteraction|hottextInteraction|inlineChoiceInteraction|matchInteraction|mediaInteraction|orderInteraction|portableCustomInteraction|positionObjectInteraction|selectPointInteraction|sliderInteraction|textEntryInteraction|uploadInteraction)$" as const;

/**
 * The three `feedbackType` values of the QTI metadata XSD (`imsqti_metadatav3p0_v1p0.xsd` lines 202
 * to 204).
 */
export const qmdFeedbackType = "^(adaptive|nonadaptive|none)$" as const;

/**
 * The three `scoringMode` values of the QTI metadata XSD (`imsqti_metadatav3p0_v1p0.xsd` lines 217
 * to 219).
 */
export const qmdScoringMode = "^(human|externalmachine|responseprocessing)$" as const;

/**
 * A tool name or version: at most 256 characters, written as 255 then an optional one, within the
 * engine's 255 repetition bound (R33).
 */
export const toolString = "^.{0,255}.?$" as const;

/**
 * The flags of `toolString`: `s` lets `.` match line terminators.
 */
export const toolStringFlags = "su" as const;

/**
 * The lexical space of the `boolean` value arm: `true` or `false`.
 */
export const booleanLiteral = "^(true|false)$" as const;

/**
 * The `externalScored` values: `human` or `externalMachine`.
 */
export const externalScored = "^(human|externalMachine)$" as const;

/**
 * The `orientation` values: `vertical` or `horizontal`.
 */
export const orientation = "^(vertical|horizontal)$" as const;

/**
 * The `showHide` values: `show` or `hide`.
 */
export const showHide = "^(show|hide)$" as const;

/**
 * The lexical space of a `point` value: two signed integers separated by one space.
 */
export const point = "^[+\\-]?[0-9]+ [+\\-]?[0-9]+$" as const;

/**
 * The lexical space of a `pair` or `directedPair` value: two NCNames separated by one space.
 */
export const pair = `^${ncNameBody} ${ncNameBody}$` as const;

/**
 * The `ExtensionString.Type` half of every DRD union, as the XSD writes it
 * (`imsqtiv3p0_afa3p0drd_v1p0.xsd` lines 369 to 373, pattern `(ext:)[ a-z | A-Z | 0-9 | . | _ ]+`):
 * `ext:` then one or more of space, `|`, letters, digits, `.` and `_`. The XSD's class lists space
 * and `|` as members, so both are admitted (the spec's Q6: admit exactly what the XSD admits). The
 * class is `preserve`, so the text is judged as read.
 */
export const drdExt = "^ext:[ a-zA-Z0-9|._]+$" as const;

/**
 * The `accessMode` union of the DRD XSD (`imsqtiv3p0_afa3p0drd_v1p0.xsd` element at line 131,
 * enumeration at lines 136 to 145), in XSD order, then the extension arm. The class is `preserve`:
 * a value with a trailing space is outside the pattern.
 */
export const drdAccessMode =
  "^(auditory|colour|itemSize|olfactory|orientation|position|tactile|textOnImage|textual|visual|ext:[ a-zA-Z0-9|._]+)$" as const;

/**
 * The `accessModeAdapted` union of the DRD XSD (`imsqtiv3p0_afa3p0drd_v1p0.xsd` element at line
 * 155, enumeration at lines 160 to 169), in XSD order, then the extension arm. The class is
 * `preserve`: a value with a trailing space is outside the pattern.
 */
export const drdAccessModeAdapted =
  "^(auditory|colour|itemSize|olfactory|orientation|position|tactile|textOnImage|textual|visual|ext:[ a-zA-Z0-9|._]+)$" as const;

/**
 * The `adaptationDetail` union of the DRD XSD (`imsqtiv3p0_afa3p0drd_v1p0.xsd` element at line 179,
 * enumeration at lines 187 to 192), in XSD order, then the extension arm. The class is `preserve`:
 * a value with a trailing space is outside the pattern.
 */
export const drdAdaptationDetail =
  "^(enhanced|verbatim|realTime|symbolic|recorded|synthesized|ext:[ a-zA-Z0-9|._]+)$" as const;

/**
 * The `adaptationMediaType` union of the DRD XSD (`imsqtiv3p0_afa3p0drd_v1p0.xsd` element at line
 * 199, enumeration at lines 207 to 217), in XSD order, then the extension arm. The class is
 * `preserve`: a value with a trailing space is outside the pattern.
 */
export const drdAdaptationMediaType =
  "^(Daisy|braille|NIMAS|MathML|ChemML|LaTeX|OEBPS|PDF|LIT|Nemeth|EPUB3|ext:[ a-zA-Z0-9|._]+)$" as const;

/**
 * The `adaptationType` union of the DRD XSD (`imsqtiv3p0_afa3p0drd_v1p0.xsd` element at line 224,
 * enumeration at lines 232 to 240), in XSD order, then the extension arm. The class is `preserve`:
 * a value with a trailing space is outside the pattern.
 */
export const drdAdaptationType =
  "^(alternativeText|audioDescription|captions|e-book|haptic|highContrast|longDescription|signLanguage|transcript|ext:[ a-zA-Z0-9|._]+)$" as const;

/**
 * The `apiInteroperable` union of the DRD XSD (`imsqtiv3p0_afa3p0drd_v1p0.xsd` element at line 247,
 * enumeration at lines 255 to 264), in XSD order, then the extension arm. The class is `preserve`:
 * a value with a trailing space is outside the pattern.
 */
export const drdApiInteroperable =
  "^(AndroidAccessibility|ARIA|ATK|AT-SPI|BlackberryAccessibility|iAccessible2|JavaAccessibility|MacOSXAccessibility|MSAA|UIAutomation|ext:[ a-zA-Z0-9|._]+)$" as const;

/**
 * The `controlFlexibility` union of the DRD XSD (`imsqtiv3p0_afa3p0drd_v1p0.xsd` element at line
 * 271, enumeration at lines 279 to 280), in XSD order, then the extension arm. The class is
 * `preserve`: a value with a trailing space is outside the pattern.
 */
export const drdControlFlexibility =
  "^(fullKeyboardControl|fullMouseControl|ext:[ a-zA-Z0-9|._]+)$" as const;

/**
 * The `displayTransformability` union of the DRD XSD (`imsqtiv3p0_afa3p0drd_v1p0.xsd` element at
 * line 287, enumeration at lines 295 to 306), in XSD order, then the extension arm. The class is
 * `preserve`: a value with a trailing space is outside the pattern.
 */
export const drdDisplayTransformability =
  "^(backgroundColour|cursorPresentation|fontFace|fontSize|fontWeight|foregroundColour|highlightPresentation|layout|letterSpacing|lineHeight|structurePresentation|wordSpacing|ext:[ a-zA-Z0-9|._]+)$" as const;

/**
 * The `educationalComplexityOfAdaptation` union of the DRD XSD (`imsqtiv3p0_afa3p0drd_v1p0.xsd`
 * element at line 313, enumeration at lines 321 to 322), in XSD order, then the extension arm. The
 * class is `preserve`: a value with a trailing space is outside the pattern.
 */
export const drdEducationalComplexityOfAdaptation =
  "^(enriched|simplified|ext:[ a-zA-Z0-9|._]+)$" as const;

/**
 * The `hazard` union of the DRD XSD (`imsqtiv3p0_afa3p0drd_v1p0.xsd` element at line 329,
 * enumeration at lines 337 to 340), in XSD order, then the extension arm. The class is `preserve`:
 * a value with a trailing space is outside the pattern.
 */
export const drdHazard =
  "^(flashing|sound|olfactoryHazard|motionSimulation|ext:[ a-zA-Z0-9|._]+)$" as const;

/**
 * The `lastUpdated` date of the usage-data XSD (`imsqti_usagedatav3p0_v1p0.xsd`), tightened to the
 * month and day ranges a regular expression can state, written for the value after `collapse`.
 * February and leap-day validity, which `xs:date` requires, is a guard's, not the pattern's.
 */
export const usageDate = "^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$" as const;
