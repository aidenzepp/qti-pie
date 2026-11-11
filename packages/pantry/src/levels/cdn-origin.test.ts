/**
 * The single-CDN level's origin rule (`#pantry/levels/cdn-origin.ts`), with no database:
 *
 * - **Its laws**: the `Cdn` level states a `CdnOrigin` check over each of the rule's derived
 *   relations, the fetched attributes of each address form and the fetched texts, and every law it
 *   adds is a check over a relation of its own, so it states no law of `Qti` that `Qti` does not.
 * - **Its installation compiles**: grizzle's own check compiles an installation whose top level is
 *   the `Cdn` level, every statement of it, as `src/test/compile.test.ts` compiles `Qti`, so the
 *   rule's matches are known to compile however `lawsOf` reads them.
 * - **Its patterns**, as JavaScript regular expressions under the flag `u`, the flags grizzle reads a
 *   pattern under, against the readings they state, written here apart from the patterns: HTML's
 *   srcset parser, written from the HTML Standard, and the URL Standard's leading strip; and every
 *   address a pattern admits against the URL Standard's own parser (Node's `URL`), which must
 *   resolve it on the origin.
 * - **Its two bypasses** (decision 488): an entity reference crust keeps unexpanded, which a player
 *   reading the external subset expands, is refused in a fetched attribute however the rest of its
 *   value reads; and every governor an element of a fetched kind may hold is one the rule selects,
 *   so no `xsi:type` takes a fetched value out of it.
 * - **What it selects**, #55's cases (`src/qti/cdn.test.ts` at `b340be09`): every fetched attribute
 *   under every governor of its kind and every fetched text, and none of the links, identifiers and
 *   texts the player never fetches; and the fetched rows themselves against the grammar.
 */
import { lawsOf } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { GoverningOf, grammar, KindGovernor } from "#pantry/grammar/install.ts";
import { singleCdn } from "#pantry/levels/cdn.ts";
import {
  addressPattern,
  candidatesPattern,
  cdnOriginRule,
  fetchedNames,
  governorsOf,
  textGovernors,
} from "#pantry/levels/cdn-origin.ts";
import { qti } from "#pantry/qti/schema.ts";
import { grizzleCheck, writtenCdnConfig } from "#pantry/test/grizzle-check.ts";
import { addedLaws } from "#pantry/test/level-laws.ts";
import { addressLists, fetchedAttributes, fetchedTexts } from "#pantry/vocab/fetched.ts";

/**
 * The origins every case is judged under: one plain, and one with a port and a hyphen, so a
 * pattern that reads either wrongly is seen.
 */
const origins = ["https://cdn.example.com/", "https://media-cdn.example.test:8443/"] as const;

/**
 * The origin the level's laws are read under.
 */
const [origin] = origins;

/**
 * The derived relations the origin rule judges: the fetched attributes read as one address, those
 * read as a `srcset`, and the fetched texts.
 */
const originRelations = ["CdnFetchedAddress", "CdnFetchedCandidates", "CdnFetchedText"] as const;

