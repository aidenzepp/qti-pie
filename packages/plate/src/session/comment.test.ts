import { assert, describe, it } from "@effect/vitest";
import { Option, Result } from "effect";
import { resolveOverrides } from "#plate/emit/parts.ts";
import type { EmitState } from "#plate/payload.ts";
import { commentModule } from "#plate/session/comment.ts";
import type { CommentFacts } from "#plate/session/comment.ts";

/**
 * The facts of an item that allows comments and has kept one, the most a module could be given.
 */
const facts: CommentFacts = {
  allowed: true,
  finished: false,
  instance: "4c7e1a2b-9d3f-4e8a-b6c5-0f1e2d3c4b5a",
  kept: Option.some("A note"),
  locale: "en",
};

/**
 * The emit state the item render hands the module, with no part replaced.
 */
const state: EmitState = {
  assetBase: "",
  headingLevel: 2,
  locale: "en",
  parts: Result.getOrElse(resolveOverrides(), (failure) => assert.fail(failure.message)),
};

describe("commentModule", () => {
  it("[W0-BG] the stub module's answers: no part, the comment it was given, no report, not implemented", () => {
    assert.isFalse(commentModule.implemented);
    assert.deepStrictEqual(commentModule.part(facts, state), Result.succeed(Option.none()));
    assert.deepStrictEqual(
      commentModule.part({ ...facts, allowed: false, kept: Option.none() }, state),
      Result.succeed(Option.none()),
    );
    assert.deepStrictEqual(commentModule.report(Option.some("A note")), Option.none());
    assert.deepStrictEqual(commentModule.report(Option.none()), Option.none());

    for (const allowed of [true, false]) {
      for (const kept of [Option.none(), Option.some("Kept")]) {
        assert.deepStrictEqual(commentModule.keep(Option.some("Posted"), allowed, kept), kept);
        assert.deepStrictEqual(commentModule.keep(Option.none(), allowed, kept), kept);
      }
    }
  });
});
