/**
 * The composition of vocabularies: one vocabulary list, and every generator of `src/grammar/` run
 * over it, giving one {@link Grammar} (plan Q3.03, R4 of the W1 to W4 review).
 *
 * {@link compose} is a function of the list. Each vocabulary is one shape (its namespace, its kinds
 * with their local names, the attribute names it introduces, its content models and attribute
 * declarations, and the triples it states beside them) with its grammar facets (`facets.ts`), so a
 * toy vocabulary list composes through the same path as the production one, and a vocabulary
 * appended to the list appends its codes. Production's list is {@link vocabularies}: character
 * data, then the eleven vocabularies the pinned XSDs declare, one per namespace, in
 * `src/vocab/inventory/vocabularies.ts`'s order, then the open vocabulary and the document layer.
 *
 * Beside the vocabularies' own rows the composition states the rows no one vocabulary can:
 *
 * - A name resolves by locality, read off admission: to the element kind its parent admits with that
 *   name, a local declaration or a global one a wildcard finds, else to none;
 * - The document node admits its root element kinds, the doctype, comments, instructions and
 *   whitespace;
 * - A kind whose element wildcard reads globally declared elements as their kinds admits each of them
 *   in the wildcard's namespaces, but the roots spec reading 6 keeps foreign (the open vocabulary's
 *   `globalAdmission`), since that needs every vocabulary's registry;
 * - XML Schema's `xsi:` attributes are admitted on every element kind (spec reading 47), `xsi:nil`
 *   only on the foreign kinds, since no pinned element is nillable (audit A6); and the four `xml:`
 *   names on every kind that holds an attribute wildcard and on the foreign kinds, wherever the
 *   kind does not declare them itself, all as closed names (fin.md, D2's refinement). An `xml:`
 *   name has `xml.xsd`'s type where the wildcard validates it, and is free text under MathML's
 *   `skip` wildcard;
 * - The open classes (`data-*`, `foreign`, `no-namespace`, `own-namespace`) are admitted, as free
 *   text, on every kind whose attribute wildcard's namespace classes let them through, and all but
 *   `data-*` on the foreign kinds (fin.md, D2).
 *
 * Every admitted triple is stated once: a triple two sources state is a `KeyCollision`.
 */
import { Option, Result } from "effect";
import type { Admission, AdmittedChild } from "#pantry/grammar/admission.ts";
import { generate as generateAncestry } from "#pantry/grammar/ancestry.ts";
import type { AncestrySets } from "#pantry/grammar/ancestry.ts";
import { baseTypes, generate as generateAttributes } from "#pantry/grammar/attributes.ts";
import type {
  AttributeGrammar,
  AttributeGrammarError,
  Declared,
} from "#pantry/grammar/attributes.ts";
import { barredByOf } from "#pantry/grammar/children.ts";
import type { BarredBy, ChildError, LastWhere } from "#pantry/grammar/children.ts";
import { closed, idField, roster, sourced } from "#pantry/grammar/closed.ts";
import type { ClosedRelationError, Roster } from "#pantry/grammar/closed.ts";
import {
  bindingFit,
  mappableBaseType,
  operatorArity,
  recordBindingFit,
} from "#pantry/grammar/expression.ts";
import type {
  BindingFit,
  MappableBaseType,
  OperatorArity,
  RecordBindingFit,
} from "#pantry/grammar/expression.ts";
import * as facets from "#pantry/grammar/facets.ts";
import type { Facets } from "#pantry/grammar/facets.ts";
import {
  foreignKinds,
  isForeignKind,
  generate as generateKinds,
  resolution,
  schemaVersions,
} from "#pantry/grammar/kinds.ts";
import type {
  KindOf,
  Kinds,
  NameOf,
  Vocabulary as KindsVocabulary,
} from "#pantry/grammar/kinds.ts";
import { characterKinds, contentOf } from "#pantry/grammar/content.ts";
import type { ContentError, ContentGrammar } from "#pantry/grammar/content.ts";
import { packageGrammar } from "#pantry/grammar/package.ts";
import { references } from "#pantry/grammar/references.ts";
import { xsiTypesOf } from "#pantry/grammar/xsi.ts";
import type { XsiTypeError, XsiTypes } from "#pantry/grammar/xsi.ts";
import type { References } from "#pantry/grammar/references.ts";
import type { PackageGrammar } from "#pantry/grammar/package.ts";
import {
  attributeDeclarations,
  attributeWildcards,
  textTypes,
} from "#pantry/vocab/inventory/attributes.ts";
import { contentModels, typeDerivations } from "#pantry/vocab/inventory/models.ts";
import { globalKinds, vocabularies as rosters } from "#pantry/vocab/inventory/vocabularies.ts";
import type { ContentModel, Source, VocabularyRoster } from "#pantry/vocab/inventory/types.ts";
import * as open from "#pantry/vocab/open.ts";

