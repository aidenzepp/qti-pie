/**
 * The producers of the law oracle's laws over the expressions (O4, lane OL): each law the oracle
 * declared and never raised, stated on the host from its source in the oracle's `lawSources` and
 * the schema's statement of it in `src/qti/expressions.ts`, over the grammar's typing of every
 * expression kind (`#pantry/grammar/expression.ts` `expressionTypings`).
 *
 * Each document is typed as the schema types it: every expression's value has a base type and a
 * cardinality, `unknown` for a variable no declaration types (reading 4), which every rule passes;
 * every processing element and expression is written in the language its processing root opens,
 * `none` outside any; and every variable reference resolves among the document's declarations,
 * else among its root's built-in variables, else to nothing. A test-level reference that names a
 * prefixed variable resolves to nothing here, its readings `#pantry/test/oracle-laws/tests.ts`'s.
 *
 * - **Over each expression** (`Expression`): `Operand fit`, `One base`, `Condition type`, `Outcome
 *   only`.
 * - **Over each reference** (`VariableRef`): `Set type`, `Lookup type`, `Reference type`, `Template
 *   reads`, `Mapped response`, `Item duration`, and `Variable kind` (the declaration kind each
 *   element reads or sets, `ReferenceDeclaration`).
 * - **Over each typing attribute and literal:** `Weighted base`, `Literal lexical`.
 * - **Over each template default of a test** (`TemplateDefault`): `Template default type`, its
 *   expression's type against its item's template declaration's.
 */
import { Option } from "effect";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import {
  conditionKinds,
  expressionTypings,
  integerMathOperators,
  lookupKind,
  processingRoots,
  referenceBaseRows,
  ruleKinds,
  setKinds,
} from "#pantry/grammar/expression.ts";
import type { ExpressionTyping } from "#pantry/grammar/expression.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { itemRefDocument, testDocumentsOf, testKinds } from "#pantry/test/oracle-laws/assembly.ts";
import { breachAt, collapsed, collapsedOf, elementsOf, valueOf } from "#pantry/test/oracle-view.ts";
import type { LawBreach, PackageRows, Row, View } from "#pantry/test/oracle-view.ts";
import { ncNameForm as ncName, typedValueHolds } from "#pantry/test/oracle-laws/typed.ts";

/**
 * The laws this module produces.
 */
export const expressionLaws = [
  "Operand fit",
  "One base",
  "Condition type",
  "Set type",
  "Lookup type",
  "Reference type",
  "Outcome only",
  "Template reads",
  "Mapped response",
  "Weighted base",
  "Literal lexical",
  "Item duration",
  "Variable kind",
  "Template default type",
] as const;

/**
 * A law of {@link expressionLaws}.
 */
export type ExpressionLaw = (typeof expressionLaws)[number];

/**
 * A breach of one of this module's laws.
 */
type Breach = LawBreach<ExpressionLaw>;

/**
 * A value's type: its base type and its cardinality, as the schema's `ValueBase` and
 * `ValueCardinality` codes spell them (`any` a null's base, `unknown` a type no declaration says).
 */
export interface Type {
  readonly base: string;
  readonly cardinality: string;
}

/**
 * The type no declaration says, which every rule passes (reading 4).
 */
const unknownType: Type = { base: "unknown", cardinality: "unknown" };

/**
 * The base types that say nothing: `any`, which passes every rule, and `unknown`.
 */
const silent: ReadonlySet<string> = new Set(["any", "unknown"]);

/**
 * Each expression kind's typing, by kind.
 */
const typings: ReadonlyMap<string, ExpressionTyping> = new Map(
  expressionTypings.map((typing) => [typing.kind, typing]),
);

/**
 * The rule and processing kinds, whose language their root opens.
 */
const rules: ReadonlySet<string> = new Set(ruleKinds);

/**
 * The language each processing root opens.
 */
const rootLanguages: ReadonlyMap<string, string> = new Map(processingRoots);

