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
export const ncNameStart = "A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�\u{10000}-\u{EFFFF}" as const;

/**
 * The later characters of an NCName: the start characters and the NameChar additions of XML 1.0.
 */
export const ncNameContinuation = `${ncNameStart}\\-.0-9·̀-ͯ‿-⁀` as const;

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
 * `xs:nonNegativeInteger` lexical space: digits with an optional leading plus.
 */
export const xsNonNegativeInteger = "^\\+?[0-9]+$" as const;

/**
 * `xs:integer` lexical space: digits with an optional sign.
 */
export const xsInteger = "^[+\\-]?[0-9]+$" as const;

/**
 * The `xs:double` lexical space without anchors, so a list pattern can repeat it.
 */
const xsDoubleBody =
  "(?:[+\\-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+\\-]?[0-9]+)?|-?INF|NaN)" as const;

/**
 * `xs:double` lexical space: a decimal with an optional exponent, `INF`, `-INF`, or `NaN`.
 */
export const xsDouble = `^${xsDoubleBody}$` as const;

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
 * A collapsed spelling that parses as an integer but is not its canonical rendering: a leading plus
 * sign, a leading zero, or a negative zero. Such a spelling, and only such a one, is kept in
 * `AttributeSpelling.value`; a canonical spelling is the typed value's own rendering and cannot be
 * stored.
 */
export const nonCanonicalInteger = "^(?:\\+[0-9]+|-?0[0-9]+|-0)$" as const;

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
 * and `]`. Judged on the collapsed value.
 */
export const anyUri =
  "^(?:[A-Za-z][A-Za-z0-9+\\-.]*:(?://(?:(?:[^#%/?@\\[\\]]|%[0-9A-Fa-f]{2})*@)?(?:\\[[^\\]]*\\]|(?:[^#%/?:@\\[\\]]|%[0-9A-Fa-f]{2})*)(?::[0-9]+)?(?:/(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?|/(?:(?:[^#%/?\\[\\]]|%[0-9A-Fa-f]{2})(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?|(?:[^#%/?\\[\\]]|%[0-9A-Fa-f]{2})(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?|(?://(?:(?:[^#%/?@\\[\\]]|%[0-9A-Fa-f]{2})*@)?(?:\\[[^\\]]*\\]|(?:[^#%/?:@\\[\\]]|%[0-9A-Fa-f]{2})*)(?::[0-9]+)?(?:/(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?|/(?:(?:[^#%/?\\[\\]]|%[0-9A-Fa-f]{2})(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?|(?:[^#%/?:\\[\\]]|%[0-9A-Fa-f]{2})+(?:/(?:[^#%?\\[\\]]|%[0-9A-Fa-f]{2})*)?)?)(?:\\?(?:[^#%\\[\\]]|%[0-9A-Fa-f]{2})*)?(?:#(?:[^#%]|%[0-9A-Fa-f]{2})*)?$" as const;

/**
 * `xs:language` lexical space: dash-separated subtags of at most eight characters, the first
 * alphabetic. At most 128 subtags: a key or an index entry over the value needs a byte bound
 * grizzle can prove, and no valid tag comes near it.
 */
export const xsLanguage = "^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8}){0,127}$" as const;

/**
 * `xsLanguage` or the empty string: the LOM language bar (`LomStringLanguage.value`,
 * `LomLanguage.value`). It takes `xsLanguage`'s bound of 128 subtags, because a key over the value
 * needs a byte bound grizzle can prove.
 */
export const xsLanguageOrEmpty = "^(?:[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8}){0,127})?$" as const;

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
 * A tool name or version: at most 256 characters, written as 255 then an optional one, within the
 * engine's 255 repetition bound (R33).
 */
export const toolString = "^.{0,255}.?$" as const;

/**
 * The flags of `toolString`: `s` lets `.` match line terminators.
 */
