/**
 * The content-model IR: one derived reading of every kind's content model, per schema version,
 * that the grammar projects into admission, `Order`'s ranks, the child-set occurrence laws and
 * operator arity (review R12). The deriver writes it as a generated leaf; nothing restates it.
 *
 * A model is the XSD's own: its `{content type}` (XML Schema 1.0 Part 1, 3.4.1) and, for element
 * content, the particle tree its content particles make, with each particle's own occurrence
 * bounds. Nothing is flattened, multiplied or merged here: a projection reads the structure it
 * needs, so `Order` reads the sequences and choices, the occurrence laws read the bounds, and
 * admission reads the element particles' kinds and the wildcards.
 *
 * Reading rules, which the deriver applies to every vocabulary:
 *
 * - A complex type's particles are its own, after its base type's for a `complexContent` extension,
 *   as one sequence that occurs once. A restriction states its whole content itself.
 * - A group reference is the compositor its group definition holds, under the reference's bounds.
 * - An element particle stands for the kinds its element is under the parent: one, or every member of
 *   a substitution group its reference heads, abstract heads left out, in document order. A kind is
 *   its handle as the vocabulary names it (`m:mi`, `ssml:p`, `xi:include`,
 *   `qti-content-body.testRubric`), resolved under the parent by the type the particle declares.
 * - An `xs:any` particle keeps its namespace constraint and processing as the XSD writes them, the
 *   defaults `##any` and `strict` filled in. What it admits (`foreign-element`, the globally
 *   declared kinds) is the grammar's projection, not the IR's.
 * - Content of `empty` or `simple` type has no particle. `simple` content's text type is the
 *   inventory entry's `content`, which the attribute grammar reads as `TextDomain`.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-1/#Complex_Type_Definition_details | XML Schema 1.0, The Complex Type Definition Schema Component}
 * @see {@link https://www.w3.org/TR/xmlschema-1/#Particle_details | XML Schema 1.0, The Particle Schema Component}
 */
import type { Option } from "effect";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";

/**
 * The `whiteSpace` class of a simple type: `preserve`, `replace` or `collapse` as its facet or its
 * built-in base says, a list's `collapse`, and `union` for a union whose members are not all
 * `collapse`.
 */
export type WhiteSpace = "collapse" | "preserve" | "replace" | "union";

/**
 * The name of an XSD facet: the twelve of XML Schema 1.0 Part 2, 4.3.
 */
export type FacetName =
  | "enumeration"
  | "fractionDigits"
  | "length"
  | "maxExclusive"
  | "maxInclusive"
  | "maxLength"
  | "minExclusive"
  | "minInclusive"
  | "minLength"
  | "pattern"
  | "totalDigits"
  | "whiteSpace";

/**
 * One facet an anonymous restriction states: its name and its `value` as written.
 */
export interface Facet {
  readonly facet: FacetName;
  readonly value: string;
}

/**
 * A simple type as a definition refers to it: a named type, by its QName with a built-in spelled
 * `xs:`, or an anonymous type's definition.
 */
export type TypeReading = { readonly _tag: "named"; readonly name: string } | InlineType;

/**
 * An anonymous simple type's definition: a restriction of a base by its facets in document order,
 * a list of an item type, or a union of member types, the `memberTypes` first, then the anonymous
 * members in document order.
 */
export type InlineType =
  | { readonly _tag: "list"; readonly item: TypeReading }
  | { readonly _tag: "restriction"; readonly base: TypeReading; readonly facets: readonly Facet[] }
  | { readonly _tag: "union"; readonly members: readonly TypeReading[] };

/**
 * The simple type a value is read under: its designator (its QName, a built-in spelled `xs:`, or
 * for an anonymous type `list`, `union` or its restriction's base), its anonymous definition
 * (`None` for a named type) and its `whiteSpace` class.
 */
export interface ValueType {
  readonly inline: Option.Option<InlineType>;
  readonly type: string;
  readonly whiteSpace: WhiteSpace;
}

/**
 * An XSD primitive datatype (XML Schema Part 2, 3.2), or `anySimpleType`, the simple ur-type.
 */
export type Primitive =
  | "anySimpleType"
  | "anyURI"
  | "base64Binary"
  | "boolean"
  | "date"
  | "dateTime"
  | "decimal"
  | "double"
  | "duration"
  | "float"
  | "gDay"
  | "gMonth"
  | "gMonthDay"
  | "gYear"
  | "gYearMonth"
  | "hexBinary"
  | "NOTATION"
  | "QName"
  | "string"
  | "time";

/**
 * An XSD built-in simple type (XML Schema Part 2, 3.2 and 3.3): a primitive, or one of the derived
 * built-ins.
 */