/**
 * The declaration kinds each processing element may name by its `identifier`, the schema's
 * `ReferenceDeclaration` (information model §7.10.1, §7.12.1, §7.47.1, §7.22.1, §6.9.46, §5.87.1,
 * §6.32.3, §6.50.1, §6.50.4, §6.50.5): a variable or a default any item variable's (§2.2.2:
 * "context, response, outcome or template variables").
 */
const referenceDeclarations: ReadonlyMap<string, readonly string[]> = new Map([
  ["qti-correct", ["qti-response-declaration"]],
  [
    "qti-default",
    [
      "qti-context-declaration",
      "qti-outcome-declaration",
      "qti-response-declaration",
      "qti-template-declaration",
    ],
  ],
  ["qti-lookup-outcome-value", ["qti-outcome-declaration"]],
  ["qti-map-response", ["qti-response-declaration"]],
  ["qti-map-response-point", ["qti-response-declaration"]],
  ["qti-set-correct-response", ["qti-response-declaration"]],
  ["qti-set-default-value", ["qti-outcome-declaration", "qti-response-declaration"]],
  ["qti-set-outcome-value", ["qti-outcome-declaration"]],
  ["qti-set-template-value", ["qti-template-declaration"]],
  [
    "qti-variable",
    [
      "qti-context-declaration",
      "qti-outcome-declaration",
      "qti-response-declaration",
      "qti-template-declaration",
    ],
  ],
]);

/**
 * The declaration kinds each element names by its `identifier`, re-exported for the test-level
 * readings (`#pantry/test/oracle-laws/tests.ts`).
 *
 * @param kind - The referring element's kind.
 * @returns The kinds, none for an element that names no variable by its `identifier`.
 */
export const declarationKindsOf = (kind: string): readonly string[] =>
  referenceDeclarations.get(kind) ?? [];

/**
 * The tables a reference's element reads in its variable's declaration: a map response's mapping,
 * a map response point's area mapping, and a lookup's match or interpolation table.
 */
const tableKinds: ReadonlyMap<string, readonly string[]> = new Map([
  ["qti-lookup-outcome-value", ["qti-match-table", "qti-interpolation-table"]],
  ["qti-map-response", ["qti-mapping"]],
  ["qti-map-response-point", ["qti-area-mapping"]],
]);

/**
 * An `xs:boolean` lexical form that is true, its whitespace collapsed: `true` or `1`.
 */
const truePattern = /^[\t\n\r ]*(?:true|1)[\t\n\r ]*$/u;

/**
 * Read a declaration code as an expression type's: `none`, a record's base type, reads `unknown`
 * (the schema's `ValueBaseOf`).
 *
 * @param baseType - The declaration's base type, `none` where it writes none.
 * @returns The value base.
 */
const valueBaseOf = (baseType: string): string => (baseType === "none" ? "unknown" : baseType);

/**
 * One variable reference a processing element makes, resolved: the attribute, the name, the
 * declaration it names or the built-in it is, and its type.
 */
interface Reference {
  readonly attribute: string;
  readonly declaration: Option.Option<Row>;
  readonly declarationKind: string;
  readonly identifier: string;
  readonly node: Row;
  readonly resolution: "builtIn" | "declared" | "unresolved";
  readonly type: Type;
}

/**
 * One document typed: each expression's type and each element's language, and its references.
 */
export interface Typed {
  readonly languageOf: (node: Row) => string;
  readonly references: readonly Reference[];
  readonly rows: View;
  readonly typeOf: (node: Row) => Type;
}

/**
 * Read a reference attribute's value as the name it spells (`VariableReference`): a bare name, an
 * NCName with the whitespace a collapsing type absorbs (no `INF` or `NaN` on a float's bound), or a
 * braced one, the name between braces exactly.
 *
 * @param lexical - The attribute's lexical form.
 * @param spelling - How the attribute spells a reference.
 * @param kind - The element's kind.
 * @returns The name, none for a literal.
 */
