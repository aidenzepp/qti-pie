/**
 * The single-CDN level's foreign-markup rule, `CdnForeign`: no markup pantry keeps but cannot
 * interpret, which could carry an address no other rule reads. No foreign element, of any of the
 * three namespace classes (`foreignKinds` of `#pantry/grammar/kinds.ts`), and no attribute of an
 * open class but `data-*`, so no `foreign`, `no-namespace` or `own-namespace` attribute. A `data-*`
 * attribute is kept: HTML gives it no meaning and no user agent fetches from it.
 *
 * The rule is stated at the `Cdn` level (`singleCdn`, `#pantry/levels/cdn.ts`), never as a law of
 * `Qti`: two derived relations over `Qti` select the markup it refuses, each with the class or kind
 * that makes it so, and a `CdnForeign` check over each holds of no row they select. A check over a
 * derived relation is a deferred trigger on each table its query reads, so a `Qti` write meets it
 * at commit and a process over `Qti` alone compiles none of it.
 *
 * @see {@link https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes | HTML, custom data attributes}
 * @see https://github.com/bjornpagen/grizzle/blob/89e94c040262c587065e84df42829a2f12d9f0c3/README.md#L1866-L1950
 */
import { check, derived, query, v } from "@bjornpagen/grizzle";
import { foreignKinds, openClasses } from "#pantry/grammar/kinds.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Node } from "#pantry/qti/node.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * The open attribute classes the rule refuses: every class but `data-*`.
 */
const uninterpretedClasses = openClasses.filter((name) => name !== "data-*");

/**
 * The element kinds the rule refuses: a foreign element of each namespace class.
 */
const foreignElementKinds = Object.values(foreignKinds);

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
 * Build the foreign-markup rule for one base level: the derived relations over the base it judges,
 * by name, and a `CdnForeign` check over each, whose condition, that the row's class or kind is not
 * one the rule refuses, no row the relation selects meets, so every such row is refused.
 *
 * - `CdnForeignAttribute`: the attributes of an open class but `data-*`;
 * - `CdnForeignElement`: the foreign elements.
 *
 * @param base - The level the derived relations read, pantry's `Qti`.
 * @param _origin - The origin the CDN serves, as the level's options hold it; the rule reads none.
 * @returns The relations and statements the rule adds to the `Cdn` level.
 */
export const cdnForeignRule = (base: QtiSchema, _origin: string) => {
  const CdnForeignAttribute = derived("CdnForeignAttribute", foreignAttributesOf(base));
  const CdnForeignElement = derived("CdnForeignElement", foreignElementsOf(base));

  return {
    relations: { CdnForeignAttribute, CdnForeignElement },
    statements: [
      check("CdnForeign", CdnForeignAttribute, (f) => f.not(f.in(f.name, uninterpretedClasses))),
      check("CdnForeign", CdnForeignElement, (f) => f.not(f.in(f.kind, foreignElementKinds))),
    ] as const,
  };
};
