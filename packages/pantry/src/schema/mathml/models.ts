/**
 * The XSD's content model of every MathML kind: the data behind the content-model guard
 * (`import/guards/mathml.ts`, spec 4.8).
 *
 * A model is a sequence of particles, each a set of child handles with `min` and `max` (`undefined`
 * is unbounded), nested where the XSD nests: `m:mmultiscripts`' pairs of scripts and its optional
 * `(m:mprescripts, pairs)`, the `m:lowlimit`, `m:uplimit?` pair inside the qualifiers. Only
 * element children are modeled; text, whitespace, entity references, comments and processing
 * instructions are outside it, as the `Admission` rows say which of them a kind holds. The 127
 * kinds whose type is empty have `[]`, and so does `m:cbytes`, whose simple content holds none.
 * `m:annotation-xml` is one particle that matches any element child once: its `xs:any`.
 *
 * Every set of more than six handles is one of the eleven named classes below, each derived from
 * the XSD group or substitution group it stands for: the 168 handles of `m:MathExpression`, the
 * 138 of `m:ContExp`, the 29 of `m:PresentationExpression` and the groups built on them. A choice
 * of elements is a set; a model reaches 32 shapes over the 194 handles (spec 3.3).
 *
 * The declarations after the particle types are the output of this script, run as `python3 -I
 * derive_models.py` with the XSDs cached at `~/.cache/gr8des/qti3/xsd/mathml/` and the script saved
 * from this comment under that name, then formatted with `vp fmt`, which reproduces them byte for
 * byte. It reads each element's complex type (its own, or its substitution head's, with the base of
 * an extension), expands a group reference to the group's particle and an abstract element to its
 * concrete members, and folds a group's occurrence into its only child where that is exact. The two
 * `semantics` types are `m:semantics` and `m:semantics.ci` (`mathml3-common.xsd:72-90`,
 * `mathml3-strict-content.xsd:65-83`), and a reference to the group `semantics-ci` is the handle
 * `m:semantics.ci`.
 *
 * ```python
 * import collections, json, os, sys, xml.etree.ElementTree as E
 * XS="{http://www.w3.org/2001/XMLSchema}"
 * DIR=os.path.expanduser("~/.cache/gr8des/qti3/xsd/mathml/")
 * roots=[E.parse(DIR+f).getroot() for f in sorted(os.listdir(DIR)) if f.endswith(".xsd")]
 * GE={};CT={};GR={}
 * for r in roots:
 *     for c in r:
 *         {XS+"element":GE,XS+"complexType":CT,XS+"group":GR}.get(c.tag,{}).__setitem__(c.get("name"),c)
 * def local(t): return t.split(":")[-1]
 * SUBS=collections.defaultdict(set)
 * for n,e in GE.items():
 *     if e.get("substitutionGroup"): SUBS[local(e.get("substitutionGroup"))].add(n)
 * def concrete(n,seen=None):
 *     """an element reference as the concrete elements it stands for"""
 *     seen=seen if seen is not None else set(); out=set()
 *     if GE[n].get("abstract")!="true": out.add(n)
 *     for m in SUBS.get(n,()):
 *         if m not in seen: seen.add(m); out|=concrete(m,seen)
 *     return out
 * # a particle is ("kinds", handles, (min, max)), ("any", (min, max)), ("seq", parts, occ) or ("choice", parts, occ); max None is unbounded
 * def occ(n):
 *     hi=n.get("maxOccurs") or "1"
 *     return int(n.get("minOccurs") or "1"), None if hi=="unbounded" else int(hi)
 * def occof(p): return p[1] if p[0]=="any" else p[2]
 * def withocc(p,o): return ("any",o) if p[0]=="any" else p[:-1]+(o,)
 * def merge(i,o):
 *     """the occurrence of a particle that occurs i times inside a group that occurs o times, None when no single occurrence says it"""
 *     (a,b),(c,d)=i,o
 *     if i==(1,1): return o
 *     if o==(1,1): return i
 *     if a==b: return (a*c, None if d is None else b*d)
 *     if b is None: return (a*c, None)
 *     if a==0: return (0, None if d is None else b*d)
 *     return None
 * def reoccur(p,o):
 *     if o==(1,1): return p
 *     m=merge(occof(p),o)
 *     if m is None: return ("seq",[p],o)
 *     p=withocc(p,m)
 *     if p[0]=="choice" and m==(0,None):
 *         # a child that is itself unbounded loses its own repeat inside an unbounded choice
 *         parts=[]
 *         for q in p[1]:
 *             if occof(q)[1] is None and q[0]!="any": q=withocc(q,(1,1))
 *             parts+=q[1] if q[0]=="choice" and q[2]==(1,1) else [q]
 *         p=("choice",parts,m)
 *     return p
 * def flat(kind,parts):
 *     return [x for p in parts for x in (p[1] if p[0]==kind and p[2]==(1,1) else [p])]
 * def seq(parts,o):
 *     parts=flat("seq",parts)
 *     return reoccur(parts[0],o) if len(parts)==1 else ("seq",parts,o)
 * def choice(parts,o):
 *     parts=flat("choice",parts)
 *     if all(p[0]=="kinds" and p[2]==(1,1) for p in parts):
 *         return reoccur(("kinds",frozenset().union(*[p[1] for p in parts]),(1,1)),o)
 *     return reoccur(parts[0],o) if len(parts)==1 else ("choice",parts,o)
 * LOCALSEM={"semantics":"m:semantics","semantics-ci":"m:semantics.ci"}
 * def px(n):
 *     t=n.tag.replace(XS,""); o=occ(n); kids=[c for c in n if c.tag!=XS+"annotation"]
 *     if t=="element": return ("kinds",frozenset("m:"+x for x in concrete(local(n.get("ref")))),o)
 *     if t=="group":
 *         g=local(n.get("ref"))
 *         if g in LOCALSEM: return ("kinds",frozenset([LOCALSEM[g]]),o)
 *         return reoccur(px([c for c in GR[g] if c.tag!=XS+"annotation"][0]),o)
 *     if t=="sequence": return seq([px(c) for c in kids],o)
 *     if t=="choice": return choice([px(c) for c in kids],o)
 *     if t=="any": return ("any",o)
 *     raise SystemExit("unhandled "+t)
 * def ctype(e):
 *     """the complex type of a global element, its own or its substitution head's"""
 *     while e is not None:
 *         ct=e.find(XS+"complexType")
 *         if ct is not None: return ct
 *         if e.get("type") and local(e.get("type")) in CT: return CT[local(e.get("type"))]
 *         h=e.get("substitutionGroup"); e=GE[local(h)] if h else None
 *     return None
 * GROUPS=(XS+"sequence",XS+"choice",XS+"group")
 * def cm(ct):
 *     out=[]
 *     for c in ct if ct is not None else ():
 *         if c.tag in GROUPS: out.append(px(c))
 *         elif c.tag==XS+"complexContent":
 *             for d in c:
 *                 if d.tag==XS+"extension":
 *                     if local(d.get("base") or "") in CT: out+=cm(CT[local(d.get("base"))])
 *                     out+=[px(x) for x in d if x.tag in GROUPS]
 *     return out
 * def model(ct):
 *     parts=cm(ct)
 *     if not parts: return []
 *     p=seq(parts,(1,1))
 *     return p[1] if p[0]=="seq" and p[2]==(1,1) else [p]
 * def local_type(group): return GR[group].find(XS+"sequence").find(XS+"element").find(XS+"complexType")
 * models={"m:"+n:model(ctype(e)) for n,e in GE.items() if e.get("abstract")!="true"}
 * models["m:semantics"]=model(local_type("semantics"))
 * models["m:semantics.ci"]=model(local_type("semantics-ci"))
 * def group_set(g): return px(GR[g][0])[1]
 * def substitution(n): return frozenset("m:"+x for x in concrete(n))
 * CLASSES={
 *     "expression":group_set("MathExpression"),
 *     "content":group_set("ContExp"),
 *     "presentation":substitution("PresentationExpression"),
 *     "tableCell":substitution("TableCellExpression"),
 *     "tableRow":substitution("TableRowExpression"),
 *     "mstack":group_set("MstackExpression"),
 *     "msrow":group_set("MsrowExpression"),
 *     "tokenContent":group_set("token.content"),
 * }
 * CLASSES["identifierContent"]=CLASSES["presentation"]|{"m:mglyph"}
 * CLASSES["numberContent"]=CLASSES["identifierContent"]|{"m:sep"}
 * CLASSES["scriptRow"]=CLASSES["msrow"]|{"m:mscarry"}
 * DOC={
 *     "expression":"The handles of the XSD group `m:MathExpression`, which `m:math` and the other expression containers hold: the content expressions, the presentation expressions and `m:semantics`.",
 *     "content":"The handles of the XSD group `m:ContExp`, the content expressions every content container holds.",
 *     "presentation":"The concrete members of the XSD substitution group `m:PresentationExpression`.",
 *     "tableCell":"The concrete members of the XSD substitution group `m:TableCellExpression`.",
 *     "tableRow":"The concrete members of the XSD substitution group `m:TableRowExpression`.",
 *     "mstack":"The handles of the XSD group `m:MstackExpression`: an expression, `m:mscarries`, `m:msline`, `m:msrow` or `m:msgroup`.",
 *     "msrow":"The handles of the XSD group `m:MsrowExpression`: an expression or `m:none`, which `m:msrow`, `m:mscarry` and the script pairs of `m:mmultiscripts` hold.",
 *     "tokenContent":"The handles of the XSD group `m:token.content`: the one element a token kind holds between its text.",
 *     "identifierContent":"The elements `m:ci` and `m:csymbol` hold between their text: `m:mglyph` or a presentation expression.",
 *     "numberContent":"The elements `m:cn` holds between its text: `m:mglyph`, `m:sep` or a presentation expression.",
 *     "scriptRow":"The elements `m:mscarries` holds: an `m:msrow` expression or `m:mscarry`.",
 * }
 * def kp(*h,mn=1): return ("kinds",frozenset(h),(mn,1))
 * LIMITS=("seq",[kp("m:lowlimit"),kp("m:uplimit",mn=0)],(1,1))
 * PARTS={
 *     "domain":("The qualifiers a container holds, `m:domainofapplication`, `m:condition` and `m:lowlimit` with an optional `m:uplimit`, in any order and number (the XSD group `m:DomainQ`).",
 *               ("choice",[kp("m:domainofapplication"),kp("m:condition"),LIMITS],(0,None))),
 *     "qualifiers":("The qualifiers an `m:apply` or `m:bind` holds after its head and `m:bvar` elements, in any order and number (the XSD group `m:Qualifier`).",
 *                   ("choice",[kp("m:domainofapplication"),kp("m:condition"),LIMITS,kp("m:degree"),kp("m:momentabout"),kp("m:logbase")],(0,None))),
 * }
 * def key(p): return json.dumps(p,default=sorted)
 * BYSET={v:k for k,v in CLASSES.items()}
 * BYPART={}
 * def lit(s): return "["+", ".join(json.dumps(x) for x in sorted(s))+"]"
 * def mx(v): return "undefined" if v is None else str(v)
 * def emit(p):
 *     if key(p) in BYPART: return BYPART[key(p)]
 *     if p[0]=="any": return "{ any: true, max: %s, min: %d }"%(mx(p[1][1]),p[1][0])
 *     if p[0]=="kinds":
 *         if p[1] in BYSET: names=BYSET[p[1]]
 *         elif len(p[1])<=6: names=lit(p[1])
 *         else: raise SystemExit("unnamed set of %d"%len(p[1]))
 *         return "{ kinds: %s, max: %s, min: %d }"%(names,mx(p[2][1]),p[2][0])
 *     parts="[%s]"%", ".join(emit(x) for x in p[1])
 *     if p[0]=="choice": return "{ choice: %s, max: %s, min: %d }"%(parts,mx(p[2][1]),p[2][0])
 *     return "{ max: %s, min: %d, sequence: %s }"%(mx(p[2][1]),p[2][0],parts)
 * out=[]
 * done=[]
 * for k,v in CLASSES.items():
 *     base=max((d for d in done if CLASSES[d]<=v and len(CLASSES[d])>1),key=lambda d:len(CLASSES[d]),default=None)
 *     items=(["..."+base] if base else [])+[json.dumps(x) for x in sorted(v-(CLASSES[base] if base else set()))]
 *     out.append("\n/**\n * %s\n *\x2f\nconst %s: readonly string[] = [%s];\n"%(DOC[k],k,", ".join(items)))
 *     done.append(k)
 * for k,(doc,p) in PARTS.items():
 *     out.append("\n/**\n * %s\n *\x2f\nconst %s: Particle = %s;\n"%(doc,k,emit(p)))
 *     BYPART[key(p)]=k
 * out.append("\n/**\n * The XSD's content model of each MathML handle, keyed by handle.\n *\x2f\nexport const models = {\n")
 * for k in sorted(models): out.append('  "%s": [%s],\n'%(k,", ".join(emit(p) for p in models[k])))
 * out.append("} satisfies Models;\n")
 * sys.stdout.write("".join(out))
 * print("classes",{k:len(v) for k,v in CLASSES.items()},"kinds",len(models),file=sys.stderr)
 * ```
 */

