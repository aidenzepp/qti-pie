/**
 * The content-model deriver: it reads every vocabulary's XSDs, in each schema version, into the
 * content-model IR of `src/vocab/inventory/types.ts`, and prints the generated leaf
 * `src/vocab/inventory/models.ts` (review R12, with R10's derived versions).
 *
 * Run it from `packages/pantry` as `node src/vocab/derive/models.ts`. It reads only the files
 * `sources.ts` pins and touches no database, and it imports nothing that reads the leaf, so it
 * still runs while the leaf is being rewritten:
 *
 * ```sh
 * node src/vocab/derive/models.ts > src/vocab/inventory/models.ts
 * pnpm exec vp fmt src/vocab/inventory/models.ts
 * ```
 *
 * `models.test.ts` beside it checks that a re-run reproduces the committed leaf byte for byte.
 *
 * Reading rules, beyond those of the IR's module comment:
 *
 * - **The schemas of a version.** Each version reads its own ASI, content-packaging, CSM,
 *   content-packaging extension and AfA DRD XSDs; the LOM, QTI metadata, usage data, MathML, SSML
 *   XInclude and `xml.xsd` XSDs are the same files in both. SSML is its no-namespace file as the
 *   core profile includes it as a chameleon and redefines it (`ssml.ts`).
 * - **The kinds.** Every element declaration of those schemas, global or local, that is not abstract
 *   is a kind of the vocabulary of its namespace: its handle prefix and local name
 *   (`namespaces.ts`), unless the element is declared with several types, when its type's naming
 *   decision names it (`naming.ts`). An element of several types with an undecided type is refused.
 *   An anonymous type is told apart by the top-level group it is written in, as MathML's three
 *   `semantics` declarations are ({@link declaredOf}).
 * - **A kind's model.** A declaration of a named or anonymous complex type reads that type; of a
 *   simple type, `simple`; of no type, its substitution group head's, else `xs:anyType`'s, which is
 *   mixed content of one lax `##any` wildcard, any number of times. A kind declared more than once
 *   in a version has one model; declarations of one kind with two models are refused, since a
 *   naming decision then names each.
 * - **Empty content.** A model group that is empty content by XML Schema 1.0 Part 1, §3.4.2, clause
 *   2.1 (an empty `xs:sequence` or `xs:all`, an empty optional `xs:choice`, any group of
 *   `maxOccurs` 0) adds no particle, and a type left with none is `empty`, unless it is mixed.
 * - **Wildcards.** A wildcard's target namespace is its kind's (see {@link modelsOf}).
 * - **Types.** A model states its element's declared type, and every named type and built-in its
 *   derivations ({@link derivationsOf}): the `xsi:type` values an element of it may name. A `block`
 *   is refused, and so is a derivation a `final` forbids.
 * - **Sources.** Every model and particle cites, per version, the file and line of the construct it
 *   is read from (`sources.ts`'s lines, joined to the tree by document order).
 * - **Versions.** A kind whose models agree in both versions, in structure and type, is one row of
 *   both, its sources aligned with the versions.
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Array as Arr, Console, Effect, Layer, Match, Option, Order, Result } from "effect";
import { Command } from "effect/cli";
import { Digest } from "effect/crypto";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import {
  attributeOf,
  contentParticles,
  elementsOf,
  firstXs,
  indexSchemas,
  isAbstract,
  isCompositor,
  isXs,
  loadSchemaSet,
  mixedOf,
  occursOf,
  particlesOf,
  refuse,
  requireAttribute,
  requireComponent,
  resolve,
} from "#pantry/vocab/derive/derive.ts";
import type { XsdReadingError, XsdSchema } from "#pantry/vocab/derive/derive.ts";
import { decidedHandleOf, isDecided } from "#pantry/vocab/derive/naming.ts";
import { builtinBases } from "#pantry/vocab/derive/domains.ts";
import { readPlaced } from "#pantry/vocab/derive/sources.ts";
import type { Placed, SourcePath } from "#pantry/vocab/derive/sources.ts";
import { redefinitionKey, ssmlSchemaOf } from "#pantry/vocab/derive/ssml.ts";
import type {
  Compositor,
  ContentModel,
  ContentType,
  ExpandedName,
  NamespaceConstraint,
  Occurs,
  Particle,
  Processing,
  Source,
  Sources,
  TypeDerivation,
} from "#pantry/vocab/inventory/types.ts";
import {
  handlePrefixOf,
  vocabularyNamespaces,
  xmlNamespace,
  xsNamespace,
} from "#pantry/vocab/namespaces.ts";

/**
 * One schema as the IR reads it: its index, the complex types a redefinition replaces, which the
 * index holds under {@link redefinitionKey}, and where each of its elements is stated.
 */
export interface SchemaView {
  readonly redefined: ReadonlySet<string>;
  readonly schema: XsdSchema;
  readonly sourceOf: SourceOf;
}

/**
 * Find where an element of a version's schema documents is stated: its file and the line its start
 * tag begins on.
 */
export type SourceOf = (node: Element) => Result.Result<Source, XsdReadingError>;

/**
 * The schemas of one version, by target namespace.
 */
export type World = ReadonlyMap<string, SchemaView>;

/**
 * The pinned entry document of each schema a version reads, by the version: those that differ, then
 * those both read. SSML is read apart, from its two files.
 */
export const worldSources = {
  "3.0.0": [
    "imsqti_asiv3p0_v1p0.xsd",
    "imsqtiv3p0_imscpv1p2_v1p0.xsd",
    "csm/imsqtiv3p0_csmv1p1_v1p0.xsd",
    "cpext/imsqtiv3p0_cpextv1p2_v1p0.xsd",
    "drd/imsqtiv3p0_afa3p0drd_v1p0.xsd",
    "lom/imsmd_loose_v1p3p2.xsd",
    "imsqti_metadatav3p0_v1p0.xsd",
    "usagedata/imsqti_usagedatav3p0_v1p0.xsd",
    "mathml/mathml3.xsd",
    "w3/XInclude.xsd",
    "w3/xml.xsd",
  ],
  "3.0.1": [
    "imsqti_asiv3p0p1_v1p0.xsd",
    "imsqtiv3p0p1_imscpv1p2_v1p0.xsd",
    "csm/imsqtiv3p0p1_csmv1p1_v1p0.xsd",
    "cpext/imsqtiv3p0p1_cpextv1p2_v1p0.xsd",
    "drd/imsqtiv3p0p1_afa3p0drd_v1p0.xsd",
    "lom/imsmd_loose_v1p3p2.xsd",
    "imsqti_metadatav3p0_v1p0.xsd",
    "usagedata/imsqti_usagedatav3p0_v1p0.xsd",
    "mathml/mathml3.xsd",
    "w3/XInclude.xsd",
    "w3/xml.xsd",
  ],
} as const satisfies Readonly<Record<SchemaVersion, readonly SourcePath[]>>;

/**
 * The two SSML files: the no-namespace schema and the core profile that redefines it.
 */
const ssmlSources = ["ssml/synthesis-nonamespace.xsd", "ssml/ssmlv1p1-core.xsd"] as const;

/**
 * Exactly one occurrence: the bounds of a type's content as a whole.
 */
const once: Occurs = { max: Option.some(1), min: 1 };

/**
 * Where `xs:anyType`'s content is stated: by XML Schema itself, in no pinned XSD.
 */
const anyTypeSource: Source = { _tag: "spec", cite: "XML Schema 1.0 Part 1 §3.4.7 xs:anyType" };

/**
 * The model `xs:anyType` gives an element declared with no type: mixed content of a lax `##any`
 * wildcard, any number of times.
 */
const anyTypeContent: ContentType = {
  _tag: "mixed",
  particle: {
    _tag: "group",
    compositor: "sequence",
    occurs: once,
    particles: [
      {
        _tag: "any",
        namespace: "##any",
        occurs: { max: Option.none(), min: 0 },
        processing: "lax",
        sources: [anyTypeSource],
      },
    ],
    sources: [anyTypeSource],
  },
};

/**
 * The complex type a schema's type name stands for: its redefinition where one replaces it.
 *
 * @param view - The schema.
 * @param local - The type's local name in the schema's target namespace.
 * @returns The `xs:complexType` element, `None` for a name that is no complex type here.
 */
const complexTypeIn = (view: SchemaView, local: string): Option.Option<Element> =>
  Option.fromNullishOr(
    view.schema.complexTypes.get(view.redefined.has(local) ? redefinitionKey(local) : local),
  );

/**
 * What an element declaration declares its element with.
 *
 * - `complex`: a complex type, named (`name` its local name) or written in place (`anonymous`).
 * - `simple`: a simple type, built-in, named or written in place.
 * - `anyType`: no type and no substitution group head to take one from.
 */
