/**
 * The checks that order two lexical forms, `Slider_bounds` and `Aria_value_range`
 * (`#pantry/qti/interactions.ts`) and `Mastery_range` (`#pantry/qti/declarations.ts`), read from
 * the schema's statements and evaluated over a row on the host as PostgreSQL evaluates the CHECK
 * grizzle installs for each, so the order tests judge the predicate the database installs.
 *
 * The tests' host judge (`#pantry/test/host-judge.ts`) reads no `Compute.when` term, so it
 * judges none of these checks; this evaluator reads the kinds they hold and nothing else, and a
 * term of any other kind fails the test, so no predicate is ever judged in part:
 *
 * - **Predicates:** `or`, `and`, `not`, `Compute.matches` as a regular expression under `u`, and a
 *   comparison of two texts by equality, of two doubles by `float8`'s order, or of two numerics
 *   exactly. No column is nullable, so the logic is two-valued.
 * - **Texts:** a field, every row field these checks read being text; a text literal; and
 *   `Compute.collapse`, XML Schema's whiteSpace collapse (Part 2 §4.3.6).
 * - **Doubles:** a double literal, `Compute.parseDouble` and a cast into `double precision`, each the
 *   double the decimal text names.
 * - **Numerics:** a `Decimal` literal, `Compute.parseDecimal` and a cast into `numeric(p, s)`, each
 *   the decimal the text names exactly, a cast's form admitting no text with more than `s`
 *   significant fraction digits.
 * - **Guards:** `Compute.when` over a `Compute.matches` guard, its branch where the subject matches
 *   the guard's pattern and its otherwise elsewhere.
 */
import { Decimal } from "@bjornpagen/grizzle";
import type { Statement } from "@bjornpagen/grizzle";
import { assert } from "@effect/vitest";
import { Formatter, Option, Predicate, Schema } from "effect";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * A term of a check's predicate as grizzle keeps it in the check's description, read field by
 * field: every field the kinds this module reads have, each optional.
 */
interface StoredExpr {
  readonly arg?: StoredExpr;
  readonly args?: readonly StoredExpr[];
  readonly field?: string;
  readonly fn?: string;
  readonly guard?: { readonly kind: string; readonly pattern?: string };
  readonly kind: string;
  readonly left?: StoredExpr;
  readonly op?: string;
  readonly otherwise?: StoredExpr;
  readonly proved?: StoredExpr;
  readonly right?: StoredExpr;
  readonly subject?: StoredExpr;
  readonly to?: { readonly kind: string; readonly type?: string };
  readonly value?: unknown;
}

/**
 * The schema of a {@link StoredExpr}.
 */
const StoredExprSchema: Schema.Codec<StoredExpr> = Schema.Struct({
  arg: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredExpr> => StoredExprSchema)),
  args: Schema.optionalKey(
    Schema.Array(Schema.suspend((): Schema.Codec<StoredExpr> => StoredExprSchema)),
  ),
  field: Schema.optionalKey(Schema.String),
  fn: Schema.optionalKey(Schema.String),
  guard: Schema.optionalKey(
    Schema.Struct({ kind: Schema.String, pattern: Schema.optionalKey(Schema.String) }),
  ),
  kind: Schema.String,
  left: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredExpr> => StoredExprSchema)),
  op: Schema.optionalKey(Schema.String),
  otherwise: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredExpr> => StoredExprSchema)),
  proved: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredExpr> => StoredExprSchema)),
  right: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredExpr> => StoredExprSchema)),
  subject: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredExpr> => StoredExprSchema)),
  to: Schema.optionalKey(
    Schema.Struct({ kind: Schema.String, type: Schema.optionalKey(Schema.String) }),
  ),
  value: Schema.optionalKey(Schema.Unknown),
});

/**
 * A check statement as grizzle keeps it: its relation, and its description's name and predicate.
 */
const CheckSchema = Schema.Struct({
  desc: Schema.Struct({ name: Schema.String, predicate: StoredExprSchema }),
  kind: Schema.Literal("check"),
  relation: Schema.Struct({ name: Schema.String }),
});

/**
 * A double literal as a check's description holds it that JSON cannot write as a number: its name.
 */
const FloatNameSchema = Schema.Struct({
  float: Schema.Literals(["Infinity", "-Infinity", "NaN"]),
});

/**
 * A numeric literal as a check's description holds it: grizzle's `Decimal`, whose constructor is
 * its own, so the schema declares it by `instanceof`.
 */
const DecimalSchema = Schema.declare(
  (value: unknown): value is Decimal => value instanceof Decimal,
);

/**
 * A row as a check reads it: its text fields by name.
 */
export type CheckRow = Readonly<Record<string, string>>;

/**
 * One check, its predicate as the description holds it, over the relation it is stated on.
 */
