import { existsSync } from "node:fs";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { readRows } from "#pantry/import/package.ts";
import { ruleOfError } from "#pantry/import/refusal.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { AttributeIdref } from "#pantry/schema/attributes.ts";
import { HtmlId } from "#pantry/schema/document.ts";
import { ForeignAttribute, ForeignElement } from "#pantry/schema/foreign.ts";
import { arms } from "#pantry/schema/mathml/arms.ts";
import { familyRelation } from "#pantry/schema/mathml/attributes.ts";
import { Edge, Node } from "#pantry/schema/node.ts";
import {
  examplesTarball,
  fixtureNames,
  materialize,
  mathmlCommitNegatives,
} from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { annotationXmlBlock, mathmlGroups } from "#pantry/test/mathml-blocks.ts";
import type { MathmlGroup } from "#pantry/test/mathml-blocks.ts";

/**
 * Whether the examples tarball, which every cut positive is cut from, is on this machine.
 */
const tarballPresent = existsSync(Effect.runSync(examplesTarball));

/**
 * The 12 cut MathML positives of spec 4.11's first table, in the table's order.
 */
const positives = [
  "math-mathml",
  "math-stat2",
  "math-calc5",
  "math-solution",
  "math-template-block",
  "math-alttext",
  "math-polynomials",
  "math-order",
  "math-associate",
  "math-either-or",
  "math-inline-choice",
  "math-class",
] as const satisfies readonly FixtureName[];

/**
 * The 18 generated MathML positives, in the order of the groups of `mathmlGroups`.
 */
const generated = [
  "math-gen-1",
  "math-gen-2",
  "math-gen-3",
  "math-gen-4",
  "math-gen-5",
  "math-gen-6",
  "math-gen-7",
  "math-gen-8",
  "math-gen-9",
  "math-gen-10",
  "math-gen-11",
  "math-gen-12",
  "math-gen-13",
  "math-gen-14",
  "math-gen-15",
  "math-gen-16",
  "math-gen-17",
  "math-gen-18",
] as const satisfies readonly FixtureName[];

/**
 * The MathML kinds a group's blocks declare: their handles that name a MathML kind, which leaves
 * out the roster host a host block names first.
 */
const declaredKinds = (group: MathmlGroup): ReadonlySet<string> =>
  new Set(group.blocks.flatMap((block) => block.handles.filter((handle) => handle in arms)));

/**
 * The `(kind, attribute)` pairs a group's blocks declare, each written `<kind> <attribute>`.
 */
const declaredPairs = (group: MathmlGroup): ReadonlySet<string> =>
  new Set(
    group.blocks.flatMap((block) => block.pairs.map(([kind, attribute]) => `${kind} ${attribute}`)),
  );

/**
 * The MathML `(kind, attribute)` pairs a package's rows hold, each written `<kind> <attribute>`:
 * the rows of every attribute family, the `id` of an `HtmlId` row, the `xref` of an
 * `AttributeIdref` row, which names its node, and the `actiontype` of an `m:maction` arm.
 */
