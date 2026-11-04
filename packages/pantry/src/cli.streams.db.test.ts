import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Exit, Layer } from "effect";
import { describe, inject } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { captureCli, packageCopy } from "#pantry/test/cli.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

const fixtures = inject("fixtures");

describe.skipIf(!hasLease)(
  "cli.streams.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("cli.ts streams on the lease", (it) => {
      it.effect("a debug roundtrip prints the report alone to stdout and its log to stderr", () =>
        Effect.gen(function* debugRoundtrip() {
          const copy = yield* packageCopy(fixtures.simple, "copy-streams-simple");
          const { exit, stderr, stdout } = yield* captureCli([
            "--log-level",
            "debug",
            "roundtrip",
            "--yes",
            copy,
          ]);

          assert.isTrue(Exit.isSuccess(exit), stderr);
          assert.strictEqual(
            stdout,
            renderReport(yield* comparePackage(copy, "work/export/copy-streams-simple")),
          );
          assert.match(stderr, /DEBUG/u);
        }),
      );
    });
  },
);
