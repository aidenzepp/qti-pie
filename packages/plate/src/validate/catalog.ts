/**
 * The catalog rules of R9-a ("The catalog sentences of the information model hold as written"),
 * which the XSD states neither of, as the qti package's `Card support` and `Card default entry`
 * laws hold them (`packages/pantry/src/qti/catalog.ts`):
 *
 * - A `qti-catalog` holds one `qti-card` per support: "Use only one card for any particular named
 *   support in a catalog" (§5.26.1, `info.txt:21097`).
 * - A `qti-card` holds at most one `qti-card-entry` designated default: "Only one of the CardEntry
 *   instances can have a default designation" (§5.27.2, `info.txt:21284`).
 *
 * A `support` is compared by its collapsed value (XML Schema's whiteSpace `collapse`), so
 * `" spoken "` and `spoken` name one support. An entry's `default` is an `xs:boolean`, which
 * designates where its collapsed value is `true` or `1`; `false`, `0` and an entry that writes no
 * `default` (the XSD's default, `false`) designate nothing.
 *
 * @module
 */
import { Option } from "effect";
import { attributePath, qtiNamespace, walk } from "#plate/document/source.ts";
import type { SourceAttribute, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { xmlWhitespaceRun, xsBooleanOf } from "#plate/model/attributes.ts";
import { trimXmlSpace } from "#plate/model/values.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
import { governingTables } from "#plate/validate/structure.ts";
import type { Tables } from "#plate/validate/xsd.ts";

/**
 * The line of QTI's information model that settles one card per support, which a `card-support`
 * refusal cites (R9-a has no number yet, and the line stays true when it gets one).
 */
const supportSource = "info.txt:21097";

/**
 * The line of QTI's information model that settles one default entry per card, which a
 * `card-default` refusal cites.
 */
const defaultSource = "info.txt:21284";

/**
 * Construct a refusal of the document at a path.
 *
 * @param source The document.
 * @param rule The rule it breaks.
 * @param path The element or attribute path.
 * @param detail The facts its wording reads.
 * @returns The refusal.
 */
const refuse = (
  source: SourceDocument,
  rule: RefusalRule,
  path: string,
  detail: Readonly<Record<string, string>>,
): Refusal =>
  new Refusal({
    detail,
    document: source.location,
    location: { kind: "path", path },
    readerRule: Option.none(),
    rule,
    suggestion: Option.none(),
  });

/**
 * Collapse a value's XML whitespace, as XSD's `whiteSpace="collapse"` does: each run becomes one
 * space, and a space at either end is removed.
 *
 * @param value The value as written.
 * @returns The collapsed value.
 */
const collapse = (value: string): string => trimXmlSpace(value).replaceAll(xmlWhitespaceRun, " ");

/**
 * Report whether an element is QTI's element of a local name.
 *
 * @param element The element.
 * @param local The local name.
 * @returns Whether `element` is the QTI element `local`.
 */
const isQti = (element: SourceElement, local: string): boolean =>
  element.namespace === qtiNamespace && element.local === local;

/**
 * Find an element's attribute in no namespace.
 *
 * @param element The element.
 * @param local The attribute's name.
 * @returns The attribute, or none when the element does not carry it.
 */
const attributeOf = (element: SourceElement, local: string): Option.Option<SourceAttribute> =>
  Option.fromUndefinedOr(
    element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === local),
  );

/**
 * Read an element's attribute collapsed, `""` where the element carries none: a catalog's `id` and
 * a card's `support` are required, so the structural walk refuses an element that lacks one.
 *
 * @param element The element.
 * @param local The attribute's name.
 * @returns The collapsed value.
 */
const collapsedAttribute = (element: SourceElement, local: string): string =>
  Option.match(attributeOf(element, local), {
    onNone: () => "",
    onSome: (attribute) => collapse(attribute.value),
  });

/**
 * Report whether a `qti-card-entry` designates itself its card's default: its `default`, read as
 * `xs:boolean`, is true.
 *
 * @param entry The entry.
 * @returns Whether it designates itself default.
 */
const designatesDefault = (entry: SourceElement): boolean =>
  Option.match(attributeOf(entry, "default"), {
    onNone: () => false,
    onSome: (attribute) => Option.getOrElse(xsBooleanOf(attribute.value), () => false),
  });

/**
 * Check a document's catalogs against R9-a's card rules, in document order:
 *
 * - A `qti-card` of a `qti-catalog` whose collapsed `support` an earlier card of that catalog gave is
 *   `duplicate-identifier`, `check: "card-support"`, at its `support`, with the `support` and the
 *   catalog's collapsed `id` as `catalog`. The same support in two catalogs is two supports.
 * - A `qti-card` holding two or more `qti-card-entry` children that designate themselves default is
 *   `child-count`, `check: "card-default"`, at the card, once, with its `support` and the `count`
 *   of such entries.
 *
 * A catalog stands in every root kind: `qti-catalog-info` is a child of an item, a stimulus, a PCI,
 * a rubric block, a template block, a feedback block, modal feedback and test feedback. It judges
 * as the other prose rules do: only the elements the structural walk checks, the keys of
 * `governingTables` (reading 57), and nothing in a document whose judged elements hold an
 * unexpanded entity reference, which the verdict leaves unchecked unless the structural walk
 * refuses it.
 *
 * @param source The document.
 * @param tables The tables generated from the QTI XSD.
 * @returns The refusals in document order, a card's support before its entries.
 */
export const checkCatalogs = (source: SourceDocument, tables: Tables): readonly Refusal[] => {
  const governing = governingTables(source, tables);
  const visits = [...walk(source)].filter((visit) => governing.has(visit.element));
  const unexpanded = visits.some(
    ({ element }) =>
      element.attributes.some((attribute) => attribute.references.length > 0) ||
      element.children.some((child) => child.kind === "entity"),
  );
  if (unexpanded) {
    return [];
  }

  const supports = new Map<SourceElement, Set<string>>();
  const refusals: Refusal[] = [];
  for (const { element, parent, path } of visits) {
    if (!isQti(element, "qti-card")) {
      continue;
    }

    const support = collapsedAttribute(element, "support");
    const supportAttribute = attributeOf(element, "support");
    if (
      Option.isSome(parent) &&
      isQti(parent.value, "qti-catalog") &&
      Option.isSome(supportAttribute)
    ) {
      const seen = supports.get(parent.value) ?? new Set<string>();
      supports.set(parent.value, seen);
      if (seen.has(support)) {
        refusals.push(
          refuse(source, "duplicate-identifier", attributePath(path, supportAttribute.value), {
            catalog: collapsedAttribute(parent.value, "id"),
            check: "card-support",
            source: supportSource,
            support,
          }),
        );
      }

      seen.add(support);
    }

    const defaults = element.children.filter(
      (child): child is SourceElement =>
        child.kind === "element" &&
        isQti(child, "qti-card-entry") &&
        governing.has(child) &&
        designatesDefault(child),
    ).length;
    if (defaults > 1) {
      refusals.push(
        refuse(source, "child-count", path, {
          check: "card-default",
          count: `${defaults}`,
          element: element.local,
          source: defaultSource,
          support,
        }),
      );
    }
  }

  return refusals;
};