const spelledName = (lexical: string, spelling: string, kind: string): Option.Option<string> => {
  if (spelling === "braced") {
    return Option.fromNullishOr(/^\{(?<name>[^{}]+)\}$/u.exec(lexical)?.groups?.["name"]).pipe(
      Option.filter((name) => ncName.test(name)),
    );
  }

  const name = collapsed(lexical);

  return ncName.test(name) && !(kind === "qti-random-float" && /^(?:INF|NaN)$/u.test(name))
    ? Option.some(name)
    : Option.none();
};

/**
 * Read the base type an attribute-typed expression's attribute gives it: a base value's and a test
 * variables' `base-type`, spelled exactly (`ValueBaseForm`), `unknown` where a test variables
 * writes none; a math operator's `name`, `integer` for `signum`, `floor` and `ceil` and `float` for
 * every other (information model §2.11.3.32).
 *
 * @param rows - The document.
 * @param node - The expression.
 * @returns The base type.
 */
const attributeBaseOf = (rows: View, node: Row): string => {
  if (node.kind === "qti-math-operator") {
    return new RegExp(integerMathOperators, "u").test(
      Option.getOrElse(valueOf(rows, node.id, "name"), () => ""),
    )
      ? "integer"
      : "float";
  }

  return Option.getOrElse(valueOf(rows, node.id, "base-type"), () => "unknown");
};

/**
 * The one base type of a set of operands' base types, `any` set aside: `any` for none, `unknown`
 * for several (the schema's `baseOfOperands`).
 *
 * @param held - The base types.
 * @returns The one base type.
 */
const oneBaseOf = (held: ReadonlySet<string>): string => {
  if (held.size === 0) {
    return "any";
  }

  return held.size === 1 ? ([...held][0] ?? "unknown") : "unknown";
};

/**
 * The base types a list of types holds, `any` set aside, as `ValueBaseBit` reads them.
 *
 * @param types - The types.
 * @returns The base types.
 */
const basesOf = (types: readonly Type[]): ReadonlySet<string> =>
  new Set(types.map(({ base }) => base).filter((base) => base !== "any"));

/**
 * What an expression's type is derived from: its kind's typing, its operands' types, its
 * reference's type for a declared typing, and the element itself for an attribute typing.
 */
interface TypingInput {
  readonly declared: Type;
  readonly node: Row;
  readonly operands: readonly Type[];
  readonly rows: View;
  readonly typing: ExpressionTyping;
}

/**
 * The cardinality of a kind of one result cardinality, `unknown` for a kind of several.
 *
 * @param typing - The kind's typing.
 * @returns The cardinality.
 */
const resultCardinalityOf = (typing: ExpressionTyping): string =>
  typing.resultCardinalities.length === 1
    ? (typing.resultCardinalities[0] ?? "unknown")
    : "unknown";

/**
 * Each typing's derivation of an expression's type (the schema's `resultDerived` and the fixed,
 * declared and attribute typings `ResultBase`, `VariableRef` and `ExpressionAttribute` give):
 *
 * - `fixed`: the kind's one result;
 * - `declared`: the variable its `identifier` names;
 * - `attribute`: its own attribute's base type, single, or a test variables' multiple;
 * - `numeric`: `unknown` when an operand is, `integer` when every operand is, `float` otherwise;
 * - `container`: its operands' one base type, `any` for none, `unknown` for several;
 * - `first`: its operand's base type;
 * - `second`: its later operands' one base type and one cardinality.
 */
