/**
 * An assembled document's `m:share` elements, judged over the assembly (spec reading 117): a share
 * in an item names an element of a fragment the item includes, or the reverse, and "MathML share
 * cycle" follows the merged document's edges, per placement. The law oracle judges the package
 * (`#pantry/test/locate.ts` `oracleVerdict`), and the import's rows are judged by the schema's own
 * laws on the host (`#pantry/test/host-judge.ts`), and the two verdicts must be one.
 *
 * Each case is a package of one or two items and the fragment they include. The shares that cross
 * the include (a fragment's share naming its item's element, and the reverse) are accepted by both;
 * a cycle across the include, or through the include's site, is refused by both; and a fragment
 * placed in two items, whose share edges close a cycle only when the two assemblies are read as
 * one, is accepted by both (decision 417), since each placement is ranked apart.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { lawIdentity, ruleOfLaws } from "#pantry/import/refusal.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/key-copies.ts";
import { oracleVerdict } from "#pantry/test/locate.ts";

/**
 * The QTI items' namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The MathML namespace declaration every document of a case carries.
 */
const mathns = 'xmlns:m="http://www.w3.org/1998/Math/MathML"';

/**
 * An item whose body is the given markup, with the one choice interaction and the scoring the base
 * item has (the case's own markup is the only thing that differs between cases).
 *
 * @param identifier - The item's identifier.
 * @param body - The markup after the item's choice interaction.
 * @returns The item's document.
 */
const itemOf = (identifier: string, body: string): string =>
  `<qti-assessment-item xmlns:xi="http://www.w3.org/2001/XInclude" ${mathns} xmlns="${asi}" identifier="${identifier}" title="Item" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <p id="intro">Pick one.</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
    ${body}
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

/**
 * The manifest of a package of the given items, each depending on the one fragment.
 *
 * @param items - The items' file names.
 * @returns The manifest's document.
 */
const manifestOf = (
  items: readonly string[],
): string => `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">
  <metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>
  <organizations/>
  <resources>${items
    .map(
      (href, at) =>
        `<resource identifier="R${at}" type="imsqti_item_xmlv3p0" href="${href}"><file href="${href}"/><dependency identifierref="F"/></resource>`,
    )
    .join(
      "",
    )}<resource identifier="F" type="imsqti_fragment_xmlv3p0" href="fragment.xml"><file href="fragment.xml"/></resource></resources>
