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
