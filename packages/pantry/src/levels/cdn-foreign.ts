/**
 * The foreign-markup rule, `<Level>Foreign`, which the single-CDN level states as `CdnForeign` and
 * the package-media level as `MediaForeign`, stated once, here, under each level's name
 * ({@link foreignRule}): no markup pantry keeps but cannot
 * interpret, which could carry an address no other rule reads. No foreign element, of any of the
 * three namespace classes (`foreignKinds` of `#pantry/grammar/kinds.ts`), and no attribute of an
 * open class but `data-*`, so no `foreign`, `no-namespace` or `own-namespace` attribute. A `data-*`
 * attribute is kept: HTML gives it no meaning and no user agent fetches from it.
 *
 * The rule is stated at a level above `Qti` (`singleCdn`, `#pantry/levels/cdn.ts`, and
 * `packageMedia`, `#pantry/levels/media.ts`), never as a law of `Qti`: two derived relations over
 * `Qti` select the markup it refuses, each with the class or kind that makes it so, and a check
 * named for the level over each holds of no row they select. A check over a
 * derived relation is a deferred trigger on each table its query reads, so a `Qti` write meets it
 * at commit and a process over `Qti` alone compiles none of it.
 *
 * @see {@link https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes | HTML, custom data attributes}
 * @see https://github.com/bjornpagen/grizzle/blob/89e94c040262c587065e84df42829a2f12d9f0c3/README.md#L1866-L1950
 */
import { check, derived, query, v } from "@bjornpagen/grizzle";
import { Record as Rec } from "effect";
import { foreignKinds, openClasses } from "#pantry/grammar/kinds.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Node } from "#pantry/qti/node.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * The open attribute classes the rule refuses: every class but `data-*`.
 */
export const uninterpretedClasses = openClasses.filter((name) => name !== "data-*");

/**
 * The element kinds the rule refuses: a foreign element of each namespace class.
 */
export const foreignElementKinds = Object.values(foreignKinds);

/**
 * Select, over a base level, the attributes of an uninterpreted open class: each `(node, id)` with
 * its class as `name`.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const foreignAttributesOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { id, name, node } = v(Attribute, "attribute");

    return r
      .match(Attribute, { id, name, node })
      .where(r.inSet(name, uninterpretedClasses))
      .find({ id, name, node });
  });

/**
 * Select, over a base level, the foreign elements: each node of a foreign kind, with its kind.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const foreignElementsOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { id, kind } = v(Node, "node");

    return r.match(Node, { id, kind }).where(r.inSet(kind, foreignElementKinds)).find({ id, kind });
  });

/**
 * Build the foreign-markup rule for one base level and one level's name: the derived relations over
 * the base it judges, each named for the level, and a check named `<level>Foreign` over each, whose
 * condition, that the row's class or kind is not one the rule refuses, no row the relation selects
 * meets, so every such row is refused.
 *
 * - `<level>ForeignAttribute`: the attributes of an open class but `data-*`;
 * - `<level>ForeignElement`: the foreign elements.
 *
 * @param base - The level the derived relations read, pantry's `Qti`.
 * @param level - The name of the level that states the rule, `Cdn` or `Media`, which starts the
 *   name of each relation and of the check.
 * @returns The relations and statements the rule adds to that level.
 */
export const foreignRule = <const Level extends string>(base: QtiSchema, level: Level) => {
  const foreignAttribute = derived(`${level}ForeignAttribute`, foreignAttributesOf(base));
  const foreignElement = derived(`${level}ForeignElement`, foreignElementsOf(base));
  const name = `${level}Foreign` as const;

  return {
    relations: {
      ...Rec.singleton(foreignAttribute.name, foreignAttribute),
      ...Rec.singleton(foreignElement.name, foreignElement),
    },
    statements: [
      check(name, foreignAttribute, (f) => f.not(f.in(f.name, uninterpretedClasses))),
      check(name, foreignElement, (f) => f.not(f.in(f.kind, foreignElementKinds))),
    ] as const,
  };
};