export type Declared =
  | { readonly _tag: "anyType" }
  | {
      readonly _tag: "complex";
      readonly definition: Element;
      readonly name: string;
      readonly named: Option.Option<ExpandedName>;
    }
  | { readonly _tag: "simple"; readonly name: string; readonly named: Option.Option<ExpandedName> };

/**
 * The name a declared type is decided by: its local name, or `anonymous`.
 */
const anonymous = "anonymous";

/**
 * Whether an element of a schema document is, or holds, another, by identity.
 *
 * @param node - The element searched.
 * @param target - The element sought.
 * @returns Whether `target` is `node` or one of its descendants.
 */
const holds = (node: Element, target: Element): boolean =>
  node === target || elementsOf(node).some((child) => holds(child, target));

/**
 * Name the anonymous complex type of a local declaration: `anonymous`, or, for an element a naming
 * decision names, `anonymous in group <name>` after the top-level group the declaration is written
 * in.
 *
 * The group is what tells such an element's types apart: MathML declares `semantics` three times
 * with three anonymous types, in the groups `semantics`, `semantics-ci` and `semantics-contexp`
 * (`mathml3-common.xsd` line 72, `mathml3-strict-content.xsd` lines 65 and 84), so each is a kind
 * of its own (`naming.ts`). An element no decision names keeps `anonymous`, so its handle stays its
 * local name whatever group it sits in.
 *
 * @param view - The schema the declaration is in.
 * @param declaration - The `xs:element` declaration.
 * @returns The name its type goes by in a naming decision.
 */
const anonymousNameOf = (view: SchemaView, declaration: Element): string => {
  const { schema } = view;
  const form = Option.getOrElse(attributeOf(declaration, "form"), () =>
    schema.qualified ? "qualified" : "unqualified",
  );
  const namespace = form === "qualified" ? schema.targetNamespace : "";
  const decided = Option.exists(attributeOf(declaration, "name"), (local) =>
    isDecided(namespace, local),
  );
  const within = decided
    ? Arr.findFirst([...schema.groups], ([, group]) => holds(group, declaration))
    : Option.none();

  return Option.match(within, {
    onNone: () => anonymous,
    onSome: ([group]) => `${anonymous} in group ${group}`,
  });
};

/**
 * Read what a declaration declares its element with.
 *
 * @param view - The schema the declaration is in.
 * @param declaration - The `xs:element` declaration.
 * @returns The type, or an {@link XsdReadingError} for a type name the schema does not declare.
 */
export const declaredOf = (
  view: SchemaView,
  declaration: Element,
): Result.Result<Declared, XsdReadingError> =>
  Result.gen(function* declaredOfBody() {
    const inPlace = firstXs(declaration, "complexType");

    if (Option.isSome(inPlace)) {
      return {
        _tag: "complex",
        definition: inPlace.value,
        name: anonymousNameOf(view, declaration),
        named: Option.none(),
      } as const;
    }

    if (Option.isSome(firstXs(declaration, "simpleType"))) {
      return { _tag: "simple", name: anonymous, named: Option.none() } as const;
    }

    const type = attributeOf(declaration, "type");

    if (Option.isSome(type)) {
      const name = yield* resolve(view.schema, type.value);

      if (name.namespace === xsNamespace) {
        return name.local === "anyType"
          ? ({ _tag: "anyType" } as const)
          : ({ _tag: "simple", name: name.local, named: Option.some(name) } as const);
      }

      const complex = complexTypeIn(view, name.local);

      if (name.namespace === view.schema.targetNamespace && Option.isSome(complex)) {
        return {
          _tag: "complex",
          definition: complex.value,
          name: name.local,
          named: Option.some(name),
        } as const;
      }

      yield* requireComponent(view.schema, view.schema.simpleTypes, "simpleType", type.value);

      return { _tag: "simple", name: name.local, named: Option.some(name) } as const;
    }

    const head = attributeOf(declaration, "substitutionGroup");

    if (Option.isNone(head)) {
      return { _tag: "anyType" } as const;
    }

    const headName = yield* resolve(view.schema, head.value);
    const headDeclaration = Option.fromNullishOr(view.schema.elements.get(headName.local));

    if (headName.namespace !== view.schema.targetNamespace || Option.isNone(headDeclaration)) {
      return yield* refuse(`the substitution group head ${head.value} is not declared`);
    }

    return yield* declaredOf(view, headDeclaration.value);
  });

/**
 * The name a declared type goes by in a naming decision.
 *
 * @param declared - The type.
 * @returns Its local name, `anonymous` for one written in place, and `anyType` for none.
 */
export const typeNameOf = (declared: Declared): string =>
  declared._tag === "anyType" ? "anyType" : declared.name;

/**
 * One element declaration, as the IR reads it: its namespace and local name, its type, and whether
 * it is a top-level declaration, which a `lax` or `strict` element wildcard reads elements as.
 */
export interface Declaration {
  readonly declaration: Element;
  readonly global: boolean;
  readonly local: string;
  readonly namespace: string;
  readonly type: Declared;
}

/**
 * Every element declaration of a schema that names its element and is not abstract, in document
 * order: each top-level component, then the declarations written inside it.
 *
 * A local declaration is in the target namespace when its `form`, else the schema's
 * `elementFormDefault`, is `qualified`, and in no namespace otherwise.
 *
 * @param view - The schema.
 * @param root - The root of one of its documents.
 * @returns The declarations, or an {@link XsdReadingError} for a type the reading does not read.
 */
export const declarationsIn = (
  view: SchemaView,
  root: Element,
): Result.Result<readonly Declaration[], XsdReadingError> =>
  Result.gen(function* declarationsInBody() {
    const found: Declaration[] = [];
    const { schema } = view;
    const visit = (node: Element, global: boolean): Result.Result<void, XsdReadingError> =>
      Result.gen(function* visitBody() {
        const name = isXs(node, "element") ? attributeOf(node, "name") : Option.none();

        if (Option.isSome(name) && !(global && isAbstract(node))) {
          const form = Option.getOrElse(attributeOf(node, "form"), () =>
            schema.qualified ? "qualified" : "unqualified",
          );

          found.push({
            declaration: node,
            global,
            local: name.value,
            namespace: global || form === "qualified" ? schema.targetNamespace : "",
            type: yield* declaredOf(view, node),
          });
        }

        for (const child of elementsOf(node)) {
          yield* visit(child, false);
        }
      });

    for (const component of elementsOf(root)) {
      const held = isXs(component, "redefine") ? elementsOf(component) : [component];

      for (const each of held) {
        yield* visit(each, isXs(each, "element"));
      }
    }

    return found;
  });

/**
 * The handle of an element of a type, in the vocabulary of its namespace.
 *
 * @param namespace - The element's namespace.
 * @param local - Its local name.
 * @param type - The name its type goes by.
 * @returns The decided handle of an element of several types, else the namespace's handle prefix
 *   and the local name; an {@link XsdReadingError} for a namespace no vocabulary is in, or an
 *   element of several types whose type no decision names.
 */
export const handleOf = (
  namespace: string,
  local: string,
  type: string,
): Result.Result<string, XsdReadingError> =>
  Option.match(decidedHandleOf(namespace, local, type), {
    onNone: () =>
      isDecided(namespace, local)
        ? refuse(
            `the element {${namespace}}${local} of type ${type} has no handle in src/vocab/derive/naming.ts, which names its other types`,
          )
        : Option.match(handlePrefixOf(namespace), {
            onNone: () => refuse(`no vocabulary is in the namespace "${namespace}" of ${local}`),
            onSome: (prefix) => Result.succeed(`${prefix}${local}`),
          }),
    onSome: Result.succeed,
  });

/**
 * The kinds a reference to a global element stands for: the element unless it is abstract, then
 * each member of its substitution group, read the same way, in document order.
 *
 * @param view - The schema that declares the element.
 * @param local - Its local name.
 * @param seen - The heads being read around it, so a circular group, which XML Schema forbids,
 *   ends.
 * @returns The kinds.
 */
const substitutesOf = (
  view: SchemaView,
  local: string,
  seen: ReadonlySet<string>,
): Result.Result<readonly string[], XsdReadingError> =>
  Result.gen(function* substitutesOfBody() {
    const { schema } = view;
    const declaration = Option.fromNullishOr(schema.elements.get(local));
    const kinds: string[] = [];

    if (Option.isSome(declaration) && !isAbstract(declaration.value)) {
      kinds.push(
        yield* handleOf(
          schema.targetNamespace,
          local,
          typeNameOf(yield* declaredOf(view, declaration.value)),
        ),
      );
    }

    for (const member of schema.substitutions.get(local) ?? []) {
      if (!seen.has(member)) {
        kinds.push(...(yield* substitutesOf(view, member, new Set([...seen, local]))));
      }
    }

    return kinds;
  });