const typers: Readonly<Record<ExpressionTyping["typing"], (input: TypingInput) => Type>> = {
  attribute: ({ node, rows, typing }) => ({
    base: attributeBaseOf(rows, node),
    cardinality: resultCardinalityOf(typing),
  }),
  container: ({ operands, typing }) => {
    const bases = basesOf(operands);

    return {
      base: bases.size > 1 ? "unknown" : oneBaseOf(bases),
      cardinality: resultCardinalityOf(typing),
    };
  },
  declared: ({ declared }) => declared,
  first: ({ operands, typing }) => ({
    base: oneBaseOf(basesOf(operands)),
    cardinality: resultCardinalityOf(typing),
  }),
  fixed: ({ typing }) => ({
    base: typing.resultBases[0] ?? "unknown",
    cardinality: resultCardinalityOf(typing),
  }),
  numeric: ({ operands, typing }) => {
    const bases = basesOf(operands);
    let base = "float";
    if (bases.has("unknown")) {
      base = "unknown";
    } else if (bases.size === 1 && bases.has("integer")) {
      base = "integer";
    }

    return { base, cardinality: resultCardinalityOf(typing) };
  },
  second: ({ operands }) => {
    const tail = operands.slice(1);
    const cardinalities = new Set(
      tail.map(({ cardinality }) => cardinality).filter((cardinality) => cardinality !== "unknown"),
    );

    return {
      base: oneBaseOf(basesOf(tail)),
      cardinality: cardinalities.size === 1 ? ([...cardinalities][0] ?? "unknown") : "unknown",
    };
  },
};

/**
 * Type one document: resolve every reference, then type every expression bottom-up and give every
 * processing element its language.
 *
 * @param rows - The document.
 * @param grammar - The composed grammar.
 * @returns The typed document.
 */
export const typedOf = (rows: View, grammar: ComposedGrammar): Typed => {
  const rootKind = Option.match(rows.root, { onNone: () => "", onSome: ({ kind }) => kind });
  const declared = new Map<string, Row>();
  for (const node of rows.members) {
    if (grammar.references.declarationKind.has(node.kind)) {
      for (const identifier of Option.toArray(collapsedOf(rows, node.id, "identifier"))) {
        if (!declared.has(identifier)) {
          declared.set(identifier, node);
        }
      }
    }
  }

  const builtIns = new Map(
    grammar.references.builtIn.rows
      .filter(({ root }) => root === rootKind)
      .map((row) => [row.variable, row] as const),
  );
  const processing = new Set([...typings.keys(), ...rules]);
  const references = rows.members.flatMap((node): readonly Reference[] =>
    processing.has(node.kind)
      ? grammar.references.variableReference.rows
          .filter(({ kind }) => kind === node.kind)
          .flatMap(({ attribute, spelling }) =>
            Option.toArray(
              Option.flatMap(valueOf(rows, node.id, attribute), (lexical) =>
                spelledName(lexical, spelling, node.kind),
              ),
            ).map((identifier): Reference => {
              const declaration = declared.get(identifier);
              const builtIn = builtIns.get(identifier);
              if (declaration !== undefined) {
                return {
                  attribute,
                  declaration: Option.some(declaration),
                  declarationKind: declaration.kind,
                  identifier,
                  node,
                  resolution: "declared",
                  type: {
                    base: valueBaseOf(
                      Option.getOrElse(
                        collapsedOf(rows, declaration.id, "base-type"),
                        () => "none",
                      ),
                    ),
                    cardinality: Option.getOrElse(
                      collapsedOf(rows, declaration.id, "cardinality"),
                      () => "unknown",
                    ),
                  },
                };
              }

              return builtIn === undefined
                ? {
                    attribute,
                    declaration: Option.none(),
                    declarationKind: "none",
                    identifier,
                    node,
                    resolution: "unresolved",
                    type: unknownType,
                  }
                : {
                    attribute,
                    declaration: Option.none(),
                    declarationKind: builtIn.declaration,
                    identifier,
                    node,
                    resolution: "builtIn",
                    type: { base: valueBaseOf(builtIn.baseType), cardinality: builtIn.cardinality },
                  };
            }),
          )
      : [],
  );
  const named = new Map(
    references
      .filter(({ attribute }) => attribute === "identifier")
      .map((reference) => [reference.node.id, reference] as const),
  );
  const languages = new Map<NodeId, string>();
  // A language is its root's, carried down through rules and expressions; the walk up stops at a
  // node it has met, so a cycle of parent links or a second root ends it.
  const languageOf = (node: Row): string => {
    const chain: Row[] = [];
    const met = new Set<NodeId>();
    let at: Row | undefined = node;
    let language = "none";
    while (at !== undefined && !met.has(at.id)) {
      const known = languages.get(at.id);
      if (known !== undefined) {
        language = known;
        break;
      }

      met.add(at.id);
      chain.push(at);

      const opened = rootLanguages.get(at.kind);
      if (opened !== undefined) {
        language = opened;
        break;
      }

      const parent = rows.byId.get(at.parent);
      at =
        parent !== undefined &&
        parent.start > 0n &&
        (rules.has(parent.kind) || typings.has(parent.kind))
          ? parent
          : undefined;
    }

    for (const held of chain) {
      languages.set(held.id, language);
    }

    return language;
  };
  const types = new Map<NodeId, Type>();
  const operandsOf = (node: Row): readonly Row[] =>
    elementsOf(rows, node.id).filter(({ kind }) => typings.has(kind));
  // An expression met again before its type is known stands on a cycle of parent links, which
  // the tree laws refuse; it is typed unknown, so the typing ends.
  const typing = new Set<NodeId>();
  const typeOf = (node: Row): Type => {
    const known = types.get(node.id);
    if (known !== undefined) {
      return known;
    }

    if (typing.has(node.id)) {
      return unknownType;
    }

    typing.add(node.id);

    const kindTyping = typings.get(node.kind);
    const type =
      kindTyping === undefined
        ? unknownType
        : typers[kindTyping.typing]({
            declared: named.get(node.id)?.type ?? unknownType,
            node,
            operands: operandsOf(node).map(typeOf),
            rows,
            typing: kindTyping,
          });
    types.set(node.id, type);

    return type;
  };

  return { languageOf, references, rows, typeOf };
};

