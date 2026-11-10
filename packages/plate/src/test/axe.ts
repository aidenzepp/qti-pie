/**
 * The accessibility sweep's Node side: axe-core's WCAG 2.2 A and AA rules run over plate's HTML in
 * Chromium and WebKit, one page at a time, and the findings written as a report.
 *
 * {@link checkPage} sets one rendered item (or hand-written markup) in the page shell
 * (`#plate/test/axe-page.ts`) under plate's default stylesheet and one palette, injects
 * `axe-core`'s browser build, and reads what the rules found. {@link sweepMembers} sweeps each
 * corpus member `open` accepts in the render states `src/test/sweep.ts` defines, and
 * {@link sweepText} writes the findings. `scripts/sweep.ts` is the command over the whole corpus;
 * `src/test/axe.dom.test.ts` runs the same rules in-page over the fixtures.
 *
 * Automated rules settle part of a criterion only: keyboard operation, focus order, dragging and
 * status messages stay with the runtime's in-page tests and the local screen-reader pass.
 *
 * Test support, outside the core: nothing under `src/index.ts`'s closure imports it
 * (`src/boundary.test.ts`).
 *
 * @module
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { Effect, Option, Order, Schema } from "effect";
import type { Page } from "playwright-core";
import { configure } from "#plate/configuration.ts";
import type { Accepted, Configuration } from "#plate/index.ts";
import { darkPalette, fallbackPalette, sweepShell, wcagTags } from "#plate/test/axe-page.ts";
import type { Palette, PaletteName } from "#plate/test/axe-page.ts";
import { Engine, withPage } from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import { acceptedOf, begunUnder, templated, threeStates } from "#plate/test/sweep.ts";
import type { Member, StateName } from "#plate/test/sweep.ts";

/**
 * The path of axe-core's browser build, `axe.min.js`, which a page loads as a script.
 *
 * The file is resolved, never imported: an import would load axe-core into Node, where it has no
 * DOM to run over. `axe-core` lists no `exports` map, so its file path resolves.
 */
const axeScript = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

/**
 * The default stylesheet's text, `src/styles.css`, read on first use and kept for the module's
 * life. A stylesheet that cannot be read is a defect of the checkout, not a result of the sweep.
 */
const defaultSheet = Effect.runSync(
  Effect.cached(
    Effect.promise(() => readFile(new URL(import.meta.resolve("#plate/styles.css")), "utf-8")),
  ),
);

/**
 * One finding of an axe-core rule on a page.
 */
export interface Found {
  /**
   * How serious axe-core rates the finding: `minor`, `moderate`, `serious` or `critical`.
   */
  readonly impact: string;
  /**
   * The `data-slot` marker of the offending node, or of its nearest ancestor that has one;
   * `page` when no node on the way up to the document has one.
   */
  readonly part: string;
  /**
   * The id of the axe-core rule that found it, such as `color-contrast`.
   */
  readonly rule: string;
}

/**
 * What one page check found: each node a rule failed on, one {@link Found} per node, and each node
 * a rule could not settle.
 *
 * `incomplete` is axe-core's "needs review": a rule it cannot decide from the page alone, such
 * as text of one character, whose contrast axe-core leaves undecided because the character may be
 * an icon. It is reported and counted, and never a violation.
 *
 * @see https://github.com/dequelabs/axe-core/blob/v4.14.0/lib/checks/color/color-contrast-evaluate.js#L145 (`shortTextContent`)
 */
export interface PageCheck {
  readonly incomplete: readonly Found[];
  readonly violations: readonly Found[];
}

/**
 * The Schema of a {@link Found} as the page's script writes it.
 */
const FoundSchema = Schema.Struct({
  impact: Schema.String,
  part: Schema.String,
  rule: Schema.String,
});

/**
 * The Schema of the {@link PageCheck} the page's script returns.
 */
const PageCheckSchema = Schema.Struct({
  incomplete: Schema.Array(FoundSchema),
  violations: Schema.Array(FoundSchema),
});

/**
 * Decode the value the page's script returned into a {@link PageCheck}.
 */
const decodePageCheck = Schema.decodeUnknownEffect(PageCheckSchema);

/**
 * The script that reads `axe.run`'s results inside the page: each node of each violation and of
 * each incomplete result, with the `data-slot` of the node or of its nearest ancestor that has
 * one. It runs as a string, because the package's `lib` has no DOM types, and it needs
 * `elementRef`, which gives each node's element.
 */
const readResults = `(results) => {
  const found = (rule) => rule.nodes.map((node) => {
    const slot = node.element === undefined ? null : node.element.closest("[data-slot]");
    return {
      impact: node.impact ?? rule.impact ?? "unknown",
      part: slot === null ? "page" : slot.getAttribute("data-slot") ?? "page",
      rule: rule.id,
    };
  });
  return { incomplete: results.incomplete.flatMap(found), violations: results.violations.flatMap(found) };
}`;

