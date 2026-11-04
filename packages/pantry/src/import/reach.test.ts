import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import { reachOf, SectionRefCycle } from "#pantry/import/reach.ts";
import type { Holder, StructureDocument } from "#pantry/import/reach.ts";

const holder = (id: string, holderKind: Holder["holderKind"]): Holder => ({
  holder: id,
  holderKind,
  identifier: `id-${id}`,
});

const document = (
  name: string,
  holders: readonly Holder[],
  refs: readonly string[] = [],
): StructureDocument => ({
  document: name,
  holders,
  sectionRefs: refs.map((target, index) => ({ document: target, holder: `${name}-ref${index}` })),
});

const holdersOf = (reach: readonly { test: string; holder: string }[], test: string): string[] =>
  reach.filter((row) => row.test === test).map((row) => row.holder);

describe("reachOf", () => {
  it.effect("reaches a section document's holders and lists it once when two refs name it", () =>
    Effect.gen(function* twice() {
      const result = yield* reachOf({
        sections: [document("s", [holder("s1", "section"), holder("s2", "itemRef")])],
        tests: [document("t", [holder("t1", "part"), holder("t-ref0", "sectionRef")], ["s", "s"])],
      });
      assert.deepStrictEqual(holdersOf(result.reach, "t"), ["t1", "t-ref0", "s1", "s2"]);
      assert.deepStrictEqual(result.documents, [
        { document: "t", test: "t" },
        { document: "s", test: "t" },
      ]);
      assert.deepStrictEqual(result.reachedBy, [{ document: "s", test: "t" }]);
    }),
  );

  it.effect("reaches through a chain of section documents", () =>
    Effect.gen(function* chain() {
      const result = yield* reachOf({
        sections: [
          document("a", [holder("a1", "section")], ["b"]),
          document("b", [holder("b1", "itemRef")]),
        ],
        tests: [document("t", [holder("t1", "part")], ["a"])],
      });
      assert.deepStrictEqual(holdersOf(result.reach, "t"), ["t1", "a1", "b1"]);
      assert.deepStrictEqual(
        result.documents.map((row) => row.document),
        ["t", "a", "b"],
      );
    }),
  );

  it.effect("reaches a shared section document once per test, for each test", () =>
    Effect.gen(function* shared() {
      const result = yield* reachOf({
        sections: [document("s", [holder("s1", "itemRef")])],
        tests: [document("t1", [], ["s"]), document("t2", [], ["s"])],
      });
      assert.deepStrictEqual(holdersOf(result.reach, "t1"), ["s1"]);
      assert.deepStrictEqual(holdersOf(result.reach, "t2"), ["s1"]);
      assert.deepStrictEqual(result.reachedBy, [
        { document: "s", test: "t1" },
        { document: "s", test: "t2" },
      ]);
    }),
  );

  it.effect("gives a section document no test reaches no reach and no test", () =>
    Effect.gen(function* unreached() {
      const result = yield* reachOf({
        sections: [document("lonely", [holder("l1", "itemRef")])],
        tests: [document("t", [holder("t1", "part")])],
      });
      assert.deepStrictEqual(holdersOf(result.reach, "t"), ["t1"]);
      assert.isFalse(result.reach.some((row) => row.holder === "l1"));
      assert.deepStrictEqual(result.reachedBy, []);
    }),
  );

  it.effect("refuses a cycle of section refs, naming its documents", () =>
    Effect.gen(function* cycle() {
      const two = yield* Effect.exit(
        reachOf({
          sections: [document("a", [], ["b"]), document("b", [], ["a"])],
          tests: [document("t", [], ["a"])],
        }),
      );
      assert.isTrue(Exit.isFailure(two));

      const failed = yield* reachOf({
        sections: [document("a", [], ["b"]), document("b", [], ["a"])],
        tests: [],
      }).pipe(Effect.flip);
      assert.instanceOf(failed, SectionRefCycle);
      assert.strictEqual(failed._tag, "SectionRefCycle");
      assert.deepStrictEqual(failed.documents, ["a", "b"]);

      const self = yield* reachOf({ sections: [document("a", [], ["a"])], tests: [] }).pipe(
        Effect.flip,
      );
      assert.deepStrictEqual(self.documents, ["a"]);
    }),
  );
});
