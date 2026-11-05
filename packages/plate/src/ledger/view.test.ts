import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { toHtml } from "#plate/emit/serialise.ts";
import type { Element } from "#plate/emit/node.ts";
import { h } from "#plate/emit/node.ts";
import { browserSupport } from "#plate/ledger/browser-support.ts";
import { claims } from "#plate/ledger/claims.ts";
import { exclusions, families, features, levels } from "#plate/ledger/features.ts";
import type { PassRecord } from "#plate/ledger/passes.ts";
import { ledger } from "#plate/ledger/report.ts";
import type { TestResult } from "#plate/ledger/report.ts";
import { ledgerHtml, ledgerText, verdictLines, verdictTable } from "#plate/ledger/view.ts";
import { checkTree, textOf } from "#plate/test/accessibility.ts";
import { bg007Item } from "#plate/test/fixtures.ts";
import { roundTrips } from "#plate/test/round-trip.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import { acceptForTest, describeRefusal } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * The corpus document the fixture sources name.
 */
const bg007 = "QTI3_BPIG_Examples/items/BG007.xml";

/**
 * The fixture results: tagged passing tests across the levels, a failing one, a title holding
 * markup, and a sweep.
 */
const results: readonly TestResult[] = [
  {
    file: "src/validate/open.test.ts",
    fullName: "validate/open.ts [Q-2] a Choice item is accepted",
    state: "passed",
  },
  {
    file: "src/interactions/choice.test.ts",
    fullName: "interactions/choice.ts [Q-2] [keyboard] a Choice completes by keyboard",
    state: "passed",
  },
  {
    file: "src/dev/page.test.ts",
    fullName: "dev/page.ts [Q-2] [keyboard] BG007 completes in the playground",
    state: "passed",
  },
  {
    file: "src/interactions/text-entry.test.ts",
    fullName: "[Q-20] a Text Entry takes text",
    state: "failed",
  },
  {
    file: "src/styles.test.ts",
    fullName: "styles.css [I-19] the vocabulary classes apply",
    state: "passed",
  },
  {
    file: "src/corpus.render.test.ts",
    fullName: "[I-7] [I-8] every document renders",
    state: "passed",
  },
  {
    file: "src/emit/body.test.ts",
    fullName: "emit/body.ts [A-1] <script>alert(1)</script> stays text",
    state: "passed",
  },
  {
    file: "src/validate/structure.test.ts",
    fullName: "[A-2a] an elevated row is checked",
    state: "passed",
  },
];

/**
 * The fields every fixture record shares.
 */
const recorded = {
  browser: "Safari",
  browserVersion: "26.1",
  item: bg007,
  macosVersion: "27.2",
  notes: "",
  owner: "operator",
  reader: "VoiceOver",
  readerVersion: "27.2",
} as const;

/**
 * The fixture records: a screen-reader pass with JavaScript off, a keyboard walk-through, an
 * OD-14 (e) proof whose control ran and one whose control did not, and NVDA and JAWS unavailable.
 */
const records: readonly PassRecord[] = [
  {
    ...recorded,
    date: "2026-11-05",
    interactions: ["Q-2"],
    javascript: "off",
    kind: "screen-reader-pass",
    result: "passed",
  },
  {
    ...recorded,
    check: "keyboard-walk-through",
    date: "2026-11-05",
    javascript: "on",
    kind: "manual-check",
    result: "passed",
  },
  {
    ...recorded,
    check: "OD-14 (e)",
    control: "ran",
    date: "2026-11-06",
    javascript: "on",
    kind: "manual-check",
    result: "passed",
  },
  {
    ...recorded,
    check: "OD-14 (e)",
    control: "did-not-run",
    date: "2026-11-06",
    javascript: "off",
    kind: "manual-check",
    result: "not-observed",
  },
  {
    ...recorded,
    date: "2026-11-05",
    javascript: "on",
    kind: "unavailable-reader",
    reader: "NVDA",
    readerVersion: "",
    result: "unavailable",
  },
  {
    ...recorded,
    date: "2026-11-05",
    javascript: "on",
    kind: "unavailable-reader",
    reader: "JAWS",
    readerVersion: "",
    result: "unavailable",
  },
];

