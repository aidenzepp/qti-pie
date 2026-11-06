import { collapse } from "#pantry/import/whitespace.ts";
import { prefixedReadings } from "#pantry/processing/prefixed.ts";
import type { PrefixedForm } from "#pantry/processing/prefixed.ts";
import type { BaseTypeOrAny, Cardinality, EffectiveType } from "#pantry/processing/types.ts";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";

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
 * What a test knows of one item reference: the declarations of the item it resolves to, its
 * mapping targets typed as the variables they map from, and whether the item is time dependent.
 *
 * A mapping target is "treated as if [it were] declared with the name target-identifier"
 * (INFO#Derived_VariableMapping), so `mappings` is keyed by target identifier and holds the type
 * of the source it maps. `timeDependent` is the item root's `time-dependent`, which decides whether
 * the item's `duration` may be read (INFO#IV_Response).
 */
export interface ItemRefScope {
  readonly declarations: ReadonlyMap<string, DeclarationEntry>;
  readonly mappings: ReadonlyMap<string, EffectiveType>;
  readonly timeDependent: boolean;
}

/**
 * What an identifier of a test's reach names: an item reference with what the test knows of it, or
 * a part or a section.
 */
export type ReachEntry =
  | { readonly kind: "item-ref"; readonly scope: ItemRefScope }
  | { readonly kind: "part" | "section" };

/**
 * The variables a processing tree can refer to: the declarations of its document, and the
 * built-ins its mode provides.
 *
 * It is built from the item tree and never from rows, so a declaration is visible before the
 * relations that would store it exist.
 *
 * In `test` mode it can also hold `reach`, every identifier of the test's structure that a
 * prefixed name may begin with, and `holder`, the item reference a template default sits in. A
 * section document is checked once for each test that includes it, with that test's `reach`. Both
 * are empty in every other environment. `timeDependent` is the item root's `time-dependent` in an
 * item's environment and `false` in every other.
 */
export interface Environment {
  readonly builtIns: ReadonlyMap<string, EffectiveType>;
  readonly declarations: ReadonlyMap<string, DeclarationEntry>;
  readonly holder: ItemRefScope | undefined;
  readonly mode: Mode;
  readonly reach: ReadonlyMap<string, ReachEntry>;
  readonly timeDependent: boolean;
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
 *
 * `duration` is a float in an item and a duration in a test (reading 29: each information model
 * sentence is followed at its own level).
 */
const builtInsOf = (mode: Mode): ReadonlyMap<string, EffectiveType> => {
  const context: readonly (readonly [string, EffectiveType])[] = [["QTI_CONTEXT", contextType]];
  if (mode === "template") {
    return new Map(context);
  }

  return new Map([
    ["completionStatus", { baseType: "identifier", cardinality: "single" }],
    ["duration", { baseType: mode === "test" ? "duration" : "float", cardinality: "single" }],
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

  return {
    builtIns: builtInsOf(mode),
    declarations,
    holder: undefined,
    mode,
    reach: new Map(),
    timeDependent: flag(doc.root, "time-dependent"),
  };
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
  holder: undefined,
  mode,
  reach: new Map(),
  timeDependent: false,
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

/**
 * Return the environment with the test's reach, and the item reference a template default sits in
 * when it is one; the argument is left unchanged.
 *
 * The caller builds both from documents, as {@link environmentOf} builds declarations, once for
 * each test a section document is checked under.
 *
 * @param env - The environment to extend.
 * @param reach - Every item reference, part and section identifier of the test, by identifier.
 * @param holder - The item reference a `qti-template-default` is checked in, when it is one.
 * @returns A new environment with the reach.
 */
export const withReach = (
  env: Environment,
  reach: ReadonlyMap<string, ReachEntry>,
  holder?: ItemRefScope,
): Environment => ({ ...env, holder, reach });

/**
 * What a reading's prefix names: an item reference, a part or a section.
 */
export type PrefixedNames = ReachEntry["kind"];

/**
 * Where a prefixed variable comes from: a mapping target of the item reference, a declaration of
 * its item, an item-session built-in, or the `duration` of a part or a section.
 */
export type PrefixedSource = "builtIn" | "declared" | "duration" | "mapped";

/**
 * A reading of a prefixed name that names a variable: the reading, what its prefix names, where the
 * variable comes from, the kind of variable it is and its type. A mapping target counts as an
 * outcome (INFO 7.48 treats it as an outcome variable declared under the target name); an
 * item-session built-in and a part's or section's `duration` are `builtIn`.
 */
export interface ResolvedReading {
  readonly names: PrefixedNames;
  readonly reading: PrefixedForm;
  readonly source: PrefixedSource;
  readonly type: EffectiveType;
  readonly variableKind: DeclarationKind | "builtIn";
}

/**
 * How a prefixed name resolves in a test's reach: no reading names a variable, exactly one does, or
 * several do and the name is ambiguous.
 */
export type PrefixedResolution =
  | ({ readonly _tag: "resolved" } & ResolvedReading)
  | { readonly _tag: "ambiguous"; readonly readings: readonly PrefixedForm[] }
  | { readonly _tag: "unresolved" };

/**
 * The item-session built-ins a test can read through an item reference. `QTI_CONTEXT` is not one.
 */
const itemSessionBuiltIns: ReadonlyMap<string, EffectiveType> = new Map(
  [...builtInsOf("item")].filter(([name]) => name !== "QTI_CONTEXT"),
);

/**
 * The type of a part's or a section's `duration`: a duration, where an item's is a float.
 */
const partDuration: EffectiveType = { baseType: "duration", cardinality: "single" };

/**
 * Resolve one reading in the reach: an item reference's mapping target, else a declaration of its
 * item, else an item-session built-in (the instance form likewise), or a part's or section's
 * `duration`.
 */
const resolveReading = (
  reading: PrefixedForm,
  reach: ReadonlyMap<string, ReachEntry>,
): ResolvedReading | undefined => {
  const entry = reach.get(reading.prefix);
  if (entry === undefined) {
    return undefined;
  }

  if (entry.kind !== "item-ref") {
    return reading.instance === undefined && reading.variable === "duration"
      ? {
          names: entry.kind,
          reading,
          source: "duration",
          type: partDuration,
          variableKind: "builtIn",
        }
      : undefined;
  }

  const mapped = entry.scope.mappings.get(reading.variable);
  if (mapped !== undefined) {
    return {
      names: "item-ref",
      reading,
      source: "mapped",
      type: mapped,
      variableKind: "outcome",
    };
  }

  const declared = entry.scope.declarations.get(reading.variable);
  if (declared !== undefined) {
    return {
      names: "item-ref",
      reading,
      source: "declared",
      type: declared.type,
      variableKind: declared.kind,
    };
  }

  const builtIn = itemSessionBuiltIns.get(reading.variable);

  return builtIn === undefined
    ? undefined
    : {
        names: "item-ref",
        reading,
        source: "builtIn",
        type: builtIn,
        variableKind: "builtIn",
      };
};

/**
 * Resolve a prefixed variable name against a test's reach, the one place a dotted name is
 * resolved.
 *
 * An identifier may contain `.` (reading 37), so a name has one reading per `.` and the text alone
 * cannot say which is meant. A reading resolves when its prefix names an item reference of the
 * reach and its variable is a mapping target of that reference, else a declaration of its item,
 * else an item-session built-in, the instance form `ITEMREF.N.VAR` likewise; or when its prefix
 * names a part or a section, it has no instance and its variable is `duration`. Exactly one
 * resolving reading names the variable; two or more leave the name ambiguous. A name the test
 * declares whole is never split, and the caller looks it up first.
 *
 * @param identifier - The variable name as written.
 * @param env - The environment holding the test's reach.
 * @returns The one resolving reading with its source and type, every resolving reading when
 *   ambiguous (left to right), or `unresolved` when none resolves.
 */
export const resolvePrefixed = (identifier: string, env: Environment): PrefixedResolution => {
  const resolving = prefixedReadings(identifier).flatMap((reading) => {
    const resolved = resolveReading(reading, env.reach);

    return resolved === undefined ? [] : [resolved];
  });
  const [only, ...more] = resolving;
  if (only === undefined) {
    return { _tag: "unresolved" };
  }

  return more.length === 0
    ? { _tag: "resolved", ...only }
    : { _tag: "ambiguous", readings: resolving.map((r) => r.reading) };
};