/**
 * A particle that matches one element child out of a set of handles, repeated between `min` and
 * `max` times.
 */
export interface KindsParticle {
  readonly kinds: readonly string[];
  readonly max: number | undefined;
  readonly min: number;
}

/**
 * A particle that matches any element child, whatever its handle: the XSD's `xs:any`.
 */
export interface AnyParticle {
  readonly any: true;
  readonly max: number | undefined;
  readonly min: number;
}

/**
 * A particle that matches its parts one after the other, the whole repeated between `min` and
 * `max` times.
 */
export interface SequenceParticle {
  readonly max: number | undefined;
  readonly min: number;
  readonly sequence: readonly Particle[];
}

/**
 * A particle that matches one of its parts, repeated between `min` and `max` times.
 */
export interface ChoiceParticle {
  readonly choice: readonly Particle[];
  readonly max: number | undefined;
  readonly min: number;
}

/**
 * One term of a content model. A `max` of `undefined` is unbounded.
 */
export type Particle = AnyParticle | ChoiceParticle | KindsParticle | SequenceParticle;

/**
 * A content model: the particles an element's element children match in order.
 */
export type Model = readonly Particle[];

/**
 * The content models of the MathML kinds, keyed by kind handle.
 */
export type Models = Readonly<Record<string, Model>>;