const pairsOf = (rows: Rows): ReadonlySet<string> => {
  const kindOf = new Map(Rows.of(rows, Node).map((node) => [node.id, node.kind]));
  const pairs = new Set<string>();

  for (const relation of familyRelation.values()) {
    for (const row of Rows.of(rows, relation)) {
      if ("kind" in row && "attribute" in row) {
        pairs.add(`${String(row.kind)} ${String(row.attribute)}`);
      }
    }
  }

  for (const row of Rows.of(rows, HtmlId)) {
    pairs.add(`${row.kind} ${row.attribute}`);
  }

  for (const row of Rows.of(rows, AttributeIdref)) {
    pairs.add(`${kindOf.get(row.node) ?? ""} ${row.attribute}`);
  }

  if (Rows.of(rows, arms["m:maction"]).length > 0) {
    pairs.add("m:maction actiontype");
  }

  return pairs;
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/fixtures.ts cut MathML positives",
  (it) => {
    it.effect("registers the 12 positives under distinct names", () =>
      Effect.sync(() => {
        assert.strictEqual(new Set(positives).size, positives.length);

        for (const name of positives) {
          assert.include(fixtureNames, name);
        }
      }),
    );

    for (const name of positives) {
      it.effect.skipIf(!tarballPresent)(
        `${name} materializes and readRows succeeds (skipped without the examples tarball)`,
        () =>
          Effect.gen(function* readsPositive() {
            const dir = yield* materialize(name);
            const result = yield* Effect.result(readRows(dir));

            if (Result.isFailure(result)) {
              assert.fail(`${name} was refused: ${result.failure.message}`);
            }
          }),
      );
    }
  },
);

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/fixtures.ts generated MathML positives",
  (it) => {
    it.effect("registers one fixture for each of the 18 groups under distinct names", () =>
      Effect.sync(() => {
        assert.deepStrictEqual(
          mathmlGroups.map((group) => group.name),
          [...generated],
        );
        assert.strictEqual(new Set(generated).size, generated.length);

        for (const name of generated) {
          assert.include(fixtureNames, name);
        }
      }),
    );

    for (const name of generated) {
      it.effect.skipIf(!tarballPresent)(
        `${name} materializes, readRows succeeds and its rows hold the kinds and pairs its blocks declare (skipped without the examples tarball)`,
        () =>
          Effect.gen(function* readsGroup() {
            const group = mathmlGroups.find((found) => found.name === name);

            if (group === undefined) {
              assert.fail(`mathmlGroups has no group ${name}`);
            }

            const dir = yield* materialize(name);
            const result = yield* Effect.result(readRows(dir));

            if (Result.isFailure(result)) {
              assert.fail(`${name} was refused: ${result.failure.message}`);
            }

            const kinds = new Set<string>(
              Rows.of(result.success.rows, Node).map((node) => node.kind),
            );
            const pairs = pairsOf(result.success.rows);

            for (const kind of declaredKinds(group)) {
              assert.isTrue(kinds.has(kind), `${name} holds no ${kind} node`);
            }

            for (const pair of declaredPairs(group)) {
              assert.isTrue(pairs.has(pair), `${name} holds no ${pair} row`);
            }
          }),
      );
    }
  },
);

/**
 * The 6 MathML negatives refused at import, before any guard runs, each with its rule: a closed
 * narrowing (`display`, `closure`), an attribute or element the model lacks
 * (`unmodeled-vocabulary`) and a required attribute.
 */
const importNegatives = [
  ["math-display-center", "attribute-lexical"],
  ["math-display-on-mi", "unmodeled-vocabulary"],
  ["math-maction-bare", "required-attribute"],
  ["math-unnamespaced", "unmodeled-vocabulary"],
  ["math-data-attribute", "unmodeled-vocabulary"],
  ["math-interval-closure", "attribute-lexical"],
] as const satisfies readonly (readonly [FixtureName, Rule])[];

/**
 * The 27 MathML negatives the guards refuse, each with its rule, in the order of spec 4.11's table,
 * then J6's five: `-unknown` by the exclusion row's wildcard guard, `-nested-math` and `-math` (a
 * formula inside a formula, decision 309's nested case) by the `math` ancestry ban, and
 * `-nested-interaction` and `-gap` by p6-mar-4's guard, which re-walks each annotation with the
 * formula's ancestry. The last two are that guard's end-to-end test through `itemRows`: p6-mar-4's
 * own tests hand-build rows.
 */
const guardNegatives = [
  ["math-mfrac-three", "union-count"],
  ["math-semantics-order", "ordering"],
  ["math-prescripts-twice", "union-count"],
  ["math-apply-binary-one", "union-count"],
  ["math-apply-unary-two", "union-count"],
  ["math-apply-selector-bare", "union-count"],
  ["math-partialdiff-one", "union-count"],
  ["math-qualifier-order", "ordering"],
  ["math-logbase-on-sin", "admission"],
  ["math-bvar-two-ci", "union-count"],
  ["math-bvar-two-degree", "union-count"],
  ["math-piecewise-two-otherwise", "union-count"],
  ["math-mscarries-last", "ordering"],
  ["math-maligngroup-placement", "admission"],
  ["math-maligngroup-first", "ordering"],
  ["math-maction-selection", "union-count"],
  ["math-mglyph-bare", "required-attribute"],
  ["math-condition-no-bvar", "union-count"],
  ["math-cn-rational-one", "attribute-lexical"],
  ["math-share-dangling", "document-key"],
  ["math-share-cycle", "document-key"],
  ["math-bind-no-bvar", "union-count"],
  ["math-annotation-xml-unknown", "wildcard-namespace"],
  ["math-annotation-xml-nested-math", "ancestry-ban"],
  ["math-annotation-xml-math", "ancestry-ban"],
  ["math-annotation-xml-nested-interaction", "ancestry-ban"],
  ["math-annotation-xml-gap", "ancestry-ban"],
] as const satisfies readonly (readonly [FixtureName, Rule])[];

