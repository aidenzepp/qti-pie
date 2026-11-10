/**
 * The walk's pages in Chromium and WebKit, with JavaScript off: the listing at
 * `/`, `CAT/test.xml`'s refusal, the hotspot item's notice, the theme box with `.dark`,
 * `/verdicts` and `/ledger`.
 *
 * Expected values come from the code the playground runs: the verdict cache it reads, the part
 * table, `message`, `verdictTable` and `ledgerHtml`.
 */
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Option, Schema } from "effect";
import type { Locator, Page } from "playwright-core";
import { verdictCache, Verdicts } from "#plate/dev/listing.ts";
import { Packages } from "#plate/dev/packages.ts";
import { playgroundCaches } from "#plate/dev/page.ts";
import type { PlaygroundLayer } from "#plate/dev/page.ts";
import { corpusDocuments } from "#plate/document/corpus.ts";
import type { Element } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import type { Ledger } from "#plate/ledger/report.ts";
import { ledgerHtml, verdictTable } from "#plate/ledger/view.ts";
import { message } from "#plate/messages.ts";
import { modules } from "#plate/model/interactions.ts";
import { attribute, textOf } from "#plate/test/accessibility.ts";
import { Playground, eachEngine, playgroundLayer, withPage } from "#plate/test/browsers.ts";
import { elementsOf, itemTarget } from "#plate/test/playground-page.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, Verdict } from "#plate/validate/verdict.ts";

/**
 * The corpus paths of the documents these tests open: BG007's Choice, the refused CAT test, and
 * the item whose hotspot interaction the renderer does not render.
 */
const paths = {
  bg007: "QTI3_BPIG_Examples/items/BG007.xml",
  cat: "qtiv3-examples/CAT/test.xml",
  hotspot: "QTI3_BPIG_Examples/items/QTI3-hotspot.xml",
} as const;

/**
 * The feature the hotspot item's notice names: its interaction's element.
 */
const hotspotFeature = "qti-hotspot-interaction";

/**
 * The `data-slot` markers these tests find parts by, read from the part table.
 */
const slots = {
  choice: rowFor("choice-interaction", "choice").slot,
  control: rowFor("choice-interaction", "control").slot,
  indicator: rowFor("choice-interaction", "indicator").slot,
  notice: rowFor("item", "notice").slot,
} as const;

/**
 * The verdict cache every playground over the corpus shares, so the corpus is opened once for the
 * file.
 */
const verdicts = Effect.runSync(verdictCache());

/**
 * The Layer of a playground over the corpus that shares {@link verdicts}, with a package cache of
 * its own.
 */
const sharedVerdicts: PlaygroundLayer = Layer.merge(
  Layer.succeed(Verdicts, verdicts),
  Packages.layer,
);

/**
 * The Layer of a playground with caches of its own whose ledger page reads `ledger.json` from a
 * folder.
 *
 * @param folder `PLATE_LEDGER_DIR`.
 * @returns The Layer.
 */
const ledgerLayer = (folder: string): PlaygroundLayer =>
  Layer.merge(
    playgroundCaches,
    ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_LEDGER_DIR: folder })),
  );

/**
 * The scratch folder this file owns, under the package's git-ignored `work/browser-test/`.
 */
const scratch = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "work",
  "browser-test",
  `pages-${randomUUID()}`,
);

/**
 * The scratch folder that holds no `ledger.json`.
 */
const noLedgerFolder = path.join(scratch, "no-ledger");

/**
 * The scratch folder that holds {@link fixtureLedger} as `ledger.json`.
 */
const ledgerFolder = path.join(scratch, "ledger");

/**
 * The command the ledger page asks for before a ledger is written.
 */
const ledgerCommand = "pnpm --filter @qti-pie/plate ledger";

/**
 * The hand-built ledger the ledger page reads: a covered Choice row at Basic and an excluded
 * Metadata row at Advanced.
 */
