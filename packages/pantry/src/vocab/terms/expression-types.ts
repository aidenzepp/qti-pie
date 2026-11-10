/**
 * The terms of expression typing that the schema (`#pantry/qti/expression-types.ts`,
 * `#pantry/qti/expressions.ts`) and the importer (`#pantry/import/overlays/expressions.ts`,
 * `declarations.ts`) both read: each expression kind's typing, the declarations a reference may
 * name, and the value bases and cardinalities a declaration reads as. Each is a function of the
 * expression grammar alone, so loading this module builds no relation of the schema.
 */
import { Array as Arr, Option } from "effect";
import type { Kind, Name } from "#pantry/grammar/compose.ts";
import {
  expressionTypings,
  processingRoots,
  ruleKinds,
  valueBases,
  valueCardinalities,
} from "#pantry/grammar/expression.ts";
import type { ExpressionTyping, languages } from "#pantry/grammar/expression.ts";
import { AttributeName, grammar, NodeKind } from "#pantry/grammar/install.ts";
import type { DeclarationKind } from "#pantry/grammar/install.ts";

/**
 * The `NodeKind` handles, to narrow a generator's kind to one.
 */
const nodeKinds: ReadonlySet<string> = new Set(NodeKind.handles);

/**
 * The `AttributeName` handles, to narrow a generator's attribute name to one.
 */
const attributeNames: ReadonlySet<string> = new Set(AttributeName.handles);

/**
 * Whether a generator's kind is a `NodeKind` handle.
 *
 * @param kind - The kind a row names.
 * @returns Whether the composition holds it.
 */
const isKind = (kind: string): kind is Kind => nodeKinds.has(kind);

/**
 * Whether a generator's attribute is an `AttributeName` handle.
 *
 * @param name - The attribute a row names.
 * @returns Whether the composition holds it.
 */
const isName = (name: string): name is Name => attributeNames.has(name);

/**
 * Narrow a generator's kind to a `NodeKind` handle.
 *
 * @param kind - The kind a row names.
 * @returns The handle.
 * @throws {Error} When the composition holds no such kind, which the vocabulary list decides.
 */
export const kindOf = (kind: string): Kind => {
  if (isKind(kind)) {
    return kind;
  }

  throw new Error(
    `The expression typing names ${kind}, which the composed NodeKind roster does not hold. Correct the typing table in grammar/expression.ts or the vocabulary list.`,
  );
};

/**
 * Narrow a generator's attribute to an `AttributeName` handle.
 *
 * @param name - The attribute a row names.
 * @returns The handle.
 * @throws {Error} When the composition holds no such name.
 */
export const nameOf = (name: string): Name => {
  if (isName(name)) {
    return name;
  }

  throw new Error(
    `The expression typing names the attribute ${name}, which the composed AttributeName roster does not hold. Correct the reference table.`,
  );
};

// Rosters.

/**
 * Read a declaration code as the expression-typing code spelled the same. Every declaration code
 * the two rosters share is spelled alike, so a code the expression roster does not spell is a
 * defect of the rosters, thrown when the relations below are built.
 *
 * @param roster - The expression-typing roster.
 * @param code - The declaration code.
 * @param named - The roster's name, for the defect.
 * @returns The handle of `roster` spelled `code`.
 */
const spelledIn = <Handle extends string>(
  roster: readonly Handle[],
  code: string,
  named: string,
): Handle =>
  Option.getOrThrowWith(
    Arr.findFirst(roster, (handle) => handle === code),
    () => new Error(`The ${named} roster spells no handle ${code}, which its mapping reads.`),
  );

/**
 * The `ValueBase` handle a `BaseType` handle reads as: itself, which `ValueBase` spells. A variable
 * that has no base type, a record, reads as `unknown`, which no `BaseType` handle is.
 *
 * @param baseType - The declaration code.
 * @returns The expression-typing code.
 */
export const valueBaseOf = (baseType: string): (typeof valueBases)[number] =>
  spelledIn(valueBases, baseType, "ValueBase");

/**
 * The `ValueCardinality` handle a `Cardinality` handle reads as: itself, which `ValueCardinality`
 * spells for every declaration cardinality, `record` included.
 *
 * @param cardinality - The declaration code.
 * @returns The expression-typing code.
 */
export const valueCardinalityOf = (cardinality: string): (typeof valueCardinalities)[number] =>
  spelledIn(valueCardinalities, cardinality, "ValueCardinality");

/**
 * The typing of every expression kind, as the generator states it.
 */
export const typings: readonly ExpressionTyping[] = expressionTypings;

/**
 * The variable references processing makes, `VariableReference`'s rows over the processing kinds:
 * every attribute by which a rule or an expression names a variable.
 */
