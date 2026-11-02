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
 * RFC 5646 (BCP 47) well-formedness: a language of two or three letters with up to three
 * three-letter extlangs, or four letters, or five to eight; an optional script (four letters), an
 * optional region (two letters or three digits), variants (five to eight alphanumerics, or a digit
 * and three alphanumerics), extensions (a singleton other than `x` and subtags of two to eight
 * alphanumerics) and a private-use tail; or the whole `x-` private-use form; or the empty string.
 * Written as classes and groups, without `\p` or lookarounds. Well-formedness only: no subtag
 * registry is consulted and the grandfathered tags are not admitted.
 */
export const bcp47 =
  "^(?:(?:[A-Za-z]{2,3}(?:-[A-Za-z]{3}){0,3}|[A-Za-z]{4}|[A-Za-z]{5,8})(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|[0-9]{3}))?(?:-(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(?:-[0-9A-WY-Za-wy-z](?:-[A-Za-z0-9]{2,8})+)*(?:-[xX](?:-[A-Za-z0-9]{1,8})+)?|[xX](?:-[A-Za-z0-9]{1,8})+)?$" as const;

/**
 * `xs:positiveInteger` lexical space: digits with an optional leading plus and at least one
 * non-zero digit, so the value is at least one.
 */
export const positiveInteger = "^\\+?0*[1-9][0-9]*$" as const;

/**
 * An `xs:double` whose value is strictly greater than zero: no sign, a mantissa with at least one
 * non-zero digit, an optional exponent. `INF` and `NaN` are refused (`normal-maximum` does not
 * admit them).
 */
export const positiveDouble =
  "^\\+?(?:[0-9]*[1-9][0-9]*(?:\\.[0-9]*)?|[0-9]*\\.[0-9]*[1-9][0-9]*)(?:[eE][+\\-]?[0-9]+)?$" as const;

/**
 * An `xs:double` whose value is zero or greater: an optional plus, no minus, no `INF` and no `NaN`.
 * A negative zero is refused too.
 */
export const nonNegativeDouble =
  "^\\+?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+\\-]?[0-9]+)?$" as const;

/**
 * `xs:decimal` lexical space: an optional sign and digits with an optional fraction, no exponent.
 */
export const xsDecimal = "^[+\\-]?([0-9]+(\\.[0-9]*)?|\\.[0-9]+)$" as const;

/**
 * `xs:int` lexical space: a signed integer of at most ten digits. The range check of `xs:int` is
 * not encoded.
 */
export const xsInt = "^[+\\-]?[0-9]{1,10}$" as const;

/**
 * `xs:int` tokens separated by single spaces, or the empty string
 * (`qti-position-object-interaction/@center-point`, an anonymous `xs:list` with no `minLength`,
 * `imsqti_asiv3p0p1_v1p0.xsd` line 30461; campaign decision 22 admits the empty list). Judged on
 * the collapsed value.
 */
export const integerList = "^([+\\-]?[0-9]+( [+\\-]?[0-9]+)*)?$" as const;

/**
 * An `xs:integer` or a `VariableStringDType` name (`[\i-[:]][\c-[:]]*`, an NCName,
 * `imsqti_asiv3p0p1_v1p0.xsd` line 24152), at most 256 characters.
 */
export const integerOrVariableString = `^(?:[+\\-]?[0-9]+|${ncNameBody})$` as const;

/**
 * One or more NCNames separated by single spaces: any `xs:IDREFS`-typed value, whose built-in
 * `minLength` is one. Judged on the collapsed value.
 */
export const ncNameList = `^${ncNameBody}(?: ${ncNameBody})*$` as const;

/**
 * NCNames separated by single spaces, or the empty string
 * (`qti-simple-associable-choice/@match-group`, an anonymous `xs:list` with no `minLength`,
 * `imsqti_asiv3p0p1_v1p0.xsd` line 24881; campaign decision 22).
 */
export const ncNameListOrEmpty = `^(?:${ncNameBody}(?: ${ncNameBody})*)?$` as const;

/**
 * A `class` list: space-separated tokens or the empty string (campaign decision 22: a list-typed
 * attribute whose XSD type sets no minimum length admits the empty list).
 */
export const classList = "^([^ \\t\\r\\n]+( [^ \\t\\r\\n]+)*)?$" as const;

/**
 * `qti-rubric-block/@view`: one or more of `author candidate proctor scorer testConstructor tutor`
 * separated by single spaces. The minimum of one is kept, an exception to campaign decision 22: the
 * attribute is required and the QTI prose rule reads "one or more" (`1ed2f744.md` section 5).
 */
export const viewList =
  "^(?:author|candidate|proctor|scorer|testConstructor|tutor)(?: (?:author|candidate|proctor|scorer|testConstructor|tutor))*$" as const;

/**
 * The `use` values of a rubric block: `instructions`, `scoring`, `navigation`, or an `ext:` name.
 */
export const useEnumExt = "^(instructions|scoring|navigation|ext:[a-zA-Z0-9_.-]+)$" as const;

/**
 * Media types separated by single spaces, or the empty list (`qti-upload-interaction/@type`, an
 * unbounded `xs:list`; campaign decision 22). Each token has the body of `mimeType`.
 */
export const mimeTypeList =
  "^(?:[^/ \\t\\r\\n]{1,127}/[^ \\t\\r\\n]{1,255}(?: [^/ \\t\\r\\n]{1,127}/[^ \\t\\r\\n]{1,255})*)?$" as const;

/**
 * A `printf`-style number format (R38): a percent sign, flags, a width, a precision and one of the
 * conversions `E e f G g r R i o X x`.
 */
export const printfFormat = "^%[#0 +-]*[0-9]*(\\.[0-9]+)?[EefGgrRioXx]$" as const;