const fixtureLedger: Ledger = {
  browserRuns: [],
  headlines: {
    advanced: { covered: 0, excluded: 1, limited: 0, "unsupported-with-notice": 0 },
    basic: { covered: 1, excluded: 0, limited: 0, "unsupported-with-notice": 0 },
    elective: { covered: 0, excluded: 0, limited: 0, "unsupported-with-notice": 0 },
    elevated: { covered: 0, excluded: 0, limited: 0, "unsupported-with-notice": 0 },
  },
  records: [],
  rows: [
    {
      family: "Q",
      id: "Q-2",
      interaction: { composition: ["dev playground"], keyboard: [] },
      level: "basic",
      name: "Choice",
      proofs: [
        {
          documents: [paths.bg007],
          file: "src/dev/page.test.ts",
          kind: "fixtures",
          tests: ["a BG007 open, then a POST of the true choice, shows score 1"],
        },
      ],
      renders: true,
      state: "covered",
      validates: true,
    },
    {
      family: "M",
      id: "M-1",
      level: "advanced",
      name: "A metadata feature",
      proofs: [],
      reason: "the goal leaves it out",
      renders: false,
      source: "the goal",
      state: "excluded",
      validates: false,
    },
  ],
};

/**
 * The `--primary` values of the pasted theme, both unlike the sheet's fallback,
 * `oklch(0.205 0 0)`.
 */
const primary = { dark: "oklch(0.75 0.15 150)", light: "oklch(0.45 0.2 260)" } as const;

/**
 * The theme pasted into the box: a `:root` block and a `.dark` block, each giving `--primary`.
 */
const themePaste = `:root {
  --primary: ${primary.light};
}

.dark {
  --primary: ${primary.dark};
}
`;

/**
 * The selector of a ticked Choice's Indicator, which plate's sheet fills with `var(--primary)`.
 */
const tickedIndicator = `[data-slot="${slots.choice}"]:has([data-slot="${slots.control}"]:checked) [data-slot="${slots.indicator}"]`;

beforeAll(async () => {
  mkdirSync(noLedgerFolder, { recursive: true });
  mkdirSync(ledgerFolder, { recursive: true });
  writeFileSync(path.join(ledgerFolder, "ledger.json"), JSON.stringify(fixtureLedger));
  await Effect.runPromise(verdicts.verdicts);
});

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

/**
 * Give the children of an element that are elements.
 *
 * @param element The element.
 * @returns Its element children, in order.
 */
const childElements = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Collapse a text's whitespace runs to one space and trim it, as `textOf` reads a tree's text.
 *
 * @param words The text.
 * @returns The text collapsed.
 */
const collapsed = (words: string): string => words.replaceAll(/[\t\n\f\r ]+/gu, " ").trim();

/**
 * Open a page of the playground and require it to answer 200.
 *
 * @param page The page.
 * @param target The path and query.
 * @returns Once the page has loaded.
 */
const open = Effect.fn("open")(function* open(page: Page, target: string) {
  const { origin } = yield* Playground;
  const response = yield* Effect.promise(() => page.goto(`${origin}${target}`));

  assert.isNotNull(response);
  assert.strictEqual(response.status(), 200);
});

/**
 * Evaluate a string expression in the page and read its value as a string.
 *
 * @param page The page.
 * @param expression The expression.
 * @returns Its value; the test fails when it is not a string.
 */
const evaluateString = (page: Page, expression: string) =>
  Effect.promise(() => page.evaluate(expression)).pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(Schema.String)),
  );

/**
 * Read a `data-*` attribute of the element a locator finds.
 *
 * @param locator The locator.
 * @param name The attribute's name after `data-`.
 * @returns The attribute's value, or `null` when the element does not carry it.
 */
const dataOf = (locator: Locator, name: string) =>
  Effect.promise(() => locator.getAttribute(`data-${name}`));

