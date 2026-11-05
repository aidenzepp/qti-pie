/**
 * The closed relations of variables and the references to them: `DeclarationKind`, `Declares`,
 * `BuiltInVariable`, `VariableReference`, `ContentReference`, `ChoiceBound` and `SectionPart`
 * (fin.md §14, §17; review R9).
 *
 * Each is a priori, a fact of QTI's vocabulary, so it is a closed relation. The rows are a
 * vocabulary's facet ({@link ReferenceFacet}), and {@link references} codes the facets of a
 * composition in its rosters. The ASI facet is derived, never typed: QTI's readings below, each
 * citing its source, applied to the XSDs' attribute declarations and content-model IR
 * (`src/vocab/inventory/`). A reading states only what the XSD does not: which attribute pairs
 * bound a count, what a reference names, which variables are built in, which kinds are processing.
 * The XSD states the rest: which kinds declare which attributes, how each attribute is typed, what
 * a kind's content holds, and what a section's model repeats.
 *
 * None has a version digit, because each holds in 3.0.0 and 3.0.1 alike: an attribute is read in
 * every version that declares it, and `references.test.ts` checks every relation against both XSDs.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info | QTI 3.0 ASI Information Model}
 */
import { Array as Arr, Option, Result } from "effect";
import { closed, idField, roster } from "#pantry/grammar/closed.ts";
import type { Closed, ClosedRelationError, IdField, Roster } from "#pantry/grammar/closed.ts";
import type { KindSet } from "#pantry/grammar/kinds.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import { contentModels } from "#pantry/vocab/inventory/models.ts";
import type {
  AttributeDeclaration,
  ContentModel,
  Particle,
  TypeReading,
} from "#pantry/vocab/inventory/types.ts";

/**
 * The ways a reference's value names a variable, in code order: the `ReferenceSpelling` roster's
 * handles. A `bare` reference is the variable's identifier itself, an NCName; a `braced` one is the
 * identifier between braces, `{identifier}`. Any other value of the attribute is a literal.
 */
export const spellings = ["bare", "braced"] as const;

/**
 * A `ReferenceSpelling` handle.
 */
export type Spelling = (typeof spellings)[number];

/**
 * What a reference may name: any variable, declared or built in, as a processing element's
 * references may (`P8`); or only a declaration of one of the listed declaration kinds, as an item's
 * content references may, where no built-in counts (`feedback-ref`, `template-ref`,
 * `printed-variable-ref`).
 */
export type Names =
  | { readonly _tag: "variable" }
  | { readonly _tag: "declaration"; readonly kinds: Arr.NonEmptyReadonlyArray<string> };

/**
 * One attribute by which an element of a kind names a variable, how its value spells the name, and
 * what the name may be.
 */
export interface ReferenceRow {
  readonly attribute: string;
  readonly kind: string;
  readonly names: Names;
  readonly spelling: Spelling;
}

/**
 * One variable QTI declares itself, so that a document names it undeclared, and the declaration
 * kind it stands as.
 */
export interface BuiltInRow {
  readonly declaration: string;
  readonly variable: string;
}

/**
 * One kind's bound on a count: the attribute of the least count and the attribute of the most.
 */
export interface BoundRow {
  readonly kind: string;
  readonly max: string;
  readonly min: string;
}

/**
 * A vocabulary's share of the reference relations: its declaration kinds, its built-in variables,
 * its references, its count bounds and the kinds a section of it holds as parts. A vocabulary with
 * none of these states {@link noReferences}.
 */
export interface ReferenceFacet {
  readonly builtIns: readonly BuiltInRow[];
  readonly choiceBounds: readonly BoundRow[];
  readonly declarations: readonly string[];
  readonly references: readonly ReferenceRow[];
  readonly sectionParts: readonly string[];
}

/**
 * The reference facet of a vocabulary that states none.
 */
export const noReferences: ReferenceFacet = {
  builtIns: [],
  choiceBounds: [],
  declarations: [],
  references: [],
  sectionParts: [],
};

/**
 * The attribute whose presence makes a kind a declaration: a variable's declaration is the element
 * that states its cardinality.
 *
 * A variable is an identifier, a cardinality and a base type (information model §2.2.2, Item
 * Variables), and the ASI XSDs declare `cardinality` on the four `qti-*-declaration` types and on
 * no other. So the XSD states the declaration kinds, and `DeclarationKind` reads them from it.
 */
