/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * Value domains as data (review U1; fin.md §16, §17): each simple type an attribute's value or a
 * simple-content kind's text is read under, compiled from its resolved XSD definition (the leaf's
 * `Domain`, `src/vocab/inventory/types.ts`) into one pattern over the lexical form as written.
 *
 * The database holds an attribute's lexical form exactly as the document spells it, and one CHECK,
 * `lexical ~ pattern`, decides it. XML Schema normalizes a value's whitespace before its facets
 * read it (Part 2, 4.3.6), and a CHECK has no normalization step, so each pattern absorbs its
 * type's `whiteSpace` class itself (spec-alignment §9.6):
 *
 * - `preserve`: the pattern is the type's language.
 * - `replace`: every character the language admits a space at also admits a tab, line feed or
 *   carriage return, and no other position admits them (replace maps each to a space, one for
 *   one).
 * - `collapse`: any run of XML whitespace at either end, and a run wherever the language admits a
 *   space; no tab, line feed or carriage return otherwise. Where a word may begin or end with a
 *   space, which collapsing never yields, the core must also begin and end with a character that is
 *   not whitespace (`" ?q"` is an RFC 2396 URI reference and `"?q"` is not). The result is exact
 *   when merging two spaces that stand together keeps a word in the language, which {@link compile}
 *   proves of each language by Glushkov's follow sets before it folds it, and refuses otherwise.
 *
 * The rest of a type's facets fold into the same pattern where they are lexical: its primitive's
 * lexical space, its `pattern` facets (one set per derivation step, each set an alternation, every
 * set holding), its enumeration, its lengths, an integer type's bounds, which are a set of digit
 * strings, and a decimal's `minInclusive="0"`, the unsigned decimals and the zeros after a minus.
 * A double's or a float's one lower bound needs the typed value, so it is the domain's
 * {@link DoubleBound}, which the typed value's law reads; any other bound is refused.
 *
 * The pattern is written in the syntax PostgreSQL's advanced regular expressions, JavaScript's
 * `u`-flag regular expressions and grizzle's `str.regex` grammar share: bracket expressions of code
 * points, non-capturing groups, alternation and bounded quantifiers of at most 255 (PostgreSQL's
 * `RE_DUP_MAX`), and no lookaround, which grizzle's admission refuses
 * (`scalar/regex/parse.ts`). So where a type's constraints intersect, the pattern is their product,
 * and a collapsed core that may not begin or end with whitespace has its first and last characters
 * narrowed, never asserted. XSD's own regex dialect (`\i`, `\c`, block and category escapes, class
 * subtraction) is translated, never passed through.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, 4.3.6 whiteSpace}
 * @see {@link https://www.w3.org/TR/xmlschema-2/#regexs | XML Schema Part 2, Appendix F, Regular Expressions}
 * @see {@link https://www.postgresql.org/docs/current/functions-matching.html#POSIX-SYNTAX-DETAILS | PostgreSQL, Regular Expression Details}
 */
import { Array as Arr, Option, Result, Schema } from "effect";
import type { Domain, Facet, FacetName, Primitive } from "#pantry/vocab/inventory/types.ts";

/**
 * A run of code points, both ends included.
 */
export type CodeRange = readonly [lo: number, hi: number];

/**
 * A set of code points: disjoint runs, ascending, no two adjacent.
 */
export type CodeSet = readonly CodeRange[];

/**
 * Normalize runs into a {@link CodeSet}: sorted, empty runs dropped, overlapping and adjacent runs
 * merged.
 *
 * @param ranges - Any runs.
 * @returns The set they cover.
 */
const setOf = (ranges: Iterable<CodeRange>): CodeSet => {
  const merged: [number, number][] = [];
  for (const [lo, hi] of [...ranges]
    .filter(([from, to]) => from <= to)
    .toSorted(([a], [b]) => a - b)) {
    const last = merged.at(-1);
    if (last !== undefined && lo <= last[1] + 1) {
      last[1] = Math.max(last[1], hi);
    } else {
      merged.push([lo, hi]);
    }
  }

  return merged;
};

/**
 * The union of sets.
 *
 * @param sets - The sets.
 * @returns Every code point one of them holds.
 */
const union = (...sets: readonly CodeSet[]): CodeSet => setOf(sets.flat());

/**
 * The intersection of two sets.
 *
 * @param left - A set.
 * @param right - A set.
 * @returns The code points both hold.
 */
const intersect = (left: CodeSet, right: CodeSet): CodeSet => {
  const runs: CodeRange[] = [];
  let at = 0;
  let other = 0;
  // Each set's runs are read in order until either set has no run left.
  for (
    let mine = left[at], theirs = right[other];
    mine !== undefined && theirs !== undefined;
    mine = left[at], theirs = right[other]
  ) {
    const [lo, hi] = mine;
    const [from, to] = theirs;
    if (Math.max(lo, from) <= Math.min(hi, to)) {
      runs.push([Math.max(lo, from), Math.min(hi, to)]);
    }

    if (hi < to) {
      at += 1;
    } else {
      other += 1;
    }
  }

  return runs;
};

/**
 * The code points of one set that another does not hold.
 *
 * @param left - The set.
 * @param right - The code points taken away.
 * @returns `left` without `right`.
 */
const subtract = (left: CodeSet, right: CodeSet): CodeSet => {
  const gaps: CodeRange[] = [];
  let next = 0;
  for (const [lo, hi] of right) {
    gaps.push([next, lo - 1]);
    next = hi + 1;
  }
  gaps.push([next, 0x10_ff_ff]);

  return intersect(left, setOf(gaps));
};

/**
 * Whether a set holds a code point.
 *
 * @param set - The set.
 * @param point - The code point.
 * @returns Whether it is in one of the set's runs.
 */
const holds = (set: CodeSet, point: number): boolean =>
  set.some(([lo, hi]) => lo <= point && point <= hi);

/**
 * Whether two sets hold the same code points.
 *
 * @param left - A set.
 * @param right - A set.
 * @returns Whether their runs agree.
 */
const sameSet = (left: CodeSet, right: CodeSet): boolean =>
  left.length === right.length &&
  Arr.zip(left, right).every(([[lo, hi], [from, to]]) => lo === from && hi === to);

/**
 * Read a character's code point: a string the string iterator yields, one code point long.
 *
 * @param character - The character.
 * @returns Its code point.
 * @throws {Error} When the string is empty, so it holds no character.
 */
const codePointOf = (character: string): number =>
  Option.getOrThrowWith(
    Option.fromNullishOr(character.codePointAt(0)),
    () => new Error("An empty string was read as a character, and a character is one code point."),
  );

/**
 * The set of the characters of a string.
 *
 * @param characters - The characters.
 * @returns Their code points.
 */
const charactersOf = (characters: string): CodeSet =>
  setOf(
    Array.from(characters, (character): CodeRange => {
      const point = codePointOf(character);

      return [point, point];
    }),
  );

/**
 * The code point of `-`, which joins a run's ends in {@link ascii}'s spelling.
 */
const hyphen = codePointOf("-");

/**
 * Read {@link ascii}'s runs off its code points: a point, `-` and a point are a run, and any other
 * point is itself.
 *
 * @param points - The spelling's code points.
 * @returns The runs, in order.
 */
const asciiRuns = (points: readonly number[]): readonly CodeRange[] =>
  Arr.matchLeft(points, {
    onEmpty: () => [],
    onNonEmpty: (lo, rest) =>
      Arr.matchLeft(rest, {
        onEmpty: () => [[lo, lo]],
        onNonEmpty: (next, after) =>
          next === hyphen
            ? Arr.matchLeft(after, {
                onEmpty: () => [
                  [lo, lo],
                  [next, next],
                ],
                onNonEmpty: (hi, tail) => [[lo, hi], ...asciiRuns(tail)],
              })
            : [[lo, lo], ...asciiRuns(rest)],
      }),
  });

/**
 * The set of ASCII runs written as `a-zA-Z0-9`: each pair around a hyphen a run, any other
 * character itself.
 *
 * @param spec - The runs, ASCII only, no escapes.
 * @returns The set.
 */
const ascii = (spec: string): CodeSet => setOf(asciiRuns(Array.from(spec, codePointOf)));

/**
 * XML 1.0's `Char`: every character a document may hold. Every set a pattern reads is within it, so
 * a complement never admits a character no attribute value can carry.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-Char | XML 1.0, Char}
 */
const xmlChar: CodeSet = [
  [0x9, 0xa],
  [0xd, 0xd],
  [0x20, 0xd7_ff],
  [0xe0_00, 0xff_fd],
  [0x1_00_00, 0x10_ff_ff],
];

/**
 * XML's four whitespace characters: space, tab, line feed and carriage return (XML 1.0, `S`).
 */
const whitespace: CodeSet = [
  [0x9, 0xa],
  [0xd, 0xd],
  [0x20, 0x20],
];

/**
 * The three whitespace characters `replace` and `collapse` turn into spaces.
 */
const breaks: CodeSet = [
  [0x9, 0xa],
  [0xd, 0xd],
];

/**
 * The space character.
 */
const spacePoint = 0x20;

/**
 * XML 1.0 (Second Edition)'s `BaseChar` (Appendix B, production 85), as the specification lists it.
 */
export const baseChar: readonly CodeRange[] = [
  [0x41, 0x5a],
  [0x61, 0x7a],
  [0xc0, 0xd6],
  [0xd8, 0xf6],
  [0xf8, 0xff],
  [0x1_00, 0x1_31],
  [0x1_34, 0x1_3e],
  [0x1_41, 0x1_48],
  [0x1_4a, 0x1_7e],
  [0x1_80, 0x1_c3],
  [0x1_cd, 0x1_f0],
  [0x1_f4, 0x1_f5],
  [0x1_fa, 0x2_17],
  [0x2_50, 0x2_a8],
  [0x2_bb, 0x2_c1],
  [0x3_86, 0x3_86],
  [0x3_88, 0x3_8a],
  [0x3_8c, 0x3_8c],
  [0x3_8e, 0x3_a1],
  [0x3_a3, 0x3_ce],
  [0x3_d0, 0x3_d6],
  [0x3_da, 0x3_da],
  [0x3_dc, 0x3_dc],
  [0x3_de, 0x3_de],
  [0x3_e0, 0x3_e0],
  [0x3_e2, 0x3_f3],
  [0x4_01, 0x4_0c],
  [0x4_0e, 0x4_4f],
  [0x4_51, 0x4_5c],
  [0x4_5e, 0x4_81],
  [0x4_90, 0x4_c4],
  [0x4_c7, 0x4_c8],
  [0x4_cb, 0x4_cc],
  [0x4_d0, 0x4_eb],
  [0x4_ee, 0x4_f5],
  [0x4_f8, 0x4_f9],
  [0x5_31, 0x5_56],
  [0x5_59, 0x5_59],
  [0x5_61, 0x5_86],
  [0x5_d0, 0x5_ea],
  [0x5_f0, 0x5_f2],
  [0x6_21, 0x6_3a],
  [0x6_41, 0x6_4a],
  [0x6_71, 0x6_b7],
  [0x6_ba, 0x6_be],
  [0x6_c0, 0x6_ce],
  [0x6_d0, 0x6_d3],
  [0x6_d5, 0x6_d5],
  [0x6_e5, 0x6_e6],
  [0x9_05, 0x9_39],
  [0x9_3d, 0x9_3d],
  [0x9_58, 0x9_61],
  [0x9_85, 0x9_8c],
  [0x9_8f, 0x9_90],
  [0x9_93, 0x9_a8],
  [0x9_aa, 0x9_b0],
  [0x9_b2, 0x9_b2],
  [0x9_b6, 0x9_b9],
  [0x9_dc, 0x9_dd],
  [0x9_df, 0x9_e1],
  [0x9_f0, 0x9_f1],
  [0xa_05, 0xa_0a],
  [0xa_0f, 0xa_10],
  [0xa_13, 0xa_28],
  [0xa_2a, 0xa_30],
  [0xa_32, 0xa_33],
  [0xa_35, 0xa_36],
  [0xa_38, 0xa_39],
  [0xa_59, 0xa_5c],
  [0xa_5e, 0xa_5e],
  [0xa_72, 0xa_74],
  [0xa_85, 0xa_8b],
  [0xa_8d, 0xa_8d],
  [0xa_8f, 0xa_91],
  [0xa_93, 0xa_a8],
  [0xa_aa, 0xa_b0],
  [0xa_b2, 0xa_b3],
  [0xa_b5, 0xa_b9],
  [0xa_bd, 0xa_bd],
  [0xa_e0, 0xa_e0],
  [0xb_05, 0xb_0c],
  [0xb_0f, 0xb_10],
  [0xb_13, 0xb_28],
  [0xb_2a, 0xb_30],
  [0xb_32, 0xb_33],
  [0xb_36, 0xb_39],
  [0xb_3d, 0xb_3d],
  [0xb_5c, 0xb_5d],
  [0xb_5f, 0xb_61],
  [0xb_85, 0xb_8a],
  [0xb_8e, 0xb_90],
  [0xb_92, 0xb_95],
  [0xb_99, 0xb_9a],
  [0xb_9c, 0xb_9c],
  [0xb_9e, 0xb_9f],
  [0xb_a3, 0xb_a4],
  [0xb_a8, 0xb_aa],
  [0xb_ae, 0xb_b5],
  [0xb_b7, 0xb_b9],
  [0xc_05, 0xc_0c],
  [0xc_0e, 0xc_10],
  [0xc_12, 0xc_28],
  [0xc_2a, 0xc_33],
  [0xc_35, 0xc_39],
  [0xc_60, 0xc_61],
  [0xc_85, 0xc_8c],
  [0xc_8e, 0xc_90],
  [0xc_92, 0xc_a8],
  [0xc_aa, 0xc_b3],
  [0xc_b5, 0xc_b9],
  [0xc_de, 0xc_de],
  [0xc_e0, 0xc_e1],
  [0xd_05, 0xd_0c],
  [0xd_0e, 0xd_10],
  [0xd_12, 0xd_28],
  [0xd_2a, 0xd_39],
  [0xd_60, 0xd_61],
  [0xe_01, 0xe_2e],
  [0xe_30, 0xe_30],
  [0xe_32, 0xe_33],
  [0xe_40, 0xe_45],
  [0xe_81, 0xe_82],
  [0xe_84, 0xe_84],
  [0xe_87, 0xe_88],
  [0xe_8a, 0xe_8a],
  [0xe_8d, 0xe_8d],
  [0xe_94, 0xe_97],
  [0xe_99, 0xe_9f],
  [0xe_a1, 0xe_a3],
  [0xe_a5, 0xe_a5],
  [0xe_a7, 0xe_a7],
  [0xe_aa, 0xe_ab],
  [0xe_ad, 0xe_ae],
  [0xe_b0, 0xe_b0],
  [0xe_b2, 0xe_b3],
  [0xe_bd, 0xe_bd],
  [0xe_c0, 0xe_c4],
  [0xf_40, 0xf_47],
  [0xf_49, 0xf_69],
  [0x10_a0, 0x10_c5],
  [0x10_d0, 0x10_f6],
  [0x11_00, 0x11_00],
  [0x11_02, 0x11_03],
  [0x11_05, 0x11_07],
  [0x11_09, 0x11_09],
  [0x11_0b, 0x11_0c],
  [0x11_0e, 0x11_12],
  [0x11_3c, 0x11_3c],
  [0x11_3e, 0x11_3e],
  [0x11_40, 0x11_40],
  [0x11_4c, 0x11_4c],
  [0x11_4e, 0x11_4e],
  [0x11_50, 0x11_50],
  [0x11_54, 0x11_55],
  [0x11_59, 0x11_59],
  [0x11_5f, 0x11_61],
  [0x11_63, 0x11_63],
  [0x11_65, 0x11_65],
  [0x11_67, 0x11_67],
  [0x11_69, 0x11_69],
  [0x11_6d, 0x11_6e],
  [0x11_72, 0x11_73],
  [0x11_75, 0x11_75],
  [0x11_9e, 0x11_9e],
  [0x11_a8, 0x11_a8],
  [0x11_ab, 0x11_ab],
  [0x11_ae, 0x11_af],
  [0x11_b7, 0x11_b8],
  [0x11_ba, 0x11_ba],
  [0x11_bc, 0x11_c2],
  [0x11_eb, 0x11_eb],
  [0x11_f0, 0x11_f0],
  [0x11_f9, 0x11_f9],
  [0x1e_00, 0x1e_9b],
  [0x1e_a0, 0x1e_f9],
  [0x1f_00, 0x1f_15],
  [0x1f_18, 0x1f_1d],
  [0x1f_20, 0x1f_45],
  [0x1f_48, 0x1f_4d],
  [0x1f_50, 0x1f_57],
  [0x1f_59, 0x1f_59],
  [0x1f_5b, 0x1f_5b],
  [0x1f_5d, 0x1f_5d],
  [0x1f_5f, 0x1f_7d],
  [0x1f_80, 0x1f_b4],
  [0x1f_b6, 0x1f_bc],
  [0x1f_be, 0x1f_be],
  [0x1f_c2, 0x1f_c4],
  [0x1f_c6, 0x1f_cc],
  [0x1f_d0, 0x1f_d3],
  [0x1f_d6, 0x1f_db],
  [0x1f_e0, 0x1f_ec],
  [0x1f_f2, 0x1f_f4],
  [0x1f_f6, 0x1f_fc],
  [0x21_26, 0x21_26],
  [0x21_2a, 0x21_2b],
  [0x21_2e, 0x21_2e],
  [0x21_80, 0x21_82],
  [0x30_41, 0x30_94],
  [0x30_a1, 0x30_fa],
  [0x31_05, 0x31_2c],
  [0xac_00, 0xd7_a3],
];

/**
 * XML 1.0 (Second Edition)'s `Ideographic` (production 86).
 */
export const ideographic: readonly CodeRange[] = [
  [0x4e_00, 0x9f_a5],
  [0x30_07, 0x30_07],
  [0x30_21, 0x30_29],
];

/**
 * XML 1.0 (Second Edition)'s `CombiningChar` (production 87).
 */
export const combiningChar: readonly CodeRange[] = [
  [0x3_00, 0x3_45],
  [0x3_60, 0x3_61],
  [0x4_83, 0x4_86],
  [0x5_91, 0x5_a1],
  [0x5_a3, 0x5_b9],
  [0x5_bb, 0x5_bd],
  [0x5_bf, 0x5_bf],
  [0x5_c1, 0x5_c2],
  [0x5_c4, 0x5_c4],
  [0x6_4b, 0x6_52],
  [0x6_70, 0x6_70],
  [0x6_d6, 0x6_dc],
  [0x6_dd, 0x6_df],
  [0x6_e0, 0x6_e4],
  [0x6_e7, 0x6_e8],
  [0x6_ea, 0x6_ed],
  [0x9_01, 0x9_03],
  [0x9_3c, 0x9_3c],
  [0x9_3e, 0x9_4c],
  [0x9_4d, 0x9_4d],
  [0x9_51, 0x9_54],
  [0x9_62, 0x9_63],
  [0x9_81, 0x9_83],
  [0x9_bc, 0x9_bc],
  [0x9_be, 0x9_be],
  [0x9_bf, 0x9_bf],
  [0x9_c0, 0x9_c4],
  [0x9_c7, 0x9_c8],
  [0x9_cb, 0x9_cd],
  [0x9_d7, 0x9_d7],
  [0x9_e2, 0x9_e3],
  [0xa_02, 0xa_02],
  [0xa_3c, 0xa_3c],
  [0xa_3e, 0xa_3e],
  [0xa_3f, 0xa_3f],
  [0xa_40, 0xa_42],
  [0xa_47, 0xa_48],
  [0xa_4b, 0xa_4d],
  [0xa_70, 0xa_71],
  [0xa_81, 0xa_83],
  [0xa_bc, 0xa_bc],
  [0xa_be, 0xa_c5],
  [0xa_c7, 0xa_c9],
  [0xa_cb, 0xa_cd],
  [0xb_01, 0xb_03],
  [0xb_3c, 0xb_3c],
  [0xb_3e, 0xb_43],
  [0xb_47, 0xb_48],
  [0xb_4b, 0xb_4d],
  [0xb_56, 0xb_57],
  [0xb_82, 0xb_83],
  [0xb_be, 0xb_c2],
  [0xb_c6, 0xb_c8],
  [0xb_ca, 0xb_cd],
  [0xb_d7, 0xb_d7],
  [0xc_01, 0xc_03],
  [0xc_3e, 0xc_44],
  [0xc_46, 0xc_48],
  [0xc_4a, 0xc_4d],
  [0xc_55, 0xc_56],
  [0xc_82, 0xc_83],
  [0xc_be, 0xc_c4],
  [0xc_c6, 0xc_c8],
  [0xc_ca, 0xc_cd],
  [0xc_d5, 0xc_d6],
  [0xd_02, 0xd_03],
  [0xd_3e, 0xd_43],
  [0xd_46, 0xd_48],
  [0xd_4a, 0xd_4d],
  [0xd_57, 0xd_57],
  [0xe_31, 0xe_31],
  [0xe_34, 0xe_3a],
  [0xe_47, 0xe_4e],
  [0xe_b1, 0xe_b1],
  [0xe_b4, 0xe_b9],
  [0xe_bb, 0xe_bc],
  [0xe_c8, 0xe_cd],
  [0xf_18, 0xf_19],
  [0xf_35, 0xf_35],
  [0xf_37, 0xf_37],
  [0xf_39, 0xf_39],
  [0xf_3e, 0xf_3e],
  [0xf_3f, 0xf_3f],
  [0xf_71, 0xf_84],
  [0xf_86, 0xf_8b],
  [0xf_90, 0xf_95],
  [0xf_97, 0xf_97],
  [0xf_99, 0xf_ad],
  [0xf_b1, 0xf_b7],
  [0xf_b9, 0xf_b9],
  [0x20_d0, 0x20_dc],
  [0x20_e1, 0x20_e1],
  [0x30_2a, 0x30_2f],
  [0x30_99, 0x30_99],
  [0x30_9a, 0x30_9a],
];

/**
 * XML 1.0 (Second Edition)'s `Digit` (production 88).
 */
export const xmlDigit: readonly CodeRange[] = [
  [0x30, 0x39],
  [0x6_60, 0x6_69],
  [0x6_f0, 0x6_f9],
  [0x9_66, 0x9_6f],
  [0x9_e6, 0x9_ef],
  [0xa_66, 0xa_6f],
  [0xa_e6, 0xa_ef],
  [0xb_66, 0xb_6f],
  [0xb_e7, 0xb_ef],
  [0xc_66, 0xc_6f],
  [0xc_e6, 0xc_ef],
  [0xd_66, 0xd_6f],
  [0xe_50, 0xe_59],
  [0xe_d0, 0xe_d9],
  [0xf_20, 0xf_29],
];

/**
 * XML 1.0 (Second Edition)'s `Extender` (production 89).
 */
export const extender: readonly CodeRange[] = [
  [0xb7, 0xb7],
  [0x2_d0, 0x2_d0],
  [0x2_d1, 0x2_d1],
  [0x3_87, 0x3_87],
  [0x6_40, 0x6_40],
  [0xe_46, 0xe_46],
  [0xe_c6, 0xe_c6],
  [0x30_05, 0x30_05],
  [0x30_31, 0x30_35],
  [0x30_9d, 0x30_9e],
  [0x30_fc, 0x30_fe],
];

/**
 * XSD's `\i`, `Letter`, `_` and `:`, and the tables {@link nameChar} reads. XML Schema 1.0 defines
 * `\i` as the characters XML 1.0's `Letter`, `_` and `:` match, and `\c` as those its `NameChar`
 * matches (Part 2, F.1.1), citing XML 1.0 (Second Edition), whose `Letter` is `BaseChar |
 * Ideographic` (Appendix B). They are stated here as that edition lists them; the Fifth Edition's
 * wider `NameStartChar` ranges, which an element's own name is read under, are not XSD's, and
 * `xmllint` refuses an `xs:NCName` value outside these tables. `domains.test.ts` reads each table
 * from the cached specification.
 *
 * @see {@link https://www.w3.org/TR/2000/REC-xml-20001006#CharClasses | XML 1.0 (Second Edition), Appendix B}
 */
const nameStart: CodeSet = setOf([...baseChar, ...ideographic, [0x3a, 0x3a], [0x5f, 0x5f]]);

/**
 * XSD's `\c`: XML 1.0 (Second Edition)'s `NameChar`, `Letter | Digit | '.' | '-' | '_' | ':' |
 * CombiningChar | Extender` (production 4).
 */
const nameChar: CodeSet = union(
  nameStart,
  setOf([...xmlDigit, ...combiningChar, ...extender, [0x2d, 0x2e]]),
);

/**
 * The Unicode blocks XSD's `\p{Is…}` escapes name that the pinned XSDs use, by XSD's block name.
 * A block not listed is refused by name ({@link UnreadPattern}), never guessed.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#nt-IsBlock | XML Schema Part 2, F.1.1 Character class escapes}
 */
const blocks = new Map<string, CodeSet>([
  ["BasicLatin", [[0x0, 0x7f]]],
  ["Latin-1Supplement", [[0x80, 0xff]]],
]);

/**
 * The code points of Unicode general categories, by XSD's category name, read once from the
 * runtime's own Unicode tables (`\p{…}` of a `u`-flag regular expression) and kept.
 */
const categoryCache = new Map<string, CodeSet>();

/**
 * The general category names XSD's `\p{…}` reads (XML Schema Part 2, F.1.1).
 */
const categoryNames: ReadonlySet<string> = new Set(
  "L Lu Ll Lt Lm Lo M Mn Mc Me N Nd Nl No P Pc Pd Ps Pe Pi Pf Po Z Zs Zl Zp S Sm Sc Sk So C Cc Cf Co Cn".split(
    " ",
  ),
);

/**
 * Read a general category's code points, within XML's `Char`.
 *
 * @param name - The category, such as `Nd`.
 * @returns Its set.
 */
const categoryOf = (name: string): CodeSet => {
  const known = categoryCache.get(name);
  if (known !== undefined) {
    return known;
  }

  const test = new RegExp(`^\\p{gc=${name}}$`, "u");
  const runs: CodeRange[] = [];
  for (const [lo, hi] of xmlChar) {
    for (let point = lo; point <= hi; point += 1) {
      if (test.test(String.fromCodePoint(point))) {
        runs.push([point, point]);
      }
    }
  }

  const set = setOf(runs);
  categoryCache.set(name, set);

  return set;
};

/**
 * A regular language as a tree, the form every lexical space is built and folded in before it is
 * written as a pattern.
 *
 * - `chars`: one character of a set.
 * - `seq`: its parts in order; none is the empty string.
 * - `alt`: one of its arms.
 * - `repeat`: its body `min` to `max` times, `max` none for unbounded.
 *
 * No node asserts without matching, so no tree is written with a lookaround: an intersection is
 * built as its product ({@link intersection}), and a word narrowed at an end by its first or last
 * character ({@link firstIn}, {@link lastIn}).
 */
export type Regex =
  | { readonly _tag: "alt"; readonly arms: readonly Regex[] }
  | { readonly _tag: "chars"; readonly set: CodeSet }
  | {
      readonly _tag: "repeat";
      readonly body: Regex;
      readonly max: Option.Option<number>;
      readonly min: number;
    }
  | { readonly _tag: "seq"; readonly parts: readonly Regex[] };

/**
 * The language with no word: what a set with no character leaves, and what an intersection or a
 * sequence holding it is.
 */
const nothing: Regex = { _tag: "alt", arms: [] };

/**
 * Whether a tree is {@link nothing}.
 *
 * @param tree - The tree.
 * @returns Whether its language is empty by construction.
 */
const isNothing = (tree: Regex): boolean => tree._tag === "alt" && tree.arms.length === 0;

/**
 * One character of a set, or {@link nothing} for the empty set.
 *
 * @param set - The set.
 * @returns The tree.
 */
const chars = (set: CodeSet): Regex => (set.length === 0 ? nothing : { _tag: "chars", set });

/**
 * A sequence: nested sequences flattened, one part standing alone, and {@link nothing} where a part
 * is.
 *
 * @param parts - Its parts.
 * @returns The tree.
 */
const seq = (...parts: readonly Regex[]): Regex => {
  const flat = parts.flatMap((part) => (part._tag === "seq" ? part.parts : [part]));
  const [only] = flat;
  if (flat.some(isNothing)) {
    return nothing;
  }

  return flat.length === 1 && only !== undefined ? only : { _tag: "seq", parts: flat };
};

/**
 * An alternation: nested alternations flattened, arms of no word dropped, one arm standing alone.
 *
 * @param arms - Its arms.
 * @returns The tree.
 */
const alt = (...arms: readonly Regex[]): Regex => {
  const flat = arms.flatMap((arm) => (arm._tag === "alt" ? arm.arms : [arm]));
  const [only] = flat;

  return flat.length === 1 && only !== undefined ? only : { _tag: "alt", arms: flat };
};

/**
 * A repetition, simplified where its shape allows: more times than the most is {@link nothing},
 * at most zero times is the empty string, exactly once is its body, a body of no word is the empty
 * string or nothing, and an optional run of one or more is a run of zero or more.
 *
 * No tree repeats more times at least than at most, so no pattern is written with a quantifier
 * such as `{3,2}`, which both PostgreSQL and JavaScript refuse to compile.
 *
 * @param body - What repeats.
 * @param min - The fewest times.
 * @param max - The most, none for unbounded.
 * @returns The tree.
 */
const repeat = (body: Regex, min: number, max: Option.Option<number>): Regex => {
  if (Option.exists(max, (most) => most < min)) {
    return nothing;
  }

  if (Option.contains(max, 0) || isNothing(body)) {
    return min === 0 ? seq() : nothing;
  }

  if (min === 1 && Option.contains(max, 1)) {
    return body;
  }

  if (
    min === 0 &&
    Option.contains(max, 1) &&
    body._tag === "repeat" &&
    body.min === 1 &&
    Option.isNone(body.max)
  ) {
    return { _tag: "repeat", body: body.body, max: Option.none(), min: 0 };
  }

  return { _tag: "repeat", body, max, min };
};

/**
 * Zero or more.
 *
 * @param body - What repeats.
 * @returns The tree.
 */
const star = (body: Regex): Regex => repeat(body, 0, Option.none());

/**
 * One or more.
 *
 * @param body - What repeats.
 * @returns The tree.
 */
const plus = (body: Regex): Regex => repeat(body, 1, Option.none());

/**
 * Zero or one.
 *
 * @param body - What may stand.
 * @returns The tree.
 */
const opt = (body: Regex): Regex => repeat(body, 0, Option.some(1));

/**
 * The empty string.
 */
const empty: Regex = seq();

/**
 * A string, character by character.
 *
 * @param text - The string.
 * @returns The tree.
 */
const literal = (text: string): Regex =>
  seq(...Array.from(text, (character) => chars(charactersOf(character))));

/**
 * One ASCII character of a set written as {@link ascii} reads it.
 *
 * @param spec - The runs.
 * @returns The tree.
 */
const cls = (spec: string): Regex => chars(ascii(spec));

/**
 * One whitespace character.
 */
const whitespaceChar = chars(whitespace);

/**
 * A run of XML whitespace, possibly empty: what a collapsed value may carry at either end.
 */
const anyWhitespace = star(whitespaceChar);

/**
 * Any value: a string of XML characters, the language of `xs:string` and `xs:anySimpleType`.
 */
const anything = star(chars(xmlChar));

/**
 * A pattern facet XSD's regular expression grammar does not read, or one this reader does not
 * translate, such as a block it has no range for.
 */
export class UnreadPattern extends Schema.TaggedError<UnreadPattern>()("UnreadPattern", {
  at: Schema.Number,
  detail: Schema.String,
  pattern: Schema.String,
}) {
  /**
   * The pattern, where it stops being read, and the repair.
   */
  override get message(): string {
    return `The XSD pattern ${JSON.stringify(this.pattern)} is not read at character ${this.at}: ${this.detail}. Correct the pattern, or extend the attribute grammar's reader of XSD regular expressions.`;
  }
}

/**
 * A resolved definition whose facets the compiler does not fold into a pattern, or whose language
 * the whitespace fold cannot state exactly.
 */
export class UnreadDefinition extends Schema.TaggedError<UnreadDefinition>()("UnreadDefinition", {
  detail: Schema.String,
}) {
  /**
   * What is not read, and the repair.
   */
  override get message(): string {
    return `A value domain is not compiled: ${this.detail}. Give the attribute a reading in the attribute grammar, or extend the domain compiler to this definition.`;
  }
}

/**
 * A resolved definition whose lexical space holds no value, which no pattern grizzle admits spells
 * (it refuses a `Compute.matches` pattern no text matches): the attribute grammar reads such a
 * definition as an empty domain, one with no pattern.
 */
export class EmptyDefinition extends Schema.TaggedError<EmptyDefinition>()("EmptyDefinition", {
  primitive: Schema.String,
}) {
  /**
   * The definition's primitive, what has no pattern, and the repair.
   */
  override get message(): string {
    return `A value domain of ${this.primitive} is not compiled: its definition's lexical space holds no value, so no pattern spells it. Read it as an empty domain, or give the attribute a reading in the attribute grammar.`;
  }
}

/**
 * The ways a resolved definition has no compiled domain.
 */
export type CompileError = EmptyDefinition | UnreadDefinition | UnreadPattern;

/**
 * The single-character escapes of XSD's regex grammar, by the character after the backslash
 * (XML Schema Part 2, F.1.1, `SingleCharEsc`).
 */
const singleEscapes: ReadonlyMap<string, number> = new Map([
  ["n", 0xa],
  ["r", 0xd],
  ["t", 0x9],
  ...Array.from("\\|.?*+(){}-[]^", (character): [string, number] => [
    character,
    codePointOf(character),
  ]),
]);

/**
 * XSD's `\w`: every character but the punctuation, separators and other characters of Unicode
 * (XML Schema Part 2, F.1.1).
 *
 * @returns The set.
 */
const wordCharacters = (): CodeSet =>
  subtract(xmlChar, union(categoryOf("P"), categoryOf("Z"), categoryOf("C")));

/**
 * The sets of the lower-case multi-character escapes, each read when an escape names it.
 */
const multiEscapes = new Map<string, () => CodeSet>([
  ["c", () => nameChar],
  ["d", () => categoryOf("Nd")],
  ["i", () => nameStart],
  ["s", () => whitespace],
  ["w", wordCharacters],
]);

/**
 * The multi-character escapes of XSD's regex grammar, by letter (XML Schema Part 2, F.1.1,
 * `MultiCharEsc`): their sets within XML's `Char`, the upper case each lower case's complement.
 *
 * @param letter - The escape's letter.
 * @returns Its set, or none for a letter that is no multi-character escape.
 */
const multiEscape = (letter: string): Option.Option<CodeSet> => {
  const lower = letter.toLowerCase();
  const read = Option.fromNullishOr(multiEscapes.get(lower));

  return read.pipe(
    Option.map((set) => (letter === lower ? intersect(set(), xmlChar) : subtract(xmlChar, set()))),
  );
};

/**
 * A reader over one XSD pattern's code points.
 */
interface Cursor {
  at: number;
  readonly points: readonly string[];
  readonly source: string;
}

/**
 * Refuse a pattern where the cursor stands.
 *
 * @param cursor - The cursor.
 * @param detail - What is wrong there.
 * @returns The failure.
 */
const unread = (cursor: Cursor, detail: string): Result.Result<never, UnreadPattern> =>
  Result.fail(new UnreadPattern({ at: cursor.at, detail, pattern: cursor.source }));

/**
 * The character the cursor stands on, or none at the end.
 *
 * @param cursor - The cursor.
 * @param ahead - How many characters past it.
 * @returns The character.
 */
const peek = (cursor: Cursor, ahead = 0): string | undefined => cursor.points[cursor.at + ahead];

/**
 * Read a category or block escape's braces, `{Name}`, after `\p` or `\P`.
 *
 * @param cursor - The cursor, on the `{`.
 * @param complement - Whether the escape is `\P`.
 * @returns The escape's set.
 */
const readProperty = (
  cursor: Cursor,
  complement: boolean,
): Result.Result<CodeSet, UnreadPattern> => {
  if (peek(cursor) !== "{") {
    return unread(cursor, "a \\p or \\P without its braces");
  }

  const close = cursor.points.indexOf("}", cursor.at);
  if (close === -1) {
    return unread(cursor, "a \\p{ without its closing brace");
  }

  const name = cursor.points.slice(cursor.at + 1, close).join("");
  cursor.at = close + 1;
  const category = categoryNames.has(name) ? Option.some(categoryOf(name)) : Option.none();
  const set = name.startsWith("Is") ? Option.fromNullishOr(blocks.get(name.slice(2))) : category;

  return Option.match(set, {
    onNone: () => unread(cursor, `the property ${name}, which this reader has no range for`),
    onSome: (held) =>
      Result.succeed(complement ? subtract(xmlChar, held) : intersect(held, xmlChar)),
  });
};

/**
 * What a class item or an escape stands for: one character, which may start or end a range, or a
 * set of characters, which may not.
 */
type Escaped =
  | { readonly _tag: "point"; readonly point: number }
  | { readonly _tag: "set"; readonly set: CodeSet };

/**
 * The characters an item stands for.
 *
 * @param escaped - The item.
 * @returns Its set.
 */
const setOfEscaped = (escaped: Escaped): CodeSet =>
  escaped._tag === "point" ? [[escaped.point, escaped.point]] : escaped.set;

/**
 * Read an escape after its backslash: a single character, a multi-character set, or a category or
 * block.
 *
 * @param cursor - The cursor, past the backslash.
 * @returns The character or the set it stands for.
 */
const readEscape = (cursor: Cursor): Result.Result<Escaped, UnreadPattern> => {
  const letter = peek(cursor);
  if (letter === undefined) {
    return unread(cursor, "a backslash at the end");
  }

  cursor.at += 1;
  const single = singleEscapes.get(letter);
  if (single !== undefined) {
    return Result.succeed({ _tag: "point", point: single });
  }

  if (letter === "p" || letter === "P") {
    return Result.map(readProperty(cursor, letter === "P"), (set) => ({ _tag: "set", set }));
  }

  return Option.match(multiEscape(letter), {
    onNone: () => unread(cursor, `the escape \\${letter}, which XSD does not define`),
    onSome: (set) => Result.succeed({ _tag: "set", set }),
  });
};

/**
 * Read one item of a class's group: a character or a single-character escape, alone or as the
 * start of a range to another, or a multi-character, category or block escape.
 *
 * @param cursor - The cursor, on the item.
 * @param character - The character it stands on.
 * @returns The item's set.
 */
const readClassItem = (cursor: Cursor, character: string): Result.Result<CodeSet, UnreadPattern> =>
  Result.gen(function* readClassItemBody() {
    cursor.at += 1;
    const start: Escaped =
      character === "\\"
        ? yield* readEscape(cursor)
        : { _tag: "point", point: codePointOf(character) };
    const dash = peek(cursor) === "-" && peek(cursor, 1) !== "]" && peek(cursor, 1) !== "[";
    if (start._tag !== "point" || !dash) {
      return setOfEscaped(start);
    }

    cursor.at += 1;
    const endCharacter = peek(cursor);
    if (endCharacter === undefined) {
      return yield* unread(cursor, "a range without its end");
    }

    cursor.at += 1;
    const end: Escaped =
      endCharacter === "\\"
        ? yield* readEscape(cursor)
        : { _tag: "point", point: codePointOf(endCharacter) };
    if (end._tag !== "point" || end.point < start.point) {
      return yield* unread(cursor, "a range whose end is not one character after its start");
    }

    const range: CodeSet = [[start.point, end.point]];

    return range;
  });

/**
 * Read a character class after its `[`: a positive or negated group, then an optional subtraction
 * `-[…]`, then the `]`.
 *
 * @param cursor - The cursor, past the `[`.
 * @returns The class's set within XML's `Char`.
 */
const readClass = (cursor: Cursor): Result.Result<CodeSet, UnreadPattern> =>
  Result.gen(function* readClassBody() {
    const negated = peek(cursor) === "^";
    if (negated) {
      cursor.at += 1;
    }

    const runs: CodeRange[] = [];
    let subtracted: CodeSet = [];
    for (;;) {
      const character = peek(cursor);
      if (character === undefined) {
        return yield* unread(cursor, "a class without its closing bracket");
      }

      if (character === "]") {
        if (runs.length === 0) {
          return yield* unread(cursor, "an empty class");
        }

        cursor.at += 1;
        break;
      }

      if (character === "-" && peek(cursor, 1) === "[") {
        cursor.at += 2;
        subtracted = yield* readClass(cursor);
        if (peek(cursor) !== "]") {
          return yield* unread(cursor, "a subtraction that is not the class's last part");
        }

        cursor.at += 1;
        break;
      }

      if (character === "[") {
        return yield* unread(cursor, "an unescaped [ inside a class");
      }

      runs.push(...(yield* readClassItem(cursor, character)));
    }

    const group = intersect(setOf(runs), xmlChar);

    return subtract(negated ? subtract(xmlChar, group) : group, subtracted);
  });

/**
 * Read a quantifier's braces after `{`: `{n}`, `{n,}` or `{n,m}`.
 *
 * @param cursor - The cursor, past the `{`.
 * @returns The bounds.
 */
const readBraces = (
  cursor: Cursor,
): Result.Result<{ readonly max: Option.Option<number>; readonly min: number }, UnreadPattern> => {
  const close = cursor.points.indexOf("}", cursor.at);
  const body = close === -1 ? "" : cursor.points.slice(cursor.at, close).join("");
  if (!/^[0-9]+(?:,[0-9]*)?$/u.test(body)) {
    return unread(cursor, "a { that opens no quantity");
  }

  cursor.at = close + 1;
  // `{n}` is n times, `{n,}` n or more, and `{n,m}` n to m.
  const comma = body.indexOf(",");
  const min = Number(comma === -1 ? body : body.slice(0, comma));
  const upper = body.slice(comma + 1);
  let max: Option.Option<number> = Option.some(min);
  if (comma !== -1) {
    max = upper === "" ? Option.none() : Option.some(Number(upper));
  }

  return Option.exists(max, (most) => most < min)
    ? unread(cursor, "a quantity whose most is below its least")
    : Result.succeed({ max, min });
};

/**
 * Read an alternation of branches up to a `)` or the end.
 *
 * @param cursor - The cursor.
 * @returns The tree.
 */
const readAlternation = (cursor: Cursor): Result.Result<Regex, UnreadPattern> =>
  Result.gen(function* readAlternationBody() {
    const arms: Regex[] = [];
    for (;;) {
      const parts: Regex[] = [];
      for (;;) {
        const character = peek(cursor);
        if (character === undefined || character === "|" || character === ")") {
          break;
        }

        cursor.at += 1;
        let atom: Regex;
        if (character === "(") {
          atom = yield* readAlternation(cursor);
          if (peek(cursor) !== ")") {
            return yield* unread(cursor, "a group without its closing parenthesis");
          }

          cursor.at += 1;
        } else if (character === "[") {
          atom = chars(yield* readClass(cursor));
        } else if (character === "\\") {
          atom = chars(setOfEscaped(yield* readEscape(cursor)));
        } else if (character === ".") {
          atom = chars(subtract(xmlChar, charactersOf("\n\r")));
        } else if ("?*+{}]".includes(character)) {
          return yield* unread(cursor, `a ${character} with nothing to quantify`);
        } else {
          atom = chars(charactersOf(character));
        }

        const quantifier = peek(cursor);
        if (quantifier === "?") {
          cursor.at += 1;
          atom = opt(atom);
        } else if (quantifier === "*") {
          cursor.at += 1;
          atom = star(atom);
        } else if (quantifier === "+") {
          cursor.at += 1;
          atom = plus(atom);
        } else if (quantifier === "{") {
          cursor.at += 1;
          const { max, min } = yield* readBraces(cursor);
          atom = repeat(atom, min, max);
        }

        parts.push(atom);
      }

      arms.push(seq(...parts));
      if (peek(cursor) !== "|") {
        break;
      }

      cursor.at += 1;
    }

    return alt(...arms);
  });

/**
 * Translate an XSD `pattern` facet into a tree. XSD's regexes match the whole value, so the tree is
 * implicitly anchored at both ends; `^` and `$` are ordinary characters in XSD's dialect.
 *
 * @param source - The pattern as the XSD writes it.
 * @returns The tree, or an {@link UnreadPattern}.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#regexs | XML Schema Part 2, Appendix F}
 */
const readPattern = (source: string): Result.Result<Regex, UnreadPattern> =>
  Result.gen(function* readPatternBody() {
    const cursor: Cursor = { at: 0, points: Array.from(source, String), source };
    const tree = yield* readAlternation(cursor);
    if (cursor.at < cursor.points.length) {
      return yield* unread(cursor, "a ) that closes no group");
    }

    return tree;
  });

/**
 * One decimal digit.
 */
const digit = cls("0-9");

/**
 * An optional sign.
 */
const sign = opt(chars(charactersOf("+-")));

/**
 * `xs:decimal`'s lexical space: an optional sign, then digits with an optional point and
 * fraction, or a point and a fraction (XML Schema Part 2, 3.2.3.1).
 */
const decimalLexical = seq(
  sign,
  alt(seq(plus(digit), opt(seq(literal("."), star(digit)))), seq(literal("."), plus(digit))),
);

/**
 * `xs:double`'s and `xs:float`'s lexical space: a decimal mantissa, an optional exponent, and the
 * special values `INF`, `-INF` and `NaN` (XML Schema Part 2, 3.2.4.1 and 3.2.5.1; `+INF` is XSD
 * 1.1's and not admitted).
 */
const doubleLexical = alt(
  seq(decimalLexical, opt(seq(cls("Ee"), sign, plus(digit)))),
  seq(opt(literal("-")), literal("INF")),
  literal("NaN"),
);

/**
 * The lexical space of a bounded double or float: the primitive's but `NaN`. A datatype's lexical
 * space is "the prescribed set of strings which the lexical mapping for that datatype maps to
 * values of that datatype" (XML Schema 1.1 Part 2, §2.3), and NaN meets no bound, so it is no value
 * of a bounded type; the bound itself judges every other value ({@link DoubleBound}). It also keeps
 * NaN from the typed value, which PostgreSQL would order after every other float and so let meet
 * `>= 0` and `> 0`.
 */
const boundedDoubleLexical = alt(
  seq(decimalLexical, opt(seq(cls("Ee"), sign, plus(digit)))),
  seq(opt(literal("-")), literal("INF")),
);

/**
 * An `NCName`: a name start character other than the colon, then name characters other than the
 * colon (Namespaces in XML, `NCName`).
 */
const ncName = seq(
  chars(subtract(nameStart, charactersOf(":"))),
  star(chars(subtract(nameChar, charactersOf(":")))),
);

/**
 * `xs:QName`'s lexical space: an NCName, with an NCName prefix and a colon before it or not
 * (XML Schema Part 2, 3.2.18).
 */
const qNameLexical = seq(opt(seq(ncName, literal(":"))), ncName);

/**
 * `xs:boolean`'s literals, in its lexical space's production order: `booleanRep ::= 'true' |
 * 'false' | '1' | '0'` (XSD 1.1 Part 2, §3.3.2.2; XML Schema 1.0 Part 2, §3.2.2.1, lists the same
 * four).
 */
const booleanRep = ["true", "false", "1", "0"] as const;

/**
 * The literals `booleanLexicalMap` maps to true, `true` and `1`; it maps `false` and `0` to false
 * (XSD 1.1 Part 2, §3.3.2.2). A collapsed form is true exactly when it is one of these.
 */
export const booleanTrue = ["true", "1"] as const satisfies readonly (typeof booleanRep)[number][];

/**
 * `xs:boolean`'s lexical space (XSD 1.1 Part 2, §3.3.2.2).
 */
const booleanLexical = alt(...booleanRep.map(literal));

/**
 * Write a pattern over an `xs:boolean` form as written that holds exactly where its collapsed form
 * is one of some literals. `xs:boolean`'s `whiteSpace` is `collapse`, fixed (§3.3.2.3), and
 * collapse only turns tabs, line feeds and carriage returns into spaces, merges runs of spaces and
 * drops a space at either end (§4.3.6). No literal holds whitespace, so a form collapses to one
 * exactly when it is the literal with XML whitespace at either end.
 *
 * @param literals - The literals.
 * @returns The pattern, in the syntax PostgreSQL's and JavaScript's regular expressions share.
 */
const booleanFormOf = (literals: readonly string[]): string =>
  `^[\\t\\n\\r ]*(?:${literals.join("|")})[\\t\\n\\r ]*$`;

/**
 * The pattern over an `xs:boolean` form as written that holds exactly where it is true: its
 * collapsed form is one of {@link booleanTrue}. The schema's checks match a written form against it,
 * and {@link booleanOf} reads a form's truth with it.
 */
export const booleanTruePattern = booleanFormOf(booleanTrue);

/**
 * {@link booleanTruePattern}, compiled.
 */
const booleanTrueForm = new RegExp(booleanTruePattern, "u");

/**
 * A form as written that is an `xs:boolean`: its collapsed form is one of {@link booleanRep}.
 */
const booleanForm = new RegExp(booleanFormOf(booleanRep), "u");

/**
 * Read an `xs:boolean` as written: collapse its whitespace (XSD 1.1 Part 2, §4.3.6), then map the
 * literal by `booleanLexicalMap` (§3.3.2.2).
 *
 * @param lexical - The form as written.
 * @returns Its value, true for `true` and `1`, false for `false` and `0`; none for a form outside
 *   the lexical space.
 */
export const booleanOf = (lexical: string): Option.Option<boolean> =>
  booleanForm.test(lexical) ? Option.some(booleanTrueForm.test(lexical)) : Option.none();

/**
 * `xs:base64Binary`'s lexical space, the Second Edition's grammar: groups of four base64
 * characters, each optionally followed by one space, ending in a full group or one padded with
 * `=` (XML Schema Part 2, 3.2.16).
 */
const base64Lexical = ((): Regex => {
  const spaced = (set: string): Regex => seq(cls(set), opt(literal(" ")));
  const b64 = "A-Za-z0-9+/";
  const b64s = spaced(b64);

  return opt(
    seq(
      star(seq(b64s, b64s, b64s, b64s)),
      alt(
        seq(b64s, b64s, b64s, cls(b64)),
        seq(b64s, b64s, spaced("AEIMQUYcgkosw048"), literal("=")),
        seq(b64s, spaced("AQgw"), literal("="), opt(literal(" ")), literal("=")),
      ),
    ),
  );
})();

/**
 * Two characters, each of an ASCII class.
 *
 * @param first - The first character's class.
 * @param second - The second character's class.
 * @returns The tree.
 */
const twoOf = (first: string, second: string): Regex => seq(cls(first), cls(second));

/**
 * A year of the date and time types' lexical spaces: four or more digits, with no leading zero
 * beyond four, and no year 0000 (XML Schema Part 2, 3.2.7.1 and D.3.2).
 */
const yearLexical = alt(
  seq(cls("1-9"), repeat(digit, 3, Option.none())),
  seq(
    literal("0"),
    alt(
      seq(cls("1-9"), digit, digit),
      seq(literal("0"), cls("1-9"), digit),
      seq(literal("00"), cls("1-9")),
    ),
  ),
);

/**
 * A leap year of {@link yearLexical}'s: divisible by 4 and not by 100, or by 400 (XML Schema Part
 * 2, 3.2.7.1, the Gregorian calendar).
 */
const leapYearLexical = ((): Regex => {
  const leapTail = alt(twoOf("0", "48"), twoOf("2468", "048"), twoOf("13579", "26"));

  return alt(
    seq(alt(seq(cls("1-9"), repeat(digit, 2, Option.none())), seq(digit, digit)), leapTail),
    seq(alt(twoOf("0", "48"), twoOf("2468", "048"), twoOf("13579", "26")), literal("00")),
    seq(
      cls("1-9"),
      star(digit),
      alt(twoOf("0", "048"), twoOf("2468", "048"), twoOf("13579", "26")),
      literal("00"),
    ),
  );
})();

/**
 * A month, `01` to `12`.
 */
const monthLexical = alt(twoOf("0", "1-9"), twoOf("1", "0-2"));

/**
 * A month and a day valid for it in every year: 29 February is a leap year's alone, and is left
 * out.
 */
const monthDayLexical = alt(
  seq(
    alt(twoOf("0", "13578"), twoOf("1", "02")),
    literal("-"),
    alt(twoOf("0", "1-9"), twoOf("12", "0-9"), twoOf("3", "01")),
  ),
  seq(
    alt(twoOf("0", "469"), literal("11")),
    literal("-"),
    alt(twoOf("0", "1-9"), twoOf("12", "0-9"), literal("30")),
  ),
  seq(literal("02-"), alt(twoOf("0", "1-9"), twoOf("1", "0-9"), twoOf("2", "0-8"))),
);

/**
 * A timezone: `Z`, or a sign and `hh:mm` from `-14:00` to `+14:00` (XML Schema Part 2, 3.2.7.3).
 */
const timezoneLexical = alt(
  literal("Z"),
  seq(
    chars(charactersOf("+-")),
    alt(
      seq(alt(twoOf("0", "0-9"), twoOf("1", "0-3")), literal(":"), twoOf("0-5", "0-9")),
      literal("14:00"),
    ),
  ),
);

/**
 * A date, a year with a month and a day valid for that month: 29 February only in a leap year.
 */
const datePart = seq(
  opt(literal("-")),
  alt(seq(yearLexical, literal("-"), monthDayLexical), seq(leapYearLexical, literal("-02-29"))),
);

/**
 * A time of day, `hh:mm:ss` with an optional fraction of a second: hours `00` to `23`, or
 * `24:00:00` with no fraction or a zero one, the first instant of the next day (XML Schema Part 2,
 * 3.2.7.1).
 */
const timeOfDay = alt(
  seq(
    alt(twoOf("01", "0-9"), twoOf("2", "0-3")),
    literal(":"),
    twoOf("0-5", "0-9"),
    literal(":"),
    twoOf("0-5", "0-9"),
    opt(seq(literal("."), plus(digit))),
  ),
  seq(literal("24:00:00"), opt(seq(literal("."), plus(literal("0"))))),
);

/**
 * `xs:date`'s lexical space: a year of four or more digits (no year 0000), a month and a day valid
 * for that month, 29 February only in a leap year, and an optional timezone (XML Schema Part 2,
 * 3.2.9.1 and D.3.2).
 */
const dateLexical = seq(datePart, opt(timezoneLexical));

/**
 * `xs:dateTime`'s lexical space: a date, `T`, a time of day, and an optional timezone (XML Schema
 * Part 2, 3.2.7.1).
 */
const dateTimeLexical = seq(datePart, literal("T"), timeOfDay, opt(timezoneLexical));

/**
 * `xs:time`'s lexical space: a time of day and an optional timezone (XML Schema Part 2, 3.2.8.1).
 */
const timeLexical = seq(timeOfDay, opt(timezoneLexical));

/**
 * `xs:gYearMonth`'s lexical space: a year and a month (XML Schema Part 2, 3.2.10.1).
 */
const gYearMonthLexical = seq(
  opt(literal("-")),
  yearLexical,
  literal("-"),
  monthLexical,
  opt(timezoneLexical),
);

/**
 * `xs:gYear`'s lexical space: a year (XML Schema Part 2, 3.2.11.1).
 */
const gYearLexical = seq(opt(literal("-")), yearLexical, opt(timezoneLexical));

/**
 * `xs:gMonthDay`'s lexical space: `--`, a month and a day valid for it in some year, 29 February
 * included (XML Schema Part 2, 3.2.12.1).
 */
const gMonthDayLexical = seq(
  literal("--"),
  alt(monthDayLexical, literal("02-29")),
  opt(timezoneLexical),
);

/**
 * `xs:gDay`'s lexical space: `---` and a day, `01` to `31` (XML Schema Part 2, 3.2.13.1).
 */
const gDayLexical = seq(
  literal("---"),
  alt(twoOf("0", "1-9"), twoOf("12", "0-9"), twoOf("3", "01")),
  opt(timezoneLexical),
);

/**
 * `xs:gMonth`'s lexical space: `--` and a month, the Second Edition's form, which corrects the
 * First Edition's `--MM--` (XML Schema Part 2, 3.2.14.1).
 */
const gMonthLexical = seq(literal("--"), monthLexical, opt(timezoneLexical));

/**
 * `xs:duration`'s lexical space, `PnYnMnDTnHnMnS`: an optional `-`, `P`, then at least one
 * component, in that order, each a count and its designator, the seconds' count with an optional
 * fraction, and `T` exactly when an hour, minute or second follows (XML Schema Part 2, 3.2.6.1).
 */
const durationLexical = ((): Regex => {
  const count = plus(digit);
  const seconds = seq(count, opt(seq(literal("."), plus(digit))), literal("S"));
  const time = seq(
    literal("T"),
    alt(
      seq(count, literal("H"), opt(seq(count, literal("M"))), opt(seconds)),
      seq(count, literal("M"), opt(seconds)),
      seconds,
    ),
  );
  const date = alt(
    seq(count, literal("Y"), opt(seq(count, literal("M"))), opt(seq(count, literal("D")))),
    seq(count, literal("M"), opt(seq(count, literal("D")))),
    seq(count, literal("D")),
  );

  return seq(opt(literal("-")), literal("P"), alt(seq(date, opt(time)), time));
})();

/**
 * `xs:hexBinary`'s lexical space: pairs of hexadecimal digits, either case (XML Schema Part 2,
 * 3.2.15).
 */
const hexBinaryLexical = star(twoOf("0-9A-Fa-f", "0-9A-Fa-f"));

/**
 * The lexical space of each XSD primitive this compiler reads, in the form XSD reads it after the
 * primitive's whitespace class. `anyURI`'s is every string here: its lexical space (spec reading
 * 71, XML Schema 1.0's RFC 2396 as RFC 2732 amends it, after XLink's escaping) is the pattern the
 * leaf states of the built-in, which the compiler reads like any other. `NOTATION`'s value space is
 * the QNames of the notations the schema declares (XML Schema Part 2, 3.2.19), and no pinned XSD
 * declares one, so it is empty: an `xsi:type` may name the built-in (spec reading 60), and no text
 * is valid for it.
 */
const primitives: Partial<Readonly<Record<Primitive, Regex>>> = {
  NOTATION: nothing,
  QName: qNameLexical,
  anySimpleType: anything,
  anyURI: anything,
  base64Binary: base64Lexical,
  boolean: booleanLexical,
  date: dateLexical,
  dateTime: dateTimeLexical,
  decimal: decimalLexical,
  double: doubleLexical,
  duration: durationLexical,
  float: doubleLexical,
  gDay: gDayLexical,
  gMonth: gMonthLexical,
  gMonthDay: gMonthDayLexical,
  gYear: gYearLexical,
  gYearMonth: gYearMonthLexical,
  hexBinary: hexBinaryLexical,
  string: anything,
  time: timeLexical,
};

/**
 * The whole numbers of an interval as digit strings with no leading zero ("0" for zero): the
 * strings of each length between the bounds', each length's run written digit by digit.
 *
 * @param lo - The least, at least zero.
 * @param hi - The greatest, none for unbounded.
 * @returns The tree, or none for an empty interval.
 */
const digitsIn = (lo: bigint, hi: Option.Option<bigint>): Option.Option<Regex> => {
  const sameLength = (from: string, to: string): Regex => {
    if (from.length === 0) {
      return empty;
    }

    // The digits are ASCII, so a code unit is a digit.
    const [a, aRest] = [from.slice(0, 1), from.slice(1)];
    const [b, bRest] = [to.slice(0, 1), to.slice(1)];
    if (a === b) {
      return seq(literal(a), sameLength(aRest, bRest));
    }

    const rest = from.length - 1;
    const lowFull = /^0*$/u.test(aRest);
    const highFull = /^9*$/u.test(bRest);
    const midFrom = Number(a) + (lowFull ? 0 : 1);
    const midTo = Number(b) - (highFull ? 0 : 1);

    return alt(
      ...(lowFull ? [] : [seq(literal(a), sameLength(aRest, "9".repeat(rest)))]),
      ...(midFrom <= midTo
        ? [
            seq(
              cls(`${midFrom}-${midTo}`),
              ...(rest === 0 ? [] : [repeat(digit, rest, Option.some(rest))]),
            ),
          ]
        : []),
      ...(highFull ? [] : [seq(literal(b), sameLength("0".repeat(rest), bRest))]),
    );
  };
  if (Option.exists(hi, (most) => most < lo)) {
    return Option.none();
  }

  const lowLength = String(lo).length;
  // With no greatest, the lengths run to the least's, and an unbounded arm takes the rest.
  const top = Option.match(hi, { onNone: () => lowLength, onSome: (most) => String(most).length });
  const arms: Regex[] = [];
  let full: Option.Option<readonly [number, number]> = Option.none();
  const flush = () => {
    for (const [from, to] of Option.toArray(full)) {
      arms.push(seq(cls("1-9"), repeat(digit, from - 1, Option.some(to - 1))));
    }

    full = Option.none();
  };
  for (let length = lowLength; length <= top; length += 1) {
    const floor = 10n ** BigInt(length - 1);
    const ceiling = 10n ** BigInt(length) - 1n;
    const from = length === lowLength && lo > floor ? lo : floor;
    const to = Option.match(hi, {
      onNone: () => ceiling,
      onSome: (most) => (length === top ? most : ceiling),
    });
    if (from === floor && to === ceiling) {
      full = Option.some([
        Option.match(full, { onNone: () => length, onSome: ([first]) => first }),
        length,
      ]);
    } else {
      flush();
      arms.push(sameLength(String(from), String(to)));
    }
  }

  if (Option.isNone(hi)) {
    const first = Option.match(full, { onNone: () => top + 1, onSome: ([held]) => held });
    full = Option.none();
    arms.push(seq(cls("1-9"), repeat(digit, first - 1, Option.none())));
  }

  flush();

  return Option.some(alt(...arms));
};

/**
 * The lexical forms of the whole numbers of an interval, as `xs:integer` writes them: an optional
 * sign, leading zeros, and the digits; zero with either sign.
 *
 * @param lo - The least, none for unbounded.
 * @param hi - The greatest, none for unbounded.
 * @returns The tree, or none for an empty interval.
 */
const integerIn = (lo: Option.Option<bigint>, hi: Option.Option<bigint>): Option.Option<Regex> => {
  // A bound that is none bounds nothing: no least is above a value, no greatest below it.
  const has = (value: bigint) =>
    !Option.exists(lo, (least) => value < least) && !Option.exists(hi, (most) => most < value);
  const zeros = plus(literal("0"));
  const positive = Option.exists(hi, (most) => most < 1n)
    ? Option.none()
    : digitsIn(
        Option.match(lo, { onNone: () => 1n, onSome: (least) => (least > 1n ? least : 1n) }),
        hi,
      );
  const negative = Option.exists(lo, (least) => least > -1n)
    ? Option.none()
    : digitsIn(
        Option.match(hi, { onNone: () => 1n, onSome: (most) => (most < -1n ? -most : 1n) }),
        lo.pipe(Option.map((least) => -least)),
      );
  const arms = [
    ...(has(0n) ? [seq(sign, zeros)] : []),
    ...Option.toArray(
      positive.pipe(Option.map((body) => seq(opt(literal("+")), star(literal("0")), body))),
    ),
    ...Option.toArray(
      negative.pipe(Option.map((body) => seq(literal("-"), star(literal("0")), body))),
    ),
  ];

  return arms.length === 0 ? Option.none() : Option.some(alt(...arms));
};

/**
 * `xs:decimal`'s lexical forms of values of zero or more: an unsigned decimal, or zero after a
 * minus.
 */
const nonNegativeDecimal = alt(
  seq(
    opt(literal("+")),
    alt(seq(plus(digit), opt(seq(literal("."), star(digit)))), seq(literal("."), plus(digit))),
  ),
  seq(
    literal("-"),
    alt(
      seq(plus(literal("0")), opt(seq(literal("."), star(literal("0"))))),
      seq(literal("."), plus(literal("0"))),
    ),
  ),
);

/**
 * A lower bound on a double's or a float's value, which no pattern states: a value's literal rounds
 * to its IEEE value (XML Schema 1.1 Part 2, §3.3.5.2 and §3.3.4.2), and whether a literal clears a
 * bound turns on that rounding, which no regular language decides (a mantissa's digits against its
 * exponent). So the bound is the typed value's law, read once on the host's parse of the literal,
 * and the pattern states the lexical space alone.
 */
export interface DoubleBound {
  readonly facet: (typeof boundFacets)[number];
  readonly value: number;
}

/**
 * The facets a {@link DoubleBound} is, the `BoundFacet` roster in code order.
 */
export const boundFacets = ["minExclusive", "minInclusive"] as const;

/**
 * The `ValueDomain` primitive of a compiled domain: an atomic domain's XSD primitive, or `list` or
 * `union` for the other varieties, whose values no one primitive types.
 */
export type DomainPrimitive = Primitive | "list" | "union";

/**
 * The `DomainPrimitive` roster, in code order: XML Schema Part 2's primitives in its section order,
 * `anySimpleType`, then the two varieties.
 */
export const domainPrimitives = [
  "string",
  "boolean",
  "decimal",
  "float",
  "double",
  "duration",
  "dateTime",
  "time",
  "date",
  "gYearMonth",
  "gYear",
  "gMonthDay",
  "gDay",
  "gMonth",
  "hexBinary",
  "base64Binary",
  "anyURI",
  "QName",
  "NOTATION",
  "anySimpleType",
  "list",
  "union",
] as const satisfies readonly DomainPrimitive[];

/**
 * XML Schema's identity types a value may be (Part 1, 3.3.4 and the ID/IDREF table): an `ID` that
 * names its element, or one `IDREF` or a list of them that each name one.
 */
export type Identity = "ID" | "IDREF" | "IDREFS";

/**
 * The `Identity` roster, in code order.
 */
export const identities = ["ID", "IDREF", "IDREFS"] as const satisfies readonly Identity[];

/**
 * How a domain's values name namespaces: one `xs:QName`, or a list of them (XML Schema 1.0 Part 2,
 * 3.2.18). "The mapping between literals in the lexical space and values in the value space of
 * QName requires a namespace declaration to be in scope for the context in which QName is used",
 * so a prefixed QName whose prefix no binding in scope declares has no value. That is a fact of
 * the element's bindings, which no pattern over the value alone states: the codec reads it with
 * the bindings in scope ({@link unboundPrefixesOf}).
 */
export type Qualified = "QName" | "QNames";

/**
 * Collapse a text, as XML Schema's `collapse` whitespace class does and `Compute.collapse` does:
 * each run of tabs, line feeds, carriage returns and spaces one space, and none at either end (XSD
 * 1.1 Part 2, §4.3.6). No other character is whitespace to it: a no-break space, an ideographic
 * space or a byte order mark stays, where `String.prototype.trim` would drop it.
 *
 * @param text - The text.
 * @returns The collapsed text.
 * @see {@link https://www.w3.org/TR/xmlschema11-2/#rf-whiteSpace | XSD 1.1 Part 2, whiteSpace}
 */
export const collapse = (text: string): string =>
  text
    .replaceAll(/[\t\n\r ]+/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * A QName once its whitespace is collapsed: an optional prefix and a colon, then its local name,
 * each with no colon and no whitespace (Namespaces in XML 1.0, section 4).
 */
const qName = /^(?:[^\s:]+:)?[^\s:]+$/u;

/**
 * The prefix of an unprefixed QName: the empty prefix, which a default namespace declaration binds
 * (Namespaces in XML 1.0, section 3, `xmlns="…"`) and the XDM's namespace bindings spell `""`.
 */
const unprefixed = "";

/**
 * Read a QName's prefix and local name.
 *
 * @param text - The QName, its whitespace already collapsed.
 * @returns Its parts, the prefix empty for an unprefixed name; none for text that is no QName.
 */
export const qNamePartsOf = (
  text: string,
): Option.Option<{ readonly local: string; readonly prefix: string }> => {
  if (!qName.test(text)) {
    return Option.none();
  }

  // A QName holds at most one colon, which ends its prefix.
  const colon = text.indexOf(":");

  return Option.some(
    colon === -1
      ? { local: text, prefix: unprefixed }
      : { local: text.slice(colon + 1), prefix: text.slice(0, colon) },
  );
};

/**
 * The prefixes a value of a QName domain names that no binding in scope declares: of each QName
 * the value holds, once its whitespace is collapsed ({@link collapse}; a list's items split at its
 * spaces), the prefix where it has one and `bound` refuses it. A token that is no QName names none:
 * the domain's pattern refuses it. An unprefixed QName always has a value, in the default namespace
 * or in none.
 *
 * @param qualified - How the domain's values name namespaces.
 * @param value - The value as written.
 * @param bound - Whether a prefix is bound in scope where the value stands.
 * @returns The unbound prefixes, each once, in order; none for a value every QName of which has
 *   one.
 */
export const unboundPrefixesOf = (
  qualified: Qualified,
  value: string,
  bound: (prefix: string) => boolean,
): readonly string[] => {
  const collapsed = collapse(value);
  const names = qualified === "QName" ? [collapsed] : collapsed.split(" ");

  return [
    ...new Set(
      names.flatMap((name) =>
        Option.match(qNamePartsOf(name), {
          onNone: () => [],
          onSome: ({ prefix }) => (prefix === "" || bound(prefix) ? [] : [prefix]),
        }),
      ),
    ),
  ];
};

/**
 * A compiled value domain: the pattern its lexical forms match as written, the primitive its typed
 * value is derived in, the bound its typed value's law reads, the identity type it is, if any, the
 * values its enumeration keeps, and whether its values are QNames read with their bindings.
 */
export interface CompiledDomain {
  /**
   * The values an atomic definition's enumeration keeps, in the order it states them, each one its
   * pattern matches: what an explanation lists of a value outside them. Empty for a definition
   * that states no enumeration, and for a list or a union.
   */
  /**
   * A double's or a float's lower bound, none for any other domain and for an unbounded one.
   */
  readonly bound: Option.Option<DoubleBound>;
  readonly enumeration: readonly string[];
  readonly identity: Option.Option<Identity>;
  readonly pattern: string;
  readonly primitive: DomainPrimitive;
  /**
   * How the domain's values name namespaces, none for a domain whose values are no QNames.
   */
  readonly qualified: Option.Option<Qualified>;
}

/**
 * The values a definition states of one facet.
 *
 * @param facets - The facets in force.
 * @param name - The facet's name.
 * @returns Each value, in order.
 */
const valuesOf = (facets: readonly Facet[], name: FacetName): readonly string[] =>
  facets.flatMap(({ facet, value }) => (facet === name ? [value] : []));

/**
 * The one value a definition states of a facet, if it states it.
 *
 * @param facets - The facets in force.
 * @param name - The facet's name.
 * @returns Its value.
 */
const valueOf = (facets: readonly Facet[], name: FacetName): Option.Option<string> =>
  Arr.head(valuesOf(facets, name));

/**
 * Refuse a definition.
 *
 * @param detail - What is not read.
 * @returns The failure.
 */
const refuse = (detail: string): Result.Result<never, UnreadDefinition> =>
  Result.fail(new UnreadDefinition({ detail }));

/**
 * The whitespace class a definition states.
 *
 * @param facets - Its facets.
 * @returns `preserve`, `replace` or `collapse`.
 */
const classOf = (
  facets: readonly Facet[],
): Result.Result<"collapse" | "preserve" | "replace", UnreadDefinition> =>
  Option.match(valueOf(facets, "whiteSpace"), {
    onNone: () => refuse("an atomic or list definition with no whiteSpace facet"),
    onSome: (value) =>
      value === "preserve" || value === "replace" || value === "collapse"
        ? Result.succeed(value)
        : refuse(`the whiteSpace value ${value}`),
  });

/**
 * Whether a tree's language is included in another's, by their shapes alone: sound, never
 * complete, so a pattern set is dropped only where another provably implies it.
 *
 * @param big - The tree that may include.
 * @param small - The tree that may be included.
 * @returns Whether every word of `small` is a word of `big`, as far as the shapes show.
 */
const includes = (big: Regex, small: Regex): boolean => {
  if (small._tag === "alt") {
    return small.arms.every((arm) => includes(big, arm));
  }

  if (big._tag === "alt") {
    return big.arms.some((arm) => includes(arm, small));
  }

  if (big._tag === "chars" && small._tag === "chars") {
    return sameSet(intersect(big.set, small.set), small.set);
  }

  if (big._tag === "seq" && small._tag === "seq") {
    return (
      big.parts.length === small.parts.length &&
      Arr.zip(big.parts, small.parts).every(([part, other]) => includes(part, other))
    );
  }

  if (big._tag === "repeat" && small._tag === "repeat") {
    return (
      small.min >= big.min &&
      Option.match(big.max, {
        onNone: () => true,
        onSome: (most) => Option.exists(small.max, (other) => other <= most),
      }) &&
      includes(big.body, small.body)
    );
  }

  return false;
};

/**
 * The integer built-in's `pattern` facet, `[\-+]?[0-9]+` (XML Schema Part 2, 3.3.13), which an
 * integer's interval regex implies.
 */
const integerPattern = String.raw`[\-+]?[0-9]+`;

/**
 * Combine two optional bounds of one side into the tighter, either where only one is stated.
 *
 * @param left - A bound.
 * @param right - A bound of the same side.
 * @param pick - The tighter of two stated bounds.
 * @returns The tighter bound.
 */
const tighter = (
  left: Option.Option<bigint>,
  right: Option.Option<bigint>,
  pick: (a: bigint, b: bigint) => bigint,
): Option.Option<bigint> =>
  Option.match(left, {
    onNone: () => right,
    onSome: (held) =>
      Option.some(
        Option.match(right, { onNone: () => held, onSome: (other) => pick(held, other) }),
      ),
  });

/**
 * Read an integer definition's bounds as the least and greatest whole numbers they admit, an
 * exclusive bound moved one step inward.
 *
 * @param facets - Its facets.
 * @returns The interval, each end none where unbounded.
 */
const integerBounds = (
  facets: readonly Facet[],
): Result.Result<
  { readonly hi: Option.Option<bigint>; readonly lo: Option.Option<bigint> },
  UnreadDefinition
> =>
  Result.gen(function* integerBoundsBody() {
    const ends: Option.Option<bigint>[] = [];
    for (const [name, shift] of [
      ["minInclusive", 0n],
      ["minExclusive", 1n],
      ["maxInclusive", 0n],
      ["maxExclusive", -1n],
    ] as const) {
      const value = valueOf(facets, name);
      if (Option.isSome(value) && !/^[+-]?[0-9]+$/u.test(value.value)) {
        return yield* refuse(`the integer bound ${name}="${value.value}"`);
      }

      ends.push(value.pipe(Option.map((bound) => BigInt(bound) + shift)));
    }

    const [
      lo = Option.none(),
      loExclusive = Option.none(),
      hi = Option.none(),
      hiExclusive = Option.none(),
    ] = ends;

    return {
      hi: tighter(hi, hiExclusive, (a, b) => (a < b ? a : b)),
      lo: tighter(lo, loExclusive, (a, b) => (a > b ? a : b)),
    };
  });

/**
 * Whether a pattern set is the integer built-in's own, which an integer's interval implies.
 *
 * @param set - The set.
 * @returns Whether it is `[\-+]?[0-9]+` alone.
 */
const isIntegerPattern = (set: readonly string[]): boolean =>
  set.length === 1 && set[0] === integerPattern;

/**
 * The bounds a definition states.
 *
 * @param facets - Its facets.
 * @returns Each bound, by its facet and its value as written.
 */
const boundsOf = (facets: readonly Facet[]): readonly Facet[] =>
  facets.filter(
    ({ facet }) =>
      facet === "maxExclusive" ||
      facet === "maxInclusive" ||
      facet === "minExclusive" ||
      facet === "minInclusive",
  );

/**
 * The lexical space an atomic definition's primitive and bounds give it: an integer's interval for
 * an `xs:integer`, the non-negative decimals for a decimal of `minInclusive="0"`, else the
 * primitive's lexical space, with a double's or a float's one lower bound left to its typed value
 * ({@link DoubleBound}).
 *
 * @param domain - The atomic definition.
 * @returns The language, and the bound it does not state; or the refusal of any other bound.
 */
const lexicalOf = (
  domain: Extract<Domain, { readonly _tag: "atomic" }>,
): Result.Result<
  { readonly bound: Option.Option<DoubleBound>; readonly tree: Regex },
  UnreadDefinition
> =>
  Result.gen(function* lexicalOfBody() {
    const { facets, patterns, primitive } = domain;
    const bounds = boundsOf(facets);
    const fraction = valueOf(facets, "fractionDigits");
    if (valueOf(facets, "totalDigits").pipe(Option.isSome)) {
      return yield* refuse(`totalDigits on ${primitive}`);
    }

    if (Option.isSome(fraction)) {
      if (primitive !== "decimal" || fraction.value !== "0" || !patterns.some(isIntegerPattern)) {
        return yield* refuse(
          `fractionDigits="${fraction.value}" on a ${primitive} that is not an xs:integer`,
        );
      }

      const { hi, lo } = yield* integerBounds(facets);

      return yield* Option.match(integerIn(lo, hi), {
        onNone: () => refuse("an integer interval with no member"),
        onSome: (tree) => Result.succeed({ bound: Option.none(), tree }),
      });
    }

    const lexical = Option.fromNullishOr(primitives[primitive]);
    if (Option.isNone(lexical)) {
      return yield* refuse(`the primitive ${primitive}, which no pinned type restricts`);
    }

    if (bounds.length === 0) {
      return { bound: Option.none(), tree: lexical.value };
    }

    const [only, ...more] = bounds;
    if (
      primitive === "decimal" &&
      only !== undefined &&
      more.length === 0 &&
      only.facet === "minInclusive" &&
      Number(only.value) === 0
    ) {
      return { bound: Option.none(), tree: nonNegativeDecimal };
    }

    if (
      (primitive === "double" || primitive === "float") &&
      only !== undefined &&
      more.length === 0 &&
      (only.facet === "minInclusive" || only.facet === "minExclusive") &&
      Number.isFinite(Number(only.value))
    ) {
      return {
        bound: Option.some({ facet: only.facet, value: Number(only.value) }),
        tree: boundedDoubleLexical,
      };
    }

    return yield* refuse(
      `${bounds.map(({ facet, value }) => `${facet}="${value}"`).join(" and ")} on ${primitive}, which only one finite lower bound on a double or a float is read as`,
    );
  });

/**
 * Whether a tree is the language of every value, `[Char]*`.
 *
 * @param tree - The tree.
 * @returns Whether it is.
 */
const isAnything = (tree: Regex): boolean =>
  tree._tag === "repeat" &&
  tree.min === 0 &&
  Option.isNone(tree.max) &&
  tree.body._tag === "chars" &&
  sameSet(tree.body.set, xmlChar);

/**
 * The least and the most length a definition's length facets admit together, the most none for no
 * bound, and whether it states any length facet.
 */
interface LengthBounds {
  readonly max: Option.Option<number>;
  readonly min: number;
  readonly stated: boolean;
}

/**
 * The lengths every length facet a definition states admits together: at least the greatest of its
 * `length` and `minLength`, and at most the least of its `length` and `maxLength`, none for no
 * bound (XML Schema Part 2, 4.3.1.3 to 4.3.3.3, each facet a constraint every value meets).
 *
 * A definition the deriver gives satisfies 4.3.1.4 and 4.3.2.4, so its `length` lies within its
 * other lengths, and the bounds are its `length` where it states one. Any other definition's bounds
 * may cross, which {@link repeat} reads as no value.
 *
 * @param facets - The definition's facets.
 * @returns The least and the most length, and whether any length facet is stated.
 */
const lengthBounds = (facets: readonly Facet[]): LengthBounds => {
  const read = (name: FacetName) => valueOf(facets, name).pipe(Option.map(Number));
  const exact = read("length");
  const least = [...Option.toArray(exact), ...Option.toArray(read("minLength"))];
  const most = [...Option.toArray(exact), ...Option.toArray(read("maxLength"))];

  return {
    max: Arr.isReadonlyArrayNonEmpty(most) ? Option.some(Math.min(...most)) : Option.none(),
    min: Math.max(0, ...least),
    stated: least.length > 0 || most.length > 0,
  };
};

/**
 * Map every character set of a tree.
 *
 * @param tree - The tree.
 * @param map - What each set becomes: a set, or a tree in its place.
 * @returns The tree, each set replaced.
 */
const mapSets = (tree: Regex, map: (set: CodeSet) => Regex): Regex => {
  switch (tree._tag) {
    case "chars": {
      return map(tree.set);
    }
    case "seq": {
      return seq(...tree.parts.map((part) => mapSets(part, map)));
    }
    case "alt": {
      return alt(...tree.arms.map((arm) => mapSets(arm, map)));
    }
    case "repeat": {
      return repeat(mapSets(tree.body, map), tree.min, tree.max);
    }
    default: {
      return tree satisfies never;
    }
  }
};

/**
 * The least and the most length of a tree's words, the most `Infinity` where an unbounded
 * repetition holds a nonempty word. {@link nothing} has no word, so its least is `Infinity` and its
 * most `-Infinity`, and no length lies between them.
 */
interface Lengths {
  readonly max: number;
  readonly min: number;
}

/**
 * The lengths of the trees read so far: a product reads the lengths of each subtree at every span.
 */
const lengthsCache = new WeakMap<Regex, Lengths>();

/**
 * Read the least and the most length of a tree's words.
 *
 * @param tree - The tree.
 * @returns Its {@link Lengths}.
 */
const lengthsOf = (tree: Regex): Lengths => {
  const known = lengthsCache.get(tree);
  if (known !== undefined) {
    return known;
  }

  const read = (): Lengths => {
    switch (tree._tag) {
      case "chars": {
        return { max: 1, min: 1 };
      }
      case "seq": {
        const parts = tree.parts.map(lengthsOf);

        return {
          max: parts.reduce((total, { max }) => total + max, 0),
          min: parts.reduce((total, { min }) => total + min, 0),
        };
      }
      case "alt": {
        const arms = tree.arms.map(lengthsOf);

        return {
          max: Math.max(...arms.map(({ max }) => max)),
          min: Math.min(...arms.map(({ min }) => min)),
        };
      }
      case "repeat": {
        const body = lengthsOf(tree.body);
        // An unbounded repetition of a nonempty word has no longest word.
        const most = Option.match(tree.max, {
          onNone: () => Number.POSITIVE_INFINITY,
          onSome: (held) => held,
        });

        return { max: body.max === 0 ? 0 : body.max * most, min: body.min * tree.min };
      }
      default: {
        return tree satisfies never;
      }
    }
  };
  const lengths = read();
  lengthsCache.set(tree, lengths);

  return lengths;
};

/**
 * Whether a tree's language holds the empty word.
 *
 * @param tree - The tree.
 * @returns Whether it is nullable.
 */
const admitsEmpty = (tree: Regex): boolean => lengthsOf(tree).min === 0;

/**
 * Every character a tree's words may hold: the union of its sets.
 *
 * @param tree - The tree.
 * @returns Its alphabet.
 */
const alphabetOf = (tree: Regex): CodeSet => {
  switch (tree._tag) {
    case "chars": {
      return tree.set;
    }
    case "seq": {
      return union(...tree.parts.map(alphabetOf));
    }
    case "alt": {
      return union(...tree.arms.map(alphabetOf));
    }
    case "repeat": {
      return alphabetOf(tree.body);
    }
    default: {
      return tree satisfies never;
    }
  }
};

/**
 * Every character a tree's words may begin with.
 *
 * @param tree - The tree.
 * @returns The union of its first positions' sets.
 */
const firstSetOf = (tree: Regex): CodeSet => {
  switch (tree._tag) {
    case "chars": {
      return tree.set;
    }
    case "seq": {
      const reached = tree.parts.findIndex((part) => !admitsEmpty(part));

      return union(
        ...(reached === -1 ? tree.parts : tree.parts.slice(0, reached + 1)).map(firstSetOf),
      );
    }
    case "alt": {
      return union(...tree.arms.map(firstSetOf));
    }
    case "repeat": {
      return firstSetOf(tree.body);
    }
    default: {
      return tree satisfies never;
    }
  }
};

/**
 * A tree's mirror image: every sequence's parts in the reverse order, so its language is the
 * reversal of every word.
 *
 * @param tree - The tree.
 * @returns The reversed tree.
 */
const reversed = (tree: Regex): Regex => {
  switch (tree._tag) {
    case "chars": {
      return tree;
    }
    case "seq": {
      return seq(...tree.parts.map(reversed).toReversed());
    }
    case "alt": {
      return alt(...tree.arms.map(reversed));
    }
    case "repeat": {
      return repeat(reversed(tree.body), tree.min, tree.max);
    }
    default: {
      return tree satisfies never;
    }
  }
};

/**
 * Narrow a tree to its nonempty words whose first character is in a set, exactly, by the shape of
 * the tree: a set keeps the characters both hold; an alternation narrows each arm; a sequence's
 * word begins in its first part, or, where that part may be empty, in the rest; and a nonempty
 * word of `body{m,M}` is a nonempty word of `body` that begins it, then `body{max(m-1,0),M-1}`
 * (where `body` may be empty, `body{m,M}` is `body{0,M}`, so the iterations before the first
 * nonempty one drop out and the count still fits). A tree whose words are all nonempty and begin
 * in the set is itself.
 *
 * This is how a word is held to begin with a character that is not whitespace without asserting
 * it: the narrowed tree matches exactly the words the assertion would let through.
 *
 * @param tree - The tree.
 * @param set - The characters a word may begin with.
 * @returns The narrowed tree.
 */
const firstIn = (tree: Regex, set: CodeSet): Regex => {
  const first = firstSetOf(tree);
  if (!admitsEmpty(tree) && sameSet(intersect(first, set), first)) {
    return tree;
  }

  switch (tree._tag) {
    case "chars": {
      return chars(intersect(tree.set, set));
    }
    case "seq": {
      const [head, ...rest] = tree.parts;
      if (head === undefined) {
        return nothing;
      }

      const tail = seq(...rest);

      return alt(seq(firstIn(head, set), tail), admitsEmpty(head) ? firstIn(tail, set) : nothing);
    }
    case "alt": {
      return alt(...tree.arms.map((arm) => firstIn(arm, set)));
    }
    case "repeat": {
      return seq(
        firstIn(tree.body, set),
        repeat(tree.body, Math.max(tree.min - 1, 0), tree.max.pipe(Option.map((most) => most - 1))),
      );
    }
    default: {
      return tree satisfies never;
    }
  }
};

/**
 * Narrow a tree to its nonempty words whose last character is in a set: {@link firstIn} of its
 * mirror image, mirrored back.
 *
 * @param tree - The tree.
 * @param set - The characters a word may end with.
 * @returns The narrowed tree.
 */
const lastIn = (tree: Regex, set: CodeSet): Regex => reversed(firstIn(reversed(tree), set));

/**
 * The most positions a tree's automaton is built with ({@link automatonOf}) when an intersection
 * decides an inclusion ({@link includedIn}) or builds a deterministic automaton ({@link dfaOf}).
 * Past it an inclusion is left unanswered, which only keeps a product from being simplified, and no
 * automaton is built; the widest tree an intersection reads today, MathML's `unsigned-integer`
 * bound, has a few hundred.
 */
const automatonPositions = 20_000;

/**
 * The most pairs of automaton states an inclusion question explores before it is left unanswered.
 */
const inclusionStates = 100_000;

/**
 * Whether a repetition may run its body twice in a row: it is unbounded, or its most is 2 or more.
 *
 * @param tree - The repetition.
 * @returns Whether one iteration may follow another.
 */
const repeats = (tree: Extract<Regex, { readonly _tag: "repeat" }>): boolean =>
  !Option.exists(tree.max, (most) => most < 2);

/**
 * The positions of a tree once each counted repetition is written out: what its automaton holds.
 *
 * @param tree - The tree.
 * @returns The count.
 */
const positionsOf = (tree: Regex): number => {
  switch (tree._tag) {
    case "chars": {
      return 1;
    }
    case "seq": {
      return tree.parts.reduce((total, part) => total + positionsOf(part), 0);
    }
    case "alt": {
      return tree.arms.reduce((total, arm) => total + positionsOf(arm), 0);
    }
    case "repeat": {
      // `{n,}` is written out as n copies and one starred copy, `{n,m}` as m copies.
      return (
        positionsOf(tree.body) *
        Option.match(tree.max, { onNone: () => tree.min + 1, onSome: (most) => most })
      );
    }
    default: {
      return tree satisfies never;
    }
  }
};

/**
 * Read an automaton's entry at a number its construction gave it: a position's set or successors,
 * a state's moves, block or acceptance.
 *
 * @param entries - The entries, by number.
 * @param at - The number.
 * @returns The entry.
 * @throws {Error} When no entry has the number: an automaton read past its own positions or
 *   states, a defect of its construction.
 */
const entryAt = <A>(entries: readonly A[], at: number): A =>
  Option.getOrThrowWith(
    Arr.get(entries, at),
    () =>
      new Error(
        `An automaton reads its entry ${String(at)} of ${String(entries.length)}, which its construction did not make.`,
      ),
  );

/**
 * A tree's position automaton (Glushkov's), each counted repetition written out: one position per
 * character set, the positions a word may begin and end at, whether it may be empty, and the
 * positions that may follow each. Every position lies on some word, since no subtree of a tree the
 * constructors build is {@link nothing}.
 */
interface Automaton {
  readonly first: readonly number[];
  readonly follow: readonly (readonly number[])[];
  readonly last: ReadonlySet<number>;
  readonly nullable: boolean;
  readonly sets: readonly CodeSet[];
}

/**
 * The first and last positions of a subtree's automaton, and whether it may be empty.
 */
interface Fragment {
  readonly first: readonly number[];
  readonly last: readonly number[];
  readonly nullable: boolean;
}

/**
 * Build a tree's {@link Automaton}: `body{m,M}` as `m` copies of `body` and `M - m` optional ones,
 * `body{m,}` as `m` copies and one that loops.
 *
 * @param tree - The tree.
 * @returns Its automaton.
 */
const automatonOf = (tree: Regex): Automaton => {
  const sets: CodeSet[] = [];
  const follow: Set<number>[] = [];
  const link = (from: readonly number[], to: readonly number[]): void => {
    for (const at of from) {
      for (const next of to) {
        entryAt(follow, at).add(next);
      }
    }
  };
  const sequence = (parts: readonly (() => Fragment)[]): Fragment => {
    let left: Fragment = { first: [], last: [], nullable: true };
    for (const part of parts) {
      const right = part();
      link(left.last, right.first);
      left = {
        first: left.nullable ? [...left.first, ...right.first] : left.first,
        last: right.nullable ? [...left.last, ...right.last] : right.last,
        nullable: left.nullable && right.nullable,
      };
    }

    return left;
  };
  const build = (node: Regex): Fragment => {
    switch (node._tag) {
      case "chars": {
        sets.push(node.set);
        follow.push(new Set());

        return { first: [sets.length - 1], last: [sets.length - 1], nullable: false };
      }
      case "seq": {
        return sequence(node.parts.map((part) => () => build(part)));
      }
      case "alt": {
        const arms = node.arms.map(build);

        return {
          first: arms.flatMap(({ first }) => first),
          last: arms.flatMap(({ last }) => last),
          nullable: arms.some((arm) => arm.nullable),
        };
      }
      case "repeat": {
        const once = (): Fragment => build(node.body);
        const optional = (): Fragment => ({ ...build(node.body), nullable: true });
        const looped = (): Fragment => {
          const body = build(node.body);
          link(body.last, body.first);

          return { ...body, nullable: true };
        };
        const more = Option.match(node.max, {
          onNone: () => [looped],
          onSome: (most) => Array.from({ length: most - node.min }, () => optional),
        });

        return sequence([...Array.from({ length: node.min }, () => once), ...more]);
      }
      default: {
        return node satisfies never;
      }
    }
  };
  const whole = build(tree);

  return {
    first: whole.first,
    follow: follow.map((next) => [...next].toSorted((a, b) => a - b)),
    last: new Set(whole.last),
    nullable: whole.nullable,
    sets,
  };
};

/**
 * One past the last code point, U+10FFFF: where the code space's last run ends.
 */
const codeSpaceEnd = 0x11_00_00;

/**
 * One code point of each run of the code space on which a family of sets each either holds every
 * point or none: the start of every run of every set, and the point after its end.
 *
 * @param sets - The sets.
 * @returns The points, ascending.
 */
const representatives = (sets: readonly CodeSet[]): readonly number[] =>
  [...new Set(sets.flatMap((set) => set.flatMap(([lo, hi]) => [lo, hi + 1])))].toSorted(
    (a, b) => a - b,
  );

/**
 * A state of an automaton's subset construction: the start, or the positions a word read so far
 * may have ended at, ascending.
 */
type Subset = readonly number[] | "start";

/**
 * The positions a word may reach next from a state: the automaton's first positions from the
 * start, else every position that may follow one of the state's.
 *
 * @param automaton - The automaton.
 * @param state - The state.
 * @returns The positions, ascending.
 */
const successorsOf = (automaton: Automaton, state: Subset): readonly number[] =>
  [
    ...new Set(
      state === "start" ? automaton.first : state.flatMap((at) => entryAt(automaton.follow, at)),
    ),
  ].toSorted((a, b) => a - b);

/**
 * Whether a word that leaves an automaton in a state is one of its words.
 *
 * @param automaton - The automaton.
 * @param state - The state.
 * @returns Whether the state accepts.
 */
const acceptsAt = (automaton: Automaton, state: Subset): boolean =>
  state === "start" ? automaton.nullable : state.some((at) => automaton.last.has(at));

/**
 * Whether every word of one tree is a word of another, decided on their automata by the subset
 * construction run over both at once: the inclusion fails at a reachable pair of states where the
 * first accepts and the second does not, or where the first may still read a character the second
 * cannot (every position lies on a word). Exact where it answers; a question past
 * {@link automatonPositions} or {@link inclusionStates} is answered `false`, which only keeps an
 * intersection from being simplified.
 *
 * @param small - The tree that may be included.
 * @param big - The tree that may include it.
 * @returns Whether `small`'s language is included in `big`'s.
 */
const includedIn = (small: Regex, big: Regex): boolean => {
  if (positionsOf(small) > automatonPositions || positionsOf(big) > automatonPositions) {
    return false;
  }

  const mine = automatonOf(small);
  const theirs = automatonOf(big);
  const queue: (readonly [Subset, Subset])[] = [["start", "start"]];
  const seen = new Set<string>();
  for (const [left, right] of queue) {
    if (acceptsAt(mine, left) && !acceptsAt(theirs, right)) {
      return false;
    }

    const fromLeft = successorsOf(mine, left);
    const fromRight = successorsOf(theirs, right);
    const candidates = [
      ...fromLeft.map((at) => entryAt(mine.sets, at)),
      ...fromRight.map((at) => entryAt(theirs.sets, at)),
    ];
    for (const point of representatives(candidates)) {
      const toLeft = fromLeft.filter((at) => holds(entryAt(mine.sets, at), point));
      const toRight = fromRight.filter((at) => holds(entryAt(theirs.sets, at), point));
      const key = `${toLeft.join(",")}|${toRight.join(",")}`;
      if (toLeft.length > 0 && !seen.has(key)) {
        if (toRight.length === 0 || seen.size >= inclusionStates) {
          return false;
        }

        seen.add(key);
        queue.push([toLeft, toRight]);
      }
    }
  }

  return true;
};

/**
 * A deterministic automaton over code points: state 0 the start, each state's moves as disjoint
 * sets, each with the state it leads to (a character no move holds leads to no word), and which
 * states accept.
 */
interface Dfa {
  readonly accepting: readonly boolean[];
  readonly moves: readonly (readonly (readonly [CodeSet, number])[])[];
}

/**
 * The most states a language's automaton is built with ({@link dfaOf}) before a product refuses
 * to track it.
 */
const dfaStates = 256;

/**
 * The most positions a product ({@link tracked}) may be written with, counted by
 * {@link positionsOf}: grizzle's `regexMaxPositions` (`core/limits.ts`, 4,096 NFA positions once
 * counted repetitions are written out), past which its admission refuses a pattern, so a product
 * past it is refused here, naming the reason.
 */
const productPositions = 4096;

/**
 * Merge the states of an automaton that accept alike and move alike (Moore's refinement), each
 * block numbered by the first state in it, so the start stays state 0.
 *
 * @param dfa - The automaton.
 * @returns The minimal automaton of its language.
 */
const minimized = (dfa: Dfa): Dfa => {
  const refine = (partition: readonly number[]): readonly number[] => {
    const numbering = new Map<string, number>();
    const next = dfa.moves.map((moves, state) => {
      const byBlock = new Map<number, CodeRange[]>();
      for (const [set, target] of moves) {
        byBlock.getOrInsertComputed(entryAt(partition, target), () => []).push(...set);
      }

      const signature = `${entryAt(partition, state)}/${[...byBlock]
        .toSorted(([a], [b]) => a - b)
        .map(([block, runs]) => `${block}:${JSON.stringify(setOf(runs))}`)
        .join(";")}`;

      return numbering.getOrInsertComputed(signature, () => numbering.size);
    });

    return new Set(next).size === new Set(partition).size ? next : refine(next);
  };
  const merged = refine(dfa.accepting.map((accepts) => (accepts ? 1 : 0)));
  const count = new Set(merged).size;
  const representative = Array.from({ length: count }, (_, block) => merged.indexOf(block));

  return {
    accepting: representative.map((state) => entryAt(dfa.accepting, state)),
    moves: representative.map((state) => {
      const byBlock = new Map<number, CodeRange[]>();
      for (const [set, target] of entryAt(dfa.moves, state)) {
        byBlock.getOrInsertComputed(entryAt(merged, target), () => []).push(...set);
      }

      return [...byBlock].map(([block, runs]): readonly [CodeSet, number] => [setOf(runs), block]);
    }),
  };
};

/**
 * A tree's minimal deterministic automaton, by the subset construction over its position
 * automaton, or none past {@link automatonPositions} positions or {@link dfaStates} states.
 *
 * @param tree - The tree.
 * @returns The automaton.
 */
const dfaOf = (tree: Regex): Option.Option<Dfa> => {
  if (positionsOf(tree) > automatonPositions) {
    return Option.none();
  }

  const automaton = automatonOf(tree);
  const states: Subset[] = ["start"];
  const numbered = new Map<string, number>([["start", 0]]);
  const moves: (readonly (readonly [CodeSet, number])[])[] = [];
  for (const state of states) {
    if (states.length > dfaStates) {
      return Option.none();
    }

    const candidates = successorsOf(automaton, state);
    const points = representatives(candidates.map((at) => entryAt(automaton.sets, at)));
    const byTarget = new Map<number, CodeRange[]>();
    // Each point's run ends before the next point, the last's at the code space's end.
    for (const [point, after] of Arr.zip(points, [...points.slice(1), codeSpaceEnd])) {
      const next = candidates.filter((at) => holds(entryAt(automaton.sets, at), point));
      if (next.length > 0) {
        const target = numbered.getOrInsertComputed(next.join(","), () => {
          states.push(next);

          return states.length - 1;
        });
        byTarget.getOrInsertComputed(target, () => []).push([point, after - 1]);
      }
    }

    moves.push(
      [...byTarget].map(([target, runs]): readonly [CodeSet, number] => [setOf(runs), target]),
    );
  }

  return Option.some(
    minimized({ accepting: states.map((state) => acceptsAt(automaton, state)), moves }),
  );
};

/**
 * What a subtree's words do to an automaton from one state: each state they may lead to, with the
 * tree of the words that lead there.
 */
type Reads = ReadonlyMap<number, Regex>;

/**
 * The tree of the words a subtree's reading leads to a state: {@link nothing} where none leads
 * there, since a reading holds a state exactly when some word leads to it.
 *
 * @param reads - The trees, by the state they lead to.
 * @param state - The state.
 * @returns The tree.
 */
const wordsTo = (reads: Reads, state: number): Regex =>
  Option.match(Option.fromNullishOr(reads.get(state)), {
    onNone: () => nothing,
    onSome: (tree) => tree,
  });

/**
 * Add a tree of words to those that lead to a state, unless it has no word.
 *
 * @param into - The trees, by the state they lead to.
 * @param state - The state.
 * @param piece - The tree.
 */
const joinAt = (into: Map<number, Regex>, state: number, piece: Regex): void => {
  if (!isNothing(piece)) {
    into.set(state, alt(wordsTo(into, state), piece));
  }
};

/**
 * What a sequence's words do from a state: each part read from each state the parts before it
 * lead to, its pieces joined state to state.
 *
 * @param parts - The parts.
 * @param state - The state the first part starts in.
 * @param read - What one subtree's words do from a state.
 * @returns The trees of the sequence's words, by the state they lead to.
 */
const sequenceFrom = (
  parts: readonly Regex[],
  state: number,
  read: (node: Regex, from: number) => Reads,
): Map<number, Regex> => {
  let reached = new Map<number, Regex>([[state, empty]]);
  for (const part of parts) {
    const next = new Map<number, Regex>();
    for (const [from, before] of reached) {
      for (const [to, piece] of read(part, from)) {
        joinAt(next, to, seq(before, piece));
      }
    }

    reached = next;
  }

  return reached;
};

/**
 * What `body*` does from a state, by Kleene's construction: the states its nonempty iterations
 * reach, then, through each of them in turn, the words of one or more iterations from each to
 * each, and the empty word at the state itself.
 *
 * @param body - The repeated tree.
 * @param state - The state.
 * @param read - What one subtree's words do from a state.
 * @returns The trees of the repetition's words, by the state they lead to.
 */
const closureFrom = (
  body: Regex,
  state: number,
  read: (node: Regex, from: number) => Reads,
): Reads => {
  const once = firstIn(body, xmlChar);
  const reached = [state];
  for (const from of reached) {
    for (const to of read(once, from).keys()) {
      if (!reached.includes(to)) {
        reached.push(to);
      }
    }
  }

  let paths = reached.map((from) => reached.map((to) => wordsTo(read(once, from), to)));
  for (const [via] of reached.entries()) {
    const before = paths;
    const through = entryAt(before, via);
    const loop = star(entryAt(through, via));
    paths = before.map((row) =>
      row.map((cell, to) => alt(cell, seq(entryAt(row, via), loop, entryAt(through, to)))),
    );
  }

  // The state itself is the first one reached, so the first row holds the words from it.
  const fromState = entryAt(paths, 0);
  const out = new Map<number, Regex>([[state, opt(entryAt(fromState, 0))]]);
  for (const [to, words] of Arr.zip(reached, fromState)) {
    if (to !== state) {
      joinAt(out, to, words);
    }
  }

  return out;
};

/**
 * The words of a tree that an automaton accepts, as one tree, exactly: each subtree is read from
 * each state it may start in, into the states its words lead to, the tree's own shape kept. A set
 * splits by the automaton's moves; an alternation reads arm by arm; a sequence part after part
 * ({@link sequenceFrom}); a counted repetition as one iteration then the rest, and the empty word
 * where it may run no time; and an unbounded one by Kleene's construction ({@link closureFrom}). A
 * subtree every character of which keeps the automaton where it is stays whole.
 *
 * @param tree - The tree.
 * @param dfa - The automaton.
 * @returns The tree of the intersection, {@link nothing} where it has no word.
 */
const tracked = (tree: Regex, dfa: Dfa): Regex => {
  const memo = new Map<Regex, Map<number, Reads>>();
  const tails = new Map<Regex, Regex>();
  const loops = dfa.moves.map((moves, state) =>
    setOf(moves.filter(([, target]) => target === state).flatMap(([set]) => set)),
  );
  const after = (node: Regex, state: number): Reads =>
    memo
      .getOrInsertComputed(node, () => new Map())
      .getOrInsertComputed(state, () => {
        const alphabet = alphabetOf(node);
        let read: Reads = new Map([[state, node]]);
        if (!sameSet(intersect(alphabet, entryAt(loops, state)), alphabet)) {
          switch (node._tag) {
            case "chars": {
              const out = new Map<number, Regex>();
              for (const [set, to] of entryAt(dfa.moves, state)) {
                joinAt(out, to, chars(intersect(node.set, set)));
              }

              read = out;
              break;
            }
            case "alt": {
              const out = new Map<number, Regex>();
              for (const arm of node.arms) {
                for (const [to, piece] of after(arm, state)) {
                  joinAt(out, to, piece);
                }
              }

              read = out;
              break;
            }
            case "seq": {
              read = sequenceFrom(node.parts, state, after);
              break;
            }
            case "repeat": {
              if (node.min === 0 && Option.isNone(node.max)) {
                read = closureFrom(node.body, state, after);
                break;
              }

              const tail = tails.getOrInsertComputed(node, () =>
                repeat(
                  node.body,
                  Math.max(node.min - 1, 0),
                  node.max.pipe(Option.map((most) => most - 1)),
                ),
              );

              const out = sequenceFrom([node.body, tail], state, after);
              if (node.min === 0) {
                joinAt(out, state, empty);
              }

              read = out;
              break;
            }
            default: {
              read = node satisfies never;
            }
          }
        }

        return read;
      });

  return alt(
    ...[...after(tree, 0)].flatMap(([state, words]) =>
      entryAt(dfa.accepting, state) ? [words] : [],
    ),
  );
};

/**
 * Narrow two trees to the characters both may hold, until neither alphabet shrinks: a word of the
 * intersection reads only characters both languages may read, so each tree keeps exactly its
 * words over that common alphabet ({@link mapSets}, each character of a word read by one set), and
 * the intersection is unchanged.
 *
 * @param left - A tree.
 * @param right - A tree.
 * @returns The two trees, narrowed.
 */
const narrowed = (left: Regex, right: Regex): readonly [Regex, Regex] => {
  const mine = alphabetOf(left);
  const theirs = alphabetOf(right);
  const common = intersect(intersect(xmlChar, mine), theirs);
  if (sameSet(mine, common) && sameSet(theirs, common)) {
    return [left, right];
  }

  const narrow = (tree: Regex): Regex => mapSets(tree, (set) => chars(intersect(set, common)));

  return narrowed(narrow(left), narrow(right));
};

/**
 * The intersection of two languages, as one tree of their product, exactly or not at all:
 *
 * 1. Both narrow to their common alphabet ({@link narrowed}).
 * 2. Where one now includes the other ({@link includedIn}), the intersection is the included one;
 *    where each includes the other, the one of fewer positions, the first on a tie.
 * 3. Otherwise it is one read through the other's minimal automaton ({@link tracked}), the automaton
 *    of fewer states: a fixed sequence of sets, such as `[0-9]{4}-[0-9]{2}-[0-9]{2}`, is a chain of
 *    states, and the product cuts the other to its columns.
 *
 * It is refused, never approximated, where neither automaton is built within {@link dfaStates}
 * states, or where the product would be written past {@link productPositions} positions: grizzle's
 * grammar has no lookahead to assert both over one span.
 *
 * @param left - A tree.
 * @param right - A tree.
 * @returns The tree of the words of both, or an {@link UnreadDefinition}.
 */
const intersectTwo = (left: Regex, right: Regex): Result.Result<Regex, UnreadDefinition> => {
  const [mine, theirs] = narrowed(left, right);
  if (isNothing(mine) || isNothing(theirs)) {
    return Result.succeed(nothing);
  }

  const mineInTheirs = includedIn(mine, theirs);
  const theirsInMine = includedIn(theirs, mine);
  if (mineInTheirs && theirsInMine) {
    return Result.succeed(positionsOf(theirs) < positionsOf(mine) ? theirs : mine);
  }

  if (mineInTheirs || theirsInMine) {
    return Result.succeed(mineInTheirs ? mine : theirs);
  }

  const theirsDfa = dfaOf(theirs);
  const mineDfa = dfaOf(mine);
  const product = Option.match(theirsDfa, {
    onNone: () => mineDfa.pipe(Option.map((dfa) => tracked(theirs, dfa))),
    onSome: (dfa) =>
      Option.some(
        Option.match(mineDfa, {
          onNone: () => tracked(mine, dfa),
          onSome: (other) =>
            other.moves.length < dfa.moves.length ? tracked(theirs, other) : tracked(mine, dfa),
        }),
      ),
  });
  if (Option.isNone(product)) {
    return refuse(
      `an intersection of two languages neither of whose automata has at most ${dfaStates} states, which no one pattern without lookahead is built for`,
    );
  }

  return positionsOf(product.value) > productPositions
    ? refuse(
        `an intersection whose product pattern needs more than ${productPositions} positions, grizzle's regexMaxPositions, written out`,
      )
    : Result.succeed(product.value);
};

/**
 * The intersection of languages, as one tree ({@link intersectTwo}, left to right). The
 * intersection of none is every value, {@link anything}.
 *
 * @param arms - The trees.
 * @returns The tree of the words of every one, or an {@link UnreadDefinition}.
 */
const intersection = (arms: readonly Regex[]): Result.Result<Regex, UnreadDefinition> =>
  Arr.matchLeft(arms, {
    onEmpty: () => Result.succeed(anything),
    onNonEmpty: (first, rest) =>
      Result.gen(function* intersectionBody() {
        let held = first;
        for (const arm of rest) {
          held = yield* intersectTwo(held, arm);
        }

        return held;
      }),
  });

/**
 * The lexical part of an atomic definition, before its whitespace class is folded in and before its
 * enumeration narrows it: its lexical space ({@link lexicalOf}) intersected with each pattern set
 * nothing else implies, then with its lengths, as one tree ({@link intersection}).
 *
 * A string's or `anySimpleType`'s lexical space holds every value, so a pattern set implies it. A
 * set another set's shape includes is implied by it (`\i\c*` by `[\i-[:]][\c-[:]]*`), and an
 * integer's interval implies the integer built-in's own set.
 *
 * @param domain - The atomic definition, its enumeration aside.
 * @returns The tree and the bound its typed value keeps.
 */
const atomicCore = (
  domain: Extract<Domain, { readonly _tag: "atomic" }>,
): Result.Result<
  { readonly bound: Option.Option<DoubleBound>; readonly tree: Regex },
  CompileError
> =>
  Result.gen(function* atomicCoreBody() {
    const { facets } = domain;
    const lexical = yield* lexicalOf(domain);
    const integer = Option.isSome(valueOf(facets, "fractionDigits"));
    const sets: Regex[] = [];
    for (const set of domain.patterns.filter((held) => !(integer && isIntegerPattern(held)))) {
      const arms: Regex[] = [];
      for (const source of set) {
        arms.push(yield* readPattern(source));
      }

      sets.push(alt(...arms));
    }

    const kept = sets.filter(
      (set, index) =>
        !sets.some(
          (other, at) =>
            at !== index && includes(set, other) && (!includes(other, set) || at < index),
        ),
    );
    const implied = isAnything(lexical.tree) && kept.length > 0;
    const constraints = [...(implied ? [] : [lexical.tree]), ...kept];
    const { max, min, stated } = lengthBounds(facets);
    const lengths = stated ? [repeat(chars(xmlChar), min, max)] : [];
    const arms = [
      ...constraints.filter((tree) => !(lengths.length > 0 && isAnything(tree))),
      ...lengths,
    ];

    return { bound: lexical.bound, tree: yield* intersection(arms) };
  });

/**
 * Fold `replace` into a tree: a set that holds the space also holds tab, line feed and carriage
 * return, and a set that does not holds none of them.
 *
 * @param tree - The language after normalization.
 * @returns The language as written.
 */
const foldReplace = (tree: Regex): Regex =>
  mapSets(tree, (set) =>
    chars(holds(set, spacePoint) ? union(set, breaks) : subtract(set, breaks)),
  );

/**
 * What the collapse fold needs to know of a language: whether a word may be empty, begin or end
 * with a space, or hold two spaces together.
 */
interface Spaces {
  readonly doubled: boolean;
  readonly first: boolean;
  readonly last: boolean;
  readonly nullable: boolean;
}

/**
 * Read where a tree's words may hold a space, by Glushkov's first, last and follow sets: sound, so
 * a `false` is a proof.
 *
 * @param tree - The tree, its sets free of tab, line feed and carriage return.
 * @returns What its words may do.
 */
const spacesOf = (tree: Regex): Spaces => {
  switch (tree._tag) {
    case "chars": {
      const space = holds(tree.set, spacePoint);

      return { doubled: false, first: space, last: space, nullable: false };
    }
    case "seq": {
      let left: Spaces = { doubled: false, first: false, last: false, nullable: true };
      for (const right of tree.parts.map(spacesOf)) {
        left = {
          doubled: left.doubled || right.doubled || (left.last && right.first),
          first: left.first || (left.nullable && right.first),
          last: right.last || (right.nullable && left.last),
          nullable: left.nullable && right.nullable,
        };
      }

      return left;
    }
    case "alt": {
      const arms = tree.arms.map(spacesOf);

      return {
        doubled: arms.some(({ doubled }) => doubled),
        first: arms.some(({ first }) => first),
        last: arms.some(({ last }) => last),
        nullable: arms.some(({ nullable }) => nullable),
      };
    }
    case "repeat": {
      const body = spacesOf(tree.body);
      const loops = repeats(tree);

      return {
        doubled: body.doubled || (loops && body.last && body.first),
        first: body.first,
        last: body.last,
        nullable: tree.min === 0 || body.nullable,
      };
    }
    default: {
      return tree satisfies never;
    }
  }
};

/**
 * Turn each space a tree admits into a run of whitespace, the image of the language under
 * collapsing's inverse inside a value. A set that holds the space and is one whole iteration of an
 * unbounded repetition whose least count is at most 1 (reached through alternations alone) admits
 * any whitespace character in its place, since each is then an iteration of its own; any other
 * admits a run of whitespace in its place. So no run is repeated inside a repetition, which a
 * backtracking host would read in exponential time.
 *
 * @param tree - The tree, its sets free of tab, line feed and carriage return.
 * @param inRun - Whether the tree is one whole iteration of such a repetition.
 * @returns The tree as written.
 */
const spacesToRuns = (tree: Regex, inRun = false): Regex => {
  switch (tree._tag) {
    case "chars": {
      if (!holds(tree.set, spacePoint)) {
        return tree;
      }

      if (inRun) {
        return chars(union(tree.set, whitespace));
      }

      const rest = subtract(tree.set, whitespace);

      return rest.length === 0 ? plus(whitespaceChar) : alt(plus(whitespaceChar), chars(rest));
    }
    case "seq": {
      return seq(...tree.parts.map((part) => spacesToRuns(part)));
    }
    case "alt": {
      return alt(...tree.arms.map((arm) => spacesToRuns(arm, inRun)));
    }
    case "repeat": {
      return repeat(
        spacesToRuns(tree.body, Option.isNone(tree.max) && tree.min <= 1),
        tree.min,
        tree.max,
      );
    }
    default: {
      return tree satisfies never;
    }
  }
};

/**
 * An unbounded repetition a position is one whole iteration of, and its least count.
 */
interface Run {
  readonly min: number;
}

/**
 * One character position of a tree, as Glushkov's construction numbers them: whether its set holds
 * the space, and the unbounded repetition it is one whole iteration of, if any (reached through
 * alternations alone), so that a word may hold one iteration fewer.
 */
interface SpacePosition {
  readonly run: Option.Option<Run>;
  readonly space: boolean;
}

/**
 * Glushkov's sets of a tree over its positions: whether it is nullable, its first and last
 * positions, and the pairs of positions one of its words may hold one after the other.
 */
interface Glushkov {
  readonly first: readonly SpacePosition[];
  readonly follow: readonly (readonly [SpacePosition, SpacePosition])[];
  readonly last: readonly SpacePosition[];
  readonly nullable: boolean;
}

/**
 * Compute Glushkov's sets of a tree.
 *
 * @param tree - The tree.
 * @param run - The unbounded repetition whose one iteration the tree is, through alternations.
 * @returns Its sets.
 */
const glushkovOf = (tree: Regex, run: Option.Option<Run> = Option.none()): Glushkov => {
  switch (tree._tag) {
    case "chars": {
      const position: SpacePosition = { run, space: holds(tree.set, spacePoint) };

      return { first: [position], follow: [], last: [position], nullable: false };
    }
    case "seq": {
      let left: Glushkov = { first: [], follow: [], last: [], nullable: true };
      for (const right of tree.parts.map((part) => glushkovOf(part))) {
        left = {
          first: left.nullable ? [...left.first, ...right.first] : left.first,
          follow: [
            ...left.follow,
            ...right.follow,
            ...left.last.flatMap((from) => right.first.map((to) => [from, to] as const)),
          ],
          last: right.nullable ? [...left.last, ...right.last] : right.last,
          nullable: left.nullable && right.nullable,
        };
      }

      return left;
    }
    case "alt": {
      const arms = tree.arms.map((arm) => glushkovOf(arm, run));

      return {
        first: arms.flatMap(({ first }) => first),
        follow: arms.flatMap(({ follow }) => follow),
        last: arms.flatMap(({ last }) => last),
        nullable: arms.some(({ nullable }) => nullable),
      };
    }
    case "repeat": {
      const own: Option.Option<Run> = Option.isNone(tree.max)
        ? Option.some({ min: tree.min })
        : Option.none();
      const inner = glushkovOf(tree.body, own);
      const loops = repeats(tree);

      return {
        first: inner.first,
        follow: [
          ...inner.follow,
          ...(loops
            ? inner.last.flatMap((from) => inner.first.map((to) => [from, to] as const))
            : []),
        ],
        last: inner.last,
        nullable: tree.min === 0 || inner.nullable,
      };
    }
    default: {
      return tree satisfies never;
    }
  }
};

/**
 * Whether a position is a whole iteration of a repetition that may run zero times, so a word may
 * give it up.
 *
 * @param position - The position.
 * @returns Whether it may be dropped.
 */
const droppable = (position: SpacePosition): boolean =>
  Option.exists(position.run, ({ min }) => min === 0);

/**
 * Whether merging two spaces that stand together keeps a word in a tree's language, by its shape.
 * Two space positions may stand together safely when both are whole iterations of one unbounded
 * repetition whose least count is at most 1 (two adjacent iterations become one, which the count
 * still allows), or when either is a whole iteration of a repetition whose least count is 0 (it
 * gives up that iteration). Sound, so a `true` is a proof.
 *
 * @param tree - The tree, its sets free of tab, line feed and carriage return.
 * @returns Whether every word's spaces may be merged.
 */
const mergeSafe = (tree: Regex): boolean =>
  glushkovOf(tree).follow.every(([from, to]) => {
    const sameRun =
      Option.isSome(from.run) &&
      Option.isSome(to.run) &&
      from.run.value === to.run.value &&
      from.run.value.min <= 1;

    return !from.space || !to.space || sameRun || droppable(from) || droppable(to);
  });

/**
 * Fold `collapse` into a tree: whitespace at either end, a run wherever a word holds a space, and
 * no tab, line feed or carriage return elsewhere.
 *
 * Where no word may begin or end with a space or hold two together, that is the whole fold. Where
 * one may, a raw form's core must also begin and end with a character that is not whitespace,
 * since collapsing removes every space at an edge, so a word that holds one there is never what a
 * collapse yields (`" ?q"` is a URI reference by RFC 2396, `"?q"` is not): the core is the runs'
 * tree narrowed to its nonempty words whose first and last characters are no whitespace
 * ({@link firstIn}, {@link lastIn}). Where two spaces may stand together, merging them must keep
 * the word in the language, which {@link mergeSafe} proves of the tree or the definition is
 * refused. A value of whitespace alone collapses to the empty word.
 *
 * @param tree - The language after collapsing.
 * @returns The language as written, or an {@link UnreadDefinition} when merging two spaces may
 *   leave the language.
 */
const foldCollapse = (tree: Regex): Result.Result<Regex, UnreadDefinition> => {
  if (isAnything(tree)) {
    return Result.succeed(anything);
  }

  const collapsed = mapSets(tree, (set) => chars(subtract(set, breaks)));
  const spaces = spacesOf(collapsed);
  if (spaces.doubled && !mergeSafe(collapsed)) {
    return refuse("a collapsed language whose words may hold two spaces that do not merge");
  }

  if (!spaces.first && !spaces.last) {
    return Result.succeed(seq(anyWhitespace, spacesToRuns(collapsed), anyWhitespace));
  }

  const solid = subtract(xmlChar, whitespace);
  const core = firstIn(lastIn(spacesToRuns(collapsed), solid), solid);

  return Result.succeed(
    alt(seq(anyWhitespace, core, anyWhitespace), ...(spaces.nullable ? [anyWhitespace] : [])),
  );
};

/**
 * Narrow a tree to the words a list item may be: no whitespace, and not empty, exactly.
 *
 * A word holds no whitespace exactly when each of its characters, each read by one set of the
 * tree, is outside the whitespace, so the tree with whitespace taken out of every set keeps exactly
 * its whitespace-free words; a set the reader built from `.`, `\s`, `\S` or a negated class is a
 * set like any other, so none of them can still read a space. Of those words, the nonempty ones
 * are {@link firstIn} over every character, or, for a repetition of a body with no empty word, the
 * repetition counted from one.
 *
 * @param tree - The item type's language.
 * @returns The language of its tokens.
 */
const asToken = (tree: Regex): Regex => {
  const bare = mapSets(tree, (set) => chars(subtract(set, whitespace)));
  if (!admitsEmpty(bare)) {
    return bare;
  }

  if (bare._tag === "repeat" && bare.min === 0 && !admitsEmpty(bare.body)) {
    return repeat(bare.body, 1, bare.max);
  }

  return firstIn(bare, xmlChar);
};

/**
 * The characters a pattern escapes outside a bracket expression: the metacharacters both dialects
 * read.
 */
const outsideMeta: ReadonlySet<string> = new Set("\\^$.|?*+()[]{}");

/**
 * The characters a pattern escapes inside a bracket expression.
 */
const insideMeta: ReadonlySet<string> = new Set("\\]^-[");

/**
 * The code points both dialects write as a letter escape: tab, line feed and carriage return.
 */
const pointEscapes = new Map<number, string>([
  [0x9, String.raw`\t`],
  [0xa, String.raw`\n`],
  [0xd, String.raw`\r`],
]);

/**
 * Write one code point as both dialects read it: tab, line feed and carriage return as their
 * escapes, printable ASCII as itself (escaped where it is a metacharacter), any other character of
 * the Basic Multilingual Plane as `\uXXXX`, and a supplementary character as itself.
 *
 * @param point - The code point.
 * @param meta - The metacharacters of the place it is written in.
 * @returns Its spelling.
 */
const spellPoint = (point: number, meta: ReadonlySet<string>): string => {
  const named = pointEscapes.get(point);
  if (named !== undefined) {
    return named;
  }

  const character = String.fromCodePoint(point);
  if (point >= 0x20 && point < 0x7f) {
    return meta.has(character) ? `\\${character}` : character;
  }

  return point <= 0xff_ff ? `\\u${point.toString(16).toUpperCase().padStart(4, "0")}` : character;
};

/**
 * Write a character set: one character as itself, any other as a bracket expression of its runs.
 *
 * @param set - The set.
 * @returns The pattern.
 */
const spellSet = (set: CodeSet): string => {
  const [only] = set;
  if (set.length === 1 && only !== undefined && only[0] === only[1]) {
    return spellPoint(only[0], outsideMeta);
  }

  return `[${set
    .map(([lo, hi]) => {
      if (lo === hi) {
        return spellPoint(lo, insideMeta);
      }

      return hi === lo + 1
        ? `${spellPoint(lo, insideMeta)}${spellPoint(hi, insideMeta)}`
        : `${spellPoint(lo, insideMeta)}-${spellPoint(hi, insideMeta)}`;
    })
    .join("")}]`;
};

/**
 * PostgreSQL's largest repetition count, `RE_DUP_MAX` (19rc1, `src/include/regex/regex.h`): a
 * bound above it is written as several repetitions.
 */
const repetitionLimit = 255;

/**
 * Whether a written tree is one atom a quantifier may follow without a group.
 *
 * @param tree - The tree.
 * @returns Whether it is a single set.
 */
const isAtom = (tree: Regex): boolean => tree._tag === "chars";

/**
 * Write a repetition's quantifier, splitting a bound above {@link repetitionLimit}.
 *
 * @param body - The written body, an atom or a group.
 * @param min - The fewest times.
 * @param max - The most, none for unbounded.
 * @returns The pattern.
 */
const spellRepeat = (body: string, min: number, max: Option.Option<number>): string => {
  if (min > repetitionLimit) {
    return `${body}{${repetitionLimit}}${spellRepeat(body, min - repetitionLimit, max.pipe(Option.map((most) => most - repetitionLimit)))}`;
  }

  return Option.match(max, {
    onNone: () => {
      if (min === 0) {
        return `${body}*`;
      }

      return min === 1 ? `${body}+` : `${body}{${min},}`;
    },
    onSome: (most) => {
      if (most > repetitionLimit) {
        return `${body}{${min},${repetitionLimit}}${spellRepeat(body, 0, Option.some(most - repetitionLimit))}`;
      }

      if (min === 0 && most === 1) {
        return `${body}?`;
      }

      return min === most ? `${body}{${min}}` : `${body}{${min},${most}}`;
    },
  });
};

/**
 * Write a tree as a pattern: a set as one character or a bracket expression, a sequence part by
 * part (an alternation among them in a group), an alternation arm by arm, and a repetition as its
 * body (a group unless it is one set) and a quantifier. No construct of the tree asserts without
 * matching, so the pattern holds no lookaround.
 *
 * @param tree - The tree.
 * @returns The pattern.
 */
const emit = (tree: Regex): string => {
  switch (tree._tag) {
    case "chars": {
      return spellSet(tree.set);
    }
    case "seq": {
      return tree.parts
        .map((part) => (part._tag === "alt" ? `(?:${emit(part)})` : emit(part)))
        .join("");
    }
    case "alt": {
      return tree.arms.map(emit).join("|");
    }
    case "repeat": {
      const body = emit(tree.body);

      return spellRepeat(isAtom(tree.body) ? body : `(?:${body})`, tree.min, tree.max);
    }
    default: {
      return tree satisfies never;
    }
  }
};

/**
 * Write a tree as the anchored pattern of a whole value.
 *
 * @param tree - The tree.
 * @returns `^…$`.
 */
const emitWhole = (tree: Regex): string => `^(?:${emit(tree)})$`;

/**
 * Keep the enumeration values a context can reach, and match them.
 *
 * @param values - The values, as the definition states them.
 * @param reachable - Whether a value can be the normalized form in this context.
 * @param rest - The definition's other constraints, as a tree whose language each value must also
 *   be in. {@link nothing} keeps no value: it is written as the empty pattern, which a host would
 *   read as the empty word's.
 * @returns The alternation of the kept values.
 */
const enumerationOf = (
  values: readonly string[],
  reachable: (value: string) => boolean,
  rest: Regex,
): Result.Result<Regex, UnreadDefinition> => {
  const host = new RegExp(emitWhole(rest), "u");
  const kept = values.filter((value) => reachable(value) && !isNothing(rest) && host.test(value));

  return kept.length === 0
    ? refuse("an enumeration none of whose values the context can reach")
    : Result.succeed(alt(...kept.map(literal)));
};

/**
 * Whether a value is a collapsed one: no tab, line feed or carriage return, no space at either end
 * and no two together.
 *
 * @param value - The value.
 * @returns Whether collapsing leaves it unchanged.
 */
const isCollapsed = (value: string): boolean => !/[\t\n\r]|^ | $| {2}/u.test(value);

/**
 * The whitespace context a definition is compiled in: the whole value under the definition's own
 * class, or a whitespace-free list item.
 */
type Context = { readonly _tag: "token" } | { readonly _tag: "value"; readonly exact: boolean };

/**
 * Compile an atomic definition in a context.
 *
 * @param domain - The definition.
 * @param context - Where its value stands.
 * @returns The tree as written, and the bound its typed value keeps.
 */
const compileAtomic = (
  domain: Extract<Domain, { readonly _tag: "atomic" }>,
  context: Context,
): Result.Result<
  { readonly bound: Option.Option<DoubleBound>; readonly tree: Regex },
  CompileError
> =>
  Result.gen(function* compileAtomicBody() {
    const whiteSpace = yield* classOf(domain.facets);
    const values = valuesOf(domain.facets, "enumeration");
    const withoutEnumeration = {
      ...domain,
      facets: domain.facets.filter(({ facet }) => facet !== "enumeration"),
    };
    const core = yield* atomicCore(withoutEnumeration);
    let { tree } = core;
    if (values.length > 0) {
      if (domain.primitive !== "string" && domain.primitive !== "anySimpleType") {
        return yield* refuse(
          `an enumeration over ${domain.primitive}, whose values are not its lexical forms`,
        );
      }

      const reachable = (value: string): boolean => {
        if (context._tag === "token") {
          return value !== "" && !/[ \t\n\r]/u.test(value);
        }

        if (context.exact || whiteSpace === "preserve") {
          return true;
        }

        return whiteSpace === "replace" ? !/[\t\n\r]/u.test(value) : isCollapsed(value);
      };
      tree = yield* enumerationOf(values, reachable, tree);
    }

    if (context._tag === "token") {
      return { bound: core.bound, tree: asToken(tree) };
    }

    if (context.exact || whiteSpace === "preserve") {
      return { bound: core.bound, tree };
    }

    if (whiteSpace === "replace") {
      return { bound: core.bound, tree: foldReplace(tree) };
    }

    return { bound: core.bound, tree: yield* foldCollapse(tree) };
  });

/**
 * The facets a list or union definition may state of itself: its whitespace class, and a list's
 * lengths.
 */
const varietyFacets: ReadonlySet<FacetName> = new Set([
  "length",
  "maxLength",
  "minLength",
  "whiteSpace",
]);

/**
 * Compile a definition in a context: an atomic one by its facets, a list as whitespace-separated
 * tokens of its item, a union as the alternation of its members, each in its own class.
 *
 * @param domain - The definition.
 * @param context - Where its value stands.
 * @returns The tree as written, and the bound its typed value keeps.
 */
const compileIn = (
  domain: Domain,
  context: Context,
): Result.Result<
  { readonly bound: Option.Option<DoubleBound>; readonly tree: Regex },
  CompileError
> =>
  Result.gen(function* compileInBody() {
    if (domain._tag === "atomic") {
      return yield* compileAtomic(domain, context);
    }

    if (
      domain.patterns.length > 0 ||
      domain.facets.some(({ facet }) => !varietyFacets.has(facet))
    ) {
      return yield* refuse(`a ${domain._tag} that states facets of its own beyond its lengths`);
    }

    if (domain._tag === "union") {
      const arms: Regex[] = [];
      for (const member of domain.members) {
        const compiled = yield* compileIn(member, context);
        if (Option.isSome(compiled.bound)) {
          return yield* refuse("a value bound inside a union, which no one typed value carries");
        }

        arms.push(compiled.tree);
      }

      return { bound: Option.none(), tree: alt(...arms) };
    }

    if (context._tag === "token") {
      return yield* refuse("a list inside a list");
    }

    const item = yield* compileIn(domain.item, { _tag: "token" });
    if (Option.isSome(item.bound)) {
      return yield* refuse("a value bound on a list's item, which no one typed value carries");
    }

    const { max, min } = lengthBounds(domain.facets);
    const separator = plus(whitespaceChar);
    const more = (least: number) =>
      repeat(seq(separator, item.tree), least, max.pipe(Option.map((most) => most - 1)));
    // A most of 0 leaves `more` nothing, so `items` is the empty list, and a most below the least
    // leaves the list nothing (`repeat`).
    const items = min === 0 ? opt(seq(item.tree, more(0))) : seq(item.tree, more(min - 1));

    return {
      bound: Option.none(),
      tree: context.exact ? items : seq(anyWhitespace, items, anyWhitespace),
    };
  });

/**
 * The identity type a definition is: an atomic `ID` or `IDREF`, or a list of `IDREF`s.
 *
 * @param domain - The definition.
 * @returns Its identity type, or none.
 */
const identityOf = (domain: Domain): Option.Option<Identity> => {
  if (domain._tag === "atomic") {
    return domain.builtin === "ID" || domain.builtin === "IDREF"
      ? Option.some(domain.builtin)
      : Option.none();
  }

  return domain._tag === "list" && domain.item._tag === "atomic" && domain.item.builtin === "IDREF"
    ? Option.some("IDREFS")
    : Option.none();
};

/**
 * How a definition's values name namespaces: an atomic `xs:QName`, or a list of them.
 *
 * @param domain - The definition.
 * @returns How, or none for a definition whose values are no QNames.
 */
const qualifiedOf = (domain: Domain): Option.Option<Qualified> => {
  if (domain._tag === "atomic") {
    return domain.primitive === "QName" ? Option.some("QName") : Option.none();
  }

  return domain._tag === "list" &&
    domain.item._tag === "atomic" &&
    domain.item.primitive === "QName"
    ? Option.some("QNames")
    : Option.none();
};

/**
 * Whether a definition holds a QName anywhere but at its top or as a list's item, where the codec
 * would not read its bindings.
 *
 * @param domain - The definition.
 * @returns Whether a QName hides in a union.
 */
const hidesQualified = (domain: Domain): boolean =>
  domain._tag === "union" &&
  domain.members.some((member) => Option.isSome(qualifiedOf(member)) || hidesQualified(member));

/**
 * Whether a definition holds an identity type anywhere but at its top or as a list's item, where no
 * reference law reads it.
 *
 * @param domain - The definition.
 * @returns Whether an `ID` or `IDREF` hides in a union.
 */
const hidesIdentity = (domain: Domain): boolean =>
  domain._tag === "union" &&
  domain.members.some((member) => Option.isSome(identityOf(member)) || hidesIdentity(member));

/**
 * How a value's whitespace is read: as its type's class says, or exactly, as spec reading 7 reads
 * a typed QTI value in an attribute, where outer whitespace makes the value invalid.
 */
export type Reading = "exact" | "xsd";

/**
 * The flags a compiled pattern is read with by a JavaScript host: `u`, so its `\u` escapes and
 * supplementary characters read as code points, as PostgreSQL reads them.
 */
export const patternFlags = "u";

/**
 * An NCName as a pattern both dialects read, grouped and unanchored so that its readers compose it:
 * {@link ncName}'s language, `xs:NCName`'s lexical space as the value domains compile it, which
 * `IdentifierDType` restricts. It is the one test of whether a value names something: a variable
 * reference's or a binding's name, a declaration's or a record field's identifier. Any other value
 * names nothing, and its value domain refuses it alone (spec reading 152).
 */
export const ncNamePattern = `(?:${emit(ncName)})`;

/**
 * A lexical form that names something once collapsed: an NCName ({@link ncNamePattern}) with XML
 * whitespace around it, which collapsing strips. Only such a form names something: a declaration's,
 * a record field's or a test structure's identifier and a dependency's `identifierref` (spec
 * reading 152), and an ID-typed attribute's or text's ID value, `xs:ID` being a restriction of
 * `xs:NCName` (spec reading 156). Any other form names nothing, and its value domain refuses it
 * alone.
 */
export const namingPattern = `^[\\t\\n\\r ]*${ncNamePattern}[\\t\\n\\r ]*$`;

/**
 * {@link ncNamePattern} over a whole value, as a JavaScript host reads it.
 */
const ncNameForm = new RegExp(`^${ncNamePattern}$`, patternFlags);

/**
 * Decide whether a value is an NCName, by {@link ncNamePattern}: the host's reading of the one
 * test the schema states.
 *
 * @param value - The value, collapsed.
 * @returns Whether it names something.
 */
export const isNcName = (value: string): boolean => ncNameForm.test(value);

/**
 * Compile a resolved definition into its value domain.
 *
 * Each call compiles: the attribute grammar compiles each distinct definition once
 * (`#pantry/grammar/attributes.ts`, `domainReader`), and no caller compiles one definition twice.
 *
 * @param domain - The definition, as the leaf resolves it.
 * @param reading - How its whitespace is read.
 * @returns The compiled domain, or why it has none.
 */
export const compile = (
  domain: Domain,
  reading: Reading,
): Result.Result<CompiledDomain, CompileError> =>
  Result.gen(function* compileBody() {
    if (hidesIdentity(domain)) {
      return yield* refuse("an ID or IDREF member of a union");
    }

    if (hidesQualified(domain)) {
      return yield* refuse("a QName member of a union");
    }

    const { bound, tree } = yield* compileIn(domain, {
      _tag: "value",
      exact: reading === "exact",
    });
    if (isNothing(tree)) {
      return yield* Result.fail(
        new EmptyDefinition({
          primitive: domain._tag === "atomic" ? domain.primitive : domain._tag,
        }),
      );
    }

    const pattern = emitWhole(tree);
    const matches = new RegExp(pattern, patternFlags);

    return {
      bound,
      enumeration:
        domain._tag === "atomic"
          ? valuesOf(domain.facets, "enumeration").filter((value) => matches.test(value))
          : [],
      identity: identityOf(domain),
      pattern,
      primitive: domain._tag === "atomic" ? domain.primitive : domain._tag,
      qualified: qualifiedOf(domain),
    };
  });

/**
 * The compiled domain of `xs:anySimpleType`, every value with its whitespace preserved: the domain
 * an open name's value is read under, which a declaration of that type compiles to alike.
 */
export const openCompiled: CompiledDomain = {
  bound: Option.none(),
  enumeration: [],
  identity: Option.none(),
  pattern: emitWhole(anything),
  primitive: "anySimpleType",
  qualified: Option.none(),
};

/**
 * The language a definition's lexical forms take once its whitespace is normalized, as the tree
 * its exact pattern is written from: what a generator draws a definition's valid forms from.
 *
 * @param domain - The definition.
 * @returns The tree, or why the definition has none.
 */
export const languageOf = (domain: Domain): Result.Result<Regex, CompileError> =>
  Result.map(compileIn(domain, { _tag: "value", exact: true }), ({ tree }) => tree);

/**
 * One `%` escape: `escaped`'s `"%" hex hex`.
 */
const escape = "%[0-9A-Fa-f]{2}";

/**
 * A character of a class, or an escape: each class is every character but the delimiters it
 * lists, since XLink's escaping lets a character outside RFC 2396's set stand wherever `escaped`
 * does.
 *
 * @param excluded - The delimiters the class leaves out, as a character class's body.
 * @returns The alternative.
 */
const charOrEscape = (excluded: string): string => `([^${excluded}%]|${escape})`;

/**
 * The parts of `xs:anyURI`'s grammar, each named for its production in RFC 2396 Appendix A as
 * RFC 2732, section 3, amends it, written as XML Schema regular expressions.
 */
const uri = (() => {
  const segment = charOrEscape("/?#\\[\\]");
  const relSegment = charOrEscape("/?#\\[\\]:");
  const userinfo = charOrEscape("/?#\\[\\]@");
  const uric = charOrEscape("#");
  const uricNoSlash = charOrEscape("/#\\[\\]");
  const scheme = "[A-Za-z][A-Za-z0-9+\\-.]*";
  const hex4 = "[0-9A-Fa-f]{1,4}";
  const hexSeq = `${hex4}(:${hex4})*`;
  const ipv4 = "[0-9]{1,3}(\\.[0-9]{1,3}){3}";
  const octet = "(25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])";
  const ipv6 = `((${hexSeq}(::(${hexSeq})?)?|::(${hexSeq})?)(:${ipv4})?|(${hex4}(:${hex4}){0,4})?::${octet}\\.${octet}\\.${octet}\\.${octet})`;
  const absPath = `(/${segment}*)`;
  const ipv6Authority = `(${userinfo}*@)?\\[${ipv6}\\](:[0-9]*)?`;
  const path = `(${absPath}+|//${ipv6Authority}${absPath}*)`;
  const query = `(\\?${uric}*)`;
  const fragment = `(#${uric}*)`;

  return `(${scheme}:${uricNoSlash}${uric}*|(${scheme}:)?${path}${query}?|${relSegment}+${absPath}*${query}?)?${fragment}?`;
})();

/**
 * `xs:anyURI`'s lexical space as XML Schema 1.0 defines it (spec reading 71), as an XML Schema
 * regular expression matched against the collapsed value: a string that, once XLink 1.0, section
 * 5.4, escapes its disallowed characters, is RFC 2396's `URI-reference` as RFC 2732 amends it, the
 * IPv6 address of RFC 2373's Appendix B or its section 2.2 text forms.
 *
 * The pattern judges the collapsed value, so it never allows whitespace at its ends: a leading
 * space would read as a `rel_segment` character and admit `" ?q"`, whose collapsed form `?q` is no
 * URI reference. A raw-form law adds the `whiteSpace` class around it.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#anyURI | XML Schema Part 2, 3.2.17 anyURI}
 * @see {@link https://www.rfc-editor.org/rfc/rfc2396#appendix-A | RFC 2396, Appendix A}
 * @see {@link https://www.rfc-editor.org/rfc/rfc2732#section-3 | RFC 2732, section 3}
 */
export const anyUriPattern = uri;

/**
 * Translate one XSD `pattern` facet into the pattern of the whole value both dialects read: the
 * one translation of XSD's regular expressions every domain's pattern is built with.
 *
 * @param source - The pattern as the XSD writes it.
 * @returns The anchored pattern, or an {@link UnreadPattern}.
 */
export const translatePattern = (source: string): Result.Result<string, UnreadPattern> =>
  Result.map(readPattern(source), emitWhole);
