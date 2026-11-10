import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { mathmlNamespace } from "#plate/document/source.ts";
import { acceptedItem, configure, open, redact, render } from "#plate/index.ts";
import type { Accepted, Verdict } from "#plate/index.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * Where the valid MathML fixture sits under the package, which `open` takes as the document's
 * location.
 */
const validLocation = "fixtures/m3e/items/mathml-valid.xml";

/**
 * The folder of the invalid fixtures, one per refused row, each named by its rule.
 */
const invalidFolder = "fixtures/m3e/invalid";

/**
 * The path of a `math` element placed directly in the item body, where every fixture here and
 * every hand-built item puts the formula a test judges.
 */
const mathPath = `qti-assessment-item/qti-item-body/{${mathmlNamespace}}math`;

/**
 * Read a fixture's text as a host reads a document from storage.
 *
 * @param location The fixture's location under the package.
 * @returns Its text.
 */
const fixtureText = (location: string): Effect.Effect<string> =>
  Effect.promise(() => readFile(path.resolve(import.meta.dirname, "..", "..", location), "utf-8"));

/**
 * Open a document from its text, as a host opens one it read from storage.
 *
 * @param location The document's location.
 * @param xml The document's text.
 * @returns The verdict on it.
 */
const openText = (location: string, xml: string): Effect.Effect<Verdict> =>
  open(location, new TextEncoder().encode(xml));

/**
 * Which of the valid fixture's seven block formulas, counted from 1 in document order, each
 * invalid fixture breaks: the `math` element its refusal is located at, which the path spells as
 * `math[n]` among its siblings.
 */
const brokenFormula = {
  "annotation-xml-text": 6,
  "apply-arity": 5,
  "attribute-case": 7,
  "attribute-unknown": 7,
  "bind-bvar": 2,
  "bvar-degree": 2,
  "cn-form": 4,
  "empty-content": 7,
  "foreign-element": 7,
  "maction-selection": 7,
  "maligngroup-place": 7,
  "math-nested": 6,
  "mscarries-last": 7,
  "notation-plus": 7,
  "piecewise-otherwise": 1,
  "qualifier-order": 4,
  "share-target": 2,
  "style-attribute": 7,
  "url-scheme": 7,
  "xref-target": 2,
} as const;

/**
 * Open one of the invalid fixtures.
 *
 * @param rule The fixture's name, the rule it breaks.
 * @returns The verdict on it, and the path of the `math` element its refusal is located at.
 */
const openInvalid = Effect.fnUntraced(function* openInvalid(rule: keyof typeof brokenFormula) {
  const location = `${invalidFolder}/${rule}.xml`;
  const formula = brokenFormula[rule];

  return {
    path: `${mathPath}[${String(formula)}]`,
    verdict: yield* openText(location, yield* fixtureText(location)),
  };
});

/**
 * Write a hand-built item whose body holds one block `math` element with the given content, the
 * MathML prefix `m` declared on the root, so a test states a variant of a rule in one line.
 *
 * @param content The `math` element's content, with `m:` prefixes.
 * @param attributes The `math` element's own attributes, none by default.
 * @returns The item's text.
 */
const mathItem = (content: string, attributes = ""): string =>
  [
    '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:m="http://www.w3.org/1998/Math/MathML" identifier="hand" title="hand" adaptive="false" time-dependent="false">',
    `<qti-item-body><m:math display="block"${attributes}>${content}</m:math></qti-item-body>`,
    "</qti-assessment-item>",
  ].join("");

/**
 * Open a hand-built item ({@link mathItem}).
 *
 * @param content The `math` element's content.
 * @param attributes The `math` element's own attributes.
 * @returns The verdict on it.
 */
const openMath = (content: string, attributes = ""): Effect.Effect<Verdict> =>
  openText("hand/math.xml", mathItem(content, attributes));

/**
 * Take the accepted item out of a verdict, failing the test when the verdict accepts none.
 *
 * @param verdict The verdict.
 * @returns The accepted item.
 */
const acceptedOf = (verdict: Verdict): Accepted =>
  Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(
      `the document is ${verdict.verdict}, not accepted${
        verdict.verdict === "refused"
          ? `: ${JSON.stringify(verdict.refusals.map((refusal) => refusal.detail))}`
          : ""
      }`,
    ),
  );

/**
 * Take the one refusal out of a refused verdict, failing the test when the verdict is not refused
 * or refuses more than once.
 *
 * @param verdict The verdict.
 * @returns The refusal.
 */
