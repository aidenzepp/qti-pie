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
import { Option, Order, Result } from "effect";
import { closed, dictionary } from "#pantry/grammar/closed.ts";
import type { Closed, ClosedRelationError, Field } from "#pantry/grammar/closed.ts";
import type { kinds as asiKinds } from "#pantry/schema/kinds/asi.ts";
import type { RegistryRow } from "#pantry/schema/kinds/generic.ts";

/**
 * A vocabulary as the kinds generator reads it: its node kinds in append-only order, the attribute
 * names it introduces, and the registry row of each of its kinds.
 *
 * A kind whose registry row has a local name is an element kind, written with that name in the
 * row's namespace. A row with an empty local name names no element, as the generic vocabulary's
 * character-data kinds' rows do.
 */
export interface Vocabulary {
  readonly attributes: readonly string[];
  readonly kinds: readonly string[];
  readonly registry: Readonly<Record<string, RegistryRow>>;
}

/**
 * The kinds the document layer adds before every vocabulary's: the document node, the one node at
 * depth 0 (fin.md §12, entry 8), and the doctype, a child of the document node only. No vocabulary
 * declares either, and neither is an element.
 */
const documentKinds = ["document", "doctype"] as const;

/**
 * The attribute names the document layer adds before its vocabularies' names: `xsi:schemaLocation`
 * is an ordinary attribute, its handle spelling its qualified name as `xml:lang`'s does (plan
 * §1.4), and no registry lists it.
 */
const layerNames = ["xsi:schemaLocation"] as const;

/**
 * The `AttributeName` handles that each stand for a class of open names rather than one name
 * (fin.md, D2): `data-*` for an HTML custom data attribute, `foreign` for an attribute in a
 * namespace no vocabulary models, and `lax` for a no-namespace attribute a lax wildcard admits. An
 * attribute under one keeps its exact name in `OpenAttributeName`, beside the handle.
 *
 * The data class is spelled `data-*`, the HTML standard's name for the class, because `data` is a
 * closed name already: HTML's `object` element has a `data` attribute, which the roster holds. `*`
 * is no XML name character, so no attribute is named `data-*`.
 *
 * @see {@link https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes | HTML, custom data attributes}
 */
export const openClasses = ["data-*", "foreign", "lax"] as const;

/**
 * Today's 20 interaction kinds, all of the ASI vocabulary: the `Interaction` set's rows. Each
 * enters the `int` flag and carries the interaction bans, which the ancestry grammar reads from
 * this set, so a vocabulary that adds an interaction adds it here.
 */
export const interactions = [
  "qti-choice-interaction",
  "qti-order-interaction",
  "qti-associate-interaction",
  "qti-match-interaction",
  "qti-gap-match-interaction",
  "qti-inline-choice-interaction",
  "qti-text-entry-interaction",
  "qti-extended-text-interaction",
  "qti-hottext-interaction",
  "qti-hotspot-interaction",
  "qti-select-point-interaction",
  "qti-graphic-order-interaction",
  "qti-graphic-associate-interaction",
  "qti-graphic-gap-match-interaction",
  "qti-position-object-interaction",
  "qti-slider-interaction",
  "qti-drawing-interaction",
  "qti-media-interaction",
  "qti-upload-interaction",
  "qti-end-attempt-interaction",
] as const satisfies readonly (typeof asiKinds)[number][];

/**
 * The parents, beside the one its registry row names, under which a dotted kind's element name
 * resolves to it in today's vocabularies.
 *
 * A registry row names one parent kind, and LOM's `Duration` type is the type of both
 * `lom:duration` and `lom:typicalLearningTime`, so its `CharacterString` child `duration` is
 * `lom:duration.string` under either. This is vocabulary data: it belongs with the LOM
 * vocabulary's registry, and a composition passes it to {@link generate}.
 */
export const alsoUnder: ReadonlyMap<string, readonly string[]> = new Map([
  ["lom:duration.string", ["lom:typicalLearningTime"]],
]);

