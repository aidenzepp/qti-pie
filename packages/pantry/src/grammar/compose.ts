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
 *   in the wildcard's namespaces that a schema set of the kind's documents declares (spec reading
 *   81, `open.wildcardReads`), but the roots spec reading 6 keeps foreign, since that needs every
 *   vocabulary's registry;
 * - XML Schema's `xsi:` attributes are admitted on every element kind (spec reading 47), `xsi:nil`
 *   only on the foreign kinds, since no pinned element is nillable (audit A6); and the four `xml:`
 *   names on every kind that holds an attribute wildcard and on the foreign kinds, wherever the
 *   kind does not declare them itself, all as closed names (fin.md, D2's refinement). An `xml:`
 *   name has `xml.xsd`'s type where the wildcard validates it, and is free text under MathML's
 *   `skip` wildcard;
 * - The open classes (`data-*`, `foreign`, `no-namespace`, `own-namespace`) are admitted, as free
 *   text, on every kind whose attribute wildcard's namespace classes let them through, and all but
 *   `data-*` on the foreign kinds (fin.md, D2). On a kind the Schematron's extension rules cover,
 *   only `data-*` is, and no `xml:` name the kind does not declare (spec reading 90, `coveredBy`).
 *
 * Every admitted triple is stated once: a triple two sources state is a `KeyCollision`.
 */
import { Function as Fn, Option, Result } from "effect";
import type { Admission, AdmittedChild } from "#pantry/grammar/admission.ts";
import { generate as generateAncestry } from "#pantry/grammar/ancestry.ts";
import type { AncestrySets } from "#pantry/grammar/ancestry.ts";
import {
  baseTypes,
  generate as generateAttributes,
  readDeclarations,
} from "#pantry/grammar/attributes.ts";
import type {
  AttributeGrammar,
  AttributeGrammarError,
  Declared,
  DomainReader,
  GovernedDeclared,
  Governor,
} from "#pantry/grammar/attributes.ts";
import { barredByOf } from "#pantry/grammar/children.ts";
import type { BarredBy, ChildError, LastWhere } from "#pantry/grammar/children.ts";
import { closed, idField, roster, sourced } from "#pantry/grammar/closed.ts";
import type { ClosedRelationError, Roster } from "#pantry/grammar/closed.ts";
import { compositions } from "#pantry/grammar/compositions.ts";
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
import { includeAlternativesOf, includeGrammar } from "#pantry/grammar/include.ts";
import type { IncludeGrammar } from "#pantry/grammar/include.ts";
import { heldRootsUnder, namesUnder, typesAvailable } from "#pantry/grammar/names.ts";
import type { HeldRootsUnder, NamesUnder, TypesAvailable } from "#pantry/grammar/names.ts";
import { packageGrammar } from "#pantry/grammar/package.ts";
import { references } from "#pantry/grammar/references.ts";
import { expandedNameOf, noType, xsiTypesOf } from "#pantry/grammar/xsi.ts";
import type { XsiTypeError, XsiTypes } from "#pantry/grammar/xsi.ts";
import type { References } from "#pantry/grammar/references.ts";
import type { PackageGrammar } from "#pantry/grammar/package.ts";
import {
  attributeDeclarations,
  attributeWildcards,
  textTypes,
  typeAttributeDeclarations,
  typeAttributeWildcards,
  typeTexts,
} from "#pantry/vocab/inventory/attributes.ts";
import { contentModels, typeDerivations } from "#pantry/vocab/inventory/models.ts";
import { coveredElements } from "#pantry/vocab/inventory/extensions.ts";
import { globalKinds, vocabularies as rosters } from "#pantry/vocab/inventory/vocabularies.ts";
import type {
  ContentModel,
  Domain,
  Source,
  TypeText,
  VocabularyRoster,
} from "#pantry/vocab/inventory/types.ts";
import { namespaceClassOf, xsNamespace } from "#pantry/vocab/namespaces.ts";
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
 * its facets: the leaves' rows of its kinds, the declarations as the spec readings that add or
 * remove an attribute read them (`readDeclarations`: readings 10 and 85).
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
    declarations: readDeclarations(attributeDeclarations.filter(({ kind }) => held.has(kind))),
    facets: facets.vocabularyFacets.get(declared.name) ?? facets.noFacets,
    kinds: declared.kinds,
    models: contentModels.filter(({ kind }) => held.has(kind)),
    namespace: declared.namespace,
  };
};

