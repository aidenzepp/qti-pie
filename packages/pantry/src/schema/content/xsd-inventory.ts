/**
 * The derived XSD inventory: for every ASI, HTML, processing and test kind handle, the element and
 * type the ASI 3.0.1 XSD declares, whether the type is mixed, every attribute it declares and every
 * element it references.
 *
 * The inventory is data derived once from `imsqti_asiv3p0p1_v1p0.xsd` and read by the kinds files,
 * the attribute arms and the importer. Each vocabulary is a leaf file (`inventory/asi.ts`,
 * `inventory/html.ts`, `inventory/processing.ts`, `inventory/test.ts`) composed here, so a later
 * phase adds its own leaf and one spread line.
 *
 * An attribute's `family` is `base` for the ten names every element shares (`id`, `class`, `lang`,
 * `xml:lang`, `label`, `dir`, `xml:base`, `data-qti-suppress-tts`, `data-catalog-idref`,
 * `data-ssml`), `aria` for `role` and the `aria-*` names, and `own` otherwise. Its `whiteSpace` is
 * the class of the declared type: `collapse` for lists and every built-in but `xs:string` and
 * `xs:normalizedString`, `preserve` for `xs:string` and its enumerations, `replace` for
 * `xs:normalizedString`, `CoordsDType`, `MimeTypeDType` and `URLDType`, and `union` for a union of
 * classes. A child's `min` and `max` are its own bounds multiplied by those of every enclosing
 * group, `None` for unbounded; the choice groups are listed in each leaf's module comment.
 *
 * The leaves are the output of this script, run from any directory as `python3 -I derive.py asi`,
 * `python3 -I derive.py html`, `python3 -I derive.py processing` and `python3 -I derive.py test`
 * with the XSD cached at `~/.cache/gr8des/qti3/xsd/`, then formatted with `vp fmt`:
 *
 * ```python
 * import xml.etree.ElementTree as E, collections, os, re, sys, textwrap
 * XS="{http://www.w3.org/2001/XMLSchema}"
 * PATH=os.path.expanduser("~/.cache/gr8des/qti3/xsd/imsqti_asiv3p0p1_v1p0.xsd")
 * BUILTIN={"string":"preserve","normalizedString":"replace"}
 * M0=["qti-assessment-item","qti-response-declaration","qti-outcome-declaration","qti-correct-response","qti-default-value","qti-value","qti-item-body","qti-choice-interaction","qti-prompt","qti-simple-choice","qti-response-processing"]
 * M1=set("qti-area-map-entry qti-area-mapping qti-associable-hotspot qti-associate-interaction qti-catalog-info qti-companion-materials-info qti-context-declaration qti-drawing-interaction qti-end-attempt-interaction qti-extended-text-interaction qti-feedback-inline qti-gap qti-gap-img qti-gap-match-interaction qti-gap-text qti-graphic-associate-interaction qti-graphic-gap-match-interaction qti-graphic-order-interaction qti-hotspot-choice qti-hotspot-interaction qti-hottext qti-hottext-interaction qti-inline-choice qti-inline-choice-interaction qti-interpolation-table qti-interpolation-table-entry qti-label qti-map-entry qti-mapping qti-match-interaction qti-match-table qti-match-table-entry qti-media-interaction qti-modal-feedback qti-order-interaction qti-position-object-interaction qti-position-object-stage qti-printed-variable qti-select-point-interaction qti-simple-associable-choice qti-simple-match-set qti-slider-interaction qti-stylesheet qti-template-declaration qti-text-entry-interaction qti-upload-interaction".split())
 * DOTTED={"qti-content-body.feedback":("qti-content-body","FeedbackContentBodyDType"),"qti-content-body.modal":("qti-content-body","FeedbackFlowContentBodyDType"),"qti-content-body.rubric":("qti-content-body","RubricBlockContentBodyDType"),"qti-content-body.rubricTemplate":("qti-content-body","RubricBlockTemplateBlockContentBodyDType"),"qti-content-body.template":("qti-content-body","TemplateBlockContentBodyDType"),"qti-feedback-block":("qti-feedback-block","FeedbackBlockDType"),"qti-feedback-block.template":("qti-feedback-block","TemplateBlockFeedbackBlockDType"),"qti-rubric-block":("qti-rubric-block","RubricBlockDType"),"qti-template-block":("qti-template-block","TemplateBlockDType"),"qti-template-block.rubric":("qti-template-block","RubricBlockTemplateBlockDType"),"qti-template-inline":("qti-template-inline","TemplateInlineDType"),"qti-template-inline.rubric":("qti-template-inline","RubricBlockTemplateInlineDType")}
 * HTML="a abbr acronym address article aside audio b bdi bdo big blockquote br caption cite code col colgroup dd details dfn div dl dt em figcaption figure footer h1 h2 h3 h4 h5 h6 header hr i img kbd label li nav object ol p param picture pre q rb rp rt rtc ruby samp section small source span strong sub summary sup table tbody td template tfoot th thead tr track tt ul var video".split()
 * PROC="qti-and qti-any-n qti-base-value qti-container-size qti-contains qti-correct qti-custom-operator qti-default qti-delete qti-divide qti-duration-gte qti-duration-lt qti-equal qti-equal-rounded qti-field-value qti-gcd qti-gt qti-gte qti-index qti-inside qti-integer-divide qti-integer-modulus qti-integer-to-float qti-is-null qti-lcm qti-lt qti-lte qti-map-response qti-map-response-point qti-match qti-math-constant qti-math-operator qti-max qti-member qti-min qti-multiple qti-not qti-null qti-number-correct qti-number-incorrect qti-number-presented qti-number-responded qti-number-selected qti-or qti-ordered qti-outcome-maximum qti-outcome-minimum qti-pattern-match qti-power qti-product qti-random qti-random-float qti-random-integer qti-repeat qti-round qti-round-to qti-stats-operator qti-string-match qti-substring qti-subtract qti-sum qti-test-variables qti-truncate qti-variable qti-response-condition qti-response-if qti-response-else-if qti-response-else qti-set-outcome-value qti-lookup-outcome-value qti-exit-response qti-response-processing-fragment qti-outcome-processing qti-outcome-condition qti-outcome-if qti-outcome-else-if qti-outcome-else qti-exit-test qti-outcome-processing-fragment qti-template-processing qti-template-condition qti-template-if qti-template-else-if qti-template-else qti-set-template-value qti-set-default-value qti-set-correct-response qti-template-constraint qti-exit-template".split()
 * FAMILY={"id","class","lang","xml:lang","label","dir","xml:base","data-qti-suppress-tts","data-catalog-idref","data-ssml"}
 * root=E.parse(PATH).getroot()
 * ST={s.get("name"):s for s in root.iter(XS+"simpleType") if s.get("name")}
 * CT={c.get("name"):c for c in root.iter(XS+"complexType") if c.get("name")}
 * AG={g.get("name"):g for g in root.iter(XS+"attributeGroup") if g.get("name")}
 * GR={g.get("name"):g for g in root.iter(XS+"group") if g.get("name")}
 * DECL=collections.defaultdict(dict)
 * for e in root.iter(XS+"element"):
 *     if e.get("name"): DECL[e.get("name")].setdefault(e.get("type") or "(inline)",e)
 * def local(t): return t.split(":")[-1]
 * def facet(t):
 *     if isinstance(t,str):
 *         if t.startswith("xs:"): return BUILTIN.get(local(t),"collapse")
 *         node=ST[local(t)]
 *     else: node=t
 *     if node.find(XS+"list") is not None: return "collapse"
 *     u=node.find(XS+"union")
 *     if u is not None:
 *         fs={facet(m) for m in (u.get("memberTypes") or "").split()}|{facet(s) for s in u.findall(XS+"simpleType")}
 *         return "collapse" if fs=={"collapse"} else "union"
 *     r=node.find(XS+"restriction"); ws=r.find(XS+"whiteSpace")
 *     f=facet(r.get("base") or r.find(XS+"simpleType"))
 *     return ws.get("value") if ws is not None else f
 * def inline_type(t):
 *     if t.find(XS+"list") is not None: return "list"
 *     if t.find(XS+"union") is not None: return "union"
 *     r=t.find(XS+"restriction")
 *     return r.get("base") or inline_type(r.find(XS+"simpleType"))
 * def attributes(ct,out):
 *     for a in ct.findall(XS+"attribute"): out.append(a)
 *     for g in ct.findall(XS+"attributeGroup"):
 *         if g.get("ref"): attributes(AG[local(g.get("ref"))],out)
 *     for sub in list(ct.iter(XS+"extension"))+list(ct.iter(XS+"restriction")):
 *         if sub is ct: continue
 *         b=(sub.get("base") or "").split(":")[-1]
 *         if b in CT: attributes(CT[b],out)
 *         for a in sub.findall(XS+"attribute"): out.append(a)
 *         for g in sub.findall(XS+"attributeGroup"):
 *             if g.get("ref"): attributes(AG[local(g.get("ref"))],out)
 * def attribute_row(a):
 *     name=a.get("name") or a.get("ref")
 *     if a.get("ref"):
 *         t={"xml:lang":"xs:language","xml:base":"xs:anyURI"}[name]; ws=facet(t)
 *     elif a.get("type"): t=a.get("type"); ws=facet(t)
 *     else: s=a.find(XS+"simpleType"); t=inline_type(s); ws=facet(s)
 *     fam="base" if name in FAMILY else "aria" if name=="role" or name.startswith("aria-") else "own"
 *     return (name,t,a.get("use") or "optional",fam,ws,a.get("default"))
 * def mixed_of(ct):
 *     cc=ct.find(XS+"complexContent")
 *     for n in (ct,cc):
 *         if n is not None and n.get("mixed") is not None: return n.get("mixed")=="true"
 *     if cc is not None:
 *         d=cc.find(XS+"extension") if cc.find(XS+"extension") is not None else cc.find(XS+"restriction")
 *         b=local(d.get("base") or "")
 *         if b in CT: return mixed_of(CT[b])
 *     return False
 * def bounds(n):
 *     lo=int(n.get("minOccurs") or 1); hi=n.get("maxOccurs") or "1"
 *     return lo,(None if hi=="unbounded" else int(hi))
 * def mul(a,b):
 *     lo=a[0]*b[0]
 *     hi=None if a[1] is None or b[1] is None else a[1]*b[1]
 *     if (a[1]==0 or b[1]==0): hi=0
 *     return lo,hi
 * def walk(node,mult,out,groups):
 *     """the element references under a particle, each with its own bounds times every enclosing group's"""
 *     if node.tag==XS+"element":
 *         out.append((node.get("name") or node.get("ref"),mul(mult,bounds(node)))); return
 *     if node.tag==XS+"group" and node.get("ref"):
 *         walk(GR[local(node.get("ref"))],mult,out,groups); return
 *     if node.tag in (XS+"sequence",XS+"choice",XS+"all",XS+"group"):
 *         m=mul(mult,bounds(node)); start=len(out)
 *         for c in node:
 *             if c.tag!=XS+"annotation": walk(c,m,out,groups)
 *         if node.tag==XS+"choice":
 *             names=[]
 *             for n,_ in out[start:]:
 *                 if n not in names: names.append(n)
 *             if len(names)>1: groups.append((names,m))
 * def content(ct,out,groups):
 *     cc=ct.find(XS+"complexContent")
 *     if cc is not None:
 *         d=cc.find(XS+"extension") if cc.find(XS+"extension") is not None else cc.find(XS+"restriction")
 *         b=local(d.get("base") or "")
 *         if d.tag==XS+"extension" and b in CT: content(CT[b],out,groups)
 *         parts=d
 *     else: parts=ct
 *     for c in parts:
 *         if c.tag in (XS+"sequence",XS+"choice",XS+"all",XS+"group"): walk(c,(1,1),out,groups)
 * def entry(handle,element,type_):
 *     e=DECL[element][type_]
 *     ct=CT[type_] if type_ in CT else e.find(XS+"complexType")
 *     found=[]; attributes(ct,found)
 *     out=[]; groups=[]; content(ct,out,groups)
 *     kids=[]
 *     for n,(lo,hi) in out: kids.append((n,lo,hi))
 *     return {"handle":handle,"element":element,"type":type_,"mixed":mixed_of(ct),"attributes":[attribute_row(a) for a in found],"children":kids,"groups":groups}
 * def entries(which):
 *     es=[]
 *     if which=="asi":
 *         for n in M0: es.append(entry(n,n,next(iter(DECL[n]))))
 *         for n in sorted(M1):
 *             assert len(DECL[n])==1,n
 *             es.append(entry(n,n,next(iter(DECL[n]))))
 *         for h,(n,t) in DOTTED.items(): es.append(entry(h,n,t))
 *     elif which=="processing":
 *         for n in PROC:
 *             assert len(DECL[n])==1,n
 *             es.append(entry(n,n,next(iter(DECL[n]))))
 *     else:
 *         for n in HTML:
 *             assert len(DECL[n])==1,n
 *             es.append(entry(n,n,next(iter(DECL[n]))))
 *     return sorted(es,key=lambda x:x["handle"])
 * def js(s): return '"'+s.replace("\\","\\\\").replace('"','\\"')+'"'
 * def line(indent,text): return " "*indent+text
 * def call(indent,name,args,trail=","):
 *     one=" "*indent+name+"("+", ".join(args)+")"+trail
 *     if len(one)<=100: return [one]
 *     return [" "*indent+name+"("]+[" "*(indent+2)+a+"," for a in args]+[" "*indent+")"+trail]
 * def array(indent,key,items):
 *     """items: lists of lines, each one element rendered at indent+2 with trailing comma"""
 *     if not items: return [" "*indent+key+": [],"]
 *     flat=[i for i in items if len(i)==1]
 *     if len(flat)==len(items):
 *         joined=" "*indent+key+": ["+" ".join([i[0].strip().rstrip(",") for i in items]).replace('" "','" "')
 *         parts=[i[0].strip().rstrip(",") for i in items]
 *         one=" "*indent+key+": ["+", ".join(parts)+"],"
 *         if len(one)<=100: return [one]
 *     out=[" "*indent+key+": ["]
 *     for i in items: out+=i
 *     out.append(" "*indent+"],")
 *     return out
 * def render(es):
 *     L=[]
 *     bare=all(re.fullmatch(r"[A-Za-z_$][A-Za-z0-9_$]*",x["handle"]) for x in es)
 *     for x in es:
 *         L.append("  "+(x["handle"] if bare else js(x["handle"]))+": {")
 *         at=[]
 *         for name,t,use,fam,ws,d in x["attributes"]:
 *             args=[js(name),js(t),js(use),js(fam),js(ws)]+([js(d)] if d is not None else [])
 *             at.append(call(6,"attribute",args))
 *         L+=array(4,"attributes",at)
 *         ch=[]
 *         for n,lo,hi in x["children"]: ch.append(call(6,"child",[js(n),str(lo),"Option.none()" if hi is None else "Option.some(%d)"%hi]))
 *         L+=array(4,"children",ch)
 *         L.append("    element: "+js(x["element"])+",")
 *         L.append("    handle: "+js(x["handle"])+",")
 *         L.append("    mixed: "+("true" if x["mixed"] else "false")+",")
 *         L.append("    type: "+js(x["type"])+",")
 *         L.append("  },")
 *     return L
 * VOCAB={"asi":"ASI","html":"HTML","processing":"ASI processing"}
 * def rng(b): return "%d..%s"%(b[0],"n" if b[1] is None else b[1])
 * def main(which):
 *     es=entries(which)
 *     tot=collections.Counter()
 *     for x in es:
 *         for a in x["attributes"]: tot[a[4]]+=1
 *     def para(text,first=" * ",rest=" * "):
 *         print("\n".join(textwrap.wrap(text,width=100,initial_indent=first,subsequent_indent=rest,break_long_words=False,break_on_hyphens=False)))
 *     print("/**")
 *     para("The derived XSD inventory of the %s vocabulary: one entry per kind handle, %d entries."%(VOCAB[which],len(es)))
 *     print(" *")
 *     para("Generated by `python3 -I derive.py %s` over `imsqti_asiv3p0p1_v1p0.xsd`; the script is in the module comment of `xsd-inventory.ts`, and a re-run formatted with `vp fmt` reproduces this file byte for byte. Attribute declarations by `whiteSpace` class over these entries: %s."%(which,", ".join("%s %d"%(k,tot[k]) for k in ("collapse","preserve","replace","union"))))
 *     print(" *")
 *     para("A choice group's members each carry the group's bounds multiplied into their own, so a member of a `(a | b){1..n}` group reads `{ min: 1, max: None }`. The choice groups of two to six members, by entry (the larger groups are the flow, inline and block content sets and carry `0..n` or `1..n`):")
 *     print(" *")
 *     for x in es:
 *         gs=[]
 *         for names,m in x["groups"]:
 *             if len(names)<=6: gs.append("(%s){%s}"%(" | ".join(names),rng(m)))
 *         if gs: para("- `%s`: %s"%(x["handle"],"; ".join(gs)),first=" * ",rest=" *   ")
 *     print(" *\x2f")
 *     print("import { Option } from \"effect\";")
 *     print()
 *     print("import type {")
 *     print("  InventoryAttribute,")
 *     print("  InventoryChild,")
 *     print("  InventoryLeaf,")
 *     print("} from \"#pantry/schema/content/xsd-inventory.ts\";")
 *     print()
 *     for l in [
 *         "/**",
 *         " * Build an attribute row from its declaration.",
 *         " *",
 *         " * @param name - The attribute name as the XSD spells it.",
 *         " * @param type - The declared type name, or the base of an inline type.",
 *         " * @param use - Whether the XSD requires the attribute.",
 *         " * @param family - Which attribute family the name belongs to.",
 *         " * @param whiteSpace - The `whiteSpace` class of the declared type.",
 *         " * @param defaultValue - The XSD `default`, absent when none is declared.",
 *         " * @returns The attribute row.",
 *         " *\x2f",
 *         "const attribute = (",
 *         "  name: string,",
 *         "  type: string,",
 *         '  use: InventoryAttribute["use"],',
 *         '  family: InventoryAttribute["family"],',
 *         '  whiteSpace: InventoryAttribute["whiteSpace"],',
 *         "  defaultValue?: string,",
 *         "): InventoryAttribute => ({",
 *         "  default: Option.fromNullishOr(defaultValue),",
 *         "  family,",
 *         "  name,",
 *         "  type,",
 *         "  use,",
 *         "  whiteSpace,",
 *         "});",
 *         "",
 *         "/**",
 *         " * Build a child row from an element reference.",
 *         " *",
 *         " * @param name - The referenced element name as the XSD spells it.",
 *         " * @param min - The effective minimum occurrence.",
 *         " * @param max - The effective maximum occurrence, `None` when unbounded.",
 *         " * @returns The child row.",
 *         " *\x2f",
 *         "const child = (name: string, min: number, max: Option.Option<number>): InventoryChild => ({",
 *         "  max,",
 *         "  min,",
 *         "  name,",
 *         "});",
 *         "",
 *     ]: print(l)
 *
 *     print("/**")
 *     print(" * The %s inventory, keyed by kind handle."%(VOCAB[which]))
 *     print(" *\x2f")
 *     print("export const %sInventory: InventoryLeaf = {"%which)
 *     print("\n".join(render(es)))
 *     print("};")
 * if __name__=="__main__":
 *     main(sys.argv[1])
 * ```
 *
 * The test leaf extends the script with the M4 element list and three `DOTTED` entries of its own,
 * a `test` branch at the head of `entries` (the 23 names are the spec's 3.3; each has one type):
 *
 * ```python
 * M4=["qti-adaptive-engine-ref","qti-adaptive-selection","qti-adaptive-settings-ref","qti-assessment-item-ref","qti-assessment-section","qti-assessment-section-ref","qti-assessment-stimulus","qti-assessment-stimulus-ref","qti-assessment-test","qti-branch-rule","qti-item-session-control","qti-metadata-ref","qti-ordering","qti-pre-condition","qti-selection","qti-stimulus-body","qti-template-default","qti-test-feedback","qti-test-part","qti-time-limits","qti-usagedata-ref","qti-variable-mapping","qti-weight"]
 * DOTTED_T={"qti-rubric-block.test":("qti-rubric-block","TestRubricBlockDType"),"qti-content-body.testRubric":("qti-content-body","TestRubricBlockContentBodyDType"),"qti-content-body.testFeedback":("qti-content-body","TestFeedbackFlowContentBodyDType")}
 * # in entries(which), first: if which=="test": entry(n,n,next(iter(DECL[n]))) for n in M4,
 * # entry(h,n,t) for h,(n,t) in DOTTED_T.items(); return them sorted by handle
 * # (VOCAB gains "test":"test")
 * ```
 *
 * Over the 145 entries of the ASI and HTML leaves the attribute declarations number 4217
 * `collapse`, 2053 `preserve`, 396 `replace` and 3 `union`. The phase-2 spec's counts (4254, 2071,
 * 399 and 4) add the 37, 18, 3 and 1 declarations of `TestRubricBlockDType`, the type of
 * `qti-rubric-block` that belongs to the test vocabulary and has no entry here. The processing
 * leaf's 89 entries add 52 `collapse`, 9 `preserve`, 1 `replace` and 10 `union`, which the spec's
 * totals do not describe.
 */
