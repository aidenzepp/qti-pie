import { NodeServices } from "@effect/platform-node";
import { assert, inject, layer } from "@effect/vitest";
import { Effect } from "effect";
import { ContentGuardRefusal } from "#qti/import/guards/content.ts";
import { readRows } from "#qti/import/package.ts";
import { previewPackage } from "#qti/import/preview.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import { materialize } from "#qti/test/fixtures.ts";

const fixtures = inject("fixtures");

layer(NodeServices.layer, { excludeTestServices: true })("previewPackage", (it) => {
  it.effect("counts what readRows reads, the rows and the relations that hold any", () =>
    Effect.gen(function* counts() {
      const { rows } = yield* readRows(fixtures.simple);
      const facts = [...rows.values()].map((list) => list.length);
      const preview = yield* previewPackage(fixtures.simple);

      assert.isAbove(preview.rows, 0);
      assert.strictEqual(
        preview.rows,
        facts.reduce((sum, length) => sum + length, 0),
      );
      assert.strictEqual(preview.relations, facts.filter((length) => length > 0).length);
    }),
  );

  it.effect("refuses a package a guard refuses as an ImportRefused naming the rule", () =>
    Effect.gen(function* refused() {
      const error = yield* Effect.flip(previewPackage(yield* materialize("quoted-q")));

      assert.instanceOf(error, ImportRefused);
      assert.strictEqual(error instanceof ImportRefused ? error.rule : undefined, "q-punctuation");
      assert.notInstanceOf(error, ContentGuardRefusal);
    }),
  );
});