/**
 * The fixture ledger, derived by the reporter from the real features file, exclusions and claims.
 */
const fixture = ledger({
  claims,
  corpus: new Set([bg007]),
  exclusions,
  features,
  records,
  results,
  sources: new Map([["src/validate/open.test.ts", `const location = "${bg007}";`]]),
});

/**
 * Every element below a node, in document order.
 *
 * @param node The node.
 * @returns Its element descendants.
 */
const descendants = (node: Element): readonly Element[] =>
  node.children.flatMap((child) =>
    child.kind === "element" ? [child, ...descendants(child)] : [],
  );

/**
 * The elements below a node with one tag.
 *
 * @param node The node.
 * @param tag The tag.
 * @returns Its descendants with that tag, in document order.
 */
const byTag = (node: Element, tag: string): readonly Element[] =>
  descendants(node).filter((element) => element.tag === tag);

/**
 * The element children of a node.
 *
 * @param node The node.
 * @returns Its children that are elements.
 */
const childElements = (node: Element): readonly Element[] =>
  node.children.filter((child): child is Element => child.kind === "element");

/**
 * Read a table's body rows, each a map from its column header's text to its cell.
 *
 * @param table The table.
 * @returns Its rows, in order.
 */
const rowsOf = (table: Element): readonly ReadonlyMap<string, Element>[] => {
  const headers = byTag(byTag(table, "thead")[0] ?? h("thead", {}), "th").map(textOf);

  return childElements(byTag(table, "tbody")[0] ?? h("tbody", {})).map(
    (row) => new Map(childElements(row).map((cell, index) => [headers[index] ?? "", cell])),
  );
};

/**
 * Find the table with a caption.
 *
 * @param root The tree.
 * @param caption The caption's text.
 * @returns The table.
 */
const tableCaptioned = (root: Element, caption: string): Element => {
  const table = byTag(root, "table").find(
    (candidate) => textOf(childElements(candidate)[0] ?? h("caption", {})) === caption,
  );
  assert.isDefined(table, caption);

  return table;
};

/**
 * Read one cell of the family-table row headed by a feature ID.
 *
 * @param root The ledger's tree.
 * @param id The feature ID.
 * @param column The column header.
 * @returns The cell.
 */
const cellOf = (root: Element, id: string, column: string): Element => {
  const row = byTag(root, "table")
    .flatMap(rowsOf)
    .find((candidate) => textOf(candidate.get("ID") ?? h("th", {})) === id);
  const cell = row?.get(column);
  assert.isDefined(cell, `${id} ${column}`);

  return cell;
};

/**
 * The words the view gives each level.
 */
const levelWords = {
  advanced: "Advanced",
  basic: "Basic",
  elective: "Elective",
  elevated: "Elevated",
} as const;

/**
 * The words the view gives each family.
 */
const familyWords = {
  A: "Accessibility (A)",
  I: "Items (I)",
  M: "Metadata (M)",
  P: "Packaging (P)",
  Q: "Interactions (Q)",
  S: "Sections (S)",
  T: "Tests (T)",
} as const;

/**
 * The family captions the fixture ledger needs, in level order and then family order.
 */
const expectedCaptions = levels.flatMap((level) =>
  families
    .filter((family) => fixture.rows.some((row) => row.level === level && row.family === family))
    .map((family) => `${levelWords[level]}: ${familyWords[family]}`),
);

/**
 * The headline the view gives a level.
 *
 * @param level The level.
 * @returns Its counts, as the view words them.
 */
const headlineOf = (level: (typeof levels)[number]): string => {
  const counts = fixture.headlines[level];

  return `${String(counts.covered)} covered, ${String(counts.limited)} limited, ${String(counts.excluded)} excluded, ${String(counts["unsupported-with-notice"])} not yet supported.`;
};

