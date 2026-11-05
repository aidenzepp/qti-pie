/**
 * The grammar tests' shared generators and oracles.
 *
 * - **The XSD as a second implementation.** {@link loadXsd} reads a pinned schema set and
 *   {@link xsdContents} walks it from its global elements, giving each kind the content model and
 *   attribute uses its declaration states. It is written from XML Schema Part 1, apart from the
 *   vocabulary deriver (`src/vocab/derive/`), so the grammar's relations are checked against an
 *   independent reading: {@link precedence} is "x may come before y" in some valid content
 *   (Glushkov's position automaton, follow⁺), and {@link wordOf} draws valid child sequences by
 *   construction, which `xmllint` re-checks ({@link validateContents}).
 * - **Toy compositions** ({@link toyVocabulary}): vocabularies that compose through production's
 *   `compose`, so a generated grammar is built the production way.
 */
import { NodeChildProcessSpawner, NodeServices } from "@effect/platform-node";
import type { Result } from "effect";
import { Array as Arr, Effect, FileSystem, Layer, Option, pipe, Stream } from "effect";
import { Digest } from "effect/crypto";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import type { Element } from "@qti-pie/crust/tree.ts";
import type { Gen } from "@grizzle/testing/gen";
import type { AdmittedChild } from "#pantry/grammar/admission.ts";
import { compose } from "#pantry/grammar/compose.ts";
import type { ComposeError, Grammar, Vocabulary } from "#pantry/grammar/compose.ts";
import { noFacets } from "#pantry/grammar/facets.ts";
import type { Facets } from "#pantry/grammar/facets.ts";
import type { Roster } from "#pantry/grammar/closed.ts";
import type { KindOf, NameOf, SchemaVersion } from "#pantry/grammar/kinds.ts";
import { readSource, sourcePaths, sources, xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import type { Source, Sources } from "#pantry/vocab/inventory/types.ts";
import { xmlNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The XML Schema namespace.
 */
const xs = "http://www.w3.org/2001/XMLSchema";

/**
 * The namespace of namespace declarations.
 */
const xmlns = "http://www.w3.org/2000/xmlns/";

/**
 * An element or attribute name, as an instance spells it.
 */
export interface XsdName {
  readonly local: string;
  readonly namespace: string;
}

/**
 * Spell a name as `{namespace}local`, the key of its component.
 *
 * @param name - The name.
 * @returns The key.
 */
export const nameKey = ({ local, namespace }: XsdName): string => `{${namespace}}${local}`;

/**
 * One schema document of a set, with what reading its QNames needs.
 */
interface SchemaDocument {
  /**
   * Whether local element declarations are in the target namespace.
   */
  readonly elementsQualified: boolean;
  readonly prefixes: ReadonlyMap<string, string>;
  /**
   * The target namespace, the includer's for a chameleon document.
   */
  readonly target: string;
}

/**
 * A named component and the document it is read in.
 */
interface Component {
  readonly document: SchemaDocument;
  readonly node: Element;
}

/**
 * A schema set: its global components by `{namespace}local`, the originals of the components a
 * redefinition replaced, and each substitution group's direct members.
 */
export interface XsdSet {
  readonly attributeGroups: ReadonlyMap<string, Component>;
  readonly attributes: ReadonlyMap<string, Component>;
  readonly elements: ReadonlyMap<string, Component>;
  readonly groups: ReadonlyMap<string, Component>;
  readonly members: ReadonlyMap<string, readonly string[]>;
  readonly originals: ReadonlyMap<string, Component>;
  readonly types: ReadonlyMap<string, Component>;
}

/**
 * The XSD element children of a schema node.
 *
 * @param node - The node.
 * @param local - Only children of this local name, or every one.
 * @returns The children.
 */
const xsChildren = (node: Element, local?: string): readonly Element[] =>
  node.children.filter(
    (child): child is Element =>
      child.kind === "element" &&
      child.namespace === xs &&
      (local === undefined || child.local === local),
  );

/**
 * Read an unqualified attribute of a schema node.
 *
 * @param node - The node.
 * @param local - The attribute's local name.
 * @returns Its value, or none.
 */
const attributeOf = (node: Element, local: string): Option.Option<string> =>
  Option.map(
    Arr.findFirst(node.attributes, (held) => held.namespace === "" && held.local === local),
    (held) => held.value,
  );

/**
 * Resolve a QName as a schema document reads it.
 *
 * The `xml` prefix is bound to the XML namespace by definition, and needs no declaration
 * (Namespaces in XML 1.0, §3), so no pinned XSD declares it: a `ref="xml:lang"` names `xml.xsd`'s
 * `lang`, never an unqualified one.
 *
 * @param document - The document.
 * @param qname - The QName.
 * @returns Its expanded name. An unprefixed name with no default namespace is in the document's
 *   target namespace, as a chameleon include reads it.
 * @see {@link https://www.w3.org/TR/xml-names/#ns-decl | Namespaces in XML 1.0, Declaring Namespaces}
 */
const qnameOf = (document: SchemaDocument, qname: string): XsdName => {
  const colon = qname.indexOf(":");
  if (colon === -1) {
    return { local: qname, namespace: document.prefixes.get("") ?? document.target };
  }

  const prefix = qname.slice(0, colon);

  return {
    local: qname.slice(colon + 1),
    namespace: prefix === "xml" ? xmlNamespace : (document.prefixes.get(prefix) ?? ""),
  };
};

/**
 * Find the pinned path a schema location names: a pinned URL, or a path beside the including
 * file.
 *
 * @param from - The including file.
 * @param location - The `schemaLocation`.
 * @returns The pinned path, or none for a schema the pin does not hold.
 */
const pinnedPath = (from: SourcePath, location: string): Option.Option<SourcePath> => {
  const byUrl = sourcePaths.find((path) => sources[path].url === location);
  if (byUrl !== undefined) {
    return Option.some(byUrl);
  }

  const folder = from.includes("/") ? from.slice(0, from.lastIndexOf("/") + 1) : "";

  return Option.fromNullishOr(sourcePaths.find((path) => path === `${folder}${location}`));
};

/**
 * The table a named component is kept in: simple and complex types share one.
 *
 * @param local - The component's local name.
 * @returns Its table's name.
 */
const categoryOf = (local: string): string => (local === "simpleType" ? "complexType" : local);

/**
 * Load a pinned schema set: the root file, and every file its includes, imports and redefinitions
 * reach that the pin holds.
 *
 * @param root - The root file.
 * @returns The set's components, and the locations the pin does not hold.
 */
export const loadXsd = Effect.fn("test.loadXsd")(function* loadXsd(root: SourcePath) {
  const elements = new Map<string, Component>();
  const types = new Map<string, Component>();
  const groups = new Map<string, Component>();
  const attributeGroups = new Map<string, Component>();
  const attributes = new Map<string, Component>();
  const originals = new Map<string, Component>();
  const members = new Map<string, string[]>();
  const loaded = new Set<string>();
  const missing: string[] = [];
  const tables = new Map<string, Map<string, Component>>([
    ["attribute", attributes],
    ["attributeGroup", attributeGroups],
    ["complexType", types],
    ["element", elements],
    ["group", groups],
    ["simpleType", types],
  ]);

  const visit = (
    path: SourcePath,
    chameleon: Option.Option<string>,
    redefining: readonly Element[],
  ): Effect.Effect<void, unknown, FileSystem.FileSystem | Digest.Digest> =>
    Effect.gen(function* visitSchema() {
      const doc = yield* readSource(path);
      const schema = doc.root;
      const declared = Option.getOrElse(attributeOf(schema, "targetNamespace"), () => "");
      const target = Option.getOrElse(chameleon, () => declared);
      const key = `${path} ${target}`;
      if (loaded.has(key)) {
        return;
      }

      loaded.add(key);

      const prefixes = new Map(
        schema.attributes
          .filter((held) => held.namespace === xmlns)
          .map((held) => [held.prefix === "" ? "" : held.local, held.value] as const),
      );
      const document: SchemaDocument = {
        elementsQualified: Option.contains(attributeOf(schema, "elementFormDefault"), "qualified"),
        prefixes,
        target,
      };
      const replaced = new Set(
        redefining.flatMap((node) =>
          Option.toArray(
            Option.map(attributeOf(node, "name"), (name) => `${categoryOf(node.local)} ${name}`),
          ),
        ),
      );
      for (const node of xsChildren(schema)) {
        const table = tables.get(node.local);
        const name = attributeOf(node, "name");
        if (table !== undefined && Option.isSome(name)) {
          const at = nameKey({ local: name.value, namespace: target });
          const component = { document, node };
          if (replaced.has(`${categoryOf(node.local)} ${name.value}`)) {
            originals.set(at, component);
          } else {
            table.set(at, component);
          }

          if (node.local === "element") {
            for (const head of Option.toArray(attributeOf(node, "substitutionGroup"))) {
              const headKey = nameKey(qnameOf(document, head));
              members.set(headKey, [...(members.get(headKey) ?? []), at]);
            }
          }
        }
      }

      for (const node of xsChildren(schema)) {
        const location = attributeOf(node, "schemaLocation");
        if (Option.isSome(location) && ["import", "include", "redefine"].includes(node.local)) {
          const next = pinnedPath(path, location.value);
          if (Option.isNone(next)) {
            missing.push(location.value);
          } else {
            const inner = node.local === "import" ? Option.none() : Option.some(target);
            const redefined = node.local === "redefine" ? xsChildren(node) : [];
            yield* visit(next.value, inner, redefined);
            for (const redefinedNode of redefined) {
              const table = tables.get(redefinedNode.local);
              const name = attributeOf(redefinedNode, "name");
              if (table !== undefined && Option.isSome(name)) {
                table.set(nameKey({ local: name.value, namespace: target }), {
                  document,
                  node: redefinedNode,
                });
              }
            }
          }
        }
      }
    });

  yield* visit(root, Option.none(), []);

  const set: XsdSet = { attributeGroups, attributes, elements, groups, members, originals, types };

  return { missing, set };
});

/**
 * How often a particle may occur: `max` is `Infinity` when unbounded.
 */
export interface Occurs {
  readonly max: number;
  readonly min: number;
}

/**
 * One name an element particle admits: the element's name, and its declaration.
 */
export interface Member {
  readonly declaration: Component;
  readonly name: XsdName;
}

/**
 * A particle of a content model, as XML Schema Part 1 §3.9 states it: an element (with the
 * members of its substitution group), a wildcard, or a model group.
 */
export type Particle =
  | {
      readonly _tag: "element";
      readonly members: readonly Member[];
      readonly occurs: Occurs;
    }
  | {
      readonly _tag: "any";
      readonly namespace: string;
      readonly occurs: Occurs;
      /**
       * The target namespace of the schema document the wildcard is read in, which `##other` and
       * `##targetNamespace` read.
       */
      readonly target: string;
    }
  | {
      readonly _tag: "all" | "choice" | "sequence";
      readonly occurs: Occurs;
      readonly particles: readonly Particle[];
    };

/**
 * One attribute use of a complex type.
 */
export interface AttributeUse {
  readonly name: XsdName;
  readonly use: "optional" | "prohibited" | "required";
}

/**
 * A type's content model and attribute uses: its particle (none for empty or simple content),
 * whether character data may stand between its children, its attribute uses, and whether it
 * holds an attribute wildcard.
 */
export interface Content {
  readonly anyAttribute: boolean;
  readonly attributes: readonly AttributeUse[];
  readonly mixed: boolean;
  readonly particle: Option.Option<Particle>;
  /**
   * Whether the content is a simple type's character data: a simple type, or simple content.
   */
  readonly simple: boolean;
  /**
   * The type's name, `{namespace}local`, or `anonymous` for an anonymous type.
   */
  readonly type: string;
}

/**
 * Read a particle's occurrence bounds.
 *
 * @param node - The particle's node.
 * @returns Its bounds, 1 and 1 by default.
 */
const occursOf = (node: Element): Occurs => ({
  max: Option.match(attributeOf(node, "maxOccurs"), {
    onNone: () => 1,
    onSome: (value) => (value === "unbounded" ? Number.POSITIVE_INFINITY : Number(value)),
  }),
  min: Option.match(attributeOf(node, "minOccurs"), { onNone: () => 1, onSome: Number }),
});

/**
 * Close a substitution group head over its members, transitively, leaving out abstract ones.
 *
 * @param set - The schema set.
 * @param head - The head's key.
 * @returns Every non-abstract element that may stand where the head is referenced.
 */
const substitutable = (set: XsdSet, head: string): readonly string[] => {
  const seen = new Set<string>();
  const pending = [head];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    if (!seen.has(next)) {
      seen.add(next);
      pending.push(...(set.members.get(next) ?? []));
    }
  }

  return [...seen].filter((key) => {
    const component = set.elements.get(key);

    return (
      component !== undefined && !Option.contains(attributeOf(component.node, "abstract"), "true")
    );
  });
};

/**
 * Split a `{namespace}local` key back into its name.
 *
 * @param key - The key.
 * @returns The name.
 */
const nameOfKey = (key: string): XsdName => ({
  local: key.slice(key.indexOf("}") + 1),
  namespace: key.slice(1, key.indexOf("}")),
});

/**
 * Read a particle node.
 *
 * @param set - The schema set.
 * @param document - The document the node is read in.
 * @param node - An `element`, `any`, `group`, `sequence`, `choice` or `all` node.
 * @returns The particle, or none for a node that is not one, or one that never occurs.
 */
const particleOf = (
  set: XsdSet,
  document: SchemaDocument,
  node: Element,
): Option.Option<Particle> => {
  const occurs = occursOf(node);
  if (occurs.max === 0) {
    return Option.none();
  }

  switch (node.local) {
    case "element": {
      const ref = attributeOf(node, "ref");
      if (Option.isSome(ref)) {
        const head = nameKey(qnameOf(document, ref.value));

        return Option.some({
          _tag: "element",
          members: substitutable(set, head).flatMap((key) =>
            Option.toArray(
              Option.map(Option.fromNullishOr(set.elements.get(key)), (declaration) => ({
                declaration,
                name: nameOfKey(key),
              })),
            ),
          ),
          occurs,
        });
      }

      const local = Option.getOrElse(attributeOf(node, "name"), () => "");
      const qualified = Option.match(attributeOf(node, "form"), {
        onNone: () => document.elementsQualified,
        onSome: (form) => form === "qualified",
      });

      return Option.some({
        _tag: "element",
        members: [
          {
            declaration: { document, node },
            name: { local, namespace: qualified ? document.target : "" },
          },
        ],
        occurs,
      });
    }
    case "any": {
      return Option.some({
        _tag: "any",
        namespace: Option.getOrElse(attributeOf(node, "namespace"), () => "##any"),
        occurs,
        target: document.target,
      });
    }
    case "group": {
      const group = Option.flatMap(attributeOf(node, "ref"), (ref) =>
        Option.fromNullishOr(set.groups.get(nameKey(qnameOf(document, ref)))),
      );

      return group.pipe(
        Option.flatMap((component) =>
          Arr.head(
            xsChildren(component.node).filter((child) =>
              ["all", "choice", "sequence"].includes(child.local),
            ),
          ).pipe(
            Option.flatMap((compositor) => particleOf(set, component.document, compositor)),
            Option.map((inner) =>
              inner._tag === "element" || inner._tag === "any" ? inner : { ...inner, occurs },
            ),
          ),
        ),
      );
    }
    case "all":
    case "choice":
    case "sequence": {
      return Option.some({
        _tag: node.local,
        occurs,
        particles: xsChildren(node).flatMap((child) =>
          Option.toArray(particleOf(set, document, child)),
        ),
      });
    }
    default: {
      return Option.none();
    }
  }
};

/**
 * Read the one particle among a node's children: its sequence, choice, all or group, none where
 * the explicit content is empty (XML Schema Part 1 §3.4.2, complex content, clause 2.1): no such
 * child (2.1.1), an `all` or `sequence` with no children but annotations (2.1.2), a `choice` with
 * none and `minOccurs="0"` (2.1.3), or one whose `maxOccurs` is 0 (2.1.4). Without `mixed`, empty
 * explicit content is the content type `empty`, which admits no character data, whitespace
 * included.
 *
 * @param set - The schema set.
 * @param document - The document.
 * @param node - A complex type, an extension or a restriction.
 * @returns The particle, or none.
 */
const ownParticle = (
  set: XsdSet,
  document: SchemaDocument,
  node: Element,
): Option.Option<Particle> =>
  Option.flatMap(
    Arr.findFirst(xsChildren(node), (child) =>
      ["all", "choice", "group", "sequence"].includes(child.local),
    ),
    (child) => {
      const childless = xsChildren(child).every(({ local }) => local === "annotation");
      const empty =
        childless &&
        (child.local === "all" ||
          child.local === "sequence" ||
          (child.local === "choice" && occursOf(child).min === 0));

      return empty ? Option.none() : particleOf(set, document, child);
    },
  );

/**
 * A node's own attribute uses, and whether it holds an attribute wildcard.
 */
interface OwnAttributes {
  readonly any: boolean;
  readonly uses: readonly AttributeUse[];
}

/**
 * Read a node's attribute uses: its attributes and its attribute groups', recursively.
 *
 * @param set - The schema set.
 * @param document - The document.
 * @param node - A complex type, an extension, a restriction or an attribute group.
 * @returns The uses, and whether an attribute wildcard is among them.
 */
const ownAttributes = (set: XsdSet, document: SchemaDocument, node: Element): OwnAttributes => {
  const uses: AttributeUse[] = [];
  let any = false;
  for (const child of xsChildren(node)) {
    if (child.local === "attribute") {
      const use = Option.getOrElse(attributeOf(child, "use"), () => "optional");
      const name = Option.match(attributeOf(child, "ref"), {
        onNone: () => ({
          local: Option.getOrElse(attributeOf(child, "name"), () => ""),
          namespace: Option.contains(attributeOf(child, "form"), "qualified")
            ? document.target
            : "",
        }),
        onSome: (ref) => qnameOf(document, ref),
      });
      uses.push({
        name,
        use: use === "required" || use === "prohibited" ? use : "optional",
      });
    } else if (child.local === "attributeGroup") {
      const group = Option.flatMap(attributeOf(child, "ref"), (ref) =>
        Option.fromNullishOr(set.attributeGroups.get(nameKey(qnameOf(document, ref)))),
      );
      if (Option.isSome(group)) {
        const inner = ownAttributes(set, group.value.document, group.value.node);
        uses.push(...inner.uses);
        any ||= inner.any;
      }
    } else if (child.local === "anyAttribute") {
      any = true;
    }
  }

  return { any, uses };
};

/**
 * Join a base type's attribute uses with a derivation's: a derivation's use of a name replaces the
 * base's, and a prohibited use removes it.
 *
 * @param base - The base's uses.
 * @param own - The derivation's uses.
 * @returns The derived type's uses.
 */
const joinUses = (
  base: readonly AttributeUse[],
  own: readonly AttributeUse[],
): readonly AttributeUse[] => {
  const byName = new Map(base.map((use) => [nameKey(use.name), use]));
  for (const use of own) {
    byName.set(nameKey(use.name), use);
  }

  return [...byName.values()].filter(({ use }) => use !== "prohibited");
};

/**
 * The particle a derived complex type's content has: none for simple content, its own for a
 * restriction, and for an extension its base's then its own, as one sequence (XML Schema Part 1
 * §3.4.2).
 *
 * @param derivation - The derivation.
 * @param derivation.base - The base type's particle.
 * @param derivation.own - The derivation's own particle.
 * @param derivation.simple - Whether the content is simple.
 * @param derivation.step - `extension` or `restriction`.
 * @returns The particle.
 */
const derivedParticle = (derivation: {
  readonly base: Option.Option<Particle>;
  readonly own: Option.Option<Particle>;
  readonly simple: boolean;
  readonly step: string;
}): Option.Option<Particle> => {
  if (derivation.simple) {
    return Option.none();
  }

  if (derivation.step === "restriction") {
    return derivation.own;
  }

  const parts = [...Option.toArray(derivation.base), ...Option.toArray(derivation.own)];

  return parts.length === 0
    ? Option.none()
    : Option.some({ _tag: "sequence", occurs: { max: 1, min: 1 }, particles: parts });
};

/**
 * Read the content of a type, named or anonymous.
 *
 * @param set - The schema set.
 * @param component - The type's `complexType` or `simpleType` node.
 * @param type - Its name for reports, `anonymous` for an anonymous type.
 * @returns Its content.
 */
const contentOfType = (set: XsdSet, component: Component, type: string): Content => {
  const { document, node } = component;
  if (node.local === "simpleType") {
    return {
      anyAttribute: false,
      attributes: [],
      mixed: false,
      particle: Option.none(),
      simple: true,
      type,
    };
  }

  const mixed = Option.contains(attributeOf(node, "mixed"), "true");
  const derived = Arr.head([
    ...xsChildren(node, "complexContent"),
    ...xsChildren(node, "simpleContent"),
  ]);
  if (Option.isNone(derived)) {
    const own = ownAttributes(set, document, node);

    return {
      anyAttribute: own.any,
      attributes: joinUses([], own.uses),
      mixed,
      particle: ownParticle(set, document, node),
      simple: false,
      type,
    };
  }

  const simple = derived.value.local === "simpleContent";
  const derivation = Arr.head([
    ...xsChildren(derived.value, "extension"),
    ...xsChildren(derived.value, "restriction"),
  ]);

  return Option.match(derivation, {
    onNone: () => ({
      anyAttribute: false,
      attributes: [],
      mixed,
      particle: Option.none(),
      simple,
      type,
    }),
    onSome: (step) => {
      const baseName = Option.map(attributeOf(step, "base"), (base) =>
        nameKey(qnameOf(document, base)),
      );
      const base = baseName.pipe(
        Option.flatMap((key) =>
          Option.fromNullishOr(key === type ? set.originals.get(key) : set.types.get(key)).pipe(
            Option.map((found) => contentOfType(set, found, key)),
          ),
        ),
      );
      const own = ownAttributes(set, document, step);
      const baseUses = Option.match(base, {
        onNone: () => [],
        onSome: (found) => found.attributes,
      });
      // An extension whose explicit content is empty takes its base's content type (XML Schema
      // Part 1 §3.4.2, complex content, clause 2.1), mixed included.
      const ownMixed = mixed || Option.contains(attributeOf(derived.value, "mixed"), "true");
      const ownParticleOf = ownParticle(set, document, step);
      const particle = derivedParticle({
        base: base.pipe(Option.flatMap((found) => found.particle)),
        own: ownParticleOf,
        simple,
        step: step.local,
      });

      const inherited =
        step.local === "extension" &&
        Option.isNone(ownParticleOf) &&
        Option.exists(base, (found) => found.mixed);

      return {
        anyAttribute: own.any || Option.exists(base, (found) => found.anyAttribute),
        attributes: joinUses(baseUses, own.uses),
        mixed: ownMixed || inherited,
        particle,
        simple,
        type,
      };
    },
  });
};

/**
 * Read the content an element declaration gives its instances.
 *
 * @param set - The schema set.
 * @param declaration - The element declaration.
 * @returns Its content: its named or anonymous type's; its substitution group head's when it states
 *   neither (XML Schema Part 1 §3.3.2, the type definition defaults to the head's); or
 *   `xs:anyType`'s when it names none at all.
 */
const contentOfDeclaration = (set: XsdSet, declaration: Component): Content => {
  const { document, node } = declaration;
  const named = attributeOf(node, "type");
  const head = Option.flatMap(attributeOf(node, "substitutionGroup"), (qname) =>
    Option.fromNullishOr(set.elements.get(nameKey(qnameOf(document, qname)))),
  );
  if (
    Option.isNone(named) &&
    Option.isSome(head) &&
    xsChildren(node, "complexType").length === 0 &&
    xsChildren(node, "simpleType").length === 0
  ) {
    return contentOfDeclaration(set, head.value);
  }

  if (Option.isSome(named)) {
    const key = nameKey(qnameOf(document, named.value));
    const component = set.types.get(key);

    return component === undefined
      ? {
          anyAttribute: false,
          attributes: [],
          mixed: false,
          particle: Option.none(),
          simple: true,
          type: key,
        }
      : contentOfType(set, component, key);
  }

  return Option.match(
    Arr.head([...xsChildren(node, "complexType"), ...xsChildren(node, "simpleType")]),
    {
      onNone: () => ({
        anyAttribute: true,
        attributes: [],
        mixed: true,
        particle: Option.some<Particle>({
          _tag: "any",
          namespace: "##any",
          occurs: { max: Number.POSITIVE_INFINITY, min: 0 },
          target: document.target,
        }),
        simple: false,
        type: "xs:anyType",
      }),
      onSome: (anonymous) => contentOfType(set, { document, node: anonymous }, "anonymous"),
    },
  );
};

/**
 * The element particles of a particle, flattened.
 *
 * @param particle - The particle.
 * @returns Every element particle within it.
 */
export const elementsOf = (
  particle: Particle,
): readonly Extract<Particle, { readonly _tag: "element" }>[] => {
  switch (particle._tag) {
    case "element": {
      return [particle];
    }
    case "any": {
      return [];
    }
    case "all":
    case "choice":
    case "sequence": {
      return particle.particles.flatMap(elementsOf);
    }
    default: {
      return particle satisfies never;
    }
  }
};

/**
 * A kind's content as its XSD declares it, under the parent kind it was reached under.
 */
export interface KindContent {
  readonly content: Content;
  readonly kind: string;
}

/**
 * What a walk of a schema set gives: each kind's contents, by kind, and each element name no kind
 * resolves, with the parent kind it stood under.
 */
export interface XsdContents {
  readonly contents: ReadonlyMap<string, readonly Content[]>;
  readonly unresolved: readonly string[];
}

/**
 * Walk a schema set from its global elements, each read as a root (its parent the document node),
 * and give every kind the walk reaches each distinct content its declarations state.
 *
 * @param set - The schema set.
 * @param resolve - The composition's kind resolution.
 * @returns Each kind's contents, by kind; and each element name no kind resolves, with the parent
 *   kind it stood under.
 */
export const xsdContents = (
  set: XsdSet,
  resolve: (namespace: string, local: string, parent: string) => Option.Option<string>,
): XsdContents => {
  const contents = new Map<string, Map<string, Content>>();
  const unresolved = new Set<string>();
  const seen = new Set<string>();
  const ids = new Map<Element, number>();
  const pending: (readonly [Member, string])[] = [...set.elements.entries()].map(
    ([key, declaration]) => [{ declaration, name: nameOfKey(key) }, "document"] as const,
  );
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [member, parent] = next;
    const kind = resolve(member.name.namespace, member.name.local, parent);
    if (Option.isNone(kind)) {
      if (parent !== "document") {
        unresolved.add(`${nameKey(member.name)} under ${parent}`);
      }
    } else {
      const id = ids.get(member.declaration.node) ?? ids.size;
      ids.set(member.declaration.node, id);

      const visitKey = `${kind.value} ${id}`;
      if (!seen.has(visitKey)) {
        seen.add(visitKey);

        const content = contentOfDeclaration(set, member.declaration);
        const typeKey = content.type === "anonymous" ? `anonymous ${id}` : content.type;
        const held = contents.get(kind.value) ?? new Map<string, Content>();
        held.set(typeKey, content);
        contents.set(kind.value, held);
        for (const particle of Option.toArray(content.particle).flatMap(elementsOf)) {
          for (const child of particle.members) {
            pending.push([child, kind.value]);
          }
        }
      }
    }
  }

  return {
    contents: new Map([...contents].map(([kind, byType]) => [kind, [...byType.values()]])),
    unresolved: [...unresolved].toSorted(),
  };
};

