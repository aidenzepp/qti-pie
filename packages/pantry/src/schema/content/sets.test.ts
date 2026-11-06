import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";

import * as rosters from "#pantry/schema/content/rosters.ts";
import { HBLOCK, HFLOW, HINL, PHR, hostAdditions, setOf } from "#pantry/schema/content/sets.ts";

const names = (set: readonly string[]) => new Set(set);

describe("content sets", () => {
  it("holds the four HTML sets at their derived sizes", () => {
    assert.strictEqual(HFLOW.length, 54);
    assert.strictEqual(HINL.length, 28);
    assert.strictEqual(HBLOCK.length, 26);
    assert.strictEqual(PHR.length, 27);
  });

  it("splits flow into inline and block", () => {
    assert.isTrue(names(HINL).has("span"));
    assert.isFalse(names(HINL).has("div"));
    assert.deepStrictEqual(
      HFLOW.filter((name): boolean => !names(HINL).has(name)),
      [...HBLOCK],
    );
  });

  it("looks a set up by name", () => {
    assert.strictEqual(setOf("HFLOW"), HFLOW);
    assert.strictEqual(setOf("PHR"), PHR);
  });

  it("lists the QTI elements a host admits beyond its HTML set", () => {
    assert.isTrue(hostAdditions["qti-item-body"]?.includes("qti-rubric-block"));
    assert.isTrue(hostAdditions["p"]?.includes("qti-gap"));
    assert.isFalse(hostAdditions["p"]?.includes("qti-feedback-block"));
  });
});

describe("shared rosters", () => {
  it("names the five shapes", () => {
    assert.deepStrictEqual(rosters.Shape.handles, ["circle", "default", "ellipse", "poly", "rect"]);
  });

  it("holds the IDREF attributes", () => {
    assert.isTrue(rosters.IdrefAttribute.handles.includes("headers"));
    assert.isTrue(rosters.IdrefAttribute.handles.includes("xref"));
    assert.strictEqual(rosters.IdrefAttribute.handles.length, 11);
  });

  it("exports every roster as a schema member and no rules", () => {
    const values: readonly unknown[] = Object.values(rosters);
    const exported = values
      .flatMap((member) =>
        Predicate.hasProperty(member, "handles") &&
        Array.isArray(member.handles) &&
        Predicate.hasProperty(member, "name") &&
        Predicate.isString(member.name)
          ? [member.name]
          : [],
      )
      .toSorted((left, right) => left.localeCompare(right));
    const members = Object.keys(rosters.relations).toSorted((left, right) =>
      left.localeCompare(right),
    );

    assert.deepStrictEqual(exported, members);
    assert.includeMembers(members, [
      "Bound",
      "IdrefAttribute",
      "Orientation",
      "Shape",
      "ShowHide",
      "ToolShape",
      "YesNo",
    ]);
    assert.deepStrictEqual(rosters.rules, []);
  });
});
