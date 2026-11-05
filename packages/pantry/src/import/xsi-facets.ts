/**
 * The constraining facets of XML Schema Part 2 as checks of a normalized value: `length`,
 * `minLength` and `maxLength`, the four bounds, `totalDigits` and `fractionDigits`, `enumeration`
 * and `pattern`, which a restriction states of the type it restricts. `restrictedJudge` adds what
 * one restriction states to the judge of its base, or leaves the type unjudged when a facet is one
 * this module does not apply to the base's value space. A pure module.
 */
import type { WhiteSpace } from "#pantry/import/whitespace.ts";
import { integerPattern } from "#pantry/import/xsi-lexical.ts";
import { compilePattern } from "#pantry/import/xsi-pattern.ts";
import { normalizeWith } from "#pantry/import/xsi-judges.ts";
import type { Family, Judge } from "#pantry/import/xsi-judges.ts";
import type { SimpleFacetRow } from "#pantry/schema/seed/xsi.ts";

/**
 * One check of a normalized value by a facet: `null` when it holds, else why not.
 */
type Check = (value: string) => string | null;

/**
 * The number of characters of a value, as XML Schema's `length` facets count them.
 */
const characters = (value: string): number => [...value.matchAll(/./gsu)].length;

/**
 * What `length`, `minLength` and `maxLength` count in a value of a family: the items of a list,
 * the octets of binary data, otherwise characters. `undefined` for a family they do not apply to.
 */
const measure = (family: Family): ((value: string) => number) | undefined => {
  if (family === "list") {
    return (value) => (value === "" ? 0 : value.split(" ").length);
  }

  if (family === "hex") {
    return (value) => value.length / 2;
  }

  if (family === "base64") {
    return (value) => {
      const digits = value.replaceAll(" ", "");
      const padding = /[=]*$/u.exec(digits)?.[0].length ?? 0;

      return (digits.length / 4) * 3 - padding;
    };
  }

  return family === "string" ? characters : undefined;
};

/**
 * The check of a `length`, `minLength` or `maxLength` facet.
 */
const lengthCheck = (
  facet: "length" | "maxLength" | "minLength",
  limit: number,
  count: (value: string) => number,
): Check => {
  if (facet === "length") {
    return (value) => (count(value) === limit ? null : `its length is not ${limit}`);
  }

  if (facet === "minLength") {
    return (value) => (count(value) >= limit ? null : `it is shorter than ${limit}`);
  }

  return (value) => (count(value) <= limit ? null : `it is longer than ${limit}`);
};

/**
 * A number of the value space of `xs:float` or `xs:double`, `xs:decimal` or `xs:integer` as a
 * JavaScript number: `INF` and `-INF` are infinite, and `NaN` is `NaN`, which no bound holds for.
 */
const numberOf = (text: string): number => {
  if (text === "INF") {
    return Number.POSITIVE_INFINITY;
  }

  return text === "-INF" ? Number.NEGATIVE_INFINITY : Number(text);
};

/**
 * The check of a bound facet, in the integer family by `BigInt` and in the others by `Number`.
 */
const boundCheck = (
  facet: "maxExclusive" | "maxInclusive" | "minExclusive" | "minInclusive",
  family: "decimal" | "float" | "integer",
  bound: string,
): Check | undefined => {
  if (family === "integer" && !integerPattern.test(bound)) {
    return undefined;
  }

  const holds = <A extends bigint | number>(value: A, limit: A): boolean => {
    if (facet === "minInclusive") {
      return value >= limit;
    }

    if (facet === "maxInclusive") {
      return value <= limit;
    }

    return facet === "minExclusive" ? value > limit : value < limit;
  };

  if (family === "integer") {
    const limit = BigInt(bound);

    return (value) => (holds(BigInt(value), limit) ? null : `it breaks ${facet} ${bound}`);
  }

  const limit = numberOf(bound);

  return (value) => (holds(numberOf(value), limit) ? null : `it breaks ${facet} ${bound}`);
};

/**
 * The significant digits of a decimal or integer lexical value: how many digits it has before and
 * after the decimal point once leading and trailing zeros are dropped.
 */
const digitsOf = (value: string) => {
  const [whole = "", part = ""] = value.replace(/^[+-]/u, "").split(".");
  const integer = whole.replace(/^0+/u, "");
  const fraction = part.replace(/0+$/u, "");

  return { fraction: fraction.length, total: Math.max(1, integer.length + fraction.length) };
};

/**
 * The check of `totalDigits` or `fractionDigits`.
 */
const digitsCheck =
  (facet: "fractionDigits" | "totalDigits", limit: number): Check =>
  (value) => {
    const digits = digitsOf(value);

    if (facet === "totalDigits") {
      return digits.total <= limit ? null : `it has more than ${limit} digits`;
    }

    return digits.fraction <= limit ? null : `it has more than ${limit} fraction digits`;
  };