/**
 * Write the script that runs axe-core over the page.
 *
 * @param rules `every` to run the WCAG 2.2 A and AA rules ({@link wcagTags}); `contrast` to run
 *   `color-contrast` alone.
 * @returns The expression, which gives a promise of the findings.
 */
const runScript = (rules: "contrast" | "every"): string => {
  const runOnly =
    rules === "contrast"
      ? { type: "rule", values: ["color-contrast"] }
      : { type: "tag", values: wcagTags };

  return `axe.run(document, ${JSON.stringify({ elementRef: true, resultTypes: ["violations", "incomplete"], runOnly })}).then(${readResults})`;
};

/**
 * Check a page of markup with axe-core: set the markup in the page shell under plate's default
 * stylesheet and a palette, load axe-core's browser build, run the rules, and read what they
 * found.
 *
 * The page must run script (`withPage({ javaScriptEnabled: true }, …)`), which axe-core needs and
 * plate's own markup never does. axe-core is loaded into a window once: setting a page's content
 * keeps its window, so a later check on the same page runs the copy already there.
 *
 * @param page The page, whose context runs script.
 * @param html The item's HTML, or hand-written markup, which goes inside the shell's `main`.
 * @param palette The palette the page is painted with, and the contrast measured under.
 * @param rules `every`, the default, runs the WCAG 2.2 A and AA rules; `contrast` runs
 *   `color-contrast` alone.
 * @returns What the rules found; a page that fails to load or run is a defect.
 */
export const checkPage = Effect.fn("checkPage")(function* checkPage(
  page: Page,
  html: string,
  palette: Palette,
  rules: "contrast" | "every" = "every",
): Effect.fn.Return<PageCheck> {
  const sheet = yield* defaultSheet;

  yield* Effect.promise(() => page.setContent(sweepShell(html, sheet, palette)));

  const loaded = yield* Effect.promise(() => page.evaluate("typeof axe"));

  if (loaded === "undefined") {
    yield* Effect.promise(() => page.addScriptTag({ path: axeScript }));
  }

  const found: unknown = yield* Effect.promise(() => page.evaluate(runScript(rules)));

  return yield* decodePageCheck(found).pipe(Effect.orDie);
});

/**
 * One check of the sweep: an item in one render state, under one palette, in one engine, and what
 * the rules found.
 */
export interface SweepRow {
  readonly check: PageCheck;
  readonly engine: EngineName;
  /**
   * The member's corpus-relative path.
   */
  readonly location: string;
  readonly palette: PaletteName;
  readonly state: StateName;
}

/**
 * A sweep's findings: the engines it ran in with their versions, how many items and checks it
 * ran, and each check's row.
 */
export interface SweepReport {
  /**
   * The engines the rows ran in, each with the version its browser reported.
   */
  readonly engines: readonly { readonly name: EngineName; readonly version: string }[];
  /**
   * How many distinct items the rows cover.
   */
  readonly items: number;
  /**
   * How many page checks ran across every engine, which is the number of rows.
   */
  readonly renders: number;
  readonly rows: readonly SweepRow[];
}

/**
 * The failure of a corpus item that `open` accepted but that the sweep cannot render: `begin`
 * could not start the record a templated item is shown under, or `render` refused the item.
 */
export class SweepFailed extends Schema.TaggedError<SweepFailed>()("SweepFailed", {
  detail: Schema.String,
  location: Schema.String,
  stage: Schema.Literals(["record", "render"]),
}) {
  /**
   * What failed for which item, and where to see every item that fails the same way.
   */
  override get message(): string {
    const what =
      this.stage === "record"
        ? "starting the record a templated item is shown under"
        : "rendering the item";

    return `The sweep stopped at ${this.location}: ${what} failed with ${this.detail}. The sweep checks only markup that renders, so it cannot go past this item; \`pnpm --filter @qti-pie/plate test src/corpus.render.test.ts\` lists every accepted item that does not render.`;
  }
}

/**
 * Name a failure of `begin`, `decodeRecord` or `render` for a {@link SweepFailed}.
 *
 * @param failure The failure, any of the tagged errors those functions give.
 * @returns Its tag and message.
 */
const describeFailure = (failure: { readonly _tag: string; readonly message: string }): string =>
  `${failure._tag} (${failure.message})`;

