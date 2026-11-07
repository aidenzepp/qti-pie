/**
 * The derivation of value domains against XML Schema 1.0 Part 2: `restricted` against the facet
 * rules of section 4.3, and the built-in derived types against the specification's own schema for
 * datatypes (Appendix A), which states each one's base and facets and each primitive's applicable
 * facets.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-facets | XML Schema Part 2, 4.3 Constraining Facets}
 * @see {@link https://www.w3.org/TR/xmlschema-2/#schema | XML Schema Part 2, A Schema for Datatype Definitions (normative)}
 */
import { createHash } from "node:crypto";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import {
  boolean,
  constant,
  element,
  int,
  proportional,
  subarray,
  weighted,
} from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import {
  Array as Arr,
  Config,
  Duration,
  Effect,
  FileSystem,
  Formatter,
  Option,
  Result,
} from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { compile } from "#pantry/grammar/domains.ts";
import {
  builtinBases,
  builtinDomainOf,
  builtins,
  lengthRules,
  restricted,
} from "#pantry/vocab/derive/domains.ts";
import type { LengthRule } from "#pantry/vocab/derive/domains.ts";
import type { Domain, Facet, FacetName } from "#pantry/vocab/inventory/types.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 84.9 s at a load average of 63 to
 * 73, its slowest test.
 */
const testTimeoutMs = 180_000;

/**
 * The facets of XML Schema Part 2, 4.3, every one a restriction step may state.
 */
const facetNames = [
  "enumeration",
  "fractionDigits",
  "length",
  "maxExclusive",
  "maxInclusive",
  "maxLength",
  "minExclusive",
  "minInclusive",
  "minLength",
  "pattern",
  "totalDigits",
  "whiteSpace",
] as const satisfies readonly FacetName[];

/**
 * The two families the restriction property derives in: the built-ins derived from `string`, and
 * those derived from `decimal` by way of `integer`.
 */
type Family = "integer" | "string";

/**
 * The bases of each family a case restricts.
 */
const basesOf: Readonly<Record<Family, Arr.NonEmptyReadonlyArray<string>>> = {
  integer: [
    "integer",
    "long",
    "int",
    "short",
    "byte",
    "nonNegativeInteger",
    "positiveInteger",
    "nonPositiveInteger",
    "negativeInteger",
    "unsignedLong",
    "unsignedInt",
    "unsignedShort",
    "unsignedByte",
  ],
  string: ["string", "normalizedString", "token", "NMTOKEN", "Name", "NCName", "language"],
};

/**
 * The facets XML Schema Part 2 makes applicable to each family's primitive (4.1.5, and each
 * primitive's "Constraining facets"): `string`'s and `decimal`'s. A step draws only these; the
 * spec-gated suite below checks the table against Appendix A's `hfp:hasFacet`.
 */
const applicable: Readonly<Record<Family, ReadonlySet<FacetName>>> = {
  integer: new Set([
    "totalDigits",
    "fractionDigits",
    "pattern",
    "whiteSpace",
    "enumeration",
    "maxInclusive",
    "maxExclusive",
    "minInclusive",
    "minExclusive",
  ]),
  string: new Set(["length", "minLength", "maxLength", "pattern", "enumeration", "whiteSpace"]),
};

/**
 * The values each family's domains are judged on: collapsed forms, so every whitespace class reads
 * them as written, inside and outside each built-in's lexical space.
 */
const poolOf: Readonly<Record<Family, readonly string[]>> = {
  integer: [
    "-300",
    "-201",
    "-200",
    "-129",
    "-128",
    "-2",
    "-1",
    "-0",
    "0",
    "+0",
    "00",
    "1",
    "2",
    "007",
    "+7",
    "7",
    "42",
    "127",
    "128",
    "255",
    "256",
    "300",
    "1.0",
    "a",
    "",
  ],
  string: [
    "",
    "a",
    "b",
    "ab",
    "ba",
    "abc",
    "abcd",
    "a b",
    "é",
    "x1",
    "1a",
    "a:b",
    "_a",
    "-a",
    "en",
    "en-US",
    "e.x",
  ],
};

/**
 * The patterns a step draws, each meaning the same as an XSD regular expression and as an anchored
 * JavaScript one, so the test reads a step's patterns apart from the compiler.
 */
const patternsOf: Readonly<Record<Family, readonly string[]>> = {
  integer: ["-?[0-9]", "[0-9]{1,2}", "1.*", "[+]?[0-9]+", "-.*"],
  string: ["a.*", "[a-z]+", ".{0,2}", "b*", "[^b]*", "e.*|x.*"],
};

/**
 * The integer bounds a step draws among, where they fall inside its base's interval.
 */
const bounds = [-300n, -200n, -129n, -128n, -2n, -1n, 0n, 1n, 2n, 7n, 42n, 127n, 128n, 255n, 256n];

/**
 * The whitespace classes, from the loosest; a restriction may only move to a stricter one (4.3.6).
 */
const whiteSpaces = ["preserve", "replace", "collapse"] as const;

/**
 * Each whitespace class's place in {@link whiteSpaces}.
 */
const strictness: ReadonlyMap<string, number> = new Map(
  whiteSpaces.map((name, at) => [name, at] as const),
);

/**
 * The greatest of some integers, or `floor` when there are none or all are below it.
 *
 * @param values - The integers.
 * @param floor - The least it may be.
 * @returns The greatest.
 */
const greatestOf = (values: readonly bigint[], floor: bigint): bigint => {
  let most = floor;
  for (const value of values) {
    most = value > most ? value : most;
  }

  return most;
};

/**
 * The least of some integers, or `ceiling` when there are none or all are above it.
 *
 * @param values - The integers.
 * @param ceiling - The most it may be.
 * @returns The least.
 */
const leastOf = (values: readonly bigint[], ceiling: bigint): bigint => {
  let fewest = ceiling;
  for (const value of values) {
    fewest = value < fewest ? value : fewest;
  }

  return fewest;
};

/**
 * Pattern groups spelled as one sorted list, each group's alternatives sorted, so two domains'
 * groups compare as sets of sets.
 *
 * @param domain - The domain.
 * @returns Its groups.
 */
const groupsOf = (domain: Domain): readonly string[] =>
  domain.patterns.map((group) => [...group].toSorted().join(" | ")).toSorted();

