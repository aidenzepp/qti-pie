import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { OutsideCodeSpace } from "#pantry/grammar/closed.ts";
import { resourceTypeOf, resourceTypes, rootKinds, rootOfType } from "#pantry/grammar/package.ts";
import type { ResourceTypeHandle } from "#pantry/grammar/package.ts";
import { RootKind, SchemaVersion } from "#pantry/schema/node.ts";
import type { SchemaVersionHandle } from "#pantry/schema/node.ts";
import { resourceTypes as seededTypes } from "#pantry/schema/seed/resource-types.ts";
import { rootOfType as seededRoots } from "#pantry/schema/seed/root-of-type.ts";

/**
 * Spell rows as sorted text, so two row lists compare as sets.
 *
 * @param rows - The rows, each with its fields' values.
 * @param fields - The fields to spell, in order.
 * @returns One line per row, the values joined by a space, sorted.
 */
const spelled = <Row extends object>(
  rows: readonly Row[],
  fields: readonly (keyof Row)[],
): readonly string[] => rows.map((row) => fields.map((field) => row[field]).join(" ")).toSorted();

describe("ResourceType", () => {
  it("holds each type the seed names once, 21 handles for its 39 rows", () => {
    assert.strictEqual(resourceTypes.length, 21);
    assert.strictEqual(new Set(resourceTypes).size, 21);
    assert.sameMembers([...resourceTypes], [...new Set(seededTypes.map(({ type }) => type))]);
  });
});

describe("ResourceTypeOf", () => {
  it.effect("reproduces the 39 seeded (version, type) rows", () =>
    Effect.gen(function* seededPairs() {
      const relation = yield* Effect.fromResult(resourceTypeOf(SchemaVersion.handles));

      assert.strictEqual(relation.rows.length, 39);
      assert.deepStrictEqual(
        spelled(relation.rows, ["version", "type"]),
        spelled(seededTypes, ["version", "type"]),
      );
    }),
  );

  it.effect("is a set of 42 one-bit cells, 14 bytes", () =>
    Effect.gen(function* pairSize() {
      const relation = yield* Effect.fromResult(resourceTypeOf(SchemaVersion.handles));

      assert.strictEqual(relation.cells, 42);
      assert.strictEqual(relation.width, 1);
      assert.strictEqual(relation.bytes, 14);
    }),
  );

  it.effect("keeps each LTI type under its own version", () =>
    Effect.gen(function* ltiVersions() {
      const relation = yield* Effect.fromResult(resourceTypeOf(SchemaVersion.handles));
      const holds = (version: SchemaVersionHandle, type: ResourceTypeHandle) =>
        Option.isSome(relation.lookup({ type, version }));

      assert.isTrue(holds("3.0.0", "imsbasiclti_xmlv1p3"));
      assert.isFalse(holds("3.0.1", "imsbasiclti_xmlv1p3"));
      assert.isFalse(holds("3.0.0", "imslti_xmlv1p1"));
      assert.isTrue(holds("3.0.1", "imslti_xmlv1p1"));
      assert.isFalse(holds("3.0.0", "imsltia_xmlv1p0"));
      assert.isTrue(holds("3.0.1", "imsltia_xmlv1p0"));
    }),
  );

  it.effect("refuses a version roster that lacks a stated version", () =>
    Effect.gen(function* missingVersion() {
      const failure = yield* Effect.flip(Effect.fromResult(resourceTypeOf(["3.0.0"])));

      assert.instanceOf(failure, OutsideCodeSpace);
      assert.include(failure.message, "ResourceTypeOf has a row whose version is 3.0.1");
    }),
  );
});

describe("RootOfType", () => {
  it.effect("reproduces the 9 seeded (type, root) rows", () =>
    Effect.gen(function* rootPairs() {
      const relation = yield* Effect.fromResult(rootOfType);

      assert.strictEqual(relation.rows.length, 9);
      assert.deepStrictEqual(
        spelled(relation.rows, ["type", "root"]),
        spelled(seededRoots, ["type", "root"]),
      );
    }),
  );

  it.effect("is 21 cells of 4 bits, one per type, 19 bytes", () =>
    Effect.gen(function* rootSize() {
      const relation = yield* Effect.fromResult(rootOfType);

      assert.strictEqual(relation.cells, 21);
      assert.strictEqual(relation.width, 4);
      assert.strictEqual(relation.bytes, 19);
    }),
  );

  it.effect("maps both template types to rptemplate, and a file type to nothing", () =>
    Effect.gen(function* rootLookup() {
      const relation = yield* Effect.fromResult(rootOfType);
      const rootOf = (type: ResourceTypeHandle) =>
        relation.lookup({ type }).pipe(Option.map(({ root }) => root));

      assert.deepStrictEqual(rootOf("imsqti_rptemplate_xmlv3p0"), Option.some("rptemplate"));
      assert.deepStrictEqual(rootOf("imsqti_resprocessing_xmlv3p0"), Option.some("rptemplate"));
      assert.deepStrictEqual(rootOf("webcontent"), Option.none());
    }),
  );

  it("keeps the RootKind roster's handles in its code order", () => {
    assert.deepStrictEqual([...rootKinds], [...RootKind.handles]);
  });
});
