/**
 * A bounded double's lower bound, judged on its typed value two ways alike: the law oracle's own
 * reading (`boundBroken` of `#pantry/test/oracle.ts`, through its `numberOf`), and the schema's
 * `Double_bound` checks over the import's rows, which read the value by grizzle's
 * `Compute.parseDouble` of the collapsed form, here by the host judge's reading of that parse;
 * the database holds the same rows to the same checks in the database tier.
 *
 * Oracle: XML Schema's value bound as a table (`expected`): a literal is in its domain when it is
 * in `xs:double`'s lexical space (XML Schema 1.0, the edition of spec reading 71, so `+INF` is
 * outside it) and its IEEE value (Part 2 §3.3.5.2, a magnitude below 2^-1075 rounding to a zero of
 * its sign) meets the bound: `NonNegativeDoubleDType`'s `minInclusive="0.0"` (a slider's `step`) or
 * reading 16's `minExclusive="0"` (an outcome declaration's `normal-maximum`). -0 equals 0 under
 * both, so `-0` and `-1e-400` meet `minInclusive` and `1e-400` fails `minExclusive`.
 *
 * Bound: both bounded domains, through one attribute of each, against every form below.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/own.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge as hostJudge, judgedLaws } from "#pantry/test/host-judge.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";

/**
 * The composed grammar.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The law oracle's laws.
 */
const laws = lawsOf(grammar);

/**
 * The laws the host judges, over every statement of the schema.
 */
const hostLaws = judgedLaws(Qti);

/**
 * The forms of the box: zeros of each sign and spelling, magnitudes that round to zero, the least
 * subnormal of each sign, one, the special literals, XML Schema 1.1's `+INF`, and padded forms.
 */
const FORMS = [
  "0",
  "-0",
  "-0.0",
  "1e-400",
  "-1e-400",
  "4.9e-324",
  "-4.9e-324",
  "1",
  "INF",
  "-INF",
  "NaN",
  "+INF",
  " 1 ",
  "\t-0\n",
] as const;

/**
 * The carriers of the box: a slider's `step`, of `NonNegativeDoubleDType` (`minInclusive`), an
 * outcome declaration's `normal-maximum` (`minExclusive`, reading 16), and the text of a foreign
 * element an `xsi:type` gives `NonNegativeDoubleDType` (`minInclusive`).
 */
const ATTRIBUTES = ["step", "normal-maximum", "text"] as const;

/**
 * One case: an attribute, and the form it is written with.
 */
interface BoundCase {
  readonly attribute: (typeof ATTRIBUTES)[number];
  readonly form: (typeof FORMS)[number];
}

/**
 * Draw a case.
 */
const boundCase: Gen<BoundCase> = (source) => ({
  attribute: source.draw(element(ATTRIBUTES)),
  form: source.draw(element(FORMS)),
});

/**
 * The value XML Schema maps a form to after collapsing, `undefined` outside XML Schema 1.0's
 * lexical space of `xs:double`.
 *
 * @param form - The form as written.
 * @returns The value.
 */
const valueOf = (form: string): number | undefined => {
  const text = form.trim();
  if (text === "INF") {
    return Number.POSITIVE_INFINITY;
  }

  if (text === "-INF") {
    return Number.NEGATIVE_INFINITY;
  }

  if (text === "NaN") {
    return Number.NaN;
  }

  return /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?$/u.test(text)
    ? Number(text)
    : undefined;
};

/**
 * The table: whether a case's form is in its attribute's domain.
 *
 * @param drawnCase - The case.
 * @returns Whether XML Schema admits it.
 */
const expected = ({ attribute, form }: BoundCase): boolean => {
  const value = valueOf(form);
  if (value === undefined) {
    return false;
  }

  return attribute === "normal-maximum" ? value > 0 : value >= 0;
};

/**
 * The item of a case: one slider interaction and one outcome declaration, the case's attribute
 * written with its form and the other with a lawful value.
 *
 * @param drawnCase - The case.
 * @returns The item's text.
 */