/**
 * The handles of the XSD group `m:MathExpression`, which `m:math` and the other expression
 * containers hold: the content expressions, the presentation expressions and `m:semantics`.
 */
const expression: readonly string[] = [
  "m:abs",
  "m:and",
  "m:apply",
  "m:approx",
  "m:arccos",
  "m:arccosh",
  "m:arccot",
  "m:arccoth",
  "m:arccsc",
  "m:arccsch",
  "m:arcsec",
  "m:arcsech",
  "m:arcsin",
  "m:arcsinh",
  "m:arctan",
  "m:arctanh",
  "m:arg",
  "m:bind",
  "m:card",
  "m:cartesianproduct",
  "m:cbytes",
  "m:ceiling",
  "m:cerror",
  "m:ci",
  "m:cn",
  "m:codomain",
  "m:complexes",
  "m:compose",
  "m:conjugate",
  "m:cos",
  "m:cosh",
  "m:cot",
  "m:coth",
  "m:cs",
  "m:csc",
  "m:csch",
  "m:csymbol",
  "m:curl",
  "m:declare",
  "m:determinant",
  "m:diff",
  "m:divergence",
  "m:divide",
  "m:domain",
  "m:emptyset",
  "m:eq",
  "m:equivalent",
  "m:eulergamma",
  "m:exists",
  "m:exp",
  "m:exponentiale",
  "m:factorial",
  "m:factorof",
  "m:false",
  "m:floor",
  "m:fn",
  "m:forall",
  "m:gcd",
  "m:geq",
  "m:grad",
  "m:gt",
  "m:ident",
  "m:image",
  "m:imaginary",
  "m:imaginaryi",
  "m:implies",
  "m:in",
  "m:infinity",
  "m:int",
  "m:integers",
  "m:intersect",
  "m:interval",
  "m:inverse",
  "m:lambda",
  "m:laplacian",
  "m:lcm",
  "m:leq",
  "m:limit",
  "m:list",
  "m:ln",
  "m:log",
  "m:lt",
  "m:maction",
  "m:maligngroup",
  "m:malignmark",
  "m:matrix",
  "m:matrixrow",
  "m:max",
  "m:mean",
  "m:median",
  "m:menclose",
  "m:merror",
  "m:mfenced",
  "m:mfrac",
  "m:mi",
  "m:min",
  "m:minus",
  "m:mlongdiv",
  "m:mmultiscripts",
  "m:mn",
  "m:mo",
  "m:mode",
  "m:moment",
  "m:mover",
  "m:mpadded",
  "m:mphantom",
  "m:mroot",
  "m:mrow",
  "m:ms",
  "m:mspace",
  "m:msqrt",
  "m:mstack",
  "m:mstyle",
  "m:msub",
  "m:msubsup",
  "m:msup",
  "m:mtable",
  "m:mtext",
  "m:munder",
  "m:munderover",
  "m:naturalnumbers",
  "m:neq",
  "m:not",
  "m:notanumber",
  "m:notin",
  "m:notprsubset",
  "m:notsubset",
  "m:or",
  "m:outerproduct",
  "m:partialdiff",
  "m:pi",
  "m:piecewise",
  "m:plus",
  "m:power",
  "m:primes",
  "m:product",
  "m:prsubset",
  "m:quotient",
  "m:rationals",
  "m:real",
  "m:reals",
  "m:reln",
  "m:rem",
  "m:root",
  "m:scalarproduct",
  "m:sdev",
  "m:sec",
  "m:sech",
  "m:selector",
  "m:semantics",
  "m:set",
  "m:setdiff",
  "m:share",
  "m:sin",
  "m:sinh",
  "m:subset",
  "m:sum",
  "m:tan",
  "m:tanh",
  "m:tendsto",
  "m:times",
  "m:transpose",
  "m:true",
  "m:union",
  "m:variance",
  "m:vector",
  "m:vectorproduct",
  "m:xor",
];

