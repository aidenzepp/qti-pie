/**
 * The single-CDN level's style rule, `CdnStyle`: no `style` attribute holds CSS that makes the
 * player fetch.
 *
 * The rule is stated at the `Cdn` level (`singleCdn`, `#pantry/levels/cdn.ts`) as derived
 * relations over `Qti` and checks over them, never as a law of `Qti` itself.
 */
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * Build the style rule for one base level and origin: the derived relations over the base it
 * judges, by name, and the checks over them. It states none yet.
 *
 * @param _base - The level the derived relations read, pantry's `Qti`.
 * @param _origin - The origin the CDN serves, as the level's options hold it.
 * @returns The relations and statements the rule adds to the `Cdn` level.
 */
export const cdnStyleRule = (_base: QtiSchema, _origin: string) => ({
  relations: {},
  statements: [],
});