/**
 * Facets spelled `name=value`, in string order, so two lists compare as multisets.
 *
 * @param facets - The facets.
 * @returns Their spellings.
 */
const spelledOf = (facets: readonly Facet[]): readonly string[] =>
  facets.map(({ facet, value }) => `${facet}=${value}`).toSorted();

/**
 * The values a set of facets states of one facet, in string order.
 *
 * @param facets - The facets.
 * @param name - The facet's name.
 * @returns Its values.
 */
const valuesOf = (facets: readonly Facet[], name: FacetName): readonly string[] =>
  facets.flatMap(({ facet, value }) => (facet === name ? [value] : [])).toSorted();

/**
 * The one number a set of facets states of a length or a bound, if it states it.
 *
 * @param facets - The facets.
 * @param name - The facet's name.
 * @returns Its value.
 */
const numberOf = (facets: readonly Facet[], name: FacetName): Option.Option<bigint> =>
  Option.map(Arr.head(valuesOf(facets, name)), BigInt);

/**
 * Whether a domain admits a value: its compiled pattern, read exactly, matches it. The compiler is
 * the second implementation the restriction is judged by. The domain is compiled once for every
 * value it judges: a domain over the name classes compiles to a pattern of thousands of characters,
 * and a case judges every value of a pool under each of its domains.
 *
 * @param domain - The domain.
 * @returns Whether a value, as written, is admitted, or the compiler's refusal.
 */
const admitterOf = (domain: Domain): Result.Result<(value: string) => boolean, string> =>
  Result.map(
    Result.mapError(compile(domain, "exact"), (refused) => refused.message),
    ({ pattern }) => {
      const regex = new RegExp(pattern, "u");

      return (value: string) => regex.test(value);
    },
  );

/**
 * Which values of a pool a domain admits, by {@link admitterOf}. A domain the compiler refuses must
 * be refused as empty, which a valid restriction may be, and then admits none.
 *
 * @param domain - The domain.
 * @param pool - The values.
 * @returns Whether each is admitted, in pool order.
 */
const admittedOf = (domain: Domain, pool: readonly string[]): readonly boolean[] =>
  Result.match(admitterOf(domain), {
    onFailure: (reason) => {
      assert.match(
        reason,
        /holds no value|none of whose values the context can reach/u,
        "the compiler refuses a valid restriction only as empty",
      );

      return pool.map(() => false);
    },
    onSuccess: (admits) => pool.map((value) => admits(value)),
  });

/**
 * Whether one step's facets admit a value, as section 4.3 says each facet constrains a value of
 * its base's value space: a value matches one of the step's patterns (4.3.4.3, the patterns of a
 * step are alternatives), is one of its enumeration (4.3.5), has a length within its lengths in
 * characters (4.3.1 to 4.3.3), and lies within its bounds (4.3.7 to 4.3.10).
 *
 * @param step - The step's facets.
 * @param value - The value, collapsed.
 * @returns Whether every facet the step states holds.
 */
const stepAdmits = (step: readonly Facet[], value: string): boolean => {
  const patterns = valuesOf(step, "pattern");
  const enumeration = valuesOf(step, "enumeration");
  // oxlint-disable-next-line typescript/no-misused-spread -- XML Schema counts a string's length in characters (Part 2, 4.3.1.1), its code points, which spreading the string yields.
  const length = BigInt([...value].length);
  const integer = /^[+-]?[0-9]+$/u.test(value) ? Option.some(BigInt(value)) : Option.none();
  const bound = (name: FacetName, holds: (held: bigint, stated: bigint) => boolean): boolean =>
    Option.match(numberOf(step, name), {
      onNone: () => true,
      onSome: (stated) => Option.exists(integer, (held) => holds(held, stated)),
    });

  return (
    (patterns.length === 0 ||
      patterns.some((pattern) => new RegExp(`^(?:${pattern})$`, "u").test(value))) &&
    (enumeration.length === 0 || enumeration.includes(value)) &&
    Option.match(numberOf(step, "length"), { onNone: () => true, onSome: (n) => length === n }) &&
    Option.match(numberOf(step, "minLength"), { onNone: () => true, onSome: (n) => length >= n }) &&
    Option.match(numberOf(step, "maxLength"), { onNone: () => true, onSome: (n) => length <= n }) &&
    bound("minInclusive", (held, stated) => held >= stated) &&
    bound("minExclusive", (held, stated) => held > stated) &&
    bound("maxInclusive", (held, stated) => held <= stated) &&
    bound("maxExclusive", (held, stated) => held < stated)
  );
};

/**
 * One case: a family, a built-in base of it, and one or two restriction steps, each a valid
 * restriction of what the steps before it derive.
 */
interface RestrictionCase {
  readonly base: string;
  readonly family: Family;
  readonly steps: readonly (readonly Facet[])[];
}

/**
 * The domain a case's first steps derive from its base.
 *
 * @param base - The built-in.
 * @param steps - The steps.
 * @returns The domain.
 */
const derivedOf = (base: string, steps: readonly (readonly Facet[])[]): Domain => {
  let domain = Result.getOrThrow(builtinDomainOf(base));
  for (const [at, step] of steps.entries()) {
    domain = Result.getOrThrow(restricted(domain, step, `step ${String(at + 1)} of xs:${base}`));
  }

  return domain;
};

/**
 * A draw of one of some values, or of none when there are none.
 *
 * @param values - The values.
 * @returns The generator.
 */
const oneOrNone =
  <A>(values: readonly A[]): Gen<Option.Option<A>> =>
  (source) =>
    Arr.isReadonlyArrayNonEmpty(values)
      ? source.draw(
          weighted<Option.Option<A>>([
            [1, () => Option.none()],
            [2, (inner) => Option.some(inner.draw(element(values)))],
          ]),
        )
      : Option.none();

/**
 * Draw a string step that is a valid restriction of `domain` (4.3.1.4 to 4.3.3.4, 4.3.5.4,
 * 4.3.6.4): lengths only where it states none, or narrowing those it states, with the least at
 * most the most; patterns; an enumeration of values it admits; and a stricter whitespace class.
 *
 * @param domain - The domain the step restricts.
 * @returns The generator of the step's facets.
 */
