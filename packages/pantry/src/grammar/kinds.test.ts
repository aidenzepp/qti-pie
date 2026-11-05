import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { array, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option, Result } from "effect";
import {
  fixedKinds,
  generate,
  isForeignKind,
  openClasses,
  resolution,
} from "#pantry/grammar/kinds.ts";
import type { Vocabulary } from "#pantry/grammar/kinds.ts";

/**
 * The search budget of every exploration here.
 */
const budget = {
  caseHang: Duration.minutes(1),
  concurrency: 1,
  coverage: noCoverage,
  kept: [],
  literal: Formatter.format,
  shrink: completeShrink,
  steerEvery: 16,
} as const;

/**
 * One drawn kind: its handle, its element's local name (empty for character data), and the parents
 * that admit it, under which its name resolves to it.
 */
interface DrawnKind {
  readonly handle: string;
  readonly local: string;
  readonly parents: readonly string[];
}

/**
 * Draw a toy vocabulary list: up to three vocabularies of up to three kinds each, local names drawn
 * from a three-letter alphabet so that names collide, each kind admitted under parents drawn from
 * the document node, the earlier kinds and one no vocabulary declares, attribute names that may
 * repeat across vocabularies or spell an open class, and interactions drawn from the kinds or from
 * outside them.
 */
const drawnList: Gen<{
  readonly attributes: readonly (readonly string[])[];
  readonly interactions: readonly string[];
  readonly kinds: readonly (readonly DrawnKind[])[];
}> = (source) => {
  let next = 0;
  const kinds: DrawnKind[][] = source
    .draw(
      array(
        (inner) =>
          inner.draw(
            array(
              (leaf) => {
                next += 1;
                const handle = `k${next}`;
                const local = leaf.draw(element(["a", "b", "c", ""] as const));
                const parents = ["document", "k1", "k2", "nowhere"].filter(
                  (above) => leaf.choose(0, above === "nowhere" ? 5 : 1) === 1,
                );

                return { handle, local, parents };
              },
              { max: 3, min: 0 },
            ),
          ),
        { max: 3, min: 1 },
      ),
    )
    .map((vocabulary) => [...vocabulary]);
  const twice = source.choose(0, 5) === 0;
  const attributes = kinds.map(() =>
    source.draw(
      array(element(["id", "class", "no-namespace", "title"] as const), { max: 2, min: 0 }),
    ),
  );
  const interactions = source.draw(
    array(element(["k1", "k2", "k3", "outside"] as const), { max: 2, min: 0 }),
  );

  return {
    attributes,
    interactions,
    kinds: twice && kinds[0] !== undefined ? [...kinds, kinds[0]] : kinds,
  };
};

/**
 * A toy vocabulary of plain element kinds, each named as its handle, with one attribute name.
 *
 * @param prefix - Its handles' prefix.
 * @param size - Its number of kinds.
 * @returns The vocabulary.
 */
const vocabulary = (prefix: string, size: number): Vocabulary => ({
  attributes: [`${prefix}-attribute`],
  kinds: Array.from({ length: size }, (_, at) => ({
    handle: `${prefix}${at}`,
    local: `${prefix}${at}`,
  })),
  namespace: "urn:toy",
});

describe("the kinds generator against a naive model", () => {
  it.effect(
    "refuses exactly what the model refuses, and otherwise codes, sets and resolves as the model does",
    (ctx) =>
      searched(
        ctx,
        explore(
          { ...budget, draw: drawn(drawnList), runs: 600, suite: "grammar/kinds/model" },
          (list) =>
            Effect.sync(() => {
              const vocabularies: readonly Vocabulary[] = list.kinds.map((kinds, at) => ({
                attributes: [...new Set(list.attributes[at])],
                kinds: kinds.map(({ handle, local }) => ({ handle, local })),
                namespace: "urn:toy",
              }));
              const all = list.kinds.flat();
              const handles = all.map(({ handle }) => handle);
              const elements = all.filter(({ local }) => local !== "");
              const names = [...openClasses, ...new Set(list.attributes.flat())];
              // The model: each reason a roster or relation has no constant.
              const reasons = new Set<string>();
              if (
                new Set(handles).size !== handles.length ||
                new Set(names).size !== names.length
              ) {
                reasons.add("RepeatedValue");
              }

              const named = elements.flatMap(({ local, parents }) =>
                parents.map((above) => `${local} ${above}`),
              );
              if (
                new Set(named).size !== named.length ||
                new Set(list.interactions).size !== list.interactions.length
              ) {
                reasons.add("KeyCollision");
              }

              const roster = new Set([...fixedKinds, ...handles]);
              if (
                elements.some(({ parents }) => parents.some((above) => !roster.has(above))) ||
                list.interactions.some((kind) => !roster.has(kind))
              ) {
                reasons.add("OutsideCodeSpace");
              }

              const result = Result.flatMap(
                generate({ interactions: list.interactions, layer: [], vocabularies }),
                (rosters) =>
                  resolution(
                    rosters,
                    all.flatMap(({ handle, parents }) =>
                      parents.map((parent) => ({ child: handle, parent })),
                    ),
                  ),
              );
              if (reasons.size > 0) {
                assert.include(
                  [...reasons],
                  Result.isFailure(result) ? result.failure._tag : "generated",
                );
              } else {
                assert.isTrue(
                  Result.isSuccess(result),
                  Result.isFailure(result) ? result.failure.message : "",
                );
                if (Result.isSuccess(result)) {
                  const kinds = result.success;
                  assert.deepStrictEqual(kinds.nodeKind.handles, [...fixedKinds, ...handles]);
                  assert.deepStrictEqual(kinds.attributeName.handles, names);
                  assert.deepStrictEqual(
                    kinds.isElement.rows.map(({ kind }) => kind),
                    [...fixedKinds.filter(isForeignKind), ...elements.map(({ handle }) => handle)],
                  );
                  for (const local of ["a", "b", "c", "d"]) {
                    for (const parent of ["document", ...handles]) {
                      const under = elements.find(
                        (kind) => kind.local === local && kind.parents.includes(parent),
                      );
                      assert.deepStrictEqual(
                        kinds.resolve("urn:toy", local, parent),
                        Option.map(Option.fromNullishOr(under), ({ handle }) => handle),
                        `${local} under ${parent}`,
                      );
                    }
                  }
                }
              }
            }),
        ),
      ),
  );

  it.effect("leaves every earlier code where it was when a vocabulary is appended", (ctx) =>
    searched(
      ctx,
      explore(
        {
          ...budget,
          draw: drawn((source) => [source.draw(int(0, 3)), source.draw(int(0, 3))] as const),
          runs: 100,
          suite: "grammar/kinds/append-only",
        },
        ([first, second]) =>
          Effect.sync(() => {
            const shorter = generate({
              interactions: [],
              layer: ["xsi:type"],
              vocabularies: [vocabulary("a", first)],
            });
            const longer = generate({
              interactions: [],
              layer: ["xsi:type"],
              vocabularies: [vocabulary("a", first), vocabulary("b", second)],
            });

            assert.isTrue(Result.isSuccess(shorter) && Result.isSuccess(longer));
            if (Result.isSuccess(shorter) && Result.isSuccess(longer)) {
              assert.deepStrictEqual(
                longer.success.nodeKind.handles.slice(0, shorter.success.nodeKind.handles.length),
                shorter.success.nodeKind.handles,
              );
              assert.deepStrictEqual(
                longer.success.attributeName.handles.slice(
                  0,
                  shorter.success.attributeName.handles.length,
                ),
                shorter.success.attributeName.handles,
              );
            }
          }),
      ),
    ),
  );
});
