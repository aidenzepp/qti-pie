/**
 * The test layer's free tests: its statements build beside the document layer's, each check is
 * named by an oracle law, and the patterns its laws judge text by are the languages the
 * specifications state.
 *
 * The database tests (`tests.db.test.ts`) judge the laws through PostgreSQL; the overlay builders'
 * tests (`#pantry/import/overlays/tests.test.ts`) judge the rows the laws read.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { attributeLaws } from "#pantry/qti/attributes.ts";
import { chardataLaws } from "#pantry/qti/chardata.ts";
import { resolvedHref } from "#pantry/qti/limits.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { packageLaws } from "#pantry/qti/package.ts";
import { Qti } from "#pantry/qti/schema.ts";
import {
  branchLaws,
  collapsedPattern,
  inclusionLaws,
  itemRefLaws,
  testLaws,
  testNameLaws,
  testOverlayLaws,
  testRelations,
  truePattern,
} from "#pantry/qti/tests.ts";
import { lawNames, ruleOf } from "#pantry/test/oracle.ts";

describe("qti/tests.ts, declared", () => {
  it("builds a schema of Node, the character data, the attributes, the package and the test layer with every law, each statement once", () => {
    const built = schema("TestLayer", { ...Qti.relations }, [
      ...nodeLaws,
      ...chardataLaws,
      ...attributeLaws,
      ...packageLaws,
      ...testLaws,
    ]);

    for (const relation of Object.values(testRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(built.relations, relation.name)?.value,
        relation,
      );
    }

    assert.strictEqual(new Set(testLaws).size, testLaws.length);
    assert.strictEqual(
      testLaws.length,
      testOverlayLaws.length +
        inclusionLaws.length +
        testNameLaws.length +
        branchLaws.length +
        itemRefLaws.length,
    );
    assert.strictEqual(
      built.statements.length,
      nodeLaws.length +
        chardataLaws.length +
        attributeLaws.length +
        packageLaws.length +
        testLaws.length,
    );
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = testLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );

    for (const name of named) {
      const law = lawNames.find((known) => known === name);

      assert.isDefined(law, `${name} is no oracle law`);
      if (law !== undefined) {
        assert.isDefined(ruleOf(law), name);
      }
    }

    assert.deepStrictEqual([...new Set(named)].toSorted(), [
      "Branch forward",
      "Branch target",
      "E1 derived",
      "Fragment context",
      "Item ref target",
      "Section parts",
      "Selection bound",
      "Selection required",
      "Test name key",
      "Variable mapping target",
    ]);
  });
});

/**
 * The characters the href box writes hrefs over: two letters, a non-ASCII letter, and each
 * character that makes an href take a resolution `Compute.concat` cannot state.
 */
const hrefAlphabet = ["a", "é", ".", "/", "%", "?", "#", ":", " ", "\\"] as const;

/**
 * Every href of at most four characters over {@link hrefAlphabet}.
 */
const hrefs = array(element(hrefAlphabet), { max: 4, min: 0 });

/**
 * A situation the href box must reach: an href the form admits, one it refuses that URL
 * resolution resolves elsewhere, and one it refuses whose resolution would have agreed.
 */
type HrefSituation = "admitted" | "refused, resolves elsewhere" | "refused, a stated limit";

/**
 * The base an href of the box resolves against: a document at `d/x.xml` of a package whose root
 * is `pkg:/`, a URL whose scheme no special parsing applies to.
 */
const base = "pkg:/d/x.xml";

/**
 * Resolve an href as RFC 3986 §5.2 and the WHATWG URL Standard do, against {@link base}, and read
 * the entry path it names: its path, decoded, beside its query and fragment.
 *
 * @param href - The href.
 * @returns The decoded path with no leading `/`, and whether a query or fragment remains; none
 *   where the href is no URL reference or its path does not decode.
 */