describe("levels/cdn-origin.ts, the laws", () => {
  it(
    "states a CdnOrigin check over each derived relation of the rule at the Cdn level, and no law over a Qti relation",
    () => {
      // Oracle: spec U12 done_when, "lawsOf lists the four checks at level Cdn and no new Qti
      // law"; GOAL G4, a level only adds laws.
      const base = qti();
      const level = singleCdn(base, { origin });
      const baseLaws = lawsOf(base);
      const levelLaws = lawsOf(level);
      const added = addedLaws(levelLaws, baseLaws);
      // A level's record holds every relation of every level of it; a live derived relation is no
      // whole entry (`wholeEntriesOf`), so the record is what names the level's own.
      const baseNames = new Set(Object.keys(base.relations));
      const ownNames = new Set(Object.keys(level.relations).filter((name) => !baseNames.has(name)));

      assert.deepStrictEqual(
        added
          .flatMap((law) =>
            law.kind === "check" && law.name === "CdnOrigin" ? [law.relation] : [],
          )
          .toSorted(),
        [...originRelations],
      );
      assert.deepStrictEqual(addedLaws(baseLaws, levelLaws), [], "a Qti law the level drops");
      for (const law of added) {
        assert.isTrue(
          law.kind === "check" && ownNames.has(law.relation),
          `${Formatter.format(law)} is a law the level states over no relation of its own`,
        );
      }
    },
    // How long reading the level's laws may take: `lawsOf` compiles `Qti`'s law model and the
    // level's. Measurement owed (`exempt` of `src/test/timeouts.test.ts`): on 2026-11-10 it ran
    // 113.6 s, 83.7 s and 117.1 s at load averages of 22.5 to 66.2, and 259.1 s at 32 to 84, never
    // at 60 or more throughout; 600_000, the sibling rule's, is over twice the slowest.
    600_000,
  );

  it.effect(
    "grizzle check compiles an installation holding the Cdn level: no statement of it does not compile",
    () =>
      Effect.scoped(
        Effect.gen(function* compiles() {
          const config = yield* writtenCdnConfig("cdn-origin-compile", origin);
          const { code, output } = yield* grizzleCheck(config);
          const lines = output.split("\n");

          // Oracle: grizzle's `compileSchema` and program compilation, as `grizzle check` runs
          // them over the installation. Drift against the committed snapshot passes, as in
          // `src/test/compile.test.ts`. Bound: the one installation; residual none.
          assert.isTrue(
            code === 0 || code === 1,
            `grizzle check exited ${String(code)}:\n${output}`,
          );
          assert.isTrue(
            lines.some((line) => line.startsWith("Cdn: ")),
            `grizzle check printed no Cdn line:\n${output}`,
          );
          assert.deepStrictEqual(
            lines.filter((line) => line.includes("does not compile")),
            [],
          );
        }),
      ),
    // How long grizzle's check of the installation may take: it compiles every statement of `Qti`
    // and of the level, and every program of the author's login. Measurement owed (`exempt` of
    // `src/test/timeouts.test.ts`): on 2026-11-10 it ran 67.6 s, 158.9 s and 57.2 s at load
    // averages of 22.5 to 66.2, and 118.5 s at 43 to 84, never at 60 or more throughout; 360_000,
    // the sibling rule's, is over twice the slowest.
    360_000,
  );
});

/**
 * HTML's ASCII whitespace.
 *
 * @see {@link https://infra.spec.whatwg.org/#ascii-whitespace | Infra Standard, ASCII whitespace}
 */
const htmlSpace = new Set(["\t", "\n", "\f", "\r", " "]);

/**
 * The address a player resolves a relative one against: a document of a package on another host.
 */
const playerDocument = "https://player.example.test/package/items/item.xml";

/**
 * Decide whether an address resolves on an origin, as the URL Standard's parser resolves it
 * against the player's document.
 *
 * @param address - The address as written.
 * @param on - The origin.
 * @returns Whether it parses and its URL starts with the origin.
 */
const resolvesOn = (address: string, on: string): boolean =>
  URL.canParse(address, playerDocument) && new URL(address, playerDocument).href.startsWith(on);

/**
 * Find where a run of characters a test holds ends: the first position from `from` whose
 * character the test refuses, or the text's end.
 *
 * @param text - The text.
 * @param from - Where the run starts.
 * @param holds - The test.
 * @returns The run's end.
 */
const runEnd = (text: string, from: number, holds: (character: string) => boolean): number => {
  let at = from;
  while (at < text.length && holds(text.charAt(at))) {
    at += 1;
  }

  return at;
};

/**
 * Strip what the URL Standard strips before a URL: its leading C0 controls and spaces.
 *
 * @param address - The address as written.
 * @returns It without them.
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser, step 1}
 */
const stripped = (address: string): string =>
  address.slice(runEnd(address, 0, (character) => (character.codePointAt(0) ?? 0) <= 0x20));

/**
 * Decide whether a character is one HTML's splitting loop skips between candidates: ASCII
 * whitespace or a comma.
 *
 * @param character - The character.
 * @returns Whether the loop skips it.
 */
const betweenCandidates = (character: string): boolean =>
  htmlSpace.has(character) || character === ",";

