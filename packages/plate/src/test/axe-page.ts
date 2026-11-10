/**
 * What the accessibility sweep puts on a page, kept free of Node so an in-page test
 * (`axe.dom.test.ts`) and the Node-driven sweep (`axe.ts`) read one definition: the WCAG rule
 * tags axe-core runs, the two palettes plate's default stylesheet is measured under, and the page
 * shell a rendered item is set in.
 *
 * Test support, outside the core: nothing under `src/index.ts`'s closure imports it
 * (`src/boundary.test.ts`).
 *
 * @module
 */

/**
 * The axe-core rule tags the sweep runs: the WCAG 2.0, 2.1 and 2.2 rules of levels A and AA, and
 * nothing else, so a best-practice, experimental or AAA rule never runs.
 *
 * Axe-core drops the `experimental` and `deprecated` tags from a tag run unless the run names
 * them, so the four rules that carry both a WCAG tag and `experimental` (`css-orientation-lock`,
 * `p-as-heading`, `table-fake-caption` and `td-has-header`, in 4.14.0) stay out although
 * `axe.getRules(wcagTags)` lists them. axe-core 4.14.0 has no rule tagged `wcag22a`;
 * `target-size` is its one `wcag22aa` rule.
 *
 * @see https://github.com/dequelabs/axe-core/blob/v4.14.0/lib/core/base/audit.js#L197 (`tagExclude`)
 * @see https://github.com/dequelabs/axe-core/blob/v4.14.0/lib/core/utils/rule-should-run.js#L8 (`matchTags`)
 */
export const wcagTags: readonly string[] = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * The name of a palette the contrast sweep measures under.
 */
export type PaletteName = "fallbacks" | ".dark";

/**
 * Token values and the surface they sit on: what plate's default stylesheet is measured under.
 *
 * The stylesheet reads thirteen shadcn tokens, each with a light fallback, and declares none, so a
 * host's theme sets them. A palette stands for one such theme: `tokens` is what its `:root` sets,
 * and `surface` and `foreground` are what the host's page paints behind and under the item.
 */
export interface Palette {
  /**
   * The palette's name, as a report names it.
   */
  readonly name: PaletteName;
  /**
   * The host page's `background-color`, shadcn's `--background` in the palette's block.
   */
  readonly surface: string;
  /**
   * The host page's text colour, shadcn's `--foreground` in the palette's block, which the item's
   * text inherits where no rule sets one.
   */
  readonly foreground: string;
  /**
   * The tokens the palette sets, each as the CSS value its theme gives it; empty where the
   * stylesheet's own fallbacks apply.
   */
  readonly tokens: ReadonlyMap<string, string>;
}

/**
 * Shadcn's `.dark` values of the colour tokens the sheet reads, from its theming file, lines
 * 239 to 271 at commit `4aaea19`; `.dark` sets no `--radius`. The same values `src/styles.test.ts`
 * measures its nested pairs under.
 *
 * @see https://github.com/shadcn-ui/ui/blob/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/content/docs/(root)/theming.mdx#L239-L271
 */
const darkTokens: ReadonlyMap<string, string> = new Map([
  ["--primary", "oklch(0.922 0 0)"],
  ["--primary-foreground", "oklch(0.205 0 0)"],
  ["--accent", "oklch(0.269 0 0)"],
  ["--accent-foreground", "oklch(0.985 0 0)"],
  ["--muted", "oklch(0.269 0 0)"],
  ["--muted-foreground", "oklch(0.708 0 0)"],
  ["--card", "oklch(0.205 0 0)"],
  ["--card-foreground", "oklch(0.985 0 0)"],
  ["--destructive", "oklch(0.704 0.191 22.216)"],
  ["--border", "oklch(1 0 0 / 10%)"],
  ["--input", "oklch(1 0 0 / 15%)"],
  ["--ring", "oklch(0.556 0 0)"],
]);

/**
 * The palette that sets no token, so every `var(--token, fallback)` of the sheet takes its
 * fallback: shadcn's default neutral light value (theming file, lines 204 to 223 at commit
 * `4aaea19`, `src/test/tokens.ts`), on shadcn's light `--background` `oklch(1 0 0)` with page
 * text `--foreground` `oklch(0.145 0 0)`.
 *
 * @see https://github.com/shadcn-ui/ui/blob/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/content/docs/(root)/theming.mdx#L204-L223
 */
export const fallbackPalette: Palette = {
  foreground: "oklch(0.145 0 0)",
  name: "fallbacks",
  surface: "oklch(1 0 0)",
  tokens: new Map(),
};

/**
 * The palette of shadcn's `.dark` token values (theming file, lines 239 to 271 at commit
 * `4aaea19`) on its dark `--background` `oklch(0.145 0 0)` with page text `--foreground`
 * `oklch(0.985 0 0)`.
 *
 * @see https://github.com/shadcn-ui/ui/blob/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/content/docs/(root)/theming.mdx#L239-L271
 */
export const darkPalette: Palette = {
  foreground: "oklch(0.985 0 0)",
  name: ".dark",
  surface: "oklch(0.145 0 0)",
  tokens: darkTokens,
};

/**
 * The two palettes the contrast sweep measures, {@link fallbackPalette} first, then
 * {@link darkPalette}. A host's own theme is the host's to check: the theme contract measures
 * plate's default stylesheet under these two only.
 */
export const palettes: readonly Palette[] = [fallbackPalette, darkPalette];

/**
 * Write the CSS that puts a palette on a page: its tokens on `:root`, and its surface and text
 * colour on `body`, where the host's page paints them.
 *
 * @param palette The palette.
 * @returns The rules, with no `<style>` tags around them.
 */
export const paletteRule = (palette: Palette): string =>
  `:root{${[...palette.tokens].map(([token, value]) => `${token}:${value}`).join(";")}} body{background-color:${palette.surface};color:${palette.foreground}}`;

/**
 * Write the page a rendered item is checked in: the default stylesheet and the palette's rules in
 * the head, and the item inside a `main` landmark, so the page-level rules (a document title, a
 * language, a way to bypass blocks) find what a host page gives and judge only the item.
 *
 * @param body The item's HTML, or hand-written markup under test.
 * @param sheet The stylesheet's text, `src/styles.css`.
 * @param palette The palette the page is painted with.
 * @returns A complete HTML document.
 */
export const sweepShell = (body: string, sheet: string, palette: Palette): string =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>plate sweep</title><style>${sheet}</style><style>${paletteRule(palette)}</style></head><body><main>${body}</main></body></html>`;