/**
 * A vocabulary as the composition reads it: its namespace, kinds and attribute names; the content
 * models of its kinds, from which its admitted triples and content automata are projected; the
 * triples it states beside them, for kinds no model declares (a toy's kinds); the attribute
 * declarations it reads its attributes' types from; and its grammar facets. A vocabulary with none
 * of a part states it empty.
 */
export interface Vocabulary extends KindsVocabulary {
  readonly admission: readonly (AdmittedChild & { readonly source: Source })[];
  readonly declarations: readonly Declared[];
  readonly facets: Facets;
  readonly models: readonly ContentModel[];
}

/**
 * The cardinalities of a typed variable, in code order: the `TypedCardinality` roster's handles.
 * A record has no base type, so `BindingFit` is keyed by these three, and `RecordBindingFit` holds
 * the record's interactions.
 */
export const typedCardinalities = ["single", "multiple", "ordered"] as const;

/**
 * Pair a vocabulary the pinned XSDs declare with its content models, its attribute declarations and
 * its facets: the leaves' rows of its kinds.
 *
 * @param declared - The vocabulary's roster.
 * @returns The vocabulary as the composition reads it.
 */
const vocabulary = <const R extends VocabularyRoster>(
  declared: R,
): Vocabulary & { readonly attributes: R["attributes"]; readonly kinds: R["kinds"] } => {
  const held = new Set(declared.kinds.map(({ handle }) => handle));

  return {
    admission: [],
    attributes: declared.attributes,
    declarations: attributeDeclarations.filter(({ kind }) => held.has(kind)),
    facets: facets.vocabularyFacets.get(declared.name) ?? facets.noFacets,
    kinds: declared.kinds,
    models: contentModels.filter(({ kind }) => held.has(kind)),
    namespace: declared.namespace,
  };
};

/**
 * A layer of the composition that no XSD declares: kinds that name no element, or none, and the
 * facets that state what no XSD does.
 *
 * @param kinds - The layer's kinds, none of them an element.
 * @param stated - Its facets.
 * @returns The layer as the composition reads it.
 */
const layer = <const K extends readonly string[]>(
  kinds: K,
  stated: Facets,
): Vocabulary & {
  readonly attributes: readonly [];
  readonly kinds: readonly { readonly handle: K[number]; readonly local: "" }[];
} => ({
  admission: [],
  attributes: [],
  declarations: [],
  facets: stated,
  kinds: kinds.map((handle) => ({ handle, local: "" as const })),
  models: [],
  namespace: "",
});

/**
 * Every vocabulary of production, in composition order: character data, the eleven vocabularies the
 * pinned XSDs declare, the open vocabulary and the document layer. Codes follow this order, so a
 * vocabulary joins at the end.
 */
export const vocabularies = [
  layer(characterKinds, facets.noFacets),
  ...rosters.map(vocabulary),
  layer([], facets.openVocabulary),
  layer([], facets.documentLayer),
] as const;

/**
 * A `NodeKind` handle of production's composition.
 */
export type Kind = KindOf<typeof vocabularies>;

/**
 * An `AttributeName` handle of production's composition.
 */
export type Name = NameOf<typeof vocabularies>;

/**
 * Key an attribute admission by version, kind and name.
 *
 * @param row - The admission.
 * @param row.kind - Its kind.
 * @param row.name - Its name.
 * @param row.version - Its version.
 * @returns A key no other triple shares.
 */
const attributeKey = (row: {
  readonly kind: string;
  readonly name: string;
  readonly version: string;
}): string => `${row.version}\u0000${row.kind}\u0000${row.name}`;

/**
 * State the document layer's attributes, each where its kind's vocabulary does not declare it:
 *
 * - The `xsi:` names on every element kind, but `xsi:nil`, which XML Schema admits only on an element
 *   declared nillable: no element of a pinned XSD is, and a foreign element, assessed laxly, may be
 *   (audit A6);
 * - On every kind of an element that holds an attribute wildcard, the `xml:` names, typed as the
 *   wildcard's processing reads them, and the open classes it admits, as free text;
 * - On each foreign kind, the `xml:` names with `xml.xsd`'s types, and the open classes but `data-*`
 *   (`open.foreignAttributes`).
 *
 * A foreign element is one a `lax` element wildcard admits with no declaration, and XML Schema
 * assesses it laxly, against `xs:anyType`, whose attribute wildcard is `##any` and `lax`: so its
 * `xml:` names are validated, as a `lax` attribute wildcard's are.
 *
 * @param kinds - The composition's kinds.
 * @param declared - The keys of the attributes the vocabularies admit ({@link attributeKey}).
 * @returns The layer, read as its XSD types the attributes.
 */
