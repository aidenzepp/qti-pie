/**
 * Child-expression multiplicity of the 64 expression kinds, in two tables that are empty until
 * phase 3.
 *
 * `operatorArity` states the least number of child expressions a kind admits and `operatorArityMax`
 * the most; a kind with no upper bound has no row in `operatorArityMax`. Their rows land with the
 * 64 expression handles (M3-01 appends the handles to `kinds/asi.ts`, M3-02 the rows here;
 * `docs/goals/qti/phase-3.md`), so both stay empty now and `NodeKindHandle` has no expression names
 * to type a row with yet. A test asserts the tables equal this module's exports and reads this
 * comment.
 *
 * Phase 3 transcribes the rows from the output below. It is produced by the script below, in the
 * form of the spec's 3.6 derivation, over the ASI 3.0 XSD: for each of the 18 leaves and 46
 * operators of `qti-response-processing`'s content, the sum of its child-expression `minOccurs`,
 * and the sum of their `maxOccurs` where every child is bounded, else `*`. `qti-repeat` has min 1
 * (goal 4.14), `qti-base-value` min 0 and max 0, and `qti-sum` min 1 and no max.
 *
 * ```sh
 * cd ~/.cache/gr8des/qti3/xsd && python3 -I - <<'PY'
 * import xml.etree.ElementTree as E
 * XS="{http://www.w3.org/2001/XMLSchema}"
 * root=E.parse("imsqti_asiv3p0_v1p0.xsd").getroot()
 * cts={c.get("name"):c for c in root.findall(XS+"complexType")}
 * LEAVES="qti-base-value qti-variable qti-default qti-correct qti-map-response qti-map-response-point qti-math-constant qti-null qti-random-integer qti-random-float qti-number-correct qti-number-incorrect qti-number-presented qti-number-responded qti-number-selected qti-outcome-minimum qti-outcome-maximum qti-test-variables".split()
 * OPS="qti-and qti-or qti-not qti-any-n qti-match qti-equal qti-equal-rounded qti-gt qti-gte qti-lt qti-lte qti-duration-lt qti-duration-gte qti-member qti-contains qti-delete qti-substring qti-string-match qti-pattern-match qti-inside qti-multiple qti-ordered qti-repeat qti-container-size qti-is-null qti-random qti-index qti-field-value qti-sum qti-product qti-subtract qti-divide qti-power qti-integer-divide qti-integer-modulus qti-integer-to-float qti-round qti-truncate qti-round-to qti-min qti-max qti-gcd qti-lcm qti-math-operator qti-stats-operator qti-custom-operator".split()
 * NAMES=LEAVES+OPS; assert len(NAMES)==64
 * types={}
 * for t in cts.values():
 *     for e in t.iter(XS+"element"):
 *         if e.get("name") in NAMES: types.setdefault(e.get("name"),e.get("type"))
 * def occ(n):
 *     mx=n.get("maxOccurs","1")
 *     return int(n.get("minOccurs","1")),(None if mx=="unbounded" else int(mx))
 * def mul(a,b): return None if a is None or b is None else a*b
 * def add(a,b): return None if a is None or b is None else a+b
 * def model(node):
 *     # (min, max) count of child expressions a model group admits; max None = unbounded
 *     mn,mx=0,0; first=True
 *     for ch in node:
 *         t=ch.tag.replace(XS,"")
 *         if t=="element": c=(1,1) if ch.get("name") in NAMES else (0,0)
 *         elif t in("sequence","choice"): c=model(ch)
 *         elif t=="complexContent":
 *             c=(0,0)
 *             for ext in ch:
 *                 b=(ext.get("base") or "").split(":")[-1]
 *                 if b in cts: c=model(cts[b])
 *                 x=model(ext); c=(c[0]+x[0],add(c[1],x[1]))
 *         else: continue
 *         m,M=occ(ch) if t!="complexContent" else (1,1)
 *         c=(c[0]*m,mul(c[1],M))
 *         if node.tag==XS+"choice": mn=c[0] if first else min(mn,c[0]); mx=c[1] if first else (None if None in(mx,c[1]) else max(mx,c[1]))
 *         else: mn,mx=mn+c[0],add(mx,c[1])
 *         first=False
 *     return mn,mx
 * for n in NAMES:
 *     mn,mx=model(cts[types[n]]); print("%-24s min=%d max=%s"%(n,mn,"*" if mx is None else mx))
 * PY
 * ```
 *
 * ```text
 * qti-base-value           min=0 max=0
 * qti-variable             min=0 max=0
 * qti-default              min=0 max=0
 * qti-correct              min=0 max=0
 * qti-map-response         min=0 max=0
 * qti-map-response-point   min=0 max=0
 * qti-math-constant        min=0 max=0
 * qti-null                 min=0 max=0
 * qti-random-integer       min=0 max=0
 * qti-random-float         min=0 max=0
 * qti-number-correct       min=0 max=0
 * qti-number-incorrect     min=0 max=0
 * qti-number-presented     min=0 max=0
 * qti-number-responded     min=0 max=0
 * qti-number-selected      min=0 max=0
 * qti-outcome-minimum      min=0 max=0
 * qti-outcome-maximum      min=0 max=0
 * qti-test-variables       min=0 max=0
 * qti-and                  min=1 max=*
 * qti-or                   min=1 max=*
 * qti-not                  min=1 max=1
 * qti-any-n                min=1 max=*
 * qti-match                min=2 max=2
 * qti-equal                min=2 max=2
 * qti-equal-rounded        min=2 max=2
 * qti-gt                   min=2 max=2
 * qti-gte                  min=2 max=2
 * qti-lt                   min=2 max=2
 * qti-lte                  min=2 max=2
 * qti-duration-lt          min=2 max=2
 * qti-duration-gte         min=2 max=2
 * qti-member               min=2 max=2
 * qti-contains             min=2 max=2
 * qti-delete               min=2 max=2
 * qti-substring            min=2 max=2
 * qti-string-match         min=2 max=2
 * qti-pattern-match        min=1 max=1
 * qti-inside               min=1 max=1
 * qti-multiple             min=0 max=*
 * qti-ordered              min=0 max=*
 * qti-repeat               min=1 max=*
 * qti-container-size       min=1 max=1
 * qti-is-null              min=1 max=1
 * qti-random               min=1 max=1
 * qti-index                min=1 max=1
 * qti-field-value          min=1 max=1
 * qti-sum                  min=1 max=*
 * qti-product              min=1 max=*
 * qti-subtract             min=2 max=2
 * qti-divide               min=2 max=2
 * qti-power                min=2 max=2
 * qti-integer-divide       min=2 max=2
 * qti-integer-modulus      min=2 max=2
 * qti-integer-to-float     min=1 max=1
 * qti-round                min=1 max=1
 * qti-truncate             min=1 max=1
 * qti-round-to             min=1 max=1
 * qti-min                  min=1 max=*
 * qti-max                  min=1 max=*
 * qti-gcd                  min=1 max=*
 * qti-lcm                  min=1 max=*
 * qti-math-operator        min=1 max=*
 * qti-stats-operator       min=1 max=1
 * qti-custom-operator      min=0 max=*
 * ```
 */
import type { NodeKindHandle } from "#qti/schema/node.ts";

/**
 * The fewest child expressions each expression kind admits. Phase 3 fills it.
 */
export const operatorArity: readonly { readonly kind: NodeKindHandle; readonly min: bigint }[] = [];

/**
 * The most child expressions each bounded expression kind admits. Phase 3 fills it.
 */
export const operatorArityMax: readonly { readonly kind: NodeKindHandle; readonly max: bigint }[] =
  [];