const stringStep =
  (domain: Domain): Gen<readonly Facet[]> =>
  (source) => {
    const facets: Facet[] = [];
    const exact = numberOf(domain.facets, "length");
    const least = Option.getOrElse(numberOf(domain.facets, "minLength"), () => 0n);
    const most = Option.getOrElse(numberOf(domain.facets, "maxLength"), () => 4n);
    if (Option.isNone(exact)) {
      const lengths = Arr.makeBy(5, BigInt).filter((n) => n >= least && n <= most);
      const unstated =
        Option.isNone(numberOf(domain.facets, "minLength")) &&
        Option.isNone(numberOf(domain.facets, "maxLength"));
      const length = unstated ? source.draw(oneOrNone(lengths)) : Option.none();
      if (Option.isSome(length)) {
        facets.push({ facet: "length", value: String(length.value) });
      } else {
        const min = source.draw(oneOrNone(lengths));
        const floor = Option.getOrElse(min, () => least);
        const max = source.draw(oneOrNone(lengths.filter((n) => n >= floor)));
        facets.push(
          ...Option.toArray(min).map((n): Facet => ({ facet: "minLength", value: String(n) })),
          ...Option.toArray(max).map((n): Facet => ({ facet: "maxLength", value: String(n) })),
        );
      }
    }

    const held = Option.getOrElse(
      Arr.head(valuesOf(domain.facets, "whiteSpace")),
      () => "preserve",
    );
    const stricter = whiteSpaces.slice((strictness.get(held) ?? 0) + 1);
    const admitted = Result.match(admitterOf(domain), {
      onFailure: () => [],
      onSuccess: (admits) => poolOf.string.filter((value) => admits(value)),
    });

    return [
      ...facets,
      ...source
        .draw(subarray(patternsOf.string))
        .map((value): Facet => ({ facet: "pattern", value })),
      ...source.draw(subarray(admitted)).map((value): Facet => ({ facet: "enumeration", value })),
      ...Option.toArray(source.draw(oneOrNone(stricter))).map((value): Facet => ({
        facet: "whiteSpace",
        value,
      })),
    ];
  };

/**
 * Draw an integer step that is a valid restriction of `domain` (4.3.7.4 to 4.3.10.4): a lower
 * bound and an upper bound inside its interval, the lower at most the upper, each of the kind,
 * inclusive or exclusive, the domain already states, since a datatype states at most one of each
 * pair; and patterns.
 *
 * @param domain - The domain the step restricts.
 * @returns The generator of the step's facets.
 */
const integerStep =
  (domain: Domain): Gen<readonly Facet[]> =>
  (source) => {
    const { facets } = domain;
    const lows = [
      ...Option.toArray(numberOf(facets, "minInclusive")),
      ...Option.toArray(Option.map(numberOf(facets, "minExclusive"), (n) => n + 1n)),
    ];
    const highs = [
      ...Option.toArray(numberOf(facets, "maxInclusive")),
      ...Option.toArray(Option.map(numberOf(facets, "maxExclusive"), (n) => n - 1n)),
    ];
    const lo = greatestOf(lows, -1000n);
    const hi = leastOf(highs, 1000n);
    const kindOf = (inclusive: FacetName, exclusive: FacetName): readonly FacetName[] => {
      if (valuesOf(facets, inclusive).length > 0) {
        return [inclusive];
      }

      return valuesOf(facets, exclusive).length > 0 ? [exclusive] : [inclusive, exclusive];
    };
    const boundOf = (
      kinds: readonly FacetName[],
      fits: (kind: FacetName, value: bigint) => boolean,
    ): Option.Option<Facet> => {
      const kind = source.draw(oneOrNone(kinds));
      if (Option.isNone(kind)) {
        return Option.none();
      }

      const value = source.draw(oneOrNone(bounds.filter((n) => fits(kind.value, n))));

      return Option.isNone(value)
        ? Option.none()
        : Option.some({ facet: kind.value, value: String(value.value) });
    };
    const low = boundOf(
      kindOf("minInclusive", "minExclusive"),
      (kind, n) => n >= lo && (kind === "minInclusive" ? n <= hi : n < hi),
    );
    const floor = Option.match(low, {
      onNone: () => lo,
      onSome: ({ facet, value }) => BigInt(value) + (facet === "minInclusive" ? 0n : 1n),
    });
    const high = boundOf(
      kindOf("maxInclusive", "maxExclusive"),
      (kind, n) => n <= hi && (kind === "maxInclusive" ? n >= floor : n > floor),
    );

    return [
      ...Option.toArray(low),
      ...Option.toArray(high),
      ...source
        .draw(subarray(patternsOf.integer))
        .map((value): Facet => ({ facet: "pattern", value })),
    ];
  };

/**
 * A restriction case, built step by step, each step drawn against what the steps before it derive.
 */
const restrictionCase: Gen<RestrictionCase> = (source) => {
  const family = source.draw(element(["string", "integer"] as const));
  const base = source.draw(element(basesOf[family]));
  const steps: (readonly Facet[])[] = [];
  for (let count = source.draw(int(1, 2)); count > 0; count -= 1) {
    const domain = derivedOf(base, steps);
    steps.push(source.draw(family === "string" ? stringStep(domain) : integerStep(domain)));
  }

  return { base, family, steps };
};

/**
 * The situations a restriction search must reach: each facet a step states in each family, a second
 * step, and a step that narrows the value space, one that leaves it, and one that empties it.
 */
type Situation = `${Family} ${FacetName}` | "two steps" | "narrowed" | "unchanged" | "emptied";

