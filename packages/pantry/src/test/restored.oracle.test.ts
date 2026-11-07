import { existsSync } from "node:fs";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { readPackage } from "#pantry/package/read.ts";
import { examplesTarball, materialize } from "#pantry/test/fixtures.ts";
import { judge, verdictOf } from "#pantry/test/oracle.ts";
import { grammar, laws, shown } from "#pantry/test/probe.ts";

/**
 * Whether the examples tarball, which every fixture is cut from, is on this machine.
 */
const tarballPresent = existsSync(Effect.runSync(examplesTarball));

/**
 * Judges the restored-check fixtures and the restored laws' cases with the law oracle. The
 * contrast for the first case, `xml:lang="en"` against a LOM `language` of `fr` breaking "Document
 * lang", is already pinned in `oracle.rv-i.test.ts`.
 */
layer(NodeServices.layer, { excludeTestServices: true })(
  "the law oracle's verdict on the restored fixtures (skipped without the examples tarball)",
  (judging) => {
    judging.effect.skipIf(!tarballPresent)(
      "lang-case-mismatch breaks no law: language tags compare without regard to case",
      () =>
        Effect.gen(function* langCaseMismatch() {
          const dir = yield* materialize("lang-case-mismatch");
          const judgment = yield* judge(yield* readPackage(dir), grammar, laws);

          if (judgment._tag === "CodecRefusal") {
            assert.fail(
              `the codec refused lang-case-mismatch: ${judgment.rule}, ${judgment.detail}`,
            );
          }

          assert.deepStrictEqual(judgment.breaches, [], shown(judgment.breaches));
          assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" });
        }),
    );
  },
);