/**
 * The kinds an element particle stands for.
 *
 * @param world - The version's schemas.
 * @param view - The schema the particle is written in.
 * @param particle - The `xs:element` particle.
 * @returns A local declaration's one kind, or a reference's kinds ({@link substitutesOf}), in the
 *   schema of the referenced element's namespace; an {@link XsdReadingError} for a reference into
 *   a namespace the version reads no schema of, or one that stands for no kind.
 */
const kindsOf = (
  world: World,
  view: SchemaView,
  particle: Element,
): Result.Result<readonly [string, ...string[]], XsdReadingError> =>
  Result.gen(function* kindsOfBody() {
    const named = attributeOf(particle, "name");
    let kinds: readonly string[];

    if (Option.isSome(named)) {
      const form = Option.getOrElse(attributeOf(particle, "form"), () =>
        view.schema.qualified ? "qualified" : "unqualified",
      );
      const namespace = form === "qualified" ? view.schema.targetNamespace : "";

      kinds = [
        yield* handleOf(namespace, named.value, typeNameOf(yield* declaredOf(view, particle))),
      ];
    } else {
      const ref = yield* requireAttribute(particle, "ref");
      const target = yield* resolve(view.schema, ref);
      const holder = Option.fromNullishOr(world.get(target.namespace));

      if (Option.isNone(holder)) {
        return yield* refuse(`the reference ${ref} names a namespace no pinned schema declares`);
      }

      kinds = yield* substitutesOf(holder.value, target.local, new Set());
    }

    return yield* Option.match(Arr.head(kinds), {
      onNone: () => refuse(`the element particle ${particle.qname} stands for no kind`),
      onSome: (first) => Result.succeed([first, ...kinds.slice(1)] as const),
    });
  });

/**
 * The namespace constraints an `xs:any` may write, which the IR keeps as written.
 */
const namespaceConstraints: readonly NamespaceConstraint[] = ["##any", "##local", "##other"];

/**
 * The `processContents` values.
 */
const processings: readonly Processing[] = ["lax", "skip", "strict"];

/**
 * Read one value of a closed set an XSD attribute holds.
 *
 * @param node - The construct.
 * @param name - The attribute.
 * @param fallback - Its XSD default.
 * @param values - The values the reading covers.
 * @returns The value, or an {@link XsdReadingError} for one outside them.
 */
const closedValueOf = <A extends string>(
  node: Element,
  name: string,
  fallback: A,
  values: readonly A[],
): Result.Result<A, XsdReadingError> => {
  const value = Option.getOrElse(attributeOf(node, name), () => fallback);

  return Option.match(
    Arr.findFirst(values, (known) => known === value),
    {
      onNone: () => refuse(`an ${node.qname} has ${name}="${value}", which the IR does not read`),
      onSome: Result.succeed,
    },
  );
};

/**
 * The compositors, by their element names.
 */
const compositors: readonly Compositor[] = ["all", "choice", "sequence"];

/**
 * The compositor a compositor element is.
 *
 * @param node - An `xs:sequence`, `xs:choice` or `xs:all`.
 * @returns Its compositor.
 */
const compositorOf = (node: Element): Compositor =>
  Option.getOrElse(
    Arr.findFirst(compositors, (compositor) => isXs(node, compositor)),
    () => "sequence" as const,
  );

/**
 * Read one particle to the IR.
 *
 * @param world - The version's schemas.
 * @param view - The schema the particle is written in.
 * @param node - An `xs:element`, `xs:any`, `xs:group` reference or compositor.
 * @param occurs - The particle's bounds: its own, or for a group definition's compositor the
 *   reference's.
 * @returns The particle, or an {@link XsdReadingError}.
 */
const particleOf = (
  world: World,
  view: SchemaView,
  node: Element,
  occurs: Occurs,
): Result.Result<Particle, XsdReadingError> =>
  Result.gen(function* particleOfBody() {
    const sources = [yield* view.sourceOf(node)] as const;

    if (isXs(node, "element")) {
      return {
        _tag: "element",
        kinds: yield* kindsOf(world, view, node),
        occurs,
        sources,
      } as const;
    }

    if (isXs(node, "any")) {
      return {
        _tag: "any",
        namespace: yield* closedValueOf(node, "namespace", "##any", namespaceConstraints),
        occurs,
        processing: yield* closedValueOf(node, "processContents", "strict", processings),
        sources,
      } as const;
    }

    if (isXs(node, "group")) {
      const ref = yield* requireAttribute(node, "ref");
      const held = particlesOf(
        yield* requireComponent(view.schema, view.schema.groups, "group", ref),
      );
      const [compositor] = held;

      if (held.length !== 1 || compositor === undefined || !isCompositor(compositor)) {
        return yield* refuse(`the group ${ref} holds ${held.length} particles, not one compositor`);
      }

      return { ...(yield* particleOf(world, view, compositor, occurs)), sources };
    }

    if (isCompositor(node)) {
      const particles: Particle[] = [];

      for (const particle of particlesOf(node)) {
        particles.push(yield* particleOf(world, view, particle, yield* occursOf(particle)));
      }

      return { _tag: "group", compositor: compositorOf(node), occurs, particles, sources } as const;
    }

    return yield* refuse(`an ${node.qname} stands where a particle is read`);
  });

/**
 * Whether one model group a type's content writes is empty content, as XML Schema 1.0 Part 1,
 * §3.4.2, clause 2.1, reads it: an `xs:all` or `xs:sequence` with no particle (2.1.2), an
 * `xs:choice` with no particle and `minOccurs` 0 (2.1.3), or any of the four, a group reference
 * included, with `maxOccurs` 0 (2.1.4). A group reference whose group's compositor is empty is not:
 * it is a particle, so the content is element-only, and admits whitespace.
 *
 * @param node - An `xs:all`, `xs:choice`, `xs:sequence` or `xs:group` reference among a type's or a
 *   derivation step's children.
 * @returns Whether it is empty content, or an {@link XsdReadingError} for an unread bound.
 */
const isEmptyContent = (node: Element): Result.Result<boolean, XsdReadingError> =>
  Result.map(occursOf(node), (occurs) => {
    const held = particlesOf(node).length > 0;

    return (
      Option.contains(occurs.max, 0) ||
      ((isXs(node, "all") || isXs(node, "sequence")) && !held) ||
      (isXs(node, "choice") && !held && occurs.min === 0)
    );
  });

/**
 * Read a complex type's `{content type}` to the IR.
 *
 * Each derivation step's model group is its effective content unless it is empty content
 * ({@link isEmptyContent}), and an extension's content is its base's followed by its own
 * (XML Schema 1.0 Part 1, §3.4.2, clause 3.2), so the type's particles are every step's non-empty
 * group, base first. A type with none is `empty` unless it is mixed, which admits character data
 * alone; one with any is element-only or mixed.
 *
 * @param world - The version's schemas.
 * @param view - The schema the type is in.
 * @param complexType - The `xs:complexType` element.
 * @returns Its content type.
 */
export const contentTypeOf = (
  world: World,
  view: SchemaView,
  complexType: Element,
): Result.Result<ContentType, XsdReadingError> =>
  Result.gen(function* contentTypeOfBody() {
    if (Option.isSome(firstXs(complexType, "simpleContent"))) {
      return { _tag: "simple" } as const;
    }

    const nodes = yield* contentParticles(view.schema, complexType);
    const particles: Particle[] = [];

    for (const node of nodes) {
      if (!(yield* isEmptyContent(node))) {
        particles.push(yield* particleOf(world, view, node, yield* occursOf(node)));
      }
    }

    const particle: Particle = {
      _tag: "group",
      compositor: "sequence",
      occurs: once,
      particles,
      sources: [yield* view.sourceOf(complexType)],
    };

    if (yield* mixedOf(view.schema, complexType)) {
      return { _tag: "mixed", particle } as const;
    }

    return particles.length === 0
      ? ({ _tag: "empty" } as const)
      : ({ _tag: "element-only", particle } as const);
  });

/**
 * A kind's model in one version, and where the version states it: its type's `xs:complexType`, or
 * its element's `xs:element` for a type with no complex definition.
 */
export interface Modeled {
  readonly content: ContentType;
  readonly source: Source;
  readonly type: Option.Option<ExpandedName>;
}

/**
 * `xs:anyType`, the type of an element declared with none.
 */
const anyTypeName: ExpandedName = { local: "anyType", namespace: xsNamespace };

/**
 * The expanded name of a declaration's type: `xs:anyType` for none, `None` for a type written in
 * place.
 *
 * @param declared - The type.
 * @returns Its name.
 */
