import { Option } from "effect";

/**
 * The shadcn/ui tokens the package's stylesheets may read, in order, each to the fallback every
 * `var()` of it carries: shadcn's default neutral light value, from its theming file
 * (https://github.com/shadcn-ui/ui/blob/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/content/docs/(root)/theming.mdx,
 * lines 204-223).
 *
 * Test support, shared by the stylesheets' tests. The theming file's other tokens are not read:
 *
 * - `--background` and `--foreground`: the page surface and its text are the host's.
 * - `--secondary*`: no part is a secondary action.
 * - `--popover*`, `--chart-*` and `--sidebar*`: there is no overlay, chart or sidebar.
 * - `--destructive-foreground`: the theming file defines none.
 * - The fonts: the item inherits the host's.
 */
export const tokens: ReadonlyMap<string, string> = new Map([
  ["--primary", "oklch(0.205 0 0)"],
  ["--primary-foreground", "oklch(0.985 0 0)"],
  ["--accent", "oklch(0.97 0 0)"],
  ["--accent-foreground", "oklch(0.205 0 0)"],
  ["--muted", "oklch(0.97 0 0)"],
  ["--muted-foreground", "oklch(0.556 0 0)"],
  ["--card", "oklch(1 0 0)"],
  ["--card-foreground", "oklch(0.145 0 0)"],
  ["--destructive", "oklch(0.577 0.245 27.325)"],
  ["--border", "oklch(0.922 0 0)"],
  ["--input", "oklch(0.922 0 0)"],
  ["--ring", "oklch(0.708 0 0)"],
  ["--radius", "0.625rem"],
]);

/**
 * A colour in OKLCh, as CSS `oklch()` writes it: lightness from 0 to 1, chroma, and hue in degrees.
 */
export interface Oklch {
  readonly lightness: number;
  readonly chroma: number;
  readonly hue: number;
}

/**
 * The `oklch(L C H)` form the token fallbacks use: three plain CSS numbers, with no percentage, no
 * `none` and no alpha.
 */
const oklchForm =
  /^oklch\(\s*(?<lightness>-?(?:\d+(?:\.\d+)?|\.\d+))\s+(?<chroma>-?(?:\d+(?:\.\d+)?|\.\d+))\s+(?<hue>-?(?:\d+(?:\.\d+)?|\.\d+))\s*\)$/u;

/**
 * Read a colour written as `oklch(L C H)` with three plain numbers.
 *
 * @param text The colour as a stylesheet or a theme writes it.
 * @returns The colour, or none for any other form: a percentage, `none`, an alpha, or another
 *   colour function or name.
 */
export const parseOklch = (text: string): Option.Option<Oklch> =>
  Option.fromNullishOr(oklchForm.exec(text)?.groups).pipe(
    Option.map(({ chroma, hue, lightness }) => ({
      chroma: Number(chroma),
      hue: Number(hue),
      lightness: Number(lightness),
    })),
  );

/**
 * Clamp a linear sRGB channel to the gamut, [0, 1].
 *
 * @param channel The channel, which a colour outside sRGB puts below 0 or above 1.
 * @returns The channel inside [0, 1].
 */
const clampChannel = (channel: number): number => Math.min(1, Math.max(0, channel));

/**
 * Compute a colour's WCAG 2.2 relative luminance, in closed form from OKLCh.
 *
 * OKLCh goes to OKLab (`a = C·cos h`, `b = C·sin h`), to LMS (each cubed), then to linear sRGB with
 * Björn Ottosson's OKLab matrices (https://bottosson.github.io/posts/oklab/), each channel clamped
 * to [0, 1]; the luminance weighs the linear channels. These coefficients, to ten decimals, are the
 * ones the spec's §4.1 contrast table was measured with, so the table's ratios hold to two
 * decimals.
 *
 * @param colour The colour to measure.
 * @returns Its relative luminance, from 0 (black) to 1 (white).
 */
export const relativeLuminance = (colour: Oklch): number => {
  const radians = (colour.hue * Math.PI) / 180;
  const a = colour.chroma * Math.cos(radians);
  const b = colour.chroma * Math.sin(radians);
  const l = (colour.lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (colour.lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (colour.lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = clampChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = clampChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = clampChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

/**
 * Compute the WCAG 2.2 contrast ratio between text and the surface under it.
 *
 * @param text The text's colour.
 * @param surface The colour behind the text.
 * @returns `(L1 + 0.05) / (L2 + 0.05)`, the lighter luminance over the darker, from 1 to 21; the
 *   order of the arguments does not change it.
 */
export const contrastRatio = (text: Oklch, surface: Oklch): number => {
  const textLuminance = relativeLuminance(text);
  const surfaceLuminance = relativeLuminance(surface);

  return (
    (Math.max(textLuminance, surfaceLuminance) + 0.05) /
    (Math.min(textLuminance, surfaceLuminance) + 0.05)
  );
};