describe("vocab/derive/domains.ts, restriction by facets", () => {
  it.effect(
    "derives each step's facets as section 4.3 says and narrows the value space by exactly them",
    (ctx) =>
      // Oracle: the specification as a checker, XML Schema Part 2 section 4.3: a step's patterns
      // are one more set of alternatives every value must match (4.3.4.3), its enumeration replaces
      // its base's (4.3.5), and each other facet it states replaces its base's of the same name;
      // and a second implementation, the domain compiler (`#pantry/grammar/domains.ts`), which
      // must admit exactly the values the base admits and the step's facets, read by `stepAdmits`
      // apart from both, admit.
      // Bound: the drawn cases, one or two valid steps over the 7 string and 13 integer built-ins,
      // judged on 17 string and 25 integer values.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(1),
            concurrency: 1,
            coverage: required<Situation>(
              [
                "string length",
                "string minLength",
                "string maxLength",
                "string pattern",
                "string enumeration",
                "string whiteSpace",
                "integer minInclusive",
                "integer minExclusive",
                "integer maxInclusive",
                "integer maxExclusive",
                "integer pattern",
                "two steps",
                "narrowed",
                "unchanged",
                "emptied",
              ],
              { cases: 300, sense: notesOnly },
            ),
            draw: drawn(restrictionCase),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML Schema Part 2 section 4.3's facet rules, each step's read apart from the deriver (stepAdmits)",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "vocab/domains-restricted",
          },
          ({ base, family, steps }, c) =>
            Effect.sync(() => {
              if (steps.length > 1) {
                c.note("two steps");
              }

              for (const [at, step] of steps.entries()) {
                const before = derivedOf(base, steps.slice(0, at));
                const after = Result.getOrThrow(restricted(before, step, `the step of xs:${base}`));
                const stated = new Set(step.map(({ facet }) => facet));
                for (const name of stated) {
                  c.note(`${family} ${name}`);
                  assert.isTrue(applicable[family].has(name), `${name} is not applicable`);
                }

                for (const name of facetNames.filter((held) => held !== "pattern")) {
                  assert.deepStrictEqual(
                    valuesOf(after.facets, name),
                    valuesOf(stated.has(name) ? step : before.facets, name),
                    `${name} after ${Formatter.format(step)}`,
                  );
                }

                const patterns = valuesOf(step, "pattern");
                assert.deepStrictEqual(
                  groupsOf(after),
                  [
                    ...groupsOf(before),
                    ...(patterns.length === 0 ? [] : [patterns.join(" | ")]),
                  ].toSorted(),
                );
                assert.deepStrictEqual(
                  { ...after, facets: [], patterns: [] },
                  { ...before, facets: [], patterns: [] },
                );

                const pool = poolOf[family];
                const was = admittedOf(before, pool);
                const expected = pool.map(
                  (value, index) => (was[index] ?? false) && stepAdmits(step, value),
                );
                const now = admittedOf(after, pool);

                assert.deepStrictEqual(
                  pool.filter((_, index) => now[index] === true),
                  pool.filter((_, index) => expected[index] === true),
                  `${base} restricted by ${Formatter.format(step)}`,
                );
                if (expected.includes(true)) {
                  c.note(
                    expected.some((admitted, index) => admitted !== was[index])
                      ? "narrowed"
                      : "unchanged",
                  );
                } else {
                  c.note("emptied");
                }
              }
            }),
        ),
      ),
    testTimeoutMs,
  );
});

/**
 * A length facet of XML Schema Part 2, 4.3.1 to 4.3.3.
 */
type LengthName = "length" | "maxLength" | "minLength";

/**
 * The length facets, in the order a step states them.
 */
const lengthNames = ["length", "minLength", "maxLength"] as const satisfies readonly LengthName[];

/**
 * The spellings a length facet's value draws among, each with the count it names when it is an
 * `xs:nonNegativeInteger` literal (Part 2, 3.3.20, collapsed; `+` before any digits and `-` only
 * before zero, spec reading 73), and none when it is no such literal.
 */
const spellings: readonly (readonly [string, Option.Option<bigint>])[] = [
  ["0", Option.some(0n)],
  ["1", Option.some(1n)],
  ["2", Option.some(2n)],
  ["3", Option.some(3n)],
  ["4", Option.some(4n)],
  ["+2", Option.some(2n)],
  [" 3 ", Option.some(3n)],
  ["02", Option.some(2n)],
  ["-0", Option.some(0n)],
  ["-1", Option.none()],
  ["x", Option.none()],
  ["1.5", Option.none()],
  ["", Option.none()],
];

/**
 * The spellings that name no count.
 */
const nonCounts = ["-1", "x", "1.5", ""] as const;

/**
 * The count a spelling names, by {@link spellings}.
 *
 * @param value - The spelling.
 * @returns Its count, or none for a spelling that is no count.
 */
const countOf = (value: string): Option.Option<bigint> =>
  Option.flatMap(
    Arr.findFirst(spellings, ([text]) => text === value),
    ([, count]) => count,
  );

/**
 * Draw a spelling of a count among the literals {@link spellings} gives it.
 *
 * @param count - The count, 0 to 4.
 * @returns The generator of its spelling.
 */
const spellingOf = (count: bigint): Gen<string> => {
  const forms = spellings.flatMap(([text, held]) => (Option.contains(held, count) ? [text] : []));

  return Arr.isReadonlyArrayNonEmpty(forms) ? element(forms) : () => String(count);
};

/**
 * The bases a length chain restricts: three atomic string built-ins, which state no length, and
 * the three built-in lists, which state `minLength` 1.
 */
const lengthBases = ["string", "token", "NCName", "NMTOKENS", "IDREFS", "ENTITIES"] as const;

/**
 * A base a length chain restricts.
 */
type LengthBase = (typeof lengthBases)[number];

/**
 * Whether a base is a list type, whose length counts its items.
 *
 * @param base - The base.
 * @returns Whether it is one of the three built-in lists.
 */
const isListBase = (base: LengthBase): boolean =>
  base === "NMTOKENS" || base === "IDREFS" || base === "ENTITIES";

/**
 * The length facets one type of a chain has in its {facets}, each the facet as the step that stated
 * it spelled it: the oracle's model of a type, apart from the deriver's `Domain`.
 */
type TypeLengths = Readonly<Partial<Record<LengthName, Facet>>>;

/**
 * The length facets each base states, as XML Schema Part 2 defines it (3.3.4, 3.3.10 and 3.3.12
 * give each built-in list `minLength` 1), apart from the deriver's table.
 *
 * @param base - The base.
 * @returns Its lengths.
 */
const baseLengthsOf = (base: LengthBase): TypeLengths =>
  isListBase(base) ? { minLength: { facet: "minLength", value: "1" } } : {};

/**
 * A length facet of a type and the count it names.
 *
 * @param held - The type's lengths.
 * @param name - The facet.
 * @returns The facet and its count, none where the type does not state it.
 */