const layerOf = (
  kinds: Kinds<string, string>,
  declared: ReadonlySet<string>,
): readonly Declared[] => {
  const hosts = [
    ...attributeWildcards
      .filter(({ kind }) => kinds.nodeKind.has(kind))
      .flatMap(({ kind, namespace, processing, versions: holding }) =>
        holding.flatMap((version) =>
          open
            .attributesUnder({ namespace, processing })
            .map((attribute) => ({ attribute, kind, version })),
        ),
      ),
    ...schemaVersions.flatMap((version) =>
      Object.values(foreignKinds).flatMap((kind) =>
        open.foreignAttributes.map((attribute) => ({ attribute, kind, version })),
      ),
    ),
    ...schemaVersions.flatMap((version) =>
      kinds.isElement.rows.flatMap(({ kind }) =>
        open.xsiAttributes
          .filter(({ name }) => name !== "xsi:nil" || isForeignKind(kind))
          .map((attribute) => ({ attribute, kind, version })),
      ),
    ),
  ];

  return [
    ...new Map(
      hosts
        .filter(
          ({ attribute, kind, version }) =>
            !declared.has(attributeKey({ kind, name: attribute.name, version })),
        )
        .map(
          ({ attribute, kind, version }) =>
            [
              attributeKey({ kind, name: attribute.name, version }),
              {
                domain: attribute.domain,
                kind,
                name: attribute.name,
                type: attribute.type,
                use: "optional",
                versions: [version],
              } satisfies Declared,
            ] as const,
        ),
    ).values(),
  ];
};

/**
 * Every closed relation of a composition and the host's views of them.
 */
export interface Grammar<K extends string, N extends string> {
  /**
   * `Admission`: the admitted (version, parent, child) triples, each with its content position
   * (`ChildGrammar`), sourced to its particle, or its model at position 0.
   */
  readonly admission: Admission;
  readonly ancestry: AncestrySets;
  readonly attributes: AttributeGrammar;
  /**
   * The `BaseType` roster.
   */
  readonly baseTypes: Roster<string>;
  readonly barredBy: BarredBy;
  readonly bindingFit: BindingFit;
  readonly content: ContentGrammar;
  readonly kinds: Kinds<K, N>;
  /**
   * The last-slot rules the vocabularies state, for the law that reads them (`LastWhere`).
   */
  readonly lastWhere: readonly LastWhere[];
  readonly mappableBaseType: MappableBaseType;
  readonly operatorArity: OperatorArity;
  readonly package: PackageGrammar;
  readonly recordBindingFit: RecordBindingFit;
  /**
   * The relations of variable references and their declarations (review R9).
   */
  readonly references: References;
  /**
   * The `TypedCardinality` roster.
   */
  readonly typedCardinalities: Roster<string>;
  /**
   * The `xsi:type` law's relations: the `TypeName` roster and `XsiType` (spec reading 47).
   */
  readonly xsi: XsiTypes;
}

/**
 * The grammar of production's composition.
 */
export type ComposedGrammar = Grammar<Kind, Name>;

/**
 * The ways a composition has no grammar: a generator's refusal of its rows.
 */
export type ComposeError =
  | AttributeGrammarError
  | ChildError
  | ClosedRelationError
  | ContentError
  | XsiTypeError;

/**
 * Run every generator over a vocabulary list.
 *
 * @param list - The vocabularies, in composition order.
 * @returns The grammar, or the first generator's refusal.
 */