export const toolStringFlags = "su" as const;

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
 * registry is consulted and the grandfathered tags are not admitted. Bounded for keys and index
 * entries, which need a byte bound grizzle can prove: at most 8 variants, 8 extensions of at most
 * 8 subtags each and 8 private-use subtags (95 subtags in all), so every non-empty value is an
 * `xsLanguage` value.
 */
export const bcp47 =
  "^(?:(?:[A-Za-z]{2,3}(?:-[A-Za-z]{3}){0,3}|[A-Za-z]{4}|[A-Za-z]{5,8})(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|[0-9]{3}))?(?:-(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3})){0,8}(?:-[0-9A-WY-Za-wy-z](?:-[A-Za-z0-9]{2,8}){1,8}){0,8}(?:-[xX](?:-[A-Za-z0-9]{1,8}){1,8})?|[xX](?:-[A-Za-z0-9]{1,8}){1,8})?$" as const;

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

/**
 * `CoordsDType` token (`imsqti_asiv3p0p1_v1p0.xsd` lines 24088 to 24092): digits with an optional
 * percent sign, judged on the value after whitespace replace.
 */
const coordsToken = "[0-9]+%?" as const;

/**
 * `shape="rect"` coordinates: exactly four comma-separated `CoordsDType` tokens, no spaces.
 */
export const coordsRect = `^${coordsToken}(?:,${coordsToken}){3}$` as const;

/**
 * `shape="ellipse"` coordinates: exactly four comma-separated tokens (centre and two radii).
 */
export const coordsEllipse = coordsRect;

/**
 * `shape="circle"` coordinates: exactly three comma-separated tokens.
 */
export const coordsCircle = `^${coordsToken}(?:,${coordsToken}){2}$` as const;

/**
 * `shape="poly"` coordinates: an even count of tokens, at least six.
 */
export const coordsPoly =
  `^${coordsToken}(?:,${coordsToken}){5}(?:,${coordsToken},${coordsToken})*$` as const;

/**
 * `CoordsDType` itself (`imsqti_asiv3p0p1_v1p0.xsd` lines 24088 to 24092): three tokens, four
 * tokens, or an even count of at least six.
 */
export const coordsAny =
  `^(?:${coordsToken}(?:,${coordsToken}){2}(?:,${coordsToken})?|${coordsToken}(?:,${coordsToken}){5}(?:,${coordsToken},${coordsToken})*)$` as const;

/**
 * `aria-relevant` (`imsqti_asiv3p0p1_v1p0.xsd` lines 24608 to 24612, default `additions text`): an
 * unbounded `xs:list` over `ARIARelevantListDType` (lines 23984 to 23992), so zero items are
 * admitted (campaign decision 22). Judged on the collapsed value. The item type's fifth value,
 * `additions text`, holds a space and can never be one list item, so it adds nothing.
 */
export const ariaRelevantList =
  "^(?:(?:additions|removals|text|all)(?: (?:additions|removals|text|all))*)?$" as const;

/**
 * A collapsed `IdentifierListDType` value: NCNames one space apart, with no leading, trailing or
 * doubled space. The empty list is admitted because the XSD list has no `minLength` (XSD line
 * 34443 of `imsqti_asiv3p0p1_v1p0.xsd`; campaign decision 22).
 */
export const identifierList = `^(?:${ncNameBody}(?: ${ncNameBody})*)?$` as const;

/**
 * A collapsed `ToleranceListDType` value: `xs:double` or NCName tokens one space apart (XSD line
 * 23973, a union of `xs:string` and `xs:double`). The empty list is admitted because the XSD list
 * has no `minLength` (line 27029; campaign decision 22); presence under `absolute` and `relative`
 * is a containment, not this pattern's.
 */
export const toleranceList =
  `^(?:(?:${xsDoubleBody}|${ncNameBody})(?: (?:${xsDoubleBody}|${ncNameBody}))*)?$` as const;

/**
 * The `CoordsDType` pattern of `imsqti_asiv3p0p1_v1p0.xsd` (line 24090), anchored: three
 * alternatives over `[0-9]+%?` and `,`, with no space admitted. The attribute's `whiteSpace` class
 * is `replace`, so a tab, line feed or carriage return becomes a space, which this refuses.
 */
