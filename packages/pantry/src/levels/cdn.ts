/**
 * The single-CDN level, {@link singleCdn}: a level over pantry's `Qti` whose laws refuse a package
 * that would make a player fetch from anywhere but one CDN's origin.
 *
 * The level is refuse-only by construction: `schema.extend` adds relations and laws over its base
 * and takes none of the base's away, so a package the level accepts is one `Qti` accepts (GOAL G4).
 * Its four rules are policy, not QTI: they live outside `docs/spec-readings.md` and pantry's law
 * table, each in a module of its own, stated as derived relations over `Qti` and checks over them
 * (GOAL L3). A refusal by one of them names level `Cdn` and the check's name: `CdnOrigin`,
 * `CdnData`, `CdnStyle` or `CdnForeign`.
 */
import { schema } from "@bjornpagen/grizzle";
import { Schema } from "effect";
import { cdnDataRule } from "#pantry/levels/cdn-data.ts";
import { cdnForeignRule } from "#pantry/levels/cdn-foreign.ts";
import { cdnOriginRule } from "#pantry/levels/cdn-origin.ts";
import { cdnStyleRule } from "#pantry/levels/cdn-style.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * The origin every address a player fetches starts with: an `https://` URL of one host, its port
 * where it names one, and the root path, `/`, as the URL Standard serializes it, so the text an
 * author writes before the path is exactly this one. A host is lowercase letters, digits and inner
 * hyphens and dots, so the origin holds no character a pattern reads as an operator but the dot.
 *
 * @see {@link https://url.spec.whatwg.org/#concept-url-serializer | URL Standard, URL serializing}
 */
export const CdnOrigin = Schema.String.check(
  Schema.isPattern(/^https:\/\/[a-z0-9]+(?:[.-][a-z0-9]+)*(?::[0-9]{1,5})?\/$/u, {
    message:
      "Use an https:// origin and the root path, such as https://cdn.example.com/: a lowercase host, an optional port, and one slash after it",
  }),
  Schema.makeFilter(
    (origin: string) => URL.canParse(origin) && `${new URL(origin).origin}/` === origin,
    {
      message:
        "Write the origin as the URL Standard serializes it: a port is a number from 1 to 65535, and the default port 443 is left out",
    },
  ),
);

/**
 * The options {@link singleCdn} builds the level with: the CDN's origin. Decode a caller's
 * options with it before building the level; {@link singleCdn} itself trusts its argument.
 */
export const CdnOptions = Schema.Struct({ origin: CdnOrigin });

/**
 * Extend a base level with the `Cdn` level for one origin: the four rules' derived relations,
 * by name, and their checks.
 *
 * @param base - The level the rules read, pantry's `Qti`.
 * @param origin - The CDN's origin.
 * @returns The `Cdn` level over the base.
 */
const buildCdn = (base: QtiSchema, origin: string) => {
  const rules = {
    data: cdnDataRule(base, origin),
    foreign: cdnForeignRule(base, origin),
    origin: cdnOriginRule(base, origin),
    style: cdnStyleRule(base, origin),
  };

  return schema.extend(
    base,
    "Cdn",
    {
      ...rules.origin.relations,
      ...rules.data.relations,
      ...rules.style.relations,
      ...rules.foreign.relations,
    },
    [
      ...rules.origin.statements,
      ...rules.data.statements,
      ...rules.style.statements,
      ...rules.foreign.statements,
    ],
  );
};

/**
 * The single-CDN level, as {@link singleCdn} returns it: a level over `Qti` that an application's
 * own level may extend.
 */
export type CdnLevel = ReturnType<typeof buildCdn>;

/**
 * The levels {@link singleCdn} has built, by base and then by origin.
 */
const built = new WeakMap<QtiSchema, Map<string, CdnLevel>>();

/**
 * Build the single-CDN level over a base level, once per base and origin: the same base and origin
 * give the same level value, so every level built over it meets one schema.
 *
 * @param base - The level the CDN rules read, pantry's `Qti` (`qti()`).
 * @param options - The level's options, decoded with {@link CdnOptions}.
 * @returns The `Cdn` level over the base.
 */
export const singleCdn = (base: QtiSchema, options: typeof CdnOptions.Type): CdnLevel => {
  const byOrigin = built.get(base) ?? new Map<string, CdnLevel>();
  built.set(base, byOrigin);

  const known = byOrigin.get(options.origin);
  if (known !== undefined) {
    return known;
  }

  const level = buildCdn(base, options.origin);
  byOrigin.set(options.origin, level);

  return level;
};