const refusalOf = (verdict: Verdict): Refusal => {
  assert.strictEqual(verdict.verdict, "refused", "the document is refused");

  const refusals = verdict.verdict === "refused" ? verdict.refusals : [];
  assert.lengthOf(refusals, 1, "one refusal");

  return refusals[0] ?? assert.fail("a refusal");
};

/**
 * Assert that a verdict refuses once, with the rule `value-type`, at the body's `math` element,
 * with a detail that names the given facts (and may name more).
 *
 * @param judged The verdict, with the path of the `math` element the refusal is located at for a
 *   fixture; a hand-built item's one formula carries no index.
 * @param detail The facts the detail must name: `element` always, `position` and `section` where
 *   the test states them.
 * @returns The refusal.
 */
const expectRefused = (
  judged: Verdict | { readonly path: string; readonly verdict: Verdict },
  detail: { readonly [key: string]: string },
): Refusal => {
  const { path: at, verdict } = "path" in judged ? judged : { path: mathPath, verdict: judged };
  const refusal = refusalOf(verdict);

  assert.strictEqual(refusal.rule, "value-type");
  assert.deepStrictEqual(refusal.location, { kind: "path", path: at });
  for (const [key, value] of Object.entries(detail)) {
    assert.strictEqual(refusal.detail[key], value, `detail.${key}`);
  }
  assert.match(refusal.detail["section"] ?? "", /^[0-9A]/u, "the detail names a section");
  assert.match(refusal.detail["position"] ?? "", /^[1-9][0-9]*$/u, "the detail names a position");

  return refusal;
};

/**
 * Assert that a verdict accepts its document, with no notice.
 *
 * @param verdict The verdict.
 * @returns The accepted item.
 */
const expectAccepted = (verdict: Verdict): Accepted => {
  const accepted = acceptedOf(verdict);

  assert.strictEqual(verdict.verdict, "accepted");

  return accepted;
};

/**
 * A `bind` of `forall` over `x` whose body is the given content.
 *
 * @param body The bound expression.
 * @returns The `bind`.
 */
const forall = (body: string): string =>
  `<m:bind><m:forall/><m:bvar><m:ci>x</m:ci></m:bvar>${body}</m:bind>`;

/**
 * Render an accepted item as the page a host serves, for the first instance.
 *
 * @param accepted The accepted item.
 * @returns The page's HTML.
 */
const htmlOf = Effect.fnUntraced(function* htmlOf(accepted: Accepted) {
  const configuration = yield* configure({});
  const page = yield* Effect.fromResult(
    render(redact(accepted), configuration, { instance: "q1" }),
  );

  return page.html;
});

/**
 * The attribute names written on the tags inside every `math` element of a page, in document order.
 *
 * @param html The page's HTML.
 * @returns The names, each as the page spells it.
 */
const mathAttributeNames = (html: string): readonly string[] =>
  (html.match(/<math\b[\s\S]*?<\/math>/gu) ?? []).flatMap((formula) =>
    (formula.match(/<[a-z][^>]*>/gu) ?? []).flatMap((tag) =>
      Array.from(tag.matchAll(/\s(?<name>[^\s=>/]+)=/gu), (found) => found.groups?.["name"] ?? ""),
    ),
  );

/**
 * Assert that a hand-built formula opens refused and renders nothing, by the given facts.
 *
 * @param content The `math` element's content.
 * @param detail The facts the refusal's detail must name.
 * @param attributes The `math` element's own attributes.
 * @returns The refusal.
 */
const expectFormulaRefused = (
  content: string,
  detail: { readonly [key: string]: string },
  attributes = "",
): Effect.Effect<Refusal> =>
  Effect.map(openMath(content, attributes), (verdict) => {
    const refusal = expectRefused(verdict, detail);

    assert.deepStrictEqual(acceptedItem(verdict), Option.none(), "nothing renders");

    return refusal;
  });

/**
 * The attributes MathML 3 admits on every element, written the way a formula carries them: an `id`,
 * a reference to the `anchor` id of the enclosing element, a `class`, the two links, and the
 * deprecated `other`.
 */
const commonAttributes =
  ' id="c1" xref="anchor" class="c" href="#sq" other="x" cdbase="http://www.openmath.org/cd"';

/**
 * One hand-built formula for each group of elements MathML 3 gives the same attributes, the
 * element that carries `zz="1"` and the formula around it, in a place the element's own rules and
 * its ancestors' admit, so the unknown attribute is the first defect. `math`, `mfenced` and
 * `declare` are not here: `math` carries its attributes through {@link openMath}'s second argument,
 * `mfenced` is rewritten into an `mrow` before the checks run, and `declare` has no valid place a
 * hand-built formula reaches easily.
 */
