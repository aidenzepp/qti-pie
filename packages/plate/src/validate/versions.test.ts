import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceAttribute, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { Location } from "#plate/validate/refusal.ts";
import { tables } from "#plate/validate/tables.ts";
import { check, unsupportedFeatures } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";
import { checkVersion } from "#plate/validate/versions.ts";
import type { CpVersion } from "#plate/vocabulary.ts";

/**
 * The path of the item root, which every item path in these tests starts with.
 */
const root = "qti-assessment-item";

/**
 * The path of the body's custom interaction.
 */
const customPath = `${root}/qti-item-body/qti-custom-interaction`;

/**
 * The versions a document may be checked under: each of QTI's two and none, a document opened
 * alone.
 */
const unversioned: Option.Option<CpVersion> = Option.none();

const v300: Option.Option<CpVersion> = Option.some("3.0.0");

const v301: Option.Option<CpVersion> = Option.some("3.0.1");

/**
 * Construct a `qti-assessment-item` with its required attributes and the given parts.
 *
 * @param parts The root's children.
 * @param attributes The root's further attributes.
 * @returns The document, at `item.xml`.
 */
const item = (
  parts: readonly SourceElement[],
  attributes: readonly SourceAttribute[] = [],
): SourceDocument =>
  doc(
    "item.xml",
    el(
      root,
      [
        attr("identifier", "item-1"),
        attr("time-dependent", "false"),
        attr("title", "Versions"),
        ...attributes,
      ],
      parts,
    ),
  );

/**
 * An item whose body holds a `qti-custom-interaction` bound to its declared response.
 */
const customItem = item([
  el("qti-response-declaration", [
    attr("base-type", "identifier"),
    attr("cardinality", "single"),
    attr("identifier", "RESPONSE"),
  ]),
  el(
    "qti-item-body",
    [],
    [el("qti-custom-interaction", [attr("response-identifier", "RESPONSE")])],
  ),
]);

/**
 * Construct an item whose body is one paragraph, with the given root attributes.
 *
 * @param attributes The root's further attributes, such as `label`.
 * @returns The item.
 */
const labelledItem = (attributes: readonly SourceAttribute[]): SourceDocument =>
  item([el("qti-item-body", [], [el("p", [], [text("Text")])])], attributes);

/**
 * Construct a float outcome declaration `SCORE` with the given further attributes.
 *
 * @param attributes Its further attributes, such as `mastery-value`.
 * @returns The declaration.
 */
const scoreDeclaration = (attributes: readonly SourceAttribute[]): SourceElement =>
  el("qti-outcome-declaration", [
    attr("base-type", "float"),
    attr("cardinality", "single"),
    attr("identifier", "SCORE"),
    ...attributes,
  ]);

/**
 * Construct an item that declares `SCORE` with the given further attributes.
 *
 * @param attributes The declaration's further attributes.
 * @returns The item.
 */
const masteryItem = (attributes: readonly SourceAttribute[]): SourceDocument =>
  item([scoreDeclaration(attributes), el("qti-item-body", [], [el("p", [], [text("Text")])])]);

/**
 * Construct a test that declares `SCORE` with the given further attributes, of one linear,
 * individual part holding one section with one item ref.
 *
 * @param attributes The declaration's further attributes.
 * @returns The test, at `test.xml`.
 */
const masteryTest = (attributes: readonly SourceAttribute[]): SourceDocument =>
  doc(
    "test.xml",
    el(
      "qti-assessment-test",
      [attr("identifier", "T"), attr("title", "Test")],
      [
        scoreDeclaration(attributes),
        el(
          "qti-test-part",
          [
            attr("identifier", "P"),
            attr("navigation-mode", "linear"),
            attr("submission-mode", "individual"),
          ],
          [
            el(
              "qti-assessment-section",
              [attr("identifier", "S"), attr("title", "S"), attr("visible", "true")],
              [
                el("qti-assessment-item-ref", [
                  attr("href", "items/I1.xml"),
                  attr("identifier", "I1"),
                ]),
              ],
            ),
          ],
        ),
      ],
    ),
  );

/**
 * One refusal as these tests compare it: its rule, location and detail.
 */
interface Seen {
  readonly detail: Readonly<Record<string, string>>;
  readonly location: Location;
  readonly rule: string;
}

/**
 * Take the facts of a verdict's refusals, none when it does not refuse.
 *
 * @param verdict The verdict.
 * @returns Each refusal's rule, location and detail, in order.
 */
const refusalsOf = (verdict: Verdict): readonly Seen[] =>
  verdict.verdict === "refused"
    ? verdict.refusals.map(({ detail, location, rule }) => ({ detail, location, rule }))
    : [];

/**
 * Report whether a verdict accepts its document, with or without unsupported features.
 *
 * @param verdict The verdict.
 * @returns Whether it accepts.
 */
const accepts = (verdict: Verdict): boolean =>
  verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported";

/**
 * The refusal E31b gives a 3.0.1 item root that carries `label` and lacks the tool attributes
 * `missing` lists.
 *
 * @param missing The missing tool attributes, space-separated.
 * @returns The refusal's facts.
 */
const rootLabelTool = (missing: string): Seen => ({
  detail: {
    attribute: missing,
    check: "label-tool",
    element: root,
    labelled: root,
    reading: "128",
  },
  location: { kind: "path", path: root },
  rule: "missing-attribute",
});

