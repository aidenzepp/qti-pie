/**
 * The importer's resolution of an href (`#pantry/import/overlays/package.ts`, readings 102 and 103)
 * against the law oracle's own (`#pantry/test/resolution.ts`), a differential of two
 * implementations of RFC 3986 that share no code: the importer works over segment lists and
 * decodes with the platform's strict UTF-8 decoder, the oracle runs §5.2.4's five rules over text
 * below a sentinel root and decodes with a UTF-8 decoder of its own.
 *
 * The search is brutal in the operator's sense: generated hrefs, bases and documents under a swarm
 * that turns each kind of segment on or off per case, the adversarial cases drawn by name, the
 * small scope exhausted, and planted bugs, each a plausible slip of an importer, that the search
 * must tell apart from the importer.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { keep, swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { baseIn, documentBase, hrefValueOf, resolveIn } from "#pantry/import/overlays/package.ts";
import type { HrefResolution, WhiteSpace } from "#pantry/import/overlays/package.ts";
import { oracleValueOf, resolve } from "#pantry/test/resolution.ts";
import type { OracleResolution } from "#pantry/test/resolution.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 4 s at a load average of 75, under
 * V8 coverage, its slowest test.
 */
const testTimeoutMs = 300_000;

/**
 * One href as the importer resolves it: its document's path, the `xml:base` values in scope,
 * outermost first, as written, its lexical form and its type's whitespace class.
 */
interface HrefCase {
  readonly bases: readonly string[];
  readonly document: string;
  readonly lexical: string;
  readonly whiteSpace: WhiteSpace;
}

/**
 * Resolve a case as the importer does: each base resolved against the one above it from the
 * document's own path, then the href against the innermost.
 *
 * @param input - The case.
 * @returns Its resolution.
 */
const importerOf = (input: HrefCase): HrefResolution => {
  let base = documentBase(input.document);
  for (const written of input.bases) {
    base = baseIn(hrefValueOf(written, "collapse"), base);
  }

  return resolveIn(hrefValueOf(input.lexical, input.whiteSpace), base);
};

/**
 * Resolve a case as the law oracle does.
 *
 * @param input - The case.
 * @returns Its resolution.
 */
const oracleOf = (input: HrefCase): OracleResolution =>
  resolve({
    bases: input.bases,
    document: input.document,
    value: oracleValueOf(input.lexical, input.whiteSpace),
  });

/**
 * A planted bug: an importer that slips in one plausible way, which the search must catch.
 */
interface Planted {
  readonly name: PlantedName;
  readonly resolveOf: (input: HrefCase) => HrefResolution;
}

/**
 * The planted bugs' names.
 */
type PlantedName =
  | "decodes before it splits"
  | "drops a byte order mark"
  | "ignores the bases"
  | "keeps a fragment's document";

/**
 * Decode every percent-encoding of a value that spells ASCII, a `%2F` to a `/` included, as an
 * importer that decodes the whole href before splitting it into segments would.
 *
 * @param value - The value.
 * @returns It, with each ASCII percent-encoding decoded.
 */
const asciiDecoded = (value: string): string =>
  value.replaceAll(/%(?<hex>[0-7][0-9A-Fa-f])/gu, (_, hex: string) =>
    String.fromCodePoint(Number.parseInt(hex, 16)),
  );

/**
 * The planted bugs, each the importer with one slip: decoding before splitting, so `a%2Fb`
 * names `a/b`; the platform decoder's default, which drops a leading U+FEFF as a byte order mark;
 * reading no `xml:base`; and resolving a fragment alone against an `xml:base`, as RFC 3986's
 * §5.2.2 would, where reading 102 follows §4.4.
 */
const planted: readonly Planted[] = [
  {
    name: "decodes before it splits",
    resolveOf: (input) => importerOf({ ...input, lexical: asciiDecoded(input.lexical) }),
  },
  {
    name: "drops a byte order mark",
    resolveOf: (input) => {
      const resolution = importerOf(input);

      return resolution.scope === "entry"
        ? {
            path: resolution.path
              .split("/")
              .map((segment) => segment.replace(/^\u{FEFF}/u, ""))
              .join("/"),
            scope: "entry",
          }
        : resolution;
    },
  },
  { name: "ignores the bases", resolveOf: (input) => importerOf({ ...input, bases: [] }) },
  {
    name: "keeps a fragment's document",
    resolveOf: (input) =>
      input.lexical.trim().startsWith("#") && input.bases.length > 0
        ? importerOf({ ...input, lexical: "./" })
        : importerOf(input),
  },
];

