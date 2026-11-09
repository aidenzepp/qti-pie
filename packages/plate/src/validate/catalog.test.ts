import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { checkCatalogs } from "#plate/validate/catalog.ts";
import type { Location, Refusal } from "#plate/validate/refusal.ts";
import { tables } from "#plate/validate/tables.ts";
import { check } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * The path of the item root, which every item path in these tests starts with.
 */
const root = "qti-assessment-item";

/**
 * The path of an item's catalog container.
 */
const infoPath = `${root}/qti-catalog-info`;

/**
 * Construct a `qti-html-content` holding one run of text, the content every card and entry here
 * holds.
 *
 * @param words The text.
 * @returns The content element.
 */
const content = (words: string): SourceElement => el("qti-html-content", [], [text(words)]);

/**
 * Construct a `qti-card` for a support.
 *
 * @param support The `support` as written.
 * @param children The card's children, one HTML content by default.
 * @returns The card.
 */
const card = (
  support: string,
  children: readonly SourceElement[] = [content("Read it aloud.")],
): SourceElement => el("qti-card", [attr("support", support)], children);

/**
 * Construct a `qti-card-entry`, designating itself default as its `default` says.
 *
 * @param designation The `default` as written, or none for an entry that writes none.
 * @returns The entry.
 */
const entry = (designation: Option.Option<string>): SourceElement =>
  el(
    "qti-card-entry",
    Option.match(designation, {
      onNone: () => [],
      onSome: (value) => [attr("default", value)],
    }),
    [content("An entry.")],
  );

/**
 * Construct a `qti-catalog`.
 *
 * @param id Its `id`.
 * @param cards Its cards.
 * @returns The catalog.
 */
const catalog = (id: string, cards: readonly SourceElement[]): SourceElement =>
  el("qti-catalog", [attr("id", id)], cards);

/**
 * Construct an item whose body is one paragraph and whose catalog container holds the given
 * catalogs.
 *
 * @param catalogs The catalogs.
 * @returns The item, at `item.xml`.
 */
const item = (catalogs: readonly SourceElement[]): SourceDocument =>
  doc(
    "item.xml",
    el(
      root,
      [attr("identifier", "item-1"), attr("time-dependent", "false"), attr("title", "Catalogs")],
      [
        el("qti-item-body", [], [el("p", [], [text("Text")])]),
        el("qti-catalog-info", [], catalogs),
      ],
    ),
  );

/**
 * Construct a stimulus whose catalog container holds the given catalog.
 *
 * @param held The catalog.
 * @returns The stimulus, at `stimulus.xml`.
 */
const stimulus = (held: SourceElement): SourceDocument =>
  doc(
    "stimulus.xml",
    el(
      "qti-assessment-stimulus",
      [attr("identifier", "stimulus-1"), attr("title", "Stimulus")],
      [
        el("qti-stimulus-body", [], [el("p", [], [text("Text")])]),
        el("qti-catalog-info", [], [held]),
      ],
    ),
  );

/**
 * The path of a test's section rubric block, as {@link rubricTest} places it.
 */
const rubricPath = "qti-assessment-test/qti-test-part/qti-assessment-section/qti-rubric-block";

/**
 * Construct a test whose one section holds a rubric block, whose catalog container holds the given
 * catalog, and one item ref.
 *
 * @param held The catalog.
 * @returns The test, at `test.xml`.
 */
