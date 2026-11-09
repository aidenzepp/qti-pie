/**
 * The kinds generator: the `NodeKind` and `AttributeName` rosters, the `IsElement` and
 * `Interaction` sets over `NodeKind`, and the closed relations between an element's XML name and
 * its kind, as rows of handles (fin.md §17), from a list of vocabularies.
 *
 * Each relation is fixed when the schema compiles. The rosters and the two sets erase to the
 * constants the document layer reads (`Node.elements` and `Node.parentIsInteraction` derive from
 * the sets, plan §1.3). The name relations are the host's, for shredding an element into its kind
 * and rendering a kind back into its name; no law reads them, so none is installed.
 */
import { Option } from "effect";
import { closed, idField, indexed, roster, valueField } from "#pantry/grammar/closed.ts";
import { spelledNamespace } from "#pantry/vocab/namespaces.ts";
import type { Nameless, NamespaceClass, NamespaceName } from "#pantry/vocab/namespaces.ts";
import type { IdField, Indexed, Roster, ValueField } from "#pantry/grammar/closed.ts";

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
 * One kind of a vocabulary: its handle, and the local name of its element, empty for a kind that
 * is no element (character data).
 */
export interface VocabularyKind {
  readonly handle: string;
  readonly local: string;
}

/**
 * A kind that names no element, as every kind of a {@link Nameless} vocabulary does.
 */
export interface NamelessKind extends VocabularyKind {
  readonly local: "";
}

/**
 * A vocabulary as the kinds generator reads it: the namespace its elements are in, its node kinds
 * in append-only order, and the attribute names it introduces.
 *
 * A kind with a local name is an element kind, written with that name in the vocabulary's
 * namespace, or in none where the vocabulary is `absent`. A kind with an empty local name names no
 * element, as character data does. A layer of kinds that name no element, such as character data
 * or the document layer, is `nameless`: it has no namespace, since it writes no element.
 */
export type Vocabulary =
  | {
      readonly attributes: readonly string[];
      readonly kinds: readonly NamelessKind[];
      readonly namespace: Nameless;
    }
  | {
      readonly attributes: readonly string[];
      readonly kinds: readonly VocabularyKind[];
      readonly namespace: NamespaceName;
    };

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

/**
 * The `NodeKind` handles a vocabulary list generates: the fixed kinds and every vocabulary's kinds.
 */
export type KindOf<V extends readonly Vocabulary[]> =
  | V[number]["kinds"][number]["handle"]
  | (typeof fixedKinds)[number];

/**
 * The `AttributeName` handles a vocabulary list generates: the open classes, the layer's names and
 * every vocabulary's names.
 */
export type NameOf<V extends readonly Vocabulary[]> =
  | V[number]["attributes"][number]
  | (typeof openClasses)[number];

/**
 * A set over `NodeKind`: one bit per kind, set for each kind it holds.
 */
export type KindSet<Kind extends string> = Indexed<readonly [IdField<"kind", Kind>], readonly []>;

/**
 * The closed relations of kinds and attribute names one vocabulary list generates.
 *
 * A roster is the set of its live codes (fin.md §17), every handle live, so its constant is one
 * bit per handle; its key field is the code space every relation keyed by that roster ranges
 * over, in code order.
 */
export interface Kinds<Kind extends string, Name extends string> {
  /**
   * The `AttributeName` roster: {@link openClasses}, `xsi:schemaLocation`, `xml:space`, `xml:id`,
   * `xsi:type`, `xsi:nil` and `xsi:noNamespaceSchemaLocation`, then every vocabulary's attribute
   * names in composition order, a name listed twice held once, at its first.
   */
  readonly attributeName: Roster<Name>;
  /**
   * `KindByNameUnder`: (namespace, local, parent) → kind, each element kind a parent admits by its
   * name, which {@link Kinds.resolve} reads. It is the host's alone: no law reads it, so grizzle
   * never declares it, and the tests over a composition check its rows (`faultOf`).
   */
  readonly byName: KindByNameUnder<Kind>;
  /**
   * `ElementName`: the namespace name and local name each element kind is written with, as crust's
   * tree spells them (`spelledNamespace`), since the codec reads and writes names against them.
   */
  readonly elementName: Indexed<
    readonly [IdField<"kind", Kind>],
    readonly [ValueField<"namespace", string>, ValueField<"local", string>]
  >;
  /**
   * `Interaction`: the interaction kinds. A node whose parent is one takes that parent as its
   * nearest interaction (plan §1.3, N8).
   */
  readonly interaction: KindSet<Kind>;
  /**
   * `IsElement`: the kinds that are elements: the foreign kinds, then the key set of
   * `ElementName`.
   */
  readonly isElement: KindSet<Kind>;
  /**
   * The `NodeKind` roster: {@link fixedKinds}, then every vocabulary's kinds in composition order.
   */
  readonly nodeKind: Roster<Kind>;
  /**
   * Find the kind an element is, from its name and its parent's kind.
   *
   * A name resolves by locality (XML Schema Part 1, §3.3.2, §3.10.4): to the kind its parent's
   * content model declares with it, else to the kind a top-level declaration gives it, which is
   * what the root and a wildcard read, else to none, an element no declaration names there. The
   * root element's parent is the document node, of kind `document`.
   *
   * @param namespace - The element's namespace name, empty when it has none.
   * @param local - The element's local name.
   * @param parent - The kind of the element's parent.
   * @returns The element's kind, or none when no vocabulary names that element under that
   * parent.
   */
  readonly resolve: (namespace: string, local: string, parent: Kind) => Option.Option<Kind>;
  /**
   * The `SchemaVersion` roster.
   */
  readonly versions: Roster<SchemaVersion>;
}

