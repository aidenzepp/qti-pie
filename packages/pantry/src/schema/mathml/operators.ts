/**
 * The operator classes and the REC's qualifier tables: the data behind the head-dependent models of
 * `m:apply` and `m:bind`.
 *
 * The two generated declarations, `operatorClass` and `tableQualifiers`, come from the script
 * below, run as `python3 -I derive_operators.py` with the XSDs cached at
 * `~/.cache/gr8des/qti3/xsd/mathml/` and the MathML 3 Recommendation (2nd Edition) at
 * `~/.cache/gr8des/w3c/mathml3/chapter4.html`, the script saved from this comment under that name;
 * its output, formatted with `vp fmt`, reproduces the two declarations byte for byte, and its two
 * comment lines state the counts the tests pin. The handles are `m:` and the local name, as in the
 * leaf `mathmlInventory`.
 *
 * The classes are the XSD's: an element whose substitution group is `<class>.class`, and the
 * members of the groups `binary-arith.class` and `unary-arith.class`. The XSD lists `minus` and
 * `root` in `binary-arith` only ("Ambiguous content model altered"); RelaxNG A.2.5 lists them in
 * both classes, which is why their argument count is 1 or 2.
 *
 * A syntax table is a `table class="syntax"` of chapter 4 whose `Class` row does not read
 * `qualifier`: 123 in the chapter, 108 of them in 4.4 (the three of `piecewise`, `piece` and
 * `otherwise` are nested in one outer table). A table names its heads in its heading, one head or
 * several (the trigonometric tables name six), and the qualifier elements a heading mentions
 * (`logbase` under `log`, `momentabout` under `moment`) are not heads. The `Qualifiers` row is read
 * in both its columns where the table has two (strict and not strict; `ci` and `csymbol` admit
 * qualifiers only in the second); `BvarQ` is `bvar` and `DomainQ` is `lowlimit`, `uplimit`,
 * `interval`, `condition` and `domainofapplication` (RelaxNG A.2.2, `DomainQ`).
 *
 * ```python
 * import collections, html, os, re, sys, xml.etree.ElementTree as E
 * from html.parser import HTMLParser
 * XS="{http://www.w3.org/2001/XMLSchema}"
 * XSD=os.path.expanduser("~/.cache/gr8des/qti3/xsd/mathml/")
 * REC=os.path.expanduser("~/.cache/gr8des/w3c/mathml3/chapter4.html")
 * ORDER=["bvar","lowlimit","uplimit","interval","condition","domainofapplication","degree","momentabout","logbase"]
 * GROUP={"BvarQ":["bvar"],"DomainQ":["lowlimit","uplimit","interval","condition","domainofapplication"]}
 * local=lambda q:q.split(":")[-1]
 * classes={}
 * for f in sorted(os.listdir(XSD)):
 *     if not f.endswith(".xsd"): continue
 *     for c in E.parse(XSD+f).getroot():
 *         n=c.get("name") or ""
 *         if c.tag==XS+"element" and (c.get("substitutionGroup") or "").endswith(".class"):
 *             classes[n]=local(c.get("substitutionGroup"))[:-6]
 *         if c.tag==XS+"group" and n.endswith(".class"):
 *             for e in c.iter(XS+"element"): classes[local(e.get("ref"))]=n[:-6]
 * class P(HTMLParser):
 *     def __init__(s):
 *         super().__init__(); s.tables=[]; s.stack=[]; s.row=None; s.cell=None; s.head=None; s.last=""
 *     def handle_starttag(s,t,a):
 *         a=dict(a)
 *         if t in("h2","h3","h4","h5"): s.head=[]
 *         if t=="table": s.stack.append({"h":s.last,"rows":[]} if a.get("class")=="syntax" else None)
 *         top=s.stack[-1] if s.stack else None
 *         if top is None: return
 *         if t=="tr": s.row=[]
 *         if t in("th","td"): s.cell=[]; s.row.append([t,s.cell])
 *     def handle_endtag(s,t):
 *         if t in("h2","h3","h4","h5") and s.head is not None: s.last=" ".join("".join(s.head).split()); s.head=None
 *         if t=="table" and s.stack:
 *             top=s.stack.pop()
 *             if top is not None: s.tables.append(top)
 *         top=s.stack[-1] if s.stack else None
 *         if top is None: return
 *         if t=="tr" and s.row is not None: top["rows"].append(s.row); s.row=None
 *         if t in("th","td"): s.cell=None
 *     def handle_data(s,d):
 *         if s.head is not None: s.head.append(d)
 *         if s.cell is not None: s.cell.append(d)
 * p=P(); p.feed(open(REC,encoding="utf-8").read())
 * def text(cell): return " ".join("".join(cell).split())
 * tables=[]
 * for t in p.tables:
 *     rows={text(r[0][1]):[text(c[1]) for c in r[1:]] for r in t["rows"] if r and r[0][0]=="th"}
 *     tables.append((t["h"],rows))
 * def names(h): return [n for n in re.findall(r"<([A-Za-z-]+)/?>",h) if n not in ("logbase","momentabout")]
 * heads=collections.defaultdict(list)
 * for h,rows in tables:
 *     if h[:3] in("4.2","4.4") and "Class" in rows and rows["Class"][0]!="qualifier": heads[h].append(rows)
 * table_qualifiers={}
 * for h,ts in heads.items():
 *     ns=names(h)
 *     for i,n in enumerate(ns):
 *         rows=ts[i] if len(ts)==len(ns) else ts[0]
 *         kinds=set()
 *         for cell in rows.get("Qualifiers",[]):
 *             for tok in re.split(r"\s*,\s*",cell):
 *                 kinds.update(GROUP.get(tok,[tok] if tok else []))
 *         assert kinds<=set(ORDER),(n,kinds)
 *         table_qualifiers["m:"+n]=[k for k in ORDER if k in kinds]
 * print("// The REC's syntax tables: %d in chapter 4, %d of them in 4.4; %d heads named." % (len(tables), sum(h[:3]=="4.4" for h,_ in tables), len(table_qualifiers)))
 * print("// The XSD's operator classes: %d handles in %d classes." % (len(classes), len(set(classes.values()))))
 * print("/**\n * The class of each operator handle, from the XSD's substitution groups and its two class groups.\n *"+"/")
 * print("export const operatorClass: OperatorClassTable = {")
 * for k in sorted(classes): print(f'  "m:{k}": "{classes[k]}",')
 * print("};\n")
 * print("/**\n * The qualifier kinds each head's syntax table in the REC admits, in qualifier order.\n *"+"/")
 * print("const tableQualifiers: QualifierTable = {")
 * for k in sorted(table_qualifiers): print(f'  "{k}": [{", ".join(chr(34)+"m:"+q+chr(34) for q in table_qualifiers[k])}],')
 * print("};")
 * ```
 */

