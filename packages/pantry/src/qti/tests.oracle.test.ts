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
import { Array as Arr, Duration, Effect, Option, Schema } from "effect";
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
      "File exists",
      "Fragment context",
      "Inclusion cycle",
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

/**
 * A selection's predicate term as grizzle keeps it on its `desc`, read field by field: the shapes a
 * site's or a reference's selection is written in, each field optional.
 */
interface StoredTerm {
  readonly arg?: StoredTerm;
  readonly args?: readonly StoredTerm[];
  readonly field?: string;
  readonly kind: string;
  readonly left?: StoredTerm;
  readonly op?: string;
  readonly right?: StoredTerm;
  readonly value?: Value;
  readonly values?: readonly Value[];
}

/**
 * A value a selection compares: a field's, or a literal's, as the sites' and references' fields
 * hold them.
 */
type Value = boolean | string;

/**
 * The schema of a {@link Value}.
 */
const ValueSchema = Schema.Union([Schema.Boolean, Schema.String]);

/**
 * The schema of a {@link StoredTerm}.
 */
const StoredTermSchema: Schema.Codec<StoredTerm> = Schema.Struct({
  arg: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  args: Schema.optionalKey(
    Schema.Array(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  ),
  field: Schema.optionalKey(Schema.String),
  kind: Schema.String,
  left: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  op: Schema.optionalKey(Schema.String),
  right: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  value: Schema.optionalKey(ValueSchema),
  values: Schema.optionalKey(Schema.Array(ValueSchema)),
});

/**
 * A side of a statement as grizzle keeps it: a selection of a relation with its predicate, or a
 * whole relation, and its terms.
 */
const SideSchema = Schema.Struct({
  source: Schema.Union([
    Schema.Struct({
      desc: Schema.Struct({ predicate: StoredTermSchema }),
      relation: Schema.Struct({ name: Schema.String }),
    }),
    Schema.Struct({ name: Schema.String }),
  ]),
  terms: Schema.Array(Schema.Unknown),
});

/**
 * A containment as grizzle keeps it.
 */
const ContainedSchema = Schema.Struct({
  kind: Schema.Literal("contained"),
  left: SideSchema,
  right: SideSchema,
});

/**
 * A side as {@link SideSchema} reads it.
 */
type StoredSide = typeof SideSchema.Type;

/**
 * A row's values by field, as a selection's predicate reads them.
 */
type Row = Readonly<Record<string, Value>>;

/**
 * Evaluate a stored predicate term on a row: a field's value, a literal, and the comparisons and
 * connectives a selection is written in. A term of another kind is no value, so a predicate that
 * holds one never holds.
 *
 * @param term - The term.
 * @param row - The row.
 * @returns Its value, none for a term of another kind.
 */
const valueOf = (term: StoredTerm, row: Row): Value | undefined => {
  const holds = (operand: StoredTerm | undefined) =>
    operand !== undefined && valueOf(operand, row) === true;
  const readers = new Map<string, () => Value | undefined>([
    ["and", () => (term.args ?? []).every((arg) => holds(arg))],
    [
      "compare",
      () =>
        term.left !== undefined && term.right !== undefined
          ? (valueOf(term.left, row) === valueOf(term.right, row)) === (term.op === "eq")
          : undefined,
    ],
    ["field", () => (term.field === undefined ? undefined : row[term.field])],
    [
      "in",
      () => {
        const value = term.arg === undefined ? undefined : valueOf(term.arg, row);

        return value === undefined ? undefined : (term.values ?? []).includes(value);
      },
    ],
    ["literal", () => term.value],
    ["not", () => term.arg !== undefined && valueOf(term.arg, row) === false],
    ["or", () => (term.args ?? []).some((arg) => holds(arg))],
  ]);

  return readers.get(term.kind)?.();
};

/**
 * Whether a side of a statement holds a row: every row of a whole relation, and a selection's row
 * where its predicate holds.
 *
 * @param side - The side.
 * @param row - The row.
 * @returns Whether it holds it.
 */
const selects = (side: StoredSide, row: Row): boolean =>
  "desc" in side.source ? valueOf(side.source.desc.predicate, row) === true : true;

/**
 * The relation a side reads.
 *
 * @param side - The side.
 * @returns Its relation's name.
 */
const relationOf = (side: StoredSide): string =>
  "desc" in side.source ? side.source.relation.name : side.source.name;

/**
 * Whether two sides' terms are the same, field by field.
 */
const sameTerms = Arr.makeEquivalence<unknown>((a, b) => a === b);

/**
 * The test layer's containments from one relation's terms into another's, as grizzle keeps them.
 *
 * @param from - The contained side's relation and terms.
 * @param to - The containing side's relation and terms.
 * @returns The containments.
 */
const containmentsOf = (
  from: readonly [string, ...string[]],
  to: readonly [string, ...string[]],
): readonly (typeof ContainedSchema.Type)[] =>
  testLaws.flatMap((statement) =>
    Option.toArray(Schema.decodeUnknownOption(ContainedSchema)(statement)).filter(
      ({ left, right }) =>
        relationOf(left) === from[0] &&
        relationOf(right) === to[0] &&
        sameTerms(left.terms, from.slice(1)) &&
        sameTerms(right.terms, to.slice(1)),
    ),
  );

describe("qti/tests.ts, an external include", () => {
  it("judges Include target and the href's entry path only of a site whose href stays in the package, and proves the mark by the include's href reference", () => {
    // Oracle: reading 115 and the href scopes of readings 35 and 102: an include whose href
    // resolves outside the package is stored as written and never fetched, so it names no
    // document and breaks no law; one in the package names a listed document or is refused
    // "Include target". A section ref names a section document wherever its href resolves.
    const include = { external: false, kind: "xi:include" };
    const external = { ...include, external: true };
    const sectionRef = { external: true, kind: "qti-assessment-section-ref" };

    const [target, ...moreTargets] = containmentsOf(["Site", "node"], ["SiteTarget", "node"]);
    assert.isDefined(target, "Include target");
    assert.deepStrictEqual(moreTargets, []);
    if (target !== undefined) {
      assert.isTrue(selects(target.left, include), "an in-package include is judged");
      assert.isFalse(selects(target.left, external), "an external include is not");
      assert.isFalse(selects(target.left, { ...include, kind: sectionRef.kind }), "a section ref");
    }

    const [entry, ...moreEntries] = containmentsOf(
      ["Site", "node", "package", "path"],
      ["ReferencePath", "node", "package", "path"],
    );
    assert.isDefined(entry, "the site's entry path");
    assert.deepStrictEqual(moreEntries, []);
    if (entry !== undefined) {
      assert.isTrue(selects(entry.left, include), "an in-package include has its entry path");
      assert.isFalse(selects(entry.left, external), "an external include has none");
      assert.isTrue(selects(entry.left, sectionRef), "a section ref has one wherever it resolves");
    }

    const [mark, ...moreMarks] = containmentsOf(["Site", "node"], ["Reference", "node"]);
    assert.isDefined(mark, "the external mark's proof");
    assert.deepStrictEqual(moreMarks, []);
    if (mark !== undefined) {
      assert.isTrue(selects(mark.left, external), "an external site is proven");
      assert.isFalse(selects(mark.left, include), "an in-package site has its entry path");
      assert.isTrue(selects(mark.right, { name: "href", scope: "external" }));
      assert.isFalse(selects(mark.right, { name: "href", scope: "entry" }));
      assert.isFalse(selects(mark.right, { name: "src", scope: "external" }));
    }
  });
});