export const compose = <const V extends readonly Vocabulary[]>(
  list: V,
): Result.Result<Grammar<KindOf<V>, NameOf<V>>, ComposeError> =>
  Result.gen(function* composeGrammar() {
    const stated = list.map((entry) => entry.facets);
    const base = yield* generateKinds({
      interactions: stated.flatMap((facet) => facet.interactions),
      layer: [...open.xsiAttributes, ...open.xmlAttributes].map(({ name }) => name),
      vocabularies: list,
    });
    const namespaceOf = (kind: string) =>
      Option.getOrElse(
        Option.map(base.elementName.lookup({ kind }), ({ namespace }) => namespace),
        () => "",
      );
    const installed = yield* contentOf({
      facets: stated.map((facet) => facet.content),
      foreignRoots: open.foreignRoots,
      globalKinds: (version) =>
        globalKinds.flatMap(({ kind, versions }) =>
          versions.includes(version) && base.nodeKind.has(kind) ? [kind] : [],
        ),
      kinds: base.nodeKind,
      models: list.flatMap((entry) => entry.models),
      namespaceOf,
      versions: base.versions,
    });
    const stating = list.flatMap((entry) => entry.admission);
    const kinds = yield* resolution(base, [...installed.admitted, ...stating]);
    const statedSources = new Map(
      stating.map(
        ({ child, parent, source, version }) => [`${version} ${parent} ${child}`, source] as const,
      ),
    );
    // A child the models admit is its position's particle, or its model's at 0; a triple a
    // vocabulary states beside them carries its own source.
    const admission = sourced(
      yield* closed({
        key: [
          idField("version", kinds.versions),
          idField("parent", kinds.nodeKind),
          idField("child", kinds.nodeKind),
        ],
        name: "Admission",
        payload: [idField("position", installed.content.positions)],
        rows: [
          ...installed.admitted.map((row) => ({ ...row, position: String(row.position) })),
          ...stating.map(({ child, parent, version }) => ({
            child,
            parent,
            position: "0",
            version,
          })),
        ],
      }),
      ({ child, parent, position, version }) =>
        Option.getOrThrowWith(
          Option.orElse(
            Option.fromNullishOr(statedSources.get(`${version} ${parent} ${child}`)),
            () => installed.content.sourceOf({ parent, position, version }),
          ),
          () =>
            new Error(`Admission states ${child} under ${parent} in ${version} with no source.`),
        ),
    );
    const declarations = list.flatMap((entry) => entry.declarations);
    const declared = new Set(
      declarations.flatMap(({ kind, name, versions }) =>
        versions.map((version) => attributeKey({ kind, name, version })),
      ),
    );
    const attributes = yield* generateAttributes({
      declarations: [...declarations, ...layerOf(kinds, declared)],
      kinds: kinds.nodeKind,
      names: kinds.attributeName,
      texts: textTypes.filter(({ kind }) => kinds.nodeKind.has(kind)),
      versions: kinds.versions,
    });
    const baseTypeRoster = yield* roster("BaseType", baseTypes);
    const cardinalities = yield* roster("TypedCardinality", typedCardinalities);
    const expression = stated.map((facet) => facet.expression);
    const fitRosters = { baseTypes: baseTypeRoster, cardinalities, kinds: kinds.nodeKind };

    return {
      admission,
      ancestry: yield* generateAncestry({
        facets: stated.map((facet) => facet.ancestry),
        interactions: kinds.interaction.rows.map(({ kind }) => kind),
        kinds: kinds.nodeKind,
      }),
      attributes,
      barredBy: yield* barredByOf({
        admission,
        attributes: kinds.attributeName,
        facets: stated.map((facet) => facet.children),
        kinds: kinds.nodeKind,
        positions: installed.content.positions,
        versions: kinds.versions,
      }),
      baseTypes: baseTypeRoster,
      bindingFit: yield* bindingFit({ facets: expression, rosters: fitRosters }),
      content: installed.content,
      kinds,
      lastWhere: stated.flatMap((facet) => facet.children.lastWhere),
      mappableBaseType: yield* mappableBaseType(baseTypeRoster),
      operatorArity: yield* operatorArity({ facets: expression, kinds: kinds.nodeKind }),
      package: yield* packageGrammar({
        facets: stated.map((facet) => facet.package),
        kinds: kinds.nodeKind,
        versions: kinds.versions,
      }),
      recordBindingFit: yield* recordBindingFit({ facets: expression, kinds: kinds.nodeKind }),
      references: yield* references({
        facets: stated.map((facet) => facet.references),
        kinds: kinds.nodeKind,
        names: kinds.attributeName,
      }),
      typedCardinalities: cardinalities,
      xsi: yield* xsiTypesOf({
        derivations: typeDerivations,
        kinds: kinds.nodeKind,
        models: list.flatMap((entry) => entry.models),
        versions: kinds.versions,
      }),
    };
  });

/**
 * The grammar of production's composition, {@link vocabularies}.
 *
 * @returns The grammar, or the first generator's refusal.
 */
export const composed = (): Result.Result<ComposedGrammar, ComposeError> => compose(vocabularies);