/**
 * Give one member's verdict from the shared cache.
 *
 * @param corpusPath The member's corpus path.
 * @returns Its verdict; the test fails when the path is no member.
 */
const verdictOf = Effect.fn("verdictOf")(function* verdictOf(corpusPath: string) {
  return Option.getOrElse(yield* verdicts.verdictOf(corpusPath), () =>
    assert.fail(`${corpusPath} is a member of the corpus`),
  );
});

/**
 * Give the accepted document of a verdict that accepts it.
 *
 * @param verdict The verdict.
 * @returns Its accepted document; the test fails when `open` did not accept it.
 */
const acceptedOf = (verdict: Verdict): Accepted =>
  Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${verdict.document} is ${verdict.verdict}, not accepted`),
  );

/**
 * Locate a field of the theme box by its name.
 *
 * @param page The page.
 * @param name The field's name: `theme` or `dark`.
 * @returns The locator.
 */
const themeField = (page: Page, name: "dark" | "theme") =>
  page.locator(`form[action="/theme"] [name="${name}"]`);

/**
 * Submit the theme box and wait for the page its redirect returns to, the same page, to load.
 *
 * @param page The page.
 * @returns Once the returned page has loaded.
 */
const applyTheme = (page: Page) =>
  Effect.promise(() =>
    Promise.all([
      page.waitForEvent("load"),
      page.locator('form[action="/theme"] button[type="submit"]').click(),
    ]),
  );

/**
 * Read the root element's computed `--primary`.
 *
 * @param page The page.
 * @returns The value, trimmed.
 */
const primaryOf = (page: Page) =>
  evaluateString(
    page,
    'getComputedStyle(document.documentElement).getPropertyValue("--primary")',
  ).pipe(Effect.map((value) => value.trim()));

/**
 * Read the `class` of the page's `html` element.
 *
 * @param page The page.
 * @returns The attribute's value, or `null` when it has none.
 */
const htmlClass = (page: Page) => Effect.promise(() => page.locator("html").getAttribute("class"));

/**
 * Tick the page's first Choice Control by mouse and read the computed background colour of its
 * Indicator, which plate's sheet fills with `var(--primary)` once its choice is selected.
 *
 * The Control is a clipped 1px box under its Indicator, so the click is forced, as
 * `walk.browser.test.ts` explains; `check` fails when the Control is left unchecked.
 *
 * @param page The page.
 * @returns The Indicator's computed `background-color`.
 */
const indicatorColour = Effect.fn("indicatorColour")(function* indicatorColour(page: Page) {
  yield* Effect.promise(() =>
    page.locator(`[data-slot="${slots.control}"]`).first().check({ force: true }),
  );

  assert.strictEqual(yield* Effect.promise(() => page.locator(tickedIndicator).count()), 1);

  return yield* evaluateString(
    page,
    `getComputedStyle(document.querySelector(${JSON.stringify(tickedIndicator)})).backgroundColor`,
  );
});

eachEngine((it) => {
  it.layer(playgroundLayer({}, sharedVerdicts))("the walk, pages", (pages) => {
    pages.effect(
      "the listing at / links every member once, its verdict headings' counts sum to the set's size, BG007 sits under accepted and CAT/test.xml under refused",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* listing() {
            const members = yield* corpusDocuments;

            yield* open(page, "/");

            const sections = yield* Effect.all(
              (yield* Effect.promise(() => page.locator("section[data-verdict]").all())).map(
                (section) =>
                  Effect.all({
                    count: dataOf(section.locator("h2"), "count"),
                    links: Effect.promise(() => section.locator("a").allTextContents()),
                    verdict: dataOf(section, "verdict"),
                  }),
              ),
            );
            const listed = sections.flatMap((section) => section.links);
            const hrefs = yield* Effect.promise(() =>
              page.evaluate(
                'Array.from(document.querySelectorAll("section[data-verdict] a"), (link) => link.getAttribute("href"))',
              ),
            ).pipe(Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(Schema.String))));
            const sectionOf = (member: string) =>
              sections.find((section) => section.links.includes(member))?.verdict;

            assert.strictEqual(
              sections.reduce((sum, section) => sum + Number(section.count), 0),
              members.length,
            );
            for (const section of sections) {
              assert.lengthOf(section.links, Number(section.count), section.verdict ?? "");
            }
            assert.deepStrictEqual(listed.toSorted(), members.toSorted(), "each member once");
            assert.deepStrictEqual(hrefs, listed.map(itemTarget));
            assert.strictEqual(sectionOf(paths.bg007), "accepted");
            assert.strictEqual(sectionOf(paths.cat), "refused");
          }),
        ),
    );

    pages.effect("CAT/test.xml opens to its refusal and no item form", () =>
      withPage({ javaScriptEnabled: false }, (page) =>
        Effect.gen(function* cat() {
          const verdict = yield* verdictOf(paths.cat);
          const rules =
            verdict.verdict === "refused"
              ? verdict.refusals.map((refusal) => refusal.rule)
              : assert.fail(`${paths.cat} is ${verdict.verdict}, not refused`);

          yield* open(page, itemTarget(paths.cat));

          const refusals = page.locator("[data-rule]");
          const forms = page.locator("form");

          assert.deepStrictEqual(
            yield* Effect.all(
              (yield* Effect.promise(() => refusals.all())).map((refusal) =>
                dataOf(refusal, "rule"),
              ),
            ),
            rules,
          );
          assert.isTrue(yield* Effect.promise(() => refusals.first().isVisible()));
          assert.deepStrictEqual(
            yield* Effect.all(
              (yield* Effect.promise(() => forms.all())).map((form) =>
                Effect.promise(() => form.getAttribute("action")),
              ),
            ),
            ["/theme"],
          );
        }),
      ),
    );

    pages.effect(
      "QTI3-hotspot shows the unsupported-feature notice in place of its hotspot interaction while the Hotspot module is a stub, and the interaction's controls with no such notice once it lands",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* hotspot() {
            // Derived from the module's `implemented` flag, as vertical.test.ts [I-0] derives a
            // verdict: the page shows the hotspot item's notice and no control while the module
            // is a stub, and once it lands, no notice naming the element and as many native
            // controls as the module declares for the item's hotspot nodes.
            const landed = modules.hotspot.implemented;
            const accepted = acceptedOf(yield* verdictOf(paths.hotspot));
            const features = accepted.unsupported
              .filter((unsupported) => unsupported.shown === "notice")
              .map((unsupported) => unsupported.feature);
            let controls = 0;
            for (const node of accepted.item.body) {
              if (landed && node.kind === "hotspot") {
                controls += modules.hotspot.controls(node);
              }
            }

            assert.strictEqual(features.includes(hotspotFeature), !landed);

            yield* open(page, itemTarget(paths.hotspot));

            const notices = page.locator(`[data-slot="${slots.notice}"]`);
            const hotspotNotice = notices.filter({
              hasText: message("en", "notice", { feature: hotspotFeature }),
            });

            assert.deepStrictEqual(
              yield* Effect.promise(() => notices.allTextContents()),
              features.map((feature) => message("en", "notice", { feature })),
            );
            assert.strictEqual(yield* Effect.promise(() => hotspotNotice.count()), landed ? 0 : 1);
            assert.strictEqual(yield* Effect.promise(() => hotspotNotice.isVisible()), !landed);
            assert.strictEqual(
              yield* Effect.promise(() =>
                page.locator("qti-hotspot-interaction, qti-hotspot-choice").count(),
              ),
              0,
            );
            assert.strictEqual(
              yield* Effect.promise(() =>
                page.locator('form[action^="/item"] :is(input, select, textarea)').count(),
              ),
              controls,
            );
          }),
        ),
    );

    pages.effect(
      "/verdicts is a table with a caption, the four column headers and one row per member",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* verdictsPage() {
            const members = yield* corpusDocuments;
            const expected = elementsOf([verdictTable(yield* verdicts.verdicts)]);
            const columns = expected
              .filter((element) => element.tag === "th" && attribute(element, "scope") === "col")
              .map(textOf);

            yield* open(page, "/verdicts");

            const table = page.getByRole("table");

            assert.strictEqual(yield* Effect.promise(() => table.count()), 1);
            assert.deepStrictEqual(
              (yield* Effect.promise(() => table.locator("caption").allTextContents())).map(
                collapsed,
              ),
              expected.filter((element) => element.tag === "caption").map(textOf),
            );
            assert.lengthOf(columns, 4);
            assert.deepStrictEqual(
              (yield* Effect.promise(() => table.getByRole("columnheader").allTextContents())).map(
                collapsed,
              ),
              columns,
            );
            assert.strictEqual(
              yield* Effect.promise(() => table.locator("tbody > tr").count()),
              members.length,
            );
            assert.deepStrictEqual(
              (yield* Effect.promise(() =>
                table.locator('tbody th[scope="row"]').allTextContents(),
              )).map(collapsed),
              members,
            );
          }),
        ),
    );
  });

  // Its own playground, so the theme it stores stays out of the other cases' pages.
  it.layer(playgroundLayer({}, sharedVerdicts))("the theme box", (box) => {
    box.effect(
      "a theme with :root and .dark applied gives the root the :root --primary; with Dark ticked, html carries class dark, --primary is the .dark value, and a ticked Choice's Indicator changes colour",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* themed() {
            yield* open(page, itemTarget(paths.bg007));
            yield* Effect.promise(() => themeField(page, "theme").fill(themePaste));
            yield* applyTheme(page);

            assert.strictEqual(yield* primaryOf(page), primary.light);
            assert.isNull(yield* htmlClass(page));

            const light = yield* indicatorColour(page);

            yield* Effect.promise(() => themeField(page, "dark").check());
            yield* applyTheme(page);

            assert.strictEqual(yield* htmlClass(page), "dark");
            assert.strictEqual(yield* primaryOf(page), primary.dark);
            assert.notStrictEqual(yield* indicatorColour(page), light);
          }),
        ),
    );
  });

  it.layer(playgroundLayer({}, ledgerLayer(noLedgerFolder)))(
    "the ledger page before the one command",
    (before) => {
      before.effect(
        "/ledger with PLATE_LEDGER_DIR at an empty folder says to run the one command",
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* noLedger() {
              yield* open(page, "/ledger");

              assert.deepStrictEqual(
                yield* Effect.promise(() => page.locator("main code").allTextContents()),
                [ledgerCommand],
              );
              assert.strictEqual(
                yield* Effect.promise(() => page.locator("article, table").count()),
                0,
              );
            }),
          ),
      );
    },
  );

  it.layer(playgroundLayer({}, ledgerLayer(ledgerFolder)))(
    "the ledger page after the one command",
    (after) => {
      after.effect(
        "/ledger with PLATE_LEDGER_DIR at a folder holding a ledger shows the view: its levels and their headlines",
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* ledgerPage() {
              const view = childElements(ledgerHtml(fixtureLedger));
              const article = page.locator("article");

              yield* open(page, "/ledger");

              assert.strictEqual(yield* Effect.promise(() => article.count()), 1);
              assert.deepStrictEqual(
                (yield* Effect.promise(() =>
                  article.locator(":scope > :is(h1, h2)").allTextContents(),
                )).map(collapsed),
                view.filter((element) => element.tag === "h1" || element.tag === "h2").map(textOf),
              );
              assert.deepStrictEqual(
                (yield* Effect.promise(() => article.locator(":scope > p").allTextContents())).map(
                  collapsed,
                ),
                view.filter((element) => element.tag === "p").map(textOf),
              );
            }),
          ),
      );
    },
  );
});