/**
 * Judge each expression of a typed document by the operand laws (P23, P21, P25): its operands'
 * base types and cardinalities, first and later, are among those its kind takes; a kind that takes
 * one base type or one cardinality gets one; a condition is boolean and single; a test-only
 * operator stands in outcome processing.
 *
 * @param typed - The document.
 * @returns The breaches.
 */
const expressionBreachesOf = (typed: Typed): readonly Breach[] =>
  typed.rows.members.flatMap((node): readonly Breach[] => {
    const typing = typings.get(node.kind);
    if (typing === undefined) {
      return [];
    }

    const { rows } = typed;
    const operands = elementsOf(rows, node.id)
      .map((child, at) => ({ at, child }))
      .filter(({ child }) => typings.has(child.kind))
      .map(({ at, child }) => ({ lead: at === 0, type: typed.typeOf(child) }));
    const bases = new Set([...typing.operandBases, "unknown"]);
    const unfit = operands.find(
      ({ lead, type }) =>
        (type.base !== "any" && !bases.has(type.base)) ||
        (type.cardinality !== "unknown" &&
          !(lead ? typing.lead : typing.tail).some((held) => held === type.cardinality)),
    );
    const heldBases = new Set(
      operands.map(({ type }) => type.base).filter((base) => base !== "any" && base !== "unknown"),
    );
    const heldCardinalities = new Set(
      operands
        .map(({ type }) => type.cardinality)
        .filter((cardinality) => cardinality !== "unknown"),
    );
    const parent = rows.byId.get(node.parent);
    const own = typed.typeOf(node);
    const condition =
      parent !== undefined &&
      conditionKinds.some((kind) => kind === parent.kind) &&
      !(
        (own.base === "boolean" || silent.has(own.base)) &&
        (own.cardinality === "single" || own.cardinality === "unknown")
      );
    const language = typed.languageOf(node);

    return [
      ...(unfit === undefined
        ? []
        : [
            breachAt(rows, node, "Operand fit", {
              baseType: unfit.type.base,
              cardinality: unfit.type.cardinality,
            }),
          ]),
      ...((typing.oneBase && heldBases.size > 1) ||
      (typing.oneCardinality && heldCardinalities.size > 1)
        ? [
            breachAt(rows, node, "One base", {
              bases: [...heldBases].join(" "),
              cardinalities: [...heldCardinalities].join(" "),
            }),
          ]
        : []),
      ...(condition
        ? [
            breachAt(rows, node, "Condition type", {
              baseType: own.base,
              cardinality: own.cardinality,
              parentKind: parent.kind,
            }),
          ]
        : []),
      ...(typing.outcomeOnly && language !== "outcome"
        ? [breachAt(rows, node, "Outcome only", { language })]
        : []),
    ];
  });