// The REC's syntax tables: 123 in chapter 4, 108 of them in 4.4; 135 heads named.
// The XSD's operator classes: 125 handles in 34 classes.
/**
 * The class of each operator handle, from the XSD's substitution groups and its two class groups.
 */
export const operatorClass: OperatorClassTable = {
  "m:abs": "unary-arith",
  "m:and": "nary-logical",
  "m:approx": "binary-reln",
  "m:arccos": "unary-elementary",
  "m:arccosh": "unary-elementary",
  "m:arccot": "unary-elementary",
  "m:arccoth": "unary-elementary",
  "m:arccsc": "unary-elementary",
  "m:arccsch": "unary-elementary",
  "m:arcsec": "unary-elementary",
  "m:arcsech": "unary-elementary",
  "m:arcsin": "unary-elementary",
  "m:arcsinh": "unary-elementary",
  "m:arctan": "unary-elementary",
  "m:arctanh": "unary-elementary",
  "m:arg": "unary-arith",
  "m:card": "unary-set",
  "m:cartesianproduct": "nary-set",
  "m:ceiling": "unary-arith",
  "m:codomain": "unary-functional",
  "m:complexes": "constant-set",
  "m:compose": "nary-functional",
  "m:conjugate": "unary-arith",
  "m:cos": "unary-elementary",
  "m:cosh": "unary-elementary",
  "m:cot": "unary-elementary",
  "m:coth": "unary-elementary",
  "m:csc": "unary-elementary",
  "m:csch": "unary-elementary",
  "m:curl": "unary-veccalc",
  "m:determinant": "unary-linalg",
  "m:diff": "Differential-Operator",
  "m:divergence": "unary-veccalc",
  "m:divide": "binary-arith",
  "m:domain": "unary-functional",
  "m:emptyset": "constant-set",
  "m:eq": "nary-reln",
  "m:equivalent": "binary-logical",
  "m:eulergamma": "constant-arith",
  "m:exists": "quantifier",
  "m:exp": "unary-arith",
  "m:exponentiale": "constant-arith",
  "m:factorial": "unary-arith",
  "m:factorof": "binary-reln",
  "m:false": "constant-arith",
  "m:floor": "unary-arith",
  "m:forall": "quantifier",
  "m:gcd": "nary-arith",
  "m:geq": "nary-reln",
  "m:grad": "unary-veccalc",
  "m:gt": "nary-reln",
  "m:ident": "unary-functional",
  "m:image": "unary-functional",
  "m:imaginary": "unary-arith",
  "m:imaginaryi": "constant-arith",
  "m:implies": "binary-logical",
  "m:in": "binary-set",
  "m:infinity": "constant-arith",
  "m:int": "int",
  "m:integers": "constant-set",
  "m:intersect": "nary-set",
  "m:interval": "interval",
  "m:inverse": "unary-functional",
  "m:lambda": "lambda",
  "m:laplacian": "unary-veccalc",
  "m:lcm": "nary-arith",
  "m:leq": "nary-reln",
  "m:limit": "limit",
  "m:list": "nary-setlist-constructor",
  "m:ln": "unary-functional",
  "m:log": "unary-functional",
  "m:lt": "nary-reln",
  "m:matrix": "nary-constructor",
  "m:matrixrow": "nary-constructor",
  "m:max": "nary-minmax",
  "m:mean": "nary-stats",
  "m:median": "nary-stats",
  "m:min": "nary-minmax",
  "m:minus": "binary-arith",
  "m:mode": "nary-stats",
  "m:moment": "unary-functional",
  "m:naturalnumbers": "constant-set",
  "m:neq": "binary-reln",
  "m:not": "unary-logical",
  "m:notanumber": "constant-arith",
  "m:notin": "binary-set",
  "m:notprsubset": "binary-set",
  "m:notsubset": "binary-set",
  "m:or": "nary-logical",
  "m:outerproduct": "binary-linalg",
  "m:partialdiff": "partialdiff",
  "m:pi": "constant-arith",
  "m:plus": "nary-arith",
  "m:power": "binary-arith",
  "m:primes": "constant-set",
  "m:product": "product",
  "m:prsubset": "nary-set-reln",
  "m:quotient": "binary-arith",
  "m:rationals": "constant-set",
  "m:real": "unary-arith",
  "m:reals": "constant-set",
  "m:rem": "binary-arith",
  "m:root": "binary-arith",
  "m:scalarproduct": "binary-linalg",
  "m:sdev": "nary-stats",
  "m:sec": "unary-elementary",
  "m:sech": "unary-elementary",
  "m:selector": "nary-linalg",
  "m:set": "nary-setlist-constructor",
  "m:setdiff": "binary-set",
  "m:sin": "unary-elementary",
  "m:sinh": "unary-elementary",
  "m:subset": "nary-set-reln",
  "m:sum": "sum",
  "m:tan": "unary-elementary",
  "m:tanh": "unary-elementary",
  "m:tendsto": "binary-reln",
  "m:times": "nary-arith",
  "m:transpose": "unary-linalg",
  "m:true": "constant-arith",
  "m:union": "nary-set",
  "m:variance": "nary-stats",
  "m:vector": "nary-constructor",
  "m:vectorproduct": "binary-linalg",
  "m:xor": "nary-logical",
};

