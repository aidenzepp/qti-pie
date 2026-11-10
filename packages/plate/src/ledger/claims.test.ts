import { readdirSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { claimAreas, claims, joinClaims } from "#plate/ledger/claims.ts";

describe("the claims", () => {
  it("join one file per area under src/ledger/claims/, shared first, each area once", () => {
    const files = readdirSync(new URL("claims/", import.meta.url))
      .filter((file) => file.endsWith(".ts"))
      .map((file) => file.slice(0, -".ts".length));

    assert.deepStrictEqual(
      claimAreas.map((area) => area.area),
      ["shared", "m3f", "m4", "m5"],
    );
    assert.sameMembers(files, ["shared", "m3f", "m4", "m5"]);
  });

  it("are every area's claims in the areas' order, each row once, and hold I-19 from the shared file", () => {
    assert.deepStrictEqual(claims, joinClaims(claimAreas));
    assert.strictEqual(new Set(claims.map((claim) => claim.id)).size, claims.length);
    assert.deepStrictEqual(
      claimAreas.find((area) => area.area === "shared")?.claims.map((claim) => claim.id),
      ["I-19"],
    );
  });

  it("take a claim an area file adds without any other file changing: the join carries it", () => {
    const added = { id: "T-2", source: "a member-only source, for the test" };
    const joined = joinClaims([...claimAreas, { area: "m3f-test", claims: [added] }]);

    assert.include(joined, added);
    assert.deepStrictEqual(joined.slice(0, claims.length), claims);
  });
});
