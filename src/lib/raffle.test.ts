import { describe, expect, it } from "vitest";
import { hasExcludedRafflePattern } from "./raffle";

const ratings = (left: number[], right: number[]) => [
  ...left.map((stars) => ({ restaurantId: 1, stars })),
  ...right.map((stars) => ({ restaurantId: 2, stars })),
];

describe("hasExcludedRafflePattern", () => {
  it.each([
    [[5, 5], [1, 1]],
    [[1, 1], [5, 5]],
    [[5, 5], [2, 2]],
    [[2, 2], [5, 5]],
  ])("excluye perfiles extremos %j / %j", (left, right) => {
    expect(hasExcludedRafflePattern(ratings(left, right))).toBe(true);
  });

  it.each([
    [[5, 5], [3, 3]],
    [[5, 4], [1, 1]],
    [[5], [1]],
    [[5, 5], [1, 2]],
  ])("conserva perfiles que no coinciden exactamente %j / %j", (left, right) => {
    expect(hasExcludedRafflePattern(ratings(left, right))).toBe(false);
  });
});
