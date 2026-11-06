import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import type { ResponseDeclaration } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { redact } from "#plate/render.ts";
import type { Responses } from "#plate/session/session.ts";
import { solution } from "#plate/solution.ts";
import { bg007Item } from "#plate/test/fixtures.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem, acceptForTest } from "#plate/validate/verdict.ts";

/**
 * BG007, a true-or-false Choice bound to the single identifier response `RESPONSE` whose correct
 * response is the choice `true`, by its path under the corpus root, which `open` takes as its
 * location.
 */
const bg007 = "QTI3_BPIG_Examples/items/BG007.xml";

/**
 * The single identifier value holding one identifier.
 *
 * @param identifier The identifier.
 * @returns The value holding it.
 */
const identifierValue = (identifier: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: identifier }],
});

/**
 * A multiple identifier response that declares no correct response, beside the hand-built
 * BG007's `RESPONSE`, which declares `true`.
 */
const undeclared: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "identifier",
  cardinality: "multiple",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "OTHER",
  mapping: Option.none(),
};

/**
 * Hand `solution` a redacted item, which its type refuses: the type test is the
 * `@ts-expect-error` below, which `tsc` fails on if the call ever type-checks. No test calls it.
 *
 * @returns What `solution` would make of it.
 */
const solutionOfRedacted = (): Responses =>
  // @ts-expect-error -- a `Redacted` is not `Accepted`: redact drops the correct responses, so only check's output gives a solution.
  solution(redact(acceptForTest(bg007Item)));

describe("solution", () => {
  it.effect(
    "gives BG007's correct choice, read from the corpus",
    () =>
      Effect.gen(function* bg007Solution() {
        const verdict = yield* open(bg007, yield* readCorpusFile(bg007));
        const accepted = Option.getOrElse(acceptedItem(verdict), () =>
          assert.fail(`${bg007} is ${verdict.verdict}, not accepted`),
        );

        assert.deepStrictEqual(solution(accepted), { RESPONSE: identifierValue("true") });
      }),
    { tags: ["corpus"] },
  );

  it("gives NULL of the declared type for a response that declares no correct response", () => {
    const accepted = acceptForTest({
      ...bg007Item,
      responses: new Map([...bg007Item.responses, [undeclared.identifier, undeclared]]),
    });

    assert.deepStrictEqual(solution(accepted), {
      OTHER: nullOf("identifier", "multiple"),
      RESPONSE: identifierValue("true"),
    });
  });

  it("is typed to refuse a redacted item", () => {
    assert.isFunction(solutionOfRedacted);
  });
});