const declaringAttribute = "cardinality";

/**
 * The variables QTI declares itself, which a document's processing names without declaring them,
 * each with the declaration kind it stands as: the built-in response variables `numAttempts` and
 * `duration`, the built-in outcome variable `completionStatus` and the built-in context variable
 * `QTI_CONTEXT` (information model §2.2.2, Item Variables: the context, response and outcomes
 * variables). The order is their codes'. No XSD names them.
 *
 * Spec reading 29 types `duration` by where it is read; its declaration kind is the same
 * everywhere.
 */
const builtIns: readonly BuiltInRow[] = [
  { declaration: "qti-response-declaration", variable: "numAttempts" },
  { declaration: "qti-response-declaration", variable: "duration" },
  { declaration: "qti-outcome-declaration", variable: "completionStatus" },
  { declaration: "qti-context-declaration", variable: "QTI_CONTEXT" },
];

/**
 * The attribute by which a processing element names the variable it reads or writes: `identifier`,
 * on `qti-variable`, `qti-correct`, `qti-default`, the two mappings, the lookup and the four set
 * rules (information model, each class's `identifier`). Processing declares no variable, so in
 * processing `identifier` always names one; in content it is an element's own name.
 */
const processingName = "identifier";

/**
 * The roots of processing: response, outcome and template processing (information model, the
 * `ResponseProcessing`, `OutcomeProcessing` and `TemplateProcessing` classes). A processing kind is
 * one their content models reach, the expressions and rules; an XInclude standing for one is no
 * processing kind of its own.
 */
const processingRoots = [
  "qti-outcome-processing",
  "qti-response-processing",
  "qti-template-processing",
] as const;

/**
 * The root of an item's content: what an item's content models reach, processing apart, is where
 * {@link contentNames} and the printed variable name an item's own declarations. A test's
 * `qti-test-feedback` and `qti-template-default` are outside it: the first names its test's
 * outcome, the second its referenced item's template variable, neither a declaration of an item.
 */
const itemRoot = "qti-assessment-item";

/**
 * The XSD types that spell a variable reference as a member of an attribute's union, beside the
 * literal member, and the spelling each gives.
 *
 * The information model types these attributes integer-, float- or string-or-variable-reference;
 * the ASI XSDs write the reference member as `VariableStringDType` (an NCName), as `xs:NCName`
 * itself (`qti-index`'s `n` and `qti-repeat`'s `number-repeats`), or, where the literal is a string
 * an NCName could be, as `EncVariableStringDType`, an NCName between braces (`qti-pattern-match`'s
 * `pattern`). No other union of either XSD has an NCName member.
 */
const referenceMembers: ReadonlyMap<string, Spelling> = new Map([
  ["EncVariableStringDType", "braced"],
  ["VariableStringDType", "bare"],
  ["xs:NCName", "bare"],
]);

/**
 * The attributes by which an item's content names a declaration, and the declaration kind each
 * names: a feedback element is shown by an outcome (`outcome-identifier`), and a template element
 * or a choice by a template variable (`template-identifier`), on every kind that declares the
 * attribute (information model, the `outcome-identifier` of §5.49.1, §5.52.1, §5.93.1 and §5.148.1;
 * the `template-identifier` of §5.122.1, §5.124.1, §5.145.1, §5.155.1 and the nine choices').
 */
const contentNames: ReadonlyMap<string, Arr.NonEmptyReadonlyArray<string>> = new Map([
  ["outcome-identifier", ["qti-outcome-declaration"]],
  ["template-identifier", ["qti-template-declaration"]],
]);

/**
 * The kinds whose every reference names one of a few declaration kinds, and the attributes by
 * which each names a variable beside those its XSD types as references.
 *
 * A printed variable prints the outcome or template variable its `identifier` names, and the
 * variable references its `base` and `index` may hold name outcome or template variables too
 * (information model, PrintedVariable; the rule `printed-variable-ref`, which also holds a `base`
 * or `index` reference to an integer single variable). A portable custom interaction's context
 * variable names the built-in `QTI_CONTEXT` or a declared context variable (information model
 * §2.2.2.1, Context Variable; the Schematron's rule 20Ba, spec reading 9).
 */
