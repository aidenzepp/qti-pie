/**
 * The reference relations' tests' generators and oracles.
 *
 * - **The XSD's attribute types, read naively.** {@link typedAttributesOf} reads, for one type the
 *   shared XSD reader (`#pantry/test/gen/grammar.ts`) gives a kind, every attribute the type
 *   declares, through its attribute groups and its base types, with the types its union's members
 *   name. It reads the schema documents themselves, apart from the vocabulary deriver and its
 *   inventory leaves, which `#pantry/grammar/references.ts` derives from.
 * - **Toy facets with named faults** ({@link toyCase}): reference facets over toy rosters, valid by
 *   construction, or carrying exactly one named fault that the generator must refuse.
 */
import { Array as Arr, Option } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import { element, int, shuffled, subarray, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { boundZeros, spellings } from "#pantry/grammar/references.ts";
import type { Names, ReferenceFacet, ReferenceRow } from "#pantry/grammar/references.ts";
import { nameKey } from "#pantry/test/gen/grammar.ts";
import type { XsdSet } from "#pantry/test/gen/grammar.ts";

/**
 * The XML Schema namespace.
 */
const xs = "http://www.w3.org/2001/XMLSchema";

/**
 * A component of a schema set: its node, and the document it is read in.
 */
type Component = NonNullable<ReturnType<XsdSet["types"]["get"]>>;

/**
 * The document a component is read in, for resolving its QNames.
 */
type SchemaDocument = Component["document"];

/**
 * List a schema node's XSD element children of one local name.
 *
 * @param node - The node.
 * @param local - The children's local name.
 * @returns The children, in document order.
 */
const xsChildren = (node: Element, local: string): readonly Element[] =>
  node.children.filter(
    (child): child is Element =>
      child.kind === "element" && child.namespace === xs && child.local === local,
  );

/**
 * Read an unqualified attribute of a schema node.
 *
 * @param node - The node.
 * @param local - The attribute's local name.
 * @returns Its value, or none.
 */
const valueOf = (node: Element, local: string): Option.Option<string> =>
  Option.map(
    Arr.findFirst(node.attributes, (held) => held.namespace === "" && held.local === local),
    ({ value }) => value,
  );

/**
 * Expand a QName as its schema document reads it.
 *
 * @param document - The document.
 * @param qname - The QName.
 * @returns Its `{namespace}local` key; an unprefixed name is in the default namespace, else the
 *   document's target namespace.
 */
const expanded = (document: SchemaDocument, qname: string): string => {
  const colon = qname.indexOf(":");
  if (colon === -1) {
    return nameKey({ local: qname, namespace: document.prefixes.get("") ?? document.target });
  }

  return nameKey({
    local: qname.slice(colon + 1),
    namespace: document.prefixes.get(qname.slice(0, colon)) ?? "",
  });
};

/**
 * Read the types a simple type's union names as its members: its `memberTypes`, then each
 * anonymous member's restriction base.
 *
 * @param document - The document the simple type is read in.
 * @param simpleType - An `xs:simpleType` node.
 * @returns The members' types as `{namespace}local` keys, none for a type that is no union.
 */
const unionMembers = (document: SchemaDocument, simpleType: Element): readonly string[] =>
  xsChildren(simpleType, "union").flatMap((union) => [
    ...Option.toArray(valueOf(union, "memberTypes")).flatMap((names) =>
      names
        .split(/\s+/u)
        .filter((name) => name !== "")
        .map((name) => expanded(document, name)),
    ),
    ...xsChildren(union, "simpleType").flatMap((member) =>
      xsChildren(member, "restriction").flatMap((restriction) =>
        Option.toArray(valueOf(restriction, "base")).map((base) => expanded(document, base)),
      ),
    ),
  ]);

/**
 * Read the union members of an attribute declaration's type: its anonymous type's, or the named
 * simple type's it is declared with.
 *
 * @param set - The schema set.
 * @param document - The document the declaration is read in.
 * @param declaration - An `xs:attribute` node.
 * @returns The members' types, none for an attribute whose type is no union.
 */
const membersOf = (
  set: XsdSet,
  document: SchemaDocument,
  declaration: Element,
): readonly string[] => {
  const inline = xsChildren(declaration, "simpleType");
  if (inline.length > 0) {
    return inline.flatMap((simpleType) => unionMembers(document, simpleType));
  }

  return Option.match(
    Option.flatMap(valueOf(declaration, "type"), (type) =>
      Option.fromNullishOr(set.types.get(expanded(document, type))),
    ),
    {
      onNone: () => [],
      onSome: (named) =>
        named.node.local === "simpleType" ? unionMembers(named.document, named.node) : [],
    },
  );
};

/**
 * Read the attributes a node declares itself, and its attribute groups', recursively.
 *
 * @param set - The schema set.
 * @param component - A complex type, an extension, a restriction or an attribute group, with its
 *   document.
 * @returns Each attribute's local name with its union members; a prohibited one with none, marked
 *   for removal.
 */
const ownAttributes = (
  set: XsdSet,
  component: Component,
): readonly (readonly [name: string, members: Option.Option<readonly string[]>])[] =>
  component.node.children
    .filter((child): child is Element => child.kind === "element" && child.namespace === xs)
    .flatMap((child) => {
      if (child.local === "attribute") {
        const name = Option.orElse(valueOf(child, "name"), () =>
          Option.map(valueOf(child, "ref"), (ref) => ref.slice(ref.indexOf(":") + 1)),
        );
        const prohibited = Option.contains(valueOf(child, "use"), "prohibited");

        return Option.toArray(name).map(
          (held) =>
            [
              held,
              prohibited ? Option.none() : Option.some(membersOf(set, component.document, child)),
            ] as const,
        );
      }

      if (child.local === "attributeGroup") {
        return Option.match(
          Option.flatMap(valueOf(child, "ref"), (ref) =>
            Option.fromNullishOr(set.attributeGroups.get(expanded(component.document, ref))),
          ),
          { onNone: () => [], onSome: (group) => ownAttributes(set, group) },
        );
      }

      return [];
    });

/**
 * Read every attribute a named complex type declares, through its base types and attribute groups,
 * each with the types its union names as members.
 *
 * @param set - The schema set.
 * @param type - The type's `{namespace}local` key, as the shared reader's `Content.type` gives it.
 * @returns Each attribute's local name and union members, none for a type the set does not hold
 *   as a complex type, such as an anonymous one.
 */
export const typedAttributesOf = (
  set: XsdSet,
  type: string,
): Option.Option<ReadonlyMap<string, readonly string[]>> =>
  Option.flatMap(Option.fromNullishOr(set.types.get(type)), (component) => {
    if (component.node.local !== "complexType") {
      return Option.none();
    }

    const derivation = Arr.head(
      ["complexContent", "simpleContent"].flatMap((content) =>
        xsChildren(component.node, content).flatMap((held) => [
          ...xsChildren(held, "extension"),
          ...xsChildren(held, "restriction"),
        ]),
      ),
    );
    const inherited = derivation.pipe(
      Option.flatMap((step) => valueOf(step, "base")),
      Option.flatMap((base) => typedAttributesOf(set, expanded(component.document, base))),
      Option.getOrElse(() => new Map<string, readonly string[]>()),
    );
    const attributes = new Map(inherited);
    const own = ownAttributes(
      set,
      Option.match(derivation, {
        onNone: () => component,
        onSome: (node) => ({ document: component.document, node }),
      }),
    );
    for (const [name, members] of own) {
      Option.match(members, {
        onNone: () => attributes.delete(name),
        onSome: (held) => attributes.set(name, held),
      });
    }

    return Option.some(attributes);
  });

/**
 * The toy `NodeKind` roster's handles a toy facet names, and one no roster holds.
 */
export const toyKinds = ["k0", "k1", "k2", "k3"] as const;

/**
 * The toy `AttributeName` roster's handles a toy facet names.
 */
export const toyNames = ["a0", "a1", "a2"] as const;

/**
 * The built-in variables a toy facet may state.
 */
const toyVariables = ["v0", "v1", "v2"] as const;

/**
 * A kind, attribute or declaration kind no toy roster holds.
 */
const outside = "x9";

/**
 * The named faults of a toy case, each a kind of facet the generator must refuse, and `valid`.
 */
export const faults = [
  "valid",
  "repeated-declaration",
  "repeated-built-in",
  "kind-outside",
  "attribute-outside",
  "target-outside",
  "repeated-reference",
  "repeated-bound",
  "repeated-count",
  "repeated-part",
] as const;

/**
 * A toy case's fault.
 */
export type Fault = (typeof faults)[number];

/**
 * The refusal each fault must meet: the tag of the generator's failure, or `succeeded`.
 */
export const refusalOf = {
  "attribute-outside": "OutsideCodeSpace",
  "kind-outside": "OutsideCodeSpace",
  "repeated-bound": "KeyCollision",
  "repeated-built-in": "KeyCollision",
  "repeated-count": "KeyCollision",
  "repeated-declaration": "RepeatedValue",
  "repeated-part": "KeyCollision",
  "repeated-reference": "KeyCollision",
  "target-outside": "OutsideCodeSpace",
  valid: "succeeded",
} as const satisfies Readonly<Record<Fault, string>>;

/**
 * A toy case: its fault, and the facets that carry it, in composition order.
 */
export interface ToyCase {
  readonly facets: readonly ReferenceFacet[];
  readonly fault: Fault;
}

/**
 * Draw what a toy reference may name: any variable, or a non-empty set of the facet's declaration
 * kinds.
 *
 * @param kinds - The facet's declaration kinds.
 * @returns The generator, of any variable alone where the facet declares nothing.
 */
const namesGen = (kinds: readonly string[]): Gen<Names> =>
  Arr.isReadonlyArrayNonEmpty(kinds)
    ? weighted<Names>([
        [1, () => ({ _tag: "variable" })],
        [
          2,
          (inner) => {
            const first = inner.draw(element(kinds));

            return {
              _tag: "declaration",
              kinds: [first, ...inner.draw(subarray(kinds.filter((held) => held !== first)))],
            };
          },
        ],
      ])
    : () => ({ _tag: "variable" });

/**
 * Draw one facet's rows, valid by construction: distinct declaration kinds, built-ins of them,
 * references at distinct (kind, attribute) pairs naming any variable or some declaration kinds, one
 * bound per kind with either meaning of a most of 0, one choice count per kind, and distinct
 * section parts.
 *
 * @param least - Whether to draw at least one declaration, built-in, reference, bound, choice count
 *   and part, so that a fault that repeats a row has one to repeat.
 * @returns The generator.
 */
const facetGen =
  (least: boolean): Gen<ReferenceFacet> =>
  (source) => {
    const floor = least ? 1 : 0;
    const declarations = source.draw(shuffled(toyKinds, { max: 3, min: floor }));
    const pairs = toyKinds.flatMap((kind) => toyNames.map((attribute) => ({ attribute, kind })));
    const references = source
      .draw(shuffled(pairs, { max: 4, min: floor }))
      .map((pair): ReferenceRow => ({
        ...pair,
        names: source.draw(namesGen(declarations)),
        spelling: source.draw(element(spellings)),
      }));
    const rooted = toyKinds.flatMap((root) => toyVariables.map((variable) => ({ root, variable })));
    const builtIns = Arr.isReadonlyArrayNonEmpty(declarations)
      ? source.draw(shuffled(rooted, { max: 3, min: floor })).map(({ root, variable }) => ({
          baseType: source.draw(element([Option.some("float"), Option.none()])),
          cardinality: source.draw(element(["single", "record"])),
          declaration: source.draw(element(declarations)),
          root,
          variable,
        }))
      : [];

    return {
      builtIns,
      choiceBounds: source.draw(shuffled(toyKinds, { max: 2, min: floor })).map((kind) => ({
        kind,
        max: source.draw(element(toyNames)),
        min: source.draw(element(toyNames)),
        zero: source.draw(element(boundZeros)),
      })),
      choiceCounts: source
        .draw(shuffled(toyKinds, { max: 2, min: floor }))
        .map((kind) => ({ choice: source.draw(element(toyKinds)), kind })),
      declarations,
      fileReferences: [],
      references,
      sectionParts: source.draw(shuffled(toyKinds, { max: 3, min: floor })),
    };
  };

/**
 * Split each of a facet's row lists at a drawn point into two facets, so the rows reach the
 * generator from two vocabularies in composition order.
 *
 * @param facet - The rows.
 * @returns The generator of the two facets.
 */
const split =
  (facet: ReferenceFacet): Gen<readonly ReferenceFacet[]> =>
  (source) => {
    const at = <A>(rows: readonly A[]): readonly [readonly A[], readonly A[]] => {
      const point = source.draw(int(0, rows.length));

      return [rows.slice(0, point), rows.slice(point)];
    };
    const builtIns = at(facet.builtIns);
    const choiceBounds = at(facet.choiceBounds);
    const choiceCounts = at(facet.choiceCounts);
    const declarations = at(facet.declarations);
    const references = at(facet.references);
    const sectionParts = at(facet.sectionParts);

    return [0, 1].map((side) => ({
      builtIns: Arr.getUnsafe(builtIns, side),
      choiceBounds: Arr.getUnsafe(choiceBounds, side),
      choiceCounts: Arr.getUnsafe(choiceCounts, side),
      declarations: Arr.getUnsafe(declarations, side),
      fileReferences: [],
      references: Arr.getUnsafe(references, side),
      sectionParts: Arr.getUnsafe(sectionParts, side),
    }));
  };

/**
 * Pick one of a non-empty list's rows.
 *
 * @param rows - The rows.
 * @returns The generator of one row, or of none for an empty list.
 */
const oneOf =
  <A>(rows: readonly A[]): Gen<Option.Option<A>> =>
  (source) =>
    Arr.isReadonlyArrayNonEmpty(rows) ? Option.some(source.draw(element(rows))) : Option.none();

/**
 * Give a valid facet one fault: repeat a row whose key must be unique, or name a handle outside the
 * roster a field ranges over.
 *
 * @param fault - The fault.
 * @param facet - A valid facet holding at least one row of each kind.
 * @returns The generator of the faulty facet.
 */
const withFault =
  (fault: Exclude<Fault, "valid">, facet: ReferenceFacet): Gen<ReferenceFacet> =>
  (source) => {
    const again = <A>(rows: readonly A[]): readonly A[] => [
      ...rows,
      ...Option.toArray(source.draw(oneOf(rows))),
    ];
    switch (fault) {
      case "repeated-declaration": {
        return { ...facet, declarations: again(facet.declarations) };
      }
      case "repeated-built-in": {
        return { ...facet, builtIns: again(facet.builtIns) };
      }
      case "kind-outside": {
        return source.draw(
          element<ReferenceFacet>([
            { ...facet, declarations: [...facet.declarations, outside] },
            { ...facet, sectionParts: [...facet.sectionParts, outside] },
            {
              ...facet,
              choiceBounds: [{ kind: outside, max: "a0", min: "a0", zero: "unbounded" }],
            },
            { ...facet, choiceCounts: [{ choice: "k0", kind: outside }] },
            { ...facet, choiceCounts: [{ choice: outside, kind: "k0" }] },
            {
              ...facet,
              references: [
                ...facet.references,
                { attribute: "a0", kind: outside, names: { _tag: "variable" }, spelling: "bare" },
              ],
            },
          ]),
        );
      }
      case "attribute-outside": {
        return source.draw(
          element<ReferenceFacet>([
            {
              ...facet,
              choiceBounds: [{ kind: "k0", max: outside, min: "a0", zero: "counted" }],
            },
            {
              ...facet,
              references: [
                { attribute: outside, kind: "k0", names: { _tag: "variable" }, spelling: "bare" },
              ],
            },
          ]),
        );
      }
      case "target-outside": {
        return source.draw(
          element<ReferenceFacet>([
            {
              ...facet,
              builtIns: [
                ...facet.builtIns,
                {
                  baseType: Option.some("float"),
                  cardinality: "single",
                  declaration: outside,
                  root: "k0",
                  variable: "v9",
                },
              ],
            },
            {
              ...facet,
              references: [
                {
                  attribute: "a0",
                  kind: "k0",
                  names: { _tag: "declaration", kinds: [outside] },
                  spelling: "bare",
                },
              ],
            },
          ]),
        );
      }
      case "repeated-reference": {
        return { ...facet, references: again(facet.references) };
      }
      case "repeated-bound": {
        return { ...facet, choiceBounds: again(facet.choiceBounds) };
      }
      case "repeated-count": {
        return { ...facet, choiceCounts: again(facet.choiceCounts) };
      }
      case "repeated-part": {
        return { ...facet, sectionParts: again(facet.sectionParts) };
      }
      default: {
        return fault satisfies never;
      }
    }
  };

/**
 * Draw a toy case: a fault, weighted toward `valid`, and the two facets that carry it.
 */
export const toyCase: Gen<ToyCase> = (source) => {
  const fault = source.draw(
    weighted<Fault>([
      [8, () => "valid"],
      ...faults
        .filter((held): held is Exclude<Fault, "valid"> => held !== "valid")
        .map((held) => [1, () => held] as const),
    ]),
  );
  const facet =
    fault === "valid"
      ? source.draw(facetGen(false))
      : source.draw(withFault(fault, source.draw(facetGen(true))));

  return { facets: source.draw(split(facet)), fault };
};