/**
 * What a content model says of the order of its children, over kinds.
 */
export interface Precedence {
  /**
   * The kinds some valid content holds, wildcard kinds included.
   */
  readonly kinds: ReadonlySet<string>;
  /**
   * Whether some valid content holds a child of kind `earlier` before one of kind `later`.
   *
   * @param earlier - A kind.
   * @param later - A kind.
   * @returns Whether `earlier` may precede `later`.
   */
  readonly precedes: (earlier: string, later: string) => boolean;
}

/**
 * Compute what a content model says of its children's order: Glushkov's position automaton over
 * its particle, each element particle one position labelled by the kinds its members resolve to,
 * each wildcard one position labelled by `wildcard`. `x` may precede `y` exactly when some position
 * of `y` is reachable from some position of `x` by one or more follow steps: every position of an
 * XSD content model lies on an accepting path, so such a path extends to a valid content.
 *
 * Occurrence bounds enter only as whether a particle may be absent (min 0) and whether it may
 * repeat (max > 1), which is all "may precede" depends on.
 *
 * @param particle - The content model's particle.
 * @param kindsOf - The kinds an element particle's members resolve to, under the parent.
 * @param wildcard - The kinds a wildcard position stands for.
 * @returns The precedence relation.
 */
export const precedence = (
  particle: Particle,
  kindsOf: (members: readonly Member[]) => readonly string[],
  wildcard: readonly string[],
): Precedence => {
  const labels: (readonly string[])[] = [];
  const follow: Set<number>[] = [];
  interface Glushkov {
    readonly first: readonly number[];
    readonly last: readonly number[];
    readonly nullable: boolean;
  }
  const link = (from: readonly number[], to: readonly number[]) => {
    for (const at of from) {
      for (const next of to) {
        follow[at]?.add(next);
      }
    }
  };
  const build = (node: Particle): Glushkov => {
    const inner = ((): Glushkov => {
      switch (node._tag) {
        case "element":
        case "any": {
          const at = labels.length;
          labels.push(node._tag === "element" ? kindsOf(node.members) : wildcard);
          follow.push(new Set());

          return { first: [at], last: [at], nullable: false };
        }
        case "sequence": {
          let acc: Glushkov = { first: [], last: [], nullable: true };
          for (const child of node.particles) {
            const part = build(child);
            link(acc.last, part.first);
            acc = {
              first: acc.nullable ? [...acc.first, ...part.first] : acc.first,
              last: part.nullable ? [...acc.last, ...part.last] : part.last,
              nullable: acc.nullable && part.nullable,
            };
          }

          return acc;
        }
        case "choice": {
          const parts = node.particles.map(build);

          return {
            first: parts.flatMap(({ first }) => first),
            last: parts.flatMap(({ last }) => last),
            nullable: parts.length === 0 || parts.some(({ nullable }) => nullable),
          };
        }
        case "all": {
          const parts = node.particles.map(build);
          for (const [index, part] of parts.entries()) {
            for (const [other, next] of parts.entries()) {
              if (index !== other) {
                link(part.last, next.first);
              }
            }
          }

          return {
            first: parts.flatMap(({ first }) => first),
            last: parts.flatMap(({ last }) => last),
            nullable: parts.every(({ nullable }) => nullable),
          };
        }
        default: {
          return node satisfies never;
        }
      }
    })();
    if (node.occurs.max > 1) {
      link(inner.last, inner.first);
    }

    return { ...inner, nullable: inner.nullable || node.occurs.min === 0 };
  };
  build(particle);

  const reach = follow.map((_, from) => {
    const seen = new Set<number>();
    const pending = [...(follow[from] ?? [])];
    for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
      if (!seen.has(next)) {
        seen.add(next);
        pending.push(...(follow[next] ?? []));
      }
    }

    return seen;
  });
  const positionsOf = new Map<string, number[]>();
  for (const [at, kinds] of labels.entries()) {
    for (const kind of kinds) {
      positionsOf.set(kind, [...(positionsOf.get(kind) ?? []), at]);
    }
  }

  return {
    kinds: new Set(positionsOf.keys()),
    precedes: (earlier, later) =>
      (positionsOf.get(earlier) ?? []).some((from) =>
        (positionsOf.get(later) ?? []).some((to) => reach[from]?.has(to) ?? false),
      ),
  };
};