const printing: ReadonlyMap<
  string,
  {
    readonly declarations: Arr.NonEmptyReadonlyArray<string>;
    readonly named: readonly string[];
  }
> = new Map([
  [
    "qti-printed-variable",
    {
      declarations: ["qti-outcome-declaration", "qti-template-declaration"],
      named: ["identifier"],
    },
  ],
  [
    "qti-context-variable",
    {
      declarations: ["qti-context-declaration"],
      named: ["identifier"],
    },
  ],
]);

/**
 * The pairs of count attributes whose least may not exceed their most, unless the most is 0, which
 * bounds nothing: the choices, the associations, a choice's matches, a medium's plays and an
 * extended text's strings (information model, each interaction's and choice's `min-*` and `max-*`,
 * `match-min` and `match-max`, and §5.48.7's `min-strings`; spec readings 18 and 53 for the 0
 * exemption, and 67; the rule `choice-bounds`). The kinds that carry a pair are the XSD's: every
 * kind declaring both.
 */
const boundPairs: readonly Omit<BoundRow, "kind">[] = [
  { max: "max-choices", min: "min-choices" },
  { max: "max-associations", min: "min-associations" },
  { max: "match-max", min: "match-min" },
  { max: "max-plays", min: "min-plays" },
  { max: "max-strings", min: "min-strings" },
];

/**
 * The kind whose parts a selection selects among: the assessment section (information model,
 * §4.2.15, `sectionPart`; spec reading 26, a section holds at least one).
 */
const sectionKind = "qti-assessment-section";

/**
 * Read the name of a simple type a union member is or restricts.
 *
 * @param member - A member of a union.
 * @returns The named type, or none for an anonymous list, union or restriction of one.
 */
const memberName = (member: TypeReading): Option.Option<string> => {
  switch (member._tag) {
    case "named": {
      return Option.some(member.name);
    }
    case "restriction": {
      return member.base._tag === "named" ? Option.some(member.base.name) : Option.none();
    }
    case "list":
    case "union": {
      return Option.none();
    }
    default: {
      return member satisfies never;
    }
  }
};

/**
 * Read how an attribute's XSD type spells a variable reference.
 *
 * @param attribute - The attribute's declaration.
 * @returns The spelling of its union's reference member, or none for an attribute whose type has no
 *   such member.
 */
const spellingOf = (attribute: AttributeDeclaration): Option.Option<Spelling> =>
  attribute.type.inline.pipe(
    Option.flatMap((inline) =>
      inline._tag === "union"
        ? Arr.findFirst(inline.members, (member) =>
            memberName(member).pipe(
              Option.flatMap((name) => Option.fromNullishOr(referenceMembers.get(name))),
            ),
          )
        : Option.none(),
    ),
  );

/**
 * List the kinds of a class with their attributes, each (kind, name) once: its first declaration,
 * since a reference's meaning is the same in every version that declares it.
 *
 * @param declarations - The attribute declarations.
 * @param kinds - The kinds of the class.
 * @returns Each kind and one of its attributes, in declaration order.
 */
const attributesIn = (
  declarations: readonly AttributeDeclaration[],
  kinds: ReadonlySet<string>,
): readonly { readonly attribute: AttributeDeclaration; readonly kind: string }[] => {
  const first = new Map<string, AttributeDeclaration>();
  for (const attribute of declarations) {
    const key = `${attribute.kind} ${attribute.name}`;
    if (kinds.has(attribute.kind) && !first.has(key)) {
      first.set(key, attribute);
    }
  }

  return Array.from(first.values(), (attribute) => ({ attribute, kind: attribute.kind }));
};

/**
 * What a reference that no reading restricts may name: any variable, declared or built in.
 */
const anyVariable: Names = { _tag: "variable" };

/**
 * Read the references processing makes: each kind's `identifier` ({@link processingName}), and
 * every attribute its XSD types as a literal or a reference. Each may name any variable.
 *
 * @param declarations - The processing kinds' attribute declarations.
 * @param kinds - The processing kinds.
 * @returns The references, in declaration order.
 */
const processingReferences = (
  declarations: readonly AttributeDeclaration[],
  kinds: ReadonlySet<string>,
): readonly ReferenceRow[] =>
  attributesIn(declarations, kinds).flatMap(({ attribute, kind }) =>
    Option.toArray(
      attribute.name === processingName ? Option.some<Spelling>("bare") : spellingOf(attribute),
    ).map((spelling) => ({ attribute: attribute.name, kind, names: anyVariable, spelling })),
  );