export type XsdBuiltin =
  | Primitive
  | "ENTITIES"
  | "ENTITY"
  | "ID"
  | "IDREF"
  | "IDREFS"
  | "NCName"
  | "NMTOKEN"
  | "NMTOKENS"
  | "Name"
  | "byte"
  | "int"
  | "integer"
  | "language"
  | "long"
  | "negativeInteger"
  | "nonNegativeInteger"
  | "nonPositiveInteger"
  | "normalizedString"
  | "positiveInteger"
  | "short"
  | "token"
  | "unsignedByte"
  | "unsignedInt"
  | "unsignedLong"
  | "unsignedShort";

/**
 * A simple type's value domain, resolved through its whole derivation (review U1): an atomic type
 * by the primitive it restricts, a list by its item type's domain, a union by its members'.
 *
 * An atomic domain's `builtin` is the first built-in its derivation meets, read from the type down:
 * `ID` for a restriction of `xs:ID`, `int` for `xs:int`, `string` for an anonymous restriction of
 * `xs:string`. It is what tells an `ID` or an `IDREF` from the `NCName` it restricts, which every
 * facet leaves alike (XML Schema Part 1, 3.3.4).
 *
 * `facets` are the facets in force, each once but `enumeration`, whose values are all listed: the
 * most derived step's value of each, the `whiteSpace` in force always among them on an atomic type
 * and a list. `patterns` are the `pattern` facets, one set per derivation step that states any: a
 * value matches one pattern of each set (XML Schema Part 2, 4.3.4), after its `whiteSpace`
 * normalization.
 */
export type Domain =
  | {
      readonly _tag: "atomic";
      readonly builtin: XsdBuiltin;
      readonly facets: readonly Facet[];
      readonly patterns: readonly (readonly string[])[];
      readonly primitive: Primitive;
    }
  | {
      readonly _tag: "list";
      readonly facets: readonly Facet[];
      readonly item: Domain;
      readonly patterns: readonly (readonly string[])[];
    }
  | {
      readonly _tag: "union";
      readonly facets: readonly Facet[];
      readonly members: readonly Domain[];
      readonly patterns: readonly (readonly string[])[];
    };

/**
 * A particle's occurrence bounds: its `minOccurs`, and its `maxOccurs`, `None` for `unbounded`.
 */
export interface Occurs {
  readonly max: Option.Option<number>;
  readonly min: number;
}

/**
 * The namespace constraint of an `xs:any` particle as the pinned XSDs write it: any namespace,
 * any but the schema's target namespace and none, or no namespace.
 */
export type NamespaceConstraint = "##any" | "##local" | "##other";

/**
 * How a schema processor assesses what a wildcard admits: against a declaration where one is
 * found (`lax`), never (`skip`), or only against one (`strict`).
 */
export type Processing = "lax" | "skip" | "strict";

/**
 * The compositor of a model group.
 */
export type Compositor = "all" | "choice" | "sequence";

/**
 * Where a construct of the IR is stated.
 *
 * - `xsd`: in a pinned XSD, at the line its start tag begins on, counting from 1.
 * - `spec`: by a specification's text and no pinned XSD, as `xs:anyType`'s content is by XML Schema
 *   1.0 Part 1, §3.4.7, or a spec reading's restatement of a model: `cite` names it.
 */
export type Source =
  | { readonly _tag: "spec"; readonly cite: string }
  | { readonly _tag: "xsd"; readonly file: SourcePath; readonly line: number };

/**
 * Where a row's construct is stated in each schema version the row holds in, aligned with its
 * `versions`: the first source is the first version's.
 */
export type Sources = readonly [Source, ...Source[]];

/**
 * One particle of a content model, with its own occurrence bounds and where each version states
 * it, aligned with its model's versions.
 *
 * - `element`: an element particle, as the kinds it stands for under its parent, at least one. Its
 *   source is its `xs:element`.
 * - `any`: an element wildcard. Its source is its `xs:any`.
 * - `group`: a model group, its particles in document order. Its source is its compositor, or the
 *   `xs:group` that references it; a type's content as a whole is its `xs:complexType`.
 */
export type Particle =
  | {
      readonly _tag: "element";
      readonly kinds: readonly [string, ...string[]];
      readonly occurs: Occurs;
      readonly sources: Sources;
    }
  | {
      readonly _tag: "any";
      readonly namespace: NamespaceConstraint;
      readonly occurs: Occurs;
      readonly processing: Processing;
      readonly sources: Sources;
    }
  | {
      readonly _tag: "group";
      readonly compositor: Compositor;
      readonly occurs: Occurs;
      readonly particles: readonly Particle[];
      readonly sources: Sources;
    };