/**
 * Find where a candidate's descriptors end, as HTML's descriptor tokenizer reads them past its
 * URL: after the first comma outside parentheses, or at the text's end.
 *
 * @param text - The `srcset`.
 * @param from - The position after the candidate's URL.
 * @returns The position the splitting loop resumes at.
 */
const descriptorsEnd = (text: string, from: number): number => {
  let inParens = false;
  for (let at = from; at < text.length; at += 1) {
    const character = text.charAt(at);
    if (inParens) {
      inParens = character !== ")";
    } else if (character === ",") {
      return at + 1;
    } else {
      inParens = character === "(";
    }
  }

  return text.length;
};

/**
 * Collect the URL of each image candidate of a `srcset`, as HTML's algorithm collects them: the
 * splitting loop skips whitespace and commas, a URL is the run of non-whitespace that follows, a
 * URL ending in commas loses them and ends its candidate, and any other is followed by its
 * descriptors, read up to a comma outside parentheses. Every candidate's URL is listed, those whose
 * descriptors HTML then drops among them, so a pattern that holds every URL holds every one HTML
 * fetches.
 *
 * @param srcset - The attribute's value.
 * @returns The candidates' URLs, in order.
 * @see {@link https://html.spec.whatwg.org/multipage/images.html#parsing-a-srcset-attribute | HTML Standard, parsing a srcset attribute}
 */
const candidateUrls = (srcset: string): readonly string[] => {
  const urls: string[] = [];
  let position = runEnd(srcset, 0, betweenCandidates);
  while (position < srcset.length) {
    const end = runEnd(srcset, position, (character) => !htmlSpace.has(character));
    const url = srcset.slice(position, end);
    const commas = url.endsWith(",");
    urls.push(commas ? url.replace(/,+$/u, "") : url);
    position = runEnd(srcset, commas ? end : descriptorsEnd(srcset, end), betweenCandidates);
  }

  return urls;
};

/**
 * Collect the pieces a drawn value is made of: an origin's own text and spellings of it the origin
 * does not write, another host, a relative path, a `data:` scheme in several cases, whitespace
 * HTML and the URL Standard read, a C0 control the URL Standard strips, commas, parentheses,
 * descriptors and an entity reference.
 *
 * @param on - The origin.
 * @returns The pieces.
 */
const piecesOf = (on: string) =>
  [
    on,
    on.toUpperCase(),
    on.replace("https:", ""),
    on.replace("https://", ""),
    on.slice(0, -1),
    "https://elsewhere.example.test/",
    "data:",
    "DaTa:",
    "da\tta:",
    "image.png",
    "a/",
    "../",
    " ",
    "\t",
    "\n",
    "\u0001",
    ",",
    "(",
    ")",
    " 1x",
    " 2w",
    "&cdn;",
  ] as const;

/**
 * The address forms a fetched value is read in.
 */
const forms = ["address", "candidates"] as const;

/**
 * The features the pattern search steers by: each form, seen admitted and refused.
 */
const patternFeatures = [
  "address admitted",
  "address refused",
  "candidates admitted",
  "candidates refused",
] as const;

/**
 * Compile an origin's pattern of a form as JavaScript reads it, under the flag `u`.
 *
 * @param on - The origin.
 * @param form - The form.
 * @returns The regular expression.
 */
const patternOf = (on: string, form: (typeof forms)[number]): RegExp =>
  new RegExp(form === "address" ? addressPattern(on) : candidatesPattern(on), "u");

describe("levels/cdn-origin.ts, the patterns", () => {
  it.effect(
    "admit an address exactly when, past the URL Standard's leading strip, it starts with the origin, and a srcset exactly when every candidate's URL does, as HTML parses it; and each address they admit resolves on the origin",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required(patternFeatures, { cases: 400, sense: notesOnly }),
            draw: drawn((source) => {
              const on = source.draw(element(origins));

              return {
                form: source.draw(element(forms)),
                on,
                value: source.draw(array(element(piecesOf(on)), { max: 7, min: 0 })).join(""),
              };
            }),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the URL Standard's leading strip and parser (Node's URL), and HTML's srcset parser written from the HTML Standard",
            },
            runs: 4000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "levels/cdn-origin/patterns",
          },
          ({ form, on, value }, c) =>
            Effect.sync(() => {
              const addresses = form === "candidates" ? candidateUrls(value) : [stripped(value)];
              const admitted = addresses.every((address) => address.startsWith(on));
              const verdict = patternOf(on, form).test(value);
              const shown = `${form} under ${on}: ${JSON.stringify(value)}`;

              assert.strictEqual(verdict, admitted, shown);
              c.note(verdict ? `${form} admitted` : `${form} refused`);
              if (verdict) {
                for (const address of addresses) {
                  assert.isTrue(
                    resolvesOn(address, on),
                    `${shown}: ${JSON.stringify(address)} resolves off the origin`,
                  );
                }
              }
            }),
        ),
      ),
  );
});