const unknownAttributeVariants: readonly (readonly [string, string])[] = [
  ["plus", '<m:apply><m:plus zz="1"/><m:ci>a</m:ci><m:ci>b</m:ci></m:apply>'],
  [
    "lowlimit",
    '<m:apply><m:int/><m:bvar><m:ci>t</m:ci></m:bvar><m:lowlimit zz="1"><m:cn>0</m:cn></m:lowlimit><m:uplimit><m:cn>1</m:cn></m:uplimit><m:ci>t</m:ci></m:apply>',
  ],
  ["msqrt", '<m:msqrt zz="1"><m:mi>x</m:mi></m:msqrt>'],
  ["mi", '<m:mi zz="1">x</m:mi>'],
  ["ci", '<m:ci zz="1">x</m:ci>'],
  [
    "annotation",
    '<m:semantics><m:mi>x</m:mi><m:annotation zz="1" encoding="text/plain">x</m:annotation></m:semantics>',
  ],
  [
    "annotation-xml",
    '<m:semantics><m:mi>x</m:mi><m:annotation-xml zz="1" encoding="application/xhtml+xml"><p>x</p></m:annotation-xml></m:semantics>',
  ],
  ["mtr", '<m:mtable><m:mtr zz="1"><m:mtd><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable>'],
  ["msubsup", '<m:msubsup zz="1"><m:mi>x</m:mi><m:mn>1</m:mn><m:mn>2</m:mn></m:msubsup>'],
  ["mstyle", '<m:mstyle zz="1"><m:mi>x</m:mi></m:mstyle>'],
  ["munderover", '<m:munderover zz="1"><m:mo>+</m:mo><m:mn>0</m:mn><m:mn>1</m:mn></m:munderover>'],
  ["mover", '<m:mover zz="1"><m:mi>x</m:mi><m:mo>-</m:mo></m:mover>'],
  ["mo", '<m:mo zz="1">+</m:mo>'],
  ["munder", '<m:munder zz="1"><m:mi>x</m:mi><m:mo>-</m:mo></m:munder>'],
  ["maction", '<m:maction zz="1"><m:mi>a</m:mi><m:mi>b</m:mi></m:maction>'],
  ["mtable", '<m:mtable zz="1"><m:mtr><m:mtd><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable>'],
  ["mstack", '<m:mstack zz="1"><m:mn>1</m:mn></m:mstack>'],
  ["mglyph", '<m:mglyph zz="1" alt="x"/>'],
  ["mspace", '<m:mspace zz="1"/>'],
  ["ms", '<m:ms zz="1">s</m:ms>'],
  ["cn", '<m:cn zz="1">7</m:cn>'],
  ["mfrac", '<m:mfrac zz="1"><m:mn>1</m:mn><m:mn>2</m:mn></m:mfrac>'],
  [
    "semantics",
    '<m:semantics zz="1"><m:mi>x</m:mi><m:annotation encoding="text/plain">x</m:annotation></m:semantics>',
  ],
  ["csymbol", '<m:csymbol zz="1">f</m:csymbol>'],
  ["interval", '<m:interval zz="1"><m:cn>0</m:cn><m:cn>1</m:cn></m:interval>'],
  ["mtd", '<m:mtable><m:mtr><m:mtd zz="1"><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable>'],
  [
    "mscarry",
    '<m:mstack><m:mscarries><m:mscarry zz="1"><m:mn>1</m:mn></m:mscarry></m:mscarries><m:mn>19</m:mn></m:mstack>',
  ],
  [
    "mscarries",
    '<m:mstack><m:mscarries zz="1"><m:mscarry><m:mn>1</m:mn></m:mscarry></m:mscarries><m:mn>19</m:mn></m:mstack>',
  ],
  ["list", '<m:list zz="1"><m:ci>a</m:ci></m:list>'],
  ["mpadded", '<m:mpadded zz="1"><m:mi>x</m:mi></m:mpadded>'],
  ["mrow", '<m:mrow zz="1"><m:mi>x</m:mi></m:mrow>'],
  ["malignmark", '<m:mrow><m:mi>x</m:mi><m:malignmark zz="1"/></m:mrow>'],
  [
    "maligngroup",
    '<m:mtable><m:mtr><m:mtd><m:maligngroup zz="1"/><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable>',
  ],
  ["msline", '<m:mstack><m:mn>1</m:mn><m:msline zz="1"/><m:mn>2</m:mn></m:mstack>'],
  ["mlongdiv", '<m:mlongdiv zz="1"><m:mn>3</m:mn><m:mn>12</m:mn><m:mn>4</m:mn></m:mlongdiv>'],
  ["menclose", '<m:menclose zz="1"><m:mi>x</m:mi></m:menclose>'],
  ["msgroup", '<m:mstack><m:msgroup zz="1"><m:mn>1</m:mn></m:msgroup></m:mstack>'],
  ["msrow", '<m:mstack><m:msrow zz="1"><m:mn>1</m:mn></m:msrow></m:mstack>'],
  ["msub", '<m:msub zz="1"><m:mi>x</m:mi><m:mn>1</m:mn></m:msub>'],
  ["msup", '<m:msup zz="1"><m:mi>x</m:mi><m:mn>2</m:mn></m:msup>'],
  [
    "share",
    '<m:apply><m:plus/><m:apply id="sq"><m:abs/><m:ci>x</m:ci></m:apply><m:share zz="1" href="#sq"/></m:apply>',
  ],
];