/**
 * The adversarial cases, each drawn by name: the climbs past the root, the encodings of `/`, `%`
 * and `.`, a malformed `%`, octets that are no UTF-8, a byte order mark, mixed `xml:base` chains,
 * and the same-document and whitespace corners reading 102 states.
 */
const adversarial = [
  { input: { bases: [], document: "i.xml", lexical: "../a.png" }, name: ".. past the root" },
  {
    input: { bases: [], document: "items/i.xml", lexical: "../../a.png" },
    name: ".. past the root, below it",
  },
  {
    input: { bases: [], document: "items/i.xml", lexical: "a/../../../items/a.png" },
    name: ".. past the root and back",
  },
  { input: { bases: [], document: "items/i.xml", lexical: "a%2Fb.png" }, name: "%2F" },
  { input: { bases: [], document: "items/i.xml", lexical: "a%2fb/../c.png" }, name: "%2F removed" },
  { input: { bases: [], document: "items/i.xml", lexical: "a%25b.png" }, name: "%25" },
  { input: { bases: [], document: "items/i.xml", lexical: "a%252Fb.png" }, name: "%252F" },
  { input: { bases: [], document: "items/i.xml", lexical: "a%.png" }, name: "malformed %" },
  { input: { bases: [], document: "items/i.xml", lexical: "a%2" }, name: "malformed % at the end" },
  { input: { bases: [], document: "items/i.xml", lexical: "%zz/a.png" }, name: "malformed %zz" },
  { input: { bases: [], document: "items/i.xml", lexical: "%2E%2E/a.png" }, name: "%2E%2E" },
  { input: { bases: [], document: "items/i.xml", lexical: ".%2e/a.png" }, name: ".%2e" },
  { input: { bases: [], document: "items/i.xml", lexical: "%2E%2E%2E/a.png" }, name: "%2E x3" },
  { input: { bases: [], document: "items/i.xml", lexical: "%FF.png" }, name: "%FF" },
  { input: { bases: [], document: "items/i.xml", lexical: "%C3.png" }, name: "a cut sequence" },
  { input: { bases: [], document: "items/i.xml", lexical: "%C0%AF.png" }, name: "overlong /" },
  { input: { bases: [], document: "items/i.xml", lexical: "%ED%A0%80.png" }, name: "surrogate" },
  { input: { bases: [], document: "items/i.xml", lexical: "%EF%BB%BFa.png" }, name: "BOM" },
  { input: { bases: [], document: "items/i.xml", lexical: "%F0%9F%98%80.png" }, name: "astral" },
  { input: { bases: [], document: "items/i.xml", lexical: "a%00.png" }, name: "%00" },
  { input: { bases: [], document: "items/i.xml", lexical: "my%20sign.png" }, name: "%20" },
  { input: { bases: [], document: "items/i.xml", lexical: "my sign.png" }, name: "a space" },
  {
    input: { bases: [], document: "items/i.xml", lexical: "images/../images/sign.png" },
    name: "a dot segment after a plain one",
  },
  {
    input: { bases: ["images/"], document: "items/i.xml", lexical: "sign.png" },
    name: "xml:base, a directory",
  },
  {
    input: { bases: ["a/", "http://h.org/x/", "b/"], document: "items/i.xml", lexical: "c.png" },
    name: "mixed xml:base, external between",
  },
  {
    input: { bases: ["http://h.org/x/", "/abs/"], document: "items/i.xml", lexical: "c.png" },
    name: "mixed xml:base, absolute after external",
  },
  {
    input: { bases: ["a/", "../../../"], document: "items/i.xml", lexical: "c.png" },
    name: "mixed xml:base, climbing past the root",
  },
  {
    input: { bases: ["a%zz/", "http://h.org/"], document: "items/i.xml", lexical: "c.png" },
    name: "mixed xml:base, a limit then external",
  },
  {
    input: { bases: ["a/b.xml?q#f", "c/"], document: "items/i.xml", lexical: "d.png" },
    name: "mixed xml:base, a file with a query",
  },
  {
    input: { bases: ["x%FF/"], document: "items/i.xml", lexical: "../a.png" },
    name: "xml:base with no UTF-8, removed",
  },
  {
    input: { bases: ["sub/"], document: "items/i.xml", lexical: "#top" },
    name: "a fragment under an xml:base",
  },
  { input: { bases: [""], document: "items/i.xml", lexical: "" }, name: "empty everything" },
  { input: { bases: [], document: "items/i.xml", lexical: "?v=1" }, name: "a query alone" },
  { input: { bases: [], document: "items/i.xml", lexical: "1:a.png" }, name: "a colon first" },
  { input: { bases: [], document: "items/i.xml", lexical: "./1:a.png" }, name: "a colon after ./" },
  { input: { bases: [], document: "items/i.xml", lexical: "a\\b.png" }, name: "a backslash" },
  { input: { bases: [], document: "items/i.xml", lexical: "a/b/.." }, name: "a trailing .." },
  { input: { bases: [], document: "imsmanifest.xml", lexical: "." }, name: "the root itself" },
  { input: { bases: [], document: "items/i.xml", lexical: "a//b.png" }, name: "an empty segment" },
  { input: { bases: [], document: "it%ems/i.xml", lexical: "a.png" }, name: "a % in the path" },
  {
    input: { bases: [], document: "items/i.xml", lexical: "//h.org/a.png" },
    name: "a network path",
  },
] as const;