/**
 * The handles of the XSD group `m:ContExp`, the content expressions every content container holds.
 */
const content: readonly string[] = [
  "m:abs",
  "m:and",
  "m:apply",
  "m:approx",
  "m:arccos",
  "m:arccosh",
  "m:arccot",
  "m:arccoth",
  "m:arccsc",
  "m:arccsch",
  "m:arcsec",
  "m:arcsech",
  "m:arcsin",
  "m:arcsinh",
  "m:arctan",
  "m:arctanh",
  "m:arg",
  "m:bind",
  "m:card",
  "m:cartesianproduct",
  "m:cbytes",
  "m:ceiling",
  "m:cerror",
  "m:ci",
  "m:cn",
  "m:codomain",
  "m:complexes",
  "m:compose",
  "m:conjugate",
  "m:cos",
  "m:cosh",
  "m:cot",
  "m:coth",
  "m:cs",
  "m:csc",
  "m:csch",
  "m:csymbol",
  "m:curl",
  "m:declare",
  "m:determinant",
  "m:diff",
  "m:divergence",
  "m:divide",
  "m:domain",
  "m:emptyset",
  "m:eq",
  "m:equivalent",
  "m:eulergamma",
  "m:exists",
  "m:exp",
  "m:exponentiale",
  "m:factorial",
  "m:factorof",
  "m:false",
  "m:floor",
  "m:fn",
  "m:forall",
  "m:gcd",
  "m:geq",
  "m:grad",
  "m:gt",
  "m:ident",
  "m:image",
  "m:imaginary",
  "m:imaginaryi",
  "m:implies",
  "m:in",
  "m:infinity",
  "m:int",
  "m:integers",
  "m:intersect",
  "m:interval",
  "m:inverse",
  "m:lambda",
  "m:laplacian",
  "m:lcm",
  "m:leq",
  "m:limit",
  "m:list",
  "m:ln",
  "m:log",
  "m:lt",
  "m:matrix",
  "m:matrixrow",
  "m:max",
  "m:mean",
  "m:median",
  "m:min",
  "m:minus",
  "m:mode",
  "m:moment",
  "m:naturalnumbers",
  "m:neq",
  "m:not",
  "m:notanumber",
  "m:notin",
  "m:notprsubset",
  "m:notsubset",
  "m:or",
  "m:outerproduct",
  "m:partialdiff",
  "m:pi",
  "m:piecewise",
  "m:plus",
  "m:power",
  "m:primes",
  "m:product",
  "m:prsubset",
  "m:quotient",
  "m:rationals",
  "m:real",
  "m:reals",
  "m:reln",
  "m:rem",
  "m:root",
  "m:scalarproduct",
  "m:sdev",
  "m:sec",
  "m:sech",
  "m:selector",
  "m:set",
  "m:setdiff",
  "m:share",
  "m:sin",
  "m:sinh",
  "m:subset",
  "m:sum",
  "m:tan",
  "m:tanh",
  "m:tendsto",
  "m:times",
  "m:transpose",
  "m:true",
  "m:union",
  "m:variance",
  "m:vector",
  "m:vectorproduct",
  "m:xor",
];

