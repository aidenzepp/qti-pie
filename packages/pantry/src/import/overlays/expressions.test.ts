/**
 * The expression overlays' rows judged on the host, against the old processing checker's frozen
 * verdicts.
 *
 * Every fixture of `src/test/fixtures/processing/{broken,guards,valid}` is shredded, built into
 * rows by `rowsOf`, and judged by a host reading of every row law `expressionLaws` states: the
 * operand folds, the counts and the per-kind closed relations, read by their installed rows. The
 * rules of the laws a fixture breaks must be the rule the old checker gave it, frozen in
 * `src/test/fixtures/processing/verdicts.tsv` by one run of that checker before its deletion
 * (Q5.10). A guard fixture's rule is another slice's law (P5 is AL3, P28 is N7's `Last`, P30 is
 * N5's `Follow`), so the expression laws accept it.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import {
  builtInTypes,
  integerMathOperators,
  rpTemplatePattern,
} from "#pantry/grammar/expression.ts";
import { grammar, OperatorArity, VariableReference } from "#pantry/grammar/install.ts";
import { testRoots } from "#pantry/grammar/references.ts";
import {
  assembledExpressionRowsOf,
  lookupKey,
  readingTextsOf,
  resolvingReadingsOf,
  rowsOf,
} from "#pantry/import/overlays/expressions.ts";
import type {
  AssembledExpressionInput,
  AssembledExpressionRows,
  ExpressionRows,
  NamedResource,
} from "#pantry/import/overlays/expressions.ts";
import { assembledRowsOf, keyOf, rowsOf as testRowsOf } from "#pantry/import/overlays/tests.ts";
import type { AssembledRows, TestIds } from "#pantry/import/overlays/tests.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName } from "#pantry/model/xdm.ts";
import type {
  ClosedName,
  ElementKind,
  NodeId,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import {
  BaseTypePattern,
  conditionKindHandles,
  containerKinds,
  declaredKinds,
  expressionKinds,
  firstKinds,
  LeadCardinality,
  lookupKindHandle,
  numericKinds,
  oneBaseKinds,
  oneCardinalityKinds,
  OperandBase,
  outcomeOnlyKinds,
  ReferenceBase,
  referenceDeclarations,
  ResultBase,
  ResultCardinality,
  rootLanguages,
  ruleKindHandles,
  secondKinds,
  setKindHandles,
  TailCardinality,
  ValueBaseForm,
  ValueBaseOf,
  ValueCardinalityOf,
} from "#pantry/qti/expression-types.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";

/**
 * The fixtures' directory.
 */
const fixtures = path.resolve(import.meta.dirname, "../../test/fixtures/processing");

/**
 * One frozen verdict: the fixture, the rule the old checker (or, for a guard, the importer's
 * guard) gave it, and which of the two gave it.
 */
interface Frozen {
  readonly file: string;
  readonly rule: string;
  readonly source: "checker" | "guard";
}

/**
 * The frozen verdicts, one per fixture: the columns `file`, `processing`, `rule`, `kind`, `path`
 * and `source`.
 */
const frozen: readonly Frozen[] = readFileSync(path.join(fixtures, "verdicts.tsv"), "utf-8")
  .trimEnd()
  .split("\n")
  .slice(1)
  .map((line) => {
    const columns = line.split("\t");

    return {
      file: columns[0] ?? "",
      rule: columns[2] ?? "",
      source: columns[5] === "guard" ? "guard" : "checker",
    };
  });

/**
 * The rule each law keeps, as `#pantry/test/oracle.ts` maps it.
 */
const ruleOf = {
  Arity: "P2",
  Condition_type: "P21",
  E1_derived: "derived",
  Item_duration: "item-duration",
  Literal_lexical: "attribute-lexical",
  Lookup_type: "P22",
  Mapped_response: "P27",
  One_base: "P23",
  Operand_fit: "P23",
  Outcome_only: "P25",
  Reference_type: "P24",
  Set_type: "P20",
  Template_reads: "P26",
  Variable_declared: "P8",
  Variable_kind: "variable-kind",
  Weighted_base: "P29",
} as const;

/**
 * A law's name.
 */
type Law = keyof typeof ruleOf;

/**
 * Whether one set holds another.
 *
 * @param sub - The smaller.
 * @param sup - The larger, none for the empty set.
 * @returns Whether every member of `sub` is in `sup`.
 */
const subset = (sub: ReadonlySet<string>, sup: ReadonlySet<string> | undefined): boolean =>
  [...sub].every((member) => sup?.has(member) ?? false);

/**
 * The installed rows of a (kind, code) set relation, by kind.
 *
 * @param rows - The rows.
 * @param code - The code each row holds beside its kind.
 * @returns Each kind's codes.
 */
const byKind = <R extends { readonly kind: string }>(
  rows: readonly R[],
  code: (row: R) => string,
): ReadonlyMap<string, ReadonlySet<string>> => {
  const held = new Map<string, Set<string>>();
  for (const row of rows) {
    held.set(row.kind, (held.get(row.kind) ?? new Set<string>()).add(code(row)));
  }

  return held;
};

const operandBases = byKind(OperandBase.rows, ({ base }) => base);

const leads = byKind(LeadCardinality.rows, ({ cardinality }) => cardinality);

const tails = byKind(TailCardinality.rows, ({ cardinality }) => cardinality);

const resultBases = byKind(ResultBase.rows, ({ base }) => base);

const resultCardinalities = byKind(ResultCardinality.rows, ({ cardinality }) => cardinality);

const arities = new Map(OperatorArity.rows.map((row) => [row.kind, row] as const));

const spellings = new Map(
  VariableReference.rows.map(({ attribute, kind, spelling }) => [`${kind} ${attribute}`, spelling]),
);

const referenceBases = new Map(
  ReferenceBase.rows.map(({ attribute, base, kind }) => [`${kind} ${attribute}`, base]),
);

const forms = new Map(
  ValueBaseForm.rows.map(({ base, pattern }) => [base, new RegExp(pattern, "u")]),
);

const literalPatterns = new Map(
  BaseTypePattern.rows.map(({ baseType, pattern }) => [baseType, new RegExp(pattern, "u")]),
);

const valueBaseOf = new Map(ValueBaseOf.rows.map(({ baseType, value }) => [baseType, value]));

const valueCardinalityOf = new Map(
  ValueCardinalityOf.rows.map(({ cardinality, value }) => [cardinality, value]),
);

const builtIns: ReadonlyMap<string, (typeof builtInTypes)[number]> = new Map(
  builtInTypes.map((row) => [`${String(row.test)} ${row.variable}`, row] as const),
);

const testRootSet: ReadonlySet<string> = new Set(testRoots);

const integerNames = new RegExp(integerMathOperators, "u");

const languages: ReadonlyMap<string, string> = new Map(rootLanguages);

const expressionSet: ReadonlySet<string> = new Set(expressionKinds);

const ruleSet: ReadonlySet<string> = new Set(ruleKindHandles);

const conditions: ReadonlySet<string> = new Set(conditionKindHandles);

const outcomeOnly: ReadonlySet<string> = new Set(outcomeOnlyKinds);

const setters: ReadonlySet<string> = new Set(setKindHandles);

const declaredTyped: ReadonlySet<string> = new Set(declaredKinds);

const oneBase: ReadonlySet<string> = new Set(oneBaseKinds);

const oneCardinality: ReadonlySet<string> = new Set(oneCardinalityKinds);

const silent: ReadonlySet<string> = new Set(["any", "unknown"]);

/**
 * The (kind, declaration kind) pairs a reference by `identifier` may name, as the information
 * model's definitions state them (`referenceDeclarations`, each row cited).
 */
const namedKinds: ReadonlySet<string> = new Set(
  referenceDeclarations.flatMap(({ declarations, kind }) =>
    declarations.map((declaration) => `${kind} ${declaration}`),
  ),
);

/**
 * An expression's row and its operand folds, as grizzle draws them from its `Operand` rows.
 */
interface Folded {
  readonly all: ReadonlySet<string>;
  readonly allCardinalities: ReadonlySet<string>;
  readonly count: number;
  readonly lead: ReadonlySet<string>;
  readonly row: ExpressionRows["Expression"] extends ReadonlyMap<string, infer R> ? R : never;
  readonly tail: ReadonlySet<string>;
  readonly tailCardinalities: ReadonlySet<string>;
}

/**
 * Fold an expression's operands: each operand's base type but `any`, and its cardinality but
 * `unknown`, into its operator's sets, by its rank.
 *
 * @param rows - The rows.
 * @param row - The expression's row.
 * @returns Its folds.
 */
const folded = (rows: ExpressionRows, row: Folded["row"]): Folded => {
  const operands = [...rows.Operand.values()].filter(({ operator }) => operator === row.node);
  const bases = (list: typeof operands) =>
    new Set(list.flatMap(({ baseType }) => (baseType === "any" ? [] : [baseType])));
  const cardinalities = (list: typeof operands) =>
    new Set(list.flatMap(({ cardinality }) => (cardinality === "unknown" ? [] : [cardinality])));
  const later = operands.filter(({ rank }) => rank > 1n);

  return {
    all: bases(operands),
    allCardinalities: cardinalities(operands),
    count: operands.length,
    lead: cardinalities(operands.filter(({ rank }) => rank === 1n)),
    row,
    tail: bases(later),
    tailCardinalities: cardinalities(later),
  };
};