const lengthIn = (
  held: TypeLengths,
  name: LengthName,
): Option.Option<{ readonly count: bigint; readonly facet: Facet }> =>
  Option.flatMap(Option.fromNullishOr(held[name]), (facet) =>
    Option.map(countOf(facet.value), (count) => ({ count, facet })),
  );

/**
 * A type's lengths after a step the rules admit: the step's, and its base's where it states none.
 *
 * @param base - The base's lengths.
 * @param step - The step's facets.
 * @returns The derived type's lengths.
 */
const lengthsAfter = (base: TypeLengths, step: readonly Facet[]): TypeLengths => {
  const derived: Partial<Record<LengthName, Facet>> = { ...base };
  for (const facet of step) {
    if (facet.facet === "length" || facet.facet === "minLength" || facet.facet === "maxLength") {
      derived[facet.facet] = facet;
    }
  }

  return derived;
};

/**
 * One rule a step breaks, as the oracle reads it: the rule's name, and the facets that break it,
 * each spelled `name=value`, as a set.
 */
interface Broken {
  readonly facets: ReadonlySet<string>;
  readonly rule: LengthRule;
}

/**
 * Spell a facet `name=value`.
 *
 * @param facet - The facet.
 * @returns Its spelling.
 */
const facetText = (facet: Facet): string => `${facet.facet}=${facet.value}`;

/**
 * Name a rule and the facets that break it.
 *
 * @param rule - The rule.
 * @param facets - The facets.
 * @returns The broken rule.
 */
const brokenOf = (rule: LengthRule, ...facets: readonly Facet[]): Broken => ({
  facets: new Set(facets.map(facetText)),
  rule,
});

/**
 * Every length rule of XML Schema 1.0 Part 2 the last step of a chain breaks, each read as the
 * Recommendation states it, over the whole chain of types: 4.1.3 (Single Facet Value), the facets'
 * `nonNegativeInteger` values (4.3.1.2, 4.3.2.2, 4.3.3.2), and the schema component constraints of
 * 4.3.1.4, 4.3.2.4 and 4.3.3.4. Clauses 1.2 and 2.2 of "length and minLength or maxLength" are read
 * as written: some type of the chain states the same `minLength` (`maxLength`) and no `length`.
 *
 * @param chain - The lengths of each type the step's type derives from, its base built-in first.
 * @param step - The step's facets.
 * @returns The rules it breaks, none for a valid restriction.
 */
const brokenBy = (chain: readonly TypeLengths[], step: readonly Facet[]): readonly Broken[] => {
  const stated = step.filter(
    ({ facet }) => facet === "length" || facet === "minLength" || facet === "maxLength",
  );
  const surface = [
    ...lengthNames.flatMap((name) => {
      const repeated = stated.filter(({ facet }) => facet === name);

      return repeated.flatMap((first, at) =>
        repeated.slice(at + 1).map((second) => brokenOf("Single Facet Value", first, second)),
      );
    }),
    ...stated
      .filter(({ value }) => Option.isNone(countOf(value)))
      .map((facet) => brokenOf("value is a nonNegativeInteger", facet)),
  ];
  if (surface.length > 0) {
    return surface;
  }

  const base = chain.at(-1) ?? {};
  const own = lengthsAfter({}, step);
  const derived = lengthsAfter(base, step);
  const broken: Broken[] = [];
  for (const [name, rule, breaks] of [
    ["length", "length valid restriction", (now: bigint, was: bigint) => now !== was],
    ["minLength", "minLength valid restriction", (now: bigint, was: bigint) => now < was],
    ["maxLength", "maxLength valid restriction", (now: bigint, was: bigint) => now > was],
  ] as const) {
    const now = lengthIn(own, name);
    const was = lengthIn(base, name);
    if (Option.isSome(now) && Option.isSome(was) && breaks(now.value.count, was.value.count)) {
      broken.push(brokenOf(rule, now.value.facet, was.value.facet));
    }
  }

  const min = lengthIn(derived, "minLength");
  const max = lengthIn(derived, "maxLength");
  if (Option.isSome(min) && Option.isSome(max) && min.value.count > max.value.count) {
    broken.push(brokenOf("minLength <= maxLength", min.value.facet, max.value.facet));
  }

  const exact = lengthIn(derived, "length");
  for (const [bound, holds] of [
    [min, (least: bigint, length: bigint) => least <= length],
    [max, (most: bigint, length: bigint) => length <= most],
  ] as const) {
    if (Option.isSome(exact) && Option.isSome(bound)) {
      const name = bound.value.facet.facet === "minLength" ? "minLength" : "maxLength";
      const ancestor = chain.some(
        (type) =>
          type.length === undefined &&
          Option.exists(lengthIn(type, name), ({ count }) => count === bound.value.count),
      );
      if (!(holds(bound.value.count, exact.value.count) && ancestor)) {
        broken.push(
          brokenOf("length and minLength or maxLength", exact.value.facet, bound.value.facet),
        );
      }
    }
  }

  return broken;
};

/**
 * The named variants a chain's step is drawn as (doctrine rule 6): a valid restriction, or one way
 * to break a length rule, each built against the lengths the steps before it derive. The oracle,
 * not the variant, decides what a step breaks.
 */
type LengthVariant =
  | "lengthBeside"
  | "lengthChanged"
  | "maxRaised"
  | "minAboveMax"
  | "minLowered"
  | "notCount"
  | "twice"
  | "valid";

/**
 * State a length facet.
 *
 * @param facet - Its name.
 * @param value - Its spelling.
 * @returns The facet.
 */
const lengthFacet = (facet: LengthName, value: string): Facet => ({ facet, value });

/**
 * The counts from `lo` to `hi`, both included.
 *
 * @param lo - The least.
 * @param hi - The most.
 * @returns The counts, none when `lo` passes `hi`.
 */
const countsFrom = (lo: bigint, hi: bigint): readonly bigint[] =>
  [0n, 1n, 2n, 3n, 4n].filter((count) => count >= lo && count <= hi);

/**
 * Draw one of some counts, the first where the draw is the simplest.
 *
 * @param counts - The counts, at least one.
 * @returns The generator.
 */
const oneCount = (counts: Arr.NonEmptyReadonlyArray<bigint>): Gen<bigint> => element(counts);

