/**
 * The processing half of export's render: the attributes of the expression and rule kinds, read
 * back from the rows `import/processing.ts` wrote.
 *
 * `renderTree` builds every element, its children and its text from the node rows; this module
 * gives it the attributes of the kinds whose attributes live in processing relations. A typed copy
 * of a value is never read: `figures`, `n`, `number-repeats`, `min`, `max` and `step` come from the
 * columns that hold their text, the text of a literal is its text children, and an attribute whose
 * node has an `AttributeLexical` row is written with that row's value by `renderTree` itself.
 *
 * An `xi:include` writes the attributes of its six optional rows, `href` and `parse` through the
 * lexical row first like any other; its text and its `xi:fallback` are the tree's own children.
 *
 * An attribute with no XSD default is written whenever its column or row exists. A defaulted one
 * (`tolerance-mode`, `include-lower-bound`, `include-upper-bound`, `rounding-mode` of
 * `qti-equal-rounded`, `substring`) is written only where its `Declared` marker row exists, so a
 * source that left it out renders without it.
 */
import type { Rows as RowSet } from "#qti/import/tree.ts";
import { Rows } from "#qti/import/tree.ts";
import * as expression from "#qti/schema/expression.ts";
import * as attributed from "#qti/schema/expression-attributes.ts";
import * as processing from "#qti/schema/processing.ts";
import * as rule from "#qti/schema/rule.ts";

/**
 * Attribute names with their values.
 */
type Pairs = readonly (readonly [name: string, value: string])[];

/**
 * What each processing kind writes as attributes, by kind: the attributes of one node of the kind.
 */
export type ProcessingAttributes = ReadonlyMap<string, (id: string) => Pairs>;

/**
 * The attribute `name` with `value`, none when `value` is absent.
 */
const present = (name: string, value: string | undefined): Pairs =>
  value === undefined ? [] : [[name, value]];

/**
 * The facts of a relation keyed by `id`, by that id.
 */
const by = <T extends { readonly id: string }>(facts: readonly T[]): ReadonlyMap<string, T> =>
  new Map(facts.map((fact) => [fact.id, fact]));

/**
 * The text of an optional-value relation by node: the row's value, none where the source wrote no
 * attribute.
 */
const valueOf = (
  facts: readonly { readonly node: string; readonly value: string }[],
): ((id: string) => string | undefined) => {
  const found = new Map(facts.map((fact) => [fact.node, fact.value]));

  return (id) => found.get(id);
};

/**
 * The nodes of a marker relation: the source wrote the attribute the marker names.
 */
const markedBy = (facts: readonly { readonly node: string }[]): ReadonlySet<string> =>
  new Set(facts.map((fact) => fact.node));

/**
 * The attribute `name` with `value` where the source wrote it, which `marker` says by holding the
 * node.
 */
const declared = (
  marker: ReadonlySet<string>,
  id: string,
  name: string,
  value: string | undefined,
): Pairs => (marker.has(id) ? present(name, value) : []);

/**
 * The attributes of the expression and rule kinds, read from `rows`.
 *
 * Each entry is keyed by the node kind it serves and is called with a node's id; the kinds with no
 * attribute of their own have no entry. `renderTree`'s own attribute table takes these entries as
 * they are.
 *
 * @param rows - The rows of the tree, as the importer builds them and the reader returns them.
 * @returns The attribute reader of each kind that carries attributes.
 */