const declaredNameOf = (declared: Declared): Option.Option<ExpandedName> =>
  declared._tag === "anyType" ? Option.some(anyTypeName) : declared.named;

/**
 * A particle's structure, without its sources, as text.
 *
 * @param particle - The particle.
 * @returns A key two particles share exactly when their structures are equal.
 */
const particleStructureOf = (particle: Particle): string => {
  const bounds = `${particle.occurs.min}..${Option.match(particle.occurs.max, { onNone: () => "n", onSome: String })}`;

  return Match.valueTags(particle, {
    any: ({ namespace, processing }) => `any ${namespace} ${processing} ${bounds}`,
    element: ({ kinds }) => `element ${kinds.join(" ")} ${bounds}`,
    group: ({ compositor, particles }) =>
      `${compositor} ${bounds} (${particles.map(particleStructureOf).join(", ")})`,
  });
};

/**
 * A model's structure: its content without the sources of its particles, which two declarations or
 * two versions that agree on a model may state on different lines.
 *
 * @param content - The model.
 * @returns A key two models share exactly when their structures are equal.
 */
const structureOf = (content: ContentType): string =>
  content._tag === "element-only" || content._tag === "mixed"
    ? `${content._tag} ${particleStructureOf(content.particle)}`
    : content._tag;

/**
 * Join two particles of one structure: each node's sources, the left's then the right's.
 *
 * @param left - The particle of the earlier versions.
 * @param right - The same particle of a later version.
 * @returns The particle with both sources.
 */
const joined = (left: Particle, right: Particle): Particle => {
  const sources: Sources = [...left.sources, ...right.sources];

  return left._tag === "group" && right._tag === "group"
    ? {
        ...left,
        particles: left.particles.map((inner, at) =>
          joined(inner, Arr.getUnsafe(right.particles, at)),
        ),
        sources,
      }
    : { ...left, sources };
};

/**
 * Join two models of one structure ({@link joined}).
 *
 * @param left - The model of the earlier versions.
 * @param right - The same model of a later version.
 * @returns The model with both sources.
 */
const joinedContent = (left: ContentType, right: ContentType): ContentType =>
  (left._tag === "element-only" || left._tag === "mixed") &&
  (right._tag === "element-only" || right._tag === "mixed")
    ? { ...left, particle: joined(left.particle, right.particle) }
    : left;

/**
 * Whether a model holds an element wildcard.
 *
 * @param content - The model.
 * @returns Whether an `any` particle sits anywhere in it.
 */
const holdsWildcard = (content: ContentType): boolean => {
  const visit = (particle: Particle): boolean =>
    particle._tag === "any" || (particle._tag === "group" && particle.particles.some(visit));

  return (content._tag === "element-only" || content._tag === "mixed") && visit(content.particle);
};

/**
 * Read one version's content models: one per kind its schemas declare.
 *
 * A wildcard's namespace test is the target namespace of the schema document it is written in
 * (XML Schema 1.0, §3.10.2; a chameleon include's, the including schema's, §4.2.1), and the IR
 * keeps no namespace beside a wildcard: it reads a wildcard's own namespace as its kind's, which a
 * namespace class relative to the parent (`src/vocab/open.ts`) then reads off the parent element.
 * That holds by construction here, since a declaration's type, its bases and its groups are read
 * only from the declaration's own schema, but an unqualified local declaration is in no namespace
 * while its schema has one, so a model that holds a wildcard and breaks it is refused.
 *
 * @param world - The version's schemas.
 * @param documents - Every document of those schemas, each with the schema it belongs to.
 * @returns Each kind's model, by kind, in declaration order.
 */
export const modelsOf = (
  world: World,
  documents: readonly (readonly [SchemaView, XmlDocument])[],
): Result.Result<ReadonlyMap<string, Modeled>, XsdReadingError> =>
  Result.gen(function* modelsOfBody() {
    const models = new Map<string, Modeled>();

    for (const [view, document] of documents) {
      for (const { declaration, local, namespace, type } of yield* declarationsIn(
        view,
        document.root,
      )) {
        const content: ContentType = yield* Match.valueTags(type, {
          anyType: () => Result.succeed(anyTypeContent),
          complex: ({ definition }) => contentTypeOf(world, view, definition),
          simple: () => Result.succeed<ContentType>({ _tag: "simple" }),
        });

        if (holdsWildcard(content) && namespace !== view.schema.targetNamespace) {
          return yield* refuse(
            `the element {${namespace}}${local} holds a wildcard written in a schema whose target namespace is ${view.schema.targetNamespace === "" ? "absent" : view.schema.targetNamespace}, but the IR reads a wildcard's target namespace as its element's`,
          );
        }

        const kind = yield* handleOf(namespace, local, typeNameOf(type));
        const known = Option.fromNullishOr(models.get(kind));
        const source = yield* view.sourceOf(
          type._tag === "complex" ? type.definition : declaration,
        );

        if (Option.isNone(known)) {
          models.set(kind, { content, source, type: declaredNameOf(type) });
        } else if (structureOf(known.value.content) !== structureOf(content)) {
          return yield* refuse(
            `the kind ${kind} is declared with two content models; name each of its types in src/vocab/derive/naming.ts`,
          );
        }
      }
    }

    return models;
  });

/**
 * Merge the versions' readings into rows: each kind's model once for the versions that agree on
 * its structure and its type, each particle's and the model's sources aligned with those versions.
 *
 * @param readings - Each version's models, in roster order.
 * @returns The rows, by kind in code-point order, then by their first version.
 */
export const rowsOf = (
  readings: readonly (readonly [SchemaVersion, ReadonlyMap<string, Modeled>])[],
): readonly ContentModel[] => {
  const rows: ContentModel[] = [];
  const kinds = Arr.sort(
    Arr.dedupe(readings.flatMap(([, models]) => [...models.keys()])),
    Order.String,
  );

  for (const kind of kinds) {
    const held: {
      content: ContentType;
      readonly sources: Source[];
      readonly structure: string;
      readonly type: Option.Option<ExpandedName>;
      readonly versions: SchemaVersion[];
    }[] = [];

    for (const [version, models] of readings) {
      const modeled = models.get(kind);

      if (modeled !== undefined) {
        const structure = `${structureOf(modeled.content)} ${JSON.stringify(Option.getOrNull(modeled.type))}`;
        const same = held.find((row) => row.structure === structure);

        if (same === undefined) {
          held.push({
            content: modeled.content,
            sources: [modeled.source],
            structure,
            type: modeled.type,
            versions: [version],
          });
        } else {
          same.content = joinedContent(same.content, modeled.content);
          same.sources.push(modeled.source);
          same.versions.push(version);
        }
      }
    }

    for (const { content, sources, type, versions } of held) {
      const [first, ...rest] = versions;
      const [firstSource, ...restSources] = sources;

      if (first !== undefined && firstSource !== undefined) {
        rows.push({
          content,
          kind,
          sources: [firstSource, ...restSources],
          type,
          versions: [first, ...rest],
        });
      }
    }
  }

  return rows;
};

/**
 * Every element of a tree, in document order: the order their start tags stand in the file.
 *
 * @param node - The tree's root.
 * @returns The elements.
 */
const inDocumentOrder = (node: Element): readonly Element[] => [
  node,
  ...elementsOf(node).flatMap(inDocumentOrder),
];

/**
 * The XSD attributes that block a derivation from standing in for its base in an instance, through
 * `xsi:type` (XML Schema 1.0 Part 1, §3.3.2, §3.4.2): no pinned XSD writes one, so every derivation
 * the bases chain is one `xsi:type` may name.
 */
const blockers = ["block", "blockDefault"] as const;

/**
 * How a type is derived from its base.
 */
type DerivationMethod = "extension" | "list" | "restriction" | "union";

/**
 * Every derivation method, which `#all` stands for in a `final`.
 */
const derivationMethods: readonly DerivationMethod[] = [
  "extension",
  "list",
  "restriction",
  "union",
];

/**
 * The derivation methods a `final` or `finalDefault` value forbids: each one it lists, or all for
 * `#all`.
 *
 * @param value - The attribute's value.
 * @returns The methods.
 */
const finalOf = (value: string): ReadonlySet<string> =>
  new Set(value.trim() === "#all" ? derivationMethods : value.trim().split(/\s+/u));

/**
 * The name of `xs:anySimpleType`, the base of every primitive, list and union.
 */
const anySimpleTypeName: ExpandedName = { local: "anySimpleType", namespace: xsNamespace };

/**
 * A type's base in XML Schema's type hierarchy: a complex type's derivation step's `base`, or
 * `xs:anyType` for one with none (Part 1, §3.4.2); a simple type's restriction base, through an
 * anonymous base to its own, or `xs:anySimpleType` for a list or a union (§3.14.2).
 *
 * @param view - The schema the type is in.
 * @param definition - The `xs:complexType` or `xs:simpleType`.
 * @returns The base's name, or an {@link XsdReadingError} for a derivation step that names none.
 */