import { Option } from "effect";

import { asiInventory } from "#pantry/schema/content/inventory/asi.ts";
import { htmlInventory } from "#pantry/schema/content/inventory/html.ts";
import { processingInventory } from "#pantry/schema/content/inventory/processing.ts";
import { testInventory } from "#pantry/schema/content/inventory/test.ts";

/**
 * One attribute an XSD type declares, through its attribute groups and its extension bases.
 *
 * `type` is the declared type name (`xml:lang` is `xs:language`, `xml:base` is `xs:anyURI`) or, for
 * an inline type, the name of its base. `default` is the XSD default, absent when none is
 * declared.
 */
export interface InventoryAttribute {
  readonly name: string;
  readonly type: string;
  readonly use: "required" | "optional";
  readonly default: Option.Option<string>;
  readonly family: "own" | "base" | "aria";
  readonly whiteSpace: "preserve" | "replace" | "collapse" | "union";
}

/**
 * One element a content model references, with the occurrence the model allows.
 *
 * `max` is `None` when the model leaves the count unbounded.
 */
export interface InventoryChild {
  readonly name: string;
  readonly min: number;
  readonly max: Option.Option<number>;
}

/**
 * What the XSD declares for one kind handle: the element, its type, whether the type is mixed, its
 * attributes and its children in XSD order.
 */
export interface InventoryEntry {
  readonly handle: string;
  readonly element: string;
  readonly type: string;
  readonly mixed: boolean;
  readonly attributes: readonly InventoryAttribute[];
  readonly children: readonly InventoryChild[];
}

/**
 * A vocabulary's inventory leaf: its entries keyed by kind handle.
 */
export interface InventoryLeaf {
  readonly [handle: string]: InventoryEntry;
}

/**
 * The inventory of every ASI, HTML, processing and test kind, keyed by handle.
 */
export const inventory: InventoryLeaf = {
  ...asiInventory,
  ...htmlInventory,
  ...processingInventory,
  ...testInventory,
};

/**
 * Look up the inventory entry of a kind handle.
 *
 * @param handle - A kind handle such as `qti-simple-match-set` or `qti-content-body.modal`.
 * @returns The entry, or `None` when the handle is not an ASI, HTML or processing kind.
 */
export const entryOf = (handle: string): Option.Option<InventoryEntry> =>
  Option.fromNullishOr(Object.hasOwn(inventory, handle) ? inventory[handle] : undefined);
