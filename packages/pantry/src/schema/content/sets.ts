/**
 * The HTML content sets and the QTI elements each host adds to them.
 *
 * Each set is a tuple of HTML element names, derived from the ASI 3.0.1 XSD by walking a host
 * type's content model to its element references and keeping the names with no `qti-` prefix and
 * no namespace prefix. `HFLOW` is what `BaseHTML5FlowDType` admits, `HINL` what `HTMLTextDType`
 * admits, `PHR` what `BaseHTML5PhrasingDType` admits, and `HBLOCK` is `HFLOW` without `HINL`.
 * Run from `~/.cache/gr8des/qti3/xsd` as `python3 -I derive.py`:
 *
 * ```python
 * import xml.etree.ElementTree as E, os
 * XS="{http://www.w3.org/2001/XMLSchema}"
 * root=E.parse(os.path.expanduser("~/.cache/gr8des/qti3/xsd/imsqti_asiv3p0p1_v1p0.xsd")).getroot()
 * types={t.get("name"):t for t in root.iter(XS+"complexType")}
 * groups={g.get("name"):g for g in root.iter(XS+"group") if g.get("name")}
 * def walk(n,out):
 *     for c in n:
 *         if c.tag==XS+"element":
 *             nm=c.get("name") or c.get("ref")
 *             if nm: out.append(nm)
 *         elif c.tag==XS+"group" and c.get("ref"):
 *             walk(groups[c.get("ref").split(":")[-1]],out)
 *         elif c.tag in (XS+"sequence",XS+"choice",XS+"all",XS+"complexContent",XS+"extension",XS+"restriction"):
 *             walk(c,out)
 * def kids(t):
 *     out=[];walk(types[t],out);return out
 * def html(t):
 *     seen=[]
 *     for n in kids(t):
 *         if not n.startswith("qti-") and ":" not in n and n not in seen: seen.append(n)
 *     return seen
 * for name,t in (("HFLOW","BaseHTML5FlowDType"),("HINL","HTMLTextDType"),("HBLOCK","ItemBodyDType"),("PHR","BaseHTML5PhrasingDType")):
 *     s=html(t); print(name,t,len(s)); print(" ".join(sorted(s)))
 * fl, il = html("BaseHTML5FlowDType"), html("HTMLTextDType")
 * print("HBLOCK", len([n for n in fl if n not in il]))
 * ```
 *
 * It prints `HFLOW BaseHTML5FlowDType 54`, `HINL HTMLTextDType 28`, `HBLOCK 26` and
 * `PHR BaseHTML5PhrasingDType 27`. `ItemBodyDType`, `StimulusBodyDType` and
 * `HotTextInteractionDType` list only 25 HTML names: they omit `details`, which `HBLOCK` keeps as
 * the research's `HFLOW - HINL` (`docs/research/864e756f.md` section 3.3) defines it.
 *
 * `hostAdditions` is the QTI half of the host matrix (`864e756f.md` section 3.4): per host
 * handle, the QTI elements its content model admits beyond the HTML set, checked against the
 * element references of each host type in the same XSD. Elements outside a phase's roster
 * (`m3:math`, `xi:include`, SSML) are not listed; a consumer drops the QTI names its roster does
 * not hold yet. A host with no addition has no entry.
 */

/**
 * HTML flow: the HTML part of `FlowContentModel`, what `BaseHTML5FlowDType` admits (54).
 */
export const HFLOW = [
  "a",
  "abbr",
  "acronym",
  "address",
  "article",
  "aside",
  "audio",
  "b",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "br",
  "cite",
  "code",
  "details",
  "dfn",
  "div",
  "dl",
  "em",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "i",
  "img",
  "kbd",
  "label",
  "nav",
  "object",
  "ol",
  "p",
  "picture",
  "pre",
  "q",
  "ruby",
  "samp",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tt",
  "ul",
  "var",
  "video",
] as const;

/**
 * HTML inline: the HTML part of `InlineContentModel`, what `HTMLTextDType` admits (28). A subset of
 * `HFLOW`.
 */
export const HINL = [
  "a",
  "abbr",
  "acronym",
  "b",
  "bdi",
  "bdo",
  "big",
  "br",
  "cite",
  "code",
  "dfn",
  "em",
  "i",
  "img",
  "kbd",
  "label",
  "object",
  "picture",
  "q",
  "ruby",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "tt",
  "var",
] as const;

/**
 * HTML block: `HFLOW` without `HINL` (26).
 */
export const HBLOCK = [
  "address",
  "article",
  "aside",
  "audio",
  "blockquote",
  "details",
  "div",
  "dl",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "ul",
  "video",
] as const;

/**
 * Phrasing: `PhrasingContentModelHTML5`, what `BaseHTML5PhrasingDType` admits (27): inline without
 * `acronym`, `big` and `tt`, with `audio` and `video`.
 */
export const PHR = [
  "a",
  "abbr",
  "audio",
  "b",
  "bdi",
  "bdo",
  "br",
  "cite",
  "code",
  "dfn",
  "em",
  "i",
  "img",
  "kbd",
  "label",
  "object",
  "picture",
  "q",
  "ruby",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "var",
  "video",
] as const;

/**
 * The names of the four HTML content sets.
 */
export type ContentSetName = "HFLOW" | "HINL" | "HBLOCK" | "PHR";

const sets = { HBLOCK, HFLOW, HINL, PHR } as const satisfies Readonly<
  Record<ContentSetName, readonly string[]>
>;

/**
 * The tuple a set name stands for.
 */
