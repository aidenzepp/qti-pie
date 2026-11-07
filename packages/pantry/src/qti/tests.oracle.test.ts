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
import { Duration, Effect } from "effect";
import { attributeLaws } from "#pantry/qti/attributes.ts";
import { chardataLaws } from "#pantry/qti/chardata.ts";
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
      "Selection bound",
      "Selection required",
      "Test name key",
      "Variable mapping target",
    ]);
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

describe("qti/tests.ts, collapsedPattern", () => {
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
});