/**
 * One child of a drawn content: an element of a name, or an element a wildcard admits.
 */
export type DrawnChild =
  | { readonly _tag: "element"; readonly name: XsdName }
  | { readonly _tag: "wildcard"; readonly namespace: string };

/**
 * Draw a valid content of a particle by construction: each particle occurs between its bounds, an
 * unbounded one at most `spare` times beyond its minimum, a choice takes one alternative, and an
 * `all` group takes its particles in a drawn order.
 *
 * @param particle - The particle.
 * @param spare - How many occurrences beyond its minimum an unbounded particle may take.
 * @returns A generator of the children, in order.
 */
export const wordOf =
  (particle: Particle, spare: number): Gen<readonly DrawnChild[]> =>
  (source) => {
    const times = source.choose(
      particle.occurs.min,
      Math.min(particle.occurs.max, particle.occurs.min + spare),
    );
    const once = (): readonly DrawnChild[] => {
      switch (particle._tag) {
        case "element": {
          return particle.members.length === 0
            ? []
            : [
                {
                  _tag: "element",
                  name: Arr.getUnsafe(
                    particle.members,
                    source.choose(0, particle.members.length - 1),
                  ).name,
                },
              ];
        }
        case "any": {
          return [{ _tag: "wildcard", namespace: particle.namespace }];
        }
        case "sequence": {
          return particle.particles.flatMap((child) => wordOf(child, spare)(source));
        }
        case "choice": {
          return particle.particles.length === 0
            ? []
            : wordOf(
                Arr.getUnsafe(particle.particles, source.choose(0, particle.particles.length - 1)),
                spare,
              )(source);
        }
        case "all": {
          const order = [...particle.particles];
          const drawn: DrawnChild[] = [];
          while (order.length > 0) {
            const [picked] = order.splice(source.choose(0, order.length - 1), 1);
            drawn.push(...(picked === undefined ? [] : wordOf(picked, spare)(source)));
          }

          return drawn;
        }
        default: {
          return particle satisfies never;
        }
      }
    };

    return Arr.makeBy(times, once).flat();
  };

