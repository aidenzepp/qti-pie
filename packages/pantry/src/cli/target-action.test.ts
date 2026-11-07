/**
 * The action every command that writes a target reports (`#pantry/cli/args.ts`
 * `requireReplaceable`), held to the coordinator's ruling of 2026-11-07, P-9: existence decides.
 * A target that exists is replaced, an empty directory and a symlink among them, and one that does
 * not is created; anything with content needs `--yes`, an empty directory does not.
 *
 * Oracle: that ruling as a table (`expected`), exhausted over every kind of target a scratch folder
 * holds and both answers to `--yes`. `export` and `roundtrip` both take their dry-run's
 * `target_action` and `export_dir_action` from this one function.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter } from "effect";
import { requireReplaceable } from "#pantry/cli/args.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * What a target may be: nothing, an empty directory, a directory with an entry, a file, a symlink
 * to a directory, or a symlink to nothing.
 */
const CONTENTS = ["nothing", "empty", "something", "file", "symlink", "dangling"] as const;

/**
 * A target's kind.
 */
type Content = (typeof CONTENTS)[number];

/**
 * One case: what the target is, and whether the person said `--yes`.
 */
interface TargetCase {
  readonly content: Content;
  readonly yes: boolean;
}

/**
 * Draw a case.
 */
const targetCase: Gen<TargetCase> = (source) => ({
  content: source.draw(element(CONTENTS)),
  yes: source.draw(element([false, true])),
});

/**
 * The ruling: `create` where nothing is, `replace` where anything is, and a refusal for content
 * the person did not agree to replace.
 *
 * @param drawnCase - The case.
 * @returns The action, or the refusal's tag.
 */
const expected = ({ content, yes }: TargetCase): string => {
  if (content === "nothing") {
    return "create";
  }

  return content === "empty" || yes ? "replace" : "TargetNotEmpty";
};

/**
 * Make the case's target under a fresh folder.
 *
 * @param folder - The folder.
 * @param content - What the target is.
 * @returns The target's path.
 */
const targetIn = (folder: string, content: Content) =>
  Effect.gen(function* makeTarget() {
    const fs = yield* FileSystem.FileSystem;
    const target = `${folder}/target`;
    if (content === "empty" || content === "something") {
      yield* fs.makeDirectory(target);
    }

    if (content === "something") {
      yield* fs.writeFileString(`${target}/entry.txt`, "x");
    }

    if (content === "file") {
      yield* fs.writeFileString(target, "x");
    }

    if (content === "symlink") {
      yield* fs.makeDirectory(`${folder}/pointed`);
      yield* fs.symlink(`${folder}/pointed`, target);
    }

    if (content === "dangling") {
      yield* fs.symlink(`${folder}/absent`, target);
    }

    return target;
  });

describe("a written target's action", () => {
  it.effect(
    "is create where nothing is and replace where anything is, with --yes needed for content",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every kind of target (nothing, an empty directory, a directory with an entry, a file, a symlink to a directory, a dangling symlink) with and without --yes: 12 cases",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<string>(["create", "replace", "TargetNotEmpty"]),
            generator: targetCase,
            limit: CONTENTS.length * 2,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the coordinator's ruling P-9 as a table",
            },
            suite: "pantry/cli/target-action",
          },
          (drawnCase, c) =>
            Effect.gen(function* judgeTarget() {
              const folder = yield* scratchDirectory("target-action-");
              const target = yield* targetIn(folder, drawnCase.content);
              const got = yield* requireReplaceable(target, drawnCase.yes).pipe(
                Effect.catchTag("TargetNotEmpty", (refusal) => Effect.succeed(refusal._tag)),
              );
              c.note(got);

              assert.strictEqual(got, expected(drawnCase), Formatter.format(drawnCase));
            }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, CONTENTS.length * 2);
          }),
        ),
      ),
  );
});
