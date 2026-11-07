import { assert, describe, it } from "@effect/vitest";
import { areaHolds } from "#plate/engine/expressions/shapes.ts";

/**
 * Give 2 to a whole power as a float, by doubling: exact for every power up to 1023.
 *
 * @param power The power.
 * @returns 2 to that power.
 */
const twoTo = (power: number): number => {
  let value = 1;
  for (let doubling = 0; doubling < power; doubling += 1) {
    value *= 2;
  }

  return value;
};

describe("areaHolds", () => {
  it("rect holds a point inside, and not one outside", () => {
    assert.isTrue(areaHolds.rect([10, 20, 30, 40], 20, 30));
    assert.isFalse(areaHolds.rect([10, 20, 30, 40], 5, 30));
    assert.isFalse(areaHolds.rect([10, 20, 30, 40], 20, 41));
  });

  it("rect holds a point on its edges and corners (reading 52), its corners in either order", () => {
    assert.isTrue(areaHolds.rect([10, 20, 30, 40], 10, 30));
    assert.isTrue(areaHolds.rect([10, 20, 30, 40], 20, 40));
    assert.isTrue(areaHolds.rect([10, 20, 30, 40], 30, 40));
    assert.isTrue(areaHolds.rect([30, 40, 10, 20], 10, 20));
  });

  it("circle holds a point inside, and not one outside", () => {
    assert.isTrue(areaHolds.circle([50, 50, 10], 55, 55));
    assert.isFalse(areaHolds.circle([50, 50, 10], 61, 50));
  });

  it("circle holds a point on its boundary (reading 52)", () => {
    assert.isTrue(areaHolds.circle([50, 50, 10], 60, 50));
    assert.isTrue(areaHolds.circle([50, 50, 10], 50, 40));
  });

  it("ellipse holds a point inside, and not one outside", () => {
    assert.isTrue(areaHolds.ellipse([50, 50, 20, 10], 60, 52));
    assert.isFalse(areaHolds.ellipse([50, 50, 20, 10], 50, 61));
    assert.isFalse(areaHolds.ellipse([50, 50, 20, 10], 71, 50));
  });

  it("ellipse holds a point on its boundary (reading 52)", () => {
    assert.isTrue(areaHolds.ellipse([50, 50, 20, 10], 70, 50));
    assert.isTrue(areaHolds.ellipse([50, 50, 20, 10], 50, 60));
  });

  it("[I-9a] ellipse holds a 5-12-13 point on its boundary (reading 52), and not its neighbours outside", () => {
    assert.isTrue(areaHolds.ellipse([100, 100, 13, 26], 105, 124));
    assert.isTrue(areaHolds.ellipse([100, 100, 13, 26], 95, 76));
    assert.isFalse(areaHolds.ellipse([100, 100, 13, 26], 105, 125));
    assert.isFalse(areaHolds.ellipse([100, 100, 13, 26], 106, 124));
  });

  it("[I-9a] ellipse and circle of radius 13 at 300,300 hold the boundary point 312,305 (reading 52)", () => {
    assert.isTrue(areaHolds.ellipse([300, 300, 13, 13], 312, 305));
    assert.isTrue(areaHolds.ellipse([300, 300, 13, 13], 288, 295));
    assert.isFalse(areaHolds.ellipse([300, 300, 13, 13], 313, 305));
    assert.isFalse(areaHolds.ellipse([300, 300, 13, 13], 312, 306));
    assert.isTrue(areaHolds.circle([300, 300, 13], 312, 305));
    assert.isTrue(areaHolds.circle([300, 300, 13], 288, 295));
    assert.isFalse(areaHolds.circle([300, 300, 13], 313, 305));
  });

  it("circle and ellipse hold boundary points at fractional coordinates whose squares are exact", () => {
    assert.isTrue(areaHolds.circle([0.5, 0.5, 0.25], 0.75, 0.5));
    assert.isTrue(areaHolds.ellipse([0.5, 0.5, 0.25, 0.125], 0.5, 0.625));
  });

  it("poly holds a point inside, and not one outside", () => {
    assert.isTrue(areaHolds.poly([0, 0, 10, 0, 0, 10], 2, 2));
    assert.isFalse(areaHolds.poly([0, 0, 10, 0, 0, 10], 6, 6));
  });

  it("poly holds a point on an edge or a vertex (reading 52)", () => {
    assert.isTrue(areaHolds.poly([0, 0, 10, 0, 0, 10], 5, 5));
    assert.isTrue(areaHolds.poly([0, 0, 10, 0, 0, 10], 5, 0));
    assert.isTrue(areaHolds.poly([0, 0, 10, 0, 0, 10], 10, 0));
  });

  it("[I-9a] ellipse does not hold a point far outside a huge ellipse, and holds its boundary and centre (reading 52)", () => {
    assert.isFalse(areaHolds.ellipse([0, 0, 1e78, 1e78], 1e80, 0));
    assert.isFalse(areaHolds.ellipse([0, 0, 1e60, 1e100], 0, 2e100));
    assert.isTrue(areaHolds.ellipse([0, 0, 1e78, 1e78], 1e78, 0));
    assert.isTrue(areaHolds.ellipse([0, 0, 1e60, 1e100], 0, 1e100));
    assert.isTrue(areaHolds.ellipse([0, 0, 1e78, 1e78], 0, 0));
  });

  it("[I-9a] circle does not hold a point far outside a huge circle, and holds its boundary and centre (reading 52)", () => {
    assert.isFalse(areaHolds.circle([0, 0, 1e155], 1e160, 0));
    assert.isTrue(areaHolds.circle([0, 0, 1e155], 1e155, 0));
    assert.isTrue(areaHolds.circle([0, 0, 1e155], 0, 1e155));
    assert.isTrue(areaHolds.circle([0, 0, 1e155], 0, 0));
  });

  it("[I-9a] poly does not hold a point far outside a huge triangle, and holds a point inside or on an edge (reading 52)", () => {
    const triangle = [0, 0, 1e160, 1e160, 1e160, 0];

    assert.isFalse(areaHolds.poly(triangle, 2e160, 5e159));
    assert.isFalse(areaHolds.poly(triangle, 1e200, 5e159));
    assert.isTrue(areaHolds.poly(triangle, 9e159, 1e159));
    assert.isTrue(areaHolds.poly(triangle, 5e159, 5e159));
  });

  it("[I-9a] circle and ellipse at 2^600 hold a 5-12-13 point on the boundary, and not the next float outside it (reading 52)", () => {
    const scale = twoTo(600);
    // The float just above 5 · 2^600 = 1.25 · 2^602, whose last place is 2^550.
    const above = 5 * scale + twoTo(550);

    assert.isTrue(areaHolds.circle([0, 0, 13 * scale], 12 * scale, 5 * scale));
    assert.isFalse(areaHolds.circle([0, 0, 13 * scale], 12 * scale, above));
    assert.isTrue(areaHolds.ellipse([0, 0, 13 * scale, 13 * scale], 12 * scale, 5 * scale));
    assert.isFalse(areaHolds.ellipse([0, 0, 13 * scale, 13 * scale], 12 * scale, above));
  });

  it("circle, ellipse and poly hold no point when a number is not finite, which no reader gives", () => {
    assert.isFalse(areaHolds.circle([0, 0, Number.POSITIVE_INFINITY], 1, 1));
    assert.isFalse(areaHolds.ellipse([0, 0, 10, 10], Number.NaN, 0));
    assert.isFalse(areaHolds.poly([0, 0, 10, 0, 0, 10], 1, Number.NEGATIVE_INFINITY));
  });

  it("default holds every point", () => {
    assert.isTrue(areaHolds.default([], 0, 0));
    assert.isTrue(areaHolds.default([], -1_000_000, 1_000_000));
    assert.isTrue(areaHolds.default([10, 20, 30, 40], 99, 99));
  });
});