/**
 * Draw a step of a variant against the lengths its base type states.
 *
 * @param base - The base type's lengths.
 * @param variant - The variant.
 * @returns The generator of the step's facets.
 */
const lengthStep =
  (base: TypeLengths, variant: LengthVariant): Gen<readonly Facet[]> =>
  (source) => {
    const least = Option.map(lengthIn(base, "minLength"), ({ count }) => count);
    const most = Option.map(lengthIn(base, "maxLength"), ({ count }) => count);
    const exact = Option.map(lengthIn(base, "length"), ({ count }) => count);
    const lo = Option.getOrElse(least, () => 0n);
    const hi = Option.getOrElse(most, () => 4n);
    const say = (name: LengthName, count: bigint) =>
      lengthFacet(name, source.draw(spellingOf(count)));
    const some = (counts: readonly bigint[], fallback: bigint) =>
      Arr.isReadonlyArrayNonEmpty(counts) ? source.draw(oneCount(counts)) : fallback;
    const restated = () => [
      ...Option.toArray(least).flatMap((count) =>
        source.draw(boolean) ? [say("minLength", count)] : [],
      ),
      ...Option.toArray(most).flatMap((count) =>
        source.draw(boolean) ? [say("maxLength", count)] : [],
      ),
    ];
    switch (variant) {
      case "valid": {
        if (Option.isSome(exact)) {
          return [...(source.draw(boolean) ? [say("length", exact.value)] : []), ...restated()];
        }

        const span = countsFrom(lo, hi);

        return source.draw(
          weighted<readonly Facet[]>([
            [1, () => []],
            [2, () => [say("length", some(span, lo)), ...restated()]],
            [
              3,
              () => {
                const min = source.draw(boolean) ? Option.some(some(span, lo)) : Option.none();
                const max = source.draw(boolean)
                  ? Option.some(
                      some(
                        countsFrom(
                          Option.getOrElse(min, () => lo),
                          hi,
                        ),
                        hi,
                      ),
                    )
                  : Option.none();

                return [
                  ...Option.toArray(min).map((count) => say("minLength", count)),
                  ...Option.toArray(max).map((count) => say("maxLength", count)),
                ];
              },
            ],
          ]),
        );
      }
      case "twice": {
        const name = source.draw(element(lengthNames));

        return [say(name, some(countsFrom(0n, 4n), 0n)), say(name, some(countsFrom(0n, 4n), 0n))];
      }
      case "notCount": {
        return [lengthFacet(source.draw(element(lengthNames)), source.draw(element(nonCounts)))];
      }
      case "lengthChanged": {
        const held = Option.getOrElse(exact, () => 0n);

        return [
          say(
            "length",
            some(
              countsFrom(0n, 4n).filter((count) => count !== held),
              4n,
            ),
          ),
        ];
      }
      case "minLowered": {
        return [say("minLength", some(countsFrom(0n, lo - 1n), 0n))];
      }
      case "maxRaised": {
        return [say("maxLength", some(countsFrom(hi + 1n, 4n), 4n))];
      }
      case "minAboveMax": {
        return source.draw(
          weighted<readonly Facet[]>([
            [
              2,
              () => {
                const min = some(countsFrom(1n, 4n), 1n);

                return [
                  say("minLength", min),
                  say("maxLength", some(countsFrom(0n, min - 1n), 0n)),
                ];
              },
            ],
            [1, () => [say("maxLength", some(countsFrom(0n, lo - 1n), 0n))]],
            [1, () => [say("minLength", some(countsFrom(hi + 1n, 4n), 4n))]],
          ]),
        );
      }
      case "lengthBeside": {
        return source.draw(
          weighted<readonly Facet[]>([
            [
              2,
              () => {
                const length = some(countsFrom(0n, 4n), 0n);

                return [
                  say("length", length),
                  say(
                    "minLength",
                    some(
                      countsFrom(0n, length).filter((n) => !Option.contains(least, n)),
                      0n,
                    ),
                  ),
                ];
              },
            ],
            [
              2,
              () => {
                const length = some(countsFrom(0n, 4n), 0n);

                return [
                  say("length", length),
                  say(
                    "maxLength",
                    some(
                      countsFrom(length, 4n).filter((n) => !Option.contains(most, n)),
                      4n,
                    ),
                  ),
                ];
              },
            ],
            [1, () => [say("length", some(countsFrom(0n, lo - 1n), 0n))]],
            [1, () => [say("length", some(countsFrom(hi + 1n, 4n), 4n))]],
          ]),
        );
      }
      default: {
        return variant satisfies never;
      }
    }
  };

/**
 * A length chain: a base built-in and one to three restriction steps, each drawn as a variant
 * against what the steps before it derive; a chain ends at its first step drawn to break a rule.
 */
interface LengthChain {
  readonly base: LengthBase;
  readonly steps: readonly (readonly Facet[])[];
}

/**
 * Draw a length chain. A variant is drawn only where the base it restricts gives it something to
 * break: a changed `length` needs a `length`, a lowered `minLength` a `minLength` above 0, and a
 * raised `maxLength` a `maxLength` below 4.
 */
const lengthChain: Gen<LengthChain> = (source) => {
  const base = source.draw(element(lengthBases));
  const steps: (readonly Facet[])[] = [];
  let lengths = baseLengthsOf(base);
  for (let count = source.draw(int(1, 3)); count > 0; count -= 1) {
    const least = Option.map(lengthIn(lengths, "minLength"), ({ count: held }) => held);
    const most = Option.map(lengthIn(lengths, "maxLength"), ({ count: held }) => held);
    const variant = source.draw(
      proportional<LengthVariant>([
        [6, constant("valid")],
        [1, constant("twice")],
        [1, constant("notCount")],
        [Option.isSome(lengthIn(lengths, "length")) ? 2 : 0, constant("lengthChanged")],
        [Option.exists(least, (held) => held > 0n) ? 2 : 0, constant("minLowered")],
        [Option.exists(most, (held) => held < 4n) ? 2 : 0, constant("maxRaised")],
        [2, constant("minAboveMax")],
        [2, constant("lengthBeside")],
      ]),
    );
    const step = source.draw(lengthStep(lengths, variant));
    steps.push(step);
    if (variant !== "valid") {
      break;
    }

    lengths = lengthsAfter(lengths, step);
  }

  return { base, steps };
};