/**
 * An adversarial case's name.
 */
type AdversarialName = (typeof adversarial)[number]["name"];

/**
 * The kinds of segment a generated href or base is written of, each a swarm feature.
 */
const segmentKinds = [
  "plain",
  "dot",
  "dot-dot",
  "encoded dot",
  "unreserved escape",
  "reserved escape",
  "UTF-8 escape",
  "no UTF-8",
  "stray percent",
  "space",
  "control",
  "backslash",
  "colon",
  "beyond ASCII",
  "empty",
] as const;

/**
 * A segment kind.
 */
type SegmentKind = (typeof segmentKinds)[number];

/**
 * The swarm's features: each segment kind, and the shapes of an href around its segments.
 */
type Feature = SegmentKind | "bases" | "fragment" | "outer whitespace" | "query" | "scheme";

/**
 * Every feature, the segment kinds first.
 */
const features: readonly [Feature, ...Feature[]] = [
  ...segmentKinds,
  "bases",
  "fragment",
  "outer whitespace",
  "query",
  "scheme",
];

/**
 * The segments of each kind a draw picks from.
 */
const segmentsOf: Readonly<Record<SegmentKind, readonly [string, ...string[]]>> = {
  "UTF-8 escape": ["%C3%A9", "%E2%82%AC", "%F0%9F%98%80"],
  backslash: ["a\\b"],
  "beyond ASCII": ["é", "日本", "😀"],
  colon: ["a:b", ":"],
  control: ["a\tb", "\n"],
  dot: ["."],
  "dot-dot": [".."],
  empty: [""],
  "encoded dot": ["%2E", "%2e", ".%2E", "%2E%2e"],
  "no UTF-8": ["%FF", "%C3", "%C0%AF", "%ED%A0%80"],
  plain: ["a", "b.png", "x"],
  "reserved escape": ["%2F", "%3F", "%23", "%25", "%3A", "%5C"],
  space: ["a b", " "],
  "stray percent": ["%", "%z", "%2", "a%g1"],
  "unreserved escape": ["%41", "%7E", "a%5Fb"],
};

/**
 * Draw one segment under a swarm: a kind among those it turns on, then a segment of that kind.
 *
 * @param on - The swarm.
 * @returns The generator.
 */
const segmentUnder =
  (on: Swarm<Feature>): Gen<string> =>
  (source) =>
    source.draw(element(segmentsOf[source.draw(swarmChoice(on, segmentKinds))]));

/**
 * Draw a relative path under a swarm: one to four segments, and a trailing `/` or none.
 *
 * @param on - The swarm.
 * @returns The generator.
 */
const pathUnder =
  (on: Swarm<Feature>): Gen<string> =>
  (source) =>
    `${source.draw(array(segmentUnder(on), { max: 4, min: 1 })).join("/")}${source.draw(element(["", "/"] as const))}`;

/**
 * Draw an href under a swarm: perhaps a scheme, an authority or a leading `/`; a path; perhaps a
 * query and a fragment; perhaps whitespace around it.
 *
 * @param on - The swarm.
 * @returns The generator.
 */
const lexicalUnder =
  (on: Swarm<Feature>): Gen<string> =>
  (source) => {
    const start = source.draw(keep(on, "scheme"))
      ? source.draw(element(["http://h.org/", "x:", "//h.org/", "/"] as const))
      : "";
    const query = source.draw(keep(on, "query")) ? "?q=%zz" : "";
    const fragment = source.draw(keep(on, "fragment")) ? "#f" : "";
    const pad = source.draw(keep(on, "outer whitespace")) ? " \t" : "";

    return `${pad}${start}${source.draw(pathUnder(on))}${query}${fragment}${pad}`;
  };

