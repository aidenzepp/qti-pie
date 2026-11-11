/**
 * The package-media level's path rule (`#pantry/levels/media-path.ts`), with no database:
 *
 * - **Its pattern**, {@link nonRelative}, as a JavaScript regular expression under the flag `u`, the
 *   flag grizzle reads a pattern under, against the URL Standard's reading of an address's start,
 *   written here apart from it code point by code point: the leading C0 controls and spaces it
 *   strips, the tabs and newlines it removes, then its scheme start and scheme states, or a first
 *   `/` or `\`. A search over address pieces, and an accepting and a refusing twin of each case.
 * - **What it selects**: every fetched attribute name, under every governor and on every element of a
 *   kind that fetches it, whatever its address form, and every fetched text's kind, so no fetched
 *   field escapes the rule; and its unresolved fields are each refused by a condition no selected
 *   row meets.
 * - **Its entity bypass** (decision 488, as `CdnOrigin` reads it): the fetched attributes' relation
 *   carries each value's count of kept entity references, which the pattern cannot see.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import {
  mediaFetchedNameList,
  mediaFetchedNames,
  mediaPathRule,
  mediaTextGovernors,
  nonRelative,
} from "#pantry/levels/media-path.ts";
import { qti } from "#pantry/qti/schema.ts";
import { fetchedAttributes, fetchedTexts } from "#pantry/vocab/fetched.ts";

/**
 * Decide whether an ASCII letter: the first code point of a scheme.
 *
 * @param point - One UTF-16 code unit, which decides the same as its code point for every ASCII
 *   one.
 * @returns Whether it is an ASCII letter.
 * @see {@link https://infra.spec.whatwg.org/#ascii-alpha | Infra Standard, ASCII alpha}
 */
const isAsciiAlpha = (point: string): boolean =>
  (point >= "a" && point <= "z") || (point >= "A" && point <= "Z");

/**
 * Decide whether a code point a scheme holds after its first: an ASCII alphanumeric, `+`, `-` or
 * `.`.
 *
 * @param point - One code point.
 * @returns Whether a scheme holds it.
 * @see {@link https://url.spec.whatwg.org/#scheme-state | URL Standard, scheme state}
 */
const isSchemePoint = (point: string): boolean =>
  isAsciiAlpha(point) || (point >= "0" && point <= "9") || "+-.".includes(point);

/**
 * Read an address's start as the URL Standard's basic URL parser does against a player's `https`
 * page: strip its leading C0 controls and spaces, remove every ASCII tab and newline, then decide
 * whether it starts a scheme (an ASCII letter, then scheme code points up to a `:`) or a first `/`
 * or `\`, which a special scheme's URL reads alike. Either makes it no path relative to its
 * document.
 *
 * @param address - The address as written.
 * @returns Whether the URL Standard reads it as no relative path.
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser}
 */
const readsNonRelative = (address: string): boolean => {
  let first = 0;
  while (first < address.length && (address.codePointAt(first) ?? 0) <= 0x20) {
    first += 1;
  }

  const rest = address.slice(first).replaceAll("\t", "").replaceAll("\n", "").replaceAll("\r", "");
  const start = rest.charAt(0);
  if (start === "/" || start === "\\") {
    return true;
  }

  let schemeEnd = 1;
  while (schemeEnd < rest.length && isSchemePoint(rest.charAt(schemeEnd))) {
    schemeEnd += 1;
  }

  return isAsciiAlpha(start) && rest.charAt(schemeEnd) === ":";
};

/**
 * The pieces an address is drawn from: scheme letters in both cases, digits and scheme punctuation,
 * a colon, both slashes, the C0 controls and space the URL Standard strips, a tab and a newline
 * inside a scheme, a query, a fragment, a dot segment and plain path text.
 */
const pieces = [
  "data",
  "DaTa",
  "https",
  "x",
  "1",
  "+",
  "-",
  ".",
  ":",
  "/",
  "\\",
  " ",
  "\t",
  "\n",
  "\u{1}",
  "\u{1F}",
  "?q",
  "#f",
  "..",
  "img",
  "a b",
  "é",
] as const;

