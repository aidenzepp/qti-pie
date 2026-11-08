/**
 * `isNamespaceName` held to the namespace-name grammars of Namespaces in XML: RFC 3987's
 * `IRI-reference` widens RFC 3986's `URI-reference` by two classes alone, `ucschar` (in
 * `iunreserved`) and `iprivate` (in `iquery`), so the box walks every edge of every range of both,
 * in every place a reference holds such a character, under each edition. RFC 3986's own grammar is
 * judged in pantry, against its law oracle's recogniser of Appendix A (`chardata.oracle.test.ts`
 * and `namespace-name.test.ts`).
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter } from "effect";
import { caseHang, GENERATED_TIMEOUT_MS } from "#crust/test/trees.ts";
import { isNamespaceName } from "#crust/uri.ts";

/**
 * RFC 3987 section 2.2's `ucschar`, its ranges as printed: `%xA0-D7FF / %xF900-FDCF / %xFDF0-FFEF
 * / %x10000-1FFFD / ... / %xD0000-DFFFD / %xE1000-EFFFD`.
 */
const UCSCHAR: readonly (readonly [number, number])[] = [
  [0xa0, 0xd7_ff],
  [0xf9_00, 0xfd_cf],
  [0xfd_f0, 0xff_ef],
  [0x1_00_00, 0x1_ff_fd],
  [0x2_00_00, 0x2_ff_fd],
  [0x3_00_00, 0x3_ff_fd],
  [0x4_00_00, 0x4_ff_fd],
  [0x5_00_00, 0x5_ff_fd],
  [0x6_00_00, 0x6_ff_fd],
  [0x7_00_00, 0x7_ff_fd],
  [0x8_00_00, 0x8_ff_fd],
  [0x9_00_00, 0x9_ff_fd],
  [0xa_00_00, 0xa_ff_fd],
  [0xb_00_00, 0xb_ff_fd],
  [0xc_00_00, 0xc_ff_fd],
  [0xd_00_00, 0xd_ff_fd],
  [0xe_10_00, 0xe_ff_fd],
];

/**
 * RFC 3987 section 2.2's `iprivate`: `%xE000-F8FF / %xF0000-FFFFD / %x100000-10FFFD`.
 */
const IPRIVATE: readonly (readonly [number, number])[] = [
  [0xe0_00, 0xf8_ff],
  [0xf_00_00, 0xf_ff_fd],
  [0x10_00_00, 0x10_ff_fd],
];

/**
 * Test whether a code point lies in one of the ranges.
 */
const within = (ranges: readonly (readonly [number, number])[], point: number): boolean =>
  ranges.some(([low, high]) => point >= low && point <= high);

/**
 * Every code point at an edge of a range of either class: each range's first and last, and the
 * code points just outside them, the surrogates left out, as no string of scalar values holds one.
 */
const EDGES: readonly number[] = [
  ...new Set(
    [...UCSCHAR, ...IPRIVATE]
      .flatMap(([low, high]) => [low - 1, low, high, high + 1])
      .filter((point) => point <= 0x10_ff_ff && (point < 0xd8_00 || point > 0xdf_ff)),
  ),
].toSorted((left, right) => left - right);

/**
 * The places a reference holds a character of `iunreserved` or `iquery`, each a reference with the
 * character in it: a path segment, the query, the fragment, a host and the user information.
 */
const PLACES = {
  fragment: (character: string) => `urn:a#${character}`,
  host: (character: string) => `http://${character}/`,
  query: (character: string) => `urn:a?${character}`,
  segment: (character: string) => `urn:a/${character}`,
  userinfo: (character: string) => `http://${character}@h/`,
} as const;

/**
 * One place.
 */
type Place = keyof typeof PLACES;

/**
 * The places, in a list.
 */
const PLACE_NAMES = ["fragment", "host", "query", "segment", "userinfo"] as const;

/**
 * One case of the box: an edge code point, a place and an edition.
 */
interface Edge {
  readonly at: number;
  readonly namespaces: "1.0" | "1.1";
  readonly place: Place;
}

/**
 * Every case: each edge code point in each place under each edition.
 */
const edge: Gen<Edge> = (source) => ({
  at: source.draw(int(0, EDGES.length - 1)),
  namespaces: source.draw(element(["1.0", "1.1"] as const)),
  place: source.draw(element(PLACE_NAMES)),
});

/**
 * The size of {@link edge}'s box.
 */
const EDGE_CASES = EDGES.length * PLACE_NAMES.length * 2;

/**
 * What RFC 3987 section 2.2 says of a character in a place, under an edition: none beyond US-ASCII
 * is a URI's; an IRI holds a `ucschar` in every place, and an `iprivate` in its query alone.
 *
 * @param point - The code point.
 * @param place - The place.
 * @param namespaces - The edition of Namespaces in XML.
 * @returns Whether the reference holding it is a namespace name.
 */
const admitted = (point: number, place: Place, namespaces: "1.0" | "1.1"): boolean =>
  namespaces === "1.1" &&
  (within(UCSCHAR, point) || (place === "query" && within(IPRIVATE, point)));

describe("isNamespaceName reads Namespaces in XML's namespace-name grammars", () => {
  it.effect(
    `at every edge of RFC 3987's ucschar and iprivate, in every place, under each edition, exhausted: ${String(EDGE_CASES)} references`,
    (ctx) =>
      // Oracle: RFC 3987 section 2.2 as a checker, its two classes' ranges transcribed as printed;
      // Namespaces in XML 1.0 section 2.1 and 1.1 section 3 for which edition reads which grammar.
      searched(
        ctx,
        exhaust(
          {
            box: "every edge code point of ucschar and iprivate, in 5 places, under 2 editions",
            caseHang,
            coverage: requiredInSpace<Place | "admitted" | "refused">([
              "admitted",
              "refused",
              ...PLACE_NAMES,
            ]),
            generator: edge,
            limit: EDGE_CASES,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "RFC 3987 section 2.2's ucschar and iprivate, as printed",
            },
            suite: "crust/uri/edges",
          },
          ({ at, namespaces, place }, c) =>
            Effect.sync(() => {
              const point = EDGES[at] ?? 0;
              const reference = PLACES[place](String.fromCodePoint(point));
              const expected = admitted(point, place, namespaces);
              c.note(place);
              c.note(expected ? "admitted" : "refused");

              assert.strictEqual(
                isNamespaceName(reference, namespaces),
                expected,
                `U+${point.toString(16).toUpperCase()} in the ${place}, Namespaces ${namespaces}`,
              );
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, EDGE_CASES);
          }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );

  it.effect("refuses the empty value, which is no namespace name under either edition", () =>
    Effect.sync(() => {
      assert.isFalse(isNamespaceName("", "1.0"));
      assert.isFalse(isNamespaceName("", "1.1"));
    }),
  );
});