/**
 * A value in the form two values of a family are compared in, or `undefined` for a family whose
 * values this module does not compare.
 */
const canonical = (family: Family, text: string): string | undefined => {
  if (family === "integer") {
    return integerPattern.test(text) ? BigInt(text).toString() : text;
  }

  if (family === "decimal") {
    const [whole = "", part = ""] = text.replace(/^[+-]/u, "").split(".");
    const integer = whole.replace(/^0+/u, "") || "0";
    const fraction = part.replace(/0+$/u, "");
    const sign = text.startsWith("-") && (integer !== "0" || fraction !== "") ? "-" : "";

    return `${sign}${integer}.${fraction}`;
  }

  if (family === "float") {
    const value = numberOf(text);

    return Number.isNaN(value) ? "NaN" : String(value === 0 ? 0 : value);
  }

  if (family === "boolean") {
    return text === "1" || text === "true" ? "true" : "false";
  }

  if (family === "hex") {
    return text.toUpperCase();
  }

  if (family === "base64") {
    return text.replaceAll(" ", "");
  }

  return family === "temporal" ? undefined : text;
};

/**
 * What the facets of one restriction add up to: checks of a normalized value, the patterns, of
 * which one must match, and the enumerated values, of which one must equal the value.
 */
interface Collected {
  readonly checks: Check[];
  readonly enumeration: string[];
  readonly patterns: RegExp[];
}

/**
 * Add one facet to what a restriction states, or return `false` when it is a facet this module does
 * not apply to the family.
 */
const addFacet = (
  into: Collected,
  { facet, value }: SimpleFacetRow,
  family: Family,
  whiteSpace: WhiteSpace,
): boolean => {
  const count = measure(family);

  if (facet === "whiteSpace") {
    return true;
  }

  if (facet === "enumeration") {
    const listed = canonical(family, normalizeWith(whiteSpace, value));

    if (listed !== undefined) {
      into.enumeration.push(listed);
    }

    return listed !== undefined;
  }

  if (facet === "pattern") {
    const pattern = compilePattern(value);

    if (pattern !== undefined) {
      into.patterns.push(pattern);
    }

    return pattern !== undefined;
  }

  if (facet === "length" || facet === "minLength" || facet === "maxLength") {
    if (count === undefined || Number.isNaN(Number(value))) {
      return false;
    }

    into.checks.push(lengthCheck(facet, Number(value), count));

    return true;
  }

  if (facet === "totalDigits" || facet === "fractionDigits") {
    if ((family !== "decimal" && family !== "integer") || Number.isNaN(Number(value))) {
      return false;
    }

    into.checks.push(digitsCheck(facet, Number(value)));

    return true;
  }

  const check =
    family === "decimal" || family === "float" || family === "integer"
      ? boundCheck(facet, family, normalizeWith(whiteSpace, value))
      : undefined;

  if (check !== undefined) {
    into.checks.push(check);
  }

  return check !== undefined;
};

/**
 * The checks that the facets one restriction states make of a normalized value of `family`, or
 * `undefined` when a facet is one this module does not apply to the family.
 */
const stepChecks = (
  rows: readonly SimpleFacetRow[],
  family: Family,
  whiteSpace: WhiteSpace,
): readonly Check[] | undefined => {
  const collected: Collected = { checks: [], enumeration: [], patterns: [] };

  if (!rows.every((row) => addFacet(collected, row, family, whiteSpace))) {
    return undefined;
  }

  const { checks, enumeration, patterns } = collected;

  if (enumeration.length > 0) {
    checks.push((value) =>
      enumeration.includes(canonical(family, value) ?? value)
        ? null
        : "it is none of the enumerated values",
    );
  }

  if (patterns.length > 0) {
    checks.push((value) =>
      patterns.some((pattern) => pattern.test(value)) ? null : "it matches no pattern",
    );
  }

  return checks;
};

/**
 * The judge of a restriction of the type `base` judges, by the facets the restriction states, or
 * `undefined` when one of them is not applied.
 */
export const restrictedJudge = (
  base: Judge,
  rows: readonly SimpleFacetRow[],
): Judge | undefined => {
  const stated = rows.find((row) => row.facet === "whiteSpace")?.value;
  const whiteSpace =
    stated === "preserve" || stated === "replace" || stated === "collapse"
      ? stated
      : base.whiteSpace;
  const checks = stepChecks(rows, base.family, whiteSpace);

  if (checks === undefined) {
    return undefined;
  }

  return {
    check: (value, context) => {
      const detail = base.check(value, context);

      if (detail !== null) {
        return detail;
      }

      for (const check of checks) {
        const found = check(value);

        if (found !== null) {
          return found;
        }
      }

      return null;
    },
    family: base.family,
    whiteSpace,
  };
};