export const coords =
  "^(?:(?:[0-9]+%?,){2}[0-9]+%?|(?:[0-9]+%?,){3}[0-9]+%?|(?:[0-9]+%?,){2}(?:(?:[0-9]+%?,){2})+[0-9]+%?,[0-9]+%?)$" as const;

/**
 * A collapsed integer or a variable reference: the mixed unions `min`, `max` and `step` of
 * `qti-any-n` and `qti-random-integer` and `figures`. A value whose collapse is a number is the
 * literal and a bare NCName as read is the reference; a padded reference admits neither member.
 */
export const integerOrVariableRef = `^(?:[+\\-]?[0-9]+|${ncNameBody})$` as const;

/**
 * A collapsed `xs:double` or a variable reference: `min` and `max` of `qti-random-float`.
 */
export const floatOrVariableRef = `^(?:${xsDoubleBody}|${ncNameBody})$` as const;

/**
 * An NCName or a collapsed integer: `n` of `qti-index` and `number-repeats` of `qti-repeat`. The
 * `xs:int` range is the typed copy's check, not this pattern's.
 */
export const intOrIdentifier = `^(?:${ncNameBody}|[+\\-]?[0-9]+)$` as const;

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

/**
 * The XSD's `\s` for a MathML pattern: the four XML space characters, as a class, because XSD's
 * `\s` is `[ \t\n\r]` and JavaScript's is wider. A MathML pattern whose XSD type is
 * `xs:string`-based keeps its own whitespace, so it carries this class where the XSD writes `\s*`.
 */
const mathmlSpace = "[ \\t\\n\\r]" as const;

/**
 * The `m:length` pattern of `mathml3-common.xsd` (line 96) without its anchors or its `\s*` ends:
 * a number with an optional unit, or a named math space. A list or union member holds this body
 * once the whitespace around it is gone.
 */
const mathmlLengthBody =
  "(?:-?[0-9]*(?:[0-9]\\.?|\\.[0-9])[0-9]*(?:e[mx]|in|cm|mm|p[xtc]|%)?|(?:negative)?(?:(?:very){0,2}thi(?:n|ck)|medium)mathspace)" as const;

/**
 * `m:length` (`mathml3-common.xsd` line 94, an `xs:string` restricted by the pattern at line 96):
 * a number with an optional unit (`em ex in cm mm px pt pc %`) or a named math space, with its own
 * leading and trailing space. The one concept of 26 attributes, as a pattern: the whitespace
 * class is `preserve`, so the space is the pattern's.
 */
export const mathmlLength = `^${mathmlSpace}*${mathmlLengthBody}${mathmlSpace}*$` as const;

/**
 * `m:mpadded-length` (`mathml3-presentation.xsd` line 46, an `xs:string` restricted by the pattern
 * at line 48): a number with an optional sign, then optionally a percent sign and a pseudo-unit
 * (`height depth width`), a unit or a named math space, with its own leading and trailing space.
 */
export const mathmlMpaddedLength =
  `^${mathmlSpace}*[+\\-]?[0-9]*(?:[0-9]\\.?|\\.[0-9])[0-9]*${mathmlSpace}*(?:(?:%?${mathmlSpace}*(?:height|depth|width)?)|e[mx]|in|cm|mm|p[xtc]|(?:(?:negative)?(?:(?:very){0,2}thi(?:n|ck)|medium)mathspace))?${mathmlSpace}*$` as const;

/**
 * The `m:color` pattern of `mathml3-presentation.xsd` (line 109) without its anchors or its `\s*`
 * ends: `#` and three or six hexadecimal digits, or one of the sixteen HTML color names in any
 * case (the XSD spells each letter as a two-case class).
 */