/**
 * The parent of a content `xmllint` validates: a global element of a name, or a probe element
 * declared with a named type.
 */
export type Probe =
  | { readonly _tag: "global"; readonly name: XsdName }
  | { readonly _tag: "type"; readonly type: XsdName };

/**
 * One content for `xmllint` to judge: its parent and its children.
 */
export interface ProbeDocument {
  readonly children: readonly DrawnChild[];
  readonly parent: Probe;
  /**
   * The type the parent's `xsi:type` names, under a prefix bound to its namespace; none for a
   * parent with no `xsi:type`.
   */
  readonly type: Option.Option<XsdName>;
}

/**
 * The XML catalog that maps every pinned XSD's published location onto its file in the cache, so
 * `xmllint` reads every schema, imported ones included, from disk under `--nonet`.
 *
 * @param directory - The cache directory.
 * @returns The catalog's text.
 */
const catalogOf = (directory: string): string => `<?xml version="1.0"?>
<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog">
${sourcePaths
  .map(
    (path) =>
      `  <uri name="${sources[path].url}" uri="file://${directory}/${path}"/>\n  <system systemId="${sources[path].url}" uri="file://${directory}/${path}"/>`,
  )
  .join("\n")}
</catalog>
`;

/**
 * The namespace a drawn wildcard child is written in: none for `##local`, the wildcard's first
 * listed namespace when it lists them, and a namespace no schema names otherwise.
 *
 * @param namespace - The wildcard's `namespace` attribute.
 * @returns The child's namespace.
 */