/**
 * The concrete members of the XSD substitution group `m:PresentationExpression`.
 */
const presentation: readonly string[] = [
  "m:maction",
  "m:maligngroup",
  "m:malignmark",
  "m:menclose",
  "m:merror",
  "m:mfenced",
  "m:mfrac",
  "m:mi",
  "m:mlongdiv",
  "m:mmultiscripts",
  "m:mn",
  "m:mo",
  "m:mover",
  "m:mpadded",
  "m:mphantom",
  "m:mroot",
  "m:mrow",
  "m:ms",
  "m:mspace",
  "m:msqrt",
  "m:mstack",
  "m:mstyle",
  "m:msub",
  "m:msubsup",
  "m:msup",
  "m:mtable",
  "m:mtext",
  "m:munder",
  "m:munderover",
];

/**
 * The concrete members of the XSD substitution group `m:TableCellExpression`.
 */
const tableCell: readonly string[] = ["m:mtd"];

/**
 * The concrete members of the XSD substitution group `m:TableRowExpression`.
 */
const tableRow: readonly string[] = ["m:mlabeledtr", "m:mtr"];

/**
 * The handles of the XSD group `m:MstackExpression`: an expression, `m:mscarries`, `m:msline`,
 * `m:msrow` or `m:msgroup`.
 */
const mstack: readonly string[] = [
  ...expression,
  "m:mscarries",
  "m:msgroup",
  "m:msline",
  "m:msrow",
];