const mathmlColorBody =
  "(?:#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?|[aA][qQ][uU][aA]|[bB][lL][aA][cC][kK]|[bB][lL][uU][eE]|[fF][uU][cC][hH][sS][iI][aA]|[gG][rR][aA][yY]|[gG][rR][eE][eE][nN]|[lL][iI][mM][eE]|[mM][aA][rR][oO][oO][nN]|[nN][aA][vV][yY]|[oO][lL][iI][vV][eE]|[pP][uU][rR][pP][lL][eE]|[rR][eE][dD]|[sS][iI][lL][vV][eE][rR]|[tT][eE][aA][lL]|[wW][hH][iI][tT][eE]|[yY][eE][lL][lL][oO][wW])" as const;

/**
 * `m:color` (`mathml3-presentation.xsd` line 107, an `xs:string` restricted by the pattern at line
 * 109): a hexadecimal color or a named color, with its own leading and trailing space. The one
 * concept of `color` and `mathcolor`.
 */
export const mathmlColor = `^${mathmlSpace}*${mathmlColorBody}${mathmlSpace}*$` as const;

/**
 * `m:character` (`mathml3-presentation.xsd` line 102, an `xs:string` restricted by the pattern
 * `\s*\S\s*` at line 104): one character that is not an XML space character, with its own leading
 * and trailing space. `m:math/@decimalpoint` and `m:mstyle/@decimalpoint`.
 */
export const mathmlCharacter = `^${mathmlSpace}*[^ \\t\\n\\r]${mathmlSpace}*$` as const;

/**
 * The `align` of `m:mstack` and `m:mtable` (`mathml3-presentation.xsd` line 1710, an `xs:string`
 * restricted by a pattern in the attribute): a vertical alignment and an optional row number, with
 * its own leading and trailing space. Not an enumeration: the row number makes it open.
 */
export const mathmlAlign =
  `^${mathmlSpace}*(?:top|bottom|center|baseline|axis)(?:${mathmlSpace}+-?[0-9]+)?${mathmlSpace}*$` as const;

/**
 * `xs:NMTOKENS` (the `class` of `mathml3-common.xsd` line 18): one or more NMTOKENs, each one or
 * more XML NameChars, separated by single spaces. Judged on the collapsed value, so the empty
 * string is outside it (the built-in `minLength` is one). A NameChar is an NCName continuation
 * character or a colon.
 */
export const mathmlClass = `^[${ncNameContinuation}:]+(?: [${ncNameContinuation}:]+)*$` as const;

/**
 * `m:number` (`mathml3-presentation.xsd` line 99, restricting `xs:decimal`) as the REC states it:
 * `xs:decimal`'s lexical space without a leading plus sign (E A1: an explicit plus sign is not
 * allowed unless the syntax lists it). The `scriptsizemultiplier` value. `xsDecimal` stays ARIA's.
 * Judged on the collapsed value.
 */
export const mathmlNumber = "^-?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)$" as const;

/**
 * `m:unsigned-integer` (`mathml3-presentation.xsd` line 93, restricting `xs:unsignedLong`):
 * `xs:unsignedLong`'s lexical space without a leading plus sign, and its range
 * (`maxInclusive` 18446744073709551615, XSD 1.0 Part 2 section 3.3.21) written in the pattern:
 * leading zeros of any count, then one to nineteen significant digits or twenty bounded digit by
 * digit, or a minus sign and zeros (the XSD admits `-0`, whose value is zero, spelled with any
 * number of zeros). The bound is on the significant digits only: leading zeros are admitted, since
 * neither the XSD nor the REC bans them. `m:msline/@length`. Judged on the collapsed value.
 */
export const mathmlUnsignedInteger =
  "^(?:-0+|0*(?:[0-9]{1,19}|1[0-7][0-9]{18}|18[0-3][0-9]{17}|184[0-3][0-9]{16}|1844[0-5][0-9]{15}|18446[0-6][0-9]{14}|184467[0-3][0-9]{13}|1844674[0-3][0-9]{12}|184467440[0-6][0-9]{10}|1844674407[0-2][0-9]{9}|18446744073[0-6][0-9]{8}|1844674407370[0-8][0-9]{6}|18446744073709[0-4][0-9]{5}|184467440737095[0-4][0-9]{4}|18446744073709550[0-9]{3}|18446744073709551[0-5][0-9]{2}|1844674407370955160[0-9]|1844674407370955161[0-4]|18446744073709551615))$" as const;

