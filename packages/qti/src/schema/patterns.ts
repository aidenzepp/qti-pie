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
 * The `role` values of `ARIABaseDType` (`imsqti_asiv3p0p1_v1p0.xsd` lines 24404 to 24488, the
 * anonymous restriction of `@role`; the XSD names no `ARIARoleDType`): 74 values.
 */
export const ariaRole =
  "^(?:a(?:lert(?:dialog)?|pplication|rticle)|b(?:anner|utton)|c(?:heckbox|o(?:de|lumnheader|m(?:bobox|plementary)|ntentinfo))|d(?:e(?:finition|letion)|ialog|ocument)|emphasis|f(?:igure|orm)|g(?:eneric|r(?:id(?:cell)?|oup))|heading|i(?:mg|nsertion)|l(?:i(?:nk|st(?:box|item)?)|og)|m(?:a(?:in|rquee|th)|e(?:nu(?:bar|item(?:checkbox|radio)?)?|ter))|n(?:avigation|ote)|option|pr(?:esentation|ogressbar)|r(?:adio(?:group)?|egion|ow(?:group|header)?)|s(?:crollbar|e(?:arch(?:box)?|parator)|lider|pinbutton|t(?:atus|rong)|u(?:bscript|perscript)|witch)|t(?:ab(?:list|panel)?|e(?:rm|xtbox)|imer?|ool(?:bar|tip)|ree(?:grid|item)?))$" as const;

/**
 * The values of `aria-live`, default `off`: lines 24496 to 24509 (`imsqti_asiv3p0p1_v1p0.xsd`).
 */
export const ariaLive = "^(off|polite|assertive)$" as const;

/**
 * The values of `aria-orientation`, default `horizontal`: lines 24510 to 24522
 * (`imsqti_asiv3p0p1_v1p0.xsd`).
 */
export const ariaOrientation = "^(vertical|horizontal)$" as const;

/**
 * The values of `aria-autocomplete`, default `none`: lines 24527 to 24541
 * (`imsqti_asiv3p0p1_v1p0.xsd`).
 */
export const ariaAutocomplete = "^(inline|list|both|none)$" as const;

/**
 * The values of `aria-checked`, default `undefined`: lines 24543 to 24557
 * (`imsqti_asiv3p0p1_v1p0.xsd`).
 */
export const ariaChecked = "^(true|false|mixed|undefined)$" as const;

/**
 * The values of `aria-expanded`, default `undefined`: lines 24559 to 24572
 * (`imsqti_asiv3p0p1_v1p0.xsd`).
 */
export const ariaExpanded = "^(true|false|undefined)$" as const;

/**
 * The values of `aria-invalid`, default `false`: lines 24574 to 24588
 * (`imsqti_asiv3p0p1_v1p0.xsd`).
 */
export const ariaInvalid = "^(true|false|grammar|spelling)$" as const;

/**
 * The values of `aria-pressed`, default `undefined`: lines 24592 to 24606
 * (`imsqti_asiv3p0p1_v1p0.xsd`).
 */
export const ariaPressed = "^(true|false|mixed|undefined)$" as const;

/**
 * The values of `aria-selected`, default `undefined`: lines 24614 to 24627
 * (`imsqti_asiv3p0p1_v1p0.xsd`).
 */
export const ariaSelected = "^(true|false|undefined)$" as const;

/**
 * The values of `aria-sort`, default `none`: lines 24629 to 24643 (`imsqti_asiv3p0p1_v1p0.xsd`).
 */
export const ariaSort = "^(ascending|descending|none|other)$" as const;

/**
 * The values of `aria-current`, default `false`: lines 24649 to 24669
 * (`imsqti_asiv3p0p1_v1p0.xsd`).
 */
export const ariaCurrent = "^(page|step|location|date|time|true|false|undefined)$" as const;

/**
 * `aria-relevant` (`imsqti_asiv3p0p1_v1p0.xsd` lines 24608 to 24612, default `additions text`): an
 * unbounded `xs:list` over `ARIARelevantListDType` (lines 23984 to 23992), so zero items are
 * admitted (campaign decision 22). Judged on the collapsed value. The item type's fifth value,
 * `additions text`, holds a space and can never be one list item, so it adds nothing.
 */
export const ariaRelevantList =
  "^(?:(?:additions|removals|text|all)(?: (?:additions|removals|text|all))*)?$" as const;

/**
 * `@autoplay` of 3.0.1 (`imsqti_asiv3p0p1_v1p0.xsd` line 24978): `true`, `false` or the attribute
 * name. Version 3.0.0 types it `xs:boolean`, which is `xsBoolean`.
 */
export const autoplayEnum = "^(true|false|autoplay)$" as const;

/**
 * `@loop` of 3.0.1 (`imsqti_asiv3p0p1_v1p0.xsd` line 24995): `true`, `false` or the attribute name.
 * Version 3.0.0 types it `xs:boolean`, which is `xsBoolean`.
 */
export const loopEnum = "^(true|false|loop)$" as const;

/**
 * `@muted` of 3.0.1 (`imsqti_asiv3p0p1_v1p0.xsd` line 25011): `true`, `false` or the attribute
 * name. Version 3.0.0 types it `xs:boolean`, which is `xsBoolean`.
 */
