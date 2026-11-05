/**
 * The generated MathML coverage blocks, part 1: the host blocks and the presentation kind blocks
 * (spec MA05, 4.11's generated positives). The corpus exercises 16 MathML kinds, so the coverage of
 * the other 178 is generated. Registering the blocks as fixtures is p6-36's and p6-37's; the
 * content-markup kind blocks, the attribute blocks, the padded block and the grouping under the
 * fixture cap are the next two slices'.
 *
 * A block is `{ name, part, version, site, xml, handles, pairs }`. `xml` is a fragment written with
 * the QTI namespace as the default and `m` for MathML, so the base item declares `xmlns:m`; `site`
 * says where a `ReplaceText` puts it: `"body"` inside `qti-item-body`, `"item"` after it as a child
 * of `qti-assessment-item` (the one host that needs it is `qti-modal-feedback`, which is no part of
 * the body). `handles` is what the block covers: for a host block the host handle first, then the
 * MathML handles inside it; for a kind block its MathML handles. `pairs` is every MathML
 * `(kind, attribute)` pair the fragment writes. `part` is `"host"`, `"kind"`, `"attribute"` or
 * `"padded"`; this slice writes the first two, and every block is for a 3.0.0 base item.
 *
 * A host block puts `m:math` under one roster host of spec 3.4: the 63 entries of the composed
 * inventory whose children name `m3:math`. An HTML host sits inside a `div`, with the parent it
 * needs (`td` in a table row, `li` in a `ul`, `dd` in a `dl`, `figcaption` in a `figure`); an ASI
 * host sits inside the interaction or container it needs. The blocks use these identifiers, which
 * the base item that carries them declares or ignores: `FEEDBACK` (outcome), `RESPONSE_GM`,
 * `RESPONSE_HT`, `RESPONSE_IC`, `RESPONSE_CH` and `RESPONSE_AS` (responses).
 *
 * A presentation handle is one of the 40 concrete elements of `mathml3-presentation.xsd`, plus
 * `m:math`, `m:semantics` and `m:annotation`: 43. Each has a block of its own, in a placement the
 * XSD admits that also meets the content models of `schema/mathml/models.ts` (`modelFinding`) and
 * the non-local checks of spec 4.8a: `m:mglyph` carries `src` and `alt`, `m:maligngroup` sits as
 * the first element of an `m:mtd` that is a cell of an `m:mtr`, and an `m:mscarries` is followed by
 * a row. `m:annotation-xml` and the content markup are not covered here.
 *
 * The data is the output of this script, run as `python3 -I gen_blocks.py <inventory.json>
 * <packages/pantry> <out>` with the MathML leaf inventory of the planner
 * (`work/planning/6b1227f0/inventory.json`), the XSDs cached at `~/.cache/gr8des/qti3/xsd/` and the
 * worktree's `packages/pantry`; the exports below are `<out>/data.ts.txt`, formatted with `vp fmt`.
 * The script also writes each block inside a base item to `<out>/items/<name>.xml`, which the
 * oracle validated:
 *
 * ```python
 * """Generate the host and presentation coverage blocks of src/test/mathml-blocks.ts.
 *
 * Usage: python3 -I gen_blocks.py <inventory.json> <packages/pantry dir> <out dir>
 *
 * Writes <out dir>/data.ts.txt (the exported data), <out dir>/blocks.json and <out dir>/items/<name>.xml (each block inside a base
 * item, for the xmllint oracle). It reads the MathML leaf inventory (`inventory.json`), the ASI XSD
 * and the roster hosts of `src/schema/content/inventory/{asi,html}.ts`.
 * """
 * import json, os, re, sys, xml.etree.ElementTree as E
 *
 * XS = "{http://www.w3.org/2001/XMLSchema}"
 * XSD = os.path.expanduser("~/.cache/gr8des/qti3/xsd/mathml/")
 * NS = 'xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:m="http://www.w3.org/1998/Math/MathML"'
 * inv, pkg, out = sys.argv[1], sys.argv[2], sys.argv[3]
 * leaf = json.load(open(inv))["elements"]
 *
 * # -- the roster hosts: every entry of the ASI and HTML leaves whose children name m3:math
 * hosts = []
 * for name in ("asi", "html"):
 *     text = open(os.path.join(pkg, "src/schema/content/inventory/%s.ts" % name)).read()
 *     for entry in re.split(r'\n  (?=["a-zA-Z][^\n]*: \{\n)', text):
 *         h = re.search(r'\n    handle: "([^"]+)"', entry)
 *         if h and 'child("m3:math"' in entry:
 *             hosts.append(h.group(1))
 *
 * M = "<m:math><m:mi>x</m:mi></m:math>"
 * # -- an ASI host: (the fragment's site, the fragment with {M} where m:math goes)
 * FB = 'outcome-identifier="FEEDBACK" identifier="FB" show-hide="show"'
 * TPL = 'template-identifier="TPL" identifier="TPLID" show-hide="show"'
 * GM = '<qti-gap-text identifier="GT" match-max="1">a</qti-gap-text>'
 * ASI = {
 *     "qti-item-body": ("body", "{M}"),
 *     "qti-content-body.feedback": ("body", "<qti-feedback-block %s><qti-content-body>{M}</qti-content-body></qti-feedback-block>" % FB),
 *     "qti-content-body.modal": ("item", "<qti-modal-feedback %s><qti-content-body>{M}</qti-content-body></qti-modal-feedback>" % FB),
 *     "qti-content-body.rubric": ("body", '<qti-rubric-block use="instructions" view="scorer"><qti-content-body>{M}</qti-content-body></qti-rubric-block>'),
 *     "qti-content-body.rubricTemplate": ("body", '<qti-rubric-block use="instructions" view="scorer"><qti-content-body><qti-template-block %s><qti-content-body>{M}</qti-content-body></qti-template-block></qti-content-body></qti-rubric-block>' % TPL),
 *     "qti-content-body.template": ("body", "<qti-template-block %s><qti-content-body>{M}</qti-content-body></qti-template-block>" % TPL),
 *     "qti-feedback-inline": ("body", "<p><qti-feedback-inline %s>{M}</qti-feedback-inline></p>" % FB),
 *     "qti-gap-match-interaction": ("body", '<qti-gap-match-interaction response-identifier="RESPONSE_GM" max-associations="1">%s{M}<p><qti-gap identifier="G"/></p></qti-gap-match-interaction>' % GM),
 *     "qti-gap-text": ("body", '<qti-gap-match-interaction response-identifier="RESPONSE_GM" max-associations="1"><qti-gap-text identifier="GT" match-max="1">{M}</qti-gap-text><p><qti-gap identifier="G"/></p></qti-gap-match-interaction>'),
 *     "qti-hottext": ("body", '<qti-hottext-interaction response-identifier="RESPONSE_HT" max-choices="1"><p><qti-hottext identifier="HT">{M}</qti-hottext></p></qti-hottext-interaction>'),
 *     "qti-hottext-interaction": ("body", '<qti-hottext-interaction response-identifier="RESPONSE_HT" max-choices="1">{M}<p><qti-hottext identifier="HT">a</qti-hottext></p></qti-hottext-interaction>'),
 *     "qti-inline-choice": ("body", '<p><qti-inline-choice-interaction response-identifier="RESPONSE_IC"><qti-inline-choice identifier="IC">{M}</qti-inline-choice></qti-inline-choice-interaction></p>'),
 *     "qti-label": ("body", '<p><qti-inline-choice-interaction response-identifier="RESPONSE_IC"><qti-label>{M}</qti-label><qti-inline-choice identifier="IC">a</qti-inline-choice></qti-inline-choice-interaction></p>'),
 *     "qti-prompt": ("body", '<qti-choice-interaction response-identifier="RESPONSE_CH" max-choices="1"><qti-prompt>{M}</qti-prompt><qti-simple-choice identifier="CH">a</qti-simple-choice></qti-choice-interaction>'),
 *     "qti-simple-associable-choice": ("body", '<qti-associate-interaction response-identifier="RESPONSE_AS" max-associations="1"><qti-simple-associable-choice identifier="AS" match-max="1">{M}</qti-simple-associable-choice></qti-associate-interaction>'),
 *     "qti-simple-choice": ("body", '<qti-choice-interaction response-identifier="RESPONSE_CH" max-choices="1"><qti-simple-choice identifier="CH">{M}</qti-simple-choice></qti-choice-interaction>'),
 *     "qti-template-inline": ("body", "<p><qti-template-inline %s>{M}</qti-template-inline></p>" % TPL),
 *     "qti-template-inline.rubric": ("body", '<qti-rubric-block use="instructions" view="scorer"><qti-content-body><p><qti-template-inline %s>{M}</qti-template-inline></p></qti-content-body></qti-rubric-block>' % TPL),
 * }
 *
 * def host_fragment(h):
 *     if h in ASI:
 *         site, frag = ASI[h]
 *         return site, frag.replace("{M}", M)
 *     return "body", "<div><%s>%s</%s></div>" % (h, M, h) if h == "div" else wrap_html(h)
 *
 * def wrap_html(h):
 *     # an HTML host inside a div; a table cell inside table/tr, a list item inside ul, dd/dt inside dl
 *     inner = "<%s>%s</%s>" % (h, M, h)
 *     if h in ("td", "th"): inner = "<table><tbody><tr>%s</tr></tbody></table>" % inner
 *     if h == "caption": inner = "<table>%s<tbody><tr><td>a</td></tr></tbody></table>" % inner
 *     if h == "li": inner = "<ul>%s</ul>" % inner
 *     if h in ("dd", "dt"): inner = "<dl>%s</dl>" % inner
 *     if h == "figcaption": inner = "<figure>%s</figure>" % inner
 *     if h == "a": inner = '<a href="a.html">%s</a>' % M
 *     if h == "object": inner = '<object data="o.png" type="image/png">%s</object>' % M
 *     return "<div>%s</div>" % inner
 *
 * # -- the presentation handles: the concrete elements of mathml3-presentation.xsd, and math, semantics, annotation
 * pres_root = E.parse(XSD + "mathml3-presentation.xsd").getroot()
 * presentation = [c.get("name") for c in pres_root if c.tag == XS + "element" and c.get("name") in leaf]
 * presentation = ["math"] + presentation + ["semantics", "annotation"]
 *
 * KIND = {  # a snippet inside m:math; the default is the element around one m:mi (a token around text)
 *     "math": '<m:math display="block"><m:mi>x</m:mi></m:math>',
 *     "mi": "<m:mi>x</m:mi>", "mn": "<m:mn>1</m:mn>", "mo": "<m:mo>+</m:mo>", "mtext": "<m:mtext>t</m:mtext>",
 *     "ms": "<m:ms>s</m:ms>", "mspace": '<m:mspace width="1em"/>',
 *     "mglyph": '<m:mi><m:mglyph src="glyph.png" alt="glyph"/></m:mi>',
 *     "malignmark": "<m:mi>x<m:malignmark/></m:mi>",
 *     "maligngroup": "<m:mtable><m:mtr><m:mtd><m:maligngroup/><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable>",
 *     "msline": "<m:mstack><m:mn>12</m:mn><m:msline/></m:mstack>",
 *     "none": "<m:mmultiscripts><m:mi>x</m:mi><m:mi>a</m:mi><m:none/></m:mmultiscripts>",
 *     "mprescripts": "<m:mmultiscripts><m:mi>x</m:mi><m:mprescripts/><m:mi>a</m:mi><m:mi>b</m:mi></m:mmultiscripts>",
 *     "mmultiscripts": "<m:mmultiscripts><m:mi>x</m:mi><m:mi>a</m:mi><m:mi>b</m:mi><m:mprescripts/><m:none/><m:mi>c</m:mi></m:mmultiscripts>",
 *     "mtable": "<m:mtable><m:mtr><m:mtd><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable>",
 *     "mlabeledtr": "<m:mtable><m:mlabeledtr><m:mtd><m:mi>l</m:mi></m:mtd><m:mtd><m:mi>x</m:mi></m:mtd></m:mlabeledtr></m:mtable>",
 *     "mtr": "<m:mtable><m:mtr><m:mtd><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable>",
 *     "mtd": "<m:mtable><m:mtr><m:mtd><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable>",
 *     "mstack": "<m:mstack><m:mn>12</m:mn></m:mstack>",
 *     "msgroup": "<m:mstack><m:msgroup><m:mn>1</m:mn></m:msgroup></m:mstack>",
 *     "msrow": "<m:mstack><m:msrow><m:mo>+</m:mo><m:mn>3</m:mn></m:msrow></m:mstack>",
 *     "mscarries": "<m:mstack><m:mscarries><m:mscarry><m:mn>1</m:mn></m:mscarry></m:mscarries><m:mn>12</m:mn></m:mstack>",
 *     "mscarry": "<m:mstack><m:mscarries><m:mscarry><m:mn>1</m:mn></m:mscarry></m:mscarries><m:mn>12</m:mn></m:mstack>",
 *     "mlongdiv": "<m:mlongdiv><m:mn>3</m:mn><m:mn>12</m:mn><m:mn>4</m:mn></m:mlongdiv>",
 *     "maction": '<m:maction actiontype="toggle" selection="1"><m:mi>a</m:mi><m:mi>b</m:mi></m:maction>',
 *     "semantics": '<m:semantics><m:mi>x</m:mi><m:annotation encoding="text/plain">x</m:annotation></m:semantics>',
 *     "annotation": '<m:semantics><m:mi>x</m:mi><m:annotation encoding="text/plain">x</m:annotation></m:semantics>',
 * }
 * ARITY = {"mfrac": 2, "mroot": 2, "msub": 2, "msup": 2, "munder": 2, "mover": 2, "msubsup": 3, "munderover": 3}
 * for n in presentation:
 *     if n not in KIND:
 *         KIND[n] = "<m:%s>%s</m:%s>" % (n, "<m:mi>x</m:mi>" * ARITY.get(n, 1), n)
 *
 * def wrapmath(s):
 *     return s if s.startswith("<m:math") else "<m:math>%s</m:math>" % s
 *
 * def meta(xml):
 *     """The MathML handles and (kind, attribute) pairs an xml fragment holds."""
 *     root = E.fromstring("<w %s>%s</w>" % (NS, xml))
 *     handles, pairs = [], []
 *     for e in root.iter():
 *         if e.tag.startswith("{http://www.w3.org/1998/Math/MathML}"):
 *             h = "m:" + e.tag.split("}")[1]
 *             if h not in handles: handles.append(h)
 *             for a in e.attrib:
 *                 if [h, a] not in pairs: pairs.append([h, a])
 *     return handles, pairs
 *
 * blocks = []
 * for h in hosts:
 *     site, xml = host_fragment(h)
 *     mh, mp = meta(xml)
 *     blocks.append({"name": "host-" + h.replace(".", "-"), "part": "host", "version": "3.0.0", "site": site, "xml": xml, "handles": [h] + mh, "pairs": mp})
 * for n in presentation:
 *     xml = wrapmath(KIND[n])
 *     mh, mp = meta(xml)
 *     assert "m:" + n in mh, n
 *     blocks.append({"name": "kind-" + n, "part": "kind", "version": "3.0.0", "site": "body", "xml": xml, "handles": mh, "pairs": mp})
 *
 * os.makedirs(out + "/items", exist_ok=True)
 * for b in blocks:
 *     body = b["xml"] if b["site"] == "body" else "<p>a</p>"
 *     tail = b["xml"] if b["site"] == "item" else ""
 *     item = ('<qti-assessment-item %s identifier="gen" title="gen" adaptive="false" time-dependent="false">'
 *             '<qti-item-body>%s</qti-item-body>%s</qti-assessment-item>') % (NS, body, tail)
 *     open(out + "/items/%s.xml" % b["name"], "w").write(item)
 * def ts(v): return json.dumps(v, indent=2, sort_keys=True)
 * open(out + "/data.ts.txt", "w").write(
 *     "export const presentationHandles: readonly string[] = %s;\n\nexport const mathmlBlocks: readonly MathmlBlock[] = %s;\n"
 *     % (ts(["m:" + n for n in presentation]), ts(blocks)))
 * json.dump({"presentation": ["m:" + n for n in presentation], "hosts": hosts, "blocks": blocks}, open(out + "/blocks.json", "w"), indent=1)
 * print("hosts", len(hosts), "presentation", len(presentation), "blocks", len(blocks))
 * ```
 *
 * The oracle is `xmllint` over the flat XSD copy and catalog of `~/.cache/gr8des/qti3/oracle/`
 * (spec 3.2's form), against both ASI XSDs; each item is one of the 106 blocks inside a base item:
 *
 * ```sh
 * for v in imsqti_asiv3p0_v1p0.xsd imsqti_asiv3p0p1_v1p0.xsd; do
 *   XML_CATALOG_FILES=$HOME/.cache/gr8des/qti3/oracle/catalog.xml xmllint --nonet --noout \
 *     --schema $HOME/.cache/gr8des/qti3/oracle/xsd/$v out/items/*.xml 2>&1 |
 *     awk -v v=$v '/ validates$/ { ok++ } !/ validates$/ { print } END { print v ": " ok " validate, " NR - ok " other lines" }'
 * done
 *
 * # output
 * imsqti_asiv3p0_v1p0.xsd: 106 validate, 0 other lines
 * imsqti_asiv3p0p1_v1p0.xsd: 106 validate, 0 other lines
 * ```
 */