export interface ReadCheck {
  readonly name: string;
  readonly predicate: StoredExpr;
  readonly relation: string;
}

/**
 * Read a check statement.
 *
 * @param statement - The statement.
 * @returns The check, none for a statement of another kind.
 */
export const checkOf = (statement: Statement): Option.Option<ReadCheck> =>
  Option.map(Schema.decodeUnknownOption(CheckSchema)(statement), ({ desc, relation }) => ({
    name: desc.name,
    predicate: desc.predicate,
    relation: relation.name,
  }));

/**
 * The checks `Qti` installs under some names.
 *
 * @param names - The checks' names.
 * @returns Every check of those names, one per relation it is stated on.
 */
export const installedChecks = (...names: readonly string[]): readonly ReadCheck[] =>
  Qti.statements.flatMap((statement) =>
    Option.toArray(checkOf(statement)).filter(({ name }) => names.includes(name)),
  );

/**
 * The double a decimal text names, `INF`, `+INF`, `-INF` and `NaN` by name: grizzle's
 * `Compute.parseDouble` over its operand, and PostgreSQL's `float8in` over a text a guard has held
 * to a double's form, each XML Schema 1.1's doubleLexicalMap, which `Number` computes exactly for a
 * decimal of at most 20 significant digits.
 *
 * @param text - The text.
 * @returns The double.
 */
export const doubleNamed = (text: string): number => {
  if (text === "INF" || text === "+INF") {
    return Number.POSITIVE_INFINITY;
  }

  return text === "-INF" ? Number.NEGATIVE_INFINITY : Number(text);
};

/**
 * Order two doubles as PostgreSQL's `float8` does: NaN equal to NaN and above every other value,
 * -0 equal to 0.
 *
 * @param left - The first.
 * @param right - The second.
 * @returns Below zero, zero or above zero.
 */
const float8Order = (left: number, right: number): number => {
  if (Number.isNaN(left) || Number.isNaN(right)) {
    return Number(Number.isNaN(left)) - Number(Number.isNaN(right));
  }

  return Math.sign(left - right) || 0;
};

/**
 * A numeric as PostgreSQL orders it: a finite decimal, its digits signed over ten to its scale,
 * or an infinity of a sign.
 */
type Exact =
  | { readonly digits: bigint; readonly kind: "finite"; readonly scale: number }
  | { readonly kind: "infinite"; readonly negative: boolean };

/**
 * A decimal text's parts: its sign, its integer digits and its fraction digits.
 */
const decimalParts = /^(?<sign>[+-]?)(?<whole>[0-9]*)(?:\.(?<fraction>[0-9]*))?$/u;

/**
 * The numeric a text names: `Infinity` and `-Infinity` by name, as a `Decimal` writes them, and a
 * decimal text exactly, as `numeric_in` reads every text of grizzle's `decimalText`.
 *
 * @param text - The text.
 * @returns The numeric; the test fails on a text that names none.
 */
const exactNamed = (text: string): Exact => {
  if (text === "Infinity" || text === "-Infinity") {
    return { kind: "infinite", negative: text.startsWith("-") };
  }

  const { fraction = "", sign = "", whole = "" } = decimalParts.exec(text)?.groups ?? {};
  if (whole === "" && fraction === "") {
    return assert.fail(`a numeric's text, not ${Formatter.format(text)}`);
  }

  const magnitude = BigInt(`0${whole}${fraction}`);

  return { digits: sign === "-" ? -magnitude : magnitude, kind: "finite", scale: fraction.length };
};

/**
 * Order two numerics exactly: an infinity beyond every finite value, two finite ones at their
 * common scale.
 *
 * @param left - The first.
 * @param right - The second.
 * @returns Below zero, zero or above zero.
 */
const exactOrder = (left: Exact, right: Exact): number => {
  if (left.kind === "finite" && right.kind === "finite") {
    const scale = Math.max(left.scale, right.scale);
    const [a, b] = [
      left.digits * 10n ** BigInt(scale - left.scale),
      right.digits * 10n ** BigInt(scale - right.scale),
    ];

    return Number(a > b) - Number(a < b);
  }

  const rank = (value: Exact): number => {
    if (value.kind === "finite") {
      return 0;
    }

    return value.negative ? -1 : 1;
  };

  return Math.sign(rank(left) - rank(right));
};

/**
 * The comparisons a check's description names, each over the order of its two sides.
 */
const orderComparisons: ReadonlyMap<string, (order: number) => boolean> = new Map([
  ["eq", (order: number) => order === 0],
  ["ge", (order: number) => order >= 0],
  ["gt", (order: number) => order > 0],
  ["le", (order: number) => order <= 0],
  ["lt", (order: number) => order < 0],
  ["ne", (order: number) => order !== 0],
]);

/**
 * The comparisons of two texts the orders hold, each over whether the two are one text.
 */