/**
 * The handles of the XSD group `m:MsrowExpression`: an expression or `m:none`, which `m:msrow`,
 * `m:mscarry` and the script pairs of `m:mmultiscripts` hold.
 */
const msrow: readonly string[] = [...expression, "m:none"];

/**
 * The handles of the XSD group `m:token.content`: the one element a token kind holds between its
 * text.
 */
const tokenContent: readonly string[] = ["m:malignmark", "m:mglyph"];

/**
 * The elements `m:ci` and `m:csymbol` hold between their text: `m:mglyph` or a presentation
 * expression.
 */
const identifierContent: readonly string[] = [...presentation, "m:mglyph"];

/**
 * The elements `m:cn` holds between its text: `m:mglyph`, `m:sep` or a presentation expression.
 */
const numberContent: readonly string[] = [...identifierContent, "m:sep"];

/**
 * The elements `m:mscarries` holds: an `m:msrow` expression or `m:mscarry`.
 */
const scriptRow: readonly string[] = [...msrow, "m:mscarry"];

/**
 * The qualifiers a container holds, `m:domainofapplication`, `m:condition` and `m:lowlimit` with an
 * optional `m:uplimit`, in any order and number (the XSD group `m:DomainQ`).
 */
const domain: Particle = {
  choice: [
    { kinds: ["m:domainofapplication"], max: 1, min: 1 },
    { kinds: ["m:condition"], max: 1, min: 1 },
    {
      max: 1,
      min: 1,
      sequence: [
        { kinds: ["m:lowlimit"], max: 1, min: 1 },
        { kinds: ["m:uplimit"], max: 1, min: 0 },
      ],
    },
  ],
  max: undefined,
  min: 0,
};

/**
 * The qualifiers an `m:apply` or `m:bind` holds after its head and `m:bvar` elements, in any order
 * and number (the XSD group `m:Qualifier`).
 */
const qualifiers: Particle = {
  choice: [
    { kinds: ["m:domainofapplication"], max: 1, min: 1 },
    { kinds: ["m:condition"], max: 1, min: 1 },
    {
      max: 1,
      min: 1,
      sequence: [
        { kinds: ["m:lowlimit"], max: 1, min: 1 },
        { kinds: ["m:uplimit"], max: 1, min: 0 },
      ],
    },
    { kinds: ["m:degree"], max: 1, min: 1 },
    { kinds: ["m:momentabout"], max: 1, min: 1 },
    { kinds: ["m:logbase"], max: 1, min: 1 },
  ],
  max: undefined,
  min: 0,
};

/**
 * The XSD's content model of each MathML handle, keyed by handle.
 */
