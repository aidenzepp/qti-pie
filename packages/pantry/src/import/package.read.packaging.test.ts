import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { readRows } from "#pantry/import/package.ts";
import { Rows } from "#pantry/import/tree.ts";
import { UsageData } from "#pantry/schema/usage.ts";
import { materialize, materializePackage } from "#pantry/test/fixtures.ts";

layer(NodeServices.layer, { excludeTestServices: true })("import/package.ts readRows", (suite) => {
  suite.effect("refuses a usage-data file whose root is not QTI 3 as not QTI 3", () =>
    Effect.gen(function* publishedUsageData() {
      const refusal = yield* Effect.flip(readRows(yield* materializePackage("usageData")));
      assert.strictEqual(refusal._tag, "NotQti3");
    }),
  );

  suite.effect("reads a QTI 3 usage-data file into UsageData rows", () =>
    Effect.gen(function* usage3() {
      const { rows } = yield* readRows(yield* materialize("usage3"));
      assert.isAbove(Rows.of(rows, UsageData).length, 0);
    }),
  );

  suite.effect("leaves a modeled root under another resource type to the commit", () =>
    Effect.gen(function* modeledRootOtherType() {
      const { rows } = yield* readRows(yield* materialize("extmeta-item-root"));
      assert.isAbove(rows.size, 0);
    }),
  );
});