/**
 * A layer of the composition that no XSD declares: kinds that name no element, or none, the
 * attribute names it holds, and the facets that state what no XSD does.
 *
 * @param kinds - The layer's kinds, none of them an element.
 * @param stated - Its facets.
 * @param attributes - The attribute names it holds, empty for a layer of kinds alone.
 * @returns The layer as the composition reads it.
 */
const layer = <const K extends readonly string[], const A extends readonly string[]>(
  kinds: K,
  stated: Facets,
  attributes: A,
): Vocabulary & {
  readonly attributes: A;
  readonly kinds: readonly { readonly handle: K[number]; readonly local: "" }[];
} => ({
  admission: [],
  attributes,
  declarations: [],
  facets: stated,
  kinds: kinds.map((handle) => ({ handle, local: "" as const })),
  models: [],
  namespace: "",
});

/**
 * The global attribute names every `AttributeName` roster holds through the document layer, as the
 * leaf's `globalAttributes` spells them: `xml.xsd`'s four, XML Schema's four instance attributes
 * and XLink's ten. The roster takes them from the leaf at run time (`generateKinds`'s `layer`); the
 * document layer lists them again so the static {@link Name} is the roster, a vocabulary's
 * `attributes` being the only names it reads. A name the roster already holds keeps its code, so
 * the list moves no code. `compose.test.ts` checks it against the leaf.
 */
export const layerAttributeNames = [
  "xml:lang",
  "xml:space",
  "xml:base",
  "xml:id",
  "xsi:schemaLocation",
  "xsi:type",
  "xsi:nil",
  "xsi:noNamespaceSchemaLocation",
  "xlink:type",
  "xlink:href",
  "xlink:role",
  "xlink:arcrole",
  "xlink:title",
  "xlink:show",
  "xlink:actuate",
  "xlink:label",
  "xlink:from",
  "xlink:to",
] as const;

/**
 * Every vocabulary of production, in composition order: character data, the eleven vocabularies the
 * pinned XSDs declare, the open vocabulary and the document layer. Codes follow this order, so a
 * vocabulary joins at the end.
 */
export const vocabularies = [
  layer(characterKinds, facets.noFacets, []),
  ...rosters.map(vocabulary),
  layer([], facets.openVocabulary, []),
  layer([], facets.documentLayer, layerAttributeNames),
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
 * Read which element kinds spec reading 90 holds to their declared attributes in each version:
 * those whose element the Schematron's extension rules of that version cover (`coveredElements`,
 * from the `RULESET_*_DATAEXTENSIONRULES` patterns both ASI XSDs embed), compared by expanded name,
 * so every kind one element name resolves to is covered alike (`qti-rubric-block` and
 * `qti-rubric-block.test`).
 *
 * The reading is QTI's own rule, not XML Schema's, so it follows the element's name, never the type
 * an `xsi:type` makes it governed by (spec reading 84).
 *
 * @param kinds - The composition's kinds.
 * @returns Whether a kind's element is covered in a version.
 */
export const coveredBy = (
  kinds: Pick<Kinds<string, string>, "elementName">,
): ((version: string, kind: string) => boolean) => {
  const covered = new Set(
    coveredElements.flatMap(({ element, versions }) =>
      versions.map((version) => `${version} {${element.namespace}}${element.local}`),
    ),
  );

  return (version, kind) =>
    Option.exists(kinds.elementName.lookup({ kind }), ({ local, namespace }) =>
      covered.has(`${version} {${namespace}}${local}`),
    );
};

/**
 * Read the namespace an element of a kind is written in, empty for a kind no vocabulary declares.
 *
 * @param kinds - The composition's kinds.
 * @param kind - The kind.
 * @returns Its namespace name.
 */