export const mutedEnum = "^(true|false|muted)$" as const;

/**
 * `@controls` of 3.0.1 (`imsqti_asiv3p0p1_v1p0.xsd` line 25027): `true`, `false` or the attribute
 * name. Version 3.0.0 types it `xs:boolean`, which is `xsBoolean`.
 */
export const controlsEnum = "^(true|false|controls)$" as const;

/**
 * `@default` of 3.0.1 (`imsqti_asiv3p0p1_v1p0.xsd` line 33596): `true`, `false` or the attribute
 * name. Version 3.0.0 types it `xs:boolean`, which is `xsBoolean`.
 */
export const defaultEnum = "^(true|false|default)$" as const;

/**
 * The values of `@dir`, default `auto` (line 25231) in `imsqti_asiv3p0p1_v1p0.xsd`.
 */
export const dirEnum = "^(ltr|rtl|auto)$" as const;

/**
 * The values of `data-qti-suppress-tts` (line 25247) in `imsqti_asiv3p0p1_v1p0.xsd`.
 */
export const suppressTts = "^(computer-read-aloud|screen-reader|all)$" as const;

/**
 * The values of `qti-param/@valuetype`, required (line 34491) in `imsqti_asiv3p0p1_v1p0.xsd`.
 */
export const valuetype = "^(DATA|REF)$" as const;

/**
 * The values of `td/@scope` (line 32491) in `imsqti_asiv3p0p1_v1p0.xsd`.
 */
export const scope = "^(row|col|rowgroup|colgroup)$" as const;

/**
 * The values of `@align` of table cells (line 32510) in `imsqti_asiv3p0p1_v1p0.xsd`.
 */
export const align = "^(left|center|right|justify|char)$" as const;

/**
 * The values of `@valign` of table cells (line 32527) in `imsqti_asiv3p0p1_v1p0.xsd`.
 */
export const valign = "^(bottom|middle|top|baseline)$" as const;

/**
 * The values of `@preload`, default `metadata` (line 24963) in `imsqti_asiv3p0p1_v1p0.xsd`.
 */
export const preload = "^(none|auto|metadata)$" as const;

/**
 * The values of `@crossorigin` (line 24950) in `imsqti_asiv3p0p1_v1p0.xsd`.
 */
export const crossorigin = "^(anonymous|use-credentials)$" as const;

/**
 * The values of `track/@kind` (line 33578) in `imsqti_asiv3p0p1_v1p0.xsd`.
 */
export const trackKind = "^(subtitles|captions|descriptions|chapters|metadata)$" as const;

/**
 * The values of `qti-extended-text-interaction/@format`, default `plain` (line 27165) in
 * `imsqti_asiv3p0p1_v1p0.xsd`.
 */
export const textFormat = "^(plain|preformatted|xhtml)$" as const;

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
 * The eleven `base-type` values of `TestVariablesBaseType` in `imsqti_asiv3p0p1_v1p0.xsd`, in XSD
 * order: `boolean directedPair duration file float identifier integer pair point string uri`. The
 * `whiteSpace` class is `preserve`, so a padded value is refused as the XSD refuses it. Phase 1's
 * `BaseType` roster stays the column type elsewhere.
 */
export const baseType =
  "^(boolean|directedPair|duration|file|float|identifier|integer|pair|point|string|uri)$" as const;

/**
 * The three `tolerance-mode` values of the ASI XSD, in XSD order: `absolute exact relative`.
 */
export const toleranceMode = "^(absolute|exact|relative)$" as const;

/**
 * The two `rounding-mode` values of the ASI XSD, in XSD order: `decimalPlaces significantFigures`.
 */
export const roundingMode = "^(decimalPlaces|significantFigures)$" as const;

/**
 * The five `shape` values of the ASI XSD, in XSD order: `circle default ellipse poly rect`.
 */
// oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the XSD attribute name of the hotspot enumeration (`circle default ellipse poly rect`), the contract the interaction and processing modules name, not a structure.
export const shape = "^(circle|default|ellipse|poly|rect)$" as const;

/**
 * The 28 `name` values of `qti-math-operator` (`MathOperatorDType`), in XSD order: `sin cos tan
 * sec csc cot asin acos atan atan2 asec acsc acot sinh cosh tanh sech csch coth log ln exp abs
 * signum floor ceil toDegrees toRadians`.
 */
export const mathOperatorName =
  "^(sin|cos|tan|sec|csc|cot|asin|acos|atan|atan2|asec|acsc|acot|sinh|cosh|tanh|sech|csch|coth|log|ln|exp|abs|signum|floor|ceil|toDegrees|toRadians)$" as const;

/**
 * The five `name` values of `qti-stats-operator` (`StatsOperatorDType`), in XSD order: `mean
 * sampleVariance sampleSD popVariance popSD`.
 */
export const statsOperatorName = "^(mean|sampleVariance|sampleSD|popVariance|popSD)$" as const;

/**
 * The two `name` values of `qti-math-constant` (`MathConstantDType`), in XSD order: `pi e`.
 */
export const mathConstantName = "^(pi|e)$" as const;

/**
 * The two `parse` values of `xi:include` (`parseType` in `w3/XInclude.xsd`): `xml text`.
 */
export const xincludeParse = "^(xml|text)$" as const;

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
