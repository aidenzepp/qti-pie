import { existsSync } from "node:fs";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { readEntries } from "#pantry/package/read.ts";
import { examplesTarball } from "#pantry/test/fixtures.ts";
import {
  materializeMathml,
  mathmlNegatives,
  mathmlPositives,
} from "#pantry/test/fixtures.mathml.ts";
import type { MathmlFixtureName } from "#pantry/test/fixtures.mathml.ts";
import { judge, verdictOf } from "#pantry/test/oracle.ts";
import { grammar, laws, shown } from "#pantry/test/probe.ts";

/**
 * Whether the examples tarball, which every fixture is cut from, is on this machine.
 */
const tarballPresent = existsSync(Effect.runSync(examplesTarball));

/**
 * Judge one materialized MathML fixture with the law oracle, as `oracle.test.ts` judges `simple`:
 * the files of the package directory `readEntries` reads, then `judge` over the composed grammar
 * and its tables.
 *
 * @param name - The fixture's name.
 * @returns The oracle's judgment of the package.
 */
const judgedFixture = Effect.fn("judgedFixture")(function* judgedFixture(name: MathmlFixtureName) {
  const dir = yield* materializeMathml(name);

  return yield* judge(yield* readEntries(dir), grammar, laws);
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "the law oracle's verdict on every MathML fixture (skipped without the examples tarball)",
  (judging) => {
    for (const { name } of mathmlPositives) {
      judging.effect.skipIf(!tarballPresent)(`${name} breaks no law`, () =>
        Effect.gen(function* positive() {
          const judgment = yield* judgedFixture(name);

          if (judgment._tag === "CodecRefusal") {
            assert.fail(`the codec refused ${name}: ${judgment.rule}, ${judgment.detail}`);
          }

          assert.deepStrictEqual(judgment.breaches, [], shown(judgment.breaches));
          assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" });
        }),
      );
    }

    for (const { law, name, rule } of mathmlNegatives) {
      judging.effect.skipIf(!tarballPresent)(`${name} is refused under ${law}, as ${rule}`, () =>
        Effect.gen(function* negative() {
          const judgment = yield* judgedFixture(name);

          if (law === "codec") {
            assert.strictEqual(judgment._tag, "CodecRefusal", name);
          } else if (judgment._tag === "Judged") {
            assert.include(
              judgment.breaches.map((breach) => breach.law),
              law,
              shown(judgment.breaches),
            );
          } else {
            assert.fail(`the codec refused ${name}: ${judgment.rule}, ${judgment.detail}`);
          }

          const predicted = verdictOf(judgment);

          assert.strictEqual<string>(predicted.verdict, "refused");
          assert.strictEqual<string | undefined>(
            predicted.verdict === "refused" ? predicted.rule : undefined,
            rule,
          );
        }),
      );
    }
  },
);
