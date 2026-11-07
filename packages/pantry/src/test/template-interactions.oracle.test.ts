/**
 * An interaction inside template content (spec reading 143): no interaction sits inside a
 * `qti-template-block` at any depth, and a `qti-template-inline` may hold one inside its HTML.
 *
 * The information model says "A qti-template-block must not contain any interactions, either
 * directly or indirectly" (§5.145, TemplateBlock, in both versions), stricter than its class tables
 * and the XSD, which reach an interaction through the HTML of a template block's content body
 * (§5.147, §6.10, §6.14, §5.64 HTMLText of `inlineGroup`, §6.26). It states no such rule of a
 * template inline (§5.155): its own content, InlineStaticGroup (§6.27), holds no interaction, which
 * the content model refuses, and its HTML (§6.25, `span` and its kin of HTMLText) holds
 * `inlineGroup`'s four inline interactions, as the XSD's `HTMLTextDType` does.
 *
 * Oracle: those class tables and that sentence, as the case model's table writes them, so no
 * expected verdict is computed by the oracle's or the grammar's own reading.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import type { Judgment } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Where a case's interaction sits: in no template (the control), in a template block, in a template
 * block of an item rubric block (the block's `.rubric` kind), in a template inline, or in a
 * template inline of a template block.
 */
type Host = "block" | "block-rubric" | "inline" | "inline-in-block" | "none";

/**
 * The four interactions `inlineGroup` lists (§6.26), each by its kind's last word.
 */
type Interaction = "choice" | "custom" | "end-attempt" | "text-entry";

/**
 * One case: its host, the HTML elements between the host's content and the interaction (none, one
 * or two), and the interaction.
 */
interface TemplateCase {
  readonly depth: 0 | 1 | 2;
  readonly host: Host;
  readonly interaction: Interaction;
}

/**
 * Every choice of the box.
 */
const templateCases: Gen<TemplateCase> = (source) => ({
  depth: source.draw(element([0, 1, 2] as const)),
  host: source.draw(
    element(["none", "block", "block-rubric", "inline", "inline-in-block"] as const),
  ),
  interaction: source.draw(element(["text-entry", "choice", "end-attempt", "custom"] as const)),
});

/**
 * Each interaction as written, bound to its own response declaration.
 */
const interactionMarkup: Readonly<Record<Interaction, string>> = {
  choice:
    '<qti-inline-choice-interaction response-identifier="RC"><qti-inline-choice identifier="CA">a</qti-inline-choice><qti-inline-choice identifier="CB">b</qti-inline-choice></qti-inline-choice-interaction>',
  custom:
    '<qti-custom-interaction response-identifier="RW"><w:widget xmlns:w="urn:example:widget">A widget.</w:widget></qti-custom-interaction>',
  "end-attempt": '<qti-end-attempt-interaction response-identifier="RE" title="Hint"/>',
  "text-entry": '<qti-text-entry-interaction response-identifier="RT"/>',
};

/**
 * Wrap inline content in a case's HTML elements: none, a `span`, or an `em` inside a `span`.
 *
 * @param depth - How many.
 * @param content - The content.
 * @returns The wrapped content.
 */
const inlineWrapped = (depth: TemplateCase["depth"], content: string): string =>
  [content, `<span>${content}</span>`, `<span><em>${content}</em></span>`][depth] ?? content;

/**
 * Wrap content in a template block's content body: as its child, in a `p`, or in a `p` inside a
 * `div`.
 *
 * @param depth - How many HTML elements.
 * @param content - The content.
 * @returns The content body.
 */
const blockBody = (depth: TemplateCase["depth"], content: string): string =>
  `<qti-content-body>${[content, `<p>${content}</p>`, `<div><p>${content}</p></div>`][depth] ?? content}</qti-content-body>`;

/**
 * A template block holding a content body.
 *
 * @param body - The content body.
 * @returns The template block.
 */
const templateBlock = (body: string): string =>
  `<qti-template-block template-identifier="T" show-hide="show" identifier="B">${body}</qti-template-block>`;

/**
 * A template inline holding content.
 *
 * @param content - The content.
 * @returns The template inline.
 */
const templateInline = (content: string): string =>
  `<qti-template-inline template-identifier="T" show-hide="show" identifier="A">${content}</qti-template-inline>`;

/**
 * Each host's item body, around an interaction at a depth.
 */
const hostBodies: Readonly<Record<Host, (depth: TemplateCase["depth"], markup: string) => string>> =
  {
    block: (depth, markup) => templateBlock(blockBody(depth, markup)),
    "block-rubric": (depth, markup) =>
      `<qti-rubric-block view="candidate" use="instructions"><qti-content-body>${templateBlock(blockBody(depth, markup))}</qti-content-body></qti-rubric-block><p>Body</p>`,
    inline: (depth, markup) => `<p>Say ${templateInline(inlineWrapped(depth, markup))}</p>`,
    "inline-in-block": (depth, markup) =>
      templateBlock(
        `<qti-content-body><p>Say ${templateInline(inlineWrapped(depth, markup))}</p></qti-content-body>`,
      ),
    none: (depth, markup) => `<p>Say ${inlineWrapped(depth, markup)}</p>`,
  };