</manifest>`;

/**
 * The include every item's body ends with.
 */
const include = '<xi:include href="fragment.xml"/>';

/**
 * A fragment of a division holding the given markup.
 *
 * @param inner - The markup inside the division.
 * @returns The fragment's document.
 */
const divFragment = (inner: string): string => `<div xmlns="${asi}" ${mathns}>${inner}</div>`;

/**
 * A case: the markup of each item's body (before the include) and the fragment's document, and
 * whether both judges accept the package.
 */
interface Case {
  readonly accepted: boolean;
  readonly fragment: string;
  readonly items: readonly string[];
  readonly name: string;
}

/**
 * A case whose items' bodies end with the include.
 */
const cases: readonly Case[] = [
  {
    accepted: true,
    fragment: divFragment("<p>f</p>"),
    items: ['<m:math><m:mi id="x">x</m:mi><m:share src="#x"/></m:math>'],
    name: "a share beside the element it names, in the item",
  },
  {
    accepted: true,
    fragment: divFragment('<m:math><m:share src="#x"/></m:math>'),
    items: ['<m:math><m:mi id="x">x</m:mi></m:math>'],
    name: "a share in the fragment naming an element of its item",
  },
  {
    accepted: true,
    fragment: divFragment('<m:math><m:mi id="y">y</m:mi></m:math>'),
    items: ['<m:math><m:share src="#y"/></m:math>'],
    name: "a share in the item naming an element of its fragment",
  },
  {
    accepted: true,
    fragment: divFragment('<m:math><m:mi id="y">y</m:mi><m:share src="#y"/></m:math>'),
    items: [""],
    name: "a share beside the element it names, in the fragment",
  },
  {
    accepted: true,
    fragment: divFragment('<m:math><m:mi xref="x">z</m:mi></m:math>'),
    items: ['<m:math><m:mi id="x">x</m:mi></m:math>'],
    name: "an xref in the fragment naming an element of its item",
  },
  {
    accepted: true,
    fragment: divFragment("<p>f</p>"),
    items: ['<p id="h">h</p><m:math><m:share src="#h"/></m:math>'],
    name: "a share naming an HTML element outside any math",
  },
  {
    accepted: false,
    fragment: divFragment('<m:math><m:mrow id="y"><m:share src="#x"/></m:mrow></m:math>'),
    items: ['<m:math><m:mrow id="x"><m:share src="#y"/></m:mrow></m:math>'],
    name: "a cycle across the include",
  },
  {
    accepted: false,
    fragment: `<m:math xmlns="${asi}" ${mathns}><m:share src="#x"/></m:math>`,
    items: [`<div id="x">${include}</div>`],
    name: "a cycle through the include's site",
  },
  {
    accepted: false,
    fragment: `<m:math xmlns="${asi}" ${mathns} id="mm"><m:share src="#p"/></m:math>`,
    items: [`<m:math><m:mrow><m:share src="#mm"/></m:mrow></m:math><div id="p">${include}</div>`],
    name: "a cycle through the include's site, whose spliced element a share of the item reaches first",
  },
  {
    accepted: true,
    fragment: `<m:math xmlns="${asi}" ${mathns}><m:mrow id="y"><m:share src="#x"/></m:mrow><m:mrow id="z"><m:share src="#w"/></m:mrow></m:math>`,
    items: [
      '<m:math><m:mrow id="x"><m:share src="#z"/></m:mrow><m:mi id="w">w</m:mi></m:math>',
      '<m:math><m:mi id="x">x</m:mi><m:mrow id="w"><m:share src="#y"/></m:mrow></m:math>',
    ],
    name: "a fragment in two items whose share edges close a cycle only across the two assemblies",
  },
];

/**
 * The entries of a case's package.
 *
 * @param drawn - The case.
 * @returns Its entries by path.
 */
const entriesOf = (drawn: Case): PackageEntries => {
  const text = new TextEncoder();
  const names = drawn.items.map((_, at) => (at === 0 ? "item.xml" : `item${at + 1}.xml`));

  return new Map([
    ["imsmanifest.xml", text.encode(manifestOf(names))],
    ["fragment.xml", text.encode(drawn.fragment)],
    ...drawn.items.map(
      (body, at) =>
        [
          names[at] ?? "item.xml",
          text.encode(
            itemOf(
              at === 0 ? "item" : `item${at + 1}`,
              body.includes("xi:include") ? body : body + include,
            ),
          ),
        ] as const,
    ),
  ]);
};

/**
 * Every law the host judges, read once.
 */
const laws = judgedLaws(Qti.statements);

layer(NodeServices.layer, { excludeTestServices: true })("an assembled document's shares", (it) => {
  it.effect(
    "gives the law oracle's verdict and the schema's over the import's rows, case by case",
    () =>
      Effect.gen(function* allCases() {
        const disagreements = yield* Effect.all(
          cases.map((drawn) =>
            Effect.scoped(
              Effect.gen(function* oneCase() {
                const dir = yield* scopedPackage(entriesOf(drawn));
                const verdict = yield* oracleVerdict(yield* readPackage(dir));
                const program = yield* readProgram(dir);
                const { broken } = judge(hostRowsOf(program.inputs), laws);
                const [first, ...rest] = broken.map(({ law }) => law);
                const rule =
                  first === undefined
                    ? "accepted"
                    : Option.getOrElse(ruleOfLaws([first, ...rest]), () => "unnamed");
                const rules = verdict.kind === "accepted" ? new Set(["accepted"]) : verdict.rules;
                const named = `${drawn.name}: the import's rows give ${rule} (${broken.map(({ law }) => lawIdentity(law)).join("; ") || "no law"}), the oracle ${[...rules].join(", ")}`;

                return [
                  ...((verdict.kind === "accepted") === drawn.accepted
                    ? []
                    : [`${named}; the case expects the other`]),
                  ...(rules.has(rule) ? [] : [named]),
                ];
              }),
            ),
          ),
        );

        assert.deepStrictEqual(disagreements.flat(), []);
      }),
  );
});