/**
 * The twins of the rule's pattern: each address with the reading it must get.
 */
const twins = [
  { address: "images/a.png", nonRelative: false },
  { address: "https://cdn.example.com/a.png", nonRelative: true },
  { address: "a.png", nonRelative: false },
  { address: "/a.png", nonRelative: true },
  { address: "media/a:b.png", nonRelative: false },
  { address: "data:image/png;base64,AAAA", nonRelative: true },
  { address: "../a.png", nonRelative: false },
  { address: "\\a.png", nonRelative: true },
  { address: "a\u{1}b:c", nonRelative: false },
  { address: " \td\nata:x", nonRelative: true },
  { address: "1x:y", nonRelative: false },
  { address: "//cdn.example.com/a.png", nonRelative: true },
] as const;

describe("levels/media-path.ts, the pattern", () => {
  it("reads each twin as the URL Standard does: a relative path admitted, its scheme or rooted twin refused", () => {
    const pattern = new RegExp(nonRelative, "u");

    for (const twin of twins) {
      assert.strictEqual(readsNonRelative(twin.address), twin.nonRelative, twin.address);
      assert.strictEqual(pattern.test(twin.address), twin.nonRelative, twin.address);
    }
  });

  it.effect(
    "refuses an address exactly when the URL Standard reads a scheme or a root at its start, past the C0 controls and spaces it strips and the tabs and newlines it removes",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required(["address admitted", "address refused"] as const, {
              cases: 200,
              sense: notesOnly,
            }),
            draw: drawn((source) => ({
              value: source.draw(array(element(pieces), { max: 6, min: 0 })).join(""),
            })),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the URL Standard's leading strip, tab and newline removal, scheme start and scheme states, read code point by code point",
            },
            runs: 4000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "levels/media-path/pattern",
          },
          ({ value }, c) =>
            Effect.sync(() => {
              const refused = new RegExp(nonRelative, "u").test(value);

              assert.strictEqual(refused, readsNonRelative(value), JSON.stringify(value));
              c.note(refused ? "address refused" : "address admitted");
            }),
        ),
      ),
  );
});

describe("levels/media-path.ts, what it selects", () => {
  it("selects every fetched attribute name, in either address form, on every kind and under every governor of a kind that fetches it, and every fetched text's kind", () => {
    // Oracle: `fetchedAttributes` and `fetchedTexts` of `#pantry/vocab/fetched.ts`, the one
    // declaration of what a player fetches, read row by row.
    for (const { kind, name } of fetchedAttributes) {
      const selected = mediaFetchedNames.find((fetched) => fetched.name === name);

      assert.isDefined(selected, `${kind} ${name} is not selected`);
      assert.include(selected?.kinds ?? [], kind, `${kind} ${name} is not selected by its kind`);
      assert.include(
        selected?.governors ?? [],
        kind,
        `${kind} ${name} is not selected under its kind's governor`,
      );
    }
    assert.deepStrictEqual(
      [...new Set(fetchedAttributes.map(({ name }) => name))].toSorted(),
      [...mediaFetchedNameList].toSorted(),
    );
    for (const kind of fetchedTexts) {
      assert.include(mediaTextGovernors, kind, `${kind}'s text is not selected`);
    }
  });

  it("carries each fetched attribute's count of kept entity references, which the pattern cannot see while its expansion may leave the package", () => {
    // Oracle: XML 1.0 section 4.4 and decision 488, as `CdnOrigin` reads them: the pattern admits
    // the kept form `&far;`, so the check must judge each row's count of kept references.
    const { relations } = mediaPathRule(qti());

    assert.isFalse(new RegExp(nonRelative, "u").test("&far;"));
    assert.include(Object.keys(relations.MediaFetchedAttribute.heading), "entities");
    assert.include(Object.keys(relations.MediaFetchedTextEntity.heading), "kind");
  });
});