/**
 * The base type a set of operand bits names: `any` for none, its one member, or none for several.
 *
 * @param bits - The bits.
 * @returns The base type, or undefined for several.
 */
const oneOf = (bits: ReadonlySet<string>): string | undefined => {
  if (bits.size === 0) {
    return "any";
  }

  return bits.size === 1 ? [...bits][0] : undefined;
};

/**
 * The base type a numeric aggregate's operand bits give it.
 *
 * @param bits - The bits.
 * @returns `unknown`, `integer` or `float`.
 */
const numericOf = (bits: ReadonlySet<string>): string => {
  if (bits.has("unknown")) {
    return "unknown";
  }

  return bits.size === 1 && bits.has("integer") ? "integer" : "float";
};

/**
 * The language an expression's parent hands it: a rule's or an expression's own, `none` from any
 * other parent.
 *
 * @param rows - The rows.
 * @param row - The expression's row.
 * @returns The language, if the parent's row holds one.
 */
const languageFrom = (rows: ExpressionRows, row: Folded["row"]): string | undefined => {
  if (ruleSet.has(row.parentKind)) {
    return rows.Processing.get(row.parent)?.language;
  }

  return expressionSet.has(row.parentKind) ? rows.Expression.get(row.parent)?.language : "none";
};

/**
 * `E1_derived`'s result type: the kind's sets, and each dependent typing's rule.
 *
 * @param e - The expression and its folds.
 * @returns Whether its type is derived.
 */
const resultHolds = (e: Folded): boolean => {
  const { kind } = e.row;
  const second =
    e.tailCardinalities.size === 0 ? "unknown" : ([...e.tailCardinalities][0] ?? "unknown");

  return (
    (resultBases.get(kind)?.has(e.row.baseType) ?? false) &&
    (resultCardinalities.get(kind)?.has(e.row.cardinality) ?? false) &&
    (!new Set(numericKinds).has(kind) || e.row.baseType === numericOf(e.all)) &&
    (!new Set(containerKinds).has(kind) ||
      e.row.baseType === (e.all.size > 1 ? "unknown" : oneOf(e.all))) &&
    (!new Set(firstKinds).has(kind) || e.row.baseType === oneOf(e.all)) &&
    (!new Set(secondKinds).has(kind) ||
      (e.row.baseType === oneOf(e.tail) && e.row.cardinality === second))
  );
};

/**
 * Each expression law, judged over an expression and its folds.
 */
const expressionLawsOnHost: readonly (readonly [
  Law,
  (e: Folded, rows: ExpressionRows) => boolean,
])[] = [
  [
    "Arity",
    (e) => {
      const arity = arities.get(e.row.kind);

      return arity !== undefined && BigInt(e.count) >= arity.min && BigInt(e.count) <= arity.max;
    },
  ],
  [
    "Operand_fit",
    (e) =>
      subset(e.all, operandBases.get(e.row.kind)) &&
      subset(e.lead, leads.get(e.row.kind)) &&
      subset(e.tailCardinalities, tails.get(e.row.kind)),
  ],
  [
    "One_base",
    (e) =>
      (!oneBase.has(e.row.kind) || [...e.all].filter((base) => base !== "unknown").length <= 1) &&
      (!oneCardinality.has(e.row.kind) || e.allCardinalities.size <= 1),
  ],
  ["E1_derived", (e, rows) => languageFrom(rows, e.row) === e.row.language && resultHolds(e)],
  [
    "Condition_type",
    (e) =>
      !conditions.has(e.row.parentKind) ||
      (["boolean", "any", "unknown"].includes(e.row.baseType) &&
        ["single", "unknown"].includes(e.row.cardinality)),
  ],
  ["Outcome_only", (e) => !outcomeOnly.has(e.row.kind) || e.row.language === "outcome"],
];

/**
 * A `VariableRef` row.
 */
type Reference = ExpressionRows["VariableRef"] extends ReadonlyMap<string, infer R> ? R : never;

/**
 * `E1_derived`'s spelling: the lexical form is the affixes around the name.
 *
 * @param v - The reference.
 * @returns Whether it spells its identifier.
 */
const spells = (v: Reference): boolean =>
  v.lexical === `${v.before}${v.identifier}${v.after}` &&
  /^[^\t\n\r {}]+$/u.test(v.identifier) &&
  (spellings.get(`${v.kind} ${v.attribute}`) === "braced"
    ? v.before === "{" && v.after === "}"
    : /^[\t\n\r ]*$/u.test(v.before) && /^[\t\n\r ]*$/u.test(v.after));

/**
 * `E1_derived`'s resolution: the type each resolution gives.
 *
 * @param v - The reference.
 * @returns Whether its type is its resolution's.
 */
const resolves = (v: Reference): boolean => {
  const builtIn = builtIns.get(`${String(testRootSet.has(v.rootKind))} ${v.identifier}`);
  switch (v.resolution) {
    case "declared": {
      return (
        v.baseType === valueBaseOf.get(v.declBaseType) &&
        v.cardinality === valueCardinalityOf.get(v.declCardinality)
      );
    }
    case "builtIn": {
      return v.baseType === builtIn?.baseType && v.cardinality === builtIn.cardinality;
    }
    case "unresolved": {
      return builtIn === undefined && v.baseType === "unknown" && v.cardinality === "unknown";
    }
    default: {
      return v.resolution satisfies never;
    }
  }
};

/**
 * `E1_derived`'s claimed table: none, or the one the reference's element reads, where declared.
 *
 * @param v - The reference.
 * @returns Whether its claim is lawful.
 */
const claims = (v: Reference): boolean => {
  if (v.table === "none") {
    return true;
  }

  const wanted =
    v.kind === lookupKindHandle
      ? ["qti-match-table", "qti-interpolation-table"]
      : [v.kind === "qti-map-response" ? "qti-mapping" : "qti-area-mapping"];

  return (
    v.attribute === "identifier" &&
    v.resolution === "declared" &&
    ["qti-map-response", "qti-map-response-point", lookupKindHandle].includes(v.kind) &&
    wanted.includes(v.table)
  );
};

/**
 * `E1_derived`'s copies: the element's type and language, and a declared kind's typing.
 *
 * @param v - The reference.
 * @param rows - The rows.
 * @returns Whether every copy agrees.
 */
const copies = (v: Reference, rows: ExpressionRows): boolean => {
  const element = rows.Expression.get(v.node);
  const copied =
    element === undefined
      ? rows.Processing.get(v.node)?.language === v.language
      : element.baseType === v.elementBase &&
        element.cardinality === v.elementCardinality &&
        element.language === v.language;

  return (
    copied &&
    (v.attribute !== "identifier" ||
      !declaredTyped.has(v.kind) ||
      (v.elementBase === v.baseType && v.elementCardinality === v.cardinality))
  );
};

/**
 * Each reference law, judged over a reference.
 */
const referenceLawsOnHost: readonly (readonly [
  Law,
  (v: Reference, rows: ExpressionRows) => boolean,
])[] = [
  ["E1_derived", (v, rows) => spells(v) && resolves(v) && claims(v) && copies(v, rows)],
  [
    "Variable_declared",
    (v) =>
      v.rootKind !== "qti-assessment-item" ||
      v.resolution !== "unresolved" ||
      // Reading R15-k: a braced reference, a string attribute's, that names no variable is a
      // string value.
      spellings.get(`${v.kind} ${v.attribute}`) === "braced",
  ],
  [
    "Variable_kind",
    (v) =>
      v.attribute !== "identifier" ||
      v.resolution === "unresolved" ||
      namedKinds.has(`${v.kind} ${v.declarationKind}`),
  ],
  [
    "Set_type",
    (v) =>
      v.attribute !== "identifier" ||
      !setters.has(v.kind) ||
      ((v.heldBase === v.baseType || silent.has(v.heldBase) || silent.has(v.baseType)) &&
        (v.heldCardinality === v.cardinality ||
          v.heldCardinality === "unknown" ||
          v.cardinality === "unknown")),
  ],
  [
    "Lookup_type",
    (v) =>
      v.attribute !== "identifier" ||
      v.kind !== lookupKindHandle ||
      (["single", "unknown"].includes(v.heldCardinality) &&
        ["duration", "float", "integer", "any", "unknown"].includes(v.heldBase) &&
        (v.resolution !== "declared" ||
          ["qti-match-table", "qti-interpolation-table"].includes(v.table)) &&
        (v.table !== "qti-match-table" || ["integer", "any", "unknown"].includes(v.heldBase))),
  ],
  [
    "Reference_type",
    (v) =>
      v.attribute === "identifier" ||
      v.resolution === "unresolved" ||
      (v.resolution === "declared" &&
        ["qti-outcome-declaration", "qti-template-declaration"].includes(v.declarationKind) &&
        (v.baseType === referenceBases.get(`${v.kind} ${v.attribute}`) || silent.has(v.baseType)) &&
        ["single", "unknown"].includes(v.cardinality)),
  ],
  [
    "Template_reads",
    (v) =>
      v.language !== "template" ||
      !expressionSet.has(v.kind) ||
      ((v.resolution !== "declared" ||
        !["qti-outcome-declaration", "qti-response-declaration"].includes(v.declarationKind)) &&
        (v.resolution !== "builtIn" || v.identifier === "QTI_CONTEXT")),
  ],
  [
    "Mapped_response",
    (v) =>
      v.attribute !== "identifier" ||
      !["qti-map-response", "qti-map-response-point"].includes(v.kind) ||
      v.resolution !== "declared" ||
      (v.declarationKind === "qti-response-declaration" &&
        ((v.kind === "qti-map-response" && v.table === "qti-mapping") ||
          (v.kind === "qti-map-response-point" &&
            v.table === "qti-area-mapping" &&
            ["point", "any", "unknown"].includes(v.baseType)))),
  ],
];