const wildcardNamespace = (namespace: string): string => {
  const [first = "##any"] = namespace.split(/\s+/u);
  if (first === "##local") {
    return "";
  }

  return first.startsWith("##") ? "urn:x-grammar-test-foreign" : first;
};

/**
 * Write a probe document: the parent on line 1, each child an empty element on its own line, and
 * the parent's end tag last, so a content-model error is told by its line.
 *
 * @param probe - The document.
 * @param probeName - The probe element's name for a type probe.
 * @returns The document's text.
 */
const probeText = (probe: ProbeDocument, probeName: (type: XsdName) => XsdName): string => {
  const root = probe.parent._tag === "global" ? probe.parent.name : probeName(probe.parent.type);
  const lines = probe.children.map((child) => {
    const name =
      child._tag === "element"
        ? child.name
        : { local: "foreign", namespace: wildcardNamespace(child.namespace) };

    return `<c:${name.local === "" ? "x" : name.local} xmlns:c="${name.namespace}"/>`
      .replace(' xmlns:c=""', "")
      .replace("<c:", name.namespace === "" ? "<" : "<c:");
  });

  const typed = Option.match(probe.type, {
    onNone: () => "",
    onSome: (type) =>
      ` xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tt="${type.namespace}" xsi:type="tt:${type.local}"`,
  });

  return `<r:${root.local} xmlns:r="${root.namespace}"${typed}>\n${lines.join("\n")}\n</r:${root.local}>\n`;
};