export const setOf = <Name extends ContentSetName>(name: Name): (typeof sets)[Name] => sets[name];

const printedVariable = ["qti-printed-variable"] as const;

const feedbackInline = ["qti-feedback-inline"] as const;

const feedbackBlock = ["qti-feedback-block"] as const;

const templateInline = ["qti-template-inline"] as const;

const templateBlock = ["qti-template-block"] as const;

/**
 * `qti-text-entry-interaction` and the two other interactions that sit inside a line of text.
 */
const inlineInteractions = [
  "qti-text-entry-interaction",
  "qti-inline-choice-interaction",
  "qti-end-attempt-interaction",
] as const;

/**
 * The custom interaction, which the matrix lists beside the inline interactions.
 */
const customInteraction = ["qti-custom-interaction"] as const;

/**
 * The 17 block interactions, `qti-portable-custom-interaction` among them.
 */
const blockInteractions = [
  "qti-associate-interaction",
  "qti-choice-interaction",
  "qti-drawing-interaction",
  "qti-extended-text-interaction",
  "qti-gap-match-interaction",
  "qti-graphic-associate-interaction",
  "qti-graphic-gap-match-interaction",
  "qti-graphic-order-interaction",
  "qti-hotspot-interaction",
  "qti-hottext-interaction",
  "qti-match-interaction",
  "qti-media-interaction",
  "qti-order-interaction",
  "qti-portable-custom-interaction",
  "qti-select-point-interaction",
  "qti-slider-interaction",
  "qti-upload-interaction",
] as const;

/**
 * What a block-flow host admits: every addition of the matrix's flow rows.
 */
const flowHost = [
  ...printedVariable,
  ...feedbackInline,
  ...feedbackBlock,
  ...templateInline,
  ...templateBlock,
  ...inlineInteractions,
  ...customInteraction,
  ...blockInteractions,
  "qti-hottext",
] as const;

/**
 * What a text host admits: the inline additions, `qti-hottext` and `qti-gap`.
 */
const textHost = [
  ...printedVariable,
  ...feedbackInline,
  ...templateInline,
  ...inlineInteractions,
  ...customInteraction,
  "qti-hottext",
  "qti-gap",
] as const;

/**
 * What a choice or label host admits: the printed variable, feedback and template.
 */
const choiceHost = [...printedVariable, ...feedbackInline, ...templateInline] as const;

/**
 * Per host handle, the QTI elements it admits beyond its HTML set. A dotted handle is the content
 * body of that container (`qti-content-body.feedback` is the body of a `qti-feedback-block`).
 */
// oxlint-disable-next-line anti-slop/no-known-value-widening -- the contract is an open map from any host handle to its additions; a consumer looks hosts up by handle.
export const hostAdditions: Readonly<Record<string, readonly string[]>> = {
  a: textHost,
  abbr: textHost,
  acronym: textHost,
  address: textHost,
  article: flowHost,
  aside: flowHost,
  b: textHost,
  big: textHost,
  caption: flowHost,
  cite: textHost,
  code: textHost,
  dd: flowHost,
  dfn: textHost,
  div: [...flowHost, "qti-position-object-stage"],
  dt: textHost,
  em: textHost,
  figcaption: flowHost,
  footer: flowHost,
  h1: textHost,
  h2: textHost,
  h3: textHost,
  h4: textHost,
  h5: textHost,
  h6: textHost,
  header: flowHost,
  i: textHost,
  kbd: textHost,
  label: flowHost,
  li: flowHost,
  nav: flowHost,
  p: textHost,
  pre: textHost,
  q: textHost,
  "qti-content-body.feedback": [
    ...printedVariable,
    ...feedbackInline,
    ...feedbackBlock,
    ...templateInline,
    ...templateBlock,
    ...customInteraction,
    ...blockInteractions,
    "qti-position-object-stage",
  ],
  "qti-content-body.modal": [
    ...printedVariable,
    ...templateInline,
    ...templateBlock,
    "qti-hottext",
  ],
  "qti-content-body.rubric": [...printedVariable, ...templateInline, ...templateBlock],
  "qti-content-body.rubricTemplate": printedVariable,
  "qti-content-body.template": [
    ...printedVariable,
    ...feedbackInline,
    ...feedbackBlock,
    ...templateInline,
    ...templateBlock,
  ],
  "qti-feedback-inline": [...printedVariable, ...templateInline],
  "qti-gap-match-interaction": [...feedbackBlock, ...templateBlock],
  "qti-gap-text": choiceHost,
  "qti-hottext": choiceHost,
  "qti-hottext-interaction": [...feedbackBlock, ...templateBlock],
  "qti-inline-choice": choiceHost,
  "qti-item-body": [
    ...feedbackBlock,
    ...templateBlock,
    ...customInteraction,
    ...blockInteractions,
    "qti-rubric-block",
    "qti-position-object-stage",
  ],
  "qti-label": choiceHost,
  "qti-simple-associable-choice": [...choiceHost, ...feedbackBlock, ...templateBlock],
  "qti-simple-choice": [...choiceHost, ...feedbackBlock, ...templateBlock],
  "qti-template-inline": [
    ...printedVariable,
    ...feedbackInline,
    ...templateInline,
    "qti-hottext",
    "qti-gap",
  ],
  "qti-template-inline.rubric": printedVariable,
  samp: textHost,
  section: flowHost,
  small: textHost,
  span: textHost,
  strong: textHost,
  sub: textHost,
  sup: textHost,
  td: flowHost,
  th: flowHost,
  tt: textHost,
  var: textHost,
};