export const models = {
  "m:abs": [],
  "m:and": [],
  "m:annotation": [],
  "m:annotation-xml": [{ any: true, max: 1, min: 1 }],
  "m:apply": [
    { kinds: content, max: 1, min: 1 },
    { kinds: ["m:bvar"], max: undefined, min: 0 },
    qualifiers,
    { kinds: content, max: undefined, min: 0 },
  ],
  "m:approx": [],
  "m:arccos": [],
  "m:arccosh": [],
  "m:arccot": [],
  "m:arccoth": [],
  "m:arccsc": [],
  "m:arccsch": [],
  "m:arcsec": [],
  "m:arcsech": [],
  "m:arcsin": [],
  "m:arcsinh": [],
  "m:arctan": [],
  "m:arctanh": [],
  "m:arg": [],
  "m:bind": [
    { kinds: content, max: 1, min: 1 },
    { kinds: ["m:bvar"], max: undefined, min: 0 },
    qualifiers,
    { kinds: content, max: undefined, min: 0 },
  ],
  "m:bvar": [{ kinds: ["m:ci", "m:degree", "m:semantics.ci"], max: undefined, min: 0 }],
  "m:card": [],
  "m:cartesianproduct": [],
  "m:cbytes": [],
  "m:ceiling": [],
  "m:cerror": [
    { kinds: ["m:csymbol"], max: 1, min: 1 },
    { kinds: content, max: undefined, min: 0 },
  ],
  "m:ci": [{ kinds: identifierContent, max: undefined, min: 0 }],
  "m:cn": [{ kinds: numberContent, max: undefined, min: 0 }],
  "m:codomain": [],
  "m:complexes": [],
  "m:compose": [],
  "m:condition": [{ kinds: content, max: 1, min: 1 }],
  "m:conjugate": [],
  "m:cos": [],
  "m:cosh": [],
  "m:cot": [],
  "m:coth": [],
  "m:cs": [],
  "m:csc": [],
  "m:csch": [],
  "m:csymbol": [{ kinds: identifierContent, max: undefined, min: 0 }],
  "m:curl": [],
  "m:declare": [{ kinds: content, max: undefined, min: 1 }],
  "m:degree": [{ kinds: content, max: 1, min: 1 }],
  "m:determinant": [],
  "m:diff": [],
  "m:divergence": [],
  "m:divide": [],
  "m:domain": [],
  "m:domainofapplication": [{ kinds: content, max: 1, min: 1 }],
  "m:emptyset": [],
  "m:eq": [],
  "m:equivalent": [],
  "m:eulergamma": [],
  "m:exists": [],
  "m:exp": [],
  "m:exponentiale": [],
  "m:factorial": [],
  "m:factorof": [],
  "m:false": [],
  "m:floor": [],
  "m:fn": [{ kinds: content, max: 1, min: 1 }],
  "m:forall": [],
  "m:gcd": [],
  "m:geq": [],
  "m:grad": [],
  "m:gt": [],
  "m:ident": [],
  "m:image": [],
  "m:imaginary": [],
  "m:imaginaryi": [],
  "m:implies": [],
  "m:in": [],
  "m:infinity": [],
  "m:int": [],
  "m:integers": [],
  "m:intersect": [],
  "m:interval": [
    { kinds: content, max: 1, min: 1 },
    { kinds: content, max: 1, min: 1 },
  ],
  "m:inverse": [],
  "m:lambda": [
    { kinds: ["m:bvar"], max: undefined, min: 0 },
    domain,
    { kinds: content, max: 1, min: 1 },
  ],
  "m:laplacian": [],
  "m:lcm": [],
  "m:leq": [],
  "m:limit": [],
  "m:list": [
    { kinds: ["m:bvar"], max: undefined, min: 0 },
    domain,
    { kinds: content, max: undefined, min: 0 },
  ],
  "m:ln": [],
  "m:log": [],
  "m:logbase": [{ kinds: content, max: 1, min: 1 }],
  "m:lowlimit": [{ kinds: content, max: 1, min: 1 }],
  "m:lt": [],
  "m:maction": [{ kinds: expression, max: undefined, min: 1 }],
  "m:maligngroup": [],
  "m:malignmark": [],
  "m:math": [{ kinds: expression, max: undefined, min: 0 }],
  "m:matrix": [
    { kinds: ["m:bvar"], max: undefined, min: 0 },
    domain,
    { kinds: content, max: undefined, min: 0 },
  ],
  "m:matrixrow": [
    { kinds: ["m:bvar"], max: undefined, min: 0 },
    domain,
    { kinds: content, max: undefined, min: 0 },
  ],
  "m:max": [],
  "m:mean": [],
  "m:median": [],
  "m:menclose": [{ kinds: expression, max: undefined, min: 0 }],
  "m:merror": [{ kinds: expression, max: undefined, min: 0 }],
  "m:mfenced": [{ kinds: expression, max: undefined, min: 0 }],
  "m:mfrac": [
    { kinds: expression, max: 1, min: 1 },
    { kinds: expression, max: 1, min: 1 },
  ],
  "m:mglyph": [],
  "m:mi": [{ kinds: tokenContent, max: undefined, min: 0 }],
  "m:min": [],
  "m:minus": [],
  "m:mlabeledtr": [{ kinds: tableCell, max: undefined, min: 1 }],
  "m:mlongdiv": [
    { kinds: mstack, max: 1, min: 1 },
    { kinds: mstack, max: 1, min: 1 },
    { kinds: mstack, max: undefined, min: 1 },
  ],
  "m:mmultiscripts": [
    { kinds: expression, max: 1, min: 1 },
    {
      max: undefined,
      min: 0,
      sequence: [
        { kinds: msrow, max: 1, min: 1 },
        { kinds: msrow, max: 1, min: 1 },
      ],
    },
    {
      max: 1,
      min: 0,
      sequence: [
        { kinds: ["m:mprescripts"], max: 1, min: 1 },
        {
          max: undefined,
          min: 0,
          sequence: [
            { kinds: msrow, max: 1, min: 1 },
            { kinds: msrow, max: 1, min: 1 },
          ],
        },
      ],
    },
  ],
  "m:mn": [{ kinds: tokenContent, max: undefined, min: 0 }],
  "m:mo": [{ kinds: tokenContent, max: undefined, min: 0 }],
  "m:mode": [],
  "m:moment": [],
  "m:momentabout": [{ kinds: content, max: 1, min: 1 }],
  "m:mover": [
    { kinds: expression, max: 1, min: 1 },
    { kinds: expression, max: 1, min: 1 },
  ],
  "m:mpadded": [{ kinds: expression, max: undefined, min: 0 }],
  "m:mphantom": [{ kinds: expression, max: undefined, min: 0 }],
  "m:mprescripts": [],
  "m:mroot": [
    { kinds: expression, max: 1, min: 1 },
    { kinds: expression, max: 1, min: 1 },
  ],
  "m:mrow": [{ kinds: expression, max: undefined, min: 0 }],
  "m:ms": [{ kinds: tokenContent, max: undefined, min: 0 }],
  "m:mscarries": [{ kinds: scriptRow, max: undefined, min: 0 }],
  "m:mscarry": [{ kinds: msrow, max: undefined, min: 0 }],
  "m:msgroup": [{ kinds: mstack, max: undefined, min: 0 }],
  "m:msline": [],
  "m:mspace": [],
  "m:msqrt": [{ kinds: expression, max: undefined, min: 0 }],
  "m:msrow": [{ kinds: msrow, max: undefined, min: 0 }],
  "m:mstack": [{ kinds: mstack, max: undefined, min: 0 }],
  "m:mstyle": [{ kinds: expression, max: undefined, min: 0 }],
  "m:msub": [
    { kinds: expression, max: 1, min: 1 },
    { kinds: expression, max: 1, min: 1 },
  ],
  "m:msubsup": [
    { kinds: expression, max: 1, min: 1 },
    { kinds: expression, max: 1, min: 1 },
    { kinds: expression, max: 1, min: 1 },
  ],
  "m:msup": [
    { kinds: expression, max: 1, min: 1 },
    { kinds: expression, max: 1, min: 1 },
  ],
  "m:mtable": [{ kinds: tableRow, max: undefined, min: 0 }],
  "m:mtd": [{ kinds: expression, max: undefined, min: 0 }],
  "m:mtext": [{ kinds: tokenContent, max: undefined, min: 0 }],
  "m:mtr": [{ kinds: tableCell, max: undefined, min: 0 }],
  "m:munder": [
    { kinds: expression, max: 1, min: 1 },
    { kinds: expression, max: 1, min: 1 },
  ],
  "m:munderover": [
    { kinds: expression, max: 1, min: 1 },
    { kinds: expression, max: 1, min: 1 },
    { kinds: expression, max: 1, min: 1 },
  ],
  "m:naturalnumbers": [],
  "m:neq": [],
  "m:none": [],
  "m:not": [],
  "m:notanumber": [],
  "m:notin": [],
  "m:notprsubset": [],
  "m:notsubset": [],
  "m:or": [],
  "m:otherwise": [{ kinds: content, max: 1, min: 1 }],
  "m:outerproduct": [],
  "m:partialdiff": [],
  "m:pi": [],
  "m:piece": [
    { kinds: content, max: 1, min: 1 },
    { kinds: content, max: 1, min: 1 },
  ],
  "m:piecewise": [{ kinds: ["m:otherwise", "m:piece"], max: undefined, min: 0 }],
  "m:plus": [],
  "m:power": [],
  "m:primes": [],
  "m:product": [],
  "m:prsubset": [],
  "m:quotient": [],
  "m:rationals": [],
  "m:real": [],
  "m:reals": [],
  "m:reln": [{ kinds: content, max: undefined, min: 0 }],
  "m:rem": [],
  "m:root": [],
  "m:scalarproduct": [],
  "m:sdev": [],
  "m:sec": [],
  "m:sech": [],
  "m:selector": [],
  "m:semantics": [
    { kinds: expression, max: 1, min: 1 },
    { kinds: ["m:annotation", "m:annotation-xml"], max: undefined, min: 0 },
  ],
  "m:semantics.ci": [
    { kinds: ["m:ci", "m:semantics.ci"], max: 1, min: 1 },
    { kinds: ["m:annotation", "m:annotation-xml"], max: undefined, min: 0 },
  ],
  "m:sep": [],
  "m:set": [
    { kinds: ["m:bvar"], max: undefined, min: 0 },
    domain,
    { kinds: content, max: undefined, min: 0 },
  ],
  "m:setdiff": [],
  "m:share": [],
  "m:sin": [],
  "m:sinh": [],
  "m:subset": [],
  "m:sum": [],
  "m:tan": [],
  "m:tanh": [],
  "m:tendsto": [],
  "m:times": [],
  "m:transpose": [],
  "m:true": [],
  "m:union": [],
  "m:uplimit": [{ kinds: content, max: 1, min: 1 }],
  "m:variance": [],
  "m:vector": [
    { kinds: ["m:bvar"], max: undefined, min: 0 },
    domain,
    { kinds: content, max: undefined, min: 0 },
  ],
  "m:vectorproduct": [],
  "m:xor": [],
} satisfies Models;