const namespaceOfKind = (kinds: Kinds<string, string>, kind: string): string =>
  Option.match(kinds.elementName.lookup({ kind }), {
    onNone: () => "",
    onSome: ({ namespace }) => namespace,
  });

/**
 * Whether an attribute's type definition is or is derived from `xs:ID`: the leaf's definition of an
 * ID-derived type, `UniqueIdentifierDType` among them, is atomic with the built-in `ID`.
 *
 * @param attribute - The attribute's declaration, or its admission under a wildcard.
 * @returns Whether its type is an ID.
 */
const isIdType = ({ domain }: { readonly domain: Domain }): boolean =>
  domain._tag === "atomic" && domain.builtin === "ID";

/**
 * Whether an element may carry a wild ID: XML Schema 1.0 Part 1, §3.4.4, Element Locally Valid
 * (Complex Type), clause 5.2: "If the wild IDs is non-empty, there must not be any attribute uses
 * among the {attribute uses} whose {attribute declaration}'s {type definition} is or is derived
 * from ID". A wild ID is an attribute a wildcard admits whose declaration's type is an ID: only
 * `xml:id`, which `xml.xsd` types `xs:ID`, under a `lax` or `strict` wildcard (under `skip` it is
 * not assessed, so it has no type). So an element whose uses include an ID-derived one admits no
 * `xml:id` its type does not declare (spec reading 109). Clause 5.1, at most one wild ID, holds by
 * construction: `xml:id` is the only global attribute of an ID type.
 *
 * @param attribute - An attribute a wildcard admits.
 * @param declaresId - Whether the element's own attribute uses include an ID-derived one.
 * @returns Whether the element may carry it.
 */
const admitsWild = (attribute: { readonly domain: Domain }, declaresId: boolean): boolean =>
  !declaresId || !isIdType(attribute);

/**
 * State the document layer's attributes, each where its kind's vocabulary does not declare it:
 *
 * - The `xsi:` names on every element kind, but `xsi:nil`, which XML Schema admits only on an element
 *   declared nillable: no element of a pinned XSD is, and a foreign element, assessed laxly, may be
 *   (audit A6);
 * - On every kind of an element that holds an attribute wildcard, the `xml:` names, typed as the
 *   wildcard's processing reads them, and the open classes it admits, as free text; but on a kind
 *   whose element the Schematron's extension rules cover ({@link coveredBy}), only `data-*`, where
 *   the wildcard admits it: spec reading 90 makes every attribute such an element does not declare
 *   an extension, and an extension a `data-` name in no namespace, so no other open class and no
 *   `xml:` name the kind does not declare is admitted there;
 * - On each foreign kind, the `xml:` names with `xml.xsd`'s types, and the open classes but `data-*`
 *   (`open.foreignAttributes`).
 *
 * But a kind whose declared uses include an ID-derived one admits no wild ID, the `xml:id` its
 * wildcard would validate ({@link admitsWild}, spec reading 109).
 *
 * A foreign element is one a `lax` element wildcard admits with no declaration, and XML Schema
 * assesses it laxly, against `xs:anyType`, whose attribute wildcard is `##any` and `lax`: so its
 * `xml:` names are validated, as a `lax` attribute wildcard's are.
 *
 * @param kinds - The composition's kinds.
 * @param declared - The keys of the attributes the vocabularies admit ({@link attributeKey}).
 * @param declaresId - The (version, kind)s whose declared uses include an ID-derived one,
 *   `<version> <kind>`.
 * @returns The layer, read as its XSD types the attributes.
 */