/**
 * `xs:integer` lexical space without a leading plus sign: the contract base of `position`, `shift`
 * and `index` (E A1, D6; the REC's integer is an optional minus and digits). `scriptlevel` keeps
 * `xsInteger`, whose REC syntax lists the sign.
 */
export const mathmlInteger = "^-?[0-9]+$" as const;

/**
 * `xs:positiveInteger` lexical space without a leading plus sign: digits with at least one
 * non-zero digit, so the value is at least one. The contract base of `selection`, `base` and the
 * spans (E A1, D6).
 */
export const mathmlPositiveInteger = "^0*[1-9][0-9]*$" as const;

/**
 * `mathsize` (`mathml3-presentation.xsd` line 489): a union of `m:length` and the tokens `small`,
 * `normal` and `big`. As one pattern: the length member with its own space, a token member with the
 * space its collapse removes.
 */
export const mathmlMathsize =
  `^${mathmlSpace}*(?:${mathmlLengthBody}|small|normal|big)${mathmlSpace}*$` as const;

/**
 * `indentshiftfirst` and `indentshiftlast` (`mathml3-presentation.xsd` lines 305 and 328): a union
 * of `m:length` and the token `indentshift`, each member with the space its type gives it.
 */
export const mathmlIndentshiftLine =
  `^${mathmlSpace}*(?:${mathmlLengthBody}|indentshift)${mathmlSpace}*$` as const;

/**
 * `linethickness` and `mslinethickness` (`mathml3-presentation.xsd` lines 734 and 524): a union of
 * `m:length` and the tokens `thin`, `medium` and `thick`, each member with the space its type
 * gives it.
 */
export const mathmlLineThickness =
  `^${mathmlSpace}*(?:${mathmlLengthBody}|thin|medium|thick)${mathmlSpace}*$` as const;

/**
 * `charspacing` (`mathml3-presentation.xsd` line 907): a union of `m:length` and the tokens
 * `loose`, `medium` and `tight`, each member with the space its type gives it.
 */
export const mathmlCharspacing =
  `^${mathmlSpace}*(?:${mathmlLengthBody}|loose|medium|tight)${mathmlSpace}*$` as const;

/**
 * `maxsize` (`mathml3-presentation.xsd` line 221): a union of `m:length` and the token `infinity`,
 * each member with the space its type gives it.
 */
export const mathmlMaxsize =
  `^${mathmlSpace}*(?:${mathmlLengthBody}|infinity)${mathmlSpace}*$` as const;

/**
 * `altimg-valign` of `m:math` (`mathml3-presentation.xsd` line 1444): a union of `m:length` and the
 * tokens `top`, `middle` and `bottom`, each member with the space its type gives it.
 */
export const mathmlAltimgValign =
  `^${mathmlSpace}*(?:${mathmlLengthBody}|top|middle|bottom)${mathmlSpace}*$` as const;

/**
 * `width` of `m:mtable` (`mathml3-presentation.xsd` line 1780): a union of `m:length` and the token
 * `auto`, each member with the space its type gives it.
 */
export const mathmlTableWidth =
  `^${mathmlSpace}*(?:${mathmlLengthBody}|auto)${mathmlSpace}*$` as const;

/**
 * `background` and `mathbackground` (`mathml3-presentation.xsd` lines 654 and 566): a union of
 * `m:color` and the token `transparent`, each member with the space its type gives it.
 */
export const mathmlBackground =
  `^${mathmlSpace}*(?:${mathmlColorBody}|transparent)${mathmlSpace}*$` as const;

/**
 * `columnlines` and `rowlines` (`mathml3-presentation.xsd` lines 939 and 1331): an `xs:list` of
 * `m:linestyle` (`none solid dashed`) with `minLength` one. Judged on the collapsed value.
 */