/**
 * One generated coverage block.
 */
export interface MathmlBlock {
  /**
   * The MathML handles the block holds, and for a host block the host handle first.
   */
  readonly handles: readonly string[];
  /**
   * A name unique among the blocks.
   */
  readonly name: string;
  /**
   * The MathML `(kind, attribute)` pairs the fragment writes.
   */
  readonly pairs: readonly (readonly [kind: string, attribute: string])[];
  readonly part: "attribute" | "host" | "kind" | "padded";
  /**
   * Where the fragment goes in the base item: inside `qti-item-body`, or after it.
   */
  readonly site: "body" | "item";
  /**
   * The ASI schema version of the base item the block is for.
   */
  readonly version: "3.0.0" | "3.0.1";
  /**
   * The fragment: QTI in the default namespace, MathML under the prefix `m`.
   */
  readonly xml: string;
}

/**
 * The presentation handles: the 40 concrete elements of the presentation XSD, `m:math`,
 * `m:semantics` and `m:annotation`.
 */
export const presentationHandles: readonly string[] = [
  "m:math",
  "m:mi",
  "m:mn",
  "m:mo",
  "m:mtext",
  "m:mspace",
  "m:ms",
  "m:mglyph",
  "m:msline",
  "m:none",
  "m:mprescripts",
  "m:malignmark",
  "m:maligngroup",
  "m:mrow",
  "m:mfrac",
  "m:msqrt",
  "m:mroot",
  "m:mstyle",
  "m:merror",
  "m:mpadded",
  "m:mphantom",
  "m:mfenced",
  "m:menclose",
  "m:msub",
  "m:msup",
  "m:msubsup",
  "m:munder",
  "m:mover",
  "m:munderover",
  "m:mmultiscripts",
  "m:mtable",
  "m:mlabeledtr",
  "m:mtr",
  "m:mtd",
  "m:mstack",
  "m:mlongdiv",
  "m:msgroup",
  "m:msrow",
  "m:mscarries",
  "m:mscarry",
  "m:maction",
  "m:semantics",
  "m:annotation",
];

