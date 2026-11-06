import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

import { kinds } from "#pantry/schema/kinds/mathml.ts";
import { arms, relations, rules } from "#pantry/schema/mathml/arms.ts";
import { Qti } from "#pantry/schema/qti.ts";

const pascal = (handle: string): string =>
  handle
    .slice(2)
    .split(/[-.]/u)
    .map((part) => (part[0] ?? "").toUpperCase() + part.slice(1))
    .join("");

const armed = kinds.filter((kind) => kind !== "m:cbytes");

describe("the MathML arms", () => {
  it("arm every MathML handle but m:cbytes", () => {
    assert.deepStrictEqual(Object.keys(arms).toSorted(), [...armed].toSorted());
    assert.strictEqual(Object.keys(arms).length, 193);
    assert.isFalse("m:cbytes" in arms);
  });

  it("names each relation Mathml and the PascalCase local name, uniquely", () => {
    const names = Object.entries(arms).map(([handle, arm]) => {
      assert.strictEqual(arm.name, `Mathml${pascal(handle)}`);

      return arm.name;
    });

    assert.strictEqual(new Set(names).size, names.length);
    assert.deepStrictEqual(Object.keys(relations).toSorted(), names.toSorted());
    assert.strictEqual(relations.MathmlAnnotationXml, arms["m:annotation-xml"]);
    assert.strictEqual(relations.MathmlSemanticsCi, arms["m:semantics.ci"]);
  });

  it("keeps each table name under 63 bytes and makes each arm one of Qti's relations", () => {
    const composed = new Map<string, unknown>(Object.entries(Qti.relations));
    for (const [name, arm] of Object.entries(relations)) {
      assert.isBelow(new TextEncoder().encode(name.toLowerCase()).length, 64);
      assert.strictEqual(composed.get(name), arm, name);
    }
  });

  it("gives m:maction its actiontype and every other arm its id alone", () => {
    for (const [handle, arm] of Object.entries(arms)) {
      const fields = Object.keys(arm.fields).toSorted();
      assert.deepStrictEqual(fields, handle === "m:maction" ? ["actiontype", "id"] : ["id"]);
    }
  });

  it.effect("builds as a probe schema, database-free", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() => schema("MathmlArmsProbe", relations, rules));
      assert.isDefined(built);
    }),
  );
});