/**
 * What `xmllint` said of each probe's content model: whether the parent's content was refused (an
 * unexpected child, a missing one, or a child a `strict` wildcard holds with no declaration), with
 * its messages. Errors inside a child, about its own
 * attributes or content, are not the parent's and are left out.
 */
export interface Validated {
  readonly messages: readonly string[];
  readonly refused: boolean;
  /**
   * Whether the parent's `xsi:type` was refused: it names no type, or one not validly derived from
   * the parent's declared type (XML Schema 1.0 Part 1, §3.3.4 clause 4).
   */
  readonly typeRefused: boolean;
}

/**
 * Validate probe documents against a pinned schema with `xmllint --schema`, all in one run.
 *
 * A type probe's parent is an element `probe-n` declared, in a wrapper schema that includes the
 * root schema, with the probed type; the wrapper takes the root's target namespace, so it may
 * include it.
 *
 * @param root - The schema's root file.
 * @param target - Its target namespace.
 * @param probes - The documents.
 * @returns Each document's verdict, in order.
 */
export const validateContents = Effect.fn("test.validateContents")(function* validateContents(
  root: SourcePath,
  target: string,
  probes: readonly ProbeDocument[],
) {
  const fs = yield* FileSystem.FileSystem;
  const directory = yield* xsdDirectory;
  const scratch = yield* fs.makeTempDirectoryScoped();
  const types = [
    ...new Map(
      probes.flatMap(({ parent }) =>
        parent._tag === "type" ? [[nameKey(parent.type), parent.type] as const] : [],
      ),
    ).values(),
  ];
  const probeName = (type: XsdName): XsdName => ({
    local: `probe-${types.findIndex((held) => nameKey(held) === nameKey(type))}`,
    namespace: target,
  });
  const wrapper = `<?xml version="1.0"?>
<xs:schema xmlns:xs="${xs}" targetNamespace="${target}" elementFormDefault="qualified">
  <xs:include schemaLocation="file://${directory}/${root}"/>
${types
  .map(
    (type, index) =>
      `  <xs:element name="probe-${index}" type="t:${type.local}" xmlns:t="${type.namespace}"/>`,
  )
  .join("\n")}
</xs:schema>
`;
  yield* fs.writeFileString(`${scratch}/catalog.xml`, catalogOf(directory));
  yield* fs.writeFileString(`${scratch}/wrapper.xsd`, wrapper);

  const files = probes.map((_, index) => `${scratch}/probe-${index}.xml`);
  yield* Effect.all(
    probes.map((probe, index) =>
      fs.writeFileString(Arr.getUnsafe(files, index), probeText(probe, probeName)),
    ),
  );

  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const stderr = yield* Effect.scoped(
    Effect.gen(function* runXmllint() {
      const handle = yield* spawner.spawn(
        ChildProcess.make(
          "xmllint",
          ["--nonet", "--noout", "--schema", `${scratch}/wrapper.xsd`, ...files],
          {
            env: { XML_CATALOG_FILES: `${scratch}/catalog.xml` },
            extendEnv: true,
            stdin: "ignore",
          },
        ),
      );
      const [text] = yield* Effect.all(
        [Stream.mkString(Stream.decodeText(handle.stderr)), handle.exitCode],
        {
          concurrency: "unbounded",
        },
      );

      return text;
    }),
  );
  const lines = stderr.split("\n");
  if (lines.some((line) => line.includes("failed to compile"))) {
    return yield* Effect.die(
      new Error(
        `xmllint could not compile the probe schema over ${root}: ${stderr.slice(0, 2000)}`,
      ),
    );
  }

  return probes.map((probe, index): Validated => {
    const file = Arr.getUnsafe(files, index);
    const last = probe.children.length + 2;
    const messages = lines.filter((line) => line.startsWith(`${file}:`));
    const refused = messages.filter((line) => {
      const lineNumber = Number(line.slice(file.length + 1).split(":")[0]);

      return (
        ((line.includes("This element is not expected") ||
          line.includes("demanded by the strict wildcard")) &&
          lineNumber > 1 &&
          lineNumber < last) ||
        (line.includes("Missing child element(s)") && (lineNumber === 1 || lineNumber === last))
      );
    });

    const typeRefused = messages.some(
      (line) =>
        line.slice(file.length + 1).startsWith("1:") &&
        line.includes("xsi:type") &&
        !line.includes("This element is not expected"),
    );

    return { messages: refused, refused: refused.length > 0, typeRefused };
  });
});