/**
 * The base type a variable named in place of a literal must have (`ReferenceBase`, rule P24): a
 * string for a pattern, a float for a random float's bounds, an integer for every other.
 *
 * @param grammar - The composed grammar.
 * @returns Each (kind, attribute)'s base, by `kind attribute`.
 */
const referenceBasesOf = (grammar: ComposedGrammar): ReadonlyMap<string, string> =>
  new Map(
    referenceBaseRows(grammar.references.variableReference.rows).map(
      ({ attribute, base, kind }) => [`${kind} ${attribute}`, base],
    ),
  );

/**
 * What the reference laws read of one reference: its own fields, its element's one expression's
 * type, the table its declaration holds of those its element reads, its element's language, and
 * its document's root and timing.
 */
interface Read {
  readonly heldType: Type;
  readonly language: string;
  readonly reference: Reference;
  readonly referenceBase: string;
  readonly rootKind: string;
  readonly table: string;
  readonly timeDependent: boolean;
}

/**
 * Whether two types fit, a type no declaration says aside: `Set_type`'s and
 * `Template_default_type`'s comparison.
 *
 * @param held - The value's type.
 * @param wanted - The variable's type.
 * @returns Whether the value fits the variable.
 */
const fits = (held: Type, wanted: Type): boolean =>
  (held.base === wanted.base || silent.has(held.base) || silent.has(wanted.base)) &&
  (held.cardinality === wanted.cardinality ||
    held.cardinality === "unknown" ||
    wanted.cardinality === "unknown");

/**
 * The reference laws, each a predicate that a read breaks (information model §2.5.1.3, §2.5.1.4,
 * §8.24, §8.25, §8.42, §2.8, §2.11.3.29, §2.11.3.30, §2.2.2.2), by the law it breaks.
 */
