/**
 * The single-CDN level's style rule (`#pantry/levels/cdn-style.ts`), with no database:
 *
 * - **Its laws**: the `Cdn` level states a `CdnStyle` check over the rule's derived relation, the
 *   `style` attributes, and every law it adds is a check over a relation of its own, so it states
 *   no law of `Qti` that `Qti` does not.
 * - **Its installation compiles**: grizzle's own check compiles an installation whose top level is
 *   the `Cdn` level, every statement of it, as `src/test/compile.test.ts` compiles `Qti`, so the
 *   rule's match is known to compile however `lawsOf` reads it.
 * - **Its pattern**, as a JavaScript regular expression under the flag `u`, the flag grizzle reads a
 *   pattern under, against the texts the rule names, written here apart from it: `url(`, `@import`,
 *   `image-set(` and `src(`, in any case, and the backslash.
 * - **Its entity bypass** (decision 488): an entity reference crust keeps unexpanded, which a player
 *   reading the external subset expands, hides a fetch from the pattern, so the rule's relation
 *   carries each style's count of kept references for its check to refuse.
 * - **What it selects**, #55's case (`src/qti/cdn.test.ts` at `b340be09`): only `style`, so a `class`
 *   holding any of those texts is free of every rule of the level.
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
import { AttributeGrammar } from "#pantry/grammar/install.ts";
import { singleCdn } from "#pantry/levels/cdn.ts";
import { uriDomains } from "#pantry/levels/cdn-data.ts";
import { uninterpretedClasses } from "#pantry/levels/cdn-foreign.ts";
import { fetchedNames } from "#pantry/levels/cdn-origin.ts";
import { cdnStyleRule, styleFetch, styleName } from "#pantry/levels/cdn-style.ts";
import { qti } from "#pantry/qti/schema.ts";
import { grizzleCheck, writtenCdnConfig } from "#pantry/test/grizzle-check.ts";
import { addedLaws } from "#pantry/test/level-laws.ts";
import { addressLists } from "#pantry/vocab/fetched.ts";

/**
 * The origin the level is built for.
 */
const origin = "https://cdn.example.com/";

/**
 * The derived relation the style rule judges: the `style` attributes.
 */
const styleRelation = "CdnStyleAttribute";

/**
 * The texts in a style the rule refuses, lowercased: each CSS function that takes an address as a
 * plain string, the `@import` rule, and the backslash that begins a CSS escape.
 *
 * @see {@link https://www.w3.org/TR/css-values-4/#urls | CSS Values 4, URLs}
 * @see {@link https://www.w3.org/TR/css-images-4/#image-set-notation | CSS Images 4, image-set()}
 * @see {@link https://www.w3.org/TR/css-syntax-3/#consume-escaped-code-point | CSS Syntax 3, consume an escaped code point}
 */
const fetchingTexts = ["url(", "@import", "image-set(", "src(", "\\"] as const;