describe("ledger/view.ts", () => {
  it("groups the rows by level, then by family, in order", () => {
    const tree = ledgerHtml(fixture);
    const headings = byTag(tree, "h2").map(textOf);
    const captions = byTag(tree, "caption").map(textOf);
    const lines = ledgerText(fixture).split("\n");

    assert.deepStrictEqual(
      headings.slice(0, levels.length),
      levels.map((level) => levelWords[level]),
    );
    assert.deepStrictEqual(captions.slice(0, expectedCaptions.length), expectedCaptions);
    assert.deepStrictEqual(
      expectedCaptions.map((caption) => lines.indexOf(caption)).toSorted((a, b) => a - b),
      expectedCaptions.map((caption) => lines.indexOf(caption)),
    );
    assert.notInclude(
      expectedCaptions.map((caption) => lines.indexOf(caption)),
      -1,
    );
    assert.deepStrictEqual(
      levels.map((level) => lines.indexOf(levelWords[level])).toSorted((a, b) => a - b),
      levels.map((level) => lines.indexOf(levelWords[level])),
    );
  });

  it("opens each level with its headline, its rows counted by state", () => {
    const tree = ledgerHtml(fixture);
    const text = ledgerText(fixture);

    for (const level of levels) {
      const heading = byTag(tree, "h2").find(
        (candidate) => textOf(candidate) === levelWords[level],
      );
      assert.isDefined(heading, level);
      assert.include(byTag(tree, "p").map(textOf), headlineOf(level));
      assert.include(text, `${levelWords[level]}\n${headlineOf(level)}`);
    }

    assert.strictEqual(fixture.headlines.basic.covered, 4);
    assert.strictEqual(fixture.headlines.basic.limited, 1);
  });

  it("gives every feature one row, its name beside its ID", () => {
    const tree = ledgerHtml(fixture);
    const text = ledgerText(fixture);
    const rows = byTag(tree, "table").flatMap(rowsOf);

    for (const row of fixture.rows) {
      const matching = rows.filter(
        (candidate) => textOf(candidate.get("ID") ?? h("th", {})) === row.id,
      );
      assert.lengthOf(matching, 1, row.id);
      assert.strictEqual(textOf(matching[0]?.get("Feature") ?? h("td", {})), row.name);
      assert.include(text.split("\n"), `${row.id} ${row.name}`);
    }

    assert.lengthOf(rows, 150 + records.length);
  });

  it("words each state, `unsupported-with-notice` as not yet supported with its ID kept", () => {
    const tree = ledgerHtml(fixture);
    const text = ledgerText(fixture);

    assert.strictEqual(textOf(cellOf(tree, "Q-2", "State")), "covered");
    assert.strictEqual(textOf(cellOf(tree, "I-19", "State")), "limited");
    assert.strictEqual(textOf(cellOf(tree, "Q-31", "State")), "excluded");
    assert.strictEqual(
      textOf(cellOf(tree, "Q-20", "State")),
      "not yet supported (unsupported-with-notice)",
    );
    assert.include(
      text,
      "Q-20 Text Entry Interaction\n  State: not yet supported (unsupported-with-notice)",
    );
  });

  it("lists the limited rows again with their sources, under their own heading", () => {
    const tree = ledgerHtml(fixture);
    const text = ledgerText(fixture);
    const [claim] = claims;
    assert.isDefined(claim);

    const heading = byTag(tree, "h2").findIndex(
      (candidate) => textOf(candidate) === "Limited rows",
    );

    assert.isAtLeast(heading, levels.length);
    assert.strictEqual(textOf(cellOf(tree, "I-19", "Source")), claim.source);
    assert.include(
      byTag(tree, "li").map(textOf),
      `I-19 QTI Shared Interaction Vocabulary Subset: ${claim.source}`,
    );
    assert.include(
      text,
      `Limited rows\nI-19 QTI Shared Interaction Vocabulary Subset: ${claim.source}`,
    );
  });

  it("links each proof to its test file and its fixture documents", () => {
    const tree = ledgerHtml(fixture);
    const text = ledgerText(fixture);
    const hrefs = byTag(cellOf(tree, "Q-2", "Proofs"), "a").map((link) => link.attrs["href"]);

    assert.include(
      hrefs,
      "https://github.com/aidenzepp/qti-pie/blob/main/packages/plate/src/validate/open.test.ts",
    );
    assert.include(
      hrefs,
      "https://github.com/aidenzepp/qti-pie/blob/main/packages/plate/src/dev/page.test.ts",
    );
    assert.include(hrefs, `/item?${new URLSearchParams([["path", bg007]]).toString()}`);
    assert.include(textOf(cellOf(tree, "I-7", "Proofs")), "every corpus document (the sweep)");
    assert.strictEqual(textOf(cellOf(tree, "Q-20", "Proofs")), "none");
    assert.include(
      text,
      `    src/validate/open.test.ts\n      Test: validate/open.ts [Q-2] a Choice item is accepted\n      Corpus documents: ${bg007}`,
    );
  });

  it("fills the columns, an interaction row's own included", () => {
    const tree = ledgerHtml(fixture);

    assert.strictEqual(textOf(cellOf(tree, "Q-2", "Validates")), "yes");
    assert.strictEqual(textOf(cellOf(tree, "Q-2", "Renders")), "yes");
    assert.strictEqual(textOf(cellOf(tree, "I-19", "Validates")), "no");
    assert.deepStrictEqual(byTag(cellOf(tree, "Q-2", "Keyboard"), "li").map(textOf), [
      "interactions/choice.ts [Q-2] [keyboard] a Choice completes by keyboard",
      "dev/page.ts [Q-2] [keyboard] BG007 completes in the playground",
    ]);
    assert.strictEqual(textOf(cellOf(tree, "Q-2", "Screen-reader pass")), "2026-11-05");
    assert.strictEqual(textOf(cellOf(tree, "Q-5", "Screen-reader pass")), "none recorded");
    assert.strictEqual(
      textOf(cellOf(tree, "Q-2", "Composition")),
      "dev playground, test-built form",
    );
    assert.isUndefined(
      byTag(tree, "table")
        .flatMap(rowsOf)
        .find((row) => textOf(row.get("ID") ?? h("th", {})) === "I-7")
        ?.get("Keyboard"),
    );
  });

  it("says no Baseline-low feature is used while the browser-support note is empty", () => {
    const sentence =
      "The stylesheets use no Baseline-low feature: every feature they use is Baseline widely available.";

    assert.include(byTag(ledgerHtml(fixture, []), "p").map(textOf), sentence);
    assert.include(ledgerText(fixture, []), `Browser support\n${sentence}`);
    assert.strictEqual(toHtml(ledgerHtml(fixture)), toHtml(ledgerHtml(fixture, browserSupport)));
  });

  it("lists each browser-support row with its degrade", () => {
    const note = {
      degrade: "the default accent colour",
      feature: "accent-color",
      status: "low",
    } as const;
    const tree = ledgerHtml(fixture, [note]);
    const [row] = rowsOf(
      tableCaptioned(tree, "Features the stylesheets use below Baseline widely available"),
    );

    assert.strictEqual(textOf(row?.get("Feature") ?? h("th", {})), "accent-color");
    assert.strictEqual(textOf(row?.get("Baseline") ?? h("td", {})), "newly available");
    assert.strictEqual(
      textOf(row?.get("What a browser without it shows") ?? h("td", {})),
      "the default accent colour",
    );
    assert.include(
      ledgerText(fixture, [note]),
      "accent-color: newly available; without it, the default accent colour",
    );
  });

  it("shows the records, each with its JavaScript state, each OD-14 (e) entry with its control, NVDA and JAWS unavailable", () => {
    const tree = ledgerHtml(fixture);
    const text = ledgerText(fixture);
    const rows = rowsOf(tableCaptioned(tree, "Session records"));

    assert.lengthOf(rows, records.length);
    assert.deepStrictEqual(
      rows.map((row) => textOf(row.get("JavaScript") ?? h("td", {}))),
      records.map((record) => record.javascript),
    );
    assert.deepStrictEqual(
      rows.map((row) => textOf(row.get("Control") ?? h("td", {}))),
      ["", "", "ran", "did-not-run", "", ""],
    );
    assert.deepStrictEqual(
      rows
        .slice(4)
        .map((row) => [
          textOf(row.get("Reader") ?? h("th", {})),
          textOf(row.get("Result") ?? h("td", {})),
        ]),
      [
        ["NVDA", "unavailable"],
        ["JAWS", "unavailable"],
      ],
    );
    assert.include(text, "Control: did-not-run");
    assert.include(text, "Reader: NVDA; Entry: unavailable reader");
    assert.match(text, /; JavaScript: off;/u);
  });

  it("says no session is recorded while there are no records", () => {
    const empty = { ...fixture, records: [] };
    const sentence = "No session has been recorded yet.";

    assert.include(byTag(ledgerHtml(empty), "p").map(textOf), sentence);
    assert.include(ledgerText(empty), `Records\n${sentence}`);
  });

  it("escapes a test title that holds markup", () => {
    const html = toHtml(ledgerHtml(fixture));

    assert.include(html, "&lt;script&gt;alert(1)&lt;/script&gt;");
    assert.notInclude(html, "<script");
    assert.include(ledgerText(fixture), "<script>alert(1)</script>");
  });

  it("says these tests pass over these fixtures, never conformant or certified", () => {
    const html = toHtml(ledgerHtml(fixture));
    const text = ledgerText(fixture);

    for (const view of [html, text]) {
      assert.include(view, "these tests pass over these fixtures");
      assert.notMatch(view, /conformant|certified/iu);
    }
  });

  it("round-trips, passes checkTree, and gives every table a caption and header cells", () => {
    const tree = ledgerHtml(fixture);
    const tables = byTag(tree, "table");

    assert.isTrue(roundTrips(tree));
    assert.deepStrictEqual(checkTree(tree, { baseLevel: 1 }), []);
    assert.lengthOf(tables, expectedCaptions.length + 1);

    for (const table of tables) {
      const [caption, head, body] = childElements(table);
      assert.strictEqual(caption?.tag, "caption");
      assert.notStrictEqual(textOf(caption ?? h("caption", {})), "");
      assert.strictEqual(head?.tag, "thead");
      assert.strictEqual(body?.tag, "tbody");

      const headers = byTag(head ?? h("thead", {}), "th");
      assert.isAbove(headers.length, 0);
      assert.isTrue(headers.every((header) => header.attrs["scope"] === "col"));

      for (const row of childElements(body ?? h("tbody", {}))) {
        const [first] = childElements(row);
        assert.strictEqual(first?.tag, "th");
        assert.strictEqual(first?.attrs["scope"], "row");
      }
    }
  });
});