const itemOf = ({ attribute, form }: BoundCase): string => {
  const step = attribute === "step" ? form : "1";
  const normal = attribute === "normal-maximum" ? form : "1";
  const text = attribute === "text" ? form : "1";

  return `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:qti="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" identifier="item" title="Item" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="float"/>
  <qti-response-declaration identifier="CUSTOM" cardinality="single" base-type="identifier"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="${normal}"/>
  <qti-item-body>
    <qti-slider-interaction response-identifier="RESPONSE" lower-bound="0" upper-bound="10" step="${step}"/>
    <div><qti-custom-interaction response-identifier="CUSTOM"><x:e xmlns:x="urn:x" xsi:type="qti:NonNegativeDoubleDType">${text}</x:e></qti-custom-interaction></div>
  </qti-item-body>
</qti-assessment-item>`;
};

/**
 * The manifest of a one-item package.
 */
const manifest = `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">
  <metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>
  <organizations/>
  <resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources>
</manifest>`;

/**
 * The laws a bound breaks, by the oracle's names: the lexical half of AL1, and the bound.
 */
const boundLaws = new Set(["value domain", "Double bound"]);

/**
 * The laws a bounded text breaks, by the oracle's names: TextDomain's pattern, and the bound.
 */
const textLaws = new Set(["TextDomain", "Double bound"]);

/**
 * The same laws as the schema names its checks.
 */
const boundChecks = new Set(["value_domain", "TextDomain", "Double_bound"]);

/**
 * A case's files.
 *
 * @param drawnCase - The case.
 * @returns Each file's bytes by path.
 */
const filesOf = (drawnCase: BoundCase): ReadonlyMap<string, Uint8Array> =>
  new Map([
    ["imsmanifest.xml", new TextEncoder().encode(manifest)],
    ["item.xml", new TextEncoder().encode(itemOf(drawnCase))],
  ]);

/**
 * Whether the law oracle admits a case: none of its value laws breached on the case's attribute.
 *
 * @param drawnCase - The case.
 * @returns Whether it admits the form.
 */
const oracleAdmits = (drawnCase: BoundCase) =>
  Effect.map(
    judge(
      [...filesOf(drawnCase)].map(([path, bytes]): PackageFile => ({
        bytes,
        kind: path === "imsmanifest.xml" ? "manifest" : "file",
        path,
      })),
      grammar,
      laws,
    ),
    (judgment) =>
      judgment._tag === "Judged"
        ? !judgment.breaches.some(({ keys, law }) =>
            drawnCase.attribute === "text"
              ? textLaws.has(law) && (keys["node"] ?? "").includes("foreign-element")
              : boundLaws.has(law) && keys["name"] === drawnCase.attribute,
          )
        : assert.fail(`the codec refused the package: ${judgment.rule}`),
  );

describe("a bounded double", () => {
  it.effect(
    "is admitted exactly where its IEEE value meets its bound, by the oracle's reading and by the import's rows under the host judge",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: `${String(ATTRIBUTES.length)} carriers, two attributes of the two bounded domains and a bounded text, × ${String(FORMS.length)} forms`,
            caseHang: Duration.seconds(60),
            coverage: requiredInSpace<"admitted" | "refused">(["admitted", "refused"]),
            generator: boundCase,
            limit: ATTRIBUTES.length * FORMS.length,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML Schema's value bound on the IEEE value (Part 2 §3.3.5.2), reading 16",
            },
            suite: "pantry/qti/double-bound",
          },
          (drawnCase, c) =>
            Effect.gen(function* judgeBound() {
              const admitted = expected(drawnCase);
              c.note(admitted ? "admitted" : "refused");

              const dir = yield* scopedPackage(filesOf(drawnCase));
              const program = yield* readProgram(dir);
              const broken = hostJudge(hostRowsOf(program.inputs), hostLaws).broken.flatMap(
                ({ law }) =>
                  law.kind === "check" && boundChecks.has(law.name) ? [Formatter.format(law)] : [],
              );

              assert.strictEqual(yield* oracleAdmits(drawnCase), admitted, "the oracle");
              assert.strictEqual(
                broken.length === 0,
                admitted,
                `the host judge: ${broken.join(", ")}`,
              );
            }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, ATTRIBUTES.length * FORMS.length);
          }),
        ),
      ),
  );
});