/**
 * Draw a base under a swarm: a directory or a file of the swarm's segments, or one of the bases
 * that set the scope apart: external, absolute, climbing, empty.
 *
 * @param on - The swarm.
 * @returns The generator.
 */
const baseUnder =
  (on: Swarm<Feature>): Gen<string> =>
  (source) =>
    source.draw(
      weighted([
        [3, pathUnder(on)],
        [1, element(["http://h.org/d/", "/abs/", "../../", "", "#f", "../"] as const)],
      ]),
    );

/**
 * The documents a case is in: the manifest at the root, documents at the root and below, and
 * directories whose names hold a `%`, a space and a `.` segment.
 */
const documents = [
  "imsmanifest.xml",
  "i.xml",
  "items/i.xml",
  "a/b/c/i.xml",
  "it%ems/i.xml",
  "sp ace/i.xml",
  "./i.xml",
] as const;

/**
 * Draw a case under its own swarm: the swarm first, so each case explores a corner where some
 * kinds are absent and the rest combine.
 */
const swarmed: Gen<{ readonly input: HrefCase; readonly on: Swarm<Feature> }> = (source) => {
  const on = source.draw(swarm(features));

  return {
    input: {
      bases: source.draw(keep(on, "bases"))
        ? source.draw(array(baseUnder(on), { max: 3, min: 1 }))
        : [],
      document: source.draw(element(documents)),
      lexical: source.draw(lexicalUnder(on)),
      whiteSpace: source.draw(element(["collapse", "replace", "preserve"] as const)),
    },
    on,
  };
};

/**
 * A case of the search: a swarmed one, or an adversarial one by name.
 */
type Drawn =
  | { readonly _tag: "adversarial"; readonly input: HrefCase; readonly name: AdversarialName }
  | { readonly _tag: "swarmed"; readonly input: HrefCase };

/**
 * Draw a case: an adversarial one by name a third of the time, under each whitespace class, and a
 * swarmed one otherwise.
 */
const cases: Gen<Drawn> = weighted<Drawn>([
  [
    1,
    (source): Drawn => {
      const { input, name } = source.draw(element(adversarial));

      return {
        _tag: "adversarial",
        input: {
          ...input,
          whiteSpace: source.draw(element(["collapse", "replace", "preserve"] as const)),
        },
        name,
      };
    },
  ],
  [2, (source): Drawn => ({ _tag: "swarmed", input: source.draw(swarmed).input })],
]);

/**
 * A situation a search must reach: each scope, each limit, and each planted bug caught.
 */
type Situation =
  | `caught: ${PlantedName}`
  | "document"
  | "entry"
  | "external"
  | "limit backslash"
  | "limit colon"
  | "limit control"
  | "limit octets"
  | "limit percent"
  | "limit separator"
  | "limit srcset";

/**
 * Judge a case: the importer and the oracle agree, and each planted bug that disagrees is caught.
 *
 * @param input - The case.
 * @param note - Where to note the case's situations.
 */
const judged = (input: HrefCase, note: (situation: Situation) => void): void => {
  const expected = oracleOf(input);

  assert.deepStrictEqual(importerOf(input), expected, Formatter.format(input));
  assert.strictEqual(
    hrefValueOf(input.lexical, input.whiteSpace),
    oracleValueOf(input.lexical, input.whiteSpace),
    Formatter.format(input),
  );
  note(expected.scope === "unresolved" ? `limit ${expected.limit}` : expected.scope);
  for (const bug of planted) {
    if (Formatter.format(bug.resolveOf(input)) !== Formatter.format(expected)) {
      note(`caught: ${bug.name}`);
    }
  }
};

/**
 * Every situation the searches require: each scope but the srcset limit, which the census
 * attribute's reading adds, and each planted bug caught.
 */
const situations: readonly [Situation, ...Situation[]] = [
  "entry",
  "external",
  "document",
  "limit percent",
  "limit octets",
  "limit separator",
  "limit backslash",
  "limit control",
  "limit colon",
  "caught: decodes before it splits",
  "caught: drops a byte order mark",
  "caught: ignores the bases",
  "caught: keeps a fragment's document",
];

/**
 * The tokens the small scope writes hrefs of: a plain segment, the dot segments plain and encoded,
 * an encoded `/`, a stray `%`, a space, and an empty segment.
 */
const smallTokens = ["a", ".", "..", "%2E", "%2F", "%", " ", ""] as const;

/**
 * The bases the small scope draws: none, a directory, a climb, an external one, a limit.
 */
const smallBases = [[], ["x/"], ["../"], ["http://h.org/"], ["%/"]] as const;