describe("I-18: MathML validity, the MathML 3 Recommendation's structural rules", () => {
  it.effect("[I-18] the valid fixture opens accepted, as m3e-05 left it", () =>
    Effect.gen(function* pin() {
      const verdict = yield* openText(validLocation, yield* fixtureText(validLocation));
      const accepted = expectAccepted(verdict);
      const configuration = yield* configure({});
      const page = yield* Effect.fromResult(
        render(redact(accepted), configuration, { instance: "q1" }),
      );
      const again = yield* Effect.fromResult(
        render(redact(accepted), configuration, { instance: "q1" }),
      );

      assert.deepStrictEqual(accepted.unsupported, [], "no math element is a notice");
      assert.lengthOf(page.html.match(/<math\b/gu) ?? [], 7, "every formula renders");
      assert.include(page.html, "<annotation-xml", "the annotation-xml renders");
      assert.strictEqual(page.html, again.html, "the render is the module's, unchanged");
    }),
  );

  it.effect("[I-18] a piecewise with two otherwise parts is refused", () =>
    Effect.gen(function* piecewise() {
      expectRefused(yield* openInvalid("piecewise-otherwise"), {
        element: "otherwise",
        position: "2",
      });
    }),
  );

  it.effect("[I-18] a bvar with two degrees is refused", () =>
    Effect.gen(function* bvar() {
      expectRefused(yield* openInvalid("bvar-degree"), { element: "degree" });
    }),
  );

  it.effect("[I-18] text inside annotation-xml is refused, white space is not", () =>
    Effect.gen(function* annotation() {
      expectRefused(yield* openInvalid("annotation-xml-text"), { element: "annotation-xml" });
      expectAccepted(
        yield* openMath(
          '<m:semantics><m:mi>x</m:mi><m:annotation-xml encoding="application/xhtml+xml">\n  \n</m:annotation-xml></m:semantics>',
        ),
      );
    }),
  );

  it.effect("[I-18] a math inside a math is refused, through foreign content too", () =>
    Effect.gen(function* nested() {
      expectRefused(yield* openInvalid("math-nested"), { element: "math" });
      expectRefused(
        yield* openMath(
          '<m:semantics><m:mi>x</m:mi><m:annotation-xml encoding="application/xhtml+xml"><p>one <m:math><m:mi>y</m:mi></m:math></p></m:annotation-xml></m:semantics>',
        ),
        { element: "math" },
      );
    }),
  );

  it.effect(
    "[I-18] a plus sign in a notation-typed attribute is refused and a leading dot is admitted",
    () =>
      Effect.gen(function* notation() {
        expectRefused(yield* openInvalid("notation-plus"), { element: "mstyle" });
        expectAccepted(
          yield* openMath('<m:mstyle scriptsizemultiplier=".5"><m:mi>x</m:mi></m:mstyle>'),
        );
        expectAccepted(yield* openMath('<m:mstyle scriptlevel="+1"><m:mi>x</m:mi></m:mstyle>'));
        expectRefused(yield* openMath('<m:cn base="+10">7</m:cn>'), { element: "cn" });
        expectRefused(yield* openMath('<m:cn base="0">7</m:cn>'), { element: "cn" });
        expectAccepted(yield* openMath('<m:cn base=" 2 ">101</m:cn>'));
      }),
  );

  it.effect("[I-18] mscarries as the last child of an mstack is refused", () =>
    Effect.gen(function* carries() {
      expectRefused(yield* openInvalid("mscarries-last"), { element: "mscarries" });
    }),
  );

  it.effect("[I-18] a bind without a bvar is refused", () =>
    Effect.gen(function* bind() {
      expectRefused(yield* openInvalid("bind-bvar"), { element: "bind" });
    }),
  );

  it.effect("[I-18] qualifiers out of order, and a condition before any bvar, are refused", () =>
    Effect.gen(function* qualifiers() {
      expectRefused(yield* openInvalid("qualifier-order"), { element: "uplimit" });
      expectRefused(
        yield* openMath(
          "<m:apply><m:sum/><m:condition><m:apply><m:in/><m:ci>x</m:ci><m:ci>S</m:ci></m:apply></m:condition><m:ci>x</m:ci></m:apply>",
        ),
        { element: "condition" },
      );
    }),
  );

  it.effect(
    "[I-18] an apply with the wrong argument count for its operator's class is refused",
    () =>
      Effect.gen(function* arity() {
        expectRefused(yield* openInvalid("apply-arity"), { element: "apply" });
        expectAccepted(
          yield* openMath("<m:apply><m:plus/><m:ci>a</m:ci><m:ci>b</m:ci><m:ci>c</m:ci></m:apply>"),
        );
        expectRefused(yield* openMath("<m:apply><m:selector/></m:apply>"), { element: "apply" });
        expectAccepted(
          yield* openMath(
            "<m:apply><m:moment/><m:cn>1</m:cn><m:cn>2</m:cn><m:cn>3</m:cn><m:cn>4</m:cn><m:cn>5</m:cn></m:apply>",
          ),
        );
      }),
  );

  it.effect("[I-18] an maction whose selection names no child is refused", () =>
    Effect.gen(function* maction() {
      expectRefused(yield* openInvalid("maction-selection"), { element: "maction" });
      expectAccepted(
        yield* openMath(
          '<m:maction actiontype="toggle" selection="2"><m:mi>a</m:mi><m:mi>b</m:mi></m:maction>',
        ),
      );
    }),
  );

  it.effect(
    "[I-18] an maligngroup outside its allowed place, or a cell whose first complete element is no group, is refused",
    () =>
      Effect.gen(function* align() {
        expectRefused(yield* openInvalid("maligngroup-place"), { element: "maligngroup" });
        expectRefused(
          yield* openMath(
            "<m:mtable><m:mtr><m:mtd><m:mi>x</m:mi><m:maligngroup/><m:mo>=</m:mo></m:mtd></m:mtr></m:mtable>",
          ),
          { element: "mtd" },
        );
      }),
  );

  it.effect(
    "[I-18] a share naming no element, or an element that dominates itself, is refused",
    () =>
      Effect.gen(function* share() {
        expectRefused(yield* openInvalid("share-target"), { element: "share" });
        expectRefused(
          yield* openMath(
            '<m:apply id="outer"><m:plus/><m:ci>a</m:ci><m:share href="#outer"/></m:apply>',
          ),
          { element: "share" },
        );
      }),
  );

  it.effect(
    "[I-18] a cn whose content does not fit its type is refused, and a hexdouble of 16 hex digits is kept",
    () =>
      Effect.gen(function* cn() {
        expectRefused(yield* openInvalid("cn-form"), { element: "cn" });
        expectRefused(yield* openMath('<m:cn type="hexdouble">7F800000</m:cn>'), {
          element: "cn",
        });
        expectAccepted(yield* openMath('<m:cn type="hexdouble">7ff0000000000000</m:cn>'));
        expectAccepted(yield* openMath('<m:cn type="rational">3<m:sep/>4</m:cn>'));
        expectRefused(yield* openMath('<m:cn type="rational">3<m:sep/>4<m:sep/>5</m:cn>'), {
          element: "cn",
        });
        expectAccepted(yield* openMath('<m:cn type="e-notation">12.3<m:sep/>5</m:cn>'));
      }),
  );

  it.effect("[I-18] an xref naming no id is refused", () =>
    Effect.gen(function* xref() {
      expectRefused(yield* openInvalid("xref-target"), { element: "cn" });
    }),
  );

  it.effect(
    "[I-18] an empty-content element holding text is refused, holding white space is not",
    () =>
      Effect.gen(function* empty() {
        expectRefused(yield* openInvalid("empty-content"), { element: "mspace" });
        expectAccepted(yield* openMath("<m:mspace> </m:mspace>"));
      }),
  );

  it.effect(
    "[I-18] a refusal is located at its math element and names its section, and a document with two broken rules is refused once, at the first in document order",
    () =>
      Effect.gen(function* located() {
        const wrongMinus =
          "<m:apply><m:minus/><m:ci>a</m:ci><m:ci>b</m:ci><m:ci>c</m:ci></m:apply>";

        expectRefused(yield* openMath(`${forall(wrongMinus)}<m:mspace>x</m:mspace>`), {
          element: "apply",
          position: "3",
          section: "4.4.2.6",
        });
        expectRefused(yield* openMath(`<m:mspace>x</m:mspace>${forall(wrongMinus)}`), {
          element: "mspace",
          position: "1",
        });
      }),
  );

  it.effect(
    "[I-18] a non-MathML element below math, outside annotation-xml, is refused and never rendered",
    () =>
      Effect.gen(function* foreign() {
        const judged = yield* openInvalid("foreign-element");

        expectRefused(judged, { element: "img" });
        assert.deepStrictEqual(acceptedItem(judged.verdict), Option.none(), "nothing renders");
        expectRefused(yield* openMath("<m:mi><span>x</span></m:mi>"), { element: "span" });
        expectRefused(yield* openMath("<m:mrow><m:mscript>x</m:mscript></m:mrow>"), {
          element: "mscript",
        });
      }),
  );

  it.effect(
    "[I-18] a URL-bearing attribute of a MathML element is refused when the body path's scheme filter drops it",
    () =>
      Effect.gen(function* urls() {
        const judged = yield* openInvalid("url-scheme");

        expectRefused(judged, { attribute: "href", element: "mi" });
        assert.deepStrictEqual(acceptedItem(judged.verdict), Option.none(), "nothing renders");
        expectRefused(yield* openMath('<m:mglyph src="java&#9;script:alert(1)" alt="x"/>'), {
          attribute: "src",
          element: "mglyph",
        });
        expectRefused(yield* openMath('<m:ci definitionURL="data:text/html,x">f</m:ci>'), {
          attribute: "definitionURL",
          element: "ci",
        });
        expectRefused(yield* openMath("<m:mi>x</m:mi>", ' altimg="javascript:alert(1)"'), {
          attribute: "altimg",
          element: "math",
        });
        expectAccepted(yield* openMath('<m:mi href="https://example.invalid/x">x</m:mi>'));
        expectAccepted(yield* openMath('<m:mi href="#sq">x</m:mi>'));
        expectAccepted(
          yield* openMath('<m:ci definitionURL="http://www.openmath.org/cd/arith1#plus">f</m:ci>'),
        );
      }),
  );

  it.effect(
    "[I-18] a style attribute on a MathML element is refused, as the body path refuses it on an HTML element",
    () =>
      Effect.gen(function* style() {
        const judged = yield* openInvalid("style-attribute");

        expectRefused(judged, { attribute: "style", element: "mi" });
        assert.deepStrictEqual(acceptedItem(judged.verdict), Option.none(), "nothing renders");
        expectAccepted(yield* openMath('<m:mi class="lead" mathcolor="red">x</m:mi>'));
      }),
  );

  it.effect(
    "[I-18] the valid fixture still opens accepted, and its HTML is what m3e-05b rendered",
    () =>
      Effect.gen(function* pin() {
        const verdict = yield* openText(validLocation, yield* fixtureText(validLocation));
        const html = yield* htmlOf(expectAccepted(verdict));
        const names = mathAttributeNames(html);

        assert.deepStrictEqual(
          names,
          [
            ["display", "dir"],
            ["display", "dir", "id", "href", "xref"],
            ["display", "dir", "encoding", "type", "type"],
            ["display", "dir"],
            ["display", "dir"],
            ["display", "dir", "encoding"],
            [
              "display",
              "dir",
              "scriptsizemultiplier",
              "scriptlevel",
              "actiontype",
              "selection",
              "width",
            ],
          ].flat(),
          "the attributes the formulas render with, as m3e-05b rendered them",
        );
        for (const name of names) {
          assert.match(name, /^(?:definitionURL|[a-z][a-z-]*)$/u, `${name} is lowercase`);
        }
      }),
  );

  it.effect("[I-18] STYLE, Style and sTyLe on a MathML element are refused as style", () =>
    Effect.gen(function* styleCase() {
      const judged = yield* openInvalid("attribute-case");

      expectRefused(judged, { attribute: "style", element: "mi", section: "2.1.6" });
      assert.deepStrictEqual(acceptedItem(judged.verdict), Option.none(), "nothing renders");
      for (const spelling of ["Style", "sTyLe"]) {
        yield* expectFormulaRefused(`<m:mi ${spelling}="color: red">x</m:mi>`, {
          attribute: "style",
          element: "mi",
          section: "2.1.6",
        });
      }
    }),
  );

  it.effect("[I-18] an event-handler attribute is refused in any case, and never rendered", () =>
    Effect.gen(function* handlers() {
      const judged = yield* openInvalid("attribute-unknown");

      expectRefused(judged, { attribute: "onclick", element: "mi", section: "A.2" });
      assert.deepStrictEqual(acceptedItem(judged.verdict), Option.none(), "nothing renders");
      yield* expectFormulaRefused('<m:mi onClick="x">x</m:mi>', {
        attribute: "onclick",
        element: "mi",
        section: "A.2",
      });
      yield* expectFormulaRefused('<m:mi ONLOAD="x">x</m:mi>', {
        attribute: "onload",
        element: "mi",
        section: "A.2",
      });
      yield* expectFormulaRefused('<m:mo onmouseover="x">+</m:mo>', {
        attribute: "onmouseover",
        element: "mo",
        section: "A.2",
      });
    }),
  );

  it.effect(
    "[I-18] an attribute MathML 3 does not give the element is refused, and one it gives is admitted",
    () =>
      Effect.gen(function* allowlist() {
        yield* expectFormulaRefused('<m:mrow mathvariant="bold"><m:mi>x</m:mi></m:mrow>', {
          attribute: "mathvariant",
          element: "mrow",
          section: "A.2",
        });
        yield* expectFormulaRefused('<m:mi selection="1">x</m:mi>', {
          attribute: "selection",
          element: "mi",
          section: "A.2",
        });
        yield* expectFormulaRefused('<m:mi display="block">x</m:mi>', {
          attribute: "display",
          element: "mi",
          section: "A.2",
        });
        yield* expectFormulaRefused(
          "<m:mi>x</m:mi>",
          {
            attribute: "foo",
            element: "math",
            section: "A.2",
          },
          ' foo="1"',
        );
        yield* expectFormulaRefused('<m:mi src="x.png">x</m:mi>', {
          attribute: "src",
          element: "mi",
          section: "A.2",
        });

        expectAccepted(yield* openMath('<m:mi mathvariant="bold">x</m:mi>'));
        expectAccepted(yield* openMath('<m:mrow dir="rtl"><m:mi>x</m:mi></m:mrow>'));
        expectAccepted(yield* openMath("<m:mi>x</m:mi>"));
        expectAccepted(
          yield* openMath('<m:maction selection="1"><m:mi>a</m:mi><m:mi>b</m:mi></m:maction>'),
        );
        expectAccepted(
          yield* openMath(
            '<m:mtable><m:mtr><m:mtd columnalign="left"><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable>',
          ),
        );
        expectAccepted(
          yield* openMath(
            '<m:semantics><m:mi>x</m:mi><m:annotation encoding="text/plain">x</m:annotation></m:semantics>',
          ),
        );
        expectAccepted(yield* openMath('<m:cn type="integer">7</m:cn>'));
      }),
  );

  it.effect(
    "[I-18] the common attributes and the deprecated names are admitted on every element",
    () =>
      Effect.gen(function* common() {
        const carriers = {
          apply: `<m:apply id="anchor"><m:plus/><m:apply${commonAttributes}><m:abs/><m:ci>a</m:ci></m:apply><m:ci>b</m:ci></m:apply>`,
          lowlimit: `<m:apply id="anchor"><m:int/><m:bvar><m:ci>t</m:ci></m:bvar><m:lowlimit${commonAttributes}><m:cn>0</m:cn></m:lowlimit><m:uplimit><m:cn>12</m:cn></m:uplimit><m:ci>t</m:ci></m:apply>`,
          mi: `<m:mrow id="anchor"><m:mi${commonAttributes}>x</m:mi></m:mrow>`,
          sep: `<m:cn id="anchor" type="rational">3<m:sep${commonAttributes}/>4</m:cn>`,
        };

        for (const [carrier, content] of Object.entries(carriers)) {
          const verdict = yield* openMath(content);

          assert.strictEqual(
            verdict.verdict,
            "accepted",
            `${carrier} admits the common attributes`,
          );
          expectAccepted(verdict);
        }

        expectAccepted(yield* openMath("<m:mi>x</m:mi>", ' mode="display" macros="x"'));
        expectAccepted(yield* openMath('<m:mn fontsize="12pt" color="red">1</m:mn>'));
        expectAccepted(
          yield* openMath('<m:mstyle veryverythinmathspace="0"><m:mi>x</m:mi></m:mstyle>'),
        );
      }),
  );

  it.effect(
    "[I-18] a mixed-case known attribute is admitted and rendered under its lowercase name",
    () =>
      Effect.gen(function* mixedCase() {
        const variable = yield* htmlOf(
          expectAccepted(yield* openMath('<m:mi MathVariant="bold">x</m:mi>')),
        );

        assert.include(variable, 'mathvariant="bold"');
        assert.notInclude(variable, "MathVariant");

        const definition = "http://www.openmath.org/cd/arith1#plus";
        for (const spelling of ["DefinitionURL", "definitionurl"]) {
          const html = yield* htmlOf(
            expectAccepted(yield* openMath(`<m:ci ${spelling}="${definition}">f</m:ci>`)),
          );

          assert.include(
            html,
            `definitionURL="${definition}"`,
            `${spelling} renders as definitionURL`,
          );
          assert.notInclude(html, `${spelling}="`, `${spelling} is not rendered as written`);
        }
      }),
  );

  it.effect("[I-18] a URL attribute is classified under its name as read", () =>
    Effect.gen(function* urls() {
      yield* expectFormulaRefused('<m:mi HREF="javascript:alert(1)">x</m:mi>', {
        attribute: "href",
        element: "mi",
        section: "2.1.6",
      });
      yield* expectFormulaRefused(
        "<m:mi>x</m:mi>",
        {
          attribute: "altimg",
          element: "math",
          section: "2.1.6",
        },
        ' Altimg="javascript:alert(1)"',
      );
      yield* expectFormulaRefused('<m:ci DEFINITIONURL="data:text/html,x">f</m:ci>', {
        attribute: "definitionURL",
        element: "ci",
        section: "2.1.6",
      });
      yield* expectFormulaRefused('<m:mglyph SRC="java&#9;script:x" alt="x"/>', {
        attribute: "src",
        element: "mglyph",
        section: "2.1.6",
      });

      const html = yield* htmlOf(
        expectAccepted(yield* openMath('<m:mi HREF="https://example.invalid/x">x</m:mi>')),
      );

      assert.include(html, 'href="https://example.invalid/x"');
      assert.notInclude(html, "HREF");
    }),
  );

  it.effect("[I-18] a namespaced attribute is not part of the tree and is never rendered", () =>
    Effect.gen(function* namespaced() {
      const declared = ' xmlns:xlink="http://www.w3.org/1999/xlink"';
      const variants: readonly (readonly [string, readonly string[]])[] = [
        ['<m:mi xlink:href="javascript:alert(1)">x</m:mi>', ["xlink", "javascript"]],
        ['<m:mi xml:lang="fr">x</m:mi>', ["xml:lang", 'lang="fr"']],
      ];

      for (const [content, absent] of variants) {
        const html = yield* htmlOf(expectAccepted(yield* openMath(content, declared)));

        assert.include(html, "<mi>x</mi>", "the element renders with no attribute");
        for (const text of absent) {
          assert.notInclude(html, text, `${text} is not rendered`);
        }
      }

      const source = yield* fixtureText("src/content/mathml-validity.ts");

      assert.include(source, "xlink:href", "the module's TSDoc names the limit");
    }),
  );

  it.effect(
    "[I-18] the first defect in document order wins when an unknown attribute and a structural defect both stand",
    () =>
      Effect.gen(function* order() {
        const wrongMinus =
          "<m:apply><m:minus/><m:ci>a</m:ci><m:ci>b</m:ci><m:ci>c</m:ci></m:apply>";

        const first = expectRefused(yield* openMath(`<m:mi onclick="x">x</m:mi>${wrongMinus}`), {
          attribute: "onclick",
          element: "mi",
          position: "1",
          section: "A.2",
        });
        const second = expectRefused(yield* openMath(`${wrongMinus}<m:mi onclick="x">x</m:mi>`), {
          element: "apply",
          position: "1",
          section: "4.4.2.6",
        });

        assert.strictEqual(first.detail["attribute"], "onclick");
        assert.notProperty(second.detail, "attribute", "a structural rule names no attribute");
      }),
  );

  it.effect("[I-18] an unknown attribute is refused on one element of each attribute group", () =>
    Effect.gen(function* groups() {
      yield* expectFormulaRefused(
        "<m:mi>x</m:mi>",
        {
          attribute: "zz",
          element: "math",
          section: "A.2",
        },
        ' zz="1"',
      );
      for (const [element, content] of unknownAttributeVariants) {
        const verdict = yield* openMath(content);

        assert.strictEqual(verdict.verdict, "refused", `${element} refuses an unknown attribute`);
        expectRefused(verdict, { attribute: "zz", element, section: "A.2" });
      }
    }),
  );
});