/**
 * The `NodeKind` handles a vocabulary list generates: the document kinds and every vocabulary's
 * kinds.
 */
export type KindOf<V extends readonly Vocabulary[]> =
  | V[number]["kinds"][number]
  | (typeof documentKinds)[number];

/**
 * The `AttributeName` handles a vocabulary list generates: the open classes, `xsi:schemaLocation`
 * and every vocabulary's names.
 */
export type NameOf<V extends readonly Vocabulary[]> =
  | V[number]["attributes"][number]
  | (typeof layerNames)[number]
  | (typeof openClasses)[number];

/**
 * A set over `NodeKind`: one bit per kind, set for each kind it holds.
 */
export type KindSet<Kind extends string> = Closed<readonly [Field<"kind", Kind>], readonly []>;

/**
 * The closed relations of kinds and attribute names one vocabulary list generates.
 *
 * A roster is the set of its live codes (fin.md §17), every handle live, so its constant is one
 * bit per handle; its key field is the code space every relation keyed by that roster ranges
 * over, in code order.
 */
export interface Kinds<Kind extends string, Name extends string> {
  /**
   * The `AttributeName` roster: {@link openClasses}, `xsi:schemaLocation`, then every
   * vocabulary's attribute names in composition order, a name listed twice held once, at its
   * first.
   */
  readonly attributeName: Closed<readonly [Field<"name", Name>], readonly []>;
  /**
   * `ElementName`: the namespace name and local name each element kind is written with.
   */
  readonly elementName: Closed<
    readonly [Field<"kind", Kind>],
    readonly [Field<"namespace", string>, Field<"local", string>]
  >;
  /**
   * `Interaction`: the interaction kinds. A node whose parent is one takes that parent as its
   * nearest interaction (plan §1.3, N8).
   */
  readonly interaction: KindSet<Kind>;
  /**
   * `IsElement`: the kinds that are elements, the key set of `ElementName`.
   */
  readonly isElement: KindSet<Kind>;
  /**
   * The `NodeKind` roster: `document` and `doctype`, then every vocabulary's kinds in composition
   * order.
   */
  readonly nodeKind: KindSet<Kind>;
  /**
   * Find the kind an element is, from its name and its parent's kind.
   *
   * A dotted kind, `qti-content-body.feedback` and the rest, shares its name with other kinds and
   * is the element's kind under each parent kind it names; any other kind is its name's under
   * every parent. The root element's parent is the document node, of kind `document`.
   *
   * @param namespace - The element's namespace name, empty when it has none.
   * @param local - The element's local name.
   * @param parent - The kind of the element's parent.
   * @returns The element's kind, or none when no vocabulary names that element under that
   * parent.
   */
  readonly resolve: (namespace: string, local: string, parent: Kind) => Option.Option<Kind>;
}

/**
 * Collect a vocabulary's kinds in their declared order.
 *
 * @param vocabulary - The vocabulary.
 * @returns Its kinds, typed as the handles of the list it belongs to.
 */
const kindsIn = <V extends readonly Vocabulary[]>(
  vocabulary: V[number],
): readonly V[number]["kinds"][number][] => vocabulary.kinds;

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
 * Generate the kind and name relations of a vocabulary list.
 *
 * A code is a handle's position in its roster, and a roster's handles only append (grizzle's D1,
 * fin.md §12: a reorder is refused). So the handles the generator adds itself come first, and a
 * vocabulary appended to the list appends its kinds and names, leaving every earlier code where it
 * was.
 *
 * @param source - What the relations are generated from.
 * @param source.alsoUnder - The parents, beside its registry row's, under which each dotted kind's
 *   name resolves to it; {@link alsoUnder} for today's vocabularies.
 * @param source.interactions - The interaction kinds; {@link interactions} for today's
 *   vocabularies.
 * @param source.vocabularies - The vocabularies, in composition order.
 * @returns The relations, or the first reason one has no constant: a kind two vocabularies declare,
 *   or an attribute name a vocabulary shares with an open class (`RepeatedValue`); two kinds one
 *   element name stands for under one parent, or an interaction listed twice (`KeyCollision`); or a
 *   parent or an interaction outside `NodeKind` (`OutsideCodeSpace`).
 */