export const mathmlLinestyleList = "^(?:none|solid|dashed)(?: (?:none|solid|dashed))*$" as const;

/**
 * `columnspacing` and `rowspacing` (`mathml3-presentation.xsd` lines 949 and 1341): an `xs:list` of
 * `m:length` with `minLength` one. Judged on the collapsed value, so an item holds no space of its
 * own.
 */
export const mathmlLengthList = `^${mathmlLengthBody}(?: ${mathmlLengthBody})*$` as const;

/**
 * `columnalign` of `m:math`, `m:mlabeledtr`, `m:mstyle` and `m:mtable`
 * (`mathml3-presentation.xsd` line 929): an `xs:list` of `m:columnalignstyle` (`left center
 * right`) with `minLength` one. Judged on the collapsed value.
 */
export const mathmlColumnalign = "^(?:left|center|right)(?: (?:left|center|right))*$" as const;

/**
 * `rowalign` of `m:math`, `m:mstyle` and `m:mtable` (`mathml3-presentation.xsd` line 1321): an
 * `xs:list` of `m:verticalalign` (`top bottom center baseline axis`) with `minLength` one. Judged
 * on the collapsed value.
 */
export const mathmlRowalign =
  "^(?:top|bottom|center|baseline|axis)(?: (?:top|bottom|center|baseline|axis))*$" as const;

/**
 * `crossout` (`mathml3-presentation.xsd` line 985): an `xs:list` of the tokens `none`,
 * `updiagonalstrike`, `downdiagonalstrike`, `verticalstrike` and `horizontalstrike`, with no
 * `minLength`, so the empty list is admitted (campaign decision 22). Judged on the collapsed
 * value.
 */
export const mathmlCrossout =
  "^(?:(?:none|updiagonalstrike|downdiagonalstrike|verticalstrike|horizontalstrike)(?: (?:none|updiagonalstrike|downdiagonalstrike|verticalstrike|horizontalstrike))*)?$" as const;

/**
 * `alignmentscope` (`mathml3-presentation.xsd` line 873): an `xs:list` of `true` and `false` with
 * `minLength` one. Judged on the collapsed value.
 */
export const mathmlAlignmentscope = "^(?:true|false)(?: (?:true|false))*$" as const;

/**
 * `columnwidth` (`mathml3-presentation.xsd` line 960): an `xs:list`, with `minLength` one, of a
 * union of `m:length` and the tokens `auto` and `fit`. Judged on the collapsed value.
 */
export const mathmlColumnwidth =
  `^(?:${mathmlLengthBody}|auto|fit)(?: (?:${mathmlLengthBody}|auto|fit))*$` as const;

/**
 * `framespacing` (`mathml3-presentation.xsd` line 1060): an `xs:list` of exactly two `m:length`
 * values. Judged on the collapsed value.
 */
export const mathmlFramespacing = `^${mathmlLengthBody} ${mathmlLengthBody}$` as const;

/**
 * `m:group-alignment-list` (`mathml3-presentation.xsd` line 120): an `xs:list` of
 * `m:group-alignment` (`left center right decimalpoint`) with `minLength` one, the `groupalign` of
 * `m:mtd`. Judged on the collapsed value.
 */
export const mathmlGroupAlignmentList =
  "^(?:left|center|right|decimalpoint)(?: (?:left|center|right|decimalpoint))*$" as const;

/**
 * `m:group-alignment-list-list` (`mathml3-presentation.xsd` line 128, an `xs:string` restricted by
 * the pattern at line 130): braced lists of group alignments, with its own space between and
 * around them. The empty string and a space-only string are admitted.
 */
export const mathmlGroupAlignmentListList =
  `^(?:${mathmlSpace}*\\{${mathmlSpace}*(?:left|center|right|decimalpoint)(?:${mathmlSpace}+(?:left|center|right|decimalpoint))*\\})*${mathmlSpace}*$` as const;