/**
 * The fixture document paths of the verdict report.
 */
const paths = {
  accepted: "items/accepted.xml",
  refused: "items/refused.xml",
  unchecked: "items/maths.xml",
  unsupported: "items/gap-match.xml",
} as const;

/**
 * A refusal of the refused fixture document.
 */
const refusal = new Refusal({
  detail: { element: "qti-choice-interation", parent: "qti-item-body" },
  document: paths.refused,
  location: { kind: "path", path: "qti-assessment-item/qti-item-body/qti-choice-interation" },
  readerRule: Option.none(),
  rule: "unknown-element",
  suggestion: Option.some("qti-choice-interaction"),
});

/**
 * A second refusal of the refused fixture document.
 */
const missing = new Refusal({
  detail: { attribute: "identifier", element: "qti-assessment-item" },
  document: paths.refused,
  location: { kind: "path", path: "qti-assessment-item" },
  readerRule: Option.none(),
  rule: "missing-attribute",
  suggestion: Option.none(),
});

/**
 * The fixture verdicts: refused, unchecked, accepted with an unsupported feature, and accepted.
 */
const verdicts: readonly Verdict[] = [
  { document: paths.refused, refusals: [refusal, missing], verdict: "refused" },
  {
    document: paths.unchecked,
    reasons: [{ path: "qti-assessment-item/qti-item-body/math", reason: "mathml" }],
    verdict: "unchecked",
  },
  {
    accepted: acceptForTest({
      ...bg007Item,
      document: paths.unsupported,
      unsupported: [
        {
          feature: "qti-gap-match-interaction",
          path: "qti-assessment-item/qti-item-body/qti-gap-match-interaction",
          shown: "notice",
        },
      ],
    }),
    document: paths.unsupported,
    verdict: "accepted-with-unsupported",
  },
  {
    accepted: acceptForTest({ ...bg007Item, document: paths.accepted, unsupported: [] }),
    document: paths.accepted,
    verdict: "accepted",
  },
];