/**
 * A complex type's `{content type}`: no content, character data of a simple type, element content
 * alone, or element content with character data between the children. Only element content has a
 * particle: one `sequence` group that occurs once.
 */
export type ContentType =
  | { readonly _tag: "element-only"; readonly particle: Particle }
  | { readonly _tag: "empty" }
  | { readonly _tag: "mixed"; readonly particle: Particle }
  | { readonly _tag: "simple" };

/**
 * One kind's content model in the schema versions it holds in, each version at most once over the
 * kind's models: a kind whose model the versions' XSDs agree on is one row of both, whatever lines
 * they state it on. Its sources are its type's `xs:complexType`, or its element's `xs:element` for
 * a type with no complex definition, aligned with its versions.
 */
export interface ContentModel {
  readonly content: ContentType;
  readonly kind: string;
  readonly sources: Sources;
  /**
   * Its element's declared type: a named type of a pinned XSD or a built-in (in XML Schema's
   * namespace, `xs:anyType` for an element declared with none), or `None` for a type written in
   * place, which no type is derived from. The type is part of the row: versions that give a kind
   * one structure under two type names are two rows.
   */
  readonly type: Option.Option<ExpandedName>;
  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];
}

/**
 * A name in a namespace, as `{namespace, local}`: an XSD type's, the namespace empty for none.
 */
export interface ExpandedName {
  readonly local: string;
  readonly namespace: string;
}

/**
 * The named types validly derived from a type in the schema versions it holds in (XML Schema 1.0
 * Part 1, §3.4.6 and §3.14.6), the ones an `xsi:type` on an element of the type may name: the type
 * itself first, then every named type whose chain of bases reaches it, nearest first, then by
 * namespace and local name. No pinned XSD writes `block`, `final`, `blockDefault` or
 * `finalDefault`, so no derivation is blocked.
 */
export interface TypeDerivation {
  readonly derived: readonly [ExpandedName, ...ExpandedName[]];
  readonly type: ExpandedName;
  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];
}

/**
 * One kind of a vocabulary: its handle and its element's local name.
 */
export interface RosterKind {
  readonly handle: string;
  readonly local: string;
}

/**
 * One vocabulary as the pinned XSDs declare it: the namespace its elements are in, its kinds in
 * code order, which is the order its XSDs first declare them in, and the attribute handles its
 * kinds declare, in the order they first declare them. A roster is append-only: a pinned XSD keeps
 * the order, and a kind an XSD stops declaring leaves its code a hole.
 */
export interface VocabularyRoster {
  readonly attributes: readonly string[];
  readonly kinds: readonly RosterKind[];
  readonly name: string;
  readonly namespace: string;
}

/**
 * One attribute a kind declares in the schema versions it holds in: its handle (the local name,
 * or `xml:lang` for a reference into the XML namespace), its use and default, the simple type its
 * value is read under, that type's resolved domain, and where each version declares it. A kind
 * declares a name at most once in a version.
 */
export interface AttributeDeclaration {
  readonly default: Option.Option<string>;
  readonly domain: Domain;
  readonly kind: string;
  readonly name: string;
  /**
   * The `xs:attribute` that declares or references it, aligned with its versions.
   */
  readonly sources: Sources;
  readonly type: ValueType;
  readonly use: "optional" | "required";
  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];
}

/**
 * A kind's attribute wildcard in the schema versions it holds in, as XML Schema 1.0 Part 1, 3.4.2,
 * builds it from its type's own and its base types' `xs:anyAttribute`.
 */
export interface AttributeWildcard {
  readonly kind: string;
  readonly namespace: NamespaceConstraint;
  readonly processing: Processing;
  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];
}

/**
 * A kind a schema declares globally, a top-level `xs:element` that is not abstract, in the schema
 * versions it holds in: the kinds a `lax` or `strict` element wildcard reads an element as.
 */
export interface GlobalKind {
  readonly kind: string;
  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];
}

/**
 * The simple type of a kind's text, for a kind whose content is text alone, in the schema versions
 * it holds in: its element's simple type, or its complex type's simple content's.
 */
export interface TextType {
  readonly domain: Domain;
  readonly kind: string;
  readonly type: ValueType;
  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];
}

/**
 * An attribute a schema declares globally, which kinds admit under its closed handle: the four
 * `xml.xsd` declares and the four XML Schema declares in its instance namespace, with the type
 * its value is read under and that type's domain.
 */
export interface GlobalAttributeDeclaration {
  readonly domain: Domain;
  readonly name: string;
  readonly type: ValueType;
}