const layerOf = (
  kinds: Kinds<string, string>,
  declared: ReadonlySet<string>,
  declaresId: ReadonlySet<string>,
): readonly Declared[] => {
  const covered = coveredBy(kinds);
  const hosts = [
    ...attributeWildcards
      .filter(({ kind }) => kinds.nodeKind.has(kind))
      .flatMap(({ kind, namespace, processing, versions: holding }) =>
        holding.flatMap((version) =>
          open
            .attributesUnder({ namespace, processing }, namespaceOfKind(kinds, kind))
            .filter(({ name }) => !covered(version, kind) || name === "data-*")
            .filter((attribute) => admitsWild(attribute, declaresId.has(`${version} ${kind}`)))
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
 * Read the texts of the named types a composition's elements may be governed by: each leaf row of
 * a type in XML Schema's namespace or one of the composition's vocabularies'. A toy composition
 * reads the built-ins alone.
 *
 * `xs:NOTATION`'s text is among them: its value space is the QNames of the notations the schema
 * declares (XML Schema Part 2, 3.2.19), and no pinned XSD declares one, so its domain is empty, a
 * `ValueDomain` handle with no pattern (`emptyDomains` of the attribute grammar, C47): a foreign
 * element whose `xsi:type` names it holds no valid text. No pattern spells the empty language that
 * grizzle admits (it refuses a `Compute.matches` pattern no text matches,
 * `scalar/regex/admit.ts:121`), so the laws read the domain's emptiness, not a pattern.
 *
 * @param namespaces - The namespaces of the composition's vocabularies.
 * @returns The rows.
 */
const governingTextsOf = (namespaces: ReadonlySet<string>): readonly TypeText[] =>
  typeTexts.filter(({ owner }) =>
    Option.exists(
      expandedNameOf(owner),
      ({ namespace }) => namespace === xsNamespace || namespaces.has(namespace),
    ),
  );

/**
 * Group a leaf's rows keyed by a type by version and type, `version owner`.
 *
 * @param rows - The rows, each of a type in some versions.
 * @returns Each (version, type)'s rows, in leaf order.
 */
const byOwner = <R extends { readonly owner: string; readonly versions: readonly string[] }>(
  rows: readonly R[],
): ReadonlyMap<string, readonly R[]> => {
  const grouped = new Map<string, R[]>();
  for (const row of rows) {
    for (const version of row.versions) {
      const key = `${version} ${row.owner}`;
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    }
  }

  return grouped;
};

/**
 * The governors of a composition and the attributes each admits ({@link governedOf}), as the
 * attribute grammar reads them.
 */
interface GovernedAttributes {
  readonly governed: readonly GovernedDeclared[];
  readonly governors: readonly Governor[];
}

/**
 * State the governors (spec readings 60 and 84) and the attributes each admits.
 *
 * A governor is a (version, kind, type) where the type may govern an element of the kind in place
 * of its declared type: each `XsiType` row whose type is not the kind's declared one, and, on each
 * foreign kind, every named simple type of the leaf, which governs a foreign element's text. An
 * element under a complex governing type carries that type's attributes as `layerOf` states a
 * kind's: the type's declarations through the kind's own spec readings (`readDeclarations`), the
 * `xml:` names and open classes the type's attribute wildcard admits, but on a kind spec reading 90
 * covers only `data-*`, since that reading follows the element's name, and the `xsi:` names but
 * `xsi:nil`, which no pinned element declaration makes nillable; and no wild ID where the type's
 * declared uses include an ID-derived one ({@link admitsWild}, spec reading 109). An element under
 * a simple type carries the `xsi:` names alone (XML Schema 1.0 Part 1, §3.3.4, Element Locally
 * Valid (Type), clause 3.1.1), `xsi:nil` among them on a foreign element, which no declaration
 * assesses.
 *
 * @param kinds - The composition's kinds.
 * @param xsi - The `xsi:type` law's relations.
 * @param governingTexts - The texts of the named types the composition's elements may be governed
 *   by ({@link governingTextsOf}).
 * @returns The governors, each once, and every attribute each admits, each name once.
 */
const governedOf = (
  kinds: Kinds<string, string>,
  xsi: XsiTypes,
  governingTexts: readonly TypeText[],
): GovernedAttributes => {
  const covered = coveredBy(kinds);
  const declaredBy = byOwner(typeAttributeDeclarations);
  const wildcardOf = byOwner(typeAttributeWildcards);
  const isComplex = (key: string) => declaredBy.has(key) || wildcardOf.has(key);
  const governors: readonly Governor[] = [
    ...xsi.xsiType.rows.flatMap(({ kind, type, version }) =>
      type === noType || type === xsi.declaredType(version, kind)
        ? []
        : [{ governs: type, kind, version }],
    ),
    ...governingTexts.flatMap(({ owner, versions }) =>
      versions.flatMap((version) =>
        isComplex(`${version} ${owner}`)
          ? []
          : Object.values(foreignKinds).map((kind) => ({ governs: owner, kind, version })),
      ),
    ),
  ];
  const governed = governors.flatMap(({ governs, kind, version }) => {
    const key = `${version} ${governs}`;
    const own = readDeclarations(
      (declaredBy.get(key) ?? []).map(({ domain, name, type, use }): Declared => ({
        domain,
        kind,
        name,
        type,
        use,
        versions: [version],
      })),
    );
    const declaresId = own.some(isIdType);
    const hosts = [
      ...(wildcardOf.get(key) ?? []).flatMap(({ namespace, processing }) =>
        open
          .attributesUnder({ namespace, processing }, namespaceOfKind(kinds, kind))
          .filter(({ name }) => !covered(version, kind) || name === "data-*")
          .filter((attribute) => admitsWild(attribute, declaresId)),
      ),
      ...open.xsiAttributes.filter(({ name }) => name !== "xsi:nil" || isForeignKind(kind)),
    ];
    const stated = new Set(own.map(({ name }) => name));

    return [
      ...own,
      ...new Map(
        hosts
          .filter(({ name }) => !stated.has(name))
          .map(
            ({ domain, name, type }) =>
              [
                name,
                {
                  domain,
                  kind,
                  name,
                  type,
                  use: "optional",
                  versions: [version],
                } satisfies Declared,
              ] as const,
          ),
      ).values(),
    ].map((row): GovernedDeclared => ({ ...row, governs }));
  });

  return { governed, governors };
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
  /**
   * `HeldRootsUnder`: (version, parent) → names, the expanded names of spec reading 6's roots a
   * strictly held family's `strict` wildcards assess against their global declarations (C13).
   */
  readonly heldRootsUnder: HeldRootsUnder;
  /**
   * The kinds an include stands for under each parent whose model holds one (spec reading 114).
   */
  readonly include: IncludeGrammar;
  /**
   * `KindByNameUnder`: (version, parent) → names, the expanded names of the element kinds a parent
   * that admits a foreign element admits, which no foreign element under it holds (C8).
   */
  readonly kindByNameUnder: NamesUnder;
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
   * `TypeAvailable`: type → namespaces, the vocabulary namespaces under whose elements an
   * `xsi:type` may name the type (C15, C36; spec readings 60 and 81).
   */
  readonly typeAvailable: TypesAvailable;
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
 * Read a `TypeName` handle's namespace.
 *
 * @param type - The handle.
 * @returns Its namespace name, empty for the null type.
 */
const typeNamespaceOf = (type: string): string =>
  Option.match(expandedNameOf(type), { onNone: () => "", onSome: ({ namespace }) => namespace });

/**
 * Run every generator over a vocabulary list.
 *
 * Each call composes anew and first announces the list on {@link compositions}, so a subscriber
 * counts the work. Production's list is composed once per process, through {@link composed}.
 *
 * @param list - The vocabularies, in composition order.
 * @param readDomain - The reader its attributes' domains are read through, when its caller shares
 *   one among compositions (`#pantry/grammar/attributes.ts`, `domainReader`); a reader of its own
 *   otherwise.
 * @returns The grammar, or the first generator's refusal.
 */
export const compose = <const V extends readonly Vocabulary[]>(
  list: V,
  readDomain?: DomainReader,
): Result.Result<Grammar<KindOf<V>, NameOf<V>>, ComposeError> =>
  Result.gen(function* composeGrammar() {
    compositions.publish(list);

    const stated = list.map((entry) => entry.facets);
    const base = yield* generateKinds({
      interactions: stated.flatMap((facet) => facet.interactions),
      layer: [...open.xsiAttributes, ...open.xmlAttributes, ...open.xlinkAttributes].map(
        ({ name }) => name,
      ),
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
      globalKinds: (version, parent) =>
        globalKinds.flatMap(({ kind, versions }) =>
          versions.includes(version) &&
          base.nodeKind.has(kind) &&
          open.wildcardReads(namespaceOf(parent), namespaceOf(kind))
            ? [kind]
            : [],
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
    const declaresId = new Set(
      declarations
        .filter(isIdType)
        .flatMap(({ kind, versions }) => versions.map((version) => `${version} ${kind}`)),
    );
    const xsi = yield* xsiTypesOf({
      derivations: typeDerivations,
      kinds: kinds.nodeKind,
      models: list.flatMap((entry) => entry.models),
      namespaceOf: new Map(
        list.flatMap(({ models, namespace }) =>
          models.map(({ kind }) => [kind, namespace] as const),
        ),
      ),
      versions: kinds.versions,
    });
    const governingTexts = governingTextsOf(
      new Set(list.flatMap(({ namespace }) => (namespace === "" ? [] : [namespace]))),
    );
    const attributes = yield* generateAttributes(
      {
        declarations: [...declarations, ...layerOf(kinds, declared, declaresId)],
        ...governedOf(kinds, xsi, governingTexts),
        kinds: kinds.nodeKind,
        names: kinds.attributeName,
        texts: textTypes.filter(({ kind }) => kinds.nodeKind.has(kind)),
        typeName: xsi.typeName,
        typeTexts: governingTexts,
        versions: kinds.versions,
      },
      readDomain,
    );
    const namespaces = [
      ...new Set(list.flatMap(({ namespace }) => (namespace === "" ? [] : [namespace]))),
    ];
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
      heldRootsUnder: yield* heldRootsUnder({
        classOf: (namespace, parent) => foreignKinds[namespaceClassOf(namespace, parent)],
        held: installed.content.strictlyHeld.rows,
        kinds: kinds.nodeKind,
        namespaceOf,
        reads: open.wildcardReads,
        roots: globalKinds.flatMap(({ kind, versions }) =>
          open.foreignRoots.has(kind)
            ? Option.toArray(kinds.elementName.lookup({ kind })).map(({ local, namespace }) => ({
                kind,
                local,
                namespace,
                versions,
              }))
            : [],
        ),
        versions: kinds.versions,
      }),
      include: yield* includeGrammar({
        alternatives: includeAlternativesOf(list.flatMap((entry) => entry.models)),
        kinds: kinds.nodeKind,
        versions: kinds.versions,
      }),
      kindByNameUnder: yield* namesUnder({
        admitted: admission.rows,
        kinds: kinds.nodeKind,
        nameOf: (kind) => Option.getOrUndefined(kinds.elementName.lookup({ kind })),
        versions: kinds.versions,
      }),
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
        versions: kinds.versions,
      }),
      typeAvailable: yield* typesAvailable({
        available: open.typeAvailable,
        everywhere: (type) => type === noType || typeNamespaceOf(type) === xsNamespace,
        namespaceOf: typeNamespaceOf,
        types: xsi.typeName,
        vocabularies: namespaces,
      }),
      typedCardinalities: cardinalities,
      xsi,
    };
  });

/**
 * {@link compose} memoized by its list's identity (Effect's `Function.memoize`), for
 * {@link composed}, which passes it {@link vocabularies} alone.
 */
const production = Fn.memoize((list: typeof vocabularies) => compose(list));

/**
 * Compose production's list, {@link vocabularies}, once per process: the first call composes it,
 * and every later call returns that same result.
 *
 * A composition takes seconds and production's list never changes, so every reader of the grammar
 * shares one: `install.ts` when it loads, and every test, whether or not its file loads
 * `install.ts` too. `compose(vocabularies)` composes it again, and the test support fails a test
 * file that composes it twice (`src/test/compositions.ts`).
 *
 * @returns The grammar, or the first generator's refusal.
 */
export const composed = (): Result.Result<ComposedGrammar, ComposeError> =>
  production(vocabularies);