describe("ledger/view.ts verdict report", () => {
  it("gives one line per document: its path, verdict, reason and unsupported features", () => {
    const lines = verdictLines(verdicts).split("\n");

    assert.deepStrictEqual(lines, [
      `${paths.refused} | refused | reason: unknown-element: ${describeRefusal(refusal)}; missing-attribute: ${describeRefusal(missing)} | unsupported features: none`,
      `${paths.unchecked} | unchecked | reason: mathml at qti-assessment-item/qti-item-body/math | unsupported features: none`,
      `${paths.unsupported} | accepted-with-unsupported | reason: none | unsupported features: qti-gap-match-interaction at qti-assessment-item/qti-item-body/qti-gap-match-interaction`,
      `${paths.accepted} | accepted | reason: none | unsupported features: none`,
      "",
    ]);
  });

  it("gives a table with a caption, column headers and a row per document", () => {
    const table = verdictTable(verdicts);
    const rows = rowsOf(table);
    const [caption, head] = childElements(table);

    assert.strictEqual(caption?.tag, "caption");
    assert.notStrictEqual(textOf(caption ?? h("caption", {})), "");
    assert.deepStrictEqual(
      byTag(head ?? h("thead", {}), "th").map((header) => [textOf(header), header.attrs["scope"]]),
      [
        ["Document", "col"],
        ["Verdict", "col"],
        ["Reason", "col"],
        ["Unsupported features", "col"],
      ],
    );
    assert.deepStrictEqual(
      rows.map((row) => {
        const document = row.get("Document") ?? h("th", {});

        return [document.tag, document.attrs["scope"], textOf(document)];
      }),
      verdicts.map((verdict) => ["th", "row", verdict.document]),
    );
    assert.deepStrictEqual(
      byTag(rows[0]?.get("Document") ?? h("th", {}), "a").map((link) => link.attrs["href"]),
      [`/item?${new URLSearchParams([["path", paths.refused]]).toString()}`],
    );
    assert.deepStrictEqual(
      rows.map((row) => textOf(row.get("Verdict") ?? h("td", {}))),
      ["refused", "unchecked", "accepted-with-unsupported", "accepted"],
    );
    assert.deepStrictEqual(
      byTag(rows[0]?.get("Reason") ?? h("td", {}), "li").map(textOf),
      [
        `unknown-element: ${describeRefusal(refusal)}`,
        `missing-attribute: ${describeRefusal(missing)}`,
      ].map((line) => line.replaceAll(/\s+/gu, " ").trim()),
    );
    assert.strictEqual(
      textOf(rows[1]?.get("Reason") ?? h("td", {})),
      "mathml at qti-assessment-item/qti-item-body/math",
    );
    assert.strictEqual(
      textOf(rows[2]?.get("Unsupported features") ?? h("td", {})),
      "qti-gap-match-interaction at qti-assessment-item/qti-item-body/qti-gap-match-interaction",
    );
    assert.strictEqual(textOf(rows[3]?.get("Reason") ?? h("td", {})), "none");
  });

  it("round-trips and passes checkTree in a page", () => {
    const page = h("div", { lang: "en" }, [verdictTable(verdicts)]);

    assert.isTrue(roundTrips(page));
    assert.deepStrictEqual(checkTree(page, { baseLevel: 1 }), []);
  });
});
