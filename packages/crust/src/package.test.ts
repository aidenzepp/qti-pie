import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Schema } from "effect";

const PackageJson = Schema.fromJsonString(
  Schema.Struct({ dependencies: Schema.Record(Schema.String, Schema.String) }),
);

layer(NodeServices.layer, { excludeTestServices: true })("crust package manifest", (it) => {
  it.effect("production dependencies are exactly effect and saxes", () =>
    Effect.gen(function* dependenciesArePinned() {
      const fileSystem = yield* FileSystem.FileSystem;
      const text = yield* fileSystem.readFileString(`${import.meta.dirname}/../package.json`);
      const manifest = yield* Schema.decodeUnknownEffect(PackageJson)(text);

      assert.deepEqual(Object.keys(manifest.dependencies).toSorted(), ["effect", "saxes"]);
    }),
  );
});