export const mathmlBlocks: readonly MathmlBlock[] = [
  {
    handles: ["qti-content-body.feedback", "m:math", "m:mi"],
    name: "host-qti-content-body-feedback",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-feedback-block outcome-identifier="FEEDBACK" identifier="FB" show-hide="show"><qti-content-body><m:math><m:mi>x</m:mi></m:math></qti-content-body></qti-feedback-block>',
  },
  {
    handles: ["qti-content-body.modal", "m:math", "m:mi"],
    name: "host-qti-content-body-modal",
    pairs: [],
    part: "host",
    site: "item",
    version: "3.0.0",
    xml: '<qti-modal-feedback outcome-identifier="FEEDBACK" identifier="FB" show-hide="show"><qti-content-body><m:math><m:mi>x</m:mi></m:math></qti-content-body></qti-modal-feedback>',
  },
  {
    handles: ["qti-content-body.rubric", "m:math", "m:mi"],
    name: "host-qti-content-body-rubric",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-rubric-block use="instructions" view="scorer"><qti-content-body><m:math><m:mi>x</m:mi></m:math></qti-content-body></qti-rubric-block>',
  },
  {
    handles: ["qti-content-body.rubricTemplate", "m:math", "m:mi"],
    name: "host-qti-content-body-rubricTemplate",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-rubric-block use="instructions" view="scorer"><qti-content-body><qti-template-block template-identifier="TPL" identifier="TPLID" show-hide="show"><qti-content-body><m:math><m:mi>x</m:mi></m:math></qti-content-body></qti-template-block></qti-content-body></qti-rubric-block>',
  },
  {
    handles: ["qti-content-body.template", "m:math", "m:mi"],
    name: "host-qti-content-body-template",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-template-block template-identifier="TPL" identifier="TPLID" show-hide="show"><qti-content-body><m:math><m:mi>x</m:mi></m:math></qti-content-body></qti-template-block>',
  },
  {
    handles: ["qti-feedback-inline", "m:math", "m:mi"],
    name: "host-qti-feedback-inline",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<p><qti-feedback-inline outcome-identifier="FEEDBACK" identifier="FB" show-hide="show"><m:math><m:mi>x</m:mi></m:math></qti-feedback-inline></p>',
  },
  {
    handles: ["qti-gap-match-interaction", "m:math", "m:mi"],
    name: "host-qti-gap-match-interaction",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-gap-match-interaction response-identifier="RESPONSE_GM" max-associations="1"><qti-gap-text identifier="GT" match-max="1">a</qti-gap-text><m:math><m:mi>x</m:mi></m:math><p><qti-gap identifier="G"/></p></qti-gap-match-interaction>',
  },
  {
    handles: ["qti-gap-text", "m:math", "m:mi"],
    name: "host-qti-gap-text",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-gap-match-interaction response-identifier="RESPONSE_GM" max-associations="1"><qti-gap-text identifier="GT" match-max="1"><m:math><m:mi>x</m:mi></m:math></qti-gap-text><p><qti-gap identifier="G"/></p></qti-gap-match-interaction>',
  },
  {
    handles: ["qti-hottext", "m:math", "m:mi"],
    name: "host-qti-hottext",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-hottext-interaction response-identifier="RESPONSE_HT" max-choices="1"><p><qti-hottext identifier="HT"><m:math><m:mi>x</m:mi></m:math></qti-hottext></p></qti-hottext-interaction>',
  },
  {
    handles: ["qti-hottext-interaction", "m:math", "m:mi"],
    name: "host-qti-hottext-interaction",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-hottext-interaction response-identifier="RESPONSE_HT" max-choices="1"><m:math><m:mi>x</m:mi></m:math><p><qti-hottext identifier="HT">a</qti-hottext></p></qti-hottext-interaction>',
  },
  {
    handles: ["qti-inline-choice", "m:math", "m:mi"],
    name: "host-qti-inline-choice",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<p><qti-inline-choice-interaction response-identifier="RESPONSE_IC"><qti-inline-choice identifier="IC"><m:math><m:mi>x</m:mi></m:math></qti-inline-choice></qti-inline-choice-interaction></p>',
  },
  {
    handles: ["qti-item-body", "m:math", "m:mi"],
    name: "host-qti-item-body",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mi>x</m:mi></m:math>",
  },
  {
    handles: ["qti-label", "m:math", "m:mi"],
    name: "host-qti-label",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<p><qti-inline-choice-interaction response-identifier="RESPONSE_IC"><qti-label><m:math><m:mi>x</m:mi></m:math></qti-label><qti-inline-choice identifier="IC">a</qti-inline-choice></qti-inline-choice-interaction></p>',
  },
  {
    handles: ["qti-prompt", "m:math", "m:mi"],
    name: "host-qti-prompt",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-choice-interaction response-identifier="RESPONSE_CH" max-choices="1"><qti-prompt><m:math><m:mi>x</m:mi></m:math></qti-prompt><qti-simple-choice identifier="CH">a</qti-simple-choice></qti-choice-interaction>',
  },
  {
    handles: ["qti-simple-associable-choice", "m:math", "m:mi"],
    name: "host-qti-simple-associable-choice",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-associate-interaction response-identifier="RESPONSE_AS" max-associations="1"><qti-simple-associable-choice identifier="AS" match-max="1"><m:math><m:mi>x</m:mi></m:math></qti-simple-associable-choice></qti-associate-interaction>',
  },
  {
    handles: ["qti-simple-choice", "m:math", "m:mi"],
    name: "host-qti-simple-choice",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-choice-interaction response-identifier="RESPONSE_CH" max-choices="1"><qti-simple-choice identifier="CH"><m:math><m:mi>x</m:mi></m:math></qti-simple-choice></qti-choice-interaction>',
  },
  {
    handles: ["qti-template-inline", "m:math", "m:mi"],
    name: "host-qti-template-inline",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<p><qti-template-inline template-identifier="TPL" identifier="TPLID" show-hide="show"><m:math><m:mi>x</m:mi></m:math></qti-template-inline></p>',
  },
  {
    handles: ["qti-template-inline.rubric", "m:math", "m:mi"],
    name: "host-qti-template-inline-rubric",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<qti-rubric-block use="instructions" view="scorer"><qti-content-body><p><qti-template-inline template-identifier="TPL" identifier="TPLID" show-hide="show"><m:math><m:mi>x</m:mi></m:math></qti-template-inline></p></qti-content-body></qti-rubric-block>',
  },
  {
    handles: ["a", "m:math", "m:mi"],
    name: "host-a",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<div><a href="a.html"><m:math><m:mi>x</m:mi></m:math></a></div>',
  },
  {
    handles: ["abbr", "m:math", "m:mi"],
    name: "host-abbr",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><abbr><m:math><m:mi>x</m:mi></m:math></abbr></div>",
  },
  {
    handles: ["acronym", "m:math", "m:mi"],
    name: "host-acronym",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><acronym><m:math><m:mi>x</m:mi></m:math></acronym></div>",
  },
  {
    handles: ["address", "m:math", "m:mi"],
    name: "host-address",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><address><m:math><m:mi>x</m:mi></m:math></address></div>",
  },
  {
    handles: ["article", "m:math", "m:mi"],
    name: "host-article",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><article><m:math><m:mi>x</m:mi></m:math></article></div>",
  },
  {
    handles: ["aside", "m:math", "m:mi"],
    name: "host-aside",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><aside><m:math><m:mi>x</m:mi></m:math></aside></div>",
  },
  {
    handles: ["b", "m:math", "m:mi"],
    name: "host-b",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><b><m:math><m:mi>x</m:mi></m:math></b></div>",
  },
  {
    handles: ["big", "m:math", "m:mi"],
    name: "host-big",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><big><m:math><m:mi>x</m:mi></m:math></big></div>",
  },
  {
    handles: ["caption", "m:math", "m:mi"],
    name: "host-caption",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><table><caption><m:math><m:mi>x</m:mi></m:math></caption><tbody><tr><td>a</td></tr></tbody></table></div>",
  },
  {
    handles: ["cite", "m:math", "m:mi"],
    name: "host-cite",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><cite><m:math><m:mi>x</m:mi></m:math></cite></div>",
  },
  {
    handles: ["code", "m:math", "m:mi"],
    name: "host-code",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><code><m:math><m:mi>x</m:mi></m:math></code></div>",
  },
  {
    handles: ["dd", "m:math", "m:mi"],
    name: "host-dd",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><dl><dd><m:math><m:mi>x</m:mi></m:math></dd></dl></div>",
  },
  {
    handles: ["dfn", "m:math", "m:mi"],
    name: "host-dfn",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><dfn><m:math><m:mi>x</m:mi></m:math></dfn></div>",
  },
  {
    handles: ["div", "m:math", "m:mi"],
    name: "host-div",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><div><m:math><m:mi>x</m:mi></m:math></div></div>",
  },
  {
    handles: ["dt", "m:math", "m:mi"],
    name: "host-dt",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><dl><dt><m:math><m:mi>x</m:mi></m:math></dt></dl></div>",
  },
  {
    handles: ["em", "m:math", "m:mi"],
    name: "host-em",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><em><m:math><m:mi>x</m:mi></m:math></em></div>",
  },
  {
    handles: ["figcaption", "m:math", "m:mi"],
    name: "host-figcaption",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><figure><figcaption><m:math><m:mi>x</m:mi></m:math></figcaption></figure></div>",
  },
  {
    handles: ["footer", "m:math", "m:mi"],
    name: "host-footer",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><footer><m:math><m:mi>x</m:mi></m:math></footer></div>",
  },
  {
    handles: ["h1", "m:math", "m:mi"],
    name: "host-h1",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><h1><m:math><m:mi>x</m:mi></m:math></h1></div>",
  },
  {
    handles: ["h2", "m:math", "m:mi"],
    name: "host-h2",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><h2><m:math><m:mi>x</m:mi></m:math></h2></div>",
  },
  {
    handles: ["h3", "m:math", "m:mi"],
    name: "host-h3",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><h3><m:math><m:mi>x</m:mi></m:math></h3></div>",
  },
  {
    handles: ["h4", "m:math", "m:mi"],
    name: "host-h4",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><h4><m:math><m:mi>x</m:mi></m:math></h4></div>",
  },
  {
    handles: ["h5", "m:math", "m:mi"],
    name: "host-h5",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><h5><m:math><m:mi>x</m:mi></m:math></h5></div>",
  },
  {
    handles: ["h6", "m:math", "m:mi"],
    name: "host-h6",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><h6><m:math><m:mi>x</m:mi></m:math></h6></div>",
  },
  {
    handles: ["header", "m:math", "m:mi"],
    name: "host-header",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><header><m:math><m:mi>x</m:mi></m:math></header></div>",
  },
  {
    handles: ["i", "m:math", "m:mi"],
    name: "host-i",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><i><m:math><m:mi>x</m:mi></m:math></i></div>",
  },
  {
    handles: ["kbd", "m:math", "m:mi"],
    name: "host-kbd",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><kbd><m:math><m:mi>x</m:mi></m:math></kbd></div>",
  },
  {
    handles: ["label", "m:math", "m:mi"],
    name: "host-label",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><label><m:math><m:mi>x</m:mi></m:math></label></div>",
  },
  {
    handles: ["li", "m:math", "m:mi"],
    name: "host-li",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><ul><li><m:math><m:mi>x</m:mi></m:math></li></ul></div>",
  },
  {
    handles: ["nav", "m:math", "m:mi"],
    name: "host-nav",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><nav><m:math><m:mi>x</m:mi></m:math></nav></div>",
  },
  {
    handles: ["object", "m:math", "m:mi"],
    name: "host-object",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: '<div><object data="o.png" type="image/png"><m:math><m:mi>x</m:mi></m:math></object></div>',
  },
  {
    handles: ["p", "m:math", "m:mi"],
    name: "host-p",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><p><m:math><m:mi>x</m:mi></m:math></p></div>",
  },
  {
    handles: ["pre", "m:math", "m:mi"],
    name: "host-pre",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><pre><m:math><m:mi>x</m:mi></m:math></pre></div>",
  },
  {
    handles: ["q", "m:math", "m:mi"],
    name: "host-q",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><q><m:math><m:mi>x</m:mi></m:math></q></div>",
  },
  {
    handles: ["samp", "m:math", "m:mi"],
    name: "host-samp",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><samp><m:math><m:mi>x</m:mi></m:math></samp></div>",
  },
  {
    handles: ["section", "m:math", "m:mi"],
    name: "host-section",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><section><m:math><m:mi>x</m:mi></m:math></section></div>",
  },
  {
    handles: ["small", "m:math", "m:mi"],
    name: "host-small",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><small><m:math><m:mi>x</m:mi></m:math></small></div>",
  },
  {
    handles: ["span", "m:math", "m:mi"],
    name: "host-span",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><span><m:math><m:mi>x</m:mi></m:math></span></div>",
  },
  {
    handles: ["strong", "m:math", "m:mi"],
    name: "host-strong",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><strong><m:math><m:mi>x</m:mi></m:math></strong></div>",
  },
  {
    handles: ["sub", "m:math", "m:mi"],
    name: "host-sub",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><sub><m:math><m:mi>x</m:mi></m:math></sub></div>",
  },
  {
    handles: ["sup", "m:math", "m:mi"],
    name: "host-sup",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><sup><m:math><m:mi>x</m:mi></m:math></sup></div>",
  },
  {
    handles: ["td", "m:math", "m:mi"],
    name: "host-td",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><table><tbody><tr><td><m:math><m:mi>x</m:mi></m:math></td></tr></tbody></table></div>",
  },
  {
    handles: ["th", "m:math", "m:mi"],
    name: "host-th",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><table><tbody><tr><th><m:math><m:mi>x</m:mi></m:math></th></tr></tbody></table></div>",
  },
  {
    handles: ["tt", "m:math", "m:mi"],
    name: "host-tt",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><tt><m:math><m:mi>x</m:mi></m:math></tt></div>",
  },
  {
    handles: ["var", "m:math", "m:mi"],
    name: "host-var",
    pairs: [],
    part: "host",
    site: "body",
    version: "3.0.0",
    xml: "<div><var><m:math><m:mi>x</m:mi></m:math></var></div>",
  },
  {
    handles: ["m:math", "m:mi"],
    name: "kind-math",
    pairs: [["m:math", "display"]],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: '<m:math display="block"><m:mi>x</m:mi></m:math>',
  },
  {
    handles: ["m:math", "m:mi"],
    name: "kind-mi",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mi>x</m:mi></m:math>",
  },
  {
    handles: ["m:math", "m:mn"],
    name: "kind-mn",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mn>1</m:mn></m:math>",
  },
  {
    handles: ["m:math", "m:mo"],
    name: "kind-mo",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mo>+</m:mo></m:math>",
  },
  {
    handles: ["m:math", "m:mtext"],
    name: "kind-mtext",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mtext>t</m:mtext></m:math>",
  },
  {
    handles: ["m:math", "m:mspace"],
    name: "kind-mspace",
    pairs: [["m:mspace", "width"]],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: '<m:math><m:mspace width="1em"/></m:math>',
  },
  {
    handles: ["m:math", "m:ms"],
    name: "kind-ms",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:ms>s</m:ms></m:math>",
  },
  {
    handles: ["m:math", "m:mi", "m:mglyph"],
    name: "kind-mglyph",
    pairs: [
      ["m:mglyph", "src"],
      ["m:mglyph", "alt"],
    ],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: '<m:math><m:mi><m:mglyph src="glyph.png" alt="glyph"/></m:mi></m:math>',
  },
  {
    handles: ["m:math", "m:mstack", "m:mn", "m:msline"],
    name: "kind-msline",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mstack><m:mn>12</m:mn><m:msline/></m:mstack></m:math>",
  },
  {
    handles: ["m:math", "m:mmultiscripts", "m:mi", "m:none"],
    name: "kind-none",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mmultiscripts><m:mi>x</m:mi><m:mi>a</m:mi><m:none/></m:mmultiscripts></m:math>",
  },
  {
    handles: ["m:math", "m:mmultiscripts", "m:mi", "m:mprescripts"],
    name: "kind-mprescripts",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mmultiscripts><m:mi>x</m:mi><m:mprescripts/><m:mi>a</m:mi><m:mi>b</m:mi></m:mmultiscripts></m:math>",
  },
  {
    handles: ["m:math", "m:mi", "m:malignmark"],
    name: "kind-malignmark",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mi>x<m:malignmark/></m:mi></m:math>",
  },
  {
    handles: ["m:math", "m:mtable", "m:mtr", "m:mtd", "m:maligngroup", "m:mi"],
    name: "kind-maligngroup",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mtable><m:mtr><m:mtd><m:maligngroup/><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable></m:math>",
  },
  {
    handles: ["m:math", "m:mrow", "m:mi"],
    name: "kind-mrow",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mrow><m:mi>x</m:mi></m:mrow></m:math>",
  },
  {
    handles: ["m:math", "m:mfrac", "m:mi"],
    name: "kind-mfrac",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mfrac><m:mi>x</m:mi><m:mi>x</m:mi></m:mfrac></m:math>",
  },
  {
    handles: ["m:math", "m:msqrt", "m:mi"],
    name: "kind-msqrt",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:msqrt><m:mi>x</m:mi></m:msqrt></m:math>",
  },
  {
    handles: ["m:math", "m:mroot", "m:mi"],
    name: "kind-mroot",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mroot><m:mi>x</m:mi><m:mi>x</m:mi></m:mroot></m:math>",
  },
  {
    handles: ["m:math", "m:mstyle", "m:mi"],
    name: "kind-mstyle",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mstyle><m:mi>x</m:mi></m:mstyle></m:math>",
  },
  {
    handles: ["m:math", "m:merror", "m:mi"],
    name: "kind-merror",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:merror><m:mi>x</m:mi></m:merror></m:math>",
  },
  {
    handles: ["m:math", "m:mpadded", "m:mi"],
    name: "kind-mpadded",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mpadded><m:mi>x</m:mi></m:mpadded></m:math>",
  },
  {
    handles: ["m:math", "m:mphantom", "m:mi"],
    name: "kind-mphantom",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mphantom><m:mi>x</m:mi></m:mphantom></m:math>",
  },
  {
    handles: ["m:math", "m:mfenced", "m:mi"],
    name: "kind-mfenced",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mfenced><m:mi>x</m:mi></m:mfenced></m:math>",
  },
  {
    handles: ["m:math", "m:menclose", "m:mi"],
    name: "kind-menclose",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:menclose><m:mi>x</m:mi></m:menclose></m:math>",
  },
  {
    handles: ["m:math", "m:msub", "m:mi"],
    name: "kind-msub",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:msub><m:mi>x</m:mi><m:mi>x</m:mi></m:msub></m:math>",
  },
  {
    handles: ["m:math", "m:msup", "m:mi"],
    name: "kind-msup",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:msup><m:mi>x</m:mi><m:mi>x</m:mi></m:msup></m:math>",
  },
  {
    handles: ["m:math", "m:msubsup", "m:mi"],
    name: "kind-msubsup",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:msubsup><m:mi>x</m:mi><m:mi>x</m:mi><m:mi>x</m:mi></m:msubsup></m:math>",
  },
  {
    handles: ["m:math", "m:munder", "m:mi"],
    name: "kind-munder",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:munder><m:mi>x</m:mi><m:mi>x</m:mi></m:munder></m:math>",
  },
  {
    handles: ["m:math", "m:mover", "m:mi"],
    name: "kind-mover",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mover><m:mi>x</m:mi><m:mi>x</m:mi></m:mover></m:math>",
  },
  {
    handles: ["m:math", "m:munderover", "m:mi"],
    name: "kind-munderover",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:munderover><m:mi>x</m:mi><m:mi>x</m:mi><m:mi>x</m:mi></m:munderover></m:math>",
  },
  {
    handles: ["m:math", "m:mmultiscripts", "m:mi", "m:mprescripts", "m:none"],
    name: "kind-mmultiscripts",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mmultiscripts><m:mi>x</m:mi><m:mi>a</m:mi><m:mi>b</m:mi><m:mprescripts/><m:none/><m:mi>c</m:mi></m:mmultiscripts></m:math>",
  },
  {
    handles: ["m:math", "m:mtable", "m:mtr", "m:mtd", "m:mi"],
    name: "kind-mtable",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mtable><m:mtr><m:mtd><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable></m:math>",
  },
  {
    handles: ["m:math", "m:mtable", "m:mlabeledtr", "m:mtd", "m:mi"],
    name: "kind-mlabeledtr",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mtable><m:mlabeledtr><m:mtd><m:mi>l</m:mi></m:mtd><m:mtd><m:mi>x</m:mi></m:mtd></m:mlabeledtr></m:mtable></m:math>",
  },
  {
    handles: ["m:math", "m:mtable", "m:mtr", "m:mtd", "m:mi"],
    name: "kind-mtr",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mtable><m:mtr><m:mtd><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable></m:math>",
  },
  {
    handles: ["m:math", "m:mtable", "m:mtr", "m:mtd", "m:mi"],
    name: "kind-mtd",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mtable><m:mtr><m:mtd><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable></m:math>",
  },
  {
    handles: ["m:math", "m:mstack", "m:mn"],
    name: "kind-mstack",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mstack><m:mn>12</m:mn></m:mstack></m:math>",
  },
  {
    handles: ["m:math", "m:mlongdiv", "m:mn"],
    name: "kind-mlongdiv",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mlongdiv><m:mn>3</m:mn><m:mn>12</m:mn><m:mn>4</m:mn></m:mlongdiv></m:math>",
  },
  {
    handles: ["m:math", "m:mstack", "m:msgroup", "m:mn"],
    name: "kind-msgroup",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mstack><m:msgroup><m:mn>1</m:mn></m:msgroup></m:mstack></m:math>",
  },
  {
    handles: ["m:math", "m:mstack", "m:msrow", "m:mo", "m:mn"],
    name: "kind-msrow",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mstack><m:msrow><m:mo>+</m:mo><m:mn>3</m:mn></m:msrow></m:mstack></m:math>",
  },
  {
    handles: ["m:math", "m:mstack", "m:mscarries", "m:mscarry", "m:mn"],
    name: "kind-mscarries",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mstack><m:mscarries><m:mscarry><m:mn>1</m:mn></m:mscarry></m:mscarries><m:mn>12</m:mn></m:mstack></m:math>",
  },
  {
    handles: ["m:math", "m:mstack", "m:mscarries", "m:mscarry", "m:mn"],
    name: "kind-mscarry",
    pairs: [],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: "<m:math><m:mstack><m:mscarries><m:mscarry><m:mn>1</m:mn></m:mscarry></m:mscarries><m:mn>12</m:mn></m:mstack></m:math>",
  },
  {
    handles: ["m:math", "m:maction", "m:mi"],
    name: "kind-maction",
    pairs: [
      ["m:maction", "actiontype"],
      ["m:maction", "selection"],
    ],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: '<m:math><m:maction actiontype="toggle" selection="1"><m:mi>a</m:mi><m:mi>b</m:mi></m:maction></m:math>',
  },
  {
    handles: ["m:math", "m:semantics", "m:mi", "m:annotation"],
    name: "kind-semantics",
    pairs: [["m:annotation", "encoding"]],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: '<m:math><m:semantics><m:mi>x</m:mi><m:annotation encoding="text/plain">x</m:annotation></m:semantics></m:math>',
  },
  {
    handles: ["m:math", "m:semantics", "m:mi", "m:annotation"],
    name: "kind-annotation",
    pairs: [["m:annotation", "encoding"]],
    part: "kind",
    site: "body",
    version: "3.0.0",
    xml: '<m:math><m:semantics><m:mi>x</m:mi><m:annotation encoding="text/plain">x</m:annotation></m:semantics></m:math>',
  },
];