/**
 * The commit negatives `readRows` refuses itself, with the rule it names: the guard fires before
 * the database can.
 */
const guardFirst = new Map<FixtureName, Rule>([["math-printed-variable", "union-count"]]);

/**
 * The rule `readRows` refuses a fixture under, or none when it reads.
 *
 * @param name - The fixture.
 * @returns The effect of reading it.
 */
const ruleOf = (name: FixtureName) =>
  Effect.gen(function* refusalRule() {
    const dir = yield* materialize(name);
    const result = yield* Effect.result(readRows(dir));

    if (Result.isSuccess(result)) {
      return Option.none<Rule>();
    }

    const { failure } = result;

    if (failure._tag === "PlatformError") {
      assert.fail(`${name} failed with the platform's error: ${failure.message}`);
    }

    return Option.some(ruleOfError(failure).rule);
  });

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/fixtures.ts MathML negatives",
  (it) => {
    it.effect("registers the 47 negatives under distinct names", () =>
      Effect.sync(() => {
        const names = [
          ...importNegatives.map(([name]) => name),
          ...guardNegatives.map(([name]) => name),
          ...mathmlCommitNegatives.map(([name]) => name),
        ];

        assert.strictEqual(importNegatives.length, 6);
        assert.strictEqual(guardNegatives.length, 27);
        assert.strictEqual(mathmlCommitNegatives.length, 14);
        assert.strictEqual(new Set(names).size, 47);

        for (const name of names) {
          assert.include(fixtureNames, name);
        }
      }),
    );

    for (const [name, rule] of [...importNegatives, ...guardNegatives]) {
      it.effect.skipIf(!tarballPresent)(
        `${name} is refused by readRows under ${rule} (skipped without the examples tarball)`,
        () =>
          Effect.gen(function* refusedUnder() {
            assert.deepStrictEqual(
              yield* ruleOf(name),
              Option.some(rule),
              `${name} was not refused under ${rule}`,
            );
          }),
      );
    }

    for (const [name, rule] of mathmlCommitNegatives) {
      const first = guardFirst.get(name);

      it.effect.skipIf(!tarballPresent)(
        first === undefined
          ? `${name} passes readRows, so the database refuses it under ${rule} (skipped without the examples tarball)`
          : `${name} is refused by readRows under ${first} before the database can refuse it under ${rule} (skipped without the examples tarball)`,
        () =>
          Effect.gen(function* passesRead() {
            assert.deepStrictEqual(
              yield* ruleOf(name),
              Option.fromNullishOr(first),
              `${name} read differently`,
            );
          }),
      );
    }
  },
);

/**
 * The nine J6 positives, with what each one's rows hold: `chain`, a path of node kinds from the
 * first kind down through `Edge` rows (each kind the child of the one before), and for the
 * annotation's foreign content `foreign`, the `local` name of a `ForeignElement` row and the kind
 * of its parent. `math-annotation-xml-kind` is p6-18's `annotationXmlBlock`, checked as the
 * generated groups are.
 */
const annotationPositives = [
  { chain: ["m:annotation-xml", "div"], name: "math-annotation-xml-html" },
  {
    chain: ["m:annotation-xml", "div", "qti-printed-variable"],
    name: "math-annotation-xml-printed-variable",
  },
  {
    chain: [
      "qti-custom-operator",
      "m:math",
      "m:semantics",
      "m:annotation-xml",
      "div",
      "qti-printed-variable",
    ],
    name: "math-custom-operator-printed-variable",
  },
  {
    chain: ["m:annotation-xml", "foreign"],
    foreign: ["qti-printed-variable", "m:annotation-xml"],
    name: "math-annotation-xml-qti-direct",
  },
  {
    chain: ["m:annotation-xml", "foreign", "foreign"],
    foreign: ["qti-prompt", "foreign"],
    name: "math-annotation-xml-qti-deep",
  },
  {
    chain: ["m:annotation-xml", "foreign"],
    foreign: ["qti-assessment-item", "m:annotation-xml"],
    name: "math-annotation-xml-qti-root",
  },
  {
    chain: ["m:annotation-xml", "m:semantics", "m:annotation"],
    name: "math-annotation-xml-semantics",
  },
] as const satisfies readonly {
  readonly chain: readonly string[];
  readonly foreign?: readonly [string, string];
  readonly name: FixtureName;
}[];

/**
 * The J6 positives that are not in {@link annotationPositives}: the foreign attribute and the kind
 * block.
 */