/**
 * `E1_derived` over an attribute an expression's type follows from.
 *
 * @param x - The attribute's row.
 * @returns Whether the expression's base type is the one it gives.
 */
const attributeDerives = (
  x: ExpressionRows["ExpressionAttribute"] extends ReadonlyMap<string, infer R> ? R : never,
): boolean => {
  if (!x.written) {
    return (
      x.attribute === "base-type" &&
      x.kind === "qti-test-variables" &&
      x.lexical === "" &&
      x.baseType === "unknown"
    );
  }

  if (x.attribute === "base-type") {
    return forms.get(x.baseType)?.test(x.lexical) ?? false;
  }

  if (x.attribute === "name") {
    return integerNames.test(x.lexical) ? x.baseType === "integer" : x.baseType === "float";
  }

  return true;
};

/**
 * The laws the rows of the smaller overlays break: `Processing`'s language, `ExpressionAttribute`'s
 * derivation and weight, `Literal`'s code and text, and `ProcessingTemplate`'s template.
 *
 * @param rows - The rows.
 * @returns The laws broken, each once.
 */
const overlayBreaches = (rows: ExpressionRows): ReadonlySet<Law> => {
  const broken = new Set<Law>();
  for (const p of rows.Processing.values()) {
    const expected =
      languages.get(p.kind) ??
      (ruleSet.has(p.parentKind) ? rows.Processing.get(p.parent)?.language : "none");
    if (expected !== p.language) {
      broken.add("E1_derived");
    }
  }

  for (const x of rows.ExpressionAttribute.values()) {
    if (!attributeDerives(x)) {
      broken.add("E1_derived");
    }

    if (x.attribute === "weight-identifier" && !["float", "unknown"].includes(x.baseType)) {
      broken.add("Weighted_base");
    }
  }

  for (const l of rows.Literal.values()) {
    if (valueBaseOf.get(l.typeCode) !== l.baseType) {
      broken.add("E1_derived");
    }

    if (!(literalPatterns.get(l.typeCode)?.test(l.text) ?? false)) {
      broken.add("Literal_lexical");
    }
  }

  for (const t of rows.ItemTiming.values()) {
    if (/^[\t\n\r ]*(?:true|1)[\t\n\r ]*$/u.test(t.lexical) !== t.timeDependent) {
      broken.add("E1_derived");
    }
  }

  for (const t of rows.ProcessingTemplate.values()) {
    if (t.template !== "none" && !new RegExp(rpTemplatePattern(t.template), "u").test(t.uri)) {
      broken.add("E1_derived");
    }
  }

  return broken;
};

/**
 * Judge every row law of `expressionLaws` on the host over a document's rows.
 *
 * @param rows - The rows.
 * @returns The names of the laws the rows break, each once.
 */
const breachesOf = (rows: ExpressionRows): ReadonlySet<Law> => {
  const broken = new Set<Law>(overlayBreaches(rows));
  for (const row of rows.Expression.values()) {
    const e = folded(rows, row);
    for (const [law, holds] of expressionLawsOnHost) {
      if (!holds(e, rows)) {
        broken.add(law);
      }
    }
  }

  for (const v of rows.VariableRef.values()) {
    for (const [law, holds] of referenceLawsOnHost) {
      if (!holds(v, rows)) {
        broken.add(law);
      }
    }
  }

  return broken;
};

/**
 * The test environment each bare outcome-processing fixture was typed under by the old checker,
 * its outcome declarations as a test declares them: `outcome.xml`'s TOTAL and MAXTOTAL float,
 * COUNT integer and PASSED boolean, and P29's COUNT integer.
 */
const testEnvironments: ReadonlyMap<string, readonly (readonly [string, string])[]> = new Map([
  [
    "valid/outcome.xml",
    [
      ["TOTAL", "float"],
      ["MAXTOTAL", "float"],
      ["COUNT", "integer"],
      ["PASSED", "boolean"],
    ],
  ],
  ["broken/p29-test-variables-weight-integer.xml", [["COUNT", "integer"]]],
]);

/**
 * Read a fixture's text as a document the importer reads. A bare `qti-outcome-processing` root,
 * which no QTI document is, stands in the test its comment names: a `qti-assessment-test` holding
 * its outcome declarations and the processing.
 *
 * @param file - The fixture, relative to the fixtures' directory.
 * @returns The document's text.
 */
const textOf = (file: string): string => {
  const text = readFileSync(path.join(fixtures, file), "utf-8");
  const environment = testEnvironments.get(file);
  if (environment === undefined) {
    return text;
  }

  const body = text.replace(/^<\?xml[^>]*\?>\s*/u, "");
  const declarations = environment
    .map(
      ([identifier, baseType]) =>
        `<qti-outcome-declaration identifier="${identifier}" cardinality="single" base-type="${baseType}"/>`,
    )
    .join("");

  return `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="T">${declarations}${body}</qti-assessment-test>`;
};

/**
 * Shred a fixture.
 *
 * @param file - The fixture, relative to the fixtures' directory.
 * @returns Its tree.
 */
const treeOfFixture = (file: string) =>
  Effect.gen(function* treeOfFile() {
    const xml = yield* readXml(new TextEncoder().encode(textOf(file)));

    return yield* shred(xml, "3.0.0", shredGrammarOf(grammar));
  });

/**
 * Shred a fixture and build its rows.
 *
 * @param file - The fixture, relative to the fixtures' directory.
 * @returns Its rows.
 */
const rowsOfFixture = (file: string) =>
  Effect.map(treeOfFixture(file), (tree) => rowsOf(tree, { idOf }));

describe("import/overlays/expressions.ts, the fixtures' verdicts", () => {
  it.effect(
    "refuses each fixture under exactly the rule the old checker gave it, and accepts the rest",
    () =>
      // Oracle: a second implementation, the old processing checker (`src/processing/check.ts` at
      // its deletion), run once over every fixture and frozen in `verdicts.tsv`; a guard fixture's
      // rule is another slice's, so O4's laws accept it. Bound: every fixture, 37 documents.
      Effect.gen(function* fixtureVerdicts() {
        assert.strictEqual(frozen.length, 37);
        for (const { file, rule, source } of frozen) {
          const rows = yield* rowsOfFixture(file);
          const rules = new Set([...breachesOf(rows)].map((law) => ruleOf[law]));
          const expected = source === "guard" || rule === "accepted" ? [] : [rule];

          assert.isTrue(source === "guard" || rows.Expression.size > 0, file);
          assert.deepStrictEqual([...rules].toSorted(), expected, file);
        }
      }),
  );

  it.effect("keys every row by its element's node, and every reference by its node and name", () =>
    // Oracle: rule 7 of the W5 rules, set semantics: each relation's rows are a keyed set, and an
    // operand's operator is its expression's parent, itself an expression.
    Effect.gen(function* keyed() {
      for (const { file } of frozen) {
        const rows = yield* rowsOfFixture(file);
        for (const [key, row] of rows.Expression) {
          assert.strictEqual(key, row.node, file);
        }

        for (const [key, row] of rows.VariableRef) {
          assert.strictEqual(key, JSON.stringify([row.node, row.attribute]), file);
        }

        for (const operand of rows.Operand.values()) {
          assert.strictEqual(rows.Expression.get(operand.node)?.parent, operand.operator, file);
          assert.isTrue(expressionSet.has(rows.Expression.get(operand.operator)?.kind ?? ""), file);
        }
      }
    }),
  );
});

/**
 * Shred a document's text and build its rows.
 *
 * @param text - The document's text.
 * @returns Its rows.
 */
const rowsOfText = (text: string) =>
  Effect.gen(function* rowsOfDocument() {
    const xml = yield* readXml(new TextEncoder().encode(text));
    const tree = yield* shred(xml, "3.0.0", shredGrammarOf(grammar));

    return rowsOf(tree, { idOf });
  });

/**
 * An item that declares a string response `RESPONSE` and a float outcome `SCORE`, and sets `SCORE`
 * under the given condition expression.
 *
 * @param condition - The expression of the response processing's one `qti-response-if`.
 * @returns The item's text.
 */
