import { existsSync } from "node:fs";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Result } from "effect";
import { readRows } from "#pantry/import/package.ts";
import { Rows } from "#pantry/import/tree.ts";
import { AttributeIdref } from "#pantry/schema/attributes.ts";
import { HtmlId } from "#pantry/schema/document.ts";
import { arms } from "#pantry/schema/mathml/arms.ts";
import { familyRelation } from "#pantry/schema/mathml/attributes.ts";
import { Node } from "#pantry/schema/node.ts";
import { examplesTarball, fixtureNames, materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { mathmlGroups } from "#pantry/test/mathml-blocks.ts";
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