/**
 * The services the XSD oracle reads with: the file system, a child-process spawner and SHA-256.
 */
export const XsdOracleLayer = Layer.mergeAll(
  NodeServices.layer,
  Digest.layerWebCrypto,
  NodeChildProcessSpawner.layer.pipe(Layer.provide(NodeServices.layer)),
);

/**
 * Build a toy vocabulary: its element kinds in a toy namespace, each written with its own name, its
 * kinds of character data, its admitted triples and its facets. It composes through production's
 * `compose`, so its grammar is built the production way.
 *
 * @param input - The vocabulary's parts.
 * @param input.kinds - Its element kinds.
 * @param input.data - Its kinds of character data, written with no name.
 * @param input.attributes - The attribute names it introduces.
 * @param input.admission - Its admitted triples.
 * @param input.facets - Its facets.
 * @returns The vocabulary.
 */
export const toyVocabulary = <const K extends string, const D extends string>(input: {
  readonly admission: readonly AdmittedChild[];
  readonly attributes: readonly string[];
  readonly data: readonly D[];
  readonly facets: Facets;
  readonly kinds: readonly K[];
}) =>
  ({
    admission: input.admission.map((row) => ({
      ...row,
      source: { _tag: "spec", cite: "a toy composition" } satisfies Source,
    })),
    attributes: input.attributes,
    declarations: [],
    facets: input.facets,
    kinds: [
      ...input.data.map((handle) => ({ handle, local: "" })),
      ...input.kinds.map((handle) => ({ handle, local: handle })),
    ],
    models: [],
    namespace: "urn:toy",
  }) satisfies Vocabulary;

/**
 * Compose a toy vocabulary list.
 *
 * @param list - The vocabularies.
 * @returns The grammar, or the first generator's refusal.
 */
export const toyGrammar = <const V extends readonly Vocabulary[]>(
  list: V,
): Result.Result<Grammar<KindOf<V>, NameOf<V>>, ComposeError> => compose(list);

