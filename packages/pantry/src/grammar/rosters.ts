/**
 * The kinds generator: the `NodeKind` and `AttributeName` rosters, the `IsElement` and
 * `Interaction` sets over `NodeKind`, and the closed relation between an element kind and its XML
 * name (`ElementName`), as rows of handles (fin.md §17), from a list of vocabularies, with the
 * resolution of a name under a parent that reads it. The handles every list holds are
 * `#pantry/grammar/kinds.ts`'s.
 *
 * Each relation is fixed when the schema compiles. The rosters and the two sets erase to the
 * constants the document layer reads (`Node.elements` and `Node.parentIsInteraction` derive from
 * the sets, plan §1.3). The names are the host's, for shredding an element into its kind; no law
 * reads them, so they are not installed.
 */
import { Array as Arr } from "effect";
import type { Option } from "effect";
import { closed, idField, indexed, roster, valueField } from "#pantry/grammar/closed.ts";
import type { IdField, Indexed, Roster, ValueField } from "#pantry/grammar/closed.ts";
import { fixedKinds, foreignKinds, openClasses, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { spelledNamespace } from "#pantry/vocab/namespaces.ts";
import type { Nameless, NamespaceName } from "#pantry/vocab/namespaces.ts";

/**
 * One kind of a vocabulary: its handle, and the local name of its element, empty for a kind that
 * is no element (character data).
 */
interface VocabularyKind {
  readonly handle: string;
  readonly local: string;
}

/**
 * A kind that names no element, as every kind of a {@link Nameless} vocabulary does.
 */
interface NamelessKind extends VocabularyKind {
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
type KindSet<Kind extends string> = Indexed<readonly [IdField<"kind", Kind>], readonly []>;

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
 * these. A document is written under the names its kinds' handles spell instead
 * (`elementNameOf` of `#pantry/model/names.ts`), which loads no vocabulary, and its test holds
 * every roster kind's handle to the row read here.
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
 * The kind relations of a vocabulary list before the content grammar: every one but `resolve`,
 * which reads what each parent admits ({@link resolution}).
 */
type KindRosters<Kind extends string, Name extends string> = Omit<Kinds<Kind, Name>, "resolve">;

/**
 * Add name resolution to a composition's kinds: `resolve`, from an element's expanded name and its
 * parent's kind to the element kind the parent admits with that name.
 *
 * A name resolves by locality (XML Schema Part 1, §3.3.2, §3.10.4): an element particle of the
 * parent's model declares it, or a wildcard of the model finds its top-level declaration, and
 * either way the parent admits that kind. So resolution is read off admission: a name resolves
 * under a parent to the element kind of that name the parent admits, and to none where it admits
 * none, as for an element no declaration names there. The root's parent is the document node,
 * whose model names the root kinds. A name's kinds are few, so `resolve` reads its candidates, the
 * element kinds `ElementName` writes with it, and asks the parent's admission of each, in
 * `NodeKind` code order; no relation of (name, parent) is built. A parent admits at most one kind
 * of a name, as XML Schema's Element Declarations Consistent requires of a content model
 * (§3.8.6), which the composition's tests hold (`compose.test.ts`).
 *
 * @param kinds - The composition's kinds.
 * @param admits - Whether a parent admits a kind as a child in some version: the content
 *   grammar's admission maps.
 * @returns The kinds with `resolve`.
 */
export const resolution = <Kind extends string, Name extends string>(
  kinds: KindRosters<Kind, Name>,
  admits: (parent: string, kind: Kind) => boolean,
): Kinds<Kind, Name> => {
  // Each expanded name's element kinds, by namespace and then local name, in code order. The kind
  // is `ElementName`'s key, a `NodeKind` handle, so a resolved kind is a `Kind` by its type.
  const candidates = new Map<string, Map<string, Kind[]>>();
  for (const { kind, local, namespace } of kinds.elementName.rows) {
    candidates
      .getOrInsertComputed(namespace, () => new Map())
      .getOrInsertComputed(local, () => [])
      .push(kind);
  }

  return {
    ...kinds,
    resolve: (namespaceName: string, localName: string, parentKind: Kind) =>
      Arr.findFirst(candidates.get(namespaceName)?.get(localName) ?? [], (kind) =>
        admits(parentKind, kind),
      ),
  };
};