/**
 * Check one accepted item: each of its three render states under the fallbacks palette with every
 * rule, and its `messages and posted text` state under `.dark` with the contrast rule alone.
 *
 * A templated item is rendered under the record `begin` starts for the seed `1`, as the corpus
 * sweeps render it; any other item is rendered with no record.
 *
 * @param page The page, whose context runs script.
 * @param engine The page's engine, which each row names.
 * @param location The member's corpus-relative path.
 * @param accepted The accepted document.
 * @param configuration The configuration every state renders with.
 * @returns The item's four rows; {@link SweepFailed} when it cannot be rendered.
 */
const sweepItem = Effect.fn("sweepItem")(function* sweepItem(
  page: Page,
  engine: EngineName,
  location: string,
  accepted: Accepted,
  configuration: Configuration,
): Effect.fn.Return<readonly SweepRow[], SweepFailed> {
  const begun = templated(accepted)
    ? yield* Effect.fromResult(begunUnder(accepted, "1")).pipe(
        Effect.mapError(
          (failure) =>
            new SweepFailed({ detail: describeFailure(failure), location, stage: "record" }),
        ),
      )
    : undefined;
  const states = yield* Effect.fromResult(
    threeStates(accepted, configuration, begun?.decoded),
  ).pipe(
    Effect.mapError(
      (failure) => new SweepFailed({ detail: describeFailure(failure), location, stage: "render" }),
    ),
  );
  const rows: SweepRow[] = [];

  for (const state of states) {
    rows.push({
      check: yield* checkPage(page, state.html, fallbackPalette),
      engine,
      location,
      palette: fallbackPalette.name,
      state: state.name,
    });
  }

  const messages = states.find((state) => state.name === "messages and posted text");

  if (messages !== undefined) {
    rows.push({
      check: yield* checkPage(page, messages.html, darkPalette, "contrast"),
      engine,
      location,
      palette: darkPalette.name,
      state: messages.name,
    });
  }

  return rows;
});

/**
 * Sweep corpus members in the engine the context holds: each member `acceptedOf` accepts is
 * checked in its three render states under the fallbacks palette with every WCAG 2.2 A and AA
 * rule, and once more in its `messages and posted text` state under the `.dark` palette for
 * contrast, so four rows an item. A member that is refused, unchecked or not an item gives no row.
 *
 * Each member is checked in a page of its own, with script on, and every request the page makes
 * is refused. A page set from a string has no base URL, so a relative `src` or `data` fails to
 * load anyway; refusing the rest keeps an absolute one (a few corpus items name images on the web)
 * from making the result depend on the network, or the load wait on a slow one.
 *
 * @param members The corpus members, as `openCorpus` gives them.
 * @returns The rows, in member order and then check order; {@link SweepFailed} for the first
 *   accepted item that cannot be rendered.
 */
export const sweepMembers = Effect.fn("sweepMembers")(function* sweepMembers(
  members: readonly Member[],
): Effect.fn.Return<readonly SweepRow[], SweepFailed, Engine> {
  const { name } = yield* Engine;
  const configuration = yield* configure({}).pipe(Effect.orDie);
  const rows: SweepRow[] = [];

  for (const member of members) {
    const accepted = acceptedOf(member);

    if (Option.isSome(accepted)) {
      const item = yield* withPage({ javaScriptEnabled: true }, (page) =>
        Effect.promise(() => page.route("**/*", (route) => route.abort())).pipe(
          Effect.andThen(sweepItem(page, name, member.location, accepted.value, configuration)),
        ),
      );

      rows.push(...item);
    }
  }

  return rows;
});

/**
 * Write a report as text: one line for each violation, naming its item, state, palette, engine,
 * rule (with its impact) and part, separated by ` | `; then one line for each rule that left
 * incomplete results, with the count; then the totals line, `items N, renders N, violations N,
 * incomplete N`.
 *
 * @param report The report.
 * @returns The lines, each ending in a line feed.
 */
export const sweepText = (report: SweepReport): string => {
  const violations = report.rows.flatMap((row) =>
    row.check.violations.map(
      (found) =>
        `${row.location} | ${row.state} | ${row.palette} | ${row.engine} | ${found.rule} (${found.impact}) | ${found.part}`,
    ),
  );
  const incomplete = new Map<string, number>();

  for (const found of report.rows.flatMap((row) => row.check.incomplete)) {
    incomplete.set(found.rule, (incomplete.get(found.rule) ?? 0) + 1);
  }

  const incompleteLines = [...incomplete]
    .toSorted(Order.mapInput(Order.String, ([rule]: readonly [string, number]) => rule))
    .map(([rule, count]) => `incomplete ${rule}: ${String(count)}`);
  const totals = `items ${String(report.items)}, renders ${String(report.renders)}, violations ${String(violations.length)}, incomplete ${String(report.rows.flatMap((row) => row.check.incomplete).length)}`;

  return [...violations, ...incompleteLines, totals].map((line) => `${line}\n`).join("");
};