const textComparisons: ReadonlyMap<string, (same: boolean) => boolean> = new Map([
  ["eq", (same: boolean) => same],
  ["ne", (same: boolean) => !same],
]);

/**
 * Take a term's operand that its kind requires.
 *
 * @param operand - The operand, none where the description leaves it out.
 * @param what - What the term is, for the failure.
 * @returns The operand; the test fails where it is missing.
 */
const operandOf = (operand: StoredExpr | undefined, what: string): StoredExpr =>
  operand ?? assert.fail(`${what} without its operand`);

/**
 * Evaluate a text term over a row: a field, a text literal, or `Compute.collapse` of a text.
 *
 * @param expr - The term.
 * @param row - The row.
 * @returns Its value; the test fails on a term of any other kind.
 */
const textOf = (expr: StoredExpr, row: CheckRow): string => {
  if (expr.kind === "field") {
    return Option.getOrElse(
      Option.flatMap(Option.fromUndefinedOr(expr.field), (field) =>
        Option.fromUndefinedOr(row[field]),
      ),
      () => assert.fail(`the row holds no field ${String(expr.field)}`),
    );
  }

  if (expr.kind === "compute" && expr.fn === "collapse") {
    return textOf(operandOf(expr.args?.[0], "a collapse"), row)
      .replaceAll(/[\t\n\r ]+/gu, " ")
      .replace(/^ /u, "")
      .replace(/ $/u, "");
  }

  return Option.getOrElse(
    expr.kind === "literal" ? Schema.decodeUnknownOption(Schema.String)(expr.value) : Option.none(),
    () => assert.fail(`a text term, not ${Formatter.format(expr)}`),
  );
};

/**
 * Decide whether a text matches a pattern as PostgreSQL's `~` does over the patterns these checks
 * hold: a regular expression under `u`.
 *
 * @param pattern - The pattern.
 * @param text - The text.
 * @returns Whether it matches.
 */
const matchesPattern = (pattern: string, text: string): boolean =>
  new RegExp(pattern, "u").test(text);

/**
 * Take the branch of a `Compute.when` over a `Compute.matches` guard that a row reaches.
 *
 * @param expr - The when.
 * @param row - The row.
 * @returns Its branch where the subject matches, its otherwise elsewhere; the test fails on a guard
 *   of any other kind.
 */
const branchOf = (expr: StoredExpr, row: CheckRow): StoredExpr => {
  const { guard } = expr;
  if (guard?.kind !== "matches" || guard.pattern === undefined) {
    return assert.fail(`a when over a ${String(guard?.kind)} guard, which no check here holds`);
  }

  const held = matchesPattern(guard.pattern, textOf(operandOf(expr.subject, "a when"), row));

  return operandOf(held ? expr.proved : expr.otherwise, "a when");
};

/**
 * Evaluate a double term over a row: a double literal, a `Compute.when`, `Compute.parseDouble`, or
 * a cast of a text into `double precision`.
 *
 * @param expr - The term.
 * @param row - The row.
 * @returns Its value; the test fails on a term of any other kind.
 */
const doubleOf = (expr: StoredExpr, row: CheckRow): number => {
  switch (expr.kind) {
    case "literal": {
      return Option.getOrElse(
        Option.orElse(Schema.decodeUnknownOption(Schema.Number)(expr.value), () =>
          Option.map(Schema.decodeUnknownOption(FloatNameSchema)(expr.value), ({ float }) =>
            Number(float),
          ),
        ),
        () => assert.fail(`a double literal, not ${Formatter.format(expr.value)}`),
      );
    }
    case "when": {
      return doubleOf(branchOf(expr, row), row);
    }
    case "compute": {
      return expr.fn === "parseDouble"
        ? doubleNamed(textOf(operandOf(expr.args?.[0], "a parse"), row))
        : assert.fail(`a Compute.${String(expr.fn)}, which no check here holds`);
    }
    case "cast": {
      return expr.to?.type === "double precision"
        ? doubleNamed(textOf(operandOf(expr.arg, "a cast"), row))
        : assert.fail(`a cast into ${Formatter.format(expr.to)}, which no check here holds`);
    }
    default: {
      return assert.fail(`a ${expr.kind} term where a double stands, which no check here holds`);
    }
  }
};

/**
 * Evaluate a numeric term over a row: a `Decimal` literal, a `Compute.when`,
 * `Compute.parseDecimal`, or a cast of a text into `numeric(p, s)`.
 *
 * @param expr - The term.
 * @param row - The row.
 * @returns Its value; the test fails on a term of any other kind.
 */