/**
 * Collect a vocabulary's kinds in their declared order.
 *
 * @param vocabulary - The vocabulary.
 * @returns Its kinds, typed as the handles of the list it belongs to.
 */
const kindsIn = <V extends readonly Vocabulary[]>(
  vocabulary: V[number],
): readonly V[number]["kinds"][number]["handle"][] => vocabulary.kinds.map(({ handle }) => handle);

/**
 * Collect the attribute names a vocabulary introduces, in their declared order.
 *
 * @param vocabulary - The vocabulary.
 * @returns Its names, typed as the names of the list it belongs to.
 */
const namesIn = <V extends readonly Vocabulary[]>(
  vocabulary: V[number],
): readonly V[number]["attributes"][number][] => vocabulary.attributes;

/**
 * Read the element kinds of a vocabulary list with the names they are written with: each kind with
 * a local name of a namespaced vocabulary, its local name and its namespace as crust's tree spells
 * it (`spelledNamespace`). A nameless vocabulary's kinds name no element. `ElementName`'s rows are
 * these, and the names a document is written under (`#pantry/model/names.ts`) are read off them
 * with no composition.
 *
 * @param vocabularies - The vocabularies, in composition order.
 * @returns Each element kind and its name, in the vocabularies' order.
 */
export const elementsOf = <Kind extends string>(
  vocabularies: readonly {
    readonly kinds: readonly { readonly handle: Kind; readonly local: string }[];
    readonly namespace: Nameless | NamespaceName;
  }[],
): readonly {
  readonly handle: Kind;
  readonly row: { readonly local: string; readonly namespace: string };
}[] =>
  vocabularies.flatMap(({ kinds, namespace }) =>
    namespace._tag === "nameless"
      ? []
      : kinds
          .filter(({ local }) => local !== "")
          .map(({ handle, local }) => ({
            handle,
            row: { local, namespace: spelledNamespace(namespace) },
          })),
  );

/**
 * Generate the kind and name relations of a vocabulary list.
 *
 * A code is a handle's position in its roster, and a roster's handles only append (grizzle's D1,
 * fin.md §12: a reorder is refused). So the handles the generator adds itself come first, and a
 * vocabulary appended to the list appends its kinds and names, leaving every earlier code where it
 * was.
 *
 * @param source - What the relations are generated from.
 * @param source.interactions - The interaction kinds.
 * @param source.layer - The attribute names the document layer admits on kinds no vocabulary
 *   declares them for, XML Schema's `xsi:` names and `xml.xsd`'s `xml:` names: every roster holds
 *   them, after the open classes, at the same codes.
 * @param source.vocabularies - The vocabularies, in composition order.
 * @returns The relations. A kind two vocabularies declare, or an attribute name a vocabulary shares
 *   with an open class, is a roster's fault (`repeatOf`), and an interaction listed twice or
 *   outside `NodeKind` a fault of `Interaction`'s rows (`faultOf`): the tests find both, and
 *   grizzle refuses both.
 */