const baseOf = (
  view: SchemaView,
  definition: Element,
): Result.Result<
  { readonly base: ExpandedName; readonly method: DerivationMethod },
  XsdReadingError
> =>
  Result.gen(function* baseOfBody() {
    if (isXs(definition, "complexType")) {
      const content = Option.orElse(firstXs(definition, "complexContent"), () =>
        firstXs(definition, "simpleContent"),
      );

      if (Option.isNone(content)) {
        return { base: anyTypeName, method: "restriction" } as const;
      }

      const step = Arr.findFirst(
        elementsOf(content.value),
        (node) => isXs(node, "extension") || isXs(node, "restriction"),
      );

      if (Option.isNone(step)) {
        return yield* refuse(`a ${content.value.qname} holds no derivation step`);
      }

      const { local, namespace } = yield* resolve(
        view.schema,
        yield* requireAttribute(step.value, "base"),
      );

      return {
        base: { local, namespace },
        method: isXs(step.value, "extension") ? "extension" : "restriction",
      } as const;
    }

    const restriction = firstXs(definition, "restriction");

    if (Option.isNone(restriction)) {
      return {
        base: anySimpleTypeName,
        method: Option.isSome(firstXs(definition, "list")) ? "list" : "union",
      } as const;
    }

    const base = attributeOf(restriction.value, "base");

    if (Option.isSome(base)) {
      const { local, namespace } = yield* resolve(view.schema, base.value);

      return { base: { local, namespace }, method: "restriction" } as const;
    }

    const inline = firstXs(restriction.value, "simpleType");

    return Option.isSome(inline)
      ? { base: (yield* baseOf(view, inline.value)).base, method: "restriction" as const }
      : yield* refuse("a simple type's restriction names no base");
  });

/**
 * The key of an expanded name in a map.
 *
 * @param name - The name.
 * @returns `{namespace}local`.
 */
const nameKey = ({ local, namespace }: ExpandedName): string => `{${namespace}}${local}`;

/**
 * Order expanded names by namespace, then local name.
 */
const byName: Order.Order<ExpandedName> = Order.combine(
  Order.mapInput(Order.String, ({ namespace }: ExpandedName) => namespace),
  Order.mapInput(Order.String, ({ local }: ExpandedName) => local),
);

/**
 * The derivation methods each named type of some documents forbids its derivations: its own
 * `final`, or its document's `finalDefault` (XML Schema 1.0 Part 1, §3.4.2, §3.14.2).
 *
 * @param documents - The documents, each with its schema.
 * @returns The methods, by the type's {@link nameKey}, for each type that forbids any.
 */
const finalsIn = (
  documents: readonly (readonly [SchemaView, XmlDocument])[],
): ReadonlyMap<string, ReadonlySet<string>> => {
  const finals = new Map<string, ReadonlySet<string>>();

  for (const [view, document] of documents) {
    const fallback = attributeOf(document.root, "finalDefault");

    for (const component of elementsOf(document.root).flatMap((node) =>
      isXs(node, "redefine") ? elementsOf(node) : [node],
    )) {
      const local = attributeOf(component, "name");
      const final = Option.orElse(attributeOf(component, "final"), () => fallback);

      if (
        (isXs(component, "complexType") || isXs(component, "simpleType")) &&
        Option.isSome(local) &&
        Option.isSome(final)
      ) {
        finals.set(
          nameKey({ local: local.value, namespace: view.schema.targetNamespace }),
          finalOf(final.value),
        );
      }
    }
  }

  return finals;
};

/**
 * Read one version's type derivations: for every named type of its schemas and every built-in,
 * the named types validly derived from it, itself first, then the rest by distance down the chain
 * of bases, nearest first, then by name.
 *
 * @param world - The version's schemas.
 * @param documents - Every document of those schemas, which are checked to write no blocker.
 * @returns Each type's derived types, by its {@link nameKey}, or an {@link XsdReadingError} for a
 *   blocker, which the reading would have to subtract.
 */
export const derivationsOf = (
  world: World,
  documents: readonly (readonly [SchemaView, XmlDocument])[],
): Result.Result<ReadonlyMap<string, TypeDerivationReading>, XsdReadingError> =>
  Result.gen(function* derivationsOfBody() {
    for (const [, document] of documents) {
      for (const node of inDocumentOrder(document.root)) {
        const blocker = blockers.find((name) => Option.isSome(attributeOf(node, name)));

        if (blocker !== undefined) {
          return yield* refuse(
            `an ${node.qname} writes ${blocker}, whose blocked derivations the reading does not subtract`,
          );
        }
      }
    }

    const finals = finalsIn(documents);

    const bases = new Map<string, readonly [ExpandedName, Option.Option<ExpandedName>]>();

    for (const [local, base] of builtinBases) {
      bases.set(nameKey({ local, namespace: xsNamespace }), [
        { local, namespace: xsNamespace },
        base.pipe(Option.map((named) => ({ local: named, namespace: xsNamespace }))),
      ]);
    }

    for (const view of new Set(world.values())) {
      for (const [local, definition] of [...view.schema.complexTypes, ...view.schema.simpleTypes]) {
        // A redefinition stands under its own key beside the type it replaces, whose name and base
        // are the type's.
        if (!local.endsWith(redefinitionKey(""))) {
          const name = { local, namespace: view.schema.targetNamespace };
          const { base, method } = yield* baseOf(view, definition);

          if (finals.get(nameKey(base))?.has(method) === true) {
            return yield* refuse(
              `the type ${nameKey(name)} derives by ${method} from ${nameKey(base)}, whose final forbids it`,
            );
          }

          bases.set(nameKey(name), [name, Option.some(base)]);
        }
      }
    }

    const children = new Map<string, ExpandedName[]>();

    for (const [name, base] of bases.values()) {
      for (const held of Option.toArray(base)) {
        children.set(nameKey(held), [...(children.get(nameKey(held)) ?? []), name]);
      }
    }

    const derivations = new Map<string, TypeDerivationReading>();

    for (const [key, [name]] of bases) {
      const derived: ExpandedName[] = [name];
      let level: readonly ExpandedName[] = [name];

      while (level.length > 0) {
        level = Arr.sort(
          level.flatMap((held) => children.get(nameKey(held)) ?? []),
          byName,
        );
        derived.push(...level);
      }

      derivations.set(key, { derived: [name, ...derived.slice(1)], type: name });
    }

    return derivations;
  });

/**
 * One type's derivations in one version.
 */
export interface TypeDerivationReading {
  readonly derived: readonly [ExpandedName, ...ExpandedName[]];
  readonly type: ExpandedName;
}

/**
 * Merge the versions' derivations into rows: each type's once for the versions that agree on it.
 *
 * @param readings - Each version's derivations, in roster order.
 * @returns The rows, by type name, then by their first version.
 */
export const derivationRowsOf = (
  readings: readonly (readonly [SchemaVersion, ReadonlyMap<string, TypeDerivationReading>])[],
): readonly TypeDerivation[] => {
  const held = new Map<string, { reading: TypeDerivationReading; versions: SchemaVersion[] }>();

  for (const [version, derivations] of readings) {
    for (const reading of derivations.values()) {
      const key = JSON.stringify([reading.type, reading.derived]);
      const same = held.get(key);

      if (same === undefined) {
        held.set(key, { reading, versions: [version] });
      } else {
        same.versions.push(version);
      }
    }
  }

  return Arr.sort(
    [...held.values()].flatMap(({ reading, versions }) => {
      const [first, ...rest] = versions;

      return first === undefined ? [] : [{ ...reading, versions: [first, ...rest] as const }];
    }),
    Order.combine(
      Order.mapInput(byName, ({ type }: TypeDerivation) => type),
      Order.mapInput(Order.String, ({ versions }: TypeDerivation) => versions[0]),
    ),
  );
};

/**
 * The documents one version's schemas are read from, each with its file and the lines of its start
 * tags: each entry document's pin with its documents in reading order, and SSML's two files.
 */
export interface WorldDocuments {
  readonly sets: readonly (readonly [SourcePath, readonly Placed[]])[];
  readonly ssml: readonly [base: Placed, core: Placed];
}

/**
 * Read the documents of one version's schemas: each pinned entry document with the documents it
 * includes, and SSML's two files.
 *
 * @param version - The version.
 * @returns The documents.
 */