describe("levels/cdn-style.ts, the laws", () => {
  it(
    "states a CdnStyle check over the rule's derived relation at the Cdn level, and no law over a Qti relation",
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
        added.flatMap((law) =>
          law.kind === "check" && law.name === "CdnStyle" ? [law.relation] : [],
        ),
        [styleRelation],
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
    // level's. Measurement owed (`src/test/timeouts.test.ts`, `exempt`).
    600_000,
  );

  it.effect(
    "grizzle check compiles an installation holding the Cdn level: no statement of it does not compile",
    () =>
      Effect.scoped(
        Effect.gen(function* compiles() {
          const config = yield* writtenCdnConfig("cdn-style-compile", origin);
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
    // and of the level, and every program of the author's login. Measurement owed
    // (`src/test/timeouts.test.ts`, `exempt`).
    360_000,
  );
});

describe("levels/cdn-style.ts, the check", () => {
  it("matches #55's cases with its pattern: each fetching text in any case and a backslash, and no plain colour style", () => {
    // Oracle: #55's CDN style cases (`git show pr-55-new2:packages/pantry/src/qti/cdn.test.ts`).
    const pattern = new RegExp(styleFetch, "u");
    const fetching = [
      "background: url(https://elsewhere.example.test/a.png)",
      "background: URL(a.png)",
      "@import 'a.css'",
      "@IMPORT 'a.css'",
      "background: image-set('a.png' 1x)",
      "background: -WebKit-Image-Set('a.png' 1x)",
      "src(a.woff)",
      String.raw`background: \75 rl(a.png)`,
    ];
    const plain = ["color: red", "color: red; font-weight: bold", "url (a.png)", ""];

    assert.deepStrictEqual(
      fetching.filter((style) => !pattern.test(style)),
      [],
      "a fetching style the pattern does not match",
    );
    assert.deepStrictEqual(
      plain.filter((style) => pattern.test(style)),
      [],
      "a plain style the pattern matches",
    );
  });

  it.effect(
    "admits a style exactly when it holds none of url(, @import, image-set( and src(, in any case, and no backslash",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required(["style admitted", "style refused"] as const, {
              cases: 200,
              sense: notesOnly,
            }),
            draw: drawn((source) => ({
              value: source
                .draw(
                  array(
                    element([
                      "url(",
                      "URL(",
                      "uRl(",
                      "url (",
                      "u",
                      "rl(",
                      "@import",
                      "@IMPORT",
                      "@ import",
                      "@im",
                      "port",
                      "image-set(",
                      "-WebKit-Image-Set(",
                      "image-set (",
                      "src(",
                      "SRC(",
                      "sr",
                      "c(",
                      "\\",
                      "\\75 rl(",
                      "color: red",
                      ";",
                      "x",
                    ]),
                    { max: 5, min: 0 },
                  ),
                )
                .join(""),
            })),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the texts the rule names, url(, @import, image-set( and src(, in any case, and the backslash",
            },
            runs: 2000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "levels/cdn-style/check",
          },
          ({ value }, c) =>
            Effect.sync(() => {
              const lowered = value.toLowerCase();
              const admitted = !fetchingTexts.some((text) => lowered.includes(text));
              const verdict = !new RegExp(styleFetch, "u").test(value);

              assert.strictEqual(verdict, admitted, JSON.stringify(value));
              c.note(verdict ? "style admitted" : "style refused");
            }),
        ),
      ),
  );
});

describe("levels/cdn-style.ts, the entity bypass", () => {
  it("judges each style's count of kept entity references, which the pattern cannot see while its expansion fetches", () => {
    // Oracle: XML 1.0 section 4.4 (a validating player includes the replacement text of an entity
    // the external subset declares, which crust never reads and keeps as `&name;`), and the texts
    // the rule names. Decision 488, claim 1, for the style rule: the pattern admits the kept form,
    // so the rule must judge each row's count of kept references, which its relation then carries
    // for its check.
    const kept = "color: red; background: &far;";
    const expanded = kept.replace("&far;", "url(https://elsewhere.example.test/a.png)");
    const { relations } = cdnStyleRule(qti(), origin);

    assert.isFalse(new RegExp(styleFetch, "u").test(kept), `the pattern matches ${kept}`);
    assert.isTrue(
      fetchingTexts.some((text) => expanded.toLowerCase().includes(text)),
      `${expanded} fetches nothing`,
    );
    assert.include(
      Object.keys(relations.CdnStyleAttribute.heading),
      "entities",
      `${styleRelation} judges no count of kept entity references`,
    );
  });
});

describe("levels/cdn-style.ts, what it selects", () => {
  it("judges only a style attribute, and no rule of the level selects a class attribute, which #55 left free whatever it holds", () => {
    // Oracle: #55's CDN style case (`src/qti/cdn.test.ts` at `b340be09`), which admitted a `class`
    // holding any drawn text. Here against what each rule's relations select: the style rule only
    // `styleName`; the origin rule a fetched name; the data rule an `xs:anyURI` domain or an
    // address list; the foreign rule an uninterpreted open class.
    assert.strictEqual(styleName, "style");
    assert.isFalse(
      new Set<string>(fetchedNames.map(({ name }) => name)).has("class"),
      "the origin rule selects class",
    );
    assert.isFalse(
      new Set<string>(addressLists).has("class"),
      "the data rule reads class as a list",
    );
    assert.deepStrictEqual(
      AttributeGrammar.rows.filter(
        ({ domain, name }) => name === "class" && uriDomains.includes(domain),
      ),
      [],
      "the data rule reads class as an xs:anyURI",
    );
    assert.isFalse(
      new Set<string>(uninterpretedClasses).has("class"),
      "the foreign rule selects class",
    );
  });
});