/**
 * The item body a case writes.
 *
 * @param drawn - The case.
 * @returns The body's content.
 */
const bodyOf = ({ depth, host, interaction }: TemplateCase): string =>
  hostBodies[host](depth, interactionMarkup[interaction]);

/**
 * Write a case's item and manifest, each file's text encoded as UTF-8, as `readPackage` returns
 * one.
 *
 * @param drawn - The case.
 * @returns The entries, sorted by path.
 */
const packageOf = (drawn: TemplateCase): readonly PackageFile[] => {
  const declarations = [
    '<qti-response-declaration identifier="RT" cardinality="single" base-type="string"/>',
    '<qti-response-declaration identifier="RC" cardinality="single" base-type="identifier"/>',
    '<qti-response-declaration identifier="RE" cardinality="single" base-type="boolean"/>',
    '<qti-response-declaration identifier="RW" cardinality="single" base-type="string"/>',
    '<qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/>',
  ].join("");
  const files = {
    "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="I" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
    "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false">${declarations}<qti-item-body>${bodyOf(drawn)}</qti-item-body></qti-assessment-item>`,
  };

  return Object.entries(files)
    .map(([path, text]): PackageFile => ({
      bytes: new TextEncoder().encode(text),
      kind: path === "imsmanifest.xml" ? "manifest" : "file",
      path,
    }))
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));
};

/**
 * What the rule makes of a case: accepted; refused by the content model, an interaction as a
 * template's own child, which the codec reads as no element of its model there
 * (`unmodeled-vocabulary`); or refused under `N6 ancestry`, an interaction inside a template block.
 */
type Verdict = "accepted" | "ancestry" | "content";

/**
 * The rule as a table, by host and depth: a template's own content holds no interaction (§6.10,
 * §6.27); a template block's holds none at any depth (§5.145); a template inline's HTML may, unless
 * a template block encloses it.
 *
 * @param drawn - The case.
 * @returns Its verdict.
 */
const verdictOf = ({ depth, host }: TemplateCase): Verdict => {
  if (host === "none") {
    return "accepted";
  }

  if (depth === 0) {
    return "content";
  }

  return host === "inline" ? "accepted" : "ancestry";
};

/**
 * Read what the oracle made of a case as a verdict, or as what it found where it is none.
 *
 * @param judgment - The oracle's judgment.
 * @returns The verdict, or the laws it broke beside N6 ancestry, or the codec's rule.
 */
const verdictIn = (judgment: Judgment): string => {
  if (judgment._tag !== "Judged") {
    return judgment.rule === "unmodeled-vocabulary" ? "content" : `codec ${judgment.rule}`;
  }

  if (judgment.breaches.length === 0) {
    return "accepted";
  }

  return judgment.breaches.every(({ law }) => law === "N6 ancestry")
    ? "ancestry"
    : judgment.breaches.map(({ law }) => law).join(", ");
};

/**
 * A situation the box must reach: each verdict, and GEN-B's shrunk case, a template inline's
 * `span` holding an interaction.
 */
type TemplateSituation =
  | "accepted"
  | "ancestry"
  | "content"
  | "an interaction in a template inline's span";

/**
 * Every situation the box must reach.
 */
const situations = [
  "accepted",
  "ancestry",
  "content",
  "an interaction in a template inline's span",
] as const satisfies readonly TemplateSituation[];

describe("test/oracle.ts and the grammar's ancestry, an interaction inside template content (spec reading 143)", () => {
  it.effect(
    "refuses an interaction anywhere inside a template block, and one directly in a template inline, and accepts one inside a template inline's HTML",
    (ctx) =>
      // Oracle: the information model's §5.145 sentence and its class tables (§5.147, §6.10,
      // §6.14, §5.64, §6.26, §5.155, §6.27, §6.25), as `verdictOf` reads them.
      // Bound: 5 hosts × 3 depths × 4 interactions, 60 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "every host (none, template block, its rubric variant, template inline, template inline in a template block) × no, one or two HTML elements × the four inline interactions",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<TemplateSituation>(situations),
            generator: templateCases,
            limit: 80,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "the information model's §5.145 and the template classes' tables",
            },
            suite: "test/oracle-template-interactions",
          },
          (drawn: TemplateCase, c) =>
            Effect.gen(function* boxCase() {
              const expected = verdictOf(drawn);
              c.note(expected);
              if (drawn.host === "inline" && drawn.depth === 1) {
                c.note("an interaction in a template inline's span");
              }

              const judgment = yield* judge(packageOf(drawn), grammar, laws);
              assert.strictEqual(verdictIn(judgment), expected, JSON.stringify(drawn));
            }),
        ),
      ),
  );
});