export const loadWorldDocuments = Effect.fn("vocab.loadWorldDocuments")(
  function* loadWorldDocuments(version: SchemaVersion) {
    const sets: (readonly [SourcePath, readonly Placed[]])[] = [];

    for (const source of worldSources[version]) {
      sets.push([source, [...(yield* loadSchemaSet(source)).placed.values()]]);
    }

    const [base, core] = yield* Effect.all(
      [readPlaced(ssmlSources[0]), readPlaced(ssmlSources[1])],
      {
        concurrency: 2,
      },
    );

    return { sets, ssml: [base, core] } satisfies WorldDocuments;
  },
);

/**
 * Index where every element of some documents is stated, joining each tree's elements to its
 * file's start-tag lines by document order.
 *
 * @param placed - The documents, each with its file and lines.
 * @returns The lookup, or an {@link XsdReadingError} for a document whose tree and file hold
 *   different numbers of elements, which no join by order can place.
 */
const sourcesIn = (placed: readonly Placed[]): Result.Result<SourceOf, XsdReadingError> =>
  Result.gen(function* sourcesInBody() {
    const located = new WeakMap<Element, Source>();

    for (const { document, file, lines } of placed) {
      const elements = inDocumentOrder(document.root);

      if (elements.length !== lines.length) {
        return yield* refuse(
          `${file} holds ${elements.length} elements in its tree but ${lines.length} start tags`,
        );
      }

      for (const [at, element] of elements.entries()) {
        located.set(element, { _tag: "xsd", file, line: Arr.getUnsafe(lines, at) });
      }
    }

    return (node: Element) =>
      Option.match(Option.fromNullishOr(located.get(node)), {
        onNone: () => refuse(`an ${node.qname} that no document of the version holds`),
        onSome: (source) => Result.succeed(source),
      });
  });

/**
 * Index one version's schemas from their documents: each set as one schema, and SSML's
 * no-namespace file as its core profile redefines it.
 *
 * @param read - The documents.
 * @returns The schemas by namespace, every document with its schema, and each namespace's entry
 *   document, the one its schema is read from.
 */
export const worldOf = (
  read: WorldDocuments,
): Result.Result<
  {
    readonly documents: readonly (readonly [SchemaView, XmlDocument])[];
    readonly entries: readonly (readonly [string, SourcePath])[];
    readonly world: World;
  },
  XsdReadingError
> =>
  Result.gen(function* worldOfBody() {
    const sourceOf = yield* sourcesIn([
      ...read.sets.flatMap(([, set]) => set),
      read.ssml[0],
      read.ssml[1],
    ]);
    const views = new Map<string, SchemaView>();
    const documents: (readonly [SchemaView, XmlDocument])[] = [];
    const entries: (readonly [string, SourcePath])[] = [];

    for (const [source, set] of read.sets) {
      const view: SchemaView = {
        redefined: new Set(),
        schema: yield* indexSchemas(set.map(({ document }) => document)),
        sourceOf,
      };

      views.set(view.schema.targetNamespace, view);
      entries.push([view.schema.targetNamespace, source]);
      documents.push(...set.map(({ document }) => [view, document] as const));
    }

    const [base, core] = read.ssml;
    const ssml = yield* ssmlSchemaOf(base.document, core.document);
    const ssmlView: SchemaView = { redefined: ssml.redefined, schema: ssml.schema, sourceOf };

    views.set(ssml.schema.targetNamespace, ssmlView);
    documents.push([ssmlView, base.document]);
    entries.push([ssml.schema.targetNamespace, ssmlSources[1]]);

    return { documents, entries, world: views };
  });

/**
 * Read one version's schemas: each pinned entry document with the documents it includes, and SSML
 * from its two files.
 *
 * @param version - The version.
 * @returns The schemas by namespace, every document with its schema, and each namespace's entry
 *   document, the one its schema is read from.
 */
export const loadWorld = Effect.fn("vocab.loadWorld")(function* loadWorld(version: SchemaVersion) {
  return yield* Effect.fromResult(worldOf(yield* loadWorldDocuments(version)));
});

/**
 * Read every version's content models into the leaf's rows.
 *
 * @returns The rows.
 */
export const loadModels = Effect.fn("vocab.loadModels")(function* loadModels() {
  const readings: (readonly [SchemaVersion, ReadonlyMap<string, Modeled>])[] = [];
  const derivations: (readonly [SchemaVersion, ReadonlyMap<string, TypeDerivationReading>])[] = [];

  for (const version of schemaVersions) {
    const { documents, world } = yield* loadWorld(version);

    readings.push([version, yield* Effect.fromResult(modelsOf(world, documents))]);
    derivations.push([version, yield* Effect.fromResult(derivationsOf(world, documents))]);
  }

  return {
    derivations: derivationRowsOf(derivations),
    models: rowsOf(readings),
  } satisfies ModelsLeaf;
});

/**
 * The models leaf's rows: every kind's content model, and every type's derivations.
 */
export interface ModelsLeaf {
  readonly derivations: readonly TypeDerivation[];
  readonly models: readonly ContentModel[];
}

/**
 * The lines of a JSDoc comment; `vp fmt` wraps them.
 *
 * @param paragraphs - Each paragraph as its lines.
 * @returns The comment, from its opening line to its closing one.
 */
const commentOf = (paragraphs: readonly (readonly string[])[]): readonly string[] => [
  "/**",
  ...paragraphs.flatMap((lines, index) => [
    ...(index === 0 ? [] : [" *"]),
    ...lines.map((line) => ` * ${line}`),
  ]),
  " */",
];

/**
 * The names of the four common occurrences, by range.
 */
const commonOccurs: ReadonlyMap<string, string> = new Map([
  ["0..1", "optional"],
  ["0..n", "many"],
  ["1..1", "once"],
  ["1..n", "some"],
]);

/**
 * The name of one occurrence the leaf states as a constant.
 *
 * @param occurs - The occurrence.
 * @returns `once`, `optional`, `many` or `some` for the four common ones, else
 *   `between<min>And<max>` or `atLeast<min>`.
 */
const occursName = ({ max, min }: Occurs): string => {
  const range = `${min}..${Option.match(max, { onNone: () => "n", onSome: String })}`;

  return (
    commonOccurs.get(range) ??
    Option.match(max, {
      onNone: () => `atLeast${min}`,
      onSome: (bound) => `between${min}And${bound}`,
    })
  );
};

/**
 * The stem of a namespace's constant in the leaf: XML Schema's and XML's own, or the vocabulary's
 * name from `namespaces.ts`.
 *
 * @param namespace - The namespace.
 * @returns The stem, `None` for a namespace no vocabulary names.
 */
const namespaceNameOf = (namespace: string): Option.Option<string> => {
  if (namespace === xsNamespace) {
    return Option.some("xs");
  }

  if (namespace === xmlNamespace) {
    return Option.some("xml");
  }

  return Option.map(
    Arr.findFirst(
      Object.entries(vocabularyNamespaces),
      ([, vocabulary]) => vocabulary.namespace === namespace,
    ),
    ([name]) => name,
  );
};

/**
 * Write an identifier stem from a handle: `qti-item-body` is `qtiItemBody`, `m:mi` is `mMi`.
 *
 * @param handle - The handle.
 * @returns The stem.
 */
