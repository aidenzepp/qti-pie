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
});
