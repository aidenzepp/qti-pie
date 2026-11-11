/**
 * The kinds every composition holds whatever its vocabularies: the `SchemaVersion` handles, the
 * foreign element kinds, the fixed kinds the document layer adds before every vocabulary's, and
 * the open attribute classes, each a handle constant the document layer reads as it is. The
 * generator of the rosters and sets over them, which reads the vocabularies, is
 * `#pantry/grammar/rosters.ts`; a reader of handles alone, the export's render among them, loads
 * no closed relation through this module.
 */
import type { NamespaceClass } from "#pantry/vocab/namespaces.ts";

/**
 * The QTI schema versions the model admits, in code order: the `SchemaVersion` roster's handles,
 * spelled once. A version is the first key digit of every relation that differs by version
 * (fin.md P4), and a version a later schema adds appends here.
 */
export const schemaVersions = ["3.0.0", "3.0.1"] as const;

/**
 * A `SchemaVersion` handle.
 */
export type SchemaVersion = (typeof schemaVersions)[number];

/**
 * The element kind of a foreign element, by its namespace class relative to its parent's namespace
 * (`namespaceClassOf`, XML Schema Part 1 §3.10.1's namespace constraint): `foreign-element` in a
 * namespace other than its parent's, `no-namespace-element` in none, `own-namespace-element` in its
 * parent's.
 *
 * A foreign element is an element that an element wildcard admits and no declaration names, such
 * as a PCI's own markup under `qti-custom-interaction`. Its kind is its class whatever its name,
 * which it keeps beside its kind (`OpenElementName`, plan Q3.03), so it is an element with no
 * `ElementName` row and no name resolves to it. A wildcard admits the classes its constraint does,
 * so a child the constraint refuses is refused by the content law.
 */
export const foreignKinds = {
  absent: "no-namespace-element",
  other: "foreign-element",
  own: "own-namespace-element",
} as const satisfies Readonly<Record<NamespaceClass, string>>;

/**
 * The kind of a foreign element of some namespace class.
 */
export type ForeignKind = (typeof foreignKinds)[NamespaceClass];

/**
 * Whether a kind is a foreign element's, of any namespace class.
 *
 * @param kind - A `NodeKind` handle.
 * @returns Whether it is one of {@link foreignKinds}.
 */
export const isForeignKind = (kind: string): kind is ForeignKind =>
  kind === foreignKinds.other || kind === foreignKinds.absent || kind === foreignKinds.own;

/**
 * The kinds the document layer adds before every vocabulary's, so every generated `NodeKind` holds
 * them at the same codes: the document node, the one node at depth 0 (fin.md §12, entry 8); the
 * doctype, a child of the document node only; and the three foreign kinds ({@link foreignKinds}),
 * `foreign-element` first. No vocabulary declares any of them; the foreign kinds alone are
 * elements.
 */
export const fixedKinds = [
  "document",
  "doctype",
  foreignKinds.other,
  foreignKinds.absent,
  foreignKinds.own,
] as const;

/**
 * The `AttributeName` handles that each stand for a class of open names rather than one name
 * (fin.md, D2): `data-*` for an HTML custom data attribute, `foreign` for an attribute in a
 * namespace no vocabulary models, `no-namespace` for an undeclared attribute in no namespace, and
 * `own-namespace` for an attribute in its element's own namespace that no declaration names: each
 * class names its namespace, as the foreign element kinds do (`foreignKinds`). An
 * attribute under one keeps its exact name in `OpenAttributeName`, beside the handle. A class
 * appends, so earlier codes stay put.
 *
 * The data class is spelled `data-*`, the HTML standard's name for the class, because `data` is a
 * closed name already: HTML's `object` element has a `data` attribute, which the roster holds. `*`
 * is no XML name character, so no attribute is named `data-*`.
 *
 * @see {@link https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes | HTML, custom data attributes}
 */
export const openClasses = ["data-*", "foreign", "no-namespace", "own-namespace"] as const;