const itemUnder = (condition: string): string =>
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="I" title="I" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-response-processing><qti-response-condition><qti-response-if>${condition}<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition></qti-response-processing></qti-assessment-item>`;

/**
 * The laws an item's rows break when its response processing sets a score under an expression.
 *
 * @param condition - The expression, as written.
 * @returns The names of the laws broken.
 */
const breachesUnder = (condition: string) =>
  Effect.map(rowsOfText(itemUnder(condition)), (rows) => [...breachesOf(rows)]);

/**
 * A `qti-pattern-match` of the given `pattern` over a string literal.
 *
 * @param pattern - The `pattern`, as written.
 * @returns The expression's text.
 */
const patternMatch = (pattern: string): string =>
  `<qti-pattern-match pattern="${pattern}"><qti-base-value base-type="string">x</qti-base-value></qti-pattern-match>`;

describe("import/overlays/expressions.ts, a braced pattern that names no variable (reading R15-k)", () => {
  it.effect(
    "is a string value in an item, while a name of the wrong kind or base type and an unresolved bare reference stay refused",
    () =>
      // Oracle: information model §9.3.4, "if a string appears to be a reference to a template or
      // outcome variable but there is no variable with the given name it should be treated simply
      // as string value", and §2.11.3's base type for a name that is one (P24). Bound: the item's
      // one reference, each of the four spellings.
      Effect.gen(function* braced() {
        assert.deepStrictEqual(
          yield* breachesUnder(patternMatch("{NOSUCH}")),
          [],
          "no such variable",
        );
        assert.deepStrictEqual(
          yield* breachesUnder(patternMatch("{RESPONSE}")),
          ["Reference_type"],
          "a response variable",
        );
        assert.deepStrictEqual(
          yield* breachesUnder(patternMatch("{SCORE}")),
          ["Reference_type"],
          "a float outcome",
        );
        assert.deepStrictEqual(
          yield* breachesUnder(`<qti-is-null><qti-variable identifier="NOSUCH"/></qti-is-null>`),
          ["Variable_declared"],
          "an unresolved bare reference",
        );
      }),
  );
});

// The readings of a test's references (spec readings 48 and 88; representation-gaps.md §4).

/**
 * An element of a kind, with its attributes as (name, lexical) pairs and its children.
 *
 * @param kind - The kind.
 * @param attributes - The attributes, in order.
 * @param children - The children, in order.
 * @returns The element.
 */
const el = (
  kind: ElementKind<Composed>,
  attributes: readonly (readonly [ClosedName<Composed>, string])[] = [],
  children: readonly XdmChild<Composed>[] = [],
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes: attributes.map(([handle, lexical]) => ({
    lexical,
    name: closedName(handle),
    references: [],
  })),
  children,
  governs: "none",
  kind,
  namespaces: [],
  prefix: "",
});

/**
 * A text node.
 *
 * @param value - Its characters.
 * @returns The node.
 */
const text = (value: string): XdmChild<Composed> => ({ _tag: "text", value });

/**
 * A document of one root element.
 *
 * @param root - The root.
 * @returns The document.
 */
const documentOfRoot = (root: XdmClosedElement<Composed>): XdmDocument<Composed> => ({
  _tag: "document",
  charset: "utf-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  exportCharset: "utf-8",
  prolog: [],
  root,
  version: "3.0.1",
});

/**
 * The package every built package's documents are written under.
 */
const packageId = "00000000-0000-4000-8000-00000000bbbb";

/**
 * Give document `n`'s node `index` an id of its own.
 *
 * @param n - The document's number.
 * @returns Its ids.
 */
const idsIn =
  (n: number) =>
  (index: number): NodeId =>
    `00000000-0000-4000-${(0x90_00 + n).toString(16)}-${index.toString(16).padStart(12, "0")}`;

/**
 * The resource type each root's document is named under, as a manifest names it.
 */
const resourceTypes: ReadonlyMap<string, NamedResource["type"]> = new Map([
  ["qti-assessment-item", "imsqti_item_xmlv3p0"],
  ["qti-assessment-section", "imsqti_section_xmlv3p0"],
  ["qti-assessment-test", "imsqti_test_xmlv3p0"],
]);

/**
 * Every builder's rows of one package: each document's expression and test rows, the assemblies,
 * and the rows the documents build together.
 */
interface PackageRows {
  readonly assembled: AssembledRows;
  readonly documents: readonly AssembledExpressionInput[];
  readonly together: AssembledExpressionRows;
}

/**
 * Build a package's rows from its documents, each under its own ids, every href's target found
 * among them by path.
 *
 * @param documents - The documents by path.
 * @param links - The package's resources that are no document, such as LTI links.
 * @returns The rows.
 */
const packageRowsOf = (
  documents: readonly (readonly [string, XdmDocument<Composed>])[],
  links: readonly NamedResource[] = [],
): PackageRows => {
  const nodes = new Map(documents.map(([at], n) => [at, idsIn(n)(0)] as const));
  const inputs = documents.map(([at, tree], n): AssembledExpressionInput => {
    const ids: TestIds = {
      documentAt: (to: string) => Option.fromNullishOr(nodes.get(to)),
      idOf: idsIn(n),
      package: packageId,
      path: at,
    };

    return { expressions: rowsOf(tree, ids), ids, tests: testRowsOf(tree, ids), tree };
  });
  let minted = 0;
  const assembled = assembledRowsOf(
    inputs.map(({ tests }) => tests),
    () => {
      minted += 1;

      return `00000000-0000-4000-9fff-${minted.toString(16).padStart(12, "0")}`;
    },
  );

  const resources = [
    ...documents.flatMap(([at, tree]): readonly NamedResource[] => {
      const type = resourceTypes.get(tree.root.kind);

      return type === undefined ? [] : [{ path: at, type }];
    }),
    ...links,
  ];

  return {
    assembled,
    documents: inputs,
    together: assembledExpressionRowsOf(inputs, assembled, resources),
  };
};

/**
 * One reading of a name as reading 48 and reading 88 state it: unsplit; split at a dot into a
 * scope and a variable; or numbered, at two dots with digits between them.
 */
interface StatedReading {
  readonly form: "numbered" | "split" | "unsplit";
  readonly number: string;
  readonly scope: string;
  readonly variable: string;
}

/**
 * Every reading of a name, read off its characters: the unsplit reading, a split at each `.`, and
 * a numbered reading at each `.` whose next `.` closes a run of digits.
 *
 * @param identifier - The name.
 * @returns The readings.
 */
const statedReadings = (identifier: string): readonly StatedReading[] => {
  const dots: number[] = [];
  for (let at = identifier.indexOf("."); at !== -1; at = identifier.indexOf(".", at + 1)) {
    dots.push(at);
  }

  return [
    { form: "unsplit", number: "", scope: "", variable: identifier },
    ...dots.map((at): StatedReading => ({
      form: "split",
      number: "",
      scope: identifier.slice(0, at),
      variable: identifier.slice(at + 1),
    })),
    ...dots.flatMap((at, index): readonly StatedReading[] => {
      const next = dots[index + 1];
      const number = next === undefined ? "" : identifier.slice(at + 1, next);

      return next !== undefined && /^[0-9]+$/u.test(number)
        ? [
            {
              form: "numbered",
              number,
              scope: identifier.slice(0, at),
              variable: identifier.slice(next + 1),
            },
          ]
        : [];
    }),
  ];
};

/**
 * A reading as text, for a keyed comparison.
 *
 * @param reading - The reading.
 * @returns Its form and pieces.
 */
const readingKey = (reading: Omit<StatedReading, "form"> & { readonly form: string }): string =>
  JSON.stringify([reading.form, reading.scope, reading.number, reading.variable]);

describe("import/overlays/expressions.ts, the readings of a name", () => {
  it("lists exactly the readings reading 48 and reading 88 give a name, and its pieces count them", () => {
    // Oracle: a second statement of readings 48 and 88 read off the name's characters
    // (`statedReadings`), against `readingTextsOf`; and the count law of `AssembledReference`
    // (readings = segments + digits − lastDigit), over the pieces `split(".")` gives.
    // Bound: every name of 1 to 7 characters over {a, 1, .} that starts with a letter, 1,093
    // names; residual: none.
    const alphabet = ["a", "1", "."];
    let names = ["a"];
    let judged = 0;
    for (let length = 1; length <= 7; length += 1) {
      for (const identifier of names) {
        const listed = readingTextsOf(identifier, "variable").map(readingKey);
        const stated = statedReadings(identifier).map(readingKey);
        const pieces = identifier.split(".");
        const digit = pieces.map((piece, at) => at > 0 && /^[0-9]+$/u.test(piece));

        assert.strictEqual(new Set(listed).size, listed.length, identifier);
        assert.deepStrictEqual(listed.toSorted(), stated.toSorted(), identifier);
        assert.strictEqual(
          listed.length,
          pieces.length + digit.filter(Boolean).length - (digit.at(-1) === true ? 1 : 0),
          identifier,
        );
        judged += 1;
      }

      names = names.flatMap((name) => alphabet.map((character) => `${name}${character}`));
    }

    assert.strictEqual(judged, 1093);
  });
});

/**
 * One package of the reference search: which item refs the test's section holds (each naming an
 * item of its own), what each item declares, whether the test declares `a.b`, whether the section
 * selects with replacement, and the name the reference spells.
 */
interface ReferenceCase {
  readonly declaresAb: boolean;
  readonly itemA: readonly string[];
  readonly itemAb: readonly string[];
  readonly reference: string;
  readonly refs: readonly ("a" | "a.b")[];
  readonly replaced: boolean;
}

/**
 * An item of declarations, each an outcome of base type float.
 *
 * @param identifier - The item's identifier.
 * @param declared - Its declarations' identifiers.
 * @returns The item.
 */
const itemOf = (identifier: string, declared: readonly string[]): XdmDocument<Composed> =>
  documentOfRoot(
    el(
      "qti-assessment-item",
      [
        ["identifier", identifier],
        ["title", identifier],
        ["adaptive", "false"],
        ["time-dependent", "true"],
      ],
      declared.map((name) =>
        el("qti-outcome-declaration", [
          ["identifier", name],
          ["cardinality", "single"],
          ["base-type", "float"],
        ]),
      ),
    ),
  );

/**
 * The documents of a reference case: the test, its part `P`, its section `S`, its item refs, and
 * its outcome processing, which sets `OUT` to the variable the case's name spells.
 *
 * @param c - The case.
 * @returns The documents by path.
 */
const referenceCaseOf = (
  c: ReferenceCase,
): readonly (readonly [string, XdmDocument<Composed>])[] => {
  const outcome = (identifier: string) =>
    el("qti-outcome-declaration", [
      ["identifier", identifier],
      ["cardinality", "single"],
      ["base-type", "float"],
    ]);
  const test = el(
    "qti-assessment-test",
    [
      ["identifier", "T"],
      ["title", "T"],
    ],
    [
      outcome("OUT"),
      ...(c.declaresAb ? [outcome("a.b")] : []),
      el(
        "qti-test-part",
        [
          ["identifier", "P"],
          ["navigation-mode", "linear"],
          ["submission-mode", "individual"],
        ],
        [
          el(
            "qti-assessment-section",
            [
              ["identifier", "S"],
              ["title", "S"],
              ["visible", "true"],
            ],
            [
              ...(c.replaced
                ? [
                    el("qti-selection", [
                      ["select", "1"],
                      ["with-replacement", "true"],
                    ]),
                  ]
                : []),
              ...c.refs.map((ref) =>
                el("qti-assessment-item-ref", [
                  ["identifier", ref],
                  ["href", ref === "a" ? "a.xml" : "ab.xml"],
                ]),
              ),
            ],
          ),
        ],
      ),
      el(
        "qti-outcome-processing",
        [],
        [
          el(
            "qti-set-outcome-value",
            [["identifier", "OUT"]],
            [el("qti-variable", [["identifier", c.reference]])],
          ),
        ],
      ),
    ],
  );

  return [
    ["test.xml", documentOfRoot(test)],
    ["a.xml", itemOf("A", c.itemA)],
    ["ab.xml", itemOf("AB", c.itemAb)],
  ];
};

/**
 * The built-in variables an item ref's prefix reaches, as the information model states them
 * (§2.2.2: the session variables, and §2.2.2.1, `QTI_CONTEXT`; spec reading 106).
 */
const itemBuiltInsStated = new Set(["completionStatus", "duration", "numAttempts", "QTI_CONTEXT"]);

/**
 * Whether a reference case's name is accepted, as readings 48 and 88 state it over the case's own
 * description: exactly one of its readings names a real scope and a variable of it.
 *
 * @param c - The case.
 * @returns Whether exactly one reading resolves.
 */
const acceptedAsStated = (c: ReferenceCase): boolean => {
  const declaredIn = (ref: string) => (ref === "a" ? c.itemA : c.itemAb);
  const resolvesIn = (ref: string, variable: string) =>
    declaredIn(ref).includes(variable) || itemBuiltInsStated.has(variable);
  const isRef = (scope: string): scope is "a" | "a.b" => c.refs.some((ref) => ref === scope);
  const resolving = statedReadings(c.reference).filter((reading) => {
    switch (reading.form) {
      case "unsplit": {
        return (
          ["OUT", ...(c.declaresAb ? ["a.b"] : [])].includes(reading.variable) ||
          ["duration", "QTI_CONTEXT"].includes(reading.variable)
        );
      }
      case "split": {
        if (isRef(reading.scope)) {
          return resolvesIn(reading.scope, reading.variable);
        }

        return ["P", "S"].includes(reading.scope) && reading.variable === "duration";
      }
      case "numbered": {
        return (
          isRef(reading.scope) &&
          c.replaced &&
          /[1-9]/u.test(reading.number) &&
          resolvesIn(reading.scope, reading.variable)
        );
      }
      default: {
        return reading.form satisfies never;
      }
    }
  });

  return resolving.length === 1;
};

/**
 * A `Reading` row.
 */
type ReadingRow =
  AssembledExpressionRows["Reading"] extends ReadonlyMap<string, infer R> ? R : never;

/**
 * The setters, as the information model defines them: the rules that set the variable their
 * `identifier` names (§5.87.1, §5.130.1, §6.32.3, §6.50.1, §6.50.4, §6.50.5), whose prefixed
 * readings resolve nothing (spec reading 112).
 */
const settersStated: ReadonlySet<string> = new Set([
  "qti-lookup-outcome-value",
  "qti-set-correct-response",
  "qti-set-default-value",
  "qti-set-outcome-value",
  "qti-set-template-value",
]);

/**
 * `Prefixed_reference`'s resolving reading, as the law states it: a variable's reading whose source
 * is named and, numbered, whose item ref can repeat and whose number is at least 1.
 *
 * @param r - The reading.
 * @returns Whether it resolves.
 */
const resolvesOnHost = (r: ReadingRow): boolean =>
  r.form !== "name" &&
  r.source !== "none" &&
  (r.form === "unsplit" || !settersStated.has(r.kind)) &&
  (r.form !== "numbered" || (r.replaced && /^[0-9]*[1-9][0-9]*$/u.test(r.number)));

/**
 * The declaration lookups of a package: each document's, and the probes its documents write
 * together, which must agree where both hold a key.
 *
 * @param rows - The package's rows.
 * @param breaches - The breaches found so far, which this adds to.
 * @returns The lookups, by `[document, name]`.
 */
const lookupsOfPackage = (
  rows: PackageRows,
  breaches: string[],
): ReadonlyMap<
  string,
  AssembledExpressionRows["VariableLookup"] extends ReadonlyMap<string, infer R> ? R : never
> => {
  const lookups = new Map(rows.documents.flatMap((input) => [...input.expressions.VariableLookup]));
  for (const [at, probe] of rows.together.VariableLookup) {
    const held = lookups.get(at);
    if (held !== undefined && JSON.stringify(held) !== JSON.stringify(probe)) {
      breaches.push(`VariableLookup ${at}: a probe beside a document's row`);
    }

    lookups.set(at, probe);
  }

  return lookups;
};