const referenceLaws: readonly (readonly [ExpressionLaw, (read: Read) => boolean])[] = [
  [
    "Set type",
    ({ heldType, reference }) =>
      reference.attribute === "identifier" &&
      setKinds.some((kind) => kind === reference.node.kind) &&
      !fits(heldType, reference.type),
  ],
  [
    "Lookup type",
    ({ heldType, reference, table }) =>
      reference.attribute === "identifier" &&
      reference.node.kind === lookupKind &&
      !(
        (heldType.cardinality === "single" || heldType.cardinality === "unknown") &&
        ["duration", "float", "integer", "any", "unknown"].includes(heldType.base) &&
        (reference.resolution !== "declared" || table !== "none") &&
        (table !== "qti-match-table" || ["integer", "any", "unknown"].includes(heldType.base))
      ),
  ],
  [
    "Reference type",
    ({ reference, referenceBase }) =>
      reference.attribute !== "identifier" &&
      reference.resolution !== "unresolved" &&
      !(
        reference.resolution === "declared" &&
        ["qti-outcome-declaration", "qti-template-declaration"].includes(
          reference.declarationKind,
        ) &&
        (reference.type.base === referenceBase || silent.has(reference.type.base)) &&
        (reference.type.cardinality === "single" || reference.type.cardinality === "unknown")
      ),
  ],
  [
    "Template reads",
    ({ language, reference }) =>
      language === "template" &&
      typings.has(reference.node.kind) &&
      ((reference.resolution === "declared" &&
        ["qti-outcome-declaration", "qti-response-declaration"].includes(
          reference.declarationKind,
        )) ||
        (reference.resolution === "builtIn" && reference.identifier !== "QTI_CONTEXT")),
  ],
  [
    "Mapped response",
    ({ reference, table }) =>
      reference.attribute === "identifier" &&
      (reference.node.kind === "qti-map-response" ||
        reference.node.kind === "qti-map-response-point") &&
      reference.resolution === "declared" &&
      !(
        reference.declarationKind === "qti-response-declaration" &&
        ((reference.node.kind === "qti-map-response" && table === "qti-mapping") ||
          (reference.node.kind === "qti-map-response-point" &&
            table === "qti-area-mapping" &&
            (reference.type.base === "point" || silent.has(reference.type.base))))
      ),
  ],
  [
    "Item duration",
    ({ reference, rootKind, timeDependent }) =>
      rootKind === testKinds.item &&
      reference.resolution === "builtIn" &&
      reference.identifier === "duration" &&
      !timeDependent,
  ],
  [
    "Variable kind",
    ({ reference }) => {
      const allowed = declarationKindsOf(reference.node.kind);

      return (
        reference.attribute === "identifier" &&
        reference.resolution !== "unresolved" &&
        allowed.length > 0 &&
        !allowed.includes(reference.declarationKind)
      );
    },
  ],
];

