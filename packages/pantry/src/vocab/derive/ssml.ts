/**
 * The SSML 1.1 schema as the IR reads it: `ssml/synthesis-nonamespace.xsd` as the core profile QTI
 * imports, `ssml/ssmlv1p1-core.xsd`, redefines it.
 *
 * - The no-namespace file is a chameleon: its components take the core's target namespace (XML Schema
 *   Part 1, 4.2.1). So its unprefixed names resolve there through the core's default namespace, and
 *   each prefix it declares must be bound as the core binds it.
 * - The core declares no component of its own.
 * - The core's `xsd:redefine` replaces each complex type it names (`speak` and `mark`) with a
 *   restriction of the original, whose base is the original (4.2.2). The index holds each
 *   redefinition under {@link redefinitionKey} beside the original.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-1/ | XML Schema Part 1: Structures, Second Edition}
 */
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import {
  elementsOf,
  firstXs,
  indexSchema,
  isXs,
  refuse,
  requireAttribute,
  resolve,
  xsChildren,
} from "#pantry/vocab/derive/derive.ts";
import type { XsdReadingError, XsdSchema } from "#pantry/vocab/derive/derive.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import { Option, Result } from "effect";

/**
 * The pinned no-namespace SSML schema, which holds every SSML component.
 */
const baseSource = "ssml/synthesis-nonamespace.xsd" satisfies SourcePath;

/**
 * The SSML schema, ready to read entries from.
 *
 * `schema` is the chameleon view: the no-namespace file's components in the core's namespaces.
 * There, each redefined complex type also stands under {@link redefinitionKey}, while its own
 * name keeps the original, which a redefinition's base names. `redefined` names the redefined
 * types.
 */
export interface SsmlSchema {
  readonly redefined: ReadonlySet<string>;
  readonly schema: XsdSchema;
}

/**
 * The key a redefined complex type's redefinition stands under in the chameleon view.
 *
 * `#` cannot occur in an NCName, so the key never names a component of the schema. It has no
 * colon, so {@link resolve} reads it as a name in the view's target namespace.
 *
 * @param name - The redefined type's name.
 * @returns The key.
 */
export const redefinitionKey = (name: string): string => `${name}#redefined`;

/**
 * The local name a QName-valued attribute names in the schema's target namespace.
 *
 * @param schema - The schema the value is written in.
 * @param lexical - The value as written.
 * @returns The local name, or `None` when the name is in another namespace.
 */
const ownLocal = (
  schema: XsdSchema,
  lexical: string,
): Result.Result<Option.Option<string>, XsdReadingError> =>
  Result.map(resolve(schema, lexical), (name) =>
    name.namespace === schema.targetNamespace ? Option.some(name.local) : Option.none(),
  );

/**
 * Read the complex types the core's `xsd:redefine` replaces.
 *
 * @param core - The core profile, indexed.
 * @param root - Its `xsd:schema` element.
 * @returns Each redefinition by the name it redefines. It is an {@link XsdReadingError} when the
 *   core redefines another file or anything but a complex type, or when a redefinition is not a
 *   `complexContent` restriction of the type it redefines.
 */
const redefinitionsOf = (
  core: XsdSchema,
  root: Element,
): Result.Result<ReadonlyMap<string, Element>, XsdReadingError> =>
  Result.gen(function* redefinitionsOfBody() {
    const redefinitions = new Map<string, Element>();
    const location = baseSource.slice(baseSource.lastIndexOf("/") + 1);

    for (const redefine of xsChildren(root, "redefine")) {
      const target = yield* requireAttribute(redefine, "schemaLocation");

      if (target !== location) {
        return yield* refuse(`the core redefines ${target}, not ${location}`);
      }

      for (const component of elementsOf(redefine).filter((node) => !isXs(node, "annotation"))) {
        if (!isXs(component, "complexType")) {
          return yield* refuse(`the core redefines an ${component.qname}, not a complex type`);
        }

        const name = yield* requireAttribute(component, "name");
        const step = Option.flatMap(firstXs(component, "complexContent"), (content) =>
          firstXs(content, "restriction"),
        );
        const base = Option.isSome(step)
          ? yield* ownLocal(core, yield* requireAttribute(step.value, "base"))
          : Option.none();

        if (!Option.contains(base, name)) {
          return yield* refuse(
            `the redefinition of ${name} is not a complexContent restriction of ${name}`,
          );
        }

        redefinitions.set(name, component);
      }
    }

    return redefinitions;
  });

/**
 * Build the SSML schema from its two files.
 *
 * @param base - The no-namespace file, `ssml/synthesis-nonamespace.xsd`.
 * @param core - The core profile, `ssml/ssmlv1p1-core.xsd`.
 * @returns The schema, or an {@link XsdReadingError} when the files do not have the shape the
 *   reading rules describe.
 */
export const ssmlSchemaOf = (
  base: XmlDocument,
  core: XmlDocument,
): Result.Result<SsmlSchema, XsdReadingError> =>
  Result.gen(function* ssmlSchemaOfBody() {
    const own = yield* indexSchema(base);
    const including = yield* indexSchema(core);
    const declared = [
      including.attributeGroups.size,
      including.complexTypes.size,
      including.declarations.size,
      including.elements.size,
      including.groups.size,
      including.simpleTypes.size,
    ].reduce((sum, size) => sum + size, 0);

    if (declared > 0) {
      return yield* refuse(`the core declares ${declared} components of its own`);
    }

    for (const [prefix, namespace] of own.namespaces) {
      if (including.namespaces.get(prefix) !== namespace) {
        return yield* refuse(`the no-namespace file binds the prefix ${prefix} unlike the core`);
      }
    }

    const redefinitions = yield* redefinitionsOf(including, core.root);

    return {
      redefined: new Set(redefinitions.keys()),
      schema: {
        ...own,
        complexTypes: new Map([
          ...own.complexTypes,
          ...[...redefinitions].map(([name, type]) => [redefinitionKey(name), type] as const),
        ]),
        namespaces: including.namespaces,
        targetNamespace: including.targetNamespace,
        targetPrefix: including.targetPrefix,
      },
    };
  });
