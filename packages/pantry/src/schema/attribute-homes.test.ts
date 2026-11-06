import { assert, describe, it } from "@effect/vitest";

import { indexOf, readersFor, shared } from "#pantry/schema/attribute-homes.ts";
import { mathmlHomes } from "#pantry/schema/mathml/homes.ts";

const readers = readersFor(indexOf(new Map()));

describe("readersFor", () => {
  it("gives a MathML kind its own homes once each and no shared reader", () => {
    const homes = mathmlHomes["m:mo"];
    assert.isDefined(homes);

    const names = readers("m:mo").map(([name]) => name);

    assert.deepStrictEqual(
      names,
      homes.map(({ name }) => name),
    );
    assert.strictEqual(new Set(names).size, names.length);
    assert.include(names, "class");
  });

  it("still ends a non-MathML kind with the shared readers", () => {
    const names = readers("p").map(([name]) => name);
    const tail = shared.map(([name]) => name);

    assert.isAbove(tail.length, 0);
    assert.deepStrictEqual(names.slice(names.length - tail.length), tail);
  });
});