/**
 * Every case of the small scope: up to three tokens joined by `/`, under each of
 * {@link smallBases}, in a document at the root and below it, read as an `xs:anyURI`.
 */
const smallScope: Gen<HrefCase> = (source) => ({
  bases: source.draw(element(smallBases)),
  document: source.draw(element(["i.xml", "d/i.xml"] as const)),
  lexical: source.draw(array(element(smallTokens), { max: 3, min: 0 })).join("/"),
  whiteSpace: "collapse",
});

describe("import/overlays/package.ts resolveIn against test/resolution.ts", () => {
  it.effect(
    "resolves every swarmed and adversarial href as the oracle's RFC 3986 resolver does, and catches each planted bug",
    (ctx) =>
      // Oracle: a second implementation, the law oracle's resolver (`#pantry/test/resolution.ts`),
      // RFC 3986's §5.2.3 merge and §5.2.4 rules over text below a sentinel root, §6.2.2.2's
      // unreserved decoding first and its own UTF-8 decoder last.
      // Bound: 1,500 cases, a third the 41 adversarial cases by name under 3 whitespace classes, the
      // rest hrefs of up to 4 segments of 15 kinds under a swarm, in 7 documents, under up to 3
      // bases.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required<Situation | AdversarialName>(
              [...situations, ...adversarial.map(({ name }) => name)],
              { cases: 1200, sense: notesOnly },
            ),
            draw: drawn(cases),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the law oracle's RFC 3986 resolver over text",
            },
            runs: 1500,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/import/href-resolution",
          },
          (drawnCase, c) =>
            Effect.sync(() => {
              if (drawnCase._tag === "adversarial") {
                c.note(drawnCase.name);
              }

              judged(drawnCase.input, (situation) => {
                c.note(situation);
              });
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "resolves every href of the small scope as the oracle does, each planted bug caught inside it",
    (ctx) =>
      // Oracle: the same second implementation.
      // Bound: every href of up to three of 8 tokens, under 5 bases, in 2 documents, 5,850.
      searched(
        ctx,
        exhaust(
          {
            box: "every href of up to three of a . .. %2E %2F % space and empty, under none, x/, ../, an external and a % base, in i.xml and d/i.xml",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<Situation>([
              "entry",
              "external",
              "document",
              "limit percent",
              "limit separator",
              "caught: decodes before it splits",
              "caught: ignores the bases",
            ]),
            generator: smallScope,
            limit: 6000,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the law oracle's RFC 3986 resolver over text",
            },
            suite: "pantry/import/href-resolution-small",
          },
          (input: HrefCase, c) =>
            Effect.sync(() => {
              judged(input, (situation) => {
                c.note(situation);
              });
            }),
        ),
      ),
    testTimeoutMs,
  );

  it("resolves the readings' own examples as reading 102 states them", () => {
    // Oracle: the specification as a checker, each example of plan S3 and Aiden's ruling with the
    // resolution RFC 3986 and reading 102 give it, written out by hand.
    for (const [input, expected] of [
      [
        { bases: [], document: "items/i.xml", lexical: "images/../images/sign.png" },
        { path: "items/images/sign.png", scope: "entry" },
      ],
      [
        { bases: ["images/"], document: "items/i.xml", lexical: "sign.png" },
        { path: "items/images/sign.png", scope: "entry" },
      ],
      [
        { bases: [], document: "items/i.xml", lexical: "my sign.png" },
        { path: "items/my sign.png", scope: "entry" },
      ],
      [
        { bases: [], document: "items/i.xml", lexical: "my%20sign.png" },
        { path: "items/my sign.png", scope: "entry" },
      ],
      [{ bases: [], document: "items/i.xml", lexical: "../../a.png" }, { scope: "external" }],
      [
        { bases: [], document: "items/i.xml", lexical: "a/./b.png" },
        { path: "items/a/b.png", scope: "entry" },
      ],
      [
        { bases: [], document: "items/i.xml", lexical: "a/b/.." },
        { path: "items/a/", scope: "entry" },
      ],
      [{ bases: ["http://x/"], document: "items/i.xml", lexical: "a.png" }, { scope: "external" }],
      [
        { bases: [], document: "items/i.xml", lexical: "a%2Fb.png" },
        { limit: "separator", scope: "unresolved" },
      ],
    ] as const) {
      const value = { ...input, whiteSpace: "collapse" } as const;

      assert.deepStrictEqual(importerOf(value), expected, input.lexical);
      assert.deepStrictEqual(oracleOf(value), expected, input.lexical);
    }
  });
});