/**
 * A fetched kind's value under each governing type, one per fetched attribute and fetched text,
 * with the governors the rule selects it under.
 */
const fetchedUnderGovernors = [
  ...fetchedAttributes.map(({ form, kind, name }) => ({
    governors: governorsOf(
      fetchedAttributes
        .filter((row) => row.form === form && row.name === name)
        .map((row) => row.kind),
    ),
    kind,
    what: `${kind}'s ${name}`,
  })),
  ...fetchedTexts.map((kind) => ({
    governors: governorsOf(fetchedTexts),
    kind,
    what: `${kind}'s text`,
  })),
];

describe("levels/cdn-origin.ts, the bypasses", () => {
  it("refuses an entity reference kept in a fetched attribute, which a srcset's pattern admits while its expansion is off the origin", () => {
    // Oracle: XML 1.0 section 4.4 (a validating player includes the replacement text of an entity
    // the external subset declares, which crust never reads and keeps as `&name;`), and HTML's
    // srcset parser as `candidateUrls` writes it. Decision 488, claim 1. Evidence without a
    // database: the pattern admits the kept form, so the rule must judge each row's count of kept
    // references, which each relation of fetched attributes then carries for its check.
    const kept = `${origin}a.png 1x&far;`;
    const expanded = kept.replace("&far;", ", https://elsewhere.example.test/b.png 2x");
    const { relations } = cdnOriginRule(qti(), origin);

    assert.isTrue(patternOf(origin, "candidates").test(kept), `the pattern refuses ${kept}`);
    assert.isFalse(
      candidateUrls(expanded).every((url) => url.startsWith(origin)),
      `${expanded} holds no candidate off the origin`,
    );
    for (const relation of [relations.CdnFetchedAddress, relations.CdnFetchedCandidates]) {
      assert.include(
        Object.keys(relation.heading),
        "entities",
        `${relation.name} judges no count of kept entity references`,
      );
    }
  });

  it("selects each fetched value under every governor an element of its kind may hold, so no xsi:type takes one out of the rule", () => {
    // Oracle: Qti's model of an element's governor (`Node.governor`, which `Attribute` copies): its
    // kind's own (`KindGovernor`) where no named type governs it, or `GoverningOf`'s governor at
    // each (version, kind, type) a law admits the type at; an xsi:type naming any other type is
    // refused before the rule judges anything. The rule selects by that governor, so every
    // governor of either source must be one it reads. Decision 488, claim 2.
    const unselected = fetchedUnderGovernors.flatMap(({ governors, kind, what }) =>
      [
        ...KindGovernor.rows
          .filter((row) => row.kind === kind)
          .map(({ governor }) => ({ governor, shown: `${what} under its kind's own governor` })),
        ...GoverningOf.rows
          .filter((row) => row.kind === kind)
          .map(({ governor, governs, version }) => ({
            governor,
            shown: `${what} under ${governs} in ${version}`,
          })),
      ].flatMap(({ governor, shown }) => (governors.includes(governor) ? [] : [shown])),
    );

    assert.deepStrictEqual(
      fetchedUnderGovernors.filter(
        ({ kind }) => !KindGovernor.rows.some((row) => row.kind === kind),
      ),
      [],
      "a fetched kind with no governor of its own",
    );
    assert.deepStrictEqual(unselected, []);
  });
});

/**
 * Attributes the player never fetches, which #55's CDN origin left free: a link, identifiers
 * written as URIs, an image's text, response processing's template, and a MathML element's link.
 */