const exactOf = (expr: StoredExpr, row: CheckRow): Exact => {
  switch (expr.kind) {
    case "literal": {
      return Option.getOrElse(
        Option.map(Schema.decodeUnknownOption(DecimalSchema)(expr.value), ({ text }) =>
          exactNamed(text),
        ),
        () => assert.fail(`a numeric literal, not ${Formatter.format(expr.value)}`),
      );
    }
    case "when": {
      return exactOf(branchOf(expr, row), row);
    }
    case "compute": {
      return expr.fn === "parseDecimal"
        ? exactNamed(textOf(operandOf(expr.args?.[0], "a parse"), row))
        : assert.fail(`a Compute.${String(expr.fn)}, which no check here holds`);
    }
    case "cast": {
      return expr.to?.kind === "numeric"
        ? exactNamed(textOf(operandOf(expr.arg, "a cast"), row))
        : assert.fail(`a cast into ${Formatter.format(expr.to)}, which no check here holds`);
    }
    default: {
      return assert.fail(`a ${expr.kind} term where a numeric stands, which no check here holds`);
    }
  }
};

/**
 * What a term of a comparison is: a text, a double or a numeric.
 *
 * @param expr - The term.
 * @returns Its sort; the test fails on a term of a kind no check here compares.
 */
const sortOf = (expr: StoredExpr): "double" | "numeric" | "text" => {
  switch (expr.kind) {
    case "field": {
      return "text";
    }
    case "literal": {
      if (Predicate.isString(expr.value)) {
        return "text";
      }

      return Schema.is(DecimalSchema)(expr.value) ? "numeric" : "double";
    }
    case "when": {
      return sortOf(operandOf(expr.proved, "a when"));
    }
    case "compute": {
      if (expr.fn === "collapse") {
        return "text";
      }

      return expr.fn === "parseDecimal" ? "numeric" : "double";
    }
    case "cast": {
      return expr.to?.kind === "numeric" ? "numeric" : "double";
    }
    default: {
      return assert.fail(`a ${expr.kind} term in a comparison, which no check here holds`);
    }
  }
};

/**
 * Evaluate a comparison over a row: two texts by equality, two doubles by {@link float8Order},
 * two numerics by {@link exactOrder}.
 *
 * @param expr - The comparison.
 * @param row - The row.
 * @returns Whether it holds; the test fails on a comparison no check here holds.
 */
const comparisonOf = (expr: StoredExpr, row: CheckRow): boolean => {
  const left = operandOf(expr.left, "a comparison");
  const right = operandOf(expr.right, "a comparison");
  const op = expr.op ?? assert.fail("a comparison without its operator");
  const sort = sortOf(left);
  assert.strictEqual(sortOf(right), sort, `a ${op} of a ${sort} and another sort`);
  if (sort === "text") {
    const holds = textComparisons.get(op) ?? assert.fail(`a ${op} of two texts`);

    return holds(textOf(left, row) === textOf(right, row));
  }

  const holds = orderComparisons.get(op) ?? assert.fail(`a comparison ${op}`);

  return holds(
    sort === "numeric"
      ? exactOrder(exactOf(left, row), exactOf(right, row))
      : float8Order(doubleOf(left, row), doubleOf(right, row)),
  );
};

/**
 * Evaluate a check's predicate over a row as PostgreSQL evaluates the CHECK grizzle installs for
 * it, for the kinds the order checks hold: `or`, `and`, `not`, `Compute.matches` and comparisons.
 * Every operand is evaluated, so a term of any other kind anywhere fails the test.
 *
 * @param expr - The predicate.
 * @param row - The row.
 * @returns Whether it holds.
 */
const truthOf = (expr: StoredExpr, row: CheckRow): boolean => {
  const args = (): ReadonlySet<boolean> =>
    new Set((expr.args ?? []).map((arg) => truthOf(arg, row)));
  switch (expr.kind) {
    case "or": {
      return args().has(true);
    }
    case "and": {
      return !args().has(false);
    }
    case "not": {
      return !truthOf(operandOf(expr.arg, "a not"), row);
    }
    case "compare": {
      return comparisonOf(expr, row);
    }
    case "compute": {
      return expr.fn === "matches"
        ? matchesPattern(
            textOf(operandOf(expr.args?.[1], "a match"), row),
            textOf(operandOf(expr.args?.[0], "a match"), row),
          )
        : assert.fail(`a Compute.${String(expr.fn)} where a predicate stands`);
    }
    default: {
      return assert.fail(`a ${expr.kind} term where a predicate stands, which no check here holds`);
    }
  }
};

/**
 * Whether some row of a case breaks one of a set of checks.
 *
 * @param checks - The checks.
 * @param rows - The case's rows, by relation.
 * @returns Whether one is broken.
 */
export const breaks = (
  checks: readonly ReadCheck[],
  rows: ReadonlyMap<string, readonly CheckRow[]>,
): boolean =>
  checks.some(({ predicate, relation }) =>
    (rows.get(relation) ?? []).some((row) => !truthOf(predicate, row)),
  );