/**
 * The source of a toy model and its particles, once per version: a toy cites no XSD.
 *
 * @param versions - The model's versions.
 * @returns The sources.
 */
export const toySources = (versions: readonly [SchemaVersion, ...SchemaVersion[]]): Sources =>
  pipe(
    versions,
    Arr.map((): Source => ({ _tag: "spec", cite: "a toy composition" })),
  );

/**
 * The facets of a toy vocabulary, each empty but those given.
 *
 * @param stated - The facets it states.
 * @returns Its facets.
 */
export const toyFacets = (stated: Partial<Facets>): Facets => ({ ...noFacets, ...stated });

/**
 * Draw a subset of a list, each item kept or left by its own decision.
 *
 * @param items - The items.
 * @returns A generator of the kept items, in order.
 */
export const subsetOf =
  <A>(items: readonly A[]): Gen<readonly A[]> =>
  (source) =>
    items.filter(() => source.choose(0, 1) === 1);

/**
 * Whether a wildcard admits an element in a namespace (XML Schema Part 1 §3.10.4, the namespace
 * constraint).
 *
 * @param wildcard - The wildcard particle.
 * @param namespace - The element's namespace name, empty for none.
 * @returns Whether the wildcard's namespace constraint allows it.
 */
export const wildcardAdmits = (
  wildcard: Extract<Particle, { readonly _tag: "any" }>,
  namespace: string,
): boolean =>
  wildcard.namespace.split(/\s+/u).some((token) => {
    switch (token) {
      case "##any": {
        return true;
      }
      case "##other": {
        return namespace !== "" && namespace !== wildcard.target;
      }
      case "##local": {
        return namespace === "";
      }
      case "##targetNamespace": {
        return namespace === wildcard.target;
      }
      default: {
        return namespace === token;
      }
    }
  });

/**
 * The wildcard particles of a particle, flattened.
 *
 * @param particle - The particle.
 * @returns Every wildcard within it.
 */
export const wildcardsOf = (
  particle: Particle,
): readonly Extract<Particle, { readonly _tag: "any" }>[] => {
  switch (particle._tag) {
    case "any": {
      return [particle];
    }
    case "element": {
      return [];
    }
    case "all":
    case "choice":
    case "sequence": {
      return particle.particles.flatMap(wildcardsOf);
    }
    default: {
      return particle satisfies never;
    }
  }
};

/**
 * A content model's relaxed language as an acceptor over kinds: Glushkov's position automaton
 * built from the test's own reading of the XSD, run as a set of states, since one kind may label
 * several positions. Bounds enter only as whether a particle may be absent and whether it may
 * repeat, the relaxation the installed automaton shares, so counts of 2…n are left to count laws.
 *
 * @param particle - The content model's particle.
 * @param kindsOf - The kinds an element particle's members resolve to, under the parent.
 * @param wildcard - The kinds a wildcard position stands for.
 * @returns Whether a sequence of child kinds is in the model's relaxed language.
 */
export const acceptorOf = (
  particle: Particle,
  kindsOf: (members: readonly Member[]) => readonly string[],
  wildcard: readonly string[],
): ((kinds: readonly string[]) => boolean) => {
  const labels: (readonly string[])[] = [];
  const follow: Set<number>[] = [];
  const link = (from: readonly number[], to: readonly number[]) => {
    for (const at of from) {
      for (const next of to) {
        follow[at]?.add(next);
      }
    }
  };
  interface Reading {
    readonly first: readonly number[];
    readonly last: readonly number[];
    readonly nullable: boolean;
  }
  const build = (node: Particle): Reading => {
    const inner = ((): Reading => {
      switch (node._tag) {
        case "element":
        case "any": {
          const at = labels.length;
          labels.push(node._tag === "element" ? kindsOf(node.members) : wildcard);
          follow.push(new Set());

          return { first: [at], last: [at], nullable: false };
        }
        case "sequence": {
          let acc: Reading = { first: [], last: [], nullable: true };
          for (const child of node.particles) {
            const part = build(child);
            link(acc.last, part.first);
            acc = {
              first: acc.nullable ? [...acc.first, ...part.first] : acc.first,
              last: part.nullable ? [...acc.last, ...part.last] : part.last,
              nullable: acc.nullable && part.nullable,
            };
          }

          return acc;
        }
        case "choice":
        case "all": {
          const parts = node.particles.map(build);
          if (node._tag === "all") {
            for (const [index, part] of parts.entries()) {
              for (const [other, next] of parts.entries()) {
                if (index !== other) {
                  link(part.last, next.first);
                }
              }
            }
          }

          return {
            first: parts.flatMap(({ first }) => first),
            last: parts.flatMap(({ last }) => last),
            nullable:
              node._tag === "all"
                ? parts.every(({ nullable }) => nullable)
                : parts.length === 0 || parts.some(({ nullable }) => nullable),
          };
        }
        default: {
          return node satisfies never;
        }
      }
    })();
    if (node.occurs.max > 1) {
      link(inner.last, inner.first);
    }

    return { ...inner, nullable: inner.nullable || node.occurs.min === 0 };
  };
  const top = build(particle);

  return (kinds) => {
    let states: ReadonlySet<number> | "start" = "start";
    for (const kind of kinds) {
      const from: readonly number[] =
        states === "start" ? top.first : [...states].flatMap((at) => [...(follow[at] ?? [])]);
      states = new Set(from.filter((at) => labels[at]?.includes(kind) ?? false));
      if (states.size === 0) {
        return false;
      }
    }

    return states === "start" ? top.nullable : [...states].some((at) => top.last.includes(at));
  };
};

/**
 * A composition's kind resolution over any parent's handle: a parent the roster does not hold
 * resolves nothing.
 *
 * @param kinds - The composition's kinds.
 * @param kinds.nodeKind - The `NodeKind` roster.
 * @param kinds.resolve - Its resolution.
 * @returns The resolution, its parent a string.
 */
export const resolverOf =
  <K extends string>(kinds: {
    readonly nodeKind: Roster<K>;
    readonly resolve: (namespace: string, local: string, parent: K) => Option.Option<K>;
  }) =>
  (namespace: string, local: string, parent: string): Option.Option<string> =>
    kinds.nodeKind.has(parent) ? kinds.resolve(namespace, local, parent) : Option.none();