const freeFields = [
  { governor: "a", name: "href" },
  { governor: "img", name: "longdesc" },
  { governor: "img", name: "alt" },
  { governor: "qti-portable-custom-interaction", name: "custom-interaction-type-identifier" },
  { governor: "qti-response-processing", name: "template" },
  { governor: "m:mglyph", name: "href" },
] as const;

/**
 * Decide whether the origin rule selects an attribute under a governor, in any address form.
 *
 * @param governor - The element's governor.
 * @param name - The attribute's name.
 * @returns Whether a relation of the rule selects it.
 */
const selected = (governor: string, name: string): boolean =>
  fetchedNames.some((fetched) => fetched.name === name && fetched.governors.includes(governor));

describe("levels/cdn-origin.ts, what it selects", () => {
  it("selects every fetched attribute under every governor of its kind, in its form, and every fetched text's governor, and none of #55's free fields or a value's text", () => {
    // Oracle: #55's CDN origin case (`src/qti/cdn.test.ts` at `b340be09`): its fetched fields,
    // each fetched attribute under each governor `governorsOf([kind])` gives, judged in its form;
    // its fetched texts under `governorsOf(fetchedTexts)`; and its free fields and `qti-value`'s
    // text, always admitted. Here against the selection the rule's relations read.
    const fetchedFields = fetchedAttributes.flatMap(({ form, kind, name }) =>
      governorsOf([kind]).map((governor) => ({ form, governor, name })),
    );

    assert.deepStrictEqual(
      fetchedFields
        .filter(
          ({ form, governor, name }) =>
            !fetchedNames.some(
              (fetched) =>
                fetched.form === form &&
                fetched.name === name &&
                fetched.governors.includes(governor),
            ),
        )
        .map(({ governor, name }) => `${governor}'s ${name}`),
      [],
      "a fetched field the rule does not select in its form",
    );
    assert.deepStrictEqual(
      governorsOf(fetchedTexts).filter((governor) => !textGovernors.includes(governor)),
      [],
      "a fetched text the rule does not select",
    );
    assert.deepStrictEqual(
      freeFields
        .filter(({ governor, name }) => selected(governor, name))
        .map(({ governor, name }) => `${governor}'s ${name}`),
      [],
      "a free field the rule selects",
    );
    assert.notInclude(textGovernors, "qti-value", "the rule selects a value's text");
  });

  it("declares fetched attributes the grammar admits, fetched texts and address lists of the domains it names, and every media URL the grammar types URLDType as a fetched attribute", () => {
    // Oracle: #55's vocab/fetched.ts case (`src/qti/cdn.test.ts` at `b340be09`): the grammar's
    // admission rows and value domains, against the rows the origin and data rules read.
    const admitted = new Set(
      grammar.attributes.admission.rows.map(({ kind, name }) => `${kind} ${name}`),
    );
    const domains = new Map(
      grammar.attributes.valueDomain.rows.map(({ domain, primitive }) => [domain, primitive]),
    );
    const fetched = new Set(fetchedAttributes.map(({ kind, name }) => `${kind} ${name}`));

    for (const { kind, name } of fetchedAttributes) {
      assert.isTrue(admitted.has(`${kind} ${name}`), `${kind} admits no ${name}`);
    }

    for (const kind of fetchedTexts) {
      const texts = grammar.attributes.text.rows.filter((row) => row.kind === kind);

      assert.isNotEmpty(texts, `${kind} has no text`);
      for (const { domain } of texts) {
        assert.strictEqual(domains.get(domain), "anyURI", `${kind}'s text`);
      }
    }

    for (const name of addressLists) {
      const lists = grammar.attributes.admission.rows.filter((row) => row.name === name);

      assert.isNotEmpty(lists, name);
      for (const { domain } of lists) {
        assert.strictEqual(domains.get(domain), "list", name);
      }
    }

    for (const { domain, kind, name } of grammar.attributes.admission.rows) {
      if (domain.startsWith("URLDType")) {
        assert.isTrue(fetched.has(`${kind} ${name}`), `${kind}'s ${name}, a media URL, is fetched`);
      }
    }
  });
});