/**
 * The qualifier kinds each head's syntax table in the REC admits, in qualifier order.
 */
const tableQualifiers: QualifierTable = {
  "m:abs": [],
  "m:and": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:apply": [],
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
  "m:card": [],
  "m:cartesianproduct": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:cbytes": [],
  "m:ceiling": [],
  "m:cerror": [],
  "m:ci": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
    "m:degree",
    "m:momentabout",
    "m:logbase",
  ],
  "m:cn": [],
  "m:codomain": [],
  "m:complexes": [],
  "m:compose": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:conjugate": [],
  "m:cos": [],
  "m:cosh": [],
  "m:cot": [],
  "m:coth": [],
  "m:cs": [],
  "m:csc": [],
  "m:csch": [],
  "m:csymbol": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
    "m:degree",
    "m:momentabout",
    "m:logbase",
  ],
  "m:curl": [],
  "m:determinant": [],
  "m:diff": [],
  "m:divergence": [],
  "m:divide": [],
  "m:domain": [],
  "m:emptyset": [],
  "m:eq": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:equivalent": [],
  "m:eulergamma": [],
  "m:exists": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:exp": [],
  "m:exponentiale": [],
  "m:factorial": [],
  "m:factorof": [],
  "m:false": [],
  "m:floor": [],
  "m:forall": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:gcd": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:geq": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:grad": [],
  "m:gt": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:ident": [],
  "m:image": [],
  "m:imaginary": [],
  "m:imaginaryi": [],
  "m:implies": [],
  "m:in": [],
  "m:infinity": [],
  "m:int": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:integers": [],
  "m:intersect": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:interval": [],
  "m:inverse": [],
  "m:lambda": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:laplacian": [],
  "m:lcm": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:leq": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:limit": ["m:lowlimit", "m:condition"],
  "m:list": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:ln": [],
  "m:log": ["m:logbase"],
  "m:lt": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:matrix": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:matrixrow": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:max": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:mean": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:median": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:min": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:minus": [],
  "m:mode": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:moment": ["m:degree", "m:momentabout"],
  "m:naturalnumbers": [],
  "m:neq": [],
  "m:not": [],
  "m:notanumber": [],
  "m:notin": [],
  "m:notprsubset": [],
  "m:notsubset": [],
  "m:or": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:otherwise": [],
  "m:outerproduct": [],
  "m:partialdiff": [],
  "m:pi": [],
  "m:piece": [],
  "m:piecewise": [],
  "m:plus": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:power": [],
  "m:primes": [],
  "m:product": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:prsubset": [],
  "m:quotient": [],
  "m:rationals": [],
  "m:real": [],
  "m:reals": [],
  "m:rem": [],
  "m:root": ["m:degree"],
  "m:scalarproduct": [],
  "m:sdev": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:sec": [],
  "m:sech": [],
  "m:selector": [],
  "m:set": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:setdiff": [],
  "m:sin": [],
  "m:sinh": [],
  "m:subset": [],
  "m:sum": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:tan": [],
  "m:tanh": [],
  "m:tendsto": [],
  "m:times": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:transpose": [],
  "m:true": [],
  "m:union": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:variance": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:vector": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
  "m:vectorproduct": [],
  "m:xor": [
    "m:bvar",
    "m:lowlimit",
    "m:uplimit",
    "m:interval",
    "m:condition",
    "m:domainofapplication",
  ],
};