/**
 * An assembled reference's row.
 */
type AssembledReferenceOnHost =
  AssembledExpressionRows["AssembledReference"] extends ReadonlyMap<string, infer R> ? R : never;

/**
 * The breaches of `AssembledReference`'s and `ReferenceSegment`'s `E1_derived` over one
 * reference: its pieces spell its name, each piece is dot-free with its separator and digit flag,
 * and its readings are counted by its pieces.
 *
 * @param reference - The reference.
 * @param readings - Its readings.
 * @returns The breaches.
 */
const pieceBreaches = (
  reference: AssembledReferenceOnHost,
  readings: readonly ReadingRow[],
): readonly string[] => {
  const where = keyOf([reference.assembly, reference.node, reference.attribute]);
  const tokens = reference.segments.map(({ token }) => token);
  const digits = reference.segments.filter(({ digit }) => digit).length;
  const counted =
    reference.role !== "variable" ||
    (tokens.join("") === reference.identifier &&
      readings.length === reference.segments.length + digits - (reference.lastDigit ? 1 : 0));

  return [
    ...(counted ? [] : [`${where}: its pieces do not spell and count its readings`]),
    ...reference.segments.flatMap((segment, at) => {
      const separator = at === 0 ? "" : ".";
      const lawful =
        !segment.piece.includes(".") &&
        segment.separator === separator &&
        segment.token === `${separator}${segment.piece}` &&
        segment.digit === (at > 0 && /^[0-9]+$/u.test(segment.piece));

      return lawful ? [] : [`${where}: piece ${String(at)}`];
    }),
  ];
};

/**
 * Whether a reading's text is the name read in its form, each piece copied from the reference's
 * pieces.
 *
 * @param reference - The reference.
 * @param r - The reading.
 * @returns Whether it is.
 */
const textHolds = (reference: AssembledReferenceOnHost, r: ReadingRow): boolean => {
  const before = reference.segments
    .slice(0, Number(r.split))
    .map(({ token }) => token)
    .join("");
  switch (r.form) {
    case "unsplit": {
      return r.variable === r.identifier && r.scope === "";
    }
    case "name": {
      return r.scope === r.identifier;
    }
    case "split": {
      return r.scope === before && r.identifier === `${r.scope}.${r.variable}`;
    }
    case "numbered": {
      return (
        r.scope === before &&
        r.number === reference.segments[Number(r.split)]?.piece &&
        r.identifier === `${r.scope}.${r.number}.${r.variable}`
      );
    }
    default: {
      return r.form satisfies never;
    }
  }
};

/**
 * Whether a reading's name probe reads its scope's lookup.
 *
 * @param rows - The package's rows.
 * @param r - The reading.
 * @returns Whether it does, or makes none.
 */
const nameProbeHolds = (rows: PackageRows, r: ReadingRow): boolean => {
  if (r.form === "unsplit") {
    return true;
  }

  const named = rows.together.NameLookup.get(lookupKey(r.assembly, r.scope));

  return (
    named !== undefined &&
    named.found === r.found &&
    named.node === r.named &&
    named.kind === r.namedKind &&
    named.placements === r.placements &&
    named.replaced === r.replaced &&
    named.itemDocument === r.lookupDocument
  );
};

