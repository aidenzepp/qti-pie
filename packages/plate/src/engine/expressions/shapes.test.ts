import { assert, describe, it } from "@effect/vitest";
import { areaHolds } from "#plate/engine/expressions/shapes.ts";

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

  it("default holds every point", () => {
    assert.isTrue(areaHolds.default([], 0, 0));
    assert.isTrue(areaHolds.default([], -1_000_000, 1_000_000));
    assert.isTrue(areaHolds.default([10, 20, 30, 40], 99, 99));
  });
});