/**
 * The number of syntax tables the REC's chapter 4 holds and the number of them in 4.4, as the
 * script above counts them.
 */
export const recSyntaxTables = { chapter: 123, section44: 108 } as const;

/**
 * A table of class names keyed by operator handle.
 */
export interface OperatorClassTable {
  readonly [handle: string]: string;
}

/**
 * A table of qualifier handles keyed by head handle.
 */
export interface QualifierTable {
  readonly [head: string]: readonly string[];
}

/**
 * A table of argument counts keyed by class name or operator handle.
 */
export interface ArgumentCountTable {
  readonly [name: string]: ArgumentCount;
}

/**
 * An inclusive bound on how many arguments follow an operator's qualifiers in an `m:apply`; `max`
 * is `undefined` for no upper bound.
 */
export interface ArgumentCount {
  readonly max: number | undefined;
  readonly min: number;
}

/**
 * Exactly two arguments: the binary classes (`c4#contm.binary`, "Binary operators take two
 * arguments").
 */
const binary: ArgumentCount = { max: 2, min: 2 };

/**
 * Exactly one argument: the unary classes (`c4#contm.unary`, "Unary operators take a single
 * argument"), and `unary-logical`, whose one member `not` "takes one Boolean argument"
 * (`c4#contm.not`).
 */
const unary: ArgumentCount = { max: 1, min: 1 };

/**
 * Zero or more arguments: the n-ary classes (`c4#contm.nary`, `c4#contm.nary.setlist`,
 * `c4#contm.nary.reln`, `c4#contm.nary.unary`: "the plus operator may have zero or more
 * arguments").
 */
const nary: ArgumentCount = { max: undefined, min: 0 };

/**
 * The argument count of each class whose operators have one stated: the binary, unary and n-ary
 * classes of `c4#contm.opclasses`. A member that differs from its class is in `operatorArguments`.
 */