/**
 * Whether a reading's variable is a built-in of its scope, as the information model states the
 * built-ins: a test's `duration` and `QTI_CONTEXT`, unsplit; an item's, through an item ref; a
 * part's, a section's or a section ref's `duration` (§2.2.2, info.txt:9214; spec reading 86).
 *
 * @param r - The reading.
 * @param itemScoped - Whether its scope is a found item ref.
 * @returns Whether it is.
 */
const builtInStated = (r: ReadingRow, itemScoped: boolean): boolean => {
  if (r.form === "unsplit") {
    return ["duration", "QTI_CONTEXT"].includes(r.variable);
  }

  if (itemScoped) {
    return itemBuiltInsStated.has(r.variable);
  }

  return (
    r.form === "split" &&
    r.found &&
    ["qti-test-part", "qti-assessment-section", "qti-assessment-section-ref"].includes(
      r.namedKind,
    ) &&
    r.variable === "duration"
  );
};

/**
 * What a reading's variable is, as `Reading`'s `E1_derived` states it: a declaration first, then a
 * mapping, then a built-in of its scope.
 *
 * @param declared - Whether it is declared where the reading reads declarations.
 * @param mapped - Whether the item ref maps it.
 * @param builtIn - Whether it is a built-in of the scope.
 * @returns The source.
 */
const sourceStated = (
  declared: boolean,
  mapped: boolean,
  builtIn: boolean,
): ReadingRow["source"] => {
  if (declared) {
    return "declared";
  }

  if (mapped) {
    return "mapped";
  }

  return builtIn ? "builtIn" : "none";
};

/**
 * The reference a reading reads.
 *
 * @param rows - The package's rows.
 * @param r - The reading.
 * @returns The reference.
 * @throws {Error} When the reading reads no reference, which its family's containment refuses.
 */
const rowsReference = (rows: PackageRows, r: ReadingRow): AssembledReferenceOnHost => {
  const reference = rows.together.AssembledReference.get(keyOf([r.assembly, r.node, r.attribute]));
  if (reference === undefined) {
    throw new Error(`The reading of ${r.identifier} reads no assembled reference.`);
  }

  return reference;
};

/**
 * The breaches of one reading's probes: its declaration probe where it reads the test's or an
 * item's declarations, and its mapping probe where it reads an item ref's, each the lookup's
 * verdict.
 *
 * @param rows - The package's rows.
 * @param lookups - The declaration lookups.
 * @param r - The reading.
 * @returns The breaches.
 */
const probeBreaches = (
  rows: PackageRows,
  lookups: ReturnType<typeof lookupsOfPackage>,
  r: ReadingRow,
): readonly string[] => {
  const where = `${keyOf([r.assembly, r.node, r.attribute])} ${r.form} ${String(r.split)}`;
  const itemScoped =
    (r.form === "split" || r.form === "numbered") &&
    r.found &&
    r.namedKind === "qti-assessment-item-ref";
  const readsDeclarations =
    r.form === "unsplit" || (itemScoped && r.resourceType === "imsqti_item_xmlv3p0");
  const declared = readsDeclarations
    ? (lookups.get(lookupKey(r.lookupDocument, r.variable))?.declared ?? false)
    : false;
  const mapped = itemScoped
    ? (rows.together.MappingLookup.get(lookupKey(r.named, r.variable))?.mapped ?? false)
    : false;

  const builtIn = builtInStated(r, itemScoped);
  const source = sourceStated(declared, mapped, builtIn);

  return [
    ...(source === r.source ? [] : [`${where}: its source`]),
    ...(textHolds(rowsReference(rows, r), r) ? [] : [`${where}: its text`]),
    ...(nameProbeHolds(rows, r) ? [] : [`${where}: its name probe`]),
    ...(declared === r.declared ? [] : [`${where}: its declaration probe`]),
    ...(mapped === r.mapped ? [] : [`${where}: its mapping probe`]),
  ];
};

/**
 * The breaches of the structural laws over a package's reference rows: each the law's statement,
 * read on the host: the name's pieces and the readings' count (`AssembledReference`'s and
 * `ReferenceSegment`'s `E1_derived`), each reading's text and each probe it makes, and the lookups'
 * forced and absent rows (M2).
 *
 * @param rows - The package's rows.
 * @returns The breaches, as text.
 */
const structuralBreaches = (rows: PackageRows): readonly string[] => {
  const breaches: string[] = [];
  const lookups = lookupsOfPackage(rows, breaches);
  const readings = Map.groupBy(rows.together.Reading.values(), ({ assembly, attribute, node }) =>
    keyOf([assembly, node, attribute]),
  );
  for (const reference of rows.together.AssembledReference.values()) {
    const read =
      readings.get(keyOf([reference.assembly, reference.node, reference.attribute])) ?? [];
    breaches.push(
      ...pieceBreaches(reference, read),
      ...read.flatMap((r) => probeBreaches(rows, lookups, r)),
    );
  }

  for (const name of rows.assembled.AssembledName.values()) {
    const found = rows.together.NameLookup.get(lookupKey(name.assembly, name.identifier));
    if (found?.found !== true || found.node !== name.node) {
      breaches.push(`NameLookup ${name.identifier}: not forced in`);
    }
  }

  return breaches;
};

/**
 * Judge a reference case's reference on the rows, by the laws over them: exactly one resolving
 * reading (`Prefixed_reference`'s key and containment, M3), through a name of one placement.
 *
 * @param rows - The package's rows.
 * @returns Whether the case's `qti-variable` is accepted.
 */
const acceptedOnRows = (rows: PackageRows): boolean => {
  const reference = [...rows.together.AssembledReference.values()].find(
    ({ kind }) => kind === "qti-variable",
  );
  const resolving = [...rows.together.Reading.values()].filter(
    (r) => r.node === reference?.node && r.attribute === reference.attribute && resolvesOnHost(r),
  );

  return resolving.length === 1 && resolving.every(({ placements }) => placements === 1n);
};

/**
 * Every subset of a list, each in the list's order.
 *
 * @param of - The list.
 * @returns Its subsets.
 */
const subsets = <A>(of: readonly A[]): readonly (readonly A[])[] => {
  const sets: (readonly A[])[] = [[]];
  for (const member of of) {
    const held = sets.length;
    for (let at = 0; at < held; at += 1) {
      sets.push([...(sets[at] ?? []), member]);
    }
  }

  return sets;
};