/**
 * The situations a length search must reach: each rule refused, a chain accepted, one accepted
 * with `length` beside an inherited `minLength` (clause 1.2's allowance), a list base, and a chain
 * of three steps.
 */
type LengthSituation =
  | `refused: ${LengthRule}`
  | "accepted"
  | "length beside an inherited minLength"
  | "list"
  | "three steps";

describe("vocab/derive/domains.ts, length facets", () => {
  it.effect(
    "refuses exactly the restriction steps whose length facets break a rule of XML Schema Part 2, naming the type, the rule and the facets, and compiles every chain it accepts to exactly its lengths",
    (ctx) =>
      // Oracle: the specification as a checker, XML Schema 1.0 Part 2's rules on length facets
      // (`brokenBy`), read over the whole chain of types as the Recommendation words them, where
      // the deriver reads only a step and its base; and, for an accepted chain, the lengths the
      // chain's facets admit, each facet read on its own (4.3.1.3 to 4.3.3.3), against the
      // compiled pattern. A refusal must name the step's type and one rule the step breaks, with
      // exactly its facets.
      // Bound: the drawn chains, one to three steps over 3 atomic and 3 list built-ins, every
      // count 0 to 4 in 9 spellings and 4 spellings that are no count, judged on values of 0 to 5
      // characters or items.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(1),
            concurrency: 1,
            coverage: required<LengthSituation>(
              [
                "accepted",
                "length beside an inherited minLength",
                "list",
                "three steps",
                ...lengthRules.map((rule): LengthSituation => `refused: ${rule}`),
              ],
              { cases: 400, sense: notesOnly },
            ),
            draw: drawn(lengthChain),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML Schema 1.0 Part 2's length-facet rules over the whole chain (brokenBy), and each facet read on its own",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "vocab/domains-lengths",
          },
          ({ base, steps }, c) =>
            Effect.sync(() => {
              if (isListBase(base)) {
                c.note("list");
              }

              if (steps.length === 3) {
                c.note("three steps");
              }

              let domain = Result.getOrThrow(builtinDomainOf(base));
              const chain: TypeLengths[] = [baseLengthsOf(base)];
              for (const [at, step] of steps.entries()) {
                const type = `T${String(at + 1)}`;
                const result = restricted(domain, step, type);
                const broken = brokenBy(chain, step);
                if (Result.isFailure(result)) {
                  const { facets, rule } = result.failure;
                  const reported = new Set(facets.map(facetText));
                  assert.isAbove(
                    broken.length,
                    0,
                    `${type} is valid, and refused: ${result.failure.message}`,
                  );
                  assert.strictEqual(result.failure.type, type);
                  assert.isTrue(
                    broken.some(
                      (held) =>
                        held.rule === rule && held.facets.symmetricDifference(reported).size === 0,
                    ),
                    `${type} refused under ${rule} for ${[...reported].join(", ")}; it breaks ${Formatter.format(broken.map((held) => [held.rule, [...held.facets]]))}`,
                  );
                  c.note(`refused: ${rule}`);

                  return;
                }

                assert.deepStrictEqual(
                  broken.map((held) => [held.rule, [...held.facets]]),
                  [],
                  `${type} breaks these, and was accepted`,
                );
                chain.push(lengthsAfter(chain.at(-1) ?? {}, step));
                domain = result.success;
              }

              c.note("accepted");

              const derived = chain.at(-1) ?? {};
              const count = (name: LengthName) =>
                Option.map(lengthIn(derived, name), ({ count: held }) => held);
              if (Option.isSome(count("length")) && Option.isSome(count("minLength"))) {
                c.note("length beside an inherited minLength");
              }

              const within =
                (name: LengthName, bound: (n: bigint, held: bigint) => boolean) => (n: bigint) =>
                  Option.match(count(name), {
                    onNone: () => true,
                    onSome: (held) => bound(n, held),
                  });
              const holds = (n: bigint) =>
                within("length", (size, held) => size === held)(n) &&
                within("minLength", (size, held) => size >= held)(n) &&
                within("maxLength", (size, held) => size <= held)(n) &&
                (base !== "NCName" || n > 0n);
              const sizes = [0n, 1n, 2n, 3n, 4n, 5n];
              // The compiler refuses a definition it can tell holds no value, and may write a
              // pattern no value matches for one it cannot.
              const compiled = compile(domain, "exact");
              if (Result.isFailure(compiled)) {
                assert.isTrue(
                  compiled.failure.detail.includes("holds no value") && !sizes.some(holds),
                  `${base} restricted by ${Formatter.format(steps)}: ${compiled.failure.message}`,
                );

                return;
              }

              const regex = new RegExp(Result.getOrThrow(compiled).pattern, "u");
              for (const n of sizes) {
                const value = isListBase(base)
                  ? Array.from({ length: Number(n) }, () => "a").join(" ")
                  : "a".repeat(Number(n));
                assert.strictEqual(
                  regex.test(value),
                  holds(n),
                  `${base} restricted by ${Formatter.format(steps)} on ${JSON.stringify(value)}`,
                );
              }
            }),
        ),
      ),
    testTimeoutMs,
  );
});

/**
 * The text rendering of XML Schema 1.0 Part 2, Second Edition, cached once in
 * `~/.cache/gr8des/anyuri-specs/`: the file Appendix A is read from.
 *
 * @see {@link https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/ | XML Schema Part 2, Second Edition}
 */
const specFile = "anyuri-specs/xsd10-2.txt";

/**
 * The SHA-256 of {@link specFile} as it was read when this suite was written.
 */
const specSha256 = "6f6119251e62bb162e228e5f8c57c0ca3d7dc0449b9f58d66c451d3b1dbfd66b";

/**
 * The cached specification's text, or `None` when the cache does not hold it.
 */
const specText = await Effect.runPromise(
  Effect.gen(function* readSpec() {
    const home = yield* Config.NonEmptyString("HOME");
    const fs = yield* FileSystem.FileSystem;
    const file = `${home}/.cache/gr8des/${specFile}`;

    return (yield* fs.exists(file)) ? Option.some(yield* fs.readFileString(file)) : Option.none();
  }).pipe(Effect.provide(NodeServices.layer)),
);

/**
 * The child elements of an element.
 *
 * @param node - The element.
 * @returns Its element children.
 */