const camelOf = (handle: string): string =>
  handle
    .split(/[^A-Za-z0-9]+/u)
    .filter((part) => part !== "")
    .map((part, index) => (index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join("");

/**
 * The smallest particle the leaf states as a constant when it recurs: an element particle of more
 * kinds than this, or any group.
 */
const hoistedKinds = 3;

/**
 * Whether a particle is worth a constant of its own when it recurs.
 *
 * @param particle - The particle.
 * @returns Whether it is a group or an element particle of many kinds.
 */
const hoistable = (particle: Particle): boolean =>
  particle._tag === "group" ||
  (particle._tag === "element" && particle.kinds.length > hoistedKinds);

/**
 * A helper the models leaf may define: the IR types it names, whether it comes before the
 * occurrence constants (which call it), and its lines.
 */
interface Helper {
  readonly before: boolean;
  readonly imports: readonly string[];
  readonly lines: readonly string[];
}

/**
 * The helpers the models leaf defines, each only when the leaf calls it, in this order.
 */
const helpers = {
  all: {
    before: false,
    imports: ["Occurs", "Particle", "Sources"],
    lines: [
      ...commentOf([
        ["An `all` group."],
        [
          "@param occurs - Its bounds.",
          "@param sources - Where each version states it.",
          "@param particles - Its particles.",
          "@returns The particle.",
        ],
      ]),
      "const all = (",
      "  occurs: Occurs,",
      "  sources: Sources,",
      "  ...particles: readonly Particle[]",
      "): Particle => ({",
      '  _tag: "group",',
      '  compositor: "all",',
      "  occurs,",
      "  particles,",
      "  sources,",
      "});",
    ],
  },
  bounded: {
    before: true,
    imports: ["Occurs"],
    lines: [
      ...commentOf([
        ["Bounds with a greatest count."],
        ["@param min - The least.", "@param max - The greatest.", "@returns The occurrence."],
      ]),
      "const bounded = (min: number, max: number): Occurs => ({ max: Option.some(max), min });",
    ],
  },
  choice: {
    before: false,
    imports: ["Occurs", "Particle", "Sources"],
    lines: [
      ...commentOf([
        ["A `choice` group."],
        [
          "@param occurs - Its bounds.",
          "@param sources - Where each version states it.",
          "@param particles - Its alternatives.",
          "@returns The particle.",
        ],
      ]),
      "const choice = (",
      "  occurs: Occurs,",
      "  sources: Sources,",
      "  ...particles: readonly Particle[]",
      "): Particle => ({",
      '  _tag: "group",',
      '  compositor: "choice",',
      "  occurs,",
      "  particles,",
      "  sources,",
      "});",
    ],
  },
  element: {
    before: false,
    imports: ["Occurs", "Particle", "Sources"],
    lines: [
      ...commentOf([
        ["An element particle."],
        [
          "@param occurs - Its bounds.",
          "@param sources - Where each version states it.",
          "@param kinds - The kinds it stands for.",
          "@returns The particle.",
        ],
      ]),
      "const element = (",
      "  occurs: Occurs,",
      "  sources: Sources,",
      "  ...kinds: readonly [string, ...string[]]",
      "): Particle => ({",
      '  _tag: "element",',
      "  kinds,",
      "  occurs,",
      "  sources,",
      "});",
    ],
  },
  elementOnly: {
    before: false,
    imports: ["ContentType", "Particle"],
    lines: [
      ...commentOf([
        ["Element content alone."],
        ["@param particle - Its particle.", "@returns The content type."],
      ]),
      'const elementOnly = (particle: Particle): ContentType => ({ _tag: "element-only", particle });',
    ],
  },
  empty: {
    before: false,
    imports: ["ContentType"],
    lines: [...commentOf([["No content."]]), 'const empty: ContentType = { _tag: "empty" };'],
  },
  everyVersion: {
    before: false,
    imports: [],
    lines: [
      ...commentOf([["Both schema versions."]]),
      'const everyVersion = ["3.0.0", "3.0.1"] as const;',
    ],
  },
  mixed: {
    before: false,
    imports: ["ContentType", "Particle"],
    lines: [
      ...commentOf([
        ["Element content with character data between the children."],
        ["@param particle - Its particle.", "@returns The content type."],
      ]),
      'const mixed = (particle: Particle): ContentType => ({ _tag: "mixed", particle });',
    ],
  },
  model: {
    before: false,
    imports: ["ContentModel", "ContentType", "ExpandedName", "Sources"],
    lines: [
      ...commentOf([
        ["One row."],
        [
          "@param kind - The kind.",
          "@param versions - The versions it holds in.",
          "@param sources - Where each version states it.",
          "@param type - Its element's declared type, `None` for one written in place.",
          "@param content - Its content type.",
          "@returns The row.",
        ],
      ]),
      "const model = (",
      "  kind: string,",
      "  versions: readonly [SchemaVersion, ...SchemaVersion[]],",
      "  sources: Sources,",
      "  type: Option.Option<ExpandedName>,",
      "  content: ContentType,",
      "): ContentModel => ({ content, kind, sources, type, versions });",
    ],
  },
  sequence: {
    before: false,
    imports: ["Occurs", "Particle", "Sources"],
    lines: [
      ...commentOf([
        ["A `sequence` group."],
        [
          "@param occurs - Its bounds.",
          "@param sources - Where each version states it.",
          "@param particles - Its particles.",
          "@returns The particle.",
        ],
      ]),
      "const sequence = (",
      "  occurs: Occurs,",
      "  sources: Sources,",
      "  ...particles: readonly Particle[]",
      "): Particle => ({",
      '  _tag: "group",',
      '  compositor: "sequence",',
      "  occurs,",
      "  particles,",
      "  sources,",
      "});",
    ],
  },
  simple: {
    before: false,
    imports: ["ContentType"],
    lines: [
      ...commentOf([["Character data of a simple type alone."]]),
      'const simple: ContentType = { _tag: "simple" };',
    ],
  },
  unbounded: {
    before: true,
    imports: ["Occurs"],
    lines: [
      ...commentOf([
        ["Bounds with no greatest count."],
        ["@param min - The least.", "@returns The occurrence."],
      ]),
      "const unbounded = (min: number): Occurs => ({ max: Option.none(), min });",
    ],
  },
  wildcard: {
    before: false,
    imports: ["NamespaceConstraint", "Occurs", "Particle", "Processing", "Sources"],
    lines: [
      ...commentOf([
        ["An element wildcard."],
        [
          "@param occurs - Its bounds.",
          "@param sources - Where each version states it.",
          "@param namespace - Its namespace constraint.",
          "@param processing - Its processing.",
          "@returns The particle.",
        ],
      ]),
      "const wildcard = (",
      "  occurs: Occurs,",
      "  sources: Sources,",
      "  namespace: NamespaceConstraint,",
      "  processing: Processing,",
      '): Particle => ({ _tag: "any", namespace, occurs, processing, sources });',
    ],
  },
} as const satisfies Readonly<Record<string, Helper>>;

/**
 * The name of a helper the models leaf may define.
 */
type HelperName = keyof typeof helpers;

/**
 * The helpers' names, in the order the leaf defines them.
 */
const helperNames: readonly HelperName[] = Object.keys(helpers).filter((name): name is HelperName =>
  Object.hasOwn(helpers, name),
);

/**
 * Writes sources into a generated leaf: each as `xsd(file, line)` or `spec(cite)`, each file once
 * as a constant named after its path.
 */
export interface SourcesWriter {
  /**
   * Write one row's sources.
   *
   * @param sources - The sources.
   * @returns Their expression.
   */
  readonly expression: (sources: Sources) => string;
  /**
   * The helpers and file constants the expressions written so far call, to stand before them.
   *
   * @returns The lines.
   */
  readonly preamble: () => readonly string[];
}

/**
 * Write a line number as the lint writes numbers: its digits grouped by three with `_` from five
 * digits on.
 *
 * @param value - The number.
 * @returns Its numeral.
 */
const numeralOf = (value: number): string =>
  value < 10_000 ? String(value) : String(value).replaceAll(/\B(?=(?:\d{3})+$)/gu, "_");

/**
 * Start writing sources into a leaf.
 *
 * @returns The writer, with no file named yet.
 */
export const sourcesWriter = (): SourcesWriter => {
  const files = new Map<SourcePath, string>();
  let cited = false;
  const write = (source: Source): string =>
    Match.valueTags(source, {
      spec: ({ cite }) => {
        cited = true;

        return `spec(${JSON.stringify(cite)})`;
      },
      xsd: ({ file, line }) => {
        const name = files.get(file) ?? camelOf(file);

        files.set(file, name);

        return `xsd(${name}, ${numeralOf(line)})`;
      },
    });

  return {
    expression: (sources) => `[${sources.map(write).join(", ")}]`,
    preamble: () => [
      ...(cited
        ? [
            ...commentOf([
              ["Where a specification states a construct no pinned XSD writes."],
              ["@param cite - The text that states it.", "@returns The source."],
            ]),
            'const spec = (cite: string): Source => ({ _tag: "spec", cite });',
            "",
          ]
        : []),
      ...(files.size > 0
        ? [
            ...commentOf([
              ["Where a pinned XSD states a construct."],
              [
                "@param file - The pinned file.",
                "@param line - The line its start tag begins on.",
                "@returns The source.",
              ],
            ]),
            'const xsd = (file: SourcePath, line: number): Source => ({ _tag: "xsd", file, line });',
            "",
          ]
        : []),
      ...Arr.sort(
        [...files],
        Order.mapInput(Order.String, ([file]: readonly [string, string]) => file),
      ).flatMap(([file, name]) => [
        ...commentOf([[`The pinned \`${file}\`.`]]),
        `const ${name}: SourcePath = ${JSON.stringify(file)};`,
        "",
      ]),
    ],
  };
};

/**
 * The particle a content type holds: element and mixed content's, none for the others.
 *
 * @param content - The content type.
 * @returns Its particle, or none.
 */
const particlesOfRow = (content: ContentType): readonly Particle[] =>
  content._tag === "element-only" || content._tag === "mixed" ? [content.particle] : [];

/**
 * Write a row's versions: `everyVersion` for all of them.
 *
 * @param versions - The versions.
 * @returns Their expression.
 */
const versionsExpression = (versions: readonly SchemaVersion[]): string =>
  versions.length === schemaVersions.length ? "everyVersion" : JSON.stringify(versions);

/**
 * Write the content-model leaf, unformatted.
 *
 * The module states each occurrence once as a constant, then each particle that recurs once as a
 * constant named after the first kind that holds it, inner constants first, then the rows.
 *
 * @param rows - The rows, in leaf order.
 * @returns The module text, without a final line break, which `vp fmt` turns into the committed
 *   leaf.
 */
export const renderModels = ({ derivations, models: rows }: ModelsLeaf): string => {
  const uses = new Map<string, number>();
  const count = (particle: Particle): void => {
    const key = JSON.stringify(particle);

    uses.set(key, (uses.get(key) ?? 0) + 1);
    if (particle._tag === "group") {
      for (const inner of particle.particles) {
        count(inner);
      }
    }
  };

  for (const { content } of rows) {
    for (const particle of particlesOfRow(content)) {
      count(particle);
    }
  }

  const writer = sourcesWriter();
  const sourcesExpression = writer.expression;
  const occursUsed = new Map<string, Occurs>();
  const hoisted = new Map<string, string>();
  const taken = new Set<string>();
  const constants: string[] = [];
  const expression = (particle: Particle, owner: string): string => {
    const key = JSON.stringify(particle);
    const known = hoisted.get(key);

    if (known !== undefined) {
      return known;
    }

    const occurs = occursName(particle.occurs);

    occursUsed.set(occurs, particle.occurs);

    const sources = sourcesExpression(particle.sources);
    const written = Match.valueTags(particle, {
      any: ({ namespace, processing }) =>
        `wildcard(${occurs}, ${sources}, ${JSON.stringify(namespace)}, ${JSON.stringify(processing)})`,
      element: ({ kinds }) =>
        `element(${[occurs, sources, ...kinds.map((kind) => JSON.stringify(kind))].join(", ")})`,
      group: ({ compositor, particles }) =>
        `${compositor}(${[occurs, sources, ...particles.map((inner) => expression(inner, owner))].join(", ")})`,
    });

    if (hoistable(particle) && (uses.get(key) ?? 0) > 1) {
      const stem = `${camelOf(owner)}Particle`;
      let name = stem;

      for (let suffix = 2; taken.has(name); suffix += 1) {
        name = `${stem}${suffix}`;
      }

      taken.add(name);
      hoisted.set(key, name);
      constants.push(
        ...commentOf([[`A particle that recurs, first held by \`${owner}\`.`]]),
        `const ${name} = ${written};`,
        "",
      );

      return name;
    }

    return written;
  };
  const contentExpression = (content: ContentType, owner: string): string =>
    Match.valueTags(content, {
      "element-only": ({ particle }) => `elementOnly(${expression(particle, owner)})`,
      empty: () => "empty",
      mixed: ({ particle }) => `mixed(${expression(particle, owner)})`,
      simple: () => "simple",
    });
  const namespaceNames = new Map<string, string>();
  const nameExpression = ({ local, namespace }: ExpandedName): string => {
    const known = [...namespaceNames].find(([held]) => held === namespace);
    const written =
      known?.[1] ??
      `${Option.getOrElse(namespaceNameOf(namespace), () => `namespace${namespaceNames.size + 1}`)}Namespace`;

    namespaceNames.set(namespace, written);

    return `named(${written}, ${JSON.stringify(local)})`;
  };
  const body = rows.map(
    ({ content, kind, sources, type, versions }) =>
      `  model(${JSON.stringify(kind)}, ${versionsExpression(versions)}, ${sourcesExpression(sources)}, ${Option.match(type, { onNone: () => "anonymous", onSome: (named) => `Option.some(${nameExpression(named)})` })}, ${contentExpression(content, kind)}),`,
  );
  const derivationBody = derivations.map(
    ({ derived, type, versions }) =>
      `  derivation(${nameExpression(type)}, ${versionsExpression(versions)}, ${derived.map(nameExpression).join(", ")}),`,
  );
  const used = new Set<HelperName>(["model"]);
  const note = (text: string): void => {
    for (const name of helperNames) {
      if (new RegExp(`\\b${name}\\b`, "u").test(text)) {
        used.add(name);
      }
    }
  };

  for (const line of [...constants, ...body]) {
    note(line);
  }

  if (occursUsed.size > 0) {
    used.add("bounded");
  }

  const occursLines = Arr.sort(
    [...occursUsed],
    Order.mapInput(Order.String, ([name]: readonly [string, Occurs]) => name),
  ).flatMap(([name, { max, min }]) => {
    const written = Option.match(max, {
      onNone: () => `unbounded(${min})`,
      onSome: (bound) => `bounded(${min}, ${bound})`,
    });

    note(written);

    return [
      ...commentOf([
        [`The bounds ${min}..${Option.match(max, { onNone: () => "n", onSome: String })}.`],
      ]),
      `const ${name} = ${written};`,
      "",
    ];
  });

  return [
    ...commentOf([
      [
        `The content-model IR of every kind the pinned XSDs declare, in every schema version: ${rows.length} rows over ${new Set(rows.map((row) => row.kind)).size} kinds.`,
      ],
      [
        "Generated by `node src/vocab/derive/models.ts` and formatted with `vp fmt`; `src/vocab/derive/models.test.ts` checks that a re-run reproduces this file byte for byte. The reading rules are `src/vocab/inventory/types.ts`'s and the deriver's.",
      ],
    ]),
    'import { Option } from "effect";',
    "",
    "import type {",
    ...Arr.sort(
      Arr.dedupe([
        "ExpandedName",
        "Source",
        "TypeDerivation",
        ...helperNames.filter((name) => used.has(name)).flatMap((name) => helpers[name].imports),
      ]),
      Order.String,
    ).map((name) => `  ${name},`),
    '} from "#pantry/vocab/inventory/types.ts";',
    'import type { SchemaVersion } from "#pantry/grammar/kinds.ts";',
    'import type { SourcePath } from "#pantry/vocab/derive/sources.ts";',
    "",
    ...helperNames.flatMap((name) =>
      used.has(name) && helpers[name].before ? [...helpers[name].lines, ""] : [],
    ),
    ...writer.preamble(),
    ...commentOf([
      ["A name in a namespace."],
      ["@param namespace - The namespace.", "@param local - The local name.", "@returns The name."],
    ]),
    "const named = (namespace: string, local: string): ExpandedName => ({ local, namespace });",
    "",
    ...commentOf([["The declared type of an element whose type is written in place."]]),
    "const anonymous: Option.Option<ExpandedName> = Option.none();",
    "",
    ...commentOf([
      ["One type's derivations."],
      [
        "@param type - The type.",
        "@param versions - The versions they hold in.",
        "@param derived - The types validly derived from it, itself first.",
        "@returns The row.",
      ],
    ]),
    "const derivation = (",
    "  type: ExpandedName,",
    "  versions: readonly [SchemaVersion, ...SchemaVersion[]],",
    "  ...derived: readonly [ExpandedName, ...ExpandedName[]]",
    "): TypeDerivation => ({ derived, type, versions });",
    "",
    ...Arr.sort(
      [...namespaceNames],
      Order.mapInput(Order.String, ([, name]: readonly [string, string]) => name),
    ).flatMap(([namespace, name]) => [
      ...commentOf([[`The namespace ${namespace === "" ? "of no name" : namespace}.`]]),
      `const ${name} = ${JSON.stringify(namespace)};`,
      "",
    ]),
    ...occursLines,
    ...helperNames.flatMap((name) =>
      used.has(name) && !helpers[name].before ? [...helpers[name].lines, ""] : [],
    ),
    ...constants,
    ...commentOf([["Every kind's content model, by kind, each version once."]]),
    "export const contentModels: readonly ContentModel[] = [",
    ...body,
    "];",
    "",
    ...commentOf([
      [
        "Every named type's and built-in's derivations, by type name, each version once: the `xsi:type` values an element of the type admits (XML Schema 1.0 Part 1, §3.4.6, §3.14.6).",
      ],
    ]),
    "export const typeDerivations: readonly TypeDerivation[] = [",
    ...derivationBody,
    "];",
  ].join("\n");
};

/**
 * The command line: it prints the models leaf to standard output.
 */
const command = Command.make(
  "models",
  {},
  Effect.fn("vocab.deriveModelsCommand")(function* deriveModelsCommand() {
    yield* Console.log(renderModels(yield* loadModels()));
  }),
).pipe(
  Command.withDescription(
    "Print the content-model IR leaf, read from the pinned XSDs in ~/.cache/gr8des/qti3/xsd.",
  ),
);

if (import.meta.main) {
  NodeRuntime.runMain(
    Command.run(command, { version: "0.0.0" }).pipe(
      Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto)),
    ),
  );
}