describe("import/overlays/expressions.ts, a test's references", () => {
  it("accepts a test's reference exactly where one reading resolves, over every small test", () => {
    // Oracle: a second implementation, readings 48 and 88 stated over the case's description
    // (`acceptedAsStated`), against `Prefixed_reference`'s laws judged on the rows the builders
    // write, every structural law over those rows holding (`structuralBreaches`).
    // Bound: the section's item refs {a}, {a.b} or both; a's item declaring any subset of
    // {b.SCORE, SCORE}; a.b's any subset of {SCORE}; the test declaring a.b or not; the section
    // selecting with replacement or not; and 16 names the reference spells: 1,536 packages.
    // Residual: section documents and two placements, which "refuses a name a section document
    // placed twice gives twice" below judges.
    const names = [
      "a.b",
      "a.b.SCORE",
      "a.SCORE",
      "a.1.SCORE",
      "a.0.SCORE",
      "S.duration",
      "P.duration",
      "a.duration",
      "SCORE",
      "duration",
      "a.b.duration",
      "a.QTI_CONTEXT",
      "S.SCORE",
      "a.2.b.SCORE",
      "a.1",
      "a.b.2",
    ];
    let judged = 0;
    let accepted = 0;
    for (const refs of [["a"], ["a.b"], ["a", "a.b"]] as const) {
      for (const itemA of subsets(["b.SCORE", "SCORE"])) {
        for (const itemAb of subsets(["SCORE"])) {
          for (const declaresAb of [false, true]) {
            for (const replaced of [false, true]) {
              for (const reference of names) {
                const c: ReferenceCase = { declaresAb, itemA, itemAb, reference, refs, replaced };
                const rows = packageRowsOf(referenceCaseOf(c));
                const expected = acceptedAsStated(c);

                assert.deepStrictEqual(structuralBreaches(rows), [], JSON.stringify(c));
                assert.strictEqual(acceptedOnRows(rows), expected, JSON.stringify(c));
                judged += 1;
                accepted += expected ? 1 : 0;
              }
            }
          }
        }
      }
    }

    assert.strictEqual(judged, 1536);
    assert.isAbove(accepted, 0);
    assert.isBelow(accepted, judged);
  });

  it("refuses a name a section document placed twice gives twice, reads that document's own reference once, and accepts it placed once", () => {
    // Oracle: spec reading 86 ("a reference that names an item ref or a section through such a
    // document ... resolves once for each placement ... so it is refused") and reading 5 ("once
    // for each test that includes the section"): the test reads `a.SCORE`, `a` an item ref of a
    // section document its section refs place; the section document's own pre-condition reads
    // the test's `OUT`. Bound: the document placed once and twice.
    for (const placed of [1, 2]) {
      const section = el(
        "qti-assessment-section",
        [
          ["identifier", "S2"],
          ["title", "S2"],
          ["visible", "true"],
        ],
        [
          el("qti-pre-condition", [], [el("qti-variable", [["identifier", "OUT"]])]),
          el("qti-assessment-item-ref", [
            ["identifier", "a"],
            ["href", "a.xml"],
          ]),
        ],
      );
      const test = el(
        "qti-assessment-test",
        [
          ["identifier", "T"],
          ["title", "T"],
        ],
        [
          el("qti-outcome-declaration", [
            ["identifier", "OUT"],
            ["cardinality", "single"],
            ["base-type", "float"],
          ]),
          el(
            "qti-test-part",
            [
              ["identifier", "P"],
              ["navigation-mode", "linear"],
              ["submission-mode", "individual"],
            ],
            [
              el(
                "qti-assessment-section",
                [
                  ["identifier", "S"],
                  ["title", "S"],
                  ["visible", "true"],
                ],
                Array.from({ length: placed }, (_, at) =>
                  el("qti-assessment-section-ref", [
                    ["identifier", `R${String(at + 1)}`],
                    ["href", "s.xml"],
                  ]),
                ),
              ),
            ],
          ),
          el(
            "qti-outcome-processing",
            [],
            [
              el(
                "qti-set-outcome-value",
                [["identifier", "OUT"]],
                [el("qti-variable", [["identifier", "a.SCORE"]])],
              ),
            ],
          ),
        ],
      );
      const rows = packageRowsOf([
        ["test.xml", documentOfRoot(test)],
        ["s.xml", documentOfRoot(section)],
        ["a.xml", itemOf("A", ["SCORE"])],
      ]);
      const resolving = resolvingReadingsOf(rows.together);
      const readingsOf = (identifier: string) =>
        [...resolving.values()].find((readings) =>
          readings.some((reading) => reading.identifier === identifier),
        ) ?? [];
      const own = [...rows.together.AssembledReference.values()].filter(
        ({ identifier, rootKind }) => identifier === "OUT" && rootKind === "qti-assessment-section",
      );

      assert.deepStrictEqual(structuralBreaches(rows), [], `placed ${String(placed)}`);
      assert.deepStrictEqual(
        readingsOf("a.SCORE").map(({ placements }) => placements),
        [BigInt(placed)],
      );
      assert.strictEqual(acceptedOnRows(rows), placed === 1, `placed ${String(placed)}`);
      assert.lengthOf(own, 1, "one reading of the section document's reference per test");
      assert.strictEqual(
        [...rows.together.PlacedReference.values()].filter(({ node }) => node === own[0]?.node)
          .length,
        placed,
      );
    }
  });

  it("resolves a test's setter only by its own document's declaration, never through an item ref", () => {
    // Oracle: spec reading 112 (§5.87.1 and §5.130.1, "the variable to be set"; §2.11.1.2,
    // prefixing looks item values up): a `qti-set-outcome-value` naming `a.SCORE`, item ref `a`'s
    // item declaring `SCORE`, resolves only where the test itself declares `a.SCORE` whole, and
    // its prefixed reading never counts, so it is not ambiguous then. Bound: the test declaring
    // `a.SCORE` or not.
    for (const declaresWhole of [false, true]) {
      const outcome = (identifier: string) =>
        el("qti-outcome-declaration", [
          ["identifier", identifier],
          ["cardinality", "single"],
          ["base-type", "float"],
        ]);
      const test = el(
        "qti-assessment-test",
        [
          ["identifier", "T"],
          ["title", "T"],
        ],
        [
          ...(declaresWhole ? [outcome("a.SCORE")] : []),
          el(
            "qti-test-part",
            [
              ["identifier", "P"],
              ["navigation-mode", "linear"],
              ["submission-mode", "individual"],
            ],
            [
              el(
                "qti-assessment-section",
                [
                  ["identifier", "S"],
                  ["title", "S"],
                  ["visible", "true"],
                ],
                [
                  el("qti-assessment-item-ref", [
                    ["identifier", "a"],
                    ["href", "a.xml"],
                  ]),
                ],
              ),
            ],
          ),
          el(
            "qti-outcome-processing",
            [],
            [
              el(
                "qti-set-outcome-value",
                [["identifier", "a.SCORE"]],
                [el("qti-base-value", [["base-type", "float"]], [text("1.5")])],
              ),
            ],
          ),
        ],
      );
      const rows = packageRowsOf([
        ["test.xml", documentOfRoot(test)],
        ["a.xml", itemOf("A", ["SCORE"])],
      ]);
      const setter = [...rows.together.AssembledReference.values()].find(
        ({ kind }) => kind === "qti-set-outcome-value",
      );
      const readings = [...rows.together.Reading.values()].filter(
        ({ node }) => node === setter?.node,
      );

      assert.deepStrictEqual(structuralBreaches(rows), [], `whole ${String(declaresWhole)}`);
      assert.isTrue(
        readings.some(({ form, source }) => form === "split" && source === "declared"),
        "the prefixed reading names the item's SCORE",
      );
      assert.deepStrictEqual(
        readings.filter(resolvesOnHost).map(({ form }) => form),
        declaresWhole ? ["unsplit"] : [],
      );
      assert.deepStrictEqual(
        [...resolvingReadingsOf(rows.together).values()]
          .flat()
          .filter(({ node }) => node === setter?.node)
          .map(({ form }) => form),
        declaresWhole ? ["unsplit"] : [],
      );
    }
  });

  it("names both readings of an ambiguous reference, and resolves each other one once", () => {
    // Oracle: reading 48's own example: item refs `a` and `a.b`, `a.b.SCORE` read as item ref
    // `a.b`'s SCORE and as item ref `a`'s `b.SCORE`. Bound: the one package, both declared.
    const rows = packageRowsOf(
      referenceCaseOf({
        declaresAb: false,
        itemA: ["b.SCORE"],
        itemAb: ["SCORE"],
        reference: "a.b.SCORE",
        refs: ["a", "a.b"],
        replaced: false,
      }),
    );
    const resolving = [...resolvingReadingsOf(rows.together).values()].find((readings) =>
      readings.some(({ identifier }) => identifier === "a.b.SCORE"),
    );

    assert.deepStrictEqual(
      (resolving ?? []).map(({ scope, variable }) => `${scope} | ${variable}`).toSorted(),
      ["a | b.SCORE", "a.b | SCORE"],
    );
  });
});

/**
 * The declarations a document holds as its own tree says: each declaration element's collapsed
 * identifier, and the tables it holds as children.
 *
 * @param tree - The document's tree.
 * @returns Each identifier with its declaration's tables, the first of a repeated identifier.
 */
const declarationsInTree = (
  tree: XdmDocument<Composed>,
): ReadonlyMap<string, ReadonlySet<string>> => {
  const declared = new Map<string, ReadonlySet<string>>();
  const visit = (node: XdmChild<Composed>): void => {
    if (node._tag !== "element") {
      return;
    }

    const identifier = node.attributes.find(
      ({ name }) => name._tag === "closed" && name.handle === "identifier",
    )?.lexical;
    if (
      [
        "qti-context-declaration",
        "qti-outcome-declaration",
        "qti-response-declaration",
        "qti-template-declaration",
      ].includes(node.kind) &&
      identifier !== undefined &&
      !declared.has(identifier.trim())
    ) {
      declared.set(
        identifier.trim(),
        new Set(node.children.flatMap((child) => (child._tag === "element" ? [child.kind] : []))),
      );
    }

    for (const child of node.children) {
      visit(child);
    }
  };
  visit(tree.root);

  return declared;
};