export const renderProcessing = (rows: RowSet): ProcessingAttributes => {
  const section = valueOf(Rows.of(rows, expression.ExpressionSectionIdentifier));
  const include = valueOf(Rows.of(rows, expression.ExpressionIncludeCategory));
  const exclude = valueOf(Rows.of(rows, expression.ExpressionExcludeCategory));
  const weight = valueOf(Rows.of(rows, attributed.ExpressionWeightIdentifier));
  const variableWeight = valueOf(Rows.of(rows, attributed.VariableWeightIdentifier));

  const declaredRefs = by(Rows.of(rows, processing.DeclaredRef));
  const templateRefs = by(Rows.of(rows, processing.TemplateParameterRef));
  const builtInRefs = by(Rows.of(rows, processing.BuiltInRef));

  /**
   * The `identifier` a referring node names: its declared reference's, its template parameter's, or
   * the built-in's name.
   */
  const identifier = (id: string): Pairs =>
    present(
      "identifier",
      declaredRefs.get(id)?.identifier ??
        templateRefs.get(id)?.identifier ??
        builtInRefs.get(id)?.name,
    );

  const filters = (id: string): Pairs => [
    ...present("section-identifier", section(id)),
    ...present("include-category", include(id)),
    ...present("exclude-category", exclude(id)),
  ];

  const anyN = by(Rows.of(rows, attributed.AnyN));
  const literals = by(Rows.of(rows, processing.Literal));
  const customClass = valueOf(Rows.of(rows, attributed.CustomOperatorClass));
  const customDefinition = valueOf(Rows.of(rows, attributed.CustomOperatorDefinition));
  const equals = by(Rows.of(rows, attributed.Equal));
  const toleranceMode = markedBy(Rows.of(rows, attributed.DeclaredToleranceMode));
  const lowerBound = markedBy(Rows.of(rows, attributed.DeclaredIncludeLowerBound));
  const upperBound = markedBy(Rows.of(rows, attributed.DeclaredIncludeUpperBound));
  const tolerance = valueOf(Rows.of(rows, attributed.EqualTolerance));
  const equalRounded = by(Rows.of(rows, attributed.EqualRounded));
  const roundingMode = markedBy(Rows.of(rows, attributed.DeclaredRoundingMode));
  const fieldValues = by(Rows.of(rows, attributed.FieldValue));
  const indexes = by(Rows.of(rows, attributed.Index));
  const insides = by(Rows.of(rows, attributed.Inside));
  const constants = by(Rows.of(rows, attributed.MathConstant));
  const mathOperators = by(Rows.of(rows, attributed.MathOperator));
  const statsOperators = by(Rows.of(rows, attributed.StatsOperator));
  const bounds = by(Rows.of(rows, attributed.OutcomeMinMax));
  const patterns = by(Rows.of(rows, attributed.PatternMatch));
  const randomFloats = by(Rows.of(rows, attributed.RandomFloat));
  const randomFloatMin = valueOf(Rows.of(rows, attributed.RandomFloatMin));
  const randomIntegers = by(Rows.of(rows, attributed.RandomInteger));
  const randomIntegerMin = valueOf(Rows.of(rows, attributed.RandomIntegerMin));
  const randomIntegerStep = valueOf(Rows.of(rows, attributed.RandomIntegerStep));
  const repeats = by(Rows.of(rows, attributed.Repeat));
  const roundTos = by(Rows.of(rows, attributed.RoundTo));
  const stringMatches = by(Rows.of(rows, attributed.StringMatch));
  const substring = markedBy(Rows.of(rows, attributed.DeclaredSubstring));
  const substrings = by(Rows.of(rows, attributed.Substring));
  const testVariables = by(Rows.of(rows, attributed.TestVariables));
  const testBaseType = valueOf(Rows.of(rows, attributed.TestVariablesBaseType));

  const href = valueOf(Rows.of(rows, rule.XIncludeHref));
  const parse = valueOf(Rows.of(rows, rule.XIncludeParse));
  const xpointer = valueOf(Rows.of(rows, rule.XIncludeXpointer));
  const encoding = valueOf(Rows.of(rows, rule.XIncludeEncoding));
  const accept = valueOf(Rows.of(rows, rule.XIncludeAccept));
  const acceptLanguage = valueOf(Rows.of(rows, rule.XIncludeAcceptLanguage));

  const entries: readonly (readonly [string, (id: string) => Pairs])[] = [
    [
      "qti-any-n",
      (id) => [...present("min", anyN.get(id)?.min), ...present("max", anyN.get(id)?.max)],
    ],
    ["qti-base-value", (id) => present("base-type", literals.get(id)?.baseType)],
    [
      "qti-custom-operator",
      (id) => [
        ...present("class", customClass(id)),
        ...present("definition", customDefinition(id)),
      ],
    ],
    [
      "qti-equal",
      (id) => {
        const found = equals.get(id);

        return [
          ...declared(toleranceMode, id, "tolerance-mode", found?.toleranceMode),
          ...present("tolerance", tolerance(id)),
          ...declared(lowerBound, id, "include-lower-bound", found?.includeLowerBound),
          ...declared(upperBound, id, "include-upper-bound", found?.includeUpperBound),
        ];
      },
    ],
    [
      "qti-equal-rounded",
      (id) => [
        ...declared(roundingMode, id, "rounding-mode", equalRounded.get(id)?.roundingMode),
        ...present("figures", equalRounded.get(id)?.figures),
      ],
    ],
    ["qti-field-value", (id) => present("field-identifier", fieldValues.get(id)?.fieldIdentifier)],
    ["qti-index", (id) => present("n", indexes.get(id)?.n)],
    [
      "qti-inside",
      (id) => [
        ...present("shape", insides.get(id)?.shape),
        ...present("coords", insides.get(id)?.coords),
      ],
    ],
    ["qti-math-constant", (id) => present("name", constants.get(id)?.name)],
    ["qti-math-operator", (id) => present("name", mathOperators.get(id)?.name)],
    ["qti-stats-operator", (id) => present("name", statsOperators.get(id)?.name)],
    ...(["qti-outcome-maximum", "qti-outcome-minimum"] as const).map(
      (kind) =>
        [
          kind,
          (id: string): Pairs => [
            ...present("outcome-identifier", bounds.get(id)?.outcomeIdentifier),
            ...present("weight-identifier", weight(id)),
            ...filters(id),
          ],
        ] as const,
    ),
    ["qti-pattern-match", (id) => present("pattern", patterns.get(id)?.pattern)],
    [
      "qti-random-float",
      (id) => [...present("min", randomFloatMin(id)), ...present("max", randomFloats.get(id)?.max)],
    ],
    [
      "qti-random-integer",
      (id) => [
        ...present("min", randomIntegerMin(id)),
        ...present("max", randomIntegers.get(id)?.max),
        ...present("step", randomIntegerStep(id)),
      ],
    ],
    ["qti-repeat", (id) => present("number-repeats", repeats.get(id)?.numberRepeats)],
    [
      "qti-round-to",
      (id) => [
        ...present("rounding-mode", roundTos.get(id)?.roundingMode),
        ...present("figures", roundTos.get(id)?.figures),
      ],
    ],
    [
      "qti-string-match",
      (id) => [
        ...present("case-sensitive", stringMatches.get(id)?.caseSensitive),
        ...declared(substring, id, "substring", stringMatches.get(id)?.substring),
      ],
    ],
    ["qti-substring", (id) => present("case-sensitive", substrings.get(id)?.caseSensitive)],
    [
      "qti-test-variables",
      (id) => [
        ...present("variable-identifier", testVariables.get(id)?.variableIdentifier),
        ...present("base-type", testBaseType(id)),
        ...present("weight-identifier", weight(id)),
        ...filters(id),
      ],
    ],
    [
      "qti-variable",
      (id) => [...identifier(id), ...present("weight-identifier", variableWeight(id))],
    ],
    ...[
      "qti-number-correct",
      "qti-number-incorrect",
      "qti-number-presented",
      "qti-number-responded",
      "qti-number-selected",
    ].map((kind) => [kind, filters] as const),
    [
      "xi:include",
      (id) => [
        ...present("href", href(id)),
        ...present("parse", parse(id)),
        ...present("xpointer", xpointer(id)),
        ...present("encoding", encoding(id)),
        ...present("accept", accept(id)),
        ...present("accept-language", acceptLanguage(id)),
      ],
    ],
    ...[
      "qti-correct",
      "qti-default",
      "qti-lookup-outcome-value",
      "qti-map-response",
      "qti-map-response-point",
      "qti-set-correct-response",
      "qti-set-default-value",
      "qti-set-outcome-value",
      "qti-set-template-value",
    ].map((kind) => [kind, identifier] as const),
  ];

  return new Map(entries);
};