export const generate = <const V extends readonly Vocabulary[]>(source: {
  readonly alsoUnder: ReadonlyMap<string, readonly string[]>;
  readonly interactions: readonly KindOf<V>[];
  readonly vocabularies: V;
}): Result.Result<Kinds<KindOf<V>, NameOf<V>>, ClosedRelationError> =>
  Result.gen(function* generateKinds() {
    const { vocabularies } = source;
    const kind: Field<"kind", KindOf<V>> = {
      name: "kind",
      values: [...documentKinds, ...vocabularies.flatMap(kindsIn<V>)],
    };
    const name: Field<"name", NameOf<V>> = {
      name: "name",
      values: [...openClasses, ...new Set([...layerNames, ...vocabularies.flatMap(namesIn<V>)])],
    };
    const rowOf = new Map(
      vocabularies.flatMap((vocabulary) =>
        vocabulary.kinds.map((handle) => [handle, vocabulary.registry[handle]] as const),
      ),
    );
    const elements = kind.values.flatMap((handle) =>
      Option.fromNullishOr(rowOf.get(handle)).pipe(
        Option.filter((row) => row.local !== ""),
        Option.map((row) => ({
          handle,
          parents: [...Option.toArray(row.parent), ...(source.alsoUnder.get(handle) ?? [])],
          row,
        })),
        Option.toArray,
      ),
    );
    const namespace: Field<"namespace", string> = {
      name: "namespace",
      values: dictionary(
        elements.map(({ row }) => row.namespace),
        Order.String,
      ),
    };
    const local: Field<"local", string> = {
      name: "local",
      values: dictionary(
        elements.map(({ row }) => row.local),
        Order.String,
      ),
    };
    const parent: Field<"parent", string> = { name: "parent", values: kind.values };

    const nodeKind = yield* closed({
      key: [kind],
      name: "NodeKind",
      payload: [],
      rows: kind.values.map((handle) => ({ kind: handle })),
    });
    const attributeName = yield* closed({
      key: [name],
      name: "AttributeName",
      payload: [],
      rows: name.values.map((handle) => ({ name: handle })),
    });
    const elementName = yield* closed({
      key: [kind],
      name: "ElementName",
      payload: [namespace, local],
      rows: elements.map(({ handle, row }) => ({
        kind: handle,
        local: row.local,
        namespace: row.namespace,
      })),
    });
    const isElement = yield* closed({
      key: [kind],
      name: "IsElement",
      payload: [],
      rows: elements.map(({ handle }) => ({ kind: handle })),
    });
    const interaction = yield* closed({
      key: [kind],
      name: "Interaction",
      payload: [],
      rows: source.interactions.map((handle) => ({ kind: handle })),
    });
    const anywhere = yield* closed({
      key: [namespace, local],
      name: "KindByName",
      payload: [kind],
      rows: elements
        .filter(({ parents }) => parents.length === 0)
        .map(({ handle, row }) => ({ kind: handle, local: row.local, namespace: row.namespace })),
    });
    const under = yield* closed({
      key: [namespace, local, parent],
      name: "KindByNameUnder",
      payload: [kind],
      rows: elements.flatMap(({ handle, parents, row }) =>
        parents.map((above) => ({
          kind: handle,
          local: row.local,
          namespace: row.namespace,
          parent: above,
        })),
      ),
    });

    return {
      attributeName,
      elementName,
      interaction,
      isElement,
      nodeKind,
      resolve: (namespaceName: string, localName: string, parentKind: KindOf<V>) =>
        under.lookup({ local: localName, namespace: namespaceName, parent: parentKind }).pipe(
          Option.orElse(() => anywhere.lookup({ local: localName, namespace: namespaceName })),
          Option.map((row) => row.kind),
        ),
    };
  });