export const generate = <const V extends readonly Vocabulary[]>(source: {
  readonly interactions: readonly KindOf<V>[];
  readonly layer: readonly NameOf<V>[];
  readonly vocabularies: V;
}): KindRosters<KindOf<V>, NameOf<V>> => {
  const { vocabularies } = source;
  const versions = roster("SchemaVersion", schemaVersions);
  const nodeKind = roster("NodeKind", [...fixedKinds, ...vocabularies.flatMap(kindsIn<V>)]);
  const attributeName = roster("AttributeName", [
    ...openClasses,
    ...new Set([...source.layer, ...vocabularies.flatMap(namesIn<V>)]),
  ]);
  const elements = elementsOf<KindOf<V>>(vocabularies);
  const kind = idField("kind", nodeKind);
  const elementName = indexed(
    closed({
      key: [kind],
      name: "ElementName",
      payload: [
        valueField(
          "namespace",
          elements.map(({ row }) => row.namespace),
        ),
        valueField(
          "local",
          elements.map(({ row }) => row.local),
        ),
      ],
      rows: elements.map(({ handle, row }) => ({
        kind: handle,
        local: row.local,
        namespace: row.namespace,
      })),
    }),
  );
  const isElement = indexed(
    closed({
      key: [kind],
      name: "IsElement",
      payload: [],
      rows: [
        foreignKinds.other,
        foreignKinds.absent,
        foreignKinds.own,
        ...elements.map(({ handle }) => handle),
      ].map((handle) => ({
        kind: handle,
      })),
    }),
  );
  const interaction = indexed(
    closed({
      key: [kind],
      name: "Interaction",
      payload: [],
      rows: source.interactions.map((handle) => ({ kind: handle })),
    }),
  );

  return {
    attributeName,
    elementName,
    interaction,
    isElement,
    nodeKind,
    versions,
  };
};

/**
 * The kind relations of a vocabulary list before the content grammar: every one but `byName` and
 * the `resolve` that reads it, which read what each parent admits ({@link resolution}).
 */
export type KindRosters<Kind extends string, Name extends string> = Omit<
  Kinds<Kind, Name>,
  "byName" | "resolve"
>;

/**
 * `KindByNameUnder`: (namespace, local, parent) → kind, the relation {@link resolution} reads a
 * name's kind from. Its kind payload is an id field over the `NodeKind` roster, so `closed` refuses
 * a row whose kind is outside it, and a row's kind is a `Kind` by its type.
 */
export type KindByNameUnder<Kind extends string> = Indexed<
  readonly [IdField<"namespace", string>, IdField<"local", string>, IdField<"parent", string>],
  readonly [IdField<"kind", Kind>]
>;

/**
 * Add name resolution to a composition's kinds: `KindByNameUnder`, (namespace, local, parent) →
 * kind, for every element kind each parent admits.
 *
 * A name resolves by locality (XML Schema Part 1, §3.3.2, §3.10.4): an element particle of the
 * parent's model declares it, or a wildcard of the model finds its top-level declaration, and
 * either way the parent admits that kind. So resolution is read off admission: a name resolves
 * under a parent to the element kind the parent admits with that name, and to none where it
 * admits none, as for an element no declaration names there. The root's parent is the document
 * node, whose model names the root kinds.
 *
 * @param kinds - The composition's kinds.
 * @param admitted - Each parent and a kind it admits, in any version.
 * @returns The kinds with `resolve`, and the relation it reads. Two kinds of one name that one
 *   parent admits, and a parent the roster lacks, are faults of
 *   `KindByNameUnder`'s rows (`faultOf`), which the tests find: grizzle never sees the relation,
 *   which is the host's alone.
 */
export const resolution = <Kind extends string, Name extends string>(
  kinds: KindRosters<Kind, Name>,
  admitted: readonly { readonly child: string; readonly parent: string }[],
): Kinds<Kind, Name> => {
  const anyKind: Roster<string> = kinds.nodeKind;
  // The child is read back from its `ElementName` row, whose key is a `NodeKind` handle, so each
  // row's kind is a `Kind` by its type, as the payload below needs.
  const named = [
    ...new Map(
      admitted.flatMap(({ child, parent }) =>
        Option.toArray(kinds.elementName.lookup({ kind: child })).map(
          ({ kind, local, namespace }) =>
            [
              `${namespace} ${local} ${parent} ${kind}`,
              { kind, local, namespace, parent },
            ] as const,
        ),
      ),
    ).values(),
  ];
  // The payload ranges over the `NodeKind` roster itself, so a resolved kind is a `Kind` by
  // construction and `resolve` needs no test of it. The annotation is the guard: a payload over
  // a wider roster (`anyKind`) is no `KindByNameUnder<Kind>`, and `tsc` refuses it.
  const under: KindByNameUnder<Kind> = indexed(
    closed({
      key: [
        idField(
          "namespace",
          roster("Namespace", [...new Set(named.map(({ namespace }) => namespace))]),
        ),
        idField("local", roster("LocalName", [...new Set(named.map(({ local }) => local))])),
        idField("parent", anyKind),
      ],
      name: "KindByNameUnder",
      payload: [idField("kind", kinds.nodeKind)],
      rows: named,
    }),
  );

  return {
    ...kinds,
    byName: under,
    resolve: (namespaceName: string, localName: string, parentKind: Kind) =>
      under
        .lookup({ local: localName, namespace: namespaceName, parent: parentKind })
        .pipe(Option.map(({ kind }) => kind)),
  };
};