const otherAnnotationPositives = [
  "math-foreign-attribute",
  "math-annotation-xml-kind",
] as const satisfies readonly FixtureName[];

/**
 * Whether the rows hold a path of nodes whose kinds are `chain`, each the child of the one before.
 *
 * @param rows - The package's rows.
 * @param chain - The node kinds, outermost first.
 * @returns True when some `Edge` path has exactly those kinds.
 */
const holdsChain = (rows: Rows, chain: readonly string[]): boolean => {
  const edges = Rows.of(rows, Edge);
  const [first, ...rest] = chain;
  const below = (parents: ReadonlySet<string>, kinds: readonly string[]): boolean => {
    const [kind, ...others] = kinds;

    if (kind === undefined) {
      return true;
    }

    const children = new Set(
      edges
        .filter((edge) => parents.has(edge.parent) && edge.childKind === kind)
        .map((e) => e.child),
    );

    return children.size > 0 && below(children, others);
  };

  return below(
    new Set(Rows.of(rows, Node).flatMap((node) => (node.kind === first ? [node.id] : []))),
    rest,
  );
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/fixtures.ts J6 MathML positives",
  (it) => {
    it.effect("registers the nine under distinct names", () =>
      Effect.sync(() => {
        const names = [...annotationPositives.map(({ name }) => name), ...otherAnnotationPositives];

        assert.strictEqual(new Set(names).size, 9);
        assert.strictEqual(names.length, 9);

        for (const name of names) {
          assert.include(fixtureNames, name);
        }
      }),
    );

    for (const { chain, name, ...rest } of annotationPositives) {
      const foreign = "foreign" in rest ? rest.foreign : undefined;

      it.effect.skipIf(!tarballPresent)(
        `${name} is read, and its rows hold ${chain.join(" > ")} (skipped without the examples tarball)`,
        () =>
          Effect.gen(function* readsAnnotation() {
            const dir = yield* materialize(name);
            const result = yield* Effect.result(readRows(dir));

            if (Result.isFailure(result)) {
              assert.fail(`${name} was refused: ${result.failure.message}`);
            }

            const { rows } = result.success;

            assert.isTrue(holdsChain(rows, chain), `${name} holds no ${chain.join(" > ")} path`);

            if (foreign !== undefined) {
              const [local, parentKind] = foreign;

              assert.isTrue(
                Rows.of(rows, ForeignElement).some(
                  (element) => element.local === local && element.parentKind === parentKind,
                ),
                `${name} holds no foreign ${local} under ${parentKind}`,
              );
            }
          }),
      );
    }

    it.effect.skipIf(!tarballPresent)(
      "math-foreign-attribute is read, and its rows hold the xlink:href as a foreign attribute of m:mi (skipped without the examples tarball)",
      () =>
        Effect.gen(function* readsForeignAttribute() {
          const dir = yield* materialize("math-foreign-attribute");
          const result = yield* Effect.result(readRows(dir));

          if (Result.isFailure(result)) {
            assert.fail(`math-foreign-attribute was refused: ${result.failure.message}`);
          }

          assert.isTrue(
            Rows.of(result.success.rows, ForeignAttribute).some(
              (attribute) =>
                attribute.kind === "m:mi" &&
                attribute.local === "href" &&
                attribute.prefix === "xlink",
            ),
          );
        }),
    );

    it.effect.skipIf(!tarballPresent)(
      "math-annotation-xml-kind is read, and its rows hold the kinds and pairs annotationXmlBlock declares (skipped without the examples tarball)",
      () =>
        Effect.gen(function* readsKindBlock() {
          const group: MathmlGroup = {
            blocks: [annotationXmlBlock],
            name: "math-annotation-xml-kind",
            version: "3.0.0",
          };
          const dir = yield* materialize("math-annotation-xml-kind");
          const result = yield* Effect.result(readRows(dir));

          if (Result.isFailure(result)) {
            assert.fail(`math-annotation-xml-kind was refused: ${result.failure.message}`);
          }

          const kinds = new Set<string>(
            Rows.of(result.success.rows, Node).map((node) => node.kind),
          );
          const pairs = pairsOf(result.success.rows);

          for (const kind of declaredKinds(group)) {
            assert.isTrue(kinds.has(kind), `math-annotation-xml-kind holds no ${kind} node`);
          }

          for (const pair of declaredPairs(group)) {
            assert.isTrue(pairs.has(pair), `math-annotation-xml-kind holds no ${pair} row`);
          }
        }),
    );
  },
);
