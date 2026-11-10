import { existsSync } from "node:fs";
import path from "node:path";
import { assert } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Result } from "effect";
import { playgroundCaches } from "#plate/dev/page.ts";
import { textOf } from "#plate/test/accessibility.ts";
import {
  Engine,
  Playground,
  WalkCorpus,
  eachEngine,
  playgroundLayer,
  refuseLoad,
  refusePort,
  reservedPorts,
  walkCorpusLayer,
  withPage,
} from "#plate/test/browsers.ts";
import { dial } from "#plate/test/dial.ts";
import { elementsOf } from "#plate/test/playground-page.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The walk corpus's three fixed probes, by path under its folder: the OD-14 (e) probe, the pattern
 * item and the ordered Extended Text.
 */
const probes = ["od14/od14-probe.xml", "pattern.xml", "ordered.xml"];

/**
 * Read the title of a page the playground answered, as a reader of its HTML would.
 *
 * @param html The page's HTML.
 * @returns The text of its `title` element, whitespace collapsed; empty when it has none.
 */
const titleOf = (html: string): string => {
  const title = elementsOf(parseHtml(html)).find((element) => element.tag === "title");

  return title === undefined ? "" : textOf(title);
};

/**
 * Read the tag of a result's failure.
 *
 * @param result A guard's result.
 * @returns The failure's `_tag`, or `undefined` when the result is a success.
 */
const failureTag = <A, E extends { readonly _tag: string }>(
  result: Result.Result<A, E>,
): string | undefined => (Result.isFailure(result) ? result.failure._tag : undefined);

eachEngine((it, name) => {
  it.effect("launches headless, and its browser reports a version", (context) =>
    Effect.gen(function* launches() {
      const engine = yield* Engine;

      assert.strictEqual(engine.name, name);
      assert.notStrictEqual(engine.version, "");
      yield* Effect.promise(() => context.annotate(`${name} ${engine.version}`));
    }),
  );

  it.effect(
    "in a JavaScript-off page, the playground over the corpus answers / with 200 and the listing's title",
    () =>
      withPage({ javaScriptEnabled: false }, (page) =>
        Effect.gen(function* listing() {
          const { origin } = yield* Playground;
          const response = yield* Effect.promise(() => page.goto(`${origin}/`));

          assert.isNotNull(response);

          const html = yield* Effect.promise(() => response.text());
          const title = yield* Effect.promise(() => page.title());

          assert.strictEqual(response.status(), 200);
          assert.notStrictEqual(title, "");
          assert.strictEqual(title, titleOf(html));
        }),
      ).pipe(Effect.provide(playgroundLayer({}))),
  );

  it.effect(
    "the playground binds a port the system chose, outside the reserved ones, and frees it when its scope closes",
    () =>
      Effect.gen(function* port() {
        const bound = yield* Effect.gen(function* open() {
          const playground = yield* Playground;

          return { dialled: yield* dial(playground.port), port: playground.port };
        }).pipe(Effect.provide(playgroundLayer({})));

        assert.isAbove(bound.port, 0);
        assert.isFalse(reservedPorts.some((reserved) => reserved === bound.port));
        assert.strictEqual(bound.dialled, "accepted");
        assert.strictEqual(yield* dial(bound.port), "refused");
      }),
  );

  it.layer(walkCorpusLayer)("the walk corpus", (walk) => {
    walk.effect(
      "holds the OD-14 (e) probe, the pattern item and the ordered item, and a playground over it lists them",
      () =>
        Effect.gen(function* written() {
          const { directory } = yield* WalkCorpus;
          const counts = yield* withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* listed() {
              const { origin } = yield* Playground;

              yield* Effect.promise(() => page.goto(`${origin}/`));

              return yield* Effect.all(
                probes.map((item) =>
                  Effect.promise(() => page.getByRole("link", { exact: true, name: item }).count()),
                ),
              );
            }),
          ).pipe(
            Effect.provide(
              playgroundLayer(
                {},
                Layer.merge(
                  playgroundCaches,
                  ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: directory })),
                ),
              ),
            ),
          );

          assert.deepStrictEqual(
            probes.filter((item) => !existsSync(path.join(directory, item))),
            [],
          );
          assert.deepStrictEqual(
            counts,
            probes.map(() => 1),
          );
        }),
    );
  });

  it("refuseLoad admits a load under the cap and refuses one at it", () => {
    const admitted = refuseLoad(59.99);

    assert.strictEqual(Result.isSuccess(admitted) ? admitted.success : undefined, 59.99);
    assert.strictEqual(failureTag(refuseLoad(60)), "LoadTooHigh");
  });

  it("refusePort refuses every reserved port and admits 49152", () => {
    const admitted = refusePort(49_152);

    assert.deepStrictEqual(
      reservedPorts.map((reserved) => failureTag(refusePort(reserved))),
      reservedPorts.map(() => "ReservedPort"),
    );
    assert.strictEqual(Result.isSuccess(admitted) ? admitted.success : undefined, 49_152);
  });
});