/**
 * Read the references an item's content makes: the attributes {@link contentNames} reads on every
 * kind, a printing kind's own named attributes ({@link printing}), and every attribute the XSD
 * types as a literal or a reference.
 *
 * A reference a reading names is the bare identifier; any other is spelled as its XSD type's
 * reference member spells it. It names a declaration of its attribute's kinds, else of its printing
 * kind's, and a reference neither restricts may name any variable.
 *
 * @param declarations - The content kinds' attribute declarations.
 * @param kinds - The kinds of an item's content.
 * @returns The references, in declaration order.
 */
const contentReferences = (
  declarations: readonly AttributeDeclaration[],
  kinds: ReadonlySet<string>,
): readonly ReferenceRow[] =>
  attributesIn(declarations, kinds).flatMap(({ attribute, kind }) => {
    const printed = Option.fromNullishOr(printing.get(kind));
    const meaning = Option.fromNullishOr(contentNames.get(attribute.name));
    const read =
      Option.isSome(meaning) ||
      Option.exists(printed, ({ named }) => named.includes(attribute.name));
    const names = Option.match(
      Option.orElse(meaning, () => printed.pipe(Option.map((held) => held.declarations))),
      {
        onNone: () => anyVariable,
        onSome: (targets): Names => ({ _tag: "declaration", kinds: targets }),
      },
    );

    return Option.toArray(read ? Option.some<Spelling>("bare") : spellingOf(attribute)).map(
      (spelling) => ({ attribute: attribute.name, kind, names, spelling }),
    );
  });

/**
 * Read the declaration kinds: every kind that declares {@link declaringAttribute}, once.
 *
 * @param declarations - The attribute declarations.
 * @returns The kinds, in declaration order.
 */
const declarationsIn = (declarations: readonly AttributeDeclaration[]): readonly string[] => [
  ...new Set(
    declarations.filter(({ name }) => name === declaringAttribute).map(({ kind }) => kind),
  ),
];

/**
 * Read the count bounds: each kind and pair of {@link boundPairs} where the kind declares both
 * attributes of the pair.
 *
 * @param declarations - The attribute declarations.
 * @returns The bounds, in declaration order of the kinds.
 */
const boundsIn = (declarations: readonly AttributeDeclaration[]): readonly BoundRow[] => {
  const declared = new Map<string, Set<string>>();
  for (const { kind, name } of declarations) {
    declared.set(kind, (declared.get(kind) ?? new Set()).add(name));
  }

  return [...declared].flatMap(([kind, names]) =>
    boundPairs
      .filter(({ max, min }) => names.has(min) && names.has(max))
      .map((pair) => ({ ...pair, kind })),
  );
};

/**
 * Collect the kinds of every element particle within a particle.
 *
 * @param particle - The particle.
 * @returns The kinds, in document order.
 */
const kindsWithin = (particle: Particle): readonly string[] => {
  switch (particle._tag) {
    case "element": {
      return particle.kinds;
    }
    case "any": {
      return [];
    }
    case "group": {
      return particle.particles.flatMap(kindsWithin);
    }
    default: {
      return particle satisfies never;
    }
  }
};

/**
 * Collect the alternatives of every choice within a particle that may occur more than once.
 *
 * @param particle - The particle.
 * @returns The kinds within each such choice, in document order.
 */
const repeatedChoices = (particle: Particle): readonly string[] => {
  if (particle._tag !== "group") {
    return [];
  }

  const own =
    particle.compositor === "choice" && Option.isNone(particle.occurs.max)
      ? particle.particles.flatMap(kindsWithin)
      : [];

  return [...own, ...particle.particles.flatMap(repeatedChoices)];
};

/**
 * Collect the kinds the content models reach from roots, the roots included: each root, and every
 * kind an element particle of a reached kind's model names.
 *
 * @param models - The content-model IR.
 * @param roots - The kinds to start from.
 * @returns The reached kinds.
 */