describe("import/overlays/expressions.ts, the claims a reference proves", () => {
  it("types a test variables that writes no base-type unknown, by an unwritten row of its own", () => {
    // Oracle: the information model's TestVariables (§2.11.4.8: a base-type, where written,
    // selects the variables matched; none written, every one), read as `E1_derived`'s two arms
    // over `ExpressionAttribute`: the attribute written, its lexical form and the base type it
    // spells; unwritten, an empty form and `unknown`. Bound: the attribute written and unwritten.
    for (const written of [false, true]) {
      const tree = documentOfRoot(
        el(
          "qti-assessment-test",
          [
            ["identifier", "T"],
            ["title", "T"],
          ],
          [
            el(
              "qti-outcome-processing",
              [],
              [
                el(
                  "qti-set-outcome-value",
                  [["identifier", "OUT"]],
                  [
                    el(
                      "qti-sum",
                      [],
                      [
                        el("qti-test-variables", [
                          ["variable-identifier", "SCORE"],
                          ...(written ? ([["base-type", "float"]] as const) : []),
                        ]),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      );
      const rows = rowsOf(tree, { idOf });
      const variables = [...rows.Expression.values()].find(
        ({ kind }) => kind === "qti-test-variables",
      );
      const typing = rows.ExpressionAttribute.get(JSON.stringify([variables?.node, "base-type"]));

      assert.deepStrictEqual(
        typing === undefined
          ? undefined
          : { baseType: typing.baseType, lexical: typing.lexical, written: typing.written },
        written
          ? { baseType: "float", lexical: "float", written: true }
          : { baseType: "unknown", lexical: "", written: false },
      );
    }
  });

  it.effect(
    "probes every name a reference claims undeclared, types every unwritten base type unknown, and reads every table a declaration holds",
    () =>
      // Oracle: each document's own tree (`declarationsInTree`), a second reading of what it
      // declares and which tables each declaration holds, against the lookups the builder writes
      // (M2): a reference that names no declaration has an absent row, every row says what the
      // document declares, every test variables' unwritten `base-type` is `unknown`, and every
      // table slot a map response or a lookup reads is the table its declaration holds.
      // Bound: every fixture, 37 documents.
      Effect.gen(function* claimsProved() {
        for (const { file } of frozen) {
          const tree = yield* treeOfFixture(file);
          const rows = rowsOf(tree, { idOf });
          const declared = declarationsInTree(tree);

          for (const reference of rows.VariableRef.values()) {
            const lookup = rows.VariableLookup.get(
              lookupKey(reference.document, reference.identifier),
            );
            if (reference.resolution !== "declared") {
              assert.strictEqual(lookup?.declared, false, `${file} ${reference.identifier}`);
            }
          }

          for (const lookup of rows.VariableLookup.values()) {
            assert.strictEqual(
              lookup.declared,
              declared.has(lookup.name),
              `${file} ${lookup.name}`,
            );
          }

          for (const expression of rows.Expression.values()) {
            if (expression.kind === "qti-test-variables") {
              const typing = rows.ExpressionAttribute.get(
                JSON.stringify([expression.node, "base-type"]),
              );

              assert.isDefined(typing, file);
              assert.isTrue(
                typing !== undefined && (typing.written || typing.baseType === "unknown"),
                file,
              );
            }
          }

          for (const reference of rows.VariableRef.values()) {
            const table = rows.DeclarationTable.get(reference.declaration);
            const holds = declared.get(reference.identifier) ?? new Set<string>();
            if (
              reference.resolution === "declared" &&
              reference.attribute === "identifier" &&
              reference.kind === "qti-map-response"
            ) {
              assert.strictEqual(table?.mapping, holds.has("qti-mapping") ? "qti-mapping" : "none");
              assert.strictEqual(reference.table, table?.mapping, file);
            }
          }
        }
      }),
  );
});

/**
 * One package of the item ref search: a template default's template and its expression's base
 * type, and a variable mapping's source and target, over an item that declares a template `T`
 * (an integer), and outcomes `SCORE` and `X`.
 */
interface ItemRefCase {
  readonly heldBase: "float" | "integer";
  readonly source: "MISSING" | "SCORE" | "T";
  readonly target: "S2" | "SCORE" | "X";
  readonly template: "SCORE" | "T" | "U";
}

/**
 * The documents of an item ref case.
 *
 * @param c - The case.
 * @returns The documents by path.
 */
const itemRefCaseOf = (c: ItemRefCase): readonly (readonly [string, XdmDocument<Composed>])[] => {
  const item = el(
    "qti-assessment-item",
    [
      ["identifier", "A"],
      ["title", "A"],
      ["adaptive", "false"],
      ["time-dependent", "false"],
    ],
    [
      el("qti-outcome-declaration", [
        ["identifier", "SCORE"],
        ["cardinality", "single"],
        ["base-type", "float"],
      ]),
      el("qti-outcome-declaration", [
        ["identifier", "X"],
        ["cardinality", "single"],
        ["base-type", "float"],
      ]),
      el("qti-template-declaration", [
        ["identifier", "T"],
        ["cardinality", "single"],
        ["base-type", "integer"],
      ]),
    ],
  );
  const test = el(
    "qti-assessment-test",
    [
      ["identifier", "TEST"],
      ["title", "TEST"],
    ],
    [
      el("qti-outcome-declaration", [
        ["identifier", "OUT"],
        ["cardinality", "single"],
        ["base-type", "float"],
      ]),
      el(
        "qti-test-part",
        [
          ["identifier", "P"],
          ["navigation-mode", "linear"],
          ["submission-mode", "individual"],
        ],
        [
          el(
            "qti-assessment-section",
            [
              ["identifier", "S"],
              ["title", "S"],
              ["visible", "true"],
            ],
            [
              el(
                "qti-assessment-item-ref",
                [
                  ["identifier", "a"],
                  ["href", "a.xml"],
                ],
                [
                  el("qti-variable-mapping", [
                    ["source-identifier", c.source],
                    ["target-identifier", c.target],
                  ]),
                  el(
                    "qti-template-default",
                    [["template-identifier", c.template]],
                    [
                      el(
                        "qti-base-value",
                        [["base-type", c.heldBase]],
                        [text(c.heldBase === "integer" ? "1" : "1.5")],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      el(
        "qti-outcome-processing",
        [],
        [
          el(
            "qti-set-outcome-value",
            [["identifier", "OUT"]],
            [el("qti-variable", [["identifier", `a.${c.target}`]])],
          ),
        ],
      ),
    ],
  );

  return [
    ["test.xml", documentOfRoot(test)],
    ["a.xml", documentOfRoot(item)],
  ];
};

describe("import/overlays/expressions.ts, an item ref's declarations", () => {
  it("names no item under an item ref that names an LTI link, so its mapping and its template default have no declaration row", () => {
    // Oracle: spec reading 110 (§7.48 and §5.152 name variables declared in the corresponding
    // item; an LTI link, the implementation guide's §6.2.9, declares none) and the UP audit's B3:
    // the item ref's target is the link's resource type, it has no item document, and a mapping's
    // source and a template default's template have no declaration, so neither has the row of its
    // own that `Variable mapping source` and `Template default target` require (the ruling of
    // 2026-11-06: a missing value is a row of its own relation, never a sentinel). Bound: the item
    // ref case's first package, its item replaced by an LTI link.
    const [test] = itemRefCaseOf({
      heldBase: "integer",
      source: "SCORE",
      target: "S2",
      template: "T",
    });
    const rows = packageRowsOf(test === undefined ? [] : [test], [
      { path: "a.xml", type: "imslti_xmlv1p1" },
    ]);

    assert.deepStrictEqual(
      [...rows.together.ItemRefTarget.values()].map(({ type }) => type),
      ["imslti_xmlv1p1"],
    );
    assert.strictEqual(rows.together.ItemRefDocument.size, 0);
    assert.strictEqual(rows.together.MappingSourceDeclaration.size, 0);
    assert.strictEqual(rows.together.TemplateDefaultTarget.size, 0);
    // The mapping's item ref names the link, which leaves it unchecked (reading 110).
    assert.deepStrictEqual(
      [...rows.together.MappingItemRef.values()].map(({ type }) => type),
      ["imslti_xmlv1p1"],
    );
    assert.deepStrictEqual(
      [...rows.together.TemplateDefault.values()].map(({ template }) => template),
      ["T"],
    );
    assert.deepStrictEqual(
      [...rows.together.MappingLookup.values()].map(({ mapped, name }) => [name, mapped]),
      [["S2", true]],
    );
  });

  it("refuses a template default or a mapping exactly where the item's declarations do not admit it", () => {
    // Oracle: the information model's sentences over the case's description: a template default
    // names a template variable of its item (§5.152, A37) and its expression fits that variable's
    // type (A38, P20); a mapping's source is an outcome of its item (§7.48, A34) and its target
    // names no other variable of the item (reading 97). Against the laws over the rows the
    // builders write: `Template default target` (a target row, and a template declaration),
    // `Template_default_type`, `Variable mapping source` (a source row, and an outcome
    // declaration) and `Variable_mapping_target`; no row holds the nil uuid.
    // Bound: every template of {T, U, SCORE}, expression of {integer, float}, source of {SCORE,
    // MISSING, T} and target of {S2, X, SCORE}: 54 packages.
    const nil = "00000000-0000-0000-0000-000000000000";
    let judged = 0;
    for (const template of ["T", "U", "SCORE"] as const) {
      for (const heldBase of ["integer", "float"] as const) {
        for (const source of ["SCORE", "MISSING", "T"] as const) {
          for (const target of ["S2", "X", "SCORE"] as const) {
            const c: ItemRefCase = { heldBase, source, target, template };
            const rows = packageRowsOf(itemRefCaseOf(c));
            const { together } = rows;
            const [templateDefault] = [...together.TemplateDefault.values()];
            const templateTarget = together.TemplateDefaultTarget.get(templateDefault?.node ?? "");
            const [mapping] = rows.documents.flatMap(({ tests }) => [
              ...tests.VariableMapping.values(),
            ]);
            const mappingSource = together.MappingSourceDeclaration.get(mapping?.node ?? "");
            const where = JSON.stringify(c);

            assert.isFalse(
              [
                ...together.TemplateDefaultTarget.values(),
                ...together.MappingSourceDeclaration.values(),
              ].some(
                ({ declaration, itemDocument }) => declaration === nil || itemDocument === nil,
              ),
              where,
            );
            assert.strictEqual(templateTarget !== undefined, template !== "U", where);
            assert.strictEqual(
              templateTarget?.declarationKind === "qti-template-declaration",
              template === "T",
              where,
            );
            assert.strictEqual(
              template !== "T" ||
                (templateTarget?.heldBase === "integer" &&
                  templateTarget.declBaseType === "integer"),
              template !== "T" || heldBase === "integer",
              where,
            );
            assert.strictEqual(mappingSource !== undefined, source !== "MISSING", where);
            assert.strictEqual(
              mappingSource?.declarationKind === "qti-outcome-declaration",
              source === "SCORE",
              where,
            );
            assert.strictEqual(
              mappingSource === undefined ||
                !mappingSource.targetDeclared ||
                mappingSource.target === mappingSource.source,
              source === "MISSING" || target === "S2" || target === source,
              where,
            );
            assert.deepStrictEqual(structuralBreaches(rows), [], where);
            judged += 1;
          }
        }
      }
    }

    assert.strictEqual(judged, 54);
  });
});