/**
 * Judge each reference of a typed document by the reference laws (P20, P22, P24, P26, P27, A62)
 * and `Variable kind`.
 *
 * @param typed - The document.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
const referenceBreachesOf = (typed: Typed, grammar: ComposedGrammar): readonly Breach[] => {
  const { rows } = typed;
  const rootKind = Option.match(rows.root, { onNone: () => "", onSome: ({ kind }) => kind });
  const timeDependent =
    rootKind === testKinds.item &&
    Option.exists(rows.root, ({ id }) =>
      Option.exists(valueOf(rows, id, "time-dependent"), (lexical) => truePattern.test(lexical)),
    );
  const referenceBases = referenceBasesOf(grammar);

  return typed.references.flatMap((reference): readonly Breach[] => {
    const { node } = reference;
    const held = elementsOf(rows, node.id).find(({ kind }) => typings.has(kind));
    const tables = tableKinds.get(node.kind) ?? [];
    const table = Option.match(reference.declaration, {
      onNone: () => "none",
      onSome: (declaration) =>
        elementsOf(rows, declaration.id).find(({ kind }) => tables.includes(kind))?.kind ?? "none",
    });
    const read: Read = {
      heldType: held === undefined ? unknownType : typed.typeOf(held),
      language: typed.languageOf(node),
      reference,
      referenceBase: referenceBases.get(`${node.kind} ${reference.attribute}`) ?? "",
      rootKind,
      table,
      timeDependent,
    };
    const keys = {
      allowed: declarationKindsOf(node.kind).join(" "),
      attribute: reference.attribute,
      base: read.referenceBase,
      baseType: reference.type.base,
      cardinality: reference.type.cardinality,
      declarationKind: reference.declarationKind,
      heldBase: read.heldType.base,
      heldCardinality: read.heldType.cardinality,
      identifier: reference.identifier,
      table: table === "none" ? "" : table,
    };

    return referenceLaws.flatMap(([law, breaks]) =>
      breaks(read) ? [breachAt(rows, node, law, keys)] : [],
    );
  });
};

/**
 * Judge each typing attribute and literal of a document: a test variables with a
 * `weight-identifier` is of base type float, where it writes one (§2.11.4.8, P29); a base value's
 * text is a lexical form of its base type (§8.13, `Literal lexical`).
 *
 * @param typed - The document.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
const literalBreachesOf = (typed: Typed, grammar: ComposedGrammar): readonly Breach[] => {
  const { rows } = typed;

  return rows.members.flatMap((node): readonly Breach[] => {
    if (
      node.kind === "qti-test-variables" &&
      Option.isSome(valueOf(rows, node.id, "weight-identifier"))
    ) {
      const { base } = typed.typeOf(node);

      return base === "float" || base === "unknown"
        ? []
        : [breachAt(rows, node, "Weighted base", { baseType: base })];
    }

    if (node.kind === "qti-base-value") {
      const baseType = Option.getOrElse(valueOf(rows, node.id, "base-type"), () => "");

      return typedValueHolds(grammar, baseType, node.stringValue)
        ? []
        : [breachAt(rows, node, "Literal lexical", { baseType, text: node.stringValue })];
    }

    return [];
  });
};

/**
 * Judge one folded document by the expression laws it states alone.
 *
 * @param rows - The document, merged with what it includes.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
export const expressionDocumentBreaches = (
  rows: View,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const typed = typedOf(rows, grammar);

  return [
    ...expressionBreachesOf(typed),
    ...referenceBreachesOf(typed, grammar),
    ...literalBreachesOf(typed, grammar),
  ];
};

/**
 * Judge each template default of each test or section document of a package (A38, P20 for a
 * setter): its expression's type fits the type of the variable its item declares under the
 * template's identifier, a type no declaration says, or one the item does not declare, aside.
 *
 * @param input - The package.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
export const expressionPackageBreaches = (
  input: PackageRows,
  grammar: ComposedGrammar,
): readonly Breach[] =>
  [...testDocumentsOf(input, grammar).values()].flatMap((document) => {
    const { rows } = document.listed;
    const typed = typedOf(rows, grammar);

    return rows.members.flatMap((node): readonly Breach[] => {
      if (node.kind !== "qti-template-default") {
        return [];
      }

      const itemRef = rows.byId.get(node.parent);
      const expression = elementsOf(rows, node.id).find(({ kind }) => typings.has(kind));
      if (itemRef === undefined || expression === undefined) {
        return [];
      }

      const template = Option.getOrElse(
        collapsedOf(rows, node.id, "template-identifier"),
        () => "",
      );
      const declared = Option.flatMap(itemRefDocument(input, document.listed, itemRef), (item) =>
        Option.fromNullishOr(
          item.rows.members.find(
            (held) =>
              grammar.references.declarationKind.has(held.kind) &&
              Option.contains(collapsedOf(item.rows, held.id, "identifier"), template),
          ),
        ).pipe(
          // A declaration that writes no cardinality is refused by AL3 alone, not compared as the
          // `single` the schema holds it as (the orchestrator's ruling of 2026-11-06).
          Option.flatMap((declaration) =>
            Option.map(collapsedOf(item.rows, declaration.id, "cardinality"), (cardinality) => ({
              base: valueBaseOf(
                Option.getOrElse(collapsedOf(item.rows, declaration.id, "base-type"), () => "none"),
              ),
              cardinality,
            })),
          ),
        ),
      );
      const held = typed.typeOf(expression);
      // Template_default_type sets aside an unknown held cardinality, never the declaration's.
      const fitting = Option.match(declared, {
        onNone: () => true,
        onSome: (type) =>
          (held.base === type.base || silent.has(held.base) || type.base === "unknown") &&
          (held.cardinality === type.cardinality || held.cardinality === "unknown"),
      });

      return fitting
        ? []
        : [
            breachAt(rows, node, "Template default type", {
              declared: Option.match(declared, {
                onNone: () => "",
                onSome: ({ base, cardinality }) => `${base} ${cardinality}`,
              }),
              held: `${held.base} ${held.cardinality}`,
              itemRef: Option.getOrElse(collapsedOf(rows, itemRef.id, "identifier"), () => ""),
              template,
            }),
          ];
    });
  });