const childrenOf = (node: Element): readonly Element[] =>
  node.children.flatMap((child) => (child.kind === "element" ? [child] : []));

/**
 * An attribute in no namespace.
 *
 * @param node - The element.
 * @param name - The attribute's local name.
 * @returns Its value.
 */
const attributeOf = (node: Element, name: string): Option.Option<string> =>
  Option.map(
    Arr.findFirst(node.attributes, (held) => held.namespace === "" && held.local === name),
    ({ value }) => value,
  );

/**
 * One built-in datatype as Appendix A states it: its base's local name, its facets, the item type
 * of the list a list type restricts, and the facets it has (`hfp:hasFacet`).
 */
interface Stated {
  readonly base: string;
  readonly facets: readonly string[];
  readonly hasFacet: readonly string[];
  readonly item: Option.Option<string>;
  readonly name: string;
}

/**
 * Read Appendix A's built-in datatypes: each top-level `xs:simpleType` with an `id`, which the
 * schema gives every datatype it defines and none of its own helper types.
 *
 * @param schema - The appendix's `xs:schema`.
 * @returns Each datatype, in document order.
 */
const statedOf = (schema: Element): readonly Stated[] =>
  childrenOf(schema)
    .filter((node) => node.local === "simpleType" && Option.isSome(attributeOf(node, "id")))
    .map((node) => {
      const annotation = childrenOf(node).filter(({ local }) => local === "annotation");
      const step = childrenOf(node).find(({ local }) => local === "restriction");
      const listed = childrenOf(step ?? node)
        .filter(({ local }) => local === "simpleType")
        .flatMap(childrenOf)
        .find(({ local }) => local === "list");

      return {
        base: Option.getOrElse(
          Option.map(
            Option.flatMap(Option.fromNullishOr(step), (held) => attributeOf(held, "base")),
            (base) => base.replace(/^xs:/u, ""),
          ),
          () => "anySimpleType",
        ),
        facets: childrenOf(step ?? node)
          .filter(({ local }) => local !== "annotation" && local !== "simpleType")
          .map(
            (facet) => `${facet.local}=${Option.getOrElse(attributeOf(facet, "value"), () => "")}`,
          )
          .toSorted(),
        hasFacet: annotation
          .flatMap(childrenOf)
          .filter(({ local }) => local === "appinfo")
          .flatMap(childrenOf)
          .filter(({ local }) => local === "hasFacet")
          .flatMap((facet) => Option.toArray(attributeOf(facet, "name")))
          .toSorted(),
        item: Option.map(
          Option.flatMap(Option.fromNullishOr(listed), (list) => attributeOf(list, "itemType")),
          (item) => item.replace(/^xs:/u, ""),
        ),
        name: Option.getOrElse(attributeOf(node, "name"), () => ""),
      };
    });

describe.skipIf(Option.isNone(specText))(
  "vocab/derive/domains.ts, the built-in datatypes against XML Schema Part 2, Appendix A",
  () => {
    const text = Option.getOrElse(specText, () => "");
    const start = text.indexOf("<xs:schema xmlns:hfp");
    const closing = "</xs:schema>";
    const appendix = text.slice(start, text.indexOf(closing, start) + closing.length);
    const read = Effect.map(readXml(new TextEncoder().encode(appendix)), ({ root }) =>
      statedOf(root),
    );

    it("reads the pinned rendering of the specification", () => {
      assert.strictEqual(createHash("sha256").update(text).digest("hex"), specSha256);
    });

    it.effect(
      "derives every built-in datatype from the base and by the facets Appendix A states",
      () =>
        // Oracle: the specification as a checker, its normative schema for datatypes, read with
        // crust apart from the deriver's tables.
        Effect.gen(function* derivations() {
          const stated = yield* read;
          const names = stated.map(({ name }) => name);

          assert.deepStrictEqual(
            [...builtinBases.keys()].toSorted(),
            [...names, "anySimpleType", "anyType"].toSorted(),
          );

          for (const { base, facets, item, name } of stated) {
            assert.deepStrictEqual(
              builtinBases.get(name),
              Option.some(Option.isSome(item) ? "anySimpleType" : base),
              `${name}'s base`,
            );

            if (base === "anySimpleType" && Option.isNone(item)) {
              const domain = Result.getOrThrow(builtinDomainOf(name));
              assert.deepStrictEqual(
                domain._tag === "atomic" ? [domain.primitive, spelledOf(domain.facets)] : [],
                [name, facets],
                `${name}, a primitive`,
              );
            } else {
              const builtin = builtins.get(name);
              assert.deepStrictEqual(
                builtin === undefined
                  ? []
                  : [
                      builtin._tag === "list" ? Option.some(builtin.item) : Option.none(),
                      builtin._tag === "list" ? "anySimpleType" : builtin.base,
                      spelledOf(builtin.facets),
                    ],
                [item, base, facets],
                `${name}, a derived built-in`,
              );
            }
          }
        }).pipe(Effect.orDie),
    );

    it.effect(
      "states on each built-in only facets its primitive has, and draws the restriction property's steps from them",
      () =>
        // Oracle: the specification as a checker, Appendix A's `hfp:hasFacet` for each primitive
        // and each built-in list type.
        Effect.gen(function* applicability() {
          const stated = yield* read;
          const hasFacet = new Map(stated.map(({ hasFacet: has, name }) => [name, has]));
          const primitiveOf = (name: string): string => {
            const base = builtinBases.get(name) ?? Option.none();

            return Option.match(base, {
              onNone: () => name,
              onSome: (held) => (held === "anySimpleType" ? name : primitiveOf(held)),
            });
          };

          for (const [name, builtin] of builtins) {
            const has = hasFacet.get(primitiveOf(name)) ?? [];
            for (const { facet } of builtin.facets) {
              assert.include(
                has,
                facet,
                `${name} states ${facet}, which ${primitiveOf(name)} lacks`,
              );
            }
          }

          assert.deepStrictEqual(
            [...applicable.string].toSorted(),
            hasFacet.get("string"),
            "the string family's facets",
          );
          assert.deepStrictEqual(
            [...applicable.integer].toSorted(),
            hasFacet.get("decimal"),
            "the integer family's facets, decimal's",
          );
        }).pipe(Effect.orDie),
    );
  },
);