const rubricTest = (held: SourceElement): SourceDocument =>
  doc(
    "test.xml",
    el(
      "qti-assessment-test",
      [attr("identifier", "T"), attr("title", "Test")],
      [
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
                el(
                  "qti-rubric-block",
                  [attr("view", "candidate")],
                  [
                    el("qti-content-body", [], [el("p", [], [text("Read the rubric.")])]),
                    el("qti-catalog-info", [], [held]),
                  ],
                ),
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
 * Take the facts of refusals.
 *
 * @param refusals The refusals.
 * @returns Each refusal's rule, location and detail, in order.
 */
const seen = (refusals: readonly Refusal[]): readonly Seen[] =>
  refusals.map(({ detail, location, rule }) => ({ detail, location, rule }));

/**
 * Take the facts of a verdict's refusals, none when it does not refuse.
 *
 * @param verdict The verdict.
 * @returns Each refusal's rule, location and detail, in order.
 */
const refusalsOf = (verdict: Verdict): readonly Seen[] =>
  verdict.verdict === "refused" ? seen(verdict.refusals) : [];

/**
 * The refusal F3a gives a card whose support an earlier card of its catalog names.
 *
 * @param path The repeated card's `support` attribute's path.
 * @param catalogId The catalog's `id`.
 * @param support The support, collapsed.
 * @returns The refusal's facts.
 */
const repeatedSupport = (path: string, catalogId: string, support: string): Seen => ({
  detail: { catalog: catalogId, check: "card-support", source: "info.txt:21097", support },
  location: { kind: "path", path },
  rule: "duplicate-identifier",
});

/**
 * The refusal F3a gives a card that holds more than one entry designated default.
 *
 * @param path The card's path.
 * @param support The card's support, collapsed.
 * @param count How many of its entries designate themselves default.
 * @returns The refusal's facts.
 */
const manyDefaults = (path: string, support: string, count: string): Seen => ({
  detail: {
    check: "card-default",
    count,
    element: "qti-card",
    source: "info.txt:21284",
    support,
  },
  location: { kind: "path", path },
  rule: "child-count",
});

describe("validate/catalog.ts", () => {
  it("align-54 R3 catalog cards F3a: refuses a second spoken card in one catalog, at its support", () => {
    const document = item([catalog("glossary", [card("spoken"), card("spoken")])]);

    assert.deepStrictEqual(seen(checkCatalogs(document, tables)), [
      repeatedSupport(`${infoPath}/qti-catalog/qti-card[2]/@support`, "glossary", "spoken"),
    ]);
  });

  it("align-54 R3 catalog cards F3a: compares supports collapsed, so ' spoken ' and spoken name one support", () => {
    const document = item([catalog("glossary", [card(" spoken "), card("spoken")])]);

    assert.deepStrictEqual(seen(checkCatalogs(document, tables)), [
      repeatedSupport(`${infoPath}/qti-catalog/qti-card[2]/@support`, "glossary", "spoken"),
    ]);
  });

  it("align-54 R3 catalog cards F3a: accepts two supports in one catalog, and one support in two catalogs", () => {
    const twoSupports = item([catalog("glossary", [card("spoken"), card("sign-language")])]);
    const twoCatalogs = item([
      catalog("glossary", [card("spoken")]),
      catalog("directions", [card("spoken")]),
    ]);

    assert.deepStrictEqual(checkCatalogs(twoSupports, tables), []);
    assert.deepStrictEqual(checkCatalogs(twoCatalogs, tables), []);
  });

  it("align-54 R3 catalog cards F3a: refuses a card with two entries designated default, true and true or true and 1, once at the card", () => {
    for (const [first, second] of [
      ["true", "true"],
      ["true", " 1 "],
    ] as const) {
      const document = item([
        catalog("glossary", [
          card("spoken", [entry(Option.some(first)), entry(Option.some(second))]),
        ]),
      ]);

      assert.deepStrictEqual(seen(checkCatalogs(document, tables)), [
        manyDefaults(`${infoPath}/qti-catalog/qti-card`, "spoken", "2"),
      ]);
    }
  });

  it("align-54 R3 catalog cards F3a: accepts false, 0 and no default beside one true", () => {
    const document = item([
      catalog("glossary", [
        card("spoken", [
          entry(Option.some("false")),
          entry(Option.some("0")),
          entry(Option.none()),
          entry(Option.some("true")),
        ]),
      ]),
    ]);

    assert.deepStrictEqual(checkCatalogs(document, tables), []);
  });

  it("align-54 R3 catalog cards F3a: judges a stimulus's catalog and a test rubric block's catalog too", () => {
    const repeated = catalog("glossary", [card("spoken"), card("spoken")]);

    assert.deepStrictEqual(seen(checkCatalogs(stimulus(repeated), tables)), [
      repeatedSupport(
        "qti-assessment-stimulus/qti-catalog-info/qti-catalog/qti-card[2]/@support",
        "glossary",
        "spoken",
      ),
    ]);
    assert.deepStrictEqual(seen(checkCatalogs(rubricTest(repeated), tables)), [
      repeatedSupport(
        `${rubricPath}/qti-catalog-info/qti-catalog/qti-card[2]/@support`,
        "glossary",
        "spoken",
      ),
    ]);
  });

  it("align-54 R3 catalog cards F3a: check refuses an item with two spoken cards in one catalog, and accepts it with two supports", () => {
    const repeated = item([catalog("glossary", [card("spoken"), card("spoken")])]);
    const distinct = item([catalog("glossary", [card("spoken"), card("sign-language")])]);

    assert.deepStrictEqual(refusalsOf(check(repeated, tables, Option.none())), [
      repeatedSupport(`${infoPath}/qti-catalog/qti-card[2]/@support`, "glossary", "spoken"),
    ]);
    assert.notStrictEqual(check(distinct, tables, Option.none()).verdict, "refused");
  });
});