/**
 * The refusal E42b gives a 3.0.1 outcome declaration whose `mastery-value` is below 0.0, with no
 * `normal-minimum` written.
 *
 * @param declaration The declaration's path.
 * @param value The `mastery-value` as written.
 * @returns The refusal's facts.
 */
const masteryFloor = (declaration: string, value: string): Seen => ({
  detail: {
    attribute: "mastery-value",
    check: "mastery-range",
    element: "qti-outcome-declaration",
    least: "0.0",
    reading: "149",
    value,
  },
  location: { kind: "path", path: `${declaration}/@mastery-value` },
  rule: "attribute-type",
});

describe("validate/versions.ts", () => {
  it("align-54 version seam P2: refuses a qti-custom-interaction in a 3.0.0 item, deprecated for a Portable Custom Interaction", () => {
    assert.deepStrictEqual(refusalsOf(check(customItem, tables, v300)), [
      {
        detail: {
          check: "custom-interaction",
          element: "qti-custom-interaction",
          parent: "qti-item-body",
          version: "3.0.0",
        },
        location: { kind: "path", path: customPath },
        rule: "unknown-element",
      },
    ]);
  });

  it("align-54 version seam P2: accepts a qti-custom-interaction in a 3.0.1 item and in an item of no stated version, with today's notice", () => {
    for (const version of [v301, unversioned]) {
      const verdict = check(customItem, tables, version);

      assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
      assert.deepInclude(unsupportedFeatures(verdict), {
        feature: "qti-custom-interaction",
        path: customPath,
        shown: "notice",
      });
    }
  });

  it("align-54 version seam E31b: refuses a 3.0.1 item root that carries a label and lacks its tool attributes (reading 128)", () => {
    assert.deepStrictEqual(refusalsOf(check(labelledItem([attr("label", "L")]), tables, v301)), [
      rootLabelTool("tool-name tool-version"),
    ]);
    assert.deepStrictEqual(
      refusalsOf(
        check(labelledItem([attr("label", "L"), attr("tool-name", "Author")]), tables, v301),
      ),
      [rootLabelTool("tool-version")],
    );
  });

  it("align-54 version seam E31b: accepts a 3.0.1 labelled root with both tool attributes, and a labelled root under 3.0.0 or no stated version", () => {
    const tooled = labelledItem([
      attr("label", "L"),
      attr("tool-name", "Author"),
      attr("tool-version", "1"),
    ]);
    const bare = labelledItem([attr("label", "L")]);

    assert.isTrue(accepts(check(tooled, tables, v301)));
    assert.isTrue(accepts(check(bare, tables, v300)));
    assert.isTrue(accepts(check(bare, tables, unversioned)));
  });

  it("align-54 version seam E31b: adds no second label-tool refusal to an item already refused one at its root", () => {
    const source = labelledItem([attr("label", "L")]);
    const heldAt = (path: string): Refusal =>
      new Refusal({
        detail: {
          attribute: "tool-name tool-version",
          check: "label-tool",
          element: root,
          labelled: `${root}/qti-item-body/qti-text-entry-interaction`,
          reading: "128",
        },
        document: source.location,
        location: { kind: "path", path },
        readerRule: Option.none(),
        rule: "missing-attribute",
        suggestion: Option.none(),
      });

    assert.deepStrictEqual(checkVersion(source, v301, [heldAt(root)]), []);
    assert.deepStrictEqual(
      checkVersion(source, v301, [heldAt(`${root}/qti-item-body`)]).map(
        ({ detail, location, rule }) => ({
          detail,
          location,
          rule,
        }),
      ),
      [rootLabelTool("tool-name tool-version")],
    );
  });

  it("align-54 version seam E42b: refuses a 3.0.1 mastery value below 0.0 where no normal-minimum is written, in an item and in a test (reading 149)", () => {
    assert.deepStrictEqual(
      refusalsOf(check(masteryItem([attr("mastery-value", "-1")]), tables, v301)),
      [masteryFloor(`${root}/qti-outcome-declaration`, "-1")],
    );
    assert.deepInclude(
      refusalsOf(check(masteryTest([attr("mastery-value", "-0.5")]), tables, v301)),
      masteryFloor("qti-assessment-test/qti-outcome-declaration", "-0.5"),
    );
  });

  it("align-54 version seam E42b: accepts a 3.0.1 mastery value under a written normal-minimum, one of 0 or above, and one below 0.0 under 3.0.0 or no stated version", () => {
    const below = masteryItem([attr("mastery-value", "-1")]);

    assert.isTrue(
      accepts(
        check(
          masteryItem([attr("mastery-value", "-1"), attr("normal-minimum", "-2")]),
          tables,
          v301,
        ),
      ),
    );
    assert.isTrue(accepts(check(masteryItem([attr("mastery-value", "0")]), tables, v301)));
    assert.isTrue(accepts(check(below, tables, v300)));
    assert.isTrue(accepts(check(below, tables, unversioned)));
  });

  it("align-54 version seam: gives no refusal of its own to a document of no stated version", () => {
    for (const source of [
      customItem,
      labelledItem([attr("label", "L")]),
      masteryItem([attr("mastery-value", "-1")]),
    ]) {
      assert.deepStrictEqual(checkVersion(source, unversioned, []), []);
    }
  });
});