const resolve = (href: string): { readonly extra: boolean; readonly path: string } | undefined => {
  if (!URL.canParse(href, base)) {
    return undefined;
  }

  const url = new URL(href, base);
  const decoded = Effect.runSync(
    Effect.try(() => decodeURIComponent(url.pathname)).pipe(Effect.option),
  );

  return Option.isSome(decoded) && url.protocol === "pkg:"
    ? {
        extra: url.search !== "" || url.hash !== "",
        path: decoded.value.replace(/^\//u, ""),
      }
    : undefined;
};

describe("qti/limits.ts, resolvedHref", () => {
  it.effect(
    "admits only hrefs that name the entry at their document's directory followed by the href as written",
    (ctx) =>
      // Oracle: a second implementation, the WHATWG URL Standard's resolution (`new URL`), which
      // implements RFC 3986 §5.2, read back by decoding its path: every href the form admits names
      // `d/` followed by itself, with no query or fragment.
      // Bound: every href of at most 4 characters over 10, 11,111.
      searched(
        ctx,
        exhaust(
          {
            box: "every href of at most 4 characters over a, é, ., /, %, ?, #, :, space and \\",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<HrefSituation>([
              "admitted",
              "refused, resolves elsewhere",
              "refused, a stated limit",
            ]),
            generator: hrefs,
            limit: 12_000,
            literal: (characters) => JSON.stringify(characters.join("")),
            oracle: {
              kind: "second-implementation",
              name: "the WHATWG URL Standard's resolution against pkg:/d/x.xml",
            },
            suite: "qti/limits-resolved-href",
          },
          (characters: readonly string[], c) =>
            Effect.sync(() => {
              const href = characters.join("");
              const resolved = resolve(href);
              const agrees =
                resolved !== undefined && !resolved.extra && resolved.path === `d/${href}`;
              const admitted = new RegExp(resolvedHref, "u").test(href);

              if (admitted) {
                c.note("admitted");
                assert.isTrue(
                  agrees,
                  `${JSON.stringify(href)} is admitted, so it resolves to d/ and itself`,
                );
              } else {
                c.note(agrees ? "refused, a stated limit" : "refused, resolves elsewhere");
              }
            }),
        ),
      ),
  );

  it("refuses the valid URI references its doc names, and admits plain paths", () => {
    // Oracle: the specification as a checker, RFC 3986 §4.1 and §5.2: each of these is a URI
    // reference, the first group of a form no concatenation resolves, the second plain.
    const form = new RegExp(resolvedHref, "u");

    for (const href of [
      "../items/a.xml",
      "./a.xml",
      "a/./b.xml",
      "a%20b.xml",
      "a.xml#part",
      "a.xml?v=1",
      "https://example.org/a.xml",
      "/a.xml",
      "a b.xml",
      "",
      "a/",
    ]) {
      assert.isFalse(form.test(href), href);
    }

    for (const href of ["a.xml", "items/a.xml", "..a/b.xml", ".hidden/a.xml", "a/b:c.xml"]) {
      assert.isTrue(form.test(href), href);
    }
  });
});

/**
 * The characters a padded lexical form is written over in the collapse box: whitespace and two
 * non-whitespace characters.
 */
const paddedAlphabet = [" ", "\t", "\n", "a", "b"] as const;

/**
 * Every text of at most four characters over {@link paddedAlphabet}.
 */
const padded = array(element(paddedAlphabet), { max: 4, min: 0 });

/**
 * A situation the collapse box must reach.
 */
type CollapseSituation = "collapsed" | "padded" | "empty";

describe("qti/tests.ts, collapsedPattern and truePattern", () => {
  it.effect(
    "collapsedPattern admits exactly a nonempty value with no XML whitespace at either end",
    (ctx) =>
      // Oracle: the specification as a checker, XML Schema Part 2 §4.3.6: collapse strips the
      // whitespace at either end, so a collapsed value has none there.
      // Bound: every text of at most 4 characters over space, tab, line feed, a and b, 781.
      searched(
        ctx,
        exhaust(
          {
            box: "every text of at most 4 characters over space, tab, line feed, a and b",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<CollapseSituation>(["collapsed", "padded", "empty"]),
            generator: padded,
            limit: 800,
            literal: (characters) => JSON.stringify(characters.join("")),
            oracle: { kind: "specification", name: "XML Schema Part 2 §4.3.6, collapse" },
            suite: "qti/tests-collapsed-pattern",
          },
          (characters: readonly string[], c) =>
            Effect.sync(() => {
              const text = characters.join("");
              const space = (at: number) => /[\t\n\r ]/u.test(text.charAt(at));
              const collapsed = text !== "" && !space(0) && !space(text.length - 1);
              const situation = (): CollapseSituation => {
                if (text === "") {
                  return "empty";
                }

                return collapsed ? "collapsed" : "padded";
              };
              c.note(situation());

              assert.strictEqual(new RegExp(collapsedPattern, "u").test(text), collapsed, text);
            }),
        ),
      ),
  );

  it("truePattern admits exactly the xs:boolean forms whose collapsed value is true or 1", () => {
    // Oracle: the specification as a checker, XML Schema Part 2 §3.2.2.1: boolean's lexical space
    // is {true, false, 1, 0}, true and 1 naming true, its whitespace collapsed.
    // Bound: each of the four forms under every padding of at most one of space, tab and line feed
    // on each side, 64.
    const form = new RegExp(truePattern, "u");
    for (const lead of ["", " ", "\t", "\n"]) {
      for (const trail of ["", " ", "\t", "\n"]) {
        for (const value of ["true", "false", "1", "0"]) {
          assert.strictEqual(
            form.test(`${lead}${value}${trail}`),
            value === "true" || value === "1",
            JSON.stringify(`${lead}${value}${trail}`),
          );
        }
      }
    }
  });
});