export const classArguments: ArgumentCountTable = {
  "binary-arith": binary,
  "binary-linalg": binary,
  "binary-logical": binary,
  "binary-reln": binary,
  "binary-set": binary,
  "nary-arith": nary,
  "nary-constructor": nary,
  "nary-functional": nary,
  "nary-linalg": nary,
  "nary-logical": nary,
  "nary-minmax": nary,
  "nary-reln": nary,
  "nary-set": nary,
  "nary-set-reln": nary,
  "nary-setlist-constructor": nary,
  "nary-stats": nary,
  "unary-arith": unary,
  "unary-elementary": unary,
  "unary-functional": unary,
  "unary-linalg": unary,
  "unary-logical": unary,
  "unary-set": unary,
  "unary-veccalc": unary,
};

/**
 * The classes with no stated argument count: the REC's syntax tables for their operators have no
 * count row, and its prose names none that the class fixes (the argument of `int`, `diff`, `sum`
 * and `limit` is a function or an expression in the bound variables, `quantifier` takes the
 * quantified assertion, `interval` and `lambda` are containers, the constants take none). An
 * operator of such a class is refused no count.
 */
export const unstatedClasses: readonly string[] = [
  "Differential-Operator",
  "constant-arith",
  "constant-set",
  "int",
  "interval",
  "lambda",
  "limit",
  "partialdiff",
  "product",
  "quantifier",
  "sum",
];

/**
 * The members whose count differs from their class: `minus` and `root` take one or two arguments
 * (`c4#contm.minus`, "If it is used with one argument, minus corresponds to the unary_minus
 * symbol"; `c4#contm.root`, "If no degree is present, a default value of 2 is used"), and
 * `selector`, the one `nary-linalg` member, takes at least one (`c4#contm.selector`, "It accepts
 * one or more arguments").
 */
const argumentOverrides: ArgumentCountTable = {
  "m:minus": { max: 2, min: 1 },
  "m:root": { max: 2, min: 1 },
  "m:selector": { max: undefined, min: 1 },
};

/**
 * The argument count of each operator handle that has one: its own override, else its class's. A
 * handle of a class in `unstatedClasses` is absent.
 */
export const operatorArguments: ArgumentCountTable = Object.fromEntries(
  Object.entries(operatorClass).flatMap(([handle, className]) => {
    const count = argumentOverrides[handle] ?? classArguments[className];

    return count === undefined ? [] : [[handle, count]];
  }),
);

/**
 * The argument count of `m:partialdiff` when it has no `m:bvar`: two, a list of indices and the
 * function (`c4#contm.partialdiff`, "the containing partialdiff takes two arguments").
 */
export const partialdiffFunctionArguments: ArgumentCount = { max: 2, min: 2 };

/**
 * The qualifier kinds in the order the REC fixes, whenever more than one is present
 * (`c4#contm.qualifiers`).
 */
export const qualifierOrder: readonly string[] = [
  "m:bvar",
  "m:lowlimit",
  "m:uplimit",
  "m:interval",
  "m:condition",
  "m:domainofapplication",
  "m:degree",
  "m:momentabout",
  "m:logbase",
];

/**
 * The qualifiers a head admits that its syntax table leaves out. The REC's own examples bind with
 * `diff`, `partialdiff` and `limit` (`c4#contm.diff`: `<apply><diff/><bvar>`; `c4#contm.limit`: "by
 * specifying a lowlimit and a bvar") though their tables have no `bvar`, and the content model
 * admits `degree` with `diff` and `partialdiff` beside `root` and `moment`, which their tables
 * list.
 */
export const qualifierGaps: QualifierTable = {
  "m:diff": ["m:bvar", "m:degree"],
  "m:limit": ["m:bvar"],
  "m:partialdiff": ["m:bvar", "m:degree"],
};

/**
 * The qualifier kinds each head admits, in qualifier order: its syntax table's `Qualifiers` row and
 * `qualifierGaps`. `m:logbase` is admitted only by `m:log` and `m:ci` and `m:csymbol`,
 * `m:momentabout` only by `m:moment` and those two, as the REC's tables read; a head with no
 * qualifier has an empty list.
 */
export const qualifiersOf: QualifierTable = Object.fromEntries(
  Object.entries(tableQualifiers).map(([head, kinds]) => [
    head,
    qualifierOrder.filter(
      (kind) => kinds.includes(kind) || (qualifierGaps[head]?.includes(kind) ?? false),
    ),
  ]),
);
