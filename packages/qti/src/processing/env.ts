import { collapse } from "#qti/import/tree.ts";
import type { BaseTypeOrAny, Cardinality, EffectiveType } from "#qti/processing/types.ts";
import type { Element, XmlDocument } from "#qti/xml/tree.ts";

/**
 * The mode a processing tree is checked in: an item's, a test's, or a template's, whose built-in
 * variables differ.
 */
export type Mode = "item" | "test" | "template";

/**
 * The four kinds of variable declaration, one per declaration element of the item tree.
 */
export type DeclarationKind = "response" | "outcome" | "template" | "context";

/**
 * A declared variable as the checker needs it: its identifier, its kind, its type, and which of the
 * declaration's optional children and attributes it carries.
 *
 * The flags are what `qti-map-response`, `qti-map-response-point`, `qti-lookup-outcome-value`,
 * `qti-interpolation-table` use, and what a template parameter or a math variable is.
 */
export interface DeclarationEntry {
  readonly areaMapping: boolean;
  readonly identifier: string;
  readonly interpolationTable: boolean;
  readonly kind: DeclarationKind;
  readonly mapping: boolean;
  readonly mathVariable: boolean;
  readonly matchTable: boolean;
  readonly paramVariable: boolean;
  readonly type: EffectiveType;
}

/**
 * The variables a processing tree can refer to: the declarations of its document, and the
 * built-ins its mode provides.
 *
 * It is built from the item tree and never from rows, so a declaration is visible before the
 * relations that would store it exist.
 */
export interface Environment {
  readonly builtIns: ReadonlyMap<string, EffectiveType>;
  readonly declarations: ReadonlyMap<string, DeclarationEntry>;
  readonly mode: Mode;
}

/**
 * The declaration element of each kind, by local name.
 */
const declarationElements: readonly (readonly [string, DeclarationKind])[] = [
  ["qti-response-declaration", "response"],
  ["qti-outcome-declaration", "outcome"],
  ["qti-template-declaration", "template"],
  ["qti-context-declaration", "context"],
];

/**
 * The type of `QTI_CONTEXT`, a record with no base type.
 */
const contextType: EffectiveType = { baseType: "unknown", cardinality: "record" };

/**
 * The built-in variables of each mode: `completionStatus`, `numAttempts` and `duration` exist in
 * an item's and a test's processing, `QTI_CONTEXT` in all three.
 */
const builtInsOf = (mode: Mode): ReadonlyMap<string, EffectiveType> => {
  const context: readonly (readonly [string, EffectiveType])[] = [["QTI_CONTEXT", contextType]];
  if (mode === "template") {
    return new Map(context);
  }

  return new Map([
    ["completionStatus", { baseType: "identifier", cardinality: "single" }],
    ["duration", { baseType: "float", cardinality: "single" }],
    ["numAttempts", { baseType: "integer", cardinality: "single" }],
    ...context,
  ]);
};

/**
 * Read an attribute's value as written, or `undefined` when the element has no such attribute.
 */
const attribute = (element: Element, name: string): string | undefined =>
  element.attributes.find((a) => a.namespace === "" && a.local === name)?.value;

/**
 * Whether the element has a child element of the given local name.
 */
const hasChild = (element: Element, local: string): boolean =>
  element.children.some((c) => c.kind === "element" && c.local === local);

/**
 * The cardinalities a declaration can state.
 */
const cardinalities: readonly Cardinality[] = ["single", "multiple", "ordered", "record"];

/**
 * The base types a declaration can state.
 */
const baseTypes: readonly BaseTypeOrAny[] = [
  "boolean",
  "integer",
  "float",
  "string",
  "identifier",
  "uri",
  "duration",
  "point",
  "pair",
  "directedPair",
  "file",
];

/**
 * Read a declaration's type: its `cardinality` and `base-type` as written. A record has no base
 * type, so a missing or unrecognized one reads `unknown`, and so does a cardinality that is not one
 * of the four.
 */
const typeOf = (element: Element): EffectiveType => {
  const cardinality = collapse(attribute(element, "cardinality") ?? "");
  const baseType = collapse(attribute(element, "base-type") ?? "");

  return {
    baseType: baseTypes.find((b) => b === baseType) ?? "unknown",
    cardinality: cardinalities.find((c) => c === cardinality) ?? "unknown",
  };
};

/**
 * Whether a boolean attribute reads `true`; an absent attribute is `false`.
 */
const flag = (element: Element, name: string): boolean =>
  collapse(attribute(element, name) ?? "") === "true";

/**
 * Build the environment of an item document from its root's declaration children.
 *
 * A declaration without an `identifier` is skipped, and the first of two with the same identifier
 * wins; the importer's own guards refuse both before processing is read.
 *
 * @param doc - The parsed item document.
 * @param mode - The mode the processing tree is checked in.
 * @returns The environment of the declarations and the mode's built-ins.
 */
export const environmentOf = (doc: XmlDocument, mode: Mode): Environment => {
  const declarations = new Map<string, DeclarationEntry>();
  for (const child of doc.root.children) {
    if (child.kind !== "element") {
      continue;
    }

    const kind = declarationElements.find(([local]) => local === child.local)?.[1];
    const raw = attribute(child, "identifier");
    if (kind === undefined || raw === undefined) {
      continue;
    }

    const identifier = collapse(raw);
    if (declarations.has(identifier)) {
      continue;
    }

    declarations.set(identifier, {
      areaMapping: hasChild(child, "qti-area-mapping"),
      identifier,
      interpolationTable: hasChild(child, "qti-interpolation-table"),
      kind,
      mapping: hasChild(child, "qti-mapping"),
      matchTable: hasChild(child, "qti-match-table"),
      mathVariable: flag(child, "math-variable"),
      paramVariable: flag(child, "param-variable"),
      type: typeOf(child),
    });
  }

  return { builtIns: builtInsOf(mode), declarations, mode };
};

/**
 * Construct an environment with the mode's built-ins and no declaration.
 *
 * It is `template` mode's environment, where every reference is a parameter of unknown type, and
 * the starting point of a caller-supplied `test` environment.
 *
 * @param mode - The mode of the processing tree.
 * @returns The environment without declarations.
 */
export const emptyEnvironment = (mode: Mode): Environment => ({
  builtIns: builtInsOf(mode),
  declarations: new Map(),
  mode,
});

/**
 * Return the environment with the entries added by identifier; an entry replaces a declaration of
 * the same identifier, and the argument is left unchanged.
 *
 * @param env - The environment to extend.
 * @param entries - The declarations to add.
 * @returns A new environment with the entries added.
 */
export const withDeclarations = (
  env: Environment,
  entries: readonly DeclarationEntry[],
): Environment => ({
  ...env,
  declarations: new Map([...env.declarations, ...entries.map((e) => [e.identifier, e] as const)]),
});
