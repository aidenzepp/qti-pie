import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Result } from "effect";
import { inject } from "vitest";
import { ContentGuardRefusal } from "#pantry/import/guards/content.ts";
import { readRows } from "#pantry/import/package.ts";
import { ruleOfError } from "#pantry/import/refusal.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import { fixtureNames, materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";

const fixtures = inject("fixtures");

/**
 * `readRows` of the package at `dir`, as a `Result`.
 */
const readResult = (dir: string) => Effect.result(readRows(dir));

/**
 * Fail the test unless `readRows` of the package at `dir` succeeds.
 */
const readAccepted = (dir: string, label: string) =>
  Effect.gen(function* readAcceptedPackage() {
    const result = yield* readResult(dir);

    if (Result.isFailure(result)) {
      assert.fail(`${label} was refused: ${result.failure.message}`);
    }
  });

/**
 * Fail the test unless `readRows` of the package at `dir` succeeds or fails with a refusal under
 * one of `rules`; a platform error fails it.
 */
const readAcceptedOrUnder = (dir: string, label: string, rules: readonly Rule[]) =>
  Effect.gen(function* readUnderRules() {
    const result = yield* readResult(dir);

    if (Result.isSuccess(result)) {
      return;
    }

    const { failure } = result;
    if (failure._tag === "PlatformError") {
      assert.fail(`${label} failed with the platform's error: ${failure.message}`);
    }

    assert.include(rules, ruleOfError(failure).rule, `${label}: ${failure.message}`);
  });

const fixture = (name: FixtureName) => materialize(name);

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/package.ts readRows runs the content guards",
  (suite) => {
    suite.effect("refuses quoted-q under q-punctuation", () =>
      Effect.gen(function* refusesQuotedQ() {
        const result = yield* readResult(yield* fixture("quoted-q"));

        if (Result.isSuccess(result)) {
          assert.fail("quoted-q was admitted");
        }

        const { failure } = result;
        assert.instanceOf(failure, ContentGuardRefusal);
        if (failure instanceof ContentGuardRefusal) {
          assert.strictEqual(failure.rule, "q-punctuation");
          assert.strictEqual(ruleOfError(failure).rule, "q-punctuation");
        }
      }),
    );

    suite.effect("admits simple", () => readAccepted(fixtures.simple, "simple"));

    const clean: readonly FixtureName[] = [
      "doctype",
      "latin1",
      "external",
      "utf16",
      "comment-in-element",
      "windows-1252",
      "padded-attributes",
      "padded-text",
      "padded-identifier-value",
      "sharedMedia",
      "end-attempt",
      ...fixtureNames.filter((name) => name.startsWith("cut-")),
    ];
    for (const name of clean) {
      suite.effect(`admits ${name}`, () =>
        Effect.gen(function* admitsClean() {
          yield* readAccepted(yield* fixture(name), name);
        }),
      );
    }

    suite.effect("keeps identifier-mismatch under lom-identifier", () =>
      Effect.gen(function* identifierMismatch() {
        yield* readAcceptedOrUnder(yield* fixture("identifier-mismatch"), "identifier-mismatch", [
          "lom-identifier",
        ]);
      }),
    );

    suite.effect("keeps title-mismatch under lom-title", () =>
      Effect.gen(function* titleMismatch() {
        yield* readAcceptedOrUnder(yield* fixture("title-mismatch"), "title-mismatch", [
          "lom-title",
        ]);
      }),
    );

    suite.effect("keeps lti under resource-type", () =>
      readAcceptedOrUnder(fixtures.lti, "lti", ["resource-type"]),
    );

    suite.effect("keeps CAT_Test01_Adaptive_EchoAdapt under not-qti3", () =>
      readAcceptedOrUnder(fixtures.CAT_Test01_Adaptive_EchoAdapt, "CAT_Test01_Adaptive_EchoAdapt", [
        "not-qti3",
      ]),
    );

    suite.effect("keeps sample_pci under not-qti3", () =>
      readAcceptedOrUnder(fixtures.sample_pci, "sample_pci", ["not-qti3"]),
    );

    const broken: readonly (readonly [FixtureName, readonly Rule[]])[] = [
      ["undeclared-response", ["binding-declared"]],
      ["choice-in-prompt", ["admission", "choice-parent"]],
      ["two-values-single", ["value-single"]],
      ["bad-identifier-value", ["value-lexical"]],
      ["choice-bounds", ["choice-bounds"]],
      ["body-empty", ["body-empty"]],
      ["stimulus-body-empty", ["body-empty"]],
      ["bad-template-uri", ["uri-syntax"]],
    ];
    for (const [name, rules] of broken) {
      suite.effect(`keeps ${name} under ${rules.join(" or ")}`, () =>
        Effect.gen(function* keepsBroken() {
          yield* readAcceptedOrUnder(yield* fixture(name), name, rules);
        }),
      );
    }
  },
);