export const processingReferences: readonly {
  readonly attribute: Name;
  readonly kind: Kind;
  readonly spelling: "bare" | "braced";
}[] = (() => {
  const processing: ReadonlySet<string> = new Set([
    ...typings.map(({ kind }) => kind),
    ...ruleKinds,
  ]);

  return grammar.references.variableReference.rows
    .filter(({ kind }) => processing.has(kind))
    .map(({ attribute, kind, spelling }) => ({
      attribute: nameOf(attribute),
      kind: kindOf(kind),
      spelling,
    }));
})();

/**
 * A declaration kind's handle.
 */
type DeclarationHandle = (typeof DeclarationKind.handles)[number];

/**
 * Every declaration kind: what a variable expression and a default may name, an item variable of
 * any kind (information model §2.2.2: "Item variables are declared by variable declarations:
 * context, response, outcome or template variables").
 */
const anyDeclaration: readonly DeclarationHandle[] = [
  "qti-context-declaration",
  "qti-outcome-declaration",
  "qti-response-declaration",
  "qti-template-declaration",
];

/**
 * The declaration kinds each processing element names by its `identifier`, each as the
 * information model defines that attribute or the rule, with its section: what kind of variable
 * the element reads or sets, and whether it sets it (`sets`). A reference that names a variable of
 * another kind names no variable its element can read or set.
 *
 * A setter sets a variable of its own document: its attribute names "the outcome variable to be
 * set" (§5.87.1) or "the variable to be set" (§5.130.1, SetValue), and an item's variables reach
 * a test only to be read: "values taken from an individual item session can be looked up by
 * prefixing the name of the item variable" (§2.11.1.2). So a prefixed reading never resolves a
 * setter (spec reading 112).
 */
export const referenceDeclarations: readonly {
  readonly declarations: readonly DeclarationHandle[];
  readonly kind: Kind;
  readonly sets: boolean;
  readonly source: string;
}[] = [
  {
    declarations: ["qti-response-declaration"],
    kind: "qti-correct",
    sets: false,
    source: "§7.10.1, Correct's identifier: 'The identifier of the associated response variable'",
  },
  {
    declarations: anyDeclaration,
    kind: "qti-default",
    sets: false,
    source: "§7.12.1, Default's identifier: 'The identifier of the associated Item variable'",
  },
  {
    declarations: anyDeclaration,
    kind: "qti-variable",
    sets: false,
    source:
      "§7.47.1, Variable's identifier: 'The identifier of the item variable that has been declared in a corresponding variable declaration or of the built-in variables'",
  },
  {
    declarations: ["qti-response-declaration"],
    kind: "qti-map-response",
    sets: false,
    source:
      "§7.22.1, MapResponse's identifier: 'The identifier of the associated Response variable'",
  },
  {
    declarations: ["qti-response-declaration"],
    kind: "qti-map-response-point",
    sets: false,
    source:
      "§6.9.46: 'The mapResponsePoint expression looks up the value of a response variable that must be of base-type point'",
  },
  {
    declarations: ["qti-outcome-declaration"],
    kind: "qti-lookup-outcome-value",
    sets: true,
    source:
      "§5.87.1, LookupOutcomeValue's identifier: 'The identifier of the outcome variable to be set'; §6.32.1: 'sets the value of an outcome variable'",
  },
  {
    declarations: ["qti-outcome-declaration"],
    kind: "qti-set-outcome-value",
    sets: true,
    source:
      "§6.32.3 and §6.39.4: 'The setOutcomeValue rule sets the value of an outcome variable to the value obtained from the associated expression'",
  },
  {
    declarations: ["qti-template-declaration"],
    kind: "qti-set-template-value",
    sets: true,
    source:
      "§6.50.1: 'This sets the value of a template variable to the value obtained from the associated expression'",
  },
  {
    declarations: ["qti-outcome-declaration", "qti-response-declaration"],
    kind: "qti-set-default-value",
    sets: true,
    source: "§6.50.4: 'The response variable or outcome variable to have its default value set'",
  },
  {
    declarations: ["qti-response-declaration"],
    kind: "qti-set-correct-response",
    sets: true,
    source: "§6.50.5: 'The response variable to have its correct value set'",
  },
];

/**
 * The setters: the processing kinds whose `identifier` names the variable they set, which only
 * an unsplit reading of their own document's declaration resolves.
 */
export const setterKinds: readonly Kind[] = referenceDeclarations.flatMap(({ kind, sets }) =>
  sets ? [kind] : [],
);

/**
 * The expression kinds, the 64 `OperatorArity` holds.
 */
export const expressionKinds: readonly Kind[] = typings.map(({ kind }) => kindOf(kind));

/**
 * The rule and processing kinds.
 */
export const ruleKindHandles: readonly Kind[] = ruleKinds.map(kindOf);

/**
 * The processing roots, each with the language it opens.
 */
export const rootLanguages: readonly (readonly [Kind, (typeof languages)[number]])[] =
  processingRoots.map(([kind, language]) => [kindOf(kind), language] as const);
