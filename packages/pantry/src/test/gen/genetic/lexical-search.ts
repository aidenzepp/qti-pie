/**
 * The genetic search over lexical forms: a value of one probe site, bred by edits that aim at the
 * places lexical spaces differ in practice, judged by the grammar's domain against libxml2's XML
 * Schema validator through `#pantry/test/lexical-harness.ts`, the box's own harness.
 *
 * A genome is a site, one (kind, attribute) or simple-content kind's text that the pinned XSDs
 * declare and a probe element can stand for, and a value. A site is judged in every version whose
 * grammar holds its row, so a value valid in one version and not the other (Stale) is a feature of
 * its own. The seeds are, per site, the first values its domain accepts among the XSD type's
 * enumeration, samples drawn from the domain's own pattern and the boundary forms of its datatype
 * families: values built from each domain's facet grammar, never filtered from noise.
 *
 * The edits (`lexicalOperators`), each on code points so a value stays XML characters:
 *
 * - `insert`, `delete`, `replace`: one character of the dictionary (digits, signs, the exponent and
 *   date marks, hex letters, URI punctuation, markup, XML whitespace and the Wild spaces NBSP,
 *   U+2028 and U+3000, an astral and an accented letter);
 * - `sign`: add, flip or drop a sign, at the start or after an exponent mark;
 * - `exponent`: add an exponent, change its digits to an edge (309, -324, none) or flip its case;
 * - `case`: flip the case of the value or of one letter;
 * - `pad`: a whitespace character of one class at the head, the tail or inside;
 * - `digits`: lengthen a digit run across the edges of a double's precision, of 64 bits and of
 *   libxml2's 24 digits, or write leading zeros;
 * - `live`: a boundary value of the site's families, of its enumeration, or of the edge list;
 * - `calendar`: one field of a date set to an edge: a century year, year 0000 or -0001, month 00 or
 *   13, day 00, 29, 30, 31 or 32, a timezone of ±14:00, ±14:01 or -00:00;
 * - `splice`: a prefix of the value and a suffix of the mate's (crossover);
 * - `transplant`: the mate's value at this site, a value of one domain judged by another;
 * - `regroup`: the value at another site of the same domain, another XSD type.
 *
 * Features (perception), at the grain of domain × edge class × version: `edge` for each edge class
 * the value holds (`edgeClassesOf`), `space` for each whitespace class at each position, `verdict`
 * for each pair of the two verdicts, and `stale` where the versions' verdicts differ. Each family's
 * Good–Turing residual is the search's stopping measure.
 */
import { swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import type { Source } from "@grizzle/testing/source";
import { Console, Deferred, Effect, Option } from "effect";
import type { ValueDomain } from "#pantry/grammar/attributes.ts";
import { enumerationKept } from "#pantry/grammar/domains.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { below, oneOf } from "#pantry/test/gen/genetic/engine.ts";
import type { Edited, Judgment, Problem } from "#pantry/test/gen/genetic/engine.ts";
import {
  accepts,
  disagreementOf,
  formOf,
  drawnOf,
  enumerationsOf,
  familiesOf,
  familyTable,
  judgeProbes,
  recordOf,
  subjectName,
  whiteSpaceOf,
} from "#pantry/test/lexical-harness.ts";
import type {
  Disagreement,
  Judged,
  ProbedSite,
  Probe,
  Sites,
} from "#pantry/test/lexical-harness.ts";
import type { XsdOracle } from "#pantry/test/xsd-catalog.ts";

/**
 * A generator on the choice stream.
 */
type Gen<A> = (source: Source) => A;

/**
 * The edits a run's swarm weighs.
 */
export const lexicalOperators = [
  "insert",
  "delete",
  "replace",
  "sign",
  "exponent",
  "case",
  "pad",
  "digits",
  "live",
  "calendar",
  "splice",
  "transplant",
  "regroup",
] as const;

/**
 * One edit.
 */
export type LexicalOperator = (typeof lexicalOperators)[number];

/**
 * One probe site: a (kind, attribute) or simple-content kind's text, keyed `kind subject`, with
 * its row in each version whose grammar holds it, and the values its `live` edit draws from.
 */
export interface Site {
  readonly at: ReadonlyMap<SchemaVersion, ProbedSite>;
  readonly dictionary: readonly string[];
  readonly key: string;
}

/**
 * A genome: a site, by its index among the search's sites, and a value.
 */
export interface LexicalGenome {
  readonly site: number;
  readonly value: string;
}

/**
 * A feature: its family, then what it names, `|`-separated.
 */
export type LexicalFeature = `${"edge" | "space" | "stale" | "verdict"}|${string}`;

/**
 * A disagreement no record classifies, with the edge classes of its value.
 */
export interface Finding {
  readonly disagreement: Disagreement;
  readonly edges: readonly string[];
}

/**
 * The XML whitespace characters and the Wild spaces, by the class a feature names them by.
 */
const spaceClasses: readonly (readonly [name: string, character: string])[] = [
  ["space", " "],
  ["tab", "\t"],
  ["lf", "\n"],
  ["cr", "\r"],
  ["nbsp", "\u00A0"],
  ["ls", "\u2028"],
  ["ideographic", "\u3000"],
];

/**
 * The single characters the character edits draw: every one an XML character, so a value stays
 * writable.
 */
const characters: readonly string[] = [
  ..."0123456789".split(""),
  ..."+-.eE".split(""),
  ..."INFaTZPYMDHS".split(""),
  ..."abcdefABCDEF".split(""),
  ..."xX:_/#?%[]@".split(""),
  ..."&<>\"'".split(""),
  ...spaceClasses.map(([, character]) => character),
  "é",
  "𝄞",
];

/**
 * The boundary values the `live` edit draws beside a site's own: the special doubles in every case
 * and sign, the zeros, the precision, 32-bit and 64-bit edges, hexadecimal in both cases, the
 * calendar's edges, the durations' and the booleans'.
 */
const edgeValues: readonly string[] = [
  "INF",
  "-INF",
  "+INF",
  "NaN",
  "-NaN",
  "nan",
  "inf",
  "Infinity",
  "-0",
  "+0",
  "00",
  "-0.0",
  "0e0",
  "1e309",
  "-1e309",
  "4.9e-324",
  "2.2250738585072014e-308",
  "1.7976931348623157e308",
  "1.7976931348623159e308",
  "9007199254740993",
  "2147483647",
  "2147483648",
  "-2147483648",
  "-2147483649",
  "9223372036854775807",
  "9223372036854775808",
  "-9223372036854775809",
  "18446744073709551615",
  "18446744073709551616",
  "0x1F",
  "1f",
  "ff",
  "FF",
  "aB",
  "1900-02-29",
  "2000-02-29",
  "2004-02-29",
  "2023-02-29",
  "2024-02-30",
  "2024-04-31",
  "2024-13-01",
  "2024-00-10",
  "2024-01-00",
  "0000-01-01",
  "-0001-01-01",
  "10000-01-01",
  "2024-01-01+14:00",
  "2024-01-01+14:01",
  "2024-01-01-14:00",
  "2024-01-01Z",
  "2024-01-01T24:00:00",
  "2024-01-01T23:59:60",
  "P",
  "PT",
  "-P1D",
  "P1DT",
  "PT1.5S",
  "true",
  "TRUE",
  "True",
];

/**
 * The longest value an edit leaves: beyond the 1,024-byte edges the domains and keys know, short
 * enough that a batch of thousands stays small.
 */
const longest = 1200;

/**
 * Read an `xs:date`-like prefix: its sign, year, month and day.
 */
const datePrefix = /^(?<sign>-?)(?<year>\d{4,})-(?<month>\d\d)-(?<day>\d\d)/u;

/**
 * A value's code points: the units every edit cuts at, so no edit splits a surrogate pair.
 *
 * @param value - The value.
 * @returns Its code points, in order.
 */
const pointsOf = (value: string): string[] => value.match(/[\s\S]/gu) ?? [];

/**
 * The first name of a list whose test holds, in order.
 *
 * @param named - Each name with its test.
 * @returns The name, none where no test holds.
 */
const firstOf = (named: readonly (readonly [name: string, holds: boolean])[]): readonly string[] =>
  named.flatMap(([name, holds]) => (holds ? [name] : [])).slice(0, 1);

/**
 * Whether a year is a leap year of the proleptic Gregorian calendar XML Schema reads.
 *
 * @param year - The year.
 * @returns Whether it is.
 */
const isLeap = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * The months of 30 days.
 */
const shortMonths: ReadonlySet<number> = new Set([4, 6, 9, 11]);

/**
 * The edge classes of a date's year, month and day.
 *
 * @param groups - The date prefix's fields.
 * @returns The classes.
 */
const calendarClasses = (
  groups: Readonly<Record<string, string | undefined>>,
): readonly string[] => {
  const yearText = groups["year"] ?? "";
  const negative = groups["sign"] === "-";
  const year = Number(yearText) * (negative ? -1 : 1);
  const month = Number(groups["month"]);
  const day = Number(groups["day"]);

  return [
    "date",
    ...firstOf([
      ["year-0000", yearText === "0000"],
      ["year-negative", negative],
      ["year-padded", yearText.length > 4 && yearText.startsWith("0")],
      ["year-five-digits", yearText.length > 4],
    ]),
    ...firstOf([
      ["month-00", month === 0],
      ["month-13+", month > 12],
    ]),
    ...firstOf([
      ["day-00", day === 0],
      ["day-32+", day > 31],
      ["feb-29-400", month === 2 && day === 29 && year % 400 === 0],
      ["feb-29-leap", month === 2 && day === 29 && isLeap(year)],
      ["feb-29-century", month === 2 && day === 29 && year % 100 === 0],
      ["feb-29-common", month === 2 && day === 29],
      ["feb-30+", month === 2 && day > 29],
      ["day-31-short-month", shortMonths.has(month) && day === 31],
    ]),
  ];
};

/**
 * The edge classes of a date-time's time and of a timezone at a value's end.
 *
 * @param core - The value without its outer whitespace.
 * @returns The classes.
 */
const clockClasses = (core: string): readonly string[] => {
  const time = /T(?<hour>\d\d):(?<minute>\d\d):(?<second>\d\d)(?<fraction>\.\d*)?/u.exec(
    core,
  )?.groups;
  const zone = /(?:Z|(?<sign>[+-])(?<hours>\d\d):(?<minutes>\d\d))$/u.exec(core);
  const hours = Number(zone?.groups?.["hours"] ?? 0);
  const minutes = Number(zone?.groups?.["minutes"] ?? 0);

  return [
    ...(time === undefined
      ? []
      : [
          ...firstOf([["hour-24", time["hour"] === "24"]]),
          ...firstOf([["minute-60+", Number(time["minute"]) > 59]]),
          ...firstOf([["second-60+", Number(time["second"]) > 59]]),
          ...firstOf([["second-fraction", time["fraction"] !== undefined]]),
        ]),
    ...(zone === null
      ? []
      : firstOf([
          ["tz-Z", zone[0] === "Z"],
          ["tz-beyond-14", hours * 60 + minutes > 14 * 60 || minutes > 59],
          ["tz-14", hours === 14],
          ["tz-negative-zero", zone[0] === "-00:00"],
          ["tz", true],
        ])),
  ];
};

/**
 * The digit-count classes, each its largest count: the edges of one digit, of a double's 15 to 17
 * significant digits, of 64 bits' 19 and of libxml2's 24.
 */
const digitBins: readonly (readonly [most: number, name: string])[] = [
  [1, "1"],
  [9, "2-9"],
  [15, "10-15"],
  [17, "16-17"],
  [19, "18-19"],
  [24, "20-24"],
];

/**
 * The integer ranges whose edges a count, an `xs:int` and an `xs:unsignedLong` meet.
 */
const integerRanges: readonly (readonly [name: string, lo: bigint, hi: bigint])[] = [
  ["int32", -2_147_483_648n, 2_147_483_647n],
  ["int64", -9_223_372_036_854_775_808n, 9_223_372_036_854_775_807n],
  ["uint64", 0n, 18_446_744_073_709_551_615n],
];

/**
 * The edge classes of an integer numeral against {@link integerRanges}.
 *
 * @param negative - Whether it is signed `-`.
 * @param digits - Its digits.
 * @returns The classes.
 */
const rangeClasses = (negative: boolean, digits: string): readonly string[] => {
  const integer = BigInt(`${negative ? "-" : ""}${digits}`);

  return integerRanges.flatMap(([name, lo, hi]) =>
    firstOf([
      [`${name}-edge`, integer === lo || integer === hi],
      [`${name}-beyond`, integer === lo - 1n || integer === hi + 1n],
    ]),
  );
};

/**
 * The edge classes of a numeric value: its zero, leading zeros, decimal point, exponent, digit
 * count and the edges of the binary64, 32-bit and 64-bit ranges.
 *
 * @param core - The value without its outer whitespace.
 * @returns The classes, none for a value that is no decimal numeral.
 */
const numberClasses = (core: string): readonly string[] => {
  const numeral =
    /^(?<sign>[+-]?)(?<mantissa>\d+\.?\d*|\.\d+)(?:(?<mark>[eE])(?<exponent>[+-]?\d*))?$/u.exec(
      core,
    )?.groups;
  if (numeral === undefined) {
    return [];
  }

  const { exponent, mantissa = "", mark, sign = "" } = numeral;
  const digits = mantissa.replaceAll(".", "").length;
  const number = Number(core);
  const tiny =
    Number.isFinite(number) && number !== 0 && Math.abs(number) < 2.2250738585072014e-308;

  return [
    "numeral",
    ...firstOf([
      ["zero", /^0*\.?0*$/u.test(mantissa) && sign === ""],
      ["zero-plus", /^0*\.?0*$/u.test(mantissa) && sign === "+"],
      ["zero-minus", /^0*\.?0*$/u.test(mantissa)],
    ]),
    ...firstOf([["leading-zeros", /^0\d/u.test(mantissa)]]),
    ...firstOf([
      ["leading-point", mantissa.startsWith(".")],
      ["trailing-point", mantissa.endsWith(".")],
      ["fraction", mantissa.includes(".")],
    ]),
    ...firstOf([
      ["exponent-e", mark === "e"],
      ["exponent-E", mark === "E"],
    ]),
    ...firstOf([
      ["exponent-bare", mark !== undefined && !/\d/u.test(exponent ?? "")],
      ["exponent-plus", (exponent ?? "").startsWith("+")],
    ]),
    `digits-${digitBins.find(([most]) => digits <= most)?.[1] ?? "25+"}`,
    ...firstOf([
      ["double-overflow", !Number.isFinite(number)],
      ["double-underflow", tiny && Math.abs(number) < 4.9e-324],
      ["double-subnormal", tiny],
    ]),
    ...(mark === undefined && !mantissa.includes(".") ? rangeClasses(sign === "-", mantissa) : []),
  ];
};

/**
 * The edge classes of a value's spelling beside its number and its date: the special doubles, hex,
 * durations, booleans, markup, percent-escapes, a scheme or a prefix, and its characters.
 *
 * @param value - The value as written.
 * @param core - The value without its outer whitespace.
 * @returns The classes.
 */
const spellingClasses = (value: string, core: string): readonly string[] => {
  const special = /^(?<sign>[+-]?)(?<word>INF|NaN|Infinity|inf|nan|Inf|NAN)$/u.exec(core)?.groups;
  const hex = /^[0-9a-fA-F]+$/u.test(core) && /[a-fA-F]/u.test(core);
  const lower = /[a-f]/u.test(core);
  const upper = /[A-F]/u.test(core);
  const points = pointsOf(value);

  return [
    ...(special === undefined ? [] : [`special-${special["sign"] ?? ""}${special["word"] ?? ""}`]),
    ...firstOf([["hex-prefix", /^[+-]?0[xX]/u.test(core)]]),
    ...firstOf([
      ["hex-mixed", hex && lower && upper],
      ["hex-lower", hex && lower],
      ["hex-upper", hex],
    ]),
    ...firstOf([["hex-odd", hex && core.length % 2 === 1]]),
    ...firstOf([
      ["duration-bare", /^-?PT?$/u.test(core)],
      ["duration-empty-time", /^-?P/u.test(core) && core.endsWith("T")],
      ["duration", /^-?P/u.test(core)],
    ]),
    ...firstOf([["boolean-case", /^(?:TRUE|True|FALSE|False|yes|no)$/u.test(core)]]),
    ...firstOf([["markup", /[&<>"']/u.test(value)]]),
    ...firstOf([
      ["percent-bad", /%(?![0-9A-Fa-f]{2})/u.test(value)],
      ["percent", value.includes("%")],
    ]),
    ...firstOf([["hash-twice", /#.*#/u.test(value)]]),
    ...firstOf([["scheme-or-prefix", /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(core)]]),
    ...firstOf([
      ["astral", points.some((point) => (point.codePointAt(0) ?? 0) > 0xff_ff)],
      [
        "non-ascii",
        points.some(
          (point) =>
            (point.codePointAt(0) ?? 0) > 0x7f &&
            !spaceClasses.some(([, character]) => character === point),
        ),
      ],
    ]),
    ...firstOf([["double-space", core.includes("  ")]]),
    ...firstOf([["long", value.length > 1024]]),
  ];
};

/**
 * The edge classes of a value under a domain: where its form sits among the lexical spaces'
 * boundaries, by shape alone, never by how an edit made it.
 *
 * @param value - The value as written.
 * @param domain - The domain it is judged under, whose enumeration a case variant is read against.
 * @returns The classes, each once.
 */
export const edgeClassesOf = (value: string, domain: ValueDomain): readonly string[] => {
  const core = value.replaceAll(/^[\t\n\r ]+|[\t\n\r ]+$/gu, "");
  if (core === "") {
    return [value === "" ? "empty" : "blank"];
  }

  const date = datePrefix.exec(core)?.groups;
  const enumeration = enumerationKept(domain.definition, domain.pattern);

  return [
    ...new Set([
      ...numberClasses(core),
      ...(date === undefined ? [] : [...calendarClasses(date), ...clockClasses(core)]),
      ...spellingClasses(value, core),
      ...(enumeration.length === 0
        ? []
        : firstOf([
            ["enumeration", enumeration.includes(value)],
            ["enumeration-padded", enumeration.includes(core)],
            [
              "enumeration-case",
              enumeration.some((held) => held.toLowerCase() === core.toLowerCase()),
            ],
          ])),
    ]),
  ].toSorted();
};

/**
 * Name a position among a value's code points.
 *
 * @param at - The position.
 * @param length - How many code points the value holds.
 * @returns `head`, `tail` or `inner`.
 */
const placeOf = (at: number, length: number): string => {
  if (at === 0) {
    return "head";
  }

  return at === length - 1 ? "tail" : "inner";
};

/**
 * The whitespace classes of a value at each position: `class@head`, `class@tail` and
 * `class@inner`.
 *
 * @param value - The value.
 * @returns The classes, each once.
 */
export const spaceClassesOf = (value: string): readonly string[] => {
  const points = pointsOf(value);
  const found = new Set<string>();
  for (const [at, point] of points.entries()) {
    const named = spaceClasses.find(([, character]) => character === point)?.[0];
    if (named !== undefined) {
      found.add(`${named}@${placeOf(at, points.length)}`);
    }
  }

  return [...found].toSorted();
};

/**
 * What a search reads beside the genome: its sites, the run's swarm, the oracle and the folder its
 * batches go to.
 */
export interface LexicalBreeding {
  readonly directory: string;
  readonly oracle: XsdOracle;
  readonly sites: readonly Site[];
  readonly swarm: Swarm<LexicalOperator>;
}

/**
 * Collect the search's sites: one per (kind, subject) that some version's groups take as their
 * representative, with its row in every version that holds it.
 *
 * @param sites - The harness's sites.
 * @returns The sites, in the groups' order.
 */
export const searchSitesOf = (sites: Sites): readonly Site[] => {
  const keys: string[] = [];
  for (const groups of sites.groups.values()) {
    for (const { kind, subject } of groups.values()) {
      const key = `${kind} ${subjectName(subject)}`;
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
  }

  return keys.map((key) => {
    const at = new Map<SchemaVersion, ProbedSite>();
    for (const [version, rows] of sites.rows) {
      const row = rows.get(key);
      if (row !== undefined) {
        at.set(version, row);
      }
    }

    const dictionary = [...at.values()].flatMap(({ domain, xsd }) => [
      ...enumerationKept(domain.definition, domain.pattern),
      ...Option.match(xsd, { onNone: () => [], onSome: enumerationsOf }),
      ...drawnOf(domain),
      ...familiesOf(domain, xsd).flatMap((name) => familyTable.get(name) ?? []),
    ]);

    return { at, dictionary: [...new Set(dictionary)], key };
  });
};

/**
 * The cases a run always starts from, each a disagreement the search once found, so it never
 * regresses unseen: SSML `token`'s `role`, a list of `xs:QName`, holding `a:b` with no binding of
 * `a`, which the codec once accepted (XML Schema 1.0 Part 2, §3.2.18; GEN-B, 2026-11-07). Each is
 * judged in both versions.
 */
const keptSeeds: readonly { readonly key: string; readonly value: string }[] = [
  { key: "ssml:token role", value: "a:b" },
];

/**
 * How many seeds each site starts with.
 */
const seedsPerSite = 6;

/**
 * The seed population: per site, values of its dictionary (the enumeration, the pattern's samples,
 * then the families' boundary forms) of {@link seedsPerSite} different forms, those its domain
 * accepts first, so every arm of a domain's grammar its samples met is seeded, and a value the
 * grammar refuses stands beside the valid ones; then the {@link keptSeeds}.
 *
 * @param sites - The search's sites.
 * @returns The seeds.
 */
export const seedsOf = (sites: readonly Site[]): readonly LexicalGenome[] => [
  ...sites.flatMap((site, index) => {
    const domains = [...site.at.values()].map(({ domain }) => domain);
    const usable = site.dictionary.filter((value) => value !== "" && value.length <= longest);
    const accepted = usable.filter((value) => domains.some((domain) => accepts(domain, value)));
    const forms = new Map<string, string>();
    for (const value of [...accepted, ...usable]) {
      if (forms.size < seedsPerSite && !forms.has(formOf(value))) {
        forms.set(formOf(value), value);
      }
    }

    return [...forms.values()].map((value) => ({ site: index, value }));
  }),
  ...keptSeeds.flatMap(({ key, value }) => {
    const site = sites.findIndex((held) => held.key === key);

    return site === -1 ? [] : [{ site, value }];
  }),
];

/**
 * Rebuild a value from its code points with one stretch replaced.
 *
 * @param points - The value's code points.
 * @param at - Where the stretch starts.
 * @param length - How many code points it holds.
 * @param put - What replaces it.
 * @returns The value.
 */
const spliced = (points: readonly string[], at: number, length: number, put: string): string =>
  [...points.slice(0, at), put, ...points.slice(at + length)].join("");

/**
 * Flip the case of every letter of a value, or lower it where it has no lower-case letter.
 *
 * @param value - The value.
 * @returns The flipped value.
 */
const flippedCase = (value: string): string =>
  value === value.toUpperCase() ? value.toLowerCase() : value.toUpperCase();

/**
 * The date fields the `calendar` edit sets, each with its edge values: a century year, a leap and a
 * common one, year 0000, -0001 and a five-digit one; month 00 and 13; day 00 and the month ends;
 * a timezone of ±14:00, +14:01 and -00:00, or none.
 */
const calendarFields = [
  { name: "year", values: ["1900", "2000", "2004", "2023", "0000", "-0001", "10000", "02024"] },
  { name: "month", values: ["00", "01", "02", "04", "12", "13"] },
  { name: "day", values: ["00", "28", "29", "30", "31", "32"] },
  { name: "zone", values: ["", "Z", "+14:00", "+14:01", "-14:00", "-00:00", "+05:30"] },
] as const;

/**
 * One edit of a value, on the choice stream: none where the drawn edit has no site in it.
 */
type ValueEdit = (value: string, mate: string, site: Site) => Gen<Option.Option<string>>;

/**
 * The value edits, by operator; the genome edits (`transplant`, `regroup`) are written in
 * {@link lexicalMutation}.
 */
const valueEdits: Readonly<Record<Exclude<LexicalOperator, "regroup" | "transplant">, ValueEdit>> =
  {
    calendar: (value) => (source) => {
      const groups = datePrefix.exec(value)?.groups;
      if (groups === undefined) {
        return Option.none();
      }

      const field = source.draw(oneOf(calendarFields)) ?? calendarFields[0];
      const fields = { ...groups, [field.name]: source.draw(oneOf(field.values)) ?? "" };
      const head = `${groups["sign"] ?? ""}${groups["year"] ?? ""}-${groups["month"] ?? ""}-${groups["day"] ?? ""}`;
      const rest = value.slice(head.length).replace(/(?:Z|[+-]\d\d:\d\d)$/u, "");
      const zone =
        field.name === "zone"
          ? (fields["zone"] ?? "")
          : (/(?:Z|[+-]\d\d:\d\d)$/u.exec(value.slice(head.length))?.[0] ?? "");

      return Option.some(
        `${field.name === "year" ? "" : (fields["sign"] ?? "")}${fields["year"] ?? ""}-${fields["month"] ?? ""}-${fields["day"] ?? ""}${rest}${zone}`,
      );
    },
    case: (value) => (source) => {
      const points = pointsOf(value);
      const letters = points.flatMap((point, at) =>
        point.toLowerCase() === point.toUpperCase() ? [] : [at],
      );
      if (letters.length === 0) {
        return Option.none();
      }

      if (source.draw(below(2)) === 0) {
        return Option.some(flippedCase(value));
      }

      const at = letters[source.draw(below(letters.length))] ?? 0;

      return Option.some(spliced(points, at, 1, flippedCase(points[at] ?? "")));
    },
    delete: (value) => (source) => {
      const points = pointsOf(value);
      if (points.length === 0) {
        return Option.none();
      }

      const at = source.draw(below(points.length));

      return Option.some(
        spliced(points, at, 1 + source.draw(below(Math.min(3, points.length - at))), ""),
      );
    },
    digits: (value) => (source) => {
      const points = pointsOf(value);
      const runs = [...value.matchAll(/\d+/gu)];
      if (runs.length === 0) {
        return Option.none();
      }

      const run = runs[source.draw(below(runs.length))];
      const start = pointsOf(value.slice(0, run?.index ?? 0)).length;
      const digits = run?.[0] ?? "";
      if (source.draw(below(3)) === 0) {
        return Option.some(spliced(points, start, 0, "0".repeat(1 + source.draw(below(3)))));
      }

      const target = source.draw(oneOf([2, 10, 16, 17, 18, 19, 20, 24, 25, 40])) ?? 17;
      const digit = source.draw(oneOf(["9", "0", "1", "5"])) ?? "9";

      return target <= digits.length
        ? Option.none()
        : Option.some(
            spliced(
              points,
              start,
              digits.length,
              `${digits}${digit.repeat(target - digits.length)}`,
            ),
          );
    },
    exponent: (value) => (source) => {
      const mark = /[eE]/u.exec(value);
      if (mark === null) {
        const exponent = source.draw(oneOf(["", "0", "1", "309", "-324", "+5", "-0"])) ?? "1";
        const letter = source.draw(oneOf(["e", "E"])) ?? "e";

        return Option.some(`${value}${letter}${exponent}`);
      }

      const head = value.slice(0, mark.index);
      switch (source.draw(below(3))) {
        case 0: {
          return Option.some(`${head}${mark[0] === "e" ? "E" : "e"}${value.slice(mark.index + 1)}`);
        }
        case 1: {
          return Option.some(head);
        }
        default: {
          return Option.some(
            `${head}${mark[0]}${source.draw(oneOf(["", "309", "-324", "+0", "-", "+"])) ?? ""}`,
          );
        }
      }
    },
    insert: (value) => (source) => {
      const points = pointsOf(value);

      return Option.some(
        spliced(
          points,
          source.draw(below(points.length + 1)),
          0,
          source.draw(oneOf(characters)) ?? "0",
        ),
      );
    },
    live: (_value, _mate, site) => (source) => {
      const pool = source.draw(below(3)) === 0 ? edgeValues : site.dictionary;

      return Option.fromUndefinedOr(source.draw(oneOf(pool)));
    },
    pad: (value) => (source) => {
      const points = pointsOf(value);
      const character = source.draw(oneOf(spaceClasses.map(([, held]) => held))) ?? " ";
      const at =
        [0, points.length, source.draw(below(points.length + 1))][source.draw(below(3))] ?? 0;

      return Option.some(spliced(points, at, 0, character));
    },
    replace: (value) => (source) => {
      const points = pointsOf(value);
      if (points.length === 0) {
        return Option.none();
      }

      return Option.some(
        spliced(
          points,
          source.draw(below(points.length)),
          1,
          source.draw(oneOf(characters)) ?? "0",
        ),
      );
    },
    sign: (value) => (source) => {
      const mark = /[eE]/u.exec(value);
      const at = mark !== null && source.draw(below(2)) === 1 ? mark.index + 1 : 0;
      const held = value[at];
      const rest = held === "+" || held === "-" ? value.slice(at + 1) : value.slice(at);
      const sign = source.draw(oneOf(["", "+", "-"].filter((option) => option !== held))) ?? "";

      return Option.some(`${value.slice(0, at)}${sign}${rest}`);
    },
    splice: (value, mate) => (source) => {
      const points = pointsOf(value);
      const mates = pointsOf(mate);

      return Option.some(
        `${points.slice(0, source.draw(below(points.length + 1))).join("")}${mates.slice(source.draw(below(mates.length + 1))).join("")}`,
      );
    },
  };

/**
 * Apply one edit to a genome: a value edit to its value, `transplant` the mate's value, `regroup`
 * another site of one of its domains.
 *
 * @param operator - The edit.
 * @param genome - The genome.
 * @param mate - The mate.
 * @param site - The genome's site.
 * @param sitesByDomain - The sites of each domain.
 * @returns The edited genome, none where the edit has no site in it.
 */
const editedGenome =
  (
    operator: LexicalOperator,
    genome: LexicalGenome,
    mate: LexicalGenome,
    site: Site,
    sitesByDomain: ReadonlyMap<string, readonly number[]>,
  ): Gen<Option.Option<LexicalGenome>> =>
  (source) => {
    if (operator === "transplant") {
      return mate.value === genome.value
        ? Option.none()
        : Option.some({ ...genome, value: mate.value });
    }

    if (operator === "regroup") {
      const others = [...site.at.values()]
        .flatMap(({ domain }) => sitesByDomain.get(domain.handle) ?? [])
        .filter((index) => index !== genome.site);
      const other = source.draw(oneOf(others));

      return other === undefined ? Option.none() : Option.some({ ...genome, site: other });
    }

    return Option.map(
      source.draw(valueEdits[operator](genome.value, mate.value, site)),
      (value) => ({
        ...genome,
        value,
      }),
    );
  };

/**
 * How many times an edit is drawn before a candidate is given up as having no edit that fits.
 */
const attempts = 4;

/**
 * The search's mutation: an edit its swarm draws, on the value or on the genome.
 *
 * @param breeding - The breeding context.
 * @param sitesByDomain - The sites of each domain, for `regroup`.
 * @returns The mutation the engine draws.
 */
const lexicalMutation =
  (breeding: LexicalBreeding, sitesByDomain: ReadonlyMap<string, readonly number[]>) =>
  (genome: LexicalGenome, mate: LexicalGenome): Gen<Option.Option<Edited<LexicalGenome>>> =>
  (source) => {
    const site = breeding.sites[genome.site];
    if (site === undefined) {
      return Option.none();
    }

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const operator = source.draw(swarmChoice(breeding.swarm, lexicalOperators));
      const edited = editedGenome(operator, genome, mate, site, sitesByDomain)(source);
      if (
        Option.isSome(edited) &&
        edited.value.value.length <= longest &&
        (edited.value.value !== genome.value || edited.value.site !== genome.site)
      ) {
        return Option.some({ genome: edited.value, note: operator });
      }
    }

    return Option.none();
  };

/**
 * The probes a genome stands for: one per version whose grammar holds its site, on the site's first
 * target.
 *
 * @param sites - The search's sites.
 * @param genome - The genome.
 * @returns The probes.
 */
export const probesOfGenome = (sites: readonly Site[], genome: LexicalGenome): readonly Probe[] =>
  [...(sites[genome.site]?.at ?? new Map<SchemaVersion, ProbedSite>())].flatMap(([version, row]) =>
    row.targets.slice(0, 1).map((target) => ({
      domain: row.domain,
      group: sites[genome.site]?.key ?? "",
      kind: row.kind,
      subject: row.subject,
      target,
      value: genome.value,
      variant: "genetic",
      version,
      whiteSpace: whiteSpaceOf(row.xsd),
      xsd: row.xsd,
    })),
  );

/**
 * Judge probes in their versions, each version's in one `xmllint` process, the versions at once.
 *
 * @param breeding - The breeding context.
 * @param name - A name for the call's batches, unique in the folder.
 * @param probes - The probes.
 * @returns Each probe's judgment, by probe.
 */
export const judgeAll = Effect.fn("genetic.lexical.judgeAll")(function* judgeAll(
  breeding: LexicalBreeding,
  name: string,
  probes: readonly Probe[],
) {
  const versions = [...new Set(probes.map(({ version }) => version))];
  const judged = yield* Effect.all(
    versions.map((version) =>
      judgeProbes({
        directory: breeding.directory,
        name,
        oracle: breeding.oracle,
        probes: probes.filter((probe) => probe.version === version),
        version,
      }),
    ),
    { concurrency: "unbounded" },
  );

  return new Map<Probe, Judged>(judged.flat().map((held) => [held.probe, held]));
});

/**
 * What judging a batch of probes fails with.
 */
export type JudgeError = Effect.Error<ReturnType<typeof judgeAll>>;

/**
 * What judging a batch of probes requires.
 */
export type JudgeServices = Effect.Services<ReturnType<typeof judgeAll>>;

/**
 * Read one genome's judgments as the engine's judgment: its features, and every disagreement no
 * record classifies.
 *
 * @param judged - The judgments of the genome's probes, one per version.
 * @returns The judgment.
 */
export const judgmentOf = (judged: readonly Judged[]): Judgment<LexicalFeature, Finding> => {
  const features = new Set<LexicalFeature>();
  const findings: Finding[] = [];
  for (const { grammar, outcome, probe } of judged) {
    const domain = probe.domain.handle;
    const edges = edgeClassesOf(probe.value, probe.domain);
    for (const edge of edges) {
      features.add(`edge|${probe.version}|${domain}|${edge}`);
    }

    for (const space of spaceClassesOf(probe.value)) {
      features.add(`space|${probe.version}|${domain}|${space}`);
    }

    features.add(
      `verdict|${probe.version}|${domain}|${grammar ? "accepts" : "refuses"}/${outcome}`,
    );
  }

  const [first, second] = judged;
  if (first !== undefined && second !== undefined) {
    if (first.grammar !== second.grammar) {
      features.add(`stale|${first.probe.kind}@${subjectName(first.probe.subject)}|grammar`);
    }

    if (first.outcome !== second.outcome) {
      features.add(`stale|${first.probe.kind}@${subjectName(first.probe.subject)}|xmllint`);
    }
  }

  for (const held of judged) {
    for (const disagreement of Option.toArray(disagreementOf(held))) {
      if (recordOf(disagreement) === undefined) {
        findings.push({ disagreement, edges: edgeClassesOf(held.probe.value, held.probe.domain) });
      }
    }
  }

  return { disagreements: findings, features };
};

/**
 * A finding's signature: its version, domain and site, both verdicts, and its value's edge
 * classes, so a run keeps the first candidate of each class of disagreement.
 *
 * @param finding - The finding.
 * @returns The signature.
 */
export const signatureOf = ({ disagreement, edges }: Finding): string => {
  const { grammar, probe, xsd } = disagreement;

  return `${probe.version} ${probe.kind}@${subjectName(probe.subject)} ${probe.domain.handle} xmllint ${xsd} grammar ${grammar ? "accepts" : "refuses"} [${edges.join(" ")}]`;
};

/**
 * The search's problem for the engine: its seeds, its mutation, and a judge that writes each
 * generation as one batch per version.
 *
 * @param breeding - The breeding context.
 * @returns The problem.
 */
export const lexicalProblem = (
  breeding: LexicalBreeding,
): Problem<LexicalGenome, LexicalFeature, Finding, JudgeError, JudgeServices> => {
  const sitesByDomain = new Map<string, number[]>();
  for (const [index, site] of breeding.sites.entries()) {
    for (const { domain } of site.at.values()) {
      sitesByDomain.set(domain.handle, [...(sitesByDomain.get(domain.handle) ?? []), index]);
    }
  }

  let round = 0;

  return {
    familyOf: (feature) => feature.slice(0, feature.indexOf("|")),
    judge: (genomes) =>
      Effect.gen(function* judgeGeneration() {
        round += 1;
        const started = Date.now();
        const probes = genomes.map((genome) => probesOfGenome(breeding.sites, genome));
        const judged = yield* judgeAll(breeding, `round-${String(round)}`, probes.flat());
        yield* Console.log(
          `genetic-lexical: round ${String(round)}, ${String(genomes.length)} candidates, ${String(probes.flat().length)} probes, ${String(Date.now() - started)} ms`,
        );

        return probes.map((held) =>
          judgmentOf(
            held.flatMap((probe) => Option.toArray(Option.fromUndefinedOr(judged.get(probe)))),
          ),
        );
      }),
    mutate: lexicalMutation(breeding, sitesByDomain),
    seeds: seedsOf(breeding.sites),
    signatureOf,
  };
};

/**
 * The genomes one cut smaller than a value's, largest cut first, as delta debugging cuts: the empty
 * value, then each run of half its code points, of a quarter, and so on down to each code point,
 * so a few rounds remove most of a long value.
 *
 * @param genome - The genome.
 * @returns The smaller genomes.
 */
export const smallerOf = (genome: LexicalGenome): readonly LexicalGenome[] => {
  const points = pointsOf(genome.value);
  const values = [""];
  for (let size = Math.floor(points.length / 2); size >= 1; size = Math.floor(size / 2)) {
    for (let at = 0; at < points.length; at += size) {
      values.push(spliced(points, at, size, ""));
    }
  }

  return [...new Set(values)]
    .filter((value) => value !== genome.value)
    .map((value) => ({ ...genome, value }));
};

/**
 * A judge that several reductions share, so each round of all of them is one batch: each call
 * waits until every reduction still running has asked, then one call of {@link judgeAll} judges
 * every probe asked for, and each caller reads its own. A reduction that ends says so (`done`), and
 * the round closes without it.
 */
export interface SharedJudge {
  readonly done: Effect.Effect<void, JudgeError, JudgeServices>;
  readonly judge: (
    probes: readonly Probe[],
  ) => Effect.Effect<ReadonlyMap<Probe, Judged>, JudgeError, JudgeServices>;
}

/**
 * Make a judge {@link SharedJudge} for a number of reductions.
 *
 * @param breeding - The breeding context.
 * @param reductions - How many reductions share it.
 * @returns The shared judge.
 */
export const sharedJudge = (breeding: LexicalBreeding, reductions: number): SharedJudge => {
  let live = reductions;
  let round = 0;
  let waiting: {
    readonly answer: Deferred.Deferred<ReadonlyMap<Probe, Judged>, JudgeError>;
    readonly probes: readonly Probe[];
  }[] = [];
  const close = Effect.gen(function* closeRound() {
    if (live === 0 || waiting.length < live) {
      return;
    }

    const asked = waiting;
    waiting = [];
    round += 1;
    const judged = yield* Effect.exit(
      judgeAll(
        breeding,
        `reduce-${String(round)}`,
        asked.flatMap(({ probes }) => probes),
      ),
    );
    for (const { answer } of asked) {
      yield* Deferred.done(answer, judged);
    }
  });

  return {
    done: Effect.suspend(() => {
      live -= 1;

      return close;
    }),
    judge: (probes) =>
      Effect.gen(function* askRound() {
        const answer = yield* Deferred.make<ReadonlyMap<Probe, Judged>, JudgeError>();
        waiting.push({ answer, probes });
        yield* close;

        return yield* Deferred.await(answer);
      }),
  };
};