const reachedFrom = (
  models: readonly ContentModel[],
  roots: readonly string[],
): ReadonlySet<string> => {
  const children = new Map<string, string[]>();
  for (const { content, kind } of models) {
    if (content._tag === "element-only" || content._tag === "mixed") {
      children.set(kind, [...(children.get(kind) ?? []), ...kindsWithin(content.particle)]);
    }
  }

  const reached = new Set<string>();
  const pending = [...roots];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    if (!reached.has(next)) {
      reached.add(next);
      pending.push(...(children.get(next) ?? []));
    }
  }

  return reached;
};

/**
 * Read the kinds a section holds as its parts: the alternatives of the choice its content model
 * repeats, the XSD's spelling of the information model's `sectionPart` (an item ref, a section, a
 * section ref, or an XInclude standing in for one; §6.46, SectionPart).
 *
 * @param models - The content-model IR.
 * @returns The parts, each once, in the model's order.
 */
const sectionPartsIn = (models: readonly ContentModel[]): readonly string[] => [
  ...new Set(
    models
      .filter(({ kind }) => kind === sectionKind)
      .flatMap(({ content }) =>
        content._tag === "element-only" || content._tag === "mixed"
          ? repeatedChoices(content.particle)
          : [],
      ),
  ),
];

/**
 * The processing kinds: what the content models reach from {@link processingRoots}, the roots
 * included, an XInclude and its fallback apart.
 */
const processingKinds: ReadonlySet<string> = new Set(
  [...reachedFrom(contentModels, processingRoots)].filter((kind) => !kind.startsWith("xi:")),
);

/**
 * The kinds of an item's content: what the content models reach from {@link itemRoot}, processing
 * apart.
 */
const itemContentKinds: ReadonlySet<string> = new Set(
  [...reachedFrom(contentModels, [itemRoot])].filter((kind) => !processingKinds.has(kind)),
);

/**
 * The ASI vocabulary's facet, derived from the XSDs' attribute declarations and content models: its
 * four declaration kinds, the built-in variables, the references processing and an item's content
 * make, the interactions' and choices' count bounds, and the kinds a section holds as parts.
 */
export const asiReferences: ReferenceFacet = {
  builtIns,
  choiceBounds: boundsIn(attributeDeclarations),
  declarations: declarationsIn(attributeDeclarations),
  references: [
    ...processingReferences(attributeDeclarations, processingKinds),
    ...contentReferences(attributeDeclarations, itemContentKinds),
  ],
  sectionParts: sectionPartsIn(contentModels),
};

/**
 * A `NodeKind` key field.
 */
type KindField = IdField<"kind", string>;

/**
 * An `AttributeName` field.
 */
type AttributeField<Name extends string> = IdField<Name, string>;

/**
 * A `DeclarationKind` field.
 */
type DeclarationField = IdField<"declaration", string>;

/**
 * The closed relations of variables and references one composition generates.
 */
export interface References {
  /**
   * `BuiltInVariable` as a function: each built-in variable → the declaration kind it stands as,
   * so a reference to it reads as one to a declaration of that kind.
   */
  readonly builtIn: Closed<readonly [IdField<"variable", string>], readonly [DeclarationField]>;
  /**
   * The `BuiltInVariable` roster: a reference whose identifier is one of its handles names that
   * built-in variable.
   */
  readonly builtInVariable: Roster<string>;
  /**
   * `ChoiceBound`: kind → (min, max), the attributes of the least and the most count a kind's
   * element bounds, where a most of 0 bounds nothing.
   */
  readonly choiceBound: Closed<
    readonly [KindField],
    readonly [AttributeField<"min">, AttributeField<"max">]
  >;
  /**
   * `ContentReference`: the set of (kind, attribute, declaration kind) where an item's content
   * names, by that attribute of an element of that kind, a declaration of that kind. Its (kind,
   * attribute) pairs are `VariableReference`'s whose references are restricted; the others' may
   * name any variable.
   */
  readonly contentReference: Closed<
    readonly [KindField, AttributeField<"attribute">, DeclarationField],
    readonly []
  >;
  /**
   * The `DeclarationKind` roster: the kinds that declare a variable, in the order the facets state
   * them. Its codes are dense, so a relation keyed by a declaration kind is four cells wide where a
   * `NodeKind` digit would make it `|NodeKind|`.
   */
  readonly declarationKind: Roster<string>;
  /**
   * `Declares`: each declaration kind as a `NodeKind` → itself as a `DeclarationKind`, the function
   * that gives a node of that kind its declaration code. Its key set is the declaration kinds.
   */
  readonly declares: Closed<readonly [KindField], readonly [DeclarationField]>;
  /**
   * `SectionPart`: the kinds a section holds as its parts, among which its selection selects.
   */
  readonly sectionPart: KindSet<string>;
  /**
   * The `ReferenceSpelling` roster, {@link spellings}.
   */
  readonly spelling: Roster<Spelling>;
  /**
   * `VariableReference`: (kind, attribute) → spelling, every attribute by which an element of a
   * kind names a variable, and how its value spells the name.
   */
  readonly variableReference: Closed<
    readonly [KindField, AttributeField<"attribute">],
    readonly [IdField<"spelling", Spelling>]
  >;
}

/**
 * List the declaration kinds a reference may name.
 *
 * @param reference - The reference.
 * @returns Its declaration kinds, none for one that may name any variable.
 */
const restrictionOf = (reference: ReferenceRow): readonly string[] =>
  reference.names._tag === "declaration" ? reference.names.kinds : [];

/**
 * Generate the reference relations of a composition from its vocabularies' facets.
 *
 * The `DeclarationKind` and `BuiltInVariable` rosters take their handles in the order the facets
 * state them, which is composition order, so a vocabulary appended to a composition appends its
 * codes.
 *
 * @param input - The composition's rosters and its vocabularies' facets.
 * @param input.facets - The facets, in composition order.
 * @param input.kinds - The `NodeKind` roster.
 * @param input.names - The `AttributeName` roster.
 * @returns The relations, or the first reason one has no constant: a declaration kind or built-in
 *   variable stated twice (`RepeatedValue`); two rows at one key, such as two spellings of one
 *   reference or two bounds on one kind (`KeyCollision`); or a kind, attribute or declaration kind
 *   outside its roster (`OutsideCodeSpace`).
 */
export const references = (input: {
  readonly facets: readonly ReferenceFacet[];
  readonly kinds: Roster<string>;
  readonly names: Roster<string>;
}): Result.Result<References, ClosedRelationError> =>
  Result.gen(function* generateReferences() {
    const { facets } = input;
    const kind = idField("kind", input.kinds);
    const attribute = idField("attribute", input.names);
    const declarationKind = yield* roster(
      "DeclarationKind",
      facets.flatMap((facet) => facet.declarations),
    );
    const declaration = idField("declaration", declarationKind);
    const stated = facets.flatMap((facet) => facet.builtIns);
    const builtInVariable = yield* roster(
      "BuiltInVariable",
      stated.map(({ variable }) => variable),
    );
    const spelling = yield* roster("ReferenceSpelling", spellings);
    const rows = facets.flatMap((facet) => facet.references);

    return {
      builtIn: yield* closed({
        key: [idField("variable", builtInVariable)],
        name: "BuiltInVariable",
        payload: [declaration],
        rows: stated,
      }),
      builtInVariable,
      choiceBound: yield* closed({
        key: [kind],
        name: "ChoiceBound",
        payload: [idField("min", input.names), idField("max", input.names)],
        rows: facets.flatMap((facet) => facet.choiceBounds),
      }),
      contentReference: yield* closed({
        key: [kind, attribute, declaration],
        name: "ContentReference",
        payload: [],
        rows: rows.flatMap((reference) =>
          restrictionOf(reference).map((named) => ({
            attribute: reference.attribute,
            declaration: named,
            kind: reference.kind,
          })),
        ),
      }),
      declarationKind,
      declares: yield* closed({
        key: [kind],
        name: "Declares",
        payload: [declaration],
        rows: declarationKind.handles.map((handle) => ({ declaration: handle, kind: handle })),
      }),
      sectionPart: yield* closed({
        key: [kind],
        name: "SectionPart",
        payload: [],
        rows: facets.flatMap((facet) => facet.sectionParts).map((part) => ({ kind: part })),
      }),
      spelling,
      variableReference: yield* closed({
        key: [kind, attribute],
        name: "VariableReference",
        payload: [idField("spelling", spelling)],
        rows: rows.map((reference) => ({
          attribute: reference.attribute,
          kind: reference.kind,
          spelling: reference.spelling,
        })),
      }),
    };
  });
